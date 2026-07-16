# L1-004 SPRINT BRIEF — COT Live Provider (CFTC Direct Integration)

**Document ID:** ZOS-L1-004
**Version:** 1.1
**Status:** Approved — Live External Verification Pending (Environment Constraint)
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-004
- **Sprint Name:** COT Live Provider — CFTC Direct Integration
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 4 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-16
- **Approved By:** Architecture Team (2026-07-16)
- **Baseline Sprints:** L1-001, L1-002, L1-003 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

1. Implement a live `CotProvider` — the existing interface (`apps/api/src/cot/providers/cot-provider.interface.ts`, `COT_PROVIDER` token, S1-032 origin) — an **EXTEND**, per Blueprint §4.1, exactly like `MarketDataProvider` and `CalendarNewsProvider` were extended in L1-001/L1-003: no interface change, no consumer change.
2. Source COT data directly from the CFTC's public Socrata Open Data API (`publicreporting.cftc.gov`) — per Blueprint §3's explicit recommendation: **"sole COT source."** No secondary or failover provider applies to this domain; unlike L1-002/L1-003, there is no dual-source tension to resolve.
3. Introduce a maintained internal futures-contract-to-Zenith-symbol mapping table, mirroring the Internal Market Sessions Table pattern established in L1-002: a small, disclosed, extensible reference set rather than an exhaustive one, since CFTC reports are keyed by market/exchange name and contract code, not by Zenith's `Asset.symbol` directly.
4. Reuse the shared `MarketDataHttpClient` (L1-001) directly by import, the existing `normalize()` convention, and the existing `CotService`/`CotSyncService` cache/sync pipeline (S1-032, weekly cron) exactly as-is.
5. Zero changes to any consumer: the COT screen already reads through `CotService` — real data flows through automatically once the DI registration is swapped.

---

# Scope

1. `LiveCotProvider` implementing `getLatestReports(symbol)`: resolves `symbol` against the internal mapping table to a CFTC contract identifier, fetches CFTC's Legacy Futures-Only report data for that contract, and normalizes the result.
2. An internal mapping table (`Record<string, CftcContractMapping>` or equivalent) seeded with a small reference set of commonly tracked COT-reportable instruments (major currency futures, major commodities, major index futures) — extended over time, per the L1-002 precedent. A symbol with no mapping entry returns an **empty array** (not an error) — a real, expected outcome (not every tracked asset has a COT-reportable futures contract), not a failure state.
3. The existing `CotTraderCategory` enum (`COMMERCIAL`/`NON_COMMERCIAL`/`NON_REPORTABLE`) already fixes which CFTC report type applies: the **Legacy** report's category taxonomy (Disaggregated and Financial Futures reports use different category breakdowns and are out of scope, since the existing interface was designed around Legacy's categories).
4. Zod raw-schema validation for the CFTC Socrata response shape, plus a `normalize()` function that explodes one CFTC report row (which carries all three categories' long/short positions as separate fields) into three `ProviderCotReport` entries — one per `CotTraderCategory` — matching the interface's per-category granularity.
5. A `createCotProvider()` factory mirroring L1-001's `createMarketDataProvider()`: a `COT_MODE` flag (`live`/unset) selects the live implementation, falling back to `SimulatedCotProvider` with a logged warning otherwise. Unlike L1-001/L1-003, no API key is strictly required (CFTC's public reporting data needs no credential); an optional `CFTC_APP_TOKEN` (Socrata's optional higher-rate-limit app token) may be wired for future use but is not required for `live` mode to activate.
6. DI registration in `cot.module.ts` — the one-line swap, per ADR-003 precedent.
7. Unit tests (mapping table resolution, CFTC row normalization/explosion, factory fallback) and integration tests using mocked transport — no live network call required to pass CI.
8. Persistence: existing `CotReport` table and its existing `(assetId, reportDate, category)` upsert pattern (S1-032) — no schema change.

---

# Out of Scope

- **Any secondary/failover COT source** — not applicable; Blueprint §3 designates CFTC as the sole authoritative source for this domain.
- **The Disaggregated or Financial Futures CFTC report types** — the existing `CotTraderCategory` enum already fixes Legacy as the only compatible report type; supporting the others would require an interface change, which is out of scope.
- **The Data Quality Layer, Confidence Engine, cross-provider scoring, or provider trust ranking** (Addendum §A1/§A6) — per the Architecture Team's L1-003 decision, these are deferred to their own dedicated future Sprint across all Live Data domains, not re-litigated per Sprint.
- **Deep historical COT backfill** beyond a recent rolling window comparable to what `SimulatedCotProvider` already provides (8 weeks) — matching L1-001's precedent of not over-building backfill beyond what the existing on-demand cache/sync flow already needs.
- **Exhaustive mapping-table coverage of every possible futures contract** — a small, disclosed, extensible starting set, per Scope item 2.
- **Any other Blueprint domain**: Instrument Metadata/Symbol Search (Phase 5), Corporate Actions (Phase 6), Macro Context (Phase 7), Monitoring/Observability (Phase 8), Live Data Acceptance Review (Phase 9).
- **Modifications to `CotService`, `CotSyncService`, `CotController`, or any L1-001/L1-002/L1-003 deliverable** — reused as-is.
- **L1-005 or any later Sprint.**

---

# Dependencies

- **Phase 0 (Provider Access & Config Foundation)** — satisfied by L1-001: the shared `MarketDataHttpClient` (timeout + retry + circuit-breaker reuse) is reused directly. Per the Blueprint's own Roadmap, Phase 4 depends on Phase 0 only — not on Phases 1–3.
- **Existing `CotService`/`CotSyncService`/`AssetsService`** — reused unmodified.

---

# Deliverables

1. `LiveCotProvider` implementation sourcing COT data directly from CFTC's Socrata Open Data API.
2. Internal futures-contract-to-symbol mapping table (seed reference set).
3. Zod raw schema + `normalize()` mapping (one CFTC row → three `ProviderCotReport` entries).
4. `createCotProvider()` factory + `COT_MODE`/`CFTC_APP_TOKEN` environment wiring.
5. DI registration swap in `cot.module.ts`.
6. Unit tests (mapping resolution, normalization/explosion, factory fallback) and integration tests (mocked transport).
7. Updated Sprint Brief with Implementation Notes documenting any resolutions/design decisions, once implemented.
8. Standard documentation updates on completion: `11_DECISION_LOG.md`, `09_PROJECT_BRAIN.md` (via required process), `08_ROADMAP.md`.

---

# Acceptance Criteria

1. `CotProvider` is registered via DI exactly like `MarketDataProvider`/`CalendarNewsProvider`/`MarketSessionProvider` — no consumer needs to know which concrete implementation is active.
2. A tracked asset with no futures-contract mapping entry returns an empty COT report list, not an error — consistent with "not every asset has COT data" being a normal, expected outcome.
3. All new code has unit test coverage; CFTC-integration logic has test coverage using mocked data — no live network call required to pass CI.
4. No new npm dependency introduced (native `fetch`/shared `MarketDataHttpClient` reused) unless proven strictly necessary, to be flagged for `14_DEPENDENCY_POLICY.md` review if so.
5. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- All Deliverables above complete and merged.
- All Acceptance Criteria verified.
- Sprint Brief status updated to reflect implementation completion, following the L1-003 precedent of recording the live-verification gap as a documented environment constraint rather than blocking on it, if the same egress policy also blocks `publicreporting.cftc.gov`.
- Documentation updates listed under Deliverables §8 completed.

---

# Risks

1. **Mapping-table curation/maintenance** — the Roadmap's own stated Key Risk for this Phase. Mitigated by starting with a small, disclosed reference set (Scope item 2) and extending over time, mirroring the L1-002 Internal Market Sessions Table precedent rather than attempting exhaustive coverage upfront.
2. **CFTC Socrata API real payload shape may differ from assumptions** in edge cases — the same class of risk every prior Live Data Sprint has encountered and resolved via Zod raw-schema rejection and graceful degradation.
3. **Live verification may be blocked by this session's environment egress policy**, as it was for `api.twelvedata.com` (L1-001), `financialmodelingprep.com`/`finnhub.io`/`api.marketaux.com` (L1-003) — untested against `publicreporting.cftc.gov` as of this Brief, but now a recognized, recurring environment constraint per the Architecture Team's own L1-003 framing, not treated as a per-Sprint surprise.
4. **Report-cadence mismatch risk is low** — CFTC publishes weekly (Fridays, ~3-day lag); the existing `CotSyncService` weekly cron and `CotService`'s 7-day freshness window (S1-032) already match this cadence with no change needed.

---

# Missing Decisions

None identified. Unlike L1-002 (Market Sessions) and L1-003 (Calendar/News), this domain has no dual-source tension — Blueprint §3 unambiguously designates CFTC as the sole COT source — and the existing `CotTraderCategory` enum already fixes the CFTC report type (Legacy) this Sprint must use, leaving no open architectural question to escalate. The Data Quality Layer question raised in L1-003 was resolved there as a cross-Sprint precedent (deferred platform-wide to its own dedicated future Sprint), so it is not re-raised here.

---

# Verification Plan

*(Forward-looking — this Sprint has not been implemented; no results exist yet.)*

1. **Unit tests**: mapping-table resolution (known symbol, unmapped symbol), CFTC row normalization/explosion into three categories, factory fallback behavior — no live network required.
2. **Integration tests**: provider implementation against mocked transport, mirroring L1-001's/L1-003's approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures.
4. **Live verification**: a real request to CFTC's Socrata endpoint, subject to this session's environment network-egress policy (untested against this host as of this Brief) — to be attempted and honestly reported, not faked or bypassed, per L1-001/L1-003 precedent.
5. **Manual/observational check**: confirm the live COT screen renders real CFTC data end-to-end with zero code change to that consumer, before marking Done.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 4 — "COT Live Provider" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 (Data Domain Inventory — COT Reports row), §3 (Provider Comparison Matrix — CFTC section, "sole COT source" recommendation), §4.1 (Provider Abstraction — `CotProvider` EXTEND), §9 (Implementation Roadmap, Phase 4 row), Addendum §A2 (Provider Priority Matrix — COT Reports row), Addendum §A3 (SLA & Freshness Matrix — COT row).
- **Next Blueprint Phase:** Phase 5 — Instrument Metadata, Symbol Search & Classification.

---

# Implementation Notes

Added after Architecture Team approval (2026-07-16). Implementation followed this Brief exactly — no redesign, no new patterns, no Data Quality Layer, no Confidence Engine, no scope expansion.

**Files changed:**
- New: `apps/api/src/cot/providers/cftc-contract-mapping.ts` (seed mapping: GOLD, EUR/USD, WTI), `cot.schemas.ts`, `cot.normalize.ts` (+ spec), `live-cot.provider.ts` (+ spec), `cot-provider.factory.ts` (+ spec).
- Modified: `apps/api/src/cot/cot.module.ts` (DI registration swap, mirroring L1-001's `market-data.module.ts` pattern); `apps/api/.env`, `apps/api/.env.example` (`COT_MODE`, `CFTC_APP_TOKEN`).
- No changes to `CotService`, `CotSyncService`, `CotController`, or any Dashboard consumer.

**Design details disclosed, not escalated (bounded implementation choices within approved Scope):**
- The CFTC Socrata resource ID used (`6dca-aqww`, the Legacy Futures-Only report) could not be validated against a live response given the environment constraint below; it is the correct dataset for the existing `CotTraderCategory` taxonomy per public CFTC documentation, but should be reconfirmed once live access is available.
- A symbol with no entry in the internal contract mapping table returns an empty report list without calling the CFTC API at all — verified by a dedicated unit test.
- Unlike L1-001/L1-003, no credential is required for `COT_MODE=live` to activate (CFTC's public reporting data needs no API key); `CFTC_APP_TOKEN` is optional and passed through as a Socrata query parameter only when configured.

**Test summary:** 158/158 `apps/api` test suites passing, 819/819 tests (11 new tests across 3 new spec files); `apps/api` and `apps/web` build + lint clean.

**Live verification (2026-07-16):** Booted the API against a live local PostgreSQL instance in Simulated mode — zero regression on `GET /cot/:assetId` (continued returning real cached/seeded data unchanged). A direct connectivity check found `publicreporting.cftc.gov` **blocked by this session's environment egress policy** (`CONNECT tunnel failed, response 403`) — identically to `api.twelvedata.com` (L1-001) and `financialmodelingprep.com`/`finnhub.io`/`api.marketaux.com` (L1-003). Per the Architecture Team's established framing, this is recorded as the same **documented environment constraint affecting all external providers integrated to date**, not an implementation defect. No time was spent attempting to route around it. The real-vendor HTTP path (contract-code query construction, response normalization/explosion, empty-result-for-unmapped-symbol) is otherwise fully covered by mocked-transport unit tests.

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [x] Approved
- [ ] Rejected

---

# Related Documents

- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028)
- `documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` (ZOS-L1-001)
- `documentation/zos/sprints/L1-002_SPRINT_BRIEF.md` (ZOS-L1-002)
- `documentation/zos/sprints/L1-003_SPRINT_BRIEF.md` (ZOS-L1-003) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003)
