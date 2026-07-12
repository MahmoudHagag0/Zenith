# S1-007_COMPLETION_REPORT

**Document ID:** AI-020
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Structured completion report for Sprint S1-007 — Analysis Engine Foundation: Indicator Engine, Swing Detection & Regime/Context Service, prepared per `10_AI_ENGINEER_GUIDE.md`'s required report structure and `07_ENGINEERING_WORKFLOW.md`, following the same pattern as `S1-006_COMPLETION_REPORT.md` (AI-019).

# Sprint ID

S1-007 — Analysis Engine Foundation: Indicator Engine, Swing Detection Infrastructure & Regime/Context Service

# Status

Complete and independently verified.

# Objectives Completed

Per `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` Scope (items 1–7, all approved): a new, self-contained `apps/api/src/analysis-engine` module tree implementing (1) the `MarketSeries`/`MarketSeriesPoint` Anti-Corruption Layer translating `Candle`/`MarketQuote` into a normalized, Data-Quality-aware series, composing `MarketDataService` rather than duplicating it; (2) an Indicator Engine of nine independent calculators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX, Fibonacci ratios, Donchian Channel) consumed via the `INDICATOR_ENGINE` token; (3) a Swing Detection Infrastructure (N-bar fractal swing/pivot detection, HH/LH/HL/LL classification, BOS/CHoCH structure events) consumed via `SWING_DETECTOR`; (4) a Regime/Context Service composing ADX/ATR/Structure into a trend/volatility regime read, consumed via `REGIME_CONTEXT`; (5) golden-dataset conformance tests for every calculator, with disclosed sourcing substitutions where Wilder's primary text was unobtainable; (6) per-computation latency and computation-rejection-rate observability via the existing Pino logger; (7) full unit test coverage and zero regression against S1-001–S1-006. No Analysis Provider, no HTTP endpoint, no new Prisma model, and no new runtime dependency were introduced, exactly as scoped.

# Files Created

`apps/api/src/analysis-engine/analysis-engine.module.ts`; `apps/api/src/analysis-engine/common/{computation-metadata.util.ts,computation-metadata.util.spec.ts,computation-rejected.error.ts,computation-cache.service.ts,computation-cache.service.spec.ts,observability.service.ts,observability.service.spec.ts}`; `apps/api/src/analysis-engine/market-series/{market-series.types.ts,market-series.service.ts,market-series.service.spec.ts,anti-corruption-boundary.spec.ts}`; `apps/api/src/analysis-engine/indicator-engine/{indicator-engine.types.ts,indicator-engine.tokens.ts,indicator-engine.service.ts,indicator-engine.service.spec.ts,calculators/{sma,ema,rsi,macd,bollinger-bands,atr,adx,donchian-channel,fibonacci}.calculator.ts,calculators/*.spec.ts}`; `apps/api/src/analysis-engine/swing-detection/{swing-detection.types.ts,swing-detection.tokens.ts,swing-detection.service.ts,swing-detection.service.spec.ts}`; `apps/api/src/analysis-engine/regime-context/{regime-context.types.ts,regime-context.tokens.ts,regime-context.service.ts,regime-context.service.spec.ts}`. 40 new source/spec files in total.

# Files Modified

`apps/api/src/app.module.ts` (registered `AnalysisEngineModule`); `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Sprint Closure section recorded); `documentation/zos/11_DECISION_LOG.md` (added DEC-2026-011); `documentation/zos/09_PROJECT_BRAIN.md` and `documentation/ai/00_AI_INDEX.md` (sprint closure — see below).

# Dependencies Added

None. Confirmed via `git diff` against every `package.json` and `pnpm-lock.yaml` in the monorepo — zero changes. Per the approved Sprint Brief's Dependencies section, this sprint is pure TypeScript computation within the existing NestJS stack, reusing the existing Pino logger for observability.

# Architecture Changes

None. `22_ANALYSIS_ENGINE_ARCHITECTURE.md` and ADR-005/006/007 were not modified by implementation (their governance-only Status transition to Approved was completed in a prior, separate governance action, before implementation began). This sprint implements exactly what ADR-005 specifies: token-based dependency injection throughout (`INDICATOR_ENGINE`, `SWING_DETECTOR`, `REGIME_CONTEXT`, following the `MARKET_DATA_PROVIDER`/ADR-003 precedent), the Anti-Corruption Layer boundary (enforced by an automated test, not convention alone), mandatory `computationVersion` on every output, and zero interpretation/Evidence/Confidence/trading language (reserved for ADR-006/S1-008).

# FACTS

- Full monorepo verification: `pnpm turbo run build lint test` — 13/13 tasks passing (7 packages: `@zenith/api`, `@zenith/database`, `@zenith/tooling`, `@zenith/types`, `@zenith/utils`, `@zenith/validation`, `@zenith/web`); `@zenith/api` ran fresh (cache miss, as expected given new source), all other packages served legitimate cache hits (their outputs are genuinely unchanged by this sprint). `@zenith/api` test suite: 193/193 tests passing (up from 109 at S1-006 close), including 84/84 tests under `analysis-engine/` across 17 suites.
- No live HTTP/database runtime verification was performed or applicable — per Scope and Non-Scope, this sprint introduces no controller, no Swagger surface, and no new Prisma model; every acceptance criterion is verifiable, and was verified, at the unit-test level against in-memory `MarketSeries` fixtures.
- Golden-dataset conformance verified for every calculator: RSI, ATR, and ADX are verified against a fully hand-traced calculation implementing Wilder's exact 1978 recursive smoothing (alpha = 1/period), with an explicit "SOURCING DISCLOSURE" comment in each spec file recording that Wilder's own published worked example could not be independently obtained in this implementation environment (no network access to the out-of-print primary text) and naming the hand-traced substitution used instead, per the Sprint Brief's disclosed-fallback allowance. MACD (Appel line / Aspray 1986 histogram, attributed separately in metadata) and Bollinger Bands (population standard deviation) are verified against hand-traced known-reference examples, the Brief's stated standard for those two. SMA, EMA, the Fibonacci ratio calculator (0.5 level explicitly flagged `isTrueFibonacciRatio: false`), and the Donchian Channel calculator are verified against hand-computed expected values.
- Every Indicator Engine, Swing Detector, and Regime/Context Service output was verified (not assumed) to carry full computation metadata (`parameters`, `formula`, `source`, `inputRange`, `computedAt`, `computationVersion`) and — the architecture's explicit Data Quality propagation requirement — a `dataQuality` field (`completeness`/`missingDateCount`) inherited from the source `MarketSeries`, on every code path, not just the happy path.
- Point-in-time determinism for Swing Detection was verified by a test that runs the detector against a truncated bar series and confirms a swing not yet confirmable under the disclosed `sensitivity` does not appear, then confirms it appears once the series is extended — and that a swing already confirmed under the truncated series is never reclassified once more bars are appended.
- The Anti-Corruption Layer boundary is enforced by an automated test (`anti-corruption-boundary.spec.ts`) that scans every `.ts` source file under `analysis-engine/` outside `market-series/` for literal `Candle`/`MarketQuote` word-boundary references, including in comments — not just import statements — and fails the build if any are found. This test caught two genuine wording issues during development (a code comment and a JSDoc block that mentioned `` `Candle` `` by name), both reworded without weakening the test.
- Shared caching was verified functioning for all three orchestrating services: an identical repeated call returns the literal same object (`toBe`, not `toEqual`) without recomputing (confirmed via mock call-count assertions on the underlying calculator/indicator-engine/swing-detector dependencies); differing parameters correctly bypass the cache.
- Per-computation latency and computation-rejection-rate observability were verified present via `ObservabilityService`'s `measure()` wrapper around every public method; a rejection (e.g. insufficient bars for a given period/sensitivity) is verified to throw the typed `ComputationRejectedError`, distinct from an unhandled exception.
- Full regression confirmed: all 109 pre-existing tests (S1-001 through S1-006) continue to pass unchanged alongside the 84 new tests.

# INFERENCES

- None beyond what was already recorded in prior completion reports.

# ASSUMPTIONS

None. The two Anti-Corruption Layer boundary-test wording issues were genuinely found and fixed, not assumed compliant; the golden-dataset sourcing substitution (hand-traced verification in place of Wilder's own worked example) is disclosed explicitly, per the Sprint Brief's own disclosed-fallback allowance, rather than silently presented as the primary source's own example.

# Issues Found

Two categories of issue were found and fixed during the Phase 4 sprint audit, both self-discovered (no external bug report) and both squarely within S1-007's own scope:

1. **Data Quality propagation gap.** The architecture's explicit requirement — "Indicator Engine output inherits the freshness of the candles/quotes it consumed" — was implemented for `MarketSeries` itself (S1-007 WP2) but had not yet been wired through to the Indicator Engine, Swing Detector, and Regime/Context Service outputs by the end of initial implementation (WP3–WP5). Found during the Phase 4 audit's deliberate re-check against every architecture requirement, not by a failing test (no test yet existed for it). Fixed by adding a shared `withDataQuality()` helper (`computation-metadata.util.ts`) and refactoring all three services' public signatures from `(instrument, points, params)` to `(series: MarketSeries, params)`, applying `withDataQuality(result, series.missingDates.length)` before caching/returning in each. New tests were added to all three services' spec files asserting `dataQuality` is present and correct on both a complete and a gapped series.
2. **Stale-cache bug in the fix for (1), found by the new tests themselves.** After wiring in Data Quality propagation, all three new tests failed: results showed `COMPLETE`/`missingDateCount: 0` even when the input series had gaps. Root cause: none of the three services' cache keys included `series.missingDates` — two `MarketSeries` objects with identical `assetId`/points/date-range but different `missingDates` arrays (e.g. before and after a candle backfill) collided on the same cache key, so the second, differently-shaped call silently received the first call's stale cached result. This is a genuine, realistic defect (candle backfill is an expected operational event per `MarketDataService`'s own S1-005 design), not test artificiality. Fixed by adding `missingDateCount: series.missingDates.length` into the `dataRange` object passed to `cache.buildKey(...)` in `indicator-engine.service.ts`, `swing-detection.service.ts`, and `regime-context.service.ts`. Re-run confirmed all previously-failing tests, and the full 84-test `analysis-engine` suite, passing.

All other audit categories — dependency rules (zero new dependencies, confirmed by `git diff`), determinism, coding standards, Anti-Corruption Layer correctness, `computationVersion` presence, and full regression — were confirmed clean on first check.

# Manual Actions Required

None. This sprint introduces no HTTP endpoint, no environment variable, and no database migration — it depends only on the already-running `MarketDataModule`.

# Awaiting Architecture Team Instructions

None — implementation, the Phase 4 sprint audit, and full verification are complete. This report documents that outcome for Architecture Review, per the Sprint Brief's Definition of Done.

# Executive Summary

S1-007 delivers the Analysis Engine's shared computational substrate: a `MarketSeries` Anti-Corruption Layer, a nine-calculator Indicator Engine, a Swing Detection Infrastructure, and a Regime/Context Service — every one of them pure, deterministic, source-faithful, and carrying full computation metadata and a `computationVersion`, exactly as ADR-005 specifies and exactly as every future Analysis Provider (S1-008 onward) will depend on without needing to reimplement or second-guess it. No trader-visible output, HTTP endpoint, new Prisma model, or new dependency was introduced, matching this sprint's deliberately internal, foundation-only scope. The Phase 4 sprint audit — conducted as a genuine adversarial re-check against every architecture requirement rather than a formality — found and fixed one real gap (Data Quality propagation not yet wired through the three orchestrating services) and, in fixing it, surfaced and fixed one further genuine defect (a cache key that ignored `missingDates`, which would have served stale Data Quality results across a candle backfill in production). Both are now covered by regression tests. 193/193 tests pass monorepo-wide, including 84/84 for the new module, with zero regression against S1-001–S1-006. `computationVersion` numbering, golden-dataset sourcing disclosure, and the deliberate non-defaulting of Swing Detection/Regime Context calibration parameters are recorded in DEC-2026-011. S1-007 is ready for Architecture Team review and, upon that review, for S1-008 (the Analysis Provider Framework) to begin.

# Related Documents

- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md`
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-011)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-005)
- `documentation/ai/S1-006_COMPLETION_REPORT.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
