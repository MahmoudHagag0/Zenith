# AI_WORKFLOW

**Document ID:** AI-003
**Version:** 1.0.0
**Status:** Operational Layer (derived from ZOS)
**Owner:** Architecture Team (via Implementation Engineer)
**Source of Truth:** `documentation/zos/`

---

# Purpose

This document defines how AI agents operate day-to-day inside Zenith: responsibilities, approvals, sprint execution, documentation updates, Git, commits, pull requests, stop conditions, and escalation.

This is an **operational** document only. It contains no architecture content. For architecture, see `documentation/zos/05_ARCHITECTURE.md`.

---

# 1. Responsibilities

Per `10_AI_ENGINEER_GUIDE.md`, an AI agent acting on Zenith is an **implementation agent**. It:

- Executes only approved work.
- Does not own product, business, or architectural decisions.
- Reads ZOS and the current Project Brain before implementation.
- Executes only the approved Sprint Brief.
- Produces structured completion reports.
- Stops when an architectural or product decision is required.

An AI agent must never (per `10_AI_ENGINEER_GUIDE.md`):

- Change project architecture.
- Expand sprint scope.
- Introduce frameworks or dependencies without approval.
- Modify `09_PROJECT_BRAIN.md` directly.
- Modify any ZOS document.
- Make business decisions.

---

# 2. Approval Process

Per `06_PROJECT_CONSTITUTION.md` (Rule 1, Rule 2) and `01_PROJECT_OVERVIEW.md` (Engineering Model):

- Only the Architecture Team approves architecture and sprint scope.
- Implementation begins only after an approved Sprint Brief exists.
- The AI executes only what has been approved — nothing implied, nothing anticipated.

---

# 3. Sprint Execution Rules

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, the execution sequence is:

1. Read the current Project Brain (`09_PROJECT_BRAIN.md`).
2. Read the relevant ZOS documents for the task.
3. Read the approved Sprint Brief.
4. Verify the requested work matches the approved scope exactly.
5. Implement only the approved work.
6. Generate a completion report.
7. Stop and wait for Architecture Team review.

A sprint is considered complete only when (Definition of Done, `07_ENGINEERING_WORKFLOW.md`):

- Scope is implemented.
- No unauthorized changes were made.
- A completion report has been submitted.
- Architecture review has occurred.
- Project Brain has been updated (by the Architecture Team, not the AI).
- The sprint has been formally closed.

---

# 4. Documentation Update Rules

- The AI may create or update documents inside `documentation/ai/` as part of its operational layer responsibilities.
- The AI must never modify any document inside `documentation/zos/` directly (`00_README.md`, `10_AI_ENGINEER_GUIDE.md`).
- Any architectural decision must be documented (as an ADR / Decision Log entry) **before** implementation, per Constitution Rule 5 — but the entry itself is authored/approved by the Architecture Team, not unilaterally created by the AI.
- Documentation updates required by a sprint are a sprint deliverable (`07_ENGINEERING_WORKFLOW.md` — Deliverables) and must be listed in the completion report.

---

# 5. Git Workflow

Per `16_NAMING_CONVENTIONS.md`:

**Branch naming:**
- `feature/` — new functionality
- `bugfix/` — non-critical fixes
- `hotfix/` — urgent fixes
- `release/` — release preparation
- `docs/` — documentation-only changes
- `refactor/` — internal restructuring without behavior change

Examples: `feature/authentication`, `feature/prisma-models`, `bugfix/login-validation`, `docs/zos-update`.

---

# 6. Commit Rules

Per `16_NAMING_CONVENTIONS.md`, commits use the conventional prefix format:

`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`, `perf:`, `style:`, `chore:`

Examples:
- `feat(auth): implement JWT authentication`
- `fix(api): resolve validation issue`
- `docs(zos): update architecture documentation`

Commits must reflect only the approved scope of work being executed.

---

# 7. Pull Request Rules

ZOS does not currently define a dedicated PR document. Until one exists, PR practice follows directly from the Engineering Workflow and Coding Standards already approved:

- A PR must map to a single approved Sprint Brief (or a clearly-scoped subset of one).
- A PR must satisfy the Code Review Checklist in `15_CODING_STANDARDS.md`: architecture respected, types correct, no duplicated logic, naming follows standards, validation implemented, errors handled, logging appropriate, documentation updated where required, no unauthorized dependencies, no security concerns.
- A PR is not mergeable on the AI's own authority — Architecture Review (Engineering Workflow step 5) and Approval (step 6) are required before closure.

---

# 8. Stop Conditions

The AI must immediately stop and request guidance when, per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`:

- A new dependency is required.
- An architecture change is proposed or implied.
- Requirements conflict or are unclear.
- Scope expansion is requested.
- A decision would otherwise require inventing information not present in ZOS or an approved Sprint Brief.

---

# 9. Escalation Rules

Per Constitution Rule 4 (No Unauthorized Decisions):

- Implementation engineers (AI or human) must stop and request guidance whenever an architectural or product decision is required — they must not proceed on inference.
- Escalation is directed to the Architecture Team.
- Escalated items must be recorded as Open Questions or Blockers so they surface in the next Project Brain update (`09_PROJECT_BRAIN.md`).

---

# 10. Completion Reporting

Every unit of AI work ends with a completion report containing, per `10_AI_ENGINEER_GUIDE.md`:

- Sprint ID
- Status
- Objectives Completed
- Files Created
- Files Modified
- Dependencies Added
- Architecture Changes
- FACTS
- INFERENCES
- ASSUMPTIONS
- Issues Found
- Manual Actions Required
- Awaiting Architecture Team Instructions
- Executive Summary

FACTS, INFERENCES, and ASSUMPTIONS must be kept explicitly distinct, per Constitution Rule 8.

---

# Related Documents

- `documentation/ai/AI_BOOTSTRAP.md`
- `documentation/ai/PROJECT_STATE.md`
- `documentation/zos/06_PROJECT_CONSTITUTION.md`
- `documentation/zos/07_ENGINEERING_WORKFLOW.md`
- `documentation/zos/10_AI_ENGINEER_GUIDE.md`
- `documentation/zos/15_CODING_STANDARDS.md`
- `documentation/zos/16_NAMING_CONVENTIONS.md`
