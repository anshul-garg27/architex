# Blueprint Module · Vision Spec

> **Status:** Approved (umbrella). Sub-project specs drill deeper.
> **Date:** 2026-04-21
> **Scope:** The successor to Architex's LLD module — a journey-first curriculum for object-oriented design
> **Supersedes (in spirit):** `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` §5–§15 (4-mode switcher model)
> **Preserves:** `2026-04-20-lld-architect-studio-rebuild.md` §9 pedagogy, §12 AI surfaces, §13 feature catalog — these remain the content backlog
> **Coexists with:** `docs/superpowers/plans/2026-04-20-lld-phase-*.md` (LLD Phase 1–6) — those ship to old LLD and are not displaced

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Thesis](#2-thesis)
3. [Module Identity](#3-module-identity)
4. [Relationship to Old LLD](#4-relationship-to-old-lld)
5. [Personas and Locked Decisions](#5-personas-and-locked-decisions)
6. [Core Architecture · B+ Journey-First](#6-core-architecture-b-journey-first)
7. [URL Space and Routing](#7-url-space-and-routing)
8. [Data Model](#8-data-model)
9. [Content Pedagogy](#9-content-pedagogy)
10. [Curriculum Blueprint (12 Units)](#10-curriculum-blueprint)
11. [The 10 Sub-Projects](#11-the-10-sub-projects)
12. [Dependency Graph and Sequencing](#12-dependency-graph-and-sequencing)
13. [Design Language](#13-design-language)
14. [Accessibility and Desktop-Only Scope](#14-accessibility-and-desktop-only-scope)
15. [Analytics and Success Metrics](#15-analytics-and-success-metrics)
16. [Non-Goals](#16-non-goals)
17. [Open Questions Resolved in Sub-Project Specs](#17-open-questions)
18. [References](#18-references)

---

## 1. Executive Summary

The Architex LLD module as it exists today is a tool that treats learning as a by-product. A user opens the module, sees 36 patterns as a flat list, picks one, reads a 3000-word Wikipedia-style article, then switches tabs to a canvas. There is no journey, no progression, no orchestration of retention. The four "modes" (Learn / Build / Drill / Review) were designed as peer tabs rendered side by side, which produced a class of bugs where one mode's chrome bleeds into another mode's content area. The audit in this repo (Screenshots 2026-04-21 session) documents the pathology: clicking Builder in the pattern list updates the URL to `pattern:builder` and the center canvas renders Builder, but the lesson column still shows Singleton because the Learn layout hardcodes `DEFAULT_SLUG = "singleton"`. The properties panel to the right shows "Library Management System" details because it's reading a completely different entity. The bottom panel shows "QUIZ: BUILDER" tabs for a pattern-context the center column hasn't moved to. Four different parts of the screen, four different source-of-truth states, all rendered by the same layout, all disagreeing.

This spec defines the successor: **Blueprint** — a new Architex module at `/modules/blueprint` that treats learning as the product and tools as a consequence. The core reframe is that modes are not navigation; **units are navigation**. A unit is a bounded, orchestrated learning experience — read, interact, apply, retain — performed end-to-end on a single pedagogical entity (a pattern, a problem, or a concept). The user never picks "Learn mode" or "Drill mode"; the user picks "Unit 3: Meet Builder" and the unit itself orchestrates the stages in the right order, with the right pacing, bound to the right entity. Power users who want the old free-form tools get them from a Toolkit palette that exposes the canvas, the problem workspace, and the review inbox as first-class — but never as the default experience.

Blueprint ships alongside the existing `/modules/lld`. The old module stays exactly as it is, unchanged. No sunset is planned in this spec — the question of whether and when to retire the old module is explicitly deferred. Blueprint is additive. It shares the underlying data layer (patterns, problems, FSRS progress tables) with old LLD but has its own shell, its own routes, its own state, its own progression schema. Two modules coexist. One is a tool (LLD). One is a curriculum (Blueprint). Both are first-class Architex modules. Users who want to drill problems freely can stay in LLD forever. Users who want a structured learning experience pick Blueprint. When the curriculum is proven, the team can decide what to do with LLD — that decision isn't ours to make today.

The build is end-to-end, hand-authored, desktop-only for V1, unconstrained by timeline. Content is not auto-generated. The 12 curriculum units are authored in session with voice, specificity, and craft that scales to the "1000% quality" bar set in the earlier spec. The shell, the journey map, the unit renderer, and the three toolkit surfaces (Patterns Library, Problems Workspace, Review Inbox) are the code scaffolding that lets the content breathe. The build is decomposed into 10 sub-projects, each with its own brainstorm → spec → plan → execute cycle, sequenced so later sub-projects depend on earlier ones only through stable interfaces. The sequencing is described in §12.

This document is the umbrella spec. It is deliberately not an implementation document. It is a contract: each sub-project's detailed spec cites this one as its anchor and respects the invariants set here. Read this, then read the sub-project spec relevant to the task at hand. Do not invent new architectural moves without coming back and updating this document first.

---

## 2. Thesis

> **Blueprint is a course, not a dashboard.**

Every design decision below derives from that one sentence. Courses have a syllabus; dashboards have tabs. Courses have pacing; dashboards have buttons. Courses have chapters that build on each other; dashboards have widgets that are equal citizens. Courses are read left-to-right; dashboards are scanned top-to-bottom. Courses track progress against a curriculum; dashboards track state against whatever is convenient.

The earlier spec opened with "Architex is not a tool. It is a place." That was the right aspiration, wrongly expressed. Calling it "a place" implies spatial metaphor (drafting table, reading nook, examination room). Spatial metaphor is a visual-design technique, not an architectural one. Under a spatial metaphor, a user still ends up with "which room am I in right now?" — which recapitulates the same mode-switcher problem. Calling it "a course" implies temporal metaphor (week, unit, lesson, review). Temporal metaphor puts the user's progress at the center. The user is not in a room; the user is *on week 3*. The user is not picking a mode; the user is *at step 2 of unit 7*.

Under the course thesis:

- **Content organization is a syllabus**, not a catalogue. Patterns are grouped into units. Units form a weekly curriculum. The curriculum has prerequisites, optional tracks, and a recommended sequence. The flat 36-pattern list gets retired as default navigation.
- **Learning happens in time**, not in space. A unit unfolds section by section. A section unfolds micro-step by micro-step. There are no tabs the user hops between mid-unit; the unit decides what happens next.
- **Modes become activities inside a unit**. "Read about Builder" is a section. "Draw Builder" is a section. "Apply Builder to the Elevator problem" is a section. "Retain Builder next week" is a scheduled event. None of these are top-level nav; all of them are chapters inside a unit.
- **Tools exist for power users** but are intentionally secondary. You open the Toolkit the way you open a reference book: rarely, deliberately, with specific intent. You don't live in the Toolkit.
- **Progress is the primary UI element**. The user always knows what they're on, what comes next, what's locked, and what's due. The journey map is the home screen.

The thesis implies downstream choices that will look surprising:

- The mode switcher in old LLD is deleted. It does not reappear in Blueprint.
- Canvas, problem solving, and flashcard review are child components of sections or toolkit tools. They are never top-level.
- The URL scheme encodes journey position (`unit/03/section/02`) or toolkit context (`toolkit/patterns/builder`) but never a naked `mode=learn`.
- Two different users (one in unit 3 reading, one in toolkit drilling) see two different full-page layouts — not two different tabs of the same layout.

This thesis is non-negotiable. Every sub-project spec defers to it.

---

## 3. Module Identity

**Name:** Blueprint
**Tagline:** *Design patterns, one unit at a time.*
**Long description:** A structured curriculum on object-oriented design for software engineers — 12 units covering 36 canonical design patterns, 33 applied problems, and the mental model that ties them together. Hand-authored, paced, retention-aware.
**Nav label:** "Blueprint"
**Nav icon:** a compass-over-grid icon (decided in §13 per design language; fallback to Lucide `compass` while the custom icon is in progress)
**Default module icon color:** indigo-to-sky gradient (matches the course-not-dashboard thesis — indigo reads "academic" rather than "productivity")
**URL root:** `/modules/blueprint`
**Product surface:** desktop-only for V1 (see §14)

**Why "Blueprint":**

Short, distinctive, and evokes craft without being twee. In the domain: a blueprint is the planning artifact an architect produces before construction begins — analogous to what we teach (the pattern) before a user writes their code (the implementation). In pairing: "Blueprint" reads naturally next to Architex's existing "Studio" vocabulary — a blueprint is what you draft *in* a studio. In voice: "open Blueprint", "blueprint this pattern", "go back to Blueprint" — all parse. In category: no competitor has claimed this name for pattern-learning (Educative uses "Courses", Refactoring.Guru uses "Catalog", Brilliant uses "Courses", Design Patterns.fun is "patterns").

Alternatives that were considered and rejected:

- **Forge** — evokes making but maps better to compiler-tools or CI/CD; confusing next to "Studio".
- **Atelier** — premium but niche; the user base includes non-native English speakers.
- **Academy** / **School** — generic; every competitor has one.
- **Codex** — too literary; sounds like a reference doc, not a course.
- **Keep "LLD"** — the acronym is interview-prep jargon; the new module has wider scope than interview prep.

The decision is locked unless the user explicitly overturns it.

---

## 4. Relationship to Old LLD

Old LLD at `/modules/lld` is preserved in full. Blueprint is a sibling.

**What old LLD retains:**

- The 4-panel workspace (sidebar / canvas / properties / bottom tabs)
- The mode switcher from Phase 1 (Learn / Build / Drill / Review)
- All Phase 1–3 progress (Learn mode stub, Build mode)
- All existing URLs (`/modules/lld?lld=pattern:builder` etc.)
- All authored content (the 7 MDX lessons, pattern/problem catalogs)
- All user data written to `module_content`, `lld_learn_progress`, etc.

**What Blueprint shares with old LLD (read-only unless noted):**

- `design_patterns` catalog (shared) — 36 patterns with classes, relationships, code
- `lld_problems` catalog (shared) — 33 problems with starter classes, requirements
- `fsrs_*` tables (shared, writes-coordinate) — FSRS review state is user-global, not module-scoped
- `lld_learn_progress` (read-only from Blueprint) — Blueprint reads to respect user's existing reading state; writes to its own `blueprint_user_progress` table
- Canvas engine (`src/components/modules/lld/canvas/*`) — imported and reused
- Grading engine (`src/lib/lld/grading-engine.ts`) — imported and reused
- Dagre / A* layout (`src/lib/lld/dagre-layout.ts`, `src/lib/lld/astar-router.ts`) — imported and reused
- Claude AI client (`src/lib/ai/*`) — imported and reused
- Stores exposing pattern/problem data (`src/stores/*`) — read-only use

**What Blueprint does not touch:**

- `useLLDModule` hook and the 4-panel assembly in `useLLDModuleImpl.tsx`
- The LLD route, the LLD wrapper, the LLD shell
- Any Phase 1–3 tests (Blueprint has its own test set)

**What Blueprint adds (new code, not touching old LLD):**

- Route tree under `/modules/blueprint/*`
- `src/components/modules/blueprint/*` component tree
- `src/stores/blueprint-store.ts` (Zustand)
- `src/hooks/blueprint/*` hooks
- `src/db/schema/blueprint-*.ts` tables
- `src/lib/blueprint/*` logic modules
- `content/blueprint/*` MDX and YAML content
- API routes under `/api/blueprint/*`

**Interop cases:**

- A user completing a unit in Blueprint that introduces Singleton triggers an FSRS card for Singleton. If the same user later uses old LLD's Review mode (Phase 3 item), they see the same card — FSRS is user-global.
- A user who has already read the Singleton MDX lesson in old LLD gets credit in Blueprint's Unit 3 for the "read" section. Blueprint reads `lld_learn_progress.scrolled_completed_at` and treats it as prior knowledge; the section shows as ✓ read but the user can re-read or click "next".
- A user who opens Toolkit → Patterns Library → Builder gets the same canvas they'd get in old LLD's Build mode for Builder. The canvas is rendered by the same `LLDCanvas` component with the same data.

**Sunset is not in scope for this spec.** If and when the team decides to retire old LLD, we write a migration spec then. Until that decision is made, Blueprint is 100% additive.

---

## 5. Personas and Locked Decisions

Personas carried over from the earlier spec, with Blueprint-specific notes:

| Persona | % | Primary mode of engagement in Blueprint | Entry experience |
|---|---|---|---|
| **A — Absolute newcomer** (some programming, shaky on OOP) | 15% | Journey (curriculum, linear) | Lands on home, sees "Start unit 1: What is a design pattern?" |
| **B — OOP-familiar learner** (1-3y, no systematic pattern study) | 50% | Journey + occasional Toolkit | Lands on home, resumes last unit, uses Patterns Library to look up one they half-remember |
| **C — Interview-prep cruncher** (knows GoF, wants drills) | 30% | Toolkit → Problems Workspace | Lands on home, clicks Problems in Toolkit, drills; ignores curriculum |
| **D — Casual explorer** | 5% | Toolkit freely | Wanders both surfaces |

**Persona insight:** The journey is for 65% of traffic (A + B). The toolkit is for 30% (C). 5% use both. No persona uses the thing old LLD is shaped for — a mode switcher that makes all users choose.

### Decisions locked

Each is carried into sub-project specs; changing any of these invalidates multiple sub-projects.

| # | Decision | Locked value |
|---|---|---|
| L1 | Module name | Blueprint |
| L2 | Deployment strategy | New module, additive; old LLD stays; sunset deferred |
| L3 | Timeline | Unconstrained — craft over speed |
| L4 | V1 scope | Full end-to-end (all 12 units) shipped sub-project by sub-project |
| L5 | Content authorship | Hand-authored by Claude in session |
| L6 | Device support | Desktop-only for V1; mobile later as a separate spec |
| L7 | Core UX | B+ — journey primary, modes hidden inside units, Toolkit for power users |
| L8 | Authentication | Anonymous works; signed-in persists across devices (existing Clerk + anonymous fingerprint infra) |
| L9 | Interop with old LLD | Share data, read-only from old LLD's progress tables, write to own tables |
| L10 | PR workflow | Branch + worktree, single PR per delivery milestone |
| L11 | Testing philosophy | Unit tests for logic, integration tests for API routes, Playwright for journey flows |
| L12 | Analytics | PostHog typed events (build on the taxonomy in `src/lib/analytics/lld-events.ts`) |
| L13 | Accessibility | WCAG 2.2 AA for journey + Toolkit shells; lesson content must be screen-reader friendly |
| L14 | Internationalization | English-only for V1; i18n hook points in place but no translation infra |

---

## 6. Core Architecture · B+ Journey-First

### 6.1 The three surfaces

Blueprint exposes three top-level surfaces. They are always navigable from the Blueprint shell but render in different layouts. A user is always on exactly one surface at a time.

**Surface 1 · Journey (default)**

The curriculum. The home screen renders a journey map. Clicking a unit opens the Unit Renderer — a single scrollable column that orchestrates sections (read / interact / apply / retain). No tabs. No mode switcher. The unit tells the user what happens next.

**Surface 2 · Toolkit (secondary)**

A drawer or palette containing three tools:
- **Patterns Library** — browse any of 36 patterns, open its canvas, read its lesson if authored, compare to another pattern.
- **Problems Workspace** — drill any of 33 problems, pick a sub-mode (Interview / Guided / Speed), get graded, celebrate or improve.
- **Review Inbox** — FSRS daily queue, flashcards, streak tracking.

Each tool is a full-page view reached from the Toolkit drawer or from its direct URL. Users who live in the Toolkit (persona C) can pin a tool so Blueprint lands them there by default.

**Surface 3 · Progress (tertiary)**

A dashboard of user state: units complete, patterns mastered, review streak, accuracy breakdown, time invested. Linked from the Journey home header. Not a place users spend long; a place users visit to feel pride.

### 6.2 The shell

The Blueprint shell is a single React component tree that owns:

- **Top chrome:** Architex left rail (unchanged) + Blueprint top bar (logo, journey/toolkit/progress links, search, user menu).
- **Breadcrumb row:** "Blueprint › Unit 3 · Meet Builder · Section 2 of 4" — always shows where the user is, always clickable to navigate up.
- **Main content area:** renders the current surface.
- **Status bar:** live info (auto-save state, time in section, review-due count) — minimal, no more than 3 elements.

The shell is *not* a 4-panel layout. It's a single-column or two-column layout depending on surface:
- Journey home → single column (map centered).
- Unit detail → two columns on wide screens (reading + side rail with TOC, progress, related units).
- Toolkit tools → layout defined per tool; typically workspace-style (sidebar + canvas + properties).
- Progress → single scrollable column.

Explicitly: **there is no slot in the Blueprint shell for "mode switcher" or "side-by-side peer tabs". If a sub-project proposes adding one, it is rejected before design review.**

### 6.3 State ownership

**`blueprint-store` (Zustand):**
- `currentSurface: "journey" | "toolkit" | "progress"`
- `journey: { currentUnitId, currentSectionId, unitStates: Record<unitId, UnitState> }`
- `toolkit: { activeTool: "patterns" | "problems" | "review" | null, activeEntityId: string | null, subMode: string | null }`
- `preferences: { preferredLang: "ts" | "py" | "java", reviewDailyTarget, lastSeenDailyAt }`

**`fsrs-store` (existing, shared with old LLD):**
- FSRS cards, review queue — unchanged.

**URL as authority:**
- On every surface change, the URL updates.
- On every significant position change (unit, section, tool entity), the URL updates.
- The URL is the authoritative source for the current view — refresh always works.
- `blueprint-store` is a cache + non-URL state (preferences, derived unit progress).

**Server as authority for progress:**
- All progress writes go to `blueprint_user_progress` via debounced PATCH.
- Reads hydrate the store on load and after sign-in.
- Offline edits persist to localStorage and sync on reconnect (later sub-project).

### 6.4 Mode-free orchestration

The old modes (Learn / Build / Drill / Review) do not exist as top-level concepts in Blueprint. They exist as *section types* inside units and as *tools* in the Toolkit. Two different surfaces for two different use cases.

**Inside a unit (Journey):**

A section has a `type`:
- `read` — MDX lesson content, scrolled reading
- `interact` — inline mini-exercise (tap the correct class, drag to reorder, fill the blank)
- `apply` — canvas exercise (draw a pattern, add a class, fix a broken diagram)
- `practice` — short problem (reduced scope, 3–7 min, graded)
- `retain` — schedule an FSRS card for a future date; also used for recap sections

The unit recipe is a sequence of these. For example, Unit 3 (Builder) might be:
```
read      "Meet Builder"          2 min
interact  "Spot the telescoping"  45 sec
read      "Why this works"        90 sec
apply     "Draw the hierarchy"    3 min
read      "Tradeoffs"             60 sec
practice  "QueryBuilder problem"  6 min
retain    schedule 3 FSRS cards
```

The renderer walks this recipe top-to-bottom. Each section emits its own component, bound to its own data. There is no "mode" the user switches into; the section itself is the mode-equivalent.

**Inside the Toolkit:**

Each tool is its own workflow. Patterns Library opens a canvas on a pattern. Problems Workspace opens a timer-driven problem-solving experience. Review Inbox opens a flashcard feed. None of them expose a mode switcher. Each is specialized for its one job.

### 6.5 Transitions between surfaces

Transitions are explicit and deliberate. A user in Journey does not accidentally land in Toolkit; they click the Toolkit drawer. A user in Toolkit does not accidentally lose their drill progress to navigate to Journey; the Toolkit tool prompts to save state.

Specific transition rules:

- **Journey → Toolkit:** saves journey state (current unit, section, scroll) to server on leave.
- **Toolkit → Journey:** if Toolkit has unsaved work (edited canvas, mid-drill), confirm before discarding; otherwise, restore journey state from server.
- **Unit → Unit:** within Journey, moving between units is a URL change; scroll resets; progress preserves.
- **Section → Section:** within a unit, moving between sections is a scroll action (they're on the same page). The URL updates to reflect the active section via IntersectionObserver.
- **Inside a Toolkit tool → Different tool:** confirm unsaved work, same as Journey → Toolkit.

### 6.6 Welcome and first-run

A first-visit user sees a welcome screen on Blueprint home:
- Headline: "Welcome to Blueprint."
- Three choices: "Start the course" (default, big button) / "Drill a problem" (small link) / "Browse patterns" (small link).
- Dismissable forever (persist `welcomeDismissedAt`).

Subsequent visits land on the journey home with the user's resume card up top.

---

## 7. URL Space and Routing

Blueprint uses Next.js 16 App Router. Every URL is deep-linkable, bookmarkable, and reproduces the exact view on reload.

### 7.1 Route tree

```
/modules/blueprint                                         Journey home (map + resume + welcome if first-run)
/modules/blueprint/unit/<unitSlug>                         Unit detail (scrollable, sections hash-linked)
/modules/blueprint/unit/<unitSlug>#section-<sectionId>     Unit detail scrolled to section
/modules/blueprint/unit/<unitSlug>/complete                Unit completion screen (celebration, next-up)

/modules/blueprint/toolkit                                 Toolkit home (pick a tool)
/modules/blueprint/toolkit/patterns                        Patterns Library landing (browse 36)
/modules/blueprint/toolkit/patterns/<patternSlug>          Pattern detail with canvas
/modules/blueprint/toolkit/patterns/<patternSlug>/compare  Comparison mode (pre-selected A)
/modules/blueprint/toolkit/problems                        Problems Workspace landing (browse 33)
/modules/blueprint/toolkit/problems/<problemSlug>          Problem detail
/modules/blueprint/toolkit/problems/<problemSlug>/drill    Drill mode (timer-driven)
/modules/blueprint/toolkit/review                          Review Inbox (FSRS queue)

/modules/blueprint/progress                                Personal dashboard
/modules/blueprint/progress/patterns                       Pattern mastery grid
/modules/blueprint/progress/problems                       Problem history
/modules/blueprint/progress/streak                         Streak detail
```

### 7.2 Query params (reserved)

| Param | Used by | Purpose |
|---|---|---|
| `?resume=1` | Home | Force-land on resume card (for notification links) |
| `?from=<module>` | Any | Attribution — where user came from (analytics only) |
| `?unit=<slug>` | Home | Scroll journey map to a specific unit |
| `?q=<query>` | Toolkit | Search within a tool |
| `?lang=ts\|py\|java` | Unit, Patterns | Override preferred code language for this view |

### 7.3 What Blueprint does *not* use in its URLs

- No `?mode=<mode>` — there are no modes.
- No bare `?lld=<entity>` — that scheme is old LLD's; Blueprint has entity-typed paths.
- No per-session IDs in path — state lives in store + server, not URLs.
- No redirect trampolines — deep links land directly on target views.

### 7.4 URL → state wiring

A single `useBlueprintRoute` hook reads the URL and writes to `blueprint-store.currentSurface` plus activity-specific fields. Writes to store that would change surface also call `router.push`. No other place in the code calls `router.push`; this invariant is tested.

### 7.5 Back button, forward button, history

All state changes that would cause a distinguishable view are pushed (not replaced). Scroll position within a unit is pushed as replace-state (not push) on IntersectionObserver updates, so back-button goes to the previous unit, not to five sections up.

---

## 8. Data Model

Blueprint adds new tables, shares some, leaves old LLD's untouched.

### 8.1 New tables (Drizzle schema, referenced from `src/db/schema/`)

**`blueprint_courses`** — top-level course record. For V1, a single row: "The Blueprint Course".
- `id` (uuid pk)
- `slug` (text unique, e.g. "blueprint-core")
- `title` (text)
- `description` (text)
- `version` (text, e.g. "v1.0.0")
- `published_at` (timestamptz nullable)
- `created_at`, `updated_at`

**`blueprint_units`** — the 12 curriculum units.
- `id` (uuid pk)
- `course_id` (uuid fk → blueprint_courses)
- `slug` (text unique within course; e.g. "meet-builder")
- `ordinal` (int — curriculum order, 1..N)
- `title` (text, e.g. "Meet Builder")
- `summary` (text, 1–3 sentences for the unit card)
- `duration_minutes` (int, estimated)
- `difficulty` (text enum: foundation | intermediate | advanced)
- `prereq_unit_slugs` (text[] — ordered; gates visibility but can be overridden)
- `tags` (text[] — creational | structural | behavioral | applied | foundation)
- `entity_refs` ({ patterns: string[], problems: string[] }) — what patterns/problems this unit touches
- `recipe_json` (jsonb — ordered section list with `type`, `params`, `data` per section)
- `published_at` (timestamptz nullable)
- `created_at`, `updated_at`

**`blueprint_sections`** (denormalized view for search/indexing; optional — can be derived from `recipe_json`)
- `id` (uuid pk)
- `unit_id` (uuid fk)
- `ordinal` (int)
- `type` (text enum: read | interact | apply | practice | retain)
- `title` (text)
- `content_slug` (text — MDX file name for `read` sections; null otherwise)
- `params_json` (jsonb)

**`blueprint_user_progress`** — per-user, per-unit progress.
- `id` (uuid pk)
- `user_id` (uuid / fingerprint)
- `unit_id` (uuid fk)
- `state` (text enum: locked | available | in_progress | completed | mastered)
- `section_states` (jsonb: `{ [sectionId]: { startedAt, completedAt, attempts, score } }`)
- `last_position` (text — section slug scrolled to; for resume)
- `total_time_ms` (int)
- `completed_at` (timestamptz nullable)
- `mastered_at` (timestamptz nullable — set when all FSRS cards are mastered level)
- `created_at`, `updated_at`
- partial unique index on `(user_id, unit_id)`

**`blueprint_journey_state`** — per-user global journey state.
- `user_id` (pk)
- `current_unit_slug` (text nullable)
- `current_section_id` (text nullable)
- `welcome_dismissed_at` (timestamptz nullable)
- `streak_days` (int)
- `streak_last_active_at` (timestamptz nullable)
- `daily_review_target` (int default 10)
- `preferred_lang` (text enum: ts | py | java default ts)
- `pinned_tool` (text enum: patterns | problems | review nullable)
- `updated_at`

**`blueprint_events`** (append-only event log for analytics + debugging)
- `id` (uuid pk)
- `user_id`
- `event_name` (text)
- `event_payload` (jsonb)
- `occurred_at` (timestamptz)

### 8.2 Shared tables (no schema changes)

- `design_patterns` (owned by LLD catalog)
- `lld_problems` (owned by LLD catalog)
- `fsrs_cards`, `fsrs_review_logs` (owned by retention system)
- `users`, `user_preferences` (Clerk)

### 8.3 Content sources (filesystem)

- `content/blueprint/units/<slug>/unit.yaml` — unit metadata + recipe
- `content/blueprint/units/<slug>/sections/<ordinal>-<slug>.mdx` — read section content
- `content/blueprint/shared/concepts/<slug>.mdx` — cross-referenced concept definitions (tooltips)
- `content/blueprint/shared/problems/<slug>/overlay.yaml` — Blueprint-specific framing of an LLD problem when used in a unit (reduced scope, hints order, timer default)

### 8.4 Data flow summary

```
MDX + YAML on disk
   │
   ▼  build-time compiler (script)
compiled unit bundle (JSON)
   │
   ▼  DB upsert (script)
blueprint_units.recipe_json
   │
   ▼  runtime read (API)
Unit Renderer
   │
   ▼  on interaction
blueprint_user_progress (write)
blueprint_events (write)
fsrs_cards (write, for retain sections)
```

The content compile pipeline mirrors old LLD's `compile:lld-lessons` but lives under `scripts/blueprint/` and writes to `blueprint_*` tables.

---

## 9. Content Pedagogy

This section sets the pedagogy contract that every unit honors. Sub-project 3 (Unit Renderer) enforces it; sub-projects 7–9 (content authoring) conform to it.

### 9.1 The read–interact–apply–retain micro-cycle

Every unit is a sequence of sections. Sections alternate between short reading and short activity. The pacing floor is 60 seconds per section; the ceiling is 180 seconds. Any section longer than 180 seconds splits.

Rationale (empirically grounded):
- Attention windows for focused reading on a screen cap at around 90–120 seconds before drop-off (Mark 2015, Gorlick 2011).
- Active retrieval within 2 minutes of encoding produces durable long-term recall (Roediger & Karpicke 2006).
- Varied practice across sections (pattern → problem → pattern) is interleaving; superior to blocked practice (Rohrer & Taylor 2007).
- The 60-second floor is a usability threshold — any interaction shorter than that feels patronizing.

### 9.2 Section types

| Type | Purpose | Typical duration | User action |
|---|---|---|---|
| `read` | Introduce or contextualize | 90–150 sec | Scroll; optional inline highlights |
| `interact` | Active retrieval | 45–90 sec | Tap / drag / fill; scored but zero-penalty |
| `apply` | Transfer to design | 2–4 min | Canvas manipulation (add class, connect, rename) |
| `practice` | Transfer to problem | 3–7 min | Reduced-scope problem, graded |
| `retain` | Schedule future recall | 5–15 sec | FSRS card(s) scheduled; user rates optional recap |
| `reflect` (rare) | Synthesis | 60–120 sec | Free-form text; optional AI review |
| `checkpoint` (end of unit) | Gate next unit | 3–5 min | Mixed exercise; pass threshold to complete unit |

`interact` sub-types (for authors' reference):
- MCQ single
- MCQ multi
- Click-class-on-canvas
- Drag-to-reorder
- Fill-blank
- Spot-the-mistake
- Match-pairs

### 9.3 Voice and craft

Lesson content must pass the following reader test: *"A smart friend is explaining this at a coffee shop and I can follow every sentence."*

**Do:**
- Direct address ("you", "your code")
- One concrete example before any abstraction
- Specific numbers ("three database pools, not just 'many pools'")
- Acknowledge what the reader already knows ("you've seen Strategy — Builder is its spatial cousin")
- Admit trade-offs ("you pay with two extra classes to buy readable call sites")
- Name the failure mode before the fix ("the telescoping constructor anti-pattern is usually why Builder is on the table")

**Don't:**
- "Let's dive in", "In this section we'll explore", "As we discussed earlier" (filler)
- Passive voice where active works ("a pattern is applied" → "you apply the pattern")
- Academic register unless the concept demands it
- Code without annotation (reader skims code; give the one key line a callout)
- Reference future content the user hasn't seen

### 9.4 Graduation states

A user's relationship to a unit progresses through states:

- `locked` — prerequisites not met
- `available` — prerequisites met; unit visible but not started
- `in_progress` — at least one section completed, not all sections completed
- `completed` — all sections completed (checkpoint passed if present)
- `mastered` — all FSRS cards for entities introduced in this unit are at mastery level (from FSRS stability)

States decay: a `mastered` user who doesn't review for long enough slips to `completed` when one or more cards drop below mastery threshold. This matches old LLD's existing 3-tier (◐ / ◉ / ★) but adds the `mastered` ↔ `completed` decay.

### 9.5 Checkpoint policy

Each unit has a checkpoint section at the end (except review-only units).

- Checkpoint is 3–5 exercises, mixed types.
- Attempts are tracked; no pass/fail — instead, the checkpoint assigns an initial FSRS difficulty rating per entity.
- Users can skip a checkpoint (self-declared "I know this"); the unit marks `completed` but FSRS starts at higher default stability (less frequent initial review).
- Re-taking a checkpoint is always available from the unit complete screen.

### 9.6 Failure handling

- Inline exercise wrong: show the correct answer after the user's attempt plus a one-sentence `whyWrong` for the chosen distractor (progressive reveal).
- Apply section canvas invalid: highlight the mis-aligned class in the reference solution; user can jump-to-hint or reset.
- Practice section grade < 50: inline nudge to an easier practice (e.g. "try the Guided variant"); never force them to redo.

### 9.7 AI surfaces in a unit

From the original spec's Q9 (locked): AI is contextual, not ambient.

Three AI touch points per unit:
- **After 3 failed inline exercises in a row** → inline offer: "Want a deeper explanation of this step? [Ask the Architect →]"
- **At the end of each read section, with selection** → floating popover: "Ask about this highlighted passage"
- **In the Confused-With sidecar** → "Ask me how this pattern differs from [X] in your codebase"

No AI-generated content is shown without user request. No passive "AI wrote this" banners. No streaming summaries.

---

## 10. Curriculum Blueprint (12 Units)

The curriculum is sketched here; final recipes ship in sub-projects 7–9. This structure is subject to refinement but the sequencing invariants (foundations first, applied last) are load-bearing.

**Part 1 — Foundations (Unit 1–3, ~3h total)**

Unit 1 · **What is a design pattern?**
  Concept of pattern, GoF taxonomy, when and when not to apply. Introduces Strategy as a first pattern.
  Entities: Strategy pattern.
  Duration: ~45 min.

Unit 2 · **Coupling, cohesion, and the cost of a class**
  OOD fundamentals: high cohesion, low coupling, SRP. Why classes exist. What an interface buys.
  Entities: conceptual only (no GoF pattern).
  Duration: ~60 min.

Unit 3 · **The open-closed principle and its discontents**
  SOLID intro with emphasis on OCP; preview of how patterns deliver extensibility without modification.
  Entities: conceptual + Observer preview.
  Duration: ~50 min.

**Part 2 — Creational patterns (Unit 4–5, ~2h total)**

Unit 4 · **Making objects, but flexibly**
  Factory Method, Abstract Factory, Singleton — three approaches to "do not `new` directly".
  Entities: Factory Method, Abstract Factory, Singleton.
  Duration: ~75 min.

Unit 5 · **Constructors that don't explode**
  Builder, Prototype — when constructors get out of hand.
  Entities: Builder, Prototype.
  Duration: ~45 min.

**Part 3 — Structural patterns (Unit 6–8, ~3h total)**

Unit 6 · **Reshaping interfaces**
  Adapter, Facade — make one thing look like another.
  Entities: Adapter, Facade.
  Duration: ~60 min.

Unit 7 · **Adding responsibility without inheritance**
  Decorator, Proxy — wrapping behavior.
  Entities: Decorator, Proxy.
  Duration: ~55 min.

Unit 8 · **Trees, graphs, and the cost of abstraction**
  Composite, Bridge, Flyweight — when you need pattern not for behavior but for structure.
  Entities: Composite, Bridge, Flyweight.
  Duration: ~65 min.

**Part 4 — Behavioral patterns (Unit 9–11, ~3.5h total)**

Unit 9 · **Communicating without coupling**
  Observer, Mediator, Chain of Responsibility — how objects talk.
  Entities: Observer, Mediator, Chain of Responsibility.
  Duration: ~75 min.

Unit 10 · **Algorithms as objects**
  Strategy (deepened), Template Method, Command — encapsulating a verb.
  Entities: Strategy (again), Template Method, Command.
  Duration: ~60 min.

Unit 11 · **State, memory, and traversal**
  State, Memento, Iterator, Visitor — patterns that treat internal structure as first-class.
  Entities: State, Memento, Iterator, Visitor.
  Duration: ~70 min.

**Part 5 — Applied design (Unit 12, ~2h)**

Unit 12 · **Systems that use patterns together**
  Four applied problems walked end-to-end: Parking Lot System, Library Management System, LRU Cache, Chess Game. Each introduces or reinforces multiple patterns in concert.
  Entities: 4 problems from the LLD problem catalog; ~8 patterns referenced.
  Duration: ~120 min.

**Not in V1 (future units):**

- Functional-composition-as-pattern
- Domain-driven design primer
- Event-driven patterns
- Language-specific variants (Go interface composition, Rust traits as pattern carriers)

These live in the backlog, not V1.

### 10.1 Pattern coverage check

Counting patterns covered in units 4–11:
- Creational: Factory Method, Abstract Factory, Singleton, Builder, Prototype (5)
- Structural: Adapter, Facade, Decorator, Proxy, Composite, Bridge, Flyweight (7)
- Behavioral: Observer, Mediator, Chain of Responsibility, Strategy, Template Method, Command, State, Memento, Iterator, Visitor (10)

Total: 22 patterns across units. Old LLD's catalog has 36. The remaining 14 are niche / less common and are accessible from the Toolkit's Patterns Library (direct canvas + short description) without being in the curriculum. Future curriculum versions may promote some of them.

### 10.2 Problem coverage check

Unit 12 uses 4 problems in depth. The remaining 29 are accessible from Toolkit's Problems Workspace. Users doing Persona C (interview-prep) will use the Problems Workspace for most of their engagement; the curriculum's Unit 12 is for learners who want to see the patterns-in-use story.

---

## 11. The 10 Sub-Projects

Each sub-project is a bounded unit of work with its own spec, plan, and implementation. The spec for each references §6 (architecture), §8 (data model), §9 (pedagogy) of this document.

### 11.1 SP1 · Foundation

**Purpose:** Establish the module scaffolding, schema, and shell.

**Deliverables:**
- DB schema for `blueprint_courses`, `blueprint_units`, `blueprint_user_progress`, `blueprint_journey_state`, `blueprint_events`
- Drizzle migrations
- Route tree at `/modules/blueprint/*` (stub pages for all routes)
- Left-rail nav entry for Blueprint (behind feature flag during dev; always on for V1 ship)
- `BlueprintShell` component (top chrome, breadcrumb, surface router)
- `blueprint-store` with surface/journey/toolkit/prefs slices
- `useBlueprintRoute` hook for URL ↔ store sync
- `usePrefsSync`, `useJourneyStateSync` hooks for server-sync of user state
- Analytics events file `src/lib/analytics/blueprint-events.ts`
- Seed script for 12 unit placeholder records (no content yet)
- Unit + integration tests
- Developer README

**Verifies:** Visiting `/modules/blueprint` shows the shell with three surfaces, URL-driven; empty-state on each; no 404s; auth optional.

### 11.2 SP2 · Journey Home

**Purpose:** Make the course visible and welcoming.

**Deliverables:**
- Journey home page: welcome banner (first-run) + resume card + curriculum map + streak pill
- Curriculum map component: 12 units as nodes, prerequisite edges, state-based rendering (locked / available / in_progress / completed / mastered)
- Unit card component: title, duration, progress bar, tag chips
- Resume card: current unit + section + "Continue →"
- Streak pill: days + review-due count
- Progress dashboard page
- Pattern mastery grid (with progress circles)
- Problem history list
- Streak detail page
- Tests
- Desktop polish pass

**Verifies:** First-run users see welcome; return users see resume card; curriculum map visually accurately reflects progress; clicking a unit card routes to `/unit/<slug>`.

### 11.3 SP3 · Unit Renderer

**Purpose:** The heart of the journey experience.

**Deliverables:**
- `UnitPage` component that reads a unit's recipe from the API
- Section-router that dispatches to section-type components
- Section components: `ReadSection`, `InteractSection`, `ApplySection`, `PracticeSection`, `RetainSection`, `ReflectSection`, `CheckpointSection`
- MDX compile pipeline for `read` sections (adapted from old LLD's compile:lld-lessons but with Blueprint-specific components)
- Inline interaction widgets (MCQ, click-class, drag-reorder, fill-blank, spot-mistake, match-pairs)
- Section scroll-sync (IntersectionObserver) → URL hash
- Unit completion screen (celebration + next-up)
- Progress writes on each section completion
- FSRS card scheduling hook (retain sections)
- Contextual AI surfaces (§9.7)
- TOC side rail
- Bookmark strip (reuse old LLD's `useBookmarks` with Blueprint-scoped keys)
- Tests + Playwright journey test

**Verifies:** A full unit can be traversed end-to-end; progress persists; retain sections schedule cards; browser refresh restores exact scroll + section; back button navigates to previous section then unit.

### 11.4 SP4 · Toolkit · Patterns Library

**Purpose:** Direct-access browse and canvas for all 36 patterns.

**Deliverables:**
- Patterns Library landing page: grid of 36 patterns, filterable by category, searchable
- Pattern detail page: canvas (reuse `LLDCanvas`) + description + code sample (reuse code gen) + "open lesson" link (to the unit containing this pattern, if authored)
- Compare mode: two-pattern side-by-side (reuse `PatternComparisonOverlay` adapted)
- Language switcher (TS / Py / Java)
- Export SVG/PNG
- Bookmark button (adds to Review queue at mastery decay)
- Tests

**Verifies:** User can browse/open any pattern's canvas; language toggle works; export downloads correctly; bookmark writes to FSRS.

### 11.5 SP5 · Toolkit · Problems Workspace

**Purpose:** Free-form drill of any of the 33 problems.

**Deliverables:**
- Problems Workspace landing: grid of 33 problems, filterable by difficulty and pattern-used
- Problem detail page: requirements + hints + reference solution link (gated)
- Drill mode: 3 sub-modes (Interview / Guided / Speed) — timer-driven, canvas, submit, grade, celebrate
- Grading tier animations (★ 90+ / ✓ 70–89 / ◐ 50–69 / ○ <50) reusing grading-engine
- AI one-line feedback per submission
- Retry, reset, exit flows
- Hint credit budget (15 credits / problem)
- Tests

**Verifies:** User can drill a problem end-to-end; grade computes; AI feedback posts; FSRS updates for referenced patterns; timer behaves correctly across pauses/resumes.

### 11.6 SP6 · Toolkit · Review Inbox

**Purpose:** Daily FSRS review habit.

**Deliverables:**
- Review Inbox landing: due-cards queue, daily target, streak, "Start session →"
- Flashcard player: front (prompt) → reveal → rate (Again / Hard / Good / Easy)
- FSRS-5 integration (existing `ts-fsrs` client)
- Card types: pattern-name-from-scenario, scenario-to-pattern, UML-diff, code-snippet-from-pattern
- Session summary (cards reviewed, performance, streak update)
- Navigation back to Journey at end
- Tests

**Verifies:** Due cards surface correctly by FSRS schedule; ratings update stability; streak increments once per day; session summary is accurate.

### 11.7 SP7 · Content Authoring · Wave 1

**Purpose:** Author Units 1–4 (Foundations + first Creational).

**Deliverables:**
- Content/blueprint/units/01-what-is-a-pattern/
- Content/blueprint/units/02-coupling-cohesion/
- Content/blueprint/units/03-open-closed-principle/
- Content/blueprint/units/04-making-objects/
- All `read` section MDX
- All `interact` section payloads (JSON)
- All `apply` section canvas targets
- All `practice` problem overlays
- Unit recipes (unit.yaml for each)
- FSRS card seeds per unit
- Compile + upsert pass
- Manual walkthrough verification (not automated)

**Verifies:** All four units render correctly through SP3's Unit Renderer; content passes the voice test in §9.3; compile pipeline deposits correct data.

### 11.8 SP8 · Content Authoring · Wave 2

**Purpose:** Author Units 5–8 (rest of Creational + Structural).

**Deliverables:** same shape as SP7 for units 5–8.

### 11.9 SP9 · Content Authoring · Wave 3

**Purpose:** Author Units 9–12 (Behavioral + Applied).

**Deliverables:** same shape as SP7 for units 9–12. Unit 12 (Applied) requires problem-overlay authoring for the four featured problems.

### 11.10 SP10 · Polish

**Purpose:** Motion, typography, accessibility, frustration detection, analytics hardening.

**Deliverables:**
- Motion language (sections slide; progress ring fills; unit completion flourish)
- Typography pass (editorial serif for `read`, mono for code, sans for UI)
- Dark mode polish
- Frustration detection per §9.7 and original spec Q15
- Event taxonomy full coverage (all 25 events wired)
- A11y audit (WCAG 2.2 AA for shell + toolkit; lesson content screen-reader polish)
- Empty-state art direction
- Error-state art direction
- Performance audit (LCP < 2.5s on journey home, TBT < 200ms)
- Tests

**Verifies:** Lighthouse score ≥ 95 on all major pages; no axe violations; analytics fires every taxonomy event; motion respects `prefers-reduced-motion`.

---

## 12. Dependency Graph and Sequencing

```
SP1 (Foundation)
   │
   ├──▶ SP2 (Journey Home)
   │        │
   │        └──▶ SP3 (Unit Renderer)
   │                 │
   │                 ├──▶ SP7 (Content Wave 1)
   │                 │        └──▶ SP8 (Content Wave 2)
   │                 │                 └──▶ SP9 (Content Wave 3)
   │                 │                          │
   │                 └────────────────────────▶ SP10 (Polish)
   │
   ├──▶ SP4 (Patterns Library)  ─┐
   ├──▶ SP5 (Problems Workspace) ├──▶ SP10 (Polish)
   └──▶ SP6 (Review Inbox)       ─┘
```

**Hard ordering:**
- SP1 blocks all others (nothing exists without the shell)
- SP2 blocks SP3 (Unit Renderer depends on Journey Home's unit cards and routing)
- SP3 blocks SP7 (Wave 1 content can't be authored without a renderer to verify against)
- SP7 blocks SP8, SP8 blocks SP9 (content waves are sequential for narrative continuity)
- SP10 blocks the PR merge (polish ships with the rest)

**Parallel opportunities:**
- SP4, SP5, SP6 can ship in any order after SP1. They share no code with each other.
- SP4/SP5/SP6 can ship concurrently with SP3 as soon as SP2 is done (Toolkit is independent of Unit Renderer).

**Per-agent dispatch strategy (when executing):**
- Each sub-project is one agent dispatch (or a small chain of dispatches if the spec is big).
- Content waves (SP7/8/9) can dispatch parallel agents for each unit within a wave, then one consolidation pass.
- Polish (SP10) is sequential because each polish step depends on a stable prior step.

---

## 13. Design Language

**Typography hierarchy:**
- Display (unit titles, welcome headline): Fraunces (existing brand display) 700 italic for editorial feel
- Headline (section titles): Fraunces 600 regular
- Body (`read` section prose): EB Garamond 400 for long-form reading (editorial serif; matches "course, not dashboard" thesis)
- UI (buttons, labels, chrome): Figtree 500 (existing UI font)
- Code (snippets, identifiers): JetBrains Mono 400
- Numerals in stats: Tabular old-style (JetBrains Mono tabular or Figtree with tnum)

**Color:**
- Base background: `#F4F1EA` (warm cream, existing brand canvas)
- Text: `#2A1F1A` (deep warm ink)
- Accent (Blueprint): indigo-sky gradient — `#1E3A8A → #38BDF8` (distinct from old LLD's primary red/amber; signals "different module")
- Section type colors: `read` indigo · `interact` amber · `apply` terracotta · `practice` plum · `retain` sage · `reflect` slate
- Progress states: `locked` neutral-400 · `available` neutral-700 · `in_progress` accent · `completed` sage-600 · `mastered` gold-500

**Motion:**
- Section transitions (scroll-driven): cubic-bezier(.2,.7,.2,1), 400–600ms
- Unit map hover: 100ms ease
- Completion flourish: 1.6s bezier with confetti (reduced-motion: skip flourish, keep sound)
- Toolkit drawer: slide-from-right, 250ms ease-out
- Progress ring fills: 800ms bezier

**Grain / texture:**
- Global grain overlay: 5% opacity, mix-blend-mode multiply (reuse DESIGN-PLAYBOOK `body::before` pattern)
- No glass morphism. No liquid blobs. No purple-on-white gradients.

**Shell layout:**
- 64px left icon rail (Architex global nav, unchanged)
- 48px top bar (logo + journey/toolkit/progress links + search + user)
- 40px breadcrumb row
- Main surface fills remaining
- 28px status bar bottom (single-line, right-aligned status elements)

---

## 14. Accessibility and Desktop-Only Scope

**Desktop-only means:**
- Min viewport: 1280 × 720
- Below 1024 wide: show an "Open Blueprint on desktop" landing card (like old LLD's Build mode honest-nudge from original spec Q6)
- Mobile breakpoints are explicit not-implemented for V1; a future mobile spec will add them

**Desktop keyboard navigation (non-negotiable for V1):**
- `⌘K` — command palette (journey search, toolkit jump, pattern search)
- `/` — search (focuses the search input)
- `j` / `k` — section next/prev on unit page
- `?` — keyboard help overlay
- `Esc` — close any overlay; from within a tool, return to Toolkit home; from home, no-op
- Tab order respects visual order; focus ring visible

**Screen reader:**
- Unit recipe announces as ordered list of sections
- Section activations announce type and title ("Interactive exercise: spot the telescoping constructor")
- Canvas interactions announce entity changes ("Added class `Builder` to canvas")
- Progress changes announce state ("Unit 3 marked in progress")

**Color contrast:**
- Body text passes AA (4.5:1) against cream background
- All section-type colors pass 3:1 large-text minimum

**Motion:**
- All non-essential motion respects `prefers-reduced-motion: reduce`
- Essential motion (progress ring fills) respects the preference by snapping to final value instantly

**Cognitive load:**
- No autoplay media
- No interstitial popups outside AI surfaces (§9.7)
- No dark patterns (false urgency, fake scarcity)

---

## 15. Analytics and Success Metrics

### 15.1 Event taxonomy (25 events, typed via `src/lib/analytics/blueprint-events.ts`)

**Journey:**
1. `blueprint.module_opened`
2. `blueprint.welcome_shown`
3. `blueprint.welcome_dismissed`
4. `blueprint.resume_clicked`
5. `blueprint.unit_opened`
6. `blueprint.unit_completed`
7. `blueprint.unit_mastered`
8. `blueprint.section_opened`
9. `blueprint.section_completed`
10. `blueprint.checkpoint_started`
11. `blueprint.checkpoint_passed`

**Toolkit:**
12. `blueprint.toolkit_opened`
13. `blueprint.tool_pinned`
14. `blueprint.pattern_viewed`
15. `blueprint.problem_drill_started`
16. `blueprint.problem_drill_submitted`
17. `blueprint.review_session_started`
18. `blueprint.review_session_completed`
19. `blueprint.flashcard_rated`

**Cross-cutting:**
20. `blueprint.search_performed`
21. `blueprint.ai_surface_triggered`
22. `blueprint.ai_request_sent`
23. `blueprint.frustration_detected`
24. `blueprint.error_shown`
25. `blueprint.streak_updated`

Each event has typed payload (see SP1 deliverable). PostHog properties include user_id, unit_id, section_id where relevant.

### 15.2 V1 success criteria (soft, for retrospective)

- 30% of unique users visit Blueprint in the first 30 days
- Median session duration > 8 min on Journey home
- 40% of users who start a unit complete it within 7 days
- 25% of users who complete a unit do the checkpoint
- 15% of users maintain a 7-day review streak by day 30
- No single event exceeds 50 errors/day in server logs

Hard success criteria (must hit before public link):
- No P0 bugs in Sentry for 7 consecutive days pre-launch
- Lighthouse ≥ 95 on home, unit, toolkit-home
- Axe violations = 0 on shell + toolkit shells
- PostHog events firing at ≥ 99% event coverage vs instrumentation

---

## 16. Non-Goals

These are explicit out-of-scope items. A proposal to add them during implementation should be bounced back to this list, not negotiated in-place.

- **Mobile V1.** Journey or Toolkit on < 1024 wide viewport.
- **Multiplayer.** No shared canvases, co-editing, study-groups in V1.
- **Leaderboards.** No public rankings.
- **Certificates.** No PDF completion certificates.
- **Payment / monetization.** Free in V1; pricing is a separate spec.
- **AI-generated lesson content.** All `read` MDX hand-authored.
- **Auto-translation / i18n.** English-only V1.
- **Spaced repetition for problems.** FSRS is pattern-level only in V1; problem retention is a V2 item.
- **Visual-first IDE embedding (e.g., Monaco for code sections).** V1 uses syntax-highlighted static code with optional copy button. A future spec may add a live playground.
- **Importing user's own code / codebase analysis.** V1 doesn't ingest user code.
- **Team / organization accounts.** V1 is single-user.
- **A/B experiments.** V1 ships with a single variant; experimentation infra is a later sub-project outside Blueprint scope.
- **Downloadable course-content exports.** V1 content is web-only.

---

## 17. Open Questions Resolved in Sub-Project Specs

Items that are intentionally deferred to individual sub-project specs:

- **SP1:** Exact feature-flag mechanism (if any) during initial dev. Exact migration ordering. Dev vs prod DB seeding.
- **SP2:** Curriculum map node graph vs linear list — final pick. Resume card prominence on wide viewports. Streak-pill placement.
- **SP3:** MDX compile pipeline details — reuse old LLD's `compile:lld-lessons` vs new. Canvas invocation inside `apply` sections — inline iframe vs portal.
- **SP4–6:** Per-tool sub-modes (e.g., Problems Workspace Interview vs Guided timing rules). Tool-pin UX.
- **SP7–9:** Per-unit voice calibration. Checkpoint rubric weights per unit.
- **SP10:** Final motion curves. Exact shadow depths. Light-mode vs dark-mode parity checklist.

Each sub-project spec will record its resolution inline and cite back to this document.

---

## 18. References

**Within the repo:**
- `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` — prior spec (preserved voice + pedagogy sections; superseded mode model)
- `docs/superpowers/specs/2026-04-20-lld-implementation-handoff.md` — execution playbook
- `docs/superpowers/plans/2026-04-20-lld-phase-*.md` — Phase 1–6 plans (old LLD, still active)
- `architex/src/components/modules/lld/` — old LLD component tree
- `architex/src/lib/lld/` — pattern/problem catalogs and engines (shared)
- `architex/CLAUDE.md` / `architex/AGENTS.md` — project rules
- `architex/docs/CONTENT_STRATEGY.md` — brand voice
- `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` — tokens

**External (pedagogy):**
- Roediger & Karpicke 2006 — "Test-Enhanced Learning" (retrieval practice)
- Rohrer & Taylor 2007 — "The Shuffling of Mathematics Problems Improves Learning" (interleaving)
- Cepeda, Pashler et al. 2006 — "Distributed Practice in Verbal Recall Tasks" (spacing effect)
- Mark 2015 — "The Cost of Interrupted Work" (attention windows)
- Nielsen Norman Group on e-learning UX (card patterns, progress feedback)

**Competitive reference:**
- Brilliant.org — lesson-as-micro-interaction-sequence
- Duolingo — unit-based daily habit
- Educative.io — embedded code playgrounds
- Refactoring.Guru — pattern catalog (not a course)

---

## Appendix A · Glossary

- **Unit** — a bounded learning experience in the curriculum. 12 in V1.
- **Section** — a chunk of a unit; has a type (read/interact/apply/practice/retain/reflect/checkpoint).
- **Recipe** — the ordered list of sections that composes a unit.
- **Entity** — a pattern or a problem; the thing a section is "about".
- **Surface** — one of three top-level views: Journey, Toolkit, Progress.
- **Tool** — one of three Toolkit children: Patterns Library, Problems Workspace, Review Inbox.
- **Sub-project** — one of 10 bounded work units to implement Blueprint.
- **Checkpoint** — the ending section of a unit; gates the next unit's visibility (soft gate).
- **FSRS** — the spaced repetition algorithm used for review scheduling.
- **Retain section** — a section type that schedules FSRS cards.

## Appendix B · Anti-Patterns (do not do these)

The following are architectural moves that would reintroduce the bugs this spec exists to solve. They are explicitly forbidden:

- Adding a top-level mode switcher to Blueprint.
- Rendering Toolkit panels at the same time as Journey panels.
- Letting the URL carry a naked `mode=` param.
- Spreading journey state across more than one store.
- Computing the current surface from anything other than the URL.
- Importing old LLD's `useLLDModule` hook.
- Rendering more than one `LLDCanvas` at a time in the same view.
- Embedding the Unit Renderer inside the Toolkit or vice versa.
- Duplicating MDX compilation pipelines; if old LLD's compile pipeline almost works, adapt it; if it doesn't fit, write a Blueprint-specific one from scratch.

---

*End of vision spec. Next: sub-project 1 spec at `docs/superpowers/specs/2026-04-21-blueprint-sp1-foundation.md`.*
