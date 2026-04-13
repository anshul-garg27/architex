// -----------------------------------------------------------------
// Architex -- Trie Insert/Search Algorithm Visualization  (ALG-038)
// -----------------------------------------------------------------
//
// This module provides trie operations as algorithm visualizations
// using the AlgorithmResult format (with AnimationStep[]).
// Unlike the data-structure trie (src/lib/data-structures/trie-ds.ts)
// which uses DSResult/DSStep, this is for the algorithm visualizer.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Trie Node for Algorithm Visualization ──────────────────

export interface TrieAlgoNode {
  id: string;
  char: string;
  children: Map<string, TrieAlgoNode>;
  isEndOfWord: boolean;
}

// ── Config ──────────────────────────────────────────────────

export const TRIE_CONFIG: AlgorithmConfig = {
  id: 'trie-operations',
  name: 'Trie Insert / Search',
  category: 'tree',
  timeComplexity: {
    best: 'O(m)',
    average: 'O(m)',
    worst: 'O(m)',
  },
  spaceComplexity: 'O(n * m)',
  description:
    'Trie (prefix tree) operations: insert builds a path of nodes character by character, creating new nodes when needed and marking the end of a word. Search traverses the trie checking each character. m = word length, n = number of words.',
  pseudocode: [
    'procedure trieInsert(root, word)',
    '  current = root',
    '  for each char in word do',
    '    if char not in current.children then',
    '      current.children[char] = new TrieNode()',
    '    current = current.children[char]',
    '  current.isEndOfWord = true',
    '',
    'procedure trieSearch(root, word)',
    '  current = root',
    '  for each char in word do',
    '    if char not in current.children then',
    '      return NOT FOUND',
    '    current = current.children[char]',
    '  return current.isEndOfWord',
  ],
};

// ── Helpers ─────────────────────────────────────────────────

let _nextNodeId = 5000;

function nextId(): string {
  return `trie_${_nextNodeId++}`;
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'ease-out' };
}

function createNode(char: string): TrieAlgoNode {
  return {
    id: nextId(),
    char,
    children: new Map(),
    isEndOfWord: false,
  };
}

function cloneTrieNode(node: TrieAlgoNode): TrieAlgoNode {
  const cloned: TrieAlgoNode = {
    id: node.id,
    char: node.char,
    children: new Map(),
    isEndOfWord: node.isEndOfWord,
  };
  for (const [ch, child] of node.children) {
    cloned.children.set(ch, cloneTrieNode(child));
  }
  return cloned;
}

/** Collect all words stored in the trie. */
function collectWords(node: TrieAlgoNode, prefix: string): string[] {
  const words: string[] = [];
  if (node.isEndOfWord) words.push(prefix);
  const sorted = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [ch, child] of sorted) {
    words.push(...collectWords(child, prefix + ch));
  }
  return words;
}

// ── Create a default trie root ──────────────────────────────

export function createTrieRoot(): TrieAlgoNode {
  return createNode('');
}

// ── Trie Insert (Algorithm Visualization) ───────────────────

export function trieInsertAlgo(
  root: TrieAlgoNode,
  word: string,
): AlgorithmResult {
  const tree = cloneTrieNode(root);
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let writes = 0;
  let comparisons = 0;

  function record(
    desc: string,
    line: number,
    mutations: VisualMutation[],
  ): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });
  }

  if (word.length === 0) {
    record('Cannot insert empty string', 0, []);
    return { config: TRIE_CONFIG, steps, finalState: [] };
  }

  record(
    `Insert "${word}" into trie -- start at root`,
    0,
    [mut(tree.id, 'highlight', 'default', 'visiting')],
  );

  let current = tree;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    reads++;
    comparisons++;

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      record(
        `Character '${ch}' exists -- traverse to child node`,
        5,
        [
          mut(current.id, 'highlight', 'visiting', 'visited'),
          mut(child.id, 'highlight', 'default', 'visiting'),
        ],
      );
      current = child;
    } else {
      const newNode = createNode(ch);
      current.children.set(ch, newNode);
      writes++;
      record(
        `Character '${ch}' not found -- create new node`,
        4,
        [
          mut(current.id, 'highlight', 'visiting', 'visited'),
          mut(newNode.id, 'highlight', 'default', 'inserting'),
        ],
      );
      current = newNode;
    }
  }

  if (current.isEndOfWord) {
    record(
      `"${word}" already exists in trie (end-of-word already marked)`,
      6,
      [mut(current.id, 'highlight', 'visiting', 'found')],
    );
  } else {
    current.isEndOfWord = true;
    writes++;
    record(
      `Mark node as end of word for "${word}"`,
      6,
      [mut(current.id, 'highlight', 'visiting', 'found')],
    );
  }

  // Collect all words for finalState representation
  const allWords = collectWords(tree, '');
  // Encode words as character code sums for finalState (sorted)
  const finalState = allWords.map((w) =>
    w.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0),
  );

  return { config: TRIE_CONFIG, steps, finalState };
}

// ── Trie Search (Algorithm Visualization) ───────────────────

export function trieSearchAlgo(
  root: TrieAlgoNode,
  word: string,
): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let comparisons = 0;

  function record(
    desc: string,
    line: number,
    mutations: VisualMutation[],
  ): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  record(
    `Search for "${word}" in trie -- start at root`,
    8,
    [mut(root.id, 'highlight', 'default', 'visiting')],
  );

  let current = root;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    reads++;
    comparisons++;

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      record(
        `Character '${ch}' found -- descend to child`,
        13,
        [
          mut(current.id, 'highlight', 'visiting', 'visited'),
          mut(child.id, 'highlight', 'default', 'visiting'),
        ],
      );
      current = child;
    } else {
      record(
        `Character '${ch}' NOT FOUND -- "${word}" does not exist in trie`,
        11,
        [mut(current.id, 'highlight', 'visiting', 'deleting')],
      );
      return { config: TRIE_CONFIG, steps, finalState: [] };
    }
  }

  if (current.isEndOfWord) {
    record(
      `End of word reached -- "${word}" FOUND in trie!`,
      14,
      [mut(current.id, 'highlight', 'visiting', 'found')],
    );
  } else {
    record(
      `"${word}" is a prefix but NOT a complete word -- NOT FOUND`,
      14,
      [mut(current.id, 'highlight', 'visiting', 'deleting')],
    );
  }

  return { config: TRIE_CONFIG, steps, finalState: [] };
}
