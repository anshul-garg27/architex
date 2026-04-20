# SD Phase 1 · Mode Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 5-mode System Design (SD) shell (Learn / Build / Simulate / Drill / Review) as an empty scaffolding layer. All 13 new SD tables land, all 10+ API shells return 501 when not yet implemented, all 5 mode layouts are functional stubs, the SDShell renders with a cobalt accent, the welcome banner guides first-visit users, and URL-reflectable `?mode=` switching is wired. Zero regression to the existing LLD module. All backend plumbing (DB tables, API shells, stores, hooks, analytics) in place ready for Phase 2 content work.

**Architecture:** Single URL (`/modules/system-design` resolved via existing app shell, eventually `/sd/*`). New top-level `SDShell` component reads `sdMode` from Zustand ui-store and renders one of five layout components. Build mode wraps today's SD (React Flow) canvas unchanged. Learn / Simulate / Drill / Review are stubs in this phase. URL-reflectable via `?mode=` query param. New `sd-store` holds sd-specific transient state (activeSDDrill, activeSDSim, sidebar widths). 13 new DB tables gated by a single atomic migration `0002_add_sd_module.sql`. Partial unique index enforces "one active SD drill per user" and "one active SD sim per user" at the DB level. Cobalt accent (`#2563EB`) swaps in globally when `sdMode` is non-null; LLD amber (`#F59E0B`) persists when user is in LLD module. DB-first persistence with localStorage as offline cache — `user_preferences.preferences.sd` JSONB subtree.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Clerk v7 (optional), Vitest, Testing Library. Note: the installed Next.js is a non-canonical fork — always consult `node_modules/next/dist/docs/` before writing route code, per `architex/AGENTS.md`.

**Prerequisite:** LLD Phase 1 (`2026-04-20-lld-phase-1-mode-scaffolding.md`) must be **complete and shipped** before starting SD Phase 1. This plan reuses patterns from LLD Phase 1 (partial unique index for active drills, DB-first preferences, URL ↔ store sync). It extends but does not modify LLD structures.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md`:
- §3 — The 5 modes (Learn · Build · Simulate · Drill · Review) with ⌘1-5 shortcuts
- §4 — Information architecture, URL shape (`/sd`, `/sd/learn/*`, `/sd/build`, `/sd/simulate/*`, `/sd/drill/*`, `/sd/review`)
- §18 — UI & visual language (cobalt `#2563EB` accent, 3-column layouts per mode, 90-sec onboarding spec)
- §21 — Data model sketch (13 new SD tables, extended `user_preferences.preferences.sd` subtree)
- §23 — Implementation Phases, esp. Phase 1 scope (Weeks 3-6, ~140h)

---

## Pre-flight checklist (Phase 0 · ~4-6 hours)

Run before Task 1. These verify SD-specific "known bugs" listed in the spec are actually resolved in current code and that LLD Phase 1 is shipped.

- [ ] **Verify LLD Phase 1 is shipped**

Check: `docs/superpowers/plans/.progress-phase-1.md` exists and is fully checked off. The `lld_drill_attempts` table exists in the DB (run `pnpm db:studio` and confirm). The `LLDShell` component exists at `architex/src/components/modules/lld/LLDShell.tsx`. The `useLLDModeSync` hook exists. If LLD Phase 1 is NOT shipped, STOP — finish it first. This SD plan re-uses the exact architecture patterns from LLD Phase 1; reversing the order wastes time.

Run:
```bash
ls architex/src/components/modules/lld/LLDShell.tsx
ls architex/src/hooks/useLLDModeSync.ts
grep -q "lldDrillAttempts" architex/src/db/schema/index.ts && echo ok
```

Expected: all three succeed (exit code 0).

- [ ] **Verify authorization guards on all `/api/sd/*` placeholder routes**

If any `/api/sd/*` routes exist today (pre-Phase-1 experiments), confirm they call `requireAuth()` at the top. If they don't, either delete them or add auth guards before we rely on them.

Run:
```bash
find architex/src/app/api/sd -name route.ts 2>/dev/null | xargs grep -L requireAuth 2>/dev/null
```

Expected: no files listed (every route uses requireAuth).

- [ ] **Verify existing simulation engine performance baseline**

The SD module's Phase 3 Simulate mode will wrap the existing 34-file engine at `architex/src/engines/simulation/*`. Phase 1 should not touch that engine, but we record a baseline so later phases can detect regressions.

Run:
```bash
cd architex
pnpm test:run -- simulation
```

Record the total test duration in `docs/superpowers/plans/.sim-baseline.txt` with the commit SHA. Keep this file .gitignored locally; commit only the SHA reference.

- [ ] **Verify Sentry PII scrubbing config**

Same as LLD Phase 0 — verify `sentry.*.config.ts` scrubs headers, env values, and Clerk session cookies. If missing, stub in a TODO; don't block Phase 1 on full Sentry wiring.

- [ ] **Verify WebSocket auth primitives are ready**

SD Phase 3 (Simulate) will require auth'd WebSockets for the chaos-engine stream. Phase 1 does not ship WS, but we verify the auth helper exists:

```bash
grep -q "verifyClerkSessionFromWs" architex/src/lib/auth.ts 2>/dev/null
```

If no helper, add a TODO in a new issue; don't block Phase 1 on this.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

All four must pass before starting SD Phase 1. Snapshot the output hash into `docs/superpowers/plans/.sd-phase-1-baseline.txt` for later diff.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "fix(sd): pre-flight security + stability verification for SD Phase 1"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/
│   └── 0002_add_sd_module.sql                                 # NEW (13 tables, 1 migration)
├── src/
│   ├── db/schema/
│   │   ├── sd-concepts.ts                                      # NEW
│   │   ├── sd-problems.ts                                      # NEW
│   │   ├── sd-concept-reads.ts                                 # NEW
│   │   ├── sd-concept-bookmarks.ts                             # NEW
│   │   ├── sd-designs.ts                                       # NEW
│   │   ├── sd-design-snapshots.ts                              # NEW
│   │   ├── sd-design-annotations.ts                            # NEW
│   │   ├── sd-simulations.ts                                   # NEW
│   │   ├── sd-simulation-events.ts                             # NEW
│   │   ├── sd-drill-attempts.ts                                # NEW
│   │   ├── sd-drill-interviewer-turns.ts                       # NEW
│   │   ├── sd-shares.ts                                        # NEW
│   │   ├── sd-fsrs-cards.ts                                    # NEW
│   │   ├── index.ts                                            # MODIFY (re-export 13)
│   │   ├── relations.ts                                        # MODIFY (add 13 relation blocks)
│   │   └── user-preferences.ts                                 # MODIFY (document sd subtree)
│   ├── stores/
│   │   ├── ui-store.ts                                         # MODIFY (+ sdMode slice)
│   │   ├── sd-store.ts                                         # NEW
│   │   └── __tests__/
│   │       ├── ui-store.sd.test.ts                             # NEW
│   │       └── sd-store.test.ts                                # NEW
│   ├── hooks/
│   │   ├── useSDModeSync.ts                                    # NEW
│   │   ├── useSDPreferencesSync.ts                             # NEW
│   │   ├── useSDDrillSync.ts                                   # NEW
│   │   ├── useSDSimulationSync.ts                              # NEW
│   │   └── __tests__/
│   │       ├── useSDModeSync.test.tsx                          # NEW
│   │       └── useSDDrillSync.test.tsx                         # NEW
│   ├── lib/analytics/
│   │   └── sd-events.ts                                        # NEW (30+ events)
│   ├── app/api/sd/
│   │   ├── concepts/route.ts                                   # NEW
│   │   ├── concepts/[id]/route.ts                              # NEW
│   │   ├── problems/route.ts                                   # NEW
│   │   ├── problems/[id]/route.ts                              # NEW
│   │   ├── designs/route.ts                                    # NEW
│   │   ├── designs/[id]/route.ts                               # NEW
│   │   ├── designs/[id]/snapshot/route.ts                      # NEW
│   │   ├── simulations/route.ts                                # NEW
│   │   ├── simulations/[id]/route.ts                           # NEW
│   │   ├── drill-attempts/route.ts                             # NEW
│   │   ├── drill-attempts/active/route.ts                      # NEW
│   │   ├── cards/due/route.ts                                  # NEW
│   │   ├── review/submit/route.ts                              # NEW
│   │   └── __tests__/                                          # NEW
│   │       ├── sd-concepts.test.ts
│   │       ├── sd-designs.test.ts
│   │       └── sd-drill-attempts.test.ts
│   └── components/modules/sd/
│       ├── SDShell.tsx                                         # NEW
│       ├── modes/
│       │   ├── SDModeSwitcher.tsx                              # NEW (5 pills, cobalt)
│       │   ├── SDWelcomeBanner.tsx                             # NEW (90-sec onboarding spec §18.6)
│       │   ├── LearnLayout.tsx                                 # NEW
│       │   ├── BuildLayout.tsx                                 # NEW (wraps existing SD canvas)
│       │   ├── SimulateLayout.tsx                              # NEW (stub)
│       │   ├── DrillLayout.tsx                                 # NEW (stub)
│       │   └── ReviewLayout.tsx                                # NEW (stub)
│       └── hooks/
│           └── useSDModuleImpl.tsx                             # MODIFY (delegate to SDShell)
```

**Design rationale for splits:**
- 13 tables × 1 file each so each team member / later phase can evolve independently.
- Mode layouts split per mode — different teams own Learn vs Simulate vs Drill later.
- Hooks split by concern: mode URL sync, preferences sync, drill heartbeat, sim heartbeat (Phase 3 uses sim hook; shell only ships drill + prefs + mode).
- API routes follow Next.js App Router convention — one `route.ts` per HTTP resource.
- Test colocation follows repo convention (`__tests__/` adjacent).

---

## Table of Contents

- Pre-flight checklist (Phase 0 · above)
- File Structure (above)
- Task 1 · `sd_concepts` DB schema (+ relations wiring)
- Task 2 · `sd_problems` DB schema
- Task 3 · `sd_concept_reads` + `sd_concept_bookmarks` schemas
- Task 4 · `sd_designs` + `sd_design_snapshots` + `sd_design_annotations` schemas
- Task 5 · `sd_simulations` + `sd_simulation_events` schemas
- Task 6 · `sd_drill_attempts` + `sd_drill_interviewer_turns` schemas
- Task 7 · `sd_shares` + `sd_fsrs_cards` schemas
- Task 8 · Generate and apply migration `0002_add_sd_module.sql`
- Task 9 · Extend `ui-store` with `sdMode` + welcome banner slice
- Task 10 · Create new `sd-store` (Zustand) with `activeSDDrill` + `activeSDSim` slices
- Task 11 · Create `useSDModeSync` hook (URL ↔ store)
- Task 12 · Create `useSDPreferencesSync` hook (debounced DB write-through)
- Task 13 · Create `useSDDrillSync` hook (heartbeat every 10s)
- Task 14 · Create API shells for concepts/problems (4 routes, return 501 for POST/PATCH)
- Task 15 · Create API shells for designs (3 routes) + snapshot
- Task 16 · Create API shells for simulations (2 routes)
- Task 17 · Create API shells for drill-attempts (2 routes) + active
- Task 18 · Create API shells for review (cards/due, review/submit)
- Task 19 · Create SD analytics event catalog (`sd-events.ts`, 30+ events)
- Task 20 · Create `SDModeSwitcher` component with cobalt accent + ⌘1-5 shortcuts
- Task 21 · Create `SDWelcomeBanner` (first-visit 90-sec spotlight carousel spec §18.6)
- Task 22 · Create 5 mode layout stubs (Learn / Build wrapper / Simulate / Drill / Review)
- Task 23 · Create `SDShell` top-level mode dispatcher
- Task 24 · Wire existing SD canvas into `BuildLayout` via `useSDModuleImpl`
- Task 25 · End-to-end smoke test + verification pass
- Self-review checklist
- Execution Handoff

---

## Task 1: Create `sd_concepts` DB schema

**Files:**
- Create: `architex/src/db/schema/sd-concepts.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/db/schema/__tests__/sd-concepts.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdConcepts } from "@/db/schema/sd-concepts";

describe("sdConcepts schema", () => {
  it("exports a pgTable with the expected columns", () => {
    const cols = Object.keys(sdConcepts);
    // Drizzle exposes columns as enumerable keys of the symbolized object
    expect(cols).toContain("id");
    expect(cols).toContain("slug");
    expect(cols).toContain("wave");
    expect(cols).toContain("waveOrder");
    expect(cols).toContain("title");
    expect(cols).toContain("bodyMdx");
    expect(cols).toContain("voiceVariant");
  });

  it("declares primary key and unique slug", () => {
    // Drizzle's internal symbol keys carry constraint metadata
    const table = sdConcepts as unknown as {
      _: { columns: Record<string, { primary?: boolean; isUnique?: boolean }> };
    };
    expect(table._.columns.id.primary).toBe(true);
    expect(table._.columns.slug.isUnique).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd architex
pnpm test:run -- sd-concepts.schema
```

Expected: FAIL with `Cannot find module '@/db/schema/sd-concepts'`.

- [ ] **Step 3: Write the schema file**

Create `architex/src/db/schema/sd-concepts.ts`:

```typescript
/**
 * DB-SD-01: sd_concepts — 40 concept records (the atoms).
 *
 * Each concept is an 8-section MDX body authored by Opus (see spec §5.4).
 * Indexed by wave + wave_order for deterministic curriculum ordering.
 *
 * voice_variant: one of 'eli5' | 'standard' | 'eli-senior' — allows the
 * same concept to ship with multiple voices behind a feature flag.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const sdConcepts = pgTable(
  "sd_concepts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    wave: integer("wave").notNull(), // 1..8
    waveOrder: integer("wave_order").notNull(), // position within wave
    title: varchar("title", { length: 200 }).notNull(),
    shortDescription: text("short_description").notNull(),
    bodyMdx: text("body_mdx").notNull(),
    wordCount: integer("word_count"),
    readingTimeMin: integer("reading_time_min"),
    voiceVariant: varchar("voice_variant", { length: 20 })
      .notNull()
      .default("standard"),
    contentQuality: varchar("content_quality", { length: 20 })
      .notNull()
      .default("polished"),
    generatedBy: varchar("generated_by", { length: 20 })
      .notNull()
      .default("hybrid"),
    sourceYear: integer("source_year"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sd_concepts_wave_idx").on(t.wave, t.waveOrder)],
);

export type SDConcept = typeof sdConcepts.$inferSelect;
export type NewSDConcept = typeof sdConcepts.$inferInsert;
```

- [ ] **Step 4: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and append next to the other SD exports (alphabetical within the SD group, placed below the existing LLD block):

```typescript
export {
  sdConcepts,
  type SDConcept,
  type NewSDConcept,
} from "./sd-concepts";
```

- [ ] **Step 5: Verify typecheck passes**

```bash
cd architex
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Run schema test**

```bash
pnpm test:run -- sd-concepts.schema
```

Expected: PASS · all 2 assertions.

- [ ] **Step 7: Commit**

```bash
git add architex/src/db/schema/sd-concepts.ts \
        architex/src/db/schema/__tests__/sd-concepts.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_concepts schema

40-row table for SD concept pages (8-section MDX). Unique slug, composite
wave index. voice_variant column allows eli5/standard/eli-senior behind
a flag per spec §5.4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `sd_problems` DB schema

**Files:**
- Create: `architex/src/db/schema/sd-problems.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/db/schema/__tests__/sd-problems.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdProblems } from "@/db/schema/sd-problems";

describe("sdProblems schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdProblems);
    for (const c of [
      "id",
      "slug",
      "domain",
      "difficulty",
      "title",
      "bodyMdx",
      "canonicalSolutions",
      "rubric",
      "recommendedChaos",
      "linkedConcepts",
      "linkedLldPatterns",
      "companiesAsking",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- sd-problems.schema
```

Expected: FAIL · module missing.

- [ ] **Step 3: Write the schema file**

Create `architex/src/db/schema/sd-problems.ts`:

```typescript
/**
 * DB-SD-02: sd_problems — 30 problem records (the molecules).
 *
 * Each problem is a 6-pane MDX page with canonical solutions, a 6-axis
 * rubric, recommended chaos events, linked concepts/LLD patterns, and
 * the companies known to ask it. Spec §5.5.
 *
 * Filtered by domain, difficulty, company in the Drill and Learn libraries.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const sdProblems = pgTable(
  "sd_problems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    domain: varchar("domain", { length: 50 }).notNull(),
    difficulty: varchar("difficulty", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    bodyMdx: text("body_mdx").notNull(),
    canonicalSolutions: jsonb("canonical_solutions").notNull(),
    rubric: jsonb("rubric").notNull(),
    recommendedChaos: jsonb("recommended_chaos").notNull(),
    linkedConcepts: jsonb("linked_concepts"),
    linkedLldPatterns: jsonb("linked_lld_patterns"),
    companiesAsking: jsonb("companies_asking"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_problems_domain_idx").on(t.domain),
    index("sd_problems_difficulty_idx").on(t.difficulty),
  ],
);

export type SDProblem = typeof sdProblems.$inferSelect;
export type NewSDProblem = typeof sdProblems.$inferInsert;
```

- [ ] **Step 4: Re-export from schema index**

```typescript
export {
  sdProblems,
  type SDProblem,
  type NewSDProblem,
} from "./sd-problems";
```

- [ ] **Step 5: Verify typecheck + test**

```bash
pnpm typecheck
pnpm test:run -- sd-problems.schema
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-problems.ts \
        architex/src/db/schema/__tests__/sd-problems.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_problems schema

30-row table for SD problem pages (6-pane MDX). Domain + difficulty
indexes back the faceted filter bar from spec §4.3. JSONB columns carry
canonical solutions, 6-axis rubric, recommended chaos, linked concepts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `sd_concept_reads` + `sd_concept_bookmarks` schemas

**Files:**
- Create: `architex/src/db/schema/sd-concept-reads.ts`
- Create: `architex/src/db/schema/sd-concept-bookmarks.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

Per-user tracking tables. `sd_concept_reads` logs every scroll-to-bottom event (used to compute wave-completion progress). `sd_concept_bookmarks` is the user's "save for later" list, surfaced on the dashboard and in the Review queue.

- [ ] **Step 1: Write the failing tests**

Create `architex/src/db/schema/__tests__/sd-concept-reads.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdConceptReads } from "@/db/schema/sd-concept-reads";

describe("sdConceptReads schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdConceptReads);
    for (const c of [
      "id",
      "userId",
      "conceptId",
      "startedAt",
      "completedAt",
      "scrollDepthPct",
      "checkpointsPassed",
      "checkpointsAttempted",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-concept-bookmarks.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdConceptBookmarks } from "@/db/schema/sd-concept-bookmarks";

describe("sdConceptBookmarks schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdConceptBookmarks);
    for (const c of ["id", "userId", "conceptId", "note", "createdAt"]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run -- sd-concept-reads.schema sd-concept-bookmarks.schema
```

Expected: both FAIL · modules missing.

- [ ] **Step 3: Write the schema files**

Create `architex/src/db/schema/sd-concept-reads.ts`:

```typescript
/**
 * DB-SD-03: sd_concept_reads — one row per user read session of a concept.
 *
 * Inserted on concept page mount; updated on scroll milestones and
 * checkpoint submissions; finalized when user scrolls ≥ 95% or closes
 * the page. Used to compute Wave completion progress and the FSRS
 * initial-due date for that concept's generated cards.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  timestamp,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdConcepts } from "./sd-concepts";

export const sdConceptReads = pgTable(
  "sd_concept_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => sdConcepts.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    scrollDepthPct: real("scroll_depth_pct").notNull().default(0),
    checkpointsPassed: integer("checkpoints_passed").notNull().default(0),
    checkpointsAttempted: integer("checkpoints_attempted").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_concept_reads_user_concept_idx").on(t.userId, t.conceptId),
    index("sd_concept_reads_started_idx").on(t.userId, t.startedAt),
  ],
);

export type SDConceptRead = typeof sdConceptReads.$inferSelect;
export type NewSDConceptRead = typeof sdConceptReads.$inferInsert;
```

Create `architex/src/db/schema/sd-concept-bookmarks.ts`:

```typescript
/**
 * DB-SD-04: sd_concept_bookmarks — user's "save for later" bookmarks.
 *
 * Unique (user_id, concept_id) prevents duplicate bookmarks. Optional
 * note field lets the user attach context ("revisit when building rate
 * limiter"). Surfaced on the dashboard and in the Review queue.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdConcepts } from "./sd-concepts";

export const sdConceptBookmarks = pgTable(
  "sd_concept_bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => sdConcepts.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sd_concept_bookmarks_user_concept_uq").on(
      t.userId,
      t.conceptId,
    ),
  ],
);

export type SDConceptBookmark = typeof sdConceptBookmarks.$inferSelect;
export type NewSDConceptBookmark = typeof sdConceptBookmarks.$inferInsert;
```

- [ ] **Step 4: Re-export both from schema index**

```typescript
export {
  sdConceptReads,
  type SDConceptRead,
  type NewSDConceptRead,
} from "./sd-concept-reads";
export {
  sdConceptBookmarks,
  type SDConceptBookmark,
  type NewSDConceptBookmark,
} from "./sd-concept-bookmarks";
```

- [ ] **Step 5: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm test:run -- sd-concept-reads.schema sd-concept-bookmarks.schema
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-concept-reads.ts \
        architex/src/db/schema/sd-concept-bookmarks.ts \
        architex/src/db/schema/__tests__/sd-concept-reads.schema.test.ts \
        architex/src/db/schema/__tests__/sd-concept-bookmarks.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_concept_reads + sd_concept_bookmarks schemas

- sd_concept_reads: one row per user read session; tracks scroll depth
  and checkpoint counts. Powers Wave completion progress and FSRS
  initial-due date computation.
- sd_concept_bookmarks: save-for-later with optional note. Unique
  (user, concept) prevents duplicates.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create `sd_designs` + `sd_design_snapshots` + `sd_design_annotations` schemas

**Files:**
- Create: `architex/src/db/schema/sd-designs.ts`
- Create: `architex/src/db/schema/sd-design-snapshots.ts`
- Create: `architex/src/db/schema/sd-design-annotations.ts`
- Modify: `architex/src/db/schema/index.ts`

These three tables model the **Build mode** artifact lifecycle. A `sd_designs` row is the persistent diagram the user sees in Build. `sd_design_snapshots` captures immutable versions on manual save or auto-snap (every 5 minutes while actively editing, per spec §7). `sd_design_annotations` stores inline sticky notes, decision rationale, and reviewer comments.

- [ ] **Step 1: Write the failing tests**

Create `architex/src/db/schema/__tests__/sd-designs.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdDesigns } from "@/db/schema/sd-designs";

describe("sdDesigns schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdDesigns);
    for (const c of [
      "id",
      "userId",
      "name",
      "problemSlug",
      "diagramType",
      "canvasState",
      "provider",
      "renderMode",
      "isPublic",
      "publicShareId",
      "version",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-design-snapshots.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdDesignSnapshots } from "@/db/schema/sd-design-snapshots";

describe("sdDesignSnapshots schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdDesignSnapshots);
    for (const c of [
      "id",
      "designId",
      "version",
      "canvasState",
      "authorUserId",
      "reason",
      "createdAt",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-design-annotations.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdDesignAnnotations } from "@/db/schema/sd-design-annotations";

describe("sdDesignAnnotations schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdDesignAnnotations);
    for (const c of [
      "id",
      "designId",
      "authorUserId",
      "annotationType",
      "anchor",
      "body",
      "resolved",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run -- sd-designs.schema sd-design-snapshots.schema sd-design-annotations.schema
```

Expected: all three FAIL · modules missing.

- [ ] **Step 3: Write the schema files**

Create `architex/src/db/schema/sd-designs.ts`:

```typescript
/**
 * DB-SD-05: sd_designs — the Build-mode diagram record.
 *
 * One row per saved diagram. canvasState is the React Flow nodes+edges
 * blob. provider controls the icon set ('aws' | 'gcp' | 'azure' | 'generic').
 * render_mode supports default / blueprint / hand-drawn (spec §18.8).
 *
 * public_share_id is populated when the user publishes (spec §4.8).
 * Unique on that column where non-null (partial unique index).
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const sdDesigns = pgTable(
  "sd_designs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }),
    problemSlug: varchar("problem_slug", { length: 100 }),
    diagramType: varchar("diagram_type", { length: 30 }).notNull(),
    canvasState: jsonb("canvas_state").notNull(),
    provider: varchar("provider", { length: 20 }).notNull().default("aws"),
    renderMode: varchar("render_mode", { length: 30 })
      .notNull()
      .default("default"),
    isPublic: boolean("is_public").notNull().default(false),
    publicShareId: varchar("public_share_id", { length: 20 }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_designs_user_updated_idx").on(t.userId, t.updatedAt),
    uniqueIndex("sd_designs_public_share_uq")
      .on(t.publicShareId)
      .where(sql`${t.publicShareId} IS NOT NULL`),
  ],
);

export type SDDesign = typeof sdDesigns.$inferSelect;
export type NewSDDesign = typeof sdDesigns.$inferInsert;
```

Create `architex/src/db/schema/sd-design-snapshots.ts`:

```typescript
/**
 * DB-SD-06: sd_design_snapshots — immutable version history for sd_designs.
 *
 * Written on manual save, auto-snap (every 5 min of edit activity), or
 * pre-simulate ("pin this state before we run it"). reason is a short
 * free-text label shown in the version-history panel.
 *
 * Compound index on (designId, version) gives O(log n) access to any
 * historical version; a designId's snapshots share monotonically
 * increasing version numbers.
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdDesigns } from "./sd-designs";

export const sdDesignSnapshots = pgTable(
  "sd_design_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => sdDesigns.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    canvasState: jsonb("canvas_state").notNull(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 50 }).notNull(), // 'manual'|'auto'|'pre-simulate'|'restore'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sd_design_snapshots_design_version_uq").on(t.designId, t.version),
  ],
);

export type SDDesignSnapshot = typeof sdDesignSnapshots.$inferSelect;
export type NewSDDesignSnapshot = typeof sdDesignSnapshots.$inferInsert;
```

Create `architex/src/db/schema/sd-design-annotations.ts`:

```typescript
/**
 * DB-SD-07: sd_design_annotations — inline comments + sticky notes on designs.
 *
 * anchor JSONB shape: { nodeId?: string, edgeId?: string, x?: number, y?: number }.
 * At least one of nodeId / edgeId / (x, y) must be provided at write time
 * (validated at the API layer, not the DB).
 *
 * annotation_type controls the render style:
 *   - 'note': yellow sticky (user's own thinking)
 *   - 'rationale': blue callout (decision justification)
 *   - 'comment': gray conversation bubble (feedback from reviewer)
 *   - 'todo': red flag (needs-fix marker)
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdDesigns } from "./sd-designs";

export const sdDesignAnnotations = pgTable(
  "sd_design_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => sdDesigns.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    annotationType: varchar("annotation_type", { length: 20 }).notNull(),
    anchor: jsonb("anchor").notNull(),
    body: text("body").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_design_annotations_design_idx").on(t.designId, t.resolved),
  ],
);

export type SDDesignAnnotation = typeof sdDesignAnnotations.$inferSelect;
export type NewSDDesignAnnotation = typeof sdDesignAnnotations.$inferInsert;
```

- [ ] **Step 4: Re-export all three from schema index**

```typescript
export {
  sdDesigns,
  type SDDesign,
  type NewSDDesign,
} from "./sd-designs";
export {
  sdDesignSnapshots,
  type SDDesignSnapshot,
  type NewSDDesignSnapshot,
} from "./sd-design-snapshots";
export {
  sdDesignAnnotations,
  type SDDesignAnnotation,
  type NewSDDesignAnnotation,
} from "./sd-design-annotations";
```

- [ ] **Step 5: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm test:run -- sd-designs.schema sd-design-snapshots.schema sd-design-annotations.schema
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-designs.ts \
        architex/src/db/schema/sd-design-snapshots.ts \
        architex/src/db/schema/sd-design-annotations.ts \
        architex/src/db/schema/__tests__/sd-designs.schema.test.ts \
        architex/src/db/schema/__tests__/sd-design-snapshots.schema.test.ts \
        architex/src/db/schema/__tests__/sd-design-annotations.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_designs + snapshots + annotations schemas

- sd_designs: Build-mode diagram record; canvasState JSONB carries
  the React Flow blob. Partial unique index on public_share_id.
- sd_design_snapshots: immutable version history (manual/auto/pre-sim).
  Unique (design_id, version).
- sd_design_annotations: sticky notes, rationale callouts, comments,
  todos anchored to nodes/edges/coords. Index includes resolved flag
  for fast "open annotations" queries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create `sd_simulations` + `sd_simulation_events` schemas

**Files:**
- Create: `architex/src/db/schema/sd-simulations.ts`
- Create: `architex/src/db/schema/sd-simulation-events.ts`
- Modify: `architex/src/db/schema/index.ts`

Simulation runs and their event streams. `sd_simulations` is the header row — one per completed (or in-flight) run. `sd_simulation_events` is the event log: every chaos event, every SLO breach, every cost-threshold crossing, every coach intervention. This is the data source for the replay scrubber in Phase 3 Simulate mode.

- [ ] **Step 1: Write the failing tests**

Create `architex/src/db/schema/__tests__/sd-simulations.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdSimulations } from "@/db/schema/sd-simulations";

describe("sdSimulations schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdSimulations);
    for (const c of [
      "id",
      "userId",
      "designId",
      "activity",
      "scaleDau",
      "chaosControlMode",
      "realIncidentSlug",
      "startedAt",
      "completedAt",
      "durationSimSeconds",
      "metrics",
      "narrativeStream",
      "publicShareId",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-simulation-events.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdSimulationEvents } from "@/db/schema/sd-simulation-events";

describe("sdSimulationEvents schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdSimulationEvents);
    for (const c of [
      "id",
      "simulationId",
      "simTickMs",
      "wallClockMs",
      "eventType",
      "family",
      "severity",
      "payload",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run -- sd-simulations.schema sd-simulation-events.schema
```

Expected: both FAIL · modules missing.

- [ ] **Step 3: Write the schema files**

Create `architex/src/db/schema/sd-simulations.ts`:

```typescript
/**
 * DB-SD-08: sd_simulations — one row per simulation run (flagship mode).
 *
 * activity is one of 'validate' | 'stress' | 'chaos' | 'compare' |
 * 'forecast' | 'archaeology' (spec §8.5, six activity framings).
 *
 * scale_dau is the target traffic profile; chaos_control_mode is used
 * when activity='chaos' (one of 6 modes, spec §8.8); real_incident_slug
 * is used when activity='archaeology' (points to sd_real_incidents).
 *
 * metrics is the final p50/p95/p99/err/cost/slo summary. narrative_stream
 * holds the ordered margin cards Opus writes as the sim unfolds.
 *
 * Partial unique index enforces "one active sim per user per design"
 * so a user cannot accidentally start a second sim on the same diagram
 * (would fight for resources in the tick loop).
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdDesigns } from "./sd-designs";

export const sdSimulations = pgTable(
  "sd_simulations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    designId: uuid("design_id").references(() => sdDesigns.id, {
      onDelete: "set null",
    }),
    activity: varchar("activity", { length: 30 }).notNull(),
    scaleDau: varchar("scale_dau", { length: 10 }).notNull(),
    chaosControlMode: varchar("chaos_control_mode", { length: 30 }),
    realIncidentSlug: varchar("real_incident_slug", { length: 100 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    durationSimSeconds: integer("duration_sim_seconds"),
    metrics: jsonb("metrics").notNull().default(sql`'{}'::jsonb`),
    narrativeStream: jsonb("narrative_stream")
      .notNull()
      .default(sql`'[]'::jsonb`),
    publicShareId: varchar("public_share_id", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_simulations_user_started_idx").on(t.userId, t.startedAt),
    uniqueIndex("one_active_sim_per_user_design")
      .on(t.userId, t.designId)
      .where(sql`${t.completedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    uniqueIndex("sd_simulations_public_share_uq")
      .on(t.publicShareId)
      .where(sql`${t.publicShareId} IS NOT NULL`),
  ],
);

export type SDSimulation = typeof sdSimulations.$inferSelect;
export type NewSDSimulation = typeof sdSimulations.$inferInsert;
```

Create `architex/src/db/schema/sd-simulation-events.ts`:

```typescript
/**
 * DB-SD-09: sd_simulation_events — the event log for a simulation run.
 *
 * Every chaos event, SLO breach, cost-threshold crossing, and coach
 * intervention lands here. The replay scrubber (Phase 3) reads this
 * table in sim_tick_ms order to reconstruct the run.
 *
 * sim_tick_ms is simulation-clock milliseconds since t0; wall_clock_ms
 * is real wall clock for correlating with external traces.
 *
 * family / severity are denormalized copies of sd_chaos_events fields
 * so the event stream is self-contained (no joins on replay).
 */

import {
  pgTable,
  uuid,
  varchar,
  bigint,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sdSimulations } from "./sd-simulations";

export const sdSimulationEvents = pgTable(
  "sd_simulation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    simulationId: uuid("simulation_id")
      .notNull()
      .references(() => sdSimulations.id, { onDelete: "cascade" }),
    simTickMs: bigint("sim_tick_ms", { mode: "number" }).notNull(),
    wallClockMs: bigint("wall_clock_ms", { mode: "number" }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    family: varchar("family", { length: 30 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    payload: jsonb("payload"),
  },
  (t) => [
    index("sd_sim_events_sim_tick_idx").on(t.simulationId, t.simTickMs),
    index("sd_sim_events_family_severity_idx").on(t.family, t.severity),
  ],
);

export type SDSimulationEvent = typeof sdSimulationEvents.$inferSelect;
export type NewSDSimulationEvent = typeof sdSimulationEvents.$inferInsert;
```

- [ ] **Step 4: Re-export from schema index**

```typescript
export {
  sdSimulations,
  type SDSimulation,
  type NewSDSimulation,
} from "./sd-simulations";
export {
  sdSimulationEvents,
  type SDSimulationEvent,
  type NewSDSimulationEvent,
} from "./sd-simulation-events";
```

- [ ] **Step 5: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm test:run -- sd-simulations.schema sd-simulation-events.schema
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-simulations.ts \
        architex/src/db/schema/sd-simulation-events.ts \
        architex/src/db/schema/__tests__/sd-simulations.schema.test.ts \
        architex/src/db/schema/__tests__/sd-simulation-events.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_simulations + sd_simulation_events schemas

- sd_simulations: one row per run with activity, scale, chaos mode,
  final metrics, narrative stream. Partial unique index enforces
  one-active-sim-per-user-per-design + one-share-per-sim.
- sd_simulation_events: replayable event log ordered by sim_tick_ms.
  Denormalized family/severity avoids joins on replay.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create `sd_drill_attempts` + `sd_drill_interviewer_turns` schemas

**Files:**
- Create: `architex/src/db/schema/sd-drill-attempts.ts`
- Create: `architex/src/db/schema/sd-drill-interviewer-turns.ts`
- Modify: `architex/src/db/schema/index.ts`

SD drill is a 5-stage timed mock interview (spec §9). `sd_drill_attempts` is the header; `sd_drill_interviewer_turns` holds the interviewer persona's turns, the user's responses, and any hints delivered. Mirror of LLD's drill structure but with added stage_times JSONB (5 stages × elapsed_ms map) and persona/company-preset columns.

- [ ] **Step 1: Write the failing tests**

Create `architex/src/db/schema/__tests__/sd-drill-attempts.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";

describe("sdDrillAttempts schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdDrillAttempts);
    for (const c of [
      "id",
      "userId",
      "problemSlug",
      "mode",
      "persona",
      "companyPreset",
      "startedAt",
      "currentStage",
      "stageTimes",
      "submittedAt",
      "abandonedAt",
      "canvasState",
      "rubric",
      "aiPostmortem",
      "publicShareId",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-drill-interviewer-turns.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdDrillInterviewerTurns } from "@/db/schema/sd-drill-interviewer-turns";

describe("sdDrillInterviewerTurns schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdDrillInterviewerTurns);
    for (const c of [
      "id",
      "drillId",
      "stage",
      "turnIndex",
      "speaker",
      "content",
      "hintTier",
      "tokenCost",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run -- sd-drill-attempts.schema sd-drill-interviewer-turns.schema
```

Expected: both FAIL · modules missing.

- [ ] **Step 3: Write the schema files**

Create `architex/src/db/schema/sd-drill-attempts.ts`:

```typescript
/**
 * DB-SD-10: sd_drill_attempts — SD mock interview attempts.
 *
 * mode: 'study' | 'timed' | 'exam' | 'pair' | 'review' | 'full-stack' | 'verbal'
 * current_stage: 1..5 (clarify → capacity → API → architecture → deep-dive)
 * stage_times: map { "1": ms, "2": ms, ... } accumulated per stage
 * persona: slug into persona library (spec §9.4, 8 personas)
 * company_preset: 'google' | 'meta' | 'stripe' | ... (influences rubric weights)
 * rubric: final 6-axis rubric payload (spec §9.6)
 *
 * Partial unique index enforces one active drill per user (cross-mode) —
 * user cannot start a second drill while one is in progress.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sdDrillAttempts = pgTable(
  "sd_drill_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemSlug: varchar("problem_slug", { length: 100 }).notNull(),
    mode: varchar("mode", { length: 30 }).notNull(),
    persona: varchar("persona", { length: 50 }),
    companyPreset: varchar("company_preset", { length: 50 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentStage: integer("current_stage").notNull().default(1),
    stageTimes: jsonb("stage_times").notNull().default(sql`'{}'::jsonb`),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    canvasState: jsonb("canvas_state"),
    verbalTranscript: text("verbal_transcript"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),
    rubric: jsonb("rubric"),
    aiPostmortem: text("ai_postmortem"),
    publicShareId: varchar("public_share_id", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("one_active_sd_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("sd_drills_history_idx").on(t.userId, t.submittedAt),
    uniqueIndex("sd_drills_public_share_uq")
      .on(t.publicShareId)
      .where(sql`${t.publicShareId} IS NOT NULL`),
  ],
);

export type SDDrillAttempt = typeof sdDrillAttempts.$inferSelect;
export type NewSDDrillAttempt = typeof sdDrillAttempts.$inferInsert;
```

Create `architex/src/db/schema/sd-drill-interviewer-turns.ts`:

```typescript
/**
 * DB-SD-11: sd_drill_interviewer_turns — drill chat log (persona ↔ user).
 *
 * One row per turn. Keeps the drill row small and fast; the transcript
 * may grow to hundreds of rows across a 45-minute session. Indexed by
 * drill + turn_index for efficient append + replay.
 *
 * speaker: 'interviewer' | 'candidate' | 'system' | 'coach'
 * hint_tier: null on non-hint turns; 'nudge' | 'guided' | 'full' when coach
 * token_cost: AI tokens consumed on this turn (for cost accounting, §13)
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sdDrillAttempts } from "./sd-drill-attempts";

export const sdDrillInterviewerTurns = pgTable(
  "sd_drill_interviewer_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    drillId: uuid("drill_id")
      .notNull()
      .references(() => sdDrillAttempts.id, { onDelete: "cascade" }),
    stage: integer("stage").notNull(), // 1..5
    turnIndex: integer("turn_index").notNull(), // monotonic per drill
    speaker: varchar("speaker", { length: 20 }).notNull(),
    content: text("content").notNull(),
    hintTier: varchar("hint_tier", { length: 20 }),
    tokenCost: integer("token_cost").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sd_drill_turns_drill_turn_uq").on(t.drillId, t.turnIndex),
  ],
);

export type SDDrillInterviewerTurn = typeof sdDrillInterviewerTurns.$inferSelect;
export type NewSDDrillInterviewerTurn = typeof sdDrillInterviewerTurns.$inferInsert;
```

- [ ] **Step 4: Re-export from schema index**

```typescript
export {
  sdDrillAttempts,
  type SDDrillAttempt,
  type NewSDDrillAttempt,
} from "./sd-drill-attempts";
export {
  sdDrillInterviewerTurns,
  type SDDrillInterviewerTurn,
  type NewSDDrillInterviewerTurn,
} from "./sd-drill-interviewer-turns";
```

- [ ] **Step 5: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm test:run -- sd-drill-attempts.schema sd-drill-interviewer-turns.schema
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-drill-attempts.ts \
        architex/src/db/schema/sd-drill-interviewer-turns.ts \
        architex/src/db/schema/__tests__/sd-drill-attempts.schema.test.ts \
        architex/src/db/schema/__tests__/sd-drill-interviewer-turns.schema.test.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_drill_attempts + sd_drill_interviewer_turns schemas

- sd_drill_attempts: 5-stage mock interview header. Partial unique
  index enforces one-active-drill per user cross-mode. Includes
  persona, company_preset, stage_times map.
- sd_drill_interviewer_turns: chat log separated from the header row
  for scale. Unique (drill_id, turn_index) on append; indexed by
  that pair for efficient replay.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create `sd_shares` + `sd_fsrs_cards` schemas

**Files:**
- Create: `architex/src/db/schema/sd-shares.ts`
- Create: `architex/src/db/schema/sd-fsrs-cards.ts`
- Modify: `architex/src/db/schema/index.ts`

Last two SD tables:
- `sd_shares` unifies public shares across designs, sims, drills (Q41). Each shared resource gets one row with a short public_id used in `/sd/share/{shareId}` URLs, OG image URLs, and access tracking.
- `sd_fsrs_cards` is the per-user FSRS-5 scheduling state. One row per (user, card). Combines with `sd_review_cards` (the card content) to produce the Review-mode due queue.

- [ ] **Step 1: Write the failing tests**

Create `architex/src/db/schema/__tests__/sd-shares.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdShares } from "@/db/schema/sd-shares";

describe("sdShares schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdShares);
    for (const c of [
      "id",
      "ownerUserId",
      "resourceType",
      "resourceId",
      "publicSlug",
      "ogImageUrl",
      "viewCount",
      "revokedAt",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

Create `architex/src/db/schema/__tests__/sd-fsrs-cards.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sdFsrsCards } from "@/db/schema/sd-fsrs-cards";

describe("sdFsrsCards schema", () => {
  it("exports expected columns", () => {
    const cols = Object.keys(sdFsrsCards);
    for (const c of [
      "id",
      "userId",
      "cardSlug",
      "cardType",
      "difficulty",
      "stability",
      "reps",
      "lapses",
      "state",
      "dueAt",
      "lastReviewedAt",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run -- sd-shares.schema sd-fsrs-cards.schema
```

Expected: both FAIL · modules missing.

- [ ] **Step 3: Write the schema files**

Create `architex/src/db/schema/sd-shares.ts`:

```typescript
/**
 * DB-SD-12: sd_shares — unified public share records (Q41).
 *
 * One row per public share across any SD resource type:
 *   - 'design'       → sd_designs.id
 *   - 'simulation'   → sd_simulations.id
 *   - 'drill'        → sd_drill_attempts.id
 *   - 'concept-reflection' → sd_concept_reflections.id (Phase 2)
 *
 * public_slug is a short 8-12 char URL-safe id used in /sd/share/{slug}.
 * og_image_url is pre-rendered and cached by the image pipeline.
 * view_count increments on each uncached load (eventual consistent).
 * revoked_at nulls the share server-side without deleting the row
 * (preserves view history for the owner's dashboard).
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sdShares = pgTable(
  "sd_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceType: varchar("resource_type", { length: 30 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    publicSlug: varchar("public_slug", { length: 20 }).notNull().unique(),
    ogImageUrl: varchar("og_image_url", { length: 500 }),
    viewCount: integer("view_count").notNull().default(0),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sd_shares_owner_idx").on(t.ownerUserId, t.createdAt),
    uniqueIndex("sd_shares_resource_uq").on(t.resourceType, t.resourceId),
  ],
);

export type SDShare = typeof sdShares.$inferSelect;
export type NewSDShare = typeof sdShares.$inferInsert;
```

Create `architex/src/db/schema/sd-fsrs-cards.ts`:

```typescript
/**
 * DB-SD-13: sd_fsrs_cards — per-user FSRS-5 scheduling state.
 *
 * One row per (user, card). card_slug is a denormalized reference into
 * either sd_concepts or sd_problems (we use a slug because cards may
 * outlive the concept they were generated from if content evolves).
 *
 * FSRS-5 fields (difficulty, stability) are per algorithm spec. state
 * is one of 'new' | 'learning' | 'review' | 'relearning'. due_at is
 * indexed for the "what's due today" query.
 *
 * The card content itself (prompt, choices, correct_answer) lives in
 * sd_review_cards — a shared table across users (Phase 2).
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  real,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sdFsrsCards = pgTable(
  "sd_fsrs_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardSlug: varchar("card_slug", { length: 100 }).notNull(),
    cardType: varchar("card_type", { length: 30 }).notNull(), // 'mcq'|'name-primitive'|'diagram-spot'|'cloze'
    difficulty: real("difficulty").notNull(),
    stability: real("stability").notNull(),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    state: varchar("state", { length: 20 }).notNull().default("new"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sd_fsrs_user_card_uq").on(t.userId, t.cardSlug),
    index("sd_fsrs_due_idx").on(t.userId, t.dueAt),
  ],
);

export type SDFsrsCard = typeof sdFsrsCards.$inferSelect;
export type NewSDFsrsCard = typeof sdFsrsCards.$inferInsert;
```

- [ ] **Step 4: Re-export from schema index**

```typescript
export {
  sdShares,
  type SDShare,
  type NewSDShare,
} from "./sd-shares";
export {
  sdFsrsCards,
  type SDFsrsCard,
  type NewSDFsrsCard,
} from "./sd-fsrs-cards";
```

- [ ] **Step 5: Add relations for all 13 SD tables**

Open `architex/src/db/schema/relations.ts`. Add imports at the top:

```typescript
import { sdConcepts } from "./sd-concepts";
import { sdProblems } from "./sd-problems";
import { sdConceptReads } from "./sd-concept-reads";
import { sdConceptBookmarks } from "./sd-concept-bookmarks";
import { sdDesigns } from "./sd-designs";
import { sdDesignSnapshots } from "./sd-design-snapshots";
import { sdDesignAnnotations } from "./sd-design-annotations";
import { sdSimulations } from "./sd-simulations";
import { sdSimulationEvents } from "./sd-simulation-events";
import { sdDrillAttempts } from "./sd-drill-attempts";
import { sdDrillInterviewerTurns } from "./sd-drill-interviewer-turns";
import { sdShares } from "./sd-shares";
import { sdFsrsCards } from "./sd-fsrs-cards";
```

In `usersRelations`, extend the `many` block:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  diagrams: many(diagrams),
  simulationRuns: many(simulationRuns),
  progress: many(progress),
  templates: many(templates),
  gallerySubmissions: many(gallerySubmissions),
  aiUsage: many(aiUsage),
  // ── SD ───────────────────────────────────────────
  sdConceptReads: many(sdConceptReads),
  sdConceptBookmarks: many(sdConceptBookmarks),
  sdDesigns: many(sdDesigns),
  sdSimulations: many(sdSimulations),
  sdDrillAttempts: many(sdDrillAttempts),
  sdShares: many(sdShares),
  sdFsrsCards: many(sdFsrsCards),
}));
```

Append at the bottom of the file:

```typescript
// ── SD Concepts ───────────────────────────────────────────────
export const sdConceptsRelations = relations(sdConcepts, ({ many }) => ({
  reads: many(sdConceptReads),
  bookmarks: many(sdConceptBookmarks),
}));

export const sdConceptReadsRelations = relations(sdConceptReads, ({ one }) => ({
  user: one(users, { fields: [sdConceptReads.userId], references: [users.id] }),
  concept: one(sdConcepts, {
    fields: [sdConceptReads.conceptId],
    references: [sdConcepts.id],
  }),
}));

export const sdConceptBookmarksRelations = relations(
  sdConceptBookmarks,
  ({ one }) => ({
    user: one(users, {
      fields: [sdConceptBookmarks.userId],
      references: [users.id],
    }),
    concept: one(sdConcepts, {
      fields: [sdConceptBookmarks.conceptId],
      references: [sdConcepts.id],
    }),
  }),
);

// ── SD Problems ──────────────────────────────────────────────
export const sdProblemsRelations = relations(sdProblems, () => ({
  // Problems are referenced by slug from drills/designs; no hard FK.
}));

// ── SD Designs ───────────────────────────────────────────────
export const sdDesignsRelations = relations(sdDesigns, ({ one, many }) => ({
  user: one(users, { fields: [sdDesigns.userId], references: [users.id] }),
  snapshots: many(sdDesignSnapshots),
  annotations: many(sdDesignAnnotations),
  simulations: many(sdSimulations),
}));

export const sdDesignSnapshotsRelations = relations(
  sdDesignSnapshots,
  ({ one }) => ({
    design: one(sdDesigns, {
      fields: [sdDesignSnapshots.designId],
      references: [sdDesigns.id],
    }),
    author: one(users, {
      fields: [sdDesignSnapshots.authorUserId],
      references: [users.id],
    }),
  }),
);

export const sdDesignAnnotationsRelations = relations(
  sdDesignAnnotations,
  ({ one }) => ({
    design: one(sdDesigns, {
      fields: [sdDesignAnnotations.designId],
      references: [sdDesigns.id],
    }),
    author: one(users, {
      fields: [sdDesignAnnotations.authorUserId],
      references: [users.id],
    }),
  }),
);

// ── SD Simulations ───────────────────────────────────────────
export const sdSimulationsRelations = relations(
  sdSimulations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [sdSimulations.userId],
      references: [users.id],
    }),
    design: one(sdDesigns, {
      fields: [sdSimulations.designId],
      references: [sdDesigns.id],
    }),
    events: many(sdSimulationEvents),
  }),
);

export const sdSimulationEventsRelations = relations(
  sdSimulationEvents,
  ({ one }) => ({
    simulation: one(sdSimulations, {
      fields: [sdSimulationEvents.simulationId],
      references: [sdSimulations.id],
    }),
  }),
);

// ── SD Drill Attempts ────────────────────────────────────────
export const sdDrillAttemptsRelations = relations(
  sdDrillAttempts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [sdDrillAttempts.userId],
      references: [users.id],
    }),
    turns: many(sdDrillInterviewerTurns),
  }),
);

export const sdDrillInterviewerTurnsRelations = relations(
  sdDrillInterviewerTurns,
  ({ one }) => ({
    drill: one(sdDrillAttempts, {
      fields: [sdDrillInterviewerTurns.drillId],
      references: [sdDrillAttempts.id],
    }),
  }),
);

// ── SD Shares ────────────────────────────────────────────────
export const sdSharesRelations = relations(sdShares, ({ one }) => ({
  owner: one(users, {
    fields: [sdShares.ownerUserId],
    references: [users.id],
  }),
  // resourceId is a polymorphic pointer — no hard FK; resolved in the API layer
}));

// ── SD FSRS ──────────────────────────────────────────────────
export const sdFsrsCardsRelations = relations(sdFsrsCards, ({ one }) => ({
  user: one(users, { fields: [sdFsrsCards.userId], references: [users.id] }),
}));
```

- [ ] **Step 6: Re-export all 13 relation blocks from schema index**

Open `architex/src/db/schema/index.ts` and extend the final `export` block:

```typescript
export {
  usersRelations,
  diagramsRelations,
  simulationRunsRelations,
  progressRelations,
  templatesRelations,
  gallerySubmissionsRelations,
  galleryUpvotesRelations,
  aiUsageRelations,
  // SD relation blocks
  sdConceptsRelations,
  sdConceptReadsRelations,
  sdConceptBookmarksRelations,
  sdProblemsRelations,
  sdDesignsRelations,
  sdDesignSnapshotsRelations,
  sdDesignAnnotationsRelations,
  sdSimulationsRelations,
  sdSimulationEventsRelations,
  sdDrillAttemptsRelations,
  sdDrillInterviewerTurnsRelations,
  sdSharesRelations,
  sdFsrsCardsRelations,
} from "./relations";
```

- [ ] **Step 7: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm test:run -- sd-shares.schema sd-fsrs-cards.schema
```

Expected: all PASS. Typecheck must also pass — it covers the new relations file.

- [ ] **Step 8: Commit**

```bash
git add architex/src/db/schema/sd-shares.ts \
        architex/src/db/schema/sd-fsrs-cards.ts \
        architex/src/db/schema/__tests__/sd-shares.schema.test.ts \
        architex/src/db/schema/__tests__/sd-fsrs-cards.schema.test.ts \
        architex/src/db/schema/relations.ts \
        architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_shares + sd_fsrs_cards schemas and wire all 13 relations

- sd_shares: unified public share table for designs/sims/drills/reflections
  with OG image URL and revocation.
- sd_fsrs_cards: per-user FSRS-5 scheduling state. Unique (user, card_slug)
  and indexed by due_at for "due today" queries.
- Relations file extended with all 13 SD relation blocks + added to
  usersRelations many block.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Generate and apply migration `0002_add_sd_module.sql`

**Files:**
- Generated: `architex/drizzle/0002_add_sd_module.sql`

- [ ] **Step 1: Generate migration**

```bash
cd architex
pnpm db:generate
```

Expected: creates `architex/drizzle/0002_<auto-name>.sql`. Drizzle picks up all 13 new tables in one migration. Rename it to the canonical spec name so humans can find it:

```bash
mv architex/drizzle/0002_<auto-name>.sql architex/drizzle/0002_add_sd_module.sql
# Drizzle also maintains a meta file with the snapshot — keep in sync:
# Update architex/drizzle/meta/_journal.json entry to point at the new tag if present.
```

- [ ] **Step 2: Review the SQL**

Open `architex/drizzle/0002_add_sd_module.sql`. Confirm it includes all 13 `CREATE TABLE` statements (in dependency order):

1. `sd_concepts`
2. `sd_problems`
3. `sd_concept_reads`
4. `sd_concept_bookmarks`
5. `sd_designs`
6. `sd_design_snapshots`
7. `sd_design_annotations`
8. `sd_simulations`
9. `sd_simulation_events`
10. `sd_drill_attempts`
11. `sd_drill_interviewer_turns`
12. `sd_shares`
13. `sd_fsrs_cards`

And all the partial unique indexes:

- `one_active_sim_per_user_design` on sd_simulations
- `one_active_sd_drill_per_user` on sd_drill_attempts
- `sd_designs_public_share_uq` partial
- `sd_simulations_public_share_uq` partial
- `sd_drills_public_share_uq` partial

If any index is missing or wrong, delete the generated file and re-run `pnpm db:generate`. If Drizzle generates the indexes without `WHERE` clauses, you have a schema bug in Tasks 1-7 — fix the offending file and regenerate.

- [ ] **Step 3: Apply migration to dev DB**

```bash
pnpm db:push
```

Expected: migration applies cleanly. If an error mentions "relation users does not exist", confirm your local DB has been seeded with prior migrations (`pnpm db:push` from baseline, or check `drizzle/meta/_journal.json`).

- [ ] **Step 4: Verify tables exist via Drizzle Studio**

```bash
pnpm db:studio
```

Opens at <https://local.drizzle.studio>. Confirm all 13 `sd_*` tables appear in the sidebar. Spot-check `sd_designs` — its columns should match the schema file, and the sidebar should show 0 rows.

- [ ] **Step 5: Sanity-check partial unique index by attempting a violation**

In Drizzle Studio (or `psql`), run:

```sql
-- Insert two designs for the same user sharing a (null) public_slug — should succeed
INSERT INTO sd_designs (user_id, diagram_type, canvas_state)
VALUES ('<user_uuid>', 'system', '{}'::jsonb), ('<user_uuid>', 'system', '{}'::jsonb);
-- Expected: ok (both rows, public_share_id is null, partial index excludes null)

-- Now give them matching public_share_ids — should fail on second insert
UPDATE sd_designs SET public_share_id = 'abc123' WHERE id = '<first-uuid>';
UPDATE sd_designs SET public_share_id = 'abc123' WHERE id = '<second-uuid>';
-- Expected: ERROR: duplicate key value violates unique constraint "sd_designs_public_share_uq"
```

If the second UPDATE succeeds, the partial index is misspelled. Fix the schema file and re-run `pnpm db:generate && pnpm db:push`.

Clean up the test rows:

```sql
DELETE FROM sd_designs WHERE user_id = '<user_uuid>';
```

- [ ] **Step 6: Commit**

```bash
git add architex/drizzle/0002_add_sd_module.sql architex/drizzle/meta/
git commit -m "$(cat <<'EOF'
feat(db): generate and apply 0002_add_sd_module migration

All 13 SD tables + 5 partial unique indexes land in one atomic migration.
Additive-only — no changes to LLD or core tables. Verified against dev
DB via Drizzle Studio and a manual unique-violation smoke test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Extend `ui-store` with `sdMode` + welcome banner slice

**Files:**
- Modify: `architex/src/stores/ui-store.ts`
- Test: `architex/src/stores/__tests__/ui-store.sd.test.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/stores/__tests__/ui-store.sd.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("ui-store · sd slice", () => {
  beforeEach(() => {
    useUIStore.setState({
      sdMode: null,
      sdWelcomeBannerDismissed: false,
      sdOnboardingComplete: false,
    });
  });

  it("has null sdMode by default (first visit)", () => {
    expect(useUIStore.getState().sdMode).toBeNull();
  });

  it("setSDMode updates mode", () => {
    useUIStore.getState().setSDMode("learn");
    expect(useUIStore.getState().sdMode).toBe("learn");
  });

  it("setSDMode persists across calls", () => {
    useUIStore.getState().setSDMode("simulate");
    useUIStore.getState().setSDMode("drill");
    expect(useUIStore.getState().sdMode).toBe("drill");
  });

  it("dismissSDWelcomeBanner sets flag", () => {
    expect(useUIStore.getState().sdWelcomeBannerDismissed).toBe(false);
    useUIStore.getState().dismissSDWelcomeBanner();
    expect(useUIStore.getState().sdWelcomeBannerDismissed).toBe(true);
  });

  it("completeSDOnboarding sets flag", () => {
    useUIStore.getState().completeSDOnboarding();
    expect(useUIStore.getState().sdOnboardingComplete).toBe(true);
  });

  it("accepts all five mode values", () => {
    const modes = ["learn", "build", "simulate", "drill", "review"] as const;
    for (const m of modes) {
      useUIStore.getState().setSDMode(m);
      expect(useUIStore.getState().sdMode).toBe(m);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd architex
pnpm test:run -- ui-store.sd
```

Expected: FAIL with `TypeError: useUIStore.getState().setSDMode is not a function`.

- [ ] **Step 3: Extend the store**

Open `architex/src/stores/ui-store.ts`. Add the type export near the top (under `AnimationSpeed`):

```typescript
export type SDMode = "learn" | "build" | "simulate" | "drill" | "review";
```

In the `UIState` interface, add the new fields alongside the existing LLD slice:

```typescript
  // SD mode state
  sdMode: SDMode | null;              // null = first visit
  sdWelcomeBannerDismissed: boolean;
  sdOnboardingComplete: boolean;      // 90-sec guided tour shown (spec §18.6)

  setSDMode: (mode: SDMode) => void;
  dismissSDWelcomeBanner: () => void;
  completeSDOnboarding: () => void;
```

In the store creator (inside `create<UIState>()((set) => ({` or similar), add initial values and action implementations:

```typescript
      sdMode: null,
      sdWelcomeBannerDismissed: false,
      sdOnboardingComplete: false,

      setSDMode: (mode) => set({ sdMode: mode }),
      dismissSDWelcomeBanner: () => set({ sdWelcomeBannerDismissed: true }),
      completeSDOnboarding: () => set({ sdOnboardingComplete: true }),
```

Extend the `persist` middleware's `partialize` to include the three new fields:

```typescript
      partialize: (state) => ({
        activeModule: state.activeModule,
        recentModules: state.recentModules,
        recentlyStudied: state.recentlyStudied,
        sidebarOpen: state.sidebarOpen,
        propertiesPanelOpen: state.propertiesPanelOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        bottomPanelTab: state.bottomPanelTab,
        theme: state.theme,
        animationSpeed: state.animationSpeed,
        timelineVisible: state.timelineVisible,
        minimapVisible: state.minimapVisible,
        // SD slice
        sdMode: state.sdMode,
        sdWelcomeBannerDismissed: state.sdWelcomeBannerDismissed,
        sdOnboardingComplete: state.sdOnboardingComplete,
      }),
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- ui-store.sd
```

Expected: PASS · all 6 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/stores/ui-store.ts \
        architex/src/stores/__tests__/ui-store.sd.test.ts
git commit -m "$(cat <<'EOF'
feat(stores): add sdMode slice to ui-store

Adds sdMode state + setSDMode action to support 5-mode SD shell
(Learn / Build / Simulate / Drill / Review). Null default = first
visit. Also tracks welcome-banner dismissal and 90-sec onboarding
completion. All three fields persist to localStorage via the
existing persist middleware.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create new `sd-store` with `activeSDDrill` + `activeSDSim` slices

**Files:**
- Create: `architex/src/stores/sd-store.ts`
- Test: `architex/src/stores/__tests__/sd-store.test.ts`

The `sd-store` holds **transient** SD state that should not persist to localStorage (server is the source of truth). Active drill and active simulation rows come from the DB at page load; this store mirrors them for fast UI access and pause/resume accounting.

- [ ] **Step 1: Write the failing test**

Create `architex/src/stores/__tests__/sd-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSDStore } from "@/stores/sd-store";

describe("sd-store · drill + sim slices", () => {
  beforeEach(() => {
    useSDStore.setState({ activeSDDrill: null, activeSDSim: null });
  });

  it("has null activeSDDrill by default", () => {
    expect(useSDStore.getState().activeSDDrill).toBeNull();
  });

  it("has null activeSDSim by default", () => {
    expect(useSDStore.getState().activeSDSim).toBeNull();
  });

  it("startSDDrill creates an active drill record", () => {
    useSDStore
      .getState()
      .startSDDrill({
        id: "drill-1",
        problemSlug: "url-shortener",
        mode: "timed",
        persona: "senior-staff-google",
        companyPreset: "google",
        durationLimitMs: 45 * 60 * 1000,
      });
    const drill = useSDStore.getState().activeSDDrill;
    expect(drill?.id).toBe("drill-1");
    expect(drill?.mode).toBe("timed");
    expect(drill?.currentStage).toBe(1);
    expect(drill?.pausedAt).toBeNull();
  });

  it("advanceStage increments currentStage and records stage time", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    useSDStore.getState().startSDDrill({
      id: "drill-1",
      problemSlug: "url-shortener",
      mode: "timed",
      persona: "s",
      companyPreset: null,
      durationLimitMs: 45 * 60 * 1000,
    });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 + 90_000);
    useSDStore.getState().advanceStage();
    const drill = useSDStore.getState().activeSDDrill;
    expect(drill?.currentStage).toBe(2);
    expect(drill?.stageTimes[1]).toBe(90_000);
    vi.restoreAllMocks();
  });

  it("abandonSDDrill clears the active drill", () => {
    useSDStore.getState().startSDDrill({
      id: "drill-1",
      problemSlug: "x",
      mode: "timed",
      persona: "s",
      companyPreset: null,
      durationLimitMs: 45 * 60 * 1000,
    });
    useSDStore.getState().abandonSDDrill();
    expect(useSDStore.getState().activeSDDrill).toBeNull();
  });

  it("startSDSim creates an active sim record", () => {
    useSDStore.getState().startSDSim({
      id: "sim-1",
      designId: "design-1",
      activity: "stress",
      scaleDau: "1M",
    });
    const sim = useSDStore.getState().activeSDSim;
    expect(sim?.id).toBe("sim-1");
    expect(sim?.activity).toBe("stress");
    expect(sim?.startedAt).toBeGreaterThan(0);
  });

  it("completeSDSim clears the active sim", () => {
    useSDStore.getState().startSDSim({
      id: "sim-1",
      designId: "d1",
      activity: "validate",
      scaleDau: "100k",
    });
    useSDStore.getState().completeSDSim();
    expect(useSDStore.getState().activeSDSim).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- sd-store
```

Expected: FAIL with `Cannot find module '@/stores/sd-store'`.

- [ ] **Step 3: Create the store**

Create `architex/src/stores/sd-store.ts`:

```typescript
import { create } from "zustand";

export type SDDrillMode =
  | "study"
  | "timed"
  | "exam"
  | "pair"
  | "review"
  | "full-stack"
  | "verbal";

export type SDSimActivity =
  | "validate"
  | "stress"
  | "chaos"
  | "compare"
  | "forecast"
  | "archaeology";

export type SDScaleDau = "10k" | "100k" | "1M" | "10M" | "100M" | "1B";

export interface ActiveSDDrill {
  id: string; // sd_drill_attempts.id
  problemSlug: string;
  mode: SDDrillMode;
  persona: string | null;
  companyPreset: string | null;
  startedAt: number; // epoch ms
  pausedAt: number | null;
  currentStage: 1 | 2 | 3 | 4 | 5;
  stageTimes: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
  durationLimitMs: number;
  hintsUsed: Array<{ tier: "nudge" | "guided" | "full"; usedAt: number }>;
}

export interface ActiveSDSim {
  id: string; // sd_simulations.id
  designId: string | null;
  activity: SDSimActivity;
  scaleDau: SDScaleDau;
  startedAt: number; // epoch ms
  simTickMs: number; // sim clock, starts at 0
  pausedAt: number | null;
}

interface SDState {
  activeSDDrill: ActiveSDDrill | null;
  activeSDSim: ActiveSDSim | null;

  // Drill actions
  startSDDrill: (args: {
    id: string;
    problemSlug: string;
    mode: SDDrillMode;
    persona: string | null;
    companyPreset: string | null;
    durationLimitMs: number;
  }) => void;
  advanceStage: () => void;
  pauseSDDrill: () => void;
  resumeSDDrill: () => void;
  submitSDDrill: () => void;
  abandonSDDrill: () => void;
  useSDHint: (tier: "nudge" | "guided" | "full") => void;

  // Sim actions
  startSDSim: (args: {
    id: string;
    designId: string | null;
    activity: SDSimActivity;
    scaleDau: SDScaleDau;
  }) => void;
  tickSDSim: (simTickMs: number) => void;
  pauseSDSim: () => void;
  resumeSDSim: () => void;
  completeSDSim: () => void;
  abandonSDSim: () => void;
}

export const useSDStore = create<SDState>()((set, get) => ({
  activeSDDrill: null,
  activeSDSim: null,

  startSDDrill: ({ id, problemSlug, mode, persona, companyPreset, durationLimitMs }) => {
    set({
      activeSDDrill: {
        id,
        problemSlug,
        mode,
        persona,
        companyPreset,
        startedAt: Date.now(),
        pausedAt: null,
        currentStage: 1,
        stageTimes: {},
        durationLimitMs,
        hintsUsed: [],
      },
    });
  },

  advanceStage: () => {
    const current = get().activeSDDrill;
    if (!current) return;
    const now = Date.now();
    const stageStart = current.startedAt + Object.values(current.stageTimes)
      .reduce((a, b) => a + b, 0);
    const stageElapsed = now - stageStart;
    const nextStage = (current.currentStage + 1) as 1 | 2 | 3 | 4 | 5;
    if (nextStage > 5) return;
    set({
      activeSDDrill: {
        ...current,
        currentStage: nextStage,
        stageTimes: {
          ...current.stageTimes,
          [current.currentStage]: stageElapsed,
        },
      },
    });
  },

  pauseSDDrill: () => {
    const current = get().activeSDDrill;
    if (!current || current.pausedAt !== null) return;
    set({ activeSDDrill: { ...current, pausedAt: Date.now() } });
  },

  resumeSDDrill: () => {
    const current = get().activeSDDrill;
    if (!current || current.pausedAt === null) return;
    set({ activeSDDrill: { ...current, pausedAt: null } });
  },

  submitSDDrill: () => set({ activeSDDrill: null }),
  abandonSDDrill: () => set({ activeSDDrill: null }),

  useSDHint: (tier) => {
    const current = get().activeSDDrill;
    if (!current) return;
    set({
      activeSDDrill: {
        ...current,
        hintsUsed: [...current.hintsUsed, { tier, usedAt: Date.now() }],
      },
    });
  },

  startSDSim: ({ id, designId, activity, scaleDau }) => {
    set({
      activeSDSim: {
        id,
        designId,
        activity,
        scaleDau,
        startedAt: Date.now(),
        simTickMs: 0,
        pausedAt: null,
      },
    });
  },

  tickSDSim: (simTickMs) => {
    const current = get().activeSDSim;
    if (!current) return;
    set({ activeSDSim: { ...current, simTickMs } });
  },

  pauseSDSim: () => {
    const current = get().activeSDSim;
    if (!current || current.pausedAt !== null) return;
    set({ activeSDSim: { ...current, pausedAt: Date.now() } });
  },

  resumeSDSim: () => {
    const current = get().activeSDSim;
    if (!current || current.pausedAt === null) return;
    set({ activeSDSim: { ...current, pausedAt: null } });
  },

  completeSDSim: () => set({ activeSDSim: null }),
  abandonSDSim: () => set({ activeSDSim: null }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- sd-store
```

Expected: PASS · all 7 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/stores/sd-store.ts architex/src/stores/__tests__/sd-store.test.ts
git commit -m "$(cat <<'EOF'
feat(stores): add sd-store with activeSDDrill + activeSDSim slices

Transient store — NOT persisted to localStorage. Server is source of
truth for drill and sim rows; store mirrors them for fast UI access
and pause/resume time accounting.

- activeSDDrill: tracks 5-stage progression with stage_times map,
  pause/resume, hint usage.
- activeSDSim: tracks sim-tick clock, activity, scale, pause/resume.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Create `useSDModeSync` hook (URL ↔ store)

**Files:**
- Create: `architex/src/hooks/useSDModeSync.ts`
- Test: `architex/src/hooks/__tests__/useSDModeSync.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useSDModeSync.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const { replaceMock, searchParamsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsMock: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
}));

import { useSDModeSync } from "@/hooks/useSDModeSync";
import { useUIStore } from "@/stores/ui-store";

describe("useSDModeSync", () => {
  beforeEach(() => {
    useUIStore.setState({ sdMode: null });
    replaceMock.mockClear();
    Array.from(searchParamsMock.keys()).forEach((k) => searchParamsMock.delete(k));
  });

  it("reads mode from URL param on mount", () => {
    searchParamsMock.set("mode", "learn");
    renderHook(() => useSDModeSync());
    expect(useUIStore.getState().sdMode).toBe("learn");
  });

  it("accepts all five modes", () => {
    for (const m of ["learn", "build", "simulate", "drill", "review"] as const) {
      useUIStore.setState({ sdMode: null });
      searchParamsMock.set("mode", m);
      renderHook(() => useSDModeSync());
      expect(useUIStore.getState().sdMode).toBe(m);
    }
  });

  it("ignores invalid mode values", () => {
    searchParamsMock.set("mode", "garbage");
    renderHook(() => useSDModeSync());
    expect(useUIStore.getState().sdMode).toBeNull();
  });

  it("does not overwrite store if URL has no mode param", () => {
    useUIStore.getState().setSDMode("build");
    renderHook(() => useSDModeSync());
    expect(useUIStore.getState().sdMode).toBe("build");
  });

  it("updates URL when store mode changes", () => {
    renderHook(() => useSDModeSync());
    useUIStore.getState().setSDMode("simulate");
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("mode=simulate"),
      expect.objectContaining({ scroll: false }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useSDModeSync
```

Expected: FAIL with `Cannot find module '@/hooks/useSDModeSync'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useSDModeSync.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore, type SDMode } from "@/stores/ui-store";

const VALID_SD_MODES: readonly SDMode[] = [
  "learn",
  "build",
  "simulate",
  "drill",
  "review",
] as const;

function isValidSDMode(value: unknown): value is SDMode {
  return (
    typeof value === "string" &&
    (VALID_SD_MODES as readonly string[]).includes(value)
  );
}

/**
 * Bidirectional sync between the `?mode=` URL query param and
 * `ui-store.sdMode`. Uses `router.replace` (not push) so mode switching
 * does not pollute browser history.
 *
 * Parallel to `useLLDModeSync` but scoped to the SD module.
 */
export function useSDModeSync(): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = useUIStore((s) => s.sdMode);
  const setSDMode = useUIStore((s) => s.setSDMode);

  // URL → store
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (isValidSDMode(urlMode) && urlMode !== mode) {
      setSDMode(urlMode);
    }
    // First-mount URL wins, then store is authoritative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSDMode]);

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
pnpm test:run -- useSDModeSync
```

Expected: PASS · all 5 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useSDModeSync.ts \
        architex/src/hooks/__tests__/useSDModeSync.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add useSDModeSync for URL ↔ store sync

Bidirectional sync between ?mode= and ui-store.sdMode. Accepts all
five modes (learn/build/simulate/drill/review). Uses router.replace
to avoid polluting browser history. Validates mode against allowlist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

