# M4-009_CALENDAR_NEWS_SCREEN_DESIGN

**Document ID:** ZOS-M4-009
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Calendar/News's complete screen design, built on the official Dashboard
reference (`M4-003` series). Governs `DASH-010`'s full destination
screen (`26` §3, `M4-002` §4.6, `25_PRODUCT_BLUEPRINT.md` §2 Calendar /
News).

**Ambiguity resolved — Calendar and News are one screen, not two.**
This task's own screen list names "Calendar" and "News" separately.
Constitution §10.2 approves exactly one combined area, "Calendar /
News"; `M4-002` §4.6 already specifies it as one screen; and the live
implementation (`apps/web/src/app/calendar-news`) is itself one
combined route, not two. Splitting it into two independent screens now
would both contradict already-approved architecture and invent a
product-area boundary no prior document draws. This document instead
delivers both requested design perspectives — Calendar and News — as
two Secondary Navigation sub-views within the one approved screen
(`M4-002` §3.2: "secondary navigation never introduces a new Decision
Flow question of its own — it narrows... the *same* question its
parent area already answers").

**Unique responsibility (never duplicates Dashboard):** `DASH-010` is
an inactive placeholder in V1 (P2, Blueprint §8). This document
specifies the full screen ready for that future build.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** contextualize scheduled events and news evidence relevant
to tracked/held instruments (Constitution §10.2). **Boundaries:** never
a bare headline presented as a conclusion (Constitution §10.2) — every
entry is disclosed, attributed evidence, never an interpretation.
**Information hierarchy:** Primary = the combined tracked-instrument-
relevant event/news set, aggregated; Secondary = Calendar sub-view rows
(scheduled events) and News sub-view rows (attributed articles), each
individually disclosed; Peripheral = filter by instrument/date, sub-view
toggle. **Reading order:** List/Tracking Archetype (D1-005 §2.2) —
Medium density, a bounded, attributable set. **Decision flow:** supports
Analysis (Q2/Q3), consulted deliberately (ZXL §1.3, Supporting
Attention) — not a hub of its own (`M4-002` §5.7). **Entry points:**
Primary Navigation, Morning Brief drill-in. **Exit points:** the
specific instrument an event/headline concerns.

**Why every section exists:** the two sub-views exist because Calendar
(scheduled, dated events) and News (attributed articles) are
structurally distinct evidence types even though they answer the same
underlying question ("what disclosed context is relevant right now") —
Secondary Navigation is the correct mechanism for this distinction
(`M4-002` §3.2), not two separate approved areas. Attribution is
mandatory on every entry because Constitution §10.2 explicitly
distinguishes this screen's own raw evidence from any Analysis
Provider's interpretation of it.

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Relevant-to-you Aggregate (N events/articles      │    │
│  │ concerning tracked/held instruments)                         │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Sub-view: Calendar │  │ Sub-view: News     │  (secondary nav)  │
│  └──────────────────┘  └──────────────────┘                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Row: dated event / attributed article — instrument,         │    │
│  │ source, timestamp always visible                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Row ...                                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐                                          │
│  │ Peripheral: filter   │                                         │
│  └────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Trading Psychology / FOMO):** could an unfiltered news feed
create urgency-adjacent pressure to react to every headline (ZXL §7.1)?
**Finding — genuine weakness identified in draft.** A reverse-
chronological, unbounded feed (the conventional pattern for both
calendar and news widgets) would read as "always more to check,"
directly risking the compulsive-checking failure mode Constitution
§7.5 forecloses. **Fix applied:** the Primary region is scoped to
tracked/held-instrument relevance only (never a general market-wide
feed) — mirroring `M4-004`'s own entry-capping fix for Morning Brief —
and importance is communicated by `text.*` weight, never `signal.*`
color (D2-006 §9, already-binding: "never color-coded by 'importance'
using signal.*").

**Reviewed (Information Density):** does combining Calendar and News
into one Primary aggregate risk conflating two distinct evidence types
into one harder-to-parse figure? **Finding:** no weakness — the
aggregate states a count only ("N items relevant to your tracked
instruments"), not a blended interpretation; the sub-view split (§1)
keeps the two evidence types structurally distinct once a trader
proceeds past the aggregate.

**Reviewed (Long-Session Usability):** does re-checking this screen
across a session risk the same "always something new" anxiety as §3's
first finding, even after that fix? **Finding:** no further weakness —
scoping to tracked/held relevance (already applied) means the set only
grows when something genuinely relevant occurs, not on a fixed
publishing cadence unrelated to the trader's own tracked set.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Relevant-to-you aggregate (Primary) | Yes — answers relevance without a manual scan | Constitution §8.3 | *Cognitive:* low. *Behavioral:* discourages compulsive feed-checking (§3 fix). *Emotional:* informed, contextualized (ZXL §9, Calendar/News). |
| Calendar sub-view rows | Yes — scheduled, dated, attributable | Constitution §10.2 | *Cognitive:* Medium, bounded. *Behavioral:* supports planning, not reaction. *Emotional:* neutral. |
| News sub-view rows | Yes — attributed evidence, not conclusions | Constitution §10.2, §4.1 | *Cognitive:* Medium, bounded. *Behavioral:* discourages headline-driven impulsive action (never presented as a conclusion). *Emotional:* grounded, discerning. |
| Filter (Peripheral) | Yes | Constitution §6.4 | *Cognitive:* minimal. *Behavioral:* low-stakes. *Emotional:* none. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Relevant-to-you aggregate + both sub-views | **Observe** | Additional disclosed evidence sources Zenith collects on the trader's behalf (`M4-002.2` Learning Loop §3, Observe) — exactly the category this stage already names for this area. |
| Filter | **Observe** (refinement) | Narrows the same stage; not a new one. |

Every section maps to Observe.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Aggregate statement: `text.heading`. Sub-view labels: `text.title`. Row headline/event name: `text.body`. Attribution/source/timestamp: `text.caption`/`text.micro`. |
| Spacing | Primary-to-sub-views gap: `space.32` (distinct-section separation, not `space.64`, since this screen's own Primary is a count, not a full synthesis statement — D2-004 §1). Between rows: `space.16`–`24`. |
| Elevation/Radius | Primary aggregate: Panel, `elevation.0`, no radius. Sub-view toggle: Tertiary-tier control (D1-003 §3.1, text-only). Rows: Table (D2-005 §4), matching Watchlist's own precedent for a scannable bounded set (`M4-007` §6) rather than individual Cards. |
| Color tokens | No `signal.*` for "importance" (D2-006 §9, binding) — relative significance uses `text.body` vs. `text.caption` weight only. `signal.warn`/`critical` reserved exclusively for a genuine data-availability condition (a feed sync failure), never content importance. |
| States | Loading: skeleton rows. Empty (no relevant events/news for tracked instruments): calm, factual — "no disclosed events currently relevant to your tracked instruments" (D1-002 §14.3, indistinguishable in tone from a populated state). Error: sync/provider failure per D1-002 §14.4–14.6. |
| Interaction | Sub-view toggle: low-stakes, frictionless. Row select: navigation to the concerned instrument. Filter: low-stakes. |
| Motion | No flash on a new item arriving, regardless of the timeliness of the underlying event (D1-002 §5.3, §6.1 — no manufactured urgency). |
| Accessibility | Table semantic headers (D2-007 §6.4); sub-view toggle keyboard-operable with clear state announcement (D2-007 §2.1). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Relevant-to-you aggregate | `surface.base` | `text.heading` | `space.32` isolation | Panel (D2-005 §3) | Coherent-sentence summary | Read-only |
| Sub-view toggle | `accent.default` (active), `text.secondary` (inactive) | `text.title` | `space.16` | Tertiary-tier control (D1-003 §3.1) | State announced | Low-stakes toggle |
| Calendar / News rows | `surface.raised`, `text.body`, `text.caption`/`text.micro` | §2 | `space.16`–`24` | Table (D2-005 §4) | Semantic headers, attribution announced | Row select → navigation |
| Filter | `accent.default` | `text.micro` | `space.8`–`12` | Dropdown (D2-005 §6) | Keyboard-operable | Low-stakes |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — every entry attributed, never presented as
  interpretation (Constitution §10.2).
- **Reduce stress?** Yes — the relevance-scoping fix (§3) prevents an
  unbounded, anxiety-inducing feed.
- **Improve decision quality?** Yes — disclosed context supports
  Analysis without pressuring reaction to any single headline.
- **Comfortable after 6–10 hours?** Yes — Table container avoids
  excess per-row visual weight across a potentially long list.
- **Strengthens Zenith philosophy?** Yes — Evidence Over Signals
  (Constitution §4.1) applied to external context specifically.
- **Strengthens the Learning Loop?** Yes — Observe, fully.

**Weakness identified in this pass:** the unscoped-feed risk (§3) was
genuine and is now fixed via relevance-scoping rather than an arbitrary
cap or a suppressive design choice.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §4.1, §6.4, §7.5, §10.2
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §1.3, §7.1
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.2
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-004` §1, `D2-005` §4, `D2-006` §9, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (Calendar / News)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-010`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §3.2, §4.6, §5.7
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-007_WATCHLIST_SCREEN_DESIGN.md` (Table-container precedent)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
