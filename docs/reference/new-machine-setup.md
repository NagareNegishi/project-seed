# New Machine Setup Guide

Prerequisites: VS Code, Docker, Git, Dev Containers extension.

## 1. Fix Git Line Endings

Windows git often defaults to `core.autocrlf=true` at the system level, which converts shell scripts to CRLF on checkout. This breaks any `.sh` file inside the Linux container — the shebang `#!/bin/bash\r` is interpreted as a missing interpreter, producing `unable to execute ... No such file or directory`.

```powershell
# Check current settings
git config --global core.autocrlf
git config --system core.autocrlf

# Set global to 'input' (converts CRLF→LF on commit, no conversion on checkout)
git config --global core.autocrlf input
```

After cloning the repo (or if already cloned), force re-checkout to restore LF endings:

```powershell
git checkout -- .devcontainer/project-firewall.sh
```

Verify the fix:

```powershell
(Get-Content .devcontainer/project-firewall.sh -Raw) -match "`r`n"
# Should return False
```

## 2. Populate the Claude Credentials Volume

The dev container mounts a Docker volume called `claude-credentials` at `/home/vscode/.claude`. This volume must exist and have correct ownership before the container starts, otherwise `postCreateCommand` fails with exit code 2.

### Get credentials (via WSL)

```bash
curl -fsSL https://claude.ai/install.sh | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
claude
# Press c to copy the URL, paste into browser, paste auth code back
cat ~/.claude/.credentials.json
# Save this JSON somewhere safe
```

Clean up the WSL install:

```bash
rm -rf ~/.claude ~/.local/bin/claude ~/.cache/claude ~/.local/state/claude ~/.local/share/claude ~/.claude.json
```

### Write credentials into the Docker volume

From PowerShell in the project root (with `creds.json` containing your saved credentials):

```powershell
docker run --rm -v claude-credentials:/home/vscode/.claude -v ${PWD}:/tmp/source alpine sh -c "cp /tmp/source/creds.json /home/vscode/.claude/.credentials.json"
docker run --rm -v claude-credentials:/home/vscode/.claude alpine chown -R 1000:1000 /home/vscode/.claude
```

Delete `creds.json` from the project folder immediately after.

## 3. Build the Dev Container

Open the project in VS Code, then `Ctrl+Shift+P` → **Dev Containers: Rebuild Container Without Cache**.
