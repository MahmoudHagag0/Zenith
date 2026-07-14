# S1-014_TASK_BREAKDOWN

**Document ID:** AI-033
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-014_SPRINT_BRIEF.md` (Classical Chart Patterns Analysis Provider), based strictly on that Brief, ADR-006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the S1-007–S1-013 precedent.

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/classical-chart-patterns/` (new, per the Brief's Deliverables section):

- `classical-chart-patterns.types.ts` — Classical-Chart-Patterns-internal types only, never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract. Defines `PatternDirection`, `ChartPatternType` (`'HEAD_AND_SHOULDERS' | 'INVERSE_HEAD_AND_SHOULDERS' | 'DOUBLE_TOP' | 'DOUBLE_BOTTOM'`), `PatternPoint` (one swing's role in a candidate — label, timestamp, price), `ShapeCriterionCheck` (one hard-criterion's own margin), `ConfirmationStatus` (`'UNCONFIRMED' | 'CONFIRMED' | 'VOLUME_CONFIRMED'`), `PatternInvalidation`, and `ChartPatternCandidate` (a complete, shape-valid, confirmation-scored candidate carrying its own `survivalReasons`/`weaknesses` string arrays).
- `classical-chart-patterns-candidate-generator.util.ts` — Scope item 3 (two independent, bounded sliding-window scans: 5-swing for Head and Shoulders, 3-swing for Double Top/Bottom).
- `classical-chart-patterns-shape-criteria.util.ts` — Scope item 4 (hard structural criteria per pattern family, margin scoring, neckline-level computation).
- `classical-chart-patterns-confirmation.util.ts` — Scope items 5, 8 (neckline-break confirmation scan over subsequent `MarketSeries` points, volume-expansion check, disclosed invalidation description).
- `classical-chart-patterns-hypothesis.util.ts` — Scope item 7 (bounded, ranked `interpretation[]` assembly and disclosure text).
- `classical-chart-patterns-confidence.util.ts` — Scope item 6 (Detection/Interpretation/Regime-Adjusted/Methodology Ceiling for `'CLASSICAL_CHART_PATTERNS'`).
- `classical-chart-patterns-normalize.util.ts` — Scope item 11 (`normalize()` mapping into the shared seven-dimension vocabulary).
- `classical-chart-patterns.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Limitations (Scope 9) and Traceability (Scope 10).
- `*.spec.ts` per file above, plus `classical-chart-patterns-independence-boundary.spec.ts` (Scope item 12) and a golden-dataset conformance spec (Scope item 13).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `ClassicalChartPatternsProvider` skeleton and internal types

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism, no premature promotion).

- **Deliverables:** `ClassicalChartPatternsProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal `analyze()` internals (wired to later Work Packages) — `id: 'CLASSICAL_CHART_PATTERNS'`, `lifecycleState: 'ACTIVE'`, `tier: 'SLOW'`, `methodologyFamily: 'CLASSICAL_CHART_PATTERNS'`, `computationVersion`, no `dependsOn`, constructor-injecting `SWING_DETECTOR` and `REGIME_CONTEXT` (S1-007 tokens) — `INDICATOR_ENGINE` deliberately not injected (Brief Dependencies: no genuine use for any existing calculator). `classical-chart-patterns.types.ts` defining the types listed in the Module Layout above.
- **Acceptance Criteria:** "`ClassicalChartPatternsProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`SLOW`/`methodologyFamily: 'CLASSICAL_CHART_PATTERNS'`, with no `dependsOn` entry" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `ClassicalChartPatternsProvider` via NestJS `Test.createTestingModule` with the two S1-007 tokens mocked; asserts every required field/method is present and correctly typed, `dependsOn` is `undefined`; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — pure scaffolding.
- **Completion Criteria:** Class and types compile, satisfy the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP11).

## WP2 — Bounded candidate generation (3-swing and 5-swing windows)

**Maps to:** Scope item 3; Risks ("Combinatorial-search risk").

- **Deliverables:** `generateChartPatternCandidates(swingResult): RawChartPatternCandidate[]` — two independent linear scans over the Swing Detector's `swings` array: a 5-swing window producing `HEAD_AND_SHOULDERS`/`INVERSE_HEAD_AND_SHOULDERS` shape candidates (`HIGH,LOW,HIGH,LOW,HIGH` or its mirror), and a 3-swing window producing `DOUBLE_TOP`/`DOUBLE_BOTTOM` shape candidates (`HIGH,LOW,HIGH` or its mirror). Both are **linear scans over consecutive windows, never a combinatorial subset search**.
- **Acceptance Criteria:** "Given a constructed price series with a clear, well-formed Head and Shoulders (or Double Top/Bottom) structure, the Provider identifies that pattern, consistent with the Swing Detector's already-verified swings" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests: (a) a 5-swing fixture produces exactly one raw `HEAD_AND_SHOULDERS`-shape candidate; (b) a 3-swing fixture produces exactly one raw `DOUBLE_TOP`-shape candidate; (c) a type-mismatched sequence produces zero candidates at that offset for both scans; (d) a longer swing sequence produces multiple overlapping-window candidates for each scan, confirming the sliding-window mechanism.
- **Risks:** Brief Risk "Combinatorial-search risk" — resolved by design (`O(n)` for each of the two independent scans).
- **Completion Criteria:** All four tests pass; neither scan inspects a non-consecutive swing subset.

## WP3 — Hard shape (structural) criteria per pattern family

**Maps to:** Scope item 4.

- **Deliverables:** `classical-chart-patterns-shape-criteria.util.ts`'s `applyShapeCriteria(candidate): ChartPatternCandidate | null` — for Head and Shoulders: Head exceeds both Shoulders (hard, binary), Shoulder symmetry within a disclosed tolerance (margin-scored), neckline (Trough) levelness within a disclosed tolerance (margin-scored); for Double Top/Bottom: Peak/Trough equality within a disclosed tolerance (margin-scored). A candidate violating any hard criterion returns `null` (discarded outright, never a low-confidence guess). Computes the pattern's own **neckline level** (average of the relevant Trough(s)/Peak(s)) for later use by WP4.
- **Acceptance Criteria:** "A dedicated unit test constructs a sequence satisfying Head and Shoulders' own shape criteria and confirms it survives; a separate test constructs a sequence violating at least one shape criterion... and confirms it is discarded entirely... The same pair of tests exists for Double Top/Bottom" (Brief, Acceptance Criteria).
- **Verification Steps:** Four unit tests: a shape-valid Head and Shoulders fixture (survives, non-null, populated margins), a shape-invalid one (Head not the highest, or shoulders/neckline beyond tolerance — discarded, `null`), and the same pair for Double Top/Bottom. A fifth test asserts the weakest margin across all applicable criteria determines Detection Confidence's own basis (WP7), the "weakest link" idiom.
- **Risks:** Brief Risk "Shape-tolerance calibration risk" — the exact tolerance values are disclosed, named constants (Missing Decisions, Decision Log at WP15).
- **Completion Criteria:** All five tests pass; a candidate failing any hard criterion is never returned as a hypothesis.

## WP4 — Neckline confirmation, volume-expansion scoring, and disclosed invalidation

**Maps to:** Scope items 5, 8; Risks ("Confirmation-window risk", "False-precision-of-invalidation risk").

- **Deliverables:** `classical-chart-patterns-confirmation.util.ts`'s `scoreConfirmation(candidate, series): ChartPatternCandidate` — scans `series.points` timestamped after the candidate's last swing for the first `close` breaking the neckline in the pattern's own anticipated direction; if found, `confirmationStatus = 'CONFIRMED'`, upgraded to `'VOLUME_CONFIRMED'` if that point's `volume` exceeds the candidate's own formation-period average volume by a disclosed margin; otherwise `'UNCONFIRMED'`. Computes `PatternInvalidation` — the price level (the Head's, or the higher/lower Peak/Trough's, own extreme) beyond which the pattern's anticipated direction is contradicted, derived directly from the same shape data already used for survival (WP3), never a separately-estimated value.
- **Acceptance Criteria:** "A dedicated unit test verifies confirmation-status scoring: an otherwise-identical shape-valid candidate scores a strictly higher Interpretation Confidence when a subsequent series point closes beyond the neckline than when no such point exists... a further test confirms an additional, disclosed volume-expansion bonus..." and "Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description" (Brief, Acceptance Criteria).
- **Verification Steps:** Three unit tests: (a) identical shape-valid candidates, one with a post-pattern series point closing beyond the neckline (`CONFIRMED`) and one without (`UNCONFIRMED`); (b) the confirming point's volume varied above/below the formation-period average to distinguish `CONFIRMED` from `VOLUME_CONFIRMED`; (c) `PatternInvalidation`'s level and description asserted non-empty and numerically correct for both pattern families.
- **Risks:** Brief Risk "Confirmation-window risk" — resolved by design (a single bounded scan over the already-finite, already-supplied `series.points`, never a re-fetch or unbounded lookahead); Brief Risk "False-precision-of-invalidation risk" — mitigated as described above.
- **Completion Criteria:** All three tests pass; confirmation status and invalidation both traced to genuine, already-computed shape/series data.

## WP5 — Bounded multi-hypothesis `interpretation[]` and disclosure text

**Maps to:** Scope item 7.

- **Deliverables:** `classical-chart-patterns-hypothesis.util.ts`'s `finalizeChartPatternHypotheses(candidates): ChartPatternCandidate[]` — ranks all shape-valid, confirmation-scored candidates by Interpretation Confidence (highest first), bounds at `MAX_CHART_PATTERN_HYPOTHESES` (a disclosed named constant). Each entry's `summary` discloses: which pattern type matched and why (its own shape-conformance basis), its confirmation status (unconfirmed/confirmed/volume-confirmed, in trader-facing language), what weakens it (any shape margin below a disclosed threshold), and what would invalidate it (WP4's disclosed `PatternInvalidation`) — the same three/four-part transparency discipline established across every prior bounded-hypothesis Provider in this system.
- **Acceptance Criteria:** Bounded `interpretation[]`, disclosure content requirements (Brief, Acceptance Criteria, "Every surviving hypothesis's summary/evidence content discloses...").
- **Verification Steps:** Unit test with a multi-candidate fixture (overlapping-window matches from WP2) asserts `interpretation.length` bounded at `MAX_CHART_PATTERN_HYPOTHESES`. A second test asserts every entry's `summary` contains the pattern type, confirmation status, and invalidation description.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration risk" — the chosen maximum (Missing Decision, Decision Log at WP15) is a named constant.
- **Completion Criteria:** Both tests pass; the bound is a named, commented constant; disclosure verified present on every hypothesis.

## WP6 — Independence Boundary Test

**Maps to:** Scope item 12; Architecture Requirements (methodology independence).

- **Deliverables:** `classical-chart-patterns-independence-boundary.spec.ts`, scanning every file under `providers/classical-chart-patterns/` for any import path or literal reference to `wyckoff`, `ict-smc`/`ICT_SMC`, `elliott`, or `harmonic`, mirroring the S1-013 precedent.
- **Acceptance Criteria:** "The Independence Boundary Test... passes, confirming zero references from `providers/classical-chart-patterns/` to any of the four prior Providers' own module directories" (Brief, Acceptance Criteria).
- **Verification Steps:** The test greps `providers/classical-chart-patterns/**/*.ts` (excluding its own spec file) case-insensitively for `wyckoff`, `ict-smc`, `ict_smc`, `elliott`, and `harmonic`, failing on any match. Run once WP1–WP5's source files exist.
- **Risks:** Same disclosed limitation as every prior boundary test — a lexical check only. Doc comments must describe the independence property without naming the other Providers, learned directly from every prior sprint's own self-review.
- **Completion Criteria:** Test passes with zero matches against the full `classical-chart-patterns/` source tree as it stands after WP1–WP5.

## WP7 — Full Confidence taxonomy integration

**Maps to:** Scope item 6.

- **Deliverables:** `classical-chart-patterns-confidence.util.ts` — Detection Confidence (WP3's weakest shape-tolerance margin for the primary, highest-ranked hypothesis), Interpretation Confidence (WP4's confirmation status — unconfirmed scores lowest, confirmed higher, volume-confirmed highest, each a disclosed constant), Regime-Adjusted Confidence (this Provider's own rule: strengthens when `REGIME_CONTEXT` reads `trendState: 'TRENDING'`, weakens when `'RANGING'` — reasoning distinct from any prior Provider's own rule: a reversal pattern's claim requires a genuine prior trend to reverse; multiplier values independently calibrated, not copied from any prior Provider's own values), and Methodology Confidence Ceiling (a disclosed constant for `'CLASSICAL_CHART_PATTERNS'`, independently calibrated, reflecting Edwards & Magee's status as an exceptionally well-documented single-lineage primary source).
- **Acceptance Criteria:** "All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected pattern is higher when the Regime/Context Service reads `TRENDING` than when it reads `RANGING`; Methodology Confidence Ceiling reflects this Provider's own disclosed source-documented status... not copied from any of them" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test holding a candidate's shape/confirmation scores fixed while varying only the mocked regime's `trendState`, asserting `TRENDING` strictly exceeds `RANGING` (a non-saturating fixture score). A second test asserts the Methodology Confidence Ceiling value is distinct from every prior Provider's own ceiling (`60`, `65`, `75`, `85`).
- **Risks:** None beyond calibration — resolved via Decision Log at WP15.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified; ceiling value distinct from all four prior Providers'.

## WP8 — Limitations / graceful degradation

**Maps to:** Scope item 9.

- **Deliverables:** `ClassicalChartPatternsProvider.analyze()` returns a populated `Limitations` (never throws) when no candidate satisfies either pattern family's hard shape criteria anywhere in the swing sequence.
- **Acceptance Criteria:** "A series with no candidate satisfying either pattern family's shape criteria produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) a swing sequence with fewer than 3 swings (no window possible) and (b) a swing sequence with enough swings but every window failing shape criteria for both pattern families, both asserting a populated `Limitations` result and no thrown exception.
- **Risks:** None beyond the standing "never throw" discipline already established throughout S1-007–S1-013.
- **Completion Criteria:** Both degradation paths tested and passing.

## WP9 — Real Traceability

**Maps to:** Scope item 10.

- **Deliverables:** `Traceability` populated with genuine references to every `SWING_DETECTOR`/`REGIME_CONTEXT` call actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual Swing Detector/Regime Context `computation`/`computationVersion` this Provider consumed" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each service call actually made, each with a `computationVersion` string.
- **Risks:** None beyond ensuring no silent under/over-reporting.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations.

## WP10 — `normalize()` vocabulary mapping

**Maps to:** Scope item 11.

- **Deliverables:** `classical-chart-patterns-normalize.util.ts`'s `normalizeClassicalChartPatternsResult(providerId, methodologyFamily, result): NormalizedProviderOutput` — TREND and STRUCTURE both from the primary hypothesis's own anticipated reversal direction (`BULLISH`/`BEARISH`); CONFIRMATION matches that direction only when the primary hypothesis's own disclosed confirmation status is `CONFIRMED` or `VOLUME_CONFIRMED` (never for `UNCONFIRMED`), else `NOT_APPLICABLE`; MOMENTUM/LIQUIDITY/VOLATILITY/VOLUME always `NOT_APPLICABLE` (no native concept in V1 scope). All seven dimensions `NOT_APPLICABLE` when `interpretation.length === 0` (the Limitations path), never the ambiguous-default `NEUTRAL` — the same semantic discipline established across every prior Provider. `ClassicalChartPatternsProvider.normalize()` wired to this function. Added as a fifth entry to `PROVIDER_FIXTURES` in the existing `normalize-vocabulary-conformance.spec.ts` (S1-012) — not a new test suite.
- **Acceptance Criteria:** "`normalize()` is implemented, added as a fifth fixture entry to the existing shared conformance suite... and passes its generic assertions unmodified" (Brief, Acceptance Criteria).
- **Verification Steps:** A dedicated `classical-chart-patterns-normalize.util.spec.ts` (this Provider's own mapping-specific tests) plus the shared conformance suite's own generic `describe.each` assertions passing for the new fixture entry, with zero modification to the suite's own generic assertion logic.
- **Risks:** None beyond the already-resolved `NEUTRAL`/`NOT_APPLICABLE` semantic distinction (directly reapplied here, not re-derived) and the substring-matching false-positive class of bug caught at S1-013 closure (self-review must explicitly re-check any negative-case disclosure phrase is not a superset of its positive counterpart).
- **Completion Criteria:** Both the dedicated mapping test and the shared conformance suite pass for `ClassicalChartPatternsProvider`.

## WP11 — Module registration

**Maps to:** Scope item 1 ("registered as the fifth entry in `ANALYSIS_PROVIDERS`").

- **Deliverables:** `ClassicalChartPatternsProvider` added to `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), as the fifth entry alongside `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, and `HarmonicPatternsProvider`.
- **Acceptance Criteria:** "...is the fifth entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule` wiring confirms exactly five entries, in registration order. Confirms the Anti-Corruption boundary test and all four prior Independence Boundary Tests still pass. Confirms `CONFLUENCE_ENGINE` resolves correctly with the fifth Provider present.
- **Risks:** None beyond standard module-wiring risk, caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` contains all five Providers in production, in order; all boundary tests pass unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP12 — Golden-dataset / reference-example conformance test

**Maps to:** Scope item 13.

- **Deliverables:** A conformance test reproducing at least one worked Head and Shoulders (or Double Top/Bottom) instance matched against Edwards & Magee's "Technical Analysis of Stock Trends" (1948), with a disclosed-fallback substitution if it cannot be independently obtained in this implementation environment (S1-007/S1-009/S1-010/S1-011/S1-013 precedent).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked pattern instance from a named, cited source; any substitution... is disclosed in the test file and completion report" (Brief, Acceptance Criteria).
- **Verification Steps:** The test file's own header comment names the source (or the disclosed substitution and reason), mirroring the established "SOURCING DISCLOSURE" precedent exactly. The test constructs the worked example's swing sequence and asserts the full pipeline (WP1–WP11) reproduces the pattern match, with the correct shape-conformance basis, confirmation status, and disclosed invalidation description.
- **Risks:** Brief Escalation Trigger — "A primary or well-established Classical Chart Patterns source's worked example genuinely cannot be located after a documented attempt" — the disclosed-fallback allowance applies if so.
- **Completion Criteria:** Conformance test passes; sourcing disclosure present and honest.

## WP13 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-013 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test --force`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP14 — Sprint audit

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1–13) re-verified against its own Acceptance Criteria line, end to end; direct grep of every generic framework file and `confluence/` (the same named list and method used at every prior sprint's own closure) for Classical-Chart-Patterns-specific vocabulary; re-check that the disclosure requirements (shape basis/confirmation status/invalidation) appear on every hypothesis.
- **Verification Steps:** Re-read `ClassicalChartPatternsProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks/Approval-Section line by line; re-run all five boundary tests (Anti-Corruption plus four prior Independence Boundary Tests plus this Provider's own); re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists. If found, this WP stops, explains, and proposes the smallest change — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP15 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (`DEC-2026-018`) recording the Missing Decisions fixed at implementation time (shape-tolerance values, volume-expansion margin, hypothesis bound, Interpretation Confidence values per confirmation state, Regime-Adjusted Confidence modulation magnitude, golden-dataset source, Methodology Confidence Ceiling value, `computationVersion`/`vocabularySchemaVersion` scheme). `S1-014_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-014_COMPLETION_REPORT.md` (AI-034) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables/Approval-Section line) in the approved `S1-014_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton + types) → WP2 (raw candidate generation, needs Swing Detector output) → WP3 (hard shape criteria + neckline computation, needs WP2's raw candidates) → WP4 (confirmation/volume scoring + invalidation, needs WP3's shape-valid candidates and the neckline they computed) → WP5 (bounded `interpretation[]` + disclosure, needs WP3/WP4's fully-scored candidates) → WP6 (independence boundary, run once WP1–WP5's source tree exists) → WP7 (confidence taxonomy, needs WP3's margins and WP4's confirmation scores) → WP8 (limitations, needs to know what "no shape-valid candidate" looks like from WP3) → WP9 (traceability, needs every service call wired) → WP10 (normalize(), needs a complete real implementation to translate) → WP11 (registration, needs WP1–WP10 complete) → WP12 (golden-dataset, needs the full pipeline) → WP13/WP14/WP15 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- Methodology independence (from `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`) is addressed by: no Work Package touches `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `ObservabilityService`, or anywhere under `confluence/`; WP6/WP11's boundary tests verify zero coupling to any prior Provider's module directory mechanically, not by convention alone.
- No premature promotion: no Work Package proposes moving any Classical-Chart-Patterns-internal type or utility into a generic location; the Brief's own Non-Scope and this Task Breakdown's WP1/WP6 both treat this as a standing constraint.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, the Confluence Engine's own mechanism, or `S1-014_SPRINT_BRIEF.md`'s substantive Scope/Non-Scope/Acceptance Criteria content — only WP15 touches the Brief, and only its Sprint Closure section.
- No Work Package implements Triangles/Flags/Pennants/Wedges/Rectangles/Rounding formations, price-target projection, multi-degree nested labeling, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-014_SPRINT_BRIEF.md`
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md` (process precedent only, per the Brief's own note)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-013_TASK_BREAKDOWN.md` (structural precedent)
