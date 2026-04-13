// -----------------------------------------------------------------
// Architex -- B-Tree Data Structure  (DST-010)
// Classic B-Tree: keys stored in both internal and leaf nodes.
// Maintains balance via split on overflow and merge/redistribute
// on underflow. All leaves are at the same depth.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ─────────────────────────────────────────────────────

export interface BTreeNode {
  id: string;
  keys: number[];
  childIds: string[];
  leaf: boolean;
}

export interface BTreeState {
  /** Order (maximum number of children per node). Max keys = order - 1. */
  order: number;
  rootId: string | null;
  nodes: Record<string, BTreeNode>;
  size: number;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `bt-${_nodeIdCounter++}`;
}

/** Deep clone the entire tree state so we never mutate the original. */
export function cloneBTree(state: BTreeState): BTreeState {
  const nodes: Record<string, BTreeNode> = {};
  for (const [id, node] of Object.entries(state.nodes)) {
    nodes[id] = {
      ...node,
      keys: [...node.keys],
      childIds: [...node.childIds],
    };
  }
  return { ...state, nodes };
}

/** Collect all keys via in-order traversal. */
export function btreeToArray(state: BTreeState): number[] {
  const result: number[] = [];
  function inorder(nodeId: string | null): void {
    if (nodeId === null) return;
    const node = state.nodes[nodeId];
    if (!node) return;
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.leaf) inorder(node.childIds[i]);
      result.push(node.keys[i]);
    }
    if (!node.leaf) inorder(node.childIds[node.keys.length]);
  }
  inorder(state.rootId);
  return result;
}

// ── Create ────────────────────────────────────────────────────

/**
 * Create an empty B-Tree with the given order (minimum 3).
 * Order = max children per node. Max keys per node = order - 1.
 */
export function createBTree(order: number): BTreeState {
  if (order < 3) order = 3;
  return {
    order,
    rootId: null,
    nodes: {},
    size: 0,
  };
}

// ── Insert ────────────────────────────────────────────────────

export function btreeInsert(state: BTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBTree(state);
  const maxKeys = tree.order - 1;

  // Empty tree -- create first root.
  if (tree.rootId === null) {
    const rootId = newNodeId();
    const root: BTreeNode = { id: rootId, keys: [key], childIds: [], leaf: true };
    tree.nodes[rootId] = root;
    tree.rootId = rootId;
    tree.size = 1;
    steps.push(
      step(`Tree is empty -- create root with key ${key}`, [
        { targetId: rootId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return { steps, snapshot: tree };
  }

  // If root is full, split it first (pre-emptive split from root).
  const root = tree.nodes[tree.rootId];
  if (root.keys.length === maxKeys) {
    const newRootId = newNodeId();
    const newRoot: BTreeNode = {
      id: newRootId,
      keys: [],
      childIds: [tree.rootId],
      leaf: false,
    };
    tree.nodes[newRootId] = newRoot;
    tree.rootId = newRootId;

    steps.push(
      step(`Root is full -- create new root and split old root`, [
        { targetId: newRootId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );

    splitChild(tree, newRootId, 0, steps, maxKeys, step);
    insertNonFull(tree, newRootId, key, steps, maxKeys, step);
  } else {
    insertNonFull(tree, tree.rootId, key, steps, maxKeys, step);
  }

  tree.size++;
  return { steps, snapshot: tree };
}

/** Insert key into a node that is guaranteed not full. */
function insertNonFull(
  tree: BTreeState,
  nodeId: string,
  key: number,
  steps: DSStep[],
  maxKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const node = tree.nodes[nodeId];

  if (node.leaf) {
    // Find position and insert.
    let i = node.keys.length - 1;
    while (i >= 0 && key < node.keys[i]) {
      i--;
    }

    // Duplicate check.
    if (i >= 0 && node.keys[i] === key) {
      steps.push(
        step(`Key ${key} already exists -- skip`, [
          { targetId: nodeId, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
      tree.size--; // counteract the increment in btreeInsert
      return;
    }

    node.keys.splice(i + 1, 0, key);
    steps.push(
      step(`Insert ${key} into leaf [${node.keys.join(', ')}]`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return;
  }

  // Internal node -- find the child to descend into.
  let i = node.keys.length - 1;
  while (i >= 0 && key < node.keys[i]) {
    i--;
  }

  // Duplicate check in internal node.
  if (i >= 0 && node.keys[i] === key) {
    steps.push(
      step(`Key ${key} already exists in internal node -- skip`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    tree.size--;
    return;
  }

  i++;
  const childId = node.childIds[i];
  const child = tree.nodes[childId];

  steps.push(
    step(`At internal node [${node.keys.join(', ')}] -- descend to child ${i}`, [
      { targetId: nodeId, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // If child is full, split it first.
  if (child.keys.length === maxKeys) {
    splitChild(tree, nodeId, i, steps, maxKeys, step);
    // After split, the median is at node.keys[i]. Decide which child to descend into.
    if (key > node.keys[i]) {
      i++;
    } else if (key === node.keys[i]) {
      steps.push(
        step(`Key ${key} already exists after split promotion -- skip`, [
          { targetId: nodeId, property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
      tree.size--;
      return;
    }
  }

  insertNonFull(tree, node.childIds[i], key, steps, maxKeys, step);
}

/**
 * Split the child at index `childIndex` of the node at `parentId`.
 * The median key moves up to the parent.
 */
function splitChild(
  tree: BTreeState,
  parentId: string,
  childIndex: number,
  steps: DSStep[],
  maxKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parent = tree.nodes[parentId];
  const childId = parent.childIds[childIndex];
  const child = tree.nodes[childId];
  const mid = Math.floor(maxKeys / 2);

  const medianKey = child.keys[mid];

  // Create new right sibling.
  const newNodeIdVal = newNodeId();
  const rightNode: BTreeNode = {
    id: newNodeIdVal,
    keys: child.keys.splice(mid + 1),
    childIds: child.leaf ? [] : child.childIds.splice(mid + 1),
    leaf: child.leaf,
  };
  child.keys.splice(mid, 1); // remove median from original

  tree.nodes[newNodeIdVal] = rightNode;

  // Insert median key into parent.
  parent.keys.splice(childIndex, 0, medianKey);
  parent.childIds.splice(childIndex + 1, 0, newNodeIdVal);

  steps.push(
    step(
      `Split child [${child.keys.join(', ')} | ${medianKey} | ${rightNode.keys.join(', ')}] -- promote ${medianKey}`,
      [
        { targetId: childId, property: 'highlight', from: 'default', to: 'splitting' },
        { targetId: newNodeIdVal, property: 'highlight', from: 'default', to: 'splitting' },
        { targetId: parentId, property: 'key', from: 'none', to: medianKey },
      ],
    ),
  );
}

// ── Search ────────────────────────────────────────────────────

export function btreeSearch(state: BTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (state.rootId === null) {
    steps.push(step('Tree is empty -- nothing to search', []));
    return { steps, snapshot: { found: false, tree: state } };
  }

  steps.push(step(`Search for key ${key}`, []));

  function searchNode(nodeId: string): boolean {
    const node = state.nodes[nodeId];
    steps.push(
      step(`Visit node [${node.keys.join(', ')}]`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    // Binary-style search within the node keys.
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      steps.push(
        step(`Key ${key} FOUND at index ${i}`, [
          { targetId: nodeId, property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
      return true;
    }

    if (node.leaf) {
      steps.push(
        step(`Key ${key} NOT FOUND in leaf`, [
          { targetId: nodeId, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      return false;
    }

    steps.push(
      step(`${key} not in node -- descend to child ${i}`, [
        { targetId: nodeId, property: 'highlight', from: 'visiting', to: 'visited' },
      ]),
    );
    return searchNode(node.childIds[i]);
  }

  const found = searchNode(state.rootId);
  return { steps, snapshot: { found, tree: state } };
}

// ── Delete ────────────────────────────────────────────────────

export function btreeDelete(state: BTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBTree(state);
  const minKeys = Math.ceil(tree.order / 2) - 1;

  if (tree.rootId === null) {
    steps.push(step('Tree is empty -- nothing to delete', []));
    return { steps, snapshot: tree };
  }

  steps.push(step(`Delete key ${key}`, []));
  deleteFromNode(tree, tree.rootId, key, steps, minKeys, step);

  // If root is empty but has a child, shrink tree height.
  const root = tree.nodes[tree.rootId];
  if (root && root.keys.length === 0 && !root.leaf) {
    const oldRootId = tree.rootId;
    tree.rootId = root.childIds[0];
    delete tree.nodes[oldRootId];
    steps.push(step('Root is empty -- shrink tree height', []));
  } else if (root && root.keys.length === 0 && root.leaf) {
    delete tree.nodes[tree.rootId];
    tree.rootId = null;
    steps.push(step('Root leaf is now empty -- tree is empty', []));
  }

  return { steps, snapshot: tree };
}

function deleteFromNode(
  tree: BTreeState,
  nodeId: string,
  key: number,
  steps: DSStep[],
  minKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const node = tree.nodes[nodeId];
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) {
    i++;
  }

  // Case 1: key is in this node.
  if (i < node.keys.length && node.keys[i] === key) {
    if (node.leaf) {
      // Case 1a: key in leaf -- simply remove.
      node.keys.splice(i, 1);
      tree.size--;
      steps.push(
        step(`Remove ${key} from leaf [${node.keys.join(', ')}]`, [
          { targetId: nodeId, property: 'highlight', from: 'default', to: 'deleting' },
        ]),
      );
    } else {
      // Case 1b: key in internal node.
      const leftChildId = node.childIds[i];
      const rightChildId = node.childIds[i + 1];
      const leftChild = tree.nodes[leftChildId];
      const rightChild = tree.nodes[rightChildId];

      if (leftChild.keys.length > minKeys) {
        // Replace with predecessor.
        const pred = findMax(tree, leftChildId);
        node.keys[i] = pred;
        steps.push(
          step(`Replace ${key} with predecessor ${pred}`, [
            { targetId: nodeId, property: 'key', from: key, to: pred },
          ]),
        );
        deleteFromNode(tree, leftChildId, pred, steps, minKeys, step);
      } else if (rightChild.keys.length > minKeys) {
        // Replace with successor.
        const succ = findMin(tree, rightChildId);
        node.keys[i] = succ;
        steps.push(
          step(`Replace ${key} with successor ${succ}`, [
            { targetId: nodeId, property: 'key', from: key, to: succ },
          ]),
        );
        deleteFromNode(tree, rightChildId, succ, steps, minKeys, step);
      } else {
        // Merge left and right children.
        mergeChildren(tree, nodeId, i, steps, step);
        deleteFromNode(tree, leftChildId, key, steps, minKeys, step);
      }
    }
    return;
  }

  // Case 2: key is not in this node.
  if (node.leaf) {
    steps.push(
      step(`Key ${key} not found in tree`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'visited' },
      ]),
    );
    return;
  }

  steps.push(
    step(`Key ${key} not in [${node.keys.join(', ')}] -- descend to child ${i}`, [
      { targetId: nodeId, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // Ensure the child we descend into has enough keys.
  const childId = node.childIds[i];
  const child = tree.nodes[childId];

  if (child.keys.length <= minKeys) {
    fillChild(tree, nodeId, i, steps, minKeys, step);
  }

  // After fill, the child index might have changed if we merged.
  // Re-find the correct child to descend into.
  let newI = 0;
  while (newI < node.keys.length && key > node.keys[newI]) {
    newI++;
  }
  if (newI < node.keys.length && node.keys[newI] === key) {
    // Key got pulled down into current node during merge; delete from here.
    deleteFromNode(tree, nodeId, key, steps, minKeys, step);
  } else {
    const targetChildId = node.childIds[newI];
    if (tree.nodes[targetChildId]) {
      deleteFromNode(tree, targetChildId, key, steps, minKeys, step);
    }
  }
}

/** Find the maximum key in the subtree rooted at nodeId. */
function findMax(tree: BTreeState, nodeId: string): number {
  const node = tree.nodes[nodeId];
  if (node.leaf) return node.keys[node.keys.length - 1];
  return findMax(tree, node.childIds[node.childIds.length - 1]);
}

/** Find the minimum key in the subtree rooted at nodeId. */
function findMin(tree: BTreeState, nodeId: string): number {
  const node = tree.nodes[nodeId];
  if (node.leaf) return node.keys[0];
  return findMin(tree, node.childIds[0]);
}

/**
 * Ensure the child at index `i` of `parentId` has enough keys (> minKeys).
 * Tries to borrow from a sibling first; if not possible, merges.
 */
function fillChild(
  tree: BTreeState,
  parentId: string,
  i: number,
  steps: DSStep[],
  minKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parent = tree.nodes[parentId];

  // Try borrowing from left sibling.
  if (i > 0) {
    const leftSibId = parent.childIds[i - 1];
    const leftSib = tree.nodes[leftSibId];
    if (leftSib.keys.length > minKeys) {
      borrowFromLeft(tree, parentId, i, steps, step);
      return;
    }
  }

  // Try borrowing from right sibling.
  if (i < parent.childIds.length - 1) {
    const rightSibId = parent.childIds[i + 1];
    const rightSib = tree.nodes[rightSibId];
    if (rightSib.keys.length > minKeys) {
      borrowFromRight(tree, parentId, i, steps, step);
      return;
    }
  }

  // Merge with a sibling.
  if (i > 0) {
    mergeChildren(tree, parentId, i - 1, steps, step);
  } else {
    mergeChildren(tree, parentId, i, steps, step);
  }
}

/** Borrow a key from the left sibling via the parent. */
function borrowFromLeft(
  tree: BTreeState,
  parentId: string,
  childIndex: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parent = tree.nodes[parentId];
  const childId = parent.childIds[childIndex];
  const child = tree.nodes[childId];
  const leftSibId = parent.childIds[childIndex - 1];
  const leftSib = tree.nodes[leftSibId];

  // Move parent's separator key down to child.
  child.keys.unshift(parent.keys[childIndex - 1]);
  // Move left sibling's last key up to parent.
  parent.keys[childIndex - 1] = leftSib.keys.pop()!;

  // Move the last child pointer of left sibling to child.
  if (!leftSib.leaf) {
    child.childIds.unshift(leftSib.childIds.pop()!);
  }

  steps.push(
    step(`Borrow from left sibling via parent rotation`, [
      { targetId: childId, property: 'highlight', from: 'default', to: 'rebalancing' },
      { targetId: leftSibId, property: 'highlight', from: 'default', to: 'rebalancing' },
    ]),
  );
}

/** Borrow a key from the right sibling via the parent. */
function borrowFromRight(
  tree: BTreeState,
  parentId: string,
  childIndex: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parent = tree.nodes[parentId];
  const childId = parent.childIds[childIndex];
  const child = tree.nodes[childId];
  const rightSibId = parent.childIds[childIndex + 1];
  const rightSib = tree.nodes[rightSibId];

  // Move parent's separator key down to child.
  child.keys.push(parent.keys[childIndex]);
  // Move right sibling's first key up to parent.
  parent.keys[childIndex] = rightSib.keys.shift()!;

  // Move the first child pointer of right sibling to child.
  if (!rightSib.leaf) {
    child.childIds.push(rightSib.childIds.shift()!);
  }

  steps.push(
    step(`Borrow from right sibling via parent rotation`, [
      { targetId: childId, property: 'highlight', from: 'default', to: 'rebalancing' },
      { targetId: rightSibId, property: 'highlight', from: 'default', to: 'rebalancing' },
    ]),
  );
}

/**
 * Merge the child at `keyIndex + 1` into the child at `keyIndex`,
 * pulling the separator key from the parent down into the merged node.
 */
function mergeChildren(
  tree: BTreeState,
  parentId: string,
  keyIndex: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parent = tree.nodes[parentId];
  const leftChildId = parent.childIds[keyIndex];
  const rightChildId = parent.childIds[keyIndex + 1];
  const leftChild = tree.nodes[leftChildId];
  const rightChild = tree.nodes[rightChildId];

  // Pull separator down from parent.
  const separator = parent.keys[keyIndex];
  leftChild.keys.push(separator, ...rightChild.keys);
  leftChild.childIds.push(...rightChild.childIds);

  // Remove separator and right child pointer from parent.
  parent.keys.splice(keyIndex, 1);
  parent.childIds.splice(keyIndex + 1, 1);

  // Remove right child node.
  delete tree.nodes[rightChildId];

  steps.push(
    step(`Merge children with separator ${separator} into [${leftChild.keys.join(', ')}]`, [
      { targetId: leftChildId, property: 'highlight', from: 'default', to: 'merging' },
    ]),
  );
}
