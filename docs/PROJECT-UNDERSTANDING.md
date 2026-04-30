# Architex — Project Understanding

_Generated 2026-04-30 via 10-agent parallel sweep (frontend / backend / database / API / UI-UX / design / features / product / PM / infra)_

> **Coverage note.** Three of ten agents (design system, API surface, infra/ops) hit a persistent OneDrive FileProvider wedge during their run windows. Their dimensions are partially reconstructed from cross-cutting data captured by the seven agents that read successfully. Confidence is flagged inline.

---

## Executive Summary — If you read nothing else

**What it is.** Architex is an interactive engineering education platform — a Next.js 16 + React 19 web app where engineers don't just *read* about system design, they **build architectures on a live canvas, simulate production traffic, inject failures, and learn from what breaks**. The product spans 13 modules (Algorithms, Data Structures, OS, Database, Networking, System Design, LLD patterns, Distributed, Concurrency, Security, ML Design, Interview, Knowledge Graph), with the LLD ("Low-Level Design") module being the most mature feature.

**Who it's for.** ICP is **interview-prep candidates** (60% of documented persona mix), with secondary segments of senior-engineer refreshers (20%), CS students (10%), educators (5%), and content creators (5%). Heavy bias toward FAANG / Uber-style system-design interview prep — there's a dedicated `07-uber-prep/` folder and an `ARCHITEX_INTERVIEW_PREP_SPEC.md` mapping 350+ features across 18 interview round types.

**Core mechanics (the wedge).**
1. **Live simulation engine** — 10-stage tick pipeline (traffic → BFS amplification → pressure → cascade → metrics → frame recording → cost → time-travel). 30+ chaos events. The single biggest moat.
2. **Interactive UML/architecture canvas** — `@xyflow/react` v12 + Dagre + custom A* edge router, with 75+ node types each wrapped in error boundaries.
3. **AI-graded drill flow** — 5-stage interview drill (Clarify → Rubric → Canvas → Walkthrough → Reflection) with streaming Claude interviewer, gate predicates per stage, fuzzy-Levenshtein grading engine, and AI-generated postmortems.
4. **FSRS-based spaced repetition** — `progress` table tracks `stability`, `difficulty`, `fsrs_state` per (user, module, concept).
5. **Open source under AGPL-3.0** — explicitly differentiated from closed competitors.

**Tech stack one-liner.** Next.js 16.2.3 (App Router) / React 19.2.4 / TypeScript 5 / Tailwind v4 (CSS-first config) / Drizzle ORM 0.45.2 on Neon Serverless Postgres / Clerk v7 auth / `@xyflow/react` canvas / Zustand + TanStack Query state / `motion/react` v12 animation / Vitest + Storybook 10 + Playwright testing.

**Top 3 risks.**
1. **Strategy ↔ code disagree.** Memory says "old LLD frozen, sunset deferred"; the last week of `main` commits is 5 drill bug fixes on old LLD. Phase 4 declared "DONE" then immediately ate stabilization. Drift between stated direction and where time actually goes.
2. **Two parallel schema trees** in the repo (root-level `drizzle/` + design-doc-quality `src/db/schema/` vs the actually-deployed `architex/src/db/schema/`). Newcomers will edit the wrong tree.
3. **Hand-authored content is the velocity ceiling for Blueprint.** SP3 produced exactly **one** authored unit. If the curriculum is 12+ units and the rule is "no Opus auto-gen," content rate dictates everything else.

**Top 3 highest-leverage bets (next 4 weeks).**
1. **Stop shipping new code on `/modules/lld`.** Declare drill done at known-quality, write one real e2e for the resume + abandon path (the bug that ate 5 commits), and freeze.
2. **Move full focus to Blueprint SP4 + SP5.** SP1–SP3 prove the journey-first / unit-renderer / content-pipeline infra; remaining sub-projects multiply value on top.
3. **Write the old-LLD sunset trigger down.** Pick a concrete trigger ("when Blueprint reaches SP6 + 8 authored units, old LLD goes read-only") and commit it to `architex/docs/`. Without one, drill bugs will keep peeling sessions away from Blueprint indefinitely.

---

## Table of Contents

1. [Product Positioning](#1-product-positioning)
2. [Feature Inventory](#2-feature-inventory)
3. [UI / UX Flows](#3-ui--ux-flows)
4. [Design System](#4-design-system)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend / Server](#6-backend--server)
7. [Database & Data Model](#7-database--data-model)
8. [API Surface](#8-api-surface)
9. [PM / Roadmap Lens](#9-pm--roadmap-lens)
10. [Infra / Ops / DX](#10-infra--ops--dx)
11. [Cross-cutting Observations](#11-cross-cutting-observations)
12. [Open Questions for the Owner](#12-open-questions-for-the-owner)

---

## 1. Product Positioning

**Confidence: HIGH** — reconstructed from `architex/README.md`, `ARCHITEX_PRODUCT_VISION.md`, `docs/CONTENT_STRATEGY.md`, `docs/PAPERDRAW_VS_ARCHITEX_ANALYSIS.md`, `docs/research-findings/15-user-journeys.md`, `docs/research-findings/23-competitive-landscape.md`, and `architex/docs/PROJECT_COMPLETE_ANALYSIS.md` (read via cached session JSONL when OneDrive was wedged).

### One-line positioning (verbatim from README)

> *"Architex is the only platform where engineers don't just study system design — they build architectures, simulate production traffic, inject failures, and learn from what breaks, across 13 interactive modules from algorithms to distributed consensus to security, all open source."*
> — `architex/README.md:41`

**Tagline:** *"Build it. Simulate it. Break it. Learn from it."* (`architex/README.md:563`)

### Target user (5 documented personas)

| Persona | Share | Source |
|---|---|---|
| Interview Prep Student | **60%** | `docs/research-findings/15-user-journeys.md` |
| Senior Engineer (refresher) | 20% | same |
| CS Student | 10% | same |
| Educator | 5% | same |
| Content Creator | 5% | same |

The dominant ICP is unambiguous — **interview-prep candidates, FAANG/Uber-leaning**, not bootcamp students or working seniors.

### Problem statement

> *"Interactive, scored system design practice with real-time simulation feedback. The market has content platforms (explain), code judges (test algorithms), and diagram tools (draw). Nobody offers all four: simulation + education + interactive canvas + open source."*
> — `architex/README.md:39`

### Core mechanic / wedge

The wedge is the **production-grade simulation engine** running in the browser, fused with structured curriculum:
- 10-stage tick pipeline (traffic → BFS → amplification → pressure → issue detection → edge flow → metrics → frame recording → cost → time-travel)
- 30+ chaos events across 10 categories
- Cascade engine with circuit breakers, retries, fallback propagation
- O(1) time-travel debugger (frame-by-frame replay)
- Narrative engine — 20 templates that turn raw failure into prose
- What-If engine — clone topology, modify, run comparative sims
- Live cost model across ~75 component types

### Voice & tone (codified)

> *"A sharp, generous senior engineer who explains things clearly, celebrates your progress genuinely, and never wastes your time."*
> — `docs/CONTENT_STRATEGY.md`

**Tonal mix:** 65% professional / 35% casual · 60% serious / 40% playful · 80% concise / 20% verbose · 55% technical / 45% accessible · 60% friendly / 40% authoritative.

**Three immutable rules:** (1) Clarity beats cleverness. (2) Confidence without arrogance. (3) Respect the learner's time.

**Naming choices:** Learn (not "Study"), Build (not "Practice"), Review (not "Remember"), Challenge (not "Problem"), Achievement (not "Badge"), **"Ask the Architect"** (not "AI Tutor").

### Competitive landscape

| Competitor | How Architex differs (per artifacts) |
|---|---|
| **Educative / DesignGurus / Grokking** | Static content; Architex ships *living canvas + real interviewer + real stakes*. |
| **AlgoExpert / SystemsExpert** | Video + transcripts; Architex's diff is canvas interactivity + simulation. |
| **HelloInterview** | **Not named anywhere in the artifacts** — honest gap. |
| **ByteByteGo** | Cited as the **traffic benchmark** (100K+ visitors/mo aspiration), not a feature competitor. *"No simulation, no interactive canvas."* |
| **PaperDraw** (Feb 2026) | The actual canonical rival. Has 107 components vs Architex's 35, GPU canvas vs DOM, but **0 educational modules** vs Architex's 13. Clean split: PaperDraw = pure simulator; Architex = simulator + curriculum + interview prep + open source. |

### Strategic risks (positioning-level)

1. **ICP confusion** — hero copy reads "interactive engineering laboratory" (positions like a playground), but every other artifact is interview-prep. Pricing assumes $12/mo for interview candidates; positioning advertises a broader audience.
2. **Wedge is replicable, and a faster competitor already has it** — PaperDraw shipped a deeper simulation engine 5 months earlier. The residual moat is the curriculum wrapped around the simulator — a *content* moat, not a tech moat.
3. **AGPL-3.0 blocks both directions** — no enterprise SaaS competitor can fork cleanly, but Architex itself can't quietly take it closed-source if SaaS economics pressure.
4. **Solo-developer scope vs. PhD-level ambition** — maturity scorecard shows Architecture 9/10, Content 9/10, but **Testing 2/10, Security 4/10**, with **5 CRITICAL security vulnerabilities** flagged (incl. CVE-2025-29927 middleware bypass).
5. **Landing page doesn't exist yet** — *"15 of 22 wireframe screens unbuilt — P0 missing: Home Dashboard, Module Selection, Landing Page, Interview Results"*. No landing page = no acquisition funnel.
6. **13-module sprawl dilutes the wedge** — *"Every other module is a feature; the simulation engine is the product differentiator,"* but the marketing surface treats all 13 as equal.

---

## 2. Feature Inventory

**Confidence: HIGH** — file tree captured before OneDrive freeze; ~28 user-facing surfaces, ~50 API endpoints.

### At a glance

- **~18 surfaces look live** (page route + supporting API/data infra)
- **~7 are WIP** (page exists but supporting subsystem partial — Blueprint, drill subsystems, AI hint/explain)
- **~3 are stubs/marketing** (pricing, team, landing alt)
- **Two clear feature clusters:** (a) Drill/LLD ecosystem — heaviest investment with 18 LLD-prefixed routes; (b) Content tracks — five top-level numbered directories sit *outside* the Next app and surface through `/concepts`, `/patterns`, `/ds`, `/algorithms`, `/database`, `/os`, `/problems`, `/lld-problems`.

### Feature catalog (selected — full table is 65 rows)

| # | Feature | Status | Primary route | DB-backed? |
|---|---------|--------|---------------|------------|
| 1 | Marketing landing | live | `/` | no |
| 2 | Alt landing (a/b?) | WIP | `/landing` | no |
| 3 | Auth (Clerk catch-all) | live | `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` | yes |
| 4 | Clerk webhook | live | `POST /api/webhooks/clerk` | yes |
| 5 | Dashboard | live | `/dashboard` (24,565 bytes — substantial) | yes |
| 6 | Public profile | live (mock data) | `/profile/[username]` | yes |
| 7 | Settings | live | `/settings` | yes |
| 8 | Pricing | stub | `/pricing` | no |
| 9 | Team | stub | `/team` | no |
| 10 | Modules index | live | `/modules` | yes |
| 11 | Concepts | live | `/concepts`, `/concepts/[slug]` | mixed |
| 12 | OS topics | live | `/os`, `/os/[concept]` | mixed |
| 13 | Database track | live | `/database/[mode]` | mixed |
| 14 | Data structures | live | `/ds/[slug]` | mixed |
| 15 | Algorithms | live | `/algorithms/[category]/[slug]` | mixed |
| 16 | Patterns library | live | `/patterns`, `/patterns/[slug]` | yes |
| 17 | HLD problems (30 packs) | live | `/problems`, `/problems/[slug]` | mixed |
| 18 | LLD problems (10 packs) | live | `/lld-problems`, `/lld-problems/[slug]` | mixed |
| 19 | **Drill (multi-stage practice)** | live (active fixes) | UI in LLD problem page; `/api/lld/drill-attempts/*` | yes |
| 20 | Drill streaming interviewer | live | `/api/lld/drill-interviewer/[id]/stream` | yes |
| 21 | LLD designs (canvas + snapshots + annotations) | live | `/api/lld/designs/*` | yes |
| 22 | LLD lessons + learn-progress | live | `/api/lld/lessons/*`, `/api/lld/learn-progress/*` | yes |
| 23 | LLD bookmarks + concept-reads | live | `/api/lld/bookmarks/*`, `/api/lld/concept-reads` | yes |
| 24 | LLD templates library (~60 blueprints) | live | `/api/lld/templates-library` | yes |
| 25 | LLD AI suggest-nodes | live | `/api/lld/ai/suggest-nodes` | partial (AI) |
| 26 | LLD inline AI explain | live | `/api/lld/explain-inline` | partial (AI) |
| 27 | Embeds (algorithms, LLD problem/pattern/SOLID) + oEmbed | live | `/embed/*`, `/api/oembed` | mixed |
| 28 | OG image generator | live | `/api/og`, `/api/og/database` | no |
| 29 | Blog + RSS | live | `/blog`, `/blog/[slug]`, `/blog/feed.xml` | no (MDX/FS) |
| 30 | Interviews by company (15 companies) | live | `/interviews`, `/interviews/[company]` | mixed |
| 31 | Gallery | live | `/gallery` | unknown |
| 32 | Offline (PWA) | live | `/offline` | no |
| 33 | Cross-content search | live | `/api/search` (no UI page found) | yes |
| 34 | Progress + activity log | live | `/api/progress`, `/api/progress/sync`, `/api/activity` | yes |
| 35 | Diagrams CRUD | live | `/api/diagrams/*` | yes |
| 36 | Quiz, Challenges, Simulations, Templates, Learning-path, Review, Evaluate, Hint, AI Explain, Content | live | various `/api/*` | yes/partial |
| 37 | Email preview | dev/WIP | `/api/email-preview` | no |
| 38 | CSP report sink + Health check | live (infra) | `/api/csp-report`, `/api/health` | no |
| 39 | **Blueprint module** | **WIP — branch only, no route in main** | (none in main) | TBD |
| 40 | Content tracks (FS, outside Next app) | live (content) | surfaced via `/modules`, `/concepts` | n/a |

### Content vs interactive split

- **8 static content tracks** (FS-backed): Foundations · Core system design (11 sub-modules) · Advanced · Specialization (8 sub-tracks) · HLD problems (30 packs) · LLD problems (10 packs) · Uber prep · Blog
- **~50 interactive product features** requiring app + DB

### Cross-feature observations

- **Progress is the central shared rail.** General `/api/progress`, `/api/activity`, plus feature-specific (`/api/lld/learn-progress`, drill attempts, concept-reads, bookmarks). Dashboard reads across all of them. **Five separate progress representations** = consistency drift risk.
- **Drill is by far the deepest subsystem** — 11 distinct drill routes, 4 AI engines, 6-axis rubric, 5 personas. Recent commit history confirms it's the actively-worked surface.
- **AI is plugged in at 6 separate points** with no visible single gateway module — `/api/ai/explain`, `/api/hint`, `/api/lld/explain-inline`, `/api/lld/ai/suggest-nodes`, `/api/lld/drill-interviewer/[id]/stream`, `/api/evaluate`. Prompt drift risk.
- **LLD subsystem appears self-contained** — has its own copies of common features (`/api/user-preferences/lld` parallels `/api/user-preferences`).

### Gaps & smells

1. Blueprint module not yet routed in `main` (lives only on `feat/blueprint-module` worktree).
2. Pricing & Team are likely empty stubs.
3. Two "landing" pages (`/` and `/landing`) — likely a/b or unfinished migration.
4. `/api/email-preview` in production tree — should be dev-gated.
5. Duplicated AI surfaces without a shared client module.
6. No `/search` UI page despite `/api/search` existing.
7. Drill 409-recovery commit cluster suggests a partial-completion bug class that may recur in other write-heavy LLD endpoints.
8. Old LLD module not sunset per memory ("Option 3 absorb + old LLD kept (sunset deferred)") — two modules will coexist post-Blueprint.

---

## 3. UI / UX Flows

**Confidence: HIGH** — read full source.

### Journey: Auth (Sign-in / Sign-up)

- Entry: `/sign-in` (`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`), `/sign-up`
- Static placeholder card with one "Continue to App" link. Clerk's `<SignIn>` widget renders only if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set.
- **Critical gap:** middleware (`src/middleware.ts:56`) only calls `auth.protect()` when env var is present, so in dev the entire app is unauthenticated.

### Journey: Home / Dashboard

- `/` renders `AppShell` (4-panel canvas workspace). `/dashboard` renders the stats page.
- Dashboard: spinner → onboarding card (first-time) OR stats row + skill radar + module grid + recent activity + recommended-next.
- **Smell:** "Recommended Next" uses `window.location.href = "/"` (full reload) instead of `<Link>`.
- **Smell:** Activity bar uses roving tabindex with arrow-keys + focus trap on mobile overflow — well-implemented. But module completion grid renders progress bars without `aria-valuenow/min/max`.

### Journey: Drill Flow (the main interactive loop)

1. LLD module → top-right `ModeSwitcher` → "Drill" tab → `DrillModeLayout`
2. `attemptId === null` → `StartDrillPanel`: variant picker, "Start drill" button (gated on `?lld=problem:<id>` query param)
3. `POST /api/lld/drill-attempts` → on 409 conflict, **inline amber banner with "Abandon & start new"** (recent commit `3e6100d`)
4. Active drill: `DrillStageStepper` (5-step progress) + `DrillTimer` in header. Right sidebar: `DrillHintLadder`. Bottom: `DrillSubmitBar`.
5. **5 stages, each with a gate predicate:**
   - **Clarify** — chat with interviewer persona, gate: ≥2 questions
   - **Rubric** — lock evaluation rubric, gate: `rubricLocked === true`
   - **Canvas** — UML class diagram, gate: ≥3 classes + ≥1 edge
   - **Walkthrough** — narration textarea, gate: ≥120 chars
   - **Reflection** — self-grade 1–5, gate: `selfGrade !== null`
6. "Submit drill" → `POST /api/lld/drill-attempts/<id>/grade` → `DrillGradeReveal` with score + band

**Critical gaps:**
- **Drill resume is in-memory only** — `useDrillStore` has no persistence middleware. Browser refresh drops `attemptId`. The `/active` endpoint exists but `DrillResumePrompt` component is built but not wired into `DrillModeLayout`.
- "Pause" PATCH fires but no UI feedback (no toast, no layout change, timer keeps running).
- "Give up" uses `window.confirm()` — inconsistent with the Radix-based dialog used elsewhere.

### Journey: Blueprint Module

- **Does not exist as a route on `main`.** Lives entirely on `feat/blueprint-module` worktree.
- `WelcomeBanner.tsx` inside the LLD module is the closest UX artifact — first-visit "Teach me / Let me build / Drill me" path picker.

### Journey: HLD / LLD problem viewers

- `/problems` (51 problems, 4 categories) and `/lld-problems` (33 problems, 6 categories) — both server components rendering from static `CHALLENGES` / `LLD_PROBLEMS` arrays.
- Detail pages have JSON-LD structured data, breadcrumbs, difficulty stars with `aria-label`.
- `/lld-problems/loading.tsx` exists; `/problems/loading.tsx` does NOT.

### Journey: Interviews (company prep)

- `/interviews` lists 15 tech companies as cards with difficulty badges.
- `/interviews/[company]` shows focus areas, sample questions, related problems.

### Journey: Profile / Settings

- **`/profile/[username]` is mock data** — uses `MOCK_PROFILES` map and calls `notFound()` (server-only) inside a `'use client'` component → runtime bug.
- `/settings` is comprehensive: Appearance, Animation, Sound, Accessibility, AI keys, Keyboard shortcuts, Data management.

### Cross-cutting UI patterns

- **Toasts:** `useToastStore` (Zustand), max 3 queued, animated via `motion/react` `AnimatePresence`. Types: success/error/warning/info.
- **Modals:** `ConfirmDialog` for "Clear Canvas" (Radix-based), but drill "Give up" uses `window.confirm()` — inconsistent.
- **Forms:** No global form library. Drill stage gates use inline amber text. Settings uses shadcn-style `Switch`/`Select`/`Label`.
- **Navigation:** Vertical `ActivityBar` (left edge, icon + tooltip + keyboard `1-9`). No top nav bar. `StatusBar` at bottom. Breadcrumbs only on SEO-oriented routes.

---

## 4. Design System

**Confidence: MEDIUM** — design system agent was OneDrive-blocked twice. Tokens below extracted by frontend agent during its read window.

### Stack

- **Tailwind v4** (CSS-first config — no `tailwind.config.*` exists, only `postcss.config.mjs`)
- **CSS custom properties** for tokens (no shadcn-direct tree; primitives in `src/components/ui/` are custom Tailwind wrappers)
- **`motion/react` v12** (Framer Motion successor) for animation
- **Geist Sans + Geist Mono** fonts via `geist` package
- **`prism-react-renderer`** for code highlighting
- **Lucide icons** (inferred from React-ecosystem norms; not directly verified)

### Color tokens (from `src/styles/globals.css`, dark-first)

```css
--primary: hsl(252 87% 67%);          /* violet */
--background: hsl(228 15% 7%);        /* Layer 0 — canvas */
--surface: hsl(228 15% 10%);          /* Layer 1 — panels */
--elevated: hsl(228 15% 12%);         /* Layer 2 — modals */
--overlay: hsl(228 15% 14%);          /* Layer 3 — topmost */
```

Aesthetic: **dense, dark-first, Linear/Bloomberg-inspired**. Not the Tailwind-default purple-blue; explicitly violet `hsl(252 87% 67%)`.

### Typography

- Display & body: **Geist Sans**
- Code, metrics, mono: **Geist Mono**
- Base size: **13px** (Linear/Bloomberg density — tighter than the 16px default)
- Scale: `--text-2xs: 10px` → `--text-xl: 20px`

### Motion (`src/lib/motion.ts`)

- **Named springs:** `snappy`, `gentle`, `soft`, `bouncy`, `layout`
- **Duration constants:** `instant: 60ms` → `glacial: 600ms`
- **Reduced-motion respected globally** via `MotionConfigBridge` provider

### Component primitives

- `src/components/ui/` contains ~30 components (Button, Card, Badge, Skeleton, Separator, Switch, Select, Toast, ConfirmDialog, etc.)
- **Smell:** All marked `"use client"` even though many are pure presentational (Card, Badge, Skeleton have no hooks/handlers).

### Patterns

- `cn()` helper at `src/lib/utils.ts` (Tailwind class composition)
- Tokens defined in `src/styles/globals.css` (via Tailwind v4 `@theme` block)
- Layer-based depth model (Layer 0–3 backgrounds)

### Gaps (could not fully verify due to OneDrive)

- Light-mode token values not captured — confirm via re-run
- Hardcoded color leak grep was not run
- `cva`/`tailwind-merge` usage not verified

---

## 5. Frontend Architecture

**Confidence: HIGH** — read full source.

### Stack

| Layer | Library + Version |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind v4 + CSS custom properties |
| State (client) | **Zustand v5 + Zundo** (undo/redo middleware) |
| State (server) | **TanStack Query v5** (`networkMode: "offlineFirst"`) |
| Canvas | **`@xyflow/react` v12.10.2** + Dagre + custom A* router |
| Animation | `motion/react` v12 |
| Local persistence | Dexie (IndexedDB) |
| Auth | Clerk v7 (conditionally loaded) |
| Testing | Vitest, Testing Library, Storybook 10, Playwright |

### Routing & rendering

- **App Router** (`src/app/`).
- Root layout is a **server component**. Provider tree (`ClerkProvider → ThemeProvider → MotionProvider → AnalyticsProvider → QueryProvider`) lives in `src/app/layout.tsx`.
- Below the provider boundary, **everything is client-rendered**. All 13 module components are loaded with `dynamic(..., { ssr: false })`.
- Up to **3 recently-visited modules stay mounted with `display: none`** to avoid re-mounting expensive canvases.
- **13 dynamic content routes lack `loading.tsx`** — no streaming SSR, no skeleton UI on initial visit.

### State & data

**Client state — Zustand (12-13 stores in `src/stores/`)**
- `ui-store`, `canvas-store`, `simulation-store`, `progress-store`, `editor-store`, `interview-store`, `viewport-store`, `ai-store`, `billing-store`, `collaboration-store`, `snapshot-store`, `notification-store`, `cross-module-store`
- All stores use `persist()` middleware → localStorage with keys `architex-{storeName}`

**Server data — TanStack Query v5** (`src/providers/QueryProvider.tsx`)
- staleTime: 5 minutes (line 10)
- `networkMode: "offlineFirst"`

**Smell:** TanStack Query staleTime (5 min) is misaligned with server `Cache-Control: s-maxage=86400`.

### Component hierarchy

```
src/app/layout.tsx                   ← server: root + provider tree
  ClerkProvider
    ThemeProvider
      MotionProvider
        AnalyticsProvider
          QueryProvider
            src/app/page.tsx         ← AppShell — main workspace (client)
              WorkspaceLayout        ← 4-panel grid
                [module].sidebar     ← injected from useXxxModule()
                [module].canvas
                [module].properties
                [module].bottomPanel
                BridgePanel
                NextModuleNudge
                RecommendedBridges
```

### Module slot contract (ADR-008)

Every module exports `useXxxModule() → { sidebar, canvas, properties, bottomPanel }`. AppShell composes the return values. Adding a new module = ~6 file touches.

### Key files

| File | Role |
|---|---|
| `src/app/layout.tsx` | Root layout, provider tree |
| `src/app/page.tsx` | AppShell — composes 4 module slots |
| `src/stores/ui-store.ts` | Active module, theme, panel toggles |
| `src/stores/canvas-store.ts` | Nodes/edges, undo history |
| `src/components/canvas/DesignCanvas.tsx` | System design canvas + overlays |
| `src/components/modules/lld/LLDShell.tsx` | LLD shell (chrome-leakage bug) |
| `src/components/modules/lld/useLLDModuleImpl.tsx` | Returns 4 LLD slots |
| `src/components/modules/lld/LearnModeLayout.tsx` | 3-col learn layout (URL-blind bug at L35-38) |
| `src/lib/motion.ts` | Spring configs |
| `src/providers/QueryProvider.tsx` | TanStack Query (staleTime bug at L10) |

### Frontend gaps & risks

1. **LLD chrome leakage** — `LLDShell.tsx` only wraps the canvas slot; sidebar/properties/bottomPanel always render Build-mode UI regardless of active mode. Observable mixed-mode rendering.
2. **Learn mode URL-blind** — `LearnModeLayout.tsx:35-38` hardcodes `DEFAULT_SLUG = "singleton"` and never reads the URL.
3. **Walkthrough checkpoints not wired** — data exists in `walkthrough-checkpoints.ts` seeds but UI is read-only. Identified as highest-ROI unfixed gap.
4. **Anthropic SDK in client bundle** — `src/lib/ai/claude-client.ts:9` imports `@anthropic-ai/sdk` without `"use server"`, pulling ~500 KB into the browser bundle.
5. **`"use client"` on pure UI primitives** — ~30 components in `src/components/ui/` marked client unnecessarily.
6. **`ParticleLayer` over-subscribes** to full canvas store — fires on every store mutation, not just node/edge changes.
7. **`AppShell` unmemoized JSX** — `composedSidebar`/`composedProperties` create new refs each render, defeating `React.memo` on `WorkspaceLayout`.
8. **No `loading.tsx` for 13 dynamic routes** — no streaming, no skeleton.
9. **No CI/CD** — 3,232+ Vitest tests exist but no pipeline enforces them.
10. **Empty placeholder modes** — `DrillModeLayout` and `ReviewModeLayout` show centered emoji with "coming in Phase 3" but mode switcher exposes them as equals to Learn/Build.

---

## 6. Backend / Server

**Confidence: HIGH** — read full source.

### Layout

- Framework: Next.js 16.2.3, App Router exclusively
- Server code:
  - `architex/src/app/api/**/route.ts` — Route Handlers
  - `architex/src/lib/auth.ts` — `requireAuth`, `resolveUserId`, `getUserTier`
  - `architex/src/lib/security/` — `rate-limiter.ts`, `csp.ts`, `cors.ts`
  - `architex/src/lib/ai/` — `claude-client.ts`, interviewer persona/prompts
  - `architex/src/db/` — connection factory + Drizzle schemas
  - `architex/src/middleware.ts` — single global middleware

### Auth boundary

- **Provider:** Clerk v7 (`@clerk/nextjs ^7.0.12`), conditionally mounted (skipped if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` absent — keyless local dev).
- **Middleware (`middleware.ts:54`):** `clerkMiddleware`. Auth gate: `if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !isPublicRoute(req)) { await auth.protect(); }`. **In dev without a key, NO route is protected at the middleware layer.**
- **Route-level enforcement (`auth.ts:15`):** `requireAuth()` calls `auth()` from Clerk and throws `Error("Unauthorized")` if `userId` is null. Handlers catch this and return 401.
- **JIT user provisioning:** `resolveUserId()` looks up `users.clerkId`; if missing (race vs webhook), calls `currentUser()` and creates a minimal row immediately.
- **Tiers:** `getUserTier(clerkId)` exists but **no RBAC enforcement is observed in any route**.
- **Webhook:** `/api/webhooks/clerk` handles Clerk lifecycle events. Svix signature verification (`svix ^1.90.0`).

### Request lifecycle

```
Browser → middleware.ts
  1. CORS preflight (OPTIONS → 204)
  2. Rate limit: getApiRateLimiter().checkLimit(ip) → 429 if exceeded
  3. Clerk auth.protect() for non-public routes
  4. CSP nonce + security headers (HSTS, X-Frame, nosniff)
  5. Cache-Control headers
  → Route Handler invoked
      6. requireAuth() → Clerk userId
      7. resolveUserId(clerkId) → internal UUID
      8. Drizzle query via getDb() singleton
      9. NextResponse.json({...}, { status })
     10. Errors: "Unauthorized" → 401, all others → 500 + console.error
```

### Server Actions vs Route Handlers

**Server Actions are not used.** All server-side mutations and reads go through Route Handlers. No `"use server"` directive found on any lib or action file.

### Validation & errors

- **No schema validation library** (no Zod, Valibot, Yup). Validation is ad-hoc per handler — inline `typeof` checks, set membership, null checks.
- **Error envelope:** `NextResponse.json({ error: "..." }, { status: N })`. Some handlers add `code: "ACTIVE_DRILL_EXISTS"`, `code: "GATE_UNSATISFIED"` — inconsistently applied.
- **Error reporting:** `console.error` only. No Sentry, no Datadog, no structured error reporting.

### Background work

- **No cron, no queues** — no `@vercel/cron`, `inngest`, `bull`, `pg-boss` deps.
- **Auto-abandon stale drills:** `GET /api/lld/drill-attempts/active` runs an inline UPDATE on every call to abandon drills idle >30 min. **Request-driven, not scheduled** — stale users never trigger cleanup, leaving stuck active drills.
- **AI SSE stream:** `/api/lld/drill-interviewer/[id]/stream` — only long-lived server connection.
- **Progress sync migration:** `src/lib/sync/local-to-db-migration.ts` runs client-side on first mount.

### Backend gaps & smells

1. **Auth bypass in dev** — middleware gate conditional on env var; no env = no auth on any route. Habit risk of new routes shipping without explicit auth.
2. **`resolveUserId()` on every request** — extra DB round-trip per authenticated handler, no caching. N+1-style cost under load.
3. **Anthropic SDK in client bundle** (cross-cuts with Frontend §5) — ~500 KB bundle bloat.
4. **No schema validation library** — ad-hoc `typeof` checks miss fields; centralized Zod would help.
5. **String-matched error types** — `error.message === "Unauthorized"` is brittle.
6. **In-memory rate limiter is stateless across instances** — under horizontal scaling each pod has its own bucket map.
7. **No structured error reporting** — silent production failures have no alerting surface.
8. **`getUserTier` defined but never enforced** — tier field exists, gate logic doesn't.
9. **Stale drill abandonment is request-driven** — partial unique index `one_active_drill_per_user` blocks new drills if cleanup never fires.

---

## 7. Database & Data Model

**Confidence: HIGH** — read full source.

### Engine & driver

- **Postgres (Neon Serverless)** in cloud + Edge; standard `pg.Pool` for local dev
- Auto-detection: `src/db/index.ts:18-30` checks `DATABASE_URL` for `neon.tech` / `vercel-storage`
- **Drizzle ORM 0.45.2**, Drizzle Kit for migrations
- Migration output: `architex/drizzle/migrations/`, naming auto-generated by Drizzle Kit (e.g. `0000_skinny_callisto.sql`)
- **6 migrations total (`0000–0005`).** Migration `0005` added `lld_drill_interviewer_turns`.

### Entities (24 tables, grouped by layer)

**Platform core (12 tables)**
- `users` — Clerk-synced auth profile + subscription tier (clerk_id unique)
- `user_preferences` — JSONB settings blob keyed by feature area
- `diagrams` — User-authored React Flow canvas states (jsonb data, public flag, fork ref)
- `templates` — Reusable diagram blueprints (built-in + user)
- `diagram_templates` — Mermaid DSL + parsed UML JSON per content item
- `simulation_runs` — Architecture simulation results
- `gallery_submissions` + `gallery_upvotes` — Public diagram showcase
- `achievements` + `user_achievements` — Gamification
- `activity_events` — Append-only analytics (~10M rows/year expected)
- `ai_usage` — Per-call AI billing + rate-limit tracking

**Learning core (4 tables)**
- `progress` — Per-(user, module, concept) FSRS SRS state (`stability`, `difficulty`, `fsrs_state`, `next_review_at`)
- `quiz_questions` — Structured quiz/scenario content
- `module_content` — Unified content for all 13 modules (jsonb content, tags array)

**LLD module cluster (8 tables)**
- `lld_learn_progress` — Per-(user, pattern) lesson scroll + checkpoint state
- `lld_bookmarks` — User heading-level bookmarks
- `lld_concept_reads` — Append-only log of concept panel views
- `lld_designs` — Named, savable canvas states (Build mode)
- `lld_design_snapshots` — Immutable canvas history
- `lld_design_annotations` — Floating notes on canvas
- `lld_templates_library` — ~60 curated blueprints
- `lld_drill_attempts` — Active + completed drill sessions (with partial unique index `one_active_drill_per_user` WHERE submitted_at IS NULL AND abandoned_at IS NULL)
- `lld_drill_interviewer_turns` — AI chat log (highest-cardinality drill-side table)

### Key relationships

```
users (1) ─┬─ (many) diagrams
           ├─ (1) user_preferences
           ├─ (many) simulation_runs
           ├─ (many) progress / activity_events / ai_usage
           ├─ (many) user_achievements ── (many:1) achievements
           ├─ (many) gallery_submissions ── (1:1) diagrams
           ├─ (many) lld_learn_progress / lld_bookmarks / lld_concept_reads
           ├─ (many) lld_designs ──┬─ (many) lld_design_snapshots
           │                        └─ (many) lld_design_annotations
           └─ (many) lld_drill_attempts ── (many) lld_drill_interviewer_turns

diagrams ─── (many) simulation_runs
diagrams ─── (self-ref fork — NO FK CONSTRAINT in schema)
```

### Conventions

- **Primary key:** `uuid` via `defaultRandom()` (gen_random_uuid). All tables — no serial/cuid.
- **Timestamps:** `created_at` + `updated_at` with timezone, `defaultNow()`, `updated_at` uses Drizzle's `.$onUpdate()` (app-layer hook, not DB trigger).
- **Soft deletes:** Only on `comments`. All others hard-delete.
- **Enums:** Inconsistent — `users.tier` is varchar(20) not pgEnum; `lld_drill_attempts.current_stage` is varchar with TS string-literal union.
- **JSONB usage:** Pervasive — canvas state, FSRS snapshots, hint logs, section progress, preferences, rubric breakdowns, AI postmortems. All typed via Drizzle's `.$type<T>()`.
- **Denormalized counters:** `diagrams.fork_count`, `diagrams.upvote_count`, `gallery_submissions.upvotes` — updated by app code, not triggers.
- **No repository pattern** — Drizzle queries written inline in route handlers.

### Database gaps & smells

1. **Missing FK on `diagrams.forked_from_id`** — self-referencing FK absent from schema.
2. **Missing FK on `diagrams.template_id`** — orphan template refs won't cascade.
3. **`updated_at` uses app-layer `$onUpdate`** — won't fire on raw SQL or admin updates.
4. **`progress.fsrs_state` stored as integer** (0/1/2/3) instead of pgEnum — adding a state requires app coordination.
5. **No retention/pruning** for `activity_events` or `lld_concept_reads` — unbounded growth.
6. **Denormalized counters drift** — `gallery_submissions.upvotes` can diverge from `COUNT(gallery_upvotes)`.
7. **No composite uniqueness** on `lld_drill_interviewer_turns.seq` — crashed write could duplicate.
8. **Two parallel schema trees** — root-level `drizzle/` + `src/db/schema/` (design-doc, with pgEnum and GIN indexes) vs `architex/src/db/schema/` (deployed). **Newcomers will edit the wrong tree.**
9. **No data lifecycle for `lld_drill_attempts`** — attempts accumulate indefinitely.

---

## 8. API Surface

**Confidence: MEDIUM** — API agent was OneDrive-blocked; path catalog captured but handler internals unread. Combined with backend agent's behavioral findings.

### Path catalog (~36 distinct route handlers)

**Drill / LLD (the heaviest investment — 18 routes)**
- `/api/lld/drill-attempts` (POST, GET — list/create)
- `/api/lld/drill-attempts/active` (GET — w/ stale auto-abandon)
- `/api/lld/drill-attempts/[id]` (GET, PATCH — heartbeat/pause/resume/submit/abandon)
- `/api/lld/drill-attempts/[id]/stage` (PATCH — stage transition w/ gate predicates)
- `/api/lld/drill-attempts/[id]/turn` (POST)
- `/api/lld/drill-attempts/[id]/hint` (POST)
- `/api/lld/drill-attempts/[id]/grade` (POST)
- `/api/lld/drill-attempts/[id]/postmortem` (POST)
- `/api/lld/drill-attempts/[id]/resume` (POST)
- `/api/lld/drill-interviewer/[id]/stream` (GET SSE)
- `/api/lld/lessons` + `/api/lld/lessons/[slug]`
- `/api/lld/learn-progress` + `/api/lld/learn-progress/[patternSlug]`
- `/api/lld/templates-library`
- `/api/lld/explain-inline`
- `/api/lld/bookmarks` + `/api/lld/bookmarks/[id]`
- `/api/lld/concept-reads`
- `/api/lld/designs` + `/api/lld/designs/[id]/snapshots` + `/api/lld/designs/[id]/annotations`
- `/api/lld/ai/suggest-nodes`

**Content & user state**
- `/api/content` + `/api/content/[slug]`
- `/api/diagrams` + `/api/diagrams/[id]`
- `/api/learning-path`
- `/api/quiz`
- `/api/templates`
- `/api/challenges`
- `/api/simulations`

**Progress / activity**
- `/api/progress` + `/api/progress/sync`
- `/api/activity`
- `/api/user-preferences/lld` (also a top-level `/api/user-preferences` in older builds — possible drift)

**AI / general**
- `/api/hint`
- `/api/ai/explain`
- `/api/evaluate`
- `/api/review`
- `/api/search`

**Infra**
- `/api/health`, `/api/webhooks/clerk`, `/api/csp-report`, `/api/oembed`, `/api/email-preview`

**Public/SEO surfaces**
- `/blog/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/icon`, `/favicon.ico`, `/patterns/[slug]/opengraph-image`

### API patterns (from backend agent)

- Method names = export names (`export async function GET/POST/PATCH/DELETE`).
- Auth pattern: `requireAuth()` → `resolveUserId()` — replicated in every authenticated handler. No middleware-level userId injection.
- DB access: `getDb()` singleton, queries inline.
- Error pattern: `try/catch` wrapping handler body; "Unauthorized" string-matched → 401; everything else → 500.
- Rate limiting: in-memory token-bucket (100 tokens/IP, 60s cleanup).

### Smells

- **Likely-dead `/api/email-preview`** in production — should be dev-gated.
- **Duplicated AI endpoints** — `/api/hint` vs `/api/lld/drill-attempts/[id]/hint`, `/api/ai/explain` vs `/api/lld/explain-inline`.
- **Missing rate limiting on AI endpoints** under multi-instance scaling (in-memory limiter is per-pod).
- **SSE handler risk** — confirm `/api/lld/drill-interviewer/[id]/stream` sets `Cache-Control: no-store`, releases DB connection before stream, has server-side timeout.
- **No callers verified** — couldn't grep `fetch('/api/...')` to map endpoints to UI screens. (Re-run when OneDrive recovers.)

---

## 9. PM / Roadmap Lens

**Confidence: HIGH** — built from full git history.

### Recently shipped (last ~50 commits, themed)

**Drill Mode UI completion (Phase 4) — the dominant theme**
- `41778c6` post-drill artifacts (reveal/rubric/postmortem/canonical/timing/follow-up)
- `d4fdc01` fill DrillModeLayout (Phase 1 stub → full)
- `33dea08` 5 stage screens + interviewer/variant/hint panels
- `164663d` stepper + timer + submit bar + resume prompt
- `df24629` Phase 4 drill mode smoke e2e (placeholder)
- `2d6e9fb` docs(phase-4): update progress to DONE

**Drill backend (7 endpoints)**
- `dc917f2` POST `/turn` alias
- `a0d2857` GET+POST `/stream` (SSE)
- `f86a3dc` POST `/resume`
- `619d64e` POST `/postmortem`
- `90f051d` POST `/grade`
- `00bbeb0` POST `/hint`
- `9c6b405` PATCH `/stage`

**Drill engine + AI**
- `c3a6feb` grading-engine-v2 (deterministic + heuristic)
- `1910454` postmortem generator (Sonnet, strict JSON)
- `514604b` streaming interviewer persona request builder
- `0f25c0d` 5-persona interviewer system prompts
- `94db0b6` 6-axis drill rubric with weight math + bands
- `4ff362f` drill-stages FSM with gate predicates

**Drill data model**
- `60d2195` / `6c8606c` — `lld_drill_interviewer_turns` table + migration
- `c1df6c4` / `46413bb` — extend `lld_drill_attempts` w/ stage + rubric

**Drill stabilization (last 5 commits, all bugs)**
- `3e6100d` recoverable 409 — offer 'Abandon & start new' inline
- `904f751` trace log on abandon PATCH
- `59ce60b` detect unique-violation by SQLSTATE, not substring
- `47b3d21` confirm before abandoning drill
- `bfe80ea` stable empty-progress reference in useDrillStage

**Build mode (Phase 3) — shipped just before Phase 4**
- Phase-3 plan, 4-panel layout, notes/annotations, actions rail, template loader, AI suggestions, pattern library dock, snapshot persistence

### In flight: `feat/blueprint-module` (worktree)

Cross-branch log, last ~10 commits:
- `0cf7266` blueprint-sp3 react-hooks fixes + e2e update
- `3ee166f` Unit 1 · "What is a design pattern?" — authored
- `9632eac` UnitPage + SectionRouter + 7 section types
- `2c13f2e` content-pipeline + compile-unit + seed-content
- `88207f7` spec(blueprint-sp3): unit renderer
- `afd078a` blueprint-sp2 smoke suite
- `0957a31` Dashboard + Mastery Grid + Problem History + Streak Detail
- `8497f0b` WelcomeBanner, ResumeCard, StreakPill, UnitCard, CurriculumMap
- `da0e1de` progress/units route + 4 TanStack Query hooks
- `a2f95dc` spec(blueprint-sp2): journey home

**Status:** ~3 of 10 sub-projects done (SP1 shell, SP2 journey home, SP3 unit renderer). Sub-projects SP4–SP10 queued.

### Abandoned / stale

- **16 `worktree-agent-*` worktrees** — locked agent harness scratchpads. One-time `git worktree remove --force` sweep recommended.
- **`content/lld-facade-lesson` (remote-only)** — no commits, likely superseded by Blueprint's content pipeline.
- **Old `/modules/lld`** — running, explicitly frozen per Blueprint decision but every recent fix is a drill bug. **Maintenance-only; sunset deferred.**
- **Phase 4 e2e is a placeholder** — `df24629` literally says "(placeholder)".

### Velocity & focus

- High tempo. Phase 3 + Phase 4 + 5 drill APIs + 4 AI engines + 2 schema migrations all shipped in the visible window. One engineer.
- **Focus split:** ~70% old-LLD feature build, ~25% Blueprint, ~5% cross-cutting.
- **Bug-fix vs feature:** 8/12 fixes-to-features ratio (~40%). **Last 5 commits in a row are all drill bugs.**
- **Spread risk:** strategic memory says LLD is frozen, but main keeps eating drill stabilization while Blueprint waits for SP4. Context-switch tax visible in commits.

### Top 3 highest-leverage bets (next 4 weeks)

1. **Stop shipping new code on `/modules/lld`.** Declare drill done at known-quality, write *one* real e2e for the resume + abandon path, freeze.
2. **Move full focus to Blueprint SP4 + SP5** — likely Drill-in-Blueprint integration + Tools palette.
3. **Decide and write down the old-LLD sunset trigger.** "When Blueprint reaches SP6 + 8 authored units, old LLD goes read-only."

### Risks

- **Code & strategy disagree** on what's the present.
- **"Phase 4 DONE" + placeholder e2e** — premature. The 409-abandon bug saga (5 fixes) suggests it.
- **17 worktrees on a OneDrive-mounted volume** — filesystem flakiness compounds (and visibly hit during this very analysis).
- **Hand-authored content is the velocity ceiling** — SP3 produced exactly 1 unit. 12-unit curriculum at 1/SP = 12 SPs of pure content work after infra.
- **Drill schema is wired into old LLD** — when Blueprint absorbs drill, either it shares these tables (couples to "frozen" module) or migrates them (real schema work). Not thought through.

---

## 10. Infra / Ops / DX

**Confidence: LOW (partial)** — both infra agents OneDrive-blocked. Section assembled from cross-cutting data captured by frontend/backend/db/PM agents + project memory.

### Stack one-liner (from cross-agent verification)

Next.js **16.2.3** / React **19.2.4** / TypeScript **^5** / Tailwind v4 (CSS-first config) / Drizzle ORM **0.45.2** on Neon Serverless Postgres / Clerk **v7.0.12** auth / `@anthropic-ai/sdk ^0.88.0` / `svix ^1.90.0` for webhooks / `@xyflow/react v12.10.2` canvas / Zustand v5 + TanStack Query v5 / `motion/react` v12 / Vitest + Storybook 10 + Playwright testing.

### Local setup (inferred — not verified file-by-file)

```bash
# Clone
git clone <remote> architex
cd architex/architex   # the actual Next.js app lives nested

# Install — package manager not directly verified;
# Drizzle + Vitest + Storybook 10 + Playwright suggests pnpm or npm
pnpm install   # or npm install

# Env vars (REQUIRED)
#   DATABASE_URL                          — Postgres connection (pooled)
#   DATABASE_URL_UNPOOLED                 — for migrations (DDL)
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     — Clerk public key (or skip for keyless dev)
#   CLERK_SECRET_KEY                      — Clerk server key (paired with above)
#   ANTHROPIC_API_KEY                     — for AI features (or app falls back to mock)
#   CLERK_WEBHOOK_SIGNING_SECRET          — for /api/webhooks/clerk (Svix)

# DB setup
pnpm db:push          # rapid dev iteration (drizzle-kit push)
# OR
pnpm db:generate      # create migration from schema diff
pnpm db:migrate       # apply migrations
pnpm db:seed          # run seeds (lld, system-design, achievements, etc.)
pnpm db:seed -- --module=lld  # specific seed

# Dev server
pnpm dev              # next dev → http://localhost:3000
```

### Daily commands (script names inferred from drizzle-kit conventions; verify against `package.json` when OneDrive recovers)

| Category | Commands |
|---|---|
| Dev | `pnpm dev` |
| Build | `pnpm build`, `pnpm start` |
| DB | `pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm db:seed` |
| Test | `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm storybook` |
| Lint | `pnpm lint`, `pnpm typecheck` |

### Testing

- **Vitest** for unit tests (3,232+ tests exist per frontend agent). Tests live next to source.
- **Storybook 10** — UI primitive showcase.
- **Playwright** for e2e — Phase 4 drill smoke is a placeholder per `df24629`.

### CI/CD

**Per frontend agent: NO CI/CD pipeline enforces tests.** 3,232+ tests exist with no automated runner. `tsconfig.json` is currently modified in working tree (the only main-branch change).

### Deployment

- **Likely Vercel** (Neon serverless driver, App Router, Edge runtime hints) — not directly verified.
- Tier auto-detection in `db/index.ts:18-30` — Neon HTTP driver if URL contains `neon.tech` / `vercel-storage`.

### Observability

- **Logging:** `console.error` only.
- **Error reporting:** No Sentry, Datadog, or equivalent visible in any agent's analysis.
- **Analytics:** `AnalyticsProvider` exists in the provider tree but its target was not inspected.
- **Feature flags:** None observed.

### Secrets & config

- Env vars listed above are the inferred set. **`.env.example` could not be read** — verify against repo when OneDrive recovers.
- No leaked `.env` files visible in git status.

### Local Claude Code harness (`.claude/`)

- **Active worktree:** `feat/blueprint-module` at `.claude/worktrees/blueprint-module/` (per project memory).
- **16 locked `worktree-agent-*` worktrees** — agent harness scratchpads from past sessions.
- **`.superpowers/` directory** in working tree (untracked) — contains brainstorm artifacts (e.g. `64431-1776636958/content/09-db-first-revision.html`).
- **`.playwright-mcp/`** directory present.

### DX gaps & risks

1. **OneDrive FileProvider is unstable** — observed during this very analysis. Multiple agents wedged. Recommend: move active development off OneDrive into a local-only path (`~/code/`).
2. **No CI/CD** — 3,232 tests but no enforcement. Adding GitHub Actions for typecheck + Vitest + Playwright on PR is high-leverage.
3. **Phase 4 e2e is a placeholder** — real coverage is missing.
4. **Two parallel schema trees** (root `drizzle/` + nested `architex/drizzle/`) — newcomers will edit the wrong one.
5. **Modified `architex/tsconfig.json` uncommitted** — investigate intent before next push.
6. **17 worktrees including 16 locked agent scratchpads** — `git worktree prune` sweep needed.
7. **No structured error reporting** — silent prod failures have no surface.
8. **In-memory rate limiter** breaks under multi-instance scaling.

### Section gaps (need OneDrive recovery to fill)

- Exact `package.json` script names (paraphrased above)
- `.env.example` complete variable list with required/optional flags
- Exact CI workflow files (existence/non-existence verified — content not read)
- `next.config.ts` content (957 bytes per stat metadata)
- `drizzle.config.ts` content (928 bytes per stat metadata)
- Any custom build scripts in `architex/scripts/`
- `vitest.config.ts`, `playwright.config.ts` content

---

## 11. Cross-cutting Observations

### Patterns that repeat across layers

1. **JIT user provisioning + offline-first state** — Clerk webhooks asynchronously create users, but `resolveUserId()` will JIT-create on first request. Mirrored on the client by Zustand `persist()` to localStorage with TanStack Query as offline-first sync layer.
2. **Slot-injection module contract** — Frontend's 4-slot module model (sidebar/canvas/properties/bottomPanel) is the unit of feature isolation. The same architectural cleanliness does NOT extend to the API: routes are flat under `/api/`, and LLD has its own quasi-namespace (`/api/lld/*`) duplicating common features (`/api/user-preferences` vs `/api/user-preferences/lld`).
3. **JSONB-everywhere for complex state** — canvas state, FSRS snapshots, hint logs, rubric breakdowns, postmortems — all live in typed JSONB. Pro: schema flexibility. Con: no DB-level constraints on the structure.
4. **Heuristic fallbacks for AI** — every AI feature has a mock response bank; app is fully functional without `ANTHROPIC_API_KEY`. Same pattern repeats from grading-engine to interviewer-persona.
5. **Read-only stale auto-cleanup** — drill auto-abandonment, walkthrough checkpoint expiry — all triggered by *user-driven* requests, not background workers. Architecture has no scheduled jobs.

### Inconsistencies between layers

1. **Tier system asymmetry** — `users.tier` exists in DB, `getUserTier()` exists in `lib/auth.ts`, but no route enforces it. Schema and code agree the feature exists; no surface uses it.
2. **Drill resume disconnect** — `/api/lld/drill-attempts/active` returns the active attempt; `DrillResumePrompt` component exists; `useDrillStore` has no persistence middleware. The three pieces don't talk.
3. **`@anthropic-ai/sdk` lives client-side** — server-only library imported into client bundle (`src/lib/ai/claude-client.ts:9` no `"use server"`).
4. **TanStack Query `staleTime` (5 min) misaligned** with server `Cache-Control: s-maxage=86400`.
5. **Empty placeholder modes promoted as equals** — Drill/Review modes show "coming in Phase 3" but `ModeSwitcher` exposes them with the same prominence as Learn/Build.
6. **Dual schema trees** — root `drizzle/` (design-doc, with pgEnum, GIN indexes, community tables) and `architex/src/db/schema/` (deployed). Newcomers will diverge.
7. **Two landing pages** — `/` and `/landing`.

### Newcomer onboarding path (read-this-then-that)

1. **`architex/README.md`** — product positioning, simulation engine description, 13-module map, voice/tone.
2. **`architex/docs/PROJECT_COMPLETE_ANALYSIS.md`** — deeper synthesis of the 55 research docs.
3. **`architex/src/app/layout.tsx` + `architex/src/app/page.tsx`** — provider tree + AppShell composition.
4. **`architex/src/components/modules/lld/`** — the most complete feature; understand the slot contract here first.
5. **`architex/src/db/schema/`** — entity model. **NOT** the root-level `drizzle/`.
6. **`architex/src/app/api/lld/drill-attempts/`** — canonical example of route-handler patterns.
7. **`/Users/a0g11b6/.claude/projects/.../memory/MEMORY.md`** — current strategic decisions (Blueprint module, worktree, content authoring rules).
8. **`feat/blueprint-module` worktree** — what's coming next.

---

## 12. Open Questions for the Owner

Aggregated and de-duplicated from all 9 dimensions. Top 10:

1. **What is the actual sunset trigger for old LLD?** "Deferred" has held for 9+ days while drill keeps bleeding fix commits. Is the trigger "Blueprint reaches drill parity," "Blueprint hits N users," "calendar date," or "when I feel like it"?

2. **Where does Phase 4 drill mode end up — inside Blueprint, or stranded in old LLD?** The schema, AI personas, grading-engine-v2, and 7 API routes built in the last ~30 commits are heavyweight. Re-implementing them in Blueprint is wasted work; re-mounting them is a coupling Blueprint was supposed to avoid.

3. **Which schema tree is canonical?** Root-level `src/db/schema/` (elaborate with pgEnum, GIN indexes, community tables) versus `architex/src/db/schema/` (deployed app, 6 real migrations) — which is the source of truth?

4. **Is the Blueprint module additive (new `/blueprint` route) or a replacement of the LLD shell's 4-mode switcher?** Memory says "additive" but WelcomeBanner and ModeSwitcher live inside the LLD shell on `main`.

5. **Who actually pays — and at what price?** README + VISION + persona mix point to interview candidates as 60% ICP, but the only pricing reference is `$12/mo, Pro, wall hit after 3rd free challenge` buried in `research-findings/15`. No `pricing/page.tsx` content. Is this $12/mo consumer or B2B teams?

6. **What's the rate plan on hand-authored content?** SP3 produced 1 unit. If the curriculum is 12+ units and authoring is 1/SP, that's 12 SPs of pure content work after SP4–SP10 infra. Is that the plan?

7. **What is the AI gateway architecture?** 6 separate AI endpoints (`/api/hint`, `/api/ai/explain`, `/api/lld/explain-inline`, `/api/lld/ai/suggest-nodes`, `/api/lld/drill-interviewer/[id]/stream`, `/api/evaluate`). Is there a single client module wrapping the model provider, or are they each holding their own prompt + provider config?

8. **What is the response envelope contract?** Bare `{...}` or `{ success, data, error }`? Without a single contract, frontend fetch wrappers are inconsistent and `code: "ACTIVE_DRILL_EXISTS"` style codes drift.

9. **How is `updated_at` kept accurate in production?** Drizzle's `.$onUpdate()` is an app-layer hook. Any migration, admin query, or background job that updates rows via raw SQL won't refresh `updated_at`. Is there a `set_updated_at()` trigger applied to Neon outside Drizzle?

10. **What is the data lifecycle for `lld_drill_attempts` and `activity_events`?** Partial unique index `one_active_drill_per_user` enforces at most one active drill, but no cleanup or archival exists. `activity_events` will grow ~10M rows/year unbounded.

---

_End of Project Understanding._
