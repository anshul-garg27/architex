# Code Quality & Bug Report

**Date:** 2026-04-11
**Scope:** All bugs, anti-patterns, and quality issues found in the Architex source code

---

## Bug Inventory Summary

| Severity | Count |
|---|---|
| CRITICAL | 2 |
| HIGH | 5 |
| MEDIUM | 6 |
| LOW | 4 |
| **Total** | **17** |

---

## CRITICAL Severity

### BUG-001: Stale Closure in `onConnect` Captures Entire Edges Array

**File:** `src/components/canvas/DesignCanvas.tsx`
**Lines:** 41-55
**Severity:** CRITICAL

**Description:**
The `onConnect` callback uses `addEdge()` from `@xyflow/react` which takes the current edges array as its second argument. The callback captures `edges` from the Zustand selector in its closure and lists it in the `useCallback` dependency array. However, because Zustand updates are batched and React may not re-render between rapid connection events (e.g., user dragging multiple edges quickly), the `edges` value inside the closure can be stale. This means that when two connections are made in quick succession, the second one may overwrite the first because it uses the pre-first-connection edges array.

**Current Code:**
```typescript
const onConnect = useCallback(
  (connection: Connection) => {
    setEdges(
      addEdge(
        {
          ...connection,
          type: "data-flow",
          data: { edgeType: "http", animated: true },
        },
        edges, // <-- stale closure: captures snapshot of edges
      ),
    );
  },
  [edges, setEdges], // edges in deps causes re-creation on every edge change
);
```

**Fix:**
Use the functional updater form of `setEdges` that Zustand supports, or use `addEdge` from the store. Since the canvas store already has `addEdge`, prefer using the store's `onConnect` pattern:

```typescript
const onConnect = useCallback(
  (connection: Connection) => {
    // Use store's setEdges with a functional pattern
    // that reads current state at call time
    const currentEdges = useCanvasStore.getState().edges;
    setEdges(
      addEdge(
        {
          ...connection,
          type: "data-flow",
          data: { edgeType: "http", animated: true },
        },
        currentEdges,
      ),
    );
  },
  [setEdges],
);
```

**Impact:** Lost edges when users connect multiple nodes rapidly. Race condition in the most critical user interaction.

---

### BUG-002: Unbounded `metricsHistory` Array -- Memory Leak

**File:** `src/stores/simulation-store.ts`
**Lines:** 128-131
**Severity:** CRITICAL

**Description:**
The `recordMetricsSnapshot` function appends to `metricsHistory` without any size limit. If a simulation runs and `recordMetricsSnapshot()` is called every tick (e.g., every 100ms), after 10 minutes there would be 6,000 entries. After an hour, 36,000 entries. Each `SimulationMetrics` object has 11 numeric fields. This is an unbounded growth pattern that will eventually crash the browser tab.

**Current Code:**
```typescript
recordMetricsSnapshot: () =>
  set((s) => ({
    metricsHistory: [...s.metricsHistory, { ...s.metrics }],
  })),
```

**Fix:**
Add a maximum history size (e.g., 1,000 entries) and use a ring-buffer approach:

```typescript
const MAX_METRICS_HISTORY = 1000;

recordMetricsSnapshot: () =>
  set((s) => {
    const history = [...s.metricsHistory, { ...s.metrics }];
    // Keep only the last MAX_METRICS_HISTORY entries
    if (history.length > MAX_METRICS_HISTORY) {
      return { metricsHistory: history.slice(-MAX_METRICS_HISTORY) };
    }
    return { metricsHistory: history };
  }),
```

**Impact:** Browser tab crash after extended simulation runs due to out-of-memory.

---

## HIGH Severity

### BUG-003: Unguarded `JSON.parse` on Drag-and-Drop Data

**File:** `src/components/canvas/DesignCanvas.tsx`
**Line:** 84
**Severity:** HIGH

**Description:**
The `onDrop` handler calls `JSON.parse(raw)` on data received from `dataTransfer.getData()` without a try-catch. If the data is malformed (e.g., another application drops data onto the canvas, or a browser extension injects content), this will throw an uncaught exception and crash the component.

**Current Code:**
```typescript
const onDrop = useCallback(
  (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/architex-node");
    if (!raw || !reactFlowRef.current) return;

    const data = JSON.parse(raw); // <-- unguarded, will throw on malformed JSON
```

**Fix:**
```typescript
const onDrop = useCallback(
  (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/architex-node");
    if (!raw || !reactFlowRef.current) return;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("Invalid drag data received:", raw);
      return;
    }

    // Optional: validate shape
    if (!data.type || !data.label) return;
```

**Impact:** Uncaught exception crashes the canvas component when receiving unexpected drag data.

---

### BUG-004: Module-Scoped Mutable Counter (`nodeIdCounter`)

**File:** `src/components/canvas/DesignCanvas.tsx`
**Line:** 23
**Severity:** HIGH

**Description:**
`nodeIdCounter` is a `let` variable at module scope. In development mode with React Strict Mode (and in production with HMR), this counter persists across component unmounts/remounts but resets on full page reload. This creates two problems:

1. **ID collisions across sessions:** Counter resets to 0 on page reload, potentially generating IDs that clash with serialized/imported diagrams.
2. **Non-deterministic behavior:** The counter is not tied to React state, so it doesn't participate in React's lifecycle.

**Current Code:**
```typescript
let nodeIdCounter = 0;
function generateNodeId() {
  return `node-${Date.now()}-${++nodeIdCounter}`;
}
```

**Fix:**
The `Date.now()` component provides sufficient uniqueness for most cases, but a proper fix uses `crypto.randomUUID()` or a combination:

```typescript
function generateNodeId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

Or for guaranteed uniqueness:
```typescript
function generateNodeId() {
  return crypto.randomUUID();
}
```

**Impact:** Potential node ID collisions when importing diagrams or across sessions.

---

### BUG-005: Repeated `<style>` Tag Injection from DataFlowEdge

**File:** `src/components/canvas/edges/DataFlowEdge.tsx`
**Line:** 71
**Severity:** HIGH

**Description:**
Every animated edge renders a `<style>` tag containing the `@keyframes architex-dash-flow` animation. If there are 20 animated edges on the canvas, 20 identical `<style>` tags are injected into the DOM. While browsers handle duplicate keyframes gracefully, this:

1. Pollutes the DOM with redundant style elements
2. Causes unnecessary style recalculations on each render
3. Violates the principle of injecting global styles once

**Current Code:**
```typescript
{isAnimated && <style>{ANIMATION_STYLE}</style>}
```

**Fix:**
Inject the style once at the module level or use a ref to ensure single injection:

```typescript
// At module top level, inject once
if (typeof document !== 'undefined') {
  const styleId = 'architex-dash-flow-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = ANIMATION_STYLE;
    document.head.appendChild(style);
  }
}

// Then remove the inline <style> from the component render:
// Remove: {isAnimated && <style>{ANIMATION_STYLE}</style>}
```

Or use a CSS file / Tailwind `@keyframes` definition in `globals.css`.

**Impact:** DOM pollution and unnecessary style recalculation scaling with edge count.

---

### BUG-006: Barrel Import of All Lucide Icons (`import * as LucideIcons`)

**File:** `src/components/canvas/panels/ComponentPalette.tsx`
**Line:** 5
**Severity:** HIGH

**Description:**
The ComponentPalette imports the entire `lucide-react` library as a namespace object:

```typescript
import * as LucideIcons from "lucide-react";
```

This defeats tree-shaking entirely. The `lucide-react` package contains 1,500+ icon components. Even though only a handful are actually used, the bundler must include the entire module because a namespace import is a dynamic lookup (`icons[iconName]`).

**Current Code:**
```typescript
import * as LucideIcons from "lucide-react";

function getIcon(iconName: string) {
  const icons = LucideIcons as any;
  const Icon = icons[iconName];
  return Icon ?? LucideIcons.Box;
}
```

**Fix:**
Create a pre-defined icon map with only the icons used by palette items:

```typescript
import {
  Server, Network, Database, Zap, ListOrdered,
  Shield, Globe2, HardDrive, Users, Box,
  // ... add all icons used in PALETTE_ITEMS
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Server, Network, Database, Zap, ListOrdered,
  Shield, Globe2, HardDrive, Users, Box,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Box;
}
```

**Impact:** Bundle size increased by ~200-400KB (gzipped ~50-100KB) due to including all 1,500+ Lucide icons. Affects initial page load time.

---

### BUG-007: No-Op Actions in Command Palette

**File:** `src/components/shared/command-palette.tsx`
**Lines:** 170-234
**Severity:** HIGH

**Description:**
Eight command palette actions under "Add Component" and one under "Help" have empty no-op arrow functions as their action handlers:

```typescript
action: () => {/* handled by canvas */},  // line 173 -- misleading comment
action: () => {},  // lines 181, 187, 193, 199, 205, 211, 217, 233
```

These commands appear in the palette, the user can select them, and... nothing happens. The "Add Web Server" comment says "handled by canvas" but there is no communication to the canvas. This is a broken user experience -- the commands are discoverable but non-functional.

**Fix:**
Either implement the actions (create nodes at viewport center) or remove them from the palette:

```typescript
// Option A: Implement properly
{
  id: "add-web-server",
  label: "Add Web Server",
  icon: Server,
  action: () => {
    const { addNode } = useCanvasStore.getState();
    addNode({
      id: crypto.randomUUID(),
      type: "web-server",
      position: { x: 400, y: 300 }, // center of viewport
      data: {
        label: "Web Server",
        category: "compute",
        componentType: "web-server",
        config: {},
        metrics: {},
        state: "idle",
      },
    });
  },
  group: "Add Component",
},
```

**Impact:** User confusion -- 9 commands in the palette do nothing when selected.

---

## MEDIUM Severity

### BUG-008: `SystemDesignContent` Is a Regular Function Returning an Object, Not a Component

**File:** `src/app/page.tsx`
**Lines:** 26-37
**Severity:** MEDIUM

**Description:**
`SystemDesignContent` is named like a React component (PascalCase) but is a plain function that returns a plain object `{ sidebar, canvas, properties, bottomPanel }`. It is invoked directly as `SystemDesignContent()` (line 53), not rendered as JSX. This is technically correct behavior but:

1. **Naming violation:** PascalCase naming makes readers expect a React component
2. **No hooks allowed inside:** Because it's called as a regular function (not rendered as a component), any hooks inside would violate Rules of Hooks. Currently there are none, but a future developer might add one thinking it's a component.

**Fix:**
Rename to `getSystemDesignContent` or `buildSystemDesignContent`:

```typescript
function getSystemDesignContent() {
  return {
    sidebar: <ComponentPalette />,
    canvas: (
      <ReactFlowProvider>
        <DesignCanvas />
      </ReactFlowProvider>
    ),
    properties: <PropertiesPanel />,
    bottomPanel: <BottomPanel />,
  };
}

// In useModuleContent:
case "system-design":
  return getSystemDesignContent();
```

**Impact:** Confusing naming that could lead to Rules of Hooks violations if a developer adds hooks thinking it is a component.

---

### BUG-009: All Module Hooks Called Unconditionally

**File:** `src/app/page.tsx`
**Lines:** 43-49
**Severity:** MEDIUM

**Description:**
The `useModuleContent` function calls ALL seven module hooks on every render, regardless of which module is active:

```typescript
const algorithmContent = useAlgorithmModule();
const distributedContent = useDistributedModule();
const networkingContent = useNetworkingModule();
const osContent = useOSModule();
const concurrencyContent = useConcurrencyModule();
const interviewContent = useInterviewModule();
const placeholderContent = usePlaceholderModule(activeModule);
```

The comment says "All hooks must be called unconditionally (Rules of Hooks)" -- this is correct for the Rules of Hooks, but the architectural choice to use hooks for module content is the problem. Each of these hooks:

- Allocates state (useState calls)
- Creates memoized values (useMemo)
- Sets up intervals and timers (useRef + setInterval)
- Renders JSX for all four panels

When the user is on the "system-design" module, all the concurrency, distributed, OS, networking, and interview modules are still running their hooks, allocating memory, and potentially running timers.

**Fix:**
This is an architectural issue. The proper fix is to use dynamic imports with `React.lazy` and render only the active module:

```typescript
// Long-term fix: lazy-load modules
const modules = {
  "system-design": lazy(() => import("@/components/modules/SystemDesignModule")),
  "algorithms": lazy(() => import("@/components/modules/AlgorithmModule")),
  // ...
};
```

Short-term mitigation: add early-return logic inside each hook when inactive:

```typescript
export function useDistributedModule(isActive: boolean) {
  // Always call hooks, but skip expensive computation when inactive
  const [activeSim, setActiveSim] = useState<DistributedSim>("raft");
  // ...
  // Only create interval when active
  const doStep = useCallback(() => {
    if (!isActive) return;
    // ...
  }, [isActive]);
```

**Impact:** Wasted memory and CPU cycles from 6 inactive modules running hooks simultaneously.

---

### BUG-010: Canvas Store Undo History Limit Set But No UI Triggers

**File:** `src/stores/canvas-store.ts`
**Line:** 90
**Severity:** MEDIUM

**Description:**
The canvas store uses `zundo` temporal middleware with `{ limit: 100 }` for undo/redo support. However:

1. No UI buttons for undo/redo exist anywhere
2. No keyboard shortcuts (Cmd+Z, Cmd+Shift+Z) are wired to temporal undo/redo
3. The `use-keyboard-shortcuts.ts` hook does not include undo/redo handlers
4. The 100-state limit means the undo history can hold up to 100 state snapshots, each containing the full nodes and edges arrays -- this is potentially a large memory allocation with no user benefit since undo is unreachable

**Fix:**
Add keyboard shortcuts for undo/redo:

```typescript
// In use-keyboard-shortcuts.ts:
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        useCanvasStore.temporal.getState().redo();
      } else {
        useCanvasStore.temporal.getState().undo();
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Impact:** Undo/redo functionality exists in code but is completely unreachable by users.

---

### BUG-011: Simulation `play()` Sets Status But Runs No Simulation

**File:** `src/stores/simulation-store.ts`
**Line:** 100
**Severity:** MEDIUM

**Description:**
The `play()` action simply sets `status: "running"`:

```typescript
play: () => set({ status: "running" }),
```

There is no timer loop, no tick processing, no integration with `TrafficGenerator`, `MetricsCollector`, or any simulation library. The timeline controls in `BottomPanel.tsx` render play/pause/stop/step buttons that toggle this status flag, but no actual simulation computation occurs. The metrics dashboard shows all zeros because `updateMetrics` is never called.

**Impact:** The entire simulation feature is non-functional despite extensive UI controls and backend libraries.

---

### BUG-012: `activeChaosEvents` Store Array Has No Corresponding UI Injection

**File:** `src/stores/simulation-store.ts`
**Lines:** 133-141
**Severity:** MEDIUM

**Description:**
The simulation store tracks `activeChaosEvents: string[]` with `addChaosEvent`, `removeChaosEvent`, and `clearChaosEvents` methods. However:

1. No UI component calls `addChaosEvent`
2. The ChaosEngine class in `lib/simulation/chaos-engine.ts` manages its own internal `activeEvents` Map -- it does NOT sync with the store
3. There are two separate sources of truth for chaos events: the store's string array and the engine's typed Map

**Impact:** Chaos event state is fragmented between two unconnected systems.

---

### BUG-013: `edgeType` Property Access Without Null Check

**File:** `src/components/canvas/edges/DataFlowEdge.tsx`
**Line:** 54
**Severity:** MEDIUM

**Description:**
The edge type lookup falls back safely:

```typescript
const edgeData = data as SystemDesignEdgeData | undefined;
const edgeType: EdgeType = edgeData?.edgeType ?? 'http';
```

However, the `EDGE_STYLES` record lookup on line 55 assumes `edgeType` is always a valid key:

```typescript
const style = EDGE_STYLES[edgeType];
```

If `edgeData.edgeType` contains a value not in the `EDGE_STYLES` record (e.g., from a deserialized diagram with a newer edge type), `style` will be `undefined`, and accessing `style.stroke` on line 78 will throw.

**Fix:**
```typescript
const style = EDGE_STYLES[edgeType] ?? EDGE_STYLES.http;
```

**Impact:** Runtime crash if an unknown edge type appears in deserialized data.

---

## LOW Severity

### BUG-014: Timer Cleanup Race in `DistributedModule`

**File:** `src/components/modules/DistributedModule.tsx`
**Lines:** 580-588
**Severity:** LOW

**Description:**
The `handlePlayPause` function creates an interval and stores it in `timerRef`. The cleanup effect on line 654-658 clears the interval on unmount. However, if the component re-renders between the `setPlaying(true)` call and the `setInterval` assignment, the `timerRef.current` could briefly be null while `playing` is true. This is a minor race condition that is unlikely to cause visible issues but represents a pattern that could leak timers.

**Fix:**
Use `useEffect` to manage the interval lifecycle tied to the `playing` state:

```typescript
useEffect(() => {
  if (!playing) return;
  const id = setInterval(doStep, 100);
  return () => clearInterval(id);
}, [playing, doStep]);
```

**Impact:** Theoretical timer leak under rapid play/pause toggling.

---

### BUG-015: `handleCrashNode` Reads Stale `crashedNodes` from Closure

**File:** `src/components/modules/DistributedModule.tsx`
**Lines:** 602-614
**Severity:** LOW

**Description:**
The `handleCrashNode` callback has `crashedNodes` in its dependency array but reads `clusterRef.current.getState()` which may have already processed the crash. This can lead to trying to crash an already-crashed node in rapid succession.

**Impact:** Minor UX issue -- double-clicking "Crash Node" might not crash two different nodes.

---

### BUG-016: Missing `displayName` on Several Memo Components

**File:** Multiple files
**Severity:** LOW

**Description:**
Most `memo()` components use the named function pattern (`memo(function ComponentName() {...})`), which automatically sets `displayName`. However, some components in the visualization directory may lack this, making React DevTools debugging harder.

**Impact:** Harder debugging in React DevTools.

---

### BUG-017: `onAlgoChange` Callback Not Connected

**File:** `src/components/modules/AlgorithmModule.tsx`
**Lines:** 73-91
**Severity:** LOW

**Description:**
The `AlgorithmSidebar` component receives an `onAlgoChange` prop but the `AlgorithmPanel` component it renders does not receive or use this callback. The algorithm selection change in the sidebar is not propagated back to the parent module state.

```typescript
const AlgorithmSidebar = memo(function AlgorithmSidebar({
  onStepChange,
  onArrayChange,
  onReset,
  onAlgoChange,  // <-- received but never passed to AlgorithmPanel
}: { ... }) {
  return (
    <AlgorithmPanel
      onStepChange={onStepChange}
      onArrayChange={onArrayChange}
      onReset={onReset}
      // onAlgoChange is not passed!
    />
  );
});
```

**Impact:** Algorithm selection changes in the sidebar may not update the properties panel's displayed algorithm info.

---

## Code Quality Anti-Patterns

### AP-001: Inline SVG Visualizations Instead of Reusable Components

The `DistributedModule.tsx` (775 lines) and `OSModule.tsx` (808 lines) contain large inline SVG rendering logic that duplicates functionality already built in the `visualization/` directory. The `RaftVisualizer.tsx` and `ConsistentHashRingVisualizer.tsx` exist as reusable components but are not used.

### AP-002: Large Module Files

Several module files exceed 500 lines:
- `DistributedModule.tsx`: 775 lines
- `OSModule.tsx`: 808 lines
- `ConcurrencyModule.tsx`: 663 lines
- `NetworkingModule.tsx`: 625 lines
- `InterviewModule.tsx`: 484 lines
- `AlgorithmModule.tsx`: 439 lines

Each module contains sidebar, canvas, properties, and bottom panel components plus the module hook. These should be split into separate files per panel.

### AP-003: Mixed Concerns in `page.tsx`

The root `page.tsx` imports components from 7 different modules and orchestrates all of them. It serves as both router and shell, making it harder to reason about.

### AP-004: No Error Boundaries

Zero error boundaries exist in the component tree. A crash in any module (e.g., the unguarded JSON.parse in BUG-003) will crash the entire application rather than being contained to the affected module.

---

## Recommended Fix Priority

1. **BUG-001** (stale closure) -- Fix immediately, causes data loss
2. **BUG-002** (unbounded history) -- Fix immediately, causes browser crash
3. **BUG-006** (lucide barrel import) -- Fix for bundle size
4. **BUG-003** (JSON.parse) -- Fix for robustness
5. **BUG-005** (style injection) -- Fix for performance
6. **BUG-007** (no-op actions) -- Fix or remove for UX
7. **BUG-011** (simulation not running) -- Architectural fix needed
8. **BUG-010** (undo not wired) -- Add keyboard shortcuts
9. Remaining bugs in severity order
