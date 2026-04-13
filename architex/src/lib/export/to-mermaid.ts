import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData, EdgeType } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Mermaid Flowchart Export
// ─────────────────────────────────────────────────────────────

/**
 * Map a node's componentType / category to a Mermaid shape string.
 *
 * Databases  -> `[(label)]`  (cylindrical)
 * Queues     -> `>label]`    (asymmetric / flag)
 * Clients    -> `((label))`  (double-circle)
 * Services   -> `[label]`    (rectangle, default)
 */
function nodeShape(label: string, data: Record<string, unknown>): string {
  const component = String(data.componentType ?? '');
  const category = String(data.category ?? '');
  const safe = sanitize(label);

  // Database types
  if (
    category === 'storage' ||
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('mongo') ||
    component.includes('dynamo')
  ) {
    return `[(${safe})]`;
  }

  // Queue / messaging types
  if (
    category === 'messaging' ||
    component.includes('queue') ||
    component.includes('kafka') ||
    component.includes('sqs') ||
    component.includes('rabbit') ||
    component.includes('stream')
  ) {
    return `>${safe}]`;
  }

  // Client / user-facing types
  if (
    category === 'client' ||
    component.includes('client') ||
    component.includes('browser') ||
    component.includes('mobile')
  ) {
    return `((${safe}))`;
  }

  // Cache (stadium shape)
  if (
    component.includes('cache') ||
    component.includes('redis') ||
    component.includes('memcached')
  ) {
    return `([${safe}])`;
  }

  // Default: rectangle
  return `[${safe}]`;
}

/**
 * Map an edge type to a Mermaid arrow style.
 */
function arrowStyle(edgeType: string | undefined): string {
  const t = (edgeType ?? 'http') as EdgeType;
  switch (t) {
    case 'websocket':
      return '<-->';
    case 'message-queue':
    case 'event-stream':
      return '-.->';
    case 'replication':
      return '==>';
    default:
      // http, grpc, graphql, db-query, cache-lookup
      return '-->';
  }
}

/** Sanitize a label for safe inclusion in Mermaid syntax. */
function sanitize(label: string): string {
  // Mermaid is sensitive to special characters inside shapes.
  // Remove characters that break parsing, keep it human-readable.
  return label.replace(/[[\](){}<>|#&`";]/g, '').trim() || 'Node';
}

/** Build a stable Mermaid-safe identifier from a node id. */
function mermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Convert canvas nodes and edges to a Mermaid `graph LR` flowchart.
 */
export function exportToMermaid(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = ['graph LR'];

  // Node declarations
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    const label = data.label ?? node.id;
    const id = mermaidId(node.id);
    lines.push(`  ${id}${nodeShape(label, data)}`);
  }

  // Blank separator
  lines.push('');

  // Edge declarations
  for (const edge of edges) {
    const srcId = mermaidId(edge.source);
    const tgtId = mermaidId(edge.target);
    const data = (edge.data ?? {}) as Record<string, unknown>;
    const edgeType = String(data.edgeType ?? edge.type ?? 'http');
    const arrow = arrowStyle(edgeType);

    // Build optional label
    const labelParts: string[] = [];
    if (edgeType && edgeType !== 'default') {
      labelParts.push(edgeType.toUpperCase());
    }
    if (typeof data.latency === 'number') {
      labelParts.push(`${data.latency}ms`);
    }

    if (labelParts.length > 0) {
      const label = labelParts.map((p) => sanitize(p)).join(' ');
      lines.push(`  ${srcId} ${arrow}|${label}| ${tgtId}`);
    } else {
      lines.push(`  ${srcId} ${arrow} ${tgtId}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate Mermaid syntax and copy it to the clipboard.
 */
export async function copyMermaidToClipboard(
  nodes: Node[],
  edges: Edge[],
): Promise<void> {
  const mermaid = exportToMermaid(nodes, edges);
  await navigator.clipboard.writeText(mermaid);
}
