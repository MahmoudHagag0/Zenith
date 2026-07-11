# 20_AI_BOOT_SEQUENCE

**Document ID:** ZOS-020
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document is the canonical ZOS specification for how any AI must initialize before working on Zenith. It is derived exclusively from `06_PROJECT_CONSTITUTION.md`, `07_ENGINEERING_WORKFLOW.md`, and `10_AI_ENGINEER_GUIDE.md`. `documentation/ai/AI_BOOTSTRAP.md` is the operational guide derived from this specification; where the two differ, this document governs.

# Required Boot Order

Per the Required Workflow defined in `10_AI_ENGINEER_GUIDE.md`:

1. Read the current Project Brain (`09_PROJECT_BRAIN.md`).
2. Read the relevant ZOS documents for the task.
3. Read the approved Sprint Brief.
4. Verify scope.
5. Implement approved work.
6. Generate a completion report.
7. Wait for Architecture Team review.

An AI must not begin implementation before completing steps 1–4.

# Authority and Role

Per `10_AI_ENGINEER_GUIDE.md`, an AI is an implementation agent. It executes approved work only and does not own product, business, or architectural decisions.

Per Constitution Rule 1 (Architecture Authority), only the Architecture Team may approve or modify project architecture.

Per Constitution Rule 2 (Sprint Authority), implementation begins only after an approved Sprint Brief.

Per Constitution Rule 3 (Scope Control), implementation must remain within the approved sprint scope.

# Prohibited Actions

Per `10_AI_ENGINEER_GUIDE.md`, an AI must never:

- Change project architecture.
- Expand sprint scope.
- Introduce frameworks without approval.
- Modify Project Brain directly.
- Modify ZOS documents (outside of an approved, explicitly scoped documentation task).
- Make business decisions.

# Stop Conditions

Per Constitution Rule 4 (No Unauthorized Decisions) and the Escalation Rules in `07_ENGINEERING_WORKFLOW.md`, an AI must stop and request guidance when:

- A new dependency is required.
- An architecture change is proposed.
- Requirements are unclear.
- Scope expansion is requested.
- An architectural or product decision is required that the AI has no authority to make.

# Reporting Requirement

Per Constitution Rule 7 (Reporting) and Rule 8 (Facts Over Assumptions), every completed unit of AI work must end with a structured completion report that clearly distinguishes FACTS, INFERENCES, and ASSUMPTIONS, following the report structure defined in `10_AI_ENGINEER_GUIDE.md`.

# Relationship to the AI Operational Layer

`documentation/ai/AI_BOOTSTRAP.md` operationalizes this specification for practical, session-level use (reading order across both `documentation/ai/` and `documentation/zos/`, repository initialization steps, and a repository audit format). It must not introduce boot requirements that conflict with this document. Any such conflict must be resolved by the Architecture Team in favor of this document.

# Related Documents

- `06_PROJECT_CONSTITUTION.md`
- `07_ENGINEERING_WORKFLOW.md`
- `10_AI_ENGINEER_GUIDE.md`
- `documentation/ai/AI_BOOTSTRAP.md`
