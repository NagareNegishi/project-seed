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
5. On the `blackbox-tester` report, move its tests from `.agent-scope/` into the
   repo's test-dirs, then clear the jail (Spawning rules). Treat its `Findings` as
   spec gaps: decide each and record it in the spec; surface any that needs a design
   decision to the user first (Reports). Never route a `Finding` to an implementer.
6. Before the first merge, stamp the session base: `agent-worktree.sh start` (finalize
   collapses to it). Then, as each implementer report arrives, integrate it with
   `agent-worktree.sh merge` (Spawning rules). Once a unit's source is merged **and** its
   blackbox tests are landed, run the build and the blackbox suite (via `<test command>`).
7. On failure, follow the escalation ladder (Guardrails).
8. Once the units are merged and green, spawn `whitebox-tester`.
9. When both suites pass, spawn the review layer: each critic by its `Deploy
   when` trigger (Review axes).
10. Consume each reviewer report (Reports — demand and consume).
11. Route each finding to an implementer as a fix unit; one whose fix needs a
    design or spec decision surfaces to the user first and dispatches only once
    the decision is recorded. Rerun both suites; repeat until the reports are
    clean, or log the remainder as accepted risk (build-log).
12. Write the record (below).
13. Finalize onto your branch. Each `merge` committed the unit as disposable scaffolding
    so the integration could be a real `git merge`; those commits must not become your
    history. Run `agent-worktree.sh finalize` (refuses mid-conflict; only ever drops this
    session's commits, never pre-session or pushed history) — it resets to the `start`
    stamp and leaves the whole integrated result as uncommitted changes. Then produce the
    real commit(s), including the build-log, through the `git-commit` skill, and surface
    the planned commits to the user. The scaffold commits never reach a remote.

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
    paths, a tester's test-dirs only. Merge nothing from the debugger. Route the two
    failures differently:
    - Scope refusal (out-of-scope path): push it back to the same worker (escalation
      ladder, strike 1).
    - Merge conflict (real line overlap): resolve the markers in main yourself (merge
      glue) and commit, or abort the merge and re-cut so one unit owns the file. Never
      an implementer's job; never a strike.
  - `remove <unit>` once merged or abandoned.
  Give parallel agents separate worktrees; sequence any two units that edit the same
  file, especially a shared integration point (barrel, route table, registry).
- Background by default. Run synchronously only when the next allocation depends
  on the result.
- Batch small findings into one fix unit, not one agent each.
- Never pass the test files to an implementer.
- Never let an implementer or tester widen a symbol's visibility for testing.
- Before any write-capable spawn, confirm the session is not in `bypassPermissions`
  or `acceptEdits`.
- For `blackbox-tester`, stage only the spec into `.agent-scope/`, spawn it pointed
  there. On its report, move the written tests into the repo's test-dirs (step 5),
  then clear `.agent-scope/`.

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

- **Critics** — route on which section is populated, not the `Verdict` word (it
  differs per critic). `Problems` populated → triage by severity into batched fix
  units; critical/high block close-out, low → build-log accepted risk. `Out of
  scope` populated → stage the missing input and respawn, or record the uncovered
  axis. Both empty → record `Checked`, proceed. Cannot place it → treat as
  `unreviewable`, never clean.
- **Testers** — no `Verdict`. Read `Findings` and `Open`, and for whitebox/mcdc the
  `Suite` line: an xfail/skip parked against a Finding is an open bug → fix unit.
  Resolve blackbox `Findings` and every `Open` item yourself; never route one to an
  implementer.
- **researcher / verifier** — a researcher's ambiguous-task reply (its `Needed`
  section, no `Answer`) bounces back to you; pair a researched answer with
  `verifier`, and a verifier `Verdict: FAIL` blocks acting on it.
- **alternatives-explorer** — take its single `Recommendation` into a design
  decision, then a fix unit.
- **debugger** — `Root cause` + `Fix location` feed the next fix unit; `Root cause:
  none` (no reproduction) is an escalation, not a fix.

## The record

- **Prompt-log** — log every subagent's exact prompt to `build-orchestration/prompt-log/`
  as you spawn it, under the `S<N>-<role>-<n>` id scheme (roles: `impl`, `blackbox`,
  `whitebox`, `mcdc`, `critic`, `debug`, `research`, `verify`, `altex`). Capture
  only: never a decision input, never paste one prompt into another.
- **Build-log** — write one `build-orchestration/build-log/<yyyy-mm-dd>-<slug>.md`
  per session, committed with the session's work at finalize (step 13). Keep only what a later session needs: the
  option chosen and why, decisions with their reasoning, how the built pieces
  connect to each other and to the plan, and any finding accepted as risk. Cut
  transcripts, play-by-play, restated plan content, and per-agent credit.
- Run the build-log through the `human-writing` skill before committing.
