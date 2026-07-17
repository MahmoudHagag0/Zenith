# L1-005 SPRINT BRIEF — Instrument Metadata, Symbol Search & Classification

**Document ID:** ZOS-L1-005
**Version:** 1.1
**Status:** Approved — Live External Verification Pending (Environment Constraint)
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-005
- **Sprint Name:** Instrument Metadata, Symbol Search & Classification
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 5 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-16
- **Approved By:** Architecture Team (2026-07-16)
- **Baseline Sprints:** L1-001, L1-002, L1-003, L1-004 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

1. Introduce a new `InstrumentMetadataProvider` interface — per Blueprint §4.1, this domain has **no existing provider abstraction** (listed alongside `MarketSessionProvider`, `CorporateActionsProvider`, `MacroDataProvider` as one of the "NEW interfaces required"), so this Sprint follows L1-002's precedent for introducing a genuinely new interface + injection token, not merely extending an existing one like L1-003/L1-004.
2. Source live instrument metadata (name, exchange, tick size, lot size, currency), on-demand symbol search, and asset classification (sector/industry/asset-class tagging) from Twelve Data (primary) per Blueprint §3 — subject to Missing Decision #2 below on Finnhub's exact role.
3. Reuse the shared `MarketDataHttpClient`, the existing `normalize()` convention, and the existing DI-swap pattern (ADR-003) exactly as every prior L1 Sprint has.
4. Resolve, not assume, how this new live capability integrates with the **existing, unmodified-since-S1-003** trading catalog (`Exchange`/`Market`/`Asset` Prisma models, admin-CRUD-gated creation) and the **existing, DB-only** `GET /market-data/search` endpoint (`MarketDataService.searchAssets()`, a raw Prisma `contains` query with no provider involved today) — both are Missing Decisions below, not settled by this Brief.

---

# Scope

1. `InstrumentMetadataProvider` interface (new): a proposed shape, for Architecture Team confirmation, mirroring the existing three-domain provider convention —
   ```
   interface InstrumentMetadataProvider {
     readonly name: string;
     searchSymbols(query: string): Promise<ProviderSymbolSearchResult[]>;
     getInstrumentMetadata(symbol: string): Promise<ProviderInstrumentMetadata>;
     getClassification(symbol: string): Promise<ProviderAssetClassification>;
   }
   ```
   plus a `SimulatedInstrumentMetadataProvider` (matching the Foundation's existing pattern of a Simulated implementation preceding any real one) and, subject to Missing Decision #1, a live Twelve-Data-backed implementation.
2. Zod raw-schema validation + `normalize()` mapping for Twelve Data's reference-data/symbol-search endpoints into the new provider DTOs.
3. A `createInstrumentMetadataProvider()` factory mirroring every prior Sprint's factory pattern (mode flag, credential-gated fallback to Simulated).
4. Unit tests (normalization, factory fallback) and integration tests using mocked transport.
5. Whatever catalog-integration and search-endpoint-integration work is actually approved once Missing Decisions #1–#3 below are resolved — **not specified further here**, since the shape of that work depends entirely on their resolution.

---

# Out of Scope

- **Corporate Actions, Macro Context, Monitoring/Observability, Live Data Acceptance Review** (Phases 6–9).
- **The Data Quality Layer, Confidence Engine, cross-provider scoring, or provider trust ranking** — per the Architecture Team's L1-003 decision, deferred platform-wide to their own dedicated future Sprint.
- **Any change to `AssetsService`'s existing admin-gated CRUD authorization model** (ADMIN-only catalog mutation, S1-003/DEC-2026-004) unless explicitly approved as part of resolving Missing Decision #1 — this Brief does not assume that model changes.
- **Modifications to `TwelveDataMarketDataProvider`, `MarketSessionProvider`, `CalendarNewsProvider`, `CotProvider`, or any prior L1 Sprint's deliverable** — reused as-is.
- **L1-006 or any later Sprint.**

---

# Dependencies

- **Phase 1 (Live Market Data Provider)** — per the Blueprint's own Roadmap, Phase 5 depends on Phase 1, not merely Phase 0 (unlike L1-002/L1-003/L1-004). Satisfied by L1-001: the shared `MarketDataHttpClient` and the precedent of a real Twelve Data integration both already exist.
- **Resolution of Missing Decisions #1–#3 below** — this Sprint cannot be scoped precisely, let alone implemented, until they are resolved; unlike L1-004 (which had none), this Sprint has real, unresolved architectural questions.
- **Existing `AssetsService`, `MarketDataService.searchAssets()`, `Exchange`/`Market`/`Asset` Prisma models (S1-003)** — referenced, not assumed changed.

---

# Acceptance Criteria

*(Provisional — final criteria depend on Missing Decision resolutions.)*

1. `InstrumentMetadataProvider` is registered via DI exactly like every other Live Data domain — no consumer needs to know which concrete implementation is active.
2. Whatever catalog-write behavior is approved (if any) never creates a duplicate `Asset` row for a symbol+exchange pair that already exists — the Blueprint's own stated Key Risk for this Phase ("must join on symbol+exchange, never recreate existing Asset rows").
3. No new npm dependency introduced unless proven strictly necessary, flagged for `14_DEPENDENCY_POLICY.md` review if so.
4. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- Missing Decisions #1–#3 below explicitly resolved by the Architecture Team before implementation begins.
- Deliverables (to be finalized once resolved) complete and merged.
- Sprint Brief updated with Implementation Notes and a live-verification result, following the now-established pattern of recording environment-blocked verification as a documented constraint rather than a defect.

---

# Risks

1. **Catalog reconciliation** — the Blueprint's own stated Key Risk for this Phase: any live-driven Asset creation/update must join on symbol+exchange and never recreate an existing row. Directly depends on Missing Decision #1's resolution.
2. **Governance change risk** — if catalog auto-provisioning is approved, it would be the first time non-admin, non-human input creates or modifies rows in a table whose mutation has been ADMIN-gated since S1-003 (DEC-2026-004) — a meaningful precedent, not a routine provider swap.
3. **Live verification may be blocked by this session's environment egress policy**, consistent with the now-established pattern across `api.twelvedata.com`, `financialmodelingprep.com`, `finnhub.io`, `api.marketaux.com`, and `publicreporting.cftc.gov`.
4. **Abuse/cost risk on the on-demand Symbol Search path** — the Blueprint itself flags this (§7: "add a per-user cap on-demand endpoints... so one compromised account can't burn platform-wide provider quota"), relevant only if live Symbol Search is approved to replace or supplement the existing DB-only search.

---

# Missing Decisions

1. **What "replace seeded catalog with live `InstrumentMetadataProvider`" actually means for the existing `Asset` table.** The Roadmap's Phase 5 objective text says exactly this, but two very different scopes fit that sentence: (a) live Instrument Metadata/Symbol Search is purely **additive** — an on-demand vendor lookup layered on top of the existing, unchanged, admin-CRUD-seeded catalog, with no automatic writes to `Asset`/`Market`/`Exchange`; or (b) the platform begins **auto-provisioning** `Asset` rows from live search results when a user adds a not-yet-seeded symbol, which would be a governance change to the ADMIN-only catalog-mutation model established in S1-003 (DEC-2026-004) and directly implicates the Blueprint's own "never recreate existing Asset rows" Key Risk. **This Brief does not assume an answer.** The Architecture Team must specify which scope applies.
2. **Twelve Data vs. Finnhub role for this domain.** Blueprint §3 lists "Twelve Data | Finnhub (equities enrichment)" for Instrument Metadata and Asset Classification, and "Twelve Data | Finnhub" for Symbol Search — narrower framing than L1-003's News domain (where the Architecture Team explicitly required both providers from day one), but not unambiguously single-source either. **This Brief does not assume an answer.** The Architecture Team must specify whether Finnhub is in scope for this Sprint at all, or deferred entirely (matching L1-001's original single-primary-first precedent).
3. **Whether the existing `GET /market-data/search` endpoint (`MarketDataService.searchAssets()`, a raw DB-only Prisma query today, no provider involved) is replaced, supplemented, or left untouched.** If live Symbol Search is approved, it is not yet decided whether it becomes a new, separate endpoint (e.g. a live preview search distinct from the existing catalog search) or changes the existing endpoint's behavior. **This Brief does not assume an answer.**

---

# Verification Plan

*(Forward-looking, and provisional pending Missing Decision resolution.)*

1. **Unit tests**: provider normalization, factory fallback — no live network required.
2. **Integration tests**: provider implementation against mocked transport, mirroring every prior L1 Sprint's approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures, with particular attention to `AssetsService`/`MarketDataService.searchAssets()`/Watchlist "add by symbol" flows given this Phase's catalog-adjacent Key Risk.
4. **Live verification**: a real request to Twelve Data's reference-data/symbol-search endpoints (and Finnhub's, if Missing Decision #2 includes it), subject to this session's environment network-egress policy.
5. **Manual/observational check**: confirm no duplicate `Asset` rows are created for an already-seeded symbol+exchange pair, if any catalog-write behavior is approved.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 5 — "Instrument Metadata, Symbol Search & Classification" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 (Data Domain Inventory — Instrument Metadata, Symbol Search, Asset Classification rows), §3 (Provider Comparison Matrix — Instrument Metadata/Symbol Search/Asset Classification rows), §4.1 (Provider Abstraction — `InstrumentMetadataProvider` NEW), §7 (abuse-prevention note re: Symbol Search), §9 (Implementation Roadmap, Phase 5 row).
- **Next Blueprint Phase:** Phase 6 — Corporate Actions.

---

# Implementation Notes (resolutions to the Missing Decisions above)

Added after Architecture Team approval (2026-07-16). Implementation followed this Brief exactly.

1. **Missing Decision #1 (catalog governance) — resolved:** No automatic Asset creation. The existing Asset Catalog remains the single source of truth; live search never mutates the catalog. `MarketDataService.searchAssets()` never calls `prisma.asset.create()`/`upsert()` for live-provider results — verified live against a real PostgreSQL instance (a live-only search produced zero new `Asset` rows).
2. **Missing Decision #2 (provider role) — resolved:** Twelve Data only, covering Symbol Search, Instrument Metadata, and Exchange Metadata. Finnhub was not used; it remains dedicated to Financial News (L1-003).
3. **Missing Decision #3 (search endpoint) — resolved:** `GET /market-data/search` was kept, not replaced. Internally extended: catalog search first; only when the catalog returns zero matches does it fall back to `InstrumentMetadataProvider.searchSymbols()`; results are merged into a discriminated `AssetSearchResult[]` (`source: 'CATALOG' | 'LIVE'`) and never persisted.

**Files changed:**
- New (`apps/api/src/market-data/providers/`): `instrument-metadata-provider.interface.ts`, `instrument-metadata.schemas.ts`, `instrument-metadata.normalize.ts` (+ spec), `simulated-instrument-metadata.provider.ts`, `twelve-data-instrument-metadata.provider.ts` (+ spec), `instrument-metadata-provider.factory.ts` (+ spec).
- Modified: `market-data.service.ts` (+ spec) — `searchAssets()` merge logic, new `AssetSearchResult` type; `market-data.module.ts` — DI registration, reusing the existing `MARKET_DATA_MODE`/`TWELVE_DATA_API_KEY` flags (no new mode flag introduced).
- No changes to `MarketDataController`, `AssetsService`, `Exchange`/`Market`/`Asset` Prisma models, or any Watchlist/Portfolio consumer.

**Test summary:** 161/161 `apps/api` test suites passing, 837/837 tests (18 new tests); `apps/api` and `apps/web` build + lint clean.

**Live verification (2026-07-16):** Booted the API against a live local PostgreSQL instance. Catalog-hit search (`ZENDEMO`) returned the unchanged `CATALOG`-sourced result. Catalog-miss search returned a `LIVE`-sourced, Simulated-mode result with zero DB writes (confirmed directly against Postgres). A direct connectivity check to `api.twelvedata.com` (the same host as L1-001) found it still blocked by this session's environment egress policy — the same documented environment constraint, not re-investigated further per Architecture Team instruction.

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
- `documentation/zos/sprints/L1-003_SPRINT_BRIEF.md` (ZOS-L1-003)
- `documentation/zos/sprints/L1-004_SPRINT_BRIEF.md` (ZOS-L1-004) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004)
