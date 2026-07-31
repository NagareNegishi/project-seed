# Build Orchestration — risk backlog

Holes where the manager (main session running `build-orchestration/SKILL.md`) can drift from
intended behavior — each skill guarantee leans on manager discipline or in-context state.

Ordered by **fix sequence**, not severity: correct the documented flow first, then build the
durable state the discipline fixes write into, then add enforcement last (fence the machine after
it runs correctly). Severity rank kept as a tag. Work top-down; mark `DONE` with the fix location.
Companion: `build-orchestration-design-notes.md` (rationale).

## Phase A — make the documented flow correct

1. **Blackbox test integration missing from the flow.** *(sev #4)* `DONE` — SKILL steps 5–6 land
   blackbox tests before the suite runs and gate the suite on source-merged **and** tests-landed.

2. **Parallel merges cause base drift with no assigned fixer.** *(sev #5)* `DONE` — real
   `git merge` through `agent-worktree.sh` (audit refuses out-of-scope paths; scaffold commits
   collapse at `finalize`). Mechanism: design-notes "Bash-agent isolation".
   **Open thread:** a true merge conflict makes the manager edit markers in a source file —
   collides with the manager-source fence (item 6); fold the merge-glue exception into that hook.

3. **Report consumption assumed verdict words the manager can't guarantee.** *(sev #8)* Fixed —
   every report carries a first-line `route:` field; manager routes on `route`, not section names
   (all 16 agents converted; SKILL "Reports — demand and consume" rebound). Grammar + schemas:
   `build-orchestration-report-schemas.md`.
   **Open:** build the `SubagentStop` validator hook (block-vs-warn, loop-guard — needs docs
   citation + user sign-off).

## Phase B — durable state infrastructure

4. **Anti-thrash state is in-context only.** *(sev #3)* The escalation ladder counts strikes per
   unit; nothing durable holds the count, which advisers ran clean, or which findings were
   accepted as risk. Long-session summarization drops these first → thrash returns as unrecognized
   re-attempts. Add a session-state file the later fixes record into. *Rides along:* prompt-log
   reconciliation.

## Phase C — discipline & enforcement

Built on the corrected flow and the state file.

5. **Subjective "Deploy when" triggers let advisers get skipped.** *(sev #6)* Review axes deploy
   on manager judgment with no floor; `correctness-adviser` (biggest v1 hole) is easiest to wave
   off as "trivial logic," and under-deployment is silent. Add a floor + record deployment into
   the Phase-B state. *Rides along:* visibility-widening enforcement.

6. **Manager can implement source itself — no structural fence.** *(sev #1)* The role preamble
   bars the manager from editing source, but the main session keeps `Edit`/`Write`/`Bash` and
   bypasses the worktree+audit gate every worker routes through. A prompt line can't hold a
   tool-carrying agent → needs a hook. Absorbs the item-2 merge-glue exception.

7. **Permission-mode self-check has no mechanism.** *(sev #2)* The spawning rule to confirm the
   session isn't in `bypassPermissions`/`acceptEdits` has no tool that reports the mode → narrated
   no-op. Shares a prerequisite with #8: teach the manager to read its session mode.

8. **User gate blocks; autonomous runs have no user.** *(sev #7)* The spec-gate decision (steps
   2–3) surfaces to the user as the sole path. In a loop/background context there is no user →
   hang, or invent a decision recorded as the user's. Reuses #7's session-mode introspection.

## Done

- **Adviser family** (2026-07-31) — 8 `*-adviser` defs carry their critic's review plus a scoped
  in-axis fix direction; the skill spawns advisers everywhere (spec gate included), `*-critic`
  twins kept for human sessions. Spec, SKILL.md, and report-schemas fully converted. Rationale:
  design-notes "Advisers = critic + fix direction".
- `researcher`/`verifier` cut from the skill (2026-07-31) — never spawned in the flow; advisers'
  inline fix direction made the reactive research path redundant. Defs stay for other callers.

## Lower severity (fold into the phase noted)

- **Debugger worktree must be discarded** (Phase A / item 2) — manager must remember not to merge
  it and to `remove`.
- **Visibility-widening rule** (Phase C / item 5) — undetectable without a careful diff read; its
  enforcer (`change-discipline-adviser`) only deploys "when the diff smells."
- **Prompt-log completeness** (Phase B / item 4) — easy to drop in parallel batches; nothing
  reconciles the log against actual spawns.
