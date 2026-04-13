// -----------------------------------------------------------------
// Architex -- Tree Traversals with Step Recording  (ALG-040 partial)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { TreeNode } from './types';

// ── Config ──────────────────────────────────────────────────

export const TRAVERSAL_CONFIG: AlgorithmConfig = {
  id: 'tree-traversals',
  name: 'Tree Traversals',
  category: 'tree',
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(h)',
  description:
    'Four standard tree traversals: Inorder (Left, Root, Right), Preorder (Root, Left, Right), Postorder (Left, Right, Root), and Level-order (BFS).',
  pseudocode: [
    'procedure inorder(node)',
    '  if node is null: return',
    '  inorder(node.left)',
    '  visit(node)',
    '  inorder(node.right)',
    'procedure preorder(node)',
    '  if node is null: return',
    '  visit(node)',
    '  preorder(node.left)',
    '  preorder(node.right)',
    'procedure postorder(node)',
    '  if node is null: return',
    '  postorder(node.left)',
    '  postorder(node.right)',
    '  visit(node)',
    'procedure levelOrder(root)',
    '  Q = [root]',
    '  while Q not empty: visit(dequeue(Q))',
  ],
};

// ── Helpers ─────────────────────────────────────────────────

function mut(
  nodeId: string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'ease-out' };
}

// ── Inorder Traversal ───────────────────────────────────────

export function inorderTraversal(root: TreeNode | null): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  const order: number[] = [];

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons: 0, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  record('Start inorder traversal (Left, Root, Right)', 0, []);

  function inorder(node: TreeNode | null): void {
    if (!node) return;

    reads++;
    record(
      `Visit left subtree of ${node.value}`,
      2,
      [mut(node.id, 'highlight', 'default', 'visiting')],
    );

    inorder(node.left);

    // Visit this node
    order.push(node.value);
    record(
      `Visit ${node.value} [order: ${order.join(', ')}]`,
      3,
      [mut(node.id, 'highlight', 'visiting', 'current')],
    );

    record(
      `Visit right subtree of ${node.value}`,
      4,
      [mut(node.id, 'highlight', 'current', 'visited')],
    );

    inorder(node.right);
  }

  inorder(root);

  record(`Inorder complete: [${order.join(', ')}]`, 4, []);

  return { config: TRAVERSAL_CONFIG, steps, finalState: order };
}

// ── Preorder Traversal ──────────────────────────────────────

export function preorderTraversal(root: TreeNode | null): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  const order: number[] = [];

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons: 0, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  record('Start preorder traversal (Root, Left, Right)', 5, []);

  function preorder(node: TreeNode | null): void {
    if (!node) return;

    reads++;

    // Visit this node first
    order.push(node.value);
    record(
      `Visit ${node.value} [order: ${order.join(', ')}]`,
      7,
      [mut(node.id, 'highlight', 'default', 'current')],
    );

    record(
      `Recurse left from ${node.value}`,
      8,
      [mut(node.id, 'highlight', 'current', 'visited')],
    );
    preorder(node.left);

    record(
      `Recurse right from ${node.value}`,
      9,
      [],
    );
    preorder(node.right);
  }

  preorder(root);

  record(`Preorder complete: [${order.join(', ')}]`, 9, []);

  return { config: TRAVERSAL_CONFIG, steps, finalState: order };
}

// ── Postorder Traversal ─────────────────────────────────────

export function postorderTraversal(root: TreeNode | null): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  const order: number[] = [];

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons: 0, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  record('Start postorder traversal (Left, Right, Root)', 10, []);

  function postorder(node: TreeNode | null): void {
    if (!node) return;

    reads++;
    record(
      `Recurse left from ${node.value}`,
      12,
      [mut(node.id, 'highlight', 'default', 'visiting')],
    );
    postorder(node.left);

    record(
      `Recurse right from ${node.value}`,
      13,
      [],
    );
    postorder(node.right);

    // Visit this node last
    order.push(node.value);
    record(
      `Visit ${node.value} [order: ${order.join(', ')}]`,
      14,
      [mut(node.id, 'highlight', 'visiting', 'current')],
    );

    record(
      `Done with ${node.value}`,
      14,
      [mut(node.id, 'highlight', 'current', 'visited')],
    );
  }

  postorder(root);

  record(`Postorder complete: [${order.join(', ')}]`, 14, []);

  return { config: TRAVERSAL_CONFIG, steps, finalState: order };
}

// ── Level-order (BFS) Traversal ─────────────────────────────

export function levelOrderTraversal(root: TreeNode | null): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  const order: number[] = [];

  function record(desc: string, line: number, mutations: VisualMutation[]): void {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons: 0, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  if (!root) {
    record('Tree is empty -- nothing to traverse', 15, []);
    return { config: TRAVERSAL_CONFIG, steps, finalState: [] };
  }

  record('Start level-order traversal (BFS)', 15, []);

  const queue: TreeNode[] = [root];

  record(
    `Enqueue root ${root.value}`,
    16,
    [mut(root.id, 'highlight', 'default', 'visiting')],
  );

  while (queue.length > 0) {
    const node = queue.shift()!;
    reads++;
    order.push(node.value);

    record(
      `Dequeue ${node.value} [order: ${order.join(', ')}]`,
      17,
      [mut(node.id, 'highlight', 'visiting', 'current')],
    );

    if (node.left) {
      queue.push(node.left);
      record(
        `Enqueue left child ${node.left.value}`,
        17,
        [mut(node.left.id, 'highlight', 'default', 'visiting')],
      );
    }

    if (node.right) {
      queue.push(node.right);
      record(
        `Enqueue right child ${node.right.value}`,
        17,
        [mut(node.right.id, 'highlight', 'default', 'visiting')],
      );
    }

    record(
      `Done with ${node.value}`,
      17,
      [mut(node.id, 'highlight', 'current', 'visited')],
    );
  }

  record(`Level-order complete: [${order.join(', ')}]`, 17, []);

  return { config: TRAVERSAL_CONFIG, steps, finalState: order };
}
