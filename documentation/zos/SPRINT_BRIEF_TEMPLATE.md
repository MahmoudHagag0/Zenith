# SPRINT_BRIEF_TEMPLATE

**Document ID:** ZOS-SBT
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document defines the mandatory structure of a Sprint Brief. Per Constitution Rule 2 (Sprint Authority), implementation begins only after an approved Sprint Brief following this template. Per `17_RELEASE_PROCESS.md`, Sprint Planning must align with this template as the first Phase Gate.

This is a template, not a Sprint Brief itself. Each actual sprint produces its own instance of this structure, approved by the Architecture Team before implementation begins.

# Sprint Brief Structure

## Sprint Identification

- **Sprint ID:**
- **Milestone:** (per `08_ROADMAP.md`)
- **Phase:**
- **Date Approved:**
- **Approved By:** (Architecture Team)

## Objective

A concise statement of what this sprint is intended to accomplish.

## Approved Scope

An explicit, enumerated list of what implementation work is authorized. Per Constitution Rule 3 (Scope Control), implementation must remain within this list.

## Out of Scope

An explicit list of what is not authorized in this sprint, to prevent scope drift (Constitution Rule 3).

## Affected Components

List of applications, packages, or documents this sprint is expected to touch, per the approved architecture (`05_ARCHITECTURE.md`, `13_FOLDER_STRUCTURE.md`).

## Dependencies

Any new runtime or development dependencies anticipated, subject to `14_DEPENDENCY_POLICY.md`. If none are anticipated, state "None anticipated." Any dependency need discovered mid-sprint that was not listed here is an escalation trigger, not an automatic approval.

## Assigned Implementation Engineer

Identify the human or AI engineer(s) executing the sprint.

## Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: the sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, Project Brain has been updated, and the sprint has been formally closed.

## Required Deliverables

Per `07_ENGINEERING_WORKFLOW.md` — Deliverables: source code, updated documentation (if applicable), completion report, final assessment.

## Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, the assigned engineer must stop and escalate to the Architecture Team if: a new dependency is required, an architecture change is proposed, requirements are unclear or conflicting, or scope expansion is requested.

## Approval Status

- [ ] Proposed
- [ ] Under Review
- [ ] Approved
- [ ] Rejected / Returned for Revision

---

# Governance

- A Sprint Brief is not valid for implementation until its Approval Status is marked Approved by the Architecture Team.
- Sprint Briefs are historical records once approved; a scope change requires a superseding Sprint Brief revision, not a silent edit, consistent with how ADRs are governed as immutable-after-approval in `12_ADR_INDEX.md`.
- Implementation engineers (human or AI) must read the approved Sprint Brief in full before beginning work, per the Required Workflow in `10_AI_ENGINEER_GUIDE.md`.

# Related Documents

- `06_PROJECT_CONSTITUTION.md`
- `07_ENGINEERING_WORKFLOW.md`
- `10_AI_ENGINEER_GUIDE.md`
- `17_RELEASE_PROCESS.md`
- `08_ROADMAP.md`
