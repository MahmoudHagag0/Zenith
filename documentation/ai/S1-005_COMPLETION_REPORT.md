# S1-005_COMPLETION_REPORT

**Document ID:** AI-018
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Structured completion report for Sprint S1-005 — Market Data Foundation, prepared per `10_AI_ENGINEER_GUIDE.md`'s required report structure and `07_ENGINEERING_WORKFLOW.md`, following the same pattern as `S1-004_COMPLETION_REPORT.md` (AI-017).

# Sprint ID

S1-005 — Market Data Foundation

# Status

Complete and independently verified.

# Objectives Completed

Per `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md` Scope (items 1–17): a `MarketDataProvider` interface with the only registered implementation being a deterministic `SimulatedMarketDataProvider` (ADR-003/DEC-2026-006, explicitly not real market data); `MarketQuote`/`Candle` Prisma models with a migration; symbol search and asset lookup against the existing S1-003 catalog; a current-quote endpoint with a TTL-based cache; a historical daily-candle endpoint with a permanent, gap-aware cache; both caches implemented entirely in PostgreSQL (DEC-2026-008, no new infrastructure); a `@nestjs/schedule`-based background sync job refreshing only trader-tracked assets (ADR-004/DEC-2026-007); a sliding-window rate limiter and an exponential-backoff retry wrapper around every provider call; a live provider-health endpoint; Zod validation for search/candle-range queries; JWT-authenticated (no ownership scoping needed — shared reference data) endpoints; full Swagger documentation; and unit + integration-style test coverage across all of the above.

# Files Created

`apps/api/src/market-data/providers/{market-data-provider.interface.ts,provider-errors.ts,simulated-market-data.provider.ts,simulated-market-data.provider.spec.ts}`; `apps/api/src/market-data/{rate-limiter.service.ts,rate-limiter.service.spec.ts,retry.util.ts,retry.util.spec.ts,market-data.service.ts,market-data.service.spec.ts,market-data.controller.ts,market-data-sync.service.ts,market-data-sync.service.spec.ts,market-data.module.ts}`; `packages/database/prisma/migrations/20260712142210_add_market_data_foundation/`; `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md`.

# Files Modified

`packages/database/prisma/schema.prisma` (added `MarketQuote`, `Candle` models and inverse relations on `Asset`); `packages/validation/src/index.ts` (added `searchAssetsQuerySchema`, `candlesQuerySchema`); `apps/api/src/app.module.ts` (registered `ScheduleModule.forRoot()` and `MarketDataModule`); `apps/api/src/main.ts` (updated Swagger description); `apps/api/package.json` (added `@nestjs/schedule`); `documentation/zos/12_ADR_INDEX.md` (added ADR-003, ADR-004); `documentation/zos/11_DECISION_LOG.md` (added DEC-2026-006, DEC-2026-007, DEC-2026-008).

# Dependencies Added

`@nestjs/schedule` (^4.1.2) — the official NestJS scheduling module, per ADR-004/DEC-2026-007; reviewed under `14_DEPENDENCY_POLICY.md` at implementation time (official, actively maintained, no license concern, no overlapping existing dependency). No other new dependency — the market-data provider is fully in-process and simulated; no external network client was introduced.

# Architecture Changes

Two new ADRs were created, each recording a genuinely new architectural mechanism: **ADR-003** (market-data provider abstraction, with the only implementation shipped being a clearly-labeled simulated provider, since no real vendor has been reviewed or approved) and **ADR-004** (background job scheduling via `@nestjs/schedule`). Both were required — unlike S1-003/S1-004's decisions, these introduce capabilities (an external-data abstraction layer, scheduled background execution) that did not exist in the platform before this sprint, per `12_ADR_INDEX.md`'s Governance rule that every architectural decision requires an ADR.

# FACTS

- Full clean-room verification was performed twice, with cache forcibly bypassed both times (not cache replay): `rm -rf node_modules` (all workspaces, plus build outputs) → `pnpm install --frozen-lockfile` → `pnpm turbo run build lint test --force`, both times 13/13 tasks passing. Test count grew from 62 (pre-sprint) to 91 as the sprint's own tests were added and the bug-fix test was added; both full clean-room passes after the fix show 91/91 passing.
- Live runtime verification was performed against a real local PostgreSQL instance:
  - **Cache behavior verified live, not just unit-tested:** an identical quote request repeated immediately returned the same cached row (`fetchedAt` unchanged) with no provider call; a candle request for a date range with any missing day triggered exactly one provider call and persisted exactly the expected number of rows (verified directly against PostgreSQL row counts); a repeat request for the same fully-cached range returned identical `createdAt` timestamps, confirming no re-fetch.
  - **Concurrency verified with real concurrent HTTP requests:** 10 truly concurrent quote requests for the same brand-new (never-cached) asset produced exactly one `MarketQuote` row, no crash, no duplicate; 10 truly concurrent candle requests for the same never-cached range produced exactly the expected row count, no crash, no duplicate.
  - **Validation verified live:** invalid UUID/non-existent asset (404), inverted date range (400), malformed date (400), missing required query parameter (400), a >5-year date range (400), an empty search query (400) — all clean, never a raw 500.
  - **Regression verified across S1-001 through S1-004:** health check, unauthenticated-401, duplicate-email rejection, catalog read, watchlist ownership enforcement, and portfolio/position reads all continue to pass unchanged.
  - **SQL-injection safety verified live:** an injection-style search query and an injection-style asset-ID path parameter were both handled safely via Prisma's parameterized queries — the `Asset` and `MarketQuote` tables were confirmed unaffected by direct row-count checks before and after.
  - All 5 new endpoint groups are present and correctly tagged in the live Swagger document.
  - The background sync job's tracked-asset query (union of watchlist, favourite, and open-position asset IDs) was confirmed to return the exact expected set against live production data; `@nestjs/schedule`'s `ScheduleModule` was confirmed to initialize cleanly at boot with no errors.
- **One real bug was found and fixed during active adversarial review, not assumed absent:** firing 25 concurrent quote requests for 25 distinct never-cached assets (deliberately exceeding the rate limiter's 20-requests-per-second threshold) caused 5 of the 25 requests to return a raw, unhandled `500 Internal Server Error` instead of a clean error. Root cause: `MarketDataService.callProvider()`'s retry wrapper (`withRetry`) correctly retried the rate-limit condition up to its configured limit, but once retries were exhausted, the raw `ProviderRateLimitedError` (a plain `Error` subclass, not an `HttpException`) propagated uncaught out of the service and controller, and NestJS's default exception handling converted it into an opaque `500` — a real defect that would have surfaced as a confusing, undocumented failure mode to any real client under genuine load, despite the retry logic itself working correctly and being fully covered by passing unit tests (which exercised the retry-then-succeed path, not the retry-exhaustion path). Found by deliberately constructing a burst of requests large enough to exhaust the retry budget against a live server, not by re-running unit tests. Fixed by wrapping `callProvider()`'s call to `withRetry` in a try/catch that converts an exhausted `ProviderRateLimitedError` into a clean `429 Too Many Requests` and an exhausted `ProviderUnavailableError` into a clean `503 Service Unavailable`. Verified fixed by re-running the full clean-room build/lint/test cycle (still 13/13, tests now 91/91 including two new regression tests for this exact scenario) and by reproducing the original 25-concurrent-request burst against the live server twice more: zero raw `500`s in either re-run, with the previously-`500` requests now correctly returning `429`.

# INFERENCES

- None beyond what was already recorded in prior completion reports regarding official, already-reviewed NestJS modules (`@nestjs/schedule`) being a low-risk dependency addition.

# ASSUMPTIONS

None. The decision to ship a simulated provider (rather than assume access to any specific real vendor) is the explicit, documented alternative to making an unapproved assumption — see ADR-003.

# Issues Found

Documented in FACTS above: the rate-limit/provider-unavailable retry-exhaustion defect (found, fixed, and re-verified live under the exact burst conditions that exposed it). All other adversarial categories — malformed requests, concurrency, cache consistency, SQL injection, authorization, and regression — were tested and confirmed clean on the first pass.

# Manual Actions Required

None beyond what prior sprints already require (an engineer's own `apps/api/.env` and a running PostgreSQL instance). No manual data seeding was required — the simulated provider generates data deterministically on demand.

# Awaiting Architecture Team Instructions

None — implementation, hardening, and full verification are complete. This report documents that outcome for Architecture Review.

# Executive Summary

S1-005's Market Data Foundation is complete: a provider-agnostic pipeline now exists for symbol search, asset lookup, current quotes, and historical daily candles, cached entirely in PostgreSQL (TTL for quotes, permanent for candles), resilient to transient failure via a rate limiter and exponential-backoff retry, and kept fresh for trader-tracked assets via a background `@nestjs/schedule` job. Per ADR-003, every quote and candle returned by this sprint is simulated, not real market data — no external vendor has been reviewed or approved, and this is stated transparently in the ADR, the Sprint Brief, this report, and the code itself, so no future reader mistakes this foundation for a real price feed. A real adversarial-testing pass — deliberately exceeding the rate limiter under genuine concurrent load — found and fixed a defect that would have surfaced as an opaque `500` to real clients under load; the fix was verified by reproducing the exact failing condition twice more with a clean result. No unauthorized scope was introduced (AI, portfolio analytics, recommendations, notifications, chart rendering, broker integration, and trade execution all remain untouched, per Non-Scope); the two new architectural mechanisms this sprint required are each recorded in their own ADR; no secrets were committed. S1-001 through S1-004 functionality continues to pass without regression.

# Related Documents

- `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-003, ADR-004)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-006, DEC-2026-007, DEC-2026-008)
- `documentation/ai/S1-004_COMPLETION_REPORT.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
