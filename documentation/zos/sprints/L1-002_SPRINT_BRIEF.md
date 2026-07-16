# L1-002 SPRINT BRIEF — Market Sessions & Trading Holidays

**Document ID:** ZOS-L1-002
**Version:** 1.1
**Status:** Implementation Complete
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-002
- **Sprint Name:** Market Sessions & Trading Holidays
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 2 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-16
- **Approved By:** Architecture Team (2026-07-16)
- **Baseline Sprint:** L1-001 (`ZOS-L1-001`) — "Live Market Data Foundation (Primary Provider Integration)", Status: Implementation Complete — Live Verification Pending

---

# Objectives

1. Introduce a `MarketSessionProvider` interface — bundling exchange sessions **and** trading holidays into a single provider abstraction, per Blueprint §4.1's explicit statement that this is one of the "NEW interfaces required" (no existing abstraction covers this domain).
2. Supply exchange open/close/timezone data and trading-holiday calendars for all currently tracked assets' exchanges, resolving the "Missing Data Source Decision" below before implementation.
3. Gate the existing `MarketDataSyncService` polling cron on "is the relevant market currently open," per Blueprint §6 ("Polling frequency... gated on Market Sessions data") and §9 Phase 2 ("gate sync jobs on 'is market open'"), eliminating wasted polling during closed-market hours.
4. Provide an accurate "market closed" state that downstream consumers (Dashboard) can reflect, per Blueprint §9 Phase 2's stated deliverable — subject to the Dashboard-integration Missing Decision below.
5. Design the gating logic to **fail open** (default to polling, not to skipping) whenever session/holiday status is unknown or unavailable, so a session-data outage degrades to L1-001's current always-poll behavior rather than silently starving Dashboard of fresh quotes.

---

# Scope

1. New `MarketSessionProvider` interface (sessions + holidays bundled) following the exact Provider Abstraction pattern already established for `MarketDataProvider` / `CalendarNewsProvider` / `CotProvider` (ADR-003 precedent): interface + injection token (`MARKET_SESSION_PROVIDER`) + DI-registered implementation, zero changes required of any consumer that only needs an "is market X open" answer.
2. Implementation of the approved primary data source for exchange sessions and trading holidays for all exchanges relevant to currently tracked assets — **exact source (external provider call vs. internal static/seeded table) is a Missing Decision, see below; not assumed by this Brief.**
3. A `MarketSessionSyncService` (or equivalent scheduled job) refreshing session/holiday data on the daily cadence specified in Blueprint §6.
4. Gating logic added to the existing `MarketDataSyncService` cron: skip polling a tracked asset when its exchange is confirmed closed; poll as normal (fail-open) when status is unknown.
5. Data normalization and validation for session/holiday data, reusing the existing `normalize()` + Zod raw/internal-schema convention (S1-012 origin) if an external provider response is involved.
6. Unit tests for the new provider implementation(s) and normalization functions.
7. Integration tests for the sync-gating logic using mocked transport/mocked session data (no live network calls), mirroring L1-001's "integration tests using mocked transport" precedent.
8. Persistence of session/holiday reference data using existing database conventions (no speculative new schema beyond what the chosen data source in the Missing Decision requires).

---

# Out of Scope

- **Finnhub (or any) secondary/failover provider** for Market Sessions or Trading Holidays — per L1-001's own established precedent (L1-001 §Out of Scope) of deferring all secondary/failover provider integration; L1-002 scopes to a single approved primary source only, whatever that source is determined to be.
- **Any other Blueprint domain**: Economic Calendar & Financial News (Phase 3), COT Live Provider (Phase 4), Instrument Metadata/Symbol Search (Phase 5), Corporate Actions (Phase 6), Macro Context (Phase 7), Monitoring/Observability (Phase 8), Live Data Acceptance Review (Phase 9).
- **Data Confidence Engine, Versioning Strategy, or Streaming Architecture** (v1.1 Addendum sections) — not part of Phase 2.
- **Modifications to the existing `TwelveDataMarketDataProvider`, `MarketDataService`, `MarketDataHttpClient`, circuit breaker, or retry utility delivered in L1-001** — reused as-is, not redesigned.
- **New frontend components or visual design work** — any Dashboard-facing change is limited to verifying/reflecting existing data plumbing (see Missing Decision #2); no new UI component design.
- **The outstanding L1-001 Live Runtime Verification item** (real network call to Twelve Data, currently blocked by this session's environment egress policy) — unrelated to this Sprint's scope and not reopened here.
- **L1-003 or any later Sprint.**

---

# Dependencies

- **Phase 1 (L1-001)** — satisfied. `MARKET_DATA_PROVIDER` abstraction, DI-swap pattern, shared `MarketDataHttpClient`, normalization convention, and `MarketDataSyncService` cron all exist and are reused, not rebuilt.
- **Resolution of Missing Decision #1** (primary data source for Sessions/Holidays) — implementation cannot begin until the Architecture Team resolves this; it materially changes the shape of the work (external-provider HTTP integration vs. internal static/seeded table).
- **Existing `TrackedAssetsService`** (S1-035) — reused as the source of which exchanges need session/holiday coverage, exactly as `MarketDataSyncService` already reuses it.
- **Existing `ProviderCircuitBreaker` and `retry.util.ts`** — reused if the resolved data source involves an external HTTP call.

---

# Deliverables

1. `MarketSessionProvider` interface + `MARKET_SESSION_PROVIDER` injection token.
2. One concrete implementation of `MarketSessionProvider`, per the resolved Missing Decision #1 (either a provider-backed implementation reusing `MarketDataHttpClient`, or an internal static/seeded-table implementation — or both, if the resolution calls for a provider-with-internal-fallback hybrid as Blueprint §3 describes).
3. Scheduled daily refresh job for session/holiday data.
4. Gating logic in `MarketDataSyncService` that skips polling for confirmed-closed markets and fails open otherwise.
5. Unit tests covering the new provider implementation(s), normalization (if applicable), and the fail-open gating behavior (including the "status unknown → poll anyway" case explicitly).
6. Integration tests for the sync job's gating behavior using mocked session/holiday data.
7. Updated Sprint Brief documenting resolutions to the Missing Decisions below (Implementation Notes section, matching L1-001's precedent), once implemented.
8. Standard documentation updates on completion: `11_DECISION_LOG.md`, `09_PROJECT_BRAIN.md` (via required process, not direct AI edit), `08_ROADMAP.md`.

---

# Acceptance Criteria

1. `MarketSessionProvider` is registered via DI exactly like the three existing provider domains — no consumer of market-data sync logic needs to know which concrete implementation is active.
2. `MarketDataSyncService` skips polling only when session/holiday status is positively confirmed closed; any error, timeout, or "unknown" status results in polling proceeding as it does today (fail-open, no regression versus L1-001's current always-poll behavior).
3. All new code has unit test coverage; all sync-gating logic has integration test coverage using mocked data — no live network calls required to pass CI, mirroring L1-001's testing approach.
4. No changes to `MarketDataProvider`, `CalendarNewsProvider`, `CotProvider`, or any of their existing consumers.
5. No new npm dependency introduced unless the resolved Missing Decision #1 makes one strictly necessary (to be flagged for `14_DEPENDENCY_POLICY.md` review if so — not assumed here).
6. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- All Deliverables above complete and merged.
- All Acceptance Criteria verified.
- Both Missing Decisions below explicitly resolved by the Architecture Team (in this Brief, prior to implementation) — implementation must not proceed on an assumed answer.
- Sprint Brief status updated to reflect implementation completion (or "Implementation Complete — Live Verification Pending," if the resolved data source involves an external provider call subject to this session's known network egress limitation).
- Documentation updates listed under Deliverables §8 completed.

---

# Risks

1. **Data-source ambiguity (Missing Decision #1) blocks a clean implementation start** — the Blueprint's own §3 (hybrid: provider + internal fallback) and Addendum §A2 (internal table only, "Use internal table — seamless") disagree on approach; proceeding on an assumption risks a scope mismatch discovered mid-Sprint.
2. **Multi-exchange session logic complexity** — explicitly flagged in Blueprint §9 Phase 2's own Roadmap row ("Multi-exchange session logic adds branching"); timezone/DST handling and exchange-specific holiday calendars are a known source of subtle bugs.
3. **Incorrect gating causing false "market closed" polling skips** — mitigated by the fail-open design principle in Objective #5 and Acceptance Criterion #2, but must be verified carefully in tests, since a bug here silently degrades data freshness rather than raising a visible error.
4. **If the resolved data source involves an external provider call**, live verification will be subject to the same environment egress-policy block already documented for L1-001 (network access to Twelve Data/Finnhub is blocked in this session's sandbox) — a known, disclosed, carried-forward limitation, not a new one.
5. **Internal holiday table staleness** — if the resolved approach relies on an internal annually-seeded table, it requires a maintenance process (who updates it, how often) that does not yet exist and is not defined by this Brief.

---

# Missing Decisions

1. **Primary data source for Market Sessions / Trading Holidays is unresolved between two Blueprint sections that disagree.**
   - Blueprint §3 (Provider Comparison Matrix) recommends a **hybrid**: "Market Sessions | Twelve Data | Static internal config | Provider gives exchange hours; a maintained internal fallback table covers any gaps" and "Trading Holidays | Twelve Data / Finnhub | Internal seeded table | ...hybrid of provider + annually-curated internal table is both cheap and robust."
   - Blueprint Addendum §A2 (Provider Priority Matrix) recommends the **internal table outright**, for both domains: "Use internal table — seamless... Exchange hours change extremely rarely" / "Same rationale as Sessions."
   - These lead to materially different implementations: a hybrid requires new external HTTP integration (mirroring L1-001's `TwelveDataMarketDataProvider` work — HTTP client usage, response schemas, normalization) in addition to an internal table; the internal-table-only path requires no new external HTTP integration at all.
   - **This Brief does not assume an answer.** The Architecture Team must specify which approach L1-002 implements before implementation begins.

2. **Whether Dashboard already has an existing UI hook for "market closed" state, or whether this requires new frontend work.**
   - Blueprint §9 Phase 2 lists "accurate 'market closed' UI state" as a deliverable, but whether this is a zero-code-change propagation through the existing Anti-Corruption Layer (as Dashboard/Watchlist/Portfolio integration was for L1-001, per that Sprint's Affected Components list) or requires new frontend work was not established by the Blueprint sections read for this Sprint, and — per this task's explicit "do not reread the project" instruction — was not independently re-verified against current `apps/web` code.
   - Recommend the Architecture Team confirm this at implementation kickoff rather than this Brief assuming an answer.

---

# Verification Plan

*(Forward-looking — this Sprint has not been implemented; no results exist yet.)*

1. **Unit tests**: new `MarketSessionProvider` implementation(s), any normalization functions, and the sync-gating fail-open logic — run via the existing `apps/api` Jest suite, no live network required.
2. **Integration tests**: `MarketDataSyncService` gating behavior verified against mocked session/holiday data covering — market open (poll), market confirmed closed (skip), status unknown/error (poll, fail-open) — mirroring L1-001's "integration tests using mocked transport" approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures.
4. **Live verification** (only if Missing Decision #1 resolves to include an external provider call): a real request to the resolved provider's session/holiday endpoint, subject to the same environment network-egress constraint already disclosed for L1-001 — to be attempted and honestly reported, not faked or bypassed, exactly per L1-001's precedent.
5. **Manual/observational check**: confirm via logs or existing monitoring that `MarketDataSyncService` actually skips at least one tracked asset during a confirmed-closed market window in a non-production run, before marking Done.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 2 — "Market Sessions & Trading Holidays" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 (Data Domain Inventory — Market Sessions, Trading Holidays rows), §3 (Provider Comparison Matrix), §4.1 (Provider Abstraction — `MarketSessionProvider`), §6 (Synchronization Strategy), §9 (Implementation Roadmap, Phase 2 row), Addendum §A2 (Provider Priority Matrix), Addendum §A3 (SLA & Freshness Matrix).
- **Next Blueprint Phase:** Phase 3 — Economic Calendar & Financial News.

---

# Implementation Notes (resolutions to the Missing Decisions above)

Added after Architecture Team approval (2026-07-16). Implementation followed this Brief exactly — no redesign, no new patterns, no changes to `TwelveDataMarketDataProvider`/`MarketDataService`/`MarketDataHttpClient`/circuit breaker/retry utility.

1. **Missing Decision #1 (data source) — resolved:** Architecture Team designated the **Internal Market Sessions Table as the sole primary source of truth**. External providers are used only for synchronization/verification when required, not for runtime lookups — none was required this Sprint, since the internal table needs no external data to reconcile against. `InternalMarketSessionProvider` (`apps/api/src/market-data/providers/internal-market-session.provider.ts`) is the only registered `MarketSessionProvider` implementation; no mode switch, no Twelve Data/Finnhub session/holiday integration was built.
2. **Missing Decision #2 (Dashboard UI hook) — resolved:** No existing "market closed" UI hook was found in `apps/web` (confirmed by inspection). Per the Architecture Team's instruction ("if not, implement the minimal required integration; do not perform any unnecessary frontend redesign"), a minimal integration was added: a new `GET /market-data/assets/:assetId/market-status` endpoint (mirroring the existing `.../quote` endpoint exactly) and a single inline text annotation (`· Market open` / `· Market closed`) next to each Watchlist item — `DashboardService`/`InstrumentReadingService`/Confluence orchestration were not touched.

**Files changed:**
- New: `apps/api/src/market-data/providers/market-session-provider.interface.ts`, `market-session-config.ts`, `internal-market-session.provider.ts` (+ spec), `apps/api/src/market-data/market-session-sync.service.ts` (+ spec)
- Modified: `apps/api/src/market-data/market-data-sync.service.ts` (+ spec) — fail-open gating; `apps/api/src/market-data/market-data.service.ts` (+ spec) and `market-data.controller.ts` — new `getMarketStatus`; `apps/api/src/market-data/market-data.module.ts` — DI registration; `apps/api/src/tracked-assets/tracked-assets.service.ts` (+ spec) — new `getAllTrackedAssetsWithExchange()`; `apps/web/src/lib/api.ts`, `apps/web/src/app/watchlist/page.tsx` — minimal frontend integration.

**Live verification (2026-07-16):** Booted the API against a live local PostgreSQL instance with a real `XLON` (London Stock Exchange) exchange/market/asset added to a Watchlist. `GET .../market-status` correctly returned `CLOSED` at the real current time (21:40 BST, after the 16:30 local close) — confirming correct IANA timezone/DST handling via `Intl.DateTimeFormat`, not just a fixed UTC offset. The demo seed exchange (`ZDX`, unconfigured) correctly returned `UNKNOWN`. Manually invoking `MarketDataSyncService.syncTrackedAssets()` against the live app logged `"4 succeeded, 0 failed, 1 skipped (market closed), 5 tracked"` and no `MarketQuote` row was created for the closed-market asset — the skip behavior working end-to-end. The Watchlist page (`GET /watchlist`) rendered `Market closed` for that instrument. All test data was removed after verification. No external network call was required or attempted, consistent with the internal-table-only resolution of Missing Decision #1.

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [x] Approved
- [ ] Rejected

---

# Related Documents

- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028)
- `documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` (ZOS-L1-001) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004)
