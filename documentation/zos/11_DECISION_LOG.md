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

## DEC-2026-011

-   **Date:** 2026-07-12
-   **Title:** Analysis Engine Computation Versioning, Golden-Dataset Sourcing, and Calibration Non-Defaulting
-   **Status:** Approved
-   **Decision Summary:** Records the implementation-time calibration anticipated by the S1-007 Sprint Brief's Missing Decisions section. (1) `computationVersion` uses semantic versioning starting at `1.0.0`, assigned independently per computation unit (each of the nine Indicator Engine calculators, Swing Detection, and the Regime/Context Service carries its own version, incremented only if a future change could alter a previously-computed value for the same input). (2) Wilder's original 1978 worked examples (RSI, ATR, ADX) could not be independently obtained in this implementation environment (no network access to the out-of-print primary text); per the Sprint Brief's disclosed-fallback allowance, conformance is instead verified by a fully hand-traced manual calculation over a small constructed series, with the substitution and reasoning disclosed directly in each calculator's spec file. MACD and Bollinger Bands use a hand-traced known-reference example (not a mandatory-primary-source case per the Brief's Acceptance Criteria). (3) Swing-detection `sensitivity` and Regime/Context Service threshold calibration (`adxTrendingThreshold`, `volatilityMultiplier`) are **not** given any code-level default at all — every call site must supply them explicitly, satisfying the architecture's "disclosed, never-silently-defaulted" requirement by construction rather than by choosing and recording a single default value; selecting an actual default (if one is ever wanted) is left to the S1-008 Analysis Providers that will call these services with methodology-specific values.
-   **Business Rationale:** These are calibration/documentation choices within an already-approved computation-infrastructure design (Sprint Brief Scope items 2-6), not new architecture — analogous to DEC-2026-009's scoring/staleness calibration. Recording them here provides traceability for why each conformance test uses the values it does, and confirms the deliberate absence of a swing/regime default is itself the calibration decision for this sprint, not an oversight.
-   **Technical Impact:** `apps/api/src/analysis-engine/**` — every calculator/service file sets its own `COMPUTATION_VERSION = '1.0.0'` constant; `rsi.calculator.spec.ts`, `atr.calculator.spec.ts`, `adx.calculator.spec.ts`, `macd.calculator.spec.ts`, and `bollinger-bands.calculator.spec.ts` each carry an in-file "SOURCING DISCLOSURE" / reference-example comment naming the substitution and reasoning; `SwingDetectionParams`/`RegimeContextParams` have no default values in their type definitions or call sites.
-   **Related ADR:** ADR-005 — this decision calibrates an already-approved computation-infrastructure design; it introduces no new technology or mechanism, consistent with the DEC-2026-002/DEC-2026-004/DEC-2026-005/DEC-2026-008/DEC-2026-009 precedent.
-   **Affected Components:** `apps/api/src/analysis-engine` (all calculators and services).
-   **Implemented In:** S1-007.

## DEC-2026-012

-   **Date:** 2026-07-13
-   **Title:** Analysis Provider Framework Calibration — Dependency Syntax, Tiering, Circuit Breaker, Confidence Labeling, Versioning
-   **Status:** Approved
-   **Decision Summary:** Records the implementation-time calibration anticipated by the S1-008 Sprint Brief's Missing Decisions section. (1) A Provider declares a dependency via a readonly `dependsOn?: readonly string[]` array of other Providers' stable `id`s on the `AnalysisProvider` interface itself — resolved by the Execution Engine via topological sort, never a concrete-class import. (2) Tier classification is a readonly `tier: 'FAST' | 'SLOW'` field, also self-declared on the Provider. (3) The circuit breaker uses a `failureThreshold` of 3 consecutive failures/timeouts and a `resetTimeoutMs` of 30,000ms before allowing a probe retry; the default per-invocation timeout (overridable per Provider via `timeoutMs`) is 5,000ms. (4) The four Confidence-taxonomy labels are the `ConfidenceKind` union (`'DETECTION' | 'INTERPRETATION' | 'REGIME_ADJUSTED' | 'METHODOLOGY_CEILING'`), each paired with a `Prisma.Decimal` value on a 0-100 scale (consistent with the project's existing 0-100 scored fields, e.g. S1-006's Concentration/Health Score) rather than a categorical HIGH/MEDIUM/LOW label, since `InterpretationConfidence` must support ranking multiple hypotheses within a single `interpretation[]` array — a categorical scale would not. (5) `computationVersion` follows the same semantic-versioning-from-`1.0.0` convention as S1-007 (DEC-2026-011), assigned per Provider. (6) `runNewAnalysis()` returns two independently-resolvable results (`fastTier`/`slowTier` promises, an implementation-level `TieredExecutionRun` shape) rather than one flat awaited value, so a SLOW-tier Provider's execution can never block a FAST-tier Provider's result, per ADR-006's Execution tiers requirement — each Provider's own invocation only awaits its actual declared dependencies (a per-node async task-graph), not an artificial tier-wide barrier.
-   **Business Rationale:** These are calibration/type-shape choices within an already-approved framework design (ADR-006; Sprint Brief Scope items 1-6), not new architecture — analogous to DEC-2026-009's and DEC-2026-011's precedent. No real Provider exists yet to be affected by a future recalibration of the numeric thresholds; S1-009's first real Provider inherits these values unless a superseding Decision Log entry changes them.
-   **Technical Impact:** `apps/api/src/analysis-engine/providers/**`. `provider-circuit-breaker.ts` and `provider-execution.service.ts` hold the threshold/timeout constants as named, commented constants (not magic numbers). `analysis-provider.types.ts` defines `ConfidenceKind`/`LabeledConfidence`/`ProviderTier`/`ProviderLifecycleState`. `provider-execution.types.ts` defines `TieredExecutionRun`. A sprint-audit fix (not a new decision) also scoped `ExecutionRunResult.totalRegistered` to the tier actually being reported, rather than the grand total across both tiers.
-   **Related ADR:** ADR-006 — this decision calibrates an already-approved framework design; it introduces no new technology or mechanism, consistent with the DEC-2026-002/DEC-2026-004/DEC-2026-005/DEC-2026-008/DEC-2026-009/DEC-2026-011 precedent.
-   **Affected Components:** `apps/api/src/analysis-engine/providers`.
-   **Implemented In:** S1-008.

## DEC-2026-013

-   **Date:** 2026-07-13
-   **Title:** Wyckoff Method Provider Calibration, Golden-Dataset Sourcing, and Generic Confidence Contract Completion
-   **Status:** Approved
-   **Decision Summary:** Records the implementation-time calibration anticipated by the S1-009 Sprint Brief's Missing Decisions section, plus two framework-level fixes discovered while building the first real Provider. (1) The maximum number of alternate phase-hypotheses tracked is 2 (`MAX_PHASE_HYPOTHESES`), returned only at the two genuinely ambiguous schematic transitions (post-AR; post-Spring/Upthrust pre-Test). (2) Event-detection thresholds: a Selling/Buying Climax requires volume `>=2x` (`CLIMAX_VOLUME_MULTIPLIER`) the trailing 5-bar average (`TRAILING_VOLUME_WINDOW`); a Secondary Test/Test's "near price" tolerance is `1.5x` the current ATR (`NEAR_TOLERANCE_ATR_MULTIPLIER`), not a fixed percentage, so it scales with each instrument's own volatility. (3) `WyckoffProvider`'s own calibration for the shared computation calls it makes: swing sensitivity `3`, ADX/ATR periods `14`, ADX trending threshold `25`, volatility multiplier `1.5`. (4) Golden-dataset sourcing: the Wyckoff Stock Market Institute course material's specific page-numbered worked example could not be independently obtained in this implementation environment; the golden-dataset test instead reproduces the canonical, universally-taught Accumulation Schematic #1 structure and qualitative price/volume relationships every published description agrees on, disclosed in-file per the S1-007 precedent. (5) Methodology Confidence Ceiling for `'WYCKOFF'` is `85`, reflecting its disclosed source-verified status (Wyckoff's Three Laws) relative to methodologies lacking an independent primary source. (6) `computationVersion`/`contractVersion` both `1.0.0`, the same convention as S1-007/S1-008. **Two framework-level fixes, not Wyckoff-specific:** the generic `AnalysisProviderResult`/`Interpretation` contract (S1-008) only ever carried Interpretation Confidence — completed to also carry `detectionConfidence` and `methodologyConfidenceCeiling` (one per result) and `regimeAdjustedConfidence` (per interpretation entry), since ADR-006 requires all four Confidence kinds to be expressible on every Provider's output, not just one. Separately, `ANALYSIS_PROVIDERS`'s factory registration moved from a standalone `ProvidersModule` into `AnalysisEngineModule` directly, because NestJS module encapsulation does not allow a module to inject a provider declared only in a module that imports it — the factory needs `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT`, which live in `AnalysisEngineModule`.
-   **Business Rationale:** The numeric thresholds and sourcing disclosure are calibration choices within an already-approved Provider design (S1-009 Sprint Brief Scope items 1-10), not new architecture — analogous to the DEC-2026-009/011/012 precedent. The two framework-level fixes are completions of already-approved, already-mandated generic requirements (ADR-006's four-part Confidence taxonomy; NestJS's own module-scoping rules), discovered only once a real Provider first exercised them — the same category as S1-006's DEC-2026-010 (a defect found by the first sprint to genuinely exercise a prior sprint's code path), not a reversal of any prior decision.
-   **Technical Impact:** `apps/api/src/analysis-engine/providers/wyckoff/**` holds every disclosed constant as a named, commented value. `apps/api/src/analysis-engine/providers/analysis-provider.types.ts` gained `AnalysisProviderResult.detectionConfidence`/`.methodologyConfidenceCeiling` and `Interpretation.regimeAdjustedConfidence` (additive; the S1-008 `FixtureProvider` and its tests were updated to match, with zero behavioral change to dependency resolution, tiering, circuit breaker, or lifecycle gating). `apps/api/src/analysis-engine/analysis-engine.module.ts` now registers `ANALYSIS_PROVIDERS`/`PROVIDER_EXECUTION_ENGINE` directly; `providers/providers.module.ts` and its spec were removed (nothing else referenced them).
-   **Related ADR:** ADR-005 (computation substrate calibration precedent), ADR-006 (Provider Confidence taxonomy and module-registration mechanics) — this decision calibrates and completes already-approved designs; it introduces no new technology or mechanism, consistent with the DEC-2026-009/011/012 precedent.
-   **Affected Components:** `apps/api/src/analysis-engine/providers/wyckoff`, `apps/api/src/analysis-engine/providers/analysis-provider.types.ts`, `apps/api/src/analysis-engine/analysis-engine.module.ts`.
-   **Implemented In:** S1-009.

## DEC-2026-014

-   **Date:** 2026-07-13
-   **Title:** ICT/SMC Provider Calibration, Golden-Dataset Sourcing, and the DisplacementLeg Internal Concept
-   **Status:** Approved
-   **Decision Summary:** Records the implementation-time calibration anticipated by the S1-010 Sprint Brief's Missing Decisions section, plus the disclosed internal design introduced under the Architecture Team's Implementation Guidance #1. (1) The maximum number of alternate bias-hypotheses tracked is 2 (`MAX_BIAS_HYPOTHESES`), returned only when Bullish and Bearish evidence totals genuinely tie. (2) Event-detection thresholds: a Fair Value Gap's minimum qualifying size is `0.25x` the current ATR (`FVG_MIN_ATR_MULTIPLIER`); a Liquidity Sweep's pierce-beyond-tolerance is also `0.25x` ATR (`SWEEP_ATR_TOLERANCE_MULTIPLIER`); an Order Block's backward search window is 5 bars (`ORDER_BLOCK_LOOKBACK_BARS`); a Liquidity Sweep's best-effort link to a following Displacement Leg looks up to 3 bars ahead (`SWEEP_TO_DISPLACEMENT_WINDOW_BARS`) — all disclosed, named constants, none a fixed price-fraction. (3) This Provider's own calibration for the shared computation calls it makes: swing sensitivity `3` (matching the value chosen for S1-009's Provider for cross-Provider structural consistency, not because of any dependency between them), ADX/ATR periods `14`, ADX trending threshold `25`, volatility multiplier `1.5`. (4) Golden-dataset sourcing: no single canonical, page-numbered ICT/SMC worked example could be independently obtained in this implementation environment (unlike a single institutional curriculum, ICT/SMC vocabulary is taught across a large, decentralized body of modern retail trading education with real definitional variance between sources); the golden-dataset test instead reproduces the canonical, universally-taught "liquidity sweep then displacement" setup every mainstream source agrees on, with this Provider's exact Order Block/Fair Value Gap/Liquidity Sweep definitions disclosed in the same file, per the S1-007/S1-009 precedent. (5) Methodology Confidence Ceiling for `'ICT_SMC'` is `60`, strictly below Wyckoff's `85`, reflecting this methodology's disclosed absence of independent institutional verification. (6) `computationVersion`/`contractVersion` both `1.0.0`, the same convention as S1-007/S1-008/S1-009. (7) Regime-Adjusted Confidence uses a mirror-image rule to Wyckoff's: an Order-Block-dominant (continuation) reading is strengthened (`x1.2`) in `TRENDING` and weakened (`x0.7`) in `RANGING`; a Liquidity-Sweep-dominant (reversal) reading is strengthened in `RANGING` and weakened in `TRENDING`; a tied reading is not scaled. **One disclosed internal design decision, per the Architecture Team's binding Implementation Guidance #1 (S1-010 Sprint Brief, Approval Section):** `DisplacementLeg` — the impulse leg following a Swing Detector `BOS` event — is introduced as a shared, ICT-internal concept linking Order Block (`INSTITUTIONAL_REACTION`), Fair Value Gap (`IMBALANCE`), and Liquidity Sweep (`LIQUIDITY_EVENT`) detection, expressing the `Liquidity Event -> Displacement -> Imbalance -> Institutional Reaction` narrative structurally without implementing its full reasoning in V1. Per the Architecture Team's explicit direction at Task Breakdown approval, this concept remains confined to `providers/ict-smc/` and is not promoted into the generic Analysis Provider Framework; a future Provider demonstrating genuine reuse would require its own ADR to do so.
-   **Business Rationale:** The numeric thresholds, sourcing disclosure, and Confidence Ceiling are calibration choices within an already-approved Provider design (S1-010 Sprint Brief Scope items 1-11), not new architecture — analogous to the DEC-2026-009/011/012/013 precedent. The `DisplacementLeg` concept is a Provider-internal design choice explicitly reviewed and approved by the Architecture Team at Task Breakdown approval, not a unilateral framework change — it is confined by a mechanical boundary test (alongside the independence boundary test) to never leak into any generic component.
-   **Technical Impact:** `apps/api/src/analysis-engine/providers/ict-smc/**` holds every disclosed constant as a named, commented value; `ict-smc.types.ts` defines `DisplacementLeg`/`OrderBlock`/`FairValueGap`/`LiquiditySweep`/`IctSmcBiasHypothesis`, all confined to this directory. `apps/api/src/analysis-engine/analysis-engine.module.ts` registers `IctSmcProvider` as the second `ANALYSIS_PROVIDERS` entry, constructed with the same shared `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` instances as `WyckoffProvider`, with no dependency between the two Providers. No change to the generic `AnalysisProvider`/`AnalysisProviderResult` contract, the Execution Engine, Lifecycle, or Observability — this Provider is a pure consumer of the S1-008 framework, exactly as ADR-006 requires.
-   **Related ADR:** ADR-005 (computation substrate calibration precedent), ADR-006 (Provider Confidence taxonomy and registration mechanics) — this decision calibrates an already-approved design; it introduces no new technology or mechanism, consistent with the DEC-2026-009/011/012/013 precedent.
-   **Affected Components:** `apps/api/src/analysis-engine/providers/ict-smc`, `apps/api/src/analysis-engine/analysis-engine.module.ts`.
-   **Implemented In:** S1-010.

# Rules

-   Every architectural decision must have a Decision Log entry.
-   Superseded decisions remain in history.
-   Entries are append-only; never rewrite history.
-   Only the Architecture Team may approve or close a decision.

# Related Documents

-   05_ARCHITECTURE.md
-   12_ADR_INDEX.md
-   09_PROJECT_BRAIN.md
