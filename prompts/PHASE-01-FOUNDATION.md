# PHASE 1: CORE PLATFORM & INFRASTRUCTURE

> **Goal:** A running Next.js app with the complete application shell — panels, canvas, command palette, auth, database, stores, persistence, theme, and CI/CD. No features yet, but the skeleton compiles, renders, and is ready for modules.

---

## WHAT YOU ARE BUILDING

**Architex** is a browser-based, open-source engineering visualization & simulation platform with 12 modules: System Design Simulator, Algorithm Visualizer, Data Structure Explorer, Low-Level Design Studio, Database Design Lab, Distributed Systems Playground, Networking & Protocols, OS Concepts, Concurrency Lab, Security & Cryptography, ML System Design, and Interview Engine.

This phase builds the **foundation** — everything modules plug into.

---

## TECH STACK (Install All of These)

```bash
# Framework
pnpm create next-app@latest architex --typescript --tailwind --eslint --app --use-pnpm

# Core
pnpm add @xyflow/react zustand zundo motion d3 cmdk react-resizable-panels lucide-react

# Code Editor
pnpm add @monaco-editor/react

# Storage & Database
pnpm add dexie dexie-react-hooks @neondatabase/serverless drizzle-orm

# Auth
pnpm add @clerk/nextjs

# Worker Communication
pnpm add comlink

# Collaboration (install now, use later)
pnpm add yjs y-indexeddb

# Export & Sharing
pnpm add html-to-image jspdf lz-string fflate browser-fs-access

# Email & Jobs
pnpm add resend @react-email/components inngest

# Analytics & Monitoring
pnpm add posthog-js @sentry/nextjs

# PWA
pnpm add @ducanh2912/next-pwa

# Fonts
pnpm add geist

# Dev Dependencies
pnpm add -D drizzle-kit vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test happy-dom @vitejs/plugin-react
pnpm add -D storybook @storybook/react-vite @storybook/addon-essentials
pnpm add -D @size-limit/preset-app size-limit
```

---

## PROJECT STRUCTURE (Create Every Folder)

```
architex/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              ← Main app layout (sidebar + panels)
│   │   ├── page.tsx                ← Home dashboard
│   │   ├── system-design/page.tsx  ← System Design module
│   │   ├── algorithms/page.tsx     ← Algorithm Visualizer module
│   │   ├── data-structures/page.tsx
│   │   ├── lld/page.tsx
│   │   ├── database/page.tsx
│   │   ├── distributed/page.tsx
│   │   ├── networking/page.tsx
│   │   ├── os/page.tsx
│   │   ├── concurrency/page.tsx
│   │   ├── security/page.tsx
│   │   ├── ml-design/page.tsx
│   │   └── interview/page.tsx
│   ├── api/
│   │   ├── inngest/route.ts        ← Inngest webhook handler
│   │   └── webhooks/clerk/route.ts ← Clerk user sync webhook
│   ├── embed/[id]/page.tsx         ← Embeddable read-only viewer
│   ├── layout.tsx                  ← Root layout (ClerkProvider, ThemeProvider, PostHog)
│   ├── globals.css                 ← Design system CSS custom properties
│   └── manifest.json               ← PWA manifest
├── components/
│   ├── canvas/
│   │   ├── ArchitexCanvas.tsx       ← React Flow wrapper with our config
│   │   ├── nodes/                   ← Custom node components (empty for now)
│   │   ├── edges/                   ← Custom edge components (empty for now)
│   │   ├── panels/
│   │   │   ├── ComponentPalette.tsx ← Left sidebar drag-and-drop palette
│   │   │   ├── PropertiesPanel.tsx  ← Right sidebar node properties
│   │   │   ├── MetricsPanel.tsx     ← Bottom panel - metrics tab
│   │   │   ├── CodePanel.tsx        ← Bottom panel - code tab
│   │   │   └── TimelinePanel.tsx    ← Bottom panel - timeline tab
│   │   └── overlays/
│   │       ├── ParticleLayer.tsx    ← Canvas 2D overlay for particle effects
│   │       └── Minimap.tsx
│   ├── layout/
│   │   ├── AppShell.tsx             ← The main VS Code-style layout
│   │   ├── ActivityBar.tsx          ← Far-left 48px icon bar
│   │   ├── Sidebar.tsx              ← Left panel (240-400px)
│   │   ├── StatusBar.tsx            ← Bottom 24px status strip
│   │   └── TabBar.tsx               ← Top tab strip for open diagrams
│   ├── command-palette/
│   │   └── CommandPalette.tsx       ← Cmd+K modal
│   ├── ui/                          ← shadcn/ui components (auto-generated)
│   └── providers/
│       ├── ThemeProvider.tsx
│       ├── AnalyticsProvider.tsx
│       └── StoreProvider.tsx
├── lib/
│   ├── auth.ts                      ← requireAuth() utility
│   ├── analytics.ts                 ← PostHog wrapper
│   ├── constants/
│   │   ├── latency-numbers.ts       ← Jeff Dean's numbers
│   │   ├── throughput-numbers.ts    ← RPS benchmarks per component
│   │   ├── cost-estimates.ts        ← Cloud pricing per resource
│   │   └── modules.ts              ← Module definitions (name, icon, color, route)
│   └── utils/
│       └── cn.ts                    ← Tailwind class merger (clsx + twMerge)
├── stores/
│   ├── canvas-store.ts              ← Nodes, edges, selection
│   ├── viewport-store.ts            ← Pan, zoom, viewport bounds
│   ├── simulation-store.ts          ← Simulation state, metrics
│   ├── editor-store.ts              ← Code editor state
│   ├── ui-store.ts                  ← Panel states, theme, active module
│   ├── interview-store.ts           ← Timer, score, challenge
│   ├── command-bus.ts               ← Cross-store command dispatcher
│   └── types.ts                     ← ArchitexNode, ArchitexEdge, Command types
├── hooks/
│   ├── use-react-flow-adapter.ts    ← ArchitexNode[] ↔ ReactFlowNode[] conversion
│   ├── use-keyboard-shortcuts.ts
│   ├── use-auto-save.ts
│   ├── use-theme.ts
│   └── use-prefers-reduced-motion.ts
├── workers/
│   ├── simulation.worker.ts
│   ├── layout.worker.ts
│   └── algorithm.worker.ts
├── src/db/                          ← ALREADY EXISTS (from Data Architect agent)
│   ├── index.ts                     ← Database connection
│   └── schema/
│       ├── users.ts
│       ├── diagrams.ts
│       ├── templates.ts
│       ├── challenges.ts
│       ├── progress.ts
│       ├── achievements.ts
│       ├── community.ts
│       ├── collaboration.ts
│       ├── notifications.ts
│       ├── activity.ts
│       ├── relations.ts
│       └── index.ts
├── styles/
│   └── design-tokens.ts            ← Exported token values for JS usage
├── public/
│   ├── icons/                       ← Module and component SVG icons
│   └── fonts/                       ← Geist font files (if self-hosting)
├── e2e/                             ← Playwright tests
├── test/
│   └── setup.ts                     ← Vitest setup (mocks for ResizeObserver, etc.)
├── .storybook/
│   └── main.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

---

## DESIGN SYSTEM (globals.css)

Every color, every spacing value, every font. This is the SINGLE SOURCE OF TRUTH.

```css
/* app/globals.css */

@import "tailwindcss";

/* ═══════════════════════════════════════ */
/* DESIGN TOKENS                          */
/* ═══════════════════════════════════════ */

:root {
  /* ── Spacing (4px grid) ── */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── Border Radius ── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* ── Typography ── */
  --font-sans: 'Geist Sans', 'Inter', -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Inter Display', 'Geist Sans', sans-serif;

  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;    /* Linear/VS Code density */
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 18px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 48px;

  /* ── Component Sizes ── */
  --component-height-sm: 28px;
  --component-height-md: 32px;  /* default for buttons, inputs, selects */
  --component-height-lg: 36px;

  /* ── Activity Bar ── */
  --activity-bar-width: 48px;

  /* ── Status Bar ── */
  --status-bar-height: 24px;

  /* ── Shadows (dark mode - subtle) ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.5);

  /* ── Focus Ring ── */
  --ring-width: 2px;
  --ring-offset: 2px;

  /* ── Motion ── */
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* ── Node Type Colors ── */
  --node-compute: #3B82F6;     /* blue */
  --node-storage: #22C55E;     /* green */
  --node-messaging: #F97316;   /* orange */
  --node-networking: #A855F7;  /* purple */
  --node-security: #EF4444;    /* red */
  --node-observability: #06B6D4; /* cyan */
  --node-client: #8B5CF6;     /* violet */
  --node-processing: #EC4899; /* pink */

  /* ── Simulation State Colors ── */
  --state-idle: #6B7280;
  --state-active: #3B82F6;
  --state-success: #22C55E;
  --state-warning: #F59E0B;
  --state-error: #EF4444;
  --state-processing: #A855F7;
}

/* ── DARK THEME (default) ── */
:root, [data-theme="dark"] {
  --bg-base: #0C0D0F;
  --bg-surface: #111113;
  --bg-elevated: #18191B;
  --bg-overlay: #212225;

  --text-primary: #EDEDEF;
  --text-secondary: #8B8D98;
  --text-tertiary: #62636C;
  --text-disabled: #3E3F44;

  --border-default: #2E2F35;
  --border-hover: #3E3F44;
  --border-focus: #6E56CF;

  --accent: #6E56CF;
  --accent-hover: #7C66DC;
  --accent-active: #5B44B2;
  --accent-subtle: rgba(110, 86, 207, 0.15);

  --semantic-success: #30A46C;
  --semantic-success-subtle: rgba(48, 164, 108, 0.15);
  --semantic-warning: #F5A623;
  --semantic-warning-subtle: rgba(245, 166, 35, 0.15);
  --semantic-error: #E5484D;
  --semantic-error-subtle: rgba(229, 72, 77, 0.15);
  --semantic-info: #3B82F6;
  --semantic-info-subtle: rgba(59, 130, 246, 0.15);
}

/* ── LIGHT THEME ── */
[data-theme="light"] {
  --bg-base: #FFFFFF;
  --bg-surface: #F9F9FB;
  --bg-elevated: #F0F0F3;
  --bg-overlay: #E8E8EC;

  --text-primary: #1C2024;
  --text-secondary: #60646C;
  --text-tertiary: #8B8D98;
  --text-disabled: #B9BBC6;

  --border-default: #E0E1E6;
  --border-hover: #CDCED6;
  --border-focus: #6E56CF;

  --accent: #6E56CF;
  --accent-hover: #5B44B2;
  --accent-active: #4A3699;
  --accent-subtle: rgba(110, 86, 207, 0.08);

  --semantic-success: #18794E;
  --semantic-warning: #AD5700;
  --semantic-error: #CD2B31;
  --semantic-info: #0D74CE;
}

/* ── Reduced Motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── High Contrast Mode ── */
@media (forced-colors: active) {
  .react-flow__node {
    border: 2px solid ButtonText;
    background: Canvas;
    color: CanvasText;
  }
  .react-flow__edge path {
    stroke: LinkText;
    stroke-width: 2px;
  }
}

/* ── Canvas Background (dot grid) ── */
.canvas-background {
  background-color: var(--bg-base);
  background-image: radial-gradient(circle, var(--border-default) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ── Scrollbar (dark theme) ── */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

/* ── Selection ── */
::selection { background: var(--accent-subtle); color: var(--text-primary); }
```

---

## TAILWIND CONFIG

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        overlay: "var(--bg-overlay)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          active: "var(--accent-active)",
          subtle: "var(--accent-subtle)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          hover: "var(--border-hover)",
          focus: "var(--border-focus)",
        },
        success: { DEFAULT: "var(--semantic-success)", subtle: "var(--semantic-success-subtle)" },
        warning: { DEFAULT: "var(--semantic-warning)", subtle: "var(--semantic-warning-subtle)" },
        error: { DEFAULT: "var(--semantic-error)", subtle: "var(--semantic-error-subtle)" },
        info: { DEFAULT: "var(--semantic-info)", subtle: "var(--semantic-info-subtle)" },
        // Node type colors
        "node-compute": "var(--node-compute)",
        "node-storage": "var(--node-storage)",
        "node-messaging": "var(--node-messaging)",
        "node-networking": "var(--node-networking)",
        "node-security": "var(--node-security)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        md: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      spacing: {
        "activity-bar": "var(--activity-bar-width)",
        "status-bar": "var(--status-bar-height)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## APPLICATION SHELL LAYOUT

The main layout is a VS Code-style multi-panel interface:

```
┌────────┬──────────────────────────────────────┬───────────────┐
│        │  Tab Bar (open diagrams)              │               │
│  A     ├──────────────────────────────────────┤  Properties   │
│  c     │                                      │  Panel        │
│  t     │                                      │  (right)      │
│  i     │         Main Canvas                  │               │
│  v     │         (React Flow)                 │  280-400px    │
│  i     │                                      │  collapsible  │
│  t     │                                      │               │
│  y     ├──────────────────────────────────────┤               │
│        │  Bottom Panel (collapsible)          │               │
│  B     │  Code | Metrics | Timeline | Console │               │
│  a     │  200-400px                           │               │
│  r     ├──────────────────────────────────────┴───────────────┤
│        │  Status Bar (24px)                                    │
│ 48px   │  Module | Nodes/Edges | Sim Status | Zoom | Collab  │
└────────┴──────────────────────────────────────────────────────┘
```

### Activity Bar (far left, 48px width)
- 12 module icons, vertically stacked
- Each icon: 32x32px, with tooltip showing module name
- Active module highlighted with accent color left border (3px)
- At bottom: Settings icon, User avatar (Clerk)
- Click icon = navigate to that module's route
- Keyboard: Cmd+1 through Cmd+9 for first 9 modules

### Module Definitions

```typescript
// lib/constants/modules.ts
export const MODULES = [
  { id: "system-design", name: "System Design", icon: "Server", color: "#3B82F6", route: "/system-design" },
  { id: "algorithms", name: "Algorithms", icon: "GitBranch", color: "#22C55E", route: "/algorithms" },
  { id: "data-structures", name: "Data Structures", icon: "Database", color: "#F59E0B", route: "/data-structures" },
  { id: "lld", name: "Low-Level Design", icon: "Boxes", color: "#A855F7", route: "/lld" },
  { id: "database", name: "Database Design", icon: "Table2", color: "#F97316", route: "/database" },
  { id: "distributed", name: "Distributed Systems", icon: "Network", color: "#EF4444", route: "/distributed" },
  { id: "networking", name: "Networking", icon: "Globe", color: "#06B6D4", route: "/networking" },
  { id: "os", name: "OS Concepts", icon: "Cpu", color: "#6366F1", route: "/os" },
  { id: "concurrency", name: "Concurrency", icon: "Layers", color: "#EC4899", route: "/concurrency" },
  { id: "security", name: "Security", icon: "Shield", color: "#F97316", route: "/security" },
  { id: "ml-design", name: "ML Design", icon: "Brain", color: "#14B8A6", route: "/ml-design" },
  { id: "interview", name: "Interview", icon: "Timer", color: "#64748B", route: "/interview" },
] as const;
```

### Sidebar (left, 240-400px, collapsible)
- Shows content specific to the active module
- For System Design: component palette with categories
- For Algorithms: algorithm list with search
- For Interview: challenge list with filters
- Collapsible to 0px with Cmd+B
- Resizable via drag handle

### Properties Panel (right, 280-400px, collapsible)
- Shows properties of the selected node/edge
- Empty state: "Select a node to see its properties"
- Collapsible with Cmd+Shift+B

### Bottom Panel (200-400px, collapsible)
- 4 tabs: Code | Metrics | Timeline | Console
- Code: Monaco Editor (async loaded)
- Metrics: Real-time charts during simulation
- Timeline: Playback controls + step scrubber
- Console: Event log for simulation events
- Collapsible with Cmd+J

### Status Bar (bottom, 24px, full width)
- Left: Current module name + icon
- Center: Node count, Edge count
- Center-right: Simulation status (Idle/Running/Paused with colored dot)
- Right: Zoom level (dropdown), Collaboration avatars (when active)
- Far right: Save status ("Saved" / "Saving..." / "Unsaved changes")

All panels use `react-resizable-panels` with `onLayout` callback persisting sizes to localStorage.

---

## ZUSTAND STORES + COMMAND BUS

### Store Architecture (6 Atomic Stores)

**Why 6 stores, not 1:** Viewport changes (60fps during pan/zoom) must NOT trigger re-renders of node components. Separating stores by update frequency prevents cascading re-renders.

```
Update Frequency:
  viewportStore    — 60fps (pan, zoom)        ← NEVER causes node re-render
  simulationStore  — 30-60fps (metrics)       ← Only metrics panel re-renders
  canvasStore      — 1-10fps (node changes)   ← Node components re-render
  editorStore      — <1fps (code changes)     ← Only code panel re-renders
  uiStore          — <0.1fps (panel toggles)  ← Layout re-renders
  interviewStore   — <0.1fps (timer ticks)    ← Only interview UI re-renders
```

### Data Types (CRITICAL: Do NOT use React Flow types)

```typescript
// stores/types.ts

// Our OWN node type — NOT ReactFlowNode
export interface ArchitexNode {
  id: string;
  type: string;                    // "web-server" | "database" | "cache" | etc.
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;   // Node-specific configuration
  module: string;                  // Which module this belongs to
  status: "idle" | "active" | "success" | "warning" | "error" | "processing";
  metrics?: NodeMetrics;
}

// Our OWN edge type — NOT ReactFlowEdge
export interface ArchitexEdge {
  id: string;
  source: string;
  target: string;
  type: string;                    // "http" | "grpc" | "websocket" | "queue" | etc.
  label?: string;
  data: Record<string, unknown>;   // latency, bandwidth, error rate config
  animated: boolean;
}

export interface NodeMetrics {
  throughput: number;      // req/s
  latency: {
    p50: number;
    p90: number;
    p99: number;
  };
  errorRate: number;       // 0-1
  utilization: number;     // 0-1
  queueDepth: number;
}

// Command Bus types
export interface Command {
  type: string;
  payload: unknown;
  timestamp: number;
}

// Simulation communication
export interface SimulationCommand {
  type: "start" | "stop" | "pause" | "step" | "inject-chaos" | "set-speed";
  payload: unknown;
}

export interface SimulationSnapshot {
  tick: number;
  nodes: Record<string, NodeMetrics>;
  particles: Array<{ edgeId: string; progress: number; type: string }>;
  events: SimulationEvent[];
}

export interface SimulationEvent {
  type: string;
  timestamp: number;
  nodeId?: string;
  message: string;
  severity: "info" | "warning" | "error";
}
```

### Canvas Store

```typescript
// stores/canvas-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ArchitexNode, ArchitexEdge } from "./types";

interface CanvasState {
  nodes: ArchitexNode[];
  edges: ArchitexEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Actions
  addNode: (node: ArchitexNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<ArchitexNode>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  addEdge: (edge: ArchitexEdge) => void;
  removeEdge: (id: string) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  clearSelection: () => void;
  setNodes: (nodes: ArchitexNode[]) => void;
  setEdges: (edges: ArchitexEdge[]) => void;
  clear: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set) => ({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] }), false, "addNode"),
      removeNode: (id) => set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeIds: s.selectedNodeIds.filter((nid) => nid !== id),
      }), false, "removeNode"),
      updateNode: (id, updates) => set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }), false, "updateNode"),
      moveNode: (id, position) => set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      }), false, "moveNode"),
      addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] }), false, "addEdge"),
      removeEdge: (id) => set((s) => ({
        edges: s.edges.filter((e) => e.id !== id),
      }), false, "removeEdge"),
      setSelection: (nodeIds, edgeIds) => set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }, false, "setSelection"),
      clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }, false, "clearSelection"),
      setNodes: (nodes) => set({ nodes }, false, "setNodes"),
      setEdges: (edges) => set({ edges }, false, "setEdges"),
      clear: () => set({ nodes: [], edges: [], selectedNodeIds: [], selectedEdgeIds: [] }, false, "clear"),
    }),
    { name: "canvas-store" }
  )
);
```

### Command Bus (Cross-Store Coordination)

```typescript
// stores/command-bus.ts
import { useCanvasStore } from "./canvas-store";
import { useSimulationStore } from "./simulation-store";
import { useUIStore } from "./ui-store";
import type { Command } from "./types";

const commandHistory: Command[] = [];
const MAX_HISTORY = 100;

export function dispatchCommand(command: Command): void {
  const timestamped = { ...command, timestamp: Date.now() };

  switch (command.type) {
    case "START_SIMULATION": {
      useSimulationStore.getState().start();
      useUIStore.getState().setSimulationStatus("running");
      break;
    }
    case "STOP_SIMULATION": {
      useSimulationStore.getState().stop();
      useUIStore.getState().setSimulationStatus("idle");
      break;
    }
    case "DELETE_SELECTED": {
      const { selectedNodeIds, selectedEdgeIds } = useCanvasStore.getState();
      selectedNodeIds.forEach((id) => useCanvasStore.getState().removeNode(id));
      selectedEdgeIds.forEach((id) => useCanvasStore.getState().removeEdge(id));
      useCanvasStore.getState().clearSelection();
      break;
    }
    // Add more cross-store commands as needed
  }

  commandHistory.push(timestamped);
  if (commandHistory.length > MAX_HISTORY) commandHistory.shift();
}
```

---

## REACT FLOW ADAPTER PATTERN

This is the **most architecturally important** pattern. Our data model (ArchitexNode) must be separate from React Flow's internal types.

```typescript
// hooks/use-react-flow-adapter.ts
import { useMemo } from "react";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";
import type { ArchitexNode, ArchitexEdge } from "@/stores/types";

// Convert OUR nodes to React Flow nodes
function toReactFlowNode(node: ArchitexNode): RFNode {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.data,
      label: node.label,
      status: node.status,
      metrics: node.metrics,
      module: node.module,
    },
    selected: false, // React Flow manages this internally
  };
}

// Convert OUR edges to React Flow edges
function toReactFlowEdge(edge: ArchitexEdge): RFEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    label: edge.label,
    data: edge.data,
    animated: edge.animated,
  };
}

// Convert React Flow changes BACK to our model
function fromReactFlowNodeChange(rfNode: RFNode): Partial<ArchitexNode> {
  return {
    position: rfNode.position,
  };
}

export function useReactFlowAdapter() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const moveNode = useCanvasStore((s) => s.moveNode);

  const rfNodes = useMemo(() => nodes.map(toReactFlowNode), [nodes]);
  const rfEdges = useMemo(() => edges.map(toReactFlowEdge), [edges]);

  const onNodesChange = (changes: any[]) => {
    changes.forEach((change: any) => {
      if (change.type === "position" && change.position) {
        moveNode(change.id, change.position);
      }
    });
  };

  return { rfNodes, rfEdges, onNodesChange };
}
```

---

## KEYBOARD SHORTCUTS

```typescript
// hooks/use-keyboard-shortcuts.ts
import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { dispatchCommand } from "@/stores/command-bus";

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Command palette
      if (meta && e.key === "k") { e.preventDefault(); useUIStore.getState().toggleCommandPalette(); }

      // Panel toggles
      if (meta && e.key === "b") { e.preventDefault(); useUIStore.getState().toggleSidebar(); }
      if (meta && e.key === "j") { e.preventDefault(); useUIStore.getState().toggleBottomPanel(); }
      if (meta && e.shiftKey && e.key === "B") { e.preventDefault(); useUIStore.getState().togglePropertiesPanel(); }

      // Undo/Redo
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); /* undo via zundo */ }
      if (meta && e.key === "z" && e.shiftKey) { e.preventDefault(); /* redo via zundo */ }

      // Delete selected
      if (e.key === "Backspace" || e.key === "Delete") {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          dispatchCommand({ type: "DELETE_SELECTED", payload: null, timestamp: Date.now() });
        }
      }

      // Simulation
      if (e.key === " " && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        dispatchCommand({ type: "TOGGLE_SIMULATION", payload: null, timestamp: Date.now() });
      }

      // Module switching (Cmd+1 through Cmd+9)
      if (meta && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const moduleIndex = parseInt(e.key) - 1;
        // Navigate to module
      }

      // Shortcuts help
      if (e.key === "?") {
        // Show shortcuts modal
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

---

## AUTH: requireAuth() — CRITICAL SECURITY PATTERN

```typescript
// lib/auth.ts
import { auth } from "@clerk/nextjs/server";

/**
 * EVERY Route Handler and Server Action MUST call this.
 * NEVER rely on middleware alone (CVE-2025-29927).
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return userId;
}
```

---

## VITEST SETUP (Mocks for React Flow)

```typescript
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// React Flow requires these browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Canvas context mock (for particle layer)
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), fill: vi.fn(),
  stroke: vi.fn(), save: vi.fn(), restore: vi.fn(),
  translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  drawImage: vi.fn(), fillText: vi.fn(),
});
```

---

## WHAT SUCCESS LOOKS LIKE (End of Phase 1)

After completing this phase, you should have:

1. ✅ `pnpm dev` runs and shows the app shell on localhost:3000
2. ✅ Dark theme renders with correct colors (#0C0D0F background, #6E56CF accent)
3. ✅ Activity bar shows 12 module icons, clicking navigates between routes
4. ✅ All 3 panels (sidebar, properties, bottom) resize via drag and collapse via shortcuts
5. ✅ Cmd+K opens command palette with fuzzy search
6. ✅ React Flow canvas renders with dot grid background and minimap
7. ✅ Zustand stores work — can add/remove nodes via console
8. ✅ IndexedDB saves state — refresh browser, state persists
9. ✅ Clerk auth — sign up, sign in, user avatar in activity bar
10. ✅ Database deployed — `drizzle-kit push` succeeded, tables exist in Neon
11. ✅ `pnpm build` succeeds with zero errors
12. ✅ `pnpm test` passes with at least 1 example test
13. ✅ PWA installable (shows install prompt on mobile)
14. ✅ No TypeScript `any` types
15. ✅ All keyboard shortcuts work (Cmd+B, Cmd+J, Cmd+K, Cmd+Shift+B)

---

## REFERENCE FILES FOR THIS PHASE

| What | File |
|---|---|
| Exact design tokens (61KB) | `research/22-architex-design-system.md` |
| Layout patterns (Linear, VS Code) | `research/10-uiux-developer-tools.md` |
| Canvas editor UI deep-dive | `research/22-canvas-editor-ui-deep-dive.md` |
| Tech stack versions + rationale | `research/04-tech-stack-recommendations.md` |
| Auth + security setup | `research/22-auth-security-compliance.md` |
| Database schema (ALREADY EXISTS) | `src/db/schema/*.ts` |
| Testing patterns | `research/15-testing-deployment.md` |
| Wireframe: Home Dashboard | `docs/wireframes/architex-wireframe-specs.md` (Screen 2) |
| Wireframe: System Design Editor | `docs/wireframes/architex-wireframe-specs.md` (Screen 4) |
