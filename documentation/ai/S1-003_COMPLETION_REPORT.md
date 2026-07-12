# S1-003_COMPLETION_REPORT

**Document ID:** AI-016
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Structured completion report for Sprint S1-003 — Trading Catalog & User Watchlist Foundation, prepared per `10_AI_ENGINEER_GUIDE.md`'s required report structure and `07_ENGINEERING_WORKFLOW.md`, following the same pattern as `S1-002_COMPLETION_REPORT.md` (AI-015).

# Sprint ID

S1-003 — Trading Catalog & User Watchlist Foundation

# Status

Complete and independently verified.

# Objectives Completed

Per `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md` Scope (items 1–7): six Prisma models (`Exchange`, `Market`, `Asset`, `Watchlist`, `WatchlistItem`, `FavouriteAsset`) with a migration applied to PostgreSQL; CRUD APIs for all six entities with catalog reads open to any authenticated user and catalog mutations restricted to `ADMIN` (per DEC-2026-004); watchlist/favourite endpoints strictly scoped to the requesting user; Zod validation for every create/update payload; a new `@Roles()` decorator and `RolesGuard`; full Swagger documentation of all sixteen new endpoints; and test coverage for creation, duplicate-conflict, ownership-boundary, validation-rejection, and role-gating across all six entities.

# Files Created

`apps/api/src/exchanges/{exchanges.module.ts,exchanges.controller.ts,exchanges.service.ts,exchanges.service.spec.ts}`; `apps/api/src/markets/{markets.module.ts,markets.controller.ts,markets.service.ts,markets.service.spec.ts}`; `apps/api/src/assets/{assets.module.ts,assets.controller.ts,assets.service.ts,assets.service.spec.ts}`; `apps/api/src/watchlists/{watchlists.module.ts,watchlists.controller.ts,watchlists.service.ts,watchlists.service.spec.ts}`; `apps/api/src/favourites/{favourites.module.ts,favourites.controller.ts,favourites.service.ts,favourites.service.spec.ts}`; `apps/api/src/auth/{roles.decorator.ts,roles.guard.ts,roles.guard.spec.ts}`; `apps/api/src/common/prisma-errors.ts`; `packages/database/prisma/migrations/20260712123918_add_trading_catalog_and_watchlists/`; `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`.

# Files Modified

`packages/database/prisma/schema.prisma` (added `Exchange`, `Market`, `Asset`, `Watchlist`, `WatchlistItem`, `FavouriteAsset` models and `MarketType` enum; added inverse relations on `User`); `packages/validation/src/index.ts` (added create/update schemas for all six entities); `apps/api/src/app.module.ts` (registered the five new modules); `apps/api/src/auth/auth.module.ts` (added and exported `RolesGuard`); `apps/api/src/main.ts` (updated Swagger description); `apps/api/src/users/users.service.ts` (refactored to reuse the new shared `isUniqueConstraintViolation` helper instead of an inline P2002 check — behavior unchanged, duplication removed); `documentation/zos/11_DECISION_LOG.md` (added DEC-2026-004).

# Dependencies Added

None. The `RolesGuard` is built entirely from `@nestjs/common`'s existing `Reflector`/`SetMetadata`, already part of the installed NestJS core. No new runtime or development dependency was introduced, consistent with this Sprint Brief's Dependencies section.

# Architecture Changes

None. This sprint introduces no new ADR. DEC-2026-004 applies the `Role` enum already approved as part of S1-002's `User` model to new catalog-mutation routes; it does not introduce a new authentication mechanism, a new role, or a new database field.

# FACTS

- Full clean-room verification was performed twice in this session: `rm -rf node_modules` (all workspaces) → `pnpm install --frozen-lockfile` → `pnpm turbo run build lint test --force` (cache bypassed to force real execution, not cache replay), both times 13/13 tasks passing and 45/45 tests passing (10 test suites, including 5 new service specs and a new `RolesGuard` spec).
- Live runtime verification was performed against a real local PostgreSQL instance with two registered traders and one database-promoted `ADMIN` test user (see Manual Actions Required):
  - Confirmed `JwtStrategy.validate()` resolves the live, current role from the database on every request (not a stale JWT claim) — an admin promotion took effect immediately on the next request without reissuing a token.
  - Confirmed non-admin and unauthenticated catalog-mutation attempts are rejected (403 and 401 respectively), while admin mutation and universal read access succeed.
  - Confirmed all sixteen new endpoints are present and correctly tagged in the live Swagger document (`/api/docs-json`), consistent with the S1-001/S1-002 precedent for Swagger coverage (endpoint presence, tags, security; full request-body schema generation was not wired up in prior sprints either, via the `@nestjs/swagger` CLI plugin, and remains out of scope here as a pre-existing, non-regressed gap).
  - Confirmed ownership scoping: a second trader attempting to read, update, delete, or add items to the first trader's watchlist, or remove the first trader's favourite, receives `404 Not Found` in every case — never `403` and never the other user's data — verified directly against the two independent trader accounts.
  - Confirmed duplicate-creation rejection (409) for exchange codes, market names within an exchange, asset symbols within a market, watchlist names per user, watchlist items, and favourites.
  - Confirmed malformed/invalid input handling: invalid JSON body (400, not 500), missing required fields (400 with field errors), invalid UUID format (400), invalid enum value (400), non-existent parent FK (`exchangeId`/`marketId`) on creation (404, not a raw foreign-key-constraint 500), and non-existent or malformed path IDs on lookup (404, not 500).
  - Confirmed symbol/code normalization: asset symbols and exchange codes are uppercased by the validation schema regardless of input casing.
  - Confirmed cascade-delete integrity: deleting a catalog asset that is referenced by a trader's watchlist item correctly removes the dependent `WatchlistItem` row (via the schema's `onDelete: Cascade`) without error; a second delete of the same already-deleted asset returns a clean 404, not a 500.
  - Confirmed SQL-injection-style input (e.g. a watchlist name containing `'; DROP TABLE "User"; --`) is stored as an inert string via Prisma's parameterized queries; the `User` table was unaffected.
  - Confirmed regression-free S1-001/S1-002 behavior: health check, unauthenticated-401 on protected routes, duplicate-email rejection, and wrong-password login all continue to behave identically.
- **One real bug was found and fixed during active adversarial review, not assumed absent:** in every controller that combined a route parameter (`@Param('id')`) with a method-level `@UsePipes(new ZodValidationPipe(schema))` decorator (the `update()` handlers on `ExchangesController`, `MarketsController`, `AssetsController`, `WatchlistsController`, and `WatchlistsController.addItem()`), NestJS applies a method-level pipe to *every* pipe-eligible parameter, not just `@Body()`. This meant the route's `id` string was also being validated against the body's Zod schema, producing a spurious `400 "Expected object, received string"` on every legitimate update/add-item request — a defect that would have made all six entities' update endpoints (and watchlist item addition) unusable in practice, despite passing unit tests (the unit tests called the service layer directly, bypassing the controller/pipe wiring, so they did not catch it). Found by exercising the live HTTP routes end-to-end, not by re-running unit tests. Fixed by scoping each `ZodValidationPipe` instance to the `@Body()` parameter directly (`@Body(new ZodValidationPipe(schema))`) instead of applying it at the method level, and removing the now-unnecessary `@UsePipes` decorators; the `FavouritesController.create()` handler (which had no route parameter and was therefore unaffected) was refactored to the same pattern for consistency and to prevent the same class of regression if a parameter is added later. Verified fixed by re-running the full clean-room build/lint/test cycle (still 13/13, 45/45) and re-exercising every previously-broken route live: exchange/market/asset updates, watchlist rename, and watchlist item addition all now succeed as expected, while ownership and role checks on those same routes continue to reject correctly.
- Race-condition hardening was verified live, not just implemented and assumed correct: 5 truly concurrent HTTP requests creating an exchange with the same unique code resulted in exactly 1 success (201) and 4 clean 409s, with exactly 1 row persisted in PostgreSQL; the same test repeated for concurrent watchlist-item creation (same asset, same watchlist) produced exactly 1 success and 4 clean 409s, with exactly 1 row persisted.

# INFERENCES

- None beyond what was already recorded in the S1-001/S1-002 completion reports regarding standard NestJS supporting APIs (`Reflector`, `SetMetadata`) being part of the already-approved `@nestjs/common`/`@nestjs/core` dependency, not a new dependency.

# ASSUMPTIONS

None.

# Issues Found

Documented in FACTS above: the method-level `@UsePipes` scope bug (found, fixed, and re-verified live across all affected routes) and confirmation, via adversarial testing, that race conditions, duplicate creation, authorization bypass, malformed payloads, validation edge cases, ownership leaks, invalid IDs, and concurrent requests are all handled correctly.

# Manual Actions Required

Per this Sprint Brief's Missing Decisions section: no API exists to create or promote an `ADMIN` user (intentionally deferred — a user-management concern, not a trading-catalog concern). For this sprint's own verification, one test user's role was promoted to `ADMIN` directly via a manual SQL `UPDATE` against the local development database, solely to exercise and verify the role-gated catalog-mutation endpoints; this is not a product feature and does not persist as application behavior. Local development still requires an engineer's own `apps/api/.env` and a running PostgreSQL instance, per `.env.example` — unchanged from S1-001/S1-002, not a new requirement.

# Awaiting Architecture Team Instructions

None — implementation, hardening, and full verification are complete. This report documents that outcome for Architecture Review.

# Executive Summary

S1-003's Trading Catalog & User Watchlist Foundation is complete: the trading universe (exchanges, markets, assets) now exists as shared, `ADMIN`-governed reference data, and traders can curate a personal view of it (watchlists, watchlist items, favourite assets) with strict per-user ownership boundaries enforced by a 404-on-mismatch pattern that avoids leaking other users' resource IDs. The implementation was hardened against issues found through active adversarial testing — including a real controller-wiring defect that would have broken every update endpoint in practice despite passing unit tests — and verified end-to-end against a real database under normal, concurrent, and adversarial conditions. No unauthorized scope was introduced (Positions, Portfolio, Orders, and all other deferred capabilities remain untouched); no new architecture or dependency was introduced; no secrets were committed. S1-001 and S1-002 functionality continues to pass without regression.

# Related Documents

- `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md`
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-004)
- `documentation/ai/S1-002_COMPLETION_REPORT.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
