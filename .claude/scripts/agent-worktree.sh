#!/usr/bin/env bash
# Bash-agent isolation helper — manager-side git worktree lifecycle.
#
# Gives a Bash-carrying subagent its own git worktree, so its edits reach the branch
# only through the manager's audit+merge and never behind its back. Two shapes:
#   - implementer: test dirs pruned, so it builds from the spec and never sees the
#     suite; merge permits its source paths.
#   - whitebox/mcdc tester, debugger: full checkout (they need tests+impl to run the
#     suite); a tester's merge permits only the test dirs, the debugger's worktree is
#     discarded unmerged.
# The manager (the main session) runs these subcommands; the agent runs no git itself
# and is never the integration gate. Run with no arguments for the subcommand reference.
# Design + rationale: docs/skills/build-orchestration-design-notes.md
# ("Bash-agent isolation — merge gate + git fence") and docs/agents/authoring.md §13.

set -euo pipefail

# --- shared setup -----------------------------------------------------------------

# The manager runs this from the main checkout; its root is the integration target
# every `merge` writes back into. Also fails early (under -e) when run outside a repo.
root=$(git rev-parse --show-toplevel)

# All agent worktrees live under one gitignored dir at the repo root, keyed by unit
# id. Nesting a worktree inside the main tree is fine as long as it is ignored.
worktrees_dir="$root/.agent-worktrees"

# Each unit gets a scratch branch; git forbids checking out one branch in two trees,
# so the worktree cannot share the manager's branch and needs its own.
branch_for() { printf 'impl/%s' "$1"; }
wt_for()     { printf '%s/%s' "$worktrees_dir" "$1"; }

# Print the subcommand reference and exit 2 (misuse — distinct from a subcommand that
# ran but failed, which returns 1).
usage() {
  local self; self=$(basename "$0")
  cat >&2 <<EOF
usage: $self <subcommand> [args]
  add    <unit> [test-dirs] [base-ref]   create the worktree; with test-dirs (comma-sep)
                                         prunes them (implementer), without = full checkout
  audit  <unit> <permitted-path>...      list changed paths outside the permitted set
  merge  <unit> <permitted-path>...      refuse on any violation, else transfer in-scope paths
  remove <unit>                          tear the worktree down
EOF
  exit 2
}

# in_scope <path> <permitted>... — true if <path> is one of the permitted paths or
# sits under one of them (treated as a directory prefix). Git prints repo-relative,
# forward-slash paths, and the permitted args are given in the same form.
in_scope() {
  local path="$1"; shift
  local perm
  for perm in "$@"; do
    perm="${perm%/}"                                   # normalise a trailing slash
    [[ "$path" == "$perm" || "$path" == "$perm/"* ]] && return 0
  done
  return 1
}

# --- subcommands ------------------------------------------------------------------

# add: create the isolated worktree. With <test-dirs> it prunes them out (implementer
# shape, builds from the spec); with none it is a full checkout (tester/debugger shape,
# which needs tests+impl to run the suite).
cmd_add() {
  (($# >= 1)) || usage
  local unit="$1" testdirs="${2:-}" base="${3:-HEAD}"
  local wt branch
  wt=$(wt_for "$unit"); branch=$(branch_for "$unit")

  # Full checkout of the base ref first (simpler and more reliable than --no-checkout
  # + manual materialise); the sparse step below prunes when test dirs are given.
  git worktree add -b "$branch" "$wt" "$base"

  # No test dirs → full checkout, nothing to prune (tester/debugger).
  if [[ -z "$testdirs" ]]; then
    printf 'worktree ready: %s (branch %s, full checkout)\n' "$wt" "$branch"
    return 0
  fi

  # Non-cone sparse-checkout (gitignore-style patterns): include the whole root, then
  # negate each test dir. Cone mode cannot express the negation, so --no-cone is required.
  # `set` applies at once, pruning the dirs from the just-checked-out tree.
  local patterns=('/*') dirs d
  IFS=',' read -ra dirs <<< "$testdirs"
  for d in "${dirs[@]}"; do
    patterns+=("!/${d%/}/")
  done
  git -C "$wt" sparse-checkout set --no-cone "${patterns[@]}"

  printf 'worktree ready: %s (branch %s, tests pruned: %s)\n' "$wt" "$branch" "$testdirs"
}

# audit: stage everything the implementer touched, then report any path outside the
# unit's permitted set. This is the scope check; exit non-zero if any violation exists.
cmd_audit() {
  (($# >= 2)) || usage
  local unit="$1"; shift
  local wt; wt=$(wt_for "$unit")

  # Stage untracked files too, so `diff --cached --name-only` is the complete list of
  # what changed. Staging only touches the worktree's own index, not the manager's.
  git -C "$wt" add -A

  # Collect changed paths the permitted set does not cover. Process substitution (not a
  # pipe) keeps the loop in this shell, so the array survives to be inspected below.
  local violations=() path
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    in_scope "$path" "$@" || violations+=("$path")
  done < <(git -C "$wt" diff --cached --name-only)

  if ((${#violations[@]})); then
    printf 'OUT OF SCOPE (%d):\n' "${#violations[@]}" >&2
    printf '  %s\n' "${violations[@]}" >&2
    return 1
  fi
  printf 'audit clean: all changes within permitted set\n'
}

# merge: refuse on any out-of-scope change, else transfer the in-scope paths into main.
cmd_merge() {
  (($# >= 2)) || usage
  local unit="$1"; shift
  local wt; wt=$(wt_for "$unit")

  # Gate on the audit. On failure we stop here: the edits stay in the worktree, so the
  # manager can SendMessage the violation back to the implementer to relocate.
  if ! cmd_audit "$unit" "$@"; then
    printf 'merge refused: out-of-scope changes present — push back to the implementer\n' >&2
    return 1
  fi

  # Count what actually crosses (in-scope files changed), not the number of permitted
  # paths given — the two differ whenever the implementer touched only part of its set.
  local merged=() f
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    merged+=("$f")
  done < <(git -C "$wt" diff --cached --name-only -- "$@")

  # Path-filtered patch, not a branch merge, so the manager transfers exactly the
  # in-scope paths; --index lands them staged in main. --cached already includes the new
  # files staged by the audit. A failure is almost always base drift or a conflicting
  # local edit — surface it, not a raw git error.
  if ! git -C "$wt" diff --cached -- "$@" | git -C "$root" apply --index -; then
    printf 'merge failed: patch did not apply to %s (base drift or a conflicting local edit).\n' "$root" >&2
    printf 'inspect: git -C %s diff --cached -- <paths>; rebase the worktree or clean main, then retry.\n' "$wt" >&2
    return 1
  fi
  printf 'merged %d path(s) from %s into %s\n' "${#merged[@]}" "$unit" "$root"
}

# remove: drop the worktree and its scratch branch. Idempotent — warn and continue past a
# missing worktree or branch so a re-run finishes the teardown. --force covers the
# staged/dirty state the audit step leaves behind.
cmd_remove() {
  (($# >= 1)) || usage
  local unit="$1"
  local wt branch
  wt=$(wt_for "$unit"); branch=$(branch_for "$unit")

  git worktree remove --force "$wt" || printf 'warning: no worktree at %s\n' "$wt" >&2
  git branch -D "$branch"           || printf 'warning: no branch %s\n' "$branch" >&2
  printf 'removed worktree and branch for %s\n' "$unit"
}

# --- dispatch ---------------------------------------------------------------------

sub="${1:-}"; shift || true
case "$sub" in
  add)    cmd_add    "$@" ;;
  audit)  cmd_audit  "$@" ;;
  merge)  cmd_merge  "$@" ;;
  remove) cmd_remove "$@" ;;
  *)      usage ;;
esac
