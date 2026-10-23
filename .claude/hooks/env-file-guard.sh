#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): env file guard.
# permissions.deny Read(...) rules only cover the Read tool, so `cat .env` or `grep KEY .env`
# in Bash got around them. Deny any Bash command that names a file holding secrets.
# No escape marker: the user reads or edits these files themselves.
#
# Matches on the raw payload with grep, so it still works when jq is absent.

payload=$(cat)

# Templates carry no secrets; drop them before matching.
scrubbed=$(printf '%s' "$payload" | sed -E 's/\.env\.example//g; s/appsettings\.[[:alnum:]_.-]*\.example\.json//g')

pattern='(^|[^[:alnum:]_])\.env(\.[[:alnum:]_.-]+)?([^[:alnum:]_.-]|$)|appsettings\.[[:alnum:]_-]+\.json|creds\.json|/etc/secrets|docker-compose\.override\.yml'

printf '%s' "$scrubbed" | grep -qE "$pattern" || exit 0

reason="env file guard: this command touches a file that holds secrets (.env*, appsettings.<Env>.json, creds.json, /etc/secrets). Do not read it by any route. Ask the user to supply or edit the value themselves."
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$reason"
exit 0
