import type { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────
// Architecture Diff Engine  (INO-006)
// ─────────────────────────────────────────────────────────────

export interface DiffResult {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: Array<{ id: string; changes: string[] }>;
  addedEdges: string[];
  removedEdges: string[];
  summary: string[];
}

// ── Helpers ─────────────────────────────────────────────────

type NodeData = Record<string, unknown>;

function getComponentType(node: Node): string {
  const data = node.data as NodeData;
  return (
    (data.componentType as string) ??
    node.type ??
    'unknown'
  );
}

function getLabel(node: Node): string {
  const data = node.data as NodeData;
  return (data.label as string) ?? node.id;
}

/**
 * Build a fingerprint for node matching: componentType + normalised label.
 * Two nodes with the same component type and a similar label are considered
 * "the same logical component".
 */
function nodeKey(node: Node): string {
  return `${getComponentType(node)}::${getLabel(node).toLowerCase().trim()}`;
}

/**
 * Build a fingerprint for edge matching: source-component-type -> target-component-type.
 * We resolve source/target to their component types so renaming a node id
 * does not cause a false diff.
 */
function edgeKey(
  edge: Edge,
  nodeMap: Map<string, Node>,
): string {
  const srcNode = nodeMap.get(edge.source);
  const tgtNode = nodeMap.get(edge.target);
  const srcType = srcNode ? getComponentType(srcNode) : edge.source;
  const tgtType = tgtNode ? getComponentType(tgtNode) : edge.target;
  const srcLabel = srcNode ? getLabel(srcNode) : edge.source;
  const tgtLabel = tgtNode ? getLabel(tgtNode) : edge.target;
  return `${srcType}:${srcLabel}->${tgtType}:${tgtLabel}`;
}

function buildNodeMap(nodes: Node[]): Map<string, Node> {
  const map = new Map<string, Node>();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

function buildNodeKeyIndex(nodes: Node[]): Map<string, Node> {
  const map = new Map<string, Node>();
  for (const n of nodes) map.set(nodeKey(n), n);
  return map;
}

// ── Diff detection for a pair of matched nodes ──────────────

function diffNodeData(a: Node, b: Node): string[] {
  const changes: string[] = [];

  const dataA = a.data as NodeData;
  const dataB = b.data as NodeData;

  // Compare label
  if (getLabel(a) !== getLabel(b)) {
    changes.push(`Label: "${getLabel(a)}" -> "${getLabel(b)}"`);
  }

  // Compare component type
  if (getComponentType(a) !== getComponentType(b)) {
    changes.push(
      `Type: "${getComponentType(a)}" -> "${getComponentType(b)}"`,
    );
  }

  // Compare position (significant movement only, >20px)
  const dx = Math.abs((a.position?.x ?? 0) - (b.position?.x ?? 0));
  const dy = Math.abs((a.position?.y ?? 0) - (b.position?.y ?? 0));
  if (dx > 20 || dy > 20) {
    changes.push(`Position moved (dx:${Math.round(dx)}, dy:${Math.round(dy)})`);
  }

  // Compare config
  const cfgA = (dataA.config ?? {}) as Record<string, unknown>;
  const cfgB = (dataB.config ?? {}) as Record<string, unknown>;
  const allConfigKeys = new Set([
    ...Object.keys(cfgA),
    ...Object.keys(cfgB),
  ]);
  for (const key of allConfigKeys) {
    const valA = cfgA[key];
    const valB = cfgB[key];
    if (JSON.stringify(valA) !== JSON.stringify(valB)) {
      changes.push(`Config "${key}": ${JSON.stringify(valA)} -> ${JSON.stringify(valB)}`);
    }
  }

  // Compare category
  if (dataA.category !== dataB.category) {
    changes.push(
      `Category: "${String(dataA.category)}" -> "${String(dataB.category)}"`,
    );
  }

  return changes;
}

// ── Main diff function ──────────────────────────────────────

/**
 * Compare two architecture states (A = baseline, B = current) and return
 * a structured diff result describing added, removed, and modified
 * nodes and edges.
 */
export function diffArchitectures(
  nodesA: Node[],
  edgesA: Edge[],
  nodesB: Node[],
  edgesB: Edge[],
): DiffResult {
  const keyIndexA = buildNodeKeyIndex(nodesA);
  const keyIndexB = buildNodeKeyIndex(nodesB);
  const nodeMapA = buildNodeMap(nodesA);
  const nodeMapB = buildNodeMap(nodesB);

  // ── Node diff ──
  const addedNodes: string[] = [];
  const removedNodes: string[] = [];
  const modifiedNodes: Array<{ id: string; changes: string[] }> = [];
  const matchedKeysB = new Set<string>();

  for (const [key, nodeA] of keyIndexA) {
    const nodeB = keyIndexB.get(key);
    if (!nodeB) {
      removedNodes.push(getLabel(nodeA));
    } else {
      matchedKeysB.add(key);
      const changes = diffNodeData(nodeA, nodeB);
      if (changes.length > 0) {
        modifiedNodes.push({ id: getLabel(nodeB), changes });
      }
    }
  }

  for (const [key, nodeB] of keyIndexB) {
    if (!matchedKeysB.has(key)) {
      addedNodes.push(getLabel(nodeB));
    }
  }

  // ── Edge diff ──
  const edgeKeysA = new Set(edgesA.map((e) => edgeKey(e, nodeMapA)));
  const edgeKeysB = new Set(edgesB.map((e) => edgeKey(e, nodeMapB)));

  const addedEdges: string[] = [];
  const removedEdges: string[] = [];

  for (const ek of edgeKeysB) {
    if (!edgeKeysA.has(ek)) addedEdges.push(ek);
  }
  for (const ek of edgeKeysA) {
    if (!edgeKeysB.has(ek)) removedEdges.push(ek);
  }

  // ── Summary ──
  const summary: string[] = [];
  if (addedNodes.length > 0) {
    summary.push(`${addedNodes.length} node(s) added`);
  }
  if (removedNodes.length > 0) {
    summary.push(`${removedNodes.length} node(s) removed`);
  }
  if (modifiedNodes.length > 0) {
    summary.push(`${modifiedNodes.length} node(s) modified`);
  }
  if (addedEdges.length > 0) {
    summary.push(`${addedEdges.length} connection(s) added`);
  }
  if (removedEdges.length > 0) {
    summary.push(`${removedEdges.length} connection(s) removed`);
  }
  if (summary.length === 0) {
    summary.push('No differences found');
  }

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    summary,
  };
}
