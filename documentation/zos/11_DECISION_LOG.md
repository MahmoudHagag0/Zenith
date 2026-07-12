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

## DEC-2026-004

-   **Date:** 2026-07-12
-   **Title:** Role-Gated Mutation Authorization for the S1-003 Trading Catalog
-   **Status:** Approved
-   **Decision Summary:** Trading Catalog reference data (`Exchange`, `Market`, `Asset`) is readable by any authenticated user, but creation, update, and deletion of catalog records is restricted to users with the `ADMIN` role. `Watchlist`, `WatchlistItem`, and `FavouriteAsset` records are strictly user-owned: every read and write is scoped to the requesting user's own records, and a request for another user's record returns `404 Not Found` (not `403 Forbidden`) to avoid confirming the existence of another user's resource IDs.
-   **Business Rationale:** The trading catalog is shared reference data that every trader relies on; allowing any authenticated user to mutate it would let one trader corrupt the trading universe for everyone. Restricting catalog mutation to `ADMIN` protects data integrity without requiring any new authorization architecture, because the `Role` enum (`USER`, `ADMIN`) already exists on the `User` model as of S1-002. Watchlists and favourites are personal data; ownership scoping keeps one trader's data private from another, and the 404-on-mismatch pattern prevents ID-enumeration information leaks.
-   **Technical Impact:** `apps/api` gains a `@Roles()` decorator and a `RolesGuard`, applied alongside the existing `JwtAuthGuard`, to gate catalog-mutation routes. No new authentication mechanism, no new role, and no new database field is introduced — this decision only applies the already-approved `Role` enum to new routes. Watchlist/favourite services filter every query by the authenticated user's ID and return `404` on ownership mismatch.
-   **Related ADR:** None — this decision applies the `Role` enum already approved as part of the S1-002 `User` model; it introduces no new architectural mechanism and therefore does not require a superseding or new ADR, consistent with the precedent set by DEC-2026-002.
-   **Affected Components:** `apps/api` (new `RolesGuard`, `@Roles()` decorator, catalog and watchlist/favourite modules).
-   **Implemented In:** S1-003.

## DEC-2026-005

-   **Date:** 2026-07-12
-   **Title:** Decimal Precision and Row-Level Locking for S1-004 Portfolio/Position Accounting
-   **Status:** Approved
-   **Decision Summary:** All financial quantities in the `Position` and `Transaction` models (`quantity`, `price`, `averageCost`, `realizedPnl`) are stored using Prisma's `Decimal` type (Postgres `DECIMAL`), never `Float`. Every buy/sell operation that reads and recomputes a `Position`'s running totals executes inside a database transaction that takes an explicit row lock (`SELECT ... FOR UPDATE`) on the position row before recomputing, to prevent the lost-update race that would otherwise occur if two concurrent buy/sell requests for the same position both read stale totals before writing.
-   **Business Rationale:** Floating-point arithmetic is unsuitable for cost-basis and P/L accounting — silent rounding drift would corrupt a trader's realized P/L over time, undermining the platform's credibility as a source of truth for financial decisions. Likewise, average cost and quantity are non-idempotent running totals (unlike S1-003's unique-constraint-protected entities), so concurrent buy/sell requests for the same position require explicit serialization, not just a uniqueness check, to avoid a lost update.
-   **Technical Impact:** `packages/database`'s Prisma schema uses `Decimal` columns for all financial fields; `apps/api`'s position/transaction services use `Prisma.Decimal` arithmetic (never native JS numbers) for cost-basis and P/L calculations, and wrap every buy/sell in a Prisma interactive transaction with an explicit row lock. No new dependency is introduced — `Decimal` and interactive transactions are already part of the approved Prisma/PostgreSQL stack (`04_TECH_STACK.md`).
-   **Related ADR:** None — this decision applies existing, already-approved Prisma/PostgreSQL capabilities (`Decimal` columns, interactive transactions) to a new data-integrity requirement; it introduces no new technology, mechanism, or dependency, consistent with the DEC-2026-002/DEC-2026-004 precedent.
-   **Affected Components:** `packages/database` (`Position`, `Transaction` models), `apps/api` (positions/portfolios modules).
-   **Implemented In:** S1-004.

## DEC-2026-006

-   **Date:** 2026-07-12
-   **Title:** Market Data Provider Abstraction and Simulated Default Provider
-   **Status:** Approved
-   **Decision Summary:** Records the technical implementation of ADR-003: `apps/api` sources market data exclusively through a `MarketDataProvider` interface; the only implementation registered in S1-005 is a deterministic `SimulatedMarketDataProvider`, clearly documented as not real market data.
-   **Business Rationale:** See ADR-003 — this allows the market-data foundation (caching, rate limiting, retry, background sync, API surface) to be built and verified now, without waiting on a future vendor-approval decision, while keeping every future consumer of market data completely isolated from that eventual choice.
-   **Technical Impact:** `apps/api/src/market-data/providers/` contains the interface and the simulated implementation; the module registers the simulated provider under the `MarketDataProvider` interface token, so a future provider swap requires no change outside that one registration.
-   **Related ADR:** ADR-003.
-   **Affected Components:** `apps/api/src/market-data`.
-   **Implemented In:** S1-005.

## DEC-2026-007

-   **Date:** 2026-07-12
-   **Title:** `@nestjs/schedule` for Market Data Background Synchronization
-   **Status:** Approved
-   **Decision Summary:** Records the technical implementation of ADR-004: background market-data synchronization uses `@nestjs/schedule`'s `@Cron()` decorator, added as a new runtime dependency.
-   **Business Rationale:** See ADR-004 — an official, already-maintained NestJS module is preferred over a hand-rolled interval loop or a new infrastructure dependency (e.g. Redis-backed job queue) disproportionate to this sprint's needs.
-   **Technical Impact:** `apps/api` depends on `@nestjs/schedule`; `MarketDataSyncService` runs a periodic job that refreshes cached quotes only for assets currently tracked by at least one trader (watchlisted, favourited, or held in a position), not the entire catalog, reusing the same rate limiter and retry logic as on-demand reads.
-   **Related ADR:** ADR-004.
-   **Affected Components:** `apps/api` (`package.json`, `market-data` module).
-   **Implemented In:** S1-005.

## DEC-2026-008

-   **Date:** 2026-07-12
-   **Title:** Database-Backed Market Data Caching (No New Infrastructure)
-   **Status:** Approved
-   **Decision Summary:** S1-005's local caching layer is implemented entirely in PostgreSQL via two new Prisma models — `MarketQuote` (one row per asset, refreshed on a short TTL) and `Candle` (one row per asset per trading day, cached permanently once fetched, since historical daily data does not change). No new caching infrastructure (e.g. Redis, in-memory process cache) is introduced.
-   **Business Rationale:** The existing PostgreSQL/Prisma stack is already approved and already the system of record for every other domain; reusing it for market-data caching avoids introducing new infrastructure, new operational surface, and new failure modes for a foundation sprint, consistent with `04_TECH_STACK.md`'s "keep dependencies minimal" rule.
-   **Technical Impact:** `packages/database`'s Prisma schema gains `MarketQuote` and `Candle` models. `MarketDataService` treats a quote as fresh if its `fetchedAt` is within a short TTL window, and treats a requested candle date range as fully cached only once every day in that range has a row, refetching from the provider only for genuinely missing data.
-   **Related ADR:** None — this decision applies the already-approved PostgreSQL/Prisma stack to a new caching requirement; it introduces no new technology or infrastructure, consistent with the DEC-2026-002/DEC-2026-004/DEC-2026-005 precedent.
-   **Affected Components:** `packages/database` (`MarketQuote`, `Candle` models), `apps/api` (`market-data` module).
-   **Implemented In:** S1-005.

## DEC-2026-009

-   **Date:** 2026-07-12
-   **Title:** Trading Analytics Scoring and Staleness Thresholds
-   **Status:** Approved
-   **Decision Summary:** Records the implementation-time calibration anticipated by the S1-006 Sprint Brief's Missing Decisions section: a quote is treated as stale for analytics purposes once its `fetchedAt` age exceeds 5 minutes; the Concentration Score uses a Herfindahl-Hirschman-Index-style calculation (sum of squared position weight fractions, scaled to 0-100); the Portfolio Health Score starts at 100 and subtracts bounded penalties for four named rules (position concentration, allocation balance i.e. fewer than 3 positions, missing market data, and excessive single-market-type exposure above 75%); and missing historical candle data is reported as an informational Decision Readiness factor without independently downgrading readiness, since no candle-derived metric is exposed by this sprint.
-   **Business Rationale:** These are calibration choices within an already-approved rule-based scoring design (Sprint Brief Scope items 3-5), not new architecture — analogous to choosing a cache TTL value under DEC-2026-008. Recording them here provides traceability for why a given score/status was produced, satisfying this sprint's Explainability requirement (Scope item 9) at the level of the rules themselves, not just their output.
-   **Technical Impact:** `apps/api/src/analytics/analytics.service.ts` implements these exact thresholds and formulas. Adjusting any of them (e.g. a different staleness window, different penalty weights) is a future recalibration, not a scope or architecture change, and does not require a superseding ADR.
-   **Related ADR:** None — this decision calibrates an already-approved rule-based scoring approach; it introduces no new technology or mechanism, consistent with the DEC-2026-002/DEC-2026-004/DEC-2026-005/DEC-2026-008 precedent.
-   **Affected Components:** `apps/api/src/analytics`.
-   **Implemented In:** S1-006.

## DEC-2026-010

-   **Date:** 2026-07-12
-   **Title:** Fix — Market Quote Cache Never Refreshed `fetchedAt` on Update
-   **Status:** Approved
-   **Decision Summary:** `MarketDataService.getQuote()`'s cache-freshness check compares the current time against `MarketQuote.fetchedAt`, but the S1-005 implementation's `upsert` only set `fetchedAt` on the `create` branch (relying on the column's `@default(now())`, which Prisma applies solely on INSERT). The `update` branch never included `fetchedAt`, so after an asset's very first quote, `fetchedAt` never advanced again on any subsequent refresh — meaning the cache appeared permanently stale past the initial TTL window, causing every later `getQuote()` call to make a real provider call regardless of how recently the quote was actually refreshed. This defect was dormant throughout S1-005 (whose own verification only exercised the cache within a single TTL window) and was only surfaced by S1-006 exercising the same code path over a longer time horizon for Data Quality/Confidence reporting.
-   **Decision:** `getQuote()`'s upsert now explicitly sets `fetchedAt: new Date()` on both the `create` and `update` branches.
-   **Business Rationale:** Confidence and Data Quality reporting (S1-006 Scope items 2, 6) depend on `fetchedAt` being accurate; an always-stale cache would have made every analytics response report artificially degraded confidence, and would have defeated the S1-005 quote cache's entire purpose (redundant provider calls, and unnecessary load against the rate limiter, on every single quote request).
-   **Technical Impact:** `apps/api/src/market-data/market-data.service.ts`. No schema change; no behavior change to any other field. Verified live: a quote refreshed after its TTL expired now shows an advancing `fetchedAt` on each subsequent genuine refresh, and Data Quality/Confidence correctly report `FRESH`/`HIGH` immediately after a refresh instead of `STALE`/`MEDIUM`.
-   **Related ADR:** None — this is a bug fix within already-approved architecture (DEC-2026-008's caching design), not a new decision or mechanism.
-   **Affected Components:** `apps/api/src/market-data/market-data.service.ts`.
-   **Implemented In:** S1-006 (fixing a defect introduced in S1-005).

# Rules

-   Every architectural decision must have a Decision Log entry.
-   Superseded decisions remain in history.
-   Entries are append-only; never rewrite history.
-   Only the Architecture Team may approve or close a decision.

# Related Documents

-   05_ARCHITECTURE.md
-   12_ADR_INDEX.md
-   09_PROJECT_BRAIN.md
