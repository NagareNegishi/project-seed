# Examples

Most subfolders are one working project's real `.devcontainer/` files,
unmodified. Pick the stack that matches, merge its pieces into the seed's
`.devcontainer/` placeholders per that folder's own `README.md`, then delete
the folders you didn't use. See the root `README.md` ("Instantiation
checklist") for the merge steps.

| Stack | Source project | Base image | Services | Notable |
|---|---|---|---|---|
| `cpp/` | DJ-App | `devcontainers/cpp` + JUCE 8.0.12 baked in | `app` only | GUI runs on host, no forwarded ports; shows the "bake a pinned framework into the image" pattern |
| `dotnet/` | company-verification service | `devcontainers/dotnet` | `app` only, no db | `.env.example` for app-specific secrets; firewall includes two external APIs (NZ/AU company registries) as a template for whitelisting your own |
| `dotnet-postgres/` | Job-Application-Tracker | `devcontainers/dotnet` + `postgresql-client` | `app` + `db` (postgres) | React frontend; has its own `reference/` subfolder (ASP.NET Core, ASP.NET Identity docs) |
| `node-vite/` | expense-splitter | `devcontainers/base:ubuntu-22.04` + node feature | `app` only, no db | Frontend-only; Vite dev server on port 5173 |
| `python-postgres/` | kajitor-py | `devcontainers/python:3-3.14-trixie` + `uv` (copied from Astral's image) | `app` + `db` (postgres) | React frontend; FastAPI/SQLAlchemy/Alembic backend; the Python rebuild of `dotnet-postgres`'s source project |

Every folder above leaves project-specific values in place (names, timezones,
app-specific domains/keys) — its `README.md` lists exactly which ones to
replace.

## `browser-extension/` is not a dev-container stack

That folder holds Kajitor's Manifest V3 extension build (esbuild + TypeScript
+ vitest) — a reference for adding a browser extension *alongside* an
existing web app, not a container setup. Nothing in it merges into
`.devcontainer/`. See its own `README.md`.
