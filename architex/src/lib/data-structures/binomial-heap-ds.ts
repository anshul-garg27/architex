// -----------------------------------------------------------------
// Architex -- Binomial Heap Data Structure  (DST-034)
// A forest of binomial trees linked in a root list, ordered by
// increasing tree order. Merge is the fundamental operation --
// insert, extract-min, and decrease-key all reduce to merge.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface BinomialNode {
  id: string;
  key: number;
  order: number;        // B_k: this node is the root of a binomial tree of order k
  parent: string | null;
  children: string[];   // child node ids (leftmost child = highest order)
}

export interface BinomialHeapState {
  nodes: Map<string, BinomialNode>;
  roots: string[];       // root list, ordered by increasing tree order
  size: number;
}

let _nodeId = 0;

function makeNodeId(): string {
  return `bh-${_nodeId++}`;
}

function bhId(nodeId: string): string {
  return nodeId;
}

// ── Clone ──────────────────────────────────────────────────

export function cloneBinomialHeap(heap: BinomialHeapState): BinomialHeapState {
  const newNodes = new Map<string, BinomialNode>();
  for (const [id, node] of heap.nodes) {
    newNodes.set(id, { ...node, children: [...node.children] });
  }
  return {
    nodes: newNodes,
    roots: [...heap.roots],
    size: heap.size,
  };
}

// ── Flatten for visualization ──────────────────────────────

export interface BinomialFlatNode {
  id: string;
  key: number;
  order: number;
  depth: number;
  parentId: string | null;
  isRoot: boolean;
  treeOrder: number;   // order of the root of this node's binomial tree
}

export function flattenBinomialHeap(heap: BinomialHeapState): BinomialFlatNode[] {
  const result: BinomialFlatNode[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string, depth: number, parentId: string | null, treeOrder: number): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = heap.nodes.get(nodeId);
    if (!node) return;

    result.push({
      id: node.id,
      key: node.key,
      order: node.order,
      depth,
      parentId,
      isRoot: heap.roots.includes(node.id),
      treeOrder,
    });

    for (const childId of node.children) {
      walk(childId, depth + 1, node.id, treeOrder);
    }
  }

  for (const rootId of heap.roots) {
    const rootNode = heap.nodes.get(rootId);
    if (rootNode) {
      walk(rootId, 0, null, rootNode.order);
    }
  }

  return result;
}

// ── Create ─────────────────────────────────────────────────

/** Create an empty binomial heap. */
export function createBinomialHeap(): BinomialHeapState {
  _nodeId = 0;
  return {
    nodes: new Map(),
    roots: [],
    size: 0,
  };
}

/** Internal: create empty heap without resetting node counter. */
function emptyHeap(): BinomialHeapState {
  return { nodes: new Map(), roots: [], size: 0 };
}

// ── Link (combine two trees of same order) ─────────────────

/**
 * Link two binomial trees of the same order k.
 * The tree with the smaller root becomes the parent; its order becomes k+1.
 * Returns the id of the new root.
 */
function binomialLink(
  h: BinomialHeapState,
  id1: string,
  id2: string,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): string {
  const n1 = h.nodes.get(id1)!;
  const n2 = h.nodes.get(id2)!;

  let parentId: string;
  let childId: string;

  if (n1.key <= n2.key) {
    parentId = id1;
    childId = id2;
  } else {
    parentId = id2;
    childId = id1;
  }

  const parent = h.nodes.get(parentId)!;
  const child = h.nodes.get(childId)!;

  steps.push(
    step(
      `Link B${parent.order}: (${parent.key}) absorbs (${child.key}) -> B${parent.order + 1}`,
      [
        { targetId: bhId(parentId), property: 'highlight', from: 'default', to: 'comparing' },
        { targetId: bhId(childId), property: 'highlight', from: 'default', to: 'shifting' },
      ],
    ),
  );

  // child becomes leftmost child of parent
  child.parent = parentId;
  parent.children.unshift(childId);
  parent.order += 1;

  return parentId;
}

// ── Internal merge (no resetStepId -- used by insert / extractMin) ──

function mergeHeapsInternal(
  h1: BinomialHeapState,
  h2: BinomialHeapState,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): BinomialHeapState {
  // Combine all nodes into a single map
  const h = emptyHeap();
  h.size = h1.size + h2.size;

  for (const [id, node] of h1.nodes) {
    h.nodes.set(id, { ...node, children: [...node.children] });
  }
  for (const [id, node] of h2.nodes) {
    h.nodes.set(id, { ...node, children: [...node.children] });
  }

  // Merge root lists sorted by order
  const merged: string[] = [];
  let i = 0;
  let j = 0;
  const r1 = [...h1.roots];
  const r2 = [...h2.roots];

  while (i < r1.length && j < r2.length) {
    const o1 = h.nodes.get(r1[i])!.order;
    const o2 = h.nodes.get(r2[j])!.order;
    if (o1 <= o2) {
      merged.push(r1[i++]);
    } else {
      merged.push(r2[j++]);
    }
  }
  while (i < r1.length) merged.push(r1[i++]);
  while (j < r2.length) merged.push(r2[j++]);

  if (merged.length === 0) {
    h.roots = [];
    steps.push(step(`Both heaps empty -- result is empty`, []));
    return h;
  }

  steps.push(
    step(
      `Merged root list: [${merged.map((id) => `B${h.nodes.get(id)!.order}(${h.nodes.get(id)!.key})`).join(', ')}]`,
      [],
    ),
  );

  // Consolidate using the standard 3-pointer algorithm (prev, curr, next)
  const newRoots: string[] = [];
  let idx = 0;

  while (idx < merged.length) {
    const currId = merged[idx];
    const currOrder = h.nodes.get(currId)!.order;

    // Look ahead: is the next root the same order?
    if (idx + 1 < merged.length && h.nodes.get(merged[idx + 1])!.order === currOrder) {
      // If there is a THIRD root of the same order, skip current and link next two
      if (idx + 2 < merged.length && h.nodes.get(merged[idx + 2])!.order === currOrder) {
        // Push current as-is; link the next two
        newRoots.push(currId);
        const linked = binomialLink(h, merged[idx + 1], merged[idx + 2], steps, step);
        // The linked result has order+1; re-insert it for further consolidation
        merged.splice(idx + 1, 2, linked);
        idx++;
      } else {
        // Link current with next
        const linked = binomialLink(h, currId, merged[idx + 1], steps, step);
        merged.splice(idx, 2, linked);
        // Don't advance idx -- check the linked result against the next element
      }
    } else {
      newRoots.push(currId);
      idx++;
    }
  }

  // Reset parent pointers for all roots
  for (const rootId of newRoots) {
    const rootNode = h.nodes.get(rootId)!;
    rootNode.parent = null;
  }

  h.roots = newRoots;

  steps.push(
    step(
      `Consolidation done. Root list: [${newRoots.map((id) => `B${h.nodes.get(id)!.order}(${h.nodes.get(id)!.key})`).join(', ')}], size = ${h.size}`,
      [],
    ),
  );

  return h;
}

// ── Merge (public) ──────────────────────────────────────────

/**
 * Merge two binomial heaps.
 * Combines root lists and links trees of the same order
 * (similar to binary addition with carries).
 */
export function binomialMerge(
  h1: BinomialHeapState,
  h2: BinomialHeapState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Merge two binomial heaps: sizes ${h1.size} + ${h2.size}`, []),
  );

  const result = mergeHeapsInternal(h1, h2, steps, step);
  return { steps, snapshot: result };
}

// ── Insert ─────────────────────────────────────────────────

/** Insert a key by creating a single-node heap and merging. */
export function binomialInsert(
  heap: BinomialHeapState,
  key: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Insert key=${key} into binomial heap`, []));

  // Create a B0 tree with just this node
  const nodeId = makeNodeId();
  const singleHeap: BinomialHeapState = {
    nodes: new Map([
      [nodeId, { id: nodeId, key, order: 0, parent: null, children: [] }],
    ]),
    roots: [nodeId],
    size: 1,
  };

  steps.push(
    step(`Create single-node B0 tree with key=${key}`, [
      { targetId: bhId(nodeId), property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  const result = mergeHeapsInternal(heap, singleHeap, steps, step);

  steps.push(step(`Insert complete. Size = ${result.size}`, []));

  return { steps, snapshot: result };
}

// ── Find Min ───────────────────────────────────────────────

/** Scan the root list to find the minimum key. */
export function binomialFindMin(heap: BinomialHeapState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Find minimum key by scanning root list`, []));

  if (heap.roots.length === 0) {
    steps.push(step(`Heap is empty -- no minimum`, []));
    return { steps, snapshot: heap };
  }

  let minId: string | null = null;
  let minKey = Infinity;

  for (const rootId of heap.roots) {
    const node = heap.nodes.get(rootId)!;
    steps.push(
      step(`Check root B${node.order}: key=${node.key}`, [
        { targetId: bhId(rootId), property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (node.key < minKey) {
      minKey = node.key;
      minId = rootId;
    }
  }

  steps.push(
    step(`Minimum key = ${minKey} (node ${minId})`, [
      { targetId: bhId(minId!), property: 'highlight', from: 'comparing', to: 'found' },
    ]),
  );

  return { steps, snapshot: heap };
}

// ── Extract Min ────────────────────────────────────────────

/**
 * Remove the root with minimum key, reverse its children into a new heap,
 * then merge the remaining heap with the children heap.
 */
export function binomialExtractMin(heap: BinomialHeapState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneBinomialHeap(heap);

  steps.push(step(`Extract minimum from binomial heap`, []));

  if (h.roots.length === 0) {
    steps.push(step(`Heap is empty -- nothing to extract`, []));
    return { steps, snapshot: h };
  }

  // Find minimum root
  let minId = h.roots[0];
  let minKey = h.nodes.get(minId)!.key;

  for (const rootId of h.roots) {
    const node = h.nodes.get(rootId)!;
    if (node.key < minKey) {
      minKey = node.key;
      minId = rootId;
    }
  }

  const minNode = h.nodes.get(minId)!;

  steps.push(
    step(`Minimum root: B${minNode.order} with key=${minKey}`, [
      { targetId: bhId(minId), property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Remove min root from root list
  const remainingRoots = h.roots.filter((id) => id !== minId);

  // Build remaining heap (all nodes except minNode's subtree)
  const minChildIds = new Set<string>();
  function collectSubtreeIds(nodeId: string): void {
    minChildIds.add(nodeId);
    const node = h.nodes.get(nodeId);
    if (!node) return;
    for (const cid of node.children) {
      collectSubtreeIds(cid);
    }
  }
  collectSubtreeIds(minId);

  const remainingHeap: BinomialHeapState = {
    nodes: new Map(),
    roots: remainingRoots,
    size: 0,
  };
  for (const [id, node] of h.nodes) {
    if (!minChildIds.has(id)) {
      remainingHeap.nodes.set(id, { ...node, children: [...node.children] });
      remainingHeap.size++;
    }
  }

  // Build children heap: reverse children of min node to get increasing order
  const childrenReversed = [...minNode.children].reverse();
  const childHeap: BinomialHeapState = {
    nodes: new Map(),
    roots: childrenReversed,
    size: 0,
  };

  // Copy minNode's descendants (except minNode itself) into childHeap
  for (const id of minChildIds) {
    if (id === minId) continue;
    const node = h.nodes.get(id)!;
    childHeap.nodes.set(id, { ...node, children: [...node.children] });
    childHeap.size++;
  }
  // Reset parent pointers for children that are now roots
  for (const childId of childrenReversed) {
    const child = childHeap.nodes.get(childId);
    if (child) child.parent = null;
  }

  steps.push(
    step(
      `Remove min root. Reverse its ${childrenReversed.length} children into a new heap`,
      [],
    ),
  );

  if (childrenReversed.length > 0) {
    steps.push(
      step(
        `Children heap: [${childrenReversed.map((id) => `B${childHeap.nodes.get(id)?.order ?? '?'}(${childHeap.nodes.get(id)?.key ?? '?'})`).join(', ')}]`,
        [],
      ),
    );
  }

  // Merge remaining with children
  const result = mergeHeapsInternal(remainingHeap, childHeap, steps, step);

  steps.push(
    step(`Extracted min = ${minKey}. New size = ${result.size}`, []),
  );

  return { steps, snapshot: result };
}

// ── Decrease Key ───────────────────────────────────────────

/** Decrease a node's key and bubble up to restore min-heap order. */
export function binomialDecreaseKey(
  heap: BinomialHeapState,
  nodeId: string,
  newKey: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneBinomialHeap(heap);

  const node = h.nodes.get(nodeId);
  if (!node) {
    steps.push(step(`Node ${nodeId} not found`, []));
    return { steps, snapshot: h };
  }

  if (newKey > node.key) {
    steps.push(step(`New key ${newKey} > current key ${node.key} -- invalid`, []));
    return { steps, snapshot: h };
  }

  const oldKey = node.key;
  node.key = newKey;

  steps.push(
    step(`Decrease key of ${nodeId}: ${oldKey} -> ${newKey}`, [
      { targetId: bhId(nodeId), property: 'key', from: oldKey, to: newKey },
    ]),
  );

  // Bubble up: swap keys with parent while violating min-heap order
  let current = node;
  while (current.parent !== null) {
    const parent = h.nodes.get(current.parent);
    if (!parent) break;

    if (current.key >= parent.key) {
      steps.push(
        step(`${current.key} >= parent ${parent.key} -- heap order satisfied`, [
          { targetId: bhId(current.id), property: 'highlight', from: 'default', to: 'done' },
        ]),
      );
      break;
    }

    steps.push(
      step(`Bubble up: swap keys ${current.key} <-> ${parent.key}`, [
        { targetId: bhId(current.id), property: 'key', from: current.key, to: parent.key },
        { targetId: bhId(parent.id), property: 'key', from: parent.key, to: current.key },
      ]),
    );

    // Swap keys to keep tree structure intact
    const tmpKey = current.key;
    current.key = parent.key;
    parent.key = tmpKey;

    current = parent;
  }

  steps.push(
    step(`Decrease key complete. Key ${oldKey} -> ${newKey}`, []),
  );

  return { steps, snapshot: h };
}

// ── Search (linear scan) ──────────────────────────────────

/** Search for a key by scanning all nodes. */
export function binomialSearch(
  heap: BinomialHeapState,
  key: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (heap.size === 0) {
    steps.push(step('Heap is empty -- nothing to search', []));
    return { steps, snapshot: heap };
  }

  steps.push(
    step(`Search for key ${key} in Binomial Heap (${heap.size} nodes)`, []),
  );

  let found = false;

  for (const [nodeId, node] of heap.nodes) {
    steps.push(
      step(`Check node ${nodeId}: key=${node.key}${node.key === key ? ' -- FOUND' : ''}`, [
        {
          targetId: bhId(nodeId),
          property: 'highlight',
          from: 'default',
          to: node.key === key ? 'found' : 'comparing',
        },
      ]),
    );

    if (node.key === key) {
      found = true;
      steps.push(
        step(`Key ${key} found at node ${nodeId}`, [
          { targetId: bhId(nodeId), property: 'highlight', from: 'found', to: 'done' },
        ]),
      );
      break;
    }
  }

  if (!found) {
    steps.push(
      step(`Key ${key} not found in the Binomial Heap`, []),
    );
  }

  return { steps, snapshot: heap };
}
