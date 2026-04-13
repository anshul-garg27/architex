import { describe, it, expect } from 'vitest';

import {
  createVectorClockSystem,
  vectorClockLocalEvent,
  vectorClockSend,
  vectorClockReceive,
  vectorClockHappensBefore,
  vectorClockConcurrent,
} from '@/lib/data-structures/vector-clock-ds';
import type { VectorClockState, VectorClock } from '@/lib/data-structures/vector-clock-ds';

import {
  createTreap,
  treapInsert,
  treapSearch,
  treapDelete,
  treapSplit,
  treapMerge,
  treapToArray,
} from '@/lib/data-structures/treap-ds';
import type { TreapState } from '@/lib/data-structures/treap-ds';

import {
  createBinomialHeap,
  binomialInsert,
  binomialFindMin,
  binomialExtractMin,
  binomialMerge,
  binomialDecreaseKey,
  flattenBinomialHeap,
} from '@/lib/data-structures/binomial-heap-ds';
import type { BinomialHeapState } from '@/lib/data-structures/binomial-heap-ds';

// ====================================================================
// Vector Clock Tests
// ====================================================================

describe('Vector Clock', () => {
  it('creates system with all clocks at zero', () => {
    const sys = createVectorClockSystem(['A', 'B', 'C']);
    expect(sys.nodeIds).toEqual(['A', 'B', 'C']);
    expect(sys.clocks['A']).toEqual({ A: 0, B: 0, C: 0 });
    expect(sys.clocks['B']).toEqual({ A: 0, B: 0, C: 0 });
    expect(sys.clocks['C']).toEqual({ A: 0, B: 0, C: 0 });
    expect(sys.events).toHaveLength(0);
    expect(sys.messages).toHaveLength(0);
  });

  it('local event increments own clock entry', () => {
    let sys = createVectorClockSystem(['A', 'B']);
    const result = vectorClockLocalEvent(sys, 'A');
    sys = result.snapshot as VectorClockState;

    expect(sys.clocks['A']['A']).toBe(1);
    expect(sys.clocks['A']['B']).toBe(0);
    expect(sys.events).toHaveLength(1);
    expect(sys.events[0].type).toBe('local');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('local event on invalid node reports error', () => {
    const sys = createVectorClockSystem(['A', 'B']);
    const result = vectorClockLocalEvent(sys, 'X');
    expect(result.steps.some((s) => s.description.includes('not found'))).toBe(true);
  });

  it('send increments sender clock and creates message', () => {
    let sys = createVectorClockSystem(['A', 'B']);
    const result = vectorClockSend(sys, 'A', 'B');
    sys = result.snapshot as VectorClockState;

    expect(sys.clocks['A']['A']).toBe(1);
    expect(sys.messages).toHaveLength(1);
    expect(sys.messages[0].from).toBe('A');
    expect(sys.messages[0].to).toBe('B');
    expect(sys.events).toHaveLength(1);
    expect(sys.events[0].type).toBe('send');
  });

  it('receive merges clocks (element-wise max) and increments own', () => {
    let sys = createVectorClockSystem(['A', 'B', 'C']);

    // A does local events then sends to B
    sys = vectorClockLocalEvent(sys, 'A').snapshot as VectorClockState;
    sys = vectorClockLocalEvent(sys, 'A').snapshot as VectorClockState;
    const sendResult = vectorClockSend(sys, 'A', 'B');
    sys = sendResult.snapshot as VectorClockState;

    // Sender A clock should be [3, 0, 0]
    expect(sys.clocks['A']['A']).toBe(3);

    // B receives the message with A's clock
    const incomingClock = sys.messages[0].clock;
    const recvResult = vectorClockReceive(sys, 'B', incomingClock);
    sys = recvResult.snapshot as VectorClockState;

    // B should have merged: max(0, 3)=3 for A, then B incremented to 1
    expect(sys.clocks['B']['A']).toBe(3);
    expect(sys.clocks['B']['B']).toBe(1);
    expect(sys.clocks['B']['C']).toBe(0);
  });

  it('happensBefore detects causal ordering', () => {
    const a: VectorClock = { A: 1, B: 0, C: 0 };
    const b: VectorClock = { A: 2, B: 1, C: 0 };

    expect(vectorClockHappensBefore(a, b)).toBe(true);
    expect(vectorClockHappensBefore(b, a)).toBe(false);
  });

  it('happensBefore returns false for equal clocks', () => {
    const a: VectorClock = { A: 1, B: 2 };
    const b: VectorClock = { A: 1, B: 2 };

    expect(vectorClockHappensBefore(a, b)).toBe(false);
  });

  it('concurrent detects causally unrelated events', () => {
    const a: VectorClock = { A: 2, B: 0 };
    const b: VectorClock = { A: 0, B: 3 };

    expect(vectorClockConcurrent(a, b)).toBe(true);
    expect(vectorClockHappensBefore(a, b)).toBe(false);
    expect(vectorClockHappensBefore(b, a)).toBe(false);
  });

  it('concurrent returns false for causally related events', () => {
    const a: VectorClock = { A: 1, B: 0 };
    const b: VectorClock = { A: 1, B: 1 };

    expect(vectorClockConcurrent(a, b)).toBe(false);
  });
});

// ====================================================================
// Treap Tests
// ====================================================================

describe('Treap', () => {
  function buildTreap(entries: [number, number][]): TreapState {
    let state = createTreap();
    for (const [key, priority] of entries) {
      state = treapInsert(state, key, priority).snapshot as TreapState;
    }
    return state;
  }

  it('creates empty treap', () => {
    const treap = createTreap();
    expect(treap.root).toBeNull();
    expect(treap.size).toBe(0);
  });

  it('inserts and maintains BST order on keys', () => {
    const treap = buildTreap([[5, 90], [3, 80], [7, 70], [1, 60], [4, 50]]);
    const sorted = treapToArray(treap.root);
    expect(sorted).toEqual([1, 3, 4, 5, 7]);
    expect(treap.size).toBe(5);
  });

  it('highest priority node is at root (max-heap property)', () => {
    const treap = buildTreap([[5, 50], [3, 90], [7, 70]]);
    // Key 3 has highest priority 90, should be at root
    expect(treap.root).not.toBeNull();
    expect(treap.root!.priority).toBe(90);
    expect(treap.root!.key).toBe(3);
  });

  it('insert produces steps showing rotations', () => {
    const result = treapInsert(createTreap(), 10, 50);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.some((s) => s.description.includes('Insert'))).toBe(true);
  });

  it('search finds existing key', () => {
    const treap = buildTreap([[5, 90], [3, 80], [7, 70]]);
    const result = treapSearch(treap, 3);

    expect(result.steps.some((s) => s.description.includes('FOUND'))).toBe(true);
  });

  it('search reports missing key', () => {
    const treap = buildTreap([[5, 90], [3, 80], [7, 70]]);
    const result = treapSearch(treap, 99);

    expect(result.steps.some((s) => s.description.includes('NOT FOUND'))).toBe(true);
  });

  it('delete removes a key', () => {
    const treap = buildTreap([[5, 90], [3, 80], [7, 70], [1, 60]]);
    const result = treapDelete(treap, 3);
    const st = result.snapshot as TreapState;

    expect(st.size).toBe(3);
    expect(treapToArray(st.root)).toEqual([1, 5, 7]);
  });

  it('delete non-existent key is safe', () => {
    const treap = buildTreap([[5, 90], [3, 80]]);
    const result = treapDelete(treap, 99);
    const st = result.snapshot as TreapState;

    expect(st.size).toBe(2);
    expect(result.steps.some((s) => s.description.includes('not found'))).toBe(true);
  });

  it('split divides treap into left and right', () => {
    const treap = buildTreap([[1, 90], [3, 80], [5, 70], [7, 60], [9, 50]]);
    const result = treapSplit(treap, 5);
    const { left, right } = result.snapshot as { left: TreapState; right: TreapState };

    expect(treapToArray(left.root)).toEqual([1, 3, 5]);
    expect(treapToArray(right.root)).toEqual([7, 9]);
  });

  it('merge combines two treaps', () => {
    const leftTreap = buildTreap([[1, 90], [3, 80], [5, 70]]);
    const rightTreap = buildTreap([[7, 60], [9, 50]]);
    const result = treapMerge(leftTreap, rightTreap);
    const st = result.snapshot as TreapState;

    expect(treapToArray(st.root)).toEqual([1, 3, 5, 7, 9]);
    expect(st.size).toBe(5);
  });

  it('merge with empty treap returns the other', () => {
    const treap = buildTreap([[5, 90], [3, 80]]);
    const empty = createTreap();

    const r1 = treapMerge(treap, empty);
    const s1 = r1.snapshot as TreapState;
    expect(treapToArray(s1.root)).toEqual([3, 5]);

    const r2 = treapMerge(empty, treap);
    const s2 = r2.snapshot as TreapState;
    expect(treapToArray(s2.root)).toEqual([3, 5]);
  });
});

// ====================================================================
// Binomial Heap Tests
// ====================================================================

describe('Binomial Heap', () => {
  function buildBinomialHeap(keys: number[]): BinomialHeapState {
    let heap = createBinomialHeap();
    for (const k of keys) {
      heap = binomialInsert(heap, k).snapshot as BinomialHeapState;
    }
    return heap;
  }

  it('creates empty binomial heap', () => {
    const heap = createBinomialHeap();
    expect(heap.roots).toHaveLength(0);
    expect(heap.size).toBe(0);
  });

  it('insert single element creates B0 tree', () => {
    const result = binomialInsert(createBinomialHeap(), 42);
    const heap = result.snapshot as BinomialHeapState;

    expect(heap.size).toBe(1);
    expect(heap.roots).toHaveLength(1);
    const root = heap.nodes.get(heap.roots[0])!;
    expect(root.key).toBe(42);
    expect(root.order).toBe(0);
  });

  it('inserting two elements links into B1', () => {
    let heap = createBinomialHeap();
    heap = binomialInsert(heap, 5).snapshot as BinomialHeapState;
    heap = binomialInsert(heap, 3).snapshot as BinomialHeapState;

    expect(heap.size).toBe(2);
    expect(heap.roots).toHaveLength(1);
    const root = heap.nodes.get(heap.roots[0])!;
    expect(root.order).toBe(1);
    expect(root.key).toBe(3); // min-heap: smaller key is root
  });

  it('inserting three elements gives B0 + B1', () => {
    const heap = buildBinomialHeap([5, 3, 7]);

    expect(heap.size).toBe(3);
    expect(heap.roots).toHaveLength(2);
    // Like binary 11 = B0 + B1
    const orders = heap.roots.map((id) => heap.nodes.get(id)!.order).sort();
    expect(orders).toEqual([0, 1]);
  });

  it('find min scans root list and returns minimum', () => {
    const heap = buildBinomialHeap([10, 5, 15, 3, 20]);
    const result = binomialFindMin(heap);

    expect(result.steps.some((s) => s.description.includes('Minimum key = 3'))).toBe(true);
  });

  it('find min on empty heap reports empty', () => {
    const heap = createBinomialHeap();
    const result = binomialFindMin(heap);
    expect(result.steps.some((s) => s.description.includes('empty'))).toBe(true);
  });

  it('extract min removes the minimum element', () => {
    const heap = buildBinomialHeap([10, 5, 15, 3, 20]);
    const result = binomialExtractMin(heap);
    const h = result.snapshot as BinomialHeapState;

    expect(h.size).toBe(4);
    // The extracted key was 3
    expect(result.steps.some((s) => s.description.includes('Extracted min = 3'))).toBe(true);

    // Now min should be 5
    const findResult = binomialFindMin(h);
    expect(findResult.steps.some((s) => s.description.includes('Minimum key = 5'))).toBe(true);
  });

  it('extract min from single-element heap leaves it empty', () => {
    let heap = createBinomialHeap();
    heap = binomialInsert(heap, 42).snapshot as BinomialHeapState;

    const result = binomialExtractMin(heap);
    const h = result.snapshot as BinomialHeapState;

    expect(h.size).toBe(0);
    expect(h.roots).toHaveLength(0);
  });

  it('merge combines two heaps correctly', () => {
    const h1 = buildBinomialHeap([10, 5]);
    const h2 = buildBinomialHeap([3, 7]);

    const result = binomialMerge(h1, h2);
    const merged = result.snapshot as BinomialHeapState;

    expect(merged.size).toBe(4);
  });

  it('decrease key updates key and bubbles up', () => {
    let heap = createBinomialHeap();
    heap = binomialInsert(heap, 10).snapshot as BinomialHeapState;
    heap = binomialInsert(heap, 5).snapshot as BinomialHeapState;

    // Find a non-root node to decrease
    const nonRootNodes = Array.from(heap.nodes.values()).filter(
      (n) => n.parent !== null,
    );

    if (nonRootNodes.length > 0) {
      const target = nonRootNodes[0];
      const result = binomialDecreaseKey(heap, target.id, 1);
      const h = result.snapshot as BinomialHeapState;

      // After decrease, the key should be updated
      expect(result.steps.some((s) => s.description.includes('Decrease key'))).toBe(true);
      // The decreased key should now be findable
      const findResult = binomialFindMin(h);
      expect(findResult.steps.some((s) => s.description.includes('Minimum key = 1'))).toBe(true);
    }
  });

  it('decrease key rejects increasing the key', () => {
    let heap = createBinomialHeap();
    heap = binomialInsert(heap, 5).snapshot as BinomialHeapState;

    const nodeId = heap.roots[0];
    const result = binomialDecreaseKey(heap, nodeId, 100);
    expect(result.steps.some((s) => s.description.includes('invalid'))).toBe(true);
  });

  it('flatten produces correct visualization data', () => {
    const heap = buildBinomialHeap([10, 5, 15, 3]);
    const flat = flattenBinomialHeap(heap);

    expect(flat.length).toBe(4);
    const roots = flat.filter((n) => n.isRoot);
    expect(roots.length).toBeGreaterThan(0);
  });
});
