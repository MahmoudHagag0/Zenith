# 08_ROADMAP

**Document ID:** ZOS-008\
**Version:** 1.7.0\
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

Status: **Substantially complete; updated 2026-07-18 per the Final
Project State Audit, which compared the repository directly against
this Roadmap and found this entry stale.** Phase 2 (leadership-driven,
non-Sprint product definition — `24_ZENITH_PRODUCT_CONSTITUTION.md`,
`25_PRODUCT_BLUEPRINT.md`, `26_DASHBOARD_HOME_SPECIFICATION.md`,
`27_ZENITH_EXPERIENCE_LANGUAGE.md`, all frozen) resolved the Open
Question left by M1's own closure: the Analysis Engine's first Consumer
is the Dashboard. Sprint S1-019 (Dashboard Backend Foundation) and
Sprint S1-020 (Morning Brief Backend / Narrative Composer) are complete,
each with a filed Sprint Brief. Per `25_PRODUCT_BLUEPRINT.md` §10,
Watchlist/Portfolio annotation enrichment (steps 4-5) and Morning
Brief's own full screen assembly (step 6) were completed at S1-024
(2026-07-14). Beyond the Blueprint's original 4-area MVP scope, the
Product Constitution's full nine-area surface (§10.2) is now
implemented and live: Alerts (S1-030), Trading Journal (S1-029),
Calendar/News (S1-031 screen, live backend at L1-003), COT (S1-032
screen, live backend at L1-004), and AI Workspace (S1-033) join the
already-complete Dashboard/Home, Morning Brief, Watchlist, and
Portfolio; Reports (S1-034) and Foundation Hardening (S1-035) were
also delivered. **None of S1-021 through S1-035 (excepting S1-022/023/
024's own already-disclosed "execution over architecture" exception)
has a filed Sprint Brief, Task Breakdown, Completion Report, or
Decision Log entry**, and the Constitution §10.3 leadership approval
required for expanding beyond the original four-area MVP was never
filed either — see `09_PROJECT_BRAIN.md`'s Known Risks and Open
Questions for the full disclosure. This Milestone's remaining
originally-planned scope (further Business Services work, full
authorization refinement, generic Core APIs) has not been started.

# Milestone M3 --- Live Data Platform

Planned focus: - Real market-data/calendar/news/COT provider integration
(replacing all Simulated providers behind their existing interfaces) -
Data Quality Layer - Provider Priority Matrix / failover - SLA &
freshness targets - Provider versioning strategy - Future streaming
architecture - Data Confidence Engine

Status: **Complete.** The governing architecture and provider-selection
specification -- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028), Live Data
Platform Blueprint v1.1 -- was approved 2026-07-16, and implementation
proceeded via the Blueprint's own §9 Implementation Roadmap (Phases
0-9), one Sprint Brief per Phase, per `10_AI_ENGINEER_GUIDE.md`'s
Required Workflow. All ten phases are now complete and the Milestone is
formally closed. A `v1.0-live-data` annotated tag was created locally at
the closing commit, mirroring the `v1.0-foundation` precedent; pushing
it to `origin` was blocked by this session's own remote-push policy
(tag refs are rejected — only `refs/heads/*` branch updates are
permitted from this session), an environment/session constraint, not a
project defect. The tag push remains outstanding and should be
completed by whoever has full push access, or by a future session
without this restriction.

Completed: Phase 0 (Provider Access & Config Foundation) and Phase 1
(Live Market Data Provider), merged into a single Sprint at the
Architecture Team's direction -- Sprint `L1-001`; Phase 2 (Market
Sessions & Trading Holidays) -- Sprint `L1-002`; Phase 3 (Economic
Calendar & Financial News) -- Sprint `L1-003`; Phase 4 (COT Live
Provider) -- Sprint `L1-004`; Phase 5 (Instrument Metadata, Symbol
Search & Classification) -- Sprint `L1-005`; Phase 6 (Corporate
Actions) -- Sprint `L1-006`; Phase 7 (Macro Context/FRED) -- Sprint
`L1-007`; Phase 8 (Monitoring, Alerting & Cost Observability) -- Sprint
`L1-008`; Phase 9 (Live Data Acceptance Review) -- Sprint `L1-009`. All
nine Sprints are Architecture-Team-approved and merged to `main`; each
external-provider-integrating Sprint (L1-001 through L1-007) is
recorded as `Approved -- Live External Verification Pending
(Environment Constraint)` per its own Sprint Brief -- a documented
environment egress-policy limitation affecting every external provider
integrated to date, not an implementation defect. L1-008 introduced no
new external provider (`Approved -- Live External Verification Not
Applicable`). L1-009's Acceptance Review found the platform
production-ready with no blocking defects; see
`documentation/zos/sprints/L1-009_SPRINT_BRIEF.md` for the full review.

Progress: 10 of 10 Blueprint phases complete (100%).

# Milestone M5 --- Implementation Architecture

Planned focus: - Design token delivery mechanism (`packages/design-tokens`)
- Shared component library architecture (`packages/ui`) - Frontend
foundation architecture (Next.js App Router structure, layout/
navigation shell, state/caching/auth strategy)

Status: **Complete.** `M5-001_DESIGN_TOKENS_ARCHITECTURE.md`,
`M5-002_SHARED_COMPONENT_LIBRARY_ARCHITECTURE.md`, and
`M5-003_FRONTEND_FOUNDATION_ARCHITECTURE.md` specify
`packages/design-tokens` and `packages/ui`; both packages exist in the
monorepo, are consumed by `apps/web` via `workspace:*`, and were the
foundation Milestone M6 (Visual Identity Package, all four phases
Approved -- `M6-004_OFFICIAL_DESIGN_SYSTEM.md`) built on to produce
the live, shipped Dashboard A, whose own visual identity work is now
frozen (Dashboard A Design Freeze, merged to `main`). All three M5
documents previously carried a stale Status ("Proposed -- Awaiting
Product Leadership Review") that did not reflect this
already-implemented, already-in-production state; corrected
2026-07-18 as a documentation synchronization -- see each document's
own Documentation Synchronization Note. No new architectural review,
decision, or re-implementation was performed as part of this
correction.

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
-   M5-001_DESIGN_TOKENS_ARCHITECTURE.md
-   M5-002_SHARED_COMPONENT_LIBRARY_ARCHITECTURE.md
-   M5-003_FRONTEND_FOUNDATION_ARCHITECTURE.md
-   M6-004_OFFICIAL_DESIGN_SYSTEM.md
