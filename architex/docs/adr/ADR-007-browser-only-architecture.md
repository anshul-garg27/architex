# ADR-007: Browser-Only Architecture (No Backend for Core Features)

**Status:** Accepted

**Date:** 2024

## Context

Architex is an educational tool for learning system design, algorithms, data structures, and related CS topics. The core workflow is entirely interactive: users drag components onto a canvas, run simulations, step through algorithms, and explore distributed system concepts.

The question is whether core features (canvas state, simulation, persistence, templates) should require a backend server, or whether the application should function entirely in the browser.

Options considered:

1. **Full-stack with database** -- All state persisted server-side via API routes to PostgreSQL. Requires auth, database hosting, and backend infra.
2. **Browser-only for core, API for optional features** -- Core editing, simulation, and visualization work offline. Backend used only for optional features (AI evaluation, diagram sharing, user accounts).
3. **Browser-only only** -- No backend whatsoever.

## Decision

Adopt a **browser-only architecture for all core features**, with API routes reserved for optional enhancement features (AI hints, diagram persistence to server, Clerk auth webhooks).

## Rationale

1. **Immediate usability.** Users can open the app, build architectures, run simulations, and study algorithms without creating an account or waiting for API calls. The workspace is fully functional on first load.

2. **Client-side persistence.** Diagram state is saved to the browser using multiple layers:

   - **Zustand `persist` middleware** saves UI preferences and active module to `localStorage` (`src/stores/ui-store.ts`).
   - **IndexedDB via Dexie** stores full diagram data (nodes, edges) for larger payloads (`src/lib/persistence/idb-store.ts`).
   - **Auto-save** periodically writes canvas state (`src/lib/persistence/auto-save.ts`).
   - **Fallback save** uses `localStorage` when IndexedDB is unavailable (`src/lib/persistence/fallback-save.ts`).
   - **Migration** handles schema changes across versions (`src/lib/persistence/migration.ts`).
   - **Hydration** restores state on page load (`src/lib/persistence/hydration.ts`).

3. **Templates are static JSON.** All 55 system-design templates live as JSON files in `templates/system-design/` and are imported statically at build time via `src/lib/templates/index.ts`. No API call is needed to browse or load templates.

4. **Algorithms are pure functions.** All 54+ algorithm implementations (sorting, graph, tree, DP, string, backtracking, geometry) are pure TypeScript functions in `src/lib/algorithms/`. They run entirely in the browser with zero network dependency.

5. **Simulation runs in the browser.** The simulation engine, what-if analysis, SLA calculator, and chaos engine all operate on in-memory canvas state. No server round-trip is needed.

6. **Data structures are client-side.** All 21+ data structure implementations (bloom filter, skip list, B+ tree, consistent hash ring, LSM tree, etc.) in `src/lib/data-structures/` are self-contained.

7. **Offline capability.** The app includes an offline page (`src/app/offline/page.tsx`) and is structured for PWA support. Core features work without internet access.

8. **Export without a server.** Diagrams can be exported to JSON, PNG, SVG, Mermaid, PlantUML, and even Terraform format entirely client-side (`src/lib/export/`). PDF export uses the browser's print pipeline.

9. **URL sharing.** The `to-url.ts` exporter compresses diagram state with `lz-string` and encodes it in the URL, enabling sharing without any server storage.

### Optional backend features

The following features use API routes but are not required for core functionality:

| Feature | Route | Purpose |
|---------|-------|---------|
| AI Evaluation | `api/evaluate/route.ts` | Send diagram to LLM for feedback |
| AI Hints | `api/hint/route.ts` | Get design suggestions |
| Diagram CRUD | `api/diagrams/route.ts` | Server-side persistence (requires auth) |
| Template API | `api/templates/route.ts` | Template listing (alternative to static import) |
| Challenge API | `api/challenges/route.ts` | Challenge data for interview mode |
| Auth Webhooks | `api/webhooks/clerk/route.ts` | Clerk user lifecycle events |
| OG Images | `api/og/route.tsx` | Dynamic social preview images |
| Health Check | `api/health/route.ts` | Deployment health monitoring |

## Consequences

### Positive

- Zero infrastructure cost for the core experience. The app can be hosted on any static hosting platform (Vercel, Netlify, GitHub Pages).
- Instant interactions -- no loading spinners for core operations.
- Privacy -- diagram data stays in the user's browser unless they explicitly share or use AI features.
- Simplified development -- most features can be developed and tested without running a backend.
- Works offline after initial load.

### Negative

- Browser storage has limits (~5MB localStorage, ~50MB+ IndexedDB). Very large diagrams may approach these limits.
- No cross-device sync without server-side persistence (users can manually export/import JSON).
- AI features require API keys configured in environment variables (`.env`), adding deployment complexity.
- No collaborative editing (would require a real-time sync backend like Liveblocks or Yjs).

## References

- Persistence system: `src/lib/persistence/`
- Persistence tests: `src/lib/persistence/__tests__/`
- IndexedDB store: `src/lib/persistence/idb-store.ts`
- Auto-save: `src/lib/persistence/auto-save.ts`
- Export modules: `src/lib/export/`
- Import: `src/lib/import/from-json.ts`
- URL export: `src/lib/export/to-url.ts`
- Templates (static): `templates/system-design/*.json`
- Offline page: `src/app/offline/page.tsx`
- API routes (optional): `src/app/api/`
- Environment config: `.env.example`
