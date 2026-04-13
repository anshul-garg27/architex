# ARCHITEX: The Ultimate Engineering Visualization & Simulation Platform

## BUILD PROMPT — Complete Technical Specification

> You are building **Architex**, a browser-based, open-source platform that combines interactive system design simulation, algorithm visualization, low-level design tools, distributed systems exploration, and interview preparation into a single unified application. This is not a diagramming tool — it is a **living, interactive engineering laboratory** where architectures breathe, algorithms animate, and systems fail gracefully under chaos.

---

# PART 1: PROJECT VISION & PHILOSOPHY

## 1.1 What We Are Building

Architex is a **unified engineering learning and design platform** with 12 integrated modules:

1. **System Design Simulator** — Drag-and-drop architecture builder with live traffic simulation, chaos engineering, and real-time metrics
2. **Algorithm Visualizer** — Step-by-step execution of 100+ algorithms with code highlighting, complexity analysis, and side-by-side comparison
3. **Data Structure Explorer** — Interactive visualization of 40+ data structures including advanced ones (LSM Trees, Bloom Filters, Skip Lists, CRDTs)
4. **Low-Level Design Studio** — Class diagrams, sequence diagrams, design pattern visualization, SOLID principles, and bidirectional code generation
5. **Database Design Lab** — ER diagram builder, normalization step-through, query execution plan visualizer, B-Tree/LSM-Tree index visualization
6. **Distributed Systems Playground** — Interactive Raft/Paxos consensus, consistent hashing, vector clocks, gossip protocol, CAP theorem explorer
7. **Networking & Protocols Visualizer** — TCP handshake, TLS 1.3, HTTP/2 vs HTTP/3, DNS resolution, WebSocket lifecycle, gRPC vs REST vs GraphQL
8. **OS Concepts Simulator** — Process scheduling, page replacement, deadlock detection, memory management, thread synchronization
9. **Concurrency Lab** — Thread visualization, race condition demos, producer-consumer, dining philosophers, async/await execution flow, Go goroutine visualization
10. **Security & Cryptography Explorer** — OAuth 2.0/OIDC flows, JWT lifecycle, AES round visualization, Diffie-Hellman key exchange, CORS flow simulator
11. **ML System Design Studio** — ML pipeline builder, feature store architecture, model serving patterns, A/B testing system design, TensorFlow Playground-style neural network trainer
12. **Interview Engine** — Timed system design challenges, AI-powered evaluation, progressive difficulty, spaced repetition, scoring rubrics, 55+ real-world templates

## 1.2 Design Principles

1. **Simulate, Don't Just Diagram** — Every architecture must be runnable. Traffic flows as animated particles, queues fill up visually, databases show read/write operations, circuit breakers trip in real-time.
2. **Code ↔ Diagram Bidirectionality** — Design a class diagram and get TypeScript/Python/Java code. Write code and see the diagram update live.
3. **Time-Travel Everything** — Every simulation, algorithm execution, and protocol handshake supports pause, play, step forward, step backward, speed control, and timeline scrubbing.
4. **Physics-Based Animation** — Spring physics for node movement, particle flow for data transit, staggered transitions for multi-element changes. Nothing snaps — everything animates with intention.
5. **Keyboard-First, Mouse-Friendly** — Full keyboard navigation with spatial arrow-key movement between nodes. Command palette (Cmd+K) as the universal entry point. Vim-style shortcuts for power users.
6. **Offline-First** — Works without internet via PWA + IndexedDB. All simulations run client-side. Optional cloud sync for collaboration.
7. **Accessible by Default** — WCAG 2.2 AA compliant. Screen reader support with semantic diagram descriptions. Colorblind-safe palettes. Reduced motion support. Spatial keyboard navigation.
8. **Realistic Simulations** — Backed by queuing theory (Little's Law, M/M/c models), real-world latency numbers (Jeff Dean's numbers, updated for 2025), and actual throughput benchmarks. Not toy simulations.

## 1.3 What Makes This Better Than Everything Else

| Existing Tool | What It Does | What Architex Does Better |
|---|---|---|
| paperdraw.dev | System design simulation (Flutter, ~15 components) | 12 modules, 60+ components, WASM-powered physics, realistic queuing theory |
| VisuAlgo | Algorithm visualization (24 modules, no custom code) | Code editor + visualization + memory model in one view, side-by-side comparison, export to GIF |
| Excalidraw | Static whiteboard diagramming | Live simulation, chaos engineering, traffic flow, real-time metrics |
| Algorithm Visualizer | Code-first algo viz (3 languages) | + Data structure deep-dives, + interview mode, + spaced repetition |
| USFCA Galles | Data structure visualization (dated UI) | Modern React UI, 2x more structures, interactive code alongside |
| The Secret Lives of Data | Guided Raft walkthrough (non-interactive) | Full interactive sandbox — modify nodes, inject failures, compare Raft vs Paxos |
| dbdiagram.io | ER diagramming (text-based) | + Normalization step-through, + query plan viz, + B-Tree index viz |
| TensorFlow Playground | Neural network trainer (2D only) | + Full ML system design, + feature store, + serving architecture |
| Refactoring.Guru | Static design pattern explanations | Interactive pattern visualization with live code generation |
| LeetCode | Coding challenges (no system design) | First platform with gamified system design challenges + AI evaluation |

---

# CRITICAL: ARCHITECTURE DEBATE VERDICTS (From 7 Independent Review Agents)

> Seven specialized architect agents debated every decision. Here are the synthesized verdicts.

## BUILD SCOPE: FULL V3 — ALL 12 MODULES FROM DAY 1

We are building the **complete platform** with all 12 modules. No phased MVP — the full vision ships. This is a deliberate choice to maximize impact and build the complete engineering laboratory from the start. The implementation roadmap phases the WORK (what gets built when), but the ARCHITECTURE supports all 12 modules from the beginning.

## Tech Stack Debate Verdicts

| Decision | Original | Debate Verdict | Final Call |
|---|---|---|---|
| Framework | Next.js 16 | Devil: Vite. Defense: Keep (has docs/landing) | **Keep Next.js** (landing page + gallery need SSR) |
| Diagram Engine | React Flow | Both: Keep + build Adapter pattern | **Keep + abstract your model from ReactFlowNode** |
| Simulation | Rust → WASM | Devil: TS Workers. Defense: WASM 5-15x faster | **Rust → WASM from day 1** (full platform needs the 5-15x speedup for 100+ algorithms + simulation) |
| State | Zustand | Both: Keep with conventions | **Keep + enforce named actions + command bus for cross-store** |
| Collaboration | Yjs (P2P) | Both: Defer to Phase 2 | **Yjs + PartyKit from Phase 2** (architecture ready from day 1) |
| UI | shadcn/ui + Tailwind | Both: Keep | **Copy once, customize to design system, own the code** |
| Storage | Dexie (IndexedDB) | Both: Keep with repo abstraction | **Keep + abstract behind repository interface** |
| Desktop | Tauri v2 | Devil: Defer. Defense: Brand positioning | **Tauri v2 desktop app included** (5-15MB, shared Rust toolchain with WASM) |
| Code Editor | Monaco (2MB) | Devil: CodeMirror 6. Defense: IntelliSense | **Monaco Editor** (async-loaded, IntelliSense for Terraform/YAML/code gen) |
| Analytics | PostHog | Devil: Plausible. Defense: Free tier works | **PostHog Cloud free tier from day 1** |
| Auth | (not specified) | Security Architect | **Clerk** (10K free MAU, 30-min setup) |
| Database | (not specified) | Data Architect | **Neon Serverless Postgres + Drizzle ORM** |
| Backend Jobs | (not specified) | Backend Architect | **Inngest** (runs inside Vercel, no separate infra) |
| Real-time | Yjs | Backend Architect | **PartyKit + Yjs** on Cloudflare Durable Objects (Phase 2) |
| Email | (not specified) | Product Architect | **Resend + react-email + Inngest for drip scheduling** |

## Top 5 Architectural Risks (From Chief Architect)

1. **Simulation-UI Protocol undefined** — Must define `SimulationCommand`, `SimulationSnapshot`, `SimulationEvent` TypeScript interfaces BEFORE writing any code
2. **Cross-store coordination missing** — Need command bus pattern for multi-store atomic updates + undo/redo
3. **WASM fallback needed** — TypeScript fallback required for when WASM fails to load (older browsers, Safari edge cases)
4. **Offline + cloud sync conflict** — Design clear source-of-truth: IndexedDB for offline, Neon for cloud, Yjs CRDTs for real-time merge
5. **Module boundary contract missing** — Must define `ModuleConfig`, `ModuleCanvas`, `ModuleSimulation`, `ModuleStore` interfaces

## Security: Critical Vulnerabilities (From Security Architect — 29 total found)

**Must fix before launch (5 Critical):**
1. Auth checks in EVERY Route Handler/Server Action (not just middleware — CVE-2025-29927)
2. PartyKit collaboration rooms need JWT auth on every WebSocket connect
3. XSS prevention: DOMPurify + Zod validation on all user-generated content (diagram labels, comments)
4. API keys (`ANTHROPIC_API_KEY`) must NEVER be prefixed with `NEXT_PUBLIC_`
5. Sentry `beforeSend` must scrub env vars and auth headers from error reports

**Full threat model: See `research/43-security-threat-model.md`**

## Scalability: Key Breaking Points (From Scalability Architect)

| System | Breaking Point | Scale | Fix |
|---|---|---|---|
| React Flow (SVG) | FPS < 30 | 200+ nodes | React.memo, LOD, edge virtualization |
| Particle animation | 60fps broken | 100+ particles | Pre-compute path cache, throttle to 30Hz |
| Yjs P2P | O(n²) bandwidth | 20+ users/room | Switch to server relay (PartyKit) |
| Claude API | Queue backlog | 1000 simultaneous | Request queue + per-user rate limit + prompt caching |
| Clerk pricing | $1,800/mo | 100K MAU | Plan migration to Better Auth |

**Key insight: The core product (canvas + simulation) is entirely client-side and scales to millions at near-zero marginal cost.**

**Full analysis: See `research/44-scalability-breaking-points.md`**

---

# PART 2: TECH STACK & ARCHITECTURE

## 2.1 Core Dependencies

```json
{
  "framework": "next@^16 (App Router, Turbopack, TypeScript strict)",
  "diagram-engine": "@xyflow/react@^12.4 (React Flow v12+)",
  "animation": "motion@^12.26 (formerly Framer Motion) + d3@^7 (layout math only)",
  "code-editor": "@monaco-editor/react@^4.7 (async-loaded, IntelliSense for Terraform/YAML/code)",
  "ui-components": "shadcn/ui (latest) + @radix-ui/react-* + tailwindcss@^4",
  "state-management": "zustand@^5 + zundo (undo/redo)",
  "client-storage": "dexie@^4 + dexie-react-hooks",
  "icons": "lucide-react",
  "command-palette": "cmdk@^1",
  "resizable-panels": "react-resizable-panels",
  "worker-communication": "comlink@^4",
  "collaboration": "yjs + y-webrtc + y-indexeddb",
  "image-export": "html-to-image (or snapdom for modern CSS)",
  "pdf-export": "jspdf",
  "compression": "lz-string (URL sharing) + fflate (file compression)",
  "file-access": "browser-fs-access",
  "pwa": "@ducanh2912/next-pwa",
  "fonts": "Geist (UI) + JetBrains Mono (code)",
  "testing": "vitest + @testing-library/react + @playwright/test + storybook@^8",
  "monitoring": "posthog-js (privacy-friendly) + @sentry/nextjs",
  "auth": "clerk (10K free MAU) + @clerk/nextjs",
  "database": "neon (@neondatabase/serverless) + drizzle-orm",
  "email": "resend + @react-email/components",
  "background-jobs": "inngest",
  "search": "flexsearch (client-side MVP) → meilisearch (cloud)"
}
```

## 2.2 WASM Simulation Engine (Rust)

The simulation engine runs in Web Workers compiled from Rust to WebAssembly for near-native 5-15x speedup over JavaScript. This is essential for running all 12 modules' simulations — from queuing theory Monte Carlo (500M operations) to 100+ algorithm step generators to Raft consensus state machines.

```
Main Thread (React UI, 60fps animations)
  │
  │ Comlink (async RPC)
  │
  ▼
Worker Pool (2-4 Web Workers)
  │
  │ wasm-bindgen + serde-wasm-bindgen
  │
  ▼
WASM Module (Rust-compiled, split into feature chunks)
  ├── Graph algorithms (BFS, DFS, Dijkstra, A*, Bellman-Ford, Floyd-Warshall)
  ├── Sorting algorithms (all, with step recording)
  ├── System simulation engine (queuing theory, traffic modeling)
  ├── Load balancer simulation (round-robin, consistent hashing, least-connections)
  ├── Consensus algorithm simulation (Raft, Paxos state machines)
  ├── Network protocol simulation (TCP state machine, TLS handshake)
  └── Force-directed graph layout (d3-force equivalent, faster in Rust)
```

The Rust crate lives at `wasm-engine/` with `wasm-pack build --target web --release`. Split into feature chunks:
- `core.wasm` (~100KB): graph algorithms, sorting — loaded immediately
- `simulation.wasm` (~200KB): queuing theory, traffic modeling — loaded when simulation starts
- `consensus.wasm` (~150KB): Raft, Paxos — loaded when distributed module opens
- `layout.wasm` (~100KB): force-directed layout — loaded on demand

WASM cached via Service Worker. Streaming compilation via `WebAssembly.instantiateStreaming()`.

**TypeScript fallback:** If WASM fails to load (older browser, Safari issues), fall back to TypeScript implementation for critical algorithms. Show "Simulations running in compatibility mode" banner.

**Critical interface to define FIRST** (before any implementation):
```typescript
interface SimulationCommand { type: string; payload: unknown; }
interface SimulationSnapshot { nodes: NodeMetrics[]; edges: EdgeMetrics[]; tick: number; }
interface SimulationEvent { type: string; timestamp: number; data: unknown; }
```
This contract enables parallel development: Rust engine devs and React UI devs work independently.

## 2.3 Rendering Architecture (4-Layer Hybrid)

```
┌─────────────────────────────────────────────────┐
│  Layer 4: HTML Overlay                          │  Tooltips, context menus, command palette,
│  (React + Radix UI + Tailwind)                  │  property panels, code editor
├─────────────────────────────────────────────────┤
│  Layer 3: SVG Interactive                       │  Nodes (React components inside foreignObject),
│  (React Flow @xyflow/react)                     │  edges (SVG paths), handles, selection
├─────────────────────────────────────────────────┤
│  Layer 2: Canvas Effects                        │  Particle flow on edges, simulation FX,
│  (Canvas 2D via requestAnimationFrame)          │  heatmaps, trail effects
├─────────────────────────────────────────────────┤
│  Layer 1: Background                            │  Dot grid pattern via CSS
│  (CSS background-image)                         │  background-image: radial-gradient(...)
└─────────────────────────────────────────────────┘
```

- **Nodes** are full React components — can embed Monaco editors, charts, status indicators inside them.
- **Edges** are SVG paths with animated dash-offset for "active" state and particle dots for data flow.
- **Particle effects** run on a Canvas overlay using `requestAnimationFrame` — multiple particles per edge encode throughput (more particles = more traffic), particle color encodes data type, particle speed encodes latency.
- **Viewport culling** is handled by React Flow — only nodes visible in the viewport are rendered in the DOM.
- **Level-of-Detail (LOD)**: At zoom > 40%, show full node detail. At zoom 15-40%, show simplified nodes (label only). Below 15%, show colored dots.

## 2.4 State Architecture (Atomic Zustand Stores)

Do NOT use a single monolithic store. Split into atomic slices to prevent unnecessary re-renders:

```typescript
// Separate stores — changing viewport does NOT re-render nodes
const useCanvasStore = create(...)     // nodes, edges, selection
const useViewportStore = create(...)   // pan, zoom, viewport bounds
const useSimulationStore = create(...) // simulation state, metrics, timeline
const useEditorStore = create(...)     // code editor state, active file
const useUIStore = create(...)         // panels open/closed, theme, active module
const useInterviewStore = create(...)  // timer, score, hints, challenge state
```

Each store uses `zustand/middleware/persist` → Dexie.js (IndexedDB) for offline persistence. The `zundo` middleware provides undo/redo with a 100-step history cap.

## 2.5 Project Structure

```
architex/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Main app layout (sidebar + canvas)
│   │   ├── system-design/        # System Design Simulator module
│   │   ├── algorithms/           # Algorithm Visualizer module
│   │   ├── data-structures/      # Data Structure Explorer module
│   │   ├── lld/                  # Low-Level Design Studio module
│   │   ├── database/             # Database Design Lab module
│   │   ├── distributed/          # Distributed Systems Playground module
│   │   ├── networking/           # Networking & Protocols module
│   │   ├── os/                   # OS Concepts Simulator module
│   │   ├── concurrency/          # Concurrency Lab module
│   │   ├── security/             # Security & Cryptography module
│   │   ├── ml-design/            # ML System Design module
│   │   └── interview/            # Interview Engine module
│   ├── embed/[id]/               # Embeddable read-only viewer
│   ├── api/                      # API routes (oembed, share links)
│   └── layout.tsx                # Root layout with providers
├── components/
│   ├── canvas/                   # React Flow canvas, custom nodes, custom edges
│   │   ├── nodes/                # All custom node types (60+ components)
│   │   │   ├── system-design/    # LoadBalancerNode, DatabaseNode, CacheNode, QueueNode, etc.
│   │   │   ├── algorithm/        # ArrayNode, TreeNode, GraphNode, HeapNode, etc.
│   │   │   ├── lld/              # ClassNode, InterfaceNode, etc.
│   │   │   ├── database/         # TableNode, IndexNode, etc.
│   │   │   └── networking/       # ServerNode, ClientNode, PacketNode, etc.
│   │   ├── edges/                # Custom edge types with animation
│   │   │   ├── DataFlowEdge.tsx  # Animated particles
│   │   │   ├── DependencyEdge.tsx
│   │   │   └── ProtocolEdge.tsx  # Shows protocol handshake steps
│   │   ├── panels/               # Sidebar panels
│   │   │   ├── ComponentPalette.tsx   # Drag-and-drop component library
│   │   │   ├── PropertiesPanel.tsx    # Selected node properties
│   │   │   ├── MetricsPanel.tsx       # Real-time simulation metrics
│   │   │   ├── CodePanel.tsx          # Monaco editor for code view
│   │   │   └── TimelinePanel.tsx      # Playback timeline with scrubber
│   │   └── overlays/             # Canvas overlay components
│   │       ├── ParticleLayer.tsx # Canvas 2D particle effects
│   │       ├── SelectionBox.tsx
│   │       └── Minimap.tsx
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── interview/                # Interview mode UI components
│   ├── shared/                   # Cross-module shared components
│   └── providers/                # React context providers
├── lib/
│   ├── simulation/               # Simulation engine (JS layer)
│   │   ├── traffic-simulator.ts  # Traffic generation and routing
│   │   ├── chaos-engine.ts       # Chaos event injection
│   │   ├── metrics-collector.ts  # Throughput, latency, error rate tracking
│   │   ├── queuing-model.ts      # M/M/1, M/M/c, Little's Law calculations
│   │   └── capacity-planner.ts   # Back-of-envelope calculations
│   ├── algorithms/               # Algorithm step generators
│   │   ├── sorting/              # All sorting algorithms
│   │   ├── graph/                # All graph algorithms
│   │   ├── tree/                 # Tree algorithms
│   │   ├── dp/                   # Dynamic programming
│   │   ├── string/               # String algorithms
│   │   └── types.ts              # AnimationStep, VisualMutation interfaces
│   ├── distributed/              # Distributed systems simulations
│   │   ├── raft.ts               # Raft consensus state machine
│   │   ├── paxos.ts              # Paxos protocol
│   │   ├── consistent-hash.ts    # Consistent hashing ring
│   │   ├── vector-clock.ts       # Vector clock operations
│   │   ├── gossip.ts             # Gossip protocol epidemic spread
│   │   └── crdt.ts               # CRDT implementations (G-Counter, LWW-Register, etc.)
│   ├── networking/               # Protocol simulations
│   │   ├── tcp-state-machine.ts
│   │   ├── tls-handshake.ts
│   │   ├── dns-resolution.ts
│   │   └── http-comparison.ts
│   ├── os/                       # OS concept simulations
│   │   ├── scheduling.ts         # FCFS, SJF, RR, Priority, MLFQ
│   │   ├── page-replacement.ts   # FIFO, LRU, Optimal, Clock
│   │   ├── deadlock.ts           # Resource allocation graph, Banker's algorithm
│   │   └── memory.ts             # Paging, segmentation, virtual memory
│   ├── security/                 # Security/crypto simulations
│   │   ├── oauth-flow.ts
│   │   ├── jwt-lifecycle.ts
│   │   ├── tls-visualization.ts
│   │   └── aes-rounds.ts
│   ├── interview/                # Interview engine logic
│   │   ├── scoring.ts            # Multi-dimensional rubric scoring
│   │   ├── srs.ts                # FSRS spaced repetition algorithm
│   │   ├── challenge-generator.ts
│   │   └── ai-evaluator.ts      # LLM-based design evaluation
│   ├── export/                   # Export serializers
│   │   ├── to-mermaid.ts
│   │   ├── to-plantuml.ts
│   │   ├── to-drawio.ts
│   │   ├── to-terraform.ts
│   │   ├── to-png.ts
│   │   ├── to-pdf.ts
│   │   └── to-code.ts           # UML to TypeScript/Python/Java
│   ├── constants/                # Real-world numbers
│   │   ├── latency-numbers.ts    # Jeff Dean's numbers, updated
│   │   ├── throughput-numbers.ts # RPS benchmarks for each component type
│   │   ├── cost-estimates.ts     # AWS/GCP/Azure cost per request/GB
│   │   └── system-numbers.ts     # Twitter 500M tweets/day, Netflix 15% bandwidth, etc.
│   └── utils/                    # Shared utilities
├── stores/                       # Zustand stores
├── hooks/                        # Custom React hooks
├── styles/                       # Global styles, theme tokens
├── workers/                      # Web Worker files
│   ├── simulation.worker.ts
│   ├── layout.worker.ts
│   └── algorithm.worker.ts
├── wasm-engine/                  # Rust WASM simulation engine
│   ├── src/
│   │   ├── lib.rs
│   │   ├── graph.rs
│   │   ├── sorting.rs
│   │   ├── simulation.rs
│   │   └── consensus.rs
│   ├── Cargo.toml
│   └── build.sh                  # wasm-pack build script
├── templates/                    # Pre-built diagram templates (JSON)
│   ├── system-design/            # 55+ real-world architectures
│   │   ├── twitter-fanout.json
│   │   ├── uber-dispatch.json
│   │   ├── netflix-cdn.json
│   │   ├── url-shortener.json
│   │   └── ...
│   ├── design-patterns/          # 23 GoF patterns + more
│   ├── algorithms/               # Pre-configured algorithm demos
│   └── distributed/              # Raft, Paxos, consistent hashing setups
├── public/
│   ├── icons/                    # Component icons (SVG)
│   └── manifest.json             # PWA manifest
├── e2e/                          # Playwright E2E tests
├── test/                         # Vitest setup and helpers
├── .storybook/                   # Storybook config
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

# PART 3: CORE PLATFORM

## 3.1 Application Shell Layout

Use a VS Code-inspired multi-panel layout:

```
┌──────┬────────────────────────────────────────┬───────────────┐
│      │  Tab Bar (open diagrams/modules)       │               │
│  A   ├────────────────────────────────────────┤   Properties  │
│  c   │                                        │   Panel       │
│  t   │                                        │   (right)     │
│  i   │         Main Canvas                    │               │
│  v   │         (React Flow)                   │   - Node      │
│  i   │                                        │     props     │
│  t   │                                        │   - Metrics   │
│  y   │                                        │   - Config    │
│      │                                        │               │
│  B   ├────────────────────────────────────────┤               │
│  a   │  Bottom Panel (collapsible)            │               │
│  r   │  Code Editor | Timeline | Metrics      │               │
├──────┴────────────────────────────────────────┴───────────────┤
│  Status Bar: Module name | Node count | Sim status | Zoom     │
└───────────────────────────────────────────────────────────────┘
```

- **Activity Bar** (far left, 48px): Icon-only module switcher. Icons for each of the 12 modules. Click to switch modules. Keyboard: `Cmd+1` through `Cmd+9` for first 9 modules.
- **Sidebar** (left, collapsible, 240-400px): Component palette for the active module. Drag-and-drop components onto the canvas. Search/filter components. Grouped by category.
- **Main Canvas** (center, fills remaining space): React Flow instance. Infinite canvas with pan/zoom. Background dot grid.
- **Properties Panel** (right, collapsible, 280-400px): Shows properties of selected node. Edit configuration (throughput, latency, capacity, etc.). Shows real-time metrics during simulation.
- **Bottom Panel** (bottom, collapsible, 200-400px): Tabs for Code Editor (Monaco), Timeline (playback controls), Metrics Dashboard, Console/Logs.
- **Status Bar** (bottom, full width, 24px): Current module, node/edge count, simulation status, zoom level, keyboard shortcut hints.

All panels are resizable via `react-resizable-panels`. All panels can be collapsed. `Cmd+B` toggles sidebar. `Cmd+J` toggles bottom panel. `Cmd+Shift+B` toggles properties panel.

## 3.2 Command Palette (Cmd+K)

Built with `cmdk` library. Context-aware — available commands change based on active module:

**Global Commands:**
- Switch module (System Design, Algorithms, LLD, ...)
- Open template (search 200+ templates)
- Toggle theme (dark/light/system)
- Toggle panel (sidebar, properties, bottom)
- Export (PNG, SVG, PDF, Mermaid, PlantUML, JSON)
- Import (JSON, draw.io XML)
- Share (generate shareable URL)
- Settings
- Keyboard shortcuts cheat sheet

**System Design Mode:**
- Add component (search all 60+ component types)
- Start/stop simulation
- Inject chaos event (search all chaos events)
- Run capacity estimation
- Load template

**Algorithm Mode:**
- Select algorithm (search all 100+ algorithms)
- Set input data
- Play/pause/step
- Change speed
- Compare with another algorithm

**Interview Mode:**
- Start challenge
- Get hint
- Submit for evaluation
- View rubric

## 3.3 Theme System

Two themes: **Dark** (default) and **Light**. Based on shadcn/ui theming with CSS custom properties.

**Dark Theme (default):**
```css
--background: hsl(228 15% 7%);        /* Near-black with subtle blue tint */
--foreground: hsl(220 14% 90%);       /* Slightly muted white */
--card: hsl(228 15% 10%);             /* Surface elevation 1 */
--card-foreground: hsl(220 14% 90%);
--popover: hsl(228 15% 12%);          /* Surface elevation 2 */
--primary: hsl(252 87% 67%);          /* Violet accent (like Linear) */
--primary-foreground: hsl(0 0% 100%);
--secondary: hsl(228 15% 15%);
--muted: hsl(228 15% 18%);
--muted-foreground: hsl(220 10% 50%);
--border: hsl(228 15% 16%);           /* Very subtle borders */
--ring: hsl(252 87% 67%);
--destructive: hsl(0 72% 51%);        /* Red for errors */
--warning: hsl(38 92% 50%);           /* Amber for warnings */
--success: hsl(142 71% 45%);          /* Green for success */
--info: hsl(217 91% 60%);             /* Blue for info */
```

**Semantic State Colors for Simulation (dark mode):**

| State | Color | Hex | Usage |
|---|---|---|---|
| Idle/Default | Gray | `#6B7280` | Inactive components |
| Active/Running | Blue | `#3B82F6` | Currently processing |
| Success/Healthy | Green | `#22C55E` | Healthy, completed |
| Warning/Degraded | Amber | `#F59E0B` | High latency, near capacity |
| Error/Down | Red | `#EF4444` | Failed, circuit open |
| Processing/Busy | Purple | `#A855F7` | Computing, queued |
| Selected/Focused | White + glow | `#F9FAFB` + ring | User selection |

**Colorblind-safe alternative palette** (toggle in settings): Uses IBM Design colorblind-safe palette. Every state also has a distinct icon and/or pattern — color is never the sole indicator.

## 3.4 Keyboard Shortcuts

| Action | Shortcut | Context |
|---|---|---|
| Command palette | `Cmd+K` | Global |
| Toggle sidebar | `Cmd+B` | Global |
| Toggle bottom panel | `Cmd+J` | Global |
| Toggle properties | `Cmd+Shift+B` | Global |
| Undo | `Cmd+Z` | Global |
| Redo | `Cmd+Shift+Z` | Global |
| Select all | `Cmd+A` | Canvas |
| Delete selected | `Backspace` / `Delete` | Canvas |
| Copy / Paste | `Cmd+C` / `Cmd+V` | Canvas |
| Zoom in / out | `Cmd+=` / `Cmd+-` | Canvas |
| Fit view | `Cmd+Shift+F` | Canvas |
| Navigate nodes | Arrow keys | Canvas (spatial) |
| Select node | `Enter` | Canvas |
| Multi-select | `Shift+Click` | Canvas |
| Play/Pause simulation | `Space` | Simulation |
| Step forward | `→` (right arrow) | Timeline focused |
| Step backward | `←` (left arrow) | Timeline focused |
| Speed up | `Shift+→` | Simulation |
| Slow down | `Shift+←` | Simulation |
| Focus search | `/` | Global |
| Show shortcuts | `?` | Global |
| Quick switch module | `Cmd+1` through `Cmd+9` | Global |

---

# PART 4: MODULE — SYSTEM DESIGN SIMULATOR

## 4.1 Component Palette (60+ Components)

### Compute
- **Web Server** — Handles HTTP requests. Config: instances, CPU, memory, max connections.
- **Application Server** — Business logic. Config: instances, threads, processing time.
- **Serverless Function** — Event-driven compute. Config: memory, timeout, cold start time.
- **Container / Pod** — Kubernetes pod. Config: replicas, resource limits.
- **Worker Service** — Background job processor. Config: concurrency, poll interval.

### Load Balancing
- **Load Balancer (L7)** — HTTP/HTTPS. Config: algorithm (round-robin, least-connections, IP-hash, weighted, consistent-hash), health check interval, max connections.
- **Load Balancer (L4)** — TCP/UDP. Config: algorithm, connection limit.
- **API Gateway** — Rate limiting, auth, routing, transformation. Config: rate limit (req/s), auth type, routes.
- **Service Mesh / Sidecar** — mTLS, traffic management, observability. Config: retry policy, circuit breaker settings.
- **Reverse Proxy / CDN** — Edge caching, SSL termination. Config: cache TTL, origin, edge locations, bandwidth.

### Data Storage
- **Relational Database (PostgreSQL/MySQL)** — ACID transactions. Config: type, replicas, read/write ratio, connections, storage.
- **Document Database (MongoDB)** — Flexible schema. Config: shards, replica set size.
- **Key-Value Store (Redis/Memcached)** — In-memory. Config: memory, eviction policy (LRU/LFU/TTL), cluster size.
- **Wide-Column Store (Cassandra/HBase)** — Write-heavy, multi-region. Config: replication factor, consistency level (ONE/QUORUM/ALL).
- **Search Engine (Elasticsearch)** — Full-text search. Config: shards, replicas, index size.
- **Time-Series Database (InfluxDB/TimescaleDB)** — Metrics/events. Config: retention policy, aggregation interval.
- **Graph Database (Neo4j)** — Relationship-heavy. Config: nodes, relationships, query complexity.
- **Object Storage (S3)** — Blobs/files. Config: storage class, replication, bandwidth.
- **Data Warehouse (Snowflake/BigQuery)** — Analytical queries. Config: compute units, storage.

### Messaging & Streaming
- **Message Queue (RabbitMQ/SQS)** — Point-to-point. Config: queue depth, max consumers, delivery guarantee (at-least-once/exactly-once), DLQ.
- **Event Stream (Kafka)** — Pub/sub streaming. Config: partitions, replication factor, consumer groups, retention.
- **Pub/Sub (SNS/Google Pub/Sub)** — Fan-out. Config: subscriptions, filter policies.
- **Event Bus** — Async event routing. Config: rules, targets.

### Networking
- **DNS** — Name resolution. Config: TTL, failover strategy.
- **CDN Edge Node** — Content caching at edge. Config: cache hit rate, TTL, locations.
- **Firewall / WAF** — Security filtering. Config: rules, rate limiting.
- **VPN / Private Link** — Secure connectivity.

### Processing
- **Batch Processor** — Scheduled jobs. Config: batch size, schedule, processing time.
- **Stream Processor (Flink/Spark)** — Real-time data processing. Config: parallelism, windowing.
- **ETL Pipeline** — Extract, Transform, Load. Config: source, sink, transform steps.
- **ML Inference Service** — Model serving. Config: model size, batch size, latency target.
- **Video Transcoder** — Media processing. Config: input formats, output formats, parallelism.

### Client / External
- **Web Client (Browser)** — Frontend. Config: concurrent users, request rate.
- **Mobile Client** — Mobile app. Config: platform, request rate.
- **IoT Device** — Sensor/actuator. Config: device count, message frequency.
- **Third-Party API** — External service. Config: rate limit, latency, error rate.
- **Webhook** — Outbound notification. Config: retry policy, timeout.

### Observability
- **Metrics Collector (Prometheus)** — Metrics scraping and storage.
- **Log Aggregator (ELK)** — Centralized logging.
- **Distributed Tracer (Jaeger)** — Request tracing across services.
- **Alerting Engine** — Threshold-based alerting.

### Security
- **Auth Service (OAuth/JWT)** — Authentication and authorization.
- **Secret Manager (Vault)** — Secret storage and rotation.
- **Certificate Authority** — TLS certificate management.
- **Rate Limiter** — Request throttling. Config: algorithm (token-bucket/sliding-window/leaky-bucket), limit, window.

## 4.2 Edge Types (Connections)

| Edge Type | Visual | Use |
|---|---|---|
| **HTTP/REST** | Solid blue line + particles | Synchronous API calls |
| **gRPC** | Solid purple line + particles | High-performance RPC |
| **GraphQL** | Solid cyan line + particles | Flexible queries |
| **WebSocket** | Dashed green bidirectional | Real-time bidirectional |
| **Message Queue** | Dashed orange with queue icon | Async messaging |
| **Event Stream** | Dashed red with stream icon | Pub/sub events |
| **Database Query** | Dotted gray | Read/write operations |
| **Cache Lookup** | Dotted yellow | Cache hit/miss |
| **DNS Lookup** | Thin dotted | Name resolution |
| **Replication** | Double line | Data replication |

Each edge can be configured with: latency (ms), bandwidth (MB/s), error rate (%), timeout (ms).

## 4.3 Simulation Engine

### Traffic Generation
The traffic generator creates request particles that flow through the system:

```typescript
interface TrafficConfig {
  requestsPerSecond: number;          // 1 to 1,000,000
  pattern: 'constant' | 'sine-wave' | 'spike' | 'ramp' | 'random' | 'custom';
  spikeMultiplier?: number;           // For spike pattern: 10x, 50x, 100x
  distribution: 'uniform' | 'poisson' | 'normal';
  requestTypes: RequestType[];        // Mix of GET/POST/etc. with weights
}
```

Requests enter at "Client" nodes and flow through the system following edge connections. At each node, the request is processed according to the node's configuration:

- **Processing time**: Sampled from a distribution (normal with configured mean/stddev, or exponential)
- **Queue behavior**: If the node is busy, requests queue up. Queue depth is visible. If queue is full, requests are rejected (503).
- **Routing**: Load balancers route based on their configured algorithm. The routing is visualized with particles flowing to the selected backend.

### Queuing Theory Engine

Every node is modeled as a queuing system. The simulation uses **M/M/c** (Erlang-C) queuing model:

```
Key formulas:
- Utilization (ρ) = λ / (c × μ)     where λ=arrival rate, c=servers, μ=service rate
- Little's Law: L = λ × W            (avg items in system = arrival rate × avg time in system)
- Avg queue length: Lq = P_wait × ρ / (1 - ρ)
- Avg wait time: Wq = Lq / λ
```

These are computed in the WASM engine and fed back to the UI for real-time metric display.

### Real-Time Metrics Dashboard

The metrics panel shows live updating charts during simulation:

| Metric | Chart Type | Description |
|---|---|---|
| **Throughput** | Line chart (time series) | Requests/second processed at each node |
| **Latency** | Line chart with percentiles | p50, p90, p95, p99, p999 latency |
| **Error Rate** | Line chart | 4xx, 5xx errors as percentage |
| **Queue Depth** | Bar chart per node | Current items waiting in each queue |
| **Utilization** | Gauge per node | CPU/connection utilization percentage |
| **Cache Hit Rate** | Gauge | Percentage of cache hits vs misses |
| **Circuit Breaker** | State indicator | Open / Closed / Half-Open per node |
| **Connections** | Counter | Active / idle / total connections |

### Chaos Engineering Events (50+)

Grouped by category:

**Infrastructure Failures:**
- Node crash (instant termination)
- Node slow (increased processing time 5x-100x)
- Node restart (down for N seconds, then comes back)
- Disk full (storage writes fail)
- CPU spike (processing time increases)
- Memory pressure (OOM kills random processes)
- Instance termination (cloud provider kills the VM)

**Network Failures:**
- Network partition (split brain — selected nodes can't communicate)
- Latency injection (add N ms to all requests through a link)
- Packet loss (N% of requests dropped)
- DNS failure (name resolution fails)
- Bandwidth throttle (limit throughput to N MB/s)
- Connection reset (TCP RST on active connections)
- TLS certificate expiry (HTTPS connections fail)

**Data Failures:**
- Database primary failover (primary goes down, replica promotes)
- Replication lag (replicas fall behind by N seconds)
- Cache eviction storm (all cache entries expire simultaneously)
- Hot partition (one shard gets 90% of traffic)
- Data corruption (checksum mismatches)
- Deadlock (database transactions lock each other)

**Traffic Anomalies:**
- Traffic spike (10x, 50x, 100x normal traffic)
- Thundering herd (all clients retry simultaneously after outage)
- Retry storm (cascading retries amplify load)
- Slow consumer (one consumer falls behind on message queue)
- Hot key (one cache/DB key gets disproportionate traffic)
- DDoS (massive request volume from many sources)

**Dependency Failures:**
- Third-party API timeout (external service becomes slow)
- Third-party API down (external service returns errors)
- Certificate rotation failure (mutual TLS breaks)
- Config update error (bad configuration deployed)

Each chaos event has configurable parameters (duration, severity, target nodes) and can be scheduled or triggered manually.

## 4.4 Capacity Planning Calculator

Built-in back-of-envelope estimation tool. Given user-specified requirements, calculates:

```
Input:
  - Daily active users: 10M
  - Avg requests per user per day: 20
  - Peak to average ratio: 3x
  - Read:Write ratio: 80:20
  - Average request size: 2KB
  - Average response size: 10KB
  - Data retention: 5 years

Output:
  ├── Traffic: 2,300 req/s avg, 6,900 req/s peak
  ├── Bandwidth: 69 MB/s in, 23 MB/s out (peak)
  ├── Storage: 14.6 TB/year, 73 TB total (5yr)
  ├── Database: ~200K writes/s peak, ~800K reads/s peak
  ├── Cache: 80% hit rate → 160K reads/s to DB
  ├── Servers: ~35 app servers (at 200 req/s each)
  ├── Estimated monthly cost: $XX,XXX
  └── Recommended architecture: [auto-generated template]
```

Uses real-world latency numbers (updated for modern hardware):

```typescript
const LATENCY_NUMBERS = {
  l1CacheRef: 0.5,              // ns
  l2CacheRef: 7,                // ns
  mainMemoryRef: 100,           // ns
  ssdRandomRead: 16_000,        // ns (16 μs)
  ssdSequentialRead1MB: 49_000, // ns (49 μs)
  hddRandomRead: 2_000_000,    // ns (2 ms)
  hddSequentialRead1MB: 825_000,// ns (825 μs)
  sameDatacenterRoundtrip: 500_000,  // ns (0.5 ms)
  crossRegionRoundtrip: 50_000_000,  // ns (50 ms)  (US-East to EU-West)
  crossContinentRoundtrip: 150_000_000, // ns (150 ms) (US to Asia)
  redisGet: 200_000,            // ns (0.2 ms)
  postgresSimpleQuery: 1_000_000, // ns (1 ms)
  postgresComplexQuery: 50_000_000, // ns (50 ms)
  kafkaPublish: 5_000_000,      // ns (5 ms)
  s3GetObject: 50_000_000,      // ns (50 ms)
};
```

## 4.5 Template Library (55+ Real-World Architectures)

Each template is a pre-built diagram with nodes, edges, and simulation config:

**Tier 1 — Classic System Design Interview:**
1. URL Shortener (TinyURL) — Key generation, read-heavy cache, redirect flow
2. Twitter/X — Fanout-on-write vs fanout-on-read, timeline cache, Snowflake IDs
3. Instagram — Photo storage, feed ranking, sharding strategy
4. Netflix — CDN architecture, adaptive streaming, recommendation pipeline
5. Uber — Geospatial matching (S2 cells), surge pricing, trip state machine
6. WhatsApp — E2E encryption, offline queues, connection management
7. YouTube — Video processing pipeline, Vitess sharding, recommendation funnel
8. Google Search — Inverted index, PageRank, scatter-gather query
9. Amazon — Dynamo, Saga pattern, shopping cart availability
10. Slack — WebSocket gateway, presence service, permission-aware search

**Tier 2 — Modern Systems:**
11. Discord — Elixir gateway, ScyllaDB migration, voice SFU
12. Spotify — Collaborative filtering, audio analysis, Discover Weekly
13. Dropbox — Block-level sync, content-addressable storage, Magic Pocket
14. Zoom — SFU architecture, SVC video coding, bandwidth adaptation
15. TikTok — For You feed, multi-stage ranking, real-time features
16. Reddit — Hot ranking algorithm, Wilson score, comment trees

**Tier 3 — Infrastructure Components:**
17. Distributed Key-Value Store (Dynamo-style)
18. Message Queue (Kafka-style)
19. Rate Limiter (token bucket, sliding window, leaky bucket comparison)
20. Unique ID Generator (Snowflake)
21. Distributed Cache (Redis Cluster)
22. Load Balancer (algorithm comparison)
23. API Gateway
24. Search Engine (inverted index)
25. Typeahead/Autocomplete (Trie-based)
26. Web Crawler
27. Notification System
28. Payment System (Stripe-like)
29. File Storage (S3-like)
30. CI/CD Pipeline

**Tier 4 — Advanced Architectures:**
31-55. (additional templates: Ticket Booking, Hotel Reservation, Ad Serving, Stock Exchange, DNS System, Collaborative Editor, Gaming Backend, IoT Platform, Blockchain Exchange, Video Processing, Feature Flag System, Auth System, Workflow Engine, Time-Series Monitoring, Log Aggregation, and more)

Each template includes a "Learn" mode that walks through the architecture step-by-step with annotations explaining why each component exists and what trade-offs were made.

---

# PART 5: MODULE — ALGORITHM VISUALIZER

## 5.1 Architecture: Pre-Computed Step List

Every algorithm visualization follows the **action log** pattern:

```typescript
interface AnimationStep {
  id: number;
  description: string;           // Human-readable: "Compare arr[3] with arr[5]"
  pseudocodeLine: number;        // Which line of pseudocode to highlight
  mutations: VisualMutation[];   // What changes on screen
  complexity: {                  // Running complexity counters
    comparisons: number;
    swaps: number;
    reads: number;
    writes: number;
  };
  duration: number;              // Base duration at 1x speed (ms)
}

interface VisualMutation {
  targetId: string;              // Element ID (array index, tree node, graph vertex)
  property: 'fill' | 'position' | 'opacity' | 'label' | 'highlight' | 'scale';
  from: any;
  to: any;
  easing: 'spring' | 'ease-out' | 'linear';
}
```

The algorithm runs to completion **upfront**, recording every step. The playback controller then replays steps with configurable speed.

**Playback Controls:**
- Play / Pause (`Space`)
- Step Forward (`→`)
- Step Backward (`←`)
- Jump to Start / End (`Home` / `End`)
- Speed: 0.25x, 0.5x, 1x, 2x, 4x (`Shift+←` / `Shift+→`)
- Timeline scrubber (drag to any step)
- Step counter: "Step 14 of 47"

## 5.2 Algorithm Catalog (100+)

### Sorting (15)
Bubble Sort, Selection Sort, Insertion Sort, Shell Sort, Merge Sort, Quick Sort (Lomuto + Hoare), Heap Sort, Counting Sort, Radix Sort (LSD + MSD), Bucket Sort, Tim Sort, Cocktail Shaker Sort, Comb Sort, Pancake Sort, Bogo Sort (for fun)

**Visualization:** Array bars with color-coded states (comparing=blue, swapping=red, sorted=green, pivot=purple). Height proportional to value. Side panel shows pseudocode with current line highlighted. Complexity counters update in real-time.

**Side-by-side comparison mode:** Run two sorting algorithms on identical input simultaneously. Split canvas vertically. Both share the same speed control.

### Graph Algorithms (20+)
BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, A* Search, Topological Sort, Kruskal's MST, Prim's MST, Tarjan's SCC, Kosaraju's SCC, Articulation Points, Bridge Finding, Bipartite Check, Network Flow (Ford-Fulkerson, Edmonds-Karp, Dinic's), Bipartite Matching (Hopcroft-Karp), Euler Path/Circuit, Hamilton Path, Cycle Detection (Floyd's)

**Visualization:** Graph rendered with force-directed layout (D3-force). Nodes and edges colored by state (unvisited=gray, visiting=blue, visited=green, in-path=gold). Edge weights displayed. Discovery/finish times shown on nodes for DFS. Distance labels for shortest path algorithms. MST edges highlighted.

**Custom graph input:** Users can draw graphs by clicking to create nodes, dragging to create edges, and entering edge weights. Also supports random graph generation with configurable density.

### Tree Algorithms (15+)
Binary Search Tree (insert, delete, search), AVL Tree (with rotation visualization), Red-Black Tree, B-Tree, B+ Tree, Trie (prefix tree), Segment Tree (with lazy propagation), Fenwick Tree (Binary Indexed Tree), Heap operations (insert, extract, heapify), Huffman Coding, LCA (Lowest Common Ancestor), Tree Traversals (inorder, preorder, postorder, level-order), Binary Lifting

**Visualization:** Tree rendered with hierarchical layout. Rotations in AVL/Red-Black trees shown as smooth animated node movements. Node colors indicate tree-specific properties (red/black for RB-trees, balance factor for AVL). B-Tree shows node splitting with animation.

### Dynamic Programming (15+)
Fibonacci (naive vs memoized vs tabulated), Longest Common Subsequence, Longest Increasing Subsequence, Edit Distance (Levenshtein), Knapsack (0/1 and unbounded), Coin Change, Matrix Chain Multiplication, Longest Palindromic Subsequence, Rod Cutting, Subset Sum, Partition Problem, Shortest Common Supersequence, Maximum Subarray (Kadane's), Catalan Numbers, Egg Drop

**Visualization:** 2D DP table fills cell-by-cell with color intensity showing value. Arrows show which previous cells contributed to current cell. Recursion tree view shows the call graph with memoization pruning branches.

### String Algorithms (8+)
KMP (Knuth-Morris-Pratt), Rabin-Karp (rolling hash), Boyer-Moore, Z-Algorithm, Suffix Array Construction, Aho-Corasick, Longest Common Prefix Array, Manacher's (palindromes)

**Visualization:** Two-row character display showing text and pattern. Highlight matching/mismatching characters. Show the failure function / prefix table / hash values updating. Pointer arrows track position.

### Computational Geometry (5+)
Convex Hull (Graham Scan, Jarvis March), Line Intersection, Closest Pair of Points, Voronoi Diagram, Delaunay Triangulation

**Visualization:** 2D coordinate plane with points and lines. Animated sweep line for sweep-line algorithms. Hull vertices connected in order.

### Backtracking (5+)
N-Queens, Sudoku Solver, Knight's Tour, Hamiltonian Path, Subset Generation

**Visualization:** Grid/board shows placement attempts. Green for valid placements, red for conflicts. Backtrack shown as "undo" animation. Recursion tree shows decision tree being explored.

## 5.3 Code Panel Integration

The Monaco editor panel (bottom) shows the algorithm implementation in the user's preferred language (TypeScript, Python, Java, C++). The current executing line is highlighted in sync with the visualization step. Users can:

- **Read-only mode**: Watch the code execute alongside the visualization
- **Edit mode**: Modify the algorithm and re-run (changes reflected in visualization via the tracer API)
- **Language switch**: Same algorithm in multiple languages, synchronized

## 5.4 Complexity Analysis Panel

Live-updating complexity information:

```
┌─ Complexity Analysis ──────────────────────────┐
│ Algorithm: Quick Sort (Lomuto partition)        │
│                                                 │
│ Time Complexity:                                │
│   Best:    O(n log n)    Average: O(n log n)   │
│   Worst:   O(n²)                               │
│                                                 │
│ Space Complexity: O(log n) [recursion stack]    │
│                                                 │
│ Current Run (n=20):                             │
│   Comparisons: 47  │  Swaps: 12               │
│   Reads: 94        │  Writes: 24              │
│   Actual steps: 59 of estimated ~87            │
│                                                 │
│ [Bar chart comparing theoretical vs actual]     │
└─────────────────────────────────────────────────┘
```

---

# PART 6: MODULE — DATA STRUCTURE EXPLORER

## 6.1 Basic Data Structures (15)
Array, Linked List (singly, doubly, circular), Stack (array + linked list), Queue (array + linked list), Deque, Hash Table (separate chaining + open addressing with linear/quadratic/double hashing), Priority Queue, Circular Buffer

## 6.2 Tree Data Structures (12)
BST, AVL Tree, Red-Black Tree, B-Tree, B+ Tree, Trie, Segment Tree, Fenwick Tree (BIT), Splay Tree, Treap, Suffix Tree, van Emde Boas Tree

## 6.3 Advanced Data Structures (12)
Skip List, Bloom Filter, Count-Min Sketch, HyperLogLog, LSM Tree (LevelDB/RocksDB), Disjoint Set (Union-Find with path compression + union by rank), R-Tree, Quadtree, Rope (text editor data structure), Persistent Red-Black Tree, Fibonacci Heap, Binomial Heap

## 6.4 System Design Data Structures (6)
Consistent Hash Ring, Merkle Tree, CRDT (G-Counter, PN-Counter, LWW-Register, OR-Set), Vector Clock, Gossip Protocol state, Write-Ahead Log (WAL)

Each data structure supports: Insert, Delete, Search, and structure-specific operations. All operations are animated step-by-step with the same playback controls as algorithms.

**Special feature for Bloom Filter / Count-Min Sketch / HyperLogLog:** These probabilistic data structures show the false positive rate updating in real-time as elements are inserted, with a visual explanation of WHY false positives occur.

**Special feature for LSM Tree:** Shows the memtable → immutable memtable → SSTable compaction pipeline with animated data flow between levels.

---

# PART 7: MODULE — LOW-LEVEL DESIGN STUDIO

## 7.1 Diagram Types

**Class Diagram:**
- Drag-and-drop class creation with name, attributes (with visibility: +/-/#/~), and methods
- Relationships: inheritance, composition, aggregation, association, dependency, realization
- Cardinality labels on relationships
- Interface and abstract class annotations
- Generics support
- Namespace/package grouping

**Sequence Diagram:**
- Actors and objects on a timeline
- Synchronous/asynchronous messages
- Return messages
- Self-calls
- Combined fragments (alt, opt, loop, par, break, critical)
- Activation bars
- Notes

**State Machine Diagram:**
- States with entry/exit/do activities
- Transitions with guards and actions
- Nested states (composite states)
- Fork/join for parallel states
- History states

## 7.2 Design Patterns (23 GoF + Modern Patterns)

Each pattern has an interactive template:

**Creational (5):** Singleton, Factory Method, Abstract Factory, Builder, Prototype
**Structural (7):** Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
**Behavioral (11):** Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor, Interpreter

**Modern Patterns (10+):** Repository, Unit of Work, Dependency Injection, Event Sourcing, CQRS, Circuit Breaker, Saga, Outbox, Specification, Mediator (MediatR-style)

Each pattern template includes:
1. Interactive class diagram showing the pattern structure
2. Code implementation in TypeScript/Python/Java (togglable)
3. "Before/After" view showing the problem the pattern solves
4. Real-world usage examples (e.g., "Observer: React's useState, Event Emitters, Pub/Sub")

## 7.3 Bidirectional Code Generation

**Diagram → Code:**
Select a class diagram and export to TypeScript, Python, or Java. Generates class definitions with proper inheritance, interfaces, and method signatures.

**Code → Diagram:**
Paste TypeScript/Python/Java code into the editor. Parser extracts classes, interfaces, inheritance, and generates a class diagram automatically. Uses Tree-sitter for parsing.

## 7.4 SOLID Principles Interactive Explorer

Five interactive demonstrations, one for each principle:

1. **S — Single Responsibility:** Split a "God class" into focused classes. Before/after diagrams.
2. **O — Open/Closed:** Extend behavior via new classes without modifying existing ones. Add a new payment method to a payment processor.
3. **L — Liskov Substitution:** Show which substitutions break and which preserve behavior. Interactive "does this subclass work?" checker.
4. **I — Interface Segregation:** Split a fat interface into focused ones. Show which clients need which methods.
5. **D — Dependency Inversion:** Flip the dependency arrow. Show high-level modules depending on abstractions, not concretions.

## 7.5 LLD Problem Library (20+)

Pre-built LLD problems with solution templates:
Parking Lot, Elevator System, Chess Game, BookMyShow, Library Management, ATM, Vending Machine, Hotel Reservation, Restaurant Management, Snake & Ladder, Tic-Tac-Toe, File System, Logging Framework, Pub/Sub System, Task Scheduler, LRU Cache, Rate Limiter, Connection Pool, Thread Pool, Object Pool

---

# PART 8: MODULE — DATABASE DESIGN LAB

## 8.1 ER Diagram Builder
- Entities with attributes (PK, FK, NOT NULL, UNIQUE, composite, multivalued, derived)
- Relationships with cardinality (1:1, 1:N, M:N) and participation (total/partial)
- Both Chen notation (academic) and Crow's foot notation (industry) — toggle between them
- Weak entities and identifying relationships
- Auto-convert ER diagram to relational schema with proper FK mapping

## 8.2 Normalization Step-Through
Input a relation with functional dependencies. The tool:
1. Computes attribute closure
2. Finds candidate keys
3. Determines the current normal form (1NF, 2NF, 3NF, BCNF)
4. Step-by-step decomposition to the target normal form
5. Verifies lossless join and dependency preservation

## 8.3 SQL Query Execution Plan Visualizer
Paste a SQL query, the tool shows a visual execution plan tree:
- Sequential Scan, Index Scan, Index Only Scan
- Hash Join, Merge Join, Nested Loop Join
- Sort, Aggregate, Group By
- Materialize, CTE Scan
- Cost estimates at each node
- Color-coded by relative cost (red = expensive, green = cheap)

## 8.4 Index Visualization
- **B-Tree Index:** Interactive B-Tree with configurable order. Insert/delete/search operations animated. Shows page splits and merges.
- **B+ Tree Index:** Shows leaf-level linked list for range queries. Demonstrates why B+ Trees are preferred for databases.
- **Hash Index:** Shows hash function mapping keys to buckets. Demonstrates collision resolution.
- **LSM-Tree Index:** Shows memtable → SSTable compaction pipeline. Demonstrates write-optimized vs read-optimized trade-offs.

## 8.5 Transaction Isolation Level Demos
Interactive demonstrations of each isolation level:
- **Read Uncommitted:** Dirty read demonstration
- **Read Committed:** Non-repeatable read demonstration
- **Repeatable Read:** Phantom read demonstration
- **Serializable:** Full isolation demonstration

Two concurrent transactions visualized side-by-side, showing exactly when reads see which values.

---

# PART 9: MODULE — DISTRIBUTED SYSTEMS PLAYGROUND

## 9.1 Raft Consensus (Full Interactive Sandbox)
- Configurable cluster size (3, 5, 7 nodes)
- Node states: Follower, Candidate, Leader (color-coded)
- **Leader Election:** Visualize election timeout, RequestVote RPCs, term numbers, split vote scenario
- **Log Replication:** Client requests → leader appends → AppendEntries RPC → follower commit → apply to state machine
- **Failure Scenarios:** Kill leader (watch re-election), network partition (split brain), slow follower (log catch-up)
- Message animation: RPCs shown as animated arrows between nodes with term/index labels
- All node states, logs, and terms visible simultaneously
- Step-by-step mode or real-time with adjustable speed

## 9.2 Paxos (Basic and Multi-Paxos)
- Proposer, Acceptor, Learner roles visualized
- Prepare/Promise/Accept/Accepted message flow
- Competing proposers scenario
- Comparison panel: Raft vs Paxos side-by-side on same scenario

## 9.3 Consistent Hashing Ring
- Visual hash ring (0 to 2^32)
- Add/remove physical nodes — watch key redistribution
- Virtual nodes: toggle on/off, configurable count per physical node
- Show load distribution histogram
- Add 100/1000 keys and see distribution uniformity
- Demonstrate why virtual nodes improve balance

## 9.4 Vector Clocks
- N processes with independent clocks
- Send/receive events visualized on a space-time diagram
- Clock values update on send/receive/local events
- Concurrent vs causally-related events highlighted
- "Happened-before" relationship arrows

## 9.5 Lamport Timestamps
- Similar to vector clocks but with scalar timestamps
- Show limitations compared to vector clocks
- Demonstrate that Lamport timestamps can't detect concurrency

## 9.6 Gossip Protocol
- N-node cluster on a 2D plane
- Epidemic spread visualization: one node gets new info, watch it spread
- Configurable: fanout (number of peers to gossip to), interval, failure detection
- Show convergence time and message complexity
- Anti-entropy vs rumor mongering comparison

## 9.7 CAP Theorem Explorer
- Interactive 3-node cluster with a database
- Toggle: Consistency, Availability, Partition Tolerance
- Inject a network partition
- Show what happens under CP (reject writes on minority partition) vs AP (accept writes, diverge)
- Demonstrate eventual consistency with conflict resolution
- Real-world examples: "CP = Zookeeper/etcd, AP = Cassandra/DynamoDB, CA = single-node Postgres (no partition tolerance)"

## 9.8 CRDTs (Conflict-free Replicated Data Types)
- G-Counter: Increment-only counter across replicas
- PN-Counter: Increment/decrement counter
- LWW-Register: Last-writer-wins with timestamps
- OR-Set: Observed-remove set
- Show merge operations between replicas
- Demonstrate eventual convergence without coordination

## 9.9 Two-Phase Commit & Saga Pattern
- **2PC:** Coordinator sends Prepare → participants vote → Commit/Abort. Show blocking on coordinator failure.
- **Saga (Choreography):** Events trigger next step. Show compensation on failure.
- **Saga (Orchestration):** Central orchestrator coordinates steps. Show compensation flow.
- Compare 2PC vs Saga trade-offs interactively.

## 9.10 MapReduce Visualization
- Input data split into chunks
- Map phase: parallel processing with animated data flow
- Shuffle phase: group by key
- Reduce phase: aggregate results
- Show word count example with real data

---

# PART 10: MODULE — OS CONCEPTS SIMULATOR

## 10.1 Process Scheduling
Algorithms: FCFS, SJF (preemptive + non-preemptive), Round Robin (configurable quantum), Priority (preemptive + non-preemptive), Multilevel Feedback Queue (MLFQ)

Visualization: Gantt chart showing CPU allocation over time. Process table with arrival time, burst time, priority, wait time, turnaround time, response time. Comparison mode: run two algorithms on same process set.

## 10.2 Page Replacement
Algorithms: FIFO, LRU, Optimal, Clock (Second Chance), LFU

Visualization: Page frame table showing which pages are in memory. Reference string input. Step-by-step replacement decisions. Page fault counter. Hit/miss rate.

## 10.3 Deadlock Detection & Prevention
- Resource Allocation Graph with processes and resources
- Cycle detection visualization (highlight the cycle)
- Banker's Algorithm step-through (safety algorithm)
- Need/Max/Allocation matrix visualization

## 10.4 Memory Management
- **Paging:** Virtual to physical address translation, page table visualization, TLB
- **Segmentation:** Segment table, segment + offset → physical address
- **Virtual Memory:** Page fault handling, demand paging, working set

## 10.5 Thread Synchronization
- **Mutex:** Lock/unlock visualization with critical section
- **Semaphore:** Counter-based, wait queue visualization
- **Monitor:** Condition variables, signal/wait
- **Reader-Writer Lock:** Multiple readers or single writer

Classic Problems (animated):
- Producer-Consumer (bounded buffer)
- Dining Philosophers
- Readers-Writers
- Sleeping Barber

---

# PART 11: MODULE — NETWORKING & PROTOCOLS

## 11.1 TCP Handshake & Connection Lifecycle
- 3-way handshake (SYN, SYN-ACK, ACK) with sequence numbers
- Data transfer with sliding window
- Connection teardown (FIN, FIN-ACK, FIN, ACK)
- Show: congestion window, retransmission on packet loss, fast retransmit
- States: LISTEN, SYN-SENT, SYN-RECEIVED, ESTABLISHED, FIN-WAIT-1/2, TIME-WAIT, CLOSED

## 11.2 TLS 1.3 Handshake
- ClientHello → ServerHello + EncryptedExtensions + Certificate + CertificateVerify + Finished → Finished
- Show 1-RTT vs 0-RTT (PSK resumption)
- Key derivation visualization (HKDF)
- Compare with TLS 1.2 (additional round trips)

## 11.3 HTTP Version Comparison
Side-by-side visualization of the same page load over:
- **HTTP/1.1:** Sequential requests, head-of-line blocking, connection limits
- **HTTP/2:** Multiplexed streams, header compression (HPACK), server push
- **HTTP/3 (QUIC):** UDP-based, 0-RTT connection, no head-of-line blocking across streams

## 11.4 DNS Resolution Flow
- Stub resolver → Recursive resolver → Root nameserver → TLD nameserver → Authoritative nameserver
- Show caching at each level with TTL
- DNSSEC validation chain visualization

## 11.5 WebSocket Lifecycle
- HTTP upgrade handshake
- Bidirectional frame flow
- Ping/pong heartbeat
- Close handshake
- Compare with: Server-Sent Events, Long Polling, gRPC streaming

## 11.6 gRPC vs REST vs GraphQL
Same operation (e.g., "Get user with posts") shown in all three:
- REST: Multiple requests (GET /user/1, GET /user/1/posts) — show waterfall
- GraphQL: Single request with nested query — show exact data returned
- gRPC: Protocol Buffers serialization, HTTP/2 multiplexing — show binary efficiency
- Compare: payload size, latency, number of round trips

## 11.7 CDN Request Flow
- Client → DNS (CNAME to CDN) → Edge POP → (cache hit?) → Origin
- Show: cache hit vs cache miss paths, TTL expiration, cache invalidation
- Geographic map view showing edge locations

## 11.8 CORS Flow Simulator
- Configure: origin, method, headers, credentials
- Show: is preflight needed? → OPTIONS request → actual request
- Highlight which headers matter: Access-Control-Allow-Origin, -Methods, -Headers, -Credentials
- Common error scenarios with clear explanations

---

# PART 12: MODULE — CONCURRENCY LAB

## 12.1 Thread Lifecycle Visualization
- Thread states: New, Runnable, Running, Blocked, Waiting, Timed-Waiting, Terminated
- Timeline view showing state transitions
- Multiple threads with context switching visualization

## 12.2 Race Condition Demonstrator
- Two threads incrementing a shared counter
- Show interleaved execution leading to wrong result
- Then show fix with mutex/atomic operations
- Step through interleavings manually

## 12.3 Async/Await Execution Flow (Modern Loupe)
- Extends Philip Roberts' Loupe concept to modern JavaScript
- Call stack, Microtask queue (Promises), Macrotask queue (setTimeout), Web API panel
- Paste async code, watch execution flow step-by-step
- Show why `await` suspends execution and how the event loop picks up

## 12.4 Go Goroutine Visualization
- Multiple goroutines on a timeline
- Channel communication with animated message passing
- Select statement with multiple channels
- Deadlock detection and visualization
- WaitGroup synchronization

---

# PART 13: MODULE — SECURITY & CRYPTOGRAPHY

## 13.1 OAuth 2.0 / OIDC Flow Visualizer
- Authorization Code + PKCE (the recommended flow)
- Client Credentials
- Device Authorization
- Interactive: configure client, scopes, redirect URI. Step through each HTTP request/response.
- Show token exchange, refresh token rotation

## 13.2 JWT Lifecycle
- Token creation: Header + Payload + Signature (color-coded like jwt.io)
- Token validation flow: decode → verify signature → check claims (exp, iss, aud)
- Token refresh flow: access token expires → use refresh token → new access token
- Common attacks: none algorithm, token replay, JWT confusion

## 13.3 AES Encryption Rounds
- Step-by-step visualization of AES-128:
- SubBytes (S-box substitution)
- ShiftRows
- MixColumns (Galois field multiplication)
- AddRoundKey
- Show state matrix transforming through all 10 rounds

## 13.4 Diffie-Hellman Key Exchange
- Both the "paint mixing" analogy and the mathematical computation
- Show how two parties arrive at the same shared secret
- Demonstrate why an eavesdropper can't compute the secret

## 13.5 CORS Flow Simulator
(Same as Networking module — cross-linked)

## 13.6 HTTPS Full Flow
End-to-end: DNS → TCP handshake → TLS handshake → HTTP request → Response → Close
Show every step with timing

---

# PART 14: MODULE — ML SYSTEM DESIGN

## 14.1 TensorFlow Playground (Enhanced)
- Interactive neural network in the browser
- Configurable: layers (1-8), neurons (1-16), activation functions, learning rate, regularization
- Datasets: circle, XOR, Gaussian, spiral, custom drawing
- **Enhancements over TF Playground:**
  - CNN layer type (2D convolution on image datasets)
  - Dropout visualization (randomly grayed-out neurons)
  - Batch normalization
  - Loss landscape 3D visualization
  - Training history chart (loss/accuracy over epochs)
  - Export model architecture diagram

## 14.2 ML Pipeline Builder
- Drag-and-drop pipeline stages: Data Ingestion → Feature Engineering → Training → Evaluation → Serving
- Each stage configurable with real parameters
- Show data flow between stages with sample data
- Template: Spotify recommendation pipeline, TikTok ranking pipeline

## 14.3 Feature Store Architecture
- Online store (Redis/DynamoDB) for real-time serving
- Offline store (S3/BigQuery) for batch training
- Feature computation pipeline
- Point-in-time correctness visualization

## 14.4 Model Serving Patterns
- Single model serving
- A/B testing (traffic split visualization)
- Shadow mode (duplicate traffic)
- Canary deployment (gradual rollout)
- Multi-armed bandit (explore/exploit visualization)
- Ensemble (multiple models → aggregator)

## 14.5 A/B Testing System Design
- User assignment (consistent hashing)
- Event collection pipeline
- Statistical analysis (show sample size calculator, significance testing)
- Guardrail metrics

---

# PART 15: MODULE — INTERVIEW ENGINE

## 15.1 Challenge Mode

Users pick a challenge (or get one assigned by difficulty):

```
┌─ System Design Challenge ───────────────────────┐
│                                                  │
│  Design a URL Shortener (like TinyURL)          │
│  Difficulty: ★★☆☆☆  |  Time: 35 minutes        │
│                                                  │
│  Requirements:                                   │
│  - Shorten long URLs to 7-character codes        │
│  - Redirect short URLs to original              │
│  - 100M URLs created per day                    │
│  - 10:1 read-to-write ratio                    │
│  - URLs expire after 5 years                    │
│                                                  │
│  Your approach should cover:                     │
│  □ API Design                                    │
│  □ Data Model                                    │
│  □ High-Level Architecture                       │
│  □ Deep Dive (pick one: scaling, caching, or    │
│    key generation)                               │
│                                                  │
│  ┌────────────┐  ┌────────────┐                │
│  │ Start Timer │  │ Get Hint   │                │
│  └────────────┘  └────────────┘                │
└──────────────────────────────────────────────────┘
```

The timer counts down. The user designs on the canvas. They can request hints (costs points). When done, they submit for AI evaluation.

## 15.2 AI-Powered Evaluation

When the user submits their design, it is serialized to a structured format (nodes, edges, configurations) and sent to an LLM (Claude API) with a scoring rubric:

**Scoring Dimensions (out of 10 each):**
1. **Functional Requirements Coverage** — Did the design address all stated requirements?
2. **API Design** — Are the APIs well-designed? Proper methods, parameters, error handling?
3. **Data Model** — Is the schema appropriate? Proper keys, indexes, relationships?
4. **Scalability** — Can the design handle the stated load? Are bottlenecks addressed?
5. **Reliability** — What happens when components fail? Is there redundancy?
6. **Trade-off Awareness** — Did the user discuss alternatives and explain choices?

**AI Feedback includes:**
- Score per dimension with explanation
- Specific suggestions for improvement
- Comparison with the reference architecture (template)
- "What an interviewer would ask next" — follow-up questions

## 15.3 Spaced Repetition (FSRS Algorithm)

After completing challenges, concepts are tracked with the FSRS (Free Spaced Repetition Scheduler) algorithm:

- Each concept (e.g., "consistent hashing", "database sharding", "circuit breaker") has a memory state
- Concepts are scheduled for review based on predicted forgetting
- Review can be: quick flashcard quiz, mini-challenge, or full design exercise
- Dashboard shows: mastery level per topic, upcoming reviews, streak

## 15.4 Progressive Difficulty

Challenges scale from simple to complex:

| Level | Example | Nodes | Time |
|---|---|---|---|
| 1 (Beginner) | Design a cache | 3-5 | 15 min |
| 2 (Easy) | Design a URL shortener | 5-8 | 25 min |
| 3 (Medium) | Design Twitter's newsfeed | 8-12 | 35 min |
| 4 (Hard) | Design Uber's dispatch system | 12-20 | 45 min |
| 5 (Expert) | Design Google Search | 20+ | 60 min |

The system adapts based on performance — if you ace Level 3 challenges, it pushes you to Level 4.

## 15.5 Gamification

- **Streak system:** Design something every day. 7-day, 30-day, 100-day streak badges.
- **XP and levels:** Earn XP for completing challenges, reviewing concepts, sharing designs.
- **Achievements:** "First System Design", "Chaos Master" (survive 10 chaos events), "Pattern Expert" (use all 23 GoF patterns), "Speed Demon" (complete hard challenge in under 30 min).
- **Leaderboard:** Optional weekly leaderboard by total score.
- **Learning path progress:** Visual roadmap showing completed vs remaining topics per module.

---

# PART 16: AI INTEGRATION

## 16.1 AI Design Reviewer
After designing an architecture, click "Get AI Review." The system serializes the diagram (nodes, edges, configs, metrics) and sends to Claude API with the prompt:
- Identify bottlenecks and single points of failure
- Suggest missing components (e.g., "no caching layer detected")
- Flag anti-patterns (e.g., "synchronous chain of 5 services")
- Estimate capacity and identify which component saturates first

## 16.2 AI Socratic Tutor
During interview mode, users can ask the AI questions. Instead of giving answers directly, the AI uses the Socratic method:
- "What would happen if your database receives 10x the expected writes?"
- "Have you considered what happens during a network partition between your cache and database?"
- "Why did you choose this over [alternative]?"

## 16.3 AI Architecture Generator
Users can describe a system in natural language: "Design a real-time chat application that supports 1M concurrent users with E2E encryption, read receipts, and group messaging."

The AI generates an initial architecture diagram (nodes + edges + configurations) as a starting point that the user can then refine.

## 16.4 AI Hint System
During interview challenges, hints are delivered progressively:
- **Hint 1** (free): "Think about how to generate unique short codes"
- **Hint 2** (-5 points): "Consider a base62 encoding approach"
- **Hint 3** (-10 points): "Use a counter service with range allocation to avoid collisions"

---

# PART 17: COLLABORATION & SHARING

## 17.1 Real-Time Multiplayer
Built on **Yjs** CRDT framework:
- **y-webrtc** for peer-to-peer sync (no server needed for 2-20 users)
- **y-indexeddb** for offline persistence
- Awareness protocol for live cursors and user presence
- Each user gets a colored cursor with their name

## 17.2 Shareable Links
- **Small diagrams (< 30 nodes):** State compressed with `lz-string` into URL hash. No server needed.
- **Large diagrams:** Encrypted with AES-GCM (Web Crypto API), uploaded to storage, encryption key in URL fragment (never sent to server — Excalidraw model).

## 17.3 Export Formats
- PNG, SVG (via html-to-image / SnapDOM)
- PDF (via jsPDF)
- Mermaid code (custom serializer)
- PlantUML code (custom serializer)
- draw.io XML (mxGraphModel format)
- Terraform HCL (for system design diagrams)
- JSON (React Flow toObject())
- TypeScript/Python/Java (from LLD class diagrams)
- GIF recording (via MediaRecorder API on canvas)

## 17.4 Embeddable Widget
- `/embed/[id]` route serves a read-only interactive viewer
- Embeddable via `<iframe>` with PostMessage API for theme/config
- Web Component wrapper via `@r2wc/react-to-web-component`
- oEmbed provider for auto-expansion in Slack/Notion/Medium

---

# PART 18: ACCESSIBILITY

## 18.1 Screen Reader Support
- Every diagram has a text-based alternative: "System architecture with 12 nodes. API Gateway connects to Auth Service and User Service..."
- `aria-live="polite"` region announces all state changes
- `role="application"` on canvas with full custom keyboard handling
- Node list sidebar provides flat, navigable alternative to spatial canvas

## 18.2 Keyboard Navigation
- Spatial navigation between nodes using arrow keys (find nearest node in direction)
- `Tab` moves between regions (toolbar → canvas → sidebar → properties)
- `Enter` selects/activates, `Escape` deselects/closes
- All drag operations have keyboard alternatives (select → "Move" mode → arrow keys → Enter to confirm)
- WCAG 2.2 §2.5.7 compliance: every drag has a non-drag alternative

## 18.3 Visual Accessibility
- Colorblind-safe palette option (IBM Design / Wong palette)
- `prefers-reduced-motion`: disables all animations, instant transitions
- `prefers-contrast: more`: high-contrast theme with bold borders
- `forced-colors`: Windows High Contrast Mode support
- Minimum 4.5:1 contrast ratio for all text (WCAG AA)
- Focus indicators: 2px solid ring, high contrast, always visible on keyboard navigation

---

# PART 19: TESTING STRATEGY

## 19.1 Test Pyramid
- **Unit tests (60%):** Vitest — Zustand stores, algorithm step generators, simulation math, utility functions, WASM module mocks
- **Component tests (25%):** Vitest + React Testing Library — Custom nodes, panels, toolbars (wrapped in `ReactFlowProvider`)
- **Visual regression + E2E (15%):** Playwright — Full diagram rendering, interaction flows, export verification, cross-browser

## 19.2 Key Test Patterns
- Fresh Zustand store per test via factory function
- React Flow components wrapped in `ReactFlowProvider` with fixed dimensions
- Web Worker logic extracted into pure functions for direct unit testing
- `ResizeObserver` and `IntersectionObserver` mocked in setup
- Canvas context mocked for Canvas 2D layer tests
- Storybook for component catalog + interaction testing (play functions)

## 19.3 CI/CD Pipeline
GitHub Actions workflow: lint → typecheck → unit tests → WASM build (Rust) → Next.js build → Playwright E2E → bundle size check. Playwright visual snapshots committed to repo. Bundle size checked on every PR via `size-limit`.

---

# PART 20: DEPLOYMENT

## 20.1 Web (Primary)
- **Vercel** for zero-config Next.js deployment with preview deploys per PR
- OR **Docker** multi-stage build (Rust WASM → Node.js → production runner) for self-hosting
- WASM files served with `Content-Type: application/wasm` and long cache headers

## 20.2 PWA / Offline
- `@ducanh2912/next-pwa` with Workbox caching strategies
- App shell precached, WASM cached with CacheFirst strategy
- User diagrams persisted in IndexedDB (Dexie.js)
- Full offline functionality — all simulations run client-side

## 20.3 Desktop (Optional)
- **Tauri v2** (not Electron) — 5-15MB binary vs 150-300MB
- Rust backend for native file system access
- Same Next.js frontend served by Tauri's WebView
- Cross-platform: macOS, Windows, Linux

---

# PART 21: IMPLEMENTATION ROADMAP — FULL V3 BUILD

> **Building the complete platform from day 1.** All 12 modules, WASM engine, collaboration, desktop app, full export, AI integration. No compromises.

## Phase 1: Core Platform + Infrastructure (Weeks 1-4)
- Next.js 16 project setup with TypeScript strict, Tailwind v4, shadcn/ui
- VS Code-style layout shell with `react-resizable-panels` (sidebar + main + properties + bottom)
- React Flow canvas with pan/zoom/select + Adapter pattern (abstract model from ReactFlowNode)
- Command palette (`cmdk`) with context-aware commands
- Design system implementation from `research/22-architex-design-system.md` (all tokens, colors, typography)
- Theme system (dark/light) + colorblind-safe palette option
- Zustand stores with command bus pattern + `zundo` undo/redo (6 atomic stores)
- IndexedDB persistence (`Dexie.js`) behind repository abstraction
- Clerk auth setup (with `requireAuth()` on every server boundary — CVE-2025-29927 safe)
- Neon database + Drizzle ORM schema (all 20 tables from `src/db/schema/`)
- Inngest for background jobs
- PWA setup (`@ducanh2912/next-pwa`)
- Rust WASM engine scaffolding (wasm-pack + Comlink + Worker pool + feature chunk splitting)
- `SimulationCommand`/`SimulationSnapshot`/`SimulationEvent` interface contracts
- CI/CD: GitHub Actions (lint → typecheck → unit tests → WASM build → Next.js build → E2E → bundle size)
- PostHog Cloud analytics + Sentry error tracking

## Phase 2: System Design Simulator — Complete (Weeks 5-9)
- All 60+ system design components (compute, storage, messaging, networking, security, observability)
- All edge types with animated connections (dash-offset + particle flow via Canvas overlay)
- Properties panel with node configuration
- WASM simulation engine: queuing theory (M/M/1, M/M/c, M/G/1), traffic modeling, backpressure
- Real-time metrics dashboard (throughput, latency percentiles, error rate, queue depth, utilization, cache hit rate)
- All 50+ chaos engineering events (infrastructure failures, network failures, data failures, traffic anomalies)
- Capacity planning calculator with real-world latency/throughput numbers from `research/21-benchmarks-real-world-numbers.md`
- Cost estimation engine (AWS/GCP/Azure pricing per component)
- 30 system design templates (Tier 1 + Tier 2 from case studies)
- Export: JSON, PNG, SVG, PDF, Mermaid, PlantUML
- Simulation playback: play/pause/step/speed/timeline scrubber

## Phase 3: Algorithm Visualizer + Data Structures (Weeks 10-14)
- Algorithm step generator framework (pre-computed step list + playback controller)
- WASM-powered algorithm execution for all 100+ algorithms
- Sorting (15), Graph (20+), Tree (15+), DP (15+), String (8+), Geometry (5+), Backtracking (5+)
- Data Structure Explorer: all 45+ structures (basic + tree + advanced + system design)
- Monaco code panel with line highlighting + language switching (TS, Python, Java, C++)
- Complexity analysis panel (live Big-O counter)
- Side-by-side comparison mode (two algorithms on identical input)
- Custom input support for every algorithm and data structure

## Phase 4: LLD + Database + Distributed Systems (Weeks 15-19)
- LLD Studio: Class diagrams, sequence diagrams, state machine diagrams
- Design patterns library (23 GoF + modern patterns) with interactive templates
- Bidirectional code generation (diagram ↔ TypeScript/Python/Java)
- SOLID principles interactive explorer
- 20 LLD problems (Parking Lot, Elevator, Chess, etc.)
- Database Lab: ER diagram builder (Chen + Crow's foot notation)
- Normalization step-through (1NF → BCNF)
- SQL query execution plan visualizer
- B-Tree, B+ Tree, LSM-Tree, Hash index visualization
- Transaction isolation level demos (dirty read, phantom read)
- Distributed Systems Playground: Raft consensus full sandbox, Paxos, consistent hashing ring
- Vector clocks, Lamport timestamps, gossip protocol, CAP theorem explorer, CRDTs
- Two-Phase Commit vs Saga comparison, MapReduce visualization

## Phase 5: Networking + OS + Concurrency + Security + ML (Weeks 20-24)
- Networking: TCP handshake, TLS 1.3, HTTP/1.1 vs 2 vs 3, DNS, WebSocket, gRPC vs REST vs GraphQL, CDN, CORS
- OS: Process scheduling (FCFS, SJF, RR, Priority, MLFQ), page replacement, deadlock detection, memory management, thread sync
- Concurrency: Thread visualization, race conditions, async/await (modern Loupe), producer-consumer, dining philosophers, Go goroutines
- Security: OAuth 2.0/OIDC flows, JWT lifecycle, AES rounds, Diffie-Hellman, CORS simulator
- ML System Design: Enhanced TF Playground (CNN, dropout, batch norm), ML pipeline builder, feature store, model serving patterns, A/B testing system
- All with WASM-powered simulations and full playback controls

## Phase 6: Interview Engine + AI Integration (Weeks 25-28)
- Challenge mode with timer for all 200+ problems across all modules
- AI evaluation via Claude API (Sonnet for review, Haiku for hints)
- Scoring rubrics (6 dimensions) with AI-generated feedback
- Progressive hint system (3 tiers: nudge → guided → explanation)
- AI Socratic tutor for interview mode
- AI architecture generator (natural language → diagram)
- AI design reviewer (identifies bottlenecks, missing components, anti-patterns)
- Spaced repetition (FSRS algorithm) across all concepts
- Progressive difficulty (Level 1-5)
- Full gamification: XP, levels, streaks, achievements, badges, leaderboard
- 55+ templates total (all tiers from case studies)

## Phase 7: Collaboration + Community + Sharing (Weeks 29-32)
- Yjs real-time collaboration via PartyKit (WebSocket relay with JWT auth)
- Live cursors, user presence, selection rings, follow mode
- Shareable links (lz-string for small, AES-GCM encrypted blob for large)
- Community gallery with public profiles, upvotes, comments, fork/remix
- Activity feed, GitHub-style contribution heatmap
- OG image generation for social sharing
- oEmbed provider for Slack/Notion auto-expand
- Web Component embed (`<system-diagram>`)
- Email system: welcome drip (5 emails), weekly digest, SRS reminders, re-engagement
- Notification center: in-app + email + push with anti-spam rate limits

## Phase 8: Desktop + Polish + Export + Search (Weeks 33-36)
- Tauri v2 desktop app (macOS, Windows, Linux) — 5-15MB binary
- Full export suite: JSON, PNG, SVG, PDF, Mermaid, PlantUML, draw.io XML, Terraform HCL, code gen
- FlexSearch client-side search → Meilisearch cloud search
- Plugin architecture (iframe sandbox with postMessage API + permissions)
- Multi-region architecture visualization (world map view)
- Sound design system (Web Audio API, OFF by default)
- Micro-interactions: hover glow, drag spring physics, celebration confetti, skeleton loading
- VS Code extension, Chrome extension ("Architex Clipper"), GitHub Action, Slack bot

## Phase 9: Landing Page + SEO + Launch (Weeks 37-38)
- Landing page from `research/22-landing-page-design.md` blueprint
- 270+ programmatic SEO pages (problems, concepts, patterns)
- Onboarding flow (interactive tutorial — build URL shortener in 90 seconds)
- Documentation site
- Blog with 5 seed articles + embedded interactive simulations
- Newsletter setup ("The Architect's Digest")
- Product Hunt + Hacker News launch preparation
- AGPL-3.0 open-source repo with README, CONTRIBUTING.md, issue templates

## Phase 10: Accessibility + Performance + Enterprise (Weeks 39-42)
- Full WCAG 2.2 AA audit and fixes (keyboard navigation, screen reader, reduced motion, high contrast)
- Performance optimization: all targets from `docs/plans/performance-optimization-strategy.md`
- Lighthouse CI enforcement (block merge below 90)
- Bundle size monitoring (`size-limit`)
- Security audit: all 29 vulnerabilities from `research/43-security-threat-model.md`
- Team tier features (shared workspaces, dashboards, custom learning paths, SSO)
- Enterprise features (custom content, skills assessment, LMS integration)
- Self-hosted Docker deployment option
- Pricing page live with Stripe integration
- Pro + Team + Enterprise tiers active

---

# APPENDIX A: REAL-WORLD NUMBERS FOR REALISTIC SIMULATION

```typescript
// Constants that make our simulator credible

export const LATENCY = {
  // Storage
  L1_CACHE: 0.5,                    // ns
  L2_CACHE: 7,                      // ns
  MAIN_MEMORY: 100,                 // ns
  SSD_RANDOM_READ: 16,              // μs
  SSD_SEQ_READ_1MB: 49,             // μs
  HDD_RANDOM_READ: 2000,            // μs (2ms)
  HDD_SEQ_READ_1MB: 825,            // μs

  // Network
  SAME_DATACENTER: 500,             // μs (0.5ms)
  CROSS_REGION: 50_000,             // μs (50ms)
  CROSS_CONTINENT: 150_000,         // μs (150ms)

  // Services
  REDIS_GET: 200,                   // μs (0.2ms)
  MEMCACHED_GET: 150,               // μs
  POSTGRES_SIMPLE: 1000,            // μs (1ms)
  POSTGRES_COMPLEX: 50_000,         // μs (50ms)
  MYSQL_SIMPLE: 800,                // μs
  ELASTICSEARCH_QUERY: 10_000,      // μs (10ms)
  KAFKA_PUBLISH: 5000,              // μs (5ms)
  S3_GET: 50_000,                   // μs (50ms)
  LAMBDA_COLD_START: 200_000,       // μs (200ms)
  CDN_EDGE_HIT: 10_000,            // μs (10ms)
};

export const THROUGHPUT = {
  NGINX_RPS: 50_000,               // req/s per instance
  NODE_EXPRESS_RPS: 15_000,         // req/s per instance
  GO_HTTP_RPS: 50_000,             // req/s per instance
  REDIS_OPS: 100_000,              // ops/s per instance
  POSTGRES_TPS: 10_000,            // transactions/s
  MYSQL_TPS: 10_000,               // transactions/s
  KAFKA_MSGS: 1_000_000,           // messages/s per partition
  ELASTICSEARCH_QPS: 5_000,        // queries/s per node
};

export const REAL_WORLD = {
  TWITTER_TWEETS_PER_DAY: 500_000_000,
  GOOGLE_SEARCHES_PER_DAY: 8_500_000_000,
  NETFLIX_CONCURRENT_STREAMS: 15_000_000,
  WHATSAPP_MESSAGES_PER_DAY: 100_000_000_000,
  YOUTUBE_UPLOADS_PER_MINUTE: 500,     // hours of video
  INSTAGRAM_PHOTOS_PER_DAY: 100_000_000,
  UBER_TRIPS_PER_DAY: 25_000_000,
  SPOTIFY_DAILY_ACTIVE_USERS: 200_000_000,
};
```

---

# APPENDIX B: COMPONENT ICON STYLE GUIDE

All component icons follow a consistent style:
- **Size:** 40x40px within a 48x48px bounding box
- **Style:** Outlined (not filled), 2px stroke, rounded line caps
- **Color:** Follows the node type color scheme (compute=blue, storage=green, messaging=orange, networking=purple)
- **Source:** Custom SVG icons in `/public/icons/`. Use Lucide icons as base where possible.

---

# APPENDIX C: ANIMATION SPECIFICATIONS

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Node appear | 200ms | ease-out + scale 0.8→1 | With fade-in |
| Node disappear | 150ms | ease-in + scale 1→0.9 | With fade-out |
| Node move (drag) | spring(300, 30) | spring | Snappy, minimal wobble |
| Node move (layout) | spring(120, 20) | spring | Softer, visible settle |
| Edge appear | 300ms | ease-out | Stroke-dashoffset from full to 0 |
| Particle flow | linear | linear | Constant speed along path |
| State change (color) | 300ms | ease-out | Smooth color transition |
| Panel open/close | 200ms | ease-in-out | Width/height transition |
| Tooltip appear | 100ms | ease-out | Opacity + translateY(-4px) |
| Stagger delay | 40ms | — | Between sequential node animations |

All animations respect `prefers-reduced-motion: reduce` → duration becomes 0ms.

---

# FINAL NOTES

This specification covers EVERY aspect of building Architex. It is designed to be implemented incrementally — each phase produces a working, shippable product that gets progressively more powerful.

**Key principles to maintain throughout development:**
1. Performance first — 60fps for canvas interactions, always
2. Offline-first — everything works without internet
3. Accessibility isn't optional — build it in from day one
4. Real simulations — queuing theory, not toy animations
5. Keyboard-first — every action reachable without a mouse
6. The tool should teach, not just display — every visualization should increase understanding

Build this, and you will have created the most comprehensive engineering learning and design platform ever made.

---

# PART 22: BACKEND ARCHITECTURE

## 22.1 Database: Neon Serverless Postgres + Drizzle ORM

**Why Neon:** True serverless (scale-to-zero), HTTP driver for edge runtime, instant copy-on-write branching for preview deploys. ~$0 for 0-1K users.

**Why Drizzle (not Prisma):** 40x smaller bundle (~50KB vs 2-4MB), no cold start penalty, native edge runtime support, SQL-like TypeScript API.

**Schema:** 20 tables across 13 files already created in `src/db/schema/`. Key tables:
- `users` — Auth (Clerk sync), profile, XP/level/streak, subscription tier
- `diagrams` + `diagram_versions` — JSONB content, metadata, fork tracking
- `templates` — 55+ curated system designs
- `challenges` + `challenge_rubrics` — Interview problems with AI grading rubrics
- `progress` + `review_events` — FSRS spaced repetition (stability, difficulty, interval, reps, lapses)
- `achievements` + `achievements_users` — Badge system
- `comments` + `upvotes` — Community gallery
- `notifications` — In-app notification center
- `activity_events` — Feed + analytics
- `collab_sessions` + `collab_participants` — PartyKit room tracking

**JSONB for diagrams:** 30-node diagram ≈ 15-30 KB. GIN index enables "find diagrams containing load-balancer node" queries.

## 22.2 Authentication: Clerk

**Why Clerk:** 10K free MAU, 30-min setup, pre-built UI, native Next.js App Router support.

**CRITICAL (CVE-2025-29927):** NEVER rely on Next.js middleware alone for auth. Every Route Handler and Server Action MUST independently call `auth()`:
```typescript
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Response("Unauthorized", { status: 401 });
  return userId;
}
```

**Auth methods (priority):** Passkeys > Magic Links > Social Login (GitHub + Google) > Email/Password.

## 22.3 Background Jobs: Inngest

Runs inside Vercel deployment (no separate infra). 50K free runs/month. Used for:
- Welcome email drip sequence (5 emails over 7 days, adaptive — skips if user already completed action)
- Weekly learning digest
- Spaced repetition review reminders
- Achievement checking after challenge completion
- User data deletion cascade (GDPR)

## 22.4 Real-Time: PartyKit + Yjs (Phase 2)

PartyKit on Cloudflare Durable Objects for WebSocket rooms. Each collaboration room = one Durable Object.
- **Auth on every WebSocket connect** (validate Clerk JWT)
- **Rate limit** Yjs updates (60/sec per connection)
- **Document compaction** when all peers have synced

## 22.5 Email: Resend + react-email

- `Resend` for sending ($20/mo for 50K emails)
- `react-email` for React component email templates
- Flows: Welcome (5 emails/7 days), Weekly Digest, SRS Reminders, Re-engagement (7d, 14d, 30d inactive)

## 22.6 Cost Projection

| Phase | Users | Monthly Cost |
|---|---|---|
| MVP (0-1K) | Free tiers everywhere | $0-20 |
| Growth (1K-10K) | Paid tiers needed | $150-300 |
| Scale (10K-100K) | Full infrastructure | $2,500-4,000 |
| Massive (1M+) | Self-hosted migration | $5,000-15,000 |

---

# PART 23: MONETIZATION & BUSINESS

## 23.1 Pricing Tiers

**Free (Forever, No Credit Card):**
- All Foundations content, 5 simulations/month, basic algorithm viz, community access
- Self-hosted via open source (AGPL-3.0 license)

**Pro — $12/mo (annual $144/yr) or $19/mo monthly:**
- Unlimited simulations (75+ problems), advanced algorithms, LLD/OOD, interview mode with AI, SRS, offline
- **Lifetime: $349**

**Team — $9/user/mo (min 3, annual):**
- Shared workspaces, team dashboards, mock interview pairing, SSO

**Enterprise — Custom (~$25/user/mo):**
- Custom content, skills assessment, LMS integration, SOC 2, on-premise

**Undercuts every competitor:** ByteByteGo $189/yr, Educative $200/yr, DesignGurus $349/yr. Architex Pro at $144/yr is cheaper AND interactive.

## 23.2 Open Source: AGPL-3.0

- `architex-core/` — AGPL-3.0 (prevents AWS/Google from cloning as a service)
- `architex-cloud/` — Proprietary (hosting, teams, AI, analytics)
- `architex-content/` — CC BY-SA 4.0 (educational content, community-contributed)

## 23.3 Revenue Projections

| Year | Free Users | Pro Users (3% conv) | Revenue |
|---|---|---|---|
| Year 1 | 50,000 | 1,500 | ~$350K |
| Year 2 | 200,000 | 8,000 | ~$2M |

## 23.4 Launch Strategy

1. **Pre-launch:** Build in public (Twitter #BuildInPublic), 5 SEO blog posts, 1K email waitlist
2. **Week 1-2:** Hacker News "Show HN" (Tuesday morning, live demo ready, be in comments 4-6 hours)
3. **Week 3-4:** Product Hunt launch (target Top 5, "Pro free 30 days for PH community")
4. **Month 2+:** Content flywheel — blog (Mon), YouTube (Wed), Twitter thread (Fri), newsletter (Tue)

---

# PART 24: LANDING PAGE DESIGN

## Design Direction
**"Linear-style dark theme + Stripe-level animation + Excalidraw's product-as-hero"**

## Color Scheme
```
Background:      #0A0A0F     Accent Primary:   #6366F1 (indigo)
Surface:         #141419     Accent Success:   #22C55E
Border:          #1E1E2A     Accent Warning:   #F59E0B
Text Primary:    #F4F4F5     Accent Glow:      gradient(#6366F1 → #8B5CF6 → #A78BFA)
Text Secondary:  #94A3B8
```

## Sections (top to bottom)
1. **Hero:** "Design Systems. Visualize Algorithms. Ace Interviews." + live mini-simulator embedded + animated gradient mesh background
2. **Trust Bar:** Auto-scrolling grayscale logos (Google, Meta, Amazon, Netflix, Stripe)
3. **Product Showcase:** 3 tabs (System Design / Algorithm Viz / Interview Practice) with interactive previews
4. **Feature Deep-Dive:** Chess layout (alternating left/right) with scroll-triggered animations
5. **How It Works:** 3 steps — Pick Challenge → Build & Visualize → Get Feedback
6. **Social Proof Wall:** Masonry grid of testimonials (Tailwind "Wall of Love" style)
7. **Comparison Table:** Architex vs Traditional Prep
8. **Pricing:** 3 tiers, "Most Popular" badge on Pro (+22% conversion)
9. **Final CTA:** "Start Practicing Free — No Credit Card Required"

**Conversion data:** Interactive demo = +65% conversion. Bento grids = +47% dwell time. First-person CTAs = +30%.

**Full blueprint: See `research/22-landing-page-design.md`**

---

# PART 25: SEO & CONTENT GROWTH

## Programmatic SEO (Highest ROI)

75 HLD + 65 LLD + 50 patterns + 80 concepts = **270+ indexable pages**, each targeting unique long-tail keywords.

**At 50-200 visits/page/month → 13,500-54,000 organic visits from programmatic pages alone.**

## Content Pillars
- **Mon:** Blog post (SEO) — "How Consistent Hashing Works" with embedded interactive sim
- **Wed:** YouTube video — screen recordings of the tool itself
- **Fri:** Twitter/X thread — 7-tweet visual concept threads
- **Tue:** Newsletter — "The Architect's Digest" (concept + problem-of-the-week + curated link)

## Growth Targets
| Month | Organic Visits | Newsletter | GitHub Stars |
|---|---|---|---|
| 3 | 5,000/mo | 2,000 | 1,000 |
| 6 | 25,000/mo | 10,000 | 3,000 |
| 12 | 100,000/mo | 50,000 | 10,000 |

**Full strategy: See `research/31-seo-content-growth.md`**

---

# PART 26: ANALYTICS, EMAIL & NOTIFICATIONS

## Analytics: PostHog (Cloud free tier)
Key events: `diagram_created`, `simulation_started`, `challenge_completed`, `concept_review_completed`, `pricing_page_viewed`
Key funnels: Landing → Signup (15%) → Onboarding (80%) → First Diagram (60%) → First Simulation (50%)
Retention targets: D1=40%, D7=25%, D30=15%

## Notifications
- In-app notification center (bell icon, popover, mark-read)
- Anti-spam: daily limits (in_app=20, email=3, push=5), cooldowns, quiet hours (10pm-8am user timezone)
- Categories: learning reminders, achievements, weekly digest, social, product updates

**Full specs: See `research/32-analytics-email-notifications.md`**

---

# PART 27: DESIGN SYSTEM TOKENS

The complete design system (61KB, 6,635 words) is at `research/22-architex-design-system.md`. Key decisions:

- **13px base font** (Linear/VS Code density)
- **Geist Sans** (UI), **Geist Mono** (code), **Inter Display** (headings)
- **Violet #6E56CF** accent with full 50-950 scale
- **4-layer backgrounds:** base #0C0D0F → surface #111113 → elevated #18191B → overlay #212225
- **32px default component height** (buttons, inputs, selects, toolbar items)
- **Spring physics:** 5 named configs (snappy, smooth, bouncy, stiff, slow)
- **60+ icon specifications** across 7 categories
- **Copy-paste ready CSS custom properties + Tailwind v4 @theme config**

---

# PART 28: WIREFRAME SPECS (22 Screens)

Complete wireframe blueprints for every screen are at `docs/wireframes/architex-wireframe-specs.md` (107KB, 15,481 words). Every screen includes:
- Exact layout with Mermaid diagrams
- Every interactive element with behavior
- Responsive breakpoints (1440px, 768px, 375px)
- Empty states, loading states (skeleton screens)
- Navigation to/from every other screen

Screens: Landing Page, Home Dashboard, Module Selection, System Design Editor, Algorithm Visualizer, Data Structure Explorer, LLD Studio, Database Lab, Distributed Systems Playground, Interview Challenge, Interview Results, Template Gallery, Template Preview, Learning Path View, Profile/Progress, Settings, Collaboration Session, Community Gallery, Share/Export Dialog, Command Palette, Onboarding Flow, Keyboard Shortcuts

---

# PART 29: RESEARCH LIBRARY REFERENCE

All 38 research files are in `research/`. Key files for implementation:

| File | What | When to Reference |
|---|---|---|
| `04-tech-stack-recommendations.md` | Library versions, sizes, rationale | Setting up the project |
| `16-queuing-theory-simulation-math.md` | M/M/1, M/M/c, USL, Little's Law formulas | Building the simulation engine |
| `21-benchmarks-real-world-numbers.md` | Latency, throughput, cost numbers | Hardcoding realistic defaults |
| `22-architex-design-system.md` | Complete design tokens (61KB) | Implementing UI components |
| `22-auth-security-compliance.md` | Clerk setup, OWASP, GDPR checklist | Setting up auth and security |
| `22-backend-infrastructure.md` | Neon + Drizzle + Inngest + PartyKit | Building the backend |
| `22-canvas-editor-ui-deep-dive.md` | Toolbar, panels, context menus, collab UI | Building the editor |
| `40-devils-advocate-review.md` | Every decision challenged with alternatives | Making architecture decisions |
| `41-defense-architect-counter.md` | Counter-arguments with evidence | Defending decisions in reviews |
| `42-chief-architect-final-review.md` | Top risks, over-engineered items, changes | Scoping V1 |
| `43-security-threat-model.md` | 29 vulnerabilities with mitigations | Security review |
| `44-scalability-breaking-points.md` | 20 breaking points with fixes | Scaling planning |

---

# PART 30: ADVANCED FEATURES (CTO-LEVEL THINKING)

## 22.1 First-Run Onboarding Experience

The first 5 minutes determine whether a user stays or leaves. Design onboarding like Figma — interactive, not a slideshow.

**First Launch Flow:**
1. **Welcome screen:** "What do you want to learn?" — checkboxes: System Design, Algorithms, LLD, Database, Distributed Systems, Interview Prep. This customizes the sidebar and learning path.
2. **Interactive tutorial:** Not a tooltip tour. User builds a mini URL shortener (3 nodes: Client → API Server → Database) with guided prompts. Takes 90 seconds. Teaches: drag-drop, connect, configure, simulate.
3. **"Aha moment":** Run a traffic simulation on the mini system. Show it breaking at 1000 RPS. Add a cache. Watch latency drop. User immediately understands the tool's value.
4. **Personalized dashboard:** Based on selections, show recommended learning path and starter templates.

**Implementation:** Use `react-joyride` for highlight-based tutorials OR build a custom step-by-step overlay system. Track onboarding completion in IndexedDB. Show "Resume tutorial" if abandoned mid-way.

## 22.2 Learning Paths (Structured Curriculum)

Not just random modules — structured, ordered sequences that build on each other:

**Path 1: System Design Interview Prep (4-8 weeks)**
```
Week 1: Fundamentals
  ├── Back-of-envelope estimation
  ├── Latency numbers every engineer should know
  ├── Scaling from 0 to millions
  └── CAP theorem + consistency models

Week 2: Core Components
  ├── Load balancers (algorithms, L4 vs L7)
  ├── Caching strategies (cache-aside, write-through, write-behind)
  ├── Message queues vs event streams
  └── Database selection (SQL vs NoSQL decision tree)

Week 3: Data Layer Deep Dive
  ├── Database sharding strategies
  ├── Replication (leader-follower, multi-leader, leaderless)
  ├── Consistent hashing
  └── Indexing strategies (B-Tree, LSM-Tree, Hash)

Week 4: Reliability & Resilience
  ├── Circuit breaker pattern
  ├── Rate limiting algorithms
  ├── Retry strategies (exponential backoff + jitter)
  └── Chaos engineering practice

Week 5-6: Classic System Designs
  ├── URL Shortener → Twitter → Instagram → Netflix
  ├── Each with increasing complexity
  └── Timed practice with AI evaluation

Week 7-8: Advanced Systems
  ├── Uber dispatch, Google Search, Distributed KV Store
  ├── Mock interviews with AI interviewer
  └── Review weak areas via spaced repetition
```

**Path 2: DSA Mastery (6 weeks)**
**Path 3: Backend Engineering Fundamentals (4 weeks)** — OS + Networking + Database + Concurrency
**Path 4: Distributed Systems Deep Dive (4 weeks)**
**Path 5: Full-Stack Interview Prep (8 weeks)** — Combines all paths

Each path has a visual progress bar. Completing a path awards a certificate-style achievement.

## 22.3 Plugin / Extension Architecture

Make Architex extensible like VS Code. Users and third-parties can create plugins that add:

**Plugin Types:**
- **Custom Node Types:** New component types with custom rendering, configuration, and simulation behavior
- **Custom Algorithms:** New algorithm visualizations following the AnimationStep interface
- **Custom Templates:** Pre-built diagrams packaged as plugins
- **Custom Themes:** Color schemes and visual styles
- **Data Connectors:** Import from external tools (Terraform state, Kubernetes manifests, AWS CloudFormation)

**Plugin Manifest (`plugin.json`):**
```json
{
  "name": "aws-components",
  "version": "1.0.0",
  "description": "AWS-specific system design components with official icons",
  "author": "community",
  "type": "node-pack",
  "nodes": [
    { "id": "aws-lambda", "label": "Lambda", "category": "compute", "icon": "lambda.svg" },
    { "id": "aws-dynamodb", "label": "DynamoDB", "category": "storage", "icon": "dynamodb.svg" },
    { "id": "aws-sqs", "label": "SQS", "category": "messaging", "icon": "sqs.svg" }
  ],
  "simulation": {
    "aws-lambda": { "coldStartMs": 200, "maxConcurrency": 1000, "costPerInvocation": 0.0000002 }
  }
}
```

**Plugin Loading:** Plugins are loaded from a local `plugins/` directory or from a community registry. Each plugin runs in an iframe sandbox for security.

## 22.4 Multi-Region Architecture Visualization

A world map view that shows:
- Data center locations (regions) with colored circles
- Cross-region connections with latency labels
- Traffic routing (user → nearest region via GeoDNS)
- Replication arrows between database replicas
- Failover scenarios: click a region to "kill" it, watch traffic reroute
- Latency heat map showing p99 from different user locations

## 22.5 Cost Estimation Engine

Every system design automatically estimates infrastructure cost:

```
┌─ Cost Estimation ──────────────────────────────┐
│                                                 │
│ Monthly Infrastructure Cost: $12,450            │
│                                                 │
│ Breakdown:                                      │
│ ├── Compute (3x c5.xlarge):      $720          │
│ ├── Database (RDS r5.2xlarge):   $2,880        │
│ ├── Cache (ElastiCache r6g.lg):  $450          │
│ ├── Load Balancer (ALB):         $180          │
│ ├── Kafka (MSK 3-broker):       $2,100        │
│ ├── S3 Storage (10TB):          $230          │
│ ├── CDN (CloudFront 50TB):      $4,250        │
│ ├── Data Transfer:              $1,640        │
│ └── Monitoring/Logging:         $0 (free tier) │
│                                                 │
│ Cost per 1M requests: $0.12                    │
│ Cost per user per month: $0.003                │
│                                                 │
│ 💡 Optimization tips:                          │
│    - Use Reserved Instances: save 40%           │
│    - Add caching: reduce DB costs 60%           │
│    - Use Spot for workers: save 70%             │
└─────────────────────────────────────────────────┘
```

Cost data based on AWS/GCP/Azure published pricing. Updated periodically. Users can toggle between cloud providers.

## 22.6 Version History & Time Travel

Every diagram change is recorded as an immutable event (event sourcing):

```typescript
interface DiagramEvent {
  id: string;
  timestamp: number;
  type: 'node-added' | 'node-removed' | 'node-moved' | 'edge-added' | 'edge-removed' | 'config-changed' | 'simulation-run' | 'chaos-injected';
  payload: any;
  userId?: string;  // For collaborative sessions
}
```

**Version History Panel:**
- Timeline slider showing all changes
- Scrub to any point in time to see the diagram at that state
- Named snapshots ("v1 - Basic architecture", "v2 - Added caching layer")
- Diff view: compare two snapshots side-by-side, highlighting added/removed/changed nodes
- Branching: fork from any snapshot to explore alternatives

## 22.7 Performance Benchmarking Mode

After designing a system, compare it against reference architectures:

```
┌─ Benchmark Results ────────────────────────────┐
│                                                 │
│ Your Design vs Reference (URL Shortener)        │
│                                                 │
│                  Yours    Reference    Score     │
│ Max throughput:  12K/s    15K/s       ★★★★☆    │
│ p99 latency:    85ms     50ms        ★★★☆☆    │
│ Fault tolerance: 1 node  2 nodes     ★★★☆☆    │
│ Cost efficiency: $800    $650        ★★★☆☆    │
│ Scalability:     10x     100x        ★★☆☆☆    │
│                                                 │
│ Key differences:                                │
│ ❌ Missing read replica for database             │
│ ❌ No rate limiting at API gateway               │
│ ✅ Good use of CDN for static content            │
│ ✅ Appropriate cache TTL configuration           │
│ 💡 Consider consistent hashing for cache layer  │
│                                                 │
│ Overall: 72/100 (Above Average)                 │
└─────────────────────────────────────────────────┘
```

## 22.8 Community & Public Gallery

- **Public Gallery:** Users can publish their designs to a searchable public gallery
- **Fork & Remix:** One-click fork of any public design. Modify and make it your own.
- **Upvote & Comment:** Community quality signal on designs
- **Templates from the Community:** Best community designs get promoted to official templates
- **Profile Pages:** User profile with their published designs, achievements, and learning path progress
- **Weekly Challenges:** Community-wide design challenges with voting and prizes

## 22.9 DevOps Module — CI/CD Pipeline Visualization

**Pipeline Builder:**
- Drag-and-drop pipeline stages: Source → Build → Test → Stage → Deploy → Monitor
- Parallel and sequential steps
- Conditional gates (approval, test pass, security scan)
- Show execution timeline with animated flow

**Deployment Strategy Visualizer:**
- **Blue-Green:** Two environments, traffic switch animation
- **Canary:** Gradual traffic shift (1% → 5% → 25% → 100%) with rollback on metric degradation
- **Rolling Update:** Instances replaced one-by-one
- **A/B Testing:** Traffic split based on user segments

**Kubernetes Architecture:**
- Interactive cluster: Nodes → Pods → Containers
- Service → Deployment → ReplicaSet → Pod hierarchy
- Horizontal Pod Autoscaler visualization (scale up/down based on CPU)
- Ingress controller routing
- ConfigMap/Secret injection

## 22.10 Advanced Simulation: Microservices Patterns

**Saga Pattern Simulator:**
- Orchestration saga: central coordinator sends commands to each service
- Choreography saga: each service emits events that trigger the next
- Compensation flow: when step 3 fails, show compensating transactions for steps 1 and 2 rolling backward
- Configurable: add/remove steps, set failure probability per step

**CQRS + Event Sourcing:**
- Write path: Command → Command Handler → Event Store → Events
- Read path: Events → Projector → Read Model → Query
- Show the event store growing as commands are processed
- Show projections being built from events
- Demonstrate replay: rebuild read model from events

**Circuit Breaker State Machine:**
```
     ┌──────────┐  failure threshold exceeded  ┌──────────┐
     │  CLOSED   │ ──────────────────────────→ │   OPEN   │
     │ (normal)  │                              │ (failing)│
     └──────────┘ ←────────────────────────── └──────────┘
          ↑        test request succeeds             │
          │                                          │ timeout expires
          │        ┌───────────┐                    │
          └─────── │ HALF-OPEN │ ←──────────────────┘
                   │ (testing) │
                   └───────────┘
```
Interactive: configure failure threshold, timeout duration, test request count. Watch the state machine transition as you inject failures.

**Rate Limiting Algorithm Comparison:**
- **Token Bucket:** Visualize token refill rate, bucket capacity, burst handling
- **Sliding Window Log:** Show timestamps of requests, window sliding forward
- **Sliding Window Counter:** Show counter-based approximation
- **Leaky Bucket:** Show constant output rate regardless of burst input
- **Fixed Window Counter:** Show the edge-of-window problem
- Side-by-side comparison with identical traffic pattern showing different behavior

**Change Data Capture (CDC):**
- Database → Transaction Log → CDC Reader (Debezium) → Kafka → Consumers
- Show: INSERT/UPDATE/DELETE events flowing from DB to downstream systems
- Use cases: search index sync, cache invalidation, analytics pipeline

**Distributed Tracing:**
- Trace a single request across multiple microservices
- Show: spans, parent-child relationships, timing waterfall
- Jaeger/Zipkin-style trace view
- Identify the slowest service in the chain

## 22.11 Mobile & Touch Experience

Even though this is primarily a desktop tool, provide a usable mobile experience:

- **Responsive layout:** Below 1024px, collapse to single-panel view with bottom navigation
- **Touch gestures:**
  - Pinch-to-zoom on canvas (React Flow supports this)
  - Two-finger pan
  - Long-press for context menu
  - Drag from palette to canvas
- **Mobile-optimized command palette:** Full-screen on mobile with larger touch targets
- **Read-only mode on mobile:** View shared diagrams and run simulations, but complex editing defers to desktop
- **PWA install prompt:** Encourage adding to home screen for app-like experience

## 22.12 Notification & Review System

- **Spaced Repetition Reminders:** "Time to review 'Consistent Hashing' — due today" (via Push API if permitted, or in-app notification)
- **Streak Reminders:** "Your 14-day streak is at risk! Design something today."
- **New Template Alerts:** "New template: Discord's ScyllaDB Migration Architecture"
- **Challenge Notifications:** "This week's community challenge: Design a Ticket Booking System"
- All notifications are optional and respect user preferences. Never spam.

## 22.13 Data Serialization Format Comparison

Interactive comparison of serialization formats:

| Format | Example | Size | Speed | Schema | Human-Readable |
|---|---|---|---|---|---|
| JSON | `{"name":"Alice","age":30}` | 100% (baseline) | Slow | No | Yes |
| Protocol Buffers | Binary | ~30% | Very Fast | Yes (.proto) | No |
| MessagePack | Binary | ~50% | Fast | No | No |
| Avro | Binary | ~35% | Fast | Yes (.avsc) | No |
| Thrift | Binary | ~35% | Fast | Yes (.thrift) | No |
| CBOR | Binary | ~55% | Fast | No | No |

Show the same data encoded in each format with hex dump, size comparison chart, and encode/decode speed benchmark.

## 22.14 Decision Trees for Architecture Choices

Interactive decision trees that guide users:

**"Which Database Should I Use?"**
```
Is your data relational? 
  ├── Yes → Do you need ACID transactions?
  │         ├── Yes → PostgreSQL / MySQL
  │         └── No → Consider NoSQL for performance
  └── No → What's your access pattern?
            ├── Key-value lookups → Redis / DynamoDB
            ├── Document storage → MongoDB
            ├── Wide-column (write-heavy) → Cassandra / ScyllaDB
            ├── Full-text search → Elasticsearch
            ├── Graph traversals → Neo4j
            ├── Time-series → InfluxDB / TimescaleDB
            └── Analytical queries → ClickHouse / BigQuery
```

**"Which Message Queue?"** — Kafka vs RabbitMQ vs SQS vs Redis Pub/Sub
**"Which Cache Strategy?"** — Cache-aside vs Write-through vs Write-behind vs Read-through
**"Which Load Balancing Algorithm?"** — Based on requirements (stateful? weighted? health-aware?)
**"Monolith vs Microservices?"** — Based on team size, deployment frequency, domain complexity

Each node in the decision tree is clickable and expands with explanation + trade-offs.

---

# PART 23: METRICS & ANALYTICS (INTERNAL)

Track how the tool is used to inform product decisions (privacy-friendly via PostHog):

**Usage Metrics:**
- Which modules are most/least used
- Average session duration per module
- Most popular templates
- Most common export formats
- Feature discovery rate (what % of users find the command palette, chaos events, AI review)
- Drop-off points in onboarding

**Learning Metrics:**
- Challenge completion rate by difficulty
- Average score by topic
- Most commonly failed concepts (feed into content improvement)
- Spaced repetition review consistency
- Learning path completion rates

**Performance Metrics:**
- Core Web Vitals (LCP, INP, CLS)
- Canvas render time at various node counts
- WASM load time
- Simulation execution time

All analytics use PostHog with `persistence: 'memory'` (no cookies) and explicit event capture only.

---

# PART 24: SEO & DISCOVERABILITY (Growth Strategy)

## 24.1 Public Template Pages
Every template in the gallery gets a public, SEO-optimized page:
- URL: `architex.dev/templates/twitter-fanout-architecture`
- Title: "Twitter Fanout Architecture — Interactive System Design | Architex"
- Static rendering (SSG) with Open Graph images (auto-generated diagram screenshots)
- Schema.org structured data (SoftwareApplication, LearningResource)
- Each page has a "Try it live" button that opens the interactive editor

## 24.2 Learning Path Pages
- `architex.dev/learn/system-design-interview`
- `architex.dev/learn/algorithms-and-data-structures`
- Rich content with embedded interactive diagrams
- Targets long-tail keywords: "system design interview preparation tool", "interactive algorithm visualizer"

## 24.3 Blog / Explainer Content
- Interactive articles (like Red Blob Games): "How Consistent Hashing Works" with embedded Architex widgets
- Each article embeds a live, interactive Architex diagram
- Published at `architex.dev/blog/`

---

Build this, and you will have created something that redefines how engineers learn, design, and prepare for the next level of their career. This isn't just a tool — it's the engineering equivalent of a flight simulator.
