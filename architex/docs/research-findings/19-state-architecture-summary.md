# State Architecture Blueprint Summary

> Summary of `architex/src/stores/STATE_ARCHITECTURE.ts` (1,806 lines).
> The Principal Frontend Architect's design document for the complete state management overhaul.

---

## Overview

The STATE_ARCHITECTURE.ts file is a comprehensive TypeScript-documented blueprint covering 9 major sections. It identifies problems with the current store implementation and provides implementation-ready solutions for each. The file does not contain runnable code -- all implementations are in comments as blueprints to be extracted into separate files.

---

## 1. Command Bus Pattern

### What It Is
A synchronous dispatcher with typed command handlers that centralizes cross-store orchestration into atomic, auditable commands. It is NOT an event emitter, NOT Redux middleware -- it is a flat dispatch map where each handler coordinates multiple Zustand stores atomically.

### Why It Is Needed
Currently, stores are independent islands. When a user loads a template, the caller must manually:
1. `canvas-store.setNodes(template.nodes)`
2. `canvas-store.setEdges(template.edges)`
3. `simulation-store.reset()`
4. `ui-store.setActiveModule('system-design')`

If any step fails or is forgotten, stores diverge. The Command Bus eliminates this by encapsulating multi-store operations into single commands.

### 10 Command Types

| Command | Purpose | Stores Affected |
|---------|---------|-----------------|
| `LOAD_TEMPLATE` | Load a starter template onto canvas | canvas, simulation, ui |
| `START_SIMULATION` | Begin simulation with optional traffic config | simulation, canvas |
| `STOP_SIMULATION` | Stop simulation and reset node states | simulation, canvas |
| `INJECT_CHAOS` | Add a chaos event to running simulation | simulation, canvas |
| `REMOVE_CHAOS` | Remove a chaos event | simulation, canvas |
| `UNDO` | Revert to previous state | all undoable stores |
| `REDO` | Re-apply reverted state | all undoable stores |
| `EXPORT` | Export diagram to format (mermaid, plantuml, json, terraform, url) | canvas (read-only) |
| `LOAD_PROJECT` | Hydrate all stores from saved project | canvas, simulation, ui, editor |
| `RESET_WORKSPACE` | Clear all stores to initial state | canvas, simulation, editor, interview |
| `SWITCH_MODULE` | Change active module with optional canvas preservation | ui |

### Implementation Details
- Every command returns a `CommandResult` with `success`, `error`, and optional `data`
- Audit log stores last 200 commands with `CommandLogEntry` (command, result, timestamp, durationMs)
- Subscriber pattern allows devtools to observe all dispatches
- Each handler wraps multi-store changes in undo transactions
- Singleton pattern: `const commandBus = createCommandBus()`

---

## 2. React Flow Adapter

### Canonical Types
The architecture defines `ArchitexNode` and `ArchitexEdge` as the domain model types, deliberately separate from React Flow's `Node` and `Edge` types.

**ArchitexNode** contains:
- `id`, `type`, `position` (basic identity)
- `data.label`, `data.category` (9 categories: compute, load-balancing, storage, messaging, networking, processing, client, observability, security)
- `data.componentType`, `data.icon`, `data.config` (component configuration)
- `data.metrics` (throughput, latency, errorRate, utilization, queueDepth, cacheHitRate)
- `data.state` (idle, active, success, warning, error, processing)

**ArchitexEdge** contains:
- `id`, `source`, `target`, `sourceHandle`, `targetHandle`
- `data.edgeType` (9 types: http, grpc, graphql, websocket, message-queue, event-stream, db-query, cache-lookup, replication)
- `data.latency`, `data.bandwidth`, `data.errorRate`, `data.animated`

### Conversion Functions
- `toReactFlowNode(node: ArchitexNode): Node` -- maps our domain to RF rendering
- `fromReactFlowNode(rfNode: Node): ArchitexNode` -- extracts our domain from RF
- `toReactFlowEdge`, `fromReactFlowEdge` -- equivalent for edges
- Batch variants: `toReactFlowNodes`, `fromReactFlowNodes`, etc.

### Why Abstract from React Flow
1. Every store consumer would otherwise import `@xyflow/react` types
2. Export functions would depend on RF internals
3. If RF is upgraded or replaced, EVERY file would change
4. Serialization would include RF internals (measured, selected, dragging)
5. The adapter confines RF specifics to DesignCanvas.tsx and the adapter itself

### Edge Cases Handled
- Missing `rfNode.type` defaults to `'default'`
- Missing data fields get safe defaults
- RF internal properties (measured, selected, dragging, positionAbsolute) are stripped
- Position is deep-copied to prevent shared reference mutations
- Edge sourceHandle/targetHandle null-to-undefined coercion

---

## 3. Undo/Redo Manager

### Problems with Current Approach (zundo on canvas-store)
1. **Every pixel of a drag creates a history entry** -- 60+ entries per second during node drag
2. **Single-store undo** -- Template load changes 3 stores but undo only reverts canvas
3. **No memory limit by size** -- 100 entries at 50KB each = 5MB of undo history

### Transaction API
- `beginTransaction()` -- Start grouping changes
- `commitTransaction(label)` -- Capture all changes as ONE undo entry
- `rollbackTransaction()` -- Discard without creating entry
- `pushSnapshot(label)` -- Capture current state as undo point

### Drag Debounce Strategy
1. `DesignCanvas` detects drag START via `onNodeDragStart` callback -> calls `beginTransaction()`
2. During drag, `onNodesChange` fires 60x/sec -- NO snapshots taken
3. `DesignCanvas` detects drag END via `onNodeDragStop` -> calls `commitTransaction('Move node(s)')`
4. Result: exactly ONE undo entry per drag operation

For rapid non-drag changes (config panel typing), `pushSnapshot` is debounced with a 500ms window.

### Memory Cap
Two limits enforced simultaneously:
- `MAX_ENTRIES = 100` (hard count limit)
- `MAX_SIZE_BYTES = 10MB` (memory pressure limit)

Size estimation: `JSON.stringify(snapshot).length * 2` (x2 for UTF-16 in-memory overhead).
When either limit is exceeded, oldest entries are evicted from undo stack.

### Undoable vs Non-Undoable Operations

**Undoable** (user intent):
- Add/remove/move node, add/remove edge
- Load template, change node config, change traffic config
- Inject/remove chaos, change editor code

**Not Undoable** (ephemeral/view state):
- Zoom/pan (viewport-store), selection changes
- Simulation runtime metrics, timer state
- Panel visibility toggles, playback speed

---

## 4. Persistence Architecture

### Storage Mapping

| Data | Storage | Reason |
|------|---------|--------|
| UI preferences (theme, panels, active module) | localStorage | Small (<1KB), fast, synchronous |
| Active project canvas (nodes, edges, config) | IndexedDB | Can be >100KB, localStorage has 5MB limit and blocks main thread |
| Saved projects list | IndexedDB | Multiple projects, each potentially large |
| Viewport state | NOT persisted | Ephemeral -- fitView on load |
| Simulation runtime (metrics, tick, status) | NOT persisted | Ephemeral -- must re-run |
| Editor code | IndexedDB | Can be large, per-module |
| Interview progress | IndexedDB | Timer state, hints used |
| Undo history | NOT persisted | Too large, stale on reload |

### Auto-Save Strategy
1. **Dirty flag**: Each store mutation sets a dirty flag via Zustand middleware
2. **Debounced save**: After any mutation, schedule save after 2000ms of inactivity
3. **Save on blur**: Window `blur` event triggers immediate save
4. **Save on unload**: `beforeunload` triggers synchronous localStorage fallback

### Hydration Order
On app startup, stores hydrate in this exact sequence:
1. **ui-store** (localStorage, synchronous) -- determines module and theme
2. **canvas-store + editor-store** (IndexedDB, async) -- show skeleton while loading
3. **simulation-store** (no hydration) -- always starts fresh
4. **viewport-store** (no hydration) -- React Flow fitView handles positioning
5. **interview-store** (IndexedDB, async, lazy) -- only if interview module active

### Migration Framework
- `SerializedProject` has a `version` field
- Migration chain: `migrations: Record<number, (data) => data>`
- Each migration transforms data from version N to N+1
- Applied sequentially until reaching current `SCHEMA_VERSION`
- Conflict resolution: last-write-wins (single-user local app)

---

## 5. Module State Isolation

### Problem
The current `page.tsx` calls ALL 7 module hooks on every render. Each hook creates React state, refs, effects, and intervals even when its module is not active. For example, the interview timer runs even when viewing system-design.

### Solution: Lazy Component Rendering
Replace `useModuleContent()` hooks with component-based approach:

```
<Suspense fallback={<ModuleSkeleton />}>
  <ModuleRenderer module={activeModule} />
</Suspense>
```

Each module is a `React.lazy()` dynamic import. Only ONE module component renders at a time. When module changes, the previous unmounts, releasing all resources.

### Module Lifecycle
**On Mount**: Dynamic import loads chunk, useState initializes, useEffect runs, optional IndexedDB hydration.
**On Unmount**: useEffect cleanup runs, state garbage collected, optional snapshot to IndexedDB.

### Keep Warm vs Cold Start
- **System-design**: ALWAYS warm (primary module, canvas state in global store)
- **Interview**: WARM (save timer + challenge to IndexedDB on unmount, restore on remount)
- **All others**: COLD (state is cheap to recreate)

### Shared vs Module-Specific State
**Shared** (global Zustand stores): canvas, viewport, ui, editor
**Module-specific** (local useState/useReducer): currentArray/elementStates (algo), searchQuery/filterDifficulty/timer (interview), consensus state (distributed), thread/lock states (concurrency)

**Rule**: If two or more modules share the same data, it goes in a global store. If only one module uses it, it stays in local React state.

---

## 6. Data Flow Diagrams (7 User Actions)

The architecture traces 7 key user actions through the store system:

### 6a. User drags Web Server from palette onto canvas
Flow: ComponentPalette -> DesignCanvas (onDrop) -> convert to ArchitexNode -> adapter.toReactFlowNode() -> canvasStore.addNode() -> undoManager.pushSnapshot()
Re-renders: DesignCanvas, new node, MiniMap. NOT PropertiesPanel (no selection yet).

### 6b. User clicks "Play Simulation"
Flow: SimulationControls -> commandBus.dispatch(START_SIMULATION) -> simulation-store.play() + canvas nodes set to 'active'
Re-renders: All node components (state change), BottomPanel (metrics), SimulationControls (play->pause button).
Side effects: requestAnimationFrame loop starts. NO undo snapshot (simulation is ephemeral).

### 6c. User injects "Cache Eviction Storm" chaos
Flow: ChaosPanel -> commandBus.dispatch(INJECT_CHAOS) -> simulation-store.addChaosEvent() + affected nodes set to 'error'
Re-renders: Affected nodes (red glow), downstream nodes (metrics change), MetricsPanel (error spike).

### 6d. User loads "Twitter Fanout" template
Flow: TemplateBrowser -> commandBus.dispatch(LOAD_TEMPLATE) -> undoManager.beginTransaction() -> canvas.setNodes/setEdges + simulation.reset() + ui.setActiveModule -> commitTransaction()
ONE undo entry. Full canvas re-render. Auto-save triggered.

### 6e. User exports to Mermaid
Flow: ExportMenu -> commandBus.dispatch(EXPORT) -> read canvas -> adapter conversion -> exportToMermaid() -> clipboard.writeText()
NO store changes. NO re-renders. NO undo entry.

### 6f. User runs Bubble Sort in algorithm module
Flow: AlgorithmPanel -> generateBubbleSortSteps() -> step loop -> local setState()
NO Zustand stores involved. Only editor-store.setCode() and setActiveLine() for code panel.

### 6g. User starts an interview challenge
Flow: InterviewModule -> local useState for challenge selection -> setInterval for timer
Current: NO Zustand stores (bug/oversight -- interview-store exists but unused).
Proposed: interview-store becomes single source of truth.

---

## 7. Performance Optimizations

### Overly Broad Selectors
`useCanvasStore((s) => s.nodes)` re-renders DesignCanvas on ANY node change. Verdict: CANNOT be narrowed (React Flow needs full arrays). Optimization is in child node components using `React.memo()` with stable data references.

### Where to Use useShallow
**Needs useShallow**: PropertiesPanel multi-field selector, SimulationControls status+speed, BottomPanel metrics.
**Does NOT need useShallow**: Single scalar selectors (string comparison), single function selectors (stable references).

### Derived State: Compute vs Store
**Should be computed** (not stored): selectedNodes (filter), nodeCount/edgeCount, simulation progress percentage, isSimulationActive.
**Should remain stored**: nodes, edges, selectedNodeIds, simulation status, trafficConfig, metricsHistory.

### Additional Performance Recommendations
1. **Batch node updates during simulation**: Add `batchUpdateNodeData` action (single set() call vs 1500 individual calls/sec)
2. **Metrics throttle**: Cap at 1000 entries, record every 10 ticks not every tick
3. **Lazy imports**: Algorithm module configs only load when module is active
4. **Edge animation**: Use `will-change: transform`, limit to visible edges only

---

## 8. Migration Plan (4 Phases, 31 Tasks)

### Phase 1: Foundation (8 tasks, no behavior change)
- T01: Create `src/lib/canvas/types.ts` with ArchitexNode, ArchitexEdge
- T02: Create `src/lib/canvas/adapter.ts` with all conversion functions
- T03: Write adapter round-trip tests
- T04: Add `batchUpdateNodeData` to canvas-store
- T05-T07: Add `useShallow` to multi-field selectors (PropertiesPanel, BottomPanel, audit others)
- T08: Create memoized selector for selectedNodes

### Phase 2: Undo/Redo Overhaul (7 tasks)
- T09: Create `src/stores/undo-manager.ts` with dual-cap memory management
- T10: Remove zundo `temporal()` wrapper from canvas-store
- T11: Add `onNodeDragStart`/`onNodeDragStop` to DesignCanvas for transactions
- T12: Wire `pushSnapshot()` into canvas-store mutations
- T13: Wire Cmd+Z / Cmd+Shift+Z keyboard shortcuts
- T14: Write undo/redo tests
- T15: Add undo/redo indicator to toolbar

### Phase 3: Command Bus + Persistence (9 tasks)
- T16: Create `src/stores/command-bus.ts` with all 10 handlers
- T17: Create `src/stores/persistence.ts` with IndexedDB layer
- T18: Create SerializedProject type and migration framework
- T19: Add hydration logic to app startup
- T20: Migrate template loading to command bus
- T21: Migrate simulation controls to command bus
- T22: Wire interview-store into InterviewModule
- T23: Add save-on-blur and save-on-beforeunload handlers
- T24: Write persistence tests

### Phase 4: Module Isolation (7 tasks)
- T25: Convert module hooks to module components
- T26: Add React.lazy() dynamic imports
- T27: Create ModuleRenderer with Suspense boundary
- T28: Add module cleanup lifecycle
- T29: Add warm-resume for interview module
- T30: Performance validation (verify lazy loading, 16ms frame budget)
- T31: Add devtools support (command history viewer, undo inspector, subscription counter)

### New Files to Create
- `src/lib/canvas/types.ts` -- ArchitexNode, ArchitexEdge types
- `src/lib/canvas/adapter.ts` -- RF conversion functions
- `src/lib/canvas/__tests__/adapter.test.ts` -- Round-trip tests
- `src/stores/command-bus.ts` -- Command bus implementation
- `src/stores/undo-manager.ts` -- Multi-store undo/redo manager
- `src/stores/persistence.ts` -- IndexedDB persistence layer
- `src/stores/hydration-store.ts` -- Hydration state tracking
- `src/components/shared/ModuleRenderer.tsx` -- Lazy module loader
- `src/components/shared/ModuleSkeleton.tsx` -- Loading fallback UI

### Modified Files
- `src/stores/canvas-store.ts` -- Remove zundo, add batch update
- `src/app/page.tsx` -- Use ModuleRenderer pattern
- `src/components/canvas/DesignCanvas.tsx` -- Add drag start/stop handlers
- `src/hooks/use-keyboard-shortcuts.ts` -- Add undo/redo shortcuts
- PropertiesPanel, BottomPanel -- useShallow
- InterviewModule -- Use interview-store
- `src/lib/export/to-mermaid.ts` -- Accept ArchitexNode instead of RF Node

---

## Key Architectural Decisions

1. **Command Bus over event bus**: Synchronous dispatch avoids timing issues. Each handler is an explicit, auditable function.
2. **Custom undo over zundo**: zundo is too coarse (per-store, per-mutation). Custom manager enables cross-store transactions and drag debounce.
3. **IndexedDB over localStorage for canvas**: Canvas state can be >100KB. localStorage blocks the main thread and has a 5MB limit.
4. **Lazy modules over eager hooks**: Only the active module's code loads. Others are garbage collected on unmount.
5. **Adapter pattern over direct RF types**: Isolates the entire codebase from React Flow internals. Export/import functions work with clean domain types.
