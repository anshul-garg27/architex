// -----------------------------------------------------------------
// Architex -- BST Interactive Traversals & Utilities  (DST-031)
// Extends the base BST with traversal animations, find min/max,
// and BST validation.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';
import type { BSTNode } from './bst-ds';

// ── Inorder Traversal (Left, Root, Right) ─────────────────────

export function bstInorder(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const result: number[] = [];

  steps.push(step('Begin inorder traversal (Left, Root, Right)', []));

  function traverse(node: BSTNode | null): void {
    if (!node) return;

    steps.push(
      step(`Visit node ${node.value} -- go left first`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    traverse(node.left);

    result.push(node.value);
    steps.push(
      step(`Process ${node.value} (inorder position ${result.length})`, [
        { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
      ]),
    );

    traverse(node.right);

    steps.push(
      step(`Finished subtree rooted at ${node.value}`, [
        { targetId: node.id, property: 'highlight', from: 'found', to: 'visited' },
      ]),
    );
  }

  traverse(root);
  steps.push(step(`Inorder result: [${result.join(', ')}]`, []));
  return { steps, snapshot: { result, tree: root } };
}

// ── Preorder Traversal (Root, Left, Right) ────────────────────

export function bstPreorder(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const result: number[] = [];

  steps.push(step('Begin preorder traversal (Root, Left, Right)', []));

  function traverse(node: BSTNode | null): void {
    if (!node) return;

    result.push(node.value);
    steps.push(
      step(`Process ${node.value} (preorder position ${result.length})`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );

    traverse(node.left);
    traverse(node.right);

    steps.push(
      step(`Finished subtree rooted at ${node.value}`, [
        { targetId: node.id, property: 'highlight', from: 'found', to: 'visited' },
      ]),
    );
  }

  traverse(root);
  steps.push(step(`Preorder result: [${result.join(', ')}]`, []));
  return { steps, snapshot: { result, tree: root } };
}

// ── Postorder Traversal (Left, Right, Root) ───────────────────

export function bstPostorder(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const result: number[] = [];

  steps.push(step('Begin postorder traversal (Left, Right, Root)', []));

  function traverse(node: BSTNode | null): void {
    if (!node) return;

    steps.push(
      step(`Enter node ${node.value} -- traverse children first`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    traverse(node.left);
    traverse(node.right);

    result.push(node.value);
    steps.push(
      step(`Process ${node.value} (postorder position ${result.length})`, [
        { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
      ]),
    );
  }

  traverse(root);
  steps.push(step(`Postorder result: [${result.join(', ')}]`, []));
  return { steps, snapshot: { result, tree: root } };
}

// ── Level-Order Traversal (BFS) ───────────────────────────────

export function bstLevelOrder(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const result: number[] = [];

  steps.push(step('Begin level-order traversal (BFS)', []));

  if (!root) {
    steps.push(step('Tree is empty', []));
    return { steps, snapshot: { result, tree: root } };
  }

  const queue: BSTNode[] = [root];
  let level = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    const levelValues: number[] = [];

    steps.push(step(`Processing level ${level} (${levelSize} nodes)`, []));

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      result.push(node.value);
      levelValues.push(node.value);

      steps.push(
        step(`Visit ${node.value} at level ${level}`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    steps.push(
      step(`Level ${level} complete: [${levelValues.join(', ')}]`, []),
    );
    level++;
  }

  steps.push(step(`Level-order result: [${result.join(', ')}]`, []));
  return { steps, snapshot: { result, tree: root } };
}

// ── Find Min ──────────────────────────────────────────────────

export function bstFindMin(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step('Find minimum value (go left until null)', []));

  if (!root) {
    steps.push(step('Tree is empty -- no minimum', []));
    return { steps, snapshot: { value: null, tree: root } };
  }

  let current = root;
  steps.push(
    step(`Start at root ${current.value}`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  while (current.left) {
    steps.push(
      step(`${current.value} has left child -- go left`, [
        { targetId: current.id, property: 'highlight', from: 'visiting', to: 'visited' },
      ]),
    );
    current = current.left;
    steps.push(
      step(`Move to ${current.value}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
  }

  steps.push(
    step(`Minimum is ${current.value} (no left child)`, [
      { targetId: current.id, property: 'highlight', from: 'visiting', to: 'found' },
    ]),
  );

  return { steps, snapshot: { value: current.value, tree: root } };
}

// ── Find Max ──────────────────────────────────────────────────

export function bstFindMax(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step('Find maximum value (go right until null)', []));

  if (!root) {
    steps.push(step('Tree is empty -- no maximum', []));
    return { steps, snapshot: { value: null, tree: root } };
  }

  let current = root;
  steps.push(
    step(`Start at root ${current.value}`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  while (current.right) {
    steps.push(
      step(`${current.value} has right child -- go right`, [
        { targetId: current.id, property: 'highlight', from: 'visiting', to: 'visited' },
      ]),
    );
    current = current.right;
    steps.push(
      step(`Move to ${current.value}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
  }

  steps.push(
    step(`Maximum is ${current.value} (no right child)`, [
      { targetId: current.id, property: 'highlight', from: 'visiting', to: 'found' },
    ]),
  );

  return { steps, snapshot: { value: current.value, tree: root } };
}

// ── Validate BST Property ─────────────────────────────────────

export function bstValidate(root: BSTNode | null): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  let isValid = true;

  steps.push(step('Validate BST property: left < node < right for every node', []));

  if (!root) {
    steps.push(step('Empty tree is a valid BST', []));
    return { steps, snapshot: { valid: true, tree: root } };
  }

  function validate(
    node: BSTNode | null,
    min: number,
    max: number,
  ): boolean {
    if (!node) return true;

    steps.push(
      step(`Check ${node.value} in range (${min === -Infinity ? '-inf' : min}, ${max === Infinity ? '+inf' : max})`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    if (node.value <= min || node.value >= max) {
      steps.push(
        step(`VIOLATION: ${node.value} is NOT in (${min === -Infinity ? '-inf' : min}, ${max === Infinity ? '+inf' : max})`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'deleting' },
        ]),
      );
      isValid = false;
      return false;
    }

    steps.push(
      step(`${node.value} is valid -- check children`, [
        { targetId: node.id, property: 'highlight', from: 'visiting', to: 'found' },
      ]),
    );

    const leftValid = validate(node.left, min, node.value);
    const rightValid = validate(node.right, node.value, max);
    return leftValid && rightValid;
  }

  validate(root, -Infinity, Infinity);

  steps.push(
    step(isValid ? 'BST property VALID for all nodes' : 'BST property VIOLATED', []),
  );

  return { steps, snapshot: { valid: isValid, tree: root } };
}
