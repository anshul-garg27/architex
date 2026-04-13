# Codebase Gap Analysis

**Date:** 2026-04-11
**Scope:** Complete inventory of Architex source code under `src/`, gap assessment per module, cross-cutting concerns audit

---

## 1. Codebase Statistics

| Metric | Value |
|---|---|
| Total TypeScript/TSX files | 126 |
| Total lines of code | 31,728 |
| Components (`src/components/`) | ~55 files |
| Library modules (`src/lib/`) | ~63 files |
| Stores (`src/stores/`) | 6 files |
| Hooks (`src/hooks/`) | 1 file |
| App entry (`src/app/`) | 3 files |

---

## 2. Module-by-Module Gap Analysis

### Module 1: System Design Canvas (Primary Module)

**Completion: ~70%**

| Subsystem | Files Exist | Status |
|---|---|---|
| Canvas core | `DesignCanvas.tsx` | BUILT -- renders ReactFlow, drag-and-drop, node selection |
| Node types | `BaseNode.tsx`, `WebServerNode.tsx`, `LoadBalancerNode.tsx`, `DatabaseNode.tsx`, `CacheNode.tsx`, `MessageQueueNode.tsx`, `APIGatewayNode.tsx`, `CDNNode.tsx`, `ClientNode.tsx`, `StorageNode.tsx` | BUILT -- 9 node types plus base |
| Edge types | `DataFlowEdge.tsx`, `edges/index.ts` | BUILT -- 9 edge visual styles |
| Panels | `ComponentPalette.tsx`, `PropertiesPanel.tsx`, `BottomPanel.tsx` | BUILT -- palette has drag, properties panel has config editing |
| Canvas store | `canvas-store.ts` | BUILT -- nodes/edges CRUD with zundo undo |
| Viewport store | `viewport-store.ts` | BUILT |
| Palette items | `palette-items.ts` | BUILT |
| Types | `types.ts` | BUILT |

**Missing:**
- Simulation orchestration (play button sets status but runs NO actual simulation)
- Canvas context menu (right-click actions)
- Multi-select operations (group, align)
- Copy/paste nodes
- Save/load to IndexedDB (Dexie is in package.json but unused)

---

### Module 2: Simulation Engine

**Completion: ~40% (libraries built, ZERO wiring to canvas)**

| File | Status |
|---|---|
| `lib/simulation/traffic-simulator.ts` | BUILT -- TrafficGenerator class, 5 patterns, 3 distributions, Poisson sampling |
| `lib/simulation/queuing-model.ts` | BUILT -- M/M/1, M/M/c, Erlang-C, Little's Law, percentile estimation |
| `lib/simulation/metrics-collector.ts` | BUILT -- MetricsCollector with circular buffer, sorted latency array, per-node tracking |
| `lib/simulation/chaos-engine.ts` | BUILT -- ChaosEngine with 30 event types across 5 categories |
| `lib/simulation/capacity-planner.ts` | BUILT -- estimateCapacity() with full back-of-envelope math |
| `lib/simulation/index.ts` | BUILT -- barrel export |
| `stores/simulation-store.ts` | BUILT -- state management for status, ticks, traffic config, metrics |

**Missing (CRITICAL):**
- `SimulationOrchestrator` class that connects canvas topology to simulation libraries
- Topology builder (extract graph from canvas nodes/edges)
- Request routing through the graph
- Per-tick simulation loop (timer-driven)
- Chaos event integration with canvas node state
- Utilization-to-visual-state mapping (node colors during simulation)
- Capacity planner UI panel

---

### Module 3: Export System

**Completion: ~85% (built but UNWIRED)**

| File | Status |
|---|---|
| `lib/export/to-json.ts` | BUILT |
| `lib/export/to-mermaid.ts` | BUILT |
| `lib/export/to-plantuml.ts` | BUILT |
| `lib/export/to-terraform.ts` | BUILT |
| `lib/export/to-url.ts` | BUILT |
| `lib/export/index.ts` | BUILT |
| `components/shared/export-dialog.tsx` | BUILT -- full dialog with format selection, preview, copy |

**Missing:**
- ExportDialog is NOT mounted in `page.tsx` -- no way to trigger it from the UI
- No keyboard shortcut to open export (Cmd+Shift+E)
- No import functionality (JSON import to canvas)

---

### Module 4: Template Gallery

**Completion: ~80% (built but UNWIRED)**

| File | Status |
|---|---|
| `lib/templates/types.ts` | BUILT |
| `lib/templates/index.ts` | BUILT |
| `components/shared/template-gallery.tsx` | BUILT -- search, filter by difficulty/category, template cards |

**Missing:**
- TemplateGallery is NOT mounted in `page.tsx` -- unreachable from UI
- No "Load Template" action that hydrates the canvas
- No way to save current canvas as a template

---

### Module 5: Algorithm Visualizer

**Completion: ~90%**

| File | Status |
|---|---|
| `lib/algorithms/sorting/` | BUILT -- bubble, merge, quick, heap, insertion, selection sort |
| `lib/algorithms/types.ts` | BUILT |
| `lib/algorithms/playback-controller.ts` | BUILT |
| `components/modules/AlgorithmModule.tsx` | BUILT -- sidebar, canvas, properties, bottom panel |
| `components/canvas/panels/AlgorithmPanel.tsx` | BUILT |
| `components/canvas/overlays/ArrayVisualizer.tsx` | BUILT |

**Missing:**
- Graph algorithms (BFS, DFS, Dijkstra) -- only sorting implemented
- Search algorithms (binary search, linear search)
- Dynamic programming visualizer
- String matching algorithm visualizer (component exists in `visualization/algorithms/StringMatchVisualizer.tsx` but unused)

---

### Module 6: Distributed Systems

**Completion: ~75%**

| File | Status |
|---|---|
| `lib/distributed/raft.ts` | BUILT |
| `lib/distributed/consistent-hash.ts` | BUILT |
| `lib/distributed/vector-clock.ts` | BUILT |
| `lib/distributed/cap-theorem.ts` | BUILT |
| `lib/distributed/crdt.ts` | BUILT |
| `lib/distributed/gossip.ts` | BUILT |
| `components/modules/DistributedModule.tsx` | BUILT -- Raft + Consistent Hashing visualizations active |

**Missing:**
- Vector Clock visualization (lib exists, no UI)
- Gossip Protocol visualization (lib exists, no UI)
- CRDT visualization (lib exists, no UI)
- CAP Theorem interactive demo (lib exists, no UI)

The module shows "Coming soon" for vector-clocks, gossip, crdts, cap-theorem.

---

### Module 7: Networking

**Completion: ~85%**

| File | Status |
|---|---|
| `lib/networking/tcp-state-machine.ts` | BUILT |
| `lib/networking/tls-handshake.ts` | BUILT |
| `lib/networking/dns-resolution.ts` | BUILT |
| `lib/networking/http-comparison.ts` | BUILT |
| `lib/networking/websocket-lifecycle.ts` | BUILT |
| `lib/networking/cors-simulator.ts` | BUILT |
| `components/modules/NetworkingModule.tsx` | BUILT -- all 6 protocols visualized with sequence diagrams |

**Missing:**
- Interactive packet capture simulation
- Network topology builder

---

### Module 8: OS Concepts

**Completion: ~65%**

| File | Status |
|---|---|
| `lib/os/scheduling.ts` | BUILT -- FCFS, SJF, Round Robin, Priority |
| `lib/os/page-replacement.ts` | BUILT -- FIFO, LRU, Optimal, Clock |
| `lib/os/deadlock.ts` | BUILT |
| `lib/os/memory.ts` | BUILT |
| `components/modules/OSModule.tsx` | BUILT -- CPU scheduling + Page replacement fully visualized |

**Missing:**
- Deadlock Detection UI (lib exists, shows "Coming soon" in UI)
- Memory Management UI (lib exists, shows "Coming soon" in UI)

---

### Module 9: Concurrency

**Completion: ~90%**

| File | Status |
|---|---|
| `lib/concurrency/race-condition.ts` | BUILT |
| `lib/concurrency/producer-consumer.ts` | BUILT |
| `lib/concurrency/dining-philosophers.ts` | BUILT |
| `components/modules/ConcurrencyModule.tsx` | BUILT -- all 3 demos visualized |

**Missing:**
- Reader-Writer Lock demo
- Semaphore demo

---

### Module 10: Interview Practice

**Completion: ~80%**

| File | Status |
|---|---|
| `lib/interview/challenges.ts` | BUILT |
| `lib/interview/scoring.ts` | BUILT |
| `lib/interview/srs.ts` | BUILT |
| `lib/interview/achievements.ts` | BUILT |
| `components/interview/ChallengeCard.tsx` | BUILT |
| `components/interview/ScoreDisplay.tsx` | BUILT |
| `components/modules/InterviewModule.tsx` | BUILT -- challenge browser, timer, requirements, hints |
| `stores/interview-store.ts` | BUILT |

**Missing:**
- Integration with canvas (challenges should open system design module with pre-loaded requirements)
- Score calculation wired to checklist completion
- Achievements system displayed in UI
- SRS (Spaced Repetition System) scheduling active in UI

---

### Module 11: Visualization Components

**Completion: ~85%**

| File | Status |
|---|---|
| `visualization/charts/ThroughputChart.tsx` | BUILT |
| `visualization/charts/LatencyPercentileChart.tsx` | BUILT |
| `visualization/charts/ErrorRateChart.tsx` | BUILT |
| `visualization/charts/QueueDepthBars.tsx` | BUILT |
| `visualization/charts/MetricsDashboard.tsx` | BUILT |
| `visualization/gauges/UtilizationGauge.tsx` | BUILT |
| `visualization/gauges/CacheHitGauge.tsx` | BUILT |
| `visualization/sparklines/Sparkline.tsx` | BUILT |
| `visualization/algorithms/SortingVisualizer.tsx` | BUILT |
| `visualization/algorithms/GraphVisualizer.tsx` | BUILT |
| `visualization/algorithms/DPTableVisualizer.tsx` | BUILT |
| `visualization/algorithms/StringMatchVisualizer.tsx` | BUILT |
| `visualization/distributed/RaftVisualizer.tsx` | BUILT |
| `visualization/distributed/ConsistentHashRingVisualizer.tsx` | BUILT |
| `visualization/distributed/VectorClockDiagram.tsx` | BUILT |
| `lib/visualization/colors.ts` | BUILT |
| `lib/visualization/canvas-renderer.ts` | BUILT |

**Missing:**
- Many visualization components built but not wired to their respective modules
- MetricsDashboard shows static/zero data because simulation never runs

---

### Module 12: Shared Infrastructure

**Completion: ~75%**

| File | Status |
|---|---|
| `components/shared/workspace-layout.tsx` | BUILT |
| `components/shared/activity-bar.tsx` | BUILT |
| `components/shared/status-bar.tsx` | BUILT |
| `components/shared/command-palette.tsx` | BUILT |
| `components/providers/theme-provider.tsx` | BUILT |
| `hooks/use-keyboard-shortcuts.ts` | BUILT |
| `stores/ui-store.ts` | BUILT |
| `stores/editor-store.ts` | BUILT |
| `lib/utils.ts` | BUILT |
| `lib/constants/latency-numbers.ts` | BUILT |
| `lib/constants/throughput-numbers.ts` | BUILT |
| `lib/constants/system-numbers.ts` | BUILT |
| `lib/constants/motion.ts` | BUILT |

**Missing:**
- Monaco editor integration (editor-store exists but no Monaco component)
- Dexie persistence layer (dexie in package.json, not used)
- Web Worker via Comlink (comlink in package.json, not used)

---

## 3. Cross-Cutting Concerns

| Concern | Status | Details |
|---|---|---|
| **Testing** | 0% | Zero test files exist. No `__tests__/` directories, no `.test.ts` files, no jest/vitest config |
| **CI/CD** | 0% | No GitHub Actions, no `.github/workflows/`, no deployment config |
| **Authentication** | 0% | No auth system, no user model, no session management |
| **Database** | 0% | Dexie imported in package.json but zero usage in code. No schema, no migrations |
| **PWA** | 0% | No service worker, no manifest.json, no offline support |
| **Error boundaries** | 0% | No React error boundaries anywhere in the component tree |
| **Accessibility** | ~10% | ExportDialog has aria-modal/aria-label; rest has no ARIA, no keyboard nav beyond shortcuts |
| **i18n** | 0% | All strings hardcoded in English |
| **Analytics** | 0% | No tracking, no telemetry |
| **Performance monitoring** | 0% | No React profiler integration, no web vitals tracking |
| **Linting** | ~20% | ESLint config exists but minimal rules (`eslint-config-next` only) |
| **Type safety** | ~85% | Generally well-typed, some `as any` and `as unknown as` casts |

---

## 4. Built but UNWIRED Components

These components are fully implemented but are not reachable from any UI path:

| Component | File | Issue |
|---|---|---|
| **ExportDialog** | `components/shared/export-dialog.tsx` | NOT imported or mounted in `page.tsx`. No trigger button exists. |
| **TemplateGallery** | `components/shared/template-gallery.tsx` | NOT imported or mounted in `page.tsx`. No trigger button exists. |
| **Simulation Engine** | `lib/simulation/*.ts` | 5 library files totaling ~1,500 lines. `play()` in store just sets `status: "running"` with no timer loop. |
| **Chaos Events** | `lib/simulation/chaos-engine.ts` | 30 chaos event types defined but no UI to inject them (beyond command palette which has no-op actions). |
| **Capacity Planner** | `lib/simulation/capacity-planner.ts` | Full estimation function but zero UI panel to input parameters or display results. |
| **GraphVisualizer** | `visualization/algorithms/GraphVisualizer.tsx` | Built but no graph algorithm module uses it. |
| **DPTableVisualizer** | `visualization/algorithms/DPTableVisualizer.tsx` | Built but no DP algorithm module exists. |
| **StringMatchVisualizer** | `visualization/algorithms/StringMatchVisualizer.tsx` | Built but no string matching module exists. |
| **VectorClockDiagram** | `visualization/distributed/VectorClockDiagram.tsx` | Built but distributed module shows "Coming soon" for vector clocks. |
| **RaftVisualizer** | `visualization/distributed/RaftVisualizer.tsx` | Built separately but `DistributedModule.tsx` has its own inline Raft SVG. |
| **ConsistentHashRingVisualizer** | `visualization/distributed/ConsistentHashRingVisualizer.tsx` | Built separately but `DistributedModule.tsx` has its own inline ring SVG. |
| **Dexie (IndexedDB)** | `package.json` dep | Listed as dependency, zero imports in codebase |
| **Comlink (Web Workers)** | `package.json` dep | Listed as dependency, zero imports in codebase |
| **lz-string** | `package.json` dep | Listed as dependency, used only in `to-url.ts` export |
| **zundo (undo/redo)** | `canvas-store.ts` | Temporal middleware configured but no UI undo/redo buttons |

---

## 5. Dependency Utilization

| Dependency | Used? | Where |
|---|---|---|
| `@xyflow/react` | YES | DesignCanvas, node/edge types |
| `zustand` | YES | 6 stores |
| `zundo` | PARTIAL | canvas-store only, no UI triggers |
| `cmdk` | YES | CommandPalette |
| `lucide-react` | YES | Icons throughout |
| `react-resizable-panels` | YES | workspace-layout |
| `motion` | MINIMAL | Some animations |
| `next-themes` | YES | theme-provider |
| `dexie` + `dexie-react-hooks` | NO | Unused |
| `comlink` | NO | Unused |
| `lz-string` | MINIMAL | to-url.ts only |
| `@radix-ui/*` | PARTIAL | Some primitives used |

---

## 6. Summary

**Overall completion: ~60%**

The codebase has substantial library code (simulation engine, queuing models, chaos engine, capacity planner) that represents significant engineering effort but is completely disconnected from the UI. The primary gap is the **simulation orchestration layer** that would connect the canvas topology to the simulation engine and drive the visualization components with real data. Secondary gaps include unmounted UI components (ExportDialog, TemplateGallery) and several modules showing "Coming soon" placeholders despite having backend libraries ready.
