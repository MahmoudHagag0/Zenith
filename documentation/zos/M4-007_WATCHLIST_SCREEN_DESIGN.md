# M4-007_WATCHLIST_SCREEN_DESIGN

**Document ID:** ZOS-M4-007
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Watchlist's complete screen design, built on the official Dashboard
reference (`M4-003` series). Governs `DASH-005`'s full destination
screen (`26` §3, `M4-002` §4.3, `25_PRODUCT_BLUEPRINT.md` §2 Watchlist).

**Unique responsibility (never duplicates Dashboard):** `DASH-005` is a
bounded, read-only, top-N snapshot with no add/remove capability (`26`
§3, explicit). Watchlist is the complete tracked-instrument list plus
the only place tracking itself is managed.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** hold and scan the intentionally-tracked instrument set
(Constitution §10.2). **Boundaries:** never an unbounded feed (D1-005
§2.2) — the tracked set is always intentional, never auto-populated by
volume/popularity. **Information hierarchy:** Primary = the tracked
set's own aggregate state (how many have a new reading, not any single
row, D1-005 §2.2); Secondary = individual rows, each with a consistent
Confluence annotation (`DASH-003` pattern reused); Peripheral =
filter/sort controls, add/remove management. **Reading order:**
List/Tracking Archetype (D1-005 §2.2) — Medium density, a bounded set
of individually low-density items. **Decision flow:** answers Q3 for
tracked (not necessarily held) instruments. **Entry points:** Dashboard
(`DASH-005`), Morning Brief drill-in, Primary Navigation. **Exit
points:** Portfolio (if a position exists on the instrument), AI
Workspace, Alerts configuration (once built).

**Why every section exists:** the aggregate-state Primary exists
because D1-005 §2.2 explicitly assigns Primary Attention to the list's
own current state, not to any individual row by default — a specific
row earns Primary Attention only once drilled into. Add/remove
management lives here, not on Dashboard, because Constitution §6.4
requires attention allocation to stay intentional — the one screen
where the tracked set is *curated*, not merely *observed*, is the
correct home for that responsibility.

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Tracked Set Aggregate State (N of M have a new    │    │
│  │ reading)                                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Row: instrument A — reading + nested confidence/uncertainty │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Row: instrument B ...                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐  ┌────────────────────────────────┐     │
│  │ Peripheral: filter/  │  │ Peripheral: add instrument      │     │
│  │ sort                 │  │ (Quick Action, `M4-002` §3.6)   │     │
│  └────────────────────┘  └────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Behavioral Economics / Compulsive Checking):** does an
unbounded add capability risk an ever-growing, unintentional tracked
set that itself becomes a source of anxiety (Constitution §6.4)?
**Finding — genuine weakness identified in draft.** No upper guidance
was stated on tracked-set size, risking exactly the "unbounded
attention-seeking" ZXL §9.3 warns against. **Fix applied:** the
aggregate-state Primary region (§1) itself functions as the natural
check — a trader who cannot recall why a given row is tracked has a
visible, self-correcting signal (a long, low-recall list), rather than
a hard system-enforced cap, which would be an arbitrary, undisclosed
restriction Constitution §5.3 (transparency) would not support without
its own stated rationale. This is a design-affordance fix (making
list-length self-evident), not a new hard limit.

**Reviewed (Eye Tracking / Scan Speed):** with potentially many rows,
does scanning for "what's new" cost more attention on row 40 than row 4?
**Finding:** already governed, not a new gap — the aggregate-state
Primary answers "what changed" without requiring a full manual scan at
all (D1-005 §2.2); individual rows are Secondary, consulted only for a
specific instrument the aggregate flagged.

**Reviewed (Information Density):** does per-row Confidence/uncertainty
disclosure (`DASH-003` pattern) at Medium density risk exceeding the
active-reasoning ceiling across many rows? **Finding:** no weakness —
identical reasoning to Dashboard's own Secondary row (`M4-003.1` §2.3):
rows are consulted, not held simultaneously in working memory.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Aggregate state (Primary) | Yes — answers "what changed" without a manual scan | D1-005 §2.2 | *Cognitive:* low, one summary fact. *Behavioral:* discourages compulsive row-by-row checking. *Emotional:* in control, focused (ZXL §9.3). |
| Individual rows (Secondary) | Yes — per-instrument evidence, on demand | Constitution §4.1 | *Cognitive:* Medium, bounded, consulted not held. *Behavioral:* supports intentional review. *Emotional:* neutral. |
| Filter/sort (Peripheral) | Yes — narrows without adding new content | Constitution §6.4 | *Cognitive:* minimal. *Behavioral:* reversible, frictionless (D1-002 §12.1). *Emotional:* none. |
| Add/remove (Peripheral) | Yes — the one place tracking is curated | ZXL §9.3 | *Cognitive:* minimal per action. *Behavioral:* self-evident list-length (§3 fix) discourages unbounded growth. *Emotional:* none coercive. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Aggregate state + rows | **Observe** | The canonical Observe mechanism (`M4-002.2` Learning Loop §3) at full depth vs. Dashboard's bounded top-N. |
| Filter/sort | **Observe** (refinement) | Narrows the same Observe question; not a new stage. |
| Add/remove | **Observe** (scope-setting) | Determines *what* Zenith Observes on the trader's behalf — a prerequisite to Observe, not a separate stage. |

Every section maps to Observe; no section fails.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Aggregate statement: `text.heading`. Row instrument name: `text.title`. Row reading/price: `text.numeric`, tabular. Confidence/uncertainty per row: `text.caption`. Column headers: `text.micro`, `letterSpacing.wide` if uppercase (D2-003 §6.1). |
| Spacing | Primary-to-rows gap: `space.64`. Between rows: `space.16`–`24` (D2-004 §8, Medium density). Adjacent numeric columns: minimum `space.16` gutter (D2-003 §6.4). |
| Elevation/Radius | Primary aggregate region: Panel, `elevation.0`, no radius. Row list: Table (D2-005 §4) — the canonical container for Medium-density content, not individual Cards, since rows are a scannable set, not discrete items to compare visually. |
| Color tokens | Reading direction: `data.positive`/`data.negative`, secondary to symbol. Stale/degraded per-row data: `signal.warn` (D2-005 §4 table-row states extended). |
| States | Loading: skeleton rows. Empty (no tracked instruments — first use): factual, states why and routes toward adding a first instrument (D1-002 §14.1). Error: list-load failure reported distinctly from per-row annotation failure (`26` §3, DASH-005 precedent). |
| Interaction | Row select: navigation drill-in. Filter/sort: low-stakes, frictionless. Add/remove: a Quick Action (`M4-002` §3.6) — low-stakes, reversible, no confirmation friction (D1-002 §12.1, §12.4). |
| Motion | No flash on a row's reading update, regardless of magnitude (D1-002 §5.3). |
| Accessibility | Table uses semantic header markup (D2-007 §6.4); row + reading announced together (D2-007 §6.4); add/remove controls keyboard-reachable (D2-007 §2.1). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Aggregate state | `surface.base` | `text.heading` | `space.64` isolation | Panel (D2-005 §3) | Coherent-sentence summary | Read-only |
| Row list | `surface.raised`, `data.positive/negative`, `signal.warn` (stale) | `text.title`, `text.numeric`, `text.micro` headers | `space.16`–`24` | Table (D2-005 §4) | Semantic headers, row+reading together | Row select → navigation |
| Filter/sort | `accent.default` (interactive only) | `text.micro` | `space.8`–`12` | Dropdown/Tertiary control (D2-005 §6, §1) | Keyboard-operable | Low-stakes, frictionless |
| Add/remove | `accent.default` | `text.body`/`text.micro` | `space.8`–`12` | Quick Action, Secondary/Tertiary button (D1-003 §3.1) | Accessible name | Low-stakes, no confirmation |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — consistent annotation pattern, identical to
  Dashboard's own `DASH-003` reuse.
- **Reduce stress?** Yes — aggregate-first reading removes the need to
  manually scan every row.
- **Improve decision quality?** Yes — intentional curation (§3) keeps
  attention allocation deliberate, not compulsive.
- **Comfortable after 6–10 hours?** Yes — Table component (D2-005 §4)
  is the correct, calmer container for potentially many rows versus
  individual Cards, which would add unnecessary visual weight per row
  across a long session.
- **Strengthens Zenith philosophy?** Yes — intentional, bounded
  attention allocation is a direct Constitution §6.4 implementation.
- **Strengthens the Learning Loop?** Yes — Observe, at full depth.

**Weakness identified in this pass:** the unbounded-tracked-set risk
(§3) was genuine; resolved via a self-evident-length design affordance
rather than an arbitrary hard cap, consistent with this project's own
preference for disclosed, evidence-grounded constraints over invented
limits.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §6.4, §10.2
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §9.3
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.2
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-003` §6, `D2-004` §8, `D2-005` §4, §6, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (Watchlist)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-005`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.3, §3.6
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
