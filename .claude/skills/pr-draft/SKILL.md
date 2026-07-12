---
name: pr-draft
description: Use this skill whenever the user wants a pull request title and description drafted from the current branch — including when they ask to "create/open/make a PR" (drafting the text is this skill's step) or want text to paste into GitHub's PR form. Drafts only: never push, never create a PR, never use `gh` or the GitHub API.
---

# PR Draft

Produce a paste-ready PR title and body from local git history; the user pastes it into the GitHub web UI.

## Hard limits

- Read-only git only. Never `git push`, never `gh`, never any network write — `git fetch` and `git pull` included. The one permitted network call is the read-only `git ls-remote` staleness check below. Diff against the local base ref even when it is stale.
- Draft only: never create, update, or comment on a pull request.

## Gather input

1. Detect the base branch: `git rev-parse --abbrev-ref refs/remotes/origin/HEAD`, stripped of the `origin/` prefix. If that fails, use `main`, or `master` when there is no `main`.
2. Check the base for staleness: compare the remote's SHA from `git ls-remote origin <base>` against the local one from `git rev-parse origin/<base>`. On mismatch, warn in chat that the local base ref is behind the remote, so the draft may describe a wider or narrower changeset than the actual PR will show — then continue against the local ref (fetch is not available). If `ls-remote` fails (offline, no remote), note that staleness could not be checked and continue.
3. Collect the branch's work: `git log <base>..HEAD` and `git diff <base>...HEAD --stat`. If the log is empty (on the base branch, or no commits yet), stop and tell the user there is nothing to draft — never invent one.
4. Read the full diff of any file whose purpose is unclear from the stat and commit messages. Never paste raw diffs into the draft.
5. Run `git status`; if anything is uncommitted, note in chat that it is not part of the draft.
6. If `.github/PULL_REQUEST_TEMPLATE.md` exists, fill its structure instead of the default one below.

## Write the draft

Follow the `human-writing` skill for the body text.

Title: under 70 characters, imperative mood. Use a `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefix when the branch's commits already use that convention.

Default body structure (when there is no PR template):

- **Summary** — what changed and why, two to five sentences. Lead with the user-facing effect.
- **Notable decisions** — trade-offs, rejected alternatives, anything a reviewer would otherwise have to ask about. Omit the section if there are none.
- **Test plan** — how the change was or should be verified. If tests were added or updated, name them. If verification is manual, give the steps. Never claim a verification that did not happen; phrase unrun checks as steps to run.

Describe intent, not mechanics. "Moves validation into the service layer so both endpoints share it" beats a list of edited files. Fold trivial commits (formatting, typo fixes) into a single line or leave them out.

## Output

Write the draft to `.github/drafts/pr-draft.md` — always this exact path — creating the directory if needed and overwriting any existing file. Never commit the draft file.

File format:

```markdown
---
title: "feat: share validation between create and update endpoints"
---

<body, ready to paste into the GitHub PR form>
```

After writing the file, show the rendered draft in chat and give the file path.
