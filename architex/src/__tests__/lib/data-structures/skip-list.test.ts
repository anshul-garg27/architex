import { describe, it, expect } from 'vitest';
import {
  createSkipList,
  skipListInsert,
  skipListSearch,
  skipListDelete,
  skipListToArray,
} from '@/lib/data-structures/skip-list';
import type { SkipListState } from '@/lib/data-structures/skip-list';

describe('Skip list', () => {
  it('insert/search/delete work correctly', () => {
    let sl: SkipListState = createSkipList(4);

    // Insert values
    for (const v of [5, 3, 8, 1, 7]) {
      const result = skipListInsert(sl, v);
      sl = result.snapshot as SkipListState;
    }
    expect(skipListToArray(sl)).toEqual([1, 3, 5, 7, 8]);
    expect(sl.size).toBe(5);

    // Search for existing value
    const found = skipListSearch(sl, 7);
    expect(found.steps.some((s) => s.description.includes('found'))).toBe(true);

    // Search for missing value
    const notFound = skipListSearch(sl, 99);
    expect(notFound.steps.some((s) => s.description.includes('not found'))).toBe(true);

    // Delete
    const delResult = skipListDelete(sl, 5);
    sl = delResult.snapshot as SkipListState;
    expect(skipListToArray(sl)).toEqual([1, 3, 7, 8]);
    expect(sl.size).toBe(4);
  });
});
