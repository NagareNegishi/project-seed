# Agent drafts — review findings (2026-07-22)

Pre-promotion review of the 15 agent drafts in this directory, so a future session
can promote from this doc without re-reading every draft. Nothing is promoted yet
(`.claude/agents/` does not exist).

## Environment facts `[VERIFIED 2026-07-22, filesystem]`

- `.claude/agents/` does **not** exist — promotion must create it. Claude Code
  only loads agents from there; the drafts are inert until copied.
- `docs/skills/build-orchestration.md` **exists** — `change-discipline-critic`'s
  reference to it (outside its Definition) is valid.
- `.claude/skills/` has `code-commenting` and `systematic-debugging` (referenced
  by `docs-critic` and `debugger`). `/simplify` and `/code-review` are built-in
  Claude Code skills, not project skills — referenced only in design notes, so
  they don't affect promoted agents.

## Spec verification `[VERIFIED 2026-07-22]`

Sources (official): `code.claude.com/docs/en/sub-agents.md` and `.../skills.md`.
**Verdict: the manager→worker design is valid per spec.** Re-verify only if Claude
Code changes the subagent/skill spec. Conclusions specific to our drafts:

- All 15 drafts have `name`+`description` (the only required fields) and use valid
  tool names → all launch-valid. (An unresolvable tool name fails the launch.)
- Manager→worker works: the main session (depth 0) spawns workers via `Agent`; no
  worker lists `Agent`, so none can fan out — the intended posture.
- CLAUDE.md auto-loads into custom subagents (only Explore/Plan skip it), so the
  skill re-passing CLAUDE.md constraints is redundant-but-harmless, not required.
- Skill `disable-model-invocation` is used correctly for the explicit
  `/build-orchestration` trigger.

**Do NOT add `context: fork` to `build-orchestration`.** That runs the skill (the
manager) itself as a subagent, contradicting "the manager IS the main session".
Keep the skill non-forked; the main session spawns workers via the `Agent` tool.

**Remaining (empirical, needs sign-off + fresh session):** a live end-to-end run —
promote an agent, open a NEW session (agents load only at session start), have the
manager spawn it. Cannot be exercised mid-conversation.

### Reference facts `[VERIFIED 2026-07-22, sub-agents.md]` (banked so this isn't re-researched)

- **All agent frontmatter fields** (only `name`+`description` required; rest
  optional): `tools` (allowlist; inherits all if omitted; unresolvable name →
  launch failure, :277), `disallowedTools` (denylist, :278), `model` (default
  `inherit`, :279), `permissionMode` (:280), `maxTurns` (:281), `skills`
  (preload into context, :282), `mcpServers` (:283), `hooks` (:284), `memory`
  (:285), `background` (default true as of v2.1.198, :745), `effort`
  (`low|medium|high|xhigh|max`, :287), `isolation` (:288), `color` (:289),
  `initialPrompt` (main-thread only, :290). `tools` accepts a comma-separated
  string OR a YAML list (:251).
- **Agent-file load precedence** (highest→lowest): managed settings → `--agents`
  CLI flag → project `.claude/agents/` → user `~/.claude/agents/` → plugin
  `agents/` (:160-168). Project wins over user on a `name` clash. Keep names
  unique across the whole project tree — same-dir duplicates load only one by
  filesystem order (:178).
- **Nesting**: subagents CAN spawn subagents as of v2.1.172 (:837), fixed max
  **depth 5** (:843); the `Agent` tool gates it — list it in `tools` to allow,
  omit/deny to forbid (:389, :847).
- **Context load into a custom subagent**: system prompt, task message, CLAUDE.md,
  git status, preloaded `skills`, sibling-agent roster (v2.1.206+). NOT loaded:
  parent conversation, parent's non-listed skills, parent system prompt. Only the
  built-in Explore/Plan agents skip CLAUDE.md + git status (:878).
- **Skill frontmatter fields** (`skills.md`, all optional, `description`
  recommended): `name`, `description`, `when_to_use`, `argument-hint`,
  `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`,
  `disallowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`,
  `shell`. `context: fork` runs the skill itself in a forked subagent — the
  pattern build-orchestration must NOT use (see above).

## Usage gap — validate before promoting (second pass)

These agents exist to be **used by** the `build-orchestration` skill (skill =
manager in the main session, agents = workers). Promotion is only worthwhile once
each agent has a valid invocation point in that skill. It currently does not.

**The built skill has drifted from its design doc.** `.claude/skills/build-orchestration/SKILL.md`
(2026-07-21) still runs the **v1 flow**; `docs/skills/build-orchestration.md`
(same day) expanded the design but SKILL.md was never updated:

- Step 4 spawns only `security-critic` + `design-critic`. The six new critics
  (`correctness`, `simplicity`, `performance`, `docs`, `legal`,
  `change-discipline`) have **no invocation point**.
- No escalation ladder, no `debugger` — step 2 still "send back / respawn if
  wedged", the thrashing behaviour Lever 2 was written to replace.
- `mcdc-tester` never referenced.

**8 of 15 drafts are orphaned** (wired: blackbox, whitebox, security, design,
researcher, verifier, alternatives-explorer + `implementer` as general-purpose).
So the review pass is per agent: **define its invocation in the skill → validate
the usage is coherent → wire it into SKILL.md → then promote.** Reconciling
SKILL.md with the design doc is the cross-cutting thread, done incrementally as
each orphaned agent (phase C/D below) is wired.

## Priority-ordered review/promotion plan

Order = agent's centrality to a working flow + cascade (settling one eases the
next). Each step carries a usage task, not just a draft read.

A. Spine (already wired) — set conventions the rest inherit:
1. `security-critic` — critic shape-anchor; confirm step-4 reviewer slot.
2. `design-critic` — pairs with security in step 4.
3. `blackbox-tester` — session-start tester; Lever 1 (frozen acceptance check).
4. `whitebox-tester` — post-code tester; xfail discipline mcdc reuses.

B. Advisory pair (wired optional):
5. `researcher` — reference-discipline anchor.
6. `verifier` — chains on researcher; review right after.

C. Orphaned critics (define invocation, wire step-4 fan-out, then promote):
7. `correctness-critic` — biggest hole; anchors the batch; add to step-4 fan-out.
8-11. `simplicity` / `performance` / `docs` / `legal` — identical slot; batch.
12. `change-discipline-critic` — needs the guardrails section wired into SKILL.md.

D. Flow-dependent + optional:
13. `alternatives-explorer` — generalize constraint-ids to the final critic set.
14. `debugger` — wire the escalation ladder (Lever 2) into step 2, then promote.
15. `mcdc-tester` — optional whitebox specialization; confirm optional slot.

## Verdict per draft

Ready = promote as written. Fix = defect to resolve first.

| Draft | Verdict |
| --- | --- |
| correctness-critic | Ready (anchor; conventions cascade from it) |
| security-critic | Ready (see finding 4, minor scope edge) |
| design-critic | Ready |
| simplicity-critic | Ready |
| performance-critic | Ready |
| docs-critic | Ready |
| legal-critic | Ready |
| change-discipline-critic | Ready |
| whitebox-tester | Ready |
| researcher | Ready |
| verifier | Ready |
| alternatives-explorer | **Fix then promote** (finding 1 — decided: generalize) |
| blackbox-tester | Ready, **accept caveat** (finding 2) |
| mcdc-tester | **Promote** (decided); wire optional slot (finding 3) |
| debugger | **Promote** (decided); wire escalation ladder (finding 3) |

11 ready, 1 accept-caveat, 1 fix-then-promote, 2 promote-with-usage-wiring. All
15 are slated to promote; none held.

## Findings (worst first)

1. **alternatives-explorer — stale constraint-id scheme.** Its Definition hardcodes
   constraint ids to `S1/S2` (security) and `D1/D2` (design) — written when v1
   review was only those two critics. README now lists 8. **Decided (user):
   generalize the id scheme to any critic** (per-critic prefix). Apply when the
   critic set is final (phase D).

2. **blackbox-tester — "never read the implementation" is prompt-only.** Its
   toolset (`Read`, `Bash`) can reach any source file; no tool restriction can
   scope `Read` to spec files. The guarantee rests on the prompt + the **Spec
   basis** report line, not enforcement. Promotion = accept the caveat. Tighter
   enforcement (sandbox / path allowlist) is a future option.

3. **Two borderline drafts** (their own design notes asked "worth a standing
   agent?"). **Decided (user): promote both.** Usage must be wired:
   - `mcdc-tester` — optional whitebox specialization; wire its optional slot.
   - `debugger` — wire it as the escalation-ladder teeth (Lever 2) in SKILL.md,
     which currently lacks the ladder.

4. **security-critic — minor scope edge.** Lists "vulnerable or abandoned
   dependencies" as a hunt item but has no Bash, so it can Read manifests and
   WebFetch advisories but not run `npm audit`. `legal-critic` (has Bash) covers
   the manifest angle. Acceptable; noted so it isn't mistaken for an omission.

## Structural notes (all drafts)

- Critics mirror `security-critic`'s shape (hunt list → evidence-per-finding →
  honest ranking → "Checked, no finding" → stay-in-lane). The manager consumes
  every critic report uniformly. This is the family's core invariant — preserve it.
- Toolset split is consistent and reasoned: testers get `Write/Edit/Bash`;
  code-inspecting critics get `Read/Grep/Glob/Bash` (no Write/Edit); idea/web
  critics + researcher/verifier/alternatives-explorer get read-only + web, no Bash
  ("never test an exploit / never act"); `legal-critic` adds Bash for manifests.

## Decisions (all resolved with user)

- **Scope** → the agents are *used by* the `build-orchestration` skill; validate
  and define each agent's usage in that skill first, then promote (see "Usage
  gap"). Not agents-in-isolation.
- **Borderline drafts** → promote all 15; none held (findings 1, 3).
- **Model field** → no agent sets `model:`; set it per-agent when writing each
  file, inherit by default (omit the line). Spec confirms omitted = `inherit`.
- **Role** → user drives the review; this session supports with source-backed
  verification and doc-keeping.

Still live (to settle *during* the pass, not before — user direction): singleton
critics vs. one broad `code-reviewer`; pre-build vs post-code critic gate;
change-discipline always-on vs on-demand (see `docs/skills/build-orchestration.md`
"Still open").

## Promotion procedure (from README, for next session)

Per agent, with user sign-off:
1. Create `.claude/agents/` if absent, copy the Definition code block to
   `.claude/agents/<agent-name>.md` (Definition only — status/design notes dropped).
2. Confirm the agent appears in the available-agents list in a new session.
3. Update the draft's `Status:` line to `promoted <date>`.

Fix `alternatives-explorer` (finding 1) before its copy. Resolve the two open
decisions before touching `mcdc-tester` / `debugger`.
