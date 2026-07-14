# 24_ZENITH_PRODUCT_CONSTITUTION

**Document ID:** ZOS-024
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Approved By:** Architecture Team / Product Leadership
**Date Approved:** 2026-07-14

------------------------------------------------------------------------

# §0 Preamble & Document Authority

This is the Zenith Product Constitution. It is the highest authority in
the project on questions of product philosophy, trader psychology,
design, and AI persona. Every future document, design, component,
screen, and implementation must comply with it. It is written to remain
stable for years — amendments are possible (§16) but are expected to be
rare and deliberate, never a routine sprint-level decision.

This document does not redesign Zenith, does not change the roadmap,
and does not authorize any implementation. It converts already-approved
leadership philosophy — some stated explicitly in this document's own
approval history, some already binding through `22_ANALYSIS_ENGINE_ARCHITECTURE.md`
and prior Decision Log entries — into a stable, citable specification.
Where no leadership decision exists yet, this document says so
explicitly (`TODO`) rather than inventing one.

## §0.1 Relationship to `06_PROJECT_CONSTITUTION.md`

`06_PROJECT_CONSTITUTION.md` and this document are **peers, not a
hierarchy** — each is supreme within its own domain, and neither
overrides the other:

- `06_PROJECT_CONSTITUTION.md` governs **engineering process
  authority**: who may approve architecture, when implementation may
  begin, how scope is controlled, how sprints are reported.
- `24_ZENITH_PRODUCT_CONSTITUTION.md` (this document) governs **product,
  design, psychology, and AI-persona authority**: what Zenith is, who it
  is for, how it must look, feel, reason, and speak.

A future screen, component, or feature must satisfy both: it must be
built through an approved Sprint Brief (`06`) *and* comply with this
Constitution (`24`). Neither document may be cited to override the
other's own domain.

## §0.2 Relationship to `02_PRODUCT_VISION.md`

`02_PRODUCT_VISION.md`'s "Vision" and "Mission" describe the
**engineering project** — how Zenith the software gets built
("architecture, documentation, and implementation remain aligned").
This Constitution's §1 (Vision) and §2 (Mission) describe the
**trading product** — what Zenith does *for a trader*. The two
documents answer different questions and are not in tension; where
useful, this document cross-references `02` rather than restating it.

## §0.3 Evidence Classification Legend

Every substantive claim in this document about trader psychology, human
behavior, or visual perception is tagged with exactly one of the
following, so that engineering, design, and future review can tell
established science apart from convention apart from a Zenith-specific
choice:

- **[Established Evidence]** — a peer-reviewed, widely-replicated
  finding from cognitive psychology, behavioral economics, or
  human-computer interaction. Cited by the researcher(s)/theory name so
  it can be independently checked, not by an unnamed "studies show."
  Where a finding's replication status is contested (e.g. ego
  depletion), this is disclosed rather than hidden.
- **[Industry Best Practice]** — a widely-adopted convention in
  professional UX/UI/product design (e.g. Nielsen Norman Group
  research, WCAG, major design-system precedent) that is not itself a
  controlled scientific finding, but is broadly corroborated by
  practitioner consensus and usability testing across many products.
- **[Zenith-Specific Decision]** — a choice this project is making that
  is neither a scientific finding nor an external industry convention —
  it is *our own* product philosophy, stated here as binding precisely
  because nothing external mandates it.

No claim in this document is presented as settled science unless it
actually is. Where a popular idea is scientifically weak or contested
(most "color psychology," for instance), this document says so plainly
rather than borrowing false authority — per this Constitution's own
Product DNA (§3): Zenith does not fabricate certainty, including about
itself.

------------------------------------------------------------------------

# §1 Vision

## §1.1 Product Vision Statement

Zenith exists to make a trader's own reasoning *visible to the trader* —
before, during, and after every decision. It is not built to predict
markets or to replace judgment. It is built so that judgment is
informed by disclosed evidence, reasoned interpretation, and honestly
labeled uncertainty, every time, without exception.

## §1.2 Who Zenith Is For

Zenith is built for a trader who wants to understand *why* a market
condition matters, not merely to be told *what* to do about it. This
includes traders developing their own process discipline and traders
who already have one and want it supported, never overridden, by
software.

## §1.3 What Zenith Is Not

Zenith is not a signal service. It is not an automated advisor. It is
not a system that treats trading activity itself as the measure of
success. These boundaries are elaborated as binding, permanent identity
in §3 (Product DNA) — they are stated here as the starting frame for
everything that follows in this document, not repeated in full.

------------------------------------------------------------------------

# §2 Mission

## §2.1 Mission Statement

Give every trader who uses Zenith the same disciplined process a
professional analyst would apply to their own decisions: gather
evidence, weigh it honestly, disclose what is uncertain, and only then
look at a chart — never the reverse.

## §2.2 Core Promise to the Trader

Zenith promises that nothing it shows is more confident than the
evidence underneath it, that a "no clear opportunity today" reading is
always a legitimate, fully-supported outcome, and that the trader is
never asked to trust a conclusion they cannot trace back to its own
evidence. This promise is operationalized as permanent Product Rules in
§13 and is already partly built: the Analysis Provider Framework's own
four-part Confidence taxonomy and per-request Traceability
(`22_ANALYSIS_ENGINE_ARCHITECTURE.md`) exist specifically so this
promise is enforceable in code, not just in marketing language.

------------------------------------------------------------------------

# §3 Product DNA

Product DNA is Zenith's immutable identity — the traits that do not
change as features are added, screens are designed, or the roadmap
evolves. Where this section states something as already true of
Zenith's engineering, it is synthesized from decisions already approved
elsewhere in ZOS (cited inline), not invented here.

## §3.1 Immutable Identity

Zenith is an **explainable trading intelligence platform**, not an
automated advisor — a boundary already fixed at the architecture level:
"[The Analysis Engine] never produces BUY/SELL recommendations. It
produces evidence, interpretation, and disclosed limitations that a
trader... can independently verify" (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
Purpose). This is not a feature choice that could be revisited by a
future roadmap decision — it is what "Zenith" *means*. A future version
of Zenith that issued direct trade recommendations would not be a new
version of Zenith; it would be a different product wearing this
product's name.

## §3.2 Non-Negotiable Principles

1. **Every conclusion is traceable to its own evidence.** Nothing is
   shown as a finding unless a trader could, in principle, click
   through to see exactly what produced it.
2. **Confidence is always labeled, never implied by design alone.** A
   strongly-worded or brightly-colored claim is never allowed to carry
   more certainty than its own disclosed Confidence value supports.
3. **Disagreement is reported honestly, never resolved into a false
   consensus.** This is already a binding architectural rule — the
   Confluence Engine reports genuine cross-methodology agreement *and*
   disagreement, "never voting or averaging confidence into a false
   consensus" (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Confluence Engine).
   Product DNA extends this from the Confluence Engine's own internal
   contract to every surface a trader sees.
4. **Absence of a signal is a valid, complete answer.** Zenith is never
   under pressure to manufacture a reading where none is warranted.
5. **The product never optimizes for engagement over judgment quality.**
   Time-on-app, session count, and click-through are never Zenith's own
   measures of success in a way that could reward compulsive checking
   or overtrading (see §3.3, §12.3).

## §3.3 What Zenith Will Never Become

- Zenith will never become a signal-selling service, a "buy/sell alert"
  product, or anything a trader could correctly describe as "telling me
  what to do."
- Zenith will never gamify trading frequency — no streaks, badges, or
  score mechanics that reward placing trades rather than making sound
  decisions (including the decision not to trade).
- Zenith will never let a confident-looking interface substitute for
  actual evidentiary confidence. A low-confidence reading is never
  dressed up to look more certain than it is.
- Zenith will never treat a losing trade, or a day with no trade, as a
  failure state in its own product language, metrics, or visual
  treatment.
- Zenith will never silently drop a disclosed limitation or Confidence
  Ceiling to make a feature feel more polished.

## §3.4 Feature Acceptance Philosophy

A proposed feature is acceptable for Zenith only if it satisfies at
least one of the Non-Negotiable Principles above and violates none of
them. Concretely, before any feature reaches a Sprint Brief:

- Does it reduce cognitive load or increase trust, rather than adding
  volume for its own sake? If not, reject or redesign.
- Does it reward the *quality* of a trader's decision process, never
  the *frequency* of activity? If a feature's success metric is
  "trades placed" or "sessions per day" in isolation, reject it.
- Can every output it produces be traced to disclosed evidence, with
  its own honestly labeled uncertainty? If a feature cannot state what
  it doesn't know, it cannot ship in that form.
- Does it preserve "no trade" as an equally legitimate outcome to any
  other reading it might produce? If a feature structurally implies
  that *some* action is always the right answer, reject or redesign.

This is a gate, not a scoring rubric — a feature that fails any
applicable test does not proceed to implementation regardless of its
other merits. `TODO`: a formal, numbered Feature Acceptance Checklist
suitable for direct use in Sprint Brief review is a natural future
artifact once real feature proposals exist to test it against; this
Constitution establishes the philosophy the checklist must encode, not
the checklist itself.

## §3.5 Product Identity Preservation

Product DNA (§3.1-§3.4) is what must survive every future redesign,
pivot, market shift, and leadership transition unchanged. Concretely:

- A future visual redesign may change how Zenith looks; it may never
  change what Zenith discloses, withholds, or implies about confidence.
- A future business-model change may change how Zenith is priced or
  packaged; it may never make disclosure or traceability (§4.1)
  conditional on a pricing tier — evidence and its own limitations are
  never a premium feature gated behind payment.
- A future leadership change does not itself authorize a change to
  this section — amendment requires the same explicit process as any
  other part of this Constitution (§16), specifically because identity
  drift is the failure mode this section exists to prevent.
- Where a future proposal would preserve Zenith's *language* about
  itself ("explainable," "evidence-based") while changing its
  *behavior* (e.g. quietly introducing a recommendation engine), the
  proposal is judged against this section's own substance, not its own
  marketing description of itself.

------------------------------------------------------------------------

# §4 Core Product Philosophy

## §4.1 Evidence Over Signals

Zenith surfaces evidence and disclosed interpretation, never a bare
"signal" divorced from why it exists. This is already enforced at the
architecture level: every `AnalysisProviderResult` carries `evidence`,
`interpretation[]`, `limitations`, and `traceability` as mandatory
fields (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Evidence / Interpretation
/ Limitations Contract) — there is no code path that produces a
conclusion with no evidence attached. **[Zenith-Specific Decision]**,
already binding in engineering.

## §4.2 Explainability Over Automation

Automation is used to gather and structure evidence faster than a human
could, never to make the trader's decision for them. Every
automated step remains inspectable. **[Zenith-Specific Decision]**.

## §4.3 Process Over Prediction

Zenith measures itself by whether it improved a trader's *process* —
did they have better evidence, clearer reasoning, fewer impulsive
actions — never by whether any single prediction was correct. Markets
are probabilistic; a product that judged itself on prediction accuracy
alone would be incentivized to hide its own honest uncertainty.
**[Zenith-Specific Decision]**.

## §4.4 Discipline Over Dopamine

Where a design choice would increase short-term engagement at the cost
of trading discipline (variable-reward mechanics, urgency-manufacturing
copy, streak pressure), discipline wins. This is a direct, permanent
consequence of Product DNA §3.2's engagement-vs-judgment principle, not
a separate policy. **[Zenith-Specific Decision]**.

------------------------------------------------------------------------

# §5 Core Design Philosophy

## §5.1 Clarity Over Decoration

Every visual element must earn its place by making a reading easier or
faster to correctly understand. Decoration that does not serve
comprehension is removed, not "balanced." **[Zenith-Specific Decision]**,
informed by the Gestalt principle that unnecessary visual elements
compete for the same limited perceptual attention as meaningful ones
**[Established Evidence — Gestalt perceptual-grouping research]**.

## §5.2 Calm Interface Philosophy

The interface should read as steady and unhurried even when markets are
not. Urgency in the *product's own voice* (red flashing, aggressive
motion, exclamation-heavy copy) is treated as a design defect, since it
actively works against Trader Psychology §6.6 (Emotional Control).
**[Zenith-Specific Decision]**.

## §5.3 Trust Through Transparency

Trust is built by consistently showing the trader *why*, not by
polish alone. A plain-looking but fully-traceable reading is preferred
over a polished one that hides its own limitations. **[Zenith-Specific
Decision]**, grounded in HCI research that perceived trustworthiness of
a system correlates strongly with the system's own disclosed
transparency about its limits, not with surface aesthetics alone
**[Established Evidence — trust-in-automation / explainable-AI
literature, e.g. Lee & See's trust-calibration framework]**.

## §5.4 Consistency as a Trust Signal

The same concept (a Confidence value, a disclosed limitation, a signal
direction) must always look and read the same way everywhere it
appears. Inconsistent presentation of the same underlying concept
measurably erodes user trust and increases cognitive load, since the
user must re-learn what a pattern means each time it recurs
**[Established Evidence — consistency heuristic, Nielsen's usability
heuristics]**. Enforced permanently in §14 (Design Constitution).

------------------------------------------------------------------------

# §6 Trader Psychology

## §6.1 Cognitive Load

Working memory can reliably hold only a small number of discrete items
at once — classically cited as roughly seven, plus or minus two, though
later work narrows this further for actively-manipulated (not merely
held) information **[Established Evidence — Miller's "The Magical
Number Seven" (1956); Cowan's revision toward ~4 chunks for active
working memory (2001)]**. Cognitive Load Theory further distinguishes
*intrinsic* load (the inherent difficulty of the material), *extraneous*
load (load added by poor presentation), and *germane* load (effort
that genuinely builds understanding) **[Established Evidence — Sweller,
Cognitive Load Theory]**. Zenith's design obligation is to minimize
extraneous load aggressively — nothing on screen should cost working
memory that isn't paying for better trader understanding — while
accepting that a genuinely complex market condition carries irreducible
intrinsic load no interface can remove.

## §6.2 Decision Fatigue

The general finding that decision quality can degrade after a long
sequence of prior decisions is well established at the level of
observed behavior (e.g. later-session choices trending toward
lower-effort defaults) **[Established Evidence — decision-fatigue
literature, e.g. Danziger et al.'s judicial-ruling study]**. Its
proposed underlying mechanism ("ego depletion," a finite willpower
resource) is scientifically contested and has not reliably replicated
**[Established Evidence, contested mechanism — Baumeister's ego-depletion
theory; failed replications include Hagger et al.'s multi-lab study]**.
Zenith's product obligation does not depend on resolving that
mechanism: regardless of *why* it happens, a trader making their tenth
decision of the session deserves the same clarity of evidence as their
first, so the product's own information architecture must not compound
fatigue by forcing unnecessary re-orientation or redundant re-reading
between decisions.

## §6.3 Trust

Trust in an automated or semi-automated system is built and lost
asymmetrically: it accrues slowly through consistent, calibrated
performance and disclosure, and can be destroyed quickly by a single
instance of overconfidence proven wrong **[Established Evidence — trust
asymmetry in automation reliance, e.g. Lee & See, "Trust in Automation"
(2004)]**. This is why §4.1's evidence-first discipline and the
Confidence Model's own Methodology Confidence Ceiling (a hard, disclosed
cap reflecting genuine source-quality limits — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
Confidence Model) are treated as trust infrastructure, not merely
analytical nuance.

## §6.4 Attention

Attention is a scarce, sequential resource: a person can give full,
conscious attention to essentially one primary task at a time, and
what draws the eye first materially changes what gets processed at all
**[Established Evidence — attentional bottleneck / selective attention
research broadly, e.g. Broadbent's filter model and its successors]**.
Zenith's obligation is to ensure the single most decision-relevant piece
of evidence on any given screen is also the one attention lands on
first (§8.1, §8.3), rather than whatever is visually loudest by
accident.

## §6.5 Confidence

Confidence, in Zenith's own product vocabulary, is never a single
undifferentiated number. Conflating "how well does this match its own
pattern definition" with "how sure am I this interpretation is right"
with "does the broader market regime support this" with "how good is
my source material" produces a number that feels precise but means
nothing — this is exactly why the Analysis Provider Framework's own
four-part Confidence taxonomy exists and why two differently-computed
"70%" values are never treated as comparable
(`22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Confidence Model). Product-level
communication of confidence (§11.4, §13) must preserve this
distinction, never collapse it back into one number for the sake of a
simpler-looking screen.

## §6.6 Emotional Control

Trading decisions made under acute emotional arousal (fear, excitement,
frustration after a loss) are measurably lower quality than the same
decisions made in a calmer state — a core finding of behavioral finance
on the interaction between affect and risk-taking
**[Established Evidence — affect heuristic in risk judgment, e.g.
Slovic et al.; disposition effect literature on loss-driven trading
behavior]**. Zenith's design obligation (§5.2) is to never *add*
arousal through its own interface choices, and where possible to give
the trader a moment of disclosed evidence between an emotional trigger
(a loss, a fast-moving market) and any action the product surfaces.

## §6.7 Habit Formation

Sustainable behavior change is built through consistent, low-friction
repetition of a specific cue-routine-reward loop, not through
willpower alone **[Established Evidence — habit-formation literature,
e.g. Lally et al. on real-world habit-formation timelines; see also
§7.2 for the underlying behavioral loop model]**. Zenith's obligation
is to make the *disciplined* version of a trading routine (review
evidence, check the journal, confirm process before acting) the
low-friction default path, so good habits form by product design, not
despite it.

------------------------------------------------------------------------

# §7 Human Behavior Principles

## §7.1 Behavioral-Economics Foundations

Human decision-making under uncertainty systematically deviates from
purely rational expected-value calculation in well-documented, roughly
predictable ways **[Established Evidence — Kahneman & Tversky, Prospect
Theory (1979); Kahneman, "Thinking, Fast and Slow" (2011) synthesizing
decades of this program]**. Zenith treats the trader as a real human
subject to these documented biases, not as an idealized rational actor —
this is why disclosure of uncertainty and process (§4, §13) matter more
to Zenith than raw predictive accuracy: a product built only for a
perfectly rational user would be built for nobody.

## §7.2 Habit Loops (Cue → Routine → Reward)

Habitual behavior is well-modeled as a three-part loop: a cue triggers
a routine, which produces a reward that reinforces the cue-routine
association over repetition **[Established Evidence — the underlying
neuroscience is basal-ganglia habit-formation research (Graybiel);
popularized as "cue-routine-reward" by Duhigg, "The Power of Habit"
(2012), which is an accurate industry-level synthesis rather than a
primary source itself]**. Zenith's obligation is to design its own
cue-routine-reward loops (session start → evidence review → informed
decision) so that the *rewarded* routine is the disciplined one (§4.4,
§12.3) — never a loop that rewards checking frequency or impulsive
action.

## §7.3 Loss Aversion & Risk Perception

Losses are felt more intensely than equivalent gains — a robust,
much-replicated asymmetry **[Established Evidence — Kahneman & Tversky's
Prospect Theory; Tversky & Kahneman (1991) loss-aversion coefficient
estimates]**. A direct behavioral consequence relevant to trading
products specifically is the disposition effect: a documented tendency
to sell winning positions too early and hold losing positions too long,
precisely because realizing a loss is felt as more painful than an
unrealized loss of the same size **[Established Evidence — Shefrin &
Statman, "The Disposition Effect" (1985); widely replicated in
brokerage-account studies]**. Zenith's product obligation is to present
evidence about a position's own current state neutrally — never
softening how a losing position's own evidence is disclosed relative to
a winning one's.

## §7.4 Social Proof & Discipline

People are influenced by perceived social norms about acceptable
behavior, for better or worse **[Established Evidence — Cialdini,
"Influence," social-proof literature]**. Zenith's obligation, where any
social or comparative element is ever introduced (none exists in the
current approved product surface, §10.2), is to ensure any implied norm
reinforces process discipline, never trading frequency or risk-taking —
this constrains any future feature in this space rather than describing
one that exists today.

## §7.5 Motivation & Reinforcement

Reinforcement that is intermittent and unpredictable produces stronger,
more persistent behavioral conditioning than reinforcement that is
constant and predictable — the mechanism behind the addictive pull of
slot machines and, by direct analogy, poorly-designed trading and
social apps **[Established Evidence — Skinner's variable-ratio
reinforcement-schedule research]**. This is precisely the mechanism
Zenith's Product DNA (§3.2, §3.3) permanently forecloses: Zenith does
not use variable-reward mechanics to drive engagement, full stop.

------------------------------------------------------------------------

# §8 Visual Psychology

## §8.1 Visual Hierarchy

The single most decision-relevant piece of information on any screen
must have the strongest visual weight (size, contrast, position),
scaling down through supporting evidence to background context
**[Industry Best Practice — visual-hierarchy convention across
professional UI/graphic design, grounded in the same selective-attention
research cited at §6.4]**.

## §8.2 Eye Movement

Eye-tracking research on how people scan digital interfaces shows
strong, non-random patterns — most famously F-shaped and Z-shaped
scanning behavior on text- and layout-heavy pages, with sharply
declining attention as the eye moves down and right from the top-left
**[Established Evidence — Nielsen Norman Group's eye-tracking studies,
e.g. Nielsen's original F-pattern research (2006) and subsequent
replications]**. Zenith must place its own single most important
reading (§8.1) inside the highest-attention region this research
identifies, not wherever is layout-convenient.

## §8.3 Information Priority

Where multiple true statements could be shown, Zenith prioritizes the
one that most changes the trader's own decision, over the one that is
merely most recently computed, most novel, or most visually dramatic.
**[Zenith-Specific Decision]**, operationalizing §6.4/§8.1/§8.2 into a
concrete prioritization rule.

## §8.4 Color Psychology

Much popular "color psychology" (red = danger, green = growth, blue =
trust) is culturally contingent, weakly evidenced, and frequently
overstated in industry marketing material — this document does not
borrow that claimed authority **[Established Evidence, largely
disconfirmed as a universal claim — cross-cultural color-association
research shows substantial variation, e.g. work surveyed in Elliot &
Maier's review of color-in-context effects]**. What *is* well-supported
is narrower and more mechanical: sufficient color contrast is required
for legibility and accessibility **[Established Evidence/Industry
Best Practice — WCAG 2.1 contrast-ratio requirements, grounded in
controlled legibility research]**, and consistent, disciplined use of a
small color vocabulary (e.g. one hue family reserved exclusively for
"requires attention") measurably speeds correct interpretation because
it reduces the number of associations a user must learn and re-verify
**[Established Evidence — redundancy-and-consistency findings in visual
search literature]**. Zenith's own color vocabulary is therefore
treated as a disciplined, small, consistent signal system (§5.4, §14),
never as an attempt to manufacture a claimed emotional effect from hue
alone.

## §8.5 Typography Principles

Legibility research gives reasonably firm, practical guidance:
optimal line length for sustained reading is roughly 50-75 characters
**[Established Evidence — typographic-legibility research broadly
corroborated across print and digital studies]**; sufficient
contrast between text and background is required, per the same
accessibility standard cited at §8.4 **[Industry Best Practice — WCAG
2.1]**; and numeric/financial data specifically benefits from a
tabular (fixed-width) figure style so that digits align in comparison,
a long-standing typesetting convention for financial and tabular
information **[Industry Best Practice]**. Zenith treats these as binding
minimums, not aspirational targets.

## §8.6 Whitespace

Whitespace is not empty space to be filled — it is what allows the
figure/ground distinction the eye needs to separate meaningful content
from its surroundings, and its removal measurably increases perceived
complexity and search time **[Established Evidence — Gestalt
figure-ground principles; visual-complexity/search-time findings in HCI
literature]**. Zenith's Calm Interface Philosophy (§5.2) treats
generous, disciplined whitespace as a direct implementation of this
finding, not a stylistic preference.

## §8.7 Motion Philosophy

Motion should communicate *continuity and cause* (this changed because
of that, this is now where that used to be) — a well-supported use of
animation in interface design **[Industry Best Practice — motion-design
principles across major design systems, e.g. Material Design's own
motion guidelines, grounded in perceptual-continuity research]**. Motion
must never be used to manufacture urgency or excitement (§5.2, §12.3),
and must respect vestibular sensitivity by providing a reduced-motion
mode, since a documented minority of users experience genuine physical
discomfort from certain animation patterns **[Established Evidence —
vestibular-disorder literature on motion-triggered symptoms; WCAG 2.1's
own reduced-motion accessibility criterion]**.

------------------------------------------------------------------------

# §9 User Journey Philosophy

Each phase below states the trader's own psychological state and
Zenith's philosophical obligation during it — not a screen design.

## §9.1 Morning

The trader arrives with the highest available cognitive capacity and
the lowest available context for *today specifically* (§6.1, §6.2).
Zenith's obligation is synthesis, not volume: orient the trader toward
what changed and what matters today, before any raw data.

## §9.2 Analysis

The trader is actively building understanding. Zenith's obligation is
to present evidence in the order that builds correct understanding
fastest — story before chart (§12.1) — and to make every interpretive
claim traceable back to its own evidence (§4.1) as the trader goes.

## §9.3 Decision

This is the highest-stakes, most emotionally-loaded moment in the
journey (§6.5, §6.6). Zenith's obligation is maximal clarity about
confidence and uncertainty (§13) and zero design pressure toward any
particular action — including no design pressure against choosing not
to act (§3.2, §12.4).

## §9.4 Execution

Zenith is not an execution venue for real trades in the current
approved product surface (§10.2); this phase concerns any product
surface where the trader records or confirms a decision already made.
The obligation here is friction-minimal *recording*, never friction-
minimal *impulse* — the two are deliberately not the same design goal.

## §9.5 Review

The trader is assessing their own past decisions. Zenith's obligation
is neutral, evidence-based reflection (§7.3) — a losing trade is
reviewed with the same calm, undramatized visual treatment as a winning
one (§3.3, §5.2).

## §9.6 Learning

The trader is building durable process improvement. Zenith's obligation
is to reinforce the disciplined habit loop (§7.2, §6.7), turning Review
into the cue for better future Analysis, closing the journey into a
loop that strengthens process rather than a one-off report card.

------------------------------------------------------------------------

# §10 Screen Philosophy

## §10.1 Screen Philosophy Framework

Every current or future screen must be defined, before any UI design
begins, in exactly these terms:

- **Purpose** — what decision or understanding this screen exists to
  support.
- **Psychological Objective** — which of §6/§7's trader-psychology
  principles this screen is specifically designed to serve.
- **Business Objective** — how this screen advances Zenith's own
  business goals (`03_BUSINESS_GOALS.md`) without ever conflicting with
  Product DNA (§3).
- **Success Criteria** — an observable statement of what "this screen
  is working" means, independent of any specific visual design.

No screen may proceed to design or implementation without all four
being stated and reviewed against this Constitution.

## §10.2 Approved Product Surface (Framework Only — No UI Design)

The following are the currently leadership-approved high-level product
areas. Each is stated here at the philosophy level only, per §10.1's
framework — no layout, component, or visual design is specified or
implied by this document. **Any addition to this list requires its own
leadership approval; this Constitution does not expand the product
surface on its own authority.**

### Dashboard / Home
- **Purpose:** the trader's single entry point each session.
- **Psychological Objective:** reduce decision fatigue and cognitive
  load at the highest-stakes cognitive moment — session start — by
  prioritizing synthesis over data volume (§6.1, §6.2, §9.1).
- **Business Objective:** establish Zenith as the trusted first stop of
  the trading day, without rewarding compulsive checking (§3.2, §7.5).
- **Success Criteria:** a trader can state their own current
  decision-readiness shortly after arrival, without manually
  cross-referencing other screens.

### Morning Brief
- **Purpose:** synthesize what changed and what matters before the
  trader looks at any chart.
- **Psychological Objective:** implement story-before-chart (§12.1)
  and reduce cognitive load (§12.2) at the exact moment context is
  lowest (§9.1).
- **Business Objective:** differentiate Zenith from raw data/chart
  products by demonstrating synthesis value immediately.
- **Success Criteria:** a trader can correctly summarize the day's own
  key evidence without having reviewed any other screen first.

### Trading Journal
- **Purpose:** record and later review the trader's own decisions and
  reasoning.
- **Psychological Objective:** support neutral, non-punitive Review
  (§9.5) and reinforce the disciplined Learning loop (§9.6, §7.2)
  rather than treating losses as failure states (§3.3).
- **Business Objective:** make process improvement, not P&L alone, a
  retained-usage driver.
- **Success Criteria:** a trader can trace a past decision back to the
  evidence available at the time, and can identify a genuine process
  pattern across multiple entries.

### Watchlist
- **Purpose:** hold the set of instruments a trader is currently
  tracking with active attention.
- **Psychological Objective:** manage Attention (§6.4) as a scarce
  resource by keeping the tracked set intentional rather than
  unbounded.
- **Business Objective:** anchor recurring, intentional (not
  compulsive) daily engagement.
- **Success Criteria:** a trader's watchlist reflects instruments they
  can each recall a specific reason for tracking.

### Portfolio
- **Purpose:** show the trader's own current holdings and their
  evidentiary state.
- **Psychological Objective:** neutral disclosure regardless of
  winning/losing status (§7.3, §5.2) — never a source of induced
  urgency (§5.2).
- **Business Objective:** establish Zenith as a trusted, calm system of
  record for the trader's own positions.
- **Success Criteria:** a trader reviewing a losing position reports
  the same perceived tone/calm as reviewing a winning one.

### Alerts
- **Purpose:** surface a disclosed, evidence-backed condition the
  trader has asked to be notified about.
- **Psychological Objective:** respect Attention (§6.4) by alerting only
  on genuine, disclosed evidentiary change — never manufacturing false
  urgency (§5.2) to drive re-engagement (§7.5).
- **Business Objective:** be a trusted enough signal that the trader
  never feels the need to mute Zenith to reduce noise.
- **Success Criteria:** the trader's own observed alert-dismissal rate
  without action stays low, indicating alerts are perceived as
  genuinely relevant rather than noise.
- `TODO`: exact alerting-frequency governance is a future Sprint-level
  decision, not fixed by this Constitution.

### Calendar / News
- **Purpose:** contextualize scheduled events and news evidence
  relevant to the trader's own tracked instruments.
- **Psychological Objective:** support Analysis (§9.2) with disclosed,
  attributable evidence, never bare headlines presented as conclusions.
- **Business Objective:** reduce the trader's own need to leave Zenith
  for baseline context.
- **Success Criteria:** a trader can state which specific upcoming
  event, if any, is relevant to a given instrument's own current
  reading, sourced from this screen alone.

### COT & Reports
- **Purpose:** surface institutional positioning and other structured
  report data (e.g. Commitments of Traders) as disclosed evidence.
- **Psychological Objective:** reinforce Evidence Over Signals (§4.1) —
  this is raw evidence, explicitly not a conclusion, disclosed as such.
- **Business Objective:** differentiate Zenith by making institutionally
  -sourced evidence accessible and explained, not merely displayed.
- **Success Criteria:** a trader can correctly distinguish this
  screen's own raw report data from an Analysis Provider's own
  interpretation of it.

### AI Workspace
- **Purpose:** the trader's direct interaction surface with Zenith's
  own embedded AI Assistant (§11).
- **Psychological Objective:** support Trust (§6.3) and Confidence
  communication (§6.5) through the AI Personality's own disclosed,
  calibrated communication style (§11).
- **Business Objective:** be the surface where Zenith's own
  explainability differentiation is most directly experienced.
- **Success Criteria:** a trader can correctly restate the AI
  Assistant's own stated confidence and uncertainty for a given
  reading, without the Assistant having overstated either.

## §10.3 Expansion Policy

This list is the current approved product surface, not an exhaustive or
permanent one. Any new product area requires its own leadership
approval and its own §10.1 framework statement before any Sprint Brief
may reference it. This Constitution does not itself authorize expansion.

------------------------------------------------------------------------

# §11 AI Personality

This section governs Zenith's own embedded, trader-facing AI Assistant
persona (most directly experienced in the AI Workspace, §10.2) — a
distinct persona from the *engineering* Implementation Engineer's own
operational identity defined in `ZENITH_AI_SYSTEM_PROMPT.md`. The two
must never be conflated: one talks to traders about markets, the other
talks to engineers about code.

## §11.1 Communication Style

Calm, precise, and non-alarmist, consistent with the Calm Interface
Philosophy (§5.2). Never uses urgency-manufacturing language ("act now,"
"don't miss") regardless of how time-sensitive the underlying evidence
genuinely is — genuine time-sensitivity is disclosed factually, not
performed emotionally.

## §11.2 Explanation Style

Leads with the trader-relevant conclusion, then discloses the evidence
and reasoning behind it — the same story-before-chart discipline
(§12.1) applied to language rather than layout. Never uses unexplained
jargon the Glossary (`18_PROJECT_GLOSSARY.md`) does not already define
for a general trader audience.

## §11.3 Uncertainty

States what it does not know as plainly and as prominently as what it
does — never buried in a caveat at the end. Directly implements Product
Rule "Explain uncertainty" (§13) and DNA §3.2's traceability principle.

## §11.4 Confidence

Never collapses the four-part Confidence taxonomy (§6.5) into a single
casual number in conversation. Where a trader asks "how confident are
you," the Assistant answers with the specific, labeled kind of
confidence the question actually concerns, not a single blended figure.

## §11.5 Warnings

Delivered factually and without dramatization — the same calm tone as
every other communication (§11.1), never a distinct "alarmed" register.
A genuine risk is stated as clearly and un-dramatically as a routine
observation; clarity carries the weight, not tone.

## §11.6 Educational Behavior

Defaults to teaching the trader *why*, not merely stating *what* —
reinforcing the Learning phase of the user journey (§9.6) in every
interaction, not only in dedicated educational content.

------------------------------------------------------------------------

# §12 Decision Philosophy

This section documents the *reasoning* behind the permanent Product
Rules stated formally in §13 — why each rule exists, not merely that it
exists.

## §12.1 Why Story Before Chart

A chart is a dense, unlabeled visual object — without a stated
narrative first, a viewer's own attention (§6.4) and prior expectations
determine what they notice in it, a well-documented confirmation-bias
risk in unstructured data review **[Established Evidence — confirmation
bias literature, e.g. Nickerson's review (1998)]**. Stating the evidentiary
story *before* showing the chart anchors interpretation to disclosed
evidence rather than to whatever the eye happens to catch first,
directly implementing Evidence Over Signals (§4.1) and Information
Priority (§8.3).

## §12.2 Why Reduce Cognitive Load

Every unit of working memory (§6.1) spent parsing an unnecessary
interface element is a unit unavailable for actually weighing evidence.
Since Zenith's entire value is the *quality* of a trader's own reasoning
(§4.3), extraneous cognitive load is a direct tax on the product's own
core purpose, not a separate design-quality metric.

## §12.3 Why Reward Discipline Over Activity

Variable, activity-triggered reward is a well-documented driver of
compulsive engagement (§7.5) that is actively harmful in a trading
context specifically, where the disposition effect and loss-driven
decision-making (§7.3, §6.6) are already working against the trader.
A product that additionally rewarded activity itself would be adding a
second behavioral headwind on top of ones the trader already faces —
directly counter to Zenith's Mission (§2).

## §12.4 Why No-Trade Is a Valid Outcome

If Zenith's own design implies that some action is always the correct
response to analysis, it manufactures exactly the pressure toward
overtrading that §3.2/§12.3 forecloses — and it would misrepresent the
underlying evidence, since a genuinely inconclusive reading is a true,
common, and often correctly analyzed state of the market, not a gap in
Zenith's own coverage. Treating "no clear opportunity" as a first-class,
equally-well-supported outcome is what makes Evidence Over Signals
(§4.1) honest rather than aspirational.

## §12.5 Why Evidence Precedes Visualization

A visualization (a chart, a highlighted level, a colored indicator)
carries strong, fast, pre-attentive visual weight (§8.1, §8.2) — it
will be processed and will shape a trader's impression whether or not
its own underlying evidence is sound. Requiring evidence to be
established first ensures the visualization illustrates a
already-disclosed conclusion, rather than substituting for the
justification of one — the same principle as §12.1, applied to any
visual element, not charts specifically.

## §12.6 Why Explain Confidence

A single undifferentiated confidence number invites the trader to treat
two incomparable things as comparable (§6.5) — this is a design-level
honesty failure, not merely a missed nuance, because it actively
produces a *false* impression of precision the underlying evidence does
not support. Explaining which specific kind of confidence is being
reported, and why, is what keeps a disclosed number from quietly
becoming a disguised recommendation — directly protecting Product DNA
§3.1's boundary against becoming an automated advisor.

## §12.7 Why Explain Uncertainty

Disclosed uncertainty is only useful to a trader if it is stated with
the same visual and verbal prominence as disclosed confidence (§6.3,
§11.3) — an uncertainty note that is technically present but easy to
miss functions, in practice, the same as no disclosure at all, since
trust research shows users calibrate reliance on a system by what they
actually notice being disclosed, not by what is merely technically
available somewhere in the interface (§6.3). Explaining uncertainty
prominently is therefore what makes the Confidence Model's own
disclosed Methodology Confidence Ceiling and Limitations
(`22_ANALYSIS_ENGINE_ARCHITECTURE.md`) a real product behavior rather
than an engineering detail invisible to the trader it exists to
protect.

------------------------------------------------------------------------

# §13 Product Rules

These are permanent, testable rules. They are binding on every future
screen, feature, and AI interaction. A Sprint Brief that would violate
any rule below must be escalated to the Architecture Team before
implementation, per `06_PROJECT_CONSTITUTION.md` Rule 4.

1. **Story before data.** Evidence is presented as a disclosed
   narrative before raw data is shown. (§12.1)
2. **Decision before chart.** The trader's own decision-relevant
   conclusion is stated before any chart is rendered. (§12.1, §8.1)
3. **Reduce cognitive load.** No interface element may impose working-
   memory cost that does not serve trader understanding. (§6.1, §12.2)
4. **Reward discipline.** Product mechanics reinforce sound decision
   process, never activity for its own sake. (§7.2, §7.5, §12.3)
5. **Never reward overtrading.** No metric, mechanic, or visual
   treatment may make placing more trades feel like success in itself.
   (§3.2, §3.3, §12.3)
6. **Explain confidence.** Every disclosed Confidence value is
   accompanied by what specific kind of confidence it is and why.
   (§6.5, §11.4, §12.6)
7. **Explain uncertainty.** What is not known is disclosed as plainly
   as what is known. (§4.1, §11.3, §12.7)
8. **Charts are evidence, not the beginning.** A chart illustrates
   already-disclosed evidence; it is never the first or only thing a
   trader is shown. (§12.1, §12.5)
9. **No-trade is a valid outcome.** "No clear opportunity" is treated
   as a fully legitimate, equally well-supported reading, never a
   product failure to be minimized or hidden. (§3.2, §12.4)
10. **Evidence precedes visualization.** No visual element renders a
    conclusion whose supporting evidence has not already been
    established and disclosed. (§12.5, §4.1)

This list may only be amended through §16's governance process — it is
not extensible by individual Sprint Briefs or feature proposals.

------------------------------------------------------------------------

# §14 Design Constitution

Permanent design rules, binding on every future screen:

1. **One color vocabulary, consistently applied.** A given color's
   meaning (e.g. "requires attention") must be identical everywhere it
   is used, across every screen (§5.4, §8.4).
2. **Contrast and legibility meet accessibility minimums everywhere,
   without exception.** No screen ships below WCAG 2.1 AA contrast
   requirements (§8.4, §8.5).
3. **Numeric and financial data uses tabular figures.** Digit alignment
   in any comparison context is mandatory, not optional (§8.5).
4. **Whitespace is treated as a required element, not filler.** No
   screen review may "add content to fill space" (§8.6).
5. **Motion always has a reduced-motion equivalent.** No animation ships
   without a respect for the `prefers-reduced-motion` class of
   accessibility need (§8.7).
6. **The single most decision-relevant element on a screen has the
   strongest visual weight, placed in the highest-attention region.**
   Verified per-screen against §10.1's Purpose statement (§8.1, §8.2).
7. **No design choice may manufacture urgency the underlying evidence
   does not itself support.** (§5.2, §11.1)
8. **Every Confidence or uncertainty disclosure required by §13 has an
   equivalent, consistently-styled visual treatment across all
   screens.** A Confidence value must never look different in kind
   depending on which screen shows it.

------------------------------------------------------------------------

# §15 Implementation Constitution

Rules every future engineer — human or AI — must follow when building
against this Constitution. This section cross-references existing
engineering governance rather than duplicating it:

1. **This Constitution is a Sprint Brief input, not a substitute for
   one.** No screen or feature may be implemented without its own
   approved Sprint Brief, per `06_PROJECT_CONSTITUTION.md` Rule 2.
   Compliance with this Constitution does not itself authorize
   implementation.
2. **Any implementation choice that would violate §13 (Product Rules)
   or §14 (Design Constitution) must stop and escalate**, per
   `06_PROJECT_CONSTITUTION.md` Rule 4 — the same "no unauthorized
   decisions" discipline already binding on architecture questions
   applies equally to product/design questions under this document's
   own authority.
3. **Engineering must not silently reinterpret a Psychological
   Objective (§10.1) to fit an easier implementation.** If a screen's
   stated objective appears to conflict with a technical constraint,
   this is an escalation, not a unilateral trade-off.
4. **Every future screen must have its §10.1 four-field definition
   written and reviewed before any UI implementation begins** — the
   same "documentation before implementation" discipline already
   binding project-wide (`06_PROJECT_CONSTITUTION.md` Rule 5) applies
   explicitly to product/screen definitions under this Constitution.
5. **Coding standards, naming conventions, and dependency policy remain
   governed entirely by their own existing documents**
   (`15_CODING_STANDARDS.md`, `16_NAMING_CONVENTIONS.md`,
   `14_DEPENDENCY_POLICY.md`) — this Constitution does not restate or
   override them.
6. **AI Personality (§11) is a product-behavior specification, not a
   prompt.** Any future implementation of the embedded AI Assistant
   (e.g. a system prompt, a response-formatting layer) must be
   reviewed against §11 for compliance; §11 itself is not
   implementation-ready text to paste into a model prompt without
   engineering translation.

------------------------------------------------------------------------

# §16 Governance

## §16.1 Amendment Process

This Constitution changes only through an explicit Architecture
Team/leadership decision, recorded as a Decision Log entry
(`11_DECISION_LOG.md`) citing the specific section(s) amended and the
reasoning — the same discipline `06_PROJECT_CONSTITUTION.md` Rule 5
already requires of architectural decisions, applied here to product
decisions. An amendment must state which prior section text it
supersedes; this document's own history is never silently rewritten
(consistent with the Decision Log's own append-only Rule,
`11_DECISION_LOG.md`, Rules).

## §16.2 Versioning Rules

This document uses semantic versioning. A patch-level change
(`1.0.x`) corrects wording or fixes a cross-reference without changing
meaning. A minor version (`1.x.0`) adds new sections or non-negotiable
principles without altering existing ones. A major version (`x.0.0`)
would change an existing Non-Negotiable Principle (§3.2) or Product
Rule (§13) — this is expected to be exceptionally rare, given this
document's own stated purpose of remaining stable for years, and
requires the same Architecture Team/leadership approval as this
document's own initial adoption.

## §16.3 Authority

Only the Architecture Team, acting on explicit product-leadership
direction, may approve a change to this document — mirroring
`06_PROJECT_CONSTITUTION.md` Rule 1's architecture-authority principle,
applied here to product authority. No implementation engineer, AI or
human, may reinterpret, extend, or waive any section of this
Constitution unilaterally; per §15.2, any apparent conflict is an
escalation, never a local decision.

------------------------------------------------------------------------

# Appendix A — Evidence Classification Legend (Full Definition)

See §0.3 for the complete definition and usage rules. Summary:

| Tag | Meaning |
|---|---|
| **[Established Evidence]** | Peer-reviewed, named research finding. Replication status disclosed where contested. |
| **[Industry Best Practice]** | Broad professional-practice consensus, not itself a controlled scientific finding. |
| **[Zenith-Specific Decision]** | This project's own choice, binding because we are making it, not because science or industry mandates it. |

# Appendix B — Glossary Additions (Pending Merge into `18_PROJECT_GLOSSARY.md`)

The following terms are introduced or given a specific meaning by this
Constitution and should be merged into `18_PROJECT_GLOSSARY.md` in a
future documentation-maintenance pass (`TODO`, not performed as part of
this document's own closure, to avoid scope creep into an unrelated
document during this Constitution's own approval):

- **Product DNA** — Zenith's immutable identity, as defined in §3.
- **Product Identity Preservation** — the requirement, per §3.5, that
  Zenith's own disclosed identity survive redesigns, business-model
  changes, and leadership transitions unchanged unless amended through
  §16's own governance process.
- **Non-Negotiable Principle** — one of the five permanent identity
  rules in §3.2.
- **Product Rule** — one of the ten permanent, testable rules in §13.
- **Decision Philosophy** — the documented reasoning behind the
  Product Rules, per §12.
- **Screen Philosophy Framework** — the four-field (Purpose /
  Psychological Objective / Business Objective / Success Criteria)
  definition every screen requires, per §10.1.
- **AI Personality** — the trader-facing embedded AI Assistant's
  defined communication behavior, per §11 (distinct from the
  Implementation Engineer persona in `ZENITH_AI_SYSTEM_PROMPT.md`).

# Appendix C — Full Cross-Reference Map

| Document | Relationship |
|---|---|
| `01_PROJECT_OVERVIEW.md` | Peer layer — engineering-project overview. No overlap. |
| `02_PRODUCT_VISION.md` | Disambiguated at §0.2 — engineering-project vision vs. this document's trader-facing product vision. |
| `03_BUSINESS_GOALS.md` | Peer layer — §10's "Business Objective" fields stay consistent with these goals, not restated from them. |
| `05_ARCHITECTURE.md` | §15 (Implementation Constitution) must not contradict it; cross-referenced, not restated. |
| `06_PROJECT_CONSTITUTION.md` | Disambiguated at §0.1 — engineering-process authority vs. this document's product/design authority. Peers. |
| `09_PROJECT_BRAIN.md` | Updated at this document's own closure to record its approval (see Completion Report). |
| `10_AI_ENGINEER_GUIDE.md` | §15 cross-references it for engineer-facing process; does not restate it. |
| `11_DECISION_LOG.md` | Governs this document's own amendment process (§16.1). |
| `14_DEPENDENCY_POLICY.md`, `15_CODING_STANDARDS.md`, `16_NAMING_CONVENTIONS.md` | §15.5 — remain independently authoritative; not restated here. |
| `18_PROJECT_GLOSSARY.md` | Receives Appendix B's new terms in a future sync pass (`TODO`). |
| `22_ANALYSIS_ENGINE_ARCHITECTURE.md` / `23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md` | Cited as existing engineering proof-points for §3.1, §4.1, §6.3, §6.5 — the Confidence Model and Confluence Engine already implement this Constitution's own evidentiary discipline. |
| `ZENITH_AI_SYSTEM_PROMPT.md` | Disambiguated at §11's own header — engineering AI persona vs. this document's product AI persona (§11). |
| `ZENITH_MASTER_CONTEXT.md` | Updated at this document's own closure to add a pointer (see Completion Report). |
| `13_FOLDER_STRUCTURE.md` | No change required — `documentation/zos/` is already the correct home for governance documents of this kind. |

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/06_PROJECT_CONSTITUTION.md`
- `documentation/zos/02_PRODUCT_VISION.md`
- `documentation/zos/03_BUSINESS_GOALS.md`
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/zos/23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
- `documentation/zos/00_INDEX.md`
