// -----------------------------------------------------------------
// Architex -- BST as Data Structure  (DST-007)
// Wraps the existing algorithm BST operations into DS step format.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// Java TreeMap and C++ std::map use Red-Black trees instead of plain BST for guaranteed O(log n)

// ── BST Node type (local, simpler than algorithm tree node) ─

export interface BSTNode {
  id: string;
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `bst-${_nodeIdCounter++}`;
}

export function cloneBST(node: BSTNode | null): BSTNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneBST(node.left),
    right: cloneBST(node.right),
  };
}

export function bstToArray(node: BSTNode | null): number[] {
  const result: number[] = [];
  function inorder(n: BSTNode | null): void {
    if (!n) return;
    inorder(n.left);
    result.push(n.value);
    inorder(n.right);
  }
  inorder(node);
  return result;
}

export function bstSize(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + bstSize(node.left) + bstSize(node.right);
}

// ── Insert ──────────────────────────────────────────────────

// WHY plain BST for teaching: A plain BST clearly demonstrates the binary search property
// without the complexity of rebalancing. Students can see how sorted insertions degrade
// to O(n) — motivating the need for AVL and Red-Black trees introduced later.
export function dsBstInsert(root: BSTNode | null, value: number): DSResult<BSTNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBST(root);

  function insert(node: BSTNode | null, parent: BSTNode | null, isLeft: boolean): BSTNode {
    if (!node) {
      const newNode: BSTNode = { id: newNodeId(), value, left: null, right: null };
      steps.push(
        step(
          `Insert ${value} as ${parent ? (isLeft ? 'left' : 'right') + ' child of ' + parent.value : 'root'}`,
          [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
        ),
      );
      return newNode;
    }

    // AUTOBIOGRAPHY: 'I arrive at node {node.value} and look at my value {value}. Time to decide: am I bigger or smaller?
    // One glance and I eliminate half the tree — that is the power of the BST property.'
    steps.push(
      step(`Compare ${value} with node ${node.value}. In a BST, left subtree has all smaller values, right has all larger — so one comparison eliminates half the tree.`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (value < node.value) {
      // AUTOBIOGRAPHY: 'I look at node {node.value}. My value {value} is smaller, so I must go left —
      // the left subtree is where all the smaller values live. I just saved myself from searching the entire right side!'
      steps.push(
        step(`${value} < ${node.value} — go left. Since ${value} is smaller, it must be in the left subtree. We just eliminated the entire right subtree from our search.`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.left = insert(node.left, node, true);
    } else if (value > node.value) {
      // AUTOBIOGRAPHY: 'I look at node {node.value}. My value {value} is bigger, so I must go right —
      // the right subtree has all values greater than {node.value}. I just eliminated the entire left subtree from my search!'
      steps.push(
        step(`${value} > ${node.value} — go right. Since ${value} is larger, it belongs in the right subtree. The left subtree is entirely eliminated.`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.right = insert(node.right, node, false);
    } else {
      steps.push(
        step(`${value} == ${node.value} -- duplicate, skip`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
    }

    return node;
  }

  const result = insert(tree, null, false);
  return { steps, snapshot: result };
}

// ── Search ──────────────────────────────────────────────────

export function dsBstSearch(root: BSTNode | null, value: number): DSResult<BSTNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  // AUTOBIOGRAPHY: 'I am searching for {value}. I start at the root and at each node I ask one question:
  // am I bigger or smaller? Each answer cuts my search space in half. This is why I am O(log n) — I am a master of elimination.'
  steps.push(step(`Search for ${value}. BST search is O(log n) on average because each comparison halves the remaining nodes to check.`, []));

  function search(node: BSTNode | null): boolean {
    if (!node) {
      steps.push(step(`Reached null -- ${value} NOT FOUND`, []));
      return false;
    }

    steps.push(
      step(`Compare ${value} with node ${node.value}. The BST property guarantees: all left descendants < ${node.value} < all right descendants.`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (value === node.value) {
      steps.push(
        step(`${value} == ${node.value} -- FOUND!`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
      return true;
    } else if (value < node.value) {
      steps.push(
        step(`${value} < ${node.value} — go left. The entire right subtree is eliminated from the search.`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      return search(node.left);
    } else {
      steps.push(
        step(`${value} > ${node.value} — go right. The entire left subtree is eliminated from the search.`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      return search(node.right);
    }
  }

  search(root);
  return { steps, snapshot: root };
}

// ── Delete ──────────────────────────────────────────────────

export function dsBstDelete(root: BSTNode | null, value: number): DSResult<BSTNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBST(root);

  // WHY in-order successor for two-child delete: When a node has two children, we need
  // a replacement that preserves the BST property (left < node < right). The in-order
  // successor (smallest node in the right subtree) is the smallest value larger than the
  // deleted node, so swapping it in keeps all left descendants smaller and all right
  // descendants larger. The in-order predecessor (largest in left subtree) would also work.
  function findMin(node: BSTNode): BSTNode {
    let curr = node;
    while (curr.left) curr = curr.left;
    return curr;
  }

  function deleteNode(node: BSTNode | null, val: number): BSTNode | null {
    if (!node) {
      steps.push(step(`${val} not found in tree`, []));
      return null;
    }

    steps.push(
      step(`Compare ${val} with ${node.value}. BST delete first searches for the node using the same halving strategy as search — O(log n) to locate it.`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (val < node.value) {
      steps.push(
        step(`${val} < ${node.value} -- search left`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.left = deleteNode(node.left, val);
      return node;
    } else if (val > node.value) {
      steps.push(
        step(`${val} > ${node.value} -- search right`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.right = deleteNode(node.right, val);
      return node;
    }

    // Found the node
    steps.push(
      step(`Found ${val} -- deleting`, [
        { targetId: node.id, property: 'highlight', from: 'visiting', to: 'deleting' },
      ]),
    );

    if (!node.left && !node.right) {
      steps.push(step(`${val} is a leaf -- remove`, []));
      return null;
    }

    if (!node.left) {
      steps.push(step(`${val} has only right child -- replace`, []));
      return node.right;
    }
    if (!node.right) {
      steps.push(step(`${val} has only left child -- replace`, []));
      return node.left;
    }

    const successor = findMin(node.right);
    // AUTOBIOGRAPHY: 'Deleting me is tricky — I have two children! I need a replacement that keeps the BST property intact.
    // I find the smallest value in my right subtree (my in-order successor) and let it take my place. It is the perfect heir:
    // bigger than everything on my left, smaller than everything else on my right.'
    steps.push(
      step(`Two children -- replace with in-order successor ${successor.value}`, [
        { targetId: successor.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    node.value = successor.value;
    node.right = deleteNode(node.right, successor.value);
    return node;
  }

  const result = deleteNode(tree, value);
  return { steps, snapshot: result };
}

// ── Build a sample BST from an array of values ─────────────

export function buildBST(values: number[]): BSTNode | null {
  let root: BSTNode | null = null;

  function insert(node: BSTNode | null, val: number): BSTNode {
    if (!node) return { id: newNodeId(), value: val, left: null, right: null };
    if (val < node.value) node.left = insert(node.left, val);
    else if (val > node.value) node.right = insert(node.right, val);
    return node;
  }

  for (const v of values) {
    root = insert(root, v);
  }
  return root;
}
