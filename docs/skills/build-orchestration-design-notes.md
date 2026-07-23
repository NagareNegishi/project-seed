# Build Orchestration — design notes & next steps

Companion to `build-orchestration.md` (the skill-source spec). That doc says *what*
to build; this one holds *why* the calls were made, what's still open, and where
the next session picks up. All v2 design decisions are settled — nothing here
blocks the wiring below.

## Next session — start here

A v1 SKILL.md already exists at `.claude/skills/build-orchestration/SKILL.md`. The
job is to re-wire it to the v2 spec in `build-orchestration.md`:

- **Review layer**: replace v1's `security`+`design` pair with the eight-critic
  roster, spawned *by manager allocation* (not all, always), and capture the
  allocation in `docs/prompt-log/allocation.md`.
- **Pre-build gate**: add `security-critic` + `design-critic` over the unit *spec*,
  allocated, parallel with `blackbox-tester`, before implementers build.
- **Spawning rules**: add Lever 1's two rules (fix units exclude test files; no
  visibility widening for test convenience).
- **Escalation**: replace the v1 step-2 thrash loop with the Lever 2 ladder +
  `debugger` (strike count is a "once or twice" placeholder — tune after a run).
- **Optional slots**: add the `mcdc-tester` slot; wire `change-discipline-critic`
  as an on-demand allocated critic (spawned on diff-smell, not always-on).
- **Prerequisites**: refresh for the full promoted roster.

Follow `new-skills.md`: directive voice, stack-agnostic `<placeholder>` markers, one
section at a time. Then promote the required agents (user-sign-off only), exercise
the skill on a real session, and record what the flow gets wrong.

## Why these calls (rationale)

- **Skill, not a doc.** The orchestration is a *procedure* that self-triggers on
  its `description`, and loads only when a build session starts (a fraction of
  sessions) rather than sitting in `CLAUDE.md`. The manager *is* the main session,
  so its instructions belong in a skill; the workers need isolation and scoped
  tools, so they are subagents. Skill for the manager, agents for the workers.
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

## Still open

- **Escalation-ladder strike count.** How many failed implementer attempts before
  the manager must stop and spawn `debugger`. One or two is the starting guess; tune
  it after a real run — too low wastes a diagnosis spawn on a typo, too high lets
  the thrash back in.
- **Relationship to `verify-fanout`.** Kept separate for now: build uses the inline
  `researcher`/critic agents; `verify-fanout` stays its own planning-time
  external-verification path. Whether the manager can *offer* `verify-fanout` inside
  a build session depends on how that workflow lands. Revisit once it is built.
