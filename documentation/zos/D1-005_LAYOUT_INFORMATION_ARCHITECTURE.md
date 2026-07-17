# D1-005_LAYOUT_INFORMATION_ARCHITECTURE

**Document ID:** ZOS-D1-005
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation

------------------------------------------------------------------------

# Purpose

Converts ZXL §1 (Attention Hierarchy), §2 (Decision Flow), and
Constitution §10.2 (Approved Product Surface) into an information
architecture: navigation structure, screen archetypes, and the
principle-level rules for how attention levels map to physical regions
of a layout. **No wireframe, no pixel layout, no final screen design.**
A "screen archetype" below states a reusable structural pattern, not a
specific screen's own visual design.

------------------------------------------------------------------------

# 1. Navigation Structure (Sitemap Level)

Primary navigation contains exactly the nine areas Constitution §10.2
already approved, ordered by Decision Flow (ZXL §2), not alphabetically
or by build order:

1. **Dashboard / Home** — answers Decision Flow Q1 ("Am I decision-ready
   right now?"). Entry point every session.
2. **Morning Brief** — answers Q2 ("Why?") at the session's own start,
   before other detail screens.
3. **Watchlist** — answers Q3 ("Where, specifically?") for tracked
   instruments.
4. **Portfolio** — answers Q3 for held instruments specifically.
5. **Alerts** — surfaces disclosed evidentiary changes as they occur,
   reachable, not pushed into the Primary flow (Constitution §10.2,
   Alerts).
6. **Calendar / News** — supporting context for Q2/Q3, consulted
   deliberately (ZXL §1.3, Supporting Attention).
7. **COT & Reports** — raw institutional evidence, explicitly not
   conclusions (Constitution §10.2).
8. **AI Workspace** — direct interaction surface, consulted deliberately.
9. **Trading Journal** — answers Q4/Q5 ("What should I review or learn
   from?"), deliberately positioned after the present-moment screens in
   both navigation order and psychological priority (ZXL §2, Decision
   Flow question 5 is resolved last).

**Rule 1.1:** navigation order follows Decision Flow, not recency of
implementation or engineering convenience — Journal sits last in
navigation not because it was built later, but because ZXL §2
establishes it answers the *last* question a trader's mind asks.

**Rule 1.2:** no tenth area may be added to primary navigation without
its own Constitution §10.1 four-field statement and leadership approval
(Constitution §10.3) — this document does not expand the product
surface.

------------------------------------------------------------------------

# 2. Screen Archetypes

Four reusable structural patterns, derived from what each approved
area's own Purpose (Constitution §10.2) actually requires — not four
arbitrary templates. Every one of the nine areas maps to exactly one
archetype below; a future per-screen specification (in the style of
`26_DASHBOARD_HOME_SPECIFICATION.md`) states which.

## 2.1 Synthesis Archetype

**Areas:** Dashboard, Morning Brief.

**Structure principle:** a single Primary Attention region occupies the
highest-attention position (D1-001 §2) and states a synthesized
conclusion before any supporting detail. Supporting evidence follows
below/after, reached by continued reading, not a separate navigation
action (Progressive Disclosure, ZXL §3.2). No chart or raw data appears
above the synthesis statement (Constitution §12.1, §12.5).

**Region order (top to bottom / first to last, not exact pixels):**
1. Primary Attention: the single synthesized conclusion.
2. Secondary Attention: the evidence/reasoning behind it.
3. Supporting Attention: confidence/uncertainty disclosure, given equal
   visual treatment to each other (Design Constitution §7).
4. Peripheral: entry points to other areas, not competing for the first
   glance (ZXL §1.4).

## 2.2 List/Tracking Archetype

**Areas:** Watchlist, Calendar/News, COT & Reports.

**Structure principle:** a bounded, intentional set of items (never an
open-ended feed), each item disclosing its own evidence state without
requiring navigation away to understand it (Constitution §10.2,
Watchlist). Primary Attention is the list's own current state as a
whole (e.g., "how many tracked instruments have a new reading"), not
any single list item by default — a specific item earns Primary
Attention only when a trader has drilled into it.

**Region order:**
1. Primary Attention: the tracked set's own current, aggregate state.
2. Secondary/Supporting: individual item rows, each with a consistent,
   scannable evidence summary (reused pattern per item — Design
   Constitution §8, consistency).
3. Peripheral: filtering/sorting controls, management actions (add/
   remove tracked items).

## 2.3 Record/Detail Archetype

**Areas:** Portfolio, Trading Journal.

**Structure principle:** a calm, neutral system of record (Constitution
§10.2, Portfolio) — favorable and unfavorable states use identical
structural treatment (Design Constitution §2.4, §5). Detail is reached
by drilling into a specific record, never all displayed flat and
simultaneously (Cognitive Load ceiling, ZXL §3.1).

**Region order:**
1. Primary Attention: the record set's own neutral summary state (e.g.,
   total positions, not a P/L-colored headline).
2. Secondary/Supporting: individual records, each using the identical
   structural treatment regardless of favorability.
3. Peripheral: historical/review actions (Journal entry creation,
   filtering by date range).

## 2.4 Conversational Archetype

**Areas:** AI Workspace.

**Structure principle:** Primary Attention is the trader's own current
question and the Assistant's direct answer (Constitution §11.2,
leads-with-conclusion). Supporting evidence and disclosed
uncertainty/confidence (Constitution §11.3–§11.4) follow the answer,
available but not competing with it. History of the conversation is
Peripheral until scrolled to or referenced.

------------------------------------------------------------------------

# 3. Progressive Disclosure Pattern (Principle Level)

**Rationale:** ZXL §3.2, §3.3.

3.1. Every screen's first-rendered state answers only its own archetype's
Primary Attention question — no additional depth loads unrequested
alongside it.

3.2. A "drill-in" interaction (not specified here as a component —
that is component-spec work) always reveals depth in the same
direction/pattern across every screen that uses one — consistency
(Design Constitution §8) applies to interaction patterns, not only
visual tokens.

3.3. Depth that does not change the trader's current answer stays
collapsed by default (ZXL §3.3) — a Confidence value's full four-part
breakdown is one drill-in away, not shown by default at Supporting
Attention level.

------------------------------------------------------------------------

# 4. Cross-Screen Consistency Rules

4.1. A concept that recurs across screens (a Confidence disclosure, an
alert severity, a tracked-instrument row) uses the identical structural
position and treatment on every screen it appears on (Design
Constitution §8; Constitution §5.4).

4.2. Navigation itself (§1) is present and in the same relative position
on every screen — a trader is never asked to re-locate navigation
because a specific screen rearranged it.

4.3. The Decision Flow (§1 above, ZXL §2) that justifies Dashboard's own
Attention Hierarchy does not have to repeat identically on every screen
— ZXL §2 explicitly notes a screen's own natural question sequence may
begin at a later Decision Flow question (e.g., Morning Brief begins at
Q2 since Dashboard already answers Q1). Each screen archetype's own
region order (§2 above) already reflects this; a future per-screen
specification states explicitly which Decision Flow question a given
screen begins at, per ZXL §2's own method.

------------------------------------------------------------------------

# 5. Responsive Structural Rules

**Rationale:** D1-004 §3, Design Constitution §11.

5.1. At `breakpoint.compact`, every screen archetype collapses to a
single column with Primary Attention first in document order, followed
by Secondary, Supporting, then Peripheral — the same order as the
Attention Hierarchy itself, never reordered for layout convenience.

5.2. Peripheral elements (entry points, management actions) may be
deferred behind a reachable action (a menu, an expandable section) at
`breakpoint.compact` — they are never deleted or hidden without a path
to reach them.

------------------------------------------------------------------------

# 6. What This Document Does Not Do

- Does not wireframe any screen, in low or high fidelity.
- Does not specify a navigation component's own visual design (a tab
  bar vs. a sidebar vs. a top nav is an implementation decision for the
  Sprint that builds it, constrained by §1's ordering rule, not decided
  here).
- Does not write a per-screen specification — that remains the
  responsibility of a future document in the style of
  `26_DASHBOARD_HOME_SPECIFICATION.md`, for each of the eight areas that
  do not yet have one, per Constitution §15.4 and ZXL Observation 1
  (cite ZXL before specifying).

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 §10,
  §12 — frozen, cited, not modified)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZOS-027 §1–§3 —
  frozen, cited, not modified)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` (§1–§2)
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` (§1, §11)
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md` (§3, grid/
  breakpoints)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (per-screen
  specification precedent, cited, not modified)
