# v0 — baseline strict

The policy this project seed shipped with, captured from `.claude/settings.json` on 2026-07-12, before any loosening. Pick this preset when you want Claude to inspect and edit the working tree but never touch git history, branches, or the network without a prompt per command.

## Summary

| Tier | Commands | Effect |
|---|---|---|
| Allow (silent) | `git status`, `git diff *` | run without prompting |
| Ask (prompt each time) | `git add *`, `git commit *` | the prompt is the authorization |
| Deny (cannot even ask) | `git push/pull/fetch`, `git checkout/switch/merge/rebase`, `git reset/clean/stash`, `git branch/tag` | hard-blocked |
| Unlisted | `git log`, `git show`, `git rev-parse`, `git remote -v`, everything else | no rule matches; handled by whatever permission mode the session runs in |

File reads of `.env*`, `appsettings.*.json`, and anything matching `*secret*` are denied regardless of tier.

## Deliberate omissions

- Read-only commands like `git log` and `git show` are not allowlisted.
- No hooks. Branch-level control (for example "commit only off main") is not expressible in permission rules, and this preset does not attempt it.

## Permissions block

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Write(/.comment-audit/processed.json)",
      "Edit(/.comment-audit/processed.json)"
    ],
    "ask": [
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Read(**/.env)",
      "Read(**/.env.local)",
      "Read(**/.env.development)",
      "Read(**/.env.production)",
      "Read(**/.env.staging)",
      "Read(**/.env.test)",
      "Read(**/.env.*.local)",
      "Read(**/appsettings.*.json)",
      "Read(**/*secret*)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git fetch *)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(git reset *)",
      "Bash(git clean *)",
      "Bash(git stash *)",
      "Bash(git branch *)",
      "Bash(git tag *)"
    ]
  }
}
```

The `Write`/`Edit` entries for `.comment-audit/processed.json` are not git policy; they support the comment-audit flow and are kept here only because the block is a verbatim copy.
