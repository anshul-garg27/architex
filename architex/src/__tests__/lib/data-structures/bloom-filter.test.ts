import { describe, it, expect } from 'vitest';
import {
  createBloomFilter,
  bloomInsert,
  bloomCheck,
  falsePositiveRate,
} from '@/lib/data-structures/bloom-filter';
import type { BloomFilterState } from '@/lib/data-structures/bloom-filter';

describe('Bloom filter', () => {
  it('never produces false negatives for inserted items', () => {
    let filter: BloomFilterState = createBloomFilter(64, 3);
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    for (const item of items) {
      filter = bloomInsert(filter, item).snapshot as BloomFilterState;
    }
    for (const item of items) {
      const result = bloomCheck(filter, item);
      const definitelyNot = result.steps.some((s) => s.description.includes('DEFINITELY NOT'));
      expect(definitelyNot).toBe(false);
    }
  });

  it('false positive rate stays within theoretical bounds', () => {
    const m = 256;
    const k = 5;
    let filter: BloomFilterState = createBloomFilter(m, k);
    for (let i = 0; i < 20; i++) {
      filter = bloomInsert(filter, `item-${i}`).snapshot as BloomFilterState;
    }
    const theoretical = falsePositiveRate(k, 20, m);
    expect(theoretical).toBeLessThan(0.05);
    expect(theoretical).toBeGreaterThanOrEqual(0);
  });
});
