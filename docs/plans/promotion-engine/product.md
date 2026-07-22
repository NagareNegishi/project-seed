# Product plan: promotion-engine

## Maturity
lowest: 🌱 idea
🌱 idea 10 · 🤖 ai-audited 0 · 👤 human-ok 0 · ✅ settled 0

## about
🌱 idea

A reusable engine that promotes your products on a regular cadence. You register
a product — its value proposition, audience, and links — and the engine works out
who to reach and drafts channel-appropriate promotional content. Content is
approval-gated, but once you approve a draft or a reusable template it can
auto-publish to a bounded set of targets. Right now it serves two subjects: the
app you shipped, and your service (currently building and improving websites).
Honesty and platform-rule guardrails are built in, not bolted on.

## problem / motivation
🌱 idea

Promotion is steady work that's easy to drop, and doing it well is harder than
doing it at all — it has to be targeted, honest, and appropriate to each channel,
not spam. Done by hand it comes in bursts and then stops. This keeps each product
in front of the right people on a consistent cadence, with content you've signed
off on, without a fresh manual effort for every post.

## goal
🌱 idea

Keep every registered product visible to the right audience on a regular cadence,
using content you've approved, with no manual work per post and without crossing
platform rules or making claims you can't stand behind.

## audience
🌱 idea

One operator: you, promoting your own products — today a shipped app and a
web-building/improvement service, more later. Not a marketing tool sold to others.

## requirements
🌱 idea

- When the user registers a product with its value proposition, audience, and
  links, the system shall store it as a promotable subject.
- When a product is registered or changed, the system shall identify its ideal
  target audience.
- On each product's configured cadence, the system shall draft channel-appropriate
  promotional content and present it for review.
- While a draft is unapproved, the system shall not publish or schedule it.
- When the user approves a template for reuse, the system shall auto-publish it on
  cadence to a bounded set of approved targets without further per-item approval.
- Before any content becomes eligible to publish, the system shall check it against
  honesty and platform-policy guardrails.
- If content would break a channel's rules or make an unverifiable claim, then the
  system shall block it and flag it to the user.
- Where a channel requires it, the system shall disclose AI-generated content and
  honor opt-in and anti-spam rules.
- The system shall record what was published, where, and when, so cadence and
  duplication stay visible.
- The system shall present a dashboard to manage products, review and approve
  drafts, and see the schedule and history.

## stack
🌱 idea

Built on this seed: React/TypeScript frontend, the seed's backend and database.
Claude for target research and content drafting. A scheduler (cron/loop) drives
the cadence — the same queue-and-scheduler backbone the idea-shaping project uses.
Channel integrations depend on which channels get chosen (see open questions).

## target device / platform
🌱 idea

Web dashboard, desktop-first: register products, review and approve drafts and
templates, watch the schedule and history.

## constraints
🌱 idea

- Single operator; not multi-tenant.
- Must stay within each channel's terms of service and applicable law
  (anti-spam/disclosure rules); honest, verifiable claims only.
- Auto-publishing is limited to approved templates going to a bounded set of
  targets — never open-ended autonomous posting.
- Channel set not yet chosen — see open questions.

## non-goals
🌱 idea

- Not a marketing product for third parties.
- Does not fabricate reviews, testimonials, or engagement, and does not buy fake
  followers or bot activity.
- No paid ad campaigns in the first version — organic promotion only.
- Not the prospecting tool that finds old or broken websites — that's a separate
  project; this engine only promotes products it's given.

## open questions
🌱 idea

- Which channels — X, LinkedIn, Reddit/forums, owned blog and email? Left open.
- What bounds "a bounded set of approved targets" for template auto-reuse, and
  what caps keep it from reading as spam?
- What cadence per product and per channel?
- How are ideal targets identified — what data or signals feed the targeting?
- For each channel, does it publish through an API or draft-and-you-post?
- Does the separate old/broken-website prospecting project feed this engine's
  service promotion, and if so, how?
- Is paid promotion in scope for a later version?
