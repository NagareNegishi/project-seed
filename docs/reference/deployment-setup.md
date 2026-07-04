# Deployment Setup

Reference for contributors deploying this project. Covers the AWS infrastructure required, secrets configuration, and EC2 setup.

For the pre-launch hardening list, see `production-checklist.md`.

---

## Prerequisites

The following AWS resources must exist before the pipeline can run:

| Resource | Details |
|---|---|
| EC2 instance | Ubuntu, t3.micro or larger. Elastic IP attached. IAM role `<project>_ec2_role` attached (see IAM below). |
| RDS PostgreSQL | `db.t4g.micro` or larger. VPC-only — not internet-accessible. EC2 must be in the same VPC or have access via security group. |
| S3 bucket | For document storage. No public access. |
| ECR repositories | Two repos: `<project>-backend` and `<project>-frontend`. |
| IAM user `<project>-deploy` | Used by GitHub Actions to push images to ECR. Needs `AmazonEC2ContainerRegistryPowerUser` or equivalent. |
| IAM role `<project>_ec2_role` | Attached to EC2. Policies: `AmazonEC2ContainerRegistryReadOnly` + inline `<project>-s3-access` (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` scoped to the app bucket). |
| Domain + DNS | A record pointing to the EC2 elastic IP. |

---

## GitHub Actions Secrets

Add these in: **repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user `<project>-deploy` access key ID |
| `AWS_SECRET_ACCESS_KEY` | IAM user `<project>-deploy` secret access key |
| `ECR_REGISTRY` | ECR registry URI — `{account-id}.dkr.ecr.{region}.amazonaws.com` |
| `EC2_HOST` | EC2 elastic IP address |
| `EC2_SSH_KEY` | Full contents of the EC2 `.pem` key file |
| `RDS_ENDPOINT` | RDS hostname only, no port — used to open the SSH tunnel for migrations |
| `DB_CONNECTION_STRING` | `Host=RDS_ENDPOINT;Port=5432;Database=<project>;Username=postgres;Password=...` |
| `S3_BUCKET_NAME` | Full S3 bucket name |
| `JWT_SECRET` | Long random string, minimum 32 characters |
| `JWT_ISSUER` | `https://yourdomain.com` |
| `JWT_AUDIENCE` | `https://yourdomain.com` |
| `DEMO_RESET_KEY` | *(app-specific example)* Long random string — authorizes a demo-data reset endpoint called by a nightly cron |
| `EMAIL_FROM_ADDRESS` | *(app-specific example)* Sender address for transactional emails — `noreply@yourdomain.com` |
| `RESEND_API_KEY` | *(app-specific example)* Resend API key with Sending access permission only |
| `ANTHROPIC_API_KEY` | *(app-specific example)* Anthropic API key — used by the app's Claude integration |

The last four rows are examples from the source project — trim or extend to match your app's own integrations.

Generate random secrets with:
```
openssl rand -hex 32
```

---

## EC2 Environment

The CI/CD pipeline passes all values via GitHub Actions secrets — no `.env` file is required for automated deploys.

For **manual deploys** (e.g. restarting containers after SSH-ing in directly):

```
cp .env.example /home/ubuntu/app/.env
# fill in real values
```

Then run:
```
cd /home/ubuntu/app
docker compose -f compose.prod.yml up --no-build -d
```

---

## EC2 One-Time Setup

Steps required once when provisioning a new instance:

1. **Docker** — install Docker Engine + Compose plugin
2. **AWS CLI v2** — install via the official installer (apt package unavailable on this Ubuntu version)
3. **App directory** — `mkdir -p /home/ubuntu/app`
4. **IAM role** — attach `<project>_ec2_role` via EC2 console → Actions → Security → Modify IAM role
5. **SSL certificate** — Certbot standalone. See `Ssl tls production setup guide.md` for the full procedure.
