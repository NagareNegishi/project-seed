# Project Seed

Template repository: a stack-agnostic dev container with a Claude Code sandbox
behind an outbound firewall, plus portable skills, path-scoped rules, and
reference docs. New projects start from this repo (GitHub → "Use this template").

## Layout

- `.devcontainer/` — generic container: app service, firewall, Claude Code. Placeholders marked `<placeholder>`.
- `.claude/` — permissions (`settings.json`), path-scoped rules example, portable skills.
- `docs/` — `progress.md` template, `plans/` convention, `reference/` concept docs.
- `examples/<stack>/` — real files from working projects; the stack-specific pieces the seed leaves out.

## Instantiation checklist

1. Create a repo from this template and open it locally.
2. Pick a stack from `examples/` and merge its files over the `<placeholder>` markers (its README says what goes where): Dockerfile base image + packages, compose services/volumes, devcontainer ports/mounts/env/postCreate, firewall stack domains.
3. Create `.devcontainer/.env` from `.env.example` and fill the values.
4. Fill `CLAUDE.md` (skeleton at repo root) and `.claude/rules/` paths.
5. Open in the dev container ("Reopen in Container"). The firewall runs on every start; only allowlisted domains are reachable.
6. After the first feature, start updating `docs/progress.md`.

## Claude credentials volume

`docker-compose.yml` mounts a volume with the fixed name `claude-credentials`:
every project built from this seed shares one Claude login/config. Log in once
in any of them; delete the volume to reset.

## Firewall

`.devcontainer/project-firewall.sh` allows GitHub (dynamic IP ranges),
`api.anthropic.com`, `registry.npmjs.org`, and `api.osv.dev` (owasp-* skills).
Add stack domains at the marked insertion point — examples ship ready-made blocks.
