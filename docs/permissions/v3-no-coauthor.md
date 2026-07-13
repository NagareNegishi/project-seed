# v3 — no Claude co-author attribution

Designed and applied 2026-07-13. Extends [v2](v2-fetch-origin-main.md) with a second PreToolUse guard: no Bash command may carry a `Co-Authored-By` trailer or the Claude author identity into git history. Permission arrays are unchanged.

## Intent

This repo is a template. Projects built from it must never show Claude as a contributor, and GitHub derives contributors from both the commit author field and `Co-Authored-By` trailers. The `attribution` setting in `.claude/settings.json` (`"commit": ""`) already tells Claude Code not to generate the trailer, but there are upstream reports of the trailer appearing anyway, so the setting alone is not trusted.

The protection is three layers:

1. `attribution` setting — Claude Code does not generate the trailer in the first place ([Settings](https://code.claude.com/docs/en/settings)).
2. CLAUDE.md rule ("Attribution", top block) — Claude knows the policy and understands why a denied command was denied.
3. This hook — hard backstop that blocks the command outright.

## What was added

| Piece | Content |
|---|---|
| hook | second command entry under the existing `PreToolUse` / `Bash` matcher: `.claude/hooks/coauthor-guard.sh` |
| permissions | no change |

Hook behavior:

- Command contains `co-authored-by` in any casing, anywhere in the string: `permissionDecision: "deny"`, with the reason fed back to Claude.
- Command contains `noreply@anthropic.com` (the Claude author identity, e.g. `git commit --author=`): denied the same way.
- Any other command: hook exits silently; normal permission rules apply.

The match is deliberately not limited to git invocations, so writing a trailer into a file for a later `git commit -F` is also caught at the write step.

## Known limits

- Over-blocking is accepted: any command containing either string is denied, including `grep -ri co-authored-by .`. The deny reason explains it; use the Grep/Read tools or reword and retry. Same trade-off v2 made for the fetch regex.
- Not airtight for `-F`: a commit message file authored through the Write tool (not Bash) never passes through this hook, and `git commit -F <file>` shows the hook only the file path. That path still lands on the `Bash(git commit *)` ask rule, so the user sees it before it runs.
- Trailers naming someone other than Claude are also denied. The pattern matches the trailer key itself, on purpose: the policy is that Claude never writes co-author trailers, whoever they name.
- Script failure is safe: if jq is missing or the stdin JSON is malformed, `cmd` is empty, the hook stays silent, and normal permission rules apply.
- Hooks load at session start. After adding or editing this hook, open `/hooks` once or restart Claude Code; verified 2026-07-13 that a mid-session settings edit did not activate it.

## Hooks block

Permission arrays are identical to what `.claude/settings.json` held before v3 (v2 plus the later `Bash(gh *)` deny). Only the hooks key changed:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/fetch-guard.sh"
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/coauthor-guard.sh"
          }
        ]
      }
    ]
  }
}
```

Both scripts are invoked through `bash` so they do not need an execute bit.

## Verification

Pipe synthetic hook input at the script (from the repo root):

```bash
# expected: deny JSON printed
echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"x\" -m \"Co-Authored-By: Claude <noreply@anthropic.com>\""}}' | bash .claude/hooks/coauthor-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git commit --author=\"Claude <noreply@anthropic.com>\" -m x"}}' | bash .claude/hooks/coauthor-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"printf \"Co-Authored-By: x\" > /tmp/m && git commit -F /tmp/m"}}' | bash .claude/hooks/coauthor-guard.sh

# expected: no output
echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"fix: normal message\""}}' | bash .claude/hooks/coauthor-guard.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git status"}}' | bash .claude/hooks/coauthor-guard.sh
```

Validate the settings wiring:

```bash
jq -e '.hooks.PreToolUse[] | select(.matcher == "Bash") | .hooks[] | .command' .claude/settings.json
```

Live proof after a reload: ask Claude to run any harmless command containing the string `co-authored-by` and confirm it is denied with the attribution-policy reason.

## Changed from v2

- `hooks`: added `.claude/hooks/coauthor-guard.sh` as a second entry in the existing Bash matcher; new file of the same name.
- New CLAUDE.md rule ("Attribution") and a README section, so projects instantiated from the seed keep the policy.
- Permission arrays untouched.

References: [Hooks reference](https://code.claude.com/docs/en/hooks) (PreToolUse deny output), [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide) (command-hook pattern), [Extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks) (hooks only tighten policy).
