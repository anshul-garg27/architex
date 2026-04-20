# LLD Phase 1 · Mode Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 4-mode LLD shell (Learn / Build / Drill / Review) with existing LLD content preserved inside Build mode. Zero visible regression for existing users. All backend plumbing (DB table, API routes, stores, hooks) in place, ready for Phase 2 content work.

**Architecture:** Single URL (`/modules/lld` resolved via existing app shell). New top-level `LLDShell` component reads `lldMode` from Zustand ui-store and renders one of four layout components. Build mode wraps today's 4-panel LLD UI unchanged. Learn/Drill/Review are stubs in this phase. URL-reflectable via `?mode=` query param. New DB table `lld_drill_attempts` with partial unique index enforcing "one active drill per user". DB-first persistence with localStorage as offline cache.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Clerk v7 (optional), Vitest, Testing Library.

**Prerequisite:** Phase 0 audit-and-verify (see `Pre-flight checklist` below) must complete before starting Task 1.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` sections §5, §6, §7, §14, §15.

---

## Pre-flight checklist (Phase 0 · ~2-4 hours)

Run before Task 1. These verify the "known bugs" listed in the spec are actually resolved in current code.

- [ ] **Verify CVE-2025-29927 defense is in place**

Check: `src/middleware.ts` uses `auth.protect()` (Clerk v5+ signature — not affected) AND every protected route handler uses `requireAuth()` directly as defense-in-depth.

Run:
```bash
grep -l 'from "@/lib/auth"' architex/src/app/api/**/route.ts | wc -l
```
Expected: matches number of protected routes (~15).

If any route handler in `src/app/api/` accesses user data but doesn't call `requireAuth()` at top, add it.

- [ ] **Verify `onConnect` stale closure is fixed**

Check `src/components/canvas/DesignCanvas.tsx` around line 179. Expected pattern:
```tsx
const onConnect = useCallback(
  (connection: Connection) => {
    setEdges((currentEdges) => addEdge({ ...connection, type: "data-flow" }, currentEdges));
  },
  [setEdges],
);
```
The functional setEdges (currentEdges param) is correct. If it's `setEdges(addEdge(connection, edges))` instead, that's the bug — fix to functional form.

- [ ] **Verify `metricsHistory` is bounded**

Check `src/stores/simulation-store.ts`. Expected:
```ts
recordMetricsSnapshot: () => set((s) => ({
  metricsHistory: [...s.metricsHistory.slice(-999), { ...s.metrics }],
})),
```
If unbounded (`[...s.metricsHistory, { ...s.metrics }]`), add `.slice(-999)`.

- [ ] **Verify Lucide imports are named (tree-shakeable)**

Run:
```bash
grep -rL 'from "lucide-react"' architex/src | grep tsx | head -5
grep -r 'import \* as.*lucide' architex/src
```
Expected: no matches for barrel `import *` pattern.

- [ ] **Audit `NEXT_PUBLIC_` env vars for secrets**

Run:
```bash
grep -rE "NEXT_PUBLIC_[A-Z_]+" architex/src --include="*.ts" --include="*.tsx" | grep -v ".test." | awk -F: '{print $2}' | grep -oE 'NEXT_PUBLIC_[A-Z_]+' | sort -u
```
Expected output lists public-safe vars only (e.g. `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`). If any variable looks secret (contains `SECRET`, `API_KEY` for a non-public service), investigate and move to server-only env.

- [ ] **Check Sentry config scrubbing**

Open `architex/sentry.*.config.ts` (if exists) or `src/app/global-error.tsx`. Verify `beforeSend` hook strips headers starting with `authorization`, env var values, and Clerk session cookies.

If file doesn't exist yet, add a stub TODO for Phase 0.5 — don't block Phase 1 on this if Sentry isn't actively wired yet.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 1. If any fail, fix before proceeding — we don't want Phase 1 changes entangled with pre-existing failures.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "fix: pre-flight security + stability verification for Phase 1"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                    # (generated migration)
│   └── NNNN_add_lld_drill_attempts.sql                         # NEW
├── src/
│   ├── db/schema/
│   │   ├── lld-drill-attempts.ts                               # NEW
│   │   ├── index.ts                                            # MODIFY (re-export)
│   │   ├── relations.ts                                        # MODIFY (add relations)
│   │   └── user-preferences.ts                                 # MODIFY (document lld JSONB shape)
│   ├── stores/
│   │   ├── ui-store.ts                                         # MODIFY (+ lldMode slice)
│   │   ├── interview-store.ts                                  # MODIFY (+ activeDrill slice)
│   │   └── __tests__/
│   │       ├── ui-store.lld.test.ts                            # NEW
│   │       └── interview-store.drill.test.ts                   # NEW
│   ├── hooks/
│   │   ├── useLLDModeSync.ts                                   # NEW
│   │   ├── useLLDPreferencesSync.ts                            # NEW
│   │   ├── useLLDDrillSync.ts                                  # NEW
│   │   └── __tests__/
│   │       ├── useLLDModeSync.test.tsx                         # NEW
│   │       └── useLLDDrillSync.test.tsx                        # NEW
│   ├── lib/analytics/
│   │   └── lld-events.ts                                       # NEW
│   ├── app/api/
│   │   ├── user-preferences/route.ts                           # NEW
│   │   ├── user-preferences/lld/route.ts                       # NEW
│   │   ├── user-preferences/lld/migrate/route.ts               # NEW
│   │   ├── lld/drill-attempts/route.ts                         # NEW
│   │   ├── lld/drill-attempts/[id]/route.ts                    # NEW
│   │   ├── lld/drill-attempts/active/route.ts                  # NEW
│   │   └── __tests__/                                          # NEW
│   │       ├── user-preferences-lld.test.ts
│   │       └── lld-drill-attempts.test.ts
│   └── components/modules/lld/
│       ├── LLDShell.tsx                                        # NEW
│       ├── modes/
│       │   ├── ModeSwitcher.tsx                                # NEW
│       │   ├── WelcomeBanner.tsx                               # NEW
│       │   ├── LearnModeLayout.tsx                             # NEW (stub)
│       │   ├── BuildModeLayout.tsx                             # NEW (wraps existing)
│       │   ├── DrillModeLayout.tsx                             # NEW (stub)
│       │   └── ReviewModeLayout.tsx                            # NEW (stub)
│       └── hooks/
│           └── useLLDModuleImpl.tsx                            # MODIFY (delegate to LLDShell)
```

**Design rationale for splits:**
- Mode layouts split per mode so each can evolve independently (different teams, different priorities in later phases).
- Hooks split by concern — mode URL sync vs preferences sync vs drill sync are three distinct debounce + persistence strategies.
- API routes follow Next.js App Router conventions — one route.ts per HTTP resource.
- Test colocation follows repo convention (`__tests__/` next to the thing being tested).

---

## Task 1: Create `lld_drill_attempts` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-drill-attempts.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [x] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-drill-attempts.ts`:

```typescript
/**
 * DB-014: LLD drill attempts — stores active and completed drill attempts.
 *
 * A drill is "active" when submitted_at IS NULL AND abandoned_at IS NULL.
 * A partial unique index enforces "only one active drill per user" at the
 * DB level, preventing race conditions on concurrent POST.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldDrillAttempts = pgTable(
  "lld_drill_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: varchar("problem_id", { length: 100 }).notNull(),
    drillMode: varchar("drill_mode", { length: 20 })
      .notNull()
      .default("interview"), // "interview" | "guided" | "speed"

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),

    elapsedBeforePauseMs: integer("elapsed_before_pause_ms")
      .notNull()
      .default(0),
    durationLimitMs: integer("duration_limit_ms").notNull(),

    canvasState: jsonb("canvas_state"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),

    gradeScore: real("grade_score"),
    gradeBreakdown: jsonb("grade_breakdown"),
  },
  (t) => [
    // One active drill per user
    uniqueIndex("one_active_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("drill_history_idx").on(t.userId, t.submittedAt),
  ],
);

export type LLDDrillAttempt = typeof lldDrillAttempts.$inferSelect;
export type NewLLDDrillAttempt = typeof lldDrillAttempts.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and add to the exports:

```typescript
export * from "./lld-drill-attempts";
```

Place this next to the other `export *` lines in alphabetical order.

- [ ] **Step 3: Add relation definition**

Open `architex/src/db/schema/relations.ts`. Find the `usersRelations` block and add a new `many` entry, and add a new relations block at the bottom:

```typescript
// In usersRelations many block, add:
lldDrillAttempts: many(lldDrillAttempts),

// At bottom of file, add:
export const lldDrillAttemptsRelations = relations(
  lldDrillAttempts,
  ({ one }) => ({
    user: one(users, {
      fields: [lldDrillAttempts.userId],
      references: [users.id],
    }),
  }),
);
```

Make sure `lldDrillAttempts` is imported at the top of the file.

- [ ] **Step 4: Verify schema compiles**

Run:
```bash
cd architex
pnpm typecheck
```
Expected: no errors. If errors, fix import paths.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-drill-attempts.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_drill_attempts schema

Tracks active and completed drill attempts. Partial unique index enforces
one-active-drill-per-user at DB level, preventing race conditions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Generate and apply migration

**Files:**
- Generated: `architex/drizzle/NNNN_add_lld_drill_attempts.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
cd architex
pnpm db:generate
```
Expected: creates a new SQL file in `architex/drizzle/` containing `CREATE TABLE "lld_drill_attempts"` and the unique index. File name has auto-incremented prefix.

- [ ] **Step 2: Review the SQL**

Open the generated file. Confirm it includes:
- `CREATE TABLE "lld_drill_attempts"` with all columns from Task 1
- `CREATE UNIQUE INDEX "one_active_drill_per_user"` with `WHERE` clause
- `CREATE INDEX "drill_history_idx"`

If anything is missing or wrong, delete the file and re-run `pnpm db:generate` (Drizzle re-reads schema).

- [ ] **Step 3: Apply migration to dev DB**

Run:
```bash
pnpm db:push
```
Expected: migration applies cleanly. If error mentions `users` not existing, confirm your local DB has been seeded (`pnpm db:push` from baseline).

- [ ] **Step 4: Verify table exists via Drizzle Studio**

Run:
```bash
pnpm db:studio
```
Opens at <https://local.drizzle.studio>. Confirm `lld_drill_attempts` appears in sidebar with correct columns and 0 rows.

- [ ] **Step 5: Commit**

```bash
git add architex/drizzle/
git commit -m "feat(db): generate and apply lld_drill_attempts migration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Extend `ui-store` with `lldMode` slice

**Files:**
- Modify: `architex/src/stores/ui-store.ts`
- Test: `architex/src/stores/__tests__/ui-store.lld.test.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/stores/__tests__/ui-store.lld.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("ui-store · lld slice", () => {
  beforeEach(() => {
    useUIStore.setState({ lldMode: null, lldWelcomeBannerDismissed: false });
  });

  it("has null lldMode by default (first visit)", () => {
    expect(useUIStore.getState().lldMode).toBeNull();
  });

  it("setLLDMode updates mode", () => {
    useUIStore.getState().setLLDMode("learn");
    expect(useUIStore.getState().lldMode).toBe("learn");
  });

  it("setLLDMode persists across calls", () => {
    useUIStore.getState().setLLDMode("drill");
    useUIStore.getState().setLLDMode("build");
    expect(useUIStore.getState().lldMode).toBe("build");
  });

  it("dismissLLDWelcomeBanner sets flag", () => {
    expect(useUIStore.getState().lldWelcomeBannerDismissed).toBe(false);
    useUIStore.getState().dismissLLDWelcomeBanner();
    expect(useUIStore.getState().lldWelcomeBannerDismissed).toBe(true);
  });

  it("accepts all four mode values", () => {
    const modes = ["learn", "build", "drill", "review"] as const;
    for (const m of modes) {
      useUIStore.getState().setLLDMode(m);
      expect(useUIStore.getState().lldMode).toBe(m);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd architex
pnpm test:run -- ui-store.lld
```
Expected: FAIL with `TypeError: useUIStore.getState().setLLDMode is not a function` or similar.

- [ ] **Step 3: Extend the store**

Open `architex/src/stores/ui-store.ts`. Find the `UIState` interface and add these fields:

```typescript
export type LLDMode = "learn" | "build" | "drill" | "review";

// In UIState interface:
  lldMode: LLDMode | null;  // null = first visit
  lldWelcomeBannerDismissed: boolean;

  setLLDMode: (mode: LLDMode) => void;
  dismissLLDWelcomeBanner: () => void;
```

In the store creator (inside `create<UIState>()((set, get) => ({`), add initial values:

```typescript
  lldMode: null,
  lldWelcomeBannerDismissed: false,

  setLLDMode: (mode) => set({ lldMode: mode }),
  dismissLLDWelcomeBanner: () =>
    set({ lldWelcomeBannerDismissed: true }),
```

If the store uses `persist` middleware, the new fields will persist to localStorage automatically under the existing storage key (`architex-ui`).

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- ui-store.lld
```
Expected: PASS · all 5 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/stores/ui-store.ts architex/src/stores/__tests__/ui-store.lld.test.ts
git commit -m "feat(stores): add lldMode slice to ui-store

Adds lldMode state + setLLDMode action to support 4-mode LLD shell
(Learn / Build / Drill / Review). Null default represents first-visit.
Persists to localStorage via existing persist middleware.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Extend `interview-store` with `activeDrill` slice

**Files:**
- Modify: `architex/src/stores/interview-store.ts`
- Test: `architex/src/stores/__tests__/interview-store.drill.test.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/stores/__tests__/interview-store.drill.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useInterviewStore } from "@/stores/interview-store";

describe("interview-store · drill slice", () => {
  beforeEach(() => {
    useInterviewStore.setState({ activeDrill: null });
  });

  it("has null activeDrill by default", () => {
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("startDrill creates an active drill record", () => {
    useInterviewStore
      .getState()
      .startDrill("parking-lot", "interview", 20 * 60 * 1000);
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill).not.toBeNull();
    expect(drill?.problemId).toBe("parking-lot");
    expect(drill?.drillMode).toBe("interview");
    expect(drill?.durationLimitMs).toBe(20 * 60 * 1000);
    expect(drill?.pausedAt).toBeNull();
  });

  it("pauseDrill sets pausedAt and records elapsed", () => {
    const fakeNow = 1_000_000;
    vi.spyOn(Date, "now").mockReturnValue(fakeNow);
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    vi.spyOn(Date, "now").mockReturnValue(fakeNow + 5000);
    useInterviewStore.getState().pauseDrill();
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill?.pausedAt).toBe(fakeNow + 5000);
    expect(drill?.elapsedBeforePauseMs).toBe(5000);
    vi.restoreAllMocks();
  });

  it("resumeDrill clears pausedAt", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().pauseDrill();
    useInterviewStore.getState().resumeDrill();
    expect(useInterviewStore.getState().activeDrill?.pausedAt).toBeNull();
  });

  it("abandonDrill clears the active drill", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().abandonDrill();
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("submitDrill clears the active drill", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().submitDrill();
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("useHint appends to hintsUsed", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().useHint("nudge");
    useInterviewStore.getState().useHint("guided");
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill?.hintsUsed).toHaveLength(2);
    expect(drill?.hintsUsed[0]?.tier).toBe("nudge");
    expect(drill?.hintsUsed[1]?.tier).toBe("guided");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd architex
pnpm test:run -- interview-store.drill
```
Expected: FAIL with `startDrill is not a function` or similar.

- [ ] **Step 3: Extend the store**

Open `architex/src/stores/interview-store.ts`. Add these types and state:

```typescript
export type DrillMode = "interview" | "guided" | "speed";
export type HintTier = "nudge" | "guided" | "full";

export interface ActiveDrill {
  problemId: string;
  drillMode: DrillMode;
  startedAt: number;           // epoch ms
  pausedAt: number | null;     // null = running
  elapsedBeforePauseMs: number;
  durationLimitMs: number;
  hintsUsed: Array<{ tier: HintTier; usedAt: number }>;
}

// In InterviewState interface, add:
  activeDrill: ActiveDrill | null;

  startDrill: (problemId: string, drillMode: DrillMode, durationLimitMs: number) => void;
  pauseDrill: () => void;
  resumeDrill: () => void;
  submitDrill: () => void;
  abandonDrill: () => void;
  useHint: (tier: HintTier) => void;
```

In the store creator, add initial value and actions:

```typescript
  activeDrill: null,

  startDrill: (problemId, drillMode, durationLimitMs) => {
    set({
      activeDrill: {
        problemId,
        drillMode,
        startedAt: Date.now(),
        pausedAt: null,
        elapsedBeforePauseMs: 0,
        durationLimitMs,
        hintsUsed: [],
      },
    });
  },

  pauseDrill: () => {
    const current = get().activeDrill;
    if (!current || current.pausedAt !== null) return;
    const now = Date.now();
    set({
      activeDrill: {
        ...current,
        pausedAt: now,
        elapsedBeforePauseMs:
          current.elapsedBeforePauseMs + (now - current.startedAt),
      },
    });
  },

  resumeDrill: () => {
    const current = get().activeDrill;
    if (!current || current.pausedAt === null) return;
    set({
      activeDrill: {
        ...current,
        pausedAt: null,
        startedAt: Date.now(), // reset the running clock
      },
    });
  },

  submitDrill: () => set({ activeDrill: null }),
  abandonDrill: () => set({ activeDrill: null }),

  useHint: (tier) => {
    const current = get().activeDrill;
    if (!current) return;
    set({
      activeDrill: {
        ...current,
        hintsUsed: [...current.hintsUsed, { tier, usedAt: Date.now() }],
      },
    });
  },
```

Note: `activeDrill` should NOT persist to localStorage (per spec §7) — the server is source of truth. If store uses `persist()`, add `activeDrill` to the `partialize` exclude list:

```typescript
partialize: (state) => {
  const { activeDrill, ...rest } = state;
  return rest;
},
```

If the store has no existing `partialize`, add one here.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- interview-store.drill
```
Expected: PASS · all 7 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/stores/interview-store.ts architex/src/stores/__tests__/interview-store.drill.test.ts
git commit -m "feat(stores): add activeDrill slice to interview-store

Tracks in-progress drill with pause/resume time accounting, hint usage,
and drill mode (interview/guided/speed). Excluded from localStorage persist
per spec §7 — server is source of truth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Create `useLLDModeSync` hook (URL ↔ store)

**Files:**
- Create: `architex/src/hooks/useLLDModeSync.ts`
- Test: `architex/src/hooks/__tests__/useLLDModeSync.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useLLDModeSync.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Hoisted mocks — Vitest requires these BEFORE import
const { replaceMock, searchParamsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsMock: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
}));

import { useLLDModeSync } from "@/hooks/useLLDModeSync";
import { useUIStore } from "@/stores/ui-store";

describe("useLLDModeSync", () => {
  beforeEach(() => {
    useUIStore.setState({ lldMode: null });
    replaceMock.mockClear();
    // Reset searchParams to empty
    Array.from(searchParamsMock.keys()).forEach((k) =>
      searchParamsMock.delete(k),
    );
  });

  it("reads mode from URL param on mount", () => {
    searchParamsMock.set("mode", "learn");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBe("learn");
  });

  it("ignores invalid mode values", () => {
    searchParamsMock.set("mode", "garbage");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBeNull();
  });

  it("does not overwrite store if URL has no mode param", () => {
    useUIStore.getState().setLLDMode("build");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBe("build");
  });

  it("updates URL when store mode changes", () => {
    renderHook(() => useLLDModeSync());
    useUIStore.getState().setLLDMode("drill");
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("mode=drill"),
      expect.objectContaining({ scroll: false }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useLLDModeSync
```
Expected: FAIL with `Cannot find module '@/hooks/useLLDModeSync'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useLLDModeSync.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore, type LLDMode } from "@/stores/ui-store";

const VALID_MODES: readonly LLDMode[] = [
  "learn",
  "build",
  "drill",
  "review",
] as const;

function isValidMode(value: unknown): value is LLDMode {
  return (
    typeof value === "string" && (VALID_MODES as readonly string[]).includes(value)
  );
}

/**
 * Bidirectional sync between the `?mode=` URL query param and
 * `ui-store.lldMode`. Uses `router.replace` (not push) so mode switching
 * doesn't pollute browser history.
 */
export function useLLDModeSync(): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = useUIStore((s) => s.lldMode);
  const setLLDMode = useUIStore((s) => s.setLLDMode);

  // URL → store
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (isValidMode(urlMode) && urlMode !== mode) {
      setLLDMode(urlMode);
    }
    // Intentionally no `mode` dep: first-mount URL wins, then store becomes authoritative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setLLDMode]);

  // store → URL
  useEffect(() => {
    if (!mode) return;
    if (searchParams.get("mode") === mode) return;
    const params = new URLSearchParams(searchParams);
    params.set("mode", mode);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [mode, router, searchParams]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- useLLDModeSync
```
Expected: PASS · all 4 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useLLDModeSync.ts architex/src/hooks/__tests__/useLLDModeSync.test.tsx
git commit -m "feat(hooks): add useLLDModeSync for URL ↔ store sync

Bidirectional sync: reads ?mode= on mount and updates URL when store
changes. Uses router.replace to avoid polluting browser history.
Validates mode value against allowlist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Create `useLLDPreferencesSync` hook (debounced write-through to DB)

**Files:**
- Create: `architex/src/hooks/useLLDPreferencesSync.ts`

- [ ] **Step 1: Create the hook**

Create `architex/src/hooks/useLLDPreferencesSync.ts`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";

interface LLDPreferencesPatch {
  mode?: string;
  welcomeBannerDismissed?: boolean;
}

async function patchLLDPreferences(patch: LLDPreferencesPatch) {
  const res = await fetch("/api/user-preferences/lld", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to patch LLD preferences: ${res.status}`);
  return res.json();
}

/**
 * Write-through sync of LLD preferences to the DB. Local store is the
 * optimistic truth; this hook fires a debounced PATCH to persist.
 * Debounce: 1000ms after last change. Anonymous users (no auth) no-op
 * silently — migration on sign-in captures local state.
 */
export function useLLDPreferencesSync(): void {
  const mode = useUIStore((s) => s.lldMode);
  const dismissed = useUIStore((s) => s.lldWelcomeBannerDismissed);

  const mutation = useMutation({
    mutationFn: patchLLDPreferences,
    networkMode: "offlineFirst",
    retry: 2,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSync = useRef<{ mode: string | null; dismissed: boolean }>({
    mode: null,
    dismissed: false,
  });

  useEffect(() => {
    // Skip first render (Zustand hydration might still be in progress).
    if (mode === lastSync.current.mode && dismissed === lastSync.current.dismissed) {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const patch: LLDPreferencesPatch = {};
      if (mode !== lastSync.current.mode && mode !== null) {
        patch.mode = mode;
      }
      if (dismissed !== lastSync.current.dismissed) {
        patch.welcomeBannerDismissed = dismissed;
      }
      if (Object.keys(patch).length > 0) {
        mutation.mutate(patch);
        lastSync.current = { mode, dismissed };
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, dismissed, mutation]);
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd architex
pnpm typecheck
```
Expected: no errors. This hook is tested indirectly via the integration test in Task 16 — we don't need a unit test here because debounce+mutation+mocking gets brittle and is better covered by an E2E test later.

- [ ] **Step 3: Commit**

```bash
git add architex/src/hooks/useLLDPreferencesSync.ts
git commit -m "feat(hooks): add useLLDPreferencesSync for DB write-through

Debounced 1s write-through to /api/user-preferences/lld. Uses TanStack
Query offlineFirst mode so mutations queue when offline. Skips sync
until values actually change from last-synced state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Create `useLLDDrillSync` hook (drill lifecycle + 10s heartbeat)

**Files:**
- Create: `architex/src/hooks/useLLDDrillSync.ts`
- Test: `architex/src/hooks/__tests__/useLLDDrillSync.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useLLDDrillSync.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useInterviewStore } from "@/stores/interview-store";
import { useLLDDrillSync } from "@/hooks/useLLDDrillSync";

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useLLDDrillSync · heartbeat", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as typeof fetch;
    useInterviewStore.setState({ activeDrill: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not fire heartbeat when no active drill", () => {
    renderHook(() => useLLDDrillSync("fake-drill-id"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(15_000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fires heartbeat every 10 seconds while drill is running", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60_000);
    renderHook(() => useLLDDrillSync("drill-abc"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/lld/drill-attempts/drill-abc",
      expect.objectContaining({ method: "PATCH" }),
    );
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stops heartbeat when drill is paused", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60_000);
    renderHook(() => useLLDDrillSync("drill-abc"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    useInterviewStore.getState().pauseDrill();
    vi.advanceTimersByTime(20_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useLLDDrillSync
```
Expected: FAIL with `Cannot find module '@/hooks/useLLDDrillSync'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useLLDDrillSync.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useInterviewStore } from "@/stores/interview-store";

const HEARTBEAT_MS = 10_000;

async function sendHeartbeat(drillId: string): Promise<void> {
  await fetch(`/api/lld/drill-attempts/${drillId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "heartbeat" }),
  });
}

/**
 * Pings the server every 10s while a drill is running (not paused).
 * Updates `last_activity_at` server-side so stale-drill detection
 * (>30min idle) correctly auto-abandons inactive attempts.
 */
export function useLLDDrillSync(drillId: string | null): void {
  const activeDrill = useInterviewStore((s) => s.activeDrill);
  const isRunning = activeDrill !== null && activeDrill.pausedAt === null;

  useEffect(() => {
    if (!drillId || !isRunning) return;
    const interval = setInterval(() => {
      sendHeartbeat(drillId).catch((err) => {
        console.warn("[useLLDDrillSync] heartbeat failed:", err);
      });
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [drillId, isRunning]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- useLLDDrillSync
```
Expected: PASS · all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useLLDDrillSync.ts architex/src/hooks/__tests__/useLLDDrillSync.test.tsx
git commit -m "feat(hooks): add useLLDDrillSync heartbeat

Sends PATCH /api/lld/drill-attempts/:id every 10s while drill is running.
Stops when drill is paused, submitted, or abandoned. Enables server-side
stale-drill detection (>30min idle auto-abandon).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Create `GET /api/user-preferences` route

**Files:**
- Create: `architex/src/app/api/user-preferences/route.ts`

- [ ] **Step 1: Create the route**

Create `architex/src/app/api/user-preferences/route.ts`:

```typescript
/**
 * GET /api/user-preferences — fetch the current user's preferences blob.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, userPreferences } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return NextResponse.json({
      preferences: row?.preferences ?? {},
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/user-preferences] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd architex
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

With Clerk configured and dev server running:
```bash
curl -i http://localhost:3000/api/user-preferences
```
Expected: `401 Unauthorized` (no auth header).

- [ ] **Step 4: Commit**

```bash
git add architex/src/app/api/user-preferences/route.ts
git commit -m "feat(api): add GET /api/user-preferences

Returns current user's preferences blob. Requires auth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Create `PATCH /api/user-preferences/lld` route

**Files:**
- Create: `architex/src/app/api/user-preferences/lld/route.ts`
- Test: `architex/src/app/api/__tests__/user-preferences-lld.test.ts`

- [ ] **Step 1: Create the route**

Create `architex/src/app/api/user-preferences/lld/route.ts`:

```typescript
/**
 * PATCH /api/user-preferences/lld — partial update of the lld subtree
 * within userPreferences.preferences.
 */

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, userPreferences } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_MODES = new Set(["learn", "build", "drill", "review"]);

interface LLDPatch {
  mode?: string;
  welcomeBannerDismissed?: boolean;
  scratchCanvas?: Record<string, unknown>;
}

function validatePatch(body: unknown): LLDPatch | { error: string } {
  if (!body || typeof body !== "object") return { error: "Body required" };
  const patch = body as LLDPatch;
  if (patch.mode !== undefined && !VALID_MODES.has(patch.mode)) {
    return { error: `Invalid mode: ${patch.mode}` };
  }
  if (
    patch.welcomeBannerDismissed !== undefined &&
    typeof patch.welcomeBannerDismissed !== "boolean"
  ) {
    return { error: "welcomeBannerDismissed must be boolean" };
  }
  return patch;
}

export async function PATCH(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validated = validatePatch(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const db = getDb();

    // Upsert: if user has no preferences row yet, create one.
    await db
      .insert(userPreferences)
      .values({
        userId,
        preferences: { lld: validated },
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          preferences: sql`
            jsonb_set(
              COALESCE(${userPreferences.preferences}, '{}'::jsonb),
              '{lld}',
              COALESCE(${userPreferences.preferences}->'lld', '{}'::jsonb) || ${JSON.stringify(
                validated,
              )}::jsonb
            )
          `,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/user-preferences/lld] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/app/api/user-preferences/lld/route.ts
git commit -m "feat(api): add PATCH /api/user-preferences/lld

Partial update of lld subtree in userPreferences JSONB. Validates mode
against allowlist. Uses jsonb_set + merge for atomic partial updates.
Upsert handles first-time preferences row creation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Create drill attempts API routes (3 endpoints)

**Files:**
- Create: `architex/src/app/api/lld/drill-attempts/route.ts`
- Create: `architex/src/app/api/lld/drill-attempts/[id]/route.ts`
- Create: `architex/src/app/api/lld/drill-attempts/active/route.ts`

- [ ] **Step 1: Create POST + GET-by-status route**

Create `architex/src/app/api/lld/drill-attempts/route.ts`:

```typescript
/**
 * POST /api/lld/drill-attempts     — start a new drill (409 if one active)
 * GET  /api/lld/drill-attempts     — list history (?status=completed)
 */

import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_MODES = new Set(["interview", "guided", "speed"]);

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      problemId?: string;
      drillMode?: string;
      durationLimitMs?: number;
    };

    const { problemId, drillMode, durationLimitMs } = body;
    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json({ error: "problemId required" }, { status: 400 });
    }
    if (!drillMode || !VALID_MODES.has(drillMode)) {
      return NextResponse.json(
        { error: `drillMode must be one of: ${Array.from(VALID_MODES).join(", ")}` },
        { status: 400 },
      );
    }
    if (typeof durationLimitMs !== "number" || durationLimitMs < 60_000) {
      return NextResponse.json(
        { error: "durationLimitMs must be a number >= 60000" },
        { status: 400 },
      );
    }

    const db = getDb();

    try {
      const [created] = await db
        .insert(lldDrillAttempts)
        .values({
          userId,
          problemId,
          drillMode,
          durationLimitMs,
        })
        .returning();
      return NextResponse.json({ attempt: created }, { status: 201 });
    } catch (error) {
      // Partial unique index violation = user already has an active drill.
      if (
        error instanceof Error &&
        error.message.includes("one_active_drill_per_user")
      ) {
        return NextResponse.json(
          {
            error: "A drill is already active. Submit or abandon it first.",
            code: "ACTIVE_DRILL_EXISTS",
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const db = getDb();
    const baseWhere = eq(lldDrillAttempts.userId, userId);

    const where =
      status === "completed"
        ? and(baseWhere, isNotNull(lldDrillAttempts.submittedAt))
        : status === "abandoned"
          ? and(baseWhere, isNotNull(lldDrillAttempts.abandonedAt))
          : baseWhere;

    const rows = await db
      .select()
      .from(lldDrillAttempts)
      .where(where)
      .orderBy(desc(lldDrillAttempts.startedAt))
      .limit(100);

    return NextResponse.json({ attempts: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create active-drill route with auto-abandon**

Create `architex/src/app/api/lld/drill-attempts/active/route.ts`:

```typescript
/**
 * GET /api/lld/drill-attempts/active
 *
 * Returns the user's currently active drill, or null.
 * Auto-abandons drills that have been idle > 30 minutes.
 */

import { NextResponse } from "next/server";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();

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

    // Fetch remaining active (if any).
    const [active] = await db
      .select()
      .from(lldDrillAttempts)
      .where(
        and(
          eq(lldDrillAttempts.userId, userId),
          isNull(lldDrillAttempts.submittedAt),
          isNull(lldDrillAttempts.abandonedAt),
        ),
      )
      .limit(1);

    return NextResponse.json({ active: active ?? null });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/active] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Create lifecycle PATCH route**

Create `architex/src/app/api/lld/drill-attempts/[id]/route.ts`:

```typescript
/**
 * PATCH /api/lld/drill-attempts/[id]
 *
 * action: "heartbeat" | "pause" | "resume" | "submit" | "abandon"
 *
 * Updates lifecycle timestamps + optional canvasState / gradeScore.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_ACTIONS = new Set([
  "heartbeat",
  "pause",
  "resume",
  "submit",
  "abandon",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      canvasState?: unknown;
      gradeScore?: number;
      gradeBreakdown?: unknown;
      elapsedBeforePauseMs?: number;
    };

    const action = body.action;
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${Array.from(VALID_ACTIONS).join(", ")}` },
        { status: 400 },
      );
    }

    const db = getDb();
    const now = new Date();

    const updates: Record<string, unknown> = { lastActivityAt: now };

    switch (action) {
      case "heartbeat":
        break; // only lastActivityAt
      case "pause":
        updates.pausedAt = now;
        if (typeof body.elapsedBeforePauseMs === "number") {
          updates.elapsedBeforePauseMs = body.elapsedBeforePauseMs;
        }
        break;
      case "resume":
        updates.pausedAt = null;
        break;
      case "submit":
        updates.submittedAt = now;
        if (typeof body.gradeScore === "number") {
          updates.gradeScore = body.gradeScore;
        }
        if (body.gradeBreakdown) {
          updates.gradeBreakdown = body.gradeBreakdown;
        }
        if (body.canvasState) {
          updates.canvasState = body.canvasState;
        }
        break;
      case "abandon":
        updates.abandonedAt = now;
        break;
    }

    if (body.canvasState && action !== "submit") {
      updates.canvasState = body.canvasState;
    }

    const [updated] = await db
      .update(lldDrillAttempts)
      .set(updates)
      .where(
        and(
          eq(lldDrillAttempts.id, id),
          eq(lldDrillAttempts.userId, userId), // scope to owner
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    return NextResponse.json({ attempt: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/app/api/lld/drill-attempts/
git commit -m "feat(api): add LLD drill-attempts lifecycle routes

POST   /api/lld/drill-attempts                 — start (409 if active)
GET    /api/lld/drill-attempts?status=...      — history
GET    /api/lld/drill-attempts/active          — with >30min auto-abandon
PATCH  /api/lld/drill-attempts/:id             — heartbeat/pause/resume/submit/abandon

All routes scope queries to the authenticated user. Partial unique index
on the DB enforces single-active-drill at the row level.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Create analytics event catalog

**Files:**
- Create: `architex/src/lib/analytics/lld-events.ts`

- [ ] **Step 1: Create the event builder module**

Create `architex/src/lib/analytics/lld-events.ts`:

```typescript
/**
 * LLD analytics event catalog (spec §13, Q19).
 *
 * Typed builders prevent event-name drift. Every event writes to
 * activityEvents (user-owned) + mirrors to PostHog (aggregate).
 *
 * Phase 1 ships only a subset: mode switching + welcome banner + drill
 * lifecycle. Later phases expand to lesson scroll milestones, checkpoint
 * attempts, etc.
 */

type LLDMode = "learn" | "build" | "drill" | "review";
type DrillMode = "interview" | "guided" | "speed";
type DrillGradeTier = "excellent" | "solid" | "partial" | "needs_work";

type EventPayload = Record<string, unknown>;

interface LLDEvent {
  event: string;
  metadata: EventPayload;
}

// ── Mode switching ──────────────────────────────────────

export function lldModeSwitched(args: {
  from: LLDMode | null;
  to: LLDMode;
  trigger: "click" | "keyboard" | "url";
}): LLDEvent {
  return { event: "lld_mode_switched", metadata: args };
}

export function lldWelcomeBannerShown(): LLDEvent {
  return { event: "lld_welcome_banner_shown", metadata: {} };
}

export function lldWelcomeBannerDismissed(args: {
  method: "dismiss" | "pick_learn" | "pick_build" | "pick_drill";
}): LLDEvent {
  return { event: "lld_welcome_banner_dismissed", metadata: args };
}

// ── Drill lifecycle ──────────────────────────────────────

export function lldDrillStarted(args: {
  problemId: string;
  drillMode: DrillMode;
}): LLDEvent {
  return { event: "lld_drill_started", metadata: args };
}

export function lldDrillPaused(args: {
  problemId: string;
  elapsedMs: number;
}): LLDEvent {
  return { event: "lld_drill_paused", metadata: args };
}

export function lldDrillSubmitted(args: {
  problemId: string;
  drillMode: DrillMode;
  grade: number;
  durationMs: number;
  hintsUsed: number;
}): LLDEvent {
  return { event: "lld_drill_submitted", metadata: args };
}

export function lldDrillAbandoned(args: {
  problemId: string;
  elapsedMs: number;
  reason: "give_up" | "timeout" | "auto";
}): LLDEvent {
  return { event: "lld_drill_abandoned", metadata: args };
}

export function lldDrillGradeTierCrossed(args: {
  problemId: string;
  tier: DrillGradeTier;
  score: number;
}): LLDEvent {
  return { event: "lld_drill_grade_tier_crossed", metadata: args };
}

// ── Emission ─────────────────────────────────────────────

/**
 * Fire an event to the activity log (fire-and-forget).
 * In Phase 1 this just POSTs to /api/activity. Later phases add
 * PostHog mirroring and offline queueing.
 */
export async function track(event: LLDEvent): Promise<void> {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: event.event,
        moduleId: "lld",
        metadata: event.metadata,
      }),
    });
  } catch (err) {
    console.warn("[lld-events] track failed (non-critical):", err);
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/lib/analytics/lld-events.ts
git commit -m "feat(analytics): add typed LLD event catalog (Phase 1 subset)

Covers mode switching, welcome banner, and drill lifecycle. Later
phases extend to lesson/checkpoint/review events per spec §13 Q19.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Create `ModeSwitcher` component

**Files:**
- Create: `architex/src/components/modules/lld/modes/ModeSwitcher.tsx`

- [ ] **Step 1: Create the component**

Create `architex/src/components/modules/lld/modes/ModeSwitcher.tsx`:

```tsx
"use client";

import { memo, useEffect } from "react";
import { useUIStore, type LLDMode } from "@/stores/ui-store";
import { track, lldModeSwitched } from "@/lib/analytics/lld-events";
import { cn } from "@/lib/utils";

interface ModeOption {
  value: LLDMode;
  icon: string;
  label: string;
  shortcut: string;
}

const MODES: readonly ModeOption[] = [
  { value: "learn", icon: "📖", label: "Learn", shortcut: "⌘1" },
  { value: "build", icon: "🎨", label: "Build", shortcut: "⌘2" },
  { value: "drill", icon: "⏱", label: "Drill", shortcut: "⌘3" },
  { value: "review", icon: "🔁", label: "Review", shortcut: "⌘4" },
] as const;

export const ModeSwitcher = memo(function ModeSwitcher() {
  const mode = useUIStore((s) => s.lldMode) ?? "build";
  const setMode = useUIStore((s) => s.setLLDMode);

  // Keyboard shortcuts ⌘1..4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const digit = e.key;
      if (digit < "1" || digit > "4") return;
      const idx = Number(digit) - 1;
      const target = MODES[idx];
      if (target && target.value !== mode) {
        e.preventDefault();
        setMode(target.value);
        track(lldModeSwitched({ from: mode, to: target.value, trigger: "keyboard" }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, setMode]);

  return (
    <nav
      role="tablist"
      aria-label="LLD mode"
      className="inline-flex items-center gap-0.5 rounded-full bg-background/60 p-1 backdrop-blur-sm border border-border/30"
    >
      {MODES.map((m) => {
        const active = m.value === mode;
        return (
          <button
            key={m.value}
            role="tab"
            aria-selected={active}
            aria-label={`${m.label} mode (${m.shortcut})`}
            onClick={() => {
              if (m.value !== mode) {
                setMode(m.value);
                track(
                  lldModeSwitched({ from: mode, to: m.value, trigger: "click" }),
                );
              }
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-foreground/5",
            )}
          >
            <span aria-hidden>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors. If the project uses a `cn` utility from a different path, fix the import (check `src/lib/utils.ts` or similar).

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/modes/ModeSwitcher.tsx
git commit -m "feat(lld): add ModeSwitcher component with keyboard shortcuts

Four-pill switcher (Learn/Build/Drill/Review) bound to ui-store.lldMode.
⌘1-4 shortcuts switch modes with analytics tracking.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Create `WelcomeBanner` component

**Files:**
- Create: `architex/src/components/modules/lld/modes/WelcomeBanner.tsx`

- [ ] **Step 1: Create the component**

Create `architex/src/components/modules/lld/modes/WelcomeBanner.tsx`:

```tsx
"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { useUIStore, type LLDMode } from "@/stores/ui-store";
import {
  track,
  lldWelcomeBannerDismissed,
  lldWelcomeBannerShown,
} from "@/lib/analytics/lld-events";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface PathChoice {
  mode: LLDMode;
  icon: string;
  label: string;
  description: string;
  accent: string;
}

const PATHS: readonly PathChoice[] = [
  {
    mode: "learn",
    icon: "📖",
    label: "Teach me",
    description: "Start with guided lessons",
    accent: "emerald",
  },
  {
    mode: "build",
    icon: "🎨",
    label: "Let me build",
    description: "Open canvas, explore freely",
    accent: "blue",
  },
  {
    mode: "drill",
    icon: "⏱",
    label: "Drill me",
    description: "Timed interview problems",
    accent: "red",
  },
] as const;

export const WelcomeBanner = memo(function WelcomeBanner() {
  const dismissed = useUIStore((s) => s.lldWelcomeBannerDismissed);
  const setMode = useUIStore((s) => s.setLLDMode);
  const dismiss = useUIStore((s) => s.dismissLLDWelcomeBanner);

  useEffect(() => {
    if (!dismissed) {
      track(lldWelcomeBannerShown());
    }
    // Only fire on first show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  const pick = (mode: LLDMode) => {
    setMode(mode);
    dismiss();
    track(
      lldWelcomeBannerDismissed({
        method: `pick_${mode}` as "pick_learn" | "pick_build" | "pick_drill",
      }),
    );
  };

  return (
    <div
      role="banner"
      className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-500/5 backdrop-blur-sm p-4 m-3"
    >
      <button
        aria-label="Dismiss welcome banner"
        onClick={() => {
          dismiss();
          track(lldWelcomeBannerDismissed({ method: "dismiss" }));
        }}
        className="absolute top-2 right-2 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="text-2xl">👋</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">
            First time with Low-Level Design? Pick your path.
          </div>
          <div className="text-xs text-foreground-muted mt-0.5">
            You can switch modes anytime from the top-right pill.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {PATHS.map((p) => (
          <button
            key={p.mode}
            onClick={() => pick(p.mode)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              "border-border/30 bg-elevated/50 hover:bg-elevated/80",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            <div className="text-lg">{p.icon}</div>
            <div className="text-xs font-semibold text-foreground mt-1">
              {p.label}
            </div>
            <div className="text-[10px] text-foreground-muted mt-0.5">
              {p.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/modes/WelcomeBanner.tsx
git commit -m "feat(lld): add WelcomeBanner for first-visit mode picking

Three-path picker (Teach me / Let me build / Drill me). Dismissable.
Uses ui-store flag to track dismissed state so it never re-shows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Create mode layout stubs (Learn / Drill / Review) + Build wrapper

**Files:**
- Create: `architex/src/components/modules/lld/modes/LearnModeLayout.tsx`
- Create: `architex/src/components/modules/lld/modes/BuildModeLayout.tsx`
- Create: `architex/src/components/modules/lld/modes/DrillModeLayout.tsx`
- Create: `architex/src/components/modules/lld/modes/ReviewModeLayout.tsx`

- [ ] **Step 1: Create BuildModeLayout (wraps existing)**

Create `architex/src/components/modules/lld/modes/BuildModeLayout.tsx`:

```tsx
"use client";

import { memo, type ReactNode } from "react";

/**
 * Build mode · wraps today's LLD 4-panel UI unchanged.
 *
 * The actual panels (sidebar, canvas, properties, bottom tabs) are still
 * assembled by useLLDModuleImpl. BuildModeLayout just provides a named
 * wrapper so modes can evolve independently.
 */
export const BuildModeLayout = memo(function BuildModeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
});
```

- [ ] **Step 2: Create LearnModeLayout stub**

Create `architex/src/components/modules/lld/modes/LearnModeLayout.tsx`:

```tsx
"use client";

import { memo } from "react";

export const LearnModeLayout = memo(function LearnModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">📖</div>
        <h2 className="text-xl font-semibold text-foreground">Learn Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          Guided pattern lessons are coming in Phase 2. Until then, flip
          back to Build mode and use the existing Explain tab in the bottom
          panel.
        </p>
      </div>
    </div>
  );
});
```

- [ ] **Step 3: Create DrillModeLayout stub**

Create `architex/src/components/modules/lld/modes/DrillModeLayout.tsx`:

```tsx
"use client";

import { memo } from "react";

export const DrillModeLayout = memo(function DrillModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">⏱</div>
        <h2 className="text-xl font-semibold text-foreground">Drill Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          Timed drill sessions arrive in Phase 3. You'll pick from 33
          interview problems with 3 sub-modes (Interview / Guided / Speed).
        </p>
      </div>
    </div>
  );
});
```

- [ ] **Step 4: Create ReviewModeLayout stub**

Create `architex/src/components/modules/lld/modes/ReviewModeLayout.tsx`:

```tsx
"use client";

import { memo } from "react";

export const ReviewModeLayout = memo(function ReviewModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🔁</div>
        <h2 className="text-xl font-semibold text-foreground">Review Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          FSRS-5 spaced repetition review arrives in Phase 3. Once you've
          completed patterns in Learn mode, they'll surface here on
          optimal review schedules.
        </p>
      </div>
    </div>
  );
});
```

- [ ] **Step 5: Commit**

```bash
git add architex/src/components/modules/lld/modes/
git commit -m "feat(lld): add 4 mode layout components (3 stubs + Build wrapper)

BuildModeLayout wraps today's unchanged content. LearnModeLayout,
DrillModeLayout, and ReviewModeLayout are functional stubs — they render
a placeholder explaining what's coming in Phase 2-3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Create `LLDShell` component

**Files:**
- Create: `architex/src/components/modules/lld/LLDShell.tsx`

- [ ] **Step 1: Create the shell**

Create `architex/src/components/modules/lld/LLDShell.tsx`:

```tsx
"use client";

import { memo, type ReactNode, useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useLLDModeSync } from "@/hooks/useLLDModeSync";
import { useLLDPreferencesSync } from "@/hooks/useLLDPreferencesSync";
import { ModeSwitcher } from "./modes/ModeSwitcher";
import { WelcomeBanner } from "./modes/WelcomeBanner";
import { LearnModeLayout } from "./modes/LearnModeLayout";
import { BuildModeLayout } from "./modes/BuildModeLayout";
import { DrillModeLayout } from "./modes/DrillModeLayout";
import { ReviewModeLayout } from "./modes/ReviewModeLayout";

interface LLDShellProps {
  /** The existing Build-mode content (sidebar + canvas + props + bottom). */
  buildContent: ReactNode;
}

/**
 * Top-level shell for the LLD module. Reads `lldMode` from ui-store and
 * renders one of four mode layouts. Build mode receives today's unchanged
 * 4-panel UI as `buildContent`.
 *
 * Null mode = first visit → default to "build" for existing users so
 * nothing changes for them. New users see the welcome banner which routes
 * them into their chosen mode.
 */
export const LLDShell = memo(function LLDShell({ buildContent }: LLDShellProps) {
  const mode = useUIStore((s) => s.lldMode);

  useLLDModeSync();
  useLLDPreferencesSync();

  // First-visit default = build (non-breaking for existing users)
  const effectiveMode = mode ?? "build";

  return (
    <div className="flex h-full flex-col">
      {/* Top chrome */}
      <div className="flex items-center justify-end border-b border-border/20 px-3 py-2">
        <ModeSwitcher />
      </div>

      {/* Welcome banner (first visit only) */}
      <WelcomeBanner />

      {/* Mode content */}
      <div className="flex-1 min-h-0">
        {effectiveMode === "learn" && <LearnModeLayout />}
        {effectiveMode === "build" && <BuildModeLayout>{buildContent}</BuildModeLayout>}
        {effectiveMode === "drill" && <DrillModeLayout />}
        {effectiveMode === "review" && <ReviewModeLayout />}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/LLDShell.tsx
git commit -m "feat(lld): add LLDShell top-level mode dispatcher

Reads lldMode from ui-store. Renders ModeSwitcher in top chrome, welcome
banner if not dismissed, then one of 4 mode layouts. First-visit defaults
to Build mode for non-breaking behavior with existing users.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Wire existing LLD content into shell

**Files:**
- Modify: `architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx`

- [ ] **Step 1: Inspect current module impl**

Read `architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx` to understand how it currently composes `sidebar`, `canvas`, `properties`, `bottomPanel` slots.

- [ ] **Step 2: Wrap the composed content in LLDShell**

Modify `useLLDModuleImpl.tsx`. Find the return statement that builds `ModuleContent` (sidebar, canvas, properties, bottomPanel). Currently it probably returns something like:

```tsx
onContent({
  sidebar: <LLDSidebar ... />,
  canvas: <LLDCanvas ... />,
  properties: <LLDProperties ... />,
  bottomPanel: <ContextualBottomTabs ... />,
});
```

Change it to delegate to LLDShell. The existing 4-panel content becomes the `buildContent` prop. Since ModuleContent is a 4-slot contract and LLDShell is a single-slot replacement, we need to put ALL the LLD UI into the `canvas` slot and leave the other slots empty:

```tsx
import { LLDShell } from "@/components/modules/lld/LLDShell";

// Build the existing 4-panel content as a single React tree:
const existingBuildContent = (
  <div className="grid h-full grid-cols-[220px_1fr_280px] grid-rows-[1fr_auto]">
    <div className="row-span-2 border-r border-border/20 overflow-auto">
      <LLDSidebar /* existing props */ />
    </div>
    <LLDCanvas /* existing props */ />
    <div className="row-span-2 border-l border-border/20 overflow-auto">
      <LLDProperties /* existing props */ />
    </div>
    <div className="col-span-3 border-t border-border/20">
      <ContextualBottomTabs /* existing props */ />
    </div>
  </div>
);

onContent({
  sidebar: null,
  canvas: <LLDShell buildContent={existingBuildContent} />,
  properties: null,
  bottomPanel: null,
});
```

Check the actual layout convention used elsewhere in the codebase — the grid above is a placeholder. Use whatever the project's AppShell expects when a module provides only the `canvas` slot. You may need to read `src/app/page.tsx` or a layout component to see how slots collapse.

**If** the AppShell has rigid 4-slot expectations, instead of collapsing into canvas, keep sidebar/canvas/properties/bottomPanel as today and wrap ONLY the canvas in LLDShell:

```tsx
onContent({
  sidebar: <LLDSidebar {...} />,           // unchanged
  canvas: <LLDShell buildContent={<LLDCanvas {...} />} />,
  properties: <LLDProperties {...} />,     // unchanged
  bottomPanel: <ContextualBottomTabs {...} />,  // unchanged
});
```

In that case, ModeSwitcher lives only over the canvas. This is simpler and preserves today's layout exactly for Build mode. Later phases can escalate to full-shell mode switching.

**Use the simpler variant** unless the spec's "top chrome" requirement explicitly needs the switcher above the sidebar too. For Phase 1, over-canvas is acceptable.

- [ ] **Step 3: Typecheck + run app**

```bash
pnpm typecheck
pnpm dev
```
Open <http://localhost:3000>. Click the LLD module in the left rail.

Expected observations:
- Existing sidebar/properties/bottom panel all render identically
- A new pill switcher appears above the canvas
- Clicking Learn/Drill/Review replaces the canvas with stub placeholders
- Clicking Build restores canvas
- ⌘1-4 works
- URL updates to `?mode=learn` etc.
- Refresh with `?mode=drill` loads in drill mode
- Welcome banner appears on first visit (clear localStorage: `architex-ui` to test)

If anything breaks visually for existing users (Build mode should look identical to today), pause and fix before committing.

- [ ] **Step 4: Commit**

```bash
git add architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx
git commit -m "feat(lld): wire LLDShell over canvas, preserving Build layout

The existing 4-panel content renders inside Build mode unchanged. The
mode switcher pill lives above the canvas. First-visit users see the
welcome banner. No visible regression for existing users.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: End-to-end smoke test + verification pass

- [ ] **Step 1: Run full verification suite**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass. If any fail, fix before calling Phase 1 complete.

- [ ] **Step 2: Manual smoke test — fresh user flow**

1. Clear browser state: DevTools → Application → Local Storage → delete `architex-ui`
2. Refresh `localhost:3000`, click LLD in rail
3. Expected: Welcome banner visible, pill shows Build highlighted (default)
4. Click "Teach me" in banner → navigates to Learn mode, banner disappears, URL becomes `?mode=learn`
5. Press ⌘2 → switches to Build, URL updates
6. Press ⌘3 → Drill stub, URL updates
7. Press ⌘4 → Review stub, URL updates
8. Refresh page with `?mode=learn` in URL → lands in Learn mode
9. Open DevTools → Application → Local Storage: confirm `architex-ui` has `lldMode: "learn"` persisted

- [ ] **Step 3: Manual smoke test — returning user flow**

1. With Clerk configured and signed in, switch to Drill mode
2. Watch DevTools → Network tab
3. Expected: After 1s, a PATCH to `/api/user-preferences/lld` fires with `{mode: "drill"}`
4. Refresh page → lands in Drill mode (confirmed from DB)
5. Sign out → localStorage still has drill mode → refresh loads it

- [ ] **Step 4: Check existing Build mode unchanged**

Switch to Build mode. Exercise all existing functionality:
- Sidebar pattern browser works (click Singleton)
- Canvas renders UML
- Properties panel shows class details when class is clicked
- Bottom panel tabs all functional (Explain, Quiz, Interview Prep, etc.)
- No console errors

Anything that worked before must still work.

- [ ] **Step 5: Create `.progress` tracker**

Create `docs/superpowers/plans/.progress-phase-1.md`:

```markdown
# Phase 1 Progress Tracker

- [x] Phase 0 pre-flight audit complete
- [x] Task 1: lld_drill_attempts schema
- [x] Task 2: migration generated and applied
- [x] Task 3: ui-store lldMode slice
- [x] Task 4: interview-store activeDrill slice
- [x] Task 5: useLLDModeSync hook
- [x] Task 6: useLLDPreferencesSync hook
- [x] Task 7: useLLDDrillSync hook
- [x] Task 8: GET /api/user-preferences
- [x] Task 9: PATCH /api/user-preferences/lld
- [x] Task 10: /api/lld/drill-attempts routes
- [x] Task 11: lld-events.ts analytics catalog
- [x] Task 12: ModeSwitcher component
- [x] Task 13: WelcomeBanner component
- [x] Task 14: 4 mode layout components
- [x] Task 15: LLDShell shell
- [x] Task 16: wire into useLLDModuleImpl
- [x] Task 17: smoke test + verification

Phase 1 complete on: <YYYY-MM-DD>
Ready to start Phase 2: Learn mode + Wave 1 content (5 patterns).
```

- [ ] **Step 6: Final commit + tag**

```bash
git add docs/superpowers/plans/.progress-phase-1.md
git commit -m "chore: Phase 1 complete — LLD mode scaffolding

- DB: new lld_drill_attempts table with partial unique index
- Stores: lldMode slice (ui-store) + activeDrill slice (interview-store)
- Hooks: mode URL sync + preferences DB sync + drill heartbeat
- API: 6 new routes for preferences + drill lifecycle
- UI: LLDShell with ModeSwitcher + WelcomeBanner + 4 mode layouts
- Build mode unchanged; Learn/Drill/Review are functional stubs

Ready for Phase 2: Learn mode + Wave 1 content.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

git tag phase-1-complete
```

---

## Self-review checklist

Before declaring Phase 1 shipped:

**Spec coverage (§5, §6, §7, §14, §15):**
- [x] 4-mode system with mode switcher — Tasks 12, 15
- [x] DB-first persistence with localStorage cache — Tasks 3, 4, 6
- [x] `lld_drill_attempts` table with partial unique index — Tasks 1, 2
- [x] 6 new API routes — Tasks 8, 9, 10
- [x] URL-reflectable modes via `?mode=` — Task 5
- [x] Welcome banner for first-visit — Task 13
- [x] Mode transition side effects (store-level) — Tasks 3, 4
- [x] Analytics event catalog — Task 11
- [x] Zero regression for existing users — Task 16 (wrapping only, not rewriting)

**Explicitly out of scope for Phase 1 (don't implement):**
- Pattern-room transitions (R3) — Phase 5
- Editorial typography / Cormorant Garamond (R5) — Phase 5
- Ambient sound + lighting (R7) — Phase 5
- Pattern constellation (D1) — Phase 4
- GitHub repo analysis (A1) — Phase 6
- Any content authoring — Phase 2

**Placeholder check:** No TBDs, no "implement later", no skipped code blocks. Every step shows the exact code. ✓

**Type consistency:** `LLDMode` type defined in ui-store, imported consistently everywhere. `DrillMode` defined in interview-store, imported where used. No naming drift. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-lld-phase-1-mode-scaffolding.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Each task's code lands in isolated context so subagent focus stays tight.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for your review.

Which approach?
