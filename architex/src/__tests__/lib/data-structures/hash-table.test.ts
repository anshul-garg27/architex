import { describe, it, expect } from 'vitest';
import {
  createHashTable,
  hashInsert,
  hashSearch,
  simpleHash,
} from '@/lib/data-structures/hash-table';
import type { HashTableState } from '@/lib/data-structures/hash-table';

describe('Hash table with separate chaining', () => {
  it('inserts and searches a key successfully', () => {
    let table: HashTableState = createHashTable(8);
    table = hashInsert(table, 'foo', 42).snapshot as HashTableState;
    const result = hashSearch(table, 'foo');
    const found = result.steps.some((s) => s.description.includes('Found'));
    expect(found).toBe(true);
  });

  it('handles collisions by chaining', () => {
    let table: HashTableState = createHashTable(4);
    // Insert multiple keys that may collide in a small table
    for (const [k, v] of [['a', 1], ['e', 2], ['i', 3], ['o', 4]] as [string, number][]) {
      table = hashInsert(table, k, v).snapshot as HashTableState;
    }
    expect(table.size).toBe(4);
    const totalChained = table.buckets.reduce((s, b) => s + b.chain.length, 0);
    expect(totalChained).toBe(4);
  });

  it('reports not found for a missing key', () => {
    const table = createHashTable(8);
    const result = hashSearch(table, 'missing');
    const notFound = result.steps.some((s) => s.description.includes('not found'));
    expect(notFound).toBe(true);
  });
});
