# 28_LIVE_DATA_BLUEPRINT

**Document ID:** ZOS-028
**Version:** 1.1.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

This document is the official Live Data Platform Blueprint — the architecture and provider-selection specification governing all future Live Data implementation Sprints (`L1-001` onward). It defines the data-domain inventory, provider research and comparison matrix, the Live Data architecture and its integration points with the existing Foundation, cache/synchronization/security/cost strategy, and the six-section v1.1 Addendum (Data Quality Layer, Provider Priority Matrix, SLA & Freshness Matrix, Versioning Strategy, Future Streaming Architecture, Data Confidence Engine).

This document authorizes no implementation on its own. Per `10_AI_ENGINEER_GUIDE.md`'s Required Workflow, implementation of any Live Data capability requires its own approved Sprint Brief (beginning with `L1-001`) that complies with this Blueprint; no such Sprint Brief has been proposed or approved as of this document's approval.

# Revision History

| Version | Date | Change | Status |
|:---|:---|:---|:---|
| 1.0.0 | 2026-07-16 | Initial Live Data Platform Architecture & Provider Strategy Blueprint — Data Domain Inventory, Provider Research, Provider Comparison Matrix, Live Data Architecture, Cache Strategy, Synchronization Strategy, Security, Cost Analysis, Implementation Roadmap, Final Recommendation. | Approved |
| 1.1.0 | 2026-07-16 | v1.1 Addendum — six additional sections (Data Quality Layer, Provider Priority Matrix, SLA & Freshness Matrix, Versioning Strategy, Future Streaming Architecture, Data Confidence Engine), additive only; no section of v1.0.0 rewritten or expanded. | Approved |

------------------------------------------------------------------------

# Live Data Blueprint v1.0

## How to read this document

Every design decision below is anchored to something that already exists in the Foundation, and explicitly says so. Where a genuinely new component is required, it is called out as **NEW** and justified. Nothing here proposes changing an already-approved system unless marked **NEW** or **EXTEND**.

Foundation components this blueprint reuses throughout:
- The **provider abstraction pattern**: an interface + injection token (`MARKET_DATA_PROVIDER`, `CALENDAR_NEWS_PROVIDER`, `COT_PROVIDER`) with a `Simulated*Provider` bound today, designed since ADR-003 explicitly so a real provider is "only a new class and a change to one registration line."
- `TrackedAssetsService` (S1-035): the single deduplicated source of "which assets does Zenith actually need data for," shared by Dashboard, Calendar/News, and Market Data Sync.
- The Cron-based background sync services (`MarketDataSyncService`, `CalendarNewsSyncService`, `CotSyncService`) built on `@nestjs/schedule`.
- `RateLimiterService` + `retry.util` (built for `MarketDataService` in S1-005).
- The Analysis Engine's provider **circuit breaker** and **provider-health** utilities (S1-008), already generic enough to reuse for Live Data providers.
- The `normalize()` vocabulary-mapping convention (S1-012): every Analysis Provider maps its own internal shape into one normalized vocabulary. Live Data providers should follow the identical convention for market data shapes.
- Zod validation at every boundary; ownership-scoped, upsert + compound-unique-constraint persistence (the pattern just fixed for Calendar/News in S1-035).
- `nestjs-pino` structured logging, `ObservabilityService` counters, `/health` and `/market-data/provider-health` endpoints.

The recurring theme of this blueprint is: **one abstraction, many interchangeable providers, reused infrastructure.** Live Data is not a new architecture — it is the Foundation's existing provider-swap seam, exercised for real.

---

## 1. Data Domain Inventory

| Domain | Why Zenith needs it | Consuming modules | Refresh frequency | Real-time / Delayed / Scheduled | Volume expectations |
|---|---|---|---|---|---|
| **Live Market Prices** (quotes) | Core price feed for every screen that shows "what is it worth now" | Dashboard, Watchlist, Portfolio, Alerts, AI Workspace | Every 30–60s during market hours for tracked assets | Near-real-time (polling; not tick-by-tick) | Scales with **distinct tracked symbols** platform-wide (deduplicated by `TrackedAssetsService`), not per-user |
| **Historical OHLC / Candles** | Feeds every Analysis Engine provider (indicators, swings, patterns, confluence) and Reports | Analysis Engine (all 9 providers), Dashboard, Reports | Daily candles: once/day after close. Intraday: every few minutes during hours | Delayed acceptable for daily; near-real-time for intraday | Backfill (bulk, one-time per new asset) + incremental (daily/intraday appended) |
| **Market Quotes** (bid/ask/spread/day range/prev close) | Superset of "live price" needed for spread-aware analytics and Portfolio valuation precision | Portfolio, Analytics, Dashboard | Same as Live Prices | Near-real-time | Same population as Live Prices |
| **Instrument Metadata** (name, exchange, tick size, lot size, currency) | Trading catalog correctness — Exchanges/Markets/Assets tables | Assets, Markets, Watchlist "add asset," Reports | Weekly (rarely changes) | Scheduled | Whole catalog, low volume |
| **Forex Data** | FX pairs for Dashboard/Watchlist and as the currency-conversion basis for multi-currency Portfolio reporting | Dashboard, Watchlist, Portfolio, Analytics | Same as Live Prices | Near-real-time | Tracked FX pairs only |
| **Commodities** | Futures/spot commodity instruments (gold, oil, etc.) tracked like any other asset | Dashboard, Watchlist, COT (commodities are the classic COT use case) | Same as Live Prices | Near-real-time | Tracked commodity symbols |
| **Indices** | Benchmark instruments (S&P 500, DXY, etc.) for context and as trackable instruments | Dashboard, Watchlist, Morning Brief (market context) | Same as Live Prices | Near-real-time | Tracked index symbols |
| **Stocks** (future expansion) | Equities as a new asset class once Zenith expands beyond FX/commodities/indices | Same modules as above, once enabled | Same as Live Prices | Near-real-time | Grows with catalog expansion |
| **Crypto** (future expansion) | Crypto as a new asset class | Same modules, once enabled | Crypto trades 24/7 — no "market closed" gating | Near-real-time | Grows with catalog expansion |
| **Economic Calendar** | Scheduled macro events (CPI, NFP, rate decisions) that move markets — core to Calendar/News and Morning Brief context | Calendar/News, Morning Brief, Alerts (event-based alerts) | Hourly | Scheduled (events have known future timestamps) | Moderate: global calendar, filtered to relevant currencies/assets |
| **Financial News** | Headlines relevant to tracked assets | Calendar/News, Morning Brief, AI Workspace | Every 15–30 min | Near-real-time delivery of inherently async content | Moderate–high (many articles/day across tracked symbols) |
| **COT Reports** | CFTC positioning data — the entire COT module's reason to exist | COT | Weekly (CFTC releases Fridays, ~3-day lag) | Scheduled | Low (one release/week per contract) |
| **Market Sessions** | Exchange open/close/timezone — needed to know when a market is live | All sync jobs (gate polling), Dashboard ("market closed" state), Morning Brief timing | Daily (validate), effectively static per exchange | Scheduled | Very low — one record per exchange |
| **Trading Holidays** | Exchange closure dates — prevents wasted polling and false "why hasn't price moved" confusion | Sync jobs, Journal (date logic), Morning Brief | Refreshed annually, checked daily | Scheduled | Very low |
| **Symbol Search** | Autocomplete when a user adds an asset to Watchlist/Portfolio | Watchlist, Portfolio, AI Workspace | On-demand (not synced) | Real-time on-demand | Spiky, user-driven, low volume per call |
| **Asset Classification** | Sector/industry/asset-class tagging for filtering, Reports, and Analytics grouping | Reports, Analytics, Assets catalog | Weekly (bundled with Instrument Metadata) | Scheduled | Whole catalog, low volume |

### Additional domains recommended for inclusion

| Domain | Why it should exist | Consuming modules |
|---|---|---|
| **Corporate Actions** (splits & dividends) | Without this, historical OHLC and Portfolio average-cost silently corrupt across a split — this is a correctness requirement, not a nice-to-have, the moment real historical data is used | Analysis Engine (adjusted OHLC), Portfolio/Positions (average-cost correctness), Reports |
| **Fundamentals** (future) | P/E, market cap, earnings — useful context for AI Workspace and Reports once Zenith expands into equities | AI Workspace, Reports (future) |
| **Macro / Interest Rate Context** (FRED) | Free, authoritative macro time series that make Morning Brief and AI Workspace narrative genuinely informed rather than price-only | Morning Brief, AI Workspace |
| **Currency Conversion** | Needed for multi-currency Portfolio valuation and Reports — **not a new vendor**, derived directly from the Forex domain already being ingested | Portfolio, Analytics, Reports |
| **Market Status / Halts** | Circuit breakers, trading halts — relevant to Alerts so a stale price during a halt isn't misread as a signal | Alerts, Dashboard |

---

## 2. Provider Research

Pricing and rate limits below are directional (public self-serve tiers as of this writing) and **must be re-verified against the vendor's current published pricing before any purchase decision** — these change frequently and are not something to hardcode into the architecture.

### Twelve Data
- **Coverage:** Unified multi-asset — stocks, forex, crypto, ETFs, indices, some fundamentals; broad global exchange coverage.
- **API quality:** Modern REST + WebSocket, one consistent schema style across asset classes.
- **Reliability:** Good; widely used in production fintech.
- **Documentation:** Excellent — interactive docs, official SDKs.
- **Rate limits:** Free tier is credit-based (roughly ~800 credits/day, ~8 req/min); paid tiers scale to WebSocket + much higher throughput.
- **Pricing:** Tiered monthly (~$29–$229+/mo bands), enterprise available.
- **Free tier limitations:** No WebSocket, restrictive per-minute cap for any real deployment with more than a handful of tracked symbols.
- **Commercial suitability:** Explicit commercial license tiers — good fit.
- **Advantages:** One vendor across nearly every domain Zenith needs (prices, forex, commodities, indices, instrument metadata, symbol search); WebSocket streaming when needed later.
- **Disadvantages:** Free tier is prototype-only; commodities coverage/depth varies by contract.

### Finnhub
- **Coverage:** Strong US-centric equities, forex, crypto; bundles company fundamentals, earnings calendar, and news well.
- **API quality:** REST + WebSocket trade feed, straightforward.
- **Reliability:** Solid; free dev tier is unusually generous for candles/quotes.
- **Documentation:** Good, simple.
- **Rate limits:** Free tier ~60 calls/min; premium unlocks realtime forex/crypto and deeper fundamentals.
- **Pricing:** Mid-range, competitive.
- **Free tier limitations:** Some real-time and fundamentals endpoints gated to paid.
- **Commercial suitability:** Good; broadly used commercially.
- **Advantages:** Best value for **news + economic calendar + fundamentals bundled**, making it a strong secondary/failover for prices and a strong primary for calendar/news.
- **Disadvantages:** Smaller international-exchange coverage than Twelve Data in some markets.

### Alpha Vantage
- **Coverage:** Global equities, forex, crypto, plus built-in technical indicator endpoints.
- **API quality:** Simple REST, JSON/CSV output.
- **Reliability:** Free tier historically very restrictive (5 calls/min, 25/day) — not viable as a production backbone without a paid key.
- **Documentation:** Decent.
- **Pricing:** Paid tiers exist but the free tier is really a prototyping tier only.
- **Commercial suitability:** Workable at premium tier, but weaker price/value than Twelve Data or Finnhub at comparable volume.
- **Advantages:** Long track record, simple to start with, built-in indicators (Zenith doesn't need these — the Analysis Engine already computes its own).
- **Disadvantages:** Rate limits make it a poor sole production source; **not recommended as primary**.

### Polygon.io
- **Coverage:** Deep US equities/options/forex/crypto, tick-level data, bulk historical flat files.
- **API quality:** Excellent — REST, WebSocket, flat-file bulk downloads.
- **Reliability:** High, built for professional/institutional use.
- **Documentation:** Excellent.
- **Rate limits:** Free tier is end-of-day-delayed only, 5 calls/min — not production-viable free.
- **Pricing:** Higher than Twelve Data/Finnhub at comparable tiers, justified by depth (tick data, options chains).
- **Commercial suitability:** Excellent, explicit commercial licensing.
- **Advantages:** Best-in-class for deep US market data and true real-time WebSocket streaming; ideal if/when Zenith needs tick-level equities data.
- **Disadvantages:** Costly for a forex/commodities-heavy portfolio like Zenith's current catalog; **overkill for MVP**, a strong candidate to revisit once Stocks expansion and real-time streaming become priorities.

### Financial Modeling Prep (FMP)
- **Coverage:** Global equities, forex, crypto, deep fundamentals (statements, ratios, DCF), economic calendar, news.
- **API quality:** REST, very large endpoint catalog.
- **Reliability:** Generally good; some historical reports of endpoint/schema drift.
- **Documentation:** Extensive, occasionally inconsistent on edge-case endpoints.
- **Rate limits:** Free tier a few hundred calls/day; paid scales.
- **Pricing:** Very competitive for the breadth of fundamentals + calendar bundled.
- **Commercial suitability:** Good for a startup wanting fundamentals + calendar from one low-cost vendor.
- **Advantages:** Best price/feature ratio for **Economic Calendar** and (future) **Fundamentals**.
- **Disadvantages:** Not built for real-time streaming — not a candidate for the Live Prices domain.

### MarketAux
- **Coverage:** Financial news aggregation with symbol tagging and sentiment scoring.
- **API quality:** Simple REST, clean JSON.
- **Reliability:** Good for an aggregator; depends on upstream sources.
- **Documentation:** Adequate.
- **Rate limits:** Free tier limited (~100 req/day); paid scales.
- **Pricing:** Budget-friendly.
- **Commercial suitability:** Fine as a **secondary/failover** news source.
- **Advantages:** Affordable, symbol-tagged, decent breadth of smaller outlets.
- **Disadvantages:** Not a licensed premium wire service; sentiment is heuristic-level, not equivalent to a professional NLP feed.

### NewsAPI
- **Coverage:** General news aggregation, not finance-specific.
- **API quality:** Simple REST.
- **Reliability:** Fine for general news.
- **Documentation:** Good.
- **Rate limits / Pricing:** Free "Developer" tier is **explicitly non-commercial** — production use requires the paid "Business" plan.
- **Commercial suitability:** Only with a paid plan, and even then it isn't finance-specialized (no symbol tagging).
- **Advantages:** Broad general coverage, simple integration.
- **Disadvantages:** Redundant with Finnhub/MarketAux for Zenith's specific need; free tier is legally unusable in production.
- **Recommendation: excluded from the recommended stack.**

### TradingEconomics
- **Coverage:** Best-in-class macroeconomic calendar and indicator history across hundreds of countries — the industry standard for economic-calendar widgets.
- **API quality:** Comprehensive REST.
- **Reliability:** High — used by major financial media sites.
- **Documentation:** Good, but full access is enterprise/sales-priced.
- **Rate limits:** Free/guest tier is a limited demo (sample data only).
- **Pricing:** Expensive, annual-contract, sales-gated — not transparent self-serve pricing.
- **Commercial suitability:** Excellent if budget allows; cost-prohibitive at early stage.
- **Advantages:** Unmatched macro calendar depth and historical breadth.
- **Disadvantages:** Overkill and expensive if Zenith's actual need is a standard earnings/economic event calendar (which FMP/Finnhub already cover).
- **Recommendation: defer to a later, revenue-justified phase; not part of the initial stack.**

### CFTC (Commitments of Traders)
- **Coverage:** The authoritative US futures/options positioning reports (Legacy, Disaggregated, Financial Futures, Supplemental) — this *is* the COT domain, not a re-packaging of it.
- **API quality:** Public Open Data API (Socrata, `publicreporting.cftc.gov`) plus raw CSV/TXT publication.
- **Reliability:** High — primary government source, released weekly (Fridays, ~3-day lag from Tuesday data).
- **Documentation:** Adequate; less "developer-friendly" than commercial APIs, requires domain knowledge of report types.
- **Rate limits / Pricing:** Free, generous, public data — no commercial-use restriction.
- **Commercial suitability:** Excellent — it's the primary source; no reason to pay a vendor to re-package it.
- **Advantages:** Free, authoritative, exactly matches the existing `COT_PROVIDER` interface's purpose.
- **Disadvantages:** Weekly cadence only; requires a parser and a futures-contract-to-Zenith-asset-symbol mapping table.
- **Recommendation: sole COT source.**

### FRED (Federal Reserve Economic Data)
- **Coverage:** Authoritative US macroeconomic/monetary time series (rates, inflation, employment, GDP, money supply) — thousands of series.
- **API quality:** Clean, mature, official REST API.
- **Reliability:** Excellent (Federal Reserve Bank of St. Louis infrastructure).
- **Documentation:** Excellent, official reference implementation.
- **Rate limits / Pricing:** Free with an API key, generous — appropriate since series update daily/monthly/quarterly, not real-time.
- **Commercial suitability:** Excellent, no restriction (attribution requested).
- **Advantages:** Free, authoritative, ideal for the recommended new **Macro Context** domain feeding Morning Brief/AI Workspace narrative.
- **Disadvantages:** US-focused; gives historical/updated series values, not a forward-looking calendar of release *times* — complements, doesn't replace, the Economic Calendar domain.
- **Recommendation: adopt as the free Macro Context source.**

### Yahoo Finance (unofficial)
- **Coverage:** Broad global equities/forex/crypto/indices quotes and historical OHLC.
- **API quality:** **No official public API.** Access is via reverse-engineered endpoints or community wrapper libraries.
- **Reliability:** Fragile — endpoints have broken without notice historically, and Yahoo has periodically throttled/blocked scraping traffic.
- **Documentation:** None official.
- **Rate limits / Pricing:** "Free," unpublished, enforced ad hoc via IP blocking.
- **Commercial suitability: not suitable.** No ToS-sanctioned commercial API exists; relying on it is both a business-continuity risk and a compliance risk for a paid product.
- **Advantages:** Free, broad coverage, easy for local prototyping.
- **Disadvantages:** No SLA, real breakage risk, no support channel.
- **Recommendation: acceptable only for local developer experimentation, explicitly excluded from the production stack.**

### AlphaQuery
- **Coverage:** Options data, sentiment/analyst estimates, niche fundamentals.
- **API quality:** Smaller vendor, limited API surface relative to a full data platform.
- **Reliability / Documentation:** Unproven at scale; limited public documentation compared to the majors above.
- **Commercial suitability:** Uncertain, unclear self-serve pricing.
- **Recommendation:** Zenith has no options-analytics or analyst-estimates module today — **not adopted**. Revisit only if such a feature is added later.

### Other providers considered and rejected/deferred

- **IEX Cloud** — shut down its API service in 2024. A real-world cautionary example validating this blueprint's multi-provider, no-single-vendor-lock-in stance.
- **Intrinio** — enterprise-grade fundamentals, higher cost than FMP for comparable breadth; keep as a fallback option if fundamentals ever need institutional-grade depth.
- **OpenExchangeRates** — dedicated FX-rates API; likely redundant given Twelve Data/Finnhub forex coverage already planned; not adopted unless forex ever needs a third independent source.

---

## 3. Provider Comparison Matrix & Recommended Stack

Zenith should **not** use one provider for everything. The right architecture is multi-provider, matched to each domain's actual technical and cost profile.

| Data Domain | Primary | Secondary / Failover | Why |
|---|---|---|---|
| Live Market Prices | Twelve Data | Finnhub | Twelve Data's unified multi-asset schema fits Zenith's existing single `MarketDataProvider` interface across forex/commodities/indices; Finnhub as failover keeps this domain resilient without a second integration style (both REST+WS) |
| Historical OHLC / Candles | Twelve Data | Finnhub | Same rationale; Polygon deferred until deep US equities/tick data is actually needed |
| Market Quotes | Twelve Data | Finnhub | Same client/infra as Live Prices — no extra integration cost |
| Instrument Metadata | Twelve Data | Finnhub (equities enrichment) | Twelve Data's reference-data endpoints cover Zenith's current catalog breadth |
| Forex | Twelve Data | Finnhub | Already covered by the primary market-data vendor; no dedicated FX vendor needed |
| Commodities | Twelve Data | — (flag for spike) | Coverage/contract depth varies across vendors; validate specific commodity symbols Zenith tracks before committing |
| Indices | Twelve Data | Finnhub | Standard reference instruments, well covered |
| Stocks (future) | Twelve Data | Polygon (when deep/real-time equities needed) | Twelve Data sufficient for MVP breadth; Polygon reserved for a later, justified upgrade |
| Crypto (future) | Twelve Data | Finnhub | Both cover majors adequately for an initial expansion |
| Economic Calendar | FMP | Finnhub | FMP's calendar+fundamentals bundle is the best price/value; Finnhub as a cross-check/failover |
| Financial News | Finnhub | MarketAux | Finnhub bundles news with the existing market-data relationship; MarketAux as an independent secondary source for resilience. **NewsAPI excluded** (non-finance-specific, free tier non-commercial) |
| COT Reports | CFTC (direct) | — | Authoritative, free, no reason for an intermediary |
| Market Sessions | Twelve Data | Static internal config | Provider gives exchange hours; a maintained internal fallback table covers any gaps |
| Trading Holidays | Twelve Data / Finnhub | Internal seeded table | Holiday calendars change rarely — hybrid of provider + annually-curated internal table is both cheap and robust |
| Symbol Search | Twelve Data | Finnhub | Twelve Data's unified search spans all current asset classes |
| Asset Classification | Twelve Data | Finnhub (equities) | Bundled with Instrument Metadata sync |
| Corporate Actions (new) | Twelve Data | Finnhub | Both vendors already integrated for market data — no new vendor relationship required |
| Fundamentals (future) | FMP | Intrinio (institutional-grade fallback) | Best breadth/value; Intrinio only if institutional depth is ever required |
| Macro Context (new) | FRED | — | Free, authoritative, no reason to pay elsewhere |

**Why multi-provider, explicitly:**
1. **No single point of failure.** Yahoo Finance's fragility and IEX Cloud's 2024 shutdown are real precedents — a production financial product cannot depend on one vendor's continued existence or goodwill.
2. **Cost matched to actual need.** Real-time streaming is expensive; COT and Macro data are inherently non-real-time and free from authoritative government sources. Paying real-time prices for weekly/scheduled data would be pure waste.
3. **One integration style, many vendors.** Twelve Data and Finnhub both offer REST+WebSocket with broadly similar ergonomics, so running them as primary/failover for market data is cheap to build and maintain — this is not "adding complexity," it's reusing the same client shape twice.

---

## 4. Live Data Architecture

### 4.1 Provider abstraction (reused, not redesigned)

Every domain gets exactly the pattern Zenith already has for Market Data, Calendar/News, and COT:

```
interface XProvider { ... }              // already exists for 3 domains; NEW for others below
const X_PROVIDER = Symbol('X_PROVIDER')  // injection token, same convention
{ provide: X_PROVIDER, useClass: LiveXProvider }   // swap this one line per ADR-003 precedent
```

**NEW interfaces required** (domains with no existing provider abstraction): `InstrumentMetadataProvider` (metadata + symbol search + classification), `MarketSessionProvider` (sessions + holidays), `CorporateActionsProvider`, `MacroDataProvider` (FRED).

Everything else is an **EXTEND**: implement `TwelveDataMarketDataProvider`, `FinnhubMarketDataProvider`, etc. against the *existing* `MarketDataProvider`/`CalendarNewsProvider`/`CotProvider` interfaces — no interface changes, no consumer changes.

### 4.2 Failover composite (NEW, thin wrapper)

A `FailoverProvider<T>` decorator wraps two concrete providers behind one interface: try primary, and on error/timeout/open-circuit fall to secondary, logging which provider actually served the request (for cost/quality monitoring). This is registered at the same DI token as any single provider — consumers never know a failover is happening.

### 4.3 Normalization (reused convention)

Each vendor implementation maps its raw response into Zenith's existing internal DTOs (`MarketQuote`, `Candle`, `NewsItem`, `CalendarEvent`, COT report shape) via a pure `normalize()` function, following the exact convention the Analysis Engine already established in S1-012 for provider vocabulary mapping. Vendor-specific shapes never leak past the provider implementation.

### 4.4 Validation & transformation pipeline

```
Provider raw response
  → Zod raw-schema validation (per-vendor; catches vendor schema drift early)
  → normalize() → internal DTO
  → Zod internal-schema validation (defense in depth, matches existing convention)
  → cache write (in-memory) + DB upsert (natural-key + compound unique constraint)
```

The upsert + compound-unique-constraint pattern is not new — it's exactly the fix just applied to Calendar/News in S1-035 (`@@unique([assetId, headline, publishedAt])` style), replicated for every new domain's persistence table.

### 4.5 Cache layer, DB sync, scheduler, retry, timeout — see Sections 5 and 6 for detail

All reuse existing infrastructure: the TTL in-memory cache pattern from `MarketDataService`, the `@nestjs/schedule` Cron pattern from the three existing sync services, and `retry.util`'s exponential backoff.

**NEW:** explicit per-provider HTTP timeout (the Simulated providers are synchronous, so no timeout concept exists yet) — recommend 5s connect / 10s total, configurable per provider.

### 4.6 Failover strategy & circuit breaker (reused, not reinvented)

The Analysis Engine already has a tested, generic **circuit breaker** (`provider-circuit-breaker.spec.ts`, built for AnalysisProviders in S1-008) and a **provider-health** utility. Both are reused as-is for Live Data providers rather than building new ones — the failure mode ("an external provider may be flaky; isolate it, don't cascade") is identical.

### 4.7 Provider switching

Exactly the existing pattern: change the `providers: [...]` line in the relevant module. No consumer, controller, or service outside the module needs to change — proven across 3 domains already.

### 4.8 Error recovery

Sync jobs already tolerate per-asset failure and continue (`MarketDataSyncService`'s "succeeded/failed" counters). Extend the identical pattern to every new sync job — one asset's provider error never blocks the rest of the batch.

### 4.9 Monitoring, health checks, logging, metrics (EXTEND existing)

- Extend the existing `/api/v1/market-data/provider-health` endpoint pattern to cover every new live provider (latency, error rate, last-success timestamp) rather than inventing new endpoints.
- Extend `ObservabilityService` counters for provider call count, success/fail, latency, and cache hit rate.
- Extend `nestjs-pino` structured logs with `provider` and `domain` fields (with header/key redaction — pino's built-in redaction, applied to anything containing "key"/"token").

### 4.10 Scalability

Sync jobs are already idempotent via upsert, so they're safe to run from multiple instances without data corruption. At Zenith's current single-instance scale this needs no change. **Documented deferral, not a redesign:** once horizontally scaled, add either a Postgres advisory lock or a single-designated-instance env flag so cron jobs don't triple-fire — flagged here as a known future need, intentionally not built now to avoid over-engineering ahead of actual need.

---

## 5. Cache Strategy

| Data | Cache duration | Rationale |
|---|---|---|
| Live quotes | 15–30s during market hours | Matches real update cadence; avoids hammering provider for sub-tick precision Zenith doesn't display |
| Intraday candles | 1–5 min per timeframe | Balances freshness with provider call budget |
| Daily candles | Until next market close | Daily bar doesn't change intraday |
| Instrument metadata | 24h | Rarely changes |
| Symbol search results | ~1h | Balances freshness with avoiding repeated identical searches |
| Economic calendar / news | 15–30 min | Matches natural publication cadence |
| COT reports | 7 days (until next weekly release) | Matches CFTC's release cadence exactly |
| Trading holidays / sessions | Refreshed daily, effectively valid for the calendar year | Changes rarely; daily check catches any mid-year amendments |

- **Invalidation:** TTL expiry (existing pattern). No explicit invalidation needed elsewhere since Postgres remains the durable system of record.
- **Cold start:** On boot, cache is empty; first request per asset does a live fetch (existing behavior). **NEW, small addition:** run each sync service once via `OnModuleInit` in addition to `@Cron`, so a freshly deployed instance pre-warms the cache for all tracked assets instead of waiting for the first cron tick.
- **Warm cache:** Steady-state during market hours — cron keeps tracked-asset data warm between user requests.
- **Memory vs. database:** Two-tier, as today — in-memory (L1, fastest) + Postgres (L2, durable, system of record for history). **No Redis needed at current single-instance scale.** Documented deferral: Redis is the natural L1 replacement once Zenith runs multiple API instances needing a shared cache — not built now.
- **Refresh policy:** Cron-driven proactive refresh for tracked assets (existing) + lazy fetch-on-miss for ad-hoc/untracked lookups (e.g., Symbol Search preview of an asset nobody tracks yet).

---

## 6. Synchronization Strategy

- **Polling frequency:** Quotes for tracked assets every 1–5 min, **gated on Market Sessions data** — a genuinely valuable saving: skip polling entirely when the relevant market is closed, which is the majority of hours in a week for any single exchange.
- **Scheduled jobs (reuse `@nestjs/schedule` Cron convention):**
  - `CorporateActionsSyncService` — daily
  - `MacroDataSyncService` (FRED) — daily
  - `MarketSessionSyncService` / holiday refresh — daily
  - `InstrumentMetadataSyncService` — weekly (rarely changes)
- **Incremental updates:** Fetch "since last successful sync" where the provider supports date-range params (News/Calendar, already upsert-safe from S1-035); COT only ingests a new weekly report if not already present (natural-key check via upsert).
- **Bulk synchronization:** One-time historical OHLC backfill (e.g., 2 years of daily candles) triggered when a new asset is added to the catalog — separate job from steady-state incremental sync.
- **Startup synchronization:** Each sync service runs once on `OnModuleInit` in addition to its cron schedule, guarded by a "skip if already run within N minutes" check to avoid duplicate work if multiple instances start together.
- **Recovery after downtime:** **NEW, small addition:** store a `lastSuccessfulSyncAt` timestamp per provider/domain. On startup, if it's older than a threshold, run a bulk catch-up fetch instead of the normal incremental one — otherwise, normal incremental sync naturally self-heals since it always fetches "current state" or "since last success."

---

## 7. Security

- **API key management:** Environment variables via the existing `ConfigService` pattern (same as `JWT_SECRET`, `DATABASE_URL` today). A dedicated secret manager (Vault/Doppler/cloud secrets manager) is the natural upgrade once beyond single-environment deployment — not required to start, consistent with avoiding premature infrastructure.
- **Secret rotation:** Provider clients read the key from `ConfigService` at call time (not cached at boot as a constant), so rotating a key only requires a redeploy/env change, no code change. Documented rotation runbook: rotate in vendor dashboard → update secret store → redeploy → confirm provider-health green → revoke old key.
- **Provider authentication:** Each vendor's own scheme (API key header/query param), wrapped inside its provider client class; never logged raw — enable pino's field redaction for any header/query key containing "key"/"token"/"secret".
- **Outbound rate limiting:** Reuse and generalize the existing `RateLimiterService` per-provider, parameterized to each vendor's documented limits; queue/backoff proactively rather than bursting into 429s.
- **Inbound rate limiting:** Already extended to `/auth/login` and `/auth/register` in S1-035; most Live-Data-backed endpoints already sit behind `JwtAuthGuard`, limiting abuse surface to authenticated users. Extend throttling to any new public endpoint only if usage patterns later show abuse risk.
- **Abuse prevention:** Cache-first design (Section 5) means repeated identical requests never reach a provider; add a per-user cap on-demand endpoints (Symbol Search) so one compromised account can't burn platform-wide provider quota.
- **Failure isolation:** Reused circuit breaker (Section 4.6) plus the existing "tolerate and continue" per-asset error handling in sync jobs means one failing provider or one failing asset never cascades into blocking unrelated requests or domains.

---

## 8. Cost Analysis

*(Directional estimates based on public self-serve pricing; re-verify current vendor pricing before purchase.)*

| Stage | Composition | Estimated monthly cost |
|---|---|---|
| **Development** | All free tiers: Twelve Data free, Finnhub free, FMP free, MarketAux free, CFTC + FRED free | **$0** |
| **Beta** | Twelve Data Basic/Grow paid tier once aggregate tracked-symbol polling exceeds free-tier limits; Finnhub/FMP/MarketAux still free or entry paid | **~$50–150** |
| **Production** | Twelve Data Pro tier, Finnhub paid tier (news/fundamentals volume), FMP paid tier, MarketAux paid tier | **~$300–800**, driven almost entirely by *distinct tracked symbols*, not user count |
| **Scaling** | Twelve Data Enterprise / Polygon added as data depth needs grow (deep equities/real-time streaming); CFTC + FRED remain free regardless of scale | **~$500–2000+** |

**Cost levers, in order of impact:**
1. **`TrackedAssetsService`'s existing global-dedup design is the single biggest cost lever Zenith has.** Because cost scales with distinct symbols tracked platform-wide (not per-user, not per-portfolio), user-base growth does **not** proportionally grow the market-data bill. This is an existing architectural decision (S1-035, ADR-004/DEC-2026-007) worth explicitly preserving and never regressing.
2. **Market-Session-gated polling** (Section 6) directly cuts wasted calls — most instruments are outside their session for the majority of any given week.
3. **Deferring TradingEconomics and Polygon** (the two priciest options researched) until a specific, revenue-justified need arises. MVP economic-calendar and market-data needs are already well covered by FMP/Finnhub/Twelve Data at a fraction of the cost.
4. **CFTC and FRED never become cost drivers** — both are free, authoritative government sources, structurally decoupled from Zenith's growth.

---

## 9. Implementation Roadmap

| Phase | Objective | Dependencies | Complexity | Key Risk | Deliverables |
|---|---|---|---|---|---|
| **0 — Provider Access & Config Foundation** | Acquire dev-tier API keys; wire `ConfigService`-based credential loading; build shared HTTP client (timeout + retry + circuit breaker reuse) | None | Low | Provider account approval delays | Credentials wired; shared client utility; no behavior change (Simulated providers still active) |
| **1 — Live Market Data Provider** | Implement `TwelveDataMarketDataProvider` + Finnhub failover behind the existing `MARKET_DATA_PROVIDER` interface; swap DI registration | Phase 0 | Medium | Real payload shapes differ from Simulated assumptions in edge cases | Live quotes/candles flowing into existing tables via existing sync jobs; feature-flagged rollback to Simulated |
| **2 — Market Sessions & Trading Holidays** | Add `MarketSessionProvider`; gate sync jobs on "is market open" | Phase 1 | Low–Medium | Multi-exchange session logic adds branching | Sync jobs skip closed-market polling; accurate "market closed" UI state |
| **3 — Economic Calendar & Financial News** | Implement live `CalendarNewsProvider` via FMP (calendar) + Finnhub/MarketAux (news) behind the existing interface | Phase 0 | Medium | Cross-source near-duplicate headlines need solid dedup | Live Calendar/News screens |
| **4 — COT Live Provider** | Direct CFTC ingestion (Socrata API/CSV) behind the existing `COT_PROVIDER` interface; futures-contract-to-symbol mapping | Phase 0 | Medium | Mapping table curation/maintenance | Live COT screen backed by real CFTC data |
| **5 — Instrument Metadata, Symbol Search & Classification** | Replace seeded catalog with live `InstrumentMetadataProvider` | Phase 1 | Medium | Catalog reconciliation — must join on symbol+exchange, never recreate existing Asset rows | Live symbol search; enriched classification |
| **6 — Corporate Actions** | New `CorporateActionsProvider` for split/dividend-adjusted history and correct Portfolio average-cost | Phases 1, 5 | Medium–High (correctness-critical) | Wrong adjustment silently corrupts P/L history — needs dedicated tests against known historical splits | Adjusted historical data; correct Portfolio math across corporate actions |
| **7 — Macro Context (FRED)** | New `MacroDataProvider` feeding Morning Brief/AI Workspace narrative | Phase 0 only | Low | Narrative-composer template work (non-architectural) | Richer, macro-aware Morning Brief/AI Workspace commentary |
| **8 — Monitoring, Alerting & Cost Observability** | Extend provider-health/observability to all live providers; add usage/cost-per-provider dashboards | Phases 0–7 | Medium | Purely operational — no functional risk | Extended `/health`; visible usage/cost metrics; documented alert thresholds |
| **9 — Live Data Acceptance Review** | Repeat the Foundation's acceptance-review process (architecture, error handling, security, cost) before declaring Live Data production-ready | Phases 0–8 | Low (process) | None additional | Review report, hardening pass, `v1.0-live-data` tag |

This ordering minimizes rework by design: every phase adds a new implementation behind an existing or cleanly-scoped new interface, never touches an unrelated module, and defers the two most expensive/optional domains (deep macro via TradingEconomics, deep equities via Polygon) until their triggering need actually exists.

---

## 10. Final Recommendation

**Recommended stack:** Twelve Data + Finnhub as the core market-data pair (primary/failover), FMP for Economic Calendar, Finnhub + MarketAux for Financial News, CFTC directly for COT, FRED directly for Macro Context. TradingEconomics, Polygon, and AlphaQuery are deliberately deferred; Yahoo Finance (unofficial) and NewsAPI's free tier are deliberately excluded from production.

**Why this is the right architecture for Zenith:**
- It is not a new architecture at all — it is the Foundation's provider-abstraction seam (interface + DI token + Simulated implementation, explicitly designed since ADR-003 for exactly this moment) exercised for the first time with real vendors. Every consumer (Dashboard, Calendar/News, COT, Alerts, Reports) keeps working unmodified.
- It reuses, rather than reinvents, five pieces of already-tested infrastructure: the circuit breaker, the retry/rate-limiter utilities, the Cron-based sync pattern, the upsert+unique-constraint persistence pattern, and the `normalize()` vocabulary convention. This means every new provider integration follows one mental model instead of a bespoke pattern per vendor — the single biggest maintainability win available.

**Why these providers were selected:**
- Twelve Data and Finnhub together cover essentially every current-catalog domain (forex, commodities, indices, market data, metadata, symbol search) through two vendors with similar REST/WebSocket ergonomics — not fragmented across five different integration styles.
- CFTC and FRED are the authoritative, free, government sources for exactly the two domains (COT, Macro) where a commercial re-packaging vendor would add cost with no accuracy benefit.
- FMP gives the best economic-calendar value without paying TradingEconomics' enterprise pricing for depth Zenith doesn't need yet.

**Why alternatives were rejected:**
- Yahoo Finance (unofficial): no SLA, real breakage precedent, commercial ToS/legal risk — unacceptable for a paid production product.
- NewsAPI: free tier is legally non-commercial, and even paid it isn't finance-specialized — redundant with Finnhub/MarketAux.
- TradingEconomics, Polygon, AlphaQuery: each is excellent at what it does, but each is priced or scoped for a need Zenith doesn't have *yet* — deferring them is a cost decision, not a quality judgment, and each has an explicit trigger condition in the roadmap for when to revisit.
- IEX Cloud was considered and is now defunct — the strongest available real-world argument for this blueprint's multi-provider, no-lock-in posture.

**Long-term scalability:** Provider cost scales with distinct tracked symbols platform-wide (via the existing `TrackedAssetsService` dedup), not with user count — user growth does not proportionally grow the data bill. Real-time/WebSocket and deeper-equities tiers (Polygon) can be added later purely as a DI-registration swap, with zero consumer-side changes, exactly as already proven across three domains in the Foundation.

**Maintainability:** One architectural pattern — provider interface, DI token, normalize(), Zod validation at the boundary, Cron sync, upsert persistence, circuit breaker, observability — applies to every current and future data domain. A new engineer who understands one Live Data provider understands all of them.

**Commercial readiness:** A cost structure that is genuinely $0 in development, low tens-to-hundreds in beta, and scales predictably and sub-linearly with user growth into production — with clear, budgeted, trigger-gated upgrade paths (TradingEconomics, Polygon) reserved for exactly the moment the business can justify them.

---

*This section constitutes the eleven required deliverables of Live Data Blueprint v1.0 (Live Data Architecture, Data Domain Inventory, Provider Comparison Matrix, Recommended Provider Stack, Cache Strategy, Synchronization Strategy, Monitoring & Health Strategy, Security Strategy, Cost Analysis, Implementation Roadmap, Final Technical Recommendation). No code was written or modified in the production of this document.*

------------------------------------------------------------------------

# Live Data Blueprint — Version 1.1 Addendum

**Status:** Approved. **Relation to v1.0:** additive only — no section of v1.0 above is rewritten or expanded. **Scope:** planning only, no code changes.

## A1. Data Quality Layer

This extends the transformation pipeline already defined in §4.4 (Provider raw response → Zod raw validation → normalize() → internal DTO → Zod internal validation → cache + DB) by inserting two explicit new stages between validation and persistence: **Quality Assessment** and **Accept/Reject**. §4.4 itself is unchanged; this is the fuller pipeline it feeds into.

```
Provider Response → Normalization → Validation → Quality Assessment → Accept / Reject → Persistence → Distribution
```

- **Validation rules:** beyond the existing raw/internal Zod schemas — range checks (price > 0; percentage change within a sane bound versus the last known-good value); required-field presence; type/enum conformance; timestamp sanity. A rule violation is a hard reject at the earliest possible stage.
- **Missing-field handling:** optional field missing → accept, mark the record degraded (feeds the confidence score, §A6). Required field missing → reject the record, log, and count toward that provider's error rate (feeds the existing circuit breaker, §4.6).
- **Stale data detection:** compare the provider-reported timestamp (or fetch time, if absent) against the domain's freshness SLA (§A3). Stale data is **accepted, not rejected**, and flagged — during a provider outage, stale-but-present beats nothing. Staleness feeds a confidence penalty (§A6) rather than a hard rejection.
- **Duplicate detection:** persistence-level dedup is already solved (S1-035's natural-key + compound-unique-constraint + upsert pattern). This layer adds a *pre-persistence semantic* dedup for near-duplicate content across providers (e.g., near-identical news headlines) via a normalized key (symbol + truncated headline + time-bucket), so cross-provider consensus (§A6) isn't skewed by double-counting the same event.
- **Malformed payload handling:** a raw-schema Zod failure is rejected immediately: structured log with provider, domain, and a payload hash (never the full payload), and increments that provider's error counter toward the circuit-breaker threshold.
- **Timestamp validation:** reject or flag when a required timestamp is missing, is in the future beyond a small clock-skew tolerance (~60s), or is implausibly old for the domain's SLA. All timestamps are normalized to UTC during the existing normalize() step.
- **Confidence scoring:** each accepted record receives a per-record score (0–100) from freshness, completeness, and source trust weight — the direct input to the cross-provider Data Confidence Engine (§A6).
- **Recovery behaviour:** a rejection never blocks the sync job — the existing per-asset "tolerate and continue" behaviour (S1-035's `MarketDataSyncService`) is reused as-is: log, skip, keep serving the last known-good value. A circuit-breaker increment only happens on provider-attributable failures, never on merely-stale-but-valid data.
- **Integration with the Foundation:** implemented as a shared, reusable `DataQualityService` invoked identically by every provider regardless of domain — the same way `RateLimiterService`/`retry.util` are already shared. One more cross-cutting piece alongside the circuit breaker and observability service, not a new architecture.

## A2. Provider Priority Matrix

Extends the primary/secondary pairing from §3 with an explicit third tier — **Fallback** — and defines **Offline Behaviour** for every domain.

| Domain | Primary | Secondary | Fallback | Offline behaviour | Reason |
|---|---|---|---|---|---|
| Live Quotes | Twelve Data | Finnhub | Last known-good cached quote | Serve cached quote marked stale; suppress price-dependent alerts; log degraded-mode event | Two independent live sources already justified by §8 |
| Historical OHLC | Twelve Data | Finnhub | Existing DB history | Serve DB history as-is; flag "backfill pending" | History is already persisted — reads never depend on live availability |
| Forex / Indices | Twelve Data | Finnhub | Last cached value | Same as Live Quotes | Same pairing — no added integration cost |
| Commodities | Twelve Data | none (spike pending) | Last cached value | Same as Live Quotes, extra-conservative | Contract-depth coverage still needs validation |
| Economic Calendar | FMP | Finnhub | Previously synced calendar | Serve known future events; mark "unconfirmed" if overdue | Events known in advance — short outages rarely matter |
| Financial News | Finnhub | MarketAux | Existing cached articles | Stop appending until recovery — no user-facing error | News is additive, not current-state |
| COT Reports | CFTC (direct) | — | Last published report | Display last report with its "as of" date | Sole authoritative source; weekly cadence |
| Market Sessions | Twelve Data | Finnhub | Internal static config table | Use internal table — seamless | Exchange hours change extremely rarely |
| Trading Holidays | Twelve Data / Finnhub | — | Internal annually-seeded table | Use internal table — seamless | Same rationale as Sessions |
| Corporate Actions | Twelve Data | Finnhub | Skip this cycle, retry next sync | Flag "adjustment pending" — never apply unconfirmed data | Correctness-critical (§9 Phase 6) |
| Macro Context | FRED | — | Last synced series value | Serve last value, mark "as of" date | Sole free authoritative source |
| Fundamentals (future) | FMP | Intrinio | Last synced value | Serve last synced figures, flagged by period | Best breadth/value |

## A3. SLA & Freshness Matrix

Design targets to validate once live providers are integrated (Roadmap Phase 8/9), not yet-measured production SLOs.

| Domain | Target availability | Target freshness | Max acceptable delay | Sync frequency | Expected update behaviour |
|---|---|---|---|---|---|
| Live Quotes | 99.5% | ≤ 60s in-session | 90s before "stale" flag | 30–60s poll | Continuous in-session; frozen with "market closed" state out of session |
| Historical Data | 99.9% | Daily candle within 30 min of close | ~2h | Daily; on-demand backfill | Append-only; never overwritten except by verified corporate-action adjustment |
| Calendar | 99.5% | ≤ 60 min for new/changed events | 2h | Hourly | Forward-looking list grows/updates; past events immutable |
| News | 99% | ≤ 30 min from publication | 1h | 15–30 min | Append-only, ordered by publish time |
| COT | 99.9% | Within 24h of CFTC's Friday release | 72h | Weekly + daily check | One new report per contract per week; prior weeks immutable |
| Sessions | 99.99% | Same-day accuracy for exceptions | 24h | Daily validation | Near-static; exception-driven changes only |
| Fundamentals | 99% | Within the reporting quarter | 7 days post-earnings | Daily / earnings-triggered | Periodic step-changes, not continuous |
| Corporate Actions | 99.9% | Confirmed within 24h of effective date | 48h (never apply unconfirmed) | Daily | Rare, discrete, immutable once applied and verified |

## A4. Versioning Strategy

- **External provider APIs:** pin to a specific vendor API version where offered; record the pinned version in that provider's config. Each provider implementation ties to exactly one vendor-API-version contract, isolated behind its own normalize().
- **Internal Zenith data models:** existing DTOs gain an explicit schema-version field only when a breaking shape change is needed — additive optional fields never require a bump.
- **Normalization contracts:** versioned implicitly by the provider-implementation class itself (e.g. `TwelveDataMarketDataProviderV1`). A breaking vendor change ships as `...V2` alongside `V1` behind a feature flag, cuts over, then retires `V1` once verified — mirroring how full provider replacement already works via DI-token swap.
- **Transformation contracts:** the raw-Zod → normalize() → internal-Zod pipeline (§4.4) *is* the transformation contract. The raw schema versions independently per provider-version; the internal schema stays stable as the contract the rest of Zenith depends on.
- **Compatibility rules:** internal DTOs are additive-only within a major version. Consumers only ever depend on the internal DTO, never on a provider's raw shape.
- **Deprecation policy:** a provider-implementation version is marked deprecated once its replacement is live and verified, kept for a minimum 30-day grace period, then removed.
- **Future migration strategy:** because a provider swap is already a one-line DI registration change, and normalize() isolates vendor churn from the internal DTO, most "migrations" stay provider-internal rather than platform-wide.

**How provider API changes are isolated:** a vendor's breaking change only ever requires touching that vendor's own provider-implementation class, its raw Zod schema, and its normalize() function — never the internal DTO, never a consumer, never another provider.

## A5. Future Streaming Architecture

*Architectural direction only — no implementation.* The current design (§4, §6) assumes polling, appropriate for MVP cost/complexity; Live Quotes is the domain most likely to eventually warrant push-based delivery.

- **WebSockets:** Twelve Data and Finnhub (and Polygon, if adopted later) each offer a WebSocket streaming tier. A future `StreamingMarketDataProvider` would implement the same `MarketDataProvider`-family interface but push updates instead of being polled — the consumer-facing contract is identical regardless of transport.
- **Server-Sent Events (SSE):** recommended as Zenith's own internal distribution mechanism, API → web client — simpler than WebSockets for one-directional push, fits Nest's existing HTTP-first architecture. Two distinct legs: ingest upstream via provider WebSocket, redistribute downstream via SSE.
- **Streaming providers:** gated behind the same provider-abstraction/DI-token pattern — just another interface implementation.
- **Hybrid polling + streaming:** recommended over a hard cutover. Streaming for tracked assets with active viewers; polling continues for background assets and all non-price domains (news, calendar, COT, macro remain scheduled indefinitely).
- **Automatic fallback:** a dropped/degraded streaming connection falls back to the existing polling path — the same failover/circuit-breaker infrastructure (§4.6) extended to treat "streaming disconnected" as a circuit-open condition.
- **Event distribution:** a new, narrowly-scoped internal pub/sub layer — in-process event emitter at single-instance scale, or a message broker (Redis Pub/Sub, NATS) once horizontally scaled.
- **Scaling strategy:** single-instance holds the upstream connection and fans out via in-process SSE. Multi-instance requires either one designated instance publishing to a shared broker, or each instance holding its own scoped connection — the former is recommended, but deferred until real-time streaming is actually prioritized.

## A6. Data Confidence Engine

Where the Data Quality Layer (§A1) assesses one provider's record in isolation, the Confidence Engine reconciles what happens when two independently quality-assessed sources report on the same fact.

- **Confidence score:** a 0–100 composite computed per accepted data point: per-record quality score (§A1) × provider trust weight × corroboration bonus/penalty × freshness × timestamp-drift penalty.
- **Provider trust levels:** a configured weight per provider *per domain* (not a global ranking), reflecting the Priority Matrix's tiering (§A2).
- **Conflict resolution:** when Primary and Secondary disagree beyond a domain-specific tolerance, **Primary Provider Override** wins by default, unless **Majority Consensus** is available (3+ sources agreeing, primary the outlier) — then majority wins, and the primary's disagreement is logged as a data-quality signal, never silently discarded.
- **Majority consensus:** only meaningful where 3+ independent sources exist — rare today. News already has a genuine two-source case (Finnhub + MarketAux): agreement raises confidence, disagreement lowers it, ties default to Primary Provider Override.
- **Stale/missing data penalties:** confidence decays linearly past the domain's freshness SLA (§A3), from 100% at the boundary to a floor (e.g. 20%) — never to zero while the data is the best available. Missing-required-field records never reach this engine (already rejected at §A1).
- **Timestamp drift:** inconsistency between provider-reported time and Zenith's ingestion time beyond tolerance applies a small penalty and flags that provider on the existing provider-health dashboard (§4.9).
- **Quality thresholds:** each domain defines a minimum confidence floor below which a data point is marked "low confidence" rather than authoritative — consistent with the Foundation's existing "graceful degradation, never silent failure" convention. Disagreeing sources are never averaged into a fabricated value; resolution always attributes to one real source, with the disagreement recorded for observability.

**How downstream modules consume confidence:**

| Module | Behaviour |
|---|---|
| Dashboard | Subtle confidence/freshness indicator, surfaced only below threshold |
| Morning Brief | Hedges or omits low-confidence claims, reusing the existing graceful-degradation narrative pattern (S1-020) |
| AI Workspace | Confidence score included as context so commentary reflects uncertainty |
| Reports | Rolled-up confidence indicator ("N of M data points this period were below threshold") |
| Alerts | Hard gate — evaluation is suppressed for a tick when confidence is below the domain threshold |

---

*This addendum adds exactly six sections to Live Data Blueprint v1.0 above. No section of v1.0 was rewritten or expanded. No code was written or modified in the production of this addendum.*

------------------------------------------------------------------------

# Related Documents

- 04_TECH_STACK.md
- 05_ARCHITECTURE.md
- 08_ROADMAP.md
- 09_PROJECT_BRAIN.md
- 10_AI_ENGINEER_GUIDE.md
- 12_ADR_INDEX.md (ADR-003 — Market Data Provider Abstraction; ADR-004 — Background Job Scheduling for Market Data Synchronization)
- 22_ANALYSIS_ENGINE_ARCHITECTURE.md
- 25_PRODUCT_BLUEPRINT.md
- sprints/L1-001_SPRINT_BRIEF.md (Provider Access & Config Foundation — first Sprint of this Blueprint's Implementation Roadmap §9 Phase 0; Proposed, awaiting Architecture Team review)
