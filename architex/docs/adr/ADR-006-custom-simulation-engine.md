# ADR-006: Custom Simulation Engine over Existing Libraries

**Status:** Accepted

**Date:** 2024

## Context

Architex's simulation system needs to model distributed system behavior on a canvas-based architecture diagram. Specifically:

- Traffic flow through a directed graph of infrastructure components.
- Per-node queuing behavior (arrival rate, service rate, utilization).
- Cascade failures when nodes become overloaded.
- Chaos engineering (random node failures, latency injection).
- What-if scenario analysis (remove node, double traffic, add cache, scale up/down).
- SLA calculation (path-based availability, SPOF detection).
- Capacity planning and cost estimation.
- Latency budget tracking across request paths.
- Time-travel replay of simulation snapshots.

Options considered:

1. **SimPy / SimJS** -- Discrete event simulation libraries. SimPy is Python-only. SimJS is JavaScript but unmaintained and designed for generic simulation, not architecture-specific.
2. **Custom engine** -- Purpose-built for architecture diagrams, operating directly on React Flow nodes/edges.
3. **Server-side simulation** -- Run a simulation server that accepts graph topology and returns metrics. Adds infrastructure complexity and latency.

## Decision

Build a **custom browser-side simulation engine** consisting of multiple specialized modules.

## Rationale

1. **Architecture-aware.** The engine operates directly on React Flow `Node[]` and `Edge[]` arrays, reading component types, configs, and topology. No translation layer is needed between the canvas data model and the simulation input.

2. **Modular design.** The simulation system is decomposed into focused modules under `src/lib/simulation/`:

   | Module | File | Purpose |
   |--------|------|---------|
   | Queuing Model | `queuing-model.ts` | M/M/c queue math (arrival rate, service rate, utilization) |
   | Simulation Orchestrator | `simulation-orchestrator.ts` | Tick-based loop, traffic propagation through graph |
   | Cascade Engine | `cascade-engine.ts` | Failure propagation when nodes exceed capacity |
   | Chaos Engine | `chaos-engine.ts` | Random failure injection, latency spikes |
   | Traffic Simulator | `traffic-simulator.ts` | Traffic pattern generation (steady, burst, ramp) |
   | What-If Engine | `what-if-engine.ts` | Scenario comparison (clone graph, modify, snapshot) |
   | SLA Calculator | `sla-calculator.ts` | Path-based availability, SPOF detection |
   | Capacity Planner | `capacity-planner.ts` | Resource utilization and scaling recommendations |
   | Latency Budget | `latency-budget.ts` | Per-path latency breakdown and budget tracking |
   | Metrics Collector | `metrics-collector.ts` | Aggregation of per-node metrics over time |
   | Time Travel | `time-travel.ts` | Snapshot storage and replay |
   | Architecture Diff | `architecture-diff.ts` | Structural comparison between diagram versions |
   | Failure Modes | `failure-modes.ts` | Predefined failure scenario definitions |

3. **Queuing theory foundation.** The `queuing-model.ts` module implements M/M/c queue formulas to compute utilization, average wait time, average system time, and queue probability for each node based on its arrival rate and service rate:

   ```ts
   export function simulateNode(
     arrivalRate: number,
     serviceRate: number,
     serverCount: number,
   ): QueueMetrics { /* ... */ }
   ```

   Each component type has a default service rate in `what-if-engine.ts`:

   ```ts
   case 'web-server': return 1 / 5;      // 200 rps
   case 'database':   return 1 / 10;     // 100 rps
   case 'cache':      return 1 / 1;      // 1000 rps
   case 'load-balancer': return 1 / 0.5; // 2000 rps
   ```

4. **What-if scenario engine.** The `what-if-engine.ts` runs comparative analysis by cloning the graph, applying a modification, simulating both, and computing deltas with human-readable insights:

   ```ts
   export function runWhatIfScenario(
     nodes: Node[],
     edges: Edge[],
     trafficConfig: TrafficConfig,
     scenario: WhatIfScenario,
   ): WhatIfResult { /* ... */ }
   ```

   Supported scenarios: `remove-node`, `double-traffic`, `add-cache`, `remove-cache`, `scale-up`, `scale-down`, `inject-failure`.

5. **SLA calculator.** The `sla-calculator.ts` module enumerates all paths from entry nodes (clients) to terminal nodes (storage), computes series availability per path, identifies the weakest path, detects SPOFs, and generates recommendations:

   ```ts
   export function calculateSLA(nodes: Node[], edges: Edge[]): SLAResult {
     // 1. Build directed graph
     // 2. Find all entry-to-terminal paths (DFS, max 1000 paths)
     // 3. For each path: availability = product of node availabilities
     // 4. Parallel replicas: 1 - (1 - A)^N
     // 5. Overall = min(path availabilities)
     // 6. SPOF = single-replica nodes on weakest path
   }
   ```

   Component-specific availability defaults are defined in `COMPONENT_AVAILABILITY`:

   ```ts
   'web-server': 0.999,     // 3 nines
   'load-balancer': 0.9999, // 4 nines
   'object-storage': 0.99999, // 5 nines
   ```

6. **Cost estimation.** The what-if engine includes per-component monthly cost estimates used for trade-off analysis. These are heuristic values (e.g., web-server=$50/mo, database=$150/mo, ML inference=$250/mo) that scale with replica count.

7. **Simulation state management.** The `simulation-store.ts` Zustand store manages simulation lifecycle (play/pause/stop/reset), traffic configuration, tick count, and status. The orchestrator reads canvas state imperatively via `useCanvasStore.getState()`.

## Consequences

### Positive

- Zero external dependencies for simulation logic -- everything is pure TypeScript functions.
- Tight integration with the canvas data model (no serialization/deserialization).
- Instant feedback -- simulations run synchronously in the browser with sub-millisecond per tick.
- Fully testable: `src/lib/simulation/__tests__/` covers the cascade engine, queuing model, and traffic simulator.
- Educational value: students can read the simulation source code to understand queuing theory and failure modeling.

### Negative

- Not a general-purpose DES engine. Adding new simulation behaviors requires custom code.
- Queuing model is simplified (M/M/c assumes Poisson arrivals, exponential service times). Real systems have more complex distributions.
- Cost estimates are rough heuristics, not real cloud pricing. Adequate for educational comparisons but not production capacity planning.
- The engine runs on the main thread. For very large graphs (100+ nodes), performance could degrade. A Web Worker version is planned (see `src/workers/`).

## References

- Simulation modules: `src/lib/simulation/*.ts`
- Simulation store: `src/stores/simulation-store.ts`
- Simulation tests: `src/lib/simulation/__tests__/`
- What-if panel: `src/components/canvas/overlays/WhatIfPanel.tsx`
- SLA dashboard: `src/components/canvas/overlays/SLADashboard.tsx`
- Latency budget panel: `src/components/canvas/overlays/LatencyBudgetPanel.tsx`
- Cost engine: `src/lib/cost/cost-engine.ts`
