# L1-001 SPRINT BRIEF — Provider Access & Config Foundation

**Document ID:** ZOS-L1-001
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Proposed — Awaiting Architecture Team Review (this Sprint Brief authorizes no implementation; per `10_AI_ENGINEER_GUIDE.md`'s Required Workflow, work begins only once Approval Status below is marked Approved)

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** L1-001
- **Sprint Name:** Provider Access & Config Foundation
- **Milestone:** M3 — Live Data Platform (per `08_ROADMAP.md`; first Sprint of this Milestone)
- **Phase:** Phase 0 of the Implementation Roadmap in `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9
- **Date Drafted:** 2026-07-16
- **Approved By:** *(pending — not yet approved)*

---

# Objective

Lay the zero-behavior-change infrastructure foundation Live Data implementation depends on, exactly as scoped by `28_LIVE_DATA_BLUEPRINT.md` §9, Phase 0: wire configuration for the providers the Blueprint selected (Twelve Data, Finnhub, FMP, MarketAux, FRED — CFTC needs no key), and build a shared, vendor-agnostic HTTP client utility with timeout, retry, and circuit-breaker behavior. **No real provider is implemented, no `Simulated*Provider` is replaced, and no existing DI registration changes in this Sprint.** Every existing API response remains exactly as it is today; this Sprint is purely additive scaffolding that later Sprints (`L1-002` onward, per the Blueprint's own Phase 1+) will build real provider implementations against.

---

# Approved Scope

1. **Provider credential configuration.** Extend the existing `ConfigService`-based environment-variable pattern (the same pattern already used for `JWT_SECRET`, `DATABASE_URL`) with placeholders for `TWELVE_DATA_API_KEY`, `FINNHUB_API_KEY`, `FMP_API_KEY`, `MARKETAUX_API_KEY`, and `FRED_API_KEY`. Document each as optional/unset-safe in local development (no provider client reads them yet this Sprint — wiring only, per `28_LIVE_DATA_BLUEPRINT.md` §7). CFTC requires no key (public Open Data API, per ZOS-028 §2) and is not part of this configuration set.
2. **Shared HTTP client utility** — a single, vendor-agnostic wrapper (exact name/location is a Missing Decision below) providing: a configurable per-call timeout (5s connect / 10s total default, per ZOS-028 §4.5), reuse of the existing `retry.util` exponential backoff (S1-005), and reuse of the existing Analysis Engine circuit breaker (S1-008, `provider-circuit-breaker.spec.ts`) generalized so it can wrap an HTTP call, not only an in-process Provider invocation — per ZOS-028 §4.6's explicit instruction to reuse rather than reimplement. This utility is not bound to any specific vendor and makes no live network call to any of the five configured providers in this Sprint.
3. **Structured logging fields.** Extend the existing `nestjs-pino` logger configuration with `provider` and `domain` structured fields and field-level redaction for anything containing `key`/`token`/`secret` (per ZOS-028 §7 and §4.9), so every future provider integration inherits safe-by-default logging from day one rather than each Sprint reimplementing redaction.
4. **Unit tests** for the shared HTTP client utility only: timeout behavior, retry/backoff behavior, and circuit-breaker state transitions, all against a mocked transport. No test in this Sprint makes a real network call to any vendor.
5. **`14_DEPENDENCY_POLICY.md` review**, if the research in Missing Decision 2 below concludes a new HTTP client dependency is actually required (native `fetch` — available in the Node runtime already in use — may already be sufficient, in which case no new dependency is introduced at all).

---

# Out of Scope

- **No real provider implementation** for Twelve Data, Finnhub, FMP, MarketAux, CFTC, or FRED — these are `28_LIVE_DATA_BLUEPRINT.md` §9 Phases 1, 3, 4, and 7 respectively, each its own future Sprint Brief.
- **No DI registration change.** `MARKET_DATA_PROVIDER`, `CALENDAR_NEWS_PROVIDER`, and `COT_PROVIDER` remain bound to their existing `Simulated*Provider` implementations, unmodified.
- **No new Prisma models or schema changes.**
- **No Market Sessions/Trading Holidays** (Blueprint Phase 2), **Instrument Metadata/Symbol Search** (Phase 5), **Corporate Actions** (Phase 6), or **Macro Context narrative integration** (Phase 7) work — each is its own later Sprint.
- **No Data Quality Layer, Provider Priority Matrix/failover, or Data Confidence Engine implementation** (Addendum §A1, §A2, §A6) — these operate on real multi-provider data that does not exist until later Phases; building them now would have nothing real to validate against.
- **No streaming/WebSocket/SSE work** (Addendum §A5) — explicitly a future architectural direction, not scheduled on the roadmap at all yet.
- **No UI or `apps/web` change of any kind.**
- **No modification to `28_LIVE_DATA_BLUEPRINT.md`** — frozen, cited only.

---

# Affected Components

- A new shared infrastructure location under `apps/api/src/` — exact path is a Missing Decision below (candidates: a new `live-data-common` module, or a `common/` subdirectory analogous to the Analysis Engine's own `analysis-engine/common`).
- `apps/api/.env.example` (or equivalent) — new placeholder variable names only, no real keys committed.
- `apps/api/src/app.module.ts` — only if the new shared utility is delivered as its own registered module rather than a plain exported provider class (Missing Decision).
- `documentation/zos/11_DECISION_LOG.md`, `documentation/zos/09_PROJECT_BRAIN.md`, `documentation/zos/08_ROADMAP.md`, `documentation/ai/00_AI_INDEX.md` — standard sprint-closure documentation updates.

---

# Dependencies

None anticipated if native `fetch` (already available in the Node runtime this project targets) is sufficient for the shared HTTP client. If research at implementation time concludes a dedicated HTTP client library is required, that is an **escalation trigger** requiring `14_DEPENDENCY_POLICY.md` review and Architecture Team approval before use — not a pre-approved dependency of this Brief.

---

# Assigned Implementation Engineer

Implementation Engineer (AI) — **pending explicit confirmation** from the Architecture Team on whether the standing full-lifecycle autonomous-execution authorization used for recent Sprints (S1-019, S1-020, per their own Mission briefs) extends to this new Milestone (M3), or whether a fresh authorization statement is required for Live Data work specifically. Flagged here as an open question for the Architecture Team's approval decision, not assumed.

---

# Definition of Done

Per `07_ENGINEERING_WORKFLOW.md`: Approved Scope fully implemented; no unauthorized change to any file outside Affected Components; every existing test suite still passing with zero regressions (in particular: every existing `market-data`, `calendar-news`, and `cot` test continues to exercise the unmodified `Simulated*Provider` bindings); build/lint/turbo clean; a completion report submitted; a Decision Log entry recorded for every implementation-time calibration (shared-utility naming/location, HTTP client choice, circuit-breaker code-sharing mechanism); Project Brain/AI Index/Roadmap updated; Sprint formally closed.

---

# Required Deliverables

Per `07_ENGINEERING_WORKFLOW.md`: source code (shared HTTP client utility, config wiring, logging redaction), updated documentation, a completion report, and a final assessment confirming zero behavior change to any existing endpoint.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, the assigned engineer must stop and escalate to the Architecture Team if: a new runtime dependency is required beyond what `14_DEPENDENCY_POLICY.md` already permits; the circuit breaker cannot be reused from the Analysis Engine without an architecture-level change (e.g., requiring promotion into a shared package); requirements are unclear or conflicting; or any scope expansion toward an actual provider implementation is requested.

---

# Missing Decisions (Anticipated Implementation-Time Calibration)

1. **Shared utility naming and location** — e.g. `apps/api/src/live-data-common/` as a new top-level module vs. extending `apps/api/src/market-data/` with a vendor-agnostic subdirectory. Both are consistent with `05_ARCHITECTURE.md`'s existing module boundaries; the choice affects only where later provider Sprints (`L1-002`+) will import from, not any behavior.
2. **HTTP client choice** — whether native `fetch` (no new dependency) is sufficient for the timeout/retry/abort behavior this utility needs, or whether a dedicated library is genuinely required. This is research to perform at implementation time, not a decision made by this Brief; per the Dependencies section above, a new library requires escalation.
3. **Circuit-breaker code-sharing mechanism** — whether the existing Analysis Engine circuit breaker (`apps/api/src/analysis-engine/providers/provider-circuit-breaker.ts`) is imported directly, or promoted into a shared package (e.g. `packages/utils`) so `analysis-engine` and the new Live Data infrastructure do not create a direct cross-module dependency on each other. `05_ARCHITECTURE.md`'s Dependency Rules favor shared packages over direct cross-application-module coupling; this Sprint should default to promotion into `packages/utils` unless that proves disproportionate to the single reused utility, disclosed via Decision Log either way.
4. **Placeholder-vs-example env file convention** — whether new variable placeholders are added to a committed `.env.example`-style file (if one exists) or documented inline in `04_TECH_STACK.md`/this Sprint's own completion report, matching whatever convention the existing `JWT_SECRET`/`DATABASE_URL` variables already follow.

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [ ] Approved
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
- `documentation/zos/12_ADR_INDEX.md` (ADR-003 — Market Data Provider Abstraction; ADR-004 — Background Job Scheduling for Market Data Synchronization; this Sprint builds infrastructure adjacent to both without amending either)
