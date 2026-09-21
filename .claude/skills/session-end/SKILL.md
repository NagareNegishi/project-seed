---
name: session-end
description: >
  At session end, write the one-file session baton (docs/session/baton.md):
  a high-level summary of what this session was about, the goal, and the single
  next task. Overwrites the file — no change lists, no task lists, no detail.
  Then runs the read-only plan-doc lint and offers `trim-plan` on what fails.
  Read-only on git; writes only the baton. Use `session-wrapup` for git state
  and progress.md.
disable-model-invocation: true
---

# Session End

Overwrite `docs/session/baton.md` following `docs/session/template.md`. Write
nothing else.

## Steps

1. Read `docs/session/template.md` for the shape, and the current
   `docs/session/baton.md` if it exists — carry its **Goal** forward.
2. Overwrite `docs/session/baton.md` — never append; it holds only the last session.
3. Fill each section, then set `_Last updated:_` to today's date.
4. Run the plan-doc check below.

## Plan-doc check

- Run `scripts/plan-lint.sh` on the plan docs this session touched. Nothing
  touched: run it with no arguments.
- Report the failing docs by name with their finding counts. Two lines, not a
  dump of the lint output. Report notices as well as findings: a clean run with
  an `OPEN-ITEMS` notice still means obligations remain, not that the doc is
  fully settled.
- Offer `trim-plan` on them. Never run it unasked - a trim rewrites docs, and
  this skill is otherwise write-only on the baton.
- An `ARCHIVE-READY` notice means every step is done or dropped. Say which doc,
  and offer to archive it. Never move it yourself.

## Rules that keep it high-level

- **This session**: 2–3 sentences of prose. No change list, no file names, no
  detail — that lives in `docs/progress.md` and the code.
- **Goal**: the standing objective. Carry it forward unchanged until it is reached.
- **Next task**: exactly one thing — one paragraph, not a list. If several loom,
  pick the next and drop the rest. Write `None` when there is no clear next task.
  Forward work only: treat commit, push, and PR for this session as done — never
  name them.
- **Read first**: the one doc the next session must read. Write `None` when there
  is nothing.

## Boundaries

- Read-only on git — never commit, stage, or push.
- Write only `docs/session/baton.md`. The plan-doc check is read-only; the docs
  themselves change only under `trim-plan`, after the user accepts. For git state
  and `docs/progress.md`, that is `session-wrapup`.
- Write the baton through the `human-writing` skill.
