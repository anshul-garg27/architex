// -----------------------------------------------------------------
// Architex -- AVL Tree with Rotation Visualization  (ALG-035)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const AVL_CONFIG: AlgorithmConfig = {
  id: 'avl-tree',
  name: 'AVL Tree (Insert)',
  category: 'tree',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Self-balancing BST where the balance factor of every node is in {-1, 0, 1}. Inserts rebalance via single or double rotations (LL, RR, LR, RL).',
  pseudocode: [
    'procedure avlInsert(root, value)',
    '  if root is null: return new Node(value)',
    '  if value < root: avlInsert(root.left, value)',
    '  else: avlInsert(root.right, value)',
    '  update height and balance factor',
    '  if bf > 1 and value < root.left.value: rightRotate(root)   // LL',
    '  if bf < -1 and value > root.right.value: leftRotate(root)  // RR',
    '  if bf > 1 and value > root.left.value: LR rotation',
    '  if bf < -1 and value < root.right.value: RL rotation',
    '  return root',
    'procedure rightRotate(y)',
    '  x = y.left; T2 = x.right',
    '  x.right = y; y.left = T2',
    '  update heights; return x',
    'procedure leftRotate(x)',
    '  y = x.right; T2 = y.left',
    '  y.left = x; x.right = T2',
    '  update heights; return y',
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

let _nextId = 2000;
function nextId(): string {
  return `avl_${_nextId++}`;
}

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'spring' };
}

function getHeight(node: TreeNode | null): number {
  return node?.height ?? 0;
}

function getBalanceFactor(node: TreeNode | null): number {
  if (!node) return 0;
  return getHeight(node.left) - getHeight(node.right);
}

function updateHeight(node: TreeNode): void {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  node.balanceFactor = getBalanceFactor(node);
}

// ── AVL Insert ──────────────────────────────────────────────

export function avlInsert(
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
      duration: 500,
    });
  }

  // WHY rotation works: a rotation restructures the subtree in O(1) by re-parenting
  // at most 3 pointers. Crucially, it preserves the BST ordering invariant (left < root
  // < right) because it only moves subtrees that are already correctly ordered relative
  // to each other. This is the key insight that makes self-balancing trees practical.
  function rightRotate(y: TreeNode): TreeNode {
    const x = y.left!;
    const T2 = x.right;

    record(
      `Right rotation on ${y.value} (LL case). The balance factor exceeds 1 — the tree is too heavy on one side. A rotation rebalances in O(1) without losing the BST property.`,
      10,
      [
        mut(y.id, 'highlight', 'default', 'rotating'),
        mut(x.id, 'highlight', 'default', 'rotating'),
      ],
    );

    x.right = y;
    y.left = T2;
    writes += 2;

    updateHeight(y);
    updateHeight(x);

    record(
      `After right rotation: ${x.value} is new root of subtree (bf=${x.balanceFactor ?? 0})`,
      13,
      [
        mut(x.id, 'highlight', 'rotating', 'visited'),
        mut(y.id, 'highlight', 'rotating', 'visited'),
      ],
    );

    return x;
  }

  // WHY left rotation mirrors right rotation: RR imbalance (right-right heavy) is
  // the symmetric case of LL. The same pointer re-wiring logic applies, just mirrored.
  function leftRotate(x: TreeNode): TreeNode {
    const y = x.right!;
    const T2 = y.left;

    record(
      `Left rotation on ${x.value} (RR case)`,
      14,
      [
        mut(x.id, 'highlight', 'default', 'rotating'),
        mut(y.id, 'highlight', 'default', 'rotating'),
      ],
    );

    y.left = x;
    x.right = T2;
    writes += 2;

    updateHeight(x);
    updateHeight(y);

    record(
      `After left rotation: ${y.value} is new root of subtree (bf=${y.balanceFactor ?? 0})`,
      17,
      [
        mut(y.id, 'highlight', 'rotating', 'visited'),
        mut(x.id, 'highlight', 'rotating', 'visited'),
      ],
    );

    return y;
  }

  function insert(node: TreeNode | null): TreeNode {
    if (!node) {
      const newNode: TreeNode = {
        id: nextId(),
        value,
        left: null,
        right: null,
        height: 1,
        balanceFactor: 0,
      };
      writes++;
      record(
        `Insert new node ${value}`,
        1,
        [mut(newNode.id, 'highlight', 'default', 'inserting')],
      );
      return newNode;
    }

    reads++;
    comparisons++;

    if (value < node.value) {
      record(
        `${value} < ${node.value} -- go left`,
        2,
        [mut(node.id, 'highlight', 'default', 'visiting')],
      );
      node.left = insert(node.left);
    } else if (value > node.value) {
      record(
        `${value} > ${node.value} -- go right`,
        3,
        [mut(node.id, 'highlight', 'default', 'visiting')],
      );
      node.right = insert(node.right);
    } else {
      record(
        `${value} == ${node.value} -- duplicate, skip`,
        3,
        [mut(node.id, 'highlight', 'default', 'found')],
      );
      return node;
    }

    // WHY we update height bottom-up: the insert happened in a subtree, which may
    // have grown taller. Recalculating height after recursion lets us detect if the
    // balance factor has drifted outside {-1, 0, 1} and needs correction.
    updateHeight(node);
    writes++;

    // WHY the balance factor determines rotation type: bf > 1 means left-heavy,
    // bf < -1 means right-heavy. The direction of the inserted value relative to
    // the child determines whether a single or double rotation is needed (LL/RR
    // vs LR/RL). This four-case analysis covers all possible AVL imbalances.
    const bf = node.balanceFactor!;

    record(
      `Update ${node.value}: height=${node.height}, bf=${bf}`,
      4,
      [
        mut(node.id, 'label', '', `bf=${bf}`),
        mut(node.id, 'highlight', 'visiting', bf > 1 || bf < -1 ? 'deleting' : 'visited'),
      ],
    );

    // LL case
    if (bf > 1 && node.left && value < node.left.value) {
      record(`Imbalance at ${node.value} (bf=${bf}): LL case`, 5, []);
      return rightRotate(node);
    }

    // RR case
    if (bf < -1 && node.right && value > node.right.value) {
      record(`Imbalance at ${node.value} (bf=${bf}): RR case`, 6, []);
      return leftRotate(node);
    }

    // WHY double rotation for LR/RL: a single rotation can't fix a "zig-zag"
    // imbalance. The first rotation straightens the zig-zag into a straight line
    // (converting LR to LL, or RL to RR), then the second rotation fixes it.
    if (bf > 1 && node.left && value > node.left.value) {
      record(`Imbalance at ${node.value} (bf=${bf}): LR case -- left rotate on ${node.left.value} first`, 7, []);
      node.left = leftRotate(node.left);
      return rightRotate(node);
    }

    // RL case
    if (bf < -1 && node.right && value < node.right.value) {
      record(`Imbalance at ${node.value} (bf=${bf}): RL case -- right rotate on ${node.right.value} first`, 8, []);
      node.right = rightRotate(node.right);
      return leftRotate(node);
    }

    return node;
  }

  // Ensure all existing nodes have height set
  function initHeights(node: TreeNode | null): void {
    if (!node) return;
    initHeights(node.left);
    initHeights(node.right);
    updateHeight(node);
  }

  if (tree) initHeights(tree);

  record(`AVL Insert: inserting ${value}`, 0, []);
  const resultTree = insert(tree);

  const finalState: number[] = [];
  function inorder(n: TreeNode | null): void {
    if (!n) return;
    inorder(n.left);
    finalState.push(n.value);
    inorder(n.right);
  }
  inorder(resultTree);

  return { config: AVL_CONFIG, steps, finalState };
}
