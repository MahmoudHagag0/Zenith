# L1-007 SPRINT BRIEF — Macro Context (FRED)

**Document ID:** ZOS-L1-007
**Version:** 1.0
**Status:** Proposed
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-007
- **Sprint Name:** Macro Context (FRED)
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 7 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-17
- **Approved By:** *(pending — Status: Proposed)*
- **Baseline Sprints:** L1-001 through L1-006 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

1. Introduce a new `MacroDataProvider` interface — per Blueprint §4.1, this domain has **no existing provider abstraction** (listed alongside `InstrumentMetadataProvider`, `MarketSessionProvider`, `CorporateActionsProvider`), following the same new-interface precedent as L1-002/L1-005/L1-006.
2. Source macro/interest-rate time series from FRED (Federal Reserve Economic Data), the Blueprint's own sole-recommended source for this domain (§3 Provider Comparison Matrix: "Macro Context (new) | FRED | — | Free, authoritative, no reason to pay elsewhere") — no dual-source tension exists here, matching L1-004's (COT) precedent rather than L1-002/L1-003's dual-source ambiguity.
3. Resolve, not assume, how far this Sprint's integration reaches into the Blueprint's own stated deliverable — "richer, macro-aware Morning Brief/AI Workspace commentary" — since, unlike every prior L1 Sprint, this is the first Phase whose named deliverable requires a **consumer** (`NarrativeComposerService`/AI Workspace) to actually change its output, not merely a new data domain sitting behind an existing or new read endpoint.

---

# Scope

*(Deliberately narrow pending Missing Decision resolution — see below.)*

1. `MacroDataProvider` interface (new), proposed shape for Architecture Team confirmation:
   ```
   interface MacroDataProvider {
     readonly name: string;
     getLatestSeriesValue(seriesId: string): Promise<ProviderMacroSeriesValue>;
   }
   ```
   plus a `SimulatedMacroDataProvider`, matching every prior Sprint's Simulated-implementation-first precedent.
2. Zod raw-schema validation + `normalize()` mapping for FRED's series-observations endpoint.
3. A `createMacroDataProvider()` factory mirroring every prior Sprint's factory pattern.
4. A new, independent Prisma model for storing the latest (and historical) synced value per tracked FRED series — mirroring `CotReport`/`CorporateAction`'s natural-key + idempotent-upsert precedent (S1-035 origin). No existing model is touched.
5. `MacroDataSyncService` — daily cron, per Blueprint §6's own stated cadence for this domain ("`MacroDataSyncService` (FRED) — daily").
6. A minimal read path (a service method and/or endpoint returning the latest stored value per tracked series) — the shape depends on Missing Decision #1's resolution.
7. Whatever `NarrativeComposerService`/AI Workspace consumer integration is actually approved (Missing Decision #1) — **not specified further here**, since its shape depends entirely on that resolution.
8. Unit tests (normalization, factory fallback) and integration tests using mocked transport.

---

# Out of Scope

- **A general-purpose macroeconomic-series browser or dashboard** — this Sprint tracks a small, disclosed reference set of series (see Design Notes below), not an open-ended FRED catalog explorer.
- **The Data Quality Layer, Confidence Engine, cross-provider scoring, or provider trust ranking** — per the Architecture Team's L1-003 decision, deferred platform-wide.
- **Monitoring, Alerting & Cost Observability, Live Data Acceptance Review** (Phases 8–9).
- **Modifications to `InstrumentMetadataProvider`, `MarketSessionProvider`, `CalendarNewsProvider`, `CotProvider`, `CorporateActionsProvider`, or any prior L1 Sprint's deliverable** — reused as-is.
- **L1-008 or any later Sprint.**

---

# Dependencies

- **Phase 0** — per the Blueprint's own Roadmap ("Dependencies: Phase 0 only"), satisfied by L1-001 (credential loading, shared HTTP client, retry/circuit-breaker utilities).
- **Resolution of Missing Decision #1 below** — the Acceptance Criteria for any consumer-facing deliverable cannot be finalized until the Architecture Team specifies how far this Sprint's integration reaches.
- **Existing `NarrativeComposerService`/`MorningBriefService` (S1-020), `WorkspaceService` (Phase 5, post-S1-024 roadmap)** — referenced, not assumed changed, pending Missing Decision #1.

---

# Acceptance Criteria

*(Provisional — final criteria for item 3 depend on Missing Decision #1's resolution.)*

1. `MacroDataProvider` is registered via DI exactly like every other Live Data domain.
2. `MacroDataSyncService` runs daily (per Blueprint §6) and idempotently upserts the latest value per tracked series — reprocessing the same series/date never creates a duplicate row.
3. Whatever consumer-integration scope is approved (Missing Decision #1) is delivered exactly as scoped — no more, no less.
4. No new npm dependency introduced unless proven strictly necessary, flagged for `14_DEPENDENCY_POLICY.md` review if so.
5. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- Missing Decision #1 below explicitly resolved by the Architecture Team before implementation begins.
- Deliverables (finalized once resolved) complete and merged.
- Sprint Brief updated with Implementation Notes and a live-verification result, following the now-established pattern.

---

# Risks

1. **Consumer-integration scope ambiguity (Missing Decision #1)** — the Blueprint's own stated Key Risk for this Phase is explicitly "Narrative-composer template work (non-architectural)," implying the Blueprint itself expects some template-layer change, not just a new data domain — but neither `NarrativeComposerService` nor `WorkspaceService` currently has any macro-context extension point (confirmed by inspection: no "macro" reference exists anywhere in `apps/api/src/morning-brief/**` or `apps/api/src/workspace/**`), so the actual size of that change is not yet known.
2. **FRED series selection creep** — thousands of series exist; without a disclosed, bounded reference set this Sprint could expand indefinitely. Mitigated by starting with a small, named set (see Design Notes), mirroring L1-004's CFTC contract-mapping-table precedent.
3. **Live verification may be blocked by this session's environment egress policy**, consistent with the now-established pattern across `api.twelvedata.com`, `financialmodelingprep.com`, `finnhub.io`, `api.marketaux.com`, and `publicreporting.cftc.gov` — expected to recur, not re-investigated as a novel finding per the Architecture Team's standing instruction.
4. **FRED payload shape may differ from assumptions** in edge cases — the same class of risk every prior Live Data Sprint has encountered and resolved via Zod raw-schema rejection and graceful degradation.

---

# Missing Decisions

1. **How far this Sprint's integration reaches into Morning Brief / AI Workspace narrative generation.** The Blueprint's own Phase 7 deliverable is "richer, macro-aware Morning Brief/AI Workspace commentary," and its own stated Key Risk is "narrative-composer template work" — both implying real consumer-side changes are in scope, not merely a new backend data domain. Two materially different scopes fit the Blueprint's own text:
   - (a) **Provider-and-storage only**: implement `MacroDataProvider`, `MacroDataSyncService`, and a read path (service/endpoint) that stores and exposes the latest synced value per tracked series, with zero changes to `NarrativeComposerService`/`MorningBriefService`/`WorkspaceService` — deferring actual narrative-template consumption to a dedicated future Sprint, matching the precedent every other L1 Sprint has followed (new domain, existing consumers untouched or only minimally extended).
   - (b) **Full narrative integration**: additionally extend `NarrativeComposerService` (and/or `WorkspaceService`) to reference the latest macro series values in generated Morning Brief/AI Workspace text — a genuinely new kind of change no prior L1 Sprint has required, since S1-020's `NarrativeComposerService` currently only consumes `DashboardService.getDecisionCenter()`'s Confluence-derived output (DEC-2026-024/025), with no template branch for macro commentary today.
   - **This Brief does not assume an answer.** The Architecture Team must specify which scope applies before implementation begins.

---

# Verification Plan

*(Forward-looking, and provisional pending Missing Decision resolution.)*

1. **Unit tests**: provider normalization (FRED series-observation response), factory fallback behavior — no live network required.
2. **Integration tests**: provider implementation against mocked transport, mirroring every prior L1 Sprint's approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures, with particular attention to `NarrativeComposerService`/`MorningBriefService`/`WorkspaceService` if Missing Decision #1 resolves to option (b).
4. **Live verification**: a real request to FRED's series-observations endpoint, subject to this session's environment network-egress policy (untested against this host as of this Brief) — to be attempted and honestly reported, not faked or bypassed, per L1-001 through L1-006 precedent. Do not spend time attempting workarounds if blocked; record as `Approved — Live External Verification Pending (Environment Constraint)`.
5. **Manual/observational check**: confirm at least one tracked FRED series' latest value is stored and retrievable end-to-end with zero regression to any existing endpoint, before marking Done.

---

# Design Notes (disclosed, bounded implementation choices — not escalated)

- **FRED series reference set**: a small, disclosed starting set rather than exhaustive catalog coverage, mirroring L1-004's CFTC contract-mapping precedent — proposed candidates: `FEDFUNDS` (Federal Funds Effective Rate), `CPIAUCSL` (CPI, all urban consumers), `UNRATE` (Unemployment Rate), `GDP` (Gross Domestic Product). Extensible over time; not an architectural decision.
- **Persistence model**: a new, independent Prisma model (working name `MacroSeriesValue`), natural key `(seriesId, observationDate)`, `onDelete: Cascade`-equivalent cache/reference semantics (this data has no owning `Asset`/`Position` relation, unlike Corporate Actions) — reusing the exact idempotent-upsert convention established in S1-035 and every prior L1 Sprint.
- **Sync cadence**: daily, per Blueprint §6's explicit statement for `MacroDataSyncService`.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 7 — "Macro Context (FRED)" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 (Data Domain Inventory — Macro / Interest Rate Context row), §3 (Provider Comparison Matrix — Macro Context row; FRED vendor profile), §4.1 (Provider Abstraction — `MacroDataProvider` NEW), §6 (Synchronization Strategy — `MacroDataSyncService`, daily), §9 (Implementation Roadmap, Phase 7 row), Addendum §A2 (Provider Priority Matrix — Macro Context row), Addendum §A3 (SLA & Freshness Matrix — Macro Context row).
- **Next Blueprint Phase:** Phase 8 — Monitoring, Alerting & Cost Observability.

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
- `documentation/zos/sprints/L1-002_SPRINT_BRIEF.md` (ZOS-L1-002)
- `documentation/zos/sprints/L1-003_SPRINT_BRIEF.md` (ZOS-L1-003)
- `documentation/zos/sprints/L1-004_SPRINT_BRIEF.md` (ZOS-L1-004)
- `documentation/zos/sprints/L1-005_SPRINT_BRIEF.md` (ZOS-L1-005)
- `documentation/zos/sprints/L1-006_SPRINT_BRIEF.md` (ZOS-L1-006) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004)
