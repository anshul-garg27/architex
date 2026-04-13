// ─────────────────────────────────────────────────────────────
// Architex — Force-Directed Graph Layout for Knowledge Graph
// ─────────────────────────────────────────────────────────────

import type { Concept, ConceptRelationship, ConceptDomain } from "./concepts";
import { ALL_DOMAINS, getConnectionCount } from "./concepts";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  concept: Concept;
  connectionCount: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  relationship: ConceptRelationship;
}

export interface GraphLayout {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

// ── Domain cluster centers (arranged in a circle) ──────────────

function getDomainCenters(
  width: number,
  height: number,
): Map<ConceptDomain, { x: number; y: number }> {
  const centers = new Map<ConceptDomain, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  ALL_DOMAINS.forEach((domain, i) => {
    const angle = (2 * Math.PI * i) / ALL_DOMAINS.length - Math.PI / 2;
    centers.set(domain, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  return centers;
}

// ── Force-directed layout algorithm ────────────────────────────

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  concept: Concept;
  connectionCount: number;
}

interface LayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  repulsionForce?: number;
  attractionForce?: number;
  clusterForce?: number;
  damping?: number;
  maxVelocity?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  width: 2400,
  height: 1600,
  iterations: 100,
  repulsionForce: 5000,
  attractionForce: 0.005,
  clusterForce: 0.08,
  damping: 0.85,
  maxVelocity: 10,
};

export function layoutGraph(
  concepts: Concept[],
  relationships: ConceptRelationship[],
  options: LayoutOptions = {},
): GraphLayout {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, iterations, repulsionForce, attractionForce, clusterForce, damping, maxVelocity } = opts;

  const domainCenters = getDomainCenters(width, height);

  // Initialize nodes near their domain cluster center with some jitter
  const nodes: ForceNode[] = concepts.map((concept) => {
    const center = domainCenters.get(concept.domain)!;
    const jitterX = (Math.random() - 0.5) * 200;
    const jitterY = (Math.random() - 0.5) * 200;
    return {
      id: concept.id,
      x: center.x + jitterX,
      y: center.y + jitterY,
      vx: 0,
      vy: 0,
      concept,
      connectionCount: getConnectionCount(concept.id),
    };
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build adjacency from relationships
  const edgeSet = new Set<string>();
  const validEdges: { source: ForceNode; target: ForceNode; rel: ConceptRelationship }[] = [];

  for (const rel of relationships) {
    const s = nodeMap.get(rel.source);
    const t = nodeMap.get(rel.target);
    if (!s || !t) continue;
    const edgeKey = [rel.source, rel.target].sort().join(":");
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);
    validEdges.push({ source: s, target: t, rel });
  }

  // Run force simulation
  for (let iter = 0; iter < iterations; iter++) {
    const coolingFactor = 1 - iter / iterations;

    // Repulsion: all pairs (Barnes-Hut would be better for large graphs,
    // but with ~60 nodes O(n^2) is fine)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);
        const force = (repulsionForce * coolingFactor) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Attraction: along edges
    for (const edge of validEdges) {
      const { source, target } = edge;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const idealDist = 150;
      const displacement = dist - idealDist;
      const force = attractionForce * displacement * coolingFactor;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Cluster attraction: pull nodes toward their domain center
    for (const node of nodes) {
      const center = domainCenters.get(node.concept.domain)!;
      const dx = center.x - node.x;
      const dy = center.y - node.y;
      node.vx += dx * clusterForce * coolingFactor;
      node.vy += dy * clusterForce * coolingFactor;
    }

    // Apply velocities with damping and velocity capping
    for (const node of nodes) {
      node.vx *= damping;
      node.vy *= damping;

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity;
        node.vy = (node.vy / speed) * maxVelocity;
      }

      node.x += node.vx;
      node.y += node.vy;

      // Keep within bounds (with margin)
      const margin = 80;
      node.x = Math.max(margin, Math.min(width - margin, node.x));
      node.y = Math.max(margin, Math.min(height - margin, node.y));
    }
  }

  // Build output
  const positionedNodes: PositionedNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    concept: n.concept,
    connectionCount: n.connectionCount,
  }));

  const layoutEdges: LayoutEdge[] = validEdges.map((e, i) => ({
    id: `edge-${i}-${e.source.id}-${e.target.id}`,
    source: e.source.id,
    target: e.target.id,
    relationship: e.rel,
  }));

  return {
    nodes: positionedNodes,
    edges: layoutEdges,
    width,
    height,
  };
}
