# LLD Phase 4 · Drill Mode — Interview Diamond Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Drill mode into the polished centerpiece of Architex — a realistic, high-fidelity interview simulation that mirrors a real whiteboard round. Ship a 5-stage gated pipeline (Clarify → Rubric → Canvas → Walkthrough → Reflection), a streaming Sonnet-backed interviewer persona system (Amazon / Google / Meta / Stripe / Uber voices), a 3-tier hint ladder (nudge → hint → reveal) with per-tier score penalties, a 6-axis grading engine (Clarification / Classes / Relationships / Pattern Fit / Tradeoffs / Communication) that unifies deterministic structure checks with AI qualitative judging, full post-drill artifacts (rubric breakdown, AI postmortem, canonical compare, timing heatmap, follow-up suggestions), abandon/resume using Phase 1's partial-unique index, three drill-session variants (Exam · Timed Mock · Study), and the complete telemetry surface with one event per stage transition.

**Architecture:** The existing `lld_drill_attempts` table (shipped in Phase 1) is extended with six new JSONB columns — `stages` (progress + timing per stage), `interviewer_turns` (chat log), `hint_log` (tiered hint history + penalties), `rubric_breakdown` (6-axis grade), `postmortem` (AI-authored follow-up), and `variant` (exam/timed-mock/study). A new `src/lib/lld/drill-stages.ts` module owns the gate logic (a stage cannot be "completed" until its gate predicate returns true). A new `src/lib/ai/interviewer-persona.ts` module wraps the Claude client with streaming Sonnet requests and five persona system prompts. A new `src/lib/lld/grading-engine-v2.ts` composes the existing `grading-engine.ts` with Claude qualitative scoring across 6 axes. React-Flow canvas, existing hint-system.ts, and Phase 1's heartbeat + auto-abandon are all reused; we do not reimplement them. The Drill layout stub from Phase 1 becomes a 5-stage stepper shell with the canvas filling Stage 3.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Anthropic SDK (`claude-sonnet-4-20250514` for interviewer + postmortem, `claude-haiku-4-5` for grading), framer-motion 12, Vitest, Testing Library, Playwright. **Note:** this repo pins a non-GA Next.js — consult `node_modules/next/dist/docs/` before touching routing/streaming APIs.

**Prerequisite:** Phases 1–3 merged. This plan assumes `LLDShell`, `DrillModeLayout.tsx` stub, `ui-store.lldMode`, `interview-store.activeDrill`, the `lld_drill_attempts` table, `useLLDDrillSync` heartbeat, and the 6 Phase-1 API routes (`/api/lld/drill-attempts/*`) all exist and ship on `main`. It also assumes the existing `src/lib/lld/grading-engine.ts` (fuzzy-match auto-grader) and `src/lib/ai/hint-system.ts` (3-tier hint engine) are untouched — both are composed with, not replaced.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` sections §6 (Drill mode), §7 (persistence), §12 (AI · A3 Socratic, A7 company-style), §13 (W8 hostile interviewer). Implementation handoff at `docs/superpowers/specs/2026-04-20-lld-implementation-handoff.md` (Phase 3 + 4 checklists, "never intervene mid-drill" rule).

**Open question:** The spec offers three drill-session **variants** (Exam / Timed Mock / Study) that differ in timer behavior, hint availability, and FSRS impact. Phase 4 implements all three as a single `variant` discriminator; UI exposes them in the sub-mode picker. If product pushes back on naming, rename in a later polish pass — the DB column `variant` + enum values stay.

---

## Pre-flight checklist (Phase 4 · ~1-2 hours)

Run before Task 1. These verify upstream phases' invariants still hold.

- [ ] **Verify Phase 1 mode scaffolding merged**

```bash
cd architex
git log --oneline | grep -iE "phase-?1|mode.scaffold" | head -3
```
Expected: at least one commit referencing Phase 1 or `lld_drill_attempts`. If nothing, stop — Phase 1 is not merged and this plan cannot start.

- [ ] **Verify `lld_drill_attempts` table exists**

```bash
cd architex
pnpm drizzle-kit introspect:pg 2>&1 | grep lld_drill_attempts || psql "$DATABASE_URL" -c "\d lld_drill_attempts" | head -5
```
Expected: table definition printed with columns including `canvas_state`, `hints_used`, `grade_breakdown`. If empty, run `pnpm db:push` to apply Phase 1 migration.

- [ ] **Verify `DrillModeLayout.tsx` stub exists**

```bash
ls architex/src/components/modules/lld/modes/DrillModeLayout.tsx
```
Expected: file exists with `"use client"` banner and a minimal stub component exporting `DrillModeLayout`. If missing, Phase 1 not merged — stop.

- [ ] **Verify `useLLDDrillSync` hook exists and tests pass**

```bash
cd architex
pnpm test:run -- useLLDDrillSync
```
Expected: all heartbeat tests pass (3 assertions from Phase 1 Task 7).

- [ ] **Verify existing grading engine untouched**

```bash
grep -c "export function gradeSubmission" architex/src/lib/lld/grading-engine.ts
```
Expected: `1`. If zero, someone renamed the public API — stop and investigate before composing on top of it.

- [ ] **Verify Anthropic key is configured OR fallback acceptable**

```bash
grep -c ANTHROPIC_API_KEY architex/.env.local || echo "no key — fallback-only mode"
```
Expected: either a non-zero count (key present; full AI test coverage) or the "no key" string (plan still works; AI tests use mocks only; server-side grading falls back to deterministic-only).

- [ ] **Baseline test suite passes**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 4. Do not entangle Phase 4 work with pre-existing failures.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "fix: pre-flight verification for Phase 4"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                      # (generated migrations)
│   ├── NNNN_extend_lld_drill_attempts.sql                        # NEW (Task 1)
│   └── NNNN_lld_drill_interviewer_turns.sql                      # NEW (Task 3)
├── src/
│   ├── db/schema/
│   │   ├── lld-drill-attempts.ts                                 # MODIFY (+ 6 columns)
│   │   └── lld-drill-interviewer-turns.ts                        # NEW (chat log table)
│   ├── lib/lld/
│   │   ├── drill-stages.ts                                       # NEW (5-stage FSM)
│   │   ├── drill-variants.ts                                     # NEW (exam/mock/study)
│   │   ├── grading-engine-v2.ts                                  # NEW (6-axis composer)
│   │   ├── drill-rubric.ts                                       # NEW (rubric definitions)
│   │   ├── drill-canonical.ts                                    # NEW (reference solutions)
│   │   ├── drill-timing.ts                                       # NEW (heatmap analysis)
│   │   └── __tests__/
│   │       ├── drill-stages.test.ts                              # NEW
│   │       ├── grading-engine-v2.test.ts                         # NEW
│   │       └── drill-timing.test.ts                              # NEW
│   ├── lib/ai/
│   │   ├── interviewer-persona.ts                                # NEW (5 personas + streaming)
│   │   ├── interviewer-prompts.ts                                # NEW (system-prompt bank)
│   │   ├── postmortem-generator.ts                               # NEW (post-drill Sonnet report)
│   │   └── __tests__/
│   │       ├── interviewer-persona.test.ts                       # NEW
│   │       └── postmortem-generator.test.ts                      # NEW
│   ├── lib/analytics/
│   │   └── lld-events.ts                                         # MODIFY (+ 12 drill events)
│   ├── stores/
│   │   ├── drill-store.ts                                        # NEW (stage + variant slice)
│   │   └── __tests__/
│   │       └── drill-store.test.ts                               # NEW
│   ├── hooks/
│   │   ├── useDrillStage.ts                                      # NEW (gate + transition)
│   │   ├── useDrillInterviewer.ts                                # NEW (streaming chat)
│   │   ├── useDrillHintLadder.ts                                 # NEW (nudge/hint/reveal)
│   │   ├── useDrillTimingHeatmap.ts                              # NEW (stage-duration analysis)
│   │   └── __tests__/
│   │       ├── useDrillStage.test.tsx                            # NEW
│   │       └── useDrillHintLadder.test.tsx                       # NEW
│   ├── app/api/lld/
│   │   ├── drill-attempts/
│   │   │   ├── [id]/
│   │   │   │   ├── stage/route.ts                                # NEW (PATCH advance stage)
│   │   │   │   ├── hint/route.ts                                 # NEW (POST consume hint)
│   │   │   │   ├── grade/route.ts                                # NEW (POST 6-axis grade)
│   │   │   │   ├── postmortem/route.ts                           # NEW (POST Sonnet report)
│   │   │   │   └── resume/route.ts                               # NEW (POST resume flow)
│   │   │   └── [id]/route.ts                                     # MODIFY (support stage PATCH)
│   │   └── drill-interviewer/
│   │       └── [id]/stream/route.ts                              # NEW (Sonnet SSE endpoint)
│   └── components/modules/lld/drill/
│       ├── DrillModeLayout.tsx                                   # MODIFY (fill in Phase 1 stub)
│       ├── DrillStageStepper.tsx                                 # NEW (5-node progress indicator)
│       ├── stages/
│       │   ├── ClarifyStage.tsx                                  # NEW (Stage 1 · questions)
│       │   ├── RubricStage.tsx                                   # NEW (Stage 2 · scope lock)
│       │   ├── CanvasStage.tsx                                   # NEW (Stage 3 · UML build)
│       │   ├── WalkthroughStage.tsx                              # NEW (Stage 4 · narration)
│       │   └── ReflectionStage.tsx                               # NEW (Stage 5 · self-grade)
│       ├── DrillVariantPicker.tsx                                # NEW (exam/mock/study)
│       ├── DrillInterviewerPanel.tsx                             # NEW (chat UI, streaming)
│       ├── DrillHintLadder.tsx                                   # NEW (3-tier penalty UI)
│       ├── DrillTimer.tsx                                        # NEW (countdown + heartbeat pulse)
│       ├── DrillSubmitBar.tsx                                    # NEW (submit/abandon/pause)
│       ├── DrillResumePrompt.tsx                                 # NEW (on return)
│       ├── DrillGradeReveal.tsx                                  # NEW (tiered celebration)
│       ├── DrillRubricBreakdown.tsx                              # NEW (6-axis radar + deltas)
│       ├── DrillPostmortem.tsx                                   # NEW (AI report render)
│       ├── DrillCanonicalCompare.tsx                             # NEW (side-by-side diff)
│       ├── DrillTimingHeatmap.tsx                                # NEW (stage-duration bars)
│       └── DrillFollowUpCard.tsx                                 # NEW (suggested next actions)
```

**Design rationale for splits:**
- Stage files split 1:1 per stage so each can evolve independently; gate logic centralized in `drill-stages.ts`.
- The interviewer is its own module (not a prop on some existing chat component) because streaming + persona + telemetry all need to be colocated. Persona prompts live in `interviewer-prompts.ts` so they can be tuned without touching the streaming infra.
- `grading-engine-v2.ts` composes (does not replace) the existing `grading-engine.ts`. Existing fuzzy-match remains the single source of truth for deterministic structure checks; v2 adds the 3 qualitative axes via Haiku.
- Post-drill artifacts each get their own component so Phase 5 (Architect's Studio) can restyle them in isolation.
- API routes follow the nested `[id]/action` convention from the existing drill-attempts shape rather than inventing a new top-level namespace.

---

## Table of contents · 28 tasks

1. **Task 1** — Extend `lld_drill_attempts` schema with six new columns (stages, hint_log, rubric_breakdown, postmortem, variant, started_stage_at)
2. **Task 2** — Generate and apply the migration
3. **Task 3** — Create `lld_drill_interviewer_turns` table for the chat log
4. **Task 4** — Generate and apply interviewer-turns migration
5. **Task 5** — Author `drill-stages.ts` — 5-stage FSM with gate predicates
6. **Task 6** — Author `drill-variants.ts` — exam / timed-mock / study config
7. **Task 7** — Author `drill-rubric.ts` — 6-axis rubric definitions + weight math
8. **Task 8** — Author `drill-canonical.ts` — reference solutions per problem
9. **Task 9** — Author `drill-timing.ts` — stage-duration heatmap + outlier detection
10. **Task 10** — Author `interviewer-prompts.ts` — 5 persona system prompts
11. **Task 11** — Author `interviewer-persona.ts` — streaming Sonnet wrapper
12. **Task 12** — Author `postmortem-generator.ts` — Sonnet report writer
13. **Task 13** — Author `grading-engine-v2.ts` — deterministic + Haiku composer
14. **Task 14** — Add 12 new events to `lld-events.ts` analytics catalog
15. **Task 15** — Create `drill-store.ts` Zustand slice
16. **Task 16** — Create `useDrillStage` hook — gate + transition
17. **Task 17** — Create `useDrillInterviewer` hook — streaming chat consumer
18. **Task 18** — Create `useDrillHintLadder` hook — 3-tier penalty tracker
19. **Task 19** — Create `useDrillTimingHeatmap` hook — per-stage duration
20. **Task 20** — API: `PATCH /api/lld/drill-attempts/[id]/stage`
21. **Task 21** — API: `POST /api/lld/drill-attempts/[id]/hint`
22. **Task 22** — API: `POST /api/lld/drill-attempts/[id]/grade`
23. **Task 23** — API: `POST /api/lld/drill-attempts/[id]/postmortem`
24. **Task 24** — API: `POST /api/lld/drill-attempts/[id]/resume`
25. **Task 25** — API: `GET /api/lld/drill-interviewer/[id]/stream` (SSE)
26. **Task 26** — Fill in `DrillModeLayout.tsx` with stage stepper + 5 stage screens
27. **Task 27** — Post-drill artifacts components (grade reveal, rubric, postmortem, canonical compare, timing heatmap, follow-up card)
28. **Task 28** — End-to-end verification + Playwright smoke test

Each task commits 1-3 times. Tasks 5-13 are pure library code (fast, testable). Tasks 15-19 are hooks. Tasks 20-25 are API routes. Tasks 26-27 are the UI surface. Task 28 is the green-light gate before Wave 3 rollout.

---

## Task 1: Extend `lld_drill_attempts` schema with stage + rubric columns

**Files:**
- Modify: `architex/src/db/schema/lld-drill-attempts.ts`

Phase 1 created the base table. Phase 4 adds six new columns without touching existing ones.

- [ ] **Step 1: Open the existing schema file**

Open `architex/src/db/schema/lld-drill-attempts.ts`. The file currently has columns `id`, `userId`, `problemId`, `drillMode`, six timestamps, `elapsedBeforePauseMs`, `durationLimitMs`, `canvasState`, `hintsUsed`, `gradeScore`, `gradeBreakdown`. We add six more.

- [ ] **Step 2: Extend the table definition**

Replace the `pgTable` body so it includes the new columns. The file becomes:

```typescript
/**
 * DB-014: LLD drill attempts — stores active and completed drill attempts.
 *
 * Phase 4 additions:
 *   - variant           — "exam" | "timed-mock" | "study"
 *   - stages            — per-stage progress + timing (JSONB)
 *   - current_stage     — "clarify" | "rubric" | "canvas" | "walkthrough" | "reflection"
 *   - started_stage_at  — timestamp of current stage entry (for timing heatmap)
 *   - hint_log          — hint consumption log with tier + penalty (JSONB)
 *   - rubric_breakdown  — 6-axis grade output (JSONB)
 *   - postmortem        — AI-authored post-drill report (JSONB)
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
      .default("interview"),

    // Phase 4 · session variant
    variant: varchar("variant", { length: 20 }).notNull().default("timed-mock"),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),

    // Phase 4 · stage tracking
    currentStage: varchar("current_stage", { length: 20 })
      .notNull()
      .default("clarify"),
    startedStageAt: timestamp("started_stage_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    stages: jsonb("stages").notNull().default(sql`'{}'::jsonb`),

    elapsedBeforePauseMs: integer("elapsed_before_pause_ms")
      .notNull()
      .default(0),
    durationLimitMs: integer("duration_limit_ms").notNull(),

    canvasState: jsonb("canvas_state"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),

    // Phase 4 · rich hint log (supersedes hintsUsed for drill mode;
    // we keep hintsUsed for backward compat with Phase 3 drill attempts)
    hintLog: jsonb("hint_log").notNull().default(sql`'[]'::jsonb`),

    gradeScore: real("grade_score"),
    gradeBreakdown: jsonb("grade_breakdown"),

    // Phase 4 · 6-axis grade + AI postmortem
    rubricBreakdown: jsonb("rubric_breakdown"),
    postmortem: jsonb("postmortem"),
  },
  (t) => [
    uniqueIndex("one_active_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("drill_history_idx").on(t.userId, t.submittedAt),
    index("drill_stage_idx").on(t.userId, t.currentStage),
  ],
);

export type LLDDrillAttempt = typeof lldDrillAttempts.$inferSelect;
export type NewLLDDrillAttempt = typeof lldDrillAttempts.$inferInsert;

// Phase 4 · shared stage/variant types re-exported for consumers
export type DrillStage =
  | "clarify"
  | "rubric"
  | "canvas"
  | "walkthrough"
  | "reflection";

export type DrillVariant = "exam" | "timed-mock" | "study";
```

- [ ] **Step 3: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: zero errors. If the `users` import fails, confirm the schema index hasn't been reorganized.

- [ ] **Step 4: Commit**

```bash
git add architex/src/db/schema/lld-drill-attempts.ts
git commit -m "$(cat <<'EOF'
feat(db): extend lld_drill_attempts with stage + rubric columns

Adds variant, currentStage, startedStageAt, stages JSONB, hintLog JSONB,
rubricBreakdown JSONB, postmortem JSONB. Phase 1 columns untouched.
New composite index on (user_id, current_stage) for abandoned-drill
stage distribution queries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Generate and apply extend migration

**Files:**
- Generated: `architex/drizzle/NNNN_extend_lld_drill_attempts.sql`

- [ ] **Step 1: Generate migration**

```bash
cd architex
pnpm db:generate
```
Expected: a new SQL file in `architex/drizzle/` containing `ALTER TABLE "lld_drill_attempts" ADD COLUMN ...` for each of the six new columns plus `CREATE INDEX "drill_stage_idx"`. The filename has an auto-incremented prefix.

- [ ] **Step 2: Review the SQL**

Open the generated file. Confirm it includes:
- `ADD COLUMN "variant" varchar(20) DEFAULT 'timed-mock' NOT NULL`
- `ADD COLUMN "current_stage" varchar(20) DEFAULT 'clarify' NOT NULL`
- `ADD COLUMN "started_stage_at" timestamp with time zone DEFAULT now() NOT NULL`
- `ADD COLUMN "stages" jsonb DEFAULT '{}' NOT NULL`
- `ADD COLUMN "hint_log" jsonb DEFAULT '[]' NOT NULL`
- `ADD COLUMN "rubric_breakdown" jsonb`
- `ADD COLUMN "postmortem" jsonb`
- `CREATE INDEX "drill_stage_idx" ON ...`

If anything is missing, delete the file and re-run `pnpm db:generate` (Drizzle re-reads schema).

- [ ] **Step 3: Apply migration to dev DB**

```bash
pnpm db:push
```
Expected: migration applies cleanly. If the table has existing rows from Phase 1-3 testing, the DEFAULT on the new NOT NULL columns populates them safely.

- [ ] **Step 4: Verify via Drizzle Studio**

```bash
pnpm db:studio
```
Open `lld_drill_attempts` · confirm the six new columns render with their defaults. Close the studio.

- [ ] **Step 5: Commit**

```bash
git add architex/drizzle/
git commit -m "$(cat <<'EOF'
feat(db): generate + apply lld_drill_attempts extend migration

Six new columns + drill_stage_idx composite index. All NOT NULL columns
have DEFAULT so existing rows migrate without data intervention.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `lld_drill_interviewer_turns` table

**Files:**
- Create: `architex/src/db/schema/lld-drill-interviewer-turns.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

A second table stores the chat log. We use a dedicated table (not a JSONB column) because turns can be long, we want index-backed pagination for long sessions, and `ON DELETE CASCADE` from drill-attempts gives us free cleanup.

- [ ] **Step 1: Create the schema**

Create `architex/src/db/schema/lld-drill-interviewer-turns.ts`:

```typescript
/**
 * DB-015: LLD drill interviewer turns — the chat log between the user
 * and the Claude-backed interviewer persona.
 *
 * Cascade-deletes when the parent drill attempt is deleted.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { lldDrillAttempts } from "./lld-drill-attempts";

export const lldDrillInterviewerTurns = pgTable(
  "lld_drill_interviewer_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => lldDrillAttempts.id, { onDelete: "cascade" }),

    // "user" | "interviewer" | "system"
    role: varchar("role", { length: 20 }).notNull(),

    // "clarify" | "rubric" | "canvas" | "walkthrough" | "reflection"
    stage: varchar("stage", { length: 20 }).notNull(),

    // "generic" | "amazon" | "google" | "meta" | "stripe" | "uber"
    persona: varchar("persona", { length: 20 }).notNull().default("generic"),

    // Sequential index within the attempt — starts at 0.
    seq: integer("seq").notNull(),

    content: text("content").notNull(),

    // Optional metadata — token counts, model, latency, cost
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("drill_turn_attempt_seq_idx").on(t.attemptId, t.seq),
  ],
);

export type LLDDrillInterviewerTurn =
  typeof lldDrillInterviewerTurns.$inferSelect;
export type NewLLDDrillInterviewerTurn =
  typeof lldDrillInterviewerTurns.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts`. Add the export near the other `lld-*` exports (alphabetical):

```typescript
export * from "./lld-drill-interviewer-turns";
```

- [ ] **Step 3: Add relations**

Open `architex/src/db/schema/relations.ts`. Extend `lldDrillAttemptsRelations` to include the new one-to-many, and add a new relations block at the bottom:

```typescript
// Add lldDrillInterviewerTurns to the imports at top

// Replace lldDrillAttemptsRelations with:
export const lldDrillAttemptsRelations = relations(
  lldDrillAttempts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [lldDrillAttempts.userId],
      references: [users.id],
    }),
    interviewerTurns: many(lldDrillInterviewerTurns),
  }),
);

// At bottom of file:
export const lldDrillInterviewerTurnsRelations = relations(
  lldDrillInterviewerTurns,
  ({ one }) => ({
    attempt: one(lldDrillAttempts, {
      fields: [lldDrillInterviewerTurns.attemptId],
      references: [lldDrillAttempts.id],
    }),
  }),
);
```

- [ ] **Step 4: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-drill-interviewer-turns.ts \
        architex/src/db/schema/index.ts \
        architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_drill_interviewer_turns table

Chat log for drill interviewer persona. One row per turn. Cascade-delete
when parent attempt is removed. Composite index (attempt_id, seq) for
ordered playback.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Generate + apply interviewer-turns migration

**Files:**
- Generated: `architex/drizzle/NNNN_lld_drill_interviewer_turns.sql`

- [ ] **Step 1: Generate migration**

```bash
cd architex
pnpm db:generate
```
Expected: new SQL file with `CREATE TABLE "lld_drill_interviewer_turns"` including FK to `lld_drill_attempts(id)` with `ON DELETE CASCADE` and the `drill_turn_attempt_seq_idx` index.

- [ ] **Step 2: Review the SQL**

Confirm the FK reference uses `ON DELETE CASCADE`. Confirm the index is created.

- [ ] **Step 3: Apply**

```bash
pnpm db:push
```
Expected: clean apply, no warnings.

- [ ] **Step 4: Verify via Drizzle Studio**

```bash
pnpm db:studio
```
Confirm `lld_drill_interviewer_turns` appears. Close the studio.

- [ ] **Step 5: Commit**

```bash
git add architex/drizzle/
git commit -m "$(cat <<'EOF'
feat(db): generate + apply lld_drill_interviewer_turns migration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

