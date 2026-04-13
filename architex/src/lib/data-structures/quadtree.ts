// -----------------------------------------------------------------
// Architex -- Quadtree 2D Spatial Partitioning  (DST-029)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface QTPoint {
  id: string;
  x: number;
  y: number;
}

export interface QTBounds {
  x: number;      // center x
  y: number;      // center y
  hw: number;     // half-width
  hh: number;     // half-height
}

export interface QTNode {
  id: string;
  bounds: QTBounds;
  points: QTPoint[];
  children: [QTNode, QTNode, QTNode, QTNode] | null;  // NW, NE, SW, SE
  divided: boolean;
}

export interface QuadtreeState {
  root: QTNode;
  capacity: number;   // max points before subdivision
  size: number;
}

let _nodeId = 0;

function makeNodeId(): string {
  return `qt-${_nodeId++}`;
}

function containsPoint(bounds: QTBounds, x: number, y: number): boolean {
  return (
    x >= bounds.x - bounds.hw &&
    x <= bounds.x + bounds.hw &&
    y >= bounds.y - bounds.hh &&
    y <= bounds.y + bounds.hh
  );
}

function boundsOverlap(a: QTBounds, b: QTBounds): boolean {
  return !(
    a.x - a.hw > b.x + b.hw ||
    a.x + a.hw < b.x - b.hw ||
    a.y - a.hh > b.y + b.hh ||
    a.y + a.hh < b.y - b.hh
  );
}

function cloneQTNode(node: QTNode): QTNode {
  return {
    id: node.id,
    bounds: { ...node.bounds },
    points: node.points.map((p) => ({ ...p })),
    children: node.children
      ? [
          cloneQTNode(node.children[0]),
          cloneQTNode(node.children[1]),
          cloneQTNode(node.children[2]),
          cloneQTNode(node.children[3]),
        ]
      : null,
    divided: node.divided,
  };
}

function createQTNode(bounds: QTBounds): QTNode {
  return {
    id: makeNodeId(),
    bounds,
    points: [],
    children: null,
    divided: false,
  };
}

// ── Create ─────────────────────────────────────────────────

export function createQuadtree(
  width: number = 100,
  height: number = 100,
  capacity: number = 4,
): QuadtreeState {
  _nodeId = 0;
  const hw = width / 2;
  const hh = height / 2;
  return {
    root: createQTNode({ x: hw, y: hh, hw, hh }),
    capacity,
    size: 0,
  };
}

export function cloneQuadtree(tree: QuadtreeState): QuadtreeState {
  return {
    ...tree,
    root: cloneQTNode(tree.root),
  };
}

// ── Flatten for visualization ──────────────────────────────

export interface QTFlatNode {
  id: string;
  bounds: QTBounds;
  depth: number;
  points: QTPoint[];
  divided: boolean;
  quadrant: string;  // "root" | "NW" | "NE" | "SW" | "SE"
}

export function flattenQuadtree(tree: QuadtreeState): QTFlatNode[] {
  const result: QTFlatNode[] = [];

  function walk(node: QTNode, depth: number, quad: string): void {
    result.push({
      id: node.id,
      bounds: node.bounds,
      depth,
      points: node.points,
      divided: node.divided,
      quadrant: quad,
    });
    if (node.children) {
      walk(node.children[0], depth + 1, 'NW');
      walk(node.children[1], depth + 1, 'NE');
      walk(node.children[2], depth + 1, 'SW');
      walk(node.children[3], depth + 1, 'SE');
    }
  }

  walk(tree.root, 0, 'root');
  return result;
}

// ── Insert ─────────────────────────────────────────────────

export function qtInsert(tree: QuadtreeState, x: number, y: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const t = cloneQuadtree(tree);
  const pointId = `p-${t.size}`;
  const point: QTPoint = { id: pointId, x, y };

  steps.push(step(`Insert point (${x}, ${y})`, []));

  function insertInto(node: QTNode): boolean {
    // Check if point is within bounds
    if (!containsPoint(node.bounds, x, y)) {
      steps.push(
        step(`Point (${x}, ${y}) outside node ${node.id} bounds -- skip`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'not-found' },
        ]),
      );
      return false;
    }

    steps.push(
      step(`Point (${x}, ${y}) within node ${node.id} bounds`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    // If not divided and has capacity, insert here
    if (!node.divided && node.points.length < t.capacity) {
      node.points.push(point);
      steps.push(
        step(`Inserted into node ${node.id}. Points: ${node.points.length}/${t.capacity}`, [
          { targetId: node.id, property: 'highlight', from: 'visiting', to: 'inserting' },
        ]),
      );
      return true;
    }

    // Subdivide if not already
    if (!node.divided) {
      subdivide(node);
    }

    // Try inserting into children
    for (const child of node.children!) {
      if (insertInto(child)) return true;
    }

    return false;
  }

  function subdivide(node: QTNode): void {
    const { x: cx, y: cy, hw, hh } = node.bounds;
    const qw = hw / 2;
    const qh = hh / 2;

    node.children = [
      createQTNode({ x: cx - qw, y: cy - qh, hw: qw, hh: qh }),  // NW
      createQTNode({ x: cx + qw, y: cy - qh, hw: qw, hh: qh }),  // NE
      createQTNode({ x: cx - qw, y: cy + qh, hw: qw, hh: qh }),  // SW
      createQTNode({ x: cx + qw, y: cy + qh, hw: qw, hh: qh }),  // SE
    ];
    node.divided = true;

    steps.push(
      step(`Subdivided node ${node.id} into 4 quadrants (capacity ${t.capacity} exceeded)`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: node.children[0].id, property: 'highlight', from: 'default', to: 'inserting' },
        { targetId: node.children[1].id, property: 'highlight', from: 'default', to: 'inserting' },
        { targetId: node.children[2].id, property: 'highlight', from: 'default', to: 'inserting' },
        { targetId: node.children[3].id, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );

    // Re-insert existing points into children
    const existing = [...node.points];
    node.points = [];
    for (const ep of existing) {
      for (const child of node.children) {
        if (containsPoint(child.bounds, ep.x, ep.y)) {
          child.points.push(ep);
          break;
        }
      }
    }
  }

  const inserted = insertInto(t.root);

  if (inserted) {
    t.size++;
    steps.push(
      step(`Inserted (${x}, ${y}). Total points: ${t.size}`, []),
    );
  } else {
    steps.push(
      step(`Point (${x}, ${y}) is out of bounds`, []),
    );
  }

  return { steps, snapshot: t };
}

// ── Range Query ────────────────────────────────────────────

export function qtSearch(
  tree: QuadtreeState,
  range: QTBounds,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const found: QTPoint[] = [];

  steps.push(
    step(`Range query: center (${range.x}, ${range.y}), half-size ${range.hw}x${range.hh}`, []),
  );

  function searchNode(node: QTNode): void {
    if (!boundsOverlap(node.bounds, range)) {
      steps.push(
        step(`Node ${node.id} does not overlap query -- skip`, [
          { targetId: node.id, property: 'highlight', from: 'default', to: 'not-found' },
        ]),
      );
      return;
    }

    steps.push(
      step(`Node ${node.id} overlaps query range -- checking`, [
        { targetId: node.id, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    for (const p of node.points) {
      if (containsPoint(range, p.x, p.y)) {
        found.push(p);
        steps.push(
          step(`Found point (${p.x}, ${p.y}) in range`, [
            { targetId: p.id, property: 'highlight', from: 'default', to: 'found' },
          ]),
        );
      }
    }

    if (node.children) {
      for (const child of node.children) {
        searchNode(child);
      }
    }
  }

  searchNode(tree.root);

  steps.push(
    step(`Query complete. Found ${found.length} point(s)`, []),
  );

  return { steps, snapshot: tree };
}
