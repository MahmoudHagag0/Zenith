# S1-002 SPRINT BRIEF — User Management Foundation

**Document ID:** ZOS-S1-002
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-002
- **Sprint Name:** User Management Foundation
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`), first increment
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team (2026-07-12 — see Approval Section)

---

# Sprint Objective

User Management is not an authentication task performed for its own sake — it is the identity foundation that lets Zenith become a professional, personalized trading platform. Every future capability that makes Zenith valuable to a trader (personalized trading data, performance analysis, risk insights, and eventually AI-assisted guidance) depends on reliably knowing *whose* data and activity is being analyzed. This sprint establishes that foundation: a real, persisted `User` identity that the platform can trust, secured with Argon2id password hashing (ADR-002) and the already-approved JWT mechanism (ADR-001).

The chain this sprint enables: **user identity → personalized trading data → performance analysis → risk insights → future AI assistance.** None of those later capabilities can be built correctly without this sprint first establishing who a trader is and how their session is authenticated. This sprint does not introduce new architecture — it implements decisions already made by the Architecture Team.

---

# Scope

Per the Architecture Team's approved planning proposal, S1-002 is scoped to User Management only — not the full breadth of Milestone M1:

1. **`User` Prisma model** in `packages/database`: `id`, `email` (unique), `passwordHash`, `role`, `createdAt`, `updatedAt`. Role enum: `USER`, `ADMIN`. Foundation-level only — no additional fields beyond this approved set.
2. **Database migration** applying this schema to PostgreSQL.
3. **Registration endpoint** — open self-registration (per Architecture Team decision), creating a user with an Argon2id-hashed password (ADR-002).
4. **Login endpoint** — verifies credentials against the stored hash and issues a JWT via the existing `AuthService` — **access token only** (per Architecture Team decision; no refresh tokens this sprint).
5. **Wire `JwtStrategy.validate()`** to resolve a real persisted `User`, replacing today's payload echo, so protected routes reflect real identity.
6. **Tests:** registration success, duplicate-email rejection, login success/failure, real-user resolution on a protected route.

---

# Non-Scope

Explicitly excluded from S1-002, per the Architecture Team's approved planning proposal and Roadmap Planning Rules:

- Trading domain, business services, and advanced trading features (separate M1 areas — future sprints). These are deferred because they require a trusted user identity foundation first: personalized trading data, performance analysis, and risk insights only have value if they are reliably tied to the correct, authenticated trader. Building them before this sprint would mean building on an identity layer that doesn't yet exist.
- Full authorization/permissions refinement beyond the basic `role` field — no route-level RBAC logic beyond what already exists.
- OAuth providers, social login, MFA.
- Password reset and email verification flows.
- Refresh tokens or session management (explicitly deferred to a future sprint per Architecture Team decision).

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`.
- Any technology not listed in `04_TECH_STACK.md`, ADR-001, or ADR-002.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the six in-scope items listed above.
- Updated documentation where required.
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** a trader can create an account, authenticate securely, and thereby establish the identity foundation required for future personalized Zenith capabilities (trading data, performance analysis, risk insights, AI assistance). The technical criteria below are how that outcome is verified.
- `User` Prisma model exists with a migration applied against PostgreSQL, matching the approved schema exactly.
- Registration creates a user with an Argon2id-hashed password; the password is never stored, logged, or returned in plaintext.
- Duplicate-email registration is rejected with a clear error.
- Login verifies credentials and returns a JWT via the existing `AuthService`, only on a successful match.
- `JwtStrategy.validate()` resolves to a real persisted `User` record.
- No refresh-token or session-management logic is introduced.
- New code has test coverage: registration success, duplicate-email rejection, login success/failure, real-user resolution.
- Any new dependency (the Argon2id library) is reviewed under `14_DEPENDENCY_POLICY.md` before use.
- All S1-001 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated by the Architecture Team to reflect the sprint's closure, and the sprint has been formally closed.

---

# Dependencies

- An Argon2id-capable library — not yet selected; selection and `14_DEPENDENCY_POLICY.md` review occur at implementation time, not pre-approved here beyond the algorithm choice itself (ADR-002).
- A PostgreSQL instance for applying and verifying the new migration, per the same approach used in S1-001.
- Reuses S1-001's JWT foundation (ADR-001, `AuthService`, `JwtStrategy`, `JwtAuthGuard`) — no re-decision needed there.

---

# Risks

- **Credential-handling risk.** Mitigated by ADR-002's explicit algorithm choice and the Logging Standards in `15_CODING_STANDARDS.md` (never log secrets/credentials).
- **Scope-creep risk.** Registration/login naturally invites password reset, email verification, and social login; these are explicitly fenced off in Non-Scope and require their own future Sprint Brief.
- **Dependency-selection risk.** The exact Argon2id library is not yet chosen. If no suitable library is found within `04_TECH_STACK.md`'s existing ecosystem constraints, this is an escalation trigger, not an automatic scope change.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly recognized and consciously deferred, not silently skipped:

- **Extended user profile fields for future personalization.** The approved `User` schema is deliberately minimal (identity and access only). Fields needed for personalized trading data, performance analysis, or risk insights are not yet defined, because those requirements aren't clear yet. Adding them speculatively now would risk building the wrong schema; they will be defined in a future sprint once the relevant product requirements exist.
- **Compliance, KYC, and session-policy considerations.** A professional trading platform may eventually require identity verification, audit trails, or stricter session policies beyond what this sprint implements. These are acknowledged as real future considerations and are intentionally out of scope for this foundation sprint, not overlooked.

---

# Architecture Constraints

Per `05_ARCHITECTURE.md`, `04_TECH_STACK.md`, and `13_FOLDER_STRUCTURE.md`: unchanged from S1-001 — Architecture First, Modular Monorepo, no new frameworks or folder structure without ADR/Architecture Team approval.

Per ADR-001 and ADR-002: JWT remains the sole authentication mechanism; Argon2id is the sole password-hashing algorithm. Neither may be substituted without a superseding ADR.

Per `15_CODING_STANDARDS.md`: strict TypeScript mode; all external input validated; password hashes and tokens never logged; centralized exception handling.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Approved on the basis stated by the Architecture Team: scope is appropriately bounded, architecture is consistent with ZOS v1.0 and prior decisions (ADR-001, ADR-002), the Sprint Objective aligns with Zenith's product goal (user identity enabling personalized analysis, risk insights, and future AI capabilities), and deferred areas are intentionally sequenced, not ignored. This Sprint Brief is now valid for implementation per Constitution Rule 2.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-12
- **Completion Report:** `documentation/ai/S1-002_COMPLETION_REPORT.md` (AI-015)
- **Final Implementation Commits:** `6abeafc` (implementation), `5325c44` (hardening fixes found during post-implementation review)
- **Related ADR:** ADR-002
- **Related Decisions:** DEC-2026-003

This Sprint Status is distinct from the Approval Status in the Approval Section above, which records approval of this Brief for implementation and remains unchanged as the historical record of that event.

---

# Related Documents

- `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md` (prior sprint; JWT foundation this sprint builds on)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-001, ADR-002)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001, DEC-2026-002, DEC-2026-003)
- `documentation/ai/S1-002_COMPLETION_REPORT.md`
- `documentation/ai/AI_BOOTSTRAP.md`
