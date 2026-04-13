# Tech Stack Recommendations

> Specific library choices with versions, bundle sizes, and rationale.

---

## COMPLETE PACKAGE LIST

| Category | Package | Version | Size | Why This |
|---|---|---|---|---|
| Framework | `next` | 16.2.x | — | App Router, Turbopack, TypeScript-first |
| Diagram Engine | `@xyflow/react` | 12.4.x | ~40KB | Built-in pan/zoom/select, nodes are React components |
| Animation | `motion` | 12.26.x | ~32KB | Formerly Framer Motion. Springs, stagger, layout |
| Layout Math | `d3` | 7.x | tree-shakeable | Only for force-directed layout math, NOT rendering |
| Code Editor | `@monaco-editor/react` | 4.7.0 | ~2MB (async) | Same as VS Code. 70+ languages, IntelliSense |
| UI Components | `shadcn/ui` + `tailwindcss` | latest + v4 | copied | Radix primitives, fully customizable |
| Command Palette | `cmdk` | ^1 | ~3KB | Used by Linear, Vercel. Fuzzy search, context-aware |
| Resizable Panels | `react-resizable-panels` | latest | ~5KB | By Brian Vaughn (ex-React core). VS Code-style |
| State Management | `zustand` | 5.0.x | ~3KB | Hook-based, slices, devtools, persist middleware |
| Undo/Redo | `zundo` | latest | ~1KB | Zustand middleware. 100-step history |
| Client Storage | `dexie` + `dexie-react-hooks` | 4.x | ~29KB | IndexedDB wrapper. `useLiveQuery` for reactive queries |
| Worker Comms | `comlink` | 4.x | ~1.1KB | Google Chrome Labs. Makes Workers feel like async calls |
| Collaboration | `yjs` + `y-webrtc` + `y-indexeddb` | latest | varies | CRDT framework. P2P sync, offline persistence |
| Image Export | `html-to-image` (or `snapdom`) | latest | ~3KB | snapdom is 2-6x faster for modern CSS |
| PDF Export | `jspdf` | latest | ~280KB | Co-maintained by yWorks (diagramming experts) |
| URL Sharing | `lz-string` | latest | ~3.5KB | Compress diagram state into shareable URL hash |
| File Compression | `fflate` | latest | ~8KB | Fastest DEFLATE in JS |
| File Access | `browser-fs-access` | latest | ~2KB | Google Chrome Labs. Native file picker |
| PWA | `@ducanh2912/next-pwa` | ^5 | — | Workbox-based, actively maintained |
| Icons | `lucide-react` | latest | tree-shakeable | Standard with shadcn/ui |
| Fonts | Geist (UI) + JetBrains Mono (code) | latest | — | |
| Testing | `vitest` | ^3 | dev | 2-5x faster than Jest, native ESM |
| Component Testing | `@testing-library/react` | ^16 | dev | |
| E2E | `@playwright/test` | ^1.49 | dev | Visual regression, cross-browser |
| Stories | `storybook` + `@storybook/react-vite` | ^8 | dev | Component catalog + interaction tests |
| Monitoring | `posthog-js` | ^1 | ~15KB | Privacy-friendly, no cookies |
| Errors | `@sentry/nextjs` | ^8 | — | Session replay, source maps |
| TypeScript | `typescript` | 5.7.x | dev | |

---

## WASM SIMULATION ENGINE (Rust)

```
Main Thread (React UI, 60fps)
  │ Comlink (async RPC)
  ▼
Worker Pool (2-4 Web Workers)
  │ wasm-bindgen
  ▼
WASM Module (Rust)
  ├── Graph algorithms
  ├── Sorting algorithms
  ├── System simulation (queuing theory)
  ├── Load balancer simulation
  ├── Consensus (Raft, Paxos)
  └── Force-directed layout
```

Build: `wasm-pack build --target web --release`
5-15× faster than JS for CPU-bound algorithms.

---

## WHY EACH CHOICE

### @xyflow/react over alternatives
- vs D3.js: Too low-level. React Flow gives nodes-as-React-components for free
- vs Konva.js: Canvas-based = no DOM = lose React composition inside nodes
- vs JointJS: Commercial license. React Flow is MIT

### motion over alternatives
- vs GSAP: Imperative. Motion's declarative API fits React state-driven animations
- vs React Spring: Less active. Motion surpassed in features
- vs Vamonos: Unmaintained, not React-compatible

### Monaco over alternatives
- vs CodeMirror 6: Lighter (~100KB vs ~2MB) but lacks IntelliSense
- vs Ace Editor: Legacy, surpassed by both

### zustand over alternatives
- vs Redux Toolkit: ~15KB, boilerplate, declining for new projects
- vs Jotai: Good for atomic state, harder for complex interconnected state like a diagram editor
- vs Recoil: Abandoned by Meta

### Dexie over alternatives
- vs localForage: Key-value only, no queries, no reactivity
- vs idb: Thin wrapper, no query builder, no React hooks
- vs PouchDB: Heavier, CouchDB protocol is overkill

### Tauri over Electron (for desktop)
- Binary size: 5-15 MB vs 150-300 MB
- RAM: ~50-80 MB vs ~200-500 MB
- Startup: <1s vs 2-5s
- Shared Rust toolchain with WASM build

---

## RENDERING ARCHITECTURE (4-Layer Hybrid)

```
Layer 4: HTML Overlay    — Tooltips, menus, command palette, code editor
Layer 3: SVG Interactive — React Flow nodes + edges (click, hover, drag)
Layer 2: Canvas Effects  — Particle flow, simulation FX, heatmaps
Layer 1: CSS Background  — Dot grid pattern
```

### Performance at Scale
- < 200 nodes: SVG (React Flow default, great)
- 200-1000: SVG with viewport culling + LOD (React Flow handles this)
- 1000+: Consider Canvas/WebGL fallback for the minimap
- Zoom > 40%: Full node detail
- Zoom 15-40%: Simplified (label only)
- Zoom < 15%: Colored dots
