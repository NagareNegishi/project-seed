# OWASP Guard — Setup

## Installation

Copy all skill folders into your Claude Code skills directory:

```
.claude/skills/
├── owasp-guard/
│   ├── SKILL.md
│   ├── references/
│   │   ├── python.md
│   │   ├── javascript.md
│   │   ├── go.md
│   │   ├── java.md
│   │   └── csharp.md
│   └── cache/
│       ├── last_updated.json
│       └── *.md              ← pre-bundled cheat sheets
├── owasp-update/
│   └── SKILL.md
└── owasp-scan/
    └── SKILL.md
```

All folders must be direct siblings under the same parent directory.
`owasp-update` and `owasp-scan` locate the cache via `../owasp-guard/cache/`, so this layout is required.

`owasp-guard` activates automatically on security-relevant code.
`owasp-update` is manual only — run `/owasp-update` to refresh cached cheat sheets.
`owasp-scan` is manual only — run `/owasp-scan` to scan a file on demand.

## Network Requirements

These domains must be reachable from your Claude Code environment for full functionality.

| Domain | Used by | Purpose | Required? | Fallback |
|---|---|---|---|---|
| `raw.githubusercontent.com` | `/owasp-update` | Fetch OWASP cheat sheet content | Yes | None — update cannot proceed without this |
| `api.github.com` | `/owasp-update` | Check if cached sheets are outdated (commit SHA comparison) | Recommended | Falls back to 90-day timestamp check |
| `api.osv.dev` | `owasp-guard` | Verify suggested packages have no known CVEs | Recommended | Falls back to web search |

### How to allow domains

In Claude Code, network access is configured in your project or global settings.
Add the required domains to your allowed list. The exact method depends on your
environment (direct internet, corporate proxy, Claude Code network config).

## Usage

Once installed, `owasp-guard` works automatically. No action needed — it checks
security-relevant code against the OWASP Top 10:2025 as you work.

To refresh the cheat sheet cache:

```
/owasp-update
```

This detects your project's language, checks which sheets are stale, and fetches
only what has changed. If the cache is over 90 days old, `owasp-guard` will
suggest running this command once per session.

## owasp-scan

Scans a single file on demand. Maintains a persistent findings record at
`.claude/owasp-scan/findings.json` — connections between files are tracked
across separate scans so each scan can resolve or contradict previous assumptions.

```
/owasp-scan <file path>
```

Run without arguments to be prompted for a file path.

The findings record is local to your project — commit or exclude it from version
control depending on whether you want findings shared across the team.

---

## Pre-bundling the Cache

To avoid any runtime fetching, you can pre-populate the cache directory with
cheat sheet files before distributing the skill. Place `.md` files from
the OWASP CheatSheetSeries repo into `owasp-guard/cache/` and create a
`last_updated.json` with entries for each file:

```json
{
  "SQL_Injection_Prevention_Cheat_Sheet.md": {
    "commit_sha": null,
    "fetched_at": "2026-04-01T00:00:00Z"
  },
  "Authentication_Cheat_Sheet.md": {
    "commit_sha": null,
    "fetched_at": "2026-04-01T00:00:00Z"
  }
}
```

Set `commit_sha` to `null` if you don't have the GitHub commit SHA —
`/owasp-update` will fill it in on the next run. Set `fetched_at` to the
date you downloaded the files. The guard skill will use these directly.

If you are not pre-bundling, run `/owasp-update` once and check
`last_updated.json` afterwards to verify the format matches the example above.

---

## AI/LLM Security

The OWASP Cheat Sheet Series includes sheets for AI/LLM security that are
not part of the OWASP Top 10:2025 but are relevant if your project integrates
LLMs, AI agents, or MCP:

- `LLM_Prompt_Injection_Prevention_Cheat_Sheet.md`
- `AI_Agent_Security_Cheat_Sheet.md`
- `MCP_Security_Cheat_Sheet.md`

These are not covered by `owasp-guard`. If your project needs them,
either add them to this skill's reference files and checklist, or create
a separate skill using this one as a reference for structure.
