import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../metrics-collector';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector({ windowMs: 10_000 });
  });

  // ── Initial state ────────────────────────────────────────────

  it('initial metrics have zero counts', () => {
    const m = collector.getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.successfulRequests).toBe(0);
    expect(m.failedRequests).toBe(0);
  });

  it('initial latency percentiles are 0', () => {
    const m = collector.getMetrics();
    expect(m.avgLatencyMs).toBe(0);
    expect(m.p50LatencyMs).toBe(0);
    expect(m.p95LatencyMs).toBe(0);
    expect(m.p99LatencyMs).toBe(0);
  });

  it('no tracked node IDs initially', () => {
    expect(collector.getTrackedNodeIds()).toEqual([]);
  });

  // ── recordRequest ────────────────────────────────────────────

  it('recordRequest increments total and successful counts', () => {
    collector.recordRequest('api-1', 10, true, 1000);
    collector.recordRequest('api-1', 20, true, 1100);

    const m = collector.getMetrics();
    expect(m.totalRequests).toBe(2);
    expect(m.successfulRequests).toBe(2);
    expect(m.failedRequests).toBe(0);
  });

  it('recordRequest tracks failed requests', () => {
    collector.recordRequest('api-1', 10, true, 1000);
    collector.recordRequest('api-1', 500, false, 1100);

    const m = collector.getMetrics();
    expect(m.failedRequests).toBe(1);
    expect(m.errorRate).toBeCloseTo(0.5, 5);
  });

  // ── Percentiles ──────────────────────────────────────────────

  it('computes correct average latency', () => {
    collector.recordRequest('n1', 10, true, 1000);
    collector.recordRequest('n1', 20, true, 1100);
    collector.recordRequest('n1', 30, true, 1200);

    expect(collector.getMetrics().avgLatencyMs).toBe(20);
  });

  it('computes correct p50 latency', () => {
    // Insert 10 values: 1..10
    for (let i = 1; i <= 10; i++) {
      collector.recordRequest('n1', i, true, 1000 + i);
    }

    const m = collector.getMetrics();
    // p50 of [1..10] at index 5 -> value 6
    expect(m.p50LatencyMs).toBe(6);
  });

  it('computes correct p99 latency', () => {
    // Insert 100 values: 1..100
    for (let i = 1; i <= 100; i++) {
      collector.recordRequest('n1', i, true, 1000 + i);
    }

    const m = collector.getMetrics();
    // p99 of [1..100] at index 99 -> value 100
    expect(m.p99LatencyMs).toBe(100);
  });

  // ── Per-node metrics ─────────────────────────────────────────

  it('tracks per-node metrics separately', () => {
    collector.recordRequest('api-1', 10, true, 1000);
    collector.recordRequest('api-1', 20, true, 1100);
    collector.recordRequest('db-1', 50, false, 1200);

    expect(collector.getTrackedNodeIds()).toContain('api-1');
    expect(collector.getTrackedNodeIds()).toContain('db-1');

    const apiMetrics = collector.getNodeMetrics('api-1')!;
    expect(apiMetrics.totalRequests).toBe(2);
    expect(apiMetrics.failedRequests).toBe(0);

    const dbMetrics = collector.getNodeMetrics('db-1')!;
    expect(dbMetrics.totalRequests).toBe(1);
    expect(dbMetrics.failedRequests).toBe(1);
  });

  it('getNodeMetrics returns null for unknown node', () => {
    expect(collector.getNodeMetrics('nonexistent')).toBeNull();
  });

  // ── Elapsed time ─────────────────────────────────────────────

  it('elapsedMs reflects the time between first and last request', () => {
    collector.recordRequest('n1', 10, true, 1000);
    collector.recordRequest('n1', 20, true, 3000);

    expect(collector.getMetrics().elapsedMs).toBe(2000);
  });

  // ── Reset ────────────────────────────────────────────────────

  it('reset clears all metrics and tracked nodes', () => {
    collector.recordRequest('n1', 10, true, 1000);
    collector.recordRequest('n2', 20, false, 1100);

    collector.reset();

    const m = collector.getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.avgLatencyMs).toBe(0);
    expect(collector.getTrackedNodeIds()).toEqual([]);
  });
});
