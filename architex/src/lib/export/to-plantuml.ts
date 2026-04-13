import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData, EdgeType } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// PlantUML Component Diagram Export
// ─────────────────────────────────────────────────────────────

/**
 * Map a node's category / componentType to a PlantUML component keyword.
 */
function pumlComponentType(data: Record<string, unknown>): string {
  const component = String(data.componentType ?? '');
  const category = String(data.category ?? '');

  if (
    category === 'storage' ||
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('mongo') ||
    component.includes('dynamo')
  ) {
    return 'database';
  }

  if (
    category === 'messaging' ||
    component.includes('queue') ||
    component.includes('kafka') ||
    component.includes('sqs') ||
    component.includes('rabbit') ||
    component.includes('stream')
  ) {
    return 'queue';
  }

  if (
    category === 'client' ||
    component.includes('client') ||
    component.includes('browser') ||
    component.includes('mobile')
  ) {
    return 'actor';
  }

  if (
    component.includes('cdn') ||
    component.includes('cloudfront')
  ) {
    return 'cloud';
  }

  if (
    category === 'networking' ||
    component.includes('gateway') ||
    component.includes('load-balancer') ||
    component.includes('lb')
  ) {
    return 'boundary';
  }

  if (
    component.includes('cache') ||
    component.includes('redis') ||
    component.includes('memcached')
  ) {
    return 'storage';
  }

  // Default: generic component
  return 'component';
}

/**
 * Map an edge type to a PlantUML relationship arrow.
 */
function pumlArrow(edgeType: string | undefined): string {
  const t = (edgeType ?? 'http') as EdgeType;
  switch (t) {
    case 'websocket':
      return '<-->';
    case 'message-queue':
    case 'event-stream':
      return '..>';
    case 'replication':
      return '==>';
    case 'grpc':
      return '-->>';
    default:
      return '-->';
  }
}

/** Make a PlantUML-safe identifier. */
function pumlId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/** Sanitize label for PlantUML strings. */
function sanitize(label: string): string {
  return label.replace(/"/g, "'");
}

/**
 * Convert canvas nodes and edges to a PlantUML component diagram.
 */
export function exportToPlantUML(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = [
    '@startuml',
    "skinparam componentStyle rectangle",
    '',
  ];

  // Component declarations
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    const label = sanitize(data.label ?? node.id);
    const id = pumlId(node.id);
    const kind = pumlComponentType(data);
    lines.push(`${kind} "${label}" as ${id}`);
  }

  lines.push('');

  // Relationships
  for (const edge of edges) {
    const srcId = pumlId(edge.source);
    const tgtId = pumlId(edge.target);
    const data = (edge.data ?? {}) as Record<string, unknown>;
    const edgeType = String(data.edgeType ?? edge.type ?? 'http');
    const arrow = pumlArrow(edgeType);

    // Build label
    const labelParts: string[] = [];
    if (edgeType && edgeType !== 'default') {
      labelParts.push(edgeType.toUpperCase());
    }
    if (typeof data.latency === 'number') {
      labelParts.push(`${data.latency}ms`);
    }

    const label = labelParts.length > 0 ? sanitize(labelParts.join(' ')) : '';

    if (label) {
      lines.push(`${srcId} ${arrow} ${tgtId} : ${label}`);
    } else {
      lines.push(`${srcId} ${arrow} ${tgtId}`);
    }
  }

  lines.push('');
  lines.push('@enduml');

  return lines.join('\n');
}

/**
 * Generate PlantUML and copy to clipboard.
 */
export async function copyPlantUMLToClipboard(
  nodes: Node[],
  edges: Edge[],
): Promise<void> {
  const puml = exportToPlantUML(nodes, edges);
  await navigator.clipboard.writeText(puml);
}
