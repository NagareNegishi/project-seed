# v1 — allow git reads

Designed 2026-07-12, not yet applied. Extends [v0](v0-baseline-strict.md) with four allow rules for read-only git commands. Ask and deny tiers are unchanged.

## Intent

Let Claude inspect history and the remote's published state without a prompt per command, while keeping every mutating operation exactly as strict as v0. The trigger was the pr-draft skill: with `git fetch` denied, it drafted from a stale local base and described a wider changeset than the actual PR. `git ls-remote` lets it detect that staleness (compare the remote's reported SHA against the local remote-tracking ref) without writing anything, not even remote-tracking refs.

## What was added

| Rule | Covers | Why |
|---|---|---|
| `Bash(git log *)` | commit history | drafting PR text and release notes from history |
| `Bash(git show *)` | commits, tags, file contents at a ref | inspecting a specific commit while drafting |
| `Bash(git rev-parse *)` | resolving refs and SHAs, repo paths | base-branch detection (`--abbrev-ref refs/remotes/origin/HEAD`) and SHA comparison |
| `Bash(git ls-remote *)` | network read of a remote's refs and SHAs | staleness check for pr-draft; verifying a branch or tag exists on the remote. Writes nothing locally |

## Deliberate omissions

- `git symbolic-ref` — not allowed even though pr-draft used it for base detection. Its two-argument form writes refs, and a prefix rule cannot separate read from write use. Decision: edit pr-draft to use `git rev-parse --abbrev-ref refs/remotes/origin/HEAD` instead.
- `git branch --list` and `git stash list` — not allowed. The deny rules `git branch *` and `git stash *` match first (rules evaluate deny, then ask, then allow; see [Configure permissions](https://code.claude.com/docs/en/permissions)), so an allow entry would never fire, and narrowing the denies would give up the hard block on branch mutation. When a flow needs branch names, `git for-each-ref refs/heads` gives the same list read-only.
- `git remote -v` — not added in this version; no flow asked for it yet.
- No fetch, no push, no changes to ask or deny.

## Permissions block

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git rev-parse *)",
      "Bash(git ls-remote *)",
      "Write(/.comment-audit/processed.json)",
      "Edit(/.comment-audit/processed.json)"
    ],
    "ask": [
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Read(**/.env)",
      "Read(**/.env.local)",
      "Read(**/.env.development)",
      "Read(**/.env.production)",
      "Read(**/.env.staging)",
      "Read(**/.env.test)",
      "Read(**/.env.*.local)",
      "Read(**/appsettings.*.json)",
      "Read(**/*secret*)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git fetch *)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(git reset *)",
      "Bash(git clean *)",
      "Bash(git stash *)",
      "Bash(git branch *)",
      "Bash(git tag *)"
    ]
  }
}
```

## Changed from v0

Added four entries to `allow`: `git log *`, `git show *`, `git rev-parse *`, `git ls-remote *`. Everything else is byte-identical to v0.
