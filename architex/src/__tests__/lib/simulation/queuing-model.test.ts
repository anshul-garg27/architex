import { describe, it, expect } from 'vitest';
import {
  mm1Utilization,
  mm1AvgQueueLength,
  mm1AvgWaitTime,
  mm1AvgSystemTime,
  simulateNode,
  estimatePercentile,
  littlesLaw,
  littlesLawTime,
  erlangC,
} from '@/lib/simulation/queuing-model';

describe('queuing-model', () => {
  // ── mm1Utilization ────────────────────────────────────────

  describe('mm1Utilization', () => {
    it('computes rho = lambda / mu', () => {
      expect(mm1Utilization(0.5, 1)).toBe(0.5);
      expect(mm1Utilization(0.9, 1)).toBeCloseTo(0.9);
    });

    it('throws on zero or negative mu', () => {
      expect(() => mm1Utilization(1, 0)).toThrow();
      expect(() => mm1Utilization(1, -1)).toThrow();
    });

    it('returns >= 1 when arrival exceeds service (unstable)', () => {
      expect(mm1Utilization(2, 1)).toBeGreaterThanOrEqual(1);
    });
  });

  // ── M/M/1 derived metrics ─────────────────────────────────

  describe('M/M/1 derived metrics', () => {
    it('returns Infinity for unstable queue (rho >= 1)', () => {
      expect(mm1AvgQueueLength(1, 1)).toBe(Infinity);
      expect(mm1AvgWaitTime(2, 1)).toBe(Infinity);
      expect(mm1AvgSystemTime(1, 1)).toBe(Infinity);
    });

    it('computes finite values for stable queue', () => {
      // lambda = 0.5, mu = 1 -> rho = 0.5
      // Lq = rho^2 / (1 - rho) = 0.25 / 0.5 = 0.5
      expect(mm1AvgQueueLength(0.5, 1)).toBeCloseTo(0.5);
      // Wq = rho / (mu - lambda) = 0.5 / 0.5 = 1
      expect(mm1AvgWaitTime(0.5, 1)).toBeCloseTo(1);
      // W = 1 / (mu - lambda) = 1 / 0.5 = 2
      expect(mm1AvgSystemTime(0.5, 1)).toBeCloseTo(2);
    });
  });

  // ── simulateNode edge cases ───────────────────────────────

  describe('simulateNode', () => {
    it('handles zero arrival rate (no traffic)', () => {
      const result = simulateNode(0, 1, 1);
      expect(result.utilization).toBe(0);
      expect(result.avgQueueLength).toBe(0);
      expect(result.avgWaitTime).toBe(0);
      expect(result.avgSystemTime).toBe(1); // 1 / serviceRate
    });

    it('returns all Infinity for overloaded M/M/1 queue', () => {
      const result = simulateNode(2, 1, 1);
      expect(result.utilization).toBe(1);
      expect(result.avgQueueLength).toBe(Infinity);
      expect(result.avgWaitTime).toBe(Infinity);
      expect(result.p99Latency).toBe(Infinity);
    });

    it('returns valid results for a stable M/M/c system', () => {
      // 50 req/ms arriving, each server handles 20 req/ms, 4 servers
      // rho = 50 / (4 * 20) = 0.625
      const result = simulateNode(50, 20, 4);
      expect(result.utilization).toBeCloseTo(0.625);
      expect(result.avgQueueLength).toBeGreaterThan(0);
      expect(result.avgQueueLength).toBeLessThan(Infinity);
      expect(result.p95Latency).toBeGreaterThan(0);
      expect(result.p99Latency).toBeGreaterThan(result.p95Latency);
    });

    it('throws on negative arrival rate', () => {
      expect(() => simulateNode(-1, 1, 1)).toThrow();
    });

    it('throws on non-positive service rate', () => {
      expect(() => simulateNode(1, 0, 1)).toThrow();
      expect(() => simulateNode(1, -1, 1)).toThrow();
    });

    it('throws on server count < 1', () => {
      expect(() => simulateNode(1, 1, 0)).toThrow();
    });
  });

  // ── estimatePercentile ────────────────────────────────────

  describe('estimatePercentile', () => {
    it('p95 > p50 for any finite system time', () => {
      const p50 = estimatePercentile(10, 0.5);
      const p95 = estimatePercentile(10, 0.95);
      expect(p95).toBeGreaterThan(p50);
    });

    it('throws for percentile outside (0, 1)', () => {
      expect(() => estimatePercentile(10, 0)).toThrow();
      expect(() => estimatePercentile(10, 1)).toThrow();
      expect(() => estimatePercentile(10, -0.5)).toThrow();
    });

    it('returns Infinity for infinite system time', () => {
      expect(estimatePercentile(Infinity, 0.95)).toBe(Infinity);
    });
  });

  // ── Little's Law ──────────────────────────────────────────

  describe("Little's Law", () => {
    it('L = lambda * W', () => {
      expect(littlesLaw(5, 10)).toBe(50);
    });

    it('W = L / lambda', () => {
      expect(littlesLawTime(50, 5)).toBe(10);
    });

    it('littlesLawTime throws on non-positive lambda', () => {
      expect(() => littlesLawTime(10, 0)).toThrow();
      expect(() => littlesLawTime(10, -1)).toThrow();
    });
  });

  // ── erlangC ───────────────────────────────────────────────

  describe('erlangC', () => {
    it('returns 0 for zero traffic', () => {
      expect(erlangC(3, 0)).toBe(0);
    });

    it('returns 1 for rho >= 1 (unstable)', () => {
      expect(erlangC(3, 1)).toBe(1);
      expect(erlangC(3, 1.5)).toBe(1);
    });

    it('returns probability between 0 and 1 for valid inputs', () => {
      const pWait = erlangC(3, 0.5);
      expect(pWait).toBeGreaterThan(0);
      expect(pWait).toBeLessThan(1);
    });
  });
});
