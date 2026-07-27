# Agent drafts

Drafts for custom subagents. Nothing here is active: Claude Code only loads
agents from `.claude/agents/`, so files in this directory are reference only.

The draft format, the promoted-file anatomy, and the promote/polish process are all
in [authoring.md](authoring.md).

## Drafts

Testers:

- [blackbox-tester](blackbox-tester.md) — writes tests from the spec alone, never reading the implementation; spawned at session start.
- [whitebox-tester](whitebox-tester.md) — after code lands, adds tests for internal branches, boundaries, and error paths, then runs the suite.
- [mcdc-tester](mcdc-tester.md) — optional; designs MC/DC decision-coverage cases for units with dense boolean logic. Complements whitebox-tester.

Review layer (critics — one axis each, problems only, no fixes):

- [correctness-critic](correctness-critic.md) — finds logic errors, missed edge cases, and contract violations in the implementation.
- [security-critic](security-critic.md) — finds security risks and holes in an idea or implementation.
- [design-critic](design-critic.md) — argues why an idea or implementation is bad design, non-standard, or unwanted.
- [simplicity-critic](simplicity-critic.md) — finds redundant logic, over-complication, dead code, and duplication.
- [performance-critic](performance-critic.md) — finds performance and efficiency problems: bad complexity, needless work, resource waste.
- [docs-critic](docs-critic.md) — finds missing, inaccurate, or out-of-date documentation and comments.
- [legal-critic](legal-critic.md) — finds licensing, attribution, and data-handling/compliance risks.
- [change-discipline-critic](change-discipline-critic.md) — judges a diff against its mandate: scope creep, weakened tests, visibility widened for testing, symptom-patching.

Advisory:

- [researcher](researcher.md) — executes one research task, reports back with a verifiable reference on every claim.
- [verifier](verifier.md) — adversarially checks a researcher report, pass/fail per claim with its own evidence.
- [alternatives-explorer](alternatives-explorer.md) — runs after the critics; explores alternative approaches that avoid the reported problems.
- [debugger](debugger.md) — diagnoses the root cause of a reproduced failure and reports it; does not fix.
