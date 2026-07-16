# L1-003 SPRINT BRIEF — Economic Calendar & Financial News (Live Provider Integration)

**Document ID:** ZOS-L1-003
**Version:** 1.0
**Status:** Proposed
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-003
- **Sprint Name:** Economic Calendar & Financial News — Live Provider Integration
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 3 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-16
- **Approved By:** *(pending — Status: Proposed)*
- **Baseline Sprints:** L1-001 (`ZOS-L1-001`, Implementation Complete — Live Verification Pending) and L1-002 (`ZOS-L1-002`, Implementation Complete, Accepted) — both Approved and merged to `main`.

---

# Objectives

1. Implement a live `CalendarNewsProvider` — the existing interface (`apps/api/src/calendar-news/providers/calendar-news-provider.interface.ts`, `CALENDAR_NEWS_PROVIDER` token, S1-031 origin) — an **EXTEND**, per Blueprint §4.1, exactly like `MarketDataProvider` was extended in L1-001: no interface change, no consumer change.
2. Source Economic Calendar events from FMP and Financial News from Finnhub, per Blueprint §9 Phase 3's objective and §3's Provider Comparison Matrix — subject to the single-vs-dual-source scope question in Missing Decision #1 below.
3. Reuse the shared HTTP client (`MarketDataHttpClient`, delivered in L1-001) directly by import, following L1-001's own disclosed precedent of importing a cross-cutting utility rather than prematurely promoting it to a shared package.
4. Reuse the existing `normalize()` convention (S1-012 origin, already applied to `ProviderNewsItem`/`ProviderCalendarEvent` by the Simulated provider) to map each vendor's raw response into the existing internal DTOs — no DTO shape change.
5. Reuse the existing `CalendarNewsService` (S1-031) cache/TTL logic and `CalendarNewsSyncService` (S1-031, race-condition-fixed in S1-035) cron exactly as-is — no changes to caching or synchronization behavior.
6. Zero changes to any consumer: Calendar/News screens, Morning Brief, and Alerts already read through `CalendarNewsService` — real data flows through automatically once the DI registration is swapped, exactly as L1-001 proved for Market Data.

---

# Scope

1. Credential configuration: `FMP_API_KEY`, `FINNHUB_API_KEY` (new — Finnhub was named in the Blueprint's market-data pairing but no Finnhub integration has been built yet; this Sprint is its first actual use). Reuses the same `ConfigService`-based loading pattern as `TWELVE_DATA_API_KEY` (L1-001).
2. One concrete `CalendarNewsProvider` implementation dispatching `getNews()` to Finnhub and `getUpcomingEvents()` to FMP internally (a single class serving both interface methods from two different vendor endpoints, since the interface itself is not split by data source).
3. Zod raw-schema validation for both vendors' responses, plus `normalize()` mapping into `ProviderNewsItem`/`ProviderCalendarEvent`.
4. A `createCalendarNewsProvider()` factory mirroring L1-001's `createMarketDataProvider()`: a `CALENDAR_NEWS_MODE` flag (`live`/unset) with fallback to `SimulatedCalendarNewsProvider` and a logged warning if switched to `live` without both required keys configured.
5. DI registration in `calendar-news.module.ts` — the one-line swap, per ADR-003 precedent.
6. Unit tests for both vendor response mappings and the factory's fallback behavior; integration tests using mocked transport (no live network calls required to pass CI), mirroring L1-001's testing approach.
7. Persistence: existing `NewsItem`/`CalendarEvent` tables and their existing upsert + compound-unique-constraint pattern (S1-035) — no schema change.

---

# Out of Scope

- **Secondary/failover providers** (Finnhub as an Economic Calendar cross-check per §3; MarketAux as a Financial News secondary source per §3/§9/Addendum §A2) — deferred, per L1-001's and L1-002's own established precedent of scoping to a single primary source per domain first. **Whether this deferral is appropriate for News specifically is Missing Decision #1 below — not assumed.**
- **The Data Quality Layer's shared `DataQualityService`** (Addendum §A1: Quality Assessment / Accept-Reject pipeline stage, pre-persistence semantic dedup) — not built in L1-001, and its introduction here is **Missing Decision #2 below — not assumed.**
- **The Data Confidence Engine** (Addendum §A6) and any cross-provider consensus scoring — later phase, depends on multi-source data this Sprint does not introduce.
- **Gating Calendar/News sync on Market Sessions** (L1-002) — Calendar/News sync already runs on its own independent schedule (S1-031); Phase 3's own Roadmap row lists its dependency as **Phase 0 only**, not Phase 2, so no interaction with `MarketSessionProvider` is in scope.
- **Any other Blueprint domain**: COT Live Provider (Phase 4), Instrument Metadata/Symbol Search (Phase 5), Corporate Actions (Phase 6), Macro Context (Phase 7), Monitoring/Observability (Phase 8), Live Data Acceptance Review (Phase 9).
- **Modifications to `TwelveDataMarketDataProvider`, `MarketDataHttpClient`, `MarketSessionProvider`, or any L1-001/L1-002 deliverable** — reused as-is.
- **L1-004 or any later Sprint.**

---

# Dependencies

- **Phase 0 (Provider Access & Config Foundation)** — satisfied by L1-001: `ConfigService`-based credential loading pattern and the shared `MarketDataHttpClient` (timeout + retry + circuit-breaker reuse) both already exist and are reused directly. Per the Blueprint's own Roadmap, Phase 3 depends on Phase 0 only — not on Phase 1 (Live Market Data) or Phase 2 (Market Sessions).
- **Resolution of Missing Decisions #1 and #2** below — both materially affect implementation scope and must be resolved before implementation begins.
- **Existing `CalendarNewsService`/`CalendarNewsSyncService`/`TrackedAssetsService`** — reused unmodified.

---

# Deliverables

1. Live `CalendarNewsProvider` implementation sourcing Economic Calendar from FMP and Financial News from Finnhub (per resolved Missing Decision #1).
2. `createCalendarNewsProvider()` factory + `CALENDAR_NEWS_MODE`/`FMP_API_KEY`/`FINNHUB_API_KEY` environment wiring.
3. Zod raw schemas + `normalize()` mappings for both vendors.
4. DI registration swap in `calendar-news.module.ts`.
5. Unit tests (vendor mapping, factory fallback) and integration tests (mocked transport).
6. Updated Sprint Brief with Implementation Notes documenting Missing Decision resolutions, once implemented.
7. Standard documentation updates on completion: `11_DECISION_LOG.md`, `09_PROJECT_BRAIN.md` (via required process), `08_ROADMAP.md`.

---

# Acceptance Criteria

1. `CalendarNewsProvider` is registered via DI exactly like `MarketDataProvider` and `MarketSessionProvider` — no consumer needs to know which concrete implementation is active.
2. Zero changes to `CalendarNewsService`, `CalendarNewsSyncService`, `CalendarNewsController`, or any Dashboard/Morning-Brief/Alerts consumer.
3. All new code has unit test coverage; vendor-integration logic has test coverage using mocked data — no live network call required to pass CI.
4. No new npm dependency introduced (native `fetch`/shared `MarketDataHttpClient` reused) unless proven strictly necessary, to be flagged for `14_DEPENDENCY_POLICY.md` review if so.
5. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- All Deliverables above complete and merged.
- All Acceptance Criteria verified.
- Both Missing Decisions below explicitly resolved by the Architecture Team prior to implementation.
- Sprint Brief status updated to reflect implementation completion (or an equivalent "Live Verification Pending" status if real network access to FMP/Finnhub is blocked by this session's environment, mirroring L1-001's precedent — to be confirmed at implementation time, not assumed here).
- Documentation updates listed under Deliverables §7 completed.

---

# Risks

1. **Cross-source near-duplicate headlines require solid dedup** — the Roadmap's own stated Key Risk for this Phase. Persistence-level dedup (S1-035's natural-key + upsert pattern) already exists; whether additional pre-persistence semantic dedup (§A1) is needed this Sprint depends on Missing Decision #2.
2. **Real FMP/Finnhub payload shapes may differ from `SimulatedCalendarNewsProvider`'s assumptions** in edge cases — the same class of risk L1-001 encountered and resolved via Zod raw-schema rejection + graceful degradation.
3. **New provider-account approval delays** (Blueprint Phase 0's own Key Risk, still relevant here since FMP and Finnhub are both new credentials this Sprint) could block live verification.
4. **Live verification may be blocked by this session's environment egress policy**, as it was for L1-001 (`api.twelvedata.com`) — FMP/Finnhub are different hosts and have not yet been tested against this session's network policy; this is a genuine unknown, not assumed blocked or open.

---

# Missing Decisions

1. **Single-primary-vendor scope vs. the Blueprint's stated Primary+Secondary pairing for News.**
   - Blueprint §3 and Addendum §A2 both pair Financial News with **two** sources from the start: "Finnhub | MarketAux | ... Finnhub bundles news with the existing market-data relationship; MarketAux as an independent secondary source for resilience," and the Roadmap's own Phase 3 Key Risk ("cross-source near-duplicate headlines need solid dedup") only makes sense if **both** News sources ship together — a single-source News implementation has no cross-source duplicates to dedup.
   - This conflicts with L1-001's and L1-002's own established precedent of shipping exactly one primary source per domain first and deferring all secondary/failover integration to a later Sprint.
   - **This Brief does not assume an answer.** The Architecture Team must specify whether L1-003 ships Finnhub-only for News (deferring MarketAux, and therefore also deferring the dedup problem itself), or whether both Finnhub and MarketAux must ship together this Sprint because the dedup risk is intrinsic to Phase 3 as scoped in the Roadmap.

2. **Whether the Data Quality Layer's shared `DataQualityService` (Addendum §A1) should be introduced in this Sprint.**
   - It was not built in L1-001 (Market Data uses only the base §4.4 pipeline: raw validation → normalize → internal validation → cache/DB, no Quality Assessment/Accept-Reject stage).
   - However, §A1's own motivating example for pre-persistence semantic dedup is explicitly "near-identical news headlines across providers" — precisely this Sprint's domain and precisely the Roadmap's stated Key Risk.
   - **This Brief does not assume an answer.** The Architecture Team must specify whether L1-003 introduces `DataQualityService` now (as a shared, reusable service per §A1's own design, invoked identically regardless of domain), or continues deferring it — relying on S1-035's existing persistence-level dedup only, with semantic dedup addressed in a later Sprint once a second Data Quality Layer consumer exists.

---

# Verification Plan

*(Forward-looking — this Sprint has not been implemented; no results exist yet.)*

1. **Unit tests**: vendor response mapping (FMP calendar, Finnhub news), factory fallback behavior — no live network required.
2. **Integration tests**: provider implementation against mocked transport, mirroring L1-001's `http-client.spec.ts`/`twelve-data-market-data.provider.spec.ts` approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures.
4. **Live verification**: a real request to FMP's calendar endpoint and Finnhub's news endpoint, subject to this session's environment network-egress policy (untested against these two hosts as of this Brief) — to be attempted and honestly reported, not faked or bypassed, exactly per L1-001's precedent.
5. **Manual/observational check**: confirm the live Calendar/News screen and Morning Brief render real vendor data end-to-end with zero code change to those consumers, before marking Done.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 3 — "Economic Calendar & Financial News" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 (Data Domain Inventory — Economic Calendar, Financial News rows), §3 (Provider Comparison Matrix — Economic Calendar, Financial News rows), §4.1 (Provider Abstraction — `CalendarNewsProvider` EXTEND), §9 (Implementation Roadmap, Phase 3 row), Addendum §A1 (Data Quality Layer), Addendum §A2 (Provider Priority Matrix — Economic Calendar, Financial News rows), Addendum §A3 (SLA & Freshness Matrix — Calendar, News rows).
- **Next Blueprint Phase:** Phase 4 — COT Live Provider.

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [ ] Approved
- [ ] Rejected

---

# Related Documents

- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028)
- `documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` (ZOS-L1-001)
- `documentation/zos/sprints/L1-002_SPRINT_BRIEF.md` (ZOS-L1-002) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003)
