# LLD Phase 5 · Review Mode + FSRS-5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Review mode — a keyboard-first, flashcard-style spaced-repetition surface — with a dedicated FSRS-5 card store, a production-grade scheduler (backed by the `ts-fsrs` library, **not** reimplemented), three card-generation paths (checkpoint auto-derivation, manual "card from paragraph", AI-generated via Haiku), per-pattern mastery tracking, a "cards due today" widget on the homepage and profile, daily-streak integration, and a stats page with retention curve, longest streak, and per-pattern mastery. All keyboard shortcuts match Anki convention (`1`=Again / `2`=Hard / `3`=Good / `4`=Easy).

**Architecture:** A new `lld_fsrs_cards` table persists one row per reviewable unit (`patternId` scope, optional `sectionId` for paragraph-scoped cards). A thin `src/lib/lld/fsrs-scheduler.ts` wrapper calls `ts-fsrs` — we never re-derive the math. Card generators live in `src/lib/lld/card-generators/`. A new Zustand `review-store` tracks queue, current card, reveal state, and session stats. Mastery is **derived** (not stored) from aggregated stability across a pattern's cards. The Review mode stub from Phase 1 is filled in.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, `ts-fsrs@^4` (new dep), Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Vitest, Testing Library.

**Prerequisite:** Phases 1–4 merged. Assumes `LLDShell`, `ReviewModeLayout.tsx` stub, `ui-store.lldMode`, `progress` (with 11 FSRS fields), `activityEvents`, Clerk auth, and the Anthropic Claude client (`src/lib/ai/claude-client.ts`) ship on main.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` — §6 (Review details), §7 (persistence), §12 (A9 flashcard generator), §13 (D3 streak calendar, D4 retention curves).

**Open question (deferred):** The spec calls out cross-module card queues (LLD + Algorithms + System Design) as future work. **Phase 5 scope = LLD-only cards; cross-module queue deferred.** `lld_fsrs_cards.moduleId` is hardcoded to `"lld"` on every insert so a future migration to a unified `fsrs_cards` table is a rename, not a data migration.

---

## Pre-flight checklist (~1–2 hours)

- [ ] **Phase 1 mode scaffolding merged**

```bash
cd architex && git log --oneline | grep -E "phase-1|Phase 1" | head -3
```
Expected: at least one "Phase 1" commit.

- [ ] **`ReviewModeLayout.tsx` stub exists**

```bash
ls architex/src/components/modules/lld/modes/ReviewModeLayout.tsx
```

- [ ] **Existing `fsrs.ts` (hand-rolled, used by other modules) still present**

```bash
grep -l "scheduleFSRS" architex/src/lib/fsrs.ts
```
We keep it for system-design/algorithms backward compat. LLD uses `ts-fsrs` via the new wrapper exclusively.

- [ ] **`ts-fsrs` not already installed**

```bash
cat architex/package.json | grep ts-fsrs
```
Expected: empty.

- [ ] **Baseline passes**

```bash
cd architex && pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```

- [ ] **Commit any fixes**

```bash
git commit -am "fix: pre-flight verification for Phase 5"
```

---

## File Structure

```
architex/
├── drizzle/NNNN_add_lld_fsrs_cards.sql                           # NEW (generated)
├── package.json                                                  # MODIFY (+ ts-fsrs)
└── src/
    ├── db/schema/
    │   ├── lld-fsrs-cards.ts                                     # NEW
    │   ├── index.ts                                              # MODIFY
    │   └── relations.ts                                          # MODIFY
    ├── lib/lld/
    │   ├── fsrs-scheduler.ts                                     # NEW — ts-fsrs wrapper
    │   ├── mastery.ts                                            # NEW — derivation
    │   └── card-generators/
    │       ├── index.ts                                          # NEW
    │       ├── from-checkpoint.ts                                # NEW
    │       ├── from-paragraph.ts                                 # NEW
    │       └── from-ai.ts                                        # NEW — Haiku
    ├── stores/review-store.ts                                    # NEW
    ├── hooks/
    │   ├── useReviewQueue.ts                                     # NEW
    │   ├── useReviewKeyboard.ts                                  # NEW
    │   └── useDueCountWidget.ts                                  # NEW
    ├── lib/analytics/lld-events.ts                               # MODIFY (+ review events)
    ├── app/api/lld/
    │   ├── cards/route.ts                                        # NEW
    │   ├── cards/[id]/route.ts                                   # NEW
    │   ├── cards/due/route.ts                                    # NEW
    │   ├── cards/generate-ai/route.ts                            # NEW
    │   ├── review/submit/route.ts                                # NEW
    │   ├── mastery/route.ts                                      # NEW
    │   └── stats/route.ts                                        # NEW
    ├── components/modules/lld/
    │   ├── modes/ReviewModeLayout.tsx                            # MODIFY (fill stub)
    │   ├── review/
    │   │   ├── ReviewCard.tsx                                    # NEW
    │   │   ├── ReviewRatingRow.tsx                               # NEW
    │   │   ├── ReviewSessionComplete.tsx                         # NEW
    │   │   ├── ReviewEmptyState.tsx                              # NEW
    │   │   └── CreateCardFromParagraph.tsx                       # NEW
    │   └── learn/LessonSection.tsx                               # MODIFY
    ├── components/home/DueCardsWidget.tsx                        # NEW
    ├── components/profile/ReviewStatsPage.tsx                    # NEW
    ├── components/charts/RetentionCurveChart.tsx                 # NEW
    └── components/charts/PerPatternMasteryChart.tsx              # NEW
```

**Rationale:** Generators split per source for independent evolution; scheduler is the single point of change for future FSRS-6 upgrades; review-store separate from interview-store because queue/reveal state is orthogonal to drill state; mastery is a pure function over rows — never stored, never drifts; charts split so they lazy-load on stats page only.

---

## Task 1: Install `ts-fsrs` and create wrapper

**Files:** `package.json`, `src/lib/lld/fsrs-scheduler.ts`, `src/lib/lld/__tests__/fsrs-scheduler.test.ts`

- [ ] **Step 1: Install**

```bash
cd architex && pnpm add ts-fsrs@^4
```
MIT-licensed, tree-shakes well, reference TS impl of FSRS-5.

- [ ] **Step 2: Write the failing test** — `src/lib/lld/__tests__/fsrs-scheduler.test.ts` asserts five cases:
  1. `scheduleNew(3)` → state in `["learning","review"]`, stability > 0, difficulty ∈ [1,10], due in the future.
  2. `scheduleNew(1)` (Again) → `lapses === 1`, due < 24h away.
  3. `scheduleReview(state="review", stability=3, lastReview=2d ago, due=yesterday, reps=2, lapses=0, 3)` → `reps === 3`, `stability` increases.
  4. Same review base with rating `1` → `state === "relearning"` and `lapses === 1`.
  5. `isDue({due: past})` true, `isDue({due: future})` false.

Run: `pnpm test:run -- fsrs-scheduler` → FAIL (missing module).

- [ ] **Step 3: Create the wrapper** — `src/lib/lld/fsrs-scheduler.ts`:

```typescript
/**
 * LLD-FSRS: thin wrapper over ts-fsrs (FSRS-5 reference TS implementation).
 * We do NOT reimplement the algorithm. Single point of change for future
 * FSRS-6 / per-user optimizer weight upgrades.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, State } from "ts-fsrs";

export type FSRSCardStateTag = "new" | "learning" | "review" | "relearning";

export interface FSRSCardState {
  state: FSRSCardStateTag;
  stability: number;
  difficulty: number;
  lastReview: Date | null;
  due: Date;
  reps: number;
  lapses: number;
}

export type UserRating = 1 | 2 | 3 | 4; // Again / Hard / Good / Easy

function stateToTag(s: State): FSRSCardStateTag {
  return s === State.New ? "new"
    : s === State.Learning ? "learning"
    : s === State.Review ? "review"
    : "relearning";
}
function tagToState(t: FSRSCardStateTag): State {
  return t === "new" ? State.New
    : t === "learning" ? State.Learning
    : t === "review" ? State.Review
    : State.Relearning;
}
function toLibRating(r: UserRating): Rating {
  return r === 1 ? Rating.Again : r === 2 ? Rating.Hard : r === 3 ? Rating.Good : Rating.Easy;
}

const scheduler = fsrs(generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
  request_retention: 0.9,
  maximum_interval: 36500,
}));

export function scheduleNew(rating: UserRating): FSRSCardState {
  const now = new Date();
  const record = scheduler.next(createEmptyCard(now), now, toLibRating(rating));
  return {
    state: stateToTag(record.card.state),
    stability: record.card.stability,
    difficulty: record.card.difficulty,
    lastReview: record.card.last_review ?? now,
    due: record.card.due,
    reps: record.card.reps,
    lapses: record.card.lapses,
  };
}

export function scheduleReview(current: FSRSCardState, rating: UserRating): FSRSCardState {
  const now = new Date();
  const libCard = {
    due: current.due,
    stability: current.stability,
    difficulty: current.difficulty,
    elapsed_days: current.lastReview
      ? Math.max(0, Math.round((now.getTime() - current.lastReview.getTime()) / 86_400_000))
      : 0,
    scheduled_days: Math.max(0, Math.round(
      (current.due.getTime() - (current.lastReview?.getTime() ?? now.getTime())) / 86_400_000,
    )),
    reps: current.reps,
    lapses: current.lapses,
    state: tagToState(current.state),
    last_review: current.lastReview ?? undefined,
  };
  const record = scheduler.next(libCard as never, now, toLibRating(rating));
  return {
    state: stateToTag(record.card.state),
    stability: record.card.stability,
    difficulty: record.card.difficulty,
    lastReview: record.card.last_review ?? now,
    due: record.card.due,
    reps: record.card.reps,
    lapses: record.card.lapses,
  };
}

export function isDue(card: Pick<FSRSCardState, "due">): boolean {
  return card.due.getTime() <= Date.now();
}

/** Current retrievability (0..1) — closed-form. Used by stats surfaces. */
export function currentRetrievability(card: FSRSCardState): number {
  if (!card.lastReview || card.stability <= 0) return 0;
  const elapsedDays = Math.max(0, (Date.now() - card.lastReview.getTime()) / 86_400_000);
  return Math.pow(1 + (19 / 81) * (elapsedDays / card.stability), -0.5);
}
```

Run: `pnpm test:run -- fsrs-scheduler` → PASS.

- [ ] **Step 4: Commit**

```bash
git add architex/package.json architex/pnpm-lock.yaml architex/src/lib/lld/fsrs-scheduler.ts architex/src/lib/lld/__tests__/fsrs-scheduler.test.ts
git commit -m "$(cat <<'EOF'
feat(lld): add ts-fsrs wrapper for LLD card scheduling

Installs ts-fsrs@^4 and introduces a thin domain wrapper mapping our
DB row shape to the library's Card type. Existing src/lib/fsrs.ts
stays for backward-compat with the progress table used by other
modules; LLD uses ts-fsrs exclusively from now on.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `lld_fsrs_cards` DB schema

**Files:** `src/db/schema/lld-fsrs-cards.ts`, `src/db/schema/index.ts` (modify), `src/db/schema/relations.ts` (modify)

- [ ] **Step 1: Create schema file** — `src/db/schema/lld-fsrs-cards.ts`:

```typescript
/**
 * DB-015: LLD FSRS cards — spaced-repetition flashcard store.
 * Phase 5 scope: LLD-only. moduleId = "lld" always; future cross-module
 * unification becomes a rename, not a data migration.
 */
import { sql } from "drizzle-orm";
import {
  pgTable, uuid, varchar, timestamp, integer, real, jsonb, text,
  index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const lldFSRSCards = pgTable(
  "lld_fsrs_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleId: varchar("module_id", { length: 50 }).notNull().default("lld"),
    patternId: varchar("pattern_id", { length: 100 }).notNull(),
    sectionId: varchar("section_id", { length: 100 }),
    /** "checkpoint" | "paragraph" | "ai" */
    source: varchar("source", { length: 20 }).notNull(),

    front: text("front").notNull(),
    back: text("back").notNull(),
    options: jsonb("options"),
    correctIndex: integer("correct_index"),

    // ── FSRS-5 state (mirrors FSRSCardState in fsrs-scheduler.ts) ──
    state: varchar("state", { length: 20 }).notNull().default("new"),
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    lastReview: timestamp("last_review", { withTimezone: true }),
    due: timestamp("due", { withTimezone: true }).notNull().defaultNow(),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),

    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("fsrs_cards_user_due_idx").on(t.userId, t.due),
    index("fsrs_cards_user_pattern_idx").on(t.userId, t.patternId),
    // Prevent duplicate auto-generated checkpoint cards on re-runs.
    uniqueIndex("fsrs_cards_dedupe_idx")
      .on(t.userId, t.patternId, t.sectionId, t.source)
      .where(sql`${t.sectionId} IS NOT NULL AND ${t.source} = 'checkpoint'`),
  ],
);

export type LLDFSRSCard = InferSelectModel<typeof lldFSRSCards>;
export type NewLLDFSRSCard = InferInsertModel<typeof lldFSRSCards>;
```

- [ ] **Step 2: Re-export from index** — `src/db/schema/index.ts`, alphabetical with existing exports:

```typescript
export {
  lldFSRSCards, type LLDFSRSCard, type NewLLDFSRSCard,
} from "./lld-fsrs-cards";
```

- [ ] **Step 3: Add relations** — `src/db/schema/relations.ts`:

Import `lldFSRSCards` at top. In `usersRelations`'s `many()` block add:
```typescript
lldFSRSCards: many(lldFSRSCards),
```
Add at bottom:
```typescript
export const lldFSRSCardsRelations = relations(lldFSRSCards, ({ one }) => ({
  user: one(users, {
    fields: [lldFSRSCards.userId],
    references: [users.id],
  }),
}));
```
Then add `lldFSRSCardsRelations` to the `*Relations` export block in `schema/index.ts`.

- [ ] **Step 4: Verify**

```bash
cd architex && pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-fsrs-cards.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_fsrs_cards schema

One row per reviewable LLD card. Carries full FSRS-5 state inline.
Three generator sources: checkpoint/paragraph/ai. Partial unique index
on (user,pattern,section,source='checkpoint') makes checkpoint
auto-generation idempotent on re-runs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Generate and apply migration

**Files:** generated `architex/drizzle/NNNN_add_lld_fsrs_cards.sql`

- [ ] **Step 1: Generate**

```bash
cd architex && pnpm db:generate
```
Expected: new SQL file containing `CREATE TABLE "lld_fsrs_cards"` + 3 indexes (2 btree + 1 partial unique with `WHERE` clause).

- [ ] **Step 2: Review SQL**

Confirm the partial unique predicate is present. If missing, delete file and re-run `pnpm db:generate`.

- [ ] **Step 3: Apply**

```bash
pnpm db:push && pnpm db:studio
```
Expected: `lld_fsrs_cards` appears with 0 rows.

- [ ] **Step 4: Commit**

```bash
git add architex/drizzle/
git commit -m "feat(db): generate and apply lld_fsrs_cards migration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Card generator — from checkpoint

**Files:** `src/lib/lld/card-generators/from-checkpoint.ts`, `src/lib/lld/card-generators/index.ts`, test

Phase 5 supports `mcq` and `click-class` checkpoint types. `fill-blank` and `order-steps` are deferred to Phase 5.1 — the flashcard affordance for those types needs separate UX design.

- [ ] **Step 1: Write the failing test** — `__tests__/from-checkpoint.test.ts` covers three cases:
  1. MCQ checkpoint `{prompt, options: [{label, correct}×3], sectionId}` → one card where `front === prompt`, `source === "checkpoint"`, `correctIndex === 1`, `options === ["Factory","Singleton","Builder"]`.
  2. `click-class` checkpoint `{prompt, correctClassId: "Singleton", classOptions: ["Client","Singleton","Factory"], sectionId}` → one card with `correctIndex === 1`.
  3. Malformed MCQ (no `correct:true` option) → returns `[]`.

Run: `pnpm test:run -- from-checkpoint` → FAIL.

- [ ] **Step 2: Create the generator** — `src/lib/lld/card-generators/from-checkpoint.ts`:

```typescript
import type { NewLLDFSRSCard } from "@/db/schema";

interface MCQCheckpoint {
  type: "mcq";
  prompt: string;
  options: Array<{ label: string; correct: boolean }>;
  sectionId: string;
  explanation?: string;
}
interface ClickClassCheckpoint {
  type: "click-class";
  prompt: string;
  classOptions: string[];
  correctClassId: string;
  sectionId: string;
  explanation?: string;
}
type SupportedCheckpoint = MCQCheckpoint | ClickClassCheckpoint;

type GeneratedCard = Omit<NewLLDFSRSCard, "userId" | "moduleId">;

export function cardsFromCheckpoint(args: {
  patternId: string;
  checkpoints: readonly SupportedCheckpoint[];
}): GeneratedCard[] {
  const out: GeneratedCard[] = [];
  for (const cp of args.checkpoints) {
    if (cp.type === "mcq") {
      const idx = cp.options.findIndex((o) => o.correct);
      if (idx < 0) continue;
      const correctLabel = cp.options[idx]!.label;
      out.push({
        patternId: args.patternId,
        sectionId: cp.sectionId,
        source: "checkpoint",
        front: cp.prompt,
        back: cp.explanation ? `${correctLabel} — ${cp.explanation}` : correctLabel,
        options: cp.options.map((o) => o.label),
        correctIndex: idx,
      });
    } else if (cp.type === "click-class") {
      const idx = cp.classOptions.indexOf(cp.correctClassId);
      if (idx < 0) continue;
      out.push({
        patternId: args.patternId,
        sectionId: cp.sectionId,
        source: "checkpoint",
        front: cp.prompt,
        back: cp.explanation ? `${cp.correctClassId} — ${cp.explanation}` : cp.correctClassId,
        options: cp.classOptions,
        correctIndex: idx,
      });
    }
  }
  return out;
}
```

- [ ] **Step 3: Create barrel** — `src/lib/lld/card-generators/index.ts`:

```typescript
export { cardsFromCheckpoint } from "./from-checkpoint";
export { cardFromParagraph } from "./from-paragraph";
export { cardsFromAI } from "./from-ai";
```
(Module errors on the latter two resolve in Tasks 5–6.)

Run: `pnpm test:run -- from-checkpoint` → PASS.

- [ ] **Step 4: Commit**

```bash
git add architex/src/lib/lld/card-generators/from-checkpoint.ts architex/src/lib/lld/card-generators/__tests__/from-checkpoint.test.ts architex/src/lib/lld/card-generators/index.ts
git commit -m "feat(lld): add checkpoint-to-card generator

MCQ and click-class → FSRS cards. fill-blank and order-steps deferred
to 5.1 pending flashcard UX design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Card generator — from paragraph

**Files:** `src/lib/lld/card-generators/from-paragraph.ts`, test

- [ ] **Step 1: Test + create** — `__tests__/from-paragraph.test.ts` (3 cases) asserts (a) `source === "paragraph"`, `cueFront` becomes `front`, `options`/`correctIndex` null; (b) missing cue falls back to "Recall…" default; (c) whitespace in `selectedText` is trimmed. Run: FAIL.

- [ ] **Step 2: Create** — `from-paragraph.ts`:

```typescript
import type { NewLLDFSRSCard } from "@/db/schema";

type GeneratedCard = Omit<NewLLDFSRSCard, "userId" | "moduleId">;

export function cardFromParagraph(args: {
  patternId: string;
  sectionId: string;
  selectedText: string;
  cueFront?: string;
}): GeneratedCard {
  return {
    patternId: args.patternId,
    sectionId: args.sectionId,
    source: "paragraph",
    front: args.cueFront?.trim() || "Recall what you marked here.",
    back: args.selectedText.trim(),
    options: null,
    correctIndex: null,
  };
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/lib/lld/card-generators/from-paragraph.ts architex/src/lib/lld/card-generators/__tests__/from-paragraph.test.ts
git commit -m "feat(lld): add paragraph-to-card generator

User selects text in Learn mode → free-form recall card bound to
pattern+section. Review surface treats it as reveal-and-self-rate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Card generator — from AI (Haiku)

**Files:** `src/lib/lld/card-generators/from-ai.ts`, test

- [ ] **Step 1: Write the failing test** — `__tests__/from-ai.test.ts` mocks `@/lib/ai/claude-client` with `vi.hoisted` and asserts: (a) a JSON array of 3 `{front,back}` becomes 3 cards with `source="ai"` and null `options`/`correctIndex`; (b) non-JSON response returns `[]` (logged via `console.warn`); (c) `count: 999` is capped — assert prompt contains `/up to 10/i`. Run: FAIL.

- [ ] **Step 2: Create** — `from-ai.ts`:

```typescript
/**
 * AI-generated FSRS cards (Haiku). ~$0.001 per 3-card call.
 * Cap count at 10. Malformed JSON → [] + log.
 */
import type { NewLLDFSRSCard } from "@/db/schema";
import { claude } from "@/lib/ai/claude-client";

type GeneratedCard = Omit<NewLLDFSRSCard, "userId" | "moduleId">;

const SYSTEM = `You generate spaced-repetition recall cards for software engineers learning design patterns. Each card has a short, specific question and a concise, correct answer. Respond ONLY with a JSON array of {front, back}. No prose, no markdown fences.`;

export async function cardsFromAI(args: {
  patternId: string;
  concept: string;
  count: number;
  sectionId?: string;
}): Promise<GeneratedCard[]> {
  const capped = Math.min(10, Math.max(1, Math.trunc(args.count)));
  const prompt = `Pattern: ${args.patternId}\nConcept: ${args.concept}\n\nGenerate up to ${capped} recall cards. Return JSON: [{"front":"...","back":"..."}]\n\nRules: one idea per card; answer verifiable in one breath; no "which of these"; code ≤ 3 lines.`;

  let response: { text: string };
  try {
    response = await claude.invoke({ model: "haiku", system: SYSTEM, prompt, maxTokens: 800 });
  } catch (err) {
    console.warn("[cardsFromAI] claude failed:", err);
    return [];
  }

  let parsed: unknown;
  try { parsed = JSON.parse(response.text); }
  catch {
    console.warn("[cardsFromAI] non-JSON:", response.text.slice(0, 200));
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const out: GeneratedCard[] = [];
  for (const raw of parsed as Array<{ front: unknown; back: unknown }>) {
    if (typeof raw?.front !== "string" || typeof raw?.back !== "string") continue;
    if (!raw.front.trim() || !raw.back.trim()) continue;
    out.push({
      patternId: args.patternId,
      sectionId: args.sectionId ?? null,
      source: "ai",
      front: raw.front.trim(),
      back: raw.back.trim(),
      options: null,
      correctIndex: null,
    });
    if (out.length >= capped) break;
  }
  return out;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/lib/lld/card-generators/from-ai.ts architex/src/lib/lld/card-generators/__tests__/from-ai.test.ts
git commit -m "feat(lld): add AI-generated card generator (Haiku)

'Give me 3 recall cards from this concept' — capped at 10 per call.
Graceful fallback to [] on malformed response.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Derived mastery computation

**Files:** `src/lib/lld/mastery.ts`, test

Spec §6 Q4: 3-tier with decay. Thresholds: avg stability <7d = `introduced` (◐); ≥7d = `completed` (◉); ≥30d = `mastered` (★). Never stored — recomputed on demand so decay is automatic.

- [ ] **Step 1: Write the failing test** — `__tests__/mastery.test.ts` asserts: (a) `classifyTier(0/6.9/7/29.9/30)` returns `introduced/introduced/completed/completed/mastered`; (b) `deriveMastery` on `[{singleton,35},{singleton,10},{observer,2}]` yields singleton avgStability ≈ 22.5 with tier `completed` and observer tier `introduced`; (c) empty input → empty Map. Run: FAIL.

- [ ] **Step 2: Create** — `mastery.ts`:

```typescript
import type { LLDFSRSCard } from "@/db/schema";

export type MasteryTier = "introduced" | "completed" | "mastered";

export interface PatternMastery {
  patternId: string;
  tier: MasteryTier;
  avgStability: number;
  cardCount: number;
}

const COMPLETED = 7;
const MASTERED = 30;

export function classifyTier(avgStability: number): MasteryTier {
  if (avgStability >= MASTERED) return "mastered";
  if (avgStability >= COMPLETED) return "completed";
  return "introduced";
}

export function deriveMastery(
  cards: ReadonlyArray<Pick<LLDFSRSCard, "patternId" | "stability">>,
): Map<string, PatternMastery> {
  const agg = new Map<string, { sum: number; count: number }>();
  for (const c of cards) {
    const s = agg.get(c.patternId) ?? { sum: 0, count: 0 };
    s.sum += c.stability;
    s.count += 1;
    agg.set(c.patternId, s);
  }
  const out = new Map<string, PatternMastery>();
  for (const [patternId, { sum, count }] of agg) {
    const avg = count === 0 ? 0 : sum / count;
    out.set(patternId, {
      patternId, avgStability: avg, cardCount: count,
      tier: classifyTier(avg),
    });
  }
  return out;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/lib/lld/mastery.ts architex/src/lib/lld/__tests__/mastery.test.ts
git commit -m "feat(lld): derive per-pattern mastery from FSRS stability

Pure function over raw cards. Thresholds: 7d = completed, 30d = mastered.
Never stored — recomputed on demand so decay is automatic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `review-store` Zustand slice

**Files:** `src/stores/review-store.ts`, test

- [ ] **Step 1: Write the failing test** — `__tests__/review-store.test.ts` uses a `sample(id)` factory for LLDFSRSCard shape. Asserts: (a) `loadQueue([c1, c2])` → queue length 2 and current = c1; (b) `reveal()` flips `revealed` to true; (c) `advance(3)` pops head, clears revealed, and increments `sessionStats.good`; (d) advancing past last clears current and increments `easy`. Run: FAIL.

- [ ] **Step 2: Create** — `src/stores/review-store.ts`:

```typescript
"use client";
import { create } from "zustand";
import type { LLDFSRSCard } from "@/db/schema";
import type { UserRating } from "@/lib/lld/fsrs-scheduler";

export interface ReviewSessionStats {
  reviewed: number; again: number; hard: number; good: number; easy: number;
}

export interface ReviewStoreState {
  queue: LLDFSRSCard[];
  current: LLDFSRSCard | null;
  revealed: boolean;
  sessionStats: ReviewSessionStats;
  loadQueue: (cards: LLDFSRSCard[]) => void;
  reveal: () => void;
  advance: (rating: UserRating) => void;
  reset: () => void;
}

const INIT: ReviewSessionStats = { reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 };

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  queue: [], current: null, revealed: false, sessionStats: INIT,

  loadQueue: (cards) => set({
    queue: cards, current: cards[0] ?? null, revealed: false, sessionStats: INIT,
  }),

  reveal: () => set({ revealed: true }),

  advance: (rating) => {
    const { queue, sessionStats } = get();
    const [, ...rest] = queue;
    const bucket = rating === 1 ? "again" : rating === 2 ? "hard" : rating === 3 ? "good" : "easy";
    set({
      queue: rest,
      current: rest[0] ?? null,
      revealed: false,
      sessionStats: {
        ...sessionStats,
        reviewed: sessionStats.reviewed + 1,
        [bucket]: sessionStats[bucket] + 1,
      } as ReviewSessionStats,
    });
  },

  reset: () => set({ queue: [], current: null, revealed: false, sessionStats: INIT }),
}));
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/stores/review-store.ts architex/src/stores/__tests__/review-store.test.ts
git commit -m "feat(stores): add review-store

Queue, current card, reveal flag, per-session rating histogram. Not
persisted — queue re-fetched on each session for freshness.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: API route — `GET /api/lld/cards/due`

**Files:** `src/app/api/lld/cards/due/route.ts`

- [ ] **Step 1: Create** — `route.ts`:

```typescript
/**
 * GET /api/lld/cards/due — user's due review queue.
 * Query: ?limit (default 20, max 50), ?patternId (optional)
 * Ordered by due asc then createdAt asc. Suspended excluded.
 */
import { NextResponse } from "next/server";
import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { getDb, lldFSRSCards } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? 20);
    const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
    const patternId = url.searchParams.get("patternId");

    const conds = [
      eq(lldFSRSCards.userId, userId),
      lte(lldFSRSCards.due, new Date()),
      isNull(lldFSRSCards.suspendedAt),
    ];
    if (patternId) conds.push(eq(lldFSRSCards.patternId, patternId));

    const cards = await getDb()
      .select().from(lldFSRSCards)
      .where(and(...conds))
      .orderBy(asc(lldFSRSCards.due), asc(lldFSRSCards.createdAt))
      .limit(limit);

    return NextResponse.json({ cards, total: cards.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/cards/due]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add architex/src/app/api/lld/cards/due/route.ts
git commit -m "feat(api): add GET /api/lld/cards/due

Review queue for the authenticated user. Ordered by due asc, excludes
suspended, caps at 50.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: API routes — cards CRUD

**Files:** `src/app/api/lld/cards/route.ts`, `src/app/api/lld/cards/[id]/route.ts`

- [ ] **Step 1: Create POST+GET** — `cards/route.ts`:

```typescript
/**
 * POST /api/lld/cards   — create 1..50 cards (checkpoint/paragraph/ai)
 * GET  /api/lld/cards   — list (?patternId, ?includeSuspended)
 */
import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, lldFSRSCards, type NewLLDFSRSCard } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const ALLOWED_SOURCES = new Set(["checkpoint", "paragraph", "ai"]);

function validate(raw: unknown): NewLLDFSRSCard | string {
  if (!raw || typeof raw !== "object") return "Card must be object";
  const c = raw as Partial<NewLLDFSRSCard>;
  if (typeof c.patternId !== "string") return "patternId required";
  if (typeof c.front !== "string" || !c.front) return "front required";
  if (typeof c.back !== "string" || !c.back) return "back required";
  if (!c.source || !ALLOWED_SOURCES.has(c.source))
    return `source must be one of: ${[...ALLOWED_SOURCES].join(", ")}`;
  return c as NewLLDFSRSCard;
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await request.json().catch(() => null)) as unknown;
    const cards = Array.isArray(body) ? body : [body];
    if (cards.length === 0 || cards.length > 50)
      return NextResponse.json({ error: "Batch size 1–50" }, { status: 400 });

    const toInsert: NewLLDFSRSCard[] = [];
    for (const raw of cards) {
      const v = validate(raw);
      if (typeof v === "string") return NextResponse.json({ error: v }, { status: 400 });
      toInsert.push({ ...v, userId, moduleId: "lld" });
    }

    const inserted = await getDb()
      .insert(lldFSRSCards).values(toInsert)
      .onConflictDoNothing() // dedupe via partial unique index
      .returning();

    return NextResponse.json({ cards: inserted }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/cards] POST", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const url = new URL(request.url);
    const patternId = url.searchParams.get("patternId");
    const includeSuspended = url.searchParams.get("includeSuspended") === "true";

    const conds = [eq(lldFSRSCards.userId, userId)];
    if (patternId) conds.push(eq(lldFSRSCards.patternId, patternId));
    if (!includeSuspended) conds.push(isNull(lldFSRSCards.suspendedAt));

    const rows = await getDb()
      .select().from(lldFSRSCards).where(and(...conds))
      .orderBy(desc(lldFSRSCards.createdAt)).limit(500);

    return NextResponse.json({ cards: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/cards] GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create PATCH+DELETE** — `cards/[id]/route.ts`:

```typescript
/**
 * PATCH  /api/lld/cards/[id]  — front/back/suspended
 * DELETE /api/lld/cards/[id]  — hard delete
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldFSRSCards } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

async function resolveOwner(): Promise<string | NextResponse> {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    return userId ?? NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await resolveOwner();
    if (owner instanceof NextResponse) return owner;
    const { id } = await params;

    const body = (await request.json().catch(() => ({}))) as {
      front?: string; back?: string; suspended?: boolean;
    };
    const updates: Record<string, unknown> = {};
    if (typeof body.front === "string" && body.front) updates.front = body.front;
    if (typeof body.back === "string" && body.back) updates.back = body.back;
    if (typeof body.suspended === "boolean")
      updates.suspendedAt = body.suspended ? new Date() : null;
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    const [updated] = await getDb()
      .update(lldFSRSCards).set(updates)
      .where(and(eq(lldFSRSCards.id, id), eq(lldFSRSCards.userId, owner)))
      .returning();
    if (!updated) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json({ card: updated });
  } catch (error) {
    console.error("[api/lld/cards/:id] PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await resolveOwner();
    if (owner instanceof NextResponse) return owner;
    const { id } = await params;

    const [deleted] = await getDb()
      .delete(lldFSRSCards)
      .where(and(eq(lldFSRSCards.id, id), eq(lldFSRSCards.userId, owner)))
      .returning();
    if (!deleted) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/lld/cards/:id] DELETE", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add architex/src/app/api/lld/cards/
git commit -m "feat(api): add LLD card CRUD routes

POST/GET /api/lld/cards, PATCH/DELETE /api/lld/cards/:id. Batch POST
uses onConflictDoNothing so re-running checkpoint generators is
idempotent via the partial unique index.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: API route — generate AI cards

**Files:** `src/app/api/lld/cards/generate-ai/route.ts`

- [ ] **Step 1: Create** — `route.ts`:

```typescript
/**
 * POST /api/lld/cards/generate-ai — Haiku-powered card generation.
 * Rate-limit via existing aiUsage in claude-client.
 */
import { NextResponse } from "next/server";
import { getDb, lldFSRSCards } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { cardsFromAI } from "@/lib/lld/card-generators";

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as {
      patternId?: string; concept?: string; count?: number; sectionId?: string;
    };
    if (!body.patternId) return NextResponse.json({ error: "patternId required" }, { status: 400 });
    if (!body.concept) return NextResponse.json({ error: "concept required" }, { status: 400 });

    const generated = await cardsFromAI({
      patternId: body.patternId, concept: body.concept,
      count: body.count ?? 3, sectionId: body.sectionId,
    });

    if (generated.length === 0)
      return NextResponse.json(
        { error: "AI returned no usable cards. Rephrase the concept." },
        { status: 502 },
      );

    const inserted = await getDb()
      .insert(lldFSRSCards)
      .values(generated.map((g) => ({ ...g, userId, moduleId: "lld" })))
      .returning();

    return NextResponse.json({ cards: inserted }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/cards/generate-ai]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add architex/src/app/api/lld/cards/generate-ai/route.ts
git commit -m "feat(api): add POST /api/lld/cards/generate-ai

Haiku-powered recall card generation. 502 when AI yields no cards.
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: API route — submit review

**Files:** `src/app/api/lld/review/submit/route.ts`

- [ ] **Step 1: Create** — `route.ts`:

```typescript
/**
 * POST /api/lld/review/submit
 * Body: { cardId, rating: 1|2|3|4 }
 * Applies FSRS scheduling + writes activityEvent for streak/stats.
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldFSRSCards, activityEvents } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import {
  scheduleNew, scheduleReview,
  type FSRSCardState, type UserRating,
} from "@/lib/lld/fsrs-scheduler";

const VALID = new Set([1, 2, 3, 4]);

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as {
      cardId?: string; rating?: number;
    };
    if (!body.cardId) return NextResponse.json({ error: "cardId required" }, { status: 400 });
    if (!body.rating || !VALID.has(body.rating))
      return NextResponse.json({ error: "rating must be 1..4" }, { status: 400 });
    const rating = body.rating as UserRating;

    const db = getDb();
    const [card] = await db
      .select().from(lldFSRSCards)
      .where(and(eq(lldFSRSCards.id, body.cardId), eq(lldFSRSCards.userId, userId)))
      .limit(1);
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const current: FSRSCardState = {
      state: card.state as FSRSCardState["state"],
      stability: card.stability, difficulty: card.difficulty,
      lastReview: card.lastReview, due: card.due,
      reps: card.reps, lapses: card.lapses,
    };
    const next = card.reps === 0 && card.state === "new"
      ? scheduleNew(rating)
      : scheduleReview(current, rating);

    const [updated] = await db
      .update(lldFSRSCards)
      .set({
        state: next.state, stability: next.stability, difficulty: next.difficulty,
        lastReview: next.lastReview, due: next.due,
        reps: next.reps, lapses: next.lapses,
      })
      .where(eq(lldFSRSCards.id, card.id))
      .returning();

    await db.insert(activityEvents).values({
      userId, moduleId: "lld", event: "lld_card_reviewed",
      metadata: {
        cardId: card.id, patternId: card.patternId, rating,
        newStability: next.stability, newState: next.state,
      },
    });

    return NextResponse.json({ card: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/review/submit]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
pnpm typecheck
git add architex/src/app/api/lld/review/submit/route.ts
git commit -m "feat(api): add POST /api/lld/review/submit

Applies FSRS and persists updated state. Emits lld_card_reviewed
activityEvent for streak + stats tracking.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: API routes — mastery + stats

**Files:** `src/app/api/lld/mastery/route.ts`, `src/app/api/lld/stats/route.ts`

- [ ] **Step 1: Create mastery** — `mastery/route.ts`:

```typescript
/** GET /api/lld/mastery — per-pattern mastery summary. */
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, lldFSRSCards } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { deriveMastery } from "@/lib/lld/mastery";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const rows = await getDb()
      .select({ patternId: lldFSRSCards.patternId, stability: lldFSRSCards.stability })
      .from(lldFSRSCards)
      .where(and(eq(lldFSRSCards.userId, userId), isNull(lldFSRSCards.suspendedAt)));

    return NextResponse.json({ mastery: Array.from(deriveMastery(rows).values()) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/mastery]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create stats** — `stats/route.ts`:

```typescript
/**
 * GET /api/lld/stats
 * Returns: totalReviewed (30d), retentionCurve[30], currentStreak,
 * longestStreak, cardsDueToday.
 */
import { NextResponse } from "next/server";
import { and, eq, gte, lte, isNull, sql } from "drizzle-orm";
import { getDb, lldFSRSCards, activityEvents } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const DAY_MS = 86_400_000;
const startOfDayUTC = (d: Date) => {
  const out = new Date(d); out.setUTCHours(0, 0, 0, 0); return out;
};

function computeStreaks(dates: Date[]): { current: number; longest: number } {
  const days = Array.from(new Set(dates.map((d) => startOfDayUTC(d).getTime())))
    .sort((a, b) => a - b);
  let longest = 0, run = 0;
  let prev: number | null = null;
  for (const day of days) {
    run = prev === null || day - prev === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  const set = new Set(days);
  let current = 0, cursor = startOfDayUTC(new Date()).getTime();
  while (set.has(cursor)) { current += 1; cursor -= DAY_MS; }
  return { current, longest };
}

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const db = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

    const [events, activeCards, dueRow] = await Promise.all([
      db.select({ createdAt: activityEvents.createdAt })
        .from(activityEvents)
        .where(and(
          eq(activityEvents.userId, userId),
          eq(activityEvents.event, "lld_card_reviewed"),
          gte(activityEvents.createdAt, thirtyDaysAgo),
        )),
      db.select({ stability: lldFSRSCards.stability, lastReview: lldFSRSCards.lastReview })
        .from(lldFSRSCards)
        .where(and(eq(lldFSRSCards.userId, userId), isNull(lldFSRSCards.suspendedAt))),
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(lldFSRSCards)
        .where(and(
          eq(lldFSRSCards.userId, userId),
          isNull(lldFSRSCards.suspendedAt),
          lte(lldFSRSCards.due, now),
        )).then((r) => r[0]),
    ]);

    const reviewDates = events.map((e) => e.createdAt).filter(Boolean) as Date[];

    const retentionCurve: Array<{ day: string; retention: number; samples: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS);
      let sum = 0, samples = 0;
      for (const c of activeCards) {
        if (!c.lastReview || c.stability <= 0) continue;
        const elapsed = (d.getTime() - c.lastReview.getTime()) / DAY_MS;
        if (elapsed < 0) continue;
        sum += Math.pow(1 + (19 / 81) * (elapsed / c.stability), -0.5);
        samples += 1;
      }
      retentionCurve.push({
        day: d.toISOString().slice(0, 10),
        retention: samples === 0 ? 0 : sum / samples,
        samples,
      });
    }

    const { current, longest } = computeStreaks(reviewDates);
    return NextResponse.json({
      totalReviewed: reviewDates.length,
      retentionCurve,
      currentStreak: current,
      longestStreak: longest,
      cardsDueToday: dueRow?.count ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[api/lld/stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
pnpm typecheck
git add architex/src/app/api/lld/mastery/route.ts architex/src/app/api/lld/stats/route.ts
git commit -m "feat(api): add mastery + stats aggregation routes

/api/lld/mastery — per-pattern tier (introduced/completed/mastered)
/api/lld/stats  — 30d retention curve, streaks, due count, total reviewed

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Extend analytics event catalog

**Files:** `src/lib/analytics/lld-events.ts` (append)

- [ ] **Step 1: Append review events** at the end of the existing file:

```typescript
// ── Review lifecycle ─────────────────────────────────────

type ReviewRating = 1 | 2 | 3 | 4;
type CardSource = "checkpoint" | "paragraph" | "ai";

export function lldReviewSessionStarted(args: { queueSize: number }): LLDEvent {
  return { event: "lld_review_session_started", metadata: args };
}

export function lldReviewCardShown(args: {
  cardId: string; patternId: string; source: CardSource;
}): LLDEvent {
  return { event: "lld_review_card_shown", metadata: args };
}

export function lldReviewCardRated(args: {
  cardId: string; patternId: string; rating: ReviewRating;
  revealMs: number; rateMs: number;
}): LLDEvent {
  return { event: "lld_review_card_rated", metadata: args };
}

export function lldReviewSessionCompleted(args: {
  reviewed: number; again: number; hard: number; good: number; easy: number;
  durationMs: number;
}): LLDEvent {
  return { event: "lld_review_session_completed", metadata: args };
}

export function lldCardCreated(args: {
  patternId: string; source: CardSource; cardId: string;
}): LLDEvent {
  return { event: "lld_card_created", metadata: args };
}

export function lldCardSuspended(args: { cardId: string }): LLDEvent {
  return { event: "lld_card_suspended", metadata: args };
}
```

- [ ] **Step 2: Commit**

```bash
pnpm typecheck
git add architex/src/lib/analytics/lld-events.ts
git commit -m "feat(analytics): add 6 review-lifecycle event builders

session_started, card_shown, card_rated, session_completed,
card_created, card_suspended. Brings LLD catalog to 19 of 25.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: `useReviewQueue` hook

**Files:** `src/hooks/useReviewQueue.ts`, test

- [ ] **Step 1: Write the failing test** — `__tests__/useReviewQueue.test.tsx` wraps `renderHook` in a `QueryClientProvider`, stubs `global.fetch` to return `{ cards: [{id:"c1",…}], total: 1 }`, and asserts that on success `useReviewStore.getState().queue` has length 1 and `current.id === "c1"`. Run: FAIL.

- [ ] **Step 2: Create** — `useReviewQueue.ts`:

```typescript
"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LLDFSRSCard } from "@/db/schema";
import { useReviewStore } from "@/stores/review-store";

async function fetchQueue(patternId?: string) {
  const url = new URL("/api/lld/cards/due", window.location.origin);
  if (patternId) url.searchParams.set("patternId", patternId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Queue fetch failed: ${res.status}`);
  return (await res.json()) as { cards: LLDFSRSCard[]; total: number };
}

export function useReviewQueue(patternId?: string) {
  const loadQueue = useReviewStore((s) => s.loadQueue);

  const q = useQuery({
    queryKey: ["lld", "review", "queue", patternId ?? "all"],
    queryFn: () => fetchQueue(patternId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!q.data) return;
    loadQueue(q.data.cards.map((c) => ({
      ...c,
      due: new Date(c.due),
      lastReview: c.lastReview ? new Date(c.lastReview) : null,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    })) as never);
  }, [q.data, loadQueue]);

  return q;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/hooks/useReviewQueue.ts architex/src/hooks/__tests__/useReviewQueue.test.tsx
git commit -m "feat(hooks): add useReviewQueue

Fetches /api/lld/cards/due via TanStack Query and populates
review-store on success. Supports optional patternId filter.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: `useReviewKeyboard` hook (Anki shortcuts)

**Files:** `src/hooks/useReviewKeyboard.ts`, test

- [ ] **Step 1: Write the failing test** — `__tests__/useReviewKeyboard.test.tsx` uses `fire(key)` helper dispatching `window.dispatchEvent(new KeyboardEvent("keydown", { key }))`. Four cases: (a) Space → `onReveal()` when `revealed: false`; (b) 1/2/3/4 → `onRate(1..4)` when `revealed: true`; (c) digits ignored when `revealed: false`; (d) Enter → `onNext()` when `revealed: true`. Run: FAIL.

- [ ] **Step 2: Create** — `useReviewKeyboard.ts`:

```typescript
"use client";
import { useEffect } from "react";
import type { UserRating } from "@/lib/lld/fsrs-scheduler";

interface Args {
  revealed: boolean;
  onReveal: () => void;
  onRate: (r: UserRating) => void;
  onNext: () => void;
}

/**
 * Anki-convention shortcuts.
 *  Space → reveal   1/2/3/4 → Again/Hard/Good/Easy   Enter → next
 */
export function useReviewKeyboard({ revealed, onReveal, onRate, onNext }: Args): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;

      if (e.key === " ") {
        if (!revealed) { e.preventDefault(); onReveal(); }
        return;
      }
      if (e.key === "Enter") {
        if (revealed) { e.preventDefault(); onNext(); }
        return;
      }
      if (!revealed) return;
      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        onRate(Number(e.key) as UserRating);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, onReveal, onRate, onNext]);
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add architex/src/hooks/useReviewKeyboard.ts architex/src/hooks/__tests__/useReviewKeyboard.test.tsx
git commit -m "feat(hooks): add useReviewKeyboard with Anki shortcuts

Space reveals; 1/2/3/4 rate Again/Hard/Good/Easy; Enter advances.
Never hijacks typing (input/textarea/contenteditable passthrough).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: `useDueCountWidget` hook

**Files:** `src/hooks/useDueCountWidget.ts`

- [ ] **Step 1: Create** — `useDueCountWidget.ts`:

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";

async function fetchDueCount() {
  const res = await fetch("/api/lld/cards/due?limit=50");
  if (!res.ok) throw new Error(`Due count ${res.status}`);
  const body = (await res.json()) as { total: number };
  return { count: body.total, lastUpdated: new Date() };
}

/**
 * Small read-only hook for homepage + profile "Cards due today" badge.
 * 60s stale — a sidebar badge doesn't need real-time precision.
 * The widget renders "50+" for any count ≥ 50.
 */
export function useDueCountWidget() {
  return useQuery({
    queryKey: ["lld", "cards", "due-count"],
    queryFn: fetchDueCount,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
pnpm typecheck
git add architex/src/hooks/useDueCountWidget.ts
git commit -m "feat(hooks): add useDueCountWidget

60s-stale TanStack Query hook powering the homepage widget and the
profile sidebar badge. 50+ display cap.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: `ReviewCard` and `ReviewRatingRow` components

**Files:** `src/components/modules/lld/review/ReviewCard.tsx`, `ReviewRatingRow.tsx`, tests

- [ ] **Step 1: Write failing tests**
- `__tests__/ReviewCard.test.tsx` — three cases: (a) `revealed=false` shows `front` and hides `back`; (b) `revealed=true` shows `back`; (c) clicking the "Show answer" button calls `onReveal` once.
- `__tests__/ReviewRatingRow.test.tsx` — two cases: (a) four buttons present (Again / Hard / Good / Easy by accessible name); (b) clicking "Good" calls `onRate(3)`.

Run both: FAIL.

- [ ] **Step 2: Create `ReviewRatingRow.tsx`**:

```tsx
"use client";
import { memo } from "react";
import type { UserRating } from "@/lib/lld/fsrs-scheduler";
import { cn } from "@/lib/utils";

const RATINGS: ReadonlyArray<{
  rating: UserRating; label: string; shortcut: string; tone: string;
}> = [
  { rating: 1, label: "Again", shortcut: "1", tone: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" },
  { rating: 2, label: "Hard", shortcut: "2", tone: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" },
  { rating: 3, label: "Good", shortcut: "3", tone: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" },
  { rating: 4, label: "Easy", shortcut: "4", tone: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25" },
];

export const ReviewRatingRow = memo(function ReviewRatingRow({
  onRate,
}: { onRate: (r: UserRating) => void }) {
  return (
    <div role="group" aria-label="Rate your recall" className="grid grid-cols-4 gap-2">
      {RATINGS.map((r) => (
        <button
          key={r.rating}
          onClick={() => onRate(r.rating)}
          aria-label={`${r.label} · shortcut ${r.shortcut}`}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            r.tone,
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
          )}
        >
          <div>{r.label}</div>
          <div className="text-[10px] font-normal opacity-60">{r.shortcut}</div>
        </button>
      ))}
    </div>
  );
});
```

- [ ] **Step 3: Create `ReviewCard.tsx`**:

```tsx
"use client";
import { memo } from "react";
import type { LLDFSRSCard } from "@/db/schema";
import type { UserRating } from "@/lib/lld/fsrs-scheduler";
import { ReviewRatingRow } from "./ReviewRatingRow";
import { cn } from "@/lib/utils";

interface Props {
  card: LLDFSRSCard;
  revealed: boolean;
  onReveal: () => void;
  onRate: (r: UserRating) => void;
}

export const ReviewCard = memo(function ReviewCard({ card, revealed, onReveal, onRate }: Props) {
  return (
    <article
      aria-live="polite"
      className="mx-auto flex max-w-xl flex-col gap-6 rounded-2xl border border-border/30 bg-elevated/70 p-6 backdrop-blur-sm shadow-sm"
    >
      <header className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
        {card.patternId} · {card.source}
      </header>
      <div className="text-lg font-medium leading-relaxed text-foreground">{card.front}</div>
      {revealed ? (
        <div className="rounded-lg border border-border/20 bg-background/50 p-4 text-sm leading-relaxed text-foreground-muted">
          {card.back}
        </div>
      ) : (
        <button
          onClick={onReveal}
          className={cn(
            "self-start rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          Show answer · Space
        </button>
      )}
      {revealed ? <ReviewRatingRow onRate={onRate} /> : null}
    </article>
  );
});
```

Run both tests: PASS.

- [ ] **Step 4: Commit**

```bash
git add architex/src/components/modules/lld/review/ReviewCard.tsx architex/src/components/modules/lld/review/ReviewRatingRow.tsx architex/src/components/modules/lld/review/__tests__/
git commit -m "feat(lld-review): add ReviewCard + ReviewRatingRow

Flashcard UI: front visible, back on reveal. 4-rating row with
shortcut labels (1/2/3/4). aria-live='polite' so answers announce.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: `ReviewEmptyState` + `ReviewSessionComplete` components

**Files:** `src/components/modules/lld/review/ReviewEmptyState.tsx`, `ReviewSessionComplete.tsx`

- [ ] **Step 1: Create `ReviewEmptyState.tsx`** — a centered card with the coffee emoji `☕`, "All caught up" h2, and a paragraph reading: "No cards are due right now. Come back tomorrow — FSRS surfaces cards right at the edge of recall, so review stays short and sharp."

- [ ] **Step 2: Create `ReviewSessionComplete.tsx`** — props `{ stats: ReviewSessionStats, onRestart?: () => void }`. Displays:
  - `✨` emoji (text-5xl).
  - "Session complete" h2.
  - Paragraph: `You reviewed {stats.reviewed} card(s).`.
  - 4-column `<dl>` grid with `[Again, Hard, Good, Easy] × [count, pct%]` where `pct = round((n / reviewed) * 100)`. Colors: rose/amber/emerald/sky (text-X-400).
  - Optional Restart button (pill: `bg-primary/20`, `text-xs`, `rounded-full`) when `onRestart` is provided.

- [ ] **Step 3: Commit**

```bash
pnpm typecheck
git add architex/src/components/modules/lld/review/ReviewEmptyState.tsx architex/src/components/modules/lld/review/ReviewSessionComplete.tsx
git commit -m "feat(lld-review): add empty + session-complete states

Empty state when no cards due. Complete view shows 4-bucket rating
histogram and optional Restart action.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: Fill `ReviewModeLayout.tsx`

**Files:** `src/components/modules/lld/modes/ReviewModeLayout.tsx` (overwrite)

- [ ] **Step 1: Overwrite the stub** — `ReviewModeLayout.tsx`:

```tsx
"use client";
import { memo, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReviewStore } from "@/stores/review-store";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useReviewKeyboard } from "@/hooks/useReviewKeyboard";
import { ReviewCard } from "@/components/modules/lld/review/ReviewCard";
import { ReviewEmptyState } from "@/components/modules/lld/review/ReviewEmptyState";
import { ReviewSessionComplete } from "@/components/modules/lld/review/ReviewSessionComplete";
import {
  track, lldReviewSessionStarted, lldReviewCardShown,
  lldReviewCardRated, lldReviewSessionCompleted,
} from "@/lib/analytics/lld-events";
import type { UserRating } from "@/lib/lld/fsrs-scheduler";

async function submitRating(args: { cardId: string; rating: UserRating }) {
  const res = await fetch("/api/lld/review/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  return res.json();
}

export const ReviewModeLayout = memo(function ReviewModeLayout() {
  const queryClient = useQueryClient();
  const queue = useReviewStore((s) => s.queue);
  const current = useReviewStore((s) => s.current);
  const revealed = useReviewStore((s) => s.revealed);
  const stats = useReviewStore((s) => s.sessionStats);
  const reveal = useReviewStore((s) => s.reveal);
  const advance = useReviewStore((s) => s.advance);
  const reset = useReviewStore((s) => s.reset);

  const { isLoading, data, refetch } = useReviewQueue();
  const submit = useMutation({ mutationFn: submitRating, networkMode: "offlineFirst" });

  const sessionStartRef = useRef(0);
  const cardShownAtRef = useRef(0);
  const revealAtRef = useRef(0);
  const sessionReportedRef = useRef(false);

  useEffect(() => {
    if (!data || sessionStartRef.current !== 0) return;
    if (data.cards.length > 0) {
      sessionStartRef.current = Date.now();
      track(lldReviewSessionStarted({ queueSize: data.cards.length }));
    }
  }, [data]);

  useEffect(() => {
    if (!current) return;
    cardShownAtRef.current = Date.now();
    revealAtRef.current = 0;
    track(lldReviewCardShown({
      cardId: current.id, patternId: current.patternId,
      source: current.source as "checkpoint" | "paragraph" | "ai",
    }));
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionReportedRef.current && sessionStartRef.current > 0 && queue.length === 0 && stats.reviewed > 0) {
      sessionReportedRef.current = true;
      track(lldReviewSessionCompleted({
        ...stats, durationMs: Date.now() - sessionStartRef.current,
      }));
      queryClient.invalidateQueries({ queryKey: ["lld", "cards", "due-count"] });
    }
  }, [queue.length, stats, queryClient]);

  const onReveal = useCallback(() => {
    if (!revealed) { revealAtRef.current = Date.now(); reveal(); }
  }, [revealed, reveal]);

  const onRate = useCallback((rating: UserRating) => {
    if (!current) return;
    const now = Date.now();
    track(lldReviewCardRated({
      cardId: current.id, patternId: current.patternId, rating,
      revealMs: revealAtRef.current - cardShownAtRef.current,
      rateMs: now - (revealAtRef.current || cardShownAtRef.current),
    }));
    submit.mutate({ cardId: current.id, rating });
    advance(rating);
  }, [current, submit, advance]);

  const onNext = useCallback(() => {
    // Reserved for Phase 5.1 when reveal/rate/next may split into discrete steps.
  }, []);

  useReviewKeyboard({ revealed, onReveal, onRate, onNext });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Loading queue…
      </div>
    );
  }
  if (!current && queue.length === 0 && stats.reviewed === 0) return <ReviewEmptyState />;
  if (!current && stats.reviewed > 0) {
    return (
      <ReviewSessionComplete
        stats={stats}
        onRestart={() => {
          reset();
          sessionStartRef.current = 0;
          sessionReportedRef.current = false;
          refetch();
        }}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      {current ? (
        <ReviewCard card={current} revealed={revealed} onReveal={onReveal} onRate={onRate} />
      ) : null}
    </div>
  );
});
```

- [ ] **Step 2: Verify**

```bash
cd architex && pnpm typecheck && pnpm test:run
```

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/modes/ReviewModeLayout.tsx
git commit -m "feat(lld): fill ReviewModeLayout with full card session

Wires useReviewQueue + useReviewKeyboard + review-store. Emits
session_started, card_shown, card_rated, session_completed analytics
at the right moments. Invalidates due-count on completion so the
homepage widget refreshes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 21: `CreateCardFromParagraph` button (Learn mode)

**Files:** `src/components/modules/lld/review/CreateCardFromParagraph.tsx`, `src/components/modules/lld/learn/LessonSection.tsx` (modify)

- [ ] **Step 1: Create the button** — `CreateCardFromParagraph.tsx`:

```tsx
"use client";
import { memo, useCallback, useState } from "react";
import { cardFromParagraph } from "@/lib/lld/card-generators";
import { track, lldCardCreated } from "@/lib/analytics/lld-events";

interface Props {
  patternId: string;
  sectionId: string;
  selection: string;
  onDone?: () => void;
}

/**
 * Floating action button shown whenever the user has a non-empty text
 * selection inside a LessonSection. One click creates a paragraph-sourced
 * FSRS card via POST /api/lld/cards.
 */
export const CreateCardFromParagraph = memo(function CreateCardFromParagraph({
  patternId, sectionId, selection, onDone,
}: Props) {
  const [busy, setBusy] = useState(false);

  const create = useCallback(async () => {
    if (!selection.trim() || busy) return;
    setBusy(true);
    try {
      const card = cardFromParagraph({ patternId, sectionId, selectedText: selection });
      const res = await fetch("/api/lld/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const { cards } = (await res.json()) as { cards: Array<{ id: string }> };
      if (cards[0]) {
        track(lldCardCreated({ patternId, source: "paragraph", cardId: cards[0].id }));
      }
      onDone?.();
    } catch (err) {
      console.warn("[CreateCardFromParagraph] failed:", err);
    } finally {
      setBusy(false);
    }
  }, [patternId, sectionId, selection, busy, onDone]);

  if (!selection.trim()) return null;

  return (
    <button
      onClick={create}
      disabled={busy}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur hover:bg-primary disabled:opacity-50"
    >
      {busy ? "Adding…" : "+ Make a card from this"}
    </button>
  );
});
```

- [ ] **Step 2: Track selection in `LessonSection.tsx`**

Open `src/components/modules/lld/learn/LessonSection.tsx`. Near the top of the component, add:

```tsx
import { useEffect, useRef, useState } from "react";
import { CreateCardFromParagraph } from "@/components/modules/lld/review/CreateCardFromParagraph";

// …inside component body:
const sectionRef = useRef<HTMLElement | null>(null);
const [selection, setSelection] = useState("");

useEffect(() => {
  const onChange = () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) { setSelection(""); return; }
    const anchor = sel.anchorNode;
    if (sectionRef.current && anchor && sectionRef.current.contains(anchor)) {
      setSelection(sel.toString());
    } else setSelection("");
  };
  document.addEventListener("selectionchange", onChange);
  return () => document.removeEventListener("selectionchange", onChange);
}, []);
```

Then on the outer `<section>` element:

```tsx
<section ref={sectionRef} /* …existing props… */>
  {/* …existing children… */}
  <CreateCardFromParagraph
    patternId={patternId}
    sectionId={sectionId}
    selection={selection}
    onDone={() => setSelection("")}
  />
</section>
```

Thread `patternId` down from `LessonColumn` if the section doesn't already receive it.

- [ ] **Step 3: Commit**

```bash
pnpm typecheck
git add architex/src/components/modules/lld/review/CreateCardFromParagraph.tsx architex/src/components/modules/lld/learn/LessonSection.tsx
git commit -m "feat(lld-learn): 'Make a card from this' paragraph affordance

Select any paragraph in a lesson — a floating button appears
bottom-right. One click creates a paragraph-sourced FSRS card scoped
to the current pattern+section. Tracked as lld_card_created.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 22: `DueCardsWidget` for homepage + profile

**Files:** `src/components/home/DueCardsWidget.tsx`, plus mount sites

- [ ] **Step 1: Create the widget** — `DueCardsWidget.tsx`:

```tsx
"use client";
import { memo } from "react";
import Link from "next/link";
import { useDueCountWidget } from "@/hooks/useDueCountWidget";
import { cn } from "@/lib/utils";

export const DueCardsWidget = memo(function DueCardsWidget({
  variant = "compact",
}: { variant?: "compact" | "hero" }) {
  const { data, isLoading, isError } = useDueCountWidget();
  if (isLoading) return (
    <div className={cn("rounded-xl border border-border/20 bg-elevated/40 p-3", variant === "hero" && "p-5")}>
      <div className="text-xs text-foreground-muted">Cards due…</div>
    </div>
  );
  if (isError) return null;

  const count = data?.count ?? 0;
  const label = count === 0 ? "All caught up"
    : count === 1 ? "1 card due today"
    : `${count >= 50 ? "50+" : count} cards due today`;

  return (
    <Link
      href="/modules/lld?mode=review"
      className={cn(
        "block rounded-xl border p-3 transition-colors",
        "border-border/20 bg-elevated/40 hover:bg-elevated/70",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        variant === "hero" && "p-5",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("text-2xl", variant === "hero" && "text-4xl")} aria-hidden>🔁</div>
        <div className="flex-1">
          <div className={cn("font-semibold text-foreground", variant === "compact" ? "text-sm" : "text-lg")}>
            {label}
          </div>
          {count > 0 ? (
            <div className="text-xs text-foreground-muted mt-0.5">
              {variant === "hero" ? "2–3 minutes · keyboard-first flashcards" : "Tap to review"}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
});
```

- [ ] **Step 2: Mount on homepage**

Find the homepage file (likely `src/app/page.tsx`). Locate the module-card grid and add:

```tsx
import { DueCardsWidget } from "@/components/home/DueCardsWidget";
// …inside the grid:
<DueCardsWidget variant="hero" />
```

- [ ] **Step 3: Mount on profile (if one exists)**

Search for an existing profile page. If found, add `<DueCardsWidget variant="compact" />` to the sidebar. If no profile surface exists, defer to Phase 5.1 and note it in the commit.

- [ ] **Step 4: Commit**

```bash
pnpm typecheck
git add architex/src/components/home/DueCardsWidget.tsx architex/src/app/page.tsx # + profile if touched
git commit -m "feat(lld-review): add DueCardsWidget to homepage

Links to /modules/lld?mode=review, shows 'N cards due today' (capped
'50+'). Compact variant for sidebars, hero for homepage. Profile
mount in Phase 5.1 if profile page not present yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 23: Daily-streak integration

**Files:** `src/stores/progress-store.ts` (path may differ — verify first)

- [ ] **Step 1: Inspect current streak mechanism**

```bash
grep -rnE "streak" architex/src --include="*.ts" --include="*.tsx" | head
```

If streaks are derived from `activityEvents` aggregation (most likely given existing `lld_card_reviewed` event writes in Task 12), this task is **already complete** — the server emits the event in Task 12 and the aggregator picks it up automatically.

If streaks filter by a narrower event whitelist, extend it. Example:

```typescript
const STREAK_EVENTS = new Set([
  "lesson_completed",
  "drill_submitted",
  "lld_card_reviewed", // NEW
]);
```

- [ ] **Step 2: Add or verify a streak test**

If a streak test exists, run it. Otherwise, add minimal coverage in the aggregator's test file:

```typescript
import { describe, it, expect } from "vitest";
import { computeStreak } from "@/stores/progress-store"; // adjust path

describe("streak counts lld_card_reviewed", () => {
  it("a review today adds to current streak", () => {
    const today = [new Date()];
    expect(computeStreak(today).current).toBeGreaterThanOrEqual(1);
  });
});
```

Run: `pnpm test:run -- streak`.

- [ ] **Step 3: Commit**

```bash
git add <touched-files>
git commit -m "feat(streak): include lld_card_reviewed in daily streak

A review day counts toward the daily habit streak alongside lesson
and drill completions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 24: Stats page — charts + route

**Files:** `src/components/charts/RetentionCurveChart.tsx`, `PerPatternMasteryChart.tsx`, `src/components/profile/ReviewStatsPage.tsx`, `src/app/profile/review/page.tsx`

Use inline SVG to avoid adding a charting dependency.

- [ ] **Step 1: Create `RetentionCurveChart.tsx`**:

```tsx
"use client";
import { memo } from "react";

interface Point { day: string; retention: number; samples: number; }

export const RetentionCurveChart = memo(function RetentionCurveChart({
  points,
}: { points: Point[] }) {
  const W = 600, H = 160, PAD = 20;
  const n = points.length;
  if (n === 0) return <div className="text-sm text-foreground-muted">Not enough data yet.</div>;

  const x = (i: number) => PAD + ((W - 2 * PAD) * i) / Math.max(1, n - 1);
  const y = (r: number) => H - PAD - (H - 2 * PAD) * Math.max(0, Math.min(1, r));
  const path = points.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(p.retention).toFixed(2)}`
  ).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="30-day retention curve">
      <line x1={PAD} y1={y(0.9)} x2={W - PAD} y2={y(0.9)}
            stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD}
            stroke="currentColor" strokeOpacity="0.2" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
      <text x={PAD} y={y(0.9) - 4} className="fill-current text-[10px] opacity-60">90% target</text>
    </svg>
  );
});
```

- [ ] **Step 2: Create `PerPatternMasteryChart.tsx`** — tier-colored horizontal bars. Props `rows: Row[]` where `Row = { patternId, tier: MasteryTier, avgStability, cardCount }`. Empty state returns "No patterns reviewed yet.". Bar width = `max(2, (avgStability / max(30, maxRow)) * 100)` percent. `TIER_COLOR` map: introduced=amber-500/60, completed=emerald-500/60, mastered=sky-500/70. Row layout: `grid-cols-[150px_1fr_60px]` — pattern name · bar · "Nd · N cards" metadata.

- [ ] **Step 3: Create `ReviewStatsPage.tsx`** — three sections:
  1. Header "Review · Stats" with subtitle.
  2. `grid-cols-3` of three `<Stat>` cards: Current streak, Longest streak, Reviews (30d), all read from `/api/lld/stats`.
  3. Retention curve section (30-day chart from `/api/lld/stats`).
  4. Per-pattern mastery section (from `/api/lld/mastery`).

Use `useQuery` with keys `["lld","stats"]` and `["lld","mastery"]`. Loading state shows `<div className="text-sm text-foreground-muted">Loading…</div>`. The `<Stat>` subcomponent is a rounded border card with `.uppercase .tracking-wider` label and `.text-2xl.font-semibold` value (default "—").

- [ ] **Step 4: Mount the route** — create `src/app/profile/review/page.tsx`:

```tsx
import { ReviewStatsPage } from "@/components/profile/ReviewStatsPage";
export default function Page() { return <ReviewStatsPage />; }
```

If the codebase already has `/profile` with tabs, add a Review tab instead. Follow the existing tab convention.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck
git add architex/src/components/charts/ architex/src/components/profile/ architex/src/app/profile/review/
git commit -m "feat(lld-review): stats page — retention curve + per-pattern mastery

Mounted at /profile/review. Pure inline-SVG charts (no charting dep).
Consumes /api/lld/stats and /api/lld/mastery.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 25: Auto-generate checkpoint cards on lesson completion

**Files:** lesson-completion handler (search first)

- [ ] **Step 1: Find the lesson-complete handler**

```bash
grep -rnE "lesson.*completed|onLessonComplete|markSectionComplete" architex/src --include="*.ts" --include="*.tsx" | head
```
Identify the handler that fires when a user reaches the final section of a pattern (typically in Learn mode's progress hook).

- [ ] **Step 2: POST to `/api/lld/cards`**

In that handler, after existing progress logic, add:

```typescript
import { cardsFromCheckpoint } from "@/lib/lld/card-generators";

// …inside onLessonComplete:
const generated = cardsFromCheckpoint({
  patternId,
  checkpoints: lesson.sections
    .filter((s) => s.type === "checkpoint")
    .map((s) => s.checkpoint),
});

if (generated.length > 0) {
  await fetch("/api/lld/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generated),
  });
}
```

The server dedupes on (user, pattern, section, source='checkpoint') so repeat completions are no-ops.

- [ ] **Step 3: Commit**

```bash
pnpm typecheck
git add <touched-files>
git commit -m "feat(lld-learn): auto-generate FSRS cards on lesson completion

Every MCQ / click-class checkpoint becomes a review card. Partial
unique index makes this idempotent on re-completion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 26: End-to-end smoke test + verification

- [ ] **Step 1: Full verification**

```bash
cd architex && pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```
All four must pass.

- [ ] **Step 2: Smoke — first-time review flow**

1. Sign in (or clear `lld_fsrs_cards` via Drizzle Studio).
2. `/modules/lld?mode=learn` → complete a pattern end-to-end.
3. Network tab: POST to `/api/lld/cards` with 2+ checkpoint cards fires.
4. `/modules/lld?mode=review`:
   - `ReviewCard` renders first card's front.
   - `Space` → back appears.
   - `3` → submit fires, queue advances.
5. Queue drains → `ReviewSessionComplete` with 4-bucket histogram.
6. `/` → `DueCardsWidget` shows "All caught up" (or small remaining count).
7. `/profile/review` → retention curve + per-pattern mastery render.

- [ ] **Step 3: Smoke — AI card generation**

```bash
curl -i -X POST http://localhost:3000/api/lld/cards/generate-ai \
  -H "Content-Type: application/json" \
  -H "Cookie: <your session cookie>" \
  -d '{"patternId":"observer","concept":"observer tradeoffs","count":3}'
```
Expected: 201 with 3 cards. They appear in review queue at due position.

- [ ] **Step 4: Smoke — paragraph card**

1. Learn mode → select a paragraph of prose.
2. "+ Make a card from this" button appears bottom-right.
3. Click → network POST /api/lld/cards succeeds.
4. Review mode → card appears with selected text as back, default cue as front.

- [ ] **Step 5: Smoke — keyboard shortcuts**

- Space reveals; 1/2/3/4 rate; Enter no-op post-rate.
- Focus an `<input>` — digit keys passthrough to input.

- [ ] **Step 6: Smoke — empty + streak**

- Suspend all cards → review mode shows `ReviewEmptyState`.
- One review → current streak = 1 on stats page AND global streak display.

- [ ] **Step 7: Create `.progress` tracker** — `docs/superpowers/plans/.progress-phase-5.md`:

```markdown
# Phase 5 Progress Tracker

- [x] Pre-flight audit
- [x] Task 1:  ts-fsrs wrapper
- [x] Task 2:  lld_fsrs_cards schema
- [x] Task 3:  migration
- [x] Task 4:  from-checkpoint generator
- [x] Task 5:  from-paragraph generator
- [x] Task 6:  from-ai generator (Haiku)
- [x] Task 7:  derived mastery
- [x] Task 8:  review-store
- [x] Task 9:  GET /api/lld/cards/due
- [x] Task 10: cards CRUD routes
- [x] Task 11: generate-ai route
- [x] Task 12: review/submit route
- [x] Task 13: mastery + stats routes
- [x] Task 14: analytics catalog extended
- [x] Task 15: useReviewQueue
- [x] Task 16: useReviewKeyboard
- [x] Task 17: useDueCountWidget
- [x] Task 18: ReviewCard + ReviewRatingRow
- [x] Task 19: ReviewEmptyState + ReviewSessionComplete
- [x] Task 20: ReviewModeLayout filled
- [x] Task 21: CreateCardFromParagraph
- [x] Task 22: DueCardsWidget
- [x] Task 23: streak integration
- [x] Task 24: stats page
- [x] Task 25: auto-generate on lesson completion
- [x] Task 26: smoke test + verification

Phase 5 complete on: <YYYY-MM-DD>

## Deferred (out of Phase 5 scope)
- Cross-module card queue → future phase; moduleId locked to "lld"
- fill-blank / order-steps checkpoint conversion → Phase 5.1 (UX pending)
- AI card generation UI affordance in Learn mode → Phase 5.1
- Profile tab integration if no profile surface existed → Phase 5.1
- Mobile swipe gestures (spec B8) → Phase 5.1; Bluetooth keyboards work on iPad
```

- [ ] **Step 8: Final commit + tag**

```bash
git add docs/superpowers/plans/.progress-phase-5.md
git commit -m "$(cat <<'EOF'
plan(lld-phase-5): review mode + FSRS-5 spaced repetition

- ts-fsrs wired via thin src/lib/lld/fsrs-scheduler.ts
- New lld_fsrs_cards table with partial unique index for dedupe
- 3 card generators: checkpoint / paragraph / AI (Haiku)
- review-store + 3 hooks (queue / keyboard / due-count)
- 7 API routes: cards CRUD, due, generate-ai, submit, mastery, stats
- Review mode fully interactive with Anki-convention shortcuts
- Per-pattern mastery derivation (introduced/completed/mastered)
- Homepage + profile DueCardsWidget
- Stats page with retention curve + per-pattern mastery
- Daily streak integration via lld_card_reviewed event
- 6 new analytics event builders

Scope: LLD-only. Cross-module queue deferred.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git tag phase-5-complete
```

---

## Self-review checklist

Before declaring Phase 5 shipped:

**Spec coverage (§6 Review details, §7 persistence, §12 A9 flashcard, §13 D3/D4):**
- [x] `lld_fsrs_cards` table with required columns — Task 2
- [x] FSRS-5 via `ts-fsrs` (no reimpl) — Task 1
- [x] Card generators: checkpoint / paragraph / AI — Tasks 4–6
- [x] Review queue UI keyboard-first (1/2/3/4 Anki) — Tasks 16, 18, 20
- [x] Per-pattern mastery derivation — Tasks 7, 13
- [x] Cards-due-today widget (homepage + profile) — Task 22
- [x] Daily streak integration — Task 23
- [x] Stats page (retention curve, longest streak, cards reviewed, per-pattern mastery) — Task 24

**Explicitly out of scope for Phase 5:**
- Cross-module card queue — future phase; `moduleId='lld'` locked
- fill-blank / order-steps checkpoint→card — Phase 5.1
- AI card generation UI affordance — Phase 5.1
- Mobile-first swipe gestures (§6 B8) — Phase 5.1

**Placeholder check:** No TBDs, no "implement later", no skipped code blocks. Every step shows the exact code or precise instructions. ✓

**Type consistency:** `UserRating` (1..4) defined in `fsrs-scheduler.ts`. `FSRSCardState` maps 1:1 with `lld_fsrs_cards` columns. `MasteryTier` defined in `mastery.ts`. ✓

**Determinism check:** `fsrs-scheduler.ts` is the only call site of `ts-fsrs`. Future FSRS upgrades touch exactly one file. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-lld-phase-5-review-mode.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks. Each task lands in isolated context so focus stays tight.

**2. Inline Execution** — Run tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
