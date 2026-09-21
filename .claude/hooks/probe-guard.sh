#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash): probe guard.
# "Read docs before probing" (CLAUDE.md). Route the command shapes that are almost
# always "discover a fact already written down" to a deny, and let a genuine need
# through only after the agent has read the docs AND asked the user in chat.
#
# The decision is never `ask`: an `ask` reason is not rendered in the CLI prompt
# (claude-code#17356), and an `ask` silently overrides permissions.deny
# (claude-code#39344). `deny` is the only decision whose reason reaches the agent,
# so the whole protocol runs through it and consent happens in conversation.
#
# The escalation marker is deliberately published in the deny text. Typing it buys
# nothing: the cited reads and the user's reply are both verified against the
# session transcript, which the agent cannot author.
#
# Fails open when jq is absent or the transcript is unreadable: on the bare Bash
# matcher, failing closed would block every command in the repo.
#
# Patched locally for this repo: the upstream version this was copied from had a
# `psql`/`dotnet ef` schema-introspection classifier and a `doc_roots`/`doc_hint`
# naming `Models/`, `Migrations/` — that project's .NET+Postgres backend, which this
# stack-agnostic seed has no equivalent of. Removed the introspect branch and
# repointed doc_roots/doc_hint at this repo's actual docs (`docs/`, `.devcontainer/`,
# `.github/`, `CLAUDE.md`). Also replaced a hardcoded `/workspaces/noobi/` path-strip
# (that project's absolute root) with one derived from $CLAUDE_PROJECT_DIR, so citing
# an absolute path actually works here. Verified: classifier cases (inline eval,
# node_modules read with/without --exclude, plain grep, the two removed
# dotnet-ef/psql forms now passing through) and the doc_roots strip against both a
# relative and this repo's absolute doc path.

command -v jq >/dev/null 2>&1 || exit 0

# Stdin is a pipe and readable once; every field comes out of this one capture.
payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
transcript=$(printf '%s' "$payload" | jq -r '.transcript_path // ""')

# The marker is a trailing shell comment, inert to bash. An env-var prefix would
# change the command's leading text and break the prefix-matched permissions.allow
# rules, so complying with the guard would cost the agent its auto-allows.
marker=$(printf '%s' "$cmd" | grep -oiE '#[[:space:]]*probe-ok:.*$')
core=$(printf '%s' "$cmd" | sed -E 's/#[[:space:]]*[Pp]robe-[Oo][Kk]:.*$//')

# --- Classifier: run against the marker-stripped command ---------------------
# A cited node_modules path inside the marker would otherwise trip pkg_target and
# make the marker itself look like the probe.

# Leading boundary. Admits `/` and `.` so a path-qualified binary is judged too.
B='(^|[^[:alnum:]_-])'

# A plain reader is a probe only when aimed at a package cache or compiled artefact.
reader="${B}(find|grep|rg|cat|ls|head|tail|less|xxd|hexdump|strings)([[:space:]]|\$)"
pkg_target='(\.nuget|/packages/|node_modules|\.dll|\.pdb)([[:space:]"'\''/]|$)'

# Excluding the cache is the opposite of probing it, and the usual reason to name it.
excluded='(--exclude-dir=|--exclude=|-not[[:space:]]+-path|-prune)'

# Bundled short flags too, so `python -uc` is caught and not just a bare `-c`.
inline_eval="${B}(python3?|node|perl)([[:space:]]+-[^[:space:]]+)*[[:space:]]+(-[a-zA-Z]*[ce]|--eval)([[:space:]]|=|\$)|${B}dotnet[[:space:]]+fsi([[:space:]]|\$)"

# A heredoc, and an interpreter for it to feed. Not covered by inline_eval: the ban is
# on the interpreter, not just on the -c form.
heredoc='(^|[[:space:]])<<-?[[:space:]]*['\''"]?[A-Za-z_]'
interp="${B}(python3?|node|perl)([[:space:]]|\$)|${B}dotnet[[:space:]]+fsi([[:space:]]|\$)"

reason=""
if printf '%s' "$core" | grep -qE "$inline_eval"; then
  reason="an inline script passed with -c, -e or --eval"
elif printf '%s' "$core" | grep -qE "$heredoc" && printf '%s' "$core" | grep -qE "$interp"; then
  reason="a heredoc inspection script"
else
  # Per segment, so a reader and a package path in unrelated halves of a chain are
  # not reported as one probe. This is the only rule that pairs two patterns.
  while IFS= read -r seg; do
    if printf '%s' "$seg" | grep -qE "$reader" \
       && printf '%s' "$seg" | grep -qE "$pkg_target" \
       && ! printf '%s' "$seg" | grep -qE "$excluded"; then
      reason="a read into a package cache or compiled artefact"; break
    fi
  done <<EOF
$(printf '%s' "$core" | sed -E 's/(&&|\|\||\||;|`|\$\(|&)/\n/g')
EOF
fi

[ -n "$reason" ] || exit 0

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

doc_hint='docs/, .devcontainer/, .github/, CLAUDE.md, CI or prior output'

# First attempt at any probe is always a deny carrying the rule, so the agent is
# told before the user is ever involved.
if [ -z "$marker" ]; then
  deny "probe guard: this looks like $reason. CLAUDE.md requires $doc_hint to be read first.
If the answer is genuinely not written down, ask the user in chat and wait for a reply. Keep it to a few lines of plain prose - no bullet lists, no transcript of everything you read: what you are trying to establish, where you looked, what was missing there, and the exact command you want to run.
If they agree, re-issue with a trailing marker: # probe-ok: <one line why> | read: <the doc paths you actually opened, comma separated>"
fi

# Fail open rather than deny-everything if the transcript is not available.
[ -n "$transcript" ] && [ -r "$transcript" ] || exit 0

cited=$(printf '%s' "$marker" | sed -E 's/.*\|[[:space:]]*[Rr][Ee][Aa][Dd]:[[:space:]]*//')
[ "$cited" != "$marker" ] || deny "probe guard: the marker has no 'read:' list. Cite the doc paths you actually opened."

# Only reads under the roots the rule names count. Otherwise one glance at any file
# in the repo would unlock every probe for the rest of the session.
doc_roots='(^|/)(docs|\.devcontainer|\.github)/|(^|/)CLAUDE\.md$'

# Strip a leading `./` or this repo's own absolute root, whichever the agent typed;
# the transcript-`contains` check below works either way, but the doc_roots test
# above only sees the part after this strip.
proj_re=""
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  proj_re=$(printf '%s' "$CLAUDE_PROJECT_DIR" | sed -e 's/[.[\*^$()+?{}|\/]/\\&/g')
  proj_re="|${proj_re}/"
fi
paths=$(printf '%s' "$cited" | sed -E 's@,@\n@g' | sed -E "s@^[[:space:]]*(\\./${proj_re})?@@; s/[[:space:]]+\$//" | grep -v '^$')
printf '%s\n' "$paths" | grep -qE "$doc_roots" \
  || deny "probe guard: none of the cited reads are under $doc_hint. Read the docs that would answer this, then cite those."

cited_json=$(printf '%s\n' "$paths" | grep -E "$doc_roots" | jq -Rn '[inputs]')
core_n=$(printf '%s' "$core" | tr '\n\t' '  ' | tr -s ' ' | sed -E 's/^ +//; s/ +$//')

# Two facts are established here, both from entries the agent cannot forge: whether
# the cited paths appear in a real tool call, and whether a genuine user turn (a
# plain-string user message, not a tool result) landed after the previous attempt.
scan=$(jq -rn --arg core "$core_n" --argjson cited "$cited_json" '
  def norm: gsub("#[ \t]*[Pp]robe-[Oo][Kk]:[^\n]*";"") | gsub("[ \t\n]+";" ") | sub("^ +";"") | sub(" +$";"");
  reduce (foreach inputs as $e (0; .+1; {i:., e:$e})) as $x ({u:0,a:0,found:{}};
    if $x.e.type=="user" and (($x.e.message.content|type)=="string") and (($x.e.isMeta // false)|not)
    then .u = $x.i
    elif $x.e.type=="assistant"
    then reduce ($x.e.message.content[]? | select(.type=="tool_use")) as $t (.;
           (if $t.name=="Bash" and (($t.input.command // "")|norm) == $core then .a = $x.i else . end)
           | (($t.input | [.file_path?, .path?, .command?, .pattern?]
                        | map(select(type=="string")) | join(" ")) as $txt
              | reduce $cited[] as $c (.; if ($txt|contains($c)) then .found[$c] = true else . end)))
    else . end)
  | . as $s | "\($s.u) \($s.a) \([$cited[] | select($s.found[.] == null)] | length)"
' "$transcript" 2>/dev/null)

[ -n "$scan" ] || exit 0
read -r last_user last_attempt missing <<<"$scan"

# The marker cites reads that never happened.
[ "$missing" -eq 0 ] \
  || deny "probe guard: $missing of the cited paths were not opened in this session. Cite only what you actually read."

# No prior denied attempt means the agent never saw the rule and cannot have relayed
# it; an attempt with no user turn after it means nobody consented. Both leave the
# user out of the loop, which is the thing being enforced.
[ "$last_attempt" -gt 0 ] \
  || deny "probe guard: this command has not been attempted before, so the marker cannot reflect a user decision. Drop the marker and re-issue."
[ "$last_user" -gt "$last_attempt" ] \
  || deny "probe guard: the user has not replied since your last attempt. Ask them in chat, in a few lines of plain prose, and wait for an answer before re-issuing."

# Verified: reads happened, user replied after the attempt. Defer to permission rules.
exit 0
