---
name: plan-impl
description: Use this skill whenever the user wants a rough implementation plan — the "how" — from a product plan that already exists at `docs/plans/<slug>/product.md`. Trigger when the user asks to plan the build, break a feature into steps, or scope the work after the product doc is drafted, or hands off from `plan-product`. Drafts docs only: writes `docs/plans/<slug>/impl.md`, never touches code, git, or the network. Deep verification is a separate skill, `plan-verify`.
---

# Plan Impl

Turn a mature product doc into a rough implementation plan: structure and
high-level steps that surface unknowns and feasibility risks early. Stage 1 of
two — cheap and regenerated freely as the product doc matures. Deep verification
is `plan-verify` (stage 2), run later against a settled doc.

Middle skill in the chain: `plan-product` → **`plan-impl`** → `plan-verify`.

## Input, output, and the handoff gate

- Read `docs/plans/<slug>/product.md`. If it is missing, stop and tell the user
  to run `plan-product` first.
- **Gate:** every entry in `product.md` must be at `🤖 ai-audited(...)` or above.
  Read this from the `## Maturity` header — if `lowest:` is `🌱 idea`, stop and
  tell the user to run an audit pass in `plan-product`. Do not rescan every entry
  to decide, and do not audit `product.md` yourself here.
- Write to `docs/plans/<slug>/impl.md` — always this path. Regenerating it
  overwrites freely; that is expected at this stage. Docs only: never change
  code, run git, or make a network call.

## Two marks per step, kept separate

Every step carries a maturity mark **and** a verification mark, stacked on one
line: `🤖 ai-audited(opus-4.8) · ❔ unverified (net-new)`.

Maturity — same axis and same rules as `plan-product`:

```
🌱 idea   🤖 ai-audited(<model>)   👤 human-ok   ✅ settled
```

You may advance a step to `🤖 ai-audited(<model>)` and no further; `👤` and `✅`
are the user's alone.

Verification — this skill leaves almost everything unverified; that is the point:

```
❔ unverified (not checked)   step names existing code/tools but nothing was opened
❔ unverified (net-new)        step builds new code, so there is legitimately nothing to link yet
```

Do **not** mark any step `🔗 verified` here — attaching real proof is
`plan-verify`'s job. Use `(net-new)` only for genuinely new code; when a step
leans on something that should already exist but you have not opened it, use
`(not checked)` so `plan-verify` knows to look.

## File format — follow this exactly

```markdown
# Implementation plan: <slug>

## Maturity
lowest: 🌱 idea
🌱 idea 4 · 🤖 ai-audited 2 · 👤 human-ok 0 · ✅ settled 0

## Overview
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

<2–4 sentences: the shape of the build and the main moving parts.>

## Risks & unknowns
🌱 idea · ❔ unverified (not checked)

- <feasibility risk, dependency, or thing that could force a redesign.>

## Steps

### Step 1: <short imperative title>
🌱 idea · ❔ unverified (net-new)

<what to build and roughly where. Name files/modules when known — they get
verified later, not now.>

### Step 2: <...>
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

<...>
```

## Rules

- **Stay rough.** High-level steps, not line-by-line instructions. The goal is to
  expose unknowns and feasibility risks, not to write the code on paper.
- **`Risks & unknowns` is required** — never omit it. If a step depends on
  something you are unsure exists or works, say so there and mark the step
  `(not checked)`.
- Each step is a coherent unit of work with a clear boundary — not a micro-task,
  not a mega-task.
- **Header can't drift.** Update the `## Maturity` header in the same pass as any
  entry. Counts cover every marked entry (Overview, Risks, and each step).
- Never assert a file, function, or library API exists as fact — that is exactly
  what `plan-verify` checks. Phrase such steps as intent, and leave them
  unverified.

## human-writing

Follow the `human-writing` skill for the prose.

## After writing

Do not render the doc in chat. Show the path and offer:

1. **Revise** — reshape steps, rewrite the file, update the header.
2. **Run `plan-verify`** — once the product doc is settled and stable, to harden
   this rough plan into a verified one. Remind the user `plan-verify` is
   command-only and spends the real verification budget.
3. **Stop** — the doc stays for later.
