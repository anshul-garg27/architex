// ─────────────────────────────────────────────────────────────
// Architex — Batch Zustand Updates
// ─────────────────────────────────────────────────────────────
//
// React 19 batches state updates automatically inside event handlers,
// but Zustand mutations triggered outside React (timers, websockets,
// async callbacks) still cause one render per `set()` call.
//
// `batchStoreUpdates` wraps multiple Zustand mutations so they
// coalesce into a single React render cycle.
//
// `loadDiagramBatched` is a concrete example: it sets nodes, edges,
// and groups in one atomic batch instead of three separate renders.
// ─────────────────────────────────────────────────────────────

import ReactDOM from 'react-dom';
import type { Node, Edge } from '@xyflow/react';
import { useCanvasStore, type NodeGroup } from '@/stores/canvas-store';

// ── Batch Wrapper ──────────────────────────────────────────

/**
 * Batches multiple Zustand store updates into a single React render.
 *
 * In React 19 event handlers already batch automatically.
 * This is needed when mutations happen *outside* the React event system
 * (e.g. WebSocket handlers, setTimeout callbacks, async operations).
 *
 * Uses `ReactDOM.flushSync` is intentionally avoided here — we want
 * to *defer* the render, not force it. Instead we leverage
 * `ReactDOM.unstable_batchedUpdates` when available, falling back to
 * synchronous execution (React 19 batches by default in most cases).
 */
export function batchStoreUpdates(updates: () => void): void {
  // React 18+/19 expose unstable_batchedUpdates on ReactDOM for
  // batching outside of React event handlers. If unavailable,
  // just invoke synchronously — React 19 auto-batches most paths.
  const batchFn =
    'unstable_batchedUpdates' in ReactDOM
      ? (ReactDOM as unknown as { unstable_batchedUpdates: (fn: () => void) => void })
          .unstable_batchedUpdates
      : undefined;

  if (batchFn) {
    batchFn(updates);
  } else {
    updates();
  }
}

// ── Diagram Payload ────────────────────────────────────────

export interface DiagramPayload {
  nodes: Node[];
  edges: Edge[];
  groups?: NodeGroup[];
}

// ── Load Diagram in One Batch ──────────────────────────────

/**
 * Loads a complete diagram (nodes + edges + optional groups) into
 * the canvas store in a single batched update, preventing multiple
 * intermediate renders.
 *
 * Without batching, calling `setNodes`, `setEdges`, and `addGroup`
 * individually would trigger three render cycles.
 */
export function loadDiagramBatched(diagram: DiagramPayload): void {
  batchStoreUpdates(() => {
    const store = useCanvasStore.getState();

    // Clear existing state first
    store.clearCanvas();

    // Set nodes and edges in one batch
    store.setNodes(diagram.nodes);
    store.setEdges(diagram.edges);

    // Add groups if present
    if (diagram.groups) {
      for (const group of diagram.groups) {
        store.addGroup(group);
      }
    }
  });
}
