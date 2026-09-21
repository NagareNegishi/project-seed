#!/usr/bin/env bash
# PreToolUse hook - per-subagent path jail (wired via blackbox-tester frontmatter).
# Confines file tools to $CLAUDE_PROJECT_DIR/.agent-scope/: any Read/Edit/Write whose
# resolved target is outside that root is denied, which is what keeps the tester from
# reading the implementation it is meant to write tests without seeing.
# No call log and no mkdir of the root: a deny already reaches Claude and shows in the
# tester's report, and creating the root here would erase the difference between
# "nothing staged" and "staged empty".
# Staging, harvest and clear: build-orchestration/SKILL.md "Spawning rules".
# Why the confinement exists: the hard constraint in .claude/agents/blackbox-tester.md.
# Posture: closed on an out-of-root target AND on a broken payload or missing jq.
# Two mechanisms block a PreToolUse call - exit 2 with a stderr reason, and exit 0 with
# permissionDecision "deny" in JSON. Both reach Claude. exit 2 is used where the block
# must not depend on jq being available to build that JSON.
set -uo pipefail
# Fail closed if the harness didn't inject the project dir: without it there is no jail
# root, so block rather than let the tool through. Must precede the expansion below
# (set -u would abort first, exit 1 = non-blocking = fail-open). Note this branch is
# near-unreachable: the frontmatter command itself expands $CLAUDE_PROJECT_DIR, so an
# unset value makes bash exit 127 on a nonexistent path before this runs. Kept because
# it costs nothing and the wiring could change.
if [[ -z "${CLAUDE_PROJECT_DIR:-}" ]]; then
  echo "agent-scope-jail: CLAUDE_PROJECT_DIR unset - failing closed, tool blocked." >&2
  exit 2
fi
root="$CLAUDE_PROJECT_DIR/.agent-scope"
# jq builds the deny JSON and reads the payload; without it nothing can be checked, so
# block. Unguarded, an absent jq left $tool empty and every call passed unpoliced.
if ! command -v jq >/dev/null 2>&1; then
  echo "agent-scope-jail: jq not found, cannot check the target - failing closed, tool blocked." >&2
  exit 2
fi
payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
target=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')
# This hook is wired to a Read|Edit|Write matcher, so an unrecognised tool name means a
# payload that could not be parsed, not a tool to wave through. Only file-path tools are
# confined here, and that is sound only while the agent's grant stays Read/Write/Edit:
# widening the grant or the matcher (MultiEdit and NotebookEdit carry the target in a
# different field) requires revisiting this.
case "$tool" in
  Read|Edit|Write) ;;
  *) echo "agent-scope-jail: unrecognised tool '$tool' on a Read|Edit|Write matcher - failing closed, tool blocked." >&2
     exit 2 ;;
esac
abs=$(realpath -m -- "$target"); rootabs=$(realpath -m -- "$root")
if [[ "$abs" != "$rootabs" && "$abs" != "$rootabs"/* ]]; then
  jq -n --arg r "Path jail: '$target' is outside .agent-scope/, so it is blocked. You may only read and write under \$CLAUDE_PROJECT_DIR/.agent-scope/ - your manager stages the spec there and harvests your tests from there. If the spec you need is not under that root, stop and report it as a staging gap in your report; do not look for it elsewhere." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
fi
exit 0
