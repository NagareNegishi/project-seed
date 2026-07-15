# Product plan: verify-fanout

## Maturity
lowest: ✅ settled
🌱 idea 0 · 🤖 ai-audited 0 · 👤 human-ok 0 · ✅ settled 10

## about
✅ settled — human-confirmed against the approved ledger

A managed multi-agent research workflow that verifies the external claims in an
implementation plan. When the user runs it against an `impl.md`, a manager agent
dispatches researcher subagents, fetches and checks every cited source itself,
and returns only the sections whose sources hold up. It is the sibling of
`plan-verify`, covering the external (`doc:`) half of verification while
`plan-verify` keeps the internal (`src:`) half.

## problem / motivation
✅ settled — human-confirmed against the approved ledger

Research done inline by the main session floods the planning conversation with
search results and half-checked claims, and nothing forces a claim to carry a
source that supports it. Two failures follow. Unverified claims enter the plan
doc, because a researcher's answer reads the same whether its reference is a live
official doc or a dead link. And the session grades its own homework, since the
agent that wrote a claim is the wrong one to audit it. Separating duties fixes
both: researchers produce claims with evidence, a manager independently checks
the evidence, and the main session only sees what survived.

## goal
✅ settled — human-confirmed against the approved ledger

Every external claim that lands in a plan doc is backed by a live source that a
second agent has independently opened and confirmed, and the checking happens
without filling the planning conversation with search noise.

## audience
✅ settled — human-confirmed against the approved ledger

Developers working the plan skill chain in a repo built from this seed. They run
`/verify-fanout` against an `impl.md` after `plan-impl`, in the same flow where
they would reach for `plan-verify`.

## requirements
✅ settled — retry budget (2 attempts, one fresh researcher, then terminal fail) and typed-outcome read-back revised and locked by user this session; the rest confirmed against the approved ledger

- When the user runs `/verify-fanout` against an `impl.md`, the system shall
  write one brief per `doc:`-marked entry and hand the briefs to the research
  tool.
- When a brief reaches the tool, the manager shall audit it for answerability
  before spawning any researcher, handling each brief independently: an
  underspecified brief bounces back to the main session as a clarification request
  rather than a guess, and does not hold up the other briefs.
- When a researcher returns a claim, the manager shall fetch each cited source
  itself and reject the whole section if a link is dead or its content does not
  support the claim.
- When the manager rejects a section, the system shall return the rejection to
  the same researcher with a specific reason, allowing 2 attempts — the initial
  claim plus one correction.
- When a researcher fails its final attempt, the manager shall drop it and spawn
  one fresh researcher carrying a dossier of what the prior attempts claimed and
  why each failed. That fresh researcher is the last: if it too exhausts its
  attempts, the claim is terminally failed and returned as such. The retry is
  bounded at two researchers of two attempts each, so no claim loops indefinitely.
- When a claim fails verification, the returned section shall carry the reason
  plus the current alternative the researcher found: a bounded finding anchored
  to that failed claim, not open exploration.
- When a section passes verification, the manager shall write it to `results/`
  as its own keyed file before continuing, so a run that dies partway keeps
  every section already verified.
- When the run finishes, the main session shall read back every returned outcome
  — verified sections, terminally failed claims, and clarification requests — and
  the user shall decide which of the verified sections get stamped
  `🔗 verified → doc:` on their impl entries.
- The system shall never let a researcher or the manager write to the plan docs
  or the briefs; agents research, and the main session edits the doc.
- Researcher egress shall be limited to a curated allowlist, and a blocked
  domain shall surface as a proposed allowlist addition for user sign-off.
- When a run executes, the manager shall record run telemetry to a `history/` log it owns —
  separate from the `briefs/`/`results/` exchange, and neither written, reset, nor
  read by the main session as part of the verify flow: the count of researchers
  deployed, and totals for verified results, failed attempts, and fired
  researchers. For each failure it shall log an entry holding the brief, the
  manager's instruction to that researcher, and a concise summary of how it failed
  — enough to characterize the failure, in no fixed format since the failure modes
  are not yet known, without retaining the full research output.

## stack
✅ settled — human-confirmed against the approved ledger

Headless Claude Code (`claude -p`) driving the `Agent` / `SendMessage`
machinery, packaged as a standalone Docker container with its own iptables
allowlist script. Two agent definitions (`research-manager.md`, `researcher.md`)
plus a `verify-fanout` trigger skill, explicit-command only. Researchers pin
`model: sonnet`; the manager, which makes the final source-supports-claim call,
stays on the stronger model. The runner is swappable to an Agent SDK app later,
since the prompts, brief template, file-drop boundary, container, and allowlist
are all runner-independent.

## target device / platform
✅ settled — human-confirmed against the approved ledger

CLI and developer tooling. A standalone container run outside the project's dev
container, launched manually and in the foreground with `docker compose run
research`. It needs no repo content, so it is reusable across every repo built
from this seed rather than tied to one project.

## constraints
✅ settled — concurrency cap (3) settled this session; rest human-confirmed against the approved ledger

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
- The manager can write only to `results/` and its own `history/` log; `briefs/`
  is mounted read-only and no workspace is mounted, so claims pass through
  verbatim by construction. `history/` is manager-owned — the main session never
  writes it.
- Egress is a curated allowlist, never open. Official docs only, which also
  matches the manager's reject rule. The Claude credential lives inside the
  tool's relaxed-network boundary for headless auth, so the allowlist is the
  exfiltration guard.
- Any firewall or `.claude/settings.json` change needs cited docs and user
  sign-off (CLAUDE.md rule; the firewall script is treated the same).
- v1 handoff is a shared file-drop bind mount. No firewall hole, and no Docker
  access from the dev container.
- The manager caps concurrent researchers at 3 — a prompt-level rule like the
  3-attempt retry, followed but not harness-enforced.

## non-goals
✅ settled — human-confirmed against the approved ledger

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
✅ settled — four items resolved this session; only the failure-mode taxonomy stays genuinely open

- The failure-mode taxonomy for the manager's `history/` log. v1 records each
  failure free-form because the modes aren't mapped yet; whether they settle into
  a stable set worth a structured schema is answerable only once real runs
  produce failures.
