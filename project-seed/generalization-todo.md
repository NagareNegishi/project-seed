# Generalization TODO — review together

Files were copied from Job-Application-Tracker verbatim. Nothing below has been
changed; each line is a point to decide or edit.

## Copied verbatim — project-specific values inside

- ~~`examples/dotnet-postgres/devcontainer.json`~~ — RESOLVED 2026-07-04: keep fully verbatim, comment block included; the example's README already frames the files as unmodified and lists the values to replace on instantiation.
- ~~`.claude/skills/frontend-design/SKILL.md` + `.claude/skills/responsive-layout/SKILL.md`~~ — RESOLVED 2026-07-04: both kept. responsive-layout: neutralized the two illustrative `job-tracker-ui` paths (now `frontend/src`). frontend-design: genericized with `<placeholders>` for dirs/stack; workflow kept intact.
- `docs/reference/deployment-setup.md` — placeholder the `jobtracker-*` AWS resource / IAM names.
- `docs/reference/Setup pipeline in EC2.md` — placeholder remaining project names / IP / key names.
- `docs/reference/Ssl tls production setup guide.md` — placeholder the real domain.
- `CLAUDE.md` (root) — first comment line still says "Rename to CLAUDE.md at the new repo root"; already renamed — reword?
- `.claude/settings.json` — deny entry `Read(**/appsettings.*.json)` is .NET-specific; keep in seed (harmless) or move to example?

## New files — review wording/contents

- `.editorconfig` — revisit contents (universal-only settings chosen; no indent rules).
- `.claude/rules/example.md` — new file: source rules were frontmatter-only, nothing to copy; check placeholder wording.
- `docs/progress.md`, `docs/reference/production-checklist.md`, `examples/dotnet-postgres/README.md` + `.env.example`, root `README.md` — written new per plan; review.

## Placement calls made — confirm

- `issue-creator-decisions.md` → `.claude/skills/github-issue-creator/decisions.md` (plan open item: checked, it is that skill's decision log).
- `devcontainer-lock.json` not copied into the example (machine-specific pin; seed has its own).
- `api.osv.dev` — already in the seed's generic firewall; plan open item resolved as generic.

## Still open (from plan)

- Seed repo name.
- LICENSE if the repo is public.
- Which other projects become `examples/` entries. Candidates confirmed 2026-07-04: all have the same devcontainer + firewall + `.claude` pattern, visible at `/workspaces/<name>` from this container; stack read from each `.devcontainer/Dockerfile` base image:
  - `DJ-App` — C++ (`devcontainers/cpp:1-ubuntu-24.04`), client + server dirs → distinct stack, strongest candidate (`examples/cpp/`).
  - `expense-splitter` — Vite + TypeScript frontend-only (`devcontainers/base:ubuntu-22.04`) → candidate (`examples/node-vite/`).
  - `NagareNegishi.github.io` — Vite frontend, GitHub Pages (`devcontainers/base:ubuntu-22.04`) → same shape as expense-splitter; pick one of the two.
  - `company-verification` — .NET 10 (`devcontainers/dotnet:2-10.0`), API + Core + Tests → overlaps dotnet-postgres; likely skip unless its setup differs.
- Delete the `project-seed/` working folder (plan/README/template/this file) before marking as template?
- Source-repo housekeeping: Job-Application-Tracker `docs/progress.md` still links `docs/Production build plan.md` / `docs/Demo and Auth Features Plan.md`; actual paths are `docs/plans/production-build.md` / `docs/plans/demo-auth-features.md`. Fix in the source repo, not here.
- User action: GitHub → Settings → check "Template repository".
