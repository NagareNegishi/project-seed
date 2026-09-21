<!-- Template skeleton. Fill in after the architecture has settled - not day one.
     Delete this file and `context/` if the project stays small enough that
     CLAUDE.md alone covers orientation. -->

# Agent working context

A lookup aid, not a source of truth. CLAUDE.md (auto-loaded) and the code are truth.
This file and `context/` are pulled on demand, not auto-loaded, and they lag reality:
treat every claim as "last known" and verify it against its citation before relying
on it. When this disagrees with the code, the code wins and the file needs an update.

`docs/` is for people, decisions, and history (`docs/progress.md`, `docs/plans/`,
`docs/session/baton.md`). `context/` is for fast machine orientation before a task
starts: stable structural facts, not decisions and not history.

## Why this exists

CLAUDE.md is one flat file and can't hold a full map of a real app. `docs/progress.md`
is a decisions log, not a structural map. `docs/plans/` is per-feature, not whole-
codebase. `context/` fills the gap: "what are the parts, the seams, and the invariants"
indexed for a task that just started, each line backed by a pointer so it's cheap to
verify instead of cheap to go stale unnoticed.

## Files

- `context/product.md`        - what the app is, who it serves. Read when scoping a feature.
- `context/architecture.md`   - the parts and the seams between them. Read for structural work.
- `context/invariants.api.md` - backend rule categories + where each is enforced. Read for backend work.
- `context/invariants.ui.md`  - frontend rule categories + where each is enforced. Read for frontend work.
- `context/direction.md`      - trajectory and deliberate deferrals. Read when planning.

Adjust this list to the project's real shape - merge the two invariants files for a
single-layer app, drop `product.md` for an internal tool, add a file for a part that
grew its own set of gotchas (e.g. billing, a queue).

## Read profile per task

| Task | Reads |
|---|---|
| Backend bugfix | CONTEXT + invariants.api |
| Frontend bugfix | CONTEXT + invariants.ui |
| Scope / add a feature | CONTEXT + product + direction + relevant invariants |
| Structural / cross-cutting change | CONTEXT + architecture + both invariants |
| Planning session | CONTEXT + direction + product |

## How to use these files

- Each line ends in a citation. The citation is the truth; the line is a hint.
- Header `checked: <date>` is the last time the file was reconciled with reality.
  The older it is, the more you verify before trusting a line.
- Missing something? The answer is in CLAUDE.md, the code, or `docs/plans/` - not here.

## Rules for maintaining these files

- Every claim carries a pointer: `-> path:line`, a CLAUDE.md section, or a doc path.
- One line per entry. Rationale lives in `direction.md` or the plan doc, not here.
- Bias toward stable facts (seam names, file locations, "this rule category exists")
  over volatile ones (exact rule text, line numbers) - stable facts stay correct
  longer between `checked:` passes.
- These files index the live plans in `docs/plans/`; they do not replace them.
- Not session history and not a decisions log - that's `docs/progress.md` and
  `docs/session/baton.md`. `context/` only states what's true now, with a pointer.
