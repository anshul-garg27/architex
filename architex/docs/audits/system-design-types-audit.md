# System Design Module — Type/Data Architecture Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Focus:** Type definitions, store architecture, data flow safety, naming consistency, schema extensibility

---

## PHASE 1: TYPE INVENTORY

**Total: ~130 types across 18 files**
- 14 core types (src/lib/types.ts)
- 24 template types (src/lib/templates/types.ts)
- 9 chaos types (chaos-engine.ts)
- 4 metrics types (sim-metrics-bus.ts)
- 3 pressure types + 35-counter interface
- 3 issue types + 52-entry catalog
- 15 cross-module bridge types (discriminated union)
- Various simulation, scoring, SRS, skill types

**13 Zustand stores, 1903 LOC total**

---

## PHASE 2: TYPE QUALITY

### T1: Naming — Score: 8/10

**Strengths:**
- Consistent PascalCase for types/interfaces
- Descriptive names: `SystemDesignNodeData`, `LatencyBudget`, `TopologySignature`
- Category prefix consistency: `ChaosEventType`, `ChaosEvent`, `ChaosSeverity`

**Issues:**
| Type | Current Name | Problem | Suggested |
|------|-------------|---------|-----------|
| SimulationCommand | `.type: string` | Loose — should be union | `.type: 'play' \| 'pause' \| 'stop' \| 'injectChaos'` |
| SimulationEvent | `.type: string` | Loose — should be union | `.type: 'tick' \| 'chaos' \| 'metric' \| 'complete'` |
| NodeShape | Defined in BOTH types.ts AND BaseNode.tsx | Duplicated | Single source in types.ts |

### T2: Field Design — Score: 7/10

**Critical Issues:**

1. **`extends Record<string, unknown>` (2 instances)**
   ```typescript
   // CURRENT — allows any arbitrary property
   interface SystemDesignNodeData extends Record<string, unknown> { ... }
   interface SystemDesignEdgeData extends Record<string, unknown> { ... }
   ```
   This means ANY code can write ANY property to node/edge data without type checking. Found at types.ts:42 and types.ts:79.

   **FIX:**
   ```typescript
   // PROPOSED — strict interface, no index signature
   interface SystemDesignNodeData {
     label: string;
     category: NodeCategory;
     componentType: ComponentType; // narrowed from string
     icon: string;
     config: NodeConfig; // typed per component
     metrics?: NodeMetricsSnapshot;
     state: NodeState;
     // Explicit optional fields instead of Record<string, unknown>
     chaosActive?: boolean;
     chaosEvents?: string[];
   }
   ```

2. **`config: Record<string, number | string | boolean>` (3 instances)**
   Config is completely untyped — a Redis node and a PostgreSQL node have the same config type. At types.ts:49, types.ts:119 (PaletteItem), and templates/types.ts.

   **FIX:** Per-component config types or a discriminated union:
   ```typescript
   type NodeConfig =
     | { componentType: 'database'; engine: 'postgres' | 'mysql'; replicas: number; connections: number; storageGb: number }
     | { componentType: 'cache'; engine: 'redis' | 'memcached'; memoryGb: number; evictionPolicy: 'lru' | 'lfu'; ttlSeconds: number }
     | { componentType: 'load-balancer'; algorithm: 'round-robin' | 'least-connections'; healthCheckIntervalMs: number }
     // ... per component type
   ```

3. **`SimulationCommand.payload: unknown` and `SimulationEvent.data: unknown`**
   Completely untyped. At types.ts:130 and types.ts:148.

### T3: Union & Discriminated Union Usage — Score: 9/10

**Excellent:** BridgePayload is a proper discriminated union (10 variants). IssueCategory, ChaosSeverity, NodeCategory all use string literal unions. EdgeType has 9 literal values.

**One gap:** `componentType: string` in SystemDesignNodeData should be a union of all 71+ registered types, not `string`.

### T4: Generic Usage — Score: 7/10

No generics are overused. However, the `config: Record<string, number | string | boolean>` pattern is a missed opportunity for generic typing per component.

---

## PHASE 3: DATA FLOW

### Primary Data Flow: Template Load → Canvas → Simulation → Visualization

```
Template JSON (DiagramTemplate)
  → loadTemplate() in canvas-store
    → nodes: Node<SystemDesignNodeData>[]
    → edges: Edge<SystemDesignEdgeData>[]
      → React Flow renders BaseNode per node
        → BaseNode reads data.category, data.state
          → Maps to CATEGORY_SHAPE, CATEGORY_VAR, STATE_VAR

User clicks Play
  → simulation-store.play()
    → SimulationOrchestrator.start(trafficConfig)
      → Per tick: processTraffic → BFS propagation
        → SimMetricsBus.write(nodeId, metrics)  [Float64Array]
          → rAF batched → subscribers notified
            → SimBadgeDriver sets CSS vars on DOM
            → NodeMetricsOverlay reads from bus
            → HeatmapOverlay reads from canvas-store nodes
            → ParticleLayer reads edge throughput
```

**Type safety at each arrow:**

| Step | From Type | To Type | Safe? | Issue |
|------|-----------|---------|:-----:|-------|
| Template → Store | DiagramTemplate → Node[] | ✅ | — |
| Store → React Flow | Node<SystemDesignNodeData> | ✅ | — |
| React Flow → BaseNode | SystemDesignNodeData via `data` prop | ⚠️ | `data` cast via `Record<string, unknown>` escape hatch |
| Play → Orchestrator | SimulationStore → Orchestrator | ✅ | via getState() |
| Orchestrator → MetricsBus | Tick data → Float64Array | ⚠️ | No type checking at write boundary (raw numbers) |
| MetricsBus → Subscribers | Set<string> (dirty IDs) | ✅ | — |
| MetricsBus → CSS vars | NodeMetricsSnapshot → string | ✅ | — |
| Store nodes → HeatmapOverlay | Node[] (broad selector) | ⚠️ | Re-renders on ANY node change |

**Key bottleneck:** The `Record<string, unknown>` extension on SystemDesignNodeData creates a type-safety escape hatch at the React Flow boundary. Code like `(data as Record<string, unknown>).chaosActive` at BaseNode.tsx:329 bypasses type checking.

---

## PHASE 4: CONSISTENCY

### Naming Patterns

| Pattern | Example 1 | Example 2 | Example 3 | Consistent? |
|---------|-----------|-----------|-----------|:-----------:|
| ID format | `node-{timestamp}-{random}` (canvas) | `chaos-{type}-{counter}-{ts}` (chaos) | `snap-{uuid}` (snapshot) | ⚠️ Different per system |
| State names | `idle/active/success/warning/error/processing` (node) | `idle/running/paused/completed/error` (simulation) | `not-started/in-progress/submitted/evaluated` (interview) | ⚠️ Different per context |
| Callback naming | `onNodesChange` (React Flow) | `handleStep` (module) | `setActiveModule` (store) | ⚠️ Mixed on/handle/set |
| Store key format | `architex-canvas` (hyphen) | `architex:billing-store` (colon) | `architex_onboarding_completed` (underscore) | ❌ 3 different separators |

### Shared vs Duplicated Types

| Concept | Definition 1 | Definition 2 | Should Share? |
|---------|-------------|-------------|:-------------:|
| NodeShape | types.ts:100-108 | BaseNode.tsx:14-22 | ✅ Yes — DUPLICATE |
| NodeMetrics | types.ts:153-166 | sim-metrics-bus.ts:44-51 | ⚠️ Similar but different field names |
| ComponentType | `string` in SystemDesignNodeData | NodeType union in chaos-engine.ts | ✅ Yes — should be ONE union |

---

## PHASE 5: STORE ARCHITECTURE

### Store Health Summary

| Store | Fields | God-Store? | Persistence | Cross-Store Deps | Issues |
|-------|:------:|:----------:|:-----------:|:----------------:|--------|
| canvas | 5 | ✅ Lean | Zustand persist | snapshot reads it | pushSnapshot on every change |
| simulation | 12 | ⚠️ Moderate | None (volatile) | None | orchestratorRef is non-serializable |
| viewport | 3 | ✅ Minimal | None | None | Not synced with React Flow |
| **ui** | **16** | **❌ God-store** | persist | None | 10 dialog booleans should be grouped |
| cross-module | 4 | ✅ Lean | persist | None | — |
| progress | 4 | ✅ Lean | persist | None | — |
| notification | 1 | ✅ Minimal | persist | None | — |
| interview | 11 | ⚠️ Moderate | Custom IndexedDB | None | Complex custom persistence |
| snapshot | 2 | ✅ Minimal | persist | ❌ canvas-store | Tight coupling |
| collaboration | 3 | ✅ Minimal | None | None | — |
| ai | 6 | ✅ Lean | persist | ClaudeClient | API key in localStorage (obfuscated only) |
| editor | 5 | ✅ Lean | None | None | — |
| billing | 3 | ✅ Lean | persist | usage-tracker | — |

### Critical Store Issues

1. **No `useShallow` anywhere** — Canvas and simulation store consumers subscribe to full arrays. When simulation updates metrics 60x/sec, any component reading `s => s.nodes` re-renders on every tick.

2. **3 different localStorage key formats** — `architex-canvas` (hyphen), `architex:billing-store` (colon), `architex_onboarding_completed` (underscore). Should standardize.

3. **UI store is a god-store** (16 fields) — 10 dialog booleans could be `dialogs: Record<DialogName, boolean>`.

4. **snapshot-store reads canvas-store via getState()** — tight coupling that makes testing and refactoring harder.

---

## PHASE 6: SCHEMA EXTENSIBILITY

### Test: "Add a new component type 'reverse-proxy'"

| Step | Files to Change | TypeScript Guides? |
|------|----------------|:------------------:|
| 1. Add to nodeTypes registry | index.ts | No — it's a runtime object, not a type |
| 2. Add to palette-items | palette-items.ts | No — runtime array |
| 3. Add DEFAULTS export | index.ts exports | No |
| 4. Add to NodeType union (chaos) | chaos-engine.ts:33-45 | ✅ Yes — if used in chaos |
| 5. Add to CATEGORY_SHAPE | BaseNode.tsx:25-40 | ✅ Yes — Record<NodeCategory, NodeShape> |

**Verdict:** Partially guided. The type system catches SOME missing spots (CATEGORY_SHAPE, CATEGORY_VAR require all NodeCategory keys) but NOT all (nodeTypes registry is a runtime object, palette-items is a runtime array).

### Test: "Add a new node state 'degraded'"

| Step | Files to Change | TypeScript Guides? |
|------|----------------|:------------------:|
| 1. Add to state union in types.ts | types.ts:57 | ✅ |
| 2. Add to STATE_VAR | BaseNode.tsx:63-70 | ✅ Record<state, string> |
| 3. Add to STATE_GLOW_STYLES | BaseNode.tsx:74-99 | ✅ Record<state, glow> |
| 4. Add CSS variable | globals.css | ❌ No guidance |
| 5. Add keyframe animation | BaseNode.tsx:ensureKeyframes | ❌ No guidance |

**Verdict:** TypeScript guides most changes via Record types, but CSS variables and animations are not type-connected.

---

## PHASE 7: TYPE HEALTH SUMMARY

### Type Health Score: 7.5/10

| Dimension | Score | Biggest Issue |
|-----------|:-----:|---------------|
| Naming consistency | 8/10 | 3 different localStorage key separators |
| Type narrowness (no any) | 8/10 | No `any` found! But `Record<string, unknown>` and `unknown` payloads are loose |
| Schema consistency | 7/10 | NodeShape duplicated, NodeType vs componentType divergence |
| Data flow safety | 7/10 | `Record<string, unknown>` extension creates escape hatch at React Flow boundary |
| Store design | 7/10 | UI god-store, no useShallow, snapshot↔canvas coupling |
| Extensibility | 8/10 | Record types guide most additions; runtime registries don't |

### Top 5 Type Design Smells

1. **`extends Record<string, unknown>`** on SystemDesignNodeData/EdgeData — escape hatch that defeats type safety
2. **`config: Record<string, number | string | boolean>`** — completely untyped per-component configs
3. **NodeShape defined twice** — types.ts AND BaseNode.tsx
4. **`componentType: string`** instead of union — 71+ types collapsed to `string`
5. **No `useShallow`** in any store consumer — unnecessary re-renders on tick updates
