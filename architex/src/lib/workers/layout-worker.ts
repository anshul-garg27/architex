// ─────────────────────────────────────────────────────────────
// Architex — Layout Computation Web Worker
//
// Runs force-directed, hierarchical, circular, or grid layout
// computation off the main thread.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';
import { computeLayout } from '@/lib/layout/auto-layout';
import type {
  WorkerMessage,
  WorkerResponse,
  ComputeLayoutPayload,
  ComputeLayoutResult,
} from './types';
import { COMPUTE_LAYOUT } from './types';

/**
 * Reconstruct minimal Node/Edge objects from serialised payload,
 * run the layout algorithm, and serialise positions back.
 */
function handleComputeLayout(
  payload: ComputeLayoutPayload,
): ComputeLayoutResult {
  // Reconstruct minimal Node objects expected by computeLayout
  const nodes: Node[] = payload.nodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: {},
    ...(n.width != null ? { width: n.width } : {}),
    ...(n.height != null ? { height: n.height } : {}),
    ...(n.measured != null ? { measured: n.measured } : {}),
  }));

  const edges: Edge[] = payload.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));

  const result = computeLayout(
    nodes,
    edges,
    payload.algorithm,
    payload.options,
  );

  // Serialise Map to plain array for postMessage transfer
  const positions: Array<{ id: string; x: number; y: number }> = [];
  for (const [id, pos] of result.positions) {
    positions.push({ id, x: pos.x, y: pos.y });
  }

  return { positions };
}

// ── Worker message handler ─────────────────────────────────

// DedicatedWorkerGlobalScope is only available with the `webworker` lib,
// which conflicts with `dom`. Use a minimal local declaration instead.
declare const self: {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown): void;
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case COMPUTE_LAYOUT: {
        const result = handleComputeLayout(
          payload as ComputeLayoutPayload,
        );
        const response: WorkerResponse<ComputeLayoutResult> = {
          type: COMPUTE_LAYOUT,
          payload: result,
          id,
        };
        self.postMessage(response);
        break;
      }
      default: {
        const errorResponse: WorkerResponse<null> = {
          type,
          payload: null,
          id,
          error: `Unknown message type: ${type}`,
        };
        self.postMessage(errorResponse);
      }
    }
  } catch (err) {
    const errorResponse: WorkerResponse<null> = {
      type,
      payload: null,
      id,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorResponse);
  }
};
