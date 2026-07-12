# 22_ANALYSIS_ENGINE_ARCHITECTURE

**Document ID:** ZOS-022\
**Version:** 1.0.0\
**Status:** Proposed — pending ADR-005 / ADR-006 / ADR-007 approval\
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

# Overall Architecture

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ Data Layer (existing)                                           │
 │ Candle (daily OHLCV) · MarketQuote · Portfolio/Position          │
 └───────────────────────────────┬───────────────────────────────--┘
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

# Analysis Provider Framework

A registry of independently pluggable Analysis Providers, each
implementing the same `AnalysisProvider` contract.

-   **Registration:** NestJS multi-provider pattern — each Provider is
    registered as a class; a factory provider injects the full set and
    exposes it as an array, following the same pattern already used
    for provider-set composition elsewhere in the codebase.
-   **Dependency declaration:** a Provider may declare a dependency on
    another Provider's output (e.g. VSA depends on Wyckoff's active
    range). The framework performs a topological sort over declared
    dependencies before invocation; it does not assume all Providers
    are mutually independent, since at least one approved
    relationship (VSA → Wyckoff) already is not.
-   **Execution tiers:** Providers are tagged fast-tier or slow-tier.
    A slow-tier Provider (e.g. Elliott Wave's multi-hypothesis search)
    must never block the response of fast-tier Providers; slow-tier
    results may be delivered incrementally or on a separate channel.
-   **Partial failure:** a missing, timed-out, or errored Provider is
    explicitly reported as non-participating, never silently treated
    as agreeing or neutral. Aggregation downstream must be able to
    distinguish "5 of 7 Providers say bullish" from "5 of 5 available
    Providers say bullish, 2 were unavailable."
-   **Graceful data degradation is mandatory, not conventional.** A
    Provider facing missing or unusable input data must return a
    populated `Limitations` entry describing the gap; it must never
    throw.

# Evidence / Interpretation / Limitations Contract

The standard shape every Analysis Provider returns:

-   **`contractVersion`** — mandatory on every output. Enables future
    consumers (Risk Engine, Decision Engine, AI Engine) to be
    introduced without every existing Provider needing simultaneous
    redeployment when the contract changes.
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

-   Raw data references (which candles/quotes were read).
-   Intermediate calculations (which Indicator Engine / Swing Detector
    / Regime Service outputs were used, with their own parameters).
-   Condition derivations (which detected/missing conditions produced
    the Evidence).
-   Confidence derivation (what inputs produced the stated confidence).

At the Confluence Engine boundary, full per-Provider trace chains are
**referenced, not embedded**, in the default response — a Confluence
result carries trace IDs for each contributing Provider; the full
chain is fetched only on explicit drill-down request. This keeps
response payloads bounded as the number of contributing Providers
grows toward 50+.

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
-   Staleness/freshness metadata propagates end-to-end: Indicator
    Engine output inherits the freshness of the candles/quotes it
    consumed; Provider output inherits the freshness of every
    Indicator/Swing/Regime input it used; Confluence output reports
    the weakest Data Quality among its contributing Providers.
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
    contract.
-   **Methodology-family grouping is mandatory from the first release,
    not deferred until real weighting exists.** Providers derived from
    overlapping lineages (e.g. the merged ICT/SMC Provider and any
    Supply/Demand-tagged zone evidence) are grouped so that agreement
    among near-duplicate methodologies is never counted as
    independent confirmation. This directly protects the Trust Model:
    equal weighting alone is insufficient to prevent false confidence
    from correlated Providers.
-   **Disagreement is surfaced, not resolved.** When normalized signals
    conflict, the Confluence output includes a structured
    disagreement-explanation field distinguishing "expected
    disagreement" (e.g. trend-following vs. mean-reversion evidence on
    the same instrument) from unexpected inconsistency, informed by
    the Methodology Conflict Matrix produced during Analysis Engine
    research.
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
    interface, register it, cite its original source. No existing
    indicator or Provider changes.
-   **New Analysis Provider:** implement `AnalysisProvider`
    (Evidence/Interpretation[]/Limitations, Traceability, Confidence,
    `normalize()`), declare any dependency on another Provider's
    output, register via module import. No existing Provider changes.
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
    stated under Swing Detection and Regime/Context Service. This is a
    hard prerequisite for trustworthy backtesting, not an optional
    refinement.
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

# Architecture Diagrams

## Provider Execution Pipeline

```
 Candle/Quote data
       │
       ▼
 Indicator Engine ──┐
       │            │
       ▼            ▼
 Swing Detector → Regime/Context Service
       │                  │
       └────────┬─────────┘
                 ▼
   Provider Dependency Resolver (topological sort)
                 │
       ┌─────────┼─────────────┐
       ▼         ▼             ▼
  Fast-tier   Fast-tier    Slow-tier
  Provider    Provider     Provider
  (parallel)  (parallel)   (isolated, async)
       │         │             │
       └────┬────┴─────────────┘
            ▼
   normalize() per Provider
            │
            ▼
     Confluence Engine
   (weighting · family grouping ·
    disagreement explanation ·
    participation reporting)
            │
            ▼
  contractVersion-tagged output
            │
            ▼
        Consumers
```

## Confidence & Traceability Propagation

```
 Raw Data ──► Indicator/Swing/Regime output ──► Provider Evidence
    │  (freshness)      │ (Data Quality inherited)     │
    │                   │                              ▼
    │                   │                    Detection Confidence
    │                   │                    Interpretation Confidence
    │                   │                    Regime-Adjusted Confidence
    │                   │                    Methodology Confidence Ceiling
    │                   │                              │
    └───────────────────┴──────────────────────────────┘
                         │
                         ▼
              Traceability record
   (raw refs · intermediate calcs · condition derivations ·
    confidence derivation)
                         │
                         ▼
     Confluence output (trace IDs; full chain on drill-down)
```

# References to ADR-005 / ADR-006 / ADR-007

-   **ADR-005 — Shared Deterministic Computation Infrastructure**
    (Indicator Engine, Swing Detection Infrastructure, Regime/Context
    Service). Formalizes the "centralize computation" half of this
    document. *Status: drafting.*
-   **ADR-006 — Analysis Provider Plugin Architecture & Standard
    Output Contract** (Evidence/Interpretation/Limitations,
    Traceability, Confidence Model, dependency-ordered execution,
    Provider Lifecycle). Formalizes the Analysis Provider Framework
    section of this document. *Status: not yet drafted.*
-   **ADR-007 — Confluence Architecture: Normalization &
    Weighting-Readiness** (Normalization vocabulary, `normalize()`
    ownership model, `ConfluenceWeightStrategy`, methodology-family
    grouping). Formalizes the Normalization and Confluence Engine
    sections of this document. *Status: not yet drafted.*

# Related Documents

-   05_ARCHITECTURE.md
-   06_PROJECT_CONSTITUTION.md
-   08_ROADMAP.md
-   09_PROJECT_BRAIN.md
-   11_DECISION_LOG.md
-   12_ADR_INDEX.md
-   documentation/zos/sprints/S1-006_SPRINT_BRIEF.md (Explainability/
    Confidence/Data-Quality precedent this document extends)
