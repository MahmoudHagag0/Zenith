# S1-011 SPRINT BRIEF — Elliott Wave Analysis Provider

**Document ID:** ZOS-S1-011
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-011
- **Sprint Name:** Elliott Wave Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007`/`S1-008`/`S1-009`/`S1-010_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — see Approval Section)

---

# Sprint Objective

S1-009 and S1-010 registered the first two Analysis Providers (Wyckoff, ICT/SMC). **S1-011 registers the third — Elliott Wave** — and, per `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Design Principles ("Determinism... where a methodology is inherently non-unique, e.g. Elliott Wave wave counts, the engine represents that as multiple ranked deterministic hypotheses, never as a single non-reproducible guess") and Known Limitations ("Elliott Wave and Wyckoff's Phase-schematic layer use bounded multi-hypothesis search"), this Provider is the architecture's own named example of the bounded multi-hypothesis discipline the framework was built to support.

This sprint is explicitly **not** about drawing wave labels on a chart. Its purpose is to model market structure *evolution*: a professional Elliott Wave practitioner does not commit to one count and ignore the rest — they hold a primary count and one or more genuinely viable alternates, each falsifiable at a specific, disclosed price level, and revise their confidence as new bars arrive. A Provider that hard-codes a single wave count, or hides *why* one reading outranks another, would recreate exactly the false-certainty problem this architecture's Confidence Model and bounded `interpretation[]` exist to prevent — and would misrepresent a methodology whose own literature is explicit that multiple counts are often simultaneously valid until price action resolves them. The Provider must be able to answer, for any supplied series: what is the current (primary) wave count; what alternative counts exist; why the primary is preferred over the alternates; what would invalidate the primary count; and how confident the Provider is in each — every one of these five questions traceable to a deterministic, reproducible rule, never a hidden heuristic.

Elliott Wave also gives this sprint a chance to exercise a component built in S1-007 and never yet consumed: the Indicator Engine's `fibonacciLevels()` calculator, present since the Anti-Corruption Layer's foundation but idle until a Provider with a genuine ratio-guideline use for it existed. Reusing it here — rather than a Provider-local reimplementation — is itself a live test of the shared substrate's reusability across structurally unrelated methodologies (Wyckoff and ICT/SMC had no use for it; Elliott Wave does).

---

# Scope

Per ADR-006 (contract mechanics — not repeated here) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`ElliottWaveProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, `id: 'ELLIOTT_WAVE'`, `methodologyFamily: 'ELLIOTT_WAVE'`, **`tier: 'SLOW'`** — the architecture document's own named example of a slow-tier, bounded multi-hypothesis search (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, "Execution tiers"), the same category as Wyckoff's Phase-schematic layer, unlike S1-010's `IctSmcProvider` (`FAST`, no phase-hypothesis search). `dependsOn` **not set** — independent of every other Provider. Registered as the **third entry** in `ANALYSIS_PROVIDERS` (`analysis-engine.module.ts`'s `useFactory`).
2. **Market Structure reuse.** Consumes the Swing Detector's (S1-007) already-computed `swings` directly as the raw material for wave-count candidates — a 5-wave motive (impulse) count is, structurally, a labeling of five consecutive alternating swings already in the Swing Detector's output. No re-derivation of swing-point logic. Uses `sensitivity: 3`, matching the value chosen for S1-009's and S1-010's Providers for cross-Provider structural consistency, unless a documented, evidence-based reason requires otherwise (recorded via Decision Log if so).
3. **Bounded 5-wave motive (impulse) count generation — V1's single canonical structure**, symmetric for a bullish or bearish impulse: from the available swing sequence, generate a bounded number of candidate 5-wave labelings (Wave 1 through Wave 5, each a swing-to-swing leg), one per plausible starting offset within the sequence — an unbounded combinatorial search over every possible sub-sequence is **not authorized** (Known Limitations). Each candidate is checked against **Elliott's Three Rules**, applied as hard invalidation, never as a soft preference:
   - **Rule 1:** Wave 2 never retraces more than 100% of Wave 1.
   - **Rule 2:** Wave 3 is never the shortest of Waves 1, 3, and 5 (by price distance).
   - **Rule 3:** Wave 4 never enters Wave 1's price territory (the disclosed diagonal-triangle exception to this rule is out of V1's scope — see Non-Scope).
   A candidate violating any rule is discarded outright — an invalidated count is a falsified candidate, not a low-confidence hypothesis, the same "never a low-confidence guess" discipline as Wyckoff's range detection (S1-009).
4. **Fibonacci-guideline scoring — non-binding, contributing to ranking/confidence only, never to invalidation.** Reuses `INDICATOR_ENGINE.fibonacciLevels()` (S1-007, unmodified since its creation and, until now, consumed by no Provider) to compute Wave 2's retracement of Wave 1 and Wave 4's retracement of Wave 3, and Wave 3's extension relative to Wave 1, scoring each surviving candidate by proximity to the classic guideline ratios (deep Wave 2 retracements near 0.5/0.618/0.786; shallow Wave 4 retracements near 0.236/0.382 when Wave 3 has extended; Wave 3 at or beyond the 1.618 extension). This is guideline conformance, explicitly distinct from the Rule 1–3 hard invalidation in Scope item 3 — a candidate with poor Fibonacci conformance still survives as a valid, lower-ranked hypothesis; a candidate violating a Rule does not survive at all.
5. **Bounded multi-hypothesis `interpretation[]`.** Every surviving (non-invalidated) candidate becomes one ranked `interpretation[]` entry. The maximum number of candidates tracked is a disclosed, named constant (Decision Log item at implementation time), never an unbounded search.
6. **Explicit, disclosed invalidation level per hypothesis** — directly answering this Sprint's own named question ("what invalidates the current count?"): for every surviving candidate, a specific price level and the Rule it derives from (e.g. "a close beyond Wave 1's start invalidates this count via Rule 1") is computed and disclosed in that hypothesis's own summary text — no new contract field (Architecture Requirements), just richer, genuinely-computed content within the existing `Interpretation.summary`/`Evidence` fields.
7. **Full Confidence taxonomy** (S1-008): Detection Confidence (how completely the candidate's 5 waves are formed/confirmed), Interpretation Confidence (Fibonacci-guideline proximity, Scope item 4), Regime-Adjusted Confidence (this Provider's own rule, distinct from both Wyckoff's and ICT/SMC's: an impulse-wave count is fundamentally a trending-market structure, so its reading strengthens when the Regime/Context Service reads `TRENDING` and weakens when it reads `RANGING` — the exact modulation magnitude is an implementation-time calibration, disclosed via Decision Log), and Methodology Confidence Ceiling (Elliott Wave's own disclosed value, reflecting its documented primary-source status — R.N. Elliott's own writings and the widely-cited Frost/Prechter secondary literature — independently calibrated from, not copied from, Wyckoff's or ICT/SMC's ceiling).
8. **Populated `Limitations`, never a thrown exception**, when no valid, non-invalidated 5-wave candidate can be identified in the supplied series (e.g. insufficient swing structure, or every candidate fails a Rule) — per ADR-006, the same discipline as every other component in this system.
9. **Real `Traceability`**, referencing the actual Swing Detector/Regime Context/Fibonacci calculator outputs consumed (their `computationVersion`s included).
10. **Independence Boundary Test.** A lightweight, mechanical test (same category and spirit as the Anti-Corruption boundary test and both prior Provider-independence checks) asserting that no file under `providers/elliott-wave/` imports from, or otherwise references, `providers/wyckoff/` or `providers/ict-smc/`.
11. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked 5-wave impulse example matched against R.N. Elliott's own "The Wave Principle" (1938) or the widely-cited Frost & Prechter "Elliott Wave Principle" (1978) secondary literature, with the same disclosed-fallback allowance established at S1-007/S1-009/S1-010 if the specific cited source cannot be independently obtained in this implementation environment.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Corrective wave counting** (A-B-C zigzag, flat, triangle, and combination variants). A natural future extension of this same Provider, per the Extension Guidelines' preference for extending an existing Provider's vocabulary over building everything in one sprint.
- **Diagonal triangles** (leading and ending) and Rule 3's documented exception for them (a diagonal's Wave 4 is permitted to overlap Wave 1). V1's Rule 3 check applies unconditionally, with no diagonal carve-out — a disclosed simplification, not a blocker; a genuine diagonal in a supplied series is correctly, if conservatively, invalidated as a non-diagonal impulse candidate in V1.
- **Wave Personality, the Guideline of Alternation, Wave Equality, and channeling** — the secondary Elliott guidelines beyond the three Fibonacci-ratio checks this Brief scopes (Scope item 4). Deferred, candidates for a future extension of this same Provider.
- **Multi-degree wave labeling** (Grand Supercycle down to Subminuette, and the nesting between them). V1 operates at a single, undifferentiated wave degree only.
- **Any other methodology Provider** (Harmonic Patterns, Classical Price Action, Chart Patterns, Breakout Methodology, Mean Reversion, Supply/Demand, or any other) — future sprints, per ADR-006.
- **Any dependency, via `dependsOn`, on `WyckoffProvider` or `IctSmcProvider`.** This sprint's independence mandate, stated explicitly, test-verified (Scope item 10), not merely assumed.
- **Promotion of any reusable-seeming internal concept into the generic Analysis Provider Framework.** If a genuinely reusable abstraction emerges during implementation (analogous to S1-010's `DisplacementLeg`), it stays inside `providers/elliott-wave/`. Promotion into the shared framework is authorized only once multiple methodologies independently require the same abstraction, decided then via a dedicated ADR — never proactively, and never in this sprint.
- **The Confluence Engine, `normalize()`'s real vocabulary** — ADR-007, S1-012, unchanged.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-010 precedent exactly: this Provider is internal and composable only.
- **Trace Store persistence.** Carried forward again, unchanged, to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability). `ElliottWaveProvider` registers `ACTIVE` only; still genuinely open but non-blocking.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–11 as a new `apps/api/src/analysis-engine/providers/elliott-wave` module tree, registered into `analysis-engine.module.ts`'s `ANALYSIS_PROVIDERS` factory; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `SWING_DETECTOR` and `INDICATOR_ENGINE` (`fibonacciLevels()`, its first real Provider consumer) tokens — consumed, not modified.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `ElliottWaveProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- **S1-009's `WyckoffProvider` and S1-010's `IctSmcProvider` are explicitly not dependencies** — no `dependsOn` reference, no shared internal types or utilities imported from either Provider's own module directory.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own.
- **No new interpretation mechanism.** `ElliottWaveProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent an Elliott-specific output shape or a fifth Confidence kind. The invalidation level (Scope item 6) is disclosed as text content within these existing fields, not a new field.
- **Methodology independence is an architecture requirement, not a style preference.** No `dependsOn` entry references `'WYCKOFF'` or `'ICT_SMC'`; no source file under `providers/elliott-wave/` imports from `providers/wyckoff/` or `providers/ict-smc/`; verified mechanically by Scope item 10's boundary test.
- **No leakage into generic components.** No Elliott-Wave-specific vocabulary (wave, impulse, motive, corrective, or any synonym) appears anywhere in `analysis-provider.types.ts`, `provider-execution.service.ts`, `provider-topological-sort.util.ts`, `provider-circuit-breaker.ts`, `provider-health.util.ts`, `analysis-engine.module.ts`'s non-Provider-specific code, or `ObservabilityService`. Those remain generic forever.
- **No premature promotion.** Any internal concept this Provider introduces that might appear reusable across methodologies stays inside `providers/elliott-wave/` for this sprint; promotion into the generic framework requires a dedicated future ADR once multiple methodologies independently need it, per this Brief's Non-Scope.
- Per ADR-001, ADR-003, ADR-004, ADR-005: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/volume arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent.

---

# Acceptance Criteria

- `ElliottWaveProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'ELLIOTT_WAVE'`, with no `dependsOn` entry, and is the third entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear 5-wave impulse structure, the Provider identifies a wave count consistent with the Swing Detector's already-verified swings (no re-derivation of swing logic — composed, not duplicated).
- A dedicated unit test constructs a sequence that deterministically violates each of Rule 1, Rule 2, and Rule 3 individually, verifying the candidate is discarded (never returned as a low-confidence hypothesis) in each case; a separate test constructs a sequence satisfying all three Rules and confirms it survives.
- A dedicated unit test verifies Fibonacci-guideline scoring: a candidate whose Wave 2/Wave 4 retracements and Wave 3 extension land near the classic guideline ratios scores a higher Interpretation Confidence than an otherwise-valid (Rule-satisfying) candidate whose ratios land far from them.
- Phase/wave-count classification returns a bounded, disclosed-maximum `interpretation[]`; a test confirms more than one candidate is returned for a genuinely ambiguous constructed series (more than one Rule-satisfying candidate available), and exactly one for an unambiguous series.
- Every surviving hypothesis's summary/evidence content discloses a specific, computed invalidation level and the Rule it derives from — verified present and non-empty, never generic placeholder text.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected structure is higher when the Regime/Context Service reads `TRENDING` than when it reads `RANGING`; Methodology Confidence Ceiling reflects Elliott Wave's disclosed source-documented status (a specific, test-asserted value, independently calibrated from Wyckoff's `85` and ICT/SMC's `60`, not copied from either).
- A series with no valid, non-invalidated wave-count candidate produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual Swing Detector/Regime Context/Fibonacci calculator `computation`/`computationVersion` this Provider consumed.
- A golden-dataset/reference-example test reproduces at least one worked 5-wave impulse example from a named, cited source; any substitution for an unobtainable primary source is disclosed in the test file and completion report.
- The Independence Boundary Test (Scope item 10) passes, confirming zero references from `providers/elliott-wave/` to `providers/wyckoff/` or `providers/ict-smc/`.
- No Elliott-Wave-specific vocabulary appears in any generic framework file (Architecture Requirements' named list) — verified by direct grep during the Sprint Audit, the same method used at S1-010 closure.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-010 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Combinatorial-search risk.** A naive "try every possible 5-swing sub-sequence as a wave count" approach could scale poorly and violate the "unbounded search is not authorized" constraint. Mitigated by Scope item 3's bounded candidate-generation approach (a disclosed maximum number of starting offsets considered, not every mathematically possible sub-sequence).
- **Over-fitting to Fibonacci guidelines risk.** Elliott Wave's own literature is explicit that the Fibonacci ratios are guidelines, not rules — a design that silently promotes them to hard invalidation criteria would misrepresent the methodology and could discard genuinely valid counts that simply do not land on a "clean" ratio. Mitigated by Scope item 4's explicit, disclosed separation between Rule-based hard invalidation (Scope item 3) and Fibonacci-guideline soft scoring (never invalidation).
- **False-precision-of-invalidation risk.** Stating an invalidation level implies a confident, testable claim; an incorrectly-computed level would be worse than none at all, actively misleading a trader about their actual risk. Mitigated by deriving every invalidation level directly and only from the same Rule 1–3 arithmetic already used for candidate survival (Scope items 3, 6) — never a separately-estimated or heuristic value.
- **Premature-promotion risk** (this sprint's second explicitly named risk, per the Architecture Team's Implementation Guidance carried into this Brief from the S1-010 precedent): the temptation to generalize an Elliott-Wave-specific concept (e.g. a "labeled wave sequence" type) into the shared framework merely because it looks reusable. Mitigated by this Brief's own Architecture Requirements and Non-Scope: no promotion without a dedicated future ADR and multiple independently-requiring methodologies.
- **Multi-hypothesis bound calibration risk**, same category as Wyckoff's/ICT-SMC's (Known Limitations) — an unbounded candidate search is not authorized; the implementation-time bound chosen must be disclosed via Decision Log, not left as an undocumented magic number.
- **Source-fidelity risk**, distinct from both prior Providers': Elliott Wave has a genuine primary source (R.N. Elliott's own 1938 writings) unlike ICT/SMC, but that source is decades older and less immediately accessible than Wyckoff's more actively-maintained modern curriculum; the widely-cited Frost & Prechter secondary literature is the practical reference most implementations (including this one, if the primary cannot be independently obtained) actually cite. Mitigated by the same disclosed-fallback allowance and honest sourcing disclosure established at S1-007/S1-009/S1-010.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract proves insufficient to express a genuine wave-count finding or invalidation level without distortion (a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension unilaterally).
- Scope expansion is requested, including any request to implement corrective-wave counting, diagonal triangles, multi-degree labeling, another methodology Provider, an HTTP endpoint, Trace Store persistence, or any `dependsOn` linking this Provider to `WyckoffProvider`/`IctSmcProvider` (all explicitly Non-Scope).
- A genuinely reusable internal concept is discovered and there is a real temptation (or explicit request) to promote it into the generic framework before a second methodology independently requires it.
- A primary or well-established Elliott Wave source's worked example genuinely cannot be located after a documented attempt.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014 precedent — not requiring pre-approval:

- The maximum number of alternate wave-count hypotheses tracked in `interpretation[]`.
- The maximum number of candidate starting offsets considered during bounded candidate generation (Scope item 3).
- Exact Fibonacci-guideline proximity thresholds/scoring curve (Scope item 4).
- The exact Regime-Adjusted Confidence modulation magnitude for the TRENDING/RANGING interaction described in Scope item 7.
- The specific cited source for the golden-dataset conformance test, and any disclosed substitution.
- Methodology Confidence Ceiling's exact value for `'ELLIOTT_WAVE'`.
- `computationVersion` numbering for `ElliottWaveProvider` (same semantic-versioning-from-`1.0.0` convention as prior Providers).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved on the basis that the independent self-audit found no Critical findings and the SLOW tier classification, Rule-based invalidation, Fibonacci-as-guideline-only scoring, bounded multi-hypothesis design, and explicit invalidation disclosure were each accepted as proposed. This Sprint Brief is valid for implementation per Constitution Rule 2, pending the S1-011 Task Breakdown's own review and approval.

**Architecture Team Implementation Guidance #5 (binding direction for this Sprint, additive to — not a revision of — the Scope above):**

Elliott Wave is inherently probabilistic. The Provider must never present its primary hypothesis as absolute certainty. Every surviving hypothesis must clearly expose: why it currently survives (its Rule-conformance and Fibonacci-guideline basis), what weakens it (any guideline it fails to meet cleanly, or any Rule it survives only narrowly), and what future market behaviour would invalidate it (Scope item 6's disclosed invalidation level). This guidance introduces no new probability model — its purpose is transparency: Zenith explains uncertainty rather than concealing it. Implemented as an explicit, three-part structure within each hypothesis's disclosed text content (Scope items 6–7), not a new contract field.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-13
- **Completion Report:** `documentation/ai/S1-011_COMPLETION_REPORT.md` (AI-028)
- **Final Implementation Commits:** `fce7621` (Sprint Brief draft), `74ca7cf` (Sprint Brief approval + Task Breakdown draft), `64c3e93` (WP1-WP12: full `ElliottWaveProvider` implementation, module registration, full monorepo verification)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`)
- **Related Decisions:** DEC-2026-015 (event-detection thresholds, golden-dataset sourcing, Methodology Confidence Ceiling, and the Fibonacci-guideline reuse design)

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations — including the Elliott Wave bounded-multi-hypothesis and slow-tier citations this Brief builds directly from)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Indicator Engine/Swing Detection this Provider consumes, including the first real use of `fibonacciLevels()`)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md` (prior Providers — structural precedent for process only, per this sprint's independence mandate)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
