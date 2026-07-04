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
- ~~`docs/progress.md`, `docs/reference/production-checklist.md`, `examples/dotnet-postgres/README.md`, root `README.md`~~ — RESOLVED 2026-07-04: reviewed, all kept as written (checklist's source-repo link already uses the corrected `docs/plans/production-build.md` path).
- `examples/dotnet-postgres/.env.example` — review still pending: the old `Read(**/.env*)` deny blocked it this session. Deny has been narrowed in `.claude/settings.json` (enumerated secret variants; `.env.example` readable) — takes effect next session; verify then.

## Placement calls made — CONFIRMED 2026-07-04

- `issue-creator-decisions.md` → `.claude/skills/github-issue-creator/decisions.md` (plan open item: checked, it is that skill's decision log).
- `devcontainer-lock.json` not copied into the example (machine-specific pin; seed has its own).
- `api.osv.dev` — already in the seed's generic firewall; plan open item resolved as generic.

## Still open (from plan)

- ~~Seed repo name~~ — RESOLVED 2026-07-04: keep `project-seed`.
- ~~LICENSE~~ — RESOLVED 2026-07-04: MIT added under Nagare Negishi ("anyone can use, credit required" = MIT's retained copyright notice); README instantiation checklist got a "review/replace LICENSE" step for closed-source projects.
- Examples selection — DECIDED 2026-07-04: keep three new entries (extra examples cost nothing in the template; each new project picks the best match and deletes unused entries — pruning step added to the README checklist). Checked: `company-verification` is NOT redundant — plain .NET API, no db service, and its firewall demonstrates app-specific API domains. `NagareNegishi.github.io` dropped: its devcontainer files are identical to expense-splitter's except the `name` field.
  - `DJ-App` → `examples/cpp/` — C++/JUCE, CMake+Ninja, JUCE baked into the image.
  - `expense-splitter` → `examples/node-vite/` — Vite+TS frontend-only.
  - `company-verification` → `examples/dotnet/` — .NET 10 API, no db; root `.env.example` copied too.
  - Files copied 2026-07-04 (verbatim; lock files and real `.env` excluded), verified present.
  - NEXT SESSION: write the three example READMEs in the `examples/dotnet-postgres/README.md` style ("what goes where": Dockerfile base image + packages, compose services, devcontainer fragments, firewall stack-domain block). Source facts gathered this session: cpp = JUCE 8.0.12 baked into image, clang default, ninja + clang-tools-18, VS Code domains in firewall; node-vite = base:ubuntu-22.04 + node feature, port 5173, `ui.shadcn.com` in firewall; dotnet = dotnet:2-10.0 base, no db service, ports 7100/5286, NuGet + `api.business.govt.nz`/`abr.business.gov.au` in firewall (app-specific API domains worth calling out), `.env.example` included.
- Delete the `project-seed/` working folder (plan/README/template/this file) before marking as template?
- Source-repo housekeeping: Job-Application-Tracker `docs/progress.md` still links `docs/Production build plan.md` / `docs/Demo and Auth Features Plan.md`; actual paths are `docs/plans/production-build.md` / `docs/plans/demo-auth-features.md`. Fix in the source repo, not here.
- User action: GitHub → Settings → check "Template repository".
