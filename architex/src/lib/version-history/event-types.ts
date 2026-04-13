// ─────────────────────────────────────────────────────────────
// Architex — Diagram Versioning Event Types (INF-019/020)
// ─────────────────────────────────────────────────────────────
//
// Event-sourced diagram versioning. Every mutation to the canvas
// is captured as a typed event that can be replayed, rewound, or
// used to compute diffs between two points in time.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from "@xyflow/react";

// ── Event Discriminants ──────────────────────────────────────

export type DiagramEventType =
  | "NodeAdded"
  | "NodeRemoved"
  | "NodeMoved"
  | "NodeConfigChanged"
  | "EdgeAdded"
  | "EdgeRemoved"
  | "TemplateLoaded"
  | "SimulationRun";

// ── Event Data Payloads ──────────────────────────────────────

export interface NodeAddedData {
  node: Node;
}

export interface NodeRemovedData {
  nodeId: string;
  /** Snapshot of the removed node for potential undo. */
  node: Node;
}

export interface NodeMovedData {
  nodeId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface NodeConfigChangedData {
  nodeId: string;
  field: string;
  before: unknown;
  after: unknown;
}

export interface EdgeAddedData {
  edge: Edge;
}

export interface EdgeRemovedData {
  edgeId: string;
  /** Snapshot of the removed edge for potential undo. */
  edge: Edge;
}

export interface TemplateLoadedData {
  templateId: string;
  templateName: string;
  nodeCount: number;
  edgeCount: number;
}

export interface SimulationRunData {
  durationMs: number;
  ticks: number;
  finalThroughput: number;
  finalLatency: number;
}

// ── Event-Type-to-Data mapping ───────────────────────────────

export interface DiagramEventDataMap {
  NodeAdded: NodeAddedData;
  NodeRemoved: NodeRemovedData;
  NodeMoved: NodeMovedData;
  NodeConfigChanged: NodeConfigChangedData;
  EdgeAdded: EdgeAddedData;
  EdgeRemoved: EdgeRemovedData;
  TemplateLoaded: TemplateLoadedData;
  SimulationRun: SimulationRunData;
}

// ── Core Event Envelope ──────────────────────────────────────

/**
 * A single diagram event with a discriminated `type` field.
 * Generic over the event type for type-safe narrowing.
 */
export interface DiagramEvent<T extends DiagramEventType = DiagramEventType> {
  type: T;
  timestamp: number;
  data: DiagramEventDataMap[T];
  userId?: string;
}

// ── Helper: type-safe event constructors ─────────────────────

export function createDiagramEvent<T extends DiagramEventType>(
  type: T,
  data: DiagramEventDataMap[T],
  userId?: string,
): DiagramEvent<T> {
  return {
    type,
    timestamp: Date.now(),
    data,
    userId,
  };
}

// ── EventStore ───────────────────────────────────────────────

/**
 * In-memory append-only event store for diagram versioning.
 *
 * Events are stored in chronological order and can be queried
 * by timestamp range. The store has no upper bound on its own;
 * consumers (e.g. the history manager) are responsible for
 * periodic compaction via snapshots.
 */
export class EventStore {
  private events: DiagramEvent[] = [];

  /** Append a new event to the store. */
  append(event: DiagramEvent): void {
    this.events.push(event);
  }

  /**
   * Retrieve events, optionally filtered to those occurring
   * strictly after the given timestamp.
   */
  getEvents(since?: number): DiagramEvent[] {
    if (since === undefined) {
      return [...this.events];
    }
    return this.events.filter((e) => e.timestamp > since);
  }

  /** Return the total number of stored events. */
  getEventCount(): number {
    return this.events.length;
  }

  /** Return the most recent event, or `undefined` if empty. */
  getLatest(): DiagramEvent | undefined {
    return this.events.length > 0
      ? this.events[this.events.length - 1]
      : undefined;
  }

  /** Remove all events from the store. */
  clear(): void {
    this.events = [];
  }
}
