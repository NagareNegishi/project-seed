<!-- Template skeleton. Replace every <placeholder>.
     Delete sections that do not apply. -->

**Skill work**: before polishing or adding a skill in `.claude/skills/`, read
`docs/skills/new-skills.md` (authoring and polish guide).

**Agent work** — TEMPORARY, delete this whole block once every agent is promoted and
drafts are synced. Before creating, promoting, or polishing any agent (`.claude/agents/`
or `docs/agents/` drafts), READ these in order and in full:
1. `docs/notes.md` "Next-session handoff" — campaign state and which agent is next.
2. `docs/agents/review-findings.md` — per-draft verdicts and findings.
3. `docs/agents/README.md`, then `definition-template.md` + `template.md` in that dir.
4. `docs/skills/new-skills.md` "Polish criteria".
Then:
- Promote one agent at a time with user sign-off; walk the 10-point "Promotion check"
  in `definition-template.md`.
- Per item: show what would land in the target file with per-section justification,
  then STOP for the user's call before writing. No batch-apply — a go on one agent is
  not a go on the rest.
- Polish the LIVE `.claude/agents/<name>.md` only and leave it ahead of its draft. Do
  NOT sync drafts one at a time; carry each live file's refinements (`model: inherit`,
  Verdict field, …) forward into the next draft promoted. Drafts are mirrored to live
  in ONE final pass after every agent is promoted.
- Never leak the manager/fleet taxonomy into an agent file — a cold subagent does not
  know the fleet exists; state each lane in the agent's own terms.

**Config work**: changes to `.claude/settings.json` (permissions, hooks) must cite
the relevant code.claude.com docs and get user sign-off before writing.

**Attribution**: never add Claude as author, co-author (`Co-Authored-By`), or
contributor in anything that goes to git — commits, merges, tags, PRs. Enforced
by a PreToolUse hook; policy: `docs/permissions/v3-no-coauthor.md`.

**Session notes**: record observations worth remembering as one-line entries in
`docs/notes.md` (gitignored) — not auto-memory; promote to CLAUDE.md or a skill
only with user review.

**Doc voice**:
- Planning or exploring options: keep intention and reasoning.
- Settling, or writing for a future session or reader: cut to the minimum.
- Docs addressed to Claude: write directives, not prose.

**Response style**:
- Answer only what was asked. No preamble, postamble, or summary of what you just did.
- Default concise; match answer length to question length.
- No hedging words (may/might/could/possibly). Verify the claim, or drop it and
  say in one line what could not be verified.
- Ask clarifying questions as plain text; do not use the AskUserQuestion tool.
- Verify version numbers, pricing, and API signatures against official docs, not memory.

## Project Overview

<One paragraph: what the app does.>

- **Backend**: <framework + version> (`<backend-dir>/`)
- **Frontend**: <framework + version> (`<frontend-dir>/`)
- **Database**: <database + access layer>
- **Test project**: <test framework> (`<test-dir>/`)

The dev environment runs in a Dev Container (`.devcontainer/`).

## Docs

- `docs/progress.md` — read at session start; update after each major feature completes.
- `docs/plans/` — per-feature product plan/decision files; read only the relevant file when working on a feature.
- `docs/skills/` — plan/decision docs for the `.claude/skills/` tooling itself (authoring guide + per-skill decision logs). Kept out of `docs/plans/` so product plans don't mix with tooling meta-docs.

## Reusables

`reusables/` holds portable React/TypeScript pieces to copy into projects:
`component/` (app components), `shadcn/` (shadcn/ui primitives), `util/` (helpers
and hooks). Check here before writing a new component or util; not part of any build.

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
- When committing: follow `.claude/skills/git-commit/SKILL.md` — Conventional
  Commits, atomic commits, `feat`/`fix` need an issue ref.
<other skill pointers>
