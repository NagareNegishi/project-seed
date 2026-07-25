#!/usr/bin/env bash
# PreToolUse hook — per-subagent path jail (wired via blackbox-tester frontmatter).
# Confines file tools to $CLAUDE_PROJECT_DIR/.agent-scope/: any Read/Edit/Write whose
# resolved target is outside that root is denied. Logs every call to $root/.jail.log as
# a firing diagnostic; the load-bearing check is that an out-of-scope target is BLOCKED.
# Mechanism/rationale: docs/agents/review-findings.md "Enforcing tester confinement".
set -uo pipefail
# Fail closed if the harness didn't inject the project dir: without it there is no
# jail root, so block rather than let the tool through. Must precede the expansion
# below (set -u would abort first, exit 1 = non-blocking = fail-open) and must exit 2
# — only exit 2 blocks a PreToolUse call; other codes let it proceed (hooks docs).
if [[ -z "${CLAUDE_PROJECT_DIR:-}" ]]; then
  echo "agent-scope-jail: CLAUDE_PROJECT_DIR unset — failing closed, tool blocked." >&2
  exit 2
fi
root="$CLAUDE_PROJECT_DIR/.agent-scope"
payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
target=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')
mkdir -p "$root"; printf '%s\t%s\t%s\n' "$(date -Is)" "$tool" "$target" >> "$root/.jail.log"
case "$tool" in Read|Edit|Write) ;; *) exit 0 ;; esac   # Bash = known weak seam, out of test scope
abs=$(realpath -m -- "$target"); rootabs=$(realpath -m -- "$root")
if [[ "$abs" != "$rootabs" && "$abs" != "$rootabs"/* ]]; then
  jq -n --arg r "Path jail: $target is outside .agent-scope/. Blocked by agent-scope-jail.sh." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
fi
exit 0
