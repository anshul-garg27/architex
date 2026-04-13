// ─────────────────────────────────────────────────────────────
// Architex — Web Worker Shared Message Types
// ─────────────────────────────────────────────────────────────

import type { NodeSimulationResult } from '@/lib/simulation/queuing-model';
import type { AlgorithmResult } from '@/lib/algorithms/types';
import type {
  LayoutAlgorithm,
  LayoutOptions,
} from '@/lib/layout/auto-layout';

// ── Generic Message Envelope ───────────────────────────────

/** Message sent from the main thread to a worker. */
export interface WorkerMessage<T = unknown> {
  type: string;
  payload: T;
  id: string;
}

/** Response sent from a worker back to the main thread. */
export interface WorkerResponse<T = unknown> {
  type: string;
  payload: T;
  id: string;
  error?: string;
}

// ── Simulation Worker Messages ─────────────────────────────

export const SIMULATE_TICK = 'SIMULATE_TICK' as const;

export interface SimulateTickPayload {
  /** Per-node configuration: arrival rates, service rates, server counts. */
  nodes: Array<{
    id: string;
    arrivalRate: number;
    serviceRate: number;
    serverCount: number;
  }>;
  /** Tick delta in milliseconds. */
  tickDelta: number;
}

export interface SimulateTickResult {
  /** Updated per-node simulation results keyed by node id. */
  nodeResults: Array<{
    id: string;
    metrics: NodeSimulationResult;
  }>;
  /** Tick timestamp in ms. */
  tickTimestamp: number;
}

export type SimulateTickMessage = WorkerMessage<SimulateTickPayload>;
export type SimulateTickResponse = WorkerResponse<SimulateTickResult>;

// ── Algorithm Worker Messages ──────────────────────────────

export const COMPUTE_ALGO_STEP = 'COMPUTE_ALGO_STEP' as const;

export interface ComputeAlgoPayload {
  /** Algorithm identifier, e.g. 'bubble-sort', 'dijkstra'. */
  algorithmName: string;
  /** Input data for the algorithm (array of numbers for sorting, etc.). */
  input: number[];
  /** Optional configuration overrides. */
  config?: Record<string, unknown>;
}

export interface ComputeAlgoResult {
  result: AlgorithmResult;
}

export type ComputeAlgoMessage = WorkerMessage<ComputeAlgoPayload>;
export type ComputeAlgoResponse = WorkerResponse<ComputeAlgoResult>;

// ── Layout Worker Messages ─────────────────────────────────

export const COMPUTE_LAYOUT = 'COMPUTE_LAYOUT' as const;

export interface ComputeLayoutPayload {
  /** Serialised nodes (position + measured dimensions). */
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
    measured?: { width?: number; height?: number };
  }>;
  /** Serialised edges (source -> target). */
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  /** Layout algorithm to use. */
  algorithm: LayoutAlgorithm;
  /** Optional layout options. */
  options?: LayoutOptions;
}

export interface ComputeLayoutResult {
  /** New node positions keyed by node id. */
  positions: Array<{ id: string; x: number; y: number }>;
}

export type ComputeLayoutMessage = WorkerMessage<ComputeLayoutPayload>;
export type ComputeLayoutResponse = WorkerResponse<ComputeLayoutResult>;

// ── Union Types ────────────────────────────────────────────

export type AnyWorkerMessage =
  | SimulateTickMessage
  | ComputeAlgoMessage
  | ComputeLayoutMessage;

export type AnyWorkerResponse =
  | SimulateTickResponse
  | ComputeAlgoResponse
  | ComputeLayoutResponse;
