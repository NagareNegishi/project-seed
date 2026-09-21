#!/usr/bin/env bash
# PreToolUse hook - total git fence, wired via frontmatter into `implementer` only.
#
# An agent's "never run git" rule is prompt-only until this hook enforces it. It denies
# any Bash command that invokes git.
#
# Why total, where the debugger and the two testers get the read-only fence instead: the
# implementer's worktree prunes the test dirs from the working tree with sparse-checkout,
# but it branches off the base ref and shares the object store, so `git show HEAD:<test>`
# would hand back the suite the pruning exists to hide. Read-only git is not read-only
# enough here. Agents with a full checkout have nothing hidden to reach for.
#
# The worktree does not make this redundant: it bounds the working tree, the fence bounds
# the shared refs and object store. Neither substitutes for the other.
#
# Posture per path: strict on a git invocation the scan reaches; closed (exit 2) when jq
# is missing or the payload will not parse, since a silently absent fence is worse than a
# stopped agent; blind to indirection ($VAR, wrapper scripts, aliases).
# Design: build-orchestration/SKILL.md "Isolate every Bash agent".
#
# Patched locally: the segment-start-only walk below originally missed a git call behind
# a leading I/O redirection (`2>/dev/null git status` reached exit 0 unblocked) — the same
# gap fixed in git-readonly-jail.sh. Fixed the same way: a redirection clause (operator
# alone or fused to its target, including `>&`/`<&` fd-dup) is another prefix to step
# past. Verified against the same battery as git-readonly-jail.sh before landing.

set -uo pipefail

# The deny below needs jq to build its JSON, so this branch blocks the jq-free way.
# Unguarded, an absent jq left $tool empty and the Bash check took the allow branch, so
# every git command ran with no fence and no signal.
if ! command -v jq >/dev/null 2>&1; then
  echo "no-git-jail: jq not found, cannot check the command - failing closed, blocked." >&2
  exit 2
fi

# Pull the tool name and command string from the payload the harness pipes in on stdin.
payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Wired to a Bash matcher, so an empty tool name means a payload that would not parse.
if [[ -z "$tool" ]]; then
  echo "no-git-jail: unparseable payload on a Bash matcher - failing closed, blocked." >&2
  exit 2
fi
# Only Bash can run git; every other tool passes straight through (exit 0 = allow).
[[ "$tool" == "Bash" ]] || exit 0

# Splice backslash-newline first: bash rejoins the pair before running the command, so
# `gi\<newline>t push` is one invocation and must be scanned as one line.
spliced=$(printf '%s' "$command" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\\n//g')

# Drop comments, then quotes and escapes: "git" and \git are the same command to bash.
stripped=$(printf '%s\n' "$spliced" | sed 's/#.*$//' | tr -d '"'\''\\')

# One segment per command position. Matching `git` anywhere in the command denied
# ordinary work - `rg git src/` and `ls vendor/git tmp` both tripped it - while quoted
# and escaped spellings slipped past. Splitting keeps $( ) contents as their own segment.
# `<`/`>` are deliberately NOT split points: a redirection does not start a new command,
# and splitting on it strands a trailing `git` with nothing recognizable in front of it.
# A `&` fused to `<`/`>` (fd-dup: `>&2`, `2>&1`, `<&-`) is protected first, same reason.
protected=$(printf '%s\n' "$stripped" | sed -E 's/([<>])&/\1AMPERSAND/g')
mapfile -t segments < <(printf '%s\n' "$protected" | sed 's/[;&|()`$]/\n/g')

for seg in "${segments[@]}"; do
  read -ra toks <<< "$seg"
  ((${#toks[@]})) || continue

  # step past leading assignments, shell keywords, wrapper prefixes (xargs git push), and
  # I/O redirections (operator alone or fused to its target). None of these change which
  # command bash actually runs, so skipping them cannot hide a git invocation.
  k=0
  while ((k < ${#toks[@]})); do
    case "${toks[k]}" in
      *=*|env|sudo|time|nohup|command|exec|xargs|nice|stdbuf|if|then|else|elif|do|while|until|for|!|{|}) ((k++));;
      *)
        if [[ "${toks[k]}" =~ ^[0-9]*(\<\>|\>\>|\>|\<)(AMPERSAND[0-9-]+)?.*$ ]]; then
          bare="${toks[k]}"
          ((k++))
          [[ "$bare" =~ ^[0-9]*(\<\>|\>\>|\>|\<)$ ]] && ((k < ${#toks[@]})) && ((k++))
        else
          break
        fi
        ;;
    esac
  done
  ((k < ${#toks[@]})) || continue
  [[ "${toks[k]}" == "git" || "${toks[k]}" == */git ]] || continue

  # permissionDecision "deny" is what blocks the call; the reason reaches the agent.
  jq -n --arg r "git is not available to you, and this command invokes it, so it is blocked by no-git-jail.sh. Work from the files you were given, not from history: read them directly and build or run the suite with the project's own commands. Anything needing git, including inspecting history, belongs to whoever spawned you. If a blocked command is the only way forward, name it under Open in your report rather than working around it." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
  exit 0
done
exit 0
