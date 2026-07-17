# D2-001_DESIGN_TOKENS

**Document ID:** ZOS-D2-001
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

The master token dictionary for Zenith's Design System. Consolidates
every token category in one place. Color, typography, and spacing
tokens are *summarized* here with a pointer to their own deep-dive
document (D2-002, D2-003, D2-004); radius, elevation, border, motion,
duration, opacity, and z-index — none of which has its own document —
are fully defined here. Every token traces back to D1-002 through
D1-005's already-approved rules; none introduces a new design
philosophy. No component, screen, or wireframe is defined.

------------------------------------------------------------------------

# 1. Color Tokens (summary — see D2-002)

Token families: `surface.*`, `text.*`, `border.*`, `accent.*`,
`signal.*`, `data.*`. Full palette, values, and rationale in
`D2-002_COLOR_SYSTEM.md`. Governing rule carried forward unchanged:
color is a closed, disciplined signal vocabulary (D1-003 §1–§5,
D1-002 §2) — never a source of manufactured emotion.

------------------------------------------------------------------------

# 2. Typography Tokens (summary — see D2-003)

Token family: `text.{display,heading,title,subtitle,body,caption,
micro,numeric}` × `{size,lineHeight,letterSpacing,weight}`. Full scale
and rationale in `D2-003_TYPOGRAPHY_SYSTEM.md`.

------------------------------------------------------------------------

# 3. Spacing Scale (summary — see D2-004)

Token family: `space.{4,8,12,16,24,32,48,64,96}`. Base unit 8px (half-
step 4px), per D1-004 §2. Full grid/breakpoint system in
`D2-004_SPACING_LAYOUT_SYSTEM.md`.

------------------------------------------------------------------------

# 4. Radius Scale

New category (D1-004 did not enumerate it). Small, closed set, same
"closed vocabulary" discipline already applied to color (D1-002 §2.1)
and type (D1-002 §3.3):

| Token | Value | Use |
|---|---|---|
| `radius.none` | 0px | Tables, dividers — anything meant to read as a hard edge |
| `radius.sm` | 4px | Inputs, tags, small controls |
| `radius.md` | 8px | Cards, panels, dialogs — the default |
| `radius.lg` | 12px | Large surfaces (a full-page panel) |
| `radius.full` | 9999px | Circular/pill shapes (avatars, status dots, pill badges) |

Rule: one radius value per component *category*, applied identically
everywhere that category appears (Design Constitution §8, Consistency)
— a card is never `radius.md` on one screen and `radius.lg` on another.

------------------------------------------------------------------------

# 5. Elevation Scale

Reuses D1-004 §5 exactly (no more than three steps, used only for
genuine stacking, never to signal importance):

| Token | Shadow | Use |
|---|---|---|
| `elevation.0` | none | Default page surface |
| `elevation.1` | subtle, low-contrast (e.g. `0 1px 2px rgba(0,0,0,0.06)`) | Raised surface (a card on the page background) |
| `elevation.2` | slightly stronger, still low-contrast (e.g. `0 4px 12px rgba(0,0,0,0.10)`) | Overlay/modal above page content |

Rule: no shadow value exists outside this table. Shadows stay
low-contrast at every step — Zenith's calm interface philosophy
(Constitution §5.2) forecloses the dramatic, high-contrast drop
shadows common in consumer/gamified UI.

------------------------------------------------------------------------

# 6. Border System

| Token | Width | Use |
|---|---|---|
| `border.width.hairline` | 1px | Default dividers, card outlines, table rules |
| `border.width.emphasis` | 2px | Focus indicators, selected states only |

Color for both widths comes from `border.default`/`accent.focus`
(D2-002) — this section governs width only. Rule: a border is never
thickened to convey emphasis or urgency outside `border.width.emphasis`'s
one defined use (focus/selection), per Design Constitution §6
(Anti-Urgency).

------------------------------------------------------------------------

# 7. Motion Tokens

Reuses and completes D1-004 §4 (which defined the token names without
concrete values):

| Token | Value | Use |
|---|---|---|
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` (ease-out) | All transitions |

No elastic, bounce, or spring easing exists in the token set — that
class of motion communicates playfulness/excitement, which Constitution
§5.2 and D1-002 §5.2 explicitly exclude. One easing curve, applied
everywhere motion is used, per Design Constitution §8.

------------------------------------------------------------------------

# 8. Duration Tokens

| Token | Value | Use |
|---|---|---|
| `duration.fast` | 120ms | Micro-interactions: hover, focus ring |
| `duration.default` | 200ms | Standard transitions: panel open/close, tab switch |
| `duration.slow` | 320ms | Rare, larger-surface transitions only (e.g. a full-panel reveal) |

Every duration token has a `prefers-reduced-motion` equivalent of 0ms
(instant state change), per D1-004 §4 rule 4.1 and Design Constitution
§5.1/§9.2 — restated here as the concrete value ("0ms," not merely
"instant") so it is directly implementable.

------------------------------------------------------------------------

# 9. Opacity Tokens

New category. Small, closed set — each value has exactly one meaning:

| Token | Value | Use |
|---|---|---|
| `opacity.disabled` | 0.4 | Disabled controls/text |
| `opacity.hover` | 0.06 (overlay on surface) | Hover state background overlay |
| `opacity.pressed` | 0.12 (overlay on surface) | Active/pressed state background overlay |
| `opacity.scrim` | 0.5 | Backdrop behind a modal/dialog |

Rule: opacity is never used to communicate severity or urgency (that
is `signal.*`'s job, D2-002 §4) — only interaction state or layering.

------------------------------------------------------------------------

# 10. Layer Tokens (z-index philosophy)

New category. An ordered, closed stack — each layer has exactly one
meaning, mirroring the "one vocabulary, one meaning" discipline already
applied to color (D1-002 §2.1) and signal severity:

| Token | Value | Use |
|---|---|---|
| `layer.base` | 0 | Default page content |
| `layer.raised` | 10 | Cards/panels that sit above base but below sticky UI |
| `layer.sticky` | 20 | Persistent navigation (D1-005 §4.2) |
| `layer.overlay` | 30 | Dropdowns, tooltips, popovers |
| `layer.modal` | 40 | Dialogs, the scrim behind them |
| `layer.toast` | 50 | Transient notifications — always the topmost layer |

Rule: no component introduces a z-index value outside this table
(Design Constitution §8.2) — a new stacking need is a token proposal,
not a per-component magic number.

------------------------------------------------------------------------

# What This Document Does Not Do

No component is defined (buttons, cards, etc. — see D2-005). No exact
color value is defined here (see D2-002). No screen or layout is
specified (see D2-004, D1-005). This is the token layer only.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (frozen, cited)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (frozen, cited)
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` (§2–§5, §8–§10)
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md`
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md` (§1–§6, extended here)
- `documentation/zos/D2-002_COLOR_SYSTEM.md`
- `documentation/zos/D2-003_TYPOGRAPHY_SYSTEM.md`
- `documentation/zos/D2-004_SPACING_LAYOUT_SYSTEM.md`
