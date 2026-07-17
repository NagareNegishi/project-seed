# Product plan: site-factory

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 13 · 👤 human-ok 0 · ✅ settled 0

## about
🤖 ai-audited(fable-5) — tightened from dictation; delivery model settled as template-per-client in Q&A

A site factory for client webpages: a library of reusable components and
patterns (contact, booking, payment, map, scheduling, app download), plus
starter templates and themes. A new client site starts as a copy of a template,
gets patterns copied in from the library, and is filled with the client's
content. Seeded from project-seed; `reusables/` is the embryo of the library.

## problem / motivation
🤖 ai-audited(fable-5) — no numbers yet on hours per site; add after the first client build

Small-business sites repeat the same dozen patterns, yet each one gets built
from scratch. That wastes days per site on work that has been done before.
`reusables/` already collects portable pieces, but there is no template to
start from, no theme system, and no defined path from "client sends content"
to "site is live". Clients also differ in how much they want to touch: some
have their own server, some just own a domain, some want to hand over content
and nothing else. Without defined tiers, each of those becomes a custom
negotiation.

## goal
🤖 ai-audited(fable-5) — outcome phrased without mechanism; "days" is a target, not a measurement

Given a client's content, deliver a finished, deployed site in days rather
than weeks. Concretely: starting a site means picking a template, a theme, and
a set of patterns, filling in content, and deploying through one of three
fixed tier paths. No pattern in the catalog is ever written twice.

## audience
🤖 ai-audited(fable-5) — tier definitions settled in Q&A (IP tier and DNS tier are separate)

Primary user: the operator (you), assembling and delivering sites.

Client tiers, by how much the client does:

- **Tier 1 — self-hosted**: client configures their side and provides a server
  IP (and domain). The built site is deployed onto their infrastructure.
- **Tier 2 — hosted**: client uses the framework as offered; they own a domain
  and point DNS at hosting we run. They never touch a server.
- **Tier 3 — full service**: client provides content only. Hosting, domain,
  and everything technical is handled for them.

## requirements
🤖 ai-audited(fable-5) — rephrased into EARS; intake format and Level-2 details deliberately deferred to open questions

- When a new client project starts, the operator shall create the client's
  site repo as a copy of a chosen starter template.
- When a needed pattern exists in the library, the operator shall copy it into
  the client repo and have it work without modification in the common case.
- When a client provides content (text, images, brand assets), the intake
  shall follow a defined format that maps directly to template slots.
- When a theme is selected, it shall restyle every component through design
  tokens (color, type, spacing) without editing component code.
- When a site uses only Level-1 patterns, the build shall produce a fully
  static site deployable to any static host.
- When a site needs a Level-2 pattern (booking, payment, scheduling with real
  logic), only that pattern's backend service or integration shall be added;
  the rest of the site stays static.
- When a Tier-1 client provides a server IP and access, the deploy process
  shall ship the built site to that server.
- When a Tier-2 client points their domain's DNS at our hosting, the site
  shall be served from it under their domain.
- When a Tier-3 client provides content only, the operator shall provision
  hosting and domain on their behalf with no client involvement.

## stack
🤖 ai-audited(fable-5) — two-level split settled in Q&A; Level 2 is design-only this round, detailed in a later planning session

React + TypeScript, shadcn/ui + Tailwind, matching `reusables/`. Static-first:
the site generator is Astro or Next.js static export (open question below).

Patterns come in two levels:

- **Level 1 — frontend only.** Every pattern ships first as a static
  component using embeds or third-party endpoints: contact via a form-endpoint
  service or mailto, map as an embed, payment as Stripe Payment Links,
  scheduling as a Calendly-style embed, app download as store links.
- **Level 2 — owned backend.** Per-pattern services replace the third-party
  stopgaps where a client needs real logic: own booking engine with
  availability, Stripe integration with webhooks, own scheduling service.
  This plan defines what Level 2 must support; its design is a separate,
  later planning round (see phasing).

## target device / platform
🤖 ai-audited(fable-5) — no change beyond tightening

Responsive web, mobile-first. Small-business visitors arrive mostly on phones.
Modern evergreen browsers; no legacy support.

## constraints
🤖 ai-audited(fable-5) — added the accepted drift trade-off so it reads as a decision, not an oversight

- Delivery is template-repo-per-client. Accepted trade-off: delivered sites
  drift from the library, and library updates do not propagate to them.
- Seeded from project-seed; `reusables/` content migrates into the library
  rather than being rewritten.
- Solo operator. Every process (intake, assembly, deploy) must be cheap to run
  alone; anything that needs a team is out.
- Level-2 backends are documented, not built, in this round.

## non-goals
🤖 ai-audited(fable-5) — engine explicitly parked rather than rejected, per Q&A

- Not a config-driven engine or multi-tenant site builder. A site is a repo,
  not a row in a database. Revisit only if the template model proves too
  costly at real volume.
- No client-facing self-serve editor or CMS in v1. Clients send content; they
  do not edit sites.
- No automatic update propagation to already-delivered sites.
- The app-download pattern links to existing apps. Building mobile apps is out.
- Not a public framework for other developers. Internal tool first; opening it
  up is a separate decision.

## open questions
🤖 ai-audited(fable-5) — each item blocks or shapes a requirement above; none are cosmetic

- Astro vs Next.js static export for the template base.
- Content intake format: structured doc, folder convention, or a small schema?
  This decides how mechanical "fill in content" can get.
- v1 pattern catalog: which patterns and page sections make the first cut
  (hero, pricing, FAQ, gallery, testimonials are candidates beyond the six
  named ones).
- Theme encoding: Tailwind config per theme, CSS variables/tokens, or both.
- Level 2 shape: one shared multi-client service per pattern, or an instance
  per client? Drives cost, isolation, and maintenance.
- Hosting for Tiers 2 and 3: static host (Cloudflare/Netlify class) vs own
  VPS. Affects what Level 2 can run.
- Tier packaging and pricing (business question, but it shapes what each tier
  technically includes).
- Migration of `reusables/`: move into the new library or copy and let the
  seed keep its own?
- Payment tier obligations: Stripe covers PCI, but delivered sites still need
  terms and privacy pages. Whose template provides them?

## service tiers (extra)
🤖 ai-audited(fable-5) — expands the audience tiers into what each requires operationally

| | Client provides | We provide | Deploy target |
|---|---|---|---|
| Tier 1 self-hosted | content, config choices, server IP + access, domain | built site, deploy run, handover docs | client's server |
| Tier 2 hosted | content, config choices, domain (DNS pointed at us) | built site, hosting, TLS | our hosting |
| Tier 3 full service | content only | everything: build, hosting, domain, upkeep | our hosting |

Tier 1 needs a repeatable deploy script and a handover doc. Tiers 2 and 3
share hosting; Tier 3 adds domain purchase and ongoing upkeep, which makes it
the only tier with a permanent operational cost per client.

## pattern catalog (extra)
🤖 ai-audited(fable-5) — Level-1/Level-2 mapping per named pattern; catalog cut is still an open question

| Pattern | Level 1 (static) | Level 2 (owned backend) |
|---|---|---|
| contact | form-endpoint service or mailto | own form handler + notification |
| booking | embed (Calendly-class) | booking engine with availability |
| payment | Stripe Payment Links | Stripe API + webhooks, order state |
| scheduling | shared-calendar embed | own scheduling service |
| map | map embed | not needed |
| app download | store badges + links | not needed |

Plus content sections with no backend at any level: hero, pricing table, FAQ,
gallery, testimonials, footer.

## phasing (extra)
🤖 ai-audited(fable-5) — Level-2/backend design pushed to its own planning round, per Q&A

1. **Phase 1 — factory core**: starter template, theme tokens, Level-1
   versions of every catalog pattern, content-intake convention, Tier-1
   deploy script. Outcome: one real (or dogfood) client site shipped.
2. **Phase 2 — hosting tiers**: Tier 2/3 hosting setup, TLS, domain flow.
3. **Phase 3 — Level-2 backends**: separate planning round (own
   `plan-product` pass per service or one for the backend platform). This doc
   only fixes what Phase 3 must support: booking, payment, scheduling as
   per-pattern additions that leave the rest of the site static.
