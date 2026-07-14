# S1-019_TASK_BREAKDOWN

**Document ID:** AI-045
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-019_SPRINT_BRIEF.md` (Dashboard Backend Foundation), based strictly on that Brief, `26_DASHBOARD_HOME_SPECIFICATION.md`, and the existing Analysis Engine surface (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007). Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it.

# Proposed Module Layout

`apps/api/src/dashboard/` (new):

- `dashboard.types.ts` — Dashboard-facing DTOs only (`InstrumentReading`, `DecisionCenterResponse`, `RankedOpportunity`, `ContributingProviderView`, `LabeledConfidenceView`, `TraceabilityView`). Never re-exports an internal Analysis Engine type directly.
- `net-direction-ranking.util.ts` — Scope item 3 (net direction + relevance score, pure function, unit-testable in isolation).
- `instrument-reading.service.ts` — Scope item 2 (the Confluence Engine Consumer proper), consumes `ConfluenceEngine.computeConfluenceWithEvidence()` and the new caching layer.
- `dashboard.service.ts` — Scope item 4 (instrument gathering, orchestration, partial-failure handling, Decision Center assembly).
- `dashboard.controller.ts` — Scope item 5.
- `dashboard.module.ts` — Scope item 9.
- `*.spec.ts` per file above.

`apps/api/src/analysis-engine/confluence/` (extended, not replaced):

- `confluence.types.ts` — add `ConfluenceResultWithEvidence`, `ParticipatingProviderResult`.
- `confluence.tokens.ts` — extend the `ConfluenceEngine` interface with `computeConfluenceWithEvidence`.
- `confluence.service.ts` — refactor to share one internal run/normalize path between `computeConfluence()` and the new method.
- `confluence.service.spec.ts` — extended, existing assertions unchanged.

---

# Work Package 1 — Extend `ConfluenceEngine` with `computeConfluenceWithEvidence` (Scope item 1)

- **Deliverables:** `ConfluenceResultWithEvidence` and `ParticipatingProviderResult` types; interface extension; `ConfluenceService` refactored so both methods share one execution run and one normalization pass; no change to `computeConfluence()`'s own return value for any existing test fixture.
- **Acceptance Criteria:** every existing `confluence.service.spec.ts`/`confluence.golden-dataset.spec.ts` assertion still passes unmodified; a new test asserts `computeConfluenceWithEvidence()` returns a `confluence` field deep-equal to what `computeConfluence()` would return for the same series, plus a `providerResults` array containing exactly the participating Providers' own raw `AnalysisProviderResult`.
- **Verification Steps:** run `confluence.service.spec.ts` before and after the refactor; diff output shapes.
- **Risks:** accidentally changing `computeConfluence()`'s own behavior while refactoring its shared internals — mitigated by keeping `computeConfluence()` as a thin wrapper calling the new shared private method and discarding `providerResults`.
- **Completion Criteria:** both methods pass their own full test suite; `ANALYSIS_PROVIDERS`/Execution Engine/Normalized Vocabulary Schema untouched.

# Work Package 2 — `InstrumentReadingService` (Scope item 2)

- **Deliverables:** `getInstrumentReading(assetId): Promise<InstrumentReading>`, composing `MarketSeriesService.getSeries()` (default lookback window, Missing Decision 1) and `computeConfluenceWithEvidence()`; maps `ConfluenceResult.dimensions` to a Dashboard-shaped view; selects bounded top contributors (Missing Decision 2) by their own `detectionConfidence.value`; passes through each selected contributor's `LabeledConfidence` values (all four kinds, unmodified), `Limitations`, and `TraceabilityRecord`.
- **Acceptance Criteria:** never collapses distinct `ConfidenceKind`s into one number (Constitution §6.5); never fabricates a reading for a non-participating Provider; `nonParticipating` entries from `ConfluenceResult.participation` are passed through unmodified.
- **Verification Steps:** unit tests with fixture `MarketSeries`/mocked `ConfluenceEngine` covering full participation, partial participation, and zero participation (all nine Providers non-participating — must not throw, must return an honestly-empty `InstrumentReading`).
- **Risks:** silently treating a Provider's absence as agreement — mitigated by the same test discipline every prior Provider's own Partial Failure test used.
- **Completion Criteria:** full coverage of participation states; no direct Prisma/HTTP access in this service (pure composition of existing services).

# Work Package 3 — Net-direction + relevance ranking utility (Scope item 3)

- **Deliverables:** `deriveNetDirection(dimensions): { netDirection, relevanceScore, agreeingDimensions, disagreementDimensions }` (Missing Decision 3: net dimension agreement count, magnitude-weighted, explicitly documented as not a Confidence value).
- **Acceptance Criteria:** deterministic given the same `DimensionConfluence[]` input; `netDirection: 'NEUTRAL'` whenever bullish and bearish dimension counts are equal (including zero-zero); disagreement is disclosed, never hidden from the result, and never disqualifies an instrument from ranking on its own.
- **Verification Steps:** table-driven unit tests covering unanimous agreement, majority agreement with one dissenting dimension, and a tied/neutral case.
- **Risks:** the ranking heuristic being mistaken for a Confidence value downstream — mitigated by a doc comment and a type name (`relevanceScore`, never `confidence`) that cannot be assigned where a `LabeledConfidence` is expected.
- **Completion Criteria:** pure function, zero I/O, 100% branch coverage on the direction/tie logic.

# Work Package 4 — `DashboardService` orchestration (Scope item 4)

- **Deliverables:** instrument gathering (`prisma.watchlistItem.findMany({ where: { watchlist: { userId } } })` ∪ `prisma.position.findMany({ where: { portfolio: { userId }, quantity: { gt: 0 } } })`, deduplicated by `assetId`); per-instrument `InstrumentReadingService` invocation with per-instrument error isolation (a single instrument's own failure never aborts the batch); ranking via WP3; `DecisionCenterResponse` assembly, including the `NO_CLEAR_OPPORTUNITY` / `DEGRADED` distinction (Missing Decision 5: zero tracked instruments reported as `NO_CLEAR_OPPORTUNITY`).
- **Acceptance Criteria:** `DEGRADED` only when every attempted instrument computation failed; `NO_CLEAR_OPPORTUNITY` when at least one instrument computed successfully but none yielded a non-`NEUTRAL` net direction, or when the trader tracks zero instruments; `instrumentsFailed` always discloses which instruments (never silently dropped).
- **Verification Steps:** integration-style tests with a mocked `InstrumentReadingService` returning success/failure/empty combinations across a multi-instrument set.
- **Risks:** N+1 query patterns for watchlist/position gathering — mitigated by the two-query, `include: { asset }` approach (no per-item follow-up query), consistent with `AnalyticsService`'s own direct-Prisma-read precedent.
- **Completion Criteria:** every readiness state reachable and independently tested.

# Work Package 5 — `DashboardController` + DTOs + module wiring (Scope items 5, 6, 9)

- **Deliverables:** `GET /dashboard/decision-center` (JWT-guarded, `userId` from `AuthenticatedUser`, identical pattern to `AnalyticsController`/`WatchlistsController`); `dashboard.types.ts` response shape; `DashboardModule` importing `AnalysisEngineModule`, `DatabaseModule`, `AuthModule`; registration in `AppModule`.
- **Acceptance Criteria:** response body contains no internal type (`AnalysisProviderResult`, `ConfluenceResult`, Prisma entities) directly — only the Dashboard-shaped DTOs; Swagger tags/bearer-auth annotations consistent with existing controllers.
- **Verification Steps:** an e2e-style controller test asserting the response shape and 401 without a token.
- **Risks:** accidentally leaking a Prisma `Decimal`/internal enum untransformed — mitigated by explicit DTO mapping, never `return` of a raw service/Prisma object.
- **Completion Criteria:** endpoint reachable, authenticated, shaped per Scope item 6.

# Work Package 6 — Caching layer (Scope item 7)

- **Deliverables:** a `ComputationCacheService` instance scoped to `DashboardModule` (not shared with `AnalysisEngineModule`'s own internal cache instance, which is not exported), keyed by `assetId`, TTL per Missing Decision 4.
- **Acceptance Criteria:** a second `getInstrumentReading()` call for the same `assetId` within the TTL does not re-invoke `computeConfluenceWithEvidence()`.
- **Verification Steps:** unit test asserting a mocked `ConfluenceEngine` is invoked exactly once across two calls within the TTL window, and twice once the TTL has elapsed (fake timers).
- **Risks:** stale readings served across a legitimately-changed market condition — mitigated by the same short-TTL precedent already established (`ComputationCacheService`'s own existing 60s default).
- **Completion Criteria:** measurable cache-hit behavior under test.

# Work Package 7 — Comprehensive tests (Scope item 8)

- **Deliverables:** full unit coverage of WP1-6 plus an integration test composing real `MarketSeriesService`/`ConfluenceService` against fixture data (mirroring the golden-dataset precedent already established for Providers).
- **Acceptance Criteria:** every readiness state, every participation state, cache reuse, and controller auth scoping covered.
- **Verification Steps:** `pnpm test` (or workspace equivalent) green.
- **Completion Criteria:** no untested branch in new code.

# Work Package 8 — Full build/lint/test/turbo verification

- **Deliverables:** clean `turbo build`/`turbo lint`/`turbo test` across the monorepo.
- **Acceptance Criteria:** zero regressions in any existing Provider/Confluence/Analytics/Watchlist/Portfolio test.
- **Completion Criteria:** all tasks green.

# Work Package 9 — Sprint audit / adversarial review

- **Deliverables:** a self-review pass specifically targeting: cross-trader data leakage (an instrument reading never leaks another trader's data, since `InstrumentReading` is asset-scoped, not trader-scoped — a trader-scoping check belongs in `DashboardService`, not the cache key), disagreement-hiding, confidence-collapsing, and duplicated Provider execution.
- **Completion Criteria:** findings disclosed and fixed before completion report, consistent with every prior Sprint's own audit discipline.

# Work Package 10 — Decision Log, completion report, documentation, commit/push

- **Deliverables:** Decision Log entry recording Missing Decisions 1-5's resolved values; `S1-019_COMPLETION_REPORT.md`; `09_PROJECT_BRAIN.md`, `00_INDEX.md`, `documentation/ai/00_AI_INDEX.md`, `08_ROADMAP.md`, `22_ANALYSIS_ENGINE_ARCHITECTURE.md` updates; commit and push to `claude/readonly-connectivity-test-p64tic`.

---

# Related Documents

- `documentation/zos/sprints/S1-019_SPRINT_BRIEF.md`
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md`
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/11_DECISION_LOG.md`
