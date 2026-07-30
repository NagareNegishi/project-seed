# Build Orchestration — risk backlog

Holes where the manager (the main session running `build-orchestration/SKILL.md`) can
drift from intended behavior. Each guarantee the skill makes leans on the manager's
discipline or on state it holds in context; these are the points where that fails.

Ordered by **fix sequence**, not severity: make the documented procedure correct first,
then build the durable state the discipline fixes write into, then add enforcement last
(you fence the machine after it runs correctly). Original severity rank kept as a tag.
Work top-down; mark an item `DONE` with the fix location when closed.

Companion: `build-orchestration-design-notes.md` (why the calls were made).

## Phase A — make the documented flow correct

1. **Blackbox test integration missing from the numbered flow.** *(sev #4)* `DONE` —
   SKILL step 5 lands blackbox tests into the repo test-dirs before the suite runs; step 6
   gates the suite on source-merged **and** tests-landed; the blackbox spawning rule names
   the destination.

2. **Parallel merges cause base drift with no assigned fixer.** *(sev #5)* `DONE` —
   integrate by real `git merge`, not `git apply`. `agent-worktree.sh merge` commits the
   audited changes onto `impl/<unit>` and merges that branch into main; the `audit` refuses
   any out-of-scope path before anything crosses, so branch-merge integrates off the true
   merge-base (non-overlapping edits auto-merge; a real conflict leaves markers + an unmerged
   index that blocks further work). Pruned test dirs survive (sparse-checkout skip-worktree).
   Per-unit scaffold commits collapse at `finalize` (`reset --mixed` to the `start` stamp)
   into one gated `git-commit` pass — nothing reaches history or a remote until the user's
   final check. Rationale + mechanism: design-notes "Bash-agent isolation".
   **Open thread:** the fixer for a true conflict is the manager editing markers in a source
   file — collides with the manager-source fence (item 6); fold the merge-glue exception into
   that hook's design. *Ride-along (debugger-worktree-discard):* deferred — still just the
   line-71 reminder, no mechanism yet.

3. **Report consumption assumes fields the manager can't guarantee.** *(sev #8)* The consume
   section routed on literal tokens (`clean`, `axis-bad`, `"Ambiguous"`, `"could not
   reproduce"`) that 7 of 8 critics and researcher/debugger never emit — each critic's verdict
   is an axis-specific 3-way (only `unreviewable` shared) — so a well-formed report misrouted
   silently (worst case an axis-bad verdict read as `clean`).
   **Fix — approach A: normalize the format at the source.** Every report carries a first-line
   `route:` field (`accept`/`fix`/`decide`/`redrive`, `+`-combinable); manager and hook route
   on `route`, not section names. Design, per-agent mapping, and body schemas:
   `build-orchestration-report-schemas.md`.
   **Status:** consumption fail-safe interim in place; **all 16 agents converted** (8 critics,
   3 testers, implementer, 4 advisory). Per-agent value-sets, rule 4, and body schemas in the
   schemas doc.
   **Open:** rebind the SKILL "Reports — demand and consume" to `route` (closes the legal
   `Risks`-reads-as-clean bug — routing no longer touches section names); then build the
   `SubagentStop` validator hook (block-vs-warn, loop-guard — pure validator, needs docs
   citation + user sign-off).

## Phase B — durable state infrastructure

4. **Anti-thrash state is in-context only.** *(sev #3)* Escalation ladder (lines 105–108)
   counts strikes per unit; nothing durable holds the count, "which critics ran clean," or
   "which findings were accepted as risk." Context summarization in a long parallel session
   drops these first — thrash walks back in as unrecognized re-attempts. Introduce a
   session-state file the later fixes record into. *Rides along:* prompt-log reconciliation.

## Phase C — discipline & enforcement

Built on the corrected flow and the state file.

5. **Subjective "Deploy when" triggers let critics get skipped.** *(sev #6)* Review axes
   deploy on the manager's judgment with no floor. Correctness-critic — the biggest v1 hole
   per design notes — is the easiest to wave off as "trivial logic." Under-deployment is
   silent. Add a floor + record deployment into the Phase-B state. *Rides along:*
   visibility-widening enforcement.

6. **Manager can implement source itself — no structural fence.** *(sev #1)* SKILL lines
   12–13 bar the manager from editing source, but the main session keeps `Edit`/`Write`/`Bash`.
   The whole worktree+audit+merge model routes worker code through an audited gate; the manager
   is the one actor that bypasses all of it. A prompt line does not hold a tool-carrying agent.
   The hard one — needs a hook.

7. **Permission-mode self-check has no mechanism.** *(sev #2)* SKILL lines 80–81 require
   confirming the session is not in `bypassPermissions`/`acceptEdits` before a write-capable
   spawn, but the manager has no tool that reports its own mode. Becomes a narrated no-op.
   Shares a prerequisite with #8: teach the manager to read its session mode.

8. **User gate blocks; autonomous runs have no user.** *(sev #7)* Steps 2–3 and line 40
   surface decisions to the user as the sole path. In a loop/background context there is no
   user; undefined behavior — hang, or invent a decision and record it as the user's. Reuses
   the session-mode introspection from #7.

## Proposal — critic-suggested fixes (not yet sequenced)

Large change, not yet accepted; documented here so the decision has context. Touches the
SKILL, every critic agent def, and the report-schemas doc — sequence into a phase once decided.

**The hole.** When a critic surfaces a problem the manager has no fix for, the flow's only move
is to route it to an `implementer` as a fix unit. But an implementer needs to be told *what* to
build, so the manager must guess an approach and dispatch **blind**. Options (`alternatives-explorer`)
are reachable only *reactively*, gated behind the escalation ladder: two failed implementer
attempts → `debugger` → then alternatives. There is no path from "problem with no known fix"
straight to getting an approach before dispatch.

**Root cause.** Critics report problems but are contracted *not* to suggest fixes (every critic
def: "does not fix anything, suggest alternatives, or judge design"). So the fix direction never
rides along with the problem, even when the critic — the actor with the most context on it —
has an obvious one.

**Proposed change.** Let a critic emit an axis-scoped **fix direction** alongside a problem, and
route on it:
- critic gives one clear, obvious fix direction → manager routes to an `implementer` as a now-bounded unit;
- no direction given, or multiple with no clear winner → surface to the user.

Composed with the manager's existing authority test: a critic's "obvious" fix is obvious only
*on its axis* (a security-critic can't see design ramifications), so a clear direction that
**touches design or spec still surfaces to the user**; only clear-and-in-spec goes straight to
the implementer.

**Surfaces to change.**
- Every critic agent def — reverse the "does not suggest alternatives" clause, scoped to a
  fix *direction on its own axis only*, not a design.
- Report-schemas doc — critics carry an optional fix-direction field in the body; `route`
  grammar unaffected (still `accept`/`fix`/`decide`/`redrive`).
- SKILL step 11 + guardrails ladder — add the proactive branch (clear→implementer,
  ambiguous/design→user) ahead of the reactive `alternatives-explorer` path, which stays as
  the implementer-failed fallback.

**Open questions.**
- Does an axis-scoped "fix direction" bleed critics back into design work the split was meant to
  prevent (a critic tunnel-visioning on its own fix and under-reporting)? The scoping is the
  guard; confirm it holds.
- Whether this makes the orphaned advisory agents cuttable: options-gathering moves onto the
  critic (obvious case) or the user (ambiguous case), so `alternatives-explorer` becomes optional
  and `researcher`/`verifier` — already never spawned anywhere in the flow — genuinely droppable.
  Decide cut-vs-wire for those in the same pass.

## Lower severity (fold into the phase noted)

- **Debugger worktree must be discarded** (Phase A / item 2) — line 71; correct behavior
  relies on the manager remembering not to merge and to `remove`.
- **Visibility-widening rule** (Phase C / item 5) — line 79 is undetectable without a careful
  diff read; its real enforcer (change-discipline-critic) only deploys "when the diff smells."
- **Prompt-log completeness** (Phase B / item 4) — easy to drop in parallel batches; nothing
  reconciles the log against actual spawns.
