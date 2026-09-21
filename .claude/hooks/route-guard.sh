#!/usr/bin/env bash
# SubagentStop hook - report route/format validator (build-orchestration).
# Blocks a subagent whose final report breaks the route/section contract in
# .claude/hooks/route-spec.json, so it re-emits before the manager consumes it.
# Pure validator, never a converter. Loop-guard: fail open after 2 blocks per
# agent_id (SubagentStop exposes no stop_hook_active), then the manager's
# unroutable-report rule catches it.
# Per-agent sections and route derivation: that agent's "## Report" section in
# .claude/agents/. Legal token sets and how a route is consumed:
# build-orchestration/SKILL.md "Reports - demand and consume".
# Event schema verified vs code.claude.com/docs/en/hooks (2026-09-05):
# agent_id and agent_type are present inside a subagent call, and
# last_assistant_message is the documented field for Stop/SubagentStop.
# stop_hook_active appears nowhere in that page, so the loop-guard below stands
# on its documented absence, not on a positive statement that it is excluded.
set -uo pipefail

# Fail OPEN on infrastructure faults: an unvalidated report is still caught by the
# manager's unroutable-report rule, whereas a spurious block would loop. (Unlike
# the PreToolUse jails, which fail closed - here the safe direction is to let stop.)
# systemMessage, not stderr: a hook exiting 0 sends stderr to the debug log only,
# so a bare echo here would tell no one the guard had stopped enforcing.
notice() { # surface $1 to the user as systemMessage; jq may be the thing missing
  local m="route-guard: $1"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg m "$m" '{systemMessage:$m}'
  else
    printf '{"systemMessage":"%s"}\n' "$(printf '%s' "$m" | tr -d '"\\')"
  fi
}
fail_open() { [[ -n "${1:-}" ]] && notice "$1"; exit 0; }

proj="${CLAUDE_PROJECT_DIR:-}"
[[ -z "$proj" ]] && fail_open "CLAUDE_PROJECT_DIR unset"
spec="$proj/.claude/hooks/route-spec.json"
command -v jq >/dev/null 2>&1 || fail_open "jq not found"
[[ -f "$spec" ]] || fail_open "spec file missing: $spec"

payload=$(cat)
agent_type=$(printf '%s' "$payload" | jq -r '.agent_type // ""')
agent_id=$(printf '%s' "$payload" | jq -r '.agent_id // ""')
session_id=$(printf '%s' "$payload" | jq -r '.session_id // ""')
msg=$(printf '%s' "$payload" | jq -r '.last_assistant_message // ""')

# loop-guard key, also a filename: agent_id is documented as present only inside a
# subagent call, and a key that resolves to nothing would never match on re-read.
key=$(printf '%s' "${agent_id:-${session_id:-unkeyed}}" | tr -c 'A-Za-z0-9._-' '_')
key=${key:-unkeyed}

# Only the agents recorded in the spec are validated; anything else (critics,
# verifier, researcher, or any non-orchestration subagent) passes through.
jq -e --arg a "$agent_type" '.agents[$a]' "$spec" >/dev/null 2>&1 || exit 0

# Only a name the spec declares counts as a section header, so a report that
# quotes a '- **X**:' line as evidence does not split its own body.
mapfile -t expected < <(jq -r --arg a "$agent_type" '.agents[$a].sections[]' "$spec")
(( ${#expected[@]} )) || fail_open "no sections declared for $agent_type in route-spec.json"
hdr_alt=$(printf '%s|' "${expected[@]}"); hdr_alt=${hdr_alt%|}

# --- helpers ----------------------------------------------------------------

# body of one section: text after '- **Name**:' through the line before the next
# declared section header
get_section() {
  printf '%s\n' "$block" | awk -v n="$1" -v alt="$hdr_alt" '
    BEGIN { hdr="^- \\*\\*" n "\\*\\*:"; nexthdr="^- \\*\\*(" alt ")\\*\\*:"; on=0 }
    { if (on && $0 ~ nexthdr) exit
      if (!on && $0 ~ hdr) { line=$0; sub(hdr,"",line); on=1; print line; next }
      if (on) print }'
}
# first word of a body, stripped of the markdown the agent templates put around it:
# leading blank lines, wrapping backticks/asterisks/quotes, a trailing . or ,
first_word() {
  get_section "$1" | grep -v '^[[:space:]]*$' | head -n1 \
    | sed 's/^[[:space:]]*//; s/[[:space:]].*$//; s/^[`*"'"'"']*//; s/[`*"'"'"'.,]*$//' \
    | tr '[:upper:]' '[:lower:]'
}
# the 'none' sentinel: bare (any decoration stripped), or 'none' then a separated
# clause, which is the shape implementer's Build template forces. Deliberately not
# a bare prefix test: 'none that block the fix, but ...' must stay filled.
body_none() {
  local c f
  c=$(get_section "$1" | tr -d '[:space:]`*"'"'"'.,' | tr '[:upper:]' '[:lower:]')
  [[ "$c" == none ]] && return 0
  f=$(get_section "$1" | grep -v '^[[:space:]]*$' | head -n1 \
    | sed 's/^[[:space:]]*//; s/^[`*"'"'"']*//' | tr '[:upper:]' '[:lower:]')
  [[ "$f" =~ ^none[[:space:]]*[-:] ]]
}
# none | empty | filled
section_state() {
  local c; c=$(get_section "$1" | tr -d '[:space:]')
  if [[ -z "$c" ]]; then echo empty
  elif body_none "$1"; then echo none
  else echo filled; fi
}
section_prefix() { # body begins with $2, ignoring markdown decoration ?
  [[ $(first_word "$1") == "$2" ]]
}

reasons=()
fail() { reasons+=("$1"); }

# One file per key, not one shared file: subagents finish concurrently, and a
# read-modify-write over shared rows loses increments, so the bound would not hold.
block_now() {
  local reason="$1"
  local dir="$proj/build-orchestration/route-block-count"
  mkdir -p "$dir" || fail_open "cannot create $dir"
  local f="$dir/${key}"
  local n=0
  [[ -f "$f" ]] && n=$(tr -cd '0-9' < "$f")
  n=${n:-0}
  if (( n >= 2 )); then
    notice "$agent_type/$key blocked $n times; failing open, the manager's unroutable-report rule takes over."
    exit 0
  fi
  printf '%s\n' "$((n+1))" > "$f"
  jq -n --arg r "$reason" '{decision:"block", reason:$r}'
  exit 0
}

# --- validation flow ---------------------------------------------------------

# envelope: the whole message is the block. Every agent's Report rule 1 says
# nothing before or after it, and the manager reads a first-line route token.
nonblank=$(printf '%s\n' "$msg" | grep -v '^[[:space:]]*$' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
first=$(printf '%s\n' "$nonblank" | head -n1)
last=$(printf '%s\n' "$nonblank" | tail -n1)
if [[ "$first" != '===REPORT===' || "$last" != '===END REPORT===' ]]; then
  block_now "Your entire final message must be exactly one report block and nothing else: a first line '===REPORT===', then 'route: <tokens>', then the body sections as '- **Name**: ...' lines, then a last line '===END REPORT==='. No text before or after it, and no code fence."
fi
block=$(printf '%s\n' "$msg" | awk '/===END REPORT===/{f=0} f; /===REPORT===/{f=1}')

# route line: first non-empty line inside the block must be 'route: <tokens>'
route_line=$(printf '%s\n' "$block" | awk 'NF{print; exit}')
case "$route_line" in
  route:*) ;;
  *) block_now "First line inside the report must be 'route: <tokens>'. Got: '${route_line}'." ;;
esac
route_val=${route_line#route:}
# order-independent set key: sort the '+'-joined tokens so 'fix+decide' matches spec key 'decide+fix'
canon=$(printf '%s' "$route_val" | tr '+' '\n' \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | grep -v '^$' | sort | paste -sd+ -)
if ! jq -e --arg a "$agent_type" --arg r "$canon" '.agents[$a].routes[$r]' "$spec" >/dev/null 2>&1; then
  # spec keys are sorted set keys; printing them verbatim would tell an agent that
  # emitted the documented 'fix+decide' to use 'decide+fix', which nothing else uses
  legal=$(jq -r --arg a "$agent_type" '.agents[$a].routes | keys | join(" | ")' "$spec")
  block_now "route '${route_val# }' is not legal for $agent_type. Legal routes: $legal. Token order does not matter, so 'fix+decide' and 'decide+fix' are the same route."
fi

# section presence: every declared section appears. Order is not checked - the
# manager acts on the route token, and get_section finds a header anywhere.
mapfile -t present < <(printf '%s\n' "$block" | grep -oE "^- \*\*($hdr_alt)\*\*:" | sed -E 's/^- \*\*(.+)\*\*:$/\1/')
missing=()
for sec in "${expected[@]}"; do
  printf '%s\n' "${present[@]}" | grep -qxF "$sec" || missing+=("$sec")
done
if (( ${#missing[@]} )); then
  printf -v want "'%s' " "${expected[@]}"
  printf -v lack "'%s' " "${missing[@]}"
  fail "missing section(s): ${lack% }. Each section is its own line of the form '- **Name**: ...' with the colon outside the bold, and all of these must appear: ${want% }."
fi

# route assertions: each must hold for the emitted route
while IFS= read -r as; do
  [[ -z "$as" ]] && continue
  check=$(jq -r '.check' <<<"$as")
  case "$check" in
    none)     sec=$(jq -r '.section' <<<"$as"); [[ $(section_state "$sec") == none   ]] || fail "route '$canon' requires '$sec' to be none.";;
    nonempty) sec=$(jq -r '.section' <<<"$as"); [[ $(section_state "$sec") == filled ]] || fail "route '$canon' requires '$sec' to have entries.";;
    prefix)   sec=$(jq -r '.section' <<<"$as"); val=$(jq -r '.value' <<<"$as"); section_prefix "$sec" "$val" || fail "route '$canon' requires '$sec' to begin with '$val'.";;
    any_nonempty)
      ok=0
      while IFS= read -r sec; do [[ $(section_state "$sec") == filled ]] && ok=1; done \
        < <(jq -r '.sections[]' <<<"$as")
      (( ok )) || { secs=$(jq -r '.sections | join(", ")' <<<"$as"); fail "route '$canon' requires at least one of: $secs to have entries."; };;
    # a hand-edited spec typo would otherwise satisfy the assertion silently
    *) fail_open "unknown check '$check' for route '$canon' in route-spec.json; report not validated";;
  esac
done < <(jq -c --arg a "$agent_type" --arg r "$canon" '.agents[$a].routes[$r][]' "$spec")

if (( ${#reasons[@]} )); then
  printf -v joined '%s ' "${reasons[@]}"
  block_now "Report does not match the $agent_type contract for route '$canon': ${joined% }"
fi

exit 0
