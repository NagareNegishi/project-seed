# Implementation plan: site-factory

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 15 · 👤 human-ok 0 · ✅ settled 0

Verification pass 2026-07-18 (fable-5). WebFetch was blocked in this session,
so external proofs come from domain-restricted searches over the official
sites; each cited page was confirmed to exist and its quoted content matched
the claim, but full pages were not fetched. Treat `doc:` links as
search-excerpt-verified.

## Overview
🤖 ai-audited(fable-5) · 🔗 verified → src: docs/plans/site-factory/product.md:239

The build follows the product plan's phasing: settle decisions and spike the
stack, then build the factory core around one real client, then add the
hosted tiers. The moving parts are the library repo (migrated from
`reusables/`), an Astro starter template with schema-validated intake, a CSS
token theme system, the shared contact Worker, and the Tier-1 deploy plus its
paper deliverables (contract, DPA, handover bundle). Level-2 backends are a
separate planning round ([level-2.md](level-2.md)) and get no steps here.

## Risks & unknowns
🤖 ai-audited(fable-5) · ❔ unverified (not checked)

- Nothing in [decisions.md](decisions.md) is settled. Steps 2–13 assume the
  recommendations hold (Astro 7, move-not-copy migration, Cloudflare
  hosting). A different settle reshapes the plan from step 1 on.
- The Astro 7.x spike stays load-bearing even though Astro 7 itself is
  confirmed real and current: whether the Rust compiler / Vite 8 combination
  runs the React/shadcn islands cleanly is exactly what the spike exists to
  answer.
- Migration is not a pure move. Verified this pass: 24 of 36 components in
  `reusables/component/` import through `@/components/ui/*` and `@/utils/*`
  aliases the template must reproduce, and some hardcode palette colors
  (`reusables/component/IconToggle.tsx:33`,
  `reusables/component/CopyButton.tsx:39`) that fight the "themes restyle
  everything without code edits" requirement. Budget rework in steps 2 and 4.
- Two decisions.md facts came back slightly off (details in steps 1 and 13):
  the Astro version number, and "Pages is maintenance-mode", which official
  material states more softly. Neither changes a recommendation.
- Client #1 does not exist yet. The plan deliberately gates pattern-building
  on their needs, so step 8's scope is unknowable until intake starts.
- The jurisdiction question is open and blocks the wording of the legal
  skeletons and DPA (steps 7 and 11), though not their structure.

## Steps

### Step 1: Run the Astro 7.x spike
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://astro.build/blog/astro-7/ §release announcement

A throwaway Astro 7 project: one page, one shadcn/React component hydrated as
an island, Tailwind v4 with `@theme inline` tokens, one Zod-validated content
collection loaded from YAML. Confirmed this pass: Astro 7.0 shipped
2026-07-07 with the Rust markdown pipeline and Vite 8/Rolldown, current line
7.0.x. Note: [decisions.md](decisions.md) §1 cites "7.1.0 as of 2026-07-16",
which did not check out — the 7.x claim holds, the version number does not.
The spike still gates steps 3–5: what it must prove is the React/shadcn
island setup surviving the new compiler, or it triggers the 6.x fallback.

### Step 2: Lay out the library and migrate reusables/
🤖 ai-audited(fable-5) · 🔗 verified → src: reusables/package.json:5

Create the factory library structure: keep `component/`, `shadcn/`, `util/`
(all three confirmed present, with a dev-only vitest harness whose
package.json states "consumers copy source files, never this package"), add
`sections/` and `patterns/`. Move (not copy) the content in — 36 components,
9 shadcn primitives, ~25 utils/hooks on React 19 — freeze `reusables/` with a
pointer file, and update the Reusables section at `CLAUDE.md:40`. The `@/`
path aliases used by 24 components must exist in the template's tsconfig, and
the hardcoded-color components need token rework at move time (see Risks).
Decide at move time whether the `site/`/`app/` regrouping happens now or
never ([decisions.md](decisions.md) §8).

### Step 3: Build the starter template
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://docs.astro.build/en/guides/content-collections/ §defining the collection loader / schema

An Astro project that becomes the copy-me seed for every client repo: page
shell, section ordering driven by the `sections:` key in `intake/site.yaml`,
content-layer wiring, and the `site.config.yaml` split for operator wiring.
Confirmed this pass: the content layer ships `file()` and `glob()` loaders
for local content, and an optional Zod schema per collection validates entry
data — exactly the singleton-file plus per-folder-collection shape in
[intake.md](intake.md). Build fails with a named error on schema violations.
Includes the reproducibility floor: committed lockfile, pinned toolchain,
one-command build check.

### Step 4: Build the theme token system
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://tailwindcss.com/docs/theme §inline option

`themes/<name>.css` files in the shadcn convention, mapped once in the
template via Tailwind v4 `@theme inline`. Both halves confirmed this pass:
Tailwind documents `@theme inline` specifically for theme variables that
reference other variables (the shadcn wiring case), and shadcn's theming doc
(https://ui.shadcn.com/docs/theming) confirms semantic tokens as CSS
variables in OKLCH with dark mode as a `.dark`-scoped override of the same
tokens. Ship a default theme plus one deliberately different second theme to
prove the swap — which is what forces the hardcoded-color cleanup flagged in
Risks.

### Step 5: Build the intake kit
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

The Zod schema per section/pattern (single source of truth, shared with step
3's validation), the client questionnaire template mirroring the schemas
field for field, the image checklist, and the `intake/` directory convention
from [intake.md](intake.md). All net-new artifacts; the validation mechanism
they plug into is verified under step 3. The questionnaire stays a copyable
doc in v1; generating it from the chosen patterns is a later idea, not this
step.

### Step 6: Build the shared contact Worker
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://resend.com/docs/send-with-cloudflare-workers §send emails with Cloudflare Workers

The one operator-run service in Level 1: a Cloudflare Worker fronted by
Turnstile that relays form posts through Resend, tenanted by per-site key and
destination email from `site.config.yaml`. Confirmed this pass: Resend
documents the Workers integration directly (SDK via npm, verified domain
required), and Turnstile's server-side flow is a mandatory `siteverify` call
from the backend with single-use tokens expiring at 300 seconds
(https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
Keep tenancy as config, not hardcode — this Worker is the Level-2 rehearsal
([level-2.md](level-2.md)).

### Step 7: Build the legal pages pattern
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

Skeleton privacy, terms, and refund/cancellation pages with intake slots.
The privacy page assembles from paragraphs contributed by the patterns the
site actually uses, plus an analytics toggle from `site.config.yaml`. The
same build-time check as content slots enforces the page set whenever
contact, booking, or payment is present. Lawyer-supplied text in
`intake/copy/legal-*.md` replaces the skeleton wholesale. Wording waits on
the jurisdiction answer; structure does not.

### Step 8: Build sections and patterns client-driven
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

Header/nav and footer first (mandatory everywhere), then only what client #1
needs, each built against its slot table in [catalog.md](catalog.md) and
harvested into the library as it lands. The migrated utils are real raw
material here (pagination, debounced search, theme toggle, and the rest of
the 36-component inventory), but every section component is net-new. Every
pattern must pass the "config and content changes only" bar for its
documented slots. Consent gating for map/booking embeds (click-to-load
wrapper) belongs to this step. Building the rest of the catalog up front is
the named failure mode; the catalog grows client by client.

### Step 9: Assemble the launch checklist and build gates
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://github.com/GoogleChrome/lighthouse-ci §assertions

The measurable meaning of "finished": clean build, Lighthouse thresholds
(performance, accessibility, SEO), legal pages present where required, forms
and embeds verified live, favicon and OG image set. Confirmed this pass:
Lighthouse CI (`@lhci/cli`, actively maintained) asserts minimum category
scores from a config file and fails the run below threshold — the
`collect`/`assert` pair is the scriptable half of this step. The rest stays
a checklist doc in the template.

### Step 10: Script the Tier-1 deploy and handover bundle
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

Deploy to the supported baseline (SSH-reachable static file host: rsync
target or Docker host) and generate the handover bundle from `site.config`:
deploy steps, server layout, DNS records, dependency register (service,
owner, plan, cost, named fallback), rebuild instructions. The bundle is
produced for every tier (it is also the escrow copy), so keep it a generator,
not a Tier-1 one-off.

### Step 11: Draft the contract and DPA
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

The standard client contract (scope, two included revision rounds, the
three-week stall rule, post-launch pricing, liability cap, IP split,
offboarding) and the DPA template with its sub-processor list from the
dependency register. Documents, not code, but Phase-1 deliverables the first
client cannot be taken on without. Parameters marked "proposed" in
[operations.md](operations.md) get settled here or ship as proposed.

### Step 12: Ship client #1 and measure
🤖 ai-audited(fable-5) · ❔ unverified (net-new)

Run the whole pipeline once, real or dogfood, assumed Tier 1: intake,
assembly, preview and written approval, launch checklist, deploy, handover.
Record hours per stage into [operations.md](operations.md) §7 and back-port
every generalizable fix into the library. This step is the gate for pricing
(build-fee placeholder becomes a number) and therefore for Phase 2.

### Step 13: Stand up the hosted tiers
🤖 ai-audited(fable-5) · 🔗 verified → doc: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/ §free custom hostnames

Phase 2, gated on pricing settled. One Cloudflare Worker project per client
serving static assets, the two Tier-2 domain flows, Tier-3 domains via
Cloudflare Registrar, monitoring, care-plan billing, and the offboarding
runbook. Confirmed this pass: static-asset requests on Workers are free
(https://developers.cloudflare.com/workers/static-assets/), Cloudflare for
SaaS includes 100 custom hostnames free then $0.10/month each, and Registrar
sells and renews at cost with no markup
(https://www.cloudflare.com/products/registrar/). One correction to
[decisions.md](decisions.md) §6: official material says Pages "remains fully
supported" with Workers recommended for new projects — full parity as of
March 2026, but "maintenance-mode" overstates it. The recommendation stands
either way.
