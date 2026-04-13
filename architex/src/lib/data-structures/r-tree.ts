// -----------------------------------------------------------------
// Architex -- R-Tree Spatial Index  (DST-028)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RTreeEntry {
  id: string;
  x: number;
  y: number;
}

export interface RTreeNode {
  id: string;
  bbox: BoundingBox;
  entries: RTreeEntry[];      // leaf entries (points)
  children: RTreeNode[];      // child nodes (internal)
  isLeaf: boolean;
}

export interface RTreeState {
  root: RTreeNode | null;
  maxEntries: number;         // max entries per leaf before split
  size: number;
}

function emptyBBox(): BoundingBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

function expandBBox(bbox: BoundingBox, x: number, y: number): BoundingBox {
  return {
    minX: Math.min(bbox.minX, x),
    minY: Math.min(bbox.minY, y),
    maxX: Math.max(bbox.maxX, x),
    maxY: Math.max(bbox.maxY, y),
  };
}

function expandBBoxByBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function bboxArea(bbox: BoundingBox): number {
  if (bbox.minX > bbox.maxX || bbox.minY > bbox.maxY) return 0;
  return (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);
}

function bboxOverlaps(a: BoundingBox, b: BoundingBox): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function recalcBBox(node: RTreeNode): BoundingBox {
  let bbox = emptyBBox();
  if (node.isLeaf) {
    for (const e of node.entries) {
      bbox = expandBBox(bbox, e.x, e.y);
    }
  } else {
    for (const c of node.children) {
      bbox = expandBBoxByBox(bbox, c.bbox);
    }
  }
  return bbox;
}

let _nodeId = 0;

function makeNodeId(): string {
  return `rtn-${_nodeId++}`;
}

function cloneNode(node: RTreeNode): RTreeNode {
  return {
    ...node,
    bbox: { ...node.bbox },
    entries: node.entries.map((e) => ({ ...e })),
    children: node.children.map(cloneNode),
  };
}

// ── Create ─────────────────────────────────────────────────

export function createRTree(maxEntries: number = 4): RTreeState {
  _nodeId = 0;
  return { root: null, maxEntries, size: 0 };
}

export function cloneRTree(tree: RTreeState): RTreeState {
  return {
    ...tree,
    root: tree.root ? cloneNode(tree.root) : null,
  };
}

// ── Flatten for visualization ──────────────────────────────

export interface RTreeFlatNode {
  id: string;
  bbox: BoundingBox;
  depth: number;
  isLeaf: boolean;
  entries: RTreeEntry[];
  parentId: string | null;
}

export function flattenRTree(tree: RTreeState): RTreeFlatNode[] {
  const result: RTreeFlatNode[] = [];
  if (!tree.root) return result;

  function walk(node: RTreeNode, depth: number, parentId: string | null): void {
    result.push({
      id: node.id,
      bbox: node.bbox,
      depth,
      isLeaf: node.isLeaf,
      entries: node.entries,
      parentId,
    });
    for (const c of node.children) {
      walk(c, depth + 1, node.id);
    }
  }

  walk(tree.root, 0, null);
  return result;
}

// ── Insert ─────────────────────────────────────────────────

export function rtreeInsert(tree: RTreeState, x: number, y: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const t = cloneRTree(tree);
  const entryId = `pt-${t.size}`;
  const entry: RTreeEntry = { id: entryId, x, y };

  steps.push(step(`Insert point (${x}, ${y})`, []));

  // Empty tree: create root leaf
  if (!t.root) {
    const nodeId = makeNodeId();
    t.root = {
      id: nodeId,
      bbox: { minX: x, minY: y, maxX: x, maxY: y },
      entries: [entry],
      children: [],
      isLeaf: true,
    };
    t.size++;
    steps.push(
      step(`Created root leaf node with point (${x}, ${y})`, [
        { targetId: nodeId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return { steps, snapshot: t };
  }

  // Find best leaf: choose child whose bbox needs least area enlargement
  function chooseLeaf(node: RTreeNode): RTreeNode {
    if (node.isLeaf) return node;

    steps.push(
      step(`At node ${node.id}, choosing best child for (${x}, ${y})`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    let bestChild = node.children[0];
    let bestEnlargement = Infinity;

    for (const child of node.children) {
      const currentArea = bboxArea(child.bbox);
      const expanded = expandBBox(child.bbox, x, y);
      const enlargement = bboxArea(expanded) - currentArea;

      if (enlargement < bestEnlargement) {
        bestEnlargement = enlargement;
        bestChild = child;
      }
    }

    steps.push(
      step(`Best child: ${bestChild.id} (enlargement: ${bestEnlargement.toFixed(1)})`, [
        { targetId: bestChild.id, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    return chooseLeaf(bestChild);
  }

  const leaf = chooseLeaf(t.root);

  // Insert into leaf
  leaf.entries.push(entry);
  leaf.bbox = recalcBBox(leaf);

  steps.push(
    step(`Added point (${x}, ${y}) to leaf ${leaf.id}. Entries: ${leaf.entries.length}`, [
      { targetId: leaf.id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // Split if overflow
  if (leaf.entries.length > t.maxEntries) {
    steps.push(
      step(`Leaf ${leaf.id} overflowed (${leaf.entries.length} > ${t.maxEntries}). Splitting...`, [
        { targetId: leaf.id, property: 'highlight', from: 'inserting', to: 'shifting' },
      ]),
    );

    // Simple split: sort by x-coordinate and divide
    const sorted = [...leaf.entries].sort((a, b) => a.x - b.x);
    const mid = Math.floor(sorted.length / 2);

    const newNodeId = makeNodeId();
    const newLeaf: RTreeNode = {
      id: newNodeId,
      bbox: emptyBBox(),
      entries: sorted.slice(mid),
      children: [],
      isLeaf: true,
    };
    newLeaf.bbox = recalcBBox(newLeaf);

    leaf.entries = sorted.slice(0, mid);
    leaf.bbox = recalcBBox(leaf);

    steps.push(
      step(`Split into ${leaf.id} (${leaf.entries.length} entries) and ${newNodeId} (${newLeaf.entries.length} entries)`, [
        { targetId: leaf.id, property: 'highlight', from: 'shifting', to: 'done' },
        { targetId: newNodeId, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );

    // If leaf was root, create new root
    if (t.root === leaf || t.root.id === leaf.id) {
      const rootId = makeNodeId();
      t.root = {
        id: rootId,
        bbox: expandBBoxByBox(leaf.bbox, newLeaf.bbox),
        entries: [],
        children: [leaf, newLeaf],
        isLeaf: false,
      };
      steps.push(
        step(`Created new root ${rootId} with two children`, [
          { targetId: rootId, property: 'highlight', from: 'default', to: 'done' },
        ]),
      );
    } else {
      // Find parent and add new child (simplified: walk tree to find parent)
      function addToParent(node: RTreeNode): boolean {
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].id === leaf.id) {
            node.children.push(newLeaf);
            node.bbox = recalcBBox(node);
            return true;
          }
          if (!node.children[i].isLeaf && addToParent(node.children[i])) {
            node.bbox = recalcBBox(node);
            return true;
          }
        }
        return false;
      }
      addToParent(t.root);
    }
  }

  // Propagate bbox updates up
  function updateBBoxes(node: RTreeNode): void {
    if (!node.isLeaf) {
      for (const c of node.children) {
        updateBBoxes(c);
      }
    }
    node.bbox = recalcBBox(node);
  }
  updateBBoxes(t.root);

  t.size++;

  steps.push(
    step(`Inserted (${x}, ${y}). Tree size: ${t.size}`, [
      { targetId: t.root.id, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: t };
}

// ── Search (Range Query) ───────────────────────────────────

export function rtreeSearch(
  tree: RTreeState,
  queryBox: BoundingBox,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const found: RTreeEntry[] = [];

  steps.push(
    step(`Range search: [${queryBox.minX},${queryBox.minY}] to [${queryBox.maxX},${queryBox.maxY}]`, []),
  );

  if (!tree.root) {
    steps.push(step('Tree is empty -- no results', []));
    return { steps, snapshot: tree };
  }

  function searchNode(node: RTreeNode): void {
    // Check overlap with query
    if (!bboxOverlaps(node.bbox, queryBox)) {
      steps.push(
        step(`Node ${node.id} bbox does not overlap query -- skip`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'not-found' },
        ]),
      );
      return;
    }

    steps.push(
      step(`Node ${node.id} bbox overlaps query -- descend`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (node.isLeaf) {
      for (const e of node.entries) {
        const inside =
          e.x >= queryBox.minX &&
          e.x <= queryBox.maxX &&
          e.y >= queryBox.minY &&
          e.y <= queryBox.maxY;
        if (inside) {
          found.push(e);
          steps.push(
            step(`Found point (${e.x}, ${e.y}) inside query range`, [
              { targetId: e.id, property: 'highlight', from: 'default', to: 'found' },
            ]),
          );
        } else {
          steps.push(
            step(`Point (${e.x}, ${e.y}) outside query range`, [
              { targetId: e.id, property: 'highlight', from: 'default', to: 'not-found' },
            ]),
          );
        }
      }
    } else {
      for (const c of node.children) {
        searchNode(c);
      }
    }
  }

  searchNode(tree.root);

  steps.push(
    step(`Search complete. Found ${found.length} point(s)`, []),
  );

  return { steps, snapshot: tree };
}
