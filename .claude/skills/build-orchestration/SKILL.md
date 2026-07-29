---
name: build-orchestration
description: >
  Run a multi-agent build session: the main session acts as manager — cutting a
  goal into units, spawning implementer, tester, and critic subagents, and running
  the test-and-review loop to completion under anti-thrash guardrails.
disable-model-invocation: true
---

# Build Orchestration

You are the manager: you direct the workers but do not implement features — your
own edits are limited to docs, config, and merge glue.

## Prerequisites

Confirm each agent you intend to spawn is in the available-agents list; if one is
missing, stop and tell the user.

## Establish the goal

Reconcile three inputs; none alone is authoritative:

- The feature plan under `docs/plans/<feature>/` (especially `impl.md`).
- `docs/progress.md` for where work left off.
- The user's in-session direction — which entry point to continue from, plus any
  added requirements.

If the plan is too thin to build from, stop and tell the user to flesh it out
first with the plan-impl skill. If no entry point is stated, ask the user for it.
Cut the work into units. A unit pairs a disjoint file set with a written spec —
what to build for that unit, reconciled from the inputs above.

## Session flow

1. Spawn `design-critic` and/or `security-critic` over the unit's *spec*, each
   only if the spec meets its `Deploy when` trigger (Review axes). Neither → skip
   to step 4.
2. Surface the gate findings to the user; the call is theirs, not yours to
   resolve.
3. Record the user's decision in the spec.
4. Spawn `blackbox-tester` and one `implementer` per unit, from the settled spec,
   in parallel.
5. As each implementer report arrives, integrate it with `agent-worktree.sh merge`
   (Spawning rules), then run the build and the blackbox suite (via `<test command>`).
6. On failure, follow the escalation ladder (Guardrails).
7. Once the units are merged and green, spawn `whitebox-tester`.
8. When both suites pass, spawn the review layer: each critic by its `Deploy
   when` trigger (Review axes).
9. Consume each reviewer report (Reports — demand and consume).
10. Route each finding to an implementer as a fix unit; one whose fix needs a
    design or spec decision surfaces to the user first and dispatches only once
    the decision is recorded. Rerun both suites; repeat until the reports are
    clean, or log the remainder as accepted risk (build-log).
11. Write the record (below).

## Spawning rules

- Subagents see none of this conversation. Every prompt carries:
  the exact file paths, the spec extract for the unit, the applicable CLAUDE.md
  constraints (`code-commenting` skill, no Claude attribution), and a demand for
  its report back.
- Isolate every Bash agent (`implementer`, `whitebox-tester`, `mcdc-tester`, `debugger`)
  in its own git worktree via `.claude/scripts/agent-worktree.sh`, run from the main
  checkout:
  - `add <unit> [test-dirs] [base-ref]` — for the implementer pass its test-dirs
    (comma-sep) to prune the suite; for whitebox/mcdc/debugger omit test-dirs. Point the
    agent at `.agent-worktrees/<unit>`.
  - On the report, `merge <unit> <permitted-path>...` — permit the implementer's source
    paths, a tester's test-dirs only. On refusal, push the violation back to the same
    worker (escalation ladder, strike 1). Merge nothing from the debugger.
  - `remove <unit>` once merged or abandoned.
  Give parallel agents separate worktrees; sequence only when two units edit the same
  file.
- Background by default. Run synchronously only when the next allocation depends
  on the result.
- Batch small findings into one fix unit, not one agent each.
- Never pass the test files to an implementer.
- Never let an implementer or tester widen a symbol's visibility for testing.
- Before any write-capable spawn, confirm the session is not in `bypassPermissions`
  or `acceptEdits`.
- For `blackbox-tester`, stage only the spec into `.agent-scope/`, spawn it pointed
  there, move the written tests out, clear it.

## Review axes

Each critic owns one axis. Deploy per unit by the `Deploy when` column below, not
all-always. Critics report problems, never fix.

| Axis | Agent | Deploy when |
| --- | --- | --- |
| Correctness (logic, edge cases, contract) | `correctness-critic` | the unit has non-trivial logic or branching (near-default) |
| Security risk | `security-critic` | the unit touches auth, input handling, crypto, file/network I/O, or secrets |
| Design / architecture | `design-critic` | the unit adds or changes an abstraction, interface, or module boundary |
| Redundancy, over-complication | `simplicity-critic` | the diff is large or tangled |
| Performance, efficiency | `performance-critic` | the unit loops over unbounded data, hits the DB, or sits on a hot path |
| Documentation, comments | `docs-critic` | the unit changes public API or user-facing docs |
| Legal, licensing, compliance | `legal-critic` | the unit adds a dependency or copied / third-party code |
| Change discipline (diff vs. its mandate) | `change-discipline-critic` | the diff smells: scope creep, weakened or deleted tests, an outsized diff |
| Decision-coverage testing (optional) | `mcdc-tester` | the unit is decision-dense: auth, pricing, validation, state machines |
| Root-cause diagnosis on failure | `debugger` | the escalation ladder stalls (Guardrails) |

## Guardrails against thrashing

- **Escalation ladder** — after 2 strikes you diagnose, you do not re-attempt:
  1. Attempt fails → feed the exact failure back to the same implementer via
     `SendMessage` (context intact). At most twice.
  2. Still failing → **stop changing code. Spawn `debugger` for the root cause.**
     No further edit until the cause is named.
  3. Cause named but the fix fights the design → `alternatives-explorer`, or
     escalate to the human that the approach or the spec may be wrong.

## Reports — demand and consume

Do not impose a format; each agent defines its own. Demand it back as the agent's
final message.

Consume each family:

- **Critics** — read `Verdict`. Axis-bad → triage `Problems` by severity into
  batched fix units; critical/high block close-out, low → build-log accepted risk.
  `unreviewable` → stage the missing input and respawn, or record the uncovered
  axis. `clean` → record `Checked`, proceed.
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
- **Build-log** — write one `build-orchestration/build-log/<yyyy-mm-dd>-<slug>.md`
  per session, committed with the session's work. Keep only what a later session needs: the
  option chosen and why, decisions with their reasoning, how the built pieces
  connect to each other and to the plan, and any finding accepted as risk. Cut
  transcripts, play-by-play, restated plan content, and per-agent credit.
- Run the build-log through the `human-writing` skill before committing.
