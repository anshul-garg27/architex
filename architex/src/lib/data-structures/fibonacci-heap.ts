// -----------------------------------------------------------------
// Architex -- Fibonacci Heap  (DST-031)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface FibNode {
  id: string;
  key: number;
  degree: number;
  marked: boolean;
  parent: string | null;
  children: string[];
}

export interface FibHeapState {
  nodes: Map<string, FibNode>;
  roots: string[];          // root list (node ids)
  minId: string | null;     // pointer to min node
  size: number;
}

let _nodeId = 0;

function makeNodeId(): string {
  return `fib-${_nodeId++}`;
}

// ── Create / Clone ─────────────────────────────────────────

export function createFibHeap(): FibHeapState {
  _nodeId = 0;
  return {
    nodes: new Map(),
    roots: [],
    minId: null,
    size: 0,
  };
}

export function cloneFibHeap(heap: FibHeapState): FibHeapState {
  const newNodes = new Map<string, FibNode>();
  for (const [id, node] of heap.nodes) {
    newNodes.set(id, { ...node, children: [...node.children] });
  }
  return {
    nodes: newNodes,
    roots: [...heap.roots],
    minId: heap.minId,
    size: heap.size,
  };
}

// ── Flatten for visualization ──────────────────────────────

export interface FibFlatNode {
  id: string;
  key: number;
  degree: number;
  marked: boolean;
  depth: number;
  parentId: string | null;
  isMin: boolean;
  isRoot: boolean;
}

export function flattenFibHeap(heap: FibHeapState): FibFlatNode[] {
  const result: FibFlatNode[] = [];

  function walk(nodeId: string, depth: number, parentId: string | null): void {
    const node = heap.nodes.get(nodeId);
    if (!node) return;

    result.push({
      id: node.id,
      key: node.key,
      degree: node.degree,
      marked: node.marked,
      depth,
      parentId,
      isMin: node.id === heap.minId,
      isRoot: heap.roots.includes(node.id),
    });

    for (const childId of node.children) {
      walk(childId, depth + 1, node.id);
    }
  }

  for (const rootId of heap.roots) {
    walk(rootId, 0, null);
  }

  return result;
}

// ── Insert (O(1)) ──────────────────────────────────────────

export function fibInsert(heap: FibHeapState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneFibHeap(heap);

  const nodeId = makeNodeId();
  const newNode: FibNode = {
    id: nodeId,
    key,
    degree: 0,
    marked: false,
    parent: null,
    children: [],
  };

  h.nodes.set(nodeId, newNode);
  h.roots.push(nodeId);
  h.size++;

  steps.push(
    step(`Insert key ${key} -- add to root list as new tree`, [
      { targetId: nodeId, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // Update min
  if (h.minId === null) {
    h.minId = nodeId;
    steps.push(
      step(`${key} is the first node -- set as min`, [
        { targetId: nodeId, property: 'highlight', from: 'inserting', to: 'done' },
      ]),
    );
  } else {
    const minNode = h.nodes.get(h.minId)!;
    if (key < minNode.key) {
      steps.push(
        step(`${key} < ${minNode.key} (current min) -- update min pointer`, [
          { targetId: nodeId, property: 'highlight', from: 'inserting', to: 'done' },
          { targetId: h.minId, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      h.minId = nodeId;
    } else {
      steps.push(
        step(`${key} >= ${minNode.key} (current min) -- min unchanged`, [
          { targetId: nodeId, property: 'highlight', from: 'inserting', to: 'done' },
        ]),
      );
    }
  }

  steps.push(
    step(`Insert complete. Roots: ${h.roots.length}, Size: ${h.size}`, []),
  );

  return { steps, snapshot: h };
}

// ── Extract Min (O(log n) amortized) ───────────────────────

export function fibExtractMin(heap: FibHeapState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneFibHeap(heap);

  if (h.minId === null) {
    steps.push(step('Heap is empty -- nothing to extract', []));
    return { steps, snapshot: h };
  }

  const minNode = h.nodes.get(h.minId)!;
  const minKey = minNode.key;

  steps.push(
    step(`Extract min = ${minKey} (node ${h.minId})`, [
      { targetId: h.minId, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Move children of min to root list
  for (const childId of minNode.children) {
    const child = h.nodes.get(childId);
    if (child) {
      child.parent = null;
      h.roots.push(childId);
      steps.push(
        step(`Move child ${childId} (key=${child.key}) to root list`, [
          { targetId: childId, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
    }
  }

  // Remove min from root list
  h.roots = h.roots.filter((id) => id !== h.minId);
  h.nodes.delete(h.minId!);
  h.size--;

  if (h.roots.length === 0) {
    h.minId = null;
    steps.push(step(`Heap is now empty after extraction`, []));
    return { steps, snapshot: h };
  }

  // Consolidate: merge trees of same degree
  steps.push(
    step(`Consolidation phase: merge trees of equal degree`, []),
  );

  const maxDegree = Math.floor(Math.log2(h.size + 1)) + 2;
  const degreeTable: (string | null)[] = Array.from({ length: maxDegree + 1 }, () => null);

  const rootsCopy = [...h.roots];
  h.roots = [];

  for (const rootId of rootsCopy) {
    let current = rootId;
    let currentNode = h.nodes.get(current);
    if (!currentNode) continue;

    let d = currentNode.degree;

    while (d < degreeTable.length && degreeTable[d] !== null) {
      let other = degreeTable[d]!;
      let otherNode = h.nodes.get(other)!;
      currentNode = h.nodes.get(current)!;

      // Ensure current has smaller key
      if (currentNode.key > otherNode.key) {
        const tmp = current;
        current = other;
        other = tmp;
        currentNode = h.nodes.get(current)!;
        otherNode = h.nodes.get(other)!;
      }

      steps.push(
        step(`Merge degree-${d} trees: ${current} (key=${currentNode.key}) absorbs ${other} (key=${otherNode.key})`, [
          { targetId: current, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: other, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );

      // Link other under current
      otherNode.parent = current;
      otherNode.marked = false;
      currentNode.children.push(other);
      currentNode.degree++;

      degreeTable[d] = null;
      d = currentNode.degree;
    }

    if (d < degreeTable.length) {
      degreeTable[d] = current;
    }
  }

  // Rebuild root list and find new min
  h.minId = null;
  for (const entry of degreeTable) {
    if (entry !== null) {
      h.roots.push(entry);
      const node = h.nodes.get(entry)!;
      node.parent = null;
      if (h.minId === null || node.key < h.nodes.get(h.minId)!.key) {
        h.minId = entry;
      }
    }
  }

  if (h.minId) {
    steps.push(
      step(`Consolidation done. New min = ${h.nodes.get(h.minId)!.key}. Roots: ${h.roots.length}`, [
        { targetId: h.minId, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  steps.push(
    step(`Extracted ${minKey}. Size: ${h.size}`, []),
  );

  return { steps, snapshot: h };
}

// ── Decrease Key (O(1) amortized) ──────────────────────────

export function fibDecreaseKey(
  heap: FibHeapState,
  nodeId: string,
  newKey: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const h = cloneFibHeap(heap);

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
      { targetId: nodeId, property: 'highlight', from: 'default', to: 'updating' },
    ]),
  );

  if (node.parent !== null) {
    const parent = h.nodes.get(node.parent);
    if (parent && newKey < parent.key) {
      // Cut: remove node from parent and add to root list
      cascadingCut(h, nodeId, steps, step);
    }
  }

  // Update min
  if (h.minId && newKey < h.nodes.get(h.minId)!.key) {
    steps.push(
      step(`${newKey} < current min ${h.nodes.get(h.minId)!.key} -- update min`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
    h.minId = nodeId;
  }

  return { steps, snapshot: h };
}

// ── Search (linear scan) ──────────────────────────────────

export function fibSearch(heap: FibHeapState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (heap.size === 0) {
    steps.push(step('Heap is empty -- nothing to search', []));
    return { steps, snapshot: heap };
  }

  steps.push(
    step(`Search for key ${key} in Fibonacci Heap (${heap.size} nodes)`, []),
  );

  let found = false;

  for (const [nodeId, node] of heap.nodes) {
    steps.push(
      step(`Check node ${nodeId}: key=${node.key}${node.key === key ? ' -- FOUND' : ''}`, [
        {
          targetId: nodeId,
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
          { targetId: nodeId, property: 'highlight', from: 'found', to: 'done' },
        ]),
      );
      break;
    }
  }

  if (!found) {
    steps.push(
      step(`Key ${key} not found in the Fibonacci Heap`, []),
    );
  }

  return { steps, snapshot: heap };
}

function cascadingCut(h: FibHeapState, nodeId: string, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): void {
  const node = h.nodes.get(nodeId);
  if (!node || node.parent === null) return;

  const parentId = node.parent;
  const parent = h.nodes.get(parentId);
  if (!parent) return;

  // Cut node from parent
  parent.children = parent.children.filter((c) => c !== nodeId);
  parent.degree--;
  node.parent = null;
  node.marked = false;
  h.roots.push(nodeId);

  steps.push(
    step(`Cut ${nodeId} (key=${node.key}) from parent ${parentId} -- move to root list`, [
      { targetId: nodeId, property: 'highlight', from: 'default', to: 'shifting' },
      { targetId: parentId, property: 'highlight', from: 'default', to: 'comparing' },
    ]),
  );

  // Cascading cut on parent
  if (parent.parent !== null) {
    if (!parent.marked) {
      parent.marked = true;
      steps.push(
        step(`Mark parent ${parentId} (key=${parent.key})`, [
          { targetId: parentId, property: 'highlight', from: 'comparing', to: 'updating' },
        ]),
      );
    } else {
      steps.push(
        step(`Parent ${parentId} was already marked -- cascading cut`, [
          { targetId: parentId, property: 'highlight', from: 'comparing', to: 'shifting' },
        ]),
      );
      cascadingCut(h, parentId, steps, step);
    }
  }
}
