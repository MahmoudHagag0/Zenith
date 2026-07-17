# M4-004_MORNING_BRIEF_SCREEN_DESIGN

**Document ID:** ZOS-M4-004
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Morning Brief's complete screen design — the second of the remaining
Screen Design Package, built on the now-official Dashboard reference
(`M4-003` series). No component, color, or architecture here may
contradict Dashboard's own Architecture, Information Hierarchy, UX,
Psychology, Design Language, Component Usage, Design System, or the
Zenith Learning Loop, per this task's own binding instruction. This
document introduces no new product area or component beyond what
`M4-002` §4.2 and `25_PRODUCT_BLUEPRINT.md` §2 (Morning Brief) already
approve.

**Unique responsibility (never duplicates Dashboard):** `DASH-004` on
Dashboard is a one-line preview only (`26` §3, `M4-003` §9) — it never
shows the full narrative. Morning Brief is where the full,
Constitution-§12.1-compliant story-before-chart synthesis actually
lives: the complete ranked narrative across every tracked/held
instrument, not a teaser of it.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** synthesize what changed and what matters before any chart
is shown (Constitution §10.2, §12.1). **Boundaries:** never a raw data
feed, never a second Watchlist/Portfolio (mirrors `M4-002` §8's rule for
Dashboard, applied here — Morning Brief narrates, it does not
duplicate each screen's own full record). **Information hierarchy:**
Primary = the day's own ranked synthesized narrative; Secondary = the
evidence/reasoning per narrative entry; Supporting = confidence/
uncertainty per entry (`DASH-003` pattern, reused per Design
Constitution rule 8, never re-specified locally); Peripheral =
cross-references into Calendar/News, AI Workspace. **Reading order /
attention flow:** Synthesis Archetype (D1-005 §2.1) — Primary first,
full-width, top of page. **Decision flow:** answers Q2 ("Why?", ZXL
§2) — the trader has already been told *whether* they're decision-ready
by Dashboard; Morning Brief explains *why*. **Entry points:** Dashboard
(`DASH-004`, typical), direct Primary Navigation (`M4-002` §4.2).
**Exit points:** Watchlist/Portfolio (per-instrument follow-through),
AI Workspace (`M4-002` §4.2, §5.1).

**Why every section exists:** the ranked narrative exists because
Constitution §8.3 requires ordering by decision relevance, not
recency — a screen that listed instruments alphabetically or by
last-updated would violate this directly. Per-entry evidence exists
because a narrative claim with no attached evidence would violate
Constitution §4.1 (Evidence Over Signals). Confidence/uncertainty per
entry exists because Design Constitution rule 8 requires it wherever
any reading appears, without exception.

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Today's Synthesized Narrative                    │    │
│  │ [ranked list: 1. most relevant change ... N. least]        │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Narrative Entry 1 (expandable)                             │    │
│  │  evidence/reasoning · nested Confidence & Uncertainty       │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Narrative Entry 2 (expandable) ...                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐  ┌────────────────────────────────┐     │
│  │ Peripheral: relevant │  │ Peripheral: Ask AI Workspace    │     │
│  │ Calendar/News items  │  │ about this narrative            │     │
│  └────────────────────┘  └────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

Each Narrative Entry uses the identical internal structure (statement →
evidence → nested confidence/uncertainty) regardless of favorability
(Constitution §3.3, §7.3) — no entry is visually louder because its
own underlying reading is more dramatic (Constitution §8.3).

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Working Memory / Information Density):** an unbounded
narrative list risks exceeding the active-reasoning ceiling (D1-001 §1,
ZXL §3.1) if every tracked instrument gets an equally-weighted entry.
**Finding — genuine weakness.** An initial draft with one entry per
Watchlist instrument could scale past what a trader reasons about at
once on a large Watchlist. **Fix applied:** entries are capped to the
top-N most decision-relevant items (Constitution §8.3, mirroring
`26`'s own precedent of never rendering unbounded lists on a synthesis
screen) — the full unranked set remains reachable via Watchlist itself,
never duplicated here.

**Reviewed (Eye Tracking / Decision Fatigue):** does entry order
degrade for the trader's tenth visit of the week (Constitution §6.2)?
**Finding:** no weakness — ranking is relevance-based, not
recency-based (Constitution §8.3), so the mechanism producing order
never changes based on how many times the trader has looked.

**Reviewed (HCI, Progressive Disclosure):** should evidence be shown
inline or behind an expand action? **Finding — genuine weakness.**
Showing full evidence for every entry by default would push the screen
past Low density (D1-002 §4.4) into unwarranted Medium/High density on
first render. **Fix applied:** each entry renders its own one-line
conclusion by default; evidence/reasoning expands on deliberate action
only (Progressive Disclosure, D1-005 §3.1, ZXL §3.2) — mirroring
`M4-003.1` §2.2's own nested-disclosure fix for `DASH-003`.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Ranked narrative (Primary) | Yes — answers "why" once, in relevance order | Constitution §12.1, §8.3 | *Cognitive:* one ordered read, not N unordered facts. *Behavioral:* anchors interpretation to evidence before any chart (§12.1's confirmation-bias rationale). *Emotional:* briefed, prepared (ZXL §9.2). |
| Per-entry evidence (expand) | Yes — lets a trader verify without being forced to | Constitution §4.1 | *Cognitive:* low by default (collapsed); available on demand. *Behavioral:* rewards deliberate verification, not passive scrolling. *Emotional:* trust via traceability (Constitution §5.3). |
| Nested confidence/uncertainty | Yes — prevents overstated narrative claims | Design Constitution rule 8 | *Cognitive:* low, same treatment as Dashboard's `DASH-003`. *Behavioral:* counters overconfidence (ZXL §7.4). *Emotional:* calibrated trust (Constitution §6.3). |
| Peripheral cross-references | Yes, narrowly — reduces re-search cost | Constitution §12.2 | *Cognitive:* minimal; a labeled bridge, not new content. *Behavioral:* none coercive. *Emotional:* none intended. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Learning Loop stage(s) | Why |
|---|---|---|
| Ranked narrative | **Observe, Understand** | It is literally "what Zenith collects" turned into "raw data → context" (`M4-002.2` Learning Loop §3) — the canonical Understand mechanism, at full depth rather than Dashboard's teaser. |
| Per-entry evidence | **Understand** | Extends the same stage with traceable depth, never a new stage of its own. |
| Confidence/uncertainty | **Understand, Decide** | Same reasoning as `M4-003` §9's `DASH-003` mapping — enables honest Decide, not a separate stage. |
| Peripheral cross-references | **Observe** (Calendar/News link), **Decide** (AI Workspace link) | Bridges only; performed fully by their own destination screens. |

Every section maps to at least one stage; none is removed or redesigned.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment (D2, unchanged from Dashboard's own selections where the same concept recurs) |
|---|---|
| Typography | Narrative headline: `text.heading` (D2-003 §1). Per-entry conclusion: `text.body`. Evidence/reasoning: `text.body`. Nested confidence/uncertainty: `text.caption`, identical weight both halves (Design Constitution rule 8). Timestamps: `text.micro`. Any numeric figure: `text.numeric`, tabular (D2-003 §5). |
| Spacing | Primary-to-entries gap: `space.64` (D1-004 §2 rule 2.2). Between entries: `space.24`. Internal entry padding: `space.16`. Nested confidence from entry conclusion: `space.24` (mirrors `M4-003.2` §3). |
| Elevation/Radius | Primary narrative region: Panel (D2-005 §3), `elevation.0`, no radius (full-bleed, per `M4-003.2` §4's own corrected rule). Each Narrative Entry: Card (D2-005 §2), `elevation.1`, `radius.md`. |
| Color tokens | `surface.base`/`surface.raised` per D2-002 §5; `text.primary/secondary/muted`; directional figures use `data.positive`/`data.negative` (never `signal.*`, D1-003 §5.2); `signal.warn`/`critical` reserved for genuine data-availability conditions only (D1-002 §14.4). |
| States | Loading: Skeleton (D2-005 §17), same footprint as Success. Empty ("nothing decision-relevant to lead with," `26` §3 DASH-004 precedent): identical calm weight to a populated state (D1-002 §14.3). Error: `signal.warn`/`critical` per D1-002 §14.4–14.6, with last-known timestamp disclosed. |
| Interaction | Expand/collapse an entry: low-stakes, frictionless (D1-002 §12.1). Navigation to Watchlist/Portfolio/AI Workspace: navigation-only, no state mutation. |
| Motion | `motion.duration.default` cross-fade on expand; no flash/pulse on any narrative update (D1-002 §5.3). |
| Accessibility | One `<h1>`; narrative read as ordered list, not an unordered grid (D2-007 §6.4-adjacent); confidence/uncertainty announced as one semantic unit (D2-007 §6.2); focus order follows Primary→Secondary→Peripheral (D2-007 §2.2). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Primary narrative region | `surface.base` | `text.heading` | `space.64` isolation | Panel (D2-005 §3) | Ordered-list semantics | None (read-only) |
| Narrative Entry (collapsed) | `surface.raised`, `text.body` | `text.body` | `space.16` internal, `space.24` between | Card (D2-005 §2) | Accessible expand control label | Expand → Secondary Attention reveal |
| Nested confidence/uncertainty | `text.caption` | `text.caption` | `space.24` from conclusion | Sub-content, no separate component (mirrors `DASH-003`) | One semantic unit | Optional drill-in to Traceability |
| Peripheral cross-references | `text.muted`/`accent.default` (link only) | `text.micro` | `space.8`–`12` | Tertiary-tier link (D1-003 §3.1) | Accessible name states destination | Navigation only |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Would a professional trader trust this screen?** Yes — evidence
  precedes conclusion at every level (Constitution §12.1, §12.5), and
  confidence/uncertainty are never separated (Design Constitution rule 8).
- **Reduce stress?** Yes — capped entry count (§3 fix) keeps density
  Low; no motion reads as alarm.
- **Improve decision quality?** Yes — the same evidence-first mechanism
  already validated for Dashboard (`M4-003.3` §2.4), applied at full
  narrative depth.
- **Comfortable after 6–10 hours?** Yes — identical surface/text tokens
  as Dashboard (§6 above), inheriting the same long-session correction
  (D2-002 §5).
- **Strengthens Zenith philosophy?** Yes — Understanding before
  Performance (no chart before narrative, §1).
- **Strengthens the Learning Loop?** Yes — the full Understand stage
  lives here (§5).

**Weakness identified in this pass:** none beyond the two already fixed
in §3. Re-review after those fixes surfaces no further concern.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §4, §8, §10.2, §12
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §2, §3
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.1
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-003`, `D2-004`, `D2-005`, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2, §5, §7, §8
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-004`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.2
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
