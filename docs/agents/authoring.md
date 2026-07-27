# Authoring, promoting, and polishing a subagent

The single reference for building the custom subagents in `.claude/agents/`.

## 1. Draft anatomy — what promotes

Drafts live in `docs/agents/drafts/<name>.md` and are inert: Claude Code loads agents only
from `.claude/agents/`. A draft has four parts:

- **Status** — `draft | promoted <date>`.
- **Purpose** — one or two sentences: what the agent does and when the main agent
  delegates to it instead of doing the work itself.
- **Definition** — the exact content that lands in `.claude/agents/<name>.md` on
  promotion. Nothing else goes in this block. Keep it self-contained: a subagent
  starts cold, with nothing outside its own prompt to rely on.
- **Design notes** — decisions and open questions (why a subagent and not a skill,
  which tools and why, what was tried and rejected).

Only the Definition promotes; Status, Purpose, and Design notes stay in the draft.

## 2. Promoted-file template

The anatomy of `.claude/agents/<name>.md` — i.e. the content of a draft's Definition
block. The worker family shares this shape by design (see §10); testers and advisory
agents deviate only where noted.

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
3. Do not inflate a nitpick to <top severity>, and do not invent findings to fill
   the report. If the target is clean, say so and list what you checked.
4. Stay in your lane: name the concrete off-axis complaint types to reject, plus
   the on-axis positive test. State it in the agent's own terms — no fleet framing (§7).

Report back to the manager. One entry per target (multiple targets → multiple
entries), in exactly this structure:

- **Target**: what you reviewed and its scope.
- **Verdict**: `<bad>` | `<clean>` | `unreviewable` — any finding → `<bad>`; else
  anything you couldn't review → `unreviewable`; else `<clean>`.
- **Problems**: findings worst first, one bullet each (required if `<bad>`):
  `critical|high|medium|low — <problem> — <failure scenario> — <evidence>`
- **Checked**: areas examined that came up clean (required if `<clean>`).
- **Out of scope**: what you couldn't review and why (required if `unreviewable`).

Every section always appears; write "none" if it has no content.

The report is your final message. Do not write any files.   # testers: instead run the suite and report pass/fail
```

## 3. Promotion process — one agent at a time, user sign-off required

1. Copy the draft's Definition block to `.claude/agents/<name>.md`.
2. Polish the live file section by section (see §4).
3. Verify the agent appears in the available-agents list in a **new session**
   (agents load only at session start).
4. Update the draft's `Status:` line to `promoted <date>` — after polish, not
   before.

## 4. Promotion check — REQUIRED, follow every step

Walk the 10 sections below **in order**; the agent is promoted only after every one
passes.

For each section you MUST:

- **Challenge it** — state what is wrong, weaker than it should be, or noise, and
  what to improve. Noise is any text that will not control the subagent's behavior:
  redundancy, a rule restated across sections, or more examples than the one that
  resolves a real ambiguity. Cut it. Do not rubber-stamp; call it clean only when it
  survives that.
- **Fix it in the live file** — surface each change with its justification; never
  patch silently.
- **Stay concise** — give the judgment and the change, no padding.

**The 10 sections**:

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

## 5. Section rule — one at a time

- **Propose one section per step.** Show its text with your justification, then STOP
  and wait for the user's explicit go before the next. Never preview, list, or plan
  later sections.
- **Never batch-apply or batch-propose.** A go on one section is not a go on the next;
  a go on one agent is not a go on the rest.

## 6. Edit the live file only

Polish edits `.claude/agents/<name>.md` directly. Do not sync the
`docs/agents/drafts/` draft one at a time, and do not offer to. Carry each refinement
forward into the next draft promoted; sync all drafts to match the live files in
**one final pass** after every agent is promoted.

## 7. No fleet-taxonomy leak

The subagent is cold — it does not know the fleet exists. Never leak manager/fleet
framing into an agent file. State each lane in the agent's own terms: name the
off-axis complaint types to reject plus an on-axis positive test. Sweep the whole file
for role nouns, not just the stay-in-lane rule, and restate each.

## 8. Polish criteria (general)

Polish makes the file effective for a cold subagent, not the prose nicer.

- **Directive, command voice.** Every rule opens as an imperative — "Never push", not
  "This agent never pushes".
- **State a stance once**, in the rule where it applies — not also in the role line.
  Role line = mandate + boundary only.
- **`description` trimming.** It costs context every session: carry only the trigger
  plus ~2–3 items behind "such as"; the body's hunt list holds the full set. Each
  example must earn its place — would delegation fail without it?
- **Add rules only where they prevent a realistic misfire**, not for completeness.

## 9. Polish lessons by axis

Each generalizes to the next agent.

- **Tools track the job, not the axis.** An agent that only reads and reasons gets
  `Read, Grep, Glob` — no `Bash`. `Bash` only buys running a type-checker, the
  tester's lane.
- **Model tier tracks reasoning depth, not axis.** Pin `opus` only where the axis
  needs deep multi-step reasoning; mechanical axes stay cheaper.
- **Never use the `Omit if none` report pattern.** It varies the shape run-to-run so
  the manager can't parse uniformly.
- **A report bullet states WHAT goes in the section, not WHY.** Motivational
  rationale there is dead weight — cut it.
- **Ranking teeth are axis-specific.** Name the concrete dishonest move, not the
  virtue; add teeth only where the axis has a real severity-inflation bias — the
  user's call per axis.
- **Re-fit inherited rule shapes to the axis; don't copy verbatim.** A boundary
  already in the mandate needs no restatement in the rule's tail.
- **Scope input and report shape together.** One unit → single-entry report; multiple
  targets → multiple entries.
- **Give a terminal alternate outcome its own one-line format** on the fixed-shape
  line, not an inline `(or …)` smeared across bullets.

## 10. Settled design decisions

- **Atomic critics, one axis each** — not one broad `code-reviewer`. Single-axis
  designs compose cheaply later; splitting a bundle back into clean axes is a rewrite.
- **Shared report shape is the family's core invariant.** Critics mirror
  `security-critic`'s shape; the manager consumes every report uniformly. Preserve it.
- **`debugger` and `mcdc-tester` are standing agents.** `debugger` keeps diagnosis
  off the manager's context when a loop stalls; `mcdc-tester` stays optional —
  MC/DC earns its combinatorial cost only on decision-dense units.

## 11. Verified Claude Code facts

Verified against `code.claude.com/docs/en/sub-agents.md` and `skills.md` on
2026-07-23, banked so they are not re-researched. Re-verify only if Claude Code has
changed the spec since.

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

## 12. Tester confinement (enforced, verified 2026-07-23)

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
