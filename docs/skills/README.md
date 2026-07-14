# Skill plan & decision docs

Plan and decision docs for the `.claude/skills/` tooling itself — the authoring
guide plus per-skill decision logs. These are kept out of `docs/plans/` (which is
reserved for product feature plans) so tooling meta-docs and product plans don't
mix.

These files are documentation only. The skills themselves live in `.claude/skills/`.

## Conventions

- `new-skills.md` — the authoring and polish guide; read it before adding or
  polishing any skill (CLAUDE.md requires this).
- One decision log per skill, named `<skill>-decisions.md`. It records what was
  chosen, what was deferred, and why, so future changes have context.
- A design ledger for a multi-skill effort is named for the effort, e.g.
  `pr-issue-publish.md`.

Permission and hook decisions live in `docs/permissions/`, not here — even when
a skill drove them (see `../permissions/v4-gh-allowlist.md`).

## Contents

- [new-skills.md](new-skills.md): skill authoring and polish guide; open
  follow-ups and polish criteria.
- [pr-issue-publish.md](pr-issue-publish.md): design ledger for the `pr-publish`
  and `issue-publish` skills and the `label-setup` preset they depend on.
- [feature-plan.md](feature-plan.md): design ledger for the `plan-product`,
  `plan-impl`, and `plan-verify` skills that turn an idea into a verified plan.
  Designed, not yet built.
- [github-issue-creator-decisions.md](github-issue-creator-decisions.md):
  decision log for the `github-issue-creator` skill (draft-only scope, output
  format, structure).
