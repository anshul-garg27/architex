import type { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────
// Excalidraw JSON Importer (IO-004)
// Imports Excalidraw JSON files into Architex canvas format.
// Parses rectangles/ellipses/diamonds as nodes, arrows as edges.
// Attempts to classify node types from text content.
// ─────────────────────────────────────────────────────────────

// ── Excalidraw Input Types ──────────────────────────────────

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  originalText?: string;
  containerId?: string | null;
  boundElements?: Array<{ id: string; type: string }> | null;
  points?: Array<[number, number]>;
  startBinding?: { elementId: string; focus: number; gap: number } | null;
  endBinding?: { elementId: string; focus: number; gap: number } | null;
  strokeColor?: string;
  backgroundColor?: string;
  strokeStyle?: string;
  [key: string]: unknown;
}

interface ExcalidrawFile {
  type?: string;
  elements: ExcalidrawElement[];
  appState?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Result from importing an Excalidraw file. */
export type ExcalidrawImportResult =
  | { ok: true; nodes: Node[]; edges: Edge[]; warnings: string[] }
  | { ok: false; error: string };

// ── Node Type Classification ────────────────────────────────

/**
 * Keyword-based classification of node text to Architex component types.
 * Returns [componentType, category, icon].
 */
function classifyFromText(
  text: string,
): [string, string, string] {
  const lower = text.toLowerCase().trim();

  // Database types
  if (
    lower.includes('database') ||
    lower.includes(' db') ||
    lower === 'db' ||
    lower.includes('postgres') ||
    lower.includes('mysql') ||
    lower.includes('mongo') ||
    lower.includes('dynamo') ||
    lower.includes('rds')
  ) {
    if (lower.includes('postgres')) return ['postgres-primary', 'storage', 'database'];
    if (lower.includes('mysql')) return ['mysql-primary', 'storage', 'database'];
    if (lower.includes('mongo')) return ['mongo-primary', 'storage', 'database'];
    if (lower.includes('dynamo')) return ['dynamodb', 'storage', 'database'];
    return ['database', 'storage', 'database'];
  }

  // Cache types
  if (
    lower.includes('cache') ||
    lower.includes('redis') ||
    lower.includes('memcached') ||
    lower.includes('elasticache')
  ) {
    if (lower.includes('redis')) return ['redis-cache', 'storage', 'database'];
    if (lower.includes('memcached')) return ['memcached', 'storage', 'database'];
    return ['cache', 'storage', 'database'];
  }

  // Load balancer types
  if (
    lower.includes('load balancer') ||
    lower.includes('lb') ||
    lower.includes('nginx') ||
    lower.includes('haproxy') ||
    lower.includes('elb') ||
    lower.includes('alb')
  ) {
    return ['load-balancer-l7', 'load-balancing', 'git-branch'];
  }

  // API Gateway types
  if (
    lower.includes('api gateway') ||
    lower.includes('api-gateway') ||
    lower.includes('gateway')
  ) {
    return ['api-gateway', 'load-balancing', 'git-branch'];
  }

  // Queue / messaging types
  if (
    lower.includes('queue') ||
    lower.includes('kafka') ||
    lower.includes('rabbitmq') ||
    lower.includes('sqs') ||
    lower.includes('pubsub') ||
    lower.includes('pub/sub') ||
    lower.includes('message broker')
  ) {
    if (lower.includes('kafka')) return ['kafka', 'messaging', 'mail'];
    if (lower.includes('rabbitmq')) return ['rabbitmq', 'messaging', 'mail'];
    if (lower.includes('sqs')) return ['sqs-queue', 'messaging', 'mail'];
    return ['message-queue', 'messaging', 'mail'];
  }

  // CDN types
  if (
    lower.includes('cdn') ||
    lower.includes('cloudfront') ||
    lower.includes('cloudflare')
  ) {
    return ['cdn', 'networking', 'cloud'];
  }

  // Storage types
  if (
    lower.includes('s3') ||
    lower.includes('blob') ||
    lower.includes('storage') ||
    lower.includes('bucket')
  ) {
    return ['object-storage', 'storage', 'hard-drive'];
  }

  // DNS types
  if (lower.includes('dns') || lower.includes('route53')) {
    return ['dns', 'networking', 'globe'];
  }

  // Client types
  if (
    lower.includes('client') ||
    lower.includes('browser') ||
    lower.includes('mobile') ||
    lower.includes('user') ||
    lower.includes('frontend')
  ) {
    return ['browser-client', 'client', 'monitor'];
  }

  // Firewall / security
  if (
    lower.includes('firewall') ||
    lower.includes('waf') ||
    lower.includes('rate limit')
  ) {
    return ['firewall', 'security', 'shield'];
  }

  // Worker / processing
  if (lower.includes('worker') || lower.includes('processor') || lower.includes('cron')) {
    return ['worker', 'processing', 'cpu'];
  }

  // Lambda / serverless
  if (lower.includes('lambda') || lower.includes('function') || lower.includes('serverless')) {
    return ['lambda-function', 'compute', 'zap'];
  }

  // Default — treat as generic app server
  if (
    lower.includes('server') ||
    lower.includes('service') ||
    lower.includes('api') ||
    lower.includes('app') ||
    lower.includes('backend')
  ) {
    return ['web-server', 'compute', 'server'];
  }

  return ['app-server', 'compute', 'server'];
}

// ── Shape Type Check ────────────────────────────────────────

const SHAPE_TYPES = new Set(['rectangle', 'ellipse', 'diamond']);
const ARROW_TYPES = new Set(['arrow', 'line']);

// ── Layout Constants ────────────────────────────────────────

const INVERSE_SCALE = 1 / 1.2;

// ── Public API ──────────────────────────────────────────────

/**
 * Parse an Excalidraw JSON file and convert shapes to Architex nodes
 * and arrows to edges.
 *
 * Shape elements (rectangle, ellipse, diamond) become nodes.
 * Arrow elements become edges, using their start/end bindings
 * to determine source and target nodes.
 */
export function importFromExcalidraw(
  input: ExcalidrawFile | string,
): ExcalidrawImportResult {
  // Parse string input
  let file: ExcalidrawFile;
  if (typeof input === 'string') {
    try {
      file = JSON.parse(input) as ExcalidrawFile;
    } catch (e) {
      return {
        ok: false,
        error: `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`,
      };
    }
  } else {
    file = input;
  }

  // Validate basic structure
  if (!file.elements || !Array.isArray(file.elements)) {
    return { ok: false, error: 'Missing or invalid "elements" array in Excalidraw file.' };
  }

  if (file.elements.length === 0) {
    return { ok: true, nodes: [], edges: [], warnings: ['Empty Excalidraw file — no elements found.'] };
  }

  const warnings: string[] = [];

  // Index elements by id for lookups
  const elementById = new Map<string, ExcalidrawElement>();
  for (const el of file.elements) {
    elementById.set(el.id, el);
  }

  // Build a map of containerId -> text content
  // (Excalidraw stores text as separate elements with containerId referencing the parent shape)
  const containerTextMap = new Map<string, string>();
  for (const el of file.elements) {
    if (el.type === 'text' && el.containerId) {
      const text = el.text ?? el.originalText ?? '';
      containerTextMap.set(el.containerId, text);
    }
  }

  // Also check for text in arrow labels
  const arrowLabelMap = new Map<string, string>();
  for (const el of file.elements) {
    if (el.type === 'text' && el.containerId) {
      const parent = elementById.get(el.containerId);
      if (parent && ARROW_TYPES.has(parent.type)) {
        arrowLabelMap.set(el.containerId, el.text ?? el.originalText ?? '');
      }
    }
  }

  // ── Build Nodes ────────────────────────────────────────────
  const nodes: Node[] = [];
  const excalIdToNodeId = new Map<string, string>();
  let nodeIndex = 0;

  for (const el of file.elements) {
    if (!SHAPE_TYPES.has(el.type)) continue;

    // Get label from bound text or from the element itself
    const label = containerTextMap.get(el.id) ?? el.text ?? el.originalText ?? '';
    if (!label) {
      // Shapes without any text label are likely decorative — skip with warning
      warnings.push(`Skipped unlabelled ${el.type} element at (${Math.round(el.x)}, ${Math.round(el.y)})`);
      continue;
    }

    const [componentType, category, icon] = classifyFromText(label);
    const nodeId = `excal-${el.id.slice(0, 8)}-${nodeIndex}`;
    excalIdToNodeId.set(el.id, nodeId);
    nodeIndex++;

    nodes.push({
      id: nodeId,
      type: 'system-design',
      position: {
        x: Math.round(el.x * INVERSE_SCALE),
        y: Math.round(el.y * INVERSE_SCALE),
      },
      data: {
        label: label.trim(),
        category,
        componentType,
        icon,
        config: {},
        state: 'idle',
      },
    });
  }

  // ── Build Edges ────────────────────────────────────────────
  const edges: Edge[] = [];
  let edgeIndex = 0;

  for (const el of file.elements) {
    if (!ARROW_TYPES.has(el.type)) continue;

    // Determine source and target from bindings
    const startId = el.startBinding?.elementId;
    const endId = el.endBinding?.elementId;

    if (!startId || !endId) {
      // Unbound arrows — try to find nearest shapes by proximity
      warnings.push(`Arrow ${el.id.slice(0, 8)} has no bindings — skipped.`);
      continue;
    }

    const sourceNodeId = excalIdToNodeId.get(startId);
    const targetNodeId = excalIdToNodeId.get(endId);

    if (!sourceNodeId || !targetNodeId) {
      warnings.push(
        `Arrow ${el.id.slice(0, 8)} references unknown shapes — skipped.`,
      );
      continue;
    }

    // Infer edge type from arrow label if available
    const arrowLabel = arrowLabelMap.get(el.id) ?? '';
    const edgeType = inferEdgeType(arrowLabel);

    edges.push({
      id: `excal-edge-${edgeIndex}`,
      source: sourceNodeId,
      target: targetNodeId,
      type: 'default',
      data: {
        edgeType,
        label: arrowLabel || edgeType,
      },
    });
    edgeIndex++;
  }

  return { ok: true, nodes, edges, warnings };
}

/**
 * Infer an Architex edge type from arrow label text.
 */
function inferEdgeType(label: string): string {
  const lower = label.toLowerCase().trim();
  if (lower.includes('grpc')) return 'grpc';
  if (lower.includes('graphql')) return 'graphql';
  if (lower.includes('websocket') || lower.includes('ws')) return 'websocket';
  if (lower.includes('queue') || lower.includes('async') || lower.includes('mq'))
    return 'message-queue';
  if (lower.includes('event') || lower.includes('stream'))
    return 'event-stream';
  if (lower.includes('replication') || lower.includes('replica'))
    return 'replication';
  if (lower.includes('sql') || lower.includes('query') || lower.includes('db'))
    return 'db-query';
  if (lower.includes('cache')) return 'cache-lookup';
  return 'http';
}

/**
 * Validate that an input looks like an Excalidraw file without fully parsing.
 */
export function isExcalidrawFile(input: unknown): boolean {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as Record<string, unknown>;
      return parsed.type === 'excalidraw' || Array.isArray(parsed.elements);
    } catch {
      return false;
    }
  }

  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    return obj.type === 'excalidraw' || Array.isArray(obj.elements);
  }

  return false;
}
