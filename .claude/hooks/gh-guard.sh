#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): GitHub CLI allowlist guard.
# Default-deny. Ten (group, verb) pairs may run with args:
#   pr create|edit|list      issue create|edit|view
#   label create|edit|list   repo view
# Plus one exact form with no flags or args: a bare `issue list`.
#
# Fails open when jq is absent: this hook sits on the bare Bash matcher, so a
# fail-closed exit would block every command in the repo, and the residual is a
# permission prompt rather than execution.
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

command -v jq >/dev/null 2>&1 || exit 0

cmd=$(jq -r '.tool_input.command // ""')

# Join backslash-newline continuations first, deleting them as bash does. Without
# this a wrapped command is judged one physical line at a time, and a line holding
# the CLI name without its verb pair is denied - which is exactly the shape
# pr-publish tells the agent to write.
cmd=$(printf '%s' "$cmd" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\\n//g')

# An invocation: the CLI name at a word boundary, then whitespace or end. Unlike
# the previous class this admits `/` and `.` as leading characters, so a
# path-qualified `/usr/bin/...` is judged too.
present='(^|[^[:alnum:]_-])gh([[:space:]]|$)'

# An allowed invocation, anchored at segment start: the name, then optional global
# flags (each dash option may carry one separate value token, so `-R owner/repo
# issue create` resolves to `issue create`), then exactly one permitted pair.
# The anchor is what stops a permitted pair appearing later in the segment - in a
# comment, a title, or a quoted body - from whitelisting a denied call before it.
# Trade-off: the CLI behind `xargs`/`env` no longer counts as allowed. No skill
# uses that shape.
allowed='^[[:space:]]*gh([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+(pr[[:space:]]+(create|edit|list)|issue[[:space:]]+(create|edit|view)|label[[:space:]]+(create|edit|list)|repo[[:space:]]+view)([[:space:]]|$)'

# An exact bare `issue list`, no flags or args, kept separate from the pairs above
# because those allow trailing args. What this achieves is narrow: issue listing
# stays open-issues-and-titles, and there is no bulk body dump in one call. It does
# not make issue text unreachable - `issue view <n>` and `pr list` both take
# arbitrary flags, so bodies are still reachable one pair over.
issue_list='^[[:space:]]*gh[[:space:]]+issue[[:space:]]+list[[:space:]]*\)?[[:space:]]*$'

# Split at shell separators so each call is judged on its own; a call inside
# $(...) or backticks is split out the same way.
segments=$(printf '%s' "$cmd" | sed -E 's/(&&|\|\||;|\||`|\$\(|&)/\n/g')

deny=0
while IFS= read -r seg; do
  if printf '%s' "$seg" | grep -qE "$present"; then
    if ! printf '%s' "$seg" | grep -qE "$allowed" && ! printf '%s' "$seg" | grep -qE "$issue_list"; then
      deny=1
      break
    fi
  fi
done <<EOF
$segments
EOF

if [ "$deny" = 1 ]; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"GitHub CLI allowlist: only these pairs may run, with args - pr create|edit|list, issue create|edit|view, label create|edit|list, repo view - plus a bare issue list with no flags or args. Every other subcommand, group, extension, and alias is denied. If the CLI name is message or file text rather than a command, reword it and retry. If you genuinely need a denied form, ask the user."}}
JSON
fi
