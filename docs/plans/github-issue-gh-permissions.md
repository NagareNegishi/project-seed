# GitHub CLI (`gh`) permissions — plan

Status as of 2026-07-12: **`gh` is fully blocked.** `.claude/settings.json` has
`Bash(gh *)` in the `deny` array. Nothing invokes `gh` until the issue
create/edit skill is built and these rules are revised (with user sign-off, per
CLAUDE.md config rule).

`.claude/settings.json` is strict JSON and does **not** support comments, so this
file — not an inline comment — is the record of the intended end state.

## Why the current block can't just be loosened

Rules evaluate deny → ask → allow, first match wins, and a deny rule carries no
exceptions: a broad `Bash(gh *)` deny blocks every `gh` call even if a narrower
allow rule also matches. So when the skill lands, **remove `Bash(gh *)` from
deny** and replace it with the allowlist + targeted-deny set below. Do not try to
allow subcommands "through" the broad deny — it won't work.

Source: https://code.claude.com/docs/en/permissions (Permission rule syntax;
Tool-specific permission rules → Bash).

## Eventual rule set (apply when the skill is built)

Allow — the safe issue/label verbs the skill needs:

```
Bash(gh issue create *)
Bash(gh issue edit *)
Bash(gh issue comment *)
Bash(gh issue close *)
Bash(gh issue reopen *)
Bash(gh issue list *)
Bash(gh issue view *)
Bash(gh label list *)
Bash(gh label create *)
```

Deny — keep these blocked even after the skill lands (each is a way to reach
destructive or identity/credential operations, or to bypass the issue-level
allowlist):

```
Bash(gh api *)          # can hit any REST/GraphQL endpoint — create/edit/DELETE issues, bypasses gh issue allowlist
Bash(gh issue delete *) # deletion is reachable via gh (GraphQL under the hood)
Bash(gh repo delete *)
Bash(gh auth *)         # login/logout/token — could print or change the credential
Bash(gh alias *)        # could alias a safe name onto a dangerous command
Bash(gh secret *)
Bash(gh ssh-key *)
Bash(gh gpg-key *)
```

Everything else `gh` does is left unmatched, so it falls through to a normal
permission prompt rather than being silently allowed or hard-blocked.

## Notes

- Matching is compound-command aware: `foo && gh issue delete 5` is still caught,
  because each subcommand is checked independently.
- `Bash(gh *)` matches bare `gh` and every subcommand (trailing ` *` allows a
  space-or-end-of-string boundary).
- Auth is out of band: `gh auth login` is run by the user (`! gh auth login`),
  not by any skill — hence `Bash(gh auth *)` stays denied.
