# S1-010 SPRINT BRIEF — ICT / Smart Money Concepts (SMC) Analysis Provider

**Document ID:** ZOS-S1-010
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-010
- **Sprint Name:** ICT / Smart Money Concepts (SMC) Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007_SPRINT_BRIEF.md`/`S1-008_SPRINT_BRIEF.md`/`S1-009_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — see Approval Section)

---

# Sprint Objective

S1-009 registered the first Analysis Provider (Wyckoff). **S1-010 registers the second — and, per ADR-006 and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own text, this is the moment the framework's methodology-neutrality claim is actually tested**, not merely declared. Wyckoff is not the analytical foundation of Zenith; it is one Provider among a bounded, growing set. This sprint must prove — in code, not only in documentation — that a second, structurally unrelated methodology can be registered without touching the Analysis Provider Framework, the Execution Engine, the Registry, the Confidence Model, Traceability, Lifecycle, Observability, or Dependency Resolution. If any of those had to change to accommodate ICT/SMC, S1-008's framework design would itself be wrong; this sprint is therefore also a live regression check on that design.

The architecture document itself already resolves one important scoping question: its own Extension Guidelines and Additional Findings state that ICT and SMC were found to be ~90% overlapping in the research phase and "should share one Provider with dual-vocabulary output rather than duplicate detection code." This sprint builds that single, merged Provider — not two.

ICT/SMC's trader value case is different in kind from Wyckoff's, and the Provider must be honest about that difference rather than obscure it. Wyckoff's Three Laws are a documented, decades-old, source-verified body of work; ICT/SMC's vocabulary (Order Blocks, Fair Value Gaps, liquidity sweeps) originates from modern retail trading education with no equivalent independent institutional verification — the architecture document says this plainly: ICT/SMC "carry a disclosed, lower methodology confidence ceiling... reflecting the absence of any independent institutional verification — this is stated in their Provider's Limitations output, not hidden." A trader who has built real conviction around Smart Money Concepts deserves a Provider that reads their vocabulary faithfully; a trader evaluating it skeptically deserves a Provider that never launders that vocabulary's actual evidentiary status into false certainty. Both are served by the same discipline: precise, deterministic detection rules, and an honestly capped confidence ceiling.

---

# Scope

Per ADR-006 (contract mechanics — not repeated here) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`IctSmcProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'ICT_SMC'`, `methodologyFamily: 'ICT_SMC'` (single merged Provider per the Extension Guidelines' ~90%-overlap finding — no separate `IctProvider`/`SmcProvider`). **`tier: 'FAST'`** — unlike Wyckoff's Phase A–E classification (a bounded multi-hypothesis search, the same category as Elliott Wave), this Provider's V1 detection rules (Scope items 3–5 below) are each a single deterministic pass over the series with no phase-hypothesis search; `FAST` tier is the correct categorization on its own technical merits, not a default. `dependsOn` is **not set** — this Provider does not depend on `WyckoffProvider` or any other Provider. Registered as the **second entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`, per the S1-009 WP9 module-encapsulation fix — there is no separate `ProvidersModule` to register into).
2. **Market Structure — reused, not re-derived.** This Provider consumes the Swing Detector's (S1-007) already-computed `swings` and `structureEvents` (`BOS`/`CHoCH`) directly as its market-structure evidence. ICT's own definitions of "Break of Structure" and "Change of Character" are substantively the same concept S1-007 already computes generically — re-deriving them here would duplicate logic the Swing Detector already owns and risk two Providers disagreeing about the same underlying structure. For consistency of the shared structural substrate across Providers (a professional trader comparing two Providers' structure reads on the same chart must not see gratuitous disagreement caused only by different tuning), this Provider calls `swingDetector.detect(series, {sensitivity: 3})` — the same sensitivity value established for `WyckoffProvider` in S1-009 — unless a documented, evidence-based reason requires a different value at implementation time (recorded via Decision Log if so).
3. **Order Block detection**, purely price-based (no volume — see item 4's note below): for each `BOS` `StructureEvent` the Swing Detector reports, locate the last opposing-direction candle immediately preceding the impulse leg that produced the break (last bearish candle before a bullish break → Bullish Order Block; last bullish candle before a bearish break → Bearish Order Block), recording that candle's high/low as the Order Block's price zone and its timestamp.
4. **Fair Value Gap (FVG) / Imbalance detection**, purely price-based: a deterministic three-candle-window scan — a Bullish FVG exists where candle 1's high is below candle 3's low; a Bearish FVG exists where candle 1's low is above candle 3's high — recording the gap's price boundaries and formation timestamp. The minimum qualifying gap size is expressed as an **ATR-relative threshold** (via `INDICATOR_ENGINE`'s existing ATR calculator), not a fixed price-fraction — applying the lesson already learned and fixed during S1-009's own self-review (a fixed-fraction "near price" tolerance did not survive that review) proactively here rather than repeating it. No `Candle.volume` reference is required or used anywhere in this Provider's V1 scope: unlike Wyckoff's Effort-vs-Result law, ICT/SMC's core V1 toolkit (Order Blocks, Fair Value Gaps, Liquidity Sweeps) is defined purely in terms of price structure.
5. **Liquidity Sweep detection**, purely price-based: using the Swing Detector's swing highs/lows as the "liquidity pool" locations, a Liquidity Sweep is a candle whose high/low pierces beyond a prior swing extreme by more than an ATR-relative tolerance, while that same candle's close remains back within the prior range — read as a stop-hunt/liquidity grab, distinct from a genuine breakout (which does not close back inside).
6. **Bounded multi-hypothesis `interpretation[]`.** Synthesize the detected Order Blocks, Fair Value Gaps, Liquidity Sweeps, and structure events into a directional bias reading (continuation or reversal). Where evidence genuinely conflicts (e.g. a fresh Bullish Order Block coincides with an unmitigated Bearish Liquidity Sweep), return more than one ranked candidate bias rather than forcing a single guess — the same bounded multi-hypothesis discipline as Wyckoff/Elliott Wave. The maximum number of candidate hypotheses tracked is a Decision Log item at implementation time, not fixed by this Brief.
7. **Full Confidence taxonomy** (S1-008): Detection Confidence (how cleanly each Order Block/FVG/Sweep fits its defining rule), Interpretation Confidence (ranks each bias hypothesis), Regime-Adjusted Confidence (this Provider's own regime-interaction rule, distinct from Wyckoff's — informed by how professional SMC practice actually treats regime: Order-Block-based continuation reads are strengthened in a `TRENDING` regime, Liquidity-Sweep-based reversal reads are strengthened in a `RANGING` regime; the exact modulation magnitude is an implementation-time calibration, disclosed via Decision Log), and Methodology Confidence Ceiling (reflecting ICT/SMC's disclosed, source-unverified status — a value lower than Wyckoff's `85`, per the architecture document's own explicit statement cited in the Sprint Objective).
8. **Populated `Limitations`, never a thrown exception**, when no Order Block, Fair Value Gap, Liquidity Sweep, or structure event can be identified (e.g. insufficient bars, or a series with no qualifying structural events) — per ADR-006, the same discipline as every other component in this system.
9. **Real `Traceability`**, referencing the actual Swing Detector output consumed (its `computationVersion` included) and, where used, the Indicator Engine's ATR call — the same genuine-content discipline established for `WyckoffProvider` in S1-009.
10. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and the Wyckoff VSA-vocabulary boundary test already established) asserting that no file under this Provider's own module tree imports from, or otherwise references, the `providers/wyckoff/` module tree — operationalizing this sprint's explicit methodology-independence mandate as a real, running check, not only a code-review norm.
11. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked example matched against a named, well-established ICT/SMC educational reference, with the same disclosed-fallback allowance established at S1-007/S1-009 if the specific cited source cannot be independently obtained in this implementation environment — named and reasoned in the test file and completion report, never silent. Given ICT/SMC's real definitional variance across sources (see Risks), the test also records, in one place, exactly which definition of Order Block/FVG/Liquidity Sweep this Provider implements, so the choice is auditable rather than implicit.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Optimal Trade Entry (OTE) / premium-discount Fibonacci zones.** A natural future extension of this same Provider (the Indicator Engine's existing Fibonacci calculator, S1-007, is the obvious substrate) — deferred rather than expanding V1's bound, per the Extension Guidelines' preference for extending an existing Provider's vocabulary over building everything in one sprint.
- **Power of Three (Accumulation–Manipulation–Distribution) and the Judas Swing pattern.** Both are inherently time-of-day/session constructs — deferred alongside Killzones below, for the same underlying reason.
- **Killzones and any time-of-day/session-window concept** (London/New York/Asia session timing). This is **architecturally blocked in V1, not merely a scope choice**: `MarketSeries` (S1-007 Anti-Corruption Layer) carries daily-bar points with no intraday timestamp granularity or session metadata — a killzone concept cannot be expressed against the current raw-data model at all. This mirrors the VWAP/Volume Profile precedent from `22_ANALYSIS_ENGINE_ARCHITECTURE.md` (genuinely blocked by the data model) rather than the Point & Figure precedent from S1-009 (a mere complexity/scope choice) — the distinction is recorded here explicitly so it is not lost or conflated.
- **Breaker Blocks, Mitigation Blocks, Rejection Blocks, and other Order Block variants.** Advanced variants excluded from V1's canonical set — the same "single canonical schematic" bounding precedent as Wyckoff's Schematic #1-only scoping.
- **Equal Highs / Equal Lows as a separately catalogued liquidity-pool type.** Subsumed implicitly by Liquidity Sweep detection's use of swing extremes; not separately surfaced as its own Evidence category in V1.
- **Any other methodology Provider** (Elliott Wave, Harmonic Patterns, Classical Price Action, Chart Patterns, Breakout Methodology, Mean Reversion, Supply/Demand, or any other) — future sprints, per ADR-006.
- **The Confluence Engine, `normalize()`'s real vocabulary** — ADR-007, S1-012, unchanged.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007/S1-008/S1-009 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer — this sprint introduces none.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `IctSmcProvider` registers `ACTIVE` only; no Lifecycle transition occurs in this sprint, so Finding B remains genuinely open but non-blocking, exactly as flagged at S1-008 and S1-009 closure.
- **Any dependency, via `dependsOn`, on `WyckoffProvider` or any other Provider.** This is this sprint's central design mandate, not an incidental exclusion — stated here explicitly so it is unambiguous and test-verified (Scope item 10), not merely assumed.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–11 as a new `apps/api/src/analysis-engine/providers/ict-smc` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory (the only component affected is `apps/api`); a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR` and `INDICATOR_ENGINE` (ATR only) tokens — consumed, not modified.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `IctSmcProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- **S1-009's `WyckoffProvider` is explicitly not a dependency** — no `dependsOn` reference, no shared internal types or utilities imported from `providers/wyckoff/`, per this sprint's independence mandate.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own, since Providers are consumed as an array, not individually, per ADR-006.
- **No new interpretation mechanism.** `IctSmcProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent an ICT-specific output shape or a fifth Confidence kind.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'`; no source file under `providers/ict-smc/` imports from `providers/wyckoff/`; verified mechanically by Scope item 10's boundary test.
- **No leakage into generic components.** No ICT/SMC-specific vocabulary (Order Block, Fair Value Gap, liquidity sweep, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, or `ObservabilityService`. Those remain generic forever, per this sprint's Design Rules.
- Per ADR-001, ADR-003, ADR-004, ADR-005: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/volume arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent.

---

# Acceptance Criteria

- `IctSmcProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`FAST`/`methodologyFamily: 'ICT_SMC'`, with no `dependsOn` entry, and is the second entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear break-of-structure move, the Provider identifies an Order Block consistent with the Swing Detector's already-verified `BOS` structure event (no re-derivation of structure-break logic — composed, not duplicated).
- A dedicated unit test constructs a price sequence that deterministically triggers a Bullish Order Block and no other, and one that deterministically triggers a Bearish Order Block and no other.
- A dedicated unit test constructs a three-candle sequence that deterministically triggers a Bullish FVG and one that triggers a Bearish FVG, plus a sequence whose gap falls below the ATR-relative minimum and correctly produces no FVG.
- A dedicated unit test constructs a sequence that deterministically triggers a Liquidity Sweep (pierce-then-close-back-inside) and a separate sequence that produces a genuine breakout (pierce-and-hold), verifying the two are correctly distinguished.
- Phase/bias classification returns a bounded, disclosed-maximum `interpretation[]`, each entry carrying its own ranked Interpretation Confidence; a test confirms more than one candidate is returned for a genuinely conflicting-evidence constructed series, and exactly one for an unambiguous series.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected structure differs between `TRENDING` and `RANGING` regime reads, in the direction disclosed in Scope item 7; Methodology Confidence Ceiling reflects ICT/SMC's disclosed source-unverified status and is a specific, test-asserted value lower than Wyckoff's `85`.
- A series with no identifiable Order Block, FVG, Liquidity Sweep, or structure event produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Swing Detector (and, where used, Indicator Engine ATR) `computation`/`computationVersion` the Provider consumed — verified present and non-empty on a representative successful run.
- A golden-dataset/reference-example test reproduces at least one worked ICT/SMC example (Order Block, FVG, or Liquidity Sweep) from a named, cited source; any substitution for an unobtainable primary source is disclosed in the test file and completion report, per the S1-007/S1-009 precedent.
- The Independence Boundary Test (Scope item 10) passes, confirming zero references from `providers/ict-smc/` to `providers/wyckoff/`.
- No ICT/SMC-specific vocabulary appears in any generic framework file (Architecture Requirements' named list) — verified by code review; no mechanical test is claimed for this criterion beyond the boundary test's narrower, code-verifiable scope.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-009 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Source-fidelity risk, different in kind from Wyckoff's.** ICT/SMC's vocabulary originates from modern retail trading education (principally the "ICT"/Inner Circle Trader material and the broader Smart Money Concepts community) with no equivalent to Wyckoff's decades-old, source-verifiable Three Laws. Mitigated by disclosing this plainly via a lower Methodology Confidence Ceiling and by never presenting ICT/SMC's readings with the same evidentiary weight as a source-verified methodology's — the honest-uncertainty discipline this entire architecture exists to enforce.
- **Definitional-variance risk.** Unlike Wyckoff's single well-established curriculum, ICT and SMC terms are used with real definitional variance across educators and sources (e.g. "Order Block" definitions differ meaningfully between them). Mitigated by picking one internally-consistent, explicitly-cited definition per concept (Scope items 3–5) and disclosing that choice in the golden-dataset test and completion report, rather than attempting to reconcile every variant into one "correct" definition.
- **Independence-erosion risk — this sprint's central named risk.** Both this Provider and `WyckoffProvider` scan structural price events, creating a real temptation to reuse Wyckoff-shaped internal helpers (its range detector, its event-detection utilities) since the problems look superficially similar. Mitigated by Scope item 10's mechanical boundary test and by deliberately not factoring out a shared "provider event-detection" utility library in this sprint — a premature abstraction the mission's own design rules warn against. If real duplication emerges once a third structurally-similar Provider exists, that becomes its own future extraction decision, escalated then, not assumed now.
- **Premature confidence / false-certainty risk.** An Order Block or Liquidity Sweep that has not yet been mitigated/confirmed by subsequent price action could be presented with unwarranted certainty. Mitigated by the same four-part Confidence taxonomy and bounded multi-hypothesis `interpretation[]` discipline established for Wyckoff.
- **Future double-counting risk with Supply/Demand zone theory.** Order Blocks and Fair Value Gaps conceptually resemble Supply/Demand zone concepts, which `22_ANALYSIS_ENGINE_ARCHITECTURE.md` already flags as sharing `methodologyFamily` tagging with a "merged ICT/SMC Provider." Mitigated by this Provider self-declaring `methodologyFamily: 'ICT_SMC'` now, so the future Confluence Engine (S1-012) can correctly avoid counting agreement with a future Supply/Demand-tagged Provider as independent confirmation.
- **Multi-hypothesis bound calibration risk**, same category as Wyckoff's/Elliott Wave's (Known Limitations) — an unbounded bias-hypothesis search is not authorized; the implementation-time bound chosen must be disclosed via Decision Log, not left as an undocumented magic number.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract proves insufficient to express a genuine Order Block/FVG/Liquidity Sweep finding without distortion (this would be a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension unilaterally).
- Scope expansion is requested, including any request to implement OTE, Power of Three, Killzones, another methodology Provider, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to `WyckoffProvider` or any other Provider (all explicitly Non-Scope).
- A primary or well-established ICT/SMC source's worked example genuinely cannot be located after a documented attempt (see Golden-Dataset risk, S1-007/S1-009 precedent).

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013 precedent — not requiring pre-approval:

- The maximum number of alternate bias-hypotheses tracked in `interpretation[]`.
- Exact numeric thresholds for each rule (the ATR-relative minimum FVG gap size; the ATR-relative pierce tolerance distinguishing a Liquidity Sweep from a genuine breakout; how many bars after a piercing candle the "closes back inside" confirmation window extends).
- The exact Regime-Adjusted Confidence modulation magnitude for the TRENDING/RANGING interaction described in Scope item 7.
- The specific cited source for the golden-dataset conformance test, and any disclosed substitution.
- Methodology Confidence Ceiling's exact value/floor for `'ICT_SMC'` (disclosed lower than Wyckoff's `85`).
- `computationVersion` numbering for `IctSmcProvider` (same semantic-versioning-from-`1.0.0` convention as S1-007/S1-008/S1-009).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved on the basis that the independent self-audit found no Critical findings and the bounded V1 scope, Swing Detector reuse, ATR-relative thresholds, Independence Boundary Test, and Killzone deferral were each accepted as proposed. This Sprint Brief is valid for implementation per Constitution Rule 2, pending the S1-010 Task Breakdown's own review and approval.

**Architecture Team Implementation Guidance (binding direction for this Sprint, additive to — not a revision of — the Scope above):**

1. **Design around the liquidity narrative, not isolated patterns.** Order Blocks, Fair Value Gaps, and Liquidity Sweeps are implementation primitives, not the Provider's final objective. Where a V1 design choice is otherwise neutral, prefer the shape that leaves room for a future `Liquidity Event → Displacement → Imbalance → Institutional Reaction` reasoning progression over one that locks the Provider into a flat, unrelated set of pattern detectors with no evolution path. V1 does not implement that progression — it must not foreclose it.
2. **Any concept discovered during implementation that is genuinely reusable across future Providers belongs in the generic Analysis Engine, not duplicated inside `providers/ict-smc/`.** Anything exclusively ICT/SMC's stays confined there. Framework vocabulary remains methodology-independent — no ICT/SMC term is ever introduced into a generic component's name, type, or field, even informally.
3. Every implementation decision continues to be evaluated against both the Senior Software Architect and Professional Institutional Trader lenses (determinism, explainability, twenty-Provider durability, trader trust, methodology independence) — carried forward from the Sprint Objective, restated here as standing Architecture Team direction for the remainder of this Sprint.
4. Every Work Package's design choices are made in service of Zenith's long-term objective: understanding market behaviour, multiple analytical schools, and eventually trader behaviour — not building an isolated technical-analysis module.

This guidance governs *how* the approved Scope is implemented; it does not add, remove, or reinterpret any Scope/Non-Scope item above.

---

# Sprint Closure

- **Sprint Status:** OPEN
- **Closed Date:** Pending
- **Completion Report:** Pending (`documentation/ai/S1-010_COMPLETION_REPORT.md`, AI-026)
- **Final Implementation Commits:** Pending
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`)
- **Related Decisions:** Pending (`DEC-2026-014`)

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations, Additional Findings — including the ~90%-overlap and disclosed-lower-ceiling findings this Brief builds directly from)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Indicator Engine/Swing Detection this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md` (the first Provider — a structural precedent for process, deliberately not for methodology-specific content, per this sprint's independence mandate)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
