// ─────────────────────────────────────────────────────────────
// Architex — Simulation Web Worker
//
// Runs queuing model calculations off the main thread.
// Does NOT import from stores — only pure simulation functions.
// ─────────────────────────────────────────────────────────────

import { simulateNode } from '@/lib/simulation/queuing-model';
import type {
  WorkerMessage,
  WorkerResponse,
  SimulateTickPayload,
  SimulateTickResult,
} from './types';
import { SIMULATE_TICK } from './types';

/**
 * Process a single simulation tick: run the queuing model for every
 * node and return updated metrics.
 */
function handleSimulateTick(
  payload: SimulateTickPayload,
): SimulateTickResult {
  const nodeResults = payload.nodes.map((node) => {
    const metrics = simulateNode(
      node.arrivalRate,
      node.serviceRate,
      node.serverCount,
    );
    return { id: node.id, metrics };
  });

  return {
    nodeResults,
    tickTimestamp: Date.now(),
  };
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
      case SIMULATE_TICK: {
        const result = handleSimulateTick(
          payload as SimulateTickPayload,
        );
        const response: WorkerResponse<SimulateTickResult> = {
          type: SIMULATE_TICK,
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
