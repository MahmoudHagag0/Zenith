# 08_ROADMAP

**Document ID:** ZOS-008\
**Version:** 1.1.0\
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
