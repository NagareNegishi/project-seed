# Agent drafts

Drafts for custom subagents. Nothing here is active: Claude Code only loads
agents from `.claude/agents/`, so files in this directory are reference only.

## Conventions

- One file per agent: `docs/agents/<agent-name>.md`.
- Follow the structure in [template.md](template.md).
- The **Definition** section is the exact file content that will land in
  `.claude/agents/<agent-name>.md` on promotion. Keep it self-contained:
  a subagent starts with no conversation context, no CLAUDE.md discussion,
  nothing outside its prompt.
- Everything outside the Definition section (status, design notes) stays in
  the draft and is dropped on promotion.

## Promotion

Only with user sign-off:

1. Copy the Definition code block to `.claude/agents/<agent-name>.md`.
2. Verify the agent appears in the available-agents list in a new session.
3. Update the draft's status line to `promoted <date>`.

## Drafts

- [researcher](researcher.md) — executes one research task, reports back with a verifiable reference on every claim.
- [verifier](verifier.md) — adversarially checks a researcher report, pass/fail per claim with its own evidence.
- [security-critic](security-critic.md) — finds security risks and holes in an idea or implementation; problems only, no fixes.
- [design-critic](design-critic.md) — argues why an idea or implementation is bad design, non-standard, or unwanted; problems only, no fixes.
- [alternatives-explorer](alternatives-explorer.md) — runs after the critics; explores alternative approaches that avoid the reported problems.
