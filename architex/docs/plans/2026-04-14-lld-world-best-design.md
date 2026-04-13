# LLD World Best — Unified Design Document

> Synthesized from 3 Opus agent research reports: UX Researcher, Content Strategist, Tech Architect

## The Vision

Transform Architex LLD from a "pattern encyclopedia with quizzes on the side" into a **contextual learning system** where every interaction reinforces the thing you're studying. When Builder is open, EVERYTHING is about Builder.

---

## Part 1: Context-Aware Bottom Panel (UX)

### Architecture: Tabs are computed, not configured

```
f(mode, selectedItem) → Tab[]
```

### Pattern Mode (36 patterns) — 6 tabs:

| # | Tab | Content | Data Source |
|---|-----|---------|-------------|
| 1 | **Explain + Code** (auto-open) | Description, analogy, tradeoffs + Generated TS/Python/Mermaid | `pattern.*` fields |
| 2 | **Quiz: {Pattern}** | 3-5 questions ONLY about this pattern | `predictionPrompts` + `confusedWith` + `commonMistakes` |
| 3 | **Confused With** | Side-by-side comparison with confused patterns | `confusedWith[]` data |
| 4 | **Scenario** | Filtered scenarios where this pattern is the answer | `quiz_questions` filtered by `patternId` |
| 5 | **Daily Challenge** | Contextual to THIS pattern, rotating types (draw/code/explain/compare/apply) | Generated from pattern data + FSRS scheduling |
| 6 | **Interview Prep** | Tips + mock Q&A + common follow-ups | `interviewTips[]` + `commonMistakes[]` + new interview Q&A |

**Resilience patterns ONLY (4 patterns):** Extra "Simulate" tab → existing `PatternBehavioralSimulator`

### SOLID Mode — 5 tabs:
1. Before vs After (auto-open)
2. Quiz: {Principle} — filtered
3. Spot the Violation — interactive exercise
4. Patterns That Fix This
5. Daily Challenge — principle-specific

### Problem Mode — 5 tabs:
1. Requirements (auto-open) — progressive hints (gated)
2. Patterns Used — from `keyPatterns[]`
3. Reference Solution — LOCKED initially (unlock after attempt or 15 min)
4. Related Problems
5. Interview Mode — timed, blank canvas

### Sequence Mode — 4 tabs:
1. Flow Explanation (auto-open)
2. Latency Analysis
3. What Could Go Wrong?
4. Quiz: Trace the Flow

### State Machine Mode — 4 tabs:
1. States & Transitions (auto-open)
2. Simulate — interactive state runner
3. Edge Cases
4. Pattern Connection

### Features moved OUT of tabs:
- **Flashcards** → Floating widget / sidebar toggle (cross-pattern review tool)
- **Study Plan** → Dedicated page/modal (meta-layer, not per-pattern)
- **Progress Map** → Sidebar view (36-pattern grid, color-coded by mastery)
- **Streak Counter** → Top bar, always visible

### Auto-open intelligence:
- First visit to pattern → Explain + Code tab
- Returning visit (already seen) → Quiz tab (test, don't re-read)

---

## Part 2: Content Model (7 New Content Types)

All fit in existing `module_content` + `quiz_questions` tables. **Zero new DB tables.**

### P0 Priority:

**1. Pattern Walkthroughs** (~200 steps)
```typescript
interface PatternWalkthroughStep {
  stepNumber: number;
  title: string;                  // "The Problem: Telescoping Constructors"
  description: string;            // 2-4 sentences
  highlightedClassIds: string[];  // UML classes to pulse on canvas
  highlightedRelIds: string[];
  codeSnippet?: string;
  keyInsight: string;             // bold one-liner takeaway
}
```
- contentType: `'pattern-walkthrough'`
- ~5-7 steps per pattern × 36 patterns

**2. Problem Guides** (~660 items)
```typescript
interface ProblemGuide {
  progressiveHints: Array<{ hintNumber, unlockAfterMinutes, category, hint, whyItHelps }>;
  solutions: Array<{ name, approach, classes[], relationships[], patternsUsed[], prosAndCons[] }>;
  evaluationRubric: Array<{ criterion, weight: "must-have"|"nice-to-have"|"bonus", passingExample, failingExample }>;
  timeBreakdown: Array<{ phase, minutes, deliverable }>;
}
```
- contentType: `'problem-guide'`
- 33 problems × ~20 sub-items each

### P1 Priority:

**3. Interview Q&A Bank** (~260 items)
```typescript
interface InterviewQuestion {
  question: string;
  modelAnswer: string;            // 200-400 words
  difficulty: "warmup" | "core" | "deep-dive" | "gotcha";
  category: "explain" | "compare" | "apply" | "critique" | "whiteboard";
  timeLimit?: number;
  followUps: Array<{ question, expectedPoints[] }>;
  evaluationCriteria: string[];
}
```
- contentType: `'interview-qa'`
- ~4-6 questions per pattern

**4. Quiz Types (6 new beyond MCQ)** (~561 items)
- code-completion, pattern-identification, scenario-match, debug, draw-from-memory, ordering
- All fit in existing `quiz_questions` table with new `quizType` discriminators

### P2 Priority:

**5. Anti-Patterns** (~90 items) — bad code + fixed code + explanation
**6. Production Code Examples** (~108 items) — Knex, argparse, React-Email, etc.

### P3 Priority:

**7. Pattern Evolution** (~144 configs) — skill-level filtering (beginner→expert)

### Total: ~1,400 content items, ~285K words

---

## Part 3: Technical Architecture

### Feature 1: FSRS-5 Spaced Repetition

**File: `src/lib/fsrs.ts`** — Pure algorithm, no dependencies
- `scheduleFSRS(card, rating)` → { stability, difficulty, reps, lapses, fsrsState, nextReviewAt }
- FSRS-5 paper parameters (W[0..16])
- `retrievability(elapsedDays, stability)` → recall probability (0-1)

**API: `POST /api/review`** — Record review, update FSRS state
**API: `GET /api/review?moduleId=lld`** — Fetch items due for review

**Hook: `useReviewSession(moduleId)`** — Queue-based review session
- `currentItem`, `remaining`, `isComplete`, `submitReview(conceptId, rating)`

### Feature 2: PostgreSQL Full-Text Search

**Migration:** Add `tsvector` GENERATED column + GIN index on `module_content`
```sql
ALTER TABLE module_content ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B')
) STORED;
CREATE INDEX module_content_search_idx ON module_content USING GIN (search_vector);
```

**API: `GET /api/search?q=builder&module=lld`** — Full-text search with `ts_rank` + `ts_headline`
**Hook: `useSearch(module?)`** — `useDeferredValue` for built-in debounce

**Impact:** Removes 920KB static imports → zero bundle cost for search

### Feature 3: AI Pattern Explainer

**API: `POST /api/ai/explain`** — Send classes[] + relationships[] → Claude Sonnet analyzes
- Pattern identification with confidence scores
- Correctness checking (wrong relationships, missing abstractions)
- Improvement suggestions
- Rate limit: 10 calls/user/hour via `ai_usage` table
- Heuristic fallback when no API key

### Feature 4: Learning Path Prerequisites

**File: `src/lib/lld/prerequisites.ts`** — DAG with Kahn's topological sort
- 25+ prerequisite edges (Observer→Mediator, Strategy→State, etc.)
- `buildLearningPath()` → ordered nodes with tier grouping
- `getUnmetPrerequisites(patternId, masteredIds)` → what to learn first

**API: `GET /api/learning-path?module=lld`** — Annotated with user progress
- `isMastered`, `isUnlocked`, `unmetPrerequisites` per pattern
- Mastery threshold: score >= 0.7

---

## Part 4: Implementation Phases

### Phase 1: Infrastructure (2-3 hours)
1. `src/lib/fsrs.ts` — FSRS algorithm (pure function)
2. `POST/GET /api/review` — Review API route
3. `src/hooks/use-due-reviews.ts` — Review hooks
4. SQL migration — Add tsvector + GIN index
5. `GET /api/search` — Search API route
6. `src/hooks/use-search.ts` — Search hook

### Phase 2: Context-Aware Bottom Panel (4-6 hours)
1. Create `ContextualBottomTabs` component
2. Define tab config per mode (pattern/SOLID/problem/sequence/state-machine)
3. Create new tab components: ConfusedWith, InterviewPrep, PatternQuizFiltered
4. Wire tab selection to context (activePattern → pattern tabs)
5. Move Flashcards/StudyPlan to sidebar/modal

### Phase 3: Content Generation (6-8 hours)
1. Generate walkthroughs for 36 patterns (AI-assisted)
2. Generate interview Q&A for top 20 patterns
3. Generate production code examples for top 15 patterns
4. Seed all into module_content table

### Phase 4: Learning Path + AI (3-4 hours)
1. `src/lib/lld/prerequisites.ts` — DAG
2. `GET /api/learning-path` — API route
3. `POST /api/ai/explain` — AI explainer
4. Progress map sidebar component

### Phase 5: Polish (2-3 hours)
1. Adaptive quiz difficulty
2. "Draw from memory" challenge mode
3. Mastery meter per pattern
4. Streak counter in top bar

---

## What Makes This A++++ (World Best)

1. **Context-aware everything** — every panel is about what you're studying
2. **Progressive difficulty** — beginner analogy → intermediate UML → advanced production code
3. **Active learning** — not just reading, but quizzing, drawing, coding, comparing
4. **Spaced repetition** — FSRS-5 ensures you remember patterns long-term
5. **Real-world connection** — actual GitHub code, not toy examples
6. **Interview-ready** — specific prep for each pattern with follow-up questions
7. **AI-powered** — "Explain my diagram" with pattern identification + correctness feedback
8. **Measurable mastery** — per-pattern mastery meter with prerequisites DAG
9. **No competitor does all of these together** — Refactoring Guru has articles, LeetCode has problems, Anki has flashcards. Architex unifies UML + code + quizzes + spaced repetition + AI feedback in one contextual experience.
