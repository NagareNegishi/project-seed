#!/usr/bin/env bash
# Implementer isolation helper — manager-side git worktree lifecycle.
#
# Gives each `implementer` subagent its own git worktree with the test directory
# sparse-checked-out, so it builds from the spec and never sees the suite. The manager
# (the main session) runs these subcommands; the implementer runs no git itself and is
# the single integration gate. Run with no arguments for the subcommand reference.
# Design + rationale: docs/skills/build-orchestration-design-notes.md
# ("Implementer isolation — merge gate + git fence") and docs/agents/authoring.md §13.

set -euo pipefail

# --- shared setup -----------------------------------------------------------------

# Resolve the main checkout's root. The manager invokes this from the main working
# tree, so `git rev-parse --show-toplevel` is the integration target every subcommand
# writes back into.
root=$(git rev-parse --show-toplevel)

# All implementer worktrees live under one gitignored dir at the repo root, keyed by
# unit id. Nesting a worktree inside the main tree is fine as long as it is ignored.
worktrees_dir="$root/.impl-worktrees"

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
  add    <unit> <test-dir> [base-ref]    create the isolated worktree (tests pruned)
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

# add: create the isolated worktree with the test dir pruned out of it.
cmd_add() {
  (($# >= 2)) || usage
  local unit="$1" testdir="$2" base="${3:-HEAD}"
  local wt branch
  wt=$(wt_for "$unit"); branch=$(branch_for "$unit")

  # Branch a fresh worktree off the base ref. Full checkout first (simpler and more
  # reliable than --no-checkout + manual materialise); the sparse step below prunes.
  git worktree add -b "$branch" "$wt" "$base"

  # Non-cone sparse-checkout takes gitignore-style patterns: include everything at the
  # root, then negate the test dir so the suite is absent from the implementer's tree.
  # `set` applies immediately, removing the test dir from the just-checked-out worktree.
  git -C "$wt" sparse-checkout set --no-cone '/*' "!/${testdir%/}/"

  printf 'worktree ready: %s (branch %s, tests pruned: %s)\n' "$wt" "$branch" "$testdir"
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

  # Walk each changed path; collect the ones the permitted set does not cover.
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

# merge: hard-fail if audit finds any violation (nothing crosses, worktree left intact
# for the manager to push back to the implementer), else transfer only the in-scope
# paths into the main checkout via a path-filtered patch.
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

  # Emit a diff limited to the permitted paths and apply it to the main tree + index.
  # Path-filtering (not a branch merge) is what lets the manager pick exactly what
  # crosses; --cached already includes new files staged by the audit step.
  git -C "$wt" diff --cached -- "$@" | git -C "$root" apply --index -
  printf 'merged %d path(s) from %s into %s\n' "$#" "$unit" "$root"
}

# remove: drop the worktree and its scratch branch. --force covers the staged/dirty
# state the audit step leaves behind.
cmd_remove() {
  (($# >= 1)) || usage
  local unit="$1"
  local wt branch
  wt=$(wt_for "$unit"); branch=$(branch_for "$unit")

  git worktree remove --force "$wt"
  git branch -D "$branch"
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
