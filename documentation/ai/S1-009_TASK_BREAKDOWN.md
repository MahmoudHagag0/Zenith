# S1-009_TASK_BREAKDOWN

**Document ID:** AI-023
**Version:** 1.0.0
**Status:** Proposed
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-009_SPRINT_BRIEF.md` (Wyckoff Method Analysis Provider), based strictly on that Brief, ADR-005/006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Work Packages are dependency-ordered; each is self-reviewed and unit-tested immediately on completion before the next begins, per the Brief's own engineering rigor precedent (S1-007/S1-008).

# Proposed Module Layout

`apps/api/src/analysis-engine/providers/wyckoff/` (new, per the Brief's Deliverables section):

- `wyckoff.types.ts` — Wyckoff-internal types (detected range, individual event records, phase-hypothesis candidates). Internal only — never a new field on the shared `AnalysisProviderResult`/`Evidence`/`Interpretation`/`Limitations`/`Traceability` contract (Architecture Requirements: "No new interpretation mechanism").
- `wyckoff-range.detector.ts` — Scope item 2 (trading range identification).
- `wyckoff-accumulation.detector.ts` / `wyckoff-distribution.detector.ts` — Scope item 3 (event detection, symmetric but distinct rule sets).
- `wyckoff-phase.classifier.ts` — Scope items 5–6 (Phase A–E classification, bounded multi-hypothesis).
- `wyckoff.provider.ts` — the `AnalysisProvider` implementation itself (Scope item 1), composing the above plus Confidence (Scope 7), Limitations (Scope 8), and Traceability (Scope 9).
- `*.spec.ts` per file above, plus `wyckoff-volume-boundary.spec.ts` (the keyword-boundary test, Acceptance Criteria) and a golden-dataset conformance spec (Scope item 10).

Final file naming/grouping is an implementation-time detail, not a scope change, consistent with the Brief's own "no re-derivation of swing logic — composed, not duplicated" principle and ADR-006's precedent of leaving concrete module structure to implementation.

---

# Work Packages

## WP1 — `WyckoffProvider` skeleton and contract wiring

**Maps to:** Scope item 1; Architecture Requirements (token-free registration, no new interpretation mechanism).

- **Deliverables:** `WyckoffProvider` class implementing the full `AnalysisProvider` interface (S1-008) with placeholder/minimal bodies for `analyze()`'s internals (wired to later Work Packages) — `id`, `lifecycleState: 'ACTIVE'`, `tier: 'SLOW'`, `methodologyFamily: 'WYCKOFF'`, `computationVersion`, `normalize(): void`, constructor-injecting `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` (S1-007 tokens).
- **Acceptance Criteria:** "`WyckoffProvider` implements the full `AnalysisProvider` interface... registered `ACTIVE`/`SLOW`/`methodologyFamily: 'WYCKOFF'`" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test constructs `WyckoffProvider` via NestJS `Test.createTestingModule` with the three S1-007 tokens mocked; asserts every required field/method is present and correctly typed; confirms it compiles against the `AnalysisProvider` interface with zero `any`/`unknown` escapes.
- **Risks:** None specific — this WP is pure scaffolding. Carries forward the Brief's Architecture Requirements risk (no Wyckoff-specific fifth Confidence kind or contract extension) as a standing constraint for every later WP.
- **Completion Criteria:** Class compiles, satisfies the interface, unit test passes; not yet registered in `ANALYSIS_PROVIDERS` (that is WP9, after the implementation is real).

## WP2 — Trading range identification

**Maps to:** Scope item 2.

- **Deliverables:** `WyckoffRangeDetector` (or equivalent), consuming `SWING_DETECTOR`'s swing highs/lows and structure events (BOS/CHoCH) and `REGIME_CONTEXT`'s `trendState`, producing a candidate range (support/resistance bounds, start/end timestamps) or `null` when none is identifiable.
- **Acceptance Criteria:** "Given a constructed price series with a clear accumulation-like structure, the Provider identifies a trading range consistent with the Swing Detector's already-verified swing highs/lows (no re-derivation of swing logic — composed, not duplicated)" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests against constructed `MarketSeries` fixtures: (a) a clear range-bound series produces a range whose bounds match the fixture's known swing highs/lows; (b) a clean, uninterrupted trend produces `null` (feeds WP7's Limitations); (c) confirms the detector calls `SWING_DETECTOR`/`REGIME_CONTEXT` rather than re-implementing swing logic (mock call assertions, mirroring the composition discipline already verified for `RegimeContextService` in S1-007).
- **Risks:** Brief Risk "Premature confidence risk" begins here — a range detector that is too eager to declare a range where structure is genuinely ambiguous would propagate false certainty into every later WP. Mitigated by requiring `null` (not a low-confidence guess) when the fixture is genuinely trend-only.
- **Completion Criteria:** Range detection unit tests pass; `null`-path verified; no swing/regime logic duplicated (composition-only, verified by test).

## WP3 — Accumulation Schematic #1 event detection

**Maps to:** Scope item 3 (Accumulation half); Scope item 4 (volume boundary, accumulation's Selling Climax only).

- **Deliverables:** Deterministic detectors for PS, SC, AR, ST, Spring, Test (of the Spring), SOS, LPS, each a fully-specified rule against price (and, for SC only, `Candle.volume`), operating on a WP2-identified range.
- **Acceptance Criteria:** "Each of the eight Accumulation events (PS, SC, AR, ST, Spring, Test, SOS, LPS)... is verified by a dedicated unit test constructing a price (and, for SC/BC only, volume) sequence that deterministically triggers that specific event and no other" (Brief, Acceptance Criteria) — accumulation half.
- **Verification Steps:** One dedicated unit test per event (8 tests minimum): each constructs a price/volume sequence that triggers exactly that event, and asserts no other accumulation event fires on the same fixture. A combined-sequence test (PS→SC→AR→ST→Spring→Test→SOS→LPS in order) verifies the full schematic is detected coherently, not just each event in isolation.
- **Risks:** Brief Risk "Overreach into VSA's territory" — SC's volume check must stay narrowly climax-specific (a disclosed threshold, Missing Decisions), never generalized into bar-by-bar effort/result scoring. Brief Risk "Premature confidence risk" for Spring specifically — Spring detection alone (this WP) is a structural fact (an undercut occurred); *how confident* that fact is is WP6's job, not this one's — this WP must not itself decide confidence.
- **Completion Criteria:** All 8 accumulation event detectors pass their dedicated tests plus the combined-sequence test; volume usage confined to SC exactly as scoped.

## WP4 — Distribution Schematic #1 event detection

**Maps to:** Scope item 3 (Distribution half); Scope item 4 (volume boundary, distribution's Buying Climax only); the keyword-boundary safety-net test (Acceptance Criteria).

- **Deliverables:** Deterministic detectors for PSY, BC, AR (Automatic Reaction), ST, UT/UTAD, Test, SOW, LPSY — the mirror-image structure of WP3. Plus: `wyckoff-volume-boundary.spec.ts`, the lightweight keyword-boundary test scanning every file under `providers/wyckoff/` for literal VSA-specific terms.
- **Acceptance Criteria:** "...and eight Distribution events (PSY, BC, AR, ST, UT/UTAD, Test, SOW, LPSY) is verified by a dedicated unit test..." and "A lightweight keyword-boundary test flags literal VSA-specific terminology... appearing anywhere in the Wyckoff Provider's own source" (Brief, Acceptance Criteria).
- **Verification Steps:** Mirrors WP3's per-event and combined-sequence tests for the distribution side. The keyword-boundary test greps `providers/wyckoff/**/*.ts` (excluding its own spec file) for `no demand`, `no supply`, `stopping volume`, `effort vs. result score` (case-insensitive) and fails if any are found — run once WP3 and WP4's source both exist, since it scans the whole directory.
- **Risks:** Same overreach/premature-confidence risks as WP3, mirrored for BC/UT/UTAD. Additional risk: the keyword-boundary test is a *lexical* check only — it cannot catch overreach expressed without those exact words (e.g. a bar-by-bar volume-weighted score under a different name). This limitation is disclosed in the Brief itself ("not a substitute for code-review judgment, but a real, running check") and is not a defect to fix here.
- **Completion Criteria:** All 8 distribution event detectors pass their tests; keyword-boundary test passes (zero matches) against the full `wyckoff/` source tree as it stands after WP3+WP4.

## WP5 — Phase A–E classification and bounded multi-hypothesis `interpretation[]`

**Maps to:** Scope items 5–6.

- **Deliverables:** `WyckoffPhaseClassifier` mapping a WP3/WP4-detected event sequence to Phase A–E, returning a bounded, ranked list of candidate phase readings (length 1 when unambiguous, >1 when genuinely ambiguous — e.g. Spring not yet confirmed). Phase-schematic attribution (modern Wyckoff Method curriculum) recorded distinctly from the Three Laws attribution, in code comments and the eventual `evidence`/`traceability` content.
- **Acceptance Criteria:** "Phase classification returns a bounded, disclosed-maximum `interpretation[]`... a test confirms more than one candidate is returned for a genuinely ambiguous... series, and exactly one for an unambiguous, fully-formed schematic" and "The Phase-classification attribution... is recorded distinctly from Wyckoff's own Three Laws attribution" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with a fully-formed WP3 combined sequence (through LPS) asserts exactly one candidate (Phase D/E). A truncated sequence (through AR only, no Spring yet) asserts more than one ranked candidate. A grep/doc-comment check confirms the two attributions are recorded as textually distinct strings, never concatenated into one undifferentiated citation.
- **Risks:** Brief Risk "Multi-hypothesis bound calibration" — the chosen maximum (a Missing Decision, resolved via Decision Log at this WP's completion, not pre-approval) must be disclosed as a named constant, never an undocumented magic number, mirroring the circuit-breaker threshold precedent from S1-008 (DEC-2026-012).
- **Completion Criteria:** Ambiguous- and unambiguous-sequence tests both pass; the multi-hypothesis bound is a named, commented constant; attribution distinction verified.

## WP6 — Full Confidence taxonomy integration

**Maps to:** Scope item 7.

- **Deliverables:** Detection Confidence (per detected event/range fit), Interpretation Confidence (already produced per-hypothesis by WP5, wired into the final `interpretation[]`), Regime-Adjusted Confidence (composes `REGIME_CONTEXT`'s `trendState`), and Methodology Confidence Ceiling (a disclosed constant for `'WYCKOFF'`) — all four correctly labeled per `ConfidenceKind` (S1-008).
- **Acceptance Criteria:** "All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected structure is lower when the Regime/Context Service reads `TRENDING` than when it reads `RANGING`; Methodology Confidence Ceiling reflects Wyckoff's disclosed source-verified status (a specific, test-asserted value or floor, not left implicit)" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test holding the detected range/events fixed while mocking `REGIME_CONTEXT.getRegime()` to return `TRENDING` vs. `RANGING`, asserting the resulting Regime-Adjusted Confidence value strictly decreases in the `TRENDING` case. A second test asserts Methodology Confidence Ceiling equals (or is bounded by) the disclosed constant on every output, never implicit/absent.
- **Risks:** Brief Risk "Premature confidence risk" is resolved by this WP, not merely mitigated — Regime-Adjusted Confidence and Interpretation Confidence together are the mechanism that prevents an unconfirmed Spring from reading as certain.
- **Completion Criteria:** All four Confidence kinds present, labeled, and test-verified as above.

## WP7 — Limitations / graceful degradation

**Maps to:** Scope item 8.

- **Deliverables:** `WyckoffProvider.analyze()` returns a populated `Limitations` (never throws) when WP2 returns `null` (no identifiable range) or the input series has insufficient bars for range/event detection.
- **Acceptance Criteria:** "A series with no identifiable range (e.g. too few bars, or a clean uninterrupted trend) produces a populated `Limitations` entry, verified never to throw" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit tests with (a) a too-short `MarketSeries` fixture and (b) a clean-trend fixture (from WP2) both assert a populated `Limitations` result and assert no exception is thrown, matching ADR-006's "never throw" discipline exactly as every prior component in this system has upheld it.
- **Risks:** None beyond the standing "never throw" discipline already established and tested throughout S1-007/S1-008 — this WP applies the same discipline, it does not introduce a new one.
- **Completion Criteria:** Both degradation paths tested and passing; no code path in `analyze()` can throw an unhandled exception for a data-insufficiency reason (a genuine bug would still throw — that distinction, established in S1-007's `ComputationRejectedError` precedent, is preserved here via `Limitations`, not a typed rejection, since ADR-006 requires Provider-level graceful degradation specifically, not a rejection).

## WP8 — Real Traceability

**Maps to:** Scope item 9.

- **Deliverables:** `Traceability` populated with genuine references to every `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` call `WyckoffProvider` actually made during a given `analyze()` invocation, including each one's `computation`/`computationVersion`.
- **Acceptance Criteria:** "`Traceability` output references the actual `computation`/`computationVersion` of every Indicator Engine/Swing Detector/Regime Context call the Provider made — verified present and non-empty on a representative successful run" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test on a representative successful run asserts `traceability.intermediateCalculations` is non-empty and contains an entry for each underlying service call actually made (matching mocked call count), each with a `computationVersion` string.
- **Risks:** None beyond ensuring this WP does not silently under-report (omitting a call) or over-report (fabricating a call that didn't happen) — both are directly testable via mock call-count assertions.
- **Completion Criteria:** Test passes; `Traceability` content traced back to real invocations, not placeholder text (unlike the S1-008 fixture Providers' stub).

## WP9 — Module registration

**Maps to:** Scope item 1 ("Registered as the first non-empty entry in `ANALYSIS_PROVIDERS`"); Architecture Requirements (registration via module import only).

- **Deliverables:** `WyckoffProvider` added to `ProvidersModule`'s `ANALYSIS_PROVIDERS` factory (`useFactory`/`inject`), making the array non-empty in production for the first time.
- **Acceptance Criteria:** "...is the first non-empty entry in `ANALYSIS_PROVIDERS` in production" (Brief, Acceptance Criteria).
- **Verification Steps:** Integration test resolving `ANALYSIS_PROVIDERS` from the real `AnalysisEngineModule`/`ProvidersModule` (not a test-only override) confirms exactly one entry, `id` matching `WyckoffProvider`'s. Confirms the Anti-Corruption boundary test (unmodified) still passes against the new `wyckoff/` subdirectory.
- **Risks:** None beyond standard module-wiring risk (a missed export/import causing a NestJS resolution failure) — caught immediately by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `ANALYSIS_PROVIDERS` non-empty in production; boundary test passes unmodified; `pnpm --filter @zenith/api build` succeeds.

## WP10 — Golden-dataset / reference-example conformance test

**Maps to:** Scope item 10.

- **Deliverables:** A conformance test reproducing at least one worked Wyckoff schematic example (Accumulation or Distribution) from a named, cited source, with a disclosed-fallback substitution if the specific source cannot be independently obtained in this implementation environment (S1-007 precedent).
- **Acceptance Criteria:** "A golden-dataset/reference-example test reproduces at least one worked Wyckoff schematic example... from a named, cited source; any substitution... is disclosed in the test file and completion report, per the S1-007 precedent" (Brief, Acceptance Criteria).
- **Verification Steps:** The test file's own header comment names the source (or the disclosed substitution and reason), mirroring `rsi.calculator.spec.ts`'s "SOURCING DISCLOSURE" precedent exactly. The test constructs the worked example's price/volume sequence and asserts the full pipeline (WP2→WP9) reproduces its known event sequence and phase classification.
- **Risks:** Brief Escalation Trigger — "A primary Wyckoff Method source's worked example genuinely cannot be located after a documented attempt" — if this occurs, the disclosed-fallback allowance applies (as it did for Wilder in S1-007); this is not, by itself, an escalation-worthy blocker unless no reasonable secondary source can be found either, matching the S1-007 precedent's own resolution.
- **Completion Criteria:** Conformance test passes; sourcing disclosure present and honest.

## WP11 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria ("No HTTP endpoint... No new Prisma model. No new runtime dependency," "All S1-001 through S1-008 acceptance criteria continue to pass").

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression.
- **Verification Steps:** `pnpm turbo run build lint test`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk, caught by this WP's own execution.
- **Completion Criteria:** All tasks green; dependency/schema/HTTP-surface checks confirmed clean.

## WP12 — Sprint audit (Phase 4 equivalent)

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers, taken together.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated per the Brief's Escalation Triggers if it constitutes a genuine architectural gap (e.g. the generic contract proving insufficient — Risks).
- **Acceptance Criteria:** Every Scope item (1–10) re-verified against its own Acceptance Criteria line, end to end, not just per-WP in isolation; the source-fidelity attribution (WP5), volume boundary (WP3/WP4), and premature-confidence safeguards (WP6) re-checked as a coherent whole rather than as isolated unit-test passes.
- **Verification Steps:** Re-read `WyckoffProvider`'s full `analyze()` path against the Brief's Scope/Non-Scope/Risks sections line by line; re-run the keyword-boundary test; re-run the full monorepo suite once more after any audit-driven fix.
- **Risks:** This is the checkpoint where a genuine architectural gap (per the Brief's Escalation Triggers) would surface, if one exists — most plausibly the "generic contract proves insufficient" risk. If found, this WP stops, explains, and proposes the smallest change, per the Brief and this workflow's own rule — it does not fix an architectural issue unilaterally.
- **Completion Criteria:** No unresolved Critical finding; all Recommended fixes applied; full suite green after any fix.

## WP13 — Decision Log, closure, completion report

**Maps to:** Deliverables section (Decision Log entry, completion report, final assessment).

- **Deliverables:** A Decision Log entry (next available `DEC-2026-0NN`) recording the Missing Decisions fixed at implementation time (multi-hypothesis bound, event-detection numeric thresholds, golden-dataset source, Methodology Confidence Ceiling value, `computationVersion` scheme). `S1-009_SPRINT_BRIEF.md`'s Sprint Closure section updated. `documentation/ai/S1-009_COMPLETION_REPORT.md` written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done (Brief) satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section, one-to-one, before declaring closure.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item (or a sprint-wide Acceptance Criteria/Deliverables line) in the approved `S1-009_SPRINT_BRIEF.md` — none introduces content the Brief does not already authorize.
- Dependency order verified: WP1 (skeleton) → WP2 (range) → WP3/WP4 (events, need a range to detect against) → WP5 (phase, needs events) → WP6 (confidence, needs phase hypotheses and range/regime) → WP7 (limitations, needs to know what "no range" looks like from WP2) → WP8 (traceability, needs every service call from WP2/WP3/WP4/WP6 wired) → WP9 (registration, needs a complete, real implementation, not a skeleton) → WP10 (golden-dataset, needs the full pipeline) → WP11/WP12/WP13 (verification, audit, closure). No forward reference to a not-yet-built dependency found.
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007, or `S1-009_SPRINT_BRIEF.md`'s substantive content — only WP13 touches the Brief, and only its Sprint Closure section (a governance/status field, per the S1-007/S1-008 precedent), never Scope/Non-Scope/Acceptance Criteria.
- No Work Package registers a second Provider, builds VSA, adds an HTTP endpoint, or persists a Trace Store — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-006)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-008_TASK_BREAKDOWN.md` (structural precedent)
- `documentation/ai/S1-007_COMPLETION_REPORT.md` (golden-dataset sourcing-disclosure precedent)
