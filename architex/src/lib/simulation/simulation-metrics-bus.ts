/**
 * Simulation Metrics Bus (SIM-009)
 *
 * High-performance, zero-React pub-sub bus that decouples the simulation
 * engine (producer) from the canvas UI (consumer). Holds per-node simulation
 * metrics and provides dirty-tracking for efficient UI updates via
 * requestAnimationFrame.
 *
 * ZERO imports from React, Zustand, or Next.js.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-node simulation metrics carried by the bus. */
export interface NodeSimMetrics {
  /** Current requests per second. */
  throughput: number;
  /** Current average latency in ms. */
  latency: number;
  /** Error rate [0, 1]. */
  errorRate: number;
  /** Utilization [0, 1]. */
  utilization: number;
  /** Queue depth (number of waiting requests). */
  queueDepth: number;
  /** Derived health state. */
  state: 'healthy' | 'degraded' | 'critical' | 'down';
  /** Timestamp of last update (performance.now()). */
  updatedAt: number;
}

/** Subscriber callback signature. */
export type MetricsBusSubscriber = (nodeId: string, metrics: NodeSimMetrics) => void;

// ---------------------------------------------------------------------------
// SimulationMetricsBus
// ---------------------------------------------------------------------------

/**
 * Zero-React pub-sub bus for simulation metrics.
 *
 * The simulation engine writes metrics per node. Canvas overlays read them
 * via subscribe/read. Dirty-tracking ensures subscribers only get notified
 * for nodes that actually changed.
 *
 * @example
 *   const bus = new SimulationMetricsBus();
 *   const unsub = bus.subscribe((nodeId, metrics) => {
 *     console.log(nodeId, metrics.utilization);
 *   });
 *   bus.write('node-1', { utilization: 0.75 });
 *   bus.notify(); // subscriber fires for node-1
 *   unsub();
 */
export class SimulationMetricsBus {
  private metrics: Map<string, NodeSimMetrics> = new Map();
  private dirty: Set<string> = new Set();
  private subscribers: Set<MetricsBusSubscriber> = new Set();

  /**
   * Write (partial) metrics for a node.
   *
   * Merges with existing metrics via copy-on-write and marks the node as dirty.
   *
   * @param nodeId  - Node identifier
   * @param partial - Partial metrics to merge
   */
  write(nodeId: string, partial: Partial<NodeSimMetrics>): void {
    const existing = this.metrics.get(nodeId);
    const merged: NodeSimMetrics = {
      throughput: partial.throughput ?? existing?.throughput ?? 0,
      latency: partial.latency ?? existing?.latency ?? 0,
      errorRate: partial.errorRate ?? existing?.errorRate ?? 0,
      utilization: partial.utilization ?? existing?.utilization ?? 0,
      queueDepth: partial.queueDepth ?? existing?.queueDepth ?? 0,
      state: partial.state ?? existing?.state ?? 'healthy',
      updatedAt: partial.updatedAt ?? (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    };
    // Copy-on-write: always store a new object reference
    this.metrics.set(nodeId, merged);
    this.dirty.add(nodeId);
  }

  /**
   * Read the latest metrics for a node.
   *
   * @param nodeId - Node identifier
   * @returns The latest NodeSimMetrics, or undefined if never written
   */
  read(nodeId: string): NodeSimMetrics | undefined {
    return this.metrics.get(nodeId);
  }

  /**
   * Subscribe to metric notifications.
   *
   * The callback fires for each dirty node when notify() is called.
   *
   * @param callback - Function called with (nodeId, metrics) for each dirty node
   * @returns Unsubscribe function
   */
  subscribe(callback: MetricsBusSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Flush pending notifications.
   *
   * Calls all subscribers for each dirty node, then clears the dirty set.
   */
  notify(): void {
    if (this.dirty.size === 0) return;

    for (const nodeId of this.dirty) {
      const m = this.metrics.get(nodeId);
      if (!m) continue;
      for (const sub of this.subscribers) {
        sub(nodeId, m);
      }
    }

    this.dirty.clear();
  }

  /**
   * Get the set of node IDs that have been written to since the last notify/clear.
   *
   * @returns Set of dirty node IDs
   */
  getDirtyNodes(): Set<string> {
    return new Set(this.dirty);
  }

  /** Clear the dirty set without notifying subscribers. */
  clearDirty(): void {
    this.dirty.clear();
  }

  /** Reset all state: metrics, dirty set, and subscribers. */
  reset(): void {
    this.metrics.clear();
    this.dirty.clear();
    this.subscribers.clear();
  }
}
