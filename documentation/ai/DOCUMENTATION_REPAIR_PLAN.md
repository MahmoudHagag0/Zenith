# DOCUMENTATION_REPAIR_PLAN

**Document ID:** AI-005
**Version:** 1.0.0
**Status:** Proposal — awaiting Architecture Team approval
**Owner:** Architecture Team (via Implementation Engineer)
**Source:** `documentation/ai/DOCUMENTATION_AUDIT.md`

---

# Purpose

This document proposes remediation for every finding recorded in `DOCUMENTATION_AUDIT.md`. It is a plan only. No document has been created, deleted, or modified as part of producing this plan, and none will be until each item below is explicitly approved, per Constitution Rule 1 (Architecture Authority) and Rule 5 (Documentation First).

---

# FR-001 — Missing Document: `19_ONBOARDING_GUIDE.md`

- **Severity:** Low
- **Affected File(s):** `00_README.md`, `00_INDEX.md` (referencing documents); missing target `documentation/zos/19_ONBOARDING_GUIDE.md`
- **Root Cause:** Document is listed in the ZOS structure (`00_README.md` item 19) and index (`00_INDEX.md`) but was never authored or was not included in the material transferred to this session.
- **Proposed Fix:** Architecture Team to author `19_ONBOARDING_GUIDE.md`, or formally remove it from the ZOS structure/index if onboarding content is intentionally out of scope for now.
- **Impact Assessment:** No current blocking effect — no other document depends on its content for engineering rules or gating. Its absence affects new-contributor onboarding quality only.
- **Dependencies:** None.
- **Risk Level:** Low (isolated addition or index edit; no downstream logic depends on it).
- **Approval Required:** Yes.

---

# FR-002 — Missing Document: `20_AI_BOOT_SEQUENCE.md`

- **Severity:** High
- **Affected File(s):** `00_README.md`, `00_INDEX.md`, `06_PROJECT_CONSTITUTION.md`, `07_ENGINEERING_WORKFLOW.md`, `09_PROJECT_BRAIN.md`, `10_AI_ENGINEER_GUIDE.md`, `16_NAMING_CONVENTIONS.md`; missing target `documentation/zos/20_AI_BOOT_SEQUENCE.md`
- **Root Cause:** Five ZOS documents treat this file as the canonical AI boot procedure, but it does not exist in the repository.
- **Proposed Fix:** Architecture Team to either (a) author `20_AI_BOOT_SEQUENCE.md` as the canonical ZOS-level boot document, and then reconcile `documentation/ai/AI_BOOTSTRAP.md` against it, or (b) formally designate `documentation/ai/AI_BOOTSTRAP.md` as satisfying this role and update the five referencing documents accordingly.
- **Impact Assessment:** Currently mitigated in practice — `documentation/ai/AI_BOOTSTRAP.md` was built to cover the same operational need using `00_README.md` and `10_AI_ENGINEER_GUIDE.md` as source material, and explicitly flags this gap. However, until the Architecture Team resolves which document is canonical, ZOS itself remains internally inconsistent.
- **Dependencies:** Any fix here should be coordinated with FR-013 (template inconsistency) if the new document is authored, so it follows the correct ZOS template from creation.
- **Risk Level:** Medium — authoring a new binding process document carries content risk if not carefully aligned with existing Constitution/Workflow rules.
- **Approval Required:** Yes.

---

# FR-003 — Missing Document: `ZENITH_AI_SYSTEM_PROMPT.md`

- **Severity:** Medium
- **Affected File(s):** `00_INDEX.md`; missing target file
- **Root Cause:** Listed in the index registry as an "official" document ("Core behavioral and operational constraints") but not present.
- **Proposed Fix:** Architecture Team to clarify whether this document is meant to define AI system-level behavior distinct from `10_AI_ENGINEER_GUIDE.md`, then either author it or remove the index entry.
- **Impact Assessment:** Ambiguous — its stated purpose ("core behavioral and operational constraints") overlaps with existing content in `10_AI_ENGINEER_GUIDE.md` and `06_PROJECT_CONSTITUTION.md`. Until clarified, it's unclear whether this is a real gap or a redundant planned document.
- **Dependencies:** Should be resolved before/alongside FR-004, since both may describe overlapping "core AI context" material.
- **Risk Level:** Medium — risk of creating duplicate or conflicting authority with existing Constitution/Guide documents if not scoped carefully.
- **Approval Required:** Yes.

---

# FR-004 — Missing Document: `ZENITH_MASTER_CONTEXT.md`

- **Severity:** Medium
- **Affected File(s):** `00_INDEX.md`; missing target file
- **Root Cause:** Listed in the index registry ("Global project background and architectural vision") but not present.
- **Proposed Fix:** Architecture Team to clarify whether this is meant to be a higher-level synthesis of `01_PROJECT_OVERVIEW.md` + `02_PRODUCT_VISION.md` + `05_ARCHITECTURE.md`, then either author it or remove the index entry.
- **Impact Assessment:** Its stated purpose substantially overlaps existing documents 01, 02, and 05. Risk of duplication if authored without clear differentiation.
- **Dependencies:** Related to FR-003; both should be scoped together to avoid overlapping authority.
- **Risk Level:** Medium.
- **Approval Required:** Yes.

---

# FR-005 — Missing Document: `SPRINT_BRIEF_TEMPLATE.md`

- **Severity:** Critical
- **Affected File(s):** `00_INDEX.md`, `17_RELEASE_PROCESS.md` (Phase Gates step 1); missing target file
- **Root Cause:** Constitution Rule 2 (Sprint Authority) states implementation begins only after an approved Sprint Brief, and `17_RELEASE_PROCESS.md` names this template as the required alignment artifact for Sprint Planning — but no template exists.
- **Proposed Fix:** Architecture Team to author `SPRINT_BRIEF_TEMPLATE.md` defining the required structure of a Sprint Brief.
- **Impact Assessment:** This is the most operationally significant gap in the audit. Without this template, there is no defined, repeatable format for the artifact that Constitution Rule 2 requires before any implementation work can begin — meaning that even Sprint 1 cannot start following an internally consistent process. This directly blocks the "Sprint Loading" step defined in `documentation/ai/AI_BOOTSTRAP.md`.
- **Dependencies:** Blocks all future implementation sprints until resolved. No other finding depends on this one.
- **Risk Level:** Medium (content-authoring risk only; does not touch code or existing binding documents).
- **Approval Required:** Yes.

---

# FR-006 — Missing Document: `NOVA_STARTUP_PACKAGE.md`

- **Severity:** Low
- **Affected File(s):** `00_INDEX.md`, `18_PROJECT_GLOSSARY.md` (defines "Nova-Class AI"); missing target file
- **Root Cause:** Listed in the index as a "pre-configured environment for Nova-class entities," referencing a term defined in the glossary, but the file itself is absent.
- **Proposed Fix:** Architecture Team to clarify whether Nova-class AI onboarding is currently in scope; author the file or remove the index entry accordingly.
- **Impact Assessment:** No impact on current engineering work. Only relevant if/when a Nova-class agent is onboarded.
- **Dependencies:** None.
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# FR-007 — Broken Cross-Reference: `01_PROJECT_OVERVIEW.md` → `04_ARCHITECTURE.md`

- **Severity:** Medium
- **Affected File(s):** `01_PROJECT_OVERVIEW.md`
- **Root Cause:** The Related Documents section cites `04_ARCHITECTURE.md`, a filename that does not exist. The actual architecture document is `05_ARCHITECTURE.md`; ID `04` is already assigned to `04_TECH_STACK.md`.
- **Proposed Fix:** Correct the reference in `01_PROJECT_OVERVIEW.md`'s Related Documents section from `04_ARCHITECTURE.md` to `05_ARCHITECTURE.md`.
- **Impact Assessment:** Low functional impact (a reader or AI following this link would fail to resolve it and would need to search for the correct file), but it is a direct, unambiguous error with a single, low-risk correction.
- **Dependencies:** None.
- **Risk Level:** Low — single-line text correction in one document, no structural or semantic change.
- **Approval Required:** Yes (per Rule 6, ZOS documents may not be modified by the Implementation Engineer without Architecture Team approval, regardless of how minor the change).

---

# FR-008 — Disclosed Overlap: `PROJECT_STATE.md` / `09_PROJECT_BRAIN.md`

- **Severity:** Low
- **Affected File(s):** `documentation/ai/PROJECT_STATE.md`, `documentation/zos/09_PROJECT_BRAIN.md`
- **Root Cause:** Both documents describe "current project state." This is by design — `PROJECT_STATE.md` was built as a non-authoritative operational-layer summary that explicitly defers to `09_PROJECT_BRAIN.md`.
- **Proposed Fix:** No structural fix proposed. Optional: add a one-line disclaimer at the very top of `09_PROJECT_BRAIN.md` pointing to `documentation/ai/PROJECT_STATE.md` as a non-authoritative summary, for discoverability in the other direction.
- **Impact Assessment:** None — this is not a defect, only a noted overlap already disclosed within `PROJECT_STATE.md`.
- **Dependencies:** None.
- **Risk Level:** Low.
- **Approval Required:** No (informational only; the optional addition would require approval if pursued, since it touches a ZOS document).

---

# FR-009 — Conflicting Information: Shared Package Lists

- **Severity:** High
- **Affected File(s):** `04_TECH_STACK.md`, `16_NAMING_CONVENTIONS.md`
- **Root Cause:** `16_NAMING_CONVENTIONS.md` lists `@zenith/config` and `@zenith/logger` as package-naming examples, but neither appears in `04_TECH_STACK.md`'s Shared Packages list (the document that defines the approved package set) or `01_PROJECT_OVERVIEW.md`'s Repository Overview.
- **Proposed Fix:** Architecture Team to determine ground truth: either (a) `@zenith/config` and `@zenith/logger` are approved packages that were omitted from `04_TECH_STACK.md` and `01_PROJECT_OVERVIEW.md`, requiring both to be updated, or (b) they were illustrative-only examples in `16_NAMING_CONVENTIONS.md` and should be replaced with names matching the actual approved package list.
- **Impact Assessment:** Meaningful risk if unresolved — an AI implementation agent following `16_NAMING_CONVENTIONS.md` in isolation could infer that `@zenith/config` and `@zenith/logger` are existing or approved packages and attempt to create or depend on them without authorization, violating Dependency Policy (`14_DEPENDENCY_POLICY.md`).
- **Dependencies:** None, but should be resolved before any sprint touching logging or configuration packages.
- **Risk Level:** Medium — resolution requires a substantive decision (which list is authoritative) rather than a mechanical text fix.
- **Approval Required:** Yes.

---

# FR-010 — Missing `Document ID` Field: `17_RELEASE_PROCESS.md`

- **Severity:** Low
- **Affected File(s):** `17_RELEASE_PROCESS.md`
- **Root Cause:** Document occupies position 17 in the ZOS structure and index but its header block omits the `Document ID` field present in documents `01`–`16` (expected value would be `ZOS-017`).
- **Proposed Fix:** Add `**Document ID:** ZOS-017` to the header block, consistent with the Template A pattern.
- **Impact Assessment:** Cosmetic/metadata-only; does not affect document content or engineering rules.
- **Dependencies:** Should be applied together with FR-013 (template standardization) rather than in isolation, to avoid repeated edits to the same file.
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# FR-011 — Missing `Document ID` Field: `18_PROJECT_GLOSSARY.md`

- **Severity:** Low
- **Affected File(s):** `18_PROJECT_GLOSSARY.md`
- **Root Cause:** Same pattern as FR-010; expected value would be `ZOS-018`.
- **Proposed Fix:** Add `**Document ID:** ZOS-018` to the header block.
- **Impact Assessment:** Cosmetic/metadata-only.
- **Dependencies:** Should be applied together with FR-013.
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# FR-012 — Illustrative/Invalid Reference Examples in `16_NAMING_CONVENTIONS.md`

- **Severity:** Low
- **Affected File(s):** `16_NAMING_CONVENTIONS.md`
- **Root Cause:** The "Documentation" naming-convention section lists example filenames (`PROJECT_STATUS.md`, `PROJECT_HISTORY.md`, `CHANGELOG.md`, `ROADMAP.md`) that don't exist in the repository, and mixes in a `ROADMAP.md` example that conflicts with the real file's actual ZOS-convention name (`08_ROADMAP.md`).
- **Proposed Fix:** Architecture Team to confirm these are intentionally illustrative (general-purpose naming pattern examples, not links to real files) and, if so, either leave as-is with a clarifying note, or replace `ROADMAP.md` with a non-colliding example name to avoid implying it refers to `08_ROADMAP.md`.
- **Impact Assessment:** Low — low likelihood of genuine confusion since the section is clearly a naming-pattern illustration, not a Related Documents list.
- **Dependencies:** None.
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# FR-013 — Missing Required Sections / Template Inconsistency

- **Severity:** Medium
- **Affected File(s):** `00_README.md`, `00_INDEX.md`, `17_RELEASE_PROCESS.md`, `18_PROJECT_GLOSSARY.md`, `14_DEPENDENCY_POLICY.md`
- **Root Cause:** Two incompatible document templates are in use. Template A (`01`–`16`) uses `Document ID` + `# Purpose` + `# Related Documents` section. Template B (`00_INDEX.md`, `17`, `18`) uses no `Document ID`, `## Executive Summary`/`## Overview` instead of `# Purpose`, and a `*Documentation Path: ...*` footer instead of a `# Related Documents` section. `14_DEPENDENCY_POLICY.md` follows Template A but with a compressed header missing an explicit `Owner:` line.
- **Proposed Fix:** Architecture Team to designate one canonical template and bring all deviating documents into conformance (add missing `Document ID` fields, normalize `Purpose`/`Executive Summary`/`Overview` naming, normalize `Related Documents` presentation, restore `Owner:` field in `14_DEPENDENCY_POLICY.md`).
- **Impact Assessment:** Moderate — affects consistency and any future tooling that parses document metadata (e.g., an automated ZOS index generator would need to handle two formats). No effect on the substantive rules the documents contain.
- **Dependencies:** Encompasses FR-010 and FR-011; should be executed as a single coordinated pass across all five files rather than piecemeal, to avoid repeated touches to the same documents.
- **Risk Level:** Medium — touches five documents in one coordinated change; low content risk per edit, but broader surface area increases review overhead.
- **Approval Required:** Yes.

---

# FR-014 — Status Field Vocabulary Inconsistency

- **Severity:** Medium
- **Affected File(s):** `00_README.md`, `01`–`08`, `10`, `13`–`16` (status `Approved`) vs. `00_INDEX.md`, `17_RELEASE_PROCESS.md`, `18_PROJECT_GLOSSARY.md` (status `OFFICIAL`)
- **Root Cause:** No document defines `Approved` and `OFFICIAL` as distinct statuses or as synonyms, yet both appear to denote the same finalized/binding lifecycle stage.
- **Proposed Fix:** Architecture Team to either (a) formally define both terms as distinct stages with different meaning, or (b) standardize on a single term and update the minority-usage documents (`00_INDEX.md`, `17`, `18`) to match the majority (`Approved`).
- **Impact Assessment:** Low functional impact today (no engineering rule currently branches on this field's exact wording), but ambiguity could compound if any future tooling or workflow step reads `Status` programmatically.
- **Dependencies:** Can be resolved as part of FR-013 (same three files are involved in the template inconsistency).
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# FR-015 — Owner Field Variance: `17_RELEASE_PROCESS.md`

- **Severity:** Low
- **Affected File(s):** `17_RELEASE_PROCESS.md`
- **Root Cause:** This document lists `Owner: DevOps / Architecture Team`; every other ZOS document lists `Owner: Architecture Team` only. No document establishes whether ZOS documents may have co-owners.
- **Proposed Fix:** Architecture Team to confirm whether DevOps is a legitimate co-owner for release-process content specifically, and either keep it as an intentional, documented exception or normalize it to `Architecture Team`.
- **Impact Assessment:** Low — governance/attribution clarity only, no effect on document content or rules.
- **Dependencies:** None.
- **Risk Level:** Low.
- **Approval Required:** Yes.

---

# Summary Table

| ID | Finding | Severity | Risk Level | Approval Required |
|:---|:---|:---|:---|:---|
| FR-001 | Missing `19_ONBOARDING_GUIDE.md` | Low | Low | Yes |
| FR-002 | Missing `20_AI_BOOT_SEQUENCE.md` | High | Medium | Yes |
| FR-003 | Missing `ZENITH_AI_SYSTEM_PROMPT.md` | Medium | Medium | Yes |
| FR-004 | Missing `ZENITH_MASTER_CONTEXT.md` | Medium | Medium | Yes |
| FR-005 | Missing `SPRINT_BRIEF_TEMPLATE.md` | Critical | Medium | Yes |
| FR-006 | Missing `NOVA_STARTUP_PACKAGE.md` | Low | Low | Yes |
| FR-007 | Broken reference `04_ARCHITECTURE.md` | Medium | Low | Yes |
| FR-008 | Disclosed overlap PROJECT_STATE / PROJECT_BRAIN | Low | Low | No |
| FR-009 | Conflicting shared-package lists | High | Medium | Yes |
| FR-010 | Missing Document ID — `17` | Low | Low | Yes |
| FR-011 | Missing Document ID — `18` | Low | Low | Yes |
| FR-012 | Illustrative reference examples in `16` | Low | Low | Yes |
| FR-013 | Template inconsistency (5 files) | Medium | Medium | Yes |
| FR-014 | Status vocabulary inconsistency | Medium | Low | Yes |
| FR-015 | Owner field variance — `17` | Low | Low | Yes |

**Recommended sequencing if approved:** FR-005 first (blocks all future sprint work), then FR-009 (risk of incorrect dependency creation), then FR-002 (governs AI boot process), then the remaining findings in any order — FR-013/FR-010/FR-011/FR-014 are natural to batch together since they touch overlapping files.

---

# General Notes

- No fixes have been applied. No files have been created or deleted.
- Every proposed fix that touches a `documentation/zos/` file requires explicit Architecture Team approval before execution, per Constitution Rule 1 and Rule 6, and per `00_README.md`'s ZOS update policy.
- This plan does not authorize any action. It is a proposal awaiting review.

---

# Related Documents

- `documentation/ai/DOCUMENTATION_AUDIT.md`
- `documentation/ai/ZENITH_TRANSFER_CONTEXT.md`
- `documentation/zos/06_PROJECT_CONSTITUTION.md`
