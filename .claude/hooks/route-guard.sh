#!/usr/bin/env bash
# SubagentStop hook — report route/format validator (build-orchestration).
# Blocks a subagent whose final report breaks the route/section contract in
# .claude/hooks/route-spec.json, so it re-emits before the manager consumes it.
# Pure validator, never a converter. Loop-guard: fail open after 2 blocks per
# agent_id (SubagentStop exposes no stop_hook_active), then the manager's
# "can't route -> redrive" fail-safe catches it.
# Decision, roster, and per-agent conditions:
#   docs/skills/build-orchestration-report-schemas.md "Enforcement hook".
# Event schema verified vs code.claude.com/docs/en/hooks (2026-08-01).
set -uo pipefail

# Fail OPEN on infrastructure faults: an unvalidated report still gets caught by
# the manager's consumption fail-safe, whereas a spurious block would loop. (Unlike
# the PreToolUse jails, which fail closed — here the safe direction is to let stop.)
fail_open() { [[ -n "${1:-}" ]] && echo "route-guard: $1" >&2; exit 0; }

proj="${CLAUDE_PROJECT_DIR:-}"
[[ -z "$proj" ]] && fail_open "CLAUDE_PROJECT_DIR unset"
spec="$proj/.claude/hooks/route-spec.json"
command -v jq >/dev/null 2>&1 || fail_open "jq not found"
[[ -f "$spec" ]] || fail_open "spec file missing: $spec"

payload=$(cat)
agent_type=$(printf '%s' "$payload" | jq -r '.agent_type // ""')
agent_id=$(printf '%s' "$payload" | jq -r '.agent_id // ""')
msg=$(printf '%s' "$payload" | jq -r '.last_assistant_message // ""')

# Only the agents recorded in the spec are validated; anything else (critics,
# verifier, researcher, or any non-orchestration subagent) passes through.
jq -e --arg a "$agent_type" '.agents[$a]' "$spec" >/dev/null 2>&1 || exit 0

# --- helpers ----------------------------------------------------------------

# body of one section: text after '- **Name**:' through the line before the next '- **X**:'
get_section() {
  printf '%s\n' "$block" | awk -v n="$1" '
    BEGIN { hdr="^- \\*\\*" n "\\*\\*:"; nexthdr="^- \\*\\*[^*]+\\*\\*:"; on=0 }
    { if (on && $0 ~ nexthdr) exit
      if (!on && $0 ~ hdr) { line=$0; sub(hdr,"",line); on=1; print line; next }
      if (on) print }'
}
# none | empty | filled
section_state() {
  local c; c=$(get_section "$1" | tr -d '[:space:]')
  if [[ -z "$c" ]]; then echo empty
  elif [[ "${c,,}" == "none" ]]; then echo none
  else echo filled; fi
}
section_prefix() { # body (trimmed, lowercased) begins with $2 ?
  local b; b=$(get_section "$1" | sed 's/^[[:space:]]*//'); b=${b,,}
  [[ "$b" == "$2"* ]]
}

reasons=()
fail() { reasons+=("$1"); }

block_now() {
  local reason="$1"
  local statefile="$proj/build-orchestration/route-block-count"
  mkdir -p "$(dirname "$statefile")"
  local n=0
  [[ -f "$statefile" ]] && n=$(awk -v id="$agent_id" '$1==id{print $2}' "$statefile")
  n=${n:-0}
  if (( n >= 2 )); then
    echo "route-guard: $agent_type/$agent_id blocked $n times; failing open (manager redrive fail-safe takes over)." >&2
    exit 0
  fi
  local tmp; tmp=$(mktemp)
  { [[ -f "$statefile" ]] && awk -v id="$agent_id" '$1!=id' "$statefile"; echo "$agent_id $((n+1))"; } > "$tmp"
  mv "$tmp" "$statefile"
  jq -n --arg r "$reason" '{decision:"block", reason:$r}'
  exit 0
}

# --- validation flow ---------------------------------------------------------

# report block: the span from the first ===REPORT=== to the next ===END REPORT===
if ! printf '%s' "$msg" | grep -q '===REPORT===' \
   || ! printf '%s' "$msg" | grep -q '===END REPORT==='; then
  block_now "Report envelope markers missing. Your entire final message must be exactly one block: a line '===REPORT===', then 'route: ...', the body sections, then '===END REPORT==='."
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
  legal=$(jq -r --arg a "$agent_type" '.agents[$a].routes | keys | join(" | ")' "$spec")
  block_now "route '$canon' is not legal for $agent_type. Legal: $legal."
fi

# section presence + order: exactly the spec's sections, in order
mapfile -t expected < <(jq -r --arg a "$agent_type" '.agents[$a].sections[]' "$spec")
mapfile -t present < <(printf '%s\n' "$block" | grep -oE '^- \*\*[^*]+\*\*:' | sed -E 's/^- \*\*(.+)\*\*:$/\1/')
if [[ "${present[*]}" != "${expected[*]}" ]]; then
  fail "sections must be exactly, in order: ${expected[*]} — got: ${present[*]:-<none>}"
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
  esac
done < <(jq -c --arg a "$agent_type" --arg r "$canon" '.agents[$a].routes[$r][]' "$spec")

if (( ${#reasons[@]} )); then
  printf -v joined '%s ' "${reasons[@]}"
  block_now "Report does not match the $agent_type contract for route '$canon': ${joined% }"
fi

exit 0
