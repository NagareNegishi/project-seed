# Build Orchestration — Skill Design (planning)

A skill that turns the main session into a **manager**: it cuts a build goal
into units, spawns the subagent workers defined in [../agents/](../agents/),
integrates their reports, runs the test and review loop, and writes the record.
It is the seed-repo, stack-agnostic descendant of site-factory's
`docs/plans/site-factory/orchestration.md`, lifted out of a plan doc and into a
reusable skill.

Status: planning, decisions settled 2026-07-21 (one still open — see below).
Provisional skill name `build-orchestration`. Nothing is built yet; next step is
to write `SKILL.md` per [new-skills.md](new-skills.md).

## Why a skill, not a doc

The orchestration is a *procedure* — "cut into units → spawn → integrate →
test → review → loop → record" — not reference material. That makes it
skill-shaped, for three reasons:

- **It self-triggers.** A skill's `description` ("running a multi-agent build
  session") pulls it in when the work starts. A doc in `docs/` only helps if
  the session remembers to open it.
- **It loads only when needed.** Build sessions are a fraction of sessions, so
  the flow should not sit in `CLAUDE.md` costing context every time. A skill
  stays out until triggered.
- **The manager is the main session.** Skill instructions land in the current
  session — exactly where the manager lives. The *workers* need isolation and
  scoped tools, which is why they are subagents (`.claude/agents/`), not skill
  text. Skill for the manager, agents for the workers: the split matches what
  each one is.

`CLAUDE.md` keeps only a one-line pointer to the skill, so it stays
discoverable without the weight.

## What it orchestrates

- **Manager** — the main session, running this skill. Cuts units, spawns and
  tracks workers, integrates, decides, writes the record. Its own edits are
  limited to docs, config, and merge glue — it does not implement features.
- **Workers** — the subagent drafts in [../agents/](../agents/):
  - `implementer` — one bounded unit each; spawn as `general-purpose`.
  - [blackbox-tester](../agents/blackbox-tester.md) — tests from spec alone,
    spawned at session start alongside implementers.
  - [whitebox-tester](../agents/whitebox-tester.md) — internal-path tests after
    code lands.
  - `researcher` / `verifier` / `security-critic` / `design-critic` /
    `alternatives-explorer` — advisory, spawned per-unit when a unit needs
    research or a pre-build critique.

## Session flow (proposed, adapted from site-factory)

1. Manager establishes the goal from three inputs together: the feature's plan
   doc (`docs/plans/<feature>/`, esp. `impl.md`), the progress tracker
   (`docs/progress.md`) for where work left off, and the user's in-session
   direction — which entry point to continue from, plus any added requirements.
   Then cuts the work into units with explicit file boundaries.
2. Spawn blackbox tester + implementers in parallel, one unit each.
3. As implementer reports arrive: integrate, run the build and the blackbox
   suite. Send failures back to the same implementer via `SendMessage` (keeps
   its context); spawn fresh only if it is wedged.
4. Units merged and green → spawn the whitebox tester.
5. Both suites pass → spawn the reviewer (security + design critics) over code
   plus tests.
6. Per reviewer finding: fix unit to an implementer, rerun the suites. Loop
   until clean or the remaining findings are recorded as accepted risk.
7. Write the record, close out.

## Spawning rules (carry over from site-factory, unchanged in intent)

- Subagents start cold. Every prompt carries: exact file paths, the spec
  extract for the unit, the applicable `CLAUDE.md` constraints (code-commenting
  skill, no Claude attribution), and the report format.
- Parallel implementers get disjoint file sets. Overlap → sequence them or give
  each a worktree.
- Background by default; run synchronously only when the next allocation
  depends on the result.
- Do not spawn for a fix the manager can already see in full; batch small
  findings into one fix unit, not one agent each.

## Settled decisions

1. **Session input — plan doc + progress doc + in-session direction, together.**
   No `sessions.md` like site-factory. When the project follows the established
   pattern it already has a plan doc (`docs/plans/<feature>/`) and a progress
   tracker (`docs/progress.md`); each session the user states or asks where to
   continue and may add requirements. The manager reads all three and reconciles
   them into the unit cut. No single canonical input file, and no refusal when a
   plan doc is thin — the in-session direction fills the gap.
2. **The record — adopt site-factory's full setup.** One
   `docs/build-log/<date>-<slug>.md` per session, committed with the work, plus
   a gitignored `docs/prompt-log/` capturing every subagent's exact prompt.
   Setup this pulls in, to do when the skill is built: create both directories,
   add a `docs/prompt-log/README.md` with the capture rules, and add
   `docs/prompt-log/` to `.gitignore`. The build-log keeps only what a later
   session needs (option chosen and why, decisions with reasoning, how pieces
   connect, accepted risk); the prompt-log is capture-only, never a decision
   input.
3. **Unpromoted agents — assume promoted, list as prerequisites.** Claude Code
   loads only `.claude/agents/`; the workers are still drafts in
   `docs/agents/`. The skill names the agents it needs as prerequisites and
   stops with a clear message if one is absent. It never auto-promotes:
   promotion is user-sign-off-only per [../agents/README.md](../agents/README.md).
4. **Stack-agnostic references.** The skill refers to "the project's test
   command / test dir" via `<placeholder>` markers, never a concrete runner —
   per the seed conventions in [new-skills.md](new-skills.md).
5. **Report format — defer to each agent, factor the shared shape into the
   agents README.** The agent drafts already define their own report
   structures; the skill does not re-impose one. The common shape (severity
   line, evidence-required, "Checked, no finding") belongs in
   [../agents/README.md](../agents/README.md) so agents and skill cite one
   source.
6. **Trigger — explicit command.** `disable-model-invocation: true`; the user
   runs the skill to open a build session. A build session is deliberate, and
   the authoring guide flags explicit-command skills.
7. **Scope — seed-portable.** Ships in the seed, holds to stack-agnostic
   conventions, carries no project specifics.

## Still open

- **Relationship to `verify-fanout`.** Kept **separate for now**: build uses the
  inline `researcher`/critic agents; `verify-fanout` stays its own
  planning-time external-verification path. Whether the manager can *offer*
  `verify-fanout` as an option inside a build session depends on how that
  workflow lands — not finalized. Revisit once `verify-fanout` is built.

## Relationship to existing pieces

- [../agents/](../agents/) — the worker definitions and their promotion path;
  this skill is the manager that spawns them.
- [verify-fanout.md](verify-fanout.md) — sibling multi-agent workflow, scoped
  to external verification; overlap to resolve (see open decisions).
- [new-skills.md](new-skills.md) — the conventions this skill must follow:
  stack-agnostic, `<placeholder>` markers, trigger-phrase discipline.

## Next step

Decisions above are settled (except the `verify-fanout` relationship, which does
not block a v1). Write `SKILL.md` per [new-skills.md](new-skills.md), and do the
record-setup from decision 2 (create `docs/build-log/`, `docs/prompt-log/` +
its README, gitignore `docs/prompt-log/`) as part of building the skill.
