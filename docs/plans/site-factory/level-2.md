# site-factory: Level-2 contract

Maturity: 🤖 ai-audited(fable-5) — drafted by agent review 2026-07-17; no
human review yet. Level-2 design is Phase 3, a separate planning round. This
doc fixes only what that round must support, so it has a contract to design
against. Tenancy shape is decision 5 in [decisions.md](decisions.md).

## Ground rules (all services)

- The site stays static. A Level-2 pattern is a drop-in replacement for its
  Level-1 component: same slots, same place on the page, embed swapped for a
  JS island talking to the service over a small JSON API. Site config gains
  exactly two things: a service base URL and a public site key.
- The service owns all data. The static site stores nothing and holds no
  secrets; anything embedded in the page is public by definition.
- Visitor-facing endpoints are public (rate-limited, spam-guarded). Anything
  administrative (client viewing bookings, refunds) lives in the service's
  own admin surface, never in the delivered site.
- Every service can send transactional email and exposes per-client data
  export from day one.
- Tenancy: shared multi-tenant per pattern is the default; tenancy must be a
  configuration layer, not baked into the schema, so a dedicated instance is
  cheap to stand up (compliance exception, or a Tier-1 client buying
  Level 2). Client-infrastructure deployment is a priced option whose
  feasibility Phase 3 decides. Per-tenant API keys and the export capability
  are the isolation floor of the shared deployment.
- The accepted drift constraint does NOT extend to Level-2 services
  ([operations.md](operations.md) §6): they are shared or centrally
  updateable, never N divergent unpatched instances.

## Booking

- Capabilities: bookable services with duration and capacity; availability
  rules (weekly hours, exceptions, lead time); slot computation; visitor
  books with contact details; double-booking prevented; confirmation email
  to visitor and client; client views and cancels bookings; visitor cancels
  via tokened link.
- Data owned: service definitions, availability rules, bookings, visitor
  contact details.
- The site expects these nouns: **services** (listable), **availability**
  (free slots for a service over a date range), **booking** (create; cancel
  by token). Nothing else.
- Migration note: Level 1 defaults to Cal.com, which is open-source;
  self-hosted Cal.com is a candidate implementation rather than a rewrite —
  evaluate in the Phase-3 round.

## Payment

- Capabilities: product/price catalog; create a checkout session (Stripe
  Checkout under the hood); consume webhooks to track order state; order
  status lookup by token for a thank-you page. Refunds happen in the Stripe
  dashboard at first, not through the service.
- Data owned: products/prices, orders, payment status. Card data never
  touches the service; that stays Stripe's. Same client Stripe account as
  Level 1, so nothing is thrown away on upgrade.
- The site expects: **products** (listable), **checkout-session** (create,
  returning a redirect URL), **order** (status by token).

## Scheduling

Distinct from booking at this level: recurring occurrences with shared
capacity (classes, sessions, rotas) rather than one-off private appointments.

- Capabilities: recurring event templates over staff/resource calendars;
  occurrence generation; visitor signup against occurrence capacity;
  cancellation by token; reminder emails.
- Data owned: schedules, occurrences, attendee lists.
- The site expects: **schedule** (upcoming occurrences), **signup** (create),
  **cancellation** (by token).

## Forms (rehearsal note)

The Level-1 contact mechanism (shared Cloudflare Worker + Resend, see
[catalog.md](catalog.md)) is already the Level-2 form handler in embryo: the
same Worker grown up is "own form handler + notification" from the plan's
pattern table. Treat it as the rehearsal for the Phase-3 service shape.
