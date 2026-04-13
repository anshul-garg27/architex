// -----------------------------------------------------------------
// Architex -- Red-Black Tree Data Structure  (DST-009)
// Self-balancing BST with red/black coloring.
// Step recording shows recoloring and rotations.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── RB Node type ──────────────────────────────────────────

export type RBColor = 'red' | 'black';

export interface RBNode {
  id: string;
  value: number;
  color: RBColor;
  left: RBNode | null;
  right: RBNode | null;
  parent: RBNode | null;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `rb-${_nodeIdCounter++}`;
}

export function cloneRB(node: RBNode | null, parent: RBNode | null = null): RBNode | null {
  if (!node) return null;
  const cloned: RBNode = {
    ...node,
    parent,
    left: null,
    right: null,
  };
  cloned.left = cloneRB(node.left, cloned);
  cloned.right = cloneRB(node.right, cloned);
  return cloned;
}

export function rbToArray(node: RBNode | null): number[] {
  const result: number[] = [];
  function inorder(n: RBNode | null): void {
    if (!n) return;
    inorder(n.left);
    result.push(n.value);
    inorder(n.right);
  }
  inorder(node);
  return result;
}

export function rbSize(node: RBNode | null): number {
  if (!node) return 0;
  return 1 + rbSize(node.left) + rbSize(node.right);
}

function isRed(node: RBNode | null): boolean {
  return node !== null && node.color === 'red';
}

// ── Rotations ─────────────────────────────────────────────

function rotateLeft(root: RBNode, x: RBNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): RBNode {
  const y = x.right!;

  steps.push(
    step(`Left rotation at ${x.value} (pivot ${y.value}). Rotations restructure the tree without breaking the BST property — the right child ${y.value} becomes the new local root while maintaining sorted order.`, [
      { targetId: x.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: y.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  x.right = y.left;
  if (y.left) y.left.parent = x;

  y.parent = x.parent;
  if (!x.parent) {
    root = y;
  } else if (x === x.parent.left) {
    x.parent.left = y;
  } else {
    x.parent.right = y;
  }

  y.left = x;
  x.parent = y;

  return root;
}

function rotateRight(root: RBNode, y: RBNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): RBNode {
  const x = y.left!;

  steps.push(
    step(`Right rotation at ${y.value} (pivot ${x.value}). The left child ${x.value} becomes the new local root — this reduces the black-height imbalance caused by the insertion or deletion.`, [
      { targetId: y.id, property: 'highlight', from: 'default', to: 'deleting' },
      { targetId: x.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  y.left = x.right;
  if (x.right) x.right.parent = y;

  x.parent = y.parent;
  if (!y.parent) {
    root = x;
  } else if (y === y.parent.left) {
    y.parent.left = x;
  } else {
    y.parent.right = x;
  }

  x.right = y;
  y.parent = x;

  return root;
}

// ── Insert fix-up ─────────────────────────────────────────

// WHY RB-trees over AVL for many workloads: RB-trees do at most 2 rotations per insert
// and 3 per delete, while AVL may rotate at every ancestor. For write-heavy workloads
// (e.g., Linux kernel's CFS scheduler, Java TreeMap), fewer rotations means less overhead.
// AVL's stricter balance gives slightly faster reads, but RB's looser balance wins on writes.
function insertFixup(root: RBNode, z: RBNode, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): RBNode {
  while (z.parent && isRed(z.parent)) {
    const grandparent = z.parent.parent;
    if (!grandparent) break;

    if (z.parent === grandparent.left) {
      const uncle = grandparent.right;

      if (isRed(uncle)) {
        // Case 1: Uncle is red -- recolor
        steps.push(
          step(`Uncle ${uncle!.value} is RED — recolor parent, uncle, grandparent. When the uncle is red, we can fix the red-red violation just by recoloring — no rotation needed.`, [
            { targetId: z.parent.id, property: 'color', from: 'red', to: 'black' },
            { targetId: uncle!.id, property: 'color', from: 'red', to: 'black' },
            { targetId: grandparent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        z.parent.color = 'black';
        uncle!.color = 'black';
        grandparent.color = 'red';
        z = grandparent;
      } else {
        if (z === z.parent.right) {
          // Case 2: z is right child -- left rotate parent
          steps.push(
            step(`Node ${z.value} is right child, uncle is BLACK — LR case. The black uncle means recoloring alone won't work. We rotate to align the nodes before the final fix.`, [
              { targetId: z.id, property: 'highlight', from: 'default', to: 'visiting' },
            ]),
          );
          z = z.parent;
          root = rotateLeft(root, z, steps, step);
        }
        // Case 3: z is left child -- right rotate grandparent
        steps.push(
          step(`Recolor ${z.parent!.value} BLACK, ${grandparent.value} RED, then right rotate`, [
            { targetId: z.parent!.id, property: 'color', from: 'red', to: 'black' },
            { targetId: grandparent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        z.parent!.color = 'black';
        grandparent.color = 'red';
        root = rotateRight(root, grandparent, steps, step);
      }
    } else {
      // Mirror: parent is right child of grandparent
      const uncle = grandparent.left;

      if (isRed(uncle)) {
        // Case 1: Uncle is red -- recolor
        steps.push(
          step(`Uncle ${uncle!.value} is RED — recolor parent, uncle, grandparent. Mirror case: red uncle means recoloring pushes the red-red violation upward toward the root.`, [
            { targetId: z.parent.id, property: 'color', from: 'red', to: 'black' },
            { targetId: uncle!.id, property: 'color', from: 'red', to: 'black' },
            { targetId: grandparent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        z.parent.color = 'black';
        uncle!.color = 'black';
        grandparent.color = 'red';
        z = grandparent;
      } else {
        if (z === z.parent.left) {
          // Case 2: z is left child -- right rotate parent
          steps.push(
            step(`Node ${z.value} is left child, uncle is BLACK — RL case. Black uncle requires structural change. We rotate to convert this into the simpler RR case.`, [
              { targetId: z.id, property: 'highlight', from: 'default', to: 'visiting' },
            ]),
          );
          z = z.parent;
          root = rotateRight(root, z, steps, step);
        }
        // Case 3: z is right child -- left rotate grandparent
        steps.push(
          step(`Recolor ${z.parent!.value} BLACK, ${grandparent.value} RED, then left rotate`, [
            { targetId: z.parent!.id, property: 'color', from: 'red', to: 'black' },
            { targetId: grandparent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        z.parent!.color = 'black';
        grandparent.color = 'red';
        root = rotateLeft(root, grandparent, steps, step);
      }
    }
  }

  // WHY root must always be black: Making the root black is safe because it adds exactly
  // one black node to EVERY root-to-leaf path, preserving the equal black-height invariant.
  // The fixup loop may have colored it red while pushing violations upward — this final
  // step absorbs that violation without any further cascading changes.
  if (root.color !== 'black') {
    steps.push(
      step(`Recolor root ${root.value} BLACK. The root must always be black — this is a fundamental RB-tree invariant that ensures every path from root starts with a black node.`, [
        { targetId: root.id, property: 'color', from: 'red', to: 'black' },
      ]),
    );
    root.color = 'black';
  }

  return root;
}

// ── Insert ────────────────────────────────────────────────

export function dsRbInsert(root: RBNode | null, value: number): DSResult<RBNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  let tree = cloneRB(root);

  // WHY new nodes are always RED: Inserting a red node never violates the black-height
  // property (every root-to-leaf path has the same number of black nodes). It might
  // violate the no-red-red rule, but that is fixable with at most O(log n) recolorings
  // and at most 2 rotations. Inserting black would immediately break black-height on
  // one path, which is much harder to fix — potentially requiring rebalancing the entire tree.
  const newNode: RBNode = {
    id: newNodeId(),
    value,
    color: 'red',
    left: null,
    right: null,
    parent: null,
  };

  if (!tree) {
    newNode.color = 'black';
    steps.push(
      step(`Insert ${value} as root (BLACK). The first node is always black — the root being black is a core RB-tree invariant.`, [
        { targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return { steps, snapshot: newNode };
  }

  let current: RBNode | null = tree;
  let parent: RBNode | null = null;

  while (current) {
    parent = current;
    steps.push(
      step(`Compare ${value} with ${current.value}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (value < current.value) {
      steps.push(
        step(`${value} < ${current.value} -- go left`, [
          { targetId: current.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      current = current.left;
    } else if (value > current.value) {
      steps.push(
        step(`${value} > ${current.value} -- go right`, [
          { targetId: current.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      current = current.right;
    } else {
      steps.push(
        step(`${value} == ${current.value} -- duplicate, skip`, [
          { targetId: current.id, property: 'highlight', from: 'visiting', to: 'found' },
        ]),
      );
      return { steps, snapshot: tree };
    }
  }

  newNode.parent = parent;
  if (value < parent!.value) {
    parent!.left = newNode;
  } else {
    parent!.right = newNode;
  }

  steps.push(
    step(
      `Insert ${value} as RED ${value < parent!.value ? 'left' : 'right'} child of ${parent!.value}. New nodes are always red — inserting red never violates the black-height property, only possibly the no-red-red rule.`,
      [{ targetId: newNode.id, property: 'highlight', from: 'default', to: 'inserting' }],
    ),
  );

  // Fix up RB properties
  tree = insertFixup(tree, newNode, steps, step);

  return { steps, snapshot: tree };
}

// ── Search ────────────────────────────────────────────────

export function dsRbSearch(root: RBNode | null, value: number): DSResult<RBNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Search for ${value}. RB-tree search is identical to BST search — the coloring is only for balancing, not for search decisions. Guaranteed O(log n).`, []));

  function search(node: RBNode | null): boolean {
    if (!node) {
      steps.push(step(`Reached null -- ${value} NOT FOUND`, []));
      return false;
    }

    steps.push(
      step(`Compare ${value} with ${node.value} (${node.color}). Color doesn't affect search direction — we still go left if smaller, right if larger.`, [
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

// ── Delete helpers ────────────────────────────────────────

function transplant(root: RBNode, u: RBNode, v: RBNode | null): RBNode {
  if (!u.parent) {
    root = v!;
  } else if (u === u.parent.left) {
    u.parent.left = v;
  } else {
    u.parent.right = v;
  }
  if (v) v.parent = u.parent;
  return root;
}

function treeMinimum(node: RBNode): RBNode {
  let curr = node;
  while (curr.left) curr = curr.left;
  return curr;
}

function deleteFixup(root: RBNode, x: RBNode | null, xParent: RBNode | null, steps: DSStep[], step: (desc: string, mutations: DSMutation[]) => DSStep): RBNode {
  while (x !== root && !isRed(x)) {
    if (!xParent) break;

    if (x === xParent.left) {
      let w = xParent.right;
      if (!w) break;

      if (isRed(w)) {
        // Case 1
        steps.push(
          step(`Delete fixup: sibling ${w.value} is RED -- recolor and left rotate`, [
            { targetId: w.id, property: 'color', from: 'red', to: 'black' },
            { targetId: xParent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        w.color = 'black';
        xParent.color = 'red';
        root = rotateLeft(root, xParent, steps, step);
        w = xParent.right;
        if (!w) break;
      }

      if (!isRed(w.left) && !isRed(w.right)) {
        // Case 2
        steps.push(
          step(`Delete fixup: sibling ${w.value} has two BLACK children -- recolor sibling RED`, [
            { targetId: w.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        w.color = 'red';
        x = xParent;
        xParent = x.parent;
      } else {
        if (!isRed(w.right)) {
          // Case 3
          if (w.left) {
            steps.push(
              step(`Delete fixup: sibling's right child is BLACK -- recolor and right rotate sibling`, [
                { targetId: w.left.id, property: 'color', from: 'red', to: 'black' },
                { targetId: w.id, property: 'color', from: 'black', to: 'red' },
              ]),
            );
            w.left.color = 'black';
          }
          w.color = 'red';
          root = rotateRight(root, w, steps, step);
          w = xParent.right;
          if (!w) break;
        }
        // Case 4
        steps.push(
          step(`Delete fixup: left rotate at ${xParent.value}, recolor`, [
            { targetId: w.id, property: 'color', from: w.color, to: xParent.color },
            { targetId: xParent.id, property: 'color', from: xParent.color, to: 'black' },
          ]),
        );
        w.color = xParent.color;
        xParent.color = 'black';
        if (w.right) w.right.color = 'black';
        root = rotateLeft(root, xParent, steps, step);
        x = root;
        break;
      }
    } else {
      // Mirror case
      let w = xParent.left;
      if (!w) break;

      if (isRed(w)) {
        steps.push(
          step(`Delete fixup: sibling ${w.value} is RED -- recolor and right rotate`, [
            { targetId: w.id, property: 'color', from: 'red', to: 'black' },
            { targetId: xParent.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        w.color = 'black';
        xParent.color = 'red';
        root = rotateRight(root, xParent, steps, step);
        w = xParent.left;
        if (!w) break;
      }

      if (!isRed(w.left) && !isRed(w.right)) {
        steps.push(
          step(`Delete fixup: sibling ${w.value} has two BLACK children -- recolor sibling RED`, [
            { targetId: w.id, property: 'color', from: 'black', to: 'red' },
          ]),
        );
        w.color = 'red';
        x = xParent;
        xParent = x.parent;
      } else {
        if (!isRed(w.left)) {
          if (w.right) {
            steps.push(
              step(`Delete fixup: sibling's left child is BLACK -- recolor and left rotate sibling`, [
                { targetId: w.right.id, property: 'color', from: 'red', to: 'black' },
                { targetId: w.id, property: 'color', from: 'black', to: 'red' },
              ]),
            );
            w.right.color = 'black';
          }
          w.color = 'red';
          root = rotateLeft(root, w, steps, step);
          w = xParent.left;
          if (!w) break;
        }
        steps.push(
          step(`Delete fixup: right rotate at ${xParent.value}, recolor`, [
            { targetId: w.id, property: 'color', from: w.color, to: xParent.color },
            { targetId: xParent.id, property: 'color', from: xParent.color, to: 'black' },
          ]),
        );
        w.color = xParent.color;
        xParent.color = 'black';
        if (w.left) w.left.color = 'black';
        root = rotateRight(root, xParent, steps, step);
        x = root;
        break;
      }
    }
  }

  if (x) x.color = 'black';
  return root;
}

// ── Delete ────────────────────────────────────────────────

export function dsRbDelete(root: RBNode | null, value: number): DSResult<RBNode | null> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  let tree = cloneRB(root);

  if (!tree) {
    steps.push(step(`Tree is empty -- nothing to delete`, []));
    return { steps, snapshot: null };
  }

  // Find the node
  let z: RBNode | null = tree;
  while (z) {
    steps.push(
      step(`Compare ${value} with ${z.value}`, [
        { targetId: z.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (value === z.value) {
      steps.push(
        step(`Found ${value} -- deleting`, [
          { targetId: z.id, property: 'highlight', from: 'visiting', to: 'deleting' },
        ]),
      );
      break;
    } else if (value < z.value) {
      steps.push(
        step(`${value} < ${z.value} -- search left`, [
          { targetId: z.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      z = z.left;
    } else {
      steps.push(
        step(`${value} > ${z.value} -- search right`, [
          { targetId: z.id, property: 'highlight', from: 'visiting', to: 'visited' },
        ]),
      );
      z = z.right;
    }
  }

  if (!z) {
    steps.push(step(`${value} not found in tree`, []));
    return { steps, snapshot: tree };
  }

  let y = z;
  let yOriginalColor = y.color;
  let x: RBNode | null;
  let xParent: RBNode | null;

  if (!z.left) {
    steps.push(step(`${z.value} has no left child -- replace with right child`, []));
    x = z.right;
    xParent = z.parent;
    tree = transplant(tree, z, z.right);
  } else if (!z.right) {
    steps.push(step(`${z.value} has no right child -- replace with left child`, []));
    x = z.left;
    xParent = z.parent;
    tree = transplant(tree, z, z.left);
  } else {
    y = treeMinimum(z.right);
    yOriginalColor = y.color;
    steps.push(
      step(`Two children -- replace with in-order successor ${y.value} (${y.color})`, [
        { targetId: y.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    x = y.right;
    xParent = y;

    if (y.parent !== z) {
      xParent = y.parent;
      tree = transplant(tree, y, y.right);
      y.right = z.right;
      if (y.right) y.right.parent = y;
    }

    tree = transplant(tree, z, y);
    y.left = z.left;
    if (y.left) y.left.parent = y;
    y.color = z.color;
  }

  if (yOriginalColor === 'black' && tree) {
    steps.push(
      step(`Removed node was BLACK -- fix up RB properties`, []),
    );
    tree = deleteFixup(tree, x, xParent, steps, step);
  }

  return { steps, snapshot: tree };
}

// ── Build a sample RB Tree from an array of values ───────

export function buildRBTree(values: number[]): RBNode | null {
  let root: RBNode | null = null;

  for (const v of values) {
    const res = dsRbInsert(root, v);
    root = res.snapshot as RBNode | null;
  }
  return root;
}
