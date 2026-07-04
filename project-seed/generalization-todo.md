# Generalization TODO — review together

Files were copied from Job-Application-Tracker verbatim. Nothing below has been
changed; each line is a point to decide or edit.

## Copied verbatim — project-specific values inside

- ~~`examples/dotnet-postgres/devcontainer.json`~~ — RESOLVED 2026-07-04: keep fully verbatim, comment block included; the example's README already frames the files as unmodified and lists the values to replace on instantiation.
- ~~`.claude/skills/frontend-design/SKILL.md` + `.claude/skills/responsive-layout/SKILL.md`~~ — RESOLVED 2026-07-04: both kept. responsive-layout: neutralized the two illustrative `job-tracker-ui` paths (now `frontend/src`). frontend-design: genericized with `<placeholders>` for dirs/stack; workflow kept intact.
- ~~`docs/reference/deployment-setup.md`~~ — RESOLVED 2026-07-04 (full cleanup): `jobtracker-*` names → `<project>-*`; sender address → `noreply@yourdomain.com`; app-specific secret rows tagged as examples; dangling `Production build plan.md` links repointed to `production-checklist.md` / `Ssl tls production setup guide.md`.
- ~~`docs/reference/Setup pipeline in EC2.md`~~ — RESOLVED 2026-07-04: `jobtracker-key.pem` → `<project>-key.pem` (IP/username were already placeholders).
- ~~`docs/reference/Ssl tls production setup guide.md`~~ — RESOLVED 2026-07-04: two real-domain mentions → `<YOUR_DOMAIN>` (rest of the guide already used that placeholder).
- ~~`CLAUDE.md` (root)~~ — RESOLVED 2026-07-04: reworded the stale comment to "Template skeleton. Replace every `<placeholder>`…" (no rename happens on template instantiation).
- ~~`.claude/settings.json`~~ — RESOLVED 2026-07-04: keep the `Read(**/appsettings.*.json)` deny entry in the seed — never matches outside .NET, protects .NET projects by default (same rationale as `**/.env*`).

## New files — review wording/contents

- ~~`.editorconfig`~~ — RESOLVED 2026-07-04: settings kept; every rule now commented (so format mysteries are traceable) + a note that indent rules are omitted on purpose, with a per-filetype example.
- ~~`.claude/rules/example.md`~~ — RESOLVED 2026-07-04: wording checked, kept as-is (placeholder path can't accidentally match; copy-per-area pattern explained in the file).
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
