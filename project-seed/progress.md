# Seed Build Progress

Tracks finishing this seed repo itself. Update after each work session.
(Not to confuse with `docs/progress.md` — that's the template shipped to new projects.)

## Done

- `.devcontainer/` genericized: placeholders, generic firewall (incl. `api.osv.dev`), `.env.example` pattern.
- `.claude/`: settings.json copied as-is; 12 skills copied, 5 state files excluded; rules example created; `issue-creator-decisions.md` shipped with the github-issue-creator skill as `decisions.md`.
- `docs/`: progress.md template, plans/.gitkeep, 11 reference docs copied verbatim, production-checklist.md extracted.
- `examples/dotnet-postgres/`: source repo's real devcontainer files verbatim + `.env.example` + README + 2 .NET reference docs.
- Root: `CLAUDE.md` (from template, template deleted), `README.md` instantiation checklist, `.editorconfig`, `.gitignore`.
- **Review session 2026-07-04** — walked `generalization-todo.md` end to end; every item resolved or confirmed (resolutions recorded inline in that file). Highlights:
  - frontend-design skill genericized with `<placeholders>`; responsive-layout examples neutralized.
  - deployment-setup / EC2 / SSL docs placeholder-cleaned; dangling doc links repointed.
  - `.editorconfig`: every rule commented so format issues are traceable; indent gap documented as deliberate.
  - `Read(**/.env*)` deny narrowed to enumerated secret variants so `.env.example` stays readable (takes effect next session).
  - Repo name: keep `project-seed`. LICENSE: MIT added + "review/replace LICENSE" step in README checklist.
  - Examples: keep-all policy (projects prune unused entries — pruning step added to README checklist); three new entries copied verbatim: `examples/cpp/` (DJ-App), `examples/node-vite/` (expense-splitter), `examples/dotnet/` (company-verification, incl. `.env.example`). `NagareNegishi.github.io` dropped — identical container files to expense-splitter.
- **Session 2026-07-04 (continued)** — READMEs written for `examples/cpp/`, `examples/node-vite/`, `examples/dotnet/` (dotnet-postgres style; project-specific values listed inline in each). Narrowed `.env*` deny verified working; both `.env.example` files reviewed — placeholder-only, kept verbatim (dotnet one's source-repo adapter references framed in its README). Removed the dangling "seed's generalization todo" pointer from `examples/dotnet-postgres/README.md`.

- First commits made 2026-07-04 — capture the full generalization decision log; `generalization-todo.md` deleted right after (resolutions stay reachable in git history). Its dangling pointer in root `CLAUDE.md` already removed.

## Remaining

1. Push to GitHub.
2. Test-drive: instantiate a throwaway project from the seed, open the dev container, confirm firewall + Claude login via `claude-credentials` volume work.
3. Delete `project-seed/` working folder + the "Seed build (temporary)" block at the top of root `CLAUDE.md`.
4. Mark repo as GitHub template (Settings → "Template repository").
5. Source-repo housekeeping (in Job-Application-Tracker, not here): fix stale plan links in its `docs/progress.md`.
