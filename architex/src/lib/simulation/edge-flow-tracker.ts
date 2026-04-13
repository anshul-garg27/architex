/**
 * Edge Flow Tracker (SIM-007)
 *
 * Records per-edge request counts over time using a fixed-size circular
 * buffer backed by Float64Array. Supports windowed RPS calculations for
 * edge labels and simulation analytics.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Internal circular buffer for a single edge. */
interface EdgeBuffer {
  /** Timestamps of each recorded sample (ms). */
  timestamps: Float64Array;
  /** Request counts at each sample time. */
  counts: Float64Array;
  /** Current write position (wraps around). */
  head: number;
  /** Number of entries written (capped at capacity). */
  size: number;
}

// ---------------------------------------------------------------------------
// EdgeFlowTracker
// ---------------------------------------------------------------------------

/**
 * Tracks per-edge request flow using circular Float64Array buffers.
 *
 * Each edge gets an independent circular buffer that records (timestamp, count)
 * pairs. Windowed RPS is computed by summing request counts within the window.
 *
 * @example
 *   const tracker = new EdgeFlowTracker(120);
 *   tracker.recordEdgeFlow('edge-1', 50, 1000);
 *   tracker.recordEdgeFlow('edge-1', 60, 2000);
 *   console.log(tracker.getEdgeRps('edge-1', 5000)); // ~55
 */
export class EdgeFlowTracker {
  private buffers: Map<string, EdgeBuffer> = new Map();
  private readonly bufferCapacity: number;

  /**
   * @param capacity - Maximum entries per edge buffer (default: 120 = 2 min at 1/sec)
   */
  constructor(capacity: number = 120) {
    this.bufferCapacity = Math.max(1, Math.floor(capacity));
  }

  /**
   * Record a flow sample for an edge.
   *
   * @param edgeId   - Unique edge identifier
   * @param requests - Number of requests in this sample
   * @param tickMs   - Timestamp of the sample in ms
   */
  recordEdgeFlow(edgeId: string, requests: number, tickMs: number): void {
    let buf = this.buffers.get(edgeId);
    if (!buf) {
      buf = {
        timestamps: new Float64Array(this.bufferCapacity),
        counts: new Float64Array(this.bufferCapacity),
        head: 0,
        size: 0,
      };
      this.buffers.set(edgeId, buf);
    }

    buf.timestamps[buf.head] = tickMs;
    buf.counts[buf.head] = requests;
    buf.head = (buf.head + 1) % this.bufferCapacity;
    if (buf.size < this.bufferCapacity) {
      buf.size++;
    }
  }

  /**
   * Compute the windowed RPS for an edge.
   *
   * Sums all request counts within the last `windowMs` milliseconds from the
   * most recent sample timestamp.
   *
   * @param edgeId   - Unique edge identifier
   * @param windowMs - Window size in ms (default: 5000)
   * @returns Requests per second within the window, or 0 if no data
   */
  getEdgeRps(edgeId: string, windowMs: number = 5000): number {
    const buf = this.buffers.get(edgeId);
    if (!buf || buf.size === 0) return 0;

    // Find the most recent timestamp
    const lastIdx = (buf.head - 1 + this.bufferCapacity) % this.bufferCapacity;
    const latestTs = buf.timestamps[lastIdx];
    const cutoff = latestTs - windowMs;

    let totalRequests = 0;
    let minTs = latestTs;
    let maxTs = latestTs;
    let samplesInWindow = 0;

    for (let i = 0; i < buf.size; i++) {
      const idx = (buf.head - 1 - i + this.bufferCapacity * 2) % this.bufferCapacity;
      const ts = buf.timestamps[idx];
      if (ts < cutoff) break;

      totalRequests += buf.counts[idx];
      if (ts < minTs) minTs = ts;
      if (ts > maxTs) maxTs = ts;
      samplesInWindow++;
    }

    if (samplesInWindow === 0) return 0;

    // Compute RPS: total requests / window duration in seconds
    const windowSec = windowMs / 1000;
    return totalRequests / windowSec;
  }

  /**
   * Get an RPS snapshot for all tracked edges.
   *
   * @param windowMs - Window size in ms (default: 5000)
   * @returns Map from edgeId to RPS
   */
  getRpsSnapshot(windowMs: number = 5000): Map<string, number> {
    const snapshot = new Map<string, number>();
    for (const edgeId of this.buffers.keys()) {
      snapshot.set(edgeId, this.getEdgeRps(edgeId, windowMs));
    }
    return snapshot;
  }

  /** Reset all tracked data. */
  reset(): void {
    this.buffers.clear();
  }
}
