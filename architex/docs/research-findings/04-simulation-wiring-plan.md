# Simulation Wiring Plan

**Date:** 2026-04-11
**Scope:** Complete plan to connect the simulation engine libraries to the canvas UI and make the simulation functional

---

## 1. Current State Assessment

### 1.1 What Exists

The simulation engine consists of five library modules totaling ~1,980 lines of well-documented, well-typed TypeScript:

**Traffic Generator** (`lib/simulation/traffic-simulator.ts` -- 295 lines)
- `TrafficGenerator` class with `generate(config, durationMs, tickMs)` method
- Produces `TrafficTimeline` with per-tick `TrafficTick` objects
- Supports 5 traffic patterns: constant, sine-wave, spike, ramp, random
- Supports 3 distributions: poisson, normal, uniform
- `poissonSample()` function with Box-Muller normal approximation for large lambda

**Queuing Model** (`lib/simulation/queuing-model.ts` -- 377 lines)
- M/M/1 queue: utilization, queue length, wait time, system time
- M/M/c queue (Erlang-C): same metrics for multi-server systems
- Little's Law: L = lambda * W (and inverse)
- Percentile estimation via exponential distribution
- `simulateNode(arrivalRate, serviceRate, serverCount)` -- unified helper returning `NodeSimulationResult`

**Metrics Collector** (`lib/simulation/metrics-collector.ts` -- 399 lines)
- `MetricsCollector` class with `recordRequest(nodeId, latencyMs, success, timestampMs)`
- Circular buffer for sliding-window throughput (requests/sec)
- Sorted array with binary search for O(log n) percentile computation
- Per-node `NodeTracker` breakdown
- `getMetrics()` returns `SimulationMetrics` compatible with simulation store

**Chaos Engine** (`lib/simulation/chaos-engine.ts` -- 582 lines)
- `ChaosEngine` class with inject/remove/expire/query API
- 30 typed chaos events across 5 categories (infrastructure, network, data, traffic, dependency)
- Each event type has: severity, duration, affected node types, description
- `getEventsForNode(nodeId)` and `isNodeAffected(nodeId)` queries

**Capacity Planner** (`lib/simulation/capacity-planner.ts` -- 327 lines)
- `estimateCapacity(input: CapacityInput): CapacityEstimate`
- Back-of-envelope: DAU to RPS, bandwidth, storage, DB ops, cache hit rate, server count, monthly cost
- `formatEstimate()` for human-readable output
- Uses throughput and latency constants from `lib/constants/`

### 1.2 What's Missing

The fundamental missing piece is a **SimulationOrchestrator** that:

1. **Builds a topology** from canvas nodes and edges
2. **Generates traffic** using TrafficGenerator
3. **Routes requests** through the topology graph
4. **Computes per-node metrics** using queuing models
5. **Applies chaos modifiers** that degrade node performance
6. **Records metrics** via MetricsCollector
7. **Pushes state** to the simulation store (which drives the UI)
8. **Drives visual updates** -- node colors, edge animations, sparklines

Currently, pressing "Play" sets `status: "running"` and nothing else happens. There is no timer, no computation, no data flow.

---

## 2. SimulationOrchestrator Design

### 2.1 Architecture

```
Canvas Store (nodes/edges)
        |
        v
[Topology Builder] --- extracts graph structure
        |
        v
[SimulationOrchestrator]
  |        |        |         |
  v        v        v         v
Traffic   Queuing   Chaos    Metrics
Generator  Model   Engine   Collector
        |
        v
[Simulation Store] (status, metrics, ticks)
        |
        v
UI Components (MetricsDashboard, node colors, edge animations)
```

### 2.2 Core Classes

#### TopologyBuilder

Extracts a simulation-compatible graph from canvas state:

```typescript
// lib/simulation/topology-builder.ts

import type { Node, Edge } from "@xyflow/react";

export interface SimNode {
  id: string;
  type: string;                    // "web-server", "load-balancer", etc.
  serviceRatePerMs: number;        // mu: requests this node handles per ms
  serverCount: number;             // c: parallel instances (from node config)
  maxQueueSize: number;            // max pending requests
  isEntryPoint: boolean;           // receives traffic from outside
  downstreamIds: string[];         // nodes this node forwards to
  upstreamIds: string[];           // nodes that send to this node
  config: Record<string, unknown>; // raw node config
}

export interface SimEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;                    // "http", "grpc", etc.
  baseLatencyMs: number;           // inherent edge latency
  weight: number;                  // for load balancing (equal by default)
}

export interface SimTopology {
  nodes: Map<string, SimNode>;
  edges: SimEdge[];
  entryPoints: string[];           // node IDs that receive external traffic
}

export function buildTopology(
  canvasNodes: Node[],
  canvasEdges: Edge[],
): SimTopology {
  // 1. Convert canvas nodes to SimNodes
  // 2. Derive serviceRatePerMs from node type defaults + config overrides
  // 3. Build adjacency from edges
  // 4. Identify entry points (nodes with no incoming edges, or Client nodes)
  // 5. Return topology
}
```

**Default service rates by node type** (requests per millisecond):

| Node Type | Default mu (req/ms) | Rationale |
|---|---|---|
| load-balancer | 0.5 | 500 req/ms, minimal processing |
| api-gateway | 0.2 | 200 req/ms, auth + routing overhead |
| web-server | 0.1 | 100 req/ms (Node.js Express benchmark) |
| database | 0.05 | 50 req/ms (Postgres simple query ~0.5ms) |
| cache | 0.5 | 500 req/ms (Redis GET ~0.1ms) |
| queue | 0.3 | 300 req/ms (Kafka throughput) |
| cdn | 1.0 | 1000 req/ms (static file serving) |
| storage | 0.02 | 20 req/ms (S3 latency) |

#### SimulationOrchestrator

The main engine class:

```typescript
// lib/simulation/orchestrator.ts

export class SimulationOrchestrator {
  private topology: SimTopology;
  private generator: TrafficGenerator;
  private collector: MetricsCollector;
  private chaosEngine: ChaosEngine;
  private timeline: TrafficTimeline | null = null;
  private currentTick: number = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(topology: SimTopology) {
    this.topology = topology;
    this.generator = new TrafficGenerator();
    this.collector = new MetricsCollector({ windowMs: 10_000 });
    this.chaosEngine = new ChaosEngine();
  }

  // -- Lifecycle --
  start(trafficConfig: TrafficConfig, durationMs: number, tickMs: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;

  // -- Tick processing --
  processTick(tickIndex: number): TickResult;

  // -- Chaos --
  injectChaos(eventTypeId: string, targetNodeIds: string[]): ChaosEvent;
  removeChaos(instanceId: string): void;

  // -- Queries --
  getMetrics(): SimulationMetrics;
  getNodeMetrics(nodeId: string): NodeMetrics | null;
  getNodeState(nodeId: string): "idle" | "healthy" | "degraded" | "overloaded" | "down";
}
```

### 2.3 Request Routing Algorithm

For each tick:

1. Get the `TrafficTick` for this index (requestCount, rateRps)
2. For each request in the tick:
   a. Enter at a random entry point (Client node or first load balancer)
   b. Traverse the graph following edges, applying queuing delay at each node
   c. At load balancers: distribute to downstream nodes (round-robin or weighted)
   d. At each node: compute `simulateNode(arrivalRate, serviceRate, serverCount)`
   e. Apply chaos modifiers (latency injection, failure rate, etc.)
   f. Record the result via `MetricsCollector.recordRequest()`
3. Push aggregated metrics to simulation store

### 2.4 Chaos Modifier Application

When a chaos event is active on a node, modify the node's simulation parameters:

| Chaos Event | Modifier |
|---|---|
| node-crash | Set service rate to 0 (all requests fail) |
| node-slow | Multiply service rate by 0.1 (10x slower) |
| cpu-spike | Multiply service rate by 0.3 |
| memory-pressure | Multiply service rate by 0.2 |
| network-partition | Set service rate to 0 for affected edges |
| latency-injection | Add 200-500ms to edge latency |
| packet-loss | Fail 10-30% of requests randomly |
| cache-eviction-storm | Set cache hit rate to 0 temporarily |
| traffic-spike | Multiply arrival rate by 10 |
| db-failover | Set DB service rate to 0 for 5s, then restore at 50% |

### 2.5 Utilization to Visual State Mapping

Map node utilization to visual state for canvas rendering:

| Utilization Range | State | Node Border Color | Background |
|---|---|---|---|
| 0% | idle | gray | default |
| 0-50% | healthy | green | green-tinted |
| 50-75% | degraded | amber | amber-tinted |
| 75-95% | overloaded | red | red-tinted |
| 95-100% or crashed | down | dark red | dark red |

This state is written to `node.data.state` via `useCanvasStore.getState().updateNodeData(id, { state })`.

---

## 3. Complete Wiring Task List (43 Tasks)

### Phase 1: Foundation (Tasks 1-8)

#### Task 1: Create TopologyBuilder
**File:** `src/lib/simulation/topology-builder.ts` (NEW)
**Changes:**
- Implement `buildTopology(canvasNodes, canvasEdges)` function
- Define `SimNode`, `SimEdge`, `SimTopology` interfaces
- Default service rate map by node type
- Entry point detection (nodes with no incoming edges)

#### Task 2: Create SimulationOrchestrator
**File:** `src/lib/simulation/orchestrator.ts` (NEW)
**Changes:**
- Implement `SimulationOrchestrator` class
- Constructor takes `SimTopology`
- `start()`, `pause()`, `resume()`, `stop()`, `reset()` lifecycle
- Internal `setInterval` timer for tick processing

#### Task 3: Implement `processTick()` Core Loop
**File:** `src/lib/simulation/orchestrator.ts`
**Changes:**
- For each tick: get traffic count, route requests through topology
- At each node: call `simulateNode(arrivalRate, serviceRate, serverCount)` from queuing-model.ts
- Record results via `MetricsCollector.recordRequest()`
- Compute per-node utilization

#### Task 4: Wire Orchestrator to Simulation Store
**File:** `src/stores/simulation-store.ts`
**Changes:**
- Add `orchestrator: SimulationOrchestrator | null` to store (or keep as ref)
- Modify `play()` to build topology, create orchestrator, call `start()`
- Modify `pause()` to call `orchestrator.pause()`
- Modify `stop()` to call `orchestrator.stop()` and reset
- Add `initSimulation()` action that builds topology from canvas state

```typescript
play: () => {
  const canvasState = useCanvasStore.getState();
  const topology = buildTopology(canvasState.nodes, canvasState.edges);
  if (topology.entryPoints.length === 0) {
    set({ status: "error" });
    return;
  }
  const orchestrator = new SimulationOrchestrator(topology);
  orchestrator.onTick((metrics, nodeStates) => {
    set((s) => ({
      currentTick: s.currentTick + 1,
      metrics,
    }));
    // Update node visual states on canvas
    for (const [nodeId, state] of nodeStates) {
      useCanvasStore.getState().updateNodeData(nodeId, { state });
    }
  });
  orchestrator.start(get().trafficConfig, 60_000, 100);
  set({ status: "running", _orchestrator: orchestrator });
},
```

#### Task 5: Fix Stale Closure Bug in DesignCanvas.onConnect
**File:** `src/components/canvas/DesignCanvas.tsx`
**Changes:**
- Replace edges closure with `useCanvasStore.getState().edges`
- Remove `edges` from dependency array

#### Task 6: Add Bounded metricsHistory
**File:** `src/stores/simulation-store.ts`
**Changes:**
- Add `MAX_METRICS_HISTORY = 1000` constant
- Modify `recordMetricsSnapshot` to slice when over limit

#### Task 7: Guard JSON.parse in onDrop
**File:** `src/components/canvas/DesignCanvas.tsx`
**Changes:**
- Wrap `JSON.parse(raw)` in try-catch
- Return early on parse failure

#### Task 8: Fix Style Tag Injection in DataFlowEdge
**File:** `src/components/canvas/edges/DataFlowEdge.tsx`
**Changes:**
- Move keyframes to a once-injected style tag or CSS file
- Remove inline `<style>` from render

### Phase 2: Metrics Pipeline (Tasks 9-17)

#### Task 9: Wire MetricsCollector Output to Store
**File:** `src/lib/simulation/orchestrator.ts`
**Changes:**
- After each tick, call `this.collector.getMetrics()`
- Emit tick event with global metrics + per-node metrics
- Store subscribes and calls `updateMetrics()`

#### Task 10: Wire MetricsDashboard to Real Data
**File:** `src/components/visualization/charts/MetricsDashboard.tsx`
**Changes:**
- Read `metricsHistory` from simulation store
- Pass time-series data to ThroughputChart, LatencyPercentileChart, ErrorRateChart
- Update on each tick

#### Task 11: Wire ThroughputChart
**File:** `src/components/visualization/charts/ThroughputChart.tsx`
**Changes:**
- Accept `metricsHistory: SimulationMetrics[]` prop
- Plot `throughputRps` over time

#### Task 12: Wire LatencyPercentileChart
**File:** `src/components/visualization/charts/LatencyPercentileChart.tsx`
**Changes:**
- Accept `metricsHistory: SimulationMetrics[]` prop
- Plot p50, p90, p95, p99 latency lines over time

#### Task 13: Wire ErrorRateChart
**File:** `src/components/visualization/charts/ErrorRateChart.tsx`
**Changes:**
- Accept `metricsHistory: SimulationMetrics[]` prop
- Plot `errorRate` over time

#### Task 14: Wire QueueDepthBars
**File:** `src/components/visualization/charts/QueueDepthBars.tsx`
**Changes:**
- Accept per-node queue depth data from orchestrator
- Show bar per node colored by utilization

#### Task 15: Wire UtilizationGauge
**File:** `src/components/visualization/gauges/UtilizationGauge.tsx`
**Changes:**
- Show in PropertiesPanel when a node is selected during simulation
- Display the node's current utilization from per-node metrics

#### Task 16: Wire Sparklines to Node Tooltips
**File:** `src/components/visualization/sparklines/Sparkline.tsx`
**Changes:**
- Show mini throughput/latency sparklines on node hover during simulation

#### Task 17: Add Per-Node Metrics to PropertiesPanel
**File:** `src/components/canvas/panels/PropertiesPanel.tsx`
**Changes:**
- When simulation is running and a node is selected, show:
  - Utilization gauge
  - Throughput (req/s)
  - Avg latency
  - Error rate
  - Queue depth

### Phase 3: Visual State Updates (Tasks 18-24)

#### Task 18: Add Node State Visual Mapping
**File:** `src/components/canvas/nodes/system-design/BaseNode.tsx`
**Changes:**
- Read `data.state` from node data
- Apply border color and background based on state:
  - idle: default
  - healthy: green border
  - degraded: amber border + pulse
  - overloaded: red border + glow
  - down: dark red + dashed border

#### Task 19: Animate Edges During Simulation
**File:** `src/components/canvas/edges/DataFlowEdge.tsx`
**Changes:**
- When simulation is running, set `animated: true` on edges with active traffic
- Speed of animation proportional to throughput
- Edge stroke width proportional to request volume

#### Task 20: Add Edge Latency Labels During Simulation
**File:** `src/components/canvas/edges/DataFlowEdge.tsx`
**Changes:**
- During simulation, set `data.latency` on edges with current per-edge latency
- Latency label already renders when `latency != null`

#### Task 21: Add Node Utilization Badge
**File:** `src/components/canvas/nodes/system-design/BaseNode.tsx`
**Changes:**
- Small percentage badge on node showing current utilization
- Color coded (green < 50%, amber < 80%, red > 80%)

#### Task 22: Add Queue Visualization on Nodes
**File:** `src/components/canvas/nodes/system-design/BaseNode.tsx`
**Changes:**
- Small bar at bottom of node showing queue fill level
- Visible only during simulation

#### Task 23: Add Request Flow Particles
**File:** `src/components/canvas/edges/DataFlowEdge.tsx` or new `RequestParticle.tsx`
**Changes:**
- Small animated dots traveling along edges during simulation
- Dot color: green = success, red = failure
- Dot speed proportional to latency

#### Task 24: Add Chaos Event Visual Indicators
**File:** `src/components/canvas/nodes/system-design/BaseNode.tsx`
**Changes:**
- When a chaos event targets a node, show warning icon
- Pulsing red border for critical events
- Tooltip showing active chaos event name and remaining duration

### Phase 4: Chaos Integration (Tasks 25-30)

#### Task 25: Create Chaos Panel UI
**File:** `src/components/canvas/panels/ChaosPanel.tsx` (NEW)
**Changes:**
- List all 30 chaos event types grouped by category
- Each event shows: name, severity badge, description, affected node types
- "Inject" button per event type
- "Active Events" section showing currently active events with "Remove" button

#### Task 26: Wire Chaos Panel to Orchestrator
**File:** `src/components/canvas/panels/ChaosPanel.tsx`
**Changes:**
- "Inject" calls `orchestrator.injectChaos(eventTypeId, selectedNodeIds)`
- Show target node selector (dropdown of current canvas nodes)
- "Remove" calls `orchestrator.removeChaos(instanceId)`

#### Task 27: Add Chaos Tab to BottomPanel
**File:** `src/components/canvas/panels/BottomPanel.tsx`
**Changes:**
- Add "Chaos" tab alongside Metrics, Timeline, Code, Console
- Render ChaosPanel in the tab content

#### Task 28: Implement Chaos Modifiers in Orchestrator
**File:** `src/lib/simulation/orchestrator.ts`
**Changes:**
- Before computing each node's metrics, check `chaosEngine.getEventsForNode(nodeId)`
- Apply modifier to service rate, failure rate, latency based on event type
- See chaos modifier table in section 2.4

#### Task 29: Sync ChaosEngine with Simulation Store
**File:** `src/stores/simulation-store.ts`
**Changes:**
- When orchestrator injects/removes chaos events, update `activeChaosEvents` in store
- Store's chaos event list should derive from `ChaosEngine.getActiveEvents()`

#### Task 30: Add Chaos Event Expiration to Tick Loop
**File:** `src/lib/simulation/orchestrator.ts`
**Changes:**
- Each tick: call `chaosEngine.expireEvents(currentTimeMs)`
- Remove expired events from store
- Restore node visual state when chaos event expires

### Phase 5: Capacity Planner UI (Tasks 31-35)

#### Task 31: Create CapacityPlannerPanel
**File:** `src/components/canvas/panels/CapacityPlannerPanel.tsx` (NEW)
**Changes:**
- Input form for `CapacityInput` fields:
  - DAU (daily active users)
  - Avg requests per user per day
  - Peak-to-average ratio
  - Read/write ratio
  - Avg request/response sizes
  - Data retention years
- "Calculate" button
- Results display with all `CapacityEstimate` fields

#### Task 32: Add Capacity Tab to BottomPanel
**File:** `src/components/canvas/panels/BottomPanel.tsx`
**Changes:**
- Add "Capacity" tab
- Render CapacityPlannerPanel in tab content

#### Task 33: Wire Capacity Planner to Canvas
**File:** `src/components/canvas/panels/CapacityPlannerPanel.tsx`
**Changes:**
- "Apply to Canvas" button that creates nodes based on estimated server count
- E.g., if estimate says 4 web servers, create 4 WebServer nodes + 1 LoadBalancer

#### Task 34: Add Capacity Estimate to Simulation Start
**File:** `src/lib/simulation/orchestrator.ts`
**Changes:**
- Optional: auto-run capacity estimation when simulation starts
- Show estimated vs actual metrics during simulation

#### Task 35: Add Cost Estimator During Simulation
**File:** `src/components/visualization/charts/MetricsDashboard.tsx`
**Changes:**
- Show estimated monthly cost based on current node count and utilization
- Update in real-time as simulation runs

### Phase 6: Mount Unmounted Components (Tasks 36-39)

#### Task 36: Mount ExportDialog
**File:** `src/app/page.tsx`
**Changes:**
- Import `ExportDialog` from `@/components/shared/export-dialog`
- Add `exportDialogOpen` state to UI store
- Render `<ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />`
- Add keyboard shortcut Cmd+Shift+E to open

#### Task 37: Mount TemplateGallery
**File:** `src/app/page.tsx` or new `TemplateGalleryDialog.tsx`
**Changes:**
- Create a dialog wrapper for TemplateGallery
- Add `templateGalleryOpen` state to UI store
- Wire `onSelectTemplate` to hydrate canvas store with template nodes/edges:

```typescript
const handleSelectTemplate = (template: DiagramTemplate) => {
  const { setNodes, setEdges, clearCanvas } = useCanvasStore.getState();
  clearCanvas();
  setNodes(template.nodes);
  setEdges(template.edges);
  setTemplateGalleryOpen(false);
};
```

#### Task 38: Add Export Button to Toolbar
**File:** `src/components/shared/activity-bar.tsx` or `status-bar.tsx`
**Changes:**
- Add "Export" button (Download icon) that opens ExportDialog
- Add "Templates" button (Layout icon) that opens TemplateGallery

#### Task 39: Wire Command Palette "Add Component" Actions
**File:** `src/components/shared/command-palette.tsx`
**Changes:**
- Replace no-op actions with actual node creation at viewport center
- Each "Add X" command creates the appropriate node type

### Phase 7: Store and Infrastructure (Tasks 40-43)

#### Task 40: Add Undo/Redo Keyboard Shortcuts
**File:** `src/hooks/use-keyboard-shortcuts.ts`
**Changes:**
- Add Cmd+Z handler for undo via `useCanvasStore.temporal.getState().undo()`
- Add Cmd+Shift+Z handler for redo via `useCanvasStore.temporal.getState().redo()`

#### Task 41: Fix Lucide Barrel Import
**File:** `src/components/canvas/panels/ComponentPalette.tsx`
**Changes:**
- Replace `import * as LucideIcons from "lucide-react"` with explicit icon map
- Import only the icons used by palette items

#### Task 42: Add Error Boundary
**File:** `src/components/shared/error-boundary.tsx` (NEW) + `src/app/page.tsx`
**Changes:**
- Create generic ErrorBoundary component with fallback UI
- Wrap each module's canvas content in an ErrorBoundary
- Prevent module crashes from taking down the entire app

#### Task 43: Add Console Logging During Simulation
**File:** `src/components/canvas/panels/BottomPanel.tsx`
**Changes:**
- Wire Console tab to receive simulation events
- Show timestamped log entries: "t=1200ms: web-server-1 utilization 72%"
- Show chaos event injection/expiration logs
- Show error events with stack traces

---

## 4. Implementation Order

The tasks are designed to be implemented in phases, with each phase building on the previous:

**Phase 1 (Foundation):** Tasks 1-8 -- Build the orchestrator, fix critical bugs
**Phase 2 (Metrics Pipeline):** Tasks 9-17 -- Make metrics flow from simulation to UI
**Phase 3 (Visual State):** Tasks 18-24 -- Make the canvas come alive during simulation
**Phase 4 (Chaos):** Tasks 25-30 -- Add chaos engineering UI and integration
**Phase 5 (Capacity):** Tasks 31-35 -- Add capacity planner UI
**Phase 6 (Mount):** Tasks 36-39 -- Wire up ExportDialog and TemplateGallery
**Phase 7 (Polish):** Tasks 40-43 -- Undo/redo, bundle size, error handling

### Dependencies Between Tasks

```
Task 1 (TopologyBuilder) --> Task 2 (Orchestrator) --> Task 3 (processTick)
Task 3 --> Task 4 (Wire to store)
Task 4 --> Task 9 (Metrics to store) --> Tasks 10-17 (Wire charts)
Task 4 --> Tasks 18-24 (Visual state)
Task 2 --> Tasks 25-30 (Chaos integration)
Tasks 5-8 are independent bug fixes (can be done in parallel)
Tasks 31-35 are independent (capacity planner)
Tasks 36-39 are independent (mount components)
Tasks 40-43 are independent (polish)
```

### Estimated Effort

| Phase | Tasks | Estimated LOC | Estimated Hours |
|---|---|---|---|
| Phase 1 | 8 | ~600 | 8-12 |
| Phase 2 | 9 | ~400 | 6-8 |
| Phase 3 | 7 | ~500 | 8-10 |
| Phase 4 | 6 | ~600 | 8-10 |
| Phase 5 | 5 | ~400 | 6-8 |
| Phase 6 | 4 | ~200 | 3-4 |
| Phase 7 | 4 | ~200 | 3-4 |
| **Total** | **43** | **~2,900** | **42-56** |

---

## 5. Key Design Decisions

### 5.1 Orchestrator Lifecycle

The orchestrator is created fresh each time simulation starts and destroyed when it stops. This avoids stale topology references if the user modifies the canvas between runs. The flow:

1. User clicks Play
2. Store reads canvas nodes/edges
3. `buildTopology()` creates `SimTopology`
4. `new SimulationOrchestrator(topology)` created
5. `orchestrator.start(trafficConfig, durationMs, tickMs)` begins interval
6. Each tick: `processTick()` -> metrics -> store update -> UI re-render
7. User clicks Stop -> `orchestrator.stop()` -> clear interval -> reset

### 5.2 Performance Budget

At 100ms tick intervals (10 ticks/second), each tick must complete in under 50ms to maintain smooth UI. The queuing model computations are O(1) per node (closed-form formulas), so even with 50 nodes the simulation is fast. The bottleneck will be React re-renders from store updates. Mitigation:
- Batch all store updates into a single `set()` call per tick
- Use `requestAnimationFrame` for visual updates
- Only update node data that has actually changed

### 5.3 Simulation vs Real-Time

The simulation computes in "simulation time" (controlled by tick rate and playback speed), not wall-clock time. This means:
- 1x speed: 1 simulation second per real second
- 4x speed: 4 simulation seconds per real second
- Stepping: advance exactly 1 tick
- Scrubbing: jump to any tick (requires re-computing from scratch or caching)

### 5.4 Orchestrator State Machine

```
         start()           pause()
  IDLE ---------> RUNNING ---------> PAUSED
    ^               |                   |
    |    stop()     |     resume()      |
    +---------------+                   |
    |                                   |
    +-----------------------------------+
                   stop()
```

---

## 6. File Summary

### New Files to Create

| File | Purpose | Est. Lines |
|---|---|---|
| `lib/simulation/topology-builder.ts` | Extract graph from canvas | ~150 |
| `lib/simulation/orchestrator.ts` | Main simulation engine | ~300 |
| `components/canvas/panels/ChaosPanel.tsx` | Chaos event injection UI | ~200 |
| `components/canvas/panels/CapacityPlannerPanel.tsx` | Capacity estimation UI | ~250 |
| `components/shared/error-boundary.tsx` | Error boundary wrapper | ~50 |

### Existing Files to Modify

| File | Changes |
|---|---|
| `stores/simulation-store.ts` | Wire play/pause/stop to orchestrator, bound history |
| `components/canvas/DesignCanvas.tsx` | Fix stale closure, guard JSON.parse |
| `components/canvas/edges/DataFlowEdge.tsx` | Fix style injection, add simulation animations |
| `components/canvas/nodes/system-design/BaseNode.tsx` | Add state-based visual styling |
| `components/canvas/panels/BottomPanel.tsx` | Add Chaos + Capacity tabs |
| `components/canvas/panels/PropertiesPanel.tsx` | Add per-node simulation metrics |
| `components/canvas/panels/ComponentPalette.tsx` | Fix lucide barrel import |
| `components/shared/command-palette.tsx` | Fix no-op actions |
| `components/visualization/charts/MetricsDashboard.tsx` | Wire to real metrics data |
| `components/visualization/charts/ThroughputChart.tsx` | Accept metrics history prop |
| `components/visualization/charts/LatencyPercentileChart.tsx` | Accept metrics history prop |
| `components/visualization/charts/ErrorRateChart.tsx` | Accept metrics history prop |
| `components/visualization/charts/QueueDepthBars.tsx` | Accept per-node data |
| `app/page.tsx` | Mount ExportDialog, TemplateGallery, error boundaries |
| `hooks/use-keyboard-shortcuts.ts` | Add undo/redo, export shortcuts |
