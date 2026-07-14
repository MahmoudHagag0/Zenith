# 27_ZENITH_EXPERIENCE_LANGUAGE

**Document ID:** ZOS-027
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)

------------------------------------------------------------------------

# Purpose

This is the Zenith Experience Language (ZXL) — the document that sits
**above** every implementation specification (e.g.
`26_DASHBOARD_HOME_SPECIFICATION.md`) and **below** the Product
Constitution (`24_ZENITH_PRODUCT_CONSTITUTION.md`). It does not
redesign, restate, or extend either. It exists to answer a question
neither of those documents was written to answer directly: not *what*
Zenith is (Constitution), not *how it is structurally composed*
(Blueprint, Specifications), but **how a trader should psychologically
experience it, moment to moment, screen to screen.**

Every claim below is a translation of an already-approved Constitution
principle into the language of lived experience — attention, calm,
trust, relief, restraint. Nothing here is a new philosophy. Where a
genuinely new experiential judgment call is required and no prior
document resolves it, this document says `TODO` rather than inventing
one, exactly as `24_ZENITH_PRODUCT_CONSTITUTION.md` and
`26_DASHBOARD_HOME_SPECIFICATION.md` both did before it.

This document carries **no visual design, no wireframe, no mockup, no
color, no spacing, no pixel value, and no new feature.** It contains no
instruction that could be implemented directly as code. Its output is a
governing reference: every future screen specification, and every
future visual design built from one, must be checked against it, the
same way every screen specification is already checked against the
Constitution (`24_ZENITH_PRODUCT_CONSTITUTION.md` §15.4).

# Scope Boundary

This document does not modify `24_ZENITH_PRODUCT_CONSTITUTION.md`,
`25_PRODUCT_BLUEPRINT.md`, or `26_DASHBOARD_HOME_SPECIFICATION.md` in
any way — each remains exactly as approved. ZXL's own relationship to
them is strictly interpretive and additive:

- The **Constitution** establishes *why* (Trader Psychology §6, Human
  Behavior Principles §7, Visual Psychology §8, Decision Philosophy
  §12, Product Rules §13, Design Constitution §14).
- The **Blueprint** and **screen specifications** establish *what is
  built and in what structure* (components, data flow, dependencies).
- **ZXL** establishes *how it should feel to use* — the missing middle
  layer between permanent philosophy and buildable structure. A future
  visual designer reads ZXL to know what psychological outcome their
  design must produce; ZXL does not tell them what that design looks
  like.

Where this document maps its own experiential concepts onto
already-named components (e.g. `DASH-002`), it cites the component ID
as an example of where the principle already applies — it does not
redefine, rename, or restructure that component. `26_DASHBOARD_HOME_SPECIFICATION.md`
remains the sole authority on Dashboard's own component architecture.

------------------------------------------------------------------------

# 1. Attention Hierarchy

Attention, in Zenith's experience vocabulary, is not the same axis as
engineering priority (`P0`/`P1`/`P2` in `25_PRODUCT_BLUEPRINT.md` §8 and
`26_DASHBOARD_HOME_SPECIFICATION.md` §2). Priority governs *what gets
built first*. Attention Hierarchy governs *what a trader's mind
engages with first, second, and last, on a screen that is already
built* — a psychological ordering, not a construction schedule. The two
usually agree (§10, Experience Principle 3) but are not the same
concept, and a future designer must not assume a P0 component is
automatically the highest Attention level on every screen it appears on.

Four attention levels, adapted from the selective-attention research
already cited at Constitution §6.4 and the eye-movement research at
§8.2:

## 1.1 Primary Attention

The single element a trader's mind engages with first and most fully.
There is exactly one Primary element per screen — never zero, never
two competing for the position simultaneously (Constitution §6.4,
§8.1; Design Constitution rule 6). On Dashboard, this is the
psychological role Decision Readiness Summary (`DASH-002`) exists to
fill (`26_DASHBOARD_HOME_SPECIFICATION.md` §3, DASH-002).

## 1.2 Secondary Attention

Elements a trader engages with once the Primary question is answered —
they support or extend the Primary conclusion, never compete with it
for the first moment of attention. A trader should be able to name the
Primary element before recalling any Secondary one.

## 1.3 Supporting Attention

Elements present for context or confirmation, consulted deliberately
rather than noticed passively — the trader must choose to look, the
screen must not compete for that look on its own. Confidence and
uncertainty disclosure (`DASH-003`) sits here relative to whatever
reading it accompanies (`26_DASHBOARD_HOME_SPECIFICATION.md` §3,
DASH-003, Information Priority) — it discloses, it never competes
(Constitution §8.1).

## 1.4 Peripheral Attention

Present, available, but not asking to be noticed at all in the current
moment — reachable, not intrusive. Entry points into areas not central
to the trader's immediate question (e.g. the Placeholder entries,
`DASH-007`–`DASH-011`) live here by construction.

`TODO`: no prior document specifies whether a fifth level (fully
hidden until requested) is needed as distinct from Peripheral — this is
a genuine open question left for the next screen specification to
surface if it recurs.

------------------------------------------------------------------------

# 2. Decision Flow

The natural, sequential order of questions a trader's mind actually
asks after opening Zenith — not a menu, not a navigation structure, a
*mental* sequence Zenith's own information order should follow rather
than interrupt (Constitution §9, User Journey Philosophy; §12.1, Story
Before Chart).

1. **Am I decision-ready right now?** — the question Dashboard's own
   Success Criteria exists to answer in one glance
   (Constitution §10.2, Dashboard/Home).
2. **Why?** — the evidence and interpretation behind that readiness
   state, never asserted without being traceable (Constitution §4.1,
   §12.1).
3. **Where, specifically?** — which instrument, which reading, ranked
   by decision relevance, not recency or visual drama (Constitution
   §8.3).
4. **What should I avoid, or what don't we know?** — disclosed
   limitations and uncertainty, given equal prominence to the
   readiness statement itself, never appended as an afterthought
   (Constitution §6.3, §12.7).
5. **What should I review or learn from?** — the trader's own past
   decisions and process, consulted only after the present question is
   resolved, never competing with it for the same attention
   (Constitution §9.5, §9.6).

This order is why Decision Readiness (question 1) is Primary Attention
(§1.1) and Journal/Learning-oriented entries are Secondary or
Peripheral (§1.2, §1.4) on Dashboard specifically — the Decision Flow
is the psychological justification for the Attention Hierarchy's own
ordering, not an independent claim. A future screen whose own natural
question sequence differs (e.g. Morning Brief's own sequence begins at
question 2, since Dashboard has already answered question 1) is
expected to reorder Attention accordingly in its own future
specification — Decision Flow is a *method* for deriving a screen's
Attention Hierarchy, not a fixed universal sequence identical on every
screen.

------------------------------------------------------------------------

# 3. Cognitive Load Rules

## 3.1 Maximum Simultaneous Information Density

Working memory reliably holds only a small number of discrete,
actively-manipulated items at once — classically cited around seven,
narrowed by later work toward roughly four for information genuinely
being reasoned about rather than passively held (Constitution §6.1,
citing Miller 1956 and Cowan 2001). ZXL's experiential rule: **no
screen should require a trader to actively hold more than a small
handful of independent facts in mind at once to answer the Decision
Flow's own first question (§2.1).** This is a density ceiling on
*actively-reasoned* information, not a hard count of visible UI
elements — a screen may display more than that if only one or two
items are Primary/Secondary (§1) and the rest are Supporting or
Peripheral, consulted rather than held.

## 3.2 Progressive Disclosure Philosophy

Detail is revealed in the order a trader would ask for it (§2), not in
the order it was computed. The first view of any screen answers the
Primary question only; every subsequent layer of detail (the specific
evidence behind a reading, its own Traceability record, a Provider's
own raw output) is reached by a deliberate action, never delivered
unrequested alongside the Primary conclusion. This is the experiential
form of Constitution §12.1 (Story Before Chart) and §12.5 (Evidence
Precedes Visualization) applied to information density generally, not
only to charts.

## 3.3 When Information Should Stay Hidden

Information stays hidden by default when it does not change the
trader's own answer to the current Decision Flow question (§2) they are
on. A Confidence value's own full four-part breakdown (Constitution
§6.5) need not be visible until the trader asks "why this confidence
specifically" — its summary form (§1.3, Supporting Attention) is
sufficient until then.

## 3.4 When Information Deserves Focus

Information earns Primary or Secondary Attention (§1.1, §1.2) only when
it is the single most decision-relevant fact currently available
(Constitution §8.3) — never because it is newest, most dramatic, or
most recently computed. A genuinely urgent, high-relevance reading
still earns focus through relevance alone, disclosed calmly (§4) — not
through visual alarm.

------------------------------------------------------------------------

# 4. Calm Interface Principles

Directly extending Constitution §5.2 (Calm Interface Philosophy) and
§6.6 (Emotional Control) into concrete experiential terms.

## 4.1 What Makes a Trader Feel Calm

- Knowing, at a glance, which single thing deserves their attention
  right now (§1.1) — ambiguity about where to look is itself a source
  of low-grade anxiety.
- A screen that reads the same way, in the same tone, regardless of
  whether the underlying evidence is favorable or unfavorable
  (Constitution §7.3, §3.3) — nothing about the *product's own manner*
  changes with market conditions, even when the content it discloses
  does.
- Being told plainly what is not known, rather than sensing an
  unstated gap (Constitution §6.3, §12.7) — disclosed uncertainty is
  calming; suspected but unstated uncertainty is not.

## 4.2 What Creates Anxiety

- **Unexpected movement** — any element shifting position, appearing,
  or resizing without the trader having caused it (Constitution §8.7,
  Motion Philosophy; §5.2).
- **Visual noise** — more simultaneously-competing elements than the
  Cognitive Load ceiling (§3.1) allows for the question currently being
  answered.
- **Competition between components** — two elements each behaving as
  if they were Primary Attention (§1.1) at once, forcing the trader to
  adjudicate between them instead of the product having already done so.
- **Too many priorities at once** — being asked to hold open more than
  one live decision thread simultaneously (§3.1), which is a direct
  cause of decision fatigue (Constitution §6.2), not merely an
  aesthetic complaint.
- **Urgency the evidence does not itself support** — language or motion
  implying time pressure disproportionate to the underlying disclosed
  evidence (Constitution §5.2, §11.1; Design Constitution rule 7).

## 4.3 What Should Never Happen

- A reading changing its own displayed value or ranking without a
  visible, attributable cause the trader can trace (Constitution
  §4.1) — an update must always be explicable, never a silent shift.
- Any element competing with the current Primary Attention item (§1.1)
  for the trader's first glance.
- A losing position, or a "no clear opportunity" reading, rendered with
  any less calm, less complete, or more diminished treatment than a
  favorable one (Constitution §3.3, §7.3, §12.4).

------------------------------------------------------------------------

# 5. Visual Weight Philosophy

This section defines *what* deserves visual weight, never a specific
size, color, or contrast value — those remain Product Leadership's own
future visual-design deliverable, per Design Constitution rule 6
(Constitution §14).

## 5.1 What Deserves Stronger Weight

The one fact, per screen, that most changes the trader's own answer to
their current Decision Flow question (§2, §8.3) deserves the strongest
weight available on that screen. Weight is earned by decision
relevance alone — never by how recently something was computed, how
large the underlying number is, or how visually striking the
underlying data happens to be (Constitution §8.3).

## 5.2 What Deserves Weaker Weight

Everything that supports, contextualizes, or discloses a limitation on
the strongest-weight element (§5.1) deserves weight proportional to how
directly a trader would need it to *change* their answer, not their
mere interest in it. A Confidence explanation (`DASH-003`) is
important, but its role is disclosure, not competition — it is
weighted to be *found*, not to be *seen first* (§1.3).

## 5.3 When Visual Silence Is More Valuable Than Emphasis

Deliberate visual quiet — the *absence* of additional weighted
elements — is itself a design decision with its own value, not empty
space to be filled (Constitution §8.6, Whitespace; §5.1, Clarity Over
Decoration). Visual silence is more valuable than emphasis specifically
when:

- the Primary element (§1.1) has already been given the screen's own
  strongest weight, and any further weighted element would only dilute
  it (Constitution §6.4, attention as a scarce, sequential resource);
- the underlying evidentiary state is genuinely quiet (a "no clear
  opportunity" reading, Constitution §12.4) — emphasis here would
  misrepresent a calm, legitimate outcome as one requiring urgent
  attention, precisely the failure Constitution §3.3 forecloses.

------------------------------------------------------------------------

# 6. Trust Building

## 6.1 How Zenith Earns Trust

Trust accrues slowly, through consistent, calibrated disclosure over
many sessions, and can be lost quickly through a single instance of
overstated confidence later proven wrong (Constitution §6.3, citing
Lee & See's trust-in-automation research). Zenith's experiential
obligation, session after session, is therefore *consistency of
honesty* — the same disclosure discipline whether the reading is
favorable, unfavorable, or absent — rather than any single moment of
persuasion.

## 6.2 Why Evidence Appears Before Conclusions

A conclusion shown before its own evidence anchors the trader's
impression to the conclusion first, making any subsequently-revealed
limitation feel like a walk-back rather than an honest, complete
disclosure from the start (Constitution §12.1, §12.5, citing
confirmation-bias research). Presenting evidence first means the
eventual conclusion is experienced as something the trader arrived at
*with* Zenith, not something Zenith asserted *at* them.

## 6.3 Why Uncertainty Must Always Be Visible

An uncertainty note that exists but is easy to miss functions, in the
trader's own lived experience, identically to no disclosure at all —
trust-calibration research shows people calibrate reliance on what they
actually notice being disclosed, not on what is merely technically
present somewhere in the interface (Constitution §12.7, §6.3). Making
uncertainty structurally as visible as confidence (Design Constitution
rule 8) is not a courtesy; it is the mechanism by which disclosed
Confidence actually protects the trader rather than merely existing in
the data model.

## 6.4 Why Honesty Increases Long-Term Confidence

A trader who observes Zenith disclose a low-confidence reading
honestly, correctly, and repeatedly over time develops *calibrated*
trust — confidence in the product's own honesty, not in any single
prediction (Constitution §2.2, §6.3). This is the opposite experience
of a product that always sounds certain: that produces brittle trust,
destroyed the first time reality diverges from an overstated claim.
Zenith's own long-term trust position depends on never spending
short-term persuasiveness against long-term calibrated confidence.

------------------------------------------------------------------------

# 7. Decision Psychology

Zenith reduces five specific failure modes, each already named
somewhere in the Constitution — this section states *how the
experience itself* achieves the reduction, not new psychological claims.

## 7.1 FOMO (Fear of Missing Out)

Reduced by never manufacturing urgency the underlying evidence does
not support (Constitution §5.2, §11.1; Design Constitution rule 7) and
by never using variable, unpredictable reward mechanics that create a
compulsion to keep checking (Constitution §7.5, citing Skinner's
variable-ratio reinforcement research). A trader should never feel
that stepping away risks missing something Zenith would otherwise have
withheld from a calm, complete disclosure.

## 7.2 Decision Fatigue

Reduced by never requiring re-orientation the trader has already done
(Constitution §6.2) — a screen should never make the tenth decision of
a session cost more attention than the first because of redundant
re-reading, per the Cognitive Load Rules (§3). Reducing decision fatigue
is a *product* obligation, not a claim that Zenith can eliminate
fatigue's own underlying cause (Constitution §6.2 explicitly declines
to depend on ego-depletion's contested mechanism).

## 7.3 Analysis Paralysis

Reduced by Story Before Chart and Progressive Disclosure (§3.2,
Constitution §12.1) — a trader is given a synthesized answer to their
Primary question first, with further evidentiary depth reachable only
as needed, rather than being handed the full evidentiary base at once
and left to build the synthesis themselves.

## 7.4 Overconfidence

Reduced by the four-part Confidence taxonomy never being collapsed
into one undifferentiated number (Constitution §6.5, §12.6) — a
trader who cannot tell a strong pattern-match from a strong
regime-context is a trader at risk of overconfidence in a reading
Zenith itself never claimed with that level of certainty. Explaining
*which* confidence and *why* (§6.3 above) is the direct experiential
countermeasure.

## 7.5 Revenge Trading

Reduced by presenting a losing position's own evidence with the exact
same calm, undramatized treatment as a winning one (Constitution §3.3,
§7.3, §5.2) — nothing in Zenith's own presentation should introduce or
amplify the emotional charge (frustration, urgency to "make it back")
that precedes a revenge trade. Zenith's obligation is neutrality at the
exact moment a trader's own emotional state is least neutral
(Constitution §6.6).

None of the above is achieved by adding emotional language, warnings, or
persuasive framing — each is achieved by *removing* the specific
mechanism (manufactured urgency, undifferentiated confidence, unequal
treatment of losses) that would otherwise produce it. This is
consistent with Constitution §11.5 (Warnings delivered factually,
without dramatization) applied beyond the AI Assistant to the product
experience as a whole.

------------------------------------------------------------------------

# 8. Language Philosophy

This section extends Constitution §11 (AI Personality)'s own tone
principles — originally scoped to the embedded AI Assistant — to
**all Zenith product language**: labels, empty states, error states,
and any other written copy a trader reads anywhere in the product. §11
itself is not amended; this section states that its tone discipline is
not exclusive to the AI Assistant's own conversational surface.

- **Never exciting.** No copy is written to generate enthusiasm about a
  reading. A strong reading is stated with the same plainness as a weak
  one (Constitution §3.3, §5.2).
- **Never dramatic.** No copy amplifies stakes beyond what the
  disclosed evidence itself supports (Constitution §11.1, §11.5).
- **Never persuasive.** Copy states what is disclosed; it does not
  argue for a particular action, including the action of continuing to
  use the product (Constitution §3.1, §3.2 — Zenith is not an automated
  advisor).
- **Never predictive.** Copy never asserts what will happen, only what
  the evidence currently shows and how confident that reading is
  (Constitution §4.3, Process Over Prediction).
- **Always calm.** The same measured register regardless of whether the
  underlying market condition is calm or volatile (Constitution §5.2,
  §11.1).
- **Always evidence-based.** Every stated claim is traceable to
  disclosed evidence; copy never implies more than the evidence
  supports (Constitution §4.1, §12.6).
- **Always professional.** The register of a competent analyst
  briefing a colleague, not a consumer app or a marketing surface
  (Constitution §2.1, Mission).

`TODO`: a full Zenith Voice & Tone style guide (specific word choices,
sentence-length conventions, terminology consistency) is a natural
future artifact once real screen copy exists to test these principles
against — this section states the philosophy the guide must encode,
not the guide itself, mirroring how Constitution §3.4 deferred its own
Feature Acceptance Checklist.

------------------------------------------------------------------------

# 9. Component Psychology

This section states the *psychological* purpose of each already-approved
Dashboard-facing area — not a widget definition (that remains
`26_DASHBOARD_HOME_SPECIFICATION.md`'s own authority) — answering, for
each: why it exists psychologically, what emotional state it should
create, and what mistake it prevents.

## 9.1 Decision Center (Decision Readiness Summary, `DASH-002`)

- **Why it exists psychologically:** to end the trader's own need to
  mentally synthesize multiple screens before knowing where they
  stand (Constitution §10.2, Dashboard/Home Success Criteria).
- **Emotional state it should create:** oriented and settled — the
  feeling of having been met with an answer, not handed a pile of
  material to sort through (§2, Decision Flow question 1).
- **Mistake it prevents:** the trader manually stitching together
  Watchlist, Portfolio, and Morning Brief themselves and arriving at an
  incomplete or inconsistent picture — or worse, acting on whichever of
  those screens they happened to check first.

## 9.2 Morning Brief

- **Why it exists psychologically:** to meet the trader at the moment
  their cognitive capacity is highest but their context for *today
  specifically* is lowest (Constitution §9.1), with synthesis rather
  than volume.
- **Emotional state it should create:** briefed, not overwhelmed — the
  feeling of arriving at a decision already partially informed, the way
  a professional analyst starts a session with a summary, not a raw
  data dump.
- **Mistake it prevents:** starting the session by scanning raw charts
  or headlines first, which invites confirmation bias to shape
  interpretation before any disclosed evidence has been considered
  (Constitution §12.1).

## 9.3 Watchlist

- **Why it exists psychologically:** to make a trader's own attention
  allocation intentional rather than unbounded (Constitution §10.2,
  Watchlist Psychological Objective; §6.4).
- **Emotional state it should create:** in control of a deliberately
  curated set, not anxious about instruments not being tracked at all.
- **Mistake it prevents:** compulsive, unbounded attention-seeking
  across every possible instrument, which both degrades decision quality
  (Constitution §6.1, Cognitive Load) and has no natural stopping point.

## 9.4 Portfolio

- **Why it exists psychologically:** to give the trader's own current
  holdings a calm, neutral system of record, independent of whether
  those holdings are currently winning or losing (Constitution §10.2,
  Portfolio Psychological Objective; §7.3).
- **Emotional state it should create:** steady — reviewing a losing
  position should feel the same, in tone, as reviewing a winning one.
- **Mistake it prevents:** the disposition effect's own behavioral
  pattern (holding losers too long, selling winners too early) being
  reinforced or amplified by a product that visually dramatizes losses
  more than gains (Constitution §7.3, citing Shefrin & Statman).

`TODO`: the remaining five approved areas (Trading Journal, AI
Workspace, Alerts, Calendar/News, COT & Reports) each already have a
Psychological Objective stated at Constitution §10.2; their own
Component Psychology entries are deferred to this document's own future
minor-version update once each area's own implementation specification
(mirroring `26_DASHBOARD_HOME_SPECIFICATION.md`) is underway, per
`25_PRODUCT_BLUEPRINT.md` §10's own Implementation Order — writing them
now, ahead of any specification for those areas, would risk anticipating
detail this document's own governing instruction asks it not to invent.

------------------------------------------------------------------------

# 10. Experience Principles

Immutable, citation-grounded principles. Every future screen
specification and every future visual design must be checked against
these, the same way every screen specification is already checked
against the Constitution.

1. **One priority at a time.** Exactly one Primary Attention element
   per screen (§1.1; Constitution §6.4, §8.1).
2. **Evidence before visualization.** No visual element renders a
   conclusion whose evidence has not already been disclosed
   (Constitution §12.5, §4.1).
3. **Attention and engineering priority usually agree, but are not the
   same axis** — a screen's Attention Hierarchy is derived from its own
   Decision Flow (§2), not copied automatically from its build-order
   priority (§1).
4. **Silence is valuable.** The absence of a weighted element is a
   deliberate design choice, not an omission (§5.3; Constitution §8.6).
5. **No component competes with another for the first glance.** Only
   one element may occupy Primary Attention at a time (§1.1, §4.2).
6. **No artificial urgency.** Nothing in the experience implies time
   pressure the disclosed evidence does not itself support (Constitution
   §5.2, §11.1; Design Constitution rule 7).
7. **Respect trader attention as a scarce, sequential resource.**
   Never assume divided or simultaneous full attention across multiple
   elements (Constitution §6.4).
8. **Information must earn visibility.** Nothing is surfaced at the
   Primary or Secondary level (§1.1, §1.2) unless it changes the
   trader's own current answer (§3.4; Constitution §8.3).
9. **The interface disappears behind decision-making.** The trader's
   own experience should be of reasoning about markets, not of
   operating software — every element that draws attention to itself
   rather than to the evidence it carries has failed its own purpose
   (Constitution §5.1, Clarity Over Decoration).
10. **A losing position and a "no trade" outcome are experienced with
    the same calm as a winning one.** No visual, verbal, or motion
    treatment may differ in tone based on favorability (Constitution
    §3.3, §7.3, §12.4).
11. **Confidence and uncertainty are always paired, and always equally
    visible.** Neither is ever disclosed without the other (Constitution
    §6.3, §12.6, §12.7; Design Constitution rule 8).
12. **Consistency is a trust signal, not a style preference.** The same
    concept must look and read identically everywhere it recurs
    (Constitution §5.4, §8.4).
13. **Motion communicates cause, never urgency.** Any change a trader
    did not directly cause must be attributable and calm, never
    startling (Constitution §8.7, §4.2 above).
14. **Progressive disclosure is the default, not the exception.** Depth
    is reached deliberately; it is never delivered unrequested
    alongside a Primary conclusion (§3.2; Constitution §12.1).
15. **Language never persuades, dramatizes, or predicts.** Every word
    a trader reads follows the Language Philosophy (§8) regardless of
    which screen or state it appears in.

`TODO`: whether further principles are needed beyond these fifteen is
left open for revision once Watchlist, Portfolio, and Morning Brief
each have their own implementation specifications and can be checked
against this list for gaps, per this document's own §16-style amendment
process (mirroring Constitution §16, formally established only if
Product Leadership approves this document with that governance
structure attached — not assumed here).

------------------------------------------------------------------------

# Engineering Observations & Recommendations (Non-Binding)

This section is advisory only. No observation below modifies this
document, any approved document, architecture, product decision, or
roadmap. Each requires its own explicit leadership approval before any
action is taken.

## Observation 1 — ZXL should be added as a mandatory citation in every future screen specification's own §1 (Governing Inputs)

- **Observation:** `26_DASHBOARD_HOME_SPECIFICATION.md` §1 cites the
  Constitution and Design Constitution directly; it predates ZXL and so
  could not cite it.
- **Technical Reasoning:** future specifications (Watchlist, Portfolio,
  Morning Brief) will need to derive their own Attention Hierarchy (§1)
  and Component Psychology (§9) from ZXL the same way Dashboard's own
  spec derived its Component Hierarchy from the Constitution and
  Blueprint.
- **Expected Benefits:** ensures every future specification's own
  component-priority reasoning is explicitly checked against ZXL,
  rather than each engineer re-deriving experiential reasoning ad hoc.
- **Possible Risks:** none identified; this is a process addition, not
  a content change to any existing document.
- **Estimated Impact:** Medium — a governance/process consistency gain.
- **Recommendation Priority:** **Medium.**

## Observation 2 — A dedicated Attention Hierarchy field is a candidate addition to the per-component specification template

- **Observation:** `26_DASHBOARD_HOME_SPECIFICATION.md`'s own 15-field
  component template includes "Information Priority" but does not
  distinguish it explicitly from engineering build-priority (§1's own
  disambiguation above did not yet exist when that template was used).
- **Technical Reasoning:** future component specifications could
  benefit from stating Attention Level (Primary/Secondary/Supporting/
  Peripheral, §1) as its own explicit field, separate from P0/P1/P2.
- **Expected Benefits:** removes ambiguity for future designers between
  "built first" and "attended to first."
- **Possible Risks:** a template change affects consistency with
  already-written specifications (Dashboard's own); would need to be
  applied retroactively or accepted as a version-boundary change.
- **Estimated Impact:** Medium — improves precision of future
  specifications without altering any already-approved one.
- **Recommendation Priority:** **Medium.**

## Observation 3 — Component Psychology (§9) is incomplete by design and will need a follow-up pass

- **Observation:** only four of nine approved product areas have a
  Component Psychology entry in §9; the remaining five are marked
  `TODO`.
- **Technical Reasoning:** those five areas have no implementation
  specification yet (per `25_PRODUCT_BLUEPRINT.md` §10's own
  Implementation Order), so writing their Component Psychology now would
  risk anticipating detail ahead of approved specification work.
- **Expected Benefits:** deferring keeps this document honest about
  what is actually decided versus assumed.
- **Possible Risks:** if left too long, later specifications might be
  written without their own Component Psychology entry existing yet,
  breaking the "ZXL before specification" ordering Observation 1
  recommends.
- **Estimated Impact:** Low — a scheduling/sequencing concern, not a
  content gap in what currently exists.
- **Recommendation Priority:** **Low.**

## Observation 4 — A future Zenith Voice & Tone style guide, deferred at §8

- **Observation:** §8 (Language Philosophy) states principles but no
  concrete word-choice or terminology guide.
- **Technical Reasoning:** real screen copy (empty states, error
  copy, disclosure language) does not exist yet in implementation to
  test principles against.
- **Expected Benefits:** a concrete style guide, once real copy exists,
  would let engineering apply §8 consistently without re-deriving tone
  from first principles for every new string.
- **Possible Risks:** written too early, a style guide risks inventing
  specific phrasing leadership has not reviewed — the same risk this
  document itself was written to avoid for experience philosophy.
- **Estimated Impact:** Medium — a future consistency and velocity gain
  for implementation, not currently blocking anything.
- **Recommendation Priority:** **Low.**

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 —
  frozen, cited throughout, not modified)
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` (ZOS-025 — frozen, cited,
  not modified)
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (ZOS-026 —
  cited as the current example implementation specification, not
  modified)
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/00_INDEX.md`
