# S1-013 SPRINT BRIEF — Harmonic Patterns Analysis Provider

**Document ID:** ZOS-S1-013
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-013
- **Sprint Name:** Harmonic Patterns Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`–`S1-012_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — autonomous full-lifecycle execution authorized; see Approval Section)

---

# Sprint Objective

S1-009, S1-010, and S1-011 each registered a real Analysis Provider (Wyckoff, ICT/SMC, Elliott Wave); S1-012 built the Confluence Engine that reads all three through the shared Normalized Vocabulary. **S1-013 registers the fourth Analysis Provider — Harmonic Patterns** — a fourth, structurally independent methodology, per the Architecture Team's own Roadmap Order (S1-013 → S1-018) and the Extension Guidelines' "New Analysis Provider" requirements. Harmonic Patterns reads price structure through precise Fibonacci-ratio geometry across five pivot points (X, A, B, C, D) — Gartley, Bat, Butterfly, and Crab, the four most universally-cited patterns in the methodology's own literature.

This sprint is explicitly **not** about drawing a pattern shape on a chart. Its purpose is the same as every prior Provider's: model a specific, falsifiable market-structure claim, deterministically, with disclosed confidence and disclosed invalidation. A harmonic pattern's entire claim rests on precise ratio conformance between four price legs (XA, AB, BC, CD) — unlike Elliott Wave's hard structural Rules (which forbid certain price relationships outright), Harmonic Patterns has no equivalent "rule" independent of ratio-band membership itself: a candidate either falls within a named pattern's own published ratio tolerance bands, or it is not that pattern. This gives the methodology a different, but equally deterministic, character from every prior Provider — one this sprint must represent faithfully rather than forcing into Elliott Wave's hard-Rule/soft-guideline shape by rote imitation.

This is also this system's fourth live proof of the Analysis Provider Framework's methodology-agnosticism (following Wyckoff, ICT/SMC, and Elliott Wave) and the Confluence Engine's own genuine extensibility (S1-012): registering a fourth Provider must require zero change to `AnalysisProvider`, the Execution Engine, the Confluence Engine, or the Normalized Vocabulary Schema — only a new `normalize()` mapping confined to this Provider's own module directory, exactly as ADR-007 anticipated.

---

# Scope

Per ADR-006 (Provider contract mechanics) and ADR-007 (Normalized Vocabulary, consumed unchanged) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`HarmonicPatternsProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'HARMONIC_PATTERNS'`, `methodologyFamily: 'HARMONIC_PATTERNS'`, **`tier: 'SLOW'`** — a bounded multi-hypothesis search over candidate pattern instances, the same tiering category as Wyckoff's Phase-schematic layer and Elliott Wave. `dependsOn` **not set** — independent of every other Provider. Registered as the **fourth entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`).
2. **Market Structure reuse.** Consumes the Swing Detector's (S1-007) already-computed `swings` directly — a candidate harmonic pattern is, structurally, a labeling of five consecutive alternating swings (X, A, B, C, D) already in the Swing Detector's output, exactly as Elliott Wave's 5-wave count reused the same substrate for six swings. No re-derivation of swing-point logic. Uses `sensitivity: 3`, matching the value chosen for all three prior Providers, for cross-Provider structural consistency (not dependency).
3. **Bounded XABCD candidate generation — V1's single canonical structure.** From the available swing sequence, generate a bounded number of candidate 5-point (X, A, B, C, D) labelings, one per plausible starting offset within the sequence (a linear scan over consecutive 5-swing windows — an unbounded combinatorial search over every possible sub-sequence is **not authorized**, the same discipline as Elliott Wave's Scope item 3). A candidate is structurally well-formed only if its five swings strictly alternate type: `LOW,HIGH,LOW,HIGH,LOW` (a bullish-completing pattern — D is a swing low, the point from which a bullish reversal is anticipated) or `HIGH,LOW,HIGH,LOW,HIGH` (a bearish-completing pattern, mirrored). A window that does not alternate is not a candidate at all — discarded before any ratio computation.
4. **Named pattern ratio tables — four patterns, V1's bounded toolkit:** Gartley, Bat, Butterfly, and Crab (the four most universally and consistently cited across independent secondary sources — see Non-Scope for the deferred remainder). Each pattern type is defined by four ratio bands, computed directly from the candidate's own leg prices via `Prisma.Decimal` division (no reuse of `INDICATOR_ENGINE.fibonacciLevels()` — see Architecture Requirements for why a direct-ratio computation, not that anchor-pair-based calculator, is the correct fit here):
   - `AB/XA` — the B retracement of the XA leg.
   - `BC/AB` — the C retracement of the AB leg.
   - `CD/BC` — the D leg's extension of the BC leg.
   - `AD/XA` (equivalently `XD/XA`) — the completion point's overall retracement or extension of the initial XA leg; the ratio every cited source treats as each pattern's own single most defining number.
   Exact tolerance bands per pattern/leg are an implementation-time calibration (Missing Decisions), each independently sourced from widely-cited, consistent secondary literature (see Risks, "Source-fidelity risk").
5. **Hard band-membership filtering, per pattern type, independent per candidate.** A candidate's four computed ratios are checked against each of the four named patterns' own bands **independently** — a single X-A-B-C-D swing window may match zero, one, or (near a shared band boundary) more than one pattern type; each pattern type a candidate's ratios satisfy becomes its own separate surviving hypothesis (never merged or averaged into one). A candidate whose ratios fall outside every named pattern's bands is not a Harmonic Pattern hypothesis at all — discarded outright, the same "never a low-confidence guess for a non-match" discipline as every prior Provider's hard-filter stage.
6. **Detection Confidence — ratio-match tightness** (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Confidence Model, "Harmonic Pattern ratio match tightness" is this concept's own named example): for a candidate matched against a specific pattern type, the minimum, across the four ratio checks, of how far the actual ratio sits from that check's own nearer band edge (as a fraction of the band's own half-width) — the weakest leg determines overall Detection Confidence, the same "weakest link" idiom Elliott Wave established for its own three Rule margins.
7. **Interpretation Confidence — two genuinely distinct signals, both non-binding (contribute to ranking only, never to survival, already decided in Scope item 5):** (a) proximity to the matched pattern's own cited *ideal* ratio value for each leg (the band's published central/reference value, distinct from Detection Confidence's band-*edge* margin); and (b) AB=CD time symmetry — a widely-cited secondary harmonic confirmation (Carney, and the broader harmonic-trading literature) that the AB and CD legs' own calendar-time durations should be comparable, scored by proximity to a 1:1 duration ratio. Averaged into one Interpretation Confidence value per surviving hypothesis, ranking entries within the bounded `interpretation[]`.
8. **Bounded multi-hypothesis `interpretation[]`.** Every surviving (pattern-type-matched) candidate becomes one ranked `interpretation[]` entry, ranked by Interpretation Confidence, bounded at a disclosed, named maximum (Missing Decisions) — never an unbounded list, even when a swing window happens to satisfy more than one pattern type's bands.
9. **Explicit, disclosed invalidation description per hypothesis** — directly answering the same "what invalidates this reading?" question every prior Provider answers: for every surviving hypothesis, the specific price level beyond which the pattern's own D-point completion zone is violated (the D-point ratio band's own far edge, projected to a price level) is computed and disclosed in that hypothesis's summary text — no new contract field, richer content within the existing `Interpretation.summary`/`Evidence` fields, the same discipline as Elliott Wave's Scope item 6.
10. **Full Confidence taxonomy** (S1-008): Detection Confidence (Scope item 6), Interpretation Confidence (Scope item 7), Regime-Adjusted Confidence (this Provider's own rule, distinct from all three prior Providers': geometric ratio-precision patterns are more trustworthy in a `LOW`-volatility regime, where price action is cleaner and less likely to produce a "clean-looking" ratio by pure noise, and weaker in a `HIGH`-volatility regime — using `RegimeContextResult.volatilityState`, not `trendState`, a genuinely distinct axis from every prior Provider's own rule; exact modulation magnitude is an implementation-time calibration, Missing Decisions), and Methodology Confidence Ceiling (Harmonic Patterns' own disclosed value, independently calibrated — not copied from Wyckoff's `85`, ICT/SMC's `60`, or Elliott Wave's `75` — reflecting genuine, disclosed ratio-table variance across the methodology's own competing published sources, see Risks).
11. **Populated `Limitations`, never a thrown exception**, when no candidate matches any of the four named patterns' bands in the supplied series — per ADR-006, the same discipline as every other component in this system.
12. **Real `Traceability`**, referencing the actual Swing Detector/Regime Context outputs consumed (their `computationVersion`s included).
13. **`normalize()` implementation** (ADR-007), confined to `providers/harmonic-patterns/`, mapping this Provider's own Evidence/Interpretation into the shared seven-dimension vocabulary using only its own domain knowledge (e.g. TREND/STRUCTURE from the matched pattern's own completion direction; CONFIRMATION from AB=CD time-symmetry conformance), honestly `NOT_APPLICABLE` for every dimension it has no native concept for — added as the fourth entry to the existing shared `normalize()` conformance test suite (`normalize-vocabulary-conformance.spec.ts`, S1-012), not a new test suite.
14. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and every prior Provider's own independence check) asserting that no file under `providers/harmonic-patterns/` imports from, or otherwise references, `providers/wyckoff/`, `providers/ict-smc/`, or `providers/elliott-wave/`.
15. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked Gartley pattern instance matched against a named, cited primary or well-established secondary source's own published ratio table (H.M. Gartley's 1935 "Profits in the Stock Market"; Larry Pesavento's "Fibonacci Ratios with Pattern Recognition", 1978; Scott Carney's "Harmonic Trading, Volume One", 2004), with the same disclosed-fallback allowance established at S1-007/S1-009/S1-010/S1-011 if the specific cited source cannot be independently obtained in this implementation environment.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Shark, Cypher, Deep Crab, 5-0, Alternate Bat, and Three Drives patterns.** V1's bounded toolkit is Gartley/Bat/Butterfly/Crab only — the four most universally and consistently cited across independent secondary sources. A natural future extension of this same Provider, per the Extension Guidelines' preference for extending an existing Provider's vocabulary over building the entire pattern family in one sprint (the same "bounded V1 toolkit" precedent as ICT/SMC's Order-Block/FVG/Liquidity-Sweep scoping).
- **Potential Reversal Zone (PRZ) width computation or trade-entry/stop/target price levels.** These are trading-recommendation concerns; an Analysis Provider states a disclosed, falsifiable reading, never a trading instruction (the same boundary already drawn for every prior Provider). The D-point completion zone (Scope item 4's `AD/XA` band) is disclosed as a price range within `Evidence`/`Interpretation` text, not prescribed as an entry/exit instruction.
- **Multi-degree or nested harmonic pattern labeling** (a pattern within a larger pattern's own leg). V1 operates at a single, undifferentiated structural scale only, the same simplification Elliott Wave made for wave degree.
- **Any other methodology Provider** (Classical Chart Patterns, Price Action, Supply/Demand, Fibonacci Analysis, VSA, or any other) — future sprints, per the Architecture Team's own Roadmap Order (S1-014 onward).
- **Any dependency, via `dependsOn`, on `WyckoffProvider`, `IctSmcProvider`, or `ElliottWaveProvider`.** This sprint's independence mandate, stated explicitly, test-verified (Scope item 14), not merely assumed.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework or the Confluence Engine.** If a genuinely reusable abstraction emerges during implementation, it stays inside `providers/harmonic-patterns/`. Promotion into either shared component is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **Any change to the Normalized Vocabulary Schema, `ConfluenceWeightStrategy`, or the dimension-aggregation mechanism** (ADR-007, S1-012) — this Provider is a new vocabulary-mapping *consumer* of that already-approved design, not a redesign of it.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-012 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `HarmonicPatternsProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–15 as a new `apps/api/src/analysis-engine/providers/harmonic-patterns` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a `normalize()` mapping added to the existing shared conformance suite; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR` and `REGIME_CONTEXT` tokens — consumed, not modified. `INDICATOR_ENGINE.fibonacciLevels()` is deliberately **not** reused here (Architecture Requirements) — this Provider computes its own leg ratios directly via `Prisma.Decimal` division, since each of the four ratios has its own distinct, sequentially-chained anchor pair, unlike Elliott Wave's single-anchor-pair retracement/extension use case.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `HarmonicPatternsProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- S1-012's Normalized Vocabulary Schema and shared `normalize()` conformance suite — consumed and extended (one new fixture entry), not redesigned.
- **S1-009's `WyckoffProvider`, S1-010's `IctSmcProvider`, and S1-011's `ElliottWaveProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from any of their own module directories.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's standing authorization for the S1-013→S1-018 Roadmap Order.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `HarmonicPatternsProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Harmonic-specific output shape or a fifth Confidence kind. The invalidation description (Scope item 9) is disclosed as text content within these existing fields, not a new field.
- **Direct ratio computation, not `fibonacciLevels()` reuse, is the correct engineering choice here, not an inconsistency with Elliott Wave's precedent:** `fibonacciLevels()` computes a single anchor-pair's own retracement/extension price *levels*; Harmonic Patterns needs four *ratios* between four different, sequentially-chained leg pairs (XA, AB, BC, CD), each compared directly against a named pattern's own published ratio table — a direct `Prisma.Decimal` division (`legLength(leg2) / legLength(leg1)`) is simpler, more directly traceable to how every cited harmonic-pattern source itself describes verification (compare a computed ratio number against a table), and avoids forcing an anchor-pair-based calculator into a shape it was not designed for.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'`, `'ICT_SMC'`, or `'ELLIOTT_WAVE'`; no source file under `providers/harmonic-patterns/` imports from `providers/wyckoff/`, `providers/ict-smc/`, or `providers/elliott-wave/`; verified mechanically by Scope item 14's boundary test.
- **No leakage into generic components.** No Harmonic-Patterns-specific vocabulary (Gartley, Bat, Butterfly, Crab, XABCD, harmonic, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, `ObservabilityService`, or anywhere under `confluence/`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/harmonic-patterns/` for this sprint; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it.
- Per ADR-001, ADR-003, ADR-004, ADR-005, ADR-007: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/ratio arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent; `strength`/duration-ratio values in `normalize()` output may use plain `number` (0–100), consistent with S1-012's own established convention.

---

# Acceptance Criteria

- `HarmonicPatternsProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'HARMONIC_PATTERNS'`, with no `dependsOn` entry, and is the fourth entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear, well-formed 5-point (X, A, B, C, D) structure whose ratios fall within a specific named pattern's published bands, the Provider identifies that pattern, consistent with the Swing Detector's already-verified swings (no re-derivation of swing logic — composed, not duplicated).
- A dedicated unit test constructs a sequence whose ratios fall within Gartley's own bands and confirms it is identified as Gartley (and not misidentified as Bat/Butterfly/Crab); a separate test constructs a sequence outside every named pattern's bands and confirms it is discarded entirely (never returned as a low-confidence hypothesis).
- A dedicated unit test verifies a swing window whose ratios satisfy more than one named pattern's bands near a shared boundary produces more than one `interpretation[]` entry, each independently disclosed, never merged or averaged into one.
- A dedicated unit test verifies Interpretation Confidence: a candidate whose ratios land near each matched pattern's own cited ideal value, and whose AB/CD legs show close time symmetry, scores higher than an otherwise-band-satisfying candidate whose ratios sit near a band's edge or whose AB/CD legs show poor time symmetry.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation description — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected pattern is higher when the Regime/Context Service reads `LOW` volatility than when it reads `HIGH`; Methodology Confidence Ceiling reflects Harmonic Patterns' disclosed source-variance status (a specific, test-asserted value, independently calibrated from Wyckoff's `85`, ICT/SMC's `60`, and Elliott Wave's `75` — not copied from any of them).
- A series with no candidate matching any of the four named patterns' bands produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Swing Detector/Regime Context `computation`/`computationVersion` this Provider consumed.
- `normalize()` is implemented, added as a fourth fixture entry to the existing shared conformance suite (`normalize-vocabulary-conformance.spec.ts`), and passes its generic assertions unmodified.
- A golden-dataset/reference-example test reproduces at least one worked Gartley pattern instance from a named, cited source; any substitution for an unobtainable primary source is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 14) passes, confirming zero references from `providers/harmonic-patterns/` to `providers/wyckoff/`, `providers/ict-smc/`, or `providers/elliott-wave/`.
- No Harmonic-Patterns-specific vocabulary appears in any generic framework file or `confluence/` (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at S1-010/S1-011/S1-012 closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-012 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Combinatorial-search risk.** Same category as every prior bounded-hypothesis Provider — mitigated by Scope item 3's bounded linear-scan candidate generation, never an exhaustive sub-sequence search.
- **Cross-pattern ambiguity risk.** Because the four named patterns' ratio bands are independently defined (not mutually exclusive by construction), a single swing window can genuinely satisfy more than one pattern type near a shared boundary. Mitigated by Scope item 5's explicit design: each pattern-type match becomes its own independent hypothesis, never merged, never forced into a single "winning" pattern label — the bounded `interpretation[]` (Scope item 8) is precisely the mechanism this architecture already has for representing genuine ambiguity.
- **Ratio-tolerance calibration risk**, same category as Wyckoff's/ICT-SMC's/Elliott Wave's own bound-calibration risks (Known Limitations) — the exact tolerance band per pattern/leg is an implementation-time calibration, disclosed via Decision Log, never a silent, undocumented magic number.
- **Source-fidelity risk, this sprint's own distinct version:** unlike Elliott Wave (one primary author, R.N. Elliott) or Wyckoff (one coherent historical curriculum), Harmonic Patterns' exact ratio numbers genuinely vary across its own most-cited authors (H.M. Gartley's original 1935 description predates any Fibonacci-ratio table; Larry Pesavento's 1978 work added the ratios; Scott Carney's 2004 book refined and popularized the modern exact bands most retail education now cites) — a real, disclosed definitional variance, closer in kind to ICT/SMC's own decentralized-authorship risk than to Elliott Wave's single-author risk. Mitigated by disclosing the specific ratio table used (Missing Decisions) and the same honest sourcing-disclosure precedent established at S1-007/S1-009/S1-010/S1-011 if none of the three primary/secondary sources can be independently obtained in this implementation environment.
- **False-precision-of-invalidation risk**, same category as Elliott Wave's own named risk — mitigated by deriving every invalidation description directly and only from the same ratio-band arithmetic already used for candidate survival (Scope items 5, 9), never a separately-estimated or heuristic value.
- **Premature-promotion risk**, the same recurring named risk carried into every Provider sprint since S1-010 — mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as every prior Provider's own bound — the implementation-time bound chosen must be disclosed via Decision Log, not left as an undocumented magic number.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract, or the Normalized Vocabulary Schema/Confluence Engine, proves insufficient to express a genuine Harmonic Pattern finding without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension or vocabulary dimension unilaterally).
- Scope expansion is requested, including any request to implement Shark/Cypher/Deep Crab/5-0/Alt Bat/Three Drives, PRZ/entry-exit price computation, multi-degree nested pattern labeling, another methodology Provider ahead of the Roadmap Order, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to `WyckoffProvider`/`IctSmcProvider`/`ElliottWaveProvider` (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework or Confluence Engine before a second methodology independently requires it.
- A primary or well-established Harmonic Patterns source's worked example genuinely cannot be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015/016 precedent — not requiring pre-approval:

- Exact ratio tolerance bands per pattern (Gartley/Bat/Butterfly/Crab) per leg (AB/XA, BC/AB, CD/BC, AD/XA), and the specific cited source(s) each is drawn from.
- The maximum number of candidate hypotheses tracked in `interpretation[]`.
- The maximum number of candidate starting offsets considered during bounded candidate generation (Scope item 3).
- Exact Interpretation Confidence weighting between ideal-ratio proximity and AB=CD time-symmetry proximity (Scope item 7).
- The exact Regime-Adjusted Confidence modulation magnitude for the `LOW`/`HIGH` volatility interaction described in Scope item 10.
- The specific cited source for the golden-dataset conformance test, and any disclosed substitution.
- Methodology Confidence Ceiling's exact value for `'HARMONIC_PATTERNS'`.
- `computationVersion`/`vocabularySchemaVersion` numbering for `HarmonicPatternsProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved concurrently with the Architecture Team's standing authorization to execute the S1-013→S1-018 Roadmap Order's complete lifecycle (Phases 1–9) autonomously per Sprint, without intermediate approval gating, stopping only for the Stop Conditions restated in that authorization (ADR modification, Architecture modification, Product Vision modification, new external dependency, database schema modification, breaking public contract, security/data-integrity concern, or a genuine Architecture Team decision). Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified; the SLOW tier classification, band-membership hard filtering, ideal-ratio/time-symmetry soft scoring split, bounded multi-hypothesis design (including genuine cross-pattern ambiguity as multiple independent hypotheses, never merged), and the direct-ratio-computation (not `fibonacciLevels()`-reuse) engineering choice were each accepted as proposed, consistent with ADR-006/007's already-approved design and this Sprint's own Engineering Authority grant.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-13
- **Completion Report:** `documentation/ai/S1-013_COMPLETION_REPORT.md` (AI-032)
- **Final Implementation Commits:** `f0866a0` (Sprint Brief), `9bff9c5` (Task Breakdown), `2d1de7c` (WP1-WP11: full `HarmonicPatternsProvider` implementation, `normalize()` mapping, module registration), `20cdc79` (WP12: golden-dataset conformance test)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`); ADR-007 (Normalized Vocabulary, consumed via a new `normalize()` mapping)
- **Related Decisions:** `DEC-2026-017`

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model — "Harmonic Pattern ratio match tightness" is the Confidence Model's own named Detection Confidence example — Extension Guidelines, Known Limitations)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-007 — consumed unchanged)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Swing Detection/Regime Context this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md` (the Confluence Engine and Normalized Vocabulary this Provider's `normalize()` extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
