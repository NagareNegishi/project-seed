# Project Seed — Start Here

This folder bootstraps a new template repository: a stack-agnostic dev container +
Claude Code sandbox that new projects start from. Copy this folder into the fresh
repo, open a Claude Code session there, and work through this file.

## Where the information is

- **Build plan**: `plan.md` in this folder. It lists every file to keep, genericize,
  or drop, and the target layout. Follow it file by file.
- **Source material**: the `Job-Application-Tracker` repo
  (in a dev container: `/workspaces/Job-Application-Tracker`). All files referenced
  in the plan are copied from there. Do not clone it; copy individual files.

## Build order

1. Copy `.devcontainer/` files from the source repo, then apply the placeholder
   edits listed in the plan.
2. Genericize `project-firewall.sh`: keep the generic allowlist, move stack-specific
   domains into the example.
3. Copy the portable skills into `.claude/skills/` and adjust `.claude/settings.json`.
4. Copy `CLAUDE.md.template` from this folder to the repo root, renamed to
   `CLAUDE.md`, and create the `docs/` skeleton.
5. Build `examples/dotnet-postgres/` from the source repo's real files.
6. Write the seed's own root `README.md` with the instantiation checklist.
7. Have the user mark the repo as a GitHub template repository (Settings →
   "Template repository").

## How the user works

- The user runs all shell commands themselves. Show commands in a code block;
  never execute them.
- Explain what a change does before writing it, one step at a time. Do not batch
  edits.
- Keep docs short: one line per finding, state the decision, skip the reasoning.
- Use placeholders in anything committed (no real email addresses, regions, or
  hostnames).
