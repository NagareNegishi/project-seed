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
#
# Each merge lands as a throwaway commit; `start` and `finalize` bracket the session and
# collapse those into one deliberate commit. Run with no arguments for the subcommand
# reference. Rationale: docs/skills/build-orchestration-design-notes.md,
# docs/agents/authoring.md §13.

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
  add      <unit> [test-dirs] [base-ref] create the worktree; with test-dirs (comma-sep)
                                         prunes them (implementer), without = full checkout
  audit    <unit> <permitted-path>...    list changed paths outside the permitted set
  merge    <unit> <permitted-path>...    refuse on any violation, else merge the unit's branch
  remove   <unit>                        tear the worktree down
  start                                  stamp the session base commit for finalize
  finalize [session-start-ref]           collapse per-unit scaffold commits back to the stamp
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
# shape); with none it is a full checkout (tester/debugger shape).
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
# unit's permitted set — non-zero exit on any violation.
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

# merge: refuse on any out-of-scope change, else commit the worktree's audited changes
# onto its branch and merge that branch into main. Post-audit the branch is wholly
# in-scope, so a whole-branch merge crosses exactly the permitted paths — no path filter
# needed. A pruned test dir carries the skip-worktree bit, so the audit's `add -A` never
# stages it as a deletion (git-update-index); the commit keeps main's tests intact.
cmd_merge() {
  (($# >= 2)) || usage
  local unit="$1"; shift
  local wt branch; wt=$(wt_for "$unit"); branch=$(branch_for "$unit")

  # Gate on the audit (its `add -A` also stages the worktree). On failure we stop here:
  # the edits stay uncommitted in the worktree, so the manager can SendMessage the
  # violation back to the implementer to relocate.
  if ! cmd_audit "$unit" "$@"; then
    printf 'merge refused: out-of-scope changes present — push back to the implementer\n' >&2
    return 1
  fi

  # Commit any newly-audited changes onto the unit's branch. Skip when nothing is staged —
  # an implementer that changed nothing, or a re-run after the commit already landed;
  # either way the merge below still runs, so a re-run stays safe.
  if ! git -C "$wt" diff --cached --quiet; then
    git -C "$wt" commit -q -m "build: $unit"
  fi

  # Merge the unit's branch into main. A real 3-way merge off the true merge-base (the
  # worktree shares $root's history), so a path an earlier unit already changed auto-merges
  # when the edits don't overlap. An empty or already-integrated branch is "Already up to
  # date" — a no-op. On a genuine line conflict the recovery is printed below.
  if ! git -C "$root" merge --no-edit "$branch"; then
    printf 'merge conflict: %s and an already-merged unit change the same lines of a shared path.\n' "$unit" >&2
    printf '%s now holds conflict markers on the affected paths. Resolve them (merge glue) and\n' "$root" >&2
    printf 'commit, or `git -C %s merge --abort` to abort and re-sequence.\n' "$root" >&2
    return 1
  fi
  printf 'merged %s into %s\n' "$branch" "$root"
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

# start: stamp the session's base commit so `finalize` can collapse back to it. Idempotent —
# a re-run keeps the original stamp, so a resumed session never moves its own baseline.
cmd_start() {
  mkdir -p "$worktrees_dir"
  local marker="$worktrees_dir/.session-start"
  if [[ -f "$marker" ]]; then
    printf 'session-start already stamped: %s\n' "$(cat "$marker")"
    return 0
  fi
  # Resolve HEAD before writing the marker: redirecting into it would truncate the file
  # first, so a rev-parse failure (e.g. unborn HEAD) would leave an empty marker that then
  # satisfies the guard above and blocks every later stamp.
  local head; head=$(git -C "$root" rev-parse HEAD)
  printf '%s\n' "$head" > "$marker"
  printf 'session-start stamped: %s\n' "$head"
}

# finalize: collapse the per-unit scaffold commits `merge` made back into uncommitted
# changes, so the integrated result is committed once, deliberately, through the git-commit
# skill. Resets $root to the session-start stamp (--mixed: changes kept, unstaged) and
# refuses unless that stamp is an ancestor of HEAD, so it can only ever drop commits made
# this session — never pre-session or pushed history.
cmd_finalize() {
  local marker="$worktrees_dir/.session-start"
  local ref="${1:-}"
  if [[ -z "$ref" && -f "$marker" ]]; then
    ref=$(cat "$marker")
  fi
  if [[ -z "$ref" ]]; then
    printf 'finalize: no session-start stamp (run `start` first) and no ref given\n' >&2
    return 1
  fi

  # A mid-merge finalize would lose the unresolved conflict; resolve or abort it first.
  if git -C "$root" rev-parse -q --verify MERGE_HEAD >/dev/null; then
    printf 'finalize refused: a merge is in progress in %s — resolve or abort it first\n' "$root" >&2
    return 1
  fi

  # The stamp must be reachable from HEAD, or the reset would discard real history.
  if ! git -C "$root" merge-base --is-ancestor "$ref" HEAD; then
    printf 'finalize refused: %s is not an ancestor of HEAD — wrong ref, refusing to reset\n' "$ref" >&2
    return 1
  fi

  git -C "$root" reset --mixed "$ref"
  rm -f "$marker"
  printf 'collapsed session commits back to %s; stage exact paths and commit via git-commit\n' "$ref"
}

# --- dispatch ---------------------------------------------------------------------

sub="${1:-}"; shift || true
case "$sub" in
  add)      cmd_add      "$@" ;;
  audit)    cmd_audit    "$@" ;;
  merge)    cmd_merge    "$@" ;;
  remove)   cmd_remove   "$@" ;;
  start)    cmd_start    "$@" ;;
  finalize) cmd_finalize "$@" ;;
  *)        usage ;;
esac
