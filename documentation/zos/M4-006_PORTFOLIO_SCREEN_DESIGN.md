# M4-006_PORTFOLIO_SCREEN_DESIGN

**Document ID:** ZOS-M4-006
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Portfolio's complete screen design, built on the official Dashboard
reference (`M4-003` series). Governs `DASH-006`'s full destination
screen (`26` §3, `M4-002` §4.4, `25_PRODUCT_BLUEPRINT.md` §2 Portfolio).

**Ambiguity resolved — "Analytics" is not a screen in this package.**
This task's own screen list includes "Analytics." Constitution §10.2
approves exactly nine product areas; "Analytics" is not one of them,
and D1-005 §1.1 already ruled explicitly that "Analytics" is "not
[an] approved top-level product area... deliberately not mapped." Per
this task's own Global Rule ("never introduce features not already
approved in Zenith documentation"), no tenth screen is created. Trading
Analytics (P&L, risk exposure, Portfolio Health Score, Decision
Readiness, Data Quality/Confidence — existing `analytics` module,
S1-006) is already the approved evidentiary content of Portfolio itself
(`25_PRODUCT_BLUEPRINT.md` §2, Portfolio Inputs) — this document
specifies it fully as Portfolio's own Analytics block (§1 below), not
as a separate screen.

**Unique responsibility (never duplicates Dashboard):** `DASH-006` is a
bounded, top-level snapshot only. Portfolio is the complete holdings
record plus the full Trading Analytics surface Dashboard's Snapshot only
gestures at.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** show current holdings and their evidentiary state,
neutrally (Constitution §10.2). **Boundaries:** never an execution
surface (Constitution §9.4) — no "buy/sell" affordance exists or will
exist here without a separate business-model decision (`M4-002` §6).
**Information hierarchy:** Primary = neutral holdings summary (total
positions, never a P/L-colored headline, D1-005 §2.3); Secondary =
individual position records, identical structural treatment regardless
of favorability; Analytics block (Supporting Attention, consulted
deliberately, not competing with the neutral summary for first glance) =
Portfolio Health Score, Risk Exposure, Decision Readiness, Data
Quality/Confidence; Peripheral = Trading Journal entry-creation link,
date/instrument filtering. **Reading order:** Record/Detail Archetype
(D1-005 §2.3) — Medium density at the list level, High only within a
single drilled-into position (never at first render, D1-002 §4.4).
**Decision flow:** answers Q3 for held instruments (ZXL §2). **Entry
points:** Dashboard (`DASH-006`), Watchlist (where a position exists on
a watched instrument), Primary Navigation. **Exit points:** Trading
Journal (record a decision about a position), the instrument's own
Watchlist context, AI Workspace.

**Why every section exists:** the neutral summary exists because
Constitution §7.3/§12.4 forbid a P/L-colored headline dramatizing
favorability. The Analytics block is Supporting, not Primary or
Secondary, because it is consulted deliberately (ZXL §1.3) — a Health
Score is context for the neutral summary, never a competing headline of
its own. The Journal link exists because Portfolio is a stated bridge
toward Record (`M4-003` §9, `DASH-006` mapping).

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Neutral Holdings Summary (N positions)            │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Position record 1 — identical treatment regardless of       │    │
│  │ favorability; select → drill-in                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Position record 2 ...                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Supporting — Trading Analytics (Health Score, Risk          │    │
│  │ Exposure, Decision Readiness, Data Quality/Confidence)       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐                                          │
│  │ Peripheral — filter,│                                         │
│  │ Journal entry link  │                                         │
│  └────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

Drilled-into single position (reached via deliberate action, never
first render): full transaction history, linked Journal entries — High
density, Progressive Disclosure only (D1-005 §3.1).

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Trading Psychology / Disposition Effect):** does anything
in the layout risk making a losing position visually or structurally
distinct from a winning one? **Finding — genuine weakness identified
in draft.** An initial layout sorting position records by P/L magnitude
(largest gain/loss first) would implicitly dramatize the largest mover,
regardless of sign — a subtle but real violation of Constitution §7.3.
**Fix applied:** position records sort by a neutral criterion (position
size or alphabetical instrument, trader-configurable at most, never
P/L-magnitude by default) — magnitude-based sorting is exactly the kind
of "visual amplification by magnitude" D1-003 §5.3 already forecloses
for color, extended here to layout ordering itself.

**Reviewed (Information Density / Working Memory):** does surfacing
four Analytics figures (Health Score, Risk Exposure, Decision Readiness,
Data Quality/Confidence) simultaneously exceed the active-reasoning
ceiling (ZXL §3.1)? **Finding:** no weakness — these are Supporting
Attention, consulted rather than held in mind (ZXL §1.3), the identical
disposition already validated for Dashboard's own Secondary row
(`M4-003.1` §2.3).

**Reviewed (Long-Session Usability):** does re-visiting Portfolio
repeatedly across a session impose escalating cost? **Finding:** no
weakness — identical structural treatment across Loading/Empty/Success
states (mirrors `M4-003.1` §2.5's own finding for Dashboard).

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Neutral summary (Primary) | Yes — orients without dramatization | Constitution §10.2, §7.3 | *Cognitive:* low, one aggregate fact. *Behavioral:* directly counters disposition-effect reinforcement. *Emotional:* steady, confident (ZXL §9.4). |
| Position records (Secondary) | Yes — full evidentiary state per holding | Constitution §5.2 | *Cognitive:* Medium density, bounded. *Behavioral:* identical treatment regardless of favorability discourages holding losers/selling winners prematurely (§4.2 rationale, `M4-002.2`). *Emotional:* calm regardless of outcome. |
| Analytics block (Supporting) | Yes — genuine risk/readiness context | S1-006, Blueprint §2 | *Cognitive:* moderate, opt-in by consultation. *Behavioral:* supports disciplined risk awareness, never a P/L-chasing prompt. *Emotional:* grounded. |
| Journal link (Peripheral) | Yes — bridges to Record | Constitution §9.6 | *Cognitive:* minimal. *Behavioral:* reinforces the disciplined review habit. *Emotional:* none coercive. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Neutral summary + position records | **Observe** | Current holdings state, exactly as Zenith Observes it (`M4-002.2` Learning Loop §3) — at full depth vs. Dashboard's snapshot. |
| Analytics block | **Understand** | Turns raw position data into risk/readiness context — the Understand stage applied to capital already at risk. |
| Journal link | **Record** (bridge) | The stated Exit Point into Trading Journal (Blueprint §2) — a genuine bridge, performed fully by Journal itself (`M4-008`). |

Every section maps to at least one stage.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Summary headline: `text.heading`. Position record title (instrument): `text.title`. P/L and analytics figures: `text.numeric`, tabular (D2-003 §5). Analytics labels: `text.caption`. |
| Spacing | Primary-to-records gap: `space.64`. Between position records: `space.24` (D2-004 §8, Medium density). Analytics block internal: `space.16`. Adjacent numeric columns maintain minimum `space.16` gutter (D2-003 §6.4). |
| Elevation/Radius | Primary summary: Panel, `elevation.0`, no radius. Position records: Card, `elevation.1`, `radius.md` — **identical elevation/radius regardless of favorability** (D2-005 §2 constraint, explicitly restated here since this is Portfolio's own most safety-critical rule). Analytics block: Card, `elevation.1`, `radius.md`. |
| Color tokens | P/L uses `data.positive`/`data.negative` only, secondary to the leading `+`/`−` symbol (D1-003 §5.1). Health Score/Readiness use neutral `text.primary` numerics, never a `signal.*` traffic-light unless a disclosed threshold is genuinely crossed (D2-006 §8, Risk Metrics — a risk figure "approaching but not crossing its own disclosed threshold is never pre-emptively styled as alarming"). |
| States | Loading: Skeleton, same footprint as Success. Empty (no open positions): calm disclosure, never a "you should be trading" prompt (Constitution §3.2, `26` §3 DASH-006 precedent). Error: base Portfolio/Analytics failure reported distinctly from Confluence-annotation failure (`26` §3, per-row). |
| Interaction | Selecting a position: navigation-only drill-in. Sorting (§3 fix): a low-stakes, reversible filter action (D1-002 §12.1) — but the *default* sort itself is fixed to a neutral criterion, not trader-togglable into a P/L-magnitude default. |
| Motion | No flash/pulse on P/L recalculation regardless of magnitude (D1-002 §5.3, D1-001 §7). |
| Accessibility | P/L never color-alone — symbol/label always present (D2-007 §5). Analytics figures grouped with accessible labels, not bare numbers (D2-007 §6.4). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Neutral summary | `surface.base` | `text.heading` | `space.64` isolation | Panel (D2-005 §3) | Coherent-sentence summary | Read-only |
| Position record | `surface.raised`, `data.positive/negative` | `text.title`, `text.numeric` | `space.24` between, `space.16` internal | Card (D2-005 §2) | P/L never color-alone (D2-007 §5) | Select → drill-in |
| Analytics block | `surface.raised`, `text.primary`, `signal.warn/critical` (threshold-crossing only) | `text.numeric`, `text.caption` labels | `space.16` internal | Card (D2-005 §2), Status Chip only if a genuine threshold is crossed (D2-005 §14) | Figures grouped with labels | Consult only, no mutation |
| Journal link | `accent.default` (text/border only) | `text.micro` | `space.8`–`12` | Tertiary-tier link (D1-003 §3.1) | Accessible name states destination | Navigation only |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — identical-favorability treatment (§3, §4) is the
  strongest concrete proof of Constitution §7.3 anywhere in the
  product.
- **Reduce stress?** Yes — the neutral-sort fix (§3) removes an
  otherwise-real amplification risk.
- **Improve decision quality?** Yes — Analytics block gives disclosed,
  non-alarming risk context without pressuring any action.
- **Comfortable after 6–10 hours?** Yes — same token set as Dashboard/
  Morning Brief.
- **Strengthens Zenith philosophy?** Yes — this is the screen where
  the disposition-effect countermeasure is most concretely realized.
- **Strengthens the Learning Loop?** Yes — Observe/Understand fully,
  Record via bridge.

**Weakness identified in this pass:** the P/L-magnitude sort risk (§3)
was genuine and is now fixed. No further concern surfaced on re-review.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §7.3, §9.4, §10.2, §12.4
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md` §5
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §1.1, §2.3
- `documentation/zos/D2-002_COLOR_SYSTEM.md` §11, `D2-003`, `D2-004`, `D2-005`, `D2-006` §8, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (Portfolio)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-006`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.4
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` §4.2, Learning Loop
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
