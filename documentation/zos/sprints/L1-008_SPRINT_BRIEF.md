# L1-008 SPRINT BRIEF — Monitoring, Alerting & Cost Observability

**Document ID:** ZOS-L1-008
**Version:** 1.0
**Status:** Proposed
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-008
- **Sprint Name:** Monitoring, Alerting & Cost Observability
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 8 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-17
- **Approved By:** *(pending — Status: Proposed)*
- **Baseline Sprints:** L1-001 through L1-007 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

Per Blueprint §9 Phase 8: "Extend provider-health/observability to all live providers; add usage/cost-per-provider dashboards," with stated deliverables "Extended `/health`; visible usage/cost metrics; documented alert thresholds." Concretely:

1. **Extend the existing `/api/v1/market-data/provider-health` endpoint pattern to cover every live provider integrated since L1-001** (Twelve Data/Market Data, Internal Market Sessions, Finnhub+MarketAux/Calendar-News, CFTC/COT, Finnhub/Corporate Actions, Twelve Data/Instrument Metadata, FRED/Macro Data) — per §4.9's own explicit instruction, "rather than inventing new endpoints."
2. **Extend `ObservabilityService` counters** (S1-007) for provider call count, success/fail, latency, and cache hit rate — per §4.9's second bullet, verbatim.
3. **Extend `nestjs-pino` structured logs** with `provider` and `domain` fields — per §4.9's third bullet, verbatim.
4. **Add visible usage/cost-per-provider metrics** — per §8 Cost Analysis, cost is driven by request volume per distinct vendor, not vendor billing-API integration (no vendor's billing/quota API was ever contemplated by the Blueprint).
5. **Document alert thresholds** — per the Blueprint's own explicit deliverable wording ("documented alert thresholds"), pending resolution of Missing Decision #1 below on what "Alerting" concretely means in this Sprint.

This Sprint is explicitly operational infrastructure, not a feature Sprint: no new market-facing capability, no Dashboard/AI Workspace/Morning Brief change, no Data Quality Layer, no Confidence Engine.

---

# Scope

*(Deliberately narrow pending Missing Decision resolution — see below.)*

1. `checkHealth(): Promise<ProviderHealthStatus>` added to the five provider interfaces that do not yet have it — `CalendarNewsProvider`, `CotProvider`, `CorporateActionsProvider`, `InstrumentMetadataProvider`, `MacroDataProvider` — reusing the exact `ProviderHealthStatus` (`'UP' | 'DOWN'`) type already established by `MarketDataProvider`/`MarketSessionProvider` (ADR-003). Mechanism depends on Missing Decision #2.
2. A new aggregator — proposed `MonitoringModule`/`MonitoringService` — that reads each domain's own provider health via constructor-injected domain services, mirroring `WorkspaceModule`/`WorkspaceService`'s already-established "aggregator imports N existing domain modules" pattern (no new architectural shape). Exposes one extended endpoint, e.g. `GET /monitoring/provider-health`, returning a per-provider array (status, last-checked, call counts) — additive; the existing `GET /market-data/provider-health` single-provider endpoint is unchanged for backward compatibility.
3. `ObservabilityService` extension (or an equivalent counters mechanism at the layer Missing Decision #3 resolves to) for provider call count, success/fail, latency, cache hit rate — surfaced via the same monitoring endpoint.
4. Structured log fields (`provider`, `domain`) added at existing log call sites in each provider/service, reusing `nestjs-pino`'s existing redaction configuration (no new logging dependency).
5. Documented alert thresholds — shape depends on Missing Decision #1.
6. Unit tests (aggregation logic, counter extension, health-check additions) and integration tests using mocked transport.

---

# Out of Scope

- **New market features, Dashboard redesign, AI Workspace changes, Morning Brief changes, narrative generation, the Zenith Intelligence Layer.**
- **The Data Quality Layer, Confidence Engine, cross-provider scoring, or provider trust ranking** — per the Architecture Team's L1-003 decision, deferred platform-wide.
- **Vendor billing-API integration** — "cost observability" in this Sprint means request-volume metrics already observable from Zenith's own side, not querying any vendor's account/billing API (none of Twelve Data/Finnhub/FMP/MarketAux/CFTC/FRED were ever scoped for this).
- **Horizontal-scaling concerns** (multi-instance cron de-duplication, Redis L1 cache) — per Blueprint §4.10, "documented deferral, not a redesign," explicitly out of scope until Zenith actually scales beyond a single instance.
- **Phase 9 — Live Data Acceptance Review.**
- **L1-009 or any later Sprint.**

---

# Dependencies

- **Phases 0–7** — per the Blueprint's own Roadmap, satisfied by L1-001 through L1-007 (every live provider this Sprint must extend monitoring to already exists).
- **Resolution of Missing Decisions #1–#3 below.**
- **Existing `MarketDataService.checkProviderHealth()`, `ProviderCircuitBreaker` (ADR-006), `ObservabilityService` (S1-007), `WorkspaceModule`'s aggregator pattern (S1-033)** — referenced, not assumed changed except as explicitly scoped above.

---

# Acceptance Criteria

*(Provisional — final criteria for items 2–3 depend on Missing Decision resolutions.)*

1. Every live provider integrated since L1-001 reports a health status through one extended, existing-pattern endpoint — no new, parallel per-domain health endpoints invented.
2. Provider call count, success/fail, latency, and cache hit rate are visible per provider, sourced from real (not fabricated) counters.
3. Whatever alerting mechanism is approved (Missing Decision #1) is delivered exactly as scoped — no outbound notification channel is introduced unless explicitly approved.
4. No existing endpoint's response shape changes in a breaking way — `GET /market-data/provider-health` continues to return exactly what it returns today.
5. No new npm dependency introduced unless proven strictly necessary, flagged for `14_DEPENDENCY_POLICY.md` review if so.
6. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- Missing Decisions #1–#3 below explicitly resolved by the Architecture Team before implementation begins.
- Deliverables (finalized once resolved) complete and merged.
- Sprint Brief updated with Implementation Notes and a live-verification result, following the now-established pattern.

---

# Risks

1. **Fabricated vendor health-check endpoints** — if Missing Decision #2 resolves toward live-ping health checks, Finnhub/MarketAux/CFTC/FRED's actual lightweight "ping"/"usage" endpoints (if any exist) are not yet confirmed against real vendor documentation in this session, mirroring the same class of risk L1-004 disclosed for its CFTC resource ID.
2. **Silent miscounting of Live Data provider failures** — `ObservabilityService.measureAsync()`'s existing rejection-detection only recognizes `ComputationRejectedError`-shaped errors (by `error.name`); Live Data providers throw `ProviderUnavailableError`/`ProviderRateLimitedError` instead. Reusing it naively would report 0% failure rate regardless of real provider outages — a correctness risk, not just a style question, hence Missing Decision #3.
3. **Reverse-dependency risk if resolved incorrectly** — extending `/market-data/provider-health` by having `MarketDataModule` directly import `CalendarNewsModule`/`CotModule`/`CorporateActionsModule`/`MacroDataModule` would invert the current one-directional dependency flow (those modules already import from `MarketDataModule`, never the reverse) and risks a circular-import failure. Mitigated by the proposed new, separate `MonitoringModule` (Scope item 2), which imports every domain module without being imported back by any of them — mirroring `WorkspaceModule`'s already-proven shape exactly.
4. **Live verification may be blocked by this session's environment egress policy**, consistent with the now-established pattern across every prior Live Data Sprint — expected to recur, not re-investigated as a novel finding.

---

# Missing Decisions

1. **What "Alerting" concretely means in this Sprint.** The Sprint's own name lists "Alerting" as a first-class deliverable alongside Monitoring and Cost Observability, and the Blueprint's own stated deliverable is "documented alert thresholds" — but Zenith already has an entirely separate, user-facing `Alert`/`AlertsService` domain (Phase 2 of the post-S1-024 roadmap: per-user, per-asset price-condition alerts with `targetPrice`/`conditionType`), unrelated to operational/provider monitoring. Two materially different scopes fit the Blueprint's own text:
   - (a) **Structured logging + documented thresholds only**: extend existing `Logger.warn()` call sites (already present in every `*SyncService`, e.g. `CotSyncService`'s "sync failed for asset X" pattern) with clear, named threshold conditions (e.g., "circuit open for a provider," "sync failure rate > 50% over a rolling window") written into this Sprint's documentation — operations staff observe via existing logs/the new monitoring endpoint, no new persisted record, no outbound notification channel, and critically, no reuse of or connection to the unrelated user-facing `Alert` domain.
   - (b) **A new operational-incident mechanism**: persist a new record (e.g., `ProviderIncident`) and/or wire an outbound notification channel (email/Slack/webhook) when a threshold is breached — a materially larger scope requiring a new Prisma model and/or a new external integration and credential, which Blueprint §4.9 does not explicitly request (it only names logging and counters, not a new persisted alert/notification concept).
   - **This Brief does not assume an answer.** The Architecture Team must specify which scope applies before implementation begins.

2. **How the extended provider-health check should determine UP/DOWN for the five newer domains** (Calendar/News, COT, Corporate Actions, Instrument Metadata, Macro Data), given the codebase already contains two different, conflicting precedents:
   - (a) **Live ping call** — mirror `TwelveDataMarketDataProvider.checkHealth()`'s exact existing pattern: a dedicated, lightweight live request per vendor (Twelve Data currently calls its own `/api_usage` endpoint), converted to `UP`/`DOWN` via try/catch. Requires a genuine, confirmed-lightweight endpoint per vendor (Finnhub, MarketAux, CFTC, FRED) — not yet verified against real vendor documentation in this session — and consumes real API budget on every health check, working somewhat against this Sprint's own cost-observability goal.
   - (b) **Passive circuit-breaker-derived signal** — mirror the Analysis Engine's already-built `ProviderHealthTracker`/`provider-health.util.ts` (S1-008) precedent instead: derive `UP`/`DOWN` from each domain's already-tracked `ProviderCircuitBreaker` state (open/closed, consecutive failures), recorded automatically by every existing `MarketDataHttpClient` call during normal sync/read operation — zero new network calls or cost impact, but requires adding a small, disclosed public accessor to the shared `MarketDataHttpClient` class (currently its `ProviderCircuitBreaker` instance is private, with no external getter) so a provider's `checkHealth()` can read it.
   - **This Brief does not assume an answer.** The Architecture Team must specify which mechanism this Sprint implements — a materially different choice for correctness (risk 1) and cost (this Sprint's own stated goal).

3. **Where "success/fail" call counts for Live Data providers should be recorded.** Blueprint §4.9 explicitly says "Extend `ObservabilityService` counters," but that service's existing `measureAsync()` only recognizes `ComputationRejectedError`-shaped errors as failures (by `error.name`) — a type Live Data providers never throw (they throw `ProviderUnavailableError`/`ProviderRateLimitedError` instead). Two paths satisfy the Blueprint's instruction differently:
   - (a) **Broaden `ObservabilityService`'s own failure-detection** to also recognize `ProviderUnavailableError`/`ProviderRateLimitedError` — a small, shared-class change touching a service already used by all 9 Analysis Providers; must not alter any existing Analysis Provider's own recorded rejection semantics.
   - (b) **Record provider call count/success/fail/latency at the `MarketDataHttpClient` layer instead** (the one place every Live Data provider call already funnels through), leaving `ObservabilityService` itself untouched — arguably a cleaner "extend the shared HTTP client" fit, but not literally what §4.9 names.
   - **This Brief does not assume an answer.**

---

# Verification Plan

*(Forward-looking, and provisional pending Missing Decision resolution.)*

1. **Unit tests**: new `checkHealth()` implementations per domain, `MonitoringService` aggregation logic, counter-extension logic — no live network required (or zero *additional* live network calls, if Missing Decision #2 resolves to (b)).
2. **Integration tests**: monitoring endpoint assembled from mocked domain services, mirroring `WorkspaceService`'s own existing test approach.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures, with particular attention to `MarketDataController`'s existing `/market-data/provider-health` endpoint (must remain byte-for-byte unchanged) and to any existing Analysis Provider test relying on `ObservabilityService`'s current rejection semantics (if Missing Decision #3 resolves to (a)).
4. **Live verification**: subject to this session's environment network-egress policy — if Missing Decision #2 resolves to (a) (live ping calls), real requests to each vendor's health-check endpoint; if (b), this Sprint requires no *new* live network calls at all beyond what L1-001 through L1-007 already established, and verification instead confirms the aggregated signal correctly reflects each domain's already-tested circuit-breaker state.
5. **Manual/observational check**: confirm the extended monitoring endpoint returns a status for all seven live-provider domains with zero regression to any existing endpoint, and confirm structured logs carry the new `provider`/`domain` fields with correct redaction, before marking Done.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 8 — "Monitoring, Alerting & Cost Observability" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §4.9 (Monitoring, health checks, logging, metrics — EXTEND existing), §4.10 (Scalability — documented deferral), §8 (Cost Analysis), §9 (Implementation Roadmap, Phase 8 row).
- **Next Blueprint Phase:** Phase 9 — Live Data Acceptance Review.

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
- `documentation/zos/sprints/L1-006_SPRINT_BRIEF.md` (ZOS-L1-006)
- `documentation/zos/sprints/L1-007_SPRINT_BRIEF.md` (ZOS-L1-007) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004, ADR-006)
