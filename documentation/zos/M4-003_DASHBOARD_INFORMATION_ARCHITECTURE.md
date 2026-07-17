# M4-003_DASHBOARD_INFORMATION_ARCHITECTURE

**Document ID:** ZOS-M4-003
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Dashboard Design phase)

------------------------------------------------------------------------

# Purpose

This is the Dashboard Information Architecture — the first document in
the Dashboard Design Package, converting Dashboard's already-approved
component architecture (`26_DASHBOARD_HOME_SPECIFICATION.md`) and
screen architecture (`M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.1,
§8) into an explicit information hierarchy, reading order, and
attention flow — read together with `M4-002.2_TRADER_DECISION_JOURNEY.md`'s
own Learning Loop (its final section), which this document treats as
binding: **the Dashboard must be the entry point into the Zenith
Learning Loop, and every block on it must strengthen at least one
stage of that loop or it should not exist.**

This document introduces no new component, no new product area, and no
new architecture. `DASH-001` through `DASH-011` (`26`) remain the sole
authority on what exists; this document states *why each one belongs on
Dashboard specifically*, in what order attention should reach it, and
which Learning Loop stage it strengthens. No wireframe, no color, no
typography, no spacing value, no code.

------------------------------------------------------------------------

# 1. Dashboard Purpose

Restated from Constitution §10.2 and `26` §1, not re-derived: Dashboard
is the trader's single entry point each session, answering Decision
Flow Q1 ("Am I decision-ready right now?", ZXL §2) in one glance,
without the trader manually cross-referencing other screens.

This document adds one binding frame, required by this task: **Dashboard
is also the entry point into the Zenith Learning Loop**
(`M4-002.2`, Learning Loop §2). The two purposes are not competing —
answering "am I decision-ready" *is* the Observe/Understand/Decide
portion of the loop, compressed into the fastest possible read. A
trader who leaves Dashboard well-oriented has already completed the
loop's first three stages for the current session; Dashboard's other
blocks exist to make the remaining stages (Record, Reflect, Learn,
Improve) reachable, never to perform them itself.

------------------------------------------------------------------------

# 2. Dashboard Boundaries

Restated from `M4-002` §8 (What Dashboard Must Never Become), with one
Learning-Loop-specific addition:

1. **Not a raw data dump** — synthesis only (Constitution §10.2).
2. **Not a customizable widget board** — no trader-configurable layout
   (Constitution §3, Product DNA).
3. **Not a second Watchlist or Portfolio** — references, never
   duplicates (Constitution §5.4).
4. **Not an execution surface** — no action on Dashboard ever mutates a
   position or implies a trade (Constitution §3.1, §9.4).
5. **Not a performer of Record/Reflect/Learn/Improve.** Dashboard opens
   the door to these Learning Loop stages (via `DASH-007`/`DASH-008`
   entry points, once built) — it never attempts to perform Trading
   Journal's recording or AI Workspace's reflection itself. Collapsing
   those stages onto Dashboard would violate `M4-002` §8's own
   "not a second X screen" principle, applied to future screens as much
   as present ones.

------------------------------------------------------------------------

# 3. Information Hierarchy

Directly inherits `26` §2 (Component Hierarchy) and ZXL §1 (Attention
Hierarchy) — this document does not reorder or reweight either.

| Attention Level (ZXL §1) | Component(s) (`26`) | Density Tier (D1-002 §4.4) |
|---|---|---|
| Primary | `DASH-002` Decision Readiness Summary | Low (Synthesis Archetype, D1-005 §2.1) |
| Secondary | `DASH-004` Morning Brief Entry, `DASH-005` Watchlist Snapshot, `DASH-006` Portfolio Snapshot | Low per-block; Medium as a set |
| Supporting | `DASH-003` Confidence & Uncertainty Disclosure (nested within whichever Primary/Secondary reading it accompanies) | N/A — subordinate, not independent |
| Peripheral | `DASH-007`–`DASH-011` (Trading Journal, AI Workspace, Alerts, Calendar/News, COT & Reports — all Placeholder in V1) | N/A — reachable, not held in mind |

Exactly one Primary element exists (`DASH-002`), per ZXL §1.1 and D1-002
§1.1 — this is the single most decision-relevant synthesis on the page
and the only element a trader must actively reason about on arrival.

------------------------------------------------------------------------

# 4. Block Priority

Directly inherits `26` §2's own P0/P1/P2 build priority — restated here
only to make explicit that build priority and Attention level are
**not the same axis** (ZXL §1, opening paragraph; `M4-002` §9 makes the
identical disambiguation for navigation). `DASH-004`, `DASH-005`, and
`DASH-006` are all engineering P0, but all three sit at Secondary
Attention — none competes with `DASH-002` for first glance merely
because all are built in V1.

| Block | Build Priority (`26`) | Attention Level |
|---|---|---|
| `DASH-001` (container) | P0 | N/A (structural) |
| `DASH-002` | P0 | Primary |
| `DASH-003` | P0 (shared) | Supporting |
| `DASH-004` | P0 | Secondary |
| `DASH-005` | P0 | Secondary |
| `DASH-006` | P0 | Secondary |
| `DASH-007`, `DASH-008` | P1 | Peripheral |
| `DASH-009`, `DASH-010`, `DASH-011` | P2 | Peripheral |

------------------------------------------------------------------------

# 5. Reading Order & Attention Flow

Follows the Synthesis Archetype's own region order (D1-005 §2.1) exactly:

1. **Primary Attention** — the single synthesized conclusion (`DASH-002`).
2. **Secondary Attention** — the evidence/reasoning and entry points that
   extend it (`DASH-004`, `DASH-005`, `DASH-006`), consulted once the
   Primary question is answered, never competing with it for the first
   glance (ZXL §1.2).
3. **Supporting Attention** — confidence/uncertainty disclosure
   (`DASH-003`), consulted deliberately, nested within its parent
   reading rather than presented as an independent region (ZXL §1.3).
4. **Peripheral** — entry points to areas not central to the trader's
   immediate question (`DASH-007`–`DASH-011`), present but not asking to
   be noticed (ZXL §1.4).

Per D1-001 §2 (eye-tracking, F/Z-pattern), the Primary region occupies
the highest-attention position — top of the page, first in document
order at every breakpoint (D1-005 §5.1) — as a structural layout
requirement (D1-002 §1.2), not a styling compensation.

------------------------------------------------------------------------

# 6. Decision Flow Mapping

Per ZXL §2 and `M4-002` §1: Dashboard answers Q1 ("Am I decision-ready
right now?") in full via `DASH-002`. It does not attempt to answer Q2
("Why?") in full — that is Morning Brief's own job, entered via
`DASH-004` — nor Q3 ("Where, specifically?") in full — that is
Watchlist's/Portfolio's own job, entered via `DASH-005`/`DASH-006`.
Dashboard's Secondary-Attention blocks are *bridges* to the screens that
answer later questions, not attempts to answer those questions
completely in-place — this is what keeps Dashboard at Low information
density (D1-002 §4.4) despite referencing four other product areas.

------------------------------------------------------------------------

# 7. Entry Points

Per `26` §3 (`DASH-001`) and `M4-002` §4.1: session start (app launch,
post-authentication); the "return to Dashboard" link offered by every
other screen's own Primary Navigation (D1-005 §4.2, always present, same
relative position). Dashboard has no other entry point — it is never
reached via a context link from a specific instrument or record, since
its purpose is a general session-start synthesis, not a specific-item
detail view.

------------------------------------------------------------------------

# 8. Exit Points

Per `25_PRODUCT_BLUEPRINT.md` §2 (Dashboard) and `M4-002` §4.1: Morning
Brief, Watchlist, Portfolio (V1, all built); Alerts, Calendar/News, COT
& Reports, AI Workspace, Trading Journal (future, per each area's own
Blueprint priority). Every exit is a navigation action only — none
mutates state, none implies a trade (Constitution §3.1, §3.3).

------------------------------------------------------------------------

# 9. Why Every Block Exists — Learning Loop Mapping

The core deliverable this task requires: which Learning Loop stage(s)
(`M4-002.2`, Learning Loop §2 — Observe, Understand, Decide, Execute
[outside Zenith], Record, Reflect, Learn, Improve, Repeat) each block
strengthens, and why. A block that cannot name a stage does not belong
on Dashboard — none below fails this test; where a block's own
contribution is currently limited to *pointing toward* a future stage
(V1 scope, `25_PRODUCT_BLUEPRINT.md` §8), that limitation is disclosed,
not hidden.

## `DASH-001` — Dashboard Page Container

- **Why it exists:** the structural root every other block composes
  into; without it, no other block can render (`26` §3).
- **Learning Loop stage(s):** none directly — it is the enabling
  structure for every stage below, not a stage itself.

## `DASH-002` — Decision Readiness Summary

- **Why it exists:** ends the trader's own need to mentally synthesize
  Watchlist/Portfolio/Morning Brief before knowing where they stand
  (ZXL §9.1; `26` §3).
- **Learning Loop stage(s): Understand, Decide.** It is the Confluence
  Engine's own synthesis, disclosed as a narrative before any chart
  (Constitution §4.1, §12.1) — exactly the Understand stage as already
  described at `M4-002.2`'s Learning Loop §3. Its confidence/uncertainty
  disclosure (`DASH-003`) is what lets the trader actually prepare a
  decision (Decide) rather than merely receive a data point.

## `DASH-003` — Confidence & Uncertainty Disclosure

- **Why it exists:** Design Constitution rule 8 requires identical
  confidence/uncertainty treatment everywhere a reading appears; built
  once, reused three times (`26` §3).
- **Learning Loop stage(s): Understand, Decide.** Same two stages as its
  parent reading — it is what makes Understand and Decide *honest*
  (Constitution §6.5, §12.6–12.7), not a separate stage of its own.

## `DASH-004` — Morning Brief Entry

- **Why it exists:** Dashboard is the navigation hub; every area it
  links to needs its own entry (`26` §3; `25_PRODUCT_BLUEPRINT.md` §4).
- **Learning Loop stage(s): Observe, Understand.** Morning Brief is
  where "what changed" (Observe) is gathered and turned into the day's
  own narrative (Understand) — `DASH-004` is the bridge into that work,
  not a duplicate of it (§6 above).

## `DASH-005` — Watchlist Snapshot

- **Why it exists:** Watchlist is a stated Dashboard Exit Point;
  summarizing it here avoids a separate navigation just to see
  tracked-instrument status (`26` §3).
- **Learning Loop stage(s): Observe.** The tracked-instrument set is
  exactly what Zenith Observes on the trader's own behalf (`M4-002.2`
  Learning Loop §3, "Observe... bounded to what a trader actually tracks
  or holds") — `DASH-005` is that Observe stage's own Dashboard-facing
  summary.

## `DASH-006` — Portfolio Snapshot

- **Why it exists:** Portfolio is a stated Dashboard Exit Point; gives
  current holdings a calm, neutral summary distinct from Watchlist's
  own tracked-but-unowned instruments (`26` §3).
- **Learning Loop stage(s): Observe**, and — via its own Exit Point into
  Trading Journal (`25_PRODUCT_BLUEPRINT.md` §2, Portfolio) —
  **a forward bridge toward Record.** A held position is both something
  Zenith Observes (current state) and the eventual subject of a Journal
  entry; `DASH-006` performs only the former today, per V1 scope.

## `DASH-007` — Trading Journal Entry (Placeholder, P1)

- **Why it exists:** reserves Dashboard's own navigation slot for
  Trading Journal, preserving the hub relationship without fabricating
  content for an area with no backend yet (`26` §3).
- **Learning Loop stage(s): Record, Reflect, Learn** (once built). In
  V1, this block cannot itself strengthen these stages — it can only
  disclose, honestly, that they exist and are reachable. This is stated
  plainly rather than claimed prematurely; §2 above already forecloses
  Dashboard performing these stages itself once Journal does exist.

## `DASH-008` — AI Workspace Entry (Placeholder, P1)

- **Why it exists:** reserves Dashboard's own navigation slot for AI
  Workspace (`26` §3).
- **Learning Loop stage(s): Understand, Decide** (once built, as a
  secondary path into the same stages `DASH-002`/`DASH-003` already
  serve, for a trader who wants to ask a direct question rather than
  read a synthesized statement).

## `DASH-009`–`DASH-011` — Alerts / Calendar-News / COT-Reports (Placeholder, P2)

- **Why they exist:** reserve navigation slots for the remaining
  approved areas (`26` §3).
- **Learning Loop stage(s): Observe** (once built — each is an
  additional evidence source Zenith collects on the trader's behalf,
  per `M4-002.2` Learning Loop §3's own Observe description).

------------------------------------------------------------------------

# 10. What Is Deliberately Not Included

Per this task's own test ("if a Dashboard element does not measurably
improve the Learning Loop, it should be removed"), the following are
explicitly absent, and stay absent:

- **A customizable widget board** — no Learning Loop stage benefits from
  trader-configurable layout; it only adds cognitive load (§2 above).
- **A "market mood"/sentiment gauge or ticker** — not an approved
  product area (Constitution §10.2) and does not map to any Learning
  Loop stage; it would be decoration, which Constitution §5.1 forecloses.
- **Streaks, badges, login counters** — explicitly excluded across
  `M4-002.2` §1, §7, §10 — reward mechanics attach to activity, not to
  any Learning Loop stage, and are permanently foreclosed (Constitution
  §3.2, §7.5, §12.3).
- **A "buy/sell" or execution affordance of any kind** — no Learning
  Loop stage authorizes crossing the Execute boundary (Constitution
  §9.4, §10.2; `M4-002.2` Learning Loop §3, Execute).

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §3, §5, §9, §10.2
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §1, §2
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §1, §2
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §1, §4
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §1, §2
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2, §8
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (component
  architecture authority, not modified)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §1, §4.1, §8, §9
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop
  section, structural authority for §1, §9 above, not modified)
- `documentation/zos/M4-003.1_DASHBOARD_WIREFRAME_SPECIFICATION.md`
- `documentation/zos/M4-003.2_DASHBOARD_HIGH_FIDELITY_SPECIFICATION.md`
- `documentation/zos/M4-003.3_DASHBOARD_PHILOSOPHY_VALIDATION.md`
