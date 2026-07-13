# PR and Issue Publish Skills — Design Ledger

Two new skills that publish to GitHub with `gh`: `pr-publish` and `issue-publish`.
This file records decisions only. Anything not yet decided lives in the "Open
questions" section and must not be treated as agreed.

## Settled

### Scope of what the skills may write

- The skills may modify GitHub issues and pull requests. Nothing else.
- No git or codebase changes of any kind: no commit, push, pull, branch change,
  or edit to tracked files.
- A PR may be created or edited. It is never merged. The skill only makes the
  request; a human merges.
- The only actions are create and edit. The skills never comment, close, or
  reopen a PR or issue. Those are done on the GitHub page.

### Two separate skills

- `pr-publish` handles pull requests.
- `issue-publish` handles issues.
- Each pairs with an existing draft skill:
  - `pr-draft` produces the PR draft, `pr-publish` publishes it.
  - `github-issue-creator` produces the issue draft, `issue-publish` publishes it.

### The draft is the contract

- The publish skill reads the draft skill's output and passes it to `gh`
  unchanged. It never edits the draft.
- The draft is the artifact the user reviews, so the draft must already be in
  the exact format `gh` accepts.
- Consequence: the work of making output `gh`-ready belongs to the draft skills,
  not the publish skills. The publish skill is a thin executor: read the draft,
  run `gh`.

### PR precondition: branch must exist on the remote

- Before anything else, `pr-publish` checks whether the branch exists on the
  remote.
- If it does not, the skill stops immediately, runs no further steps, and tells
  the user to push the branch first.
- The skill never pushes the branch itself.

### PR opens in draft state by default

- `pr-publish` opens every PR in GitHub's draft state.
- A draft PR cannot be merged until it is marked ready, so the skill cannot
  produce a mergeable PR. This puts the never-merge boundary inside GitHub, not
  only in the skill's rules.
- The user marks the PR ready for review on the GitHub page. The skill does not
  flip draft to ready.

### Assignee and reviewer

- Every PR and issue the skill creates is assigned to the user with
  `--assignee @me`.
- The skill never sets reviewers. Requesting reviewers is done on the GitHub
  page.

### Issue preconditions

- Before writing, `issue-publish` requires a reachable GitHub repo, checked with
  `gh repo view`.
- For an edit, the target issue number must exist.
- The exact checks may need deeper research later.

### PR create-vs-edit is one lookup

- GitHub allows only one open PR per (head branch, base branch) pair. The draft
  carries the base, so the pair is known.
- `pr-publish` looks up the pair with
  `gh pr list --head <branch> --base <base> --state open`.
- A match means edit the existing PR (`gh pr edit`). No match means create
  (`gh pr create`). GitHub guarantees at most one match.

### Draft front-matter field set

- The draft carries the values that vary per PR or issue and need review. Values
  that never vary are applied by the publish skill, not written into the draft.
- PR draft front-matter: `title`, `base`, and the body below it. Publish adds the
  constants at `gh` time: `--draft` and `--assignee @me`.
- Issue draft front-matter: `title` and the body. Publish adds `--assignee @me`.
- A `labels` field is included in both drafts, populated by the draft skill from
  the preset label list (see Label handling).

### Stop if local commits are unpushed

- The branch existing on the remote is not enough. Before publishing a PR,
  `pr-publish` also checks that local `HEAD` holds no commits missing from the
  remote branch.
- Read-only check: get the remote SHA with `git ls-remote origin <branch>`, then
  compare ancestry against local `HEAD`. No working-tree or git writes.
- If local is ahead, stop and tell the user to push first. Publish only when the
  remote holds what was reviewed.

### Confirmation before publishing

- Before running, the publish skill shows the exact `gh` command(s) it assembled
  and asks once. On approval it runs them.
- A run is usually a single `gh` call, so this is usually one prompt. Several
  calls in one run are approved together.
- This is separate from the harness permission layer, which may also prompt on
  `gh` until those commands are allowlisted in settings.
- The draft menu's "publish" choice and this confirm gate both stay. The menu
  captures intent; the gate shows the assembled command after preconditions run.
  That is the first point the real command exists and the last chance to stop
  (a precondition can halt the flow between the two).

### Invocation: draft chain with a confirm gate

- The publish skill is model-invocable so the draft skill can hand off to it. It
  is also reachable directly as `/pr-publish` or `/issue-publish`.
- Its `description` restricts auto-invocation to the case where a reviewed draft
  exists and the user is asking to publish, so it does not misfire in unrelated
  conversation.
- Every path ends at the confirm-before-publishing gate above.

### Draft skill ending: review in editor, then a menu

- After writing the draft file, the draft skill no longer renders the draft in
  chat. The user reviews the file in their editor.
- The draft skill shows the file path and asks the user to choose:
  1. Happy, publish (hand off to the publish skill).
  2. Needs change (revise the draft, rewrite the file, ask again).
  3. Happy but do not publish now (stop; the draft file stays for later).
  4. Something else (open-ended).
- This changes the current `pr-draft` ending, which renders the draft in chat.
  `github-issue-creator` gets the same ending.

### Label handling is coupled, not deferred

- Labels are integral. A PR or issue without labels is manual cleanup, so the
  draft and publish skills are coupled to a label skill.
- The draft carries a `labels` field, populated by the draft skill from the
  preset list below. The user reviews it like any other field.
- Publish applies the labels. If a label the draft names does not exist in the
  repo, publish flags it and stops. It never creates labels.
- A separate label skill owns label creation. Its one data file is the preset
  label list: the canonical labels (name, color, description). Used to create
  labels in a repo, and read by the draft skills as the only vocabulary they may
  suggest from.
- No stored state file. To know whether the preset labels exist in a repo, the
  skill checks its own preset names live via `gh` at run time. It queries only
  those names, so GitHub's default labels never appear and the check cannot
  drift.
- The preset list is the single shared source, reachable from both the PR and the
  issue chains.
- The repo's live label list is deliberately not used as the vocabulary, because
  it includes GitHub's default labels the user does not want.

### The label skill: `label-setup`

- Name: `label-setup`. Avoids `label-sync`, which would imply two-way
  reconciliation including deletion.
- Scope is reconcile, never delete:
  - Create any preset label missing from the repo.
  - Update the color and description of an existing preset label to match the
    preset (matched by name).
  - A repo label not in the preset is ignored — never edited, never deleted.
- No stored state file, as above: the skill checks its own preset names live via
  `gh` at run time.

### Preset file: `labels.yml`

- Path: `.claude/skills/label-setup/labels.yml`. Committed, so it ships with the
  seed and each project edits its own copy.
- Format: YAML, one block per label with `name`, `color`, `description`. Colors
  are quoted so an all-digit hex is never read as a number.
- YAML over a Markdown table for accuracy: a table's one quiet failure is column
  drift (a stray or missing `|` silently shifts every later field); YAML's named
  keys break visibly instead. It is also the easiest machine format to append to.
- This is the single shared source: `label-setup` creates/reconciles from it, and
  the draft skills draw their `labels` vocabulary from it.

### Initial preset label set

Fifteen labels. Colors are the conventional values; a few repeat across labels,
which is cosmetic only and left as-is for now.

| name | color | description |
|------|-------|-------------|
| bug | d73a4a | Something isn't working |
| documentation | 0075ca | Improvements or additions to documentation |
| feature | 0e8a16 | Brand-new capability |
| enhancement | a2eeef | Improvement to existing functionality |
| refactor | fbca04 | Code change, no behavior change |
| maintenance | ededed | Upkeep / tooling, no product change |
| test | c5def5 | Tests |
| style | c2e0c6 | Formatting, no logic change |
| security | b60205 | Security-relevant |
| dependencies | 0366d6 | Dependency updates |
| planning | d4c5f9 | Planning / design work |
| on-hold | ededed | Paused |
| priority: high | b60205 | High priority |
| priority: medium | fbca04 | Medium priority |
| priority: low | 0e8a16 | Low priority |

- `feature` and `enhancement` are kept as a deliberate split: new capability vs
  improvement to something that exists.
- `maintenance` is the single upkeep label; `chore` was dropped as a duplicate.
- `development` was considered and dropped as too vague.

## Open questions

None. All label sub-decisions are settled above; the build order below can
proceed.

## Reference: what `gh` accepts

Facts about the tool, to inform the open decisions above. Not decisions.

`gh pr create` / `gh pr edit`:

- `--title` (required for create)
- `--body` or `--body-file`
- `--base` (target branch)
- `--head` (source branch; must be on the remote)
- `--draft` (open in draft state)
- `--label`, `--assignee`, `--reviewer`, `--milestone`

`gh issue create` / `gh issue edit`:

- `--title` (required for create)
- `--body` or `--body-file`
- `--label`, `--assignee`, `--milestone`, `--project`

Reading preconditions without writing:

- Branch on remote: `git ls-remote --heads origin <branch>` returns a line if it
  exists.
- Repo reachable for issues: `gh repo view`.
- Existing PR for a branch: `gh pr view <branch>` or `gh pr list --head <branch>`.

## Build order

Core design is complete and the label sub-decisions are settled. Steps 1–5 are
done (2026-07-13); **next session starts at step 6, the `gh` settings decision.**
When building:

1. Read `docs/plans/new-skills.md` first (CLAUDE.md requires it before adding or
   polishing a skill), and the target skill's `SKILL.md`.
2. ✅ Done. Built `label-setup` — the draft and publish skills depend on it:
   `labels.yml` preset file (the fifteen labels above); creates missing preset
   labels with `gh label create` and reconciles existing ones with
   `gh label edit`; never deletes. Checks its own preset names live via `gh`
   (no stored state file).
3. ✅ Done. Polished the draft skills to emit the settled front-matter and the
   new ending:
   - `pr-draft`: front-matter `title` + `base` + `labels` + body; dropped the
     in-chat render; added the four-option menu. Fixed the stale intro (was
     "paste into the web UI"). Menu option 1 hands off to `pr-publish`.
   - `github-issue-creator`: front-matter `title` + `labels` + body (dropped
     `assignees` — it becomes the publish-time `--assignee @me` constant); same
     menu ending, option 1 hands off to `issue-publish`.
   Both draw `labels` only from the preset list, kept to a small type +
   optional `priority:` set.
4. ✅ Done. Built `pr-publish`: reads `.github/drafts/pr-draft.md`; preconditions
   (branch on remote via `git ls-remote --heads`, no unpushed commits via
   `git merge-base --is-ancestor HEAD <remote-sha>`); create-vs-edit via
   `gh pr list --head --base --state open`; label existence check (stop + point
   to `/label-setup` if any missing, never creates); body written to a `mktemp`
   file outside the repo for `--body-file`; confirm gate; run. Constants `--draft`
   + `--assignee @me` on create only (edit uses `--add-label`, no `--draft`).
   Model-invocable with a tightly scoped `description`; also `/pr-publish`.
5. ✅ Done. Built `issue-publish`: reads `.github/drafts/issue-draft.md`;
   precondition `gh repo view`; create by default, edit only when the user names
   an issue number (confirmed with `gh issue view <n>` before editing); label
   existence check (stop + point to `/label-setup` if any missing); body via
   `mktemp` `--body-file`; confirm gate; run. Constant `--assignee @me` on create
   only (edit uses `--add-label`). Model-invocable with a tightly scoped
   `description`; also `/issue-publish`.
6. If `gh` write commands should skip the harness permission prompt, that is a
   `.claude/settings.json` change: cite code.claude.com docs and get sign-off
   first (CLAUDE.md rule). Not yet decided.

State every skill's draft-only vs publish boundary in its `description`, follow
`human-writing` for any prose, and set `disable-model-invocation` only where a
skill is meant to be explicit-command only (not the case for the publish skills,
which stay model-invocable per the settled invocation decision).
