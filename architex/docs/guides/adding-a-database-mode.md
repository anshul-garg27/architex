# How to Add a New Database Mode

This guide walks through every step required to add a new visualization mode (e.g., MVCC, WAL, Buffer Pool) to the Database Design Lab module. A "mode" is a sub-section within the Database module that provides its own engine class, canvas visualization, sidebar controls, and properties panel.

The Database module lives entirely in one monolith file (`src/components/modules/DatabaseModule.tsx`, ~4305 lines) plus engine classes in `src/lib/database/`. This guide ensures you touch every integration point.

## Prerequisites

- Familiarity with React hooks (`useState`, `useRef`, `useCallback`, `useMemo`, `memo`).
- Understanding of the step-trace pattern: operations produce `Step[]` arrays for animated playback.
- The codebase checked out and `pnpm install` completed.
- Read through at least one existing engine class (`src/lib/database/btree-viz.ts` is the simplest at 251 lines).

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/lib/database/{name}-viz.ts` | **Create:** Engine class with step-producing operations |
| 2 | `src/lib/database/__tests__/{name}-viz.test.ts` | **Create:** Unit tests for the engine |
| 3 | `src/lib/database/index.ts` | **Modify:** Add barrel exports (line 56+) |
| 4 | `src/components/modules/DatabaseModule.tsx` | **Modify:** 7 integration points (see below) |

---

## Step 1: Create the engine file

Create `src/lib/database/{name}-viz.ts`. This file contains the pure-logic engine class that the UI drives.

### Engine class template

Use this annotated template, modeled after `BTreeViz` (`src/lib/database/btree-viz.ts`), `HashIndexViz` (`src/lib/database/hash-index-viz.ts`), and `LSMTreeViz` (`src/lib/database/lsm-viz.ts`):

```ts
/**
 * Database Design Lab -- {Name} Visualization (DBL-XXX)
 *
 * Interactive {name} with step-by-step {operations}.
 * Records each stage as a {Name}Step for animated playback.
 */

// -- Types --------------------------------------------------------

/** The snapshot of the engine's full state at a point in time. */
export interface {Name}State {
  // Add fields representing the data structure's current state.
  // MUST be serializable (no class instances, no functions).
  // Example for a WAL: entries: WalEntry[], flushedLSN: number
}

/** A single step in an operation trace. Drives the canvas animation. */
export interface {Name}Step {
  /** Human-readable explanation of what happened and WHY.
   *  Not just "Inserted key X" but "Inserted key X into bucket 3
   *  because hash(X) mod 4 = 3". The 'why' is the educational value. */
  description: string;

  /** Deep-cloned snapshot of state at this point in the operation. */
  state: {Name}State;

  /** Which operation produced this step (used for color-coding in UI). */
  operation: "insert" | "search" | "delete"; // customize per mode

  /** Optional: highlight a specific element in the canvas. */
  highlightId?: string;
}

// -- Deep-clone helpers -------------------------------------------

/** Deep-clone the state. EVERY snapshot in a Step must be independent. */
function cloneState(state: {Name}State): {Name}State {
  return {
    // Deep-copy every field. Use spread for arrays, structuredClone
    // for nested objects, or manual cloning like the existing engines.
    // DO NOT use JSON.parse(JSON.stringify()) -- it drops undefined values.
  };
}

// -- Constants ----------------------------------------------------

const DEFAULT_CAPACITY = 4;

// -- {Name}Viz ----------------------------------------------------

export class {Name}Viz {
  // Private mutable state -- this IS the data structure.
  private someField: string[];
  private capacity: number;

  /**
   * @param capacity - Optional capacity override (default: 4).
   * Constructor initializes the data structure to its empty state.
   */
  constructor(capacity?: number) {
    this.capacity = capacity ?? DEFAULT_CAPACITY;
    this.someField = [];
  }

  // -- Public API (each returns Step[]) ---------------------------

  /**
   * Perform an operation and return the step-by-step trace.
   *
   * PATTERN: Every public method that represents a user action:
   * 1. Creates a local `steps: Step[]` array.
   * 2. Mutates internal state.
   * 3. After each logical sub-step, pushes a Step with:
   *    - A descriptive string explaining WHAT happened and WHY
   *    - A deep-cloned snapshot via cloneState()
   *    - The operation type (for UI color-coding)
   *    - Optional highlight info
   * 4. Returns the steps array.
   */
  insert(key: string): {Name}Step[] {
    const steps: {Name}Step[] = [];

    // Step 1: Explain what we're about to do
    this.someField.push(key);
    steps.push({
      description: `Inserted "${key}" -- explain WHY this position was chosen`,
      state: this.snapshot(),
      operation: "insert",
    });

    // Step 2: If a side-effect triggers (e.g., resize, flush, split),
    // add additional steps for each sub-operation.

    return steps;
  }

  search(key: string): {Name}Step[] {
    const steps: {Name}Step[] = [];
    // ... search logic with steps ...
    return steps;
  }

  /**
   * Return a deep-cloned snapshot of current state.
   * Used by the UI to initialize the canvas before any operation.
   */
  getState(): {Name}State {
    return this.snapshot();
  }

  /**
   * Reset to empty state (preserving configuration like capacity).
   * Called when the user clicks "Reset" in the sidebar.
   */
  reset(): void {
    this.someField = [];
  }

  // -- Private helpers --------------------------------------------

  private snapshot(): {Name}State {
    return cloneState({
      // ... current state fields ...
    });
  }
}
```

### Key rules for the engine class

1. **Every operation returns `Step[]`** -- this is the contract with the UI. The UI stores steps in state and steps through them for playback.

2. **Every step includes a deep-cloned snapshot** -- the canvas renders whatever state is in `steps[stepIndex].state`. If you share references, mutations will corrupt the playback.

3. **Step descriptions explain WHY, not just WHAT** -- Compare:
   - Bad: `"Inserted key 42"`
   - Good: `"Inserted key 42 into leaf [10, 30, 42] -- this leaf is the correct location because 42 falls between the parent's key boundaries, and position 2 keeps the keys in sorted order"`

4. **No UI imports** -- The engine is pure logic. No React, no DOM, no CSS.

5. **The class is mutable** -- Unlike Redux reducers, engine classes use mutable internal state. The `useRef` in the hook holds the instance, and `useState` triggers re-renders.

---

## Step 2: Create the test file

Create `src/lib/database/__tests__/{name}-viz.test.ts`. Follow the pattern from `src/lib/database/__tests__/schema-converter.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { {Name}Viz } from "../{name}-viz";

describe("{Name}Viz", () => {
  it("starts with empty state", () => {
    const viz = new {Name}Viz();
    const state = viz.getState();
    // Assert initial state is empty/default
    expect(state.someField).toEqual([]);
  });

  it("insert produces steps with correct operation type", () => {
    const viz = new {Name}Viz();
    const steps = viz.insert("key1");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].operation).toBe("insert");
    expect(steps[0].description).toContain("key1");
  });

  it("search returns steps even when key is not found", () => {
    const viz = new {Name}Viz();
    const steps = viz.search("missing");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].description).toContain("not found");
  });

  it("reset clears state but preserves config", () => {
    const viz = new {Name}Viz(8);
    viz.insert("a");
    viz.insert("b");
    viz.reset();
    const state = viz.getState();
    expect(state.someField).toEqual([]);
  });

  it("each step contains an independent state snapshot", () => {
    const viz = new {Name}Viz();
    const steps1 = viz.insert("a");
    const steps2 = viz.insert("b");
    // Ensure step1's snapshot was not mutated by step2
    expect(steps1[steps1.length - 1].state).not.toEqual(
      steps2[steps2.length - 1].state,
    );
  });

  it("handles edge case: duplicate keys", () => {
    const viz = new {Name}Viz();
    viz.insert("x");
    const steps = viz.insert("x");
    // Assert your engine's behavior for duplicates
    expect(steps.length).toBeGreaterThan(0);
  });
});
```

Run tests with:
```bash
pnpm vitest run src/lib/database/__tests__/{name}-viz.test.ts
```

---

## Step 3: Add barrel exports

**File:** `src/lib/database/index.ts`

Add your exports after the last existing export block (currently ends at line 68):

```ts
// -- {Name} Visualization ----------------------------------------
export { {Name}Viz } from "./{name}-viz";
export type { {Name}State, {Name}Step } from "./{name}-viz";
```

Current end of file for reference (`src/lib/database/index.ts`, lines 66-68):
```ts
// -- Sample ER Diagrams ------------------------------------------
export { SAMPLE_ER_DIAGRAMS } from "./sample-er-diagrams";
export type { SampleERDiagram } from "./sample-er-diagrams";
```

---

## Step 4: Integrate into DatabaseModule.tsx

This is the largest step. You need to modify **7 places** within `src/components/modules/DatabaseModule.tsx`. The line numbers below are from the current codebase (4305 lines total).

### 4a. Import your types and class

**Location:** Lines 37-64 (import block)

Add your types to the type import:
```ts
import type {
  // ... existing types ...
  {Name}State,        // <-- add
  {Name}Step,         // <-- add
} from "@/lib/database";
```

Add your class to the value import:
```ts
import {
  // ... existing classes ...
  {Name}Viz,          // <-- add
} from "@/lib/database";
```

### 4b. Add to the DatabaseMode type union

**Location:** Line 75-82

Add your mode identifier to the `DatabaseMode` union type:

```ts
type DatabaseMode =
  | "er-diagram"
  | "normalization"
  | "transaction-isolation"
  | "btree-index"
  | "hash-index"
  | "query-plans"
  | "lsm-tree"
  | "{your-mode}";        // <-- add here
```

### 4c. Add to the MODES array

**Location:** Lines 90-126

Add a new entry to the `MODES` array:

```ts
const MODES: ModeDef[] = [
  // ... existing 7 modes ...
  {
    id: "{your-mode}",
    name: "{Your Mode Display Name}",
    description: "One-line description shown in the sidebar.",
  },
];
```

### 4d. Add state and handlers to useDatabaseModule hook

**Location:** Lines 3403-4300 (the `useDatabaseModule` function)

Follow the pattern used by B-Tree (lines 3722-3825), Hash Index (lines 3827-3927), or LSM-Tree (lines 3947-4052). You need:

1. **Engine ref** -- holds the mutable class instance:
   ```ts
   const {name}Ref = useRef(new {Name}Viz());
   ```

2. **State** -- drives re-renders when the engine mutates:
   ```ts
   const [{name}State, set{Name}State] = useState<{Name}State>(
     {name}Ref.current.getState(),
   );
   const [{name}Steps, set{Name}Steps] = useState<{Name}Step[]>([]);
   const [{name}StepIndex, set{Name}StepIndex] = useState(0);
   ```

3. **Input state** -- for sidebar form fields:
   ```ts
   const [{name}KeyInput, set{Name}KeyInput] = useState("");
   ```

4. **Playback state** -- for step-through animation:
   ```ts
   const [is{Name}Playing, setIs{Name}Playing] = useState(false);
   const {name}TimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
   ```

5. **Timer cleanup**:
   ```ts
   useEffect(() => {
     return () => {
       if ({name}TimerRef.current) clearInterval({name}TimerRef.current);
     };
   }, []);
   ```

6. **Operation handlers** -- each calls the engine, stores steps, syncs state:
   ```ts
   const handle{Name}Insert = useCallback(() => {
     if (!{name}KeyInput.trim()) {
       log("Error: enter a key");
       return;
     }
     const steps = {name}Ref.current.insert({name}KeyInput.trim());
     set{Name}Steps(steps);
     set{Name}StepIndex(0);
     set{Name}State({name}Ref.current.getState());
     set{Name}KeyInput("");
     log(`Inserted "${name}KeyInput.trim()" (${steps.length} step(s))`);
   }, [{name}KeyInput, log]);
   ```

7. **Playback handlers** (step forward, play, pause, reset) -- copy from B-Tree pattern (lines 3786-3825).

8. **Add timer cleanup to `handleSelectMode`** (around line 4064):
   ```ts
   if ({name}TimerRef.current) {
     clearInterval({name}TimerRef.current);
     {name}TimerRef.current = null;
   }
   setIs{Name}Playing(false);
   ```

### 4e. Add sidebar controls to DatabaseSidebar

**Location:** Lines 1852-2537 (the `DatabaseSidebar` component)

1. **Add your control props** to the component's props interface (around line 1928+). Follow the pattern of the Hash Index props block (lines 1959-1977).

2. **Add a conditional controls section** inside the sidebar JSX, after the last mode's controls block. Current last is LSM-Tree controls ending at line 2390:

   ```tsx
   {activeMode === "{your-mode}" && (
     <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
       {/* Input fields */}
       <div>
         <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
           Insert Key
         </span>
         <div className="flex gap-1">
           <input
             value={{name}KeyInput}
             onChange={(e) => on{Name}KeyInputChange(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && on{Name}Insert()}
             className="flex-1 rounded border border-border bg-elevated px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
             placeholder="key"
           />
           <button
             onClick={on{Name}Insert}
             className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
           >
             <Plus className="h-3 w-3" />
           </button>
         </div>
       </div>
     </div>
   )}
   ```

3. **Add step controls** at the bottom of the sidebar (after the LSM-Tree step controls, around line 2534). Copy the pattern from the B-Tree step controls block (lines 2422-2458).

### 4f. Add canvas rendering to the canvas switch

**Location:** Lines 4094-4167 (the `canvas = useMemo(() => { switch ... })` block)

Add a new case before the `default`:

```tsx
case "{your-mode}": {
  const current{Name}Step = {name}Steps[{name}StepIndex] as {Name}Step | undefined;
  return (
    <{Name}Canvas
      state={current{Name}Step?.state ?? {name}State}
      steps={{name}Steps}
      stepIndex={{name}StepIndex}
    />
  );
}
```

You also need to create the `{Name}Canvas` component. Place it above the `DatabaseSidebar` component (around line 1850). Follow the `BTreeCanvas` (lines 908-995), `HashIndexCanvas` (lines 1013-1289), or `LSMCanvas` (lines 1530-1850) patterns.

The canvas component receives state/steps/stepIndex and renders:
1. A step description bar at the top (operation badge + description text + step counter).
2. An SVG visualization of the data structure.

### 4g. Add details to DatabaseProperties

**Location:** Lines 2539-3254 (the `DatabaseProperties` component)

1. **Add your props** to the component's props interface (around line 2576+).

2. **Add a conditional properties section** before the final `return null` at line 3253:

   ```tsx
   if (activeMode === "{your-mode}") {
     const currentStep = {name}Steps[{name}StepIndex] as {Name}Step | undefined;
     return (
       <div className="flex h-full flex-col">
         <div className="border-b border-sidebar-border px-3 py-3">
           <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
             {Name} Details
           </h2>
         </div>
         <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
           {/* State summary card */}
           <div className="rounded-lg border border-border bg-elevated p-3">
             {/* Show current state metrics */}
           </div>
           {/* Current step details */}
           {currentStep && (
             <div className="space-y-2">
               <p className="text-xs text-foreground-muted">
                 {currentStep.description}
               </p>
             </div>
           )}
           {/* Quick reference section */}
           <div className="border-t border-sidebar-border pt-3">
             <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
               How It Works
             </span>
             <div className="space-y-1.5 text-[11px] text-foreground-subtle">
               <p><strong className="text-foreground-muted">Operation:</strong> Explain...</p>
             </div>
           </div>
         </div>
       </div>
     );
   }
   ```

### 4h. Wire props through the return statement

**Location:** Lines 4192-4299 (the `return { sidebar, canvas, properties, bottomPanel }` block)

Pass your new state and handlers as props to `DatabaseSidebar` and `DatabaseProperties`. Follow how the existing modes pass their props (e.g., Hash Index at lines 4224-4241, LSM-Tree at lines 4245-4261).

---

## Quality checklist

Before submitting your PR, verify all of the following:

- [ ] 1. **Engine class is pure** -- No React imports, no DOM access, no side effects beyond internal mutation.
- [ ] 2. **Every operation returns `Step[]`** -- Even operations that do nothing (e.g., "nothing to compact") return at least one step explaining why.
- [ ] 3. **Every step snapshot is deep-cloned** -- Mutating the engine after producing steps must not affect earlier snapshots.
- [ ] 4. **Step descriptions explain WHY** -- Each description answers "why did this happen?" not just "what happened?". Compare with BTreeViz descriptions (lines 112-131 of `btree-viz.ts`).
- [ ] 5. **`getState()` returns a deep clone** -- Not a reference to internal state.
- [ ] 6. **`reset()` preserves configuration** -- Capacity, order, or other constructor parameters survive a reset.
- [ ] 7. **Tests cover: normal operation, edge cases (empty, duplicate, overflow), step count > 0, snapshot independence**.
- [ ] 8. **`pnpm vitest run` passes** -- All existing + new tests green.
- [ ] 9. **`pnpm typecheck` passes** -- No TypeScript errors introduced (if this script exists).
- [ ] 10. **Mode appears in sidebar** -- Clicking it switches the canvas, sidebar controls, and properties panel.
- [ ] 11. **Step playback works** -- Step forward, Play (auto-advance), Pause, and Reset all function correctly.
- [ ] 12. **Bottom panel log updates** -- Every operation logs a message to the bottom panel log tab.
- [ ] 13. **Timer cleanup** -- All `setInterval` timers are cleared on unmount and on mode switch (added to `handleSelectMode`).
- [ ] 14. **Canvas renders SVG** -- The visualization uses SVG (consistent with all existing modes), not HTML/CSS layouts.
- [ ] 15. **Themed colors** -- Use Tailwind design tokens (`text-foreground-muted`, `bg-elevated`, `border-border`, `text-primary`) not hardcoded hex values. Exception: SVG fills/strokes may use hex from the existing color scheme (`#0f172a`, `#1e293b`, `#3b82f6`, etc.).

---

## Common mistakes and how to avoid them

### 1. Forgetting to add the mode to `handleSelectMode` timer cleanup

**Symptom:** Playback timer from your mode keeps running after switching to another mode, causing ghost state updates.

**Fix:** Add cleanup for your timer ref inside `handleSelectMode` (around line 4064). Search for `hashTimerRef.current` to see the pattern.

### 2. Sharing references instead of cloning in Step snapshots

**Symptom:** Stepping backward shows corrupted state because later operations mutated shared arrays/objects.

**Fix:** Write a dedicated `cloneState()` function and call it in every `steps.push()`. Test for snapshot independence (see test template above).

### 3. Not adding the mode to the `canvas` useMemo dependency array

**Symptom:** Canvas does not re-render when your mode's state changes.

**Fix:** Add your state variables to the dependency array of the `canvas = useMemo(...)` call (lines 4168-4190).

### 4. Forgetting to pass props through to DatabaseSidebar / DatabaseProperties

**Symptom:** TypeScript errors, or controls appear but do nothing.

**Fix:** The return statement at lines 4192-4299 must pass every piece of state and every handler as a prop. Search for how `hashSteps` is passed to see the full threading path: hook state -> return block -> Sidebar/Properties props.

### 5. Adding `import` inside the module file instead of re-exporting via the barrel

**Symptom:** Direct imports from engine files create an inconsistent import graph.

**Fix:** Always import from `@/lib/database` (the barrel), never from `@/lib/database/{name}-viz` directly in the module file.

### 6. Using `useState` for the engine instance

**Symptom:** React creates a new engine instance on every render, or you cannot mutate the engine imperatively.

**Fix:** Use `useRef` for the engine class instance. Use `useState` only for the serializable snapshots that drive rendering. The pattern is:
```ts
const engineRef = useRef(new EngineViz());    // mutable, stable
const [state, setState] = useState(engineRef.current.getState()); // triggers re-render
```

### 7. Not resetting step state when the user performs a new operation

**Symptom:** User inserts key A, steps through to step 3/5, then inserts key B -- the step counter still shows step 3 of the old operation.

**Fix:** Every operation handler must reset: `setSteps(newSteps); setStepIndex(0);`

### 8. Missing `memo()` on canvas components

**Symptom:** Performance degradation as the entire canvas re-renders on every sidebar interaction.

**Fix:** Wrap every sub-component (Canvas, Sidebar controls section) in `React.memo()`. Follow the pattern: `const {Name}Canvas = memo(function {Name}Canvas({...}) { ... })`.

---

## Reference: existing modes and their engine files

| Mode | Engine File | Engine Class | Step Type | Lines |
|------|------------|--------------|-----------|-------|
| ER Diagram | (inline in DatabaseModule.tsx) | N/A | N/A | -- |
| Normalization | `src/lib/database/normalization.ts` | (functions) | N/A | 311 |
| Transaction Isolation | `src/lib/database/transaction-sim.ts` | (functions) | `TransactionStep` | 382 |
| B-Tree Index | `src/lib/database/btree-viz.ts` | `BTreeViz` | `BTreeStep` | 251 |
| Hash Index | `src/lib/database/hash-index-viz.ts` | `HashIndexViz` | `HashIndexStep` | 354 |
| Query Plans | `src/lib/database/query-plan.ts` | (function) | `QueryPlanNode` | 207 |
| LSM-Tree | `src/lib/database/lsm-viz.ts` | `LSMTreeViz` | `LSMVizStep` | 383 |

The B-Tree engine (`btree-viz.ts`) is the simplest class-based example. Start there if this is your first mode.
