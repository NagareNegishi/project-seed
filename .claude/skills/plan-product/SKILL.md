---
name: plan-product
description: Use this skill whenever the user wants to turn a feature or project idea into a product plan — the "what and why" — before implementation planning, or hands loose talk over to formalize into requirements and goals. Drafts a doc only.
---

# Plan Product

Turn a raw idea into a product doc pinning down the "what and why". First skill
in the chain: `plan-product` → `plan-impl` → `plan-verify`.

## Output

Write to `docs/plans/<slug>/product.md` — always this path. Docs only: never
change code, run git, or make a network call.

### Choosing the slug

Derive a kebab-case `<slug>` from the idea (e.g. `bulk-export`). Propose it and
ask the user to accept or rename it **before** creating the directory.

## Two things this skill does

1. **Draft** — build `product.md` from the idea, one marked entry per field.
2. **Audit** — the only way entries clear the `plan-impl` gate. Defined under
   `## The maturity mark`.

## The maturity mark

Every entry carries exactly one maturity mark:

```
🌱 idea               raw, as the user dictated it
🤖 ai-audited(<model>) Claude reviewed and refined it; stamps the model id
👤 human-ok           the user reviewed it
✅ settled            the user locked it
```

- Fresh dictation is `🌱 idea`.
- Advance an entry to `🤖 ai-audited(<model>)` on your own. Stamp `👤 human-ok`
  or `✅ settled` only when the user explicitly instructs you to set that mark on
  a named entry: ask, wait for the instruction, then stamp — one entry per
  instruction. Never stamp either mark on your own initiative, and never reuse
  one entry's instruction for another.
- Stamp the running model's short id per entry, e.g. `🤖 ai-audited(opus-4.8)`.

An audit pass on an entry means: read it, tighten the wording, flag
contradictions, gaps, and unknowns, then stamp `🤖 ai-audited(<model>)` with a
one-line note on what changed or what remains open. Never silently promote an
entry you did not actually audit.

## File format — follow this exactly

`product.md` opens with a maturity summary header, then one section per field.

```markdown
# Product plan: <slug>

## Maturity
lowest: 🌱 idea
🌱 idea 6 · 🤖 ai-audited 3 · 👤 human-ok 0 · ✅ settled 0

## about
🌱 idea

<one or two sentences: what this is.>

## problem / motivation
🤖 ai-audited(opus-4.8) — tightened; still no numbers on how often this hurts

<why it's worth building.>

## goal
🌱 idea

<the outcome, not the mechanism.>

## audience
🌱 idea

<who uses it.>

## requirements
🌱 idea

- When <trigger>, the system shall <response>.   (EARS phrasing)
- ...

## stack
🌱 idea

<languages, frameworks, services. Leave empty if undecided.>

## target device / platform
🌱 idea

<web / mobile / CLI / etc.>

## constraints
🌱 idea

<hard limits: deadlines, budgets, must-use tech, compliance.>

## non-goals
🌱 idea

<what this explicitly will not do.>

## decisions
🌱 idea

- **<topic>:** <what was decided>. Why: <the reason it beat the alternative>.
- ...

## open questions
🌱 idea

- <question, one line> - **Resolved by:** <human decision | external fact | vendor answer>
- ...
```

## Rules

- **Fixed core, optional extras.** The fields above are always present, left
  empty (not deleted) when they don't apply. A project may append its own extra
  fields after `open questions`.
- **`non-goals`** — never leave it blank by default; press for at least one entry.
- **`decisions`** — before writing there, check whether an appropriate field already exists; if so, write it there instead.
- **`open questions` may be empty, and often should be.** Never manufacture one
  to fill the section. Entries have to pass the admission test below.
- **Requirements use EARS phrasing** — "When \<trigger>, the system shall
  \<response>".
- **Header can't drift.** Whatever writes or updates an entry updates the header
  in the same pass. `lowest:` is the lowest mark present; the counts sum to the
  number of entries.
- Never invent facts to fill a field. An unknown that passes the admission test
  belongs in `open questions`; anything else you go and find out. Never write a
  confident-looking guess.

## Open questions: admission and landing

**Admission.** Write an entry only if the answer exists nowhere yet. Format:

```
- <question, one line> - **Resolved by:** <human decision | external fact | vendor answer>
```

- One line, question form, no body. A question needing a paragraph is a decision
  waiting on the user: ask them.
- `Resolved by:` names the source that will produce the answer, and that source
  is always outside this repo: a call the user has to make, a fact about the
  world, a vendor's answer.
- If the answer is already somewhere in the repo (code, `docs/`, `context/`) the
  entry is not admissible. Read it now, write the finding into the section it
  belongs in, and add nothing here. Same when you simply have not checked yet.

**Landing.** Resolving a question deletes its line. Never annotate it as
resolved in place, and never record the resolution on the section's mark line.

| The answer | Lands in | Then |
|---|---|---|
| chose X over Y, with the why | the field it shapes, or `decisions` if none fits | delete the question |
| a hard limit the build must respect | `constraints` | delete the question |
| changes what gets built | `goal` / `requirements` | delete the question |
| rules something out | `non-goals` | delete the question |
| no longer relevant | nowhere | delete the question |

## human-writing

Follow the `human-writing` skill for the prose in every field.

## After writing

Do not render the doc in chat — the user reviews the file in their editor. Show
the path and offer:

1. **Audit** — run an audit pass to clear entries toward the `plan-impl` gate.
2. **Revise a field** — reword or re-scope, rewrite the file, update the header.
3. **Hand off to `plan-impl`** — only once every entry is `🤖 ai-audited` or
   above (`plan-impl` enforces this from the header).
4. **Stop** — the doc stays for later.
