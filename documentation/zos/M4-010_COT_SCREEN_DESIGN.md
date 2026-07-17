# M4-010_COT_SCREEN_DESIGN

**Document ID:** ZOS-M4-010
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

COT (Commitments of Traders)'s complete screen design, built on the
official Dashboard reference (`M4-003` series). Governs `DASH-011`'s
COT-specific destination screen (`26` §3, `M4-002` §4.7,
`25_PRODUCT_BLUEPRINT.md` §2, "COT & Reports"). COT and Reports (`M4-011`)
are two screens within the one Constitution §10.2-approved "COT &
Reports" area, per `M4-002` §4.7–§4.8's own already-established
precedent (and the live `/cot`/`/reports` routes) — this is not a new
split, only this document's own full specification of the COT half.

**Unique responsibility (never duplicates Dashboard):** `DASH-011` is
an inactive placeholder in V1 (P2, Blueprint §8). COT is distinct from
Reports (`M4-011`) — COT specifically surfaces institutional futures
positioning; Reports surfaces other structured, periodic report data.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** surface institutional futures-positioning data as
disclosed, raw evidence (Constitution §10.2). **Boundaries:** never
presents positioning data as a conclusion or recommendation
(Constitution §4.1) — this is Evidence Over Signals in its purest form,
since COT data is inherently raw and un-interpreted by design.
**Information hierarchy:** Primary = per-instrument current-positioning
snapshot (net long/short, most recent report); Secondary = historical
COT table across prior reporting periods (Medium/High density, reached
via Progressive Disclosure); Peripheral = filter by instrument/date
range. **Reading order:** List/Tracking Archetype (D1-005 §2.2).
**Decision flow:** supports Analysis (Q2/Q3), consulted deliberately,
weekly-cadence rather than daily (`M4-002` §2, matching COT's own
weekly publication cadence, L1-004). **Entry points:** Primary
Navigation. **Exit points:** the specific instrument the report
concerns.

**Why every section exists:** the per-instrument snapshot is Primary
because a trader's own natural first question is "what is institutional
positioning on the instruments I actually track," not the full raw
report table — the historical table is Secondary/Progressive precisely
because full historical detail is High density and not needed to answer
that first question (D1-002 §4.4). This screen never links onward to an
"AI interpretation of this" (`M4-002` §6, already-established rule for
COT/Reports) — stated here again as this screen's own binding
Exit-Point constraint, not merely inherited silently.

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Current Positioning Snapshot (per tracked/held    │    │
│  │ instrument, most recent report)                              │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Secondary — Historical COT Table (prior reporting periods,  │    │
│  │ reached via drill-in, never shown expanded by default)       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐                                          │
│  │ Peripheral: filter   │                                         │
│  │ instrument/date       │                                         │
│  └────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Information Density / Progressive Disclosure):** does
showing the full historical table by default push this screen into
High density at first render, violating D1-002 §4.4's own rule (High
density "never a screen's own first-rendered state")? **Finding —
genuine weakness identified in draft.** An initial draft rendered the
full historical table inline below the snapshot. **Fix applied:**
historical detail is collapsed behind a deliberate drill-in action
(Progressive Disclosure, D1-005 §3.1) — the snapshot alone is the
first-rendered state, mirroring the same fix already applied to
`DASH-003` (`M4-003.1` §2.2) and Morning Brief's own evidence expansion
(`M4-004` §3).

**Reviewed (Trading Psychology / Evidence Over Signals):** could a
naive visual treatment (e.g. a directional arrow styled like a
Confluence reading) risk implying COT data is itself an interpreted
signal rather than raw evidence? **Finding — genuine weakness
identified in draft.** Styling net long/short figures identically to a
Confluence Engine reading (with `data.positive`/`data.negative` framing
as if it were a P/L direction) would blur the Constitution §10.2
distinction this screen exists to preserve. **Fix applied:** net
positioning figures use plain `text.numeric` with an explicit `+`/`−`
or "long"/"short" label, never the `data.positive`/`data.negative`
tokens reserved for actual gain/loss — a distinct, deliberately
un-color-coded treatment that visually signals "this is raw data, not
a directional reading," directly reinforcing the raw-evidence-vs-
interpretation boundary this screen's own Constitution §10.2 purpose
requires.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Positioning snapshot (Primary) | Yes — the trader's first, most relevant question | Constitution §10.2 | *Cognitive:* low, bounded to tracked instruments. *Behavioral:* reinforces evidence-only consumption. *Emotional:* grounded, discerning (ZXL §9, COT & Reports). |
| Historical table (Secondary, drill-in) | Yes, on demand | D1-002 §4.4 | *Cognitive:* High only when deliberately entered. *Behavioral:* supports genuine research without forcing it. *Emotional:* neutral. |
| Filter (Peripheral) | Yes | Constitution §6.4 | *Cognitive:* minimal. *Behavioral:* low-stakes. *Emotional:* none. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Positioning snapshot + historical table | **Observe** | Institutional positioning is exactly one of the disclosed evidence sources named at `M4-002.2` Learning Loop §3 ("institutional positioning (COT & Reports)"). |
| Filter | **Observe** (refinement) | Narrows the same stage. |

Every section maps to Observe.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Snapshot headline: `text.heading`. Per-instrument row: `text.title`. Net positioning figures: `text.numeric`, tabular, plain label (§3 fix) — never styled as a P/L direction. Historical table headers: `text.micro`. |
| Spacing | Primary-to-secondary gap: `space.32`. Table rows/columns per D2-004 §8 (Medium density) and §6.4 (minimum `space.16` numeric-column gutter). |
| Elevation/Radius | Snapshot: Panel, `elevation.0`, no radius. Historical table: Table (D2-005 §4), reached only via drill-in — no elevation change on reveal beyond `motion.duration.default`. |
| Color tokens | Net positioning: `text.primary`, no `data.positive`/`data.negative` (§3 fix — this is the one numeric-direction context in the entire product that deliberately does *not* use those tokens, precisely because it is not a gain/loss reading). `signal.warn`/`critical` reserved for data-availability conditions only. |
| States | Loading: skeleton. Empty (no COT data for tracked instruments — e.g. non-futures instrument): factual disclosure, never implying a product gap (D1-002 §14.1). Error: per D1-002 §14.4–14.6, with last-known-report timestamp. |
| Interaction | Drill-in to historical table: deliberate, low-stakes. Filter: low-stakes. No onward link to "AI interpretation of this" (`M4-002` §6, binding). |
| Motion | No flash on new-report arrival (weekly cadence; still no manufactured urgency, D1-002 §6.1). |
| Accessibility | Table semantic headers; net-positioning label always paired with the numeric figure, never a bare number (D2-007 §5, no information by color/shape alone — extended here to "no information by convention-borrowed styling alone"). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Positioning snapshot | `surface.base`, `text.primary` (not `data.*`) | `text.heading`, `text.numeric` | `space.32` isolation | Panel (D2-005 §3) | Coherent-sentence summary, labeled figures | Read-only |
| Historical table (drill-in) | `surface.raised`, `text.micro` headers | `text.numeric` | `space.16` gutter (D2-003 §6.4) | Table (D2-005 §4) | Semantic headers | Deliberate drill-in only |
| Filter | `accent.default` | `text.micro` | `space.8`–`12` | Dropdown (D2-005 §6) | Keyboard-operable | Low-stakes |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — the deliberate non-use of `data.*` tokens (§3) is a
  concrete, checkable proof that COT data is never dressed up as an
  interpreted signal.
- **Reduce stress?** Yes — weekly cadence, no urgency treatment.
- **Improve decision quality?** Yes — genuine raw evidence, clearly
  distinguished from interpretation, supports (not substitutes for)
  the trader's own analysis.
- **Comfortable after 6–10 hours?** Yes — Progressive Disclosure keeps
  first-render density Low/Medium.
- **Strengthens Zenith philosophy?** Yes — this screen is Evidence
  Over Signals' clearest possible expression.
- **Strengthens the Learning Loop?** Yes — Observe, fully.

**Weakness identified in this pass:** the color-coding risk (§3) was
genuine — using `data.*` tokens here would have been a real, subtle
violation of this screen's own stated purpose; now explicitly
foreclosed.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §4.1, §6.4, §10.2
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §4.4
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.2, §3.1
- `documentation/zos/D2-002_COLOR_SYSTEM.md` §11, `D2-004` §6.4, §8, `D2-005` §4, `D2-007` §5
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (COT & Reports)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-011`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.7, §6
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-011_REPORTS_SCREEN_DESIGN.md` (sibling screen, same approved area)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
