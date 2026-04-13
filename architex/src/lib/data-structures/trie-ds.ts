// -----------------------------------------------------------------
// Architex -- Trie (Prefix Tree) Data Structure  (DST-012)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface TrieNode {
  id: string;
  /** Character this node represents (empty string for root) */
  char: string;
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
}

export interface TrieState {
  root: TrieNode;
  words: string[];
  size: number;
}

let _nodeCounter = 0;

function newNodeId(): string {
  return `trie-${_nodeCounter++}`;
}

// WHY Map instead of fixed 26-char array: A fixed array[26] wastes memory when nodes
// have few children (common in real text). A Map only allocates entries for characters
// that actually exist, saving significant memory for sparse tries. It also naturally
// supports Unicode and arbitrary alphabets (not just a-z). The trade-off is slightly
// slower lookup (Map hash vs array index), but memory savings dominate for large tries.
function createTrieNode(char: string): TrieNode {
  return {
    id: newNodeId(),
    char,
    children: new Map(),
    isEndOfWord: false,
  };
}

/** Deep-clone a trie node and all descendants.
 * WHY deep clone: Trie mutations (insert/delete) modify node children in place.
 * Deep cloning ensures the original trie state is preserved for step recording
 * and undo functionality. Structural sharing would be more efficient but adds
 * complexity that obscures the educational purpose of the code. */
function cloneTrieNode(node: TrieNode): TrieNode {
  const cloned: TrieNode = {
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

export function cloneTrie(state: TrieState): TrieState {
  return {
    root: cloneTrieNode(state.root),
    words: [...state.words],
    size: state.size,
  };
}

export function createTrie(): TrieState {
  return {
    root: createTrieNode(''),
    words: [],
    size: 0,
  };
}

/** Flatten trie into a list of { node, parentId, edgeChar, depth } for visualization. */
export interface TrieFlatNode {
  node: TrieNode;
  parentId: string | null;
  edgeChar: string;
  depth: number;
}

export function flattenTrie(root: TrieNode): TrieFlatNode[] {
  const result: TrieFlatNode[] = [];

  function walk(node: TrieNode, parentId: string | null, edgeChar: string, depth: number): void {
    result.push({ node, parentId, edgeChar, depth });
    // Sort children alphabetically for consistent layout
    const sorted = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [ch, child] of sorted) {
      walk(child, node.id, ch, depth + 1);
    }
  }

  walk(root, null, '', 0);
  return result;
}

// ── Operations ─────────────────────────────────────────────

export function trieInsert(state: TrieState, word: string): DSResult<TrieState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTrie(state);

  if (word.length === 0) {
    steps.push(step('Cannot insert empty string', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Insert "${word}" into trie. A trie stores words character by character — words sharing a common prefix share the same path, saving space and enabling fast prefix queries.`, [
      { targetId: s.root.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  let current = s.root;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      steps.push(
        step(`'${ch}' exists — traverse to child. This character is already shared with another word's prefix — no new node needed.`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      current = child;
    } else {
      const newNode = createTrieNode(ch);
      current.children.set(ch, newNode);
      steps.push(
        step(`'${ch}' not found — create new node. This character diverges from all existing prefixes, so we extend the trie with a new branch.`, [
          { targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' },
        ]),
      );
      current = newNode;
    }
  }

  // WHY isEndOfWord flag: Without this, we cannot distinguish between a stored word
  // and a prefix of a longer word. E.g., after inserting "app" and "apple", the node
  // at 'p' (second p) must be marked as end-of-word for "app" to be found as a word,
  // not just treated as a prefix of "apple".
  if (current.isEndOfWord) {
    steps.push(step(`"${word}" already exists in trie`, []));
  } else {
    current.isEndOfWord = true;
    s.words.push(word);
    s.size++;
    steps.push(
      step(`Mark end of word "${word}". Size: ${s.size}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  return { steps, snapshot: s };
}

export function trieSearch(state: TrieState, word: string): DSResult<TrieState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Search for "${word}". Trie search is O(m) where m is the word length — it follows one path from root, checking one character per level regardless of how many words are stored.`, [
      { targetId: state.root.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  let current = state.root;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      steps.push(
        step(`'${ch}' found -- descend`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      current = child;
    } else {
      steps.push(
        step(`'${ch}' not found -- "${word}" does not exist`, []),
      );
      return { steps, snapshot: state };
    }
  }

  if (current.isEndOfWord) {
    steps.push(
      step(`"${word}" found in trie!`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
  } else {
    steps.push(
      step(`"${word}" is a prefix but not a complete word`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
  }

  return { steps, snapshot: state };
}

export function trieStartsWith(state: TrieState, prefix: string): DSResult<TrieState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Check prefix "${prefix}". Prefix search is where tries excel — we follow the prefix path and then collect all words below that node.`, [
      { targetId: state.root.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  let current = state.root;

  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      steps.push(
        step(`'${ch}' found -- descend`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      current = child;
    } else {
      steps.push(step(`'${ch}' not found -- no words start with "${prefix}"`, []));
      return { steps, snapshot: state };
    }
  }

  // Collect all words under this prefix
  const matches: string[] = [];
  function collect(node: TrieNode, path: string): void {
    if (node.isEndOfWord) matches.push(path);
    for (const [ch, child] of node.children) {
      collect(child, path + ch);
    }
  }
  collect(current, prefix);

  steps.push(
    step(`Prefix "${prefix}" found! ${matches.length} word(s): [${matches.join(', ')}]`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  return { steps, snapshot: state };
}

export function trieDelete(state: TrieState, word: string): DSResult<TrieState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTrie(state);

  steps.push(
    step(`Delete "${word}" from trie. We unmark the end-of-word flag and clean up nodes that are no longer part of any other word's prefix.`, [
      { targetId: s.root.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // Walk to the node, tracking the path
  const path: { node: TrieNode; char: string }[] = [];
  let current = s.root;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (!current.children.has(ch)) {
      steps.push(step(`'${ch}' not found -- "${word}" does not exist`, []));
      return { steps, snapshot: s };
    }
    path.push({ node: current, char: ch });
    const child = current.children.get(ch)!;
    steps.push(
      step(`Traverse '${ch}'`, [
        { targetId: child.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    current = child;
  }

  if (!current.isEndOfWord) {
    steps.push(step(`"${word}" is not a complete word -- nothing to delete`, []));
    return { steps, snapshot: s };
  }

  // Unmark end of word
  current.isEndOfWord = false;
  steps.push(
    step(`Unmark end-of-word for "${word}"`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Cleanup: remove nodes that are no longer needed
  for (let i = path.length - 1; i >= 0; i--) {
    const { node: parentNode, char: ch } = path[i];
    const child = parentNode.children.get(ch)!;

    // If child has no children and is not end of word, remove it
    if (child.children.size === 0 && !child.isEndOfWord) {
      parentNode.children.delete(ch);
      steps.push(
        step(`Remove unused node '${ch}'`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'deleting' },
        ]),
      );
    } else {
      break;
    }
  }

  s.words = s.words.filter((w) => w !== word);
  s.size--;

  steps.push(step(`Deleted "${word}". Size: ${s.size}`, []));
  return { steps, snapshot: s };
}

export function trieAutoComplete(state: TrieState, prefix: string, limit: number = 10): DSResult<TrieState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Autocomplete for prefix "${prefix}" (limit ${limit}). We navigate to the prefix node, then DFS to collect all complete words below — this is why tries power autocomplete and search suggestions.`, [
      { targetId: state.root.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  let current = state.root;

  // Navigate to the prefix node
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];

    if (current.children.has(ch)) {
      const child = current.children.get(ch)!;
      steps.push(
        step(`'${ch}' found -- descend`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      current = child;
    } else {
      steps.push(step(`'${ch}' not found -- no completions for "${prefix}"`, []));
      return { steps, snapshot: state };
    }
  }

  // DFS to collect words under this prefix, up to `limit`
  const matches: string[] = [];

  function dfs(node: TrieNode, path: string): void {
    if (matches.length >= limit) return;

    if (node.isEndOfWord) {
      matches.push(path);
      steps.push(
        step(`Collected word "${path}"`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
    }

    // Sort children alphabetically for deterministic order
    const sorted = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [ch, child] of sorted) {
      if (matches.length >= limit) return;
      steps.push(
        step(`DFS descend to '${ch}'`, [
          { targetId: child.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      dfs(child, path + ch);
    }
  }

  dfs(current, prefix);

  steps.push(
    step(
      matches.length > 0
        ? `Autocomplete found ${matches.length} result(s): [${matches.join(', ')}]`
        : `No completions found for "${prefix}"`,
      [],
    ),
  );

  return { steps, snapshot: state };
}
