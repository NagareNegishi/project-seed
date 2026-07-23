# Build Orchestration — Skill Design (planning)

A skill that turns the main session into a **manager**: it cuts a build goal
into units, spawns the subagent workers defined in [../agents/](../agents/),
integrates their reports, runs the test and review loop, and writes the record.
It is the seed-repo, stack-agnostic descendant of site-factory's
`docs/plans/site-factory/orchestration.md`, lifted out of a plan doc and into a
reusable skill.

Status: v1 drafted 2026-07-21. Skill at
`.claude/skills/build-orchestration/SKILL.md`; record dirs (`docs/build-log/`,
`docs/prompt-log/`) and gitignore rule in place. Several decisions still open
(see "Still open"). Not yet exercised on a real session.

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
  - **Testers** — [blackbox-tester](../agents/blackbox-tester.md) (spec-derived,
    spawned at session start alongside implementers),
    [whitebox-tester](../agents/whitebox-tester.md) (internal-path tests after
    code lands), and [mcdc-tester](../agents/mcdc-tester.md) (optional;
    decision-coverage tests for units with dense boolean logic).
  - **Review layer (critics)** — one axis each, spawned over the merged code
    (and, per the open decision below, optionally over the unit spec before
    build): [correctness-critic](../agents/correctness-critic.md),
    [security-critic](../agents/security-critic.md),
    [design-critic](../agents/design-critic.md),
    [simplicity-critic](../agents/simplicity-critic.md),
    [performance-critic](../agents/performance-critic.md),
    [docs-critic](../agents/docs-critic.md),
    [legal-critic](../agents/legal-critic.md),
    [change-discipline-critic](../agents/change-discipline-critic.md) (judges
    the diff against its mandate — see the guardrails section).
  - **Advisory** — [researcher](../agents/researcher.md) /
    [verifier](../agents/verifier.md) /
    [alternatives-explorer](../agents/alternatives-explorer.md) /
    [debugger](../agents/debugger.md), spawned per-unit when a unit needs
    research, a critique follow-up, or root-cause diagnosis of a failure.

## Session flow (proposed, adapted from site-factory)

1. Manager establishes the goal from three inputs together: the feature's plan
   doc (`docs/plans/<feature>/`, esp. `impl.md`), the progress tracker
   (`docs/progress.md`) for where work left off, and the user's in-session
   direction — which entry point to continue from, plus any added requirements.
   Then cuts the work into units with explicit file boundaries.
2. Spawn blackbox tester + implementers in parallel, one unit each.
3. As implementer reports arrive: integrate, run the build and the blackbox
   suite. On failure, follow the escalation ladder (Guardrails, Lever 2) —
   bounded re-attempts, then stop and diagnose; never loop indefinitely on
   "make it green".
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
- **An implementer fix unit's file set excludes the test files.** The fixer
  cannot edit the check that judges it (Guardrails, Lever 1). A fix that
  requires a test to change is a spec/test disagreement — a manager escalation,
  never a silent edit.
- **No visibility widening for test convenience.** Implementer and tester
  prompts forbid making a private symbol public, or otherwise expanding the API
  surface, just to test it. An untestable-through-the-public-surface private is
  a Finding, not a licence to widen it.

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
   a gitignored `docs/prompt-log/` capturing every subagent's exact prompt (both
   directories, the `docs/prompt-log/README.md` capture rules, and the gitignore
   entry are in place). The build-log keeps only what a later session needs
   (option chosen and why, decisions with reasoning, how pieces connect, accepted
   risk); the prompt-log is capture-only, never a decision input.
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

## Review layer — axes and gaps (added 2026-07-21)

The v1 review layer had two critics, `security` and `design`. That covers two
of the quality axes the build is meant to guarantee and silently drops the
rest. The bar is: every unit is designed well, tested, checked for risk and
performance, stripped of redundancy and over-complication, documented, and
reviewed — so security and legal exposure is caught, and when a bug does slip
through its cause is fast to find. Mapped to agents, one axis each:

| Axis | Agent | v1 |
| --- | --- | --- |
| Correctness (logic, edge cases, contract) | `correctness-critic` | new |
| Security risk | `security-critic` | had |
| Design / architecture | `design-critic` | had |
| Redundancy, over-complication | `simplicity-critic` | new |
| Performance, efficiency | `performance-critic` | new |
| Documentation, comments | `docs-critic` | new |
| Legal, licensing, compliance | `legal-critic` | new |
| Change discipline (diff vs. its mandate) | `change-discipline-critic` | new |
| Decision-coverage testing | `mcdc-tester` | new (optional) |
| Root-cause diagnosis on failure | `debugger` | new (may stay a skill) |

Rationale for the shape:

- **Correctness was the biggest hole.** The only v1 defence against a logic
  bug was the two test agents; nothing read the merged code hunting for the
  edge case the tests never encoded. `correctness-critic` is the direct answer
  to "ideally the bug does not exist because of process".
- **One axis per critic, following the existing critic pattern.** Each new
  critic mirrors [security-critic](../agents/security-critic.md): find problems
  in its lane, evidence per finding, no fixes — fixes stay with
  [alternatives-explorer](../agents/alternatives-explorer.md) or an implementer.
- **`mcdc-tester` is a `whitebox-tester` specialisation, kept optional.** MC/DC
  (each condition independently affecting a decision) earns its combinatorial
  test cost only on decision-dense units — auth rules, pricing, validation,
  state machines. It has a tooling caveat: most stacks cannot *measure* MC/DC
  coverage out of the box, so the agent designs cases by analysing conditions
  and states where it cannot verify the coverage number.
- **`debugger` may not need to be an agent.** The `systematic-debugging` skill
  already owns root-cause discipline; an isolated agent is worth it only if the
  manager wants diagnosis off its own context when the loop stalls. Drafted so
  the decision can be made on a real draft, not in the abstract. It is also the
  teeth of the escalation ladder below.

## Guardrails against thrashing and spec-gaming (added 2026-07-21)

The critics above judge code *quality*. They do not stop a distinct failure
mode: when an agent gets stuck, it stops optimising for "solve the problem" and
starts optimising for "make the check turn green". Observed shapes — changing
source or the test itself to make a test pass, exposing a private method to
test it, over-complicating logic just to compile, a large pointless refactor for
a small bug. These are specification gaming, and a post-hoc critic catches them
only after the wasted loops and the corrupted tests already happened. Prevention
sits in the loop and the prompts, not in another reviewer. Two levers, plus one
backstop critic.

**Lever 1 — freeze the acceptance check (separation of duties).** The
spec-derived blackbox suite is the contract; once the manager accepts it, the
thing being judged cannot edit the judge. Enforced by the two spawning rules
above (fix units exclude the test files; no visibility widening for test
convenience), which kill "change src/test to make it pass" and "expose a private
for the test". A required test change is a spec disagreement escalated to the
manager, never a silent implementer edit. The bones already exist
(blackbox-tester never reads code; testers never fix) — this hardens the fix
loop so the fixer cannot reach the checker.

**Lever 2 — the escalation ladder (stuck circuit-breaker).** The v1 loop had no
stop condition: "send failures back, spawn fresh if wedged" is where thrashing
lives. Replace it with a bounded ladder, and forbid the manager from just
re-attempting:

1. Attempt fails → feed the exact failure back to the same implementer (its
   context is intact). At most once or twice.
2. Still failing → **stop changing code. Spawn `debugger` for the root cause.**
   No further edit until the cause is named. Over-complication and pointless
   refactors are what a thrashing agent does *instead* of diagnosing; this
   replaces the thrash with diagnosis.
3. Cause named but the fix fights the design → `alternatives-explorer`, or
   escalate to the human that the approach or the spec itself may be wrong.

The rule that matters: N strikes and you diagnose, you do not re-attempt. Strike
count is a still-open number (see below).

**Backstop — `change-discipline-critic`.** For what slips the levers, this
critic judges the *diff against its mandate*, which no quality critic does
(they judge the code in the absolute; none is handed the diff paired with the
task). It checks: the change does only what the task asked (no refactor riding
along), no acceptance test was weakened/skipped/deleted, no visibility widened
for testing, the fix targets a diagnosed cause rather than a papered-over
symptom, and the diff size is proportionate to the task. It is a separate agent
rather than the manager's own check because the manager is under the same
"just ship this unit and move on" pressure that produces the gaming — an
independent reviewer that never feels that pressure is more honest, the same
reason the quality critics do not fix their own findings.

## Still open

- **Singleton critics vs. one broad reviewer.** Seven single-axis critics give
  the sharpest signal and the most parallelism but balloon the fan-out and
  per-spawn context cost. The alternative is a broad `code-reviewer` running a
  checklist (correctness + simplicity + performance + docs), with `security`,
  `design`, and `legal` kept separate for needing distinct expertise — matching
  how the `/code-review` skill already bundles correctness with
  reuse/simplification/efficiency. Drafting them as singletons first because
  merging drafts later is cheaper than splitting one. Resolve at review.
- **Pre-build gate.** The critics run post-code in the v1 flow. "Risk
  considered" and "designed well" are cheapest to fix before an implementer
  writes code, so the critics (at least `design`, `security`, `correctness`)
  could also gate the unit *spec* before build — the way `blackbox-tester`
  already runs pre-code. Decide whether the review layer runs pre-build,
  post-code, or both.
- **`debugger`: agent or skill.** See the review-layer note above; settle once
  the draft exists.
- **Escalation-ladder strike count.** How many failed implementer attempts
  before the manager must stop and spawn `debugger` (Guardrails, Lever 2). One
  or two is the starting guess; tune it once the skill runs a real session —
  too low wastes a diagnosis spawn on a typo, too high lets the thrash back in.
- **`change-discipline-critic` — always-on or on-demand.** Whether it runs on
  every unit's diff or only when the manager suspects gaming (a fix that touched
  more than expected, a test that changed). Always-on is safer against a biased
  manager; on-demand is cheaper. Decide with the singleton-vs-broad-reviewer
  question, since it may fold into that reviewer.
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

The skill is built but cannot run until its required workers are promoted from
[../agents/](../agents/) drafts into `.claude/agents/`: `blackbox-tester`,
`whitebox-tester`, `security-critic`, `design-critic`. Promotion is
user-sign-off only (see the agents README). After promotion, exercise the skill
on a real session and record what the flow gets wrong.
