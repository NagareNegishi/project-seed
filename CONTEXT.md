<!-- Template skeleton. Fill in after the architecture has settled - not day one.
     Delete this file and `context/` if the project stays small enough that
     CLAUDE.md alone covers orientation. -->

# Agent working context

A lookup aid. CLAUDE.md (auto-loaded) and the code are truth.
It is updated in the same change that adds, moves, or removes a file, folder, or seam.
When it disagrees with the code, the code wins and this file gets fixed on the spot.

`docs/` is for people. This is for fast orientation before you dig.

## Files

- `context/product.md`        - what the app is, who it serves. Read when scoping a feature.
- `context/architecture.md`   - the parts and the seams between them. Read for structural work.
- `context/invariants.api.md` - backend rule categories + where each is enforced. Read for backend work.
- `context/invariants.ui.md`  - frontend rule categories + where each is enforced. Read for frontend work.
- `context/direction.md`      - trajectory and deliberate deferrals. Read when planning.
- `context/tree.md`           - every tracked file, one line each, purpose only. Search
  it for a path or area instead of `find`/`ls`/glob sweeps; never read it whole or at
  session start. Paired with `.claude/skills/read/SKILL.md`.

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

- Each line ends in a citation. The citation is the truth; the line is a pointer.
- Header `checked: <date>` is the last full reconciliation with the code.
- Missing something? The answer is in CLAUDE.md, the code, or `docs/plans/` - not here.

## Rules for these files

- Every claim carries a pointer: `-> path:line`, a CLAUDE.md section, or a doc path.
- One line per entry. Rationale lives in `direction.md` or the plan doc, not here.
- Bias toward stable facts (seam names, file locations, "this rule category exists")
  over volatile ones (exact rule text, line numbers).
- These files index the live plans in `docs/plans/`; they do not replace them.
