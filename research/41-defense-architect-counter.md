# Defense Architect: Tech Stack Counter-Arguments

> Every criticism addressed with evidence, real-world examples, and migration paths.

---

## REVERSIBILITY MATRIX (Every Decision Is Escapable)

| Decision | Reversibility | Migration Effort | Risk of Needing To |
|---|---|---|---|
| Next.js 16 | HIGH | 2-3 weeks | LOW |
| React Flow | MEDIUM | 3-5 weeks | LOW |
| Rust/WASM | HIGH | 1-2 weeks (to JS) | LOW |
| Zustand | HIGH | 1-2 weeks | LOW |
| Yjs | MEDIUM | 4-6 weeks | LOW |
| shadcn/ui | HIGH | Incremental | VERY LOW |
| Dexie (IndexedDB) | HIGH | 1-2 weeks | LOW |
| Tauri v2 | MEDIUM | 2-3 weeks | MEDIUM |
| Monaco | HIGH | 1 week | LOW |
| PostHog | HIGH | 1-2 weeks | LOW |

---

## KEY COUNTER-ARGUMENTS

### 1. Next.js IS Correct (Despite Canvas-Heavy Nature)
- Architex is NOT just a canvas. It has marketing pages, template gallery, user dashboard, docs.
- Server-rendered shell + client canvas subtree = exactly how App Router is designed
- Evidence: Vercel's v0.dev (canvas-heavy, built on Next.js), Linear, Notion
- Turbopack + edge deployment + image optimization = real value

### 2. React Flow — Nodes as React Components Is the Killer Feature
- System design nodes embed dropdowns, inputs, metrics, charts — Canvas/WebGL would require reimplementing all UI
- Accessibility: SVG = DOM = screen readers + tab order + dev tools. Canvas is an a11y black hole
- Viewport culling + LOD handles 1000+ nodes (benchmarked by xyflow team)
- Evidence: n8n (45K stars), Langflow, Stripe, Buildkite — all React Flow in production

### 3. WASM Performance Gap Is Real (Not Overstated)
- Monte Carlo simulation: 100K requests × 5000 steps = 500M operations
- JS: 8-15 seconds. WASM: 1-3 seconds. Difference = "interactive" vs "spinner"
- WASM module is 2-5K lines of Rust — well-defined boundary, not a full app
- `serde-wasm-bindgen` makes JS↔WASM boundary nearly transparent
- Evidence: Figma (C++→WASM), AutoCAD Web, Google Earth

### 4. Zustand Beats Redux for This Use Case
- React Flow itself uses Zustand internally — one paradigm, not two
- `getState()`/`setState()` align perfectly with React Flow's imperative callbacks
- WASM interop: `setState({ results: wasmOutput })` is one line vs Redux action/reducer chain
- `zundo` gives undo/redo for free (critical for design tools)
- Evidence: React Flow, Excalidraw, pmndrs ecosystem

### 5. Yjs Over Liveblocks (Vendor Independence Is Existential)
- Liveblocks pricing: MAU-based → perverse incentive against growth. $500+/mo at 10K MAU
- Offline-first: Yjs CRDTs merge on reconnect. Liveblocks requires their cloud.
- P2P: Enterprise users won't send diagrams through third-party servers
- Tombstone mitigation: `doc.gc`, periodic snapshots. Diagrams are small docs (50-500 nodes, <5MB even after 6 months)
- Evidence: Notion, JupyterLab, BlockSuite, Tiptap, Huly

### 6. shadcn/ui — Owning Components Is a Feature
- 60+ custom node components need pixel-perfect control no library provides
- Radix breaking changes are rare (1 major in 3 years)
- `npx shadcn diff` shows exactly what changed for selective updates
- Evidence: Vercel, Cal.com, Resend, Dub.co

### 7. Dexie (IndexedDB) — Correct Default
- Browser support: ALL browsers, all platforms. OPFS: Chrome 102+, partial Safari
- `y-indexeddb` exists and is battle-tested for Yjs persistence
- `useLiveQuery()` = reactive persistence for free
- `dexie-cloud-addon` provides optional cloud sync path
- Evidence: Notion, Figma, Excalidraw, Obsidian all use IndexedDB

### 8. Tauri — 15MB vs 300MB IS Brand Positioning
- Developers notice and judge by resource footprint
- Rust backend can run simulation natively (additional 2-3x over WASM)
- Tauri v2 plugins cover filesystem, system tray, auto-update, deep links
- WebView2 on Windows = Chromium consistency
- Evidence: 1Password migrated away from Electron to WebView model

### 9. Monaco — IntelliSense Justifies the Size
- Async loaded → no impact on initial load or Lighthouse scores
- Users will edit Terraform, K8s YAML, Docker Compose, custom configs
- Schema validation for YAML/JSON via JSON Schema = errors caught immediately
- Tree-shaking reduces actual bundle to 800KB-1.2MB
- Evidence: GitHub (github.dev), StackBlitz, Vercel, Azure Portal

### 10. PostHog — Self-Hostable = Developer Trust
- Ad blockers block GA, Amplitude, Mixpanel. Not first-party PostHog.
- PostHog Cloud free tier: 1M events/mo (covers through 10K MAU)
- One SDK replaces 3-4 separate vendor integrations
- ClickHouse handles tens of millions of events easily at our scale
- Evidence: Y Combinator companies, Phantom, Hasura, AssemblyAI

---

## HONEST ADMISSIONS (Genuine Trade-offs)

1. **Tauri is the riskiest bet** — WebKitGTK on Linux is real QA burden. Budget 20% of QA for cross-platform testing.
2. **Yjs tombstones are real** — Build GC into collaboration layer by month 6-9.
3. **Rust/WASM has hiring constraint** — If no Rust dev on founding team, start with TS Workers.
4. **Monaco is large** — Use CodeMirror 6 for read-only code display where IntelliSense isn't needed.
