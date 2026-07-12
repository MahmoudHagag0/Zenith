# AI_BOOTSTRAP

**Document ID:** AI-001
**Version:** 1.0.0
**Status:** Operational Layer (derived from ZOS)
**Owner:** Architecture Team (via Implementation Engineer)
**Source of Truth:** `documentation/zos/`

---

# Purpose

This document defines the mandatory boot sequence every AI (Claude, ChatGPT, Gemini, Nova, or any future agent) must follow before doing any work on Zenith.

This document does not introduce new rules. It operationalizes the boot requirements defined in the canonical ZOS specification, `documentation/zos/20_AI_BOOT_SEQUENCE.md`, together with `10_AI_ENGINEER_GUIDE.md` and `00_README.md`. Where this document and `20_AI_BOOT_SEQUENCE.md` differ, `20_AI_BOOT_SEQUENCE.md` governs.

---

# 1. Reading Order

An AI session must read documents in this exact order before proposing or executing any work:

1. `documentation/ai/ZENITH_TRANSFER_CONTEXT.md` — entry point and executive summary.
2. `documentation/ai/PROJECT_STATE.md` — current project snapshot.
3. `documentation/ai/AI_WORKFLOW.md` — operational rules for how AI agents act.
4. `documentation/zos/00_README.md` — ZOS purpose and source-of-truth order.
5. `documentation/zos/06_PROJECT_CONSTITUTION.md` — binding engineering rules.
6. `documentation/zos/09_PROJECT_BRAIN.md` — live operational memory (current state).
7. `documentation/zos/10_AI_ENGINEER_GUIDE.md` — AI role, responsibilities, prohibited actions.
8. Remaining ZOS documents (`01` through `18`) as relevant to the task at hand.
9. The approved Sprint Brief for the current work, if one exists.

This mirrors the Required Workflow defined in `10_AI_ENGINEER_GUIDE.md`: Read Project Brain → Read relevant ZOS documents → Read Sprint Brief → Verify scope → Implement → Report → Wait for review.

---

# 2. Repository Initialization

Before forming any conclusions, the AI must:

- Confirm actual read access to the repository (files, not summaries or memory).
- Inspect the real repository tree as it currently exists.
- Not assume the structure described in `13_FOLDER_STRUCTURE.md` or `01_PROJECT_OVERVIEW.md` is already implemented — those documents describe **approved** structure, not necessarily **current** structure. The two must be verified against each other, not treated as identical.

---

# 3. Repository Audit

The AI must produce a short factual audit covering:

- Current Project Phase
- Current Sprint
- Repository Structure (as actually observed)
- Existing Applications (as actually observed)
- Existing Packages (as actually observed)
- Pending Work
- Real Blockers

Any field that cannot be verified against actual repository content or an actual ZOS entry must be marked **Not Recorded** rather than inferred or invented (Constitution Rule 8 — Facts Over Assumptions).

---

# 4. Context Loading

Context is loaded strictly in this priority order, per the ZOS Source of Truth hierarchy (`00_README.md`):

1. Approved Architecture Decisions (ADR)
2. Project Constitution
3. ZOS Documentation
4. Approved Sprint Brief
5. Source Code

If the repository (source code) conflicts with approved architecture or documentation, the AI must stop and flag the conflict to the Architecture Team — it must not silently resolve it in either direction.

---

# 5. Architecture Loading

- Architecture is defined exclusively in `05_ARCHITECTURE.md`, `04_TECH_STACK.md`, and `13_FOLDER_STRUCTURE.md`.
- The AI must load and respect these documents as binding constraints, not as suggestions.
- The AI must never propose, imply, or implement an architecture change. Architecture changes belong solely to the Architecture Team (Constitution Rule 1).

---

# 6. Sprint Loading

- The AI must identify the current approved Sprint Brief before implementing anything.
- If no approved Sprint Brief exists, or if `SPRINT_BRIEF_TEMPLATE.md` is unavailable in the repository, the AI must stop and request one rather than inferring scope from the Roadmap or Project Brain (Constitution Rule 2 — Sprint Authority).
- Implementation must remain strictly within the loaded Sprint Brief's scope (Constitution Rule 3 — Scope Control).

---

# 7. Stop Conditions

The AI must immediately stop and request Architecture Team guidance when, per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`:

- A new dependency is required.
- An architecture change is proposed or implied.
- Requirements are unclear or conflicting.
- Scope expansion is requested.
- A required ZOS or AI-layer document is missing or cannot be located.
- Project Brain state cannot be verified against the real repository.

---

# 8. Approval Workflow

Every unit of work follows the Engineering Workflow defined in `07_ENGINEERING_WORKFLOW.md`:

1. Architecture Planning
2. Sprint Brief Approval
3. Implementation
4. Engineering Completion Report
5. Architecture Review
6. Approval or Required Changes
7. Project Brain Update
8. Sprint Closure

The AI never performs steps 6 or 7. It produces a completion report (per the structure defined in `10_AI_ENGINEER_GUIDE.md`) and then stops, waiting for the Architecture Team.

---

# Note on Missing Documents

`19_ONBOARDING_GUIDE.md`, `SPRINT_BRIEF_TEMPLATE.md`, and `20_AI_BOOT_SEQUENCE.md` — previously missing — have since been created under Architecture Team approval (see `documentation/ai/DOCUMENTATION_REPAIR_REPORT.md`). This document has been reconciled against `20_AI_BOOT_SEQUENCE.md` accordingly (see Purpose above).

The following documents referenced by `00_INDEX.md` remain unavailable:

- `ZENITH_AI_SYSTEM_PROMPT.md`
- `ZENITH_MASTER_CONTEXT.md`
- `NOVA_STARTUP_PACKAGE.md`

These were reviewed and explicitly not approved for creation in this repair cycle. Their absence does not block AI boot per `20_AI_BOOT_SEQUENCE.md`.

---

# Related Documents

- `documentation/ai/PROJECT_STATE.md`
- `documentation/ai/AI_WORKFLOW.md`
- `documentation/ai/ZENITH_TRANSFER_CONTEXT.md`
- `documentation/zos/00_README.md`
- `documentation/zos/06_PROJECT_CONSTITUTION.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/10_AI_ENGINEER_GUIDE.md`
