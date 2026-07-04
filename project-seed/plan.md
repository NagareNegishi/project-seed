# Project Seed — Build Plan

Source: `Job-Application-Tracker` repo. Target: a fresh repo marked as a GitHub
template. No cloning — cloning drags this project's history into the seed.

## Decisions

- Fresh repo + GitHub "Template repository" flag, not a clone.
- Stack examples are real files under `examples/`, not code blocks in markdown.
- Keep a minimal working Dockerfile + compose pair. The firewall install lives in
  the Dockerfile, so the seed cannot ship `devcontainer.json` alone.
- The `claude-credentials` volume keeps its fixed name: every project built from
  the seed shares one Claude login/config. Documented in the seed README.

## Target layout

```
seed-repo/
├── .devcontainer/
│   ├── devcontainer.json        # generic base, placeholders marked
│   ├── docker-compose.yml       # app service + claude-credentials volume only
│   ├── Dockerfile               # FROM <placeholder> + firewall install block
│   ├── project-firewall.sh      # generic allowlist + "add stack domains here"
│   └── .env.example
├── .claude/
│   ├── settings.json
│   ├── rules/                   # example path-scoped rule file
│   └── skills/                  # portable skills only, state files excluded
├── docs/
│   ├── progress.md              # empty template
│   ├── plans/                   # .gitkeep; convention documented in CLAUDE.md
│   └── reference/               # generic concept docs carried from source repo
├── examples/
│   └── dotnet-postgres/         # this repo's real files + per-stack README
├── CLAUDE.md                    # section-header skeleton to fill per project
└── README.md                    # what the seed is + instantiation checklist
```

## Keep and genericize

- `.devcontainer/devcontainer.json` — placeholders for: `name`, `forwardPorts`,
  `postCreateCommand` entries, `TZ`. Move the Kestrel `remoteEnv` block and the
  `aspnet-https` mount to the dotnet example. Keep: features (node, claude-code),
  `claude-credentials` mount, `containerEnv` (NODE_OPTIONS, CLAUDE_CONFIG_DIR),
  firewall `postStartCommand` + `waitFor`.
- `.devcontainer/Dockerfile` — keep base-image placeholder, firewall package
  installs (iptables, ipset, iproute2, jq, dnsutils, aggregate), firewall
  COPY/chmod/sudoers block. Move `postgresql-client` and `dotnet-ef` to the example.
- `.devcontainer/docker-compose.yml` — keep `app` service and `claude-credentials`
  volume. Move `db` service, `postgres-data`, `aspnet-https` to the example.
- `.devcontainer/project-firewall.sh` — generic allowlist: GitHub meta ranges,
  `api.anthropic.com`, `registry.npmjs.org`. Stack block (moved to example, with a
  marked insertion point): `api.nuget.org`, `www.nuget.org`, `globalcdn.nuget.org`,
  `dist.nuget.org`, `marketplace.visualstudio.com`, `vscode.blob.core.windows.net`,
  `update.code.visualstudio.com`, `dotnetcli.blob.core.windows.net`, `ui.shadcn.com`.
  Undecided: `api.osv.dev` (used by owasp skills — generic if those skills ship).
- `.claude/settings.json` — keep permissions as-is; `.comment-audit` entries stay
  (comment-audit skill ships). Do not copy `settings.local.json`.
- `.claude/rules/` — mechanism ships (path-scoped rule files with `paths:`
  frontmatter); replace this repo's backend/frontend/tests rules with one example.
- `CLAUDE.md` — ready-made skeleton at `project-seed/CLAUDE.md.template`; rename
  to `CLAUDE.md` at the seed root.
- `docs/progress.md` — empty template with the update convention noted.

## Skills triage (confirmed against `.claude/skills/`)

- Portable as-is: code-commenting, comment-audit, human-writing,
  github-issue-creator, dev-research, owasp-guard/scan/update, unit-tests,
  learning-mode-coding. The `owasp-guard/cache/` + `references/` ship (pre-bundled
  per `docs/owasp-guard-skill-SETUP.md`).
- Genericize or drop: frontend-design, responsive-layout (hardcode `job-tracker-ui/`).
- Exclude per-project state files: `owasp-scan/findings.json`,
  `responsive-layout/files.json` + `issues.md`, `unit-tests/files.json` + `plan.md`.

## Docs to carry over (copy as-is; generalize in the new repo, not here)

To `docs/reference/` — generic or nearly so:

- `Dev Containers.md` — dev container + Claude Code feature concepts.
- `Claude Code — WSL credential extraction.md` — auth-in-container workaround;
  pairs with the `claude-credentials` volume.
- `new-machine-setup.md` — git CRLF fix + prerequisites.
- `refresh tokens.md` — auth concept reference.
- `Cookie storage for JWTs.md` — httpOnly cookie + silent-refresh pattern.
- `Ssl tls production setup guide.md` — concept reference; placeholder the domain.
- `owasp-guard-skill-SETUP.md` — ships next to the owasp-* skills.
- `deployment-setup.md` — AWS resources / GitHub secrets / IAM table format;
  placeholder the `jobtracker-*` names.
- `Setup pipeline in EC2.md` — EC2 one-time setup; placeholder remaining names.
- `stack-decisions.md` — AWS free-tier research; keep its "verify against live
  pricing" warning, note it rots.
- `ses-rejection-notes.md` — lesson learned: SES rejects low-volume personal
  apps → use Resend.

To `examples/dotnet-postgres/reference/` — .NET-stack docs:

- `ASP.NET Core backend.md`, `ASP.NET Identity.md`.

Do not carry: `cv-highlights.md` (personal), `dev-accounts.md` (credentials; the
doc+seed-script pattern gets one line in seed conventions),
`company-verification-api-reference.md` (project contract), `docs/plans/*`
(convention only — check `plans/issue-creator-decisions.md` first, it may belong
with the github-issue-creator skill).

Extract, don't copy: the production step checklist in `docs/plans/production-build.md`
(auth → infra → config → logging → health check → security headers → CI/CD →
migrations → deploy → SSL → rate limiting → monitoring) becomes a generic
`docs/reference/production-checklist.md`.

## Create new

- Root `README.md` — instantiation checklist: pick a stack from `examples/`, copy
  its files over the placeholders, set ports, create `.devcontainer/.env`, fill
  `CLAUDE.md`.
- `.devcontainer/.env.example` — placeholder POSTGRES_* vars live in the example;
  the seed copy documents the pattern.
- `examples/dotnet-postgres/` — this repo's actual Dockerfile, docker-compose.yml,
  firewall domain block, devcontainer fragments (ports, mounts, remoteEnv,
  postCreateCommand), `.env.example`, short README.
- `examples/<other-stack>/` — from the user's other projects with similar setups.
- `.gitignore` (base; per-stack additions in examples), `.editorconfig`,
  LICENSE if public.

## Drop

- All source: `JobTrackerApi/`, `job-tracker-ui/`, `JobTrackerApi.Tests/`.
- Project docs: `docs/plans/*`, `docs/progress.md` content,
  `docs/company-verification-api-reference.md`.
- Project git history (fresh `git init`).

## Open items

- Decide seed repo name.
- Decide whether `api.osv.dev` is generic or per-stack (owasp skills ship, so
  likely generic).
- Decide which other projects become `examples/` entries, and gather their files.
- Check `docs/plans/issue-creator-decisions.md` before dropping plans.
- Housekeeping in the source repo (not the seed): `docs/progress.md` still points
  at `docs/Production build plan.md` and `docs/Demo and Auth Features Plan.md`;
  actual paths are `docs/plans/production-build.md` and
  `docs/plans/demo-auth-features.md`.
