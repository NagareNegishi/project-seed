---
name: memory
description: >
  Use when a session memory entry is about to be saved, updated, or deleted, or when
  the memory-path guard denies a write. Also sets up the memory/ store in a repo that
  has none.
---

# Memory

Entries are `memory/<type>_<slug>.md`, indexed by `memory/MEMORY.md`. The store is
curated, not appended to: run the gate in order and stop at the first fail.

## 1. Earn the entry

Do not write when the fact is any of:

- derivable from the repo: code, structure, `git log`, `CLAUDE.md`, `docs/`
- true only inside this conversation: a file just edited, a command just run
- work status: that belongs in `docs/progress.md`, `docs/session/baton.md`, or an issue

Then name, in one line, the future session that acts differently because of this entry.
No such session -> do not write, and say so.

Asked to remember something on the reject list, ask what was non-obvious about it and
save that instead.

## 2. Reconcile before writing

Search the store first, once per distinct subject term (the subject noun, not the slug):

```bash
grep -in "<term>" "$CLAUDE_PROJECT_DIR"/memory/*.md
```

Branch on the result:

- **Hit, same subject** -> edit that file: merge the new information and rewrite any
  line it contradicts. Never open a second file on a subject already in the store.
- **Hit, adjacent subject** -> new file, and cross-link both with `[[name]]`.
- **No hit** -> new file.

Two entries on one subject is a defect: merge them and `rm` the loser.

## 3. Polish before it lands

Ship the rewrite, not the draft.

- Imperative and directional: "do X", "never Y" - not "in this session we found".
- One rule, one why, one trigger. More than that is a doc: write the doc, make the
  entry a pointer to it.
- Cut narrative dates ("hit this on 4 Sep"). Keep dates that are part of the fact, and
  write those absolute.
- Cut anything the linked doc already says.

## 4. Sweep what you touched

Bounded to the entry just written plus the files edited in step 2 - not everything the
grep matched. For each concrete claim in those files, run its check:

```bash
ls <path>                     # a path claim
git branch --list <name>      # a branch claim
gh issue view <n>             # an issue-number claim
```

Command disagrees with the line -> correct or cut that line now. Entry now wholly wrong
or finished -> `rm` it. Report the checks you ran and what changed, not that a sweep
happened.

## Entry format

One fact per file:

```markdown
---
name: <type>_<snake_case_slug>
description: <one line, used to judge relevance at recall time>
metadata:
  type: user | feedback | project | reference
---

<the rule, in the imperative>

**Why:** <the reason; quote the user when it came from a correction>

**How to apply:** <the trigger condition and the action>
```

- `**Why:**` and `**How to apply:**` are required for `feedback` and `project`, optional
  for `user` and `reference`.
- Types: `user` who the user is; `feedback` how to work, from corrections and confirmed
  approaches; `project` ongoing work, goals, constraints not derivable from the code;
  `reference` pointers to docs, URLs, tickets.
- Link related entries with `[[name]]`, existing or not.

## Index

`memory/MEMORY.md` is an index only - never entry content. Adding, merging, or deleting
an entry updates it in the same turn: one line, under the heading matching its type.

```markdown
- [Title](<type>_<slug>.md) - <the shortest hook that lets a reader decide to open it>
```

## Boundaries

- Steps 1-4 write only inside `memory/`. Promoting an entry into `CLAUDE.md` or a skill
  is a separate change and needs user review first.
- Confirm before `rm` on an entry the user wrote or asked for.

## Setting up a repo with no store

```bash
mkdir -p memory
grep -qxF '/memory/' .gitignore || printf '/memory/\n' >> .gitignore
```

Then write `memory/MEMORY.md`: a title, one line naming it the canonical store, and the
type headings. Add one line to that repo's `CLAUDE.md` docs list pointing at `memory/`
and at this skill, and copy `.claude/hooks/memory-path-guard.sh` with its two
`settings.json` registrations.
