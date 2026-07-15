# Implementation plan: verify-fanout

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 5 · 👤 human-ok 0 · ✅ settled 3

## Overview
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

The build is three new pieces plus the container that runs two of them. A
standalone Docker image runs headless Claude Code outside the project's dev
container, where a research-manager agent dispatches researcher subagents,
verifies their cited sources, drops verified sections into a shared results
folder, and appends run telemetry to a history log it owns. Inside the project, a
`verify-fanout` trigger skill writes briefs from an `impl.md`'s `doc:` entries and
reads the verified sections back. The main session and the tool meet only at a
shared bind mount, so neither reaches across the firewall.

## Risks & unknowns
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

- Nested subagents in headless Claude Code. The manager spawns researchers via
  `Agent` and resumes a rejected one via `SendMessage`. The design assumes
  depth-2 nesting works and that only the top-level summary returns to the
  caller. Not opened; verify before leaning on it.
- Prompt-level caps only. The 3-attempt rule, the researcher-only spawn
  restriction, and the concurrency cap live in the manager's prompt, not the
  harness, so they can drift. If they prove too loose, the Agent SDK swap is the
  fallback.
- Firewall-as-code correctness. The separate container's iptables allowlist must
  let `WebFetch` reach allowlisted doc hosts while blocking everything else. This
  shape is untested in this repo.
- Done-signal assumption. The file-drop handoff treats the returning `docker
  compose run` as the completion signal, which holds only while launch stays
  manual and foreground. The planned v2 socket changes this.
- Key/hash routing. The content-hash key that routes a result to its impl entry
  and flags a stale one is new. Drift in what goes into the hash could misroute a
  section.
- History that outlives the exchange. `history/` must persist across runs while
  `briefs/` and `results/` are wiped every run, so it is a separate durable mount
  (a named volume, not the reset-each-run exchange) that the main-owned reset must
  never touch. That split is untested here.
- Token cost of parallel researchers is real and bounded only by the prompt-level
  concurrency cap.

## Steps

### Step 1: Stand up the research container with firewall as code
✅ settled · ❔ unverified (net-new)

Build the standalone Docker image and its compose entry, as its own project
rather than a service in `.devcontainer/docker-compose.yml`. Mount no workspace;
mount `briefs/` read-only and `results/` writable, plus a persistent `history/`
store the manager owns and the main session never touches — a durable mount that
survives the per-run reset, unlike the wiped exchange. Ship an iptables allowlist
script, versioned and PR-reviewable, that permits only the curated doc hosts plus
the Anthropic API. The entry point runs headless Claude Code and exits, so a run
is `docker compose run research`.

### Step 2: Write the researcher agent definition
🤖 ai-audited(opus-4.8) · ❔ unverified (net-new)

`researcher.md` in the tool's own repo. `tools`: `WebSearch, WebFetch, Read`
(possibly `Grep, Glob`), with no `Write`, `Edit`, or `Bash`, so the no-write rule
is structural. `model: sonnet`. The body holds the claim-with-evidence contract:
every claim carries a source URL and a quoted excerpt that supports it, and the
researcher never asserts what it did not fetch.

### Step 3: Write the research-manager agent definition
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

`research-manager.md`, tools including `Agent`, `SendMessage`, `WebFetch`,
`Read`, and `Write` (writable paths are `results/` and `history/` only, by
mount). The body carries the whole protocol: audit each brief for answerability
before spawning; one researcher per claim up to the concurrency cap; fetch and
check every cited source; reject a whole section with a specific reason; return a
rejection to the same researcher via `SendMessage` for up to 3 attempts; on the
third failure spawn a fresh researcher with a failure dossier; write each verified
section to `results/` as its own keyed file before moving on; keep the run table
in context only. Alongside that, record run telemetry to `history/`: the count of
researchers deployed and totals for verified, failed, and fired, plus one
free-form entry per failure holding the brief, the instruction to that researcher,
and a concise account of how it failed — no full transcript. Leans on
nested-subagent behavior, so it stays unverified until `plan-verify`.

### Step 4: Define the brief template and the key scheme
✅ settled · ❔ unverified (net-new)

The four researcher-facing fields (`claim`, `motivation`, `constraints`,
`acceptance`, with a default acceptance the main session can sharpen) plus the
routing `entry-ref`. Define the content hash over `claim` + `acceptance` that
forms the brief **key**, and the on-disk shape of a brief file in `briefs/`. Each
result echoes the key, so main routes a section to its entry and treats a hash
mismatch as stale.

### Step 5: Build the verify-fanout trigger skill
🤖 ai-audited(opus-4.8) · ❔ unverified (not checked)

`.claude/skills/verify-fanout`, `disable-model-invocation: true`, command only,
living in this repo. On trigger: empty `briefs/` and `results/` — the main-owned
reset, which never touches the manager's `history/` — read the `impl.md` `doc:`
entries, project `stack` / `platform` / `constraints` from `product.md` and
`claim` + `acceptance` from each entry into one brief per entry, and write them to
`briefs/`. After the run returns, read `results/` and let the user pick which
sections get stamped `🔗 verified → doc:` on their impl entries. `plan-verify`
still handles the `src:` entries. Leans on the existing `impl.md` / `product.md`
mark formats.

### Step 6: Wire the headless run and the file-drop handoff
✅ settled · ❔ unverified (not checked)

The container entry point runs the manager via `claude -p` against `briefs/` and
writes to `results/` and `history/`. The main session and the tool share only the
bind mount, and the returning `docker compose run` is the done-signal, so main
reads `results/` only after it returns and there is no partial-read race. Document
the manual foreground launch as the one out-of-repo command. Leans on `claude -p`
and `docker compose run` behavior.
