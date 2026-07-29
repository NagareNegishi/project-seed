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

Built: `.claude/scripts/agent-worktree.sh` (`add|audit|merge|remove`) plus the git-fence
hooks below. `merge` refuses whenever `audit` reports an out-of-scope path, so a
violation cannot cross even if the manager forgets to look. Cross-refs: authoring §13,
agent frontmatter. The manager drives isolation only through these subcommands; the raw
`git -C <wt> …` commands in the bullets below document what each subcommand does
internally and serve as a manual fallback, not a second path to run by hand.

- **One gate for every Bash agent.** `implementer`, `whitebox`, `mcdc`, and `debugger`
  all carry Bash, so none can be path-jailed (§12); all four route through this one
  worktree lifecycle instead of a second mechanism. Shapes differ — the implementer's
  checkout prunes the tests, the others are full — but the crossing rule is identical:
  nothing reaches the branch except an in-scope `merge`. The Bash testers moved here off
  the old `.agent-scope` snapshot; `blackbox` (no Bash) stays path-jailed.
- **The gate is inherent, not added.** The agent runs no git and worktrees never
  auto-sync, so its edits sit uncommitted in the worktree and reach the branch only
  when the manager moves them. No merge happens behind the manager's back.
- **Inspect before anything crosses.** The main checkout's `git status` shows nothing
  (dirty state is per-tree). The manager reads the worktree: `git -C <wt> add -A`,
  then `git -C <wt> status --porcelain` (the definitive changed-path list — this *is*
  the scope audit) and `git -C <wt> diff --cached` for content.
- **Transfer by patch, not branch-merge.** Bring over only in-scope paths:
  `git -C <wt> diff --cached -- <permitted…> | git apply --index` in main. Branch-merge
  is all-or-nothing — a scope violation is committed before it can be reverted; a
  path-filtered patch lets the manager pick. "Push back" a violation = drop it from the
  patch, or `git -C <wt> restore --staged --worktree <bad-path>` at the source.
- **Git fence is a hook, not a prompt line.** A prompt rule can't hold a Bash-carrying
  agent; a `PreToolUse`/`Bash` hook can. Two variants, wired per agent frontmatter:
  - `no-git-jail.sh` — deny-all, for agents that never need git: `implementer`,
    `whitebox-tester`, `mcdc-tester`.
  - `git-readonly-jail.sh` — allowlist of read-only subcommands (fail-closed), for
    `debugger`: it may inspect history (log/blame/show/diff) but not mutate the tree.
    Dual-mode names (config, tag, branch, stash, reflog) are denied — the top
    subcommand can't prove the call is read-only.
  Both best-effort: indirect calls (`$(…)`, a wrapper) evade them, the same Bash seam
  as everywhere. `blackbox-tester` carries no Bash, so needs none.
- **Hard-fail, then push back — never lose work.** A failed `merge` leaves the
  worktree untouched; the edits stay there. The manager does not auto-fix: it
  `SendMessage`s the violation (exact out-of-scope paths) back to the same worker
  to relocate into its unit, re-audits, then merges — the escalation ladder's strike-1,
  at most twice, then discard the worktree and re-spawn or escalate. Manager-side
  `git -C <wt> restore --staged --worktree <path>` is a fallback only for a trivial
  stray not worth round-tripping. Rationale: the manager blindly restoring a path can
  break in-scope code that referenced it; the worker owns the relocation.

## Still open

- **Relationship to `verify-fanout`.** Kept separate for now: build uses the inline
  `researcher`/critic agents; `verify-fanout` stays its own planning-time
  external-verification path. Whether the manager can *offer* `verify-fanout` inside
  a build session depends on how that workflow lands. Revisit once it is built.
