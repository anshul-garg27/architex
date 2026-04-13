// -----------------------------------------------------------------
// Architex -- Red-Black Tree Insert with Color-Flip & Rotations  (ALG-036)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const RED_BLACK_CONFIG: AlgorithmConfig = {
  id: 'red-black-tree',
  name: 'Red-Black Tree (Insert)',
  category: 'tree',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Self-balancing BST where every node is colored red or black. Maintains five invariants via color flips, left rotations, and right rotations after each insert.',
  pseudocode: [
    'procedure rbInsert(root, value)',
    '  insert node as red leaf (BST insert)',
    '  fixup(node)',
    'procedure fixup(z)',
    '  while z.parent is RED:',
    '    if z.parent is left child:',
    '      y = uncle (right child of grandparent)',
    '      Case 1: uncle is RED → color flip',
    '        recolor parent & uncle BLACK, grandparent RED',
    '        z = grandparent',
    '      Case 2: z is right child → left rotate parent',
    '        z = z.parent; leftRotate(z)',
    '      Case 3: z is left child → right rotate grandparent',
    '        recolor parent BLACK, grandparent RED',
    '        rightRotate(grandparent)',
    '    else: symmetric (swap left/right)',
    '  root.color = BLACK',
  ],
};

// ── Helpers ─────────────────────────────────────────────────

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

let _nextId = 3000;
function nextId(): string {
  return `rb_${_nextId++}`;
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'spring' };
}

function isRed(node: TreeNode | null): boolean {
  return node?.color === 'red';
}

// ── RB Insert (left-leaning style with parent pointers via stack) ──

interface RBNode extends TreeNode {
  parent: RBNode | null;
  left: RBNode | null;
  right: RBNode | null;
}

function toRB(node: TreeNode | null, parent: RBNode | null): RBNode | null {
  if (!node) return null;
  const rb: RBNode = {
    ...node,
    color: node.color ?? 'black',
    parent,
    left: null,
    right: null,
  };
  rb.left = toRB(node.left, rb);
  rb.right = toRB(node.right, rb);
  return rb;
}

function stripParent(node: RBNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    color: node.color,
    left: stripParent(node.left),
    right: stripParent(node.right),
  };
}

export function rbInsert(
  root: TreeNode | null,
  value: number,
): AlgorithmResult {
  let rbRoot = toRB(cloneTree(root), null);
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
      duration: 500,
    });
  }

  // ── BST insert ──
  function bstInsert(node: RBNode | null, parent: RBNode | null): RBNode {
    if (!node) {
      const newNode: RBNode = {
        id: nextId(),
        value,
        color: 'red',
        left: null,
        right: null,
        parent,
      };
      writes++;
      record(
        `Insert ${value} as RED leaf`,
        1,
        [
          mut(newNode.id, 'highlight', 'default', 'inserting'),
          mut(newNode.id, 'fill', 'default', 'red'),
        ],
      );
      return newNode;
    }

    reads++;
    comparisons++;

    if (value < node.value) {
      record(`${value} < ${node.value} -- go left`, 1, [
        mut(node.id, 'highlight', 'default', 'visiting'),
      ]);
      node.left = bstInsert(node.left, node);
    } else if (value > node.value) {
      record(`${value} > ${node.value} -- go right`, 1, [
        mut(node.id, 'highlight', 'default', 'visiting'),
      ]);
      node.right = bstInsert(node.right, node);
    } else {
      record(`${value} == ${node.value} -- duplicate, skip`, 1, [
        mut(node.id, 'highlight', 'default', 'found'),
      ]);
    }
    return node;
  }

  // ── Rotations ──
  function leftRotate(x: RBNode): void {
    const y = x.right!;
    record(`Left rotation on ${x.value}`, 11, [
      mut(x.id, 'highlight', 'default', 'rotating'),
      mut(y.id, 'highlight', 'default', 'rotating'),
    ]);
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) {
      rbRoot = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
    y.left = x;
    x.parent = y;
    writes += 3;
    record(`After left rotation: ${y.value} replaces ${x.value}`, 11, [
      mut(x.id, 'highlight', 'rotating', 'visited'),
      mut(y.id, 'highlight', 'rotating', 'visited'),
    ]);
  }

  function rightRotate(y: RBNode): void {
    const x = y.left!;
    record(`Right rotation on ${y.value}`, 14, [
      mut(y.id, 'highlight', 'default', 'rotating'),
      mut(x.id, 'highlight', 'default', 'rotating'),
    ]);
    y.left = x.right;
    if (x.right) x.right.parent = y;
    x.parent = y.parent;
    if (!y.parent) {
      rbRoot = x;
    } else if (y === y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }
    x.right = y;
    y.parent = x;
    writes += 3;
    record(`After right rotation: ${x.value} replaces ${y.value}`, 14, [
      mut(y.id, 'highlight', 'rotating', 'visited'),
      mut(x.id, 'highlight', 'rotating', 'visited'),
    ]);
  }

  // ── Fix-up ──
  function fixup(z: RBNode): void {
    while (z.parent && z.parent.color === 'red') {
      if (z.parent === z.parent.parent?.left) {
        const uncle = z.parent.parent.right;

        if (uncle && uncle.color === 'red') {
          // Case 1: color flip
          record(
            `Case 1 (color flip): uncle ${uncle.value} is RED -- recolor`,
            7,
            [
              mut(z.parent.id, 'fill', 'red', 'black'),
              mut(uncle.id, 'fill', 'red', 'black'),
              mut(z.parent.parent.id, 'fill', 'black', 'red'),
            ],
          );
          z.parent.color = 'black';
          uncle.color = 'black';
          z.parent.parent.color = 'red';
          writes += 3;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            // Case 2: z is right child -- left rotate
            record(
              `Case 2: ${z.value} is right child -- left rotate parent ${z.parent.value}`,
              10,
              [],
            );
            z = z.parent;
            leftRotate(z);
          }
          // Case 3: z is left child -- right rotate grandparent
          record(
            `Case 3: recolor and right rotate grandparent ${z.parent!.parent!.value}`,
            13,
            [
              mut(z.parent!.id, 'fill', 'red', 'black'),
              mut(z.parent!.parent!.id, 'fill', 'black', 'red'),
            ],
          );
          z.parent!.color = 'black';
          z.parent!.parent!.color = 'red';
          writes += 2;
          rightRotate(z.parent!.parent!);
        }
      } else {
        // Symmetric: parent is right child
        const uncle = z.parent.parent?.left ?? null;

        if (uncle && uncle.color === 'red') {
          record(
            `Case 1 (symmetric, color flip): uncle ${uncle.value} is RED -- recolor`,
            7,
            [
              mut(z.parent.id, 'fill', 'red', 'black'),
              mut(uncle.id, 'fill', 'red', 'black'),
              mut(z.parent.parent!.id, 'fill', 'black', 'red'),
            ],
          );
          z.parent.color = 'black';
          uncle.color = 'black';
          z.parent.parent!.color = 'red';
          writes += 3;
          z = z.parent.parent!;
        } else {
          if (z === z.parent.left) {
            record(
              `Case 2 (symmetric): ${z.value} is left child -- right rotate parent ${z.parent.value}`,
              10,
              [],
            );
            z = z.parent;
            rightRotate(z);
          }
          record(
            `Case 3 (symmetric): recolor and left rotate grandparent ${z.parent!.parent!.value}`,
            13,
            [
              mut(z.parent!.id, 'fill', 'red', 'black'),
              mut(z.parent!.parent!.id, 'fill', 'black', 'red'),
            ],
          );
          z.parent!.color = 'black';
          z.parent!.parent!.color = 'red';
          writes += 2;
          leftRotate(z.parent!.parent!);
        }
      }
    }

    rbRoot!.color = 'black';
    record('Ensure root is BLACK', 16, [
      mut(rbRoot!.id, 'fill', 'red', 'black'),
    ]);
  }

  // ── Execute ──
  record(`RB Insert: inserting ${value}`, 0, []);

  // Find the inserted node after BST insert
  let insertedNode: RBNode | null = null;
  const originalBstInsert = bstInsert;
  function bstInsertTracked(node: RBNode | null, parent: RBNode | null): RBNode {
    const result = originalBstInsert(node, parent);
    if (result.value === value && result.color === 'red' && !insertedNode) {
      insertedNode = result;
    }
    return result;
  }

  rbRoot = bstInsertTracked(rbRoot, null);
  if (insertedNode) {
    fixup(insertedNode);
  }

  // Collect final in-order state
  const finalState: number[] = [];
  function inorder(n: RBNode | null): void {
    if (!n) return;
    inorder(n.left);
    finalState.push(n.value);
    inorder(n.right);
  }
  inorder(rbRoot);

  return { config: RED_BLACK_CONFIG, steps, finalState };
}
