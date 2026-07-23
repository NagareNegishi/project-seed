# Promoted agent-file template

Anatomy of the file that lands in `.claude/agents/<name>.md` — i.e. the content of
a draft's **Definition** block. Use it as the review yardstick when promoting one by
one: each section below must be present and doing its job. The draft wrapper (Status
/ Purpose / Design notes) lives in `template.md` and does not promote.

The worker family (critics especially) shares this shape by design — the manager
consumes every report uniformly, so the shape is a core invariant. Testers and
advisory agents deviate only where noted.

```markdown
---
name: <agent-name>
description: <when the manager should delegate here — the trigger, not the mechanics>
tools: <comma-separated allowlist>   # set to the minimum the job needs (omit = inherit all)
model: inherit                       # visible starting point; change to sonnet|opus|haiku to pin
---

You are a <role>. You receive <input: an idea, an implementation, a failure, a
research task> from a manager agent. Your only job is to <single mandate>. You do
not <boundaries: fix / propose alternatives / stray off-axis / soften with praise>.

Hunt for, as applicable to the target:        # testers: "Design tests for"; researcher: "Establish"

- <axis-specific item>
- <axis-specific item>

Rules:

1. Every finding carries evidence another agent can open and verify:
   <file:line for code | fetchable URL for a claim about standards or known issues>.
2. State the concrete failure: who hits it, how, and the result. A vague claim is
   not a finding.
3. Rank honestly. Do not inflate nitpicks; do not invent findings to fill the
   report. If the target is clean, say so and list what you checked.
4. Stay in your lane: a finding must be a <axis> problem, not a neighbouring-axis
   complaint.

Report back to the manager in exactly this structure:

- **Target**: what you reviewed and its scope.
- **Problems**: one bullet per finding, worst first:
  `critical|high|medium|low — <problem> — <failure scenario> — <evidence>`
- **Checked, no finding**: areas examined that came up clean.
- **Out of scope**: what you could not review and why (omit if empty).

The report is your final message. Do not write any files.   # testers: instead run the suite and report pass/fail
```

## Why each section

- **Frontmatter — `name` / `description`.** The only required fields. The manager
  picks an agent by its `description`, so it states the delegation trigger, not the
  mechanics. An unresolvable value elsewhere (e.g. a bad `tools` name) fails the
  launch, so keep frontmatter minimal and valid.
- **`tools` (optional).** Omitting inherits every tool; naming an allowlist is the
  privilege boundary. Critics get read-only inspection (`Read, Grep, Glob` + web,
  no `Bash`) so they cannot run or "test" what they critique; testers add
  `Write, Edit, Bash`; `legal-critic` adds `Bash` for manifests. Set the minimum the
  job needs.
- **`model` (visible, `inherit`).** Kept as an explicit line, not commented out, so
  the knob is never hidden. `inherit` means the agent runs on the manager's model —
  the same behaviour as omitting it, but the field stays in front of the reader.
  Change to `sonnet|opus|haiku` to pin an agent that has a reason to differ.
- **Role + input contract (first line).** A cold subagent sees none of the parent
  conversation. This line tells it what it is and what shape of input to expect, so
  it can act from the prompt alone.
- **Mandate + boundaries.** One job, stated as a single sentence, plus the explicit
  "you do not…" list. The boundary is structural, not politeness: a critic that may
  fix starts pulling punches to keep its fix simple, so fixing is fenced off to the
  implementer / `alternatives-explorer`.
- **The work (hunt list / test approach / research steps).** The axis-specific core
  — the concrete checklist that makes the agent's lane operational rather than a
  vague brief.
- **Rules.** The four guardrails that make a report trustworthy: (1) openable
  evidence per finding, (2) a concrete failure scenario so "feels wrong" can't pass,
  (3) honest ranking + a clean verdict so an empty list isn't mistaken for a shallow
  pass, (4) stay-in-lane so axes don't overlap and the manager isn't handed the same
  finding twice.
- **Report structure.** Fixed so the manager parses every agent's output the same
  way. The severity-tagged line, the mandatory evidence, and the "Checked, no
  finding" section are the shared shape recorded in `README.md` — cite that source,
  don't re-invent the format per agent.
- **Final constraint.** Critics and advisory end with "do not write any files" — the
  report is the whole deliverable. Testers invert this: they write tests and run the
  suite, and report pass/fail instead.

## Promotion check

Every promotion walks these sections in order; the agent is copied only after each
passes. A miss is fixed in the draft first, never patched silently on the way in.

The draft's Definition and its promoted `.claude/agents/<name>.md` must end up
identical, but do not sync them one agent at a time. While a promotion campaign is
still running, leave each polished live agent ahead of its draft on purpose and use
it as the reference for the next promotion — apply the refinements it demonstrates
(e.g. the verdict field, `model: inherit`) to the draft you promote next. Only once
every agent is promoted, make one pass forcing each draft to mirror its live agent,
so the drafts finish as the synced record of what shipped.

1. **`name`** — matches the file name, unique across the project tree.
2. **`description`** — states the delegation trigger, not the mechanics.
3. **`tools`** — the minimum the job needs; no `Bash`/`Write`/`Edit` on an agent that
   must only read and reason.
4. **`model`** — present as an explicit line (`inherit` unless there's a reason to pin).
5. **Role + input contract** — self-contained; names what it is and what it receives.
6. **Mandate + boundaries** — one job; the "you do not…" fence is present.
7. **The work** — an operational checklist, not a vague brief.
8. **Rules** — evidence, concrete failure, honest ranking, stay-in-lane all present.
9. **Report structure** — matches the shared shape in `README.md`.
10. **Final constraint** — write / do-not-write is correct for the agent's kind.
