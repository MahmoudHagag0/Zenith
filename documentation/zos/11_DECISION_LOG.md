# 11_DECISION_LOG

**Document ID:** ZOS-011\
**Version:** 1.0.0\
**Status:** Living Document\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

The Decision Log records every approved engineering and architectural
decision made throughout the lifecycle of the Zenith project. It
provides historical traceability and links each decision to the relevant
ADR and implementation.

# Decision Entry Template

## Decision ID

DEC-YYYY-XXX

## Date

YYYY-MM-DD

## Title

Short descriptive title.

## Status

-   Proposed
-   Approved
-   Superseded
-   Deprecated

## Decision Summary

Concise description of the approved decision.

## Business Rationale

Why this decision was necessary.

## Technical Impact

Expected effects on architecture, implementation, or operations.

## Related ADR

Reference the corresponding Architecture Decision Record.

## Affected Components

List impacted applications, packages, or modules.

## Implemented In

Sprint or milestone where the decision was applied.

# Decisions

## DEC-2026-001

-   **Date:** 2026-07-11
-   **Title:** JWT-Based Authentication for S1-001 Foundation
-   **Status:** Approved
-   **Decision Summary:** S1-001's authentication foundation uses JWT-based authentication, scoped to authentication foundation, authentication middleware/base services, and protected-route capability.
-   **Business Rationale:** A confirmed mechanism was required before authentication-related implementation could begin, per Constitution Rule 1; JWT was already implied by existing naming-convention examples.
-   **Technical Impact:** `apps/api` implements JWT issuance/validation as its baseline authentication mechanism. OAuth providers, social login, and advanced identity management are explicitly out of scope and require a superseding decision.
-   **Related ADR:** ADR-001.
-   **Affected Components:** `apps/api`.
-   **Implemented In:** S1-001.

## DEC-2026-002

-   **Date:** 2026-07-11
-   **Title:** Repository Structure Conformance — `apps/api` / `apps/web`
-   **Status:** Approved
-   **Decision Summary:** The repository's placeholder `backend/` and `frontend/` directories were renamed to `apps/api` and `apps/web`, and `package.json`'s `workspaces` field updated accordingly, to conform to the already-approved structure in `13_FOLDER_STRUCTURE.md` and `01_PROJECT_OVERVIEW.md`.
-   **Business Rationale:** The live repository had diverged from previously-approved architecture (flagged during the S1-001 implementation readiness review); this decision conforms the repository to existing approved architecture rather than changing it.
-   **Technical Impact:** No architectural change — `13_FOLDER_STRUCTURE.md` already specified `apps/api`/`apps/web`. This decision authorizes bringing the repository into line with that existing specification.
-   **Related ADR:** None — this is a conformance action, not a new architectural decision; no ADR was created.
-   **Affected Components:** `apps/api`, `apps/web`, `package.json`.
-   **Implemented In:** S1-001.

## DEC-2026-003

-   **Date:** 2026-07-12
-   **Title:** Argon2id Password Hashing for S1-002 User Management
-   **Status:** Approved
-   **Decision Summary:** S1-002's `User` model stores passwords hashed with Argon2id. No other hashing algorithm is authorized.
-   **Business Rationale:** A confirmed hashing mechanism was required before any credential-handling code could be written, per Constitution Rule 1/5; no prior ZOS document specified one.
-   **Technical Impact:** `apps/api` registration/login depends on an Argon2id-capable library, to be selected and reviewed under `14_DEPENDENCY_POLICY.md` at implementation time. Password hashes must never be logged or returned in API responses (per `15_CODING_STANDARDS.md` Logging Standards).
-   **Related ADR:** ADR-002.
-   **Affected Components:** `apps/api`, `packages/database`.
-   **Implemented In:** S1-002.

# Rules

-   Every architectural decision must have a Decision Log entry.
-   Superseded decisions remain in history.
-   Entries are append-only; never rewrite history.
-   Only the Architecture Team may approve or close a decision.

# Related Documents

-   05_ARCHITECTURE.md
-   12_ADR_INDEX.md
-   09_PROJECT_BRAIN.md
