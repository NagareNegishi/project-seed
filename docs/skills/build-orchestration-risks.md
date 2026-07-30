# Build Orchestration — risk backlog

Holes where the manager (the main session running `build-orchestration/SKILL.md`) can
drift from intended behavior. Each guarantee the skill makes leans on the manager's
discipline or on state it holds in context; these are the points where that fails.

Ordered by **fix sequence**, not severity: make the documented procedure correct first,
then build the durable state the discipline fixes write into, then add enforcement last
(you fence the machine after it runs correctly). Original severity rank kept as a tag.
Work top-down; mark an item `DONE` with the fix location when closed. Lower-severity
items note the phase they can ride along with.

Companion: `build-orchestration-design-notes.md` (why the calls were made).

## Phase A — make the documented flow correct

The Session-flow / consumption sections don't run as written. Fix the happy path before
hardening it.

1. **Blackbox test integration missing from the numbered flow.** *(severity #4)* `DONE` —
   new step 5 in SKILL.md lands blackbox tests into the repo test-dirs before the suite
   runs; step 6 gates the suite on source-merged **and** tests-landed; the blackbox
   spawning rule names the destination. *Ride-along DONE:* design-notes intro now states
   the manager drives isolation only through the `agent-worktree.sh` subcommands and the
   raw git commands document their internals / manual fallback.

2. **Parallel merges cause base drift with no assigned fixer.** *(severity #5)* Approach
   settled — **integrate by real `git merge`, not `git apply`.** The `audit` step already
   refuses any out-of-scope path before anything crosses, so the branch is wholly in-scope
   and branch-merge's all-or-nothing has nothing bad to admit; the path-filtering that
   forced `git apply --3way` is redundant. A real merge integrates off the true merge-base
   — concurrent non-overlapping edits auto-merge, and a conflict leaves standard markers +
   an unmerged index that blocks further work — where patch-apply faked a per-file ancestor
   (no ancestor for new shared files; half-applied state didn't block the next merge).
   Pruned test dirs merge safely (sparse-checkout skip-worktree → git won't stage the absent
   files as deletions, per git-update-index). Rationale in design-notes ("Integrate by
   branch-merge"). `DONE` — `agent-worktree.sh merge` now commits the audited changes onto
   `impl/<unit>` and `git merge`s that branch into main (idempotent re-run; empty/already-
   integrated branch is a no-op); SKILL merge bullet updated. Verified end-to-end: base-drift
   non-overlapping edits auto-merge and keep pruned tests, true overlap conflicts with markers
   staged in main, no-change unit is a clean no-op. History stays clean despite the per-unit
   commits: they are disposable scaffolding, collapsed at session end by `agent-worktree.sh
   finalize` (`reset --mixed` to the `start` stamp) into one gated `git-commit`-skill pass —
   nothing lands in branch history or reaches a remote until the user's final check (design-
   notes "Scaffold commits, collapsed at finalize"). SKILL failure-mode split holds: scope
   refusal (worker, strike 1) vs. true conflict (manager, never a strike); sequencing bullet
   names shared integration points.
   **Open thread:** the assigned fixer for a true conflict is the manager editing markers in
   a source file — collides with the manager-source fence planned in item 6; fold the
   merge-glue exception into that hook's design.
   *Ride-along (debugger-worktree-discard):* deferred to Phase A follow-up — still just
   the line-71 reminder, no mechanism yet.

3. **Report consumption assumes fields the manager can't guarantee.** *(severity #8)* The
   consume section routed on literal tokens (`clean`, `axis-bad`, `"Ambiguous"`, `"could
   not reproduce"`) that 7 of 8 critics and the researcher/debugger never emit — each
   critic's verdict is an axis-specific 3-way (`incorrect`/`correct`, `unsound`/`sound`,
   …; only `unreviewable` shared), so a well-formed report misrouted silently — worst case
   an axis-bad verdict read as `clean`.
   **Consumption side `DONE` (interim), superseded by format change.** SKILL "Reports —
   demand and consume" first routed on *which section is populated*, not the verdict word,
   with a fail-safe. That is being replaced by **approach A: change the report format at
   the source** so every report carries one normalized first-line `route:` field
   (`accept`/`fix`/`decide`/`redrive`, `+`-combinable) — the manager and hook route on
   `route`, not on section names. Design + per-agent mapping in
   `build-orchestration-report-format.md`.
   **Enforcement side — pulled forward from Phase C.** A `SubagentStop` hook keyed on
   `agent_type` validates that `last_assistant_message` carries the locator envelope and a
   `route:` value legal for that agent, and `decision: block`s a malformed report before it
   reaches the manager. It is a **pure validator**, not a converter (a converter would have
   to parse 16 flavors of NL prose — rejected). Grouped here, not in Phase C, because the
   report shapes are stable, the hook has no Phase-B dependency, and it shares no machinery
   with items 5–7. The consumption fail-safe already makes a malformed report *safe*
   (redrive); the hook upgrades that to fixed-in-place. Needs docs citation + user sign-off
   before writing (CLAUDE.md).
   **Report schemas collected** — `build-orchestration-report-schemas.md` transcribes all
   16 agent bodies (every section + condition); `route` maps from those. It stays the
   source of truth for body sections; `report-format.md` owns the `route` field the hook
   and manager bind to.
   **Open (next session):** apply `route` to the 16 agent files; rebind the SKILL to
   `route` (this closes the legal `Risks`-reads-as-clean bug — routing no longer touches
   section names); design the locator-envelope enforcement without confusing format for
   instruction; loop-guard; block-and-retry vs warn-only. Full list in report-format.md and
   the schema doc's "Open decisions".

## Phase B — durable state infrastructure

4. **Anti-thrash state is in-context only.** *(severity #3)* Escalation ladder (lines
   105–108) counts strikes per unit; nothing durable holds the count, "which critics ran
   clean," or "which findings were accepted as risk." Context summarization in a long
   parallel session drops these first — thrash walks back in as unrecognized re-attempts.
   Introduce a session-state file the later fixes record into. *Rides along:* prompt-log
   reconciliation below.

## Phase C — discipline & enforcement

Built on the corrected flow and the state file.

5. **Subjective "Deploy when" triggers let critics get skipped.** *(severity #6)* Review
   axes (lines 90–101) deploy on the manager's judgment with no floor. Correctness-critic
   — the biggest v1 hole per design notes — is the easiest to wave off as "trivial logic."
   Under-deployment is silent. Add a floor + record deployment into the Phase-B state.
   *Rides along:* visibility-widening enforcement below.

6. **Manager can implement source itself — no structural fence.** *(severity #1)* SKILL
   lines 12–13 bar the manager from editing source, but the main session keeps
   `Edit`/`Write`/`Bash`. The whole worktree+audit+merge model routes worker code through
   an audited gate; the manager is the one actor that bypasses all of it. A prompt line
   does not hold a tool-carrying agent (design notes make this exact argument for the git
   fence, never applied to the manager). The hard one — needs a hook.

7. **Permission-mode self-check has no mechanism.** *(severity #2)* SKILL lines 80–81
   require confirming the session is not in `bypassPermissions`/`acceptEdits` before a
   write-capable spawn, but the manager has no tool that reports its own mode. Becomes a
   narrated no-op. Shares a prerequisite with #8: teach the manager to read its session
   mode.

8. **User gate blocks; autonomous runs have no user.** *(severity #7)* Steps 2–3 and line
   40 surface decisions to the user as the sole path. In a loop/background context there
   is no user; undefined behavior — hang, or invent a decision and record it as the user's.
   Reuses the session-mode introspection from #7.

## Lower severity (fold into the phase noted)

- **Two documented merge paths** (Phase A / item 1) — SKILL `agent-worktree.sh merge` vs.
  design-notes manual `add -A`/`commit`/`merge`; mixing them can skip the audit gate.
- **Debugger worktree must be discarded** (Phase A / item 2) — line 71; correct behavior
  relies on the manager remembering not to merge and to `remove`.
- **Visibility-widening rule** (Phase C / item 5) — line 79 is undetectable without a
  careful diff read; its real enforcer (change-discipline-critic) only deploys "when the
  diff smells."
- **Prompt-log completeness** (Phase B / item 4) — lines 137–140 easy to drop in parallel
  batches; nothing reconciles the log against actual spawns.
