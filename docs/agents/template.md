# <agent-name>

Status: draft | promoted <date>

## Purpose

One or two sentences: what this agent does and when the main agent should
delegate to it instead of doing the work itself.

## Definition

The exact content of the future `.claude/agents/<agent-name>.md`. Nothing else
goes in this block. For the anatomy of that content and why each section exists,
see [definition-template.md](definition-template.md).

```markdown
---
name: <agent-name>
description: When to use this agent. The main agent picks agents by this line,
  so state the trigger, not the mechanics.
tools: Read, Grep, Bash   # optional; omit to inherit all tools
model: sonnet             # optional; omit to inherit
---

System prompt for the agent. Directives, not prose. Must stand alone:
state the task, where the relevant files live, constraints, and what the
final report back to the main agent must contain.
```

## Design notes

Decisions and open questions. Why this is a subagent and not a skill, which
tools it was restricted to and why, what was tried and rejected. Not promoted.
