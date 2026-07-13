# AI Documentation Index

**Document ID:** AI-009
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

This index is the central directory for the `documentation/ai/` operational layer. It lists every AI-layer document together with its Document ID, status, purpose, and relationship to the ZOS documentation it is derived from. Per `documentation/ai/AI_WORKFLOW.md` and `documentation/zos/00_README.md`, `documentation/ai/` is an operational layer only — it never overrides, duplicates, or supersedes `documentation/zos/`. This index does not introduce new rules or restate ZOS content; every entry below is drawn from the referenced document's own header metadata and Purpose text.

# Document ID Convention

AI-layer documents are numbered sequentially (`AI-001`, `AI-002`, ...) in creation order, independent of the ZOS-layer `ZOS-0XX` sequence. Unlike `documentation/zos/00_INDEX.md` and `00_README.md` — which deliberately carry no Document ID because their shared `00` filename prefix collides with the numbered `01`–`20` ZOS sequence — this index is assigned `AI-009`, since the AI-layer sequence has no such collision (there is no `AI-000` numbering rule to conflict with). This is a deliberate divergence from the ZOS-layer precedent, not an oversight, and is recorded here for transparency.

Three IDs in the sequence (`AI-009`–`AI-013`) were reserved for the AI Documentation Baseline effort. Their assignment:

| Document ID | Filename | Assignment Basis |
|:---|:---|:---|
| AI-009 | `00_AI_INDEX.md` | Assigned (this document) |
| AI-010 | `FINAL_DOCUMENTATION_BASELINE_REPORT.md` | Assigned — created following Architecture Team baseline approval |
| AI-011 | `ZENITH_TRANSFER_CONTEXT.md` | Already in use (existing file) |
| AI-012 | `BASELINE_SNAPSHOT.md` | Assigned |
| AI-013 | `ENGINEERING_HANDOFF.md` | Already in use (existing file) |

This mapping was established by Architecture Team decision as part of the AI Documentation Baseline preparation. It fills the previously-unassigned gap at `AI-009`, `AI-010`, and `AI-012`; it is not a recovered historical fact, since no prior document assigns these IDs.

# Document Registry

| Document ID | Filename | Status | Purpose | Relationship to ZOS |
|:---|:---|:---|:---|:---|
| AI-001 | `AI_BOOTSTRAP.md` | Operational Layer (derived from ZOS) | Mandatory AI boot sequence: reading order, repository initialization, stop conditions. | Operationalizes `documentation/zos/20_AI_BOOT_SEQUENCE.md`, `10_AI_ENGINEER_GUIDE.md`, `00_README.md`; defers to `20_AI_BOOT_SEQUENCE.md` on conflict. |
| AI-002 | `PROJECT_STATE.md` | Snapshot — generated from ZOS, not a ZOS document itself | Lightweight, disposable summary of current project state. | Explicitly non-authoritative; defers to `documentation/zos/09_PROJECT_BRAIN.md` and `08_ROADMAP.md`. |
| AI-003 | `AI_WORKFLOW.md` | Operational Layer (derived from ZOS) | Day-to-day AI operating rules: responsibilities, approvals, sprint execution, Git/commit/PR rules, stop conditions, escalation. | Derived from `06_PROJECT_CONSTITUTION.md`, `07_ENGINEERING_WORKFLOW.md`, `10_AI_ENGINEER_GUIDE.md`, `15_CODING_STANDARDS.md`, `16_NAMING_CONVENTIONS.md`. |
| AI-004 | `DOCUMENTATION_AUDIT.md` | Audit Report — factual findings only | Cross-reference and consistency audit of the ZOS and AI documentation layers as they stood at the time of writing. | Audits `documentation/zos/` and `documentation/ai/`; asserts no ZOS content itself. |
| AI-005 | `DOCUMENTATION_REPAIR_PLAN.md` | Proposal — awaiting Architecture Team approval | Proposed remediation for each finding in `DOCUMENTATION_AUDIT.md`. | Proposes edits to ZOS documents; explicit that none apply without Architecture Team approval (Constitution Rule 1, Rule 5). |
| AI-006 | `DOCUMENTATION_REPAIR_REPORT.md` | Completion Report — awaiting Architecture Team review | Records which repair-plan findings were executed, per partial Architecture Team approval. | Documents edits applied to `00_README.md`, `00_INDEX.md`, `01_PROJECT_OVERVIEW.md`, `14_DEPENDENCY_POLICY.md`, `17_RELEASE_PROCESS.md`, `18_PROJECT_GLOSSARY.md`, and creation of `SPRINT_BRIEF_TEMPLATE.md`, `19_ONBOARDING_GUIDE.md`, `20_AI_BOOT_SEQUENCE.md`. |
| AI-007 | `POST_REPAIR_VERIFICATION.md` | Verification Report — awaiting Architecture Team sign-off | Verifies the repair report's changes against their approved sources; registers unresolved items as backlog. | Verifies `AI_BOOTSTRAP.md` edits and `20_AI_BOOT_SEQUENCE.md` content against `06_PROJECT_CONSTITUTION.md`, `07_ENGINEERING_WORKFLOW.md`, `10_AI_ENGINEER_GUIDE.md`. |
| AI-008 | `PROJECT_BACKLOG.md` | Approved | Single authoritative backlog of deferred, not-yet-scoped work items (BL-001–BL-003). | References `documentation/zos/09_PROJECT_BRAIN.md`; explicit that backlog entries are not sprint authorization. |
| AI-009 | `00_AI_INDEX.md` | Approved | This document. | Indexes the AI layer only; does not restate or override ZOS content. |
| AI-010 | `FINAL_DOCUMENTATION_BASELINE_REPORT.md` | Approved | Records the Architecture Team's baseline approval decision, audit scope, and completed repair/reconciliation activities. | Reports on, but does not itself modify, `documentation/zos/`; records the approval event only. |
| AI-011 | `ZENITH_TRANSFER_CONTEXT.md` | Operational Layer — Official AI Entry Point | First document an AI session should open; points to where project knowledge lives and the order to acquire it. | Defers entirely to `documentation/zos/`; does not duplicate its content. |
| AI-012 | `BASELINE_SNAPSHOT.md` | Approved | Point-in-time snapshot of repository/documentation state, dated at generation. | Records counts and structure of both `documentation/zos/` and `documentation/ai/` as observed, not as ZOS content itself. |
| AI-013 | `ENGINEERING_HANDOFF.md` | Approved | Entry point marking the transition from Documentation Phase to Engineering Phase; mandatory boot order for implementation sessions. | Cites `documentation/zos/09_PROJECT_BRAIN.md` for current phase/sprint; mandates reading `04_TECH_STACK.md`, `05_ARCHITECTURE.md`, `13_FOLDER_STRUCTURE.md`, `14_DEPENDENCY_POLICY.md`, `15_CODING_STANDARDS.md`, `16_NAMING_CONVENTIONS.md` before S1-001 implementation. |
| AI-014 | `S1-001_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-001, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-001's closure. |
| AI-015 | `S1-002_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-002, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-002's closure. |
| AI-016 | `S1-003_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-003, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-003's closure. |
| AI-017 | `S1-004_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-004, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-004's closure. |
| AI-018 | `S1-005_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-005, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-005's closure. |
| AI-019 | `S1-006_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-006, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-006's closure. |
| AI-020 | `S1-007_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-007, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-007's closure. |
| AI-021 | `S1-008_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-008 Sprint Brief, approved by the Architecture Team. | Sequences `S1-008_SPRINT_BRIEF.md`'s Scope into dependency-ordered Work Packages; does not expand or reinterpret it. |
| AI-022 | `S1-008_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-008, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-008's closure. |
| AI-023 | `S1-009_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-009 Sprint Brief (Wyckoff Method Analysis Provider), approved by the Architecture Team. | Sequences `S1-009_SPRINT_BRIEF.md`'s Scope into 13 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-024 | `S1-009_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-009, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-009's closure. |
| AI-025 | `S1-010_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-010 Sprint Brief (ICT/SMC Analysis Provider), approved by the Architecture Team. | Sequences `S1-010_SPRINT_BRIEF.md`'s Scope into 14 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-026 | `S1-010_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-010, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-010's closure. |
| AI-027 | `S1-011_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-011 Sprint Brief (Elliott Wave Analysis Provider), approved by the Architecture Team. | Sequences `S1-011_SPRINT_BRIEF.md`'s Scope into 14 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-028 | `S1-011_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-011, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-011's closure. |
| AI-029 | `S1-012_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-012 Sprint Brief (Confluence Engine), approved by the Architecture Team. | Sequences `S1-012_SPRINT_BRIEF.md`'s Scope into 15 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-030 | `S1-012_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-012, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-012's closure. |
| AI-031 | `S1-013_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-013 Sprint Brief (Harmonic Patterns Analysis Provider), approved by the Architecture Team. | Sequences `S1-013_SPRINT_BRIEF.md`'s Scope into 15 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-032 | `S1-013_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-013, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-013's closure. |
| AI-033 | `S1-014_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-014 Sprint Brief (Classical Chart Patterns Analysis Provider), approved by the Architecture Team. | Sequences `S1-014_SPRINT_BRIEF.md`'s Scope into 15 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-034 | `S1-014_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-014, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-014's closure. |
| AI-035 | `S1-015_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-015 Sprint Brief (Price Action Analysis Provider), approved by the Architecture Team. | Sequences `S1-015_SPRINT_BRIEF.md`'s Scope into 16 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-036 | `S1-015_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-015, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-015's closure. |
| AI-037 | `S1-016_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-016 Sprint Brief (Supply & Demand Analysis Provider), approved by the Architecture Team. | Sequences `S1-016_SPRINT_BRIEF.md`'s Scope into 15 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |
| AI-038 | `S1-016_COMPLETION_REPORT.md` | Approved | Structured completion report for Sprint S1-016, reviewed and approved by the Architecture Team. | Basis for the `09_PROJECT_BRAIN.md` update recording S1-016's closure. |
| AI-039 | `S1-017_TASK_BREAKDOWN.md` | Approved | Execution-guidance Work Package breakdown for the approved S1-017 Sprint Brief (Fibonacci Analysis Provider), approved by the Architecture Team. | Sequences `S1-017_SPRINT_BRIEF.md`'s Scope into 16 dependency-ordered Work Packages, each with Deliverables/Acceptance Criteria/Verification Steps/Risks/Completion Criteria; does not expand or reinterpret it. |

# Known Open Items

All items previously tracked here (FR-003, FR-004, FR-006, FR-009, FR-012, BL-001, BL-002, BL-003, the ZOS document-count discrepancy) were resolved or accurately recorded as accepted backlog. `documentation/zos/09_PROJECT_BRAIN.md` (BL-003) was populated by the Architecture Team upon S1-001 closure (2026-07-12) — see `documentation/ai/S1-001_COMPLETION_REPORT.md` (AI-014). No items remain open on this index beyond ordinary sprint-to-sprint tracking in `documentation/ai/PROJECT_BACKLOG.md`.

# Related Documents

- `documentation/ai/ZENITH_TRANSFER_CONTEXT.md`
- `documentation/ai/AI_BOOTSTRAP.md`
- `documentation/ai/PROJECT_BACKLOG.md`
- `documentation/zos/00_INDEX.md`
- `documentation/zos/00_README.md`
