# Build Orchestration — subagent reports (route field + body schemas)

The single source of truth for every worker's report: the machine-routable `route` field it
carries, the locator envelope that frames it, and the body sections behind it. Two consumers
bind here — the manager's consumption routing (SKILL "Reports — demand and consume") and the
planned `SubagentStop` format-enforcement hook (risk backlog item 3). Body sections are
transcribed verbatim from the 16 `.claude/agents/*.md` files; update this doc in the same
change as any agent report edit, and do not route on anything not recorded here.

Companion: `build-orchestration-risks.md` item 3 (why the route field exists),
`build-orchestration.md` "Consuming reports", `docs/agents/authoring.md` §2/§10.

## The `route` field

Each report is machine-routable **without a wrapper**: the format carries one normalized
first-line disposition, `route:`, so neither manager nor hook parses natural-language prose.
(Chosen over an envelope wrapper — a second copy of the disposition — and over a middle
converter, which would have to parse 16 flavors of NL prose; the `SubagentStop` hook stays a
pure validator, never a converter.)

`route` **replaces** each report's axis-specific verdict/status line (`Verdict: vulnerable`,
`Verdict: PASS`, `Root cause: none`, and `Build: pass` in its disposition role). Every content
section stays verbatim — the axis (`vulnerable` vs `unsound`) is still evident from the
findings. `Build: pass|fail` itself stays as escalation-ladder evidence; only its role as *the
disposition* moves to `route`.

Values name the manager's next action; combine with `+` when a report carries more than one:

| value | manager's next action (meaning set by agent type) |
| --- | --- |
| `accept` | consume the output, no further action — close the axis (critic), integrate the code (implementer), land the tests (tester), use the answer/recommendation (researcher / alternatives-explorer) |
| `fix` | route the findings to a fix unit |
| `decide` | a decision is pending for the manager/user |
| `redrive` | respawn or escalate — the agent didn't deliver |

Settled: success word is `accept` (family-neutral — reads right for a clean critic and for
integrate/land/use); verifier `FAIL` → `redrive` (re-drive or discard the research), not
`decide`; implementer with an open decision → `accept+decide` (the code still merges, a call
pends), not a bare `decide` that would hold integration.

### Per-agent mapping (all 16)

`route` values each agent can legally emit — the hook's per-agent check is exactly this
value-set:

| Agent(s) | legal `route` values | mapped from |
| --- | --- | --- |
| the 8 critics | `accept` \| `fix` \| `redrive` | good verdict / bad verdict / `unreviewable` |
| blackbox-tester | `accept` \| `decide` \| `redrive` | clean / spec-gap `Findings` or `Open` / can't produce. (Gaps are manager calls → `decide`, never `fix`.) |
| whitebox-tester, mcdc-tester | `accept` \| `fix` \| `decide` \| `fix+decide` \| `redrive` | clean / bug `Findings` / `Open` / both / can't produce |
| implementer | `accept` \| `decide` \| `accept+decide` \| `redrive` | build pass & no open / `Open` only / integrate but a call pends / `Build: fail` |
| debugger | `fix` \| `decide` \| `fix+decide` \| `redrive` | root cause found / `Open` / both / no-repro (`Root cause: none`) |
| researcher | `accept` \| `decide` \| `redrive` | usable `Answer` / `Needed` ambiguity / can't research |
| verifier | `accept` \| `redrive` | `PASS` / `FAIL` |
| alternatives-explorer | `accept` | always — take the `Recommendation` |

## Locator envelope

Markers frame the report so its `route` line and body are findable even if the agent adds
stray preamble — and specifying that in the agent file must not blur "text to emit literally"
against "instructions about the job." Markers are **constant across all 16 files** (no
per-agent fill):

```
===REPORT===
route: <tokens>
<body sections>
===END REPORT===
```

- **Locating (hook):** the span from the first `===REPORT===` to the next `===END REPORT===`;
  text outside is ignored preamble, so a chatty agent still passes when the block is intact.
  Malformed = a marker missing, or the first line inside is not `route:` with a token-set
  legal for the event's `agent_type`.
- **Keep format distinct from instruction in the agent file:** one **final** `## Report`
  section, last in the file (everything above is how to do the job); frame the whole message
  ("Your entire final message is exactly the block below…"); and state the literal-vs-fill
  convention once — text outside `<…>` is emitted verbatim (markers, `route:` key, headers),
  each `<…>` is replaced with content.
- Settled: marker token is `===REPORT===` (over `<<<REPORT>>>`); template shown bare-indented,
  no fence, paired with the "no code fence" rule.

## Converting an agent file

Per agent: (1) add `route: <legal value-set>` as the first report line, with a one-line rule
mapping outcome → token; (2) remove the standalone verdict/status line `route` replaces;
(3) leave every content section unchanged.

**legal-critic is the reviewed reference for the 7 other critics** — copy its `## Report`
section from the file rather than restating it here. Per critic only two things change, both
from the critics table below: the section names in rule 4 and the severity scale. The polish,
relative to the old `Verdict`-style report: a final `## Report` heading (last in the file);
report rules as a numbered list (rules 1–3 verbatim; rule 4 derives `route` from the filled
sections); `route:` first in the envelope with the axis verdict word deleted; `(required if
X)` parentheticals dropped (the coupling lives once, in rule 4); bare template, no fence;
"write no files" in the role paragraph, not a report rule.

**All 8 critics converted.** security-critic and design-critic carried "one entry per target
(multiple targets → multiple entries)," which the single-block envelope can't hold (the hook
reads only the first `===REPORT===`…`===END REPORT===` span). Resolved by dropping the clause:
the build-orchestration manager allocates critics **per unit** (SKILL steps 2 and 5), so each
spawn has exactly one target — the multi-target path was never exercised. Both now match the
other six single-block, single-target. The non-critic types (testers, implementer, advisory)
are still not mechanical — each needs its own rule 4 audit (testers' route set differs and
`Open` is always filled; implementer keeps `Build:` as evidence; researcher has two alternate
structures).

## Universal invariants (body)

- **Every section always appears; write "none" when empty.** Holds for all 16 except
  `alternatives-explorer` (no such note; structure still fixed). Absence of a section = a
  malformed report, not an empty one.
- **The report is the agent's final message** (`Agent` tool result / `last_assistant_message`).
- **`unreviewable` is the only verdict word shared across critics.** The bad/clean words are
  axis-specific (table below).

## Critics (8) — shared 5-section shape, with per-critic deviations

Emitted order: `route:` (first line inside the envelope), then `<target>` · `<findings>` ·
`<clean>` · `Out of scope`. The axis verdict word is **not emitted** — it maps to `route`:
bad → `fix`, clean → `accept`, unreviewable → `redrive`. The header names are **not** uniform
— three critics rename a section. All 8 converted: legal-critic (reference), correctness,
simplicity, performance, docs, change-discipline, security, design.

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

Per-critic deviations (they no longer affect routing — `route` is uniform — but the manager
and hook still read these headers):
- **legal-critic findings live under `Risks`, not `Problems`.** Under the old section-name
  routing this misrouted to a silent clean; `route` closes it — a legal risk emits `route: fix`
  like any critic.
- **design-critic's clean section is `Challenged`, not `Checked`.**
- **change-discipline-critic's first section is `Mandate`, not `Target`.**
- **legal-critic keeps a standing legal-advice note in `Out of scope` that always stays**,
  even when everything else is "none".
- **Severity scale is not uniform.** Only correctness, security, design, change-discipline
  carry `critical`; simplicity, performance, docs, legal top out at `high`. The manager's
  "critical/high block close-out" means "high" is the top block-trigger on those four axes.

Every critic: every section fills independently and always appears ("none" when empty);
`route` is then *derived* from which are filled — `fix` if the findings section has an
entry, else `redrive` if `Out of scope` names something unreviewable, else `accept`. The
section that sets the route is never "none". (Axis words map the same: bad → `fix`, clean
→ `accept`, unreviewable → `redrive`.)

## Testers (3) — no `Verdict`

| Tester | sections, in order | findings hdr | severity | has `Suite` |
| --- | --- | --- | --- | --- |
| blackbox-tester | `Spec basis` · `Tests` · `Findings` · `Open` | `Findings` | high/medium/low | no |
| whitebox-tester | `Tests` · `Suite` · `Findings` · `Checked` · `Open` | `Findings` | critical/high/medium/low | yes |
| mcdc-tester | `Decisions covered` · `Coverage` · `Tests` · `Suite` · `Findings` · `Open` | `Findings` | critical/high/medium/low | yes |

- All three carry an **`Open`** section (anything needing a manager decision) — the manager
  must consume it, not just `Findings`.
- `blackbox` `Findings` are **spec gaps** the manager resolves, never routed to an implementer.
  Its `Findings` severity is high/medium/low (no `critical`), and it has no `Suite` (it never
  runs the tests — no shell).
- `whitebox`/`mcdc` `Suite`: an xfail/skip parked against a `Finding` = an open bug → fix unit.

## Implementer (1)

Sections, in order: `Done` · `Build` · `Decisions` · `Open`.
- `Build` = the build/typecheck run and its result: **`pass`, or `fail` with the failing
  output** — the manager's escalation-ladder trigger.
- `Open` = anything it stopped on (spec gap/conflict, a needed out-of-unit change, a decision
  beyond its unit) → a manager decision.
- Every section always appears; "none" when empty.

## Advisory (4)

| Agent | sections, in order | routing signal |
| --- | --- | --- |
| debugger | `Failure` · `Root cause` · `Fix location` · `Also-noticed` · `Open` | `Root cause` + `Fix location` → next fix unit. **No-repro = `Root cause: none`** (what it tried goes under `Failure`, "none" for the rest) — an escalation, not a fix. `Also-noticed` = an unrelated second bug handed back. |
| researcher | **two alternate structures** | Ambiguous: `Task` · `Ambiguity` · `Needed`. Researched: `Task` · `Answer` · `Findings` · `Unverified` · `Gaps`. Discriminator: `Needed` present (bounce back to manager) vs `Answer` present (usable). |
| verifier | `Verdict` · `Claims` · `Notes` | `Verdict` = **`PASS` or `FAIL`** overall (FAIL if any claim fails). `Verdict: FAIL` blocks acting on the researched answer. |
| alternatives-explorer | `Goal` · `Constraints` · `Alternatives` · `Recommendation` | take the single `Recommendation` into a design decision, then a fix unit. (No "every section none" note; structure still fixed.) |

## Enforcement hook (SubagentStop — built later)

Keyed on `agent_type`: validates that the envelope markers are present and the first non-empty
line inside is `route:` with a token-set legal for that agent. A **pure validator**, not a
converter. Needs docs citation + user sign-off before writing (CLAUDE.md).

- **Inputs** (verified vs code.claude.com/docs/en/hooks): `agent_type` (selects the legal
  `route` value-set), `last_assistant_message` (report text), `agent_id` (loop-guard key),
  `transcript_path`, `permission_mode`.
- **Block**: `{"decision":"block","reason":"…"}` (exit 0; exit 2 also blocks) → the subagent
  continues and re-emits before its report reaches the manager.
- **Loop-guard**: docs expose no `stop_hook_active`-style field for `SubagentStop`, so track a
  per-`agent_id` block count in a state file and **fail open after 2** — then the manager's
  consumption fail-safe (can't place it → `redrive`) catches it.
- **Validate `route`, not the body sections** — keeps the hook's surface off the agent files'
  prose.

Open: block-and-retry vs warn-only (block bounces a malformed report back, stronger but can
loop; warn-only injects the problem as `hookSpecificOutput.additionalContext` and never
blocks); confirm the "critical/high block close-out" rule reads correctly on the high-topped
axes (severity not uniform across critics).
