# v2 — exact-match fetch of origin main

Designed and applied 2026-07-12. Extends [v1](v1-allow-git-reads.md) with one capability: the exact command `git fetch origin main` runs without a prompt. Every other fetch form is hard-denied. This resolves the fetch question v1 left open (exact-match allow vs moving fetch to ask); the user chose exact allow with everything else denied.

## Intent

`git fetch origin main` only downloads objects and updates the remote-tracking ref `origin/main` (plus `FETCH_HEAD`). It never touches the local `main` branch, the index, or the working tree, so it cannot produce conflicts or overwrite local work. The refspec form that could update a local branch (`git fetch origin main:main`) is not the allowed string and stays blocked.

## Why a hook, not permission rules alone

Deny rules are evaluated before allow rules, and specificity does not change the order, so an exact allow cannot carve an exception out of the `git fetch *` deny — the same mechanics v1 documented for `git branch --list`. From [Configure permissions](https://code.claude.com/docs/en/permissions#manage-permissions): "a deny rule can't carry allowlist exceptions."

The same page recommends the replacement pattern under [Extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks): put the permitted form in `allow` and register a PreToolUse hook that rejects the rest. The hook script shape (read stdin JSON, extract `.tool_input.command` with jq, print a deny decision on match, exit silently otherwise) and the settings wiring (`matcher: "Bash"`, script under `"$CLAUDE_PROJECT_DIR"/.claude/hooks/`) follow the worked examples in [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide#hook-output).

Hooks can only tighten policy, never loosen it: deny and ask rules are evaluated regardless of what a hook returns.

## What was added

| Piece | Content |
|---|---|
| allow rule | `Bash(git fetch origin main)` — exact match, no wildcard |
| deny list | `Bash(git fetch *)` removed; the hook takes over blocking |
| hook | `PreToolUse` on `Bash` runs `.claude/hooks/fetch-guard.sh` for every Bash command |

Hook behavior:

- Command is exactly `git fetch origin main` (byte-for-byte; spacing variants are deliberately denied): hook exits silently and the allow rule lets it run.
- Command contains a git invocation whose subcommand is fetch — `git fetch <anything>`, option forms like `git -C dir fetch`, or fetch inside a compound command: hook prints `permissionDecision: "deny"` and the call is blocked with the reason fed back to Claude.
- Any other command: hook exits silently; normal permission rules apply.

The hook is stricter than permission matching for compounds: `git fetch origin main && git log` is denied outright, because the whole command string is not the allowed form.

## Known limits

Failure modes reviewed 2026-07-12; user decision: leave the regex as is, let the deny reason explain over-fires.

- Escapes fall to a prompt, never a silent run: forms the regex cannot see (absolute path to the git binary, shell variable indirection like `cmd=fetch; git $cmd`, a line continuation between `git` and `fetch`) match no allow rule, so the normal permission prompt catches them.
- False positives are denied outright: any command containing a git-fetch-shaped substring, even inside a quoted string. Concretely, `grep 'git fetch' <file>` and `git commit -m "allow git fetch origin main"` are denied — reword the string and retry.
- Script failure is safe: if jq is missing or the stdin JSON malformed, `cmd` is empty, the hook stays silent, and normal permission rules apply.
- History: the first regex missed options with separated arguments — `git -C /tmp fetch origin` passed through undetected. Caught by user verification 2026-07-12 (pipe-tests below, 7/7 after the fix); fixed the same day.
- The hook runs for every Bash command (no `if` filter), trading a jq spawn per command for coverage of fetch inside compound commands.

## Permissions and hooks block

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
      "Bash(git fetch origin main)",
      "Bash(git add *)",
      "Write(/.comment-audit/processed.json)",
      "Edit(/.comment-audit/processed.json)"
    ],
    "ask": [
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
      "Bash(git add .)",
      "Bash(git add . *)",
      "Bash(git add ./)",
      "Bash(git add -A)",
      "Bash(git add -A *)",
      "Bash(git add --all)",
      "Bash(git add --all *)",
      "Bash(git add -u)",
      "Bash(git add -u *)",
      "Bash(git add --update)",
      "Bash(git add --update *)",
      "Bash(git add -f *)",
      "Bash(git add --force *)",
      "Bash(git push *)",
      "Bash(git pull *)",
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
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/fetch-guard.sh"
          }
        ]
      }
    ]
  }
}
```

The script is invoked through `bash` rather than directly so it does not need an execute bit.

## Verification

Pipe synthetic hook input at the script (from the repo root):

```bash
# expected: deny JSON printed
echo '{"tool_name":"Bash","tool_input":{"command":"git fetch --all"}}' | bash .claude/hooks/fetch-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git -C /tmp fetch origin"}}' | bash .claude/hooks/fetch-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git fetch origin main && ls"}}' | bash .claude/hooks/fetch-guard.sh

# expected: no output
echo '{"tool_name":"Bash","tool_input":{"command":"git fetch origin main"}}' | bash .claude/hooks/fetch-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git add fetch.js"}}' | bash .claude/hooks/fetch-guard.sh
```

Validate the settings wiring:

```bash
jq -e '.hooks.PreToolUse[] | select(.matcher == "Bash") | .hooks[] | .command' .claude/settings.json
```

## Changed from v1

- `allow`: added `Bash(git fetch origin main)`.
- `deny`: removed `Bash(git fetch *)`.
- New top-level `hooks` key (first hook in this project) and new file `.claude/hooks/fetch-guard.sh`.
- Everything else is byte-identical to v1.
