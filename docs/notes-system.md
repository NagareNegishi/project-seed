# Session notes & memory — how it loads

How a fact recorded in one session reaches the next one. Two files, one gate.

## What loads into a session, and what doesn't

The harness auto-loads exactly two things at session start — nothing else in the repo
is scanned in:

- **CLAUDE.md** — full text, every session.
- **`memory/MEMORY.md`** — full text, every session (a harness feature tied to the
  `memory/` folder, not to the filename).

Everything else is a *pull*: it reaches a session only when CLAUDE.md, a skill, or the
task at hand tells the model to open it. `docs/notes.md` is in this category — it is
never auto-loaded.

## The split: index vs content

Auto-memory (per-fact files in `memory/`, recalled by description) is retired here
(2026-07-12). In its place:

- **`memory/MEMORY.md` = the index.** Always loaded. One line per `docs/notes.md`
  section. No note bodies.
- **`docs/notes.md` = the content.** In-repo, gitignored, user-visible, diffable.
  Pulled by section, on demand, when the index shows a relevant topic.

So the index rides the always-loaded channel while the content stays a versioned,
human-editable file. That is the whole point of keeping the pointer in `memory/` and
the body in `notes.md`.

## Why this shape

Three properties are wanted; the harness lets any store have two of them:

| Store | Auto-loaded | In-repo & visible | Selective (not all noise) |
|-------|:-:|:-:|:-:|
| `memory/` per-fact files (retired) | yes | no | yes |
| `notes.md` read whole each session | yes | yes | no |
| **`MEMORY.md` index → `notes.md` body** | **yes** | **yes** | **yes** |

The index-plus-body split is the only arrangement that gets all three. Its one cost is
that the index is hand-maintained — hence the sync step below.

## The gate (source of truth: CLAUDE.md "Session notes")

Before adding a line to `docs/notes.md`:

1. **Bar** — record only a reusable directive not already in CLAUDE.md, a skill, or the
   code. Skip conversation-only observations.
2. **Dedup** — scan first; refine a related line in place instead of appending a
   near-duplicate.
3. **Place + shape** — matching section, one line, directive voice.
4. **Sync** — a new section gets an index line in `memory/MEMORY.md`; an emptied
   section loses its index line.

Promote a note to CLAUDE.md or a skill only with user review. `notes.md` is a staging
area, not load-bearing memory — only CLAUDE.md and the index are guaranteed to reach a
session.

## In a fresh clone

Only this file travels with the repo. `docs/notes.md` is gitignored, and the index
lives at `~/.claude/projects/<workspace-path>/memory/MEMORY.md` — outside the repo,
keyed to the machine's workspace path. A cloned project therefore starts with an empty
notes system by design: create the first `docs/notes.md` section and its index line as
real notes arise.
