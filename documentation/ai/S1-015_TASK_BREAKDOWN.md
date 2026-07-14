# S1-015_TASK_BREAKDOWN

**Document ID:** AI-035
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-015_SPRINT_BRIEF.md` (Price Action Analysis Provider), based strictly on that Brief, ADR-006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the S1-007–S1-014 precedent.

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/price-action/` (new, per the Brief's Deliverables section):

- `price-action.types.ts` — Price-Action-internal types only, never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract. Defines `KeyLevel`, `PriceActionState` (`'APPROACHING_LEVEL' | 'REJECTED_LEVEL' | 'BREAKOUT_UNCONFIRMED' | 'BREAKOUT_CONFIRMED' | 'BREAKOUT_FAILED'`), `QualityScore` (the disclosed wick/body/close-position/ATR-clearance measurements), `PatternInvalidation`, and `PriceActionReading` (a complete, classified, scored reading carrying its own `survivalReasons`/`weaknesses` string arrays).
- `price-action-level-identification.util.ts` — Scope items 2-3 (most-recent-swing key level, subsequent-point gathering).
- `price-action-reaction-classifier.util.ts` — Scope item 4 (deterministic hard state classification).
- `price-action-quality-scoring.util.ts` — Scope item 5 (wick/body/close-position/ATR-clearance measurements, reusing `INDICATOR_ENGINE.atr()`).
- `price-action-momentum.util.ts` — Scope item 6 (ATR-relative velocity, continuation-vs-exhaustion).
- `price-action-hypothesis.util.ts` — Scope items 7, 9 (bounded interpretation assembly, disclosed invalidation).
- `price-action-confidence.util.ts` — Scope item 8 (Detection/Interpretation/Regime-Adjusted/Methodology Ceiling for `'PRICE_ACTION'`).
- `price-action-normalize.util.ts` — Scope item 12 (`normalize()` mapping, including the first genuine `MOMENTUM` population).
- `price-action.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Limitations (Scope 10) and Traceability (Scope 11).
- `*.spec.ts` per file above, plus `price-action-independence-boundary.spec.ts` (Scope item 13) and a golden-dataset conformance spec (Scope item 14).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `PriceActionProvider` skeleton and internal types

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism, no premature promotion).

- **Deliverables:** `PriceActionProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal `analyze()` internals (wired to later Work Packages) — `id: 'PRICE_ACTION'`, `lifecycleState: 'ACTIVE'`, `tier: 'FAST'`, `methodologyFamily: 'PRICE_ACTION'`, `computationVersion`, no `dependsOn`, constructor-injecting `SWING_DETECTOR`, `REGIME_CONTEXT`, and `INDICATOR_ENGINE` (S1-007 tokens — the first Provider to inject all three). `price-action.types.ts` defining the types listed in the Module Layout above.
- **Acceptance Criteria:** "`PriceActionProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`FAST`/`methodologyFamily: 'PRICE_ACTION'`, with no `dependsOn` entry" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `PriceActionProvider` via NestJS `Test.createTestingModule` with the three S1-007 tokens mocked; asserts every required field/method is present and correctly typed, `dependsOn` is `undefined`, `tier` is `'FAST'`; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — pure scaffolding.
- **Completion Criteria:** Class and types compile, satisfy the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP12).

## WP2 — Key-level identification and subsequent-reaction gathering

**Maps to:** Scope items 2, 3; Risks ("Single-key-level risk").

- **Deliverables:** `identifyKeyLevel(swingResult): KeyLevel | null` — the last entry in `swingResult.swings` (`null` if no swings exist); `gatherSubsequentPoints(series, keyLevel): MarketSeriesPoint[]` — every `series.points` entry timestamped strictly after `keyLevel.timestamp`, in order.
- **Acceptance Criteria:** "Given a constructed price series..." implicitly requires a correctly-identified key level as the basis for every later Work Package (Brief, Scope items 2-3).
- **Verification Steps:** Unit tests: (a) the last swing (not the first or middle) is selected as the key level from a multi-swing fixture; (b) an empty `swings` array returns `null`; (c) `gatherSubsequentPoints` returns only points strictly after the key level's timestamp, in original order, excluding the key level's own point if it coincides with a series point.
- **Risks:** Brief Risk "Single-key-level risk" — resolved by design (Scope item 2's own disclosed V1 boundary), not an oversight.
- **Completion Criteria:** All three tests pass.

## WP3 — Deterministic reaction-state classification

**Maps to:** Scope item 4.

- **Deliverables:** `price-action-reaction-classifier.util.ts`'s `classifyReaction(keyLevel, subsequentPoints): { state: PriceActionState; breakoutPoint: MarketSeriesPoint | null; retestPoint: MarketSeriesPoint | null; rejectionPoint: MarketSeriesPoint | null }` — scans `subsequentPoints` in order for the first point closing beyond the level in either direction (a breakout) or piercing-then-closing-back (a rejection, only if no breakout point precedes it); if a breakout is found, scans points after it for the first point touching back to the level (a retest), classifying `BREAKOUT_CONFIRMED` (retest held) or `BREAKOUT_FAILED` (retest failed through); absent a retest, `BREAKOUT_UNCONFIRMED`; absent both breakout and rejection, `APPROACHING_LEVEL`.
- **Acceptance Criteria:** "Given a constructed price series with a clear rejection... `REJECTED_LEVEL`; given a clear breakout with no subsequent retest, `BREAKOUT_UNCONFIRMED`; given a breakout with a held retest, `BREAKOUT_CONFIRMED`; given a breakout with a failed retest, `BREAKOUT_FAILED`; given no subsequent reaction yet, `APPROACHING_LEVEL` — five dedicated unit tests" (Brief, Acceptance Criteria).
- **Verification Steps:** Five independently-constructed fixtures, one per state, each asserting the correct classification and the correct identification of the relevant breakout/retest/rejection point.
- **Risks:** None beyond calibration (the wick/breakout thresholds themselves are WP4's own concern) — this WP establishes only the *structural* sequencing logic (which point is the breakout, which is the retest), not the quality thresholds.
- **Completion Criteria:** All five tests pass; the five states are mutually exclusive and exhaustive over the constructed fixture space.

## WP4 — Rejection/breakout/retest quality scoring

**Maps to:** Scope item 5.

- **Deliverables:** `price-action-quality-scoring.util.ts`'s `scoreQuality(keyLevel, classification, atrValue): QualityScore` — wick-to-range ratio for `REJECTED_LEVEL` (a disclosed threshold, `REJECTION_WICK_RATIO_THRESHOLD`, gates whether the classifier even calls it a rejection at all, in WP3); body-to-range ratio and close-position ratio, averaged, for `BREAKOUT_UNCONFIRMED`/`BREAKOUT_CONFIRMED`/`BREAKOUT_FAILED`; an ATR-relative clearance distance (`|closePrice - levelPrice| / atrValue`) for breakout/failure states, reusing `INDICATOR_ENGINE.atr()` (S1-007, its first direct-from-a-Provider consumer) — a disclosed `BREAKOUT_ATR_CLEARANCE_THRESHOLD` distinguishes a genuine breakout from a noise pierce (used by WP3's own classification, not only scored here).
- **Acceptance Criteria:** "a candidate with a larger wick-to-range (rejection) or body-to-range/close-position (breakout) ratio scores a strictly higher Detection Confidence than an otherwise-comparable candidate with a smaller ratio" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests: (a) two rejection fixtures, one with a longer wick, asserting the longer-wick one scores higher; (b) two breakout fixtures, one with a stronger body/close-position, asserting the stronger one scores higher; (c) confirms `INDICATOR_ENGINE.atr()` is actually called (mock call assertion), not re-implemented locally.
- **Risks:** None beyond calibration — the disclosed thresholds are named constants (Missing Decisions, Decision Log at WP16).
- **Completion Criteria:** All three tests pass; `atr()` confirmed as the actual source of the clearance calculation.

## WP5 — Momentum and continuation-vs-exhaustion scoring

**Maps to:** Scope item 6.

- **Deliverables:** `price-action-momentum.util.ts`'s `scoreMomentum(keyLevel, latestPoint, atrValue, elapsedBars): number` — an ATR-relative velocity score (0-100, a disclosed `MOMENTUM_FULL_SCORE_ATR_MULTIPLE` displacement scores 100); `scoreContinuationOrExhaustion(impulsePoints, recentPoints): 'CONTINUATION' | 'EXHAUSTION' | 'NEUTRAL_PACE' | null` (`null` when fewer than two post-breakout points exist to compare) — compares the average body size of the most recent points against the impulse leg's own earlier average, a disclosed `CONTINUATION_EXPANSION_MARGIN` distinguishing the three outcomes.
- **Acceptance Criteria:** "an identical key level with a larger subsequent ATR-relative displacement scores a strictly higher Interpretation Confidence component than a smaller one... continuation... scores higher than exhaustion for an otherwise-identical... reading" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests: (a) two fixtures differing only in displacement magnitude, asserting the larger one scores higher momentum; (b) two post-breakout fixtures, one with expanding recent body sizes and one with contracting, asserting `'CONTINUATION'` vs `'EXHAUSTION'` respectively; (c) fewer than two post-breakout points returns `null`, never a fabricated classification.
- **Risks:** None beyond calibration — resolved via Decision Log at WP16.
- **Completion Criteria:** All three tests pass.

## WP6 — Bounded `interpretation[]` and disclosed invalidation

**Maps to:** Scope items 7, 9.

- **Deliverables:** `price-action-hypothesis.util.ts`'s `finalizeReading(...): PriceActionReading[]` — always includes the primary (classified) reading; adds a second, disclosed alternate reading only when the primary's own Detection Confidence margin (WP4) sits within a disclosed `BOUNDARY_PROXIMITY_MARGIN` of its own decision threshold (e.g. a rejection whose wick ratio barely cleared `REJECTION_WICK_RATIO_THRESHOLD` also discloses "this could alternatively be read as an inconclusive approach"). Computes `PatternInvalidation` per reading: the specific price/condition that would contradict it (e.g. a decisive close back through the level for a breakout; a decisive close beyond the level for a rejection).
- **Acceptance Criteria:** "constructs a classification-boundary close call and confirms a second, disclosed alternate hypothesis is returned (bounded, never unbounded); a separate unambiguous fixture confirms exactly one" and "Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with a boundary-margin fixture (wick ratio just barely above threshold) asserts `length === 2`; a clearly-unambiguous fixture (wick ratio well clear of threshold) asserts `length === 1`; a further test asserts every entry's invalidation description is non-empty and numerically correct.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — the boundary-proximity margin is a disclosed, named constant (Missing Decision, Decision Log at WP16).
- **Completion Criteria:** All tests pass; the bound is never more than 2 entries.

## WP7 — Independence Boundary Test

**Maps to:** Scope item 13; Architecture Requirements (methodology independence).

- **Deliverables:** `price-action-independence-boundary.spec.ts`, scanning every file under `providers/price-action/` for any import path or literal reference to `wyckoff`, `ict-smc`/`ICT_SMC`, `elliott`, `harmonic`, or `classical-chart-patterns`/`classical.?chart`, mirroring the S1-014 precedent.
- **Acceptance Criteria:** "The Independence Boundary Test... passes, confirming zero references from `providers/price-action/` to any of the five prior Providers' own module directories" (Brief, Acceptance Criteria).
- **Verification Steps:** The test greps `providers/price-action/**/*.ts` (excluding its own spec file) case-insensitively for the five terms above, failing on any match. Run once WP1–WP6's source files exist.
- **Risks:** Same disclosed limitation as every prior boundary test — a lexical check only. Doc comments must describe the independence property without naming the other Providers, learned directly from every prior sprint's own self-review.
- **Completion Criteria:** Test passes with zero matches against the full `price-action/` source tree as it stands after WP1–WP6.

## WP8 — Full Confidence taxonomy integration

**Maps to:** Scope item 8.

- **Deliverables:** `price-action-confidence.util.ts` — Detection Confidence (WP4's quality score for the primary reading), Interpretation Confidence (WP5's momentum/continuation-exhaustion blend), Regime-Adjusted Confidence (this Provider's own rule: breakout/continuation readings strengthen when `REGIME_CONTEXT` reads `volatilityState: 'HIGH'`, weaken when `'LOW'`; rejection readings strengthen when it reads `'LOW'`, weaken when `'HIGH'` — a genuinely distinct axis-and-bifurcation combination from every prior Provider's own rule), and Methodology Confidence Ceiling (a disclosed constant for `'PRICE_ACTION'`, independently calibrated, reflecting this methodology's own decentralized-but-high-core-agreement sourcing profile, distinct from every prior Provider's own ceiling).
- **Acceptance Criteria:** "All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical breakout reading is higher when the Regime/Context Service reads `HIGH` volatility than `LOW`, and — for an identical rejection reading — higher when it reads `LOW` than `HIGH`; Methodology Confidence Ceiling reflects this Provider's own disclosed source-decentralization status... not copied from any of them" (Brief, Acceptance Criteria).
- **Verification Steps:** Two unit tests (one per state family) holding a reading's own scores fixed while varying only the mocked regime's `volatilityState`, asserting the correct direction for breakout vs. rejection readings. A third test asserts the Methodology Confidence Ceiling value is distinct from `60`, `62` (this Provider's own, once set), `65`, `75`, `80`, `85`.
- **Risks:** None beyond calibration — resolved via Decision Log at WP16.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified; ceiling value distinct from all five prior Providers'; Regime-Adjusted Confidence direction verified correct for both state families.

## WP9 — Limitations / graceful degradation

**Maps to:** Scope item 10.

- **Deliverables:** `PriceActionProvider.analyze()` returns a populated `Limitations` (never throws) when no swing exists to serve as a key level, or when the key level has zero subsequent series points.
- **Acceptance Criteria:** "A series with no swing yet, or with a swing but no subsequent series point, produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) an empty `swings` array and (b) a `swings` array whose last entry has no subsequent series points, both asserting a populated `Limitations` result and no thrown exception.
- **Risks:** None beyond the standing "never throw" discipline already established throughout S1-007–S1-014.
- **Completion Criteria:** Both degradation paths tested and passing.

## WP10 — Real Traceability

**Maps to:** Scope item 11.

- **Deliverables:** `Traceability` populated with genuine references to every `SWING_DETECTOR`/`REGIME_CONTEXT`/`INDICATOR_ENGINE` (`atr()`) call actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual Swing Detector/Regime Context/Indicator Engine `computation`/`computationVersion` this Provider consumed" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each service call actually made, each with a `computationVersion` string.
- **Risks:** None beyond ensuring no silent under/over-reporting.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations.

## WP11 — `normalize()` vocabulary mapping

**Maps to:** Scope item 12.

- **Deliverables:** `price-action-normalize.util.ts`'s `normalizePriceActionResult(providerId, methodologyFamily, result): NormalizedProviderOutput` — TREND and STRUCTURE both from the primary reading's own directional bias (breakout direction for `BREAKOUT_*` states — reversed for `BREAKOUT_FAILED`, itself a reversal signal; opposite-of-approach direction for `REJECTED_LEVEL`; `NEUTRAL` for `APPROACHING_LEVEL`, a genuinely evaluated, balanced state, never the ambiguous-default confused with "nothing evaluated"); MOMENTUM genuinely populated from WP5's own velocity score (the first Provider to do so natively, not `NOT_APPLICABLE` or a proxy) whenever a directional reading exists; CONFIRMATION matches TREND's direction only for `BREAKOUT_CONFIRMED`, else `NOT_APPLICABLE`; LIQUIDITY/VOLATILITY/VOLUME always `NOT_APPLICABLE` (VOLUME deliberately, to preserve independence from Wyckoff's own volume-climax methodology). All seven dimensions `NOT_APPLICABLE` when `interpretation.length === 0` (the Limitations path). Added as a sixth entry to `PROVIDER_FIXTURES` in the existing `normalize-vocabulary-conformance.spec.ts` (S1-012) — not a new test suite.
- **Acceptance Criteria:** "`normalize()` is implemented, added as a sixth fixture entry to the existing shared conformance suite... a dedicated test confirms `MOMENTUM` is genuinely populated (not `NOT_APPLICABLE`) from this Provider's own velocity score" (Brief, Acceptance Criteria).
- **Verification Steps:** A dedicated `price-action-normalize.util.spec.ts` (this Provider's own mapping-specific tests, explicitly including the `MOMENTUM`-populated assertion) plus the shared conformance suite's own generic `describe.each` assertions passing for the new fixture entry, with zero modification to the suite's own generic assertion logic.
- **Risks:** None beyond the already-resolved `NEUTRAL`/`NOT_APPLICABLE` semantic distinction (directly reapplied here) and the substring-matching false-positive class of bug caught at S1-013/S1-014 closure (self-review must explicitly re-check every disclosure phrase pair for superset collisions).
- **Completion Criteria:** Both the dedicated mapping test and the shared conformance suite pass for `PriceActionProvider`.

## WP12 — Module registration

**Maps to:** Scope item 1 ("registered as the sixth entry in `ANALYSIS_PROVIDERS`").

- **Deliverables:** `PriceActionProvider` added to `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), as the sixth entry alongside all five prior Providers.
- **Acceptance Criteria:** "...is the sixth entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule` wiring confirms exactly six entries, in registration order. Confirms the Anti-Corruption boundary test and all five prior Independence Boundary Tests still pass. Confirms `CONFLUENCE_ENGINE` resolves correctly with the sixth Provider present.
- **Risks:** None beyond standard module-wiring risk, caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` contains all six Providers in production, in order; all boundary tests pass unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP13 — Golden-dataset / reference-example conformance tests

**Maps to:** Scope item 14.

- **Deliverables:** Two conformance tests: one worked breakout-and-successful-retest instance, one worked clean-rejection instance, each matched against widely-taught, independently-corroborating Price Action conventions (no single primary text exists — multi-source corroboration disclosed, per Risks).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked breakout-and-retest instance and one worked rejection instance... any substitution or multi-source corroboration... is disclosed in the test file and completion report" (Brief, Acceptance Criteria).
- **Verification Steps:** Each test file's own header comment names the corroborating sources and the decentralization disclosure, mirroring the established "SOURCING DISCLOSURE" precedent. Each test constructs its own worked example's swing/series data and asserts the full pipeline (WP1–WP12) reproduces the expected state, quality basis, and disclosed invalidation.
- **Risks:** Brief Escalation Trigger — "No independently-corroborating combination of well-established Price Action sources can be located after a documented attempt" — not, by itself, an escalation-worthy blocker; document the attempt and proceed with the disclosed corroboration achieved.
- **Completion Criteria:** Both conformance tests pass; sourcing disclosure present and honest in both.

## WP14 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-014 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test --force`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP15 — Sprint audit

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1–14) re-verified against its own Acceptance Criteria line, end to end; direct grep of every generic framework file and `confluence/` (the same named list and method used at every prior sprint's own closure) for Price-Action-specific vocabulary; re-check that no named candlestick pattern vocabulary leaked in anywhere (this Sprint's own central named risk).
- **Verification Steps:** Re-read `PriceActionProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks/Approval-Section line by line; re-run all six boundary tests (Anti-Corruption plus five prior Independence Boundary Tests plus this Provider's own); re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists. If found, this WP stops, explains, and proposes the smallest change — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP16 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (`DEC-2026-019`) recording the Missing Decisions fixed at implementation time (rejection/breakout thresholds, boundary-proximity margin, momentum/continuation calibration, Regime-Adjusted Confidence modulation magnitude, golden-dataset sources, Methodology Confidence Ceiling value, `computationVersion`/`vocabularySchemaVersion` scheme). `S1-015_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-015_COMPLETION_REPORT.md` (AI-036) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables/Approval-Section line) in the approved `S1-015_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton + types) → WP2 (key-level identification, needs Swing Detector output) → WP3 (reaction classification, needs WP2's key level + subsequent points) → WP4 (quality scoring, needs WP3's classification) → WP5 (momentum/continuation, needs WP2's points and ATR) → WP6 (bounded interpretation + invalidation, needs WP4/WP5's fully-scored reading) → WP7 (independence boundary, run once WP1–WP6's source tree exists) → WP8 (confidence taxonomy, needs WP4's quality and WP5's momentum) → WP9 (limitations, needs to know what "no key level"/"no subsequent points" looks like from WP2) → WP10 (traceability, needs every service call wired) → WP11 (normalize(), needs a complete real implementation to translate) → WP12 (registration, needs WP1–WP11 complete) → WP13 (golden-dataset, needs the full pipeline) → WP14/WP15/WP16 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- Methodology independence (from `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`) is addressed by: no Work Package touches `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `ObservabilityService`, or anywhere under `confluence/`; WP7/WP12's boundary tests verify zero coupling to any prior Provider's module directory mechanically, not by convention alone.
- No premature promotion: no Work Package proposes moving any Price-Action-internal type or utility into a generic location; the Brief's own Non-Scope and this Task Breakdown's WP1/WP7 both treat this as a standing constraint.
- Candlestick-pattern-reductionism (this Sprint's own central named risk) is addressed structurally: no Work Package produces a named-pattern classification anywhere — WP3 classifies structural *states* (approach/reject/breakout/retest/fail), WP4/WP5 score *measurements* (wick/body/close-position/ATR ratios), never a shape catalog; WP15's own audit explicitly re-checks this rather than assuming it once and moving on.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, the Confluence Engine's own mechanism, or `S1-015_SPRINT_BRIEF.md`'s substantive Scope/Non-Scope/Acceptance Criteria content — only WP16 touches the Brief, and only its Sprint Closure section.
- No Work Package implements a historical multi-level scan, volume-based analysis, trend lines/channels, multi-timeframe analysis, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-015_SPRINT_BRIEF.md`
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md` (process precedent only, per the Brief's own note)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-014_TASK_BREAKDOWN.md` (structural precedent)
