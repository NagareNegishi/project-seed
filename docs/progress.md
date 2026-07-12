<!-- Update convention: read at session start; update after each major feature
     completes. One line per decision — state the decision, skip the reasoning. -->

<One line: stack + what the app is. Link the live URL if deployed.>

## Key Decisions

### <Area, e.g. Auth / Backend / Frontend>
- <decision — one line>

### Git permission policy (2026-07-12 session)
- Permission presets are versioned as docs in `docs/permissions/`; a version is documentation-only until its block is pasted into `.claude/settings.json`.
- v0 captured the shipped strict policy verbatim; v1 applied to `.claude/settings.json` 2026-07-12.
- v1: allow `git log/show/rev-parse/ls-remote` and explicit-path `git add`; deny all bulk (`.`, `-A`, `--all`, `-u`, `--update`) and force (`-f`, `--force`) add forms; commit stays ask; push/fetch/pull stay denied.
- `git symbolic-ref` gets no rule (two-arg form writes refs); pr-draft will switch to `git rev-parse --abbrev-ref refs/remotes/origin/HEAD`.
- `git branch --list` / `git stash list` stay blocked: deny/ask match before allow, so an allow rule can't carve exceptions; use `git for-each-ref refs/heads` for listing.
- Record docs hold only config content, history, and stated intent — no inferred analysis (user rule).
- v2 (2026-07-12): exact `git fetch origin main` allowed; every other fetch form hard-denied by a PreToolUse hook (`.claude/hooks/fetch-guard.sh`). User pipe-tested 7/7; design, references, and known limits in `docs/permissions/v2-fetch-origin-main.md`.
- v2 accepted trade-off: any command containing a literal `git fetch` substring (grep on the policy doc, commit messages mentioning it) is denied — reword and retry.
- v2 hook confirmed live 2026-07-12: settings jq check passed, hook detail visible under `/hooks` → PreToolUse(1).
- pr-draft refactored 2026-07-12 to consume v2: base `main` refreshed via exact `git fetch origin main`; other bases accepted only on `ls-remote`/local SHA match; unconfirmed freshness stops the skill with no draft (was warn-and-continue).
- pr-draft checkbox follow-up (new-skills.md) deferred — user wants to observe template behavior first.

## In Progress — pick up next session

- Uncommitted on `main`: v2 (settings, hook, doc), pr-draft skill refactor, doc updates.
- Shelved by user (no push at all for now): push deny→ask, branch-guard PreToolUse hook, pr-draft/pr-publish skill split for actual PR creation.
