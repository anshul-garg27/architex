/**
 * SimMetricsBus — TypedArray-Backed Flat Buffer for Simulation Metrics
 *
 * Replaces per-node Zustand writes with a zero-allocation flat buffer.
 * The orchestrator writes metrics here every tick. UI components read
 * on requestAnimationFrame via subscribers, NOT on every tick.
 *
 * This eliminates the ~500 renders/sec bug by decoupling tick rate
 * from React render rate.
 *
 * Memory layout per node (6 Float64 values = 48 bytes):
 *   [throughput, latency, errorRate, utilization, queueDepth, cacheHitRate]
 *
 * Index formula: nodeSlot * METRICS_PER_NODE + metricOffset
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of metric fields per node. */
const METRICS_PER_NODE = 6;

/** Maximum number of nodes the buffer can hold. */
const MAX_NODES = 512;

/** Metric field offsets within a node's slot. */
export const MetricOffset = {
  throughput: 0,
  latency: 1,
  errorRate: 2,
  utilization: 3,
  queueDepth: 4,
  cacheHitRate: 5,
} as const;

export type MetricField = keyof typeof MetricOffset;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metrics for a single node, as a plain object for UI consumption. */
export interface NodeMetricsSnapshot {
  throughput: number;
  latency: number;
  errorRate: number;
  utilization: number;
  queueDepth: number;
  cacheHitRate: number;
}

/** Subscriber callback — called at most once per animation frame. */
export type MetricsBusSubscriber = (dirtyNodeIds: ReadonlySet<string>) => void;

// ---------------------------------------------------------------------------
// SimMetricsBus
// ---------------------------------------------------------------------------

/**
 * High-performance metrics bus backed by a Float64Array.
 *
 * - Orchestrator calls `write(nodeId, metrics)` every tick: O(1), zero GC pressure.
 * - UI calls `subscribe(fn)` and receives batched notifications on rAF.
 * - `readNode(nodeId)` returns a snapshot for rendering.
 *
 * @example
 *   const bus = SimMetricsBus.getInstance();
 *   bus.write('node-1', { throughput: 150, latency: 12, errorRate: 0, utilization: 0.6, queueDepth: 3, cacheHitRate: 0.95 });
 *   bus.subscribe((dirtyIds) => { ... }); // called on rAF
 */
export class SimMetricsBus {
  private static instance: SimMetricsBus | null = null;

  /** The flat buffer holding all node metrics. */
  private readonly buffer: Float64Array;

  /** Maps nodeId -> slot index in the buffer. */
  private readonly nodeSlots: Map<string, number> = new Map();

  /** Next available slot index. */
  private nextSlot = 0;

  /** Set of nodeIds that have been written since the last flush. */
  private readonly dirtyNodes: Set<string> = new Set();

  /** Registered subscribers. */
  private readonly subscribers: Set<MetricsBusSubscriber> = new Set();

  /** Whether a rAF is already scheduled. */
  private rafScheduled = false;

  /** rAF handle for cancellation. */
  private rafHandle = 0;

  /** Tick counter for batch scheduling. */
  private tickCounter = 0;

  private constructor() {
    this.buffer = new Float64Array(MAX_NODES * METRICS_PER_NODE);
  }

  /** Get the singleton instance. */
  static getInstance(): SimMetricsBus {
    if (!SimMetricsBus.instance) {
      SimMetricsBus.instance = new SimMetricsBus();
    }
    return SimMetricsBus.instance;
  }

  /** Reset for testing or simulation restart. */
  static resetInstance(): void {
    if (SimMetricsBus.instance) {
      SimMetricsBus.instance.reset();
    }
    SimMetricsBus.instance = null;
  }

  // -----------------------------------------------------------------------
  // Write path (called by orchestrator — hot path)
  // -----------------------------------------------------------------------

  /**
   * Write metrics for a node into the flat buffer.
   * Zero allocation on the write path.
   *
   * @param nodeId  - Canvas node ID
   * @param metrics - Metric values to write
   */
  write(nodeId: string, metrics: NodeMetricsSnapshot): void {
    let slot = this.nodeSlots.get(nodeId);
    if (slot === undefined) {
      if (this.nextSlot >= MAX_NODES) return; // Buffer full, skip
      slot = this.nextSlot++;
      this.nodeSlots.set(nodeId, slot);
    }

    const base = slot * METRICS_PER_NODE;
    this.buffer[base + MetricOffset.throughput] = metrics.throughput;
    this.buffer[base + MetricOffset.latency] = metrics.latency;
    this.buffer[base + MetricOffset.errorRate] = metrics.errorRate;
    this.buffer[base + MetricOffset.utilization] = metrics.utilization;
    this.buffer[base + MetricOffset.queueDepth] = metrics.queueDepth;
    this.buffer[base + MetricOffset.cacheHitRate] = metrics.cacheHitRate;

    this.dirtyNodes.add(nodeId);
    this.scheduleFlush();
  }

  /**
   * Write a single metric field for a node.
   * Even cheaper than writing all fields.
   */
  writeField(nodeId: string, field: MetricField, value: number): void {
    let slot = this.nodeSlots.get(nodeId);
    if (slot === undefined) {
      if (this.nextSlot >= MAX_NODES) return;
      slot = this.nextSlot++;
      this.nodeSlots.set(nodeId, slot);
    }

    this.buffer[slot * METRICS_PER_NODE + MetricOffset[field]] = value;
    this.dirtyNodes.add(nodeId);
    this.scheduleFlush();
  }

  // -----------------------------------------------------------------------
  // Read path (called by UI components)
  // -----------------------------------------------------------------------

  /**
   * Read all metrics for a node.
   *
   * @param nodeId - Canvas node ID
   * @returns Metrics snapshot, or null if node has never been written
   */
  readNode(nodeId: string): NodeMetricsSnapshot | null {
    const slot = this.nodeSlots.get(nodeId);
    if (slot === undefined) return null;

    const base = slot * METRICS_PER_NODE;
    return {
      throughput: this.buffer[base + MetricOffset.throughput],
      latency: this.buffer[base + MetricOffset.latency],
      errorRate: this.buffer[base + MetricOffset.errorRate],
      utilization: this.buffer[base + MetricOffset.utilization],
      queueDepth: this.buffer[base + MetricOffset.queueDepth],
      cacheHitRate: this.buffer[base + MetricOffset.cacheHitRate],
    };
  }

  /**
   * Read a single metric field for a node.
   *
   * @param nodeId - Canvas node ID
   * @param field  - Metric field name
   * @returns The value, or 0 if not tracked
   */
  readField(nodeId: string, field: MetricField): number {
    const slot = this.nodeSlots.get(nodeId);
    if (slot === undefined) return 0;
    return this.buffer[slot * METRICS_PER_NODE + MetricOffset[field]];
  }

  // -----------------------------------------------------------------------
  // Subscription (rAF-throttled)
  // -----------------------------------------------------------------------

  /**
   * Subscribe to metric changes. Callback fires at most once per animation frame
   * with the set of dirty node IDs.
   *
   * @param fn - Subscriber callback
   * @returns Unsubscribe function
   */
  subscribe(fn: MetricsBusSubscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  /**
   * Get the current tick counter (useful for batch scheduling).
   */
  getTick(): number {
    return this.tickCounter;
  }

  /**
   * Increment tick counter. Called by orchestrator.
   */
  incrementTick(): void {
    this.tickCounter++;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private scheduleFlush(): void {
    if (this.rafScheduled) return;
    if (typeof requestAnimationFrame === 'undefined') {
      // SSR or test environment — flush synchronously
      this.flush();
      return;
    }
    this.rafScheduled = true;
    this.rafHandle = requestAnimationFrame(() => {
      this.flush();
    });
  }

  private flush(): void {
    this.rafScheduled = false;

    if (this.dirtyNodes.size === 0) return;

    // Snapshot dirty set and clear it before notifying
    const snapshot = new Set(this.dirtyNodes);
    this.dirtyNodes.clear();

    for (const fn of this.subscribers) {
      fn(snapshot);
    }
  }

  /** Reset all state (for simulation restart). */
  reset(): void {
    this.buffer.fill(0);
    this.nodeSlots.clear();
    this.nextSlot = 0;
    this.dirtyNodes.clear();
    this.subscribers.clear();
    this.tickCounter = 0;
    this.rafScheduled = false;
    if (this.rafHandle) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.rafHandle);
      }
      this.rafHandle = 0;
    }
  }

  /** Get all tracked node IDs. */
  getTrackedNodeIds(): string[] {
    return Array.from(this.nodeSlots.keys());
  }
}
