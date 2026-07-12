# S1-008_TASK_BREAKDOWN

**Document ID:** AI-021
**Version:** 1.0.0
**Status:** Proposed
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-008_SPRINT_BRIEF.md` (Analysis Provider Framework). Work Packages are ordered by dependency; each carries its own verification checkpoint per this sprint's Phase 3 requirement (self-review, architecture-compliance check, unit tests, immediate fix of discovered issues before continuing). No Work Package here expands or reinterprets the approved Sprint Brief's Scope — this document only sequences it.

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/` (new, per ADR-006's anticipated path):

- `analysis-provider.types.ts` — `Evidence`, `Interpretation`, `Limitations`, `TraceabilityRecord`, the four Confidence-taxonomy field types, `ProviderLifecycleState`, `AnalysisProviderContract` output shape, `AnalysisProvider` interface.
- `analysis-provider.tokens.ts` — `ANALYSIS_PROVIDERS` (multi-provider array token) and `PROVIDER_EXECUTION_ENGINE` token + its interface.
- `provider-execution.service.ts` — the Execution Engine: dependency resolution/topological sort, tier separation, partial-failure reporting, circuit breaker, lifecycle gating.
- `provider-circuit-breaker.ts` — per-Provider circuit-breaker state machine, isolated for independent unit testing.
- `provider-health.util.ts` — the aggregate per-Provider health signal (participation rate, average confidence, rolling failure rate), reusing `MarketDataProvider.checkHealth()`'s shape.
- `providers.module.ts` (or extending `analysis-engine.module.ts` directly) — registers the `ANALYSIS_PROVIDERS` factory (empty array in production, per Non-Scope), `PROVIDER_EXECUTION_ENGINE`.
- `__fixtures__/` (test-support only, never imported by production code) — fixture `AnalysisProvider` implementations used across the spec suite.

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's own "anticipated path; final module structure is an S1-008 implementation decision."

---

# Work Packages

## WP1 — `AnalysisProvider` contract types
Define `Evidence`, `Interpretation` (array element shape, includes its own confidence + ranking), `Limitations`, `TraceabilityRecord` (raw-data references, intermediate-calculation references, condition derivations, confidence derivation — in-memory shape only, no persistence per the approved Trace Store decision), the four labeled Confidence types (`DetectionConfidence`, `InterpretationConfidence`, `RegimeAdjustedConfidence`, `MethodologyConfidenceCeiling`, each paired with a `confidenceExplanation`), `ProviderLifecycleState = 'ACTIVE' | 'DEPRECATED' | 'RETIRED'`, and the full `AnalysisProvider` interface (`contractVersion`, `computationVersion`, `methodologyFamily?`, `lifecycleState`, `normalize(): void`, plus whatever method the Execution Engine calls to produce a result — e.g. `analyze(series: MarketSeries): ProviderResult`). No behavior yet, types only.
**Verify:** compiles; a fixture class can implement the interface with zero `any`/`unknown` escapes.

## WP2 — Provider registry
`ANALYSIS_PROVIDERS` token; a factory provider that would inject every registered concrete Provider class and expose them as an array (empty in production — no concrete Provider classes exist yet, per Non-Scope). Wire into `analysis-engine.module.ts`.
**Verify:** resolving `ANALYSIS_PROVIDERS` in the production module returns `[]`; a test module registering fixture Providers resolves the correct array.

## WP3 — Dependency resolution and cycle detection
Execution Engine accepts a set of Providers, each optionally declaring dependencies by stable token/identifier (never concrete-class import); performs a topological sort before invocation order is decided.
**Verify:** a linear fixture chain (C→B→A) sorts correctly; a cyclic declaration (A→B→A) is rejected with a typed error, never a silent infinite loop.

## WP4 — Tier separation (fast/slow)
Each Provider is tagged fast-tier or slow-tier at registration. Fast-tier results are available without waiting on any slow-tier Provider's completion.
**Verify:** an artificially-delayed slow-tier fixture does not delay a fast-tier fixture's result in the same execution call.

## WP5 — Partial failure reporting
A Provider that throws, times out, or is otherwise unavailable is captured and reported as explicitly non-participating — distinct from a Provider that ran and produced a result. Output distinguishes "N of M available Providers participated" from the full registered count.
**Verify:** a throwing fixture and a timing-out fixture both surface as non-participating without crashing the overall execution; a succeeding fixture alongside them is correctly reported as participating.

## WP6 — Circuit breaker
Per-Provider consecutive failure/timeout counter; opens the circuit past a disclosed threshold, excluding the Provider from invocation (reported non-participating, not re-invoked) until a disclosed reset timeout elapses.
**Verify:** a fixture configured to always fail opens its circuit after the threshold and is not re-invoked on subsequent calls before the reset timeout; it is invoked again, and can close the circuit, once the reset timeout has elapsed and it starts succeeding.

## WP7 — Provider Lifecycle gating
`ACTIVE` Providers participate in a new run; `DEPRECATED` Providers are excluded from new runs but remain directly invocable (for historical/backtested reproduction); `RETIRED` Providers cannot be invoked at all, by any call path.
**Verify:** three fixtures, one per state, confirm exactly this gating in both a "new run" call and a direct/by-ID invocation call.

## WP8 — Observability
Per-Provider latency and failure/timeout rate, circuit-breaker state, and the aggregate per-Provider health signal (participation rate, average confidence, rolling failure rate), emitted via the existing Pino-backed `ObservabilityService` pattern established in S1-007.
**Verify:** every metric is present in the logged output for a representative fixture execution; no new logging/metrics dependency is introduced.

## WP9 — Module wiring
Register the Execution Engine, circuit breaker, and health utility in `analysis-engine.module.ts` (or a new `providers.module.ts` imported by it); confirm the Anti-Corruption boundary test (`anti-corruption-boundary.spec.ts`, already scoped to the whole `analysis-engine/` tree outside `market-series/`) passes unmodified against the new `providers/` directory, with zero `Candle`/`MarketQuote` references.
**Verify:** `AppModule` builds; boundary test passes with no changes required to the test itself.

## WP10 — Full test run, lint, build verification
`pnpm turbo run build lint test` monorepo-wide; confirm zero regression against S1-001–S1-007 (193/193 carried forward) plus full coverage of WP1–WP9.

## WP11 — Sprint audit (Phase 4 equivalent)
Verify: Sprint Brief Scope/Non-Scope compliance (including zero HTTP endpoint/controller and zero new Prisma model, per Acceptance Criteria), ADR-006 compliance, architecture-document compliance, coding standards, dependency rules (`git diff` on every `package.json`/lockfile — expect zero changes), determinism (the topological sort and tier separation must produce identical ordering/output for identical input across repeated runs), and confirm none of the three Architecture-Team-approved placeholder decisions (`normalize(): void`, Finding B narrowed scope, in-memory-only Traceability) were silently expanded beyond what was approved.

## WP12 — Decision Log, Sprint Closure, completion report
Record a Decision Log entry (next available `DEC-2026-0NN`) for the calibration values fixed during implementation (dependency-declaration syntax, tier classification criteria, circuit-breaker threshold/reset defaults, confidence-label naming conventions, per-Provider `computationVersion` numbering). Update `S1-008_SPRINT_BRIEF.md`'s Sprint Closure section, `09_PROJECT_BRAIN.md`, `documentation/ai/00_AI_INDEX.md`, and write `S1-008_COMPLETION_REPORT.md`. Commit at each WP boundary (or the nearest coherent grouping), push.

---

# Verification Checkpoints Summary

Each WP1–WP9 is self-reviewed and unit-tested immediately upon completion, per the Sprint Brief's Phase 3 requirement — implementation does not proceed to the next WP with a known-failing test. WP10–WP12 are whole-sprint gates run once after WP1–WP9 are all green.

---

# Related Documents

- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-006)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-007_COMPLETION_REPORT.md` (module-tree and Decision Log precedent)
