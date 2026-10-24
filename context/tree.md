<!-- See `.claude/skills/read/SKILL.md`, which reads this file's matching `##`
     section instead of `find`/`ls`/glob sweeps. -->

# File tree

Every tracked file in the repo, one entry each, written from reading that file in
full, except the files listed under "Not read, partly read, not mapped" below. No
folder shortcuts: a folder is "done" only when each file in it has its own line.

Each area is one indented tree: folders first, then files alphabetically, purpose
after the name.

Search this file for a path or area. Never read it whole or at session start.

When a file is added, removed, renamed, or largely edited, update its entry in the
same change.

Entry standard: one line, purpose only - what the file is for, not how it works. A
test file gets one clause for the behaviour it guards, no case lists. Never name
internal functions, branches, or another file's details. Add a detail only if a
reader could not find the file without it.

## Not read, partly read, not mapped

Read this before trusting an entry. Every file below is also marked on its own
line in the trees, with the words NOT READ or PARTLY READ.

**Tracked but NOT READ (a deny rule blocks reading them).** The entry for each is
from its name and from other docs, not from its contents.

| File | Blocked by |
|---|---|

**Tracked but only PARTLY read.** The entry describes what the file is, not what
is in every line.

| File or folder | What was read |
|---|---|
| `reusables/frontend/package-lock.json` | first 40 lines |
| `.claude/skills/owasp-guard/cache/` (48 OWASP cheat sheets) | first heading of each; `last_updated.json` in full |

**NOT MAPPED: git-ignored or untracked local files.** These exist on this machine
only. They are not in any tree below and were not read.

- Secrets and local config: `.devcontainer/.env`
- Session and Claude local state: `memory/`, `docs/session/baton.md`, `docs/notes.md`, `.github/drafts/`
- Build output and dependencies: `reusables/frontend/node_modules/`
- Per-subagent / per-session scratch: `.agent-scope/`, `.impl-worktrees/`, `build-orchestration/prompt-log/*` (except `README.md` and `_template.md`, tracked and in the tree below), `build-orchestration/strike-count.md`, `build-orchestration/route-block-count`

## Progress

Resume at the first `not started` row. Do not re-read a `done` folder unless its
files changed.

| Area | State | Note |
|---|---|---|
| `build-orchestration/` | done | all 3 files |
| `.claude/` | done | all files mapped; the 48 OWASP cheat sheets PARTLY READ (first heading only), see above |
| `context/` | done | the 5 skeleton docs marked unfilled; `tree.md` is this file |
| `.devcontainer/` | done | all 6 files |
| `docs/` | done | all files mapped; most entries read in part, not line by line - re-verify before relying on specifics |
| `examples/` | done | all files across `stack/` (6 stacks) and `cicd/` (3 pipelines + dependabot baseline), leaning on each folder's own README |
| `.github/` | done | the 1 tracked file |
| `reusables/` | done | all files; spot-checked against description, not every file individually re-read this pass |
| `scripts/` | done | both files |
| root files (`CLAUDE.md`, `CONTEXT.md`, `README.md`, `LICENSE`, `.editorconfig`, `.gitignore`, `REUSABLES.md`) | done | all 7 |

## build-orchestration/

```
build-orchestration/
├── build-log/
│   └── README.md    rules for the per-session build log written by the manager: chosen options, decisions with reasons, how pieces connect, accepted risks; everything else is cut
└── prompt-log/
    ├── README.md     rules for the prompt log (log only, off limits to subagents, verbatim capture, evaluate later), entry ID scheme, and the formats of evaluations.md and allocation.md; only this README and the template are tracked
    └── _template.md  capture template for one session: header, verbatim prompt, verbatim follow-ups, trimmed outcome (format, test result, deviations, open items)
```

## .claude/

```
.claude/
├── agents/
│   ├── alternatives-explorer.md      read-only subagent (sonnet) that takes an idea plus its known problems and proposes 2 to 4 alternatives with cited evidence, marking each constraint avoided, reduced or inherited; report always routes accept
│   ├── blackbox-tester.md            subagent (sonnet) that writes spec-derived tests without reading source, confined to .agent-scope/ by the agent-scope-jail hook; report routes accept, decide or redrive
│   ├── change-discipline-adviser.md  read-only subagent (sonnet) that judges a diff against its task mandate for weakened tests, widened visibility, scope creep and symptom patches, and gives a fix direction per finding
│   ├── change-discipline-critic.md   same change-discipline review as the adviser but reports problems only, with no fix directions; routes accept, fix or redrive
│   ├── correctness-adviser.md        read-only subagent (opus) that finds wrong results and spec divergence in a landed implementation and gives a correctness-only fix direction per problem
│   ├── correctness-critic.md         same correctness review as the adviser but reports problems only; routes accept, fix or redrive
│   ├── debugger.md                   subagent (opus) that reproduces one failure and finds its root cause without fixing or writing tests; Bash is fenced by the git-readonly-jail hook; routes fix, decide, fix+decide or redrive
│   ├── design-adviser.md             read-only subagent (opus, with web tools) that finds design flaws in an idea or implementation (need, redundancy, convention, complexity, behaviour) and gives a design-only fix direction
│   ├── design-critic.md              same design review as the adviser but reports problems only
│   ├── docs-adviser.md               read-only subagent (sonnet) that finds doc-versus-code gaps (contradiction, missing, stale, broken references) against the project commenting standard and gives a doc-only fix direction
│   ├── docs-critic.md                same documentation review as the adviser but reports problems only
│   ├── implementer.md                subagent (sonnet) that builds one bounded unit of source files and verifies the build; no tests, no files outside the unit, and the no-git-jail hook bans every git command; routes accept, decide, accept+decide or redrive
│   ├── legal-adviser.md              read-only subagent (sonnet, with web tools) that flags licence conflicts, missing attribution, provenance and personal-data handling as risks (not legal advice) and gives a legal-only fix direction
│   ├── legal-critic.md               same legal and compliance risk review as the adviser but reports risks only
│   ├── mcdc-tester.md                subagent (sonnet) that writes MC/DC test pairs for named compound boolean decisions, runs the suite and reports bugs without touching source; Bash is fenced by the git-readonly-jail hook
│   ├── performance-adviser.md        read-only subagent (sonnet) that finds complexity, N+1, memory and I/O costs with the scale at which they bite and gives a performance-only fix direction
│   ├── performance-critic.md         same performance review as the adviser but reports problems only
│   ├── researcher.md                 read-only subagent (sonnet, with web tools) that answers one research question with every claim cited to an opened source; routes accept, or decide when the task is ambiguous
│   ├── security-adviser.md           read-only subagent (opus, with web tools) that finds security flaws in an idea or implementation with an exploit scenario each, and gives a security-only fix direction
│   ├── security-critic.md            same security review as the adviser but reports problems only
│   ├── simplicity-adviser.md         read-only subagent (sonnet) that finds duplication, reinvention, dead code and needless abstraction and gives a one-line simpler form per finding
│   ├── simplicity-critic.md          same simplicity review as the adviser but reports problems only
│   ├── verifier.md                   read-only subagent (sonnet, with web tools) that checks every claim in a researcher report against its cited source and returns pass or fail per claim
│   └── whitebox-tester.md            subagent (sonnet) that adds code-driven tests for branches, boundaries and error paths the black-box suite cannot reach, runs the full suite and parks bug-exposing tests as xfail; Bash is fenced by the git-readonly-jail hook
├── hooks/
│   ├── agent-scope-jail.sh   PreToolUse hook wired to blackbox-tester: denies any Read, Edit or Write outside $CLAUDE_PROJECT_DIR/.agent-scope/ and fails closed when jq or the project dir is missing
│   ├── coauthor-guard.sh     PreToolUse Bash hook that denies Claude attribution in git history: co-author trailers, generated-with lines, author or committer identity overrides and commit messages read from a file; fails open without jq
│   ├── env-file-guard.sh     PreToolUse Bash hook that denies any command naming a file holding secrets (.env*, appsettings.<Env>.json, creds.json, docker-compose.override.yml, /etc/secrets), closing the gap where permissions.deny only covers the Read tool; matches by grep on the raw payload, so it works without jq
│   ├── fetch-guard.sh        PreToolUse Bash hook that allows only the exact command "git fetch origin main" and denies every other command that transfers from a remote; fails open without jq
│   ├── gh-guard.sh           PreToolUse Bash hook, a default-deny allowlist for the gh CLI: pr create/edit/list, issue create/edit/view, label create/edit/list, repo view and a bare issue list; fails open without jq
│   ├── git-readonly-jail.sh  PreToolUse Bash hook wired to debugger, whitebox-tester and mcdc-tester: every git call must be a read-only subcommand, dual-mode names are blocked, and it fails closed without jq
│   ├── memory-path-guard.sh  PreToolUse hook that denies writes to the harness auto-memory path and asks before writes into the repo memory/ store; fails open without jq
│   ├── no-git-jail.sh        PreToolUse Bash hook wired to implementer: denies any git invocation (including quoted, escaped and wrapper-prefixed forms) because its worktree hides the tests but shares the object store; fails closed without jq
│   ├── probe-guard.sh        PreToolUse Bash hook enforcing "read docs before probing": denies inline interpreter scripts, heredoc scripts, schema introspection and reads into package caches, and lets a probe through only with a probe-ok marker that is checked against the session transcript for real doc reads and a user reply; fails open without jq
│   ├── repo-root-jail.sh     PreToolUse hook for Write, Edit, MultiEdit and NotebookEdit: denies targets outside the project dir and the session scratchpad after resolving symlinks, and fails closed on a missing jq, project dir or path
│   ├── route-guard.sh        SubagentStop hook that validates a subagent's final report against route-spec.json (envelope, route token, sections, per-route assertions), blocks up to twice per agent id, then fails open
│   └── route-spec.json       machine-readable report contract used by route-guard.sh: for each of the 14 orchestrated agents, the report sections and the legal routes with the assertions each route must satisfy
├── rules/
│   └── example.md  path-scoped rules template stub: front matter with a placeholder `paths: <backend-dir>/**` and no body text; copy per area (backend/frontend/tests) and replace the placeholders
├── scripts/
│   └── agent-worktree.sh  manager-side script giving a Bash subagent its own git worktree: add (optionally pruning test dirs), audit and merge against a permitted path set, remove, and start and finalize to stamp and collapse the session's scaffold commits
├── skills/
│   ├── browser-relay-verification/
│   │   └── SKILL.md  skill: before any WebFetch or WebSearch for an external fact, use a citation in hand, else one attempt only if the repo records the domain fetched cleanly, else hand a self-contained research prompt to the user and vet their reply
│   ├── build-orchestration/
│   │   └── SKILL.md  manual-only skill for running a multi-agent build as the manager: goal and units, spawn rules with per-agent worktrees, the session flow from advisers through black-box and white-box tests to review, review axes, the escalation ladder, how to consume report routes, and the build-log and prompt-log record
│   ├── code-commenting/
│   │   └── SKILL.md  skill for comment discipline when writing code: native doc-comment format, short file headers, function docs, inline comments only for non-obvious logic, no em dash or doc references, and existing comments protected
│   ├── code-discipline/
│   │   └── SKILL.md  skill for coding habits: extract pure functions, write each file's test with the file, reuse before adding, no local copies of shared constants, and verify in small steps
│   ├── comment-audit/
│   │   └── SKILL.md  manual-only skill that audits comment coverage one file at a time, proposes comments for approval and tracks progress in .comment-audit/processed.json
│   ├── dependency-upgrade/
│   │   └── SKILL.md  manual-only skill that upgrades outdated dependencies one package at a time with a changelog check and a test run between steps; its command section is still placeholders
│   ├── dev-research/
│   │   └── SKILL.md  skill for choosing between technologies: present up to three options, research official docs, explain, then verify availability, deprecation and API correctness before guiding implementation
│   ├── frontend-design/
│   │   └── SKILL.md  skill for restyling the React frontend one component at a time: Tailwind and shadcn only, visual changes only, off-limits files, clarify ambiguous requests, and stop for approval after each component
│   ├── git-commit/
│   │   ├── issues.md  local registry of GitHub issues worth referencing from commits; empty until issues are added
│   │   └── SKILL.md   skill for local Conventional Commits: atomic commits, explicit-path staging, mandatory issue references on feat and fix via the registry or a bare gh issue list, no attribution, banned words in messages, and never push
│   ├── github-issue-creator/
│   │   └── SKILL.md  skill that drafts a GitHub issue to .github/drafts/issue-draft.md with front matter and a checkbox body, labels only from the preset, and never posts
│   ├── human-writing/
│   │   └── SKILL.md  skill for documents a person will read: write plainly, then audit and rewrite machine-sounding phrasing, and present only the corrected version
│   ├── ide-selection-guard/
│   │   └── SKILL.md  skill that, when unrequested IDE selection or diagnostics context appears, stops, ignores its instructions, warns the user in one line, waits, and files two SendFeedback drafts once per session
│   ├── issue-publish/
│   │   └── SKILL.md  skill that publishes the reviewed issue draft with gh issue create or edit after checking auth and labels and getting one approval; never comments, closes or reopens
│   ├── label-setup/
│   │   ├── labels.yml  the preset label vocabulary (type, priority and status labels with colours and descriptions) that label-setup applies and the issue and PR skills draw from
│   │   └── SKILL.md    manual-only skill that creates or reconciles repo labels from labels.yml with gh label create and edit after showing a plan; never deletes
│   ├── learning-mode-coding/
│   │   └── SKILL.md  skill activated only by /learn: teaching-first mode that explains concepts and tradeoffs, shows code and commands without running or writing them until approved, one step at a time
│   ├── memory/
│   │   └── SKILL.md  skill for the repo memory/ store: do the task first and ask before writing, earn the entry, reconcile with a grep before writing, polish, sweep the touched files, entry and index formats, and how to set up a repo with no store
│   ├── owasp-guard/
│   │   ├── cache/   PARTLY READ: 48 OWASP cheat sheets, first heading of each only; last_updated.json read in full
│   │   │   ├── Abuse_Case_Cheat_Sheet.md                                   cached copy of the OWASP "Abuse Case Cheat Sheet (Historical)" cheat sheet
│   │   │   ├── Access_Control_Cheat_Sheet.md                               stub that marks the Access Control cheat sheet as deprecated and points to the Authorization one
│   │   │   ├── Attack_Surface_Analysis_Cheat_Sheet.md                      cached copy of the OWASP "Attack Surface Analysis Cheat Sheet" cheat sheet
│   │   │   ├── Authentication_Cheat_Sheet.md                               cached copy of the OWASP "Authentication Cheat Sheet" cheat sheet
│   │   │   ├── Authorization_Cheat_Sheet.md                                cached copy of the OWASP "Authorization Cheat Sheet" cheat sheet
│   │   │   ├── Content_Security_Policy_Cheat_Sheet.md                      cached copy of the OWASP "Content Security Policy Cheat Sheet" cheat sheet
│   │   │   ├── Credential_Stuffing_Prevention_Cheat_Sheet.md               cached copy of the OWASP "Credential Stuffing Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.md        cached copy of the OWASP "Cross-Site Request Forgery Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Cross_Site_Scripting_Prevention_Cheat_Sheet.md              cached copy of the OWASP "Cross Site Scripting Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Cryptographic_Storage_Cheat_Sheet.md                        cached copy of the OWASP "Cryptographic Storage Cheat Sheet" cheat sheet
│   │   │   ├── Denial_of_Service_Cheat_Sheet.md                            cached copy of the OWASP "Denial of Service Cheat Sheet" cheat sheet
│   │   │   ├── Dependency_Graph_SBOM_Cheat_Sheet.md                        cached copy of the OWASP "Dependency Graph & SBOM Best Practices Cheat Sheet" cheat sheet
│   │   │   ├── Deserialization_Cheat_Sheet.md                              cached copy of the OWASP "Deserialization Cheat Sheet" cheat sheet
│   │   │   ├── Docker_Security_Cheat_Sheet.md                              cached copy of the OWASP "Docker Security Cheat Sheet" cheat sheet
│   │   │   ├── DOM_based_XSS_Prevention_Cheat_Sheet.md                     cached copy of the OWASP "DOM based XSS Prevention Cheat Sheet" cheat sheet
│   │   │   ├── DOM_Clobbering_Prevention_Cheat_Sheet.md                    cached copy of the OWASP "DOM Clobbering Prevention Cheat Sheet" cheat sheet
│   │   │   ├── DotNet_Security_Cheat_Sheet.md                              cached copy of the OWASP "DotNet Security Cheat Sheet" cheat sheet
│   │   │   ├── Error_Handling_Cheat_Sheet.md                               cached copy of the OWASP "Error Handling Cheat Sheet" cheat sheet
│   │   │   ├── Forgot_Password_Cheat_Sheet.md                              cached copy of the OWASP "Forgot Password Cheat Sheet" cheat sheet
│   │   │   ├── HTML5_Security_Cheat_Sheet.md                               cached copy of the OWASP "HTML5 Security Cheat Sheet" cheat sheet
│   │   │   ├── HTTP_Headers_Cheat_Sheet.md                                 cached copy of the OWASP "HTTP Security Response Headers Cheat Sheet" cheat sheet
│   │   │   ├── HTTP_Strict_Transport_Security_Cheat_Sheet.md               cached copy of the OWASP "HTTP Strict Transport Security Cheat Sheet" cheat sheet
│   │   │   ├── Injection_Prevention_Cheat_Sheet.md                         cached copy of the OWASP "Injection Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Input_Validation_Cheat_Sheet.md                             cached copy of the OWASP "Input Validation Cheat Sheet" cheat sheet
│   │   │   ├── Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.md  cached copy of the OWASP "Insecure Direct Object Reference Prevention Cheat Sheet" cheat sheet
│   │   │   ├── JSON_Web_Token_Cheat_Sheet.md                               cached copy of the OWASP "JSON Web Token Cheat Sheet" cheat sheet
│   │   │   ├── Key_Management_Cheat_Sheet.md                               cached copy of the OWASP "Key Management Cheat Sheet" cheat sheet
│   │   │   ├── last_updated.json                                          per-sheet commit SHA and fetch time for each cached cheat sheet, used by owasp-guard and owasp-update to judge staleness
│   │   │   ├── LDAP_Injection_Prevention_Cheat_Sheet.md                    cached copy of the OWASP "LDAP Injection Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Logging_Cheat_Sheet.md                                      cached copy of the OWASP "Logging Cheat Sheet" cheat sheet
│   │   │   ├── Logging_Vocabulary_Cheat_Sheet.md                           cached copy of the OWASP "Application Logging Vocabulary Cheat Sheet" cheat sheet
│   │   │   ├── Mass_Assignment_Cheat_Sheet.md                              cached copy of the OWASP "Mass Assignment Cheat Sheet" cheat sheet
│   │   │   ├── Microservices_Security_Cheat_Sheet.md                       cached copy of the OWASP "Microservices Security Cheat Sheet" cheat sheet
│   │   │   ├── Multifactor_Authentication_Cheat_Sheet.md                   cached copy of the OWASP "Multifactor Authentication Cheat Sheet" cheat sheet
│   │   │   ├── NodeJS_Docker_Cheat_Sheet.md                                cached copy of the OWASP "Node.js Docker Cheat Sheet" cheat sheet
│   │   │   ├── Nodejs_Security_Cheat_Sheet.md                              cached copy of the OWASP "NodeJS Security Cheat Sheet" cheat sheet
│   │   │   ├── NPM_Security_Cheat_Sheet.md                                 cached copy of the OWASP "NPM Security best practices" cheat sheet
│   │   │   ├── OS_Command_Injection_Defense_Cheat_Sheet.md                 cached copy of the OWASP "OS Command Injection Defense Cheat Sheet" cheat sheet
│   │   │   ├── Password_Storage_Cheat_Sheet.md                             cached copy of the OWASP "Password Storage Cheat Sheet" cheat sheet
│   │   │   ├── Prototype_Pollution_Prevention_Cheat_Sheet.md               cached copy of the OWASP "Prototype Pollution Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Query_Parameterization_Cheat_Sheet.md                       cached copy of the OWASP "Query Parameterization Cheat Sheet" cheat sheet
│   │   │   ├── REST_Security_Cheat_Sheet.md                                cached copy of the OWASP "REST Security Cheat Sheet" cheat sheet
│   │   │   ├── Secrets_Management_Cheat_Sheet.md                           cached copy of the OWASP "Secrets Management Cheat Sheet" cheat sheet
│   │   │   ├── Secure_Product_Design_Cheat_Sheet.md                        cached copy of the OWASP "Secure Product Design Cheat Sheet" cheat sheet
│   │   │   ├── Securing_Cascading_Style_Sheets_Cheat_Sheet.md              cached copy of the OWASP "Securing Cascading Style Sheets Cheat Sheet" cheat sheet
│   │   │   ├── Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md       cached copy of the OWASP "Server-Side Request Forgery Prevention Cheat Sheet" cheat sheet
│   │   │   ├── Session_Management_Cheat_Sheet.md                           cached copy of the OWASP "Session Management Cheat Sheet" cheat sheet
│   │   │   ├── Software_Supply_Chain_Security_Cheat_Sheet.md               cached copy of the OWASP "Software Supply Chain Security" cheat sheet
│   │   │   └── SQL_Injection_Prevention_Cheat_Sheet.md                     cached copy of the OWASP "SQL Injection Prevention Cheat Sheet" cheat sheet
│   │   ├── references/
│   │   │   ├── csharp.md      routing map from OWASP Top 10:2025 categories to the cheat sheets to load for C# and ASP.NET Core, plus detection signals and the NuGet ecosystem name for OSV lookups
│   │   │   ├── go.md          same routing map for Go projects
│   │   │   ├── java.md        same routing map for Java projects (Spring Boot and Jakarta EE)
│   │   │   ├── javascript.md  same routing map for JavaScript and TypeScript projects (Node, Express, React)
│   │   │   └── python.md      same routing map for Python projects (Django, Flask, FastAPI)
│   │   └── SKILL.md     automatic skill that checks security-relevant code against OWASP Top 10:2025 using the cached cheat sheets, reports violations with a citation, and verifies any suggested package for maintenance and CVEs via OSV.dev before recommending it
│   ├── owasp-scan/
│   │   └── SKILL.md  skill that scans one file on demand against OWASP Top 10:2025 using the cached cheat sheets, records cross-file connections to follow up, and keeps a findings.json record; it may write only that file
│   ├── owasp-update/
│   │   └── SKILL.md  manual-only skill that detects the project language and refreshes the cached OWASP cheat sheets from the OWASP repository using blob SHAs, with a 90-day timestamp fallback
│   ├── plan-impl/
│   │   └── SKILL.md  skill that turns a product plan (all entries at least ai-audited) into a rough docs/plans/<slug>/impl.md with maturity and verification marks per step, a human-owned Status table, admitted risks and Open items
│   ├── plan-product/
│   │   └── SKILL.md  skill that drafts docs/plans/<slug>/product.md from an idea with maturity-marked fields, EARS requirements, decisions and admitted open questions, plus audit passes toward the plan-impl gate
│   ├── plan-verify/
│   │   └── SKILL.md  manual-only skill that verifies an impl.md step by step against source and current docs, attaches proof marks, and lands and deletes settled risks
│   ├── pr-draft/
│   │   └── SKILL.md  skill that drafts a pull request title, base, labels and body from local git history into .github/drafts/pr-draft.md after confirming the base is fresh; never pushes or uses gh
│   ├── pr-publish/
│   │   └── SKILL.md  skill that opens or edits a draft pull request with gh from the reviewed draft after checking the branch is pushed, labels exist and the user approves the command; never merges or pushes
│   ├── read/
│   │   └── SKILL.md  skill run after the user confirms a task: read every relevant doc and source file in full (not by grep), finding them from the matching context/tree.md section, and state what was read before planning or editing
│   ├── release-notes/
│   │   └── SKILL.md  skill that drafts a changelog entry from read-only git history between two refs into .github/drafts/release-notes.md, matching any existing changelog format
│   ├── responsive-layout/
│   │   └── SKILL.md  skill with scan, audit and fix modes that find and fix Tailwind layout breakage at 320px width, one issue per fix pass, with no functional changes
│   ├── session-end/
│   │   └── SKILL.md  manual-only skill that overwrites docs/session/baton.md with the session summary, goal, single next task and read-first doc, runs the plan-doc lint and offers trim-plan, then updates the context/tree.md entries for files changed this session
│   ├── session-start/
│   │   └── SKILL.md  manual-only skill that reads the baton and memory index, restates the goal and next task, and waits for confirmation before invoking the read skill
│   ├── session-wrapup/
│   │   └── SKILL.md  manual-only skill that updates docs/progress.md, reports uncommitted and unpushed git state, lists decisions and open threads, offers to land them in plan docs and run the plan lint, then updates the context/tree.md entries for files changed this session
│   ├── simplify-audit/
│   │   └── SKILL.md  manual-only skill with scan, plan and apply modes that audits for redundancy with simplicity-adviser and applies fix-tagged findings one file per pass, running the test suite and committing between files
│   ├── systematic-debugging/
│   │   └── SKILL.md  skill for diagnosing bugs: reproduce first, isolate one variable at a time, hypothesize with a falsifying check, then make the smallest fix and confirm against the original reproduction
│   ├── trim-plan/
│   │   └── SKILL.md  skill that trims a plan doc back to the template using scripts/plan-lint.sh findings: land and delete resolved questions and risks, cut implementation story from step bodies, never touch Status rows, marks or decisions
│   └── unit-tests/
│       └── SKILL.md  manual-only skill with scan, plan and write modes that adds unit tests one source file at a time, never touching production code and running only the scoped test command
├── settings.json        shared project settings: no commit or PR attribution, allowed read-only git and an allowlist of gh commands, git commit asks, denied secret reads and destructive git and gh forms, and the hook wiring (Bash guards including env-file-guard, repo-root-jail and memory-path-guard for file tools, route-guard on SubagentStop)
└── settings.local.json  local permission allowlist granting bare WebSearch, no domain restrictions
```

## context/

```
context/
├── architecture.md    skeleton for the parts/seams map; unfilled until the architecture settles
├── direction.md       skeleton for trajectory and deferrals; unfilled
├── invariants.api.md  skeleton for backend rule categories; unfilled
├── invariants.ui.md   skeleton for frontend rule categories; unfilled
├── product.md         skeleton for what the app is and who it serves; unfilled
└── tree.md            this file: every file in the repo, one entry each, plus the Progress table
```

## .devcontainer/

```
.devcontainer/
├── .env.example          empty placeholder env template; fill once a stack's own .env.example is merged in
├── devcontainer-lock.json  pins the three dev container features (Node, Claude Code, GitHub CLI) to digests
├── devcontainer.json       generic dev container: app service, Node/Claude Code/GitHub CLI features, `<placeholder>` forwardPorts/mounts/extensions/env for a stack to fill in
├── docker-compose.yml      generic compose: single app service with firewall capabilities and the shared claude-credentials volume; stack services/volumes are placeholders
├── Dockerfile              generic debian base image plus firewall tools only; swap the base image and add stack packages per examples/<stack>/
└── project-firewall.sh     default-deny outbound firewall run on every container start: DNS, SSH, localhost, GitHub ranges, a short baseline allowlist (Anthropic, npm, OSV); blocks IPv6; self-checks that example.com is unreachable and the GitHub API is reachable
```

## docs/

```
docs/
├── agents/
│   ├── drafts/
│   │   ├── alternatives-explorer.md  runs after the critics; explores alternative approaches that avoid the reported problems
│   │   ├── blackbox-tester.md        writes tests from the spec alone, never reading the implementation; spawned at session start
│   │   ├── change-discipline-critic.md  judges a diff against its mandate: scope creep, weakened tests, visibility widened for testing, symptom-patching
│   │   ├── correctness-critic.md     finds logic errors, missed edge cases, and contract violations in the implementation
│   │   ├── debugger.md               diagnoses the root cause of a reproduced failure and reports it; does not fix
│   │   ├── design-critic.md          argues why an idea or implementation is bad design, non-standard, or unwanted
│   │   ├── docs-critic.md            finds missing, inaccurate, or out-of-date documentation and comments
│   │   ├── implementer.md            builds one bounded unit from its spec and verifies the build passes; writes source only, never tests, never outside its unit
│   │   ├── legal-critic.md           finds licensing, attribution, and data-handling/compliance risks
│   │   ├── mcdc-tester.md            optional; designs MC/DC decision-coverage cases for units with dense boolean logic
│   │   ├── performance-critic.md     finds performance and efficiency problems: bad complexity, needless work, resource waste
│   │   ├── researcher.md             executes one research task, reports back with a verifiable reference on every claim
│   │   ├── security-critic.md        finds security risks and holes in an idea or implementation
│   │   ├── simplicity-critic.md      finds redundant logic, over-complication, dead code, and duplication
│   │   ├── verifier.md               adversarially checks a researcher report, pass/fail per claim with its own evidence
│   │   └── whitebox-tester.md        after code lands, adds tests for internal branches, boundaries, and error paths, then runs the suite
│   ├── authoring.md  the authoring/promotion reference for .claude/agents/ subagents: draft anatomy (Status, Purpose, Definition, Design notes), what promotes, and the polish process
│   └── README.md     index of agent drafts with one-line purpose each, by role (builder, testers, review-layer critics, advisory); only authoring.md and the promoted .claude/agents/ files are active
├── permissions/
│   ├── README.md               index of versioned permission presets (documentation only, not active): what each allows, denies, and the hook it needs
│   ├── v0-baseline-strict.md   the policy the seed shipped with: status/diff allowed silently, add/commit prompt, all remote and branch operations hard-blocked
│   ├── v1-allow-git-reads.md   v0 plus silent git log/show/rev-parse/ls-remote and explicit-path git add; bulk and force add forms hard-denied, commit stays at ask
│   ├── v2-fetch-origin-main.md  v1 plus the exact command git fetch origin main allowed silently; every other fetch form hard-denied by the fetch-guard.sh hook
│   ├── v3-no-coauthor.md       v2 permissions unchanged; the coauthor-guard.sh hook denies any command carrying a Co-Authored-By trailer or the Claude author identity
│   └── v4-gh-allowlist.md      opens the GitHub CLI for the first time: eleven gh forms allowed silently, everything else hard-denied by the gh-guard.sh hook
├── plans/
│   ├── idea-shaping/
│   │   └── product.md  idea plan for a voice-to-product-plan pipeline: record a spoken idea, transcribe and organize it, ask about unclear parts, hand it off once well-formed
│   ├── promotion-engine/
│   │   └── product.md  idea plan for a reusable product-promotion engine: register a product, work out who to reach, draft channel-appropriate content on a cadence
│   ├── reusables-candidates/
│   │   ├── implementation-order.md  round 1 status log for populating reusables/: test infra setup and which candidate entries are done, by phase
│   │   └── proposal.md              round 1 proposal of reusables/ candidates to accept or reject one by one, entries that build on each other, and later rounds to explore
│   ├── site-factory/
│   │   ├── catalog.md     v1 pattern catalog: which site sections ship at Level 1, and the day-cost cutoff rule for the cut
│   │   ├── decisions.md   recommendations for site-factory's nine open questions, each awaiting promotion through product.md's maturity scheme
│   │   ├── ideas.md       uncommitted idea pool for site-factory beyond the v1 catalog, tagged by cost and phase
│   │   ├── impl.md        implementation plan for site-factory, verified against official sites via domain-restricted search
│   │   ├── intake.md      site-factory's content-intake design: a Zod schema per section as the single source of truth, mirrored by the client questionnaire
│   │   ├── level-2.md     contract that site-factory's Phase 3 dynamic services must support, while the site itself stays static
│   │   ├── operations.md  site-factory's delivery and operations proposal: client lifecycle, per-tier obligations, and how delivered sites survive over time
│   │   └── product.md     ai-audited plan for site-factory, linking out to its detail docs (decisions, catalog, intake, operations, level-2)
│   ├── site-prospector/
│   │   └── product.md  idea plan for a lead-prospecting tool: find outdated or broken sites, score them as leads for a web-building service
│   ├── verify-fanout/
│   │   ├── impl.md     implementation plan for verify-fanout: a standalone headless-Claude container running a research-manager that dispatches researcher subagents
│   │   └── product.md  settled product plan for verify-fanout: a managed multi-agent workflow that checks every external claim in an impl.md against its cited source
│   └── .gitkeep  keeps docs/plans/ tracked when empty of files
├── reference/
│   ├── project-specific/
│   │   ├── ses-rejection-notes.md  worked example: timeline of an AWS SES production-access rejection and the move to a different email provider
│   │   └── stack-decisions.md     worked example: production stack decisions against AWS pricing checked on a fixed date; verify before reusing, pricing models shift
│   ├── Claude Code — WSL credential extraction.md  workaround for authenticating Claude Code inside a Dev Container with no browser: auth in WSL, extract the credentials file, inject it into the Docker volume
│   ├── Cookie storage for JWTs.md                  explainer on httpOnly refresh cookies versus localStorage, the end-to-end auth flow, and silent refresh with a concurrency lock
│   ├── deployment-setup.md                         reference for deploying a project: AWS infrastructure, secrets configuration, EC2 setup; see production-checklist.md for pre-launch hardening
│   ├── Dev Containers.md                           notes on Dev Containers and the Claude Code feature: spec links, key concepts, setup flow
│   ├── new-machine-setup.md                        setup steps on a new machine: fix git line endings, prerequisites, Dev Containers extension
│   ├── owasp-guard-skill-SETUP.md                  setup notes for the owasp-guard, owasp-update and owasp-scan skills: required folder layout and installation steps
│   ├── production-checklist.md                     generic step order for taking an app to production (auth, infra, config, logging); the worked AWS/.NET example is in project-specific/stack-decisions.md
│   ├── refresh tokens.md                           explainer on access versus refresh tokens, rotation and the jti claim
│   ├── Setup pipeline in EC2.md                     one-time EC2 setup for a CI/CD pipeline: Docker, Docker Compose, AWS CLI, app directory
│   └── Ssl tls production setup guide.md           concept reference for TLS with Let's Encrypt and Certbot on a production web server, using a worked EC2/nginx example
├── session/
│   └── template.md  template for the session baton file: this session, goal, next task and read-first sections
├── skills/
│   ├── build-orchestration-design-notes.md    the why behind the build-orchestration skill's design calls, companion to its SKILL.md
│   ├── build-orchestration-report-schemas.md  source of truth for every subagent's report route field and body schema, transcribed from the agent files; update together with any agent report edit
│   ├── feature-plan.md                        design ledger for the plan-product/plan-impl/plan-verify skills: designed but not yet built
│   ├── github-issue-creator-decisions.md      decision log for the github-issue-creator skill: what it drafts and why; publishing is the separate issue-publish skill
│   ├── new-skills.md                          the skill authoring and polish guide; read before adding or polishing any skill
│   ├── pr-issue-publish.md                    design ledger for the pr-publish, issue-publish and label-setup skills: scope of what each may write
│   ├── README.md                              index of the .claude/skills/ plan and decision docs, kept separate from docs/plans/ so tooling meta-docs don't mix with product plans
│   └── verify-fanout.md                       design for the verify-fanout multi-agent research workflow that checks an impl.md's external-verification items
├── notes-system.md  how a fact reaches the next session: the two auto-loaded files (CLAUDE.md, memory/MEMORY.md) versus everything else, pulled on demand
└── progress.md       template for the project status log: key decisions and in-progress items, one line each
```

`docs/notes.md` and `docs/session/baton.md` are gitignored local state - see "Not
mapped" above, not in this tree.

## examples/

```
examples/
├── cicd/
│   ├── dotnet-ec2-ecr/
│   │   ├── deploy.yml        test → build/push to ECR → EF Core migration over an SSH tunnel to RDS → SSH+Compose redeploy on EC2
│   │   ├── pr-checks.yml     merge gate: dotnet test, frontend build/lint/test as separate parallel jobs
│   │   ├── README.md         what each workflow does, the secrets it needs, and which values stay project-specific
│   │   └── renew-cert.yml    monthly cron that renews the Let's Encrypt cert only when it is within 30 days of expiry, then restarts containers
│   ├── dotnet-render/
│   │   ├── demo-reset.yml    daily cron plus manual trigger that calls the app's own API to reset demo data and purge unverified accounts
│   │   ├── deploy.yml        test → EF Core migration straight against Render Postgres → curl to Render's deploy hook; no ECR or SSH tunnel
│   │   ├── pr-checks.yml     same merge-gate shape as dotnet-ec2-ecr's
│   │   └── README.md         what each workflow does, the secrets it needs, and when to pick this over the EC2/ECR example
│   ├── tauri-desktop-release/
│   │   ├── build-windows.yml                  manual MSI-only build, for verifying the Windows path without a full multi-OS run
│   │   ├── flatpak-build.yml                   runs flatpak-builder against the repo's Flatpak manifest; can't run in a devcontainer (needs bubblewrap)
│   │   ├── flatpak-demo-video.yml              records a video of the built Flatpak under a virtual display, for a Flathub submission
│   │   ├── README.md                           what each workflow does, the shared build/cache pattern, and which values stay project-specific
│   │   ├── release-linux.yml                   manual Linux-only build and publish of the .deb for Flathub submission
│   │   ├── release-macos-apple-silicon.yml     manual arm64-only macOS build and publish; kept as a reference/fallback
│   │   ├── release-macos.yml                   manual universal-binary (Apple Silicon + Intel) macOS build and publish
│   │   ├── release-windows.yml                 manual Windows build and publish, merging its entry into the updater's shared latest.json
│   │   └── release.yml                         the real "build and publish everything at once" release: Windows, macOS and Linux, then one GitHub Release with a merged latest.json
│   ├── dependabot.yml   baseline Dependabot config: one package-ecosystem block per manifest, weekly, ignoring minor/patch bumps; `<placeholder>` block for the backend ecosystem
│   └── README.md        index of the cicd examples: what each folder is, its source project, and when dotnet-ec2-ecr/dotnet-render each apply
└── stack/
    ├── browser-extension/
    │   ├── scripts/
    │   │   ├── build.mjs           esbuild entry points for background/popup/content scripts, copies static assets, zips store builds
    │   │   └── storeManifest.mjs   strips dev-only hosts and the pinned key for store submissions, plus a Firefox manifest variant
    │   ├── manifest.json    MV3 dev manifest with `<placeholder>` tokens for name, key, domains, ports and icon filenames
    │   ├── package.json     tsc --noEmit for typechecking, esbuild for the build, vitest for tests; build/build:store/build:prod-local/build:firefox/watch scripts
    │   ├── README.md        states up front this is not a dev-container stack, lists the placeholder tokens and where each appears
    │   └── tsconfig.json    @types/chrome, noEmit true since esbuild transpiles, erasableSyntaxOnly for the TS 7 compiler
    ├── cpp/
    │   ├── devcontainer.json       fragments to copy: node feature (Claude Code needs it on this base image), cpptools-extension-pack; no forwardPorts since the GUI runs on the host
    │   ├── docker-compose.yml      single app service, no database; a commented stub marks where a second Node sync-server service would go
    │   ├── Dockerfile              JUCE example base image plus ninja, clang-tools, and JUCE 8.0.12 built and installed at image build time
    │   ├── project-firewall.sh     stack domain block: npm registry, OSV, VS Code marketplace; no C++-specific domains, since JUCE is fetched before the firewall exists
    │   └── README.md               how to merge this C++/JUCE example's dev-container pieces into the seed placeholders, and which values stay project-specific
    ├── dotnet/
    │   ├── .env.example            root-level secrets template (registry API keys) from the source app; keep the pattern, replace the keys
    │   ├── devcontainer.json       fragments to copy: forwardPorts for Kestrel HTTPS/HTTP, csdevkit and rest-client extensions; commented postCreateCommand still shows an older app's restore path
    │   ├── docker-compose.yml      single app service; optional env_file pulls the root .env into the container
    │   ├── Dockerfile              dotnet base image plus firewall tools and dotnet global tools on PATH; no db client, this stack has no database
    │   ├── project-firewall.sh     stack domain block: NuGet, dotnetcli, VS Code marketplace, plus two app-specific registry APIs as an example of whitelisting your own external calls
    │   └── README.md               how to merge this .NET-only example's dev-container pieces into the seed placeholders, and which values stay project-specific
    ├── dotnet-postgres/
    │   ├── reference/
    │   │   ├── ASP.NET Core backend.md  notes on enum validation with JsonStringEnumConverter, why AllowedHosts matters, where security headers live, and an xUnit concept map
    │   │   └── ASP.NET Identity.md      explainer on how ASP.NET Core Identity and JWT bearer fit together, what to build versus get free, why to skip MapIdentityApi, packages needed and reading links
    │   ├── .env.example            POSTGRES_* vars; copy to .devcontainer/.env and fill
    │   ├── devcontainer.json       fragments to copy: forwardPorts for backend/frontend/postgres, aspnet-https mount, Kestrel remoteEnv, postCreateCommand restore/install, csdevkit extension; frontend-node-modules mount left commented out as an opt-in Windows perf fix
    │   ├── docker-compose.yml      db (Postgres) service plus postgres-data and aspnet-https volumes alongside app
    │   ├── Dockerfile              dotnet base image plus postgresql-client, with dotnet-ef installed as the vscode user
    │   ├── project-firewall.sh     stack domain block: NuGet, VS Code marketplace, dotnetcli, shadcn
    │   └── README.md               how to merge this .NET + PostgreSQL example's dev-container pieces into the seed placeholders, which values stay project-specific, and the optional frontend-node-modules mount
    ├── node-vite/
    │   ├── devcontainer.json       fragments to copy: node feature, forwardPorts for the Vite dev server, npm install postCreateCommand, eslint/prettier/tailwindcss/vitest extensions
    │   ├── docker-compose.yml      single app service, no database; optional env_file for local secrets
    │   ├── Dockerfile              base:ubuntu-22.04 plus firewall tools only; Node comes from the devcontainer feature, not the image
    │   ├── project-firewall.sh     stack domain block: npm registry, VS Code marketplace, shadcn/ui
    │   └── README.md               how to merge this Node + Vite example's dev-container pieces into the seed placeholders, and which values stay project-specific
    ├── python-postgres/
    │   ├── .env.example            POSTGRES_* vars only; DATABASE_URL is built from them at shell start, no separate connection-string key
    │   ├── devcontainer.json       fragments to copy: forwardPorts for uvicorn/Vite/postgres, frontend-node-modules mount, postCreateCommand with a pyproject.toml existence guard, shell-env building an asyncpg DATABASE_URL
    │   ├── docker-compose.yml      db (Postgres) service plus postgres-data volume; Compose project name pinned to a `<project>` placeholder
    │   ├── Dockerfile              Python base image plus postgresql-client and firewall tools; uv installed by copying the pinned binary out of Astral's own image
    │   ├── project-firewall.sh     stack domain block: PyPI, npm registry, shadcn, VS Code marketplace, plus api.osv.dev for the owasp-* skills
    │   └── README.md               how to merge this FastAPI + PostgreSQL example's dev-container pieces into the seed placeholders, which values stay project-specific, and the backend dependency set for reference
    └── README.md    how each stack folder maps onto the seed's `.devcontainer/` placeholders, and the merge/delete workflow
└── README.md    top-level index: points to stack/ (dev-container setups) and cicd/ (pipelines); neither group is wired into anything
```

## .github/

```
.github/
└── PULL_REQUEST_TEMPLATE.md  PR body template: summary, related issues, notable decisions, test plan, a self-review checklist
```

`.github/drafts/` is gitignored local state - see "Not mapped" above, not in this
tree.

## reusables/

Copy-out collection of generic C# and React pieces. Consumers copy source files, never
the dev harnesses (`Reusables.Tests.csproj`, `frontend/package.json`). Components keep
consumer-project import paths (`@/components/ui`, `@/lib/utils`, `@/utils`);
`tsconfig.json` and `vitest.config.ts` map them onto this layout.

```
reusables/
├── backend/
│   ├── Extensions/
│   │   ├── ClaimsPrincipalExtensions.cs        GetUserId and GetEmail readers over the NameIdentifier and Email claims
│   │   ├── ClaimsPrincipalExtensionsTests.cs   tests that each reader returns its claim
│   │   ├── IdentityResultExtensions.cs         ToErrorMessage joins an IdentityResult's error descriptions with spaces
│   │   ├── IdentityResultExtensionsTests.cs    tests for the joined message and the empty success case
│   │   ├── StringExtensions.cs                 NormalizeAuthenticatorCode strips spaces and hyphens from a pasted code
│   │   └── StringExtensionsTests.cs            tests for space, hyphen, mixed, clean and empty input
│   ├── Services/
│   │   ├── BreachedPasswordValidator.cs        generic Identity password validator that rejects a password whose breach count meets a threshold, and fails open on a lookup error
│   │   ├── BreachedPasswordValidatorTests.cs   tests for below and at threshold, empty password skipping the client, and client failure
│   │   ├── DailyUtcBackgroundService.cs        abstract BackgroundService that waits for a fixed UTC hour, runs RunAsync, logs a failed run and keeps looping
│   │   ├── DailyUtcBackgroundServiceTests.cs   tests that a throwing run does not stop the loop and is logged, using an immediate-wait subclass
│   │   ├── GitHubReleaseClient.cs              fetches a repo's latest release from the GitHub API and caches it per key with a TTL; also the GitHubRelease and GitHubReleaseAsset records
│   │   ├── GitHubReleaseClientTests.cs         tests for the fetch and mapping, the cache hit and an HTTP failure
│   │   ├── IPwnedPasswordClient.cs             interface for a breach-count lookup that fails open to 0
│   │   ├── PwnedPasswordClient.cs              Have I Been Pwned range-API client: sends the 5-char SHA-1 prefix, matches the suffix, returns the count
│   │   └── PwnedPasswordClientTests.cs         tests for a found and a missing suffix, HTTP failure, empty password, response parsing and the prefix split
│   ├── Util/
│   │   ├── EdgeCountryHeader.cs                parses a CDN country header into an upper-case two-letter code, null for no-signal or malformed values
│   │   ├── EdgeCountryHeaderTests.cs           tests for casing, default and custom no-signal codes and malformed input
│   │   ├── ExpiryClock.cs                      expiry date from an anchor plus months, and an in-reminder-window check
│   │   ├── ExpiryClockTests.cs                 tests for a missing anchor, the month math and the 30-day boundary
│   │   ├── JwtBuilder.cs                       signs an HS256 JWT from a key, issuer, audience, claims and lifetime
│   │   ├── JwtBuilderTests.cs                  tests that issuer, audience, claims and expiry round-trip
│   │   ├── LlmJsonResponseHelper.cs            pulls the first JSON object out of an LLM reply, logs keys that are unknown or null against a type's JsonPropertyName set
│   │   ├── LlmJsonResponseHelperTests.cs       tests for bare JSON, prose around JSON, no JSON, contract warnings and key discovery
│   │   ├── OffPeakSchedule.cs                  next UTC occurrence of a fixed hour; exactly on the hour counts as already run
│   │   ├── OffPeakScheduleTests.cs             tests for before, after and exactly on the slot
│   │   ├── TextReadabilityGate.cs              per-page character checks (private-use, replacement, control, long runs, whitespace and letter ratios) that reject garbled PDF text; returns Readable, NoText or Unreadable
│   │   └── TextReadabilityGateTests.cs         tests for prose, no pages, whitespace-only pages, replacement characters, one bad page among good ones and an unbroken run
│   ├── .gitignore                              ignores bin/ and obj/
│   └── Reusables.Tests.csproj                  standalone net10.0 xUnit project that globs every .cs file under it; not in the solution
├── frontend/
│   ├── component/
│   │   ├── BackButton.tsx                  "Back" button that navigates to location.state.from or a fallback path, never window.history; needs react-router
│   │   ├── CheckboxGroup.tsx               controlled checkbox multi-select with optional select-all; emits values in option order
│   │   ├── ConfirmDialog.tsx               two-button confirm dialog with label, class, cancel callback and children slot
│   │   ├── CopyButton.test.tsx             tests for copying, the Copied flash and a custom label
│   │   ├── CopyButton.tsx                  icon button that copies text and shows a check mark, built on useCopyToClipboard
│   │   ├── countryCodes.ts                 ISO alpha-2 country list sorted by English display name, plus getCountryName
│   │   ├── CountryCombobox.tsx             searchable country picker with flags and an exclude list; needs flag-icons CSS
│   │   ├── CountryFlag.tsx                 flag-icons sprite span for a country code
│   │   ├── CreatableCombobox.tsx           combobox that picks from suggestions or commits a typed value through an "Add" item, with a length cap
│   │   ├── CurrentCheckbox.tsx             checkbox and label row for an "is current" toggle
│   │   ├── DatePicker.tsx                  popover date picker over the shadcn calendar; needs date-fns
│   │   ├── DeleteConfirmDialog.tsx         ConfirmDialog preset with a Delete label and destructive styling
│   │   ├── EmptyState.tsx                  centered icon, title, description and action for empty views
│   │   ├── EntryRow.tsx                    bordered row with a trash button for one entry, plus the AddEntryButton footer
│   │   ├── ErrorBoundary.test.tsx          tests for children, default fallback, retry, custom fallback and onError
│   │   ├── ErrorBoundary.tsx               class error boundary with a retryable default fallback and an onError hook
│   │   ├── FileDropzone.test.tsx           tests for accept matching, multiple, rejection reasons, the hidden input and disabled
│   │   ├── FileDropzone.tsx                drag-and-drop or click file picker that validates type and size; also exports isAcceptedType
│   │   ├── FormActionBar.tsx               Cancel and Save row with saving state, error text and an optional sticky bottom bar
│   │   ├── FormField.tsx                   label, control slot and error or hint text
│   │   ├── GateIndicator.tsx               sparkle icon with a tooltip, rendered only when tooltip text is given
│   │   ├── IconToggle.tsx                  pill-shaped single-select icon button group with an animated check
│   │   ├── InlineEditCard.tsx              titled card that swaps between a read view and an edit form, with empty state, add action, error line and Save/Cancel; also exports ViewChips
│   │   ├── LimitedTextarea.tsx             labelled textarea with a character counter and manual paste trimming
│   │   ├── MonthSelect.tsx                 month dropdown, null when unset
│   │   ├── MonthYearPicker.tsx             month and year selects in one labelled row, year required
│   │   ├── PaginationBar.test.tsx          tests for the page window, the single-page case, current page, disabled ends and stepping
│   │   ├── PaginationBar.tsx               prev, next and windowed page buttons for a PagedResult; also exports getPageItems
│   │   ├── PasswordInput.test.tsx          tests for the hidden default, the toggle and prop passthrough
│   │   ├── PasswordInput.tsx               shadcn Input with a show or hide eye button
│   │   ├── ProtectedRoute.tsx              renders children when authenticated, else a replace redirect; takes isAuthenticated and redirectTo as props
│   │   ├── ResponsiveButton.tsx            button that hides its label below the sm breakpoint and keeps the icon
│   │   ├── ScoreRing.tsx                   animated SVG ring showing a 0 to 100 score, coloured by scoreColor
│   │   ├── SearchInput.test.tsx            tests for no fire on mount, one debounced call, immediate clear, the clear button and initialValue
│   │   ├── SearchInput.tsx                 debounced search box with a clear button, built on useDebouncedValue
│   │   ├── SectionHeader.tsx               uppercase section title on the left with actions on the right
│   │   ├── SortableHeader.test.tsx         tests for aria-sort, starting ascending and flipping direction
│   │   ├── SortableHeader.tsx              th cell with a sort icon, aria-sort and click-to-sort for one column; also exports SortState
│   │   ├── Spinner.tsx                     inline spinner in three sizes, plus the centered PageLoader
│   │   ├── SuggestionInput.tsx             text input with a keyboard-navigable type-ahead dropdown, using matchSuggestion and useOnClickOutside
│   │   ├── table-plain.tsx                 shadcn Table variant without the overflow-x-auto wrapper
│   │   ├── TagInput.tsx                    chip input with add button, suggestion list, validation through validateTag and unsaved-chip styling
│   │   ├── ThemeToggle.test.tsx            tests for the OS default, toggling with persistence and a stored theme winning
│   │   ├── ThemeToggle.tsx                 sun or moon button wired to useTheme
│   │   ├── TimeSelect.tsx                  dropdown of 15-minute time slots that sets the time of a Date
│   │   ├── UnderlinedText.tsx              text with an absolutely positioned decorative underline bar that does not change layout height
│   │   └── YearSelect.tsx                  year dropdown from the current year back to 1900, 0 when unset
│   ├── shadcn/
│   │   ├── button.tsx                      shadcn Button and buttonVariants with extra xs and icon sizes
│   │   ├── calendar.tsx                    shadcn Calendar over react-day-picker, plus CalendarDayButton
│   │   ├── checkbox.tsx                    shadcn Checkbox over radix
│   │   ├── command.tsx                     shadcn Command set over cmdk, including CommandDialog
│   │   ├── dialog.tsx                      shadcn Dialog set over radix
│   │   ├── input.tsx                       shadcn Input
│   │   ├── label.tsx                       shadcn Label over radix
│   │   ├── popover.tsx                     shadcn Popover set over radix
│   │   ├── select.tsx                      shadcn Select set over radix, with popper positioning and a full-width trigger as defaults
│   │   ├── table.tsx                       shadcn Table set
│   │   ├── textarea.tsx                    shadcn Textarea
│   │   └── tooltip.tsx                     shadcn Tooltip set over radix, with an arrow and an arrowClassName prop
│   ├── util/
│   │   ├── apiError.test.ts                tests for the error contract, legacy array and string bodies, and field error cleaning
│   │   ├── apiError.ts                     ApiErrorBody shape and parseApiErrorBody, which extracts message, code and fieldErrors from an unknown body
│   │   ├── apiFetch.ts                     createApiClient: fetch with Bearer token, cookies, single-flight 401 refresh and one retry; ApiError, handleResponse and handleEmptyResponse
│   │   ├── arrayUtils.test.ts              tests for groupBy, chunk and uniqueBy
│   │   ├── arrayUtils.ts                   groupBy, chunk and uniqueBy without lodash
│   │   ├── cn.ts                           clsx plus tailwind-merge class joiner
│   │   ├── dateFormat.ts                   parseDateOnly, formatMonthYear, formatDate, formatDateTime and the time-of-day helpers
│   │   ├── dateValidation.ts               checkDateOrder for from and to ranges, checkNotFuture for year and month
│   │   ├── debounce.test.ts                tests for debounce and throttle timing and cancel
│   │   ├── debounce.ts                     plain-function debounce and throttle with cancel
│   │   ├── downloadFile.test.ts            tests for the anchor click, blob wrapping, blob passthrough and cleanup
│   │   ├── downloadFile.ts                 saves a string or Blob as a file through an object URL and a synthetic click
│   │   ├── formatNumber.test.ts            tests for grouping, locale, currency, compact and byte sizes
│   │   ├── formatNumber.ts                 Intl-based formatNumber, formatCurrency, formatCompact and formatBytes
│   │   ├── jwtAuth.ts                      in-memory access token store with getClaim, getRoles and hasRole
│   │   ├── maintenanceWindow.ts            isWithinWindow check for a timezone-based maintenance window, including windows that cross midnight, and a label formatter
│   │   ├── matchSuggestion.ts              prefix, word-start and substring matching for autocomplete
│   │   ├── pagedResult.test.ts             tests for pageCount and the prev and next checks
│   │   ├── pagedResult.ts                  PagedResult envelope type with pageCount, hasPrevPage and hasNextPage
│   │   ├── relativeTime.test.ts            tests for each unit, yesterday wording and timestamp or string input
│   │   ├── relativeTime.ts                 "3 days ago" style text through Intl.RelativeTimeFormat
│   │   ├── result.test.ts                  tests for ok, err and narrowing
│   │   ├── result.ts                       Result type with ok and err constructors
│   │   ├── retry.test.ts                   tests for success, retries, exhaustion, shouldRetry and capped doubling delays
│   │   ├── retry.ts                        async retry with exponential backoff, plus sleep
│   │   ├── richText.tsx                    renderBoldText turns **bold** segments of a string into strong elements
│   │   ├── safeJsonParse.test.ts           tests for valid, scalar and invalid JSON and the fallback form
│   │   ├── safeJsonParse.ts                JSON.parse returning a Result, plus a version taking a fallback
│   │   ├── scoreColor.ts                   maps a 0 to 100 score to an oklch colour with optional alpha
│   │   ├── stringUtils.test.ts             tests for slugify and grapheme-safe truncate
│   │   ├── stringUtils.ts                  slugify and truncate that counts graphemes
│   │   ├── useAsync.test.ts                tests for loading, results, rejections, stale runs and reset
│   │   ├── useAsync.ts                     hook that runs an async function and returns loading plus a Result, dropping stale runs
│   │   ├── useCopyToClipboard.test.ts      tests for copying, the reset timer, restart on rapid copies and refusal
│   │   ├── useCopyToClipboard.ts           clipboard write hook with a self-resetting copied flag
│   │   ├── useDebouncedValue.test.ts       tests for the initial value, delayed update and timer restart
│   │   ├── useDebouncedValue.ts            returns a value that updates after a quiet period
│   │   ├── useEditableList.ts              add, edit and delete-confirm state for a list editor; the caller supplies onSave and onDelete
│   │   ├── useEntryList.ts                 add, update and remove handlers for entry arrays, with scroll-to-new-entry on header add
│   │   ├── useFromLinkState.ts             link state carrying the current pathname as from, read by BackButton
│   │   ├── useIntersectionObserver.test.ts tests for observing, an empty ref, the once option and unmount
│   │   ├── useIntersectionObserver.ts      latest IntersectionObserverEntry for a ref, with a once option
│   │   ├── useInterval.test.ts             tests for repeating, pausing on null, latest callback and unmount for both hooks
│   │   ├── useInterval.ts                  useInterval and useTimeout with null pausing and automatic cleanup
│   │   ├── useKeyboardShortcut.test.ts     tests for key matching, exact modifiers, typing targets, Escape and unmount
│   │   ├── useKeyboardShortcut.ts          document-level shortcut with exact modifiers that skips typing targets
│   │   ├── useLocalStorage.test.ts         tests for initial, stored and corrupt values, setters and cross-tab storage events
│   │   ├── useLocalStorage.ts              useState persisted to localStorage as JSON with cross-tab sync
│   │   ├── useMediaQuery.test.ts           tests for the initial match, live updates and listener removal
│   │   ├── useMediaQuery.ts                live boolean for a CSS media query
│   │   ├── useOnClickOutside.test.ts       tests for outside presses, inside presses, an empty ref, latest handler and unmount
│   │   ├── useOnClickOutside.ts            calls a handler on mousedown or touchstart outside a ref
│   │   ├── useRemountableDialog.ts         open state plus a key that changes on each open, to remount a dialog and reset its form
│   │   ├── useScrollToNewItem.ts           scrolls the last list item into view after a requested append
│   │   ├── useTheme.ts                     light or dark theme plus a colour theme, persisted to localStorage and applied as classes on the html element
│   │   └── validateTag.ts                  tag checks for markup, length, repeated characters, duplicates and an item limit
│   ├── .gitignore                          ignores node_modules/
│   ├── package-lock.json                   npm lockfile for the dev harness dependencies; PARTLY READ: first 40 lines only
│   ├── package.json                        reusables-dev: test and test:watch scripts, dev dependencies for React, radix-ui, lucide-react, cva, clsx, tailwind-merge, jsdom, vitest and Testing Library
│   ├── tsconfig.json                       strict bundler config with paths mapping @/components/ui, @/lib/utils and @/utils onto shadcn/ and util/
│   ├── vitest.config.ts                    jsdom test environment with the same three aliases
│   └── vitest.setup.ts                     registers Testing Library cleanup after each test
└── CHANGELOG.md                            per-session log of what changed in reusables/ for people holding older copies; refers to the REUSABLES.md table, which is at the repo root
```

`reusables/frontend/node_modules/` is build output - see "Not mapped" above, not
in this tree.

## scripts/

```
scripts/
├── plan-lint.sh     structural lint for plan docs under docs/plans/ (archive skipped unless named): entry format, bare `external fact` or `vendor answer` resolvers, one-line entries, resolved wording, entry budget, maturity header counts and lowest mark; prints ARCHIVE-READY and OPEN-ITEMS notices; exit 1 on findings; feeds the trim-plan skill
└── protect-main.sh  one-time setup that creates or updates the "protect-main" GitHub ruleset on the default branch: PR required with 0 approvals, no force-push, no deletion; required status checks are opt-in, empty until added to REQUIRED_CHECKS; asks before applying, -y skips the prompt
```

## root files

```
.editorconfig  charset, LF line endings, final newline and trailing-whitespace trim for all files except Markdown; no indent rules, stack-specific sections are added per project
.gitignore     ignores local env files, session notes and the baton, issue/PR drafts, build-orchestration prompt-log data and scratch counters, and the per-subagent scope/worktree dirs
CLAUDE.md      skeleton project instructions: skill/config/attribution/notes rules, doc voice, placeholder overview and architecture sections, non-negotiable rules, response style
CONTEXT.md     entry point: file list, which files to read per task type, and the rule that every claim carries a pointer
LICENSE        MIT, copyright 2026 Nagare Negishi
README.md      template repo overview: layout of each top-level folder and the instantiation checklist for turning this seed into a real project
REUSABLES.md   catalogue of the copied, project-agnostic pieces in reusables/: frontend util hooks and functions, components and shadcn primitives, backend extensions, utils and services, each with what it does and what it needs
```
