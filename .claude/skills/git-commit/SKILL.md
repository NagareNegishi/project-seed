---
name: git-commit
description: Use this skill whenever creating a git commit — when the user asks to commit, or when you are about to run `git commit` yourself. Commits locally only: never pushes, branches, or amends history.
---

# Git Commit

Turn working-tree changes into one or more well-formed local commits.

## Format — Conventional Commits

Every summary line is:

```
<type>(<scope>): <summary>
```

- **type** (required): `feat`, `fix`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`, `chore`.
- **scope** (optional): the area touched, e.g. `feat(auth):`. Omit when it adds nothing.
- **summary**: imperative mood ("add", not "added"/"adds"), lower-case, no trailing period. Aim ≤ 50 chars, hard limit 72.

Body (optional, after a blank line): explain **why**, not what — the diff shows what. Wrap at 72 cols. Add one only when the reason isn't obvious from the summary.

Breaking change: append `!` after the type/scope (`feat!:`) and add a `BREAKING CHANGE: <detail>` footer.

## Commit boundaries — atomic

- One logical change per commit. A commit may span several files when they serve the same change; it must never bundle unrelated changes.
- Don't wait for the whole task to finish — commit each coherent unit (a feature, a logic section, a fix) as it lands.

## Staging — explicit paths only

- Stage the exact paths for the commit at hand: `git add <path> …`.
- Never `git add .`, `-A`, or `-u` — they defeat atomic boundaries and are blocked by policy.

## Issue references

Reference issues in a footer line: `Refs #<n>` (related) or `Closes #<n>` (this commit resolves it).

- **`feat` and `fix` require a reference.** Resolve the number in this order:
  1. **Registry** — `issues.md` next to this skill. Match the work against a recorded title/description.
  2. **`gh issue list`** (bare, no flags) — read the current open issues and match by title.
  3. **Still nothing** — stop and ask the user to pick: give an existing number, create one first (hand off to `github-issue-creator` → `issue-publish`), or commit without a reference this once.
- **Every other type**: add a reference when a matching issue is already known (registry or conversation); otherwise commit without one — don't go hunting.
- Confirm an uncertain number with `gh issue view <n>` before writing it into a message.

## Issue registry

`issues.md` next to this skill is the local index of issues worth referencing — one row per issue: number · full title · one-line concise description. This skill owns it.

- After using or learning a number that isn't listed yet — from the user, from a freshly published issue (`issue-publish` prints the new issue's URL; the number is its last path segment), or from `gh issue list` — append a row.
- Treat the registry as a cache, not truth: it drifts as issues close, get renamed, or are opened on the web. When `gh issue list` disagrees, trust the live list and reconcile the row.
- Only the bare `gh issue list` is permitted (no `--json`, `--state`, `--search`, or other flags — the guard denies them).

## Attribution

Never add a `Co-Authored-By` trailer or any Claude author identity to a commit — policy `docs/permissions/v3-no-coauthor.md`, enforced by a hook.

## Procedure

1. Survey the tree: `git status`, `git diff`, and `git diff --staged`.
2. Group the changes into atomic commits; decide type/scope/summary for each.
3. For any `feat`/`fix` without a known issue, run the issue-reference step above before committing.
4. Per commit, in order: stage its exact paths, then `git commit`. Show the planned message before running it.
5. Multi-line messages: pass repeated `-m` (`-m "<summary>" -m "<body>" -m "Refs #12"`) so no message file is needed.
6. A commit body of more than a line goes through `human-writing`.
7. After committing, report what landed (`git log --oneline -<n>`). Never push — leave the commits local for the user.
