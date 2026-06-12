# 17 — Cross-Cutting Architectural Patterns

Cross-module spec sheet describing the conventions, idioms, and "house style" that recur across the architex codebase. Module-level deep dives live in codemaps 01–12; this document treats them as recurring rather than per-module facts.

> Companion ADRs: `docs/adr/ADR-001-zustand-over-redux.md`, `docs/adr/ADR-002-react-flow-v12.md`, `docs/adr/ADR-003-tailwind-v4-css-custom-properties.md`, `docs/adr/ADR-004-app-router-over-pages-router.md`, `docs/adr/ADR-005-vitest-over-jest.md`, `docs/adr/ADR-006-custom-simulation-engine.md`, `docs/adr/ADR-007-browser-only-architecture.md`, `docs/adr/ADR-008-module-based-architecture.md`. One-line summaries appear in section 14.

---

## 1. Purpose — What Makes This Codebase Recognizable

Architex is a Next.js 16 App-Router single-page workspace that runs **browser-first** with optional server endpoints layered on top (ADR-007). The recurring fingerprints across modules:

| Fingerprint | Where it shows |
|---|---|
| **One workspace at `/`, many modules switched by `activeModule` UI state.** | `src/app/page.tsx:1`, `src/stores/ui-store.ts:32-34`, ADR-008. |
| **Vanilla Zustand singletons, no Provider, persisted via `partialize`.** | `src/stores/index.ts:1-28`, `src/stores/ui-store.ts:1-2`, ADR-001. |
| **Drizzle + Postgres optional layer behind `getDb()` lazy singleton.** | `src/db/index.ts:34-65`. |
| **Clerk auth gated through `requireAuth()` / `resolveUserId()` helpers.** | `src/lib/auth.ts:29-112`. |
| **Hand-rolled validation in route handlers — no Zod.** | `src/app/api/lld/drill-attempts/route.ts:38-69`, `src/app/api/lld/learn-progress/[patternSlug]/route.ts:62-107`. |
| **Browser persistence as a stack: localStorage → IndexedDB → URL hash.** | ADR-007; `src/lib/persistence/idb-store.ts`, `src/lib/persistence/fallback-save.ts`, `src/lib/export/to-url.ts`. |
| **Tailwind v4 + CSS custom properties; one `cn()` helper.** | `src/lib/utils.ts:1-7`, ADR-003. |
| **React Query for server state; Zustand for client state.** | `src/providers/QueryProvider.tsx:15-48`. |
| **`route.ts` for APIs, `page.tsx` for routes, `layout.tsx` for nested chrome, `loading.tsx`/`error.tsx` for boundaries.** | ADR-004, files cataloged below. |
| **Web Workers via custom `worker-bridge` (not Comlink, even though Comlink is in `package.json`).** | `src/lib/workers/worker-bridge.ts:60-192`. |

Two "rules of thumb" pulled out and applied throughout:

1. **Optimistic local writes; eventual server reconciliation.** UI flips first, the network is best-effort.
2. **Recoverable errors carry a `code` so the UI can react in-line** — the 409 `ACTIVE_DRILL_EXISTS` pattern (`src/app/api/lld/drill-attempts/route.ts:99-112`).

---

## 2. Directory & Naming Conventions

### 2.1 Top-level layout

```
architex/
├── src/
│   ├── app/                  — App Router pages, layouts, route handlers, error/loading boundaries
│   │   ├── api/              — Route handlers (route.ts), 47 endpoints
│   │   ├── (auth)/           — Auth route group (Clerk catch-all)
│   │   ├── layout.tsx        — Root layout (providers, metadata)
│   │   ├── page.tsx          — Workspace ("use client")
│   │   ├── error.tsx         — Route error boundary
│   │   ├── loading.tsx       — Suspense fallback
│   │   ├── global-error.tsx  — Top-level error boundary
│   │   ├── not-found.tsx     — 404
│   │   ├── robots.ts         — Programmatic robots.txt
│   │   ├── sitemap.ts        — Programmatic sitemap.xml
│   │   ├── icon.tsx          — App icon
│   │   └── <route>/page.tsx  — 34 page.tsx files total
│   ├── components/
│   │   ├── ui/               — Primitives (button, dialog, popover, …)
│   │   ├── shared/           — Cross-module workspace chrome
│   │   ├── modules/          — Per-module wrappers/contents
│   │   ├── canvas/           — React Flow nodes/edges/overlays
│   │   ├── visualization/    — Charts, gauges, sparklines
│   │   ├── providers/        — Theme, motion, analytics, query
│   │   ├── ai/               — AI-flow specific chrome
│   │   ├── billing/, mobile/, pwa/, seo/, settings/, …
│   │   └── ...               — 28 component category folders
│   ├── stores/               — 14 Zustand stores + STATE_ARCHITECTURE.ts reference doc
│   ├── hooks/                — 52+ custom React hooks
│   ├── lib/                  — Domain logic, all browser-safe (50+ subdirectories)
│   │   ├── algorithms/, data-structures/, distributed/, …
│   │   ├── ai/               — Claude client, prompt safety, hint system
│   │   ├── persistence/      — IndexedDB, auto-save, fallback, hydration, migration
│   │   ├── workers/          — Worker bridge + 4 workers
│   │   ├── analytics/        — Web vitals, error tracking, consent
│   │   └── ...
│   ├── db/                   — Drizzle schema + seeds
│   │   ├── index.ts          — `getDb()` singleton, schema re-export
│   │   ├── schema/           — 24 schema files + relations.ts
│   │   └── seeds/            — Programmatic seed scripts
│   ├── providers/            — Top-of-tree providers (QueryProvider)
│   ├── types/                — Ambient .d.ts shims
│   ├── contexts/             — React contexts (LOD, etc.)
│   ├── __tests__/            — Vitest setup + cross-cutting tests
│   └── middleware.ts         — Clerk auth + CSP + rate limit
├── drizzle/migrations/       — SQL migrations + journal
├── docs/
│   ├── adr/                  — 8 ADRs
│   ├── CODEMAPS/             — Module deep-dives + this file
│   └── ...
├── e2e/                      — Playwright specs
├── content/lld/              — MDX/JSON content for LLD lessons
├── prompts/, templates/      — AI prompt library, system-design templates JSON
├── scripts/                  — One-off TypeScript scripts via tsx
└── public/                   — Static assets
```

### 2.2 Filename casing

| Surface | Casing | Examples |
|---|---|---|
| App Router files | **lowercase, framework-mandated** | `layout.tsx`, `page.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `robots.ts`, `sitemap.ts`, `icon.tsx`, `middleware.ts` |
| App Router dynamic segments | **square-bracket folders** | `[id]/route.ts`, `[patternSlug]/route.ts`, `[[...sign-in]]/page.tsx` |
| App Router groups | **parens** | `(auth)/sign-in/...` |
| `components/ui/` primitives | **kebab-case** | `button.tsx`, `confirm-dialog.tsx`, `scroll-area.tsx`, `sidebar-item.tsx` (28 files in this folder) |
| Feature components, wrappers, modules | **PascalCase** | `BaseNode.tsx`, `LandingPage.tsx`, `DesignBattle.tsx`, `SystemDesignWrapper.tsx` |
| Stores | **kebab-case + `-store.ts`** | `ui-store.ts`, `canvas-store.ts`, `interview-store.ts`, `drill-store.ts` |
| Hooks | **mixed** — both `use-` (kebab) and `useX` (camel) styles coexist | `use-keyboard-shortcuts.ts`, `use-search.ts`, `useBookmarks.ts`, `useLLDDesignSync.ts`, `useDrillStage.ts` |
| `lib/` files | **kebab-case** | `auto-save.ts`, `idb-store.ts`, `worker-bridge.ts`, `claude-client.ts` |
| Schema files | **kebab-case** | `lld-drill-attempts.ts`, `users.ts`, `lld-learn-progress.ts` |
| Test files | **co-located in `__tests__/` with `.test.ts(x)`** | `src/stores/__tests__/canvas-store.test.ts`, `src/lib/persistence/__tests__/persistence.test.ts` |
| Stories | **co-located, `.stories.tsx`** | `src/components/ui/button.stories.tsx`, `src/components/shared/activity-bar.stories.tsx` |

The hook-naming inconsistency is an unhealed seam (see section 13).

### 2.3 Variable / type / store naming

- **Variables and functions:** `camelCase`. Booleans tend to use `is`, `has`, `should` (`isPublic`, `isConfigured`, `hasWorker` — `src/db/schema/diagrams.ts`, `src/lib/workers/worker-bridge.ts:71`).
- **Constants:** `UPPER_SNAKE_CASE` for module-level limits and feature flags (`STALE_THRESHOLD_MS = 30 * 60 * 1000` in `src/app/api/lld/drill-attempts/active/route.ts:13`; `RATE_LIMIT = 30` in `src/app/api/lld/explain-inline/route.ts:34`; `MAX_URL_NODES = 30` in `src/lib/export/to-url.ts:9`; `COMPRESS_THRESHOLD = 8_192` in `src/lib/persistence/fallback-save.ts:13`).
- **Types and interfaces:** `PascalCase`. The codebase uses `interface` for most object shapes and `type` for unions / inferred / mapped (`src/lib/persistence/auto-save.ts:6-30`).
- **React component props:** `interface XxxProps` (no `React.FC`). Every public component file follows this — see all files under `src/components/ui/` for the pattern.
- **Store hook names:** `useXxxStore` returning the slice (`useUIStore`, `useCanvasStore`, …; `src/stores/index.ts:1-11`).
- **Drizzle table identifiers:** `camelCase` JS variable, `snake_case` SQL column, e.g. `userId: uuid("user_id")` (`src/db/schema/lld-drill-attempts.ts:32-34`).
- **Drizzle inferred types:** `User` / `NewUser` (`InferSelectModel` / `InferInsertModel`) — `src/db/schema/users.ts:38-39`. Some schema files use the newer `$inferSelect` / `$inferInsert` (`src/db/schema/lld-drill-attempts.ts:91-92`) — both styles coexist.

---

## 3. Data Flow

```
                                ┌────────────────────────────────────────┐
                                │             USER ACTIONS               │
                                │   click / keystroke / drag / scroll    │
                                └─────────────────┬──────────────────────┘
                                                  │
                                  ┌───────────────▼────────────────┐
                                  │  React Component ('use client')│
                                  └───────┬────────────┬───────────┘
                                          │            │
                  reads via useStore()    │            │ mutates via getState() or hooks
                                          │            │
                          ┌───────────────▼────────────▼────────────────┐
                          │        Zustand stores (CLIENT STATE)        │
                          │  ui / canvas / simulation / interview / …   │
                          │  + zundo-style snapshot UndoManager         │
                          └────┬────────────────────────────────┬───────┘
                               │                                │
        partialize → persist   │                                │ optimistic write
                               ▼                                ▼
            ┌──────────────────────────┐         ┌───────────────────────────┐
            │ localStorage (fast/few)  │         │ React Query useMutation   │
            │ keys: "architex-…"       │         │  onMutate optimistic flip │
            │ ui-store, canvas-store,  │         │  onError rollback         │
            │ progress-store, …        │         │  invalidateQueries onSuccess
            └──────────────────────────┘         └─────────────┬─────────────┘
                                                                │ fetch()
                                                                │
                                                                ▼
            ┌──────────────────────────┐         ┌──────────────────────────┐
            │ IndexedDB                │         │ Next.js Route Handler    │
            │ wrapped by               │         │ src/app/api/.../route.ts │
            │ src/lib/persistence/     │         │ requireAuth()            │
            │ idb-store.ts             │         │ resolveUserId()          │
            │ for: full canvas blobs,  │         │ parse + hand-validate    │
            │ interview session        │         │ getDb() drizzle query    │
            └──────────────────────────┘         │ NextResponse.json        │
                                                 └─────────────┬────────────┘
            ┌──────────────────────────┐                       │
            │ URL hash (?d=…)          │                       │
            │ lz-string compressed     │                       │
            │ src/lib/export/to-url.ts │                       ▼
            └──────────────────────────┘         ┌──────────────────────────┐
                                                 │  Postgres (Neon or pg)   │
                                                 │  Drizzle ORM             │
                                                 │  Schema in src/db/schema │
                                                 └──────────────────────────┘

                                                 + SSE stream (drill-interviewer)
                                                 + Web Worker (off-main-thread sim)
```

The pipe runs both ways: server endpoints can reset stores (e.g. `useLLDDrillSync`), and React Query invalidations cause a refetch that overwrites optimistic local state.

---

## 4. Auth Pattern

All authentication is funneled through two helpers in `src/lib/auth.ts`:

| Helper | Signature | Behavior |
|---|---|---|
| `requireAuth(): Promise<string>` | Returns the **Clerk user ID**. | Calls `auth()` from `@clerk/nextjs/server`. If no session: returns `DEV_CLERK_ID = "dev-user-local"` in development (`src/lib/auth.ts:17-33`); otherwise throws `new Error("Unauthorized")`. |
| `resolveUserId(clerkId): Promise<string \| null>` | Returns the **internal Postgres `users.id` UUID**. | Looks up by `clerkId`, creates a minimal user record if missing (using `currentUser()`), seeds the dev user automatically (`src/lib/auth.ts:52-112`). |
| `getAuthUser()` | Returns the Clerk user object or `null`. | Thin wrapper over `currentUser()` (`src/lib/auth.ts:39-42`). |
| `getUserTier(clerkId)` | Returns `"free"` by default. | Used by paywall / billing checks (`src/lib/auth.ts:118-127`). |

### 4.1 Standard auth boilerplate in every route handler

```ts
// src/app/api/diagrams/route.ts:13-40 (representative)
export async function GET() {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // … query …
    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/diagrams] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

This block — `try → requireAuth → resolveUserId → query → catch Unauthorized → catch all` — repeats verbatim in essentially every authenticated endpoint:

- `src/app/api/diagrams/route.ts:14-40, 43-91`
- `src/app/api/diagrams/[id]/route.ts:15-54, 57-122, 125-161`
- `src/app/api/lld/drill-attempts/route.ts:23-125, 127-166`
- `src/app/api/lld/drill-attempts/active/route.ts:15-63`
- `src/app/api/lld/drill-attempts/[id]/route.ts:22-127`
- `src/app/api/lld/designs/route.ts:19-67, 69-104`
- `src/app/api/lld/learn-progress/route.ts:13-46`
- `src/app/api/lld/learn-progress/[patternSlug]/route.ts:62-107, 109-235`

### 4.2 Public-route gating

Auth enforcement is layered:

1. **Middleware** (`src/middleware.ts:9-35, 102-106`) defines a `createRouteMatcher` for **public** routes (`/`, `/blog(.*)`, `/api/templates`, etc.). For non-public routes, `auth.protect()` is called, but **only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set** — without it, Clerk silently degrades.
2. **Per-route `requireAuth()`** runs again inside the handler so that even if middleware is bypassed (unit test, dev-mode, public-route fall-through), the handler is the source of truth.
3. **Public-by-default routes** (`api/health`, `api/templates`, `api/og`, `api/csp-report`, `api/oembed`, `api/webhooks/clerk`) skip both checks — see `src/middleware.ts:27-35`.

### 4.3 Webhooks

`src/app/api/webhooks/clerk/route.ts:12-49` does **not** call `requireAuth()`. Instead, it verifies the Svix HMAC signature with `CLERK_WEBHOOK_SECRET` and returns 401 on mismatch, then upserts the user row.

---

## 5. Validation Pattern

**There is no Zod, no Yup, no Joi, no Valibot.** A `grep` for `from "zod"` across `src/` returns zero matches. Validation is hand-rolled in two places:

### 5.1 Route-handler input validation

Each handler:

1. Parses the body with a `try/catch` returning 400 on JSON failure:
   ```ts
   // src/app/api/diagrams/route.ts:53-60
   let body: { title?: string; data?: unknown; templateId?: string };
   try {
     body = (await request.json()) as typeof body;
   } catch {
     return NextResponse.json(
       { error: "Invalid JSON in request body." },
       { status: 400 },
     );
   }
   ```
2. Uses `(await request.json().catch(() => ({})))` as a shorthand alternative (most LLD routes):
   ```ts
   // src/app/api/lld/drill-attempts/route.ts:31-37
   const body = (await request.json().catch(() => ({}))) as {
     problemId?: string;
     drillMode?: string;
     variant?: string;
     durationLimitMs?: number;
   };
   ```
3. Validates fields with explicit `typeof`, `instanceof`, `Set.has`, or numeric range checks (`src/app/api/lld/drill-attempts/route.ts:38-69`).
4. Returns 400 with a human-readable `error` string per failed field.

### 5.2 Domain-specific guards

For complex JSON payloads, ad-hoc type-guard functions appear inline:

```ts
// src/app/api/lld/learn-progress/[patternSlug]/route.ts:40-52
function isLearnSectionId(v: unknown): v is LearnSectionId {
  return typeof v === "string" && (ALL_SECTIONS as string[]).includes(v);
}

function isCheckpointStats(
  v: unknown,
): v is Record<string, { attempts: number; correct: number }> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
```

Numeric clamping is applied at the boundary (`clampUnit` in the same file, lines 33-38).

### 5.3 Backwards-compat normalization

When the wire schema evolves, the route normalizes legacy values rather than rejecting them. Example — Phase 1→4 drill variant rename:

```ts
// src/app/api/lld/drill-attempts/route.ts:15-21
const PHASE4_VARIANTS = new Set(["exam", "timed-mock", "study"]);
const PHASE1_TO_PHASE4: Record<string, string> = {
  interview: "timed-mock",
  guided: "study",
  speed: "exam",
};
const LEGACY_MODES = new Set(Object.keys(PHASE1_TO_PHASE4));
```

The same accommodation applies to the request field name (`variant ?? drillMode`, line 40).

---

## 6. Error Handling Pattern

### 6.1 Server response envelope

The wire format is **lightweight**, not the documented `ApiResponse<T> { success, data, error, meta }` envelope from `~/.claude/rules/typescript/patterns.md`. Successful responses return resource-keyed objects:

| Verb | Body | Status |
|---|---|---|
| `GET /api/diagrams` | `{ diagrams: Diagram[] }` | 200 |
| `GET /api/diagrams/[id]` | `{ diagram: Diagram }` | 200 |
| `POST /api/diagrams` | `{ diagram: Diagram }` | 201 |
| `DELETE /api/diagrams/[id]` | `{ deleted: true, id }` | 200 |
| `GET /api/lld/learn-progress` | `{ rows: ProgressRow[] }` | 200 |
| `GET /api/lld/drill-attempts/active` | `{ active: Attempt \| null }` | 200 |
| `GET /api/health` | `{ status, version, timestamp, uptime }` | 200 |

Error responses are always `{ error: string }` (sometimes plus `code`):

| Status | Body | When |
|---|---|---|
| 400 | `{ error: "Invalid JSON in request body." }` | JSON parse failure |
| 400 | `{ error: "<field> required" }` or `{ error: "<field> must be …" }` | Field validation failure |
| 401 | `{ error: "Unauthorized" }` | `requireAuth()` threw |
| 403 | `{ error: "Forbidden" }` | Owner mismatch (`src/app/api/diagrams/[id]/route.ts:38-43`) |
| 404 | `{ error: "User not found" }` or `{ error: "<resource> not found" }` | Lookup miss |
| 409 | `{ error: "…", code: "ACTIVE_DRILL_EXISTS" }` | Recoverable conflict (see §6.4) |
| 429 | `{ error: "Too many requests", retryAfter }` | Rate-limiter middleware (`src/middleware.ts:81-99`) |
| 500 | `{ error: "Internal server error" }` | Catch-all |
| 503 | `{ error: "<feature> not configured" }` | Missing env-var feature gate (`src/app/api/webhooks/clerk/route.ts:14-19`) |

Server-side errors are also logged to `console.error` with a `[<route-path>] <verb> error:` prefix — see `src/app/api/diagrams/route.ts:34, 85` and every other route handler.

### 6.2 Client error boundaries

Three App-Router-mandated boundaries, all `"use client"`:

- `src/app/loading.tsx:1-77` — workspace-shaped skeleton (icon column, canvas area, properties panel, bottom panel, status bar). Pure CSS, no IO.
- `src/app/error.tsx:1-32` — route-level error boundary. Logs the `error` to console and offers a `reset()` button.
- `src/app/global-error.tsx:1-38` — top-level boundary that re-renders `<html>`/`<body>`. Same shape as `error.tsx` but used when the root layout itself throws.
- `src/app/not-found.tsx` — 404 page.

Per-route loading skeletons exist for the SEO-served sections: `src/app/blog/loading.tsx`, `src/app/concepts/loading.tsx`, `src/app/dashboard/loading.tsx`, `src/app/gallery/loading.tsx`, `src/app/interviews/loading.tsx`, `src/app/lld-problems/loading.tsx`, `src/app/modules/loading.tsx`, `src/app/patterns/loading.tsx`.

### 6.3 Client fetch error handling

In hooks, the convention is `if (!res.ok) throw new Error("…HTTP status…")`:

```ts
// src/hooks/useLLDDesigns.ts:8-13
async function listDesigns(...) {
  const res = await fetch(...);
  if (!res.ok) throw new Error(`List designs failed: ${res.status}`);
  const json = (await res.json()) as { designs: LLDDesign[] };
  return json.designs;
}
```

React Query catches the throw and surfaces it through `error` on the hook return.

In hand-rolled fetch hooks (`src/hooks/useBookmarks.ts:97-104`), errors are stored in `useState<string | null>` and the optimistic update is rolled back.

### 6.4 Recoverable 409 (the "active drill" pattern)

The drill flow needed a way to tell the client "you can't start a new one — but here's how to recover." The handler distinguishes a Postgres unique-violation (SQLSTATE 23505) on the `one_active_drill_per_user` partial index and returns 409 with a stable `code`:

```ts
// src/app/api/lld/drill-attempts/route.ts:73-114
try {
  const [created] = await db.insert(lldDrillAttempts).values({...}).returning();
  return NextResponse.json({ attempt: created }, { status: 201 });
} catch (error) {
  // Postgres unique violation (SQLSTATE 23505) against the partial
  // `one_active_drill_per_user` index. Match broadly — drizzle/pg may wrap
  // the error so the literal index name isn't always in `error.message`.
  const err = error as {
    code?: string;
    message?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  const code = err.code ?? err.cause?.code;
  const constraint = err.constraint ?? err.cause?.constraint ?? "";
  const msg = err.message ?? "";
  if (
    code === "23505" ||
    constraint.includes("one_active_drill_per_user") ||
    msg.includes("one_active_drill_per_user") ||
    msg.toLowerCase().includes("duplicate key value")
  ) {
    return NextResponse.json(
      {
        error: "A drill is already active. Submit or abandon it first.",
        code: "ACTIVE_DRILL_EXISTS",
      },
      { status: 409 },
    );
  }
  throw error;  // anything else bubbles to the outer catch
}
```

The partial unique index that powers this is at `src/db/schema/lld-drill-attempts.ts:81-86`:

```ts
uniqueIndex("one_active_drill_per_user")
  .on(t.userId)
  .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`)
```

The client interprets the `code` field and shows an in-line "Abandon & start new" affordance instead of a generic error toast. (See git log: `3e6100d fix(drill): recoverable 409 — offer 'Abandon & start new' inline`.)

This is the canonical example for any future "blocked but recoverable" interaction in the codebase.

### 6.5 Stale-resource auto-cleanup

A different pattern for the same concern — sweep stale rows in the same query that reads the active row:

```ts
// src/app/api/lld/drill-attempts/active/route.ts:25-50
// Auto-abandon stale drills in a single UPDATE.
const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
await db
  .update(lldDrillAttempts)
  .set({ abandonedAt: new Date() })
  .where(
    and(
      eq(lldDrillAttempts.userId, userId),
      isNull(lldDrillAttempts.submittedAt),
      isNull(lldDrillAttempts.abandonedAt),
      lt(lldDrillAttempts.lastActivityAt, staleCutoff),
    ),
  );
// Then read what's left
const [active] = await db.select().from(lldDrillAttempts).where(...).limit(1);
```

`STALE_THRESHOLD_MS = 30 * 60 * 1000`. No background job — the read endpoint is the cleanup trigger.

---

## 7. Persistence Layer Pattern

Architex stacks persistence by payload size and durability needs (ADR-007).

### 7.1 The four tiers

| Tier | Library | Use-case | Capacity | Survives | Examples |
|---|---|---|---|---|---|
| 1. **localStorage** via Zustand `persist` | `zustand/middleware` | Small ephemeral preferences, last open module, dialog flags | ~5 MB total | Tab close, browser restart | `architex-ui` (`src/stores/ui-store.ts:202-219`), `architex-progress`, `architex-notifications`, `architex-ai-settings`, `architex-cross-module`, `architex-snapshots`, `architex:billing-store`. |
| 2. **localStorage** via direct API + `lz-string` | `lz-string` (`compressToUTF16`) | Last-resort emergency snapshot on `beforeunload` | ~5 MB compressed (~10× larger payloads) | Tab crash, browser restart | `architex-fallback-save` (`src/lib/persistence/fallback-save.ts:10-39`). Compresses if `JSON.stringify().length > 8_192`. |
| 3. **IndexedDB** | Hand-rolled wrapper, **not Dexie** | Full canvas blobs, interview sessions | ~50–100 MB+ | Tab close, browser restart | `architex-db` with stores `projects` and `settings` (`src/lib/persistence/idb-store.ts:120-149`); `architex-interview` for the live interview session (see codemap 07). |
| 4. **URL hash / share link** | `lz-string` (`compressToEncodedURIComponent`) | Sharing a diagram | ~30 nodes (URL-length practical cap) | Anywhere a link goes | `src/lib/export/to-url.ts:9, 37-62` (encode), `:68-…` (decode). |
| 5. **Postgres via Drizzle** | `drizzle-orm`, `@neondatabase/serverless`, `pg` | Long-term cross-device state, AI cost ledger, drill attempts | Unbounded (subject to Neon/Vercel) | Forever | All authenticated endpoints. |

Notable: **Dexie is in `package.json` (`"dexie": "^4.4.2"`, `"dexie-react-hooks": "^4.4.0"`) but `grep -r "from.*dexie"` in `src/` returns no hits.** The codebase rolled its own thin IndexedDB wrapper with the comment *"No external dependencies (no Dexie, no idb)"* (`src/lib/persistence/idb-store.ts:1-5`). Dexie is dead weight — see section 13.

### 7.2 Persistence-decision rule

Per the patterns observed:

- **Persisted to LS**: derived/UI state that is fine to lose → `partialize` whitelists.
- **Persisted to IDB**: large-payload domain data the user would mourn losing.
- **Synced to DB**: anything that should follow a user across devices.
- **URL hash**: anything the user might want to share or bookmark.

### 7.3 Auto-save engine

`src/lib/persistence/auto-save.ts:32-94` defines `createAutoSave<T>()` — a closure-based debounced save manager:

- `markDirty()` schedules a `setTimeout(doSave, debounceMs)` (debounce window resets on each call).
- `forceSave()` flushes immediately.
- `getStatus()` returns `"idle" | "saving" | "saved" | "error"`.
- On error, `dirty = true` is reset so the next attempt retries.

Status is exposed to the UI via `src/hooks/useSaveStatus.ts` (consumed by `src/components/canvas/CanvasDescription.tsx`, etc.). The migration / hydration / fallback files (`src/lib/persistence/migration.ts`, `hydration.ts`, `fallback-save.ts`) are layered on top — see codemap 07 for the detailed call graph.

### 7.4 Migration on sign-in

When an unauthenticated user (LS-only) signs in, `migrateLocalStorageToDb()` runs once from `src/providers/QueryProvider.tsx:36-38`. The migration reads LS keys and PATCHes the corresponding `/api/...` endpoints so anonymous progress isn't lost.

---

## 8. Server / Client Boundary Pattern

ADR-004 codifies that everything is App Router; this section documents how the boundary is drawn in practice.

### 8.1 Route → page kind mapping

| Route group | Kind | `"use client"` directive | Why |
|---|---|---|---|
| `/` (`page.tsx`) | Client | Yes (line 1) | The entire interactive workspace. |
| `/blog`, `/blog/[slug]` | Server | No | Static MDX content; SEO; no interaction. |
| `/concepts`, `/concepts/[slug]` | Server | No | Static SEO content. |
| `/landing` | Server | No (delegates to `<LandingPage>` which is `"use client"`) | Server fetches metadata, hands off. |
| `/dashboard` | Client | Yes | Interactive charts, store reads. |
| `/settings` | Server (with client islands) | No | `metadata` export at top, Clerk client widgets inside. |
| `/(auth)/sign-in/...` | Client (Clerk) | Yes | Clerk catch-all renders client-only widget. |
| `/api/*` | Route handler | n/a (`route.ts`) | App Router file-mode `route.ts`. |
| `/robots.ts`, `/sitemap.ts`, `/icon.tsx`, `/api/og/route.tsx` | Build-time | n/a | Programmatic file generation. |

### 8.2 The Provider stack

`src/app/layout.tsx:64-98` mounts the **single Provider tree** that wraps every page:

```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <Wrapper>                  {/* MaybeClerkProvider — present iff Clerk env is set */}
      <ThemeProvider>          {/* next-themes → .dark/.light class on <html> */}
        <MotionProvider>       {/* motion + prefers-reduced-motion */}
          <AnalyticsProvider>  {/* PostHog + web vitals */}
            <QueryProvider>    {/* TanStack Query + dev-only devtools */}
              <a href="#main-content">Skip to main content</a>
              {children}
              <InstallPrompt />  {/* PWA install banner */}
              <UpdateToast />    {/* SW update notice */}
              <ToastContainer /> {/* App-wide toasts */}
            </QueryProvider>
          </AnalyticsProvider>
        </MotionProvider>
      </ThemeProvider>
    </Wrapper>
  </body>
</html>
```

There is **no Zustand provider** — the stores are vanilla singletons (ADR-001).

Clerk is **conditionally wrapped**: `src/app/layout.tsx:14-24` requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and uses a runtime `require()` to avoid Clerk's "Configure your application" popup when keys are absent.

### 8.3 Module boundary inside `/`

The workspace itself dynamic-imports each module wrapper with `ssr: false` to keep the workspace TTFB low:

```tsx
// src/app/page.tsx:37-80
const SystemDesignModuleContent = dynamic(
  () => import("@/components/modules/wrappers/SystemDesignWrapper"),
  { ssr: false },
);
```

The "all hooks called unconditionally" pattern (ADR-008 §4) applies inside the resolved module.

### 8.4 The "use client" footprint

A grep finds **330 files** under `src/components/` with `"use client"` — practically every component file. The ones without it are pure utility helpers or SSR-safe formatters.

---

## 9. Streaming Pattern

Server-Sent Events are used for **one** flow: the AI interviewer chat at `src/app/api/lld/drill-interviewer/[id]/stream/route.ts:103-244`.

### 9.1 Two-verb design

The endpoint splits user/AI turns across two HTTP methods on the same path:

| Verb | Purpose | Status | Body |
|---|---|---|---|
| `POST` | Persist the user's typed message + bump `lastActivityAt`. | 201 | `{ ok: true, seq: number }` |
| `GET` | Open an SSE stream that yields the AI reply token-by-token, then persists the assistant turn. | 200, `text/event-stream` | `data: {"type":"delta","text":"…"}` lines, ending in `data: {"type":"done"}` or `data: {"type":"error","error":"…"}` |

### 9.2 Implementation outline

```ts
// src/app/api/lld/drill-interviewer/[id]/stream/route.ts:178-244
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    const send = (payload: Record<string, unknown>) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    try {
      const { ClaudeClient } = await import("@/lib/ai/claude-client");
      const client = ClaudeClient.getInstance();

      let fullReply = "";
      if (!client.isConfigured()) {
        fullReply = "(Interviewer persona requires the Anthropic API key … Settings > AI.)";
        send({ type: "delta", text: fullReply });
      } else {
        const response = await client.call({...});
        fullReply = response.text;
        send({ type: "delta", text: fullReply });
      }

      // Persist the interviewer's finished turn
      await db.insert(lldDrillInterviewerTurns).values({...});
      send({ type: "done" });
    } catch (err) {
      send({ type: "error", error: err instanceof Error ? err.message : "Stream failed" });
    } finally {
      controller.close();
    }
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  },
});
```

Note that the current implementation gathers the full Claude reply before emitting a single delta — it's a streaming-shaped envelope but not yet incremental. The contract is in place for token streaming when needed.

### 9.3 Client side

`src/hooks/useDrillInterviewer.ts` opens an `EventSource` against the same path with method `GET`. The shape `{ type: "delta" | "done" | "error" }` is the wire contract.

---

## 10. Worker / Compression Pattern

### 10.1 Web Workers

Architex offloads four CPU-heavy tasks to dedicated workers under `src/lib/workers/`:

| Worker | File | Workload |
|---|---|---|
| `simulation-worker.ts` | `src/lib/workers/simulation-worker.ts:1-…` | Per-tick queuing-model math (`simulateNode` from `src/lib/simulation/queuing-model.ts`). |
| `algorithm-worker.ts` | `src/lib/workers/algorithm-worker.ts` | Algorithm step generation (sort, graph, etc.). |
| `layout-worker.ts` | `src/lib/workers/layout-worker.ts` | Dagre layout computation. |
| `minimap-worker.ts` | `src/lib/workers/minimap-worker.ts` | Minimap canvas rasterization. |

### 10.2 The bridge

`src/lib/workers/worker-bridge.ts:60-192` defines `createWorkerBridge(workerUrl, options)` — a typed request/response wrapper with:

- **Message-ID correlation:** every request gets `msg_<timestamp>_<counter>` (`src/lib/workers/worker-bridge.ts:46-51`).
- **Per-request timeout** (default 30 s; rejects with `Worker request timed out after Nms`).
- **Idle auto-termination** (default 60 s; the worker is `terminate()`d when no requests for the idle window and started lazily on the next `send()` — `src/lib/workers/worker-bridge.ts:106-151`).
- **Synchronous fallback** when `typeof Worker === "undefined"` (SSR, vitest jsdom). The `fallback` option lets the same code run on the main thread (`src/lib/workers/worker-bridge.ts:71-99`).

Comlink is in `package.json` (`"comlink": "^4.4.2"`) but unused — see section 13.

### 10.3 lz-string compression

`lz-string` is used only at the persistence boundary, never for in-memory data:

| Site | Function | Purpose |
|---|---|---|
| `src/lib/persistence/fallback-save.ts:7, 33` | `compressToUTF16` / `decompressFromUTF16` | Crash-recovery localStorage payload, threshold `> 8_192` bytes (`COMPRESS_THRESHOLD`). |
| `src/lib/export/to-url.ts:2, 61, 72` | `LZString.compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` | Shareable URL diagram payload. |
| `src/lib/collaboration/shareable-links.ts` | Same | Cross-app sharing. |

The compressed payload ships only "essential" fields (positions are rounded; visual-only fields stripped — `src/lib/export/to-url.ts:14-32`).

---

## 11. Testing Pattern

ADR-005 picks Vitest. The test layout reflects that decision plus a Playwright e2e suite.

### 11.1 Test types and file locations

| Layer | Runner | Location | Glob | Setup |
|---|---|---|---|---|
| Unit (algorithms, data structures, simulation, stores, util libs) | Vitest 4 | Co-located `__tests__/` next to source | `src/**/*.test.{ts,tsx}` | `src/__tests__/setup.ts` |
| Component (React) | Vitest + jsdom + `@testing-library/react` + `@testing-library/jest-dom` | Co-located `__tests__/` | Same | Same |
| End-to-end | Playwright | `e2e/` | `e2e/*.spec.ts` | `playwright.config.ts` |
| Visual stories | Storybook 8 | Co-located `*.stories.tsx` | `.storybook/main.ts:3` → `../src/**/*.stories.@(ts|tsx)` | `.storybook/preview.ts` |

### 11.2 Vitest config

```ts
// vitest.config.ts (entire file)
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

The `@/` alias is shared between the main TS config (`tsconfig.json:24-28`) and Vitest. `globals: true` is on but tests still import explicitly for clarity (ADR-005 §6).

### 11.3 Setup file

`src/__tests__/setup.ts:1-67` does three things:

1. Stubs `ResizeObserver` and `IntersectionObserver` (jsdom doesn't ship them).
2. Patches `globalThis`, `window`, and `global` with an in-memory Storage when Node 25's stubbed `localStorage` shadows jsdom's implementation. This is a Node-25-specific workaround documented in the file header.
3. No analytics/PostHog/Clerk mocks — these are mocked per-test as needed.

### 11.4 Playwright

```ts
// playwright.config.ts (entire file)
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: { command: 'pnpm dev', port: 3000, reuseExistingServer: true },
});
```

E2E specs cover only the critical-path flows:

- `e2e/algorithm-run.spec.ts` — algorithm step-through.
- `e2e/command-palette.spec.ts` — Cmd+K interactions.
- `e2e/keyboard-shortcuts.spec.ts` — global hotkeys.
- `e2e/lld-drill-mode.spec.ts` — drill lifecycle (start/pause/submit).
- `e2e/module-switching.spec.ts` — activity-bar navigation.
- `e2e/template-load.spec.ts` — template gallery → canvas hydration.

### 11.5 When to use which

(Inferred from existing test placement, not codified anywhere.)

- **Unit:** any pure function in `src/lib/`, every Zustand store, every persistence helper.
- **Component:** node renderers (`SystemDesignNodes.test.tsx`), overlay panels.
- **E2E:** flows that exercise the full Provider stack and route handlers.
- **Story:** primitive UI (`button`, `toast`, `badge`), shared chrome (`activity-bar`), heavy custom components (`BaseNode`).

There is **no integration-test layer between Vitest and Playwright** — the route handlers are exercised through e2e or unit tests of helper libraries.

### 11.6 Scripts

```json
// package.json:7-13
"lint": "eslint",
"typecheck": "tsc --noEmit",
"type-check": "tsc --noEmit",       // alias kept for muscle memory
"format": "prettier --write \"src/**/*.{ts,tsx}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
"test": "vitest",                    // watch mode
"test:run": "vitest run",            // CI
```

`pnpm test -- --ui` opens the Vitest UI dashboard (`@vitest/ui` is a dev dep).

---

## 12. Storybook Pattern

Storybook 8 runs against the Next.js framework adapter:

```ts
// .storybook/main.ts (entire file)
import type { StorybookConfig } from '@storybook/nextjs';
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: { name: '@storybook/nextjs', options: {} },
  staticDirs: ['../public'],
};
export default config;
```

### 12.1 Story conventions

Story files are co-located with components and follow the CSF3 pattern:

```ts
// src/components/ui/button.stories.tsx (representative)
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...] },
    size: { control: 'select', options: [...] },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

// ── Variants ──
export const Default: Story = { args: {...} };
export const Destructive: Story = { args: {...} };
// …

// ── Sizes ──
export const Small: Story = { args: {...} };

// ── States ──
export const Disabled: Story = { args: { disabled: true } };

// ── Gallery ──
export const AllVariants: Story = {
  render: () => (<div className="flex flex-wrap gap-3">…all variants…</div>),
};
```

Sections recur in this order: **Variants → Sizes → States → Gallery**.

Story title is `Category/ComponentName`:
- `UI/Button`, `UI/Toast`, `UI/Badge` for primitives.
- `Shared/ActivityBar` for shared chrome.
- `Canvas/BaseNode` for canvas components.

The stories that exist (5 files):
- `src/components/ui/button.stories.tsx`
- `src/components/ui/toast.stories.tsx`
- `src/components/ui/badge.stories.tsx`
- `src/components/shared/activity-bar.stories.tsx`
- `src/components/canvas/nodes/system-design/BaseNode.stories.tsx`

### 12.2 Coverage gap

Storybook is **not used systematically** — only 5 stories exist for what the codebase tracks as 28+ component categories and 32 system-design nodes. It is essentially a sample, not a design-system source of truth. Module deep-dives (codemap 09 — UI tour) cover what's not in Storybook.

---

## 13. Things That Vary by Module (informational)

These are seams where the codebase is **not** consistent. Listed as facts, no critique.

| Seam | What varies | Where |
|---|---|---|
| Hook filename casing | `use-keyboard-shortcuts.ts` (kebab) vs `useBookmarks.ts` (camel) — both styles in `src/hooks/`. | 24 files use `use-…` style, 28 use `useX…` style. |
| Component filename casing | `components/ui/button.tsx` (kebab) vs `components/ui/SoundToggle.tsx` (Pascal). | `SoundToggle.tsx`, `AnimatedButton.tsx` are exceptions in an otherwise kebab folder. |
| Drizzle inferred types | `InferSelectModel<typeof users>` (`users.ts:38`) vs `typeof lldDrillAttempts.$inferSelect` (`lld-drill-attempts.ts:91`) — both styles coexist. | Older schemas use the function form; newer ones use the property form. |
| Body parse style | `try { body = JSON } catch { 400 }` (`diagrams/route.ts:53-60`) vs `(await req.json().catch(() => ({})))` (`drill-attempts/route.ts:31`). | The try/catch form is older; the `.catch(() => ({}))` form is newer and now dominant. |
| API response key | Sometimes the resource is keyed by name (`{ diagram }`, `{ rows }`, `{ active }`); occasionally by entity plural (`{ diagrams }`). | Convention is "always `name` or `namePlural`, never raw array". |
| Persisted store coverage | Some stores fully persist (`progress-store`); some `partialize` carefully (`ui-store`, `canvas-store`); some don't persist at all (`viewport-store`, `simulation-store`, `editor-store`). | See codemap 07 §2.1 for the full grid. |
| LS key naming | `architex-ui`, `architex-canvas` (no colon) vs `architex:billing-store` (colon) vs `architex-fallback-save`. | Three different separators. |
| Console logging | Most route catches use `console.error("[<route>] <verb> error:", error)` but some use `console.log` for trace messages (`drill-attempts/[id]/route.ts:55-60`). | No structured logger; each call site decides format. |
| ID strategy | DB primary keys are `uuid().defaultRandom()` everywhere. Client-side IDs use `crypto.randomUUID()` directly (`src/lib/lld/class-diagram-model.ts:42`). Slugs are kebab-case derived (`src/app/api/lld/designs/route.ts:11-17`). | No cuid/nanoid in use. |
| Validation depth | `diagrams` route checks only `title` presence; `learn-progress` route does deep field-by-field guards. | Validation rigor varies with payload complexity, not by handler age. |
| Heartbeat / activity tracking | Drill flow uses an explicit `heartbeat` PATCH action (`drill-attempts/[id]/route.ts:69-70`); other flows just bump `lastActivityAt` on writes. | Different cadences for different staleness windows. |
| Optimistic-update implementation | `useBookmarks.ts:80-107` rolls its own optimistic toggle with `useState`; `useLLDDesigns.ts:38-46` uses `useMutation` with `invalidateQueries` (no optimistic flip). | TanStack Query `onMutate` is not used systematically — most "optimism" is hand-rolled in component-level state. |
| `package.json` orphans | `comlink ^4.4.2`, `dexie ^4.4.2`, `dexie-react-hooks ^4.4.0`, `zundo ^2.3.0` are listed but not imported anywhere in `src/`. | Codemap 07 notes the same on `zundo`. They're carried forward from earlier design decisions; safe to remove if treated as a separate cleanup. |

---

## 14. Pointers to the 8 ADRs

| ADR | One-line decision | File |
|---|---|---|
| ADR-001 | **Zustand v5** for all client state — singletons, no Provider, persist via middleware. | `docs/adr/ADR-001-zustand-over-redux.md` |
| ADR-002 | **React Flow v12** (`@xyflow/react`) for the canvas — custom nodes, handles, LOD. | `docs/adr/ADR-002-react-flow-v12.md` |
| ADR-003 | **Tailwind v4 + CSS custom properties** — semantic tokens in `globals.css`, `cn()` helper. | `docs/adr/ADR-003-tailwind-v4-css-custom-properties.md` |
| ADR-004 | **App Router exclusively** — `route.ts`, `page.tsx`, route groups, nested layouts. | `docs/adr/ADR-004-app-router-over-pages-router.md` |
| ADR-005 | **Vitest v4** for unit/component, Playwright for e2e — shared `@/` alias. | `docs/adr/ADR-005-vitest-over-jest.md` |
| ADR-006 | **Custom simulation engine** in `src/lib/simulation/` — M/M/c queuing, what-if, SLA. | `docs/adr/ADR-006-custom-simulation-engine.md` |
| ADR-007 | **Browser-only architecture** — IndexedDB + LS for state; APIs are optional enhancement. | `docs/adr/ADR-007-browser-only-architecture.md` |
| ADR-008 | **Module-based architecture** — `useXxxModule()` hook returns 4 panel slots. | `docs/adr/ADR-008-module-based-architecture.md` |

---

## 15. Open Questions

Things this codemap cannot resolve from source alone — flagged for future codemaps or product calls.

1. **Should the `package.json` orphans (`comlink`, `dexie`, `dexie-react-hooks`, `zundo`) be removed?** They are confirmed unused but each represents a former architecture decision. Removal needs a one-shot `pnpm remove` plus a CI bundle-size check.
2. **Is the hook-filename split (`use-x.ts` vs `useX.ts`) intentional?** The split correlates with author/era but no rule is documented. The TypeScript rules in `~/.claude/rules/typescript/coding-style.md` favour `use` prefix camelCase but don't pick filename casing.
3. **Should Zod be introduced for route-handler validation?** Validation is currently hand-rolled and inconsistent in depth (§13). Zod would standardize but adds a runtime cost and a refactor surface across 47 route files.
4. **Is the lightweight envelope (`{ <resource>: T }` / `{ error: string }`) intentional vs the documented `ApiResponse<T>` shape?** The codebase consistently uses the lightweight one, but `~/.claude/rules/typescript/patterns.md` advertises a richer envelope. New endpoints could go either way without precedent guiding them.
5. **Is auto-abandonment of stale drills (30 min idle) a per-flow choice or a generalizable pattern?** Currently only the drill flow does this; other long-running operations (interview challenges, AI evaluation) don't have an equivalent sweep.
6. **Storybook coverage** — at 5 stories total, is Storybook a deliberate "primitives only" tool, or an unfinished migration? The four stable categories (`UI/`, `Shared/`, `Canvas/`) suggest the former; module deep-dives suggest the latter.
7. **The 409-recoverable pattern is documented here** — should it become a project rule for any "blocked but recoverable" interaction? No other endpoint in the codebase currently uses it.
8. **Drizzle query placement** — currently every query lives inline in the route handler; there is no `lib/db/queries/<entity>.ts` repository layer. Worth a future seam decision when complexity grows.
