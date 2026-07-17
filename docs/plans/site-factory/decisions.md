# site-factory: open-question decisions

Maturity: 🤖 ai-audited(fable-5) — nothing here is settled. Each entry is a
recommendation awaiting your review; promote per entry in
[product.md](product.md)'s maturity scheme.

How these were produced (2026-07-17): two recommender agents researched the
questions with web verification; an independent decider agent committed to
answers without seeing the recommenders; a challenger agent cross-examined
every divergence. Where the decider's differing pick survived challenge, it is
recorded as a **second recommendation** with the conditions under which it
wins. Verified facts and sources live in the agent transcripts summarized
here; load-bearing ones are restated inline.

## 1. Template base

**Primary: Astro, current 7.x line** (7.1.0 as of 2026-07-16). Static-first
by default, runs the existing React/shadcn reusables unchanged as hydrated
islands, and its content layer carries the intake design in
[intake.md](intake.md). Next.js static export rejected: it is that framework's
constrained mode (no API routes/middleware, unoptimized images), swims against
its server-first direction, and a fleet of delivered repos would inherit
Next's monthly CVE cadence for no benefit. Accepted trade-off: page shells are
`.astro`, patterns stay pure React — two syntaxes per repo, clean split.

**Second: start on Astro 6.x** only if a short spike shows the 7.x Rust
compiler/Vite 8 combination breaking the React/shadcn island setup; then
upgrade behind the first client. (The decider picked 6 believing it current;
the challenger corrected the fact but kept the conservative option alive.)

## 2. Content intake format

**Primary (merged, no rival): schema as source of truth, validated through
Astro's content layer.** A Zod schema per section/pattern defines the slots.
Clients never see it: they fill a per-section questionnaire doc that mirrors
the schema field for field, plus an image checklist and shared folder. The
operator transcribes into the repo: `intake/site.yaml` (singleton sections,
page order in one `sections:` key) fed through a file loader, per-folder
collections for repeated entries (gallery, FAQ, testimonials), `copy/` for
long-form text, `assets/` for images and brand. Operator wiring (form
endpoint, embed URLs, analytics) lives in a separate `site.config.yaml` so
client content and operator config never mix. Build fails on missing required
slots. Full layout and example: [intake.md](intake.md).

## 3. v1 pattern catalog cut

**Primary: 12 sections + 4 patterns.** Sections: header/nav and footer
(mandatory), hero, services, pricing, about/team, testimonials, gallery,
opening hours, FAQ, CTA banner, legal pages. Patterns: contact, booking (one
embed pattern covering scheduling too — the Level-1 move is identical; they
split again at Level 2), payment, map. An omitted section is left out, never
rendered empty. Full slots and mechanisms: [catalog.md](catalog.md).

The decider's tighter 8-section cut was refuted: its own "a salon or trades
site is assemblable from these alone" claim fails without opening hours and
about/team, and it shipped a legal pattern its catalog had no entry for.

**Second: include app-download at launch** if the first client actually has
an app, or if sales material needs all six originally named patterns
demonstrable. Otherwise it stays catalog-listed, built on first demand
(an afternoon of work).

## 4. Theme encoding

**Primary (consensus, no second): CSS variables in the shadcn convention,
wired with Tailwind v4 `@theme inline`.** A theme is one file,
`themes/<name>.css`, defining the semantic token set (colors in OKLCH, plus
radius, spacing, and font tokens — non-color tokens route through variables
too, plus 2–3 factory tokens like section spacing). The template maps tokens
to utilities once; selecting a theme is a one-line import swap; light/dark
comes free. Per-theme Tailwind configs are an obsolete v3 pattern. Boundary:
structural layout variation is a template or pattern variant, not a theme's
job.

## 5. Level-2 shape

**Primary: shared multi-tenant service per pattern, tenancy as a
configuration layer.** One deployment per pattern serves all clients,
tenanted by site key — marginal client cost near zero, which is what makes
Tiers 2/3 viable solo. Hard requirement on the Phase-3 design round: tenancy
must be a config layer, not baked into the schema, so a dedicated instance
(compliance exception, or a Tier-1 client buying Level 2) is cheap to stand
up. Deployment on a Tier-1 client's own infrastructure is a priced option
whose feasibility is decided in Phase 3, not guaranteed now. Contract details:
[level-2.md](level-2.md).

**Second: pure shared tenancy** (client-iron quoted as out-of-factory custom
work) if Phase 3 commits to Workers-native primitives (D1, Durable Objects)
whose portability cost is real, and no Tier-1 client has asked for Level 2 by
then.

## 6. Hosting for Tiers 2/3

**Primary (consensus, no second): Cloudflare Workers with static assets, one
Worker project per client.** Verified July 2026: static-asset requests free
and unlimited, free TLS, Workers reached full parity with Pages (Pages is
maintenance-mode); the $5/mo paid plan covers the whole portfolio, and
Level-2 services later live one config line from each site. Tier 2: prefer
moving the client's nameservers into the operator's Cloudflare account; use
Cloudflare for SaaS custom hostnames (free to 100) for clients who won't.
Tier 3: domains via Cloudflare Registrar at cost. Rejected: Netlify (free
tier hard-pauses sites on overage — disqualifying for paid client sites),
Vercel (Hobby bans commercial use), own VPS (buys the ops burden the
solo-operator constraint forbids, for flexibility Level 2 hasn't asked for).

## 7. Tier packaging and pricing

**Primary (decider-only, held up under challenge): build fee roughly constant
across tiers; recurring fee only where a recurring obligation exists.**
Tier 1: build-only, clean handover, paid support on request. Tier 2: build +
care plan ~$20–40/mo (billed annually). Tier 3: build + $75–150/mo retainer.
Level-2 patterns: add-ons, setup fee + ~$20–50/mo each. Caveats attached by
the challenger: the build-fee magnitude is a placeholder until the first
measured build (deadline, not option); tier packaging must disclose
client-paid pass-throughs (Cal.com brand removal ~$12–15/mo, Stripe 2.9% +
30¢, domain at cost) or the tiers quietly lie; annual billing creates a
refund obligation if the operator winds down — cover it in the terms.

## 8. Migration of reusables/

**Primary (consensus, no second): move, don't copy.** The factory library
becomes the sole canon; two living libraries means double bookkeeping a solo
operator won't do. `reusables/` is frozen at migration, gets a pointer file,
and is deleted after the first factory release; CLAUDE.md's Reusables section
becomes a pointer to the factory library; the reusables-candidates proposal
stays as a decision record with accepted items implemented in the new home.
Layout: keep `component/`, `shadcn/`, `util/` and add `sections/` +
`patterns/` (cheapest migration, honors "migrate, don't rewrite") — unless
regrouping into `site/`/`app/` shelves happens at move time anyway.

## 9. Legal pages

**Primary (consensus, merged): the factory ships them as a pattern.**
Skeleton privacy, terms, and refund/cancellation pages with intake slots
(legal name, contact, jurisdiction, effective date). The privacy page
assembles from paragraphs contributed by the patterns the site actually uses
(contact form, booking, payment, analytics toggle), so it never claims
practices the site lacks. Mandatory whenever contact, booking, or payment is
present — enforced by the same build-time check as content slots.
Lawyer-supplied client text replaces the skeleton wholesale. The engagement
contract states the skeleton is not legal advice and review is the client's
responsibility. Jurisdiction escape hatch: where supplying template text
itself creates liability, ship structure-only pages. Broader legal baseline
(contract, DPA, consent, accessibility): [operations.md](operations.md) §4.
