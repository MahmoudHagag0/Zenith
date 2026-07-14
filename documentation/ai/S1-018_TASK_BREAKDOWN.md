# S1-018_TASK_BREAKDOWN

**Document ID:** AI-041
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-018_SPRINT_BRIEF.md` (VSA — Volume Spread Analysis — Provider), based strictly on that Brief, ADR-006/007, DEC-2026-022 (the architecture prerequisite check), and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the S1-007–S1-017 precedent.

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/vsa/` (new, per the Brief's Deliverables section):

- `vsa.types.ts` — VSA-internal types only, never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract. Defines `SpreadClassification` (`'NARROW' | 'AVERAGE' | 'WIDE'`), `VolumeClassification` (`'LOW' | 'AVERAGE' | 'HIGH' | 'ULTRA_HIGH'`), `ClosePosition` (`'NEAR_HIGH' | 'MID' | 'NEAR_LOW'`), `BarDirection` (`'UP' | 'DOWN'`), `ClassifiedBar` (one bar's own full raw classification), `VsaSignalType` (`'NO_DEMAND' | 'NO_SUPPLY' | 'UPTHRUST' | 'SHAKEOUT' | 'STOPPING_VOLUME'`), `VsaSignal` (a bar index plus its own matched signal type), `VsaInvalidation`, and `VsaHypothesis` (a complete, classified, scored signal reading, mirroring every prior Provider's own internal reading-type shape).
- `vsa-bar-classifier.util.ts` — Scope item 2 (per-bar spread/volume/close-position/direction classification).
- `vsa-signal-detector.util.ts` — Scope item 3 (the five named signal types, disclosed priority order, local-extreme lookback for Upthrust/Shakeout).
- `vsa-hypothesis.util.ts` — Scope items 4, 6 (recency-ranked bounded interpretation assembly, disclosed invalidation).
- `vsa-confidence.util.ts` — Scope item 5 (Detection/Interpretation/Regime-Adjusted/Methodology Ceiling for `'VSA'`).
- `vsa-normalize.util.ts` — Scope item 9 (`normalize()` mapping, including native `VOLUME` population).
- `vsa.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Limitations (Scope 7) and Traceability (Scope 8).
- `*.spec.ts` per file above, plus `vsa-independence-boundary.spec.ts` (Scope item 10) and a golden-dataset conformance spec (Scope item 11).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `VsaProvider` skeleton and internal types

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism, no premature promotion).

- **Deliverables:** `VsaProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal `analyze()` internals (wired to later Work Packages) — `id: 'VSA'`, `lifecycleState: 'ACTIVE'`, `tier: 'SLOW'`, `methodologyFamily: 'VSA'`, `computationVersion`, no `dependsOn` (per DEC-2026-022), constructor-injecting `SWING_DETECTOR`, `REGIME_CONTEXT`, and `INDICATOR_ENGINE` (S1-007 tokens — the same three already injected together by `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `PriceActionProvider`, and `FibonacciAnalysisProvider`). `vsa.types.ts` defining the types listed in the Module Layout above.
- **Acceptance Criteria:** "`VsaProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`SLOW`/`methodologyFamily: 'VSA'`, with no `dependsOn` entry" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `VsaProvider` via NestJS `Test.createTestingModule` with the three S1-007 tokens mocked; asserts every required field/method is present and correctly typed, `dependsOn` is `undefined`, `tier` is `'SLOW'`; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — pure scaffolding.
- **Completion Criteria:** Class and types compile, satisfy the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP10).

## WP2 — Per-bar spread/volume/close-position/direction classification

**Maps to:** Scope item 2.

- **Deliverables:** `vsa-bar-classifier.util.ts`'s `classifyBar(bar, precedingBars, atrValue): ClassifiedBar` — spread classified `NARROW`/`AVERAGE`/`WIDE` relative to `atrValue` (ATR-relative-multiple technique, the same category already established by `SupplyDemandProvider`'s own base-tightness classification, applied here to a single bar); volume classified `LOW`/`AVERAGE`/`HIGH`/`ULTRA_HIGH` relative to a trailing average computed strictly from `precedingBars` (never the bar itself, avoiding look-ahead); close position classified `NEAR_HIGH`/`MID`/`NEAR_LOW` from `(close - low) / (high - low)`; direction `UP`/`DOWN` from close vs. open.
- **Acceptance Criteria:** "A dedicated unit test verifies each of the three per-bar classifications (spread, volume, close-position) independently against constructed fixtures spanning every classification state" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests spanning every state of all three classifications (3 + 4 + 3 = 10 constructed fixtures, plus 2 for direction), each asserting the correct classification; a further test confirms the trailing volume average never includes the bar being classified.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — all classification thresholds are disclosed, named constants (Missing Decision, Decision Log at WP14).
- **Completion Criteria:** All fixtures classify correctly; look-ahead exclusion verified.

## WP3 — Bounded, named VSA signal detection with disclosed priority order

**Maps to:** Scope item 3.

- **Deliverables:** `vsa-signal-detector.util.ts`'s `detectSignal(index, classifiedBars, lookbackWindow): VsaSignal | null` — checks, in the disclosed priority order (Upthrust/Shakeout first, since both require a genuine new local extreme; Stopping Volume only if neither matched; No Demand/No Supply last, since both require `NARROW` spread, mutually exclusive with the `WIDE`-spread signals by construction), exactly the five signal types defined in the Brief's Scope item 3. Local-extreme checks compare the bar's own high/low against every high/low in `lookbackWindow` (a disclosed bounded window preceding the bar).
- **Acceptance Criteria:** "A dedicated unit test verifies each of the five named VSA signal types is detected from a purpose-built fixture bar matching its own exact criteria, and that a bar failing any one required criterion is never classified as that signal" and "A dedicated unit test constructs a single bar whose raw values simultaneously satisfy more than one signal's underlying criteria... and confirms the disclosed priority order yields exactly one classification, never a merge" (Brief, Acceptance Criteria).
- **Verification Steps:** Five independently-constructed fixtures, one per signal type, each asserting the correct classification; for each, a further "near-miss" fixture failing exactly one required criterion, asserting no classification results. A dedicated ambiguous-bar fixture (wide spread, high volume, new local high, closing near its own low — satisfying both Upthrust's and, absent the priority order, Stopping Volume's raw criteria) asserts exactly `UPTHRUST`, never both or neither.
- **Risks:** Brief Risk "Signal double-classification risk" — resolved by the disclosed priority order and this WP's own ambiguous-bar test; the local-extreme lookback window size is a disclosed, named constant (Decision Log at WP14).
- **Completion Criteria:** All ten (5 positive + 5 near-miss) fixtures plus the ambiguous-bar test pass.

## WP4 — Bounded, recency-ranked `interpretation[]` and disclosed invalidation

**Maps to:** Scope items 4, 6.

- **Deliverables:** `vsa-hypothesis.util.ts`'s `selectHypotheses(signals): VsaHypothesis[]` — ranks every detected signal within the scan window by recency (bar index, most recent first), bounded at `MAX_VSA_HYPOTHESES = 2` — a recency-based bounding rationale, distinct from every prior Provider's own bounded-hypothesis mechanism (boundary-margin check, one-per-side selection, proximity-to-price ranking, or score-ranked cap). Computes `VsaInvalidation` per hypothesis: the specific subsequent volume/spread/close-position condition that would contradict this signal's own implied bias.
- **Acceptance Criteria:** "given two qualifying bars at different points in the scan window, exactly two hypotheses are returned, the more recent one primary; a separate fixture with only one qualifying bar confirms exactly one" and "Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description" (Brief, Acceptance Criteria).
- **Verification Steps:** A two-signal fixture asserts `length === 2` with the more recent one first; a one-signal fixture asserts `length === 1`; a further test asserts every entry's invalidation description is non-empty and specific to that signal's own type (e.g., a No Demand invalidation names a subsequent wide-spread high-volume up bar).
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — the recency-bound rationale is disclosed as a genuinely different mechanism from every prior Provider's own (Decision Log at WP14).
- **Completion Criteria:** All tests pass; the bound is never more than 2 entries.

## WP5 — Independence Boundary Test

**Maps to:** Scope item 10; Architecture Requirements (methodology independence, this sprint's own central named risk).

- **Deliverables:** `vsa-independence-boundary.spec.ts`, scanning every file under `providers/vsa/` for any import path or literal reference to `wyckoff`/`WYCKOFF`, `ict-smc`/`ICT_SMC`, `elliott`, `harmonic`, `classical-chart-patterns`/`classical.?chart`, `price-action`/`PRICE_ACTION`, `supply-demand`/`SUPPLY_DEMAND`, or `fibonacci-analysis`/`FIBONACCI_ANALYSIS`, mirroring the S1-017 precedent. Shared named-term vocabulary with Wyckoff's own concepts (Climax, Upthrust, Shakeout) is expected and disclosed — the test asserts zero file-level reference/import coupling, never term novelty.
- **Acceptance Criteria:** "The Independence Boundary Test... passes, confirming zero file-level references from `providers/vsa/` to any of the eight prior Providers' own module directories" (Brief, Acceptance Criteria).
- **Verification Steps:** The test greps `providers/vsa/**/*.ts` (excluding its own spec file) case-insensitively for the eight terms above, failing on any match. Run once WP1–WP4's source files exist.
- **Risks:** Same disclosed limitation as every prior boundary test — a lexical check only. Given this sprint's own central named risk (Wyckoff-vocabulary/mechanism conflation), doc comments explaining the shared-terminology disclosure must describe the independence property without naming `WyckoffProvider` or `Wyckoff` directly — the recurring false-positive class caught at S1-007/S1-009/S1-010/S1-011/S1-016; the Sprint Objective and Brief text itself (outside `providers/vsa/`) may name Wyckoff freely, but no file under `providers/vsa/` may.
- **Completion Criteria:** Test passes with zero matches against the full `vsa/` source tree as it stands after WP1–WP4.

## WP6 — Full Confidence taxonomy integration

**Maps to:** Scope item 5.

- **Deliverables:** `vsa-confidence.util.ts` — Detection Confidence (from the qualifying bar's own volume/spread deviation magnitude relative to its own trailing baseline — the sharper the anomaly, the stronger the score), Interpretation Confidence (Detection Confidence strengthened when the qualifying bar occurred at or near a `SWING_DETECTOR`-identified swing high/low), Regime-Adjusted Confidence (this Provider's own rule: the three climax-type signals — Upthrust, Shakeout, Stopping Volume — strengthen when `REGIME_CONTEXT` reads `volatilityState: 'HIGH'`, weaken when `'LOW'`; the two quiet-type signals — No Demand, No Supply — strengthen when it reads `'LOW'`, weaken when `'HIGH'` — a genuinely distinct bifurcating variable, signal-category, from every prior Provider's own rule), and Methodology Confidence Ceiling (a disclosed constant for `'VSA'`, independently calibrated, reflecting this methodology's own distinct sourcing profile — a single identifiable founder's primary text corroborated by a second identifiable author's own text — distinct from every prior Provider's own ceiling).
- **Acceptance Criteria:** "an otherwise-identical qualifying signal scores strictly higher when it occurs at or near a Swing Detector-identified swing high/low than when it does not" and "a test confirms Regime-Adjusted Confidence for an identical climax-type signal... is higher when the Regime/Context Service reads `HIGH` volatility than `LOW`, and — for an identical quiet-type signal... — higher when it reads `LOW` than `HIGH`; Methodology Confidence Ceiling reflects this Provider's own disclosed source profile... not copied from any of them" (Brief, Acceptance Criteria).
- **Verification Steps:** A swing-proximity test holding a signal's own raw scores fixed while varying only proximity to a mocked swing, asserting strictly higher Interpretation Confidence when proximate. Two Regime-Adjusted Confidence tests (one per signal-category) holding a reading's own scores fixed while varying only the mocked regime's `volatilityState`, asserting the correct direction for climax-type vs. quiet-type signals. A further test asserts the Methodology Confidence Ceiling value is distinct from `60`, `65`, `68`, `70`, `72`, `75`, `80`, `85`.
- **Risks:** None beyond calibration — resolved via Decision Log at WP14.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified; ceiling value distinct from all eight prior Providers'; Regime-Adjusted Confidence direction verified correct for both signal categories; swing-proximity adjustment verified.

## WP7 — Limitations / graceful degradation

**Maps to:** Scope item 7.

- **Deliverables:** `VsaProvider.analyze()` returns a populated `Limitations` (never throws) when the series has fewer bars than the disclosed minimum needed to compute both a trailing volume baseline and the local-extreme lookback window.
- **Acceptance Criteria:** "A series with fewer bars than the disclosed minimum needed for both the trailing volume baseline and the local-extreme lookback window produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) an empty series and (b) a series with exactly one fewer bar than the disclosed minimum, both asserting a populated `Limitations` result and no thrown exception.
- **Risks:** None beyond the standing "never throw" discipline already established throughout S1-007–S1-017.
- **Completion Criteria:** Both degradation paths tested and passing.

## WP8 — Real Traceability

**Maps to:** Scope item 8.

- **Deliverables:** `Traceability` populated with genuine references to every `SWING_DETECTOR`/`REGIME_CONTEXT`/`INDICATOR_ENGINE` (`atr()`) call actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual Indicator Engine (`atr()`), Swing Detector, and Regime Context `computation`/`computationVersion` this Provider consumed" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each distinct service call actually made, each with a `computationVersion` string.
- **Risks:** None beyond ensuring no silent under/over-reporting.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations.

## WP9 — `normalize()` vocabulary mapping, including native `VOLUME` population

**Maps to:** Scope item 9.

- **Deliverables:** `vsa-normalize.util.ts`'s `normalizeVsaResult(providerId, methodologyFamily, result): NormalizedProviderOutput` — `VOLUME` populated from the primary hypothesis's own signal category (climax-type signals read as a directional volume-confirmation signal; quiet-type signals read as a directional volume-absence signal) — the first Provider to populate this dimension natively, the disclosed, anticipated exception to every prior Provider's own `NOT_APPLICABLE` (Scope item 9, Risks). `TREND`/`STRUCTURE` from the primary hypothesis's own implied bias direction; `CONFIRMATION` matches for a climax-type signal only; `MOMENTUM`/`LIQUIDITY`/`VOLATILITY` always `NOT_APPLICABLE`, deliberately, to preserve independence from every prior Provider's own native use of those dimensions. All seven dimensions `NOT_APPLICABLE` when `interpretation.length === 0` (the Limitations path). Added as a ninth entry to `PROVIDER_FIXTURES` in the existing `normalize-vocabulary-conformance.spec.ts` (S1-012) — not a new test suite.
- **Acceptance Criteria:** "`normalize()` is implemented, added as a ninth fixture entry to the existing shared conformance suite... a dedicated test confirms `VOLUME` is populated (the first Provider to do so natively) and that every dimension this Provider has no native concept for reads `NOT_APPLICABLE`" (Brief, Acceptance Criteria).
- **Verification Steps:** A dedicated `vsa-normalize.util.spec.ts` (this Provider's own mapping-specific tests) plus the shared conformance suite's own generic `describe.each` assertions passing for the new fixture entry, with zero modification to the suite's own generic assertion logic.
- **Risks:** Brief Risk "`VOLUME`-dimension-population risk" — resolved by this being the explicitly anticipated, disclosed exception (Scope item 9), verified by a dedicated test rather than left as an unexplained divergence from every prior Provider's own convention.
- **Completion Criteria:** Both the dedicated mapping test and the shared conformance suite pass for `VsaProvider`.

## WP10 — Module registration

**Maps to:** Scope item 1 ("registered as the ninth entry in `ANALYSIS_PROVIDERS`").

- **Deliverables:** `VsaProvider` added to `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), as the ninth entry alongside all eight prior Providers.
- **Acceptance Criteria:** "...is the ninth entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule` wiring confirms exactly nine entries, in registration order. Confirms the Anti-Corruption boundary test and all eight prior Independence Boundary Tests still pass. Confirms `CONFLUENCE_ENGINE` resolves correctly with the ninth Provider present.
- **Risks:** None beyond standard module-wiring risk, caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` contains all nine Providers in production, in order; all boundary tests pass unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP11 — Golden-dataset / reference-example conformance tests

**Maps to:** Scope item 11.

- **Deliverables:** Two conformance tests: one worked No Demand/No Supply instance, one worked Upthrust-or-Shakeout instance, each matched against Tom Williams' and/or Anna Coulling's own published descriptions (multi-source corroboration disclosed if a single primary text cannot be independently obtained in this environment, per Risks).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked No Demand/No Supply instance and one worked Upthrust-or-Shakeout instance... any substitution or multi-source corroboration... is disclosed in the test file and completion report" (Brief, Acceptance Criteria).
- **Verification Steps:** Each test file's own header comment names the corroborating sources and any disclosed substitution, mirroring the established "SOURCING DISCLOSURE" precedent. Each test constructs its own worked example's bar series and asserts the full pipeline (WP1–WP10) reproduces the expected signal type, Confidence direction, and disclosed invalidation.
- **Risks:** Brief Escalation Trigger — "No independently-corroborating combination of well-established VSA sources... can be located after a documented attempt" — not, by itself, an escalation-worthy blocker; document the attempt and proceed with the disclosed corroboration achieved.
- **Completion Criteria:** Both conformance tests pass; sourcing disclosure present and honest in both.

## WP12 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-017 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test --force`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP13 — Sprint audit

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1–11) re-verified against its own Acceptance Criteria line, end to end; direct grep of every generic framework file and `confluence/` (the same named list and method used at every prior sprint's own closure) for VSA-specific vocabulary; re-check that no shared internal utility or import exists between this Provider and `providers/wyckoff/` specifically (this Sprint's own central named risk).
- **Verification Steps:** Re-read `VsaProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks/Approval-Section line by line; re-run all nine boundary tests (Anti-Corruption plus eight prior Independence Boundary Tests plus this Provider's own); re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists — including whether VSA's own detection genuinely needed `WyckoffProvider`'s structured output after all (contradicting DEC-2026-022). If found, this WP stops, explains, and proposes the smallest change — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP14 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (`DEC-2026-023`) recording the Missing Decisions fixed at implementation time (`MAX_BARS_FOR_VSA_SCAN`, spread/volume/close-position classification thresholds, trailing-average window, local-extreme lookback window size, Detection/Interpretation Confidence formulas, Regime-Adjusted Confidence modulation magnitude, golden-dataset sources, Methodology Confidence Ceiling value, `computationVersion`/`vocabularySchemaVersion` scheme). `S1-018_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-018_COMPLETION_REPORT.md` (AI-042) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables/Approval-Section line) in the approved `S1-018_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton + types) → WP2 (per-bar classification, needs raw bars + ATR) → WP3 (named signal detection, needs WP2's classifications) → WP4 (bounded interpretation + invalidation, needs WP3's detected signals) → WP5 (independence boundary, run once WP1–WP4's source tree exists) → WP6 (confidence taxonomy, needs WP3's signal categories + Swing Detector proximity) → WP7 (limitations, needs to know what "too few bars" looks like from WP2/WP3) → WP8 (traceability, needs every service call wired) → WP9 (normalize(), needs a complete real implementation to translate) → WP10 (registration, needs WP1–WP9 complete) → WP11 (golden-dataset, needs the full pipeline) → WP12/WP13/WP14 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- Methodology independence (from `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`, `PriceActionProvider`, `SupplyDemandProvider`, `FibonacciAnalysisProvider`) is addressed by: no Work Package touches `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `ObservabilityService`, or anywhere under `confluence/`; WP5/WP10's boundary tests verify zero coupling to any prior Provider's module directory mechanically, not by convention alone.
- No `dependsOn` on `WyckoffProvider` or any other Provider is introduced anywhere in this breakdown, consistent with DEC-2026-022's own finding; WP13's audit explicitly re-checks this was not silently reintroduced during implementation.
- No premature promotion: no Work Package proposes moving any VSA-internal type or utility into a generic location; the Brief's own Non-Scope and this Task Breakdown's WP1/WP5 both treat this as a standing constraint.
- Wyckoff-vocabulary/mechanism-conflation (this Sprint's own central named risk) is addressed structurally: WP3's signal detection operates entirely at the single-bar level using this Provider's own classification vocabulary (WP2), never reading or requiring any trading-range/schematic-phase concept from `providers/wyckoff/`; WP5's boundary test and WP13's audit both explicitly re-verify zero coupling rather than assuming it once and moving on, with WP5's own Risks entry naming exactly how the shared-terminology disclosure must be worded inside `providers/vsa/` to avoid a false-positive trip.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, the Confluence Engine's own mechanism, or `S1-018_SPRINT_BRIEF.md`'s substantive Scope/Non-Scope/Acceptance Criteria content — only WP14 touches the Brief, and only its Sprint Closure section.
- No Work Package implements trading-range/schematic-phase detection, wave-count validation, named XABCD pattern matching, chart-pattern shape-matching, a single-key-level reaction state machine, cross-leg Fibonacci confluence, supply/demand zone health tracking, multi-timeframe analysis, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-018_SPRINT_BRIEF.md`
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-022 — the architecture prerequisite check this sprint's own dependency shape rests on)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md`, `S1-015_SPRINT_BRIEF.md`, `S1-016_SPRINT_BRIEF.md`, `S1-017_SPRINT_BRIEF.md` (process precedent only, per the Brief's own note)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-017_TASK_BREAKDOWN.md` (structural precedent)
