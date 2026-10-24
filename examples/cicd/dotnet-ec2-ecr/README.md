# Example: .NET + React, deploy to EC2 via ECR

Job-Application-Tracker's real pipeline, unmodified. The concrete
implementation of `docs/reference/deployment-setup.md` and
`docs/reference/Setup pipeline in EC2.md` — those docs describe the AWS
infra and secrets this pipeline needs; this folder is the workflow YAML
itself, which the seed never shipped before now.

- `pr-checks.yml` — gates merges to `main`: `dotnet test`, frontend
  build/lint/test (separate parallel jobs). Job names are registered as
  required checks in `scripts/protect-main.sh`.
- `deploy.yml` — on push to `main`: `test` → `frontend-test` (parallel) →
  `build-push` (Docker images to ECR, via `aws-actions/configure-aws-credentials`
  + `amazon-ecr-login`) → `migrate` (EF Core migrations against RDS over an
  SSH tunnel — RDS is VPC-only, not internet-reachable) → `deploy` (SCPs
  `compose.prod.yml` to EC2, SSHes in, pulls both images, `docker compose up`).
  Each job `needs:` the previous one, so a failure anywhere stops the chain
  before touching production.
- `renew-cert.yml` — monthly cron (`workflow_dispatch` also works): checks
  the Let's Encrypt cert's expiry with `openssl x509 -checkend`, and only if
  it's within 30 days does it stop containers, run `certbot renew`, and
  bring them back up with the same secrets `deploy.yml` uses. Scheduled
  inside the app's nightly maintenance window so a renewal's downtime is
  never user-facing.

Secrets referenced (set these up per `docs/reference/deployment-setup.md`):
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ECR_REGISTRY`, `EC2_HOST`,
`EC2_SSH_KEY`, `RDS_ENDPOINT`, `DB_CONNECTION_STRING`, `S3_BUCKET_NAME`,
`JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `DEMO_RESET_KEY`,
`EMAIL_FROM_ADDRESS`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `ANTHROPIC_API_KEY`.
Drop whichever don't apply to your app.

Project-specific values still inside these files: the backend/frontend
directory names (`JobTrackerApi`, `job-tracker-ui`), the image names
(`jobtracker-backend`, `jobtracker-frontend` — set via `env:` in `deploy.yml`,
read from the `ECR_REGISTRY` secret), and the cert domain in `renew-cert.yml`
(`jobtracker.nagarenegishi.com`). Replace them when instantiating.
