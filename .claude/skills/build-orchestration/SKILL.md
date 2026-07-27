---
name: build-orchestration
description: >
  Run a multi-agent build session: the main session acts as manager — cutting a
  goal into units, spawning implementer, tester, and critic subagents, and running
  the test-and-review loop to completion under anti-thrash guardrails.
disable-model-invocation: true
---

# Build Orchestration

You are the manager: the main session. You do not implement features — your own
edits are limited to docs, config, and merge glue.

## Prerequisites

Confirm each agent you intend to spawn is in the available-agents list; if one is
missing, stop and tell the user. Minimum to run: `blackbox-tester`,
`whitebox-tester`, `security-critic`, `design-critic`. Implementers spawn as
`general-purpose`.

## Establish the goal

Reconcile three inputs; none alone is authoritative:

- The feature plan under `docs/plans/<feature>/` (especially `impl.md`).
- `docs/progress.md` for where work left off.
- The user's in-session direction — which entry point to continue from, plus any
  added requirements.

Do not refuse on a thin plan doc — the in-session direction fills the gap. If the
entry point is not stated, ask before cutting units. Then cut the work into units
with explicit, disjoint file boundaries.

## Session flow

1. Spawn `blackbox-tester` and, for a unit carrying real design or security
   surface, the allocated pre-build gate (`security-critic` + `design-critic`
   over the unit *spec*) — all read the spec, in parallel. Fold gate findings into
   the spec, then spawn implementers, one unit each.
2. As implementer reports arrive: integrate, then run the build, the project test
   command (`<test command>`), and the blackbox suite. On failure, follow the
   escalation ladder (Guardrails, Lever 2) — bounded re-attempts, then stop and
   diagnose. Never loop indefinitely on "make it green".
3. Units merged and green → spawn `whitebox-tester`.
4. Both suites pass → spawn the post-code review layer: allocate critics from the
   eight-axis roster per unit (not all, always), plus `change-discipline-critic`
   when the diff smells. Record the allocation and its deferred grade in
   `build-orchestration/prompt-log/allocation.md`.
5. Per reviewer finding: hand a fix unit to an implementer, rerun both suites.
   Loop until the reports are clean, or record the remaining findings in the
   build-log as accepted risk.
6. Write the record (below) and close out.

## Spawning rules

- Subagents start cold and see none of this conversation. Every prompt carries:
  the exact file paths, the spec extract for the unit, the applicable CLAUDE.md
  constraints (`code-commenting` skill, no Claude attribution), and the report
  format you demand back.
- Parallel implementers get disjoint file sets. If units overlap, sequence them
  or give each its own worktree.
- Background by default. Run synchronously only when the next allocation depends
  on the result.
- Do not spawn for a fix you can already see in full. Batch small findings into
  one fix unit, not one agent each.
- **An implementer fix unit's file set excludes the test files** (Lever 1). The
  fixer cannot edit the check that judges it. A fix that requires a test to change
  is a spec/test disagreement — escalate to yourself as manager, never a silent
  edit.
- **No visibility widening for test convenience.** Implementer and tester prompts
  forbid making a private symbol public, or otherwise expanding the API surface,
  just to test it. An untestable-through-the-public-surface private is a finding,
  not a licence to widen it.
- **Stage and confine every write-capable spawn.** Testers and implementers share
  the tree and can write. Confirm the session is not in `bypassPermissions` /
  `acceptEdits` before spawning — either overrides the path-jail. Stage only the
  permitted files into `.agent-scope/` (spec-only for `blackbox-tester`, spec+impl
  for `whitebox-tester`), point the tester at that root, move results out, clear it;
  the two share the one root, so serialize them. Snapshot `git status --porcelain`
  before each write-capable spawn and diff it on return — revert and report any
  changed path outside the unit's permitted set. Mechanism:
  `docs/agents/authoring.md` §12.

## Review axes

Each critic owns one axis; allocate per unit (Session flow, step 4), not
all-always. Critics find problems in their lane with evidence per finding; they
never fix. Fixes go to an implementer or `alternatives-explorer`.

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

## Guardrails against thrashing

A stuck agent stops solving the problem and starts making the check turn green —
editing the test, exposing a private to test it, over-complicating to compile, a
large refactor for a small bug. Prevent it in the loop, not with a post-hoc critic.

- **Lever 1 — freeze the acceptance check.** Once you accept the spec-derived
  blackbox suite, the thing being judged cannot edit the judge. Enforced by the
  two spawning rules above (fix units exclude test files; no visibility widening).
- **Lever 2 — the escalation ladder.** No unbounded "make it green" loop:
  1. Attempt fails → feed the exact failure back to the same implementer via
     `SendMessage` (context intact). At most twice.
  2. Still failing → **stop changing code. Spawn `debugger` for the root cause.**
     No further edit until the cause is named.
  3. Cause named but the fix fights the design → `alternatives-explorer`, or
     escalate to the human that the approach or the spec may be wrong.

  The rule: after 2 strikes you diagnose, you do not re-attempt.
- **Backstop — `change-discipline-critic`.** Allocate it on diff-smell. It judges
  the diff against its mandate: the change does only what the task asked, no
  acceptance test was weakened or deleted, no visibility widened for testing, the
  fix targets a diagnosed cause not a symptom, the diff size is proportionate.

## Reports — demand and consume

Do not impose a format; each agent defines its own. Demand that structure back in
the prompt. What agents share is a resemblance, not one shape — evidence per
finding, honest ranking where severity applies, every section always present (write
"none"), the report as final message. Only the eight critics carry the
`Target · Verdict · Problems · Checked · Out of scope` form; testers and advisory
deviate. The template and its deviations live in `docs/agents/authoring.md` §2
(+§10); cite it, do not restate it.

Consume each family on its own terms:

- **Critics** — read `Verdict`. Axis-bad → triage `Problems` by severity into
  batched fix units; critical/high block close-out, low → build-log accepted risk.
  `unreviewable` → stage the missing input and respawn, or record the uncovered
  axis (feeds the allocation `miss`). `clean` → record `Checked`, proceed.
- **Testers** — no `Verdict`. Read `Findings`, and for whitebox/mcdc the `Suite`
  line: an xfail/skip parked against a Finding is an open bug → fix unit. Blackbox
  `Findings` are spec gaps for you to resolve, not an implementer.
- **researcher / verifier** — a researcher "Ambiguous" reply bounces back to you;
  pair a researched answer with `verifier`, and a verifier `FAIL` blocks acting on
  it.
- **alternatives-explorer** — take its single `Recommendation` into a design
  decision, then a fix unit.
- **debugger** — `Root cause` + `Fix location` feed the next fix unit; "could not
  reproduce" is an escalation, not a fix.

## The record

- **Prompt-log** — log every subagent's exact prompt to `build-orchestration/prompt-log/`
  as you spawn it, under the `S<N>-<role>-<n>` id scheme (roles: `impl`, `blackbox`,
  `whitebox`, `mcdc`, `critic`, `debug`, `research`, `verify`, `altex`). Capture
  only: never a decision input, never paste one prompt into another.
- **Evaluations** — deferred, in `build-orchestration/prompt-log/evaluations.md`:
  per-spawn judgment of how well each prompt was written, keyed by entry id. Written
  in a later analysis pass, never live.
- **Allocation grade** — in `build-orchestration/prompt-log/allocation.md`, per unit
  and deferred: which critics you deployed vs skipped and why. Judged later for
  *waste* (spawned, found nothing on this unit-shape) and *miss* (skipped, a defect
  slipped its axis).
- **Build-log** — write one `build-orchestration/build-log/<yyyy-mm-dd>-<slug>.md`
  per session, committed with the session's work. Keep only what a later session needs: the
  option chosen and why, decisions with their reasoning, how the built pieces
  connect to each other and to the plan, and any finding accepted as risk. Cut
  transcripts, play-by-play, restated plan content, and per-agent credit.
- The build-log entry is a written document — run it through the `human-writing`
  skill before committing.
