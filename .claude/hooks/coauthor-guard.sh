#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): co-author guard.
# Deny any Bash command that would put a Co-Authored-By trailer or a Claude
# author identity into git history. Policy, references, known limits, and
# verification commands: docs/permissions/v3-no-coauthor.md
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

cmd=$(jq -r '.tool_input.command // ""')

# Case-insensitive, anywhere in the command string — not just git invocations,
# so staging a trailer into a file for `git commit -F` is also caught.
# Matches the trailer key and the Claude author identity (--author overrides).
if printf '%s' "$cmd" | grep -qiE 'co-authored-by|noreply@anthropic\.com'; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Attribution policy: Claude must never appear as author, co-author, or contributor in git history. Remove the Co-Authored-By trailer / Claude author identity and retry. See CLAUDE.md (Attribution) and docs/permissions/v3-no-coauthor.md"}}
JSON
fi
