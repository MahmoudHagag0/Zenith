# M4-005_AI_WORKSPACE_SCREEN_DESIGN

**Document ID:** ZOS-M4-005
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Screen Design phase)

------------------------------------------------------------------------

# Purpose

AI Workspace's complete screen design, built on the official Dashboard
reference (`M4-003` series) and Constitution §11 (AI Personality). No
architecture, component, or color here contradicts Dashboard. Governs
`DASH-008`'s full destination screen (`26` §3, `M4-002` §4.10,
`25_PRODUCT_BLUEPRINT.md` §2 AI Workspace).

**Unique responsibility (never duplicates Dashboard):** `DASH-008` is
an inactive placeholder link only. AI Workspace is Zenith's sole
natural-language, generative conversational surface (Blueprint §7.1,
Generative AI Reasoning Layer) — distinct from Morning Brief's
deterministic, template-based narrative (`M4-004`, `25_PRODUCT_BLUEPRINT.md`
§8) and from every other screen's own fixed-structure evidence display.

------------------------------------------------------------------------

# 1. Information Architecture

**Purpose:** the trader's direct interaction surface with the embedded
AI Assistant (Constitution §10.2, §11). **Boundaries:** never issues a
recommendation (Constitution §3.1); never a second Morning Brief (no
duplicate deterministic narrative — this screen is conversational,
question-driven only). **Information hierarchy:** Primary = the current
question and the Assistant's direct answer (Constitution §11.2,
leads-with-conclusion); Secondary = evidence/reasoning behind the
answer; Supporting = confidence/uncertainty (per-answer, `DASH-003`
pattern reused); Peripheral = conversation history (D1-005 §2.4).
**Reading order:** Conversational Archetype (D1-005 §2.4) — one
question, one answer, at Low density per exchange; history never raises
the density of the current exchange. **Decision flow:** answers
whatever specific question the trader brings — not tied to one fixed
Decision Flow question, since a trader may ask about Q2, Q3, or Q4/Q5
content depending on context (ZXL §2's own note that later screens may
be entered directly). **Entry points:** Primary Navigation; "ask about
this" context links from Watchlist, Portfolio, Morning Brief (`M4-002`
§4.10). **Exit points:** back to the originating screen, or the
specific evidence source the answer cites (`M4-002` §5.8).

**Why every section exists:** the direct-answer-first Primary region
exists because Constitution §11.2 requires the Assistant to lead with
the conclusion, mirroring §12.1's story-before-chart discipline applied
to conversational language. Confidence/uncertainty exists because
§11.4/§6.5 forbid collapsing the four-part taxonomy into one casual
number in conversation, exactly as strictly as anywhere else in the
product. History is Peripheral, never Primary, because a past exchange
does not change the trader's current answer (D1-005 §3.3).

------------------------------------------------------------------------

# 2. Low-Fidelity Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ PRIMARY NAVIGATION                                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PRIMARY — Trader's Question + Assistant's Direct Answer    │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Secondary — Evidence & Reasoning behind the answer          │    │
│  │  nested Confidence & Uncertainty (per D2-005/Design         │    │
│  │  Constitution rule 8, identical treatment)                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Question input (single field, always visible)              │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Peripheral — Conversation History (collapsed by default)   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. UX & Behavioral Review

**Reviewed (Behavioral Economics / Trust):** does an always-visible
input risk inviting low-effort, unconsidered questions that could
themselves feed a compulsive re-checking loop (Constitution §7.5)?
**Finding:** no genuine weakness — asking a question is itself a
deliberate, low-stakes act (D1-002 §12.1); the risk this rule actually
targets is *variable reward for asking*, which does not exist here (no
streak, no badge for questions asked, per Constitution §3.2/§7.5).

**Reviewed (HCI / Working Memory):** could conversation history,
if shown expanded by default, push density past the Low tier this
Archetype requires (D1-002 §4.4)? **Finding — genuine weakness.** An
initial draft rendering the full running transcript inline would add
unbounded content below the current exchange, directly risking
`M4-003.1` §2.6's own already-identified failure mode (unbounded
Peripheral content read as clutter). **Fix applied:** history is
collapsed by default, reachable via a single deliberate action — never
auto-expanded, mirroring the Peripheral-row consolidation precedent
already established for Dashboard.

**Reviewed (Trading Psychology / Overconfidence):** could a fluent,
conversational answer read as more certain than a static disclosure
would (a known risk of natural-language interfaces — fluency itself can
be mistaken for confidence, distinct from any claim this document makes
about the underlying model)? **Finding — genuine weakness.** Natural
language is inherently harder to visually "cap" than a numeric
Confidence badge. **Fix applied:** the Assistant's own answer text is
never permitted to state a confidence-sounding qualifier ("definitely,"
"certainly") that isn't backed by the disclosed Confidence value —
enforced as a binding constraint on this screen's own language
generation (Constitution §11.4, §11.1's calm/precise register), not
merely a visual-layer fix, since the risk here is linguistic, not
typographic.

------------------------------------------------------------------------

# 4. Psychology Validation

| Block | Helps trader? | Why it exists | Cognitive/behavioral/emotional influence |
|---|---|---|---|
| Direct answer (Primary) | Yes — answers the specific question asked, immediately | Constitution §11.2 | *Cognitive:* low — one direct statement. *Behavioral:* discourages re-asking the same question repeatedly for reassurance. *Emotional:* engaged, assured (ZXL §9, AI Workspace). |
| Evidence/reasoning (Secondary) | Yes — makes the answer traceable | Constitution §4.1, §11.3 | *Cognitive:* moderate, opt-in via reading. *Behavioral:* supports verification over blind trust. *Emotional:* builds calibrated, not blind, trust (Constitution §6.3). |
| Confidence/uncertainty | Yes — prevents the fluency-as-certainty risk (§3) | Constitution §6.5, §11.4 | *Cognitive:* low, familiar pattern reused from Dashboard. *Behavioral:* counters overconfidence. *Emotional:* calibrated confidence. |
| Question input | Yes — the entire point of the screen | Constitution §10.2 | *Cognitive:* minimal. *Behavioral:* a deliberate act, not a passive feed. *Emotional:* neutral. |
| Conversation history (Peripheral) | Yes, narrowly | Continuity across a session | *Cognitive:* zero by default (collapsed). *Behavioral:* none coercive. *Emotional:* none. |

No block fails; none removed.

------------------------------------------------------------------------

# 5. Learning Loop Validation

| Section | Stage(s) | Why |
|---|---|---|
| Direct answer + evidence | **Understand, Decide** | Same reasoning as Dashboard's `DASH-002`/`003` (`M4-003` §9) — a second path into the identical two stages, for a trader who prefers asking over reading a synthesized statement. |
| Question input | **Decide** (enabling mechanism) | It is how the trader initiates a Decide-stage inquiry; not itself a distinct stage. |
| Conversation history | **Reflect** (partial, forward-looking) | A trader's own past questions are raw material for future Journal-linked reflection (`M4-002.2` Learning Loop §3, Reflect) once Journal exists to receive it (Blueprint §2, AI Workspace Exit Points: "record the AI's own disclosed reasoning as part of a decision entry, once Journal exists") — disclosed as a future bridge, not claimed as already-served, per the same honesty discipline `M4-003` §9 applied to `DASH-007`/`008`. |

Every section maps to at least one stage.

------------------------------------------------------------------------

# 6. High-Fidelity Specification

| Aspect | Assignment |
|---|---|
| Typography | Question text: `text.body`. Assistant's direct answer: `text.heading` (largest on-screen text, marking Primary per D1-002 §1.3). Evidence/reasoning: `text.body`. Confidence/uncertainty: `text.caption`, identical weight both halves. History entries: `text.caption`/`text.micro`. |
| Spacing | Answer-to-evidence gap: `space.24`. Input field isolation from answer above: `space.32`. History row spacing: `space.8`–`12` (D2-004 §8, Medium density). |
| Elevation/Radius | Primary answer region: Panel (D2-005 §3), `elevation.0`, no radius (mirrors `M4-003.2` §4's corrected Panel rule). Question input: Input component (D2-005 §5), always-visible label, never placeholder-only. History (collapsed): single low-weight container, `elevation.0`, `radius.md`, mirroring the Dashboard Peripheral-row consolidation pattern. |
| Color tokens | Standard `surface`/`text` tokens; no accent-colored answer bubble (would misapply the accent hue's "you can act here" meaning, D1-003 §3, mirroring `M4-003.2` §1.1's rejected-hero-color finding). |
| States | Loading (Assistant composing): Skeleton or Loading indicator (D2-005 §16, calm/continuous, never energetic). Empty (no question asked yet): factual prompt, never gamified ("Ask me anything! 🚀" is explicitly rejected — ZXL §8, never exciting). Error (Reasoning Layer unavailable): `signal.warn`/`critical` per D1-002 §14.4. |
| Interaction | Submitting a question: low-stakes but not instant-feedback-free — the answer takes the time it takes to compose correctly (D1-002 §12.2's Decision Velocity applies to the *system's* own pace here, not artificial friction). Expanding history: low-stakes, frictionless. |
| Motion | `motion.duration.default` for answer reveal; no flash on arrival regardless of how urgent the underlying evidence is (D1-002 §5.3, §6.1). |
| Accessibility | Question input has a persistent visible label (D2-005 §5); answer announced as one coherent block, not fragmented (mirrors `26` §3 DASH-002 Accessibility); confidence/uncertainty as one semantic unit (D2-007 §6.2); history region reachable but not in the default tab sequence ahead of the input (D2-007 §2.2 — reading order still governs). |

------------------------------------------------------------------------

# 7. Component Mapping

| Component | D2 Tokens | Typography | Spacing | Component Foundation | Accessibility | Interaction |
|---|---|---|---|---|---|---|
| Direct answer region | `surface.base` | `text.heading` | `space.24` to evidence | Panel (D2-005 §3) | Coherent-block announcement | Read-only |
| Evidence/reasoning | `surface.base`, `text.body` | `text.body` | inherits parent | Sub-content of Panel | Announced in reading order | Optional drill-in to Traceability |
| Confidence/uncertainty | `text.caption` | `text.caption` | `space.24` from answer | Sub-content, no separate component | One semantic unit | Optional drill-in |
| Question input | `border.default`/`border.emphasis` (focus) | `text.body` | `space.32` isolation | Input (D2-005 §5) | Persistent visible label | Text entry, low-stakes submit |
| Conversation history | `text.muted`, `opacity.disabled` for older entries if needed | `text.caption`/`text.micro` | `space.8`–`12` | Consolidated low-weight container | Reachable, not auto-expanded | Expand on deliberate action |

------------------------------------------------------------------------

# 8. Acceptance Review

- **Trust?** Yes — same evidence-before-conclusion discipline as every
  other screen, plus the added linguistic-fluency safeguard (§3).
- **Reduce stress?** Yes — collapsed history avoids unbounded visual
  clutter; no urgency language permitted (Constitution §11.1).
- **Improve decision quality?** Yes — a second, on-demand path to
  Understand/Decide, never a shortcut around evidence.
- **Comfortable after 6–10 hours?** Yes — identical token set to
  Dashboard and Morning Brief; no screen-specific exception.
- **Strengthens Zenith philosophy?** Yes — explainability over
  automation (Constitution §4.2) is this screen's entire reason to
  exist.
- **Strengthens the Learning Loop?** Yes — Understand/Decide directly;
  a disclosed, honest bridge toward Reflect.

**Weakness identified in this pass:** the fluency-as-confidence risk
(§3) was genuine and is now a binding language constraint, not merely
a visual one — flagged explicitly since it cannot be fully verified at
the architecture-documentation level (it depends on actual generated
text at implementation time); a future implementation-time review
against this constraint is recommended, not performed here.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §3, §4, §6.5, §11
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §2.4
- `documentation/zos/D2-002_COLOR_SYSTEM.md`, `D2-003`, `D2-004`, `D2-005`, `D2-007`
- `documentation/zos/25_PRODUCT_BLUEPRINT.md` §2, §6, §7
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` §3 (`DASH-008`)
- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4.10, §5.8
- `documentation/zos/M4-002.2_TRADER_DECISION_JOURNEY.md` (Learning Loop)
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` through `M4-003.3` (binding design reference)
