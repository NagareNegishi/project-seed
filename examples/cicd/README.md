# CI/CD examples

Real GitHub Actions workflows from working projects, unmodified except where
each folder's own `README.md` says otherwise. Nothing here is wired into the
seed automatically — copy what a new project needs into its own
`.github/workflows/`, then delete the rest.

| Folder | Source project | What it does |
|---|---|---|
| `dotnet-ec2-ecr/` | Job-Application-Tracker | Test gate + deploy to a self-hosted EC2 box via ECR, with EF Core migrations over an SSH tunnel and a cron cert-renewal job. The concrete implementation `docs/reference/deployment-setup.md` and `Setup pipeline in EC2.md` describe in prose. |
| `dotnet-render/` | kajitor | Same test-gate shape, but deploys to Render (PaaS) instead — no EC2, no ECR, no SSH tunnel. The lighter alternative; see its README for when to pick which. Also includes a reusable scheduled-demo-reset pattern. |
| `tauri-desktop-release/` | job-tracker-desktop | Cross-platform signed installer builds (Windows/macOS/Linux + Flatpak) for a Tauri desktop app, published to a separate releases repo. A different genre from the two above — release engineering, not server deploy. |
| `dependabot.yml` | kajitor / Job-Application-Tracker | Baseline Dependabot config: one `package-ecosystem` block per manifest (devcontainers + your language ecosystem), weekly, ignoring minor/patch bumps. Drop in at repo root, fill in the `<placeholder>` block for your backend. |

`dotnet-ec2-ecr/` and `dotnet-render/` both assume a `pr-checks.yml`-style
test gate feeding into deploy — each folder ships its own copy since they
differ slightly (parallel job split), so you only need one folder, not both.
