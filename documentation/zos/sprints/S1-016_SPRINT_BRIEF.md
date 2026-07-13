# S1-016 SPRINT BRIEF — Supply & Demand Analysis Provider

**Document ID:** ZOS-S1-016
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-016
- **Sprint Name:** Supply & Demand Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`–`S1-015_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — autonomous full-lifecycle execution authorized under the standing S1-013→S1-018 Roadmap Order; see Approval Section)

---

# Sprint Objective

S1-009 through S1-015 each registered a real Analysis Provider reading a genuinely distinct structural concept (a Wyckoff schematic, an Order Block, a wave count, a harmonic ratio pattern, a named chart shape, single-key-level reaction behavior). **S1-016 registers the seventh — Supply & Demand** — and is deliberately, explicitly **not** a re-skin of `IctSmcProvider`'s own Order Blocks (S1-010), despite both concepts sharing a retail-trading lineage that commonly confuses the two. Per the Architecture Team's own Implementation Guidance for this Sprint, Supply & Demand's purpose is to identify and evaluate institutional Supply and Demand **zones** — price ranges left behind by a genuine consolidation ("base") immediately before an impulsive departure — and to assess each zone's own origin, quality, freshness (how many times it has since been retested), mitigation status (how deeply price has since violated it), strength, and probability of holding or failing on a future test. This is a **range**-based, **multi-candle-base**-based, **decay-over-time**-based methodology, genuinely distinct in its own raw-evidence basis from every prior Provider: Order Blocks (`IctSmcProvider`) are derived from a single last opposing candle before a displacement leg; Supply & Demand zones are derived from a whole indecisive base (one to several candles) before an impulsive departure, with two independently-tracked, orthogonal health dimensions (freshness and mitigation) that decay a zone's own quality across repeated tests — a concept no prior Provider models.

This sprint is this system's seventh live proof of the Analysis Provider Framework's methodology-agnosticism (following Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, Classical Chart Patterns, and Price Action) and the Confluence Engine's own genuine extensibility (S1-012): registering a seventh Provider must require zero change to `AnalysisProvider`, the Execution Engine, the Confluence Engine, or the Normalized Vocabulary Schema — only a new `normalize()` mapping confined to this Provider's own module directory, exactly as ADR-007 anticipated. This Provider is also the first not to inject `SWING_DETECTOR` directly at all: its own raw evidence (a base of consolidating candles followed by an impulsive departure) is assessed entirely at the `MarketSeries` candle level, never at the swing-point level — `RegimeContextService` already composes Swing Detection internally for its own trend read, so no direct dependency is needed here.

---

# Scope

Per ADR-006 (Provider contract mechanics) and ADR-007 (Normalized Vocabulary, consumed unchanged) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`SupplyDemandProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'SUPPLY_DEMAND'`, `methodologyFamily: 'SUPPLY_DEMAND'`, **`tier: 'SLOW'`** — a bounded scan across candle-count windows for base candidates, the same tiering category as Elliott Wave/Harmonic Patterns/Classical Chart Patterns' own bounded multi-window searches, never a single-pass lookup like `IctSmcProvider`/`PriceActionProvider`. `dependsOn` **not set** — independent of every other Provider. Registered as the **seventh entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`).
2. **Base identification — a bounded linear scan for consolidation candidates.** A candidate base is a contiguous run of 1 to a disclosed maximum count of candles, each with a small body-to-range ratio (an indecisive candle) and a combined high-low range that stays within a disclosed ATR-relative tightness bound — never a re-derivation of any prior Provider's own displacement/swing logic, and never itself a named pattern.
3. **Impulsive-departure gating.** The single candle immediately following a candidate base must clear a disclosed ATR-relative body-size threshold in one direction to qualify the base as a genuine zone origin at all; a base with no qualifying departure is discarded, never returned as a low-confidence guess. The departure's own direction determines the zone's type — `DEMAND` (departs upward) or `SUPPLY` (departs downward) — and, combined with the immediately preceding candle's own direction, this zone's own origin classification (`RALLY_BASE_RALLY`, `DROP_BASE_RALLY`, `RALLY_BASE_DROP`, `DROP_BASE_DROP` — this methodology's own named vocabulary for continuation versus reversal zones, disclosed in every reading's summary, never conflated with any prior Provider's own state/phase/pattern vocabulary).
4. **Zone boundaries — proximal and distal lines**, this methodology's own vocabulary for a zone's near and far edges (never a single price point, unlike `PriceActionProvider`'s own single key level): the base's own extreme nearest the departure is the proximal line; the base's own extreme furthest from the departure is the distal line, itself this zone's own invalidation level.
5. **Freshness and mitigation — two independently-tracked, orthogonal health dimensions, a genuinely distinct mechanism from any prior Provider's own single-state classification:** *Freshness* (`FRESH`/`TESTED_ONCE`/`TESTED_MULTIPLE`) counts distinct subsequent touch episodes into the zone's own proximal-distal range (adjacent touching bars grouped into one episode, never inflating the count from a single deep excursion). *Mitigation* (`UNMITIGATED`/`PARTIALLY_MITIGATED`/`FULLY_MITIGATED`) tracks whether, and how deeply, a subsequent close has violated the zone — `FULLY_MITIGATED` only once a close has cleared the distal line entirely. A zone degrades in quality with each additional test and with deeper mitigation, never treated as a binary valid/invalid switch.
6. **Zone quality scoring — the disclosed measurements this reading is built from, never a named pattern lookup:** a base-tightness score (the base's own combined range relative to ATR — tighter is stronger) and a departure-strength score (the departure candle's own body relative to ATR), whichever is weaker determining Detection Confidence (the same "weakest link" idiom as every prior bounded-hypothesis Provider); Interpretation Confidence further applies a disclosed decay multiplier keyed to the zone's own freshness/mitigation combination (an untested, unmitigated zone retains full strength; a repeatedly-tested, fully-mitigated zone is scored weakest).
7. **Bounded, disclosed `interpretation[]` — one demand-side and one supply-side hypothesis, never an unbounded zone catalog.** Among every zone candidate found, the nearest `DEMAND` zone to the series' current price and the nearest `SUPPLY` zone to it are each independently tracked (bounded at 2 total); the primary entry is whichever side's zone sits nearer to current price, the second (if a zone exists on the other side at all) is the disclosed alternate — a genuinely different bounding rationale (sidedness, not ranking ambiguity) from every prior Provider's own bounded-hypothesis mechanism.
8. **Full Confidence taxonomy** (S1-008): Detection Confidence (Scope item 6's own weakest-link quality margin), Interpretation Confidence (Scope item 6's own freshness/mitigation-decayed score), Regime-Adjusted Confidence (this Provider's own rule, distinct in axis from every prior Provider's own rule: a `DEMAND` zone strengthens when the Regime/Context Service's `trendDirection` reads `'UP'` and weakens when `'DOWN'`; a `SUPPLY` zone strengthens when `trendDirection` reads `'DOWN'` and weakens when `'UP'` — trading with, not against, the broader trend direction is a stronger claim; `trendDirection` is an axis no prior Provider's own Regime-Adjusted rule has used, every prior rule keying instead off `trendState` or `volatilityState`), and Methodology Confidence Ceiling (this Provider's own disclosed value, reflecting Supply & Demand's own sourcing profile: decentralized across independent retail-trading educators with no single institutional-grade canonical text — a similar profile to `PriceActionProvider`'s own, but with more inherent subjectivity in exact proximal/distal boundary placement across sources — independently calibrated from, not copied from, any prior Provider's own ceiling).
9. **Explicit, disclosed invalidation description per hypothesis** — directly answering the same "what invalidates this reading?" question every prior Provider answers: the distal line and the condition (a decisive close beyond it) that would fully mitigate the zone is computed and disclosed in that hypothesis's summary text — no new contract field.
10. **Populated `Limitations`, never a thrown exception**, when no base-and-departure candidate is found anywhere in the supplied series — per ADR-006, the same discipline as every other component in this system.
11. **Real `Traceability`**, referencing the actual Regime Context/Indicator Engine (`atr()`) outputs consumed (their `computationVersion`s included) — deliberately not referencing `SWING_DETECTOR` directly (Scope item 1's own disclosed dependency profile).
12. **`normalize()` implementation** (ADR-007), confined to `providers/supply-demand/`, mapping this Provider's own Evidence/Interpretation into the shared seven-dimension vocabulary using only its own domain knowledge — including a `LIQUIDITY` mapping (an unmitigated zone represents a concentration of resting institutional orders, thematically shared with `IctSmcProvider`'s own `LIQUIDITY` use — deliberate and expected: two Providers legitimately populating the same dimension is exactly how the Confluence Engine detects genuine cross-methodology agreement, not a violation of independence) — honestly `NOT_APPLICABLE` for every dimension it has no native concept for (deliberately including `VOLUME` and `MOMENTUM`, to maintain independence from Wyckoff's own volume-climax methodology and Price Action's own momentum methodology respectively — Non-Scope). Added as the seventh entry to the existing shared `normalize()` conformance test suite (`normalize-vocabulary-conformance.spec.ts`, S1-012), not a new test suite.
13. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and every prior Provider's own independence check) asserting that no file under `providers/supply-demand/` imports from, or otherwise references, `providers/wyckoff/`, `providers/ict-smc/`, `providers/elliott-wave/`, `providers/harmonic-patterns/`, `providers/classical-chart-patterns/`, or `providers/price-action/`.
14. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked fresh, unmitigated demand-zone instance and a worked fully-mitigated (failed) supply-zone instance — directly demonstrating this Sprint's own "probability of holding or failing" objective — matched against widely-taught, independently-corroborated Supply & Demand conventions (no single primary text exists for this decentralized methodology, the same sourcing profile as `PriceActionProvider`'s own — Risks), with the same disclosed-fallback/multi-source-corroboration allowance established at every prior sprint.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Any reuse of `IctSmcProvider`'s own displacement-leg, order-block, or liquidity-sweep detection utilities.** Explicitly, deliberately excluded per this Sprint's own Objective, even though both methodologies share a retail-trading lineage — this Provider's own base-and-departure detection is self-contained inside `providers/supply-demand/`, never imported from `providers/ict-smc/`. Verified mechanically (Scope item 13).
- **Volume-based analysis of any kind**, despite some Supply & Demand teaching discussing volume at base formation. Deliberately excluded to maintain clean methodology independence from Wyckoff's own volume-climax-centered methodology (`WyckoffProvider`, S1-009) — this Provider's own `Evidence`/`Confidence` are built entirely from price geometry and ATR, never volume.
- **Momentum/velocity scoring of any kind.** Deliberately excluded to maintain clean methodology independence from `PriceActionProvider`'s own native momentum measurement (S1-015) — this Provider evaluates zone quality/freshness/mitigation only, never the speed of a subsequent move.
- **Named candlestick pattern classification** (hammer, engulfing, doji, or any other named single/multi-candle shape) — the base/departure candles are qualified only by disclosed body-to-range and ATR-relative measurements, never a shape catalog, the same permanent design boundary established at S1-015.
- **Trend lines, channels, or any drawn-geometry construct.** Deferred, a candidate for a future extension of this same Provider.
- **Multi-timeframe analysis.** `MarketSeries` carries single-timeframe daily-bar points only; out of scope architecturally, not merely deferred, the same limitation already disclosed for `IctSmcProvider`'s own Killzones exclusion (S1-010).
- **Zone-overlap/merging heuristics across multiple timeframes or across the same timeframe's own nested bases.** V1 treats each qualifying base-and-departure window independently, per Scope item 2's own bounded linear scan; deferred, a candidate for a future extension.
- **Any other methodology Provider** (Fibonacci Analysis, VSA, or any other) — future sprints, per the Architecture Team's own Roadmap Order (S1-017 onward).
- **Any dependency, via `dependsOn`, on `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`, or `PriceActionProvider`.** This sprint's independence mandate, stated explicitly, test-verified (Scope item 13), not merely assumed.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework or the Confluence Engine.** If a genuinely reusable abstraction emerges during implementation, it stays inside `providers/supply-demand/`. Promotion into either shared component is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **Any change to the Normalized Vocabulary Schema, `ConfluenceWeightStrategy`, or the dimension-aggregation mechanism** (ADR-007, S1-012) — this Provider is a new vocabulary-mapping *consumer* of that already-approved design (including its own legitimate, shared `LIQUIDITY` use), not a redesign of it.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-015 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `SupplyDemandProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–14 as a new `apps/api/src/analysis-engine/providers/supply-demand` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a `normalize()` mapping added to the existing shared conformance suite; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `REGIME_CONTEXT` and `INDICATOR_ENGINE` (`atr()`) tokens — consumed, not modified. `SWING_DETECTOR` is deliberately **not** injected directly — the first Provider not to hold its own `SWING_DETECTOR` reference, since this methodology's own raw evidence (a candle-level base and departure) needs no swing-point input of its own; `RegimeContextService` already composes Swing Detection internally for its own trend read.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `SupplyDemandProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- S1-012's Normalized Vocabulary Schema and shared `normalize()` conformance suite — consumed and extended (one new fixture entry, including a legitimate, shared `LIQUIDITY` population), not redesigned.
- **S1-009's `WyckoffProvider`, S1-010's `IctSmcProvider`, S1-011's `ElliottWaveProvider`, S1-013's `HarmonicPatternsProvider`, S1-014's `ClassicalChartPatternsProvider`, and S1-015's `PriceActionProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from any of their own module directories.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's standing authorization for the S1-013→S1-018 Roadmap Order.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `SupplyDemandProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Provider-specific output shape or a fifth Confidence kind. The invalidation description (Scope item 9) is disclosed as text content within these existing fields, not a new field.
- **`SLOW` tier is a genuine, defensible tiering decision.** This Provider performs a bounded linear scan across candle-count windows for base candidates, the same computational shape (and tiering justification) as Elliott Wave/Harmonic Patterns/Classical Chart Patterns' own `SLOW` classification, not a single-pass lookup like `IctSmcProvider`/`PriceActionProvider`.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'`, `'ICT_SMC'`, `'ELLIOTT_WAVE'`, `'HARMONIC_PATTERNS'`, `'CLASSICAL_CHART_PATTERNS'`, or `'PRICE_ACTION'`; no source file under `providers/supply-demand/` imports from any of their own module directories; verified mechanically by Scope item 13's boundary test.
- **No leakage into generic components.** No Supply-and-Demand-specific vocabulary (zone, base, proximal, distal, mitigated, freshness, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, `ObservabilityService`, or anywhere under `confluence/`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/supply-demand/` for this sprint; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it.
- Per ADR-001, ADR-003, ADR-004, ADR-005, ADR-007: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/ATR arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent; `strength`/score values in `normalize()` output may use plain `number` (0–100), consistent with S1-012's own established convention.

---

# Acceptance Criteria

- `SupplyDemandProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'SUPPLY_DEMAND'`, with no `dependsOn` entry, and is the seventh entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a tight base followed by a strong upward departure, the Provider detects a `DEMAND` zone with the correct proximal/distal boundaries and origin classification; given a downward departure, a `SUPPLY` zone — two dedicated unit tests, each independently constructed.
- A dedicated unit test verifies freshness tracking: zero subsequent touches reads `FRESH`; one touch episode reads `TESTED_ONCE`; two or more distinct touch episodes read `TESTED_MULTIPLE` — three independently constructed fixtures.
- A dedicated unit test verifies mitigation tracking: no subsequent close beyond the distal line reads `UNMITIGATED`; a touch without a closing violation reads `PARTIALLY_MITIGATED`; a subsequent close beyond the distal line reads `FULLY_MITIGATED` — three independently constructed fixtures, proving freshness and mitigation are tracked as independent, not conflated, dimensions.
- A dedicated unit test verifies zone quality scoring: a tighter base or a stronger departure scores a strictly higher Detection Confidence than an otherwise-comparable, looser/weaker candidate; a further test verifies a `FRESH`/`UNMITIGATED` zone scores a strictly higher Interpretation Confidence than an otherwise-identical `TESTED_MULTIPLE`/`FULLY_MITIGATED` zone.
- A dedicated unit test constructs a series with both a demand zone below and a supply zone above the current price and confirms exactly two bounded hypotheses are returned, the nearer one primary; a separate fixture with only one side present confirms exactly one.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description referencing the zone's own distal line — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical demand-zone reading is higher when the Regime/Context Service's `trendDirection` reads `'UP'` than `'DOWN'`, and — for an identical supply-zone reading — higher when it reads `'DOWN'` than `'UP'`; Methodology Confidence Ceiling reflects this Provider's own disclosed source-decentralization status (a specific, test-asserted value, independently calibrated from every prior Provider's own ceiling, not copied from any of them).
- A series with no qualifying base-and-departure candidate anywhere produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Regime Context/Indicator Engine `computation`/`computationVersion` this Provider consumed, and does not reference a `SWING_DETECTOR` computation.
- `normalize()` is implemented, added as a seventh fixture entry to the existing shared conformance suite (`normalize-vocabulary-conformance.spec.ts`), and passes its generic assertions unmodified; a dedicated test confirms `LIQUIDITY` is genuinely populated (not `NOT_APPLICABLE`) and that `MOMENTUM`/`VOLUME` are `NOT_APPLICABLE`.
- A golden-dataset/reference-example test reproduces at least one worked fresh/unmitigated demand-zone instance and one worked fully-mitigated (failed) supply-zone instance, each matched against a named, cited convention; any substitution or multi-source corroboration in place of a single unavailable primary text is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 13) passes, confirming zero references from `providers/supply-demand/` to any of the six prior Providers' own module directories.
- No Supply-and-Demand-specific vocabulary appears in any generic framework file or `confluence/` (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at every prior sprint's own closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-015 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including both golden-dataset conformance tests.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Order-Block-conflation risk (this sprint's own central named risk).** Supply & Demand and ICT/SMC's Order Blocks share a common retail-trading lineage and are frequently taught as near-synonyms; the most tempting shortcut would be to reuse `IctSmcProvider`'s own displacement/order-block detection under a new name. Mitigated by Scope items 2-6's own genuinely distinct, self-contained raw-evidence basis (a multi-candle base with independently-tracked freshness/mitigation decay, never a single last-candle lookup) and by the Independence Boundary Test (Scope item 13).
- **Source-fidelity risk**, the same category and severity as Price Action's own (S1-015): Supply & Demand has no single canonical primary text, taught across decades of independent retail-trading education (Sam Seiden and the "Online Trading Academy" curriculum, among many independent sources) with genuine terminology variance but unusually high cross-source agreement on the core concepts (a tight base before a strong move leaves a zone; an untested zone is stronger than a repeatedly-tested one; a decisively broken zone is mitigated). Mitigated by disclosing this decentralization honestly (Missing Decisions, Methodology Confidence Ceiling calibration) and by citing multiple independently-corroborating sources for the golden-dataset conformance test rather than one single unavailable primary text.
- **Base-window calibration risk.** The disclosed base-candle-count bounds, tightness tolerance, and departure-strength gate are implementation-time calibration choices, not architecture — must be disclosed via Decision Log, not left as undocumented magic numbers.
- **False-precision-of-invalidation risk**, same category as every prior Provider's own named risk — mitigated by deriving every invalidation description directly and only from the same zone-boundary arithmetic already used for classification (Scope items 4, 9), never a separately-estimated or heuristic value.
- **Premature-promotion risk**, the same recurring named risk carried into every Provider sprint since S1-010 — mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as every prior Provider's own bound — the one-per-side bounding rationale (Scope item 7) must be disclosed via Decision Log as a genuinely different mechanism from ranking-based bounds, not left unexplained.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract, or the Normalized Vocabulary Schema/Confluence Engine, proves insufficient to express a genuine Supply & Demand finding without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension or vocabulary dimension unilaterally).
- Scope expansion is requested, including any request to implement named candlestick patterns, volume-based analysis, momentum scoring, multi-timeframe analysis, zone-merging heuristics, another methodology Provider ahead of the Roadmap Order, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to any prior Provider (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework or Confluence Engine before a second methodology independently requires it.
- No independently-corroborating combination of well-established Supply & Demand sources can be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015/016/017/018/019 precedent — not requiring pre-approval:

- The base-candle body-to-range ratio threshold distinguishing an indecisive (basing) candle from a decisive one.
- The minimum and maximum base-candle-count window bounds.
- The base's own combined-range ATR-relative tightness bounds (full-score and zero-score anchors).
- The departure candle's own ATR-relative body-size gating threshold (the minimum to qualify as a genuine impulsive departure at all) and full-score anchor.
- The touch-episode grouping rule (how a gap between touching bars starts a new episode) and the freshness episode-count thresholds.
- The disclosed decay multipliers for each freshness/mitigation combination feeding Interpretation Confidence.
- The exact Regime-Adjusted Confidence modulation magnitude for the `trendDirection` interaction described in Scope item 8.
- The specific cited/corroborating sources for the two golden-dataset conformance tests.
- Methodology Confidence Ceiling's exact value for `'SUPPLY_DEMAND'`.
- `computationVersion`/`vocabularySchemaVersion` numbering for `SupplyDemandProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved concurrently with the Architecture Team's standing authorization to execute the S1-013→S1-018 Roadmap Order's complete lifecycle (Phases 1–9) autonomously per Sprint, without intermediate approval gating, stopping only for the Stop Conditions restated in that authorization. Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified; the `SLOW` tier classification, the deliberate non-injection of `SWING_DETECTOR`, the self-contained base-and-departure detection (never reusing `IctSmcProvider`'s own utilities), the freshness/mitigation dual-dimension design (a genuinely distinct mechanism from every prior Provider's own hard/soft split), the one-per-side bounded-hypothesis rationale, and the `trendDirection`-bifurcated Regime-Adjusted Confidence rule were each accepted as proposed, consistent with ADR-006/007's already-approved design, this Sprint's own Engineering Authority grant, and the Architecture Team's own Implementation Guidance for this Sprint.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-13
- **Completion Report:** `documentation/ai/S1-016_COMPLETION_REPORT.md` (AI-038)
- **Final Implementation Commits:** `d925514` (Sprint Brief), `c8d4c47` (Task Breakdown), `4fac5ad` (WP1-WP13: full `SupplyDemandProvider` implementation, golden-dataset conformance, `normalize()` mapping, module registration)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`); ADR-007 (Normalized Vocabulary, consumed via a new `normalize()` mapping)
- **Related Decisions:** `DEC-2026-020`

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-007 — consumed unchanged)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Regime Context/Indicator Engine this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md`, `S1-014_SPRINT_BRIEF.md`, `S1-015_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
