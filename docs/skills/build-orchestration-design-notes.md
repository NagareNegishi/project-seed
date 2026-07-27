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

## Still open

- **Jail asymmetry.** `blackbox-tester` frontmatter carries the `PreToolUse` path-jail
  hook; `whitebox-tester` does not, though §12 treats both as confined. Confirm intended.
- **Relationship to `verify-fanout`.** Kept separate for now: build uses the inline
  `researcher`/critic agents; `verify-fanout` stays its own planning-time
  external-verification path. Whether the manager can *offer* `verify-fanout` inside
  a build session depends on how that workflow lands. Revisit once it is built.
