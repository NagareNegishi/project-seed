---
name: pr-draft
description: Use this skill whenever the user wants a pull request title and description drafted from the current branch — including when they ask to "create/open/make a PR" (drafting the text is this skill's step) or want text to paste into GitHub's PR form. Drafts only: never push, never create a PR, never use `gh` or the GitHub API.
---

# PR Draft

Produce a PR title and body from local git history and write them to a draft file the user reviews before publishing.

## Hard limits

- Read-only git only. Never `git push`, never `git pull`, never `gh`. Allowed network calls: `git ls-remote`, and `git fetch origin main` in that exact form — no other fetch. Never diff against a base of unconfirmed freshness — stop instead (step 2).
- Draft only: never create, update, or comment on a pull request.

## Gather input

1. Detect the base branch: `git rev-parse --abbrev-ref refs/remotes/origin/HEAD`, stripped of the `origin/` prefix. If that fails, use `main`, or `master` when there is no `main`.
2. Confirm the base is fresh:
   - Base is `main`: run `git fetch origin main` — exact form only — then diff against the refreshed `origin/main`.
   - Any other base, or the fetch failed: compare `git ls-remote origin <base>` against `git rev-parse origin/<base>`. On matching SHAs, continue with the local ref.
   - On SHA mismatch or `ls-remote` failure: stop, report the failing step, and produce no draft.
3. Collect the branch's work: `git log <base>..HEAD` and `git diff <base>...HEAD --stat`. If the log is empty (on the base branch, or no commits yet), stop and tell the user there is nothing to draft — never invent one.
4. Read the full diff of any file whose purpose is unclear from the stat and commit messages. Never paste raw diffs into the draft.
5. Run `git status`; if anything is uncommitted, note in chat that it is not part of the draft.
6. If `.github/PULL_REQUEST_TEMPLATE.md` exists, fill its structure instead of the default one below.

## Write the draft

Follow the `human-writing` skill for the body text.

Title: under 70 characters, imperative mood. Use a `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefix when the branch's commits already use that convention.

Labels: draw only from `.claude/skills/label-setup/labels.yml` — that preset is the only vocabulary allowed; never suggest a label outside it. Keep the set small: usually one type label (e.g. `feature`, `bug`, `refactor`), optionally paired with one `priority:` label. Don't stack overlapping types. Use an empty list when none apply.

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
base: main
labels: [feature, refactor]
---

<body, ready to paste into the GitHub PR form>
```

`base` is the base branch confirmed in step 2.

## After writing

Do not render the draft in chat — the user reviews the file in their editor. Show the file path and ask them to choose:

1. **Happy, publish** — hand off to the `pr-publish` skill.
2. **Needs change** — revise the draft, rewrite the file, and ask again.
3. **Happy, but don't publish now** — stop; the draft file stays for later.
4. **Something else** — open-ended.
