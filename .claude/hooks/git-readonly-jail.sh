#!/usr/bin/env bash
# PreToolUse hook — read-only git fence for a Bash-carrying subagent (wired via the
# agent's frontmatter hooks).
#
# Every git invocation in a Bash command must resolve to a read-only subcommand, or the
# command is denied — the agent can inspect history but not change it. Fail-closed: an
# off-allowlist or unparseable subcommand is blocked. Best-effort against the same Bash
# seam as no-git-jail.sh ($(...), wrapper scripts).
# Design: docs/skills/build-orchestration-design-notes.md ("Bash-agent isolation").

set -uo pipefail

# Subcommands that only read repo state — no writes to tree, index, refs, or history.
# Dual-mode names (config, tag, branch, stash, reflog, notes) are excluded: their read
# form shares the name with a write form, so the subcommand alone can't prove read-only.
# Space-padded for whole-word membership tests.
readonly_subs=" log show diff status blame grep rev-parse rev-list ls-files ls-tree ls-remote cat-file merge-base describe shortlog whatchanged show-ref name-rev var help version "

# Global options that sit between `git` and the subcommand. Those listed here take a
# separate value token (e.g. git -C <path> log), so the token walk skips the next token
# too; attached forms (--git-dir=<path>) are single tokens and need no special case.
opt_takes_arg=" -C -c --git-dir --work-tree --namespace --exec-path "

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Only Bash can run git; every other tool passes straight through (exit 0 = allow).
[[ "$tool" == "Bash" ]] || exit 0

deny() {
  jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
  exit 0
}

# Flatten shell separators to spaces so a whitespace split yields the token stream.
normalized=$(printf '%s' "$command" | tr ';&|()`$<>\n\t' '          ')
read -ra toks <<< "$normalized"

# Walk tokens. At each `git` (bare or reached by path), step past global options to the
# subcommand and check it; the first non-read-only subcommand denies the whole command.
n=${#toks[@]}
for ((i = 0; i < n; i++)); do
  t=${toks[i]}
  [[ "$t" == "git" || "$t" == */git ]] || continue

  j=$((i + 1))
  while ((j < n)); do
    o=${toks[j]}
    [[ "$o" == -* ]] || break                        # first non-option token is the subcommand
    [[ "$opt_takes_arg" == *" $o "* ]] && ((j++))     # this option consumes its value token
    ((j++))
  done

  ((j < n)) || continue                               # bare `git` (no subcommand) just prints usage
  sub=${toks[j]}
  [[ "$readonly_subs" == *" $sub "* ]] && continue

  deny "git is fenced to read-only for this agent: \`git $sub\` changes repo state and is blocked by git-readonly-jail.sh. Inspection subcommands (log, show, diff, blame, …) are allowed; hand any change to whatever spawned it."
done
exit 0
