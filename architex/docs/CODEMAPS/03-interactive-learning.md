# 03 — Interactive Learning Modules

> **AUDIT NOTE (2026-05-07):** This doc was authored before the SPA routing model was empirically verified. Specific corrections are inline below as `> CORRECTION:` blockquotes. The routing-model truth lives in `09-ui-tour.md` (v2) and `18-other-modules.md`. Where this doc and v2 disagree, **v2 wins**.

> **Scope.** This codemap documents the interactive learning surface of architex: Database, Algorithms, Data Structures, OS, Patterns, and the live simulation engine. The HLD canvas / LLD module is covered in a separate codemap; only the canvas helpers reused outside LLD appear here.

---

## 1. Purpose

Each module is a single-page interactive lab with a four-pane shell (`sidebar | canvas | properties | bottomPanel`) backed by a `useXxxModule()` hook. The hooks return a `ModuleContent` object that the host shell composes into the workspace layout.

| Module | Pedagogical contract |
|---|---|
| **Database** | Teaches database internals (B-Tree splits, hash collisions, LSM compaction, MVCC, ACID, CAP, joins, ARIES, query plans, schema design) by replaying engine-emitted `Step[]` arrays over hand-rolled SVG canvases. The student manipulates inputs (insert keys, write SQL, choose isolation level) and watches deterministic, step-by-step traces. |
| **Algorithms** | Teaches 83+ algorithms across 13 categories (sorting, graph, tree, DP, string, backtracking, geometry, search, greedy, patterns, probabilistic, vector-search, design) by running the algorithm to completion, recording `AnimationStep[]`, then driving multiple visualizers (array, graph, tree, DP grid, string-match, grid, geometry) through a shared `PlaybackController`. |
| **Data Structures** | A single hook for 43 data structures, each with insert/delete/search/peek operations that produce `DSStep[]` traces. Adds two pedagogical overlays beyond pure visualization: prediction mode (multiple-choice "what happens next?") and manual-trace mode (click left/right at each branch). |
| **OS** | Six concept areas — CPU scheduling, page replacement, deadlock detection, memory management, memory allocation, thread synchronization — driven from pure functions in `src/lib/os/` that produce Gantt charts, page-fault timelines, RAGs, and primitive-trace dashboards. |
| **Patterns** | A static SEO surface: 26 GoF + modern design-pattern reference pages (`/patterns/[slug]`), separate from the 8 architecture playbooks (`PLAYBOOKS` in `src/lib/patterns/playbook.ts`) that seed the system-design canvas. |
| **Live simulation engine** | A 10-stage tick pipeline (`SimulationOrchestrator`) on top of the system-design canvas. Drives queuing-theory math, chaos injection, cascade propagation, edge flow, cost, narrative narration, and time-travel snapshots in real time. |

The unifying abstraction across all modules is the **step trace**: pure-function engines return an array of step objects (`AnimationStep`, `BTreeStep`, `DSStep`, `PageEvent`, `SyncEvent`, `MemoryAllocStep`, `CascadeStep`, etc.), and a per-module React hook owns playback state (current index, play/pause, speed, sound).

---

## 2. Module map

| Module | Public route(s) | Module hook | Wrapper | Top engine dir | Persistence surface |
|---|---|---|---|---|---|
| Database | `/database/[mode]` (SEO) and `/?module=database` | `useDatabaseModule(initialMode?)` at `src/components/modules/database/useDatabaseModule.ts:273` | `DatabaseWrapper.tsx:8` (lazy, SSR off) | `src/lib/database/` (8 engines + types + sample data) | `localStorage["architex_db_state"]` (ER state + active mode + normalization inputs) |
| Algorithms | `/algorithms/[category]/[slug]` (SEO landing only) and `/?module=algorithms&algo=…` | `useAlgorithmModule()` at `src/components/modules/AlgorithmModule.tsx:482` | `AlgorithmWrapper.tsx:7` | `src/lib/algorithms/` (120+ engine files, 13 categories) | `localStorage["architex-recent-algos"]`, `["architex-algo-mastery"]`, `["architex-algo-scores"]` |
| Data Structures | `/ds/[slug]` (server-redirects to `/#slug`) and `/?ds=…` | `useDataStructuresModule()` at `src/components/modules/data-structures/index.tsx:246` | `DataStructuresWrapper.tsx:10` (extra `lazy()` over the inner) | `src/lib/data-structures/` (47 implementations, single shared `DSStep` type) | `localStorage["architex-ds-sound"]`, `["architex-ds-srs-due"]`, `["architex-ds-srs-cards"]`, `["architex-ds-streak"]`, `["architex-ds-srs-ops-<id>"]` |
| OS | `/os`, `/os/[concept]` (static SEO) and `/?os-concept=…` | `useOSModule()` at `src/components/modules/OSModule.tsx:2000` | `OSWrapper.tsx:7` | `src/lib/os/` (15 engines, all pure functions) | None (state is per-mount React) |
| Patterns | `/patterns`, `/patterns/[slug]` | n/a — pure server-rendered pages | n/a | `src/lib/seo/design-patterns-data.ts` (26 patterns); `src/lib/patterns/playbook.ts` (8 architecture playbooks for canvas) | n/a |
| System-design simulation | Embedded inside `SystemDesignWrapper` (separate codemap) | `useSimulationStore` (`src/stores/simulation-store.ts`) calling `SimulationOrchestrator` (singleton in `src/lib/simulation/simulation-orchestrator.ts:86`) | n/a | `src/lib/simulation/` (30+ files) | `diagrams.data` (jsonb canvas), `simulation_runs` (config + results) — see §9 |

> **CORRECTION (2026-05-07):** Several "Public route(s)" cells in this table are wrong about how the SPA receives module/sub-state from the URL. The fact pattern, verified by source grep:
> - **`/?module=database`, `/?module=algorithms&algo=…`, `/?ds=…`, `/?os-concept=…` are NOT consumed by anything in the SPA.** Grep for `searchParams.get('module')`, `searchParams.get('algo')`, `searchParams.get('os-concept')`, `searchParams.get('ds')` returns zero hits inside `src/components/modules/`. Only `?lld=` (read by `src/components/modules/lld/hooks/useLLDModuleImpl.tsx:265`) and `&mode=` (read by `src/hooks/useLLDModeSync.ts`) are real URL contracts in the SPA today.
> - The active module is held in **Zustand `useUIStore.activeModule`** (`src/stores/ui-store.ts`), persisted to `localStorage` via Zustand `persist` middleware. Switching modules calls `setActiveModule(id)`. The URL stays `/`.
> - **Path routes that DO drive the SPA into a specific module:** only `/database/[mode]` (via `database-mode-app.tsx:40-45` calling `setActiveModule("database")` on mount). Algorithm and OS SEO pages emit `/?module=…` / `/?os-concept=…` href links (e.g. `src/app/algorithms/[category]/[slug]/page.tsx:128`, `src/app/os/[concept]/page.tsx:195,302`) but those query params land on `/` and are silently ignored — the user sees whichever module Zustand last persisted.
> - **Data Structures DOES use the URL hash:** `/ds/[slug]` server-redirects to `/#<slug>` (confirmed at `src/app/ds/[slug]/page.tsx:44`) and the DS module reads `window.location.hash.slice(1)` on mount (`src/components/modules/data-structures/index.tsx:463`). The `?ds=…` query is not consumed.
>
> Source of truth: `09-ui-tour.md` v2 §1A/§1B and `18-other-modules.md` §2.3. The "no per-module URL writeback" property is also stated explicitly in `18-other-modules.md` §2.3: "every other module: state lives in Zustand only — selecting a sim/topic does not update the URL."

### Module hook contract

Every interactive learning module returns a `ModuleContent` object consumed by `WorkspaceLayout`. Wrappers thread the content into the host page via a callback:

```tsx
// src/components/modules/wrappers/DatabaseWrapper.tsx:8
export default memo(function DatabaseModuleContent({ onContent, initialMode }: { onContent: (c: ModuleContent) => void; initialMode?: DatabaseMode }) {
  const content = useDatabaseModule(initialMode);
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
```

`DataStructuresWrapper.tsx:10` adds an extra `React.lazy()` boundary because the inner module imports ~24,000 lines of DS engine code:

```tsx
// src/components/modules/wrappers/DataStructuresWrapper.tsx:10
const DataStructuresInner = lazy(() => import("./DataStructuresInner"));
```

The page-level entry point (`src/app/database/[mode]/database-mode-app.tsx:30`) loads these wrappers via `next/dynamic` with `{ ssr: false }` since they touch `localStorage` and Web Worker APIs at mount.

---

## 3. Simulation engine

The simulation engine is the most complex piece in this scope: a custom, browser-only, tick-based discrete-event engine purpose-built for the system-design canvas. ADR-006 (`docs/adr/ADR-006-custom-simulation-engine.md`) is the authoritative design rationale; the runtime lives in `src/lib/simulation/`.

### 3.1 Architecture overview

`SimulationOrchestrator` (`src/lib/simulation/simulation-orchestrator.ts:86`) is a long-lived class held by `useSimulationStore` (one instance per session). It runs **outside React** and reads canvas state imperatively:

```ts
// src/lib/simulation/simulation-orchestrator.ts:32
import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';

// src/lib/simulation/simulation-orchestrator.ts:217
const { nodes, edges } = useCanvasStore.getState();
```

It composes the following sub-engines (line numbers refer to `index.ts` re-exports):

| Sub-engine | File | Role |
|---|---|---|
| `mm1*`, `mmc*`, `simulateNode` | `queuing-model.ts:51-380` | Pure M/M/1 and M/M/c (Erlang-C) closed-form math |
| `TrafficGenerator` | `traffic-simulator.ts:1-295` | Pre-generates the per-tick `TrafficTimeline` for `constant`/`sine-wave`/`spike`/`ramp`/`random` patterns (Poisson-distributed via Knuth's algorithm or Box-Muller for large lambda) |
| `MetricsCollector` | `metrics-collector.ts:1-399` | Sliding-window p50/p90/p95/p99 latency + error rate + throughput |
| `ChaosEngine` | `chaos-engine.ts:1-1521` | 27+ chaos event types (`node-crash`, `network-partition`, `cache-eviction-storm`, `replication-lag`, …) with TTLs, severities, and pressure-counter side effects |
| `PressureCounterTracker` (legacy) and V2 `pressure-counters.ts` | `pressure-counter-tracker.ts`, `pressure-counters.ts` | Per-node accumulators (CPU pressure, queue pressure, etc.) decayed each tick |
| `topology-signature.ts` (SIM-001) | | Deterministic 4-bit signature per node based on its in/out-edge component types — used as a key into the `RuleDatabase` |
| `RuleDatabase` (SIM-004) | `rule-database.ts` | Maps topology signatures → propagation profiles (traffic amplification, capacity degradation, error amplification) |
| `IssueTaxonomy` (SIM-003) | `issue-taxonomy.ts` | 100+ `DetectedIssue` codes derived from pressure-counter thresholds |
| `EdgeFlowTracker` (SIM-007) | `edge-flow-tracker.ts` | Sliding-window per-edge RPS for animated edge labels |
| `SimulationMetricsBus` (SIM-009) | `simulation-metrics-bus.ts` | Per-node Float64Array buffer (separate from legacy `SimMetricsBus` — see §10) |
| `NarrativeEngine` (SIM-010) | `narrative-engine.ts` | Templated commentary ("Database utilization spiked to 92% — connection pool exhaustion incoming") |
| `TimeTravel` | `time-travel.ts` | Per-tick `SimulationFrame` snapshots for seek/replay |
| `CascadeEngine` | `cascade-engine.ts:1-370` | Standalone failure-cascade simulator used by `FailureModeExplorer.tsx`, not the per-tick pipeline |
| `report-generator.ts` (SIM-005) | | Builds a `SimulationReport` from `tickHistory` for post-run review and Markdown export |
| `cost-model.ts` (SIM-006), `capacity-planner.ts` | | Per-component cloud-cost heuristics + scaling recommendations |
| `what-if-engine.ts` | | Clone-graph → mutate → simulate → diff (used by `WhatIfPanel`) |
| `architecture-diff.ts` | | Structural diff between two diagram versions |
| `latency-budget.ts`, `sla-calculator.ts` | | Path-based latency/SPOF analysis |

### 3.2 Tick loop and 10-stage pipeline

The orchestrator ticks every `tickMs = 100` ms (default) and processes the canvas through a 10-stage pipeline. The contract is documented at the top of `simulation-orchestrator.ts:7-21` and implemented in `processTick(tickIndex)`:

```ts
// src/lib/simulation/simulation-orchestrator.ts:513-877  (abridged)
private processTick(tickIndex: number): void {
  // STAGE 1 Traffic Distribution    -- distribute global RPS across entry nodes
  // STAGE 2 BFS Propagation         -- propagate traffic through graph
  // STAGE 3 Amplification           -- apply rule database factors per edge
  // STAGE 4 Pressure Update         -- update pressure counters
  // STAGE 5 Issue Detection         -- detect issues from counter thresholds
  // STAGE 6 Edge Flow Recording     -- record per-edge flow
  // STAGE 7 Metrics Bus Write       -- write NodeSimMetrics (NOT to Zustand per node)
  // STAGE 8 Tick Record             -- append TickRecord to tickHistory
  // STAGE 9 Live Cost Update        -- update LiveCostState
  // STAGE 10 Time Travel Snapshot   -- push snapshot for seek/replay
}
```

#### Entry-point detection

A node is an "entry" if it has no inbound edges or if its `data.category === 'client'`:

```ts
// src/lib/simulation/simulation-orchestrator.ts:181-188
for (const node of nodes) {
  const data = node.data as Record<string, unknown> | undefined;
  const isClient = data?.category === 'client';
  if (isClient || !hasInbound.has(node.id)) {
    this.entryNodeIds.push(node.id);
  }
}
```

#### Per-node queuing math (Stage 3)

After amplification, every node runs through `simulateNode(arrivalRate, serviceRate, serverCount)` (M/M/c). Service rate is resolved from the node's `data.componentType` via the centralized `getNodeServiceRateFromData` (SIM-008):

```ts
// src/lib/simulation/simulation-orchestrator.ts:621-625
const result = simulateNode(
  amplifiedArrivalRate,
  Math.max(amplifiedServiceRate, 0.00001),
  serverCount,
);
```

`simulateNode` returns a `NodeSimulationResult` with `utilization`, `avgQueueLength`, `avgWaitTime`, `avgSystemTime`, and exponential-distribution-derived p95/p99 latency.

#### Chaos modifiers (Stage 2 inset)

`applyChaosModifiers(nodeId, baseServiceRate)` (`simulation-orchestrator.ts:920-1032`) is a 27-event switch that maps chaos event types to `{ serviceRate, extraLatency, forceError }`:

```ts
// src/lib/simulation/simulation-orchestrator.ts:935-998 (excerpt)
case 'node-crash': case 'api-down': case 'certificate-expiry':
case 'network-partition': case 'dns-failure': case 'config-error':
  forceError = true; serviceRate = 0.00001; break;
case 'node-slow': case 'cpu-spike': case 'memory-pressure': case 'disk-full':
  serviceRate *= 0.1; extraLatency += 200; break;
case 'replication-lag':
  extraLatency += 5000; break;
case 'cache-eviction-storm':
  serviceRate *= 0.2; extraLatency += 50; break;
```

### 3.3 Tick scheduling — RAF + setInterval

The scheduler chooses between `requestAnimationFrame` (for fast playback) and `setInterval` (for slow playback) based on the resolved interval:

```ts
// src/lib/simulation/simulation-orchestrator.ts:1038-1052
private startInterval(speed: number): void {
  this.clearInterval();
  const intervalMs = Math.max(10, this.tickMs / speed);
  if (typeof requestAnimationFrame !== 'undefined' && intervalMs <= 20) {
    this.scheduleNextTick(speed);
  } else {
    this.intervalId = setInterval(() => { this.tickLoop(); }, intervalMs);
  }
}
```

When RAF-driven, the loop processes `Math.max(1, Math.floor(speed / 10))` ticks per frame to keep up with high-speed playback (`scheduleNextTick`, `simulation-orchestrator.ts:1054-1069`).

### 3.4 Determinism vs animation

| Mode | Trigger | Properties |
|---|---|---|
| Animated playback | `start()` / `play()` | RAF or interval-driven; canvas state synced every `CANVAS_SYNC_INTERVAL = 10` ticks (`simulation-orchestrator.ts:67`); time-travel snapshots every tick |
| Single-step | `step()` | One tick advance, status set to `paused` |
| Synchronous batch | `runSync(ticks)` | Used by interview scoring / what-if analysis (`simulation-orchestrator.ts:401-444`); returns a full `SimulationReport` without yielding to the event loop |
| Time-travel seek | `seekTo(tick)` | Restores `nodeStates` + `globalMetrics` from cached `SimulationFrame` (`time-travel.ts`) |

Determinism caveats: `Math.random()` is used for the rule-database probability check (`simulation-orchestrator.ts:611`), Poisson sampling (`traffic-simulator.ts:62-86`), and chaos-event scheduling — runs are not bit-for-bit reproducible without a seeded RNG.

### 3.5 Web-worker offload — present but unused

The codebase ships three workers under `src/lib/workers/`:

| Worker | Purpose |
|---|---|
| `simulation-worker.ts` | Wraps `simulateNode()` for off-thread queuing math |
| `algorithm-worker.ts` | Runs registered sorting algorithms off the main thread |
| `layout-worker.ts`, `minimap-worker.ts` | Off-thread Dagre/ELK layout and minimap raster |

A typed bridge (`src/lib/workers/worker-bridge.ts:60`) handles message-ID correlation, timeouts, idle auto-termination, and a synchronous main-thread fallback for SSR/test environments.

> **Quirk.** Despite the worker files existing and being unit-tested (`src/lib/workers/__tests__/worker-bridge.test.ts`), no production code instantiates them — `grep -rn "simulation-worker\|algorithm-worker\|layout-worker" src --include="*.ts" --include="*.tsx"` returns zero hits in non-test code. The orchestrator's processing still happens on the main thread, matching ADR-006's "Negative consequences" note about worker offload being planned but not done. **`comlink` is in `package.json` but has no imports** — see §11.

---

## 4. Database module

### 4.1 Modes

`DatabaseMode` (`src/components/modules/database/useDatabaseModule.ts:99-118`) is a 19-element string union; each mode gets a dedicated SVG canvas component under `src/components/modules/database/canvases/`:

| Mode slug | Canvas | Engine |
|---|---|---|
| `er-diagram` | `ERDiagramCanvas.tsx` (458 L) | Hand-rolled drag/drop, `er-to-sql.ts` + `schema-converter.ts` for SQL/NoSQL output |
| `normalization` | `NormalizationCanvas.tsx` (147 L) | `normalization.ts` — `computeClosure`, `findCandidateKeys`, `determineNormalForm`, `decomposeTo3NF` |
| `transaction-isolation` | `TransactionCanvas.tsx` (393 L) | `transaction-sim.ts` — hand-curated step traces per isolation level |
| `btree-index` | `BTreeCanvas.tsx` (515 L) | `BTreeViz` class (`btree-viz.ts`) |
| `bplus-tree` | `BPlusTreeViz.tsx` (`src/components/database/`) | `bplus-tree-ds.ts` (reuses the DS module's B+ tree) |
| `hash-index` | `HashIndexCanvas.tsx` (619 L) | `HashIndexViz` class with chaining and dynamic resize |
| `query-plans` | `QueryPlanCanvas.tsx` (326 L) | `generateQueryPlan` heuristic SQL → cost-annotated tree |
| `lsm-tree` | `LSMCanvas.tsx` (611 L) | `LSMTreeViz` class — memtable, immutable memtable, leveled SSTables, manual flush/compact |
| `acid` | `ACIDCanvas.tsx` (386 L) | `getStepsForProperty(acidProperty)` step factory |
| `cap-theorem` | `CAPTheoremCanvas.tsx` (583 L) | `getCPPartitionSteps` / `getAPPartitionSteps` |
| `mvcc` | `MVCCCanvas.tsx` (354 L) | `MVCCViz` class — version chains, snapshots |
| `row-vs-column` | `RowColumnCanvas.tsx` (399 L) | Hand-built comparison visualizer |
| `sql-vs-nosql` | `SQLvsNoSQLCanvas.tsx` (540 L) | Same |
| `index-anti-patterns` | `IndexAntiPatternsCanvas.tsx` (375 L) | 5 hardcoded anti-patterns |
| `caching-patterns` | `CachingPatternsCanvas.tsx` (1074 L) | Cache-aside, write-through, write-behind step traces |
| `join-algorithms` | `JoinAlgorithmsCanvas.tsx` (694 L) | `JoinViz` — nested-loop, hash, merge with row/match animations |
| `aries-recovery` | `ARIESCanvas.tsx` (446 L) | `ARIESViz` — analysis/redo/undo phases |
| `star-snowflake` | `StarSnowflakeCanvas.tsx` (850 L) | Schema-shape comparison |
| `connection-pooling` | `ConnectionPoolingCanvas.tsx` (815 L) | `getStepsForPooling(mode, size)` |

Total canvas surface in `database/canvases/`: **9,585 lines across 19 files** (the `wc -l` total at the time of writing).

### 4.2 Hook architecture (`useDatabaseModule.ts`, 3,570 L)

The hook is a single function — the largest in the codebase — that owns state for **all 19 modes**. Per-mode state is local React, not Zustand, because no other module needs to read it (rationale codified in `docs/architecture/database-module.md:140-148`).

The canonical pattern is **`useRef` (engine instance) + `useState` (snapshot)**:

```ts
// src/components/modules/database/useDatabaseModule.ts:46-51
import {
  /* … */ BTreeViz, HashIndexViz, LSMTreeViz, MVCCViz, JoinViz, ARIESViz,
} from "@/lib/database";
```

Engines are stateful classes whose `insert(key)` / `delete(key)` / `compact()` mutate internal trees and **return** a `Step[]`. The hook then `setSteps(returnedSteps)` and `setSnapshot(engine.getState())` in the same handler to trigger a re-render.

Step playback per mode uses a `setInterval` stored in a ref; the LSM/B-Tree/Hash sections each have their own timer ref (`btreeTimerRef`, `hashTimerRef`, `lsmTimerRef`) plus `isPlaying` boolean state. Step duration is `animationSpeed` ms (default 800 ms; user-configurable via the bottom panel).

### 4.3 Persistence

```ts
// src/components/modules/database/useDatabaseModule.ts:244-269
const STORAGE_KEY = "architex_db_state";
interface PersistedDBState {
  entities?: EREntity[]; relationships?: ERRelationship[];
  activeMode?: DatabaseMode;
  normRelation?: string; normAttributes?: string; normFdsText?: string;
}
function loadPersistedState(): PersistedDBState | null { /* … */ }
```

Only ER-diagram entities/relationships, the active mode, and normalization inputs are persisted. The other 17 modes are ephemeral — switching modes resets the per-mode engine.

### 4.4 SEO routing

The route `src/app/database/[mode]/page.tsx:18` calls `generateStaticParams()` over `DATABASE_MODES` (in `src/lib/seo/database-meta.ts`) so all 7 (per the SEO meta — note `database-meta.ts` only enumerates 7 modes for SEO even though the runtime supports 19) are pre-rendered. The page's `DatabaseModeApp` (a client component) sets `activeModule = "database"` and threads the `initialMode` through:

> **CONFIRMED (2026-05-07):** This section is one of the rare places in the SPA where a Next.js path route directly drives `setActiveModule`. `database-mode-app.tsx:40-45` does the call, and `initialMode` is threaded into `useDatabaseModule(initialMode)` (a typed prop, not a URL query reader). This is the canonical pattern; the `/?module=…` href links elsewhere in the codebase do **not** match this pattern. Bare `/database` (without `[mode]`) is a 404. Source: `09-ui-tour.md` v2 §1A and `18-other-modules.md` §2.4.

```tsx
// src/app/database/[mode]/database-mode-app.tsx:39-49
export function DatabaseModeApp({ mode }: { mode: DatabaseMode }) {
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  useEffect(() => { setActiveModule("database"); }, [setActiveModule]);
  /* … */
}
```

### 4.5 Diagram persistence (database mode)

The Database module **does not** call `/api/diagrams` itself — only the system-design canvas writes there. Database state is local to `localStorage["architex_db_state"]` only. (See §9 for the full diagram-persistence story.)

---

## 5. Algorithms module

### 5.1 Categories and algorithm count

`AlgoId` (`src/lib/algorithms/types.ts:150-154`) is a discriminated union over 13 category types. The catalog at the time of the analysis covers **83+ algorithms** (per `docs/architecture/algorithm-backend-analysis.md:40`):

| Category | Count | Engine dir |
|---|---|---|
| sorting | 18 | `src/lib/algorithms/sorting/` |
| graph | 18 | `src/lib/algorithms/graph/` |
| tree | 11 | `src/lib/algorithms/tree/` |
| dp | 11 | `src/lib/algorithms/dp/` |
| string | 4 | `src/lib/algorithms/string/` |
| backtracking | 4 | `src/lib/algorithms/backtracking/` |
| geometry | 3+ | `src/lib/algorithms/geometry/` |
| patterns | 5 | `src/lib/algorithms/patterns/` |
| probabilistic | 3 | `src/lib/algorithms/probabilistic/` |
| vector-search | 2 | `src/lib/algorithms/vector-search/` |
| design | 1 | `src/lib/algorithms/design/` |
| greedy | 2 | `src/lib/algorithms/greedy/` |
| search | 1 | `src/lib/algorithms/search/` |

Each engine file pairs a `CONFIG: AlgorithmConfig` with a runner function that returns `AlgorithmResult = { config, steps, finalState }` (`src/lib/algorithms/types.ts:211-225`).

### 5.2 The `AnimationStep` contract

```ts
// src/lib/algorithms/types.ts:19-40
export interface AnimationStep {
  id: number;
  description: string;
  pseudocodeLine: number;
  mutations: VisualMutation[];
  complexity: { comparisons: number; swaps: number; reads: number; writes: number; };
  duration: number;
  milestone?: string;
  arraySnapshot?: number[];
}

// src/lib/algorithms/types.ts:55-67
export interface VisualMutation {
  targetId: string;
  property: 'fill' | 'position' | 'opacity' | 'label' | 'highlight' | 'scale';
  from: string | number;
  to: string | number;
  easing: 'spring' | 'ease-out' | 'linear';
}
```

`arraySnapshot` is the canonical way for a step to declare "after this step, the array is exactly X". Without it, the canvas falls back to inferring swaps from `position` mutations, then from `swapping` highlights — see `parseStepMutations` and the three-strategy fallback in `src/components/modules/AlgorithmModule.tsx:572-628`:

```ts
// src/components/modules/AlgorithmModule.tsx:572-580 (excerpt)
// Strategy 1: Use arraySnapshot if engine provides it
let updatedArray = prev.currentArray;
if (step.arraySnapshot && step.arraySnapshot.length === prev.currentArray.length) {
  const changed = step.arraySnapshot.some((v, i) => v !== prev.currentArray[i]);
  if (changed) { updatedArray = step.arraySnapshot; }
}
```

### 5.3 PlaybackController

`PlaybackController` (`src/lib/algorithms/playback-controller.ts:9-172`) is the shared step-runner used by the algorithm and DS modules. It does pedagogical pacing — first 3 steps slowed 1.5×, milestone steps slowed 2× — directly inside the scheduler:

```ts
// src/lib/algorithms/playback-controller.ts:142-150
const currentStep = this.steps[this.currentIndex];
let delay = currentStep.duration / this.speed;
// First 3 steps: slower (1.5x) — user is learning the pattern
if (this.currentIndex < 3) delay *= 1.5;
// Milestone steps: slower (2x) — important moments
if (currentStep.milestone) delay *= 2;
```

It also exposes `nextMilestone()` / `prevMilestone()` for scrubbing through the marked key moments only.

### 5.4 Module hook (`AlgorithmModule.tsx`, 1,462 L)

`useAlgorithmModule` (`AlgorithmModule.tsx:482`) holds a discriminated-state object covering all visualization categories simultaneously (`AlgorithmModuleState` at `AlgorithmModule.tsx:106-133`). Type guards (`isSortingView`, `isGraphView`, …) at lines 138-170 are exported but not yet used (an `ALG-252` refactor target — they're intentionally `void`-referenced at line 173-174).

Per-algorithm "personality" lives in `src/lib/algorithms/algorithm-choreography.ts:75+` — a `CHOREOGRAPHY_MAP: Record<string, Partial<AlgorithmChoreography>>` that gives each algorithm its own spring stiffness, damping, mass, pulse curves, and easing. Bubble Sort feels reluctant; Quick Sort feels decisive; Merge Sort feels zen.

### 5.5 Visualizers

The algorithm canvas dispatches by `visualizationType` to one of seven visualizers under `src/components/canvas/overlays/`:

| Visualizer | When |
|---|---|
| `ArrayVisualizer.tsx` | Sorting, search |
| `GraphVisualizer.tsx` | Graph algorithms |
| `TreeVisualizer.tsx` | Tree algorithms |
| `DPVisualizer.tsx` | DP |
| `StringMatchVisualizer.tsx` | String matching |
| `GridVisualizer.tsx` | Backtracking (n-queens, Sudoku, knight's tour) |
| `GeometryVisualizer.tsx` | Convex hull, closest-pair, line intersection, HNSW |
| `DotPlotVisualizer.tsx`, `ColorMapVisualizer.tsx` | Optional alternative views via `ViewToggle` (`src/components/canvas/overlays/ViewToggle.tsx`) |

A separate `LiveDashboard` (`src/components/canvas/overlays/LiveDashboard.tsx`) shows live complexity counters; `AlgorithmRace` runs two algorithms head-to-head on the same input.

### 5.6 Code panel

`src/components/algorithm-visualizer/CodePanel.tsx:140` is a memoized syntax-highlighted code viewer with an `activeLine` prop synced to `step.pseudocodeLine`. It auto-scrolls the active line into view (`CodePanel.tsx:163-179`) using `scrollIntoView({ behavior: 'smooth', block: 'center' })`. Languages: TypeScript and Python (sample `pseudocode` lives on the `AlgorithmConfig`). Tokenization is a hand-rolled regex (`tokenizeLine`, `CodePanel.tsx:82-123`) — no Monaco, no Prism, no Shiki.

### 5.7 Complexity panel

The properties panel (`src/components/modules/algorithm/AlgorithmProperties.tsx`, 779 L) shows time/space complexity, complexity intuition, real-world apps, interview tips, comparison guides, and live counts pulled from `step.complexity` (comparisons / swaps / reads / writes).

### 5.8 SEO landing pages

`src/app/algorithms/[category]/[slug]/page.tsx:53` statically generates one landing page per algorithm (`generateStaticParams` over the 13 catalog arrays). The page is intentionally minimal — title, description, complexity, and a deep-link button to the SPA at `/?module=algorithms&algo=<id>`. The actual visualizer is **never** server-rendered.

> **CORRECTION (2026-05-07):** The "deep-link button" is misleadingly described — the href emitted at `src/app/algorithms/[category]/[slug]/page.tsx:128` is literally `/?module=algorithms&algo=${algo.id}`, but the SPA at `/` does **NOT** consume either `module` or `algo` query parameters. Clicking the button lands the user on `/` showing whichever module Zustand last persisted (which may or may not be Algorithms). The user must additionally use the activity-bar icon, keyboard shortcut `2`, or command palette to actually switch into the Algorithms module — and there is no mechanism today to pre-select a specific algorithm via URL. (Bare `/algorithms` is 404; only `/algorithms/[category]/[slug]` exists as a Next route.) Source: `09-ui-tour.md` v2 §1B and `18-other-modules.md` §2.3 ("every other module: state lives in Zustand only").

### 5.9 Mastery and recently-viewed

```ts
// src/components/modules/AlgorithmModule.tsx:518-525
const [recentAlgos, setRecentAlgos] = useState<Array<{id: string; name: string; timestamp: number}>>(() => {
  try { return JSON.parse(localStorage.getItem('architex-recent-algos') || '[]'); } catch { return []; }
});
const [mastery, setMastery] = useState<Record<string, number>>(() => {
  try { return JSON.parse(localStorage.getItem('architex-algo-mastery') || '{}'); } catch { return {}; }
});
```

Mastery (0-5 stars per algorithm) is computed from `architex-algo-scores` (managed by `src/lib/algorithms/practice/scoring.ts`). Spaced repetition uses `architex-algo-srs` via `src/lib/algorithms/practice/spaced-repetition.ts`.

---

## 6. Data structures module

### 6.1 Catalog and shape

`DS_CATALOG` (`src/lib/data-structures/catalog.ts:11`) is a 43-entry array of `DSConfig` records. Categories are `'linear' | 'tree' | 'hash' | 'heap' | 'probabilistic' | 'system'` (`types.ts:33-39`). Each engine implements operations as **pure functions** (not classes — different from the database module) that return `{ steps: DSStep[]; snapshot: T }`:

```ts
// src/lib/data-structures/types.ts:27-62
export interface DSStep {
  id: number;
  description: string;
  mutations: DSMutation[];
}
export interface DSResult<T = unknown> {
  steps: DSStep[];
  snapshot: T;
}
```

The hook calls these pure functions and replaces the snapshot in state — no `useRef` engine instance like the database module.

### 6.2 Operation dispatch

`useDataStructuresModule` (`src/components/modules/data-structures/index.tsx:246`) holds a single `state: DSModuleState` object containing per-DS sub-states. `handleOperation(op, value, extra)` is a 800+ line `switch (prev.activeDS)` (lines 480-1297) that maps every (DS, op) tuple to the appropriate engine function:

```ts
// src/components/modules/data-structures/index.tsx:491-505 (excerpt)
case "array": {
  if (op === "insert") {
    result = arrayInsert(prev.arrayData, isNaN(numExtra) ? prev.arrayData.length : numExtra, isNaN(numVal) ? 0 : numVal);
    /* … */
  } else if (op === "delete") { /* … */ }
  else if (op === "search") { /* … */ }
  break;
}
```

Adding a new data structure means: add an engine to `src/lib/data-structures/`, add a `DSConfig` to `catalog.ts`, add the case to `handleOperation`, add the case to `handleRandom`, add the case to `handleReset`, add a visualizer canvas to `src/components/modules/data-structures/visualizers/`. (`docs/guides/adding-a-data-structure.md` is the canonical walkthrough.)

### 6.3 Visualizer dispatch

`DSCanvas` (`src/components/modules/data-structures/DSCanvas.tsx`) imports 8 grouped visualizer files totaling **5,381 lines**:

```ts
// src/components/modules/data-structures/DSCanvas.tsx:6-13
import { ArrayCanvas, LinkedListCanvas, DequeCanvas, CircularBufferCanvas, WALCanvas, RopeCanvas, DLLCanvas, PQCanvas, MonotonicStackCanvas } from "./visualizers/LinearCanvases";
import { HashTableCanvas, LRUCacheCanvas, CuckooHashCanvas } from "./visualizers/HashCanvases";
import { HeapCanvas, FibHeapCanvas, BinomialHeapCanvas } from "./visualizers/HeapCanvases";
import { UnionFindCanvas, SkipListCanvas } from "./visualizers/GraphCanvases";
import { BloomFilterCanvas, CountMinSketchCanvas, HyperLogLogCanvas } from "./visualizers/ProbabilisticCanvases";
import { LSMTreeCanvas, ConsistentHashRingCanvas, RTreeCanvas, QuadtreeCanvas } from "./visualizers/SystemCanvases";
import { CRDTCanvas, VectorClockCanvas } from "./visualizers/CRDTCanvases";
import { BSTCanvas, AVLCanvas, RBTreeCanvas, TrieCanvas, MerkleTreeCanvas, SegmentTreeCanvas, BPlusTreeCanvas, FenwickTreeCanvas, SplayTreeCanvas, TreapCanvas, BTreeCanvas } from "./visualizers/TreeCanvases";
```

Largest visualizer file: `TreeCanvases.tsx` at **1,954 lines** for 11 tree types.

### 6.4 Mutation animations

Mutations carry `targetId` (e.g. `"node-3"`, `"bucket-2"`, `"hash-key:foo"`) and `property` (`"highlight"`, `"position"`, `"link"`, `"value"`). Highlight states are a 23-member union (`DSHighlightState`, `types.ts:67-91`) covering domain-specific states like `'splitting'`, `'rotating'`, `'rebalancing'`, `'in-flight'` (CRDT), `'sending'`/`'receiving'` (vector clock).

The auto-play scheduler does context-aware slowdown: any step whose description contains `rotation | rebalance | collision | evict | split | merge | flush | compact | bubble` gets 2× delay (`src/components/modules/data-structures/index.tsx:380-389`).

### 6.5 Pedagogical overlays unique to DS

| Overlay | Mode | File |
|---|---|---|
| **PredictionOverlay** | `predictionMode = true`. Before advancing past a "predictable" step (parsed from the description), show a multiple-choice modal. | `src/components/modules/data-structures/PredictionOverlay.tsx` |
| **ManualTrace** | `manualTraceActive = true`. At each directional step (BST descend, AVL rotate, etc.), require the user to click left/right and score them. | `src/components/modules/data-structures/ManualTrace.tsx` |
| **AutoQuiz**, **ComplexityQuiz**, **ScenarioChallenges**, **DebuggingChallenges**, **BreakItMode**, **ReverseMode** | Bottom-panel mini-games | `src/components/modules/data-structures/*.tsx` |

### 6.6 SRS (spaced repetition)

The DS module rolls its own SRS independently of the algorithms module. When a user performs ≥ 3 operations on a single DS, that DS is added to the SRS card list (`localStorage["architex-ds-srs-cards"]`) and after 24 hours an SRS review banner appears (`index.tsx:347-365`).

### 6.7 Sonification

`src/components/modules/data-structures/sonification.ts` plays a tone at `playTone(value, type)` for each step where sound is on. Frequency maps to value via a base + slope; the tone *type* maps to the semantic state (`compare = sine`, `swap = sawtooth`, `found = success chord`).

### 6.8 SEO routing

`src/app/ds/[slug]/page.tsx:38` is a server-side **redirect-only** page. After generating SEO metadata it redirects to `/#<slug>`; the SPA reads the hash on mount via `handleSelectDS` (`index.tsx:462-468`):

```ts
// src/components/modules/data-structures/index.tsx:462-468
useEffect(() => {
  const hash = window.location.hash.slice(1);
  if (hash && DS_CATALOG.some(d => d.id === hash)) {
    handleSelectDS(hash as ActiveDS);
  }
}, []);
```

> **CORRECTION (2026-05-07):** The redirect-and-hash pattern is described correctly, but the DS module does **NOT** also call `setActiveModule("data-structures")` on hash detection — it only updates its own internal `activeDS` state. So `/ds/bloom-filter` → redirect to `/#bloom-filter` only "lands you on the Bloom Filter visualizer" if the DS module is **already** the active module in Zustand. Otherwise the hash is read by a DS module that isn't mounted, and the user sees whichever module Zustand last persisted. The hash also gets written back via `window.history.replaceState` when the user picks a DS inside the SPA (`index.tsx:458`), so the hash truly is the canonical sub-state contract for DS — but only inside the DS module shell. Bare `/ds` is 404. Source: `09-ui-tour.md` v2 §1B (URL parameters table lists `#<ds-id>` as the only DS sub-state contract).

---

## 7. OS module

### 7.1 Concept set

`CONCEPTS` (`src/components/modules/OSModule.tsx:69-100`) defines 6 concept areas:

```ts
// src/components/modules/OSModule.tsx:69-100 (abridged)
const CONCEPTS: ConceptDef[] = [
  { id: "cpu-scheduling",    name: "CPU Scheduling",      description: "FCFS, SJF, Round Robin, Priority, MLFQ" },
  { id: "page-replacement",  name: "Page Replacement",    description: "FIFO, LRU, Optimal, Clock" },
  { id: "deadlock",          name: "Deadlock Detection",  description: "RAG and Banker's Algorithm" },
  { id: "memory",            name: "Memory Management",   description: "Virtual memory, address translation, TLB" },
  { id: "mem-alloc",         name: "Memory Allocation",   description: "First/Best/Worst Fit with fragmentation" },
  { id: "thread-sync",       name: "Thread Sync",         description: "Mutex, Semaphore, RW-Lock" },
];
```

### 7.2 Engines

15 pure-function engines in `src/lib/os/`:

| Engine | Functions | Output |
|---|---|---|
| `scheduling.ts` (893 L) | `fcfs`, `sjf`, `roundRobin`, `priorityScheduling`, `mlfq`, `compareAlgorithms` | `ScheduleResult` with Gantt chart |
| `mlfq-scheduler.ts` | `mlfqScheduler` | 3-level multi-level feedback queue |
| `page-replacement.ts` | `fifoPageReplacement`, `lruPageReplacement`, `optimalPageReplacement`, `clockPageReplacement`, `generateReferenceString` | `PageResult` with hit/fault timeline |
| `deadlock.ts` | `detectDeadlock` | Resource Allocation Graph + cycle |
| `bankers-algorithm.ts` | `bankersAlgorithm` | Safe sequence + step trace |
| `memory.ts` | `simulateVirtualMemory` | Page table + TLB + frame state |
| `memory-alloc.ts` | `simulateFirstFit`, `simulateBestFit`, `simulateWorstFit`, `compareAllocAlgorithms` | `MemoryAllocStep[]` with fragmentation |
| `thread-sync.ts` (770 L) | `simulateMutex`, `simulateSemaphore`, `simulateReaderWriterLock` | `SyncEvent[]` per thread |
| `context-switch.ts` | `simulateContextSwitch`, `compareProcessVsThread` | Switch timeline |
| `system-calls.ts` | `simulateSystemCall`, `simulateSequence` (with `COMMON_SYSCALLS` table) | Syscall trace |
| `race-condition.ts` | `simulateRace`, `simulateWithMutex`, `countInterleavings` | Interleaving permutations |
| `thrashing.ts` | `simulateThrashing`, `findOptimal` | Working-set size sweep |
| `priority-inversion.ts` (641 L) | `simulate`, `simulateWithInheritance` | Inversion timeline |
| `cow-fork.ts` | `simulateCOWFork` | Page-share state pre/post fork |
| `buffer-overflow.ts` | `simulate`, `withCanary`, `withASLR` | Stack-frame timeline |

All run synchronously in < 50 ms, well below any worker-offload threshold (per `os-concepts-backend-analysis.md:78`).

### 7.3 Hook structure

`useOSModule` (`OSModule.tsx:2000`) is a 4,225-line hook. State is per-concept:

- **CPU Scheduling**: `processes: Process[]`, `algo: SchedulingAlgo`, `result: ScheduleResult | null`, `comparison: Record<string, ScheduleResult>`, currentTick for Gantt scrubbing.
- **Page Replacement**: `referenceString: number[]`, `frameCount: number`, `algo: PageAlgo`, `result: PageResult`, plus optional cross-algo comparison.
- **Deadlock**: `resources: Resource[]`, `processStates: ProcessState[]`, RAG edges. Toggles between detection mode and Banker's-mode.
- **Memory Management**: virtual addresses, page table entries, TLB hit/miss feed.
- **Memory Allocation**: holes + requests + algorithm; renders block timeline with `ALLOC_COLORS` (`OSModule.tsx:137-146`).
- **Thread Sync**: thread count, primitive type (`mutex | semaphore | rw-lock`), syncEvent timeline rendered as a swimlane Gantt.

### 7.4 Visualization primitives

| Primitive | Lines | Purpose |
|---|---|---|
| `GanttChart` (`OSModule.tsx:171-232`) | 60 | Stacked bar chart for scheduler results, time-scrubbable via `maxTick` prop |
| `MiniGanttChart` (`OSModule.tsx:236-292`) | 56 | Compact variant for the comparison panel |
| `SchedulingComparisonPanel` (`OSModule.tsx:296+`) | 200+ | Best-of badges across `avgWaitTime`, `avgTurnaroundTime`, `avgResponseTime`, `cpuUtilization` |
| `GCPauseLatencyVisualizer` (lazy) | `os/GCPauseLatencyVisualizer.tsx` | Garbage-collection pause-time visualizer; lazy-loaded only when a GC concept is opened |

### 7.5 SEO

`/os` (`src/app/os/page.tsx`) is a static server-rendered concept index using `OS_CONCEPTS` from `src/lib/seo/os-concepts-data.ts`. Per-concept pages at `/os/[concept]` (`src/app/os/[concept]/page.tsx`) include a long-form deep dive (`data.explanation` paragraph array), interview questions, and a "Open in Canvas" CTA that deep-links to `/?os-concept=<slug>`.

> **Quirk.** As of writing, the `/os/[concept]` SEO page does **not** embed the live OS module — it has a placeholder visualization tile (`os/[concept]/page.tsx:167-216`) that links back to the SPA. The interactive engines run only inside `OSModule.tsx`.

> **CORRECTION (2026-05-07):** The "Open in Canvas" CTA emits the href `/?os-concept=<slug>` (confirmed at `src/app/os/[concept]/page.tsx:195` and `:302`), but **nothing in the SPA reads `os-concept` from `searchParams`**. Grep returns zero matches for `os-concept` outside the SEO page itself. The CTA is effectively just a link to `/`; the user lands on whichever module Zustand last persisted, with `OSModule` not auto-activated and not auto-scrolled to the requested concept. Bare `/os` is a real route (concept index page) and `/os/[concept]` is a real route (per-concept SEO page). The "deep-link" claim is wishful — only `/database/[mode]` actually drives a module via `setActiveModule` on mount. Source: `09-ui-tour.md` v2 §1A and §1B.

---

## 8. Patterns module

### 8.1 Two distinct surfaces

The word "patterns" refers to **two separate things** in this codebase:

| Surface | Path | Role |
|---|---|---|
| **Design patterns** (GoF + modern) | `/patterns`, `/patterns/[slug]` | 26 reference articles for SEO. Sourced from `src/lib/seo/design-patterns-data.ts` (`DESIGN_PATTERNS`, `PatternCategory = "creational" | "structural" | "behavioral" | "modern"`). Each has `intent`, `motivation`, `applicability`, `structure`, `participants`, `consequences`, a `codeExample` string, and `relatedPatterns`. **No interactive playground** — these are server-rendered pages. |
| **Architecture playbooks** | Inside the system-design canvas (HLD module) | 8 canonical architectural patterns (`PLAYBOOKS` in `src/lib/patterns/playbook.ts:544`). Each is a node-list + edge-list + theory + failure-modes bundle ready to drop onto the canvas. Used by the system-design module's "Architecture Playbook" sidebar tab. |

### 8.2 Design patterns SEO

`src/app/patterns/page.tsx:45` builds a four-bucket grouped index (creational/structural/behavioral/modern) and `src/app/patterns/[slug]/page.tsx:21` statically generates 26 detail pages. `src/app/patterns/[slug]/opengraph-image.tsx` produces dynamic OG images. `src/app/patterns/loading.tsx` is the streaming fallback.

The detail page surfaces the pattern's `relatedPatterns` and `getRelatedLLDProblemsForPattern(pattern.title)` (from `src/lib/seo/internal-links.ts`), creating cross-links between the design-patterns surface and the LLD module's problems.

### 8.3 Architecture playbooks (`src/lib/patterns/playbook.ts`, 569 L)

```ts
// src/lib/patterns/playbook.ts:10-21
export interface ArchitecturePlaybook {
  id: string; name: string; category: string;
  description: string;
  whenToUse: string[]; whenNotToUse: string[];
  nodes: Node[]; edges: Edge[];
  failureModes: string[]; theory: string;
}
```

Catalog (`PLAYBOOKS`):

| ID | Category | Theory anchor |
|---|---|---|
| `cache-aside` | Caching | Temporal locality + LRU/Belady |
| `write-behind` | Caching | OS page-cache model + Little's Law |
| `circuit-breaker` | Resilience | EWMA + bulkhead |
| `cqrs` | Architecture | CQS principle + event sourcing + materialized views |
| `saga-choreography` | Distributed Transactions | Garcia-Molina 1987 + Outbox Pattern |
| `rate-limiting-token-bucket` | Resilience | RFC 2697 traffic shaping |
| `sidecar-service-mesh` | Infrastructure | Data plane / control plane (Envoy + Istiod) |
| `fan-out-fan-in` | Processing | MapReduce + Amdahl's Law |

Each playbook builds a runnable canvas topology — drop it on the system-design canvas, hit play, and the simulation engine drives realistic queuing through it.

> The HLD canvas (separate codemap) is responsible for rendering and editing these. The patterns module exports them as data; it doesn't own the canvas.

---

## 9. Diagram persistence

### 9.1 Schema

`src/db/schema/diagrams.ts:21`:

```ts
export const diagrams = pgTable("diagrams", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  /** React Flow nodes array stored as JSONB. */
  data: jsonb("data").notNull().default({}),
  templateId: uuid("template_id"),
  isPublic: boolean("is_public").notNull().default(false),
  forkCount: integer("fork_count").notNull().default(0),
  upvoteCount: integer("upvote_count").notNull().default(0),
  forkedFromId: uuid("forked_from_id"),
  createdAt: …, updatedAt: …,
});
```

`src/db/schema/simulations.ts:19`:

```ts
export const simulationRuns = pgTable("simulation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  config: jsonb("config").notNull().default({}),
  results: jsonb("results"),
  tickCount: integer("tick_count"),
  duration: integer("duration"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`src/db/schema/diagram-templates.ts:22` is **LLD-specific** (Mermaid `classDiagram` source + parsed `classes[]` and `relationships[]`) — used by the LLD module to seed the canvas, not by the interactive learning modules.

### 9.2 API surface

| Route | Methods | Auth | Use |
|---|---|---|---|
| `src/app/api/diagrams/route.ts` | `GET` (list user diagrams), `POST` (create) | `requireAuth()` | List + create |
| `src/app/api/diagrams/[id]/route.ts` | `GET` (public diagrams readable by anyone, private by owner only), `PUT`, `DELETE` | `requireAuth()` for write; mixed for read | Single-diagram CRUD |
| `src/app/api/simulations/route.ts` | `GET` (filter by `?diagramId=…`, default last 50), `POST` (save a run) | `requireAuth()` | Persist + list simulation results |

Read access for `GET /api/diagrams/[id]` is conditional:

```ts
// src/app/api/diagrams/[id]/route.ts:33-44
if (!diagram.isPublic) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (userId !== diagram.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

### 9.3 Auto-save and offline

`src/lib/sync/sync-bridge.ts:73` is the dual-layer persistence façade. The contract:

1. `save(designId, data)` writes to `localStorage["architex:diagram:<id>"]` immediately, then schedules a debounced (2 s) push to `/api/diagrams/<id>`.
2. `load(designId)` returns local data instantly, then in the background fetches the remote, compares `updatedAt` timestamps, and adopts the newer copy (last-write-wins).
3. `sync()` walks all `architex:diagram:*` keys with `dirty: true` and pushes them.

```ts
// src/lib/sync/sync-bridge.ts:40-43
const STORAGE_PREFIX = "architex:diagram:";
const DEBOUNCE_MS = 2_000;
```

> **Scope note.** SyncBridge is consumed by the **system-design canvas** (HLD module — separate codemap), not by Database/Algorithms/DS/OS. Those modules use their own dedicated `localStorage` keys for ephemeral mode state and do not call `/api/diagrams`.

### 9.4 Snapshots and share links

LLD has its own snapshot table (`src/db/schema/lld-design-snapshots.ts`). The canvas-side share-link feature in the Database module is **client-only**: state is base64-encoded into URL fragments via `encodeShareData` / `decodeShareData`:

```ts
// src/components/modules/database/useDatabaseModule.ts:178-197
function encodeShareData(data: Record<string, unknown>): string {
  try { return btoa(JSON.stringify(data)); } catch { return ""; }
}
function decodeShareData(encoded: string): Record<string, unknown> | null {
  try {
    const json = atob(encoded);
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch { return null; }
}
```

There is no "shared diagram" concept for B-Tree / Hash / LSM modes — the share is a stateless link the recipient's browser reconstructs.

---

## 10. Performance

### 10.1 Tick-rate decoupling: SimMetricsBus + flat Float64Array

The simulation engine's hottest write path used to push per-node metrics into Zustand, causing ~500 React renders/second. The fix is a **typed-array-backed flat buffer** that decouples write rate from render rate:

```ts
// src/lib/simulation/sim-metrics-bus.ts:1-15
/**
 * SimMetricsBus — TypedArray-Backed Flat Buffer for Simulation Metrics
 *
 * Replaces per-node Zustand writes with a zero-allocation flat buffer.
 * The orchestrator writes metrics here every tick. UI components read
 * on requestAnimationFrame via subscribers, NOT on every tick.
 *
 * This eliminates the ~500 renders/sec bug by decoupling tick rate
 * from React render rate.
 */
```

Memory layout: `[throughput, latency, errorRate, utilization, queueDepth, cacheHitRate]` per node × 6 Float64 × 512 max nodes = 24 KB total. UI subscribers receive **batched** notifications on `requestAnimationFrame` carrying a `Set<dirtyNodeId>`.

Note: there are **two** buses in the codebase — `SimMetricsBus` (legacy singleton, `sim-metrics-bus.ts`) and `SimulationMetricsBus` (V2 SIM-009, `simulation-metrics-bus.ts`). The orchestrator uses the V2 instance owned per-orchestrator (not a singleton).

### 10.2 Canvas sync interval

Even with the metrics bus, the orchestrator only pushes node-state updates into Zustand every `CANVAS_SYNC_INTERVAL = 10` ticks (`simulation-orchestrator.ts:67`):

```ts
// src/lib/simulation/simulation-orchestrator.ts:768-805
const shouldSyncCanvas = tickIndex % CANVAS_SYNC_INTERVAL === 0 || tickIndex === this.totalTicks - 1;
if (shouldSyncCanvas) {
  for (const [nodeId, res] of nodeResults) {
    canvasStore.updateNodeData(nodeId, { state, metrics: { … } });
  }
  /* update edge animations */
}
```

This keeps node-color and edge-flow updates at ~10 Hz even when ticks run at 100 Hz.

### 10.3 Particle path cache

Edge particle animations would naively re-evaluate quadratic-bezier curves every frame. `ParticlePathCache` (`src/lib/simulation/particle-path-cache.ts`) pre-samples 64 points per edge once and keeps the lookup table; per-frame work becomes O(1) array-index lookups with the path invalidated on geometry change.

```ts
// src/lib/simulation/particle-path-cache.ts:38
const SAMPLE_COUNT = 64;
```

### 10.4 Lazy module loading

Heavy modules are double-lazy:

1. The page-level `database-mode-app.tsx` uses `next/dynamic({ ssr: false })` on the wrapper.
2. The DS wrapper (`DataStructuresWrapper.tsx`) wraps an `Inner` component in `React.lazy()` because the inner imports ~24,000 lines of DS engine code.
3. The DS module further lazy-loads its own canvas (`index.tsx:225-227`):

```ts
// src/components/modules/data-structures/index.tsx:225-227
const DSCanvas = lazy(() =>
  import("./DSCanvas").then((m) => ({ default: m.DSCanvas }))
);
```

4. Algorithm visualizers are lazy via the `AlgorithmCanvas` dispatch.
5. Database "Learn panel" components (`ReplicationLagVisualizer`, `ShardingSimulator`, `ConsistencyLevelDemo`, `QueryPlanSimulation`, `GCPauseLatencyVisualizer`) are `React.lazy`'d.

### 10.5 Step-playback timer pattern

All step-playback hooks (algorithm, DS, every database mode) follow the same pattern: **one `useRef<setTimeout>`-or-`setInterval` per concurrent timeline**, with the timer always cleared on `unmount` and on `setIsPlaying(false)`:

```ts
// src/components/modules/data-structures/index.tsx:373-419 (excerpt)
useEffect(() => {
  if (!isPlaying) {
    if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
    playIntervalRef.current = null;
    return;
  }
  function scheduleNext() {
    setState((prev) => { /* … advance currentStepIdx */ });
    /* speed-aware: 2x delay for "interesting" steps */
  }
  /* … kick off the first step */
  return () => { if (playIntervalRef.current) clearTimeout(playIntervalRef.current); };
}, [isPlaying, playbackSpeed, playSonificationForStep]);
```

The database module duplicates this pattern per-mode — so a single mount holds 5+ timer refs (B-Tree, Hash, LSM, MVCC, ARIES, …) which are individually managed.

### 10.6 Algorithm choreography timing

Per-algorithm spring stiffness/damping/mass is tuned in `algorithm-choreography.ts`:

```ts
// src/lib/algorithms/algorithm-choreography.ts:82-98
'bubble-sort': {
  barTransition: { type: 'spring', stiffness: 150, damping: 22, mass: 1.2 },
  durationScale: 1.3,                  // 30% slower
  swapPulse: [1, 0.95, 1],            // slight compression — reluctant
  swapBounce: true,
},
'quick-sort': {
  barTransition: { type: 'spring', stiffness: 450, damping: 28, mass: 0.6 },
  durationScale: 0.8,                  // 20% faster
  sortedPulse: [1, 1.12, 1],
},
```

This isn't just a stylistic flourish — slower springs on slower algorithms reinforce the time-complexity intuition.

### 10.7 Virtualization

No off-the-shelf virtualization library is in use. Large traces (500+ steps) rely on:
- The bottom-panel log being capped at the last 100 entries (`prev.log.slice(-99)` is the convention across all modules).
- Time-travel snapshots being capped (`TimeTravel` keeps a sliding window — see `time-travel.ts` for the cap).
- Tick history being unbounded inside the orchestrator (the array in memory only — not persisted).

### 10.8 Reduced-motion / a11y

`AnimationStep.duration` is honored by `PlaybackController` but no module explicitly checks `prefers-reduced-motion`. There is a `SimulationAnnouncer` (`src/components/shared/SimulationAnnouncer.tsx`) that fires `aria-live` polite announcements during simulation; the algorithm `LiveDashboard` is the analogue for sorting/graph runs.

---

## 11. Quirks

### 11.1 `comlink` is in `package.json` but unused

```json
// architex/package.json:59
"comlink": "^4.4.2",
```

A `grep -rn "from ['\"]comlink['\"]" src` returns zero matches. The home-grown `worker-bridge.ts` is used by tests but no production code instantiates it either — see §3.5.

### 11.2 `useDatabaseModule` is a 3,570-line hook

This is intentional — `docs/architecture/database-module.md:140-148` justifies the choice (no cross-module sharing, no persistence beyond ER state, high-frequency updates). But the function alone is larger than the entire OS module's hook (`useOSModule` is one function inside a 4,225-line file but the hook itself is ~2,000 lines).

### 11.3 Database mode count drift

- The runtime supports **19 modes** (`DatabaseMode` union, `useDatabaseModule.ts:99-118`).
- The SEO data exposes **7 modes** (`docs/architecture/database-module.md:9` and `src/lib/seo/database-meta.ts`).
- The legacy doc lists **7 modes** as the "primary" set.

So `/database/[mode]` only pre-renders 7 SEO-canonical modes; the other 12 are reachable via the in-app sidebar but lack dedicated landing pages.

### 11.4 Two simulation metrics buses

`sim-metrics-bus.ts` (legacy) and `simulation-metrics-bus.ts` (V2 SIM-009) both exist. The orchestrator instantiates the V2 one per-instance (`simulation-orchestrator.ts:107`), and `index.ts:60-61` re-exports both. The legacy `SimMetricsBus.getInstance()` is still callable; it's not clear if anything in the UI still reads it.

### 11.5 OS interactive simulator decoupled from `/os/[concept]`

The SEO concept page links to `/?os-concept=<slug>` for the simulation rather than embedding it server-side. So the long-form SEO page is fully static, and the actual simulator only mounts when the SPA receives the deep-link query param. Same pattern as DS (`/ds/[slug]` redirects to `/#<slug>`).

> **CORRECTION (2026-05-07):** "the actual simulator only mounts when the SPA receives the deep-link query param" is wrong — the OS simulator mounts whenever Zustand's `activeModule === "os"`, regardless of any URL query. The `?os-concept=<slug>` query param is **NOT consumed by `OSModule.tsx` or `useOSModule()`** (grep confirms zero hits). The SEO link is a soft handoff to the SPA homepage that happens to pass an unused query string. The DS analogy is actually different: DS reads `window.location.hash` on mount inside the module (`data-structures/index.tsx:462-468`), so the hash *does* preselect a DS — but only if the user is already in the DS module. Source: `09-ui-tour.md` v2 §1B and `18-other-modules.md` §2.3.

### 11.6 ER-diagram canvas is hand-rolled SVG, not React Flow

There are **6 orphaned React Flow node/edge components** under `src/components/canvas/nodes/database/` and `src/components/canvas/edges/database/` (per `database-module.md:71-83`) — `EntityNode.tsx`, `WeakEntityNode.tsx`, `RelationshipDiamond.tsx`, `CrowsFootEdge.tsx`. None are imported. They were built for a React-Flow-based ER mode that was replaced by the current hand-rolled SVG canvas. DBL-177 tracks cleanup.

### 11.7 Algorithm `arraySnapshot` is the canonical truth

When an `AnimationStep` carries `arraySnapshot`, the canvas trusts it absolutely. Without it, the canvas falls back to a three-strategy inference (position mutations → swapping highlights → no-op). New algorithms should always emit `arraySnapshot` per step; the inference is brittle for non-swap mutations (e.g. counting sort's bucket writes).

### 11.8 Pseudocode is plaintext, not Markdown

`AlgorithmConfig.pseudocode: string[]` is one line per array element. No syntax tree, no formal grammar. The `CodePanel` tokenizer regex (`CodePanel.tsx:88`) treats both Python and TypeScript as best-effort source code — `procedure`/`then`/`to`/`down`/`step` are extra keywords added to make pseudocode highlight reasonably:

```ts
// src/components/algorithm-visualizer/CodePanel.tsx:59-67
const TS_KEYWORDS = new Set([
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
  'return', 'import', 'export', 'from', 'class', 'new', 'this', 'switch',
  /* … */
  'procedure', 'then', 'to', 'down', 'step', 'not', 'and', 'or',
]);
```

### 11.9 Engines are pure but `Math.random()` is everywhere

DS engines like `dsuMakeSet` use deterministic ID counters, but several places call `Math.random()` directly:
- Topology rule probability checks (`simulation-orchestrator.ts:611`).
- DS random-data helpers (`handleRandom` in `data-structures/index.tsx:1377+` calls `Math.random()` ~50 times).
- DS skip-list and Fibonacci-heap initializers.
- Algorithm sample-input generators.

So "deterministic" applies to the step ordering given fixed input, not across runs.

### 11.10 Workers are written but never wired

`src/lib/workers/simulation-worker.ts`, `algorithm-worker.ts`, `layout-worker.ts`, `minimap-worker.ts` are all complete and unit-tested via `worker-bridge.test.ts`, but no production code creates a `Worker` from them. ADR-006 calls this out as a "Negative consequence".

### 11.11 Tour replay races presentation mode

Database mode supports both a guided tour (`DatabaseTour.tsx`) and a presentation mode (`OSModule.tsx:3470+` analogue, `useDatabaseModule.ts:3486+`). They can both be active simultaneously in some edge cases — pressing the "Replay tour" button while presentation mode is on creates an overlay sandwich.

---

## 12. Open questions

1. **Why is `comlink` declared but never imported?** The hand-rolled `worker-bridge.ts` is functionally equivalent to comlink's own bridge but does not use comlink's proxy semantics. Either remove the dependency or migrate the bridge to comlink.
2. **When will the simulation worker offload land?** ADR-006 calls it out as planned; the worker file exists; nothing imports it. Is there a perf threshold (node count, tick rate) that triggers the migration?
3. **Is `SimMetricsBus.getInstance()` (legacy) still used by any UI component?** A grep for `SimMetricsBus` outside `index.ts` and the file itself would confirm.
4. **Should the 12 non-SEO database modes get their own landing pages?** Currently `/database/aries-recovery` is a 404 even though the runtime supports it. SEO-wise this is leaving search traffic on the table.
5. **Why does Algorithm have its own `recently-viewed` localStorage but DS doesn't?** DS tracks `exploredRef.current` per-session in memory only; once you reload, the set resets. Inconsistent UX.
6. **Is the inference fallback in `AlgorithmModule.tsx:583-628` deprecated?** All shipped sorting algorithms emit `arraySnapshot`; the swap-inference code might be dead.
7. **Vector-search, probabilistic, design, search, greedy, patterns categories don't appear in the `AlgorithmCanvas` `ALL_ALGORITHMS` list at line 41-45.** They're in the SEO landing-page aggregate (`/algorithms/[category]/[slug]/page.tsx:23-37`) but not in the visualizer's category dropdown — confirm whether these are visualizer-supported or SEO-only.
8. **Why does `useDatabaseModule` accept `initialMode?` but no other module does?** Algorithm and DS both deep-link via URL query/hash; database mode goes through a typed prop. Worth standardizing.

> **CORRECTION (2026-05-07):** The premise is half-wrong. **Algorithm does NOT deep-link via URL today** — `?algo=` is emitted by SEO landing pages but no SPA consumer reads it (verified via grep). DS *does* deep-link via the URL hash (`#<slug>`, read at `data-structures/index.tsx:462-468`), so DS is the only sub-state-via-URL example today, alongside `?lld=` for LLD. Database is unique in that its sub-state goes via a typed `initialMode` prop driven by the path segment `/database/[mode]`. So a more accurate framing of the open question is: "Three different mechanisms exist today (typed prop for DB, URL hash for DS, URL query for LLD); should they unify?" Source: `09-ui-tour.md` v2 §1B URL parameters table.
9. **Are the 8 architecture playbooks ever surfaced as SEO landing pages?** `/patterns/[slug]` only enumerates `DESIGN_PATTERNS` (the 26 GoF + modern). The 8 architecture playbooks live only inside the system-design module's sidebar.
10. **`SimulationAnnouncer` exists but is announcement coverage complete?** Worth cross-checking against the chaos-event taxonomy and issue codes — silent failures are an accessibility blocker.
11. **Time-travel buffer cap:** the comment says "Push N tick frames"; what's N? `time-travel.ts` is short enough to inline-document but the cap isn't called out at the orchestrator level.
12. **ER-diagram canvas reuses `BPlusTreeViz` from `src/components/database/BPlusTreeViz.tsx`** — but that file imports DS-module engines (`bplus-tree-ds.ts`). The Database module's other modes use `src/lib/database/` engines. Is this cross-module dependency intentional or accidental?
