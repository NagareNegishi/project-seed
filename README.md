# Project Seed

Template repository: a stack-agnostic dev container with a Claude Code sandbox
behind an outbound firewall, plus portable skills, path-scoped rules, and
reference docs. New projects start from this repo (GitHub → "Use this template").

## Layout

- `.devcontainer/` — generic container: app service, firewall, Claude Code. Placeholders marked `<placeholder>`.
- `.claude/` — permissions (`settings.json`), path-scoped rules example, portable skills.
- `docs/` — `progress.md` template, `plans/` convention, `reference/` concept docs.
  `reference/project-specific/` holds the seed author's own worked examples
  (real domain, real AWS decisions) — read for ideas, don't carry into a new
  project; delete it during instantiation if you don't want it.
- `examples/<stack>/` — real files from working projects; the stack-specific pieces the seed leaves out.

## Instantiation checklist

1. Create a repo from this template and open it locally.
2. Pick a stack from `examples/` and merge its files over the `<placeholder>` markers (its README says what goes where): Dockerfile base image + packages, compose services/volumes, devcontainer ports/mounts/env/postCreate, firewall stack domains. Then delete the `examples/` entries you didn't use.
3. Create `.devcontainer/.env` from `.env.example` and fill the values.
4. Fill `CLAUDE.md` (skeleton at repo root) and `.claude/rules/` paths.
   Review `LICENSE` — the seed ships MIT under the seed author's name; replace or
   delete it if this project is closed-source or licensed differently.
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

## GitHub issue & PR skills

The seed ships paired skills for drafting and publishing GitHub issues and PRs:
`github-issue-creator` + `issue-publish`, `pr-draft` + `pr-publish`, and
`label-setup`. Two one-time steps per project before first use:

1. Authenticate `gh` yourself with `gh auth login`. No skill runs it, and the
   publish and label skills stop with a reminder if `gh` isn't authenticated.
2. Run `/label-setup` once. It creates the preset labels from
   `.claude/skills/label-setup/labels.yml` in the repo. Publishing a draft that
   names a label the repo lacks stops, because the publish skills never create
   labels. Edit `labels.yml` first if you want a different set.

Then the flow is draft (`/pr-draft` or `/github-issue-creator`), review the file,
publish (`/pr-publish` or `/issue-publish`). Design notes:
`docs/skills/pr-issue-publish.md`.

## Claude attribution

Claude must never appear as a contributor in projects built from this seed. The
seed ships three layers, and all of them carry over on instantiation — keep them:

1. `.claude/settings.json` sets `attribution.commit` to `""`, so Claude Code
   does not generate the `Co-Authored-By` trailer.
2. `CLAUDE.md` states the rule (top block, "Attribution").
3. A PreToolUse hook (`.claude/hooks/coauthor-guard.sh`) blocks any command
   carrying a co-author trailer or the Claude author identity, as a backstop
   for the known cases where the setting alone fails.

Policy and verification: `docs/permissions/v3-no-coauthor.md`.
