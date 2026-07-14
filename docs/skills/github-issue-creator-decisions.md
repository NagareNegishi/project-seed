# GitHub Issue Creator — Design Decisions

Decision log for the `github-issue-creator` skill
(`.claude/skills/github-issue-creator/`). It records what the drafter does and
why, so future changes have context.

The drafter's only job is to turn conversation into a reviewable issue draft file.
Publishing that draft is a separate skill, `issue-publish`. Decisions about
publishing, labels, and `gh` permissions live in other docs; this file links to
them rather than repeating them:

- Publish flow, the draft-is-the-contract rule, the review-then-menu ending, and
  label handling: [pr-issue-publish.md](pr-issue-publish.md).
- The `gh` allowlist and hook that let the publish skills run: preset
  [../permissions/v4-gh-allowlist.md](../permissions/v4-gh-allowlist.md), which
  records the allowlist and the reasoning behind it.

## Scope

The skill drafts a GitHub issue into a local file. It never posts, never runs
`gh`, `git`, or any network call. Two rules enforce this: the skill's own "never
post" line, and the `gh-guard.sh` hook plus `settings.json` denies that block any
`gh` call the publish skills don't need.

Keeping drafting and posting in separate skills means the drafter carries no auth
or network risk, and the two halves change independently. The drafter writes a
file; `issue-publish` reads it.

## Output file

Path: `.github/drafts/issue-draft.md`, always this exact path.

- One draft at a time. Each run overwrites the file. No history, no timestamped
  names.
- Under `.github/` so it sits with other GitHub repo metadata.
- The directory is created on first use if it is missing.

The fixed path is the contract between drafter and publisher: `issue-publish`
always reads this one location.

## File format

YAML frontmatter for `title` and `labels`, then the issue body:

```markdown
---
title: "feat: add bulk export for user activity logs"
labels: [feature]
---

Body content...

- [ ] checkbox one
- [ ] checkbox two
```

Frontmatter over a plain H1 because the fields map straight to what `gh issue
create` needs. `title` is always quoted so a colon or other special character in
it can't break the YAML.

The frontmatter carries only what varies per issue and needs review. There is no
`assignees` field: every published issue is assigned to the user with
`--assignee @me`, which `issue-publish` adds at `gh` time rather than writing into
the draft.

`labels` is drawn only from the preset in
`.claude/skills/label-setup/labels.yml` — the single shared vocabulary the draft
and publish skills both use. The set stays small: usually one type label,
optionally one `priority:` label, or an empty list. Publish refuses a label the
repo doesn't have, so drawing from the preset keeps the draft publishable.

## After writing: review in editor, then a menu

The skill does not render the draft in chat. It writes the file, shows the path,
and asks the user to choose: publish (hand off to `issue-publish`), revise, keep
the draft without publishing, or something else.

This ending is shared with `pr-draft` and is specified in
[pr-issue-publish.md](pr-issue-publish.md). It replaced an earlier version of
this skill that rendered the draft in chat for copy-paste into GitHub's web UI.
