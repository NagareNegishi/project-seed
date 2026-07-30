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

Emitted order is: `route:` (first line inside the envelope), then `<target>` ·
`<findings>` · `<clean>` · `Out of scope`. The axis verdict word is **not emitted** — it
maps to `route`: bad → `fix`, clean → `accept`, unreviewable → `redrive`. The header names
are **not** uniform — three critics rename a section:

Conversion status: legal-critic (reference) and correctness, simplicity, performance,
docs, change-discipline emit `route`. **security-critic and design-critic are not yet
converted** — their "one entry per target (multiple targets → multiple entries)" clause
must be resolved against the single-block envelope first (see report-format.md "Rollout
order").

| Critic | target hdr | axis: bad \| clean \| unreviewable (→ `fix` \| `accept` \| `redrive`) | findings hdr (`fix`) | clean hdr (`accept`) | severity scale |
| --- | --- | --- | --- | --- | --- |
| correctness-critic | `Target` | `incorrect` \| `correct` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |
| security-critic | `Target` | `vulnerable` \| `clean` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |
| design-critic | `Target` | `unsound` \| `sound` \| `unreviewable` | `Problems` | **`Challenged`** | critical/high/medium/low |
| simplicity-critic | `Target` | `overcomplicated` \| `simple` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| performance-critic | `Target` | `inefficient` \| `efficient` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| docs-critic | `Target` | `deficient` \| `sufficient` \| `unreviewable` | `Problems` | `Checked` | high/medium/low |
| legal-critic | `Target` | `risks-found` \| `none-found` \| `unreviewable` | **`Risks`** | `Checked` | high/medium/low |
| change-discipline-critic | **`Mandate`** | `undisciplined` \| `disciplined` \| `unreviewable` | `Problems` | `Checked` | critical/high/medium/low |

Per-critic deviations (they no longer affect routing — `route` is uniform — but the
manager and hook still read these headers):
- **legal-critic findings live under `Risks`, not `Problems`.** Under the old
  section-name routing this misrouted to a silent clean; `route` closes it — a legal risk
  emits `route: fix` like any critic.
- **design-critic's clean section is `Challenged`, not `Checked`.**
- **change-discipline-critic's first section is `Mandate`, not `Target`.**
- **legal-critic keeps a standing legal-advice note in `Out of scope` that always stays**,
  even when everything else is "none".
- **Severity scale is not uniform.** Only correctness, security, design, change-discipline
  carry `critical`; simplicity, performance, docs, legal top out at `high`. The manager's
  "critical/high block close-out" means "high" is the top block-trigger on those four axes.

Every critic: `route` is `fix` (a finding) | `accept` (clean) | `redrive` (unreviewable),
from the axis words above; the routed section is filled — `<findings>` for `fix`,
`<clean>` for `accept`, `Out of scope` for `redrive` — and every section still appears,
"none" when empty.

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

The routing signal is no longer a verdict word or a section set — it is the first-line
`route:` field defined in `build-orchestration-report-format.md` (approach A: the report
format carries one normalized disposition natively). This doc stays the source of truth
for the **body sections**; the hook and the manager route on `route`.

For the `SubagentStop` hook that will validate reports (build next session):
- **Event / inputs** (verified against code.claude.com/docs/en/hooks): `SubagentStop`
  receives `agent_type` (selects the legal `route` value-set), `last_assistant_message`
  (report text), `agent_id` (loop-guard key), `transcript_path`, `permission_mode`.
- **Block mechanism**: emit `{"decision":"block","reason":"…"}` (exit 0) → the subagent
  continues and re-emits before its report reaches the manager. Exit 2 also blocks.
- **Loop-guard**: docs expose **no** `stop_hook_active`-style field for SubagentStop, so
  track a per-`agent_id` block count in a state file and **fail open after 2** — then the
  manager's consumption fail-safe (`can't place it → redrive`) catches it.
- **Validate `route`, not the body sections.** The check is: the envelope markers are
  present, and the first line inside is `route:` with a token-set legal for that
  `agent_type` (value-sets in report-format.md). The body sections below are read by the
  human/manager, not routed on — so the hook does not police their headers, keeping its
  surface off the agent files' prose.

## Open decisions for next session

1. **Legal-critic `Risks`-reads-as-clean — resolved by `route`.** Routing no longer reads
   section names, so legal's findings under `Risks` can't misroute; a legal risk emits
   `route: fix` like any critic. Closed when the SKILL rebinds to `route`
   (report-format.md "Next steps" #2).
2. **Block-and-retry vs warn-only.** Block bounces a malformed report back to the subagent
   (stronger, can loop → needs the guard). Warn-only injects the problem as
   `hookSpecificOutput.additionalContext` for the manager and never blocks (simpler, no
   loop). Pick one.
3. **Drift control — narrowed.** The hook checks only the `route` value-set per
   `agent_type` (small, stable surface), not the body headers, so it no longer duplicates
   the agent files' section names.
4. **Non-uniform severity scale** (critical only on 4 of 8 critics) — confirm the manager's
   "critical/high block close-out" rule reads correctly on the high-topped axes.
5. **Locator-envelope enforcement** — how the report's delimiters are specified in the
   agent files without confusing report-format for instruction (design in
   report-format.md "Locator envelope").
