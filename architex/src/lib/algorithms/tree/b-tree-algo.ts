// -----------------------------------------------------------------
// Architex -- B-Tree Insert with Page-Split Animation  (ALG-037)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Config ──────────────────────────────────────────────────

export const B_TREE_CONFIG: AlgorithmConfig = {
  id: 'b-tree',
  name: 'B-Tree (Insert)',
  category: 'tree',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Balanced multi-way search tree with configurable order (3-5). Each node holds up to order-1 keys. Insertions may trigger page splits that propagate upward.',
  pseudocode: [
    'procedure bTreeInsert(root, key, order)',
    '  if root is null: create leaf with key',
    '  find leaf node for key',
    '  insert key into leaf in sorted order',
    '  if leaf.keys.length == order:',
    '    splitChild(leaf)',
    'procedure splitChild(node)',
    '  mid = floor(keys.length / 2)',
    '  median = node.keys[mid]',
    '  leftNode = keys[0..mid-1]',
    '  rightNode = keys[mid+1..end]',
    '  push median up to parent',
    '  if parent is null: create new root with median',
    '  if parent.keys.length == order: splitChild(parent)',
  ],
};

// ── B-Tree node (not the same as binary TreeNode) ───────────

export interface BTreeNode {
  id: string;
  keys: number[];
  children: BTreeNode[];
  leaf: boolean;
}

let _nextId = 4000;
function nextId(): string {
  return `bt_${_nextId++}`;
}

function cloneBTree(node: BTreeNode | null): BTreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map((c) => cloneBTree(c)!),
    leaf: node.leaf,
  };
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `btnode-${nodeId}`, property, from, to, easing: 'spring' };
}

// ── B-Tree Insert ───────────────────────────────────────────

export function bTreeInsert(
  root: BTreeNode | null,
  key: number,
  order: number = 3,
): AlgorithmResult {
  // Clamp order to 3-5
  const t = Math.max(3, Math.min(5, order));
  const maxKeys = t - 1;

  let tree = root ? cloneBTree(root)! : null;
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

  function splitChild(parent: BTreeNode, childIdx: number): void {
    const child = parent.children[childIdx];
    const midIdx = Math.floor(child.keys.length / 2);
    const median = child.keys[midIdx];

    record(
      `Split node [${child.keys.join(', ')}] — median ${median} pushed up`,
      6,
      [
        mut(child.id, 'highlight', 'default', 'deleting'),
        mut(child.id, 'scale', 1, 1.15),
      ],
    );

    const leftNode: BTreeNode = {
      id: nextId(),
      keys: child.keys.slice(0, midIdx),
      children: child.leaf ? [] : child.children.slice(0, midIdx + 1),
      leaf: child.leaf,
    };
    const rightNode: BTreeNode = {
      id: nextId(),
      keys: child.keys.slice(midIdx + 1),
      children: child.leaf ? [] : child.children.slice(midIdx + 1),
      leaf: child.leaf,
    };

    writes += 3;

    // Insert median into parent
    const insertPos = parent.keys.findIndex((k) => k > median);
    const pos = insertPos === -1 ? parent.keys.length : insertPos;
    parent.keys.splice(pos, 0, median);
    parent.children.splice(childIdx, 1, leftNode, rightNode);

    record(
      `After split: parent now [${parent.keys.join(', ')}], left=[${leftNode.keys.join(', ')}], right=[${rightNode.keys.join(', ')}]`,
      11,
      [
        mut(parent.id, 'highlight', 'default', 'visited'),
        mut(leftNode.id, 'highlight', 'default', 'inserting'),
        mut(rightNode.id, 'highlight', 'default', 'inserting'),
      ],
    );
  }

  function insertNonFull(node: BTreeNode, k: number): void {
    reads++;

    if (node.leaf) {
      // Insert key in sorted position
      const insertPos = node.keys.findIndex((key) => key > k);
      const pos = insertPos === -1 ? node.keys.length : insertPos;
      node.keys.splice(pos, 0, k);
      writes++;

      record(
        `Insert ${k} into leaf [${node.keys.join(', ')}]`,
        3,
        [
          mut(node.id, 'highlight', 'default', 'inserting'),
          mut(node.id, 'label', '', `[${node.keys.join(', ')}]`),
        ],
      );
    } else {
      // Find the child to descend into
      let i = node.keys.length - 1;
      while (i >= 0 && k < node.keys[i]) {
        comparisons++;
        i--;
      }
      i++;

      record(
        `Traverse node [${node.keys.join(', ')}] — descend to child ${i}`,
        2,
        [mut(node.id, 'highlight', 'default', 'visiting')],
      );

      // If the child is full, split it first
      if (node.children[i].keys.length >= t) {
        splitChild(node, i);
        // After split, median moved up; figure out which child to go to
        if (k > node.keys[i]) {
          i++;
        }
      }

      insertNonFull(node.children[i], k);
    }
  }

  // ── Execute ──
  record(`B-Tree Insert: inserting ${key} (order=${t})`, 0, []);

  if (!tree) {
    tree = { id: nextId(), keys: [key], children: [], leaf: true };
    writes++;
    record(
      `Tree empty — create root [${key}]`,
      1,
      [mut(tree.id, 'highlight', 'default', 'inserting')],
    );
  } else if (tree.keys.length >= t) {
    // Root is full — split root
    const oldRoot = tree;
    tree = { id: nextId(), keys: [], children: [oldRoot], leaf: false };
    writes++;
    record(
      `Root [${oldRoot.keys.join(', ')}] is full — create new root and split`,
      5,
      [mut(tree.id, 'highlight', 'default', 'inserting')],
    );
    splitChild(tree, 0);
    insertNonFull(tree, key);
  } else {
    insertNonFull(tree, key);
  }

  // Collect all keys in sorted order for finalState
  const finalState: number[] = [];
  function collectKeys(node: BTreeNode | null): void {
    if (!node) return;
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.leaf && node.children[i]) {
        collectKeys(node.children[i]);
      }
      finalState.push(node.keys[i]);
    }
    if (!node.leaf && node.children[node.keys.length]) {
      collectKeys(node.children[node.keys.length]);
    }
  }
  collectKeys(tree);

  return { config: B_TREE_CONFIG, steps, finalState };
}
