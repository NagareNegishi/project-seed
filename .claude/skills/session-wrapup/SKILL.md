---
name: session-wrapup
description: >
  Close out a working session: update `docs/progress.md`, report uncommitted
  and unpushed work, and list the session's decisions and open threads.
  Invoke with /session-wrapup.
disable-model-invocation: true
---

# Session Wrapup

Close the loop at the end of a working session. This repo's docs convention asks for `docs/progress.md` to be updated after each major feature; this command makes that update happen and surfaces anything left hanging. It reports git state but never commits or pushes.

## 1. Update docs/progress.md

Record what this session completed:

- Read `docs/progress.md` first and match its existing entry format exactly (heading style, date format, level of detail). Do not introduce a new structure into an established file.
- If the file does not exist, create it with a short dated entry and keep the format minimal, so the project's own convention can grow from there.
- Cover completed work only. In-progress work belongs in the open-threads report (step 3), not in progress entries.
- Write entries following the `human-writing` skill.

## 2. Report git state

Read-only checks; never commit, stage, or push:

- `git status` — list uncommitted changes, grouped as "probably session work" versus "unrelated or pre-existing" when that is clear from the conversation.
- Unpushed commits: `git log @{upstream}..HEAD --oneline` when an upstream exists. If the branch has no upstream, say so instead of guessing.
- Report what exists and leave the decision to the user. Suggest a commit message if the uncommitted work forms one coherent change.

## 3. List open threads and decisions

From this session's conversation, report:

- **Decisions made** — choices with lasting effect (approach picked, alternative rejected, convention adopted), each in one line with the reason.
- **Open threads** — work started but unfinished, questions raised but not answered, TODOs mentioned in passing, follow-ups promised.
- **Suggested next step** — the single most useful thing to start the next session with.

Skip empty sections rather than padding them.

## Output

Present steps 2 and 3 in chat as the wrapup report. The only file this skill writes is `docs/progress.md`.
