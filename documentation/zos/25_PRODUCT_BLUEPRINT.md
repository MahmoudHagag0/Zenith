# 25_PRODUCT_BLUEPRINT

**Document ID:** ZOS-025
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

This is the Zenith Product Blueprint — the execution map every future
designer and engineer follows to convert `24_ZENITH_PRODUCT_CONSTITUTION.md`
(ZOS-024, frozen and governing) into buildable work. This document
treats the Constitution as immutable: it does not revisit, reinterpret,
or extend any Vision, Mission, Product DNA, Trader Psychology, Design
Philosophy, Screen Philosophy, AI Personality, Decision Philosophy,
Product Rule, Design Constitution, or Implementation Constitution
statement. Every reference below to a Constitution section is a
citation, not a restatement subject to change here.

This is not a UI design, not a component library, not a visual system,
and not framework-specific (no React, no Flutter, no Figma). It defines
**what exists, what depends on what, in what order it should be built,
and what is explicitly excluded from the first release** — nothing
about how any of it should look.

Per `24_ZENITH_PRODUCT_CONSTITUTION.md` §10.1/§10.3, this Blueprint
defines only the nine already-approved product areas; it introduces no
new one and authorizes no expansion of the approved product surface.

------------------------------------------------------------------------

# 1. Product Overview

Zenith's product is organized around three functional layers, mapped
directly onto the Constitution's own User Journey Philosophy (§9) and
onto engineering components that already exist:

- **Evidence Layer** (already built, internal only, no HTTP surface
  today): `MarketSeries` Anti-Corruption Layer, the nine registered
  Analysis Providers, and the Confluence Engine
  (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, `23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`).
  This layer produces disclosed evidence, interpretation, Confidence,
  and Traceability — never a recommendation (Constitution §3.1).
- **Synthesis Layer** (net-new): the layer this Blueprint's own
  Implementation Order (§10) treats as highest priority — a read-only
  Consumer exposing Evidence Layer output, plus a Narrative Composer
  that turns structured Confluence output into the story-before-chart
  synthesis Constitution §12.1 requires.
- **Trader Surface Layer**: the nine approved product areas (§2 below),
  each a distinct way a trader enters, reads, or records against the
  Synthesis Layer's own output. Dashboard (Home) is this layer's own
  hub (§4).

Every product area is a consumer of the Evidence Layer, directly or by
way of the Synthesis Layer — no product area invents its own parallel
analysis, and none produces a recommendation, per Constitution §3.1/§3.3.

------------------------------------------------------------------------

# 2. Product Areas

Per Constitution §10.1's own framework, each area below is defined
**only** in the seven fields this Blueprint adds for implementation
planning (Purpose, Inputs, Outputs, Dependencies, Priority, Entry
Points, Exit Points) — Constitution §10.2 already states each area's own
Purpose/Psychological Objective/Business Objective/Success Criteria and
is not repeated here. Priority uses three tiers, applied consistently
with §8 (MVP Definition): **P0** (first release), **P1** (fast follow),
**P2** (future roadmap).

## Dashboard (Home)

- **Inputs:** Confluence Engine output (via the Synthesis Layer's own
  Consumer, §7), Trading Analytics (existing `analytics` module, S1-006),
  Portfolio/Position summary (existing `portfolios`/`positions`
  modules), Watchlist state (existing `watchlists` module), pending
  Alerts (once built).
- **Outputs:** a synthesized decision-readiness view; navigation into
  every other product area.
- **Dependencies:** Confluence Engine Consumer (net-new, §7); Analytics,
  Portfolios, Positions, Watchlists (all already built).
- **Priority:** P0.
- **Entry Points:** session start (direct navigation); the "return to
  Dashboard" exit offered by every other area (§4).
- **Exit Points:** Morning Brief, Watchlist, Portfolio, Alerts, Calendar
  / News, COT & Reports, AI Workspace, Trading Journal.

## Morning Brief

- **Inputs:** Confluence Engine output across the trader's own Watchlist
  instruments (via the Consumer); the prior session's own Trading
  Journal entries, once that area exists, for Learning-loop continuity
  (Constitution §9.6); Calendar/News, once that area exists.
- **Outputs:** a ranked, evidence-first narrative synthesis — story
  before chart (Constitution §12.1) — of what changed and what matters,
  produced by the Narrative Composer (§7), not a generative/conversational
  layer in V1 (see §8).
- **Dependencies:** Confluence Engine Consumer (net-new), Narrative
  Composer (net-new), Watchlist (already built). Calendar/News is an
  optional input, not a hard dependency, for V1.
- **Priority:** P0.
- **Entry Points:** Dashboard (primary); direct morning routine.
- **Exit Points:** Watchlist/Portfolio (per-instrument follow-through),
  AI Workspace.

## Trading Journal

- **Inputs:** trader-entered decision records; linked Position/
  Transaction data (existing `positions` module) for factual context;
  the disclosed evidence/Confidence/Traceability a decision was based
  on, where available.
- **Outputs:** a reviewable decision history (Constitution §9.5) and
  process-pattern surfacing that feeds the Learning phase (§9.6) and,
  once built, Morning Brief's own continuity input.
- **Dependencies:** a net-new Journal Entry data model and CRUD surface
  (does not exist today — no Prisma model, no module); Positions/
  Transactions (already built, consumed as factual context only).
- **Priority:** P1.
- **Entry Points:** Dashboard, Portfolio (record a decision about a
  position), AI Workspace (record the AI's own disclosed reasoning).
- **Exit Points:** the referenced Position/instrument's own context.

## Watchlist

- **Inputs:** Market Data (existing `market-data` module: search, asset
  lookup, quotes, candles); the trader's own add/remove actions.
- **Outputs:** a tracked-instrument list; once the Consumer exists,
  each entry annotated with its own current Confluence reading.
- **Dependencies:** Watchlists module (already built, full CRUD);
  Market Data (already built); Confluence Engine Consumer (net-new, for
  the annotation only — Watchlist management itself has zero new
  dependency).
- **Priority:** P0.
- **Entry Points:** Dashboard, Morning Brief (an instrument mentioned
  there links to its own Watchlist entry).
- **Exit Points:** Portfolio (if a position exists on that instrument),
  AI Workspace, Alerts configuration (once built).

## Portfolio

- **Inputs:** Portfolios/Positions/Transactions (already built); Trading
  Analytics (existing `analytics` module — P&L, risk exposure, Health
  Score, Decision Readiness, Data Quality/Confidence, S1-006); Confluence
  Engine output for each held instrument, once the Consumer exists.
- **Outputs:** a neutral (Constitution §5.2, §7.3) view of current
  holdings and their evidentiary state.
- **Dependencies:** Portfolios, Positions, Transactions, Analytics (all
  already built); Confluence Engine Consumer (net-new, for per-position
  evidentiary annotation).
- **Priority:** P0.
- **Entry Points:** Dashboard, Watchlist (where a position exists on a
  watched instrument).
- **Exit Points:** Trading Journal (record a decision about a position),
  AI Workspace.

## Alerts

- **Inputs:** Confluence Engine output (via the Consumer); the trader's
  own configured alert conditions; the Watchlist/Portfolio instrument
  set.
- **Outputs:** notifications tied to disclosed evidentiary change, never
  manufactured urgency (Constitution §5.2, §10.2).
- **Dependencies:** Confluence Engine Consumer (net-new); a net-new
  Alert Rule data model, an evaluation loop, and a delivery mechanism
  (none exist today — the closest existing precedent is Market Data's
  own `@nestjs/schedule` background sync job, S1-005, a reusable
  pattern, not existing infrastructure this area can consume directly).
- **Priority:** P2.
- **Entry Points:** Dashboard (summary), Watchlist/Portfolio (per-
  instrument configuration).
- **Exit Points:** the triggering instrument's own Watchlist/Portfolio/
  Morning-Brief context.

## Calendar / News

- **Inputs:** an external news/economic-calendar data source — **no
  vendor is selected**, the same category of open decision already
  disclosed for real market data (ADR-003, S1-005: only a simulated
  provider is approved today); Watchlist instrument set.
- **Outputs:** disclosed, attributed evidence entries surfaced in
  Morning Brief and per-instrument views — explicitly evidence, never a
  conclusion (Constitution §4.1, §10.2).
- **Dependencies:** a net-new external vendor integration, requiring its
  own future ADR before any implementation, mirroring ADR-003's own
  precedent; Watchlist (already built).
- **Priority:** P2.
- **Entry Points:** Dashboard, Morning Brief.
- **Exit Points:** the relevant instrument's own context.

## COT & Reports

- **Inputs:** an external structured-report data source (e.g. CFTC
  Commitments of Traders) — **no vendor/source is selected**.
- **Outputs:** raw, attributed report data, explicitly distinguished
  from any Analysis Provider's own interpretation of it (Constitution
  §10.2's own Success Criteria for this area).
- **Dependencies:** a net-new external vendor integration (its own
  future ADR, same category as Calendar/News); the Analysis Provider
  Framework, only if some future Provider is later built to consume
  this as evidence (none currently does — out of this Blueprint's own
  scope, §9).
- **Priority:** P2.
- **Entry Points:** Dashboard, per-instrument Watchlist/Portfolio view.
- **Exit Points:** the relevant instrument's own context.

## AI Workspace

- **Inputs:** the trader's own natural-language question; Confluence
  Engine output and Traceability for the instrument(s) in question; the
  AI Personality specification (Constitution §11) governing response
  behavior.
- **Outputs:** calibrated, evidence-traceable responses that lead with
  the conclusion, disclose confidence by kind, and disclose uncertainty
  prominently (Constitution §11.1-§11.6).
- **Dependencies:** Confluence Engine Consumer (net-new); Traceability
  (already built, per-request, in-memory only — S1-008/S1-012); a
  net-new generative AI Reasoning Layer implementing Constitution §11's
  own persona (Constitution §15.6: "a product-behavior specification,
  not a prompt" — the actual response-generation engineering is a
  distinct, not-yet-built component).
- **Priority:** P1.
- **Entry Points:** Dashboard, Morning Brief, any per-instrument "ask
  about this" invocation.
- **Exit Points:** back to the originating product area; Trading
  Journal (record the AI's own disclosed reasoning as part of a
  decision entry, once Journal exists).

------------------------------------------------------------------------

# 3. User Flow

The Constitution's own User Journey Philosophy (§9) names six phases:
Morning, Analysis, Decision, Execution, Review, Learning. This
Blueprint maps those phases onto the concrete product areas above.
Note: Constitution §9.4 ("Execution") is explicitly scoped to *recording*
a decision, since Zenith is not a trade-execution venue (§3.1, §3.3,
and no product area above provides order routing). This Blueprint
therefore labels the operational phase between Decision and Review as
**Monitoring** — the ongoing watch of open positions and tracked
instruments — as this Blueprint's own operational elaboration of §9.4
for the product surface that actually exists; it does not change or
add to the Constitution's own six named phases.

1. **Morning** → Dashboard, then Morning Brief (Constitution §9.1).
2. **Analysis** → Watchlist (per-instrument Confluence review), AI
   Workspace (Constitution §9.2).
3. **Decision** → AI Workspace (confidence/uncertainty review), Trading
   Journal (recording intent and reasoning) (Constitution §9.3).
4. **Monitoring** → Portfolio, Watchlist, Alerts — the continuous watch
   of open positions and tracked instruments between a recorded
   decision and its later Review.
5. **Review** → Trading Journal, Portfolio (Constitution §9.5).
6. **Learning** → Trading Journal (pattern surfacing), feeding the next
   day's own Morning Brief (Constitution §9.6) — the loop closes here,
   not a one-off report.

------------------------------------------------------------------------

# 4. Navigation Blueprint

Hierarchy and relationships only — no visual design. Dashboard (Home)
is the hub; every other area is reachable from it and always offers a
path back to it (never a dead end, consistent with Constitution §5.2's
calm-interface obligation).

```
Dashboard (Home)                         [root / hub]
├── Morning Brief                        [session-start gateway]
│   └── → Dashboard, Watchlist, AI Workspace
├── Watchlist
│   └── → Portfolio (if a position exists), AI Workspace,
│         Alerts (configuration, once built), Dashboard
├── Portfolio
│   └── → Watchlist (instrument), Trading Journal (record),
│         AI Workspace, Dashboard
├── Trading Journal
│   └── → the referenced Position/instrument's own context, Dashboard
├── Alerts
│   └── → the triggering instrument's Watchlist/Portfolio context,
│         Dashboard
├── Calendar / News
│   └── → the relevant instrument's own context, Dashboard
├── COT & Reports
│   └── → the relevant instrument's own context, Dashboard
└── AI Workspace
    └── → any referenced instrument/position/journal entry,
          the originating area, Dashboard
```

**Navigation rule:** no product area is reachable only through another
non-Dashboard area — every area has a direct entry point from Dashboard
in addition to any contextual (per-instrument) entry point listed in §2.

------------------------------------------------------------------------

# 5. Information Flow

The governing pipeline, with each stage's own build status disclosed —
this is the single most load-bearing fact in this Blueprint, since it
determines §7 (Feature Dependency Map), §8 (MVP), and §10
(Implementation Order):

```
Market Data                                    [EXISTS — S1-005]
   ↓
Analysis Providers (×9)                        [EXISTS — S1-009→S1-018]
   ↓
Confluence Engine                              [EXISTS — S1-012]
   ↓
Confluence Engine Consumer                     [NET-NEW — §7]
   ↓
Narrative Composer (deterministic, V1)         [NET-NEW — §7, §8]
   ↓
Morning Brief
   ↓
Dashboard
   ↓
Trading Journal                                [P1 — requires new data model]
   ↓
Learning (feeds back into the next Morning Brief — Constitution §9.6)
```

The first three stages are already built and require no engineering
work to reach parity with this pipeline — they already produce
per-request Traceability, the four-part Confidence taxonomy, and
methodology-family-aware agreement/disagreement, per
`22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Everything from the Confluence
Engine Consumer onward is net-new. A separate, later stage — the
generative AI Reasoning Layer (§2, AI Workspace; §8) — consumes the
same Confluence Engine Consumer output but is not part of the V1
pipeline above; it is documented separately in §6.

------------------------------------------------------------------------

# 6. AI Interaction Flow

How a trader interacts with Zenith's own embedded AI Assistant
(Constitution §11), most directly in AI Workspace but invocable
contextually from other areas (§2, §4):

1. The trader poses a question — directly in AI Workspace, or via a
   contextual "ask about this" invocation from Watchlist, Portfolio, or
   Morning Brief.
2. The system resolves the relevant instrument(s) and pulls the
   Confluence Engine Consumer's own current output and Traceability for
   them.
3. The AI Reasoning Layer composes a response governed by Constitution
   §11 in full: leads with the conclusion (§11.2, mirroring §12.1's
   story-before-chart discipline applied to language), discloses which
   specific kind of Confidence is being reported and why (§11.4, §6.5),
   states uncertainty as prominently as confidence (§11.3), and never
   manufactures urgency (§11.1, §11.5).
4. The trader may drill into the same Traceability record the response
   was built from (already built, per-request, S1-008/S1-012) — the
   first time this data is surfaced to a trader rather than only to
   engineering.
5. The trader may exit back to the originating area, or — once Trading
   Journal exists (P1) — record the AI's own disclosed reasoning as
   part of a decision entry.

This flow depends on the Confluence Engine Consumer (§7) and the
generative AI Reasoning Layer (§7, §8) — both net-new, and both
distinct from the Narrative Composer that powers Morning Brief's own
V1 (§5), which is deterministic and does not use this flow.

------------------------------------------------------------------------

# 7. Feature Dependency Map

## 7.1 Foundational Components

| Component | Status | Powers |
|---|---|---|
| Confluence Engine Consumer (read-only exposure of existing Analysis Provider + Confluence output) | **NET-NEW** | Dashboard, Morning Brief, Watchlist (annotation), Portfolio (annotation), Alerts, AI Workspace |
| Narrative Composer (deterministic, template-based synthesis over the Consumer's own structured output — no generative model) | **NET-NEW** | Morning Brief (V1) |
| Generative AI Reasoning Layer (conversational, Constitution §11 persona, model-backed) | **NET-NEW** | AI Workspace; a future, richer Morning Brief |
| Trading Journal data model + CRUD | **NET-NEW** | Trading Journal |
| Alert Rule data model + evaluation job + delivery mechanism | **NET-NEW** | Alerts |
| External Calendar/News vendor integration (requires its own future ADR) | **NET-NEW, blocked** | Calendar / News |
| External COT/Report vendor integration (requires its own future ADR) | **NET-NEW, blocked** | COT & Reports |

## 7.2 Product Area Dependencies

| Product Area | Depends On |
|---|---|
| Dashboard (Home) | Confluence Engine Consumer; Analytics, Portfolios, Positions, Watchlists (existing) |
| Morning Brief | Confluence Engine Consumer; Narrative Composer; Watchlist (existing) |
| Watchlist | Market Data (existing); Confluence Engine Consumer (annotation only) |
| Portfolio | Portfolios, Positions, Transactions, Analytics (existing); Confluence Engine Consumer (annotation only) |
| Trading Journal | Trading Journal data model; Positions/Transactions (existing, context only) |
| Alerts | Confluence Engine Consumer; Alert Rule model + evaluation job |
| Calendar / News | External vendor integration |
| COT & Reports | External vendor integration |
| AI Workspace | Confluence Engine Consumer; Traceability (existing); Generative AI Reasoning Layer |

The Confluence Engine Consumer is the single most-depended-upon net-new
component — six of nine product areas require it directly. This
directly determines §10's own Implementation Order.

------------------------------------------------------------------------

# 8. MVP Definition

**Version 1 (MVP) consists of exactly these four product areas:**
Dashboard (Home), Morning Brief, Watchlist, Portfolio.

V1 is deliberately scoped to require only **two net-new backend
components** — the Confluence Engine Consumer and the (deterministic,
non-generative) Narrative Composer — on top of Market Data, the nine
Analysis Providers, the Confluence Engine, Portfolios, Positions,
Transactions, Watchlists, and Trading Analytics, all of which already
exist and are already fully tested (`23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`).
This is the most direct realization of that Phase Closure document's
own recommendation: let the nine already-built Providers be seen,
before adding further surface.

**Explicitly excluded from V1, in priority order for what follows it:**

- **Fast Follow (P1):** Trading Journal (requires a new data model);
  AI Workspace and its own Generative AI Reasoning Layer (requires a
  new, materially larger engineering component distinct from the
  Narrative Composer).
- **Future Roadmap (P2):** Alerts (requires a new rule/evaluation/
  delivery stack); Calendar/News and COT & Reports (each blocked on a
  vendor-selection ADR that has not been made, the same category of
  open decision already disclosed for real market data itself, ADR-003).

------------------------------------------------------------------------

# 9. Out of Scope

The following must **not** be implemented during MVP (V1), stated
explicitly per this Blueprint's own instruction to define exclusions
clearly rather than leave them implicit:

1. **Any UI, visual design, component library, or styling decision** —
   entirely out of this Blueprint's own scope; a distinct future phase.
2. **Real trade execution or order routing of any kind, at any point** —
   not a V1 exclusion but a permanent one: Zenith is not an execution
   venue (Constitution §3.1, §3.3, §9.4).
3. **The generative/conversational AI Reasoning Layer** — Morning Brief
   V1 uses the deterministic Narrative Composer only (§7, §8).
4. **Trading Journal** (P1, not V1).
5. **AI Workspace** (P1, not V1).
6. **Alerts**, including any rule engine, evaluation job, or
   notification delivery (P2).
7. **Calendar / News** (P2, blocked on an unmade vendor-selection ADR).
8. **COT & Reports** (P2, blocked on an unmade vendor-selection ADR).
9. **Any real external market-data vendor** — simulated data remains
   the only approved source (ADR-003); resolving this is not this
   Blueprint's own scope.
10. **Differential Confluence weighting** — `EqualWeightStrategy`
    remains the only implementation (DEC-2026-016); unchanged by this
    Blueprint.
11. **Trace Store persistence** — Traceability remains per-request and
    in-memory; the Consumer surfaces it live, never stores history.
12. **Multi-timeframe analysis** — architecturally blocked (daily-bar-
    only `MarketSeries`), unchanged by this Blueprint.
13. **Any expansion of the nine approved product areas** — requires its
    own leadership approval per Constitution §10.3, not authorized here.

------------------------------------------------------------------------

# 10. Implementation Order

Recommended engineering sequence, derived directly from §7's own
dependency map — each step unblocks the next:

1. **Confluence Engine Consumer** — read-only HTTP exposure of the
   already-built, already-tested Analysis Provider and Confluence
   Engine output. The single highest-leverage step; every other item
   below depends on it directly or indirectly.
2. **Narrative Composer** — deterministic, template-based synthesis
   over the Consumer's own structured output (dimension readings,
   top-3 contributor attribution, Confidence values already produced
   by the Confluence Engine, S1-012).
3. **Dashboard (Home)** — composition layer over the Consumer plus the
   already-built Analytics/Portfolios/Watchlists APIs.
4. **Watchlist enrichment** — annotate the already-built Watchlist
   entries with the Consumer's own per-instrument reading (Watchlist
   CRUD itself requires no new work).
5. **Portfolio enrichment** — the same annotation pattern applied to
   the already-built Portfolio/Position views.
6. **Morning Brief** — full assembly, using steps 1-2 plus the
   Watchlist's own instrument set.
7. **Trading Journal** — new data model, CRUD, and Position/Transaction
   linkage (P1).
8. **Generative AI Reasoning Layer and AI Workspace** — the Constitution
   §11 persona's own engineering implementation (P1).
9. **Alerts** — rule model, evaluation job, delivery mechanism (P2).
10. **Calendar / News** — vendor-selection ADR, then integration (P2).
11. **COT & Reports** — vendor-selection ADR, then integration (P2).

Steps 1-6 constitute the MVP (§8). Steps 7-11 are Fast Follow/Future
Roadmap, in the priority order already established in §7-§9.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 — the
  governing authority this Blueprint implements against, unmodified)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-003 — the vendor-integration
  precedent Calendar/News and COT & Reports must each follow)
- `documentation/zos/11_DECISION_LOG.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/00_INDEX.md`
