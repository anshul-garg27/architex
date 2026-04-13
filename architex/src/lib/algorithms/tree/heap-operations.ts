// -----------------------------------------------------------------
// Architex -- Heap Operations Visualization  (ALG-040)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const HEAP_CONFIG: AlgorithmConfig = {
  id: 'heap-operations',
  name: 'Heap Operations',
  category: 'tree',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Max-heap operations: insert (bubble up), extract-max (swap root with last, bubble down), and heapify (build heap from array). Shows both tree and array representations.',
  pseudocode: [
    'procedure insert(heap, value)',
    '  append value to end of heap',
    '  bubbleUp(heap, lastIndex)',
    'procedure bubbleUp(heap, i)',
    '  while i > 0 and heap[i] > heap[parent(i)]',
    '    swap heap[i] and heap[parent(i)]',
    '    i = parent(i)',
    'procedure extractMax(heap)',
    '  max = heap[0]',
    '  swap heap[0] with heap[last]',
    '  remove last element',
    '  bubbleDown(heap, 0)',
    '  return max',
    'procedure bubbleDown(heap, i)',
    '  largest = i',
    '  if left(i) exists and heap[left] > heap[largest]: largest = left',
    '  if right(i) exists and heap[right] > heap[largest]: largest = right',
    '  if largest != i: swap and recurse',
    'procedure heapify(array)',
    '  for i = n/2 - 1 down to 0:',
    '    bubbleDown(array, i)',
  ],
};

// ── Helpers ─────────────────────────────────────────────────

function mut(
  targetId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId, property, from, to, easing: 'spring' };
}

function parentIdx(i: number): number {
  return Math.floor((i - 1) / 2);
}

function leftIdx(i: number): number {
  return 2 * i + 1;
}

function rightIdx(i: number): number {
  return 2 * i + 2;
}

/**
 * Build a TreeNode tree from an array (for tree view).
 * The nodes get ids like "heap-0", "heap-1", etc. matching array index.
 */
export function arrayToTree(arr: number[]): TreeNode | null {
  if (arr.length === 0) return null;

  const nodes: TreeNode[] = arr.map((v, i) => ({
    id: `heap-${i}`,
    value: v,
    left: null,
    right: null,
  }));

  for (let i = 0; i < nodes.length; i++) {
    const l = leftIdx(i);
    const r = rightIdx(i);
    if (l < nodes.length) nodes[i].left = nodes[l];
    if (r < nodes.length) nodes[i].right = nodes[r];
  }

  return nodes[0];
}

// ── Heap Insert ─────────────────────────────────────────────

export function heapInsert(
  heapArr: number[],
  value: number,
): AlgorithmResult {
  const heap = [...heapArr];
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 400,
    });
  }

  // Append to end
  heap.push(value);
  writes++;
  const lastIdx = heap.length - 1;

  record(
    `Append ${value} at index ${lastIdx}`,
    1,
    [
      mut(`tnode-heap-${lastIdx}`, 'highlight', 'default', 'inserting'),
      mut(`arr-${lastIdx}`, 'highlight', 'default', 'inserting'),
    ],
  );

  // Bubble up
  let i = lastIdx;
  while (i > 0) {
    const p = parentIdx(i);
    reads += 2;
    comparisons++;

    record(
      `Compare heap[${i}]=${heap[i]} with parent heap[${p}]=${heap[p]}`,
      4,
      [
        mut(`tnode-heap-${i}`, 'highlight', 'default', 'current'),
        mut(`tnode-heap-${p}`, 'highlight', 'default', 'visiting'),
        mut(`arr-${i}`, 'highlight', 'default', 'current'),
        mut(`arr-${p}`, 'highlight', 'default', 'visiting'),
      ],
    );

    if (heap[i] > heap[p]) {
      // Swap
      [heap[i], heap[p]] = [heap[p], heap[i]];
      swaps++;
      writes += 2;

      record(
        `Swap heap[${i}]=${heap[p]} with heap[${p}]=${heap[i]} (bubble up)`,
        5,
        [
          mut(`tnode-heap-${i}`, 'highlight', 'current', 'visited'),
          mut(`tnode-heap-${p}`, 'highlight', 'visiting', 'inserting'),
          mut(`arr-${i}`, 'highlight', 'current', 'visited'),
          mut(`arr-${p}`, 'highlight', 'visiting', 'inserting'),
        ],
      );

      i = p;
    } else {
      record(
        `heap[${i}]=${heap[i]} <= parent heap[${p}]=${heap[p]} -- done`,
        4,
        [
          mut(`tnode-heap-${i}`, 'highlight', 'current', 'visited'),
          mut(`tnode-heap-${p}`, 'highlight', 'visiting', 'visited'),
          mut(`arr-${i}`, 'highlight', 'current', 'visited'),
          mut(`arr-${p}`, 'highlight', 'visiting', 'visited'),
        ],
      );
      break;
    }
  }

  record(`Insert complete. Heap: [${heap.join(', ')}]`, 6, []);

  return { config: HEAP_CONFIG, steps, finalState: heap };
}

// ── Heap Extract Max ────────────────────────────────────────

export function heapExtractMax(
  heapArr: number[],
): AlgorithmResult {
  const heap = [...heapArr];
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 400,
    });
  }

  if (heap.length === 0) {
    record('Heap is empty -- nothing to extract', 7, []);
    return { config: HEAP_CONFIG, steps, finalState: [] };
  }

  const max = heap[0];
  reads++;

  record(
    `Extract max = ${max} (root)`,
    8,
    [
      mut('tnode-heap-0', 'highlight', 'default', 'deleting'),
      mut('arr-0', 'highlight', 'default', 'deleting'),
    ],
  );

  // Swap root with last
  const lastIdx = heap.length - 1;
  [heap[0], heap[lastIdx]] = [heap[lastIdx], heap[0]];
  swaps++;
  writes += 2;

  record(
    `Swap root ${max} with last element ${heap[0]} (index ${lastIdx})`,
    9,
    [
      mut('tnode-heap-0', 'highlight', 'deleting', 'inserting'),
      mut(`tnode-heap-${lastIdx}`, 'highlight', 'default', 'deleting'),
      mut('arr-0', 'highlight', 'deleting', 'inserting'),
      mut(`arr-${lastIdx}`, 'highlight', 'default', 'deleting'),
    ],
  );

  // Remove last
  heap.pop();
  writes++;

  record(
    `Remove last element (${max})`,
    10,
    [
      mut(`tnode-heap-${lastIdx}`, 'opacity', 1, 0),
      mut(`arr-${lastIdx}`, 'opacity', 1, 0),
    ],
  );

  // Bubble down
  let i = 0;
  const n = heap.length;

  while (true) {
    let largest = i;
    const l = leftIdx(i);
    const r = rightIdx(i);

    reads++;
    if (l < n) {
      reads++;
      comparisons++;
      if (heap[l] > heap[largest]) largest = l;
    }
    if (r < n) {
      reads++;
      comparisons++;
      if (heap[r] > heap[largest]) largest = r;
    }

    const muts: VisualMutation[] = [
      mut(`tnode-heap-${i}`, 'highlight', 'default', 'current'),
      mut(`arr-${i}`, 'highlight', 'default', 'current'),
    ];
    if (l < n) {
      muts.push(mut(`tnode-heap-${l}`, 'highlight', 'default', 'visiting'));
      muts.push(mut(`arr-${l}`, 'highlight', 'default', 'visiting'));
    }
    if (r < n) {
      muts.push(mut(`tnode-heap-${r}`, 'highlight', 'default', 'visiting'));
      muts.push(mut(`arr-${r}`, 'highlight', 'default', 'visiting'));
    }

    record(
      `Bubble down: compare heap[${i}]=${heap[i]}${l < n ? `, left[${l}]=${heap[l]}` : ''}${r < n ? `, right[${r}]=${heap[r]}` : ''} -- largest at index ${largest}`,
      14,
      muts,
    );

    if (largest === i) {
      record(
        `heap[${i}]=${heap[i]} is largest -- bubble down complete`,
        17,
        [
          mut(`tnode-heap-${i}`, 'highlight', 'current', 'visited'),
          mut(`arr-${i}`, 'highlight', 'current', 'visited'),
        ],
      );
      break;
    }

    [heap[i], heap[largest]] = [heap[largest], heap[i]];
    swaps++;
    writes += 2;

    record(
      `Swap heap[${i}]=${heap[largest]} with heap[${largest}]=${heap[i]}`,
      17,
      [
        mut(`tnode-heap-${i}`, 'highlight', 'current', 'visited'),
        mut(`tnode-heap-${largest}`, 'highlight', 'visiting', 'inserting'),
        mut(`arr-${i}`, 'highlight', 'current', 'visited'),
        mut(`arr-${largest}`, 'highlight', 'visiting', 'inserting'),
      ],
    );

    i = largest;
  }

  record(`Extract complete. Max was ${max}. Heap: [${heap.join(', ')}]`, 12, []);

  return { config: HEAP_CONFIG, steps, finalState: heap };
}

// ── Heapify (Build Heap) ────────────────────────────────────

export function heapify(inputArr: number[]): AlgorithmResult {
  const heap = [...inputArr];
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 400,
    });
  }

  const n = heap.length;

  record(`Build max-heap from array [${heap.join(', ')}]`, 18, []);

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    record(
      `Heapify subtree rooted at index ${i} (value ${heap[i]})`,
      19,
      [
        mut(`tnode-heap-${i}`, 'highlight', 'default', 'current'),
        mut(`arr-${i}`, 'highlight', 'default', 'current'),
      ],
    );

    // Sift down
    let idx = i;
    while (true) {
      let largest = idx;
      const l = leftIdx(idx);
      const r = rightIdx(idx);

      reads++;
      if (l < n) {
        reads++;
        comparisons++;
        if (heap[l] > heap[largest]) largest = l;
      }
      if (r < n) {
        reads++;
        comparisons++;
        if (heap[r] > heap[largest]) largest = r;
      }

      if (largest === idx) {
        record(
          `heap[${idx}]=${heap[idx]} is already the largest in its subtree`,
          20,
          [
            mut(`tnode-heap-${idx}`, 'highlight', 'current', 'visited'),
            mut(`arr-${idx}`, 'highlight', 'current', 'visited'),
          ],
        );
        break;
      }

      [heap[idx], heap[largest]] = [heap[largest], heap[idx]];
      swaps++;
      writes += 2;

      record(
        `Swap heap[${idx}]=${heap[largest]} with heap[${largest}]=${heap[idx]}`,
        20,
        [
          mut(`tnode-heap-${idx}`, 'highlight', 'current', 'visited'),
          mut(`tnode-heap-${largest}`, 'highlight', 'default', 'inserting'),
          mut(`arr-${idx}`, 'highlight', 'current', 'visited'),
          mut(`arr-${largest}`, 'highlight', 'default', 'inserting'),
        ],
      );

      idx = largest;
    }
  }

  record(`Heapify complete. Max-heap: [${heap.join(', ')}]`, 20, []);

  return { config: HEAP_CONFIG, steps, finalState: heap };
}
