---
name: release-notes
description: Use this skill whenever the user wants release notes or a changelog entry drafted from git history — including questions like "what's in this release" and any request to summarize the changes between two versions, tags, or refs. Drafts only: never create tags, never edit CHANGELOG.md, never publish a release.
---

# Release Notes

Draft a changelog entry from git history between two refs, for the user to paste into their changelog or GitHub release form.

## Hard limits

- Local git only, read-only: `git tag`, `git log`, `git diff`, `git describe`, `git merge-base`. Never `git tag -a`, never `git commit`, never `git push`, never `gh`, never any network call.
- Never edit `CHANGELOG.md` or any other changelog file, never create a GitHub release.

## Pick the range

1. If the user named refs ("v1.2 to v1.3", "since v2.0"), use those; a single ref means `<ref>..HEAD`.
2. Otherwise default to latest tag → `HEAD`, finding the tag with `git describe --tags --abbrev=0`.
3. If the repository has no tags and the user gave no refs, stop and ask which ref to start from. Do not guess or summarize the whole history.
4. Confirm the range is non-empty (`git log <from>..<to> --oneline`). If it is empty, say so instead of inventing an entry.

## Gather input

- `git log <from>..<to>` for commit messages, and `git diff --stat <from>..<to>` for the shape of the change.
- Read the actual diff of any commit whose user-facing effect is unclear from its message — messages describe what the author did; the entry must describe what the user gets.
- Note PR numbers from merge commits; include them (`(#123)`) when the project's existing changelog does.

## Write the draft

Follow the `human-writing` skill for the text.

If the project already has a `CHANGELOG.md` (or equivalent), read its most recent entries and match their format — heading style, category names, bullet phrasing, PR-number links. Use the default structure below only when there is no changelog to match.

Group by user-facing impact, never by commit order. Default structure: the Keep a Changelog categories, omitting empty ones.

- **Added** — new features and capabilities.
- **Changed** — behavior that differs from the previous version. Breaking changes go first in this section, flagged explicitly.
- **Fixed** — bugs resolved, described by symptom ("dates no longer shift across timezones"), not by internal cause.
- **Removed** / **Deprecated** / **Security** — only when applicable.

Each bullet states what a user notices, in one sentence. Fold internal-only work (refactors, CI, dependency bumps, test changes) into a single "Internal" line at the end, or omit it entirely if nothing is observable.

## Output

Write the draft to `.github/drafts/release-notes.md`, overwriting any existing file at that path. Create the `.github/drafts/` directory if it does not exist.

File format:

```markdown
---
title: "v1.3.0"
range: "v1.2.0..HEAD"
---

<entry, ready to paste into CHANGELOG.md or the GitHub release form>
```

After writing the file, show the full draft in chat and state the file path.
