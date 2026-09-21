---
name: simplify-audit
description: >
  Systematically reduce redundancy and over-complication across an existing
  codebase, one file at a time, tracked across sessions. Use ONLY when the user
  runs /simplify-audit <scan|plan|apply> - for the current diff use /simplify.
disable-model-invocation: true
---

# Simplify Audit

Walk the codebase for redundancy and over-complication with `simplicity-adviser`,
then apply the fixes one file at a time, running the test suite and committing
between files. Resumable across sessions through the state files.

## State files

- `.claude/skills/simplify-audit/files.json` - source inventory + project config
- `.claude/skills/simplify-audit/findings.md` - pending findings and blockers

Outside apply mode, these two files are the ONLY files this skill may write.

## Scope of changes

- This skill changes production code. Every change lands in one file, is verified
  by that root's test suite, and is committed before the next file.
- Apply only what a finding names: the cited lines and the stated direction,
  nothing more. No unrelated refactors.
- Simplicity axis only by default. To also run `correctness-adviser`, pass a
  spec: `/simplify-audit plan <file> --spec <path>`. No spec, no correctness pass.
- No new dependencies. No public API or exported-signature change unless a finding
  is explicitly about a dead export.
- When editing, follow the `code-commenting` skill.

## Constraints (all modes)

- Match existing conventions: read the target file and 1-2 neighbors before
  changing anything.
- The only commands this skill runs: the test command from `files.json` config,
  `git restore <file>` to undo a failed apply, and the `git-commit` skill (apply
  mode only). No other git, no dev servers, nothing else.
- Never widen a symbol's visibility to make a simplification land.

## Mode selection

Argument `scan`, `plan`, or `apply` selects the mode.
If the user names a file alongside the command, run plan then apply for that file
only, skipping the queue order.
No argument and no named file: ask which mode to run. Read no files first.

## Mode: scan - build or update the file inventory

1. Detect project config (first scan only), store under `"config"` in `files.json`.
   If the repo has several source roots (e.g. backend and frontend), ask which to
   include and store one block per root. Per root:
   - Source root path and language.
   - Test command that runs the whole root's suite, not a single-file filter (a
     simplification can span files). Confirm it from `CLAUDE.md`, `package.json`,
     or the `.csproj`.
2. Glob source files under each root and classify each by simplification payoff:
   - `high` - large modules, visible duplication clusters, hand-rolled utilities,
     deep nesting
   - `medium` - ordinary logic files
   - `skip` - generated code, migrations, config, type-only files, markup-only
     components, thin glue. Read a sample when the name is not enough.
   Record `skip` entries too, so later scans do not re-classify them.
3. Read `files.json` (missing -> `{}`). Add new files, leave existing entries
   untouched, drop entries whose file is gone. Write it, report the changes.

Schema, paths relative to repo root:
```json
{
  "config": {
    "KajitorApi": { "language": "csharp", "sourceRoot": "KajitorApi", "testCommand": "dotnet test" },
    "frontend": { "language": "typescript", "sourceRoot": "frontend/src", "testCommand": "npx vitest run" }
  },
  "files": {
    "backend/Services/LocalStorageService.cs": { "value": "high", "planned": null, "applied": null }
  }
}
```

## Mode: plan - collect findings, change no code

1. Read `files.json`. If missing or empty, run scan mode first.
2. Process files with `"planned": null`, highest value first, at most 5 per run.
   Spawn one `simplicity-adviser` per file (parallel is fine). Each prompt carries
   the file path, its source root, the project's shared/util locations, and the
   `CLAUDE.md` constraints. If `--spec <path>` was given and the doc describes this
   file's behavior, also spawn `correctness-adviser` with that spec.
3. Take the `Problems` from each report only. Append them to `findings.md` as one
   `##` block for the file, one bullet per problem, keeping its `tag`, `severity`,
   `claim`, `evidence`, and `direction` text. Set the file's `planned` date.
4. If an adviser returns route `redrive` (target unreachable, or no spec for
   correctness), record a `[BLOCKED]` block with the reason instead.
5. Report what was planned and what remains.

Entry format in `findings.md`, one `##` block per source file:

```markdown
## backend/Services/LocalStorageService.cs
- fix | medium | SaveAsync and DeleteAsync both build key -> path inline
  evidence: backend/Services/LocalStorageService.cs:20-31, 44-52
  direction: extract a private BuildPath(key), call it from both
- decide | low | IStorageService has one implementation, no second in sight
  evidence: backend/Services/IStorageService.cs:1-12
  direction: keep for the dev/prod swap, or inline into the caller
```

Blocked block, `[BLOCKED]` in the heading so apply mode skips it:

```markdown
## backend/Services/ClaudeParsingService.cs [BLOCKED]
- simplicity-adviser could not reach the target: <reason>
```

## Mode: apply - one source file per pass

1. Read `findings.md` with `limit: 30`. Find the first block with a `fix`-tagged
   finding. If there is none, report the pending `decide` findings and stop.
2. Read the source file and 1-2 neighbors. Apply every `fix`-tagged finding in
   that block exactly as its `direction` states, nothing more. Do not touch
   `decide`-tagged findings.
3. Run the test command for the file's root.
   - Pass: continue.
   - Fail: `git restore` the file, mark those findings `FAILED:` in `findings.md`
     with the error, go to step 6.
4. On pass: invoke the `git-commit` skill for the change. Confirm the commit
   message with the user and get an OK before it commits.
5. After the commit: delete the applied findings from `findings.md` and set the
   file's `applied` date in `files.json`.
6. If only `decide` or `FAILED:` findings remain in the block, add `[BLOCKED]` to
   its heading.
7. Report: findings applied, test result, whether the commit was made, any
   `decide` findings still waiting on the user, and how many blocks remain. Then
   stop and wait for approval before the next file.
