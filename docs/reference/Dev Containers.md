# Dev Containers & Claude Code

## Dev Containers

- **Spec & overview:** https://containers.dev
- **VS Code guide:** https://code.visualstudio.com/docs/devcontainers/containers
- **Available templates:** https://containers.dev/templates
- **Available features:** https://containers.dev/features

### Key Concepts

A **dev container** is a Docker container configured specifically for development. It includes the project's code, tools, and dependencies in an isolated environment, defined in a `devcontainer.json` file.

**Docker Desktop** must be running first — it's the engine that runs the container. Dev Containers just orchestrates it.

**`.devcontainer/` creation** — both ways work:
- `Dev Containers: Add Dev Container Configuration Files` generates it interactively (easier first time)
- Manually creating the folder and `devcontainer.json` (more control)

**The Claude Code feature** — adding this to `devcontainer.json`:
```json
"features": {
    "ghcr.io/anthropics/devcontainer-features/claude-code:1.0": {}
}
```

### Example flow for React/TS + C# project

```
1. Docker Desktop running
        ↓
2. Open project in VS Code
        ↓
3. Add .devcontainer/devcontainer.json
   (via command or manually)
        ↓
4. "Reopen in Container"
        ↓
5. Container builds — Node + .NET + Claude Code installed automatically
        ↓
6. Open terminal → run `claude` → authenticate once
        ↓
7. Done — Claude Code is sandboxed in the project environment
        ↓
8. If devcontainer.json is updated (e.g. add a new feature or tool):
   Command Palette → Dev Containers: Rebuild Container
```

**Note:** Every rebuild requires re-authenticating Claude Code. Mount the auth file to persist credentials across rebuilds:
```json
"mounts": [
    "source=claude-config,target=/home/vscode/.claude,type=volume"
]
```
- `source=claude-config` — name for the Docker volume (can be anything)
- `target=/home/vscode/.claude` — depends on the user inside the container
- `type=volume` — stays the same

See `docs/Claude Code — WSL credential extraction.md` for how to inject credentials into this volume.

**Note:** When moving an existing project into a dev container, artifacts need to be rebuilt — the filesystem is Linux, so artifacts built on Windows won't work.

For .NET:
```bash
rm -rf obj bin       # clean old host artifacts
dotnet restore       # restore NuGet packages
dotnet build         # build for container environment
```

For HTTPS (when running with `dotnet run --launch-profile https`), the dev certificate needs to be renewed for the container environment:
```bash
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

For Node:
```bash
rm -rf node_modules  # remove host-built modules
npm install
npm run dev
```

---

## Claude Code

- **Overview:** https://docs.anthropic.com/en/docs/claude-code/overview
- **Setup & installation:** https://docs.anthropic.com/en/docs/claude-code/setup
- **Dev container guide:** https://docs.anthropic.com/en/docs/claude-code/devcontainer
- **GitHub repo** (includes reference devcontainer): https://github.com/anthropics/claude-code

Anthropic publishes an official Dev Container feature: https://github.com/anthropics/devcontainer-features

### Commands

```bash
claude               # start interactive session
claude -p "task"     # one-off task, non-interactive
claude --continue    # continue last session
claude --resume <id> # resume specific session
```

To **stop/exit** — use `Escape` to stop Claude mid-task, then `/exit` to end the session. `Ctrl+C` exits entirely.

**Key slash commands inside a session:**
```
/init     # generate CLAUDE.md for the project
/help     # show all available commands
/clear    # reset context (start fresh task)
/compact  # summarize context to save tokens
/exit     # end session
/model    # switch model (Sonnet/Opus/Haiku)
```

> **⚠️ IMPORTANT:** Keep the `ANTHROPIC_API_KEY` environment variable **unset**. Setting it causes Claude Code to bill via API pay-as-you-go rates instead of the subscription.

---

## Enabling HTTPS in ASP.NET Core inside a Dev Container

Dev containers run Linux, so a dev certificate must be available inside the container.
Reference: https://hub.docker.com/r/microsoft/devcontainers-dotnet

The official Microsoft approach exports the cert from the **host machine** (requires .NET SDK on Windows) and bind-mounts it in. This project uses a different approach: the cert is stored in a Docker volume and generated inside the container — no .NET on Windows required.

### The problem

`dotnet dev-certs` can't automatically trust certificates in Linux containers (without .NET 9+). The fix is to generate or export the cert and mount it in via a Docker volume.

---

### Step 1 — Generate the cert (once per machine)

**Official Microsoft approach** — export from Windows host (requires .NET SDK on Windows):
```powershell
dotnet dev-certs https --trust
dotnet dev-certs https -ep "$env:USERPROFILE/.aspnet/https/aspnetapp.pfx" -p "YourPassword"
```

**This project's approach** — generate inside the container (no .NET on Windows needed):
```bash
dotnet dev-certs https
dotnet dev-certs https -ep ~/.aspnet/https/aspnetapp.pfx -p "YOUR_KESTREL_CERT_PASSWORD"
```

The cert is stored in the `aspnet-https` Docker volume and persists across future rebuilds. No need to repeat unless the volume is deleted.

---

### Step 2 — Mount the cert into the container via `devcontainer.json`

```jsonc
{
    "name": "C# (.NET) and PostgreSQL",
    "dockerComposeFile": "docker-compose.yml",
    "service": "app",
    "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
    "features": {
        "ghcr.io/stu-bell/devcontainer-features/node:0": {}
    },

    // Store dev cert in a Docker volume — persists across rebuilds without needing .NET on Windows
    "mounts": [
        "source=aspnet-https,target=/home/vscode/.aspnet/https,type=volume"
    ],

    // Tell Kestrel where to find the cert and its password
    "remoteEnv": {
        "ASPNETCORE_Kestrel__Certificates__Default__Password": "YourPassword",
        "ASPNETCORE_Kestrel__Certificates__Default__Path": "/home/vscode/.aspnet/https/aspnetapp.pfx"
    },

    "postCreateCommand": {
        "backend": "cd JobTrackerApi && dotnet restore",
        "frontend": "cd job-tracker-ui && npm install"
    }
}
```

**Note:** `devcontainer.json` can't read environment variables at runtime, so the cert password must be hardcoded in `remoteEnv`. Alternatively, set it as a Windows environment variable first:
```powershell
setx KESTREL_CERT_PASSWORD "your-password-here"
```

Then reference it in `devcontainer.json`:
```jsonc
"remoteEnv": {
    "ASPNETCORE_Kestrel__Certificates__Default__Password": "${env:KESTREL_CERT_PASSWORD}",
    "ASPNETCORE_Kestrel__Certificates__Default__Path": "/home/vscode/.aspnet/https/aspnetapp.pfx"
}
```

To verify the password is set:
```powershell
echo $env:KESTREL_CERT_PASSWORD
```

---

### Step 3 — Forward the HTTPS port

Add port forwarding in `devcontainer.json`:
```jsonc
"forwardPorts": [7100, 5286, 5432]
```
