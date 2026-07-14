#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): gh allowlist guard.
# Default-deny for the GitHub CLI. Ten (group, verb) pairs may run with args:
#   gh pr create|edit|list    gh issue create|edit|view
#   gh label create|edit|list gh repo view
# Plus one exact form with no flags or args: `gh issue list`.
# Every other gh invocation — any other subcommand, any other group, an
# extension, an alias, a future addition — is denied. Policy, references,
# known limits, and verification commands: docs/permissions/v4-gh-allowlist.md
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

cmd=$(jq -r '.tool_input.command // ""')

# A gh invocation: `gh` at a word boundary, followed by whitespace or end.
gh_present='(^|[^[:alnum:]_./-])gh([[:space:]]|$)'

# An allowed gh invocation: gh, then optional global flags (each dash option may
# carry one separate value token, so `gh -R owner/repo issue create` resolves to
# `issue create`), then exactly one of the ten permitted group+verb pairs.
gh_allowed='(^|[^[:alnum:]_./-])gh([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+(pr[[:space:]]+(create|edit|list)|issue[[:space:]]+(create|edit|view)|label[[:space:]]+(create|edit|list)|repo[[:space:]]+view)([[:space:]]|$)'

# An exact `gh issue list` — no global flags, no args. Kept separate from the
# pairs above (which allow trailing args) so a body/state dump such as
# `gh issue list --json body --state all` stays denied: read-only titles only.
gh_issue_list='(^|[^[:alnum:]_./-])gh[[:space:]]+issue[[:space:]]+list[[:space:]]*$'

# Split at shell separators so each gh call is judged on its own; a gh call
# inside $(...) or backticks is split out the same way.
segments=$(printf '%s' "$cmd" | sed -E 's/(&&|\|\||;|\||`|\$\()/\n/g')

deny=0
while IFS= read -r seg; do
  if printf '%s' "$seg" | grep -qE "$gh_present"; then
    if ! printf '%s' "$seg" | grep -qE "$gh_allowed" && ! printf '%s' "$seg" | grep -qE "$gh_issue_list"; then
      deny=1
      break
    fi
  fi
done <<EOF
$segments
EOF

if [ "$deny" = 1 ]; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"gh allowlist: only these forms may run — gh pr create|edit|list, gh issue create|edit|view, gh label create|edit|list, gh repo view, and bare gh issue list (no flags or args). Every other gh command (other subcommands, other groups, extensions, aliases, gh issue list with any flag) is blocked. See CLAUDE.md and docs/permissions/v4-gh-allowlist.md"}}
JSON
fi
