# How to Add a New Data Structure

This guide covers adding a new interactive data structure to the Data Structures module. Architex supports six DS categories: linear, tree, hash, heap, probabilistic, and system. Each data structure has an engine file that produces step-by-step operation data, and the monolith component (`DataStructuresModule.tsx`) renders the visualization.

Adding a data structure requires changes in **9 locations** across 2--3 files. This guide walks through each one.

## Prerequisites

- Familiarity with the `DSResult`, `DSStep`, `DSConfig`, and `DSMutation` types in `src/lib/data-structures/types.ts`.
- Understanding of the data structure you are implementing (operations, complexities, edge cases).
- Read `src/lib/data-structures/heap-ds.ts` end to end -- it is the gold standard engine implementation.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/lib/data-structures/your-ds.ts` | Engine: operations + step generation |
| 2 | `src/lib/data-structures/index.ts` | Barrel exports + `DS_CATALOG` entry |
| 3--9 | `src/components/modules/DataStructuresModule.tsx` | 7 registration locations (see below) |
| 10 | `src/lib/data-structures/__tests__/your-ds.test.ts` | Tests |

---

## Step 1: Create the engine file

Every data structure engine is a pure module that exports state types, a `create` factory, a `clone` function, and operation functions. Each operation returns a `DSResult` containing step-by-step animation data and the final state snapshot.

### Core types

These are defined in `src/lib/data-structures/types.ts`:

```ts
export interface DSStep {
  id: number;
  description: string;
  mutations: DSMutation[];
}

export interface DSMutation {
  targetId: string;
  property: string;
  from: string | number | boolean;
  to: string | number | boolean;
}

export interface DSResult {
  steps: DSStep[];
  snapshot: unknown;
}

export interface DSConfig {
  id: string;
  name: string;
  category: DSCategory;        // 'linear' | 'tree' | 'hash' | 'heap' | 'probabilistic' | 'system'
  operations: string[];
  complexity: Record<string, string>;
  description: string;
}
```

### Template engine file

Model your file after `src/lib/data-structures/heap-ds.ts`. Here is a condensed template:

```ts
// src/lib/data-structures/your-ds.ts
// -----------------------------------------------------------------
// Architex -- Your Data Structure  (DST-XXX)
// -----------------------------------------------------------------

import type { DSStep, DSResult, DSMutation } from './types';

// -- Types --------------------------------------------------------

export interface YourDSState {
  data: number[];
  // ... fields specific to your DS
}

// -- Step recorder ------------------------------------------------

let _stepId = 0;

function step(desc: string, mutations: DSMutation[]): DSStep {
  return { id: _stepId++, description: desc, mutations };
}

function resetStepId(): void {
  _stepId = 0;
}

// -- Factory + Clone ----------------------------------------------

export function createYourDS(): YourDSState {
  return { data: [] };
}

export function cloneYourDS(ds: YourDSState): YourDSState {
  return { ...ds, data: [...ds.data] };
}

// -- Operations ---------------------------------------------------

export function yourDSInsert(ds: YourDSState, value: number): DSResult {
  resetStepId();
  const steps: DSStep[] = [];
  const state = cloneYourDS(ds);

  // Record WHY this step matters, not just what happens
  steps.push(
    step(`Insert ${value} -- start by placing at end of backing array`, [
      { targetId: `your-ds-${state.data.length}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  state.data.push(value);

  // ... internal algorithm logic with more steps ...

  steps.push(
    step(`Insert complete. Size: ${state.data.length}`, []),
  );

  return { steps, snapshot: state };
}

export function yourDSSearch(ds: YourDSState, value: number): DSResult {
  resetStepId();
  const steps: DSStep[] = [];
  const state = cloneYourDS(ds);

  // ... search logic with steps ...

  return { steps, snapshot: state };
}

export function yourDSDelete(ds: YourDSState, value: number): DSResult {
  resetStepId();
  const steps: DSStep[] = [];
  const state = cloneYourDS(ds);

  if (state.data.length === 0) {
    steps.push(step('Structure is empty -- nothing to delete', []));
    return { steps, snapshot: state };
  }

  // ... delete logic with steps ...

  return { steps, snapshot: state };
}
```

### Key patterns from heap-ds.ts

1. **Clone first, mutate the clone.** Never mutate the input. `cloneYourDS(ds)` at the top of every operation.
2. **Reset step IDs** at the start of each operation with `resetStepId()`.
3. **Step descriptions explain WHY.** Bad: `"Swap elements"`. Good: `"Swap heap[3] = 8 with heap[1] = 5 because child is smaller than parent (min-heap property violated)"`.
4. **Handle empty state.** Every delete/extract/search must check for empty and return a descriptive step.
5. **Return snapshot.** The `snapshot` field holds the final state after the operation. The module casts it to your state type.

### DSMutation conventions

- `targetId` format: use a prefix matching your DS id, e.g., `your-ds-0`, `your-ds-1`.
- `property: 'highlight'` drives the visual state. Common values: `'default'`, `'comparing'`, `'shifting'`, `'inserting'`, `'deleting'`, `'done'`, `'found'`, `'visiting'`.
- Tree-based DS use `tree-node-{id}` for nodes and `tree-edge-{source}-{target}` for edges.

---

## Step 2: Register in index.ts

Open `src/lib/data-structures/index.ts` and make two additions.

### 2a. Export your types and functions

Add your exports in the barrel section (before the `DS_CATALOG` constant, which starts at line ~389):

```ts
export type { YourDSState } from './your-ds';
export {
  createYourDS,
  cloneYourDS,
  yourDSInsert,
  yourDSSearch,
  yourDSDelete,
} from './your-ds';
```

### 2b. Add a DS_CATALOG entry

Add a `DSConfig` object to the `DS_CATALOG` array (starts at line ~389):

```ts
{
  id: 'your-ds',
  name: 'Your Data Structure',
  category: 'tree',                  // or 'linear', 'hash', 'heap', 'probabilistic', 'system'
  operations: ['insert', 'delete', 'search'],
  complexity: {
    'Insert': 'O(log n)',
    'Search': 'O(log n)',
    'Delete': 'O(log n)',
    'Space': 'O(n)',
  },
  description:
    'One to two sentences explaining the data structure, its key property, and primary use case.',
},
```

The `id` must be unique and match the string you use everywhere else (ActiveDS union, switch cases, etc.).

---

## Steps 3--9: Update DataStructuresModule.tsx

The monolith module file `src/components/modules/DataStructuresModule.tsx` requires changes in **7 locations**. These are the most error-prone part -- missing any one causes a silent failure or runtime crash.

### Location 1: Import block (lines ~35--200)

Import your operation functions and state type:

```ts
// Add to the value import block (~line 34):
import {
  // ... existing imports ...
  createYourDS,
  yourDSInsert,
  yourDSSearch,
  yourDSDelete,
} from "@/lib/data-structures";

// Add to the type imports (~line 201+):
import type { YourDSState } from "@/lib/data-structures";
```

### Location 2: ActiveDS type union (lines ~235--269)

Add your DS id to the union type:

```ts
type ActiveDS =
  | "array"
  | "stack"
  // ... existing entries ...
  | "b-tree"
  | "your-ds";     // <-- add here
```

### Location 3: DSModuleState interface (lines ~271--345)

Add a state field for your DS:

```ts
interface DSModuleState {
  // ... existing fields ...
  bTree: BTreeState;
  // Your DS
  yourDS: YourDSState;     // <-- add here
  // Step playback
  steps: DSStep[];
  // ...
}
```

### Location 4: INITIAL_STATE (lines ~347--387)

Add the initial value using your `create` factory:

```ts
const INITIAL_STATE: DSModuleState = {
  // ... existing fields ...
  bTree: createBTree(3),
  yourDS: createYourDS(),     // <-- add here
  steps: [],
  currentStepIdx: -1,
  log: [],
};
```

### Location 5: DSProperties switch -- size computation (lines ~5035--5146)

Add a case to compute the current size of your DS:

```ts
switch (activeDS) {
  // ... existing cases ...
  case "b-tree":
    size = state.bTree.size;
    break;
  case "your-ds":                    // <-- add here
    size = state.yourDS.data.length;
    break;
}
```

### Location 6: handleOperation switch (lines ~5332--5910)

Add a case for each operation your DS supports:

```ts
switch (prev.activeDS) {
  // ... existing cases ...
  case "your-ds": {
    if (op === "insert") {
      result = yourDSInsert(prev.yourDS, isNaN(numVal) ? 0 : numVal);
      logMsg = `Insert ${numVal}`;
      updates = { yourDS: result.snapshot as YourDSState };
    } else if (op === "delete") {
      result = yourDSDelete(prev.yourDS, isNaN(numVal) ? 0 : numVal);
      logMsg = `Delete ${numVal}`;
      updates = { yourDS: result.snapshot as YourDSState };
    } else if (op === "search") {
      result = yourDSSearch(prev.yourDS, isNaN(numVal) ? 0 : numVal);
      logMsg = `Search ${numVal}`;
    }
    break;
  }
}
```

### Location 7: handleRandom switch (lines ~5926--6287)

Add a case that populates your DS with random data:

```ts
case "your-ds": {
  let ds = createYourDS();
  const vals = Array.from(
    { length: 5 + Math.floor(Math.random() * 4) },
    () => Math.floor(Math.random() * 99) + 1,
  );
  for (const v of vals) {
    const r = yourDSInsert(ds, v);
    ds = r.snapshot as YourDSState;
  }
  return { ...prev, yourDS: ds, steps: [], currentStepIdx: -1 };
}
```

### Location 8: handleReset (lines ~6290--6331)

Add your DS field to the reset object:

```ts
const handleReset = useCallback(() => {
  setState((prev) => ({
    ...prev,
    // ... existing fields ...
    bTree: createBTree(3),
    yourDS: createYourDS(),     // <-- add here
  }));
}, []);
```

### Location 9: Canvas component (after line ~4752)

Add a rendering branch in the `DSCanvas` component for your visualization:

```tsx
{activeDS === "your-ds" && (
  <YourDSCanvas
    state={state.yourDS}
    stepIdx={currentStepIdx}
    steps={steps}
  />
)}
```

You will need to either create a dedicated canvas component or use an existing one (e.g., `ArrayCanvas` for linear structures, inline tree rendering for tree structures). See existing canvas components earlier in the file for patterns.

---

## Step 10: Write tests

Add tests in `src/lib/data-structures/__tests__/`. Follow the pattern from `heap-ds.test.ts`:

```ts
// src/lib/data-structures/__tests__/your-ds.test.ts

import { describe, it, expect } from 'vitest';
import {
  createYourDS,
  yourDSInsert,
  yourDSSearch,
  yourDSDelete,
} from '../your-ds';
import type { YourDSState } from '../your-ds';

describe('YourDS', () => {
  it('creates an empty structure', () => {
    const ds = createYourDS();
    expect(ds.data).toEqual([]);
  });

  it('inserts a single element', () => {
    const result = yourDSInsert(createYourDS(), 42);
    const ds = result.snapshot as YourDSState;
    expect(ds.data).toContain(42);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('handles insert into empty structure', () => {
    const result = yourDSInsert(createYourDS(), 10);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('handles delete from empty structure', () => {
    const result = yourDSDelete(createYourDS(), 10);
    const ds = result.snapshot as YourDSState;
    expect(ds.data).toEqual([]);
    expect(result.steps[0].description).toContain('empty');
  });

  it('handles search in empty structure', () => {
    const result = yourDSSearch(createYourDS(), 10);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('preserves structure invariant after multiple operations', () => {
    let ds = createYourDS();
    const values = [5, 3, 8, 1, 10, 2, 7];
    for (const v of values) {
      const r = yourDSInsert(ds, v);
      ds = r.snapshot as YourDSState;
    }
    // Verify your DS-specific invariant holds
    expect(ds.data.length).toBe(values.length);
  });

  it('generates step descriptions that explain WHY', () => {
    const result = yourDSInsert(createYourDS(), 42);
    // Steps should contain explanatory text, not just "insert 42"
    const hasExplanation = result.steps.some(
      (s) => s.description.length > 20,
    );
    expect(hasExplanation).toBe(true);
  });
});
```

Run tests with:

```bash
pnpm test -- --run src/lib/data-structures/__tests__/your-ds.test.ts
```

---

## Verification checklist

1. `pnpm typecheck` passes.
2. `pnpm test:run` passes including your new tests.
3. The DS appears in the sidebar under its category.
4. Selecting it shows the correct canvas visualization.
5. All operations (insert, delete, search) produce animation steps.
6. Step forward/backward plays through steps correctly.
7. The "Random" button populates the DS with sample data.
8. The "Reset" button returns the DS to its empty/initial state.
9. The properties panel shows correct size and complexity info.

---

## Quality checklist

- [ ] Engine file created with state type, create, clone, and all operation functions
- [ ] Every operation clones state before mutating (`cloneYourDS(ds)`)
- [ ] Step IDs reset at the start of each operation (`resetStepId()`)
- [ ] Step descriptions explain **WHY**, not just **WHAT** (see content note below)
- [ ] Complexity values verified against CLRS or authoritative source
- [ ] Empty state handled in every delete/extract/search operation
- [ ] `targetId` format follows convention (`your-ds-{index}` or `tree-node-{id}`)
- [ ] Exports added to `index.ts` barrel
- [ ] `DS_CATALOG` entry has accurate operations, complexity, and description
- [ ] All 7 `DataStructuresModule.tsx` locations updated
- [ ] Canvas visualization renders correctly for all states (empty, small, large)
- [ ] Tests cover: empty, single element, multiple elements, edge cases
- [ ] All tests pass: `pnpm test:run`
- [ ] Type check passes: `pnpm typecheck`

### Content note

Step descriptions are user-facing educational content. They should help the learner understand the algorithm behind the data structure, not just narrate the code.

- **Bad:** `"Swap elements 3 and 5"`
- **Good:** `"Swap heap[3] = 8 with heap[1] = 5 because child is smaller than parent (min-heap property violated)"`
- **Bad:** `"Move to next node"`
- **Good:** `"Move to right child because 42 > 25 (BST property: larger values go right)"`

---

## Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgot to add case in `handleOperation` | Clicking Insert/Delete/Search does nothing | Add the switch case at line ~5332 |
| Forgot to add case in `handleRandom` | Random button does nothing for your DS | Add the switch case at line ~5926 |
| Forgot to add field in `handleReset` | Reset does not clear your DS | Add field to the reset object at line ~6290 |
| Forgot to add case in DSProperties switch | Size shows 0 for your DS | Add the switch case at line ~5035 |
| Forgot canvas rendering branch | Blank visualization area | Add conditional in DSCanvas at line ~4752 |
| Not handling empty state in engine | Crash on delete/search when DS is empty | Add empty check at top of every delete/search |
| Wrong `targetId` format | Step highlighting does not work | Match your canvas component's element IDs |
| Mutating input instead of clone | Previous state corrupted, undo broken | Always `cloneYourDS(ds)` first |
| Not resetting `_stepId` | Step IDs accumulate across operations | Call `resetStepId()` at start of each operation |
| Duplicate `DS_CATALOG` id | Wrong DS loads or crashes | Ensure `id` is unique across all catalog entries |

---

## Checklist before submitting

- [ ] Engine file created with DSResult return, step generation, clone pattern
- [ ] Exports + DS_CATALOG entry in `index.ts`
- [ ] All 7 DataStructuresModule.tsx locations updated (imports, ActiveDS, state, initial state, properties, operation, random, reset, canvas)
- [ ] Test file with edge cases (empty, single, multiple, invariant preservation)
- [ ] Step descriptions explain WHY, not just WHAT
- [ ] Complexity values verified against authoritative source
- [ ] `targetId` format follows convention
- [ ] All tests pass: `pnpm test:run`
- [ ] Type check passes: `pnpm typecheck`
