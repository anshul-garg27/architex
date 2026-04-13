import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Excalidraw JSON Exporter (IO-003)
// Exports React Flow diagrams to Excalidraw JSON format.
// Maps nodes to styled rectangles with text, edges to arrows.
// ─────────────────────────────────────────────────────────────

// ── Excalidraw Types (minimal subset) ───────────────────────

interface ExcalidrawElementBase {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: 'hachure' | 'cross-hatch' | 'solid';
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  opacity: number;
  groupIds: string[];
  roundness: { type: number; value?: number } | null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: Array<{ id: string; type: 'arrow' | 'text' }> | null;
  updated: number;
  link: string | null;
  locked: boolean;
}

interface ExcalidrawRectangle extends ExcalidrawElementBase {
  type: 'rectangle';
}

interface ExcalidrawEllipse extends ExcalidrawElementBase {
  type: 'ellipse';
}

interface ExcalidrawDiamond extends ExcalidrawElementBase {
  type: 'diamond';
}

interface ExcalidrawText extends ExcalidrawElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  containerId: string | null;
  originalText: string;
  autoResize: boolean;
  lineHeight: number;
}

interface ExcalidrawArrow extends ExcalidrawElementBase {
  type: 'arrow';
  points: Array<[number, number]>;
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
  startArrowhead: string | null;
  endArrowhead: 'arrow' | 'triangle' | null;
  lastCommittedPoint: [number, number] | null;
}

type ExcalidrawElement =
  | ExcalidrawRectangle
  | ExcalidrawEllipse
  | ExcalidrawDiamond
  | ExcalidrawText
  | ExcalidrawArrow;

/** Full Excalidraw scene data. */
export interface ExcalidrawData {
  type: 'excalidraw';
  version: 2;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    viewBackgroundColor: string;
    gridSize: number | null;
  };
  files: Record<string, never>;
}

// ── Constants ───────────────────────────────────────────────

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const SCALE = 1.2;
const FONT_SIZE = 16;
const ARROW_GAP = 4;

// ── Colour Mapping ──────────────────────────────────────────

interface NodeStyle {
  shape: 'rectangle' | 'ellipse' | 'diamond';
  backgroundColor: string;
  strokeColor: string;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  width: number;
  height: number;
}

function getNodeStyle(data: SystemDesignNodeData): NodeStyle {
  const component = data.componentType ?? '';
  const category = data.category ?? 'compute';

  // Database types — cylinder approximated with ellipse
  if (
    category === 'storage' ||
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('mongo')
  ) {
    return {
      shape: 'ellipse',
      backgroundColor: '#a5d8ff',
      strokeColor: '#1971c2',
      strokeStyle: 'solid',
      width: 180,
      height: 100,
    };
  }

  // Cache types
  if (component.includes('cache') || component.includes('redis') || component.includes('memcached')) {
    return {
      shape: 'diamond',
      backgroundColor: '#d0bfff',
      strokeColor: '#6741d9',
      strokeStyle: 'solid',
      width: 160,
      height: 120,
    };
  }

  // Queue / messaging types
  if (
    category === 'messaging' ||
    component.includes('queue') ||
    component.includes('kafka') ||
    component.includes('sqs')
  ) {
    return {
      shape: 'rectangle',
      backgroundColor: '#ffec99',
      strokeColor: '#e8590c',
      strokeStyle: 'dashed',
      width: 200,
      height: 80,
    };
  }

  // Load balancer / gateway
  if (
    component.includes('load-balancer') ||
    component.includes('lb') ||
    component.includes('gateway')
  ) {
    return {
      shape: 'diamond',
      backgroundColor: '#b2f2bb',
      strokeColor: '#2f9e44',
      strokeStyle: 'solid',
      width: 160,
      height: 120,
    };
  }

  // Client types
  if (
    category === 'client' ||
    component.includes('client') ||
    component.includes('browser') ||
    component.includes('mobile')
  ) {
    return {
      shape: 'ellipse',
      backgroundColor: '#ffd8a8',
      strokeColor: '#e8590c',
      strokeStyle: 'solid',
      width: 160,
      height: 100,
    };
  }

  // CDN / networking
  if (component.includes('cdn') || component.includes('cloudfront')) {
    return {
      shape: 'ellipse',
      backgroundColor: '#ffc9c9',
      strokeColor: '#c92a2a',
      strokeStyle: 'solid',
      width: 180,
      height: 100,
    };
  }

  // Default service — rectangle
  return {
    shape: 'rectangle',
    backgroundColor: '#a5d8ff',
    strokeColor: '#1971c2',
    strokeStyle: 'solid',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
}

// ── Pseudo-Random Seed ──────────────────────────────────────

let seedCounter = 1;

function nextSeed(): number {
  return seedCounter++;
}

function nextId(): string {
  return `excal_${seedCounter++}_${Date.now().toString(36)}`;
}

// ── Element Builders ────────────────────────────────────────

function makeBaseElement(
  id: string,
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: Partial<ExcalidrawElementBase>,
): ExcalidrawElementBase {
  return {
    id,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: style.strokeColor ?? '#1e1e1e',
    backgroundColor: style.backgroundColor ?? 'transparent',
    fillStyle: 'solid',
    strokeWidth: style.strokeWidth ?? 2,
    strokeStyle: (style.strokeStyle as 'solid' | 'dashed' | 'dotted') ?? 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: type === 'rectangle' ? { type: 3 } : type === 'ellipse' ? { type: 2 } : null,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function makeTextElement(
  text: string,
  containerId: string,
  x: number,
  y: number,
  width: number,
  height: number,
): ExcalidrawText {
  const base = makeBaseElement(
    nextId(),
    'text',
    x,
    y,
    width,
    height,
    { strokeColor: '#1e1e1e', backgroundColor: 'transparent' },
  );

  return {
    ...base,
    type: 'text',
    text,
    fontSize: FONT_SIZE,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  } as ExcalidrawText;
}

function getEdgeStrokeStyle(
  edgeType: string,
): { strokeStyle: 'solid' | 'dashed' | 'dotted'; strokeColor: string } {
  switch (edgeType) {
    case 'websocket':
      return { strokeStyle: 'solid', strokeColor: '#1971c2' };
    case 'message-queue':
    case 'event-stream':
      return { strokeStyle: 'dashed', strokeColor: '#e8590c' };
    case 'replication':
      return { strokeStyle: 'dotted', strokeColor: '#2f9e44' };
    case 'grpc':
      return { strokeStyle: 'solid', strokeColor: '#6741d9' };
    case 'db-query':
      return { strokeStyle: 'dashed', strokeColor: '#1971c2' };
    case 'cache-lookup':
      return { strokeStyle: 'dotted', strokeColor: '#6741d9' };
    default:
      return { strokeStyle: 'solid', strokeColor: '#1e1e1e' };
  }
}

// ── Public API ──────────────────────────────────────────────

/**
 * Export React Flow nodes and edges to Excalidraw JSON format.
 *
 * Nodes are mapped to styled shapes (rectangles, ellipses, diamonds)
 * based on their component type. Edges become arrows with bindings.
 */
export function exportToExcalidraw(
  nodes: Node[],
  edges: Edge[],
): ExcalidrawData {
  // Reset seed counter for deterministic output in tests
  seedCounter = 1;

  const elements: ExcalidrawElement[] = [];
  const nodeIdToExcalId = new Map<string, string>();
  const nodePositions = new Map<
    string,
    { x: number; y: number; width: number; height: number }
  >();

  // ── Create shape + text elements for each node ───────────
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    const label = data.label ?? node.id;
    const style = getNodeStyle(data);

    const x = node.position.x * SCALE;
    const y = node.position.y * SCALE;
    const { width, height } = style;

    const shapeId = nextId();
    nodeIdToExcalId.set(node.id, shapeId);
    nodePositions.set(node.id, { x, y, width, height });

    // Create the text element
    const textId = nextId();
    const textEl = makeTextElement(
      label,
      shapeId,
      x + width / 4,
      y + height / 4,
      width / 2,
      height / 2,
    );

    // Create the shape element with bound text reference
    const shapeBase = makeBaseElement(shapeId, style.shape, x, y, width, height, {
      strokeColor: style.strokeColor,
      backgroundColor: style.backgroundColor,
      strokeStyle: style.strokeStyle,
    });

    const shapeEl = {
      ...shapeBase,
      type: style.shape,
      boundElements: [{ id: textId, type: 'text' as const }],
    };

    // Override the auto-generated text id with our tracked one
    textEl.id = textId;

    elements.push(shapeEl as ExcalidrawElement);
    elements.push(textEl);
  }

  // ── Create arrow elements for each edge ──────────────────
  for (const edge of edges) {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    const sourceExcalId = nodeIdToExcalId.get(edge.source);
    const targetExcalId = nodeIdToExcalId.get(edge.target);

    if (!sourcePos || !targetPos || !sourceExcalId || !targetExcalId) continue;

    const data = (edge.data ?? {}) as Record<string, unknown>;
    const edgeType = String(data.edgeType ?? edge.type ?? 'http');
    const edgeStyle = getEdgeStrokeStyle(edgeType);

    // Arrow starts from the right centre of source
    const startX = sourcePos.x + sourcePos.width;
    const startY = sourcePos.y + sourcePos.height / 2;
    // Arrow ends at the left centre of target
    const endX = targetPos.x;
    const endY = targetPos.y + targetPos.height / 2;

    const dx = endX - startX;
    const dy = endY - startY;

    const arrowId = nextId();
    const arrowBase = makeBaseElement(
      arrowId,
      'arrow',
      startX,
      startY,
      Math.abs(dx),
      Math.abs(dy),
      {
        strokeColor: edgeStyle.strokeColor,
        strokeStyle: edgeStyle.strokeStyle,
      },
    );

    const arrow: ExcalidrawArrow = {
      ...arrowBase,
      type: 'arrow',
      points: [
        [0, 0],
        [dx, dy],
      ],
      startBinding: {
        elementId: sourceExcalId,
        focus: 0,
        gap: ARROW_GAP,
      },
      endBinding: {
        elementId: targetExcalId,
        focus: 0,
        gap: ARROW_GAP,
      },
      startArrowhead: null,
      endArrowhead: 'arrow',
      lastCommittedPoint: null,
    };

    // Add arrow reference to both bound shapes
    const sourceShape = elements.find((e) => e.id === sourceExcalId);
    const targetShape = elements.find((e) => e.id === targetExcalId);

    if (sourceShape?.boundElements) {
      sourceShape.boundElements.push({ id: arrowId, type: 'arrow' });
    }
    if (targetShape?.boundElements) {
      targetShape.boundElements.push({ id: arrowId, type: 'arrow' });
    }

    elements.push(arrow);

    // Add edge label as text if there is meaningful protocol info
    if (edgeType && edgeType !== 'default' && edgeType !== 'http') {
      const labelText = edgeType.toUpperCase();
      const labelX = startX + dx / 2 - 30;
      const labelY = startY + dy / 2 - 10;
      const labelEl = makeTextElement(labelText, arrowId, labelX, labelY, 60, 20);
      labelEl.fontSize = 12;
      elements.push(labelEl);
    }
  }

  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://architex.dev',
    elements,
    appState: {
      viewBackgroundColor: '#ffffff',
      gridSize: null,
    },
    files: {},
  };
}

/**
 * Export to Excalidraw and return as a JSON string.
 */
export function exportToExcalidrawJSON(
  nodes: Node[],
  edges: Edge[],
): string {
  const data = exportToExcalidraw(nodes, edges);
  return JSON.stringify(data, null, 2);
}
