// -----------------------------------------------------------------
// Architex -- Huffman Encoding Tree Construction  (ALG-038)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const HUFFMAN_CONFIG: AlgorithmConfig = {
  id: 'huffman-tree',
  name: 'Huffman Encoding Tree',
  category: 'tree',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Greedy algorithm that builds an optimal prefix-free encoding tree. Counts character frequencies, repeatedly merges the two lowest-frequency nodes, and produces a variable-length binary encoding table.',
  pseudocode: [
    'procedure huffman(text)',
    '  freq = buildFrequencyTable(text)',
    '  Q = min-priority queue of leaf nodes',
    '  while Q.size > 1:',
    '    left = Q.extractMin()',
    '    right = Q.extractMin()',
    '    merged = new Node(freq=left.freq+right.freq)',
    '    merged.left = left; merged.right = right',
    '    Q.insert(merged)',
    '  root = Q.extractMin()',
    '  assignCodes(root, "")',
    'procedure assignCodes(node, prefix)',
    '  if node is leaf: encoding[node.char] = prefix',
    '  assignCodes(node.left, prefix + "0")',
    '  assignCodes(node.right, prefix + "1")',
  ],
};

// ── Huffman-specific node ───────────────────────────────────

export interface HuffmanNode extends TreeNode {
  char: string | null; // null for internal nodes
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

export interface HuffmanEncodingEntry {
  char: string;
  freq: number;
  code: string;
}

export interface HuffmanResult extends AlgorithmResult {
  encodingTable: HuffmanEncodingEntry[];
  root: HuffmanNode;
}

// ── Helpers ─────────────────────────────────────────────────

let _nextId = 5000;
function nextId(): string {
  return `huf_${_nextId++}`;
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'spring' };
}

// ── Build frequency table ───────────────────────────────────

export function buildFrequencyTable(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const ch of text) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  return freq;
}

// ── Huffman Tree Construction ───────────────────────────────

export function huffmanBuild(text: string): HuffmanResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

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
      duration: 600,
    });
  }

  // Step 1: frequency table
  const freq = buildFrequencyTable(text);
  record(
    `Build frequency table from "${text.length > 30 ? text.slice(0, 30) + '...' : text}" (${freq.size} unique chars)`,
    1,
    [],
  );

  // Step 2: create leaf nodes
  const queue: HuffmanNode[] = [];
  for (const [char, count] of freq) {
    const node: HuffmanNode = {
      id: nextId(),
      value: count,
      char,
      freq: count,
      left: null,
      right: null,
    };
    queue.push(node);
    writes++;
  }

  // Sort by frequency (ascending)
  queue.sort((a, b) => a.freq - b.freq);

  record(
    `Created ${queue.length} leaf nodes, sorted by frequency: ${queue.map((n) => `'${n.char}'=${n.freq}`).join(', ')}`,
    2,
    queue.map((n) => mut(n.id, 'highlight', 'default', 'inserting')),
  );

  // Handle edge cases
  if (queue.length === 0) {
    const emptyRoot: HuffmanNode = {
      id: nextId(),
      value: 0,
      char: null,
      freq: 0,
      left: null,
      right: null,
    };
    return {
      config: HUFFMAN_CONFIG,
      steps,
      finalState: [],
      encodingTable: [],
      root: emptyRoot,
    };
  }

  if (queue.length === 1) {
    const onlyNode = queue[0];
    const root: HuffmanNode = {
      id: nextId(),
      value: onlyNode.freq,
      char: null,
      freq: onlyNode.freq,
      left: onlyNode,
      right: null,
    };
    record(`Single character '${onlyNode.char}' — wrap in root`, 9, [
      mut(root.id, 'highlight', 'default', 'visited'),
    ]);
    return {
      config: HUFFMAN_CONFIG,
      steps,
      finalState: [onlyNode.freq],
      encodingTable: [{ char: onlyNode.char!, freq: onlyNode.freq, code: '0' }],
      root,
    };
  }

  // Step 3: merge loop
  while (queue.length > 1) {
    // Extract two minimums
    queue.sort((a, b) => a.freq - b.freq);
    comparisons += queue.length;

    const left = queue.shift()!;
    const right = queue.shift()!;
    reads += 2;

    record(
      `Extract min: '${left.char ?? '(' + left.freq + ')'}' (freq=${left.freq}) and '${right.char ?? '(' + right.freq + ')'}' (freq=${right.freq})`,
      4,
      [
        mut(left.id, 'highlight', 'default', 'current'),
        mut(right.id, 'highlight', 'default', 'current'),
      ],
    );

    const merged: HuffmanNode = {
      id: nextId(),
      value: left.freq + right.freq,
      char: null,
      freq: left.freq + right.freq,
      left,
      right,
    };
    writes++;

    record(
      `Merge into internal node (freq=${merged.freq}), left='${left.char ?? left.freq}', right='${right.char ?? right.freq}'`,
      6,
      [
        mut(merged.id, 'highlight', 'default', 'inserting'),
        mut(left.id, 'highlight', 'current', 'visited'),
        mut(right.id, 'highlight', 'current', 'visited'),
      ],
    );

    queue.push(merged);

    record(
      `Queue now has ${queue.length} node(s): [${queue.map((n) => n.freq).join(', ')}]`,
      8,
      [],
    );
  }

  const root = queue[0];
  record(`Huffman tree complete — root freq=${root.freq}`, 9, [
    mut(root.id, 'highlight', 'default', 'found'),
  ]);

  // Step 4: assign codes
  const encodingTable: HuffmanEncodingEntry[] = [];

  function assignCodes(node: HuffmanNode | null, prefix: string): void {
    if (!node) return;
    if (node.char !== null) {
      encodingTable.push({ char: node.char, freq: node.freq, code: prefix || '0' });
      record(
        `Assign code '${node.char}' → ${prefix || '0'}`,
        12,
        [mut(node.id, 'label', '', `${node.char}=${prefix || '0'}`)],
      );
      return;
    }
    assignCodes(node.left, prefix + '0');
    assignCodes(node.right, prefix + '1');
  }

  record('Assigning binary codes via tree traversal', 10, []);
  assignCodes(root, '');

  // Sort encoding table by code length then alphabetically
  encodingTable.sort((a, b) => a.code.length - b.code.length || a.char.localeCompare(b.char));

  record(
    `Encoding table: ${encodingTable.map((e) => `'${e.char}'=${e.code}`).join(', ')}`,
    14,
    [],
  );

  // Final state: frequencies in sorted order
  const finalState = encodingTable.map((e) => e.freq);

  return { config: HUFFMAN_CONFIG, steps, finalState, encodingTable, root };
}
