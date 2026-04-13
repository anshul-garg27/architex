# Architex Performance Optimization Strategy

> Every millisecond counts for a developer tool. This document defines the performance budget, optimization patterns, monitoring infrastructure, and implementation checklist for Architex.

---

## 1. Performance Budget

### 1.1 Core Web Vitals Targets

| Metric | Target | Lighthouse Score Goal | Measurement Tool |
|---|---|---|---|
| First Contentful Paint (FCP) | < 1.2s | 90+ | Lighthouse, CrUX |
| Largest Contentful Paint (LCP) | < 2.5s | 90+ | Lighthouse, CrUX |
| Interaction to Next Paint (INP) | < 100ms | 90+ | CrUX, web-vitals |
| Cumulative Layout Shift (CLS) | < 0.05 | 95+ | Lighthouse, CrUX |
| Time to Interactive (TTI) | < 3.0s | 90+ | Lighthouse |
| Total Blocking Time (TBT) | < 200ms | 90+ | Lighthouse |

**Overall Lighthouse target: 95+ Performance score on desktop, 90+ on mobile (throttled 4G).**

### 1.2 Canvas Performance Targets

| Scenario | Target | Measurement |
|---|---|---|
| Render 100 nodes + 150 edges | < 200ms | `performance.mark/measure` |
| Render 500 nodes + 750 edges | < 500ms | `performance.mark/measure` |
| Render 1000 nodes + 1500 edges | < 1.0s | `performance.mark/measure` |
| Pan/zoom (any node count) | 60fps constant | `PerformanceObserver` frame timing |
| Node drag | 60fps constant | Frame timing |
| Algorithm step playback | 60fps | Frame timing |
| Particle animation (200 particles) | 60fps | Canvas 2D frame timing |
| Particle animation (1000 particles) | 30fps minimum | Canvas 2D frame timing |

### 1.3 Bundle Size Budget

| Category | Gzipped Target | Brotli Target |
|---|---|---|
| Initial JS (critical path) | < 250KB | < 200KB |
| Total JS (all lazy chunks loaded) | < 1MB | < 850KB |
| Initial CSS | < 40KB | < 32KB |
| WASM module (simulation engine) | < 300KB | < 250KB |
| Fonts (Geist + JetBrains Mono subset) | < 80KB | < 65KB |
| Total initial transfer (HTML+CSS+JS+fonts) | < 450KB | < 380KB |

### 1.4 Memory Budget

| Scenario | Target |
|---|---|
| Empty canvas (app shell only) | < 40MB |
| 100-node diagram, idle | < 80MB |
| 500-node diagram, idle | < 150MB |
| 500-node diagram, simulation running | < 200MB |
| 1000-node diagram, simulation running | < 300MB |
| Undo history (100 steps, 500 nodes) | < 20MB |
| WASM linear memory | < 16MB (initial), 64MB (max) |

### 1.5 Loading Time Budget

| Resource | Target |
|---|---|
| App shell (layout + sidebar + empty canvas) | < 1.5s |
| WASM module download + compile | < 500ms |
| Monaco Editor (lazy, on first panel open) | < 800ms |
| Template JSON (average 50-node diagram) | < 100ms |
| Collaboration module (Yjs + y-webrtc) | < 400ms (lazy) |
| Service Worker registration | < 200ms |

---

## 2. Initial Load Performance

### 2.1 Critical Rendering Path

Only these resources block first paint. Everything else is deferred or lazy-loaded.

**In the critical path (loaded synchronously):**
```
1. HTML shell (~5KB) -- Next.js SSR/RSC output
2. Critical CSS (~15KB) -- Tailwind critical extraction + CSS custom properties
3. App shell JS (~120KB gzip) -- React runtime, layout, sidebar icons, empty canvas
4. Geist font (woff2, ~25KB) -- UI font, preloaded
```

**Deferred (loaded after first paint, before interactive):**
```
5. React Flow core (~60KB gzip) -- Canvas engine, loaded as the main content area
6. Zustand stores (~8KB gzip) -- State management, hydrates from IndexedDB
7. Shadcn/ui components used in shell (~20KB gzip) -- Button, Tooltip, DropdownMenu
```

**Lazy (loaded on demand, never blocks initial render):**
```
8.  Monaco Editor (~450KB gzip) -- On bottom panel open (Cmd+J)
9.  WASM simulation engine (~300KB) -- On first simulation start or template load
10. Collaboration (Yjs + y-webrtc) (~80KB gzip) -- On Share/Collab button click
11. Module-specific node types -- On module switch (per-module chunks)
12. D3-force layout (~30KB gzip) -- On force-directed layout request
13. Export libraries (jspdf, html-to-image) (~100KB gzip) -- On export action
14. Dexie (IndexedDB) (~20KB gzip) -- After first paint, background init
15. PostHog analytics (~15KB gzip) -- requestIdleCallback after TTI
16. Sentry error tracking (~25KB gzip) -- requestIdleCallback after TTI
```

### 2.2 Code Splitting Strategy

Use a hybrid of route-based and component-based splitting. Each of the 12 modules gets its own chunk, and heavy components within each module are split further.

```typescript
// next.config.js -- Turbopack is the default bundler in Next.js 16
// No special bundler config needed; Turbopack handles splitting automatically.
// Focus on dynamic() usage in application code.

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',        // Tree-shake to only used icons
      '@radix-ui/react-*',   // Only import used primitives
      'motion',              // Tree-shake animation utilities
    ],
  },
};
```

**Route-based splitting (automatic via App Router):**

Each module route (`/system-design`, `/algorithms`, `/data-structures`, etc.) is its own route segment. Next.js App Router automatically code-splits at the route level. Each route's `page.tsx` imports only what that module needs.

```
app/(main)/
  layout.tsx           --> Shared shell chunk (~120KB)
  system-design/
    page.tsx           --> System design chunk (~45KB)
  algorithms/
    page.tsx           --> Algorithm viz chunk (~35KB)
  data-structures/
    page.tsx           --> Data structures chunk (~30KB)
  lld/
    page.tsx           --> LLD studio chunk (~40KB)
  database/
    page.tsx           --> Database lab chunk (~30KB)
  distributed/
    page.tsx           --> Distributed systems chunk (~35KB)
  networking/
    page.tsx           --> Networking chunk (~25KB)
  os/
    page.tsx           --> OS concepts chunk (~25KB)
  concurrency/
    page.tsx           --> Concurrency lab chunk (~25KB)
  security/
    page.tsx           --> Security chunk (~25KB)
  ml-design/
    page.tsx           --> ML design chunk (~30KB)
  interview/
    page.tsx           --> Interview engine chunk (~40KB)
```

**Component-based splitting (explicit via `next/dynamic`):**

```typescript
// components/canvas/panels/CodePanel.tsx
// Monaco Editor is the single heaviest dependency (~450KB gzip).
// It MUST be lazy-loaded. Never import at the top level.

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <CodePanelSkeleton />,
  }
);

// Pre-highlight with shiki while Monaco loads in background
// (modern-monaco pattern)
```

```typescript
// lib/wasm/loader.ts
// WASM module loaded via streaming compilation, never in critical path.

let wasmInstance: WasmSimulationEngine | null = null;

export async function loadWasmEngine(): Promise<WasmSimulationEngine> {
  if (wasmInstance) return wasmInstance;

  // Streaming compilation: compile while downloading
  const wasmModule = await WebAssembly.instantiateStreaming(
    fetch('/wasm/simulation-engine.wasm', {
      // Cache-busted via content hash in filename at build time
      headers: { 'Accept': 'application/wasm' },
    }),
    importObject
  );

  wasmInstance = wrapWasmExports(wasmModule.instance.exports);
  return wasmInstance;
}
```

```typescript
// Collaboration module -- lazy loaded on Share button click
const CollaborationProvider = dynamic(
  () => import('@/components/providers/CollaborationProvider'),
  { ssr: false }
);

// Export modules -- lazy loaded on export action
const exportPNG = () => import('@/lib/export/to-png');
const exportPDF = () => import('@/lib/export/to-pdf');
const exportMermaid = () => import('@/lib/export/to-mermaid');
```

### 2.3 Preload Hints for Likely Next Routes

Use the Next.js `<Link prefetch>` behavior combined with manual `<link rel="preload">` for predictive loading.

```typescript
// components/shared/ActivityBar.tsx
// The Activity Bar shows all 12 module icons.
// Prefetch the module the user hovers over for > 200ms.

function ActivityBarItem({ module, href }: { module: Module; href: string }) {
  const prefetchTimer = useRef<NodeJS.Timeout>();

  return (
    <Link
      href={href}
      prefetch={false} // disable automatic prefetch for ALL modules
      onPointerEnter={() => {
        // Prefetch after 200ms hover intent
        prefetchTimer.current = setTimeout(() => {
          router.prefetch(href);
        }, 200);
      }}
      onPointerLeave={() => {
        clearTimeout(prefetchTimer.current);
      }}
    >
      <module.icon />
    </Link>
  );
}
```

```typescript
// Preload WASM when user opens a template or starts typing in the canvas
// (they are likely to simulate soon)
function useWasmPreload() {
  useEffect(() => {
    // After app is interactive, preload WASM in idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = '/wasm/simulation-engine.wasm';
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    }
  }, []);
}
```

### 2.4 Font Loading Strategy

Use FOUT (Flash of Unstyled Text) with `font-display: swap` to avoid invisible text. The UI font (Geist) loads fast because it is small and preloaded. The code font (JetBrains Mono) can swap in later since the code panel is lazy.

```html
<!-- In app/layout.tsx <head> via next/font -->
<!-- next/font automatically handles preload + font-display: swap -->
```

```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
// JetBrains Mono loaded only when code panel opens:
// const jetbrainsMono = dynamic(() => import('next/font/google').then(...))
```

Subset fonts to Latin characters only. Geist woff2 at ~25KB. JetBrains Mono woff2 at ~30KB. Total font payload: ~55KB.

---

## 3. Canvas Rendering Performance

### 3.1 React Flow Optimization Checklist

Every item here is mandatory for hitting the 500-node / 60fps targets.

**Rule 1: Define nodeTypes and edgeTypes OUTSIDE the component.**

```typescript
// components/canvas/nodeTypes.ts
// This file is imported once. The object reference never changes.
import { type NodeTypes } from '@xyflow/react';
import { memo } from 'react';

import { LoadBalancerNode } from './nodes/system-design/LoadBalancerNode';
import { DatabaseNode } from './nodes/system-design/DatabaseNode';
import { CacheNode } from './nodes/system-design/CacheNode';
// ... 60+ node imports

// Every custom node component MUST be wrapped in React.memo
export const nodeTypes: NodeTypes = {
  loadBalancer: memo(LoadBalancerNode),
  database: memo(DatabaseNode),
  cache: memo(CacheNode),
  // ...
} as const;
```

**Rule 2: Memo every custom node and edge component.**

```typescript
// components/canvas/nodes/system-design/LoadBalancerNode.tsx
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function LoadBalancerNodeRaw({ data, selected }: NodeProps) {
  // Render logic here
  return (
    <div className={cn('architex-node', selected && 'ring-2 ring-primary')}>
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <LoadBalancerIcon />
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const LoadBalancerNode = memo(LoadBalancerNodeRaw);
```

**Rule 3: Batch node/edge updates. Never call setNodes in a loop.**

```typescript
// WRONG -- triggers N re-renders:
nodes.forEach((n) => setNodes((prev) => updateNode(prev, n)));

// CORRECT -- single re-render:
setNodes((prev) => {
  const next = [...prev];
  for (const update of updates) {
    const idx = next.findIndex((n) => n.id === update.id);
    if (idx !== -1) next[idx] = { ...next[idx], ...update };
  }
  return next;
});
```

**Rule 4: Disable expensive features at scale.**

```typescript
// hooks/useCanvasPerformanceMode.ts
export function useCanvasPerformanceMode(nodeCount: number) {
  return useMemo(() => ({
    // Disable animated edges when node count is high
    animateEdges: nodeCount < 200,
    // Simplify node rendering at high counts
    simplifiedNodes: nodeCount > 300,
    // Disable elevation changes on select (avoids z-index recalc)
    elevateEdgesOnSelect: nodeCount < 100,
    // Reduce minimap update frequency
    minimapInterval: nodeCount > 200 ? 500 : 100, // ms
    // Disable edge labels at very high counts
    showEdgeLabels: nodeCount < 400,
  }), [nodeCount]);
}
```

**Rule 5: Level-of-Detail (LOD) rendering based on zoom level.**

```typescript
// components/canvas/nodes/LODNodeWrapper.tsx
import { useStore } from '@xyflow/react';

const zoomSelector = (state: ReactFlowState) => state.transform[2];

function LODNodeWrapper({ children, data }: { children: React.ReactNode; data: NodeData }) {
  const zoom = useStore(zoomSelector);

  if (zoom < 0.15) {
    // Ultra-low detail: colored dot only
    return <div className="w-3 h-3 rounded-full" style={{ background: data.statusColor }} />;
  }

  if (zoom < 0.40) {
    // Low detail: icon + label only, no handles or metrics
    return (
      <div className="architex-node-simple">
        <data.Icon size={16} />
        <span className="truncate text-xs">{data.label}</span>
      </div>
    );
  }

  // Full detail
  return children;
}
```

### 3.2 SVG vs Canvas Rendering Decisions

React Flow uses SVG for nodes and edges (via React components in foreignObject). This is correct for interactive, accessible nodes. The particle animation layer uses a separate Canvas 2D overlay.

| Element | Renderer | Reason |
|---|---|---|
| Nodes | SVG (React Flow) | Interactive React components, accessible, DOM events |
| Edges (paths) | SVG (React Flow) | CSS-animated dash-offset, click targets |
| Edge particles (data flow) | Canvas 2D overlay | Hundreds of particles, 60fps, no DOM overhead |
| Minimap | OffscreenCanvas in Worker | Background rendering, no main-thread jank |
| Heatmaps | Canvas 2D overlay | Pixel-level rendering, performance |
| Selection box | SVG | Simple rectangle, needs DOM coordinates |
| Grid background | CSS | `background-image: radial-gradient(...)`, zero JS cost |

### 3.3 Particle Animation Architecture

The particle layer is the most performance-sensitive visual element. It runs on a separate Canvas element overlaid on the React Flow SVG.

```typescript
// components/canvas/overlays/ParticleLayer.tsx
import { useRef, useEffect } from 'react';
import { useStore } from '@xyflow/react';

const viewportSelector = (s: ReactFlowState) => ({
  x: s.transform[0],
  y: s.transform[1],
  zoom: s.transform[2],
});

export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useStore(viewportSelector);
  const particles = useSimulationStore((s) => s.particles);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [viewport, particles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}
```

**For > 500 particles, move to OffscreenCanvas in a Worker:**

```typescript
// workers/particle.worker.ts
let offscreen: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    offscreen = e.data.canvas;
    ctx = offscreen.getContext('2d')!;
  }
  if (e.data.type === 'frame') {
    const { particles, viewport } = e.data;
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }
};
```

### 3.4 Jank Prevention During Simulation

The simulation engine runs in a Web Worker. The main thread only receives pre-computed frame data. Never compute simulation math on the main thread.

```
Main Thread                    Worker Thread               WASM
  |                               |                         |
  |--start simulation------------>|                         |
  |                               |--init(config)---------->|
  |                               |                         |
  |                               |<--tick result-----------|
  |<--postMessage(frameData)------|                         |
  |                               |                         |
  |  requestAnimationFrame()      |<--tick result-----------|
  |  render particles + metrics   |                         |
  |                               |                         |
  |  (only reads frameData,       |  (runs at its own       |
  |   never computes physics)     |   tick rate, e.g. 30Hz) |
```

**Simulation tick rate vs render rate decoupling:**

The WASM simulation ticks at a fixed rate (e.g., 30 ticks/second for physics, independent of display refresh). The main thread interpolates between ticks for smooth 60fps rendering. This prevents the simulation from dropping frames.

---

## 4. WASM Optimization

### 4.1 Streaming Compilation

The WASM module MUST be loaded via `WebAssembly.instantiateStreaming()`, which compiles the module while it downloads. This halves load time compared to downloading first and then compiling.

**Requirements:**
- Server must send `Content-Type: application/wasm` header
- File must be served over HTTPS (or localhost)
- Use Brotli compression (Vercel does this automatically for `.wasm` files)

```typescript
// lib/wasm/loader.ts
export async function loadWasm() {
  // instantiateStreaming compiles WASM while downloading -- 2x faster
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('/wasm/simulation-engine.wasm'),
    {
      env: {
        // Minimal import object -- keep WASM self-contained
        log_message: (ptr: number, len: number) => {
          // Optional: pipe Rust println! to console
        },
      },
    }
  );
  return instance.exports as SimulationEngineExports;
}
```

### 4.2 WASM Caching via Service Worker

After the first download, cache the compiled WASM module in Cache Storage. Subsequent loads skip the network entirely.

```typescript
// service-worker.ts (via @ducanh2912/next-pwa)
const WASM_CACHE = 'wasm-v1';

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.wasm')) {
    event.respondWith(
      caches.open(WASM_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        // Cache the response for future loads
        cache.put(event.request, response.clone());
        return response;
      })
    );
  }
});
```

### 4.3 WASM Build Optimization

```bash
# wasm-engine/build.sh

# Step 1: Build with wasm-pack (release mode, LTO enabled)
wasm-pack build --target web --release

# Step 2: Run wasm-opt for additional size and speed optimization
# -Os: optimize for size (good balance for web delivery)
# --enable-bulk-memory: use bulk memory operations
# --enable-simd: use SIMD if available (with fallback)
# --strip-debug: remove debug info
# --strip-producers: remove producer info
# --vacuum: remove unused code
wasm-opt \
  -Os \
  --enable-bulk-memory \
  --strip-debug \
  --strip-producers \
  --vacuum \
  --dce \
  --duplicate-function-elimination \
  --merge-blocks \
  --remove-unused-names \
  pkg/simulation_engine_bg.wasm \
  -o pkg/simulation_engine_bg.wasm

echo "WASM size after optimization: $(wc -c < pkg/simulation_engine_bg.wasm) bytes"
```

```toml
# wasm-engine/Cargo.toml
[profile.release]
opt-level = "s"        # Optimize for size (or "z" for even smaller)
lto = true             # Link-Time Optimization -- critical for WASM size
codegen-units = 1      # Single codegen unit -- slower compile, smaller output
panic = "abort"        # No unwinding -- saves ~10KB
strip = "symbols"      # Strip symbols from binary
```

**Expected size:** Raw Rust WASM output ~800KB -> after wasm-opt: ~250-300KB -> after Brotli: ~180-220KB.

---

## 5. State Management Performance

### 5.1 Atomic Store Architecture

The store is split into 6+ atomic Zustand stores. This is the single most important architectural decision for preventing unnecessary re-renders.

```typescript
// stores/viewport.ts -- Changes 60 times/sec during pan/zoom
// Only components that read viewport data re-render during pan
const useViewportStore = create<ViewportState>()((set) => ({
  x: 0,
  y: 0,
  zoom: 1,
  setViewport: (v: Partial<ViewportState>) => set(v),
}));

// stores/canvas.ts -- Changes on node/edge add/delete/move
const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      // ...
    }),
    { name: 'architex-canvas', storage: createDexieStorage() }
  )
);

// stores/simulation.ts -- Changes during simulation ticks
const useSimulationStore = create<SimulationState>()((set) => ({
  isRunning: false,
  tick: 0,
  metrics: {},
  particles: [],
  // ...
}));

// stores/ui.ts -- Changes on panel toggle, theme switch
const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      propertiesOpen: true,
      bottomPanelOpen: false,
      activeModule: 'system-design',
      theme: 'dark',
    }),
    { name: 'architex-ui' }
  )
);

// stores/editor.ts -- Changes on code edit
const useEditorStore = create<EditorState>()((set) => ({
  activeFile: null,
  language: 'typescript',
  content: '',
}));

// stores/interview.ts -- Changes during interview mode
const useInterviewStore = create<InterviewState>()((set) => ({
  timer: 0,
  score: null,
  hints: [],
  challengeState: 'idle',
}));
```

### 5.2 Selector Patterns

**Use atomic selectors. Never select the whole store.**

```typescript
// WRONG -- re-renders on ANY store change:
const state = useCanvasStore();

// WRONG -- creates a new object reference every time:
const { nodes, edges } = useCanvasStore((s) => ({ nodes: s.nodes, edges: s.edges }));

// CORRECT -- scalar selector, re-renders only when nodeCount changes:
const nodeCount = useCanvasStore((s) => s.nodes.length);

// CORRECT -- useShallow for object/array selectors:
import { useShallow } from 'zustand/react/shallow';

const { nodes, edges } = useCanvasStore(
  useShallow((s) => ({ nodes: s.nodes, edges: s.edges }))
);
```

**When to use `useShallow` vs custom equality:**

| Scenario | Approach |
|---|---|
| Selecting a single primitive (string, number, boolean) | Plain selector `(s) => s.count` |
| Selecting an object with known keys | `useShallow((s) => ({ a: s.a, b: s.b }))` |
| Selecting a derived array (e.g., filtered nodes) | Custom equality with `useMemo` inside component |
| Selecting frequently-changing data (viewport) | Dedicated store, plain selector |
| Selecting data for a specific node by ID | `(s) => s.nodes.find(n => n.id === id)` with `Object.is` (reference stable if node unchanged) |

### 5.3 Separating Update Frequencies

```
                        Update Frequency
Store              ┌─────────────────────────────────────┐
                   │  60fps        10fps      < 1fps     │
                   │  (every 16ms) (every 100ms) (rare)  │
                   ├─────────────────────────────────────┤
useViewportStore   │  ████████                           │  Pan/zoom
useSimulationStore │  ████████                           │  Particles, metrics
useCanvasStore     │              ████████               │  Node positions (drag)
useEditorStore     │              ████████               │  Code typing
useUIStore         │                          ████████   │  Panel toggles
useInterviewStore  │                          ████████   │  Timer, score
                   └─────────────────────────────────────┘
```

The critical insight: viewport and simulation state change at 60fps. Canvas state changes at 10fps (node drag). UI state changes rarely. By splitting these into separate stores, a viewport pan does NOT re-render any node component, and a panel toggle does NOT re-render the canvas.

---

## 6. Memory Management

### 6.1 Memory Model for a 500-Node Diagram

```
Component                        Estimated Memory
─────────────────────────────────────────────────
React component tree (500 nodes)      ~25MB
  - 500 node components               ~15MB
  - 750 edge components               ~8MB
  - Handles, labels, overlays         ~2MB

Zustand store state                   ~5MB
  - Node data (500 * ~2KB each)       ~1MB
  - Edge data (750 * ~0.5KB each)     ~0.4MB
  - Simulation metrics                ~1MB
  - Undo history (100 steps)          ~2.5MB
    (structural sharing via Immer)

Canvas 2D context (particle layer)    ~8MB
  - 1920x1080 RGBA buffer             ~8MB

WASM linear memory                    ~8MB
  - Simulation state                  ~4MB
  - Algorithm step buffer             ~4MB

React Flow internals                  ~5MB
  - Spatial index (R-tree)            ~2MB
  - Edge routing cache                ~1.5MB
  - Viewport state                    ~0.5MB
  - Event listeners                   ~1MB

DOM nodes                             ~15MB
  - foreignObject wrappers            ~10MB
  - SVG path elements                 ~5MB

IndexedDB cache (Dexie)              ~0MB
  (stored on disk, not in memory)

TOTAL                                ~66MB (well under 150MB budget)
```

### 6.2 Undo History Memory Limits

Use `zundo` middleware with structural sharing. Cap at 100 steps. Each step stores only the diff, not a full snapshot.

```typescript
import { temporal } from 'zundo';

const useCanvasStore = create<CanvasState>()(
  temporal(
    (set) => ({ /* ... */ }),
    {
      limit: 100,              // Max 100 undo steps
      equality: (a, b) => a === b, // Structural equality
      // Partial tracking: only track nodes and edges, not transient state
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
```

Estimated memory per undo step (structural sharing): ~25KB average. 100 steps = ~2.5MB. This is well within budget.

### 6.3 Inactive Diagram Unloading

When a user switches between tabs (open diagrams), unload the React Flow instance and store data for inactive diagrams to IndexedDB. Keep only the active diagram in memory.

```typescript
// hooks/useDiagramLifecycle.ts
function useDiagramLifecycle(diagramId: string) {
  useEffect(() => {
    // On mount: load diagram from IndexedDB into store
    loadDiagramFromDB(diagramId);

    return () => {
      // On unmount: persist to IndexedDB, clear from store
      saveDiagramToDB(diagramId);
      clearCanvasStore();
    };
  }, [diagramId]);
}
```

### 6.4 WASM Memory Management

Rust WASM uses linear memory that grows but does not shrink. Manage this carefully.

```rust
// wasm-engine/src/lib.rs

// Configure initial and maximum memory
// 1 page = 64KB. 256 pages = 16MB initial. 1024 pages = 64MB max.
#[link_section = "memory"]
static MEMORY: [u8; 0] = [];
// Controlled via wasm-pack: --initial-memory=16777216 --max-memory=67108864
```

**Strategy:**
- Initial linear memory: 16MB (256 pages)
- Maximum linear memory: 64MB (1024 pages)
- After a simulation ends, call a `reset()` function in Rust that drops all simulation state and reuses the allocated memory for the next simulation
- Never rely on WASM garbage collection -- Rust manages its own memory

### 6.5 Memory Leak Prevention Checklist

| Source | Prevention |
|---|---|
| Event listeners on window/document | Always remove in `useEffect` cleanup |
| ResizeObserver / IntersectionObserver | Disconnect in cleanup |
| setInterval / setTimeout | Clear in cleanup |
| Web Worker references | Terminate workers on unmount |
| Canvas contexts | Null out references on unmount |
| Zustand subscriptions | `useStore` auto-unsubscribes; manual `subscribe()` must `unsub()` |
| React Flow instance | Call `reactFlowInstance.destroy()` on unmount |
| WASM references | Avoid circular references between JS and WASM |
| Comlink proxy objects | Call `proxy[Comlink.releaseProxy]()` when done |

**Automated leak detection (CI):**

```typescript
// e2e/memory-leak.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('no memory leak on diagram switch', async ({ page }) => {
  await page.goto('/system-design');

  // Open a 100-node template
  await page.click('[data-testid="template-twitter"]');
  const before = await page.evaluate(() => performance.memory?.usedJSHeapSize);

  // Switch to algorithms module and back 10 times
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="module-algorithms"]');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="module-system-design"]');
    await page.waitForLoadState('networkidle');
  }

  // Force GC
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });

  const after = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  // Allow 20% growth tolerance (some caching is expected)
  expect(after).toBeLessThan(before! * 1.2);
});
```

---

## 7. Network Performance

### 7.1 API Response Caching

Use SWR with aggressive staleTime for read-heavy data.

```typescript
// hooks/useTemplates.ts
import useSWR from 'swr';

export function useTemplates(category: string) {
  return useSWR(
    `/api/templates?category=${category}`,
    fetcher,
    {
      revalidateOnFocus: false,     // Templates don't change often
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,     // Dedupe requests within 60s
      // Templates are static -- cache for 1 hour
      // SWR will serve stale data instantly while revalidating in background
    }
  );
}

// For user-specific data (diagrams, progress), use shorter cache:
export function useUserDiagrams() {
  return useSWR('/api/diagrams', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5_000,
  });
}
```

### 7.2 Template Preloading

Preload templates the user is likely to open based on their current context.

```typescript
// When user opens the template gallery, preload the top 5 most popular
// templates as JSON in the background.
function TemplateGallery() {
  useEffect(() => {
    const popularTemplates = ['twitter-fanout', 'url-shortener', 'uber-dispatch',
                              'netflix-cdn', 'whatsapp'];
    popularTemplates.forEach((slug) => {
      // Uses SWR preload -- fetches but doesn't trigger re-render
      preload(`/api/templates/${slug}`, fetcher);
    });
  }, []);
  // ...
}
```

### 7.3 SVG Sprite Sheet for Component Icons

All 60+ component icons (Load Balancer, Database, Cache, etc.) are served as a single SVG sprite sheet, not as individual files. This eliminates 60+ HTTP requests.

```html
<!-- public/icons/component-sprites.svg -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-load-balancer" viewBox="0 0 24 24">
    <path d="..." />
  </symbol>
  <symbol id="icon-database" viewBox="0 0 24 24">
    <path d="..." />
  </symbol>
  <!-- ... 60+ symbols -->
</svg>
```

```typescript
// components/shared/ComponentIcon.tsx
export function ComponentIcon({ type }: { type: string }) {
  return (
    <svg className="w-5 h-5" aria-hidden="true">
      <use href={`/icons/component-sprites.svg#icon-${type}`} />
    </svg>
  );
}
```

The sprite sheet is ~15KB gzipped and cached aggressively by the Service Worker.

---

## 8. Build Optimization

### 8.1 Turbopack Configuration

Next.js 16 uses Turbopack by default. Key advantages over Webpack for Architex:
- Function-level caching (only recomputes what changed)
- Lazy bundling in dev (only bundles what the dev server requests)
- Faster HMR (~100ms vs ~500ms for Webpack)
- Automatic tree shaking of destructured dynamic imports

No special Turbopack config is needed for most cases. The key optimization happens at the application level (dynamic imports, barrel file avoidance).

### 8.2 Tree Shaking D3

D3 is a monolith if imported as `import * as d3 from 'd3'` (~300KB). Architex only uses `d3-force` for layout math. Import ONLY the specific subpackage.

```typescript
// WRONG -- imports all of D3 (~300KB):
import * as d3 from 'd3';
d3.forceSimulation(nodes);

// CORRECT -- imports only d3-force (~30KB):
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
forceSimulation(nodes);
```

Similarly for other partially-used packages:
- `lucide-react`: Use `optimizePackageImports` in next.config.js (already configured above)
- `@radix-ui`: Import individual packages, not the barrel

### 8.3 Monaco Editor Async Loading

Monaco is ~450KB gzipped. It must NEVER be in the initial bundle. The pattern:

```typescript
// components/canvas/panels/CodePanel.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { CodePanelSkeleton } from './CodePanelSkeleton';
import { ShikiHighlighter } from './ShikiHighlighter';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => null }
);

export function CodePanel({ code, language }: CodePanelProps) {
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  return (
    <div className="h-full">
      {/* Phase 1: Instant static highlight via Shiki (< 5KB) */}
      {!monacoLoaded && (
        <ShikiHighlighter code={code} language={language} />
      )}

      {/* Phase 2: Monaco loads in background, replaces Shiki */}
      <Suspense fallback={null}>
        <MonacoEditor
          value={code}
          language={language}
          onMount={() => setMonacoLoaded(true)}
          className={monacoLoaded ? '' : 'hidden'}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
      </Suspense>
    </div>
  );
}
```

**Progressive enhancement:** The user sees syntax-highlighted code instantly via Shiki (~5KB). Monaco loads in the background and takes over when ready. No blank panel, no loading spinner for code.

### 8.4 Bundle Analysis

```bash
# Install the analyzer
npm install @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**CI enforcement:** Run `@next/bundle-analyzer` in CI and fail the build if any chunk exceeds its budget.

```yaml
# .github/workflows/bundle-check.yml
- name: Check bundle sizes
  run: |
    ANALYZE=true npm run build
    node scripts/check-bundle-sizes.js
```

```typescript
// scripts/check-bundle-sizes.js
const BUDGETS = {
  'app/layout': 130_000,      // 130KB gzip
  'app/(main)/system-design/page': 50_000,
  'app/(main)/algorithms/page': 40_000,
  // ... per-route budgets
  '_total_initial': 250_000,   // 250KB gzip total initial
};
// Parse .next/analyze/ output and compare against budgets
```

---

## 9. Runtime Optimization

### 9.1 Web Worker Thread Pool

Architex uses 3 dedicated Web Workers managed via Comlink:

```typescript
// workers/pool.ts
import { wrap } from 'comlink';

interface WorkerPool {
  simulation: Worker;    // WASM simulation engine
  layout: Worker;        // Graph layout (d3-force, dagre, elk)
  algorithm: Worker;     // Algorithm step computation
}

let pool: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
  if (pool) return pool;

  pool = {
    simulation: new Worker(
      new URL('./simulation.worker.ts', import.meta.url),
      { type: 'module' }
    ),
    layout: new Worker(
      new URL('./layout.worker.ts', import.meta.url),
      { type: 'module' }
    ),
    algorithm: new Worker(
      new URL('./algorithm.worker.ts', import.meta.url),
      { type: 'module' }
    ),
  };

  return pool;
}

export function getSimulationWorker() {
  return wrap<SimulationWorkerAPI>(getWorkerPool().simulation);
}

export function getLayoutWorker() {
  return wrap<LayoutWorkerAPI>(getWorkerPool().layout);
}

export function getAlgorithmWorker() {
  return wrap<AlgorithmWorkerAPI>(getWorkerPool().algorithm);
}
```

**Worker lifecycle:**
- Workers are created lazily on first use (not at app start)
- Workers persist for the session (no create/destroy per operation)
- On module switch, workers are reused (they handle different task types)
- On page unload, workers are terminated via `beforeunload`

### 9.2 requestIdleCallback for Non-Critical Updates

```typescript
// hooks/useIdleCallback.ts
export function useIdleCallback(callback: () => void, deps: unknown[]) {
  useEffect(() => {
    const id = requestIdleCallback(callback, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }, deps);
}

// Usage: Load analytics after the app is interactive
function App() {
  useIdleCallback(() => {
    // PostHog analytics -- non-critical, load in idle time
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        persistence: 'memory',
        loaded: (ph) => ph.capture('$pageview'),
      });
    });
  }, []);

  useIdleCallback(() => {
    // Sentry error tracking -- non-critical
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
    });
  }, []);
}
```

### 9.3 Intersection Observer for Lazy Panel Loading

Bottom panel tabs (Code, Metrics, Timeline, Console) are not visible until the user opens the bottom panel. Use Intersection Observer to defer their rendering.

```typescript
// components/canvas/panels/BottomPanel.tsx
function BottomPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? (
        <Tabs defaultValue="code">
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>
          <TabsContent value="code">
            <CodePanel />  {/* Monaco loads here via dynamic() */}
          </TabsContent>
          {/* Other tabs are lazy too -- Tabs only mounts active tab */}
        </Tabs>
      ) : (
        <BottomPanelSkeleton />
      )}
    </div>
  );
}
```

### 9.4 Debounce and Throttle Patterns

| Update Source | Strategy | Interval | Reason |
|---|---|---|---|
| Simulation metrics display | `throttle` | 100ms (10fps) | Humans can't read numbers faster than 10Hz |
| Node position during drag | None (raw RAF) | 16ms (60fps) | Must feel instant |
| Viewport pan/zoom | None (raw RAF) | 16ms (60fps) | Must feel instant |
| Code editor onChange | `debounce` | 300ms | Avoid parsing on every keystroke |
| Search/filter input | `debounce` | 200ms | Avoid filtering on every keystroke |
| Window resize | `debounce` | 150ms | Recalculate canvas dimensions |
| Undo history capture | `debounce` | 500ms | Group rapid edits into one undo step |
| IndexedDB persist | `debounce` | 1000ms | Batch writes, reduce I/O |
| PostHog event tracking | `throttle` | 5000ms | Rate-limit analytics events |
| Minimap redraw | `throttle` | 200ms | Minimap doesn't need 60fps |

```typescript
// hooks/useThrottle.ts
export function useThrottledValue<T>(value: T, interval: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      setThrottled(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottled(value);
        lastUpdated.current = Date.now();
      }, interval - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttled;
}
```

---

## 10. Monitoring and Observability

### 10.1 Real User Monitoring (RUM)

Instrument the `web-vitals` library to capture Core Web Vitals from real users and report to PostHog.

```typescript
// lib/monitoring/web-vitals.ts
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function reportMetric(metric: { name: string; value: number; id: string }) {
  // Report to PostHog as a custom event
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_id: metric.id,
      route: window.location.pathname,
    });
  }

  // Also report to Vercel Analytics (if using Vercel)
  if (typeof window !== 'undefined' && window.va) {
    window.va('vitals', metric);
  }
}

export function initWebVitals() {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
}
```

### 10.2 Canvas Performance Metrics

Custom performance marks for canvas-specific operations.

```typescript
// lib/monitoring/canvas-metrics.ts
export function measureCanvasRender(nodeCount: number) {
  performance.mark('canvas-render-start');

  return {
    end() {
      performance.mark('canvas-render-end');
      const measure = performance.measure(
        'canvas-render',
        'canvas-render-start',
        'canvas-render-end'
      );

      // Report to PostHog
      window.posthog?.capture('canvas_render', {
        node_count: nodeCount,
        duration_ms: measure.duration,
        exceeded_budget: measure.duration > (nodeCount > 200 ? 500 : 200),
      });

      // Log warning if budget exceeded
      if (measure.duration > 500) {
        console.warn(
          `[Perf] Canvas render took ${measure.duration.toFixed(0)}ms ` +
          `for ${nodeCount} nodes (budget: ${nodeCount > 200 ? 500 : 200}ms)`
        );
      }
    },
  };
}
```

### 10.3 Frame Rate Monitor (Development Only)

```typescript
// components/shared/DevFPSMonitor.tsx
// Only shown in development mode
export function DevFPSMonitor() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let frames = 0;
    let lastTime = performance.now();

    function tick() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(tick);
    }

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-2 right-2 z-[9999] bg-black/80 text-xs font-mono px-2 py-1 rounded">
      <span className={fps < 30 ? 'text-red-400' : fps < 55 ? 'text-yellow-400' : 'text-green-400'}>
        {fps} FPS
      </span>
    </div>
  );
}
```

### 10.4 WASM Performance Tracking

```typescript
// lib/monitoring/wasm-metrics.ts
export async function measureWasmLoad() {
  performance.mark('wasm-load-start');
  const engine = await loadWasmEngine();
  performance.mark('wasm-load-end');

  const measure = performance.measure('wasm-load', 'wasm-load-start', 'wasm-load-end');

  window.posthog?.capture('wasm_load', {
    duration_ms: measure.duration,
    exceeded_budget: measure.duration > 500,
    cached: measure.duration < 50, // Cache hit is typically < 50ms
  });

  return engine;
}
```

### 10.5 Memory Monitoring

```typescript
// lib/monitoring/memory-monitor.ts
export function startMemoryMonitor(intervalMs = 30_000) {
  if (!('memory' in performance)) return;

  setInterval(() => {
    const mem = (performance as any).memory;
    const usedMB = Math.round(mem.usedJSHeapSize / 1048576);
    const totalMB = Math.round(mem.totalJSHeapSize / 1048576);

    if (usedMB > 250) {
      console.warn(`[Perf] High memory usage: ${usedMB}MB / ${totalMB}MB`);
      window.posthog?.capture('high_memory', {
        used_mb: usedMB,
        total_mb: totalMB,
        node_count: useCanvasStore.getState().nodes.length,
      });
    }
  }, intervalMs);
}
```

---

## 11. Performance Testing in CI

### 11.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/system-design
            http://localhost:3000/algorithms
          budgetPath: .lighthouserc-budget.json
          uploadArtifacts: true
```

```json
// .lighthouserc-budget.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1200 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }]
      }
    }
  }
}
```

### 11.2 Bundle Size CI Check

```yaml
# Part of the main CI workflow
- name: Bundle size check
  run: |
    npm run build
    node scripts/check-bundle-sizes.js --fail-on-increase=5
```

### 11.3 Canvas Performance Regression Tests

```typescript
// e2e/performance/canvas-render.spec.ts
import { test, expect } from '@playwright/test';

test('100 nodes render under 200ms', async ({ page }) => {
  await page.goto('/system-design');
  await page.evaluate(() => {
    performance.mark('render-start');
  });

  // Load the 100-node stress test template
  await page.click('[data-testid="template-stress-100"]');
  await page.waitForSelector('[data-testid="node-99"]');

  const duration = await page.evaluate(() => {
    performance.mark('render-end');
    return performance.measure('render', 'render-start', 'render-end').duration;
  });

  expect(duration).toBeLessThan(200);
});

test('pan/zoom maintains 60fps with 200 nodes', async ({ page }) => {
  await page.goto('/system-design');
  await page.click('[data-testid="template-stress-200"]');

  // Simulate a pan gesture and measure frame rate
  const fps = await page.evaluate(async () => {
    const canvas = document.querySelector('.react-flow__viewport')!;
    let frames = 0;
    const start = performance.now();

    return new Promise<number>((resolve) => {
      function countFrame() {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frames);
        }
      }

      // Trigger a pan
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: -100, deltaY: 0 }));
      requestAnimationFrame(countFrame);
    });
  });

  expect(fps).toBeGreaterThanOrEqual(55); // Allow 5fps tolerance
});
```

---

## 12. Implementation Checklist

### Phase 0: Foundation (before any feature code)

- [ ] Configure Turbopack + `optimizePackageImports` in next.config.js
- [ ] Set up `@next/bundle-analyzer` and per-route budget scripts
- [ ] Set up Lighthouse CI in GitHub Actions with budget assertions
- [ ] Create the atomic Zustand store architecture (6 stores, no monolith)
- [ ] Define `nodeTypes` and `edgeTypes` in a static file outside components
- [ ] Wrap every custom node/edge in `React.memo`
- [ ] Set up Playwright performance test scaffolding

### Phase 1: Critical Path Optimization

- [ ] Implement app shell SSR (layout + sidebar + empty canvas, no dynamic imports)
- [ ] Configure font loading (Geist preload, JetBrains Mono deferred)
- [ ] Create SVG sprite sheet for component icons
- [ ] Implement LOD rendering (3 zoom levels)
- [ ] Set up Service Worker with WASM caching
- [ ] Implement `useCanvasPerformanceMode` (auto-disable features at scale)

### Phase 2: Lazy Loading Pipeline

- [ ] Monaco Editor: `next/dynamic` with `ssr: false`, Shiki placeholder
- [ ] WASM module: streaming compilation + Service Worker cache
- [ ] Collaboration module: lazy load on Share button
- [ ] Export modules: lazy load on export action
- [ ] Analytics (PostHog): `requestIdleCallback` after TTI
- [ ] Error tracking (Sentry): `requestIdleCallback` after TTI
- [ ] Module-specific node types: per-route chunks

### Phase 3: Runtime Performance

- [ ] Web Worker pool (simulation, layout, algorithm)
- [ ] Comlink wrappers for all worker communication
- [ ] Particle layer on Canvas 2D (< 500 particles on main thread)
- [ ] OffscreenCanvas for > 500 particles
- [ ] Simulation tick/render decoupling (30Hz sim, 60fps render)
- [ ] Throttle metrics display at 10fps
- [ ] Debounce code editor changes at 300ms
- [ ] Debounce IndexedDB persistence at 1000ms
- [ ] Undo history with structural sharing, 100-step cap

### Phase 4: WASM Build Pipeline

- [ ] Rust Cargo.toml: `opt-level = "s"`, `lto = true`, `panic = "abort"`
- [ ] wasm-opt: `-Os --strip-debug --vacuum --dce`
- [ ] Verify WASM size < 300KB gzip
- [ ] Verify WASM load time < 500ms on throttled 4G
- [ ] WASM linear memory: 16MB initial, 64MB max

### Phase 5: Monitoring

- [ ] `web-vitals` instrumentation -> PostHog
- [ ] Canvas render `performance.mark/measure`
- [ ] WASM load time tracking
- [ ] Memory monitoring (warn at > 250MB)
- [ ] FPS monitor (dev mode only)
- [ ] Memory leak regression test (Playwright)
- [ ] Bundle size regression test (CI)

### Phase 6: Continuous Optimization

- [ ] Run Lighthouse on every PR (block merge if score < 90)
- [ ] Run bundle analysis monthly, review chunk sizes
- [ ] Review PostHog web vitals dashboard weekly
- [ ] Canvas render time benchmarks for 100, 500, 1000 nodes
- [ ] Profile with Chrome DevTools Performance panel quarterly

---

## 13. Lighthouse Score Achievement Strategy

To hit 95+ on desktop and 90+ on mobile:

| Lighthouse Audit | How Architex Achieves It |
|---|---|
| **Eliminate render-blocking resources** | Only critical CSS inline. All JS uses `defer` or `async`. Monaco, WASM, Yjs all lazy-loaded. |
| **Reduce unused JavaScript** | Tree-shaking (D3, Radix, Lucide). Per-module code splitting. No barrel imports. |
| **Minimize main thread work** | WASM + Web Workers for all computation. Main thread only renders React + Canvas overlay. |
| **Reduce JavaScript execution time** | React Compiler auto-memoization. Memo on all nodes/edges. Atomic stores prevent cascade re-renders. |
| **Avoid large layout shifts** | Skeleton loaders for Monaco, bottom panel. Fixed sidebar width. Reserved space for all panels. |
| **Use efficient cache policy** | Service Worker caches WASM, fonts, sprites. Vercel Edge caches API responses. SWR for client-side caching. |
| **Reduce network payloads** | Brotli compression. SVG sprites (not individual icons). Font subsetting. WASM-opt size reduction. |
| **Properly size images** | No raster images in the app (all SVG/CSS). OG images generated server-side at correct dimensions. |
| **Serve images in modern formats** | N/A -- SVG only. If any raster images are needed, use `next/image` with AVIF/WebP. |
| **Enable text compression** | Vercel enables Brotli automatically. Verify `Content-Encoding: br` on all text assets. |
| **Avoid DOM size** | React Flow viewport culling. LOD rendering. Only visible nodes in DOM. Max ~200 DOM nodes at any zoom. |

---

## 14. Quick-Reference: What Goes Where

```
Critical Path (blocks first paint):
  React runtime, App shell, Layout CSS, Geist font

After First Paint (before interactive):
  React Flow core, Zustand stores, Shadcn base components, IndexedDB init

On User Action (lazy, on demand):
  Monaco Editor       -> on bottom panel open
  WASM Engine         -> on simulation start / template load
  Collaboration (Yjs) -> on Share / Collab click
  Export (PDF/PNG)     -> on Export action
  D3-force            -> on force layout request

Background (idle time, non-critical):
  PostHog analytics   -> requestIdleCallback
  Sentry errors       -> requestIdleCallback
  Service Worker reg  -> after load event
  Template preloading -> after gallery open
  WASM preload hint   -> after canvas interaction
```

---

## Sources

- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance)
- [React Flow Large Graph Discussion](https://github.com/xyflow/xyflow/discussions/4975)
- [Zustand useShallow Documentation](https://zustand.docs.pmnd.rs/hooks/use-shallow)
- [Zustand Prevent Rerenders Guide](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading)
- [Next.js Bundle Analysis](https://nextjs.org/docs/app/guides/package-bundling)
- [Next.js 16.2 Turbopack Improvements](https://nextjs.org/blog/next-16-2-turbopack)
- [WebAssembly.instantiateStreaming (MDN)](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static)
- [Binaryen wasm-opt](https://github.com/WebAssembly/binaryen)
- [Rust & WASM in 2026](https://dev.to/dataformathub/rust-wasm-in-2026-a-deep-dive-into-high-performance-web-apps-20c6)
- [Web Workers Best Practices 2025](https://medium.com/@QuarkAndCode/web-workers-in-javascript-limits-usage-best-practices-2025-a365b36beaa2)
- [The State of WebAssembly 2025-2026](https://platform.uno/blog/the-state-of-webassembly-2025-2026/)
