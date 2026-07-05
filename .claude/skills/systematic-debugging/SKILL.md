---
name: systematic-debugging
description: >
  Apply whenever the task is diagnosing a bug, a failing test, or unexpected
  behavior, even if the user only says "fix it". Enforces debugging discipline:
  reproduce before changing anything, isolate one variable at a time, back every
  hypothesis with an observation that could falsify it, and confirm the fix
  against the original reproduction. Not required for feature work or requests
  where the cause is already known and stated.
---

# Systematic Debugging

Governs how bugs get diagnosed and fixed. The core rule: never "fix" something that has not been reproduced. A fix without a reproduction is a guess, and a guess that makes the symptom go away can still leave the bug in place.

## 1. Reproduce first

Before touching any code, state the reproduction:

- What exact action triggers the bug (command, request, input, click path).
- What happens, versus what should happen.
- Run the reproduction and confirm you can see the failure yourself whenever the environment allows it. If you cannot run it, say so and ask the user for the failing output instead of assuming.

If the bug cannot be reproduced, stop. Report what was tried and what extra information would make it reproducible. Do not ship a speculative fix for an unreproduced bug.

## 2. Isolate

Narrow down where the failure lives before deciding why it happens:

- Change one variable at a time: one input, one config value, one commit, one layer. If two things changed between a working and a failing run, you have learned nothing.
- Cut the search space in half where possible: does the bad value already exist at the API boundary? In the database? In the request? `git bisect` and minimal failing inputs are both isolation moves.
- Write down (in chat) what has been ruled out, so the search does not revisit it.

## 3. Hypothesize with evidence

Every hypothesis needs an observation that could falsify it, gathered before the fix:

- State the hypothesis: "X fails because Y."
- Name the check that would disprove it: a log line, a debugger value, a targeted test, a smaller reproduction.
- Run the check. If the observation contradicts the hypothesis, discard it and say so; do not stretch the hypothesis to fit.

Reading code and concluding "this must be it" is not evidence. The failure mode to avoid is a plausible story that was never tested against the running system.

## 4. Fix and confirm

- Make the smallest change that addresses the confirmed cause. Do not refactor, clean up, or fix unrelated issues in the same pass; note them for later instead.
- Confirm the fix against the original reproduction from step 1, not only by passing tests. A green suite that never covered the bug proves nothing about it.
- If the project's test suite exists, run it after the fix to check for regressions, and add a test that captures the reproduction so the bug cannot return silently.

## Reporting

At each step, state plainly which stage this is (reproducing, isolating, testing a hypothesis, confirming) and what was observed. If a fix attempt fails, report the failure and return to step 3 with the new observation; do not stack a second guess on top of the first.
