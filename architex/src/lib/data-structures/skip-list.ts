// -----------------------------------------------------------------
// Architex -- Skip List Data Structure  (DST-015)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface SkipListNode {
  id: string;
  value: number;
  /** forward[i] is the id of the next node at level i */
  forward: (string | null)[];
}

export interface SkipListState {
  /** All nodes keyed by id */
  nodes: Map<string, SkipListNode>;
  /** Id of the sentinel head node */
  headId: string;
  /** Current maximum level (0-based) */
  maxLevel: number;
  /** Upper bound on levels */
  levelCap: number;
  size: number;
}

let _nodeCounter = 0;

function newNodeId(): string {
  return `sl-${_nodeCounter++}`;
}

function randomLevel(cap: number): { level: number; flips: string[] } {
  let lvl = 0;
  const flips: string[] = [];
  while (lvl < cap - 1) {
    const flip = Math.random() < 0.5;
    flips.push(flip ? 'H' : 'T');
    if (!flip) break;
    lvl++;
  }
  if (flips.length === 0 || flips[flips.length - 1] !== 'T') {
    flips.push('T');
  }
  return { level: lvl, flips };
}

/** Deep-clone the skip list state so mutations are safe inside React. */
export function cloneSkipList(state: SkipListState): SkipListState {
  const nodes = new Map<string, SkipListNode>();
  for (const [id, node] of state.nodes) {
    nodes.set(id, { ...node, forward: [...node.forward] });
  }
  return { ...state, nodes };
}

export function createSkipList(levelCap = 4): SkipListState {
  const headId = newNodeId();
  const head: SkipListNode = {
    id: headId,
    value: -Infinity,
    forward: Array(levelCap).fill(null),
  };
  const nodes = new Map<string, SkipListNode>();
  nodes.set(headId, head);
  return { nodes, headId, maxLevel: 0, levelCap, size: 0 };
}

/** Collect ordered values for display. */
export function skipListToArray(state: SkipListState): number[] {
  const result: number[] = [];
  const head = state.nodes.get(state.headId)!;
  let currentId = head.forward[0];
  while (currentId) {
    const node = state.nodes.get(currentId)!;
    result.push(node.value);
    currentId = node.forward[0];
  }
  return result;
}

// ── Operations ─────────────────────────────────────────────

export function skipListInsert(state: SkipListState, value: number): DSResult {
  const { step } = createStepRecorder();
  _nodeCounter = 0;
  const steps: DSStep[] = [];
  const s = cloneSkipList(state);

  // Determine level with coin flips
  const { level: newLevel, flips } = randomLevel(s.levelCap);
  steps.push(
    step(`Coin flips: [${flips.join(', ')}] => insert at level ${newLevel}`, []),
  );

  // Find update positions at each level
  const update: (string)[] = Array(s.levelCap).fill(s.headId);
  let currentId = s.headId;

  for (let i = s.maxLevel; i >= 0; i--) {
    let current = s.nodes.get(currentId)!;
    while (current.forward[i]) {
      const next = s.nodes.get(current.forward[i]!)!;
      if (next.value < value) {
        steps.push(
          step(`Level ${i}: ${next.value} < ${value}, move right`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'comparing' },
          ]),
        );
        currentId = next.id;
        current = next;
      } else {
        steps.push(
          step(`Level ${i}: ${next.value} >= ${value}, descend`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'visiting' },
          ]),
        );
        break;
      }
    }
    update[i] = currentId;
  }

  // Create new node
  const newId = newNodeId();
  const newNode: SkipListNode = {
    id: newId,
    value,
    forward: Array(s.levelCap).fill(null),
  };
  s.nodes.set(newId, newNode);

  // Update maxLevel if necessary
  if (newLevel > s.maxLevel) {
    for (let i = s.maxLevel + 1; i <= newLevel; i++) {
      update[i] = s.headId;
    }
    s.maxLevel = newLevel;
  }

  // Splice into each level
  for (let i = 0; i <= newLevel; i++) {
    const prev = s.nodes.get(update[i])!;
    newNode.forward[i] = prev.forward[i];
    prev.forward[i] = newId;
    steps.push(
      step(`Level ${i}: link ${value} after ${prev.value === -Infinity ? 'HEAD' : prev.value}`, [
        { targetId: newId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
  }

  s.size++;
  steps.push(
    step(`Inserted ${value}. Size: ${s.size}`, [
      { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

export function skipListSearch(state: SkipListState, value: number): DSResult {
  const { step } = createStepRecorder();
  _nodeCounter = 0;
  const steps: DSStep[] = [];

  steps.push(step(`Search for ${value} starting from top level ${state.maxLevel}`, []));

  let currentId = state.headId;

  for (let i = state.maxLevel; i >= 0; i--) {
    let current = state.nodes.get(currentId)!;
    while (current.forward[i]) {
      const next = state.nodes.get(current.forward[i]!)!;
      if (next.value < value) {
        steps.push(
          step(`Level ${i}: ${next.value} < ${value}, move right`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'comparing' },
          ]),
        );
        currentId = next.id;
        current = next;
      } else if (next.value === value) {
        steps.push(
          step(`Level ${i}: found ${value}!`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'found' },
          ]),
        );
        return { steps, snapshot: state };
      } else {
        steps.push(
          step(`Level ${i}: ${next.value} > ${value}, descend`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'visiting' },
          ]),
        );
        break;
      }
    }
    if (!state.nodes.get(currentId)!.forward[i]) {
      steps.push(
        step(`Level ${i}: reached end, descend`, []),
      );
    }
  }

  steps.push(step(`${value} not found in skip list`, []));
  return { steps, snapshot: state };
}

export function skipListDelete(state: SkipListState, value: number): DSResult {
  const { step } = createStepRecorder();
  _nodeCounter = 0;
  const steps: DSStep[] = [];
  const s = cloneSkipList(state);

  const update: string[] = Array(s.levelCap).fill(s.headId);
  let currentId = s.headId;

  for (let i = s.maxLevel; i >= 0; i--) {
    let current = s.nodes.get(currentId)!;
    while (current.forward[i]) {
      const next = s.nodes.get(current.forward[i]!)!;
      if (next.value < value) {
        steps.push(
          step(`Level ${i}: ${next.value} < ${value}, move right`, [
            { targetId: next.id, property: 'highlight', from: 'default', to: 'comparing' },
          ]),
        );
        currentId = next.id;
        current = next;
      } else {
        break;
      }
    }
    update[i] = currentId;
  }

  // Check if the value exists at level 0
  const head0 = s.nodes.get(update[0])!;
  const targetId = head0.forward[0];
  if (!targetId) {
    steps.push(step(`${value} not found -- nothing to delete`, []));
    return { steps, snapshot: s };
  }

  const target = s.nodes.get(targetId)!;
  if (target.value !== value) {
    steps.push(step(`${value} not found -- nothing to delete`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Found ${value}, removing from all levels`, [
      { targetId: target.id, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Unlink from each level
  for (let i = 0; i <= s.maxLevel; i++) {
    const prev = s.nodes.get(update[i])!;
    if (prev.forward[i] !== target.id) break;
    prev.forward[i] = target.forward[i];
    steps.push(
      step(`Level ${i}: unlinked ${value}`, [
        { targetId: target.id, property: 'highlight', from: 'deleting', to: 'deleting' },
      ]),
    );
  }

  s.nodes.delete(target.id);
  s.size--;

  // Adjust maxLevel
  while (s.maxLevel > 0) {
    const headNode = s.nodes.get(s.headId)!;
    if (headNode.forward[s.maxLevel] === null) {
      s.maxLevel--;
    } else {
      break;
    }
  }

  steps.push(step(`Deleted ${value}. Size: ${s.size}`, []));
  return { steps, snapshot: s };
}
