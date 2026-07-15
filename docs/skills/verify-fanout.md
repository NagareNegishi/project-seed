# Verify Fan-out — Design Ledger

Design for a managed multi-agent research workflow: when a plan reaches
implementation stage, the main session hands the plan's external-verification
items — the `doc:`-marked entries in `impl.md` — to a manager agent that
dispatches researcher subagents, verifies their cited sources, and returns each
brief's outcome — verified, failed, or needs clarification. It is the industrialized replacement for the single-agent,
in-session `dev-research` call that `plan-verify` makes for external claims: a
sibling command, scoped to verifying an already-chosen approach. See
[feature-plan.md](feature-plan.md) for the plan skills it plugs into.

Status: designed, not yet built. Every decision below is settled; what remains
is to build it.

## The problem

Research done inline by the main session floods the planning conversation with
search results and half-checked claims, and nothing forces a claim to carry a
source that supports it. Two failures to guard against:

- Unverified claims entering the plan doc. A researcher's answer reads the same
  whether its reference is a live official doc or a dead link.
- The main session grading its own homework. The agent that wrote a claim is
  the wrong agent to audit it.

The fix is separation of duties: researchers produce claims with evidence, a
manager independently checks the evidence, and the main session only sees what
survived.

## Prior art

- Orchestrator-workers, the pattern behind claude.ai's Research feature: a lead
  agent fans out to parallel search subagents and checks citations before
  composing the answer.
- Verification rules from this repo's
  [dev-research](../../.claude/skills/dev-research/SKILL.md) skill: official
  docs as source of truth, never assert what wasn't fetched, cite the exact
  page and section. That skill stays as-is (interactive, single-agent); this
  workflow lifts its rigor into agent contracts.

## Architecture

```
main session ──(skill trigger)──▶ research-manager ──▶ researcher #1
   ▲                                   │   ▲    │
   │ verified sections only            │   │    └──▶ researcher #2 ...
   └───────────────────────────────────┘   └── reject / resume / fire loop
```

The manager and researchers run outside the session, in a dedicated container
(option 4). The main session sends a brief and reads back verified sections;
verifying sources needs fetch access, so the manager runs on the same side as
the researchers.

The manager-researcher protocol below is runtime-independent. Where the runner
is headless Claude Code, a subagent with `Agent` in its `tools` can spawn nested
subagents (depth limit 5, this design uses 2); only the top-level subagent's
summary returns to the caller, so researcher noise never reaches the main
conversation, and `SendMessage` resumes a completed subagent with its context
intact.

## Settled

### Three pieces, all new

- `.claude/agents/researcher.md` — produces claims with evidence. Every claim
  carries a source URL plus a quoted excerpt that supports it.
- `.claude/agents/research-manager.md` — dispatches researchers (one per
  topic), verifies every cited source by fetching it, and writes each brief's
  terminal outcome as its own keyed file into the shared `results/` folder as it
  resolves.
  Its `tools` include `Write`, but the container mounts no workspace and
  `briefs/` is mounted read-only, so the only paths it can write are `results/`
  and its own `history/` store (see run history below) — never the briefs it is
  checking, never the plan docs. Its definition body carries the whole protocol
  below.
- A trigger skill, `verify-fanout` — explicit command only,
  `disable-model-invocation: true` per the authoring guide. A sibling to
  `plan-verify`: the user runs it against an `impl.md` whose `doc:`-marked
  entries are the research topics. It writes a brief per entry, dispatches them
  to the manager, and merges the returned verified sections back as
  `🔗 verified → doc:` marks. `plan-verify` still handles the `src:` (internal)
  entries itself.

The two agent definitions live in the tool's own repo; the trigger skill is the
only piece living here.

### The verification protocol

- The manager fetches each cited URL itself. A dead link, or content that does
  not support the claim, rejects the whole section with a specific reason
  ("your second source 404s", "the quoted page never mentions X").
- Rejection goes back to the same researcher via `SendMessage`, so it sees its
  own prior attempt. Each researcher gets 2 attempts — the initial claim plus one
  correction.
- After the second rejection the researcher is dropped and the manager spawns one
  fresh researcher with a failure dossier: what the previous researcher claimed and
  why each attempt failed. That researcher is the last generation; if it too fails,
  the claim is terminally failed. Retry is bounded at 2 researchers × 2 attempts.
  The manager holds this history in its own context.
- Every brief returns exactly one terminal outcome — a verified section, a
  terminally failed claim (reason plus alternative), or a needs-clarification
  bounce — but only verified sections merge into the plan doc. The manager never
  rewrites what it relays: claims from
  main and researcher evidence pass through verbatim — it verifies, accepts,
  rejects, and composes, nothing more. The read-only `briefs/` mount and absent
  workspace make that structural, not just requested (see the manager bullet
  above and layout below).

### Incremental delivery, durable by section

Main hands over the whole list of claims at once. The manager allocates one
researcher per claim (concurrency capped, see honest limits) and keeps an
internal table — claim, assigned researcher, status — of what is still open,
what passed, and what was rejected. That table lives in the manager's context for
the run only; nothing about it is persisted. The moment a brief reaches a terminal
outcome — verified, failed, or needs-clarification — the manager writes it as its
own keyed file into `results/` before moving on.

The point is durability. If the run dies partway — token exhaustion, a killed
container, a crash — every brief already resolved is a file in `results/`; only
the in-flight ones are lost, and main re-triggers those on the next run. The
`results/` folder is itself the record of what resolved, so no separate ledger is
kept. Batching every section into one final message would forfeit the whole run
to any mid-flight failure. Main reads `results/` only after the done-signal (the
returning `docker compose run`), so writing incrementally adds no partial-read
race.

### Researchers cannot write, by construction

- Researcher `tools`: `WebSearch, WebFetch, Read` (possibly `Grep, Glob`). No
  `Write`, no `Edit`, and deliberately no `Bash`, since a shell writes files
  through redirection. The harness never offers the missing tools, so the
  no-write rule is enforced, not requested.

### Doc-editing authority stays in the main session

- Mirrors the repo's draft-then-act split: agents research, the main session
  (with the user) decides what enters the doc.

### Context-by-brief: no project access

- The manager and researchers never see the repo, CLAUDE.md, or plan docs.
  Their question is "is this claim true, current, and backed by a live source",
  which is project-independent.
- Project constraints still reach them in the brief the main session writes —
  the four fields of the brief template (below). The brief is a reviewable
  artifact.
- The manager audits the brief before spawning anyone. An underspecified brief
  goes back to the main session as a clarification request, not a guess: one
  round-trip is cheaper than three researchers run against the wrong
  assumptions. The concrete checks are in the brief template below.
- No project access also shrinks the injection blast radius (a compromised
  researcher holds nothing but the brief) and makes the tool reusable across
  projects.

### The brief template

Main writes one brief per `doc:` entry. Four content fields the researchers read,
plus a routing field they do not:

- **claim** — the single assertion to verify, taken verbatim from the impl
  entry. Not a question, not several claims bundled.
- **motivation** — one line on what in the plan depends on it. It frames
  relevance, and lets a failed verification return a useful "what's possible
  instead" rather than a bare no.
- **constraints** — the hard pins projected from `product.md`: stack, versions,
  target platform. The version pin is load-bearing — "is X current or supported"
  is unanswerable without the version it is asked against.
- **acceptance** — what a sufficient source looks like and the exact bar to
  clear, e.g. "confirmed iff an official doc shows the API is stable (not
  experimental) at the pinned version". Required, but the template pre-fills a
  default — "confirmed iff a primary/official source shows the claim holds at the
  pinned version" — that main keeps or sharpens. This is the condition the
  manager's reject rule tests each fetched source against, so every brief carries
  an explicit, reviewable pass condition.
- **entry-ref** (routing) — a stable pointer back to the impl entry so the
  returned section merges onto the right line, paired with a short content hash of
  the claim + acceptance to form the brief's **key**. Each result echoes this key,
  so main routes a section to its entry and treats a result whose hash no longer
  matches the current entry as outdated. The researcher never reads it; the key's
  on-disk form is set by the layout (below).

The manager audits each brief for answerability before spawning — never for
factual correctness, which is the researchers' job. Any failed check bounces to
main as a clarification request, not a guess:

- **single checkable claim** — compound briefs go back to be split;
  discovery-shaped ones ("which of these is best") are out of scope.
- **version pin present** when the claim is version-sensitive — the
  highest-value catch, since an unpinned "is it current" burns three researchers
  for nothing.
- **acceptance is testable** — a stated bar a fetched source can be held against.
- **constraints consistent with the claim** — a cheap sanity check (e.g. the
  claim names a library the stack rules out).

### Scope: external verification only

- Research that needs code inspection ("is our current usage of X compatible
  with Y v3") stays in the main session, which can read the code. This matches
  the internal/external verification split in
  [feature-plan.md](feature-plan.md): `src:` proof needs code access and
  `plan-verify` keeps it; `doc:` proof needs network and comes here. This
  workflow industrializes the external half only.
- Verification, not discovery. A brief carries an already-chosen approach to
  confirm ("is this possible / current / standard?"), not an open question to
  explore ("which of five libraries should we pick?"). Open-ended
  option-comparison stays with the interactive `dev-research` skill. The one
  sliver of discovery kept here is bounded: when a claim fails verification, the
  section comes back with why plus the current alternative — a
  rejection-with-finding anchored to a specific failed claim, not open
  exploration. Holding the single-claim / single-source / single-mark invariant
  is what keeps the manager's reject rule crisp and the retry loop bounded.

### Runtime: headless container, on-demand, manual launch

- The tool is a container image with no editor and no UI, running outside the
  dev container. Since it needs no repo content, it is a standalone project
  reusable across every repo built from this seed, rather than a `research`
  service in `.devcontainer/docker-compose.yml`. The container mounts no
  workspace and carries its own iptables allowlist script, versioned and
  PR-reviewable.
- A run is `docker compose run research`: it reads the briefs, runs the manager
  via `claude -p`, writes verified sections to `results/`, and exits. Nothing
  stands between runs.
- The Claude credential lives inside the relaxed-network boundary for headless
  auth; the allowlist is the exfiltration guard (see the allowlist stance).
- Manual foreground launch fits the habit: Docker Desktop runs only while
  coding, and research happens while coding, so an always-up watcher would be up
  only while coding anyway — costing an idle process and a restore-after-restart
  dance for no gain. Foreground launch also buys two simplifications (no
  partial-write race, no watcher; see handoff). Revisit always-up only if the
  per-run command grates.
- The honest catch: the manual `docker compose run` on the machine cannot become
  pure repo-code. That one command is the price for keeping everything else as
  code.

### Handoff: file-drop for v1, Unix-socket endpoint planned

The main session runs inside the project's firewalled container; the tool runs
outside it. The two cannot call each other without poking a hole in the firewall
or handing over Docker access, both of which reopen the blast radius option 4
exists to close. Both handoff shapes below ride the same shared bind mount; only
the tool side changes.

- **Shared folder / file drop (v1, chosen).** The main session writes the brief
  to a shared bind mount; the tool reads it, runs, and writes results back to the
  same place. No firewall hole, no Docker access; brief and results are
  reviewable files on disk. Because launch is manual and foreground, the tool
  does not watch the folder and the returning `docker compose run` is a natural
  done-signal — so there is no partial-write race and no watcher or completion
  poll. Least to build; proves the agent protocol. Cost: a container cold-start
  per run, and no live progress.
- **Unix-domain-socket endpoint (v2, planned).** The tool runs as a standing
  server listening on a socket file in the shared mount (optionally speaking HTTP
  over it, so the client is `curl --unix-socket`). A Unix socket is a filesystem
  object, not a TCP port: it never touches the IP stack, so the container
  firewall does not apply and no firewall edit is needed. Buys a warm server (no
  per-run cold-start) and live progress streaming. The standing server is
  coherent here — it is only called while coding, when Docker is up anyway. It
  flips the trigger from a manual `docker compose run` per run to one `docker
  compose up -d` per coding session, after which Claude calls the socket via Bash
  + `curl`. Costs: a server loop, a small request/response protocol, and
  concurrency handling. Graduate to this when the per-run cold-start grates.

### Allowlist stance

Researcher egress is a curated allowlist, never open. An allowlist limits where
an injected agent can *send* data; remote agents carry Bash, so exfiltration is
one `curl` away on open egress. Official-docs-only also matches the verification
protocol: the manager rejects blog citations anyway. A researcher hitting a
blocked domain is its own failure mode ("source blocked by network policy:
<domain>"), reported through the manager as a proposed allowlist addition for
user sign-off, so the list grows deliberately and auditably.

Any firewall or settings change requires citing docs and user sign-off (CLAUDE.md
rule for `.claude/settings.json`; the firewall script is treated the same).

### Honest limits

- The verification protocol and the 2-attempt rule live in the manager's system
  prompt. Prompt-level rules are followed reliably but are not harness-enforced
  the way tool lists are.
- The `Agent(agent_type)` allowlist syntax is ignored inside subagent
  definitions, so the manager cannot be hard-restricted to spawning only
  researchers. Also prompt-level.
- Parallel researchers multiply token cost. The manager's instructions cap
  concurrent researchers (proposed: 3).

### Runner: headless Claude Code, swappable

Headless Claude Code, not an Agent SDK app. Least to build, and it reuses the
`Agent` / `SendMessage` machinery the protocol is already written against. The
swap to the SDK stays cheap: the manager/researcher prompts, the brief template,
the file-drop boundary, the container, and the allowlist are all
runner-independent, and the main session and trigger skill only ever touch the
shared folder — so graduating rewrites just the orchestration layer, mostly
wrapping the existing prompts in code-enforced caps. Do it only if the
prompt-level caps (see honest limits) prove too loose.

### Layout: a main-owned briefs / results exchange

The shared mount is a transient exchange — its durable counterpart is the
project's `impl.md`. (The manager keeps a durable record of its own too, in
`history/`, separate from this exchange; see run history below.) It holds two
subfolders:

- `briefs/` — main writes one brief per `doc:` entry here. Mounted **read-only**
  into the tool, so the manager can read a claim but never rewrite the thing it is
  checking — structural backing for "claims pass through verbatim".
- `results/` — the manager writes each brief's terminal outcome here as its own
  file (one per entry): a verified section, a failed claim, or a needs-clarification
  bounce, each carrying its brief's key, outcome type, and a timestamp. Main reads
  them back.

Each result file carries its brief's **key** (`entry-ref` + content hash, defined
in the brief template above); computing the hash is a local one-shot, no network.

**Main owns the reset.** Because `briefs/` is read-only to the tool, only main can
clear the exchange: on each trigger main empties `briefs/` and `results/` and
writes the fresh briefs. The tool keeps nothing between runs.

**No persistent ledger in the exchange.** The manager's run table lives in its
context only (see incremental delivery); `results/` is itself the record of what
resolved, so nothing else in the exchange persists between runs. Per-outcome files
need no manifest — the key on each file does the routing a manifest would have.
The one durable record the manager keeps lives outside the exchange, in
`history/` (see run history below).

### Run history: the record kept across runs

The briefs / results exchange is wiped each run; `history/` is not. The manager
owns it — separate from the exchange, main never touches it — and it accumulates
across runs. `history/` joins `results/` as the manager's only writable paths, so
claims still pass through verbatim.

Each run it records the run's shape — researchers deployed, and totals for
verified, failed, and fired — plus one entry per failure: the brief, the
instruction to that researcher, and a concise, free-form account of how it failed
(the modes aren't mapped yet), without the full transcript. This is the workflow's
measure: each rejection is a bad claim caught, and only an accumulating record
shows how often.

### Researcher model: sonnet, changed only by manual config

Researchers pin `model: sonnet`. The task is bounded — search, fetch, quote — and
parallel researchers multiply token cost, so the cheaper model matters most here;
the manager, which makes the final source-supports-claim call, stays on the
stronger model. The pin is a plain field in `researcher.md`, changed only by a
human editing that file — a versioned, PR-reviewable change. It is never exposed
to the manager, the brief, or any agent at runtime, so no agent can raise its own
model.

## End-to-end flow

(1) Against an `impl.md`, the user fires `/verify-fanout`; (2) the main session
takes the `doc:`-marked entries and writes a brief per entry (projecting `stack`
/ `platform` / `constraints` from `product.md`, and the claim plus acceptance
from the entry); (3) the briefs go to the tool via the shared folder; (4) the
tool's manager audits each brief, spawns researchers, and verifies sources; (5)
each brief's terminal outcome comes back — verified, failed, or needs-clarification;
(6) the user decides which verified sections get stamped
`🔗 verified → doc:` on their impl entries. Steps 1-2 and 6 run in the project;
steps 3-5 are the settled protocol above.

## Rejected alternatives

The blocker that drove the runtime choice: in this dev container the
`project-firewall.sh` egress allowlist is active. `WebSearch` works behind it
(search runs on Anthropic's servers via `api.anthropic.com`), but `WebFetch`
fetches from inside the container and is blocked for any non-allowlisted domain.
So a researcher can find sources but not open them, and the manager cannot verify
links. The firewall is iptables in the shared container; there is no per-agent
network rule. Option 4 (separate container, firewall as code) was chosen over:

- **Relax the firewall for everyone** — allow all outbound 443, or add a
  research-domain block to the script. Rejected: container-wide, so Bash gets the
  same freedom and the exfiltration protection option 4 exists to keep is gone.
- **Run researchers remotely** (`isolation: "remote"`) — the only mechanism
  giving per-agent network rules outside the container firewall. Verified working
  (~95 s end-to-end, ~15.6k tokens fixed per-spawn overhead, shared Pro rate
  limit). Rejected on reproducibility: environments are created and edited only
  in the claude.ai/code browser UI, so none of it is versionable in the repo, and
  the whole path is a gated research preview that can change underneath the
  workflow.
- **Hybrid allowlist** — keep the firewall, add official doc hosts (MDN,
  readthedocs, pypi, npmjs, learn.microsoft.com, ...), lean on WebSearch snippets
  for the rest. Rejected: weakens verification for off-list sources ("WebSearch
  surfaced it" is not "the manager opened it").

Option 4 beats these by not gutting the main container's firewall and by keeping
all config as code (no browser dialogs, no gated preview). Its cost is the most
build effort of the four — a container, its firewall script, and the handoff
plumbing.

Rejected handoff shapes (versus the file-drop / Unix-socket pair above):

- **Exec into the tool's container.** Direct, but needs Docker-socket access from
  the dev container, which reopens the blast radius.
- **TCP / published port.** A "real" local API, but needs either a firewall
  pinhole (per-project, needs sign-off) or joining both containers on a shared
  Docker network (couples them, hurts reusability). The Unix socket gives the
  same endpoint ergonomics without touching the firewall.
