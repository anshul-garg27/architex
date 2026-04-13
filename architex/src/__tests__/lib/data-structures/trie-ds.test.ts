import { describe, it, expect } from 'vitest';
import {
  createTrie,
  trieInsert,
  trieSearch,
  trieStartsWith,
} from '@/lib/data-structures/trie-ds';
import type { TrieState } from '@/lib/data-structures/trie-ds';

describe('Trie', () => {
  it('insert/search/startsWith work correctly', () => {
    let trie: TrieState = createTrie();

    // Insert words
    for (const word of ['apple', 'app', 'apply', 'bat']) {
      const result = trieInsert(trie, word);
      trie = result.snapshot as TrieState;
    }
    expect(trie.size).toBe(4);

    // Search for existing word
    const found = trieSearch(trie, 'app');
    expect(found.steps.some((s) => s.description.includes('found'))).toBe(true);

    // Search for missing word
    const missing = trieSearch(trie, 'banana');
    expect(missing.steps.some((s) => s.description.includes('not found') || s.description.includes('does not exist'))).toBe(true);

    // startsWith
    const prefixResult = trieStartsWith(trie, 'app');
    const matchStep = prefixResult.steps.find((s) => s.description.includes('word(s)'));
    expect(matchStep).toBeDefined();
    expect(matchStep!.description).toContain('3 word(s)');
  });
});
