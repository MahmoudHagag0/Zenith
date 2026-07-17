# ZOS Document Index

**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This index serves as the central directory for the Zenith Operating System (ZOS) documentation suite. It provides a structured overview of all architectural, operational, and engineering specifications.

# Document Registry

| ID | Document Name | Description |
|:---|:---|:---|
| 00 | 00_INDEX.md | Master directory and document status tracker. |
| 09 | 09_PROJECT_BRAIN.md | Core logic, state management, and cognitive architecture. |
| 17 | 17_RELEASE_PROCESS.md | Deployment, versioning, and approval workflows. |
| 18 | 18_PROJECT_GLOSSARY.md | Standardized terminology and definitions. |
| 19 | 19_ONBOARDING_GUIDE.md | Procedures for integrating new engineers and AIs. |
| 20 | 20_AI_BOOT_SEQUENCE.md | Initialization protocols for AI cognitive layers. |
| 22 | 22_ANALYSIS_ENGINE_ARCHITECTURE.md | Analysis Engine architecture: Indicator Engine, Swing Detection, Regime/Context Service, Analysis Provider Framework, Confluence Engine. |
| 23 | 23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md | Formal closure of the Analysis Provider Architecture Phase (S1-007--S1-018): Architecture Review, extensibility validation, known limitations, next-phase recommendation. |
| 24 | 24_ZENITH_PRODUCT_CONSTITUTION.md | Zenith Product Constitution v1.0 — the highest project authority on product philosophy, trader psychology, design, and AI persona. Peer to 06_PROJECT_CONSTITUTION.md (engineering-process authority), not subordinate to it. |
| 25 | 25_PRODUCT_BLUEPRINT.md | Product Blueprint v1.0 — the implementation execution map converting the Product Constitution into product areas, flows, dependencies, MVP scope, and implementation order. No UI, no visual design. |
| 26 | 26_DASHBOARD_HOME_SPECIFICATION.md | Dashboard (Home) Experience Specification — the Golden Reference Sprint component architecture for Dashboard, translating the Constitution/Blueprint into an 11-component hierarchy. No UI, no visual design. |
| 27 | 27_ZENITH_EXPERIENCE_LANGUAGE.md | Zenith Experience Language v1.0 — the experience layer between the Product Constitution and implementation specifications: Attention Hierarchy, Decision Flow, Cognitive Load, Calm Interface, Trust, Decision Psychology, Language Philosophy, Component Psychology, Experience Principles. No visual design. |
| 28 | 28_LIVE_DATA_BLUEPRINT.md | Live Data Platform Blueprint v1.1 — architecture and provider-selection specification for all future Live Data Sprints (`L1-001` onward): Data Domain Inventory, Provider Research/Comparison Matrix, Live Data Architecture, Cache/Synchronization/Security/Cost Strategy, Implementation Roadmap, Final Recommendation, plus the v1.1 Addendum (Data Quality Layer, Provider Priority Matrix, SLA & Freshness Matrix, Versioning Strategy, Future Streaming Architecture, Data Confidence Engine). Authorizes no implementation on its own. |
| D1-001 | D1-001_UX_PSYCHOLOGY_RESEARCH.md | Milestone M4 (Design Foundation) research base — consolidated, evidence-classified UX/HCI/cognitive/behavioral psychology findings underlying the Design Foundation Package. No visual design. |
| D1-002 | D1-002_DESIGN_CONSTITUTION.md | Milestone M4 — operational elaboration of Constitution §14's eight Design Constitution rules into implementation-ready sub-rules (attention, color, typography, whitespace, motion, anti-urgency, confidence/uncertainty parity, consistency, accessibility, iconography, responsive behavior). Does not amend §13/§14. No visual design. |
| D1-003 | D1-003_COLOR_BEHAVIOR_SYSTEM.md | Milestone M4 — color token architecture (neutral scale, single accent, signal vocabulary, directional/financial-data treatment, light/dark mode strategy). No final hex values, no components. |
| D1-004 | D1-004_DESIGN_SYSTEM_FOUNDATION.md | Milestone M4 — typography scale, spacing scale, grid/breakpoints, motion/timing, elevation, and iconography tokens. No components, no screens. |
| D1-005 | D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md | Milestone M4 — navigation structure (sitemap level) and four reusable screen archetypes (Synthesis, List/Tracking, Record/Detail, Conversational) translating Attention Hierarchy/Decision Flow (ZXL §1–§2) into layout principles. No wireframes. |
| D2-001 | D2-001_DESIGN_TOKENS.md | Milestone M4 (Design System phase) — master token dictionary: color/typography/spacing (summarized, full detail in D2-002–004) plus radius, elevation, border, motion, duration, opacity, and z-index tokens defined in full. No components, no screens. |
| D2-002 | D2-002_COLOR_SYSTEM.md | Milestone M4 — concrete color palette implementing D1-003's color behavior rules: primary/secondary/neutral palettes, semantic colors, surface/border/text levels, interaction states, charts palette, and the explicit no-Bloomberg/TradingView/MetaTrader-style directional-data decision. Reference values pending WCAG validation. |
| D2-003 | D2-003_TYPOGRAPHY_SYSTEM.md | Milestone M4 — concrete implementation of D1-004's type scale: font hierarchy, line heights, letter spacing, reading width, numeric typography, financial table conventions, monospace usage. |
| D2-004 | D2-004_SPACING_LAYOUT_SYSTEM.md | Milestone M4 — concrete implementation of D1-004's spacing scale and D1-005's layout principles: 8pt spacing philosophy, grid system, breakpoints, container widths, safe areas, content width and information density rules. |
| D2-005 | D2-005_COMPONENT_FOUNDATIONS.md | Milestone M4 — architectural foundations (anatomy, states, governing constraints) for 18 reusable component families (buttons through toast). No visual mockups, no component library code. |
| D2-006 | D2-006_DATA_VISUALIZATION_SYSTEM.md | Milestone M4 — visual language for charts, heatmaps, performance tables, KPIs, trade history, risk metrics, calendar/economic-event data, and portfolio metrics. States and enforces the no-saturated-red/green-candlestick decision. |
| D2-007 | D2-007_ACCESSIBILITY_GUIDE.md | Milestone M4 — consolidated accessibility rules (contrast, keyboard navigation, reduced motion, focus indicators, color blindness, screen reader considerations, typography accessibility). |
| M4-002 | M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md | Milestone M4 (Screen Architecture phase) — navigation philosophy, product map, navigation hierarchy, screen inventory (11 screens), major user flows, screen relationships/categories, Dashboard's architectural position, and navigation psychology. Architecture only: no wireframes, colors, typography, spacing, or components. |
| M4-002.2 | M4-002.2_TRADER_DECISION_JOURNEY.md | Milestone M4 (Screen Architecture phase) — the behavioral/psychological journey of a professional trader across a day, week, decision, and emotion: behavioral philosophy (habit vs. routine vs. dependency vs. addiction), daily/weekly journey, decision/emotional/cognitive journeys, habit formation, screen-sequence rationale, success criteria, and the closing Zenith Learning Loop (Observe→Understand→Decide→Execute[outside Zenith]→Record→Reflect→Learn→Improve→Repeat). No UI, no navigation redesign. |
| M4-003 | M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md | Milestone M4 (Dashboard Design phase) — Dashboard's information hierarchy, block priority, reading order, attention flow, entry/exit points, and per-block Zenith Learning Loop mapping. No wireframe, no visual design. |
| M4-003.1 | M4-003.1_DASHBOARD_WIREFRAME_SPECIFICATION.md | Milestone M4 (Dashboard Design phase) — Dashboard's low-fidelity structural wireframe, the UX/behavioral review performed against it (two fixes applied, one prior open `TODO` from `26` resolved), and the per-block Psychology Validation. No color, no components. |
| M4-003.2 | M4-003.2_DASHBOARD_HIGH_FIDELITY_SPECIFICATION.md | Milestone M4 (Dashboard Design phase) — the Color & Human Behavior Review performed before assignment, then Dashboard's concrete D2-series typography/spacing/elevation/color/state/interaction/motion/accessibility assignment and full component mapping. No new tokens or components introduced. |
| M4-003.3 | M4-003.3_DASHBOARD_PHILOSOPHY_VALIDATION.md | Milestone M4 (Dashboard Design phase) — Zenith Philosophy Validation and Professional Trader Review of the complete Dashboard Design Package; final validation summary and merge recommendation. APPROVED — official design reference for the entire platform. |
| M4-004 | M4-004_MORNING_BRIEF_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Morning Brief's full screen design (IA, wireframe, UX/behavioral review, psychology validation, Learning Loop mapping, D2 specification, component mapping, acceptance review), built on the approved Dashboard reference. |
| M4-005 | M4-005_AI_WORKSPACE_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — AI Workspace's full screen design; the sole conversational/generative surface, distinct from Morning Brief's deterministic narrative. |
| M4-006 | M4-006_PORTFOLIO_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Portfolio's full screen design, including the full Trading Analytics surface (P&L, risk, Health Score, Decision Readiness, Data Quality). Resolves "Analytics" as not a separate approved product area. |
| M4-007 | M4-007_WATCHLIST_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Watchlist's full screen design, including tracked-instrument add/remove management not present on Dashboard's own snapshot. |
| M4-008 | M4-008_TRADING_JOURNAL_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Trading Journal's full screen design (P1); the sole screen performing Record/Reflect/Learn in full. |
| M4-009 | M4-009_CALENDAR_NEWS_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Calendar/News's full screen design as one combined screen with Calendar and News Secondary Navigation sub-views, matching the approved single product area and live implementation. |
| M4-010 | M4-010_COT_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — COT's full screen design; raw institutional-positioning evidence, deliberately never styled with gain/loss color tokens. |
| M4-011 | M4-011_REPORTS_SCREEN_DESIGN.md | Milestone M4 (Screen Design phase) — Reports's full screen design; sibling to COT within the same approved area, distinct structured report content. |
| -- | ZENITH_AI_SYSTEM_PROMPT.md | Core behavioral and operational constraints. |
| -- | ZENITH_MASTER_CONTEXT.md | Global project background and architectural vision. |
| -- | SPRINT_BRIEF_TEMPLATE.md | Standardized format for sprint planning. |
| -- | NOVA_STARTUP_PACKAGE.md | Pre-configured environment for Nova-class entities. |

# Related Documents

- All ZOS modules (see Document Registry above).
