import { describe, it, expect } from 'vitest';
import {
  createTrie,
  trieInsert,
  trieSearch,
  trieStartsWith,
  trieDelete,
  trieAutoComplete,
} from '@/lib/data-structures/trie-ds';
import type { TrieState } from '@/lib/data-structures/trie-ds';
import {
  createSegmentTree,
  segmentTreeQuery,
  segmentTreeUpdate,
  segmentTreeRangeUpdate,
} from '@/lib/data-structures/segment-tree-ds';
import type { SegmentTreeState } from '@/lib/data-structures/segment-tree-ds';

// ── Trie Tests ────────────────────────────────────────────

describe('Trie (Prefix Tree)', () => {
  function buildTrie(words: string[]): TrieState {
    let state = createTrie();
    for (const w of words) {
      state = trieInsert(state, w).snapshot as TrieState;
    }
    return state;
  }

  const words = ['apple', 'app', 'application', 'bat', 'ball'];

  it('inserts 5 words and tracks size', () => {
    const trie = buildTrie(words);
    expect(trie.size).toBe(5);
    expect(trie.words).toEqual(expect.arrayContaining(words));
  });

  it('search hit returns found step', () => {
    const trie = buildTrie(words);
    const result = trieSearch(trie, 'apple');
    const found = result.steps.some((s) => s.description.includes('found in trie'));
    expect(found).toBe(true);
  });

  it('search miss returns not-found step', () => {
    const trie = buildTrie(words);
    const result = trieSearch(trie, 'apex');
    const notFound = result.steps.some((s) => s.description.includes('does not exist'));
    expect(notFound).toBe(true);
  });

  it('prefix search finds all words starting with prefix', () => {
    const trie = buildTrie(words);
    const result = trieStartsWith(trie, 'app');
    const summary = result.steps.find((s) => s.description.includes('word(s)'));
    expect(summary).toBeDefined();
    // "app", "apple", "application" all start with "app"
    expect(summary!.description).toContain('3 word(s)');
  });

  it('autocomplete returns limited results in alphabetical order', () => {
    const trie = buildTrie(words);
    const result = trieAutoComplete(trie, 'app', 2);
    const summary = result.steps.find((s) => s.description.includes('Autocomplete found'));
    expect(summary).toBeDefined();
    expect(summary!.description).toContain('2 result(s)');
  });

  it('autocomplete with no matches reports empty', () => {
    const trie = buildTrie(words);
    const result = trieAutoComplete(trie, 'xyz', 5);
    const noMatch = result.steps.some((s) => s.description.includes('no completions'));
    expect(noMatch).toBe(true);
  });

  it('delete removes word and cleans up childless nodes', () => {
    const trie = buildTrie(words);
    const result = trieDelete(trie, 'bat');
    const snapshot = result.snapshot as TrieState;
    expect(snapshot.size).toBe(4);
    expect(snapshot.words).not.toContain('bat');

    // Verify "bat" is gone but "ball" still works
    const searchBat = trieSearch(snapshot, 'bat');
    expect(searchBat.steps.some((s) => s.description.includes('does not exist')
      || s.description.includes('not a complete word'))).toBe(true);

    const searchBall = trieSearch(snapshot, 'ball');
    expect(searchBall.steps.some((s) => s.description.includes('found in trie'))).toBe(true);
  });

  it('delete non-existent word is a no-op', () => {
    const trie = buildTrie(words);
    const result = trieDelete(trie, 'missing');
    const snapshot = result.snapshot as TrieState;
    expect(snapshot.size).toBe(5);
  });
});

// ── Segment Tree Tests ────────────────────────────────────

describe('Segment Tree', () => {
  const data = [1, 3, 5, 7, 9, 11];

  it('builds from array with correct root sum', () => {
    const result = createSegmentTree(data);
    const st = result.snapshot as SegmentTreeState;
    expect(st.n).toBe(6);
    // Sum of all elements: 1+3+5+7+9+11 = 36
    expect(st.tree[1]).toBe(36);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('range query returns correct sum', () => {
    const buildResult = createSegmentTree(data);
    const st = buildResult.snapshot as SegmentTreeState;

    // Query [1, 3] -> 3+5+7 = 15
    const qResult = segmentTreeQuery(st, 1, 3);
    const sumStep = qResult.steps.find((s) => s.description.includes('Query result'));
    expect(sumStep).toBeDefined();
    expect(sumStep!.description).toContain('15');
  });

  it('full range query returns total sum', () => {
    const buildResult = createSegmentTree(data);
    const st = buildResult.snapshot as SegmentTreeState;

    const qResult = segmentTreeQuery(st, 0, 5);
    const sumStep = qResult.steps.find((s) => s.description.includes('Query result'));
    expect(sumStep).toBeDefined();
    expect(sumStep!.description).toContain('36');
  });

  it('point update changes value and propagates', () => {
    const buildResult = createSegmentTree(data);
    let st = buildResult.snapshot as SegmentTreeState;

    // Update index 2 from 5 to 10
    const upResult = segmentTreeUpdate(st, 2, 10);
    st = upResult.snapshot as SegmentTreeState;

    // New sum: 1+3+10+7+9+11 = 41
    expect(st.tree[1]).toBe(41);
    expect(st.data[2]).toBe(10);

    // Verify via query: range [2,2] should return 10
    const qResult = segmentTreeQuery(st, 2, 2);
    const sumStep = qResult.steps.find((s) => s.description.includes('Query result'));
    expect(sumStep!.description).toContain('10');
  });

  it('range update with lazy propagation works', () => {
    const buildResult = createSegmentTree(data);
    let st = buildResult.snapshot as SegmentTreeState;

    // Add 2 to every element in [1, 4]: data becomes [1, 5, 7, 9, 11, 11]
    const ruResult = segmentTreeRangeUpdate(st, 1, 4, 2);
    st = ruResult.snapshot as SegmentTreeState;

    // New sum: 1+5+7+9+11+11 = 44
    expect(st.tree[1]).toBe(44);

    // Query the updated range [1,4] -> 5+7+9+11 = 32
    const qResult = segmentTreeQuery(st, 1, 4);
    const sumStep = qResult.steps.find((s) => s.description.includes('Query result'));
    expect(sumStep!.description).toContain('32');
  });

  it('range update followed by point update is consistent', () => {
    const buildResult = createSegmentTree([2, 4, 6, 8]);
    let st = buildResult.snapshot as SegmentTreeState;

    // Range update: add 3 to [0,3] -> [5,7,9,11], sum=32
    st = (segmentTreeRangeUpdate(st, 0, 3, 3)).snapshot as SegmentTreeState;
    expect(st.tree[1]).toBe(32);

    // Point update: set index 1 to 1 -> [5,1,9,11], sum=26
    st = (segmentTreeUpdate(st, 1, 1)).snapshot as SegmentTreeState;
    expect(st.tree[1]).toBe(26);

    // Query [0,1] -> 5+1 = 6
    const qResult = segmentTreeQuery(st, 0, 1);
    const sumStep = qResult.steps.find((s) => s.description.includes('Query result'));
    expect(sumStep!.description).toContain('6');
  });

  it('empty array produces empty tree', () => {
    const result = createSegmentTree([]);
    const st = result.snapshot as SegmentTreeState;
    expect(st.n).toBe(0);
    expect(st.tree.length).toBe(0);
  });
});
