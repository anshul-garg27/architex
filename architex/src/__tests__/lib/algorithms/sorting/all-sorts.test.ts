import { describe, it, expect } from 'vitest';
import {
  bubbleSort,
  mergeSort,
  quickSort,
  heapSort,
  insertionSort,
  selectionSort,
  shellSort,
  countingSort,
  radixSort,
  bucketSort,
  timSort,
  cocktailShakerSort,
  combSort,
} from '@/lib/algorithms/sorting';

/**
 * All 13 exported sorting algorithms are tested against the same inputs.
 * Each algorithm returns an AlgorithmResult with a `finalState` that should
 * be the sorted version of the input.
 */

const SORT_FUNCTIONS = [
  { name: 'bubbleSort', fn: bubbleSort },
  { name: 'mergeSort', fn: mergeSort },
  { name: 'quickSort', fn: quickSort },
  { name: 'heapSort', fn: heapSort },
  { name: 'insertionSort', fn: insertionSort },
  { name: 'selectionSort', fn: selectionSort },
  { name: 'shellSort', fn: shellSort },
  { name: 'countingSort', fn: countingSort },
  { name: 'radixSort', fn: radixSort },
  { name: 'bucketSort', fn: bucketSort },
  { name: 'timSort', fn: timSort },
  { name: 'cocktailShakerSort', fn: cocktailShakerSort },
  { name: 'combSort', fn: combSort },
] as const;

const UNSORTED = [64, 25, 12, 22, 11, 90, 1, 45, 78, 33];
const EXPECTED_SORTED = [...UNSORTED].sort((a, b) => a - b);

describe('all sorting algorithms produce correct sorted output', () => {
  for (const { name, fn } of SORT_FUNCTIONS) {
    it(`${name} sorts a standard array correctly`, () => {
      const result = fn([...UNSORTED]);
      expect(result.finalState).toEqual(EXPECTED_SORTED);
    });
  }

  // ── Edge cases (run for each sort) ─────────────────────────

  for (const { name, fn } of SORT_FUNCTIONS) {
    it(`${name} handles an empty array`, () => {
      const result = fn([]);
      expect(result.finalState).toEqual([]);
    });

    it(`${name} handles a single-element array`, () => {
      const result = fn([42]);
      expect(result.finalState).toEqual([42]);
    });
  }

  // ── Already-sorted and reverse-sorted ──────────────────────

  const ALREADY_SORTED = [1, 2, 3, 4, 5];
  const REVERSE_SORTED = [5, 4, 3, 2, 1];

  for (const { name, fn } of SORT_FUNCTIONS) {
    it(`${name} handles an already-sorted array`, () => {
      const result = fn([...ALREADY_SORTED]);
      expect(result.finalState).toEqual(ALREADY_SORTED);
    });

    it(`${name} handles a reverse-sorted array`, () => {
      const result = fn([...REVERSE_SORTED]);
      expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
    });
  }

  // ── All algorithms produce the same output ─────────────────

  it('all sorting algorithms produce identical sorted output for the same input', () => {
    const outputs = SORT_FUNCTIONS.map(({ fn }) => fn([...UNSORTED]).finalState);
    for (let i = 1; i < outputs.length; i++) {
      expect(outputs[i]).toEqual(outputs[0]);
    }
  });

  // ── AlgorithmResult structure ──────────────────────────────

  it('every sort returns a valid AlgorithmResult with config and steps', () => {
    for (const { name, fn } of SORT_FUNCTIONS) {
      const result = fn([...UNSORTED]);
      expect(result.config).toBeDefined();
      expect(result.config.category).toBe('sorting');
      expect(Array.isArray(result.steps)).toBe(true);
      expect(Array.isArray(result.finalState)).toBe(true);
    }
  });
});
