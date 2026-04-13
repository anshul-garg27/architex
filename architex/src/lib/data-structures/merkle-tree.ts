// -----------------------------------------------------------------
// Architex -- Merkle Tree Simulation  (DST-023)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface MerkleLeafNode {
  id: string;
  kind: 'leaf';
  hash: string;
  data: string;
}

export interface MerkleInternalNode {
  id: string;
  kind: 'internal';
  hash: string;
  left: MerkleNode;
  right: MerkleNode;
}

export type MerkleNode = MerkleLeafNode | MerkleInternalNode;

export interface MerkleState {
  root: MerkleNode | null;
  leaves: string[]; // original data items
  depth: number;
}

/** Simple deterministic hash function (djb2) returning a short hex string. */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  // Return 8-char hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

let _nodeId = 0;

function nextNodeId(): string {
  return `mk-${_nodeId++}`;
}

function resetNodeId(): void {
  _nodeId = 0;
}

function cloneMerkle(state: MerkleState): MerkleState {
  return {
    root: state.root ? cloneNode(state.root) : null,
    leaves: [...state.leaves],
    depth: state.depth,
  };
}

function cloneNode(node: MerkleNode): MerkleNode {
  if (node.kind === 'leaf') {
    return { id: node.id, kind: 'leaf', hash: node.hash, data: node.data };
  }
  return {
    id: node.id,
    kind: 'internal',
    hash: node.hash,
    left: cloneNode(node.left),
    right: cloneNode(node.right),
  };
}

// ── Create ──────────────────────────────────────────────────

export function createMerkleTree(): MerkleState {
  return {
    root: null,
    leaves: [],
    depth: 0,
  };
}

// ── Build ───────────────────────────────────────────────────

export function merkleTreeBuild(data: string[]): DSResult {
  const { step } = createStepRecorder();
  resetNodeId();
  const steps: DSStep[] = [];

  if (data.length === 0) {
    steps.push(step('No data to build tree from', []));
    const state: MerkleState = { root: null, leaves: [], depth: 0 };
    return { steps, snapshot: state };
  }

  // Pad to next power of 2
  let paddedData = [...data];
  while (paddedData.length > 1 && (paddedData.length & (paddedData.length - 1)) !== 0) {
    paddedData.push(paddedData[paddedData.length - 1]); // duplicate last
  }

  steps.push(
    step(`Building Merkle tree for ${data.length} item(s)${paddedData.length > data.length ? ` (padded to ${paddedData.length})` : ''}`, []),
  );

  // Step 1: Hash leaf nodes
  const leaves: MerkleNode[] = [];
  for (let i = 0; i < paddedData.length; i++) {
    const hash = simpleHash(paddedData[i]);
    const id = nextNodeId();
    leaves.push({ id, kind: 'leaf', hash, data: paddedData[i] });
    steps.push(
      step(`Leaf ${i}: hash("${paddedData[i]}") = ${hash}`, [
        { targetId: id, property: 'highlight', from: 'default', to: 'hashing' },
      ]),
    );
  }

  // Step 2: Build tree bottom-up
  let currentLevel: MerkleNode[] = leaves;
  let levelNum = 0;

  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];
    levelNum++;

    steps.push(
      step(`Building level ${levelNum} (${currentLevel.length / 2} parent node${currentLevel.length / 2 !== 1 ? 's' : ''})`, []),
    );

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] ?? currentLevel[i]; // handle odd case

      const combinedInput = left.hash + right.hash;
      const parentHash = simpleHash(combinedInput);
      const parentId = nextNodeId();

      const parentNode: MerkleInternalNode = {
        id: parentId,
        kind: 'internal',
        hash: parentHash,
        left,
        right,
      };

      nextLevel.push(parentNode);
      steps.push(
        step(`hash(${left.hash.slice(0, 6)}.. + ${right.hash.slice(0, 6)}..) = ${parentHash}`, [
          { targetId: left.id, property: 'highlight', from: 'default', to: 'visiting' },
          { targetId: right.id, property: 'highlight', from: 'default', to: 'visiting' },
          { targetId: parentId, property: 'highlight', from: 'default', to: 'inserting' },
        ]),
      );
    }

    currentLevel = nextLevel;
  }

  const root = currentLevel[0];
  steps.push(
    step(`Merkle root hash: ${root.hash}`, [
      { targetId: root.id, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  const depth = Math.ceil(Math.log2(Math.max(paddedData.length, 1))) + 1;
  const state: MerkleState = {
    root,
    leaves: data,
    depth,
  };

  return { steps, snapshot: state };
}

// ── Verify (generate proof for a leaf) ──────────────────────

export function merkleTreeVerify(state: MerkleState, leafIndex: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneMerkle(state);

  if (!s.root) {
    steps.push(step('Tree is empty -- nothing to verify', []));
    return { steps, snapshot: s };
  }

  // Collect all leaves
  const leaves: MerkleLeafNode[] = [];
  function collectLeaves(node: MerkleNode): void {
    if (node.kind === 'leaf') {
      leaves.push(node);
      return;
    }
    collectLeaves(node.left);
    collectLeaves(node.right);
  }
  collectLeaves(s.root);

  if (leafIndex < 0 || leafIndex >= leaves.length) {
    steps.push(step(`Leaf index ${leafIndex} out of range (0-${leaves.length - 1})`, []));
    return { steps, snapshot: s };
  }

  const targetLeaf = leaves[leafIndex];
  steps.push(
    step(`Verifying leaf ${leafIndex}: "${targetLeaf.data}" (hash: ${targetLeaf.hash})`, [
      { targetId: targetLeaf.id, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  // Build path from root to leaf, collecting sibling hashes
  const proof: string[] = [];
  const pathNodeIds: string[] = [];

  function findPath(node: MerkleNode, targetId: string): boolean {
    if (node.id === targetId) {
      pathNodeIds.push(node.id);
      return true;
    }
    if (node.kind === 'leaf') return false;
    if (findPath(node.left, targetId)) {
      pathNodeIds.push(node.id);
      // Sibling is the right child
      proof.push(node.right.hash);
      steps.push(
        step(`Sibling hash needed: ${node.right.hash.slice(0, 8)}.. (right sibling)`, [
          { targetId: node.right.id, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      return true;
    }
    if (findPath(node.right, targetId)) {
      pathNodeIds.push(node.id);
      // Sibling is the left child
      proof.push(node.left.hash);
      steps.push(
        step(`Sibling hash needed: ${node.left.hash.slice(0, 8)}.. (left sibling)`, [
          { targetId: node.left.id, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      return true;
    }
    return false;
  }

  findPath(s.root, targetLeaf.id);

  // Verify by recomputing from leaf to root
  steps.push(
    step(`Verification path has ${proof.length} sibling hash(es)`, []),
  );

  let currentHash = targetLeaf.hash;
  for (let i = 0; i < proof.length; i++) {
    const siblingHash = proof[i];
    // Determine order by checking if leaf was on left or right
    const combined = simpleHash(currentHash + siblingHash);
    const combined2 = simpleHash(siblingHash + currentHash);

    // Try both orderings, use whichever matches a parent
    const parentId = pathNodeIds[pathNodeIds.length - 2 - i];
    let parentNode: MerkleNode | null = null;
    function findNode(node: MerkleNode, id: string): MerkleNode | null {
      if (node.id === id) return node;
      if (node.kind === 'leaf') return null;
      const foundLeft = findNode(node.left, id);
      if (foundLeft) return foundLeft;
      return findNode(node.right, id);
    }
    if (parentId) {
      parentNode = findNode(s.root, parentId);
    }

    if (parentNode && parentNode.hash === combined) {
      currentHash = combined;
    } else if (parentNode && parentNode.hash === combined2) {
      currentHash = combined2;
    } else {
      currentHash = combined; // fallback
    }

    steps.push(
      step(`Level ${i + 1}: hash(... + ${siblingHash.slice(0, 6)}..) = ${currentHash}`, [
        ...(parentId ? [{ targetId: parentId, property: 'highlight', from: 'default', to: 'done' } as DSMutation] : []),
      ]),
    );
  }

  const valid = currentHash === s.root.hash;
  steps.push(
    step(
      valid
        ? `Verification successful! Computed root ${currentHash} matches tree root ${s.root.hash}`
        : `Verification failed! Computed root ${currentHash} differs from tree root ${s.root.hash}`,
      [
        { targetId: s.root.id, property: 'highlight', from: 'default', to: valid ? 'done' : 'not-found' },
      ],
    ),
  );

  return { steps, snapshot: s };
}
