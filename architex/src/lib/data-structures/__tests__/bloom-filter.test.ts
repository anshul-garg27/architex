import { describe, it, expect } from 'vitest';
import {
  createBloomFilter,
  bloomInsert,
  bloomCheck,
  falsePositiveRate,
} from '../bloom-filter';
import type { BloomFilterState } from '../bloom-filter';

// ── Helpers ──────────────────────────────────────────────────

/** Insert multiple elements sequentially, returning the final state. */
function insertMany(elements: string[], m = 64, k = 3): BloomFilterState {
  let filter = createBloomFilter(m, k);
  for (const el of elements) {
    const result = bloomInsert(filter, el);
    filter = result.snapshot as BloomFilterState;
  }
  return filter;
}

// ── Tests ────────────────────────────────────────────────────

describe('Bloom Filter', () => {
  it('creates an empty filter with correct parameters', () => {
    const filter = createBloomFilter(32, 3);
    expect(filter.bits.length).toBe(32);
    expect(filter.m).toBe(32);
    expect(filter.k).toBe(3);
    expect(filter.n).toBe(0);
    expect(filter.insertedItems).toEqual([]);
    expect(filter.bits.every((b) => b === false)).toBe(true);
  });

  it('after inserting an element, check returns true (probably in set)', () => {
    let filter = createBloomFilter(64, 3);
    const insertResult = bloomInsert(filter, 'hello');
    filter = insertResult.snapshot as BloomFilterState;

    const checkResult = bloomCheck(filter, 'hello');
    // The last step should indicate "PROBABLY in the set"
    const lastStep = checkResult.steps[checkResult.steps.length - 1];
    expect(lastStep.description).toContain('PROBABLY in the set');
  });

  it('checking a non-inserted element returns definitely not (for sparse filter)', () => {
    const filter = insertMany(['apple'], 256, 3);
    const checkResult = bloomCheck(filter, 'banana');
    const descriptions = checkResult.steps.map((s) => s.description).join(' ');
    // With a large bit array and only 1 element, false positive is very unlikely
    // It should say "DEFINITELY NOT" for a non-inserted element
    expect(descriptions).toContain('DEFINITELY NOT');
  });

  it('insert produces animation steps', () => {
    const filter = createBloomFilter(32, 3);
    const result = bloomInsert(filter, 'test');
    expect(result.steps.length).toBeGreaterThan(0);
    // Should have k hash steps plus the insert and summary steps
    expect(result.steps.length).toBeGreaterThanOrEqual(3 + 2);
  });

  it('check produces animation steps', () => {
    const filter = insertMany(['test'], 32, 3);
    const result = bloomCheck(filter, 'test');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('inserting increments element count', () => {
    let filter = createBloomFilter(64, 3);
    const r1 = bloomInsert(filter, 'a');
    filter = r1.snapshot as BloomFilterState;
    expect(filter.n).toBe(1);
    expect(filter.insertedItems).toEqual(['a']);

    const r2 = bloomInsert(filter, 'b');
    filter = r2.snapshot as BloomFilterState;
    expect(filter.n).toBe(2);
    expect(filter.insertedItems).toEqual(['a', 'b']);
  });

  it('sets bits during insertion (at least one bit changes)', () => {
    const filter = createBloomFilter(64, 3);
    const result = bloomInsert(filter, 'hello');
    const after = result.snapshot as BloomFilterState;
    const setBits = after.bits.filter((b) => b === true).length;
    expect(setBits).toBeGreaterThan(0);
    expect(setBits).toBeLessThanOrEqual(3); // at most k bits set for first insertion
  });

  it('multiple insertions set more bits', () => {
    const filter1 = insertMany(['a'], 64, 3);
    const setBits1 = filter1.bits.filter((b) => b).length;

    const filter2 = insertMany(['a', 'b', 'c', 'd', 'e'], 64, 3);
    const setBits2 = filter2.bits.filter((b) => b).length;

    expect(setBits2).toBeGreaterThanOrEqual(setBits1);
  });

  it('false positive rate formula returns 0 for empty filter', () => {
    expect(falsePositiveRate(3, 0, 64)).toBe(0);
  });

  it('false positive rate increases with more insertions', () => {
    const rate1 = falsePositiveRate(3, 1, 64);
    const rate10 = falsePositiveRate(3, 10, 64);
    const rate50 = falsePositiveRate(3, 50, 64);
    expect(rate10).toBeGreaterThan(rate1);
    expect(rate50).toBeGreaterThan(rate10);
  });

  it('false positive rate stays within expected bounds', () => {
    // With m=256, k=3, n=10: theoretical FP rate should be low
    const rate = falsePositiveRate(3, 10, 256);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(0.05); // should be well under 5%
  });

  it('does not have false negatives (inserted elements always found)', () => {
    const elements = ['cat', 'dog', 'fish', 'bird', 'snake'];
    const filter = insertMany(elements, 256, 5);

    for (const el of elements) {
      const result = bloomCheck(filter, el);
      const lastStep = result.steps[result.steps.length - 1];
      expect(
        lastStep.description,
        `"${el}" should be found after insertion`,
      ).toContain('PROBABLY in the set');
    }
  });
});
