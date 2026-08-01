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
   **Resolved:** a true merge conflict makes the manager edit markers in a source file — this is
   legitimate merge glue, not a fenced act (item 6 accepted, no hook).

3. **Report consumption assumed verdict words the manager can't guarantee.** *(sev #8)* `DONE` —
   every report carries a first-line `route:` field; manager routes on `route`, not section names.
   Enforced by the `SubagentStop` hook `route-guard.sh` (block + section-presence, 14-agent
   roster, `route-spec.json` conditions). Schemas + hook: `build-orchestration-report-schemas.md`.

## Phase B — durable state infrastructure

4. **Anti-thrash state is in-context only.** *(sev #3)* `DONE` — the ladder's per-unit strike
   count lived only in context (first thing summarization drops → thrash as unrecognized
   re-attempts). Fix: `build-orchestration/strike-count.md` (gitignored, `<unit>: <n>/2`) —
   created fresh at Prerequisites, seeded when a unit's implementer spawns, bumped on build
   failure or implementer scope-refusal, re-read before each escalation decision. Scoped to
   strikes only (adviser dispositions and accepted-risk tracking cut). Rationale: design-notes
   "Escalation strike count".

## Phase C — discipline & enforcement

Built on the corrected flow and the state file.

5. **Subjective "Deploy when" triggers let advisers get skipped.** *(sev #6)* `DONE` — the real
   hole was narrow: only `correctness` (near-default, highest value, silent skip) and the
   objectively-triggered `security`/`legal`. Fix: a `Must` column in the Review axes table marks
   those three `●`; the note makes `●` a floor ("never skip"), `—` stays judgment. Scoped down
   from the proposed general deployment record — the prompt-log already shows what deployed, so
   skips are inferable; no new state. Visibility-widening enforcement deferred, not folded in.

6. **Manager can implement source itself.** *(sev #1)* `ACCEPTED — not a real risk.` The manager
   legitimately needs `Edit`/`Write`/`Bash` throughout, so no block is possible; delegation
   discipline is backstopped by the finalize diff (step 13) and the author-blind review (step 9).

7. **Permission-mode self-check.** *(sev #2)* `ACCEPTED — not a real risk.` A `PreToolUse` `deny`
   hook blocks in every mode including `bypassPermissions` (verified 2026-08-01, CC 2.1.207), so
   the blackbox jail (§12) is mode-independent; the rule was removed from SKILL/design.

8. **User gate blocks; autonomous runs have no user.** *(sev #7)* `ACCEPTED — not a real risk.`
   The skill is interactive by design (`disable-model-invocation`, many user gates), so the no-user
   scenario is outside its envelope; the manager resolving the gate itself is already forbidden by
   steps 2–3 ("not yours to resolve").

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
- **Prompt-log completeness** (standalone) — easy to drop in parallel batches; nothing
  reconciles the log against actual spawns. Considered for item 4's file and cut (guards only a
  gitignored artifact).
