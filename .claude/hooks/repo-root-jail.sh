#!/usr/bin/env bash
# PreToolUse hook (matcher: Write|Edit|MultiEdit|NotebookEdit) - repo-root jail.
# Confines file-writing tools to $CLAUDE_PROJECT_DIR plus this session's scratchpad
# directory: any resolved target outside both is denied. Closes the failure mode from
# a prior session where a file-writing tool call landed outside the repo.
# Posture: closed on a broken payload, missing jq, or unset CLAUDE_PROJECT_DIR - same
# posture as agent-scope-jail.sh, for the same reason (a silent pass-through here is
# worse than a spurious block). realpath resolves symlinks before the check, so a
# symlink planted inside an allowed root that points outside it is still caught.
set -uo pipefail

if [[ -z "${CLAUDE_PROJECT_DIR:-}" ]]; then
  echo "repo-root-jail: CLAUDE_PROJECT_DIR unset - failing closed, tool blocked." >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "repo-root-jail: jq not found, cannot check the target - failing closed, tool blocked." >&2
  exit 2
fi

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')

# MultiEdit carries its target under file_path same as Edit; NotebookEdit under notebook_path.
target=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
if [[ -z "$target" ]]; then
  echo "repo-root-jail: no target path in payload for tool '$tool' - failing closed, tool blocked." >&2
  exit 2
fi

root=$(realpath -m -- "$CLAUDE_PROJECT_DIR")
abs=$(realpath -m -- "$target")

if [[ "$abs" == "$root" || "$abs" == "$root"/* ]]; then
  exit 0
fi

# Session scratchpad: /tmp/claude-<uid>/<sanitized-project-path>/<session-id>/scratchpad.
# The harness directs Claude to use it for temp files that don't belong in the repo, so
# it is the one allowed exception outside $CLAUDE_PROJECT_DIR.
sanitized=$(printf '%s' "$root" | tr '/' '-')
case "$abs" in
  /tmp/claude-*/"$sanitized"/*/scratchpad|/tmp/claude-*/"$sanitized"/*/scratchpad/*) exit 0 ;;
esac

jq -n --arg r "Repo-root jail: '$target' resolves outside $CLAUDE_PROJECT_DIR and outside the session scratchpad, so it is blocked. If this file genuinely needs to change, that belongs to a different task/session, not this one." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
exit 0
