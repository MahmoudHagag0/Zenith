# S1-001 SPRINT BRIEF — Foundation Setup

**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-001
- **Sprint Name:** Foundation Setup
- **Milestone:** M0 — Foundation (per `08_ROADMAP.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team

---

# Sprint Objective

Establish the foundational implementation layer of the Zenith platform, consistent with the Milestone M0 — Foundation objectives defined in `08_ROADMAP.md`, using exactly the technology stack and architecture approved in `04_TECH_STACK.md` and `05_ARCHITECTURE.md`. This sprint does not introduce new architecture, technology, or product decisions — it implements what has already been approved.

---

# Scope

Per `08_ROADMAP.md`, Milestone M0 lists eight objectives: Monorepo setup, Backend foundation, Frontend foundation, Database foundation, Authentication foundation, API documentation, Engineering standards, and ZOS establishment. ZOS establishment is recorded as complete in `09_PROJECT_BRAIN.md` (Completed Milestones). The remaining seven are in scope for S1-001:

1. **Monorepo setup** — Verify and, where incomplete, establish the repository layout defined in `13_FOLDER_STRUCTURE.md` (Turborepo/pnpm workspace structure: `apps/`, `packages/`, `documentation/`, `scripts/`, `.github/`).
2. **Backend foundation** — `apps/api`, a NestJS application, per `04_TECH_STACK.md` and `05_ARCHITECTURE.md`.
3. **Frontend foundation** — `apps/web`, a Next.js application, per `04_TECH_STACK.md` and `05_ARCHITECTURE.md`.
4. **Database foundation** — `packages/database`, using Prisma as ORM against PostgreSQL, per `04_TECH_STACK.md`.
5. **Authentication foundation** — A baseline authentication mechanism for `apps/api`. **Note:** no ZOS document formally specifies the authentication mechanism via an approved ADR (`12_ADR_INDEX.md` has no approved ADRs). `16_NAMING_CONVENTIONS.md` includes JWT-related naming examples (`JwtGuard`, `JwtStrategy`, `JWT_SECRET`, `JWT_EXPIRATION`, and the route example `/api/v1/auth/login`), which suggests but does not formally establish JWT as the approved mechanism. This must be confirmed by the Architecture Team before implementation of authentication logic begins — it is flagged as an INFERENCE, not a FACT, per Constitution Rule 8.
6. **API documentation** — Swagger/OpenAPI integration for `apps/api`, per `04_TECH_STACK.md`.
7. **Engineering standards** — ESLint and Prettier configured and enforced via `packages/tooling`, per `04_TECH_STACK.md` and the Formatting section of `15_CODING_STANDARDS.md`.

---

# Non-Scope

The following are explicitly excluded from S1-001, per `08_ROADMAP.md` Milestone M1 — Core Platform (planned, not yet approved for implementation) and the Roadmap's Planning Rules ("Implementation engineers must not choose future work"):

- User management
- Trading domain logic
- Business services
- Authorization refinement (beyond the baseline authentication foundation listed above)
- Core APIs beyond what is required to demonstrate the foundation layer (e.g., the health endpoint in Acceptance Criteria)

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`
- Any technology not listed in `04_TECH_STACK.md`
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the seven in-scope items listed above.
- Updated documentation where required (e.g., if repository state differs from what `documentation/ai/BASELINE_SNAPSHOT.md` or `documentation/ai/PROJECT_STATE.md` currently describe).
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- Repository structure matches `13_FOLDER_STRUCTURE.md`: `apps/api`, `apps/web`, `packages/database`, `packages/validation`, `packages/types`, `packages/utils`, `packages/tooling`, `documentation/`, `scripts/`, `.github/`, and root `package.json` are all present.
- `apps/api` is a functioning NestJS application.
- `apps/web` is a functioning Next.js application.
- `packages/database` exposes a working Prisma client connected to PostgreSQL.
- `apps/api` exposes a health-check route at `/api/v1/health`, consistent with the route-naming example in `16_NAMING_CONVENTIONS.md`.
- `apps/api` has Swagger/OpenAPI documentation available.
- Structured logging via Pino is in place in `apps/api`, per `04_TECH_STACK.md` and the Logging Standards in `15_CODING_STANDARDS.md`.
- ESLint and Prettier are configured via `packages/tooling` and enforced across `apps/` and `packages/`.
- A baseline authentication mechanism exists in `apps/api`, with its specific design explicitly confirmed by the Architecture Team before or during this sprint (see Scope item 5).
- No dependency outside `04_TECH_STACK.md`'s approved stack was introduced without following `14_DEPENDENCY_POLICY.md`.
- All code satisfies the Code Review Checklist in `15_CODING_STANDARDS.md`.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated by the Architecture Team to reflect the sprint's closure, and the sprint has been formally closed.

---

# Dependencies

- No new runtime dependency is currently anticipated beyond what `04_TECH_STACK.md` already approves (NestJS, Next.js, Prisma, Zod, Swagger/OpenAPI, Pino, Jest, and the `@zenith/*` shared packages).
- Verification of the actual current repository state is a prerequisite, since no live repository access has been available during the Documentation Phase (`documentation/ai/BASELINE_SNAPSHOT.md` — Git Status: Not Available). Work in this sprint should begin with a repository audit per `documentation/ai/AI_BOOTSTRAP.md` Section 3, to confirm what, if any, of the Scope items already exists before implementing further.
- Confirmation of the authentication mechanism (Scope item 5) by the Architecture Team.

---

# Risks

- **Unverified starting state.** Because no independent verification of the live repository has occurred during the Documentation Phase, this sprint may discover that some Scope items are already partially or fully implemented, or that the repository diverges from `13_FOLDER_STRUCTURE.md`. Either case requires an updated repository audit before proceeding, not silent assumption.
- **Undefined authentication mechanism.** Scope item 5 depends on an Architecture Team confirmation that does not yet exist as an approved ADR. Proceeding with implementation before that confirmation risks producing unapproved architecture, which Constitution Rule 1 prohibits.
- **Dependency discovery mid-sprint.** If implementation reveals a need for a dependency not listed in `04_TECH_STACK.md`, `07_ENGINEERING_WORKFLOW.md`'s Escalation Rules and `14_DEPENDENCY_POLICY.md` require the Implementation Engineer to stop and escalate, which may pause the sprint.

---

# Architecture Constraints

Per `05_ARCHITECTURE.md`:

- Architecture First; Modular Monorepo; Clear Separation of Concerns; Shared Packages Before Duplication; Documentation-Driven Engineering; AI-Assisted, Architecture-Controlled Development.
- Applications may depend on shared packages; shared packages must not depend on applications; domain logic must not depend directly on presentation; infrastructure must remain replaceable where practical.

Per `04_TECH_STACK.md`:

- TypeScript everywhere; reuse shared packages before creating new utilities; no new frameworks without ADR approval; keep dependencies minimal; prefer official libraries.

Per `13_FOLDER_STRUCTURE.md`:

- No new top-level folders without Architecture Team approval; prefer extending existing packages over creating new ones; avoid circular dependencies between packages.

Per `15_CODING_STANDARDS.md`:

- Strict TypeScript mode; no implicit `any`; structured logging only, never logging secrets/tokens/credentials; all external input validated; centralized exception handling.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Per `SPRINT_BRIEF_TEMPLATE.md` Governance and Constitution Rule 2, this Sprint Brief is not valid for implementation until its Approval Status is marked **Approved** by the Architecture Team. Drafting this document does not constitute that approval.

---

# Related Documents

- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/ai/AI_BOOTSTRAP.md`
