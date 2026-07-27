# Build Orchestration — design notes & next steps

Companion to `build-orchestration.md` (the skill-source spec). That doc says *what*
to build; this one holds *why* the calls were made, what's still open, and where
the next session picks up. All v2 design decisions are settled — nothing here
blocks the wiring below.

## Next session — start here

A v1 SKILL.md already exists at `.claude/skills/build-orchestration/SKILL.md`. The
job is to re-wire it to the v2 spec in `build-orchestration.md`:

- **Review layer**: replace v1's `security`+`design` pair with the eight-critic
  roster, spawned *by manager allocation* (not all, always), and capture the
  allocation in `docs/prompt-log/allocation.md`.
- **Pre-build gate**: add `security-critic` + `design-critic` over the unit *spec*,
  allocated, parallel with `blackbox-tester`, before implementers build.
- **Spawning rules**: add Lever 1's two rules (fix units exclude test files; no
  visibility widening for test convenience).
- **Escalation**: replace the v1 step-2 thrash loop with the Lever 2 ladder +
  `debugger` (strike count is a "once or twice" placeholder — tune after a run).
- **Optional slots**: add the `mcdc-tester` slot; wire `change-discipline-critic`
  as an on-demand allocated critic (spawned on diff-smell, not always-on).
- **Prerequisites**: refresh for the full promoted roster.

Follow `new-skills.md`: directive voice, stack-agnostic `<placeholder>` markers, one
section at a time. Then promote the required agents (user-sign-off only), exercise
the skill on a real session, and record what the flow gets wrong.

## Rework backlog — post-promotion (2026-07-27)

All 15 agents are promoted to `.claude/agents/`. Reconcile the SKILL and this
spec set against what is now built. Fixes land in `SKILL.md` **and**
`build-orchestration.md` unless noted; source them from the live agent files.

**Report shapes are a family resemblance, not one shape.** Only the 8 critics
carry the `Target · Verdict · Problems · Checked · Out of scope` shape with the
`<axis-bad> | clean | unreviewable` Verdict. Testers and advisory deviate (see
`authoring.md §2`/§10). The shared invariant is only: evidence per finding, honest
ranking where severity applies, every section always present (write "none"), report
is the final message. Per-family section sets:

- **critics (×8)**: Target · Verdict · Problems (`critical→low`) · Checked · Out of scope.
- **blackbox**: Spec basis · Tests · Findings (`high→low`) · Open. No Verdict; writes files.
- **whitebox**: Tests · Suite · Findings (`critical→low`) · Checked · Open. Runs suite.
- **mcdc**: Decisions covered · Coverage · Tests · Suite · Findings · Open. Runs suite.
- **researcher**: two shapes — (Task · Ambiguity · Needed) or (Task · Answer · Findings · Unverified · Gaps).
- **verifier**: Verdict (PASS/FAIL overall) · Claims (`pass|fail` each) · Notes.
- **alternatives-explorer**: Goal · Constraints · Alternatives · Recommendation.
- **debugger**: Failure · Root cause · Fix location · Also-noticed · Open; "could not reproduce" fallback.

Items:

1. **Fix the report-shape pointer (3 places).** SKILL "Report format" (L133–135)
   and `build-orchestration.md` L168–172 cite `docs/agents/README.md` for the
   shared shape; that text is not there. Repoint to `authoring.md §2` (+§10) and
   describe it as a family resemblance with per-family deviation.
2. **Add per-family report-handling** (the manager currently has none):
   - critics → read Verdict: axis-bad → triage Problems by severity into batched
     fix units (critical/high block close-out, low → build-log accepted risk);
     `unreviewable` → stage missing input and respawn, or record the uncovered axis
     (feeds allocation `miss`); `clean` → record Checked.
   - testers → no Verdict; read Findings, and for whitebox/mcdc the Suite line — an
     xfail/skip parked against a Finding is an open bug → fix unit. blackbox Findings
     are spec gaps the manager resolves, not an implementer.
   - researcher → Ambiguous shape bounces back to the manager; pair a Researched
     report with `verifier`; a verifier `FAIL` blocks acting on it.
   - alternatives-explorer → consume its single Recommendation into a design decision,
     then a fix unit.
   - debugger → Root cause + Fix location feed the next fix unit; "could not
     reproduce" is an escalation, not a fix.
3. **Wire tester confinement + permission-mode check into the SKILL** (built, but
   SKILL has none of it): stage files into `.agent-scope/`; serialize blackbox and
   whitebox (shared root); confirm the session is not `bypassPermissions`/
   `acceptEdits` before spawning (overrides the jail, unreadable from config); audit
   `git status --porcelain` around each write-capable spawn (source: `authoring.md §12`,
   "Configure after implementing" below). Confirm the jail asymmetry is intended —
   blackbox frontmatter carries the `PreToolUse` jail hook, whitebox does not.
4. **Demote Prerequisites to a one-line guard.** All 15 promoted; drop the
   promotion instructions, keep "confirm present, stop if missing" + the
   minimum-roster line for degraded runs.
5. **Record section: add `evaluations.md`.** SKILL Record lists prompt-log +
   `allocation.md` but omits `evaluations.md` (deferred per-spawn prompt judgment),
   defined in `build-orchestration.md` L145–147 and `prompt-log/README.md`.
6. **Move both logs out of `docs/` under a shared, source-named parent.** `docs/`
   is for planning/reference; both are runtime logs from one source, so they do
   not belong there. Collect them under a top-level `build-orchestration/` (named
   for the producing system, not a generic `logs/` that another tool would claim):
   - `build-orchestration/build-log/` — committed, durable per-session record.
   - `build-orchestration/prompt-log/` — gitignored captures + `evaluations.md` +
     `allocation.md`; only `README.md` + `_template.md` tracked.
   Keep the two separate; `.gitignore` does the committed/ignored split, relocated
   as-is. `.agent-scope/` stays put — it is ephemeral jail *staging*, not a log.
   Ripples: path references in `SKILL.md`, `build-orchestration.md`,
   `prompt-log/README.md`, `.gitignore`, and the paths in items 1/2/5. Not in
   CLAUDE.md — the skill already points to build-log.

## Why these calls (rationale)

- **Skill, not a doc.** The orchestration is a *procedure* that self-triggers on
  its `description`, and loads only when a build session starts (a fraction of
  sessions) rather than sitting in `CLAUDE.md`. The manager *is* the main session,
  so its instructions belong in a skill; the workers need isolation and scoped
  tools, so they are subagents. Skill for the manager, agents for the workers.
- **Never `context: fork` this skill.** `context: fork` would run the skill (the
  manager) itself as a subagent, contradicting "the manager IS the main session".
  Keep build-orchestration non-forked; the main session spawns workers via the
  `Agent` tool.
- **Eight atomic critics, one axis each** — not one broad `code-reviewer`. Atomic
  single-axis designs compose cheaply later (merge into a bundle, or spin a new
  multi-aspect agent); splitting a bundle back into clean axes is a rewrite.
  Correctness was the biggest v1 hole: the only defence against a logic bug was the
  test agents; nothing read the merged code hunting the edge case the tests never
  encoded.
- **Only `security` + `design` gate the spec pre-build.** Their drafts are written
  for idea targets ("either an idea … or an implementation"). The other axes are
  code-only ("you receive an implementation"), so they cannot review a spec — an
  earlier note that `correctness` could gate the spec was wrong and was dropped.
- **`debugger` is a standing agent.** The `systematic-debugging` skill owns
  root-cause discipline, but an isolated agent keeps diagnosis off the manager's
  context when the loop stalls, and it is the teeth of the escalation ladder.
- **`mcdc-tester` stays optional.** MC/DC earns its combinatorial test cost only on
  decision-dense units (auth rules, pricing, validation, state machines). Caveat:
  most stacks cannot *measure* MC/DC coverage out of the box, so the agent designs
  cases by analysing conditions and states where it cannot verify the number.

## Configure after implementing

Knobs to set or tune once the skill exists and has run at least once:

- **Escalation-ladder strike count — set to 2.** Failed implementer attempts before
  the manager must stop and spawn `debugger` (Lever 2). 2 is the starting value; tune
  after a real run — too low wastes a diagnosis spawn on a typo, too high lets the
  thrash back in.
- **Confirm permission mode before spawning.** Subagents inherit the session mode;
  `bypassPermissions`/`acceptEdits` overrides the per-agent path-jail and can't be
  read from config. Have the manager confirm the mode with the user before spawning
  workers.
- **whitebox-tester search tools — none for now.** Trimmed to `Read, Write, Edit, Bash`
  (no `Grep`/`Glob`): it works from the impl files the manager stages, and `Bash` reaches
  any file so search tools add no confinement. Re-add `Grep` if a real run shows it
  branch-tracing a large implementation and needing to search within it.

## Still open

- **Relationship to `verify-fanout`.** Kept separate for now: build uses the inline
  `researcher`/critic agents; `verify-fanout` stays its own planning-time
  external-verification path. Whether the manager can *offer* `verify-fanout` inside
  a build session depends on how that workflow lands. Revisit once it is built.
