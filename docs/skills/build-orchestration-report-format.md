# Build Orchestration — report format: the `route` field

Make every subagent report machine-routable and hook-checkable **without a wrapper** — by
changing the report format at the source so each report natively carries one normalized
disposition line. Preserves each report's content; drops only the axis-specific verdict
word it replaces.

Companion: `build-orchestration-report-schemas.md` (the per-agent body sections — source
of truth, unchanged by this), `build-orchestration-risks.md` item 3 (why), the SKILL
"Reports — demand and consume" (rebinds to `route`). Update this doc in the same change as
any `route`-mapping or agent report edit.

## Decision (this session): approach A — change format at source

Rejected two alternatives:
- **Envelope wrapper** (a `===REPORT===` block around the existing report): adds a second
  copy of the disposition over a report that already states it — a text layer, not polish.
- **Middle script that converts native reports → uniform**: no clean interception point
  (`SubagentStop` can block or inject context, not hand the manager a rewritten report),
  and it would have to parse 16 flavors of natural-language prose — the exact fragility
  we're removing. A converter only becomes reliable once agents emit a machine field,
  which *is* approach A.

So: change the format once at the source; the planned `SubagentStop` hook stays a **pure
validator**, never a converter.

## The `route` field

- Every report sits inside a fixed **locator envelope** (markers only — "Locator
  envelope" below); its first line inside is `route: <tokens>`. The manager routes on
  `route`; the hook locates the report by the markers and validates `route`. The envelope
  is a boundary marker, **not** a content wrapper — it carries no restated fields, so it
  adds no duplicate layer.
- Values name the manager's next action. Combine with `+` when a report carries more than
  one:

| value | manager's next action (meaning set by agent type) |
| --- | --- |
| `accept` | consume the output, no further action — close the axis (critic), integrate the code (implementer), land the tests (tester), use the answer/recommendation (researcher / alternatives-explorer) |
| `fix` | route the findings to a fix unit |
| `decide` | a decision is pending for the manager/user |
| `redrive` | respawn or escalate — the agent didn't deliver |

- `route` **replaces** the report's axis-specific verdict/status line (`Verdict:
  vulnerable`, `Build: pass`, `Verdict: PASS`, `Root cause: none` as a disposition). Every
  content section stays verbatim — the axis (`vulnerable` vs `unsound`) is already evident
  from the findings, so nothing worth reading is lost.

## Per-agent mapping (covers all 16)

`route` values each agent can legally emit, and what they map from. The hook's per-agent
check is exactly this value-set; the body sections behind each token are in
`report-schemas.md`.

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

## What changes in each agent file

1. Add `route: <legal value-set>` as the first report line, with a one-line rule mapping
   the agent's outcome to the token (as in the table).
2. Remove the standalone verdict/status line `route` replaces (critics' `Verdict`,
   implementer's disposition read of `Build`, verifier's `Verdict`, etc.). Keep `Build:
   pass|fail` itself — it's still the escalation-ladder evidence; only its role as *the
   disposition* moves to `route`.
3. Leave every content section unchanged.

## Locator envelope

The `route` line and body must be findable inside the agent's final message even if the
agent adds stray preamble — and specifying that in the agent file must **not** blur the
line between "text to emit literally" and "instructions about the job." That blur is the
real risk of wrapping: the agent can't tell the wrapper from its own guidance.

Markers, **constant across all 16 files** (no per-agent fill):

```
===REPORT===
route: <tokens>
<body sections>
===END REPORT===
```

- Identical everywhere. The hook already receives `agent_type` from the `SubagentStop`
  event, so the marker carries no agent name to fill or get wrong.
- **Locating (hook):** take the span from the first `===REPORT===` to the next
  `===END REPORT===`; text outside is ignored preamble, so a chatty agent still passes
  when the block is intact. Malformed = a marker missing, or the first line inside is not
  `route:` with a token-set legal for the event's `agent_type`.

Keeping format distinct from instruction in the agent file:
- One **final** `## Report` section, and it is the last thing in the file: everything
  above is how to do the job, this section is the literal shape of the final message.
- Frame the whole message, not "a structure": *"Your entire final message is exactly the
  block below, from `===REPORT===` to `===END REPORT===`. Output nothing before or after
  it, and do not wrap it in a code fence."*
- **Literal-vs-fill convention, stated once:** text outside `<…>` is emitted verbatim (the
  markers, the `route:` key, the section headers); each `<…>` is replaced with the agent's
  content. This draws the format/instruction line at the token level.

Resolved by the legal-critic review (below): the marker token is `===REPORT===` (over
`<<<REPORT>>>`); the template is shown bare-indented, no fence, paired with the rule-1
"no code fence".

## Reviewed reference: legal-critic (human-polished)

`legal-critic.md`'s `## Report` section is the reviewed template for the other 7 critics —
copy it from the file, don't restate it here (a second copy would drift). Per critic only
two things change, both from the `report-schemas.md` critics table: rule 4's section names
and the severity scale. Rules 1–3 and the envelope are emitted verbatim.

Changes the polish made, relative to the old `Verdict`-style report — apply each to the
other critics:

1. **Final `## Report` heading**, last in the file — the boundary between job instructions
   (above) and the literal final message (this section). The one body heading; leave "Hunt
   for" / "Rules" as bare lead-ins.
2. **Report rules as a numbered list**, each a standalone command. Rules 1–3 verbatim;
   rule 4 is the per-critic route→section mapping.
3. **`route:` is the first line in the envelope; the axis verdict word is deleted** — no
   `risks-found` / `vulnerable` / … anywhere; `route` carries the disposition.
4. **`(required if X)` parentheticals dropped** — the disposition→section coupling lives
   once, in rule 4.
5. **"Write no files" moved to the role paragraph** — a job-scope constraint, not a
   report-shaping rule.
6. **Bare template, no fence; constant `===REPORT===` / `===END REPORT===` markers.**
7. **Content sections and severity scale unchanged.**

## Rollout order

Critics first. Six convert mechanically off the `report-schemas.md` table — legal-critic
(done, reference) plus correctness, simplicity, performance, docs, change-discipline
(done). **security-critic and design-critic need a decision before converting:** both carry
"One entry per target (multiple targets → multiple entries)," which the single-block
locator envelope can't hold (the hook reads only the first `===REPORT===`…`===END REPORT===`
span). Resolve to one report per subagent — `route` = the worst disposition across targets,
`Target` names them all, findings cite each — or keep multi-entry and rethink the locator.

The other types are not mechanical either; audit each before applying:
- **testers**: no `Verdict`; route set differs (`accept | decide | redrive`, `+fix` for
  whitebox/mcdc); `Open` is a section every tester fills.
- **implementer**: `Build: pass|fail` stays as evidence; the disposition moves to `route`.
- **advisory** (debugger, researcher, verifier, alternatives-explorer): bespoke sections,
  and researcher has two alternate structures — each needs its own rule 4.

## Hook role — validator only (built later)

`SubagentStop`, keyed on `agent_type`: the report's first non-empty line parses as `route:`
with a token-set legal for that agent; else the report is malformed. Block-and-retry vs
warn-only, and the loop-guard, are still open (risks item 3) — out of scope for this
format work.

## Resolved this session

- Success word is **`accept`** (family-neutral: reads right for a clean critic and for
  integrate/land/use).
- **verifier `FAIL` → `redrive`** (re-drive or discard the research), not `decide`.
- **implementer with an open decision → `accept+decide`** (the code still merges; a call
  pends), not a bare `decide` that would hold integration.

## Next steps

1. Roll the polished `## Report` shape to the other 7 critics off the `report-schemas.md`
   table (legal-critic is the reviewed reference — see "Reviewed reference" / "Rollout
   order"). The non-critic types need a per-type audit first; they are not mechanical.
2. Rebind SKILL "Reports — demand and consume" to route on `route`. This also closes the
   legal-critic `Risks`-reads-as-clean bug for free — routing no longer touches section
   names.
3. Build the validator hook (separate session; needs docs citation + user sign-off per
   CLAUDE.md).
