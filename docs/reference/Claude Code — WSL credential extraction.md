## Why This Exists

Claude Code authenticates via a browser-based OAuth flow. Inside a Dev Container,
there is no browser access from within the container, so the standard `claude` auth
command cannot complete. This is a known limitation with no official solution as of
April 2026 — this workaround may become unnecessary if Anthropic adds
container-friendly authentication.

The approach: install Claude Code temporarily in WSL (outside the container),
complete auth there, extract the credentials file, then inject it into the Docker
volume the Dev Container uses.

---

## Claude Code — WSL credential extraction

Go into WSL terminal.

### Install
```bash
curl -fsSL https://claude.ai/install.sh | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

### Auth
```bash
claude
```
- When URL appears, press `c` to copy it
- Paste into Windows browser manually
- Browser shows an authentication code — paste it back into WSL
- Press `Escape` to exit once auth completes

### Save credentials
```bash
cat ~/.claude/.credentials.json
```
**Copy and save that JSON somewhere safe (password manager etc). This is a long-lived refresh token — treat it like a password.**

### Complete removal
```bash
rm -rf ~/.claude ~/.local/bin/claude ~/.cache/claude ~/.local/state/claude ~/.local/share/claude ~/.claude.json
```

### Verify clean
```bash
find ~ -name "*claude*" 2>/dev/null
```
Should return nothing.

---

**When to redo this:** if your saved credentials stop working (refresh token expired or invalidated by Anthropic). In normal use the refresh token lasts a long time, but logging out of claude.ai or changing your password will invalidate it.

## Write fresh credentials into the volume

- Create creds.json in your project folder with the new JSON, then:

(Project root with comand prompt)

```bash
docker run --rm -v claude-credentials:/home/vscode/.claude -v %CD%:/tmp/source alpine sh -c "cp /tmp/source/creds.json /home/vscode/.claude/.credentials.json"
```

- Fix permissions (without this the file is owned by root and the vscode user can't read it):

```bash
docker run --rm -v claude-credentials:/home/vscode/.claude alpine chown -R 1000:1000 /home/vscode/.claude
```

- Remove creds.json from your project folder when done to avoid accidentally committing it.
