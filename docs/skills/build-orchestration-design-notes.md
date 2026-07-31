# Build Orchestration — design notes

Companion to `build-orchestration.md` (the skill-source spec). That doc says *what*
the skill is; this one holds *why* the calls were made and what's still open.

## Why these calls (rationale)

- **Skill, not a doc.** The orchestration is a *procedure* that self-triggers on
  its `description`, and loads only when a build session starts (a fraction of
  sessions) rather than sitting in `CLAUDE.md`. The manager *is* the main session,
  so its instructions belong in a skill; the workers need isolation and scoped
  tools, so they are subagents. Skill for the manager, agents for the workers.
- **Never `context: fork` this skill.** `context: fork` would run the skill (the
  manager) itself as a subagent, contradicting "the manager IS the main session".
  Keep build-orchestration non-forked; the main session spawns workers via the
  `Agent` tool.
- **Build requires a solid plan; it does not invent one.** Too thin to build from →
  stop and send the user to `plan-impl`. Planning stays in `plan-product`/`plan-impl`,
  out of the build loop.
- **Eight atomic critics, one axis each** — not one broad `code-reviewer`. Atomic
  single-axis designs compose cheaply later (merge into a bundle, or spin a new
  multi-aspect agent); splitting a bundle back into clean axes is a rewrite.
  Correctness was the biggest v1 hole: the only defence against a logic bug was the
  test agents; nothing read the merged code hunting the edge case the tests never
  encoded.
- **Advisers = critic + fix direction; the skill spawns them instead of the critics.**
  When a critic surfaces a problem the manager has no fix for, its only move is to
  dispatch an `implementer` **blind** (options via `alternatives-explorer` are reachable
  only reactively, behind the escalation ladder). So each axis gets a one-stage
  **adviser**: its critic's review *plus* a scoped in-axis fix direction, produced in the
  same spawn — the reviewer already holds the most context on the fix, so adding it is
  near-free and skips a cold second spawn. A **parallel family, not a reversal** of the
  critics' no-suggest clause: a human reading a critique wants the problem unbiased by a
  pre-committed fix; the manager-agent wants the direction — same finding, different
  consumer, two agents. All 8 axes, else the manager invents fixes on the uncovered one.
  The `*-critic` twins stay for interactive/human sessions. Scoping guard: an adviser
  gives in-axis directions only; anything cross-axis → `decide` (to the user), never
  straight to an implementer. Built 2026-07-31; status in risks "Adviser family".
- **Only `security` + `design` gate the spec pre-build.** Their drafts are written
  for idea targets ("either an idea … or an implementation"). The other axes are
  code-only ("you receive an implementation"), so they cannot review a spec — an
  earlier note that `correctness` could gate the spec was wrong and was dropped.
- **`debugger` is a standing agent.** The `systematic-debugging` skill owns
  root-cause discipline, but an isolated agent keeps diagnosis off the manager's
  context when the loop stalls, and it is the teeth of the escalation ladder.
- **`mcdc-tester` stays optional.** MC/DC earns its combinatorial test cost only on
  decision-dense units (auth rules, pricing, validation, state machines). Caveat:
  most stacks cannot *measure* MC/DC coverage out of the box, so the agent designs
  cases by analysing conditions and states where it cannot verify the number.
- **Logs live in top-level `build-orchestration/`, not `docs/`.** `docs/` is for
  planning; `build-log/` (committed) + `prompt-log/` (gitignored) are runtime logs,
  parented under their source rather than a generic `logs/` another tool would claim.
  `.agent-scope/` is jail staging, not a log.

## Tune after a real run

- **Escalation-ladder strike count = 2** (Lever 2, in the skill). Tune after a run —
  too low wastes a diagnosis spawn on a typo, too high lets the thrash back in.
- **whitebox-tester has no search tools** (`Read, Write, Edit, Bash`). Re-add `Grep`
  only if a run shows it needing to search within a large implementation.
- **Worker constraints stay in the manager prompt.** The two Lever-1 spawning rules
  (no test files to an implementer; no visibility widening for testing) stay
  manager-side, not in the `implementer` def: the worktree excludes the tests
  (authoring §13), so with no suite in the tree both rules reduce to ordinary
  practice for the agent, and the manager is the party that stages the tree. The
  tester half is redundant anyway — the `blackbox`/`whitebox`/`mcdc` defs forbid
  modifying source.

## Bash-agent isolation — merge gate + git fence

Built: `.claude/scripts/agent-worktree.sh` (`add|audit|merge|remove|start|finalize`) plus the
git-fence hooks below. This section holds the decisions; the script is the mechanism, and the
manager drives isolation only through its subcommands. Cross-refs: authoring §13, agent
frontmatter.

- **One gate for every Bash agent.** `implementer`, `whitebox`, `mcdc`, and `debugger` all
  carry Bash, so none can be path-jailed (§12); all four route through one worktree lifecycle.
  `blackbox` (no Bash) stays path-jailed instead. Shapes differ — the implementer's checkout
  prunes the tests, the others are full — but the crossing rule is identical: nothing reaches
  the branch except an in-scope `merge`.
- **The gate is inherent, not added.** The agent runs no git and worktrees never auto-sync, so
  its edits sit uncommitted in the worktree and reach the branch only when the manager merges.
  No merge happens behind the manager's back; `audit` refuses any out-of-scope path before
  anything crosses.
- **Integrate by real `git merge`, not `git apply`.** The audit already refused out-of-scope
  paths, so the branch is wholly in-scope and branch-merge's all-or-nothing has nothing bad to
  admit. A real merge integrates off the true merge-base: concurrent non-overlapping edits to a
  path auto-merge, and a real conflict leaves standard markers plus an unmerged index in main
  that blocks further work until resolved. Patch-apply faked a per-file ancestor from the
  patch's blob ids — weaker exactly where concurrency bites (new shared files have no ancestor;
  its half-applied state didn't block the next merge). Pruned test dirs merge safely:
  sparse-checkout sets skip-worktree, and git won't stage a deletion for an absent
  skip-worktree file, so merging never removes tests from main.
- **Scaffold commits, collapsed at finalize.** A real merge needs commits to compose (unit B
  merges onto A only if A is a commit, giving a true merge-base), so each `merge` commits its
  unit — but those commits must not become the branch's history. `start` stamps the session's
  base commit; `finalize` runs `reset --mixed <stamp>`, dropping every scaffold commit and
  leaving the whole integrated result as uncommitted changes for one deliberate pass through the
  `git-commit` skill. The reset refuses unless the stamp is an ancestor of HEAD, so it can only
  drop commits made this session — never pre-session or pushed history. Consequence: per-unit
  commit messages are disposable (`build: <unit>`); only the finalize commit meets the
  `git-commit` standard. This reconciles correct base-drift merging (needs commits) with
  "nothing lands in history until the user's final check."
- **Git fence is a hook, not a prompt line.** A prompt rule can't hold a Bash-carrying agent; a
  `PreToolUse`/`Bash` hook can. Two variants, wired per agent frontmatter:
  - `no-git-jail.sh` — deny-all, for agents that never need git: `implementer`,
    `whitebox-tester`, `mcdc-tester`.
  - `git-readonly-jail.sh` — allowlist of read-only subcommands (fail-closed), for `debugger`:
    it may inspect history (log/blame/show/diff) but not mutate the tree. Dual-mode names
    (config, tag, branch, stash, reflog) are denied — the top subcommand can't prove read-only.
  Both best-effort: indirect calls (`$(…)`, a wrapper) evade them, the same Bash seam as
  everywhere. `blackbox-tester` carries no Bash, so needs none.
- **Hard-fail, then push back — never lose work.** A scope-refused `merge` (the audit fires
  before any commit) leaves the worktree untouched; the edits stay there. The manager does not
  auto-fix: it `SendMessage`s the violation (exact out-of-scope paths) back to the same worker
  to relocate into its unit, re-audits, then merges — the escalation ladder's strike-1, at most
  twice, then discard the worktree and re-spawn or escalate. Rationale: the manager blindly
  restoring a path can break in-scope code that referenced it; the worker owns the relocation.

## Still open

- **Relationship to `verify-fanout`.** Kept separate for now: build uses the inline
  adviser agents; `verify-fanout` stays its own planning-time
  external-verification path. Whether the manager can *offer* `verify-fanout` inside
  a build session depends on how that workflow lands. Revisit once it is built.
