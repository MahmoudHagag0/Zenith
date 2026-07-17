# D1-004_DESIGN_SYSTEM_FOUNDATION

**Document ID:** ZOS-D1-004
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation

------------------------------------------------------------------------

# Purpose

Defines the foundation-level design tokens (typography, spacing,
motion, elevation, iconography, breakpoints) that every future screen
and component draws from. Operationalizes Constitution §8.5–§8.7 and
Design Constitution §3–§5, §10–§11. Does not define components,
screens, or wireframes — token scales and the rules governing them
only, per this package's stated scope boundary.

------------------------------------------------------------------------

# 1. Typography Scale

**Rationale (D1-001 §3):** a small, fixed number of steps keeps the
system's own extraneous cognitive load low (Sweller, Cognitive Load
Theory) and keeps Design Constitution rule 3.3 enforceable.

A modular scale, single base size, limited number of steps:

| Token | Role | Notes |
|---|---|---|
| `text.display` | Rare, large synthesis statements only (e.g. a headline reading) | Used sparingly — not a default heading size |
| `text.heading.lg` | Screen/section titles | |
| `text.heading.sm` | Sub-section titles | |
| `text.body` | Default reading text | Line length target 50–75 characters at default container width (D1-001 §3) |
| `text.body.small` | Secondary/supporting text | Never used for a Primary-Attention conclusion (ZXL §1.1) |
| `text.caption` | Labels, metadata, timestamps | Lowest-emphasis text step |
| `text.numeric` | All numeric/financial data | **Always tabular figures** (Design Constitution 3.1) — this is a distinct token from `text.body` specifically so tabular-figure enforcement is structural, not a per-instance choice |

Rules:
- 1.1. No screen introduces a font size outside this table (Design
  Constitution 3.3).
- 1.2. `text.numeric` is used for every number a trader compares against
  another number (prices, P/L, percentages, confidence values) —
  never `text.body` for these.
- 1.3. Every text token's contrast against every applicable surface
  token (D1-003 §2) meets WCAG 2.1 AA (Design Constitution 3.4).

------------------------------------------------------------------------

# 2. Spacing Scale

**Rationale (D1-001 §3):** whitespace is a structural element (Gestalt
figure-ground), not filler — a consistent base unit makes "enough
whitespace" a checkable property instead of a subjective one.

A single base unit with a small multiplier sequence (e.g., a 4-based
scale: 4, 8, 12, 16, 24, 32, 48, 64) covering:

| Token | Role |
|---|---|
| `space.xs`–`space.sm` | Internal component padding, tight groupings |
| `space.md` | Default gap between related elements |
| `space.lg`–`space.xl` | Separation between distinct sections/regions |
| `space.2xl`+ | Separation between a Primary Attention region and everything else (ZXL §1.1) |

Rules:
- 2.1. All spacing values are drawn from this scale — no arbitrary
  pixel gaps (Design Constitution 4.1).
- 2.2. The gap between a screen's Primary Attention region and the next
  region is always drawn from the largest tier available — visually
  reinforcing the Attention Hierarchy structurally, not only through
  type/color weight.

------------------------------------------------------------------------

# 3. Grid & Breakpoints

**Rationale:** Attention Hierarchy must survive viewport changes
(Design Constitution §11).

| Token | Approx. range | Layout implication |
|---|---|---|
| `breakpoint.compact` | Narrow / mobile-width | Single column; Primary Attention region always first in document order |
| `breakpoint.regular` | Tablet-width | Primary Attention region retains top/first position; Secondary may sit alongside |
| `breakpoint.wide` | Desktop-width | Multi-column layouts permitted; Primary Attention retains the highest-attention position (D1-001 §2) regardless of added columns |

Rule 3.1: a responsive collapse never reorders Primary Attention behind
any Secondary/Supporting/Peripheral element (Design Constitution 11.1).

------------------------------------------------------------------------

# 4. Motion & Timing

**Rationale (D1-001 §5, §7):** motion communicates continuity/cause
only; must never read as alarm; must always have a reduced-motion
equivalent.

| Token | Role | Reduced-motion equivalent |
|---|---|---|
| `motion.duration.fast` | Micro-interactions (hover, focus) | Instant state change, no transition |
| `motion.duration.default` | Standard transitions (panel open/close) | Instant or cross-fade only, no movement |
| `motion.easing.standard` | Default easing curve for continuity | N/A — governs the animated case only |

Rules:
- 4.1. Every use of `motion.duration.*` has a defined reduced-motion
  fallback at definition time (Design Constitution 5.1).
- 4.2. No motion token is used to create a flash, shake, or rapid pulse
  on any data update, regardless of the magnitude of change (Design
  Constitution 5.3, D1-001 §7).
- 4.3. No motion token is used purely decoratively (e.g., an
  auto-playing entrance animation with no informational cause).

------------------------------------------------------------------------

# 5. Elevation & Depth

**Rationale:** depth communicates layering (this is above that), never
decoration (Constitution §5.1, Clarity Over Decoration).

A minimal elevation scale (e.g., `elevation.0` flat, `elevation.1`
raised surface such as a card, `elevation.2` overlay/modal) — no more
than three steps. Rule: elevation is used only where a genuine
stacking/layering relationship exists (a modal over content, a card on
a background) — never to make an element "feel more important," which
is Attention Hierarchy's job (§1 above, ZXL §1), not elevation's.

------------------------------------------------------------------------

# 6. Iconography

**Rationale:** Design Constitution §10.

6.1. One icon set, one stroke weight, applied consistently — no mixing
of styles for the same semantic category.

6.2. Icons are functional only (Constitution §5.1) — every icon that
conveys meaning pairs with a text label or accessible equivalent
(`aria-label`, tooltip), never standing alone as the sole information
carrier (Design Constitution 10.3, 9.3).

6.3. An icon's meaning is drawn from the same closed vocabulary as
color signals (D1-003 §4) where applicable — e.g., a "requires
attention" icon and `signal.warn`/`signal.critical` always co-occur,
never independently.

------------------------------------------------------------------------

# 7. Component-Level Restraint (Explicit Non-Scope)

This document defines tokens and the rules governing them. It does
**not** define:

- Specific components (buttons, cards, tables, charts) or their states.
- Any per-screen layout or wireframe.
- Exact numeric/hex token values — those are an implementation task for
  the Sprint that builds the actual token file, verified against
  accessibility tooling at that time.

Component-level specification follows the precedent already set by
`26_DASHBOARD_HOME_SPECIFICATION.md` (a per-screen component hierarchy,
authored only once a screen's own Purpose/Psychological Objective/
Business Objective/Success Criteria are stated per Constitution §10.1)
— this document is a prerequisite input to that future work, not a
replacement for it.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 §8.5–
  §8.7, §14 — frozen, cited, not modified)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZOS-027 §1, §3 —
  frozen, cited, not modified)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` (§3, §5, §7)
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` (§3–§5, §10–§11)
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md`
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md`
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (component-spec
  precedent, cited, not modified)
