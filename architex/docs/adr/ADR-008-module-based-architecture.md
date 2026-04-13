# ADR-008: Module-Based Architecture with Lazy Loading

**Status:** Accepted

**Date:** 2024

## Context

Architex covers 13 distinct learning domains, each with its own visualization system, interaction model, and domain logic:

1. System Design (canvas-based, React Flow)
2. Algorithms (array/graph/tree visualizers with step-through)
3. Data Structures (interactive DS visualizers)
4. Low-Level Design (UML class diagrams, SOLID demos, codegen)
5. Database (ER diagrams, B-tree viz, query plans, normalization)
6. Distributed Systems (Raft, Paxos, consistent hashing, CRDTs)
7. Networking (TCP state machine, TLS handshake, DNS, HTTP comparison)
8. OS Concepts (scheduling, memory management, page replacement, deadlock)
9. Concurrency (mutex, producer-consumer, dining philosophers, event loop)
10. Security (OAuth flows, JWT, encryption, web attacks, rate limiting)
11. ML Design (neural nets, pipelines, A/B testing, serving patterns)
12. Interview (challenges, SRS review, mock interviews, daily challenges)
13. Knowledge Graph (concept relationships, prerequisite mapping)

The application must support all domains within a single SPA without route-level code splitting (since all modules share the same `/` route), while keeping the initial bundle manageable and the architecture extensible.

## Decision

Use a **module-based architecture** where each domain is an independent module that provides its own sidebar, canvas, properties panel, and bottom panel via a custom React hook.

## Rationale

1. **The `useXxxModule` hook pattern.** Each module exports a hook that returns four ReactNode panel contents. This creates a clean contract between modules and the workspace layout:

   ```ts
   // Module hook signature (every module follows this pattern)
   function useXxxModule(): {
     sidebar: ReactNode;
     canvas: ReactNode;
     properties: ReactNode;
     bottomPanel: ReactNode;
   }
   ```

   The workspace layout (`src/components/shared/workspace-layout.tsx`) is module-agnostic -- it receives these four slots and arranges them in a resizable panel layout.

2. **Module router.** The `useModuleContent()` function in `src/app/page.tsx` acts as a module router. It calls all module hooks unconditionally (Rules of Hooks) and switches on `activeModule`:

   ```ts
   function useModuleContent() {
     const activeModule = useUIStore((s) => s.activeModule);

     const algorithmContent = useAlgorithmModule();
     const distributedContent = useDistributedModule();
     const securityContent = useSecurityModule();
     // ... all 13 hooks called unconditionally ...

     switch (activeModule) {
       case "algorithms": return algorithmContent;
       case "distributed": return distributedContent;
       case "security": return securityContent;
       // ...
       default: return placeholderContent;
     }
   }
   ```

   While all hooks are called on every render, each hook's internal rendering is cheap when not active (most return pre-built JSX with no side effects until the user interacts).

3. **Module-specific library code.** Each module has a corresponding `src/lib/<module>/` directory containing its domain logic:

   | Module | Library path | Key contents |
   |--------|-------------|-------------|
   | Algorithms | `src/lib/algorithms/` | 54+ sort/graph/tree/DP/string/backtracking/geometry implementations |
   | Data Structures | `src/lib/data-structures/` | 21+ DS implementations (bloom filter, skip list, B+ tree, etc.) |
   | Distributed | `src/lib/distributed/` | Raft, Paxos, CRDT, gossip, vector clock, consistent hash |
   | Networking | `src/lib/networking/` | TCP, TLS, DNS, HTTP comparison, CORS, WebSocket |
   | OS | `src/lib/os/` | Scheduling (MLFQ), memory, page replacement, deadlock |
   | Concurrency | `src/lib/concurrency/` | Mutex, producer-consumer, dining philosophers, event loop |
   | Security | `src/lib/security/` | OAuth, JWT, encryption, web attacks, rate limiting, DH, HTTPS |
   | ML Design | `src/lib/ml-design/` | Neural net, CNN, optimizers, serving patterns, A/B testing |
   | Database | `src/lib/database/` | ER diagrams, B-tree viz, normalization, query plans |
   | LLD | `src/lib/lld/` | UML patterns, SOLID demos, codegen, state machine |
   | Interview | `src/lib/interview/` | Challenges, SRS, scoring, daily challenges, learning paths |
   | Knowledge Graph | `src/lib/knowledge-graph/` | Concept graph, relationships, layout |

4. **Conditional rendering (implicit lazy loading).** Although all hooks are called, heavy components inside each module only mount when `activeModule` matches. React's reconciliation ensures that switching from "algorithms" to "distributed" unmounts algorithm visualizers and mounts distributed system components. This provides de-facto lazy loading without dynamic `import()`.

5. **Shared visualization components.** Some visualization components are shared across modules via `src/components/visualization/`:

   - `SortingVisualizer`, `GraphVisualizer`, `DPTableVisualizer`, `StringMatchVisualizer` (algorithms)
   - `ConsistentHashRingVisualizer`, `RaftVisualizer`, `VectorClockDiagram` (distributed)
   - `ThroughputChart`, `LatencyPercentileChart`, `ErrorRateChart` (metrics)
   - `CacheHitGauge`, `UtilizationGauge` (gauges)
   - `Sparkline` (inline charts)

6. **The activity bar as module navigator.** The activity bar (`src/components/shared/activity-bar.tsx`) drives module switching via the `useUIStore.setActiveModule()` action. It is defined as a flat array of `ModuleItem` entries, making it trivial to add or reorder modules:

   ```ts
   const modules: ModuleItem[] = [
     { id: "system-design", label: "System Design", icon: LayoutDashboard, shortcut: "1" },
     { id: "algorithms", label: "Algorithms", icon: Binary, shortcut: "2" },
     // ... 13 total entries
   ];
   ```

7. **Placeholder module for unfinished domains.** The `usePlaceholderModule` hook in `src/components/modules/PlaceholderModule.tsx` renders a "Coming Soon" page for any module that hasn't been fully implemented yet. It accepts the `activeModule` string and looks up metadata from a `PLACEHOLDER_DEFS` record.

8. **Command palette integration.** Every module is accessible via the command palette (`Cmd+K`), which generates `moduleCmd` entries from the same module ID space:

   ```ts
   moduleCmd("algorithms", "Algorithms", Binary, "Cmd+2"),
   moduleCmd("distributed", "Distributed Systems", Network, "Cmd+6"),
   ```

## Consequences

### Positive

- Adding a new module requires touching only 6 files (see `docs/guides/adding-a-module.md`).
- Each module is independently developed and tested.
- The workspace layout is completely decoupled from module internals.
- The activity bar, command palette, and keyboard shortcuts all derive from the same module registry.
- No route-level code splitting needed -- all modules share `/`, which simplifies deployment and avoids loading screens between modules.

### Negative

- All module hooks are called on every render, even for inactive modules. This is cheap in practice (hooks return pre-built JSX) but imposes a fixed overhead per module.
- True code splitting would require `React.lazy()` with dynamic imports, which conflicts with the unconditional hook call requirement. If the number of modules grows beyond ~20, this trade-off should be revisited.
- Module state resets when switching modules (since hooks use local `useState`). Persistent cross-module state must be stored in Zustand stores.

## References

- Module components: `src/components/modules/*.tsx`
- Module barrel: `src/components/modules/index.ts`
- Module router: `src/app/page.tsx` (`useModuleContent()`)
- Activity bar: `src/components/shared/activity-bar.tsx`
- Command palette: `src/components/shared/command-palette.tsx`
- Workspace layout: `src/components/shared/workspace-layout.tsx`
- UI store (activeModule): `src/stores/ui-store.ts`
- Placeholder module: `src/components/modules/PlaceholderModule.tsx`
- Library code: `src/lib/algorithms/`, `src/lib/distributed/`, `src/lib/security/`, etc.
