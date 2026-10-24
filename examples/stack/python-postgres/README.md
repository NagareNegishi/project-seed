# Example: Python (FastAPI) + PostgreSQL (+ React frontend)

kajitor-py's dev-container files — the Python/FastAPI rebuild of the
`dotnet-postgres` example's source project. Merge the stack-specific parts
into the seed's `.devcontainer/` placeholders:

- `Dockerfile` — base image `mcr.microsoft.com/devcontainers/python:3-3.14-trixie`
  (Python comes from the base image, not a feature). Adds `postgresql-client`
  + firewall tools (`bind9-dnsutils`, not `dnsutils` — Debian Trixie's rename).
  Installs `uv` by copying the pinned binary out of Astral's own image
  (`COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /uvx /bin/`) instead of
  `apt`/`curl`/a devcontainer feature.
- `docker-compose.yml` — `db` service (postgres) + `postgres-data` volume, same
  shape as `dotnet-postgres`. No `aspnet-https` volume — no dev cert needed
  for uvicorn. Pins the Compose project name (`name: <project>`) so
  container/image/volume names don't follow the folder name; replace
  `<project>` with your project's slug.
- `devcontainer.json` — fragments to copy: `forwardPorts` (backend 8000,
  frontend 5173, postgres 5432), `frontend-node-modules` mount (Windows
  bind-mount perf — included directly here, not optional), `ms-python.python`
  extension, `postCreateCommand` entries. The `backend` step guards on
  `pyproject.toml` existing (`if [ -f pyproject.toml ]; then uv sync; fi`) so
  a missing file doesn't block the `frontend`/`claude-onboarding` steps that
  follow — useful before the backend is scaffolded yet. `shell-env` builds
  `DATABASE_URL` in SQLAlchemy/asyncpg form
  (`postgresql+asyncpg://user:pass@db:5432/db`) from the `.env` `POSTGRES_*`
  vars, read by both the FastAPI app and Alembic.
- `project-firewall.sh` — stack domain block: PyPI (`pypi.org`,
  `files.pythonhosted.org` — the only hosts `uv sync`/`uv add` contact), npm
  (`registry.npmjs.org`), `ui.shadcn.com`, VS Code marketplace domains, and
  `api.osv.dev` (owasp-* skills). The source project omits `api.osv.dev` —
  it doesn't use those skills — but the seed's baseline firewall expects it,
  so it's added back here.
- `.env.example` — `POSTGRES_PASSWORD`/`POSTGRES_USER`/`POSTGRES_DB`; copy to
  `.devcontainer/.env` and fill. No separate connection-string key: `shell-env`
  builds `DATABASE_URL` from these at shell start, so nothing to duplicate.

Project-specific values still inside these files: `<project>` (compose name,
`.env.example`'s `POSTGRES_DB`) and `TZ` (`Pacific/Auckland`). Replace them
when instantiating.

## Backend dependencies (reference, not merged)

The source project's `backend/pyproject.toml` pins: `fastapi`, `sqlalchemy[asyncio]`,
`asyncpg`, `alembic`, `pydantic-settings`, `uvicorn[standard]`; dev group:
`pytest`, `pytest-asyncio`, `httpx`, `ruff`. Not copied here — `examples/`
holds dev-container config, not application dependencies — but useful as a
known-good starting set for a new FastAPI + async SQLAlchemy backend.
