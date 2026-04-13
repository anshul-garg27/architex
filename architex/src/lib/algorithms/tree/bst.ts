// -----------------------------------------------------------------
// Architex -- BST Operations with Step Recording  (ALG-034)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const BST_CONFIG: AlgorithmConfig = {
  id: 'bst-operations',
  name: 'BST Insert / Search / Delete',
  category: 'tree',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Binary Search Tree operations: insert places a value at the correct leaf; search traverses comparing at each node; delete handles leaf, one-child, and two-children (in-order successor) cases.',
  pseudocode: [
    'procedure insert(root, value)',
    '  if root is null: return new Node(value)',
    '  if value < root.value:',
    '    root.left = insert(root.left, value)',
    '  else if value > root.value:',
    '    root.right = insert(root.right, value)',
    '  return root',
    'procedure search(root, value)',
    '  if root is null: return NOT FOUND',
    '  if value == root.value: return FOUND',
    '  if value < root.value: search(root.left, value)',
    '  else: search(root.right, value)',
    'procedure delete(root, value)',
    '  find node; handle leaf / one child / two children',
    '  for two children: replace with in-order successor',
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

let _nextId = 1000;
function nextId(): string {
  return `n_${_nextId++}`;
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'ease-out' };
}

// ── BST Insert ──────────────────────────────────────────────

export function bstInsert(
  root: TreeNode | null,
  value: number,
): AlgorithmResult {
  const tree = cloneTree(root);
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
      duration: 400,
    });
  }

  function insert(node: TreeNode | null, parent: TreeNode | null, isLeft: boolean): TreeNode {
    if (!node) {
      const newNode: TreeNode = { id: nextId(), value, left: null, right: null };
      writes++;
      record(
        `Insert ${value} as ${parent ? (isLeft ? 'left' : 'right') + ' child of ' + parent.value : 'root'}`,
        1,
        [mut(newNode.id, 'highlight', 'default', 'inserting')],
      );
      return newNode;
    }

    reads++;
    comparisons++;

    if (value < node.value) {
      record(
        `${value} < ${node.value} -- go left. The BST property guarantees all smaller values are in the left subtree, so we can skip the entire right side.`,
        2,
        [
          mut(node.id, 'highlight', 'default', 'visiting'),
        ],
      );
      node.left = insert(node.left, node, true);
    } else if (value > node.value) {
      record(
        `${value} > ${node.value} -- go right`,
        4,
        [
          mut(node.id, 'highlight', 'default', 'visiting'),
        ],
      );
      node.right = insert(node.right, node, false);
    } else {
      record(
        `${value} == ${node.value} -- duplicate, skip`,
        5,
        [mut(node.id, 'highlight', 'default', 'found')],
      );
    }

    record(
      `Backtrack from ${node.value}`,
      6,
      [mut(node.id, 'highlight', 'visiting', 'visited')],
    );

    return node;
  }

  const resultTree = insert(tree, null, false);

  // Flatten tree values for finalState
  const finalState: number[] = [];
  function inorder(n: TreeNode | null): void {
    if (!n) return;
    inorder(n.left);
    finalState.push(n.value);
    inorder(n.right);
  }
  inorder(resultTree);

  return { config: BST_CONFIG, steps, finalState };
}

// ── BST Search ──────────────────────────────────────────────

export function bstSearch(
  root: TreeNode | null,
  value: number,
): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;

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

  record(`Search for ${value} in BST`, 7, []);

  function search(node: TreeNode | null): boolean {
    if (!node) {
      record(`Reached null node -- ${value} NOT FOUND`, 8, []);
      return false;
    }

    reads++;
    comparisons++;

    record(
      `Compare ${value} with ${node.value}`,
      9,
      [mut(node.id, 'highlight', 'default', 'current')],
    );

    if (value === node.value) {
      record(
        `${value} == ${node.value} -- FOUND!`,
        9,
        [mut(node.id, 'highlight', 'current', 'found')],
      );
      return true;
    } else if (value < node.value) {
      record(
        `${value} < ${node.value} -- search left subtree`,
        10,
        [mut(node.id, 'highlight', 'current', 'visited')],
      );
      return search(node.left);
    } else {
      record(
        `${value} > ${node.value} -- search right subtree`,
        11,
        [mut(node.id, 'highlight', 'current', 'visited')],
      );
      return search(node.right);
    }
  }

  search(root);

  return { config: BST_CONFIG, steps, finalState: [] };
}

// ── BST Delete ──────────────────────────────────────────────

export function bstDelete(
  root: TreeNode | null,
  value: number,
): AlgorithmResult {
  const tree = cloneTree(root);
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
      duration: 400,
    });
  }

  function findMin(node: TreeNode): TreeNode {
    let curr = node;
    while (curr.left) {
      reads++;
      curr = curr.left;
    }
    return curr;
  }

  function deleteNode(node: TreeNode | null): TreeNode | null {
    if (!node) {
      record(`Reached null -- ${value} not in tree`, 12, []);
      return null;
    }

    reads++;
    comparisons++;

    if (value < node.value) {
      record(
        `${value} < ${node.value} -- search left`,
        12,
        [mut(node.id, 'highlight', 'default', 'visiting')],
      );
      node.left = deleteNode(node.left);
      return node;
    } else if (value > node.value) {
      record(
        `${value} > ${node.value} -- search right`,
        12,
        [mut(node.id, 'highlight', 'default', 'visiting')],
      );
      node.right = deleteNode(node.right);
      return node;
    }

    // Found the node to delete
    record(
      `Found ${value} -- deleting`,
      13,
      [mut(node.id, 'highlight', 'default', 'deleting')],
    );

    // Case 1: Leaf node
    if (!node.left && !node.right) {
      writes++;
      record(
        `${value} is a leaf -- remove it`,
        13,
        [mut(node.id, 'opacity', 1, 0)],
      );
      return null;
    }

    // Case 2: One child
    if (!node.left) {
      writes++;
      record(
        `${value} has only right child -- replace with right child`,
        13,
        [
          mut(node.id, 'opacity', 1, 0),
          mut(node.right!.id, 'highlight', 'default', 'inserting'),
        ],
      );
      return node.right;
    }
    if (!node.right) {
      writes++;
      record(
        `${value} has only left child -- replace with left child`,
        13,
        [
          mut(node.id, 'opacity', 1, 0),
          mut(node.left.id, 'highlight', 'default', 'inserting'),
        ],
      );
      return node.left;
    }

    // Case 3: Two children -- replace with in-order successor
    const successor = findMin(node.right);
    record(
      `${value} has two children -- in-order successor is ${successor.value}`,
      14,
      [mut(successor.id, 'highlight', 'default', 'found')],
    );

    writes++;
    node.value = successor.value;
    record(
      `Replace ${value} with successor value ${successor.value}`,
      14,
      [mut(node.id, 'highlight', 'found', 'inserting')],
    );

    // Now delete the successor from the right subtree
    node.right = deleteRecurse(node.right, successor.value);
    return node;
  }

  /** Internal delete used when removing the in-order successor. */
  function deleteRecurse(node: TreeNode | null, val: number): TreeNode | null {
    if (!node) return null;
    reads++;
    comparisons++;

    if (val < node.value) {
      node.left = deleteRecurse(node.left, val);
    } else if (val > node.value) {
      node.right = deleteRecurse(node.right, val);
    } else {
      writes++;
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      const succ = findMin(node.right);
      node.value = succ.value;
      node.right = deleteRecurse(node.right, succ.value);
    }
    return node;
  }

  const resultTree = deleteNode(tree);

  const finalState: number[] = [];
  function inorder(n: TreeNode | null): void {
    if (!n) return;
    inorder(n.left);
    finalState.push(n.value);
    inorder(n.right);
  }
  inorder(resultTree);

  return { config: BST_CONFIG, steps, finalState };
}
