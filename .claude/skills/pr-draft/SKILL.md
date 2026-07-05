---
name: pr-draft
description: Use this skill whenever the user wants a pull request title and description drafted from the current branch. Triggers include phrases like "draft a PR", "write the PR description", "prepare a pull request", "PR text for this branch", or any request for text to paste into GitHub's PR form. This skill drafts only. It never pushes, never creates a PR, and never uses `gh` or the GitHub API.
---

# PR Draft

Produce a paste-ready pull request title and body from local git history. The user creates the PR in the GitHub web UI and pastes the draft there, so everything must come from the local repository.

## Hard limits

- Local git only, read-only: `git log`, `git diff`, `git status`, `git branch`, `git merge-base`, `git symbolic-ref`. Never `git push`, never `gh`, never any network call.
- Draft only: never create, update, or comment on a pull request.

## Gather input

1. Detect the base branch:
   - Try `git symbolic-ref refs/remotes/origin/HEAD --short` and strip the remote prefix.
   - If that fails, use `main` if it exists, otherwise `master`.
   - If the current branch is the base branch, stop and tell the user there is nothing to diff against. Do not invent a draft.
2. Collect the branch's work against the merge base:
   - `git merge-base <base> HEAD`, then `git log` and `git diff --stat` from that point.
   - Read the full diff of files whose purpose is unclear from the stat and commit messages. Do not paste raw diffs into the draft.
3. Run `git status`. If there are uncommitted changes, note in chat that they are not part of the draft.
4. Check for `.github/PULL_REQUEST_TEMPLATE.md`. If it exists, fill its structure instead of the default one below.

## Write the draft

Follow the `human-writing` skill for the body text.

Title: under 70 characters, imperative mood. Use a `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefix when the branch's commits already use that convention.

Default body structure (when there is no PR template):

- **Summary** — what changed and why, two to five sentences. Lead with the user-facing effect, not the file list.
- **Notable decisions** — trade-offs, rejected alternatives, anything a reviewer would otherwise have to ask about. Omit the section if there are none.
- **Test plan** — how the change was or should be verified. If tests were added or updated, name them. If verification is manual, give the steps.

Describe intent, not mechanics. "Moves validation into the service layer so both endpoints share it" beats a list of edited files. Fold trivial commits (formatting, typo fixes) into a single line or leave them out.

## Output

Write the draft to `.github/drafts/pr-draft.md`, overwriting any existing file at that path. Create the `.github/drafts/` directory if it does not exist. Always use this exact path and filename.

File format, matching `github-issue-creator`:

```markdown
---
title: "feat: share validation between create and update endpoints"
---

<body, ready to paste into the GitHub PR form>
```

After writing the file, show the rendered draft in chat so the user can review without opening the file, and tell them the file path so they know where to copy from.
