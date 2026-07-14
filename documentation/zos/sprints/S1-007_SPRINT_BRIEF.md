# S1-007 SPRINT BRIEF — Analysis Engine Foundation: Indicator Engine, Swing Detection & Regime/Context Service

**Document ID:** ZOS-S1-007
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-007
- **Sprint Name:** Analysis Engine Foundation — Indicator Engine, Swing Detection Infrastructure & Regime/Context Service
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`). `08_ROADMAP.md` does not itself name "Analysis Engine" as a designated sub-phase; this sprint is the Implementation Engineer's placement of that work under M1's existing **Trading domain** planned focus area, not an asserted roadmap update. A formal roadmap update naming the Analysis Engine work stream, if desired, remains an Architecture-Team-only action per `08_ROADMAP.md`'s Planning Rules.
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team (2026-07-12 — see Approval Section)

---

# Sprint Objective

S1-001 through S1-006 built Zenith's trading-data foundation and its first layer of decision-relevant information (Trading Analytics). The Analysis Engine is the next evolution: a subsystem that will eventually turn raw price/volume data into explainable, deterministic, source-faithful trading evidence across many methodologies (Wyckoff, ICT, Elliott Wave, Harmonic Patterns, and others), never a black box and never a BUY/SELL recommendation. That full system was designed across an extensive architecture research and validation process, resulting in `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` and ADR-005/006/007.

This sprint builds none of those future Analysis Providers. It builds only the shared, deterministic computation infrastructure every one of them will depend on — per ADR-005: the **Indicator Engine** (published, formula-defined indicators — SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX, a Fibonacci ratio calculator, a Donchian channel calculator), the **Swing Detection Infrastructure** (a shared swing/pivot detector needed by roughly 12 of the ~13 methodology families identified during research), and the **Regime/Context Service** (a shared trend/volatility regime read). It also builds the **Anti-Corruption Layer** (`MarketSeries`/`PriceSeries`) that keeps these services decoupled from the Market Data domain's own persistence entities, per the Final Architecture Validation's resolved findings.

**Why this matters, even with no user-facing output yet:** every subsequent Analysis Engine sprint (S1-008 onward) depends on this infrastructure being correct, source-faithful, and stable *before* any interpretation logic is built on top of it. Getting Wilder's RSI smoothing, MACD's line/histogram attribution, or swing-detection point-in-time-safety wrong here would silently propagate into every future Provider. This sprint's entire value is in being the single, trustworthy source of truth those Providers will never need to question or reimplement.

**Why this sprint has no HTTP endpoint or trader-visible output:** per ADR-005 and ADR-006, interpretation (Evidence, Confidence, Traceability as a trader-facing concept) is the Analysis Provider Framework's job (S1-008), not this sprint's. S1-007 produces internal, composable services only. This is a deliberate, disclosed characteristic of this sprint, not an oversight.

---

# Scope

Per `22_ANALYSIS_ENGINE_ARCHITECTURE.md` and ADR-005 (`12_ADR_INDEX.md`), S1-007 is scoped to shared deterministic computation infrastructure only:

### 1. Anti-Corruption Layer — `MarketSeries` / `PriceSeries`
- A value object owned by the Analysis Engine, translated from `Candle`/`MarketQuote` by a thin adapter that is the *only* place in the Analysis Engine permitted to reference `Candle`/`MarketQuote` types.
- Carries **both** normalized OHLCV data (`timestamp`, `open`, `high`, `low`, `close`, `volume`) **and** Data Quality metadata (`freshness`: FRESH/STALE/MISSING, and age), computed from `fetchedAt` using the existing 5-minute staleness threshold (DEC-2026-009) — per the resolved Additional Finding A in `22_ANALYSIS_ENGINE_ARCHITECTURE.md`.
- **`MarketSeries`'s historical points (translated from `Candle` rows) and its current-quote point (translated from `MarketQuote`) carry Data Quality with different meanings, and this sprint's implementation must keep them distinct rather than applying one uniform notion of "freshness" to both:** a historical `Candle`-derived point's Data Quality reflects *completeness* (`MISSING` only for an absent bar in the requested range — a historical bar is never `STALE`, since staleness is a recency concept that does not apply to a fixed past bar); the current-quote point's Data Quality reflects genuine *recency* (`FRESH`/`STALE`/`MISSING` computed from `fetchedAt` against the DEC-2026-009 threshold, exactly as `MarketQuote` already behaves today). The current quote is represented as a distinct, clearly-marked trailing point on the series, not silently merged into the historical OHLCV points with a borrowed staleness meaning.
- The adapter composes the existing `MarketDataService` (`getQuote`/`getCandles`) rather than duplicating its caching, rate-limiting, or retry logic.
- **Cache scope, clarified:** the `(computation, parameters, instrument, data-range)` cache required in items 2–4 below applies to Indicator/Swing/Regime *outputs*, not to the `MarketSeries` translation step itself. Within a single computation request, `MarketSeries` translation for a given `(instrument, timeframe, data-range)` is performed once and shared across every Indicator/Swing/Regime call made within that request, rather than re-translated per call — a request-scoped sharing behavior, not an additional persistent cache layer. `MarketDataService`'s own existing caching of `Candle`/`MarketQuote` rows (S1-005) is unaffected and unduplicated.

### 2. Indicator Engine
- SMA, EMA, RSI, MACD (`line` and `histogram` tracked as separately source-attributed outputs — Appel, 1970s, for the line; Aspray, 1986, for the histogram), Bollinger Bands, ATR, ADX, a Fibonacci ratio calculator, a Donchian channel calculator.
- RSI, ATR, and ADX use J. Welles Wilder Jr.'s original recursive smoothing method exactly as published (1978) — not a plain EMA/SMA approximation.
- Implemented as an internal registry of individual indicator calculators (not one monolithic service class), consumed only via interface/injection token.
- Every output carries mandatory computation metadata (parameters used, formula/source citation, input data range, computation timestamp, intermediate values where applicable — e.g. Wilder's smoothed average before the final RSI ratio) and a `computationVersion`.
- Results are cached by `(indicator, parameters, instrument, data-range)`.

### 3. Swing Detection Infrastructure
- A single, parameterized swing/pivot detector (disclosed, never-silently-defaulted sensitivity), producing Market Structure primitives (swing sequence, BOS/CHoCH) directly.
- **Point-in-time deterministic:** a swing is confirmed only once enough subsequent bars exist under the fixed sensitivity rule, identically in live execution and in any future backtested replay — a swing must never be "seen" before it would genuinely have been confirmable in real time.
- Cached by `(instrument, timeframe, sensitivity)`; new bars may retroactively revise only the most recent unconfirmed swings.
- Every output carries the same mandatory computation metadata and `computationVersion` requirement as the Indicator Engine.

### 4. Regime / Context Service
- Composes Indicator Engine (ADX, ATR) and Swing Detection (Market Structure) output into a single, versioned trend/volatility regime read (trending/ranging; volatility state).
- Point-in-time deterministic, for the same reason as Swing Detection.
- Every output carries mandatory computation metadata and `computationVersion`.
- Threshold calibration (ADX trending cutoff, ATR volatility percentile) is **not** fixed by this sprint — see Missing Decisions.

### 5. Golden-Dataset / Reference-Dataset Conformance Testing
- **A worked reference example from the cited primary source itself (Wilder, 1978, for RSI/ATR/ADX; Appel/Aspray for MACD; Bollinger for Bollinger Bands) is mandatory wherever that primary source is genuinely obtainable.** Substituting a secondary source is authorized only when the primary text's own worked example cannot be obtained after a documented attempt, and any such substitution must name the secondary source used and the reason the primary source was unavailable, disclosed in the test file and the completion report — never a silent or default choice. Per the Extension Guidelines requirement in `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, which does not authorize secondary-source substitution at all; this Brief's disclosed-fallback allowance is a sprint-level accommodation for practical sourcing constraints, not a relaxation of the architecture document's own standard.
- Swing Detection and Regime/Context Service ship with equivalent hand-computed/reference verification given their more structural (less formula-literature-bound) nature.

### 6. Observability
- Per-computation **latency** and **cache hit ratio** are observable for every Indicator, the Swing Detector, and the Regime/Context Service, per "Operational Resilience & Observability" in `22_ANALYSIS_ENGINE_ARCHITECTURE.md` (which itself scopes "failure rate" to Provider-level components introduced by ADR-006 at S1-008, not to this sprint's pure computations).
- In place of a "failure rate" metric — not a meaningful concept for a deterministic pure function that cannot fail on valid input — this sprint observes a **computation rejection rate**: the rate at which a computation declines to produce a result because its input was insufficient or invalid (e.g. fewer bars than a given indicator's period requires, or a data-range gap the Swing Detector cannot confirm a swing within). A rejection is an expected, correctly-handled outcome, not a bug; an unhandled exception is separately and always a defect, never an accepted operational metric.
- This sprint uses the existing Pino structured-logging mechanism (per `04_TECH_STACK.md`) as the observability channel for both metrics above — no new metrics/tracing dependency is introduced.

### 7. Quality and Governance Requirements (apply to all of the above)
- Full unit test coverage matching the rigor of S1-001 through S1-006, including the golden-dataset conformance tests in item 5.
- All numeric computation uses `Prisma.Decimal` where it touches persisted financial/price data (consistent with DEC-2026-005); pure-math intermediate steps may use native numeric types where `Decimal` would add no correctness value, disclosed in code comments where relevant.
- Full regression against S1-001 through S1-006.
- No HTTP endpoint, no Swagger surface, no Zod request-validation schema is introduced by this sprint — there is no external request shape to validate, since nothing in this sprint is called directly by a trader-facing route.

---

# Non-Scope

Explicitly excluded from S1-007, per `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005, and ADR-006/007:

- **Any Analysis Provider** (Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, Classical Price Action, Chart Patterns, Breakout Methodology, Mean Reversion, or any other methodology) — these begin at S1-008 onward.
- **The Analysis Provider Framework itself** (the plugin registry, the `AnalysisProvider` interface, the Evidence/Interpretation/Limitations contract, Provider dependency resolution, fast/slow-tier execution, the Provider circuit breaker, `methodologyFamily`) — this is ADR-006's scope, S1-008.
- **The Confluence Engine** (normalization consumption, `ConfluenceWeightStrategy`, `weightExplanation`, dimension-level disagreement explanation) — this is ADR-007's scope, S1-012.
- **Any HTTP endpoint, controller, or trader-visible output.** This sprint's services are internal and composable only.
- **VWAP, Volume Profile, Session Analysis, or true intraday Multi-Timeframe Analysis** — architecturally blocked by the current daily-only `Candle` model; excluded here and from every currently-planned Analysis Engine sprint.
- **Any new Prisma model.** This sprint is pure computation over already-persisted `Candle`/`MarketQuote` data, translated through the Anti-Corruption Layer.
- **Any mutation of financial or market data.** All new code is read-only.
- **Trace Store implementation** (retention/TTL/lifecycle mechanics) — this becomes relevant once Providers exist and produce Traceability records to store (S1-008/S1-012); this sprint's computation-metadata output is the raw material for that later store, not the store itself.

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, or ADR-005/006/007 beyond what those documents already specify.
- Any technology not listed in `04_TECH_STACK.md` or an existing ADR.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.
- Any new ADR (ADR-005 already covers this sprint's full scope).

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the seven in-scope items above, as a new, self-contained `apps/api/src/analysis-engine` module tree (Anti-Corruption Layer, Indicator Engine, Swing Detection Infrastructure, Regime/Context Service), composing the existing `MarketDataService` rather than duplicating its logic.
- Updated documentation where required (e.g. recording the Decision Log entries anticipated in Missing Decisions, once implementation fixes their values).
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** the Analysis Engine has a single, trustworthy, source-faithful computational substrate — indicators, swing points, and regime classification — that every future Analysis Provider can consume without ever needing to reimplement or second-guess it. The technical criteria below are how that outcome is verified.
- RSI, ATR, and ADX are verified against a worked reference example from Wilder's own 1978 text, mandatory whenever that text is obtainable; a disclosed, named secondary-source substitution is permitted only on documented primary-source unavailability. Either way, the test confirms Wilder's specific smoothing method is used, not a plain EMA/SMA approximation.
- MACD's `line` and `histogram` are verified against a known reference example, with the histogram's 1986 Aspray attribution recorded distinctly from the line's Appel attribution in computation metadata.
- SMA, EMA, Bollinger Bands, the Fibonacci ratio calculator, and the Donchian channel calculator are verified against hand-computed expected values.
- Every Indicator Engine, Swing Detector, and Regime/Context Service output includes computation metadata (parameters, formula/source citation, input data range, computation timestamp, intermediate values where applicable) and a `computationVersion`, verified present on every output, not just the "happy path."
- Swing Detection produces correct swing sequences and BOS/CHoCH given a disclosed sensitivity parameter; point-in-time determinism is verified by a test replaying historical bars sequentially and confirming no swing is confirmed earlier than it would have been confirmable live.
- Regime/Context Service correctly classifies trending vs. ranging and volatility state from ADX/ATR/Structure inputs, with computation metadata and `computationVersion` present.
- `MarketSeries`/`PriceSeries` correctly carries forward both OHLCV data and Data Quality (`freshness`, age) from `Candle`/`MarketQuote`; verified that no code outside the translation adapter imports `Candle` or `MarketQuote` Prisma types.
- Historical (`Candle`-derived) points never report `STALE`, only `FRESH`-equivalent-or-`MISSING` (completeness), while the distinct current-quote point correctly reports genuine `FRESH`/`STALE`/`MISSING` recency — verified by a test asserting a historical point's Data Quality is unaffected by its age, while an old (unrefreshed) current quote is correctly marked `STALE`.
- Shared caching, keyed by `(computation, parameters, instrument, data-range)`, is verified functioning: identical repeated calls do not recompute; differing parameters correctly bypass the cache.
- Per-computation latency, cache hit ratio, and computation rejection rate (insufficient/invalid input, distinct from an unhandled exception) are observable via structured logging for every Indicator, the Swing Detector, and the Regime/Context Service.
- No HTTP endpoint, controller, or Swagger surface is introduced.
- No new Prisma model is introduced.
- No new runtime dependency is introduced.
- All S1-001 through S1-006 acceptance criteria continue to pass — no regression.
- New code has full unit test coverage across all items above, including the golden-dataset conformance tests.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated to reflect the sprint's closure, and the sprint has been formally closed. Per this Brief's explicit Approval Section, implementation may not begin until this Brief is marked Approved by the Architecture Team.

---

# Dependencies

- `MarketDataService` (S1-005) — already exported from `MarketDataModule`; consumed, not modified, by the Anti-Corruption Layer's translation adapter.
- No new PostgreSQL schema — this sprint targets **zero new Prisma models**.
- No new runtime or development dependency is anticipated — per ADR-005's Consequences, this is pure TypeScript computation within the existing NestJS stack.
- No external network dependency beyond what `MarketDataService` already uses.

---

# Architecture Requirements

- Implements exactly what `22_ANALYSIS_ENGINE_ARCHITECTURE.md` and ADR-005 specify — no deviation, no addition, no reinterpretation.
- **Token-based dependency injection only.** The Indicator Engine, Swing Detector, and Regime/Context Service are each consumed via an interface/injection token, following the `MARKET_DATA_PROVIDER` precedent of ADR-003 — never via direct instantiation or concrete-class import.
- **The Anti-Corruption Layer's translation adapter is the only code in the Analysis Engine permitted to reference `Candle`/`MarketQuote` Prisma types.** Every other component (Indicator Engine, Swing Detector, Regime/Context Service) consumes `MarketSeries` only.
- **`computationVersion` is mandatory on every output**, distinct from `contractVersion` (which does not apply yet — `contractVersion` is an Analysis Provider Framework concept introduced by ADR-006 at S1-008, not a concern of this sprint's services).
- **No interpretation.** These services return values and computation metadata only — no Evidence, no Confidence, no trading language, no scores. Interpretation is exclusively the Analysis Provider Framework's responsibility (ADR-006, S1-008).
- **One-way dependency, preserved.** The Analysis Engine depends on `MarketDataService`; `MarketDataService` and the Market Data domain have zero knowledge of the Analysis Engine, preserving ADR-003's provider-abstraction isolation exactly as it exists today, and mirroring the same one-way dependency principle already established for the Analytics module in S1-006.
- Per ADR-001, ADR-003, ADR-004: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope. No human engineer is separately assigned for this sprint; this does not alter the approval, escalation, or review requirements below.

---

# Risks

- **Wilder-smoothing correctness risk.** The most common documented implementation error for RSI/ATR/ADX is silently substituting a plain EMA/SMA for Wilder's specific recursive smoothing. Mitigated by the mandatory golden-dataset conformance test against Wilder's own published example.
- **Golden-dataset sourcing risk.** Primary-source worked examples (Wilder, Appel, Bollinger) are mandatory whenever obtainable; only a documented, disclosed inability to obtain the primary source authorizes a named secondary substitution, and this must never be a silent or default choice. This risk is mitigated by an explicit disclosure requirement in both the test file and the completion report, not left to implementer discretion.
- **Point-in-time determinism risk.** Swing-detection retroactive revision (of only the most recent unconfirmed swings) is a subtle mechanism to get right; an off-by-one in "how many subsequent bars are enough to confirm" could silently leak future information into a historical replay, undermining the Backtesting guarantee this sprint exists partly to protect.
- **Scope-creep risk.** This sprint has no trader-visible output, which creates a natural temptation to "prove it end-to-end" with a trivial Provider or endpoint. That is explicitly S1-008's job (a trivial reference Provider proving the framework), not this sprint's — see Non-Scope.
- **Anti-Corruption Layer completeness risk.** This is the first implementation of `MarketSeries`; missing the Data Quality propagation requirement (already resolved as Additional Finding A) or the "no other code touches `Candle`/`MarketQuote`" constraint would reintroduce exactly the coupling this sprint exists to prevent. Mitigated by an explicit acceptance criterion checking for stray Prisma-type imports outside the adapter.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, the assigned engineer must stop and escalate to the Architecture Team if:

- A new runtime or development dependency is required beyond what Dependencies above anticipates.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- Requirements are unclear or conflicting — including, specifically for this sprint, if a primary source's worked example genuinely cannot be located after a documented attempt (see Golden-Dataset sourcing risk) or if the `MarketSeries` historical-vs-current-quote Data Quality distinction (Scope item 1) proves insufficient during implementation.
- Scope expansion is requested, including any request to build a trivial Analysis Provider or expose any part of this sprint's output via an HTTP endpoint (explicitly Non-Scope; see Risks).
- Point-in-time determinism (Swing Detection, Regime/Context Service) cannot be verified as specified.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly identified in ADR-005 and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s Known Limitations, and are consciously deferred to implementation time, not silently skipped:

- **Swing-detection sensitivity default** (the specific N-bar fractal parameter or equivalent) — an implementation-level calibration choice within this Brief's stated scope, not pre-decided here.
- **Regime/Context Service threshold calibration** (ADX trending cutoff, ATR volatility percentile) — same category of deferred calibration.
- **`computationVersion` numbering scheme** (e.g. semantic versioning starting at `1.0.0` per computation unit) — an implementation convention, not an architectural decision.
- **Wilder-smoothing conformance note** — which specific published worked example is used for each golden-dataset test, recorded for traceability once chosen.

None of these require a new ADR (no new architectural mechanism is involved — this is calibration within ADR-005's already-approved design, analogous to the precedent set by DEC-2026-004/005/006/007/008/009). **A new Decision Log entry is anticipated** once these values are fixed at implementation time, consistent with that precedent. This entry is identified here but intentionally **not created** in this Brief.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Approved on the basis that every finding from the Independent Sprint Brief Audit has been resolved (Assigned Implementation Engineer and Escalation Triggers sections added; MarketSeries/MarketQuote cache scope clarified; roadmap-terminology wording corrected to no longer assert an unsupported `08_ROADMAP.md` category; primary-source conformance testing tightened to mandatory-when-obtainable; the "failure rate" criterion replaced with latency, cache hit ratio, and computation rejection rate, consistent with `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Provider-scoped use of "failure rate"), and a final cross-document consistency review against `22_ANALYSIS_ENGINE_ARCHITECTURE.md` and `12_ADR_INDEX.md` (ADR-005) found no remaining architectural, terminological, or governance inconsistency. This Sprint Brief is now valid for implementation per Constitution Rule 2. This approval covers this Sprint Brief only; ADR-005/006/007 remain `Proposed` in `12_ADR_INDEX.md` and are not separately approved by this action.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-12
- **Completion Report:** `documentation/ai/S1-007_COMPLETION_REPORT.md` (AI-020)
- **Final Implementation Commits:** `2c7b446` (WP1 common utilities), `f6e4bef` (WP2 MarketSeries Anti-Corruption Layer), `c860e27` (WP3 Indicator Engine), `62a97e9` (WP4 Swing Detection Infrastructure), `f66be2c` (WP5 Regime/Context Service), `2952ece` (WP6 module wiring)
- **Related ADR:** ADR-005 (see `12_ADR_INDEX.md`)
- **Related Decisions:** DEC-2026-011 (computationVersion scheme, golden-dataset sourcing disclosure, swing/regime calibration non-defaulting)

This Sprint Status is distinct from the Approval Status in the Approval Section above.

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (the architecture this sprint implements)
- `documentation/zos/12_ADR_INDEX.md` (ADR-005 — this sprint's primary governing decision; ADR-006/007 — scoped to later sprints)
- `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md` (`MarketDataService`, `Candle`/`MarketQuote`, this sprint composes and translates)
- `documentation/zos/sprints/S1-006_SPRINT_BRIEF.md` (Explainability/Confidence/Data-Quality precedent this phase extends)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001 through DEC-2026-010 — none superseded or added by this Brief; new entries anticipated per Missing Decisions)
- `documentation/ai/AI_WORKFLOW.md` (Assigned Implementation Engineer)
