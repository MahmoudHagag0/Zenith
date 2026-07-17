# D2-005_COMPONENT_FOUNDATIONS

**Document ID:** ZOS-D2-005
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

Architectural foundations — anatomy, states, and governing constraints
— for the reusable component families every future screen will draw
from. **No visual mockup, no exact pixel layout, no component library
code.** Each entry states what the component is *for*, what states it
must support, and which existing rule (D1-002 through D1-005, D2-001
through D2-004) constrains it. Final visual treatment is a future,
narrower implementation task per component.

------------------------------------------------------------------------

# 1. Buttons

**Anatomy:** label (required), optional leading/trailing icon
(D1-002 §10, functional only).
**Tiers:** Primary / Secondary / Tertiary — exactly D1-002 §13's Action
Hierarchy, D2-002 §9's token mapping. At most one Primary button per
decision context (D1-002 §13.1).
**States:** default, hover (`opacity.hover`), pressed
(`opacity.pressed`), focus (`border.emphasis` ring), disabled
(`opacity.disabled`), loading (see §16, Loading).
**Constraint:** a destructive/consequential action (Constitution §9.3–
§9.4, D1-002 §12) is never styled identically to a routine one — it
uses Secondary or Tertiary tier plus explicit confirmatory copy, never
a Primary-tier "quick" button, per D1-002 §12.2–§12.3 (Decision
Velocity).

------------------------------------------------------------------------

# 2. Cards

**Anatomy:** surface (`surface.raised`), optional header region, body
region, optional footer/action region. `elevation.1`, `radius.md`
(D2-001 §4–§5).
**Constraint:** a card never uses color or elevation to imply severity
(that is `signal.*`'s job) — a card's own visual weight is uniform
regardless of the favorability of its content (Constitution §7.3,
§12.4; D1-005 §2.3, Record/Detail Archetype).

------------------------------------------------------------------------

# 3. Panels

**Anatomy:** same as Card, but full-bleed within its containing region
rather than a discrete boxed surface — used for a screen's own primary
content area rather than a discrete item. `elevation.0` typically (a
panel is the page, not raised above it).
**Constraint:** exactly one panel may hold Primary Attention per screen
(D1-002 §1.1).

------------------------------------------------------------------------

# 4. Tables

**Anatomy:** header row (`text.micro`, D2-003 §6.1), data rows
(`text.numeric` for numeric columns, tabular figures mandatory),
optional row-level actions (Tertiary tier, §1 above).
**States:** default row, hover row (`opacity.hover`), selected row
(`surface.raised` + `border.emphasis` left rule, D2-002 §9).
**Constraint:** a table is the canonical container for Medium/High-
density content (D2-004 §8) — never used to display a screen's own
Primary Attention conclusion directly (D1-002 §1.2).

------------------------------------------------------------------------

# 5. Inputs (Text Fields)

**Anatomy:** label (always visible, never placeholder-only — a
placeholder disappearing on focus/entry is a known usability failure
**[Industry Best Practice]**), input surface, optional helper/error
text below.
**States:** default (`border.default`), focus (`border.emphasis`),
error (`signal.critical` border + helper text using the same token),
disabled (`opacity.disabled`).
**Constraint:** an error state uses D1-002 §14's Error State Rules —
factual helper text, `signal.critical` only when genuinely blocking,
never a red flash or shake.

------------------------------------------------------------------------

# 6. Dropdowns (Select)

**Anatomy:** trigger (styled as an Input, §5, or a Tertiary button, §1
depending on context), option list rendered at `layer.overlay`
(D2-001 §10).
**States:** closed, open, option-hover, option-selected (`accent`
check/indicator, not a full-row color fill, to avoid implying
severity).
**Constraint:** opening a dropdown is a low-stakes interaction (D1-002
§12.1) — no confirmation friction.

------------------------------------------------------------------------

# 7. Checkboxes

**Anatomy:** box + label, always paired (Design Constitution §10.3 —
no icon-only controls).
**States:** unchecked, checked (`accent.default` fill), indeterminate,
disabled, focus (`border.emphasis` ring around the box).

------------------------------------------------------------------------

# 8. Radio Buttons

**Anatomy:** identical states to Checkboxes (§7), single-select
semantics. Grouped options always share one visible group label — a
radio group is never presented as unrelated individual controls.

------------------------------------------------------------------------

# 9. Switches (Toggles)

**Anatomy:** track + thumb, label always adjacent (never icon-only).
**States:** off (`surface`/`border.default` track), on
(`accent.default` track), disabled, focus.
**Constraint:** a switch is for an immediately-applied, low-stakes
preference (D1-002 §12.1) — a consequential setting change uses a
confirmatory action instead (§1, Buttons), never an instant-toggling
switch.

------------------------------------------------------------------------

# 10. Dialogs (Modals)

**Anatomy:** scrim (`opacity.scrim`, `layer.modal`), surface
(`surface.overlay`, `elevation.2`, `radius.lg`), title, body, action
row (Primary + Tertiary/"cancel," §1).
**Constraint:** reserved for interactions requiring the trader's full,
undivided attention (Constitution §6.4) — never used for low-stakes
confirmations that could instead be a Toast (§18) or inline state.
Escape/scrim-click dismissal always available unless the action is
irreversible and mid-flight.

------------------------------------------------------------------------

# 11. Tooltips

**Anatomy:** small surface (`surface.raised`, `elevation.1`,
`layer.overlay`), triggered by hover/focus, never click-only (would be
unreachable via keyboard otherwise, D2-007).
**Constraint:** supplemental only — a tooltip never carries information
required to understand a Primary or Secondary Attention element (D1-002
§1); if the content is that important, it belongs in the visible
layout, not hidden behind hover.

------------------------------------------------------------------------

# 12. Badges

**Anatomy:** small, compact label, `radius.full` or `radius.sm`, no
icon required.
**Use:** a static count or label (e.g. "3 new") — factual, never
implying urgency via color unless the underlying condition is a genuine
`signal.warn`/`signal.critical` (D1-002 §6, Anti-Urgency).

------------------------------------------------------------------------

# 13. Tags

**Anatomy:** identical structure to Badges (§12) but represent a
user- or system-applied category/label rather than a count — e.g. an
instrument's classification. Uses neutral/`accent` tokens, never
`signal.*` (tags are not alerts).

------------------------------------------------------------------------

# 14. Status Chips

**Anatomy:** Badge structure (§12) explicitly reserved for
`signal.critical`/`signal.warn`/`signal.info` states (D2-002 §4) — the
one component family permitted to use those tokens for its own fill/
text color, since its entire purpose is displaying severity.
**Constraint:** a Status Chip's color-coding is always paired with a
text label (D1-002 §9.3, no information by color alone) — never an
unlabeled colored dot standing alone as the only indicator.

------------------------------------------------------------------------

# 15. Progress (Determinate)

**Anatomy:** track (`border.default` color) + fill (`accent.default`).
**Constraint:** communicates continuity/cause only (D1-002 §5.2) —
never accelerates or animates in a way implying urgency as it
approaches completion.

------------------------------------------------------------------------

# 16. Loading (Indeterminate)

**Anatomy:** a calm, continuous indicator (e.g. a slow, steady
indeterminate bar or spinner) — `motion.duration.slow`-paced, looping,
`motion.easing.standard` only, never a fast/energetic spin.
**Constraint:** used for genuinely unknown-duration waits; a known-
duration wait uses Progress (§15) instead.

------------------------------------------------------------------------

# 17. Skeleton (Loading Placeholder)

**Anatomy:** neutral-toned blocks (`surface.raised` at a subtle pulse
opacity between `opacity.hover` and full) matching the approximate
shape of the content about to load.
**Constraint:** the pulse animation is slow and low-contrast
(Constitution §5.2) — never a bright shimmer/sheen effect, which reads
as decorative rather than functional (Constitution §5.1).

------------------------------------------------------------------------

# 18. Toast (Transient Notification)

**Anatomy:** small surface at `layer.toast`, auto-dismissing after a
generous, factual-reading-time duration (not a marketing-style quick
flash), optional single action.
**Constraint:** never used for a condition requiring a trader's
decision (that requires a Dialog, §10, or a persistent Status Chip/
Alert, §14) — a Toast that disappears cannot be the sole carrier of
something consequential (Constitution §12.4, no-trade/limitation
disclosures must persist, not flash and vanish).

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` (all sections — every component above is constrained by it)
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2
- `documentation/zos/D2-001_DESIGN_TOKENS.md`
- `documentation/zos/D2-002_COLOR_SYSTEM.md`
- `documentation/zos/D2-007_ACCESSIBILITY_GUIDE.md`
