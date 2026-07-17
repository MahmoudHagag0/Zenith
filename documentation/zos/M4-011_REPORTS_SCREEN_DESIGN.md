# M4-011_REPORTS_SCREEN_DESIGN

**Document ID:** ZOS-M4-011
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Reports's complete screen design, built on the official Dashboard
reference (`M4-003` series) and on `M4-010`'s own COT design (its
sibling screen within the same approved "COT & Reports" area,
`M4-002` §4.8, `25_PRODUCT_BLUEPRINT.md` §2).

**Unique responsibility (never duplicates Dashboard or COT):**
distinct from COT specifically — Reports surfaces "other structured
report data" (Constitution §10.2's own phrasing), not institutional
futures positioning. Both share the same evidentiary discipline (raw
data, never interpretation) but concern different underlying evidence
types, exactly as Calendar and News (`M4-009`) share a discipline while
differing in evidence type.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** structured, periodic report data distinct from COT
(Constitution §10.2). **Boundaries:** identical evidentiary discipline
to COT (§4.7's own rule, `M4-010` §1) — never presented as a
conclusion, no onward link to an "AI interpretation of this" (`M4-002`
§6). **Information hierarchy:** Primary = available-reports list for
tracked/held instruments; Secondary = a selected report's own detail
view (raw, tabular); Peripheral = filter by period. **Reading order:**
List/Tracking Archetype (D1-005 §2.2). **Decision flow:** supports
Analysis, consulted deliberately, cadence tied to each report's own
periodic publication (not daily). **Entry points:** Primary Navigation.
**Exit points:** the specific instrument/period a report concerns.

**Why every section exists:** the available-reports list is Primary
because a trader's first question is "what reports exist for what I
track," not any single report's own full detail — that detail is
Secondary, reached deliberately, mirroring COT's own historical-table
Progressive Disclosure pattern (`M4-010` §3).

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Available Reports (for tracked/held instruments)  │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Secondary — Selected Report Detail (raw, tabular; reached    │    │
│  │ via drill-in, never shown expanded by default)               │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐                                          │
│  │ Peripheral: filter   │                                         │
│  │ by period             │                                         │
│  └────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Information Density):** same risk already identified and
fixed for COT (`M4-010` §3) — an unbounded, expanded-by-default report
detail list. **Finding — same weakness, same fix applied here for
consistency (Design Constitution rule 8):** report detail is behind a
deliberate drill-in; only the available-reports list renders by
default.

**Reviewed (Consistency Rules / Design Constitution rule 8):** should
Reports invent its own visual pattern distinct from COT, given the two
screens serve genuinely different report content? **Finding:** no
weakness — Design Constitution rule 8 requires the identical
structural treatment for the identical underlying concept (a raw,
periodic report), and Reports and COT are the same concept applied to
different evidence. Inventing a distinct pattern here would itself be
the Design Constitution violation, not a genuine content-driven need.

**Reviewed (Long-Session Usability):** does report cadence variability
(some reports weekly, some monthly/quarterly) create confusion about
"what's new"? **Finding — genuine weakness identified in draft.** A
flat list with no publication-recency indicator would force a trader
to manually check each report's own date. **Fix applied:** each
available-report row discloses its own last-published timestamp
plainly (`text.micro`, D1-002 §14.6 precedent — "stale or degraded
data is disclosed as a fact with a timestamp") — not a "new" badge
(which would reintroduce the unread-indicator pattern already
foreclosed, D1-002 §6.2), simply the factual date.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Available-reports list (Primary) | Yes — orients to what exists, without a manual search | Constitution §10.2 | *Cognitive:* low, bounded. *Behavioral:* discourages compulsive re-checking (timestamp fix, §3). *Emotional:* grounded, discerning. |
| Report detail (Secondary, drill-in) | Yes, on demand | D1-002 §4.4 | *Cognitive:* High only when deliberately entered. *Behavioral:* supports genuine research. *Emotional:* neutral. |
| Filter (Peripheral) | Yes | Constitution §6.4 | *Cognitive:* minimal. *Behavioral:* low-stakes. *Emotional:* none. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Available-reports list + detail | **Observe** | Structured report data is a disclosed evidence source Zenith collects, per `M4-002.2` Learning Loop §3's own "every other disclosed evidence source already approved across the Live Data Platform." |
| Filter | **Observe** (refinement) | Narrows the same stage. |

Every section maps to Observe.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | List headline: `text.heading`. Report title/instrument: `text.title`. Last-published timestamp: `text.micro` (§3 fix). Report detail figures: `text.numeric`, tabular. |
| Spacing | Primary-to-secondary gap: `space.32`. Rows per D2-004 §8 (Medium density). |
| Elevation/Radius | List: Panel, `elevation.0`, no radius. Report detail: Table (D2-005 §4), reached via drill-in only, matching COT's own pattern (`M4-010` §6) exactly, per Design Constitution rule 8. |
| Color tokens | No `data.positive`/`data.negative` unless a report's own content is genuinely a gain/loss figure (rare for structured non-COT reports; where it occurs, identical rule to Portfolio applies — D1-003 §5). `signal.warn`/`critical` for availability conditions only. |
| States | Loading: skeleton. Empty (no reports for tracked instruments): factual (D1-002 §14.1). Error: per D1-002 §14.4–14.6, with last-known-report timestamp. |
| Interaction | Drill-in to report detail: deliberate, low-stakes. Filter: low-stakes. No onward interpretation link (`M4-002` §6). |
| Motion | No flash on a newly-published report (D1-002 §6.1) — the timestamp (§3) communicates recency factually instead. |
| Accessibility | Table semantic headers; timestamp announced alongside report title, not as a separate disconnected element (D2-007 §6.4). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Available-reports list | `surface.base`, `text.micro` timestamps | `text.heading`, `text.title` | `space.32` isolation | Panel (D2-005 §3) | Coherent summary, timestamp paired with title | Read-only |
| Report detail (drill-in) | `surface.raised` | `text.numeric` | `space.16` gutter | Table (D2-005 §4) | Semantic headers | Deliberate drill-in only |
| Filter | `accent.default` | `text.micro` | `space.8`–`12` | Dropdown (D2-005 §6) | Keyboard-operable | Low-stakes |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — identical evidentiary discipline to COT (§3), never
  presented as interpretation.
- **Reduce stress?** Yes — factual timestamps (§3 fix) replace what
  would otherwise be an unread-style anxiety trigger.
- **Improve decision quality?** Yes — bounded, attributed, on-demand
  detail.
- **Comfortable after 6–10 hours?** Yes — same Table/Panel pattern as
  COT and Watchlist.
- **Strengthens Zenith philosophy?** Yes — Evidence Over Signals,
  consistently applied across every raw-data screen in the product.
- **Strengthens the Learning Loop?** Yes — Observe, fully.

**Weakness identified in this pass:** the recency-confusion risk (§3)
was genuine and is now resolved via factual timestamp disclosure,
consistent with (not a new invention beyond) D1-002 §14.6's own already-
binding rule.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §6.4, §10.2
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §6.2, §8, §14.6
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.2
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-004` §8, `D2-005` §4, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (COT & Reports)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-011`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.8, §6
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-010_COT_SCREEN_DESIGN.md` (sibling screen, shared pattern)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
