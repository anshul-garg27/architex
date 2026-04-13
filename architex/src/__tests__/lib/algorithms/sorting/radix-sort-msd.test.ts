import { describe, it, expect } from 'vitest';
import { radixSortMSD } from '@/lib/algorithms/sorting/radix-sort-msd';

describe('Radix Sort MSD', () => {
  it('sorts a standard unsorted array correctly', () => {
    const result = radixSortMSD([64, 25, 12, 22, 11, 90, 1, 45, 78, 33]);
    expect(result.finalState).toEqual([1, 11, 12, 22, 25, 33, 45, 64, 78, 90]);
  });

  it('handles an empty array', () => {
    const result = radixSortMSD([]);
    expect(result.finalState).toEqual([]);
    expect(result.steps).toHaveLength(0);
  });

  it('handles a single-element array', () => {
    const result = radixSortMSD([42]);
    expect(result.finalState).toEqual([42]);
    expect(result.steps).toHaveLength(0);
  });

  it('handles an already-sorted array', () => {
    const result = radixSortMSD([1, 2, 3, 4, 5]);
    expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles a reverse-sorted array', () => {
    const result = radixSortMSD([5, 4, 3, 2, 1]);
    expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles an array with duplicate values', () => {
    const result = radixSortMSD([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]);
    expect(result.finalState).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 6, 9]);
  });

  it('handles an array with multi-digit numbers', () => {
    const result = radixSortMSD([170, 45, 75, 90, 802, 24, 2, 66]);
    expect(result.finalState).toEqual([2, 24, 45, 66, 75, 90, 170, 802]);
  });

  it('handles an array with all identical values', () => {
    const result = radixSortMSD([7, 7, 7, 7]);
    expect(result.finalState).toEqual([7, 7, 7, 7]);
  });

  it('returns a valid AlgorithmResult with config and steps', () => {
    const result = radixSortMSD([64, 25, 12, 22, 11]);
    expect(result.config).toBeDefined();
    expect(result.config.id).toBe('radix-sort-msd');
    expect(result.config.category).toBe('sorting');
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(Array.isArray(result.finalState)).toBe(true);
  });

  it('produces steps with valid AnimationStep structure', () => {
    const result = radixSortMSD([30, 20, 10]);
    for (const step of result.steps) {
      expect(step).toHaveProperty('id');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('pseudocodeLine');
      expect(step).toHaveProperty('mutations');
      expect(step).toHaveProperty('complexity');
      expect(step).toHaveProperty('duration');
      expect(step.complexity).toHaveProperty('comparisons');
      expect(step.complexity).toHaveProperty('swaps');
      expect(step.complexity).toHaveProperty('reads');
      expect(step.complexity).toHaveProperty('writes');
    }
  });

  it('step descriptions mention recursion and digit positions', () => {
    const result = radixSortMSD([321, 123, 231]);
    const descriptions = result.steps.map((s) => s.description);
    // Should mention digit positions since these are 3-digit numbers
    expect(descriptions.some((d) => d.includes('digit position'))).toBe(true);
    // Should mention buckets
    expect(descriptions.some((d) => d.includes('bucket'))).toBe(true);
  });

  it('handles zeros correctly', () => {
    const result = radixSortMSD([0, 5, 0, 3, 0]);
    expect(result.finalState).toEqual([0, 0, 0, 3, 5]);
  });
});
