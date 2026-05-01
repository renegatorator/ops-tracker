You are implementing a complex feature in a large production application.

FIRST:
Read only the relevant docs from /docs/ai before inspecting code.

Prioritize:

invariants.md
permissions-matrix.md
coding-standards.md
relevant architecture/_
relevant context/_
relevant current-features/\*

Then inspect only the source files relevant to this feature.

Your first task is NOT implementation.

Create:
/docs/ai/plans/[feature-name]/

Inside create:

investigation.md
overview.md
execution-order.md
testing-strategy.md
phase-01-_.md
phase-02-_.md
etc.

Requirements:

break the feature into small isolated phases
each phase should ideally stay well under 100k context tokens
each phase must be independently testable
each phase must be executable in a fresh Cursor session
avoid giant phases and avoid loading unrelated files
preserve existing architecture and patterns
preserve RBAC and audit logging guarantees
identify risks and edge cases
include required tests for each phase

Each phase file must contain:

objective
required docs/context
affected files
implementation steps
tests
validation checklist
risks
completion criteria

If anything is unclear, ask. If you can find the answer in code, do that instead.

Do NOT implement anything yet.

After planning is complete:
STOP.

Future implementation will happen phase-by-phase in fresh context windows.
