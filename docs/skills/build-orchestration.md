# Build Orchestration — SKILL.md spec

The material a session needs to write `.claude/skills/build-orchestration/SKILL.md`.
Design rationale, open questions, and the wiring checklist live in the companion
`build-orchestration-design-notes.md`.

## What it is

A skill that turns the main session into a **manager**: it cuts a build goal into
units, spawns the subagent workers in `.claude/agents/`, integrates their reports,
runs the test and review loop, and writes the record. The manager is the main
session; the workers are subagents.

## Roster (what it orchestrates)

- **Manager** — the main session running this skill. Cuts units, spawns and
  tracks workers, integrates, decides, writes the record. Its own edits are
  limited to docs, config, and merge glue — it does not implement features.
- **Workers** — subagents in `.claude/agents/`:
  - `implementer` — one bounded unit each; spawn as `general-purpose`.
  - **Testers**: `blackbox-tester` (spec-derived, spawned at session start
    alongside implementers), `whitebox-tester` (internal-path tests after code
    lands), `mcdc-tester` (optional; decision-coverage tests for units with dense
    boolean logic).
  - **Critics** (one axis each, spawned over the merged code): `correctness-critic`,
    `security-critic`, `design-critic`, `simplicity-critic`, `performance-critic`,
    `docs-critic`, `legal-critic`, `change-discipline-critic` (judges the diff
    against its mandate — see Guardrails).
  - **Advisory**: `researcher`, `verifier`, `alternatives-explorer`, `debugger` —
    spawned per-unit when a unit needs research, a critique follow-up, or
    root-cause diagnosis of a failure.

## Session flow

1. Establish the goal from three inputs together: the feature's plan doc
   (`docs/plans/<feature>/`, esp. `impl.md`), the progress tracker
   (`docs/progress.md`) for where work left off, and the user's in-session
   direction (which entry point to continue from, plus any added requirements).
   If the plan is too thin to build from, stop and send the user to `plan-impl`.
   Otherwise cut the work into units with explicit file boundaries.
2. For a unit carrying real design or security surface, spawn the pre-build gate
   (`security-critic` + `design-critic`) over the unit *spec* first. Surface its
   findings to the user for a decision — the manager organises the points, it does
   not resolve implementation direction — and record the decision into the spec.
   Then spawn `blackbox-tester` and the implementers (one unit each) from the
   settled spec, in parallel.
3. As implementer reports arrive: integrate, run the build and the blackbox
   suite. On failure, follow the escalation ladder (Guardrails, Lever 2):
   bounded re-attempts, then stop and diagnose — never loop indefinitely on
   "make it green".
4. Units merged and green → spawn `whitebox-tester`.
5. Both suites pass → spawn the post-code review layer: **allocate** critics from
   the eight-axis roster per unit (not all, always), plus `change-discipline-critic`
   when the diff smells. Record the allocation and its deferred grade in
   `build-orchestration/prompt-log/allocation.md`.
6. Per reviewer finding: fix unit to an implementer, rerun the suites. Loop until
   clean or the remaining findings are recorded as accepted risk.
7. Write the record, close out.

## Spawning rules

- Subagents start cold. Every prompt carries: exact file paths, the spec extract
  for the unit, the applicable `CLAUDE.md` constraints (code-commenting skill, no
  Claude attribution), and the report format.
- Parallel Bash agents get separate worktrees. Sequence only when two units must
  edit the same file.
- Background by default; run synchronously only when the next allocation depends
  on the result.
- Do not spawn for a fix the manager can already see in full; batch small findings
  into one fix unit, not one agent each.
- **An implementer fix unit's file set excludes the test files.** The fixer cannot
  edit the check that judges it (Guardrails, Lever 1). A fix that requires a test
  to change is a spec/test disagreement — a manager escalation, never a silent
  edit.
- **No visibility widening for test convenience.** Implementer and tester prompts
  forbid making a private symbol public, or otherwise expanding the API surface,
  just to test it. An untestable-through-the-public-surface private is a Finding,
  not a licence to widen it.
- **Confirm the session mode before any write-capable spawn.** `bypassPermissions` /
  `acceptEdits` override the path-jail — check before spawning.
- **Isolate every Bash agent in a worktree.** `implementer`, `whitebox`, `mcdc`, and
  `debugger` write through `Bash`, which no `PreToolUse` hook can intercept, so confine
  them structurally: each gets its own worktree (`.claude/scripts/agent-worktree.sh`),
  and `merge` transfers only in-scope paths, refusing on any violation. That merge audit
  is the manager-side enforcement of Lever 1 — the subagent-prompt rules (no test files
  to an implementer, no visibility widening) are backstops; an actual violation is caught
  at the gate, not by them. Push a refusal back to the worker; report an out-of-scope
  change to the user in one line. Mechanism: `docs/agents/authoring.md` §13.
- **Confine `blackbox` by path-jail.** It carries no Bash, so stage only the spec into
  `.agent-scope/`, point it there, move the tests out, clear it. Mechanism:
  `docs/agents/authoring.md` §12.

## Review axes

Each critic owns one axis; allocated per unit, not all-always (Session flow, step 5).

| Axis | Agent |
| --- | --- |
| Correctness (logic, edge cases, contract) | `correctness-critic` |
| Security risk | `security-critic` |
| Design / architecture | `design-critic` |
| Redundancy, over-complication | `simplicity-critic` |
| Performance, efficiency | `performance-critic` |
| Documentation, comments | `docs-critic` |
| Legal, licensing, compliance | `legal-critic` |
| Change discipline (diff vs. its mandate) | `change-discipline-critic` |
| Decision-coverage testing (optional) | `mcdc-tester` |
| Root-cause diagnosis on failure | `debugger` |

Critics find problems in their lane with evidence per finding; they never fix.
Fixes go to an implementer or `alternatives-explorer`.

## Consuming reports

Each family reports differently (Conventions), so the manager acts on each on its
own terms:

- **Critics** — read `Verdict`: axis-bad → triage `Problems` by severity into
  batched fix units (critical/high block close-out, low → build-log accepted risk);
  `unreviewable` → stage the missing input and respawn, or record the uncovered axis
  (feeds the allocation `miss`); `clean` → record `Checked`.
- **Testers** — no `Verdict`; read `Findings`, and for whitebox/mcdc the `Suite`
  line — an xfail/skip parked against a Finding is an open bug → fix unit. Blackbox
  `Findings` are spec gaps the manager resolves, not an implementer.
- **researcher / verifier** — a researcher "Ambiguous" reply bounces back to the
  manager; pair a researched answer with `verifier`, and a verifier `FAIL` blocks
  acting on it.
- **alternatives-explorer** — consume its single `Recommendation` into a design
  decision, then a fix unit.
- **debugger** — `Root cause` + `Fix location` feed the next fix unit; "could not
  reproduce" is an escalation, not a fix.

## Guardrails against thrashing and spec-gaming

When an agent gets stuck it stops optimising for "solve the problem" and starts
optimising for "make the check turn green" — editing the test to pass, exposing a
private to test it, over-complicating to compile, a large refactor for a small
bug. A post-hoc critic catches this only after the wasted loops. Prevention sits
in the loop and the prompts. Two levers plus one backstop critic.

**Lever 1 — freeze the acceptance check (separation of duties).** Once the manager
accepts the spec-derived blackbox suite, the thing being judged cannot edit the
judge. Enforced by the two spawning rules above and the manager's post-spawn tree
audit (fix units exclude test files; no visibility widening). A required test change
is a spec disagreement escalated to the manager, never a silent implementer edit.

**Lever 2 — the escalation ladder (stuck circuit-breaker).** No unbounded "make it
green" loop; the manager may not just re-attempt:

1. Attempt fails → feed the exact failure back to the same implementer (context
   intact). At most twice.
2. Still failing → **stop changing code. Spawn `debugger` for the root cause.** No
   further edit until the cause is named.
3. Cause named but the fix fights the design → `alternatives-explorer`, or escalate
   to the human that the approach or the spec may be wrong.

The rule: after 2 strikes you diagnose, you do not re-attempt.

**Backstop — `change-discipline-critic`.** Judges the *diff against its mandate*,
which no quality critic does. Checks: the change does only what the task asked (no
refactor riding along), no acceptance test was weakened/skipped/deleted, no
visibility widened for testing, the fix targets a diagnosed cause not a papered-over
symptom, and the diff size is proportionate to the task.

## Record

- **Build-log** — one `build-orchestration/build-log/<date>-<slug>.md` per session, committed with
  the work. Keeps only what a later session needs: option chosen and why, decisions
  with reasoning, how pieces connect, accepted risk.
- **Prompt-log** — gitignored `build-orchestration/prompt-log/`, capture-only (never a decision
  input): `README.md` (capture rules, `S<N>-<role>-<n>` id scheme), `_template.md`
  (verbatim per-spawn capture), and rolling `evaluations.md` (deferred per-spawn
  prompt judgment → a `fix:` to the SKILL rules or an agent draft).
- **Allocation grade** — gitignored `build-orchestration/prompt-log/allocation.md`, per-unit
  (deferred, never live): which critics were deployed vs skipped and why, judged for
  *waste* (spawned, found nothing on this unit-shape) and *miss* (skipped, a defect
  slipped its axis). Output is a fix to the allocation rules.
- Roles for the id scheme: `impl`, `blackbox`, `whitebox`, `mcdc`, `critic`,
  `debug`, `research`, `verify`, `altex`.

## Prerequisites

The skill confirms each agent it needs is in the available-agents list and stops
with a clear message if one is absent. Minimum to run: `blackbox-tester`,
`whitebox-tester`, `security-critic`, `design-critic`.

## Conventions

- **Stack-agnostic.** Refer to the project's test command / test dir via
  `<placeholder>` markers, never a concrete runner. Seed-portable: no project
  specifics.
- **Trigger — explicit command.** `disable-model-invocation: true`; the user runs
  the skill to open a build session.
- **Report format — defer to each agent.** The skill does not re-impose one; each
  agent defines its own. What agents share is a resemblance, not one shape (evidence
  per finding, honest ranking where severity applies, every section present, report
  as final message); only the eight critics carry the
  `Target · Verdict · Problems · Checked · Out of scope` form, testers and advisory
  deviate. Template + deviations: `docs/agents/authoring.md` §2 (+§10).
