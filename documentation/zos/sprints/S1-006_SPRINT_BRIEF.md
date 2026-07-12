# S1-006 SPRINT BRIEF — Trading Analytics Foundation

**Document ID:** ZOS-S1-006
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Proposed

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-006
- **Sprint Name:** Trading Analytics Foundation
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`), first increment of the **Business Services** planned focus area
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Pending — see Approval Section

---

# Sprint Objective

S1-004 gave Zenith an accurate record of what a trader owns and at what cost. S1-005 gave it a resilient, cached pipeline for current and historical prices. Today those two facts remain disconnected: nothing in the platform combines a position with a quote. A trader can see raw numbers — quantity, average cost, current price — but nothing tells them whether they are up or down, by how much, how concentrated their portfolio is, or whether the numbers they're looking at are even fresh enough to trust. This sprint is not about building AI, a dashboard, or a chart — it is about turning the raw data S1-003, S1-004, and S1-005 already persist into the first layer of genuinely decision-relevant information: unrealized P/L, portfolio value, concentration risk, a transparent rule-based Portfolio Health Score, and an explicit statement of how much a trader should trust what they're seeing right now.

**Why this matters to traders:** the two questions every trader actually opens a trading platform to ask — *"am I up or down, and by how much?"* and *"how concentrated / exposed am I?"* — are unanswerable anywhere in Zenith today. This sprint answers both, for the first time, using data that already exists.

**What value it unlocks:** this Analytics Layer is explicitly the foundation every future capability in this product line depends on — Dashboard, Alerts, Risk Engine, Decision Engine, and AI Engine will all consume it rather than recomputing raw position/quote arithmetic themselves. Building it now, as a clean, composable, read-only layer, is what makes each of those later capabilities cheap and correct instead of each reinventing P/L math independently.

**Why remaining trading capabilities are intentionally deferred:** AI recommendations, buy/sell signals, a Risk Engine, a Decision Engine, alerts/notifications, and performance-history charting all *consume* analytics — none of them can be correctly built until analytics itself exists as a trustworthy, well-defined source. This sprint deliberately stops at computing and exposing analytics for the current moment only; it does not decide how those numbers are stored over time, alerted on, or acted upon by AI. Each of those is explicitly named in this Brief's Non-Scope and is its own future decision.

The chain this sprint enables: **trading catalog (S1-003) → owned positions with cost basis (S1-004) → resilient price pipeline (S1-005) → trustworthy, transparent analytics (S1-006) → Dashboard / Alerts / Risk Engine / Decision Engine / AI Engine.** This sprint introduces no new architectural mechanism and requires no new ADR — it composes three already-approved services (Portfolio, Position, Market Data) into a new read-only layer, per the Architecture Requirements below.

---

# Scope

Per the Architecture Team's directive, S1-006 is scoped to a read-only Trading Analytics layer, composing existing services with no new Prisma models:

### 1. Portfolio Analytics
For a given portfolio, computed from its positions and their current quotes:
- Total Portfolio Value (sum of each position's market value: `quantity × currentPrice`)
- Total Cost Basis (sum of each position's `quantity × averageCost`)
- Total Unrealized P/L (Total Portfolio Value − Total Cost Basis)
- Total Realized P/L (sum of each position's persisted `realizedPnl`)
- Combined P/L (Total Unrealized P/L + Total Realized P/L)
- Unrealized % (Total Unrealized P/L ÷ Total Cost Basis, when cost basis > 0)
- Realized % (Total Realized P/L ÷ Total Cost Basis, when cost basis > 0)
- Portfolio Summary — a compact object bundling the above for a single response

### 2. Position Analytics
For each position within a portfolio:
- Market Value (`quantity × currentPrice`)
- Unrealized P/L (`quantity × (currentPrice − averageCost)`)
- Unrealized % (Unrealized P/L ÷ cost basis for that position, when cost basis > 0)
- Portfolio Weight (that position's Market Value ÷ Total Portfolio Value, expressed as a %)

### 3. Risk Exposure
Computed from the same position set, no new data source:
- Largest Position (by Market Value)
- Largest Asset Allocation (which single asset represents the greatest % of Total Portfolio Value — relevant when a portfolio holds multiple positions in economically related assets)
- Market Exposure (breakdown of Total Portfolio Value by `Market` — e.g. % in EQUITY vs. CRYPTO vs. FOREX vs. COMMODITY, using the existing `MarketType` enum from S1-003)
- Asset Allocation (breakdown of Total Portfolio Value by individual asset, i.e. the full weight table underlying "Portfolio Weight" above)
- Concentration Score — a single rule-based number (not AI) summarizing how concentrated the portfolio is, e.g. derived from the largest position's weight and the number of distinct positions (a portfolio with one position at 100% weight scores maximally concentrated; a portfolio evenly split across many positions scores low)

### 4. Portfolio Health
A rule-based (explicitly NOT AI/ML) Portfolio Health Score, computed from deterministic thresholds against the data above:
- Position concentration (penalizes a single position dominating the portfolio)
- Allocation balance (penalizes extreme imbalance across market types or assets)
- Missing market data (penalizes when one or more positions lack a fetchable quote)
- Excessive exposure (penalizes an unusually large weight in a single market type, e.g. all-CRYPTO)
- **The score must always be returned together with a human-readable explanation of exactly which rule(s) contributed and why** — never a bare number. This is a hard requirement, not a nice-to-have: a score without a stated reason is not usable by a trader (or by any future consumer of this layer, including the eventual Decision/AI Engines) and would violate this sprint's own product-value test.

### 5. Decision Readiness
An explicit, rule-based readiness assessment stating whether the returned analytics are trustworthy enough to act on, based on:
- Quote freshness (how old is the newest quote among the portfolio's positions)
- Missing quotes (are any positions missing a quote entirely)
- Missing candles (is day-change data available where computed)
- Stale market data (quotes older than a defined threshold)

Returned as a small enum/label such as `READY_FOR_ANALYSIS` or `ANALYSIS_LIMITED`, always paired with the specific reason(s) driving that classification (reusing the same "always explain why" principle as Portfolio Health).

### 6. Data Quality
Every analytics response exposes, per position and/or in aggregate:
- Quote Age (elapsed time since the quote was fetched)
- Last Updated (timestamp of the underlying quote/candle data)
- Freshness (a qualitative label derived from Quote Age against a defined threshold)
- Confidence (a qualitative label reflecting how much of the portfolio's data is fresh/complete vs. missing/stale)
- Data Status (a compact summary combining the above, consistent with Decision Readiness)

### 7. Analytics Snapshot
The entire response above is generated **dynamically, on request, computed live** from current `Position`, `MarketQuote`, and `Candle` data. **No historical analytics storage is introduced by this sprint** — nothing computed here is persisted; every request recomputes from scratch against current data.

### 8. Quality and Governance Requirements (apply to all of the above)
- Zod validation for any request parameters.
- Full Swagger documentation for every new endpoint.
- Unit and integration-style test coverage, matching the rigor of S1-001 through S1-005.
- Ownership enforcement identical to the existing Portfolio/Position 404-on-mismatch pattern (a second trader must never see another trader's analytics, and must not be able to distinguish "not yours" from "doesn't exist").
- All arithmetic uses `Prisma.Decimal`, never native floating-point numbers, consistent with DEC-2026-005.
- Explicit, tested graceful degradation: a single missing or failed quote/candle lookup must degrade that position's (or the portfolio's) analytics — reflected honestly via Data Quality / Decision Readiness — and must never fail the entire response.
- Full regression against S1-001 through S1-005.

### 9. Explainability, Confidence, and Machine-Consumable Output Design (applies to items 1–6 above)

Required by Architecture Team review, prior to implementation approval:

- **Explainability.** Every computed score defined by this sprint — including, but not limited to, the Portfolio Health Score (item 4), the Concentration Score (item 3), any other Risk Exposure score, and the Decision Readiness assessment (item 5) — must never be returned as an isolated number or label. Each must be modeled as a structured result carrying at minimum:
  - `score` (or the relevant label/enum value)
  - `reasoning` — a human-readable explanation of what drove the result
  - `contributingFactors` — a structured, enumerable list of the specific factors that contributed, positively or negatively (for example: diversified holdings, fresh market data, one asset dominating the portfolio, stale quotes on specific positions). The exact shape and wording of `reasoning`/`contributingFactors` is an implementation detail, not fixed by this Brief, but the presence of both alongside every score is a hard requirement, not optional polish.
- **Confidence.** Every analytics metric produced by this sprint (not only the scores in item 3–5, but individual metrics such as a position's Unrealized P/L or a portfolio's Total Portfolio Value) must expose a confidence level (for example `HIGH` / `MEDIUM` / `LOW`) together with a `confidenceExplanation` describing why — factors such as stale quotes, missing quotes, incomplete position data, or outdated candles. Confidence is distinct from Data Quality (item 6): Data Quality describes the state of the underlying market data itself (age, freshness, completeness), while Confidence describes how trustworthy a specific *computed* metric is as a result of that underlying data. This Brief requires that the architecture support exposing confidence per metric; it does not define the final confidence-scoring algorithm or thresholds (see Missing Decisions).
- **Machine-Consumable Outputs.** This Analytics Layer is not built for human display alone — it is explicitly the foundation later consumed directly by the Dashboard, Alerts, Risk Engine, Decision Engine, and AI Engine named in the Sprint Objective. Every analytics response must therefore be designed for both audiences simultaneously: a human-readable summary (for direct display) and fully structured, machine-consumable fields (typed numbers, enums, and the `score`/`reasoning`/`contributingFactors`/`confidence` objects described above) that a future service can consume programmatically without parsing prose. This is a response-design requirement for this sprint's own API surface — it does not require building any of those future consuming systems, and none of them are implemented by this sprint.

---

# Non-Scope

Explicitly excluded from S1-006, per the Architecture Team's directive:

- **AI recommendations, buy/sell signals, a Decision Engine, or a Risk Engine** — this sprint produces the data those future capabilities will consume; it does not build any of them.
- **Alerts or notifications** — no capability to notify a trader when a metric crosses a threshold; this sprint only computes and returns metrics on request.
- **Portfolio history, performance statistics over time, or chart rendering** — this sprint is explicitly stateless and point-in-time; no time-series is stored or exposed.
- **Behavioral analysis or a trading journal** — unrelated to this sprint's data.
- **Multi-currency valuation** — inherited limitation from S1-004, unchanged here.
- **Real external market-data providers** — inherited limitation from S1-005 (ADR-003); all analytics in this sprint are computed from whatever data the currently-registered (simulated) provider supplies, and this sprint does not change that.
- **Any new Prisma model or persisted analytics table** — see Architecture Requirements; this sprint is a pure computation layer.
- **Any mutation of financial data** — analytics endpoints are strictly read-only; no position, transaction, portfolio, quote, or candle record may be created, updated, or deleted by this sprint's code.

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`.
- Any technology not listed in `04_TECH_STACK.md` or an existing ADR.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.
- Any new ADR (see Missing Decisions — none is anticipated for this sprint).

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the nine in-scope items listed above, as a new, self-contained analytics module composing `PortfoliosService`, `PositionsService`, and `MarketDataService`.
- Updated documentation where required.
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** a trader can request, for any portfolio they own, a single analytics response that tells them — in one place, computed live — whether they're up or down, by how much, how concentrated they are, a transparent Portfolio Health Score with a stated reason, and an honest statement of how much to trust the numbers they're looking at right now. The technical criteria below are how that outcome is verified.
- Portfolio Analytics fields (Total Portfolio Value, Total Cost Basis, Total Unrealized P/L, Total Realized P/L, Combined P/L, Unrealized %, Realized %) are computed correctly, verified against hand-computed expected values for a portfolio with multiple positions at different cost bases and current prices.
- Position Analytics fields (Market Value, Unrealized P/L, Unrealized %, Portfolio Weight) are computed correctly per position, and Portfolio Weights across all positions in a portfolio sum to 100% (within rounding tolerance).
- Risk Exposure correctly identifies the largest position and largest asset allocation, and correctly aggregates Market Exposure and Asset Allocation breakdowns; the Concentration Score responds directionally as expected (a single-position portfolio scores maximally concentrated; an evenly-split multi-position portfolio scores low).
- The Portfolio Health Score is never returned without an accompanying explanation identifying which rule(s) drove the result; the score responds correctly to at least the four named considerations (concentration, allocation balance, missing market data, excessive exposure), each independently verified.
- Decision Readiness correctly reflects quote/candle freshness and completeness, always paired with a stated reason, verified against both a fully-fresh portfolio and a portfolio with deliberately stale or missing quotes.
- Data Quality fields (Quote Age, Last Updated, Freshness, Confidence, Data Status) are present and accurate on every response.
- No analytics endpoint persists anything; a repeated identical request against unchanged underlying data returns numerically identical results, computed fresh each time.
- A second trader cannot retrieve another trader's portfolio analytics (404, not 403 or data leakage).
- A deliberately-induced single quote/candle fetch failure degrades only the affected position/metric, reflected honestly in Data Quality/Decision Readiness, and does not fail the overall response.
- No new Prisma model is introduced (or, if the Architecture Team ultimately determines one is unavoidable, that deviation is explicitly justified and approved before implementation — see Architecture Requirements).
- All new endpoints require authentication, are Zod-validated, and are documented in Swagger.
- New code has test coverage across all items above.
- All S1-001 through S1-005 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated to reflect the sprint's closure, and the sprint has been formally closed. Per this Brief's explicit Approval Section, implementation may not begin until this Brief is marked Approved by the Architecture Team.

---

# Dependencies

- `PortfoliosService` and `PositionsService` (S1-004) and `MarketDataService` (S1-005) — all already exported from their respective modules; no change to any of them is anticipated.
- No new PostgreSQL schema — see Architecture Requirements below; this sprint targets **zero new Prisma models**.
- No new runtime or development dependency is anticipated.
- No external network dependency — this sprint reads only through the existing, already-registered (simulated) `MarketDataProvider`, unchanged.

---

# Architecture Requirements

- The Analytics module **must compose** `PortfoliosService`, `PositionsService`, and `MarketDataService` — it must not duplicate their business logic (ownership resolution, cost-basis/realized-P&L arithmetic, quote/candle caching) by reimplementing any part of it independently.
- **No existing write-path may change.** Analytics endpoints are exclusively `GET` (or equivalent read-only) routes; no existing Portfolio/Position/MarketData mutation logic is touched.
- **Prefer zero new Prisma models.** This sprint's entire output is a live computation over already-persisted `Position`, `Transaction` (indirectly, via `realizedPnl`), `MarketQuote`, and `Candle` data. A new Prisma model should be introduced only if implementation reveals it is genuinely unavoidable — and if so, that deviation must be raised to the Architecture Team as a scope question before proceeding, not decided unilaterally during implementation.
- The Analytics module must not create a new dependency *from* `PositionsModule` or `MarketDataModule` back toward itself — dependencies flow one way (Analytics depends on the three existing services; none of them depend on Analytics), preserving S1-005's provider-abstraction isolation (ADR-003) and S1-004's accounting isolation (DEC-2026-005) exactly as they exist today.
- Ownership resolution reuses the existing `PortfoliosService.findOwned()` 404-on-mismatch pattern rather than reimplementing ownership logic inside the new module.
- All computed monetary/quantity arithmetic uses `Prisma.Decimal`, per DEC-2026-005 — never native JavaScript numbers — including when combining a `Position`'s `Decimal` fields with a `MarketQuote`'s `Decimal` price.
- Per Scope item 9 (Architecture Team review requirement): every score-bearing response field must be modeled as a structured object (`score`/`reasoning`/`contributingFactors`), never a bare primitive; every metric must carry a `confidence`/`confidenceExplanation` pair distinct from Data Quality; and response schemas must be designed for simultaneous human-readable and machine-consumable consumption, since future services (Dashboard, Alerts, Risk Engine, Decision Engine, AI Engine) are expected to consume this layer's structured fields directly, not parse prose.

Per ADR-001, ADR-003, ADR-004: unchanged — JWT remains the sole authentication mechanism; the market-data provider abstraction and its simulated default, and the background-sync scheduling mechanism, are unaffected by this sprint. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; all external input validated; centralized exception handling; no secrets logged.

---

# Risks

- **Data-authenticity risk (inherited, not new).** All analytics are only as real as the underlying simulated quotes (ADR-003). This sprint does not change that; Data Quality/Decision Readiness fields make the limitation visible to the caller rather than hiding it, but do not resolve it.
- **Availability/latency risk.** A portfolio-level analytics request may require a quote (and, for day-change-style metrics, a candle) lookup per position; a slow or rate-limited provider response for one asset must not stall or fail the entire response — this is why graceful degradation and Decision Readiness/Data Quality are hard requirements of this sprint, not optional polish.
- **Concentration/health-score design risk.** A rule-based score is only as good as its rules; an under-specified or poorly-calibrated scoring rule could mislead a trader as easily as help them. Mitigated by the hard requirement that every score always ships with its reasoning, so a trader (or a future consuming system) can evaluate the "why," not just trust an opaque number.
- **Scope-creep risk.** "Analytics" is an attractive nucleus for dashboards, alerts, and AI; this Brief's Non-Scope explicitly fences off every capability named as a future consumer of this layer (Dashboard, Alerts, Risk Engine, Decision Engine, AI Engine) — none of them may be pulled into this sprint's implementation.
- **Low financial-correctness risk relative to S1-004.** This sprint introduces no write path and no concurrency-sensitive mutation; it is pure computation over already-correct, already-persisted data, so its risk profile is materially lower than S1-004's own row-locked accounting logic.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly recognized and consciously deferred, not silently skipped:

- **Stale/degraded-data tolerance policy.** The precise thresholds for "stale" quote age, the exact Concentration Score formula, and the exact Portfolio Health rule weights are implementation-level judgment calls within this Brief's stated scope, not pre-decided here. They do not require a new ADR (no new architectural mechanism is involved — this is calibration of a rule-based scoring system, analogous to choosing a cache TTL value under DEC-2026-008's already-approved caching approach), **but a new Decision Log entry is anticipated** once the specific thresholds/formulas are chosen at implementation time, to record the rationale for traceability — consistent with the precedent set by DEC-2026-004/005/006/007/008 of recording implementation-level decisions that apply (rather than introduce) architecture. This entry is identified here but intentionally **not created** in this Brief, per the Architecture Team's explicit instruction.
- **Whether a future Dashboard/Alerts/Risk Engine/Decision Engine/AI Engine will call this layer directly or through an additional aggregation/caching tier** is explicitly left to those future sprints; this Brief only commits to this layer existing as a clean, composable, read-only source of truth for them.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [ ] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Pending
- **Date Approved:** Pending

This Sprint Brief is a proposal awaiting Architecture Team review and approval. Per Constitution Rule 2 (Sprint Authority), implementation must not begin until this Brief's Approval Status is marked Approved by the Architecture Team.

---

# Sprint Closure

- **Sprint Status:** NOT STARTED
- **Closed Date:** N/A
- **Completion Report:** N/A — to be created only after implementation
- **Final Implementation Commits:** N/A
- **Related ADR:** None anticipated (see Missing Decisions)
- **Related Decisions:** None yet — one Decision Log entry anticipated at implementation time (see Missing Decisions); not yet created

This Sprint Status is distinct from the Approval Status in the Approval Section above.

---

# Related Documents

- `documentation/zos/sprints/S1-004_SPRINT_BRIEF.md` (positions/accounting this sprint reads from)
- `documentation/zos/sprints/S1-005_SPRINT_BRIEF.md` (market data this sprint reads from)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-001 through ADR-004 — none superseded or added by this Brief)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001 through DEC-2026-008 — none superseded or added by this Brief)
- `documentation/ai/AI_BOOTSTRAP.md`
