import type { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────
// draw.io (mxGraph) XML Import
// ─────────────────────────────────────────────────────────────

/** Inverse scale factor to convert draw.io coordinates back to React Flow. */
const INV_SCALE = 1 / 1.5;

export type DrawioImportResult =
  | { nodes: Node[]; edges: Edge[] }
  | { error: string };

// ── Shape-to-type mapping ────────────────────────────────────

/**
 * Infer Architex componentType and category from a draw.io mxCell style string.
 */
function inferNodeType(style: string): {
  componentType: string;
  category: string;
} {
  const s = style.toLowerCase();

  if (s.includes('cylinder') || s.includes('shape=cylinder')) {
    return { componentType: 'database', category: 'storage' };
  }
  if (s.includes('hexagon')) {
    return { componentType: 'cache', category: 'storage' };
  }
  if (
    s.includes('parallelogram') ||
    s.includes('shape=parallelogram')
  ) {
    return { componentType: 'message-queue', category: 'messaging' };
  }
  if (s.includes('rhombus') || s.includes('shape=rhombus')) {
    return { componentType: 'load-balancer', category: 'load-balancing' };
  }
  if (s.includes('cloud') || s.includes('shape=cloud')) {
    return { componentType: 'cdn', category: 'networking' };
  }
  if (s.includes('ellipse') && !s.includes('cloud')) {
    return { componentType: 'client', category: 'client' };
  }

  // Default: service / compute (rounded rectangle or any other shape)
  return { componentType: 'web-server', category: 'compute' };
}

/**
 * Infer Architex edge type from draw.io edge style attributes.
 */
function inferEdgeType(style: string): string {
  const s = style.toLowerCase();

  // Bidirectional arrow -> websocket
  if (s.includes('startarrow=classic') && s.includes('startfill=1')) {
    return 'websocket';
  }
  // Thick dashed with green -> replication
  if (s.includes('strokewidth=2') && s.includes('82b366')) {
    return 'replication';
  }
  // Dashed with yellow -> message-queue
  if (s.includes('dashed=1') && s.includes('d6b656')) {
    return 'message-queue';
  }
  // Dashed with blue -> db-query
  if (s.includes('dashed=1') && s.includes('6c8ebf')) {
    return 'db-query';
  }
  // Purple -> grpc
  if (s.includes('9673a6') && !s.includes('dashed=1')) {
    return 'grpc';
  }
  // Purple dashed -> cache-lookup
  if (s.includes('9673a6') && s.includes('dashed=1')) {
    return 'cache-lookup';
  }

  return 'http';
}

/**
 * Get an attribute value from an element, returning undefined if not present.
 */
function getAttr(el: Element, name: string): string | undefined {
  const val = el.getAttribute(name);
  return val != null ? val : undefined;
}

/**
 * Try to parse a JSON string, returning undefined on failure.
 */
function tryParseJSON(str: string | undefined): Record<string, unknown> | undefined {
  if (str == null) return undefined;
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Parse a draw.io mxGraphModel XML string into Architex nodes and edges.
 *
 * Supports:
 * - Standard mxCell elements with vertex/edge attributes
 * - UserObject wrappers (with Architex metadata attributes)
 * - Groups/containers (flattened — children inherit parent offset)
 *
 * Returns `{ nodes, edges }` on success, or `{ error }` with a
 * human-readable message on failure.
 */
export function importFromDrawio(xml: string): DrawioImportResult {
  // ── 1. Parse XML ──────────────────────────────────────────
  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xml, 'application/xml');
  } catch {
    return { error: 'Failed to parse XML.' };
  }

  // Check for parser errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return {
      error: `Malformed XML: ${parserError.textContent?.slice(0, 200) ?? 'parse error'}`,
    };
  }

  // ── 2. Locate root ────────────────────────────────────────
  const mxGraphModel = doc.querySelector('mxGraphModel');
  if (!mxGraphModel) {
    return { error: 'Not a valid draw.io file: missing <mxGraphModel> element.' };
  }

  const rootEl = mxGraphModel.querySelector('root');
  if (!rootEl) {
    return { error: 'Not a valid draw.io file: missing <root> element.' };
  }

  // ── 3. Collect cells ──────────────────────────────────────
  // draw.io stores data either as <mxCell> directly or wrapped in <UserObject>
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Map draw.io cell ids to our node ids for edge source/target resolution
  const cellToNodeId = new Map<string, string>();

  // Track parent cells for group/container offset calculation
  const parentGeometry = new Map<
    string,
    { x: number; y: number }
  >();

  // First pass: collect geometry of all parent cells
  const allCells = rootEl.querySelectorAll('mxCell');
  for (const cell of Array.from(allCells)) {
    const id = cell.getAttribute('id');
    if (id == null) continue;

    const geo = cell.querySelector('mxGeometry');
    if (geo) {
      parentGeometry.set(id, {
        x: parseFloat(geo.getAttribute('x') ?? '0'),
        y: parseFloat(geo.getAttribute('y') ?? '0'),
      });
    }
  }

  // Second pass: also collect UserObject-wrapped cells
  const allUserObjects = rootEl.querySelectorAll('UserObject');
  for (const uo of Array.from(allUserObjects)) {
    const cell = uo.querySelector('mxCell');
    if (!cell) continue;
    const id = uo.getAttribute('id');
    if (id == null) continue;

    const geo = cell.querySelector('mxGeometry');
    if (geo) {
      parentGeometry.set(id, {
        x: parseFloat(geo.getAttribute('x') ?? '0'),
        y: parseFloat(geo.getAttribute('y') ?? '0'),
      });
    }
  }

  // ── 4. Process nodes and edges ─────────────────────────────
  // Helper to get the resolved parent offset for a cell
  function getParentOffset(parentId: string | undefined): {
    x: number;
    y: number;
  } {
    if (parentId == null || parentId === '0' || parentId === '1') {
      return { x: 0, y: 0 };
    }
    const geo = parentGeometry.get(parentId);
    return geo ?? { x: 0, y: 0 };
  }

  // Process a cell+wrapper pair (wrapper is the UserObject or the mxCell itself)
  function processCell(
    wrapper: Element,
    cell: Element,
  ): void {
    const id = wrapper.getAttribute('id');
    if (id == null || id === '0' || id === '1') return;

    const isVertex = cell.getAttribute('vertex') === '1';
    const isEdge = cell.getAttribute('edge') === '1';
    const style = cell.getAttribute('style') ?? '';

    if (isVertex) {
      const geo = cell.querySelector('mxGeometry');
      const rawX = parseFloat(geo?.getAttribute('x') ?? '0');
      const rawY = parseFloat(geo?.getAttribute('y') ?? '0');

      // Apply parent offset for grouped/contained nodes
      const parentId = cell.getAttribute('parent') ?? undefined;
      const offset = getParentOffset(parentId);

      const x = Math.round((rawX + offset.x) * INV_SCALE);
      const y = Math.round((rawY + offset.y) * INV_SCALE);

      // Extract label
      const label =
        wrapper.getAttribute('label') ??
        cell.getAttribute('value') ??
        `Node ${id}`;

      // Check for Architex metadata on UserObject
      const architexComponent = getAttr(wrapper, 'architex_componentType');
      const architexCategory = getAttr(wrapper, 'architex_category');
      const architexIcon = getAttr(wrapper, 'architex_icon');
      const architexState = getAttr(wrapper, 'architex_state');
      const architexConfig = tryParseJSON(
        getAttr(wrapper, 'architex_config'),
      );
      const architexMetrics = tryParseJSON(
        getAttr(wrapper, 'architex_metrics'),
      );

      // Determine node type — prefer Architex metadata, fall back to style inference
      const inferred = inferNodeType(style);
      const componentType = architexComponent ?? inferred.componentType;
      const category = architexCategory ?? inferred.category;

      const nodeId = `drawio-${id}`;
      cellToNodeId.set(id, nodeId);

      const data: Record<string, unknown> = {
        label,
        category,
        componentType,
        icon: architexIcon ?? 'box',
        config: architexConfig ?? {},
        state: architexState ?? 'idle',
      };
      if (architexMetrics) {
        data.metrics = architexMetrics;
      }

      nodes.push({
        id: nodeId,
        type: 'system-design',
        position: { x, y },
        data,
      });
    } else if (isEdge) {
      const sourceId = cell.getAttribute('source');
      const targetId = cell.getAttribute('target');
      if (sourceId == null || targetId == null) return;

      // Extract label and metadata
      const label =
        wrapper.getAttribute('label') ??
        cell.getAttribute('value') ??
        '';

      // Check for Architex edge metadata
      const architexEdgeType = getAttr(wrapper, 'architex_edgeType');
      const architexLatency = getAttr(wrapper, 'architex_latency');
      const architexBandwidth = getAttr(wrapper, 'architex_bandwidth');

      const edgeType = architexEdgeType ?? inferEdgeType(style);

      const edgeId = `drawio-edge-${id}`;

      const edgeData: Record<string, unknown> = {
        edgeType,
      };
      if (architexLatency != null) {
        edgeData.latency = parseFloat(architexLatency);
      }
      if (architexBandwidth != null) {
        edgeData.bandwidth = parseFloat(architexBandwidth);
      }
      if (label) {
        edgeData.label = label;
      }

      edges.push({
        id: edgeId,
        source: `drawio-${sourceId}`,
        target: `drawio-${targetId}`,
        type: 'default',
        data: edgeData,
      });
    }
  }

  // Process standalone <mxCell> elements (not inside UserObject)
  for (const cell of Array.from(allCells)) {
    // Skip cells that are children of a UserObject — they'll be processed via the UserObject
    if (cell.parentElement?.tagName === 'UserObject') continue;
    processCell(cell, cell);
  }

  // Process <UserObject> wrapped cells
  for (const uo of Array.from(allUserObjects)) {
    const cell = uo.querySelector('mxCell');
    if (!cell) continue;
    processCell(uo, cell);
  }

  return { nodes, edges };
}
