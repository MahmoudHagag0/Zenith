# 26_DASHBOARD_HOME_SPECIFICATION

**Document ID:** ZOS-026
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review (this specification authorizes no code; per its own governing instruction, implementation begins only after explicit approval)
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

This is the Dashboard (Home) Experience Specification — the first
implementation specification produced under Phase 2, treated as the
**Golden Reference** every future screen specification will follow in
structure and rigor. It translates `24_ZENITH_PRODUCT_CONSTITUTION.md`
(frozen) and `25_PRODUCT_BLUEPRINT.md` (frozen) into an executable
component architecture for engineering. It contains no visual design,
no color, no styling, no animation, no framework code, and no UI
mockup — those are Product Leadership's own future deliverable. Every
component below is derived from an already-approved source (cited
inline); where no prior decision covers a needed detail, this document
says `TODO` rather than inventing one.

# Scope Boundary

This specification covers **Dashboard (Home) only** — the product area
defined at `24_ZENITH_PRODUCT_CONSTITUTION.md` §10.2 and
`25_PRODUCT_BLUEPRINT.md` §2. It does not specify Morning Brief,
Watchlist, Portfolio, or any other product area's own internal
component architecture — each is cross-referenced here only at its own
Dashboard-facing boundary (its Entry component). Per the Blueprint's own
MVP Definition (§8) and Implementation Order (§10), only three other
areas are built in V1 alongside Dashboard: Morning Brief, Watchlist,
Portfolio. This specification's own component set reflects that
phasing explicitly (§2, Component Hierarchy) rather than assuming all
nine approved areas are simultaneously available.

------------------------------------------------------------------------

# 1. Governing Inputs (Citations, Not Restatements)

- **Purpose, Psychological Objective, Business Objective, Success
  Criteria** for Dashboard (Home): `24_ZENITH_PRODUCT_CONSTITUTION.md`
  §10.2. Success Criteria specifically: *"a trader can state their own
  current decision-readiness shortly after arrival, without manually
  cross-referencing other screens."* This single sentence is the
  primary design constraint every component below is checked against.
- **Inputs/Outputs/Dependencies/Priority/Entry/Exit Points**:
  `25_PRODUCT_BLUEPRINT.md` §2 (Dashboard (Home)), §7 (Feature
  Dependency Map), §8 (MVP Definition — Dashboard is one of exactly
  four V1 areas).
- **Design Constitution rule 6** (`24_ZENITH_PRODUCT_CONSTITUTION.md`
  §14): *"The single most decision-relevant element on a screen has the
  strongest visual weight, placed in the highest-attention region."*
  This binds the Component Hierarchy's own priority ordering (§2 below).
- **Design Constitution rule 8**: *"Every Confidence or uncertainty
  disclosure required by §13 has an equivalent, consistently-styled
  visual treatment across all screens."* This is why Confidence/
  Uncertainty disclosure is specified once, as a shared component
  (DASH-003), reused rather than reinvented per screen.
- **Product Rules 6, 7, 9, 10** (§13): Explain confidence; explain
  uncertainty; no-trade is a valid outcome; evidence precedes
  visualization. These bind every data-bearing component's own Empty/
  Success State definitions below.
- **Trader Psychology** (§6: Cognitive Load, Decision Fatigue,
  Attention) governs Information Priority ordering and the decision not
  to surface all nine product areas as equally-weighted, data-bearing
  widgets simultaneously (§2, Component Hierarchy rationale).

------------------------------------------------------------------------

# 2. Component Hierarchy

```
DASH-001  Dashboard Page Container                          [root]
├── DASH-002  Decision Readiness Summary                     [P0 — hero]
│     └── DASH-003  Confidence & Uncertainty Disclosure       [shared]
├── DASH-004  Morning Brief Entry                             [P0]
├── DASH-005  Watchlist Snapshot                              [P0]
│     └── DASH-003  Confidence & Uncertainty Disclosure       [shared, reused]
├── DASH-006  Portfolio Snapshot                              [P0]
│     └── DASH-003  Confidence & Uncertainty Disclosure       [shared, reused]
├── DASH-007  Trading Journal Entry (Placeholder)             [P1]
├── DASH-008  AI Workspace Entry (Placeholder)                [P1]
├── DASH-009  Alerts Indicator (Placeholder)                  [P2]
├── DASH-010  Calendar / News Snapshot (Placeholder)          [P2]
└── DASH-011  COT & Reports Snapshot (Placeholder)            [P2]
```

**Why this shape, not nine equally-weighted widgets:** Blueprint §8
scopes V1 to exactly Dashboard, Morning Brief, Watchlist, Portfolio.
The other five approved areas (Trading Journal, AI Workspace, Alerts,
Calendar/News, COT & Reports) have no backend to summarize yet
(`25_PRODUCT_BLUEPRINT.md` §7.1 — each depends on a net-new component
not yet built). Rendering five data-bearing widgets with nothing to
show would itself violate Constitution §6.1 (Cognitive Load) and
Product Rule 3 (reduce cognitive load) by adding visual elements that
carry no decision value. DASH-007 through DASH-011 are therefore
specified as structural placeholders only (§2.7–§2.11 below), not
functional summaries — this is a direct, cited consequence of the
Blueprint's own phasing, not an invented UX simplification.

**Why DASH-002 is the hero, not a list of equally-sized cards:**
Design Constitution rule 6 requires the single most decision-relevant
element to carry the strongest visual weight. Constitution §10.2's own
Success Criteria names decision-readiness specifically as what a trader
must be able to state "without manually cross-referencing other
screens" — this makes Decision Readiness Summary the one component that
directly satisfies the Success Criteria in isolation; every other
component supports or extends it.

------------------------------------------------------------------------

# 3. Component Specifications

## DASH-001 — Dashboard Page Container

- **Purpose:** the structural root that composes every other Dashboard
  component and owns page-level orchestration (which components mount,
  in what order, and how independent data failures are isolated).
- **Why It Exists:** every screen needs exactly one composition root;
  isolating orchestration here keeps every child component
  independently testable and independently failable (§ States below).
- **Priority Level:** P0 (structural — required for any other component
  to exist).
- **Information Priority:** N/A — this component renders no data of its
  own; it is a layout/composition boundary only.
- **Inputs:** the authenticated trader's own identity (existing JWT
  auth, `apps/api/src/auth`) — used only to scope which Watchlist/
  Portfolio/Confluence data every child component requests, never
  rendered directly by this component.
- **Outputs:** none directly; delegates all rendering to its children.
- **Dependencies:** existing authentication (`auth` module). No other
  backend dependency — each child component owns its own data
  dependency (§3.2 onward).
- **Interaction Behaviour:** none of its own; purely compositional.
- **States:**
  - **Loading:** N/A at the container level — loading is owned
    independently by each child (§ per-component States below), per the
    Update Behaviour rationale in §4.
  - **Empty:** N/A.
  - **Error:** if authentication itself is invalid or expired, the
    entire container redirects to the existing authentication flow
    (`auth` module) — this is the one page-level failure mode, since no
    child component can meaningfully render without a known trader
    identity.
  - **Success:** all children mount independently (§4).
- **Update Behaviour:** does not itself poll or refresh; each child
  manages its own update cadence (§4). `TODO`: whether the container
  ever needs to coordinate a page-wide manual refresh action is not
  specified by any prior document — deferred.
- **Accessibility:** establishes the page's own landmark/heading
  structure (e.g., a single `<main>` region, one `<h1>`) so assistive
  technology can navigate directly to any child component — a standard
  semantic-HTML practice **[Industry Best Practice]**, not a Zenith-
  specific decision.
- **Performance:** must not block on any single child's own data
  fetch — children mount and fetch independently (§4), so one slow
  dependency never delays the others' own rendering.
- **Future Extensibility:** as Trading Journal, AI Workspace, Alerts,
  Calendar/News, and COT & Reports move from Placeholder (§3.7–§3.11)
  to functional components in later Sprints (per
  `25_PRODUCT_BLUEPRINT.md` §10, steps 7–11), this container's own
  composition list is the only place a new child is registered — no
  other component in this hierarchy should require modification.

---

## DASH-002 — Decision Readiness Summary

- **Purpose:** state the trader's own current decision-readiness in one
  synthesized view, directly implementing Constitution §10.2's own
  Success Criteria.
- **Why It Exists:** without this component, "decision-readiness"
  would require the trader to visit Watchlist, Portfolio, and Morning
  Brief separately and mentally synthesize them — precisely what the
  Success Criteria requires this screen to avoid.
- **Priority Level:** P0 — hero component (§2).
- **Information Priority:** highest on the page (Design Constitution
  rule 6); the first element attention should land on, per Constitution
  §8.2's own citation of F/Z-pattern eye-tracking research — placement
  in the highest-attention region is a layout/visual-design decision
  deferred to Product Leadership, but this component's own priority
  rank relative to every other Dashboard component is fixed by this
  specification.
- **Inputs:** the Confluence Engine Consumer's own aggregated output
  (`25_PRODUCT_BLUEPRINT.md` §7.1 — net-new, not yet built) across the
  instruments in the trader's own Watchlist and open Portfolio
  positions.
- **Outputs:** a single synthesized decision-readiness statement,
  ranked by decision relevance (Constitution §8.3, Information
  Priority), each contributing instrument's own reading individually
  traceable (Constitution §4.1) via DASH-003.
- **Dependencies:** Confluence Engine Consumer (net-new — blocking;
  this component cannot function until it exists, per
  `25_PRODUCT_BLUEPRINT.md` §10 step 1); Watchlist and Portfolio (both
  already built) to determine which instruments to synthesize across.
- **Interaction Behaviour:** selecting any individual contributing
  reading navigates to that instrument's own context in Watchlist or
  Portfolio (§4, Navigation). No action in this component ever implies
  a trade action of any kind (Constitution §3.1, §3.3).
- **States:**
  - **Loading:** a skeleton placeholder reflecting this component's own
    eventual shape, per the shared Async Data Component pattern (§4,
    Engineering Observation 2) — never a generic spinner masking the
    entire page.
  - **Empty:** occurs when no Watchlist instrument or open Position
    currently yields a qualifying reading from any of the nine Analysis
    Providers. This is rendered as a **valid, calm, first-class state**
    — "no clear opportunity right now" — per Product Rule 9 (no-trade
    is a valid outcome) and Constitution §12.4; it must never be styled
    or worded to resemble an error or a degraded/lesser state.
  - **Error:** the Confluence Engine Consumer failed to respond or
    timed out. Rendered distinctly from Empty (§ above) — this is a
    system unable to answer, not a system that answered "nothing
    qualifies." Per the Analysis Provider Framework's own existing
    partial-failure discipline (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
    Operational Resilience & Observability — a Provider that fails is
    "explicitly reported as non-participating, never silently treated
    as agreeing or neutral"), if the Consumer returns partial
    participation (some Providers responded, some did not), this
    component discloses exactly which portion of the evidence base it
    is synthesizing from — never silently presenting a partial result
    as if it were complete.
  - **Success:** one or more qualifying readings, ranked by decision
    relevance, each individually traceable via DASH-003.
- **Update Behaviour:** `TODO` — the exact refresh mechanism (manual,
  polling, or push) and cadence are not specified by
  `24_ZENITH_PRODUCT_CONSTITUTION.md` or `25_PRODUCT_BLUEPRINT.md` and
  require their own decision before implementation. Whatever mechanism
  is chosen must not cause visible content to shift abruptly under the
  trader's own attention (Constitution §5.2, Calm Interface; §8.7,
  Motion Philosophy) — a qualitative constraint on the eventual
  mechanism, not a substitute for choosing one.
- **Accessibility:** the synthesized statement must be readable by a
  screen reader as a coherent sentence, not a disconnected grid of
  values; any live update (once the Update Behaviour `TODO` is
  resolved) must not trigger an unannounced or overly frequent
  `aria-live` interruption **[Industry Best Practice — WAI-ARIA live
  region guidance]**.
- **Performance:** this component's own data need (synthesis across
  potentially many instruments) is the most expensive single query on
  the page — see Engineering Observation 1 (§5) for a non-binding
  caching recommendation.
- **Future Extensibility:** once Trading Journal exists (P1), this
  component's own "no clear opportunity" Empty State is a natural
  candidate to surface a prompt into Journal review instead of nothing
  — noted here as a placeholder for a future decision, not specified or
  authorized now.

---

## DASH-003 — Confidence & Uncertainty Disclosure (Shared Component)

- **Purpose:** the single, reusable presentation of a Confidence value
  and its own accompanying uncertainty disclosure, wherever a Confluence
  or Analysis Provider reading appears on Dashboard.
- **Why It Exists:** Design Constitution rule 8 requires this exact
  consistency; specifying it once and reusing it in DASH-002, DASH-005,
  and DASH-006 is the only way to satisfy that rule structurally,
  rather than by convention alone.
- **Priority Level:** P0 (shared dependency of every P0 data-bearing
  component).
- **Information Priority:** subordinate to whatever reading it
  accompanies — it discloses, it never competes for primary attention
  (Constitution §8.1).
- **Inputs:** one `LabeledConfidence` value and its own `kind`
  (`DETECTION` | `INTERPRETATION` | `REGIME_ADJUSTED` |
  `METHODOLOGY_CEILING`) and `explanation`, exactly as already produced
  by the existing Confidence Model
  (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Confidence Model;
  `analysis-provider.types.ts`) — this component invents no new
  Confidence concept, it presents the existing four-part taxonomy
  faithfully.
- **Outputs:** a disclosed confidence statement (which kind, and why)
  and a disclosed uncertainty statement (what is not known), always
  paired — never confidence without uncertainty (Product Rules 6, 7;
  Constitution §12.6, §12.7).
- **Dependencies:** the Confluence Engine Consumer (net-new) as the
  data source; no dependency of its own beyond the data it is given by
  its parent component.
- **Interaction Behaviour:** may expose a drill-down into the same
  Traceability record already produced per request
  (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Traceability;
  `S1-008`/`S1-012`) — the first time this data reaches a trader rather
  than only engineering. Exact drill-down interaction (inline expand vs.
  navigation) is `TODO` — a visual/interaction-design decision.
- **States:**
  - **Loading:** inherits its parent component's own Loading State (§
    per-component above); this component never loads independently of
    the reading it accompanies.
  - **Empty:** not applicable — this component only renders when a
    reading exists; a parent component's own Empty State (e.g., DASH-002
    with no qualifying reading) means this component simply does not
    mount for that reading.
  - **Error:** if a reading's own Confidence value is present but its
    `explanation` text is unexpectedly missing, this is treated as a
    data-integrity error, never silently rendered as an unlabeled
    number — per Constitution §12.6, an unexplained confidence number is
    a "design-level honesty failure," not a cosmetic gap.
  - **Success:** confidence kind, value, and explanation all present;
    uncertainty statement present and equally visible (never smaller,
    lower-contrast, or positioned as an afterthought — Design
    Constitution rule 8).
- **Update Behaviour:** inherits its parent's own cadence; has none of
  its own.
- **Accessibility:** the confidence kind and value must be announced
  together as one semantic unit (e.g., one labelled group), never as
  two disconnected pieces of text a screen reader would present out of
  order.
- **Performance:** negligible on its own — a pure presentation of
  already-fetched data; contributes no additional network request.
- **Future Extensibility:** this is the strongest candidate in this
  entire specification for promotion to a cross-screen, shared
  design-system primitive before Watchlist/Portfolio/Morning Brief are
  specified — see Engineering Observation 3 (§5).

---

## DASH-004 — Morning Brief Entry

- **Purpose:** the Dashboard-side navigation entry into Morning Brief,
  per `25_PRODUCT_BLUEPRINT.md` §4 (Morning Brief is the "session-start
  gateway," reachable from Dashboard).
- **Why It Exists:** Dashboard is the navigation hub
  (`25_PRODUCT_BLUEPRINT.md` §4); every area it links to needs its own
  entry affordance, and Morning Brief specifically implements Product
  Rules 1–2 (story before data, decision before chart) — this entry
  exists so a trader is never forced to build their own synthesis
  manually before reaching the one screen that already does it.
- **Priority Level:** P0.
- **Information Priority:** second-highest on the page, immediately
  after DASH-002 — Constitution §9.1 (Morning) names this the
  trader's own first move each session, alongside Dashboard itself.
- **Inputs:** the same Narrative Composer output Morning Brief itself
  renders in full (`25_PRODUCT_BLUEPRINT.md` §5, §7.1) — this
  component shows only a bounded excerpt/teaser of it, never a
  competing second copy of the full narrative.
- **Outputs:** navigation into Morning Brief; a one-line preview of its
  own top synthesis result.
- **Dependencies:** the Narrative Composer (net-new,
  `25_PRODUCT_BLUEPRINT.md` §7.1, §10 step 2) — blocking; Morning
  Brief itself must exist for this entry to show a real preview.
- **Interaction Behaviour:** a single navigation action into Morning
  Brief; no other interaction.
- **States:**
  - **Loading:** skeleton preview text, same pattern as DASH-002.
  - **Empty:** occurs when the Narrative Composer has nothing
    decision-relevant to lead with (the same legitimate "quiet market"
    condition as DASH-002's own Empty State) — rendered with the same
    calm, non-degraded treatment, never implying Morning Brief itself
    is broken or empty of value (it may still contain full evidence
    detail even when nothing is highlight-worthy).
  - **Error:** the Narrative Composer failed to respond; this entry
    still allows navigation into Morning Brief itself, which may
    independently retry — this entry's own failure never blocks access
    to the destination screen.
  - **Success:** a one-line preview is shown.
- **Update Behaviour:** `TODO` — same open question as DASH-002; likely
  the same mechanism, since both consume closely related data.
- **Accessibility:** the navigation affordance must have an accessible
  name describing its destination ("Open Morning Brief"), not merely
  the preview text itself, so assistive technology announces the
  action, not only the content **[Industry Best Practice]**.
- **Performance:** shares its own data source with Morning Brief itself;
  no additional dependency introduced beyond what Morning Brief already
  requires.
- **Future Extensibility:** once Trading Journal exists (§3.7), this
  entry's own preview is a candidate to incorporate the prior session's
  own Journal continuity (Constitution §9.6) — not specified now.

---

## DASH-005 — Watchlist Snapshot

- **Purpose:** show the trader's own tracked instruments and, once the
  Consumer exists, each one's own current Confluence reading, directly
  on Dashboard.
- **Why It Exists:** Watchlist is a P0 area
  (`25_PRODUCT_BLUEPRINT.md` §2) and one of Dashboard's own stated
  Exit Points; summarizing it here lets a trader see tracked-instrument
  status without a separate navigation, consistent with the Success
  Criteria (§1).
- **Priority Level:** P0.
- **Information Priority:** below DASH-002/DASH-004; Watchlist
  management (add/remove) itself is out of this component's own scope —
  that remains the Watchlist area's own job (`25_PRODUCT_BLUEPRINT.md`
  §2, Watchlist).
- **Inputs:** the trader's own Watchlist entries (existing `watchlists`
  module, full CRUD already built); each entry's own Confluence reading
  (via the Consumer, net-new).
- **Outputs:** a bounded list of tracked instruments, each with its own
  reading (via DASH-003) once available.
- **Dependencies:** Watchlists module (already built) — this component
  functions with zero new dependency for the *list* itself; the
  Confluence Engine Consumer (net-new) for the *annotation* only, per
  `25_PRODUCT_BLUEPRINT.md` §2's own stated Watchlist dependency split.
- **Interaction Behaviour:** selecting an instrument navigates to its
  own full Watchlist entry/context. This component does not itself
  support add/remove — that is the Watchlist area's own responsibility.
- **States:**
  - **Loading:** skeleton rows, same pattern as DASH-002/DASH-004.
  - **Empty:** the trader has not added any instrument to their own
    Watchlist yet — a first-use state, not an error; should route
    toward adding a first instrument (exact affordance `TODO` — an
    interaction-design decision).
  - **Error:** the Watchlist list itself fails to load (existing
    module failure) is distinct from the Consumer failing to annotate
    it — the list must still render with each instrument's own
    annotation independently marked unavailable (§ DASH-002 Error
    State's own partial-failure discipline, applied per-row here).
  - **Success:** the tracked-instrument list renders, each row
    annotated once the Consumer responds.
- **Update Behaviour:** `TODO` — bounded list length ("top N shown on
  Dashboard vs. full list only in the Watchlist area itself") is not
  specified by any prior document; deferred.
- **Accessibility:** the list must be navigable as a semantic list
  (not a bare grid of unlabelled cells), each row's own instrument name
  and reading announced together **[Industry Best Practice]**.
- **Performance:** the per-instrument Confluence annotation is the same
  expensive query category as DASH-002 (§5, Engineering Observation 1)
  — this component and DASH-002 are strong candidates to share one
  underlying data fetch rather than each independently querying the
  Consumer for overlapping instruments.
- **Future Extensibility:** once Alerts exists (P2), a per-instrument
  alert-configuration affordance is a natural addition to each row —
  not specified or authorized now.

---

## DASH-006 — Portfolio Snapshot

- **Purpose:** show current holdings and their evidentiary state,
  neutrally, directly on Dashboard.
- **Why It Exists:** Portfolio is a P0 area and a stated Dashboard Exit
  Point; per Constitution §5.2/§7.3, a losing position must read with
  the same calm treatment as a winning one — this component exists to
  give that neutral summary its own dedicated space, distinct from
  Watchlist's own tracked-but-unowned instruments.
- **Priority Level:** P0.
- **Information Priority:** below DASH-002/DASH-004, alongside
  DASH-005; ordering between DASH-005 and DASH-006 relative to each
  other is `TODO` (neither Constitution nor Blueprint states which of
  Watchlist or Portfolio ranks higher on Dashboard specifically).
- **Inputs:** Portfolios/Positions/Transactions (already built);
  Trading Analytics — P&L, risk exposure, Portfolio Health Score,
  Decision Readiness, Data Quality/Confidence (existing `analytics`
  module, S1-006); Confluence Engine output per held instrument, once
  the Consumer exists.
- **Outputs:** a neutral holdings summary, existing Analytics figures,
  and — once the Consumer exists — each position's own evidentiary
  annotation via DASH-003.
- **Dependencies:** Portfolios, Positions, Transactions, Analytics (all
  already built, zero new dependency for the base summary); Confluence
  Engine Consumer (net-new, for the evidentiary annotation only).
- **Interaction Behaviour:** selecting a position navigates to its own
  full Portfolio context. No action here implies any trade instruction
  (Constitution §3.1, §3.3) — this is a read-only summary.
- **States:**
  - **Loading:** skeleton rows, same pattern as DASH-002/DASH-004/
    DASH-005.
  - **Empty:** the trader holds no open positions — rendered calmly,
    never as a warning or a "you should be trading" prompt, per Product
    DNA §3.2/§3.3 (Zenith never rewards activity for its own sake).
  - **Error:** distinguished the same way as DASH-005 — a failure of
    the base Portfolio/Analytics data is a different, more severe
    condition than a failure of the Confluence annotation layer alone;
    the two must be independently reportable, never conflated into one
    generic "something went wrong."
  - **Success:** holdings render with existing Analytics figures and,
    once available, per-position Confluence annotation.
- **Update Behaviour:** `TODO`, same category of open question as
  DASH-002/DASH-004/DASH-005. Existing Analytics figures are already
  computed live per request with no persisted history
  (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`/S1-006 precedent) — this
  component inherits that same "live, not historical" character for
  the figures it already has access to.
- **Accessibility:** P&L and risk figures must never rely on color
  alone to distinguish gain from loss (a plain-language or symbolic
  label must accompany any value) **[Industry Best Practice — WCAG 2.1
  "use of color" success criterion]** — directly relevant here since
  Constitution §8.4 already forecloses relying on color-emotion
  association as a primary signal.
- **Performance:** the Analytics figures are already fast (existing,
  already-tested S1-006 module); the Confluence annotation shares the
  same performance profile and caching consideration as DASH-002/
  DASH-005 (§5, Engineering Observation 1).
- **Future Extensibility:** once Trading Journal exists (§3.7), each
  position row is a natural entry point to record a decision about it
  — already reflected in this component's own Exit Points
  (`25_PRODUCT_BLUEPRINT.md` §2, Portfolio) but not built now.

---

## DASH-007 — Trading Journal Entry (Placeholder)

- **Purpose:** reserve Dashboard's own navigation slot for Trading
  Journal, per `25_PRODUCT_BLUEPRINT.md` §4.
- **Why It Exists:** Dashboard is the hub for all nine approved areas
  (§4); this placeholder preserves that structural relationship without
  fabricating content for an area whose backend does not yet exist
  (§2, Component Hierarchy rationale).
- **Priority Level:** P1 (matches Trading Journal's own Blueprint
  priority).
- **Information Priority:** lowest tier on the page, below every P0
  component.
- **Inputs:** none (no backend exists yet — `25_PRODUCT_BLUEPRINT.md`
  §7.1).
- **Outputs:** a disabled or clearly-inactive navigation affordance
  only; no data.
- **Dependencies:** Trading Journal's own future data model and CRUD
  surface (net-new, not yet built).
- **Interaction Behaviour:** none until Trading Journal itself ships;
  `TODO` whether V1 shows this placeholder at all (§5, Engineering
  Observation 5) or omits it entirely until built.
- **States:** **Loading/Empty/Error/Success** are not applicable in
  their usual sense — this component has exactly one state
  (**Inactive/Reserved**) until Trading Journal exists, at which point
  it is replaced by a functional summary component specified in that
  area's own future Sprint.
- **Update Behaviour:** none.
- **Accessibility:** if shown, must be announced as unavailable/coming
  soon, not as an interactive control that silently does nothing
  **[Industry Best Practice]**.
- **Performance:** zero — no data fetch.
- **Future Extensibility:** replaced, not extended, once Trading
  Journal ships (`25_PRODUCT_BLUEPRINT.md` §10 step 7).

---

## DASH-008 — AI Workspace Entry (Placeholder)

Same structure and rationale as DASH-007, for AI Workspace
(`25_PRODUCT_BLUEPRINT.md` §2, §7.1 — depends on the net-new generative
AI Reasoning Layer, Blueprint §10 step 8). Priority Level: P1. All
other fields identical in kind to DASH-007 (Inactive/Reserved single
state; zero data; zero performance cost; replaced, not extended, once
AI Workspace ships).

---

## DASH-009 — Alerts Indicator (Placeholder)

Same structure and rationale as DASH-007, for Alerts
(`25_PRODUCT_BLUEPRINT.md` §2, §7.1 — depends on the net-new Alert
Rule model, evaluation job, and delivery mechanism, Blueprint §10 step
9). Priority Level: P2. All other fields identical in kind to DASH-007.

---

## DASH-010 — Calendar / News Snapshot (Placeholder)

Same structure and rationale as DASH-007, for Calendar/News
(`25_PRODUCT_BLUEPRINT.md` §2, §7.1 — blocked on an unmade vendor-
selection ADR, Blueprint §9, §10 step 10). Priority Level: P2. All
other fields identical in kind to DASH-007.

---

## DASH-011 — COT & Reports Snapshot (Placeholder)

Same structure and rationale as DASH-007, for COT & Reports
(`25_PRODUCT_BLUEPRINT.md` §2, §7.1 — blocked on an unmade vendor-
selection ADR, Blueprint §9, §10 step 11). Priority Level: P2. All
other fields identical in kind to DASH-007.

------------------------------------------------------------------------

# 4. Data Flow, State Flow, and Interaction Map

## 4.1 Data Flow

```
Auth (existing)
   → DASH-001 (scopes every child's own data request to the trader)

Watchlists (existing) ──┬─→ DASH-005 (list)
                        │
Portfolios/Positions/    │
Transactions (existing) ─┼─→ DASH-006 (holdings)
                          │
Analytics (existing) ─────┴─→ DASH-006 (P&L/risk/Health Score)

Confluence Engine Consumer (NET-NEW)
   ├─→ DASH-002 (aggregate synthesis across Watchlist + Portfolio instruments)
   ├─→ DASH-005 (per-instrument annotation)
   └─→ DASH-006 (per-position annotation)

Narrative Composer (NET-NEW, consumes Confluence Engine Consumer)
   └─→ DASH-004 (preview only; full content owned by Morning Brief itself)

DASH-003 (Confidence & Uncertainty Disclosure)
   is not an independent data source — it renders whatever
   LabeledConfidence value its parent component (DASH-002/005/006)
   passes to it.
```

## 4.2 State Flow

Each data-bearing component (DASH-002, DASH-004, DASH-005, DASH-006)
owns an independent state machine:

```
Loading → (Success | Empty | Error)
```

No child component's own state affects another's — DASH-001 does not
gate rendering on any single child reaching Success, per §3 (DASH-001,
Performance) and Engineering Observation 2 (§5). A page-level "fully
loaded" state exists only as the logical conjunction of every child's
own state, never as a blocking precondition for any individual child to
render.

## 4.3 Interaction Map

```
DASH-002 (reading) ──select──→ Watchlist or Portfolio context (per instrument)
DASH-004            ──open───→ Morning Brief (full screen)
DASH-005 (row)      ──select──→ Watchlist context (per instrument)
DASH-006 (row)      ──select──→ Portfolio context (per position)
DASH-003 (any)      ──drill-in─→ the same reading's own Traceability record
DASH-007/008/009/010/011 ──(inactive until each area ships)
```

Every interaction above is a **navigation or disclosure action only** —
none initiates, confirms, or implies a trade of any kind, per
Constitution §3.1/§3.3.

## 4.4 Dependency Map

```
BLOCKING (must exist before the component can function at all):
  Confluence Engine Consumer  → DASH-002, DASH-005 (annotation), DASH-006 (annotation)
  Narrative Composer          → DASH-004

NON-BLOCKING (component already fully functional without it):
  Watchlists (existing)              → DASH-005 (list itself)
  Portfolios/Positions/Analytics
    (existing)                       → DASH-006 (base summary itself)

FUTURE (component ships only once its own area exists):
  Trading Journal data model  → DASH-007
  AI Reasoning Layer          → DASH-008
  Alert Rule model + job      → DASH-009
  Calendar/News vendor ADR    → DASH-010
  COT/Report vendor ADR       → DASH-011
```

------------------------------------------------------------------------

# 5. Engineering Observations & Recommendations

This section is advisory only. No observation below modifies this
specification, any approved document, architecture, product decision,
or roadmap. Each requires its own explicit leadership approval before
any action is taken.

## Observation 1 — Confluence Engine Consumer aggregation cost on Dashboard

- **Observation:** DASH-002 requires a Confluence reading across every
  Watchlist and Portfolio instrument simultaneously — potentially many
  independent Confluence computations on a single Dashboard load, more
  than any other planned screen requires at once.
- **Technical Reasoning:** each Confluence computation itself runs all
  nine Analysis Providers per instrument (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`);
  the existing per-Provider default timeout is 5000ms with a circuit
  breaker (`provider-execution.service.ts`) — safe per-instrument, but
  the aggregate latency across N instruments on one page load has no
  existing precedent to bound it.
- **Expected Benefits (of addressing this):** a pre-computation or
  caching strategy (e.g., a background refresh job, mirroring Market
  Data's own existing `@nestjs/schedule` sync pattern, S1-005) would
  make Dashboard's own hero component reliably fast regardless of
  Watchlist/Portfolio size.
- **Possible Risks (of not addressing this):** Dashboard's own Loading
  State (§3, DASH-002) could be visible for an uncomfortably long time
  for traders with large Watchlists, undermining the Calm Interface
  Philosophy (Constitution §5.2) it is meant to serve.
- **Estimated Impact:** High — this is the single component every
  Dashboard load depends on most heavily.
- **Recommendation Priority:** **High.**

## Observation 2 — Formalize a shared Async Data Component pattern before Watchlist/Portfolio/Morning Brief are specified

- **Observation:** this specification independently defines the same
  Loading/Empty/Error/Success shape for DASH-002, DASH-004, DASH-005,
  and DASH-006.
- **Technical Reasoning:** the next three screens in
  `25_PRODUCT_BLUEPRINT.md` §10 (Watchlist, Portfolio, Morning Brief)
  will each need the identical pattern; specifying it once, generically,
  before those screens' own specifications are written would avoid
  four independent reinventions of the same state machine.
- **Expected Benefits:** consistency (Constitution §5.4) enforced
  structurally rather than by convention; less specification and
  engineering effort for every subsequent screen.
- **Possible Risks:** premature abstraction if a future screen
  genuinely needs a different pattern — mitigated by waiting until the
  Watchlist specification (the next one) confirms the pattern actually
  recurs before generalizing it.
- **Estimated Impact:** Medium — a documentation/process efficiency
  gain, not a functional one.
- **Recommendation Priority:** **Medium.**

## Observation 3 — Promote DASH-003 to a cross-screen shared primitive now, before divergent reinvention

- **Observation:** DASH-003 is already reused three times within this
  single specification; Watchlist, Portfolio, and Morning Brief will
  each need the identical component.
- **Technical Reasoning:** Design Constitution rule 8 requires
  identical treatment of Confidence/uncertainty disclosure everywhere
  it appears — this is only mechanically guaranteed if it is built once
  and imported, not re-specified per screen.
- **Expected Benefits:** guarantees rule 8's own consistency
  requirement by construction; a single point of change if the
  Confidence Model itself ever evolves.
- **Possible Risks:** none identified beyond ordinary shared-component
  coordination overhead.
- **Estimated Impact:** High — this component is Zenith's own most
  visible, most frequently repeated expression of its core
  differentiation (disclosed, calibrated confidence).
- **Recommendation Priority:** **High.**

## Observation 4 — Real-time update mechanism is an undecided, cross-cutting architecture question

- **Observation:** every P0 component's own Update Behaviour is marked
  `TODO` in this specification, and the same question will recur for
  Watchlist, Portfolio, and Morning Brief.
- **Technical Reasoning:** no push infrastructure (WebSocket/SSE)
  exists today; Market Data's own existing pattern is scheduled
  polling/cache refresh (ADR-004, S1-005). Deciding the update
  mechanism once, at the architecture level, before four separate
  screen specifications each guess independently, would avoid
  inconsistent behavior across screens.
- **Expected Benefits:** one coherent, cited update-mechanism decision
  instead of four ad hoc ones.
- **Possible Risks:** deciding too early, before real usage data exists
  on how often traders actually expect Dashboard to change within a
  session.
- **Estimated Impact:** Medium-High — affects perceived product quality
  directly (Constitution §5.2, Calm Interface) but is not release-
  blocking if a simple, conservative default (manual/on-navigation
  refresh) is chosen for V1.
- **Recommendation Priority:** **Medium.**

## Observation 5 — Whether V1 shows Placeholder components at all

- **Observation:** this specification includes five Placeholder
  components (DASH-007–DASH-011) whose only function in V1 is to
  reserve a navigation slot for an area that does not yet exist.
- **Technical Reasoning:** Blueprint §4 (Navigation Blueprint)
  establishes Dashboard as hub for all nine areas, which this
  specification honored structurally; but Constitution §3.2/Product
  Rule 3 (reduce cognitive load) could argue for omitting inactive
  slots entirely until each area actually ships, rather than showing
  five inactive entries alongside four working ones.
- **Expected Benefits (of omitting placeholders in V1):** a visually
  and cognitively simpler V1 Dashboard.
- **Possible Risks (of omitting placeholders in V1):** each later area's
  own launch would then require adding a new navigation entry to
  Dashboard rather than merely activating an existing one — a larger
  future change per area shipped.
- **Estimated Impact:** Low-Medium — a genuine product judgment call,
  not an engineering constraint either way.
- **Recommendation Priority:** **Low** (this is the most clearly a
  product decision, not an engineering one, among all observations
  here — flagged specifically for Product Leadership's own call).

## Observation 6 — Confidence/uncertainty accessibility deserves an early, dedicated audit

- **Observation:** Confidence and uncertainty disclosure (DASH-003) is
  Zenith's own most central, most repeated UI concept, per Constitution
  §4.1, §6.5, §11.4, §12.6, §12.7 — yet no accessibility audit has been
  performed against how these values will be announced by assistive
  technology.
- **Technical Reasoning:** `aria-live` region behavior for frequently-
  updating, semantically-paired values (a confidence kind plus its own
  explanation plus a separate uncertainty statement) is easy to get
  subtly wrong (over-announcing, under-announcing, or announcing the
  two halves out of order).
- **Expected Benefits:** getting this right once, in the shared
  DASH-003 component (Observation 3), benefits every future screen
  automatically.
- **Possible Risks:** none identified in doing the audit itself; the
  risk is in *not* doing it before DASH-003 is built and reused widely.
- **Estimated Impact:** Medium — an accessibility-quality concern, not
  a functional blocker.
- **Recommendation Priority:** **Medium.**

## Observation 7 — A dedicated `documentation/zos/specs/` subfolder for future per-screen specifications

- **Observation:** this specification was filed as a new flat, top-
  level ZOS document (`26_DASHBOARD_HOME_SPECIFICATION.md`), continuing
  the existing numbering sequence. Three more screen specifications
  (Watchlist, Portfolio, Morning Brief) are expected next, per
  `25_PRODUCT_BLUEPRINT.md` §10, with more after that as later areas
  ship.
- **Technical Reasoning:** `13_FOLDER_STRUCTURE.md` already establishes
  a precedent for a dedicated subfolder within `documentation/zos/` for
  a specific, numerous document family (`documentation/zos/sprints/`
  for Sprint Briefs) rather than flattening every Sprint Brief into the
  root numbering sequence. Per-screen specifications are structurally
  the same kind of numerous, narrowly-scoped document family.
- **Expected Benefits:** keeps the root ZOS numbering (00-2X) reserved
  for genuinely foundational, singular governance documents, mirroring
  the existing `sprints/` precedent exactly.
- **Possible Risks:** a folder-structure change, however minor, still
  requires `13_FOLDER_STRUCTURE.md`'s own update and, per that document,
  Architecture review.
- **Estimated Impact:** Low — a documentation-organization concern with
  no effect on this specification's own content or validity.
- **Recommendation Priority:** **Low.**

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 —
  frozen, cited throughout, not modified)
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` (ZOS-025 — frozen, cited
  throughout, not modified)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`
- `documentation/zos/13_FOLDER_STRUCTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
