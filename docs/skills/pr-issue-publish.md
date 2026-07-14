# PR and Issue Publish Skills — Design Ledger

Design decisions behind three skills: `pr-publish` and `issue-publish` (publish a
reviewed draft to GitHub with `gh`), plus `label-setup` (the label preset both
depend on). The skills live under `.claude/skills/`; this file records why they
are shaped the way they are.

## Settled

### Scope of what the skills may write

- The skills touch only GitHub issues and pull requests. No git or codebase
  changes: no commit, push, pull, branch change, or edit to tracked files.
- The only actions are create and edit. Never merge, comment, close, or reopen.
  A PR is created; a human merges it. The rest is done on the GitHub page.

### Two separate skills, each paired with a drafter

- `pr-publish` handles pull requests; `issue-publish` handles issues.
- Each pairs with an existing draft skill: `pr-draft` → `pr-publish`,
  `github-issue-creator` → `issue-publish`.

### The draft is the contract

- The publish skill reads the drafter's output and passes it to `gh` unchanged.
  It never edits the draft.
- The draft is what the user reviews, so it must already be in the exact format
  `gh` accepts. Making output `gh`-ready is the drafter's job. The publish skill
  is a thin executor: read the draft, run `gh`.

### Draft front-matter field set

- The draft carries only the values that vary per PR or issue and need review.
  Constants are applied by the publish skill at `gh` time, not written into the
  draft.
- PR draft: `title`, `base`, `labels`, and the body. Publish adds `--draft` and
  `--assignee @me`.
- Issue draft: `title`, `labels`, and the body. Publish adds `--assignee @me`.
- The `labels` field is populated by the drafter from the preset (see Label
  handling).

### PR preconditions: the remote holds what was reviewed

- Before anything else, `pr-publish` checks the branch exists on the remote. If
  not, it stops and tells the user to push. It never pushes the branch itself.
- It also checks that local `HEAD` has no commits missing from the remote branch:
  a read-only compare of the remote SHA (`git ls-remote`) against local ancestry,
  no git writes. If local is ahead, stop and tell the user to push. Publish only
  when the remote holds the reviewed state.

### Issue precondition

- Before writing, `issue-publish` requires a reachable repo, checked with
  `gh repo view`. For an edit, the target issue number must exist.

### PR opens in draft state

- Every PR opens in GitHub's draft state. A draft PR can't be merged until marked
  ready, so the skill can't produce a mergeable PR. This puts the never-merge
  boundary inside GitHub, not only in the skill's rules. The user marks it ready
  on the GitHub page.

### Assignee and reviewer

- Every PR and issue is assigned to the user with `--assignee @me`. The skill
  never sets reviewers; that's done on the GitHub page.

### PR create-vs-edit is one lookup

- GitHub allows only one open PR per (head branch, base branch) pair, and the
  draft carries the base. `pr-publish` looks up the pair with `gh pr list`. A
  match means edit (`gh pr edit`), no match means create (`gh pr create`).

### Confirmation before publishing

- Before running, the publish skill shows the exact `gh` command(s) it assembled
  and asks once; on approval it runs them. Usually one `gh` call, so usually one
  prompt.
- This is separate from the harness permission layer, which may also prompt on
  `gh` until those commands are allowlisted.
- The confirm gate is the first point the real command exists and the last chance
  to stop, after preconditions have run.

### Invocation: draft chain with a confirm gate

- The publish skill is model-invocable so a drafter can hand off to it, and is
  reachable directly as `/pr-publish` or `/issue-publish`.
- Its `description` restricts auto-invocation to the case where a reviewed draft
  exists and the user asks to publish, so it doesn't misfire.

### Draft skill ending: review in editor, then a menu

- After writing the file, the drafter no longer renders the draft in chat. The
  user reviews the file in their editor.
- The drafter shows the path and offers four choices: publish (hand off), revise
  (rewrite the file, ask again), keep the draft without publishing, or something
  else. Both `pr-draft` and `github-issue-creator` use this ending.

### Label handling is coupled, not deferred

- Labels are integral: a PR or issue without them is manual cleanup, so the draft
  and publish skills are coupled to a label skill.
- The draft carries a `labels` field the drafter fills from the preset, and the
  user reviews it. Publish applies the labels. If a named label doesn't exist in
  the repo, publish stops and flags it; it never creates labels.
- Label creation is owned by a separate skill, `label-setup`. Its preset list is
  the single shared source: `label-setup` creates and reconciles from it, and the
  drafters use it as the only vocabulary they may suggest.
- No stored state file. To know whether a preset label exists in a repo, the skill
  queries its own preset names live via `gh` at run time. It checks only those
  names, so GitHub's default labels never appear and the check can't drift. The
  repo's live label list is deliberately not the vocabulary, precisely because it
  includes GitHub's defaults the user doesn't want.

### The label skill: `label-setup`

- Scope is reconcile, never delete: create any missing preset label, update an
  existing preset label's color and description to match (matched by name), and
  ignore a repo label not in the preset (never edit or delete it).

### Preset file: `labels.yml`

- Path: `.claude/skills/label-setup/labels.yml`. Committed, so it ships with the
  seed and each project edits its own copy. It is the single source for both the
  label skill and the drafters' `labels` vocabulary.
- YAML over a Markdown table for accuracy: a table's quiet failure is column drift
  (a stray or missing `|` silently shifts every later field); YAML's named keys
  break visibly instead. It's also the easiest machine format to append to.
- The starting set is fifteen labels with conventional colors. A few colors repeat
  across labels, which is cosmetic and left as-is. Notable choices: `feature` and
  `enhancement` are a deliberate split (new capability vs improvement to something
  that exists); `maintenance` is the single upkeep label, with `chore` dropped as
  a duplicate; `development` was dropped as too vague.

## Built skills

Every decision above is implemented:

- `.claude/skills/pr-publish/` — publishes the `pr-draft` output.
- `.claude/skills/issue-publish/` — publishes the `github-issue-creator` output.
- `.claude/skills/label-setup/` (with `labels.yml`) — creates and reconciles the
  preset labels.

`gh` access for all three is permissions preset
[v4](../permissions/v4-gh-allowlist.md), which records the allowlist and the
reasoning behind it.
