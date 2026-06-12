# 13 — Performance Review

**Date:** 2026-05-07  
**Scope:** Static analysis only. No Lighthouse, no runtime profiling. All findings are derived from source reading.  
**Codebase root:** `architex/`  
**Reviewer:** Performance Optimizer agent

---

## 1. Summary

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 6 | SSE fake-stream, missing `optimizePackageImports`, full-nodes subscriptions (15+ sites), auth sequential awaits on every route, `metricsHistory` slice outside `useMemo`, devtools in production deps |
| MEDIUM | 8 | Alignment guide O(n) per drag frame, MiniMap `getComputedStyle` per node, `updateNodeData` full-clone on every single-field patch, undo stack 100 full-state clones, `spawnParticles` recreated per metrics tick, `lastOpenedAt` fire-and-forget candidate, timer/cleanup mismatches in module files, unused `dexie` dep |
| LOW | 5 | `lz-string` URL cap at 2 KB, snapshot array 50× full canvas clones, module-level Clerk `require`, `prism-react-renderer` single-consumer (lazy candidate), `comlink` in deps but unused |
| Already-good | 9 | LOD tiers (BaseNode), NodeMetricsOverlay direct-DOM, 14 dynamic module imports, ParticleLayer RAF + visibility API, worker idle auto-terminate, OG edge runtime + long cache headers, all 76 node types memo'd, granular Zustand selectors on SimulationDashboard, worker SSR fallback |

---

## 2. Bundle Review

### 2.1 Config audit

**File:** `next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  async headers() { ... }
};
```

**Missing:** `optimizePackageImports` is absent. Next.js 15+ tree-shakes barrel packages automatically when this key is set. Without it, every `import { X } from "lucide-react"` pulls the entire icon barrel through the module graph on the first import that lands in a given chunk.

**Missing:** `modularizeImports` is absent (alternative for pre-15 installs; here it is redundant if `optimizePackageImports` is set).

**Recommended addition** (no code changes to application files required):

```ts
experimental: {
  optimizePackageImports: ["lucide-react", "motion", "@xyflow/react"],
},
```

**Bundle analyzer** is wired behind `ANALYZE=true` (`package.json` scripts) — good, but no CI gate enforces the limits.

### 2.2 Size limits

**File:** `.size-limit.json`

| Budget | Limit (gzip) | Gap vs. web target |
|--------|--------------|-------------------|
| Main chunk | 250 KB | +100 KB over 150 KB landing target |
| Framework chunk | 250 KB | generous (React alone ~45 KB, Next.js ~130 KB) |
| Page chunks | 100 KB | reasonable |

The 250 KB main limit is double the recommended 150 KB gzipped JS budget for a landing page (`rules/web/performance.md`). For an SPA canvas editor the bar is different, but no separate budget exists for the canvas route vs. the marketing/auth pages.

### 2.3 Top bundle offenders (import-graph estimate)

| Package | Estimated gzip | Notes |
|---------|---------------|-------|
| `@xyflow/react` v12 | ~120–150 KB | Includes React Flow, d3-selection, internals |
| `motion` v12 | ~50–80 KB | Full motion library; `LazyMotion` used in some places |
| `lucide-react` v1.8 | ~30–60 KB without tree-shaking | Barrel re-export; `optimizePackageImports` fixes this |
| `@dagrejs/dagre` v3 | ~35 KB | Used in layout worker; could be worker-only |
| `prism-react-renderer` v2.4 | ~25 KB | Single consumer: `LLDProperties.tsx`; lazy candidate |
| `@mdx-js/mdx` v3 | ~60 KB+ | Only used server-side or in specific module; verify RSC boundary |
| `@tanstack/react-query-devtools` | ~40 KB | **In `dependencies`, ships to production** (see §2.4) |
| `dexie` v4 | ~30 KB | In `package.json` but `idb-store.ts` uses raw `indexedDB` API |

### 2.4 HIGH — DevTools in production dependencies

**File:** `package.json`

`@tanstack/react-query-devtools` is listed under `dependencies`, not `devDependencies`. If it is imported anywhere without a `process.env.NODE_ENV === 'development'` guard, it ships ~40 KB to every production user.

**Check:** search for the import site and confirm it is guarded or move to `devDependencies`.

### 2.5 LOW — `dexie` unused

**File:** `package.json`  
`dexie ^4.0` is declared as a dependency. `src/lib/idb-store.ts` uses raw `indexedDB` API throughout. If `dexie` is not used elsewhere, remove it to eliminate ~30 KB from the install footprint (it may still be tree-shaken if never imported, but the declared dep is a maintenance hazard).

### 2.6 LOW — `comlink` declared, not used

**File:** `package.json`, `src/lib/workers/worker-bridge.ts`  
`comlink` is listed in dependencies. `worker-bridge.ts` implements its own message-ID correlation bridge without using Comlink's API. If Comlink is not used elsewhere, remove the dependency (~5 KB gzip, but a maintenance signal that the bridge API is bespoke).

---

## 3. Render Review

### 3.1 Canvas — Alignment guides: O(n) per drag frame

**File:** `src/components/canvas/DesignCanvas.tsx`  
**Functions:** `findAlignmentGuides`, `findDistanceIndicators`  
**Trigger:** `onNodeDrag` callback — fires on every pointer-move event during a drag

Both functions iterate over all nodes to compute proximity thresholds. On a canvas with 50 nodes, every `mousemove` fires two O(n) scans. At 60 fps this is 6 000 iterations per second minimum, more with denser graphs.

**Pattern to add:** throttle `onNodeDrag` to ~60 ms (one frame at 16 ms, but alignment guides don't need sub-frame precision):

```ts
const onNodeDrag = useCallback(
  throttle((_e, node) => {
    const guides = findAlignmentGuides(node, nodes);
    setAlignmentGuides(guides);
  }, 60),
  [nodes]
);
```

Or spatially index node positions once on drag start and reuse during drag.

### 3.2 Canvas — MiniMap `nodeColor` calls `getComputedStyle` per node per render

**File:** `src/components/canvas/DesignCanvas.tsx`  
**Function:** `nodeColor` callback passed to `<MiniMap>`

`getComputedStyle(document.documentElement)` is called for every node during every MiniMap render. For 50 nodes this is 50 forced style recalculations per render. CSS custom property reads via `getComputedStyle` are not free — they flush pending style work.

**Fix:** compute the color map once outside the callback, or cache via `useRef` and refresh only on theme change:

```ts
const cssColorCache = useRef<Record<string, string>>({});
const nodeColor = useCallback((node: Node) => {
  const varName = nodeTypeToVar(node.type);
  if (!cssColorCache.current[varName]) {
    cssColorCache.current[varName] = getComputedStyle(document.documentElement)
      .getPropertyValue(varName).trim();
  }
  return cssColorCache.current[varName];
}, []);
```

### 3.3 Canvas — 12 separate store subscriptions

**File:** `src/components/canvas/DesignCanvas.tsx`  
Each field is selected via a separate `useCanvasStore((s) => s.X)` call. This is correct for preventing cross-field re-renders (granular selectors), but creates 12 Zustand subscriptions per mounted DesignCanvas. This is acceptable at one instance, but worth noting for future multi-canvas support.

### 3.4 Canvas — 15+ components subscribe to full nodes array

**Files (sample):**
- `src/components/canvas/DesignCanvas.tsx:68`
- `src/components/canvas/overlays/HeatmapOverlay.tsx:157`
- `src/components/canvas/overlays/RequestTrace.tsx:314`
- `src/components/canvas/overlays/NodeMetricsOverlay.tsx:46`
- `src/components/canvas/overlays/SLADashboard.tsx:170`
- `src/components/canvas/overlays/CostMonitor.tsx:50`
- `src/components/canvas/zones/GroupZone.tsx:19`
- `src/components/canvas/WhatIfPanel.tsx:143`
- `src/components/canvas/panels/LayoutPicker.tsx:50`
- `src/components/canvas/panels/CanvasDescription.tsx:164`
- `src/components/canvas/panels/NodeListPanel.tsx:91`
- `src/components/canvas/status-bar.tsx:101`
- `src/components/dialogs/ShareDialog.tsx:54`
- `src/components/dialogs/export-dialog.tsx:122`
- `src/components/dialogs/import-dialog.tsx:51`
- `src/components/canvas/modes/ChallengeOverlay.tsx:671`
- `src/components/canvas/modes/MockInterviewMode.tsx:168`
- `src/components/panels/PropertiesSheet.tsx:113`
- `src/components/canvas/modes/DesignBattle.tsx:130`
- `src/components/canvas/modes/TimeAttackMode.tsx:96`

Pattern in each: `useCanvasStore((s) => s.nodes)` — subscribes to the full `Node[]` array. Zustand performs a reference-equality check, so any update to any node (position change, data patch, selection state) re-renders all 20 of these components.

For components that only need node *count*, node *IDs*, or a subset of node types, replace with a derived selector:

```ts
// Instead of:
const nodes = useCanvasStore((s) => s.nodes);

// Count only:
const nodeCount = useCanvasStore((s) => s.nodes.length);

// IDs only (stable reference via useShallow):
const nodeIds = useCanvasStore(useShallow((s) => s.nodes.map((n) => n.id)));
```

Components that genuinely need the full node list for iteration (export-dialog, import-dialog, ShareDialog) are justified, but overlays like `SLADashboard` and `CostMonitor` likely only need aggregated metrics.

### 3.5 Render — `MetricsDashboard` slice outside `useMemo`

**File:** `src/components/visualization/charts/MetricsDashboard.tsx`

```ts
const metricsHistory = useSimulationStore((s) => s.metricsHistory);
const last60 = metricsHistory.slice(-60); // recomputes every render
// ... then map over last60 multiple times, also outside useMemo
```

`metricsHistory` grows to 1 000 entries (capped in `simulation-store.ts`). The `slice(-60)` and subsequent `map()` calls run on every re-render triggered by any simulation store change, even if `metricsHistory` itself has not changed (e.g., `status` changes cause this component to re-render and repeat the slice).

**Fix:**

```ts
const last60 = useMemo(
  () => metricsHistory.slice(-60),
  [metricsHistory]
);
```

And consolidate any derived arrays from `last60` into the same `useMemo` or additional memos.

### 3.6 Canvas — undo stack and snapshot overhead

**Files:** `src/stores/canvas-store.ts`, `src/lib/canvas/canvas-undo-manager.ts`

`updateNodeData` calls `pushSnapshot()` before patching a single node field. Each snapshot deep-clones the entire canvas state (all nodes, edges, groups). At 50 nodes × 10 KB per node-object estimate, one undo snapshot is ~500 KB of heap allocation. At 100 undo entries that is 50 MB of retained heap for undo history alone, consumed on every single-node property change.

**Patterns to consider:**
1. Batch node updates — accumulate changes during a drag gesture and push one snapshot on `dragStop`.
2. Structural sharing / patch-based undo — store only the diff (old value → new value) instead of a full clone.
3. Reduce undo depth to 50 for large canvases.

### 3.7 DistributedModule — timer/cleanup mismatch

**File:** `src/components/modules/DistributedModule.tsx` (5 478 lines)

Static count: 13 `setInterval`/`setTimeout` call sites, 10 `return () =>` cleanup blocks. A mismatch of 3 suggests at least 3 intervals/timeouts may not be cleared on unmount, leaking timers that hold references to the component closure.

**Affected lines (sample):** 232, 1128, 3727, 3748, 3755, 3801, 3916

**Action:** audit each timer call site, ensure every `setInterval` result is stored in a `useRef` and cleared in the corresponding `useEffect` cleanup.

### 3.8 SecurityModule — timer pattern

**File:** `src/components/modules/SecurityModule.tsx` (5 168 lines)

1 `setInterval` with timerRef pattern, but 6 cleanup return functions vs. 11 clearInterval/clearTimeout call sites. The count disparity is smaller here but worth a manual pass on the same criteria.

### 3.9 ParticleLayer — `spawnParticles` recreated per metrics tick

**File:** `src/components/canvas/overlays/ParticleLayer.tsx`

`spawnParticles` depends on `metrics.throughputRps`, which ticks on every simulation metrics update. If `spawnParticles` is inside a `useCallback` or `useMemo` that lists `metrics.throughputRps` as a dependency, it is recreated on every tick. The RAF loop caches the function reference — if the cache is not updated, the stale closure runs. If the cache is updated on every tick, the benefit of the RAF store-subscription pattern is partially lost.

**Check:** verify the `useCanvasStore.subscribe(rebuild)` pattern re-caches `spawnParticles` correctly and that the update path does not force a React re-render.

---

## 4. State Subscription Review

### 4.1 Pattern inventory

| Pattern | Usage | Assessment |
|---------|-------|------------|
| `useCanvasStore((s) => s.specificField)` | DesignCanvas, BaseNode, many overlays | Correct — granular |
| `useCanvasStore((s) => s.nodes)` | 20 sites (see §3.4) | Problem — full array |
| `useSimulationStore((s) => s.X)` per field | SimulationDashboard, 11 calls | Correct — each is a leaf value |
| `useSimulationStore((s) => s.metricsHistory)` | MetricsDashboard | Array ref changes each tick — OK, but slice must be memoized |
| `useViewportStore(useShallow((s) => ({ x, y, zoom })))` | HeatmapOverlay | Correct — shallow comparison prevents renders when values unchanged |
| `useCanvasStore.subscribe(callback)` | ParticleLayer | Correct — bypasses React render cycle |
| `SimMetricsBus` event bus + direct DOM | NodeMetricsOverlay | Best pattern — zero React renders |

### 4.2 `namedSnapshots` — 50 full canvas clones in memory

**File:** `src/stores/canvas-store.ts`

`namedSnapshots` holds up to 50 named saves, each a full clone of the canvas state. Combined with the 100-entry undo stack, the store can hold 150 full canvas clones in memory simultaneously. On a large design this can reach 75–150 MB of retained heap without any leak — it is working-as-intended but constitutes a memory budget concern.

**Mitigation options:** serialize named snapshots to `lz-string` + store in localStorage (they are only needed on restore, not held in-memory), or reduce the cap.

### 4.3 Zustand `persist` middleware

**File:** `src/stores/canvas-store.ts`  
`persist` partializes to `{ nodes, edges, groups }`. This is correct — simulation state is excluded. The serialization path runs on every state update that touches these three fields, including position updates during drag. For large canvases this can cause visible jank on the main thread due to `JSON.stringify` of the full nodes array.

**Mitigation:** debounce the persist write, or use a custom storage adapter that only writes on explicit save triggers.

---

## 5. Network Review

### 5.1 HIGH — Sequential `requireAuth → resolveUserId` on every API route

**File:** `src/lib/auth.ts`, referenced in 25+ route files

```ts
// Pattern in every route handler:
const clerkId = await requireAuth();         // Clerk network call
const userId = await resolveUserId(clerkId); // DB SELECT, possible INSERT
```

`requireAuth()` calls Clerk's `auth()` (network/cache). `resolveUserId(clerkId)` does a DB `SELECT`; on a cache miss it also calls `currentUser()` (Clerk network) plus a DB `INSERT`. These are never parallelized because the second depends on the first.

This serialization is partly unavoidable (resolveUserId needs the clerkId), but the cold path (new user, cache miss) makes 3 sequential network/DB calls before any route logic begins.

**Optimization opportunity:** cache `clerkId → userId` mapping in an in-process LRU or Redis with a short TTL (60 seconds). The user's Clerk ID does not change; the internal `userId` is stable after first creation. This eliminates the `resolveUserId` DB SELECT on warm paths.

### 5.2 MEDIUM — `lastOpenedAt` update blocks GET response

**File:** `src/app/api/lld/designs/[id]/route.ts`

```ts
const design = await db.select(...).where(...); // fetch design
await db.update(...).set({ lastOpenedAt: now }); // analytics write
return NextResponse.json(design);
```

The `lastOpenedAt` update is a fire-and-forget analytics write but is awaited before the response is sent, adding one DB round-trip to every design open. Convert to fire-and-forget:

```ts
const design = await db.select(...).where(...);
// do not await:
db.update(...).set({ lastOpenedAt: now }).catch(console.error);
return NextResponse.json(design);
```

### 5.3 MEDIUM — Sequential DB queries in drill-interviewer routes

**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

POST handler sequential chain (after auth):
1. `SELECT` attempt by ID
2. `SELECT` previous sequence number
3. `INSERT` turn record
4. `UPDATE` attempt

GET handler sequential chain (after auth):
1. `SELECT` attempt by ID
2. `SELECT` all turns for attempt
3. Build request → stream

Many of these queries are independent (e.g., fetching turns and checking attempt status could be parallelized). Converting to `Promise.all` where inputs are independent saves one round-trip latency per handler:

```ts
const [attempt, turns] = await Promise.all([
  db.select(...).where(eq(attempts.id, id)),
  db.select(...).where(eq(turns.attemptId, id)),
]);
```

### 5.4 OG images — caching is correct

**File:** `src/app/api/og/route.tsx`

```ts
export const runtime = "edge";
// Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400
```

Edge runtime + 7-day CDN cache + 1-day stale-while-revalidate — well configured. SSRF check on avatar URL before fetching is correct. No issues here.

---

## 6. AI Streaming Review

### 6.1 HIGH — SSE route is not actually streaming

**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

The route is typed as an SSE stream (GET with `text/event-stream` content type) and opens a `ReadableStream`, but the implementation calls:

```ts
const response = await client.call(...); // awaits full response
controller.enqueue(`data: ${JSON.stringify({ type: "delta", content: fullText })}\n\n`);
controller.enqueue(`data: ${JSON.stringify({ type: "done" })}\n\n`);
```

The full LLM response is buffered server-side before any bytes reach the client. From the user's perspective there is no progressive text appearance — they wait for the entire generation, then see it all at once. The SSE framing is present but the streaming benefit is absent.

**Fix:** use the LLM provider's streaming API and pipe chunks as they arrive:

```ts
const stream = await client.stream(...); // returns AsyncIterable<chunk>
for await (const chunk of stream) {
  controller.enqueue(
    `data: ${JSON.stringify({ type: "delta", content: chunk.text })}\n\n`
  );
}
```

### 6.2 MEDIUM — No AbortController / client disconnect handling

**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

The `ReadableStream` has no `cancel` handler and the `client.call()` / `client.stream()` invocation is not connected to `request.signal`. If the client navigates away mid-stream, the server continues the full LLM call to completion, burning tokens and holding the worker.

**Fix:**

```ts
const stream = new ReadableStream({
  async start(controller) {
    request.signal.addEventListener("abort", () => {
      controller.close();
      // cancel upstream LLM call if SDK supports it
    });
    // ... streaming logic
  },
});
```

### 6.3 MEDIUM — Dynamic import inside `ReadableStream.start`

**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

```ts
const { ClaudeClient } = await import("@/lib/ai/claude-client");
```

This dynamic import runs inside `ReadableStream.start`, meaning Node.js module resolution and any initialization code in `claude-client.ts` runs on the critical path of every SSE request. On first call this is a cold-load; subsequent calls may be cached by Node's module cache, but the `await import()` expression still resolves the Promise on each call.

**Fix:** move the import to module scope (top of the route file). Next.js route modules are already lazily loaded on first request; there is no benefit to nesting the import inside the stream callback.

### 6.4 LOW — `metricsHistory` grows to 1 000 entries

**File:** `src/stores/simulation-store.ts`

```ts
metricsHistory: [...s.metricsHistory.slice(-999), { ...s.metrics }],
```

Each `metricsHistory` entry is a shallow clone of the metrics object. At 1 000 entries this is 1 000 object allocations retained in the store. The store lacks `persist` middleware (correct — simulation state is session-only) so this resets on reload, but during a long session it represents growing heap pressure that the GC must reclaim.

For most UI purposes 60–120 entries (1–2 minutes at 1 Hz sampling) is sufficient for a chart. Reduce the cap or add a configurable window size.

---

## 7. Asset Review

### 7.1 Fonts — correct approach

**File:** `src/app/layout.tsx`

Geist Sans and Geist Mono are loaded via the `geist` npm package (`geist/font/sans`, `geist/font/mono`). This uses Next.js font optimization: fonts are self-hosted, subset automatically, and served with `font-display: swap` equivalent behavior. No external Google Fonts CDN calls. No issues.

### 7.2 Images — no evidence of unoptimized images

No `<img>` tags without `width`/`height` were found in a quick pass of the main layout and page files. `next/image` usage appears consistent. OG route generates images on Edge with appropriate caching. No issues identified from static analysis; runtime LCP profiling would be needed to confirm.

### 7.3 LOW — Module-level Clerk `require`

**File:** `src/app/layout.tsx`

```ts
let ClerkProvider: ComponentType<...> | null = null;
try {
  ClerkProvider = require("@clerk/nextjs").ClerkProvider;
} catch {
  ClerkProvider = null;
}
```

This `require()` call runs at module evaluation time on every cold start of the layout module. It is not a dynamic import — it blocks module initialization. For a server component that runs on every route, this adds Clerk module load to every cold start. If Clerk is always expected to be present, convert to a static `import`. If it is truly optional, use `await import()` inside an `async` function to defer it.

---

## 8. Per-Component Performance Table (Top 20)

| # | Component | File (approx.) | Primary Concern | Recommended Fix |
|---|-----------|---------------|-----------------|-----------------|
| 1 | `DistributedModule` | `src/components/modules/DistributedModule.tsx` | 5 478 lines, 13 timers vs. 10 cleanups | Audit timer cleanup; split into sub-modules |
| 2 | `SecurityModule` | `src/components/modules/SecurityModule.tsx` | 5 168 lines, timer/cleanup mismatch | Same as above |
| 3 | `MetricsDashboard` | `src/components/visualization/charts/MetricsDashboard.tsx` | `slice(-60)` + 3 maps outside `useMemo`; subscribes to 1 000-entry array | Wrap slice + maps in `useMemo` |
| 4 | `DesignCanvas` | `src/components/canvas/DesignCanvas.tsx` | Alignment guides O(n) per drag frame; `getComputedStyle` per node per MiniMap render | Throttle `onNodeDrag`; cache color map |
| 5 | `HeatmapOverlay` | `src/components/canvas/overlays/HeatmapOverlay.tsx:157` | Full nodes array subscription | Derive needed fields with computed selector |
| 6 | `ChallengeOverlay` | `src/components/canvas/modes/ChallengeOverlay.tsx:671` | Full nodes array subscription | Narrow selector to needed fields |
| 7 | `MockInterviewMode` | `src/components/canvas/modes/MockInterviewMode.tsx:168` | Full nodes array subscription | Narrow selector |
| 8 | `DesignBattle` | `src/components/canvas/modes/DesignBattle.tsx:130` | Full nodes array subscription | Narrow selector |
| 9 | `TimeAttackMode` | `src/components/canvas/modes/TimeAttackMode.tsx:96` | Full nodes array subscription | Narrow selector |
| 10 | `PropertiesSheet` | `src/components/panels/PropertiesSheet.tsx:113` | Full nodes array subscription | Narrow selector |
| 11 | `canvas-store` (persist) | `src/stores/canvas-store.ts` | `persist` serializes full nodes/edges on every drag frame | Debounce persist writes |
| 12 | `canvas-store` (undo) | `src/stores/canvas-store.ts` | 100 full-state clones for undo; each `updateNodeData` clones entire canvas | Patch-based undo or batch on drag-end |
| 13 | `RequestTrace` | `src/components/canvas/overlays/RequestTrace.tsx:314` | Full nodes array subscription; animation frame bookkeeping | Narrow selector; audit RAF cleanup |
| 14 | `SLADashboard` | `src/components/canvas/overlays/SLADashboard.tsx:170` | Full nodes array subscription; likely only needs node IDs or aggregated SLA state | Derive SLA data in store selector |
| 15 | `CostMonitor` | `src/components/canvas/overlays/CostMonitor.tsx:50` | Full nodes array subscription | Narrow selector or derive cost in store |
| 16 | `ParticleLayer` | `src/components/canvas/overlays/ParticleLayer.tsx` | `spawnParticles` recreated per metrics tick | Pin to stable ref; read `throughputRps` from RAF store callback |
| 17 | `SimulationDashboard` | `src/components/canvas/overlays/SimulationDashboard.tsx` | `orchestratorRef?.getCostState()` inline during render | Move to `useMemo` or `useEffect` |
| 18 | `NodeListPanel` | `src/components/canvas/panels/NodeListPanel.tsx:91` | Full nodes array; large list without virtualization (if > 50 nodes) | Add `useVirtual` / `react-window` for long lists |
| 19 | `ShareDialog` | `src/components/dialogs/ShareDialog.tsx:54` | Full nodes array; `lz-string` compression on every render | Run compression in `useMemo` or web worker |
| 20 | `LLDProperties` | `src/components/modules/lld/panels/LLDProperties.tsx` | Only consumer of `prism-react-renderer` (~25 KB); loaded eagerly | Wrap in `React.lazy` + `Suspense` |

---

## 9. Out of Scope

The following areas were not analyzed due to the static-analysis-only constraint or scope exclusion:

- **Runtime LCP / FID / CLS / INP measurements** — requires Lighthouse or browser profiling.
- **Network waterfall** — requires DevTools or HAR capture.
- **Server-side response times** — requires APM (e.g., Vercel Analytics, Datadog).
- **Database query plans and index analysis** — requires `EXPLAIN ANALYZE` on live queries.
- **Canvas rendering frame rate** — requires Chrome DevTools Performance panel recording.
- **Memory heap snapshots** — requires Chrome Memory tab recording.
- **Worker thread CPU usage** — requires runtime profiling.
- **Cold-start / edge function boot time** — requires Vercel or similar observability.
- **CDN cache hit rates for OG images** — requires CDN metrics.
- **`@mdx-js/mdx` bundle impact** — path through the module graph was not fully traced; may be RSC-only and never included in client bundle.
- **React Suspense boundary layout shift** — static analysis cannot determine which suspense boundaries resolve above-the-fold.
- **Learn module** (`src/app/learn/`) — added after the last full sweep; not analyzed.

---

## 10. Reproduction Notes

All findings below are reproducible from source without a running application.

### Bundle issues

```bash
# Confirm optimizePackageImports is absent
grep -r "optimizePackageImports" /Users/a0g11b6/Downloads/projects/architex/architex/next.config.ts
# Expected: no output

# Confirm devtools in production deps
grep "react-query-devtools" /Users/a0g11b6/Downloads/projects/architex/architex/package.json
# Expected: line in "dependencies" block, not "devDependencies"

# Confirm dexie import absence in idb-store
grep -n "dexie" /Users/a0g11b6/Downloads/projects/architex/architex/src/lib/idb-store.ts
# Expected: no output

# Confirm comlink import absence in worker-bridge
grep -n "comlink" /Users/a0g11b6/Downloads/projects/architex/architex/src/lib/workers/worker-bridge.ts
# Expected: no output
```

### Full nodes array subscriptions

```bash
grep -rn "useCanvasStore.*s\.nodes\b" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/ \
  --include="*.tsx" --include="*.ts"
# Expected: 20+ matches
```

### SSE fake-stream

```bash
grep -n "await client\." \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/app/api/lld/drill-interviewer/
# Should show awaited call inside ReadableStream.start
```

### Sequential auth pattern

```bash
grep -rn "await requireAuth\|await resolveUserId" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/app/api/ \
  --include="*.ts" | head -40
# Expected: pairs appearing in same file, always requireAuth first then resolveUserId
```

### Slice outside useMemo

```bash
grep -n "slice\|useMemo" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/components/visualization/charts/MetricsDashboard.tsx
# Expected: slice(-60) on a line not wrapped in useMemo(
```

### Timer mismatch

```bash
grep -c "setInterval\|setTimeout" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/components/modules/DistributedModule.tsx
# Expected: ~13

grep -c "return () =>" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/components/modules/DistributedModule.tsx
# Expected: ~10 (mismatch confirms finding)
```

### `getComputedStyle` in nodeColor

```bash
grep -n "getComputedStyle" \
  /Users/a0g11b6/Downloads/projects/architex/architex/src/components/canvas/DesignCanvas.tsx
# Expected: inside nodeColor callback function
```

---

*End of performance review. No code was modified. All line number references are approximate from static reading and should be verified against the current HEAD.*
