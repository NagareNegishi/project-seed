# v4 — gh allowlist

Designed and applied 2026-07-13. Extends [v3](v3-no-coauthor.md) by opening the GitHub CLI for the first time. Until now `gh` was fully blocked (`Bash(gh *)` in deny). The publish skills (`pr-publish`, `issue-publish`, `label-setup`) need it, and `git-commit` needs to look up issue numbers, so this version opens eleven `gh` forms — ten that may carry args, plus a bare-only `gh issue list` — and hard-blocks everything else through a third PreToolUse hook (`gh-guard.sh`).

## Intent

`gh` is a wide tool: one binary reaches issues, pull requests, releases, Actions, secrets, SSH/GPG keys, arbitrary REST/GraphQL (`gh api`), and third-party code (`gh extension install`). It also grows new subcommands and extensions over time. The skills only ever need eleven forms, so the policy is default-deny: allow those, block the entire rest of the surface, and keep blocking anything `gh` adds later without a policy change.

Ten forms may carry args, each traced to its caller:

| Form | Caller |
|---|---|
| `gh pr create` | `pr-publish` — create PR |
| `gh pr edit` | `pr-publish` — edit existing PR |
| `gh pr list` | `pr-publish` — create-vs-edit lookup |
| `gh issue create` | `issue-publish` — create issue |
| `gh issue edit` | `issue-publish` — edit named issue |
| `gh issue view` | `issue-publish` — confirm issue exists before edit |
| `gh label create` | `label-setup` — create a missing preset label |
| `gh label edit` | `label-setup` — reconcile a preset label |
| `gh label list` | `label-setup` + publish skills — check preset labels exist |
| `gh repo view` | `issue-publish` — repo-reachable precondition |

One more form is allowed **only in its bare shape** — `gh issue list` with no flags and no args:

| Form | Caller |
|---|---|
| `gh issue list` (exact) | `git-commit` — find an open issue's number to reference |

The bare command returns open issues as number/title/labels only. Every flag is denied — `--json body`, `--state all`, `--limit`, `--search`, and the rest — so it can never be widened into a body or comment-thread dump. `git-commit` uses it read-only to map work to an issue number, with its local registry as the primary source and this call as the backup. The other ten forms carry args because they need them (`gh pr create --title …`); `issue list` does not, so it is pinned to exactly one shape by a rule separate from the arg-carrying pairs.

`gh auth login` is deliberately not among them. It stays denied and out of band:
the user runs it once with `! gh auth login`, never a skill.

## Why a hook and not permission rules alone

The seal has to cover subcommands *within* groups the skills also use. `gh issue create` is allowed but `gh issue delete` must be blocked, and a deny rule cannot carve an exception, so `Bash(gh issue *)` in deny would also block the allowed `gh issue create`. Permission rules can only deny at group granularity here; they cannot express "this group, only these three verbs."

A hook can. `gh-guard.sh` reads the command, and if it finds a `gh` invocation whose form is not one of the allowed forms above, it returns `permissionDecision: "deny"`. This is the same replacement pattern v2 used for fetch: put the permitted forms in `allow`, let a PreToolUse hook reject the rest. Hook mechanics (read stdin JSON, extract `.tool_input.command` with jq, print a deny decision on match, exit silently otherwise) and the settings wiring (`matcher: "Bash"`, script under `"$CLAUDE_PROJECT_DIR"/.claude/hooks/`) follow [Extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks) and [hook output](https://code.claude.com/docs/en/hooks-guide#hook-output).

Hooks can only tighten, never loosen: deny and ask rules still apply regardless of what the hook returns.

## Two layers, on purpose

The hook is the real seal; the deny rules are a declarative backstop.

- **Hook (`gh-guard.sh`)** — the complete default-deny. Blocks every `gh` form except the eleven allowed ones, including bad subcommands of the four allowed groups (`gh issue delete`, `gh pr merge`, `gh repo delete`), `gh issue list` carrying any flag, unknown groups, extensions, aliases, and anything a future `gh` adds. Needs no maintenance when `gh` changes.
- **Deny rules** — a whole-group `Bash(gh <group> *)` for every top-level group no skill uses. Redundant with the hook for those groups, kept so the dangerous groups stay blocked even if the hook is ever disabled. They are group-level only; the per-subcommand cases are left entirely to the hook, which is why the deny list stays a readable size.

Why not enumerate every unwanted subcommand in deny too: a hand-kept list drifts. A first manual pass already diverged from the installed `gh` — it invented `gh pr develop` and `gh repo credits` (neither exists) and missed `gh pr revert` and `gh repo read-file` (both real). The hook has no such list to drift.

## What was added

| Piece | Content |
|---|---|
| allow rules | the ten `Bash(gh <group> <verb> *)` forms above, plus the exact `Bash(gh issue list)` (no wildcard) |
| deny rules | `Bash(gh *)` removed; 30 whole-group `Bash(gh <group> *)` denies added for every group except `pr`, `issue`, `label`, `repo` |
| hook | third command entry under the existing `PreToolUse` / `Bash` matcher: `.claude/hooks/gh-guard.sh` |

Hook behavior:

- A `gh` call whose form is one of the ten allowed pairs (global flags like `gh -R owner/repo issue create` are resolved past), or the exact bare `gh issue list`: hook exits silently and the allow rule runs it without a prompt.
- Any other `gh` call — different verb, different group, extension, alias, bare `gh`, or `gh issue list` with any flag: `permissionDecision: "deny"`, reason fed back to Claude.
- No `gh` in the command: hook exits silently; normal permission rules apply.

The command is split at shell separators (`&&`, `||`, `;`, `|`, backtick, `$(`) so each `gh` call is judged on its own. `gh pr list && gh repo delete x` is denied because the second segment is not allowed, even though the first is.

## Known limits

Same trade-off class v2 and v3 accepted: escapes fall to a prompt (never a silent run), and over-broad matches are denied outright.

- **Full-path invocation falls to a prompt, not a silent run.** The `gh` boundary matches a bare `gh` token, not `/usr/bin/gh` (the char class excludes `/`, matching the existing guards). A full-path call matches no allow rule and no whole-group deny, so it lands on the normal permission prompt — a human sees it. Not a silent bypass.
- **Shell indirection is invisible**, like the other guards: `c=delete; gh issue $c 5` resolves at runtime, after the hook has seen only the literal text. It matches no allow rule, so it prompts.
- **Quoted separators can over-split.** A `|`, `;`, or `$(` inside a quoted argument splits the string for judging. This only ever makes the guard stricter (more likely to deny), never looser, because a real `gh` verb in the command already sits in its own segment. Reword and retry if a legitimate command is denied.
- **Script failure is safe.** If jq is missing or the stdin JSON is malformed, `cmd` is empty, the hook stays silent, and normal permission rules apply — where the whole-group denies still block the dangerous groups.
- **Hooks load at session start.** After adding this hook, open `/hooks` once or restart Claude Code; a mid-session settings edit does not activate it (noted in v3).

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
      "Bash(gh pr create *)",
      "Bash(gh pr edit *)",
      "Bash(gh pr list *)",
      "Bash(gh issue create *)",
      "Bash(gh issue edit *)",
      "Bash(gh issue view *)",
      "Bash(gh issue list)",
      "Bash(gh label create *)",
      "Bash(gh label edit *)",
      "Bash(gh label list *)",
      "Bash(gh repo view *)",
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
      "Bash(git tag *)",
      "Bash(gh agent-task *)",
      "Bash(gh alias *)",
      "Bash(gh api *)",
      "Bash(gh attestation *)",
      "Bash(gh auth *)",
      "Bash(gh browse *)",
      "Bash(gh cache *)",
      "Bash(gh co *)",
      "Bash(gh codespace *)",
      "Bash(gh completion *)",
      "Bash(gh config *)",
      "Bash(gh copilot *)",
      "Bash(gh discussion *)",
      "Bash(gh extension *)",
      "Bash(gh gist *)",
      "Bash(gh gpg-key *)",
      "Bash(gh licenses *)",
      "Bash(gh org *)",
      "Bash(gh preview *)",
      "Bash(gh project *)",
      "Bash(gh release *)",
      "Bash(gh ruleset *)",
      "Bash(gh run *)",
      "Bash(gh search *)",
      "Bash(gh secret *)",
      "Bash(gh skill *)",
      "Bash(gh ssh-key *)",
      "Bash(gh status *)",
      "Bash(gh variable *)",
      "Bash(gh workflow *)"
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
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/coauthor-guard.sh"
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/gh-guard.sh"
          }
        ]
      }
    ]
  }
}
```

The 30 whole-group denies are every top-level `gh` command in the installed CLI except `pr`, `issue`, `label`, `repo`. On a `gh` major upgrade, re-check `gh --help` for a new top-level group and add a whole-group deny for it; the hook already blocks it in the meantime.

## Verification

Pipe synthetic hook input at the script (from the repo root):

```bash
# expected: no output (allowed)
echo '{"tool_input":{"command":"gh pr create --fill"}}'        | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh repo view"}}'               | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh -R o/r issue create -t x"}}'| bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh pr list | grep foo"}}'      | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh issue list"}}'              | bash .claude/hooks/gh-guard.sh

# expected: deny JSON printed
echo '{"tool_input":{"command":"gh issue list --json body"}}'  | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh issue delete 5"}}'          | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh pr merge 5"}}'              | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh api /repos/x"}}'            | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"gh pr list && gh repo delete x"}}' | bash .claude/hooks/gh-guard.sh
echo '{"tool_input":{"command":"echo \"$(gh secret list)\""}}' | bash .claude/hooks/gh-guard.sh
```

Validate the settings wiring:

```bash
jq -e . .claude/settings.json
jq -r '.hooks.PreToolUse[] | select(.matcher=="Bash") | .hooks[].command' .claude/settings.json
```

## Changed from v3

- `allow`: added the ten `Bash(gh <group> <verb> *)` forms plus the exact `Bash(gh issue list)`.
- `deny`: removed `Bash(gh *)`; added 30 whole-group `Bash(gh <group> *)` denies.
- Third hook under the existing `PreToolUse` / `Bash` matcher, and new file `.claude/hooks/gh-guard.sh`.
- Everything else is identical to v3.
