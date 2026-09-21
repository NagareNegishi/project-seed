---
name: trim-plan
description: >
  Trim a plan doc under docs/plans/ back to the template: land and delete
  resolved open questions and risks, and cut implementation story out of step
  bodies. Use when
  `scripts/plan-lint.sh` reports findings, when a plan doc has grown noisy, or
  when handed a doc by `session-end`. Rewrites the doc only.
---

# Trim Plan

Bring one plan doc back to the shape `plan-product` and `plan-impl` define.

## Input

- Take the doc path from the user. No path given: run `scripts/plan-lint.sh` and
  work the failing docs one at a time, most findings first.
- Run `scripts/plan-lint.sh <path>` before and after. The findings are the work
  list; zero findings ends the mechanical half. A finding you may not clear
  without breaking a rule below survives the run and is reported instead - a
  doc written before this format existed is not yours to convert.
- Notices are not findings and do not block. `OPEN-ITEMS` is the obligation
  count to report.
- The lint checks shape, never substance. It cannot tell whether a question is
  really open or a `Resolved by:` value is honest. Do not report a clean run as
  "the doc is in good order"; report it as "nothing malformed".
- Docs only: never change code, run git, or make a network call.

## Never

- **Comment out.** Trimmed content is deleted or rewritten, never parked in an
  HTML comment or a "removed" section.
- **Touch `## Status` rows.** They are the human's. Report drift, change nothing.
- **Rewrite or delete an existing `decisions` entry.** Append new ones; the only
  edit an old entry may receive is a `**Superseded by:**` marker line.
- **Invent a `Resolved by:` value** to make a line pass the lint. A question you
  cannot justify gets landed and deleted, not decorated.
- **Touch maturity or verification marks, or the `## Maturity` header.** A count
  or a `lowest:` is a claim about who reviewed what. Report the drift you caused.
- **Add anything.** No new section, no new entry, no content the doc did not
  already contain. A trim removes and relocates. Verifying a claim is
  `plan-verify`'s pass, not this one, even when the answer is one file away.

## Fix by finding

| Code | Fix |
|---|---|
| `RESOLVED-INLINE` | land the answer per the tables below, delete the entry; on a mark line, strip the resolution note and leave the mark |
| `ENTRY-FORMAT` / `OPEN-FORMAT` | already answered: land and delete. Still live and the doc names who settles it: rewrite as one line carrying that `Resolved by:`. Still live and it does not: leave the entry and report it |
| `CONTINUATION` | fold into the one-line entry, or land and delete |
| `PROSE` | land the content where it belongs, delete the paragraph |
| `BUDGET` | land every entry that is already settled; if all are genuinely open, tell the user the section is too big rather than cutting live questions |
| `STATUS-IN-HEADER` / `MARK-STATUS` | delete the progress text from the header, or the status word from the mark line, leaving the real marks. Report what you removed so the human can put it in `## Status` |
| `OPEN-ITEMS` | change nothing; report the count and which steps hold them |
| `MATURITY-SUM` / `MATURITY-LOWEST` | change nothing; report the count the trim invalidated |
| `ARCHIVE-READY` | change nothing; report it and offer to archive |

## Where answers land

Two tables own this, and they are not restated here. Read the one that matches
the doc you are trimming before landing anything:

- `product.md` - `plan-product`, under **Open questions: admission and landing**
- `impl.md` - `plan-impl`, under **Risks: admission and landing**

Landing across files is allowed here: appending to `product.md` while trimming
`impl.md` is expected. Appending to a section that already exists, that is: if
the landing section is not in the doc, the entry stays exactly where it is and
is reported as unlandable. Creating the section is the drafting skill's job.

## Step bodies

The lint counts `- **Open:**` items here but cannot judge the prose around them.
That judgement is this section.

A step body says what to build and where, plus the obligations that step still
carries. Cut:

- how the work went, what was tried, what was fixed on the way
- restated status ("done", "landed", "still pending") - `## Status` owns that
- detail that only repeats what the code now shows, once the code shows it

Keep: intent, boundaries, the reason a non-obvious approach was chosen. When
cutting a reason worth keeping, land it in `decisions` first. When cutting a
detail that backs a `src:` or `doc:` citation, either keep the detail or add the
citation - never leave the claim resting on nothing.

**Verification prose for an unbuilt step is never cut.** The last cut above only
applies where the code exists to stand in for the prose. For a step whose
`## Status` row is `planned` or `in-flight`, or that carries `❔ unverified`, the
`plan-verify` record is the only account of what was checked, and the lines it
cites are the ones the work is about to change. No `## Status` table in the doc
means treat every step as unbuilt.

**Never cut an outstanding obligation.** Operator work, a legal read, a mailbox
to provision: convert each to the marked form so the lint can count it, keeping
any explanatory detail as indented prose beneath the marked line.

```
- **Open:** <the obligation, one line> - **Resolved by:** <source>
```

An obligation left as plain prose is invisible to `plan-lint.sh`, which is how
step bodies became the place open items went to hide.

## Report

Show the before and after lint counts, then list what you changed:

- entries landed, and where each went
- entries deleted outright
- sections converted
- step bodies trimmed
- anything you left alone because it needed the user's call

Do not render the doc in chat.
