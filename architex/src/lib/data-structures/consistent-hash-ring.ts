// -----------------------------------------------------------------
// Architex -- Consistent Hash Ring (Data Structure)  (DST-022)
// -----------------------------------------------------------------
//
// Wraps the distributed/consistent-hash module as a step-recording
// data structure for the Data Structure Explorer.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface CHNode {
  id: string;
  label: string;
  position: number; // 0..359 (degree on ring for visualization)
  hash: number;     // raw 32-bit hash
}

export interface CHKey {
  key: string;
  hash: number;
  position: number; // 0..359
  owner: string;    // node id
}

export interface CHState {
  nodes: CHNode[];
  keys: CHKey[];
  ringSize: number; // conceptual ring size (360 for degree-based viz)
}

// FNV-1a hash (32-bit), matching the distributed module
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function hashToPosition(hash: number): number {
  return Math.round((hash / 0xffffffff) * 360) % 360;
}

function cloneCH(state: CHState): CHState {
  return {
    nodes: state.nodes.map((n) => ({ ...n })),
    keys: state.keys.map((k) => ({ ...k })),
    ringSize: state.ringSize,
  };
}

function findOwner(nodes: CHNode[], position: number): CHNode | null {
  if (nodes.length === 0) return null;
  // Sort by position
  const sorted = [...nodes].sort((a, b) => a.position - b.position);
  // Find the first node with position >= key position (clockwise)
  for (const node of sorted) {
    if (node.position >= position) return node;
  }
  // Wrap around: return the first node
  return sorted[0];
}

// ── Create ──────────────────────────────────────────────────

export function createCHRing(): CHState {
  return {
    nodes: [],
    keys: [],
    ringSize: 360,
  };
}

// ── Add Node ────────────────────────────────────────────────

export function chAddNode(state: CHState, nodeId: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCH(state);

  if (s.nodes.find((n) => n.id === nodeId)) {
    steps.push(step(`Node "${nodeId}" already exists on the ring`, []));
    return { steps, snapshot: s };
  }

  const hash = fnv1a(nodeId);
  const position = hashToPosition(hash);
  const label = nodeId;

  steps.push(
    step(`Hash("${nodeId}") = ${hash} -> position ${position} degrees`, [
      { targetId: `node-${nodeId}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  s.nodes.push({ id: nodeId, label, position, hash });
  steps.push(
    step(`Placed node "${nodeId}" at position ${position} on the ring`, [
      { targetId: `node-${nodeId}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // Redistribute keys
  let movedCount = 0;
  for (const key of s.keys) {
    const newOwner = findOwner(s.nodes, key.position);
    if (newOwner && newOwner.id !== key.owner) {
      const oldOwner = key.owner;
      key.owner = newOwner.id;
      movedCount++;
      steps.push(
        step(`Key "${key.key}" redistributed: ${oldOwner} -> ${newOwner.id}`, [
          { targetId: `key-${key.key}`, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
    }
  }

  if (movedCount === 0 && s.keys.length > 0) {
    steps.push(step('No keys needed redistribution', []));
  } else if (s.keys.length === 0) {
    steps.push(step('No keys on ring to redistribute', []));
  } else {
    steps.push(
      step(`Redistribution complete: ${movedCount} of ${s.keys.length} key(s) moved`, [
        { targetId: `node-${nodeId}`, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  return { steps, snapshot: s };
}

// ── Remove Node ─────────────────────────────────────────────

export function chRemoveNode(state: CHState, nodeId: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCH(state);

  const nodeIdx = s.nodes.findIndex((n) => n.id === nodeId);
  if (nodeIdx === -1) {
    steps.push(step(`Node "${nodeId}" not found on the ring`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Removing node "${nodeId}" from position ${s.nodes[nodeIdx].position}`, [
      { targetId: `node-${nodeId}`, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  s.nodes.splice(nodeIdx, 1);

  // Redistribute keys
  let movedCount = 0;
  for (const key of s.keys) {
    if (key.owner === nodeId) {
      const newOwner = findOwner(s.nodes, key.position);
      if (newOwner) {
        key.owner = newOwner.id;
        movedCount++;
        steps.push(
          step(`Key "${key.key}" reassigned: ${nodeId} -> ${newOwner.id}`, [
            { targetId: `key-${key.key}`, property: 'highlight', from: 'default', to: 'shifting' },
          ]),
        );
      }
    }
  }

  if (s.nodes.length === 0) {
    // No nodes left; keys become unassigned
    for (const key of s.keys) {
      key.owner = '';
    }
    steps.push(step('No nodes remaining; all keys unassigned', []));
  } else if (movedCount > 0) {
    steps.push(
      step(`Redistribution complete: ${movedCount} key(s) moved`, []),
    );
  } else {
    steps.push(step('No keys needed redistribution', []));
  }

  return { steps, snapshot: s };
}

// ── Lookup ──────────────────────────────────────────────────

export function chLookup(state: CHState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCH(state);

  if (s.nodes.length === 0) {
    steps.push(step('No nodes on the ring -- cannot lookup', []));
    return { steps, snapshot: s };
  }

  const hash = fnv1a(key);
  const position = hashToPosition(hash);

  steps.push(
    step(`Hash("${key}") = ${hash} -> position ${position} degrees`, [
      { targetId: `lookup-${key}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  // Walk clockwise
  const sorted = [...s.nodes].sort((a, b) => a.position - b.position);

  steps.push(
    step(`Walking clockwise from position ${position}...`, []),
  );

  let owner: CHNode | null = null;
  for (const node of sorted) {
    if (node.position >= position) {
      owner = node;
      steps.push(
        step(`Found node "${node.id}" at position ${node.position} (first node clockwise)`, [
          { targetId: `node-${node.id}`, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
      break;
    }
    steps.push(
      step(`Passed node "${node.id}" at position ${node.position} (before key position)`, [
        { targetId: `node-${node.id}`, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
  }

  if (!owner) {
    // Wrap around
    owner = sorted[0];
    steps.push(
      step(`Wrapped around ring to node "${owner.id}" at position ${owner.position}`, [
        { targetId: `node-${owner.id}`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
  }

  steps.push(
    step(`Key "${key}" is owned by node "${owner.id}"`, [
      { targetId: `node-${owner.id}`, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Add Keys (bulk) ─────────────────────────────────────────

export function chAddKeys(state: CHState, count: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCH(state);

  if (s.nodes.length === 0) {
    steps.push(step('No nodes on the ring -- cannot add keys', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Adding ${count} key(s) to the ring`, []),
  );

  const distribution = new Map<string, number>();
  for (const node of s.nodes) {
    distribution.set(node.id, 0);
  }

  for (let i = 0; i < count; i++) {
    const key = `key-${s.keys.length + i}`;
    const hash = fnv1a(key);
    const position = hashToPosition(hash);
    const owner = findOwner(s.nodes, position);

    if (owner) {
      s.keys.push({ key, hash, position, owner: owner.id });
      distribution.set(owner.id, (distribution.get(owner.id) ?? 0) + 1);

      if (count <= 10) {
        steps.push(
          step(`Key "${key}" -> position ${position} -> node "${owner.id}"`, [
            { targetId: `key-${key}`, property: 'highlight', from: 'default', to: 'inserting' },
          ]),
        );
      }
    }
  }

  if (count > 10) {
    steps.push(step(`Added ${count} keys (too many for individual step tracking)`, []));
  }

  // Show distribution
  const distEntries = Array.from(distribution.entries())
    .map(([nodeId, keyCount]) => `${nodeId}: ${keyCount}`)
    .join(', ');
  steps.push(
    step(`Distribution of new keys: ${distEntries}`, []),
  );

  // Show total distribution
  const totalDist = new Map<string, number>();
  for (const node of s.nodes) {
    totalDist.set(node.id, 0);
  }
  for (const key of s.keys) {
    totalDist.set(key.owner, (totalDist.get(key.owner) ?? 0) + 1);
  }
  const totalDistStr = Array.from(totalDist.entries())
    .map(([nodeId, keyCount]) => `${nodeId}: ${keyCount}`)
    .join(', ');
  steps.push(
    step(`Total key distribution: ${totalDistStr} (${s.keys.length} total keys)`, []),
  );

  return { steps, snapshot: s };
}
