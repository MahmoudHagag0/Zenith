# S1-005 SPRINT BRIEF — Market Data Foundation

**Document ID:** ZOS-S1-005
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-005
- **Sprint Name:** Market Data Foundation
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`), fourth increment (Trading domain, continued)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team (2026-07-12 — see Approval Section)

---

# Sprint Objective

S1-004 gave Zenith an accurate record of what a trader owns and at what cost. That record is inert without prices: a trader cannot judge a position's performance, and no future AI capability can reason about risk or opportunity, without knowing what an asset is currently worth and how it has moved. This sprint is not about fetching prices for their own sake — it is about building the reliable, provider-agnostic pipeline that gets a price from *somewhere* to every future trader-facing capability, correctly cached, resilient to failure, and never hard-wired to one vendor.

**Why this matters to traders:** every question a trader actually asks — "what is this worth right now?", "how has it moved?", "is my position up or down?" — depends on this sprint existing. Without it, "market data" is a phrase in a roadmap, not something the platform can answer.

**What value it unlocks:** once quotes and historical candles exist as real, cached, resilient data behind a stable API, S1-004's positions gain the missing ingredient for unrealized P/L, future performance analytics get real price history to compute against, and any future AI capability has real (even if today simulated) time-series data to reason over instead of nothing at all.

**Why remaining trading capabilities are intentionally deferred:** AI analysis, portfolio analytics, recommendations, notifications, chart rendering, broker integration, and trade execution all consume market data — none of them can be correctly built until market data reliably exists. This sprint deliberately stops at the data pipeline itself: it does not decide how unrealized P/L is displayed, how performance is analyzed, or how AI reasons over price history. Each of those is its own future decision.

**A transparent, load-bearing caveat:** no external market-data vendor (paid or free) has been reviewed or approved by the Architecture Team, and Constitution Rule 1 forbids introducing one silently. Per ADR-003, this sprint therefore ships a **simulated** market-data provider — deterministic, clearly labeled, not real prices — behind a `MarketDataProvider` interface that the rest of the system depends on exclusively. Every quote and candle this sprint returns is simulated data, not a real market price, until a future ADR selects and integrates a real vendor. This is stated here, in the completion report, and in code, without exception — no future reader of this Brief should mistake this sprint's data for real market prices.

The chain this sprint enables: **trading catalog (S1-003) → owned positions with cost basis (S1-004) → resilient, cached, provider-agnostic price data (S1-005) → unrealized P/L → performance & risk analysis → AI-assisted guidance.** This sprint introduces two new architectural mechanisms, each recorded in its own ADR: the provider abstraction (ADR-003) and background job scheduling (ADR-004). It introduces no other new architecture.

---

# Scope

Per the Architecture Team's directive, S1-005 is scoped to the market-data foundation only:

1. **Provider abstraction** — a `MarketDataProvider` interface (`getQuote`, `getCandles`, `checkHealth`) that all market-data business logic depends on exclusively; no code outside `apps/api/src/market-data/providers/` may reference a concrete provider.
2. **`SimulatedMarketDataProvider`** — the only implementation registered this sprint (per ADR-003/DEC-2026-006): a deterministic (seeded by asset symbol and time bucket, not random) generator of quotes and daily candles, explicitly documented as simulated, not real market data.
3. **Prisma models** in `packages/database`: `MarketQuote` (one row per asset, the latest cached quote) and `Candle` (one row per asset per trading day, permanently cached once fetched).
4. **Database migration** applying this schema to PostgreSQL.
5. **Symbol search** — search the existing S1-003 `Asset` catalog by symbol/name substring (not a call to the provider; the provider has no symbol universe of its own — see Architecture Constraints).
6. **Asset lookup** — read a catalog asset together with its latest cached quote.
7. **Current quote endpoint** — read (and, on cache miss/staleness, refresh) the latest quote for an asset.
8. **Historical OHLC/candle endpoint** — read daily candles for an asset over a date range; if every day in the range is already cached in PostgreSQL, the provider is not called at all; if any day is missing, the full requested range is fetched from the provider and persisted (idempotently, via upsert), so a later request for the same range is fully served from the cache.
9. **Local caching layer** — implemented entirely in PostgreSQL per DEC-2026-008: quotes are TTL-refreshed, candles are cached permanently.
10. **Background synchronization** — a `@nestjs/schedule` cron job (ADR-004/DEC-2026-007) that periodically refreshes cached quotes for assets a trader actually tracks (watchlisted, favourited, or held in an open position), not the entire catalog.
11. **Rate-limit handling** — an application-level rate limiter gating calls into the provider, independent of which provider is registered.
12. **Retry strategy** — a generic backoff-retry wrapper around provider calls, distinguishing retryable failures (rate-limited, transient provider unavailability) from non-retryable ones (invalid input).
13. **Provider health monitoring** — an endpoint that live-checks the registered provider's health.
14. **Validation** — Zod schemas for search/candle-range query parameters; rejection of invalid date ranges and non-existent assets.
15. **Authorization** — every endpoint requires the existing JWT authentication (no ownership scoping needed — market data is shared reference data, not per-user data, so no `RolesGuard`/`ADMIN` gating is needed either, since this sprint exposes no mutation endpoints to clients).
16. **Swagger** — full OpenAPI documentation for all new endpoints.
17. **Tests** — unit tests for the rate limiter, retry utility, and simulated provider; integration-style tests for cache hit/miss behavior, retry-on-provider-failure, and validation/authorization boundaries.

---

# Non-Scope

Explicitly excluded from S1-005, per the Architecture Team's directive:

- **Any real external market-data vendor, paid or free** — see ADR-003. Introducing one requires its own future ADR once a vendor is actually reviewed and approved.
- **AI analysis, portfolio analytics, recommendations, notifications, chart rendering** — all depend on market data already existing; each is its own future decision.
- **Broker integration, trade execution** — unrelated to sourcing market data; separate future capabilities.
- **Unrealized P/L computation itself** — this sprint provides the price data unrealized P/L would need; computing and displaying it against S1-004's positions is a future sprint's decision, not made here.
- **Intraday or multi-timeframe candles** — only daily candles are in scope; hourly/minute-level data is a future decision if the need arises.
- **Multi-currency quotes** — all simulated prices are treated as a single, unspecified unit of account, consistent with S1-004.

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md` beyond what ADR-003/ADR-004 explicitly authorize.
- Any technology not listed in `04_TECH_STACK.md`, an existing ADR, or ADR-003/ADR-004.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the seventeen in-scope items listed above.
- Updated documentation where required.
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** a trader (and every future capability built on top of this sprint) can reliably obtain a current quote and historical daily candles for any catalog asset, cached and resilient to transient failure, with zero dependency on which provider eventually supplies real data. The technical criteria below are how that outcome is verified.
- Both new Prisma models exist with a migration applied against PostgreSQL, matching the approved schema exactly.
- No file outside `apps/api/src/market-data/providers/` references `SimulatedMarketDataProvider` directly; all other code depends only on the `MarketDataProvider` interface.
- A quote request within the cache TTL window does not call the provider a second time; a request after TTL expiry, or for a never-before-fetched asset, does.
- A candle request for a date range that is already fully cached does not call the provider; a request with any missing day within the range calls the provider once for the full requested range and persists the result idempotently.
- The rate limiter rejects calls beyond its configured threshold within a window, verified with a real burst of calls, not merely reasoned about.
- The retry wrapper recovers from a simulated transient provider failure and a simulated rate-limit rejection, verified by injecting a provider/limiter that fails deterministically on the first attempt.
- Requesting data for a non-existent asset, or an invalid date range, returns a clean `400`/`404`, never a raw `500`.
- All new endpoints require authentication; all are documented in Swagger.
- New code has test coverage: rate limiter, retry utility, simulated provider, cache hit/miss behavior, retry-on-failure, and validation/authorization boundaries.
- All S1-001, S1-002, S1-003, and S1-004 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated to reflect the sprint's closure, and the sprint has been formally closed.

---

# Dependencies

- A PostgreSQL instance for applying and verifying the new migration, per the same approach used in prior sprints.
- `@nestjs/schedule` — a new runtime dependency, reviewed under `14_DEPENDENCY_POLICY.md` at implementation time per ADR-004/DEC-2026-007 (official NestJS-maintained package; no license concern; no overlapping existing dependency).
- Reuses S1-003's `Asset` catalog (symbol search, asset lookup) and S1-001's JWT authentication — no re-decision needed for either.
- No external network dependency is introduced — the registered provider is fully in-process and simulated, per ADR-003.

---

# Risks

- **Data-authenticity risk.** A reader could mistake this sprint's simulated quotes/candles for real market data. Mitigated by explicit labeling in the ADR, this Brief, the completion report, code comments, and (recommended, non-blocking) API response metadata identifying the provider as simulated.
- **Cache-consistency risk.** Concurrent requests for the same never-before-cached asset could both miss the cache and both call the provider redundantly, or a race could corrupt the cached row. Mitigated by an idempotent upsert on the unique `(assetId)` / `(assetId, date)` keys, verified with real concurrent requests, not merely reasoned about.
- **Retry-storm risk.** A naive retry loop could amplify load during a real provider outage. Mitigated by exponential backoff with a maximum attempt count, and by the rate limiter applying independently of retry attempts.
- **Scope-creep risk.** Market data naturally invites unrealized P/L display, charts, and alerts; these are explicitly fenced off in Non-Scope and require their own future Sprint Brief.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly recognized and consciously deferred, not silently skipped:

- **Real market-data vendor selection.** Explicitly deferred to a future ADR, once a specific vendor is proposed and reviewed by the Architecture Team. This sprint's `SimulatedMarketDataProvider` is a foundation, not a placeholder for a specific already-chosen vendor.
- **Unrealized P/L display.** This sprint provides the price data; deciding how (or whether) to surface unrealized P/L against S1-004 positions is a future sprint's decision.
- **Intraday/multi-timeframe candles and multi-currency quotes.** Both intentionally deferred — see Non-Scope.

---

# Architecture Constraints

Per `05_ARCHITECTURE.md`, `04_TECH_STACK.md`, and `13_FOLDER_STRUCTURE.md`: unchanged from prior sprints except as explicitly authorized by ADR-003 and ADR-004 — Architecture First, Modular Monorepo, no new frameworks or folder structure beyond what those two ADRs authorize.

Per ADR-003: all market-data business logic (caching, rate limiting, retry, background sync, HTTP API) depends only on the `MarketDataProvider` interface, never on `SimulatedMarketDataProvider` directly, except at module-registration time. Symbol search and asset lookup are catalog queries against the existing S1-003 `Asset` model, not provider calls — the provider has no symbol universe of its own, and inventing one would fabricate data.

Per ADR-004: background synchronization uses `@nestjs/schedule` exclusively; no other scheduling mechanism is authorized.

Per ADR-001: JWT remains the sole authentication mechanism. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; all external input validated; centralized exception handling; no secrets logged.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Approved on the basis stated by the Architecture Team: scope is appropriately bounded to a provider-agnostic market-data pipeline (no AI, no analytics, no execution), the two new architectural mechanisms this sprint introduces are each recorded in their own ADR (ADR-003, ADR-004) with alternatives genuinely considered, the decision to ship a clearly-labeled simulated provider in the absence of an approved real vendor is transparent and reversible without business-logic change, the Sprint Objective aligns with Zenith's product goal (a reliable market-data foundation as the prerequisite for unrealized P/L, performance, risk, and AI capabilities), and deferred areas are intentionally sequenced, not ignored. This Sprint Brief is now valid for implementation per Constitution Rule 2.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-12
- **Completion Report:** `documentation/ai/S1-005_COMPLETION_REPORT.md` (AI-018)
- **Final Implementation Commits:** `db4a352` (implementation)
- **Related ADR:** ADR-003, ADR-004
- **Related Decisions:** DEC-2026-006, DEC-2026-007, DEC-2026-008

This Sprint Status is distinct from the Approval Status in the Approval Section above, which records approval of this Brief for implementation and remains unchanged as the historical record of that event.

---

# Related Documents

- `documentation/zos/sprints/S1-004_SPRINT_BRIEF.md` (prior sprint; positions this sprint's price data will eventually feed)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-001 through ADR-004)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001 through DEC-2026-008)
- `documentation/ai/AI_BOOTSTRAP.md`
