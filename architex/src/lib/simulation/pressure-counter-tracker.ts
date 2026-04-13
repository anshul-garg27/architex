/**
 * Pressure Counter Tracker
 *
 * Applies chaos event pressure effects to per-node pressure counters.
 * Integrates into the SimulationOrchestrator tick pipeline after the
 * chaos modifier stage.
 *
 * Each node has 35 pressure counters (cpu, memory, disk, network, etc.).
 * Chaos events declare which counters they affect and by how much.
 * The tracker accumulates these effects, decays counters over time,
 * and reports when counters exceed their thresholds.
 */

import type { PressureCounterName, PressureCounterEffect } from './chaos-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Thresholds for each pressure counter (above = exceeded). */
const PRESSURE_THRESHOLDS: Record<PressureCounterName, number> = {
  cpu: 80,
  memory: 85,
  disk: 90,
  network: 75,
  connections: 80,
  threads: 80,
  fileDescriptors: 80,
  iops: 85,
  bandwidth: 80,
  queueDepth: 70,
  cacheEvictions: 60,
  gcPause: 50,
  heapUsage: 85,
  swapUsage: 30,
  contextSwitches: 70,
  pageFaults: 50,
  tlbMisses: 60,
  branchMisses: 60,
  socketBacklog: 70,
  diskLatency: 70,
  replicationLag: 50,
  lockContention: 60,
  deadlockCount: 5,
  openTransactions: 70,
  walSize: 80,
  indexBloat: 60,
  vacuumLag: 70,
  connectionPoolUsage: 85,
  requestQueueDepth: 70,
  errorBudget: 50,
  retryRate: 40,
  circuitBreakerTrips: 10,
  rateLimitHits: 30,
  timeoutRate: 20,
  saturation: 80,
};

/** All pressure counter names as an array for initialization. */
const ALL_COUNTER_NAMES: PressureCounterName[] = Object.keys(PRESSURE_THRESHOLDS) as PressureCounterName[];

/** A map of all 35 counters for a single node. */
export type PressureCounters = Record<PressureCounterName, number>;

/** Result when a counter exceeds its threshold. */
export interface ExceededCounter {
  counter: PressureCounterName;
  value: number;
  threshold: number;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Create a fresh set of zeroed pressure counters. */
function createEmptyCounters(): PressureCounters {
  const counters = {} as PressureCounters;
  for (const name of ALL_COUNTER_NAMES) {
    counters[name] = 0;
  }
  return counters;
}

// ---------------------------------------------------------------------------
// PressureCounterTracker
// ---------------------------------------------------------------------------

/**
 * Tracks per-node pressure counters affected by chaos events.
 *
 * Usage:
 *   const tracker = new PressureCounterTracker();
 *   tracker.applyEffects('node-1', [{ counter: 'cpu', delta: 30 }]);
 *   tracker.getExceededCounters('node-1'); // [{ counter: 'cpu', value: 30, threshold: 80 }] or []
 *   tracker.decayAll(); // all counters -= 1 (floor 0)
 */
export class PressureCounterTracker {
  private counters: Map<string, PressureCounters> = new Map();

  /**
   * Apply a list of pressure effects to a node's counters.
   *
   * If the node has not been seen before, its counters are initialized to zero.
   * Each effect's delta is added to the corresponding counter (clamped at 0 floor).
   *
   * @param nodeId  - The canvas node ID
   * @param effects - Array of PressureCounterEffect to apply
   */
  applyEffects(nodeId: string, effects: PressureCounterEffect[]): void {
    let nodeCounters = this.counters.get(nodeId);
    if (!nodeCounters) {
      nodeCounters = createEmptyCounters();
      this.counters.set(nodeId, nodeCounters);
    }

    for (const effect of effects) {
      const current = nodeCounters[effect.counter];
      nodeCounters[effect.counter] = Math.max(0, current + effect.delta);
    }
  }

  /**
   * Get all counters that currently exceed their threshold for a node.
   *
   * @param nodeId - The canvas node ID
   * @returns Array of exceeded counters with their current value and threshold
   */
  getExceededCounters(nodeId: string): ExceededCounter[] {
    const nodeCounters = this.counters.get(nodeId);
    if (!nodeCounters) return [];

    const exceeded: ExceededCounter[] = [];
    for (const name of ALL_COUNTER_NAMES) {
      const value = nodeCounters[name];
      const threshold = PRESSURE_THRESHOLDS[name];
      if (value > threshold) {
        exceeded.push({ counter: name, value, threshold });
      }
    }
    return exceeded;
  }

  /**
   * Decay all counters across all nodes by 1 per call (floor at 0).
   *
   * Called once per tick to allow counters to naturally recover
   * when chaos events are no longer active.
   */
  decayAll(): void {
    for (const nodeCounters of this.counters.values()) {
      for (const name of ALL_COUNTER_NAMES) {
        if (nodeCounters[name] > 0) {
          nodeCounters[name] -= 1;
        }
      }
    }
  }

  /**
   * Reset all counters for all nodes to zero.
   */
  resetAll(): void {
    this.counters.clear();
  }

  /**
   * Get the current pressure counters for a specific node.
   *
   * @param nodeId - The canvas node ID
   * @returns The node's pressure counters (zeroed if not tracked yet)
   */
  getCounters(nodeId: string): PressureCounters {
    const existing = this.counters.get(nodeId);
    if (existing) return { ...existing };
    return createEmptyCounters();
  }
}
