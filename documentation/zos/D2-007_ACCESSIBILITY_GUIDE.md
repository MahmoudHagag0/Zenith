# D2-007_ACCESSIBILITY_GUIDE

**Document ID:** ZOS-D2-007
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

Consolidates every accessibility rule already binding via D1-002 §9
(Accessibility Rules Baseline) and scattered references across D1-003/
D1-004/D2-001–D2-006, and adds the rules those documents did not yet
state explicitly: keyboard navigation and screen reader behavior. One
reference document so accessibility compliance is checkable in one
place rather than re-derived per screen.

------------------------------------------------------------------------

# 1. Contrast Rules

Restates D1-002 §9.1 (binding, no exceptions): WCAG 2.1 AA is the
contrast floor for all text and meaningful graphical elements, in both
light and dark mode, verified against the actual D2-002 palette values
before implementation (D1-003 §2, §6.3) — not assumed from the
reference values alone.

------------------------------------------------------------------------

# 2. Keyboard Navigation

New content — not previously specified.

2.1. Every interactive element (D2-005: buttons, inputs, dropdowns,
checkboxes, radio, switches, tabs, table row actions) is reachable and
operable via keyboard alone — `Tab`/`Shift+Tab` to move focus,
`Enter`/`Space` to activate, arrow keys within a composite widget
(radio group, dropdown option list, tab list).

2.2. Focus order follows visual/DOM reading order, which itself follows
the screen's own Attention Hierarchy (D1-002 §1, D1-005) — a trader
tabbing through a screen encounters Primary before Secondary before
Supporting before Peripheral, mirroring the intended reading order, not
an arbitrary markup order.

2.3. A Dialog (D2-005 §10) traps focus within itself while open and
returns focus to the triggering element on close — focus is never lost
to the page background behind an open modal.

2.4. `Escape` closes any Dialog, Dropdown, or Tooltip that is
currently open, consistently, everywhere (D1-002 §8, Consistency).

------------------------------------------------------------------------

# 3. Reduced Motion

Restates D1-002 §9.2 and D2-001 §8 (binding): every animated
transition has a `prefers-reduced-motion` equivalent defined at the
same time as the animation, not retrofitted later — the reduced
equivalent is an instant (0ms) state change or, where a transition
communicates real spatial relationship (e.g. a panel appearing from a
specific side), a simple cross-fade only, never full motion suppressed
to a jarring instant snap for spatially-meaningful transitions.

------------------------------------------------------------------------

# 4. Focus Indicators

Restates D2-002 §9 (binding): every focusable element shows a visible
`border.emphasis` outline (2px, `accent.focus`) on keyboard focus —
never suppressed (no `outline: none` without a compliant visible
replacement), and never color-alone (the 2px width itself, not only a
color change, carries the signal, so it remains visible for
low-vision/high-contrast-mode users).

------------------------------------------------------------------------

# 5. Color Blindness

Restates D1-001 §4 and D2-002 §11 (binding): no information is
conveyed by color alone anywhere in the system (D1-002 §9.3) —
directional financial data leads with symbol/typography (D2-002 §9,
D2-003 §5.3), Status Chips pair color with a text label (D2-005 §14),
and chart Primary elements are distinguishable by weight/size/label,
not color alone (D2-006 §2.4). Approximately 8% of men have red-green
color vision deficiency (D1-001 §4) — this system's own governing
color decision (no saturated red/green, D2-002 §11) already reduces
this risk relative to a conventional trading palette, and this section
makes the redundant-channel requirement explicit and binding beyond
that.

------------------------------------------------------------------------

# 6. Screen Reader Considerations

New content — not previously specified.

6.1. Every icon that conveys meaning has an accessible label
(`aria-label` or equivalent) — restates D1-002 §10.3, extended here to
screen-reader behavior specifically: an icon-only button announces its
action, not its icon name (e.g. "Dismiss," not "X icon").

6.2. A Status Chip (D2-005 §14) announces both its severity and its
label text — color alone is never the only signal exposed to assistive
technology, mirroring §5 above for sighted users.

6.3. A Toast (D2-005 §18) is announced via an appropriate live region,
at a factual/calm assertiveness level (not an "assertive" interrupt
unless the underlying condition genuinely warrants immediate
attention, per D1-002 §14, Empty & Error State Rules) — consistent
with this system's broader anti-urgency principle (D1-002 §6) applying
equally to assistive-technology announcement priority, not only visual
treatment.

6.4. Table headers (D2-005 §4) use semantic header markup so column/
row relationships are announced correctly for tabular/numeric data,
not only visually implied via alignment.

------------------------------------------------------------------------

# 7. Typography Accessibility

Restates D2-003's own binding minimums as accessibility floors, not
merely stylistic defaults:

7.1. `text.numeric`'s tabular figures (D2-003 §5) benefit low-vision
users scanning a column as much as sighted users generally — digit
alignment is an accessibility property, not only an aesthetic one.

7.2. No text renders below `text.micro`'s 12px floor (D2-003 §1) —
this system defines no smaller tier, precisely so no future screen can
introduce one.

7.3. Line height and letter spacing (D2-003 §2–§3) are never reduced
below this document's own tables to fit more content — content density
is solved via D2-004's spacing/density rules, never by degrading
typographic legibility.

7.4. Text is never rendered as an image or locked to a fixed size
that ignores the user's own browser/OS text-scaling preference —
implementation detail, but binding: `rem`-based sizing (D2-003 §1's
values are already stated in `rem`) is required, not optional.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §3–§5
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §5, §6, §9, §14 (baseline restated/completed here)
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md` §2, §6
- `documentation/zos/D2-001_DESIGN_TOKENS.md` §7–§8
- `documentation/zos/D2-002_COLOR_SYSTEM.md` §8–§9, §11
- `documentation/zos/D2-003_TYPOGRAPHY_SYSTEM.md`
- `documentation/zos/D2-005_COMPONENT_FOUNDATIONS.md`
- `documentation/zos/D2-006_DATA_VISUALIZATION_SYSTEM.md` §2.4
