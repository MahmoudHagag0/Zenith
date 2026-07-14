# 22_ANALYSIS_ENGINE_ARCHITECTURE

**Document ID:** ZOS-022\
**Version:** 1.3.1\
**Status:** Approved — Architecture Team final approval, 2026-07-12 (research, independent validation, governance synchronization, and Sprint Brief approval all complete; see ADR-005/006/007)\
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

This document is the single source of truth for the architecture of
Zenith's Analysis Engine — the subsystem that transforms raw market
data into explainable, deterministic, reproducible trading evidence.
It supersedes no prior document; it establishes a new subsystem
governed by the same rules as `05_ARCHITECTURE.md`.

The Analysis Engine exists to make Zenith an explainable trading
intelligence platform, not an automated advisor. It never produces
BUY/SELL recommendations. It produces evidence, interpretation, and
disclosed limitations that a trader — or a future downstream engine —
can independently verify.

This document defines the engine's structure. It does not catalog
every Analysis Provider that will eventually be built; individual
Providers (Wyckoff, ICT, Elliott Wave, etc.) are implemented under this
architecture through their own Sprint Briefs (S1-007 onward) and do not
require this document to change.

**Phase status:** the initial Analysis Provider roster (S1-013→S1-018,
nine registered Providers in total counting S1-009→S1-012's own three)
closed 2026-07-14 with zero change to this document across all nine
Provider sprints — the live proof of the claim in the paragraph above.
See `23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md` for the formal phase
closure review, the current Provider roster, and the Architecture
Team's readiness assessment for the next project phase.

# Design Principles

-   **Determinism** — every output must be reproducible from the same
    input data and the same disclosed parameters. Where a methodology
    is inherently non-unique (e.g. Elliott Wave wave counts), the
    engine represents that as multiple ranked deterministic hypotheses,
    never as a single non-reproducible guess.
-   **Explainability** — every score carries `reasoning` and
    `contributingFactors`; every claim can answer "why."
-   **Traceability** — every claim can also answer "where did this
    come from," back to raw market data.
-   **No black boxes, no recommendations** — Providers emit Evidence
    and Interpretation, never BUY/SELL/HOLD directives.
-   **Confluence over consensus-forcing** — when methodologies
    disagree, the disagreement is preserved and surfaced as
    information, never silently resolved.
-   **Centralize computation, decentralize interpretation** — shared,
    provable calculations (indicators, swing points, regime state) live
    in one place with one formula and one source citation. How a
    methodology *interprets* that computation is owned by the
    methodology's own Provider, never by a shared component. This
    single rule is what separates the Indicator Engine, Swing
    Detector, and Regime/Context Service (pure computation, no
    interpretation) from the Analysis Provider Framework and
    Confluence Engine (interpretation and aggregation of interpreted
    evidence) — see "Overall Architecture" below for why these remain
    distinct components rather than one merged aggregator.
-   **Single source of truth per computation** — an indicator, a swing
    point, or a regime classification is computed once and consumed
    everywhere; no Provider reimplements shared computation.
-   **Extensible without modification** — adding a new Indicator or a
    new Analysis Provider must never require changing an existing
    Indicator or Provider's code.
-   **Computation logic is versioned separately from contract shape** —
    a bug fix or formula correction to an Indicator, Swing Detector,
    Regime read, or Provider changes what a computation *produces*,
    not necessarily the *shape* it is returned in. These are two
    different kinds of change and are versioned independently (see
    "Computation Versioning").
-   **No domain service depends on another bounded context's
    persistence entities** — Analysis Engine domain services consume
    the Market Data domain only through a translated boundary type,
    never through `Candle`/`MarketQuote` directly (see "Anti-Corruption
    Layer — Market Data Boundary").

# Overall Architecture

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ Data Layer (existing, Market Data bounded context)               │
 │ Candle (daily OHLCV) · MarketQuote · Portfolio/Position          │
 └───────────────────────────────┬───────────────────────────────--┘
                                  │
 ┌────────────────────────────────▼────────────────────────────────┐
 │ Anti-Corruption Layer: MarketSeries / PriceSeries                │
 │ (owned by Analysis Engine — see "Anti-Corruption Layer" section) │
 └────────────────────────────────┬───────────────────────────────--┘
                                  │
 ┌────────────────────────────────▼────────────────────────────────┐
 │ Shared Deterministic Infrastructure  (pure computation only)     │
 │                                                                   │
 │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
 │  │ Indicator Engine │  │ Swing Detection   │  │ Regime / Context ││
 │  │ (EMA/SMA/RSI/    │  │ Infrastructure    │  │ Service           ││
 │  │  MACD/ATR/ADX/   │  │ (swing highs/lows,│  │ (trend/range      ││
 │  │  Bollinger/Fib)  │  │  BOS/CHoCH)       │  │  state, from ADX +││
 │  │                  │  │                   │  │  Structure + ATR) ││
 │  └────────┬─────────┘  └─────────┬─────────┘  └─────────┬────────┘│
 └───────────┼──────────────────────┼──────────────────────┼────────┘
             │                      │                      │
 ┌───────────▼──────────────────────▼──────────────────────▼────────┐
 │ Analysis Provider Framework  (interpretation)                     │
 │                                                                    │
 │  Provider A   Provider B   Provider C  ...  Provider N            │
 │  (each: Evidence + Interpretation[] + Limitations                 │
 │         + Traceability + Confidence + normalize())                │
 │                                                                    │
 │  Execution Engine: dependency-ordered (topological) invocation,   │
 │  fast-tier / slow-tier split, partial-failure reporting           │
 └───────────────────────────────┬───────────────────────────────────┘
                                  │  normalized signals
 ┌────────────────────────────────▼───────────────────────────────────┐
 │ Confluence Engine  (aggregation of already-interpreted evidence)   │
 │  ConfluenceWeightStrategy (EqualWeightStrategy today) ·             │
 │  methodology-family grouping · disagreement explanation ·          │
 │  provider-participation reporting · reference-based traceability   │
 └────────────────────────────────┬───────────────────────────────────┘
                                  │  contractVersion-tagged output
 ┌────────────────────────────────▼───────────────────────────────────┐
 │ Consumers (future)                                                  │
 │ Dashboard · Alerts · Risk Engine · Decision Engine · AI Engine ·    │
 │ Backtesting · Portfolio Analytics · Portfolio Scoring               │
 └──────────────────────────────────────────────────────────────────--┘
```

The Regime/Context Service and the Confluence Engine are not the same
component under different names, despite both being "aggregators."
They occupy different pipeline stages: the Regime/Context Service runs
*before* Providers execute, producing a small, fixed-shape context
signal (trend/range, volatility state) that Providers consume to gate
their own confidence. The Confluence Engine runs *after* Providers
execute, aggregating many Providers' already-interpreted Evidence into
a combined view. One computes raw context; the other aggregates
interpreted conclusions. Collapsing them would couple two consumers
with materially different release cadences and failure tolerances to
one shared component.

# Anti-Corruption Layer — Market Data Boundary

The Market Data domain (`Candle`, `MarketQuote` — Prisma entities owned
by `apps/api/src/market-data`, established in S1-005) and the Analysis
Engine are separate bounded contexts. Per `05_ARCHITECTURE.md`'s own
dependency rules ("Domain logic must not depend directly on
presentation," "Infrastructure must remain replaceable where
practical"), no Analysis Engine domain service may depend on
`Candle`/`MarketQuote` directly.

-   **`MarketSeries` / `PriceSeries`** is a value object owned by the
    Analysis Engine: an ordered, immutable series of points, each
    carrying **both** normalized market data **and** Data Quality
    metadata. It has no knowledge of Prisma, `Candle`'s column names,
    or how the data was persisted.
    -   **Ownership:** owned and evolved exclusively by the Analysis
        Engine. The Market Data domain has no knowledge of
        `MarketSeries` and never constructs or consumes it.
    -   **Responsibilities:** (1) carry the normalized OHLCV series
        (`timestamp`, `open`, `high`, `low`, `close`, `volume`); (2)
        carry Data Quality metadata (`freshness`: FRESH/STALE/MISSING,
        and an age value), translated from the source at the moment
        of translation — never omitted, and never re-queried from
        Market Data by any downstream service.
    -   **Propagated fields:** from `Candle` — `date`, `open`, `high`,
        `low`, `close`, `volume`; from `MarketQuote` — `price`,
        `currency`, `asOf`, `fetchedAt`. The translation adapter
        computes `freshness` from `fetchedAt` using the same
        staleness threshold already established by DEC-2026-009 (5
        minutes) and attaches it to the corresponding `MarketSeries`
        point. No other `Candle`/`MarketQuote` field (internal IDs,
        `provider`, foreign keys) is propagated — only what a
        downstream computation could legitimately need.
    -   **Lifecycle:** `MarketSeries` is a transient translation
        artifact, not a persisted or independently identified entity.
        It is produced fresh from current `Candle`/`MarketQuote` state
        on every translation, carries no `computationVersion` of its
        own (it performs field mapping, not formula application), and
        is not cached or referenced by ID; only the Indicator
        Engine/Swing Detector/Regime Service outputs computed *from* a
        `MarketSeries` are cached and versioned.
    -   **Why Data Quality travels with it:** the Data Quality Model
        (below) requires that "Indicator Engine output inherits the
        freshness of the candles/quotes it consumed." If freshness
        were stripped at this boundary, every downstream service would
        need a side-channel query back into the Market Data domain to
        recover it — reintroducing exactly the direct dependency the
        Anti-Corruption Layer exists to prevent. Carrying Data Quality
        forward as part of the value object keeps the boundary a
        single, one-way translation step.
    -   **Why this does not violate bounded-context isolation:**
        `freshness`/age is not a Market-Data-domain type — it is not
        `Candle` or `MarketQuote` — it is a generic, timestamp-derived
        classification the Analysis Engine already independently
        defines and owns in its own Data Quality Model. Translating
        "this quote is 3 minutes old" into `freshness: FRESH,
        ageSeconds: 180` at the boundary is precisely what a
        translation layer is for: expressing the other domain's
        concept in this domain's own vocabulary. This is distinct from
        — and does not regress toward — embedding a `Candle` or
        `MarketQuote` object directly, which would violate isolation.
-   **Translation boundary:** a thin adapter (owned by the Analysis
    Engine, not by Market Data) translates `Candle`/`MarketQuote` rows
    into `MarketSeries` at the point of entry to the Indicator Engine,
    Swing Detector, and Regime/Context Service. This adapter is the
    *only* place in the Analysis Engine permitted to reference
    `Candle`/`MarketQuote` types.
-   **Ownership:** the Analysis Engine owns the `MarketSeries` shape
    and evolves it independently. The Market Data domain owns
    `Candle`/`MarketQuote` and evolves them independently. Neither
    domain is permitted to reach into the other's internal types.
-   **Why this must never be skipped:** the already-documented future
    intraday/tick data-model expansion (see Known Limitations) will
    change `Candle`/`MarketQuote`'s shape or introduce new persistence
    entities entirely. Without this boundary, that future change would
    propagate directly into every Indicator, the Swing Detector, and
    the Regime/Context Service. With it, only the translation adapter
    changes; every domain service downstream of `MarketSeries` is
    unaffected. This is the same principle already applied by ADR-003
    (business logic depends on the `MarketDataProvider` interface,
    never a concrete vendor) — applied here to Zenith's own internal
    domain boundary rather than an external vendor boundary.
-   **Backward compatibility:** this is additive to the existing
    architecture. `Candle`/`MarketQuote` do not change; only the
    Indicator Engine, Swing Detector, and Regime/Context Service's
    input type changes from "Prisma entity" to "`MarketSeries`,"
    resolved by the translation adapter.

# Indicator Engine

Pure, deterministic computation only — no interpretation, no Evidence,
no confidence. A single source of truth for every published, formula-
defined indicator.

-   **Members (initial):** SMA, EMA, RSI, MACD (`line` and `histogram`
    tracked as separately-attributed sub-outputs — the histogram is a
    1986 Aspray addition to Appel's original line, not part of the
    same original source), Bollinger Bands, ATR, ADX, Fibonacci ratio
    calculator, Donchian channel.
-   **Wilder-faithful computation is mandatory.** RSI, ATR, and ADX
    must use J. Welles Wilder Jr.'s original recursive smoothing
    method exactly as published (1978), not a plain EMA/SMA
    approximation. Every indicator output carries a source-attribution
    metadata field identifying the exact formula/lineage used.
-   **Structure:** implemented as its own internal registry of
    individual indicator calculators (not one monolithic service
    class), so a 100th indicator is added the same way as the 6th —
    by registering a new calculator, never by modifying an existing
    one.
-   **Access:** consumed only through an interface/injection token
    (following the `MARKET_DATA_PROVIDER` precedent of ADR-003), never
    through direct instantiation of a concrete class.
-   **Caching:** results are cached by `(indicator, parameters,
    instrument, data-range)`; a shared cache is mandatory once more
    than a handful of Providers consume the same indicator, to avoid
    the same series being recomputed once per Provider per request.
-   **Input boundary:** the Indicator Engine consumes `MarketSeries`
    (see "Anti-Corruption Layer"), never `Candle`/`MarketQuote`
    directly.
-   **Computation metadata is mandatory on every output** (see
    "Computation Versioning" for the full requirement): the parameters
    used, the exact formula/source citation, the input data range
    consumed, the computation timestamp, intermediate values where a
    formula has meaningful intermediate steps (e.g. Wilder's smoothed
    average before the final RSI ratio), and a `computationVersion`
    identifying the exact formula implementation used. This is the raw
    material Providers assemble into their own Traceability record —
    without it, a Provider cannot trace back further than the
    Indicator Engine's boundary.

# Swing Detection Infrastructure

A single, parameterized swing/pivot detector, shared by every
methodology that needs swing points (12 of the ~13 identified
Providers) — Market Structure, Support/Resistance, Elliott Wave,
Fibonacci, Harmonic Patterns, Chart Patterns, and others.

-   Detects swing highs/lows via a disclosed, fixed sensitivity
    parameter (e.g. an N-bar fractal rule); the parameter used is
    always part of the result's metadata, never a silent default.
-   Produces Market Structure primitives (swing sequence, BOS/CHoCH)
    as a direct output, since this is the same underlying computation.
-   **Point-in-time determinism is a hard requirement, not an
    optimization.** A swing point may only be confirmed once enough
    subsequent bars exist to satisfy the sensitivity rule. The
    confirmation lag must behave identically in live execution and in
    backtesting — a backtest must never "see" a swing before it would
    genuinely have been confirmable in real time. This is required for
    the Backtesting future-compatibility goal (see "Known
    Limitations") and constrains the detector's implementation, not
    just its usage.
-   Cached by `(instrument, timeframe, sensitivity)`; new bars may
    retroactively revise the most recent unconfirmed swings only —
    already-confirmed swings never change.
-   **Input boundary:** the Swing Detector consumes `MarketSeries` (see
    "Anti-Corruption Layer"), never `Candle`/`MarketQuote` directly.
-   **Computation metadata is mandatory on every output**, identical in
    kind to the Indicator Engine's requirement above: sensitivity
    parameter used, input data range, computation timestamp,
    intermediate swing candidates considered (when applicable), and a
    `computationVersion`.

# Regime / Context Service

Composes Indicator Engine output (ADX, ATR) and Swing Detection output
(Market Structure) into a single, versioned "current regime" read:
trend state (trending/ranging) and volatility state.

-   Consumed by Providers *before* they compute their own confidence —
    e.g. Mean Reversion and Breakout Methodology both gate their
    confidence by the same regime read rather than deriving their own.
-   Is itself deterministic and Traceable: every regime classification
    references the exact ADX/ATR/Structure values and thresholds that
    produced it.
-   Threshold calibration (what ADX level counts as "trending," what
    ATR percentile counts as "high volatility") is a Decision Log
    item, not hardcoded silently — see Known Limitations.
-   Must be point-in-time deterministic, for the same reason as Swing
    Detection.
-   **Input boundary:** consumes Indicator Engine and Swing Detector
    output only — never `Candle`/`MarketQuote` directly, preserving
    the same Anti-Corruption boundary transitively.
-   **Computation metadata is mandatory on every output**: the ADX/ATR/
    Structure thresholds and values used, computation timestamp, and a
    `computationVersion`, identical in kind to the Indicator Engine's
    requirement.

# Computation Versioning

Every computation in the Analysis Engine — Indicator Engine, Swing
Detector, Regime/Context Service, and every Analysis Provider — carries
a `computationVersion`, distinct from and independent of
`contractVersion`.

-   **Purpose:** `contractVersion` versions the *shape* of an output
    (which fields exist). `computationVersion` versions the *logic*
    that produced the values inside that shape (which formula,
    detection rule, or parameter set was used). A bug fix to Wilder's
    RSI smoothing, a corrected Gartley ratio table, or a recalibrated
    Regime threshold changes `computationVersion` and may leave
    `contractVersion` untouched — the fields are the same, the numbers
    are not.
-   **Ownership:** each computation unit (an individual Indicator
    calculator, the Swing Detector, the Regime/Context Service, each
    Analysis Provider) owns and increments its own
    `computationVersion` independently. There is no central registry
    to edit — incrementing one component's `computationVersion` never
    requires touching another's, consistent with "Extensible without
    modification."
-   **Lifecycle:** `computationVersion` increments whenever the
    underlying logic changes in a way that could alter a previously
    computed value for the same input (a formula correction, a
    corrected source citation, a changed default parameter). It does
    not increment for changes that cannot alter output values (comments,
    internal refactoring, performance optimizations that are proven
    output-identical).
-   **Compatibility rules:** a `computationVersion` change is always
    backward-compatible at the contract level — old and new versions
    return the same shape. It is explicitly *not* required to be
    backward-compatible at the value level; a formula correction is
    expected to change values, that is the entire point of recording
    the version.
-   **Interaction with Backtesting:** every stored or reproduced
    historical result must record the `computationVersion` (and
    `contractVersion`) active at the time it was generated. Re-running
    a backtest against a later `computationVersion` is a *different,
    explicitly labeled* run, never silently substituted for the
    original — this is what makes the Determinism principle
    ("same input, same output... at any future time") honest rather
    than aspirational: determinism is guaranteed per
    `computationVersion`, not across arbitrary future code changes.
-   **Interaction with Traceability:** every Traceability record
    includes the `computationVersion` of every computation it
    references (Indicator Engine, Swing Detector, Regime/Context
    Service, and the Provider's own interpretation logic), so a
    drill-down always shows exactly which logic produced a given
    number, not just which inputs.

# Analysis Provider Framework

A registry of independently pluggable Analysis Providers, each
implementing the same `AnalysisProvider` contract.

-   **Registration:** NestJS multi-provider pattern — each Provider is
    registered as a class; a factory provider injects the full set and
    exposes it as an array, following the same pattern already used
    for provider-set composition elsewhere in the codebase.
-   **Dependency declaration:** a Provider may declare a dependency on
    another Provider's output (e.g. VSA depends on Wyckoff's active
    range). Dependencies are declared **by stable Provider identifier/
    token, never by importing another Provider's concrete class** —
    the Execution Engine resolves tokens to instances at runtime, so
    no Provider is compile-time coupled to another Provider's
    implementation. The framework performs a topological sort over
    declared dependencies before invocation; it does not assume all
    Providers are mutually independent, since at least one approved
    relationship (VSA → Wyckoff) already is not.
-   **Methodology family:** each Provider self-declares an optional
    `methodologyFamily` identifier as part of its own registration
    (e.g. the merged ICT/SMC Provider and Supply/Demand-tagged zone
    evidence declare the same family). This metadata is authored
    exclusively by the Provider; the Confluence Engine reads it and
    never assigns or edits it, so adding a Provider to an existing
    family never requires modifying the Confluence Engine (see
    "Confluence Engine").
-   **Execution tiers:** Providers are tagged fast-tier or slow-tier.
    A slow-tier Provider (e.g. Elliott Wave's multi-hypothesis search)
    must never block the response of fast-tier Providers; slow-tier
    results may be delivered incrementally or on a separate channel.
-   **Partial failure:** a missing, timed-out, or errored Provider is
    explicitly reported as non-participating, never silently treated
    as agreeing or neutral. Aggregation downstream must be able to
    distinguish "5 of 7 Providers say bullish" from "5 of 5 available
    Providers say bullish, 2 were unavailable."
-   **Circuit breaker:** a Provider that fails or times out
    repeatedly is temporarily excluded from invocation (opened
    circuit) rather than re-invoked on every subsequent request,
    reusing the same philosophy already established for external
    dependencies by ADR-003's rate-limiting/retry design — applied
    here to in-process Provider invocation rather than an external
    vendor call. A Provider in an open-circuit state is reported as
    non-participating (see Partial Failure above), never silently
    dropped. See "Operational Resilience & Observability" for the
    full requirement.
-   **Graceful data degradation is mandatory, not conventional.** A
    Provider facing missing or unusable input data must return a
    populated `Limitations` entry describing the gap; it must never
    throw.

# Evidence / Interpretation / Limitations Contract

The standard shape every Analysis Provider returns:

-   **`contractVersion`** — mandatory on every output. Enables future
    consumers (Risk Engine, Decision Engine, AI Engine) to be
    introduced without every existing Provider needing simultaneous
    redeployment when the contract changes. `contractVersion` versions
    the output *shape* only; it is deliberately distinct from
    `computationVersion` (see "Computation Versioning"), which versions
    the logic that produced the values within that shape. Both fields
    are mandatory and independent.
-   **Evidence** — detected conditions, explicitly-noted missing
    conditions, supporting evidence, conflicting evidence.
-   **Interpretation** — an **array**, always, even when a Provider
    has exactly one interpretation. This is a deliberate base-contract
    decision (not an optional extension for exceptional Providers):
    treating a single-hypothesis Provider's interpretation as an
    array of length one preserves substitutability — any Consumer can
    treat every Provider identically without special-casing the
    multi-hypothesis ones (Elliott Wave's competing wave counts,
    Wyckoff's competing phase-schematic readings). Each array entry
    carries its own confidence and its own ranking. Interpretation is
    the Provider's deterministic reading of its own Evidence — never a
    trading recommendation.
-   **Limitations** — known constraints on this specific result:
    data-quality caveats, methodology-level confidence ceilings (see
    Confidence Model), and any assumption the result depends on.

# Traceability

Every result exposes a chain back to its origin:

-   Raw data references (which candles/quotes were read, via the
    `MarketSeries` boundary — see "Anti-Corruption Layer").
-   Intermediate calculations (which Indicator Engine / Swing Detector
    / Regime Service outputs were used, with their own parameters,
    computation metadata, and `computationVersion` — see "Computation
    Versioning"; this is why those services are obligated to expose
    that metadata rather than just a raw value).
-   Condition derivations (which detected/missing conditions produced
    the Evidence).
-   Confidence derivation (what inputs produced the stated confidence).

At the Confluence Engine boundary, full per-Provider trace chains are
**referenced, not embedded**, in the default response — a Confluence
result carries trace IDs for each contributing Provider; the full
chain is fetched only on explicit drill-down request. This keeps
response payloads bounded as the number of contributing Providers
grows toward 50+.

## Trace Store

Referencing a trace "by ID" implies the trace record has identity and
must be held somewhere between computation and later drill-down
retrieval. This document specifies the model, not the storage
technology (an implementation decision for S1-008/S1-012):

-   **Retention:** a trace record is retained at minimum for as long
    as the Confluence/Provider result that references it is
    reachable by a Consumer (e.g. displayed on a Dashboard, referenced
    by an Alert, or included in a Backtesting run's recorded output).
-   **TTL:** live (non-backtested, non-audited) trace records carry a
    default time-to-live after which they may be purged; a trace
    referenced by a Backtesting run or an audit record is exempted
    from TTL-based purge for the retention period that run/record
    requires.
-   **Lifecycle:** a trace record is immutable once written — it is
    never edited in place. A recomputation (e.g. a swing revision
    within its point-in-time-safe confirmation window) produces a new
    trace record, not a mutation of the old one.
-   **Cleanup:** expired, unreferenced trace records are eligible for
    deletion; a record still referenced by a retained Confluence/
    Provider result, a Backtesting run, or an audit record is never
    deleted regardless of age.

# Confidence Model

Confidence is not one thing, and the contract must not collapse it
into a single unlabeled number. Four distinct, separately-labeled
confidence concepts exist and must never be silently compared as if
equivalent:

1.  **Detection Confidence** — how well the Evidence matches the
    Provider's pattern/event definition (e.g. Harmonic Pattern ratio
    match tightness).
2.  **Interpretation Confidence** — per-hypothesis confidence, used to
    rank entries in a multi-hypothesis `Interpretation[]`.
3.  **Regime-Adjusted Confidence** — confidence scaled by the
    Regime/Context Service's current read (e.g. Mean Reversion
    confidence rising in range-bound regimes, falling in trending
    ones).
4.  **Methodology Confidence Ceiling** — a disclosed, Provider-level
    cap reflecting source quality (e.g. ICT/SMC's ceiling is lower
    than Wyckoff's Three Laws, reflecting the absence of an
    independent primary source — see Known Limitations).

Every `confidence` field is paired with a `confidenceExplanation` and
a label identifying which of the four concepts it represents.

# Data Quality Model

Formalizes, as a mandatory Provider Framework requirement, the
graceful-degradation pattern already proven in S1-006's Analytics
layer (`freshness`: FRESH/STALE/MISSING; confidence reduced under
staleness).

-   Every Provider's output carries a Data Quality assessment distinct
    from Confidence (Data Quality describes the input data's own
    freshness/completeness; Confidence describes trust in the
    analytical conclusion).
-   Staleness/freshness metadata propagates end-to-end, carried by the
    `MarketSeries` value object across the Anti-Corruption Layer (see
    "Anti-Corruption Layer"): Indicator Engine output inherits the
    freshness of the candles/quotes it consumed; Provider output
    inherits the freshness of every Indicator/Swing/Regime input it
    used; Confluence output reports the weakest Data Quality among its
    contributing Providers.
-   Missing data never produces a thrown exception from a Provider —
    it produces a populated `Limitations` entry with `dataQuality:
    MISSING`.

# Normalization

Each Provider owns its own `normalize()` method, translating its
Evidence/Interpretation into a shared vocabulary: **Trend, Momentum,
Liquidity, Structure, Volatility, Volume, Confirmation** ("Risk" is
explicitly excluded from this phase — it belongs to a future, distinct
Risk Engine).

-   Normalization is decentralized by implementation (no central
    translator a new Provider must be routed through) but centralized
    by specification: the shared vocabulary schema, and a conformance
    test suite of fixed input/output examples every `normalize()`
    implementation must satisfy, live in one place and are versioned.
    Decentralized implementation without a shared conformance check
    would allow semantic drift (ten Providers each meaning something
    different by "Momentum"), which would defeat Confluence's purpose.
-   The vocabulary schema is **additive and versioned**. Adding a new
    dimension in the future (e.g. reintroducing "Risk" once a Risk
    Engine exists) requires a Decision Log entry and a schema version
    bump; existing Providers are unaffected and default the new
    dimension to "not applicable" until updated.

# Confluence Engine

Aggregates normalized signals across all participating Providers.

-   **Weighting:** a pluggable `ConfluenceWeightStrategy` interface.
    Only `EqualWeightStrategy` (weight = 1.0 for every Provider) is
    implemented in this phase. The interface exists so a future
    strategy can be introduced without changing any Provider's
    contract. **Every `ConfluenceWeightStrategy` implementation,
    present or future, must return a weight explanation alongside
    each generated weight** — a `weightExplanation` field stating why
    that Provider received that weight. `EqualWeightStrategy`'s
    explanation is simply "equal weighting, no differential weighting
    strategy active yet"; a future data-driven strategy's explanation
    must state what evidence produced its weight. This keeps
    Confluence's explainability guarantee intact even after real
    weighting is introduced, rather than only covering today's trivial
    case.
-   **Methodology-family grouping is mandatory from the first release,
    not deferred until real weighting exists.** Family membership is
    **declared by each Provider itself** (`methodologyFamily`, see
    "Analysis Provider Framework") — **the Confluence Engine reads
    this declaration and never authors or edits it.** Providers
    derived from overlapping lineages (e.g. the merged ICT/SMC
    Provider and any Supply/Demand-tagged zone evidence) declare the
    same family, so agreement among near-duplicate methodologies is
    never counted as independent confirmation. This directly protects
    the Trust Model: equal weighting alone is insufficient to prevent
    false confidence from correlated Providers. Because family
    membership is Provider-owned metadata, adding a Provider to an
    existing family — or introducing a new family — never requires
    modifying the Confluence Engine, preserving the Open/Closed
    principle at the aggregation layer.
-   **Disagreement is surfaced, not resolved, and is computed at the
    normalized-dimension level, never as pairwise Provider-vs-Provider
    comparison.** When normalized signals conflict, the Confluence
    output includes a structured disagreement-explanation field per
    dimension (Trend, Momentum, Liquidity, Structure, Volatility,
    Volume, Confirmation) distinguishing "expected disagreement" (e.g.
    trend-following vs. mean-reversion evidence on the same
    instrument) from unexpected inconsistency, informed by the
    Methodology Conflict Matrix produced during Analysis Engine
    research. **Complexity:** at N Providers, dimension-level
    disagreement is O(N × 7) — linear in Provider count. A pairwise
    Provider-vs-Provider comparison would be O(N²) — at 50+ Providers,
    thousands of pairs for no additional explanatory value over the
    dimension-level view, since traders reason about "why do Trend
    signals disagree," not "why does Provider #14 disagree with
    Provider #37." (See "Additional Findings" for a caveat on
    per-dimension drill-down attribution.)
-   **Provider participation** is reported explicitly — which
    Providers contributed, which were unavailable — never inferred.

# Plugin Architecture

-   Every foundational component (Indicator Engine, Swing Detector,
    Regime/Context Service) is injected via an interface/token, never
    a concrete class, consistent with ADR-003's `MARKET_DATA_PROVIDER`
    precedent. This is a Dependency Inversion requirement, not a
    style preference.
-   Every Analysis Provider implements the same `AnalysisProvider`
    interface and is registered additively; adding Provider N+1 never
    requires modifying Providers 1..N.
-   Adding a new Indicator, a new Provider, or (via a Decision Log
    entry) a new normalized vocabulary dimension are the three
    supported extension points. No other extension requires touching
    this architecture document.
-   Provider dependency declarations (see "Analysis Provider
    Framework") and Regime/Context Service consumption are both
    interface/token-based for the same reason: no plugin component may
    be compile-time coupled to another plugin component's concrete
    implementation.

# Operational Resilience & Observability

Required for safe operation at scale (millions of analyses, 50+
Providers) — specified here as a requirement, not an infrastructure
choice; the specific metrics backend, tracing system, or dashboard
tooling is an implementation decision, not an architectural one.

-   **Circuit breaker:** as stated in "Analysis Provider Framework," a
    Provider that fails or times out repeatedly is temporarily
    excluded from invocation rather than re-invoked on every request,
    reusing the retry/backoff philosophy already established for
    external calls by ADR-003, applied here to in-process Provider
    invocation.
-   **Latency:** per-Provider and per-Indicator execution latency must
    be observable, so a slow-tier Provider's cost is visible and a
    fast-tier Provider that degrades into slow-tier territory is
    detectable.
-   **Failures:** Provider failure/timeout rate must be observable per
    Provider, feeding the circuit breaker above and giving early
    warning before a Provider needs to be marked DEPRECATED.
-   **Cache hit ratio:** observable per shared computation
    (`indicator`, swing detection, regime read), so a caching
    regression (e.g. a cache key that stops matching after an
    unrelated change) is visible before it silently degrades
    performance.
-   **Provider health:** an aggregate health signal per Provider
    (participation rate, average confidence, failure rate over a
    rolling window), reusing the same shape as
    `MarketDataProvider.checkHealth()` already established in ADR-003,
    applied to Analysis Providers rather than a market-data vendor.
-   **Confluence metrics:** Provider participation rate, disagreement
    frequency per normalized dimension, and Confluence Engine
    aggregation latency, so a family-grouping or weighting regression
    is observable, not just theoretically prevented by the
    architecture.

# Provider Lifecycle

Every Provider carries an explicit lifecycle state:

-   **ACTIVE** — eligible for live Confluence runs.
-   **DEPRECATED** — excluded from new live Confluence runs by
    default, but remains executable so that historical Confluence
    results (and Backtesting runs referencing that period) remain
    reproducible.
-   **RETIRED** — no longer executable; retirement requires a Decision
    Log entry recording rationale and the last-active contract
    version.

# Extension Guidelines

-   **New Indicator:** implement the Indicator Engine's calculator
    interface, register it, cite its original source, and provide a
    golden-dataset conformance test that reproduces at least one
    published reference example from the cited primary source exactly
    (e.g. a worked RSI example from Wilder's own 1978 text). No
    existing indicator or Provider changes.
-   **New Analysis Provider:** implement `AnalysisProvider`
    (Evidence/Interpretation[]/Limitations, Traceability, Confidence,
    `normalize()`), declare any dependency on another Provider's
    output by stable identifier/token, declare a `methodologyFamily`
    if it shares detection logic or lineage with an existing Provider,
    register via module import, and provide a reference-dataset
    conformance test validating pattern/event detection against at
    least one worked example from the methodology's own cited primary
    source (e.g. a Gartley pattern instance matched against Carney's
    or Pesavento's published ratio table, per whichever is cited). No
    existing Provider changes.
-   **New methodology vs. new Provider:** before creating a new
    Provider for a named methodology, check for substantial overlap
    with an existing Provider's detection logic (the research phase's
    precedent: ICT and SMC were found to be ~90% overlapping and
    should share one Provider with dual-vocabulary output rather than
    duplicate detection code). Prefer extending an existing Provider's
    output vocabulary over creating a near-duplicate Provider.
-   **New normalized vocabulary dimension:** requires a Decision Log
    entry and a vocabulary schema version bump; this is the one
    extension point that is not entirely free of coordination cost,
    and is deliberately gated for that reason.

# Future Compatibility

-   **Dashboard / Alerts:** consume Confluence output directly;
    Alerts require incremental (not full-recompute) Provider
    evaluation, which the point-in-time-safe Swing Detector/Regime
    Service design supports.
-   **Risk Engine / Decision Engine:** consume the standard contract;
    depend on `contractVersion` for safe evolution.
-   **AI Engine:** consumes normalized signals and Confluence output as
    features. The feature-vector convention for multi-hypothesis
    (`Interpretation[]`) outputs is not yet defined and is deferred to
    a future ADR — noted here so it is not silently assumed.
-   **Backtesting:** requires the point-in-time determinism guarantees
    stated under Swing Detection and Regime/Context Service, and
    requires every stored/reproduced result to record the
    `computationVersion` active when it was generated (see
    "Computation Versioning") so a re-run against later logic is never
    silently confused with the original. Both are hard prerequisites
    for trustworthy backtesting, not optional refinements.
-   **Portfolio Analytics / Portfolio Scoring:** consume per-instrument
    Confluence output aggregated across a portfolio's positions by the
    existing Analytics layer (S1-006); the Analysis Engine itself
    remains single-instrument scoped.
-   **Journal / Behavior Analysis:** explicitly out of scope. These
    subsystems analyze trader decisions and behavior, not market
    evidence, and consume the Decision Engine's output, not the
    Analysis Engine's.

# Known Limitations

-   **VWAP, Volume Profile, Session Analysis, and true intraday
    Multi-Timeframe Analysis are architecturally blocked** by the
    current daily-only `Candle` model. They are excluded from
    S1-007–S1-012 and require a separate future intraday/tick data
    model proposal — they are not approximated under their real
    names.
-   **Elliott Wave and Wyckoff's Phase-schematic layer** use bounded
    multi-hypothesis search. The maximum number of alternate
    hypotheses tracked is a Decision Log item still requiring
    calibration; unbounded search is not authorized.
-   **ICT/SMC carry a disclosed, lower methodology confidence
    ceiling** than source-verified methodologies (Wyckoff, Dow Theory,
    classical indicators), reflecting the absence of any independent
    institutional verification — this is stated in their Provider's
    Limitations output, not hidden.
-   **Regime/Context Service thresholds** (ADX trending cutoff, ATR
    volatility percentile) are not yet calibrated against Zenith's own
    data; initial values are a Decision Log item pending Architecture
    Team input or backtested calibration.
-   **Intermarket Analysis, options-derived analytics, sentiment,
    macroeconomic, and news data are entirely out of scope** for this
    architecture. They require assets/data categories not present in
    Zenith's current market-data model and are candidates for a
    distinct future phase, not this one.
-   **Point-in-time determinism for Swing Detection and Regime/Context
    Service is a stated requirement of this document but is not yet
    implemented or verified** — it must be validated during S1-007
    before any Provider or Backtesting capability depends on it.
-   **`computationVersion` is specified but not yet implemented** — the
    versioning mechanism, ownership, and compatibility rules are fixed
    by this document and ADR-005/006 (see "Computation Versioning"),
    but the actual version-bump discipline can only be verified once
    S1-007 ships a first computation and, later, a first correction to
    it.
-   **The `MarketSeries`/`PriceSeries` translation adapter's exact
    implementation (the concrete class, its construction from Prisma
    query results) is an S1-007 implementation decision**, not fixed
    by this document — the field list itself, including the mandatory
    Data Quality metadata, is now fixed by "Anti-Corruption Layer"
    above (see "Additional Findings," Finding A, resolved).
-   **Trace Store retention/TTL values are specified as a model (see
    "Traceability") but not yet numerically calibrated** — exact
    durations are a Decision Log item at S1-008 implementation time.

# Architecture Diagrams

## Provider Execution Pipeline

```
 Candle/Quote data (Market Data domain)
       │
       ▼
 Anti-Corruption Layer → MarketSeries / PriceSeries
       │
       ▼
 Indicator Engine ──┐        (each: value + computation metadata
       │            │         + computationVersion)
       ▼            ▼
 Swing Detector → Regime/Context Service
       │                  │
       └────────┬─────────┘
                 ▼
   Provider Dependency Resolver (topological sort;
   dependencies referenced by Provider ID/token)
                 │
       ┌─────────┼─────────────┐
       ▼         ▼             ▼
  Fast-tier   Fast-tier    Slow-tier
  Provider    Provider     Provider
  (parallel)  (parallel)   (isolated, async;
  [circuit    [circuit      circuit breaker
   breaker]    breaker]      applies to all tiers)
       │         │             │
       └────┬────┴─────────────┘
            ▼
   normalize() per Provider
   (methodologyFamily self-declared)
            │
            ▼
     Confluence Engine
   (weighting + weightExplanation ·
    family grouping (Provider-declared, Confluence reads only) ·
    disagreement explanation (per normalized dimension, O(N)) ·
    participation reporting)
            │
            ▼
  contractVersion + computationVersion-tagged output
            │
            ▼
        Consumers
```

Observability (latency, failure rate, cache hit ratio, Provider
health, Confluence metrics — see "Operational Resilience &
Observability") is measured at every stage of this pipeline, not shown
as a separate box to keep the diagram readable.

## Confidence & Traceability Propagation

```
 Raw Data ──► MarketSeries ──► Indicator/Swing/Regime output ──► Provider Evidence
 (Market Data   (ACL; carries   (value + metadata +                    │
  domain)        Data Quality)   computationVersion)                  ▼
    │  (freshness)      │ (Data Quality inherited)      Detection Confidence
    │                   │                              Interpretation Confidence
    │                   │                              Regime-Adjusted Confidence
    │                   │                              Methodology Confidence Ceiling
    │                   │                                         │
    └───────────────────┴─────────────────────────────────────────┘
                         │
                         ▼
              Traceability record
   (raw refs · intermediate calcs + computationVersion ·
    condition derivations · confidence derivation)
                         │
                         ▼
                    Trace Store
        (immutable, retention/TTL-governed, ID-addressable)
                         │
                         ▼
     Confluence output (trace IDs; full chain on drill-down)
```

# References to ADR-005 / ADR-006 / ADR-007

-   **ADR-005 — Shared Deterministic Computation Infrastructure**
    (Indicator Engine, Swing Detection Infrastructure, Regime/Context
    Service). Formalizes the "centralize computation" half of this
    document, the Anti-Corruption Layer boundary (`MarketSeries`),
    mandatory computation metadata, and `computationVersion` ownership
    for all three services, including the internal note distinguishing
    the Regime/Context Service's research-driven provenance from the
    Indicator Engine's. *Status: Approved (Architecture Team, 2026-07-12).* See `12_ADR_INDEX.md`.
-   **ADR-006 — Analysis Provider Plugin Architecture & Standard
    Output Contract** (Evidence/Interpretation/Limitations,
    Traceability, Confidence Model, dependency-ordered execution,
    Provider Lifecycle). Formalizes the Analysis Provider Framework
    section of this document; establishes `normalize()` as part of
    the `AnalysisProvider` interface (its target vocabulary is defined
    by ADR-007, not this ADR); establishes token-based dependency
    references, self-declared `methodologyFamily`, the Provider
    circuit breaker, and `computationVersion` at the Provider level.
    *Status: Approved (Architecture Team, 2026-07-12).* See
    `12_ADR_INDEX.md`.
-   **ADR-007 — Confluence Architecture: Normalization &
    Weighting-Readiness** (Normalization vocabulary, `normalize()`
    target semantics and conformance requirements,
    `ConfluenceWeightStrategy` with mandatory `weightExplanation`,
    Provider-declared methodology-family grouping, dimension-level
    disagreement explanation). Formalizes the Normalization and
    Confluence Engine sections of this document. *Status: Approved
    (Architecture Team, 2026-07-12).* See `12_ADR_INDEX.md`.

# Additional Findings

Discovered while applying the Final Architecture Validation's Critical
and Recommended fixes above. Per the governing instruction for that
edit pass, these were **reported, not silently resolved** at the time
— each includes a severity, reasoning, a recommendation, and whether
implementation should stop because of it. Finding A has since been
resolved, by explicit instruction, in a follow-up edit (see below);
Findings B and C remain open and deferred to S1-008/S1-012 as
recommended.

## Finding A — `MarketSeries` / Data Quality Model interaction is unspecified — **RESOLVED**

-   **Severity:** High (at time of discovery).
-   **Reasoning:** The Data Quality Model section states "Indicator
    Engine output inherits the freshness of the candles/quotes it
    consumed." The Anti-Corruption Layer section, as first drafted,
    defined `MarketSeries` as an ordered series of `(timestamp, open,
    high, low, close, volume)` points with no stated freshness/
    staleness field. If `MarketSeries` did not carry this metadata
    forward, the Data Quality Model's inheritance chain would be
    severed at that boundary — a genuine internal contradiction
    between two sections of the same document, not a hypothetical
    future concern.
-   **Resolution:** "Anti-Corruption Layer" now specifies that
    `MarketSeries` carries both normalized market data and Data
    Quality metadata (`freshness`, age) as a first-class
    responsibility of the value object, translated from
    `Candle`/`MarketQuote` at the point of translation, using the
    staleness threshold already established by DEC-2026-009. The
    ownership, propagated fields, lifecycle, and bounded-context
    rationale are fully specified there. ADR-005 has been updated to
    state the same requirement. No open question remains.
-   **Should implementation stop because of it?** No longer applies —
    resolved prior to S1-007 authorization, as recommended.

## Finding B — Provider Lifecycle × Computation Versioning interaction is undefined

-   **Severity:** Medium.
-   **Reasoning:** "Provider Lifecycle" defines ACTIVE/DEPRECATED/
    RETIRED. "Computation Versioning" defines how `computationVersion`
    increments. Neither states whether a DEPRECATED Provider's
    `computationVersion` may still increment (e.g. to fix a bug
    affecting the accuracy of historical Backtesting runs that still
    reference it) or whether it is frozen the moment a Provider leaves
    ACTIVE status.
-   **Recommendation:** State explicitly (in ADR-006, at S1-008
    drafting) that a DEPRECATED Provider's `computationVersion` may
    still increment for corrections needed to keep historical
    Backtesting results accurate, while a RETIRED Provider's
    `computationVersion` is permanently frozen at its last-active
    value.
-   **Should implementation stop because of it?** No. Provider
    Lifecycle does not exist until S1-008; this can be resolved at
    ADR-006 finalization without affecting S1-007 authorization.

## Finding C — Dimension-level disagreement explanation may weaken drill-down attribution

-   **Severity:** Medium.
-   **Reasoning:** Moving disagreement explanation from pairwise
    Provider comparison to the normalized-dimension level (this edit
    pass's fix for the O(N²) risk) is the right complexity trade-off,
    but as specified it does not say whether the per-dimension
    explanation names *which* Providers contributed to each side of
    the disagreement. Full traceability is still recoverable via
    drill-down into each Provider's own trace record, but the
    immediate, at-a-glance explanation — read precisely when a trader
    most wants clarity, i.e. when Providers disagree — could feel less
    actionable without at least partial Provider attribution.
-   **Recommendation:** Specify, at ADR-007/S1-012, that each
    per-dimension disagreement explanation includes a bounded list
    (e.g. up to the top 3 by confidence) of representative
    contributing Providers per side — preserving the O(N × 7)
    complexity bound (a fixed small constant per dimension, not a
    function of total Provider count) while restoring useful
    drill-down context in the explanation itself.
-   **Should implementation stop because of it?** No. This refines an
    already-adopted design; it does not block S1-007 and can be
    resolved by S1-012 (Confluence Engine) implementation.

# Related Documents

-   05_ARCHITECTURE.md
-   06_PROJECT_CONSTITUTION.md
-   08_ROADMAP.md
-   09_PROJECT_BRAIN.md
-   11_DECISION_LOG.md
-   12_ADR_INDEX.md
-   documentation/zos/sprints/S1-006_SPRINT_BRIEF.md (Explainability/
    Confidence/Data-Quality precedent this document extends)
