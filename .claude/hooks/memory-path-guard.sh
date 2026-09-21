#!/usr/bin/env bash
# PreToolUse hook (matcher: file-writing tools + Bash): memory-location guard.
# CLAUDE.md makes the repo `memory/` dir the only session-memory store, but the
# harness system prompt points at its own auto-memory path. Instructions lose that
# conflict, so the hidden path is denied here instead. Writes into the repo store
# return `ask`: the store is curated, and that prompt is the check before an entry
# lands.
#
# Fails open, unlike agent-scope-jail.sh: a broken toolchain must not block every
# Write in the repo. jq is already a hard dependency of the four sibling guards.
#
# Deny/ask JSON on exit 0 blocks or prompts; silent exit defers to permission rules.
set -uo pipefail

payload=$(cat)
command -v jq >/dev/null 2>&1 || exit 0

emit() {
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
  exit 0
}

deny_msg="memory guard: the repo memory/ store is the only session-memory location (CLAUDE.md). Invoke the 'memory' skill and write there instead."
ask_msg="memory guard: memory/ is curated, not appended to. Confirm the 'memory' skill gate ran - reject list checked, an existing entry reconciled rather than duplicated, stale lines in what you touched fixed."

# Bash reaches the same paths with no file_path. Deny only write-shaped commands so
# `ls`/`grep` against either store still work; `rm` stays allowed, since emptying the
# hidden path is the convention, not a breach of it.
if [[ "$(printf '%s' "$payload" | jq -r '.tool_name // ""')" == "Bash" ]]; then
  cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
  printf '%s' "$cmd" | grep -qE '\.claude/projects/[^[:space:]]*/memory' || exit 0
  printf '%s' "$cmd" | grep -qE '(>|(^|[^[:alnum:]_./-])(tee|cp|mv|touch|mkdir|rsync|install|dd|ln)([[:space:]]|$)|sed[[:space:]]+-i)' || exit 0
  emit deny "$deny_msg"
fi

path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
[[ -z "$path" ]] && exit 0
real=$(realpath -m -- "$path" 2>/dev/null) || exit 0

case "$real" in
  */.claude/projects/*/memory|*/.claude/projects/*/memory/*) emit deny "$deny_msg" ;;
esac

proj="${CLAUDE_PROJECT_DIR:-}"
[[ -z "$proj" ]] && exit 0
store=$(realpath -m -- "$proj/memory")
case "$real" in
  "$store"/*) emit ask "$ask_msg" ;;
esac

exit 0
