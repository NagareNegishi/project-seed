# Product plan: verify-fanout

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 10 · 👤 human-ok 0 · ✅ settled 0

## about
🤖 ai-audited(opus-4.8) — matches ledger; the src:/doc: split with plan-verify made explicit

A managed multi-agent research workflow that verifies the external claims in an
implementation plan. When the user runs it against an `impl.md`, a manager agent
dispatches researcher subagents, fetches and checks every cited source itself,
and returns only the sections whose sources hold up. It is the sibling of
`plan-verify`, covering the external (`doc:`) half of verification while
`plan-verify` keeps the internal (`src:`) half.

## problem / motivation
🤖 ai-audited(opus-4.8) — faithful to ledger; the benefit stays unquantified (see open questions)

Research done inline by the main session floods the planning conversation with
search results and half-checked claims, and nothing forces a claim to carry a
source that supports it. Two failures follow. Unverified claims enter the plan
doc, because a researcher's answer reads the same whether its reference is a live
official doc or a dead link. And the session grades its own homework, since the
agent that wrote a claim is the wrong one to audit it. Separating duties fixes
both: researchers produce claims with evidence, a manager independently checks
the evidence, and the main session only sees what survived.

## goal
🤖 ai-audited(opus-4.8) — outcome-framed, no mechanism leaked in

Every external claim that lands in a plan doc is backed by a live source that a
second agent has independently opened and confirmed, and the checking happens
without filling the planning conversation with search noise.

## audience
🤖 ai-audited(opus-4.8) — confirmed against the plan-chain flow

Developers working the plan skill chain in a repo built from this seed. They run
`/verify-fanout` against an `impl.md` after `plan-impl`, in the same flow where
they would reach for `plan-verify`.

## requirements
🤖 ai-audited(opus-4.8) — added the rejection-with-finding behavior from the ledger's scope section

- When the user runs `/verify-fanout` against an `impl.md`, the system shall
  write one brief per `doc:`-marked entry and hand the briefs to the research
  tool.
- When a brief reaches the tool, the manager shall audit it for answerability
  before spawning any researcher, and bounce an underspecified brief back to the
  main session as a clarification request rather than guess.
- When a researcher returns a claim, the manager shall fetch each cited source
  itself and reject the whole section if a link is dead or its content does not
  support the claim.
- When the manager rejects a section, the system shall return the rejection to
  the same researcher with a specific reason, allowing 3 attempts.
- When a researcher fails its third attempt, the manager shall drop it and spawn
  a fresh researcher carrying a dossier of what the prior attempts claimed and
  why each failed.
- When a claim fails verification, the returned section shall carry the reason
  plus the current alternative the researcher found: a bounded finding anchored
  to that failed claim, not open exploration.
- When a section passes verification, the manager shall write it to `results/`
  as its own keyed file before continuing, so a run that dies partway keeps
  every section already verified.
- When the run finishes, the main session shall read back only the verified
  sections, and the user shall decide which get stamped `🔗 verified → doc:` on
  their impl entries.
- The system shall never let a researcher or the manager write to the plan docs
  or the briefs; agents research, and the main session edits the doc.
- Researcher egress shall be limited to a curated allowlist, and a blocked
  domain shall surface as a proposed allowlist addition for user sign-off.

## stack
🤖 ai-audited(opus-4.8) — confirmed; SDK-swap path and sonnet pin preserved

Headless Claude Code (`claude -p`) driving the `Agent` / `SendMessage`
machinery, packaged as a standalone Docker container with its own iptables
allowlist script. Two agent definitions (`research-manager.md`, `researcher.md`)
plus a `verify-fanout` trigger skill, explicit-command only. Researchers pin
`model: sonnet`; the manager, which makes the final source-supports-claim call,
stays on the stronger model. The runner is swappable to an Agent SDK app later,
since the prompts, brief template, file-drop boundary, container, and allowlist
are all runner-independent.

## target device / platform
🤖 ai-audited(opus-4.8) — confirmed; standalone-and-reusable framing kept

CLI and developer tooling. A standalone container run outside the project's dev
container, launched manually and in the foreground with `docker compose run
research`. It needs no repo content, so it is reusable across every repo built
from this seed rather than tied to one project.

## constraints
🤖 ai-audited(opus-4.8) — added the dev-container firewall blocker that drives the whole separate-container design, plus the credential boundary

- The project's dev container runs an egress firewall (`project-firewall.sh`)
  that blocks `WebFetch` to non-allowlisted domains, so source verification
  cannot run inside it. This is the constraint that drives the whole design: the
  tool runs in its own container outside the dev container, with its own network
  boundary as code.
- Agents get no repo access. Context reaches them only through the brief the
  main session writes, which keeps the tool project-independent and shrinks the
  injection blast radius.
- Researchers cannot write files or run a shell, enforced by their tool list
  rather than by instruction.
- The manager can write only to `results/`. `briefs/` is mounted read-only and
  no workspace is mounted, so claims pass through verbatim by construction.
- Egress is a curated allowlist, never open. Official docs only, which also
  matches the manager's reject rule. The Claude credential lives inside the
  tool's relaxed-network boundary for headless auth, so the allowlist is the
  exfiltration guard.
- Any firewall or `.claude/settings.json` change needs cited docs and user
  sign-off (CLAUDE.md rule; the firewall script is treated the same).
- v1 handoff is a shared file-drop bind mount. No firewall hole, and no Docker
  access from the dev container.

## non-goals
🤖 ai-audited(opus-4.8) — confirmed; the four scope exclusions all trace to the ledger

- Discovery. A brief confirms an already-chosen approach, not an open "which of
  five should we pick". Option-comparison stays with the interactive
  `dev-research` skill.
- Internal (`src:`) verification. Claims that need code inspection stay with
  `plan-verify` in the main session, which can read the code. This tool
  industrializes the external half only.
- An always-up watcher or standing server in v1. Launch stays manual and
  foreground.
- Rewriting or composing claims. The manager verifies, accepts, rejects, and
  relays, and does nothing more.

## open questions
🤖 ai-audited(opus-4.8) — added the unquantified-benefit question; the rest are the ledger's settled-as-proposed items

- No metric yet for whether the workflow earns its token cost. The ledger argues
  the payoff qualitatively (no self-audit, no dead-link claims) but sets no bar
  for how often inline research actually let a bad claim through.
- Concurrency cap for parallel researchers (proposed: 3). Parallel researchers
  multiply token cost, and the cap lives in the manager's prompt, so it is
  followed but not harness-enforced.
- Whether the prompt-level caps (3-attempt rule, researcher-only spawning,
  concurrency) prove too loose in practice. If so, graduate the runner to the
  Agent SDK, which can enforce them in code.
- When to build the planned v2 Unix-socket endpoint. It buys a warm server and
  live progress at the cost of a server loop and a small request/response
  protocol. The trigger is the per-run cold-start starting to grate.
- The manual `docker compose run` on the host cannot become pure repo-code.
  Open whether that one out-of-repo command is acceptable long-term.
