# Example: Node + Vite (frontend-only)

The expense-splitter's real dev-container files, unmodified. Merge the
stack-specific parts into the seed's `.devcontainer/` placeholders:

- `Dockerfile` — base image `mcr.microsoft.com/devcontainers/base:ubuntu-22.04` plus firewall tools, nothing else. Node comes from the devcontainer feature, not the image.
- `docker-compose.yml` — single `app` service, no database. Optional `env_file: ../.env` for local secrets.
- `devcontainer.json` — fragments to copy: `node` feature, `forwardPorts: [5173]` (Vite dev server), `npm install` postCreateCommand, extensions (eslint, prettier, tailwindcss, vitest explorer).
- `project-firewall.sh` — stack domain block: npm (`registry.npmjs.org`), VS Code (`marketplace.visualstudio.com`, `vscode.blob.core.windows.net`, `update.code.visualstudio.com`), and `ui.shadcn.com` for fetching shadcn/ui components. Predates the `api.osv.dev` entry; the seed's firewall already has it.

Project-specific values still inside these files: the `name` field
(`Expense Splitter (React + Vite)`) and `TZ` (`Pacific/Auckland`). Replace
them when instantiating.
