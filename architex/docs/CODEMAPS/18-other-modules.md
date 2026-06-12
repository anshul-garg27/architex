# Codemap 18 — Other modules + cross-module bridge + innovation subsystem

> Modules under-documented or skipped by the first wave (codemaps 01–09):
> **system-design**, **distributed**, **networking**, **concurrency**, **security**, **interview**, plus the **innovation subsystem**
> (`src/lib/innovation/*`, `src/components/innovation/*`) and the **cross-module bridge system**
> (`src/components/cross-module/*`, `src/lib/cross-module/*`).
>
> Repo root: `/Users/a0g11b6/Downloads/projects/architex/architex`.
> All paths and line numbers are relative to that root unless absolute.
> Companion docs (skimmed, not duplicated):
> `docs/architecture/distributed-backend-analysis.md`,
> `docs/architecture/networking-backend-analysis.md`,
> `docs/architecture/concurrency-backend-analysis.md`,
> `docs/architecture/security-backend-analysis.md`,
> `docs/architecture/system-design-backend-analysis.md`.
>
> The first wave already covered:
> 02 — learn pipeline (top-level content shapes and seed plumbing for every module);
> 03 — interactive learning (database, algorithms, DS, OS, patterns deep-dives);
> 01 — canvas + LLD module body. This codemap fills in everything else listed
> in `ui-store.ts`'s 13-module union, plus the "innovation" / "cross-module" surfaces.

---

## 1. Purpose — why these modules + the innovation subsystem live separately

The 13 module IDs in `src/stores/ui-store.ts:4-17` (`ModuleType` union) all share **the same workspace shell** (`src/components/shared/workspace-layout.tsx` — sidebar / canvas / properties / bottom panel). What differs is the **content adapter** each module exports: a `useXxxModule()` hook that returns a `ModuleContent` shape (`src/components/modules/module-content.ts:3-13`):

```ts
export interface ModuleContent {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
  bottomPanel: React.ReactNode;
  mockOverlay?: React.ReactNode | null;
  confirmDialog?: React.ReactNode | null;
  breadcrumb?: { section?: string; topic?: string };
}
```

`src/app/page.tsx:95-112` maps each `ModuleType` to a thin **wrapper** in `src/components/modules/wrappers/`. The wrapper imports the `useXxxModule()` hook from the corresponding `XxxModule.tsx`, calls it, and forwards the resulting `ModuleContent` up to the shell via the `onContent` callback. Up to **3 modules stay mounted at a time** (`src/app/page.tsx:307-313`) — the active one is visible, the rest are `display:none` to preserve their internal state.

The modules in this doc all follow that contract but vary widely in **how they fill the four panels**:

| Module | Sidebar | Canvas | Properties | Bottom panel |
|---|---|---|---|---|
| system-design | shared `ComponentPalette` | shared `DesignCanvas` (React Flow) | shared `PropertiesPanel` | shared `BottomPanel` (metrics, simulation, chaos) |
| distributed | sim-list buttons | per-sim SVG visualizer | concept primer + key concepts | event log + Learn tab |
| networking | protocol list + transport controls | sequence diagram + per-protocol custom viz | step-by-step inspector | message log |
| concurrency | demo list + global Step/Play/Reset | per-demo split visualizer | concept paragraphs | (none — sidebar holds controls) |
| security | topic list + topic-specific sub-controls | per-topic step visualizer | sub-view inspector + DDoS visualizer | step transcript |
| interview | challenges / paths / profile tabs | challenge browser ↔ canvas ↔ results | challenge metadata | notes + anti-pattern detector |

The **innovation subsystem** (`src/lib/innovation/`, `src/components/innovation/`) is a separate "library shelf" of **completed but unmounted** components: skill tree, time attack mode, design battles, war stories, etc. They are not currently wired into any module page — see §11.

The **cross-module bridge system** spans every module's right rail and sidebar; it provides typed navigation between modules with payload context (e.g. "deploy this LLD pattern as a system-design template").

---

## 2. Module IDs & URL contract

The full inventory of module IDs and how the user reaches them.

### 2.1 The `ModuleType` union (`src/stores/ui-store.ts:4-17`)

```ts
export type ModuleType =
  | "system-design"
  | "algorithms"
  | "data-structures"
  | "lld"
  | "database"
  | "distributed"
  | "networking"
  | "os"
  | "concurrency"
  | "security"
  | "ml-design"
  | "interview"
  | "knowledge-graph";
```

13 IDs. `MODULE_LABELS` and `MODULE_COLORS` mirror the union at `src/lib/cross-module/bridge-types.ts:28-59`. `ALL_MODULES` re-exports the same list at `src/lib/cross-module/bridge-types.ts:11-25`.

### 2.2 Module → wrapper → hook mapping (full table)

| `ModuleType` value | Wrapper file (`src/components/modules/wrappers/`) | Module hook (`src/components/modules/`) | Lines (hook host file) |
|---|---|---|---|
| `system-design` | `SystemDesignWrapper.tsx` | inline JSX in wrapper (no hook — composes shared canvas/palette directly) | n/a |
| `algorithms` | `AlgorithmWrapper.tsx` | `AlgorithmModule.tsx` → `useAlgorithmModule` | (covered in 03) |
| `data-structures` | `DataStructuresWrapper.tsx` + `DataStructuresInner.tsx` | `data-structures/` directory | (covered in 03) |
| `lld` | `LLDWrapper.tsx` | `LLDModule.tsx` → `useLLDModule` | (covered in 01) |
| `database` | `DatabaseWrapper.tsx` | `DatabaseModule.tsx` → `useDatabaseModule` | (covered in 03) |
| `distributed` | `DistributedWrapper.tsx` | `DistributedModule.tsx` → `useDistributedModule` | 5478 lines, hook at L3711 |
| `networking` | `NetworkingWrapper.tsx` | `NetworkingModule.tsx` → `useNetworkingModule` | 3045 lines, hook at L2473 |
| `os` | `OSWrapper.tsx` | `OSModule.tsx` → `useOSModule` | (covered in 03) |
| `concurrency` | `ConcurrencyWrapper.tsx` | `ConcurrencyModule.tsx` → `useConcurrencyModule` | 3192 lines, hook at L2353 |
| `security` | `SecurityWrapper.tsx` | `SecurityModule.tsx` → `useSecurityModule` | 5168 lines, hook at L4583 |
| `ml-design` | `MLDesignWrapper.tsx` | `MLDesignModule.tsx` → `useMLDesignModule` | (out of scope) |
| `interview` | `InterviewWrapper.tsx` | `InterviewModule.tsx` → `useInterviewModule` | 1563 lines, hook at L897 |
| `knowledge-graph` | `KnowledgeGraphWrapper.tsx` | `KnowledgeGraphModule.tsx` → `useKnowledgeGraphModule` | (covered in 02) |

The wrappers are ~11-line `memo()` shims (e.g. `DistributedWrapper.tsx:7-11`):

```tsx
export default memo(function DistributedModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useDistributedModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
```

`SystemDesignWrapper.tsx` is the exception — it inlines the `ModuleContent` directly (`src/components/modules/wrappers/SystemDesignWrapper.tsx:11-23`):

```tsx
export default memo(function SystemDesignModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content: ModuleContent = useMemo(() => ({
    sidebar: <ComponentPalette />,
    canvas: (<ReactFlowProvider><DesignCanvas /></ReactFlowProvider>),
    properties: <PropertiesPanel />,
    bottomPanel: <BottomPanel />,
  }), []);
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
```

### 2.3 URL contract

**Important correction to the briefing:** the `/?id=<type>:<slug>` form does **not** exist as a generic module URL contract today. Only LLD has implemented a deep-link query parameter, and its key is `?lld=` (not `?id=`).

| Module | URL persistence? | Param shape | Source |
|---|---|---|---|
| `lld` | yes | `?lld=pattern:<id>` / `?lld=problem:<id>` / `?lld=solid:<id>` / `?lld=sequence:<id>` / `?lld=state-machine:<id>` | `src/components/modules/lld/hooks/useLLDModuleImpl.tsx:236-282` |
| every other module | **no** | (state lives in Zustand only — selecting a sim/topic does not update the URL) | grep confirms — no `searchParams.set` or `window.history` calls in `DistributedModule.tsx`, `NetworkingModule.tsx`, `ConcurrencyModule.tsx`, `SecurityModule.tsx`, `InterviewModule.tsx` |

The active module itself is **not** in the URL either. Switching modules calls `useUIStore.getState().setActiveModule(id)` — the store persists to `localStorage` via the `persist` middleware (`src/stores/ui-store.ts:128-...`). On refresh, the user lands back on whichever module they had open, but the URL is always `/`.

### 2.4 Path-based routes that act as module entry points

A few `src/app/<path>/page.tsx` routes also drop the user into a module via `setActiveModule`:

| Path | Lands on module | Source |
|---|---|---|
| `/database/[mode]` | `database` | `src/app/database/[mode]/database-mode-app.tsx:40-45` calls `setActiveModule("database")` on mount |
| `/landing` | (marketing landing — does not pre-select a module) | `src/app/landing/page.tsx` |
| `/interviews` | static SEO page listing 15 companies — does **not** open the interview module; it links to `/interviews/<company>` slug pages | `src/app/interviews/page.tsx:44-74` |
| `/concepts/<slug>`, `/patterns/<slug>`, `/problems/<slug>`, `/lld-problems/<slug>`, `/ds/<slug>`, `/blog/<slug>` | SEO/marketing surfaces, not module shells | (covered in 08) |

So in practice, every "other" module documented here is reached either by:
- **Sidebar icon click** (the navigation rail in `WorkspaceLayout` calls `setActiveModule`),
- **Command palette** (`src/components/shared/command-palette.tsx:118` shows `setActiveModule("distributed")` style calls),
- **Cross-module bridge** (`BridgeButton.handleClick` → `setActiveModule(targetModule)` — see §10), or
- **`localStorage` restoration** on page refresh.

There is no canonical deep link to "open distributed module on Raft" today — Raft is the default `activeSim` (`DistributedModule.tsx:3713`), and the user must click another sim manually.

---

## 3. system-design module — the meta module

**File:** wrapper `src/components/modules/wrappers/SystemDesignWrapper.tsx`. Hook: none (inline). All four panels delegate to the shared canvas system already covered in codemap 01 (canvas + LLD).

### 3.1 What it is

The system-design module is the **default** `activeModule` (`src/stores/ui-store.ts:131`: `activeModule: "system-design"`). It is the "blank slate" HLD canvas — components dragged from a palette, wired with edges, simulated, scored. Every other module is, in some sense, an alternative content surface that hangs off the same shell.

### 3.2 What renders

`SystemDesignWrapper.tsx:12-21` returns a `ModuleContent` whose four slots are pure shared-component imports:

| Slot | Component | File |
|---|---|---|
| `sidebar` | `<ComponentPalette />` | `src/components/canvas/panels/ComponentPalette.tsx` |
| `canvas` | `<ReactFlowProvider><DesignCanvas /></ReactFlowProvider>` | `src/components/canvas/DesignCanvas.tsx` |
| `properties` | `<PropertiesPanel />` | `src/components/canvas/panels/PropertiesPanel.tsx` |
| `bottomPanel` | `<BottomPanel />` | `src/components/canvas/panels/BottomPanel.tsx` |

The `ComponentPalette` (`ComponentPalette.tsx:133-...`) reads from `PALETTE_ITEMS` (`src/lib/palette-items.ts`), an array of `PaletteItem` rows grouped by `NodeCategory`. Each row is draggable; the drag payload is JSON-encoded as `application/architex-node` (`ComponentPalette.tsx:75-89`):

```ts
e.dataTransfer.setData(
  "application/architex-node",
  JSON.stringify({ type: item.type, label: item.label, category: item.category, icon: item.icon, config: item.defaultConfig }),
);
```

Drop is handled by `DesignCanvas.tsx`, which decodes the payload and calls `useCanvasStore.addNode(...)`.

### 3.3 What content drives it

The system-design module is content-light at the catalog level — most of its "content" is the catalog of **draggable component types** (`PALETTE_ITEMS`) and the in-canvas behaviour produced by the simulation engine.

The seed (`src/db/seeds/system-design.ts:18-176`) extracts and writes four content types into `module_content`:

| `contentType` in seed | Source array | Count |
|---|---|---|
| `template` | `SYSTEM_DESIGN_TEMPLATES` (`src/lib/templates`) | 55 |
| `blueprint` | `getSolutionBlueprints()` | 15 |
| `chaos-event` | `CHAOS_EVENTS` (`src/lib/simulation/chaos-engine`) | 88 |
| `topology-rule` | `RULE_DATABASE.getAllProfiles()` (`src/lib/simulation/rule-database`) | 81 |

Templates and blueprints become preset diagrams (loaded via the Template / Playbook galleries — `src/app/page.tsx:116-222`). Chaos events become the catalog the bottom-panel `ChaosQuickBar` draws from. Topology rules feed the in-canvas anti-pattern detector.

### 3.4 What differentiates it from the LLD canvas

LLD also uses React Flow (`src/components/modules/lld/...`), but with a **different node component vocabulary**: LLD nodes represent classes / interfaces / state-machine states, not infrastructure components. LLD's wrapper has its own `useLLDModule()` shape; system-design's wrapper inlines a plain `ComponentPalette`. The two modules:

- **Share** the React Flow runtime, the canvas zoom/pan/snap, the export pipeline (PNG / SVG / JSON), the undo/redo stack and the version-history bus.
- **Diverge** in: palette content, node kinds, simulation availability (system-design has the chaos engine + simulation orchestrator running on top; LLD has none of that), side-panel content (system-design's `PropertiesPanel` shows replicas / config / capacity; LLD's shows class fields / methods / state transitions).

System-design is also the only module that runs the **simulation orchestrator** (`src/lib/simulation/simulation-orchestrator.ts`). When the user clicks "Run simulation" in the bottom panel, the orchestrator walks the graph, applies queueing math (`queuing-model.ts`), tracks pressure (`pressure-counters.ts`), generates SLA / cost / capacity reports (`sla-calculator.ts`, `cost-model.ts`, `capacity-planner.ts`), and emits events on `simulation-metrics-bus.ts`. None of the other modules in this doc invoke that pipeline.

---

## 4. distributed module — 11 protocol simulators

**File:** `src/components/modules/DistributedModule.tsx` (5478 lines). Hook: `useDistributedModule` at L3711.

### 4.1 What it is

A catalog of 11 distributed-systems algorithms, each presented as an **interactive step-by-step simulator** with custom SVG visualization, control panel, and event log. The user picks one from the sidebar and runs it; there is no global "compose" surface — each sim is independent.

### 4.2 The 11 simulations

`DistributedModule.tsx:79-135` defines `SIMULATIONS: SimDef[]`:

| `DistributedSim` id | Display name | Engine module | Highlighted as |
|---|---|---|---|
| `raft` | Raft Consensus | `src/lib/distributed/raft.ts` (`RaftCluster`) | "Used by Kubernetes (etcd) and CockroachDB" |
| `consistent-hashing` | Consistent Hashing | `consistent-hash.ts` (`ConsistentHashRing`) | "Used by Cassandra and DynamoDB" |
| `vector-clocks` | Vector Clocks | `vector-clock.ts` (`VectorClockSimulation`) | causality tracking |
| `gossip` | Gossip Protocol | `gossip.ts` (`GossipProtocol`) | epidemic dissemination |
| `crdts` | CRDTs | `crdt.ts` (`CRDTSimulation`) | G-Counter / LWW-Set / OR-Set / G-Map |
| `cap-theorem` | CAP Theorem | `cap-theorem.ts` (`CAPCluster`) | partition + CP/AP demo |
| `two-phase-commit` | Two-Phase Commit | `two-phase-commit.ts` | coordinator + N participants |
| `saga` | Saga Pattern | `saga.ts` | choreography with compensation |
| `map-reduce` | MapReduce | `map-reduce.ts` | parallel word count |
| `lamport-timestamps` | Lamport Timestamps | `lamport-timestamps.ts` | scalar logical clocks |
| `paxos` | Paxos | `paxos.ts` | "Used by Google Spanner and Chubby" |

Each engine is a **client-only pure-TypeScript class or function** in `src/lib/distributed/` — no server round-trip. The seed (`src/db/seeds/distributed.ts:13-26`) only writes a thin `simulation` content row per sim with name + difficulty + summary; the protocol logic stays in the bundle.

### 4.3 What renders

- **Sidebar** (`DistributedSidebar`, L2995-3030): vertical list of the 11 `SIMULATIONS` rows. Below the list, `DistributedModule.tsx:5353-5359` renders sim-specific controls (e.g. "Crash Node" button for Raft, "Add Node" / "Add Key" for Consistent Hashing, "Run" / "Step" for Saga).
- **Canvas** (per-sim component, e.g. `RaftCanvas` at L159, `ConsistentHashCanvas`, `GossipCanvas`, etc.): SVG visualization with animated message arrows for in-flight RPCs (`AnimatedMessage` interface, L143-153). Animation duration is `ANIMATION_DURATION_MS = 300`.
- **Properties** (`DistributedProperties`, L3043-...): static narrative for the active sim — analogy ("Raft is like a classroom: the teacher tells everyone what to write down…", L3076-3078), key concepts list, guarantees, and a "Used By" section. Optionally links into a concept page via `CONCEPTS.find((c) => c.slug === conceptSlug)` — the slug map is at L3034-3041.
- **Bottom panel** (`DistributedBottomPanel`, L3620-3707): two tabs — `log` (last 100 events with colour-coded type chips: `become-leader` green, `node-crash` red, `partition-created` red, `merge` blue, …) and `learn` (lazy-loaded `TopologyAwareFailureModes` + `SplitBrainVisualizer`, L55-57 import).

### 4.4 Distinguishing features

- **Auto-demo on first visit** (`DistributedModule.tsx:3741-3768`): the Raft sim auto-steps for 5 seconds and then prints `"Demo complete! Try clicking 'Crash Node' to see how Raft recovers from failures."` to the event log. Gated by `localStorage.getItem('architex_distributed_demo_seen')`.
- **XP integration**: leader-elected awards 10 XP exactly once per session (`crashedNodesRef`, `raftLeaderAwarded` ref at L3869, L3905-3908). Similar gates exist for gossip-converged and crdt-merge.
- **The two LEARN sub-components** (`src/components/modules/distributed/`):
  - `SplitBrainVisualizer.tsx` (5 nodes, partition slider, three resolution strategies: `fencing` / `quorum` / `crdt` — L51-64) — the only "scenario builder" beyond the standard sim list.
  - `TopologyAwareFailureModes.tsx` (ring / star / mesh topologies, 4 failure modes — `single-node`, `leader-failure`, `cascade`, plus partition — with applicability matrices, L55-...).

---

## 5. networking module — 9 protocols, sequence-diagram first

**File:** `src/components/modules/NetworkingModule.tsx` (3045 lines). Hook: `useNetworkingModule` at L2473.

### 5.1 What it is

A catalog of 9 network protocols and comparison views, each driven by a **sequence diagram** (`SequenceDiagram` component, L142-...) showing actors as columns and messages as labelled arrows. The user can step / play / scrub through messages.

### 5.2 The 9 protocols

`NetworkingModule.tsx:82-128` defines `PROTOCOLS: ProtocolDef[]`:

| `Protocol` id | Display name | Engine | Notes |
|---|---|---|---|
| `tcp-handshake` | TCP Handshake | `src/lib/networking/tcp-state-machine.ts` | 3-way handshake, data, 4-way teardown |
| `tls-1.3` | TLS 1.3 | `tls13-handshake.ts` + `tls-handshake.ts` (TLS 1.2 comparison) | 1-RTT handshake; 0-RTT toggle (`show0RTT`) |
| `dns-resolution` | DNS Resolution | `dns-resolution.ts` (`DNSResolver`) | recursive lookup; `DNS_SCENARIOS` array |
| `http-comparison` | HTTP/1.1 vs 2 vs 3 | `http-comparison.ts` (`compareHTTPVersions`) | side-by-side latency totals |
| `websocket` | WebSocket | `websocket-lifecycle.ts` (`WebSocketSimulation`) | upgrade + heartbeat + close |
| `cors` | CORS | `cors-simulator.ts` | preflight + credentialed flows |
| `cdn-flow` | CDN Flow | `cdn-flow.ts` | cache-hit vs cache-miss paths |
| `api-comparison` | REST vs GraphQL vs gRPC | `api-comparison.ts` | request count + bytes + latency for `list-users`, `get-user`, `create-user`, `nested-resource` |
| `serialization` | Serialization | `serialization-comparison.ts` | JSON / Protobuf / MessagePack / Avro byte size on `SAMPLE_USER_DATA` |

### 5.3 What renders

- **Sidebar** (`NetworkingSidebar`, L1929-...): protocol list + step / prev / next / play / pause / reset transport controls + step counter `{stepIndex+1} / {messages.length}`.
- **Canvas**: `SequenceDiagram` for every protocol except CORS / CDN / API / Serialization, which have **custom visualizations** (e.g. `CORSVisualization`, `CDNVisualization`, `APIComparisonVisualization`, `SerializationVisualization`) showing browser ↔ server with origin/credentials swatches, cache layers, etc.
- **Properties** (`NetworkingProperties`, L2032-...): the full step list ("Tap a step to inspect"), per-protocol toggles (TLS 1.2 comparison, 0-RTT, DNS scenario, CORS config inputs, CDN scenario, API operation, JSON sample data textarea).
- **Bottom panel** (`NetworkingBottomPanel`, L2354-...): step transcript with description text and from/to actor labels.

### 5.4 Distinguishing features

- **Bottom panel auto-opens on first visit** (`NetworkingModule.tsx:2499-2505`):
  ```ts
  useEffect(() => {
    const key = "architex-networking-first-visit";
    if (!localStorage.getItem(key)) {
      setBottomPanelOpen(true);
      localStorage.setItem(key, "true");
    }
  }, [setBottomPanelOpen]);
  ```
- **Lazy LEARN components** (`src/components/modules/networking/`): `PacketJourneySimulator.tsx` (full DNS→TCP→TLS→HTTP request lifecycle with bytes/latency totals, 730+ hops), `ConnectionPoolVisualization.tsx` (idle/active/queued connections with timeout bars, `PoolConfig`/`PoolMetrics` types), `ProtocolDecisionTree.tsx` (interactive decision tree to recommend a protocol given communication shape — `DECISION_TREE` at L34), `ARPViz.tsx` (placeholder — returns `null`, awaiting wire-up to `arp-simulation.ts`).
- The serialization view runs a **client-side parse-and-encode**: the user pastes JSON in a textarea (`sampleDataJson` at L2482) and the bytes-per-format are recomputed via `compareSerializationFormats(sampleData)` (L2583-2586).

---

## 6. concurrency module — 11 sync primitives

**File:** `src/components/modules/ConcurrencyModule.tsx` (3192 lines). Hook: `useConcurrencyModule` at L2353.

### 6.1 What it is

11 classic concurrency demos, each visualized as a side-by-side **safe vs unsafe** comparison or a discrete-time scheduler. Like distributed and networking, each demo has its own engine in `src/lib/concurrency/` (12 files).

### 6.2 The 11 demos

`ConcurrencyModule.tsx:81-148` defines `DEMOS: DemoDef[]`:

| `ConcurrencyDemo` id | Display name | Engine | What it shows |
|---|---|---|---|
| `race-condition` | Race Condition | `race-condition.ts` (`unsafeIncrement`, `safeIncrement`, `unsafeIncrementRandom`) | unsafe loses updates vs mutex-protected safe; **histogram of 100 random runs** (`handleRunHistogram`, L2431-2439) |
| `producer-consumer` | Producer-Consumer | `producer-consumer.ts` | bounded buffer with wait/signal |
| `dining-philosophers` | Dining Philosophers | `dining-philosophers.ts` (`simulateNaive`, `simulateOrdered`) | naive deadlocks, ordered prevents it |
| `event-loop` | Event Loop | `event-loop.ts` | call stack + microtask + macrotask queues; `EventLoopDemoId` switches between `setTimeout-vs-promise`, etc. |
| `thread-lifecycle` | Thread Lifecycle | `thread-lifecycle.ts` | 7-state animated transitions with `selectedTransition` for click-to-explain |
| `go-goroutines` | Go Goroutines | `goroutines.ts` | goroutines + channels + select + `WaitGroups` |
| `readers-writers` | Readers-Writers | `readers-writers.ts` | shared read, exclusive write, starvation timeline |
| `sleeping-barber` | Sleeping Barber | `sleeping-barber.ts` | barber + N customer chairs |
| `async-patterns` | Async Patterns | `async-patterns.ts` | `Promise.all` / `race` / `allSettled` / `any` |
| `deadlock-demo` | Deadlock Demo | `deadlock-demo.ts` (`simulateDeadlock`, `simulateDeadlockPrevention`) | circular wait vs resource ordering |
| `lock-comparison` | Lock Comparison | `mutex-comparison.ts` (`simulateSpinLock`, `simulateMutex`, `simulateTTAS`, `computeMetrics`) | SpinLock vs Mutex vs TTAS — CPU usage, latency, bus traffic |

### 6.3 What renders

- **Sidebar** (`ConcurrencySidebar`, L2314-...): demo list. Below the list, the hook attaches **global Step / Play / Reset / step counter** controls (L2656-2684) — controls are sidebar-level, not bottom-panel level.
- **Canvas** (per-demo Viz component): split view (left = unsafe, right = safe) for race-condition / dining-philosophers / deadlock-demo; thread-pool-style timeline for the others. Lock-comparison shows three columns side by side.
- **Properties** (L2688-2752): one paragraph of explanatory copy per demo (`active === "race-condition" && (...)` etc.) — **inlined in the hook**, not a separate component.
- **Bottom panel**: not customised — the module does not return one; the shared shell shows nothing or whatever the previous module had.

### 6.4 Distinguishing features

- The race-condition view ships with a **Monte Carlo histogram** (`RaceConditionHistogram`) — not a step animation. The user clicks "Run 100 times" and the bar chart shows the distribution of final counter values vs the expected value (L2554-2561).
- Auto-play tick is **400 ms** (L2489) — slower than distributed's 100 ms.
- The seed (`src/db/seeds/concurrency.ts:18-55`) imports `EVENT_LOOP_DEMOS`, `ASYNC_PATTERN_DEMOS`, `GOROUTINE_DEMOS` from `@/lib/concurrency/*` and emits **four content types** (`demo`, `event-loop-demo`, `async-pattern`, `goroutine-demo`) into `module_content`. The 8 demos in the seed list (L18-27) are a subset of the 11 visible in the UI — `event-loop` / `thread-lifecycle` / `go-goroutines` are seeded under their specific content types instead.
- The LEARN component `src/components/modules/concurrency/ThreadPoolSaturationVisualizer.tsx` is a separate fixed-pool / queue / rejection visualizer driven by `simulateThreadPool(poolSize, maxQueue, taskBurst)`. It is **not currently mounted** anywhere in `ConcurrencyModule.tsx` — it is referenced in the seed (`thread-pool` row at concurrency.ts:26) but the module body uses inline canvases.

---

## 7. security module — 11 topics, crypto + auth + web

**File:** `src/components/modules/SecurityModule.tsx` (5168 lines). Hook: `useSecurityModule` at L4583.

### 7.1 What it is

A catalog of 11 security topics covering OAuth, JWT, classical crypto (Diffie-Hellman, AES), the HTTPS handshake, CORS, certificate verification, password hashing, three rate-limiting algorithms, and the OWASP web-attack triad (XSS / CSRF / SQLi). Each topic has a **step visualization** plus a topic-specific control surface in the sidebar.

### 7.2 The 11 topics

`SecurityModule.tsx:90-146` defines `TOPICS: TopicDef[]`:

| `SecurityTopic` id | Display name | Engine module(s) | Sub-controls |
|---|---|---|---|
| `oauth` | OAuth 2.0 / OIDC | `oauth-flows.ts`, `oauth.ts`, `device-auth.ts` | flow toggle: `auth-code-pkce` / `client-credentials` / `device-auth` (sidebar L2698-2737) |
| `jwt` | JWT Lifecycle | `jwt-engine.ts`, `jwt-attacks.ts` | sub-view: `lifecycle` / `attacks`; attack types `none-algorithm` / `token-replay` / `algorithm-confusion` |
| `diffie-hellman` | Diffie-Hellman | `diffie-hellman.ts` | inputs: `p`, `g`, Alice's `a`, Bob's `b` |
| `aes` | AES Encryption | `aes-engine.ts` | plaintext + key (hex), state machine across SubBytes / ShiftRows / MixColumns / AddRoundKey rounds |
| `https-flow` | HTTPS Flow | `https-flow.ts` | domain input |
| `cors` | CORS | `cors.ts` | origin / target / method / headers / credentials |
| `cert-chain` | Certificate Chain | `cert-chain.ts` | scenario: valid / expired / revoked / self-signed |
| `password-hashing` | Password Hashing | `password-hashing.ts` | password input + cost factor |
| `rate-limiting` | Rate Limiting | `rate-limiting-demo.ts`, `rate-limiter.ts` | side-by-side Token Bucket / Sliding Window / Leaky Bucket; capacity / refill / window / max requests / leak rate inputs |
| `web-attacks` | Web Attacks | `web-attacks.ts`, `csrf.ts`, `csp.ts`, `sanitize.ts`, `ssrf.ts` | attack type: `xss` / `csrf` / `sqli`; defense mode toggle |
| `encryption` | Encryption Comparison | `encryption-comparison.ts` | side-by-side symmetric / asymmetric / hybrid |

### 7.3 What renders

- **Sidebar** (`SecuritySidebar`, L2639-...): 11-topic list + topic-specific sub-controls (the OAuth flow toggle L2698-2737 is a representative example; JWT, web-attacks have their own sub-control blocks below).
- **Canvas**: per-topic viz. `OAuthSequenceDiagram` (L199-...) is the OAuth-specific 4-column lifeline diagram. JWT shows a 3-segment encoded card. Diffie-Hellman shows two parties exchanging modular-exponent values. AES shows the 4×4 state matrix mutating between rounds. Rate-limiting shows three algorithm side-by-side. Web-attacks shows attack-flow diagrams with a "Defense ON / OFF" overlay.
- **Properties** (`SecurityProperties` via `useSecurityPropertiesContext`, L2915-...): topic-specific inspector. The hook builds a giant `securityPropsCtx` (L5050-5099) with every topic's state (steps, indices, configs) and the `SecurityProperties` component renders the right subset based on `active`.
- **Properties (extra)**: `DDoSSimulationVisualizer` is rendered **below** the `SecurityProperties` panel, always (L5129-5132). It is not gated by topic — even on OAuth, the DDoS phase chart is visible at the bottom of the right rail.
- **Bottom panel** (`SecurityBottomPanel`, L4072-...): per-topic step transcript. For OAuth: the actor → action chain. For AES: hex state dumps per round. For rate-limiting: tick-by-tick request fates.

### 7.4 Distinguishing features

- **The `useSecurityModule` hook is the largest module hook in the codebase** by state count — it owns OAuth flow, JWT sub-view + attack type, DH parameters, AES plaintext/key/states/index, HTTPS domain, CORS five-tuple, cert chain scenario, hash password+cost, three rate-limiting algorithms with five tunable params each, web-attack type + defense flag, encryption type + index. The `securityPropsCtx` `useMemo` deps array spans 24 entries (L5089-5098).
- **In-canvas DDoS sub-component** (`src/components/modules/security/DDoSSimulationVisualizer.tsx`) — driven by a 6-phase `PHASES` table (L24-31): normal / ramp-up / peak-attack / mitigation-on / diminishing / recovery. Tick-by-tick legitimate vs attack RPS, server load %, status colour. Always rendered below the properties panel — see §7.3.
- **JWT attacks sub-mode** (`jwt-attacks.ts`): the `attackType` enum (`none-algorithm`, `token-replay`, `algorithm-confusion`) at `SecurityModule.tsx:150` produces three distinct attack sequences inside the same JWT view.
- The seed (`src/db/seeds/security.ts:14-31`) lists **15 topic rows** even though the UI surfaces 11 — extra rows include `oauth-pkce`, `oauth-client-credentials`, `oauth-device-auth` (one row per OAuth flow), `jwt-lifecycle` and `jwt-attacks` (split from the unified UI tab), and `ddos-simulation` (the always-on visualizer). This is a controlled denormalization for SEO/learn-page granularity.

---

## 8. interview module — 71 challenges, drill mode for HLD

**File:** `src/components/modules/InterviewModule.tsx` (1563 lines). Hook: `useInterviewModule` at L897.

### 8.1 What it is

The interview-prep surface. A library of 71 system-design challenges (`CHALLENGES` array at `src/lib/interview/challenges.ts:36`, with IDs from `design-cache` to `design-bookmark-manager` and 46 more), each with requirements / checklist / hints / company tags. The user picks one, lands in a "challenge detail" view, then either **starts designing** on a real React Flow canvas or enters **mock interview mode** (full-screen overlay with timer pressure).

### 8.2 The five interview modes

`InterviewModule.tsx:893` declares `type InterviewMode = "browse" | "detail" | "designing" | "results" | "mock-interview" | "srs-review"` (six states; `srs-review` is technically separate from the design flow). State transitions in the hook:

| Mode | What renders in canvas slot | Trigger to enter |
|---|---|---|
| `browse` | `<ChallengeBrowser>` (3-column card grid + daily challenge card) | initial state |
| `detail` | `<ChallengeDetailView>` (requirements list, checklist preview, hints preview, "Start Designing" / "Mock Interview" / "History" CTAs) | click a challenge card or sidebar row |
| `designing` | `<ChallengeCanvasView>` — `<DesignCanvas>` + `<ChallengeOverlay>` + `<SimulateYourAnswerButton>` + `<EstimationPad>` | click "Start Designing" |
| `results` | `<ScoreResultsView>` — multi-dimensional score chart | click "Submit Design" |
| `mock-interview` | full-screen `<MockInterviewMode>` overlay (rendered via `mockOverlay` slot) | click "Mock Interview" |
| `srs-review` | `<SRSReviewSession>` (concept flashcard front/back) | click "Start Review" in the profile dashboard |

### 8.3 The scoring rubric

Computed by `computeHeuristicScores(challenge, nodes, edges, hintsUsed)` at L125-225. The function inspects the canvas snapshot (`serializeCanvasForScoring`, L67-123) and emits **6 dimension scores** (1-10 each), each penalised by hints used:

| Dimension | Heuristic |
|---|---|
| `functional` | `% of challenge.requirements that pass checkRequirement(req, nodes)` × 10 |
| `scalability` | base 2 + replicas (+2-3) + cache (+2) + messaging (+1) + LB (+1) + ≥5 nodes (+1), capped at 10 |
| `reliability` | base 2 + LB (+2) + replicas (+2-3) + observability (+1) + messaging (+1) + edges ≥ nodes (+1) |
| `dataModel` | base 1 + DB (+3) + cache (+2) + storage type diversity |
| `api` | base 2 + LB (+2) + edge type diversity (+2-3) + API gateway (+1) |
| `tradeoffs` | base 2 + category diversity (+2-4) + component variety + node/edge count |

The full rubric specification with weights lives at `src/lib/interview/scoring.ts:14-...` — `SCORING_DIMENSIONS` defines 7 dimensions (the 6 above plus `simulation`) with weights summing to 1.0 (`functional 0.20`, `scalability 0.20`, `reliability 0.15`, `tradeoffs ...`, etc.) and a 1-10 word-rubric for each level. The runtime `computeHeuristicScores` is a simplified heuristic; the per-dimension weight is applied by `calculateOverallScore` (`scoring.ts:147`).

### 8.4 Sidebar tabs

`InterviewModule.tsx:263`: `type SidebarTab = "challenges" | "profile" | "paths"`.

- **Challenges** (default): search, difficulty 1–5 filter, category filter (`classic` / `modern` / `infrastructure` / `advanced` / `lld` — `ALL_CATEGORIES` at `challenges.ts:26`), company multi-select filter (`ALL_COMPANIES` populated at `challenges.ts:2106-...`), sort dropdown (`difficulty-asc` / `difficulty-desc` / `popular` / `newest`), and the sidebar list with best-score chips.
- **Paths**: `<LearningPathView>` in the canvas — structured curricula referencing challenge IDs.
- **Profile**: `<ProfileDashboardPanel>` — `<ProgressDashboard>` + `<XPDisplay>` + `<StreakBadge>` + `<SRSDashboard>` + `<AchievementGrid>`.

### 8.5 Cross-store wiring

The hook touches **three persisted Zustand stores**:

- `useInterviewStore`: active challenge, status, hintsUsed, timer, evaluation (write via `submitChallengeAction` and `setEvaluation`).
- `useProgressStore`: total XP, streak days, last active date, best score per challenge, `addAttempt` (records `ChallengeAttempt`), `addXP`, `updateStreak`.
- `useCanvasStore`: `clearCanvas` on start, `getState().nodes/edges` on submit.

Achievements: after submission, `checkAchievements(stats)` from `src/lib/interview/achievements.ts` is called against a stub `UserStats` (`buildStubUserStats`, L229-259). New achievements pop a toast and call `notifyAchievementUnlocked(name, xp, icon)` (`src/hooks/use-notification-triggers.ts`).

### 8.6 SRS (spaced repetition)

The hook seeds an SRS deck on mount (L929-942) — one `ReviewCard` per unique concept across all challenges, via `createCard(concept)` from `src/lib/interview/srs.ts`. `getDueCards(srsCards)` filters to today's batch; `<SRSReviewSession>` walks the user through them; the session callback awards `5 × totalReviewed` XP.

### 8.7 Daily challenge

`getDailyChallenge()` from `src/lib/interview/daily-challenge.ts` is invoked once per calendar day (L962-978) — guarded by `localStorage["architex-daily-challenge-notified"]` storing today's `YYYY-MM-DD`. When triggered, calls `notifyDailyChallengeAvailable(challenge.title)`. The card renders at the top of the `<ChallengeBrowser>` (L795-799).

### 8.8 In-module sub-components (`src/components/modules/interview/`)

- `SimulateYourAnswerButton.tsx` — the bottom-of-canvas "Simulate Your Answer" CTA visible during `designing` mode (`InterviewModule.tsx:884`). Disabled state shows a 2 s "Simulating..." spinner before resetting (L29-32).
- `AntiPatternAutoDetector.tsx` — the right-half tab in the bottom panel during designing (L1542-1545). Renders a `PLACEHOLDER_PATTERNS` array (L38-60: SPOF / no-cache / no-LB) when `isDesigning` is true. Currently uses placeholder data — no live canvas-graph analyzer is wired in.

---

## 9. innovation subsystem

**Locations:** `src/lib/innovation/` (12 data + helper files), `src/components/innovation/` (10 standalone components).

The innovation subsystem is a **completed but not currently wired-in** library shelf. Each module is a self-contained bundle of TypeScript helpers + a corresponding React component. Grep confirms that **none** of the three documented files below are imported outside the `innovation/` directory itself — they are dormant features, ready to be slotted into a future page.

### 9.1 `time-attack.ts`

**File:** `src/lib/innovation/time-attack.ts` (392 lines). **Component:** `src/components/innovation/TimeAttackMode.tsx` (410 lines).

#### What it is

Timed system-design challenges. The user picks a challenge, a countdown starts, and an auto-checker validates canvas state against requirements every second. Score = `requirementScore × (1 + remainingSecondsFraction)`, range `[0, 200]`.

#### Key types (`time-attack.ts:23-91`)

```ts
export interface TimeAttackChallenge {
  challengeId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number;
  requirements: TimeAttackRequirement[];
}

export type AutoCheck =
  | { kind: 'hasMinNodes'; min: number }
  | { kind: 'hasNodeType'; nodeType: string }
  | { kind: 'hasConnection'; from: string; to: string }
  | { kind: 'hasMinEdges'; min: number }
  | { kind: 'hasNodeTypeCount'; nodeType: string; min: number };
```

#### The 8 built-in challenges (`time-attack.ts:242-377`)

| `challengeId` | Difficulty | Time limit | Required components |
|---|---|---|---|
| `basic-web-app` | beginner | 120 s | client + web-server + database + ≥2 edges |
| `load-balanced-api` | beginner | 180 s | client + load-balancer + ≥2 web-server + cache + database + ≥5 edges |
| `event-driven-system` | intermediate | 240 s | api-gateway + message-queue + ≥2 worker + database + (api-gateway → message-queue) edge + ≥6 nodes + ≥6 edges |
| `microservices-setup` | intermediate | 300 s | client + api-gateway + ≥3 app-server + message-queue + database + cache + ≥8 nodes + ≥8 edges |
| `cdn-optimized-site` | intermediate | 240 s | client + dns + cdn + load-balancer + web-server + storage + (dns → cdn) edge + ≥6 edges |
| `real-time-analytics` | advanced | 300 s | event-bus + stream-processor + timeseries-db + cache + api-gateway + metrics-collector + ≥8 nodes + ≥8 edges |
| `secure-api-platform` | advanced | 360 s | client + dns + firewall + rate-limiter + api-gateway + load-balancer + ≥2 app-server + database + secret-manager + ≥10 nodes |
| `ml-inference-pipeline` | advanced | 360 s | api-gateway + load-balancer + ml-inference + cache + message-queue + batch-processor + storage + database + ≥9 nodes |

#### Component API

```ts
export interface TimeAttackModeProps {
  className?: string;
  canvasOverride?: CanvasSnapshot;
}
```

The component pulls live canvas state from `useCanvasStore((s) => s.nodes)` and `s.edges` (TimeAttackMode.tsx:96-98), runs `tickSession` every 1 s, and emits a final `TimeAttackScore` when time expires or all requirements pass.

### 9.2 `architecture-gallery.ts`

**File:** `src/lib/innovation/architecture-gallery.ts` (634 lines). **No corresponding component** — the data is consumed only by tests. A separate `src/lib/ai/architecture-generator.ts` defines a different `ARCHITECTURES` map for AI generation (15 entries, different shape).

#### What it is

Reference architectures for 15 well-known tech companies, each as a simplified node + edge graph plus 3 named "key decisions".

#### The 15 architectures (`architecture-gallery.ts:80-633`)

| Name | Scale | Key insight |
|---|---|---|
| Netflix | massive | Open Connect CDN inside ISPs; Eureka + Zuul; chaos engineering |
| Uber | massive | H3 hexagonal grid; Ringpop consistent hashing; Schemaless on MySQL |
| Twitter | massive | Hybrid fan-out (push for normal, pull for celebrities); Manhattan KV; Earlybird search |
| WhatsApp | massive | Erlang/Mnesia; lean backend serving 2B users |
| Instagram | massive | (graph-based feed) |
| YouTube | massive | (transcoding pipeline) |
| Slack | large | (message routing) |
| Dropbox | large | (block-level dedup) |
| Airbnb | large | (search + booking) |
| LinkedIn | large | (Kafka backbone — open-sourced) |
| Pinterest | large | (visual search + boards) |
| Spotify | large | (audio CDN + recommendation) |
| Discord | large | (voice + guild sharding) |
| Stripe | medium | (payments + webhooks) |
| GitHub | medium | (Git over HTTPS + CI) |

Public helpers: `getArchitecture(name)`, `getArchitectureNames()`, `getArchitecturesByScale(s)`.

### 9.3 `skill-tree.ts`

**File:** `src/lib/innovation/skill-tree.ts` (232 lines). **Component:** `src/components/innovation/SkillTree.tsx` (526 lines, hexagonal SVG layout).

#### What it is

A 5-track XP/prerequisite skill graph. Each node has prerequisites and an XP cost; nodes light up when prereqs are unlocked and the user has enough XP.

#### The 5 tracks (`skill-tree.ts:67-73`)

| Track | Color (base/glow) | Node count | First node | Final node |
|---|---|---|---|---|
| `architecture` | `#6366f1` / `#818cf8` | 9 | `arch-fundamentals` (0 XP, col 0) | `arch-system-interview` (600 XP, col 5) |
| `databases` | `#f59e0b` / `#fbbf24` | 9 | `db-fundamentals` | `db-data-modelling` (500 XP, col 5) |
| `distributed-systems` | `#10b981` / `#34d399` | 10 | `dist-fundamentals` | `dist-large-scale` (600 XP, col 4) |
| `performance` | `#ef4444` / `#f87171` | 10 | `perf-fundamentals` | `perf-chaos` (500 XP, col 5) |
| `security` | `#8b5cf6` / `#a78bfa` | 10 | `sec-fundamentals` | `sec-incident` (500 XP, col 4) |

Total: 48 nodes. Layout hints (`column`, `row`) are baked into each `SkillNode` so the component can lay out hexagons deterministically.

#### Sample track edges

`architecture` track DAG: `arch-fundamentals → {arch-api-design, arch-load-balancing} → {arch-caching, arch-messaging} → {arch-microservices, arch-event-driven} → arch-scalability → arch-system-interview`.

#### Public helpers

- `checkUnlockable(nodeId, progress)` — true if not unlocked, all prereqs unlocked, and `progress.availableXp ≥ node.xpRequired`.
- `getTrackProgress(track, progress)` — `0–100` percentage of nodes unlocked in track.
- `getTrackEdges(track)` — `[fromId, toId][]` for SVG line rendering.
- `createInitialProgress(startingXp = 0)` — empty `UserProgress`.

### 9.4 Other innovation components (referenced but not deeply documented here)

`src/components/innovation/` also contains:

| File | Lines | Purpose |
|---|---|---|
| `DesignBattle.tsx` | 549 | "Battle two designs" — graph diff + voting |
| `DesignReview.tsx` | 465 | AI-style design review with annotations |
| `ExplanationTooltip.tsx` | 295 | Click-to-explain for canvas nodes |
| `IncidentTimeline.tsx` | 232 | Postmortem-style incident replay |
| `IntentCursor.tsx` | 257 | "Why did the user click here?" cursor heatmap |
| `ProtocolDeepDive.tsx` | 730 | Wire-format byte-by-byte view (paired with `protocol-deep-dive.ts`) |
| `StreakProtector.tsx` | 361 | Freeze tokens for streak preservation |
| `WarStoryViewer.tsx` | 848 | Narrative postmortem reader (paired with `war-stories.ts`) |

These all import from their `src/lib/innovation/*.ts` peers and are completely self-contained.

### 9.5 Integration status

A grep across `src/app` and `src/components` (excluding `src/components/innovation/`) for `TimeAttackMode`, `SkillTree`, `WarStoryViewer`, `DesignBattle`, etc. returns **zero matches**. The lib helpers are only consumed by:
- their own component (`SkillTree.tsx`, `TimeAttackMode.tsx`, `ProtocolDeepDive.tsx`, etc.),
- their own tests (`__tests__/skill-tree.test.ts`, `__tests__/protocol-deep-dive.test.ts`, `__tests__/design-review.test.ts`, `__tests__/design-battles.test.ts`).

Conclusion: the entire innovation subsystem is **dark code today** — completed, tested, but not yet plugged into a route or module. It is staged for future surfacing.

---

## 10. Cross-module bridge system

**Locations:** `src/components/cross-module/` (10 files, 1125 LOC), `src/lib/cross-module/` (8 files).

### 10.1 What it does

Lets a user "carry context" from one module to another. Example: from the database module's ER diagram, a "Deploy this schema" button creates a `DatabaseToSystem` payload and switches `activeModule` to `system-design`; the system-design canvas then receives the payload and adds a database node configured per the schema.

### 10.2 The 10 typed payload kinds (`bridge-types.ts:61-160`)

```ts
export type BridgePayload =
  | AlgorithmToSystem
  | DataStructureToSystem
  | DatabaseToSystem
  | DistributedToSystem
  | NetworkingToSystem
  | ConcurrencyToSystem
  | LLDToSystem
  | SecurityToSystem
  | InterviewSimulate
  | KnowledgeGraphOpenConcept;
```

Each payload carries module-specific config. Example (`bridge-types.ts:90-96`):

```ts
export interface DistributedToSystem {
  type: "distributed-to-system";
  consensusAlgorithm: "raft" | "paxos" | "zab" | "pbft";
  shardingStrategy?: "consistent-hashing" | "range" | "hash";
  replicationFactor?: number;
  consistencyLevel?: "strong" | "eventual" | "causal";
}
```

### 10.3 Components

| Component | File:line | Role |
|---|---|---|
| `BridgeButton` | `src/components/cross-module/BridgeButton.tsx:26-117` | The clickable trigger. Variants `default` / `compact` / `card`. `handleClick` calls `setBridge(payload, source, target)` then `setActiveModule(target)` (L38-41). |
| `BridgeLink` | `src/components/cross-module/BridgeLink.tsx:23-68` | Link variant of the button — used by `BridgePanel`. |
| `BridgePanel` | `src/components/cross-module/BridgePanel.tsx:19-59` | Sidebar widget showing all `getBridgesFromModule(activeModule)` rows from the static registry. Mounted in `src/app/page.tsx:292` as `<BridgePanel className="mx-2 my-3" />` inside the composed sidebar. |
| `RecommendedBridges` | `src/components/cross-module/RecommendedBridges.tsx:30-94` | Right-rail widget. Calls `evaluateRules(context)` from `bridge-rules.ts` against the current activity (concept / algorithm / data structure / pattern / topic / tags) and shows ranked suggestions. Mounted at `src/app/page.tsx:301`. |
| `BridgeConsumer` | `src/components/cross-module/BridgeConsumer.tsx:15-61` | Watches `pendingBridge` from `useCrossModuleStore` and, when one arrives, calls `dispatchBridge(payload)` (`src/lib/cross-module/bridge-handlers.ts`) to apply side-effects (e.g. spawn a node), then opens `<ContextDrawer>` with the result. Mounted at `src/app/page.tsx:342`. |
| `ContextDrawer` | `src/components/cross-module/ContextDrawer.tsx:48-...` | Slide-in 320 px wide right-side drawer showing the bridge payload, `BridgeHandlerResult.details.configOverrides`, and a "Simulate" button. Closes on Esc (L60-65). |
| `ModuleContextBar` | `src/components/cross-module/ModuleContextBar.tsx:19-84` | Top bar showing "You came from [Module A] → [Module B] [Back]". Mounted at `src/app/page.tsx:334` (`fixed top-0 left-12 right-0 z-40`). Visible only when `activeContext` is non-null. |
| `ConceptModuleLinks` | `src/components/cross-module/ConceptModuleLinks.tsx` | Links a concept to all modules that teach it. |
| `SkillRadarChart` | `src/components/cross-module/SkillRadarChart.tsx` | 5-axis radar of theory/practice mastery per module, pulled from `progress-store`. |
| `NextModuleNudge` | `src/components/shared/NextModuleNudge.tsx:15-80` | Shown in the sidebar footer when the user has explored ≥80 % of the current module (`getModuleProgress(activeModule).percentage >= 80` at L26). Picks the bridge target with the **lowest** progress percentage as the suggested next stop. Mounted at `src/app/page.tsx:293`. |

### 10.4 The composed shell

`src/app/page.tsx:286-303` shows how these are stitched onto every module's panels:

```tsx
const composedSidebar = (
  <>
    {sidebar}
    <BridgePanel className="mx-2 my-3" />
    <NextModuleNudge className="my-3" />
  </>
);

const composedProperties = (
  <>
    {properties}
    <RecommendedBridges className="mx-2 my-3" />
  </>
);
```

So every module — distributed, networking, concurrency, security, interview, system-design — automatically inherits both the static bridge registry list (`BridgePanel`) and the rule-based recommendations (`RecommendedBridges`) without having to wire them itself.

### 10.5 Stores

The bridge state lives in `useCrossModuleStore` (separate from `useUIStore`). Key state:
- `pendingBridge: BridgePayload | null` — set by `BridgeButton.handleClick`, read by `BridgeConsumer`'s effect.
- `activeContext: CrossModuleContext | null` — set after dispatch; powers `ModuleContextBar`.
- `clearBridge()` — called by `BridgeConsumer` after dispatch (`BridgeConsumer.tsx:34`).

### 10.6 The static registry

`src/lib/cross-module/bridge-registry.ts:15-...` defines `BRIDGE_REGISTRY: BridgeLink[]` — a hand-curated list of every navigable bridge in the platform. Examples: `algo-sys-latency` (algorithms → system-design), `algo-sys-throughput`, `ds-sys-cache` (data-structures → system-design), `ds-sys-index` (data-structures → database), `db-sys-schema`, etc. Each row has a `payloadFactory` that produces a default `BridgePayload`. `getBridgesFromModule(module)` filters by `sourceModule`.

---

## 11. Quirks / gaps

- **Innovation subsystem is dormant.** §9 — `TimeAttackMode`, `SkillTree`, `WarStoryViewer`, etc. are completed components with tests but **no consumer** outside their own files. The architecture-gallery data has no UI at all.
- **`src/lib/ai/architecture-generator.ts`** defines a separate `ARCHITECTURES` constant (`Record<ArchitectureKey, GeneratedArchitecture>`) — a different shape from `src/lib/innovation/architecture-gallery.ts`. The two arrays cover overlapping companies but with unrelated structures (the AI generator's is a Record keyed by slug; the innovation gallery's is an array of richer `ReferenceArchitecture` rows). They are not unified.
- **`ARPViz.tsx` is a placeholder** that returns `null` (`src/components/modules/networking/ARPViz.tsx:10-12`). The header comment says "Will be wired to the `ARPSimulation` engine for step-by-step playback" — an `arp-simulation.ts` engine exists in `src/lib/networking/arp-simulation.ts` but the visualizer is unimplemented. `dhcp-simulation.ts` engine also exists in lib but has no corresponding viz at all.
- **`AntiPatternAutoDetector.tsx`** in the interview module renders **placeholder static data** (`PLACEHOLDER_PATTERNS` array of 3 fixed warnings — SPOF, no-cache, no-LB — at L38-60) when `isDesigning` is true. There is no live canvas-graph analyzer feeding it.
- **Concurrency module has no bottom panel.** Its `useConcurrencyModule()` return shape (L2652-...) only sets `sidebar` / `canvas` / `properties` — no `bottomPanel`. The shared shell falls back to its empty default for the bottom slot. This is intentional: concurrency demos use a global Step / Play / Reset bar **inside the sidebar** instead of the bottom panel.
- **Distributed seed mismatch.** `src/db/seeds/distributed.ts:13-25` lists 11 sims; the UI `SIMULATIONS` array (`DistributedModule.tsx:79-135`) also lists 11. The seed `description` strings are **shorter** than the UI ones (e.g. seed says `"Atomic commit protocol with coordinator and participants"`; UI says the same but the Raft entry adds `"Used by Kubernetes (etcd) and CockroachDB"`). The seed is the SEO-facing copy; the UI is the in-product copy.
- **Security seed surfaces 15 topics from 11 UI tabs.** §7.4 — `oauth-pkce`, `oauth-client-credentials`, `oauth-device-auth`, `jwt-lifecycle`, `jwt-attacks`, and `ddos-simulation` are each separate seed rows even though OAuth's three flows live behind one tab in the UI, JWT's two sub-views live behind one tab, and DDoS lives below the properties panel without a tab at all.
- **System-design wrapper is unique.** It's the only wrapper that doesn't call a `useXxxModule()` hook — it builds the `ModuleContent` inline (`SystemDesignWrapper.tsx:11-23`). This implies system-design has no module-level state of its own beyond what's in `useCanvasStore`, `useUIStore`, `useSimulationStore`, etc.
- **No URL contract for sim/topic deep-linking.** §2.3 — only LLD persists its sub-state (`?lld=pattern:singleton`). Distributed, networking, concurrency, security, interview cannot be deep-linked to "open this sim/topic"; the active sim is in-memory only.
- **`BridgePanel` and `RecommendedBridges` are always rendered.** §10.4 — even on modules with no outgoing bridges, both widgets mount. The panel returns `null` if `bridges.length === 0` (`BridgePanel.tsx:29`); `RecommendedBridges` returns `null` if `matchingRules.length === 0` (`RecommendedBridges.tsx:58`). So they self-hide on empty.
- **`NextModuleNudge` requires 80%+ progress** (`NextModuleNudge.tsx:26`) and at least one outgoing bridge. On the default `system-design` module after a fresh install, it never shows.
- **Interview module's "paths" sidebar tab** shows a placeholder ("Browse structured learning paths in the main panel") in the sidebar (L585-590); the actual path list renders in the **canvas** slot via `<LearningPathView>`. So the sidebar tab acts as a navigation shortcut, not a content surface.
- **`ScoreResultsView` does not display the rubric weights.** `calculateOverallScore(scores)` applies the `SCORING_DIMENSIONS` weights but the UI shows raw 1-10 dimension scores side by side without the weight column.
- **`ChallengeOverlay.checkRequirement` is exported and reused** by `computeHeuristicScores` (imported at `InterviewModule.tsx:38`). The overlay's "auto-detect requirements" is the same function the score uses — so the live progress bar and the final score are guaranteed consistent.

---

## 12. Open questions

- **Will the innovation subsystem be activated?** Tests exist; components are written; data is curated. Is there a planned integration page, or is it "feature-shelf" intentionally?
- **Should `ARPViz.tsx` and the missing DHCP visualizer be implemented or removed?** They appear to be partial work.
- **Is `architecture-gallery.ts` the canonical reference architectures, or `architecture-generator.ts`?** The latter is consumed by the AI module; the former by nothing. Convergence would clarify.
- **Will the URL contract be unified?** A scheme like `?id=distributed:raft` or `/<module>/<slug>` would let the user share a deep link to a specific sim/topic — currently impossible outside LLD.
- **Why does the security module always show DDoS?** It is rendered below the properties panel regardless of the active topic (`SecurityModule.tsx:5129-5132`). Intentional cross-cutting "infrastructure" reminder, or oversight?
- **Should `AntiPatternAutoDetector` be wired to the live `RULE_DATABASE`?** The system-design module's simulation orchestrator already flags anti-patterns from the canvas graph; the interview module is using placeholder data instead.
- **Concurrency module's missing bottom panel** — is this consistent with the "every module has 4 panels" mental model in `ModuleContent`, or should the global Step/Play/Reset move from sidebar to bottom panel for parity?
