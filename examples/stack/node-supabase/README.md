# Example: Node + Supabase (Docker-in-Docker)

Dev-container files from a private Node monorepo that runs the Supabase CLI
(`supabase start`) inside the container. Project names are replaced with
`<placeholders>`. Merge the stack-specific parts into the seed's
`.devcontainer/` placeholders:

- `docker-compose.yml` - single `app` service. Mounts only this project (`..:/workspaces/<project>`) instead of all of `/workspaces`, so sibling repos are not visible in the container. Use this mount in any new project for isolation.
- `devcontainer.json` - fragments to copy: the `docker-in-docker` feature (`"moby": false`), ports with labels and `requireLocalPort`, one named volume per package `node_modules`, `setup-node-modules.sh` and the Supabase CLI in `postCreateCommand`, and `SUPABASE_INTERNAL_IMAGE_REGISTRY`. `postStartCommand` runs the firewall from `/usr/local/bin`, as in the seed.
- `project-firewall.sh` - Docker-in-Docker variant. Flushes only INPUT, OUTPUT and `DOCKER-USER`, allows the Docker bridges, applies the allowlist to forwarded traffic, and adds the GitHub `packages` ranges plus the `ghcr.io` and Supabase domains. Works with the seed's `Dockerfile` as is.
- `setup-node-modules.sh` - chowns the root-owned volumes, then runs `npm ci` where a volume is empty. Keep its `dirs` list in step with the mounts.

Placeholders to replace:

- `<project>` - the repo folder name. It must equal the mount target in `docker-compose.yml`.
- `<app-1>`, `<app-2>`, `<app-3>` - app names (port labels, one volume and path).
- `<project-ref>` - your Supabase project ref. The firewall script exits if the domain does not resolve.
- The `platform`, `email-worker` and `email-renderer` package paths, and the pooler host if your region differs.
