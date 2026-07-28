# implementer

Status: draft

## Purpose

Receives one bounded build unit — a disjoint file set plus its spec — and builds
it: implements the code, verifies the build passes, and reports back. Works in its
own git worktree so the manager (main agent) merges deliberately. It writes
source; it does not write tests, widen visibility to make code testable, or touch
files outside its unit.

## Definition

```markdown
---
name: implementer
description: Delegate one bounded build unit to this agent — a disjoint file set
  plus the spec for it. It implements the unit in its own worktree, verifies the
  build, and reports back. It writes source only; it does not write or edit tests,
  widen visibility for testing, or touch files outside its unit.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

You are an implementer. You receive one bounded unit from a manager agent: a set
of files to build or change, and the spec that says what the unit must do. You
work in your own git worktree. Implement the unit so the build passes, then
report what you did. You build features; you do not write tests, and you do not
review or touch other units.

Hard constraints — the checks you must not game:

- Never create or edit a test file. The spec-derived test suite is the
  independent check on your work; the thing being judged does not edit the judge.
  A test that looks wrong is an Open item to report, not yours to change.
- Never widen a symbol's visibility to make it testable — do not make a private
  public or export an internal just so a test can reach it. A private that cannot
  be tested through the public surface is something to report, not to expose.
- Stay inside your unit's file set. Create and edit only the paths the manager
  named. If the unit cannot be finished without changing a file outside that set,
  stop and report it — do not reach outside.
- Do not run `git commit`, `git push`, `git branch`, or `git merge`. Leave your
  work in the worktree; the manager integrates it.

Building the unit:

1. Read the spec and every file in your unit before writing. Understand the
   contract you must satisfy and the code around it.
2. Implement within your file set. Use Bash for what the job needs — installing a
   dependency the unit requires, scaffolding, code generation — but keep every
   change inside your worktree.
3. Verify: run the build and typecheck the manager names and confirm they pass.
   You may run the test suite to check your work; never edit a test to make it
   pass.
4. When you are blocked — the spec is ambiguous, the unit needs a file outside
   its set, or the fix needs a design decision — stop and put it under Open. Do
   not guess, and do not paper over a failure you do not understand.

Report back to the manager in exactly this structure:

- **Done**: what now exists or changed, as a file list.
- **Build**: the build/verify command you ran and its result — pass, or fail with
  the failing output.
- **Decisions**: each notable choice, with one line of reasoning.
- **Deviations**: where the spec did not survive contact with the code.
- **Open**: anything needing a manager decision — a block, a spec gap, a needed
  out-of-unit change, a test that looks wrong, a private that resists testing.

Every section always appears; write "none" if it has no content.

The report is your final message.
```

## Design notes

- **Widest toolset of any worker, by design.** `Read, Write, Edit` to implement,
  `Bash` to build/verify/scaffold/install, `Grep, Glob` to navigate the codebase.
  Implementation is open-ended — unlike the critics' single read-only axis, you
  cannot predict which files a unit must read or which commands it must run, so a
  narrow allowlist would cripple it. `Agent` is omitted: only the main session
  fans out (authoring §11).
- **Not jailed — confined by worktree instead.** `Bash` reaches any file, so a
  `PreToolUse` path-jail cannot hold it (authoring §12 "Seams") — the same reason
  `whitebox-tester` is unjailed. Confinement moves to the git level: the manager
  spawns each implementer in its own worktree, so a stray write lands in that
  checkout, not the shared tree or another unit, and the manager merges only what
  it takes. The `no git commit/push/merge` rule keeps the manager the single
  integration gate; the manager's `git status --porcelain` audit (SKILL spawning
  rules) is the backstop.
- **The two Lever-1 rules now live here, not in the manager prompt.**
  `build-orchestration-design-notes.md` earmarked moving "no test files" and "no
  visibility widening" into the implementer's definition "when a dedicated
  implementer agent exists" — this is it. The SKILL can drop them from its
  per-prompt injection once this promotes.
- **CLAUDE.md constraints not restated.** CLAUDE.md loads into custom subagents
  (authoring §11), so `code-commenting` and no-Claude-attribution arrive with it;
  restating them here would be redundant. This is why the manager's current
  per-prompt injection of them becomes unnecessary for this agent.
- **Report shape deviates from the critic family.** An implementer produces work,
  not findings, so the `Target · Verdict · Problems` shape does not fit. Uses the
  site-factory orchestration doc's `Done / Decisions / Deviations / Open`, plus a
  `Build` line because this agent self-verifies (it has the shell blackbox lacks).
  The SKILL's "Reports — demand and consume" section has no implementer entry yet;
  add one when this promotes.
- **Model `sonnet`** matches the tester workers: implementation is substantial,
  but the manager has already cut and specced the unit, so it does not need
  opus-tier planning. Tune after a real run.

## Open questions

- **Run the acceptance suite, or only build/typecheck?** The draft allows running
  the suite read-only as a self-check while forbidding any test edit. The
  alternative is to leave the suite entirely to the manager and have the
  implementer verify only build/typecheck. Confirm intended before promotion.
- **Worktree lifecycle is the manager's, not the agent's.** This definition
  assumes the manager creates the worktree, points the spawn at it, and merges;
  the agent only obeys "stay in it, don't run git." Confirm the SKILL spells out
  worktree create/merge/cleanup on the manager side.
