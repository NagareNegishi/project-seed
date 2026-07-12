#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): fetch guard.
# Allow exactly `git fetch origin main` (the settings.json allow rule runs it);
# hard-deny every other git fetch form. Policy, references, known limits, and
# verification commands: docs/permissions/v2-fetch-origin-main.md
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

cmd=$(jq -r '.tool_input.command // ""')

# Byte-exact match only; spacing variants are deliberately denied below.
if [ "$cmd" = "git fetch origin main" ]; then
  exit 0
fi

# A git invocation whose subcommand is fetch, anywhere in the command string.
# Each dash option between git and fetch may carry one separate argument token
# (`git -C /tmp fetch`). "fetch" as a mere argument does not match
# (`git add fetch.js`), but a quoted literal does (`git commit -m "git fetch"`)
# — accepted trade-off; reword the string and retry.
if printf '%s' "$cmd" | grep -qE '(^|[^[:alnum:]_./-])git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+fetch([[:space:]]|$)'; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Fetch policy: only the exact command `git fetch origin main` is permitted; every other fetch form is blocked. See docs/permissions/v2-fetch-origin-main.md"}}
JSON
fi
