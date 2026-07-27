# Authoring, promoting, and polishing a subagent

The single reference for building the custom subagents in `.claude/agents/`. Covers
the draft format, the promoted-file anatomy, the promote/polish process, the polish
lessons learned agent by agent, and the verified Claude Code facts behind it all.

## 1. Draft anatomy — what promotes

Drafts live in `docs/agents/drafts/<name>.md` and are inert: Claude Code loads agents only
from `.claude/agents/`. A draft has four parts:

- **Status** — `draft | promoted <date>`.
- **Purpose** — one or two sentences: what the agent does and when the main agent
  delegates to it instead of doing the work itself.
- **Definition** — the exact content that lands in `.claude/agents/<name>.md` on
  promotion. Nothing else goes in this block. Keep it self-contained: a subagent
  starts with no conversation context, no CLAUDE.md discussion, nothing outside its
  own prompt.
- **Design notes** — decisions and open questions (why a subagent and not a skill,
  which tools and why, what was tried and rejected).

Only the Definition promotes; Status, Purpose, and Design notes stay in the draft.

## 2. Promoted-file template

The anatomy of `.claude/agents/<name>.md` — i.e. the content of a draft's Definition
block. The worker family (critics especially) shares this shape by design: the
manager consumes every report uniformly, so the shape is a **core invariant**.
Testers and advisory agents deviate only where noted.

```markdown
---
name: <agent-name>
description: <when the manager should delegate here — the trigger, not the mechanics>
tools: <comma-separated allowlist>   # set to the minimum the job needs (omit = inherit all)
model: inherit                       # visible starting point; change to sonnet|opus|haiku to pin
---

You are a <role>. You receive <input: an idea, an implementation, a failure, a
research task> from a manager agent. Your only job is to <single mandate>. You do
not <boundaries: fix / propose alternatives / stray off-axis / soften with praise>.

Hunt for, as applicable to the target:        # testers: "Design tests for"; researcher: "Establish"

- <axis-specific item>
- <axis-specific item>

Rules:

1. Every finding carries evidence another agent can open and verify:
   <file:line for code | fetchable URL for a claim about standards or known issues>.
2. State the concrete failure: who hits it, how, and the result. A vague claim is
   not a finding.
3. Rank honestly. Do not inflate nitpicks; do not invent findings to fill the
   report. If the target is clean, say so and list what you checked.
4. Stay in your lane: a finding must be a <axis> problem, not a neighbouring-axis
   complaint.

Report back to the manager in exactly this structure:

- **Target**: what you reviewed and its scope.
- **Problems**: one bullet per finding, worst first:
  `critical|high|medium|low — <problem> — <failure scenario> — <evidence>`
- **Checked, no finding**: areas examined that came up clean.
- **Out of scope**: what you could not review and why (omit if empty).

The report is your final message. Do not write any files.   # testers: instead run the suite and report pass/fail
```

## 3. Why the boundary is a hard fence

The "you do not…" list is structural, not politeness: a critic allowed to fix starts
pulling punches to keep its fix small. So fixing, proposing alternatives, and writing
files are fenced off — they belong to the implementer / `alternatives-explorer` / the
testers, not the critic.

## 4. Promotion process — one agent at a time, user sign-off required

1. Copy the draft's Definition block to `.claude/agents/<name>.md`.
2. Polish the live file section by section, `description` first (see §5–§8).
3. Verify the agent appears in the available-agents list in a **new session**
   (agents load only at session start).
4. Update the draft's `Status:` line to `promoted <date>` — after polish, not
   before.

## 5. Promotion check — REQUIRED, follow every step

Walk the 10 sections below **in order**; the agent is promoted only after every one
passes.

For each section you MUST:

- **Challenge it** — state what is wrong or weaker than it should be and what to
  improve. Do not rubber-stamp; call it clean only when it survives that.
- **Fix it in the live file** — surface each change with its justification; never
  patch silently.
- **Stay concise** — give the judgment and the change, no padding.

**The 10 sections** (walk in order):

1. **`name`** — matches the file name, unique across the project tree.
2. **`description`** — states the delegation trigger, not the mechanics.
3. **`tools`** — the minimum the job needs; no `Bash`/`Write`/`Edit` on an agent
   that must only read and reason.
4. **`model`** — present as an explicit line (`inherit` unless there's a reason to
   pin).
5. **Role + input contract** — self-contained; names what it is and what it
   receives.
6. **Mandate + boundaries** — one job; the "you do not…" fence is present.
7. **The work** — an operational checklist, not a vague brief.
8. **Rules** — evidence, concrete failure, honest ranking, stay-in-lane all present.
9. **Report structure** — matches the shared shape.
10. **Final constraint** — write / do-not-write is correct for the agent's kind.

## 6. Section rule — how to polish, and its limits

- **One section per step.** Show exactly one section's proposed text with its
  justification, then STOP and wait for the user's explicit go on THAT section
  before showing the next. Presenting two or more sections in one message is a
  violation — even as a "preview", a numbered list, or "here's the plan".
- **No batch-apply, no batch-propose.** A go on one section is not a go on the next,
  and a go on one agent is not a go on the rest. The round-trips are the point — do
  not bundle them to save round-trips.

## 7. Edit the live file only

Polish edits `.claude/agents/<name>.md` directly and leaves it ahead of its draft on
purpose. Do not sync the `docs/agents/drafts/` draft one at a time, and do not offer to.
Carry the refinements a polished live file demonstrates (`model: inherit`, a Verdict
field, a fixed report shape, …) forward into the next draft promoted, so the pattern
compounds. Drafts are mirrored to live in **one final pass** after every agent is
promoted — never one at a time. ("Fixed in the draft first" applies to the
pre-promotion moment, not to polish.)

## 8. No fleet-taxonomy leak

An agent file is read by a cold subagent that does not know the fleet exists. Never
leak manager/fleet framing into it — no "neighbouring axis", "the other critics",
"the manager will…". State each lane in the agent's own terms: name the concrete
off-axis complaint types it must reject (e.g. "not a security or correctness
complaint") plus an on-axis positive test. Use `security-critic`'s stay-in-lane rule
as the model. The leak hides beyond the stay-in-lane rule — sweep the whole file for
role nouns (implementer / tester / critic / manager), not just that rule, and
restate each.

## 9. Polish criteria (general)

Polish means making the file effective for a cold subagent as the reader, not
improving the prose.

- **Directive, command voice.** "Never push", not "This agent never pushes". Every
  Rule opens as an imperative command.
- **Trim what the agent doesn't need to act** — rationale, restatements across
  sections, trigger paraphrases the `description`'s first sentence already implies.
  Cut any illustration that only restates an adjacent rule; keep it only if it
  carries signal the rest can't.
- **State a stance once**, in the rule where it's applied — not also in the role
  line. Role line = mandate + boundary only.
- **Add examples only where they aid operation** — an exact `file:line` syntax, a
  sample of the report format. An example earns its place only by fixing a real
  ambiguity; cut negative restatements and duplicate descriptors.
- **`description` trimming.** It costs context every session, so it carries only what
  the delegation decision needs — the trigger plus ~2–3 illustrative items behind
  "such as". The hunt list in the body carries the full set. Each trigger-phrase
  example must cover a request the trigger sentence would not obviously catch (test:
  would delegation fail without it?).
- **Add rules only where they prevent a realistic misfire**, not for completeness.

## 10. Polish lessons by axis

Learned promoting the fleet; each generalizes to the next agent.

- **Tools track the job, not the axis.** If an agent only reads and reasons,
  `Read, Grep, Glob` is enough — no `Bash`. Dropping `Bash` removes the confinement
  surface and lets the read-only fence rule go; `Bash` only buys running a
  type-checker, the tester's lane. Applies to the simplicity/performance/docs/legal
  critics.
- **Model tier tracks reasoning depth, not axis.** Pin `opus` only where the axis
  needs deep multi-step reasoning (correctness); mechanical axes stay cheaper
  (verifier `sonnet`).
- **Fixed report shape.** Every section always appears; write "none" if it has no
  content. The `Omit if none` / `(omit if empty)` pattern makes the shape vary
  run-to-run so the manager can't parse uniformly — do not use it. Section-header
  labels are noun tags (`Checked`), not sentences (`Checked, no finding`).
- **A report bullet states WHAT goes in the section, not WHY.** Motivational
  rationale in a report section is dead weight — cut it.
- **Ranking needs teeth, not "rank honestly."** Name the concrete dishonest move
  ("Do not inflate a nitpick to critical"), not the virtue. Teeth are axis-specific:
  add them only where the axis has a real severity-inflation bias — the user's call
  per axis.
- **Re-fit inherited rule shapes to the axis; don't copy verbatim.** A rule that
  fits one axis (e.g. "don't trade X for a regression" fits performance, whose own
  recommendations introduce the hazard) folds differently on a remove-only critic
  ("don't flag load-bearing complexity"). A boundary already in the mandate needs no
  third restatement in the rule's tail.
- **Scope input + report shape together.** An agent scoped to "one unit" in the role
  line gets a single-entry report; one scoped to multiple targets gets multiple
  entries.
- **A terminal alternate outcome** (e.g. could-not-reproduce) earns a specific
  one-line format on the fixed-shape line ("put X under **Failure**, write 'none'
  for the rest"), not an inline `(or …)` parenthetical smeared across two bullets.

## 11. Settled design decisions

- **Atomic critics, one axis each** — not one broad `code-reviewer`. Atomic
  single-axis designs compose cheaply later (merge into a bundle, or spin a new
  multi-aspect agent); splitting a bundle back into clean axes is a rewrite.
- **Toolset split** (consistent and reasoned): testers get `Write / Edit / Bash`;
  code-inspecting critics get read-only (`Read, Grep, Glob`, no `Write`/`Edit`);
  idea/web critics + researcher/verifier/alternatives-explorer get read-only + web,
  no `Bash` ("never test an exploit / never act"); `legal-critic` adds `Bash` for
  manifests.
- **Model field defaults to `inherit`** — set it per-agent only where the axis has a
  reason to differ; omitting equals `inherit`.
- **Shared report shape is the family's core invariant.** Critics mirror
  `security-critic`'s shape (hunt list → evidence-per-finding → honest ranking →
  "Checked, no finding" → stay-in-lane). The manager consumes every report
  uniformly. Preserve it.
- **`debugger` and `mcdc-tester` are standing agents.** `debugger` keeps diagnosis
  off the manager's context when a loop stalls; `mcdc-tester` stays optional —
  MC/DC earns its combinatorial cost only on decision-dense units.

## 12. Verified Claude Code facts

Banked from `code.claude.com/docs/en/sub-agents.md` and `skills.md` so they are not
re-researched. Re-verify only if Claude Code changes the spec.

- **Agent frontmatter fields** — only `name` + `description` required; rest optional:
  `tools` (allowlist; inherits all if omitted; unresolvable name → launch failure),
  `disallowedTools`, `model` (default `inherit`), `permissionMode`, `maxTurns`,
  `skills` (preload into context), `mcpServers`, `hooks`, `memory`, `background`
  (default true), `effort` (`low|medium|high|xhigh|max`), `isolation`, `color`,
  `initialPrompt` (main-thread only). `tools` accepts a comma-separated string or a
  YAML list.
- **Load precedence** (highest→lowest): managed settings → `--agents` CLI flag →
  project `.claude/agents/` → user `~/.claude/agents/` → plugin `agents/`. Project
  wins over user on a `name` clash. Keep names unique across the project tree —
  same-dir duplicates load only one, by filesystem order.
- **Nesting**: subagents can spawn subagents (fixed max depth 5); the `Agent` tool
  gates it — list it in `tools` to allow, omit/deny to forbid. The workers here omit
  `Agent`, so only the main session fans out — the intended posture.
- **Context loaded into a custom subagent**: system prompt, task message, CLAUDE.md,
  git status, preloaded `skills`, sibling-agent roster. NOT loaded: parent
  conversation, parent's non-listed skills, parent system prompt. Only the built-in
  Explore/Plan agents skip CLAUDE.md + git status. (So an agent re-stating CLAUDE.md
  constraints is redundant-but-harmless, not required.)

## 13. Tester confinement (enforced, verified 2026-07-23)

Write-capable testers (`blackbox`, `whitebox`) are confined by the system, not the
prompt, to the files the manager stages for that spawn.

- **Mechanism** — the one per-subagent, all-tools lever is frontmatter
  `hooks.PreToolUse`. `Read`/`Edit`/`Write` go through the permission system, not the
  Bash sandbox, so a temp-dir + `/sandbox` does not stop the `Read` tool; there is no
  per-subagent sandbox or permissions block. A `PreToolUse` hook (matcher
  `Read|Edit|Write`) runs a path-jail script that `realpath -m`-resolves the target
  and denies (exit 2) anything outside a fixed root.
- **Plumbing** — `.claude/hooks/agent-scope-jail.sh` (path jail, logs to
  `.agent-scope/.jail.log`); fixed gitignored scope root `.agent-scope/`; the tester
  frontmatter's `hooks.PreToolUse`. The manager stages only permitted files in
  (spec-only for blackbox, spec+impl for whitebox), spawns the tester pointed at the
  root, moves results out, clears it. Blackbox and whitebox share the one root, so
  they must be serialized.
- **Seams** — `Bash` reaches any file, so a `Bash`-capable variant can't be jailed
  (blackbox was trimmed to `Read, Write, Edit` for this reason). Config loads at
  session start with **no hot-reload**, so the jail is only validatable from a fresh
  session. `bypassPermissions` / `acceptEdits` parent mode overrides the jail — the
  manager must confirm the session mode before spawning.
