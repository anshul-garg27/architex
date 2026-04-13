// -----------------------------------------------------------------
// Architex -- Interval Tree Data Structure  (DST-129)
// -----------------------------------------------------------------
// Augmented BST for efficient interval overlap queries. Each node
// stores an [low, high] interval plus the maximum endpoint in its
// subtree. Used by Linux kernel (scheduling), database range queries,
// computational geometry, and calendar/booking conflict detection.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface Interval {
  low: number;
  high: number;
}

export interface ITNode {
  id: string;
  interval: Interval;
  max: number;
  left: ITNode | null;
  right: ITNode | null;
}

export interface IntervalTreeState {
  root: ITNode | null;
  size: number;
}

// ── Factory + Clone ────────────────────────────────────────

export function createIntervalTree(): IntervalTreeState {
  return { root: null, size: 0 };
}

function cloneNode(node: ITNode | null): ITNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneNode(node.left),
    right: cloneNode(node.right),
  };
}

function cloneTree(state: IntervalTreeState): IntervalTreeState {
  return { root: cloneNode(state.root), size: state.size };
}

// ── Internal helpers ──────────────────────────────────────

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.low <= b.high && b.low <= a.high;
}

function intervalStr(iv: Interval): string {
  return `[${iv.low}, ${iv.high}]`;
}

/** Recompute the max field for a node based on its interval and children. */
function updateMax(node: ITNode): void {
  node.max = node.interval.high;
  if (node.left && node.left.max > node.max) {
    node.max = node.left.max;
  }
  if (node.right && node.right.max > node.max) {
    node.max = node.right.max;
  }
}

/** Find the in-order successor (leftmost node in right subtree). */
function findMin(node: ITNode): ITNode {
  let cur = node;
  while (cur.left) cur = cur.left;
  return cur;
}

let _nodeIdCounter = 0;

function makeNodeId(): string {
  return `it-node-${_nodeIdCounter++}`;
}

// ── itInsert ─────────────────────────────────────────────

export function itInsert(state: IntervalTreeState, interval: Interval): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTree(state);

  steps.push(
    step(
      `INSERT ${intervalStr(interval)} -- Inserting interval into the augmented BST. We order by the low endpoint (like a normal BST) and maintain a 'max' field at each node that tracks the highest endpoint in the entire subtree.`,
      [],
    ),
  );

  const newNode: ITNode = {
    id: makeNodeId(),
    interval: { ...interval },
    max: interval.high,
    left: null,
    right: null,
  };

  if (!s.root) {
    s.root = newNode;
    s.size = 1;
    steps.push(
      step(
        `Tree was empty. ${intervalStr(interval)} becomes the root with max=${interval.high}. The max field equals the high endpoint since there are no children yet.`,
        [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
      ),
    );
    steps.push(
      step(
        `Insert complete. Size: ${s.size}`,
        [{ targetId: newNode.id, property: 'highlight', from: 'inserting', to: 'done' }],
      ),
    );
    return { steps, snapshot: s };
  }

  // BST insertion by low endpoint
  function insertRec(node: ITNode): ITNode {
    if (interval.low <= node.interval.low) {
      steps.push(
        step(
          `${intervalStr(interval)}.low (${interval.low}) <= ${intervalStr(node.interval)}.low (${node.interval.low}), go LEFT. Standard BST ordering by low endpoint.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
        ),
      );
      if (!node.left) {
        node.left = newNode;
        steps.push(
          step(
            `Inserted ${intervalStr(interval)} as left child of ${intervalStr(node.interval)}.`,
            [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
          ),
        );
      } else {
        node.left = insertRec(node.left);
      }
    } else {
      steps.push(
        step(
          `${intervalStr(interval)}.low (${interval.low}) > ${intervalStr(node.interval)}.low (${node.interval.low}), go RIGHT.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
        ),
      );
      if (!node.right) {
        node.right = newNode;
        steps.push(
          step(
            `Inserted ${intervalStr(interval)} as right child of ${intervalStr(node.interval)}.`,
            [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
          ),
        );
      } else {
        node.right = insertRec(node.right);
      }
    }

    // Update max on the way back up -- this is the "augmented" part
    const oldMax = node.max;
    updateMax(node);
    if (node.max !== oldMax) {
      steps.push(
        step(
          `Updating max of ${intervalStr(node.interval)} from ${oldMax} to ${node.max}. The max field propagates upward so that any ancestor can quickly decide whether its subtree MIGHT contain overlapping intervals.`,
          [{ targetId: node.id, property: 'max', from: oldMax, to: node.max }],
        ),
      );
    }

    return node;
  }

  s.root = insertRec(s.root);
  s.size++;

  steps.push(
    step(
      `Insert complete. Size: ${s.size}. Root max: ${s.root.max}.`,
      [{ targetId: newNode.id, property: 'highlight', from: 'inserting', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── itDelete ─────────────────────────────────────────────

export function itDelete(state: IntervalTreeState, interval: Interval): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTree(state);

  steps.push(
    step(
      `DELETE ${intervalStr(interval)} -- Searching for the interval to remove, then rebalancing the BST and recalculating max fields up the tree.`,
      [],
    ),
  );

  if (!s.root) {
    steps.push(step(`Tree is empty -- nothing to delete.`, []));
    return { steps, snapshot: s };
  }

  let found = false;

  function deleteRec(node: ITNode | null): ITNode | null {
    if (!node) {
      if (!found) {
        steps.push(
          step(`Reached null -- interval ${intervalStr(interval)} not found in tree.`, []),
        );
      }
      return null;
    }

    // Check if this node matches
    if (node.interval.low === interval.low && node.interval.high === interval.high) {
      found = true;
      steps.push(
        step(
          `Found ${intervalStr(interval)} at node ${node.id}. Removing it from the tree.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'deleting' }],
        ),
      );

      // Case 1: No left child
      if (!node.left) {
        return node.right;
      }
      // Case 2: No right child
      if (!node.right) {
        return node.left;
      }
      // Case 3: Two children -- replace with in-order successor
      const successor = findMin(node.right);
      steps.push(
        step(
          `Node has two children. Replacing with in-order successor ${intervalStr(successor.interval)} and deleting the successor from the right subtree.`,
          [{ targetId: successor.id, property: 'highlight', from: 'default', to: 'shifting' }],
        ),
      );
      node.interval = { ...successor.interval };
      node.id = successor.id;
      // Delete the successor from right subtree
      node.right = deleteSuccessor(node.right, successor.interval);
      updateMax(node);
      return node;
    }

    // BST search
    if (interval.low <= node.interval.low) {
      steps.push(
        step(
          `${intervalStr(interval)}.low (${interval.low}) <= ${intervalStr(node.interval)}.low (${node.interval.low}), searching LEFT.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
        ),
      );
      node.left = deleteRec(node.left);
    } else {
      steps.push(
        step(
          `${intervalStr(interval)}.low (${interval.low}) > ${intervalStr(node.interval)}.low (${node.interval.low}), searching RIGHT.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
        ),
      );
      node.right = deleteRec(node.right);
    }

    updateMax(node);
    return node;
  }

  /** Delete a specific successor node (used after finding in-order successor). */
  function deleteSuccessor(node: ITNode | null, iv: Interval): ITNode | null {
    if (!node) return null;
    if (node.interval.low === iv.low && node.interval.high === iv.high) {
      // Successor has no left child (it IS the leftmost)
      return node.right;
    }
    node.left = deleteSuccessor(node.left, iv);
    updateMax(node);
    return node;
  }

  s.root = deleteRec(s.root);
  if (found) {
    s.size--;
    steps.push(
      step(
        `Delete complete. Size: ${s.size}.${s.root ? ` Root max: ${s.root.max}.` : ' Tree is now empty.'}`,
        [],
      ),
    );
  }

  return { steps, snapshot: s };
}

// ── itOverlapSearch ──────────────────────────────────────

// WHY the max field enables pruning: In a normal BST you'd have to check
// every node for overlap -- O(n). The augmented max field lets us skip entire
// subtrees: if a node's max < our query's low, no interval in that subtree
// can possibly overlap our query. This gives O(log n + k) for k results.

export function itOverlapSearch(state: IntervalTreeState, query: Interval): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTree(state);

  steps.push(
    step(
      `SEARCH for first interval overlapping ${intervalStr(query)}. Two intervals ${intervalStr(query)} and [a, b] overlap when a <= ${query.high} AND b >= ${query.low}. The max field lets us prune subtrees that cannot contain overlaps.`,
      [],
    ),
  );

  if (!s.root) {
    steps.push(step(`Tree is empty -- no overlaps possible.`, []));
    return { steps, snapshot: s };
  }

  function searchRec(node: ITNode | null): ITNode | null {
    if (!node) {
      steps.push(step(`Reached null -- no overlap found on this path.`, []));
      return null;
    }

    steps.push(
      step(
        `At node ${intervalStr(node.interval)}, max=${node.max}. Checking overlap with ${intervalStr(query)}: ${node.interval.low} <= ${query.high} AND ${node.interval.high} >= ${query.low}?`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
      ),
    );

    if (intervalsOverlap(node.interval, query)) {
      steps.push(
        step(
          `OVERLAP FOUND! ${intervalStr(node.interval)} overlaps ${intervalStr(query)} because ${node.interval.low} <= ${query.high} AND ${node.interval.high} >= ${query.low}. This is the augmented BST trick -- the max field lets us prune entire subtrees.`,
          [{ targetId: node.id, property: 'highlight', from: 'comparing', to: 'found' }],
        ),
      );
      return node;
    }

    // If left child's max >= query.low, there COULD be an overlap in the left subtree
    if (node.left && node.left.max >= query.low) {
      steps.push(
        step(
          `Left subtree max (${node.left.max}) >= query.low (${query.low}), so there COULD be overlaps in the left subtree. Going LEFT.`,
          [{ targetId: node.id, property: 'highlight', from: 'comparing', to: 'visiting' }],
        ),
      );
      const result = searchRec(node.left);
      if (result) return result;
    }

    // Otherwise go right (or if left had no overlap, try right)
    steps.push(
      step(
        `Trying right subtree of ${intervalStr(node.interval)}.`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' }],
      ),
    );
    return searchRec(node.right);
  }

  const result = searchRec(s.root);

  if (!result) {
    steps.push(
      step(
        `No interval in the tree overlaps ${intervalStr(query)}.`,
        [],
      ),
    );
  } else {
    steps.push(
      step(
        `Search complete. Found overlapping interval: ${intervalStr(result.interval)}.`,
        [{ targetId: result.id, property: 'highlight', from: 'found', to: 'done' }],
      ),
    );
  }

  return { steps, snapshot: s };
}

// ── itAllOverlaps ────────────────────────────────────────

// Find ALL intervals that overlap with the query. This is the real power
// of interval trees -- efficiently finding every conflict, not just the first.

export function itAllOverlaps(state: IntervalTreeState, query: Interval): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTree(state);
  const results: Interval[] = [];

  steps.push(
    step(
      `FIND ALL intervals overlapping ${intervalStr(query)}. We traverse the tree, using the max field to prune subtrees that cannot contain any overlaps -- O(log n + k) where k is the number of results.`,
      [],
    ),
  );

  if (!s.root) {
    steps.push(step(`Tree is empty -- no overlaps possible.`, []));
    return { steps, snapshot: s };
  }

  function findAll(node: ITNode | null): void {
    if (!node) return;

    // Prune: if node's max < query.low, nothing in this subtree overlaps
    if (node.max < query.low) {
      steps.push(
        step(
          `PRUNE subtree rooted at ${intervalStr(node.interval)}: max (${node.max}) < query.low (${query.low}). No interval in this subtree can overlap ${intervalStr(query)} -- this is the key optimization that makes interval trees fast.`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' }],
        ),
      );
      return;
    }

    // Check left subtree first (in-order)
    findAll(node.left);

    // Check current node
    steps.push(
      step(
        `Checking ${intervalStr(node.interval)} against ${intervalStr(query)}: ${node.interval.low} <= ${query.high} AND ${node.interval.high} >= ${query.low}?`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
      ),
    );

    if (intervalsOverlap(node.interval, query)) {
      results.push({ ...node.interval });
      steps.push(
        step(
          `OVERLAP! ${intervalStr(node.interval)} overlaps ${intervalStr(query)}. Total overlaps found so far: ${results.length}.`,
          [{ targetId: node.id, property: 'highlight', from: 'comparing', to: 'found' }],
        ),
      );
    } else {
      steps.push(
        step(
          `No overlap: ${intervalStr(node.interval)} does not overlap ${intervalStr(query)}.`,
          [{ targetId: node.id, property: 'highlight', from: 'comparing', to: 'visited' }],
        ),
      );
    }

    // If node.interval.low > query.high, no right subtree node can overlap
    // (all right children have low >= node.interval.low > query.high)
    if (node.interval.low > query.high) {
      steps.push(
        step(
          `PRUNE right subtree: ${intervalStr(node.interval)}.low (${node.interval.low}) > query.high (${query.high}). All right children have even larger low values, so none can overlap.`,
          [],
        ),
      );
      return;
    }

    // Check right subtree
    findAll(node.right);
  }

  findAll(s.root);

  const resultStrs = results.map(intervalStr).join(', ');
  steps.push(
    step(
      `Search complete. Found ${results.length} overlapping interval${results.length !== 1 ? 's' : ''}: ${resultStrs || '(none)'}. Tree size: ${s.size}.`,
      [],
    ),
  );

  return { steps, snapshot: s };
}
