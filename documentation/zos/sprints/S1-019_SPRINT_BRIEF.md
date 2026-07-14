# S1-019 SPRINT BRIEF — Dashboard Backend Foundation

**Document ID:** ZOS-S1-019
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-019
- **Sprint Name:** Dashboard Backend Foundation
- **Milestone:** M2 — Product Implementation (first engineering sprint following Phase 2's product-definition work: `24_ZENITH_PRODUCT_CONSTITUTION.md`, `25_PRODUCT_BLUEPRINT.md`, `26_DASHBOARD_HOME_SPECIFICATION.md`, `27_ZENITH_EXPERIENCE_LANGUAGE.md`, all frozen)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`'s own execution-tracking convention; this is a normal engineering Sprint, distinct from the non-Sprint Phase 2 documentation work that preceded it)
- **Date Drafted:** 2026-07-14
- **Approved By:** Architecture Team / Product Leadership (2026-07-14 — full-lifecycle execution authorized directly in the Mission brief; Sprint Goals, required endpoint, resilience/performance/quality requirements, and explicit backend-only boundary were all specified by Product Leadership at Sprint-open time)

---

# Objective

Build the backend that lets Dashboard (Home) — specified in full at `26_DASHBOARD_HOME_SPECIFICATION.md` — exist as a real, servable screen. Per `25_PRODUCT_BLUEPRINT.md` §7/§10 and `26_DASHBOARD_HOME_SPECIFICATION.md` §4.4 (Dependency Map), Dashboard's own P0 components (`DASH-002`, and the annotation layer of `DASH-005`/`DASH-006`) are blocked on exactly two net-new backend components: a **Confluence Engine Consumer** and, later, a Narrative Composer (out of scope here — Blueprint Implementation Order step 2, not step 1). This sprint delivers step 1: the Consumer, shaped specifically to answer Dashboard's own Decision Center (`DASH-002`) requirements, not as a generic, speculative API surface. Every design choice below is justified by a specific Dashboard requirement already specified in `26_DASHBOARD_HOME_SPECIFICATION.md` §3 (DASH-002) — this Sprint does not invent product behavior; where `26` left a detail `TODO` (e.g. exact update cadence), this Sprint also leaves it unresolved rather than silently deciding it.

---

# Approved Scope

1. **Extend the Confluence Engine's own interface with one new, additive method** — `computeConfluenceWithEvidence(series): Promise<ConfluenceResultWithEvidence>` — returning both the existing `ConfluenceResult` (dimension aggregates, participation) *and* the raw per-Provider `AnalysisProviderResult[]` from the **same** execution run. **Rationale (architecture-level finding, not a Dashboard-local convenience):** `26_DASHBOARD_HOME_SPECIFICATION.md` §3 (DASH-002) requires Confidence explanation, Uncertainty explanation, and Traceability references per contributing Provider — none of which `ConfluenceResult` carries today (`confluence.types.ts` deliberately excludes full per-Provider payloads, ADR-007's own payload-size bound). The only alternative — the Consumer independently calling `PROVIDER_EXECUTION_ENGINE.runNewAnalysis()` a second time — would execute all nine Providers twice per instrument, directly violating this Sprint's own Performance and "no duplicated aggregation" requirements. This method is purely additive: `computeConfluence()`'s existing signature, behavior, and every existing caller are unchanged; both methods share one internal implementation (single execution run, single normalization pass), refactored so no aggregation logic is duplicated between them.
2. **`InstrumentReadingService`** (the Confluence Engine Consumer proper) — for one `assetId`, fetches a `MarketSeries` (via the existing `MarketSeriesService`, unchanged), calls `computeConfluenceWithEvidence()`, and synthesizes a Dashboard-ready `InstrumentReading`: the seven dimension confluences (reshaped, never re-aggregated), a bounded set of top contributing Providers with their own `LabeledConfidence` values (all four kinds, never collapsed into one number — Constitution §6.5/§12.6), `Limitations`-derived uncertainty text (Constitution §12.7), and the contributing Provider's own `TraceabilityRecord` passed through in-memory (no Trace Store exists yet — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Trace Store section remains explicitly deferred, consistent with `25_PRODUCT_BLUEPRINT.md` §9's own listed deferral; this Sprint does not build one). Honestly reports partial Provider participation (never fabricates agreement, never silently omits a non-participating Provider) — direct continuation of the Execution Engine's own existing partial-failure contract (ADR-006).
3. **Net-direction and Decision-Relevance ranking utility** — a small, explicitly-labeled ranking heuristic (documented as a ranking mechanism, never displayed or comparable to a `LabeledConfidence` value — Constitution §6.5) that determines, per instrument, whether the seven dimension confluences net `BULLISH`, `BEARISH`, or `NEUTRAL` (no qualifying reading), and a relevance score used only to order multiple qualifying instruments — never to imply certainty.
4. **`DashboardService`** — gathers the set of instruments a trader is tracking (the union of every `WatchlistItem`'s `assetId` across all of that trader's own Watchlists, and every open `Position`'s `assetId` — `quantity > 0` — across all of that trader's own Portfolios, per `26_DASHBOARD_HOME_SPECIFICATION.md` §3 DASH-002 Inputs), computes an `InstrumentReading` for each (via WP2, reused, never recomputed per caller), ranks qualifying instruments (via WP3), and assembles the Decision Center response — including honest disclosure when an individual instrument's own computation fails (e.g. a data-layer error), distinct from and never conflated with "this instrument yields no qualifying reading."
5. **`DashboardController`** — `GET /dashboard/decision-center`, JWT-authenticated (`JwtAuthGuard`, existing pattern), scoped to the requesting trader only, returning a Dashboard-shaped response — never an internal `ConfluenceResult`, `AnalysisProviderResult`, or Prisma-shaped entity directly. Only this one endpoint is implemented this Sprint (the concrete requirement of Approved Scope item 4/Sprint Goal 3); the `DashboardModule` is structured so a later Watchlist/Portfolio annotation endpoint can reuse `InstrumentReadingService` without rebuilding it, but no such endpoint is added now (no screen specification for Watchlist/Portfolio yet exists — building one now would be scope drift ahead of its own future specification).
6. **Dashboard-facing DTO types** (`dashboard.types.ts`) — the exact, bounded shape `GET /dashboard/decision-center` returns; deliberately narrower than any internal type, per the Mission's own "expose exactly what Dashboard needs... avoid leaking internal implementation details."
7. **A short-TTL, in-process cache** for `InstrumentReading` keyed by `assetId`, reusing the existing `ComputationCacheService` utility class (already used inside `analysis-engine`, instantiated fresh here rather than duplicated) — avoids recomputing the same instrument's Confluence synthesis across near-simultaneous requests, directly addressing this Sprint's Performance requirement and the Dashboard Specification's own Engineering Observation 1 (aggregation cost).
8. **Comprehensive unit and integration tests** covering: the additive Confluence method (no behavior change to the existing method; both share one execution run), instrument gathering (watchlist ∪ portfolio, deduplicated), partial-instrument-failure handling, the empty/no-opportunity state, the degraded/total-failure state, ranking determinism, cache reuse, and controller-level auth/ownership scoping.
9. **Module wiring**: new `DashboardModule` (imports `AnalysisEngineModule`, `WatchlistsModule` or direct `DatabaseModule` access per the existing `AnalyticsModule` precedent, `PortfoliosModule`, `AuthModule`), registered in `AppModule`.

---

# Out of Scope

- **No UI, no React, no Flutter, no styling, no animation, no Figma** — explicitly excluded by the Mission; this Sprint produces HTTP JSON responses only.
- **No Narrative Composer** — Blueprint Implementation Order step 2, a separate, later Sprint; `DASH-004` (Morning Brief Entry) is not implemented here.
- **No Watchlist Snapshot (`DASH-005`) or Portfolio Snapshot (`DASH-006`) annotation endpoint** — no screen specification for Watchlist or Portfolio exists yet (`25_PRODUCT_BLUEPRINT.md` §10 places their own specifications after Dashboard); `InstrumentReadingService` is built reusably for them, but no endpoint is added speculatively.
- **No Trace Store / persisted trace-by-ID mechanism** — remains an explicitly deferred item (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Trace Store; `25_PRODUCT_BLUEPRINT.md` §9). Traceability is returned in-memory, per-request, exactly as every Provider already produces it.
- **No change to any Analysis Provider, the Execution Engine, the Normalized Vocabulary Schema, or `ConfluenceService.computeConfluence()`'s existing behavior.** Only one new, additive method is added to the Confluence Engine's own interface.
- **No push/real-time infrastructure (WebSocket/SSE).** `26_DASHBOARD_HOME_SPECIFICATION.md`'s own Update Behaviour fields remain `TODO` for every component; this Sprint does not resolve that question, and the endpoint built here is a plain request/response GET.
- **No modification to `24_ZENITH_PRODUCT_CONSTITUTION.md`, `25_PRODUCT_BLUEPRINT.md`, `26_DASHBOARD_HOME_SPECIFICATION.md`, or `27_ZENITH_EXPERIENCE_LANGUAGE.md`** — all four remain frozen, cited only.
- **No new Prisma model.** All data consumed already exists (`Watchlist`/`WatchlistItem`, `Portfolio`/`Position`, `Asset`, plus the existing Analysis Engine surface).

---

# Affected Components

- `apps/api/src/analysis-engine/confluence/confluence.types.ts`, `confluence.tokens.ts`, `confluence.service.ts`, `confluence.service.spec.ts` (additive method only).
- `apps/api/src/dashboard/**` (new module: `dashboard.module.ts`, `dashboard.types.ts`, `instrument-reading.service.ts`, `dashboard.service.ts`, `dashboard.controller.ts`, `net-direction-ranking.util.ts`, plus `.spec.ts` for each).
- `apps/api/src/app.module.ts` (register `DashboardModule`).
- `documentation/zos/11_DECISION_LOG.md`, `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (documents the additive Confluence Engine method as the first real Consumer's own extension — anticipated by that document's own Trace Store/Future Compatibility sections), `documentation/zos/09_PROJECT_BRAIN.md`, `documentation/zos/00_INDEX.md`, `documentation/ai/00_AI_INDEX.md`, `documentation/zos/08_ROADMAP.md`.

---

# Dependencies

None anticipated. No new runtime or development dependency — this Sprint composes only already-approved, already-installed modules (`@nestjs/common`, existing Prisma client, existing Analysis Engine surface).

---

# Assigned Implementation Engineer

Implementation Engineer (AI), operating under the standing autonomous full-lifecycle execution authorization established across S1-007 through S1-018 and reaffirmed for this Sprint by Product Leadership's own Mission brief.

---

# Definition of Done

Per `07_ENGINEERING_WORKFLOW.md`: Approved Scope fully implemented; no unauthorized change to any file outside Affected Components; full test suite passing; build/lint/turbo clean; a completion report submitted; Decision Log entries recorded for every implementation-time calibration (default lookback window, ranking-score formula, bounded top-N sizes, cache TTL); Project Brain, AI Index, and Index updated; Sprint formally closed.

---

# Required Deliverables

Source code (Approved Scope items 1-9), tests (item 8), updated documentation (Decision Log, Project Brain, AI Index, Index, Roadmap, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`), a completion report including validation results, performance observations, risks, and non-binding future recommendations (per the Mission's own "After Implementation" requirement).

---

# Escalation Triggers

Per `10_AI_ENGINEER_GUIDE.md`: stop and escalate if a new runtime dependency becomes necessary, if a change to any Provider/Execution Engine/Confluence Engine *beyond* the one additive method in Scope item 1 appears required, if `26_DASHBOARD_HOME_SPECIFICATION.md`'s own Psychological Objective for DASH-002 appears to conflict with a technical constraint, or if building the Decision Center endpoint reveals that a Watchlist/Portfolio-specific endpoint is unavoidably required now rather than deferrable.

---

# Missing Decisions (Anticipated Implementation-Time Calibration)

The following are genuinely undecided by any prior document and are expected to be resolved during implementation, recorded in a Decision Log entry exactly as every Provider Sprint's own calibration was (DEC-2026-009 through DEC-2026-023 precedent) — these are implementation calibration, not architecture:

1. **Default historical lookback window** for the `MarketSeries` fetched per instrument (calendar days of daily candles). No prior document specifies this; each Provider already degrades gracefully (via its own `Limitations`/non-participation reporting) when given insufficient bars, so this is a performance/coverage trade-off, not a correctness-blocking one.
2. **Bounded top-N sizes**: how many top-contributing Providers appear per `InstrumentReading`, and how many ranked opportunities appear in one Decision Center response.
3. **The relevance-ranking formula's** exact shape (beyond "net dimension agreement, magnitude-weighted, explicitly not a Confidence value").
4. **Cache TTL** for `InstrumentReading` reuse.
5. **Whether "zero tracked instruments" (an empty Watchlist and no open Positions) is reported as `NO_CLEAR_OPPORTUNITY`** (the closest existing Product Rule 9-governed state) rather than a distinct state `26_DASHBOARD_HOME_SPECIFICATION.md` does not itself define.

---

# Approval Status

- [x] Approved

---

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md`
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md`
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md`
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/12_ADR_INDEX.md`
- `documentation/zos/11_DECISION_LOG.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/08_ROADMAP.md`
