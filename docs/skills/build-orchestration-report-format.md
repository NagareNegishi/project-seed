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

Open choices (confirm before the 16-file edit):
1. Marker token — `===REPORT===` vs `<<<REPORT>>>`. Any distinctive, prose-unlikely form;
   lean `===REPORT===`.
2. In the source agent file, show the template bare-indented (no risk of the agent echoing
   a fence) or inside a ``` fence (more readable for the author). Lean bare, paired with
   the explicit "do not wrap in a code fence" rule.

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

1. Apply `route` to the 16 `.claude/agents/*.md` files (the bulk edit; after sign-off).
2. Rebind SKILL "Reports — demand and consume" to route on `route`. This also closes the
   legal-critic `Risks`-reads-as-clean bug for free — routing no longer touches section
   names.
3. Build the validator hook (separate session; needs docs citation + user sign-off per
   CLAUDE.md).
