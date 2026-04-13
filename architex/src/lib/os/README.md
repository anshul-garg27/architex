# How to Add a New OS Concept

This guide walks you through adding a new operating-system concept to the
Architex OS module. Follow every step exactly and a reviewer should have
nothing to request.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [File Structure](#2-file-structure)
3. [Step 1 -- Create the Engine File](#3-step-1--create-the-engine-file)
4. [Step 2 -- Register Exports in index.ts](#4-step-2--register-exports-in-indexts)
5. [Step 3 -- Wire into OSModule.tsx (7 Registration Points)](#5-step-3--wire-into-osmoduletsx-7-registration-points)
6. [Step 4 -- Write Tests](#6-step-4--write-tests)
7. [Quality Checklist](#7-quality-checklist)

---

## 1. Prerequisites

Before you start, make sure you understand:

- **TypeScript** -- every engine file and the UI are fully typed; no `any`.
- **React hooks** -- the UI uses `useState`, `useCallback`, `useMemo`, `memo`.
- **The OS concept you are implementing** -- you should be able to explain
  the algorithm on a whiteboard before you write code.
- **Event-based simulation** -- every engine produces a list of events with
  a `tick` (time step) and a human-readable `description`. The UI renders
  these events in a step-through log and visualization.

Read at least one existing engine to internalize the pattern:

| Engine file | Good example of |
|---|---|
| `src/lib/os/scheduling.ts` | Multiple algorithms in one file, shared `ScheduleResult` type, Gantt chart data |
| `src/lib/os/thread-sync.ts` | Simple event list (`SyncEvent[]`), multiple primitives in one file |
| `src/lib/os/memory-alloc.ts` | Step-by-step state snapshots (`MemoryAllocStep[]`) with fragmentation metrics |

---

## 2. File Structure

All OS module code lives under `src/lib/os/` (engines) and
`src/components/modules/OSModule.tsx` (UI).

```
src/lib/os/
  index.ts                  # Barrel re-exports for all engines
  scheduling.ts             # CPU scheduling (FCFS, SJF, RR, Priority, MLFQ)
  page-replacement.ts       # Page replacement (FIFO, LRU, Optimal, Clock)
  deadlock.ts               # Deadlock detection (RAG cycle detection)
  memory.ts                 # Virtual memory address translation + TLB
  memory-alloc.ts           # Contiguous allocation (First/Best/Worst Fit)
  thread-sync.ts            # Mutex, Semaphore, Reader-Writer Lock
  mlfq-scheduler.ts         # Dedicated MLFQ scheduler with boost/IO
  bankers-algorithm.ts      # Banker's Algorithm (safety + request)
  context-switch.ts         # Context switch simulation
  system-calls.ts           # System call simulation
  __tests__/
    bankers-algorithm.test.ts

src/__tests__/lib/os/       # (Legacy location -- prefer __tests__/ above)
  scheduling.test.ts
  page-replacement.test.ts
  deadlock.test.ts
  mlfq-scheduler.test.ts

src/components/modules/
  OSModule.tsx              # 3933-line file: sidebar, canvas, properties, event log
```

> **Note:** Test files are currently split across two directories. Place new
> tests in `src/lib/os/__tests__/` to co-locate them with the source.

---

## 3. Step 1 -- Create the Engine File

Create `src/lib/os/{concept-name}.ts`.

### 3.1 Required exports

Every engine file must export:

1. **Type(s)** for the event/step/result shape.
2. **Simulation function(s)** -- pure functions that accept configuration and
   return an array of events or a result object.

### 3.2 Pattern: event-based simulation

Each simulation function:

- Accepts typed input (process list, config numbers, etc.)
- Runs a deterministic simulation loop
- Emits events/steps, each with:
  - `tick` -- integer time step
  - `description` -- human-readable string explaining what happened *and why*
- Returns the event array (and optionally aggregated metrics)

### 3.3 Minimal engine template

Below is a complete, minimal engine file you can copy. Replace every
occurrence of `DiskSched` / `disk-sched` / `disk` with your concept name.

```typescript
/**
 * Disk Scheduling Algorithm Simulations
 *
 * Implements disk scheduling algorithms with event logs
 * for step-by-step playback in the visualization layer.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single event emitted during simulation. */
export interface DiskSchedEvent {
  tick: number;
  description: string;
  // Add concept-specific fields:
  headPosition: number;
  seekDistance: number;
}

/** The result of running one disk scheduling algorithm. */
export interface DiskSchedResult {
  algorithm: string;
  events: DiskSchedEvent[];
  totalSeekDistance: number;
  avgSeekDistance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone input so mutations stay local to the run. */
function cloneRequests(requests: number[]): number[] {
  return [...requests];
}

// ---------------------------------------------------------------------------
// 1. SSTF (Shortest Seek Time First)
// ---------------------------------------------------------------------------

/**
 * Shortest Seek Time First disk scheduling.
 *
 * @param requests - Array of cylinder numbers to service.
 * @param initialHead - Starting head position.
 * @returns A DiskSchedResult with the event log and metrics.
 */
export function sstf(
  requests: number[],
  initialHead: number,
): DiskSchedResult {
  const pending = cloneRequests(requests);
  const events: DiskSchedEvent[] = [];
  let head = initialHead;
  let totalSeek = 0;
  let tick = 0;

  while (pending.length > 0) {
    // Find closest request
    let minIdx = 0;
    let minDist = Math.abs(pending[0] - head);
    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i] - head);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }

    const target = pending.splice(minIdx, 1)[0];
    const seekDist = Math.abs(target - head);
    totalSeek += seekDist;

    events.push({
      tick: tick++,
      description: `Head moves ${head} -> ${target} (seek=${seekDist})`,
      headPosition: target,
      seekDistance: seekDist,
    });

    head = target;
  }

  return {
    algorithm: 'SSTF',
    events,
    totalSeekDistance: totalSeek,
    avgSeekDistance: events.length > 0 ? totalSeek / events.length : 0,
  };
}

// ---------------------------------------------------------------------------
// Comparison helper
// ---------------------------------------------------------------------------

/**
 * Run all disk scheduling algorithms on the same request set.
 */
export function compareDiskAlgorithms(
  requests: number[],
  initialHead: number,
): Record<string, DiskSchedResult> {
  return {
    SSTF: sstf(requests, initialHead),
    // Add more algorithms here as you implement them.
  };
}
```

### 3.4 Key rules

- **Pure functions** -- no side effects, no global state mutations (the
  `blockIdCounter` in `memory-alloc.ts` is a rare exception; avoid if you can).
- **Clone inputs** -- never mutate the caller's data.
- **Descriptions explain *why*** -- not just "P1 runs" but
  "P1 starts execution because it has the shortest burst (3)".
- **Sort events by tick** at the end if they might be emitted out of order.

---

## 4. Step 2 -- Register Exports in index.ts

Open `src/lib/os/index.ts` and add a new `export { ... } from` block at the
bottom. Follow the existing pattern exactly:

```typescript
// In src/lib/os/index.ts -- add at the bottom:

export {
  type DiskSchedEvent,
  type DiskSchedResult,
  sstf,
  compareDiskAlgorithms,
} from './disk-scheduling';
```

The barrel file currently has 8 export blocks (lines 12-85). Yours will be
the 9th.

---

## 5. Step 3 -- Wire into OSModule.tsx (7 Registration Points)

`src/components/modules/OSModule.tsx` is a 3933-line file. You must touch it
in exactly **7 places**. The line numbers below are accurate as of the current
codebase; use text search if they have drifted.

### Registration Point 1: `OSConcept` type union (line 61)

Add your concept's slug to the union type.

```typescript
// Line 61 — BEFORE:
type OSConcept = "cpu-scheduling" | "page-replacement" | "deadlock" | "memory" | "mem-alloc" | "thread-sync";

// AFTER:
type OSConcept = "cpu-scheduling" | "page-replacement" | "deadlock" | "memory" | "mem-alloc" | "thread-sync" | "disk-sched";
```

### Registration Point 2: `CONCEPTS` array (line 69)

Add an entry to the array so your concept appears in the sidebar.

```typescript
// Line 69-100 — append before the closing `];`
  {
    id: "disk-sched",
    name: "Disk Scheduling",
    description: "SSTF, SCAN, C-SCAN, LOOK disk scheduling algorithms.",
  },
```

### Registration Point 3: Algorithm type + config array (lines 102-134)

If your concept has multiple algorithms the user can switch between, add a
type alias and a config array. Follow the existing patterns:

```typescript
// After line 134:
type DiskAlgo = "sstf" | "scan" | "cscan" | "look";

const DISK_ALGOS: { id: DiskAlgo; name: string }[] = [
  { id: "sstf", name: "SSTF" },
  { id: "scan", name: "SCAN" },
  { id: "cscan", name: "C-SCAN" },
  { id: "look", name: "LOOK" },
];
```

If your concept only has one algorithm, you can skip the type/array and
hard-code the algorithm name in the run callback.

### Registration Point 4: State variables in `useOSModule` (lines 1981-2058)

Add `useState` declarations for:
- The selected algorithm (if multiple)
- Concept-specific input state (e.g., request queue, initial head position)
- The simulation result

```typescript
// Inside useOSModule(), after the thread-sync state block (~line 2055):

// ── Disk Scheduling state ─────────────────────────────────
const [diskAlgo, setDiskAlgo] = useState<DiskAlgo>("sstf");
const [diskRequests, setDiskRequests] = useState("98,183,37,122,14,124,65,67");
const [diskInitialHead, setDiskInitialHead] = useState(53);
const [diskResult, setDiskResult] = useState<DiskSchedResult | null>(null);
```

### Registration Point 5: Run callback (lines 2060-2340)

Add a `useCallback` that calls your engine function and stores the result.

```typescript
// After the last existing run callback (~line 2340):

const runDiskScheduling = useCallback(() => {
  const requests = diskRequests.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  const result = sstf(requests, diskInitialHead);
  setDiskResult(result);
}, [diskRequests, diskInitialHead, diskAlgo]);
```

### Registration Point 6: Canvas branch (lines 2364-3717)

The canvas is selected via an `if / else if` chain on `active`. Add a new
`else if` branch for your concept. This is where you build the main
visualization area with controls, inputs, and result rendering.

```typescript
// After the last `} else if (active === "thread-sync") { ... }` block (~line 3512):
  } else if (active === "disk-sched") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Algorithm
            </label>
            <select
              value={diskAlgo}
              onChange={(e) => setDiskAlgo(e.target.value as DiskAlgo)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {DISK_ALGOS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={runDiskScheduling}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        </div>

        {/* Input fields */}
        <div className="mb-4 space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Cylinder Requests (comma-separated)
            </label>
            <input
              className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none"
              value={diskRequests}
              onChange={(e) => setDiskRequests(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Initial Head Position
            </label>
            <input
              type="number"
              className="h-8 w-24 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none"
              value={diskInitialHead}
              onChange={(e) => setDiskInitialHead(+e.target.value)}
            />
          </div>
        </div>

        {/* Result visualization */}
        {diskResult ? (
          <div className="flex-1">
            {/* Render your visualization here */}
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {diskResult.algorithm} -- Total Seek: {diskResult.totalSeekDistance}
            </h3>
            {/* Add concept-specific visualization components */}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-foreground-muted">
              Configure requests and press Run to simulate disk scheduling.
            </p>
          </div>
        )}
      </div>
    );
  }
```

### Registration Point 7a: Properties panel section (lines 1414-1973)

The `OSProperties` component (starts at line 1373) renders concept-specific
metrics in the right sidebar. You need to:

1. Add your result to the component's props interface (~line 1389).
2. Add a rendering block inside the component body.

```typescript
// 1. Add prop (after syncPrimitive in the props type, ~line 1404):
  diskResult: DiskSchedResult | null;

// 2. Add rendering block (before the closing </div> of the panel body, ~line 1973):
        {active === "disk-sched" && diskResult && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-foreground">
              {diskResult.algorithm}
            </h4>
            <div className="space-y-2">
              <div className="rounded-md border border-border bg-elevated p-2">
                <span className="text-[10px] text-foreground-subtle">Total Seek Distance</span>
                <span className="block font-mono text-sm font-semibold text-foreground">
                  {diskResult.totalSeekDistance}
                </span>
              </div>
              <div className="rounded-md border border-border bg-elevated p-2">
                <span className="text-[10px] text-foreground-subtle">Avg Seek Distance</span>
                <span className="block font-mono text-sm font-semibold text-foreground">
                  {diskResult.avgSeekDistance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {active === "disk-sched" && !diskResult && (
          <div className="text-center py-8">
            <Cpu className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Run simulation to see metrics.
            </p>
          </div>
        )}
```

Also pass the new prop from `useOSModule` to `<OSProperties>` (at ~line 3722).

### Registration Point 7b: Event log rendering (lines 3777-3923)

The bottom panel renders events in a ternary chain. Add your branch before
the final fallback `(` block.

```typescript
// Before the final `) : (` fallback (~line 3919):
            ) : active === "disk-sched" && diskResult ? (
              diskResult.events.map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    t={e.tick}
                  </span>
                  <span className="w-16 shrink-0 text-blue-400">
                    seek={e.seekDistance}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))
```

---

## 6. Step 4 -- Write Tests

### 6.1 Location

Create `src/lib/os/__tests__/{concept-name}.test.ts`.

### 6.2 Test pattern

Use Vitest. Follow this structure:

```typescript
import { describe, it, expect } from 'vitest';
import { sstf } from '../disk-scheduling';
import type { DiskSchedResult } from '../disk-scheduling';

// ── Fixtures ────────────────────────────────────────────────

const REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];
const INITIAL_HEAD = 53;

// ── Tests ───────────────────────────────────────────────────

describe('disk-scheduling -- sstf', () => {
  it('services all requests', () => {
    const result = sstf(REQUESTS, INITIAL_HEAD);
    expect(result.events.length).toBe(REQUESTS.length);
  });

  it('computes total seek distance correctly', () => {
    const result = sstf(REQUESTS, INITIAL_HEAD);
    const sumFromEvents = result.events.reduce(
      (sum, e) => sum + e.seekDistance, 0,
    );
    expect(result.totalSeekDistance).toBe(sumFromEvents);
  });

  it('computes average seek distance', () => {
    const result = sstf(REQUESTS, INITIAL_HEAD);
    expect(result.avgSeekDistance).toBeCloseTo(
      result.totalSeekDistance / REQUESTS.length,
    );
  });

  it('produces a description for each event', () => {
    const result = sstf(REQUESTS, INITIAL_HEAD);
    for (const e of result.events) {
      expect(e.description).toBeTruthy();
      expect(e.description.length).toBeGreaterThan(0);
    }
  });

  // ── Edge cases ───────────────────────────────────────────

  it('handles empty request list', () => {
    const result = sstf([], 53);
    expect(result.events.length).toBe(0);
    expect(result.totalSeekDistance).toBe(0);
  });

  it('handles single request', () => {
    const result = sstf([100], 53);
    expect(result.events.length).toBe(1);
    expect(result.totalSeekDistance).toBe(47);
  });

  it('handles request at current head position (zero seek)', () => {
    const result = sstf([53], 53);
    expect(result.events.length).toBe(1);
    expect(result.totalSeekDistance).toBe(0);
  });

  it('does not mutate the input array', () => {
    const original = [...REQUESTS];
    sstf(REQUESTS, INITIAL_HEAD);
    expect(REQUESTS).toEqual(original);
  });
});
```

### 6.3 What to test

| Category | Examples |
|---|---|
| **Correctness** | All requests serviced, total metric matches sum of events |
| **Edge cases** | Empty input, single item, duplicate values, max values |
| **Immutability** | Input arrays not mutated |
| **Descriptions** | Every event has a non-empty description |
| **Algorithm-specific invariants** | SSTF always picks the closest request next |

---

## 7. Quality Checklist

Check every item before opening your PR. Every unchecked item *will* be
caught in review.

- [ ] **Engine file created** at `src/lib/os/{concept-name}.ts` with JSDoc
      header comment explaining the module.
- [ ] **Types exported** -- all interfaces/types used by the UI are exported
      and named clearly (e.g., `DiskSchedEvent`, not `Event`).
- [ ] **Pure functions** -- simulation functions have no side effects, do not
      mutate inputs, and are deterministic for the same inputs.
- [ ] **Event descriptions explain *why*** -- not "P1 runs" but
      "P1 selected because it has the shortest seek distance (14)".
- [ ] **Barrel export added** in `src/lib/os/index.ts` -- both types and
      functions.
- [ ] **All 7 registration points wired** in `OSModule.tsx`:
      1. `OSConcept` type union (line 61)
      2. `CONCEPTS` array (line 69)
      3. Algorithm type + config array (lines 102-134)
      4. State variables in `useOSModule` (lines 1981-2058)
      5. Run callback (lines 2060-2340)
      6. Canvas `else if` branch (lines 2364-3717)
      7. Properties panel + Event log rendering (lines 1414-1973, 3777-3923)
- [ ] **TypeScript compiles** -- run `pnpm tsc --noEmit` with zero errors.
- [ ] **Tests exist** at `src/lib/os/__tests__/{concept-name}.test.ts` with
      correctness, edge-case, and immutability tests.
- [ ] **Tests pass** -- run `pnpm vitest run src/lib/os/__tests__/{concept-name}`.
- [ ] **No `any` types** anywhere in your engine or UI code.
- [ ] **CSS classes use existing design tokens** -- use `bg-background`,
      `text-foreground-muted`, `border-border`, `bg-elevated`, etc. Do not
      invent new color values; follow the patterns in existing canvas branches.
- [ ] **Empty state handled** -- the canvas shows a helpful message when no
      simulation has been run yet (see the `flex flex-1 items-center
      justify-center` pattern used by every other concept).
