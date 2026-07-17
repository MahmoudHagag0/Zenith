# 08_ROADMAP

**Document ID:** ZOS-008\
**Version:** 1.5.0\
**Status:** Approved\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This roadmap defines the high-level evolution of the Zenith project. It
provides strategic direction while allowing sprint-level planning to
evolve over time.

# Roadmap Structure

-   Milestones
-   Phases
-   Sprints

# Milestone M0 --- Foundation

Objectives: - Monorepo setup - Backend foundation - Frontend
foundation - Database foundation - Authentication foundation - API
documentation - Engineering standards - ZOS establishment

Status: Complete (all eight objectives satisfied via Sprint S1-001,
closed 2026-07-12; see `documentation/zos/09_PROJECT_BRAIN.md`)

# Milestone M1 --- Core Platform

Planned focus: - User management - Trading domain - Business services -
Authorization refinement - Core APIs

Status: In Progress. User management, trading catalog, portfolio/position
management, market data, and trading analytics (Sprints S1-002--S1-006)
are complete. Within this Milestone, an internal Analysis Engine and a
nine-Provider Analysis Provider Architecture Phase (Sprints S1-007--S1-018)
were additionally completed and formally closed 2026-07-14 -- see
`documentation/zos/23_ANALYSIS_PROVIDER_PHASE_COMPLETION.md`. The
originally-planned Business Services scope, full authorization
refinement, and Core APIs remain not yet started; which of these, or a
Consumer of the now-closed Analysis Engine, is prioritized next is a
pending Architecture Team decision (see `09_PROJECT_BRAIN.md`, Open
Questions).

# Milestone M2 --- Product Expansion

Planned focus: - Advanced features - Integrations - Performance -
Monitoring - Operational tooling

Status: In Progress. Phase 2 (leadership-driven, non-Sprint product
definition — `24_ZENITH_PRODUCT_CONSTITUTION.md`,
`25_PRODUCT_BLUEPRINT.md`, `26_DASHBOARD_HOME_SPECIFICATION.md`,
`27_ZENITH_EXPERIENCE_LANGUAGE.md`, all frozen) resolved the Open
Question left by M1's own closure: the Analysis Engine's first Consumer
is the Dashboard. Sprint S1-019 (Dashboard Backend Foundation) — a
Confluence Engine Consumer and the Decision Center backend powering
Dashboard's own `DASH-002` — is complete, per
`documentation/zos/sprints/S1-019_SPRINT_BRIEF.md`. Sprint S1-020
(Morning Brief Backend / Narrative Composer) — Implementation Order
step 2, a deterministic template layer over S1-019's own output — is
also complete, per `documentation/zos/sprints/S1-020_SPRINT_BRIEF.md`.
Per `25_PRODUCT_BLUEPRINT.md` §10, Watchlist/Portfolio annotation
enrichment (steps 4-5) and Morning Brief's own full screen assembly
(step 6) are the next candidate work; no further Sprint has been
authorized by this update.

# Milestone M3 --- Live Data Platform

Planned focus: - Real market-data/calendar/news/COT provider integration
(replacing all Simulated providers behind their existing interfaces) -
Data Quality Layer - Provider Priority Matrix / failover - SLA &
freshness targets - Provider versioning strategy - Future streaming
architecture - Data Confidence Engine

Status: In Progress. The governing architecture and provider-selection
specification -- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028), Live Data
Platform Blueprint v1.1 -- was approved 2026-07-16, and implementation
is proceeding via the Blueprint's own §9 Implementation Roadmap
(Phases 0-9), one Sprint Brief per Phase, per
`10_AI_ENGINEER_GUIDE.md`'s Required Workflow.

Completed: Phase 0 (Provider Access & Config Foundation) and Phase 1
(Live Market Data Provider), merged into a single Sprint at the
Architecture Team's direction -- Sprint `L1-001`; Phase 2 (Market
Sessions & Trading Holidays) -- Sprint `L1-002`; Phase 3 (Economic
Calendar & Financial News) -- Sprint `L1-003`; Phase 4 (COT Live
Provider) -- Sprint `L1-004`; Phase 5 (Instrument Metadata, Symbol
Search & Classification) -- Sprint `L1-005`; Phase 6 (Corporate
Actions) -- Sprint `L1-006`. All six Sprints are Architecture-Team-approved
and merged to `main`; each is recorded as `Approved -- Live External
Verification Pending (Environment Constraint)` per
`documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` through
`L1-006_SPRINT_BRIEF.md` -- a documented environment egress-policy
limitation affecting every external provider integrated to date, not an
implementation defect.

Remaining: Phase 7 (Macro Context/FRED), Phase 8 (Monitoring, Alerting
& Cost Observability), Phase 9 (Live Data Acceptance Review) -- none
started; no Sprint Brief has been proposed for Phase 7 or later.

Progress: 7 of 10 Blueprint phases complete (~70%).

# Planning Rules

-   Only the Architecture Team approves milestones and sprint
    sequencing.
-   Implementation engineers must not choose future work.
-   Roadmap updates require Architecture Team approval.

# Related Documents

-   01_PROJECT_OVERVIEW.md
-   07_ENGINEERING_WORKFLOW.md
-   09_PROJECT_BRAIN.md
-   11_DECISION_LOG.md
-   28_LIVE_DATA_BLUEPRINT.md
