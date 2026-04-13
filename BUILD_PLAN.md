# ARCHITEX — BUILD EXECUTION PLAN

## WHY YOU CAN'T JUST PASTE THE MEGA PROMPT

The MEGA_PROMPT.md is 16,000+ words. No AI can:
- Hold all of it in context at once AND write good code
- Generate 12 interconnected modules in one shot
- Produce tested, working code for 60+ components simultaneously
- Maintain architectural consistency across 2,000+ lines of specification

**If you paste the full prompt and say "build this" → you get:**
- Incomplete boilerplate that doesn't compile
- Missing connections between modules
- Hallucinated APIs and broken imports
- Code that looks right but doesn't actually work together

---

## THE CORRECT STRATEGY: Layered Prompt Architecture

Think of it like building a house:
- You don't hand the architect's 100-page blueprint to ONE worker and say "build the whole house today"
- You give the foundation team the foundation specs, the framing team the framing specs, etc.
- Each team finishes, gets inspected, THEN the next team starts

### The 3-Layer Prompt System

```
Layer 1: CONTEXT PROMPT (paste once at session start)
  → Project overview, tech stack, file structure (from MEGA_PROMPT Parts 1-2)
  → ~2,000 words — sets the stage

Layer 2: TASK PROMPT (one per coding session)
  → Specific task with exact deliverables
  → References the specific research file for that task
  → ~500-1,000 words

Layer 3: VERIFICATION PROMPT (after each task)
  → "Review what was just built against these criteria"
  → Catches errors before they compound
  → ~200 words
```

---

## LAYER 1: THE CONTEXT PROMPT (Paste This At Start Of Every Session)

```markdown
# Project: Architex

You are building Architex — a browser-based engineering visualization & simulation
platform with 12 modules: System Design Simulator, Algorithm Visualizer, Data Structure
Explorer, LLD Studio, Database Lab, Distributed Systems Playground, Networking, OS
Concepts, Concurrency Lab, Security/Crypto, ML System Design, and Interview Engine.

## Tech Stack
- Next.js 16 (App Router, TypeScript strict)
- @xyflow/react v12 (React Flow) for diagram canvas
- Rust → WebAssembly (via wasm-pack + comlink) for simulation engine
- shadcn/ui + Tailwind CSS v4 + Radix UI
- Zustand v5 + zundo (undo/redo) — 6 atomic stores with command bus
- Dexie.js v4 (IndexedDB) behind repository abstraction
- Monaco Editor (async-loaded)
- motion v12 (Framer Motion) for animations
- Clerk for auth, Neon Postgres + Drizzle ORM for database
- Inngest for background jobs, Resend + react-email for email
- PostHog for analytics, Sentry for errors
- Yjs + PartyKit for collaboration
- Tauri v2 for desktop

## Design System
- Dark theme default: base #0C0D0F, surface #111113, elevated #18191B
- Accent: Violet #6E56CF
- Font: Geist Sans (UI), Geist Mono (code), Inter Display (headings)
- 13px base, 32px component height, 4px spacing grid
- Spring physics for animations (snappy: stiffness 300, damping 30)

## Architecture
- 4-layer rendering: CSS background → Canvas effects → SVG (React Flow) → HTML overlay
- Adapter pattern: own data model separate from ReactFlowNode/ReactFlowEdge
- Command bus for cross-store coordination
- SimulationCommand/SimulationSnapshot/SimulationEvent interfaces for worker communication
- Repository pattern for all storage (swappable backend)

## Current File Structure
[paste the actual current file tree from `find . -type f | head -50`]
```

This is ~400 words. Paste it at the start of EVERY new Claude session.

---

## LAYER 2: TASK PROMPTS (One Per Coding Session)

### Phase 1: Foundation (10 Tasks, ~2 days each)

#### Task 1.1: Project Initialization
```markdown
## Task: Initialize Next.js project with full tooling

Create a new Next.js 16 project with:
- TypeScript strict mode
- Tailwind CSS v4 with the @theme config from our design system
- shadcn/ui initialized (New York style)
- ESLint + Prettier configured
- pnpm as package manager

Install these packages:
@xyflow/react, zustand, zundo, dexie, dexie-react-hooks, cmdk,
react-resizable-panels, comlink, lucide-react, motion

Create the base folder structure:
app/(main)/ — main app layout
components/canvas/ — React Flow components
components/ui/ — shadcn components
lib/ — utilities and business logic
stores/ — Zustand stores
hooks/ — custom React hooks
workers/ — Web Worker files

Do NOT build any features yet. Just the skeleton that compiles and runs.

Reference: research/04-tech-stack-recommendations.md for exact versions
```

#### Task 1.2: Design System & Theme
```markdown
## Task: Implement the complete design system

Using the design tokens from research/22-architex-design-system.md, create:

1. globals.css with all CSS custom properties (dark + light theme)
2. tailwind.config.ts mapping tokens to Tailwind utilities
3. Theme provider with dark/light/system toggle (use next-themes)
4. Typography components (H1-H6, Body, Code, Caption)
5. Verify: dark mode renders with correct colors on localhost

Key colors (dark theme):
- Background layers: #0C0D0F → #111113 → #18191B → #212225
- Accent: #6E56CF (violet)
- Text: #EDEDEF (primary), #8B8D98 (secondary)
- Semantic: Success #30A46C, Warning #F5A623, Error #E5484D

Reference: research/22-architex-design-system.md (full 61KB token spec)
```

#### Task 1.3: Application Shell Layout
```markdown
## Task: Build the VS Code-style multi-panel layout

Create the main application layout with react-resizable-panels:

┌──────┬──────────────────────────────┬──────────────┐
│  48px│     Tab Bar                  │              │
│ Act- ├──────────────────────────────┤  Properties  │
│ ivity│                              │  Panel       │
│ Bar  │     Main Canvas Area         │  (280-400px) │
│      │     (React Flow goes here)   │  collapsible │
│      ├──────────────────────────────┤              │
│      │  Bottom Panel (200-400px)    │              │
│      │  collapsible                 │              │
├──────┴──────────────────────────────┴──────────────┤
│  Status Bar (24px)                                  │
└─────────────────────────────────────────────────────┘

- Activity bar: 12 module icons (just icons + tooltips for now)
- Sidebar: 240-400px, collapsible to 0 with Cmd+B
- All panels resizable with drag handles
- Bottom panel toggles with Cmd+J
- Properties panel toggles with Cmd+Shift+B
- Status bar: static text for now ("Architex | No diagram open")
- Persist panel sizes in localStorage

Reference: research/10-uiux-developer-tools.md for layout patterns
Reference: docs/wireframes/architex-wireframe-specs.md for exact specs
```

#### Task 1.4: Command Palette
```markdown
## Task: Implement command palette with cmdk

Build the Cmd+K command palette:
- Fuzzy search across commands
- Grouped results: Navigation, Actions, Settings
- Keyboard navigation (arrow keys, Enter, Escape)
- Show keyboard shortcuts next to each command
- Commands for now: Switch theme, Toggle sidebar, Toggle bottom panel,
  Toggle properties, Fit view, Zoom in/out

Style: Frosted glass backdrop, centered modal, dark theme matching
our design tokens.

Reference: research/10-uiux-developer-tools.md (cmdk section)
```

#### Task 1.5: Zustand Stores + Command Bus
```markdown
## Task: Create the state management architecture

Build 6 atomic Zustand stores with a command bus for coordination:

1. canvasStore — nodes, edges, selection (DO NOT use ReactFlowNode type,
   use our own ArchitexNode/ArchitexEdge with an adapter)
2. viewportStore — pan, zoom, viewport bounds
3. simulationStore — sim state, metrics, timeline position
4. editorStore — code editor content, active file, language
5. uiStore — panel states, theme, active module, command palette open
6. interviewStore — timer, score, hints, challenge state

The COMMAND BUS pattern:
- Define a Command type: { type: string, payload: unknown }
- dispatchCommand() sends to a handler that can update MULTIPLE stores atomically
- zundo wraps the command bus (undo = replay inverse command)

Add devtools middleware to every store.
Add persist middleware to uiStore (save panel sizes, theme).

Reference: research/42-chief-architect-final-review.md (cross-store coordination section)
```

#### Task 1.6: React Flow Canvas Setup
```markdown
## Task: Set up React Flow with our custom architecture

Create the base React Flow canvas:
1. ReactFlow component with our theme (dark background, dot grid)
2. Custom background (CSS dot pattern from our design system)
3. Minimap (bottom-right corner)
4. Controls (zoom in/out/fit)
5. The ADAPTER PATTERN:
   - Our ArchitexNode type in canvasStore
   - A useReactFlowAdapter() hook that converts ArchitexNode[] ↔ ReactFlowNode[]
   - This is CRITICAL — our model must not depend on React Flow's types
6. One example custom node (ServiceNode) with our design system styling
7. Connection line with animated dash when dragging
8. nodeTypes and edgeTypes defined OUTSIDE the component (static reference)

Reference: research/22-canvas-editor-ui-deep-dive.md
Reference: research/11-animation-visualization-techniques.md (4-layer rendering)
```

#### Task 1.7: IndexedDB Persistence (Repository Pattern)
```markdown
## Task: Set up Dexie.js with repository abstraction

Create the storage layer:
1. Dexie database with tables: diagrams, diagramMeta, settings, templates
2. Repository interface:
   interface DiagramRepository {
     save(diagram: Diagram): Promise<void>
     load(id: string): Promise<Diagram | null>
     list(options?: ListOptions): Promise<DiagramMeta[]>
     delete(id: string): Promise<void>
   }
3. DexieDigramRepository implementing the interface
4. Auto-save hook: debounce 1 second, save canvas state to IndexedDB
5. Load on startup: restore last-open diagram

The repository abstraction lets us swap Dexie for SQLite WASM or cloud
storage later without changing any component code.

Reference: research/12-export-sharing-persistence.md
```

#### Task 1.8: Clerk Authentication
```markdown
## Task: Set up Clerk auth with security best practices

1. Install @clerk/nextjs
2. ClerkProvider in root layout
3. Sign-in and sign-up pages at (auth)/sign-in and (auth)/sign-up
4. Middleware for route protection (BUT remember CVE-2025-29927)
5. CRITICAL: Create requireAuth() utility that EVERY Route Handler
   and Server Action must call:
   
   export async function requireAuth() {
     const { userId } = await auth();
     if (!userId) throw new Response("Unauthorized", { status: 401 });
     return userId;
   }

6. User button in the top-right of the activity bar
7. Protected routes: /dashboard, /editor, /challenges
8. Public routes: /, /templates (gallery), /docs

Reference: research/22-auth-security-compliance.md (CRITICAL security section)
```

#### Task 1.9: Neon Database + Drizzle Schema
```markdown
## Task: Deploy database schema

The Drizzle schema files already exist at src/db/schema/*.ts (13 files,
2,127 lines, 20 tables). Your job:

1. Install drizzle-orm, @neondatabase/serverless, drizzle-kit
2. Create drizzle.config.ts pointing to Neon
3. Review each schema file — they are ALREADY WRITTEN:
   - src/db/schema/users.ts
   - src/db/schema/diagrams.ts
   - src/db/schema/templates.ts
   - src/db/schema/challenges.ts
   - src/db/schema/progress.ts
   - src/db/schema/achievements.ts
   - src/db/schema/community.ts
   - src/db/schema/collaboration.ts
   - src/db/schema/notifications.ts
   - src/db/schema/activity.ts
   - src/db/schema/relations.ts
   - src/db/index.ts (connection with Edge/Serverless/Direct modes)
4. Run drizzle-kit push to deploy to Neon
5. Create a seed script for initial templates and achievements

Reference: The actual schema files in src/db/schema/
```

#### Task 1.10: CI/CD + PWA
```markdown
## Task: GitHub Actions pipeline + PWA setup

1. GitHub Actions workflow (.github/workflows/ci.yml):
   - lint + typecheck (parallel)
   - unit tests (vitest)
   - build Next.js
   - Playwright E2E (after build)
   - bundle size check (size-limit)

2. PWA with @ducanh2912/next-pwa:
   - manifest.json (name: Architex, theme: #0C0D0F)
   - Service Worker with Workbox caching strategies
   - Offline support for the canvas (IndexedDB has the data)

3. Vitest config with React Flow mocks (ResizeObserver, IntersectionObserver)
4. One example test for canvasStore
5. Storybook setup (@storybook/react-vite) with one example story

Reference: research/15-testing-deployment.md
```

---

### HOW TO USE THESE TASK PROMPTS

For each task:

1. Start a NEW Claude session (fresh context)
2. Paste Layer 1 (Context Prompt) — 400 words
3. Paste the specific Task Prompt — 200-500 words
4. Let Claude build it
5. Run verification:
   - Does it compile? (`pnpm build`)
   - Does it render? (`pnpm dev` → check localhost)
   - Do tests pass? (`pnpm test`)
6. Commit: `git add . && git commit -m "Task 1.X: [description]"`
7. Move to next task

### TASK DEPENDENCY GRAPH

```
Task 1.1 (Project Init)
  ↓
Task 1.2 (Design System)
  ↓
Task 1.3 (Layout Shell) ←── depends on 1.2
  ↓
Task 1.4 (Command Palette) ←── depends on 1.3
  ↓
Task 1.5 (Zustand Stores) ←── can run parallel with 1.4
  ↓
Task 1.6 (React Flow Canvas) ←── depends on 1.3 + 1.5
  ↓
Task 1.7 (Dexie Persistence) ←── depends on 1.5
  ↓
Task 1.8 (Clerk Auth) ←── can run parallel with 1.6, 1.7
  ↓
Task 1.9 (Neon + Drizzle) ←── depends on 1.8
  ↓
Task 1.10 (CI/CD + PWA) ←── depends on everything above
```

### PARALLEL OPPORTUNITIES
Tasks 1.4 and 1.5 can be built in parallel.
Tasks 1.6, 1.7, and 1.8 can be built in parallel (different files, no conflict).
This means Phase 1 can be done in ~7 sequential sessions, not 10.

---

## PHASE 2-10: TASK BREAKDOWN (Summary)

### Phase 2: System Design Simulator (15 tasks)
2.1  Component palette UI (sidebar with categories, search)
2.2  Compute nodes (Web Server, App Server, Serverless, Worker, Container)
2.3  Storage nodes (SQL, NoSQL, KV, Search, TimeSeries, Graph, Object)
2.4  Messaging nodes (Queue, Stream, PubSub, Event Bus)
2.5  Networking nodes (LB, API Gateway, CDN, DNS, Firewall, Service Mesh)
2.6  Edge types with animations (HTTP, gRPC, WebSocket, Queue, DB, Cache)
2.7  Properties panel (node config: throughput, latency, capacity)
2.8  WASM simulation engine — core (queuing theory M/M/1, M/M/c)
2.9  Traffic generator + particle flow animation
2.10 Metrics dashboard (throughput, latency percentiles, utilization)
2.11 Chaos engineering events (10 core events)
2.12 Capacity planning calculator
2.13 Template system (JSON schema + 5 starter templates)
2.14 Export: JSON save/load + PNG
2.15 Simulation playback controls (play/pause/step/speed/scrubber)

### Phase 3: Algorithm Visualizer (12 tasks)
3.1  AnimationStep framework + playback controller
3.2  Array visualization component (bars, highlights, colors)
3.3  Sorting algorithms (8): step generators + visualization
3.4  Graph visualization component (force-directed layout)
3.5  Graph algorithms (10): BFS, DFS, Dijkstra, etc.
3.6  Tree visualization component (hierarchical layout)
3.7  Tree algorithms (8): BST, AVL, Red-Black, B-Tree operations
3.8  DP table visualization + 5 DP algorithms
3.9  String algorithm visualization + 4 string algorithms
3.10 Monaco code panel with line sync
3.11 Complexity analysis panel
3.12 Side-by-side comparison mode

### Phase 4: LLD + DB + Distributed (14 tasks)
### Phase 5: Net + OS + Concurrency + Security + ML (15 tasks)
### Phase 6: Interview Engine + AI (10 tasks)
### Phase 7: Collaboration + Community (10 tasks)
### Phase 8: Desktop + Export + Search + Plugins (10 tasks)
### Phase 9: Landing + SEO + Launch (8 tasks)
### Phase 10: Accessibility + Performance + Enterprise (8 tasks)

**Total: ~112 tasks across 10 phases**

---

## VERIFICATION AFTER EACH TASK

```markdown
## Verify Task [X.Y]

Check:
1. Does `pnpm build` succeed with zero errors?
2. Does `pnpm dev` render correctly on localhost?
3. Do all existing tests still pass? (`pnpm test`)
4. Is the new code consistent with our design system? (colors, spacing, fonts)
5. Does keyboard navigation work? (Tab, Enter, Escape, arrow keys)
6. Does dark mode look correct?
7. Is the new code accessible? (focus visible, aria-labels)
8. No TypeScript `any` types introduced?
9. No console.log left in code?
10. Git commit with descriptive message?
```

---

## IMPORTANT RULES FOR EVERY SESSION

1. **NEVER paste the entire MEGA_PROMPT.** Only Layer 1 (context) + Layer 2 (task).
2. **ONE task per session.** Don't try to do 2 tasks at once.
3. **Compile after every task.** If it doesn't compile, fix before moving on.
4. **Commit after every task.** Small, atomic commits. Git is your safety net.
5. **Read the research file** referenced in the task. Paste relevant sections if needed.
6. **Don't skip verification.** Bugs compound. A bug in Task 1.3 breaks Tasks 1.4-1.10.
7. **The order matters.** Follow the dependency graph. Don't jump ahead.
8. **If stuck on a task, break it smaller.** Split a task into 2-3 sub-tasks.

---

## RESEARCH FILE QUICK REFERENCE

| When Building... | Read This File |
|---|---|
| Project setup, dependencies | `research/04-tech-stack-recommendations.md` |
| Design system, colors, tokens | `research/22-architex-design-system.md` |
| Layout, panels, toolbar | `research/22-canvas-editor-ui-deep-dive.md` |
| Canvas, nodes, edges | `research/22-canvas-editor-ui-deep-dive.md` |
| Animations, particles | `research/11-animation-visualization-techniques.md` |
| Simulation math | `research/16-queuing-theory-simulation-math.md` |
| Real-world numbers | `research/21-benchmarks-real-world-numbers.md` |
| Auth, security | `research/22-auth-security-compliance.md` |
| Database schema | `src/db/schema/*.ts` (already exists!) |
| Backend architecture | `research/22-backend-infrastructure.md` |
| Algorithm viz patterns | `research/01-dsa-visualization-platforms.md` |
| System design components | `research/02-system-design-tools.md` |
| Microservices patterns | `research/18-microservices-patterns.md` |
| Case studies (templates) | `research/09-real-world-case-studies.md` |
| AI integration | `research/17-ai-integration-strategy.md` |
| Collaboration (Yjs) | `research/12-export-sharing-persistence.md` |
| Landing page | `research/22-landing-page-design.md` |
| SEO strategy | `research/31-seo-content-growth.md` |
| Wireframes (ALL screens) | `docs/wireframes/architex-wireframe-specs.md` |
| Performance targets | `docs/plans/performance-optimization-strategy.md` |
| Security threats | `research/43-security-threat-model.md` |
| Scalability limits | `research/44-scalability-breaking-points.md` |
| Monetization | `research/26-monetization-community-strategy.md` |
