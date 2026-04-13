# How to Add a New Algorithm

This guide covers adding a new algorithm visualization to the Algorithms module. Architex supports seven algorithm categories: sorting, graph, tree, dp (dynamic programming), string, backtracking, and geometry. Each algorithm produces step-by-step animation data that the corresponding visualizer renders.

## Prerequisites

- Familiarity with the `AlgorithmResult` / `AnimationStep` types.
- An understanding of how the `AlgorithmPanel` and visualizer components consume step data.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/lib/algorithms/<category>/your-algo.ts` | Step generator function |
| 2 | `src/lib/algorithms/<category>/index.ts` | Register in catalog + barrel export |
| 3 | `src/lib/algorithms/index.ts` | Re-export from top-level barrel |
| 4 | `src/components/modules/AlgorithmModule.tsx` | Wire into visualizer selector |
| 5 | `src/lib/algorithms/<category>/__tests__/` | Tests |

---

## Step 1: Create the step generator function

Every algorithm is a pure function that takes input data and returns an `AlgorithmResult`. The result contains metadata (`config`) and an array of `AnimationStep` objects that the visualizer plays back frame by frame.

### Core types

These are defined in `src/lib/algorithms/types.ts`:

```ts
export interface AlgorithmResult {
  config: AlgorithmConfig;
  steps: AnimationStep[];
  finalState: number[];          // for sorting; other categories may differ
}

export interface AlgorithmConfig {
  id: string;
  name: string;
  category: 'sorting' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry';
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  stable?: boolean;
  inPlace?: boolean;
  description: string;
  pseudocode: string[];
}

export interface AnimationStep {
  id: number;
  description: string;
  pseudocodeLine: number;        // 0-indexed line in pseudocode array
  mutations: VisualMutation[];
  complexity: {
    comparisons: number;
    swaps: number;
    reads: number;
    writes: number;
  };
  duration: number;              // milliseconds for this step
}

export interface VisualMutation {
  targetId: string;              // e.g. "element-0", "element-5"
  property: 'fill' | 'position' | 'opacity' | 'label' | 'highlight' | 'scale';
  from: string | number;
  to: string | number;
  easing: 'spring' | 'ease-out' | 'linear';
}
```

### Example: Sorting algorithm

Here is a condensed example modeled on `src/lib/algorithms/sorting/bubble-sort.ts`:

```ts
// src/lib/algorithms/sorting/your-sort.ts

import type { AlgorithmConfig, AlgorithmResult, AnimationStep, VisualMutation } from '../types';

export const YOUR_SORT_CONFIG: AlgorithmConfig = {
  id: 'your-sort',
  name: 'Your Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: true,
  inPlace: true,
  description: 'A brief description of how the algorithm works.',
  pseudocode: [
    'procedure yourSort(A: list)',
    '  n = length(A)',
    '  for i = 0 to n-1 do',
    '    // ... algorithm logic ...',
    '  return A',
  ],
};

export function yourSort(input: number[]): AlgorithmResult {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;

  // Helper to record a step
  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
  ) {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps, reads: 0, writes: 0 },
      duration: 300,
    });
  }

  // --- Algorithm logic ---
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    // Comparison
    comparisons++;
    addStep(
      `Comparing element ${i} with its neighbor`,
      3,   // pseudocode line index
      [
        {
          targetId: `element-${i}`,
          property: 'fill',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
    );

    // ... more steps for swaps, etc.
  }

  // Final step: mark all as sorted
  addStep(
    'Array is sorted',
    4,
    arr.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'fill',
      from: 'default',
      to: 'sorted',
      easing: 'ease-out',
    })),
  );

  return {
    config: YOUR_SORT_CONFIG,
    steps,
    finalState: arr,
  };
}
```

### VisualMutation conventions

- `targetId` for sorting algorithms uses the format `element-{index}`.
- `property: 'fill'` drives the element's visual state. Use `ElementState` values as the `to` field: `'default'`, `'comparing'`, `'swapping'`, `'sorted'`, `'pivot'`, `'active'`, `'found'`.
- Graph algorithms use `node-{id}` and `edge-{source}-{target}` for target IDs.
- Tree algorithms use `tree-node-{id}`.
- The `pseudocodeLine` value highlights the corresponding line in the code panel.

---

## Step 2: Register in the category catalog

Open the category's barrel export file (e.g., `src/lib/algorithms/sorting/index.ts`) and make two additions:

### 2a. Export the function

```ts
export { yourSort } from './your-sort';
```

### 2b. Add to the catalog array

Add an `AlgorithmConfig` entry to the `SORTING_ALGORITHMS` (or `GRAPH_ALGORITHMS`, `DP_ALGORITHMS`, etc.) array:

```ts
export const SORTING_ALGORITHMS: AlgorithmConfig[] = [
  // ... existing entries ...
  {
    id: 'your-sort',
    name: 'Your Sort',
    category: 'sorting',
    timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    description: 'A brief description.',
    pseudocode: [
      'procedure yourSort(A: list)',
      '  n = length(A)',
      '  for i = 0 to n-1 do',
      '    // ...',
      '  return A',
    ],
  },
];
```

Alternatively, you can reference the config object you exported from the algorithm file to avoid duplication:

```ts
import { YOUR_SORT_CONFIG } from './your-sort';

export const SORTING_ALGORITHMS: AlgorithmConfig[] = [
  // ... existing entries ...
  YOUR_SORT_CONFIG,
];
```

Each category has its own catalog array:

| Category | Catalog Array | File |
|----------|--------------|------|
| Sorting | `SORTING_ALGORITHMS` | `src/lib/algorithms/sorting/index.ts` |
| Graph | `GRAPH_ALGORITHMS` | `src/lib/algorithms/graph/index.ts` |
| Tree | `TREE_ALGORITHMS` | `src/lib/algorithms/tree/index.ts` |
| DP | `DP_ALGORITHMS` | `src/lib/algorithms/dp/index.ts` |
| String | `STRING_ALGORITHMS` | `src/lib/algorithms/string/index.ts` |
| Backtracking | `BACKTRACKING_ALGORITHMS` | `src/lib/algorithms/backtracking/index.ts` |
| Geometry | `GEOMETRY_ALGORITHMS` | `src/lib/algorithms/geometry/index.ts` |

---

## Step 3: Re-export from the top-level barrel

Open `src/lib/algorithms/index.ts` and add the re-export:

```ts
export { yourSort } from './sorting';
```

If you created a new config constant, export that too:

```ts
export { YOUR_SORT_CONFIG } from './sorting';
```

---

## Step 3b: Register the runner

**This step is critical for sorting algorithms.** Adding your algorithm to the catalog (Step 2) makes it appear in the dropdown, but the panel also needs a mapping from the algorithm ID to the actual runner function. Without this mapping, clicking "Run" does nothing -- a silent failure with no error in the console.

Open `src/components/canvas/panels/AlgorithmPanel.tsx` and find the `SORTING_RUNNERS` map (around line 135). Add your algorithm's runner function:

```ts
import { yourSort } from '@/lib/algorithms';

const SORTING_RUNNERS: Record<string, (arr: number[]) => AlgorithmResult> = {
  'bubble-sort': bubbleSort,
  'selection-sort': selectionSort,
  // ... existing entries ...
  'your-sort': yourSort,
};
```

For non-sorting categories, the equivalent registration happens in the `handleRun` callback within the same file. Find the appropriate category branch and add your function there.

> **Common mistake:** If your algorithm shows up in the sidebar but nothing happens when you click Run, you almost certainly skipped this step.

---

## Step 4: Wire into the AlgorithmModule selector

Open `src/components/modules/AlgorithmModule.tsx`. The module already imports all algorithm catalogs:

```ts
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
} from "@/lib/algorithms";
```

The `AlgorithmPanel` sidebar lists algorithms from these catalogs. When a user selects an algorithm, the module calls the corresponding function to generate steps and feeds them to the appropriate visualizer.

If your algorithm is in an existing category (sorting, graph, etc.), it will automatically appear in the sidebar list because the panel iterates over the catalog arrays.

If you are adding a new algorithm that requires a **custom execution path** (e.g., it takes different input parameters), you need to add a case in the `handleRunAlgorithm` callback. Look for the pattern:

```ts
// Inside AlgorithmModule.tsx
switch (selectedAlgo.category) {
  case 'sorting':
    // calls the sorting function with currentArray
    break;
  case 'graph':
    // calls the graph function with currentGraph
    break;
  // ... etc.
}
```

For sorting algorithms, the convention is a function mapping by ID. The module dynamically selects the right function:

```ts
import { yourSort } from "@/lib/algorithms";

// In the execution switch/map:
const SORT_FN_MAP: Record<string, (arr: number[]) => AlgorithmResult> = {
  // ... existing entries ...
  'your-sort': yourSort,
};
```

---

## Step 5: Write tests

Add tests in the category's `__tests__` directory. Follow the existing pattern in `src/lib/algorithms/sorting/__tests__/sorting-comprehensive.test.ts`:

```ts
// src/lib/algorithms/sorting/__tests__/your-sort.test.ts

import { describe, it, expect } from 'vitest';
import { yourSort } from '../your-sort';

describe('yourSort', () => {
  it('sorts an empty array', () => {
    const result = yourSort([]);
    expect(result.finalState).toEqual([]);
  });

  it('sorts a single element', () => {
    const result = yourSort([42]);
    expect(result.finalState).toEqual([42]);
  });

  it('sorts an already sorted array', () => {
    const result = yourSort([1, 2, 3, 4, 5]);
    expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts a reverse-sorted array', () => {
    const result = yourSort([5, 4, 3, 2, 1]);
    expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts an array with duplicates', () => {
    const result = yourSort([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]);
    expect(result.finalState).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 6, 9]);
  });

  it('generates non-empty steps', () => {
    const result = yourSort([5, 3, 1, 4, 2]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns the correct algorithm config', () => {
    const result = yourSort([1, 2, 3]);
    expect(result.config.id).toBe('your-sort');
    expect(result.config.category).toBe('sorting');
  });

  it('handles a large array (100 elements)', () => {
    const large = Array.from({ length: 100 }, (_, i) => 100 - i);
    const result = yourSort(large);
    const expected = [...large].sort((a, b) => a - b);
    expect(result.finalState).toEqual(expected);
  });
});
```

Run tests with:

```bash
pnpm test -- --run src/lib/algorithms/sorting/__tests__/your-sort.test.ts
```

Or the full sorting test suite:

```bash
pnpm test -- --run src/lib/algorithms/sorting/__tests__/
```

---

## Verification checklist

1. `pnpm typecheck` passes.
2. `pnpm test:run` passes including your new tests.
3. The algorithm appears in the AlgorithmModule sidebar under its category.
4. Selecting it and clicking "Run" generates animation steps.
5. The visualizer plays through the steps with correct highlighting.
6. The pseudocode panel highlights the correct line for each step.
7. Complexity counters (comparisons, swaps) increment correctly.

---

## Category-specific notes

### Graph algorithms

- Input is a `Graph` object (see `src/lib/algorithms/graph/types.ts`).
- Provide a sample graph in `src/lib/algorithms/graph/sample-graphs.ts`.
- Use `GraphVisualizer` for rendering.

### Tree algorithms

- Input is a `TreeNode` (see `src/lib/algorithms/tree/types.ts`).
- Provide a sample tree in `src/lib/algorithms/tree/sample-trees.ts`.
- Use `TreeVisualizer` for rendering.

### DP algorithms

- Return a `DPAlgorithmResult` (extends `AlgorithmResult` with a `DPTable`).
- The `DPVisualizer` renders the 2D table with cell highlighting.

### String algorithms

- Return match positions and a failure/Z-function array.
- The `StringMatchVisualizer` renders text with pattern overlay.

### Backtracking algorithms

- Return a grid/board state for each step.
- The `GridVisualizer` renders the board.

### Geometry algorithms

- Input is a `Point2D[]` array.
- The `GeometryVisualizer` renders points, lines, and convex hulls.

---

## Content Quality

Algorithm descriptions and step annotations are user-facing -- they should be clear, concise, and educational. Before submitting, review these guides:

- **[Algorithm Content Style Guide](./algorithm-content-style.md)** -- standards for writing descriptions, step annotations, and pseudocode comments. Covers tone, tense, and common phrasing mistakes.
- **[World-Class Algorithm Content](./world-class-algorithm-content.md)** -- A-grade examples showing what excellent algorithm content looks like. Use these as your reference when writing descriptions and step-by-step explanations.

---

## Checklist Before Submitting

- [ ] Engine file created with AlgorithmConfig + step recording
- [ ] Config added to category barrel export (e.g., sorting/index.ts)
- [ ] Re-exported from main barrel (algorithms/index.ts)
- [ ] Runner registered in AlgorithmPanel.tsx SORTING_RUNNERS (or handleRun for non-sorting)
- [ ] Test file created with edge cases (empty, single, sorted, reverse)
- [ ] Step descriptions explain WHY, not just WHAT (see content style guide)
- [ ] Complexity values verified against CLRS or authoritative source
- [ ] targetId format follows convention: "element-{index}" for sorting
- [ ] All tests pass: pnpm test:run
- [ ] Type check passes: pnpm typecheck
