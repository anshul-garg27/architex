# LLD Module · The Architect's Studio Rebuild

> **Design spec** · consolidated from a 16-batch brainstorm with the product owner
>
> **Date:** 2026-04-20
> **Scope:** Complete rebuild + expansion of the Architex LLD (Low-Level Design) module
> **Goal:** Turn a good pattern-learning tool into **"the place engineers go to become architects"**
> **Status:** Design approved; implementation plan pending

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Unifying Thesis](#2-the-unifying-thesis)
3. [Primary Personas](#3-primary-personas)
4. [Q&A Decision Record (20 locked decisions)](#4-qa-decision-record)
5. [Core Architecture · 4-Mode System](#5-core-architecture)
6. [Mode Details](#6-mode-details)
7. [State, Routing, Persistence (DB-First)](#7-state-routing-persistence)
8. [Content Strategy](#8-content-strategy)
9. [Pedagogical Foundation](#9-pedagogical-foundation)
10. [UI Rebuild · The Architect's Studio](#10-ui-rebuild)
11. [Design System](#11-design-system)
12. [AI Integration](#12-ai-integration)
13. [Feature Catalog](#13-feature-catalog)
14. [Component Plan](#14-component-plan)
15. [Phased Rollout](#15-phased-rollout)
16. [Non-Goals](#16-non-goals)
17. [Open Questions](#17-open-questions)
18. [References](#18-references)

---

## 1. Executive Summary

The Architex LLD module today is a well-built interactive tool with 36 design patterns, 33 problems, an A*-routed UML canvas, and multi-language code generation. It's **~80% production-quality**. This spec captures a deliberate expansion — not a patch — that transforms it into a **category-defining learning experience** through four primary moves:

1. **A 4-mode system** (Learn / Build / Drill / Review) replacing today's single workspace, each mode optimized for a distinct learning intent.
2. **Opus-authored world-class content** — all 36 patterns rewritten by Claude Opus 4.7 to a "1000% quality" bar, structured by a 6-step teaching sequence.
3. **The Architect's Studio UI metaphor** — a ground-up visual rebuild that turns the product from a SaaS dashboard into a physical-feeling studio (drafting table, reference library, reading nook, examination room).
4. **130+ distinct features** across 16 categories — cognitive-science-backed pedagogy, breakthrough content formats, deep AI integration, editorial typography, humane lifecycle design, and a coherent narrative identity.

The scope is deliberately large. This is a 5-6 month, two-engineer build with a clear phased rollout: security + mode scaffolding → Learn/Review modes with content for 10 patterns → Drill mode + advanced features → breathtaking rebuild polish → full 36-pattern rollout. It is a bet that **depth and craft — visible, felt, remembered — is the moat no competitor can match in the next 24 months**.

---

## 2. The Unifying Thesis

> **Architex is not a tool. It is a place.**

Every other design-pattern learning platform in the market today looks like "form fields + save button". This is a deliberate departure. The entire module is designed as **an architect's studio** — the kind of space a working engineer would want to inhabit. A drafting table (Build mode). A reference library on the walls (pattern browser). A reading nook with a lamp (Learn mode). An examination room at the end of the hallway (Drill mode). A reading chair by the window for spaced review (Review mode).

Every UI element maps to a physical metaphor. Every transition feels like walking between rooms, not clicking through screens. Typography has texture. Motion has weight. Ambient sound and lighting (both optional) have space and time-of-day awareness. This is the Architex nobody expects, because nobody has built it.

### Why this thesis drives every subsequent decision

- **The 4-mode system** is not "tabs" — it's distinct *places* inside the studio.
- **The content strategy** prioritizes narrative and memorable prose, because a studio's library contains *books with authorial voice*, not wiki pages.
- **The design system** uses editorial typography (a serif for long-form lessons) because a studio has magazines and essays, not just UI chrome.
- **The motion language** uses weight and physicality (papers slide, doors open, shelves slide open) because a studio has physics.
- **The community features** (mentorship, Hall of Fame, solutions gallery) exist because studios are inhabited by architects in relationship, not users in isolation.

---

## 3. Primary Personas

The product must serve all four personas at once. Early decisions favor a **welcome banner + smart default** (Learn mode) rather than a forced onboarding gate.

| Persona | % traffic | Primary mode | Entry experience |
|---|---|---|---|
| **A — Absolute newcomer** (knows some programming, shaky on OOP) | ~15% | Learn | OOP primer → gentle first pattern |
| **B — OOP-familiar learner** (1-3y coding, no systematic pattern study) | ~50% | Learn | Hook → analogy → UML → checkpoint |
| **C — Interview-prep cruncher** (read GoF, needs retrieval drills) | ~30% | Drill | Skip to problems, timed mode |
| **D — Casual explorer** (anyone curious) | ~5% | Build | Open canvas |

**Default first-visit behavior** is Learn mode + a dismissable welcome banner offering all three paths. Returning users land on their last-used mode.

---

## 4. Q&A Decision Record

Twenty load-bearing decisions, made and locked during brainstorming:

| # | Decision | Chosen |
|---|---|---|
| Q1 | Content authorship | **A+Opus** — Claude Opus 4.7 hand-writes all 36 patterns to 1000% quality (world-class content is the moat) |
| Q2 | Learning path structure | **D** — Hybrid "Guided path" default (8-wave curation) + "All 36" toggle; nothing locked |
| Q3 | Checkpoint failure policy | **B** — Progressive reveal: attempt 1-2 show targeted `whyWrong`, attempt 3 reveals answer; skip always available. Maps to FSRS-5 Easy/Good/Hard/Again ratings |
| Q4 | Graduation criteria | **B** — 3-tier (Introduced ◐ / Completed ◉ / Mastered ★) with FSRS-driven decay from Mastered → Completed if review lapses |
| Q5 | FSRS review integration | **A** — 4th primary mode "Review" in switcher with badge count. Minimal mobile-first layout |
| Q6 | Mobile strategy | **C** — Tiered: Review mobile-first · Learn responsive (stacked) · Drill read-only on mobile · Build desktop-only with honest "open on desktop" nudge |
| Q7 | Canvas click in Learn | **C** — Popover on class click showing summary + list of lesson sections mentioning it + jump links |
| Q8 | Tinker permission | **B** — Temporary unlock: floating "Tinker" button, toolbar with Reset/Save-to-Build/Done. Scroll-sync pauses during tinker |
| Q9 | AI in Learn mode | **C** — Contextual (3 specific surfaces): after 3 failed checkpoints, at section end, at Confused-With panel |
| Q10 | Drill submission reveal | **B** — Tiered celebration: ⭐ 90+ confetti / ✓ 70-89 respect + tune-up / ◐ 50-69 coaching / ○ <50 strategic-next-step. AI-generated one-line feedback |
| Q11 | Cross-mode state policy | **B** — Smart boundaries: work persists (canvas, timer, scroll), transient UI discards (dropdowns, half-typed), 3 confirmation dialogs for ambiguous cases |
| Q12 | Drill problem starter | **C** — 3 sub-modes per problem: 🎯 Interview (blank, default), 🚂 Guided (starter classes loaded), ⚡ Speed (starter + no timer, no FSRS impact) |
| Q13 | Gamification volume | **C** — Calibrated: always-visible subtle pill (streak + patterns mastered, no XP); moment-of-earning celebrates; Dashboard has full depth for curious users |
| Q14 | Keyboard navigation | **C** — 3-tier layered: global shortcuts (⌘1-4 modes, ⌘K palette), mode-specific (J/K scroll in Learn, Space pause in Drill, 1-4/A-H-G-E in Review), palette fallback |
| Q15 | Frustration detection | **C** — 4-level escalating intervention: Calm = silent · Mild = inline nudge · Frustrated = AI offer · Very-Frustrated = easier-path card. Drill never intervenes mid-task |
| Q16 | Content loading strategy | **C** — Tiered prefetch: 5 foundation patterns eager (initial bundle) / next 10 warm via requestIdleCallback / remaining 21 cold + hover-prefetch / service worker = offline PWA |
| Q17 | Anonymous → auth migration | **C** — Smart hybrid: Case 1 (local+empty DB) silent auto-merge; Case 2 (both have data) confirmation dialog; Case 3 (clean) no-op. Tier-based merge (mastered > completed > introduced) |
| Q18 | Social & sharing | **C** — Light social: OG grade cards (95+) · optional public profile · existing gallery. No leaderboards/multiplayer/comments in V1 |
| Q19 | Analytics taxonomy | **C** — 25 typed events across 4 modes + cross-cutting. Dual-purpose (product PostHog + user dashboard). Typed event builders in `lib/analytics/lld-events.ts` |
| Q20 | Rollout strategy | **C** — 5-wave phased ramp: Internal → Alpha opt-in → Anonymous 100% → Authenticated 10→50% → Full + kill switches on drill error >5% or completion drop >20% |

---

## 5. Core Architecture · 4-Mode System

### The shell

One URL (`/modules/lld`). One shared shell. The shell provides:

- **Top chrome**: breadcrumb + **mode switcher pill** (Learn | Build | Drill | Review) + notification bell + settings
- **Left icon rail** (Architex-wide module navigation, unchanged)
- **Main content area**: swaps per mode (see §6)
- **Status bar**: contextual live info (§10, L10)

The mode switcher is the single most important UI element. State lives in `ui-store.lldMode: "learn" | "build" | "drill" | "review" | null` (null = first visit).

### Mode resolution logic

```typescript
function resolveLLDMode(): LLDMode {
  if (searchParams.mode) return searchParams.mode;        // URL wins
  const stored = uiStore.getState().lldMode;
  if (stored) return stored;                              // Last-used
  uiStore.setState({ showLLDWelcomeBanner: true });
  return "learn";                                          // First-visit default
}
```

### Three design invariants

1. **Build mode stays untouched.** Today's 4-panel LLD UI becomes Build mode's content. Zero regression risk for existing users.
2. **Mode is a single piece of state.** Persisted to localStorage (cache) + `userPreferences.preferences.lld.mode` (DB-first source of truth). URL-reflectable via `?mode=learn` for sharing.
3. **All modes share one content source.** Same `DesignPattern`, `LLDProblem` objects drive all 4 modes. No content duplication.

### Shared services (all 4 modes consume)

- Pattern catalog (36 patterns, `src/lib/lld/patterns.ts`)
- Problem catalog (33 problems, `src/lib/lld/problems.ts`)
- Grading engine (`src/lib/lld/grading-engine.ts`)
- Progress store (with 11 FSRS fields)
- Canvas engine (React Flow, A* routing, Dagre layout)
- Claude AI client (singleton with queue + cache)

---

## 6. Mode Details

### 📖 Learn mode — "Brilliant.org inside a UML canvas"

**Purpose**: Teach a pattern from zero, emphasize narrative and retention.

**Layout (desktop)**: 3-column — 180px pattern list sidebar + center read-only canvas + 380px lesson column.

**Lesson structure (8 sections per pattern)** — from brand voice doc's 6-step teaching sequence, extended:

1. **Hook** — Problem scenario. Concrete, specific, 2-3 sentences.
2. **Analogy** — Real-world mapping. Concrete nouns, memorable.
3. **UML Reveal** — Classes introduced progressively, canvas highlights each as lesson references it (scroll-sync).
4. **Checkpoint** — One of 4 types (MCQ, click-class, fill-blank, order-steps). Progressive reveal on failure (Q3).
5. **Code** — Working example in user's preferred language, <40 lines, annotated.
6. **Tradeoffs** — "You gain X. You pay Y." Explicit cost-benefit.
7. **Summary** — Exactly 3 bullets. Flashcard-sized.
8. **CTA** — "Switch to Build mode" or "Try a problem".

**Scroll-sync**: As user scrolls lesson, canvas highlights the classes being discussed. Click a class → popover with list of sections mentioning it (Q7).

**Tinker mode**: Floating "✏️ Tinker" button unlocks edits temporarily (Q8). Toolbar with Reset / Save-to-Build / Done. Scroll-sync pauses during tinker.

**AI surfaces** (Q9):
- After 3 failed checkpoint attempts → "Want a deeper explanation? [Ask the Architect →]"
- At end of each section → "Questions about this section? [Ask →]"
- On Confused-With panel → "Ask me about their difference in your codebase"

**Frustration escalation** (Q15): Inline nudge (mild) → AI offer (frustrated) → easier-path card using DAG (very-frustrated).

**Content format add-ons (from later batches)**:
- Anti-pattern museum toggle (CT/C2)
- Real-world case studies section (C3)
- Pattern origin stories (C9, condensed)
- Pattern personality sketch (CT6)
- "In the wild" GitHub snippets (C5)
- Elaborative interrogation prompts (CS3)
- Teach-back mode (CS7)

---

### 🎨 Build mode — current 4-panel UI, unchanged

**Purpose**: Free-form design exploration. Power users.

**Layout**: Exactly today's LLD studio — sidebar (pattern/problem/SOLID browser) + canvas + properties panel + bottom tab panel.

**Scope**: Zero component changes. Wrap in `BuildModeLayout.tsx` for consistency. All existing sidebar modes preserved, all bottom tabs preserved.

**Additions (from batches)**:
- Mode switcher in top chrome (new shell element)
- Pattern tabs (L3) — browser-style tabs for multiple open patterns
- Split-view (L4) — compare two patterns side-by-side
- Resizable panels (L1), collapsible panels (L2)
- Right-click context menu expansion (L9)
- Smart zoom menu (L6), alignment guides (L8)
- Anti-pattern detector (A4) — live Claude analysis on idle
- Pattern recommendation engine (A5)
- AI review enhanced (existing, minor polish)
- Multi-select batch actions (I9)

---

### ⏱️ Drill mode — timed interview simulation

**Purpose**: Interview prep. Realistic, measurable, retention-building.

**Layout**: 3-zone body + top problem statement + top-right timer + submit bar + collapsible AutoGrader at bottom.

**Three sub-modes per problem (Q12)**:

- 🎯 **Interview** (default) — blank canvas, realistic interview conditions, timer runs, counts toward FSRS.
- 🚂 **Guided** — starter classes pre-loaded, focus on pattern-relevant structure, timer runs.
- ⚡ **Speed** — starter + no timer, pure practice, doesn't affect FSRS stats.

**Grading** (Q10 reveal choreography):
- Tier-based celebration: ⭐ 90+ confetti / ✓ 70-89 coaching / ◐ 50-69 path forward / ○ <50 strategic redirect
- Always show 4-category breakdown (Classes 40% / Relationships 30% / Pattern Usage 20% / Completeness 10%)
- AI-generated one-line feedback via existing Claude client
- Tier-based next-action (90+: next problem; <50: "Open Learn mode for State pattern")

**Hint system** (existing 3-tier): Nudge (1cr) / Guided (3cr) / Full (5cr). 15-credit budget per challenge.

**Frustration policy** (Q15): **Never intervenes mid-drill.** Simulation integrity. Post-submit intervention on repeated low scores.

**Additions**:
- Design with constraints (W2) — "Solve Parking Lot without inheritance"
- Mutation testing (W4) — spot-the-bug drills
- Hostile interviewer mode (W8) — AI plays skeptical senior
- On-call crisis simulator (X3) — random "PAGER ALERT" drills
- Design mysteries (X5) — whodunit problem format
- Company-style mock interviews (A7) — Amazon / Google / Meta rubrics

---

### 🔁 Review mode — FSRS spaced-repetition daily habit

**Purpose**: Retention. Short daily sessions (2-3 min) that cement learned patterns.

**Layout**: Minimal single-card view, phone-friendly. Big question, 3-4 options, rating row (Again/Hard/Good/Easy).

**Session flow**: Sequential 1-3 due patterns. One random checkpoint per pattern. User rates retention → FSRS updates → next card slides in.

**Keyboard** (Q14, Anki-inspired):
- `1..4` answer options
- `Space` reveal
- `A/H/G/E` rate
- `Enter` next

**Mobile (Q6)**: Hero mobile experience. Swipe gestures (X-left = Again, down = Hard, up = Good, right = Easy).

**Empty state**: "All caught up · come back tomorrow."

**New**:
- Swipe gestures on mobile (B8)
- Cold recall mode variant (CS6) — delayed quiz not embedded in lesson
- Confidence-weighted scoring (CS1) option for metacognition training

---

### Mode transitions (Q11 — Smart Boundaries)

The 10-row state preservation table:

| State | Policy |
|---|---|
| Learn scroll position | Persist per pattern (DB) |
| Checkpoint answers submitted | Persist forever (FSRS history) |
| Mid-typed fill-blank | Discard on switch |
| Tinker session unsaved | Warn + offer Save-to-Build |
| Build canvas state | Persist (existing) |
| Build selected node / panel state | Persist per session |
| Drill canvas + timer | Persist until submit/abandon; timer pauses on switch |
| Drill mid-submission | Warn + soft-block |
| Drill grade reveal | Persist 24h |
| Review session in progress | Persist per session |
| Popovers / dropdowns open | Close on switch |

Three confirmation dialog moments total: unsaved tinker, drill mid-submit, drill grade dismissal.

---

## 7. State, Routing, Persistence

### Philosophy: DB-first

Database is source of truth. localStorage is offline cache. Mutations write-through both. Offline: TanStack Query's `offlineFirst` mode queues mutations.

### Revised persistence table

| State | DB home | Cache | Sync pattern |
|---|---|---|---|
| Mode preference | `userPreferences.preferences.lld.mode` | localStorage | Write-through, debounce 1s |
| Welcome banner dismissed | `userPreferences.preferences.lld.welcomeBannerDismissed` | localStorage | Immediate |
| Build-mode scratch canvas | `userPreferences.preferences.lld.scratchCanvas` | localStorage + IndexedDB | Write-through, debounce 2s |
| Named saved diagrams | `diagrams` (existing) | TanStack Query | Explicit save |
| Learn scroll + step | `progress.metadata` JSONB | localStorage | Debounce 3s |
| Checkpoint answers | `activityEvents` + `progress.reps/lapses` | TanStack Query | POST on answer |
| Active drill | **new table** `lld_drill_attempts` | localStorage + 10s heartbeat | POST start / PATCH lifecycle |
| Drill completion history | `lld_drill_attempts` (submitted/abandoned) | TanStack Query | 5-min stale |
| Mode-switch timeline | `activityEvents` (event: "lld_mode_switched") | — | Fire-and-forget |

### New DB table: `lld_drill_attempts`

```sql
CREATE TABLE lld_drill_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id varchar(100) NOT NULL,
  drill_mode varchar(20) NOT NULL,  -- 'interview' | 'guided' | 'speed'

  started_at timestamp with time zone NOT NULL DEFAULT now(),
  paused_at timestamp with time zone,
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  abandoned_at timestamp with time zone,

  elapsed_before_pause_ms integer NOT NULL DEFAULT 0,
  duration_limit_ms integer NOT NULL,

  canvas_state jsonb,
  hints_used jsonb NOT NULL DEFAULT '[]',

  grade_score real,
  grade_breakdown jsonb
);

-- Enforce one active drill per user
CREATE UNIQUE INDEX one_active_drill_per_user
  ON lld_drill_attempts(user_id)
  WHERE submitted_at IS NULL AND abandoned_at IS NULL;

CREATE INDEX drill_history_idx ON lld_drill_attempts(user_id, submitted_at);
```

### Stale drill handling

- 10s heartbeat updates `last_activity_at`.
- On user return: `GET /api/lld/drill-attempts/active`. If `last_activity_at < now - 30min`, server auto-abandons and returns fresh state.
- UI shows "Your last drill was abandoned. Restart?" for stale; "Resume · 12:34 remaining" for recent.

### New API routes (6)

```
GET    /api/user-preferences
PATCH  /api/user-preferences/lld
POST   /api/user-preferences/lld/migrate          // anonymous → user
GET    /api/lld/drill-attempts/active             // with auto-abandon logic
POST   /api/lld/drill-attempts                    // start (409 if one's already active)
PATCH  /api/lld/drill-attempts/:id                // pause/resume/heartbeat/submit/abandon
GET    /api/lld/drill-attempts?status=completed   // history
```

### URL ↔ store sync

Single hook `useLLDModeSync()`:

```typescript
// URL → store (on mount, navigation)
useEffect(() => {
  const urlMode = searchParams.get("mode");
  if (isValidMode(urlMode) && urlMode !== mode) setMode(urlMode);
}, [searchParams]);

// store → URL (on mode change)
useEffect(() => {
  if (mode && searchParams.get("mode") !== mode) {
    router.replace(`?mode=${mode}`, { scroll: false });  // replace, not push
  }
}, [mode]);
```

### Anonymous → authenticated migration (Q17)

Server runs 3-case decision tree on login:

- **Case 1** — localStorage has data, DB empty: **silent auto-merge** + welcome toast.
- **Case 2** — both have data: **confirmation dialog** ("Keep account's 12 patterns; merge this browser's 5 if newer").
- **Case 3** — clean: **no-op**.

Merge rules per pattern:
- DB-only → keep DB
- Local-only → insert to DB
- Both → higher tier wins (Mastered > Completed > Introduced); for ties, latest `updatedAt` wins.

---

## 8. Content Strategy

### Authorship: Claude Opus 4.7 hand-writes all 36 patterns (Q1)

**Quality bar**: 1000% — the *best* content on design patterns anywhere on the internet. Benchmarks to beat: Refactoring Guru, Head First Design Patterns, Gang of Four original.

**Authoring protocol**:
1. Use the 6-step teaching sequence from `docs/CONTENT_STRATEGY.md`.
2. Honor the brand voice rules: clarity > cleverness, confidence without arrogance, respect the learner's time.
3. Specific, concrete, never generic.
4. Every code example: working, <40 lines, annotated.
5. Every analogy: concrete nouns, memorable, technically accurate.
6. Every tradeoff: honest "you gain X / you pay Y" phrasing.

**Voice variants (W10 ELI5/Standard/ELI-Senior)**:
- **ELI5**: warm analogies, no jargon
- **Standard**: the default lesson voice
- **ELI-Senior**: no hand-holding, technical depth, acronyms expected

All three variants of every section written by Opus.

### Learning path structure (Q2)

8-wave curation in recommended order:

- **Wave 1 · Foundations (5)**: Singleton → Factory Method → Builder → Abstract Factory → Prototype
- **Wave 2 · Communication (6)**: Observer → Mediator → Command → Chain of Responsibility → Iterator → Visitor
- **Wave 3 · Behavior (5)**: Strategy → State → Template Method → Memento → Interpreter
- **Wave 4 · Structure (7)**: Adapter → Bridge → Facade → Decorator → Composite → Proxy → Flyweight
- **Wave 5 · Modern (4)**: Module → Event Emitter → Async Patterns → Reactive Patterns
- **Wave 6 · Resilience (4)**: Timeout → Retry → Circuit Breaker → Bulkhead
- **Wave 7 · Concurrency (2)**: Thread Pool → Work Queue
- **Wave 8 · AI-Agent (3)**: Tool Use → Agent Loop → ReAct Pattern

Each wave = milestone. Completing a wave unlocks a certificate (G4).

**Nothing is locked** per Q2. "Guided path" is the default recommendation; "All 36 patterns" toggle for free navigation.

### Additional content formats

Beyond the 8-section lesson, each pattern page includes:

- **Anti-pattern toggle** (C2) — "see the before version"
- **Design disaster war story** (CT2) — Knight Capital, AWS S3, real outages
- **Pattern battle card** (CT3) — Pokemon-style comparison
- **Pattern personality sketch** (CT6) — Ishiguro-grade character prose
- **Pattern dialogues** (CT7) — scripted conversations ("Observer vs Pub-Sub Debate")
- **System archaeology exercise** (CT5) — find this pattern in legacy code
- **Choose-your-own-design-adventure** (CT4) — branching interactive fiction per pattern
- **Cross-domain transfer** (X6) — "this pattern in biology, music, city planning"
- **Real-world case studies** (C3) — "Netflix uses Circuit Breaker in Hystrix"
- **"In the wild" GitHub snippets** (C5) — curated real code examples
- **Stack Overflow FAQ** (C9) — top questions engineers actually ask
- **Pattern origin story** (C9, Batch 3) — "Gamma coined this in 1995"
- **Side-by-side multi-language** (C7, A8) — TS / Py / Java / Go / Rust / Kotlin columns
- **Audio narration** (C8) — 5-8 min podcast-style

### Content quality signaling

Extend `moduleContent`:
```typescript
contentQuality: "draft" | "polished" | "published" // DEFAULT "polished"
generatedBy: "human" | "ai" | "hybrid"
```

All launch content = `polished/hybrid` (Opus + human review).

---

## 9. Pedagogical Foundation

The design is rooted in published cognitive science (already cited in README — Mayer, Sweller, Bjork, Paivio, Kapur, Roediger/Karpicke).

### 10 cognitive science features (all from Batch 11)

- **CS1 Confidence-weighted checkpoints** — metacognition calibration. Before answering, user rates 1-5 confidence. Score = accuracy × confidence. Overconfidence penalized. Teaches self-awareness.
- **CS2 Interleaved practice** — "Mixed drill" mode, 5 random problems across 5 patterns per session. Pattern type not revealed until user identifies. 30-50% better transfer (Rohrer 2007).
- **CS3 Elaborative interrogation** — After each lesson, 3 "why?" prompts. AI grades free-text answers for depth. Generating explanations = 2x retention.
- **CS4 Productive failure** — Optional pre-lesson design challenge: try it yourself (20 min) before being taught. Kapur research: 2-3x retention.
- **CS5 Fading worked examples** — Scaffolding gradient across 5 problems: fully shown → fill methods → fill signatures → build skeleton → blank.
- **CS6 Cold recall** — 5-min timed quiz 10 minutes after lesson ends. Tests what actually stuck vs what was just recognized.
- **CS7 Teach-back mode** — Feynman technique. User explains to "AI intern" who asks probing follow-ups.
- **CS8 Anti-pattern hunt** — 5-min find-the-bug drill in a broken diagram. Trains code review skills.
- **CS9 Design debate** — 3-round argument with AI taking opposite side. Trains interview articulation.
- **CS10 Daily intention + reflection** — 30-sec rituals: opening intention, end-of-session reflection. Metacognitive journaling.

All 10 are implemented, not as add-ons but as first-class interaction modes inside Learn and Drill.

---

## 10. UI Rebuild · The Architect's Studio

The full-scale visual rebuild. **Cost: ~400-600h** (acknowledged and approved).

### The concept

Every UI element maps to a physical studio metaphor.

| Metaphor | Mode / surface |
|---|---|
| 📐 Drafting table | Build mode |
| 📚 Reference library (wall shelves) | Pattern browser |
| 📖 Reading nook with lamp | Learn mode |
| 📝 Examination room | Drill mode |
| 🪑 Reading chair by window | Review mode |
| 📔 Notebook on side table | Personal notes (I5) |
| 🔖 Marked-up manuscripts | Canvas annotations (I6 — deferred) |
| ✒️ Signed drawings | Personal architect signature (R9) |

### The 12 rebuild features (all locked)

- **R1 Cinematic cold open** — 15-sec fade-in film on first-ever visit. "Every system you've ever used was built from 36 ideas. Let's learn them." Text, piano, one-time.
- **R2 Spatial home** — isometric studio view, not a dashboard. Drafting table center, shelves on walls, notebook, door to exam room. Click = navigate.
- **R3 Patterns as rooms** — opening Observer = "walking into Observer's room". Walls = UML, floor = code, ceiling = metadata, door = confused-with patterns.
- **R4 Radial command interface** — long-press anywhere on canvas → radial menu blooms. Figma-style.
- **R5 Editorial typography** — introduce a serif family (Cormorant Garamond or similar) for long-form lesson prose. NYT Magazine feel. Geist Sans stays for UI chrome, Geist Mono for code.
- **R6 Gesture grammar** — pinch to zoom, two-finger rotate, three-finger swipe between patterns, pinch-out to exit mode.
- **R7 Ambient soundscape + dynamic lighting** — optional (off by default): subtle soundscape per category (light rain + paper rustle for Creational, server-room hum for Resilience). Canvas background subtly shifts warm/cool with local time.
- **R8 Fluid translucent layers** — no hard panel edges. Apple-style. Sidebar and properties breathe with backdrop-blur. Overlap is material.
- **R9 Personal architect signature** — user draws a signature once at sign-up. Every saved diagram is signed like a blueprint. Shared diagrams display the signature.
- **R10 Presentation mode native** — click "Present" → diagram auto-generates 5-8 slide deck (Title → Problem → reveals → Tradeoffs). Self-paced or timed. For interviews, team demos, docs.
- **R11 Code ⇄ UML always dual-view** — main view 50/50 split. Edit code → UML updates live. Drag class → code regenerates. Uses existing `bidirectional-sync.ts`.
- **R12 First-time ritual** — 4-screen onboarding as welcome, not signup: cinematic intro → "Sign the guest book" → "Pick your first pattern to meet" → door opens to your studio. 90 seconds total.

### Typography system (extends existing)

| Family | Use |
|---|---|
| **Cormorant Garamond** (new) | Long-form lesson prose, hook headlines, architect personality sketches |
| Geist Sans (existing) | UI chrome, buttons, labels, status text |
| Geist Mono (existing) | Code, technical values, timestamps |
| User's signature font (handwritten) | Blueprint signatures |

Scale unchanged from existing design system spec. New text styles added:

- `--text-editorial-display`: 28px Cormorant regular, -0.02em tracking, 1.15 line-height — hook headlines
- `--text-editorial-body`: 14px Cormorant regular, 1.7 line-height — lesson prose
- `--text-editorial-quote`: 14px Cormorant italic — pull quotes, analogies

### Color themes (P1)

Six curated themes:

1. **Midnight** (default) — current dark palette, violet accent
2. **Parchment** — sepia warm, brown ink
3. **Terminal** — green on black, monospace everything
4. **Neon** — cyberpunk pink + cyan
5. **Bright** — default light mode
6. **High Contrast** — accessibility, yellow + cyan on black

---

## 11. Design System

### Motion (from existing motion.ts, extended)

All motion respects `prefers-reduced-motion`.

**Pattern signature animations (M1)** — each of 36 patterns has a unique 3-5s motion signature:
- 🧘 Singleton — one class pulses gently at center, alone
- 📢 Observer — subject emits waves toward subscribers
- 🏭 Factory Method — Creator produces concrete products cascading down
- ⚡ Circuit Breaker — edge pulses, snaps/blocks on failure threshold
- 🔧 Strategy — concrete strategies slide in/out of context slot
- 🧅 Decorator — wrappers nest around core class like rings

Opus writes each as motion.dev keyframes. ~45min per pattern. Played once on pattern open, optional replay.

**Runtime particle flow (M2)** — "▶ Play" button simulates pattern execution. Particles flow through class graph as method calls fire. Extends existing `ParticleLayer` from system design.

**Progressive class reveal (M3)** — canvas starts near-empty, classes fade in + scale up as lesson scrolls past them.

**Magnetic hover (M4)** — hover class → connected classes share accent glow; non-connected dim to 40%.

**Mode-switch choreography (M5)** — 300ms transition. Content slides in direction of target mode. Builds spatial muscle memory.

**Tinker unlock ceremony (M6)** — shimmer + border shift + toolbar slide.

**Drill timer heartbeat (M7)** — pulse at 5:00, accelerates at 1:00.

**Ambient canvas breathing (M8)** — existing particle drift amplifies on 10s idle.

### Micro-delights (from Batch 9)

- **P5** Skeleton loaders shaped like content (UML skeletons, not generic spinners)
- **P6** Empty state illustrations with character per mode
- **P7** Typewriter streaming for AI responses
- **P8** Toast stack choreography (older fades + scales down)
- **P9** Hover lift + press depth (2px translateY + shadow)
- **P10** Loading messages that evolve ("Reading classes... ✓ Matching patterns... ◐")
- **P11** Haptic-style visual feedback (ripple on click, shake on error, bounce on correct)
- **P12** Sound design (optional, off by default): correct pop, wrong oof, achievement ping, click sounds

### Shadows (existing 4-layer, unchanged)

---

## 12. AI Integration

### Claude infrastructure (existing)

- Singleton client with concurrency queue (max 3 parallel)
- IndexedDB response cache (1h TTL)
- Per-user rate limit (10/hour via `aiUsage` table)
- Graceful fallback when `ANTHROPIC_API_KEY` missing (heuristic-based)
- Cost tracking (Haiku $0.80/$4.00, Sonnet $3/$15 per 1M tokens)

### 9 AI features (all from Batch 4)

- **A1 GitHub repo analysis** — connect repo URL, Claude identifies patterns in use. Reports "Found Singleton in `db/pool.ts:12`. Opportunity: Strategy in `payment/processor.ts:23`." Pro tier. Cost: ~10k tokens per analysis = $0.03 per run (Sonnet).
- **A2 AI-generated custom scenarios** — free-text problem prompt → custom LLD problem with requirements, starter classes, hints. Infinite pool. Pro tier, cap 10/day free.
- **A3 Socratic rubber duck** — after user builds in Drill, click "Explain out loud" → voice (Whisper) or typed. Claude plays interviewer, asks probing questions.
- **A4 Anti-pattern detector** — live in Build mode, debounced 10s of inactivity. Claude (Haiku) flags god class, deep inheritance, circular deps. Click for explanation.
- **A5 Pattern recommendation engine** — heuristic first (fast), then Claude proposes specific refactor with ghost-preview diagram.
- **A6 Personalized study plan** — Claude analyzes FSRS data + mastered patterns + drill results. Returns day-by-day 2-week plan.
- **A7 Company-style mock interviews** — Drill preset: Amazon (bar-raise simplicity), Google (algorithmic complexity), Meta (scaling), Stripe (idempotency), Uber (microservices). Company-specific system prompts.
- **A8 AI-translated code** — pattern in Go, Rust, Kotlin, Swift, C++, Elixir on demand. Cached per pattern-language combo.
- **A9 AI flashcard generator** — one-click "generate flashcards" from any lesson → 5-8 FSRS cards. Haiku.

### Contextual AI in Learn mode (Q9)

Three specific surfaces only:
1. After 3 failed checkpoint attempts
2. At end of each lesson section
3. On Confused-With panel

Each invocation carries **rich context** (which pattern, section, checkpoint) → Claude answers specifically, not generically. Token-bounded: ~$0.03 per heavy learner session.

---

## 13. Feature Catalog

Full feature list by category (every idea from the 16-batch brainstorm, grouped for implementation planning):

### V · Visual Language (8)
V1 Pattern-specific accent themes · V2 Editorial typography hierarchy · V3 Canvas aesthetic variants (Paper/Whiteboard/Terminal) · V4 Pattern mascot illustrations · V5 Pressure palette for grading states · V6 Edge personality variants · V7 Reading-mode overlay · V8 Empty-state storytelling quotes

### M · Motion (8)
M1 Pattern signature animations · M2 Runtime particle flow · M3 Progressive class reveal · M4 Magnetic hover · M5 Mode-switch choreography · M6 Tinker unlock ceremony · M7 Drill timer heartbeat · M8 Ambient canvas breathing

### C · Content (9)
C1 Interactive code playground · C2 Anti-pattern museum · C3 Real-world case studies · C4 Pattern genealogy graph · C5 GitHub snippets · C6 Draw-from-memory challenge · C7 Side-by-side multi-language · C8 Audio narration · C9 Pattern origin stories

### A · AI Features (9)
A1 GitHub repo analysis · A2 Custom scenarios · A3 Socratic rubber duck · A4 Anti-pattern detector · A5 Pattern recommendations · A6 Personalized study plan · A7 Company-style mock interviews · A8 AI-translated code · A9 Flashcard generator

### G · Growth & Identity (12)
G1 Embeddable widgets · G2 Browser extension · G3 VS Code extension · G4 LinkedIn certificates · G5 Pattern of the Day email · G6 Weekly deep-dive blog · G7 Accessibility as feature · G8 Easter eggs · G9 BYOK · G10 Public API · G11 Architex for Teams · G12 Alumni showcase

### L · Layout & Canvas (12)
L1 Resizable panels · L2 Collapsible panels · L3 Pattern tabs · L4 Split-view · L5 Zen mode · L6 Smart zoom · L7 Snap-to-grid · L8 Alignment guides · L9 Right-click menus · L10 Richer status bar · L11 Deeper breadcrumbs · L12 Intelligent minimap

### D · Data Visualization (5 selected)
D2 Skill radar · D3 Streak calendar · D4 FSRS retention curves · D6 Mastery tier donut · D8 Learning velocity curve

### I · Interactions (5 selected)
I2 Spotlight universal search · I4 Starred favorites · I7 Recent items jump list · I8 Custom tags · I9 Multi-select batch actions

### P · Personalization (11 selected)
P1 6-theme picker · P3 Default code language · P4 Customizable dashboard · P5 Skeleton loaders · P6 Empty state illustrations · P7 Typewriter AI · P8 Toast choreography · P9 Hover lift + press depth · P10 Loading messages that evolve · P11 Haptic visual feedback · P12 Sound design (opt-in)

### B · Finishing Touches (10)
B1 Smart onboarding tour · B2 Inline find · B3 Notification center · B4 Keyboard-navigable canvas · B5 Customizable shortcuts · B6 Data export (GDPR) · B7 Offline-first PWA · B8 Mobile swipe gestures · B9 Error pages with personality · B10 "Skip ahead" test

### CS · Cognitive Science (10)
CS1 Confidence-weighted · CS2 Interleaved practice · CS3 Elaborative interrogation · CS4 Productive failure · CS5 Fading worked examples · CS6 Cold recall · CS7 Teach-back · CS8 Anti-pattern hunt · CS9 Design debate · CS10 Daily intention

### CT · Content Formats (6 selected)
CT2 Design disasters · CT3 Pattern battle cards · CT4 CYOA adventures · CT5 System archaeology · CT6 Pattern personalities · CT7 Pattern dialogues

### W · Wild Cards (8 selected)
W2 Design with constraints · W4 Mutation testing · W5 Temporal critique (6-month mirror) · W6 Pattern linter (npm pkg) · W7 Community alternative solutions · W8 Hostile interviewer · W9 Git pattern mining · W12 UI rebuild commitment

### R · Rebuild (all 12)
R1 Cinematic cold open · R2 Spatial home · R3 Pattern rooms · R4 Radial command · R5 Editorial typography · R6 Gesture grammar · R7 Ambient sound + light · R8 Fluid layers · R9 Personal signature · R10 Presentation mode · R11 Dual-view · R12 First-time ritual

### X · Unexpected Directions (7 selected)
X3 On-call simulator · X5 Design mysteries · X7 Failure portfolio · X9 Physical product deck · X10 Job app assistant · X11 Hall of Fame · X12 Time capsule

### F · Humane Design (12)
F1 Welcome-back-no-guilt · F2 Permission to rest · F3 Quiet mode · F4 Mentorship pairing · F5 Trust dashboard · F6 Emergency support · F7 "While you wait" micro-lessons · F8 Optimistic UI · F9 Life-transition mode · F10 Growth loops · F11 Accessibility-as-feature · F12 Graceful sunset policy

**Total: 131 distinct features** (excluding unselected D1/D5/D7/D9/D10, I1/I3/I5/I6/I10, P2, CT1/CT8/CT9/CT10, W1/W3/W10/W11, X1/X2/X4/X6/X8).

---

## 14. Component Plan

### New files (high-level)

```
src/components/modes/lld/
├── LLDShell.tsx                    // NEW — top-level shell with mode switcher
├── ModeSwitcher.tsx                // NEW — 4-pill switcher
├── WelcomeBanner.tsx               // NEW — first-visit banner
├── learn/
│   ├── LearnModeLayout.tsx         // NEW — 3-col
│   ├── LessonColumn.tsx            // NEW — 8-section container
│   ├── LessonSection.tsx           // NEW — individual section
│   ├── useLessonScrollSync.ts      // NEW — scroll → highlight canvas
│   ├── ClassPopover.tsx            // NEW — Q7 popover
│   ├── TinkerToolbar.tsx           // NEW — Q8 tinker overlay
│   └── ContextualAskArchitect.tsx  // NEW — Q9 3-surface AI
├── build/
│   ├── BuildModeLayout.tsx         // NEW — wraps existing 4-panel
│   └── (existing components unchanged)
├── drill/
│   ├── DrillModeLayout.tsx         // NEW — 3-zone + bars
│   ├── DrillStartModeModal.tsx     // NEW — Q12 3-submode picker
│   ├── DrillTimer.tsx              // NEW — countdown + heartbeat
│   ├── DrillHintPanel.tsx          // NEW — 3-tier credit budget UI
│   ├── DrillSubmitBar.tsx          // NEW — submit/give-up/pause
│   ├── DrillGradeReveal.tsx        // NEW — Q10 tiered choreography
│   ├── DrillResumePrompt.tsx       // NEW — on return with active drill
│   ├── useDrillHeartbeat.ts        // NEW — 10s ping
│   └── useDrillTimer.ts            // NEW — client countdown
├── review/
│   ├── ReviewModeLayout.tsx        // NEW — minimal card view
│   ├── ReviewCard.tsx              // NEW — single question card
│   ├── ReviewRating.tsx            // NEW — Again/Hard/Good/Easy
│   ├── ReviewSwipeMobile.tsx       // NEW — gesture handler (B8)
│   └── ReviewEmptyState.tsx        // NEW
└── studio/                          // NEW — Architect's Studio rebuild
    ├── StudioHome.tsx              // R2 — isometric home
    ├── CinematicIntro.tsx          // R1 — first-visit film
    ├── PatternRoomTransition.tsx   // R3 — walk-into-room animation
    ├── RadialMenu.tsx              // R4
    ├── GestureHandler.tsx          // R6
    ├── AmbientController.tsx       // R7 — sound + dynamic lighting
    ├── FluidLayoutShell.tsx        // R8 — translucent overlapping layers
    ├── SignatureCanvas.tsx         // R9 — sign-once experience
    ├── PresentationMode.tsx        // R10 — diagram → deck
    ├── DualViewLayout.tsx          // R11 — code + UML always
    └── FirstTimeRitual.tsx         // R12 — 4-screen welcome

src/lib/lld/
├── (existing files unchanged)
└── motion-signatures/              // NEW — M1 per-pattern animations
    ├── singleton.ts
    ├── factory-method.ts
    └── ... (36 total)

src/hooks/
├── useLLDModeSync.ts               // NEW
├── useLLDPreferencesSync.ts        // NEW
├── useLLDDrillSync.ts              // NEW
└── useLLDResponsive.ts             // NEW — Q6 tiered support

src/lib/analytics/
└── lld-events.ts                   // NEW — Q19 25-event typed catalog

src/app/api/
├── user-preferences/route.ts
├── user-preferences/lld/route.ts
├── user-preferences/lld/migrate/route.ts
├── lld/drill-attempts/route.ts
├── lld/drill-attempts/active/route.ts
└── lld/drill-attempts/[id]/route.ts

src/db/schema/
└── lld-drill-attempts.ts            // NEW

drizzle/migrations/
└── 0001_add_lld_drill_attempts.sql  // NEW
```

### Modified files

```
src/stores/ui-store.ts               // + lldMode, setLLDMode
src/stores/interview-store.ts        // + activeDrill slice
src/components/modules/lld/canvas/LLDCanvas.tsx  // + highlightedClassIds prop
src/components/modules/lld/hooks/useLLDModuleImpl.tsx  // delegate to LLDShell
src/components/modules/lld/panels/WalkthroughPlayer.tsx  // pattern-scoped persistence
src/components/modules/lld/panels/AutoGrader.tsx  // accept drillAttemptId
src/db/schema/relations.ts           // + drill-attempts relations
src/db/schema/user-preferences.ts    // doc lld JSONB shape
src/middleware.ts                    // Clerk already handles — no change
```

### Reused untouched

```
src/lib/lld/patterns.ts              // 36 patterns data
src/lib/lld/problems.ts              // 33 problems data
src/lib/lld/java-code.ts             // Java code
src/lib/lld/astar-router.ts          // A* edge routing
src/lib/lld/dagre-layout.ts          // Sugiyama layout
src/lib/lld/grading-engine.ts        // fuzzy-match auto-grader
src/lib/lld/bidirectional-sync.ts    // powers R11 dual-view
src/lib/ai/claude-client.ts          // singleton + queue
src/lib/ai/hint-system.ts            // 3-tier hints
src/lib/fsrs.ts                      // spaced repetition
```

---

## 15. Phased Rollout (Q20 — 5-wave ramp)

Total scope: ~400-600h (rebuild) + ~400h (features) + content authoring. Realistic calendar: **5-6 months**, 2 engineers.

### Phase 0 · Foundations (Weeks 1-2, 40-60h)

Security + bug fixes from research file 02 + 21:
- Fix 5 CRITICAL security vulns (requireAuth guards, WebSocket auth, XSS, API key audit, Sentry scrubbing)
- Fix 2 CRITICAL bugs (stale closure in `onConnect`, unbounded `metricsHistory`)
- Fix Lucide barrel import (100KB bundle savings)

### Phase 1 · Mode scaffolding (Weeks 3-6, ~80h)

- DB migration for `lld_drill_attempts`
- 6 new API routes + preferences extension
- Store extensions (ui-store + interview-store)
- `LLDShell.tsx` + `ModeSwitcher.tsx` + `WelcomeBanner.tsx`
- Basic Learn / Build / Drill / Review layouts (functional skeletons)
- URL ↔ state sync hook
- Q19 analytics event taxonomy
- Wire existing Build mode into new shell (zero regression)

### Phase 2 · Learn mode with content for 5 patterns (Weeks 7-10, ~120h)

- Full 8-section lesson layout (`LessonColumn.tsx`)
- Scroll-sync canvas highlight
- 4 checkpoint types fully wired (MCQ, click-class, fill-blank, order-steps — data exists, bring UI alive)
- Progressive reveal on checkpoint failure (Q3)
- Opus writes 5 foundation patterns (Wave 1): Singleton, Factory Method, Builder, Abstract Factory, Prototype — full 8-section + code + anti-pattern + case study + personality + dialogue
- 5 pattern motion signatures (M1)
- Tinker mode (Q8)
- Contextual AI surfaces (Q9)
- Class popover (Q7)
- Ship to **alpha cohort (Wave 2 rollout)**

### Phase 3 · Review mode + Drill mode (Weeks 11-14, ~120h)

- Review mode (minimal card UI, phone-first)
- Swipe gestures mobile (B8)
- 3 sub-mode drill picker (Q12)
- Drill timer + heartbeat
- Drill grade reveal with tiered choreography (Q10)
- AI feedback integration (Haiku for grade commentary)
- Hostile interviewer mode (W8)
- Company-style mock interviews (A7)
- FSRS-5 review scheduling
- Ship to **anonymous 100% rollout (Wave 3)**

### Phase 4 · Content expansion + advanced features (Weeks 15-20, ~150h)

- Opus writes remaining 31 patterns — Waves 2-8
- Audio narration (C8) for 36 patterns (ElevenLabs or human)
- Pattern mascot illustrations (V4) — 36 SVGs
- Pattern constellation visualization (Dashboard hero)
- All 5 dashboard charts (D2, D3, D4, D6, D8)
- 10 cognitive science features (CS1-CS10) wired
- Spotlight search (I2), favorites (I4), tags (I8)
- Keyboard navigation fully built (Q14)
- Multi-select batch actions (I9)
- On-call simulator (X3), design mysteries (X5)
- Hall of Fame (X11), time capsule (X12)
- Failure portfolio (X7)
- **Auth 10% → 50% rollout (Wave 4)**

### Phase 5 · The Architect's Studio rebuild (Weeks 21-24, ~150h)

- R1 Cinematic cold open
- R2 Spatial home (isometric studio)
- R3 Pattern room transitions
- R4 Radial menu
- R5 Editorial typography (Cormorant Garamond)
- R6 Gesture grammar
- R7 Ambient sound + dynamic lighting
- R8 Fluid translucent layers
- R9 Personal architect signature
- R10 Presentation mode
- R11 Dual-view layout
- R12 First-time ritual
- 6 color themes (P1)
- Humane features (F1-F12)
- **Full 100% rollout (Wave 5)**

### Phase 6 · Ecosystem (post-launch, months 7+)

- Pattern linter npm package (W6)
- Browser extension (G2)
- VS Code extension (G3)
- GitHub repo analysis (A1)
- Public API (G10)
- Architex for Teams (G11)
- Physical product: deck / posters / journal (X9)
- Alumni showcase (G12)

### Auto-rollback triggers

- Drill submission error rate >5% → rollback to previous cohort
- Learn completion rate drops >20% vs control → rollback
- >3 data-loss reports in 24h → rollback
- FSRS rating distribution shifts suspiciously (>80% "Again" = broken) → investigate + rollback

### Feature flag shape

```typescript
function isLLDV2Enabled(user: User | null): boolean {
  if (user?.preferences.lld.v2Optout) return false;
  if (user?.preferences.lld.v2OptIn) return true;
  if (!user) return ROLLOUT.anonymous;               // 100% post-Wave 3
  return hashCohort(user.id) < ROLLOUT.authenticatedPercent;
}
```

---

## 16. Non-Goals

Explicitly out of scope for V1:

- Leaderboards / public competitive rankings
- Real-time multiplayer battles
- Comments / discussion threads on patterns
- Follow-other-users / social graph
- Public drill history
- Canvas annotations ON diagram (I6 — deferred to v2)
- ELI5/Standard/ELI-Senior toggle (W10 — simpler to author one voice)
- Architect archetype quiz (X1)
- Advent calendar event (X2 — nice annual add-on later)
- Real-time pair designing (X4 — needs infra investment)
- Cross-domain pattern transfer pages (X6 — content investment heavy)
- Pomodoro built-in (X8)
- Canvas time machine (I10)
- Personal notes per pattern (I5 — deferred to v2, annotations have priority)
- Command palette deep scopes (I1 — existing cmdk is sufficient)
- Quick switcher ⌘P (I3 — Spotlight covers this)

These may return in Phase 6+ based on user feedback.

---

## 17. Open Questions

Questions that remain and need decisions before implementation:

1. **Pattern mascot illustration style** — hand-drawn line art, flat vector, or watercolor? Commission vs AI-generate vs hybrid?
2. **Audio narration voice** — AI (ElevenLabs ~$200 per 3.6h of content) vs human narrator (~$2K)? Both are usable; what's the brand voice preference?
3. **Serif font final choice** — Cormorant Garamond is a placeholder. Could be EB Garamond, Source Serif, or custom. Depends on licensing + visual audit.
4. **Ambient sound licensing** — self-produce, CC-licensed library, or commission?
5. **Mobile layouts for Learn** — do we ship V1 with Learn mobile, or defer to Phase 2 of rollout?
6. **Physical product economics** — margin vs marketing-only, fulfillment partner selection?
7. **Pricing for AI features** — GitHub repo analysis is expensive. Pro tier price point?
8. **Mentorship (F4) matching mechanism** — opt-in form, AI-matched, or manual curation?

---

## 18. References

### Internal

- `architex/ARCHITEX_PRODUCT_VISION.md` — original vision
- `architex/docs/CONTENT_STRATEGY.md` — brand voice + 6-step teaching sequence
- `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` — existing design system
- `architex/LLD_CANVAS_PLAYBOOK.md` — canvas technical details
- `architex/docs/research-findings/02-code-quality-bugs.md` — Phase 0 bugs
- `architex/docs/research-findings/21-security-threat-model.md` — Phase 0 vulns
- `architex/docs/audits/lld-content-mega-audit/` — 14-agent audit
- `architex/docs/plans/2026-04-14-lld-world-best-design.md` — prior planning

### Research cited

- Richard Mayer — Cognitive Theory of Multimedia Learning (2009)
- John Sweller — Cognitive Load Theory (1988)
- Robert Bjork — Desirable Difficulties (1994)
- Allan Paivio — Dual Coding Theory (1986)
- Manu Kapur — Productive Failure (2008) — drives CS4
- Roediger & Karpicke — Testing Effect (2006) — drives CS6
- Rohrer & Taylor — Interleaving in Math Practice (2007) — drives CS2
- FSRS-5 benchmark (2024) — drives Review mode scheduling

### Brainstorm artifacts

The 16 visual brainstorm screens that produced this spec are preserved in:
- `.superpowers/brainstorm/*/content/*.html`

---

*End of spec.*
