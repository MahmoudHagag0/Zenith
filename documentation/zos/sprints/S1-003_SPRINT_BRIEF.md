# S1-003 SPRINT BRIEF — Trading Catalog & User Watchlist Foundation

**Document ID:** ZOS-S1-003
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-003
- **Sprint Name:** Trading Catalog & User Watchlist Foundation
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`), second increment (Trading domain)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team (2026-07-12 — see Approval Section)

---

# Sprint Objective

Zenith cannot become the professional AI platform traders rely on every day until it knows what tradable universe exists and what each trader follows within it. Every future AI capability — personalized insights, risk analysis, portfolio intelligence — depends on first answering two questions: "what assets exist to trade?" and "which of those does this trader care about?" This sprint answers both. It is not Position Management: it does not record what a trader owns or has traded. It establishes the trading universe (Exchanges, Markets, Assets) as shared reference data, and the mechanism by which a trader curates their personal view of that universe (Watchlists, Favourite Assets).

**Why this matters to traders:** a trader's first interaction with a serious trading platform is deciding what to follow — building a watchlist, marking favourites, browsing markets and exchanges. Without this foundation, there is no concept of "the trader's own trading world" for any later feature (positions, alerts, AI analysis) to attach itself to.

**What value it unlocks:** once assets, exchanges, and markets exist as real, queryable, authoritative data, and a trader can curate watchlists and favourites against them, every subsequent sprint (positions, market data, alerts, AI-driven insights) has a real, owned, personalized surface to operate on instead of an assumed one. This sprint is the prerequisite that makes "personalized for this trader" possible at all.

**Why remaining trading capabilities are intentionally deferred:** Positions, Portfolio, Orders, Trade Execution, Market Data/Candles/Indicators, Signals/Alerts, AI Analysis, Risk Engine, Portfolio Analytics, Journal, Notifications, and the Subscription System all describe what a trader *does* with, or how the platform *analyzes*, assets the trader owns or tracks. None of that is answerable until the platform first knows what assets exist (the catalog) and what a trader follows (watchlists/favourites). Building any of those capabilities before this sprint would mean building on an undefined trading universe. This sprint deliberately does not decide *how* a trader's holdings, orders, or risk are modeled — that is a distinct, larger decision appropriately deferred to its own future sprint.

The chain this sprint enables: **trading catalog (what exists) → trader-curated watchlist/favourites (what they follow) → future position/portfolio tracking (what they own) → performance & risk analysis → AI-assisted guidance.** This sprint does not introduce new architecture — it applies the already-approved JWT authentication (ADR-001), the already-approved `Role` enum (from S1-002's `User` model), and this sprint's own Decision Log entry (DEC-2026-004) governing catalog-mutation authorization.

---

# Scope

Per the Architecture Team's directive, S1-003 is scoped to the Trading Catalog and User Watchlist foundation only:

1. **Prisma models** in `packages/database`:
   - `Exchange` — `id`, `name`, `code` (unique), `createdAt`, `updatedAt`. Shared reference data.
   - `Market` — `id`, `exchangeId` (FK → `Exchange`), `name`, `type` (`MarketType` enum: `EQUITY`, `CRYPTO`, `FOREX`, `COMMODITY`), `createdAt`, `updatedAt`. Unique on `(exchangeId, name)`.
   - `Asset` — `id`, `marketId` (FK → `Market`), `symbol`, `name`, `createdAt`, `updatedAt`. Unique on `(marketId, symbol)`.
   - `Watchlist` — `id`, `userId` (FK → `User`), `name`, `createdAt`, `updatedAt`. Unique on `(userId, name)`. Strictly user-owned.
   - `WatchlistItem` — `id`, `watchlistId` (FK → `Watchlist`), `assetId` (FK → `Asset`), `addedAt`. Unique on `(watchlistId, assetId)`.
   - `FavouriteAsset` — `id`, `userId` (FK → `User`), `assetId` (FK → `Asset`), `createdAt`. Unique on `(userId, assetId)`. Strictly user-owned.
2. **Database migration** applying this schema to PostgreSQL.
3. **CRUD APIs** for all six entities:
   - Exchanges, Markets, Assets: read open to any authenticated user; create/update/delete restricted to `ADMIN` (per DEC-2026-004).
   - Watchlists, Watchlist Items, Favourite Assets: fully owned by the requesting user — every read and write scoped to `req.user.id`; no cross-user visibility.
4. **Validation** — Zod schemas in `packages/validation` for every create/update payload across the six entities, bridged into NestJS via the existing `ZodValidationPipe`.
5. **Authorization** — a new `@Roles()` decorator and `RolesGuard` (applied alongside the existing `JwtAuthGuard`) gating catalog-mutation routes to `ADMIN`; ownership-scoping logic for watchlist/favourite routes returning `404 Not Found` (not `403`) when a record exists but is not owned by the requester.
6. **Swagger** — full OpenAPI documentation for all new endpoints, consistent with the existing `apps/api` Swagger setup.
7. **Tests** — creation, duplicate-conflict, ownership-boundary (cross-user access denial), validation-rejection, and role-gating (non-admin mutation rejection) coverage for all six entities.

---

# Non-Scope

Explicitly excluded from S1-003, per the Architecture Team's directive:

- **Positions, Portfolio, Orders, Trade Execution** — recording what a trader owns or has traded is a distinct, larger decision that depends on this sprint's catalog existing first; deferred to a future sprint.
- **Market Data, Candles, Indicators** — live/historical pricing and technical analysis depend on assets already existing as catalog entries; out of scope here.
- **Signals, Alerts, AI Analysis, Risk Engine, Portfolio Analytics** — all depend on positions and/or market data, neither of which exist yet.
- **Journal, Notifications, Subscription System** — unrelated to establishing the trading universe; separate future capabilities.
- **A user-facing "promote to Admin" API** — S1-002's registration endpoint hardcodes `role: USER`; this sprint does not add a mechanism to create or promote `ADMIN` users, because doing so is a user-management concern, not a trading-catalog concern (see Missing Decisions).

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`.
- Any technology not listed in `04_TECH_STACK.md` or an existing ADR.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the seven in-scope items listed above.
- Updated documentation where required.
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** a trader can browse the trading catalog (exchanges, markets, assets) and curate a personal view of it (watchlists, favourites), establishing the foundation every future personalized/AI trading capability will build on. The technical criteria below are how that outcome is verified.
- All six Prisma models exist with a migration applied against PostgreSQL, matching the approved schema exactly.
- Any authenticated user can read catalog data (exchanges, markets, assets); only `ADMIN` users can create, update, or delete it. Non-admin mutation attempts are rejected with `403 Forbidden`.
- A trader can create, read, update, and delete their own watchlists, watchlist items, and favourite assets.
- A trader cannot read, modify, or delete another trader's watchlist, watchlist item, or favourite asset; such attempts return `404 Not Found`, not `403`, to avoid confirming the resource's existence.
- Duplicate creation (same exchange code, same market name within an exchange, same asset symbol within a market, same watchlist name for a user, same asset added twice to the same watchlist, same asset favourited twice by the same user) is rejected with a clear `409 Conflict`, including under concurrent requests.
- Malformed or invalid payloads are rejected with `400 Bad Request`, not `500`.
- All new endpoints are documented in Swagger.
- New code has test coverage: creation, duplicate-conflict, ownership-boundary, validation-rejection, and role-gating.
- All S1-001 and S1-002 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated to reflect the sprint's closure, and the sprint has been formally closed.

---

# Dependencies

- A PostgreSQL instance for applying and verifying the new migration, per the same approach used in S1-001 and S1-002.
- Reuses S1-001's JWT foundation (ADR-001, `AuthService`, `JwtStrategy`, `JwtAuthGuard`) and S1-002's `Role` enum on `User` — no re-decision needed for either.
- No new runtime or development dependency is anticipated; the RBAC guard is built with `@nestjs/common`'s existing `Reflector`/`SetMetadata`, already part of the installed NestJS core.

---

# Risks

- **Ownership-leak risk.** A trader accessing another trader's watchlist/favourite by ID must receive `404`, not `403` or a data leak. Mitigated by explicit ownership-scoped queries and adversarial cross-user testing during verification.
- **Race-condition risk.** Concurrent creation of catalog entries or watchlist items with the same unique key must not produce an uncaught `500`. Mitigated by reusing the `findUnique` pre-check + `P2002` catch pattern established in S1-002's `UsersService`.
- **Authorization-bypass risk.** A non-admin user must not be able to mutate catalog data by omitting or forging role claims. Mitigated by deriving role from the persisted, JWT-resolved `User` record (via `JwtStrategy.validate()`), never from client-supplied input.
- **Scope-creep risk.** Positions/portfolio naturally suggest themselves once assets exist; this is explicitly fenced off in Non-Scope and requires its own future Sprint Brief.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly recognized and consciously deferred, not silently skipped:

- **Admin user creation/promotion mechanism.** This sprint restricts catalog mutation to `ADMIN` users, but no API exists to create or promote an `ADMIN` account (S1-002's registration endpoint hardcodes `role: USER`). This is intentionally deferred: it is a user-management concern, not a trading-catalog concern, and belongs to a future sprint or an operational/administrative process. For this sprint's own verification purposes only, an `ADMIN` test user will be established directly against the database, not via a product feature.
- **Catalog data seeding/ingestion strategy.** This sprint provides the CRUD mechanism for the trading catalog but does not define how real-world exchange/market/asset data is sourced or kept up to date at scale. That is a future data-ingestion concern, out of scope here.

---

# Architecture Constraints

Per `05_ARCHITECTURE.md`, `04_TECH_STACK.md`, and `13_FOLDER_STRUCTURE.md`: unchanged from S1-001/S1-002 — Architecture First, Modular Monorepo, no new frameworks or folder structure without ADR/Architecture Team approval.

Per ADR-001: JWT remains the sole authentication mechanism. Per DEC-2026-004: catalog-mutation authorization is role-gated using the existing `Role` enum; no new role or authentication mechanism is introduced.

Per `15_CODING_STANDARDS.md`: strict TypeScript mode; all external input validated; centralized exception handling; no secrets logged.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Approved on the basis stated by the Architecture Team: scope is appropriately bounded to the trading catalog and watchlist/favourite foundation, architecture is consistent with ZOS v1.0 and prior decisions (ADR-001, S1-002's `Role` enum, DEC-2026-004), the Sprint Objective aligns with Zenith's product goal (establishing the trading universe and trader-curated view of it as the prerequisite for all future personalized/AI trading capabilities), and deferred areas (Positions/Portfolio and all capabilities depending on them) are intentionally sequenced, not ignored. This Sprint Brief is now valid for implementation per Constitution Rule 2.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-12
- **Completion Report:** `documentation/ai/S1-003_COMPLETION_REPORT.md` (AI-016)
- **Final Implementation Commits:** `bbc7cd3` (implementation)
- **Related ADR:** None (see DEC-2026-004)
- **Related Decisions:** DEC-2026-004

This Sprint Status is distinct from the Approval Status in the Approval Section above, which records approval of this Brief for implementation and remains unchanged as the historical record of that event.

---

# Related Documents

- `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md` (prior sprint; identity and `Role` foundation this sprint builds on)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-001, ADR-002)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001, DEC-2026-002, DEC-2026-003, DEC-2026-004)
- `documentation/ai/AI_BOOTSTRAP.md`
