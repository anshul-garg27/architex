import { describe, it, expect } from 'vitest';
import {
  createHeap,
  heapInsert,
  heapExtract,
  heapBuild,
} from '../heap-ds';
import type { HeapState } from '../heap-ds';

// ── Helpers ──────────────────────────────────────────────────

/** Insert multiple values sequentially, returning the final heap state. */
function insertMany(values: number[], type: 'min' | 'max' = 'min'): HeapState {
  let heap = createHeap(type);
  for (const v of values) {
    const result = heapInsert(heap, v);
    heap = result.snapshot as HeapState;
  }
  return heap;
}

/** Checks that the min-heap property holds: parent <= children. */
function isValidMinHeap(data: number[]): boolean {
  for (let i = 0; i < data.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < data.length && data[i] > data[left]) return false;
    if (right < data.length && data[i] > data[right]) return false;
  }
  return true;
}

/** Checks that the max-heap property holds: parent >= children. */
function isValidMaxHeap(data: number[]): boolean {
  for (let i = 0; i < data.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < data.length && data[i] < data[left]) return false;
    if (right < data.length && data[i] < data[right]) return false;
  }
  return true;
}

// ── Min Heap ─────────────────────────────────────────────────

describe('Min Heap', () => {
  it('creates an empty heap', () => {
    const heap = createHeap('min');
    expect(heap.data).toEqual([]);
    expect(heap.type).toBe('min');
  });

  it('inserts a single element', () => {
    const result = heapInsert(createHeap('min'), 10);
    const heap = result.snapshot as HeapState;
    expect(heap.data).toEqual([10]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('maintains min-heap property after multiple inserts', () => {
    const heap = insertMany([5, 3, 8, 1, 10, 2, 7], 'min');
    expect(isValidMinHeap(heap.data)).toBe(true);
    expect(heap.data[0]).toBe(1); // min at root
  });

  it('extractMin returns the smallest value', () => {
    const heap = insertMany([5, 3, 8, 1, 10, 2], 'min');
    const result = heapExtract(heap);
    const after = result.snapshot as HeapState;
    // The root was 1, so after extraction the heap should not contain 1
    expect(after.data.length).toBe(5);
    expect(after.data).not.toContain(1);
    expect(isValidMinHeap(after.data)).toBe(true);
  });

  it('sequential extract produces sorted order', () => {
    let heap = insertMany([5, 3, 8, 1, 10, 2, 7], 'min');
    const extracted: number[] = [];
    while (heap.data.length > 0) {
      const minVal = heap.data[0];
      extracted.push(minVal);
      const result = heapExtract(heap);
      heap = result.snapshot as HeapState;
    }
    expect(extracted).toEqual([1, 2, 3, 5, 7, 8, 10]);
  });

  it('handles extracting from empty heap', () => {
    const result = heapExtract(createHeap('min'));
    const after = result.snapshot as HeapState;
    expect(after.data).toEqual([]);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0].description).toContain('empty');
  });

  it('handles extracting from single-element heap', () => {
    const heap = insertMany([42], 'min');
    const result = heapExtract(heap);
    const after = result.snapshot as HeapState;
    expect(after.data).toEqual([]);
  });

  it('builds a min-heap from an array', () => {
    const result = heapBuild([9, 4, 7, 1, 2, 6, 3], 'min');
    const heap = result.snapshot as HeapState;
    expect(isValidMinHeap(heap.data)).toBe(true);
    expect(heap.data[0]).toBe(1);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('build preserves all elements', () => {
    const values = [9, 4, 7, 1, 2, 6, 3];
    const result = heapBuild(values, 'min');
    const heap = result.snapshot as HeapState;
    expect([...heap.data].sort((a, b) => a - b)).toEqual(
      [...values].sort((a, b) => a - b),
    );
  });
});

// ── Max Heap ─────────────────────────────────────────────────

describe('Max Heap', () => {
  it('maintains max-heap property after multiple inserts', () => {
    const heap = insertMany([5, 3, 8, 1, 10, 2, 7], 'max');
    expect(isValidMaxHeap(heap.data)).toBe(true);
    expect(heap.data[0]).toBe(10); // max at root
  });

  it('extractMax returns the largest value', () => {
    const heap = insertMany([5, 3, 8, 1, 10], 'max');
    const maxVal = heap.data[0];
    expect(maxVal).toBe(10);
    const result = heapExtract(heap);
    const after = result.snapshot as HeapState;
    expect(after.data).not.toContain(10);
    expect(isValidMaxHeap(after.data)).toBe(true);
  });

  it('sequential extract from max-heap produces descending order', () => {
    let heap = insertMany([5, 3, 8, 1, 10, 2], 'max');
    const extracted: number[] = [];
    while (heap.data.length > 0) {
      extracted.push(heap.data[0]);
      const result = heapExtract(heap);
      heap = result.snapshot as HeapState;
    }
    expect(extracted).toEqual([10, 8, 5, 3, 2, 1]);
  });

  it('builds a max-heap from an array', () => {
    const result = heapBuild([3, 1, 4, 1, 5, 9, 2, 6], 'max');
    const heap = result.snapshot as HeapState;
    expect(isValidMaxHeap(heap.data)).toBe(true);
    expect(heap.data[0]).toBe(9);
  });
});
