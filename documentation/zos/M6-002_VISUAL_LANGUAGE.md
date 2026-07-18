# M6-002_VISUAL_LANGUAGE

**Document ID:** ZOS-M6-002
**Version:** 1.0.0
**Status:** APPROVED
**Owner:** Architecture Team
**Milestone:** M6 — Zenith Visual Identity Package (Phase 2)

------------------------------------------------------------------------

# Purpose

Translates M6-001's philosophy into visual *rules* — still
direction-agnostic (no hex values, no final type scale; those are
Phase 3/4). This document is the rulebook Phase 3's three directions
are each judged against, and Phase 4's chosen numbers must satisfy.

------------------------------------------------------------------------

# 1. Background Language

- Exactly one canvas background per theme mode. It is the lowest
  layer and the least visually active surface in the entire system.
- Backgrounds never carry gradients, texture, or imagery. A gradient
  is a decorative device Zenith's "evidence over ornament" rule
  (M6-001 §3) excludes by construction.
- Background-to-surface contrast is deliberately *low* (a calm reading
  environment), while surface-to-text contrast stays fully WCAG AA
  (M6-001 §14) — the calm comes from how close surfaces sit to the
  canvas, never from weakening text contrast.

# 2. Surface Language

- Two surface tiers only: **base** (canvas) and **raised** (cards,
  panels, popovers). A third "overlay" tier exists solely for
  modal/scrim contexts (D2-001), never for everyday content stacking.
- Raised surfaces are distinguished from base by elevation (§3) and/or
  a single hairline border — never by a visibly different hue that
  would read as "branded" rather than "structural."

# 3. Elevation Language

- One elevation family (M5-001 §9, unchanged): a small, closed set of
  steps (flat / raised / overlay). No component invents a fourth.
- Elevation encodes *stacking order*, not importance. A Decision Card
  and an empty-state Card sit at the identical elevation step
  (M6-001 §8) — content never earns "more" elevation by being good
  news.
- Elevation is expressed as **either** a soft shadow **or** a hairline
  border, consistently, per the direction chosen in Phase 3 — never
  both stacked on the same surface (visual redundancy, and it competes
  with the "evidence over ornament" rule).

# 4. Shadow Language

- If shadows are used at all, exactly one shadow recipe per elevation
  step, extremely low opacity, no color tint beyond neutral-on-neutral.
  A shadow that is visible enough to notice as a *design flourish* is
  too strong.
- Shadows never appear on text, icons, or data — only on surface
  containers.

# 5. Radius Language

- One radius scale, three steps at most (none / small / medium). Full
  pill/circular radius is reserved for chips and status indicators
  only, never for cards or panels (a rounded-pill card reads as
  consumer-app, not professional-analyst — M6-001 §1).
- Radius is applied consistently per component *type*, never varied
  per instance for visual interest.

# 6. Spacing Language

- Spacing is drawn from one 8pt-derived scale (unchanged structurally
  from D2-004). Every gap between elements is a named token; no
  freehand pixel gap is introduced by this identity pass.
- Vertical rhythm between stacked blocks is *larger* than the internal
  padding of any one block — this is what makes scanning down a page
  feel calm rather than cramped, independent of which direction is
  chosen.

# 7. Information Density

- Density is a per-surface decision, not a global one: Dashboard/
  synthesis surfaces stay generously spaced (low density); table/list
  surfaces (Watchlist, Journal, COT) are allowed measurably tighter
  row spacing, because that is where professional traders actively
  want more rows on screen at once. Phase 4 must define both a "calm"
  and a "dense" spacing preset explicitly, not leave density to drift
  per-screen.

# 8. Whitespace

- Whitespace is the primary tool for signaling "this is a separate
  idea." Two blocks with unrelated content are always separated by
  more whitespace than two blocks that are part of the same reading
  unit (e.g., a Decision Card's conclusion and its own reasoning).

# 9. Visual Rhythm

- A page's blocks form a single descending rhythm of visual weight:
  Primary → Secondary → Peripheral (already established by Dashboard's
  own information architecture, M4-003 — unchanged). The visual
  identity's job is to make that rhythm *visible* through consistent,
  proportional steps in type size, spacing, and surface treatment
  between the three tiers — not to invent a new hierarchy.

# 10. Reading Rhythm

- Prose (narrative/reasoning text) keeps a measured line length
  (D2-003's 50–75ch rule, unchanged) and generous line-height, because
  it is read left-to-right as sentences.
- Numeric/tabular content is exempted from prose reading-rhythm rules;
  it is scanned top-to-bottom/column-wise, and its rhythm is governed
  by table row height and column alignment instead (§12).

# 11. Hierarchy Rules

- Hierarchy is established, in order of authority: **position** (top
  of visual flow ranks highest) → **size** → **weight** → **color**.
  Color is deliberately last — a design that only works because of
  color fails the grayscale identity test (M6-001 §16.1).
- No more than three type sizes are ever visible in a single view
  outside of a dedicated data table.

# 12. Icon Language

- One icon family, one stroke weight, one optical size per context
  (nav vs. inline vs. status). Icons never carry meaning alone — every
  icon in the product ships with an accessible text label or adjacent
  text (D2-007, M6-001 §12).

# 13. Illustration Policy

- Zenith ships **no decorative illustration** anywhere in the product.
  Empty states, error states, and onboarding communicate through
  typography and the existing Empty/Error State components only. This
  is a deliberate, permanent policy, not a placeholder pending future
  art — decorative illustration is exactly the "looks nice, doesn't
  help the decision" category M6-001 §15 excludes.

# 14. Chart Language

- Charts use the closed D2-006 series palette and its ordering rules
  unchanged; Phase 4 only re-tunes the *specific* series hex values to
  match the chosen direction's palette temperature, not the system.
- A chart's gridlines and axis labels sit visually *below* the data
  series in contrast — the data is always the loudest element in its
  own chart.

# 15. Table Language

- Header row is typographically distinct (weight, not color) from body
  rows. Numeric columns are right-aligned with tabular figures
  (unchanged, D2-003 §5.1). Row hover/selection states use the same
  neutral interaction-opacity tokens as every other component — a
  table never gets its own bespoke hover color.

# 16. Animation Language

- Content transitions (route change, data refresh) use the single
  duration/easing system (M6-001 §11). Nothing pulses, bounces, or
  loops to draw attention outside of the existing Skeleton loading
  pattern, and Skeleton's own pulse stays low-contrast by design
  (already the case; Phase 4 re-tunes its opacity for legibility per
  the visual review findings in the prior Dashboard implementation,
  without abandoning the low-contrast intent).

# 17. Micro-Interaction Language

- Every interactive element has a visible, not merely technically
  compliant, hover and focus state (a finding from the prior
  Dashboard visual review: hover feedback that is *only* a subtle
  color shift is too faint in practice). Phase 4 must specify a hover
  treatment that combines a background-tint shift **and** a shadow or
  border change, so the affordance survives at a glance, not only on
  close inspection.
- Focus rings are always the single accent color, always visible, and
  never suppressed for `:focus-visible` compliant interactions.

------------------------------------------------------------------------

# Related Documents

- M6-001_VISUAL_IDENTITY_CONSTITUTION.md — philosophy this language implements.
- M6-003_VISUAL_DIRECTIONS.md — next phase, three concrete directions judged against this language.
- D2-004, D2-005, D2-006, D2-007 — structural rules this language stays consistent with.
