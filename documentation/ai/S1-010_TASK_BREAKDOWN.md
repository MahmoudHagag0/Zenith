# S1-010_TASK_BREAKDOWN

**Document ID:** AI-025
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-010_SPRINT_BRIEF.md` (ICT / Smart Money Concepts Analysis Provider), based strictly on that Brief (including its Approval Section's binding Implementation Guidance #1–#4), ADR-005/006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the Brief's own engineering rigor precedent (S1-007/S1-008/S1-009).

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/ict-smc/` (new, per the Brief's Deliverables section):

- `ict-smc.types.ts` — ICT/SMC-internal types only, never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract (Architecture Requirements: "No new interpretation mechanism"). Structured per Implementation Guidance #1 as a **narrative-oriented model, not three unrelated pattern records**:
  - `IctNarrativeStage = 'LIQUIDITY_EVENT' | 'DISPLACEMENT' | 'IMBALANCE' | 'INSTITUTIONAL_REACTION'` — an internal classification tag only, never surfaced as a new Confidence kind or contract field.
  - `DisplacementLeg` — the impulse price leg following a Swing Detector `BOS` event; computed once, referenced by both Order Block and Fair Value Gap detection instead of each re-deriving "the move" independently. This is the concrete, minimal expression of Guidance #1's `Displacement` stage.
  - `OrderBlock` (stage `INSTITUTIONAL_REACTION`) — carries an optional reference to the `DisplacementLeg` it originates.
  - `FairValueGap` (stage `IMBALANCE`) — carries an optional reference to the `DisplacementLeg` it was left within, when one is found; a gap with no enclosing Displacement Leg is still recorded (not every gap arises from a labeled break) but without that link, per Guidance #1's "V1 is not required to implement that reasoning."
  - `LiquiditySweep` (stage `LIQUIDITY_EVENT`) — carries an optional best-effort reference to a `DisplacementLeg` that immediately follows it within a small bar window, when one is found. No score or confidence is attached to this link in V1 — it exists only so the data shape does not have to change when a future sprint chains these stages into real reasoning.
  - `IctSmcBiasHypothesis` — the bounded multi-hypothesis bias record (Scope item 6).
- `ict-smc-displacement.util.ts` — Scope item 2 (Displacement Leg derivation from Swing Detector output).
- `ict-smc-order-block.detector.ts` — Scope item 3.
- `ict-smc-fvg.detector.ts` — Scope item 4.
- `ict-smc-liquidity-sweep.detector.ts` — Scope item 5.
- `ict-smc-bias.classifier.ts` — Scope item 6.
- `ict-smc-confidence.util.ts` — Scope item 7 (Detection/Interpretation/Regime-Adjusted/Methodology Ceiling for `'ICT_SMC'`).
- `ict-smc.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Limitations (Scope 8) and Traceability (Scope 9).
- `*.spec.ts` per file above, plus `ict-smc-independence-boundary.spec.ts` (Scope item 10) and a golden-dataset conformance spec (Scope item 11).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `IctSmcProvider` skeleton and narrative-oriented internal types

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism); Implementation Guidance #1 (data-shape foundation for the liquidity-narrative evolution path).

- **Deliverables:** `IctSmcProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal `analyze()` internals (wired to later Work Packages) — `id: 'ICT_SMC'`, `lifecycleState: 'ACTIVE'`, `tier: 'FAST'`, `methodologyFamily: 'ICT_SMC'`, `computationVersion`, no `dependsOn`, `normalize(): void`, constructor-injecting `SWING_DETECTOR` and `INDICATOR_ENGINE` (S1-007 tokens; `REGIME_CONTEXT` also injected — needed by WP7). `ict-smc.types.ts` defining `IctNarrativeStage`, `DisplacementLeg`, `OrderBlock`, `FairValueGap`, `LiquiditySweep`, `IctSmcBiasHypothesis` as described in the Module Layout above.
- **Acceptance Criteria:** "`IctSmcProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`FAST`/`methodologyFamily: 'ICT_SMC'`, with no `dependsOn` entry" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `IctSmcProvider` via NestJS `Test.createTestingModule` with the S1-007 tokens mocked; asserts every required field/method is present and correctly typed, `dependsOn` is `undefined`; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — pure scaffolding. Carries forward the Brief's Architecture Requirements risk (no ICT-specific fifth Confidence kind or contract extension) as a standing constraint for every later WP.
- **Completion Criteria:** Class and types compile, satisfy the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP10, after the implementation is real).

## WP2 — Market Structure reuse and Displacement Leg derivation

**Maps to:** Scope item 2; Implementation Guidance #1.

- **Deliverables:** `deriveDisplacementLegs(points, swingResult): DisplacementLeg[]` (or equivalent) — for each `BOS` `StructureEvent` the Swing Detector reports (via `swingDetector.detect(series, {sensitivity: 3})`), derives the impulse leg producing that break, as a single shared computation. This directly replaces what would otherwise be duplicated "find the impulse move" logic inside both WP3 (Order Block) and WP4 (FVG) — a concrete architectural simplification that falls out of Guidance #1's narrative framing, not an unrelated refactor.
- **Acceptance Criteria:** "This Provider consumes the Swing Detector's already-computed `swings` and `structureEvents`... calls `swingDetector.detect(series, {sensitivity: 3})`" (Brief, Scope item 2).
- **Verification Steps:** Unit tests against constructed `MarketSeries` fixtures: (a) a fixture with a known `BOS` event produces exactly one `DisplacementLeg` whose start/end match the fixture's known impulse candles; (b) a fixture with no structure events produces an empty array (feeds WP8's Limitations); (c) confirms the function calls `SWING_DETECTOR` rather than re-implementing swing/structure logic (mock call assertions, mirroring the composition discipline verified for `WyckoffRangeDetector` in S1-009).
- **Risks:** Brief Risk "Independence-erosion" begins to matter here — this WP must derive Displacement Legs from the generic `StructureEvent` shape only, never by importing anything from `providers/wyckoff/`.
- **Completion Criteria:** Displacement Leg derivation unit tests pass; empty-array path verified; no swing/structure logic duplicated (composition-only, verified by test).

## WP3 — Order Block (Institutional Reaction) detection

**Maps to:** Scope item 3.

- **Deliverables:** `detectOrderBlocks(points, displacementLegs): OrderBlock[]` — for each WP2 `DisplacementLeg`, locates the last opposing-direction candle immediately preceding it, classifying Bullish/Bearish Order Block with its price zone (candle high/low) and timestamp, tagged `stage: 'INSTITUTIONAL_REACTION'` and linked to its originating `DisplacementLeg`.
- **Acceptance Criteria:** "A dedicated unit test constructs a price sequence that deterministically triggers a Bullish Order Block and no other, and one that deterministically triggers a Bearish Order Block and no other" (Brief, Acceptance Criteria).
- **Verification Steps:** One dedicated unit test per direction (2 tests minimum), each constructing a price sequence that triggers exactly that Order Block and asserts no other Order Block fires on the same fixture; a combined-sequence test verifies detection is coherent across multiple Displacement Legs in one series, not just isolated single-leg fixtures.
- **Risks:** Brief Risk "Premature confidence risk" — an Order Block that has not yet been tested/mitigated by subsequent price action must not be flagged with unwarranted certainty; this WP records the structural fact only, confidence is WP7's job, not this one's.
- **Completion Criteria:** Both direction tests plus the combined-sequence test pass; every `OrderBlock` correctly links back to its `DisplacementLeg`.

## WP4 — Fair Value Gap (Imbalance) detection

**Maps to:** Scope item 4.

- **Deliverables:** `detectFairValueGaps(points, atr, displacementLegs): FairValueGap[]` — a deterministic three-candle-window scan (Bullish: candle 1 high < candle 3 low; Bearish: candle 1 low > candle 3 high), filtered by an ATR-relative minimum gap size (`INDICATOR_ENGINE`'s ATR calculator), tagged `stage: 'IMBALANCE'`; where a detected gap falls within a WP2 `DisplacementLeg`'s span, links to it.
- **Acceptance Criteria:** "A dedicated unit test constructs a three-candle sequence that deterministically triggers a Bullish FVG and one that triggers a Bearish FVG, plus a sequence whose gap falls below the ATR-relative minimum and correctly produces no FVG" (Brief, Acceptance Criteria).
- **Verification Steps:** Three unit tests (Bullish FVG, Bearish FVG, below-threshold no-FVG) plus a test confirming a gap falling inside a fixture's known `DisplacementLeg` span is correctly linked, and one falling outside any Displacement Leg is still recorded but unlinked (per Guidance #1's disclosed V1 non-requirement).
- **Risks:** Brief Risk "Independence-erosion" — the ATR-relative threshold must use `INDICATOR_ENGINE`'s existing ATR calculator directly (S1-007), never a Wyckoff-specific tolerance helper from `providers/wyckoff/`.
- **Completion Criteria:** All four tests pass; ATR-relative threshold is a named, commented constant (Missing Decisions), not a magic number.

## WP5 — Liquidity Sweep (Liquidity Event) detection, and Independence Boundary Test

**Maps to:** Scope item 5; Scope item 10 (Independence Boundary Test — placed here, once all three primitive detectors and the shared types/util files exist, mirroring the S1-009 WP4 precedent of running the boundary test once the relevant source tree is populated).

- **Deliverables:** `detectLiquiditySweeps(points, swingResult, atr): LiquiditySweep[]` — a candle whose high/low pierces a prior swing extreme by more than an ATR-relative tolerance while its close remains back within the prior range, tagged `stage: 'LIQUIDITY_EVENT'`; where a Liquidity Sweep is immediately followed (within a small, named bar window) by a WP2 `DisplacementLeg`, a best-effort link is recorded, unscored. Plus: `ict-smc-independence-boundary.spec.ts`, scanning every file under `providers/ict-smc/` for any import path or literal reference containing `wyckoff`.
- **Acceptance Criteria:** "A dedicated unit test constructs a sequence that deterministically triggers a Liquidity Sweep (pierce-then-close-back-inside) and a separate sequence that produces a genuine breakout (pierce-and-hold), verifying the two are correctly distinguished" and "The Independence Boundary Test... passes, confirming zero references from `providers/ict-smc/` to `providers/wyckoff/`" (Brief, Acceptance Criteria).
- **Verification Steps:** Two unit tests (Liquidity Sweep vs. genuine breakout, same swing-extreme fixture varied only by the following candle's close) plus one test confirming the best-effort Displacement Leg link is present when temporally adjacent and absent otherwise. The boundary test greps `providers/ict-smc/**/*.ts` (excluding its own spec file) case-insensitively for `wyckoff` and fails if any match is found.
- **Risks:** Brief Risk "Independence-erosion risk" — this is the checkpoint where that risk is verified mechanically, not just by design intent. Additional risk, disclosed same as S1-009's VSA-vocabulary test: this is a lexical check only, not a substitute for code-review judgment.
- **Completion Criteria:** Both detection tests and the link test pass; boundary test passes (zero matches) against the full `ict-smc/` source tree as it stands after WP1–WP5.

## WP6 — Bounded multi-hypothesis `interpretation[]` / bias synthesis

**Maps to:** Scope item 6.

- **Deliverables:** `classifyIctSmcBias(orderBlocks, fairValueGaps, liquiditySweeps, structureEvents): IctSmcBiasHypothesis[]` — synthesizes a directional bias reading (continuation or reversal), returning a bounded, ranked list (length 1 when unambiguous, >1 when evidence genuinely conflicts, e.g. a fresh Bullish Order Block coincides with an unmitigated Bearish Liquidity Sweep).
- **Acceptance Criteria:** "Phase/bias classification returns a bounded, disclosed-maximum `interpretation[]`... a test confirms more than one candidate is returned for a genuinely conflicting-evidence constructed series, and exactly one for an unambiguous series" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with an unambiguous fixture (e.g. a Bullish Order Block and no conflicting Liquidity Sweep) asserts exactly one candidate. A conflicting-evidence fixture asserts more than one ranked candidate. The multi-hypothesis bound is asserted as a named constant.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration" — the chosen maximum (a Missing Decision, resolved via Decision Log at this WP's completion) must be disclosed as a named constant, mirroring the Wyckoff/circuit-breaker precedent (DEC-2026-012/013).
- **Completion Criteria:** Ambiguous- and unambiguous-sequence tests both pass; the multi-hypothesis bound is a named, commented constant.

## WP7 — Full Confidence taxonomy integration

**Maps to:** Scope item 7.

- **Deliverables:** Detection Confidence (per detected Order Block/FVG/Sweep fit), Interpretation Confidence (already produced per-hypothesis by WP6, wired into the final `interpretation[]`), Regime-Adjusted Confidence (this Provider's own rule: Order-Block-based continuation reads strengthen in `TRENDING`, Liquidity-Sweep-based reversal reads strengthen in `RANGING` — the mirror-image direction of Wyckoff's rule, not a copy of it), and Methodology Confidence Ceiling (a disclosed constant for `'ICT_SMC'`, strictly lower than Wyckoff's `85`) — all four correctly labeled per `ConfidenceKind` (S1-008).
- **Acceptance Criteria:** "...a test confirms Regime-Adjusted Confidence for an identical detected structure differs between `TRENDING` and `RANGING` regime reads, in the direction disclosed in Scope item 7; Methodology Confidence Ceiling reflects ICT/SMC's disclosed source-unverified status and is a specific, test-asserted value lower than Wyckoff's `85`" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test holding a continuation-biased (Order-Block-led) reading fixed while mocking `REGIME_CONTEXT.getRegime()` to return `TRENDING` vs. `RANGING`, asserting Regime-Adjusted Confidence is higher in `TRENDING`. A second test does the mirror check for a reversal-biased (Liquidity-Sweep-led) reading, asserting higher confidence in `RANGING`. A third test asserts Methodology Confidence Ceiling equals the disclosed constant and is strictly less than `85` on every output.
- **Risks:** Brief Risk "Premature confidence risk" is resolved by this WP, not merely mitigated. Risk of accidentally copying Wyckoff's `TRENDING_REGIME_PENALTY` constant/direction verbatim instead of deriving ICT/SMC's own, substantively different rule — mitigated by the two-fixture test above, which would fail if the direction were wrongly copied.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified as above; Methodology Confidence Ceiling value test-asserted below `85`.

## WP8 — Limitations / graceful degradation

**Maps to:** Scope item 8.

- **Deliverables:** `IctSmcProvider.analyze()` returns a populated `Limitations` (never throws) when no Order Block, Fair Value Gap, Liquidity Sweep, or structure event can be identified (e.g. too few bars, or a series with no qualifying structural events).
- **Acceptance Criteria:** "A series with no identifiable Order Block, FVG, Liquidity Sweep, or structure event produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) a too-short `MarketSeries` fixture and (b) a fixture with no qualifying structural events both assert a populated `Limitations` result and assert no exception is thrown, matching ADR-006's "never throw" discipline exactly as every prior component has upheld it.
- **Risks:** None beyond the standing "never throw" discipline already established and tested throughout S1-007/S1-008/S1-009 — this WP applies the same discipline, it does not introduce a new one.
- **Completion Criteria:** Both degradation paths tested and passing; no code path in `analyze()` can throw an unhandled exception for a data-insufficiency reason.

## WP9 — Real Traceability

**Maps to:** Scope item 9.

- **Deliverables:** `Traceability` populated with genuine references to every `SWING_DETECTOR`/`INDICATOR_ENGINE`(ATR)/`REGIME_CONTEXT` call `IctSmcProvider` actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual Swing Detector (and, where used, Indicator Engine ATR) `computation`/`computationVersion` the Provider consumed — verified present and non-empty on a representative successful run" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each underlying service call actually made (matching mocked call count), each with a `computationVersion` string.
- **Risks:** None beyond ensuring this WP does not silently under-report or over-report calls — both directly testable via mock call-count assertions.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations.

## WP10 — Module registration

**Maps to:** Scope item 1 ("Registered as the second entry in `ANALYSIS_PROVIDERS`"); Architecture Requirements (registration via module factory only).

- **Deliverables:** `IctSmcProvider` added to `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), as the second entry alongside `WyckoffProvider`.
- **Acceptance Criteria:** "...is the second entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule` (updating `analysis-engine.module.spec.ts`'s existing assertion, S1-009) confirms exactly two entries, `id`s matching `WyckoffProvider` and `IctSmcProvider` respectively, in registration order. Confirms the Anti-Corruption boundary test (unmodified) still passes against the new `ict-smc/` subdirectory. Confirms the Independence Boundary Test (WP5) still passes with both Providers registered.
- **Risks:** None beyond standard module-wiring risk, caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` contains both Providers in production; boundary tests pass unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP11 — Golden-dataset / reference-example conformance test

**Maps to:** Scope item 11.

- **Deliverables:** A conformance test reproducing at least one worked ICT/SMC example (Order Block, FVG, or Liquidity Sweep) from a named, cited source, with a disclosed-fallback substitution if the specific source cannot be independently obtained in this implementation environment (S1-007/S1-009 precedent). The test's header comment also records exactly which definition of each primitive this Provider implements (Brief, Scope item 11 — definitional-variance disclosure).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked ICT/SMC example... from a named, cited source; any substitution... is disclosed in the test file and completion report" (Brief, Acceptance Criteria).
- **Verification Steps:** The test file's own header comment names the source (or the disclosed substitution and reason) and the exact definition used per primitive, mirroring the `rsi.calculator.spec.ts`/`wyckoff.provider.golden-dataset.spec.ts` "SOURCING DISCLOSURE" precedent exactly. The test constructs the worked example's price sequence and asserts the full pipeline (WP1–WP10) reproduces its known Order Block/FVG/Liquidity Sweep and bias reading.
- **Risks:** Brief Escalation Trigger — "A primary or well-established ICT/SMC source's worked example genuinely cannot be located after a documented attempt" — if this occurs, the disclosed-fallback allowance applies, matching the S1-007/S1-009 precedent's own resolution; not, by itself, an escalation-worthy blocker unless no reasonable secondary source can be found either.
- **Completion Criteria:** Conformance test passes; sourcing and definitional-choice disclosure present and honest.

## WP12 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-009 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP13 — Sprint audit (Phase 8 equivalent)

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together; Implementation Guidance #1–#4 re-checked as a coherent whole.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1–11) re-verified against its own Acceptance Criteria line, end to end; the independence boundary (WP5/WP10), the narrative data-shape (WP1/WP2, re-checked against Guidance #1 — does the design still leave the `Liquidity Event → Displacement → Imbalance → Institutional Reaction` evolution path open?), and premature-confidence safeguards (WP7) re-checked as a coherent whole rather than isolated unit-test passes.
- **Verification Steps:** Re-read `IctSmcProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks/Approval-Section-Guidance line by line; re-run both boundary tests; re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists. If found, this WP stops, explains, and proposes the smallest change — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP14 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (`DEC-2026-014`) recording the Missing Decisions fixed at implementation time (multi-hypothesis bound, ATR-relative thresholds, Regime-Adjusted Confidence modulation magnitude, golden-dataset source, Methodology Confidence Ceiling value, `computationVersion` scheme). `S1-010_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-010_COMPLETION_REPORT.md` (AI-026) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables/Approval-Section-Guidance line) in the approved `S1-010_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton + types) → WP2 (Displacement Leg, needs Swing Detector output) → WP3/WP4/WP5 (the three primitives, each consuming WP2's Displacement Legs and/or Swing Detector swings; WP5 also carries the Independence Boundary Test, run once WP1–WP5's source tree exists) → WP6 (bias synthesis, needs all three primitives) → WP7 (confidence, needs bias hypotheses and Regime Context) → WP8 (limitations, needs to know what "nothing detected" looks like from WP2–WP5) → WP9 (traceability, needs every service call from WP2/WP4/WP5/WP7 wired) → WP10 (registration, needs a complete, real implementation) → WP11 (golden-dataset, needs the full pipeline) → WP12/WP13/WP14 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- Implementation Guidance #1 (narrative framing) is addressed concretely by WP1's type design and WP2's shared `DisplacementLeg` derivation — not by a slogan restated in comments only; WP13's audit explicitly re-checks this rather than assuming it once and moving on.
- Implementation Guidance #2 (independence / no framework leakage) is addressed by: no Work Package touches `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, or `ObservabilityService`; WP5/WP10's boundary tests verify zero coupling to `providers/wyckoff/` mechanically, not by convention alone.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, or `S1-010_SPRINT_BRIEF.md`'s substantive Scope/Non-Scope/Acceptance Criteria content — only WP14 touches the Brief, and only its Sprint Closure section (a governance/status field, per the S1-007/S1-008/S1-009 precedent).
- No Work Package registers a Provider-to-Provider `dependsOn` relationship to `WyckoffProvider`, builds Killzones/OTE/Power of Three, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-010_SPRINT_BRIEF.md`
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md` (process precedent only, per the Brief's own note)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-009_TASK_BREAKDOWN.md` (structural precedent)
- `documentation/ai/S1-007_COMPLETION_REPORT.md` (golden-dataset sourcing-disclosure precedent)
