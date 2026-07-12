# 12_ADR_INDEX

**Document ID:** ZOS-012\
**Version:** 1.0.0\
**Status:** Living Document\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

The ADR Index is the master catalog of all Architecture Decision Records
(ADRs) approved for the Zenith project.

## ADR Lifecycle

-   Proposed
-   Under Review
-   Approved
-   Superseded
-   Deprecated

## ADR Register

  ADR ID    Title                                   Status     Date         Related Sprint
  --------- --------------------------------------- ---------- ------------ ----------------
  ADR-001   JWT-Based Authentication (S1-001 Foundation)   Approved   2026-07-11   S1-001
  ADR-002   Argon2id Password Hashing (S1-002 User Management)   Approved   2026-07-12   S1-002

## ADR-001 — JWT-Based Authentication (S1-001 Foundation)

-   **Status:** Approved
-   **Context:** `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md` Scope item 5 required a baseline authentication mechanism for `apps/api`, but no ADR previously established which mechanism was approved. `16_NAMING_CONVENTIONS.md` contained JWT-related naming examples suggesting, but not formally establishing, JWT.
-   **Decision:** S1-001's authentication foundation will use JWT-based authentication. Scope is limited to authentication foundation, authentication middleware/base services, and protected-route capability.
-   **Consequences:** `apps/api` implements JWT issuance/validation as its baseline authentication mechanism. No other authentication mechanism is authorized for S1-001.
-   **Alternatives Considered:** None recorded beyond the JWT naming precedent already present in `16_NAMING_CONVENTIONS.md`; no competing mechanism was proposed.
-   **Related Components:** `apps/api`.
-   **Related Decision Log Entry:** DEC-2026-001.

Explicitly out of scope under this ADR: OAuth providers, social login, advanced identity management, and any authentication complexity beyond this baseline. Introducing any of these requires a superseding ADR.

## ADR-002 — Argon2id Password Hashing (S1-002 User Management)

-   **Status:** Approved
-   **Context:** S1-002 introduces the first real `User` domain model and self-registration/login, requiring a password-hashing mechanism. No ZOS document previously specified one, and `04_TECH_STACK.md` does not list a hashing library.
-   **Decision:** User passwords are hashed with Argon2id. No other hashing algorithm (e.g. bcrypt, scrypt, plain SHA) is authorized for S1-002.
-   **Consequences:** `apps/api`'s registration/login flow depends on an Argon2id-capable library (subject to `14_DEPENDENCY_POLICY.md` review at implementation time). Password hashes are never logged or exposed via API responses.
-   **Alternatives Considered:** None recorded beyond the Architecture Team's direct selection of Argon2id; no competing algorithm was proposed for evaluation.
-   **Related Components:** `apps/api`, `packages/database` (`User.passwordHash`).
-   **Related Decision Log Entry:** DEC-2026-003.

## ADR Template

-   ADR ID
-   Title
-   Status
-   Context
-   Decision
-   Consequences
-   Alternatives Considered
-   Related Components
-   Related Decision Log Entry

## Governance

-   Every architectural decision requires an ADR.
-   ADRs are immutable after approval except through a superseding ADR.
-   The Architecture Team owns the ADR process.

## Related Documents

-   05_ARCHITECTURE.md
-   11_DECISION_LOG.md
-   09_PROJECT_BRAIN.md
