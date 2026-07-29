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

1. **Blackbox test integration missing from the numbered flow.** *(severity #4)* Step 4
   spawns blackbox into `.agent-scope/`; "move the written tests out" (lines 82–83) names
   no destination and is not a numbered step; the implementer worktree prunes test-dirs.
   A manager following steps 1–11 literally can reach "run the blackbox suite" (step 5)
   with the tests never moved into main's test-dirs — a green suite that tests nothing.
   *Rides along:* the two-documented-merge-paths cleanup below.

2. **Parallel merges cause base drift with no assigned fixer.** *(severity #5)* All
   worktrees `add` from HEAD at spawn; once one unit merges, the others are behind. On
   overlap the patch fails as "base drift" (script 147–151) — not an implementer strike,
   so the escalation ladder does not cover it. The remedy ("rebase the worktree") has no
   owner: the implementer is git-fenced, the manager's role bars working inside worktrees.
   *Rides along:* debugger-worktree-discard reminder below.

3. **Report consumption assumes fields the manager can't guarantee.** *(severity #8)* Line
   115 imposes no format, yet lines 118–133 route on specific tokens (`Verdict`, `Suite`,
   `Root cause`). A critic phrasing its verdict differently misroutes silently — worst
   case `axis-bad` read as `clean`. Settle the consumption contract; it is the other half
   of the flow.

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
  design-notes manual `add -A`/`diff`/`apply`; mixing them can skip the audit gate.
- **Debugger worktree must be discarded** (Phase A / item 2) — line 71; correct behavior
  relies on the manager remembering not to merge and to `remove`.
- **Visibility-widening rule** (Phase C / item 5) — line 79 is undetectable without a
  careful diff read; its real enforcer (change-discipline-critic) only deploys "when the
  diff smells."
- **Prompt-log completeness** (Phase B / item 4) — lines 137–140 easy to drop in parallel
  batches; nothing reconciles the log against actual spawns.
