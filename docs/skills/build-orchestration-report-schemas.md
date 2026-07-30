# Build Orchestration — subagent report schemas

The single source of truth for every worker's report structure. Two consumers bind to
it: the manager's consumption routing (SKILL "Reports — demand and consume") and the
planned `SubagentStop` format-enforcement hook (risk backlog item 3, enforcement side).
Transcribed verbatim from the 16 `.claude/agents/*.md` files — do not route on anything
not recorded here, and update this doc in the same change as any agent report edit.

Companion: `build-orchestration-risks.md` item 3, `build-orchestration.md` "Consuming
reports", `docs/agents/authoring.md` §2/§10 (the shared-shape rule these derive from).

## Universal invariants

- **Every section always appears; write "none" when empty.** Holds for all 16 agents
  except `alternatives-explorer` (no such note; structure still fixed). So absence of a
  section = a malformed report, not an empty one.
- **The report is the agent's final message.** Returned to the manager as the `Agent`
  tool result / `last_assistant_message`.
- **`unreviewable` is the only verdict word shared across critics.** The bad/clean words
  are axis-specific (table below). Routing on a literal `clean`/`axis-bad` was the item-3
  bug.

## Critics (8) — shared 5-section shape, with per-critic deviations

Section order is: `<target>` · `Verdict` · `<findings>` · `<clean>` · `Out of scope`.
The header names are **not** uniform — three critics rename a section:

| Critic | target hdr | Verdict: bad \| clean \| unreviewable | findings hdr (if bad) | clean hdr (if clean) | severity scale |
| --- | --- | --- | --- | --- | --- |
| correctness-critic | `Target` | `incorrect` \| `correct` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |
| security-critic | `Target` | `vulnerable` \| `clean` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |
| design-critic | `Target` | `unsound` \| `sound` \| `unreviewable` | `Problems` | **`Challenged`** | critical/high/medium/low |
| simplicity-critic | `Target` | `overcomplicated` \| `simple` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| performance-critic | `Target` | `inefficient` \| `efficient` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| docs-critic | `Target` | `deficient` \| `sufficient` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| legal-critic | `Target` | `risks-found` \| `none-found` \| `unreviewable` | **`Risks`** | `Checked` | high/medium/low |
| change-discipline-critic | **`Mandate`** | `undisciplined` \| `disciplined` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |

Deviations that break naive routing:
- **legal-critic findings live under `Risks`, not `Problems`.** Routing bad on
  "`Problems` populated" misses every legal risk → silent clean. (Current SKILL bug — see
  Open decisions.)
- **design-critic's clean section is `Challenged`, not `Checked`.**
- **change-discipline-critic's first section is `Mandate`, not `Target`.**
- **legal-critic keeps a standing legal-advice note in `Out of scope` that always stays**,
  even when everything else is "none".
- **Severity scale is not uniform.** Only correctness, security, design, change-discipline
  carry `critical`; simplicity, performance, docs, legal top out at `high`. The manager's
  "critical/high block close-out" means "high" is the top block-trigger on those four axes.

Every critic: `Verdict` is exactly the 3-way above; `<findings>` required iff bad;
`<clean>` required iff clean; `Out of scope` required iff unreviewable.

## Testers (3) — no `Verdict`

| Tester | sections, in order | findings hdr | severity | has `Suite` |
| --- | --- | --- | --- | --- |
| blackbox-tester | `Spec basis` · `Tests` · `Findings` · `Open` | `Findings` | high/medium/low | no |
| whitebox-tester | `Tests` · `Suite` · `Findings` · `Checked` · `Open` | `Findings` | critical/high/medium/low | yes |
| mcdc-tester | `Decisions covered` · `Coverage` · `Tests` · `Suite` · `Findings` · `Open` | `Findings` | critical/high/medium/low | yes |

- All three carry an **`Open`** section (anything needing a manager decision) — the
  manager must consume it, not just `Findings`.
- `blackbox` `Findings` are **spec gaps** the manager resolves, never routed to an
  implementer. Its `Findings` severity is high/medium/low (no `critical`), and it has no
  `Suite` (it never runs the tests — no shell).
- `whitebox`/`mcdc` `Suite`: an xfail/skip parked against a `Finding` = an open bug → fix
  unit.

## Implementer (1)

Sections, in order: `Done` · `Build` · `Decisions` · `Open`.
- `Build` = the build/typecheck run and its result: **`pass`, or `fail` with the failing
  output** — the manager's escalation-ladder trigger.
- `Open` = anything it stopped on (spec gap/conflict, a needed out-of-unit change, a
  decision beyond its unit) → a manager decision.
- Every section always appears; "none" when empty.

## Advisory (4)

| Agent | sections, in order | routing signal |
| --- | --- | --- |
| debugger | `Failure` · `Root cause` · `Fix location` · `Also-noticed` · `Open` | `Root cause` + `Fix location` → next fix unit. **No-repro = `Root cause: none`** (what it tried goes under `Failure`, "none" for the rest) — an escalation, not a fix. `Also-noticed` = an unrelated second bug handed back. |
| researcher | **two alternate structures** | Ambiguous: `Task` · `Ambiguity` · `Needed`. Researched: `Task` · `Answer` · `Findings` · `Unverified` · `Gaps`. Discriminator: `Needed` present (bounce back to manager) vs `Answer` present (usable). |
| verifier | `Verdict` · `Claims` · `Notes` | `Verdict` = **`PASS` or `FAIL`** overall (FAIL if any claim fails). `Verdict: FAIL` blocks acting on the researched answer. |
| alternatives-explorer | `Goal` · `Constraints` · `Alternatives` · `Recommendation` | take the single `Recommendation` into a design decision, then a fix unit. (No "every section none" note; structure still fixed.) |

## Enforcement-hook parameters (settled this session)

For the `SubagentStop` hook that will validate reports (build next session):
- **Event / inputs** (verified against code.claude.com/docs/en/hooks): `SubagentStop`
  receives `agent_type` (selects schema), `last_assistant_message` (report text),
  `agent_id` (loop-guard key), `transcript_path`, `permission_mode`.
- **Block mechanism**: emit `{"decision":"block","reason":"…"}` (exit 0) → the subagent
  continues and re-emits before its report reaches the manager. Exit 2 also blocks.
- **Loop-guard**: docs expose **no** `stop_hook_active`-style field for SubagentStop, so
  track a per-`agent_id` block count in a state file and **fail open after 2** — then the
  manager's consumption fail-safe (`can't place it → unreviewable`) catches it.
- **Check the minimum the manager routes on**, not every bullet, to limit drift against
  the agent files. Per-agent minimums implied by the tables above:
  - critics: `Verdict:` present with a value in that critic's triple, plus the matching
    required section (`Problems`/`Risks`/`Challenged`/`Checked`/`Out of scope`).
  - blackbox: `Findings` + `Open`. whitebox/mcdc: `Findings` + `Open` + `Suite`.
  - implementer: `Build`. debugger: `Root cause`. verifier: `Verdict:` + `Claims`.
  - researcher: `Answer` **or** `Needed`. alternatives-explorer: `Recommendation`.

## Open decisions for next session

1. **SKILL Critics bullet is subtly wrong for legal-critic.** It routes bad on
   "`Problems` populated", but legal emits findings under `Risks` → a legal risk currently
   reads as clean. Fix: route on the findings section per critic (`Problems` **or**
   `Risks`), or route on the `Verdict` word via the table above. Decide which and patch the
   SKILL. (`.claude/skills/build-orchestration/SKILL.md`, "Reports — demand and consume".)
2. **Block-and-retry vs warn-only.** Block bounces a malformed report back to the subagent
   (stronger, can loop → needs the guard). Warn-only injects the problem as
   `hookSpecificOutput.additionalContext` for the manager and never blocks (simpler, no
   loop). Pick one.
3. **Drift control.** The section names here duplicate the agent files. Either keep the
   hook's check to the per-agent minimums above (small surface) or generate the schema
   from one place. Decide before the hook hardcodes headers.
4. **Non-uniform severity scale** (critical only on 4 of 8 critics) — confirm the manager's
   "critical/high block close-out" rule reads correctly on the high-topped axes.
