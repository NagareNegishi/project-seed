#!/usr/bin/env bash
# PreToolUse hook — git fence for a Bash-carrying subagent (wired via the agent's
# frontmatter hooks).
#
# An agent's "never run git" rule is prompt-only until this hook enforces it. It denies
# any Bash command that invokes git, keeping git in one owner's hands. Best-effort:
# catches direct invocations, not indirect ($(...), a wrapper script) — the Bash seam
# noted in authoring §13.
# Design: docs/skills/build-orchestration-design-notes.md ("Bash-agent isolation").

set -uo pipefail

# Pull the tool name and command string from the payload the harness pipes in on stdin.
payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Only Bash can run git; every other tool passes straight through (exit 0 = allow).
[[ "$tool" == "Bash" ]] || exit 0

# Match `git` only where it can start a command: at the start, after a separator
# (; & | ( backtick), after whitespace, or via a path (/usr/bin/git, ./git), and
# followed by whitespace or end. Skips substrings that can't be a command — `github`,
# `.gitignore`, `src/git/x.ts`.
if printf '%s' "$command" | grep -Eq '(^|[;&|(`/]|[[:space:]])git([[:space:]]|$)'; then
  # permissionDecision "deny" is what blocks the call; the reason reaches the agent.
  jq -n --arg r "git is fenced for this agent: it must not run git — hand integration work to whatever spawned it. Command blocked by no-git-jail.sh." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
fi
exit 0
