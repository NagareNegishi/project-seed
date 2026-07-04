# Example: .NET + PostgreSQL (+ React frontend)

The Job-Application-Tracker's real dev-container files, unmodified. Merge the
stack-specific parts into the seed's `.devcontainer/` placeholders:

- `Dockerfile` — base image `mcr.microsoft.com/devcontainers/dotnet`, adds `postgresql-client`, installs `dotnet-ef` as the vscode user.
- `docker-compose.yml` — `db` service (postgres) + `postgres-data` and `aspnet-https` volumes.
- `devcontainer.json` — fragments to copy: `forwardPorts` (backend/frontend/postgres), `aspnet-https` mount, Kestrel `remoteEnv` block, `postCreateCommand` restore/install/shell-env entries, `csdevkit` extension.
- `project-firewall.sh` — the stack domain block to paste at the seed firewall's marked insertion point: NuGet (`api.nuget.org`, `www.nuget.org`, `globalcdn.nuget.org`, `dist.nuget.org`), VS Code (`marketplace.visualstudio.com`, `vscode.blob.core.windows.net`, `update.code.visualstudio.com`), `dotnetcli.blob.core.windows.net`, `ui.shadcn.com`.
- `.env.example` — POSTGRES_* vars; copy to `.devcontainer/.env` and fill.
- `reference/` — .NET-stack docs (ASP.NET Core backend, ASP.NET Identity).

Project-specific values still inside these files (paths, connection-string key,
timezone) are listed in the seed's generalization todo — replace them when
instantiating.
