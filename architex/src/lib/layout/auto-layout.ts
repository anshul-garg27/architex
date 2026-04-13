/**
 * Auto-layout engine for Architex system design canvas.
 * INF-007 through INF-011: Pure TypeScript, zero external dependencies.
 */
import type { Node, Edge } from "@xyflow/react";

// ── Public types ────────────────────────────────────────────

export type LayoutAlgorithm =
  | "hierarchical"
  | "force-directed"
  | "circular"
  | "grid";

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
}

export interface LayoutOptions {
  spacing?: number;
  direction?: "TB" | "LR";
}

// ── Entry point ─────────────────────────────────────────────

export function computeLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: LayoutAlgorithm,
  options?: LayoutOptions,
): LayoutResult {
  if (nodes.length === 0) return { positions: new Map() };

  switch (algorithm) {
    case "hierarchical":
      return hierarchicalLayout(nodes, edges, options);
    case "force-directed":
      return forceDirectedLayout(nodes, edges, options);
    case "circular":
      return circularLayout(nodes, options);
    case "grid":
      return gridLayout(nodes, options);
  }
}

// ── Helpers ─────────────────────────────────────────────────

function nodeWidth(n: Node): number {
  return n.measured?.width ?? (n.width as number | undefined) ?? 180;
}

function nodeHeight(n: Node): number {
  return n.measured?.height ?? (n.height as number | undefined) ?? 60;
}

/** Build adjacency list from edges (source -> targets). */
function buildAdj(
  nodes: Node[],
  edges: Edge[],
): { adj: Map<string, string[]>; inDeg: Map<string, number> } {
  const ids = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const id of ids) {
    adj.set(id, []);
    inDeg.set(id, 0);
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }
  return { adj, inDeg };
}

// ── 1. Hierarchical layout (INF-007) ────────────────────────

function hierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  options?: LayoutOptions,
): LayoutResult {
  const spacing = options?.spacing ?? 200;
  const isLR = options?.direction === "LR";
  const { adj, inDeg } = buildAdj(nodes, edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Kahn's topological sort to assign layers
  const layers: string[][] = [];
  const layerOf = new Map<string, number>();
  const remaining = new Map(inDeg);
  const queue: string[] = [];

  for (const [id, deg] of remaining) {
    if (deg === 0) queue.push(id);
  }

  // Assign each node to the deepest layer reachable
  while (queue.length > 0) {
    const batch = [...queue];
    queue.length = 0;
    const layer: string[] = [];

    for (const id of batch) {
      const currentLayer = layerOf.get(id) ?? 0;
      // Place at the deepest layer from predecessors
      while (layers.length <= currentLayer) layers.push([]);
      layer.push(id);
      layerOf.set(id, currentLayer);

      for (const target of adj.get(id) ?? []) {
        const newDeg = (remaining.get(target) ?? 1) - 1;
        remaining.set(target, newDeg);
        // Target goes at least one layer deeper than current
        const targetLayer = Math.max(
          layerOf.get(target) ?? 0,
          currentLayer + 1,
        );
        layerOf.set(target, targetLayer);
        if (newDeg === 0) queue.push(target);
      }
    }

    // Nodes not reached yet (in a cycle) get placed at layer 0
    for (const id of layer) {
      const l = layerOf.get(id)!;
      while (layers.length <= l) layers.push([]);
      layers[l].push(id);
    }
  }

  // Handle any remaining nodes (cycles) by putting them in the last layer
  const placed = new Set(layers.flat());
  for (const n of nodes) {
    if (!placed.has(n.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(n.id);
    }
  }

  // Minimize edge crossings with barycentric heuristic (2 passes)
  for (let pass = 0; pass < 2; pass++) {
    for (let li = 1; li < layers.length; li++) {
      const prevLayer = layers[li - 1];
      const prevPos = new Map(prevLayer.map((id, i) => [id, i]));

      const bary = new Map<string, number>();
      for (const id of layers[li]) {
        // find parents in previous layer
        let sum = 0;
        let count = 0;
        for (const e of edges) {
          if (e.target === id && prevPos.has(e.source)) {
            sum += prevPos.get(e.source)!;
            count++;
          }
          if (e.source === id && prevPos.has(e.target)) {
            sum += prevPos.get(e.target)!;
            count++;
          }
        }
        bary.set(id, count > 0 ? sum / count : Infinity);
      }

      layers[li].sort((a, b) => (bary.get(a) ?? 0) - (bary.get(b) ?? 0));
    }
  }

  // Position nodes
  const positions = new Map<string, { x: number; y: number }>();

  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    // Center each layer
    const totalWidth = layer.reduce((sum, id) => {
      const n = nodeMap.get(id)!;
      return sum + (isLR ? nodeHeight(n) : nodeWidth(n));
    }, 0);
    const totalGaps = (layer.length - 1) * (spacing * 0.6);
    let offset = -(totalWidth + totalGaps) / 2;

    for (const id of layer) {
      const n = nodeMap.get(id)!;
      const w = nodeWidth(n);
      const h = nodeHeight(n);

      if (isLR) {
        positions.set(id, {
          x: li * spacing,
          y: offset + h / 2,
        });
        offset += h + spacing * 0.6;
      } else {
        positions.set(id, {
          x: offset + w / 2,
          y: li * spacing,
        });
        offset += w + spacing * 0.6;
      }
    }
  }

  return { positions };
}

// ── 2. Force-directed layout (INF-008) ──────────────────────

function forceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  options?: LayoutOptions,
): LayoutResult {
  const spacing = options?.spacing ?? 200;
  const iterations = 50;
  const repulsionStrength = spacing * spacing * 2;
  const attractionStrength = 0.01;
  const friction = 0.9;

  const ids = nodes.map((n) => n.id);
  const idIndex = new Map(ids.map((id, i) => [id, i]));

  // Initialize positions from current or in a circle
  const pos: { x: number; y: number }[] = nodes.map((n, i) => ({
    x: n.position?.x ?? Math.cos((2 * Math.PI * i) / nodes.length) * spacing,
    y: n.position?.y ?? Math.sin((2 * Math.PI * i) / nodes.length) * spacing,
  }));

  const vel: { x: number; y: number }[] = nodes.map(() => ({ x: 0, y: 0 }));

  // Build edge index pairs
  const edgePairs: [number, number][] = [];
  for (const e of edges) {
    const si = idIndex.get(e.source);
    const ti = idIndex.get(e.target);
    if (si !== undefined && ti !== undefined) {
      edgePairs.push([si, ti]);
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    const temperature = 1 - iter / iterations; // cool down

    // Repulsion between all pairs
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const force = (repulsionStrength * temperature) / distSq;
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vel[i].x += fx;
        vel[i].y += fy;
        vel[j].x -= fx;
        vel[j].y -= fy;
      }
    }

    // Attraction along edges
    for (const [si, ti] of edgePairs) {
      const dx = pos[ti].x - pos[si].x;
      const dy = pos[ti].y - pos[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;
      const force = dist * attractionStrength * temperature;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      vel[si].x += fx;
      vel[si].y += fy;
      vel[ti].x -= fx;
      vel[ti].y -= fy;
    }

    // Apply velocity with friction
    for (let i = 0; i < ids.length; i++) {
      vel[i].x *= friction;
      vel[i].y *= friction;
      // Clamp velocity
      const maxV = spacing * temperature;
      const vMag = Math.sqrt(vel[i].x * vel[i].x + vel[i].y * vel[i].y);
      if (vMag > maxV) {
        vel[i].x = (vel[i].x / vMag) * maxV;
        vel[i].y = (vel[i].y / vMag) * maxV;
      }
      pos[i].x += vel[i].x;
      pos[i].y += vel[i].y;
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (let i = 0; i < ids.length; i++) {
    positions.set(ids[i], { x: pos[i].x, y: pos[i].y });
  }
  return { positions };
}

// ── 3. Circular layout (INF-009) ────────────────────────────

function circularLayout(
  nodes: Node[],
  options?: LayoutOptions,
): LayoutResult {
  const spacing = options?.spacing ?? 200;
  const n = nodes.length;

  // Radius scales with node count so they don't overlap
  const avgSize =
    nodes.reduce((s, nd) => s + Math.max(nodeWidth(nd), nodeHeight(nd)), 0) / n;
  const circumference = n * (avgSize + spacing * 0.4);
  const radius = Math.max(circumference / (2 * Math.PI), spacing);

  const positions = new Map<string, { x: number; y: number }>();
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start from top
    positions.set(nodes[i].id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return { positions };
}

// ── 4. Grid layout (INF-010) ────────────────────────────────

function gridLayout(
  nodes: Node[],
  options?: LayoutOptions,
): LayoutResult {
  const spacing = options?.spacing ?? 200;
  const n = nodes.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));

  const positions = new Map<string, { x: number; y: number }>();
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(nodes[i].id, {
      x: col * spacing,
      y: row * spacing,
    });
  }
  return { positions };
}
