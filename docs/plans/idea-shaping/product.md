# Product plan: idea-shaping

## Maturity
lowest: 🌱 idea
🌱 idea 10 · 🤖 ai-audited 0 · 👤 human-ok 0 · ✅ settled 0

## about
🌱 idea

A personal pipeline that turns spoken ideas into product plans. You record an
idea by voice on your phone; the system transcribes it, organizes it, asks about
the unclear parts, and once an idea is well-formed enough, hands it to the
existing planning skills to draft a plan. A dashboard shows every idea and plan,
how mature each one is, and which to work on next.

## problem / motivation
🌱 idea

Ideas arrive at bad moments — walking, driving, half-awake — and get lost before
they reach a keyboard. The ones that survive still need hours of shaping before
they're plannable. This closes the gap between "had a thought" and "have a plan"
without needing to sit down, and keeps half-formed ideas from stalling by
tracking exactly what's still missing.

## goal
🌱 idea

Speak an idea once and have it move on its own toward a reviewed product plan —
prompting you only for the decisions it can't make — so a plannable idea never
dies from friction or neglect.

## audience
🌱 idea

One user: you. A single-person tool running on your own machine, not a product
for others.

## requirements
🌱 idea

- When a voice recording is uploaded to the capture endpoint, the system shall
  transcribe it and create an idea record in a raw state.
- When an idea record is created from a transcript, the system shall structure it
  into fields (problem, goal, constraints, open questions) and flag the unclear
  parts as clarifying questions.
- While an idea has unanswered clarifying questions, the system shall hold it in a
  needs-clarification state.
- When the user answers a clarifying question, the system shall update the idea
  record and recompute its maturity.
- When an idea's maturity crosses the threshold, the system shall mark it
  ready-to-plan and add it to the planning queue.
- When a ready-to-plan idea is materialized, the system shall draft a product plan
  using the existing plan-product workflow.
- The system shall present a dashboard listing every idea and plan with its
  maturity, progress, and priority.
- When items are in the planning queue, the system shall order them by priority so
  the top item is the next to be planned.
- While Claude usage is tracked, when a limit reset is near and the user is idle,
  the system shall auto-initiate planning on the top queued item via local Claude
  Code.
- If the usage/reset data is unavailable, then the system shall fall back to
  manual planning triggers instead of failing.

## stack
🌱 idea

Built on this seed: React/TypeScript frontend, the seed's backend and database.
Transcription via a speech-to-text service (Whisper-class, provider TBD). Claude
for structuring transcripts and generating clarifying questions. Orchestration by
Claude Code running locally, driven on a schedule (cron/loop). Phone capture via
an iOS/Android Shortcut posting audio to an HTTP endpoint.

## target device / platform
🌱 idea

Web dashboard, desktop-first. Phone is the capture surface only, through the
Shortcut — not a full mobile app.

## constraints
🌱 idea

- Single-user, runs on your own machine; auto-planning only fires when that
  machine is on and Claude Code is available.
- Quota and reset tracking depends on data Claude Code doesn't officially expose
  (the usage view or local log parsing), so it can break when that changes.
- Budget and deadline: not set — see open questions.

## non-goals
🌱 idea

- Not a multi-tenant or hosted SaaS.
- Not a general task/project manager — it shapes ideas into plans, it doesn't
  track their implementation.
- Does not build its own planning engine; it reuses the existing plan-product /
  plan-impl skills.
- Does not implement the ideas or take external actions (no posting, no
  deployment).

## open questions
🌱 idea

- How is "maturity" defined and scored? What signals set the ready-to-plan
  threshold — number of answered questions, required fields filled, a model
  judgment?
- What's the reliable source for usage and reset timing — the `/usage` view,
  parsing `~/.claude` logs (ccusage-style), or something else? What survives
  Claude Code updates?
- How is "user is idle" detected?
- Which transcription provider, and at what cost per recording?
- Which backend framework — the seed's slot is still a placeholder.
- How far does an auto-run go unattended — stop at product.md, or continue into
  plan-impl?
- How are clarifying questions surfaced and answered — back through the phone,
  the dashboard, or a notification?
