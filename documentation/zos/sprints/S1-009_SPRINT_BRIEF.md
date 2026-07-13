# S1-009 SPRINT BRIEF — Wyckoff Method Analysis Provider

**Document ID:** ZOS-S1-009
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-009
- **Sprint Name:** Wyckoff Method Analysis Provider
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007_SPRINT_BRIEF.md`/`S1-008_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — see Approval Section)

---

# Sprint Objective

S1-007 built the shared computation substrate (Indicator Engine, Swing Detection, Regime/Context Service); S1-008 built the Analysis Provider Framework these will plug into, with zero real Providers registered. **S1-009 registers the first one.** Per ADR-006's own text ("every future Provider sprint, S1-009 onward"), and the Architecture Team's selection: the Wyckoff Method — the price-structure methodology VSA is already declared as depending on (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, "Analysis Provider Framework" — Dependency declaration), and one of the source-verified methodologies the architecture document itself names as carrying a *higher* Methodology Confidence Ceiling than ICT/SMC specifically ("Wyckoff's Three Laws," alongside Dow Theory and classical indicators — Confidence Model, Known Limitations; the document does not rank Wyckoff above every other candidate methodology, only above ICT/SMC by name).

This sprint is the first place engineering correctness and trader value are inseparable: Wyckoff's entire premise is that price and volume leave a legible record of institutional (the "Composite Man") accumulation and distribution *before* the resulting move — a trader reads structure to understand what large operators are likely doing, not to chase a lagging signal. A Provider that gets the schematic's sequencing wrong, or presents Phase C's Spring as more certain than it genuinely is, would actively mislead a trader at exactly the moment they need honest uncertainty most. Source fidelity here is not academic — it is the difference between a tool a trader can trust and one that quietly turns Wyckoff's own analytical discipline into a black box, exactly what Zenith exists not to be.

---

# Scope

Per ADR-006 (contract mechanics — not repeated here) and the Extension Guidelines' "New Analysis Provider" requirements:

1. **`WyckoffProvider`** — a concrete `AnalysisProvider` (S1-008), registered `ACTIVE`, tier `SLOW` (its phase-schematic reading is a bounded multi-hypothesis search, the same category as Elliott Wave — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Known Limitations), `methodologyFamily: 'WYCKOFF'`, consuming `INDICATOR_ENGINE`, `SWING_DETECTOR`, and `REGIME_CONTEXT` (S1-007, via normal constructor injection — this is a Provider consuming shared computation, not a Provider-to-Provider `dependsOn` declaration) over a `MarketSeries`. Registered as the **first non-empty entry** in `ANALYSIS_PROVIDERS`.
2. **Trading range identification.** Using the Swing Detector's swing highs/lows and structure events (BOS/CHoCH) plus the Regime/Context Service's `trendState`, identify a candidate accumulation or distribution range (a bounded price zone with a defined support/resistance floor and ceiling) within the supplied series. A range is the structural anchor every event below is detected relative to.
3. **Wyckoff Schematic #1 event detection**, symmetric for Accumulation and Distribution — the single canonical schematic per side (not every documented variant; see Non-Scope), each event a fully-specified, deterministic rule against price (and, only where the event is intrinsically volume-defined — see item 4) `Candle.volume`:
   - Accumulation: **PS** (Preliminary Support), **SC** (Selling Climax), **AR** (Automatic Rally), **ST** (Secondary Test — retests the SC low, within Phase A/B), **Spring** (a shakeout below the SC/range low with quick reversal, Phase C), **Test** (of the Spring — a distinct, later retest confirming the Spring's low holds, also Phase C; not a duplicate of ST above — Wyckoff's own vocabulary genuinely uses "test" at more than one distinct schematic point, and this Brief's use of both is intentional, not a copy-paste artifact), **SOS** (Sign of Strength), **LPS** (Last Point of Support).
   - Distribution: **PSY** (Preliminary Supply), **BC** (Buying Climax), **AR** (Automatic Reaction), **ST**, **UT/UTAD** (Upthrust / Upthrust After Distribution — the mirror of Spring), **Test**, **SOW** (Sign of Weakness), **LPSY** (Last Point of Supply).
4. **Deliberate, disclosed volume boundary.** Wyckoff's own "Effort vs. Result" law is intrinsically volume-based, and `Climax` events (SC/BC) are classically defined partly by a volume spike — `Candle.volume` is used only for this narrow, well-established purpose. Bar-by-bar effort/result scoring across an entire series, "no demand"/"no supply" bar classification, and any other Volume Spread Analysis concept remain **VSA's job** (a future Provider, already declared in the architecture as depending on this Provider's active-range output) — not silently absorbed here. This boundary is enforced primarily by scope discipline in code review (there is no fully mechanical way to detect "too much volume reasoning"), supplemented by a lightweight keyword-boundary test — analogous in spirit to, but far weaker than, the Anti-Corruption boundary test — that flags literal VSA-specific terms ("no demand," "no supply," "stopping volume," "effort vs. result score") appearing in the Wyckoff Provider's own source, as an early warning, not a guarantee.
5. **Phase classification (A–E)** derived from the detected event sequence, per the modern Wyckoff Method curriculum's standard schematic (Wyckoff Associates / Stock Market Institute course materials, as popularized by Hank Pruden and others) — **attributed as such, distinctly from Wyckoff's own original Three Laws** (Supply & Demand, Cause & Effect, Effort & Result), which are Wyckoff's own writing. This mirrors the MACD line (Appel)/histogram (Aspray) attribution precedent from S1-007 — two genuinely different sources for two genuinely different parts of the same output, never presented as one undifferentiated "Wyckoff says."
6. **Bounded multi-hypothesis `interpretation[]`.** Where the detected event sequence is genuinely ambiguous (most commonly: has price only reached Phase B/early C, where a Spring is not yet confirmable), return more than one ranked candidate phase reading rather than forcing a single guess. The maximum number of candidate hypotheses tracked is a Decision Log item at implementation time (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Known Limitations), not fixed by this Brief.
7. **Full Confidence taxonomy** (S1-008): Detection Confidence (how cleanly the range/event fits its defining criteria), Interpretation Confidence (ranks each phase hypothesis), Regime-Adjusted Confidence (scaled down when the Regime/Context Service reads `TRENDING` — range-based phase analysis is a ranging-market technique, and Confidence must say so rather than silently staying high), and Methodology Confidence Ceiling (reflecting Wyckoff's own source-verified status — one of the methodologies the architecture document itself names as carrying a *higher* ceiling than ICT/SMC specifically, per the Sprint Objective's citation above).
8. **Populated `Limitations`, never a thrown exception**, when no candidate range can be identified (e.g. insufficient bars, or a genuinely trending series with no range to read) — per ADR-006, exactly the same discipline as every other component in this system.
9. **Real `Traceability`**, referencing the actual Indicator Engine/Swing Detector/Regime Context outputs consumed (their `computationVersion`s included) — the first Provider to populate this contract field with genuine content rather than a fixture stub.
10. **Golden-dataset / reference-example conformance testing**, per the Extension Guidelines' "New Analysis Provider" requirement: a worked schematic example matched against a primary or well-established secondary Wyckoff Method source (e.g. the Wyckoff Stock Market Institute course material, or a widely-cited annotated chart from Pruden's or David Weis's published work), with the same disclosed-fallback allowance established at S1-007 if the specific cited source cannot be independently obtained in this implementation environment — named and reasoned in the test file and completion report, never silent.

---

# Non-Scope

Explicitly excluded, per ADR-006, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **VSA (Volume Spread Analysis)** — a separate future Provider, already declared in the architecture as depending on this Provider's active-range output (`dependsOn`, by stable id, once it exists). This sprint does not build VSA and does not need to solve *how* VSA will read Wyckoff's range/event data at runtime beyond the standard `AnalysisProviderResult` contract (`evidence`/`interpretation`/`traceability`) — that is whichever future sprint builds VSA's own problem to solve, escalating then if the generic contract proves insufficient (see Risks).
- **Any other methodology Provider** (ICT/SMC, Elliott Wave, Harmonic Patterns, Classical Price Action, Chart Patterns, Breakout Methodology, Mean Reversion, or any other) — future sprints, per ADR-006.
- **Every documented Wyckoff schematic variant** — Accumulation/Distribution Schematic #2, re-accumulation/re-distribution, and other advanced variants are excluded; this sprint implements the single canonical Schematic #1 per side.
- **Point & Figure counting** (Wyckoff's own Cause & Effect measuring technique). Unlike VWAP/Volume Profile, this is **not** architecturally blocked by the daily-`Candle`-only model — a P&F chart can, in principle, be constructed from existing daily closes via a box-size/reversal-amount conversion, with no new raw-data category required. Its exclusion here is a **scope/complexity decision** (a full P&F construction-and-counting engine is a substantial undertaking of its own), not an architectural limitation, and must not be conflated with the genuinely-blocked items above.
- **The Confluence Engine, `normalize()`'s real vocabulary** — ADR-007, S1-012, unchanged.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing S1-007/S1-008's precedent exactly: this Provider is internal and composable only. No Consumer (Dashboard, Alerts) exists yet to hold a cross-request reference to a result.
- **Trace Store persistence.** For the same reason as the above: `S1-008_SPRINT_BRIEF.md`'s approved Decision #3 deferred persistence to "whichever of S1-009 or S1-012 first needs to retain a trace beyond a single request/response" — since this sprint introduces no Consumer that holds such a reference, it still does not need it. This flag is carried forward again to whichever sprint introduces the first Consumer.
- **Resolving Finding B** (`DEPRECATED` Provider `computationVersion` mutability) — `WyckoffProvider` registers `ACTIVE` only; no Lifecycle transition occurs in this sprint, so Finding B remains genuinely open but non-blocking, exactly as flagged at S1-008 closure.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–10 as a new `apps/api/src/analysis-engine/providers/wyckoff` module tree, registered into `ProvidersModule`'s `ANALYSIS_PROVIDERS` factory (the only component affected is `apps/api`); a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` tokens — consumed, not modified.
- S1-008's `AnalysisProvider` contract and `ProviderExecutionEngine` — consumed, not modified; `WyckoffProvider` is added to `ANALYSIS_PROVIDERS` without touching the Execution Engine itself.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies for a Provider — no deviation, no addition, no reinterpretation.
- Consumed via NestJS module registration only (added to the `ANALYSIS_PROVIDERS` factory's `inject`/return array) — never a new injection token of its own, since Providers are consumed as an array, not individually, per ADR-006.
- **No new interpretation mechanism.** `WyckoffProvider` uses exactly the contract fields ADR-006 already defines (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds) — it does not invent a Wyckoff-specific output shape or a fifth Confidence kind.
- Per ADR-001, ADR-003, ADR-004, ADR-005: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/volume arithmetic uses `Prisma.Decimal`, consistent with DEC-2026-005/S1-007 precedent.

---

# Acceptance Criteria

- `WyckoffProvider` implements the full `AnalysisProvider` interface (S1-008), registered `ACTIVE`/`SLOW`/`methodologyFamily: 'WYCKOFF'`, and is the first non-empty entry in `ANALYSIS_PROVIDERS` in production.
- Given a constructed price series with a clear accumulation-like structure, the Provider identifies a trading range consistent with the Swing Detector's already-verified swing highs/lows (no re-derivation of swing logic — composed, not duplicated).
- Each of the eight Accumulation events (PS, SC, AR, ST, Spring, Test, SOS, LPS) and eight Distribution events (PSY, BC, AR, ST, UT/UTAD, Test, SOW, LPSY) is verified by a dedicated unit test constructing a price (and, for SC/BC only, volume) sequence that deterministically triggers that specific event and no other.
- Phase classification returns a bounded, disclosed-maximum `interpretation[]`, each entry carrying its own ranked Interpretation Confidence; a test confirms more than one candidate is returned for a genuinely ambiguous (early Phase B/C) constructed series, and exactly one for an unambiguous, fully-formed schematic.
- All four Confidence kinds are present and correctly labeled on every output; a test confirms Regime-Adjusted Confidence for an identical detected structure is lower when the Regime/Context Service reads `TRENDING` than when it reads `RANGING`; Methodology Confidence Ceiling reflects Wyckoff's disclosed source-verified status (a specific, test-asserted value or floor, not left implicit).
- A series with no identifiable range (e.g. too few bars, or a clean uninterrupted trend) produces a populated `Limitations` entry, verified never to throw.
- `Traceability` output references the actual `computation`/`computationVersion` of every Indicator Engine/Swing Detector/Regime Context call the Provider made — verified present and non-empty on a representative successful run.
- A golden-dataset/reference-example test reproduces at least one worked Wyckoff schematic example (Accumulation or Distribution) from a named, cited source; any substitution for an unobtainable primary source is disclosed in the test file and completion report, per the S1-007 precedent.
- The Phase-classification attribution (modern Wyckoff Method curriculum) is recorded distinctly from Wyckoff's own Three Laws attribution in code/documentation — never presented as one undifferentiated "Wyckoff says."
- A lightweight keyword-boundary test flags literal VSA-specific terminology ("no demand," "no supply," "stopping volume," "effort vs. result score") appearing anywhere in the Wyckoff Provider's own source, as an early warning against scope creep into VSA's territory (Scope item 4) — not a substitute for code-review judgment, but a real, running check.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-008 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Source-fidelity risk (highest risk in this sprint).** Wyckoff's own Three Laws and range/cause-effect concepts (1930s) are genuinely distinct from the modern Phase A–E schematic terminology (a later synthesis by his followers/the Stock Market Institute curriculum). Conflating the two — presenting the Phase-schematic diagram as if Wyckoff himself wrote it in those exact terms — would be a real source-fidelity failure of the kind this entire architecture exists to prevent. Mitigated by the explicit, separate attribution requirement in Scope item 5 and Acceptance Criteria.
- **Overreach into VSA's territory risk.** Wyckoff's "Effort vs. Result" law is intrinsically volume-based, creating a real temptation to build more volume analysis than this sprint's scope allows, since `Candle.volume` is already available (not architecturally blocked, unlike VWAP). Mitigated by the deliberate, disclosed volume boundary in Scope item 4: primarily code-review judgment (there is no fully mechanical way to detect "too much volume reasoning"), supplemented by a lightweight keyword-boundary test as an early warning, not a guarantee.
- **Premature confidence risk.** A Spring is, by Wyckoff's own teaching, only confirmable in hindsight once price fails to make a new low and reverses — presenting a not-yet-confirmed Spring candidate with unwarranted confidence would recreate exactly the false-certainty problem the four-part Confidence taxonomy and multi-hypothesis `interpretation[]` exist to prevent. Mitigated by Scope item 6 and its Acceptance Criteria (ambiguous sequences must return more than one ranked candidate, never a single forced guess).
- **VSA's future data-access need, not yet solved.** If VSA (a future sprint) finds the generic `AnalysisProviderResult` contract (`evidence`/`traceability` as free-text/structured-but-generic fields) insufficient to reliably locate "the current active range" without brittle string-parsing, that sprint may need to propose a small, additive contract extension (e.g. a documented, optional structured-data field) — an architectural question for that future sprint to raise, not a blocker for this one, since VSA does not exist yet.
- **Multi-hypothesis bound calibration risk**, same category as Elliott Wave's (Known Limitations) — an unbounded phase-hypothesis search is not authorized; the implementation-time bound chosen must be disclosed via Decision Log, not left as an undocumented magic number.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- The generic `AnalysisProviderResult` contract proves insufficient to express a genuine Wyckoff event/range finding without distortion (this would be a real architectural gap, not a calibration choice — escalate rather than inventing a Provider-specific contract extension unilaterally).
- Scope expansion is requested, including any request to implement VSA, another methodology Provider, an HTTP endpoint, or Trace Store persistence (all explicitly Non-Scope).
- A primary Wyckoff Method source's worked example genuinely cannot be located after a documented attempt (see Golden-Dataset risk, S1-007 precedent).

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012 precedent — not requiring pre-approval:

- The maximum number of alternate phase-hypotheses tracked in `interpretation[]` (Known Limitations, explicitly flagged as a Decision Log item).
- Exact numeric thresholds for each event's detection rule (e.g. how large a volume increase counts as "climactic," how many bars a Secondary Test may occur within, how far below the range a Spring may undercut before it is instead classified as a genuine breakdown).
- The specific cited source for the golden-dataset conformance test, and any disclosed substitution.
- Methodology Confidence Ceiling's exact value/floor for `'WYCKOFF'`.
- `computationVersion` numbering for `WyckoffProvider` (same semantic-versioning-from-`1.0.0` convention as S1-007/S1-008).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved on the basis that the independent audit found no Critical findings and all four Recommended fixes were applied. This Sprint Brief is valid for implementation per Constitution Rule 2, pending the S1-009 Task Breakdown's own review and approval.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-13
- **Completion Report:** `documentation/ai/S1-009_COMPLETION_REPORT.md` (AI-024)
- **Final Implementation Commits:** `bd2932c` (WP1 skeleton), `c1f505d` (WP2 range), `19b39ed` (WP2 self-review fix), `6b4dff1` (WP3 Accumulation), `5c60580` (WP4 Distribution + volume boundary), `77364b5` (WP5 Phase classification), `5af8d4a` (WP6 self-review fix — regime gating), `7c4d92e` (WP6 self-review fix — generic Confidence contract), `e7bc6c9` (WP6 Confidence + analyze() assembly), `ca28e53` (WP7 Limitations), `fce4e21` (WP8 Traceability), `5c45eb2` (WP9 module registration), `1943bfc` (WP10 golden-dataset), `de9c12a` (WP12 audit fix)
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`)
- **Related Decisions:** DEC-2026-013 (event-detection thresholds, golden-dataset sourcing, Methodology Confidence Ceiling, and the generic four-part Confidence contract completion)

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Confidence Model, Extension Guidelines, Known Limitations, Additional Findings)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (Indicator Engine/Swing Detection/Regime Context this Provider consumes)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this Provider registers into)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
