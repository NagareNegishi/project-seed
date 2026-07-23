# Prompt log

Raw record of the exact prompt each subagent received in a `build-orchestration`
session, plus a deferred evaluation of how each performed and whether the
manager allocated the right agents. Local analysis data — only this README and
`_template.md` are tracked; the captures, `evaluations.md`, and `allocation.md`
are gitignored and never committed.

## Rules

- **Log only.** Never a build-decision input. Do not read a capture file to
  decide session work; it never appears in build-log reasoning.
- **Off limits to subagents.** Never paste any part of this tree into a
  subagent prompt.
- **Capture is factual, and verbatim.** Write it live, at spawn and at return,
  with no judgment. The `### Prompt (verbatim)` block holds the exact prompt
  text, pasted in full — **never a pointer, summary, or cross-reference**
  ("see the Agent call", "identical text above", "full flow contract, …").
  A long prompt is still pasted whole; length is not a reason to abbreviate.
  A capture you cannot replay the instruction from has failed its one job.
- **Evaluate later.** Judgment goes only in `evaluations.md` and
  `allocation.md`, in a dedicated analysis pass, keyed by entry ID — never live.

## Files

- `<yyyy-mm-dd>-<slug>.md` — one capture file per session; slug matches the
  session's `docs/build-log/` entry. Copy [`_template.md`](_template.md).
- `evaluations.md` — rolling per-spawn prompt evaluation, keyed by capture entry
  ID. Judges how well each *sent* prompt was written.
- `allocation.md` — rolling per-unit allocation evaluation. Judges whether the
  manager spawned the *right set* of agents for each unit.

## Entry ID

`S<session>-<role>-<n>` — e.g. `S6-impl-2`, `S6-critic-1`. Roles:

`impl` · `blackbox` · `whitebox` · `mcdc` · `critic` · `debug` · `research` ·
`verify` · `altex`

`critic` covers all eight review-layer critics; the `· <agent-type> ·` field on
the capture header carries the specific axis (`security-critic`). IDs are stable
across capture, evaluation, and allocation.

## evaluations.md format

Per spawned prompt, keyed by entry ID. Rate each dimension `high|med|low`; keep
every line one clause.

```markdown
## S<N>-<role>-<n>

- scope clarity:       <high|med|low>
- context sufficiency: <high|med|low>   ← note what it had to guess
- format compliance:   <high|med|low>
- rounds to green:     <n>
- scope adherence:     <ok|drifted — how>
- prompt gap: <the one thing the prompt failed to state>
- fix: <change to the build-orchestration SKILL rules or the agent draft>
```

## allocation.md format

Per unit, one entry. The `deployed`/`skipped` facts are written at session
close; the `grade` and `fix` lines are filled in the deferred analysis pass —
leave them until then.

```markdown
## S<N> · <unit>

- deployed: <critics spawned>            ← cross-refs the capture entry IDs
- skipped:  <critic — one-line reason>, …
- grade (deferred):
    waste: <critic spawned, returned empty on this unit-shape — or none>
    miss:  <critic skipped, a defect slipped in its axis — or none observed>
    kind:  <allocation-miss | critic-miss | none>
- fix: <change to an allocation rule in build-orchestration — or none>
```

`kind` separates the two failures that need different fixes: `allocation-miss`
(skipped the critic that would have caught it → widen the allocation rule) from
`critic-miss` (spawned it, it missed anyway → sharpen that agent).
