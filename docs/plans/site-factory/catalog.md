# site-factory: v1 pattern catalog

Maturity: 🤖 ai-audited(fable-5) — drafted by agent review 2026-07-17,
adjudicated across three agents; no human review yet. The cut itself is
decision 3 in [decisions.md](decisions.md).

Rule for the cut: an item makes v1 if most small-business sites need it and
its Level-1 form costs at most a day to build. Everything in v1 ships at
Level 1 only (static or embed; owned backends are Phase 3, see
[level-2.md](level-2.md)).

"Slots" are the fields the client supplies through intake
([intake.md](intake.md)). Slots marked (opt) can be omitted. An omitted
section is left out of the page, never rendered empty. Header/nav and footer
are mandatory in every template; the rest are opt-in per site.

## Patterns (4)

| Pattern | Scope | Slots | Level-1 mechanism |
|---|---|---|---|
| contact | Contact form plus direct contact details | intro line (opt), recipient email, phone (opt), address (opt), success message | Shared Cloudflare Worker + Resend, fronted by Turnstile: no vendor branding, ~50 lines reused across all clients, per-site key + destination email in `site.config.yaml`. Escape hatch for a client who rejects an operator endpoint: Formspree on the client's own paid account. Mailto is a last resort only. |
| booking | Visitor books an appointment (covers scheduling at this level — same embed move; they split again at Level 2) | heading, embed snippet/URL, fallback phone/email | Embed-agnostic slot, default Cal.com on an account the client owns (free tier: unlimited event types, branded; brand removal ~$12–15/mo, client-paid, surfaced in tier packaging). A client arriving with Calendly keeps it. |
| payment | Visitor pays for a listed product or service | items: name, price display, payment link URL; footnote (opt) | Stripe Payment Links from the client's own Stripe account (operator generates links, never touches funds). No fixed cost; 2.9% + 30¢ per transaction. Requires the legal page set (below). |
| map | Show where the business is | address, embed URL, caption (opt) | Keyless Google Maps share-embed iframe: no Google Cloud project, no billing surface. Named fallback if the legacy endpoint retires: Maps Embed API. |

All four embeds/services follow the dependency policy in
[operations.md](operations.md) §5 (client-owned accounts where possible,
dependency register, consent gating for map/booking embeds).

## Sections (12)

| Section | Scope | Slots |
|---|---|---|
| header/nav (mandatory) | Logo, navigation, one action | logo (image or wordmark text), nav items (derived from included sections, operator reorders), primary CTA label+target (opt), phone (opt) |
| hero | First screen: what the business is, one action | headline, subline, image, primary CTA label+target, secondary CTA (opt) |
| services list | What the business sells, as cards or rows | title, intro (opt); items: name, description, icon or image (opt), from-price (opt) |
| pricing | Explicit prices or tiers | title; tiers: name, price, unit, feature lines, CTA (opt); footnote (opt) |
| about / team | Who runs the business | title, body text, photo; team members (opt): name, role, photo, one-liner |
| testimonials | Social proof | items: quote, name, detail (role/town/company), photo (opt); source note (opt) |
| gallery | Photos of work, premises, or products | title (opt); images: file, alt text, caption (opt) |
| opening hours | When the business is open | per-day time ranges (closed allowed), exceptions note |
| FAQ | Recurring questions, accordion | items: question, answer |
| CTA banner | Mid-page or pre-footer push to the main action | line, button label+target |
| footer (mandatory) | Contact recap, social, legal links | business name, address, phone, email, social links (platform + URL); nav and legal links filled automatically |
| legal pages | Privacy, terms, refund/cancellation as skeleton pages | legal name, trading name, contact email, postal address, jurisdiction, effective date |

Social links are a footer slot, not a section.

### Legal pages mechanism

The privacy page assembles from paragraphs contributed by the patterns the
site actually uses: contact form (name/email/message forwarded), booking
(contact details held by the provider or Level-2 service), payment
(processing by Stripe, no card data on the site), plus an analytics/cookies
paragraph toggled by `site.config.yaml`. No pattern, no paragraph — the page
never claims data practices the site doesn't have. A refund/cancellation page
ships whenever payment is present. Legal pages are mandatory whenever
contact, booking, or payment is included, enforced by the build-time schema
check. Client lawyer text in `intake/copy/legal-*.md` replaces the skeleton
wholesale. Jurisdiction escape hatch and liability line:
[decisions.md](decisions.md) §9.

## Cut from v1

- **scheduling** — at Level 1 it is the same move as booking: embed a
  third-party calendar. Two names for one embed doubles docs for no gain.
  Returns as a distinct pattern at Level 2 (recurring classes/rotas vs
  one-off appointments, see [level-2.md](level-2.md)).
- **app download** — store badges and two links; few small-business clients
  have an app; an afternoon to add on first demand. Second recommendation
  (see [decisions.md](decisions.md) §3): include at launch if the first
  client has an app or sales needs all six named patterns demonstrable.
- **blog / news** — collides with the no-CMS non-goal; a markdown-collection
  variant where the operator publishes is a Phase-2 idea
  ([ideas.md](ideas.md) §1.12).
- **menu (restaurant)** — v1 covers it as a styled services list or pricing
  section; promote to its own pattern when a restaurant client shows the
  variant is real.

Candidates beyond these (SEO pack, reviews embed, before/after, consent
wrapper, image pipeline): [ideas.md](ideas.md) §1, several tagged Phase 1.
