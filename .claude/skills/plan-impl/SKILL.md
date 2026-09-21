---
name: plan-impl
description: Use this skill whenever the user wants a rough implementation plan — the "how", e.g. breaking a feature into build steps — from an existing product plan, or hands off from `plan-product`. Drafts a doc only; deep verification is the separate `plan-verify` skill.
---

# Plan Impl

Turn a mature product doc into a rough implementation plan — structure and
high-level steps. Middle skill in the chain: `plan-product` → **`plan-impl`** →
`plan-verify`.

## Input, output, and the handoff gate

- Read `docs/plans/<slug>/product.md`. If it is missing, stop and tell the user
  to run `plan-product` first.
- **Gate:** every entry in `product.md` must be at `🤖 ai-audited(...)` or above.
  Read this from the `## Maturity` header — if `lowest:` is `🌱 idea`, stop and
  tell the user to run an audit pass in `plan-product`. Do not rescan every entry
  to decide, and do not audit `product.md` yourself here.
- Write to `docs/plans/<slug>/impl.md` — always this path. Regenerating it
  overwrites freely, except `## Status`: carry those rows across unchanged, and
  add `planned` rows for steps that are new. Docs only: never change code, run
  git, or make a network call.

## Two marks per step, kept separate

Every step carries a maturity mark **and** a verification mark, stacked on one
line: `🤖 ai-audited(opus-4.8) · ❔ unverified (net-new)`.

**Exception: a `✅ settled` step drops the verification mark**, keeping only
`src:` citations that point outside this repo (a vendor doc, an external API
reference) — a repo-internal citation is redundant once the step is settled.

Maturity — same axis and same rules as `plan-product`:

```
🌱 idea   🤖 ai-audited(<model>)   👤 human-ok   ✅ settled
```

Stamping follows `plan-product`'s rule under **The maturity mark**, applied to
steps instead of entries. Read it there; it is not restated here.

Verification — this skill leaves almost everything unverified:

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

## Status

| Step | State | Note |
|---|---|---|
| 1 | done | |
| 2 | in-flight | |
| 3 | planned | |
| 4 | dropped | folded into Step 2 |

## Overview
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

<2–4 sentences: the shape of the build and the main moving parts.>

## Risks & unknowns
🌱 idea · ❔ unverified (not checked)

- <risk, one line> - **Resolved by:** <human decision | external fact | vendor answer | plan-verify>

## Steps

### Step 1: <short imperative title>
🌱 idea · ❔ unverified (net-new)

<what to build and roughly where. Name files/modules when known — they get
verified later, not now.>

### Step 2: <...>
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

<...>

- **Open:** <obligation this step carries> - **Resolved by:** <source>
```

## Rules

- **Stay rough.** High-level steps that expose unknowns and feasibility risks,
  not line-by-line instructions or code on paper.
- **`Risks & unknowns` may be empty.** Never manufacture an entry to fill it.
  Entries have to pass the admission test below.
- **Open items in a step body carry the `- **Open:**` marker** (see below).
  Prose saying something is still outstanding does not count and is not tracked.
- Each step is a coherent unit of work with a clear boundary — not a micro-task,
  not a mega-task.
- **Header can't drift.** Update the `## Maturity` header in the same pass as any
  entry. Counts cover every marked entry (Overview, Risks, and each step).
- **Status lives only in `## Status`.** Never write progress, `Landed:`, or
  `Remaining:` lines into the Maturity header, the Overview, or a step body, and
  never invent a status mark. `✅ landed`, `✅ done`, and the like are not marks -
  the vocabulary is the four maturity marks and the two verification marks, and
  nothing else goes on a mark line. A caveat attached to a step's state belongs
  in that step's `Note` column.
- Never assert a file, function, or library API exists as fact. Phrase such
  steps as intent, and leave them unverified.

## Status: who owns it

`## Status` is the human's. One row per step, state is one of `planned`,
`in-flight`, `done`, `dropped`. `Note` is free text and usually empty.

- Creating the file: write every row as `planned`.
- After that, never flip a row on your own initiative. Report the drift you see,
  and set a row only when the user instructs you to change that named step - one
  step per instruction, same discipline as the `👤 human-ok` mark.
- A doc with no `planned` and no `in-flight` rows is finished work. Say so, and
  offer to archive it.
- **A step's `Status` row of `done` makes its maturity mark `✅ settled`.** This
  is mechanical, not a review judgment call, and follows the same instant a
  `done` row is set — it needs no separate stamping instruction.

## Risks: admission and landing

**Admission.** A risk is admissible only if it could force a redesign, and it
names what will settle it:

```
- <risk, one line> - **Resolved by:** <human decision | external fact | vendor answer | plan-verify>
```

- One line, no body.
- "A step names code I have not opened" is **not** a risk. That is the step's own
  `❔ unverified (not checked)` mark. Do not duplicate it here.
- If reading the repo settles it, read now and fold the finding into the step.

**Landing.** Settling a risk deletes its line. Never annotate it as resolved in
place, and never record the resolution on the section's mark line.

| The finding | Lands in | Then |
|---|---|---|
| a choice with a why | the `product.md` field it shapes, or `decisions` if none fits | delete the risk |
| a hard limit on the build | `product.md` `constraints` | delete the risk |
| changes how a step is built | that step's body | delete the risk |
| proof the step is fine | that step's verification mark | delete the risk |
| no longer relevant | nowhere | delete the risk |

## Open items in a step body

`Risks & unknowns` is document scope: things that could force a redesign. An
obligation attached to one step - operator configuration, a legal read, a
mailbox to provision - stays with its step, in this form:

```
- **Open:** <the obligation, one line> - **Resolved by:** <human decision | external fact | vendor answer | operator>
```

- The `- **Open:**` line is one line. Detail may follow as ordinary indented
  prose beneath it; only the marked line is the entry.
- Settling one deletes the line, same as a risk, and the finding lands per the
  table above.
- Never park an obligation in prose to keep it out of a list. `plan-lint.sh`
  counts these and reports which steps hold them.

## human-writing

Follow the `human-writing` skill for the prose.

## After writing

Do not render the doc in chat. Show the path and offer:

1. **Revise** — reshape steps, rewrite the file, update the header.
2. **Run `plan-verify`** — once the product doc is settled and stable, to harden
   this rough plan into a verified one. Remind the user `plan-verify` is
   command-only and spends the real verification budget.
3. **Stop** — the doc stays for later.

