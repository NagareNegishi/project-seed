# Session notes & memory — how it loads

How a fact from one session reaches the next. Two files, one gate.

## What loads, and what doesn't

The harness auto-loads exactly two things at session start; nothing else in the repo is
scanned in:

- **CLAUDE.md** — full text, every session.
- **`memory/MEMORY.md`** — full text, every session (tied to the `memory/` folder, not
  to the filename).

Everything else is a *pull* — it reaches a session only when CLAUDE.md, a skill, or the
task tells the model to open it. `docs/notes.md` is never auto-loaded.

## The split: index vs content

Auto-memory (per-fact files in `memory/`, recalled by description) is retired here
(2026-07-12). In its place:

- **`memory/MEMORY.md` = the index.** Always loaded. One line per `docs/notes.md`
  section, no bodies.
- **`docs/notes.md` = the content.** In-repo, gitignored, user-visible, diffable.
  Pulled by section, on demand.

The index rides the always-loaded channel; the content stays a versioned, human-edited
file.

## Why this shape

Three properties are wanted; the harness lets any store have two:

| Store | Auto-loaded | In-repo & visible | Selective (not all noise) |
|-------|:-:|:-:|:-:|
| `memory/` per-fact files (retired) | yes | no | yes |
| `notes.md` read whole each session | yes | yes | no |
| **`MEMORY.md` index → `notes.md` body** | **yes** | **yes** | **yes** |

The index-plus-body split is the only one that gets all three. Its cost: the index is
hand-maintained — hence the sync step.

## The gate (source of truth: CLAUDE.md "Session notes")

Before adding a line to `docs/notes.md`:

1. **Bar** — only a reusable directive not already in CLAUDE.md, a skill, or the code.
2. **Dedup** — scan first; refine a related line in place, don't append a near-duplicate.
3. **Shape** — matching section, one line, directive voice.
4. **Sync** — a new section gains an index line in `memory/MEMORY.md`; an emptied one loses it.

Promote a note to CLAUDE.md or a skill only with user review. `notes.md` is a staging
area, not load-bearing memory — only CLAUDE.md and the index are guaranteed to reach a
session.

## Recreating it in a fresh clone

**Travels with the repo** (nothing to do): this doc, the CLAUDE.md gate, and the
`.gitignore` rule for `docs/notes.md`. **Recreate** the two that don't: the content file
`docs/notes.md` (gitignored) and the index `MEMORY.md` (outside the repo).

**1. Create `docs/notes.md`** with this header and nothing else:

```
<!-- Claude session notes. Gitignored, user-visible. Adding a line: follow the
     Session-notes gate in CLAUDE.md (bar, dedup, shape, sync). Delete lines that turn
     out wrong or get recorded elsewhere. Mechanism: docs/notes-system.md. -->

# Session notes
```

**2. Create the index `MEMORY.md`.** Its directory comes from the absolute workspace
path with every `/` replaced by `-`:

```
workspace  /workspaces/<repo>
index      ~/.claude/projects/-workspaces-<repo>/memory/MEMORY.md
```

Claude Code auto-creates the project entry (`-workspaces-<repo>/`) on first run; the
`memory/` subfolder and `MEMORY.md` it does not — create them. To confirm the directory,
`ls ~/.claude/projects/` and pick the entry matching your workspace. Contents:

```
# Notes Index

Not a memory store — the always-loaded index to `docs/notes.md` (in-repo, gitignored),
which holds the content. Read the matching section there on demand; no note bodies here.
Keep one line per `docs/notes.md` section; update on add/remove.
Mechanism: `docs/notes-system.md`.
```

Both files start empty by design; from there the gate's sync step keeps `MEMORY.md` in
step with `docs/notes.md`.
