import { describe, it, expect } from 'vitest';
import { bubbleSort } from '../bubble-sort';
import { insertionSort } from '../insertion-sort';
import { selectionSort } from '../selection-sort';
import { mergeSort } from '../merge-sort';
import { quickSort } from '../quick-sort';
import { heapSort } from '../heap-sort';
import { shellSort } from '../shell-sort';
import { countingSort } from '../counting-sort';
import { radixSort } from '../radix-sort';
import { bucketSort } from '../bucket-sort';
import { timSort } from '../tim-sort';
import { cocktailShakerSort } from '../cocktail-shaker-sort';
import { combSort } from '../comb-sort';
import { pancakeSort } from '../pancake-sort';
import type { AlgorithmResult } from '../../types';

// Exclude bogoSort -- it is non-deterministic and too slow for testing

const SORT_FUNCTIONS: { name: string; fn: (arr: number[]) => AlgorithmResult }[] = [
  { name: 'bubbleSort', fn: bubbleSort },
  { name: 'insertionSort', fn: insertionSort },
  { name: 'selectionSort', fn: selectionSort },
  { name: 'mergeSort', fn: mergeSort },
  { name: 'quickSort', fn: quickSort },
  { name: 'heapSort', fn: heapSort },
  { name: 'shellSort', fn: shellSort },
  { name: 'countingSort', fn: countingSort },
  { name: 'radixSort', fn: radixSort },
  { name: 'bucketSort', fn: bucketSort },
  { name: 'timSort', fn: timSort },
  { name: 'cocktailShakerSort', fn: cocktailShakerSort },
  { name: 'combSort', fn: combSort },
  { name: 'pancakeSort', fn: pancakeSort },
];

const LARGE_ARRAY = Array.from({ length: 100 }, (_, i) => 100 - i);
const LARGE_SORTED = [...LARGE_ARRAY].sort((a, b) => a - b);

describe('comprehensive sorting algorithm tests', () => {
  for (const { name, fn } of SORT_FUNCTIONS) {
    describe(name, () => {
      it('sorts an empty array', () => {
        const result = fn([]);
        expect(result.finalState).toEqual([]);
      });

      it('sorts a single element', () => {
        const result = fn([42]);
        expect(result.finalState).toEqual([42]);
      });

      it('sorts an already sorted array', () => {
        const result = fn([1, 2, 3, 4, 5]);
        expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
      });

      it('sorts a reverse-sorted array', () => {
        const result = fn([5, 4, 3, 2, 1]);
        expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
      });

      it('sorts an array with duplicate values', () => {
        const result = fn([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]);
        expect(result.finalState).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 6, 9]);
      });

      it('sorts a large array (100 elements)', () => {
        const result = fn([...LARGE_ARRAY]);
        expect(result.finalState).toEqual(LARGE_SORTED);
      });

      it('returns a valid AlgorithmResult structure', () => {
        const result = fn([64, 25, 12, 22, 11]);
        expect(result.config).toBeDefined();
        expect(result.config.category).toBe('sorting');
        expect(result.config.id).toBeTruthy();
        expect(result.config.name).toBeTruthy();
        expect(Array.isArray(result.steps)).toBe(true);
        expect(Array.isArray(result.finalState)).toBe(true);
      });

      it('generates non-zero step counts for non-trivial input', () => {
        const result = fn([64, 25, 12, 22, 11, 90, 1, 45, 78, 33]);
        expect(result.steps.length).toBeGreaterThan(0);
      });

      it('does not generate excessive steps for a 10-element array', () => {
        const result = fn([64, 25, 12, 22, 11, 90, 1, 45, 78, 33]);
        // A reasonable upper bound: no algorithm should need more than 5000 steps for 10 elements
        expect(result.steps.length).toBeLessThan(5000);
      });
    });
  }

  it('all algorithms produce identical sorted output for the same input', () => {
    const input = [64, 25, 12, 22, 11, 90, 1, 45, 78, 33];
    const expected = [...input].sort((a, b) => a - b);
    for (const { name, fn } of SORT_FUNCTIONS) {
      const result = fn([...input]);
      expect(result.finalState, `${name} should produce correct sorted output`).toEqual(expected);
    }
  });

  it('all algorithms handle two-element swap', () => {
    for (const { name, fn } of SORT_FUNCTIONS) {
      const result = fn([2, 1]);
      expect(result.finalState, `${name} should sort [2,1]`).toEqual([1, 2]);
    }
  });

  it('all algorithms handle all-equal elements', () => {
    for (const { name, fn } of SORT_FUNCTIONS) {
      const result = fn([7, 7, 7, 7]);
      expect(result.finalState, `${name} should handle all-equal`).toEqual([7, 7, 7, 7]);
    }
  });

  it('step ids are sequential within each result', () => {
    for (const { name, fn } of SORT_FUNCTIONS) {
      const result = fn([5, 3, 8, 1]);
      for (let i = 0; i < result.steps.length; i++) {
        expect(result.steps[i].id, `${name} step ${i} should have sequential id`).toBe(i);
      }
    }
  });
});
