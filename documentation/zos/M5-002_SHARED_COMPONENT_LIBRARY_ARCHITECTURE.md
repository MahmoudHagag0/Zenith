# M5-002_SHARED_COMPONENT_LIBRARY_ARCHITECTURE

**Document ID:** ZOS-M5-002
**Version:** 1.1.0
**Status:** Implemented — Documentation Synchronized 2026-07-18 (see note before Related Documents)
**Owner:** Architecture Team (engineering-authored implementation architecture)
**Milestone:** M5 — Implementation Architecture

------------------------------------------------------------------------

# Purpose

Architecture specification for every reusable component Zenith's
frontend requires — no React code, no CSS, no visual mockup. Each
component below either implements a D2-005 foundation directly, or is
a **generalization of a pattern already independently specified**
across `M4-003` through `M4-011` (cited per component as "Source").
None introduces new visual language, new color meaning, or new UX —
where a component's own final form was explicitly left open by a prior
document, that document is cited as the authority deferring the
decision to this one.

**Package:** `packages/ui` (`@zenith/ui`), consumed by `apps/web` via
`workspace:*`. Every component imports tokens from
`@zenith/design-tokens` (`M5-001`) exclusively — no raw values.

------------------------------------------------------------------------

# Resolved Ambiguities (stated once, applies throughout)

- **Navigation shape (Sidebar vs. Top Bar):** `D1-005` §6 explicitly
  deferred this to "the Sprint that builds it." Resolved here: **Sidebar**
  at `breakpoint.wide`/`regular` (preserves full content width for the
  Table-heavy screens — Watchlist, COT, Reports — per D2-004 §6.2),
  collapsing to a **Top Bar** with an expandable menu at
  `breakpoint.compact` (D1-005 §5.1, single-column collapse). Order and
  position fixed per `M4-002` §1/§3.1 — this decision governs shape
  only, never order.
- **Search:** not the unapproved "Global Search" (`M4-002` §3.5,
  explicitly not built). This is the already-approved instrument/symbol
  search (Blueprint §2 Watchlist Inputs; `M4-002` §3.6 Quick Action,
  DEC-2026-030) — a Search component is a generic Input + result-list
  composition, scoped to instrument lookup wherever already approved.
- **Status Indicator** = Status Chip (D2-005 §14), named per this
  task's own phrasing; same component, not a second one.

------------------------------------------------------------------------

# 1. Navigation Shell

## Sidebar / Top Bar (responsive pair, one navigation shell)

- **Purpose:** Primary Navigation (D1-005 §1, `M4-002` §3.1) — persistent,
  identical position on every screen.
- **Responsibilities:** render the nine approved areas in Decision-Flow
  order; highlight current area; never itself scroll independently of
  its own reachability.
- **Variants:** `sidebar` (wide/regular), `topbar` (compact, collapsible).
- **Composition:** one shared `NavItem` (label + optional icon,
  D1-002 §10) list, rendered by whichever shell variant is active —
  no duplicated item logic between the two.
- **Token mapping:** `--zenith-surface-raised`, `--zenith-text-*`,
  `--zenith-accent-default` (active item only), `--zenith-layer-sticky`.
- **Accessibility:** `<nav>` landmark, current item `aria-current="page"`,
  full keyboard reachability (D2-007 §2.1).
- **Interaction:** navigation-only, no state mutation.
- **Behavior:** never reorders itself; compact variant's expand/collapse
  is low-stakes (D1-002 §12.1).
- **States:** default, active-item, compact-collapsed, compact-expanded.
- **Dependencies:** `NavItem`, design tokens.

------------------------------------------------------------------------

# 2. Actions

## Button

- **Purpose:** every interactive action on every screen.
- **Responsibilities:** render exactly one of the three Action tiers
  (D1-002 §13, D1-003 §3.1) — never a fourth.
- **Variants:** `primary` (filled, `accent.default`), `secondary`
  (outlined, accent border/text only), `tertiary` (text-only, neutral).
- **Composition:** label required; optional leading/trailing icon
  (functional only, D1-002 §10.1).
- **Token mapping:** `--zenith-accent-*`, `--zenith-text-secondary`
  (tertiary), `--zenith-opacity-{hover,pressed,disabled}`,
  `--zenith-radius-sm`, `--zenith-duration-fast`.
- **Accessibility:** native `<button>`, visible focus ring
  (`border.emphasis`, 2px, never suppressed).
- **Interaction:** a consequential action (D1-002 §12.2) never renders
  at `primary` tier styled identically to a routine one — composition
  rule, not a visual one (D2-005 §1 constraint).
- **Behavior:** exactly one `primary` Button per decision context
  (D1-002 §13.1).
- **States:** default, hover, pressed, focus, disabled, loading (spinner
  replaces label, no layout shift).
- **Dependencies:** design tokens only.

------------------------------------------------------------------------

# 3. Surfaces

## Panel

- **Purpose:** a screen's own Primary Attention region (D2-005 §3).
- **Responsibilities:** hold exactly one Primary Attention element per
  screen; full-bleed, never a boxed surface.
- **Variants:** none — one Panel treatment system-wide (Design
  Constitution rule 8).
- **Composition:** may nest a Decision Card (§9) directly; never nests
  another Panel.
- **Token mapping:** `--zenith-surface-base`, `--zenith-elevation-0`,
  **no radius, no border** (`M4-003.2` §4's corrected rule — binding
  precedent for every Panel instance, not restated per screen again).
- **Accessibility:** one `<main>`/section landmark per page.
- **Interaction:** none of its own.
- **Behavior:** never scrolls independently; content determines page
  height.
- **States:** loading (children render Skeleton, §16), empty, error,
  success — Panel itself has no visual state changes.
- **Dependencies:** none.

## Card

- **Purpose:** a discrete Secondary/Supporting Attention item
  (D2-005 §2).
- **Responsibilities:** uniform visual weight regardless of the
  favorability of its own content (Constitution §7.3, `M4-006` §6
  binding constraint — no elevation/color exception for a losing
  position, a rejected pattern, or any other "bad news" content).
- **Variants:** none — one Card treatment; content composition varies
  (see §9, Composite Trading Cards) but the outer Card shell does not.
- **Composition:** optional header, body (required), optional footer/
  action row.
- **Token mapping:** `--zenith-surface-raised`, `--zenith-elevation-1`,
  `--zenith-radius-md`.
- **Accessibility:** if interactive (selectable row), a single
  keyboard-reachable target, not nested interactive elements competing
  for the same click.
- **Interaction:** select → navigation/drill-in only, per each screen's
  own Interaction Rules (`M4-004`–`M4-011` §6).
- **Behavior:** never changes elevation/radius based on its own content.
- **States:** default, hover (list context only), selected, loading
  (Skeleton), disabled (Placeholder pattern, §15).
- **Dependencies:** design tokens; optionally composes Status Chip
  (§6), Badge (§6).

## Table

- **Purpose:** the canonical Medium/High-density container (D2-005 §4)
  — Watchlist, Portfolio position lists, COT/Reports historical data.
- **Responsibilities:** tabular figures mandatory on every numeric
  column; semantic header markup.
- **Variants:** `default` (row-select), `drill-in` (rows expand nested
  detail, per COT/Reports Progressive Disclosure, `M4-010` §3).
- **Composition:** header row (`text.micro`) + data rows
  (`text.numeric`, right-aligned numeric columns, minimum `space.16`
  column gutter, D2-003 §6.4).
- **Token mapping:** `--zenith-text-numeric`, `--zenith-space-16`
  (gutter), `--zenith-opacity-hover` (row hover).
- **Accessibility:** `<table>` semantics, `scope` on headers, row +
  reading announced together (D2-007 §6.4).
- **Interaction:** row select → navigation; sort/filter (Peripheral,
  low-stakes).
- **Behavior:** never used to display a screen's own Primary Attention
  conclusion directly (D1-002 §1.2).
- **States:** loading (skeleton rows), empty, error (per-row vs.
  whole-table failure distinguished, `26` §3 precedent), populated.
- **Dependencies:** design tokens.

------------------------------------------------------------------------

# 4. Data Display

## Badge

- **Purpose:** a static count/label (D2-005 §12).
- **Token mapping:** `--zenith-radius-{full,sm}`, neutral tokens by
  default.
- **Behavior:** never implies urgency via color unless the underlying
  condition is a genuine `signal.warn`/`critical` (D1-002 §6).
- **States:** default only (no interaction).
- **Dependencies:** none.

## Status Indicator (= Status Chip, D2-005 §14)

- **Purpose:** the sole component permitted to render
  `signal.critical`/`warn`/`info` as fill/text color.
- **Composition:** color-coding always paired with a text label
  (D1-002 §9.3 — never an unlabeled dot).
- **Token mapping:** `--zenith-signal-*`.
- **Accessibility:** severity + label announced together (D2-007 §6.2).
- **States:** critical, warn, info.
- **Dependencies:** none.

## Progress Indicator (Determinate, D2-005 §15)

- **Purpose:** a known-duration wait or completion fraction.
- **Token mapping:** `--zenith-border-default` (track),
  `--zenith-accent-default` (fill).
- **Behavior:** communicates continuity only — never accelerates near
  completion to imply urgency (D1-002 §5.2).
- **States:** in-progress, complete.
- **Dependencies:** none.

## Tabs

- **Purpose:** the generalized Secondary Navigation sub-view toggle
  (`M4-002` §3.2; **Source:** `M4-009` §6/§7, Calendar/News sub-view
  toggle, generalized to a reusable primitive).
- **Responsibilities:** narrow the *same* Decision Flow question its
  parent screen already answers — never introduce a new one
  (`M4-002` §3.2, binding).
- **Composition:** a row of Tertiary-tier labels (D1-003 §3.1), one
  marked active.
- **Token mapping:** `--zenith-accent-default` (active),
  `--zenith-text-secondary` (inactive).
- **Accessibility:** `role="tablist"`/`tab`, state announced
  (D2-007 §2.1).
- **Interaction:** low-stakes, frictionless toggle.
- **States:** active, inactive, focus.
- **Dependencies:** design tokens.

------------------------------------------------------------------------

# 5. Overlays

## Dropdown (Select, D2-005 §6)

- **Purpose:** filter/sort controls (every screen's own Peripheral row).
- **Token mapping:** `--zenith-layer-overlay`, `--zenith-accent-default`
  (selected indicator, not a full-row fill).
- **Interaction:** low-stakes, no confirmation (D1-002 §12.1).
- **States:** closed, open, option-hover, option-selected.
- **Dependencies:** design tokens.

## Modal (Dialog, D2-005 §10)

- **Purpose:** an interaction requiring full, undivided attention.
- **Token mapping:** `--zenith-opacity-scrim`, `--zenith-layer-modal`,
  `--zenith-elevation-2`, `--zenith-radius-lg`.
- **Accessibility:** focus trap, returns focus on close, `Escape`
  dismisses unless mid-flight and irreversible (D2-007 §2.3-2.4).
- **Behavior:** never used for a low-stakes confirmation that Toast (§7)
  or an inline state could carry instead.
- **States:** open, closing, closed.
- **Dependencies:** design tokens; composes Button (Primary +
  Tertiary/"cancel").

## Tooltip (D2-005 §11)

- **Purpose:** supplemental context only.
- **Constraint:** never carries information required to understand a
  Primary/Secondary element (D1-002 §1) — if it would, the content
  belongs in the visible layout instead.
- **Accessibility:** hover **and** focus triggered, never click-only.
- **States:** hidden, visible.
- **Dependencies:** design tokens.

------------------------------------------------------------------------

# 6. Forms

## Search

- **Purpose:** instrument/symbol lookup (§"Resolved Ambiguities" above)
  — not global cross-area search.
- **Composition:** Input (below) + result list (Table or simple list,
  bounded).
- **Token mapping:** shares Input's tokens.
- **Behavior:** every result is a specific instrument, never a bare
  conclusion.
- **States:** empty query, results, no-results (factual, D1-002 §14.1).
- **Dependencies:** Input, Dropdown/list rendering.

## Input (Text Field, D2-005 §5)

- **Purpose:** any single-line entry (filters, form fields).
- **Composition:** label always visible (never placeholder-only —
  D2-005 §5's own cited usability constraint).
- **Token mapping:** `--zenith-border-default`/`emphasis` (focus),
  `--zenith-signal-critical` (error border).
- **States:** default, focus, error, disabled.
- **Dependencies:** design tokens.

## Textarea

- **Purpose:** multi-line entry — **Source:** `M4-008` §6, Trading
  Journal's own entry-reasoning field. Inherits Input's anatomy/states
  exactly (D2-005 §5); the only difference is line count.
- **Composition:** label always visible; reading-width capped per
  D2-003 §4 for the text entered, not the control itself.
- **Token mapping / States / Accessibility:** identical to Input.
- **Dependencies:** Input.

## Checkbox / Radio (D2-005 §7-8)

- **Purpose:** multi-select / single-select.
- **Composition:** box + label always paired (no icon-only controls,
  D1-002 §10.3).
- **Token mapping:** `--zenith-accent-default` (checked fill),
  `--zenith-border-emphasis` (focus ring).
- **States:** unchecked, checked, indeterminate (Checkbox only),
  disabled, focus.
- **Dependencies:** design tokens.

## Switch (D2-005 §9)

- **Purpose:** an immediately-applied, low-stakes preference only
  (D1-002 §12.1) — a consequential setting uses a confirmatory Button
  instead, never a Switch.
- **Token mapping:** `--zenith-accent-default` (on track).
- **States:** off, on, disabled, focus.
- **Dependencies:** design tokens.

------------------------------------------------------------------------

# 7. Feedback & States

## Loading State (Indeterminate, D2-005 §16)

- **Purpose:** genuinely unknown-duration waits.
- **Token mapping:** `--zenith-duration-slow`, `--zenith-easing-standard`.
- **Behavior:** calm, continuous — never a fast/energetic spin.
- **Dependencies:** design tokens.

## Empty State

- **Purpose:** implements D1-002 §14.1-14.3 directly.
- **Responsibilities:** always answers *why empty* and *a legitimate
  next action, if any*; identical tone to a populated state — never
  gamified, never implies the trader is behind (D1-002 §14.2).
- **Composition:** short factual statement + optional single action.
- **Dependencies:** Panel or Card (renders inside either), Button.

## Error State

- **Purpose:** implements D1-002 §14.4-14.6 directly.
- **Responsibilities:** factual disclosure at the severity actually
  warranted (`signal.warn`/`critical` only), last-known-data timestamp
  when applicable, never dramatized language or alarm-styled motion.
- **Dependencies:** Status Indicator, design tokens.

## Skeleton (D2-005 §17)

- **Purpose:** loading placeholder matching the eventual content's own
  shape.
- **Token mapping:** `--zenith-surface-raised` at a pulse between
  `--zenith-opacity-hover` and full.
- **Behavior:** slow, low-contrast pulse — never a bright shimmer
  (decorative, Constitution §5.1 violation).
- **Dependencies:** design tokens.

## Toast (D2-005 §18)

- **Purpose:** transient, non-consequential confirmation.
- **Constraint:** never the sole carrier of a consequential
  disclosure (that requires Notification, below, or a persistent
  Status Indicator).
- **Token mapping:** `--zenith-layer-toast`.
- **Dependencies:** design tokens.

## Notification

- **Purpose:** a **persistent** (non-auto-dismissing) disclosed,
  evidence-backed condition — **Source:** Constitution §10.2 Alerts;
  `M4-002` §4.5; distinct from Toast by persistence, not by visual
  family.
- **Composition:** Status Indicator (severity + label) + dismiss
  action; never implies the trader must act immediately (D1-002 §6,
  `M4-002` §6 — "Alerts → anything implying the trader must act
  immediately" is a binding non-link).
- **Token mapping:** shares Status Indicator's tokens.
- **Interaction:** dismiss/acknowledge; navigate to underlying evidence.
- **States:** active, dismissed.
- **Dependencies:** Status Indicator, Button (Tertiary, dismiss).

------------------------------------------------------------------------

# 8. Data Visualization

## Chart Wrapper

- **Purpose:** the library-agnostic container enforcing D2-006's own
  chart rules around whichever charting library is selected — D2-006
  itself defines "no chart library, chart component code" (Purpose);
  this wrapper is that stated boundary made concrete. **Charting
  library selection is `TODO`** — an engineering/vendor decision, not a
  design one, deliberately not made in this document (consistent with
  this project's own "TODO rather than invent" discipline).
- **Responsibilities:** enforce D2-006 §2 (low-contrast gridlines,
  tabular axis labels, no 3D/shadow, Primary element distinguishable
  without color alone, mandatory legend, `motion.easing.standard`-only
  updates, size/weight tied to Attention level not visual complexity,
  chart+table pairing never both Primary simultaneously).
- **Composition:** wraps chart-library output; injects tokens as
  props/CSS variables, never lets the underlying library apply its own
  default palette.
- **Token mapping:** `--zenith-data-*` (direction), `--zenith-signal-*`
  (risk thresholds only, D2-006 §8), categorical series tokens
  (D2-002 §10), `--zenith-border-default` (gridlines).
- **Accessibility:** a text/tabular equivalent of the chart's own
  Primary reading is always available (never chart-only disclosure).
- **Behavior:** no candlestick/OHLC saturated red/green (D2-006 §1.2,
  binding).
- **States:** loading (Skeleton), empty, error, populated.
- **Dependencies:** design tokens; the chosen charting library (TODO).

------------------------------------------------------------------------

# 9. Composite Trading Cards

Four components, each a generalization of a pattern independently
specified more than once across `M4-003`–`M4-011` — promoted to shared
primitives now per `M4-003` Engineering Observation 3's own
recommendation ("the strongest candidate... for promotion to a
cross-screen shared design-system primitive").

## Decision Card

- **Purpose:** the Panel-level synthesis-plus-disclosure pattern.
  **Source:** `DASH-002`+`DASH-003` (`26` §3), reused identically by
  `M4-004` (Morning Brief's own ranked-narrative headline), `M4-005`
  (AI Workspace's direct-answer region).
- **Composition:** one synthesized conclusion (Primary weight) +
  nested Confidence/Uncertainty (`text.caption`, identical weight both
  halves, Design Constitution rule 8) — nested, never a sibling Card
  (`M4-003.1` §2.2's binding fix, carried forward).
- **Token mapping:** lives inside a Panel (§3) — `text.heading`
  conclusion, `text.caption` nested disclosure, `space.24` between.
- **Accessibility:** announced as one coherent statement, confidence/
  uncertainty as one semantic unit.
- **Behavior:** exactly one per screen (it *is* the Primary region).
- **States:** loading, empty (calm, first-class — Constitution §12.4),
  error, populated.
- **Dependencies:** Panel, Status Indicator (error only).

## Insight Card

- **Purpose:** a Secondary-Attention evidence item with expandable
  depth. **Source:** `M4-004` Narrative Entry, `M4-005` evidence/
  reasoning block, `M4-006` position record's own annotation.
- **Composition:** one-line conclusion (default) → evidence/reasoning
  (expand, Progressive Disclosure, D1-005 §3.1) → nested Confidence/
  Uncertainty.
- **Token mapping:** Card (§3) shell + `text.body` conclusion +
  `text.caption` nested disclosure.
- **Behavior:** identical treatment regardless of favorability
  (Constitution §7.3) — binding for every instance (Portfolio position,
  Journal entry context).
- **States:** collapsed, expanded, loading, error.
- **Dependencies:** Card, Status Indicator.

## Timeline Card

- **Purpose:** a neutral, chronologically-ordered record. **Source:**
  `M4-008` Trading Journal entry.
- **Composition:** date/instrument header + trader-authored reasoning
  text (`text.body`, reading-width capped, D2-003 §4) + linked
  position/instrument reference.
- **Token mapping:** Card shell; **no `data.*`/`signal.*` coloring of
  the card itself by outcome** (`M4-008` §6, binding) — a linked
  position's own P/L, if shown, is context only, using the same rule
  as Portfolio.
- **Behavior:** default sort chronological only, never by outcome
  (`M4-008` §3, binding — outcome-based sort was a found-and-fixed
  defect, not a design option).
- **States:** default, editable (own entry, pre-commit), loading, empty
  (first-use, factual).
- **Dependencies:** Card, Textarea (edit mode).

## AI Response Block

- **Purpose:** a question-attributed answer. **Source:** `M4-005` §1/§6.
  Distinct from Decision Card by its conversational, question-echo
  contract (Constitution §11.2); composes Decision Card's own
  conclusion-plus-disclosure sub-parts rather than duplicating them.
- **Composition:** echoed question (`text.body`) + Decision Card
  (conclusion + nested confidence/uncertainty) + optional evidence
  expansion (Insight-Card-style).
- **Token mapping:** inherits Decision Card's; no accent-colored
  "chat bubble" (would misapply the accent hue, `M4-003.2` §1.1
  precedent).
- **Accessibility:** answer announced as one coherent block, never
  fragmented; no confidence-sounding qualifier not backed by the
  disclosed value (`M4-005` §3, binding language constraint —
  verified at implementation/copy time, not by this component alone).
- **States:** composing (Loading Indicator), answered, error.
- **Dependencies:** Decision Card, Insight Card, Loading State.

------------------------------------------------------------------------

# Compliance Check

Every component the task named is accounted for (Navigation/Sidebar/
Top Bar → one shell; Status Indicator → Status Chip; all D2-005
families reused verbatim; every composite Card traced to an existing,
already-specified pattern). No new color, spacing, or interaction
vocabulary was introduced; every token reference points to `M5-001`.

------------------------------------------------------------------------

# Documentation Synchronization Note (2026-07-18)

This document's Status previously read "Proposed — Awaiting Product
Leadership Review," which no longer reflected reality: the component
library specified here (`packages/ui`) already exists in the
monorepo, is consumed by `apps/web` via `workspace:*`, and was part of
the foundation Milestone M6 (Visual Identity Package, all four phases
Approved — `M6-004_OFFICIAL_DESIGN_SYSTEM.md`) built on to produce the
live, shipped Dashboard A, whose own visual identity work is now
frozen (Dashboard A Design Freeze, merged to `main`). This entry
corrects the Status field to match that already-implemented,
already-in-production state. It is a documentation synchronization,
not a new architectural review, decision, or re-implementation — no
content in this specification changed.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md`, `D1-003`, `D1-005` §6
- `documentation/zos/D2-005_COMPONENT_FOUNDATIONS.md`, `D2-006`, `D2-007`
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (`DASH-002/003`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §3
- `documentation/zos/M4-003.1_DASHBOARD_WIREFRAME_SPECIFICATION.md`, `M4-003.2`
- `documentation/zos/M4-004_MORNING_BRIEF_SCREEN_DESIGN.md` through `M4-011_REPORTS_SCREEN_DESIGN.md`
- `documentation/zos/M5-001_DESIGN_TOKENS_ARCHITECTURE.md` (token source)
- `documentation/zos/M5-003_FRONTEND_FOUNDATION_ARCHITECTURE.md` (package consumption)
