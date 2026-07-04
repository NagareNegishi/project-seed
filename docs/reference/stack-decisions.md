# Stack Decisions — Production Build

> **⚠️ IMPORTANT: AWS pricing and free tier models change frequently.**
> This document was verified against live AWS pricing on **20 March 2026**.
> The old 12-month free tier (750 hrs EC2, 750 hrs RDS, 500MB ECR) was **discontinued on 15 July 2025** for new accounts.
> **Before acting on any AWS information in this document, verify it against the current AWS Free Tier page (https://aws.amazon.com/free/) and the relevant service pricing pages.** Do not rely on cached knowledge, AI suggestions, or older guides — the model changed fundamentally in mid-2025.

## Context

Working through the production build plan (`docs/Production build plan.md`).
- Step 1 (Auth) — done. JWT self-hosted, ASP.NET Identity, httpOnly refresh cookie.
- Step 2 (Dockerfiles) — stack decisions locked, implementation in progress.

---

## AWS Free Tier Model (New Accounts — Post 15 July 2025)

**This is a credit-based system, NOT the old hourly-allowance model.**

| Detail | Value |
|---|---|
| Sign-up credits | $100 USD immediately |
| Earn-able credits | Up to $100 more (complete 5 onboarding activities: EC2, RDS, Lambda, Bedrock, Budgets) |
| Total credits | Up to $200 USD |
| Credit expiry | 12 months from account creation |
| Free plan duration | 6 months OR when credits run out — whichever comes first |
| Free plan expiry | Account is closed. 90-day grace period to upgrade to paid, then data is permanently deleted |
| Always-free services | 30+ services with monthly limits (S3 5GB, Lambda 1M invocations, etc.) — these persist on paid plan too |
| Free plan restrictions | Some high-consumption services blocked (Aurora, large instance types, Marketplace). EC2 limited to small types (t3.micro, t3.small, t4g.micro, t4g.small, c7i-flex.large, m7i-flex.large). **t2.micro is NOT available on post-July 2025 free plan** |
| RDS on free plan | PostgreSQL, MySQL, MariaDB, SQL Server available. Aurora NOT available. Small instance types only. **Easy create flow uses `db.t4g.micro` not `db.t3.micro`** |

**Strategy:** Start on free plan → complete all 5 onboarding activities immediately for full $200 → upgrade to paid plan around month 4-5 → remaining credits carry over and apply to bills until 12-month expiry.

**⚠️ NEVER create an AWS Organization on a free plan account — credits expire immediately and account is forced to paid plan.**

---

## Decisions Locked

| Area | Decision | Notes |
|---|---|---|
| File storage | AWS S3 Standard (Account Regional namespace) | CV storage via signed URLs, S3-compatible SDK (`AWSSDK.S3`), ~$0.023/GB/month. Account Regional namespace (new March 2026) — bucket names unique per account+region, not globally |
| S3 egress | Free up to 100GB/mo | Permanent for all AWS accounts — aggregated across all services and regions |
| Backend Dockerfile | Multi-stage: `dotnet/sdk:10.0` → `dotnet/aspnet:10.0` | Compiler excluded from final image. **Verify .NET version matches your actual project SDK** |
| Frontend Dockerfile | Multi-stage: `node:lts` → `nginx:alpine` | Vite builds `dist/`, Nginx serves static files |
| Hosting platform | AWS (EC2 + RDS + S3) | Full AWS ecosystem, region: `ap-southeast-2` (Sydney) |
| EC2 instance | `t3.micro` (2 vCPU, 1GB RAM) | **Not t2.micro** — t2.micro is unavailable on post-July 2025 free plan. t3.micro runs in Unlimited mode by default (potential CPU credit charges if sustained high CPU) |
| Database | AWS RDS PostgreSQL `db.t4g.micro` | **Not db.t3.micro** — Easy create on free plan defaults to t4g.micro (ARM/Graviton). ~$0.029/hr. Costs deducted from credits |
| Domain | Subdomain of existing portfolio site (Namecheap) | A record pointing to Elastic IP, TTL automatic |
| SSL/HTTPS | Certbot + Let's Encrypt on EC2 | Free, Nginx handles SSL termination, Elastic IP keeps DNS stable |
| API Routing | Nginx reverse proxy | `/api/*` proxied to backend container (internal HTTP), everything else serves static React files. One origin, no CORS needed. `try_files` for SPA client-side routing |
| Container Registry | AWS ECR (private) | Storage at $0.10/GB/month, deducted from credits. Same-region pulls to EC2 are free (no data transfer cost) |
| Secrets Management | GitHub Actions secrets, injected at deploy time | Common CI/CD pattern, no cost, secrets never stored on server |
| Database Migrations | CI/CD step (GitHub Actions) | Runs before new container starts, failed migration stops deploy, old container stays up |
| Build strategy | Build in GitHub Actions, push to ECR, pull on EC2 | Keeps t3.micro resources free for running the app — builds use GitHub's 7GB RAM runners for free |

---

## Estimated Monthly Cost

All costs come out of the $200 credit pool until credits are exhausted.

| Service | Monthly cost |
|---|---|
| EC2 t3.micro (24/7) | ~$9-10 |
| RDS db.t4g.micro (24/7) | ~$13-15 |
| EBS storage (20GB gp3) | ~$2 |
| S3 (minimal CV storage) | ~$0.10 |
| ECR (two small images, ~200MB) | ~$0.05 |
| Elastic IP (attached to running instance) | $0 |
| Data transfer out (under 100GB) | $0 |
| **Total** | **~$25-28/month** |

**Runway:** $200 credits ÷ ~$27/month ≈ **7-8 months** of runway — but free plan closes at 6 months. Upgrade to paid before month 6, remaining credits continue applying.

---

## All Decisions Locked

Ready to proceed to implementation.

---

## AWS Setup Checklist

Do this before writing any code. Use the AWS Console in a browser.

### 0. Create AWS Account + Secure It
- Go to `https://aws.amazon.com` → Create an AWS Account
- Choose **Free plan** at sign-up
- After creation: enable MFA on root account immediately (IAM → Security credentials → Assign MFA device)
- Set up a **cost budget** via AWS Budgets (this is one of the 5 activities that earns bonus credits)
- Enable **Free Tier usage alerts** and **CloudWatch billing alerts** in Billing → Billing preferences → Alert preferences

### 1. Complete Onboarding Activities (Earn Extra $100)
- These show up in the "Explore AWS" widget on the Console home page
- Complete all 5: EC2 launch, RDS creation, Lambda function, Bedrock prompt, Budget creation
- Most take a few minutes. RDS creation/deletion takes ~20-30 minutes
- You'll do EC2 and RDS as part of setup anyway — just make sure to do them via the widget

### 2. IAM — Create a deploy user
- Go to **IAM → Users → Create user**
- Name: `jobtracker-deploy`
- **Do NOT** check "Provide user access to the AWS Management Console" — this user is for GitHub Actions only
- Attach policies directly:
  - `AmazonS3FullAccess`
  - `AmazonEC2ContainerRegistryFullAccess`
- After creation: **Security credentials → Create access key** → use case: "Application running outside AWS"
- Add a description tag like `GitHub Actions CI/CD - build and deploy jobtracker`
- **Save the Access Key ID and Secret Access Key** — shown once only
- These go into GitHub Actions secrets later

### 3. S3 — Create a bucket
- Go to **S3 → Create bucket**
- **Bucket namespace: Account Regional namespace** (new March 2026 — names only need to be unique within your account+region, not globally. AWS appends your account suffix automatically)
- Name prefix: `jobtracker-documents` (full name will include account suffix)
- Region: **ap-southeast-2 (Sydney)** — must match EC2 region
- Block all public access: **ON** (files served via signed URLs from backend, not public)
- Tags, versioning, encryption: leave defaults
- Note down: **full bucket name** (including the account regional suffix)

### 4. ECR — Create two repositories
- Go to **ECR → Repositories → Create repository**
- Visibility: **Private**
- Image tag mutability: **Mutable** (allows overwriting `latest` tag on each deploy)
- Encryption: **AES-256** (free, automatic)
- Create two:
  - `jobtracker-backend`
  - `jobtracker-frontend`
- Note down the **registry URI** (e.g. `123456789.dkr.ecr.ap-southeast-2.amazonaws.com`)
- Set up a **lifecycle policy** on each repo to keep only the last 5-10 images (prevents storage accumulation)

### 5. RDS — Create a PostgreSQL instance
- Go to **RDS → Create database**
- Creation method: **Easy create**
- Engine: **PostgreSQL** (version 17.x)
- Configuration: **Free tier** → gives `db.t4g.micro` (2 vCPU, 1GB RAM, 20GB)
- DB instance identifier: `jobtracker-db`
- Master username: `postgres`
- Credentials management: **Self managed**
- Set your own master password, **save it immediately**
- EC2 connection: **Don't connect to an EC2 compute resource** (done separately in step 9)
- After creation, **Modify** the instance to disable:
  - Performance Insights → **No**
  - Enhanced Monitoring → **No**
  - Apply immediately
- Note down: **endpoint hostname** (in Connectivity & security section, looks like `jobtracker-db.xxxx.ap-southeast-2.rds.amazonaws.com`)
- **Easy create does NOT create a database inside the instance** — you must create it manually via SSH (see step 10)

### 6. EC2 — Launch an instance
- Go to **EC2 → Launch instance**
- Name: `jobtracker-server`
- AMI: **Ubuntu 24.04 LTS** (x86, 64-bit — not ARM)
- Instance type: **`t3.micro`** (not t2.micro — t2.micro is unavailable on post-July 2025 free plan)
- Key pair: create new → `jobtracker-key` → type RSA, format **.pem** → download, **keep it safe**
- Network settings → Edit:
  - VPC: default VPC
  - **Subnet: pick one in `ap-southeast-2a`** (or whichever AZ your RDS is in — must match to avoid cross-AZ charges)
  - Auto-assign public IP: **Enable**
  - Create security group: `jobtracker-server-sg`
  - Inbound rules:
    - SSH (port 22) — Source: **My IP** (not Anywhere)
    - HTTP (port 80) — Source: Anywhere
    - HTTPS (port 443) — Source: Anywhere
- **⚠️ Deploy note (changed for CI/CD):** SSH source was changed from My IP to `0.0.0.0/0` to allow GitHub Actions runners (dynamic IPs). Key-only auth means this is safe in practice, but consider tightening later (e.g. AWS SSM Session Manager removes the need for port 22 entirely — see notes above step).
- Storage: **20 GB gp3** (default 8GB is too small for Docker)
- Advanced details:
  - Termination protection: **Enable**
  - Credit specification: **Standard** (or Unlimited — Standard avoids surprise CPU credit charges)
  - Leave everything else as default
- Launch

### 7. Elastic IP — Attach a static IP
- Go to **EC2 → Elastic IPs → Allocate Elastic IP address**
- After allocating: **Actions → Associate Elastic IP address** → select your `jobtracker-server` instance
- Leave Private IP address blank (auto-fills)
- Reassociation: leave unchecked
- Note down the **Elastic IP address**
- **Warning:** Elastic IP is free ONLY while attached to a running instance. If you stop the instance but keep the IP allocated, you'll be charged ~$3.60/month. Release the IP if you stop the instance for an extended period.

### 8. DNS — Point your subdomain at EC2
- Go to **Namecheap → Domain List → Manage → Advanced DNS**
- Add new record:
  - Type: **A Record**
  - Host: `jobtracker` (creates `jobtracker.yourdomain.com`)
  - Value: your Elastic IP
  - TTL: **Automatic**
- DNS propagation takes up to 30 min — do this step early

### 9. RDS-EC2 Connection — Allow EC2 to connect
- Go to **RDS → Databases → jobtracker-db → Actions → Set up EC2 connection**
- Select your `jobtracker-server` EC2 instance
- AWS automatically creates security groups (`rds-ec2-1` and `ec2-rds-1`) linking them
- **Important:** Ensure EC2 and RDS are in the **same availability zone** to avoid cross-AZ data transfer charges ($0.01/GB). If they're in different AZs, recreate EC2 in the correct AZ subnet before setting up the connection.

### 10. Create the `jobtracker` database inside RDS
Easy create does not set an initial database name. Create it manually:
- SSH into EC2: `ssh -i jobtracker-key.pem ubuntu@YOUR_ELASTIC_IP`
- Install PostgreSQL client: `sudo apt update && sudo apt install -y postgresql-client`
- Connect to RDS: `psql -h YOUR_RDS_ENDPOINT -U postgres -p 5432`
- Enter your master password when prompted
- Run: `CREATE DATABASE jobtracker;`
- Verify with `\l` (lists all databases)
- Exit: `\q` then `exit`

---

## Cost Controls

| Control | How |
|---|---|
| Monthly cost budget | AWS Budgets — $30 threshold, email alerts |
| Zero spend budget | AWS Budgets — alerts on any charge beyond credits |
| Free Tier usage alerts | Billing → Billing preferences → Alert preferences |
| CloudWatch billing alerts | Billing → Billing preferences → Alert preferences |
| Credit balance monitoring | Billing → Credits — check remaining balance regularly |
| **Never create AWS Organization** | Credits expire immediately if you do |

---

## Values to Collect (needed for GitHub Actions secrets later)

| Secret name | Where to get it |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | `ap-southeast-2` |
| `ECR_REGISTRY` | ECR registry URI |
| `S3_BUCKET_NAME` | S3 bucket full name (including account regional suffix) |
| `DB_CONNECTION_STRING` | `Host=ENDPOINT;Port=5432;Database=jobtracker;Username=postgres;Password=YOURPASSWORD` |
| `EC2_HOST` | Elastic IP |
| `EC2_SSH_KEY` | Contents of `.pem` file |
| `JWT_SECRET` | Generate a long random string |

---

## Architecture Overview

```
User Browser
    │ (HTTPS)
    ▼
┌─── EC2 Instance (t3.micro) ──────────────────────┐
│                                                    │
│   Nginx Container                                  │
│   ├── / → serves React static files (dist/)        │
│   ├── /api/* → proxy to backend (internal HTTP)    │
│   └── SSL termination (Let's Encrypt)              │
│                                                    │
│   ASP.NET Backend Container                        │
│   ├── NOT exposed to outside                       │
│   ├── Only reachable via Nginx on Docker network   │
│   └── Connects to RDS + S3                         │
│                                                    │
│   Docker Compose (orchestrates both containers)    │
└───────────────────────────────────────────────────┘
         │                        │
         │ (internal, port 5432)  │ (HTTPS, AWS SDK)
         ▼                        ▼
    RDS PostgreSQL              S3 Bucket
    (db.t4g.micro)          (signed URL access)
    ap-southeast-2a         Account Regional namespace
```

**Key networking points:**
- Backend container publishes NO ports to the host — only accessible via Docker's internal network
- All browser traffic arrives over HTTPS to Nginx
- Nginx → backend hop is plain HTTP (never leaves the machine, zero security concern)
- `try_files $uri $uri/ /index.html` in Nginx config ensures SPA client-side routing works (direct URL visits, page refresh, bookmarks all serve index.html → React Router handles the path)
- EC2 and RDS in the same AZ (`ap-southeast-2a`) to avoid cross-AZ transfer costs

---

## Implementation Steps (after AWS setup)

1. Refactor file storage: replace `Storage:UploadsPath` local writes with `AWSSDK.S3` calls (one service class)
2. Write `Dockerfile` for backend
3. Write `Dockerfile` for frontend + `nginx.conf`
4. Write `compose.prod.yml`
5. Write `appsettings.Production.json`
6. Write GitHub Actions workflow (build → push to ECR → deploy to EC2)
