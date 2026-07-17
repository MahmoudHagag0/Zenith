# D2-006_DATA_VISUALIZATION_SYSTEM

**Document ID:** ZOS-D2-006
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

The visual language for every data-bearing surface in Zenith: charts,
heatmaps, performance tables, statistics/KPIs, trade history, risk
metrics, calendar/economic-event data, and portfolio metrics.
**Governing rule, stated once, binding throughout: readability is never
sacrificed for visual beauty.** A chart that looks more sophisticated
but takes longer to correctly read has failed this document's purpose,
per Constitution §12.2 (cognitive load is a direct tax on Zenith's core
value) and D1-001 §1 (extraneous load has a real cost).

No chart library, chart component code, or specific chart mockup is
defined here — only the visual/behavioral rules any implementation
must satisfy.

------------------------------------------------------------------------

# 1. Chart Color Philosophy

1.1. Every chart reuses D2-002's existing tokens exclusively — a chart
never introduces its own palette. Categorical series use D2-002 §10;
directional/gain-loss data uses D2-002 §11 (`data.positive`/
`data.negative`, desaturated, never vivid green/red).

1.2. **Candlestick and OHLC charts are not exempt from §11.** This is
the system's most visible departure from every conventional trading
platform: a Zenith candlestick chart uses the same muted
`data.positive`/`data.negative` fills as any other directional figure
— never the saturated red/green universal to Bloomberg, TradingView,
and MetaTrader. Direction remains fully legible (fill color still
differs meaningfully between up/down candles); it simply does not
shout.

1.3. Sequential data (a single metric varying by magnitude — e.g. a
volume histogram) uses a single-hue lightness ramp (Ink or Teal, D2-002
§1–§2) — never a rainbow/jet colormap, which is well-documented to
distort perceived magnitude and is inaccessible to colorblind viewers
**[Industry Best Practice — perceptual-colormap research, e.g. the
rationale behind matplotlib's "viridis" replacing "jet"]**.

1.4. Diverging data with a genuinely neutral midpoint (e.g. a
correlation matrix, not a gain/loss metric) uses a two-hue diverging
scale (Ink ↔ Teal, D2-002 §10) — reserving the red/green-adjacent hue
family exclusively for `signal.*`/`data.*`'s own defined meanings
(D1-002 §2.1, closed vocabulary).

------------------------------------------------------------------------

# 2. General Chart Rules

2.1. **Gridlines are structural, not decorative** — low-contrast
(`border.default`, D2-002 §7), present only where they genuinely aid
reading a value, never a dense default grid "for polish."

2.2. **Axis labels use `text.micro`/`text.numeric`** (D2-003), tabular
figures on any numeric axis.

2.3. **No 3D charts, no unnecessary shadows/gradients on data marks** —
these distort perceived value and add zero reading value, violating
Constitution §5.1 (Clarity Over Decoration).

2.4. **A chart's own Primary Attention element** (the single line, bar,
or figure most relevant to the trader's current question, per D1-002
§1) **is visually distinguishable without relying on color alone** —
line weight, marker size, or direct labeling supplement color, so the
chart remains readable for colorblind traders (D1-001 §4) and in
reduced-fidelity contexts.

2.5. **Motion in charts** (an updating line, a value ticking) follows
D2-001 §7–§8 exactly — `motion.easing.standard`, no flash/pulse on
update regardless of the magnitude of change (D1-002 §5.3).

2.6. **Legends are always present when more than one series is shown**
— a chart is never left for the trader to guess which color means
what; this is Constitution §8.4's consistency-reduces-relearning
principle applied to a single chart's own internal vocabulary.

2.7. **A chart's size and visual weight follow its own Attention level
(D1-002 §1), never its own visual complexity** (added during the
professional-trader long-session review, closing a real gap: this
document specified chart *color* extensively but never chart *size/
dominance* explicitly). A chart occupying Secondary or Supporting
Attention is sized and weighted accordingly — a visually rich chart
does not earn a larger footprint than its assigned Attention level
just because it is more complex to render than the text/numeric
element that holds Primary Attention on the same screen. This is the
concrete answer to "charts never dominate the interface."

2.8. **Chart + table pairing.** When a chart and a table represent
related data on the same screen (a common trading-UI pattern), exactly
one of the two carries Primary Attention (D1-002 §1.1) and the other is
Secondary/Supporting — never both competing for the first glance
simultaneously. Which one is Primary depends on the screen's own
Decision Flow question (D1-005 §1, ZXL §2): a screen answering "what is
the current state, precisely" leads with the table; a screen answering
"what is the trend/shape over time" leads with the chart. The
non-Primary element is not deleted, only demoted — this is how charts
and tables "complement" rather than compete.

------------------------------------------------------------------------

# 3. Charts (Price/Time Series)

Line charts are the default for a single-series time series (calmer,
lower visual noise than a filled area or candlestick when direction-
over-time, not per-bar OHLC detail, is the question being answered —
per D1-002 §8.3, Information Priority). Candlestick/OHLC is used only
when per-bar open/high/low/close detail is the actual question (§1.2
above governs its color treatment). No unnecessary secondary Y-axis
unless two genuinely different units are being compared.

------------------------------------------------------------------------

# 4. Heatmaps

Single-hue sequential scale only (§1.3) for magnitude-only heatmaps
(e.g. activity-by-hour). A heatmap encoding both magnitude and
direction (e.g. sector performance) uses the diverging treatment only
if the underlying metric is genuinely gain/loss-like — in which case
it uses `data.positive`/`data.negative` at graduated opacity, not a
separate saturated scale, keeping the same calm-direction rule as §1.2.

------------------------------------------------------------------------

# 5. Performance Tables

Reuses D2-005 §4 (Tables) exactly: tabular figures, right-aligned
numeric columns, `text.micro` headers. Sortable columns indicate sort
state via a small icon (D1-002 §10, functional only) plus, where the
column is a Primary sort, `border.emphasis` on the header — never
color-fill alone.

------------------------------------------------------------------------

# 6. Statistics / KPI Tiles

6.1. A KPI tile's own Primary element is the value itself, styled
`text.display` or `text.heading` (D2-003) — the label is Secondary
(`text.caption`).

6.2. A trend indicator (up/down since a prior period) uses
`data.positive`/`data.negative` at the same desaturation as everywhere
else — a KPI tile is not an exception permitting a "more exciting"
treatment.

6.3. No sparkline or trend chart on a KPI tile competes with the
primary value for visual weight (D1-002 §1.3) — if included, it is
rendered small and low-contrast, confirming the number, not competing
with it.

------------------------------------------------------------------------

# 7. Trade History

A Record/Detail Archetype table (D1-005 §2.3, D2-005 §4) — every row
uses identical structural treatment regardless of whether the trade
was profitable, per Constitution §7.3/§12.4 (no dramatization of
losses relative to gains). Direction/P&L columns use `data.positive`/
`data.negative` exactly as defined (D2-002 §11) — never a distinct,
louder treatment "because this is the trade history screen."

------------------------------------------------------------------------

# 8. Risk Metrics

Risk figures (drawdown, exposure, volatility) are factual disclosures,
not warnings, unless they cross a disclosed, evidence-backed threshold
— in which case they use `signal.warn`/`signal.critical` (via a Status
Chip, D2-005 §14) exactly as any other operational condition would,
never a bespoke "risk red." A risk metric approaching but not crossing
its own disclosed threshold is never pre-emptively styled as alarming
(D1-002 §6, Anti-Urgency) — the threshold crossing itself is the
signal, not proximity to it.

------------------------------------------------------------------------

# 9. Calendar Data / Economic Events

Rendered as a List/Tracking Archetype (D1-005 §2.2) — each event is a
disclosed, attributable fact (Constitution §10.2, Calendar/News),
never color-coded by "importance" using `signal.*` (importance is not
an operational-severity condition; a differently-weighted `text.*`
treatment, e.g. `text.body` vs. `text.caption`, communicates relative
significance instead, per D1-002 §1.3).

------------------------------------------------------------------------

# 10. Portfolio Metrics

Composed from KPI Tiles (§6) and Performance Tables (§5) — no new
visual pattern is introduced for this domain specifically. Aggregate
portfolio-level figures (total value, total P&L) receive the same
calm, non-dramatized treatment as any single position's figures
(Constitution §7.3) — portfolio-level aggregation does not itself earn
a more prominent or more colorful treatment than the data it aggregates.

------------------------------------------------------------------------

# 11. Reducing Visual Noise (Summary Rule)

Before any chart/table ships, it should be checked against this single
question: **does every visual element on this surface change what the
trader understands, or is it present "for polish"?** Anything in the
second category is removed, per Constitution §5.1 (Clarity Over
Decoration) and D1-002 §4 (Whitespace & Density) — this document's
entire purpose is making that check answerable, not merely aspirational.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §5.1, §7.3, §8.3–§8.4
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §1, §4, §7
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §1–§6, §14
- `documentation/zos/D2-001_DESIGN_TOKENS.md`
- `documentation/zos/D2-002_COLOR_SYSTEM.md` §10–§11 (implemented here for chart contexts)
- `documentation/zos/D2-003_TYPOGRAPHY_SYSTEM.md` §5–§6
- `documentation/zos/D2-005_COMPONENT_FOUNDATIONS.md` §4, §12–§14
