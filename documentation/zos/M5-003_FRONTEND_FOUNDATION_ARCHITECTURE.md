# M5-003_FRONTEND_FOUNDATION_ARCHITECTURE

**Document ID:** ZOS-M5-003
**Version:** 1.1.0
**Status:** Implemented — Documentation Synchronized 2026-07-18 (see note before Related Documents)
**Owner:** Architecture Team (engineering-authored implementation architecture)
**Milestone:** M5 — Implementation Architecture

------------------------------------------------------------------------

# Purpose

The complete frontend architecture that `M5-001` (tokens) and `M5-002`
(components) are built to run inside. Grounded in the **actual current
state** of `apps/web` (inspected, not assumed) — Next.js 15 App Router,
React 19, TypeScript, pnpm + Turborepo monorepo, no CSS framework, no
client-side data-fetching library, server-component-first with
cookie-based auth helpers (`requireToken`/`withAuth`). This document
confirms what already fits M4/D2 and specifies only what must be added
or formalized — it does not propose a parallel or alternative stack.

------------------------------------------------------------------------

# 1. Next.js App Router Structure

Existing routes already match `M4-002` §4's 11-screen inventory almost
exactly — confirmed, not redesigned:

```
apps/web/src/app/
├── page.tsx           (Dashboard — root)
├── login/
├── morning-brief/
├── watchlist/
├── portfolio/
├── journal/            (Trading Journal — already scaffolded)
├── alerts/
├── calendar-news/       (already combined, matches M4-009's resolution)
├── cot/
├── reports/
├── ai-workspace/
├── layout.tsx           (root layout — minimal, no shell yet)
├── error.tsx / not-found.tsx  (already present)
└── api/                  (Next.js route handlers, if any — verify scope at implementation time)
```

**No new route is added.** The only structural gap: no shared
`(app)` route group with a common authenticated layout — every page
currently stands alone. §6 below closes this.

------------------------------------------------------------------------

# 2. Folder Architecture (Monorepo-Wide)

```
apps/
├── api/            (existing, NestJS)
└── web/             (existing, this document's own scope)
packages/
├── database/         (existing)
├── tooling/            (existing — shared eslint/tsconfig)
├── types/               (existing — shared TS types)
├── utils/                (existing)
├── validation/             (existing — Zod schemas)
├── design-tokens/           (NEW — M5-001)
└── ui/                       (NEW — M5-002)
```

No existing package is restructured. Two new workspace packages only.

------------------------------------------------------------------------

# 3. Feature Organization

Within `apps/web/src/`:

```
app/                  (routes only — thin: data fetch + compose from ui/)
components/            (app-specific composition, NOT shared primitives —
                         e.g. `dashboard-parts.tsx` already here; stays
                         app-local since it composes screen-specific
                         layout, not a reusable primitive)
lib/                     (existing: api.ts, auth.ts — extended, not replaced)
```

**Rule:** a component belongs in `packages/ui` only if two or more
screens use it unmodified (`M5-002`'s own components) or if it is a
shared primitive with no screen-specific knowledge. A component
assembling a specific screen's own Panel + Cards in a fixed arrangement
(e.g. Dashboard's own page composition) stays in `apps/web/src/components`
— this mirrors the existing `dashboard-parts.tsx` precedent exactly,
not a new rule invented for this document.

------------------------------------------------------------------------

# 4. Shared Packages

| Package | Existing? | Role |
|---|---|---|
| `@zenith/database` | Yes | Prisma schema/client |
| `@zenith/tooling` | Yes | Shared lint/tsconfig |
| `@zenith/types` | Yes | Shared TS types (extend with UI-facing DTOs if absent) |
| `@zenith/utils` | Yes | Shared utilities |
| `@zenith/validation` | Yes | Zod schemas |
| `@zenith/design-tokens` | **New** | `M5-001` |
| `@zenith/ui` | **New** | `M5-002` |

`apps/web` depends on both new packages via `workspace:*`, identical to
its existing `@zenith/tooling` dependency declaration.

------------------------------------------------------------------------

# 5. Theme Provider

A minimal Server Component-compatible provider — **no client-side
theme-switching logic required by any approved document** (D2-002 §6.1
requires both modes first-class, not a toggle):

- Root `layout.tsx` reads a `theme` cookie (or defaults to
  `prefers-color-scheme` via a no-flash inline script, standard
  practice for SSR dark-mode) and sets `data-theme` on `<html>`
  server-side — avoids a client-side flash-of-wrong-theme.
- No React Context is required for theme value itself (CSS custom
  properties resolve purely from the `data-theme` attribute, `M5-001`
  §2) — a Context is only introduced if/when a manual toggle is later
  approved (not now; `TODO`, not invented here).

------------------------------------------------------------------------

# 6. Layout System

New `app/(authenticated)/layout.tsx` route group, wrapping every screen
except `login`:

```
app/
├── (authenticated)/
│   ├── layout.tsx     (Navigation shell, §7 — calls requireToken once)
│   ├── page.tsx         (Dashboard, moved under the group)
│   ├── morning-brief/
│   ├── watchlist/  ...   (all existing screens, moved under the group)
├── login/               (outside the group — no shell, per M4-002 §4.11
│                          Login's own deliberate isolation)
```

**Fix identified in self-review (§24):** the current implementation
calls `requireToken()`/`withAuth()` independently in *every* page — this
route-group layout consolidates that single check to one place,
consistent with D1-005 §4.2 (navigation present/consistent everywhere)
and removing eight duplicated auth-check call sites. Per-page
`withAuth()` wrapping of the page's own data fetch is retained (auth
*presence* is checked once at the layout; a 401 *during* a specific
page's own fetch is still handled at that page, per existing pattern).

------------------------------------------------------------------------

# 7. Navigation Shell

The `(authenticated)/layout.tsx` renders the Sidebar/Top Bar pair
(`M5-002` §1) once, wrapping `{children}`. Existing
`components/app-nav.tsx` is superseded by `@zenith/ui`'s `NavItem` +
shell components — its own nine-area link list (already correct per
`M4-002` §2) is preserved, only its implementation moves into the
shared package so every screen renders the identical shell instance
rather than each page importing `app-nav.tsx` separately.

------------------------------------------------------------------------

# 8. State Management Architecture

**No global client state library is introduced.** Existing pattern —
Server Components fetch directly, no client cache — is preserved and
is the correct fit for Zenith's own Product Rule 3 (reduce cognitive
load has no bearing here, but Constitution §4.2/explainability favors
traceable, request-scoped data over an opaque client store). Local
component state (`useState`) is used only for: Dropdown/Modal
open-state, Tabs active-index, form field values, Card expand/collapse
— all ephemeral, component-local, never lifted to a global store.

------------------------------------------------------------------------

# 9. Server/Client Boundaries

- **Server Components (default):** every screen's own data fetch, per
  existing `withAuth()` pattern — unchanged.
- **Client Components (`'use client'`, explicit, minimal):** any
  component with interaction state — Dropdown, Modal, Tabs, Checkbox/
  Radio/Switch, Input/Textarea (controlled), Toast/Notification
  (dismiss), Chart Wrapper (if the chosen library requires a client
  runtime). Every such component is marked at its own leaf, never at a
  page or layout level, to keep the Server Component tree as large as
  possible (Next.js App Router performance convention, not a Zenith-
  specific rule).
- **Rule:** Decision Card / Insight Card / Timeline Card / AI Response
  Block are Server Components by default (they render fetched data);
  only their expand/collapse *interaction* (a few lines) is a client
  boundary, not the whole component.

------------------------------------------------------------------------

# 10. API Layer Architecture

Existing `lib/api.ts` (440 lines, already handles `ApiError`, per-
resource fetch functions) is retained and extended per new screen
needs — not replaced. **Rule:** one typed function per backend
endpoint, co-located in `api.ts` (or split into `lib/api/{domain}.ts`
files once the file exceeds a maintainable size — a file-organization
threshold, not a new API pattern). Every function returns a typed
result or throws `ApiError`, consumed by `withAuth()` exactly as today.

------------------------------------------------------------------------

# 11. Error Handling Architecture

- **Route-level:** existing `error.tsx`/`not-found.tsx` retained.
- **Component-level:** every data-bearing component (`M5-002`'s Cards,
  Table, Chart Wrapper) renders its own Error State (`M5-002` §7)
  rather than throwing to the nearest route boundary — per-component
  failure isolation, mirroring `26` §4.2's own "one child's failure
  never delays/breaks another's" State Flow rule, extended from
  Dashboard to every screen.
- **Distinction preserved:** a partial/degraded condition
  (`signal.warn`) vs. a fully-blocking one (`signal.critical`) is
  always resolved at the component that owns the data, never
  generically upgraded to a route-level error page for a degraded-but-
  usable condition (D1-002 §14.4).

------------------------------------------------------------------------

# 12. Loading Architecture

- **Route-level:** Next.js `loading.tsx` per route (not yet present —
  add one per route group, rendering that screen's own Skeleton
  composition, matching its Panel/Card layout shape).
- **Component-level:** Skeleton (`M5-002` §7) for any independently-
  streamed data region (React Suspense boundaries around each
  Secondary-Attention block, so one slow fetch never blocks the
  Primary region — `26` §5 Observation 1's own recommendation, now
  structurally available via Next.js `<Suspense>`).

------------------------------------------------------------------------

# 13. Caching Strategy

- **Next.js fetch cache:** per-request data (Confluence readings,
  positions) uses `cache: 'no-store'` — this is live trading-relevant
  data, never staled by a default cache (Constitution §4.1, disclosed
  evidence must reflect current state).
- **Static, rarely-changing data** (instrument metadata, glossary-level
  content) may use Next.js's default fetch caching — a genuine
  performance/correctness split, not a blanket policy.
- **No client-side cache library** (React Query/SWR) is introduced —
  consistent with §8's own no-global-client-state decision; revisit
  only if a future Sprint's own real-time/polling requirement
  (`26` §5 Observation 4, still an open architecture question, not
  resolved by this document) demands it.

------------------------------------------------------------------------

# 14. Authentication Integration

Existing cookie-based session (`zenith_token`, `requireToken`/
`withAuth`, `lib/auth.ts`) is retained as-is. No change to the
authentication *mechanism* — only its call site consolidates into the
new `(authenticated)/layout.tsx` (§6).

------------------------------------------------------------------------

# 15. Protected Routes

- `(authenticated)/layout.tsx` calls `requireToken()` once; absence
  redirects to `/login` before any child route renders — closes the
  current per-page duplication (§6 fix) without introducing Next.js
  Middleware (`middleware.ts`), since the existing pattern already
  redirects correctly via Server Component `redirect()` and a
  Middleware layer would duplicate rather than replace that check for
  no added correctness benefit at this scale.
- `login/` remains outside the group, per `M4-002` §4.11's own
  deliberate isolation (Login never deep-links elsewhere).

------------------------------------------------------------------------

# 16. Environment Structure

No change to existing environment-variable conventions (API base URL,
cookie name, etc. — already established in `lib/api.ts`/`auth.ts`).
`packages/design-tokens` and `packages/ui` require no environment
variables of their own (pure build-time/static output).

------------------------------------------------------------------------

# 17. Configuration Strategy

- `packages/design-tokens` and `packages/ui` each get a `tsconfig.json`
  extending `@zenith/tooling`'s shared base (existing convention).
- Turborepo `turbo.json` gains no new task type — both packages use the
  existing `build`/`lint` task graph (`dependsOn: ["^build"]` already
  ensures `apps/web`'s build waits on both).

------------------------------------------------------------------------

# 18. Performance Strategy

- Server Components by default (§9) minimize client JS shipped.
- `packages/ui` builds to ESM with `"sideEffects": false` (tree-
  shakeable — importing one component never pulls in the whole
  library).
- Generated `tokens.css` (`M5-001` §1) is a single, small, cacheable
  stylesheet — no runtime CSS-in-JS cost.
- Suspense-per-region (§12) avoids one slow fetch blocking an entire
  screen's own paint.

------------------------------------------------------------------------

# 19. Accessibility Strategy

Enforced structurally, not per-screen: every `packages/ui` component
ships its own D2-007 compliance (`M5-002`, each component's own
Accessibility field) — a screen composing only `@zenith/ui` primitives
inherits WCAG 2.1 AA contrast, keyboard operability, and focus
management by construction, rather than each screen re-implementing it.

------------------------------------------------------------------------

# 20. Internationalization Readiness

**Not an approved current requirement** — no i18n library is
introduced now (`TODO`, not invented here, consistent with "create
only what is strictly necessary"). Readiness is preserved by
discipline already required elsewhere: all trader-facing copy lives in
component props/content, never hardcoded inside `packages/ui`'s own
structural markup — a future i18n layer would wrap content, not require
component rewrites.

------------------------------------------------------------------------

# 21. Testing Strategy

- `packages/ui`: unit tests per component (rendering, state
  transitions, accessibility assertions — e.g. focus trap on Modal) —
  same test runner already used elsewhere in the monorepo (Jest, per
  existing `apps/api` convention).
- `apps/web`: existing route-level tests (if any) extend to cover the
  new `(authenticated)` layout's auth-redirect behavior.
- No new testing framework introduced.

------------------------------------------------------------------------

# 22. Storybook Readiness

`packages/ui` is structured so each component's own file
(`src/{Component}/{Component}.tsx` + `.stories.tsx` placeholder) is
Storybook-addable without restructuring — **not installed now**
(no approved requirement calls for it yet; installing it would be
scope beyond "strictly necessary"). The per-component spec fields in
`M5-002` (Purpose/Variants/States) are already in the exact shape a
future Storybook story would need, so adopting it later costs no
re-specification.

------------------------------------------------------------------------

# 23. Future Scalability

- A tenth product area (`M4-002` §10, already gated by Constitution
  §10.3) adds one route + reuses existing `@zenith/ui` primitives —
  no shell/layout change required, mirroring `M4-002` §10's own
  navigation-scalability argument extended to the frontend.
- `packages/ui`'s Composite Trading Cards (`M5-002` §9) are already
  screen-agnostic — a new screen composes them rather than inventing
  new card shells.
- Charting library selection (`M5-002` §8, `TODO`) is isolated to
  Chart Wrapper's own internals — swappable without touching any
  screen.

------------------------------------------------------------------------

# 24. Self-Review

Performed against the complete M5-001/002/003 architecture as a whole.

| Dimension | Finding |
|---|---|
| **Consistency** | One genuine gap found: duplicated per-page auth checks (§6). **Fixed** via `(authenticated)` route group. |
| **Scalability** | Confirmed (§23) — no structural change needed for a future tenth area. |
| **Maintainability** | Confirmed — token/component packages are single sources of truth (`M5-001` §1, `M5-002` Purpose); no per-screen re-specification. |
| **Performance** | Confirmed (§18) — Server-Component-first, tree-shakeable `ui` package, single generated stylesheet. |
| **Accessibility** | Confirmed (§19) — enforced at the component layer, not per-screen. |
| **Component reuse** | One genuine gap found: `M5-002`'s Composite Trading Cards were, before this document, only implicitly reusable (each `M4-00X` screen doc independently re-specified the same pattern). **Fixed** by `M5-002` §9 formally promoting them to shared primitives, per `M4-003`'s own Engineering Observation 3. |
| **Design System compliance** | Confirmed — every token/component traces to a D2/M4 citation; no new visual language anywhere in `M5-001`/`M5-002`/this document. |
| **Future implementation readiness** | Confirmed — Dashboard implementation (next milestone) has a concrete package structure, route group, and component set to build against; no open architectural question blocks it except the explicitly-scoped-out charting-library `TODO` (§8, `M5-002`), which does not block any screen's own non-chart components. |

No further issue identified after applying the two fixes above.

------------------------------------------------------------------------

# Documentation Synchronization Note (2026-07-18)

This document's Status previously read "Proposed — Awaiting Product
Leadership Review," which no longer reflected reality: the frontend
architecture specified here (Next.js App Router structure, layout/
navigation shell, `(authenticated)` route group) is already in place
in `apps/web`, running on `packages/design-tokens` (`M5-001`) and
`packages/ui` (`M5-002`), and was the foundation Milestone M6 (Visual
Identity Package, all four phases Approved —
`M6-004_OFFICIAL_DESIGN_SYSTEM.md`) built on to produce the live,
shipped Dashboard A, whose own visual identity work is now frozen
(Dashboard A Design Freeze, merged to `main`). §24's own "Future
implementation readiness" finding above described Dashboard
implementation as "next milestone" — it has since happened. This
entry corrects the Status field to match that already-implemented,
already-in-production state. It is a documentation synchronization,
not a new architectural review, decision, or re-implementation — no
content in this specification changed.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/M4-002_SCREEN_ARCHITECTURE_BLUEPRINT.md` §4
- `documentation/zos/M4-003_DASHBOARD_INFORMATION_ARCHITECTURE.md` §5 (Observation 1)
- `documentation/zos/M5-001_DESIGN_TOKENS_ARCHITECTURE.md`
- `documentation/zos/M5-002_SHARED_COMPONENT_LIBRARY_ARCHITECTURE.md`
- `apps/web/src/lib/auth.ts`, `api.ts` (existing, extended not replaced)
- `apps/web/src/app/*` (existing routes, confirmed against `M4-002` §4)
