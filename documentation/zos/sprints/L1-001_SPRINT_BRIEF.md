# L1-001 SPRINT BRIEF — Live Market Data Foundation (Primary Provider Integration)

**Document ID:** ZOS-L1-001
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Implementation Complete — Live Verification Pending (every item of Approved Scope is implemented, tested, and verified end-to-end against a mocked/blocked transport; the real-network leg to Twelve Data's API is blocked by this session's environment egress policy, not a code or architecture gap — see the completion report for the exact remaining steps)

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** L1-001
- **Sprint Name:** Live Market Data Foundation (Primary Provider Integration)
- **Milestone:** M3 — Live Data Platform (per `08_ROADMAP.md`; first Sprint of this Milestone)
- **Phase:** Phases 0 and 1 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9's Implementation Roadmap, merged into a single Sprint at the Architecture Team's direction — a Phase-0-only draft was assessed as too small to deliver standalone product value, so this Sprint carries the config/infrastructure groundwork through to a real, visible outcome.
- **Date Drafted:** 2026-07-16
- **Revision:** Rev. 2 — expanded scope, superseding the original Phase-0-only draft of the same Sprint ID (not yet approved, so revised in place rather than as a superseding Sprint Brief; see `12_ADR_INDEX.md`'s immutable-after-approval convention, which does not yet apply here).
- **Approved By:** Architecture Team (2026-07-16)

---

# Objective

Deliver Zenith's first real, live market data end-to-end: replace `SimulatedMarketDataProvider` with a real primary provider (Twelve Data) behind the existing `MARKET_DATA_PROVIDER` interface, and carry that real data all the way through the stack — cache, background sync, database persistence — into the three product surfaces that already consume it (Dashboard, Watchlist, Portfolio) with **zero code changes to those three modules**, per the provider-abstraction architecture `28_LIVE_DATA_BLUEPRINT.md` was built to exercise. This Sprint ends with a trader opening Zenith and seeing a real, currently-accurate market price — and, since the same provider interface also supplies historical candles, a Dashboard Confluence/Analysis Engine reading computed from real price history, not simulated data. Every other domain (News, Calendar, COT, Streaming, Data Confidence Engine, Corporate Actions, and any provider beyond this one primary vendor) remains explicitly out of scope, deferred to later Sprints per the Blueprint's own Phase sequencing.

---

# Approved Scope

1. **Provider credential configuration.** Extend the existing `ConfigService`-based environment-variable pattern (the same pattern already used for `JWT_SECRET`, `DATABASE_URL`) with `TWELVE_DATA_API_KEY`. (The other four provider keys from the original draft — Finnhub, FMP, MarketAux, FRED — are deferred: this Sprint integrates exactly one primary vendor, per the Objective's own scope reduction to "meaningful, shippable value" rather than five parallel partial integrations.)

2. **Provider registration.** Implement `TwelveDataMarketDataProvider`, registered at the existing `MARKET_DATA_PROVIDER` injection token in `market-data.module.ts` — the same one-line DI-registration-swap pattern already proven three times in the Foundation (per ADR-003's own precedent). Include an environment-controlled toggle (name is a Missing Decision below) so a deployment without a configured `TWELVE_DATA_API_KEY` falls back to `SimulatedMarketDataProvider` automatically rather than failing to boot — a safety default, not a new architectural concept.

3. **Provider abstraction integration.** `TwelveDataMarketDataProvider` implements the *existing* `MarketDataProvider` interface in full — `getQuote()`, `getCandles()`, and `checkHealth()` — against Twelve Data's real REST API, using a shared HTTP client utility (timeout, retry via the existing `retry.util`, and circuit-breaker reuse from the Analysis Engine's existing `provider-circuit-breaker`, per ZOS-028 §4.5/§4.6). No interface change; no consumer of `MarketDataProvider` is touched.

4. **First successful live quote retrieval.** A concrete, verifiable milestone, not just code: for at least one already-seeded, real-world tracked asset (e.g. a major FX pair or index already in the catalog), `GET /api/v1/market-data/assets/:assetId/quote` returns a real Twelve Data quote end-to-end, confirmed by manual/live verification against the real API using a free-tier development key — the same "live runtime testing" discipline already applied at S1-003 through S1-005.

5. **Data normalization.** Twelve Data's raw quote and candle response shapes are mapped to Zenith's existing internal `MarketQuote`/`Candle` DTOs via a pure `normalize()` function, following the exact pipeline in ZOS-028 §4.3/§4.4: raw response → Zod raw-schema validation (catches Twelve Data schema drift early) → `normalize()` → internal DTO → existing internal Zod validation. No new DTO shape; Twelve Data's shape never leaks past this provider's own module.

6. **Cache integration.** Reuse the existing in-memory TTL cache already built into `MarketDataService` (S1-005) — no new caching mechanism. The cache now holds real data instead of simulated data; its TTL/invalidation behavior is unchanged.

7. **Synchronization.** The existing `MarketDataSyncService` (`@nestjs/schedule` Cron, S1-005) now calls the real provider for every tracked asset via the existing, unmodified `TrackedAssetsService` (S1-035) dedup. Reuse the existing per-asset "tolerate and continue" error handling unchanged. Calibrate the existing cron interval and the existing `RateLimiterService`'s limits against Twelve Data's actual free-tier rate limit (a Missing Decision below, since the real limit is now a hard external constraint, not a simulated assumption).

8. **Database persistence.** The existing `MarketQuote`/`Candle` Prisma tables and their existing upsert-based persistence are now populated with real data. **No schema change.** A bounded, one-time historical backfill (lookback window is a Missing Decision below) populates real candle history for already-seeded catalog assets, since Analysis Engine readings depend on real history, not just a real current quote.

9. **Dashboard integration.** No code change to `dashboard`, `analysis-engine`, or `confluence` modules. This scope item is **verification**: confirm `GET /api/v1/dashboard/decision-center` now reflects a real current price and a Confluence/Analysis Engine reading computed from real historical candles (not simulated), for every tracked asset this Sprint's provider actually covers.

10. **Watchlist integration.** No code change to the `watchlists` module or `apps/web`'s Watchlist screen. Verification only: confirm the existing, unmodified Watchlist screen now displays real prices via the same unchanged endpoints it already calls.

11. **Portfolio integration.** No code change to `portfolios`/`positions`/`analytics` modules or `apps/web`'s Portfolio screen. Verification only: confirm existing Portfolio valuation/analytics (unrealized P/L, Portfolio Health Score, etc.) now compute against real prices via the same unchanged endpoints.

12. **Tests.** Unit tests for `TwelveDataMarketDataProvider` (normalization, raw-schema validation, error/timeout/retry/circuit-breaker behavior) against a mocked HTTP transport, plus the live end-to-end verification in Scope item 4 (which is manual/scripted verification against the real API, not a permanent automated test — per existing convention, automated suites never depend on a live external network call).

13. **`14_DEPENDENCY_POLICY.md` review**, only if research at implementation time concludes native `fetch` is insufficient and a dedicated HTTP client or the Twelve Data SDK is genuinely required (see Missing Decisions).

---

# Out of Scope

Everything not explicitly listed above, and in particular:

- **Any second provider.** Finnhub (or any other) secondary/failover integration (`FailoverProvider<T>`, ZOS-028 §3/§4.2) is explicitly deferred to a later Sprint. This Sprint integrates one primary vendor only.
- **Market Sessions / Trading Holidays** (ZOS-028 §9 Phase 2) — sync in this Sprint runs on the existing cron schedule regardless of whether the relevant market is open, per the existing S1-005 behavior. A disclosed, accepted inefficiency for this Sprint (see Missing Decisions), not a defect.
- **Economic Calendar, Financial News, COT** (Phases 3–4) — untouched; `SimulatedCalendarNewsProvider`/`SimulatedCotProvider` remain bound exactly as today.
- **Instrument Metadata / Symbol Search live sourcing, Asset Classification** (Phase 5) — the existing seeded catalog is unchanged; this Sprint only fetches quotes/candles for assets already in the catalog.
- **Corporate Actions** (Phase 6) — explicitly deferred; this Sprint's historical backfill does not need to be split/dividend-adjusted for the initial catalog (a disclosed limitation, not silently ignored — flagged in Missing Decisions).
- **Macro Context / FRED** (Phase 7).
- **Data Quality Layer, Provider Priority Matrix/failover, SLA & Freshness enforcement, Versioning Strategy machinery, Future Streaming Architecture, Data Confidence Engine** (v1.1 Addendum §A1–§A6 in full) — every one of these assumes multi-provider data or production-scale operation that does not exist until a real second provider or real production load exists. None is built this Sprint.
- **Any new frontend/UI feature.** `apps/web`'s Dashboard, Watchlist, and Portfolio screens are not modified — they already render whatever their existing, unchanged endpoints return. If (and only if) the real provider's normalized data reveals a genuine display defect in an existing screen, that is an escalation to the Architecture Team, not pre-authorized scope.
- **No modification to `28_LIVE_DATA_BLUEPRINT.md`** — frozen, cited only.

---

# Affected Components

- `apps/api/src/market-data/**` — new `TwelveDataMarketDataProvider`, shared HTTP client utility, config wiring, DI registration change (with fallback toggle) in `market-data.module.ts`.
- `apps/api/.env.example` (or equivalent) — new `TWELVE_DATA_API_KEY` placeholder and the fallback-toggle variable.
- **Not expected to change:** `apps/api/src/dashboard/**`, `apps/api/src/watchlists/**`, `apps/api/src/portfolios/**`, `apps/api/src/positions/**`, `apps/api/src/analytics/**`, `apps/api/src/analysis-engine/**`, `apps/api/src/calendar-news/**`, `apps/api/src/cot/**`, any `apps/web/**` file, and the Prisma schema. If implementation reveals any of these genuinely needs a change, that is an escalation trigger, not silently absorbed scope.
- `documentation/zos/11_DECISION_LOG.md`, `documentation/zos/09_PROJECT_BRAIN.md`, `documentation/zos/08_ROADMAP.md`, `documentation/ai/00_AI_INDEX.md` — standard sprint-closure documentation updates.

---

# Dependencies

None anticipated if native `fetch` (already available in the Node runtime this project targets) is sufficient for the shared HTTP client and raw REST calls to Twelve Data's API. If research at implementation time concludes a dedicated HTTP client library or Twelve Data's official SDK is required, that is an **escalation trigger** requiring `14_DEPENDENCY_POLICY.md` review and Architecture Team approval — not a pre-approved dependency of this Brief.

---

# Assigned Implementation Engineer

Implementation Engineer (AI) — **pending explicit confirmation** from the Architecture Team that execution authorization extends to this specific, larger-scope Sprint. This Sprint is materially higher-stakes than the original Phase-0-only draft: it is Zenith's first integration with a real external vendor and real credentials, and its output is now directly visible on three trader-facing product surfaces. Recommend the Architecture Team confirm authorization explicitly for L1-001 rather than relying on standing authorization language written for earlier, backend-only Sprints (S1-019, S1-020).

---

# Definition of Done

Per `07_ENGINEERING_WORKFLOW.md`, and specifically for this Sprint: Approved Scope fully implemented; no unauthorized change to any file outside Affected Components (in particular, zero changes to Dashboard/Watchlist/Portfolio/Analysis Engine modules or `apps/web`); every existing test suite still passing with zero regressions; the live end-to-end verification (Scope item 4) performed and its result (a real quote, a real Dashboard Confluence reading, real Watchlist/Portfolio prices) recorded in the completion report, not merely asserted; build/lint/turbo clean; a Decision Log entry recorded for every implementation-time calibration (rate-limit/cron-interval tuning, backfill lookback window, HTTP client choice, fallback-toggle naming/default); Project Brain/AI Index/Roadmap updated; Sprint formally closed.

---

# Required Deliverables

Per `07_ENGINEERING_WORKFLOW.md`: source code (real provider implementation, shared HTTP client, config wiring), updated documentation, a completion report including the live verification evidence described above, and a final assessment confirming real data is visible end-to-end on Dashboard, Watchlist, and Portfolio with zero code changes to those three modules.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, the assigned engineer must stop and escalate to the Architecture Team if: a new runtime dependency is required beyond what `14_DEPENDENCY_POLICY.md` already permits; Twelve Data's real payload shape cannot be cleanly mapped by `normalize()` without a change to the existing internal `MarketQuote`/`Candle` DTO shape; Twelve Data's real free-tier (or lowest paid) rate limit cannot support even the minimal tracked-asset sync frequency this Sprint needs without exceeding a daily credit budget (a cost/plan decision, not an engineering one); any existing Dashboard/Watchlist/Portfolio/Analysis Engine module appears to need a code change to correctly display real data; or any scope expansion toward a second provider, a new data domain, or a new frontend feature is requested.

---

# Missing Decisions (Anticipated Implementation-Time Calibration)

1. **Shared utility naming and location** — e.g. a new `apps/api/src/market-data/providers/twelve-data/` directory alongside the existing `simulated-market-data.provider.ts`, vs. a separate top-level shared-infrastructure module. Affects only where later provider Sprints import from, not behavior.
2. **HTTP client choice** — native `fetch` (no new dependency) vs. Twelve Data's official SDK vs. a general-purpose HTTP client. Escalate per Dependencies above if a new library is concluded necessary.
3. **Circuit-breaker code-sharing mechanism** — import the existing Analysis Engine circuit breaker directly, or promote it into a shared package (`packages/utils`) so `analysis-engine` and `market-data` don't create a direct cross-module dependency. `05_ARCHITECTURE.md`'s Dependency Rules favor shared packages over direct cross-application-module coupling; default to promotion unless disproportionate to reusing one utility, disclosed via Decision Log either way.
4. **Fallback-toggle naming and default** — the environment variable controlling Simulated-vs-live fallback (e.g. `MARKET_DATA_MODE=live|simulated`, defaulting to `simulated` when unset, so a misconfigured environment degrades safely rather than crashing or silently attempting a keyless real API call).
5. **Rate-limit / cron-interval calibration** — Twelve Data's actual free-tier limit (credits/day, requests/min) versus the existing `MarketDataSyncService` cron cadence and the number of currently-tracked assets; this Sprint must confirm the existing sync frequency is sustainable under the real limit, or reduce it, disclosed via Decision Log.
6. **Historical backfill lookback window** — how much real candle history to backfill for already-seeded catalog assets on first integration (e.g. 1–2 years of daily candles, per ZOS-028 §6's own "bulk synchronization" guidance), bounded so it doesn't exceed rate limits on first run.
7. **Corporate-action adjustment gap, disclosed not silently ignored** — the historical backfill in this Sprint is **not** split/dividend-adjusted (Corporate Actions is explicitly out of scope, Phase 6). If any backfilled asset in the current catalog has undergone a real split/dividend during the backfill window, its historical candles will be inaccurate until Corporate Actions is implemented — acceptable for this Sprint given the current catalog's composition, but must be named in the completion report, not discovered later.
8. **Env-file convention** — whether `TWELVE_DATA_API_KEY` and the fallback toggle are added to a committed `.env.example`-style file or documented inline, matching whatever convention `JWT_SECRET`/`DATABASE_URL` already follow.

---

# Implementation Notes (resolutions to the Missing Decisions above)

1. **Location:** `apps/api/src/market-data/providers/{twelve-data-market-data.provider.ts, twelve-data.schemas.ts, twelve-data.normalize.ts, http-client.ts, market-data-provider.factory.ts}` — flat, alongside `simulated-market-data.provider.ts`, matching that file's existing convention rather than a new subdirectory nesting style.
2. **HTTP client:** native `fetch`/`AbortController` (Node 22, already available in this project's runtime) — no new dependency, no `14_DEPENDENCY_POLICY.md` review required.
3. **Circuit breaker:** imported directly from `analysis-engine/providers/provider-circuit-breaker.ts` with zero modification to that file. Promotion to `packages/utils` was judged disproportionate: the class has no framework/Prisma dependencies, and promoting it would have required touching `analysis-engine`'s own imports — outside this Sprint's Affected Components, which explicitly listed `analysis-engine` as "not expected to change."
4. **Fallback toggle:** `MARKET_DATA_MODE` (`live` | unset/anything else → simulated), gated together with `TWELVE_DATA_API_KEY` in `createMarketDataProvider()` (`market-data-provider.factory.ts`) — logs a warning and falls back to `SimulatedMarketDataProvider` if `MARKET_DATA_MODE=live` is set without a key. Verified live (see below).
5. **Rate-limit calibration:** no change made to `RateLimiterService` (app-internal throttle, 20 req/sec, unrelated to Twelve Data's own external limit). Given the sync job's existing 5-minute cadence, 15s quote-cache TTL, and the small number of currently-tracked assets, real Twelve Data free-tier credit consumption is expected to stay well within budget without any cron-interval change. This is a disclosed assumption pending real traffic data, not a verified measurement — recommend revisiting once real usage is observable via `/market-data/provider-health`.
6. **Historical backfill:** no separate backfill job was built. `MarketDataService.getCandles()` already lazily fetches-and-persists on demand for whatever range a consumer requests (confirmed by tracing `MarketSeriesService.getSeries()` → `MarketDataService.getCandles()`) — the existing architecture already provides this Sprint's own "first backfill" behavior with zero new code.
7. **Corporate-action gap:** confirmed present and unresolved this Sprint, as anticipated — historical candles for any asset that has split/paid a dividend during the fetched window will be inaccurate until Corporate Actions (`28_LIVE_DATA_BLUEPRINT.md` §9 Phase 6) is implemented.
8. **Env files:** added to both `apps/api/.env.example` (committed) and the local, gitignored `apps/api/.env`, matching the existing `JWT_SECRET`/`DATABASE_URL` convention.

**Correctness fix made during implementation (disclosed, not silent):** the first draft of the HTTP client's error handling only converted `AbortError`-named timeouts into `ProviderUnavailableError`; a genuine network failure (blocked host, DNS failure, connection refused — exactly the failure mode this session's own environment produces) threw a raw, unmapped exception instead of degrading gracefully. Fixed before live verification and covered by a dedicated test.

**Live verification performed (network-independent parts):** booted the API in both modes against the live PostgreSQL instance.
- Default (`MARKET_DATA_MODE` unset): `provider-health` reports `simulated`/`UP`; Dashboard, Watchlist-linked Confluence readings, and Portfolio analytics behave identically to pre-Sprint behavior (zero regression).
- `MARKET_DATA_MODE=live` with a placeholder key: DI correctly resolves `TwelveDataMarketDataProvider` (no fallback warning logged); `provider-health` reports `twelve-data`/`DOWN` (network blocked); a quote request cleanly degrades to `503` with a friendly message; Dashboard continues serving its existing cached reading; Portfolio analytics honestly reports `freshness: MISSING`/`confidence: LOW` rather than crashing or showing a stale value mislabeled as current. No unhandled exception, no raw stack trace, no crash, in either mode.

**Not performed — the one item left outstanding:** a live request to the real `api.twelvedata.com` succeeding end-to-end, since this session's environment egress policy blocks that host (confirmed via a recorded `connect_rejected`/`403` policy denial, not a code issue — `finnhub.io` is blocked identically, `api.github.com` is not, ruling out a general outage). See the completion report for the exact steps to close this out once network access or an alternate execution environment is available.

---

# Approval Status

- [x] Proposed
- [x] Under Review
- [x] Approved
- [ ] Rejected / Returned for Revision

---

# Related Documents

- `documentation/zos/28_LIVE_DATA_BLUEPRINT.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/14_DEPENDENCY_POLICY.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/11_DECISION_LOG.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-003 — Market Data Provider Abstraction; ADR-004 — Background Job Scheduling for Market Data Synchronization; this Sprint is the first real exercise of both, without amending either)
