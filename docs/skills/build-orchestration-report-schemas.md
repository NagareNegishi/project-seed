# Build Orchestration — subagent reports (route field + body schemas)

The single source of truth for every worker's report: the machine-routable `route` field it
carries, the locator envelope that frames it, and the body sections behind it. Two consumers
bind here — the manager's consumption routing (SKILL "Reports — demand and consume") and the
`SubagentStop` format-enforcement hook (`route-guard.sh`). Body sections are
transcribed verbatim from the 24 `.claude/agents/*.md` files; update this doc in the same
change as any agent report edit, and do not route on anything not recorded here.

Companion: `build-orchestration.md` "Consuming reports", `docs/agents/authoring.md` §2/§10.

## The `route` field

Each report is machine-routable **without a wrapper**: the format carries one normalized
first-line disposition, `route:`, so neither manager nor hook parses natural-language prose.
(Chosen over an envelope wrapper — a second copy of the disposition — and over a middle
converter, which would have to parse 24 flavors of NL prose; the `SubagentStop` hook stays a
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

### Per-agent mapping (all 24)

`route` values each agent can legally emit — the hook's per-agent check is exactly this
value-set:

| Agent(s) | legal `route` values | mapped from |
| --- | --- | --- |
| the 8 critics | `accept` \| `fix` \| `redrive` | good verdict / bad verdict / `unreviewable` |
| the 8 advisers | `accept` \| `fix` \| `decide` \| `fix+decide` \| `redrive` | clean / all problems `fix` / all `decide` / both tags / `unreviewable` |
| blackbox-tester | `accept` \| `decide` \| `redrive` | clean / spec-gap `Findings` or `Open` / can't produce. (Gaps are manager calls → `decide`, never `fix`.) |
| whitebox-tester, mcdc-tester | `accept` \| `fix` \| `decide` \| `fix+decide` \| `redrive` | clean / bug `Findings` / `Open` / both / can't produce |
| implementer | `accept` \| `decide` \| `accept+decide` \| `redrive` | build pass & no open / `Build: none` (stopped before build) + `Open` / integrate but a call pends / `Build: fail` |
| debugger | `fix` \| `decide` \| `fix+decide` \| `redrive` | root cause found / `Open` / both / no-repro (`Root cause: none`) |
| researcher | `accept` \| `decide` | researched `Answer` / `Needed` ambiguity (no `redrive` — it always delivers a conclusion; answer quality is the verifier's `FAIL`) |
| verifier | `accept` \| `redrive` | `PASS` / `FAIL` |
| alternatives-explorer | `accept` | always — take the `Recommendation` |

## Locator envelope

Markers frame the report so its `route` line and body are findable even if the agent adds
stray preamble — and specifying that in the agent file must not blur "text to emit literally"
against "instructions about the job." Markers are **constant across all 24 files** (no
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
## Editing or adding an agent report

All 24 carry `route` — the 16 originals converted, the 8 advisers authored with it (per-agent
value-sets in the mapping table above; body shapes in the family sections below). This is the recipe for the next report edit or a new agent. Per agent:
(1) `route: <legal value-set>` as the first report line, with a one-line rule mapping outcome →
token; (2) no standalone verdict/status line — `route` replaces it; (3) content sections
unchanged.

**Critics share one shape — legal-critic is the reviewed reference.** Copy its `## Report`
section from the file; per critic only the target/clean header names change (Critics table
below) — findings are always `Problems`, severity always `high/medium/low`. Structure: one
final `## Report` heading
(last in the file, everything above is how to do the job); rules 1–3 verbatim, rule 4 derives
`route` from the filled sections; `route:` first in the envelope, no axis verdict word; bare
template, no fence.

**One target per spawn.** security-critic and design-critic once carried "one entry per target";
the single-block envelope can't hold it (the hook reads only the first
`===REPORT===`…`===END REPORT===` span) and the manager allocates critics per unit (SKILL steps
2 and 5), so each spawn has exactly one target. Don't reintroduce a multi-target clause.

## Universal invariants (body)

- **Every section always appears; write "none" when empty.** Holds for all 24 except
  `alternatives-explorer` (no such note; structure still fixed). Absence of a section = a
  malformed report, not an empty one.
- **The report is the agent's final message** (`Agent` tool result / `last_assistant_message`).
- **`unreviewable` is the only verdict word shared across critics.** The bad/clean words are
  axis-specific (table below).

## Critics (8) — shared 5-section shape, with per-critic deviations

Emitted order: `route:` (first line inside the envelope), then `<target>` · `Problems` ·
`<clean>` · `Out of scope`. The axis verdict word is **not emitted** — it maps to `route`:
bad → `fix`, clean → `accept`, unreviewable → `redrive`. Findings sit under `Problems` and the
severity scale is `high/medium/low` for all 8; only the target and clean header names deviate
(two critics). All 8 converted: legal-critic (reference), correctness, simplicity, performance,
docs, change-discipline, security, design.

| Critic | target hdr | axis: bad \| clean \| unreviewable (→ `fix` \| `accept` \| `redrive`) | findings hdr (`fix`) | clean hdr (`accept`) |
| --- | --- | --- | --- | --- |
| correctness-critic | `Target` | `incorrect` \| `correct` \| `unreviewable` | `Problems` | `Checked` |
| security-critic | `Target` | `vulnerable` \| `clean` \| `unreviewable` | `Problems` | `Checked` |
| design-critic | `Target` | `unsound` \| `sound` \| `unreviewable` | `Problems` | **`Challenged`** |
| simplicity-critic | `Target` | `overcomplicated` \| `simple` \| `unreviewable` | `Problems` | `Checked` |
| performance-critic | `Target` | `inefficient` \| `efficient` \| `unreviewable` | `Problems` | `Checked` |
| docs-critic | `Target` | `deficient` \| `sufficient` \| `unreviewable` | `Problems` | `Checked` |
| legal-critic | `Target` | `risks-found` \| `none-found` \| `unreviewable` | `Problems` | `Checked` |
| change-discipline-critic | **`Mandate`** | `undisciplined` \| `disciplined` \| `unreviewable` | `Problems` | `Checked` |

Per-critic deviations (they no longer affect routing — `route` is uniform — but the manager
and hook still read these headers):
- **design-critic's clean section is `Challenged`, not `Checked`.** ("angles you attacked that
  held up" — a sharper instruction than generic `Checked`.)
- **change-discipline-critic's first section is `Mandate`, not `Target`.** It names the task the
  change was meant to accomplish — the baseline the diff is judged against — content no other
  critic carries; a generic `Target` would blur it.
- **legal-critic keeps a standing legal-advice note in `Out of scope` that always stays**,
  even when everything else is "none".

Every critic: every section fills independently and always appears ("none" when empty);
`route` is then *derived* from which are filled — `fix` if the findings section has an
entry, else `redrive` if `Out of scope` names something unreviewable, else `accept`. The
section that sets the route is never "none".

## Advisers (8) — critic shape plus a per-problem fix direction

An adviser is its critic's review **plus** a scoped in-axis fix direction, produced in the same
spawn (design-notes "Advisers = critic + fix direction"). The skill spawns advisers, not critics; the critics stay for
human sessions. Same envelope and same `Target` / `Checked` / `Out of scope` headers as the
matching critic — the deviation is `Problems`: each problem is a keyed multi-field bullet that
carries its own directions, so the manager can route a finding to an implementer without a cold
second spawn.

Per-problem bullet (keys verbatim, in order):

```
- tag: <fix | decide>
  severity: <high | medium | low>
  claim: <wrong result or spec violation>
  trigger: <input/state → wrong result>
  evidence: <file:line>
  directions:
    - <one in-axis fix direction per sub-bullet>
```

- `directions` lists only same-axis fixes; a fix reaching into design, spec, security, or
  performance is omitted (→ `directions: none`). Scoping guard: an adviser can't see cross-axis
  ramifications, so a cross-axis fix is a decision, never a straight-to-implementer `fix`.
- Per-problem `tag`: exactly one direction → `fix`; zero or several → `decide`.

`route` (report-level, `+`-combined from the tags — not a grammar change; whitebox/mcdc already
combine): `redrive` if the target/spec was unopenable, else `accept` if no problems, else `fix` /
`decide` / `fix+decide` by which tags appear. The severity scale stays `high/medium/low`, uniform
with the critics.

## Testers (3) — no `Verdict`

| Tester | sections, in order | findings hdr | severity | has `Suite` |
| --- | --- | --- | --- | --- |
| blackbox-tester | `Spec basis` · `Tests` · `Findings` · `Open` | `Findings` | high/medium/low | no |
| whitebox-tester | `Tests` · `Suite` · `Findings` · `Checked` · `Open` | `Findings` | high/medium/low | yes |
| mcdc-tester | `Decisions covered` · `Coverage` · `Tests` · `Suite` · `Findings` · `Open` | `Findings` | high/medium/low | yes |

- Severity is `high/medium/low` for all three (uniform with the critics).
- All three carry an **`Open`** section (anything needing a manager decision) — the manager
  must consume it, not just `Findings`.
- `blackbox` `Findings` are **spec gaps** the manager resolves, never routed to an implementer;
  it has no `Suite` (it never runs the tests — no shell).
- `whitebox`/`mcdc` `Suite`: an xfail/skip parked against a `Finding` = an open bug → fix unit.

## Implementer (1)

Sections, in order: `Done` · `Build` · `Decisions` · `Open`.
- `Build` = the build/typecheck run and its result: **`pass`; `fail` with the failing
  output; or `none` if it stopped before running the build** — the manager's escalation-ladder
  trigger. `fail` (build ran, failed) → `redrive`; `none` (never reached the build) → `decide`.
- `Open` = anything it stopped on (spec gap/conflict, a needed out-of-unit change, a decision
  beyond its unit) → a manager decision.
- Every section always appears; "none" when empty.

## Advisory (4)

| Agent | sections, in order | routing signal |
| --- | --- | --- |
| debugger | `Failure` · `Root cause` · `Fix location` · `Also-noticed` · `Open` | `Root cause` + `Fix location` → next fix unit. **No-repro = `Root cause: none`** (what it tried goes under `Failure`, "none" for the rest) — an escalation, not a fix. `Also-noticed` = an unrelated second bug handed back. |
| researcher | `Task` · `Answer` · `Findings` · `Unverified` · `Gaps` · `Ambiguity` · `Needed` | **One block** (was two structures). Ambiguous → fill `Ambiguity`/`Needed`, rest "none", `route: decide`; else `route: accept`. No `redrive` — it always delivers a conclusion; answer quality is the verifier's `FAIL`. |
| verifier | `Claims` · `Notes` | Overall PASS/FAIL → `route` (`redrive` if any `Claims` bullet is `fail`, else `accept`); the standalone `Verdict` section is **deleted** (pure disposition). `redrive` blocks acting on the researched answer. |
| alternatives-explorer | `Goal` · `Constraints` · `Alternatives` · `Recommendation` | take the single `Recommendation` into a design decision, then a fix unit. (No "every section none" note; structure still fixed.) |

## Enforcement hook (SubagentStop — `route-guard.sh`)

A **pure validator**, never a converter: blocks a malformed report so the subagent re-emits before
the manager consumes it. Covers only the 14 agent types the skill spawns (8 advisers, 3 testers,
implementer, debugger, alternatives-explorer); any other `agent_type` passes through unvalidated.

Validates, in order: (1) envelope markers present; (2) first non-empty line is `route:` with a
token-set legal for that `agent_type` — exact set, `+`-combos included; (3) the expected sections
appear in order and the route-setting section is not "none" (e.g. `fix` ⇒ findings has an entry).
Structural match on order/shape, not header text or prose.

Block is `{"decision":"block","reason":"…"}` (exit 0). Loop-guard: `SubagentStop` exposes no
`stop_hook_active`, so a per-`agent_id` count in `build-orchestration/route-block-count` (gitignored
scratch) **fails open after 2** — then the manager's "can't route → redrive" fail-safe catches it.

Files: `route-guard.sh` (bash + `jq`, no agent names) reads `route-spec.json` — the per-agent
conditions and machine source of truth; this doc keeps the rationale, edit both together. Event
schema per code.claude.com/docs/en/hooks.
