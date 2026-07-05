---
name: release-notes
description: Use this skill whenever the user wants release notes or a changelog entry drafted from git history. Triggers include phrases like "release notes", "draft the changelog", "changelog for v2.3", "what's in this release", or any request for a summary of changes between two versions, tags, or refs. This skill drafts only. It never creates tags, never edits CHANGELOG.md, and never publishes a release.
---

# Release Notes

Draft a changelog entry from git history between two refs. The user pastes the draft into their changelog or GitHub release form; this skill only produces the text.

## Hard limits

- Local git only, read-only: `git tag`, `git log`, `git diff --stat`, `git describe`, `git merge-base`. Never `git tag -a`, never `git push`, never `gh`, never any network call.
- Draft only: never edit `CHANGELOG.md` or any other changelog file, never create a GitHub release.

## Pick the range

1. If the user named two refs ("v1.2 to v1.3", "since v2.0"), use those.
2. Otherwise, default to latest tag → `HEAD`: find the latest tag with `git describe --tags --abbrev=0` and diff from there.
3. If the repository has no tags and the user gave no refs, stop and ask which ref to start from. Do not guess or summarize the whole history.
4. Confirm the range is non-empty (`git log <from>..<to> --oneline`). If it is empty, say so instead of inventing an entry.

## Gather input

- `git log <from>..<to>` for commit messages, and `git diff --stat <from>..<to>` for the shape of the change.
- Read the actual diff of any change whose user-facing effect is unclear from its commit message. Commit messages describe what the author did; release notes describe what the user gets — verify the difference when in doubt.
- Note merge commits that reference PR numbers; include the number in the entry (`(#123)`) when the project's existing changelog does.

## Write the draft

Follow the `human-writing` skill for the text.

Group by user-facing impact, never by commit order. Use the Keep a Changelog categories, omitting empty ones:

- **Added** — new features and capabilities.
- **Changed** — behavior that differs from the previous version, including breaking changes. Flag breaking changes explicitly, first in their section.
- **Fixed** — bugs resolved, described by symptom ("dates no longer shift across timezones"), not by internal cause.
- **Removed** / **Deprecated** / **Security** — only when applicable.

Each bullet states what a user of the project notices, in one sentence. Fold internal-only work (refactors, CI, dependency bumps, test changes) into a single "Internal" line at the end, or omit it entirely if it changes nothing observable.

If the project already has a `CHANGELOG.md` (or equivalent), read its most recent entries and match their format — heading style, category names, bullet phrasing, PR-number links — instead of the default structure above.

## Output

Write the draft to `.github/drafts/release-notes.md`, overwriting any existing file at that path. Create the `.github/drafts/` directory if it does not exist. Always use this exact path and filename.

File format, matching `pr-draft`:

```markdown
---
title: "v1.3.0"
range: "v1.2.0..HEAD"
---

<entry, ready to paste into CHANGELOG.md or the GitHub release form>
```

After writing the file, show the rendered draft in chat so the user can review without opening the file, and tell them the file path so they know where to copy from.
