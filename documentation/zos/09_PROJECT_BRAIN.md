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
-   Current Milestone: M1 — Core Platform — In Progress (S1-002 User Management, S1-003 Trading Catalog & User Watchlist Foundation, S1-004 Position & Portfolio Management Foundation, S1-005 Market Data Foundation, S1-006 Trading Analytics Foundation, S1-007 Analysis Engine Foundation, S1-008 Analysis Provider Framework, S1-009 Wyckoff Method Analysis Provider, S1-010 ICT/SMC Analysis Provider, and S1-011 Elliott Wave Analysis Provider, complete; the remaining Business Services scope, full authorization refinement, and Core APIs not yet started)
-   Current Phase: Phase 1 — Engineering Foundation
-   Current Sprint: None active — S1-011 is closed; no subsequent Sprint Brief has been proposed or approved

## Completed Sprints

-   S1-001 — Foundation Setup. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-001_COMPLETION_REPORT.md`. Final implementation commit: `f29785a`.
-   S1-002 — User Management Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-002_COMPLETION_REPORT.md`. Final implementation commits: `6abeafc`, `5325c44`.
-   S1-003 — Trading Catalog & User Watchlist Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-003_COMPLETION_REPORT.md`. Final implementation commits: `bbc7cd3`, `58e75f4`.
-   S1-004 — Position & Portfolio Management Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-004_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-004_COMPLETION_REPORT.md`. Final implementation commits: `94c8987`, `26611d9`.
-   S1-005 — Market Data Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-005_COMPLETION_REPORT.md`. Final implementation commits: `db4a352`, `be2680f`.
-   S1-006 — Trading Analytics Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-006_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-006_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-007 — Analysis Engine Foundation: Indicator Engine, Swing Detection Infrastructure & Regime/Context Service. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-007_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-008 — Analysis Provider Framework. Closed 2026-07-13. Sprint Brief: `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md`. Task Breakdown: `documentation/ai/S1-008_TASK_BREAKDOWN.md`. Completion Report: `documentation/ai/S1-008_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-009 — Wyckoff Method Analysis Provider. Closed 2026-07-13. Sprint Brief: `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`. Task Breakdown: `documentation/ai/S1-009_TASK_BREAKDOWN.md`. Completion Report: `documentation/ai/S1-009_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-010 — ICT / Smart Money Concepts (SMC) Analysis Provider. Closed 2026-07-13. Sprint Brief: `documentation/zos/sprints/S1-010_SPRINT_BRIEF.md`. Task Breakdown: `documentation/ai/S1-010_TASK_BREAKDOWN.md`. Completion Report: `documentation/ai/S1-010_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.
-   S1-011 — Elliott Wave Analysis Provider. Closed 2026-07-13. Sprint Brief: `documentation/zos/sprints/S1-011_SPRINT_BRIEF.md`. Task Breakdown: `documentation/ai/S1-011_TASK_BREAKDOWN.md`. Completion Report: `documentation/ai/S1-011_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.

## Active Modules

-   API (`apps/api`) — NestJS foundation: health check, Swagger, Pino logging, JWT authentication with real user registration/login (Argon2id); trading catalog (exchanges, markets, assets) with `ADMIN`-gated mutation and open read; user watchlists, watchlist items, and favourite assets with strict per-user ownership scoping; user-owned portfolios and positions with transaction-derived quantity/average-cost/realized-P&L accounting, concurrency-safe via row-locked database transactions; market data (symbol search, asset lookup, quotes, daily candles) sourced through a provider-agnostic interface, currently backed only by a simulated provider (ADR-003 — not real market data), cached in PostgreSQL, rate-limited, retried with backoff, and kept fresh for tracked assets via a `@nestjs/schedule` background job; a read-only Trading Analytics layer (portfolio/position P&L, risk exposure, a rule-based Portfolio Health Score, Decision Readiness, Data Quality/Confidence) composing the Portfolio/Position/Market Data services, computed live on every request with zero persisted history; an internal, non-HTTP Analysis Engine foundation (`analysis-engine` module) — a `MarketSeries` Anti-Corruption Layer, a nine-calculator Indicator Engine (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX, Fibonacci, Donchian Channel), a Swing Detection Infrastructure (BOS/CHoCH), a Regime/Context Service, an Analysis Provider Framework (S1-008 — Provider registry and Execution Engine: dependency resolution, fast/slow tiering, partial-failure reporting, a circuit breaker, Provider Lifecycle gating), (S1-009) the first real Analysis Provider — `WyckoffProvider`, reading price structure through the Wyckoff Method's Accumulation/Distribution Schematic #1 (trading-range identification, the full 16-event vocabulary, bounded multi-hypothesis Phase A-E classification, the four-part Confidence taxonomy) — (S1-010) the second real Analysis Provider — `IctSmcProvider`, reading Order Blocks, Fair Value Gaps, and Liquidity Sweeps over the same shared substrate, fully independent of `WyckoffProvider` (no `dependsOn`, mechanically-verified zero shared code), with its own lower Methodology Confidence Ceiling and a mirror-image Regime-Adjusted Confidence rule — and (S1-011) the third real Analysis Provider — `ElliottWaveProvider`, generating a bounded 5-wave motive (impulse) count via Elliott's Three Rules as hard invalidation and Fibonacci-guideline proximity as soft ranking (the first real consumer of the Indicator Engine's `fibonacciLevels()` calculator, idle since S1-007), fully independent of both prior Providers, with its own independently-calibrated Methodology Confidence Ceiling and Regime-Adjusted Confidence rule — all consumed only via injection tokens, still producing no trader-visible output (no HTTP endpoint yet; that begins once a Consumer — Dashboard, Confluence, S1-012 — exists).
-   Web (`apps/web`) — Next.js foundation.
-   Database (`packages/database`) — Prisma client with `User`, `Exchange`, `Market`, `Asset`, `Watchlist`, `WatchlistItem`, `FavouriteAsset`, `Portfolio`, `Position`, `Transaction`, `MarketQuote`, `Candle` models (identity, trading catalog, watchlist/favourite, portfolio/position-accounting, and market-data-cache domains; no order-execution model yet, no real external market-data vendor integrated yet, and no analytics-specific model — S1-006, S1-007, S1-008, S1-009, S1-010, and S1-011 each introduced zero new Prisma models by design).
-   Shared Packages (`packages/{tooling,types,utils,validation}`).
-   Documentation (`documentation/zos`, `documentation/ai`).

## Pending Work

-   No approved Sprint Brief beyond S1-011; the remaining M1 areas (further Business Services work, full authorization refinement, core APIs), and the next Analysis Provider or component (S1-012 onward, ADR-006/ADR-007 — not yet selected), have not been proposed or approved.
-   Non-blocking deviations accepted at S1-001 through S1-011 closure (see Known Technical Debt).

## Architecture Decisions

-   ADR-001 — JWT-Based Authentication (S1-001 Foundation). Approved 2026-07-11. See `12_ADR_INDEX.md`.
-   ADR-002 — Argon2id Password Hashing (S1-002 User Management). Approved 2026-07-12. See `12_ADR_INDEX.md`.
-   ADR-003 — Market Data Provider Abstraction (S1-005 Market Data Foundation). Approved 2026-07-12. See `12_ADR_INDEX.md`. The only registered implementation is a simulated provider — not real market data; a future real vendor requires its own superseding/additional ADR.
-   ADR-004 — Background Job Scheduling for Market Data Synchronization (S1-005). Approved 2026-07-12. See `12_ADR_INDEX.md`.
-   No new ADR was created for S1-003; catalog-mutation authorization applies the existing `Role` enum via DEC-2026-004 (see `11_DECISION_LOG.md`), which does not introduce new architecture.
-   No new ADR was created for S1-004; financial-data precision and concurrency safety apply already-approved Prisma/PostgreSQL capabilities via DEC-2026-005 (see `11_DECISION_LOG.md`), which does not introduce new architecture.
-   No new ADR was created for S1-006; the Trading Analytics layer composes already-approved services behind a new read-only module, per DEC-2026-009 (scoring/staleness calibration) and DEC-2026-010 (a bug fix, not a new decision) — see `11_DECISION_LOG.md`.
-   ADR-005 — Shared Deterministic Computation Infrastructure (Indicator Engine, Swing Detection, Regime/Context Service). Approved 2026-07-12. See `12_ADR_INDEX.md`. Implemented by S1-007 per DEC-2026-011 (computationVersion scheme, golden-dataset sourcing disclosure, calibration non-defaulting).
-   ADR-006 — Analysis Provider Plugin Architecture & Standard Output Contract. Approved 2026-07-12. See `12_ADR_INDEX.md`. Framework implemented by S1-008 per DEC-2026-012 (dependency-declaration syntax, tiering, circuit-breaker/timeout defaults, confidence labeling, computationVersion scheme). First real Provider (`WyckoffProvider`) implemented by S1-009 per DEC-2026-013 (event-detection thresholds, golden-dataset sourcing, Methodology Confidence Ceiling, and completion of the generic four-part Confidence contract). Second real Provider (`IctSmcProvider`) implemented by S1-010 per DEC-2026-014 (event-detection thresholds, golden-dataset sourcing, Methodology Confidence Ceiling of `60`, and the `DisplacementLeg` ICT-internal design) — the framework's methodology-neutrality was verified directly, not merely asserted: zero change to the generic contract, Execution Engine, Registry, Confidence Model, Traceability, Lifecycle, Observability, or Dependency Resolution was required to register a second, structurally unrelated methodology. Third real Provider (`ElliottWaveProvider`) implemented by S1-011 per DEC-2026-015 (event-detection thresholds, golden-dataset sourcing, Methodology Confidence Ceiling of `75`, and the Fibonacci-guideline reuse design) — the same zero-framework-change methodology-neutrality result held a second time, and the Indicator Engine's `fibonacciLevels()` calculator (S1-007) was consumed by a real Provider for the first time.
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
-   S1-007 introduces no trader-visible output by design — the Indicator Engine, Swing Detection Infrastructure, and Regime/Context Service are internal, composable-only services with no HTTP endpoint, consumed by no code yet. They remain unused until a real Analysis Provider (S1-009 onward) begins consuming them. Swing Detection sensitivity and Regime/Context Service threshold calibration have no code-level default and must be supplied by each caller — see `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md`, Missing Decisions section, and DEC-2026-011.
-   S1-008's Analysis Provider Framework registers zero real Providers by design — the registry, Execution Engine, circuit breaker, and Lifecycle gating are exercised only by in-test-only fixture Providers. `normalize()` is a documented no-op (`: void`) pending ADR-007/S1-012's vocabulary; `traceability` is in-memory only, with no persistence layer. Finding B (whether a `DEPRECATED` Provider's `computationVersion` may still increment) remains an open question that must be resolved before any Provider is actually deprecated — see `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Additional Findings (Finding B), and `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md`. Not affected by S1-009 (`WyckoffProvider` is `ACTIVE` only; no Lifecycle transition occurs).
-   S1-009's `WyckoffProvider` is scoped to the single canonical Wyckoff Schematic #1 (not Schematic #2, re-accumulation/re-distribution, or Point & Figure counting — the last excluded as a scope/complexity decision, not an architectural blocker, since P&F does not require intraday data). VSA (Volume Spread Analysis), already declared as depending on Wyckoff's active-range output, is not built; how a future VSA Provider will read that output beyond the generic `AnalysisProviderResult` contract is unsolved, deferred to whichever sprint builds VSA. In a sparse series with exactly two swing highs positioned precisely at the Automatic Rally and Sign-of-Strength events (no intervening minor high), the range's resistance boundary equals the Sign-of-Strength's own price, making the breakout undetectable — a disclosed V1 edge case, not expected in real multi-week data. See `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, Missing Decisions section, and DEC-2026-013.
-   S1-010's `IctSmcProvider` is scoped to a bounded V1 toolkit (Order Blocks, Fair Value Gaps, Liquidity Sweeps) — Optimal Trade Entry/premium-discount Fibonacci zones, Power of Three, Breaker/Mitigation/Rejection Blocks, and other Order Block variants are deferred as scope/complexity decisions, candidates for a future extension of this same Provider. Killzones and any time-of-day/session-window concept are **architecturally blocked, not merely deferred**: `MarketSeries` carries daily-bar points with no intraday timestamp granularity or session metadata. The `DisplacementLeg` internal concept (per Architecture Team Implementation Guidance #1) is confined to `providers/ict-smc/` and must not be promoted into the generic framework without a future ADR, even if a later Provider appears to need something similar. See `documentation/zos/sprints/S1-010_SPRINT_BRIEF.md`, Missing Decisions section, and DEC-2026-014.
-   S1-011's `ElliottWaveProvider` is scoped to the single canonical 5-wave motive (impulse) count only — corrective wave counting (A-B-C zigzag/flat/triangle), diagonal triangles (and Rule 3's documented exception for them), Wave Personality/Alternation/Equality, and multi-degree wave labeling are all deferred as scope/complexity decisions, candidates for a future extension of this same Provider. `ElliottWaveProvider`'s own internal types (`WaveCountCandidate` and related) are confined to `providers/elliott-wave/` and must not be promoted into the generic framework without a future ADR, per the Architecture Team's explicit direction, even if a later Provider appears to need something similar. See `documentation/zos/sprints/S1-011_SPRINT_BRIEF.md`, Missing Decisions section, and DEC-2026-015.

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
