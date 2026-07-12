# Permission presets

Versioned snapshots of the git/tool permission policy for this project. These files are documentation only. The active policy is whatever sits in `.claude/settings.json`; nothing in this folder has any effect until you paste it there.

## Why this exists

Each change to the permission policy is a trade-off worth recording: what became allowed, what stayed blocked, and why. Keeping every version lets you roll back to a known state or start a new project from the preset that fits it.

## Conventions

- One file per version: `vN-short-slug.md`, numbered in the order they were designed.
- Each file contains:
  - what this preset is for and when to pick it
  - a summary of what is allowed silently, what prompts, and what is hard-blocked
  - deliberate omissions: things intentionally left out, so a future reader does not "fix" them
  - the paste-ready `permissions` JSON block
  - what changed from the previous version, except in v0
- Files here are never edited to match later thinking. A new decision means a new version file.

## Applying a preset

Copy the JSON block from the version file into the `permissions` key of `.claude/settings.json`. If the preset requires a hook, the file says so and links to the hook script.

## Versions

- [v0 — baseline strict](v0-baseline-strict.md): `status`/`diff` allowed silently, `add`/`commit` prompt, all remote and branch operations hard-blocked. Captured 2026-07-12.
