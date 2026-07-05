# Plan: five new portable skills

Status (2026-07-05): first drafts done for all five, in `.claude/skills/`.
Next: polish each skill in its own session.

1. `pr-draft` — drafted
2. `systematic-debugging` — drafted
3. `session-wrapup` — drafted
4. `dependency-upgrade` — drafted
5. `release-notes` — drafted

Decisions made while drafting, to revisit during polish:

- `pr-draft` writes to `.github/drafts/pr-draft.md` (matching
  `github-issue-creator`) instead of the plan's "one copy-paste block".
- `session-wrapup` is invoked as `/session-wrapup`, not `/wrapup` — the slash
  command comes from the skill name. Rename to `wrapup` if the short command
  matters.
- `dependency-upgrade` went explicit (`disable-model-invocation: true`), with
  optional package-name arguments.
- `release-notes` writes to `.github/drafts/release-notes.md` (same pattern as
  `pr-draft`) and never edits `CHANGELOG.md` itself — pasting the entry in is
  the user's step. It defaults to latest-tag→HEAD and asks for a start ref when
  the repo has no tags rather than summarizing all history.

Delete this file (and its temporary pointer in `CLAUDE.md`) when all five ship.

## Context

The seed's `.claude/skills/` holds portable skills copied into every project
built from this template. These five were picked from a longer candidate list
(2026-07-04 session) as the ones that help the most project types without
overlapping existing skills or Claude Code built-ins.

Conventions every new skill must follow:

- Stack-agnostic. Use `<placeholder>` markers where a project must fill in
  specifics, as `frontend-design` does.
- Drafting skills produce output only, they never post or push. Match
  `github-issue-creator`, which states this in its first line.
- Explicit-command skills set `disable-model-invocation: true`
  (see `comment-audit`). Auto-triggered skills need a description that spells
  out trigger phrases (see `github-issue-creator`).
- Written documents go through `human-writing`; say so in the skill body.

## 1. pr-draft

Produce a paste-ready PR title and body from the current branch. The user
creates PRs in the GitHub web UI and pastes the draft there, so the skill must
not depend on `gh` or any GitHub API access (it also has to work inside the
sandboxed container).

- Input: local git only. Diff and commit log against the base branch
  (detect it, default `main`).
- Output: title plus body (summary of what changed and why, notable decisions,
  test plan), ending in one copy-paste block. If
  `.github/PULL_REQUEST_TEMPLATE.md` exists, fill that structure instead.
- Trigger: auto, on "draft a PR", "write the PR description", and similar.
- Never pushes, never calls `gh`. Lean on `human-writing` for tone.

## 2. systematic-debugging

Discipline skill in the style of `code-commenting`: reproduce, isolate,
hypothesize, then verify with evidence before touching code. Never "fix"
something that has not been reproduced.

- Trigger: auto, whenever the task is diagnosing a bug or unexpected behavior.
- Core rules to encode: state the reproduction first; change one variable at a
  time; every hypothesis needs an observation that could falsify it; a fix must
  be confirmed against the original reproduction, not just by passing tests.

## 3. session-wrapup

Explicit `/wrapup` command (`disable-model-invocation: true`). Closes the loop
that this repo's docs convention already asks for: `docs/progress.md` is
supposed to be updated after each major feature, and nothing enforces it.

- Steps: update `docs/progress.md`, check for uncommitted or unpushed work and
  report it (do not commit), list open threads and decisions made this session.
- Keep the progress entry format consistent with whatever `docs/progress.md`
  already uses in the instantiated project.

## 4. dependency-upgrade

Upgrade workflow only. Vulnerability detection stays with the `owasp-*` skills
(that is what the `api.osv.dev` firewall entry is for); this skill must not
duplicate it.

- Steps: list outdated dependencies with the project's package manager, read
  the changelog or release notes for breaking changes, upgrade one package at a
  time, run the test suite between upgrades, stop and report on any failure.
- Stack-agnostic via placeholders for the package-manager commands.
- Trigger: probably explicit (`/dependency-upgrade`); decide when building.
- Firewall note: changelogs and registries may need domains the container
  firewall does not allow. The skill should degrade gracefully (report what it
  could not fetch) rather than fail.

## 5. release-notes

Draft a changelog entry from git history between two refs (tag to tag, or tag
to HEAD). Drafting skill: output only, never tags or publishes.

- Group by user-facing impact (added / changed / fixed), not by commit order.
  Fold internal-only commits into a short line or omit them.
- Trigger: auto, on "release notes", "changelog for vX", and similar.
- Lean on `human-writing`.

## Rejected candidates, for the record

- `pr-description` via `gh`: rejected in its CLI form because the user works
  in the GitHub web UI; reworked into `pr-draft` above.
- `error-handling-and-logging`: `owasp-guard` already covers error handling,
  logging failures, and secrets in logs.
- `tdd-mode`: narrow audience for a general-purpose seed.
- `safe-refactoring`: `/simplify` plus `/verify` plus default behavior already
  cover it.
- `dead-code-audit`, `a11y-audit`, `todo-triage`, `feature-plan`: not rejected,
  just below the cut line. Revisit after the five above ship.
