#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): fetch guard.
# Exactly one remote-transfer command form may run - the `allowed=` constant
# below, which the settings.json allow rule also permits. Every other form that
# transfers objects from a remote is hard-denied.
#
# Fails open when jq is absent: this hook sits on the bare Bash matcher, so a
# fail-closed exit would block every command in the repo, and the residual is a
# permission prompt rather than execution.
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

command -v jq >/dev/null 2>&1 || exit 0

# The single permitted form, compared byte-exact against each segment below.
allowed='git fetch origin main'

cmd=$(jq -r '.tool_input.command // ""')

# Join backslash-newline continuations first: grep is line-oriented, so a command
# wrapped across lines matches nothing while the shell still runs it joined.
cmd=$(printf '%s' "$cmd" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\\n//g')

# Judge each subcommand on its own, as gh-guard.sh does. The permission layer
# matches compound commands per segment, so a chain carrying the allowed form
# alongside another permitted command must not be denied as a whole. Splitting at
# `$(` and a backtick also exposes a transfer hidden inside a substitution, which
# the permission layer does not treat as a separator.
segments=$(printf '%s' "$cmd" | sed -E 's/(&&|\|\||;|\||`|\$\(|&)/\n/g')

# git, then optional dash options (each may carry one separate value token), then
# a subcommand that transfers from a remote. The leading class matches
# no-git-jail.sh so a path-qualified `/usr/bin/git` or `./git` is caught too.
xfer='(^|[;&|(`/]|[[:space:]])git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+(fetch|remote[[:space:]]+update)([[:space:]]|$)'

deny=0
while IFS= read -r seg; do
  seg=$(printf '%s' "$seg" | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')
  [ "$seg" = "$allowed" ] && continue
  if printf '%s' "$seg" | grep -qE "$xfer"; then
    deny=1
    break
  fi
done <<EOF
$segments
EOF

if [ "$deny" = 1 ]; then
  jq -n --arg a "$allowed" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:("Transfer policy: only the exact command `" + $a + "` may run; every other command that transfers from a remote is blocked. If this is message or file text rather than a command, reword it and retry (git-commit SKILL.md lists it as banned in message text). If you need remote state, use git ls-remote. For anything else, ask the user.")}}'
fi
