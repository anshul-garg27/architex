import { describe, it, expect } from 'vitest';
import {
  trieInsertAlgo,
  trieSearchAlgo,
  createTrieRoot,
  TRIE_CONFIG,
} from '@/lib/algorithms/tree/trie-operations';
import type { TrieAlgoNode } from '@/lib/algorithms/tree/trie-operations';

describe('Trie Algorithm Operations', () => {
  // ── Insert Tests ──────────────────────────────────────────

  describe('trieInsertAlgo', () => {
    it('inserts a single word and produces steps', () => {
      const root = createTrieRoot();
      const result = trieInsertAlgo(root, 'cat');

      expect(result.config.id).toBe('trie-operations');
      expect(result.config.category).toBe('tree');
      expect(result.steps.length).toBeGreaterThan(0);

      // Steps should mention each character
      const descs = result.steps.map((s) => s.description);
      expect(descs.some((d) => d.includes("'c'"))).toBe(true);
      expect(descs.some((d) => d.includes("'a'"))).toBe(true);
      expect(descs.some((d) => d.includes("'t'"))).toBe(true);
      // Should mark end of word
      expect(descs.some((d) => d.includes('end of word'))).toBe(true);
    });

    it('handles empty string gracefully', () => {
      const root = createTrieRoot();
      const result = trieInsertAlgo(root, '');

      expect(result.steps.length).toBe(1);
      expect(result.steps[0].description).toContain('empty');
    });

    it('creates new nodes for each character in a fresh trie', () => {
      const root = createTrieRoot();
      const result = trieInsertAlgo(root, 'hi');

      const descs = result.steps.map((s) => s.description);
      // Both 'h' and 'i' should be "not found -- create new node"
      expect(descs.filter((d) => d.includes('not found')).length).toBe(2);
    });

    it('produces valid AnimationStep structure', () => {
      const root = createTrieRoot();
      const result = trieInsertAlgo(root, 'test');

      for (const step of result.steps) {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('pseudocodeLine');
        expect(step).toHaveProperty('mutations');
        expect(step).toHaveProperty('complexity');
        expect(step).toHaveProperty('duration');
      }
    });

    it('returns AlgorithmResult matching config format', () => {
      const root = createTrieRoot();
      const result = trieInsertAlgo(root, 'abc');

      expect(result.config).toEqual(TRIE_CONFIG);
      expect(Array.isArray(result.steps)).toBe(true);
      expect(Array.isArray(result.finalState)).toBe(true);
    });
  });

  // ── Search Tests ──────────────────────────────────────────

  describe('trieSearchAlgo', () => {
    /** Helper: build a trie by inserting multiple words. */
    function buildTrie(words: string[]): TrieAlgoNode {
      const root = createTrieRoot();
      for (const word of words) {
        // We need to manually build the trie since trieInsertAlgo
        // returns AlgorithmResult, not the modified root.
        // So we build it with the internal structure.
        let current = root;
        for (const ch of word) {
          if (!current.children.has(ch)) {
            current.children.set(ch, {
              id: `test_${Math.random().toString(36).slice(2, 8)}`,
              char: ch,
              children: new Map(),
              isEndOfWord: false,
            });
          }
          current = current.children.get(ch)!;
        }
        current.isEndOfWord = true;
      }
      return root;
    }

    it('finds an existing word', () => {
      const root = buildTrie(['apple', 'app', 'bat']);
      const result = trieSearchAlgo(root, 'app');

      const descs = result.steps.map((s) => s.description);
      expect(descs.some((d) => d.includes('FOUND'))).toBe(true);
    });

    it('reports NOT FOUND for a missing word', () => {
      const root = buildTrie(['apple', 'app']);
      const result = trieSearchAlgo(root, 'banana');

      const descs = result.steps.map((s) => s.description);
      expect(descs.some((d) => d.includes('NOT FOUND'))).toBe(true);
    });

    it('reports NOT FOUND for a prefix that is not a complete word', () => {
      const root = buildTrie(['apple']);
      const result = trieSearchAlgo(root, 'app');

      const descs = result.steps.map((s) => s.description);
      // "app" is a prefix but not marked as a word
      expect(descs.some((d) => d.includes('prefix') && d.includes('NOT'))).toBe(true);
    });

    it('produces steps that traverse each character', () => {
      const root = buildTrie(['hello']);
      const result = trieSearchAlgo(root, 'hello');

      const descs = result.steps.map((s) => s.description);
      // Should see descend steps for each character
      for (const ch of ['h', 'e', 'l', 'l', 'o']) {
        expect(descs.some((d) => d.includes(`'${ch}'`) && d.includes('found'))).toBe(true);
      }
    });

    it('tracks comparisons and reads correctly', () => {
      const root = buildTrie(['abc']);
      const result = trieSearchAlgo(root, 'abc');

      const lastStep = result.steps[result.steps.length - 1];
      expect(lastStep.complexity.comparisons).toBe(3);
      expect(lastStep.complexity.reads).toBe(3);
    });

    it('returns valid AlgorithmResult', () => {
      const root = buildTrie(['test']);
      const result = trieSearchAlgo(root, 'test');

      expect(result.config).toEqual(TRIE_CONFIG);
      expect(Array.isArray(result.steps)).toBe(true);
      expect(Array.isArray(result.finalState)).toBe(true);
    });
  });
});
