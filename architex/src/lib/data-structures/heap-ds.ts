// -----------------------------------------------------------------
// Architex -- Min/Max Heap Data Structure  (DST-020)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// Python's heapq module uses this exact same array-backed binary heap pattern

// ── Types ──────────────────────────────────────────────────

export type HeapType = 'min' | 'max';

export interface HeapState {
  data: number[];
  type: HeapType;
}

// WHY array-backed: A complete binary tree maps perfectly to a flat array using
// index arithmetic (parent = (i-1)/2, children = 2i+1, 2i+2). No pointers needed,
// excellent cache locality, and the array grows contiguously. This is why every
// major standard library (Python heapq, Java PriorityQueue, C++ priority_queue)
// uses arrays rather than pointer-based trees for heaps.
function parent(i: number): number {
  return Math.floor((i - 1) / 2);
}

function leftChild(i: number): number {
  return 2 * i + 1;
}

function rightChild(i: number): number {
  return 2 * i + 2;
}

function shouldSwap(type: HeapType, parentVal: number, childVal: number): boolean {
  return type === 'min' ? childVal < parentVal : childVal > parentVal;
}

export function createHeap(type: HeapType = 'min'): HeapState {
  return { data: [], type };
}

export function cloneHeap(heap: HeapState): HeapState {
  return { ...heap, data: [...heap.data] };
}

// ── Operations ─────────────────────────────────────────────

export function heapInsert(heap: HeapState, value: number): DSResult<HeapState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneHeap(heap);

  h.data.push(value);
  let idx = h.data.length - 1;

  // AUTOBIOGRAPHY: 'I just arrived! They put me at the very end of the array — the only open seat in this
  // complete binary tree. But I might not belong here. Time to bubble up: I compare myself with my parent,
  // and if I am smaller (in a min-heap), we swap. I keep climbing until I find my rightful place.'
  steps.push(
    step(`Insert ${value} at index ${idx} (end of array). Heaps always insert at the end to maintain the complete binary tree shape — then we fix the heap property by bubbling up.`, [
      { targetId: `heap-${idx}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // Bubble up
  while (idx > 0) {
    const p = parent(idx);
    steps.push(
      step(`Compare ${h.data[idx]} with parent ${h.data[p]}. In a ${h.type}-heap, every parent must be ${h.type === 'min' ? 'smaller' : 'larger'} than its children. If the child violates this, they swap (bubble up).`, [
        { targetId: `heap-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
        { targetId: `heap-${p}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (shouldSwap(h.type, h.data[p], h.data[idx])) {
      steps.push(
        step(`Swap heap[${idx}] = ${h.data[idx]} with heap[${p}] = ${h.data[p]}`, [
          { targetId: `heap-${idx}`, property: 'highlight', from: 'comparing', to: 'shifting' },
          { targetId: `heap-${p}`, property: 'highlight', from: 'comparing', to: 'shifting' },
        ]),
      );
      [h.data[idx], h.data[p]] = [h.data[p], h.data[idx]];
      idx = p;
    } else {
      steps.push(
        step(`Heap property satisfied -- stop`, [
          { targetId: `heap-${idx}`, property: 'highlight', from: 'comparing', to: 'done' },
        ]),
      );
      break;
    }
  }

  if (idx === 0) {
    steps.push(
      step(`${value} bubbled up to root. Size: ${h.data.length}`, [
        { targetId: 'heap-0', property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  return { steps, snapshot: h };
}

export function heapExtract(heap: HeapState): DSResult<HeapState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneHeap(heap);

  if (h.data.length === 0) {
    steps.push(step('Heap is empty -- nothing to extract', []));
    return { steps, snapshot: h };
  }

  const extracted = h.data[0];
  // AUTOBIOGRAPHY: 'I am the root — the smallest value in the entire heap. They are pulling me out because
  // I am the highest priority. My replacement will be the last element, awkwardly placed at the top, and they
  // will have to bubble it down until the heap property is restored. My departure costs O(log n).'
  steps.push(
    step(`Extract ${h.type} = ${extracted} (root). The root always holds the ${h.type === 'min' ? 'smallest' : 'largest'} element — that is the heap's core guarantee, giving O(1) access to the extremum.`, [
      { targetId: 'heap-0', property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  if (h.data.length === 1) {
    h.data.pop();
    steps.push(step(`Heap is now empty`, []));
    return { steps, snapshot: h };
  }

  // Move last element to root
  // AUTOBIOGRAPHY: 'I was the last element, minding my own business at the bottom. Now they have thrown me
  // to the top — the root! I am probably too big (or too small) for this position. I must bubble down,
  // swapping with my smaller child at each level, until I find where I truly belong.'
  const last = h.data.pop()!;
  h.data[0] = last;
  steps.push(
    step(`Move last element ${last} to root. We swap in the last element to keep the tree complete, then bubble it down to restore the heap property — O(log n) swaps at most.`, [
      { targetId: 'heap-0', property: 'highlight', from: 'deleting', to: 'shifting' },
    ]),
  );

  // Bubble down
  let idx = 0;
  const n = h.data.length;

  while (true) {
    const l = leftChild(idx);
    const r = rightChild(idx);
    let target = idx;

    if (l < n) {
      steps.push(
        step(`Compare heap[${idx}] = ${h.data[idx]} with left child heap[${l}] = ${h.data[l]}`, [
          { targetId: `heap-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: `heap-${l}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      if (shouldSwap(h.type, h.data[target], h.data[l])) {
        target = l;
      }
    }

    if (r < n) {
      steps.push(
        step(`Compare heap[${target}] = ${h.data[target]} with right child heap[${r}] = ${h.data[r]}`, [
          { targetId: `heap-${target}`, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: `heap-${r}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      if (shouldSwap(h.type, h.data[target], h.data[r])) {
        target = r;
      }
    }

    if (target === idx) {
      steps.push(
        step(`Heap property restored at index ${idx}`, [
          { targetId: `heap-${idx}`, property: 'highlight', from: 'default', to: 'done' },
        ]),
      );
      break;
    }

    steps.push(
      step(`Swap heap[${idx}] = ${h.data[idx]} with heap[${target}] = ${h.data[target]}`, [
        { targetId: `heap-${idx}`, property: 'highlight', from: 'comparing', to: 'shifting' },
        { targetId: `heap-${target}`, property: 'highlight', from: 'comparing', to: 'shifting' },
      ]),
    );
    [h.data[idx], h.data[target]] = [h.data[target], h.data[idx]];
    idx = target;
  }

  steps.push(
    step(`Extracted ${extracted}. Size: ${h.data.length}`, []),
  );

  return { steps, snapshot: h };
}

// WHY bottom-up build is O(n), not O(n log n): The key insight is that most nodes are
// near the bottom. Half the nodes are leaves (0 swaps), a quarter need at most 1 swap,
// an eighth need at most 2, etc. The sum 0*(n/2) + 1*(n/4) + 2*(n/8) + ... converges
// to O(n), not O(n log n). This is Floyd's algorithm — the same used by Python's heapq.heapify().
export function heapBuild(values: number[], type: HeapType = 'min'): DSResult<HeapState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h: HeapState = { data: [...values], type };

  // AUTOBIOGRAPHY: 'I am being built from scratch using Floyd's algorithm. Instead of inserting elements one by one
  // (which would cost O(n log n)), I start from the bottom and work my way up. Half my nodes are leaves — they are
  // already valid heaps! I only need to fix the upper half, and most of those need just one or two swaps. That is
  // why I am O(n), not O(n log n) — a subtle but beautiful optimization.'
  steps.push(
    step(`Build ${type}-heap from [${values.join(', ')}] using bottom-up heapify. Building bottom-up is O(n) — much faster than inserting one-by-one O(n log n) — because most nodes are near the leaves and need few swaps.`, []),
  );

  const n = h.data.length;

  // Start from last non-leaf node (all leaves are already valid heaps)
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    steps.push(
      step(`Heapify at index ${i} (value ${h.data[i]})`, [
        { targetId: `heap-${i}`, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    // Sift down from index i
    let idx = i;
    while (true) {
      const l = leftChild(idx);
      const r = rightChild(idx);
      let target = idx;

      if (l < n && shouldSwap(type, h.data[target], h.data[l])) {
        target = l;
      }
      if (r < n && shouldSwap(type, h.data[target], h.data[r])) {
        target = r;
      }

      if (target === idx) break;

      steps.push(
        step(`Swap heap[${idx}] = ${h.data[idx]} with heap[${target}] = ${h.data[target]}`, [
          { targetId: `heap-${idx}`, property: 'highlight', from: 'default', to: 'shifting' },
          { targetId: `heap-${target}`, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
      [h.data[idx], h.data[target]] = [h.data[target], h.data[idx]];
      idx = target;
    }
  }

  steps.push(
    step(`${type}-heap built: [${h.data.join(', ')}]`, [
      { targetId: 'heap-0', property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: h };
}

export function heapSearch(heap: HeapState, value: number): DSResult<HeapState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneHeap(heap);

  if (h.data.length === 0) {
    steps.push(step('Heap is empty -- nothing to search', []));
    return { steps, snapshot: h };
  }

  // AUTOBIOGRAPHY: 'Search is my weakness. Unlike a BST, I cannot eliminate half the tree with each comparison.
  // My only guarantee is that my parent is smaller (or larger) than me — but my sibling could be anything.
  // So I must check every single element. O(n) linear scan. It is humbling.'
  steps.push(
    step(`Search for ${value} in ${h.type}-heap (linear scan, ${h.data.length} elements). Heaps only guarantee parent-child ordering, not left-right — so we cannot prune subtrees and must check every element: O(n).`, []),
  );

  for (let i = 0; i < h.data.length; i++) {
    const isMatch = h.data[i] === value;
    steps.push(
      step(
        `Check heap[${i}] = ${h.data[i]}${isMatch ? ' -- FOUND' : ''}`,
        [
          {
            targetId: `heap-${i}`,
            property: 'highlight',
            from: 'default',
            to: isMatch ? 'found' : 'comparing',
          },
        ],
      ),
    );
    if (isMatch) {
      steps.push(
        step(`Found ${value} at index ${i}`, [
          { targetId: `heap-${i}`, property: 'highlight', from: 'default', to: 'done' },
        ]),
      );
      return { steps, snapshot: h };
    }
  }

  steps.push(step(`Value ${value} not found in heap`, []));
  return { steps, snapshot: h };
}
