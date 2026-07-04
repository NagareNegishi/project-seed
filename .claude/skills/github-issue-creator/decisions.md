# GitHub Issue Creator — Design Decisions

Decision log for the `github-issue-creator` skill. Captures what was chosen, what was deferred, and why, so future changes have context.

## Scope

**In scope:** drafting GitHub issues from conversation context into a local file.

**Out of scope (deferred):** posting issues to GitHub. No `gh`, no MCP, no API calls. The skill is pure local file generation.

Reason: separating drafting from posting keeps the skill dependency-free, removes all risk of unintended side effects, and lets the posting mechanism be decided independently later.

## Skill structure

**Single skill, not split (yet).** The original `github-issue-creator` is kept and modified in place rather than replaced. A future poster skill will be a separate skill that reads the draft file produced by this one. The two halves develop independently.

## Output format

**Draft file path:** `.github/drafts/issue-draft.md`

- Single fixed filename, always overwritten on each run.
- One draft at a time — no draft history, no timestamped filenames.
- Located under `.github/` so it's conceptually grouped with other GitHub-related repo metadata.
- Directory created on first use if it doesn't exist.


## File content format

**YAML frontmatter + body**, not plain H1 + body.

```markdown
---
title: "feat: add bulk export for user activity logs"
labels: []
assignees: []
---

Body content...

- [ ] checkbox one
- [ ] checkbox two
```

**Why frontmatter:**
- Structured fields (`title`, `labels`, `assignees`) map directly to what any posting mechanism needs (`gh issue create` flags, GitHub MCP server's `create_issue` tool parameters, GitHub REST API payload).
- Empty arrays preserved (`labels: []`, `assignees: []`) so the structure is consistent across drafts.
- Title is always quoted in YAML to avoid edge cases with colons, special characters, etc.


## Manual workflow (current)

1. User asks Claude to draft an issue.
2. Skill writes `.github/drafts/issue-draft.md`, overwriting any existing draft.
3. Skill shows the rendered draft in chat for review.
4. User copies the `title` value into GitHub's web UI title field.
5. User copies everything below the closing `---` into GitHub's web UI body field.
6. User clicks "Submit new issue" in GitHub themselves.

No automation, no permission prompts, no auth, no network. Pure copy-paste.


## Permission and safety model

The skill explicitly forbids itself from:
- Posting to GitHub
- Running `gh`, `git`, or any network call

This is enforced at two layers:
1. The skill's own rules section says "never post."
2. The dev container's `.claude/settings.json` deny list blocks `git` mutation commands.

`gh` is not currently in the deny list because (a) `gh` isn't installed in the container, and (b) the skill never tries to call it. If `gh` is added later, the existing Claude Code default behavior (prompt before unfamiliar bash commands) acts as the manual gate.

## Deferred decisions

These were discussed and intentionally not decided yet. They will be decided when the posting skill is built.


### Posting mechanism

**Preferred: GitHub MCP server (hosted or local).** Structured tool calls eliminate shell-quoting issues entirely, per-capability permissions are cleaner than command-pattern matching, and the protocol is where the ecosystem is heading. Worth the higher setup overhead.

**Potential extensions, not committed:**
- `gh issue create --body-file <path>` — fallback if MCP setup proves too heavy or unavailable in some context.
- `gh issue create --web` — opens GitHub pre-filled in browser; useful when you want GitHub's UI itself as the final confirm step.

**Why deferred:** all three work with the same draft file format. No need to commit until the poster is built. Building the drafter first lets us validate that the YAML frontmatter format is right before depending on it.

### MCP transport (if MCP is chosen)

If the MCP path is taken later, three sub-options:
- GitHub's hosted remote MCP server (zero install, auto-updated, but third-party in path)
- Local Docker container (full control, but Docker-in-Docker complexity in dev containers)
- Native Go binary (full control, single-binary install, easiest local option)

**Likely choice if MCP is picked:** native Go binary, scoped to `issues` toolset only, with a fine-grained PAT limited to `Issues: write`.

### Default assignee

GitHub web UI has a "assign yourself" button. The frontmatter currently has `assignees: []`.

Discussed:
- Hardcode the user's GitHub username in the skill (simple, not portable)
- Use `@me` shortcut (works with `gh`, may not work with MCP)
- Read from a per-repo config file (more setup, more flexibility)

**Not decided yet.** Left as `assignees: []` for now. Will revisit when the poster skill is built and we know which mechanism is being used.

### Labels, milestones, projects

Currently `labels: []`, no milestone or project fields. Will be added to frontmatter as needed when the poster supports them.

## Why these decisions hang together

The throughline is: **defer every decision that doesn't have to be made now, but pick a draft format that doesn't lock anything out.**

The frontmatter format works equally well for `gh`, MCP, REST API, or pure copy-paste. The fixed file path keeps the contract between drafter and (future) poster simple — the poster always reads the same place. The "never post" rule in the skill plus the dev container's deny list plus the fact that `gh` isn't installed means there are three independent layers preventing any accidental posting, even if one fails.

When the poster skill is built, the drafter shouldn't need to change. That's the test of whether this split was right.