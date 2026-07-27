# Agent drafts

Drafts for custom subagents, one per file in [`drafts/`](drafts/). Nothing here is
active: Claude Code only loads agents from `.claude/agents/`, so these files are
reference only.

The draft format, the promoted-file anatomy, and the promote/polish process are all
in [authoring.md](authoring.md).

## Drafts

Testers:

- [blackbox-tester](drafts/blackbox-tester.md) — writes tests from the spec alone, never reading the implementation; spawned at session start.
- [whitebox-tester](drafts/whitebox-tester.md) — after code lands, adds tests for internal branches, boundaries, and error paths, then runs the suite.
- [mcdc-tester](drafts/mcdc-tester.md) — optional; designs MC/DC decision-coverage cases for units with dense boolean logic. Complements whitebox-tester.

Review layer (critics — one axis each, problems only, no fixes):

- [correctness-critic](drafts/correctness-critic.md) — finds logic errors, missed edge cases, and contract violations in the implementation.
- [security-critic](drafts/security-critic.md) — finds security risks and holes in an idea or implementation.
- [design-critic](drafts/design-critic.md) — argues why an idea or implementation is bad design, non-standard, or unwanted.
- [simplicity-critic](drafts/simplicity-critic.md) — finds redundant logic, over-complication, dead code, and duplication.
- [performance-critic](drafts/performance-critic.md) — finds performance and efficiency problems: bad complexity, needless work, resource waste.
- [docs-critic](drafts/docs-critic.md) — finds missing, inaccurate, or out-of-date documentation and comments.
- [legal-critic](drafts/legal-critic.md) — finds licensing, attribution, and data-handling/compliance risks.
- [change-discipline-critic](drafts/change-discipline-critic.md) — judges a diff against its mandate: scope creep, weakened tests, visibility widened for testing, symptom-patching.

Advisory:

- [researcher](drafts/researcher.md) — executes one research task, reports back with a verifiable reference on every claim.
- [verifier](drafts/verifier.md) — adversarially checks a researcher report, pass/fail per claim with its own evidence.
- [alternatives-explorer](drafts/alternatives-explorer.md) — runs after the critics; explores alternative approaches that avoid the reported problems.
- [debugger](drafts/debugger.md) — diagnoses the root cause of a reproduced failure and reports it; does not fix.
