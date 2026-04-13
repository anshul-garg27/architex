/**
 * Cascade Simulation Engine (INO-003)
 *
 * Takes a topology (nodes + edges) and a failure starting point, then
 * simulates failure propagation through the system. The engine models:
 *
 *   - Downstream cascade: failures propagate along edges
 *   - Circuit breakers: can halt propagation at a node boundary
 *   - Retries: may delay or mask propagation
 *   - Fallbacks: some nodes degrade instead of failing
 *   - Timeouts: implicit in propagation delays
 *   - Recovery: nodes may self-heal with a configurable probability
 *
 * Returns a timed sequence of CascadeStep objects for visualization.
 */

import type { FailureMode } from './failure-modes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a node during cascade simulation. */
export type CascadeNodeStatus = 'healthy' | 'degraded' | 'failed' | 'recovered';

/** A single step in the cascade simulation timeline. */
export interface CascadeStep {
  /** Simulation time in milliseconds when this step occurs. */
  timeMs: number;
  /** ID of the affected node. */
  affectedNodeId: string;
  /** New status of the node at this time. */
  status: CascadeNodeStatus;
  /** Human-readable description of what happened. */
  description: string;
}

/** A node in the topology graph. */
export interface TopologyNode {
  id: string;
  label: string;
  /** Component type (e.g. 'api-server', 'database'). */
  type: string;
  /** Whether this node has a circuit breaker configured. */
  hasCircuitBreaker?: boolean;
  /** Whether this node has retry logic. */
  hasRetry?: boolean;
  /** Whether this node has a fallback. */
  hasFallback?: boolean;
}

/** An edge in the topology graph (directed: source -> target). */
export interface TopologyEdge {
  source: string;
  target: string;
}

/** Configuration for the cascade simulation. */
export interface CascadeConfig {
  /** Base delay in ms before failure propagates to next hop. */
  propagationDelayMs: number;
  /** Probability (0-1) a downstream node becomes degraded. */
  degradeProbability: number;
  /** Probability (0-1) a downstream node fails completely. */
  failProbability: number;
  /** Probability (0-1) that a failed/degraded node recovers per cycle. */
  recoveryProbability: number;
  /** Whether circuit breakers are modelled. */
  circuitBreakerEnabled: boolean;
  /** Whether retry logic is modelled. */
  retryEnabled: boolean;
  /** Max retries before giving up. */
  maxRetries: number;
  /** Delay between retries in ms. */
  retryDelayMs: number;
  /** Request timeout in ms (used for descriptions). */
  timeoutMs: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: CascadeConfig = {
  propagationDelayMs: 200,
  degradeProbability: 0.6,
  failProbability: 0.4,
  recoveryProbability: 0.1,
  circuitBreakerEnabled: true,
  retryEnabled: true,
  maxRetries: 3,
  retryDelayMs: 500,
  timeoutMs: 5000,
};

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (deterministic for testing)
// ---------------------------------------------------------------------------

/**
 * Simple mulberry32 PRNG for deterministic simulations.
 *
 * @param seed - 32-bit integer seed
 * @returns A function that returns the next random number in [0, 1)
 */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// CascadeEngine
// ---------------------------------------------------------------------------

export class CascadeEngine {
  private config: CascadeConfig;

  constructor(config?: Partial<CascadeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run a cascade simulation.
   *
   * @param nodes       - Topology nodes
   * @param edges       - Topology edges (directed: source -> target)
   * @param startNodeId - The node where the failure originates
   * @param mode        - Optional failure mode for richer descriptions
   * @param seed        - Optional RNG seed for deterministic results
   * @returns Timed sequence of cascade events, sorted by timeMs
   */
  simulate(
    nodes: TopologyNode[],
    edges: TopologyEdge[],
    startNodeId: string,
    mode?: FailureMode,
    seed?: number,
  ): CascadeStep[] {
    const rng = createRng(seed ?? 42);
    const steps: CascadeStep[] = [];

    // Build adjacency list (downstream dependencies).
    const adjacency = new Map<string, string[]>();
    const nodeMap = new Map<string, TopologyNode>();
    for (const node of nodes) {
      adjacency.set(node.id, []);
      nodeMap.set(node.id, node);
    }
    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
    }

    // Track current status of each node.
    const nodeStatus = new Map<string, CascadeNodeStatus>();
    for (const node of nodes) {
      nodeStatus.set(node.id, 'healthy');
    }

    // Verify start node exists.
    const startNode = nodeMap.get(startNodeId);
    if (!startNode) {
      return steps;
    }

    // Phase 1: Initial failure.
    const failureName = mode?.name ?? 'Failure';
    steps.push({
      timeMs: 0,
      affectedNodeId: startNodeId,
      status: 'failed',
      description: `${failureName} injected at ${startNode.label}. Node is now offline.`,
    });
    nodeStatus.set(startNodeId, 'failed');

    // Phase 2: BFS cascade propagation.
    interface QueueEntry {
      nodeId: string;
      timeMs: number;
      depth: number;
    }
    const queue: QueueEntry[] = [];
    const visited = new Set<string>([startNodeId]);

    // Seed queue with downstream nodes of the failed start node.
    const startDownstream = adjacency.get(startNodeId) ?? [];
    for (const targetId of startDownstream) {
      if (!visited.has(targetId)) {
        queue.push({
          nodeId: targetId,
          timeMs: this.config.propagationDelayMs,
          depth: 1,
        });
        visited.add(targetId);
      }
    }

    // Sort queue by time to process in order.
    queue.sort((a, b) => a.timeMs - b.timeMs);

    let queueIdx = 0;
    while (queueIdx < queue.length) {
      const entry = queue[queueIdx];
      queueIdx++;

      const node = nodeMap.get(entry.nodeId);
      if (!node) continue;

      let currentTime = entry.timeMs;

      // Check circuit breaker.
      if (
        this.config.circuitBreakerEnabled &&
        node.hasCircuitBreaker
      ) {
        steps.push({
          timeMs: currentTime,
          affectedNodeId: entry.nodeId,
          status: 'degraded',
          description: `Circuit breaker at ${node.label} tripped. Downstream requests fast-failing.`,
        });
        nodeStatus.set(entry.nodeId, 'degraded');

        // Circuit breaker prevents further cascade from this node.
        continue;
      }

      // Check retry logic.
      if (this.config.retryEnabled && node.hasRetry) {
        const retryDelay = this.config.retryDelayMs * this.config.maxRetries;
        steps.push({
          timeMs: currentTime,
          affectedNodeId: entry.nodeId,
          status: 'degraded',
          description: `${node.label} retrying upstream (${this.config.maxRetries}x with ${this.config.retryDelayMs}ms backoff).`,
        });
        nodeStatus.set(entry.nodeId, 'degraded');
        currentTime += retryDelay;

        // After retries, determine if node fails or stays degraded.
        const retrySuccess = rng() > this.config.failProbability;
        if (retrySuccess) {
          // Retries eventually succeed — node stays degraded but functional.
          steps.push({
            timeMs: currentTime,
            affectedNodeId: entry.nodeId,
            status: 'degraded',
            description: `${node.label} retries partially succeeded. Operating in degraded mode.`,
          });
          // Still propagate degradation downstream but don't cascade failure.
          const downstream = adjacency.get(entry.nodeId) ?? [];
          for (const targetId of downstream) {
            if (!visited.has(targetId)) {
              queue.push({
                nodeId: targetId,
                timeMs: currentTime + this.config.propagationDelayMs,
                depth: entry.depth + 1,
              });
              visited.add(targetId);
            }
          }
          // Re-sort after additions.
          queue.sort((a, b) => a.timeMs - b.timeMs);
          // Reset queueIdx to re-find position (simple approach for small queues).
          queueIdx = queue.findIndex(
            (q) => nodeStatus.get(q.nodeId) === 'healthy',
          );
          if (queueIdx < 0) queueIdx = queue.length;
          continue;
        }
        // Retries exhausted — fall through to failure.
      }

      // Check fallback.
      if (node.hasFallback) {
        const fallbackWorks = rng() > 0.3; // 70% chance fallback works
        if (fallbackWorks) {
          steps.push({
            timeMs: currentTime,
            affectedNodeId: entry.nodeId,
            status: 'degraded',
            description: `${node.label} activated fallback. Serving stale/partial data.`,
          });
          nodeStatus.set(entry.nodeId, 'degraded');
          // Fallback prevents further cascade.
          continue;
        }
      }

      // Determine node outcome based on probabilities.
      const roll = rng();
      if (roll < this.config.failProbability) {
        // Node fails.
        steps.push({
          timeMs: currentTime,
          affectedNodeId: entry.nodeId,
          status: 'failed',
          description: `${node.label} failed due to cascading ${failureName.toLowerCase()} from upstream dependency.`,
        });
        nodeStatus.set(entry.nodeId, 'failed');
      } else if (roll < this.config.failProbability + this.config.degradeProbability) {
        // Node degrades.
        steps.push({
          timeMs: currentTime,
          affectedNodeId: entry.nodeId,
          status: 'degraded',
          description: `${node.label} degraded — elevated latency and error rates due to upstream failure.`,
        });
        nodeStatus.set(entry.nodeId, 'degraded');
      } else {
        // Node remains healthy (unaffected).
        continue;
      }

      // Propagate to downstream nodes.
      const downstream = adjacency.get(entry.nodeId) ?? [];
      for (const targetId of downstream) {
        if (!visited.has(targetId)) {
          queue.push({
            nodeId: targetId,
            timeMs: currentTime + this.config.propagationDelayMs,
            depth: entry.depth + 1,
          });
          visited.add(targetId);
        }
      }
      // Re-sort.
      queue.sort((a, b) => a.timeMs - b.timeMs);
      queueIdx = 0;
      // Skip already-processed entries.
      while (
        queueIdx < queue.length &&
        nodeStatus.get(queue[queueIdx].nodeId) !== 'healthy'
      ) {
        queueIdx++;
      }
    }

    // Phase 3: Recovery (for nodes that have a recovery path).
    const maxCascadeTime = steps.length > 0
      ? steps[steps.length - 1].timeMs
      : 0;

    for (const node of nodes) {
      const status = nodeStatus.get(node.id);
      if (status === 'degraded' || status === 'failed') {
        if (rng() < this.config.recoveryProbability) {
          const recoveryTime =
            maxCascadeTime + this.config.propagationDelayMs * 2;
          steps.push({
            timeMs: recoveryTime,
            affectedNodeId: node.id,
            status: 'recovered',
            description: `${node.label} has recovered. Health checks passing.`,
          });
          nodeStatus.set(node.id, 'recovered');
        }
      }
    }

    // Sort final result by time.
    steps.sort((a, b) => a.timeMs - b.timeMs);

    return steps;
  }
}
