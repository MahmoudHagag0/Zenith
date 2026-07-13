# S1-014 SPRINT BRIEF — Classical Chart Patterns Analysis Provider

**Document ID:** ZOS-S1-014
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-014
- **Sprint Name:** Classical Chart Patterns Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`–`S1-013_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — autonomous full-lifecycle execution authorized under the standing S1-013→S1-018 Roadmap Order; see Approval Section)

---

# Sprint Objective

S1-009, S1-010, S1-011, and S1-013 each registered a real Analysis Provider (Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns). **S1-014 registers the fifth — Classical Chart Patterns** — the methodology described in Robert D. Edwards and John Magee's "Technical Analysis of Stock Trends" (1948), the single most widely-cited primary reference for reversal and continuation chart formations, continuously reprinted and taught in mainstream technical-analysis curricula (including the CMT Association's own body of knowledge) since its first edition.

This sprint is explicitly **not** about drawing a shape on a chart. Its purpose is the same as every prior Provider's: model a specific, falsifiable market-structure claim, deterministically, with disclosed confidence and disclosed invalidation. Classical chart patterns have a genuinely different deterministic character from every prior Provider registered so far: Edwards & Magee's own text is explicit that a pattern's *shape* alone is not sufficient — a pattern is only considered reliable once **confirmed** by a decisive price break of its own neckline/boundary level, ideally accompanied by expanding volume. An unconfirmed ("forming") pattern is a real, disclosable observation, but a materially weaker one than a confirmed one. This sprint's Provider must represent that distinction honestly — structural shape recognition and confirmation status are two separate, genuinely different signals, neither collapsed into the other.

This is also this system's fifth live proof of the Analysis Provider Framework's methodology-agnosticism (following Wyckoff, ICT/SMC, Elliott Wave, and Harmonic Patterns) and the Confluence Engine's own genuine extensibility (S1-012): registering a fifth Provider must require zero change to `AnalysisProvider`, the Execution Engine, the Confluence Engine, or the Normalized Vocabulary Schema — only a new `normalize()` mapping confined to this Provider's own module directory, exactly as ADR-007 anticipated.

---

# Scope

Per ADR-006 (Provider contract mechanics) and ADR-007 (Normalized Vocabulary, consumed unchanged) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`ClassicalChartPatternsProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'CLASSICAL_CHART_PATTERNS'`, `methodologyFamily: 'CLASSICAL_CHART_PATTERNS'`, **`tier: 'SLOW'`** — a bounded multi-hypothesis search over candidate pattern instances, the same tiering category as every other slow, bounded-search Provider already registered. `dependsOn` **not set** — independent of every other Provider. Registered as the **fifth entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`).
2. **Market Structure reuse.** Consumes the Swing Detector's (S1-007) already-computed `swings` directly — both patterns in this Provider's V1 toolkit (Scope item 3) are, structurally, labelings of a small, fixed number of consecutive alternating swings already in the Swing Detector's output, exactly as every prior bounded-hypothesis Provider reused the same substrate. No re-derivation of swing-point logic. Uses `sensitivity: 3`, matching the value chosen for all four prior Providers, for cross-Provider structural consistency (not dependency).
3. **Bounded candidate generation — V1's two canonical structures, each via its own fixed-size sliding window over consecutive swings (never a combinatorial subset search):**
   - **Head and Shoulders** (Top: bearish reversal; Bottom/Inverse: bullish reversal) — a 5-swing window (`Left Shoulder, Trough, Head, Trough, Right Shoulder` or its mirror), one candidate per plausible consecutive window.
   - **Double Top / Double Bottom** — a 3-swing window (`Peak, Trough, Peak` or its mirror), one candidate per plausible consecutive window.
   Both scans are independent, bounded, `O(n)` linear scans over the same already-computed swing sequence — never an unbounded or combinatorial search.
4. **Hard structural (shape) criteria — a candidate failing these is not a pattern at all, discarded outright, never a low-confidence guess:**
   - **Head and Shoulders:** the middle peak (Head) must exceed both outer peaks (Shoulders); the two Shoulders must be roughly symmetric in price (a disclosed tolerance, Missing Decisions); the two Troughs forming the neckline must be roughly level (a disclosed tolerance). Mirrored for the bullish Inverse form.
   - **Double Top/Bottom:** the two Peaks (or Troughs) must be roughly equal in price (a disclosed tolerance, Missing Decisions).
   Each hard criterion's own margin (how comfortably, not just technically, it was satisfied) feeds Detection Confidence (Scope item 6) — the weakest criterion determines overall structural confidence, the same "weakest link" idiom established by every prior bounded-hypothesis Provider.
5. **Confirmation status — the genuinely distinct, non-binding signal this methodology's own primary source treats as decisive for reliability, contributing to ranking/confidence only, never to shape-survival (already decided in Scope item 4):** a candidate's own **neckline level** (the trough(s) for a top pattern, the peak(s) for a bottom pattern) is checked against every `MarketSeries` point timestamped after the pattern's last swing; the pattern is **confirmed** if any such point's `close` breaks the neckline in the pattern's own anticipated direction, further disclosed as **volume-confirmed** if that breaking point's `volume` exceeds the pattern's own formation-period average volume by a disclosed margin (Edwards & Magee's own emphasis that a genuine breakout is accompanied by expanding volume) — an **unconfirmed** ("still forming") candidate is not discarded; it is disclosed as a genuine, lower-confidence hypothesis, per this methodology's own literature.
6. **Full Confidence taxonomy** (S1-008): Detection Confidence (Scope item 4's weakest shape-tolerance margin), Interpretation Confidence (Scope item 5's confirmation status — unconfirmed scores lowest, confirmed scores higher, volume-confirmed scores highest), Regime-Adjusted Confidence (this Provider's own rule, distinct in its underlying reasoning from every prior Provider's own rule even where it shares the `trendState` axis: a *reversal* pattern's own claim requires a genuine prior trend to reverse, so its reading strengthens when the Regime/Context Service reads `TRENDING` and weakens when it reads `RANGING` — exact modulation magnitude an independent implementation-time calibration, disclosed via Decision Log, distinct from any prior Provider's own multiplier values), and Methodology Confidence Ceiling (this Provider's own disclosed value, reflecting Edwards & Magee's status as an exceptionally well-documented, continuously-reprinted single-lineage primary source — independently calibrated from, not copied from, any prior Provider's own ceiling).
7. **Bounded multi-hypothesis `interpretation[]`.** Every surviving (shape-valid) candidate becomes one ranked `interpretation[]` entry, ranked by Interpretation Confidence, bounded at a disclosed, named maximum (Missing Decisions) — never an unbounded list.
8. **Explicit, disclosed invalidation description per hypothesis** — directly answering the same "what invalidates this reading?" question every prior Provider answers: for every surviving hypothesis, the price level beyond which the pattern's own anticipated direction is contradicted (a decisive close back through the Head/second Peak-or-Trough's own extreme, per Edwards & Magee's own convention) is computed and disclosed in that hypothesis's summary text — no new contract field, richer content within the existing `Interpretation.summary`/`Evidence` fields.
9. **Populated `Limitations`, never a thrown exception**, when no candidate satisfies either pattern family's hard shape criteria anywhere in the supplied series — per ADR-006, the same discipline as every other component in this system.
10. **Real `Traceability`**, referencing the actual Swing Detector/Regime Context outputs consumed (their `computationVersion`s included).
11. **`normalize()` implementation** (ADR-007), confined to `providers/classical-chart-patterns/`, mapping this Provider's own Evidence/Interpretation into the shared seven-dimension vocabulary using only its own domain knowledge (e.g. TREND/STRUCTURE from the matched pattern's own anticipated reversal direction; CONFIRMATION from this Provider's own confirmation/volume-confirmation status), honestly `NOT_APPLICABLE` for every dimension it has no native concept for — added as the fifth entry to the existing shared `normalize()` conformance test suite (`normalize-vocabulary-conformance.spec.ts`, S1-012), not a new test suite.
12. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and every prior Provider's own independence check) asserting that no file under `providers/classical-chart-patterns/` imports from, or otherwise references, `providers/wyckoff/`, `providers/ict-smc/`, `providers/elliott-wave/`, or `providers/harmonic-patterns/`.
13. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked Head and Shoulders (or Double Top/Bottom) instance matched against a named, cited primary source's own published description — Edwards & Magee's "Technical Analysis of Stock Trends" (1948) — with the same disclosed-fallback allowance established at every prior sprint if the specific cited source cannot be independently obtained in this implementation environment.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Triangles (symmetrical/ascending/descending), Flags, Pennants, Wedges, Rectangles, Rounding Tops/Bottoms, and Cup-and-Handle.** V1's bounded toolkit is Head and Shoulders (+ Inverse) and Double Top/Bottom only — the two most universally-cited reversal formations, both expressible as a small, fixed-size swing window (5 and 3 swings respectively), consistent with every prior Provider's own "bounded V1 toolkit" scoping precedent. A natural future extension of this same Provider.
- **Price-target projection** (the classic Edwards & Magee "measured move" — pattern height projected from the neckline break). A trading-recommendation concern; an Analysis Provider states a disclosed, falsifiable reading, never a trading instruction — the same boundary already drawn for Harmonic Patterns' own PRZ exclusion.
- **Multi-degree or nested pattern labeling** (a pattern within a larger pattern's own leg). V1 operates at a single, undifferentiated structural scale only.
- **Any other methodology Provider** (Price Action, Supply/Demand, Fibonacci Analysis, VSA, or any other) — future sprints, per the Architecture Team's own Roadmap Order (S1-015 onward).
- **Any dependency, via `dependsOn`, on `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, or `HarmonicPatternsProvider`.** This sprint's independence mandate, stated explicitly, test-verified (Scope item 12), not merely assumed.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework or the Confluence Engine.** If a genuinely reusable abstraction emerges during implementation, it stays inside `providers/classical-chart-patterns/`. Promotion into either shared component is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **Any change to the Normalized Vocabulary Schema, `ConfluenceWeightStrategy`, or the dimension-aggregation mechanism** (ADR-007, S1-012) — this Provider is a new vocabulary-mapping *consumer* of that already-approved design, not a redesign of it.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-013 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `ClassicalChartPatternsProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–13 as a new `apps/api/src/analysis-engine/providers/classical-chart-patterns` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a `normalize()` mapping added to the existing shared conformance suite; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR` and `REGIME_CONTEXT` tokens — consumed, not modified. `INDICATOR_ENGINE` is not consumed — this Provider's shape/confirmation criteria are expressed directly over swing prices and `MarketSeries` points, with no genuine use for any existing calculator.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `ClassicalChartPatternsProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- S1-012's Normalized Vocabulary Schema and shared `normalize()` conformance suite — consumed and extended (one new fixture entry), not redesigned.
- **S1-009's `WyckoffProvider`, S1-010's `IctSmcProvider`, S1-011's `ElliottWaveProvider`, and S1-013's `HarmonicPatternsProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from any of their own module directories.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's standing authorization for the S1-013→S1-018 Roadmap Order.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `ClassicalChartPatternsProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Provider-specific output shape or a fifth Confidence kind. The invalidation description (Scope item 8) is disclosed as text content within these existing fields, not a new field.
- **Confirmation-status scoring (Scope items 5-6) is this Provider's own genuinely distinct design, not a mechanical copy of any prior Provider's hard/soft split.** Unlike Elliott Wave's Rule-vs-guideline distinction or Harmonic Patterns' band-vs-ideal distinction, this Provider's soft signal is a temporal one — whether price has *since* broken the pattern's own neckline — directly reflecting Edwards & Magee's own emphasis on confirmation, not a generic reapplication of a prior Provider's scoring shape.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'`, `'ICT_SMC'`, `'ELLIOTT_WAVE'`, or `'HARMONIC_PATTERNS'`; no source file under `providers/classical-chart-patterns/` imports from any of their own module directories; verified mechanically by Scope item 12's boundary test.
- **No leakage into generic components.** No Classical-Chart-Patterns-specific vocabulary (Head and Shoulders, Double Top, Double Bottom, neckline, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, `ObservabilityService`, or anywhere under `confluence/`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/classical-chart-patterns/` for this sprint; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it.
- Per ADR-001, ADR-003, ADR-004, ADR-005, ADR-007: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/volume arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent; `strength` values in `normalize()` output may use plain `number` (0–100), consistent with S1-012's own established convention.

---

# Acceptance Criteria

- `ClassicalChartPatternsProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'CLASSICAL_CHART_PATTERNS'`, with no `dependsOn` entry, and is the fifth entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear, well-formed Head and Shoulders (or Double Top/Bottom) structure, the Provider identifies that pattern, consistent with the Swing Detector's already-verified swings (no re-derivation of swing logic — composed, not duplicated).
- A dedicated unit test constructs a sequence satisfying Head and Shoulders' own shape criteria and confirms it survives; a separate test constructs a sequence violating at least one shape criterion (e.g. asymmetric shoulders beyond tolerance, or the Head not exceeding both shoulders) and confirms it is discarded entirely (never returned as a low-confidence hypothesis). The same pair of tests exists for Double Top/Bottom.
- A dedicated unit test verifies confirmation-status scoring: an otherwise-identical shape-valid candidate scores a strictly higher Interpretation Confidence when a subsequent series point closes beyond the neckline than when no such point exists (still forming); a further test confirms an additional, disclosed volume-expansion bonus when the confirming close's own volume exceeds the pattern's own formation-period average.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected pattern is higher when the Regime/Context Service reads `TRENDING` than when it reads `RANGING`; Methodology Confidence Ceiling reflects this Provider's own disclosed source-documented status (a specific, test-asserted value, independently calibrated from every prior Provider's own ceiling, not copied from any of them).
- A series with no candidate satisfying either pattern family's shape criteria produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Swing Detector/Regime Context `computation`/`computationVersion` this Provider consumed.
- `normalize()` is implemented, added as a fifth fixture entry to the existing shared conformance suite (`normalize-vocabulary-conformance.spec.ts`), and passes its generic assertions unmodified.
- A golden-dataset/reference-example test reproduces at least one worked pattern instance from a named, cited source; any substitution for an unobtainable primary source is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 12) passes, confirming zero references from `providers/classical-chart-patterns/` to any of the four prior Providers' own module directories.
- No Classical-Chart-Patterns-specific vocabulary appears in any generic framework file or `confluence/` (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at every prior sprint's own closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-013 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Combinatorial-search risk.** Same category as every prior bounded-hypothesis Provider — mitigated by Scope item 3's two independent, bounded linear-scan candidate generations, never an exhaustive sub-sequence search.
- **Shape-tolerance calibration risk**, same category as every prior Provider's own bound-calibration risks (Known Limitations) — the exact symmetry/neckline-levelness tolerance is an implementation-time calibration, disclosed via Decision Log, never a silent, undocumented magic number.
- **Confirmation-window risk.** Checking every subsequent `MarketSeries` point for a neckline break is unbounded only in principle — mitigated because it is a single linear scan over an already-finite, already-loaded series (never a re-fetch or an unbounded lookahead beyond the series already supplied).
- **Source-fidelity risk, this sprint's own version:** Edwards & Magee's 1948 text is an exceptionally well-documented single-lineage primary source (unlike ICT/SMC's decentralized modern retail vocabulary, or Harmonic Patterns' own competing-author ratio-table variance), but the specific numeric tolerances for "roughly symmetric" or "roughly level" are not stated with Wyckoff's Three-Laws-level numeric precision in most secondary descriptions. Mitigated by disclosing the specific tolerance values used (Missing Decisions) and the same honest sourcing-disclosure precedent established at every prior sprint if the primary text cannot be independently obtained in this implementation environment.
- **False-precision-of-invalidation risk**, same category as every prior Provider's own named risk — mitigated by deriving every invalidation description directly and only from the same shape arithmetic already used for candidate survival (Scope items 4, 8), never a separately-estimated or heuristic value.
- **Premature-promotion risk**, the same recurring named risk carried into every Provider sprint since S1-010 — mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as every prior Provider's own bound — the implementation-time bound chosen must be disclosed via Decision Log, not left as an undocumented magic number.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract, or the Normalized Vocabulary Schema/Confluence Engine, proves insufficient to express a genuine Classical Chart Pattern finding without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension or vocabulary dimension unilaterally).
- Scope expansion is requested, including any request to implement Triangles/Flags/Pennants/Wedges/Rectangles/Rounding formations, price-target projection, multi-degree nested pattern labeling, another methodology Provider ahead of the Roadmap Order, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to any prior Provider (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework or Confluence Engine before a second methodology independently requires it.
- A primary or well-established Classical Chart Patterns source's worked example genuinely cannot be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015/016/017 precedent — not requiring pre-approval:

- Exact symmetry tolerance for Head and Shoulders' shoulders and Double Top/Bottom's peaks/troughs, and neckline-levelness tolerance for Head and Shoulders.
- The exact volume-expansion margin that upgrades a confirmed pattern to volume-confirmed.
- The maximum number of candidate hypotheses tracked in `interpretation[]`.
- Exact Interpretation Confidence values for the unconfirmed/confirmed/volume-confirmed states.
- The exact Regime-Adjusted Confidence modulation magnitude for the `TRENDING`/`RANGING` interaction described in Scope item 6.
- The specific cited source for the golden-dataset conformance test, and any disclosed substitution.
- Methodology Confidence Ceiling's exact value for `'CLASSICAL_CHART_PATTERNS'`.
- `computationVersion`/`vocabularySchemaVersion` numbering for `ClassicalChartPatternsProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved concurrently with the Architecture Team's standing authorization to execute the S1-013→S1-018 Roadmap Order's complete lifecycle (Phases 1–9) autonomously per Sprint, without intermediate approval gating, stopping only for the Stop Conditions restated in that authorization. Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified; the SLOW tier classification, shape-hard-filter/confirmation-soft-signal split (a genuinely novel design for this methodology's own temporal confirmation concept, not a copy of any prior Provider's shape), bounded two-pattern-family V1 toolkit, and the Regime-Adjusted Confidence rule's own distinct reasoning (reversal patterns require a genuine prior trend) were each accepted as proposed, consistent with ADR-006/007's already-approved design and this Sprint's own Engineering Authority grant.

---

# Sprint Closure

- **Sprint Status:** OPEN
- **Closed Date:** Pending
- **Completion Report:** Pending (`documentation/ai/S1-014_COMPLETION_REPORT.md`, AI-034)
- **Final Implementation Commits:** Pending
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`); ADR-007 (Normalized Vocabulary, consumed via a new `normalize()` mapping)
- **Related Decisions:** Pending (`DEC-2026-018`)

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-007 — consumed unchanged)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Swing Detection/Regime Context this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md`, `S1-013_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
