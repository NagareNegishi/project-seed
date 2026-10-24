# Example: .NET + React, deploy to Render

kajitor's real pipeline, unmodified — the lighter alternative to
`dotnet-ec2-ecr/`. Same test-gate shape, but deploy is a PaaS push instead
of self-hosted EC2: no ECR, no SSH tunnel, no server to patch.

- `pr-checks.yml` — same shape as `dotnet-ec2-ecr/`'s: `dotnet test`,
  frontend build/lint/test as separate parallel jobs.
- `deploy.yml` — on push to `main`: `test` → `migrate` (installs
  `dotnet-ef`, runs `dotnet ef database update` straight against Render's
  Postgres over its public URL + SSL, no tunnel needed — Render Postgres is
  internet-reachable) → `release-backend` (one `curl` to Render's deploy
  hook URL; Render handles the actual build and rollout). No separate
  frontend deploy job — Render's own static-site/web-service deploy likely
  handles that outside this workflow.
- `demo-reset.yml` — bonus pattern, not deploy-related: daily cron
  (`workflow_dispatch` too) that calls the app's own API to reset demo data
  and purge unverified accounts. Reusable for any project with a seeded
  demo account: `schedule` + `workflow_dispatch`, `curl` with a secret
  header, `--fail` so a non-2xx response fails the job.

Secrets referenced: `RENDER_DATABASE_URL`, `RENDER_DEPLOY_HOOK_URL`,
`DEMO_RESET_KEY`.

Project-specific values still inside these files: the connection-string key
(`ConnectionStrings__JobTrackerContext`) and the demo API's domain
(`api.kajitor.com`). Replace them when instantiating.

## When to pick this over `dotnet-ec2-ecr/`

Render costs more per month than a bare EC2 instance but removes the EC2
box, ECR repos, SSH tunnel, and cert renewal entirely — less infra to own,
less that can break. Pick EC2/ECR when you need control over the box (custom
networking, cost at scale, existing AWS footprint); pick Render when you'd
rather not run a server at all.
