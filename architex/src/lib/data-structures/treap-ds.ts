// -----------------------------------------------------------------
// Architex -- Treap Data Structure  (DST-033)
// A randomized BST where each node has a (key, priority) pair.
// BST order on keys, max-heap order on priorities.
// Rotations restore heap property after BST insert.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface TreapNode {
  id: string;
  key: number;
  priority: number;
  left: TreapNode | null;
  right: TreapNode | null;
}

export interface TreapState {
  root: TreapNode | null;
  size: number;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `treap-${_nodeIdCounter++}`;
}

function treapId(nodeId: string): string {
  return nodeId;
}

/** Generate a random integer priority in [1, 100]. */
function randomPriority(): number {
  return Math.floor(Math.random() * 100) + 1;
}

// ── Clone / Utility ────────────────────────────────────────

function cloneNode(node: TreapNode | null): TreapNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneNode(node.left),
    right: cloneNode(node.right),
  };
}

export function cloneTreap(state: TreapState): TreapState {
  return { root: cloneNode(state.root), size: state.size };
}

export function treapToArray(node: TreapNode | null): number[] {
  const result: number[] = [];
  function inorder(n: TreapNode | null): void {
    if (!n) return;
    inorder(n.left);
    result.push(n.key);
    inorder(n.right);
  }
  inorder(node);
  return result;
}

export function treapSize(node: TreapNode | null): number {
  if (!node) return 0;
  return 1 + treapSize(node.left) + treapSize(node.right);
}

// ── Rotations ──────────────────────────────────────────────

/** Right rotation: y's left child x becomes the new root. */
function rotateRight(y: TreapNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): TreapNode {
  const x = y.left!;
  const B = x.right;

  steps.push(
    step(
      `Right rotation at (${y.key}, p=${y.priority}): pivot (${x.key}, p=${x.priority}) up`,
      [
        { targetId: treapId(y.id), property: 'highlight', from: 'default', to: 'rotating' },
        { targetId: treapId(x.id), property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  x.right = y;
  y.left = B;
  return x;
}

/** Left rotation: x's right child y becomes the new root. */
function rotateLeft(x: TreapNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): TreapNode {
  const y = x.right!;
  const B = y.left;

  steps.push(
    step(
      `Left rotation at (${x.key}, p=${x.priority}): pivot (${y.key}, p=${y.priority}) up`,
      [
        { targetId: treapId(x.id), property: 'highlight', from: 'default', to: 'rotating' },
        { targetId: treapId(y.id), property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  y.left = x;
  x.right = B;
  return y;
}

// ── Create ─────────────────────────────────────────────────

/** Create an empty treap. */
export function createTreap(): TreapState {
  _nodeIdCounter = 0;
  return { root: null, size: 0 };
}

// ── Insert ─────────────────────────────────────────────────

/**
 * BST insert by key, then rotate up while parent's priority < node's priority
 * to restore max-heap property on priorities.
 */
export function treapInsert(state: TreapState, key: number, priority?: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTreap(state);

  const nodePriority = priority ?? randomPriority();

  steps.push(
    step(`Insert key=${key} with priority=${nodePriority} into treap`, []),
  );

  function insert(node: TreapNode | null): TreapNode {
    if (!node) {
      const newNode: TreapNode = {
        id: newNodeId(),
        key,
        priority: nodePriority,
        left: null,
        right: null,
      };
      steps.push(
        step(`Create node (${key}, p=${nodePriority})`, [
          { targetId: treapId(newNode.id), property: 'highlight', from: 'default', to: 'inserting' },
        ]),
      );
      return newNode;
    }

    steps.push(
      step(`Visit (${node.key}, p=${node.priority}): compare key ${key}`, [
        { targetId: treapId(node.id), property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (key < node.key) {
      node.left = insert(node.left);
      // Restore heap property: if left child has higher priority, rotate right
      if (node.left && node.left.priority > node.priority) {
        steps.push(
          step(
            `Heap violation: child priority ${node.left.priority} > parent priority ${node.priority}`,
            [],
          ),
        );
        node = rotateRight(node, steps, step);
      }
    } else if (key > node.key) {
      node.right = insert(node.right);
      // Restore heap property: if right child has higher priority, rotate left
      if (node.right && node.right.priority > node.priority) {
        steps.push(
          step(
            `Heap violation: child priority ${node.right.priority} > parent priority ${node.priority}`,
            [],
          ),
        );
        node = rotateLeft(node, steps, step);
      }
    } else {
      steps.push(
        step(`Key ${key} already exists -- update priority to ${nodePriority}`, [
          { targetId: treapId(node.id), property: 'priority', from: node.priority, to: nodePriority },
        ]),
      );
      node.priority = nodePriority;
    }

    return node;
  }

  s.root = insert(s.root);
  s.size = treapSize(s.root);

  steps.push(
    step(
      `Insert complete. Root = (${s.root!.key}, p=${s.root!.priority}), size = ${s.size}`,
      [{ targetId: treapId(s.root!.id), property: 'highlight', from: 'default', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Search ─────────────────────────────────────────────────

/** Standard BST search with path highlighting. */
export function treapSearch(state: TreapState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTreap(state);

  steps.push(step(`Search for key=${key} in treap`, []));

  let current = s.root;
  while (current) {
    steps.push(
      step(`Visit (${current.key}, p=${current.priority})`, [
        { targetId: treapId(current.id), property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (key === current.key) {
      steps.push(
        step(`Key ${key} FOUND at node (${current.key}, p=${current.priority})`, [
          { targetId: treapId(current.id), property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
      return { steps, snapshot: s };
    }

    if (key < current.key) {
      steps.push(
        step(`${key} < ${current.key} -- go left`, []),
      );
      current = current.left;
    } else {
      steps.push(
        step(`${key} > ${current.key} -- go right`, []),
      );
      current = current.right;
    }
  }

  steps.push(step(`Key ${key} NOT FOUND`, []));
  return { steps, snapshot: s };
}

// ── Delete ─────────────────────────────────────────────────

/**
 * Delete a key by rotating it down until it becomes a leaf, then removing it.
 * At each step choose the rotation that preserves the heap property
 * (rotate toward the child with higher priority).
 */
export function treapDelete(state: TreapState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTreap(state);

  steps.push(step(`Delete key=${key} from treap`, []));

  function deleteNode(node: TreapNode | null): TreapNode | null {
    if (!node) {
      steps.push(step(`Key ${key} not found -- nothing to delete`, []));
      return null;
    }

    if (key < node.key) {
      node.left = deleteNode(node.left);
    } else if (key > node.key) {
      node.right = deleteNode(node.right);
    } else {
      // Found the node to delete
      steps.push(
        step(`Found (${node.key}, p=${node.priority}) -- rotate down to leaf`, [
          { targetId: treapId(node.id), property: 'highlight', from: 'default', to: 'deleting' },
        ]),
      );

      if (!node.left && !node.right) {
        // Already a leaf -- just remove
        steps.push(
          step(`Node (${node.key}) is a leaf -- remove it`, [
            { targetId: treapId(node.id), property: 'highlight', from: 'deleting', to: 'removed' },
          ]),
        );
        return null;
      }

      if (!node.left) {
        // Only right child: rotate left
        node = rotateLeft(node, steps, step);
        node.left = deleteNode(node.left);
      } else if (!node.right) {
        // Only left child: rotate right
        node = rotateRight(node, steps, step);
        node.right = deleteNode(node.right);
      } else {
        // Both children: rotate toward higher-priority child
        if (node.left.priority > node.right.priority) {
          node = rotateRight(node, steps, step);
          node.right = deleteNode(node.right);
        } else {
          node = rotateLeft(node, steps, step);
          node.left = deleteNode(node.left);
        }
      }
    }

    return node;
  }

  s.root = deleteNode(s.root);
  s.size = treapSize(s.root);

  if (s.root) {
    steps.push(
      step(
        `Delete complete. Root = (${s.root.key}, p=${s.root.priority}), size = ${s.size}`,
        [{ targetId: treapId(s.root.id), property: 'highlight', from: 'default', to: 'done' }],
      ),
    );
  } else {
    steps.push(step(`Delete complete. Treap is empty.`, []));
  }

  return { steps, snapshot: s };
}

// ── Split ──────────────────────────────────────────────────

/**
 * Split treap into two: left contains all keys <= splitKey, right contains all keys > splitKey.
 * Uses a virtual node technique: insert a node with the split key at max priority,
 * which rotates to root, then detach left and right subtrees.
 */
export function treapSplit(
  state: TreapState,
  splitKey: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneTreap(state);

  steps.push(step(`Split treap at key=${splitKey}: left <= ${splitKey}, right > ${splitKey}`, []));

  function split(
    node: TreapNode | null,
    key: number,
  ): [TreapNode | null, TreapNode | null] {
    if (!node) return [null, null];

    steps.push(
      step(`Split visit (${node.key}, p=${node.priority})`, [
        { targetId: treapId(node.id), property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (key >= node.key) {
      // This node goes to the left treap; split the right subtree
      const [rl, rr] = split(node.right, key);
      node.right = rl;
      steps.push(
        step(`Node (${node.key}) goes to LEFT treap (key ${node.key} <= ${key})`, [
          { targetId: treapId(node.id), property: 'highlight', from: 'visiting', to: 'done' },
        ]),
      );
      return [node, rr];
    } else {
      // This node goes to the right treap; split the left subtree
      const [ll, lr] = split(node.left, key);
      node.left = lr;
      steps.push(
        step(`Node (${node.key}) goes to RIGHT treap (key ${node.key} > ${key})`, [
          { targetId: treapId(node.id), property: 'highlight', from: 'visiting', to: 'done' },
        ]),
      );
      return [ll, node];
    }
  }

  const [left, right] = split(s.root, splitKey);
  const leftState: TreapState = { root: left, size: treapSize(left) };
  const rightState: TreapState = { root: right, size: treapSize(right) };

  steps.push(
    step(
      `Split complete. Left size = ${leftState.size}, Right size = ${rightState.size}`,
      [],
    ),
  );

  return { steps, snapshot: { left: leftState, right: rightState } };
}

// ── Merge ──────────────────────────────────────────────────

/**
 * Merge two treaps where all keys in `left` < all keys in `right`.
 * The root is whichever root has higher priority.
 */
export function treapMerge(
  left: TreapState,
  right: TreapState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Merge two treaps: left (size=${left.size}) + right (size=${right.size})`, []),
  );

  function merge(
    a: TreapNode | null,
    b: TreapNode | null,
  ): TreapNode | null {
    if (!a) return b;
    if (!b) return a;

    steps.push(
      step(
        `Merge (${a.key}, p=${a.priority}) with (${b.key}, p=${b.priority})`,
        [
          { targetId: treapId(a.id), property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: treapId(b.id), property: 'highlight', from: 'default', to: 'comparing' },
        ],
      ),
    );

    if (a.priority >= b.priority) {
      // a becomes root; merge a's right with b
      steps.push(
        step(
          `Priority ${a.priority} >= ${b.priority}: (${a.key}) becomes root, merge right subtree with (${b.key})`,
          [{ targetId: treapId(a.id), property: 'highlight', from: 'comparing', to: 'done' }],
        ),
      );
      a.right = merge(a.right, b);
      return a;
    } else {
      // b becomes root; merge a with b's left
      steps.push(
        step(
          `Priority ${b.priority} > ${a.priority}: (${b.key}) becomes root, merge (${a.key}) with left subtree`,
          [{ targetId: treapId(b.id), property: 'highlight', from: 'comparing', to: 'done' }],
        ),
      );
      b.left = merge(a, b.left);
      return b;
    }
  }

  const leftClone = cloneTreap(left);
  const rightClone = cloneTreap(right);
  const merged = merge(leftClone.root, rightClone.root);
  const mergedState: TreapState = { root: merged, size: treapSize(merged) };

  if (merged) {
    steps.push(
      step(
        `Merge complete. Root = (${merged.key}, p=${merged.priority}), size = ${mergedState.size}`,
        [{ targetId: treapId(merged.id), property: 'highlight', from: 'default', to: 'done' }],
      ),
    );
  } else {
    steps.push(step(`Merge complete. Result is empty.`, []));
  }

  return { steps, snapshot: mergedState };
}
