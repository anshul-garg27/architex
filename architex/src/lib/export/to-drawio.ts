import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData, EdgeType } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// draw.io (mxGraph) XML Export
// ─────────────────────────────────────────────────────────────

/** Scale factor to convert React Flow coordinates to draw.io coordinates. */
const SCALE = 1.5;

/** Default draw.io node dimensions. */
const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 80;

/** XML-escape a string for safe inclusion in attributes and text. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Shape Mapping ────────────────────────────────────────────

interface DrawioStyle {
  style: string;
  width: number;
  height: number;
}

/**
 * Map an Architex node's componentType / category to a draw.io style string.
 *
 *   service        -> rounded rectangle
 *   database       -> cylinder
 *   cache          -> hexagon
 *   queue          -> parallelogram
 *   load-balancer  -> diamond (rhombus)
 *   CDN            -> cloud shape
 */
function nodeToDrawioStyle(data: Record<string, unknown>): DrawioStyle {
  const component = String(data.componentType ?? '');
  const category = String(data.category ?? '');

  // Database types -> cylinder
  if (
    category === 'storage' ||
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('mongo') ||
    component.includes('dynamo')
  ) {
    return {
      style:
        'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#dae8fc;strokeColor=#6c8ebf;',
      width: 120,
      height: 100,
    };
  }

  // Cache types -> hexagon
  if (
    component.includes('cache') ||
    component.includes('redis') ||
    component.includes('memcached')
  ) {
    return {
      style:
        'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#e1d5e7;strokeColor=#9673a6;',
      width: 160,
      height: 80,
    };
  }

  // Queue / messaging types -> parallelogram
  if (
    category === 'messaging' ||
    component.includes('queue') ||
    component.includes('kafka') ||
    component.includes('sqs') ||
    component.includes('rabbit') ||
    component.includes('stream')
  ) {
    return {
      style:
        'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#fff2cc;strokeColor=#d6b656;',
      width: 160,
      height: 80,
    };
  }

  // Load balancer types -> diamond (rhombus)
  if (
    category === 'load-balancing' ||
    component.includes('load-balancer') ||
    component.includes('lb')
  ) {
    return {
      style:
        'rhombus;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
      width: 120,
      height: 120,
    };
  }

  // CDN types -> cloud
  if (component.includes('cdn') || component.includes('cloudfront')) {
    return {
      style:
        'ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
      width: 160,
      height: 100,
    };
  }

  // Client types -> ellipse
  if (
    category === 'client' ||
    component.includes('client') ||
    component.includes('browser') ||
    component.includes('mobile')
  ) {
    return {
      style:
        'ellipse;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;',
      width: 140,
      height: 80,
    };
  }

  // Default: service -> rounded rectangle
  return {
    style:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };
}

// ── Edge Style Mapping ───────────────────────────────────────

/**
 * Map an edge type to a draw.io edge style string.
 */
function edgeToDrawioStyle(edgeType: string | undefined): string {
  const t = (edgeType ?? 'http') as EdgeType;
  switch (t) {
    case 'websocket':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;startArrow=classic;startFill=1;strokeColor=#6c8ebf;dashed=0;';
    case 'message-queue':
    case 'event-stream':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=8 8;strokeColor=#d6b656;';
    case 'replication':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#82b366;';
    case 'grpc':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#9673a6;';
    case 'db-query':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#6c8ebf;dashed=1;dashPattern=4 4;';
    case 'cache-lookup':
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#9673a6;dashed=1;dashPattern=2 2;';
    default:
      // http, graphql, and fallback
      return 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#666666;';
  }
}

// ── Build edge label ─────────────────────────────────────────

function buildEdgeLabel(data: Record<string, unknown>): string {
  const parts: string[] = [];
  const edgeType = String(data.edgeType ?? '');
  if (edgeType && edgeType !== 'default') {
    parts.push(edgeType.toUpperCase());
  }
  if (typeof data.latency === 'number') {
    parts.push(`${data.latency}ms`);
  }
  return parts.join(' ');
}

// ── Metadata serialization ───────────────────────────────────

/**
 * Serialize node metadata (config, metrics, state) as draw.io
 * UserObject attributes for lossless round-tripping.
 */
function buildUserObjectAttrs(data: Record<string, unknown>): string {
  const attrs: string[] = [];

  if (data.componentType != null) {
    attrs.push(`architex_componentType="${escapeXml(String(data.componentType))}"`);
  }
  if (data.category != null) {
    attrs.push(`architex_category="${escapeXml(String(data.category))}"`);
  }
  if (data.icon != null) {
    attrs.push(`architex_icon="${escapeXml(String(data.icon))}"`);
  }
  if (data.state != null) {
    attrs.push(`architex_state="${escapeXml(String(data.state))}"`);
  }
  if (data.config != null) {
    try {
      attrs.push(`architex_config="${escapeXml(JSON.stringify(data.config))}"`);
    } catch {
      // Non-serializable config — skip
    }
  }
  if (data.metrics != null) {
    try {
      attrs.push(`architex_metrics="${escapeXml(JSON.stringify(data.metrics))}"`);
    } catch {
      // Non-serializable metrics — skip
    }
  }

  return attrs.join(' ');
}

// ── Public API ───────────────────────────────────────────────

/**
 * Export Architex canvas nodes and edges into a draw.io-compatible
 * mxGraphModel XML string.
 *
 * The output can be imported directly into draw.io / diagrams.net.
 */
export function exportToDrawio(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">');
  lines.push('  <root>');

  // draw.io requires two default cells: the root and default parent
  lines.push('    <mxCell id="0" />');
  lines.push('    <mxCell id="1" parent="0" />');

  // Cell id counter — start at 2 (0 and 1 are reserved)
  let cellId = 2;
  const nodeIdMap = new Map<string, number>();

  // ── Nodes ─────────────────────────────────────────────────
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    const label = escapeXml(data.label ?? node.id);
    const { style, width, height } = nodeToDrawioStyle(
      data as unknown as Record<string, unknown>,
    );

    const x = Math.round(node.position.x * SCALE);
    const y = Math.round(node.position.y * SCALE);
    const id = cellId++;
    nodeIdMap.set(node.id, id);

    const userAttrs = buildUserObjectAttrs(
      data as unknown as Record<string, unknown>,
    );

    lines.push(
      `    <UserObject label="${label}" ${userAttrs} id="${id}">`,
    );
    lines.push(
      `      <mxCell style="${escapeXml(style)}" vertex="1" parent="1">`,
    );
    lines.push(
      `        <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />`,
    );
    lines.push('      </mxCell>');
    lines.push('    </UserObject>');
  }

  // ── Edges ─────────────────────────────────────────────────
  for (const edge of edges) {
    const sourceCell = nodeIdMap.get(edge.source);
    const targetCell = nodeIdMap.get(edge.target);
    if (sourceCell == null || targetCell == null) continue;

    const data = (edge.data ?? {}) as Record<string, unknown>;
    const edgeType = String(data.edgeType ?? edge.type ?? 'http');
    const style = edgeToDrawioStyle(edgeType);
    const label = escapeXml(buildEdgeLabel(data));
    const id = cellId++;

    const edgeAttrs: string[] = [];
    if (edgeType && edgeType !== 'default') {
      edgeAttrs.push(`architex_edgeType="${escapeXml(edgeType)}"`);
    }
    if (typeof data.latency === 'number') {
      edgeAttrs.push(`architex_latency="${data.latency}"`);
    }
    if (typeof data.bandwidth === 'number') {
      edgeAttrs.push(`architex_bandwidth="${data.bandwidth}"`);
    }

    const userAttrStr = edgeAttrs.length > 0 ? ' ' + edgeAttrs.join(' ') : '';

    lines.push(
      `    <UserObject label="${label}"${userAttrStr} id="${id}">`,
    );
    lines.push(
      `      <mxCell style="${escapeXml(style)}" edge="1" parent="1" source="${sourceCell}" target="${targetCell}">`,
    );
    lines.push(
      '        <mxGeometry relative="1" as="geometry" />',
    );
    lines.push('      </mxCell>');
    lines.push('    </UserObject>');
  }

  lines.push('  </root>');
  lines.push('</mxGraphModel>');

  return lines.join('\n');
}

/**
 * Export draw.io XML and trigger a browser download.
 */
export function downloadDrawio(
  nodes: Node[],
  edges: Edge[],
  filename?: string,
): void {
  const xml = exportToDrawio(nodes, edges);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? 'architex-diagram.drawio';
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
