<!-- TEMPORARY — seed build only. Delete this block together with the
     project-seed/ folder before marking the repo as a template (progress.md step 6). -->

## Seed build (temporary)

This repo is the seed itself, still being built. Decision sources, in order:

- `project-seed/progress.md` — current state + remaining steps; read at session start.
- `project-seed/generalization-todo.md` — deferred edits and open decisions; do not apply without the user.
- `project-seed/plan.md` — the original build plan.
- `project-seed/README.md` — working rules: the user runs all shell commands themselves; explain each change before making it; files copied from the source repo are verbatim — never refactor or reword them silently.

Everything below this block is the template skeleton shipped to new projects — fill it there, not here.

<!-- END TEMPORARY -->

<!-- Rename to CLAUDE.md at the new repo root. Replace every <placeholder>.
     Delete sections that do not apply. -->

## Project Overview

<One paragraph: what the app does.>

- **Backend**: <framework + version> (`<backend-dir>/`)
- **Frontend**: <framework + version> (`<frontend-dir>/`)
- **Database**: <database + access layer>
- **Test project**: <test framework> (`<test-dir>/`)

The dev environment runs in a Dev Container (`.devcontainer/`).

## Docs

- `docs/progress.md` — read at session start; update after each major feature completes.
- `docs/plans/` — per-feature plan/decision files; read only the relevant file when working on a feature.

## Commands

### Backend (from `<backend-dir>/`)

```bash
<run command>
```

### Tests (from repo root or `<test-dir>/`)

```bash
<test command>
<single-test filter command>
```

### Frontend (from `<frontend-dir>/`)

```bash
<dev server command>    # <dev URL>
<build command>
```

## Configuration

### Backend

<Config file or env vars. One line per key: name — what it does, whether the app
fails fast without it.>

### Frontend

<Env vars, e.g. API base URL and which file sets it.>

## Architecture

### Backend

<One line per layer: where controllers/routes live, how data access works, which
concerns go through service abstractions. List models/DTOs only if their shape is
not obvious from the code.>

### Frontend

<Data flow in one line, e.g. pages → hooks → services → API. Routing table.
Path aliases.>

### Tests

<How tests are isolated (in-memory DB, mocks), anything a new test must set up.>

## Skills

- When writing or editing code: follow: `.claude/skills/code-commenting/SKILL.md`
<other skill pointers>
