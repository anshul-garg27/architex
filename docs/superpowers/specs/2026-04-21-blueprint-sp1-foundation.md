# Blueprint SP1 · Foundation Spec

> **Parent:** `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md`
> **Status:** Approved, ready for plan + implementation
> **Date:** 2026-04-21
> **Scope:** Module scaffolding — schema, routes, shell, store, progress sync, nav entry — that unblocks every other sub-project

---

## 1. Purpose

SP1 establishes every architectural surface that later sub-projects will build on. After SP1 lands:

- A user can navigate to `/modules/blueprint` and see the Blueprint shell (top chrome, breadcrumb, surface router).
- All route URLs from the vision spec §7 resolve (even if they show empty states).
- The database has `blueprint_*` tables ready to store journey state and progress.
- The nav has a new entry pointing to Blueprint.
- Every downstream sub-project can assume the store, the router, the hooks, and the API surface exist — they're shipped and tested here.

SP1 deliberately ships **no user-facing features**. No journey map, no unit renderer, no toolkit pages. Just the scaffolding. Home page says "Blueprint · coming soon"; tools pages say "Coming soon"; the progress page shows an empty state. This is by design — SP1 is infrastructure.

## 2. What ships

### 2.1 Database schema (Drizzle)

Five new tables. File-per-table under `src/db/schema/`.

**File: `src/db/schema/blueprint-courses.ts`**
- Exports `blueprintCourses` table
- Columns: `id` (uuid pk), `slug` (unique), `title`, `description`, `version`, `publishedAt`, `createdAt`, `updatedAt`
- Seeded with one row: `{slug: "blueprint-core", title: "The Blueprint Course", version: "v1.0.0"}`

**File: `src/db/schema/blueprint-units.ts`**
- Exports `blueprintUnits` table
- Columns: `id` (uuid pk), `courseId` (fk), `slug` (unique per course), `ordinal`, `title`, `summary`, `durationMinutes`, `difficulty` (enum: foundation|intermediate|advanced), `prereqUnitSlugs` (text[]), `tags` (text[]), `entityRefs` (jsonb of `{patterns: string[], problems: string[]}`), `recipeJson` (jsonb), `publishedAt`, `createdAt`, `updatedAt`
- Seeded with 12 placeholder rows (ordinal 1..12, slugs from curriculum §10), all with empty `recipeJson: {sections: []}` and `publishedAt: null`
- Unique index on `(courseId, slug)`
- Index on `(courseId, ordinal)` for list queries

**File: `src/db/schema/blueprint-user-progress.ts`**
- Exports `blueprintUserProgress` table
- Columns: `id` (uuid pk), `userId` (fk users), `unitId` (fk blueprint_units), `state` (enum: locked|available|in_progress|completed|mastered), `sectionStates` (jsonb: `Record<sectionSlug, {startedAt, completedAt, attempts, score}>`), `lastPosition` (text — section slug), `totalTimeMs` (int), `completedAt` (timestamptz nullable), `masteredAt` (timestamptz nullable), `createdAt`, `updatedAt`
- Unique index on `(userId, unitId)` — partial where `state != 'locked'` so we don't bloat with rows the user hasn't touched
- Index on `(userId)` for fast aggregate queries

**File: `src/db/schema/blueprint-journey-state.ts`**
- Exports `blueprintJourneyState` table
- Columns: `userId` (pk, fk users, one row per user), `currentUnitSlug` (text nullable), `currentSectionId` (text nullable), `welcomeDismissedAt` (timestamptz nullable), `streakDays` (int default 0), `streakLastActiveAt` (timestamptz nullable), `dailyReviewTarget` (int default 10), `preferredLang` (text enum: ts|py|java default 'ts'), `pinnedTool` (text enum: patterns|problems|review nullable), `updatedAt`
- No secondary indexes — single-row-per-user access pattern

**File: `src/db/schema/blueprint-events.ts`**
- Exports `blueprintEvents` table (append-only)
- Columns: `id` (uuid pk), `userId` (fk nullable, we log anonymous events too), `sessionId` (text), `eventName` (text), `eventPayload` (jsonb), `occurredAt` (timestamptz default now)
- Index on `(userId, occurredAt desc)` for per-user event history
- Index on `(eventName, occurredAt desc)` for event analytics

**File: `src/db/schema/relations.ts`** — add relations for new tables:
- `blueprintCoursesRelations`: has-many units
- `blueprintUnitsRelations`: belongs-to course; has-many userProgress
- `blueprintUserProgressRelations`: belongs-to user + unit
- `blueprintJourneyStateRelations`: belongs-to user
- `blueprintEventsRelations`: belongs-to user (nullable)

**File: `src/db/schema/index.ts`** — re-export everything new.

**File: `drizzle/NNNN_add_blueprint_core.sql`** — generated migration; applied locally by `pnpm db:migrate`.

### 2.2 Zustand store

**File: `src/stores/blueprint-store.ts`**

Single store with three slices:

```typescript
type BlueprintSurface = "journey" | "toolkit" | "progress";
type ToolkitTool = "patterns" | "problems" | "review";

interface BlueprintState {
  // ── Surface ────────────────────────────────
  currentSurface: BlueprintSurface;

  // ── Journey ────────────────────────────────
  currentUnitSlug: string | null;
  currentSectionId: string | null;
  // Per-unit cache (hydrates from server on module open)
  unitProgress: Record<string, UnitProgressCache>;
  welcomeDismissed: boolean;

  // ── Toolkit ────────────────────────────────
  activeTool: ToolkitTool | null;
  activeEntityId: string | null;
  toolkitSubMode: string | null; // e.g. "interview" | "guided" | "speed" for Problems
  pinnedTool: ToolkitTool | null;

  // ── Preferences ────────────────────────────
  preferredLang: "ts" | "py" | "java";
  dailyReviewTarget: number;

  // ── Actions ────────────────────────────────
  setSurface(s: BlueprintSurface): void;
  setCurrentUnit(slug: string | null, sectionId?: string | null): void;
  setCurrentSection(sectionId: string | null): void;
  dismissWelcome(): void;
  openTool(tool: ToolkitTool, entityId?: string, subMode?: string): void;
  closeTool(): void;
  pinTool(tool: ToolkitTool | null): void;
  setPreferredLang(lang: "ts" | "py" | "java"): void;
  updateUnitProgress(slug: string, cache: UnitProgressCache): void;
  hydrate(serverState: Partial<BlueprintState>): void;
  reset(): void; // for tests
}
```

**Persistence:** `persist` middleware with key `"blueprint-store"` — stores only the non-ephemeral fields (preferences, pinnedTool, welcomeDismissed, unitProgress cache). Does NOT persist `currentSurface` / `currentUnitSlug` / `activeTool` — those derive from URL on every mount.

**UnitProgressCache type:**
```typescript
interface UnitProgressCache {
  unitSlug: string;
  state: "locked" | "available" | "in_progress" | "completed" | "mastered";
  sectionStates: Record<string, SectionCompletion>;
  lastSeenAt: number;
}
interface SectionCompletion {
  completed: boolean;
  attempts: number;
  score?: number;
}
```

### 2.3 Route tree

All routes live under `architex/src/app/modules/blueprint/`. In Next.js 16 App Router:

```
src/app/modules/blueprint/
├── layout.tsx                           # Blueprint shell (top chrome, breadcrumb, status bar)
├── page.tsx                             # Journey home (SP2 fills in; SP1 renders empty state)
├── loading.tsx                          # Skeleton for any Blueprint route
├── error.tsx                            # Error boundary for Blueprint
├── welcome/
│   └── page.tsx                         # First-run welcome (SP2 fills in)
├── unit/
│   └── [unitSlug]/
│       ├── page.tsx                     # Unit detail (SP3 fills in; SP1 renders empty state)
│       └── complete/
│           └── page.tsx                 # Unit completion (SP3 fills in)
├── toolkit/
│   ├── layout.tsx                       # Toolkit shell (sub-nav: patterns/problems/review)
│   ├── page.tsx                         # Toolkit home (SP4-6 fill in)
│   ├── patterns/
│   │   ├── page.tsx                     # Patterns Library landing (SP4)
│   │   └── [patternSlug]/
│   │       ├── page.tsx                 # Pattern detail (SP4)
│   │       └── compare/
│   │           └── page.tsx             # Comparison (SP4)
│   ├── problems/
│   │   ├── page.tsx                     # Problems Workspace landing (SP5)
│   │   └── [problemSlug]/
│   │       ├── page.tsx                 # Problem detail (SP5)
│   │       └── drill/
│   │           └── page.tsx             # Drill mode (SP5)
│   └── review/
│       └── page.tsx                     # Review Inbox (SP6)
└── progress/
    ├── layout.tsx                       # Progress shell
    ├── page.tsx                         # Dashboard (SP2 fills in; SP1 renders empty state)
    ├── patterns/page.tsx                # Pattern mastery grid
    ├── problems/page.tsx                # Problem history
    └── streak/page.tsx                  # Streak detail
```

In SP1, every leaf `page.tsx` is a placeholder. They render the shell correctly and show a "Coming in sub-project N" placeholder. The routes exist; they just don't do anything yet.

### 2.4 Blueprint shell component

**File: `src/components/modules/blueprint/BlueprintShell.tsx`**

A top-level layout component that wraps children. It:

- Reads current URL via `useBlueprintRoute()` hook
- Computes breadcrumb from URL segments
- Renders top chrome: logo ("Blueprint") + surface tabs (Journey | Toolkit | Progress) + search + user menu
- Renders breadcrumb row
- Renders `children` (the current route's page)
- Renders status bar

**Sub-components:**
- `src/components/modules/blueprint/shell/TopChrome.tsx`
- `src/components/modules/blueprint/shell/Breadcrumb.tsx`
- `src/components/modules/blueprint/shell/StatusBar.tsx`
- `src/components/modules/blueprint/shell/SurfaceTabs.tsx`
- `src/components/modules/blueprint/shell/SearchInput.tsx` (stub in SP1 — just focused input, no results)

The shell does **not** contain any mode switcher. Ever.

### 2.5 Hooks

**File: `src/hooks/blueprint/useBlueprintRoute.ts`**
- Reads URL, computes `{ surface, unitSlug, sectionId, tool, entityId, subMode }` from path + hash + query
- Returns both the computed view and a `navigate()` function that updates URL + store atomically
- Single source of truth: URL → view state. Store is a cache.

**File: `src/hooks/blueprint/useJourneyStateSync.ts`**
- On mount: GET `/api/blueprint/journey-state` and hydrate store
- On store changes (debounced 1s): PATCH `/api/blueprint/journey-state` with diffed fields
- Idempotent — replays on reconnect
- Used by the root `BlueprintShell`

**File: `src/hooks/blueprint/useUnitProgressSync.ts`**
- Subscribes to `blueprint-store.unitProgress`
- On change (debounced 1s): PATCH `/api/blueprint/units/<slug>/progress`
- Optimistic: store updates first, server confirms/corrects
- Retries on 5xx; conflicts resolve server-wins (last-write-wins)

**File: `src/hooks/blueprint/useBlueprintAnalytics.ts`**
- Wrapper around PostHog client
- Types each event per the taxonomy in §15 of vision
- Batches events in 500ms windows; flushes on route change
- Dev env logs to console when PostHog key missing

### 2.6 Analytics events module

**File: `src/lib/analytics/blueprint-events.ts`**

Typed event builders, each returning `{ name: string; payload: object }`. Full taxonomy (25 events) from vision §15.1:

```typescript
export const blueprintModuleOpened = (p: { entrySurface: BlueprintSurface; from?: string }) => ...
export const blueprintWelcomeShown = () => ...
export const blueprintWelcomeDismissed = (p: { action: "start_course" | "drill_problem" | "browse_patterns" | "close" }) => ...
export const blueprintResumeClicked = (p: { unitSlug: string; sectionId: string }) => ...
export const blueprintUnitOpened = (p: { unitSlug: string; entry: "map" | "resume" | "deeplink" | "next" }) => ...
// ... 20 more
```

Each export has a TypeScript type so consumers can't pass wrong payload shapes.

### 2.7 API routes

**File: `src/app/api/blueprint/journey-state/route.ts`**
- `GET` — returns current user's journey state (or defaults if no row)
- `PATCH` — updates allowed fields: `currentUnitSlug`, `currentSectionId`, `welcomeDismissedAt`, `dailyReviewTarget`, `preferredLang`, `pinnedTool`
- Authentication: `requireAuth()` or returns anonymous state via fingerprint fallback (follow pattern from `user-preferences` route)

**File: `src/app/api/blueprint/units/route.ts`**
- `GET` — returns list of `{slug, ordinal, title, summary, duration, difficulty, tags, prereqSlugs}` for all published units (no recipes — list view)

**File: `src/app/api/blueprint/units/[slug]/route.ts`**
- `GET` — returns full unit record including `recipeJson`
- 404 if unit doesn't exist

**File: `src/app/api/blueprint/units/[slug]/progress/route.ts`**
- `GET` — returns current user's progress for this unit (creates row lazily on first read, defaulting state based on prereqs)
- `PATCH` — updates `sectionStates`, `lastPosition`, `totalTimeMs`, `state`, `completedAt`, `masteredAt`

**File: `src/app/api/blueprint/events/route.ts`**
- `POST` — logs an event; fire-and-forget (never blocks UI)
- Accepts batched payloads (array of events) for the batching hook

**File: `src/app/api/blueprint/progress/summary/route.ts`**
- `GET` — returns per-user aggregate: units completed, patterns mastered, streak, time invested
- Denormalized query joining `blueprint_user_progress` + `fsrs_cards` + `blueprint_journey_state`

All API routes use the project's existing auth middleware + error handlers. All return typed JSON via the existing `apiResponse()` helper.

### 2.8 Navigation entry

**File: `src/stores/ui-store.ts`** — add `"blueprint"` to the `ModuleType` union.

**File: `src/components/shared/workspace-layout.tsx`** (or wherever the left rail is rendered) — add the Blueprint icon + link. The link goes to `/modules/blueprint` (not to `/?module=blueprint`).

**File: `src/app/modules/page.tsx`** — add Blueprint to the MODULES array with a fresh definition (icon: Compass, color: indigo, category: Learning).

### 2.9 Content scaffolding

**Directory: `content/blueprint/`** — create, gitkeep-only in SP1.

Subdirectories (created, empty files for gitkeep):
- `content/blueprint/units/` (will hold unit.yaml + section MDX per sub-unit)
- `content/blueprint/shared/concepts/` (cross-referenced concept MDX)
- `content/blueprint/shared/problems/` (problem overlays)

### 2.10 Scripts

**File: `architex/scripts/blueprint/seed-units.ts`**
- Idempotent script that upserts the 12 placeholder unit rows
- Uses the same Node-ESM-safe raw-pg pattern as `seed-lld-lessons-from-json.mjs` (we learned this lesson last session)
- Run via `pnpm blueprint:seed-units`

**`package.json`** — add script alias:
- `"blueprint:seed-units": "node scripts/blueprint/seed-units.ts"` (or however the existing pnpm scripts run TS)

### 2.11 Tests

**Unit tests:**
- `src/stores/__tests__/blueprint-store.test.ts` — store actions, persistence, hydration
- `src/hooks/blueprint/__tests__/useBlueprintRoute.test.tsx` — URL parsing for every route, navigate atomicity
- `src/hooks/blueprint/__tests__/useJourneyStateSync.test.tsx` — debounced PATCH, hydration on mount, offline behavior
- `src/lib/analytics/__tests__/blueprint-events.test.ts` — every event builder typed correctly

**API integration tests:**
- `src/app/api/blueprint/__tests__/journey-state.test.ts`
- `src/app/api/blueprint/__tests__/units.test.ts`
- `src/app/api/blueprint/__tests__/progress.test.ts`
- `src/app/api/blueprint/__tests__/events.test.ts`

**Route smoke tests:**
- `architex/e2e/blueprint-smoke.spec.ts` (Playwright) — navigate to every Blueprint route; assert the shell renders; assert no 404; assert "Coming soon" placeholder visible on unimplemented pages.

### 2.12 Developer README

**File: `docs/superpowers/blueprint/README.md`**
- How to run Blueprint locally
- How to seed data
- How to add a new API route
- How to write an event
- How to run tests

## 3. Explicit out-of-scope in SP1

Things that sound close but are **not** in SP1:

- Journey map UI (SP2)
- Unit cards (SP2)
- Unit renderer (SP3)
- MDX compile pipeline (SP3)
- Any `read` / `interact` / `apply` section rendering (SP3)
- Canvas embed in Blueprint (SP3/SP4)
- Pattern detail page rendering (SP4)
- Drill mode (SP5)
- FSRS integration in Review Inbox (SP6)
- Any content — units are empty placeholder rows
- Mobile layouts
- AI surfaces
- Motion / animation polish
- Dark mode polish (uses existing tokens; no custom polish)

## 4. Invariants SP1 establishes

These cannot be broken by any later sub-project:

**I1 — URL is the single source of truth for surface.** Store caches it; never writes ahead of URL. Tests enforce.

**I2 — Writes flow one way: UI → store → server.** Never skips store. Never reads from server mid-interaction.

**I3 — Every Blueprint route renders through `BlueprintShell`.** No route ever renders outside the shell.

**I4 — Analytics events are typed via builders.** No raw `posthog.capture()` calls outside `blueprint-events.ts`.

**I5 — `currentSurface` is never simultaneously two values.** Renderer enforces via exhaustive switch; missing case is a compile error.

**I6 — No imports from old LLD's `useLLDModule` or `useLLDModuleImpl`.** Blueprint is standalone; cross-contamination is architectural rot. ESLint rule enforces.

**I7 — Server reads are paginated or bounded.** `GET /events` never returns more than 1000 rows per call.

## 5. Design decisions (deferred to SP1, resolved here)

- **Feature flag?** No. Blueprint ships as a new nav item; users who haven't discovered it won't click it. No gating infrastructure.
- **Dev seed of `publishedAt`?** Set `publishedAt = now()` for all 12 placeholder units so the API returns them immediately in list queries. Prod will have published dates when content ships.
- **Placeholder text on empty pages?** `<BlueprintComingSoon subprojectId="SP3" />` component rendered by each unimplemented route. Tells future-Claude which sub-project is responsible.
- **Anonymous user handling?** Use existing `user_fingerprint` + `getUserIdOrFingerprint()` helper. Anonymous users have progress that can be claimed on sign-in via the merge flow from the earlier LLD spec (Q17).
- **i18n?** English strings embedded directly in JSX for V1. No `t()` wrapper. Add a TODO `// i18n:` on every user-facing string to make future extraction searchable.
- **Theme?** Reuse Architex brand tokens (cream bg, warm ink). Add Blueprint-specific accent CSS variable `--blueprint-accent` default `#1E3A8A` → `#38BDF8` gradient. Scoped to `/modules/blueprint/*` via layout CSS.

## 6. Verification

After SP1 is implemented, the following must pass:

### 6.1 Human walkthrough

1. Visit `/modules/blueprint` — shell renders, surface=journey, top chrome shows "Journey / Toolkit / Progress" tabs, breadcrumb says "Blueprint", empty state says "Journey map coming in SP2".
2. Click "Toolkit" → URL becomes `/modules/blueprint/toolkit`, surface=toolkit, empty state says "Toolkit coming in SP4–6".
3. Click "Progress" → URL becomes `/modules/blueprint/progress`, empty state says "Dashboard coming in SP2".
4. Back button returns through the previous views.
5. Refresh on any URL → same view restored.
6. Visit `/modules/blueprint/unit/meet-builder` → shell renders, breadcrumb shows "Blueprint › Unit · Meet Builder", empty state says "Unit renderer coming in SP3".
7. Visit `/modules/blueprint/toolkit/patterns/builder` → empty state says "Patterns Library coming in SP4".
8. Open two Blueprint tabs in browser, make a preference change in one — other tab reflects on refresh (server-synced).
9. Dismiss welcome banner on first visit → never appears again (persisted to server).

### 6.2 Automated

- `pnpm typecheck` green
- `pnpm lint` green
- `pnpm test:run` green (all Blueprint tests + all prior tests)
- `pnpm test:e2e` green on Blueprint smoke suite
- `pnpm build` green

### 6.3 Data verification

- `SELECT COUNT(*) FROM blueprint_units` = 12 after seed
- `SELECT * FROM blueprint_journey_state WHERE user_id = <me>` returns one row after first Blueprint visit
- `SELECT event_name FROM blueprint_events WHERE user_id = <me>` shows at least `module_opened` event after first visit
- No new rows in `lld_*` tables from Blueprint visits (we don't touch old LLD's state)

## 7. Risks and mitigations

**R1 — Next.js 16 App Router behavior differs from training data.**
Mitigation: Before writing `page.tsx`/`layout.tsx` files, read `node_modules/next/dist/docs/` per the AGENTS.md directive. Don't guess.

**R2 — `persist` middleware triggers SSR hydration mismatch.**
Mitigation: All Blueprint shells are client components (`"use client"`). Any persisted state reads happen inside `useEffect`, not during render.

**R3 — Two concurrent sessions writing `blueprint_journey_state` for same user race.**
Mitigation: API uses UPSERT with `updated_at` version check; client refetches on 409; last-write-wins after one round.

**R4 — Seed script fails on first run in CI due to missing DB.**
Mitigation: Make seed script idempotent (ON CONFLICT DO UPDATE). Skip migration check in seed; assume it ran.

**R5 — Left-rail nav integration breaks existing modules.**
Mitigation: Add Blueprint as a new entry without touching existing entries. Test: open every existing module post-integration; they still work.

**R6 — `ModuleType` union expansion breaks existing consumers.**
Mitigation: TypeScript will flag every consumer of `ModuleType`; we pass through them and add Blueprint handling or explicit exhaustiveness.

**R7 — `blueprint_events` grows without bound.**
Mitigation: Index on `(user_id, occurred_at desc)` + `(event_name, occurred_at desc)` supports typical queries. Add a note in the README about a future rollup job; not in V1.

## 8. File inventory (expected delta after SP1)

```
architex/
├── drizzle/
│   └── NNNN_add_blueprint_core.sql                                     NEW
├── content/
│   └── blueprint/                                                      NEW
│       ├── units/.gitkeep
│       ├── shared/concepts/.gitkeep
│       └── shared/problems/.gitkeep
├── scripts/
│   └── blueprint/
│       └── seed-units.ts                                               NEW
├── src/
│   ├── db/schema/
│   │   ├── blueprint-courses.ts                                        NEW
│   │   ├── blueprint-units.ts                                          NEW
│   │   ├── blueprint-user-progress.ts                                  NEW
│   │   ├── blueprint-journey-state.ts                                  NEW
│   │   ├── blueprint-events.ts                                         NEW
│   │   ├── index.ts                                                    MODIFY (re-export)
│   │   └── relations.ts                                                MODIFY (add relations)
│   ├── stores/
│   │   ├── blueprint-store.ts                                          NEW
│   │   ├── ui-store.ts                                                 MODIFY (add "blueprint" to ModuleType)
│   │   └── __tests__/
│   │       └── blueprint-store.test.ts                                 NEW
│   ├── hooks/blueprint/
│   │   ├── useBlueprintRoute.ts                                        NEW
│   │   ├── useJourneyStateSync.ts                                      NEW
│   │   ├── useUnitProgressSync.ts                                      NEW
│   │   ├── useBlueprintAnalytics.ts                                    NEW
│   │   └── __tests__/
│   │       ├── useBlueprintRoute.test.tsx                              NEW
│   │       └── useJourneyStateSync.test.tsx                            NEW
│   ├── lib/analytics/
│   │   └── blueprint-events.ts                                         NEW
│   ├── components/
│   │   ├── modules/blueprint/
│   │   │   ├── BlueprintShell.tsx                                      NEW
│   │   │   ├── BlueprintComingSoon.tsx                                 NEW (placeholder)
│   │   │   └── shell/
│   │   │       ├── TopChrome.tsx                                       NEW
│   │   │       ├── Breadcrumb.tsx                                      NEW
│   │   │       ├── StatusBar.tsx                                       NEW
│   │   │       ├── SurfaceTabs.tsx                                     NEW
│   │   │       └── SearchInput.tsx                                     NEW (stub)
│   │   └── shared/
│   │       └── workspace-layout.tsx                                    MODIFY (left-rail nav item)
│   └── app/
│       ├── modules/page.tsx                                            MODIFY (MODULES array +Blueprint)
│       ├── modules/blueprint/
│       │   ├── layout.tsx                                              NEW
│       │   ├── page.tsx                                                NEW
│       │   ├── loading.tsx                                             NEW
│       │   ├── error.tsx                                               NEW
│       │   ├── welcome/page.tsx                                        NEW
│       │   ├── unit/[unitSlug]/page.tsx                                NEW
│       │   ├── unit/[unitSlug]/complete/page.tsx                       NEW
│       │   ├── toolkit/layout.tsx                                      NEW
│       │   ├── toolkit/page.tsx                                        NEW
│       │   ├── toolkit/patterns/page.tsx                               NEW
│       │   ├── toolkit/patterns/[patternSlug]/page.tsx                 NEW
│       │   ├── toolkit/patterns/[patternSlug]/compare/page.tsx         NEW
│       │   ├── toolkit/problems/page.tsx                               NEW
│       │   ├── toolkit/problems/[problemSlug]/page.tsx                 NEW
│       │   ├── toolkit/problems/[problemSlug]/drill/page.tsx           NEW
│       │   ├── toolkit/review/page.tsx                                 NEW
│       │   ├── progress/layout.tsx                                     NEW
│       │   ├── progress/page.tsx                                       NEW
│       │   ├── progress/patterns/page.tsx                              NEW
│       │   ├── progress/problems/page.tsx                              NEW
│       │   └── progress/streak/page.tsx                                NEW
│       └── api/blueprint/
│           ├── journey-state/route.ts                                  NEW
│           ├── units/route.ts                                          NEW
│           ├── units/[slug]/route.ts                                   NEW
│           ├── units/[slug]/progress/route.ts                          NEW
│           ├── events/route.ts                                         NEW
│           └── progress/summary/route.ts                               NEW
├── e2e/
│   └── blueprint-smoke.spec.ts                                         NEW
├── package.json                                                        MODIFY (+blueprint:seed-units)
└── docs/
    └── superpowers/blueprint/
        └── README.md                                                   NEW
```

~60 new files, ~8 modified, ~1 migration.

## 9. Post-SP1 state of the world

At the end of SP1:

- `/modules/blueprint` is live.
- All Blueprint routes resolve and show the shell.
- The shell has the correct chrome, breadcrumb, and navigation.
- The store + hooks + API + schema are ready.
- Analytics fires on module open.
- Zero user-facing features — every interior is a "Coming soon" placeholder.
- Old LLD is unchanged.

SP2 can begin immediately. SP2's brainstorm will iterate on the journey home screen (welcome + resume + map). All scaffolding it needs is already there.

---

*End of SP1 spec.*
