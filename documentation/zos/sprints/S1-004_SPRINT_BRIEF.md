# S1-004 SPRINT BRIEF — Position & Portfolio Management Foundation

**Document ID:** ZOS-S1-004
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-004
- **Sprint Name:** Position & Portfolio Management Foundation
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`), third increment (Trading domain, continued)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** Architecture Team (2026-07-12 — see Approval Section)

---

# Sprint Objective

S1-003 gave Zenith a trading universe (exchanges, markets, assets) and a way for a trader to say what they follow (watchlists, favourites). Neither answers the question every later AI capability actually needs answered: **what does this trader own, and at what cost?** This sprint builds that answer. A trader can now open a `Portfolio`, record real buy and sell transactions against catalog `Asset`s, and see an accurate, continuously-maintained `Position` for each asset — quantity held, weighted average cost, and realized profit/loss from completed sales. This is not a trading-execution system and it is not a market-data feed; it is the bookkeeping foundation that makes a trader's portfolio a real, trustworthy record instead of an assumption.

**Why this matters to traders:** every serious trading decision a platform can eventually help with — "am I diversified?", "is this position profitable?", "how has my performance trended?", "what should I do next?" — is unanswerable without first knowing, accurately, what the trader bought, sold, and still holds. A platform that cannot correctly track cost basis and realized P/L cannot be trusted with anything built on top of it.

**What value it unlocks:** once positions and their cost basis exist as real, correctly-maintained records, every future capability — unrealized P/L (once market data exists), performance analytics, risk exposure, AI-driven portfolio insights — has real data to operate on instead of a guess. This sprint is the last purely-bookkeeping foundation before Zenith can start reasoning about a trader's actual financial position.

**Why remaining trading capabilities are intentionally deferred:** Live Market Data, Broker Integration, AI Analysis, Alerts, Performance Dashboards, Chart Rendering, and a Strategy Engine all describe either *acting* on a portfolio or *analyzing* it against external, real-time information. None of that is trustworthy until the portfolio itself is correctly and durably recorded. This sprint deliberately implements only the accounting foundation (quantity, average cost, realized P/L) — it does not decide how live prices are sourced, how unrealized P/L is displayed, or how AI reasons over a portfolio; those are each their own future decision, appropriately out of scope here.

The chain this sprint enables: **trading catalog (S1-003) → trader-curated watchlist (S1-003) → real owned positions with accurate cost basis (S1-004) → market-data-driven unrealized P/L → performance & risk analysis → AI-assisted guidance.** This sprint introduces no new architecture: it reuses the already-approved JWT authentication (ADR-001), the S1-003 ownership-scoping pattern (404-on-mismatch), and this sprint's own Decision Log entry (DEC-2026-005) governing financial-data precision and concurrency safety.

---

# Scope

Per the Architecture Team's directive, S1-004 is scoped to the Position/Portfolio accounting foundation only:

1. **Prisma models** in `packages/database`:
   - `Portfolio` — `id`, `userId` (FK → `User`), `name`, `createdAt`, `updatedAt`. Unique on `(userId, name)`. Strictly user-owned.
   - `Position` — `id`, `portfolioId` (FK → `Portfolio`), `assetId` (FK → `Asset`), `quantity`, `averageCost`, `realizedPnl` (all `Decimal`), `createdAt`, `updatedAt`. Unique on `(portfolioId, assetId)` — one running position per asset per portfolio. Not directly creatable/editable by the client; derived exclusively from buy/sell transactions.
   - `Transaction` — `id`, `positionId` (FK → `Position`), `type` (`TransactionType` enum: `BUY`, `SELL`), `quantity`, `price` (`Decimal`), `executedAt`, `createdAt`. An immutable, append-only audit record of every buy/sell.
2. **Database migration** applying this schema to PostgreSQL.
3. **Portfolio CRUD** — create, list, read, rename, delete; strictly scoped to the requesting user (404 on ownership mismatch, per the S1-003 precedent).
4. **Buy operation** — records a `BUY` transaction against a portfolio+asset, creating the `Position` if it does not yet exist, and recomputing `quantity` and weighted-average `averageCost`.
5. **Sell operation** — records a `SELL` transaction against an existing position, validating the sale does not exceed currently-held quantity (an impossible state), recomputing `quantity` and accumulating `realizedPnl`.
6. **Concurrency safety** — every buy/sell recomputation runs inside a database transaction that row-locks the position before reading/writing its running totals (per DEC-2026-005), so concurrent buy/sell requests for the same position cannot silently lose an update.
7. **Read APIs** — list positions in a portfolio (with computed current cost basis = quantity × averageCost), read one position, and read a position's transaction history.
8. **Validation** — Zod schemas for portfolio create/update and buy/sell payloads; rejection of non-positive quantity/price and of selling more than is held.
9. **Authorization** — every portfolio/position/transaction read and write resolves ownership through `Portfolio.userId`, using the same JWT-derived identity and 404-on-mismatch pattern established in S1-003. No new authorization mechanism.
10. **Swagger** — full OpenAPI documentation for all new endpoints.
11. **Tests** — unit tests for average-cost/realized-P/L arithmetic and validation, plus integration-style tests for ownership boundaries, oversell rejection, and concurrent buy/sell serialization.

---

# Non-Scope

Explicitly excluded from S1-004, per the Architecture Team's directive:

- **Live market data** — no external price feed of any kind; `averageCost` and `realizedPnl` are computed entirely from the trader's own recorded buy/sell prices.
- **Broker integration** — no connection to any external brokerage or execution venue; transactions are manually recorded by the trader, not executed.
- **Unrealized P/L (beyond its foundation)** — actual unrealized P/L requires a current market price, which does not exist in this sprint. This sprint exposes exactly the two ingredients a future market-data sprint needs (`quantity`, `averageCost`, and the computed `costBasis`) so unrealized P/L can be computed later without any change to this sprint's data model. No placeholder or fabricated price is introduced.
- **AI analysis, alerts, performance dashboards, chart rendering, and a strategy engine** — all depend on either live market data or on this sprint's positions already existing; each is its own future decision.
- **Direct position editing** — a client cannot directly set `quantity`, `averageCost`, or `realizedPnl`; these are exclusively derived from recorded buy/sell transactions, to guarantee the accounting always reconciles with the transaction history (see Missing Decisions for the one exception: deleting a fully-closed position).

Also explicitly out of scope, per Constitution Rule 1 and Rule 3:

- Any architecture change to `05_ARCHITECTURE.md`.
- Any technology not listed in `04_TECH_STACK.md` or an existing ADR.
- Any folder structure not defined in `13_FOLDER_STRUCTURE.md`.

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope:

- Source code implementing the eleven in-scope items listed above.
- Updated documentation where required.
- A completion report per the structure in `10_AI_ENGINEER_GUIDE.md`.
- A final assessment against this Sprint Brief's Acceptance Criteria and Definition of Done.

---

# Acceptance Criteria

- **Outcome:** a trader can build and maintain a portfolio — recording real buy and sell activity against catalog assets — and trust that the resulting quantity, average cost, and realized P/L are accurate, even under concurrent activity. The technical criteria below are how that outcome is verified.
- All three Prisma models exist with a migration applied against PostgreSQL, matching the approved schema exactly, using `Decimal` (not `Float`) for every financial field.
- A trader can create, read, rename, and delete their own portfolios; a second trader cannot read, modify, or delete another trader's portfolio, position, or transaction (404, not 403 or data leakage).
- A buy operation correctly creates or updates a position's quantity and weighted-average cost; the underlying arithmetic is verified against hand-computed expected values.
- A sell operation correctly reduces quantity, accumulates realized P/L, and is rejected (without partial effect) when the requested sale quantity exceeds the currently-held quantity.
- Two truly concurrent buy (or buy+sell) requests against the same position do not lose an update — the resulting quantity/average cost/realized P/L reflect both operations having been applied, verified by firing real concurrent HTTP requests against a live database.
- All new endpoints are documented in Swagger.
- New code has test coverage: cost-basis/P/L arithmetic, oversell rejection, ownership boundaries, and concurrent buy/sell serialization.
- All S1-001, S1-002, and S1-003 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: this sprint is complete only when scope is implemented, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated to reflect the sprint's closure, and the sprint has been formally closed.

---

# Dependencies

- A PostgreSQL instance for applying and verifying the new migration, per the same approach used in prior sprints.
- Reuses S1-001's JWT foundation and S1-003's ownership-scoping pattern — no re-decision needed for either.
- Reuses S1-003's `Asset` model as the referenced catalog entity for every position; a position cannot reference an asset that does not exist in the catalog.
- No new runtime or development dependency is anticipated; `Decimal` fields and interactive transactions are already part of the installed Prisma/PostgreSQL stack.

---

# Risks

- **Financial-correctness risk.** Incorrect average-cost or realized-P/L arithmetic would silently corrupt a trader's records. Mitigated by using `Decimal` arithmetic throughout (never native floating-point) and verifying calculations against hand-computed expected values.
- **Concurrency risk.** Two simultaneous buy/sell requests for the same position naively reading-then-writing stale totals would lose an update. Mitigated by row-locking the position within a database transaction before recomputing (DEC-2026-005), verified with real concurrent HTTP requests against a live database, not merely reasoned about.
- **Referential-integrity risk.** Deleting a catalog `Asset` that has open positions would silently destroy financial history if cascaded. Mitigated by restricting (not cascading) the `Position → Asset` foreign key, so such a delete is rejected with a clear error rather than silently destroying data.
- **Scope-creep risk.** Positions naturally invite unrealized P/L, performance dashboards, and AI analysis; these are explicitly fenced off in Non-Scope and require their own future Sprint Brief.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

These are not oversights — they are explicitly recognized and consciously deferred, not silently skipped:

- **Fully-closed position deletion.** A position that has been fully sold down to zero quantity may be deleted by its owner (a bookkeeping cleanup action); a position with a nonzero quantity cannot be deleted directly, since doing so would discard an open holding outside of the transaction-derived accounting model. Whether closed positions should instead be archived rather than deleted is left to a future decision if the need arises.
- **Unrealized P/L display and market-data sourcing.** Explicitly deferred to a future sprint, once a live market-data source is decided — this sprint deliberately does not fabricate a price or a placeholder unrealized-P/L value.
- **Multi-currency support.** All amounts in this sprint are treated as a single, unspecified unit of account; multi-currency portfolios are a future decision, not addressed here.

---

# Architecture Constraints

Per `05_ARCHITECTURE.md`, `04_TECH_STACK.md`, and `13_FOLDER_STRUCTURE.md`: unchanged from prior sprints — Architecture First, Modular Monorepo, no new frameworks or folder structure without ADR/Architecture Team approval.

Per ADR-001: JWT remains the sole authentication mechanism. Per DEC-2026-005: all financial fields use `Decimal`, never `Float`; every buy/sell recomputation is row-locked within a database transaction.

Per `15_CODING_STANDARDS.md`: strict TypeScript mode; all external input validated; centralized exception handling; no secrets logged.

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-12

Approved on the basis stated by the Architecture Team: scope is appropriately bounded to portfolio/position bookkeeping (no market data, no execution, no AI), architecture is consistent with ZOS v1.0 and prior decisions (ADR-001, the S1-003 ownership pattern, DEC-2026-005), the Sprint Objective aligns with Zenith's product goal (an accurate, trustworthy portfolio record as the prerequisite for all future performance, risk, and AI capabilities), and deferred areas (market data, execution, AI analysis, and everything depending on them) are intentionally sequenced, not ignored. This Sprint Brief is now valid for implementation per Constitution Rule 2.

---

# Sprint Closure

- **Sprint Status:** CLOSED
- **Closed Date:** 2026-07-12
- **Completion Report:** `documentation/ai/S1-004_COMPLETION_REPORT.md` (AI-017)
- **Final Implementation Commits:** `94c8987` (implementation)
- **Related ADR:** None (see DEC-2026-005)
- **Related Decisions:** DEC-2026-005

This Sprint Status is distinct from the Approval Status in the Approval Section above, which records approval of this Brief for implementation and remains unchanged as the historical record of that event.

---

# Related Documents

- `documentation/zos/sprints/S1-003_SPRINT_BRIEF.md` (prior sprint; trading catalog and ownership-scoping pattern this sprint builds on)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/08_ROADMAP.md`
- `documentation/zos/04_TECH_STACK.md`
- `documentation/zos/05_ARCHITECTURE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-001, ADR-002)
- `documentation/zos/11_DECISION_LOG.md` (DEC-2026-001 through DEC-2026-005)
- `documentation/ai/AI_BOOTSTRAP.md`
