# M6-004_OFFICIAL_DESIGN_SYSTEM

**Document ID:** ZOS-M6-004
**Version:** 1.0.0
**Status:** APPROVED
**Owner:** Architecture Team
**Milestone:** M6 — Zenith Visual Identity Package (Phase 4)

------------------------------------------------------------------------

# Purpose

Concrete values for Direction A ("Executive Intelligence"), replacing
D2-002 through D2-006's specific numbers inside the unchanged
D1/M5 token architecture (M6-001's Scope Note). These are the values
`packages/design-tokens` implements in Phase 5. Token *names* below are
unchanged from M5-001 — only what each name resolves to changes.

------------------------------------------------------------------------

# 1. Backgrounds & Surfaces

Warm neutral paper, not clinical white; warm near-black in dark mode,
not pure black — both chosen for long-session comfort (M6-001 §14
inherited, §4).

| Token | Light | Dark |
|---|---|---|
| `surface.base` (canvas) | `#F8F6F0` | `#17150F` |
| `surface.raised` (card/panel) | `#FFFFFF` | `#211E17` |
| `surface.overlay` (modal/scrim backdrop) | `#FFFFFF` | `#262319` |

# 2. Text

| Token | Light | Dark |
|---|---|---|
| `text.primary` | `#1C1A16` | `#F1EDE4` |
| `text.secondary` | `#5B564C` | `#B8B2A2` |
| `text.muted` | `#6A6455` | `#9C9580` |

**Self-review correction:** the first draft of `text.muted` (`#8A8477`
light / `#837C6C` dark) measured 3.72:1 / 4.01:1 against
`surface.raised` — below the 4.5:1 AA threshold for the small text it
is actually used on (`ErrorState`'s timestamp, the Dashboard peripheral
row links — both `text.micro`, 12px). Darkened/lightened to the values
above, which measure 5.89:1 / 5.56:1.

# 3. Borders

| Token | Light | Dark |
|---|---|---|
| `border.default` | `#E4E0D6` | `#343026` |
| `border.emphasis` | `#C9C3B4` | `#4A4536` |

# 4. Accent (single, system-wide "you can act here")

Deep ink-teal — desaturated, no tech-startup-blue energy (M6-001 §5).

| Token | Light | Dark |
|---|---|---|
| `accent.default` | `#1F5E56` | `#4FA79A` |
| `accent.emphasis` (active/pressed) | `#163F3A` | `#6BC2B4` |
| `accent.focus` (focus ring) | `#1F5E56` | `#5CB6A8` |

# 5. Signal Vocabulary (closed set, unchanged meaning from D1-002/D1-003)

| Token | Light | Dark |
|---|---|---|
| `signal.critical` | `#8C4A3D` | `#C2897B` |
| `signal.warn` | `#8A6E33` | `#C9A968` |
| `signal.info` | `#4B6478` | `#8CA6B8` |
| `success` | `#4F7358` | `#8CAE8F` |

# 6. Financial Data Colors (deliberately desaturated — M6-001 §5)

| Token | Light | Dark |
|---|---|---|
| `data.positive` | `#4F7358` | `#8CAE8F` |
| `data.negative` | `#8F5349` | `#C2897B` |
| `data.neutral` | `#6A6455` | `#9C9580` |

**Self-review correction:** the first draft of `data.negative` (light,
`#A9695D`) measured 4.32:1 against `surface.raised` — a P&L figure is
ordinary-sized numeric text, not exempt large text, so this fails AA.
Darkened to `#8F5349` (6.00:1). `data.neutral` is set equal to the
corrected `text.muted` rather than the original (also-failing)
`#8A8477`.

# 7. Chart Series (closed, ordered — D2-006 rules unchanged)

| Series | Light | Dark |
|---|---|---|
| 1 (primary accent) | `#1F5E56` | `#4FA79A` |
| 2 | `#A9695D` | `#C2897B` |
| 3 | `#8A6E33` | `#C9A968` |
| 4 | `#4B6478` | `#8CA6B8` |
| 5 | `#6B5670` | `#A68CAE` |

------------------------------------------------------------------------

# 8. Typography

Editorial confidence achieved through scale/weight contrast, not a new
font family (M6-002 §12/§17's maintenance-cost reasoning — no web font
load, no FOUT/FOIT handling to build). System sans stack, unchanged
family; the scale itself widens its display/heading jump for a more
authoritative hierarchy (M6-001 §6).

| Tier | Size | Line-height | Letter-spacing | Weight |
|---|---|---|---|---|
| display | 2.75rem | 1.15 | -0.02em | 700 |
| heading | 1.875rem | 1.2 | -0.015em | 700 |
| title | 1.375rem | 1.2 | 0em | 600 |
| subtitle | 1.0625rem | 1.5 | 0em | 500 |
| body | 1rem | 1.6 | 0em | 400 |
| caption | 0.875rem | 1.6 | 0em | 400 |
| micro | 0.75rem | 1.6 | 0.03em | 500 |

**Fix applied during this phase:** the numeric font-family previously
declared a `"Inter"` fallback that was never loaded via `@font-face` —
it silently resolved to the `ui-monospace, monospace` fallback in every
browser, making the declared family dead, misleading configuration.
`fontFamilyNumeric` now equals `fontFamilyText` (same system sans
stack); the only mandatory numeric requirement is
`font-variant-numeric: tabular-nums` (D2-003 §5.1), which is a font
*feature*, not a font *family* — numerals do not need a monospace
family to align in fixed-width columns once tabular figures are
enabled.

------------------------------------------------------------------------

# 9. Radius

Scale unchanged (`none`/`sm`/`md`/`lg`/`full`); usage rule tightened
per Direction A (M6-002 §5) — cards/panels/buttons never exceed `md`.
`lg` is reserved for large modal surfaces only; `full` is reserved for
chips/status indicators only. No component may use `lg` or `full` for
its own visual interest outside these roles.

| Token | Value |
|---|---|
| `radius.none` | `0px` |
| `radius.sm` | `4px` |
| `radius.md` | `8px` |
| `radius.lg` | `12px` |
| `radius.full` | `9999px` |

------------------------------------------------------------------------

# 10. Elevation & Borders

Direction A resolves M6-002 §3's "shadow **or** border, never both on
the same surface" in favor of **hairline border as the primary
separation technique** (the "senior research desk," not "soft app,"
personality — M6-001 §1):

| Step | Treatment |
|---|---|
| `elevation.0` (Panel — full-bleed) | No border, no shadow (unchanged, D2-005 §3). |
| `elevation.1` (Card, raised content) | `1px solid border.emphasis`, **no shadow.** |
| `elevation.2` (Modal/overlay, floating above a scrim) | `1px solid border.emphasis` **plus** one soft shadow — justified because an overlay must separate from page content *behind a scrim*, a different problem than separating siblings on the same page, so this is not the "both on the same surface" case §3 forbids. |

**Self-review correction:** `border.default` against `surface.raised`
measures only ~1.3:1 — visually near-invisible once the shadow is
removed entirely, defeating the border's own stated purpose as the
*primary* separation technique. `border.emphasis` (~1.8:1) is still a
deliberately subtle hairline, not a bold outline, but is the value
actually used for Card's own edge; `border.default` remains reserved
for lower-emphasis dividers (e.g. the sidebar's edge, table row
rules) where adjacent shadow or spacing already carries the separation.

| Token | Value |
|---|---|
| `elevation.1` shadow value | `none` |
| `elevation.2` shadow value | `0 8px 24px rgba(28, 26, 22, 0.12)` (light) / `0 8px 24px rgba(0, 0, 0, 0.32)` (dark) |

This is a real, visible change from the prior implementation (Card
previously used a soft drop-shadow with no border) — chosen because a
crisp hairline border reads as more structured and "research-desk"
than a soft shadow, and because it removes an entire shadow-tuning
surface from both light and dark mode maintenance.

------------------------------------------------------------------------

# 11. Spacing & Density

Scale unchanged structurally (D2-004's 8pt-derived steps). Two
explicit presets per M6-002 §7:

- **Calm preset** (default; Dashboard, Morning Brief, synthesis
  surfaces): unchanged spacing tokens, generous gaps between blocks.
- **Dense preset** (opt-in; Watchlist, Journal, COT, other list/table
  surfaces): reserved for a future milestone that actually implements
  those screens' visual identity — not exercised by this milestone,
  since it implements Dashboard only (Phase 5 scope).

**Container width increase:** `container.wide` moves from `75rem`
(1200px) to `85rem` (1360px). Finding from the prior Dashboard visual
review: at common wide-desktop widths (1440px+) the previous max-width
left a stark, asymmetric dead gutter on the right that read as unfinished
rather than intentionally calm whitespace. Widening the container
narrows that gutter while staying well short of full-bleed, which
would hurt reading-line-length on the narrative Primary region
(D2-003's 50–75ch rule, unchanged).

| Token | Value |
|---|---|
| `container.narrow` | `40rem` (unchanged) |
| `container.default` | `60rem` (unchanged) |
| `container.wide` | `85rem` (was `75rem`) |

------------------------------------------------------------------------

# 12. Motion

Duration/easing system structurally unchanged (M6-002 §16) with one
value fix:

**Fix applied during this phase:** `Skeleton`'s pulse animation used
`duration.slow` (`320ms`) as its full pulse-cycle length — 320ms is a
*fast* flicker, not the "slow, low-contrast pulse" D2-005 §17 calls
for, and is the likely cause of the loading state reading as visually
blank in the prior review (a near-imperceptible flicker between two
low-opacity values). `duration.slow` is retuned to `1600ms` — verified
to affect only `Skeleton` (its sole consumer); no other component
references it.

| Token | Value |
|---|---|
| `duration.fast` | `120ms` (unchanged) |
| `duration.default` | `200ms` (unchanged) |
| `duration.slow` | `1600ms` (was `320ms`) |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` (unchanged) |

------------------------------------------------------------------------

# 13. Skeleton (Loading)

**Fix applied during this phase:** Skeleton previously animated pure
opacity of `surface.raised` (identical hue to the surface it sits on)
between `opacity.hover` (6%) and `opacity.pressed` (12%) — both values
are calibrated for *interactive-state tinting on top of an
already-colored element*, not for a placeholder block's own baseline
visibility, so the block was nearly invisible at every point in its
cycle. Skeleton's background is now `border.default` (a visible,
neutral, already-WCAG-non-text-contrast-checked tone), with the pulse
animating its own opacity between `0.6` and `1.0` — always at least
partially visible, still calm and non-attention-grabbing, now over the
corrected 1600ms cycle (§12).

------------------------------------------------------------------------

# 14. Hover, Focus, Selection

Per M6-002 §17 (a finding from the prior review: color-only hover was
too faint):

- **Hover** (interactive surfaces — Card, NavItem): background tint
  shift (`opacity.hover` mix, unchanged mechanism) **plus** a visible
  border-color shift from `border.default` to `border.emphasis` (Card)
  or a subtle background tint (NavItem, which has no border to shift).
  The combination is what makes the affordance readable at a glance.
- **Focus:** `accent.focus`, 2px solid ring, 2px offset — unchanged
  mechanism, same token, applied consistently everywhere.
- **Selection** (native text selection): `accent.default` at 25%
  opacity background, `text.primary` foreground — not yet exercised by
  Dashboard (no selectable data ranges today); specified for future
  screens.

------------------------------------------------------------------------

# 15. Buttons, Inputs, Tables, Scrollbar (specification only)

Dashboard does not render Button, Input, or Table components (M4-003
series content is Panel/Card/DecisionCard/StatusIndicator/EmptyState/
ErrorState only) — these are specified here for completeness and for
the future screens `packages/ui` does not yet implement in code, per
M5-002's existing architecture:

- **Button** (primary): `surface` = `accent.default`; text = white/
  `surface.raised` (whichever clears AA against the accent in each
  mode); `radius.md`; no shadow; hover = `accent.emphasis` background;
  focus = `accent.focus` ring.
- **Button** (secondary/outline): `surface` = transparent; border =
  `border.emphasis`; text = `text.primary`; hover = `surface.raised`
  background tint.
- **Input:** `surface.raised` background, `border.default` at rest,
  `border.emphasis` on hover, `accent.focus` ring on focus, `radius.sm`.
- **Table:** header row = `text.secondary` weight 600 on `surface.base`;
  body rows = `surface.raised` alternating with `surface.base` at the
  Dense preset only (§11); numeric columns right-aligned, tabular
  figures (unchanged).
- **Scrollbar:** thin, `border.emphasis` thumb on transparent track
  (WebKit `::-webkit-scrollbar` + standard `scrollbar-color`), no
  bespoke arrows or bright accent coloring — a scrollbar is chrome,
  not brand surface.

------------------------------------------------------------------------

# Related Documents

- M6-003_VISUAL_DIRECTIONS.md — selected direction these values implement.
- M6-001_VISUAL_IDENTITY_CONSTITUTION.md, M6-002_VISUAL_LANGUAGE.md — governing philosophy/rules.
- M5-001_DESIGN_TOKENS_ARCHITECTURE.md — token architecture and naming these values are delivered through, unchanged.
- Superseded (values only, structure retained): D2-002, D2-003, D2-004 §spacing scale/container widths, D2-005 §elevation.
