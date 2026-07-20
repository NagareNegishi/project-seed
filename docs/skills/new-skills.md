# Skill authoring and polish guide

The five portable seed skills (`pr-draft`, `systematic-debugging`,
`session-wrapup`, `dependency-upgrade`, `release-notes`) shipped 2026-07-05.
This file keeps the reusable rules for polishing existing skills and adding
new ones.

## Open follow-ups

- `pr-draft`: `.github/PULL_REQUEST_TEMPLATE.md` has a checklist and the skill
  has no checkbox rule — add "leave a box unchecked unless the session
  actually did it". Deferred 2026-07-12: user wants to observe how the
  template behaves before writing the rule.

- `label-setup` → convert to a script, like `scripts/protect-main.sh`. The logic
  is a pure reconcile (diff preset against `gh label list`, create/edit, never
  delete) with no judgment, so it scripts cleanly. Blocker: the preset is YAML
  and `yq` is not installed. Preferred path: convert `labels.yml` → `labels.json`
  and parse with `jq` (already present); move the format comments to the script
  header. Alternative: add `yq` to the devcontainer and firewall allowlist.
  Deferred 2026-07-20.

## Skill-as-script / combine audit

Opened 2026-07-20. A skill earns its keep only when the task needs an agent's
judgment. Deterministic reconcile/fetch work belongs in a committed script:
fixed reviewable commands, nothing improvised per run (the reasoning behind
`scripts/protect-main.sh`). Revisit these when touching the skills:

- Convert candidates (mechanical, no per-run judgment):
  - `label-setup` — see the follow-up above.
  - `owasp-update` — language detect + SHA compare + `curl` sheets + write cache.
    Moderate effort; the only soft step is language detection from file signals,
    which is a fixed heuristic.
- Keep as skills: everything judgment-driven — drafting (`*-draft`,
  `github-issue-creator`, `plan-*`, `release-notes`), research, design,
  debugging, review, `code-commenting`, `comment-audit`, `session-wrapup`.
- Do NOT combine the draft→publish pairs (`github-issue-creator`+`issue-publish`,
  `pr-draft`+`pr-publish`). The split is a deliberate safety boundary: draft
  skills never touch the network, publish skills run `gh`.
- Open: `code-commenting` and `comment-audit` restate the same comment standard.
  Factor the standard into one shared reference both point at — dedupe the
  standard, do not merge the skills (write-time vs audit-pass are distinct
  triggers).

## Polish criteria

Polish means making the skill effective for Claude Code as the reader, not
improving the prose. Work one skill per session, one section at a time, with
review between sections. Session start: read this guide and the target skill's
`SKILL.md` — nothing else.

The frontmatter `description` counts as a section and gets its own pass. Do it
first; never skip it.

Per section:

- Directive, command-based voice: "Never push", not "This skill never pushes".
- Trim anything redundant for an agent: rationale it doesn't need to act,
  restatements across sections, trigger paraphrases the description's first
  sentence already implies.
- Add concrete examples only where they help operation — exact commands
  (`git log <base>..HEAD`), a sample of the output format.
- Trigger-phrase examples in a description must each cover a request the
  trigger sentence would not obviously catch (test: would triggering fail
  without it?). From the `systematic-debugging` pass: keep "fix it" (reads as
  a change task, not diagnosis), drop "it's broken" (already covered).
- Add new rules only where they prevent a realistic misfire. Examples from the
  `pr-draft` pass: `git fetch` looks harmless but is a network call; a test
  plan must not claim verification that never ran; a draft file must never be
  committed; an empty commit log must stop the skill, not produce an invented
  draft.

## Conventions every skill must follow

- Stack-agnostic. Use `<placeholder>` markers where a project must fill in
  specifics, as `frontend-design` does.
- Drafting skills produce output only, they never post or push. State this in
  the description, as `github-issue-creator` does.
- Explicit-command skills set `disable-model-invocation: true`. Auto-triggered
  skills need a description that spells out trigger phrases (see
  `github-issue-creator`).
- Written documents go through `human-writing`; say so in the skill body.

## Future skill candidates

`dead-code-audit`, `a11y-audit`, `todo-triage` — below the cut line in the
2026-07-04 selection, not rejected. Revisit when adding skills. `feature-plan`
is now designed as three skills; see [feature-plan.md](feature-plan.md).
