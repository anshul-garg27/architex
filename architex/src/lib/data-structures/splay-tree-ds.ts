// -----------------------------------------------------------------
// Architex -- Splay Tree Data Structure  (DST-027)
// Self-adjusting BST: every access splays the node to the root.
// Step recording shows zig, zig-zig, and zig-zag rotations.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface SplayNode {
  id: string;
  key: number;
  left: SplayNode | null;
  right: SplayNode | null;
}

export interface SplayTreeState {
  root: SplayNode | null;
  size: number;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `splay-${_nodeIdCounter++}`;
}

export function cloneSplay(node: SplayNode | null): SplayNode | null {
  if (!node) return null;
  return {
    ...node,
    left: cloneSplay(node.left),
    right: cloneSplay(node.right),
  };
}

export function cloneSplayTree(state: SplayTreeState): SplayTreeState {
  return { root: cloneSplay(state.root), size: state.size };
}

export function splayToArray(node: SplayNode | null): number[] {
  const result: number[] = [];
  function inorder(n: SplayNode | null): void {
    if (!n) return;
    inorder(n.left);
    result.push(n.key);
    inorder(n.right);
  }
  inorder(node);
  return result;
}

export function splaySize(node: SplayNode | null): number {
  if (!node) return 0;
  return 1 + splaySize(node.left) + splaySize(node.right);
}

// ── Rotations ─────────────────────────────────────────────

/** Right rotation (zig): x becomes root, y goes right. */
function rotateRight(y: SplayNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): SplayNode {
  const x = y.left!;
  const B = x.right;

  steps.push(
    step(`Zig (right rotation) at ${y.key}: pivot ${x.key}`, [
      { targetId: y.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: x.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  x.right = y;
  y.left = B;
  return x;
}

/** Left rotation (zig): y becomes root, x goes left. */
function rotateLeft(x: SplayNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): SplayNode {
  const y = x.right!;
  const B = y.left;

  steps.push(
    step(`Zig (left rotation) at ${x.key}: pivot ${y.key}`, [
      { targetId: x.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: y.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  y.left = x;
  x.right = B;
  return y;
}

// ── Splay ─────────────────────────────────────────────────

/**
 * Top-down splay: brings the node with the given key (or nearest)
 * to the root using zig, zig-zig, and zig-zag rotations.
 */
function splay(root: SplayNode | null, key: number, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): SplayNode | null {
  if (!root) return null;

  // Sentinel node for top-down splay
  const sentinel: SplayNode = { id: 'sentinel', key: 0, left: null, right: null };
  let leftTreeMax: SplayNode = sentinel;
  let rightTreeMin: SplayNode = sentinel;
  let current: SplayNode = root;

  steps.push(
    step(`Begin splay of key ${key} to root`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (key < current.key) {
      if (!current.left) break;

      if (key < current.left.key) {
        // Zig-zig (left-left)
        steps.push(
          step(
            `Zig-zig: ${key} < ${current.key} and ${key} < ${current.left.key}  --  right rotate at ${current.key}`,
            [
              { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
              { targetId: current.left.id, property: 'highlight', from: 'default', to: 'visiting' },
            ],
          ),
        );
        // Rotate right
        const temp = current.left;
        current.left = temp.right;
        temp.right = current;
        current = temp;
        if (!current.left) break;
      } else if (key > current.left.key) {
        // Zig-zag (left-right): only do the first zig, second zig happens next iteration
        steps.push(
          step(
            `Zig-zag: ${key} < ${current.key} but ${key} > ${current.left.key}`,
            [
              { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
              { targetId: current.left.id, property: 'highlight', from: 'default', to: 'visiting' },
            ],
          ),
        );
      }

      // Link right
      rightTreeMin.left = current;
      rightTreeMin = current;
      current = current.left;
    } else if (key > current.key) {
      if (!current.right) break;

      if (key > current.right.key) {
        // Zig-zig (right-right)
        steps.push(
          step(
            `Zig-zig: ${key} > ${current.key} and ${key} > ${current.right.key}  --  left rotate at ${current.key}`,
            [
              { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
              { targetId: current.right.id, property: 'highlight', from: 'default', to: 'visiting' },
            ],
          ),
        );
        // Rotate left
        const temp = current.right;
        current.right = temp.left;
        temp.left = current;
        current = temp;
        if (!current.right) break;
      } else if (key < current.right.key) {
        // Zig-zag (right-left)
        steps.push(
          step(
            `Zig-zag: ${key} > ${current.key} but ${key} < ${current.right.key}`,
            [
              { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
              { targetId: current.right.id, property: 'highlight', from: 'default', to: 'visiting' },
            ],
          ),
        );
      }

      // Link left
      leftTreeMax.right = current;
      leftTreeMax = current;
      current = current.right;
    } else {
      // key === current.key
      break;
    }
  }

  // Reassemble
  leftTreeMax.right = current.left;
  rightTreeMin.left = current.right;
  current.left = sentinel.right;
  current.right = sentinel.left;

  steps.push(
    step(`Splay complete: key ${current.key} is now at root`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return current;
}

// ── Create ─────────────────────────────────────────────────

/** Create an empty splay tree. */
export function createSplayTree(): SplayTreeState {
  return { root: null, size: 0 };
}

// ── Insert ─────────────────────────────────────────────────

/** Insert a key into the splay tree and splay it to root. */
export function splayInsert(state: SplayTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSplayTree(state);

  steps.push(step(`Insert ${key} into splay tree`, []));

  if (!s.root) {
    const newNode: SplayNode = { id: newNodeId(), key, left: null, right: null };
    s.root = newNode;
    s.size = 1;
    steps.push(
      step(`Tree empty -- ${key} becomes root`, [
        { targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return { steps, snapshot: s };
  }

  // Splay the closest node to root
  s.root = splay(s.root, key, steps, step);

  if (s.root!.key === key) {
    steps.push(
      step(`Key ${key} already exists -- splayed to root`, [
        { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }

  const newNode: SplayNode = { id: newNodeId(), key, left: null, right: null };

  if (key < s.root!.key) {
    newNode.right = s.root;
    newNode.left = s.root!.left;
    s.root!.left = null;
    steps.push(
      step(`${key} < ${s.root!.key} -- new root ${key}, old root goes right`, [
        { targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
  } else {
    newNode.left = s.root;
    newNode.right = s.root!.right;
    s.root!.right = null;
    steps.push(
      step(`${key} > ${s.root!.key} -- new root ${key}, old root goes left`, [
        { targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
  }

  s.root = newNode;
  s.size += 1;

  steps.push(
    step(`Insert complete. Root = ${key}, size = ${s.size}`, [
      { targetId: newNode.id, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Search ─────────────────────────────────────────────────

/** Search for a key; splay the found (or nearest) node to root. */
export function splaySearch(state: SplayTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSplayTree(state);

  steps.push(step(`Search for ${key}`, []));

  if (!s.root) {
    steps.push(step(`Tree is empty -- ${key} NOT FOUND`, []));
    return { steps, snapshot: s };
  }

  s.root = splay(s.root, key, steps, step);

  if (s.root!.key === key) {
    steps.push(
      step(`${key} FOUND -- now at root`, [
        { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
  } else {
    steps.push(
      step(`${key} NOT FOUND -- nearest key ${s.root!.key} splayed to root`, [
        { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
  }

  return { steps, snapshot: s };
}

// ── Delete ─────────────────────────────────────────────────

/**
 * Delete a key from the splay tree.
 * Splay the key to root, then join left and right subtrees.
 */
export function splayDelete(state: SplayTreeState, key: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSplayTree(state);

  steps.push(step(`Delete ${key} from splay tree`, []));

  if (!s.root) {
    steps.push(step(`Tree is empty -- nothing to delete`, []));
    return { steps, snapshot: s };
  }

  // Splay the key to the root
  s.root = splay(s.root, key, steps, step);

  if (s.root!.key !== key) {
    steps.push(
      step(`Key ${key} not found -- cannot delete (nearest: ${s.root!.key})`, [
        { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Key ${key} splayed to root -- removing`, [
      { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  const leftSubtree = s.root!.left;
  const rightSubtree = s.root!.right;

  if (!leftSubtree) {
    s.root = rightSubtree;
    steps.push(
      step(`No left subtree -- right subtree becomes new tree`, []),
    );
  } else {
    // Splay the maximum of the left subtree to root of left subtree
    steps.push(
      step(`Join: splay max of left subtree to become new root`, []),
    );
    s.root = splay(leftSubtree, key, steps, step); // splays the max (closest to key) to root
    s.root!.right = rightSubtree;
    steps.push(
      step(`Attach right subtree to new root ${s.root!.key}`, [
        { targetId: s.root!.id, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  s.size -= 1;

  steps.push(
    step(
      `Delete complete. size = ${s.size}${s.root ? ', root = ' + s.root.key : ', tree is empty'}`,
      [],
    ),
  );

  return { steps, snapshot: s };
}
