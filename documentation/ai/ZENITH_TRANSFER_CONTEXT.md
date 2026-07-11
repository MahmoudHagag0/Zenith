# ZENITH_TRANSFER_CONTEXT

**Document ID:** AI-011
**Version:** 1.0.0 (Rebuilt as official AI transfer document)
**Status:** Operational Layer — Official AI Entry Point
**Owner:** Architecture Team (via Implementation Engineer)
**Source of Truth:** `documentation/zos/`

---

# Purpose

This is the **first document** any AI agent (Claude, ChatGPT, Gemini, Nova, or any future agent) should open when starting work on Zenith. It does not contain project knowledge itself — it points to where that knowledge lives and defines the order in which to acquire it.

If you are an AI reading this for the first time: **do not implement anything yet.** Follow the reading order below first.

---

# Executive Project Summary

Zenith is an AI-assisted, enterprise-grade platform built with an architecture-first approach, prioritizing long-term maintainability, modularity, and predictable engineering execution over rapid feature delivery (`01_PROJECT_OVERVIEW.md`).

The approved technical foundation is a Turborepo/pnpm monorepo, TypeScript throughout, a NestJS backend (`apps/api`), a Next.js frontend (`apps/web`), PostgreSQL via Prisma, Zod for shared validation, and a set of `@zenith/*` shared packages (`04_TECH_STACK.md`, `05_ARCHITECTURE.md`).

Governance is architecture-first and approval-gated: only the Architecture Team may change architecture or approve sprint scope; implementation agents (human or AI) execute only approved work (`06_PROJECT_CONSTITUTION.md`).

# Current Phase

Not authoritatively recorded. See `documentation/ai/PROJECT_STATE.md` for what is and is not currently known, and `documentation/zos/09_PROJECT_BRAIN.md` for the authoritative (currently unfilled) live-state record.

# Current Sprint

Not authoritatively recorded. No approved Sprint Brief was available at the time this document was generated. See `documentation/ai/PROJECT_STATE.md`.

# Repository Status

The approved repository structure, application list, and package list are defined in `documentation/zos/13_FOLDER_STRUCTURE.md`, `01_PROJECT_OVERVIEW.md`, and `04_TECH_STACK.md`. A summarized, non-duplicated snapshot is maintained in `documentation/ai/PROJECT_STATE.md`. That snapshot should be treated as a pointer, not a replacement — always defer to the ZOS documents themselves for anything binding.

---

# AI Reading Order

1. **This document** (`ZENITH_TRANSFER_CONTEXT.md`) — orientation.
2. [`documentation/ai/AI_BOOTSTRAP.md`](./AI_BOOTSTRAP.md) — the mandatory boot sequence.
3. [`documentation/ai/PROJECT_STATE.md`](./PROJECT_STATE.md) — current project snapshot.
4. [`documentation/ai/AI_WORKFLOW.md`](./AI_WORKFLOW.md) — how AI agents operate, approve, commit, and escalate.
5. `documentation/zos/00_README.md` — ZOS purpose and source-of-truth hierarchy.
6. `documentation/zos/06_PROJECT_CONSTITUTION.md` — binding rules for every contributor.
7. `documentation/zos/09_PROJECT_BRAIN.md` — live project state (authoritative).
8. `documentation/zos/10_AI_ENGINEER_GUIDE.md` — the AI's role, responsibilities, and prohibited actions.
9. The remaining ZOS documents (`01`–`18`), as relevant to the specific task.
10. The approved Sprint Brief for the requested work.

---

# Official ZOS Documentation

All project knowledge is authoritative only in `documentation/zos/`. This transfer document does not duplicate any of it. Index:

| ID | Document | Covers |
|:---|:---|:---|
| 00 | `00_README.md` | ZOS purpose, structure, source-of-truth order |
| 00 | `00_INDEX.md` | Master document registry |
| 01 | `01_PROJECT_OVERVIEW.md` | Executive summary, objectives, repo overview |
| 02 | `02_PRODUCT_VISION.md` | Vision, mission, product philosophy |
| 03 | `03_BUSINESS_GOALS.md` | Strategic business objectives |
| 04 | `04_TECH_STACK.md` | Approved technologies |
| 05 | `05_ARCHITECTURE.md` | System architecture and boundaries |
| 06 | `06_PROJECT_CONSTITUTION.md` | Binding engineering rules |
| 07 | `07_ENGINEERING_WORKFLOW.md` | Engineering lifecycle |
| 08 | `08_ROADMAP.md` | Milestones and phases |
| 09 | `09_PROJECT_BRAIN.md` | Live operational memory (current state) |
| 10 | `10_AI_ENGINEER_GUIDE.md` | AI agent role and required workflow |
| 11 | `11_DECISION_LOG.md` | Historical decision record |
| 12 | `12_ADR_INDEX.md` | Architecture Decision Records |
| 13 | `13_FOLDER_STRUCTURE.md` | Approved repository layout |
| 14 | `14_DEPENDENCY_POLICY.md` | Dependency approval rules |
| 15 | `15_CODING_STANDARDS.md` | Coding standards |
| 16 | `16_NAMING_CONVENTIONS.md` | Naming, branching, commit conventions |
| 17 | `17_RELEASE_PROCESS.md` | Release lifecycle and versioning |
| 18 | `18_PROJECT_GLOSSARY.md` | Standardized terminology |
| 19 | `19_ONBOARDING_GUIDE.md` | **Referenced but not currently available** |
| 20 | `20_AI_BOOT_SEQUENCE.md` | **Referenced but not currently available** — canonical boot doc; see note below |

Also referenced by `00_INDEX.md` but not currently available: `ZENITH_AI_SYSTEM_PROMPT.md`, `ZENITH_MASTER_CONTEXT.md`, `SPRINT_BRIEF_TEMPLATE.md`, `NOVA_STARTUP_PACKAGE.md`.

---

# Note on the AI Operational Layer

`documentation/ai/` is an **operational layer**, not a source of truth. It exists to make onboarding faster for AI agents by pointing to and summarizing ZOS — it never overrides, duplicates, or supersedes it. Where anything in `documentation/ai/` appears to conflict with `documentation/zos/`, ZOS governs, and the conflict should be flagged to the Architecture Team rather than resolved unilaterally (`06_PROJECT_CONSTITUTION.md`, Rule 6).

---

# Related Documents

- `documentation/ai/AI_BOOTSTRAP.md`
- `documentation/ai/PROJECT_STATE.md`
- `documentation/ai/AI_WORKFLOW.md`
- `documentation/zos/00_README.md`
- `documentation/zos/00_INDEX.md`
