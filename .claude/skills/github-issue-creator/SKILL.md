---
name: github-issue-creator
description: Use this skill whenever the user wants to create a GitHub issue, write up a task or bug report for GitHub, or turn a conversation or rough explanation into a structured GitHub issue — including a described feature, bug, or task the user asks to formalize. Drafts only: writes a local draft file, never posts to GitHub, never runs `gh`.
---

# GitHub Issue Creator

Produce a GitHub issue draft from conversation context or rough input.

## Output

Write the draft to `.github/drafts/issue-draft.md` — always this exact path — creating the directory if needed and overwriting any existing file.

## File format — follow this exactly

The file has YAML frontmatter for the title and labels, followed by the issue body.

```markdown
---
title: "feat: add bulk export for user activity logs"
labels: [feature]
---
 
Allow admins to export user activity logs as CSV for compliance auditing. No current way to extract this data without direct DB access.
 
- [ ] Add date range picker to activity logs page
- [ ] Implement backend endpoint for filtered CSV generation
- [ ] Handle large exports via streaming or background job
- [ ] Add export button to admin UI with loading state
- [ ] Include columns: user, action, timestamp, IP, resource
- [ ] Write tests for export endpoint edge cases
- [ ] Update admin docs with export instructions
```

## Rules

- Title: use `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefix when obvious. Keep under 70 chars.
- Labels: draw only from the preset `.claude/skills/label-setup/labels.yml` — never a label outside it. Keep the set small: usually one type label (e.g. `feature`, `bug`), optionally paired with one `priority:` label. Use an empty list when none apply.
- Each checkbox = a coherent unit of work. Not micro-steps, not mega-tasks.
- Keep checkboxes between 4–20. If exceeding 20, consolidate first. If still over 20, split into separate issues — produce the first one, suggest follow-up titles with one-line descriptions, and ask the user if they want those written out.
- Add `### Context` or `### Notes` only when there's genuinely useful background. Otherwise omit entirely.
- Never post to GitHub; never run `gh`, `git`, or any network call.

## After writing

Do not render the draft in chat — the user reviews the file in their editor. Show the file path and ask them to choose:

1. **Happy, publish** — hand off to the `issue-publish` skill.
2. **Needs change** — revise the draft, rewrite the file, and ask again.
3. **Happy, but don't publish now** — stop; the draft file stays for later.
4. **Something else** — open-ended.