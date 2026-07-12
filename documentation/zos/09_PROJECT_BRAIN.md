# 09_PROJECT_BRAIN

**Document ID:** ZOS-009\
**Version:** 1.0.0\
**Status:** Living Document\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

Project Brain is the live operational memory of Zenith. Unlike the other
ZOS documents, this file is updated after approved sprint closures and
always reflects the current project state.

# Current Status

## Project

-   Name: Zenith
-   Version: 0.1.0
-   Current Milestone: M1 — Core Platform — In Progress (first two increments, S1-002 User Management and S1-003 Trading Catalog & User Watchlist Foundation, complete; business services and full authorization refinement not yet started)
-   Current Phase: Phase 1 — Engineering Foundation
-   Current Sprint: None active — S1-003 is closed; no subsequent Sprint Brief has been proposed or approved

## Completed Sprints

-   S1-001 — Foundation Setup. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-001_COMPLETION_REPORT.md`. Final implementation commit: `f29785a`.
-   S1-002 — User Management Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-002_COMPLETION_REPORT.md`. Final implementation commits: `6abeafc`, `5325c44`.
-   S1-003 — Trading Catalog & User Watchlist Foundation. Closed 2026-07-12. Sprint Brief: `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`. Completion Report: `documentation/ai/S1-003_COMPLETION_REPORT.md`. See the Sprint Brief's Sprint Closure section for final implementation commits.

## Active Modules

-   API (`apps/api`) — NestJS foundation: health check, Swagger, Pino logging, JWT authentication with real user registration/login (Argon2id); trading catalog (exchanges, markets, assets) with `ADMIN`-gated mutation and open read; user watchlists, watchlist items, and favourite assets with strict per-user ownership scoping.
-   Web (`apps/web`) — Next.js foundation.
-   Database (`packages/database`) — Prisma client with `User`, `Exchange`, `Market`, `Asset`, `Watchlist`, `WatchlistItem`, `FavouriteAsset` models (identity, trading catalog, and watchlist/favourite domains; no position/portfolio/order models yet).
-   Shared Packages (`packages/{tooling,types,utils,validation}`).
-   Documentation (`documentation/zos`, `documentation/ai`).

## Pending Work

-   No approved Sprint Brief beyond S1-003; the remaining M1 areas (positions/portfolio, business services, full authorization refinement, core APIs) have not been proposed or approved.
-   Non-blocking deviations accepted at S1-001, S1-002, and S1-003 closure (see Known Technical Debt).

## Architecture Decisions

-   ADR-001 — JWT-Based Authentication (S1-001 Foundation). Approved 2026-07-11. See `12_ADR_INDEX.md`.
-   ADR-002 — Argon2id Password Hashing (S1-002 User Management). Approved 2026-07-12. See `12_ADR_INDEX.md`.
-   No new ADR was created for S1-003; catalog-mutation authorization applies the existing `Role` enum via DEC-2026-004 (see `11_DECISION_LOG.md`), which does not introduce new architecture.

## Known Technical Debt

-   Formal per-dependency `14_DEPENDENCY_POLICY.md` review was not run individually for S1-001/S1-002's supporting libraries (e.g. `nestjs-pino`, `@nestjs/passport`, `argon2`). Owner: Architecture Team. Planned resolution: address in a future dependency audit; accepted as non-blocking at S1-001 and S1-002 closure.
-   Automated test coverage now includes health, auth, user-registration/login, trading catalog, and watchlist/favourite flows, but `apps/web` still has no automated tests. Owner: next implementation sprint. Planned resolution: expand alongside future feature work.
-   Extended user profile fields (for personalized trading data, performance analysis, risk insights) and compliance/KYC/session-policy considerations were intentionally deferred at S1-002 — see `documentation/zos/sprints/S1-002_SPRINT_BRIEF.md`, Missing Decisions section.
-   No API exists to create or promote an `ADMIN` user; S1-003 intentionally deferred this as a user-management concern, not a trading-catalog concern — see `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`, Missing Decisions section.
-   Catalog data seeding/ingestion strategy (how real-world exchange/market/asset data is sourced and kept current at scale) was intentionally deferred at S1-003 — see the same Missing Decisions section.

## Known Risks

-   None currently acknowledged beyond the Known Technical Debt items above.

## Blockers

-   None currently active.

## Open Questions

-   None currently pending Architecture Team decision.

# Update Policy

Project Brain may be updated only after:

-   Sprint approval
-   Architecture review
-   Milestone review
-   Approved architectural decisions

Implementation engineers must never modify this document directly.

# Related Documents

-   07_ENGINEERING_WORKFLOW.md
-   08_ROADMAP.md
-   10_AI_ENGINEER_GUIDE.md
-   20_AI_BOOT_SEQUENCE.md
