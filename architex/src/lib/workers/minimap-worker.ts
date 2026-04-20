/// <reference lib="webworker" />
// ─────────────────────────────────────────────────────────────
// Architex — OffscreenCanvas Minimap Worker (PER-014)
// ─────────────────────────────────────────────────────────────

// Type declaration for DedicatedWorkerGlobalScope (the lib reference above
// is not picked up by the project tsconfig since it targets DOM).
declare type DedicatedWorkerGlobalScope = typeof globalThis & {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => void) | null;
};
//
// Renders the minimap in an OffscreenCanvas on a Web Worker to
// avoid blocking the main thread. The worker receives node
// positions and dimensions, renders rectangles/dots for each
// node, and transfers an ImageBitmap back to the main thread.
//
// Protocol:
//   Main -> Worker:  MinimapRenderRequest
//   Worker -> Main:  MinimapRenderResponse (transferable ImageBitmap)
// ─────────────────────────────────────────────────────────────

// ── Message Types ────────────────────────────────────────────

export interface MinimapNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface MinimapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface MinimapRenderRequest {
  type: "render";
  nodes: MinimapNode[];
  viewport: MinimapViewport;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  viewportStrokeColor: string;
}

export interface MinimapRenderResponse {
  type: "rendered";
  bitmap: ImageBitmap;
}

// ── Constants ────────────────────────────────────────────────

const MIN_NODE_SIZE = 4;
const NODE_BORDER_RADIUS = 2;
const VIEWPORT_STROKE_WIDTH = 1.5;
const PADDING = 20;

// ── Render Logic ─────────────────────────────────────────────

/**
 * Compute the bounding box of all nodes, with padding.
 */
function computeBounds(nodes: MinimapNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    minX: minX - PADDING,
    minY: minY - PADDING,
    maxX: maxX + PADDING,
    maxY: maxY + PADDING,
  };
}

/**
 * Render the minimap into an OffscreenCanvas and return an
 * ImageBitmap that can be transferred to the main thread.
 */
export function renderMinimap(
  request: MinimapRenderRequest,
): ImageBitmap | null {
  const { nodes, viewport, canvasWidth, canvasHeight, backgroundColor, viewportStrokeColor } =
    request;

   
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Clear background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Compute world bounds and scale factor
  const bounds = computeBounds(nodes);
  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;

  if (worldWidth <= 0 || worldHeight <= 0) {
    return canvas.transferToImageBitmap();
  }

  const scaleX = canvasWidth / worldWidth;
  const scaleY = canvasHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Center the content
  const offsetX = (canvasWidth - worldWidth * scale) / 2;
  const offsetY = (canvasHeight - worldHeight * scale) / 2;

  // Transform helper: world coords -> canvas coords
  const toCanvas = (wx: number, wy: number): [number, number] => [
    (wx - bounds.minX) * scale + offsetX,
    (wy - bounds.minY) * scale + offsetY,
  ];

  // Draw nodes as rounded rectangles (or dots if too small)
  for (const node of nodes) {
    const [nx, ny] = toCanvas(node.x, node.y);
    const nw = Math.max(node.width * scale, MIN_NODE_SIZE);
    const nh = Math.max(node.height * scale, MIN_NODE_SIZE);

    ctx.fillStyle = node.color;

    if (nw < 6 || nh < 6) {
      // Draw as dot
      ctx.beginPath();
      ctx.arc(nx + nw / 2, ny + nh / 2, Math.max(nw, nh) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw as rounded rectangle
      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, nh, NODE_BORDER_RADIUS);
      ctx.fill();
    }
  }

  // Draw the viewport rectangle
  const [vx, vy] = toCanvas(
    -viewport.x / viewport.zoom,
    -viewport.y / viewport.zoom,
  );
  const vw = (viewport.width / viewport.zoom) * scale;
  const vh = (viewport.height / viewport.zoom) * scale;

  ctx.strokeStyle = viewportStrokeColor;
  ctx.lineWidth = VIEWPORT_STROKE_WIDTH;
  ctx.strokeRect(vx, vy, vw, vh);

  return canvas.transferToImageBitmap();
}

// ── Worker Message Handler ───────────────────────────────────

// Guard: only attach listener when running as a Web Worker
// (i.e. `self` is a DedicatedWorkerGlobalScope with onmessage)
const isWorkerContext =
  typeof self !== "undefined" &&
  typeof (self as DedicatedWorkerGlobalScope).postMessage === "function" &&
  typeof window === "undefined";

if (isWorkerContext) {
  self.onmessage = (event: MessageEvent<MinimapRenderRequest>) => {
    if (event.data.type !== "render") return;

    const bitmap = renderMinimap(event.data);
    if (bitmap) {
      const response: MinimapRenderResponse = { type: "rendered", bitmap };
      (self as DedicatedWorkerGlobalScope).postMessage(response, [bitmap]);
    }
  };
}
