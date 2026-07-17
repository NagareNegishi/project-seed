# Product plan: site-factory

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 13 · 👤 human-ok 0 · ✅ settled 0

Detail docs (all 🤖 ai-audited(fable-5), agent review 2026-07-17):
[decisions.md](decisions.md) — recommendations for the nine open questions ·
[catalog.md](catalog.md) — v1 catalog with slots ·
[intake.md](intake.md) — content intake ·
[operations.md](operations.md) — delivery, tiers, legal, maintenance ·
[level-2.md](level-2.md) — Level-2 contract ·
[ideas.md](ideas.md) — expansion idea pool.

## about
🤖 ai-audited(fable-5) — agent review 2026-07-17: added the lifecycle framing; delivery model unchanged

A site factory for client webpages: a library of reusable components and
patterns, plus starter templates and themes. A new client site starts as a
copy of a template, gets patterns copied in from the library, and is filled
with the client's content through a defined intake, preview, and approval
process. The factory covers the site's whole life: build, launch, and the
per-tier obligations that follow. Seeded from project-seed; `reusables/` is
the embryo of the library.

## problem / motivation
🤖 ai-audited(fable-5) — no numbers yet on hours per site; add after the first client build (capacity model: operations.md §7)

Small-business sites repeat the same dozen patterns, yet each one gets built
from scratch. That wastes days per site on work that has been done before.
`reusables/` already collects portable pieces, but there is no template to
start from, no theme system, and no defined path from "client sends content"
to "site is live". Clients also differ in how much they want to touch: some
have their own server, some just own a domain, some want to hand over content
and nothing else. Without defined tiers, each of those becomes a custom
negotiation. And without a defined process after launch, every delivered site
becomes an open-ended support obligation.

## goal
🤖 ai-audited(fable-5) — agent review 2026-07-17: "finished" now measurable via launch checklist; "written twice" softened to match the accepted drift constraint

Given a client's content, deliver a finished, deployed site in days of
operator work rather than weeks. Concretely: starting a site means picking a
template, a theme, and a set of patterns, filling in content through the
intake format, getting client approval on a preview, and deploying through
one of three fixed tier paths. "Finished" means the launch checklist passes
(builds clean, Lighthouse thresholds, legal pages where required, forms and
embeds verified). No pattern in the catalog is ever built from scratch twice;
fixes made inside client repos are carried back to the library when general.

## audience
🤖 ai-audited(fable-5) — agent review 2026-07-17: Tier-3 wording fixed (clients always provide content and approval); tier definitions otherwise as settled in Q&A

Primary user: the operator (you), assembling and delivering sites.

Client tiers, by how much the client does:

- **Tier 1 — self-hosted**: client configures their side and provides a
  server meeting the supported baseline (SSH, static files) plus a domain.
  The built site is deployed onto their infrastructure; clean handover.
- **Tier 2 — hosted**: client uses the framework as offered; they own a
  domain pointed at hosting we run, and pay an ongoing care-plan fee. They
  never touch a server.
- **Tier 3 — full service**: client provides content and approvals only.
  Hosting, domain (registered in the client's name), and everything
  technical is handled for them under a retainer.

## requirements
🤖 ai-audited(fable-5) — agent review 2026-07-17: added the client process, obligations, and survivability requirements both reviews flagged as missing; details in operations.md

Build and assembly:

- When a new client project starts, the operator shall create the client's
  site repo as a copy of a chosen starter template.
- When a needed pattern exists in the library, the operator shall copy it
  into the client repo and have it work with configuration and content
  changes only — no code edits — for the pattern's documented slots.
- When a client provides content, the intake shall follow the defined format
  ([intake.md](intake.md)): a questionnaire mirroring the content schema,
  transcribed by the operator, validated at build time.
- When a theme is selected, it shall restyle every component through design
  tokens without editing component code.
- When a site uses only Level-1 patterns, the build shall produce a fully
  static site deployable to any static host.
- When a site needs a Level-2 pattern, only that pattern's backend service
  shall be added; the rest of the site stays static
  ([level-2.md](level-2.md)).
- When a repo is delivered, it shall build reproducibly: lockfile committed,
  toolchain pinned, one-command build check.

Client process ([operations.md](operations.md) §1):

- When assembly is complete, the operator shall publish a preview URL, and
  deploy to production only on written client approval.
- When a client requests revisions, the included rounds are capped by the
  contract; further rounds are billed.
- When required content is missing past the stall deadline, the project
  pauses and re-enters the queue on arrival.
- When a client requests a post-launch change, it shall follow the priced
  change process for their tier.

Tiers and obligations ([operations.md](operations.md) §2–3):

- When a Tier-1 client provides a server meeting the supported baseline, the
  deploy process shall ship the built site to it, and the operator shall
  deliver a handover bundle (deploy steps, dependency register, rebuild
  instructions). TLS responsibility is stated in the handover doc.
- When a Tier-2 client points their domain at our hosting, the site shall be
  served under their domain with TLS; hosting requires an active care plan.
- When a Tier-3 client provides content only, the operator shall provision
  hosting and a domain registered in the client's name, under a retainer.
- When a Tier-2/3 client offboards, the defined exit applies: repo and
  static build handed over, DNS un-pointed, domain transferred.
- When any site is delivered, the client receives a copy of their repo,
  content, and credentials.

Legal and dependencies ([operations.md](operations.md) §4–5):

- When a site includes contact, booking, or payment, the build shall require
  the legal page set; third-party embeds shall be consent-gated.
- When a pattern uses a third-party service, the account shall be in the
  client's name where the service allows, and the site ships a dependency
  register naming a fallback service.
- When a Tier-2/3 site is live, monitoring shall check uptime and that forms
  and embeds still resolve.

## stack
🤖 ai-audited(fable-5) — agent review 2026-07-17: open stack questions now carry recommendations (decisions.md §1, §4, §6), pending your settle

React + TypeScript, shadcn/ui + Tailwind, matching `reusables/`.
Static-first. Recommended and awaiting settle ([decisions.md](decisions.md)):
Astro 7.x as the template base (React reusables as islands), themes as CSS
variable files in the shadcn convention via Tailwind v4 `@theme inline`,
Cloudflare Workers static hosting for Tiers 2/3.

Patterns come in two levels:

- **Level 1 — frontend only.** Every pattern ships first as a static
  component using embeds or third-party endpoints. Concrete picks per
  pattern: [catalog.md](catalog.md).
- **Level 2 — owned backend.** Per-pattern services replace the third-party
  stopgaps where a client needs real logic. This plan fixes the contract
  those services must satisfy ([level-2.md](level-2.md)); their design is a
  separate, later planning round (see phasing).

## target device / platform
🤖 ai-audited(fable-5) — no change

Responsive web, mobile-first. Small-business visitors arrive mostly on
phones. Modern evergreen browsers; no legacy support.

## constraints
🤖 ai-audited(fable-5) — agent review 2026-07-17: drift trade-off scoped to Level 1; reusables wording aligned with the move recommendation

- Delivery is template-repo-per-client. Accepted trade-off: delivered sites
  drift from the library, and library updates do not propagate to them. The
  trade-off is scoped to Level-1 static output; it does NOT extend to
  Level-2 backends, which must be shared or centrally updateable.
- Seeded from project-seed; `reusables/` content migrates into the library
  rather than being rewritten (recommended: move, not copy —
  [decisions.md](decisions.md) §8).
- Solo operator. Every process (intake, assembly, deploy, upkeep) must be
  cheap to run alone; anything that needs a team is out. Capacity numbers
  are tracked from client #1 ([operations.md](operations.md) §7).
- Level-2 backends are documented, not built, in this round.
- No hosted tier without recurring revenue attached.

## non-goals
🤖 ai-audited(fable-5) — agent review 2026-07-17: added the "not in v1 catalog" line so the coverage claim is checkable; CMS pressure valve recorded

- Not a config-driven engine or multi-tenant site builder. A site is a repo,
  not a row in a database. Revisit only if the template model proves too
  costly at real volume.
- No client-facing self-serve editor or CMS in v1. Clients send content;
  they do not edit sites. Known pressure valve if change volume demands it
  later: a narrow git-based CMS for plain content ([ideas.md](ideas.md) §4.5).
- No automatic update propagation to already-delivered sites.
- Not in the v1 catalog (neither built nor promised): blog/news,
  multi-language, app-download (built on first demand), restaurant menu as
  a distinct pattern. See [catalog.md](catalog.md) §Cut.
- The app-download pattern links to existing apps. Building mobile apps is
  out.
- Not a public framework for other developers. Internal tool first; opening
  it up is a separate decision.

## open questions
🤖 ai-audited(fable-5) — agent review 2026-07-17: the nine original questions now carry adjudicated recommendations in decisions.md; listed here is only what remains genuinely open

The nine original questions (framework, intake, catalog, themes, Level-2
shape, hosting, pricing, reusables, legal pages) are answered as
recommendations — some with challenger-approved second recommendations — in
[decisions.md](decisions.md), awaiting per-entry review and settle.

Still open, no recommendation yet:

- Jurisdiction mix of expected clients — determines how much of GDPR/EAA
  applies and how the legal skeletons are worded.
- Build-fee magnitude and capacity caps — placeholder until the first
  measured build (deadline, not option).
- Contract parameters: included revision rounds (proposed 2) and intake
  stall deadline (proposed 3 weeks).
- Astro 7.x spike outcome — confirms the primary or triggers the 6.x second
  recommendation.
- Whether Tier-1 clients can buy Level 2 on their own infrastructure —
  priced option, feasibility decided in the Phase-3 round.

## service tiers (extra)
🤖 ai-audited(fable-5) — agent review 2026-07-17: corrected the operational-cost claim (Tier 2 also carries permanent obligations); added exit and monitoring

| | Client provides | We provide | Deploy target | Recurring |
|---|---|---|---|---|
| Tier 1 self-hosted | content, config choices, baseline server + access, domain | built site, deploy run, handover bundle | client's server | none (paid support on request) |
| Tier 2 hosted | content, config choices, domain (DNS pointed at us) | built site, hosting, TLS, monitoring | our hosting | care plan |
| Tier 3 full service | content and approvals only | everything: build, hosting, domain (client-owned), upkeep, monitoring | our hosting | retainer |

Tiers 2 and 3 both carry permanent operational obligations, which is why both
require recurring fees and a defined offboarding path
([operations.md](operations.md) §2). Tier 1 ends at handover; the bundle and
dependency register make that ending clean.

## pattern catalog (extra)
🤖 ai-audited(fable-5) — agent review 2026-07-17: catalog cut recommended (12 sections + 4 patterns); full slots and mechanisms moved to catalog.md

Recommended v1 cut ([catalog.md](catalog.md), [decisions.md](decisions.md) §3):

| Pattern | Level 1 (static) | Level 2 (owned backend) |
|---|---|---|
| contact | shared CF Worker + Resend + Turnstile | own form handler + notification (same Worker grown up) |
| booking (covers scheduling at L1) | Cal.com-class embed, client's account | booking engine with availability; scheduling splits out (classes/rotas) |
| payment | Stripe Payment Links, client's account | Stripe API + webhooks, order state |
| map | keyless Google share embed | not needed |
| app download | store badges + links (on first demand) | not needed |

Plus 12 content sections with no backend at any level: header/nav, hero,
services, pricing, about/team, testimonials, gallery, opening hours, FAQ,
CTA banner, footer, legal pages. Header/nav and footer are mandatory; legal
pages are build-enforced when data-collecting patterns are present.

## phasing (extra)
🤖 ai-audited(fable-5) — agent review 2026-07-17: Phase 1 rephased client-driven (was: build every pattern up front); ordering and gates made explicit

1. **Phase 0 — settle**: review [decisions.md](decisions.md) and settle the
   nine recommendations; run the Astro 7.x spike. Cheap, unblocks everything.
2. **Phase 1 — factory core, client-driven**: starter template, theme
   tokens, intake format, launch checklist, standard contract + DPA + legal
   skeletons, Tier-1 deploy script — plus only the patterns and sections the
   first client (real or dogfood, assumed Tier 1) actually needs, harvested
   into the library on the way. Outcome: one site shipped and measured
   (hours per stage). The rest of the catalog grows client by client;
   building every pattern before the first client is the failure mode, not
   the goal.
3. **Phase 2 — hosting tiers**: gated on pricing settled. Tier 2/3 hosting,
   TLS, domain flow, care-plan packaging, monitoring, offboarding procedure.
4. **Phase 3 — Level-2 backends**: separate planning round per service or
   for the platform, designing against the contract in
   [level-2.md](level-2.md): multi-tenant-first, tenancy as config,
   centrally updateable, site stays static.
