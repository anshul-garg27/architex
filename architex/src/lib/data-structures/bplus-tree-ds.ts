// -----------------------------------------------------------------
// Architex -- B+ Tree Data Structure  (DST-030)
// All values in leaves; internal nodes are index-only.
// Leaf nodes form a doubly-linked list for range queries.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ─────────────────────────────────────────────────────

export interface BPlusLeafNode {
  id: string;
  kind: 'leaf';
  keys: number[];
  /** Pointer to the next leaf (linked list). */
  nextLeafId: string | null;
  /** Pointer to the previous leaf (linked list). */
  prevLeafId: string | null;
}

export interface BPlusInternalNode {
  id: string;
  kind: 'internal';
  keys: number[];
  childIds: string[];
}

export type BPlusNode = BPlusLeafNode | BPlusInternalNode;

export interface BPlusTreeState {
  order: number; // max keys per node = order - 1
  rootId: string | null;
  nodes: Record<string, BPlusNode>;
  size: number;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `bp-${_nodeIdCounter++}`;
}

// Deep clone the entire tree state so we never mutate the original.
export function cloneBPlusTree(state: BPlusTreeState): BPlusTreeState {
  const nodes: Record<string, BPlusNode> = {};
  for (const [id, node] of Object.entries(state.nodes)) {
    if (node.kind === 'leaf') {
      nodes[id] = {
        ...node,
        keys: [...node.keys],
      };
    } else {
      nodes[id] = {
        ...node,
        keys: [...node.keys],
        childIds: [...node.childIds],
      };
    }
  }
  return { ...state, nodes };
}

// ── Create ────────────────────────────────────────────────────

export function createBPlusTree(order: number): BPlusTreeState {
  if (order < 3) order = 3; // minimum practical order
  return {
    order,
    rootId: null,
    nodes: {},
    size: 0,
  };
}

// ── Insert ────────────────────────────────────────────────────

export function bplusInsert(
  state: BPlusTreeState,
  key: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBPlusTree(state);
  const maxKeys = tree.order - 1;

  // Empty tree -- create first leaf.
  if (tree.rootId === null) {
    const leafId = newNodeId();
    const leaf: BPlusLeafNode = {
      id: leafId,
      kind: 'leaf',
      keys: [key],
      nextLeafId: null,
      prevLeafId: null,
    };
    tree.nodes[leafId] = leaf;
    tree.rootId = leafId;
    tree.size = 1;
    steps.push(
      step(`Tree is empty -- create root leaf with key ${key}`, [
        { targetId: leafId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return { steps, snapshot: tree };
  }

  // Find the leaf node where key should go.
  function findLeaf(nodeId: string): string {
    const node = tree.nodes[nodeId];
    if (node.kind === 'leaf') {
      steps.push(
        step(`Reached leaf node [${node.keys.join(', ')}]`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      return nodeId;
    }
    // Internal node -- find the child to descend into.
    const internal = node as BPlusInternalNode;
    steps.push(
      step(`At internal node [${internal.keys.join(', ')}]`, [
        { targetId: internal.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    let childIdx = 0;
    while (childIdx < internal.keys.length && key >= internal.keys[childIdx]) {
      childIdx++;
    }
    steps.push(
      step(`${key} goes to child index ${childIdx}`, [
        { targetId: internal.id, property: 'highlight', from: 'visiting', to: 'visited' },
      ]),
    );
    return findLeaf(internal.childIds[childIdx]);
  }

  const leafId = findLeaf(tree.rootId);
  const leaf = tree.nodes[leafId] as BPlusLeafNode;

  // Check for duplicate.
  if (leaf.keys.includes(key)) {
    steps.push(
      step(`Key ${key} already exists in leaf -- skip`, [
        { targetId: leafId, property: 'highlight', from: 'visiting', to: 'found' },
      ]),
    );
    return { steps, snapshot: tree };
  }

  // Insert key in sorted order.
  let insertPos = 0;
  while (insertPos < leaf.keys.length && leaf.keys[insertPos] < key) {
    insertPos++;
  }
  leaf.keys.splice(insertPos, 0, key);
  tree.size++;

  steps.push(
    step(`Insert ${key} into leaf [${leaf.keys.join(', ')}]`, [
      { targetId: leafId, property: 'highlight', from: 'visiting', to: 'inserting' },
    ]),
  );

  // If the leaf overflows, split it.
  if (leaf.keys.length > maxKeys) {
    splitLeaf(tree, leafId, steps, maxKeys, step);
  }

  return { steps, snapshot: tree };
}

/** Split a leaf and propagate the median up. */
function splitLeaf(
  tree: BPlusTreeState,
  leafId: string,
  steps: DSStep[],
  maxKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const leaf = tree.nodes[leafId] as BPlusLeafNode;
  const mid = Math.ceil(leaf.keys.length / 2);
  const promoteKey = leaf.keys[mid];

  // Create new right leaf.
  const newLeafId = newNodeId();
  const newLeaf: BPlusLeafNode = {
    id: newLeafId,
    kind: 'leaf',
    keys: leaf.keys.splice(mid),
    nextLeafId: leaf.nextLeafId,
    prevLeafId: leafId,
  };
  // Fix the old next leaf's prev pointer.
  if (leaf.nextLeafId !== null) {
    const oldNext = tree.nodes[leaf.nextLeafId] as BPlusLeafNode;
    oldNext.prevLeafId = newLeafId;
  }
  leaf.nextLeafId = newLeafId;
  tree.nodes[newLeafId] = newLeaf;

  steps.push(
    step(
      `Leaf overflow -- split at ${promoteKey}. Left [${leaf.keys.join(', ')}], Right [${newLeaf.keys.join(', ')}]`,
      [
        { targetId: leafId, property: 'highlight', from: 'inserting', to: 'splitting' },
        { targetId: newLeafId, property: 'highlight', from: 'default', to: 'splitting' },
      ],
    ),
  );

  // Promote the key to the parent.
  insertIntoParent(tree, leafId, promoteKey, newLeafId, steps, maxKeys, step);
}

/** Insert a promoted key into the parent, splitting internal nodes as needed. */
function insertIntoParent(
  tree: BPlusTreeState,
  leftId: string,
  key: number,
  rightId: string,
  steps: DSStep[],
  maxKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  // Find parent of leftId.
  const parentId = findParent(tree, tree.rootId!, leftId);

  if (parentId === null) {
    // leftId was the root -- create new root.
    const newRootId = newNodeId();
    const newRoot: BPlusInternalNode = {
      id: newRootId,
      kind: 'internal',
      keys: [key],
      childIds: [leftId, rightId],
    };
    tree.nodes[newRootId] = newRoot;
    tree.rootId = newRootId;
    steps.push(
      step(`Promote ${key} into new root`, [
        { targetId: newRootId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return;
  }

  const parent = tree.nodes[parentId] as BPlusInternalNode;
  // Find position to insert key.
  let pos = 0;
  while (pos < parent.keys.length && parent.keys[pos] < key) {
    pos++;
  }
  parent.keys.splice(pos, 0, key);
  parent.childIds.splice(pos + 1, 0, rightId);

  steps.push(
    step(`Promote ${key} into parent [${parent.keys.join(', ')}]`, [
      { targetId: parentId, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // If internal node overflows, split it.
  if (parent.keys.length > maxKeys) {
    splitInternal(tree, parentId, steps, maxKeys, step);
  }
}

/** Split an overflowing internal node. */
function splitInternal(
  tree: BPlusTreeState,
  nodeId: string,
  steps: DSStep[],
  maxKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const node = tree.nodes[nodeId] as BPlusInternalNode;
  const mid = Math.floor(node.keys.length / 2);
  const promoteKey = node.keys[mid];

  const newNodeIdVal = newNodeId();
  const rightKeys = node.keys.splice(mid + 1);
  node.keys.splice(mid, 1); // remove the promoted key
  const rightChildren = node.childIds.splice(mid + 1);

  const newInternal: BPlusInternalNode = {
    id: newNodeIdVal,
    kind: 'internal',
    keys: rightKeys,
    childIds: rightChildren,
  };
  tree.nodes[newNodeIdVal] = newInternal;

  steps.push(
    step(
      `Internal overflow -- split, promote ${promoteKey}. Left keys [${node.keys.join(', ')}], Right keys [${rightKeys.join(', ')}]`,
      [
        { targetId: nodeId, property: 'highlight', from: 'inserting', to: 'splitting' },
        { targetId: newNodeIdVal, property: 'highlight', from: 'default', to: 'splitting' },
      ],
    ),
  );

  insertIntoParent(tree, nodeId, promoteKey, newNodeIdVal, steps, maxKeys, step);
}

/** Find the parent of a child node in the tree. Returns null if child is root. */
function findParent(
  tree: BPlusTreeState,
  currentId: string,
  targetId: string,
): string | null {
  if (currentId === targetId) return null;
  const node = tree.nodes[currentId];
  if (node.kind === 'leaf') return null;
  const internal = node as BPlusInternalNode;
  for (const childId of internal.childIds) {
    if (childId === targetId) return currentId;
    const found = findParent(tree, childId, targetId);
    if (found !== null) return found;
  }
  return null;
}

// ── Search ────────────────────────────────────────────────────

export function bplusSearch(
  state: BPlusTreeState,
  key: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (state.rootId === null) {
    steps.push(step('Tree is empty -- nothing to search', []));
    return { steps, snapshot: { found: false, tree: state } };
  }

  steps.push(step(`Search for key ${key}`, []));

  function searchNode(nodeId: string): boolean {
    const node = state.nodes[nodeId];
    if (node.kind === 'leaf') {
      steps.push(
        step(`Reached leaf [${node.keys.join(', ')}]`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      const found = node.keys.includes(key);
      if (found) {
        steps.push(
          step(`Key ${key} FOUND in leaf`, [
            { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
          ]),
        );
      } else {
        steps.push(
          step(`Key ${key} NOT FOUND in leaf`, [
            { targetId: node.id, property: 'highlight', from: 'visiting', to: 'visited' },
          ]),
        );
      }
      return found;
    }

    const internal = node as BPlusInternalNode;
    steps.push(
      step(`Traverse internal [${internal.keys.join(', ')}]`, [
        { targetId: internal.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    let childIdx = 0;
    while (childIdx < internal.keys.length && key >= internal.keys[childIdx]) {
      childIdx++;
    }

    steps.push(
      step(`Go to child index ${childIdx}`, [
        { targetId: internal.id, property: 'highlight', from: 'visiting', to: 'visited' },
      ]),
    );

    return searchNode(internal.childIds[childIdx]);
  }

  const found = searchNode(state.rootId);
  return { steps, snapshot: { found, tree: state } };
}

// ── Range Query ───────────────────────────────────────────────

export function bplusRangeQuery(
  state: BPlusTreeState,
  low: number,
  high: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const result: number[] = [];

  if (state.rootId === null) {
    steps.push(step('Tree is empty -- range query returns []', []));
    return { steps, snapshot: { result, tree: state } };
  }

  steps.push(step(`Range query [${low}, ${high}]`, []));

  // Find the leftmost leaf containing keys >= low.
  function findStartLeaf(nodeId: string): string {
    const node = state.nodes[nodeId];
    if (node.kind === 'leaf') return nodeId;
    const internal = node as BPlusInternalNode;
    steps.push(
      step(`Descend internal [${internal.keys.join(', ')}] for range start`, [
        { targetId: internal.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    let childIdx = 0;
    while (childIdx < internal.keys.length && low >= internal.keys[childIdx]) {
      childIdx++;
    }
    return findStartLeaf(internal.childIds[childIdx]);
  }

  let currentLeafId: string | null = findStartLeaf(state.rootId);

  // Scan leaves via linked list.
  while (currentLeafId !== null) {
    const leaf = state.nodes[currentLeafId] as BPlusLeafNode;
    steps.push(
      step(`Scan leaf [${leaf.keys.join(', ')}]`, [
        { targetId: leaf.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    let doneScanning = false;
    for (const k of leaf.keys) {
      if (k > high) {
        doneScanning = true;
        break;
      }
      if (k >= low) {
        result.push(k);
        steps.push(
          step(`Key ${k} in range -- add to result`, [
            { targetId: leaf.id, property: 'highlight', from: 'visiting', to: 'found' },
          ]),
        );
      }
    }

    if (doneScanning) {
      steps.push(step('Exceeded high bound -- stop scan', []));
      break;
    }

    currentLeafId = leaf.nextLeafId;
    if (currentLeafId !== null) {
      steps.push(step('Follow linked list to next leaf', []));
    }
  }

  steps.push(step(`Range query result: [${result.join(', ')}]`, []));
  return { steps, snapshot: { result, tree: state } };
}

// ── Delete ────────────────────────────────────────────────────

export function bplusDelete(
  state: BPlusTreeState,
  key: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const tree = cloneBPlusTree(state);
  const minKeys = Math.ceil(tree.order / 2) - 1;

  if (tree.rootId === null) {
    steps.push(step('Tree is empty -- nothing to delete', []));
    return { steps, snapshot: tree };
  }

  steps.push(step(`Delete key ${key}`, []));

  // Find the leaf containing the key.
  function findLeafForDelete(nodeId: string): string | null {
    const node = tree.nodes[nodeId];
    if (node.kind === 'leaf') {
      return node.keys.includes(key) ? nodeId : null;
    }
    const internal = node as BPlusInternalNode;
    steps.push(
      step(`Descend internal [${internal.keys.join(', ')}]`, [
        { targetId: internal.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    let childIdx = 0;
    while (childIdx < internal.keys.length && key >= internal.keys[childIdx]) {
      childIdx++;
    }
    return findLeafForDelete(internal.childIds[childIdx]);
  }

  const leafId = findLeafForDelete(tree.rootId);
  if (leafId === null) {
    steps.push(step(`Key ${key} not found`, []));
    return { steps, snapshot: tree };
  }

  const leaf = tree.nodes[leafId] as BPlusLeafNode;
  const keyIdx = leaf.keys.indexOf(key);
  leaf.keys.splice(keyIdx, 1);
  tree.size--;

  steps.push(
    step(`Remove ${key} from leaf [${leaf.keys.join(', ')}]`, [
      { targetId: leafId, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Update parent keys if needed (if key was used as an index).
  updateParentKeys(tree, key, leaf.keys.length > 0 ? leaf.keys[0] : null, steps, step);

  // If root is a leaf, no underflow handling needed.
  if (tree.rootId === leafId) {
    if (leaf.keys.length === 0) {
      delete tree.nodes[leafId];
      tree.rootId = null;
      steps.push(step('Root leaf is now empty -- tree is empty', []));
    }
    return { steps, snapshot: tree };
  }

  // Handle underflow.
  if (leaf.keys.length < minKeys) {
    handleLeafUnderflow(tree, leafId, steps, minKeys, step);
  }

  return { steps, snapshot: tree };
}

/** After deleting a key from a leaf, update parent index keys. */
function updateParentKeys(
  tree: BPlusTreeState,
  oldKey: number,
  _newKey: number | null,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  if (tree.rootId === null) return;
  // Walk all internal nodes and replace oldKey references.
  for (const node of Object.values(tree.nodes)) {
    if (node.kind === 'internal') {
      const idx = node.keys.indexOf(oldKey);
      if (idx !== -1 && _newKey !== null) {
        // Find the leftmost key in the right subtree for a correct replacement.
        const rightChildId = node.childIds[idx + 1];
        const newIndex = findLeftmostKey(tree, rightChildId);
        if (newIndex !== null) {
          node.keys[idx] = newIndex;
          steps.push(
            step(`Update parent index: ${oldKey} -> ${newIndex}`, [
              { targetId: node.id, property: 'key', from: oldKey, to: newIndex },
            ]),
          );
        }
      }
    }
  }
}

/** Find the leftmost (smallest) key in a subtree. */
function findLeftmostKey(tree: BPlusTreeState, nodeId: string): number | null {
  const node = tree.nodes[nodeId];
  if (!node) return null;
  if (node.kind === 'leaf') {
    return node.keys.length > 0 ? node.keys[0] : null;
  }
  return findLeftmostKey(tree, (node as BPlusInternalNode).childIds[0]);
}

/** Handle underflow in a leaf by borrowing or merging. */
function handleLeafUnderflow(
  tree: BPlusTreeState,
  leafId: string,
  steps: DSStep[],
  minKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parentId = findParent(tree, tree.rootId!, leafId);
  if (parentId === null) return; // root leaf, handled already

  const parent = tree.nodes[parentId] as BPlusInternalNode;
  const childIndex = parent.childIds.indexOf(leafId);
  const leaf = tree.nodes[leafId] as BPlusLeafNode;

  // Try borrowing from left sibling.
  if (childIndex > 0) {
    const leftSibId = parent.childIds[childIndex - 1];
    const leftSib = tree.nodes[leftSibId] as BPlusLeafNode;
    if (leftSib.keys.length > minKeys) {
      const borrowed = leftSib.keys.pop()!;
      leaf.keys.unshift(borrowed);
      parent.keys[childIndex - 1] = leaf.keys[0];
      steps.push(
        step(`Borrow ${borrowed} from left sibling`, [
          { targetId: leafId, property: 'highlight', from: 'deleting', to: 'rebalancing' },
          { targetId: leftSibId, property: 'highlight', from: 'default', to: 'rebalancing' },
        ]),
      );
      return;
    }
  }

  // Try borrowing from right sibling.
  if (childIndex < parent.childIds.length - 1) {
    const rightSibId = parent.childIds[childIndex + 1];
    const rightSib = tree.nodes[rightSibId] as BPlusLeafNode;
    if (rightSib.keys.length > minKeys) {
      const borrowed = rightSib.keys.shift()!;
      leaf.keys.push(borrowed);
      parent.keys[childIndex] = rightSib.keys[0];
      steps.push(
        step(`Borrow ${borrowed} from right sibling`, [
          { targetId: leafId, property: 'highlight', from: 'deleting', to: 'rebalancing' },
          { targetId: rightSibId, property: 'highlight', from: 'default', to: 'rebalancing' },
        ]),
      );
      return;
    }
  }

  // Merge with a sibling.
  if (childIndex > 0) {
    // Merge with left sibling.
    const leftSibId = parent.childIds[childIndex - 1];
    const leftSib = tree.nodes[leftSibId] as BPlusLeafNode;
    leftSib.keys.push(...leaf.keys);
    leftSib.nextLeafId = leaf.nextLeafId;
    if (leaf.nextLeafId !== null) {
      (tree.nodes[leaf.nextLeafId] as BPlusLeafNode).prevLeafId = leftSibId;
    }
    delete tree.nodes[leafId];
    parent.keys.splice(childIndex - 1, 1);
    parent.childIds.splice(childIndex, 1);
    steps.push(
      step(`Merge leaf into left sibling [${leftSib.keys.join(', ')}]`, [
        { targetId: leftSibId, property: 'highlight', from: 'default', to: 'merging' },
      ]),
    );
  } else {
    // Merge with right sibling.
    const rightSibId = parent.childIds[childIndex + 1];
    const rightSib = tree.nodes[rightSibId] as BPlusLeafNode;
    leaf.keys.push(...rightSib.keys);
    leaf.nextLeafId = rightSib.nextLeafId;
    if (rightSib.nextLeafId !== null) {
      (tree.nodes[rightSib.nextLeafId] as BPlusLeafNode).prevLeafId = leafId;
    }
    delete tree.nodes[rightSibId];
    parent.keys.splice(childIndex, 1);
    parent.childIds.splice(childIndex + 1, 1);
    steps.push(
      step(`Merge right sibling into leaf [${leaf.keys.join(', ')}]`, [
        { targetId: leafId, property: 'highlight', from: 'deleting', to: 'merging' },
      ]),
    );
  }

  // If parent underflows and is not root, propagate.
  if (parent.keys.length === 0 && parentId === tree.rootId) {
    // Root has no keys left -- promote the only child.
    tree.rootId = parent.childIds[0];
    delete tree.nodes[parentId];
    steps.push(step('Root underflow -- promote only child as new root', []));
  } else if (parentId !== tree.rootId) {
    const grandParentId = findParent(tree, tree.rootId!, parentId);
    if (grandParentId !== null) {
      const minInternalKeys = Math.ceil(tree.order / 2) - 1;
      if (parent.keys.length < minInternalKeys) {
        handleInternalUnderflow(tree, parentId, steps, minInternalKeys, step);
      }
    }
  }
}

/** Handle underflow in an internal node by borrowing or merging. */
function handleInternalUnderflow(
  tree: BPlusTreeState,
  nodeId: string,
  steps: DSStep[],
  minKeys: number,
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  const parentId = findParent(tree, tree.rootId!, nodeId);
  if (parentId === null) return;

  const parent = tree.nodes[parentId] as BPlusInternalNode;
  const childIndex = parent.childIds.indexOf(nodeId);
  const node = tree.nodes[nodeId] as BPlusInternalNode;

  // Try borrowing from left sibling.
  if (childIndex > 0) {
    const leftSibId = parent.childIds[childIndex - 1];
    const leftSib = tree.nodes[leftSibId] as BPlusInternalNode;
    if (leftSib.keys.length > minKeys) {
      node.keys.unshift(parent.keys[childIndex - 1]);
      parent.keys[childIndex - 1] = leftSib.keys.pop()!;
      node.childIds.unshift(leftSib.childIds.pop()!);
      steps.push(
        step('Borrow key from left internal sibling via parent rotation', [
          { targetId: nodeId, property: 'highlight', from: 'default', to: 'rebalancing' },
        ]),
      );
      return;
    }
  }

  // Try borrowing from right sibling.
  if (childIndex < parent.childIds.length - 1) {
    const rightSibId = parent.childIds[childIndex + 1];
    const rightSib = tree.nodes[rightSibId] as BPlusInternalNode;
    if (rightSib.keys.length > minKeys) {
      node.keys.push(parent.keys[childIndex]);
      parent.keys[childIndex] = rightSib.keys.shift()!;
      node.childIds.push(rightSib.childIds.shift()!);
      steps.push(
        step('Borrow key from right internal sibling via parent rotation', [
          { targetId: nodeId, property: 'highlight', from: 'default', to: 'rebalancing' },
        ]),
      );
      return;
    }
  }

  // Merge with sibling.
  if (childIndex > 0) {
    const leftSibId = parent.childIds[childIndex - 1];
    const leftSib = tree.nodes[leftSibId] as BPlusInternalNode;
    leftSib.keys.push(parent.keys[childIndex - 1], ...node.keys);
    leftSib.childIds.push(...node.childIds);
    delete tree.nodes[nodeId];
    parent.keys.splice(childIndex - 1, 1);
    parent.childIds.splice(childIndex, 1);
    steps.push(
      step('Merge internal node with left sibling', [
        { targetId: leftSibId, property: 'highlight', from: 'default', to: 'merging' },
      ]),
    );
  } else if (childIndex < parent.childIds.length - 1) {
    const rightSibId = parent.childIds[childIndex + 1];
    const rightSib = tree.nodes[rightSibId] as BPlusInternalNode;
    node.keys.push(parent.keys[childIndex], ...rightSib.keys);
    node.childIds.push(...rightSib.childIds);
    delete tree.nodes[rightSibId];
    parent.keys.splice(childIndex, 1);
    parent.childIds.splice(childIndex + 1, 1);
    steps.push(
      step('Merge right internal sibling into node', [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'merging' },
      ]),
    );
  }

  // If parent is root and has no keys, shrink.
  if (parent.keys.length === 0 && parentId === tree.rootId) {
    tree.rootId = parent.childIds[0];
    delete tree.nodes[parentId];
    steps.push(step('Root underflow -- promote only child as new root', []));
  }
}

// ── Utility: collect all leaf keys via linked list ────────────

export function bplusLeafKeys(state: BPlusTreeState): number[] {
  if (state.rootId === null) return [];
  // Find leftmost leaf.
  let nodeId = state.rootId;
  let node = state.nodes[nodeId];
  while (node.kind === 'internal') {
    nodeId = (node as BPlusInternalNode).childIds[0];
    node = state.nodes[nodeId];
  }
  // Traverse linked list.
  const keys: number[] = [];
  let current: BPlusLeafNode | null = node as BPlusLeafNode;
  while (current !== null) {
    keys.push(...current.keys);
    current = current.nextLeafId !== null
      ? (state.nodes[current.nextLeafId] as BPlusLeafNode)
      : null;
  }
  return keys;
}
