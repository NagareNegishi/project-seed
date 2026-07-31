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

## Adviser family — critics that carry a fix direction (decided; current active work)

Decided 2026-07-31. Ahead of the SKILL text polish. Adds 8 agent files, updates the
report-schemas doc and the SKILL; critic defs are **not** touched.

**The hole.** When a critic surfaces a problem the manager has no fix for, the flow's only move
is to route it to an `implementer` as a fix unit. But an implementer needs to be told *what* to
build, so the manager must guess an approach and dispatch **blind**. Options (`alternatives-explorer`)
are reachable only *reactively*, gated behind the escalation ladder: two failed implementer
attempts → `debugger` → then alternatives. There is no path from "problem with no known fix"
straight to getting an approach before dispatch. The point of the skill is that the manager
offloads implementation thinking — every axis it reviews should be able to hand a direction back,
not leave the manager inventing one.

**Root cause.** Critics are contracted *not* to suggest fixes ("does not fix anything, suggest
alternatives, or judge design"), so the fix direction never rides along with the problem even
when the critic — the actor with the most context on it — has an obvious one.

**Decision — a parallel adviser family, not a change to the critics.** Reversing the no-suggest
clause inside the critics was rejected: a human reading a critique wants the problem, not the
agent pre-committing to a fix that biases the call, whereas the manager-agent needs the opposite.
Same finding, different consumer → two agents.

- **New one-stage adviser family, all 8 axes.** An adviser = its critic's review **plus** a
  scoped fix direction, produced in the same spawn (the reviewer already holds the most context
  on the fix, so adding the direction there is near-free and avoids a cold second spawn).
- **All 8, not a subset.** Leaving any axis without an adviser leaves the manager inventing fixes
  on that axis, which defeats the skill's premise.
- **This skill spawns advisers, not critics.** An adviser is a superset of its critic, so the
  Review-axes table swaps 8 critics → 8 advisers; `mcdc-tester`/`debugger` unchanged. The critics
  go unused by the skill and are kept only for interactive/human sessions.

**Route grammar (per adviser).** `accept` (clean, no problem) \| `fix` (one clear in-axis
direction → implementer, carry the direction) \| `decide` (zero / multiple directions, or one
that touches design or spec → user) \| `redrive` (unreviewable). The scoping guard: a fix is
"obvious" only *on its own axis* (a security-adviser can't see design ramifications), so any
direction reaching beyond its axis routes to `decide`, never straight to the implementer.

**Change set (~11 files).**
- **8 new `*-adviser` agent defs** in `.claude/agents/` (1:1 suffix swap on the critic names:
  `correctness-adviser`, `security-adviser`, …).
- **Report-schemas doc** — add the adviser family: their route value-sets, and the new
  fix-direction body section. `route` grammar itself unchanged (`accept`/`fix`/`decide`/`redrive`).
- **SKILL** — Review-axes table (swap the 8 agents), step 11 (proactive branch clear→implementer
  / else→user, *ahead* of the reactive `alternatives-explorer` fallback, which stays for the
  implementer-failed case), and the Reports section (adviser consumption block).

**Dedup, not 8 copies.** An adviser is a near-copy of its critic; 8 copy-pasted pairs will drift.
Factor the shared axis-review body into one reference both the critic and its adviser point at
(the move `new-skills.md` plans for `code-commenting`/`comment-audit`) so only the suggest-clause
differs. Settle the exact mechanism when drafting the first adviser.

**Build approach.** Draft one adviser end-to-end (agent def + schemas entry + its slice of the
SKILL), get it reviewed, then model the other 7 on it.

**Resolved / still separate.**
- The bleed-back worry (a critic tunnel-visioning on its own fix and under-reporting) is moot for
  the critics — they are untouched. For advisers the axis-scoping is the guard: in-axis direction
  only, anything cross-axis → `decide`.
- `alternatives-explorer` stays as the reactive post-implementer-failure fallback (ladder step 3).
- `researcher`/`verifier` are never spawned anywhere in the flow — a separate roster-consistency
  item (wire a spawn path or cut them), not part of this change.

## Lower severity (fold into the phase noted)

- **Debugger worktree must be discarded** (Phase A / item 2) — line 71; correct behavior
  relies on the manager remembering not to merge and to `remove`.
- **Visibility-widening rule** (Phase C / item 5) — line 79 is undetectable without a careful
  diff read; its real enforcer (change-discipline-critic) only deploys "when the diff smells."
- **Prompt-log completeness** (Phase B / item 4) — easy to drop in parallel batches; nothing
  reconciles the log against actual spawns.
