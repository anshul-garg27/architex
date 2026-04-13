/**
 * Real-Time Metrics Aggregation
 *
 * Collects request-level data (latency, success/failure) and computes
 * aggregate metrics: throughput (sliding window), latency percentiles
 * (sorted insertion), error rates, and per-node breakdowns.
 *
 * Uses efficient data structures:
 *   - Circular buffer for sliding-window throughput
 *   - Sorted array with binary-search insertion for O(log n) percentiles
 */

import type { SimulationMetrics } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metrics for a single node in the architecture. */
export interface NodeMetrics {
  nodeId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRate: number;
}

/** A recorded request for internal tracking. */
interface RequestRecord {
  timestampMs: number;
  latencyMs: number;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Circular Buffer for Sliding-Window Throughput
// ---------------------------------------------------------------------------

/**
 * Fixed-capacity circular buffer that holds timestamped request counts.
 * Used to compute requests-per-second over a sliding time window.
 */
class CircularBuffer {
  private readonly buffer: number[];
  private readonly timestamps: number[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<number>(capacity).fill(0);
    this.timestamps = new Array<number>(capacity).fill(0);
  }

  /** Add a count at the given timestamp. */
  push(count: number, timestampMs: number): void {
    this.buffer[this.head] = count;
    this.timestamps[this.head] = timestampMs;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  /**
   * Sum all counts within the last windowMs milliseconds from the given timestamp.
   *
   * @param nowMs    - Current timestamp
   * @param windowMs - Window size in ms
   * @returns Total count within the window
   */
  sumInWindow(nowMs: number, windowMs: number): number {
    const cutoff = nowMs - windowMs;
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.capacity) % this.capacity;
      if (this.timestamps[idx] >= cutoff) {
        total += this.buffer[idx];
      }
    }
    return total;
  }

  /** Reset all entries. */
  clear(): void {
    this.buffer.fill(0);
    this.timestamps.fill(0);
    this.head = 0;
    this.size = 0;
  }
}

// ---------------------------------------------------------------------------
// Sorted Array for Percentile Computation
// ---------------------------------------------------------------------------

/**
 * Maintains a sorted array of latency values with binary-search insertion.
 * Allows O(1) percentile lookup by index after O(log n) insertion.
 */
class SortedLatencyArray {
  private values: number[] = [];

  /** Number of recorded values. */
  get length(): number {
    return this.values.length;
  }

  /**
   * Insert a value into the sorted array using binary search.
   * Time complexity: O(log n) for search + O(n) for shift (amortized via typed arrays in practice).
   *
   * @param value - Latency value to insert
   */
  insert(value: number): void {
    const idx = this.binarySearchInsertionPoint(value);
    this.values.splice(idx, 0, value);
  }

  /**
   * Get the value at a given percentile.
   *
   * @param percentile - Value between 0 and 1 (e.g. 0.95 for p95)
   * @returns The latency at that percentile, or 0 if no data
   */
  percentile(percentile: number): number {
    if (this.values.length === 0) return 0;
    const idx = Math.min(
      Math.floor(percentile * this.values.length),
      this.values.length - 1,
    );
    return this.values[idx];
  }

  /** Compute the arithmetic mean of all values. */
  mean(): number {
    if (this.values.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.values.length; i++) {
      sum += this.values[i];
    }
    return sum / this.values.length;
  }

  /** Clear all values. */
  clear(): void {
    this.values = [];
  }

  /**
   * Binary search for the insertion point of a value in the sorted array.
   * Returns the index at which `value` should be inserted to maintain sort order.
   */
  private binarySearchInsertionPoint(value: number): number {
    let lo = 0;
    let hi = this.values.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.values[mid] < value) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }
}

// ---------------------------------------------------------------------------
// Per-Node Tracker
// ---------------------------------------------------------------------------

/** Internal per-node state. */
class NodeTracker {
  readonly nodeId: string;
  totalRequests: number = 0;
  successfulRequests: number = 0;
  failedRequests: number = 0;

  private readonly latencies: SortedLatencyArray = new SortedLatencyArray();
  private readonly throughputBuffer: CircularBuffer;
  private lastTimestampMs: number = 0;

  constructor(nodeId: string, windowSlots: number = 600) {
    this.nodeId = nodeId;
    this.throughputBuffer = new CircularBuffer(windowSlots);
  }

  /** Record a single request. */
  record(latencyMs: number, success: boolean, timestampMs: number): void {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
    this.latencies.insert(latencyMs);
    this.throughputBuffer.push(1, timestampMs);
    this.lastTimestampMs = timestampMs;
  }

  /** Get aggregate metrics for this node. */
  getMetrics(windowMs: number): NodeMetrics {
    const countInWindow = this.throughputBuffer.sumInWindow(
      this.lastTimestampMs,
      windowMs,
    );
    const throughputRps = windowMs > 0 ? (countInWindow / windowMs) * 1000 : 0;

    return {
      nodeId: this.nodeId,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      avgLatencyMs: this.latencies.mean(),
      p50LatencyMs: this.latencies.percentile(0.5),
      p90LatencyMs: this.latencies.percentile(0.9),
      p95LatencyMs: this.latencies.percentile(0.95),
      p99LatencyMs: this.latencies.percentile(0.99),
      throughputRps,
      errorRate:
        this.totalRequests > 0
          ? this.failedRequests / this.totalRequests
          : 0,
    };
  }

  /** Reset all tracked state. */
  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.latencies.clear();
    this.throughputBuffer.clear();
    this.lastTimestampMs = 0;
  }
}

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

/**
 * Aggregates request metrics across all nodes in a simulation.
 *
 * Tracks:
 *   - Sliding-window throughput (requests/sec over last N seconds)
 *   - Latency percentiles (p50, p90, p95, p99) via sorted insertion
 *   - Error rate tracking
 *   - Per-node metrics breakdown
 *
 * @example
 *   const collector = new MetricsCollector({ windowMs: 10_000 });
 *   collector.recordRequest('api-server', 12.5, true);
 *   collector.recordRequest('api-server', 340, false);
 *   const metrics = collector.getMetrics();
 */
export class MetricsCollector {
  private readonly nodes: Map<string, NodeTracker> = new Map();
  private readonly globalLatencies: SortedLatencyArray =
    new SortedLatencyArray();
  private readonly globalThroughput: CircularBuffer;
  private readonly windowMs: number;

  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private startTimestampMs: number = 0;
  private lastTimestampMs: number = 0;

  /**
   * @param options.windowMs - Sliding window size in ms for throughput calculation. Defaults to 10 seconds.
   * @param options.windowSlots - Number of slots in the circular buffer. Defaults to 600 (enough for 60s at 100ms resolution).
   */
  constructor(
    options: { windowMs?: number; windowSlots?: number } = {},
  ) {
    this.windowMs = options.windowMs ?? 10_000;
    const windowSlots = options.windowSlots ?? 600;
    this.globalThroughput = new CircularBuffer(windowSlots);
  }

  /**
   * Record a single request.
   *
   * @param nodeId    - Identifier of the node that handled the request
   * @param latencyMs - End-to-end latency of the request in milliseconds
   * @param success   - Whether the request completed successfully
   * @param timestampMs - Optional explicit timestamp. Defaults to Date.now().
   */
  recordRequest(
    nodeId: string,
    latencyMs: number,
    success: boolean,
    timestampMs?: number,
  ): void {
    const ts = timestampMs ?? Date.now();

    if (this.totalRequests === 0) {
      this.startTimestampMs = ts;
    }
    this.lastTimestampMs = ts;

    // Global counters
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    this.globalLatencies.insert(latencyMs);
    this.globalThroughput.push(1, ts);

    // Per-node tracking
    let tracker = this.nodes.get(nodeId);
    if (!tracker) {
      tracker = new NodeTracker(nodeId);
      this.nodes.set(nodeId, tracker);
    }
    tracker.record(latencyMs, success, ts);
  }

  /**
   * Get current aggregate metrics across all nodes.
   *
   * Returns a SimulationMetrics object compatible with the simulation store.
   */
  getMetrics(): SimulationMetrics {
    const countInWindow = this.globalThroughput.sumInWindow(
      this.lastTimestampMs,
      this.windowMs,
    );
    const throughputRps =
      this.windowMs > 0 ? (countInWindow / this.windowMs) * 1000 : 0;

    const elapsedMs =
      this.totalRequests > 0
        ? this.lastTimestampMs - this.startTimestampMs
        : 0;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      avgLatencyMs: this.globalLatencies.mean(),
      p50LatencyMs: this.globalLatencies.percentile(0.5),
      p90LatencyMs: this.globalLatencies.percentile(0.9),
      p95LatencyMs: this.globalLatencies.percentile(0.95),
      p99LatencyMs: this.globalLatencies.percentile(0.99),
      throughputRps,
      errorRate:
        this.totalRequests > 0
          ? this.failedRequests / this.totalRequests
          : 0,
      elapsedMs,
    };
  }

  /**
   * Get metrics for a specific node.
   *
   * @param nodeId - The node identifier
   * @returns Node-level metrics, or null if the node has not recorded any requests
   */
  getNodeMetrics(nodeId: string): NodeMetrics | null {
    const tracker = this.nodes.get(nodeId);
    if (!tracker) return null;
    return tracker.getMetrics(this.windowMs);
  }

  /**
   * Get a list of all node IDs that have recorded at least one request.
   */
  getTrackedNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Reset all metrics to initial state.
   * Clears global counters, per-node trackers, and all buffers.
   */
  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.startTimestampMs = 0;
    this.lastTimestampMs = 0;
    this.globalLatencies.clear();
    this.globalThroughput.clear();
    this.nodes.forEach((tracker) => tracker.reset());
    this.nodes.clear();
  }
}
