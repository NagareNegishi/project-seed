# Prompt log

Gitignored capture of every subagent prompt the manager sends during a
`build-orchestration` session. This README is the only tracked file here; the
prompt captures themselves are never committed.

Rules:

- **Capture only.** Log each subagent's exact prompt as it is spawned. This is a
  record of what was asked, nothing more.
- **Never a decision input.** Nothing here feeds a decision in the build-log or
  anywhere else. Read the agents' *reports* for that, not their prompts.
- **Never re-fed.** Never paste a logged prompt into another subagent's prompt.
