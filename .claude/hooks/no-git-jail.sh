#!/usr/bin/env bash
# PreToolUse hook — git fence for the implementer (wired via implementer.md frontmatter).
#
# The implementer carries Bash, so its "never run git" rule was prompt-only and
# unenforced. This hook inspects each Bash command and denies any that invokes git,
# keeping the manager the single integration gate (nothing crosses into the branch
# except by the manager's merge). Best-effort: it catches direct invocations, not
# indirect ones ($(...), a wrapper script) — the same Bash seam noted in authoring §13.
# Design: docs/skills/build-orchestration-design-notes.md ("Implementer isolation").
#
# NOTE: verbose comments and a deliberately simple detector for this first pass; the
# detection heuristic and messaging get polished later.

set -uo pipefail

# Read the tool-call payload the harness pipes in on stdin, and pull out the tool name
# and (for Bash) the command string it wants to run.
payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Only Bash can run git; every other tool passes straight through (exit 0 = allow).
[[ "$tool" == "Bash" ]] || exit 0

# Match `git` only when it sits in command position: at the start of the string or
# right after a non-word character (space, ;, &&, |, (, backtick), and followed by
# whitespace or end. This lets through look-alikes like `github`, `mygit`, and a bare
# `.git` path while catching `git ...`, `foo && git ...`, and `env X=1 git ...`.
if printf '%s' "$command" | grep -Eq '(^|[^[:alnum:]_])git([[:space:]]|$)'; then
  # Only permissionDecision "deny" blocks a PreToolUse call; the reason is surfaced to
  # the agent so it knows git is fenced and to hand integration work to the manager.
  jq -n --arg r "git is fenced for the implementer: the manager owns all git and integration. Command blocked by no-git-jail.sh." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
fi
exit 0
