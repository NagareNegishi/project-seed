#!/usr/bin/env bash
# PreToolUse hook - read-only git fence, wired via frontmatter into `debugger`,
# `whitebox-tester` and `mcdc-tester`: the Bash agents that get a full checkout, so
# history is a legitimate evidence source and nothing is hidden for them to reach for.
# `implementer` is on no-git-jail.sh instead, which says why.
#
# Every git invocation in a Bash command must resolve to a read-only subcommand, or the
# command is denied. Scope is git only: this agent also holds Bash, so sed -i, > and tee
# can still change files. Those are bounded by the throwaway worktree, not by this hook.
# The worktree does not make the fence redundant - `git worktree add` shares the main
# repo's object store and refs, so push, branch -D and reflog expire reach past it.
#
# Posture per path: strict on a subcommand the walk reaches; closed (exit 2) when jq is
# missing or the payload will not parse, since a silently absent fence is worse than a
# stopped agent; blind to indirection ($VAR, wrapper scripts, aliases), same Bash seam
# no-git-jail.sh acknowledges.
# Design: build-orchestration/SKILL.md "Isolate every Bash agent".
#
# Patched locally: the segment-start-only walk below originally missed a git call behind
# a leading I/O redirection (`2>/dev/null git push` reached exit 0 unblocked). Fixed by
# treating a redirection clause — operator alone or fused to its target, including the
# `>&`/`<&` fd-dup form — as another prefix to step past, same as an assignment or
# wrapper command. Verified against a 15-case battery (redirect+write, spaced redirect,
# fd-dup, redirect-after-subcommand, background-job `&` still splitting, quote/comment
# stripping, non-Bash passthrough) before landing.

set -uo pipefail

# Subcommands that only read repo state - no writes to tree, index, refs, or history.
# Dual-mode names (config, tag, branch, stash, reflog, notes) are excluded: their read
# form shares the name with a write form, so the subcommand alone can't prove read-only.
# The plumbing on the second line is the sanctioned substitute for what that exclusion
# costs, so the exclusion costs a change of syntax rather than a loss of capability.
# Space-padded for whole-word membership tests.
readonly_subs=" log show diff status blame grep rev-parse rev-list ls-files ls-tree ls-remote cat-file merge-base describe shortlog whatchanged show-ref name-rev var help version"
readonly_subs+=" for-each-ref show-branch range-diff diff-tree diff-index diff-files check-ignore check-attr count-objects verify-commit cherry "

# Global options that sit between `git` and the subcommand. Those listed here take a
# separate value token (e.g. git -C <path> log), so the token walk skips the next token
# too; attached forms (--git-dir=<path>) are single tokens and need no special case.
opt_takes_arg=" -C -c --git-dir --work-tree --namespace --exec-path "

# deny() needs jq to build its JSON, so this branch blocks the jq-free way: exit 2 with
# the reason on stderr. Unguarded, an absent jq left $tool empty and the check below
# took the allow branch, so every command ran unfenced with no signal.
if ! command -v jq >/dev/null 2>&1; then
  echo "git-readonly-jail: jq not found, cannot check the command - failing closed, blocked." >&2
  exit 2
fi

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# This hook is wired to a Bash matcher, so an empty tool name means a payload that would
# not parse, not another tool. Only a real, different tool name passes through.
if [[ -z "$tool" ]]; then
  echo "git-readonly-jail: unparseable payload on a Bash matcher - failing closed, blocked." >&2
  exit 2
fi
[[ "$tool" == "Bash" ]] || exit 0

deny() {
  jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$r}}'
  exit 0
}

# Splice backslash-newline before anything else: bash rejoins the pair before running the
# command, so the pair is deleted, not turned into a space. Otherwise a wrapped `git log`
# leaves a stray token where the subcommand belongs, and `gi\<newline>t push` hides one.
spliced=$(printf '%s' "$command" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\\n//g')

# Drop comments, then quotes and escapes: "git" and \git are the same command to bash,
# and git "log" the same subcommand. This cannot turn a write into an allowed read, since
# the unquoted spelling is the one bash would run.
stripped=$(printf '%s\n' "$spliced" | sed 's/#.*$//' | tr -d '"'\''\\')

# One segment per command position. Flattening separators to spaces made every token a
# candidate, so `rg git src/` read `src/` as a subcommand and denied. Splitting instead
# keeps $( ) contents as their own segment, so $(git push) is still judged.
# `<`/`>` are deliberately NOT split points: unlike `;`/`&&`/`|`, a redirection does not
# start a new command — `2>/dev/null git push` is one command, and splitting on `>` would
# strand `git push` in a fragment with no `git` token in front of it to walk past.
# A `&` fused to `<`/`>` (fd-dup: `>&2`, `2>&1`, `<&-`) is protected first: it is part of
# the redirection, not the background-job operator, so splitting on it the same way would
# strand the command exactly like an unprotected `<`/`>` would.
protected=$(printf '%s\n' "$stripped" | sed -E 's/([<>])&/\1AMPERSAND/g')
mapfile -t segments < <(printf '%s\n' "$protected" | sed 's/[;&|()`$]/\n/g')

for seg in "${segments[@]}"; do
  read -ra toks <<< "$seg"
  n=${#toks[@]}
  ((n)) || continue

  # step past leading assignments, shell keywords, wrapper prefixes (xargs git push), and
  # I/O redirections (operator alone or fused to its target: `2>/dev/null`, `>&2`, `>>log`,
  # a bare `>`/`<` with the target as a separate following token). None of these change
  # which command bash actually runs, so skipping them cannot hide a git invocation — only
  # unmask one that redirection syntax would otherwise strand mid-segment.
  k=0
  while ((k < n)); do
    case "${toks[k]}" in
      *=*|env|sudo|time|nohup|command|exec|xargs|nice|stdbuf|if|then|else|elif|do|while|until|for|!|{|}) ((k++));;
      *)
        if [[ "${toks[k]}" =~ ^[0-9]*(\<\>|\>\>|\>|\<)(AMPERSAND[0-9-]+)?.*$ ]]; then
          bare="${toks[k]}"
          ((k++))
          [[ "$bare" =~ ^[0-9]*(\<\>|\>\>|\>|\<)$ ]] && ((k < n)) && ((k++))
        else
          break
        fi
        ;;
    esac
  done
  ((k < n)) || continue
  [[ "${toks[k]}" == "git" || "${toks[k]}" == */git ]] || continue

  j=$((k + 1))
  while ((j < n)); do
    o=${toks[j]}
    [[ "$o" == -* ]] || break                        # first non-option token is the subcommand
    [[ "$opt_takes_arg" == *" $o "* ]] && ((j++))     # this option consumes its value token
    ((j++))
  done

  ((j < n)) || continue                               # bare `git` (no subcommand) just prints usage
  sub=${toks[j]}
  [[ "$readonly_subs" == *" $sub "* ]] && continue

  deny "git is read-only for this agent, and \`git $sub\` could not be proven read-only, so it is blocked by git-readonly-jail.sh. Inspection is allowed: log, show, diff, blame, grep, rev-list, for-each-ref, diff-tree, check-ignore and similar. Dual-mode names are blocked because the name alone cannot prove the read form, so use the read-only spelling instead: rev-parse --abbrev-ref HEAD for the current branch, log -g for the reflog, show-ref for tags and branches. Changing refs or the working tree, including checkout and bisect, belongs to whoever spawned you. If a blocked command is the only way forward, name it under Open in your report rather than working around it."
done
exit 0
