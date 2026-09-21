#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): co-author guard.
# Deny any Bash command that would put Claude attribution into git history: the
# trailer, the generated-with line, an author/committer identity override, or a
# commit whose message is read from a file this scan cannot see.
#
# Scope is Bash only. A message file authored with the Write or Edit tools is out
# of reach here, which is why the file-fed commit forms are denied outright rather
# than trusted.
#
# Fails open when jq is absent: this hook sits on the bare Bash matcher, so a
# fail-closed exit would block every command in the repo, and the residual is a
# permission prompt rather than execution.
#
# Deny JSON on exit 0 blocks the command; silent exit defers to permission rules.

command -v jq >/dev/null 2>&1 || exit 0

# The two banned literals, held as a placeholder: this guard denies any Bash
# command containing them, including the command that rewrites this file.
banned='co-authored-by|noreply@anthropic\.com'

cmd=$(jq -r '.tool_input.command // ""')

# Join backslash-newline continuations first: grep is line-oriented, so a trailer
# wrapped across lines matches nothing while the shell still runs it joined.
cmd=$(printf '%s' "$cmd" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\\n//g')

# Attribution text, anywhere in the command - not just git invocations, so a
# trailer echoed into a file from Bash is caught too.
attribution="$banned|generated with .{0,8}claude code"

# Identity overrides, denied by mechanism whatever value follows: nothing here
# needs to set a git identity, and the user's own is already in ~/.gitconfig.
identity='git[[:space:]]+config[[:space:]]+(--[^[:space:]]+[[:space:]]+)*user\.(name|email)|[[:space:]]-c[[:space:]]*user\.(name|email)=|--author[=[:space:]]|GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)=|(^|[[:space:]])EMAIL='

# A git commit invocation, and a flag that supplies its message from elsewhere.
commit='(^|[^[:alnum:]_./-])git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+commit([[:space:]]|$)'
fromfile='[[:space:]](-F|--file|-t|--template|-C|--reuse-message)([[:space:]]|=)'

reason=""
if printf '%s' "$cmd" | grep -qiE "$attribution"; then
  reason="a co-author trailer or generated-with line"
elif printf '%s' "$cmd" | grep -qiE "$identity"; then
  reason="an author or committer identity override"
elif printf '%s' "$cmd" | grep -qE "$commit" && printf '%s' "$cmd" | grep -qE "$fromfile"; then
  reason="a commit message read from a file, which this guard cannot inspect"
fi

if [ -n "$reason" ]; then
  jq -n --arg r "$reason" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:("Attribution policy: Claude must never appear as author, co-author, or contributor in git history. Blocked: " + $r + ". Write the message inline with repeated -m and let git take the author from ~/.gitconfig. If the banned text is search or file content rather than an attribution being written, use the Read or Grep tools instead of Bash; reading it is not the same as routing around this denial. See .claude/skills/git-commit/SKILL.md (Attribution).")}}'
fi
