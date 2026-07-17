# site-factory: delivery and operations

Maturity: 🤖 ai-audited(fable-5) — synthesized 2026-07-17 from two review
agents (coherence + ops/business); no human review yet. Everything here is a
proposal for [product.md](product.md); items marked **(req)** are candidate
requirements, the rest is process design.

The reviews' shared core finding: the plan defined a site's birth but not its
life. This doc fills that: the client process around the build, what each tier
obliges the operator to forever, and how delivered sites survive time.

## 1. Client lifecycle

The pipeline the requirements skipped between "content arrives" and "site is
live", and after:

1. **Intake** — per [intake.md](intake.md). Stall rule **(req)**: if required
   content is missing after N weeks (propose 3), the project pauses and
   re-enters the queue when content arrives; the contract says so. Clients are
   the slowest part of every build; without a stall rule their delay becomes
   the operator's schedule.
2. **Assembly** — template + theme + patterns + content.
3. **Preview and sign-off (req)** — every site gets a staging URL
   (`<client>.preview.<operator-domain>`); production deploy happens only on
   written client approval. This is where most calendar time in client work
   actually goes, so it must be in the plan, not improvised.
4. **Revision rounds (req)** — the contract fixes N included revision rounds
   (propose 2); further rounds are billed. Unbounded revisions are where solo
   web shops lose their margin.
5. **Launch** — a site is "finished" when the launch checklist passes
   **(req)**: builds clean, Lighthouse thresholds met (perf, accessibility,
   SEO), legal pages present where required, forms/embeds verified, favicon +
   OG image set. The checklist is the measurable meaning of the goal's
   "finished".
6. **Post-launch changes (req)** — a defined, priced path on every tier:
   per-change fee, or a change budget inside the Tier 2/3 care plan. With the
   CMS non-goal in place, every "change the opening hours" email is operator
   work forever; unpriced, that quietly breaks the "cheap to run alone"
   constraint. The pressure valve, if volume demands it later, is a narrow
   git-based CMS for plain content (hours, prices, news) — recorded in
   [ideas.md](ideas.md), non-goal stands for v1.

## 2. Tier obligations and exit

The plan understated the liability: Tier 2 as well as Tier 3 commits the
operator permanently to hosting, TLS, uptime, and being the person who gets
called. Corrections:

- **Recurring fee (req)**: Tiers 2 and 3 require an ongoing fee (care plan /
  retainer). No hosted site without recurring revenue attached.
- **Offboarding (req)**: a defined exit per tier — client receives their repo
  and a static build, DNS is un-pointed, any domain is transferred. The first
  non-paying client must hit a procedure, not an improvisation.
- **Domain ownership (req)**: Tier-3 domains are registered with the client
  as registrant (operator may manage them). Operator-owned client domains turn
  every exit into a hostage negotiation.
- **Escrow / bus factor (req)**: at delivery, every client gets a copy of
  their repo, content, and credentials (the Tier-1 handover bundle,
  produced for all tiers). This is also the honest answer to "what if the
  operator disappears" — a solo shop owes clients that answer.
- **Repo hosting**: client repos live in a private GitHub org (one repo per
  client), which pairs with the escrow copy above.

## 3. Tier 1: supported baseline

"Client provides server IP + access" is the highest-variance work in the
plan: arbitrary OSes, cPanel-only hosts, missing SSH. Constrain it **(req)**:
Tier 1 supports a defined baseline — a server reachable over SSH that can
serve static files (rsync target or Docker host). Anything else is billed
hourly as consulting. TLS on the client's server is the client's
responsibility unless the deploy script can configure it (Caddy/certbot case);
the handover doc states which. The operator's obligation ends at "the build
artifact works"; post-handover server problems are the client's.

Handover doc contents (generated from `site.config`, see
[ideas.md](ideas.md)): deploy steps, server layout, DNS records, dependency
register (section 5), rebuild instructions.

## 4. Legal baseline

The plan's one legal line (terms/privacy for payment sites) is a fraction of
the real surface. For a solo operator with no company between them and a
claim, this must be library-level, built once:

- **Client contract (req, Phase 1 deliverable)**: scope, revision rounds,
  post-launch pricing, liability cap, IP (client owns their repo; operator
  retains the library), payment terms, the intake stall rule, and the
  offboarding procedure. One standard document, not per-client drafting.
- **GDPR roles (req)**: for Tiers 2/3 the operator hosting the site is
  plausibly a data processor for the client (contact forms collect PII), which
  requires a DPA; form-endpoint, analytics, and scheduling services are
  sub-processors and belong in the dependency register. A standard DPA
  template is a Phase 1 deliverable alongside the contract.
- **Consent-gated embeds (req)**: map, scheduling, and analytics embeds
  render only after consent (click-to-load wrapper). Solves EU consent
  enforcement and improves first-paint performance at the same time.
- **Accessibility**: the European Accessibility Act has been enforceable
  since June 2025 and covers e-commerce services — which the payment and
  booking patterns are. Many clients will fall under the microenterprise
  exemption, but the operator cannot assume it. The economical answer:
  WCAG-conformant patterns as a library property, built once, checked by the
  Lighthouse gate. Never per-client accessibility work.
- **Payment obligations**: selling to EU consumers needs terms of sale,
  withdrawal/refund policy, and price display rules beyond the privacy page.
  The payment pattern ships with the full legal page set or is not offered
  **(req)**. Legal page mechanism: [catalog.md](catalog.md) §legal.
- Open question for [product.md](product.md): which jurisdictions are clients
  in? Determines how much of GDPR/EAA actually applies.

## 5. Third-party dependency policy

Level 1 deliberately leans on external services. Rules that keep that from
rotting:

- **Account ownership (req)**: service accounts (scheduling, Stripe, form
  fallback) are created in the client's name with the operator as
  collaborator, wherever the service allows. Operator-owned accounts are a
  single point of failure and a lock-in clients didn't agree to. Where the
  operator runs a shared service (the form Worker, see
  [decisions.md](decisions.md)), that's an operator dependency and is listed
  as such.
- **Dependency register (req)**: every delivered site ships a generated list:
  service, account owner, plan, monthly cost, named drop-in replacement. The
  register is the handover doc's spine and the fleet board's data source.
- **Named fallback (req)**: every Level-1 pattern in the catalog names at
  least one alternative service, so a provider shutdown is a swap, not a
  redesign.
- **Monitoring (req, Tiers 2/3)**: an uptime check per site plus a periodic
  scripted check that forms and embeds still resolve. By design nothing
  propagates updates, so nobody notices a silently dead contact form unless
  something checks. Tier 1: offered as part of a care plan, else the client's.
- Free-tier reality (verified 2026-07): Formspree free is 50
  submissions/month with branding; Calendly free is one event type with
  branding and no reminders. "Level 1 = cheap" is only true with the service
  choices in [decisions.md](decisions.md); free tiers of the well-known names
  are not client-grade.

## 6. Maintenance and drift

The accepted drift constraint survives contact with time only under these
rules:

- **Reproducible builds (req)**: every delivered repo commits its lockfile,
  pins the toolchain (`.nvmrc`/`mise`), and includes a one-command build
  check. Optionally commit the built output so the site can be redeployed
  without a working toolchain. Otherwise the first 2028 change request lands
  on a repo that no longer builds.
- **Per-tier upkeep definition (req)**: Tier 1 — none after handover. Tiers
  2/3 under the care plan — site keeps serving, monitoring active, dependency
  register reviewed yearly. This is what the tier table's word "upkeep"
  means.
- **Drift does not extend to Level 2 (constraint for the Phase-3 round)**:
  unpatched per-client payment/booking backends are not an acceptable
  trade-off, and patching N divergent instances solo does not scale. Level-2
  services must be shared or centrally updateable
  ([level-2.md](level-2.md) fixes this as "multi-tenant-first").
- **Back-porting**: a pattern fixed inside a client repo should have its fix
  carried back to the library when general (the goal's "never written twice"
  read as "never *solved* twice"). The drift ledger in [ideas.md](ideas.md)
  makes this findable; no automation, just practice.

## 7. Capacity

"Cheap to run alone" needs numbers. From client #1, track hours per stage
(intake, assembly, revisions, deploy, post-launch). Derive from measurement:
the target hours per site, the concurrent-build ceiling, and the cap on how
many care-plan clients one person can hold. The plan's own audit note ("no
numbers yet; add after the first client build") already points here — this
section is where those numbers land.
