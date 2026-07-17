# M4-008_TRADING_JOURNAL_SCREEN_DESIGN

**Document ID:** ZOS-M4-008
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

Trading Journal's complete screen design, built on the official
Dashboard reference (`M4-003` series). Governs `DASH-007`'s full
destination screen (`26` §3, `M4-002` §4.9, `25_PRODUCT_BLUEPRINT.md`
§2 Trading Journal). This is a P1 (Fast Follow) area — no backend data
model exists yet (Blueprint §7.1, §8) — this document specifies the
screen architecture ready for that future build, exactly as `26` §3
documented `DASH-007` as a designed placeholder rather than an
unspecified one.

**Unique responsibility (never duplicates Dashboard):** `DASH-007` is
an inactive navigation slot only. Trading Journal is the sole screen
whose primary action creates a persistent trader-authored record
(`M4-002` §7) and the sole screen performing Record/Reflect/Learn in
full — no other screen attempts these stages.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** record and later review the trader's own decisions and
reasoning (Constitution §10.2). **Boundaries:** never auto-generates an
entry on the trader's behalf (`M4-002.2` Learning Loop §3, Record — "the
record's own value depends on it being the trader's genuine reasoning");
never a punitive or scored review (Constitution §3.3). **Information
hierarchy:** Primary = a neutral entry list/summary (never colored by
outcome favorability); Secondary = individual entries, each linked to
its own Position/Instrument context; a cross-entry pattern view
(Supporting Attention, consulted deliberately) = the "behavioral
timeline" already named at `M4-002.2`'s Learning Loop §3 (Reflect) —
not a new screen, the same Trading Journal Success Criteria already
approved (Constitution §10.2: "identify a genuine process pattern
across multiple entries"); Peripheral = create-new-entry, filter by
instrument/date/outcome. **Reading order:** Record/Detail Archetype
(D1-005 §2.3) — Medium at the list level, High only within a single
drilled-into entry. **Decision flow:** answers Q4/Q5 ("What should I
avoid... review... learn from?", ZXL §2). **Entry points:** Primary
Navigation, Portfolio drill-in (review the reasoning behind a specific
position). **Exit points:** the referenced Position/instrument's own
context.

**Why every section exists:** the neutral list exists because
Constitution §3.3/§7.3 require a losing trade to be reviewed with the
same calm treatment as a winning one — Journal is the screen where this
principle is most safety-critical, since it is explicitly a review
surface a trader may revisit after a loss (`M4-002.2` §2.9, Reflection).
The cross-entry pattern view exists because it is Journal's own already-
approved Success Criteria, not an invented addition — omitting it would
under-deliver on Constitution §10.2's own stated purpose for this area.

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Neutral Entry Summary (N entries this period)     │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Entry 1 — decision, reasoning, linked position/instrument   │    │
│  │ (identical treatment regardless of outcome)                 │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Entry 2 ...                                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Supporting — Cross-Entry Pattern View (consulted            │    │
│  │ deliberately, never auto-surfaced as a conclusion)           │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐  ┌────────────────────────────────┐     │
│  │ Peripheral: filter   │  │ Peripheral: new entry            │     │
│  └────────────────────┘  └────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Trading Psychology / Non-Punitive Review):** could sorting
entries by outcome (wins first, or losses first) itself imply judgment?
**Finding — genuine weakness identified in draft.** Either ordering
choice implicitly ranks outcomes against each other, contradicting
Constitution §3.3's non-punitive framing. **Fix applied:** entries sort
chronologically only, by default — the one ordering criterion that
carries no evaluative implication, mirroring the neutral-sort fix
already applied to Portfolio (`M4-006` §3).

**Reviewed (Behavioral Economics / Reward Mechanics):** could the
cross-entry pattern view risk becoming a scored "trading grade" (a
gamification mechanism explicitly foreclosed, Constitution §3.2, §7.5)?
**Finding — genuine weakness identified in draft.** A naive "consistency
score" or letter-grade summary would be exactly the activity-based
reward mechanic Constitution §12.3 forbids. **Fix applied:** the
pattern view states only descriptive, disclosed observations (e.g. "in
6 of 8 reviewed entries following a loss, position size increased") —
never a single scored/graded output, and never framed as praise or
criticism (ZXL §8, never exciting, never dramatic).

**Reviewed (Decision Fatigue / Long-Session Usability):** does creating
a new entry impose meaningful friction that would discourage the habit
Constitution §7.2/§12.3 wants reinforced? **Finding:** no weakness — new
entry creation is a low-stakes, reversible action structurally (draftable,
editable before commit); this document does not specify a mandatory
field count, deferring exact form fields to implementation, consistent
with this package's own architecture-only scope.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Neutral entry summary (Primary) | Yes — orients without judgment | Constitution §3.3 | *Cognitive:* low. *Behavioral:* reinforces non-punitive review. *Emotional:* reflective, non-judged (ZXL §9, Trading Journal). |
| Individual entries (Secondary) | Yes — the trader's own genuine reasoning, preserved | `M4-002.2` Learning Loop §3, Record | *Cognitive:* Medium, bounded. *Behavioral:* the record's honesty depends on it being self-authored, never auto-filled. *Emotional:* neutral regardless of outcome. |
| Cross-entry pattern view | Yes, when a genuine pattern exists | Constitution §10.2 Success Criteria | *Cognitive:* moderate, opt-in. *Behavioral:* supports self-awareness without scoring (§3 fix). *Emotional:* calm, descriptive, never a grade. |
| New-entry / filter (Peripheral) | Yes | Constitution §9.6 | *Cognitive:* minimal. *Behavioral:* low-friction habit path (§3). *Emotional:* none coercive. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Neutral entry summary + entries | **Record** | The trader's own account of what was decided and why (`M4-002.2` Learning Loop §3, Record) — this screen's defining stage. |
| Cross-entry pattern view | **Reflect, Learn** | Exactly `M4-002.2` Learning Loop §3's own description: "AI-assisted analysis applied over the trader's own recorded history... patterns become knowledge." |
| New-entry creation | **Record** (enabling mechanism) | How the Record stage is initiated; not a separate stage. |

Every section maps to at least one stage — this is the screen where
Record, Reflect, and Learn are performed in full, not merely bridged
to, unlike every screen preceding it in this package.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Summary headline: `text.heading`. Entry title/instrument: `text.title`. Entry reasoning text: `text.body` (reading-width capped at 50–75 characters per D2-003 §4, since this is genuine prose, not tabular data). Pattern-view observations: `text.caption` (D2-003 §1's canonical name — never the deprecated `text.body.small` name, per `M4-003.2`'s own corrected precedent). Timestamps: `text.micro`. |
| Spacing | Primary-to-entries gap: `space.64`. Between entries: `space.24`. Entry internal (reasoning text block): `space.16`. |
| Elevation/Radius | Primary summary: Panel, `elevation.0`, no radius. Individual entries: Card, `elevation.1`, `radius.md` — **identical treatment regardless of outcome**, mirroring Portfolio's own binding constraint (`M4-006` §6). Pattern view: Card, `elevation.1`, `radius.md`. |
| Color tokens | No `signal.*` or `data.*` coloring of an entry by its own outcome (Constitution §3.3) — entries use neutral `surface`/`text` tokens exclusively; a linked position's own P/L (shown only as context, not as the entry's own headline) uses `data.positive`/`data.negative` per the same rule as Portfolio. |
| States | Loading: skeleton. Empty (no entries yet — first use): factual, states why and what a legitimate next action is (D1-002 §14.1), never "get started!" framing (D1-002 §14.2). Pattern view empty (insufficient entries for a genuine pattern): calm disclosure that no pattern is yet identifiable — never fabricated to appear populated. |
| Interaction | New entry: low-stakes to start, but the entry itself is trader-authored, never auto-completed (Constitution §4.2, explainability over automation, extended here to authorship). Filter: low-stakes, frictionless. |
| Motion | No flash/emphasis on a newly-created entry beyond `motion.duration.default` — a saved entry is a routine confirmation, not a celebratory moment (ZXL §8, never exciting). |
| Accessibility | Entry reasoning text meets the same reading-width/line-height rules as any prose content (D2-003 §2, §4); pattern-view observations announced as full sentences, not fragmented data points (mirrors `26` §3 DASH-002 precedent). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Neutral summary | `surface.base` | `text.heading` | `space.64` isolation | Panel (D2-005 §3) | Coherent-sentence summary | Read-only |
| Individual entry | `surface.raised` (identical regardless of outcome) | `text.title`, `text.body` | `space.24` between, `space.16` internal | Card (D2-005 §2) | Full-sentence reasoning text | Select → drill-in, edit |
| Cross-entry pattern view | `surface.raised`, `text.primary` (no scoring color) | `text.caption` observations | `space.16` internal | Card (D2-005 §2) | Announced as sentences | Consult only, no mutation |
| New-entry / filter | `accent.default` (interactive), `border.default` (input) | `text.body`/`text.micro` | `space.8`–`12` | Button (D2-005 §1) + Input (D2-005 §5) for entry form | Persistent visible labels | Low-stakes to start; content itself is deliberate authorship |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — non-punitive, chronological-only ordering (§3) is a
  direct, verifiable proof of Constitution §3.3.
- **Reduce stress?** Yes — no scoring/grading mechanism exists (§3);
  review is descriptive, never evaluative in tone.
- **Improve decision quality?** Yes — this is the one screen where
  genuine process patterns can be identified and acted on in future
  sessions (Reflect/Learn, §5).
- **Comfortable after 6–10 hours?** Yes — identical token set; prose
  entries specifically respect D2-003 §4's reading-width rule, avoiding
  the fatigue of an overly wide text block.
- **Strengthens Zenith philosophy?** Yes — self-authored, non-punitive
  reflection is Constitution §9.5/§9.6 realized directly.
- **Strengthens the Learning Loop?** Yes — the primary Record/Reflect/
  Learn screen in the entire product.

**Weakness identified in this pass:** two genuine risks (outcome-based
sorting, implicit scoring) were found and fixed; both are the kind of
subtle reintroduction of judgment/gamification this project has
foreclosed elsewhere, caught here before this screen's own first
specification could ship with either.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §3.2, §3.3, §7.2, §7.5, §9.5, §9.6, §10.2, §12.3
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.3
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-003` §1, §2, §4, `D2-004`, `D2-005` §1, §2, §5
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2 (Trading Journal), §7, §8
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-007`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.9, §7
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` §2.9, §2.10, Learning Loop
- `documentation/zos/M4-006_PORTFOLIO_SCREEN_DESIGN.md` (neutral-sort precedent)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
