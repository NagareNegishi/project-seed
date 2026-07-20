#!/usr/bin/env bash
# protect-main.sh — protect the repo's default branch via the GitHub rulesets API.
# One-time per-project setup. The payload below is fixed and reviewable, not
# assembled at run time.
#
# Applies (safe default a stack-agnostic seed can ship):
#   - require a pull request to merge (0 approvals, so a solo owner self-merges)
#   - block force-pushes (non_fast_forward)
#   - block branch deletion
#
# Idempotent: updates the existing "protect-main" ruleset if present, else creates
# it. Needs admin on the repo and an authenticated gh (`gh auth login`).
#
# Usage: scripts/protect-main.sh [-y]
#   -y   skip the confirmation prompt (for non-interactive use)
set -euo pipefail

RULESET_NAME="protect-main"
ASSUME_YES=0
[ "${1:-}" = "-y" ] && ASSUME_YES=1

# Required status checks are OFF by default: a stack-agnostic seed has no CI, and
# a required check that never reports would block every merge. Once this project
# has CI, list its check names here (e.g. "build" "test") to also require them.
REQUIRED_CHECKS=()

# Fail early if gh is missing or unauthenticated.
if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

# Resolve the target repo and its default branch from the current directory.
REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)"

# Build the rules array. ~DEFAULT_BRANCH targets whatever the repo's default
# branch is, so this stays correct if a project renames main.
rules='[
  { "type": "deletion" },
  { "type": "non_fast_forward" },
  { "type": "pull_request", "parameters": {
      "required_approving_review_count": 0,
      "dismiss_stale_reviews_on_push": false,
      "require_code_owner_review": false,
      "require_last_push_approval": false,
      "required_review_thread_resolution": false
  } }
]'

# Append a required_status_checks rule only when REQUIRED_CHECKS is non-empty.
if [ ${#REQUIRED_CHECKS[@]} -gt 0 ]; then
  contexts="$(printf '%s\n' "${REQUIRED_CHECKS[@]}" \
    | jq -R '{context: .}' | jq -s .)"
  checks_rule="$(jq -n --argjson c "$contexts" '{
    type: "required_status_checks",
    parameters: { strict_required_status_checks_policy: true, required_status_checks: $c }
  }')"
  rules="$(jq -n --argjson r "$rules" --argjson x "$checks_rule" '$r + [$x]')"
fi

payload="$(jq -n --arg name "$RULESET_NAME" --argjson rules "$rules" '{
  name: $name,
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
  rules: $rules
}')"

# Update in place if a ruleset with this name already exists; never duplicate.
existing_id="$(gh api "repos/$REPO/rulesets" --jq \
  ".[] | select(.name==\"$RULESET_NAME\") | .id" 2>/dev/null || true)"

# Show the plan and confirm before mutating anything.
echo "Repo:            $REPO"
echo "Default branch:  $DEFAULT_BRANCH"
echo "Ruleset:         $RULESET_NAME ($([ -n "$existing_id" ] && echo "update id $existing_id" || echo "create"))"
echo "Rules:           require a PR to merge (0 approvals), block force-push, block deletion"
if [ ${#REQUIRED_CHECKS[@]} -gt 0 ]; then
  echo "Required checks: ${REQUIRED_CHECKS[*]}"
else
  echo "Required checks: none (edit REQUIRED_CHECKS in this script to add)"
fi

if [ "$ASSUME_YES" -ne 1 ]; then
  read -r -p "Apply this to $REPO? [y/N] " reply
  case "$reply" in
    y|Y|yes|Yes) ;;
    *) echo "Aborted; no changes made."; exit 0 ;;
  esac
fi

if [ -n "$existing_id" ]; then
  echo "$payload" | gh api --method PUT "repos/$REPO/rulesets/$existing_id" --input - >/dev/null
else
  echo "$payload" | gh api --method POST "repos/$REPO/rulesets" --input - >/dev/null
fi

echo "Done. $DEFAULT_BRANCH now requires a PR to merge; force-push and deletion are blocked."
