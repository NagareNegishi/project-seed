# Feature Planning Skills — Design Ledger

Design decisions behind three skills that turn a raw idea into a concrete,
verified plan: `plan-product`, `plan-impl`, and `plan-verify`. The skills will
live under `.claude/skills/`; this file records why they are shaped the way they
are. It fulfills the `feature-plan` candidate listed in
[new-skills.md](new-skills.md).

Status: designed, not yet built. The "Settled" section is agreed with the user.
"Open questions" lists what to resolve before writing skill code.

## The problem

A new project or feature idea starts as loose talk. Turning it into something you
can build means pinning down the "what and why", then the "how", without losing
track of which parts are still guesswork and which are checked. Two failures to
guard against:

- Guesswork that looks settled. An idea dictated in one breath reads the same on
  the page as a decision the user has reviewed and locked.
- Plans that assert things about code or tools that aren't true. An AI plan will
  happily say "add a handler in `FooService`" when `FooService` doesn't exist, or
  recommend a library API that changed after the model's training cutoff.

## Prior art this follows

- Spec-driven development (GitHub Spec Kit, AWS Kiro) splits planning into a
  requirements/product doc and a separate implementation/design doc, generating
  the second from the first. This effort uses the same split.
- Status lifecycle fields from ADRs (Proposed / Accepted / Superseded) and PEPs
  (Draft / Accepted / Final) are the model for the maturity marker below.
- The requirements traceability matrix, a classic software-engineering practice,
  is the model for linking every verified claim to its proof.
- EARS phrasing ("When <trigger>, the system shall <response>") is the suggested
  form for requirement entries so they stay testable.

## Settled

### Three skills, drafted in sequence

- `plan-product` writes the product doc: what and why. `plan-impl` reads a
  sufficiently mature product doc and writes a rough implementation plan.
  `plan-verify` hardens that rough plan into a verified one.
- The chain mirrors the repo's existing draft-then-act pattern
  (`github-issue-creator` → `issue-publish`). Each skill is single-purpose and
  changes independently.

### Output lives in `docs/plans/<slug>/`

- `plan-product` writes `docs/plans/<slug>/product.md`; `plan-impl` and
  `plan-verify` write and update `docs/plans/<slug>/impl.md`.
- `docs/plans/` is already the home for per-feature product plans (CLAUDE.md).
  One subdirectory per feature keeps the product doc and its impl plan together.

### These skills write docs only

- No code changes, no git, no network posting. `plan-verify` reads source code
  and external documentation to check claims, but its only write is to `impl.md`.

### Two marking axes, kept separate

Every entry carries a maturity mark. Implementation entries carry a second,
independent verification mark. Keeping them separate is deliberate: a design
decision can be settled without being a code claim, and a code step can be
verified against source while still being unreviewed by the user.

Maturity (both docs):

```
🌱 idea               raw, as the user dictated it
🤖 ai-audited(model)  Claude reviewed and refined it; stamps the model id
👤 human-ok           the user reviewed it
✅ settled            the user locked it
```

Verification (impl doc only):

```
❔ unverified                              not checked, or checked and unconfirmed
🔗 verified → src: path/to/file.ts:42      internal: the code exists / behaves as claimed
🔗 verified → doc: <url> §exact-section    external: this tool or approach is current and standard
```

The two stack on one line, e.g. `✅ settled · 🔗 verified → src:...`.

### Claude advances maturity only to `ai-audited`

- Claude may move an entry from `🌱 idea` to `🤖 ai-audited(<model>)` and no
  further. `👤 human-ok` and `✅ settled` are the user's alone.
- An audit pass means: read the entry, tighten wording, flag contradictions,
  gaps, and unknowns, then stamp `🤖 ai-audited(<model>)` with a one-line note on
  what changed or what remains open. Never silently promote past that.
- The model id is stamped per entry, not once per doc, so a doc audited across
  several sessions or models keeps an accurate trail.

### Verification requires real proof, and names two kinds

- No entry may be marked `🔗 verified` without proof Claude actually saw.
  Internal claims cite `file:line` from a file Claude opened. External claims
  (a library API, a "standard" approach) cite the exact documentation page and
  section that shows the usage is current and correct.
- External proof matters as much as internal. The model's training cutoff makes
  claims about outside tools a real hallucination risk: an approach it "knows"
  may now be redundant, wrong, or unsafe. `plan-verify` checks these by invoking
  the [dev-research](../../.claude/skills/dev-research/SKILL.md) skill, which
  verifies against current docs before asserting.
- Unverified splits by reason, and the entry says which: not yet checked, versus
  checked and the referenced code doesn't exist because it's net-new. Net-new
  code legitimately has no source link; that is expected, not a failure.

### Handoff gate: every product entry at least `ai-audited`

- `plan-impl` runs only once every entry in `product.md` is at
  `🤖 ai-audited(opus-4.8)` or above. This guarantees Claude has done a real
  audit pass on the whole product doc before any implementation work starts,
  without forcing the user to fully settle low-stakes fields first.
- The gate is read from the maturity summary header (below), not by rescanning
  every entry.

### Implementation planning is two stages, in two skills

The product doc keeps changing as it matures, and the impl plan changes with it.
Spending a full research-and-verify budget on a plan built against a moving
target wastes it. So the work splits:

- `plan-impl` (stage 1, rough): eligible as soon as the handoff gate is met.
  Produces structure and high-level steps, mostly `❔ unverified`. Cheap, and
  regenerated freely as the product doc matures. Its job is to surface unknowns
  and feasibility risks early.
- `plan-verify` (stage 2, deep): user-triggered, run once the product doc is
  settled and stable. Expands each step, verifies it against source or docs,
  attaches links, and promotes confirmed entries to `🔗 verified`. This is where
  the real verification budget goes, and only the user decides the target is
  stable enough to spend it.

### `product.md` template

One marked entry per field:

`about` · `problem / motivation` · `goal` · `audience` · `requirements`
(EARS phrasing) · `stack` · `target device / platform` · `constraints` ·
`non-goals` · `open questions`

`non-goals` and `open questions` earn their place: they are where the friction
between idea and settled surfaces early, instead of during implementation.

### Written docs go through `human-writing`

- Both `product.md` and `impl.md` are documents a person reads, so drafting them
  runs the `human-writing` pass, as the authoring guide requires.

### Marker syntax: emoji plus text tag

- Each mark is an emoji and a text tag, e.g. `🤖 ai-audited(opus-4.8)` and
  `🔗 verified → src:foo.ts:42`. The emoji scans fast; the tag words
  (`ai-audited`, `verified`, `unverified`) grep cleanly for driving the workflow.

### `plan-verify` invokes `dev-research` for external claims

- To verify a claim about an outside tool or API, `plan-verify` calls the
  `dev-research` skill rather than reimplementing its verify-with-citation
  method. One source of truth for research rigor, and `plan-verify` stays thin.

### The slug is proposed by Claude, confirmed by the user

- `plan-product` derives a kebab-case `<slug>` from the idea (e.g. `bulk-export`)
  and asks the user to accept or rename it before creating the directory.

### `product.md` fields: fixed core, optional extras

- The listed fields are always present, left empty when not applicable, so every
  plan shares one baseline. A project may append its own extra fields after them.

### Invocation: only `plan-verify` is command-only

- `plan-verify` sets `disable-model-invocation: true`. It runs only when the user
  asks, because it spends the real verification budget.
- `plan-product` and `plan-impl` stay auto-invocable, gated by their
  descriptions, so the idea → product → rough-plan handoff can flow from context.

### Maturity summary header on `product.md`

- `product.md` opens with a short header summarizing its entries' maturity: the
  lowest level present, and a count per level. `plan-impl` reads it to check the
  handoff gate cheaply, and the user sees progress at a glance.
- Whatever writes or updates an entry updates the header in the same pass, so it
  can't drift from the entries below it.

## Status

Every decision above is agreed with the user; nothing is built yet. Next step is
`plan-product`, since `plan-impl` and `plan-verify` depend on its output format
and its maturity header.
