# S1-017_TASK_BREAKDOWN

**Document ID:** AI-039
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-017_SPRINT_BRIEF.md` (Fibonacci Analysis Provider), based strictly on that Brief, ADR-006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the S1-007–S1-016 precedent.

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/fibonacci-analysis/` (new, per the Brief's Deliverables section):

- `fibonacci-analysis.types.ts` — Fibonacci-Analysis-internal types only, never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract. Defines `LevelType` (`'RETRACEMENT' | 'EXTENSION'`), `RawFibonacciLevel` (one leg's own ratio/price/type/legIndex), `ReactionState` (`'UNTESTED' | 'RESPECTED' | 'BROKEN'`), `FibonacciQualityScore` (the disclosed confluence/precision measurements), `FibonacciInvalidation`, and `FibonacciHypothesis` (a complete, classified, scored confluence-zone-or-standalone-level reading, mirroring every prior Provider's own internal reading-type shape).
- `fibonacci-analysis-level-generator.util.ts` — Scope item 2 (bounded multi-leg retracement/extension level generation via `INDICATOR_ENGINE.fibonacciLevels()`).
- `fibonacci-analysis-confluence.util.ts` — Scope item 3 (cross-leg clustering into confluence zones or standalone levels).
- `fibonacci-analysis-reaction-classifier.util.ts` — Scope item 5 (`UNTESTED`/`RESPECTED`/`BROKEN` touch/close-persistence classification).
- `fibonacci-analysis-quality-scoring.util.ts` — Scope item 6 (confluence/precision Detection score; reaction-multiplier-adjusted Interpretation score).
- `fibonacci-analysis-hypothesis.util.ts` — Scope items 4, 8 (proximity-ranked bounded interpretation assembly, disclosed invalidation).
- `fibonacci-analysis-confidence.util.ts` — Scope item 7 (Detection/Interpretation/Regime-Adjusted/Methodology Ceiling for `'FIBONACCI_ANALYSIS'`).
- `fibonacci-analysis-normalize.util.ts` — Scope item 11 (`normalize()` mapping).
- `fibonacci-analysis.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Limitations (Scope 9) and Traceability (Scope 10).
- `*.spec.ts` per file above, plus `fibonacci-analysis-independence-boundary.spec.ts` (Scope item 12) and a golden-dataset conformance spec (Scope item 13).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `FibonacciAnalysisProvider` skeleton and internal types

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism, no premature promotion).

- **Deliverables:** `FibonacciAnalysisProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal `analyze()` internals (wired to later Work Packages) — `id: 'FIBONACCI_ANALYSIS'`, `lifecycleState: 'ACTIVE'`, `tier: 'SLOW'`, `methodologyFamily: 'FIBONACCI_ANALYSIS'`, `computationVersion`, no `dependsOn`, constructor-injecting `SWING_DETECTOR`, `REGIME_CONTEXT`, and `INDICATOR_ENGINE` (S1-007 tokens — the second Provider to inject all three together, after `PriceActionProvider`, S1-015). `fibonacci-analysis.types.ts` defining the types listed in the Module Layout above.
- **Acceptance Criteria:** "`FibonacciAnalysisProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`SLOW`/`methodologyFamily: 'FIBONACCI_ANALYSIS'`, with no `dependsOn` entry" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `FibonacciAnalysisProvider` via NestJS `Test.createTestingModule` with the three S1-007 tokens mocked; asserts every required field/method is present and correctly typed, `dependsOn` is `undefined`, `tier` is `'SLOW'`; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — pure scaffolding.
- **Completion Criteria:** Class and types compile, satisfy the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP12).

## WP2 — Bounded multi-leg retracement/extension level generation

**Maps to:** Scope item 2.

- **Deliverables:** `fibonacci-analysis-level-generator.util.ts`'s `generateFibonacciLevels(swingResult, indicatorEngine, series): RawFibonacciLevel[]` — takes the last up to `MAX_SWINGS_FOR_LEGS` swings, forms consecutive legs, and calls `INDICATOR_ENGINE.fibonacciLevels({anchorStart, anchorEnd})` once per leg, keeping only ratios `0.236`/`0.382`/`0.5`/`0.618`/`0.786` (`LevelType: 'RETRACEMENT'`) and `1.272`/`1.618` (`LevelType: 'EXTENSION'`), excluding the raw anchor ratios `0`/`1`.
- **Acceptance Criteria:** "given a series with 4 swings, exactly 3 legs' worth of retracement/extension levels are generated, with the raw anchor ratios (`0`/`1`) excluded" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with a 4-swing fixture asserts exactly 3 legs' worth of levels (7 levels per leg × 3 legs = 21), none with `ratio` `0` or `1`; a further test confirms `INDICATOR_ENGINE.fibonacciLevels()` is called once per leg (mock call-count assertion), never re-implemented locally.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — `MAX_SWINGS_FOR_LEGS` is a disclosed, named constant (Missing Decision, Decision Log at WP16).
- **Completion Criteria:** Both tests pass.

## WP3 — Confluence clustering

**Maps to:** Scope item 3.

- **Deliverables:** `fibonacci-analysis-confluence.util.ts`'s `clusterConfluence(levels, atrValue): FibonacciCandidate[]` — groups levels from *independent* legs whose prices fall within a disclosed ATR-relative tolerance into a confluence zone (confluence count = number of distinct contributing legs); a level with no cross-leg clustering partner remains a standalone candidate (confluence count `1`).
- **Acceptance Criteria:** "two independent legs whose levels fall within the disclosed tolerance are grouped into one confluence zone with a confluence count of `2`; two ratios from the *same* leg that happen to be close are never counted as confluence with each other" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with two same-leg levels placed artificially close together asserts they are NOT merged into a confluence zone with each other; a separate fixture with two different-leg levels placed close together asserts a confluence zone with count `2`; a further fixture with a fully isolated level asserts a standalone candidate with count `1`.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — the confluence tolerance is a disclosed, named constant (Decision Log at WP16).
- **Completion Criteria:** All three tests pass.

## WP4 — Reaction-quality classification

**Maps to:** Scope item 5.

- **Deliverables:** `fibonacci-analysis-reaction-classifier.util.ts`'s `classifyReaction(candidate, subsequentPoints): ReactionState` — `UNTESTED` when no subsequent point touches the candidate's own price band; `RESPECTED` when touched at least once with no subsequent decisive close through it; `BROKEN` when a subsequent point closes decisively through it, beyond a disclosed ATR-relative margin. A touch/close-persistence mechanism, never a single-bar wick-to-range/body-to-range/close-position measurement.
- **Acceptance Criteria:** "a level never subsequently touched reads `UNTESTED`; a level touched at least once with no decisive close through reads `RESPECTED`; a level with a subsequent decisive close through... reads `BROKEN` — three independently constructed fixtures" (Brief, Acceptance Criteria).
- **Verification Steps:** Three independently-constructed fixtures, one per state, each asserting the correct classification.
- **Risks:** Brief Risk "Price-Action-reaction-conflation risk" — resolved by design (a genuinely different, touch-persistence-based mechanism); the break margin is a disclosed, named constant (Decision Log at WP16).
- **Completion Criteria:** All three tests pass; the three states are mutually exclusive over the constructed fixture space.

## WP5 — Quality scoring

**Maps to:** Scope item 6.

- **Deliverables:** `fibonacci-analysis-quality-scoring.util.ts`'s `scoreQuality(candidate): FibonacciQualityScore` (a confluence score from the candidate's own contributing-leg count, and a precision score from clustering tightness or, for a standalone level, its own true-Fibonacci-ratio status per the Indicator Engine's own disclosed `isTrueFibonacciRatio` distinction — the weaker of the two determining Detection Confidence) and `scoreInterpretation(qualityScore, reactionState): number` (applies a disclosed reaction-state multiplier: `RESPECTED` strengthens, `BROKEN` weakens, `UNTESTED` unchanged).
- **Acceptance Criteria:** "a zone with more independent contributing legs scores a strictly higher Detection Confidence than an otherwise-comparable zone/level with fewer; a `RESPECTED` reading scores a strictly higher Interpretation Confidence than an otherwise-identical `BROKEN` reading" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests: (a) two candidates differing only in contributing-leg count, asserting the higher-count one scores higher; (b) an otherwise-identical candidate scored at each reaction state, asserting `RESPECTED` strictly higher than `BROKEN`.
- **Risks:** None beyond calibration — the confluence/precision formulas and reaction multipliers are named constants (Decision Log at WP16).
- **Completion Criteria:** Both tests pass.

## WP6 — Bounded `interpretation[]` and disclosed invalidation

**Maps to:** Scope items 4, 8.

- **Deliverables:** `fibonacci-analysis-hypothesis.util.ts`'s `selectHypotheses(candidates, currentPrice): FibonacciHypothesis[]` — ranks every confluence zone and standalone level by proximity to `currentPrice`, bounded at `MAX_FIBONACCI_HYPOTHESES = 2`, nearest first — a proximity-based bounding rationale, distinct from every prior Provider's own bounded-hypothesis mechanism. Computes `FibonacciInvalidation` per hypothesis: the level/zone's own price and the "a decisive close beyond it would invalidate this reading" condition.
- **Acceptance Criteria:** "given both a confluence zone and a standalone level at different distances from current price, exactly two hypotheses are returned, the nearer one primary; a separate fixture with only one candidate confirms exactly one" and "Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description" (Brief, Acceptance Criteria).
- **Verification Steps:** A two-candidate fixture asserts `length === 2` with the nearer one first; a one-candidate fixture asserts `length === 1`; a further test asserts every entry's invalidation description is non-empty and numerically correct.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — the proximity-bound rationale is disclosed as a genuinely different mechanism from every prior Provider's own (Decision Log at WP16).
- **Completion Criteria:** All tests pass; the bound is never more than 2 entries.

## WP7 — Independence Boundary Test

**Maps to:** Scope item 12; Architecture Requirements (methodology independence).

- **Deliverables:** `fibonacci-analysis-independence-boundary.spec.ts`, scanning every file under `providers/fibonacci-analysis/` for any import path or literal reference to `wyckoff`, `ict-smc`/`ICT_SMC`, `elliott`, `harmonic`, `classical-chart-patterns`/`classical.?chart`, `price-action`/`PRICE_ACTION`, or `supply-demand`/`SUPPLY_DEMAND`, mirroring the S1-016 precedent.
- **Acceptance Criteria:** "The Independence Boundary Test... passes, confirming zero references from `providers/fibonacci-analysis/` to any of the seven prior Providers' own module directories" (Brief, Acceptance Criteria).
- **Verification Steps:** The test greps `providers/fibonacci-analysis/**/*.ts` (excluding its own spec file) case-insensitively for the seven terms above, failing on any match. Run once WP1–WP6's source files exist.
- **Risks:** Same disclosed limitation as every prior boundary test — a lexical check only. Doc comments must describe the independence property (including the Elliott/Harmonic helper-utility distinction) without naming the other Providers, learned directly from every prior sprint's own self-review.
- **Completion Criteria:** Test passes with zero matches against the full `fibonacci-analysis/` source tree as it stands after WP1–WP6.

## WP8 — Full Confidence taxonomy integration

**Maps to:** Scope item 7.

- **Deliverables:** `fibonacci-analysis-confidence.util.ts` — Detection Confidence (WP5's weakest-link quality score), Interpretation Confidence (WP5's reaction-adjusted score), Regime-Adjusted Confidence (this Provider's own rule: retracement-dominant readings strengthen when `REGIME_CONTEXT` reads `volatilityState: 'LOW'`, weaken when `'HIGH'`; extension-dominant readings strengthen when it reads `'HIGH'`, weaken when `'LOW'` — a genuinely distinct bifurcating variable, retracement-vs-extension level type, from every prior Provider's own rule), and Methodology Confidence Ceiling (a disclosed constant for `'FIBONACCI_ANALYSIS'`, independently calibrated, reflecting this methodology's own uniquely-solid underlying-mathematics/decentralized-trading-application sourcing split, distinct from every prior Provider's own ceiling).
- **Acceptance Criteria:** "a test confirms Regime-Adjusted Confidence for an identical retracement-dominant reading is higher when the Regime/Context Service reads `LOW` volatility than `HIGH`, and — for an identical extension-dominant reading — higher when it reads `HIGH` than `LOW`; Methodology Confidence Ceiling reflects this Provider's own disclosed source profile... not copied from any of them" (Brief, Acceptance Criteria).
- **Verification Steps:** Two unit tests (one per level-type dominance) holding a reading's own scores fixed while varying only the mocked regime's `volatilityState`, asserting the correct direction for retracement-dominant vs extension-dominant readings. A third test asserts the Methodology Confidence Ceiling value is distinct from `60`, `65`, `68`, `70`, `75`, `80`, `85`.
- **Risks:** None beyond calibration — resolved via Decision Log at WP16.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified; ceiling value distinct from all seven prior Providers'; Regime-Adjusted Confidence direction verified correct for both level-type dominances.

## WP9 — Limitations / graceful degradation

**Maps to:** Scope item 9.

- **Deliverables:** `FibonacciAnalysisProvider.analyze()` returns a populated `Limitations` (never throws) when fewer than two swings exist to form even a single leg.
- **Acceptance Criteria:** "A series with fewer than two swings produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) an empty `swings` array and (b) a single-swing array, both asserting a populated `Limitations` result and no thrown exception.
- **Risks:** None beyond the standing "never throw" discipline already established throughout S1-007–S1-016.
- **Completion Criteria:** Both degradation paths tested and passing.

## WP10 — Real Traceability

**Maps to:** Scope item 10.

- **Deliverables:** `Traceability` populated with genuine references to every `SWING_DETECTOR`/`REGIME_CONTEXT`/`INDICATOR_ENGINE` (`atr()` and `fibonacciLevels()`) call actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual Swing Detector/Regime Context/Indicator Engine (`atr()`/`fibonacciLevels()`) `computation`/`computationVersion` this Provider consumed" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each distinct service call actually made, each with a `computationVersion` string.
- **Risks:** None beyond ensuring no silent under/over-reporting.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations.

## WP11 — `normalize()` vocabulary mapping

**Maps to:** Scope item 11.

- **Deliverables:** `fibonacci-analysis-normalize.util.ts`'s `normalizeFibonacciAnalysisResult(providerId, methodologyFamily, result): NormalizedProviderOutput` — TREND and STRUCTURE both from the primary hypothesis's own implied bias direction (flipped when `reactionState === 'BROKEN'`, itself a bias-flip signal, mirroring the established `NEUTRAL`/`NOT_APPLICABLE` and directional-flip conventions); CONFIRMATION matches TREND's direction only for `RESPECTED`, else `NOT_APPLICABLE`; MOMENTUM/LIQUIDITY/VOLATILITY/VOLUME always `NOT_APPLICABLE` (MOMENTUM and VOLUME deliberately, to preserve independence from Price Action's and Wyckoff's own respective methodologies). All seven dimensions `NOT_APPLICABLE` when `interpretation.length === 0` (the Limitations path). Added as an eighth entry to `PROVIDER_FIXTURES` in the existing `normalize-vocabulary-conformance.spec.ts` (S1-012) — not a new test suite.
- **Acceptance Criteria:** "`normalize()` is implemented, added as an eighth fixture entry to the existing shared conformance suite... a dedicated test confirms `MOMENTUM` and `VOLUME` are `NOT_APPLICABLE`" (Brief, Acceptance Criteria).
- **Verification Steps:** A dedicated `fibonacci-analysis-normalize.util.spec.ts` (this Provider's own mapping-specific tests) plus the shared conformance suite's own generic `describe.each` assertions passing for the new fixture entry, with zero modification to the suite's own generic assertion logic.
- **Risks:** None beyond the already-resolved `NEUTRAL`/`NOT_APPLICABLE` semantic distinction (directly reapplied here) and the substring-matching false-positive class of bug caught at S1-013/S1-014/S1-015/S1-016 closure — this Provider's own summary tags follow the same bracketed-tag technique adopted at S1-015 to close that bug class off by construction.
- **Completion Criteria:** Both the dedicated mapping test and the shared conformance suite pass for `FibonacciAnalysisProvider`.

## WP12 — Module registration

**Maps to:** Scope item 1 ("registered as the eighth entry in `ANALYSIS_PROVIDERS`").

- **Deliverables:** `FibonacciAnalysisProvider` added to `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), as the eighth entry alongside all seven prior Providers.
- **Acceptance Criteria:** "...is the eighth entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule` wiring confirms exactly eight entries, in registration order. Confirms the Anti-Corruption boundary test and all seven prior Independence Boundary Tests still pass. Confirms `CONFLUENCE_ENGINE` resolves correctly with the eighth Provider present.
- **Risks:** None beyond standard module-wiring risk, caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` contains all eight Providers in production, in order; all boundary tests pass unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP13 — Golden-dataset / reference-example conformance tests

**Maps to:** Scope item 13.

- **Deliverables:** Two conformance tests: one worked confluence-zone-respected instance (two or more independent legs agreeing at a level that has since held), one worked broken-level instance (a decisive close through, demonstrating the disclosed bias flip), each matched against widely-taught, independently-corroborating Fibonacci-trading conventions (no single primary trading-application text exists — multi-source corroboration disclosed, per Risks).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked confluence-zone-respected instance and one worked broken-level instance... any substitution or multi-source corroboration... is disclosed in the test file and completion report" (Brief, Acceptance Criteria).
- **Verification Steps:** Each test file's own header comment names the corroborating sources and the dual-sourcing disclosure (solid ratio mathematics, decentralized trading application), mirroring the established "SOURCING DISCLOSURE" precedent. Each test constructs its own worked example's swing/series data and asserts the full pipeline (WP1–WP12) reproduces the expected confluence count, reaction state, and disclosed invalidation.
- **Risks:** Brief Escalation Trigger — "No independently-corroborating combination of well-established Fibonacci-trading sources can be located after a documented attempt" — not, by itself, an escalation-worthy blocker; document the attempt and proceed with the disclosed corroboration achieved.
- **Completion Criteria:** Both conformance tests pass; sourcing disclosure present and honest in both.

## WP14 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-016 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test --force`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP15 — Sprint audit

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1–13) re-verified against its own Acceptance Criteria line, end to end; direct grep of every generic framework file and `confluence/` (the same named list and method used at every prior sprint's own closure) for Fibonacci-Analysis-specific vocabulary; re-check that no shared internal utility exists between this Provider and `providers/elliott-wave/` or `providers/harmonic-patterns/` (this Sprint's own central named risk).
- **Verification Steps:** Re-read `FibonacciAnalysisProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks/Approval-Section line by line; re-run all eight boundary tests (Anti-Corruption plus seven prior Independence Boundary Tests plus this Provider's own); re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists. If found, this WP stops, explains, and proposes the smallest change — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP16 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (`DEC-2026-021`) recording the Missing Decisions fixed at implementation time (`MAX_SWINGS_FOR_LEGS`, confluence tolerance, break margin, confluence/precision formulas, reaction multipliers, Regime-Adjusted Confidence modulation magnitude, golden-dataset sources, Methodology Confidence Ceiling value, `computationVersion`/`vocabularySchemaVersion` scheme). `S1-017_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-017_COMPLETION_REPORT.md` (AI-040) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables/Approval-Section line) in the approved `S1-017_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton + types) → WP2 (level generation, needs Swing Detector output + `fibonacciLevels()`) → WP3 (confluence clustering, needs WP2's levels + ATR) → WP4 (reaction classification, needs WP3's candidates) → WP5 (quality scoring, needs WP3's candidates + WP4's reaction states) → WP6 (bounded interpretation + invalidation, needs WP5's fully-scored candidates) → WP7 (independence boundary, run once WP1–WP6's source tree exists) → WP8 (confidence taxonomy, needs WP5's scores) → WP9 (limitations, needs to know what "fewer than two swings" looks like from WP2) → WP10 (traceability, needs every service call wired) → WP11 (normalize(), needs a complete real implementation to translate) → WP12 (registration, needs WP1–WP11 complete) → WP13 (golden-dataset, needs the full pipeline) → WP14/WP15/WP16 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- Methodology independence (from `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`, `PriceActionProvider`, `SupplyDemandProvider`) is addressed by: no Work Package touches `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `ObservabilityService`, or anywhere under `confluence/`; WP7/WP12's boundary tests verify zero coupling to any prior Provider's module directory mechanically, not by convention alone.
- No premature promotion: no Work Package proposes moving any Fibonacci-Analysis-internal type or utility into a generic location; the Brief's own Non-Scope and this Task Breakdown's WP1/WP7 both treat this as a standing constraint.
- Elliott/Harmonic-helper-utility conflation (this Sprint's own central named risk) is addressed structurally: WP2's own level generation calls the shared, already-generic `INDICATOR_ENGINE.fibonacciLevels()` directly (the same shared infrastructure `ElliottWaveProvider` already consumes) but WP3's confluence-clustering mechanism, WP4's reaction classification, and WP5's quality scoring are all entirely self-contained inside `providers/fibonacci-analysis/`, never importing or re-deriving anything from `providers/elliott-wave/` or `providers/harmonic-patterns/`; WP7's boundary test and WP15's audit both explicitly re-verify zero coupling rather than assuming it once and moving on.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, the Confluence Engine's own mechanism, or `S1-017_SPRINT_BRIEF.md`'s substantive Scope/Non-Scope/Acceptance Criteria content — only WP16 touches the Brief, and only its Sprint Closure section.
- No Work Package implements Fibonacci time zones/circles/arcs/fans, wave-count validation, named XABCD pattern matching, a single-key-level reaction state machine, momentum scoring, volume-based analysis, multi-timeframe analysis, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-017_SPRINT_BRIEF.md`
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md`, `S1-015_SPRINT_BRIEF.md`, `S1-016_SPRINT_BRIEF.md` (process precedent only, per the Brief's own note)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-016_TASK_BREAKDOWN.md` (structural precedent)
