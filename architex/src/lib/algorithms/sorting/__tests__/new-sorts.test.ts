import { describe, it, expect } from 'vitest';
import { shellSort } from '../shell-sort';
import { countingSort } from '../counting-sort';
import { radixSort } from '../radix-sort';

const SORT_FUNCTIONS = [
  { name: 'shellSort', fn: shellSort },
  { name: 'countingSort', fn: countingSort },
  { name: 'radixSort', fn: radixSort },
] as const;

const UNSORTED = [64, 25, 12, 22, 11, 90, 1, 45, 78, 33];
const EXPECTED_SORTED = [...UNSORTED].sort((a, b) => a - b);

describe('new sorting algorithms — basic correctness', () => {
  for (const { name, fn } of SORT_FUNCTIONS) {
    it(`${name} sorts a standard array correctly`, () => {
      const result = fn([...UNSORTED]);
      expect(result.finalState).toEqual(EXPECTED_SORTED);
    });

    it(`${name} handles an empty array`, () => {
      const result = fn([]);
      expect(result.finalState).toEqual([]);
    });

    it(`${name} handles a single-element array`, () => {
      const result = fn([42]);
      expect(result.finalState).toEqual([42]);
    });

    it(`${name} handles an already-sorted array`, () => {
      const result = fn([1, 2, 3, 4, 5]);
      expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
    });

    it(`${name} handles a reverse-sorted array`, () => {
      const result = fn([5, 4, 3, 2, 1]);
      expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
    });

    it(`${name} handles duplicate values`, () => {
      const result = fn([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]);
      expect(result.finalState).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 6, 9]);
    });

    it(`${name} returns a valid AlgorithmResult structure`, () => {
      const result = fn([...UNSORTED]);
      expect(result.config).toBeDefined();
      expect(result.config.category).toBe('sorting');
      expect(result.config.id).toBeTruthy();
      expect(result.config.name).toBeTruthy();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(Array.isArray(result.finalState)).toBe(true);
    });

    it(`${name} generates animation steps with valid fields`, () => {
      const result = fn([...UNSORTED]);
      for (const step of result.steps) {
        expect(typeof step.id).toBe('number');
        expect(typeof step.description).toBe('string');
        expect(typeof step.pseudocodeLine).toBe('number');
        expect(Array.isArray(step.mutations)).toBe(true);
        expect(typeof step.duration).toBe('number');
        expect(step.complexity).toBeDefined();
      }
    });
  }

  it('all three sorts produce identical sorted output', () => {
    const input = [64, 25, 12, 22, 11, 90, 1, 45, 78, 33];
    const outputs = SORT_FUNCTIONS.map(({ fn }) => fn([...input]).finalState);
    expect(outputs[1]).toEqual(outputs[0]);
    expect(outputs[2]).toEqual(outputs[0]);
  });
});
