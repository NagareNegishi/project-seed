# main-sync (dormant skill record)

Status: not installed. This file is a record, kept out of `.claude/skills/` so it
cannot trigger. The generic form below has not been run; it was generalized on
2026-11-21 from a skill used in a private team project.

## Intention

Use it only in a team repo where you keep local-only edits to tracked files
(settings, ports, scripts) that must never be committed. The skill hides those
edits with `git update-index --skip-worktree` so pulling main does not collide
with them, then restores them after the merge. It also keeps your personal docs
in step with what main changed, and says whether incoming PRs touch the plan you
are working on.

## Why it is not a skill here

It adds a trigger description to every session's context and pays off only in
that one setup. Solo projects and the seed itself never need it.

## Install

1. Copy the block below to `.claude/skills/main-sync/SKILL.md`.
2. Fill the placeholders (table below).
3. Create `.claude/skills/main-sync/state.json`:
   `{ "synced_to": "<sha of main your docs reflect>", "pending": null, "flagged": [] }`.
   Add each local-only file to `flagged`. Keep `state.json` out of git.
4. Mark each local-only edit with `LOCAL-ONLY START` and `LOCAL-ONLY END` comments.
   Apply step 6 checks for them.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `<local-branch>` | Long-lived personal branch that carries your local-only edits and personal docs. |
| `<personal-docs>` | Folder of your personal notes, plans and progress file. |
| `<tree-doc>` | File tree index the skill keeps current, e.g. `context/tree.md`. |
| `<excluded docs>` | Docs under `<personal-docs>` the skill never reads or edits. |
| `<never-edited docs>` | Docs the skill reports as behind but never edits, e.g. a pasted schema reference. |
| Area map rows | Which source paths map to which note. |

## The skill

````markdown
---
name: main-sync
description: >
  Keep personal docs in step with team changes merged to main. Run /main-sync check
  after fetching, before pulling main: summarise incoming PRs, flag what blocks the
  pull, and say whether they touch the ongoing plan. Run /main-sync apply after
  main is merged into <local-branch>: report, update <tree-doc> and the
  <personal-docs> notes the merge made wrong. Never pulls, merges, checks out, or commits.
disable-model-invocation: true
---

# Main Sync

## State file

`.claude/skills/main-sync/state.json`:

```json
{ "synced_to": "<sha>", "pending": "<sha> | null", "flagged": ["<path>"] }
```

- `synced_to`: the last main commit that `<tree-doc>` and the notes reflect.
- `pending`: the `origin/main` tip `check` reported on.
- `flagged`: the paths that must stay skip-worktree. The single record; never
  re-derived from `progress.md` prose. Changed only on the user's word.

## Local-only commands

`<P>` is a path from `flagged`; `<S>` is `<P>` with `/` as `__`. Patches live in
`<personal-docs>/local-only/<S>.patch` (local, never committed). Each command is one line
the user pastes after `!`. Output the line exactly, one per file.

- Save and clear (check): `git update-index --no-skip-worktree <P> && git diff --binary -- <P> > <personal-docs>/local-only/<S>.patch && test -s <personal-docs>/local-only/<S>.patch && git restore <P>`
  The file is restored only if the patch is non-empty.
- Restore (apply): `git apply <personal-docs>/local-only/<S>.patch && git update-index --skip-worktree <P>`
- Cleanup (apply, after the re-check passes): `rm <personal-docs>/local-only/<S>.patch`
  Each patch is made fresh by the next Save and clear; none outlives its restore.

Local-only edits sit between `LOCAL-ONLY START` and `LOCAL-ONLY END` comments in
each flagged file.

## Flow (the user runs every git step except the fetch)

1. `/main-sync check` - fetches `origin/main`, any branch.
2. User pulls local `main`.
3. User merges `main` into `<local-branch>`.
4. `/main-sync apply` - on `<local-branch>`.
5. User merges `<local-branch>` into the working branch.

## Constraints (all modes)

- Git is read-only, plus `git fetch origin main`. Never pull, merge, checkout,
  switch, stash, or commit. No `gh`.
- If the project's hooks or permissions block compound commands, run one simple
  command per Bash call: no `&&`, `;`, `|`, `cd`, or redirects. Use the path-free
  form of each command.
- The fetch is exactly `git fetch origin main`, nothing added.
- Never invent steps. Local-only commands are only the three under "Local-only
  commands", one line per file, run by the user with `!`. Never run them yourself.
- Report only what a command or file read verified. No guesses, doubts, or risks.
- Write only `state.json`, `<tree-doc>`, and in-scope notes, through Edit/Write.
- Plan docs change only on the user's word.
- Never read `<tree-doc>` whole; read the one `##` section for the path.

## Doc scope

In scope: `<tree-doc>` and every `.md` under `<personal-docs>/` except:

- `progress.md` (read for plan impact, never edited)
- `session/`, `plans/archive/`
- `<excluded docs>`
- every `.html` file
- `<never-edited docs>`: never edited. When the range shows one is behind (for
  example new migrations for a schema reference), report it so the user pastes a
  fresh copy.

Area map, for statements that cite no path:

| Changed path | Note |
|---|---|
| `<source glob>` | `<note>` |
| `<source glob>` | `<note>` |
| any | `<overview note>` |

## Mode selection

Argument `check` or `apply` selects the mode. No argument: ask which - read nothing first.

## Mode: check - before pulling main

1. Read `state.json`. `git fetch origin main`.
2. Range `synced_to..origin/main`. Empty: say "Nothing new on main" and stop.
3. Gather: `git log --first-parent` for the merged PRs, `git diff --name-status`
   for the files. Read a diff when a PR's message does not say what it changes.
4. Pull blockers. Read `<personal-docs>/progress.md` in full first.
   - Goal: the user can move to `main` and pull. Run `git ls-files -v` (take the `S`
     lines) and `git diff --name-only main HEAD`, as separate calls. No "clear"
     without both results.
   - Compare the live `S` list to `state.json` `flagged`. Any difference is a
     finding; report it, never fix it.
   - Blockers: files in `flagged` that are incoming or in that diff.
   - Give one "Save and clear" line per blocker, then stop. The move and pull are the
     user's, by hand; never list them as commands.
   - When the user says it ran: each blocker must be absent from the `S` lines of
     `git ls-files -v` and have an empty `git diff -- <P>`. All hold: "clear". Else
     name the file.
   - Added paths that already exist on disk untracked: the pull will refuse.
5. Conflict risk: each local branch ahead of `main`, other than `<local-branch>`,
   whose `main...<branch>` files overlap the incoming files.
6. Plan impact, as in apply step 5: read the plans, no filename grep. Offer no edits yet.
7. Set `pending` to the `origin/main` tip. Report.

## Mode: apply - after merging main into <local-branch>

1. Guards, stop on failure and name the missing flow step:
   - `HEAD` is `<local-branch>`.
   - `pending` (or `main` when null) is an ancestor of `HEAD`.
2. Range `synced_to..<pending or main>`. Gather as in check step 3.
3. `<tree-doc>`, following its own entry standard. For each file added,
   removed, renamed, or modified so its purpose changed: read the matching `##`
   section and the file in full, then add, drop, move, or rewrite that one entry.
   Update any file counts. A file under a deny rule goes in the tree doc's NOT READ
   table, marked on its line, if it has one.
4. Notes. Suspect a note when it cites a changed path or the area map points at
   it. Read the new code, edit only the statements now wrong. Add no new coverage.
5. Plan impact. Sources: active `<personal-docs>/plans/*/plan.md`, the baton's
   **Next task**, `progress.md` **In Progress**. Match changed paths against paths
   each cites, and PR topics against its subject. One verdict each:
   - untouched
   - touched, still holds
   - now wrong: say what changed, offer the plan edit
6. Local-only: compare the live `S` list to `state.json` `flagged`. Give one
   "Restore" line per `flagged` file that is not `S`, then stop. When the user says
   it ran, re-check until the lists are equal and each file shows its
   `LOCAL-ONLY START/END` block in `git diff`. Then give one "Cleanup" line per
   restored file. A missing patch: say so. A failed
   `git apply` (main changed the same lines): name the file, the user resolves it.
7. Set `synced_to` to the range end, `pending` to null. Report.

## Report (chat)

High level, for a person. No file, function, or commit names unless the user asks,
except inside the commands block. Skip empty lines. No fields beyond these.

```
Merged: <n> PRs - <one phrase each>.
Your work: untouched. | <plan>: <what touches it, one line>.
Move to main: clear. | Blocked by <local-only edit>.                (check)
Docs: tree <n> entries, notes fixed: <areas>.                  (apply)
Behind: <never-edited doc>, re-paste.                          (only if the range shows it)
Plan edit offers: <plan>: <edit>.                              (only if a plan is now wrong)
Flag mismatch: <what differs from flagged>.                    (only if found)
Save and clear: <one command per line>.                        (check, only if blocked)
Restore: <one command per line>.                               (apply, only if a flagged file is not S)
Cleanup: <one command per line>.                               (apply, after the re-check passes)
```
````
