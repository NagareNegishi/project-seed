# Session <N> — <slug> · prompt capture

> LOG ONLY — not a decision input. Never in build-log reasoning. Never pasted
> into a subagent prompt. Read only during a prompt-analysis pass.

## S<N>-<role>-<n> · <agent-type> · <unit>

- spawned: <yyyy-mm-dd> · <background|sync>
- unit: <one line>

### Prompt (verbatim)

```text
<Paste the EXACT prompt text, in full, unedited. NEVER a pointer, summary, or
cross-reference like "see the Agent call" / "identical text above" — those
defeat the capture. A long prompt is still pasted whole.>
```

### Follow-ups (verbatim)

- <round, e.g. "fix round 1 (SendMessage, same agent)">:

```text
<The exact follow-up message text, in full — same verbatim rule as the prompt
block. Omit this whole section if none.>
```

### Outcome — trimmed, not the full report

- returned in required format: <yes|no>
- build/tests after integration: <green|failed> after <n> fix round(s)
- Deviations (verbatim): <agent's Deviations lines, or none>
- Open (verbatim): <agent's Open lines, or none>
