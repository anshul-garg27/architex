// -----------------------------------------------------------------
// Architex -- Rope (Text Editor Balanced Tree) Simulation (DST-030)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface RopeNode {
  /** Unique id for visualization targeting */
  id: string;
  /** Weight: for leaves = string length; for internal = total length of left subtree */
  weight: number;
  /** String fragment (only for leaf nodes) */
  value: string | null;
  /** Left child */
  left: RopeNode | null;
  /** Right child */
  right: RopeNode | null;
}

export interface RopeState {
  root: RopeNode | null;
  /** Total length of the represented string */
  totalLength: number;
}

/** Flat representation for visualization */
export interface RopeFlatNode {
  id: string;
  weight: number;
  value: string | null;
  depth: number;
  parentId: string | null;
  side: 'left' | 'right' | 'root';
  isLeaf: boolean;
}

let _nodeId = 0;

function nextNodeId(): string {
  return `rope-n${_nodeId++}`;
}

function makeLeaf(value: string): RopeNode {
  return {
    id: nextNodeId(),
    weight: value.length,
    value,
    left: null,
    right: null,
  };
}

function makeInternal(left: RopeNode, right: RopeNode): RopeNode {
  return {
    id: nextNodeId(),
    weight: ropeLength(left),
    value: null,
    left,
    right,
  };
}

function ropeLength(node: RopeNode | null): number {
  if (!node) return 0;
  if (node.value !== null) return node.value.length;
  return ropeLength(node.left) + ropeLength(node.right);
}

function ropeCollect(node: RopeNode | null): string {
  if (!node) return '';
  if (node.value !== null) return node.value;
  return ropeCollect(node.left) + ropeCollect(node.right);
}

// ── Create ──────────────────────────────────────────────────

export function createRope(text?: string): RopeState {
  _nodeId = 0;
  if (!text || text.length === 0) {
    return { root: null, totalLength: 0 };
  }
  // Split text into balanced leaf fragments
  const root = buildBalanced(text);
  return { root, totalLength: text.length };
}

function buildBalanced(text: string): RopeNode {
  if (text.length <= 5) {
    return makeLeaf(text);
  }
  const mid = Math.floor(text.length / 2);
  const left = buildBalanced(text.slice(0, mid));
  const right = buildBalanced(text.slice(mid));
  return makeInternal(left, right);
}

export function cloneRope(state: RopeState): RopeState {
  return {
    root: state.root ? cloneNode(state.root) : null,
    totalLength: state.totalLength,
  };
}

function cloneNode(node: RopeNode): RopeNode {
  return {
    id: node.id,
    weight: node.weight,
    value: node.value,
    left: node.left ? cloneNode(node.left) : null,
    right: node.right ? cloneNode(node.right) : null,
  };
}

// ── Flatten for visualization ───────────────────────────────

export function flattenRope(state: RopeState): RopeFlatNode[] {
  const result: RopeFlatNode[] = [];
  function dfs(node: RopeNode | null, depth: number, parentId: string | null, side: 'left' | 'right' | 'root') {
    if (!node) return;
    result.push({
      id: node.id,
      weight: node.weight,
      value: node.value,
      depth,
      parentId,
      side,
      isLeaf: node.value !== null,
    });
    dfs(node.left, depth + 1, node.id, 'left');
    dfs(node.right, depth + 1, node.id, 'right');
  }
  dfs(state.root, 0, null, 'root');
  return result;
}

// ── charAt ──────────────────────────────────────────────────

export function ropeCharAt(
  state: RopeState,
  index: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`charAt(${index})`, []));

  if (!state.root || index < 0 || index >= state.totalLength) {
    steps.push(step(`Index ${index} out of bounds (length=${state.totalLength})`, []));
    return { steps, snapshot: state };
  }

  // Walk the tree
  let node = state.root;
  let remaining = index;

  while (node) {
    if (node.value !== null) {
      // Leaf node
      steps.push(
        step(
          `Reached leaf "${node.value}", char at offset ${remaining} = '${node.value[remaining]}'`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'found' }],
        ),
      );
      break;
    }

    steps.push(
      step(
        `At node ${node.id} (weight=${node.weight}), index=${remaining}`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
      ),
    );

    if (remaining < node.weight) {
      steps.push(
        step(
          `${remaining} < weight ${node.weight} -- go LEFT`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' }],
        ),
      );
      node = node.left!;
    } else {
      remaining -= node.weight;
      steps.push(
        step(
          `${remaining + node.weight} >= weight ${node.weight} -- go RIGHT (new index=${remaining})`,
          [{ targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' }],
        ),
      );
      node = node.right!;
    }
  }

  return { steps, snapshot: state };
}

// ── concat ──────────────────────────────────────────────────

export function ropeConcat(
  state: RopeState,
  appendText: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneRope(state);

  steps.push(step(`concat("${appendText}")`, []));

  if (appendText.length === 0) {
    steps.push(step('Nothing to append', []));
    return { steps, snapshot: copy };
  }

  const newLeaf = buildBalanced(appendText);

  if (!copy.root) {
    copy.root = newLeaf;
    copy.totalLength = appendText.length;
    steps.push(
      step(
        `Created new rope with "${appendText}" (length=${appendText.length})`,
        [{ targetId: newLeaf.id, property: 'highlight', from: 'default', to: 'inserting' }],
      ),
    );
  } else {
    steps.push(
      step(
        `Creating internal node joining existing rope (weight=${ropeLength(copy.root)}) with new fragment "${appendText}"`,
        [],
      ),
    );

    const newRoot = makeInternal(copy.root, newLeaf);
    copy.root = newRoot;
    copy.totalLength += appendText.length;

    steps.push(
      step(
        `New root ${newRoot.id} (weight=${newRoot.weight}). Total length: ${copy.totalLength}`,
        [
          { targetId: newRoot.id, property: 'highlight', from: 'default', to: 'inserting' },
          { targetId: newLeaf.id, property: 'highlight', from: 'default', to: 'done' },
        ],
      ),
    );
  }

  steps.push(
    step(`Full string: "${ropeCollect(copy.root)}"`, []),
  );

  return { steps, snapshot: copy };
}

// ── split ───────────────────────────────────────────────────

export function ropeSplit(
  state: RopeState,
  index: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`split(${index})`, []));

  if (!state.root) {
    steps.push(step('Rope is empty, nothing to split', []));
    return { steps, snapshot: state };
  }

  if (index < 0 || index > state.totalLength) {
    steps.push(step(`Index ${index} out of bounds (length=${state.totalLength})`, []));
    return { steps, snapshot: state };
  }

  const fullStr = ropeCollect(state.root);
  const leftStr = fullStr.slice(0, index);
  const rightStr = fullStr.slice(index);

  steps.push(
    step(
      `Splitting "${fullStr}" at position ${index}`,
      [],
    ),
  );

  // Highlight the split point by walking to the leaf
  let node = state.root;
  let remaining = index;
  while (node && node.value === null) {
    steps.push(
      step(
        `Traverse node ${node.id} (weight=${node.weight}), split-index=${remaining}`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' }],
      ),
    );
    if (remaining <= node.weight && node.left) {
      node = node.left;
    } else {
      remaining -= node.weight;
      node = node.right!;
    }
  }

  if (node && node.value !== null) {
    steps.push(
      step(
        `Split at leaf "${node.value}" offset ${remaining}`,
        [{ targetId: node.id, property: 'highlight', from: 'default', to: 'deleting' }],
      ),
    );
  }

  // Build two new ropes
  _nodeId = 0;
  const newRoot = leftStr.length > 0 && rightStr.length > 0
    ? buildBalanced(leftStr + rightStr)
    : leftStr.length > 0
      ? buildBalanced(leftStr)
      : rightStr.length > 0
        ? buildBalanced(rightStr)
        : null;

  const newState: RopeState = {
    root: newRoot,
    totalLength: leftStr.length + rightStr.length,
  };

  steps.push(
    step(
      `Left: "${leftStr}" (len=${leftStr.length}), Right: "${rightStr}" (len=${rightStr.length})`,
      [],
    ),
  );

  steps.push(
    step(
      `Rebuilt rope. Full string: "${ropeCollect(newState.root)}"`,
      [],
    ),
  );

  return { steps, snapshot: newState };
}

// ── insert at position ──────────────────────────────────────

export function ropeInsertAt(
  state: RopeState,
  index: number,
  text: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`insertAt(${index}, "${text}")`, []));

  if (!state.root && index === 0) {
    _nodeId = 0;
    const newRoot = buildBalanced(text);
    const newState: RopeState = { root: newRoot, totalLength: text.length };
    steps.push(
      step(
        `Empty rope, creating new rope with "${text}"`,
        [{ targetId: newRoot.id, property: 'highlight', from: 'default', to: 'inserting' }],
      ),
    );
    return { steps, snapshot: newState };
  }

  if (index < 0 || index > state.totalLength) {
    steps.push(step(`Index ${index} out of bounds (length=${state.totalLength})`, []));
    return { steps, snapshot: state };
  }

  const fullStr = ropeCollect(state.root);
  const newStr = fullStr.slice(0, index) + text + fullStr.slice(index);

  steps.push(
    step(
      `Inserting "${text}" at position ${index} in "${fullStr}"`,
      [],
    ),
  );

  _nodeId = 0;
  const newRoot = buildBalanced(newStr);
  const newState: RopeState = { root: newRoot, totalLength: newStr.length };

  steps.push(
    step(
      `Rebuilt rope. Full string: "${newStr}" (length=${newStr.length})`,
      [{ targetId: newRoot.id, property: 'highlight', from: 'default', to: 'done' }],
    ),
  );

  return { steps, snapshot: newState };
}

// ── collect full string ─────────────────────────────────────

export function ropeToString(state: RopeState): string {
  return ropeCollect(state.root);
}
