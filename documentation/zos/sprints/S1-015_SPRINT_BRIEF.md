# S1-015 SPRINT BRIEF — Price Action Analysis Provider

**Document ID:** ZOS-S1-015
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-015
- **Sprint Name:** Price Action Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`–`S1-014_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — autonomous full-lifecycle execution authorized under the standing S1-013→S1-018 Roadmap Order; see Approval Section)

---

# Sprint Objective

S1-009, S1-010, S1-011, S1-013, and S1-014 each registered a real Analysis Provider reading a *named* structure (a Wyckoff schematic, an Order Block, a wave count, a harmonic ratio pattern, a Head and Shoulders shape). **S1-015 registers the sixth — Price Action** — and is deliberately, explicitly **not** another named-pattern catalog. Per the Architecture Team's own Implementation Guidance for this Sprint, Price Action's purpose is to read *how price is currently behaving* at the single most immediately relevant price level: whether an approach to that level is being rejected or broken through, how convincingly, whether a broken level has since been retested and held or failed, whether the resulting move is gathering pace or running out of it, and how fast that move is happening relative to the instrument's own recent normal range. None of this is expressed as a named candlestick pattern (no "hammer," "engulfing," "doji") — every reading is a direct, disclosed measurement (a wick-to-range ratio, a body-to-range ratio, a close-position ratio, an ATR-relative velocity), synthesized into one coherent account of *what price just did and is doing now*, never a shape lookup.

This sprint is this system's sixth live proof of the Analysis Provider Framework's methodology-agnosticism (following Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, and Classical Chart Patterns) and the Confluence Engine's own genuine extensibility (S1-012): registering a sixth Provider must require zero change to `AnalysisProvider`, the Execution Engine, the Confluence Engine, or the Normalized Vocabulary Schema — only a new `normalize()` mapping confined to this Provider's own module directory, exactly as ADR-007 anticipated. This Provider is also the first to genuinely populate the Normalized Vocabulary's `MOMENTUM` dimension from a purpose-built native measurement (every prior Provider left it `NOT_APPLICABLE`, or — Elliott Wave — only as a confidence-gated proxy of its own `TREND` reading), and the first to consume `INDICATOR_ENGINE.atr()` directly inside a Provider's own `analyze()` (previously called only by `RegimeContextService` internally).

---

# Scope

Per ADR-006 (Provider contract mechanics) and ADR-007 (Normalized Vocabulary, consumed unchanged) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`PriceActionProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'PRICE_ACTION'`, `methodologyFamily: 'PRICE_ACTION'`, **`tier: 'FAST'`** — unlike every prior Provider registered so far, this Provider examines a single, most-recent key level and its own subsequent reaction (Scope items 2-3), never a bounded search across many candidate windows; a single-pass classification is the correct tiering category, the same basis `IctSmcProvider` (S1-010) was itself classified `FAST` on. `dependsOn` **not set** — independent of every other Provider. Registered as the **sixth entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`).
2. **Key-level identification — the single most recent swing, not a historical multi-level scan.** Consumes the Swing Detector's (S1-007) already-computed `swings` directly: the *last* swing in the sequence is this Provider's own "important price area" (a prior HIGH is treated as resistance; a prior LOW as support). No re-derivation of swing-point logic, and no unbounded search across every historical swing — a disclosed, bounded V1 scope decision (Non-Scope), distinct from every prior Provider's own bounded-but-multi-window search.
3. **Subsequent-reaction gathering.** Every `MarketSeries` point timestamped strictly after the key level's own swing is this Provider's own raw evidence — gathered once, reused by every scoring step below (Scope items 4-6), never re-scanned redundantly.
4. **Deterministic reaction-state classification — five states, hard and mutually exclusive, never a probabilistic blend:** `APPROACHING_LEVEL` (no subsequent point has yet closed beyond the level in either direction), `REJECTED_LEVEL` (a subsequent point pierced the level but closed back on the level's own originating side, with a wick-to-range ratio clearing a disclosed threshold), `BREAKOUT_UNCONFIRMED` (a subsequent point closed beyond the level, and no later point has yet returned to retest it), `BREAKOUT_CONFIRMED` (a later point returned to the broken level and closed back away from it — a held retest), and `BREAKOUT_FAILED` (a later point returned to the broken level and closed back through it — a failed retest, itself a genuine reversal signal in this methodology's own literature). This state is deterministic given the same subsequent points — never a search over combinatorial candidates, the genuinely different mechanism this methodology's own character requires (Sprint Objective).
5. **Rejection/breakout/retest quality scoring — the disclosed measurements this reading is built from, never a named pattern lookup:** wick-to-range ratio (rejection), body-to-range ratio and close-position ratio (breakout), and an ATR-relative clearance distance beyond the level (breakout and failure alike) — reusing `INDICATOR_ENGINE.atr()` (S1-007), consumed directly by a Provider's own `analyze()` for the first time. Feeds Detection Confidence (Scope item 8).
6. **Momentum and continuation-vs-exhaustion scoring — the second genuinely distinct, non-binding signal this Provider's own character requires, contributing to ranking/confidence only, never to the hard state classification already decided in Scope item 4:** an ATR-relative velocity measurement of the current leg (net displacement from the key level, divided by current ATR and elapsed bars), and — only where a directional move exists to assess (`BREAKOUT_UNCONFIRMED`/`BREAKOUT_CONFIRMED`) — whether the most recent bars' own body sizes are expanding (continuation) or contracting (exhaustion) relative to the impulse leg's own earlier bars.
7. **Bounded, disclosed `interpretation[]`.** The classified state (Scope item 4) is always the primary entry; a second, disclosed alternate entry is added only when the classification margin (Scope item 5's own quality score) sits within a disclosed distance of its own decision boundary — a genuine close call, honestly disclosed as a live alternate reading, never silently dropped, and never an unbounded search (the same bounded-hypothesis discipline as every prior Provider, expressed through this methodology's own genuinely different mechanism: a boundary-proximity check, not a multi-window scan).
8. **Full Confidence taxonomy** (S1-008): Detection Confidence (Scope item 5's own quality margin for the primary state), Interpretation Confidence (Scope item 6's momentum/continuation-exhaustion blend), Regime-Adjusted Confidence (this Provider's own rule, distinct in both axis-and-bifurcation combination from every prior Provider's own rule: breakout/continuation readings strengthen when the Regime/Context Service reads `volatilityState: 'HIGH'` — a credible breakout requires genuine range expansion — while rejection readings strengthen when it reads `'LOW'` — a rejection is cleaner and more meaningful in orderly, low-noise conditions; exact modulation magnitude an independent implementation-time calibration, disclosed via Decision Log), and Methodology Confidence Ceiling (this Provider's own disclosed value, reflecting Price Action's own sourcing profile: decentralized across decades of independent trading literature with no single institutional-grade canonical text, yet unusually high cross-source agreement on its own core measurements — independently calibrated from, not copied from, any prior Provider's own ceiling).
9. **Explicit, disclosed invalidation description per hypothesis** — directly answering the same "what invalidates this reading?" question every prior Provider answers: for every surviving hypothesis, the price level and condition that would contradict it (e.g. a decisive close back through the key level for a breakout reading; a decisive close beyond the key level for a rejection reading) is computed and disclosed in that hypothesis's summary text — no new contract field.
10. **Populated `Limitations`, never a thrown exception**, when no swing exists yet to serve as a key level, or when the key level has no subsequent reaction data at all — per ADR-006, the same discipline as every other component in this system.
11. **Real `Traceability`**, referencing the actual Swing Detector/Regime Context/Indicator Engine (`atr()`) outputs consumed (their `computationVersion`s included).
12. **`normalize()` implementation** (ADR-007), confined to `providers/price-action/`, mapping this Provider's own Evidence/Interpretation into the shared seven-dimension vocabulary using only its own domain knowledge — including a genuine, native `MOMENTUM` mapping (Scope item 6's own velocity score), the first Provider to populate this dimension from a purpose-built measurement rather than `NOT_APPLICABLE` or a proxy — honestly `NOT_APPLICABLE` for every dimension it has no native concept for (deliberately including `VOLUME`, to maintain independence from Wyckoff's own volume-climax methodology — Non-Scope). Added as the sixth entry to the existing shared `normalize()` conformance test suite (`normalize-vocabulary-conformance.spec.ts`, S1-012), not a new test suite.
13. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and every prior Provider's own independence check) asserting that no file under `providers/price-action/` imports from, or otherwise references, `providers/wyckoff/`, `providers/ict-smc/`, `providers/elliott-wave/`, `providers/harmonic-patterns/`, or `providers/classical-chart-patterns/`.
14. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked breakout-and-successful-retest instance and a worked clean-rejection instance, matched against widely-taught, independently-corroborated price-action conventions (no single primary text exists for this decentralized methodology — Risks), with the same disclosed-fallback/multi-source-corroboration allowance established at every prior sprint.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Named candlestick pattern classification** (hammer, engulfing, doji, pin bar, or any other named single/multi-candle shape). Explicitly, deliberately excluded per this Sprint's own Objective — this Provider reasons about the underlying measurements (wick/body/close-position ratios) directly, never a shape catalog. Not a future extension candidate either; this exclusion is a defining, permanent design boundary for this Provider, not a deferred scope item.
- **A historical multi-level scan** (assessing reaction at every past swing, not only the most recent). V1 examines only the single most recent key level — a disclosed, bounded scope decision, a natural future extension of this same Provider.
- **Volume-based analysis of any kind.** Deliberately excluded to maintain clean methodology independence from Wyckoff's own volume-climax-centered methodology (`WyckoffProvider`, S1-009) — this Provider's own `Evidence`/`Confidence` are built entirely from price geometry and ATR, never volume.
- **Trend lines, channels, or any drawn-geometry construct.** Deferred, a candidate for a future extension of this same Provider.
- **Multi-timeframe analysis.** `MarketSeries` carries single-timeframe daily-bar points only; out of scope architecturally, not merely deferred, the same limitation already disclosed for `IctSmcProvider`'s own Killzones exclusion (S1-010).
- **Any other methodology Provider** (Supply/Demand, Fibonacci Analysis, VSA, or any other) — future sprints, per the Architecture Team's own Roadmap Order (S1-016 onward).
- **Any dependency, via `dependsOn`, on `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, or `ClassicalChartPatternsProvider`.** This sprint's independence mandate, stated explicitly, test-verified (Scope item 13), not merely assumed.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework or the Confluence Engine.** If a genuinely reusable abstraction emerges during implementation, it stays inside `providers/price-action/`. Promotion into either shared component is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **Any change to the Normalized Vocabulary Schema, `ConfluenceWeightStrategy`, or the dimension-aggregation mechanism** (ADR-007, S1-012) — this Provider is a new vocabulary-mapping *consumer* of that already-approved design (including its own genuine first-use of `MOMENTUM`), not a redesign of it.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-014 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `PriceActionProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–14 as a new `apps/api/src/analysis-engine/providers/price-action` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a `normalize()` mapping added to the existing shared conformance suite; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR`, `REGIME_CONTEXT`, and `INDICATOR_ENGINE` (`atr()`, its first direct-from-a-Provider consumer) tokens — consumed, not modified.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `PriceActionProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- S1-012's Normalized Vocabulary Schema and shared `normalize()` conformance suite — consumed and extended (one new fixture entry, including the first genuine `MOMENTUM` population), not redesigned.
- **S1-009's `WyckoffProvider`, S1-010's `IctSmcProvider`, S1-011's `ElliottWaveProvider`, S1-013's `HarmonicPatternsProvider`, and S1-014's `ClassicalChartPatternsProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from any of their own module directories.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's standing authorization for the S1-013→S1-018 Roadmap Order.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `PriceActionProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Provider-specific output shape or a fifth Confidence kind. The invalidation description (Scope item 9) is disclosed as text content within these existing fields, not a new field.
- **`FAST` tier is a genuine, defensible tiering decision, not an inconsistency with the SLOW-tier bounded-search Providers.** This Provider performs a single-pass classification over one key level's own subsequent reaction — the same computational shape (and tiering justification) as `IctSmcProvider`'s own `FAST` classification (S1-010), not a bounded multi-window search like Wyckoff/Elliott Wave/Harmonic Patterns/Classical Chart Patterns.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'`, `'ICT_SMC'`, `'ELLIOTT_WAVE'`, `'HARMONIC_PATTERNS'`, or `'CLASSICAL_CHART_PATTERNS'`; no source file under `providers/price-action/` imports from any of their own module directories; verified mechanically by Scope item 13's boundary test.
- **No leakage into generic components.** No Price-Action-specific vocabulary (rejection, breakout, retest, key level, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, `ObservabilityService`, or anywhere under `confluence/`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/price-action/` for this sprint; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it.
- Per ADR-001, ADR-003, ADR-004, ADR-005, ADR-007: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/ATR arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent; `strength`/score values in `normalize()` output may use plain `number` (0–100), consistent with S1-012's own established convention.

---

# Acceptance Criteria

- `PriceActionProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`FAST`/`methodologyFamily: 'PRICE_ACTION'`, with no `dependsOn` entry, and is the sixth entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear rejection at the most recent swing level, the Provider classifies `REJECTED_LEVEL`; given a clear breakout with no subsequent retest, `BREAKOUT_UNCONFIRMED`; given a breakout with a held retest, `BREAKOUT_CONFIRMED`; given a breakout with a failed retest, `BREAKOUT_FAILED`; given no subsequent reaction yet, `APPROACHING_LEVEL` — five dedicated unit tests, one per state, each independently constructed, none reverse-fitted to another's fixture.
- A dedicated unit test verifies rejection/breakout quality scoring: a candidate with a larger wick-to-range (rejection) or body-to-range/close-position (breakout) ratio scores a strictly higher Detection Confidence than an otherwise-comparable candidate with a smaller ratio.
- A dedicated unit test verifies momentum scoring: an identical key level with a larger subsequent ATR-relative displacement scores a strictly higher Interpretation Confidence component than a smaller one; a further test verifies continuation (expanding recent body sizes) scores higher than exhaustion (contracting recent body sizes) for an otherwise-identical `BREAKOUT_UNCONFIRMED`/`BREAKOUT_CONFIRMED` reading.
- A dedicated unit test constructs a classification-boundary close call and confirms a second, disclosed alternate hypothesis is returned (bounded, never unbounded); a separate unambiguous fixture confirms exactly one.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical breakout reading is higher when the Regime/Context Service reads `HIGH` volatility than `LOW`, and — for an identical rejection reading — higher when it reads `LOW` than `HIGH`; Methodology Confidence Ceiling reflects this Provider's own disclosed source-decentralization status (a specific, test-asserted value, independently calibrated from every prior Provider's own ceiling, not copied from any of them).
- A series with no swing yet, or with a swing but no subsequent series point, produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Swing Detector/Regime Context/Indicator Engine `computation`/`computationVersion` this Provider consumed.
- `normalize()` is implemented, added as a sixth fixture entry to the existing shared conformance suite (`normalize-vocabulary-conformance.spec.ts`), and passes its generic assertions unmodified; a dedicated test confirms `MOMENTUM` is genuinely populated (not `NOT_APPLICABLE`) from this Provider's own velocity score.
- A golden-dataset/reference-example test reproduces at least one worked breakout-and-retest instance and one worked rejection instance, each matched against a named, cited convention; any substitution or multi-source corroboration in place of a single unavailable primary text is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 13) passes, confirming zero references from `providers/price-action/` to any of the five prior Providers' own module directories.
- No Price-Action-specific vocabulary appears in any generic framework file or `confluence/` (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at every prior sprint's own closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-014 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including both golden-dataset conformance tests.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Candlestick-pattern-reductionism risk (this sprint's own central named risk).** The most tempting shortcut for a "Price Action Provider" is to implement a catalog of named candle shapes, which the Architecture Team's own Implementation Guidance explicitly forbids — it would duplicate widely-taught retail vocabulary without adding genuine analytical value, and would not "read behavior," only classify shapes. Mitigated by Scope items 4-6's own design: every reading is a direct, disclosed measurement (wick/body/close-position ratio, ATR-relative velocity), never a shape name.
- **Source-fidelity risk, this sprint's own most severe version:** Price Action has no single canonical primary text (unlike Wyckoff, Elliott Wave, Harmonic Patterns' cited authors, or Edwards & Magee) — it is the most decentralized methodology registered so far, taught across decades of independent trading literature (Al Brooks' "Reading Price Charts Bar by Bar," among many others) with genuine terminology variance on nuance but unusually high cross-source agreement on the core measurements themselves (a long wick beyond a level that closes back away is universally read as rejection; an expanding-range close beyond a level is universally read as a strong breakout). Mitigated by disclosing this decentralization honestly (Missing Decisions, Methodology Confidence Ceiling calibration) and by citing multiple independently-corroborating sources for the golden-dataset conformance test rather than one single unavailable primary text.
- **Single-key-level risk.** Restricting analysis to only the most recent swing (Scope item 2) is a real scope boundary, not a defect — mitigated by disclosing it explicitly (Non-Scope) as a bounded V1 decision, a natural candidate for a future multi-level extension of this same Provider.
- **False-precision-of-invalidation risk**, same category as every prior Provider's own named risk — mitigated by deriving every invalidation description directly and only from the same level/state arithmetic already used for classification (Scope items 4, 9), never a separately-estimated or heuristic value.
- **Premature-promotion risk**, the same recurring named risk carried into every Provider sprint since S1-010 — mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as every prior Provider's own bound — the implementation-time bound and boundary-proximity threshold chosen must be disclosed via Decision Log, not left as an undocumented magic number.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract, or the Normalized Vocabulary Schema/Confluence Engine, proves insufficient to express a genuine Price Action finding without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension or vocabulary dimension unilaterally).
- Scope expansion is requested, including any request to implement named candlestick patterns, a historical multi-level scan, volume-based analysis, trend lines/channels, multi-timeframe analysis, another methodology Provider ahead of the Roadmap Order, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to any prior Provider (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework or Confluence Engine before a second methodology independently requires it.
- No independently-corroborating combination of well-established Price Action sources can be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015/016/017/018 precedent — not requiring pre-approval:

- The rejection wick-to-range ratio threshold distinguishing a genuine rejection from an inconclusive touch.
- The ATR-relative clearance multiple distinguishing a genuine breakout from a noise pierce.
- The boundary-proximity margin that triggers a second, disclosed alternate hypothesis (Scope item 7).
- The ATR-relative displacement multiple that scores full (100) momentum.
- The body-size expansion/contraction margin distinguishing continuation from exhaustion.
- The exact Regime-Adjusted Confidence modulation magnitude for the `HIGH`/`LOW` volatility interaction described in Scope item 8.
- The specific cited/corroborating sources for the two golden-dataset conformance tests.
- Methodology Confidence Ceiling's exact value for `'PRICE_ACTION'`.
- `computationVersion`/`vocabularySchemaVersion` numbering for `PriceActionProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved concurrently with the Architecture Team's standing authorization to execute the S1-013→S1-018 Roadmap Order's complete lifecycle (Phases 1–9) autonomously per Sprint, without intermediate approval gating, stopping only for the Stop Conditions restated in that authorization. Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified; the `FAST` tier classification, the deliberate exclusion of named candlestick patterns as a permanent design boundary (not a deferred scope item), the single-key-level V1 boundary, the hard-state/soft-quality split (a genuinely distinct mechanism from every prior Provider's own hard/soft split), and the volatilityState-bifurcated Regime-Adjusted Confidence rule were each accepted as proposed, consistent with ADR-006/007's already-approved design, this Sprint's own Engineering Authority grant, and the Architecture Team's own Implementation Guidance for this Sprint.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-13
- **Completion Report:** `documentation/ai/S1-015_COMPLETION_REPORT.md` (AI-036)
- **Final Implementation Commits:** `f02bb67` (Sprint Brief), `6ed54f8` (Task Breakdown), `3d08d78` (WP1-WP14: full `PriceActionProvider` implementation, golden-dataset conformance, `normalize()` mapping, module registration)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`); ADR-007 (Normalized Vocabulary, consumed via a new `normalize()` mapping)
- **Related Decisions:** `DEC-2026-019`

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-007 — consumed unchanged)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Swing Detection/Regime Context/Indicator Engine this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
