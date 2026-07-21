---
name: build-orchestration
description: >
  Run a multi-agent build session: the main session acts as manager — cutting a
  goal into units, spawning implementer and tester subagents, and running the
  test-and-review loop to completion. Invoke with /build-orchestration. Requires
  the worker agents promoted to `.claude/agents/` (see `docs/agents/README.md`).
disable-model-invocation: true
---

# Build Orchestration

You are the manager: the main session. You do not implement features — your own
edits are limited to docs, config, and merge glue. You cut the goal into units,
spawn subagent workers, integrate their reports, run the loop below, and write
the record. Design and rationale: `docs/skills/build-orchestration.md`.

## Prerequisites

Confirm each agent below appears in the available-agents list before you start.
If any is missing, stop and tell the user to promote it per
`docs/agents/README.md`. Never auto-promote — promotion is user-sign-off only.

- Required: `blackbox-tester`, `whitebox-tester`, `security-critic`,
  `design-critic`.
- Implementers spawn as `general-purpose` (always available).
- Optional, spawn only when a unit calls for it: `researcher`, `verifier`,
  `alternatives-explorer`.

## Establish the goal

Reconcile three inputs; none alone is authoritative:

- The feature plan under `docs/plans/<feature>/` (especially `impl.md`).
- `docs/progress.md` for where work left off.
- The user's in-session direction — which entry point to continue from, plus any
  added requirements.

If the entry point is not stated, ask before cutting units. Then cut the work
into units with explicit, disjoint file boundaries.

## Session flow

1. Spawn the blackbox tester and the implementers in parallel, one unit each.
2. As implementer reports arrive: integrate, then run the build, the project
   test command (`<test command>`), and the blackbox suite. Send failures back
   to the same implementer via `SendMessage` — its context is intact; spawn a
   fresh one only if it is wedged.
3. Units merged and green → spawn the whitebox tester.
4. Both suites pass → spawn the reviewer: `security-critic` and `design-critic`
   over the code plus both test suites.
5. Per reviewer finding: hand a fix unit to an implementer, rerun both suites.
   Loop until the report is clean, or record the remaining findings in the
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

## Report format

Do not impose a format — each agent's definition already specifies its own
report structure. Demand that structure back in the prompt. The shared shape
every agent follows (severity line, mandatory openable evidence, "Checked, no
finding") lives in `docs/agents/README.md`; cite it, do not restate it.

## The record

- Log every subagent's exact prompt to `docs/prompt-log/` as you spawn it —
  capture only. Never treat it as a decision input, never paste one prompt into
  another.
- Write one build-log entry per session: `docs/build-log/<yyyy-mm-dd>-<slug>.md`,
  committed with the session's work. Keep only what a later session needs: the
  option chosen and why, decisions with their reasoning, how the built pieces
  connect to each other and to the plan, and any finding accepted as risk. Cut
  transcripts, play-by-play, restated plan content, and per-agent credit.
- The build-log entry is a written document — run it through the `human-writing`
  skill before committing.
