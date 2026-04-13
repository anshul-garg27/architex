// -----------------------------------------------------------------
// Architex -- AVL Tree Data Structure  (DST-008)
// Self-balancing BST with rotations (LL, RR, LR, RL).
// Tracks balance factors; step recording shows each rotation.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── AVL Node type ─────────────────────────────────────────

export interface AVLNode {
  id: string;
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `avl-${_nodeIdCounter++}`;
}

export function cloneAVL(node: AVLNode | null): AVLNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneAVL(node.left),
    right: cloneAVL(node.right),
  };
}

export function avlToArray(node: AVLNode | null): number[] {
  const result: number[] = [];
  function inorder(n: AVLNode | null): void {
    if (!n) return;
    inorder(n.left);
    result.push(n.value);
    inorder(n.right);
  }
  inorder(node);
  return result;
}

export function avlSize(node: AVLNode | null): number {
  if (!node) return 0;
  return 1 + avlSize(node.left) + avlSize(node.right);
}

function height(node: AVLNode | null): number {
  return node ? node.height : 0;
}

function balanceFactor(node: AVLNode | null): number {
  if (!node) return 0;
  return height(node.left) - height(node.right);
}

// WHY update height before balance check: The balance factor depends on accurate
// subtree heights. After an insertion or deletion in a subtree, that subtree's
// height may have changed. We must recompute height FIRST so balanceFactor()
// returns the correct value and triggers the right rotation (LL/RR/LR/RL).
// Getting this order wrong would cause missed rotations and a broken AVL invariant.
function updateHeight(node: AVLNode): void {
  node.height = 1 + Math.max(height(node.left), height(node.right));
}

// ── Rotations ─────────────────────────────────────────────

function rotateRight(y: AVLNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): AVLNode {
  const x = y.left!;
  const T2 = x.right;

  // AUTOBIOGRAPHY: 'I am node {y.value} and I have become too left-heavy — my balance factor exceeded the limit!
  // My left child {x.value} is going to take my place as the subtree root, and I will become its right child.
  // It is like a seesaw tipping: the heavy side rises to become the new center. One rotation and I am balanced again.'
  steps.push(
    step(`Right rotation at ${y.value} (pivot ${x.value}). The left child ${x.value} becomes the new root of this subtree. This restores the AVL balance property: both subtrees within 1 level.`, [
      { targetId: y.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: x.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  x.right = y;
  y.left = T2;
  updateHeight(y);
  updateHeight(x);
  return x;
}

function rotateLeft(x: AVLNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): AVLNode {
  const y = x.right!;
  const T2 = y.left;

  // AUTOBIOGRAPHY: 'I am node {x.value} and my right side is too heavy. My right child {y.value} will rise up
  // to take my position, and I will become its left child. This single left rotation restores my balance factor
  // to the safe range. The tree stays short, and my O(log n) guarantee survives another day.'
  steps.push(
    step(`Left rotation at ${x.value} (pivot ${y.value}). The right child ${y.value} becomes the new root of this subtree. This restores balance so the tree height stays O(log n).`, [
      { targetId: x.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: y.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  y.left = x;
  x.right = T2;
  updateHeight(x);
  updateHeight(y);
  return y;
}

// WHY AVL checks balance after EVERY insert/delete recursion unwind: Unlike Red-Black
// trees which can defer rebalancing, AVL strictly maintains |bf| <= 1 at every node.
// This stricter invariant means AVL trees are slightly shorter than RB trees (1.44 log n
// vs 2 log n), giving faster lookups at the cost of more rotations on insert/delete.
function rebalance(node: AVLNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): AVLNode {
  updateHeight(node);
  const bf = balanceFactor(node);

  // Left-heavy
  if (bf > 1) {
    if (balanceFactor(node.left) < 0) {
      // LR case
      // AUTOBIOGRAPHY: 'This is the tricky LR case. My left child is right-heavy — a single rotation would not fix it
      // because the imbalance zigzags. I need a double rotation: first rotate my left child left to straighten the zigzag,
      // then rotate myself right. Two moves to fix what one move cannot.'
      steps.push(
        step(`LR case at ${node.value}: left child is right-heavy (bf=${balanceFactor(node.left)}). A single rotation won't fix this — we first rotate left on the child to align it, then rotate right on this node.`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      node.left = rotateLeft(node.left!, steps, step);
    } else {
      steps.push(
        step(`LL case at ${node.value}: bf=${bf}. The left subtree is 2 levels taller than the right. This is a Left-Left imbalance — a single right rotation will fix it by lifting the left child up.`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
    }
    return rotateRight(node, steps, step);
  }

  // Right-heavy
  if (bf < -1) {
    if (balanceFactor(node.right) > 0) {
      // RL case
      steps.push(
        step(`RL case at ${node.value}: right child is left-heavy (bf=${balanceFactor(node.right)}). A single rotation won't fix this — we first rotate right on the child to align it, then rotate left on this node.`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      node.right = rotateRight(node.right!, steps, step);
    } else {
      steps.push(
        step(`RR case at ${node.value}: bf=${bf}. The right subtree is 2 levels taller than the left. This is a Right-Right imbalance — a single left rotation will fix it by lifting the right child up.`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
    }
    return rotateLeft(node, steps, step);
  }

  return node;
}

// ── Insert ────────────────────────────────────────────────

export function dsAvlInsert(root: AVLNode | null, value: number): DSResult<AVLNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneAVL(root);

  function insert(node: AVLNode | null, parent: AVLNode | null, isLeft: boolean): AVLNode {
    if (!node) {
      const newNode: AVLNode = {
        id: newNodeId(),
        value,
        left: null,
        right: null,
        height: 1,
      };
      steps.push(
        step(
          `Insert ${value} as ${parent ? (isLeft ? 'left' : 'right') + ' child of ' + parent.value : 'root'}`,
          [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
        ),
      );
      return newNode;
    }

    // AUTOBIOGRAPHY: 'I compare my value with node {node.value}, same as a plain BST. But unlike my unbalanced
    // cousin, I GUARANTEE that this tree is never more than 1 level lopsided. That means my search path is always
    // O(log n) — no degenerate linked-list chains for me.'
    steps.push(
      step(`Compare ${value} with ${node.value}. AVL uses the same BST comparison — left for smaller, right for larger — but guarantees O(log n) height via rotations.`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (value < node.value) {
      steps.push(
        step(`${value} < ${node.value} -- go left`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.left = insert(node.left, node, true);
    } else if (value > node.value) {
      steps.push(
        step(`${value} > ${node.value} -- go right`, [
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
      return node;
    }

    // WHY update height before computing bf: We recompute height on the way back up the
    // recursion stack (post-order). The child's insertion may have increased this node's
    // subtree height, so we need the fresh value before deciding whether to rotate.
    updateHeight(node);
    const bf = balanceFactor(node);
    if (bf < -1 || bf > 1) {
      steps.push(
        step(`Node ${node.value} is unbalanced (bf=${bf}), rebalancing...`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
    }

    return rebalance(node, steps, step);
  }

  const result = insert(tree, null, false);
  return { steps, snapshot: result };
}

// ── Search ────────────────────────────────────────────────

export function dsAvlSearch(root: AVLNode | null, value: number): DSResult<AVLNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  // AUTOBIOGRAPHY: 'I am the AVL search. I walk the same path as a BST search, but with a crucial difference:
  // I KNOW this tree is balanced. No matter what order the elements were inserted, I will never face a degenerate
  // chain. My worst case IS my average case: O(log n). That is my promise.'
  steps.push(step(`Search for ${value}. AVL guarantees O(log n) search because the tree is always balanced — no degenerate linear chains like an unbalanced BST.`, []));

  function search(node: AVLNode | null): boolean {
    if (!node) {
      steps.push(step(`Reached null -- ${value} NOT FOUND`, []));
      return false;
    }

    steps.push(
      step(`Compare ${value} with ${node.value} (bf=${balanceFactor(node)}). Balance factor shows this subtree's height difference — AVL keeps it in [-1, 1].`, [
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
        step(`${value} < ${node.value} -- search left`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      return search(node.left);
    } else {
      steps.push(
        step(`${value} > ${node.value} -- search right`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      return search(node.right);
    }
  }

  search(root);
  return { steps, snapshot: root };
}

// ── Delete ────────────────────────────────────────────────

export function dsAvlDelete(root: AVLNode | null, value: number): DSResult<AVLNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneAVL(root);

  function findMin(node: AVLNode): AVLNode {
    let curr = node;
    while (curr.left) curr = curr.left;
    return curr;
  }

  function deleteNode(node: AVLNode | null, val: number): AVLNode | null {
    if (!node) {
      steps.push(step(`${val} not found in tree`, []));
      return null;
    }

    steps.push(
      step(`Compare ${val} with ${node.value}`, [
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
    } else if (val > node.value) {
      steps.push(
        step(`${val} > ${node.value} -- search right`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      node.right = deleteNode(node.right, val);
    } else {
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
      steps.push(
        step(`Two children -- replace with in-order successor ${successor.value}`, [
          { targetId: successor.id, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
      node.value = successor.value;
      node.right = deleteNode(node.right, successor.value);
    }

    if (!node) return null;

    // Check balance and rotate if needed
    const bf = balanceFactor(node);
    if (bf < -1 || bf > 1) {
      steps.push(
        step(`Node ${node.value} is unbalanced (bf=${bf}) after delete, rebalancing...`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
    }

    return rebalance(node, steps, step);
  }

  const result = deleteNode(tree, value);
  return { steps, snapshot: result };
}

// ── Build a sample AVL from an array of values ───────────

export function buildAVL(values: number[]): AVLNode | null {
  let root: AVLNode | null = null;

  for (const v of values) {
    const res = dsAvlInsert(root, v);
    root = res.snapshot as AVLNode | null;
  }
  return root;
}
