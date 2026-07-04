# Seed Build Progress

Tracks finishing this seed repo itself. Update after each work session.
(Not to confuse with `docs/progress.md` — that's the template shipped to new projects.)

## Done

- `.devcontainer/` genericized: placeholders, generic firewall (incl. `api.osv.dev`), `.env.example` pattern.
- `.claude/`: settings.json copied as-is; 12 skills copied, 5 state files excluded; rules example created; `issue-creator-decisions.md` shipped with the github-issue-creator skill as `decisions.md`.
- `docs/`: progress.md template, plans/.gitkeep, 11 reference docs copied verbatim, production-checklist.md extracted.
- `examples/dotnet-postgres/`: source repo's real devcontainer files verbatim + `.env.example` + README + 2 .NET reference docs.
- Root: `CLAUDE.md` (from template, template deleted), `README.md` instantiation checklist, `.editorconfig` (revisit noted), `.gitignore`.
- `generalization-todo.md` written — all deferred edits and open decisions live there.

## Remaining

1. Review session: walk `generalization-todo.md` together; apply the agreed edits.
2. Decide: seed repo name, LICENSE, `.editorconfig` contents, frontend-design/responsive-layout keep-or-drop.
3. Optional: build more `examples/` entries — candidate list with confirmed stacks in `generalization-todo.md` ("Still open").
4. First commit + push to GitHub.
5. Test-drive: instantiate a throwaway project from the seed, open the dev container, confirm firewall + Claude login via `claude-credentials` volume work.
6. Delete `project-seed/` working folder + the "Seed build (temporary)" block at the top of root `CLAUDE.md`.
7. Mark repo as GitHub template (Settings → "Template repository").
8. Source-repo housekeeping (in Job-Application-Tracker, not here): fix stale plan links in its `docs/progress.md`.
