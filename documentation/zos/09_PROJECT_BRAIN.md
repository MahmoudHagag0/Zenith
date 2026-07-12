# 09_PROJECT_BRAIN

**Document ID:** ZOS-009\
**Version:** 1.0.0\
**Status:** Living Document\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

Project Brain is the live operational memory of Zenith. Unlike the other
ZOS documents, this file is updated after approved sprint closures and
always reflects the current project state.

# Current Status

## Project

-   Name: Zenith
-   Version: 0.1.0
-   Current Milestone: M1 — Core Platform — In Progress (S1-002 User Management, S1-003 Trading Catalog & User Watchlist Foundation, S1-004 Position & Portfolio Management Foundation, S1-005 Market Data Foundation, S1-006 Trading Analytics Foundation, and S1-007 Analysis Engine Foundation, complete; the remaining Business Services scope, full authorization refinement, and Core APIs not yet started)
-   Current Phase: Phase 1 — Engineering Foundation
-   Current Sprint: None active — S1-007 is closed; no subsequent Sprint Brief has been proposed or approved

## Completed Sprints

-   S1-001 — Foundation Setup. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-001_COMPLETION_REPORT.md`. Final implementation commit: `f29785a`.
-   S1-002 — User Management Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-002_COMPLETION_REPORT.md`. Final implementation commits: `6abeafc`, `5325c44`.
-   S1-003 — Trading Catalog & User Watchlist Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-003_COMPLETION_REPORT.md`. Final implementation commits: `bbc7cd3`, `58e75f4`.
-   S1-004 — Position & Portfolio Management Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-004_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-004_COMPLETION_REPORT.md`. Final implementation commits: `94c8987`, `26611d9`.
-   S1-005 — Market Data Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-005_COMPLETION_REPORT.md`. Final implementation commits: `db4a352`, `be2680f`.
-   S1-006 — Trading Analytics Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-006_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-006_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-007 — Analysis Engine Foundation: Indicator Engine, Swing Detection Infrastructure & Regime/Context Service. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-007_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.

## Active Modules

-   API (`apps/api`) — NestJS foundation: health check, Swagger, Pino logging, JWT authentication with real user registration/login (Argon2id); trading catalog (exchanges, markets, assets) with `ADMIN`-gated mutation and open read; user watchlists, watchlist items, and favourite assets with strict per-user ownership scoping; user-owned portfolios and positions with transaction-derived quantity/average-cost/realized-P&L accounting, concurrency-safe via row-locked database transactions; market data (symbol search, asset lookup, quotes, daily candles) sourced through a provider-agnostic interface, currently backed only by a simulated provider (ADR-003 — not real market data), cached in PostgreSQL, rate-limited, retried with backoff, and kept fresh for tracked assets via a `@nestjs/schedule` background job; a read-only Trading Analytics layer (portfolio/position P&L, risk exposure, a rule-based Portfolio Health Score, Decision Readiness, Data Quality/Confidence) composing the Portfolio/Position/Market Data services, computed live on every request with zero persisted history; an internal, non-HTTP Analysis Engine foundation (`analysis-engine` module) — a `MarketSeries` Anti-Corruption Layer, a nine-calculator Indicator Engine (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX, Fibonacci, Donchian Channel), a Swing Detection Infrastructure (BOS/CHoCH), and a Regime/Context Service — consumed only via injection tokens, producing no trader-visible output yet (reserved for S1-008's Analysis Provider Framework).
-   Web (`apps/web`) — Next.js foundation.
-   Database (`packages/database`) — Prisma client with `User`, `Exchange`, `Market`, `Asset`, `Watchlist`, `WatchlistItem`, `FavouriteAsset`, `Portfolio`, `Position`, `Transaction`, `MarketQuote`, `Candle` models (identity, trading catalog, watchlist/favourite, portfolio/position-accounting, and market-data-cache domains; no order-execution model yet, no real external market-data vendor integrated yet, and no analytics-specific model — S1-006 and S1-007 each introduced zero new Prisma models by design).
-   Shared Packages (`packages/{tooling,types,utils,validation}`).
-   Documentation (`documentation/zos`, `documentation/ai`).

## Pending Work

-   No approved Sprint Brief beyond S1-007; the remaining M1 areas (further Business Services work, full authorization refinement, core APIs), and the Analysis Provider Framework itself (ADR-006, S1-008), have not been proposed or approved.
-   Non-blocking deviations accepted at S1-001 through S1-007 closure (see Known Technical Debt).

## Architecture Decisions

-   ADR-001 — JWT-Based Authentication (S1-001 Foundation). Approved 2026-07-11. See `12_ADR_INDEX.md`.
-   ADR-002 — Argon2id Password Hashing (S1-002 User Management). Approved 2026-07-12. See `12_ADR_INDEX.md`.
-   ADR-003 — Market Data Provider Abstraction (S1-005 Market Data Foundation). Approved 2026-07-12. See `12_ADR_INDEX.md`. The only registered implementation is a simulated provider — not real market data; a future real vendor requires its own superseding/additional ADR.
-   ADR-004 — Background Job Scheduling for Market Data Synchronization (S1-005). Approved 2026-07-12. See `12_ADR_INDEX.md`.
-   No new ADR was created for S1-003; catalog-mutation authorization applies the existing `Role` enum via DEC-2026-004 (see `11_DECISION_LOG.md`), which does not introduce new architecture.
-   No new ADR was created for S1-004; financial-data precision and concurrency safety apply already-approved Prisma/PostgreSQL capabilities via DEC-2026-005 (see `11_DECISION_LOG.md`), which does not introduce new architecture.
-   No new ADR was created for S1-006; the Trading Analytics layer composes already-approved services behind a new read-only module, per DEC-2026-009 (scoring/staleness calibration) and DEC-2026-010 (a bug fix, not a new decision) — see `11_DECISION_LOG.md`.
-   ADR-005 — Shared Deterministic Computation Infrastructure (Indicator Engine, Swing Detection, Regime/Context Service). Approved 2026-07-12. See `12_ADR_INDEX.md`. Implemented by S1-007 per DEC-2026-011 (computationVersion scheme, golden-dataset sourcing disclosure, calibration non-defaulting).
-   ADR-006 — Analysis Provider Plugin Architecture & Standard Output Contract. Approved 2026-07-12. See `12_ADR_INDEX.md`. Not yet implemented — scoped to S1-008 onward.
-   ADR-007 — Confluence Architecture: Normalization & Weighting-Readiness. Approved 2026-07-12. See `12_ADR_INDEX.md`. Not yet implemented — scoped to S1-012.

## Known Technical Debt

-   Formal per-dependency `14_DEPENDENCY_POLICY.md` review was not run individually for S1-001/S1-002's supporting libraries (e.g. `nestjs-pino`, `@nestjs/passport`, `argon2`). Owner: Architecture Team. Planned resolution: address in a future dependency audit; accepted as non-blocking at S1-001 and S1-002 closure.
-   Automated test coverage now includes health, auth, user-registration/login, trading catalog, watchlist/favourite, portfolio/position, market-data, and analytics flows, but `apps/web` still has no automated tests. Owner: next implementation sprint. Planned resolution: expand alongside future feature work.
-   Extended user profile fields (for personalized trading data, performance analysis, risk insights) and compliance/KYC/session-policy considerations were intentionally deferred at S1-002 — see `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md`, Missing Decisions section.
-   No API exists to create or promote an `ADMIN` user; S1-003 intentionally deferred this as a user-management concern, not a trading-catalog concern — see `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`, Missing Decisions section.
-   Catalog data seeding/ingestion strategy (how real-world exchange/market/asset data is sourced and kept current at scale) was intentionally deferred at S1-003 — see the same Missing Decisions section.
-   Unrealized P/L display and its live market-data source were intentionally deferred at S1-004 — this sprint exposes only `quantity`/`averageCost`/computed `costBasis`, no price feed. Multi-currency portfolio support was also intentionally deferred. See `documentation/zos/sprints/S1-004_SPRINT_BRIEF.md`, Missing Decisions section. (Unrealized P/L itself was subsequently delivered as part of S1-006's Trading Analytics layer.)
-   **All market data (quotes and candles) is simulated, not real, as of S1-005** — no external market-data vendor has been reviewed or approved by the Architecture Team. Owner: Architecture Team. Planned resolution: a future ADR selecting and integrating a real vendor behind the existing `MarketDataProvider` interface, requiring no change to caching, rate limiting, retry, background sync, or the HTTP API. See `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md`, Missing Decisions section, and ADR-003. This limitation is inherited unchanged by S1-006's analytics, which are only as real as the underlying simulated quotes.
-   Unrealized P/L display, intraday/multi-timeframe candles, and multi-currency quotes were intentionally deferred at S1-005 — see the same Missing Decisions section.
-   Portfolio/performance history, charting, alerts, a Risk Engine, a Decision Engine, and AI-driven insight were intentionally deferred at S1-006 — this sprint is stateless and point-in-time by design, computing analytics live with no persisted history. See `documentation/zos/sprints/S1-006_SPRINT_BRIEF.md`, Missing Decisions section.
-   S1-007 introduces no trader-visible output by design — the Indicator Engine, Swing Detection Infrastructure, and Regime/Context Service are internal, composable-only services with no HTTP endpoint, consumed by no code yet. They remain unused until S1-008's Analysis Provider Framework (ADR-006) begins consuming them. Swing Detection sensitivity and Regime/Context Service threshold calibration have no code-level default and must be supplied by each caller — see `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md`, Missing Decisions section, and DEC-2026-011.

## Known Risks

-   None currently acknowledged beyond the Known Technical Debt items above.

## Blockers

-   None currently active.

## Open Questions

-   None currently pending Architecture Team decision.

# Update Policy

Project Brain may be updated only after:

-   Sprint approval
-   Architecture review
-   Milestone review
-   Approved architectural decisions

Implementation engineers must never modify this document directly.

# Related Documents

-   07_ENGINEERING_WORKFLOW.md
-   08_ROADMAP.md
-   10_AI_ENGINEER_GUIDE.md
-   20_AI_BOOT_SEQUENCE.md
