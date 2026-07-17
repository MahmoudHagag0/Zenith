# D2-002_COLOR_SYSTEM

**Document ID:** ZOS-D2-002
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

The concrete color palette implementing D1-003's color behavior rules.
D1-003 established the *system* (token architecture, closed signal
vocabulary, the no-red/green-dramatization decision) without final
values, deferring them to "the Sprint that builds the actual token
file" (D1-003 §7). This is that Sprint's color deliverable. Every rule
in D1-003 is inherited unchanged; this document only supplies values.

**Explicit design mandate:** Zenith is not a trading-terminal
aesthetic. It does not borrow Bloomberg Terminal's black-and-amber
command-line look, TradingView's near-black-plus-neon-candlestick
theme, or MetaTrader's dated, saturated blue/gray/red/green scheme.
Those palettes optimize for information *density* and market-data
*excitement* — precisely the opposite of Constitution §5.2 (Calm
Interface) and D1-003's own governing decision. Zenith's palette reads
closer to a calm, professional analytics or research tool: generous
neutral space, one restrained accent, desaturated signal colors,
never a wall of saturated color.

All values below are reference starting points, not final production
values — every pairing must still be independently verified against
WCAG 2.1 AA once implemented (D1-003 §2, §6.3), per this document's own
Related Documents scope boundary.

------------------------------------------------------------------------

# 1. Primary Palette ("Ink")

A desaturated, deep slate-blue — chosen for calm/trust association
without borrowing "tech-startup blue's" high-saturation energy.
Maps to `accent.*` (D1-003 §3).

| Step | Value (reference) | Use |
|---|---|---|
| Ink 50 | `#EEF1F6` | Subtlest tint (selected-row background) |
| Ink 100 | `#D7DEEA` | Light hover backgrounds |
| Ink 400 | `#5B6B8C` | Secondary interactive text |
| Ink 600 | `#33435F` | `accent.default` |
| Ink 700 | `#26324A` | `accent.emphasis` (active/pressed) |

------------------------------------------------------------------------

# 2. Secondary Palette ("Slate Teal")

Used sparingly for a small class of secondary emphasis distinct from
the primary accent (e.g., a non-primary but still-interactive element
class) — never as a second "meaning" for the same signal (D1-002 §2.1
remains binding: color meaning stays closed and singular).

| Step | Value (reference) | Use |
|---|---|---|
| Teal 100 | `#DCEEEA` | Subtle background tint |
| Teal 500 | `#3E7C72` | Secondary interactive accent (distinct role from primary, e.g. a secondary tab indicator) |
| Teal 700 | `#2A5750` | Secondary accent, active state |

------------------------------------------------------------------------

# 3. Neutral Palette

A warm-neutral (not cold, not pure black/white terminal-style) ramp —
the base of the system, per D1-003 §2. Deliberately warm-toned to
avoid the "clinical dark-mode terminal" read of most trading software.

| Step | Value (reference) | Maps to |
|---|---|---|
| Neutral 0 | `#FFFFFF` | `surface.base` (light mode) |
| Neutral 50 | `#F7F6F4` | `surface.raised` (light mode) |
| Neutral 100 | `#EDEBE7` | `border.default` (light mode) |
| Neutral 400 | `#8B877E` | `text.muted` |
| Neutral 600 | `#5B584F` | `text.secondary` |
| Neutral 900 | `#211F1B` | `text.primary` (light mode) |
| Neutral 950 | `#171613` | `surface.base` (dark mode) |
| Neutral 850 | `#242320` | `surface.raised` (dark mode) |
| Neutral 800 | `#332F2A` | `border.default` (dark mode) |
| Neutral 50 (dark use) | `#F7F6F4` | `text.primary` (dark mode) |

------------------------------------------------------------------------

# 4. Semantic Colors

Implements D1-003 §4's closed three-severity vocabulary
(`signal.critical` / `signal.warn` / `signal.info`), plus a `muted`
role for non-signal secondary meaning. Every hue below is desaturated
relative to its "conventional" web-alert equivalent — deliberately, to
keep the system calm even at its most severe (D1-001 §7; Constitution
§5.2).

| Token | Reference value | Meaning |
|---|---|---|
| `signal.critical` | `#8C4A3D` (muted clay-brick red) | Blocking, requires-attention-now condition (D1-003 §4) |
| `signal.warn` | `#8C6E3D` (muted ochre/amber) | Degraded-but-usable condition |
| `signal.info` | Same as `accent.default` (Ink 600) | Neutral factual disclosure — reuses the accent, not a fourth hue |
| `success` (referenced only where a factual, non-financial confirmation is needed — e.g. "saved") | `#3E7C55` (muted sage green) | Confirmation of a completed action, never used for gain/loss (§9 below) |
| Muted | Neutral 400/600 (§3) | De-emphasized text/icon, not a color signal at all |

**Note:** `success` above is deliberately *not* the same token as
`data.positive` (§9) — a saved-settings confirmation and a portfolio
gain are different concepts and must never share a token, per D1-002
§2.1's closed-vocabulary rule.

------------------------------------------------------------------------

# 5. Background Levels

| Token | Light mode | Dark mode |
|---|---|---|
| `surface.base` | Neutral 0 | Neutral 950 |
| `surface.raised` | Neutral 50 | Neutral 850 |
| `surface.overlay` (modal backdrop surface itself, not the scrim) | Neutral 0 | Neutral 850 |

------------------------------------------------------------------------

# 6. Surface Levels

Same as §5 — "surface" and "background" are the same token family in
this system (`surface.*`); no separate vocabulary is introduced for
the same concept, per D1-002 §8 (Consistency).

------------------------------------------------------------------------

# 7. Border Levels

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| `border.default` | Neutral 100 | Neutral 800 | Default hairline dividers |
| `border.emphasis` | Ink 600 (`accent.default`) | Ink 400 | Focus/selected only (D2-001 §6) |

------------------------------------------------------------------------

# 8. Text Levels

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| `text.primary` | Neutral 900 | Neutral 50 | Primary reading text |
| `text.secondary` | Neutral 600 | Neutral 400 | Supporting/secondary text |
| `text.muted` | Neutral 400 | Neutral 600 | Lowest-emphasis, non-signal text (timestamps, metadata) |

All three re-verified against WCAG 2.1 AA on both `surface.base` and
`surface.raised`, in both modes, before implementation (D1-003 §6.3).

------------------------------------------------------------------------

# 9. Disabled / Hover / Focus / Selection States

Reuses D2-001 §9 opacity tokens rather than introducing new colors —
consistent with keeping the color vocabulary closed (D1-002 §2.1):

| State | Treatment |
|---|---|
| Disabled | Base color at `opacity.disabled` (0.4) — never a distinct "disabled gray" hue |
| Hover | Base surface + `opacity.hover` (0.06) neutral overlay |
| Pressed/Active | Base surface + `opacity.pressed` (0.12) neutral overlay |
| Focus | `border.emphasis` outline (`accent.focus`), 2px (`border.width.emphasis`) — never color-fill alone, so it remains visible for `border.default`-only components |
| Selected | `surface.raised` + a 2px `border.emphasis` left/top rule — same treatment used everywhere "selected" appears (D1-002 §8.1) |

------------------------------------------------------------------------

# 10. Charts Palette

Categorical series colors, chosen for simultaneous colorblind-safety
and calm desaturation — not the saturated rainbow palette common in
BI/trading dashboards:

| Series | Reference value |
|---|---|
| Series 1 | Ink 600 (`#33435F`) |
| Series 2 | Teal 500 (`#3E7C72`) |
| Series 3 | `#8C6E3D` (muted ochre, shared family with `signal.warn` but used only as a categorical series color, not a severity signal, in this context) |
| Series 4 | `#6B5B7C` (muted plum) |
| Series 5 | Neutral 600 (for a "baseline/other" series) |

Sequential scales (e.g. a heatmap, D2-006) use a single-hue ramp from
Neutral or Ink at varying lightness — never a red-to-green diverging
scale for anything gain/loss-related (§11 below); a genuinely neutral
diverging metric (e.g. a correlation matrix) may use a two-hue
diverging scale (Ink ↔ Teal), never Ink/Teal ↔ red.

------------------------------------------------------------------------

# 11. Trading Palette

This section exists to state explicitly what it is *not*: there is no
separate, more saturated "trading" palette layered on top of the
system above. Every trading-specific visual (price direction, P/L,
candlesticks, position status) reuses:

- `data.positive` / `data.negative` (D1-003 §5) for direction/P&L —
  desaturated, secondary-to-symbol, never the primary channel (D1-003
  §5.1–§5.4 apply identically to charts as to any other numeric
  display, including candlestick charts, D2-006 §3).
- `signal.critical` / `signal.warn` / `signal.info` (§4 above) for
  genuine operational conditions (a stale quote, an unavailable
  provider) — never for ordinary price movement.

Reference values for `data.positive`/`data.negative`, kept markedly
lower-saturation than `signal.critical` per D1-003 §5.2:

| Token | Reference value |
|---|---|
| `data.positive` | `#4F7D5E` (muted, closer to Success than to a vivid green) |
| `data.negative` | `#8C4A3D` (same hue family as `signal.critical`, at lower saturation — direction is a fact, not an alert) |
| `data.neutral` | `text.secondary` (no distinct hue — D1-003 §5.4) |

A candlestick or bar chart following this system will read as visibly
calmer/lower-contrast than Bloomberg/TradingView/MetaTrader by design
— this is the direct, intended visual consequence of the mandate
stated in this document's Purpose.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §5.2, §7.3,
  §8.4 (frozen, cited)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §7.5 (frozen, cited)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §4, §7
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §2, §9, §13
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md` (implemented here in full)
- `documentation/zos/D2-001_DESIGN_TOKENS.md`
- `documentation/zos/D2-006_DATA_VISUALIZATION_SYSTEM.md`
