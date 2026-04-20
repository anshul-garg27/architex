# LLD Architect's Studio · Implementation Handoff Prompt

> **Purpose of this document:** A fresh Claude Code session can read this file and execute the entire LLD module rebuild without needing the original brainstorm context.
>
> **Session kickoff command:** Paste the "Session prompt" section below into a new Claude Code session. Claude will read the linked spec and execute phase-by-phase.
>
> **Design spec (source of truth):**
> `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md`

---

## Session prompt (paste this to start a new session)

```
You are implementing the Architex LLD module rebuild. The complete design spec lives at:

  docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md

The execution guide lives at:

  docs/superpowers/specs/2026-04-20-lld-implementation-handoff.md

DO THIS, IN ORDER:

1. Read the full spec end to end. Don't skim.
2. Read the full handoff guide end to end.
3. Run `git status` and `git log --oneline -10` to see current state.
4. Run the dev server: `cd architex && pnpm dev`
5. Open the existing LLD module at http://localhost:3000 → click LLD in the left rail. Take 15 minutes to understand the existing UI firsthand.
6. Check which phase we're on by reading the .progress file in docs/superpowers/specs/. If missing, we're starting Phase 0.
7. Execute that phase exactly as specified.
8. After each phase completes, update the .progress file and commit.
9. Never skip phases. Never skip the verification checklist.
10. Ask the user for approval before starting each new phase, not each sub-task.

Rules:
- This is Next.js 16 + React 19. APIs differ from training data. When unsure, read node_modules/next/dist/docs/.
- Read CLAUDE.md and AGENTS.md first — project-specific rules.
- Never create new patterns when existing ones work. Reuse existing stores, hooks, components.
- Never modify the git config, never --force-push, never --amend others' commits.
- Run typecheck + tests after every meaningful change. Don't claim "done" without evidence.
- Commit often, with clear messages. Small commits > large commits.
- Use the Agent tool for parallel exploration when scope is broad. Don't explore serially.

Start now by reading both documents and running status checks.
```

---

## Project background for fresh session

### What is Architex?

A Next.js 16 + React 19 + TypeScript 5 interactive engineering learning platform with 13 modules (System Design, Algorithms, Data Structures, LLD, Database, Distributed Systems, Networking, OS, Concurrency, Security, ML Design, Interview Prep, Knowledge Graph). 1,300+ files. Production-polished in parts, rough in others.

Repository root: `/Users/a0g11b6/Library/CloudStorage/OneDrive-WalmartInc/Desktop/my_projects/architex/`
Main package: `architex/` (the Next.js app)

Key strategic documents (skim before starting):
- `architex/README.md` — platform overview
- `architex/ARCHITEX_PRODUCT_VISION.md` — strategy, moat, roadmap
- `architex/docs/CONTENT_STRATEGY.md` — brand voice rules (load-bearing for Phase 2+)
- `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` — existing design tokens
- `architex/LLD_CANVAS_PLAYBOOK.md` — canvas technical details
- `architex/CLAUDE.md` and `architex/AGENTS.md` — "This is NOT the Next.js you know"

### What is the LLD module today?

At `/modules/lld` (actually reached by clicking LLD icon in left rail on `/`). A 4-panel interactive workspace with:
- Pattern browser sidebar (36 GoF patterns categorized)
- Central UML canvas (React Flow with A*-routed edges, Dagre auto-layout)
- Right properties panel with 3-language code tabs (TS/Py/Java)
- Bottom contextual tabs (explain/quiz/interview prep/auto-grader/Mermaid editor/etc.)

Today it is ~80% production-polished. The spec expands it, does not rewrite it from scratch (Phase 5 rebuilds the UI shell but business logic and data stay).

### Tech stack in play

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| State | Zustand 5 (12 stores) + Zundo (undo/redo) + TanStack Query 5 |
| Canvas | React Flow (@xyflow/react) + Dagre + custom A* routing |
| Animation | motion/react 12 |
| Database | Drizzle ORM + PostgreSQL (Neon) |
| Local | Dexie (IndexedDB) |
| AI | Anthropic Claude SDK (Haiku + Sonnet) |
| Auth | Clerk (optional, conditional loading) |
| Testing | Vitest, Testing Library, Playwright |

All mutations should use existing patterns — don't invent new ones.

### Existing infrastructure to reuse (DO NOT rebuild)

- `src/lib/lld/patterns.ts` — 36 patterns data
- `src/lib/lld/problems.ts` — 33 problems data
- `src/lib/lld/java-code.ts` — Java implementations
- `src/lib/lld/astar-router.ts` — A* edge routing
- `src/lib/lld/dagre-layout.ts` — Sugiyama layout
- `src/lib/lld/grading-engine.ts` — fuzzy auto-grader
- `src/lib/lld/bidirectional-sync.ts` — code ⇄ diagram sync (powers R11)
- `src/lib/ai/claude-client.ts` — singleton, queue, cache
- `src/lib/ai/hint-system.ts` — 3-tier hint engine
- `src/lib/fsrs.ts` — FSRS-5 spaced repetition
- `src/stores/canvas-store.ts` — canvas state + undo/redo
- `src/stores/progress-store.ts` — progress + streak

---

## Phase execution guide

### Phase 0 · Security + Critical Bugs (Week 1-2, 40-60h)

**Goal:** Fix blockers before adding new features. Zero new features in this phase.

**From research file `architex/docs/research-findings/21-security-threat-model.md`:**

1. Fix CVE-2025-29927 middleware bypass — ensure `requireAuth()` is called in EVERY protected Route Handler and Server Action, not just middleware.
2. WebSocket zero-auth on PartyKit rooms — verify JWT on connection.
3. XSS via unsanitized diagram labels — apply `sanitizeUserInput()` on render.
4. Audit `NEXT_PUBLIC_` env vars — ensure no secrets leak.
5. Sentry scrubbing — strip env vars + auth headers from error reports.

**From research file `architex/docs/research-findings/02-code-quality-bugs.md`:**

6. Fix stale closure in `onConnect` handler (canvas) — use functional setState. Race condition causes edge loss during rapid drag.
7. Fix unbounded `metricsHistory` array in simulation-store — cap at N or windowed buffer. Browser crashes after ~10min.
8. Fix Lucide barrel import — use named imports only. Saves 50-100 KB gzipped.

**Verification before moving on:**
- [ ] All 5 CRITICAL security vulns have tests that pass
- [ ] 2 CRITICAL bugs are closed with regression tests
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:run` passes
- [ ] Bundle size check: `pnpm analyze` shows <100 KB reduction (Lucide fix)
- [ ] Commit per fix, not bundled

**On phase completion:** Update `.progress` file with "Phase 0 · DONE" + date. Ask user for approval to proceed to Phase 1.

---

### Phase 1 · Mode scaffolding (Week 3-6, ~80h)

**Goal:** Ship the 4-mode shell with existing LLD content inside Build mode. Zero visible regression for existing users.

**Tasks (in order):**

1. **DB migration**
   - Create `src/db/schema/lld-drill-attempts.ts` per spec §7
   - Add to `src/db/schema/index.ts` re-exports
   - Add relation in `src/db/schema/relations.ts`
   - Generate migration: `pnpm db:generate`
   - Apply: `pnpm db:push`
   - Verify via `pnpm db:studio`

2. **Store extensions**
   - Extend `src/stores/ui-store.ts` with `lldMode`, `lldWelcomeBannerDismissed`, `setLLDMode` (with side effects per spec §6 transitions table)
   - Extend `src/stores/interview-store.ts` with `activeDrill` slice + actions
   - Write unit tests for side-effect logic

3. **Sync hooks**
   - `src/hooks/useLLDModeSync.ts` — URL ↔ store, `router.replace` not push
   - `src/hooks/useLLDPreferencesSync.ts` — debounced 1s write-through
   - `src/hooks/useLLDDrillSync.ts` — drill state DB sync + 10s heartbeat
   - `src/hooks/useLLDResponsive.ts` — tiered responsive per Q6

4. **API routes (6)**
   - `GET /api/user-preferences`
   - `PATCH /api/user-preferences/lld`
   - `POST /api/user-preferences/lld/migrate`
   - `GET /api/lld/drill-attempts/active` (with auto-abandon >30min idle)
   - `POST /api/lld/drill-attempts` (409 if active exists)
   - `PATCH /api/lld/drill-attempts/[id]` (pause/resume/heartbeat/submit/abandon)
   - Use existing `requireAuth()` pattern from `src/lib/auth.ts`

5. **Shell components (new)**
   - `src/components/modules/lld/LLDShell.tsx` — reads `lldMode`, renders correct layout
   - `src/components/modules/lld/modes/ModeSwitcher.tsx` — 4-pill
   - `src/components/modules/lld/modes/WelcomeBanner.tsx` — first-visit dismissable
   - `src/components/modules/lld/modes/LearnModeLayout.tsx` — stub (content in Phase 2)
   - `src/components/modules/lld/modes/BuildModeLayout.tsx` — wraps existing content unchanged
   - `src/components/modules/lld/modes/DrillModeLayout.tsx` — stub
   - `src/components/modules/lld/modes/ReviewModeLayout.tsx` — stub

6. **Analytics event catalog**
   - Create `src/lib/analytics/lld-events.ts` with 25 typed event builders per spec §13
   - Wire into shell for `lld_mode_switched` event at minimum

7. **Wire existing LLD into new shell**
   - Modify `src/components/modules/lld/hooks/useLLDModuleImpl.tsx` to delegate layout to `LLDShell`
   - Default mode = "build" for existing users (preserve behavior until Phase 2)
   - Verify everything works identically for Build mode users

**Verification:**
- [ ] Existing LLD module works identically (Build mode unchanged)
- [ ] Mode switcher renders and navigates
- [ ] URL `?mode=learn` / `?mode=drill` / `?mode=review` load correct (stub) layouts
- [ ] `⌘1..4` keyboard shortcuts switch modes
- [ ] Welcome banner appears on first visit, dismisses, persists
- [ ] Typecheck + tests pass
- [ ] New DB table exists with partial unique index

**On completion:** Commit, tag phase 1, open feature flag for internal team only (Wave 1 per spec §15).

---

### Phase 2 · Learn mode + 5 foundation patterns (Week 7-10, ~120h)

**Goal:** Learn mode fully functional with Wave 1 content (Singleton, Factory Method, Builder, Abstract Factory, Prototype).

**Content authoring is on the critical path.** The user has committed to Claude Opus 4.7 writing all 36 patterns to "1000% quality". This session should:
- Generate draft lesson content for the 5 foundation patterns using the 6-step teaching sequence from `architex/docs/CONTENT_STRATEGY.md`
- Save to `src/db/seeds/lld-lessons-wave-1.ts` (new seed file)
- Seed the content via `pnpm db:seed -- --module=lld-lessons-wave-1`

**Component tasks:**

1. **LessonColumn** (`src/components/modules/lld/learn/LessonColumn.tsx`)
   - 8-section scrollable container: hook/analogy/UML/checkpoint/code/tradeoffs/summary/CTA
   - Integrates with `useLessonScrollSync` hook

2. **LessonSection** — renders individual section types
   - HookSection, AnalogySection, UMLRevealSection, CheckpointSection (wraps existing WalkthroughPlayer for 4 checkpoint types), CodeSection, TradeoffsSection, SummarySection, CTASection

3. **useLessonScrollSync.ts**
   - Scroll position → `highlightedClassIds` array
   - Each section declares `classesMentioned: string[]`
   - Hook debounces + fires updates

4. **Extend LLDCanvas** with `highlightedClassIds` prop — dims non-highlighted classes to 40%, accent-glows highlighted

5. **ClassPopover** (Q7) — click class → popover with "mentioned in §3 UML Reveal, §5 Code" + jump links

6. **TinkerToolbar** (Q8)
   - Floating "✏️ Tinker" button
   - On click: set `canvasEditable: true`, pause scroll-sync, show toolbar [Reset · Save-to-Build · Done]
   - On "Save to Build": serialize canvas → create new scratch canvas in Build mode → switch modes

7. **ContextualAskArchitect** (Q9) — 3 surfaces
   - After 3 failed checkpoint attempts → suggestion banner
   - At end of each lesson section → subtle prompt
   - On Confused-With panel → "Ask about the difference" button
   - All use existing Claude client with lesson context prompt builder

8. **WelcomeBanner enhancement** — on click of a path button, route appropriately and dismiss

9. **Progressive reveal checkpoint** (Q3) — extend WalkthroughPlayer
   - Attempt 1 wrong: show `option.whyWrong` for that option, ask to try again
   - Attempt 2 wrong: show broader hint
   - Attempt 3 wrong (or reveal clicked): show correct + full explanation
   - Track attempt count → FSRS rating (1st = Easy, 2nd = Good, 3rd = Hard, revealed = Again)

10. **Wave 1 motion signatures** (M1) — 5 patterns × ~45min each via motion.dev keyframes

**Verification:**
- [ ] All 5 Wave 1 patterns loadable in Learn mode
- [ ] Scroll-sync highlights classes correctly
- [ ] All 4 checkpoint types grade correctly, feed FSRS
- [ ] Tinker mode works end-to-end (tinker → save-to-Build → switch)
- [ ] AI contextual surfaces fire at the right moments
- [ ] Motion signatures render without jank
- [ ] Typecheck + tests + E2E test for full lesson flow

**On completion:** Enable Wave 2 rollout (Alpha opt-in per spec §15). Recruit 20-50 alpha users via email banner. Monitor drill-attempt error rate, lesson completion rate.

---

### Phase 3 · Review mode + Drill mode (Week 11-14, ~120h)

Execute per spec §6 (Review + Drill details) + §15 (Phase 3 tasks).

Critical outputs:
- Review mode with swipe gestures on mobile
- 3-submode drill picker (Q12)
- Tiered grade reveal choreography (Q10)
- Hostile interviewer (W8)
- Company-specific mock interviews (A7)
- FSRS review scheduling fully wired

**On completion:** Wave 3 rollout — 100% anonymous users get new UI.

---

### Phase 4 · Content + advanced features (Week 15-20, ~150h)

Opus writes Waves 2-8 (remaining 31 patterns). Build:
- 10 cognitive science features (CS1-CS10)
- 5 dashboard charts (D2, D3, D4, D6, D8)
- Spotlight search (I2), favorites (I4), tags (I8)
- Multi-select batch actions (I9)
- Full keyboard navigation (Q14)
- On-call simulator (X3), design mysteries (X5)
- Hall of Fame (X11), time capsule (X12)

**On completion:** Wave 4 rollout — authenticated 10% → 50% ramp.

---

### Phase 5 · Architect's Studio rebuild (Week 21-24, ~150h)

This is the breathtaking UI. See spec §10.

All 12 R-features:
- R1 Cinematic cold open
- R2 Spatial home
- R3 Pattern rooms
- R4 Radial menu
- R5 Editorial typography (introduce Cormorant Garamond)
- R6 Gesture grammar
- R7 Ambient sound + dynamic lighting
- R8 Fluid translucent layers
- R9 Personal architect signature
- R10 Presentation mode
- R11 Dual-view code ⇄ UML
- R12 First-time ritual

Plus 6 color themes (P1) and humane features F1-F12.

**On completion:** Wave 5 rollout — full 100% + keep old UI as "Classic mode" toggle hidden in settings for 4 weeks.

---

### Phase 6 · Ecosystem (post-launch, Month 7+)

Out of scope for this implementation session — plan separately when Phase 5 ships.

---

## Decision memory (so fresh session doesn't re-decide)

Every Q1-Q20 decision was locked during brainstorm. Never revisit without asking user. Summary:

- Content: Opus writes all 36 to 1000% quality
- Path: Hybrid guided + all-36 toggle, nothing locked
- Checkpoints: Progressive reveal with `whyWrong`
- Graduation: 3-tier with decay (Introduced/Completed/Mastered)
- FSRS: 4th primary mode
- Mobile: Tiered (Review mobile-first, Build desktop-only)
- Canvas click in Learn: Popover with section list
- Tinker: Temporary unlock + save-to-Build
- AI in Learn: Contextual 3 surfaces
- Drill submit: Tiered celebration
- Cross-mode: Smart boundaries (10-row table)
- Drill start: 3 sub-modes (Interview/Guided/Speed)
- Gamification: Calibrated (subtle pill, no XP surface)
- Keyboard: 3-tier layered
- Frustration: 4-level escalating, no Drill intervention
- Loading: Tiered prefetch (5 eager + 10 warm + 21 cold)
- Migration: Smart hybrid 3-case
- Social: Light (OG cards + profile + gallery, no leaderboard V1)
- Analytics: 25-event typed catalog
- Rollout: 5-wave phased ramp with kill switches

---

## What to NEVER do

- ❌ Never rewrite `src/lib/lld/astar-router.ts`, `dagre-layout.ts`, `grading-engine.ts`, or `bidirectional-sync.ts`. These work. Reuse.
- ❌ Never change the 36 pattern IDs or the 33 problem IDs. Downstream progress tracking depends on them.
- ❌ Never drop content that exists today. Only extend/enrich.
- ❌ Never add `any` types in TypeScript. Zod schemas for external data.
- ❌ Never commit without running typecheck + tests.
- ❌ Never skip phases. Never collapse 2 phases into 1 to "save time".
- ❌ Never introduce new stores without justification. Extend existing (ui-store, canvas-store, interview-store).
- ❌ Never add gamification loudness beyond what spec §13 allows (no XP burst, no level-up explosions, no sound by default).
- ❌ Never intervene mid-drill with frustration helpers. Drill integrity is sacred.
- ❌ Never persist `activeDrill` to localStorage if backend says it's abandoned. Server decides.

---

## Verification checklist (every phase)

Before claiming a phase "done":

- [ ] `pnpm typecheck` passes (zero errors)
- [ ] `pnpm lint` passes
- [ ] `pnpm test:run` passes
- [ ] `pnpm build` succeeds (production build compiles)
- [ ] Manual smoke test in browser — load module, exercise 3 happy paths
- [ ] New functionality has at least one unit test and one component test
- [ ] No console errors in browser during smoke test
- [ ] No `console.log` left in committed code
- [ ] Git log is clean — logical commits, clear messages, Co-Authored-By tag present
- [ ] `.progress` file updated
- [ ] User explicitly approves moving to next phase

---

## When you hit a blocker

1. Read the spec section relevant to your blocker. Most answers are in there.
2. If truly ambiguous, check research docs in `architex/docs/research-findings/`.
3. If still ambiguous, ASK THE USER. Do not invent.
4. Never skip security or bug fixes to unblock a feature.
5. Never commit partial work and claim complete.

---

## Tools at your disposal

- **Playwright MCP** — browse the live app at localhost:3000 to see what exists
- **Context7 MCP** — fetch up-to-date docs for Next.js 16, Drizzle, Zustand, TanStack Query, React Flow
- **Supabase MCP** (if configured) — inspect DB schema
- **Explore agent** — spawn for broad codebase searches (>3 queries)
- **code-explorer agent** — deeper code path tracing
- **code-reviewer agent** — review your own changes before committing

Use agents in parallel when possible (spawn 2-3 in one message).

---

## End state

When Phase 5 is complete and Wave 5 rollout is at 100%, you should have shipped:

- 4-mode LLD system (Learn/Build/Drill/Review)
- 36 patterns × Opus-grade content × 8-section lessons × 4 checkpoint types
- 33 problems × 3 drill sub-modes × tiered grading
- FSRS-5 spaced repetition review mode
- The Architect's Studio UI (spatial home, pattern rooms, editorial typography, ambient everything)
- ~130 features from the spec's feature catalog
- 25-event analytics taxonomy
- Offline-first PWA
- Full keyboard + mobile + a11y support
- Phased rollout with kill switches documented

Then hand back to the user for Phase 6 ecosystem work (browser extension, VS Code extension, public API, physical products, etc.).

---

*This handoff document is complete. Begin by reading the spec end to end.*
