# Example: .NET API (no database)

The company-verification service's real dev-container files, unmodified. Merge
the stack-specific parts into the seed's `.devcontainer/` placeholders:

- `Dockerfile` — base image `mcr.microsoft.com/devcontainers/dotnet:2-10.0`, firewall tools, and dotnet global tools added to PATH. No db client: this stack has no database service.
- `docker-compose.yml` — single `app` service. Optional `env_file: ../.env` feeds the root `.env` into the container.
- `devcontainer.json` — fragments to copy: `forwardPorts: [7100, 5286]` (Kestrel HTTPS/HTTP), extensions (`csdevkit`, `rest-client`). The commented-out restore postCreateCommand still shows a `JobTrackerApi` path from an older copy; adapt it to your backend dir.
- `project-firewall.sh` — stack domain block: NuGet (`api.nuget.org`, `www.nuget.org`, `globalcdn.nuget.org`, `dist.nuget.org`), `dotnetcli.blob.core.windows.net`, VS Code (`marketplace.visualstudio.com`, `vscode.blob.core.windows.net`, `update.code.visualstudio.com`), plus two app-specific entries: `api.business.govt.nz` and `abr.business.gov.au` (the NZ/AU company registries this app calls). Those two show how to whitelist your own app's external APIs.
- `.env.example` — root-level secrets pattern: copy to `.env`, compose picks it up via `env_file`. The keys (`NZBN__SubscriptionKey`, `ABR__Guid`) and the adapter-folder comments belong to the source app; keep the pattern, replace the contents.

Project-specific values still inside these files: the registry API domains in
the firewall, the `.env.example` keys, the commented `JobTrackerApi` restore
path, and `TZ` (`Pacific/Auckland`). Replace them when instantiating.
