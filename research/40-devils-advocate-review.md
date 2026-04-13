# Devil's Advocate: Tech Stack Challenge

> Brutally honest review of every architectural decision. Finds the real problems.

---

## VERDICTS SUMMARY

| Decision | Verdict | Confidence |
|---|---|---|
| Next.js 16 | **CHANGE to Vite + React** (unless server-rendered pages needed) | High |
| React Flow | **KEEP with Adapter pattern** (abstract your model from React Flow's model) | Medium |
| Rust/WASM | **CHANGE to TypeScript Workers** (add WASM only for proven bottlenecks) | High |
| Zustand | **KEEP with strict conventions** (named actions, derived state, cross-store tests) | Medium |
| Yjs | **DEFER** (build single-player first, add collab in Phase 2) | High |
| shadcn/ui | **KEEP** (copy once, customize, delete CLI) | Low risk |
| Dexie (IndexedDB) | **KEEP with repository abstraction** (prepare to swap to SQLite WASM) | Medium |
| Tauri | **DEFER** (ship as PWA first, build desktop when demand exists) | High |
| Monaco | **CHANGE to CodeMirror 6** + Shiki for read-only | High |
| PostHog | **CHANGE to Plausible/Umami** for launch, PostHog at scale | High |

**Recommended changes: 4 decisions (Next.js, WASM, Monaco, PostHog)**
**Recommended deferrals: 2 decisions (Yjs collab, Tauri desktop)**
**Keep with guardrails: 4 decisions (React Flow, Zustand, shadcn, Dexie)**

---

## KEY ARGUMENTS

### 1. Next.js → Vite + React
- Architex is a client-side app masquerading as a web app
- Every node component needs `'use client'` — App Router adds complexity for zero benefit on the canvas
- Web Worker + WASM integration is simpler in Vite than Next.js
- `vite-plugin-pwa` is first-class; Next.js PWA requires a third-party wrapper
- **Exception:** Keep Next.js IF you have server-rendered marketing/docs pages co-located

### 2. React Flow — Keep But Abstract
- SVG will degrade at 500+ nodes with simultaneous simulation updates
- React reconciliation per node per frame is the real cost
- **Critical:** Build an Adapter pattern — your canonical node/edge model in Zustand must NOT be `ReactFlowNode/ReactFlowEdge`
- This lets you swap renderers later without rewriting 60+ components

### 3. Rust/WASM → TypeScript Workers
- Development velocity: 10-30s rebuild cycle for WASM vs instant HMR for TS
- Performance claim overstated: simulations are state machines, not tight loops
- Animation frame rate (16ms/frame) is the constraint, not raw computation
- Open-source contribution: order of magnitude fewer Rust contributors than TS
- **Strategy:** Start TS Workers, profile, port ONLY proven bottlenecks to WASM

### 4. Zustand — Keep With Conventions
- Risk: no built-in derived state, no action tracing, easy to create stale selectors
- **Must enforce:** Named actions (not raw `set`), derived state file per store, cross-store subscription tests

### 5. Yjs — Defer to Phase 2
- Tombstone accumulation is real (10-50x document growth after months)
- Integration with React Flow is non-trivial (bidirectional sync, infinite loop prevention)
- P2P needs signaling server; async collab needs persistent server anyway
- **Build single-player first.** Collaboration is Phase 2.

### 6. Monaco → CodeMirror 6
- 2MB for code panels where code editing is secondary
- IntelliSense not needed for generated code display
- Monaco's DOM event handling conflicts with React Flow's events
- **Use:** CodeMirror 6 (100KB) for editable, Shiki for read-only syntax highlighting

### 7. PostHog → Plausible/Umami
- PostHog self-hosted needs PostgreSQL + ClickHouse + Redis + Kafka (8 cores, 16GB RAM)
- $100-300/month infrastructure for a pre-revenue project
- **Start with:** Plausible ($9/mo) or Umami (free self-hosted on $5 VPS)
- Migrate to PostHog at 10K+ MAU when you need behavioral analytics

---

## THE META-PROBLEM

> "The most dangerous architectural decision is not which framework to use — it is building 12 modules simultaneously instead of shipping 2 modules that work flawlessly."

**The recommendation:** Ship System Design Simulator + Algorithm Visualizer as a Vite + React app with TypeScript Workers, CodeMirror 6, Zustand, Dexie, shadcn/ui, and Plausible. If those 2 modules find users, you've earned the right to add the other 10.
