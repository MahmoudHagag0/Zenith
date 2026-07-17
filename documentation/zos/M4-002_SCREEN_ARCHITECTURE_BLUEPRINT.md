# M4-002_SCREEN_ARCHITECTURE_BLUEPRINT

**Document ID:** ZOS-M4-002
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Architecture phase)

------------------------------------------------------------------------

# Purpose

This is the screen architecture and navigation blueprint for Zenith —
the final architectural document before visual screen design begins.
It defines **how a trader moves through Zenith**, not what any screen
looks like. It introduces no new product area, no new philosophy, and
no new psychology: every decision below is a synthesis of already-
approved sources — `24_ZENITH_PRODUCT_CONSTITUTION.md` §10 (Approved
Product Surface), `27_ZENITH_EXPERIENCE_LANGUAGE.md` §1–§2 (Attention
Hierarchy, Decision Flow), and D1-001 through D2-007. **No wireframe,
no color, no typography, no spacing, no component, no code.**

------------------------------------------------------------------------

# 1. Navigation Philosophy

**Zenith is not page-oriented. Zenith is decision-oriented.**

A page-oriented product organizes navigation around *what exists*
(Home, Reports, Settings, ...) — a trader must first figure out where
the thing they need probably lives. A decision-oriented product
organizes navigation around *what question the trader is currently
answering* — the Decision Flow already established at ZXL §2 ("Am I
decision-ready right now?" → "Why?" → "Where, specifically?" → "What
should I avoid?" → "What should I review?"). D1-005 §1 already ordered
Zenith's primary navigation by this exact sequence, not build order or
alphabetical convenience. This document extends that same principle
into every remaining navigation surface (secondary, context, utility)
rather than introducing a second, competing organizing idea.

Four binding principles follow directly:

1. **Navigation must reduce thinking, not add to it.** Every navigation
   decision is checked against D1-001 §1 (working memory is scarce) —
   a menu structure a trader must consciously parse to find something
   has already cost cognitive budget the product exists to protect
   (Constitution §12.2).
2. **Navigation must never become its own task.** ZXL Experience
   Principle 9: "the interface disappears behind decision-making."
   Wayfinding effort is a design defect, not a neutral cost of having
   multiple screens.
3. **Movement between screens must feel natural, not effortful.**
   Naturalness here is not a vibe — it is Decision Flow alignment: a
   trader moving from Dashboard to Morning Brief to Watchlist is moving
   through their own mental sequence of questions, not an arbitrary
   site map.
4. **Consistency of navigation position and behavior is a trust
   signal**, restating Constitution §5.4 and D1-005 §4.2 specifically
   for navigation: the trader is never asked to re-locate navigation
   because a given screen rearranged it.

Every subsequent section in this document exists to make these four
principles concrete and checkable, not to add new ones.

------------------------------------------------------------------------

# 2. Product Map

The nine areas Constitution §10.2 already approved — no area added,
none removed. Purpose, Primary Objective, and Emotional Objective are
carried forward from Constitution §10.2 and D1-005 §1.1 verbatim
(compressed for table form); Primary User Goal, Expected Session
Length, and Frequency of Use are this document's own synthesis, newly
stated but derived directly from each area's own already-approved
Purpose — not invented independently of it.

| Area | Purpose | Primary Objective | Emotional Objective | Primary User Goal | Expected Session Length | Frequency |
|---|---|---|---|---|---|---|
| **Dashboard / Home** | The trader's single entry point each session | Answer "am I decision-ready" in one glance | Oriented, calm | Establish current state fast | Short (under 2 min) | Every session, first screen |
| **Morning Brief** | Synthesize what changed before any chart | Reduce cognitive load at lowest-context moment | Briefed, prepared | Understand today's context | Short–Medium (2–5 min) | Once per session, at start |
| **Watchlist** | Hold the intentionally-tracked instrument set | Manage attention as a scarce resource | In control, focused | Scan tracked instruments for change | Medium (5–15 min) | Multiple times per session |
| **Portfolio** | Show current holdings and their evidentiary state | Neutral disclosure regardless of favorability | Steady, confident | Check holdings' current state | Medium (5–15 min) | Multiple times per session |
| **Alerts** | Surface a disclosed, evidence-backed condition | Respect attention; never manufacture urgency | Trusting, unburdened | Confirm nothing important was missed | Very short (seconds–1 min) | As-triggered, not scheduled |
| **Calendar / News** | Contextualize scheduled events/news | Support Analysis with attributable evidence | Informed, contextualized | Understand upcoming/recent context | Short–Medium (2–10 min) | Once or twice per session |
| **COT & Reports** | Surface institutional positioning/structured report data as disclosed evidence | Reinforce Evidence Over Signals | Grounded, discerning | Review raw institutional evidence | Medium (5–15 min) | Weekly-cadence, not daily |
| **AI Workspace** | Direct interaction with the embedded AI Assistant | Support trust/confidence via calibrated disclosure | Engaged, assured | Ask a specific question, get a traceable answer | Variable (1–20+ min) | As-needed, trader-initiated |
| **Trading Journal** | Record and review past decisions/reasoning | Neutral, non-punitive Review; reinforce Learning | Reflective, non-judged | Record or review a past decision | Medium–Long (5–20 min) | End-of-session or weekly review |

------------------------------------------------------------------------

# 3. Navigation Hierarchy

Rules only — no visual treatment (that is D2-001 through D2-005's own,
separate scope).

## 3.1 Primary Navigation

Exactly the nine areas in §2, ordered by Decision Flow (D1-005 §1, Rule
1.1) — never alphabetical, never build order. Always present, always
in the same relative position, on every screen (D1-005 §4.2). Adding a
tenth item requires Constitution §10.1's own four-field approval
process (D1-005 §1, Rule 1.2) — this document does not authorize
expansion.

## 3.2 Secondary Navigation

Within-area sub-views that do not warrant their own primary-navigation
slot (e.g., a filter or view-mode within Watchlist). Governing rule:
secondary navigation never introduces a new Decision Flow question of
its own — it narrows or filters the *same* question its parent area
already answers. Specific sub-views are not enumerated here, since none
beyond each area's own already-approved scope currently exist to
enumerate (see §11, Genuine Ambiguities, for what this leaves open).

## 3.3 Context Navigation

A link from one screen to a *specific, related* piece of information on
another screen — e.g., a Watchlist row linking to that instrument's own
reading, or a Portfolio position linking to its own Journal entries.
Governing rule: context navigation always preserves the trader's return
path (§3.7, Back Navigation) and always targets a specific, named
destination — never a bare link to "the Watchlist" or "the Journal" in
general, which would force the trader to re-orient on arrival.

## 3.4 Utility Navigation

Session-level, not product-area-level: sign-in/sign-out and equivalent
account-boundary actions. This is deliberately **not** a "Settings"
product area — no such area has been approved per Constitution §10.2,
and this document does not invent one (see §11).

## 3.5 Global Search

No cross-area search feature has been approved anywhere in Constitution,
Blueprint, or D1/D2 (see §11) — this document does not assume one
exists. If a future Sprint adds one, it must satisfy: search surfaces
evidence/instruments, never conclusions (Constitution §4.1, Evidence
Over Signals) and never ranks results to manufacture urgency (D1-002
§6).

## 3.6 Quick Actions

Reserved for a small number of already-approved, low-stakes actions
reachable without full area navigation — e.g., adding a symbol to the
Watchlist from a live instrument search (already an existing approved
capability, DEC-2026-030). Governed by D1-002 §12.1 (low-stakes,
reversible actions may be frictionless) — a Quick Action is never
introduced for a consequential action (§9 below).

## 3.7 Back Navigation

Returns the trader to their prior context exactly as they left it (same
scroll position, same filter state where applicable) — never to a
default/reset state. This directly serves working-memory conservation
(D1-001 §1): a trader should never have to reconstruct where they were.

## 3.8 Deep Navigation

The navigation-level expression of Progressive Disclosure (D1-005 §3):
reaching a deeper layer of evidence (a full Confidence breakdown, a
Provider's raw Traceability record) is always a deliberate, reachable
action from a shallower screen — never a separate primary-navigation
destination of its own, since depth is *reached from* a screen's
Primary Attention conclusion, not navigated to independently of it.

------------------------------------------------------------------------

# 4. Screen Inventory

Eleven screens: the nine approved areas (§2), the two already-
implemented screens within the combined "COT & Reports" area (see §11
for the discovered naming/scope question this reveals), and the
system-level Login screen (Utility Navigation, §3.4 — not a tenth
product area).

## 4.1 Dashboard

- **Purpose:** answer Decision Flow Q1 in one glance.
- **Entry Points:** app launch; any screen's own primary-navigation link.
- **Exit Points:** every other area (it is the hub); no screen exits *to* Dashboard exclusively — Dashboard is reachable from everywhere via Primary Navigation.
- **Dependencies:** the Confluence Engine's synthesized reading (Analysis Engine), Watchlist/Portfolio's own tracked-instrument sets.
- **Related Screens:** Morning Brief (answers Q2 immediately after), Watchlist, Portfolio.
- **Primary Actions:** none that mutate state — Dashboard is a synthesis view, not an action surface.
- **Secondary Actions:** navigate to a specific instrument's own deeper reading.
- **Information Priority:** the single decision-readiness conclusion, above all else (D1-005 §2.1).
- **Expected User State:** arriving with high cognitive capacity, low context for today specifically (Constitution §9.1).

## 4.2 Morning Brief

- **Purpose:** synthesize what changed before any chart is shown.
- **Entry Points:** Dashboard (typical first move); direct primary-navigation link.
- **Exit Points:** Watchlist/Portfolio (to review a specific mentioned instrument), AI Workspace (to ask a follow-up question).
- **Dependencies:** same Confluence Engine output as Dashboard; Calendar/News for contextual events.
- **Related Screens:** Dashboard, Calendar/News.
- **Primary Actions:** none state-mutating.
- **Secondary Actions:** drill into a specific mentioned instrument.
- **Information Priority:** the day's own synthesized narrative first, any supporting data after (Constitution §12.1).
- **Expected User State:** same as Dashboard — highest capacity, lowest context.

## 4.3 Watchlist

- **Purpose:** hold and scan the intentionally-tracked instrument set.
- **Entry Points:** Primary Navigation; Dashboard/Morning Brief drill-in.
- **Exit Points:** a specific instrument's own deeper reading (context navigation, not a separate screen currently approved); AI Workspace (ask about a specific tracked instrument).
- **Dependencies:** live Market Data (L1-001), Instrument Metadata/Search (L1-005).
- **Related Screens:** Portfolio (a tracked instrument may also be held), Alerts (a tracked instrument may have an active alert).
- **Primary Actions:** add/remove a tracked instrument.
- **Secondary Actions:** filter/sort the tracked set (Secondary Navigation, §3.2).
- **Information Priority:** the tracked set's own aggregate state first, individual rows second (D1-005 §2.2).
- **Expected User State:** actively scanning, expects to spend real time here (Medium session length, §2).

## 4.4 Portfolio

- **Purpose:** show current holdings and their evidentiary state, neutrally.
- **Entry Points:** Primary Navigation; Dashboard drill-in.
- **Exit Points:** Trading Journal (review the reasoning behind a position), a held instrument's own deeper reading.
- **Dependencies:** Positions/Transactions (S1-004), live Market Data for current valuation.
- **Related Screens:** Trading Journal, Watchlist.
- **Primary Actions:** none that mutate state (Zenith is not an execution venue, Constitution §9.4).
- **Secondary Actions:** drill into a specific position's own history.
- **Information Priority:** the portfolio's own neutral summary state first (D1-005 §2.3) — never a P&L-colored headline.
- **Expected User State:** reviewing, potentially immediately after a loss or gain — the highest-emotional-stakes screen in the product (Constitution §6.6).

## 4.5 Alerts

- **Purpose:** surface a disclosed, evidence-backed condition the trader asked to be notified about.
- **Entry Points:** Primary Navigation; a system-level notification (out of this document's scope — notification delivery is an implementation concern, not a screen).
- **Exit Points:** the specific instrument/condition the alert concerns (Watchlist or Portfolio).
- **Dependencies:** the condition's own disclosed evidence source (price, calendar event, etc.).
- **Related Screens:** Watchlist, Portfolio, Calendar/News.
- **Primary Actions:** dismiss/acknowledge.
- **Secondary Actions:** navigate to the underlying evidence.
- **Information Priority:** the disclosed condition itself — never ranked by anything but genuine relevance (Constitution §8.3).
- **Expected User State:** brief, interrupt-driven — the shortest expected session length in the product (§2).

## 4.6 Calendar / News

- **Purpose:** contextualize scheduled events and news evidence.
- **Entry Points:** Primary Navigation; Morning Brief drill-in.
- **Exit Points:** the specific instrument an event/headline concerns.
- **Dependencies:** live Calendar/News providers (L1-003).
- **Related Screens:** Morning Brief, Watchlist.
- **Primary Actions:** none state-mutating.
- **Secondary Actions:** filter by instrument/date.
- **Information Priority:** attribution and disclosed evidence first — never a bare headline presented as a conclusion (Constitution §10.2).
- **Expected User State:** consulting deliberately (Supporting Attention, ZXL §1.3) — not passively scanned by default.

## 4.7 COT (Commitments of Traders)

- **Purpose:** surface institutional futures-positioning data as disclosed, raw evidence.
- **Entry Points:** Primary Navigation (within the combined "COT & Reports" area, §11).
- **Exit Points:** the specific instrument the report concerns.
- **Dependencies:** live COT data (L1-004).
- **Related Screens:** Reports (§4.8, same approved area), Watchlist.
- **Primary Actions:** none state-mutating.
- **Secondary Actions:** filter by instrument/date range.
- **Information Priority:** raw report data, explicitly distinguished from any interpretation of it (Constitution §10.2).
- **Expected User State:** weekly-cadence review, not a daily habit (COT data itself publishes weekly, L1-004).

## 4.8 Reports

- **Purpose:** structured, periodic report data distinct from COT specifically (the same approved area's own second data type, per Constitution §10.2's "other structured report data").
- **Entry Points:** Primary Navigation (same combined area as COT).
- **Exit Points:** the specific instrument/period a report concerns.
- **Dependencies:** same evidentiary discipline as COT (§4.7) — raw data, not conclusions.
- **Related Screens:** COT.
- **Primary Actions:** none state-mutating.
- **Secondary Actions:** filter by period.
- **Information Priority:** same as COT.
- **Expected User State:** same as COT.

## 4.9 Trading Journal

- **Purpose:** record and later review the trader's own decisions and reasoning.
- **Entry Points:** Primary Navigation; Portfolio drill-in (review the reasoning behind a specific position).
- **Exit Points:** the Portfolio position or Watchlist instrument a Journal entry concerns.
- **Dependencies:** Portfolio/Position data for cross-reference.
- **Related Screens:** Portfolio.
- **Primary Actions:** create/edit a Journal entry.
- **Secondary Actions:** filter by instrument/date/outcome.
- **Information Priority:** neutral, evidence-based reflection — a losing trade reviewed with the same calm treatment as a winning one (Constitution §3.3, §7.3).
- **Expected User State:** reflective, typically end-of-session or a scheduled weekly review — the Decision Flow's own last question (ZXL §2, Q5).

## 4.10 AI Workspace

- **Purpose:** direct interaction with Zenith's embedded AI Assistant.
- **Entry Points:** Primary Navigation; a "ask about this" context link from any other screen.
- **Exit Points:** whatever screen a specific answer references (context navigation back out).
- **Dependencies:** the same Confluence Engine/reading data every other screen draws from — the Assistant does not have a private data source.
- **Related Screens:** all others, by design (it is the conversational entry point to any of them).
- **Primary Actions:** ask a question.
- **Secondary Actions:** review conversation history.
- **Information Priority:** the direct answer first, evidence/reasoning after (Constitution §11.2) — the AI Personality's own version of Story Before Chart.
- **Expected User State:** variable — could be a 30-second confirmation or a 20-minute exploratory session.

## 4.11 Login

- **Purpose:** authenticate the trader; the sole pre-session-boundary screen.
- **Entry Points:** app launch when unauthenticated; session expiry.
- **Exit Points:** Dashboard (the only destination after successful authentication — see §6, Screen Relationships, for why).
- **Dependencies:** none within the product surface — authentication only.
- **Related Screens:** none (deliberately isolated — see §6).
- **Primary Actions:** sign in.
- **Secondary Actions:** password recovery (if implemented — an auth-system detail, not a navigation-architecture concern).
- **Information Priority:** N/A — not a decision-support screen.
- **Expected User State:** brief, transactional, not a "session" in the Decision Flow sense at all.

------------------------------------------------------------------------

# 5. User Flows

Each flow states Start, Decision, Next Screen, Possible Branches, Exit.
Flows describe *navigation sequence*, not visual layout.

## 5.1 Morning Startup

- **Start:** Login (if session expired) or direct to Dashboard.
- **Decision:** "Am I decision-ready right now?" (Dashboard, Q1).
- **Next Screen:** Morning Brief (Q2 — why).
- **Branches:** if Dashboard's own answer is already sufficient, the trader may skip directly to Watchlist/Portfolio (Q3) without visiting Morning Brief — Decision Flow order is the *default* path, not a forced sequence (ZXL §2 already notes later screens may be entered directly).
- **Exit:** Watchlist, Portfolio, or Calendar/News, per whichever specific instrument/context Morning Brief surfaced.

## 5.2 Market Analysis

- **Start:** Watchlist or Portfolio.
- **Decision:** "Where, specifically, does the evidence point?" (Q3).
- **Next Screen:** a specific instrument's own deeper reading (context navigation, not a new primary screen) or Calendar/News for supporting context.
- **Branches:** AI Workspace, to ask a clarifying question about the same instrument.
- **Exit:** back to Watchlist/Portfolio (Back Navigation, §3.7), or forward to Trading Journal to record a decision.

## 5.3 Journal Workflow

- **Start:** Trading Journal (direct) or Portfolio (context link from a specific position).
- **Decision:** "What should I review or learn from?" (Q5).
- **Next Screen:** a specific past entry, or a new entry creation.
- **Branches:** back to the Portfolio position or Watchlist instrument the entry concerns.
- **Exit:** Dashboard (returning to the current-session question) or session end.

## 5.4 Trade Review

- **Start:** Portfolio (a specific position).
- **Decision:** "What is this position's own current evidentiary state?"
- **Next Screen:** Trading Journal (the reasoning behind it) or the instrument's own Watchlist/deeper-reading entry.
- **Branches:** AI Workspace, to ask about the position specifically.
- **Exit:** back to Portfolio.

## 5.5 Portfolio Review

- **Start:** Dashboard or Primary Navigation, direct.
- **Decision:** "What is my current holdings' own state, neutrally?"
- **Next Screen:** a specific position's own detail (Trade Review, §5.4).
- **Branches:** Trading Journal.
- **Exit:** Dashboard.

## 5.6 Watchlist Workflow

- **Start:** Dashboard or Primary Navigation, direct.
- **Decision:** "Which tracked instruments have a new reading?"
- **Next Screen:** a specific instrument's own deeper reading.
- **Branches:** add/remove a tracked instrument (Quick Action, §3.6); AI Workspace.
- **Exit:** Dashboard, or the specific instrument's own context.

## 5.7 News Workflow

- **Start:** Morning Brief (typical) or Primary Navigation, direct.
- **Decision:** "Is there a disclosed event relevant to a tracked/held instrument?"
- **Next Screen:** the specific instrument the event concerns (Watchlist/Portfolio).
- **Branches:** none further — Calendar/News is explicitly a Supporting-Attention, evidence-only screen (Constitution §10.2), not a hub of its own.
- **Exit:** the specific instrument's own screen.

## 5.8 AI Workflow

- **Start:** AI Workspace (direct) or a context "ask about this" link from any other screen.
- **Decision:** whatever specific question the trader brings.
- **Next Screen:** N/A — the Assistant answers in place.
- **Branches:** navigate to whatever evidence source the answer cites (any screen).
- **Exit:** back to the originating screen (if entered via context link) or Dashboard.

## 5.9 Account/Session Utility (the requested "Settings workflow," resolved — see §11)

- **Start:** Utility Navigation (§3.4), any screen.
- **Decision:** N/A — not a Decision Flow question; a session-boundary action.
- **Next Screen:** Login (on sign-out or session expiry).
- **Branches:** none.
- **Exit:** Login screen, ending the session.

------------------------------------------------------------------------

# 6. Screen Relationships

**Which screens feed others:** Dashboard synthesizes from every other
area's own underlying data without duplicating their screens (it is a
synthesis, not a router). Morning Brief and Calendar/News feed context
into Watchlist/Portfolio decisions. Portfolio feeds Trading Journal
(a position's own history is the raw material for a Journal entry
about it).

**Which screens consume data without owning it:** AI Workspace consumes
the same Confluence Engine output every other screen does — it has no
private data source, so it can never assert something no other screen
could also show, preserving Constitution §11.4 (no undisclosed
confidence).

**Which screens should never directly link:**

- **Portfolio → any execution surface.** Zenith is not an execution
  venue (Constitution §9.4, §10.2) — there is no "buy/sell" screen for
  Portfolio to link to, and none should ever be added without its own
  separate, explicit leadership approval (a business-model change, not
  a navigation one).
- **Alerts → anything implying the trader must act immediately.**
  Alerts links to evidence, never to an action screen framed with time
  pressure (D1-002 §6, Anti-Urgency) — an Alert is a disclosure, not a
  prompt.
- **Login → anything but Dashboard.** Login is deliberately isolated
  (§4.11) — it never deep-links to a specific pre-session destination,
  since doing so would make authentication itself feel like part of a
  Decision Flow question rather than a boundary before one.
- **COT/Reports → a conclusion.** These screens present raw evidence
  only (Constitution §10.2) — they never link onward to an "AI
  interpretation of this" in a way that would make the raw-data screen
  itself look like it was leading toward a conclusion, which would
  violate Evidence Over Signals' own distinction between disclosure and
  interpretation.

------------------------------------------------------------------------

# 7. Screen Categories

| Category | Screens | Why |
|---|---|---|
| **Decision** | Dashboard | The one screen whose entire purpose is answering "am I decision-ready" — Constitution §10.2's own Dashboard Success Criteria. |
| **Analysis** | Morning Brief, Watchlist | Both exist to build the trader's own understanding before/around a decision, not to record or converse. |
| **Recording** | Trading Journal | The only screen whose primary action creates a persistent record of the trader's own reasoning. |
| **Monitoring** | Alerts, Portfolio | Both are passive-disclosure screens the trader checks against an existing state (a condition, a holding) rather than actively builds new understanding on. |
| **Configuration** | *(none currently approved — see §11)* | No product area matching this category exists in Constitution §10.2. |
| **Conversation** | AI Workspace | The sole direct-interaction, natural-language surface. |
| **Reference** | Calendar/News, COT, Reports | All three are explicitly raw, attributable evidence — Constitution §10.2 names this exact distinction for Calendar/News and COT & Reports alike. |

Login does not fit any category above — it is a system/authentication
boundary, not a Decision Flow screen, and is deliberately left
uncategorized rather than force-fit.

------------------------------------------------------------------------

# 8. Dashboard Position

**Why Dashboard is the platform center:** it is the only screen whose
entire, sole Success Criteria (Constitution §10.2) is answering the
Decision Flow's own first and most fundamental question. Every other
screen answers a *later* question (§2's own Primary User Goal column
makes this explicit) — Dashboard is structurally first because the
Decision Flow itself is sequential (ZXL §2), not because of any layout
convention. This is an architectural fact, not a design preference: a
product organized around helping a trader reason well *must* have
exactly one screen that answers "where do I stand" before any other
question can be meaningfully asked.

**What Dashboard must never become:**

1. **A raw data dump.** Its purpose is synthesis (Constitution §10.2),
   not volume — adding "more visible information" to Dashboard directly
   contradicts its own approved Success Criteria.
2. **A customizable widget board.** Zenith's Product DNA (Constitution
   §3) treats premature customization as scope creep; a
   trader-configurable Dashboard shifts the burden of deciding what
   matters back onto the trader, which is precisely the burden
   Dashboard exists to remove (Constitution §6.1, §12.2).
3. **A second Watchlist or Portfolio.** Dashboard references, but never
   duplicates, those screens' own detail — duplication would create two
   sources of truth for the same evidence, undermining Constitution
   §5.4 (consistency as trust).
4. **An execution surface.** Same boundary as §6 above — Dashboard
   synthesizes evidence, it does not offer a "trade now" action, which
   would misrepresent Zenith's own product identity (Constitution §3.1).

No widget, no layout, and no visual weight is specified for Dashboard
here — that is D2-005/future component-spec work, explicitly out of
this document's scope.

------------------------------------------------------------------------

# 9. Navigation Psychology

Restates already-approved D1/D2 psychological principles as navigation-
specific consequences — no new claim is made here.

- **Reducing Stress:** a fixed, predictable navigation position and
  order (§1, §3.1) removes the low-grade anxiety of "where do I go for
  this" (ZXL §4.1) — the same mechanism Constitution §5.2's Calm
  Interface Philosophy already names for visual design applies
  identically to navigation structure.
- **Reducing Context Switching:** Context Navigation (§3.3) always
  targets a specific destination and always preserves a return path
  (§3.7) — a trader is never dropped into an unfamiliar area with no
  sense of how they got there or how to get back, which is itself a
  context-switching cost (D1-001 §2, selective attention).
- **Reducing Decision Fatigue:** navigation order matches the Decision
  Flow's own natural sequence (§1), so choosing "where to go next" is
  rarely a real decision at all — it is usually just the next question
  the trader was already going to ask (ZXL §2's own justification for
  Attention Hierarchy ordering).
- **Reducing Working Memory Load:** a fixed, small (nine-area) Primary
  Navigation is well within the ~4-chunk active-working-memory ceiling
  D1-001 §1 cites (Cowan, 2001) — a trader does not need to hold an
  unbounded site map in mind.
- **Reducing Attention Fragmentation:** exactly one screen (Dashboard)
  answers Q1, exactly one Primary Attention element exists per screen
  (D1-002 §1.1) — navigation never asks a trader to divide attention
  across multiple simultaneously-competing destinations.

------------------------------------------------------------------------

# 10. Future Scalability

A new module (a tenth product area) is added without redesigning
navigation because three things are already true by construction, not
by exception:

1. **Ordering is derived, not fixed by position.** Primary Navigation's
   order comes from the Decision Flow (§1, §3.1) — a new area is placed
   wherever its own natural question falls in that sequence (mirroring
   how ZXL §2 already notes a screen's own Decision Flow entry point can
   differ from Dashboard's), never appended at the end by default.
2. **Every new area reuses an existing Screen Archetype.** D1-005 §2
   already defines four reusable structural patterns (Synthesis, List/
   Tracking, Record/Detail, Conversational) that any new area maps onto
   — a new module does not require a fifth pattern to be invented before
   it can be built.
3. **Expansion itself is already gated, not open.** D1-005 §1 Rule 1.2
   and Constitution §10.3 both already require a new area's own
   Constitution §10.1 four-field statement and leadership approval
   before it may appear in navigation at all — this document does not
   change that gate, it confirms navigation architecture does not need
   to change *because of* that gate being exercised.

The practical consequence: adding module ten is a Product/Constitution-
level decision (where does it sit in the Decision Flow, which
Archetype does it use) rather than a navigation-engineering redesign.

------------------------------------------------------------------------

# 11. Genuine Ambiguities Discovered

Stated explicitly rather than silently resolved, per this project's own
standing discipline of escalating real ambiguity instead of guessing:

1. **"COT & Reports" is one approved area but two implemented screens**
   (`/cot`, `/reports`) with no document formally splitting them. This
   blueprint treats them as two screens within one area (§4.7–4.8), but
   whether "Reports" should instead be its own tenth approved area (with
   its own Constitution §10.1 statement) is a leadership question this
   document does not have the authority to resolve on its own.
2. **"Settings" is not an approved product area**, but this task's own
   example flow list named a "Settings workflow." No Settings screen
   exists in the implemented product surface. This blueprint resolves
   the gap conservatively: §5.9 describes only the already-implemented
   session/account boundary (sign-in/out), explicitly not a preferences/
   configuration area, which would require its own approval before any
   screen could be built for it.
3. **Global Search and a general "Quick Actions" surface are not
   approved features anywhere** in Constitution, Blueprint, or D1/D2 —
   §3.5–3.6 state governing principles *if* they are ever built, without
   assuming they currently exist or are planned.
4. **D2-001 through D2-007 (the Design System package) are approved by
   review but not yet merged to `main`** as of this document's own
   drafting — this blueprint cites them as authoritative per this
   task's own explicit instruction to use them as input, but the
   discrepancy is noted for completeness.
5. **`08_ROADMAP.md` has no M4 entry at all** — Milestone M4 (Design
   Foundation) is not yet tracked in the Roadmap the way M1–M3 were.
   Not fixed here (out of this document's own stated scope: one
   document, screen architecture only), but noted since a future
   reconciliation pass will need it.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §9, §10, §12
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` §1, §2, §9, §10
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §1, §2, §10
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §1, §6, §12
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` (primary structural input throughout)
- `documentation/zos/D2-001_DESIGN_TOKENS.md` through `D2-007_ACCESSIBILITY_GUIDE.md` (cited for psychology/behavior principles only — no token, color, or spacing value referenced)
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md`
