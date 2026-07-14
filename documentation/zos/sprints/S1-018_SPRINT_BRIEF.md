# S1-018 SPRINT BRIEF — VSA (Volume Spread Analysis) Provider

**Document ID:** ZOS-S1-018
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-018
- **Sprint Name:** VSA (Volume Spread Analysis) Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`–`S1-017_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-14
- **Approved By:** Architecture Team (2026-07-14 — autonomous full-lifecycle execution authorized under the standing S1-013→S1-018 Roadmap Order, conditioned on "once its architectural prerequisites are satisfied" — see DEC-2026-022 and the Approval Section)

---

# Sprint Objective

S1-009's `WyckoffProvider` explicitly disclosed a deliberate volume boundary: `Candle.volume` was used there only for the narrow, classical Selling/Buying Climax criterion, with "bar-by-bar effort/result scoring across an entire series, 'no demand'/'no supply' bar classification, and any other Volume Spread Analysis concept" left as "VSA's job" — a future Provider, not silently absorbed into Wyckoff. **S1-018 registers the ninth Provider — VSA (Volume Spread Analysis)** — and claims exactly that deferred territory. Per DEC-2026-022's own prerequisite check, VSA requires no `dependsOn` on `WyckoffProvider` or any other Provider: its actual analytical mechanism (Tom Williams' "effort vs. result" law, read bar-by-bar) needs only the same shared substrate every other Provider already consumes.

VSA's own defining analytical claim — the mechanism no prior Provider has — is a **quantified effort-vs-result reading of each individual bar**: comparing that bar's own volume (the "effort" the market expended) against the price spread it produced (the "result" that effort achieved), classified together with where the bar's own close fell within its spread. A bar showing high effort for a disproportionately small result is read as absorption or divergence; a bar showing a large result for ordinary or low effort is read as a genuinely low-resistance move. This is a single-bar, deterministic reading, never a whole-range schematic (`WyckoffProvider`'s own territory), a multi-swing wave count, a five-point pattern shape, a cross-leg ratio confluence, or a zone's own health tracking — every one of which belongs to a different, already-registered Provider.

This sprint is this system's ninth live proof of the Analysis Provider Framework's methodology-agnosticism (following Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, Classical Chart Patterns, Price Action, Supply & Demand, and Fibonacci Analysis) and the Confluence Engine's own genuine extensibility (S1-012): registering a ninth Provider must require zero change to `AnalysisProvider`, the Execution Engine, the Confluence Engine, or the Normalized Vocabulary Schema — only a new `normalize()` mapping confined to this Provider's own module directory, exactly as ADR-007 anticipated. VSA is also honestly disclosed as the Provider most likely to be mistaken for an extension of `WyckoffProvider`, since Tom Williams built VSA directly atop Wyckoff's own principles and VSA classically reuses several of Wyckoff's own named-event terms (Climax, Upthrust, Shakeout) — this sprint's central named risk (see Risks) is keeping the *terminology* honestly shared while keeping the *detection mechanism* and *source code* fully independent, mechanically verified exactly as every conceptually-adjacent pair of Providers before it (`SupplyDemandProvider`/`IctSmcProvider`; `FibonacciAnalysisProvider`/`ElliottWaveProvider`/`HarmonicPatternsProvider`) has already been.

---

# Scope

Per ADR-006 (Provider contract mechanics), ADR-007 (Normalized Vocabulary, consumed unchanged), DEC-2026-022 (the architecture prerequisite check establishing no `dependsOn` is required), and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`VsaProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'VSA'`, `methodologyFamily: 'VSA'`, **`tier: 'SLOW'`** — a bounded scan across a recent-bar window classifying each bar independently, the same tiering category as every other bounded-multi-window-search Provider. `dependsOn` **not set** — independent of every other Provider, most importantly `WyckoffProvider`, per DEC-2026-022's own finding. Registered as the **ninth entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`), constructed from the same `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` tokens already injected together by `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `PriceActionProvider`, and `FibonacciAnalysisProvider`.
2. **Per-bar spread/volume/close-position classification — the raw measurement layer no prior Provider computes.** For each bar in a disclosed bounded lookback window (`MAX_BARS_FOR_VSA_SCAN`): spread is classified `NARROW`/`AVERAGE`/`WIDE` relative to `INDICATOR_ENGINE.atr()` (the same ATR-relative-multiple technique already established by `SupplyDemandProvider`'s own base-tightness classification, applied here to a single bar's own range rather than a multi-candle base); volume is classified `LOW`/`AVERAGE`/`HIGH`/`ULTRA_HIGH` relative to a trailing average volume computed strictly from prior bars in the window (never including the bar being classified, to avoid look-ahead); close position within the bar's own spread is classified `NEAR_HIGH`/`MID`/`NEAR_LOW`. These three classifications, together with the bar's own up/down direction, are this Provider's entire raw Evidence vocabulary.
3. **Bounded, named VSA signal detection — a fixed, disclosed set of five signal types, each a specific, mutually-exclusive-by-construction combination of Scope item 2's classifications, checked in a disclosed priority order so no bar is ever double-classified:**
   - **No Demand** — an up bar, `NARROW` spread, `LOW` volume, occurring while the Regime/Context Service reads an active up-move — a weakness signal (buyers show no real interest advancing price).
   - **No Supply** — a down bar, `NARROW` spread, `LOW` volume, occurring during an active down-move — a strength signal (sellers show no real interest pressing price lower).
   - **Upthrust** — this bar's own high exceeds every high in a disclosed local lookback window (a genuine new local extreme, checked first), `WIDE` spread, `HIGH`/`ULTRA_HIGH` volume, close position `NEAR_LOW` — the new high was not accepted, a supply/weakness signal, read from this single bar's own effort-vs-result relationship rather than `WyckoffProvider`'s own whole-trading-range UT/UTAD schematic event.
   - **Shakeout** — this bar's own low undercuts every low in the same local lookback window (checked first, mutually exclusive with Upthrust by construction), `WIDE` spread, `HIGH`/`ULTRA_HIGH` volume, close position `NEAR_HIGH` — the new low was not accepted, a demand/strength signal, the mirror-image single-bar read of `WyckoffProvider`'s own Spring, again without requiring any pre-identified trading range.
   - **Stopping Volume** — checked only for a bar that is `WIDE`-spread and `HIGH`/`ULTRA_HIGH`-volume but did **not** qualify as Upthrust or Shakeout (no new local extreme was made): a down bar closing `NEAR_HIGH`, or an up bar closing `NEAR_LOW` — effort was expended against the prevailing move and largely absorbed, a potential-reversal signal.
   A dedicated unit test constructs a single bar whose raw values simultaneously satisfy more than one signal's underlying criteria and confirms the disclosed priority order yields exactly one classification, never a merge.
4. **Bounded, disclosed `interpretation[]` — ranked by recency, capped at `MAX_VSA_HYPOTHESES = 2`, a genuinely different bounding rationale from every prior Provider's own** (a single boundary-margin check, a one-per-side selection, a proximity-to-current-price ranking, or a score-ranked cap): every bar within the scan window classified into one of Scope item 3's five signal types is a candidate; the most recent qualifying bar is primary, the second-most-recent (if any) is the disclosed alternate. Recency, not price proximity or score, is the ranking key — VSA's own signals are read as time-decaying (a stale effort-vs-result anomaly matters less than a fresh one), a distinct rationale from Fibonacci Analysis's own proximity-to-price bounding.
5. **Full Confidence taxonomy** (S1-008): Detection Confidence (how extreme the qualifying bar's own volume/spread deviation from its own trailing baseline is — the sharper the anomaly, the stronger the raw detection), Interpretation Confidence (Detection Confidence strengthened when the qualifying bar occurred at or near a Swing Detector-identified swing high/low — classical VSA teaching reads these signals as most meaningful at genuine turning points, giving this Provider a distinct, disclosed reason to consume `SWING_DETECTOR` for context-anchoring rather than pattern geometry), Regime-Adjusted Confidence (this Provider's own rule: the three wide-spread, high-volume climax-type signals — Upthrust, Shakeout, Stopping Volume — strengthen when the Regime/Context Service reads `volatilityState: 'HIGH'`, since a genuine climax naturally co-occurs with volatility expansion, corroborating rather than contradicting it; the two narrow-spread, low-volume signals — No Demand, No Supply — strengthen when it reads `'LOW'`, since a genuine "no interest" reading requires an already-quiet tape to be meaningful, not one that could just be transient noise inside an already-volatile swing; a genuinely distinct bifurcating variable — signal-category, climax-type vs. quiet-type — from every prior Provider's own rule, even where the underlying `volatilityState` axis is reused from `HarmonicPatternsProvider`'s, `PriceActionProvider`'s, and `FibonacciAnalysisProvider`'s own rules), and Methodology Confidence Ceiling (this Provider's own disclosed value, reflecting VSA's own distinct sourcing profile: a single identifiable founder's own primary text — Tom Williams' "Master the Markets" — corroborated by a second identifiable author's own widely-cited text — Anna Coulling's "A Complete Guide to Volume Price Analysis" — a stronger sourcing shape than Price Action's or Supply & Demand's fully decentralized multi-educator sourcing, but a newer, less classically-settled body of work than Wyckoff's own; independently calibrated from, not copied from, any prior Provider's own ceiling).
6. **Explicit, disclosed invalidation description per hypothesis** — directly answering the same "what invalidates this reading?" question every prior Provider answers: the specific subsequent volume/spread/close-position condition that would contradict this signal's own implied bias (e.g., a No Demand reading is invalidated by a subsequent wide-spread, high-volume up bar) is computed and disclosed in that hypothesis's summary text — no new contract field.
7. **Populated `Limitations`, never a thrown exception**, when the series has fewer bars than the disclosed minimum needed to compute both a trailing volume baseline and the local-extreme lookback window — per ADR-006, the same discipline as every other component in this system.
8. **Real `Traceability`**, referencing the actual Indicator Engine (`atr()`), Swing Detector, and Regime Context outputs consumed (their `computationVersion`s included).
9. **`normalize()` implementation** (ADR-007), confined to `providers/vsa/`, mapping this Provider's own Evidence/Interpretation into the shared seven-dimension vocabulary using only its own domain knowledge — honestly `NOT_APPLICABLE` for every dimension it has no native concept for. `VOLUME` is populated natively for the first time by any Provider (every prior Provider left it `NOT_APPLICABLE` specifically to preserve independence from `WyckoffProvider`'s own volume-climax methodology — this Provider is the one whose native methodology *is* volume, so populating it here is the intended, disclosed exception, not scope creep). Added as the ninth entry to the existing shared `normalize()` conformance test suite (`normalize-vocabulary-conformance.spec.ts`, S1-012), not a new test suite.
10. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as every prior Provider's own independence check) asserting that no file under `providers/vsa/` imports from, or otherwise references, `providers/wyckoff/`, `providers/ict-smc/`, `providers/elliott-wave/`, `providers/harmonic-patterns/`, `providers/classical-chart-patterns/`, `providers/price-action/`, `providers/supply-demand/`, or `providers/fibonacci-analysis/`. Named-term reuse shared with Wyckoff's own vocabulary (Climax, Upthrust, Shakeout) is expected and disclosed (Sprint Objective) — the test asserts zero file-level reference/import coupling, never term novelty, the same distinction already established for `SupplyDemandProvider`'s shared `LIQUIDITY`-dimension disclosure and `FibonacciAnalysisProvider`'s shared ratio-vocabulary disclosure.
11. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked No Demand/No Supply instance and a worked Upthrust-or-Shakeout instance, matched against Tom Williams' and Anna Coulling's own published descriptions (Risks), with the same disclosed-fallback/multi-source-corroboration allowance established at every prior sprint where a single canonical primary text could not be independently obtained in this environment.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, DEC-2026-022, and this Brief's own scope discipline:

- **Any dependency, via `dependsOn`, on `WyckoffProvider` or any other prior Provider.** DEC-2026-022 already determined this is not required; this sprint's own Independence Boundary Test (Scope item 10) verifies it mechanically, not merely by design intent.
- **Trading-range identification, Accumulation/Distribution Schematic events (PS/SC/AR/ST/Spring/Test/SOS/LPS or PSY/BC/AR/ST/UT/UTAD/Test/SOW/LPSY), or Phase A–E classification of any kind.** `WyckoffProvider`'s own territory (S1-009); this Provider never identifies a range or a schematic phase, only a single bar's own effort-vs-result relationship.
- **Wave-count validation, named XABCD harmonic pattern matching, chart-pattern shape-matching, single-key-level reaction-state classification, cross-leg Fibonacci confluence, or supply/demand zone health tracking of any kind.** Each the own territory of `ElliottWaveProvider`, `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`, `PriceActionProvider`, and `SupplyDemandProvider`/`FibonacciAnalysisProvider` respectively.
- **Multi-timeframe analysis, or any intraday/session-window concept.** `MarketSeries` carries single-timeframe daily-bar points only; out of scope architecturally, not merely deferred, the same limitation already disclosed for `IctSmcProvider`'s own Killzones exclusion (S1-010).
- **Any other methodology Provider.** Whether any further Provider follows S1-018 is a future Architecture Team Roadmap decision this sprint does not make.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework or the Confluence Engine.** If a genuinely reusable abstraction emerges during implementation, it stays inside `providers/vsa/`. Promotion into either shared component is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **Any change to the Normalized Vocabulary Schema, `ConfluenceWeightStrategy`, or the dimension-aggregation mechanism** (ADR-007, S1-012) — this Provider is a new vocabulary-mapping *consumer* of that already-approved design, not a redesign of it.
- **Any change to the Execution Engine's `dependsOn`/topological-sort mechanism**, including adding a data-passing channel between Providers. DEC-2026-022 found this genuinely unsolved but not required for VSA specifically; it remains correctly deferred, not addressed as part of this sprint.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-017 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `VsaProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–11 as a new `apps/api/src/analysis-engine/providers/vsa` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a `normalize()` mapping added to the existing shared conformance suite; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR`, `REGIME_CONTEXT`, and `INDICATOR_ENGINE` (`atr()`) tokens — consumed, not modified. `VsaProvider` injects the same three tokens already injected together by `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `PriceActionProvider`, and `FibonacciAnalysisProvider`.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `VsaProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself, and without exercising its `dependsOn` mechanism (DEC-2026-022).
- S1-012's Normalized Vocabulary Schema and shared `normalize()` conformance suite — consumed and extended (one new fixture entry), not redesigned.
- **S1-009's `WyckoffProvider`, S1-010's `IctSmcProvider`, S1-011's `ElliottWaveProvider`, S1-013's `HarmonicPatternsProvider`, S1-014's `ClassicalChartPatternsProvider`, S1-015's `PriceActionProvider`, S1-016's `SupplyDemandProvider`, and S1-017's `FibonacciAnalysisProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from any of their own module directories, per DEC-2026-022.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's standing authorization for the S1-013→S1-018 Roadmap Order, conditioned on DEC-2026-022's own architecture prerequisite check having found no blocker.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `VsaProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Provider-specific output shape or a fifth Confidence kind. The invalidation description (Scope item 6) is disclosed as text content within these existing fields, not a new field.
- **`SLOW` tier is a genuine, defensible tiering decision.** This Provider performs a bounded scan across a recent-bar window with per-bar classification, the same tiering category as every other bounded-multi-window-search Provider.
- **Methodology independence is an architecture requirement, not a style preference**, and is the specific focus of this sprint's central named risk given VSA's historical closeness to Wyckoff. No `dependsOn` entry references `'WYCKOFF'`, `'ICT_SMC'`, `'ELLIOTT_WAVE'`, `'HARMONIC_PATTERNS'`, `'CLASSICAL_CHART_PATTERNS'`, `'PRICE_ACTION'`, `'SUPPLY_DEMAND'`, or `'FIBONACCI_ANALYSIS'`; no source file under `providers/vsa/` imports from any of their own module directories; verified mechanically by Scope item 10's boundary test. Shared named-term vocabulary with `WyckoffProvider` (Climax, Upthrust, Shakeout) is expected and disclosed (Sprint Objective, Scope item 10) — the two Providers share no internal type, utility, or file, and VSA's own detection mechanism (single-bar effort-vs-result classification) is structurally unrelated to Wyckoff's own whole-range schematic-phase classification.
- **No leakage into generic components.** No VSA-specific vocabulary (spread, effort-vs-result, No Demand, No Supply, Upthrust, Shakeout, Stopping Volume, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, `ObservabilityService`, or anywhere under `confluence/`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/vsa/`; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it.
- Per ADR-001, ADR-003, ADR-004, ADR-005, ADR-007: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/ratio/ATR/volume arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent; `strength`/score values in `normalize()` output may use plain `number` (0–100), consistent with S1-012's own established convention.

---

# Acceptance Criteria

- `VsaProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'VSA'`, with no `dependsOn` entry, and is the ninth entry in `ANALYSIS_PROVIDERS` in production.
- A dedicated unit test verifies each of the three per-bar classifications (spread, volume, close-position) independently against constructed fixtures spanning every classification state.
- A dedicated unit test verifies each of the five named VSA signal types is detected from a purpose-built fixture bar matching its own exact criteria, and that a bar failing any one required criterion is never classified as that signal.
- A dedicated unit test constructs a single bar whose raw values simultaneously satisfy more than one signal's underlying criteria (e.g., a wide-spread, high-volume bar that also makes a new local high) and confirms the disclosed priority order yields exactly one classification, never a merge or a silently-arbitrary pick.
- A dedicated unit test verifies the bounded, recency-ranked `interpretation[]`: given two qualifying bars at different points in the scan window, exactly two hypotheses are returned, the more recent one primary; a separate fixture with only one qualifying bar confirms exactly one.
- A dedicated unit test verifies Interpretation Confidence: an otherwise-identical qualifying signal scores strictly higher when it occurs at or near a Swing Detector-identified swing high/low than when it does not.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical climax-type signal (Upthrust/Shakeout/Stopping Volume) is higher when the Regime/Context Service reads `HIGH` volatility than `LOW`, and — for an identical quiet-type signal (No Demand/No Supply) — higher when it reads `LOW` than `HIGH`; Methodology Confidence Ceiling reflects this Provider's own disclosed source profile (a specific, test-asserted value, distinct from every prior Provider's own ceiling, not copied from any of them).
- A series with fewer bars than the disclosed minimum needed for both the trailing volume baseline and the local-extreme lookback window produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Indicator Engine (`atr()`), Swing Detector, and Regime Context `computation`/`computationVersion` this Provider consumed.
- `normalize()` is implemented, added as a ninth fixture entry to the existing shared conformance suite (`normalize-vocabulary-conformance.spec.ts`), and passes its generic assertions unmodified; a dedicated test confirms `VOLUME` is populated (the first Provider to do so natively) and that every dimension this Provider has no native concept for reads `NOT_APPLICABLE`.
- A golden-dataset/reference-example test reproduces at least one worked No Demand/No Supply instance and one worked Upthrust-or-Shakeout instance, each matched against a named, cited source (Tom Williams and/or Anna Coulling); any substitution or multi-source corroboration in place of a single unavailable primary text is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 10) passes, confirming zero file-level references from `providers/vsa/` to any of the eight prior Providers' own module directories.
- No VSA-specific vocabulary appears in any generic framework file or `confluence/` (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at every prior sprint's own closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-017 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including both golden-dataset conformance tests.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Wyckoff-vocabulary/mechanism-conflation risk (this sprint's own central named risk, and this sprint's specific reason for the DEC-2026-022 prerequisite check).** VSA's own named signals (Upthrust, Shakeout, Climax-adjacent Stopping Volume) are historically and honestly derived from Wyckoff's own principles, and share literal terminology with `WyckoffProvider`'s own UT/UTAD and Spring events. The temptation is to either avoid the historically accurate terms altogether (misrepresenting the methodology's own honest lineage) or to silently reuse `WyckoffProvider`'s own detection code (a real independence violation). Mitigated by disclosing the shared terminology honestly (Sprint Objective, Scope item 10) while implementing a structurally distinct, single-bar detection mechanism requiring no pre-identified trading range or phase — verified by zero shared code/imports (Scope item 10's boundary test) — the same disclosed-overlap-with-mechanically-verified-independence pattern already established for `SupplyDemandProvider`/`IctSmcProvider` and `FibonacciAnalysisProvider`/`ElliottWaveProvider`/`HarmonicPatternsProvider`.
- **`VOLUME`-dimension-population risk.** This is the first Provider to populate `normalize()`'s `VOLUME` dimension natively, rather than leaving it `NOT_APPLICABLE` as every prior Provider deliberately did to preserve independence from this Provider's own future territory. Mitigated by this being the explicitly anticipated, disclosed exception (Scope item 9) — the one Provider whose native methodology genuinely is volume — not an accidental scope violation of any prior Provider's own boundary.
- **Signal double-classification risk.** A single bar could, without a disclosed priority order, satisfy the raw criteria for more than one named signal simultaneously (e.g., a wide-spread high-volume bar that both makes a new local high and closes near its low). Mitigated by Scope item 3's disclosed, fixed check order and a dedicated unit test constructing exactly this ambiguous case.
- **False-precision-of-invalidation risk**, same category as every prior Provider's own named risk — mitigated by deriving every invalidation description directly and only from the same volume/spread/close-position arithmetic already used for classification (Scope items 3, 6), never a separately-estimated or heuristic value.
- **Premature-promotion risk**, the same recurring named risk carried into every Provider sprint since S1-010 — mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as every prior Provider's own bound — the disclosed scan-window size, volume/spread/close-position classification thresholds, and local-extreme lookback window must be disclosed via Decision Log, not left as undocumented magic numbers.
- **Source-fidelity risk.** Tom Williams' "Master the Markets" and Anna Coulling's "A Complete Guide to Volume Price Analysis" may not both be independently obtainable in full in this environment; if so, the same disclosed-fallback/multi-source-corroboration allowance already used at every prior sprint applies, recorded honestly in the Decision Log and completion report, never silently substituted without disclosure.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract, or the Normalized Vocabulary Schema/Confluence Engine, proves insufficient to express a genuine VSA finding without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension or vocabulary dimension unilaterally).
- Implementation discovers that VSA's own signal detection genuinely cannot be expressed without reading `WyckoffProvider`'s own structured output (contradicting DEC-2026-022's own finding) — escalate immediately rather than adding an undisclosed `dependsOn` or reaching into `providers/wyckoff/`.
- Scope expansion is requested, including any request to implement trading-range/schematic-phase detection, wave-count validation, named XABCD pattern matching, chart-pattern shape-matching, a single-key-level reaction state machine, cross-leg Fibonacci confluence, supply/demand zone health tracking, multi-timeframe analysis, another methodology Provider, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to any prior Provider (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework or Confluence Engine before a second methodology independently requires it.
- No independently-corroborating combination of well-established VSA sources (Tom Williams, Anna Coulling, or other widely-cited secondary corroboration) can be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015/016/017/018/019/020/021 precedent — not requiring pre-approval:

- `MAX_BARS_FOR_VSA_SCAN`, the bounded recent-bar window this Provider scans.
- The ATR-relative spread-classification thresholds (`NARROW`/`AVERAGE`/`WIDE`).
- The trailing-average-relative volume-classification thresholds (`LOW`/`AVERAGE`/`HIGH`/`ULTRA_HIGH`), and the exact window used to compute the trailing average.
- The close-position-within-spread thresholds (`NEAR_HIGH`/`MID`/`NEAR_LOW`).
- The local-extreme lookback window size used by Upthrust/Shakeout detection.
- The Detection Confidence formula (anomaly-magnitude scoring) and the Interpretation Confidence swing-proximity adjustment magnitude.
- The exact Regime-Adjusted Confidence modulation magnitude for the climax-type-vs-quiet-type/`volatilityState` interaction described in Scope item 5.
- The specific cited/corroborating sources for the two golden-dataset conformance tests.
- Methodology Confidence Ceiling's exact value for `'VSA'`.
- `computationVersion`/`vocabularySchemaVersion` numbering for `VsaProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-14

Approved concurrently with DEC-2026-022's own architecture prerequisite check (finding no blocker) and the Architecture Team's standing authorization to execute the S1-013→S1-018 Roadmap Order's complete lifecycle (Phases 1–9) autonomously per Sprint, without intermediate approval gating, stopping only for the Stop Conditions restated in that authorization. Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified; the `SLOW` tier classification, the deliberate non-dependency on `WyckoffProvider`, the disclosed shared-terminology-with-mechanically-verified-independence approach, the single-bar effort-vs-result detection mechanism (a genuinely distinct concept from every prior Provider's own bounded-hypothesis mechanism), the recency-based bounded-hypothesis ranking, and the native `VOLUME`-dimension population were each accepted as proposed, consistent with ADR-006/007's already-approved design and DEC-2026-022's own finding.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-14
- **Completion Report:** `documentation/ai/S1-018_COMPLETION_REPORT.md` (AI-042)
- **Final Implementation Commits:** `14c5b0b` (Sprint Brief), `a714d40` (Task Breakdown), `4215f7f` (WP1-WP12: full `VsaProvider` implementation, golden-dataset conformance, `normalize()` mapping, module registration)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`); ADR-007 (Normalized Vocabulary, consumed via a new `normalize()` mapping)
- **Related Decisions:** `DEC-2026-022` (prerequisite check), `DEC-2026-023`

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-007 — consumed unchanged)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md` (`WyckoffProvider` — the disclosed volume boundary this sprint claims the deferred side of; structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Swing Detection/Regime Context/Indicator Engine this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md`, `S1-015_SPRINT_BRIEF.md`, `S1-016_SPRINT_BRIEF.md`, `S1-017_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-022 — this sprint's own architecture prerequisite check)
