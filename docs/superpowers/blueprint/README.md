# Blueprint · Developer Guide

Blueprint is Architex's structured curriculum for object-oriented design.
It sits beside `/modules/lld` — both modules coexist and share underlying
data (patterns, problems, FSRS) but have their own shells and routes.

## Status

- **SP1 (Foundation) · SHIPPED in this branch.** Schema, shell, route tree,
  store, hooks, API, nav entry in place. Every interior page is a
  "Coming soon" placeholder that points to a future sub-project.
- SP2–10 · pending. See `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md` §11.

## Running locally

```bash
cd architex
pnpm install
# Apply migrations (requires DATABASE_URL)
pnpm db:migrate
# Seed the curriculum (12 placeholder units)
pnpm blueprint:seed-units
pnpm dev
# open http://localhost:3000/modules/blueprint
```

## Architecture

See the vision spec for the full picture. Quick map:

- Route tree · `src/app/modules/blueprint/*`
- Shell · `src/components/modules/blueprint/BlueprintShell.tsx`
- Store · `src/stores/blueprint-store.ts` (Zustand + persist)
- Hooks · `src/hooks/blueprint/*` (route, journey-state sync, unit-progress sync, analytics)
- API · `src/app/api/blueprint/*`
- Schema · `src/db/schema/blueprint-*.ts`
- Analytics · `src/lib/analytics/blueprint-events.ts` (25 typed builders)
- Content (MDX + YAML) · `content/blueprint/*` — populated per unit during SP7–9

## Adding a new API route

1. Create `src/app/api/blueprint/<path>/route.ts`.
2. Import `getDb` and schema tables from `@/db`.
3. Auth with `const clerkId = await requireAuth(); const userId = await resolveUserId(clerkId);` — match existing `/api/lld/*` convention.
4. Return `NextResponse.json(...)`. Wrap in try/catch with explicit 401 on `"Unauthorized"`.

## Adding an analytics event

1. Add the typed builder to `src/lib/analytics/blueprint-events.ts`.
2. Update `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md` §15.1 if the event is user-facing.
3. Fire via `useBlueprintAnalytics()`:
   ```tsx
   const { track } = useBlueprintAnalytics();
   track(blueprintUnitOpened({ unitSlug: "meet-builder", entry: "map" }));
   ```

## Invariants

From SP1 spec §4 — tested and enforced:

1. **URL is the single source of truth for surface.** Store is a cache.
2. **Writes flow UI → store → server.** Never skip store.
3. **Every Blueprint route renders through `BlueprintShell`.**
4. **Analytics events are typed via builders only.** No raw `posthog.capture()`.
5. **`currentSurface` is exactly one of three values.** Exhaustive switch.
6. **No imports from old LLD's `useLLDModule` / `useLLDModuleImpl`.** Standalone module.
7. **Server reads are paginated/bounded.** Events cap at 100 per POST.

## Anti-patterns (do not do)

From the vision-spec appendix:
- Adding a top-level mode switcher to Blueprint.
- Rendering Toolkit panels alongside Journey panels.
- Naked `?mode=` query param in the URL.
- Computing `currentSurface` from anything other than the URL.
- Embedding the Unit Renderer inside the Toolkit or vice versa.

## Current sub-project roadmap

See `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md` §11.

| SP  | Scope                                 | Status |
| --- | ------------------------------------- | ------ |
| 1   | Foundation (schema / shell / routes)  | ✓      |
| 2   | Journey home + progress dashboard     | pending |
| 3   | Unit renderer + section types         | pending |
| 4   | Toolkit · Patterns Library            | pending |
| 5   | Toolkit · Problems Workspace          | pending |
| 6   | Toolkit · Review Inbox (FSRS)         | pending |
| 7   | Content · Units 1–4 (foundations + creational wave 1) | pending |
| 8   | Content · Units 5–8 (rest creational + structural)    | pending |
| 9   | Content · Units 9–12 (behavioral + applied)           | pending |
| 10  | Polish (motion, typography, a11y, analytics)          | pending |
