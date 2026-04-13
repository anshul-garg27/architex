import { describe, it, expect } from 'vitest';
import {
  mm1Utilization,
  mm1AvgQueueLength,
  mm1AvgWaitTime,
  mm1AvgSystemTime,
  mmcAvgQueueLength,
  mmcAvgWaitTime,
  mmcAvgSystemTime,
  littlesLaw,
  littlesLawTime,
  erlangC,
  estimatePercentile,
  simulateNode,
} from '../queuing-model';

describe('queuing-model', () => {
  // ── M/M/1 Utilization ──────────────────────────────────────────────────

  describe('mm1Utilization', () => {
    it('computes rho = lambda / mu', () => {
      expect(mm1Utilization(3, 5)).toBeCloseTo(0.6);
    });

    it('returns 1 when lambda equals mu', () => {
      expect(mm1Utilization(5, 5)).toBeCloseTo(1);
    });

    it('returns 0 when lambda is 0', () => {
      expect(mm1Utilization(0, 10)).toBe(0);
    });

    it('throws when mu is zero', () => {
      expect(() => mm1Utilization(1, 0)).toThrow(RangeError);
    });

    it('throws when mu is negative', () => {
      expect(() => mm1Utilization(1, -1)).toThrow(RangeError);
    });
  });

  // ── M/M/1 Average Wait Time ───────────────────────────────────────────

  describe('mm1AvgWaitTime', () => {
    it('computes Wq = rho / (mu - lambda)', () => {
      // lambda=3, mu=5 => rho=0.6 => Wq = 0.6 / (5-3) = 0.3
      expect(mm1AvgWaitTime(3, 5)).toBeCloseTo(0.3);
    });

    it('returns Infinity when rho >= 1 (unstable)', () => {
      expect(mm1AvgWaitTime(5, 5)).toBe(Infinity);
      expect(mm1AvgWaitTime(6, 5)).toBe(Infinity);
    });
  });

  // ── M/M/1 Average Queue Length ─────────────────────────────────────────

  describe('mm1AvgQueueLength', () => {
    it('computes Lq = rho^2 / (1 - rho)', () => {
      // lambda=3, mu=5 => rho=0.6 => Lq = 0.36/0.4 = 0.9
      expect(mm1AvgQueueLength(3, 5)).toBeCloseTo(0.9);
    });

    it('returns Infinity when rho >= 1', () => {
      expect(mm1AvgQueueLength(5, 5)).toBe(Infinity);
    });
  });

  // ── M/M/1 Average System Time ─────────────────────────────────────────

  describe('mm1AvgSystemTime', () => {
    it('computes W = 1 / (mu - lambda)', () => {
      // lambda=3, mu=5 => W = 1/2 = 0.5
      expect(mm1AvgSystemTime(3, 5)).toBeCloseTo(0.5);
    });

    it('returns Infinity when lambda >= mu', () => {
      expect(mm1AvgSystemTime(5, 5)).toBe(Infinity);
      expect(mm1AvgSystemTime(10, 5)).toBe(Infinity);
    });
  });

  // ── M/M/c Queue ────────────────────────────────────────────────────────

  describe('M/M/c queue', () => {
    it('mmcAvgQueueLength with multiple servers reduces queue', () => {
      // c=3 servers, lambda=2, mu=1 => rho = 2/3 ~0.667
      const lq = mmcAvgQueueLength(2, 1, 3);
      expect(lq).toBeGreaterThanOrEqual(0);
      expect(lq).toBeLessThan(Infinity);
    });

    it('mmcAvgWaitTime is finite for stable system', () => {
      const wq = mmcAvgWaitTime(2, 1, 3);
      expect(wq).toBeGreaterThanOrEqual(0);
      expect(isFinite(wq)).toBe(true);
    });

    it('mmcAvgSystemTime includes service time', () => {
      // W = Wq + 1/mu
      const mu = 1;
      const wq = mmcAvgWaitTime(2, mu, 3);
      const ws = mmcAvgSystemTime(2, mu, 3);
      expect(ws).toBeCloseTo(wq + 1 / mu);
    });

    it('mmcAvgQueueLength returns Infinity when overloaded', () => {
      // c=2 servers, lambda=10, mu=1 => rho = 10/2 = 5 >> 1
      expect(mmcAvgQueueLength(10, 1, 2)).toBe(Infinity);
    });

    it('more servers yield lower queue length than fewer servers', () => {
      const lq2 = mmcAvgQueueLength(3, 1, 4);
      const lq4 = mmcAvgQueueLength(3, 1, 6);
      expect(lq4).toBeLessThan(lq2);
    });
  });

  // ── Erlang C ───────────────────────────────────────────────────────────

  describe('erlangC', () => {
    it('returns 0 for zero traffic', () => {
      expect(erlangC(3, 0)).toBe(0);
    });

    it('returns 1 for unstable queue (rho >= 1)', () => {
      expect(erlangC(2, 1)).toBe(1);
      expect(erlangC(2, 1.5)).toBe(1);
    });

    it('returns value between 0 and 1 for stable queue', () => {
      const pw = erlangC(3, 0.5);
      expect(pw).toBeGreaterThan(0);
      expect(pw).toBeLessThan(1);
    });

    it('throws for c < 1', () => {
      expect(() => erlangC(0, 0.5)).toThrow(RangeError);
    });
  });

  // ── Little's Law ───────────────────────────────────────────────────────

  describe("Little's Law", () => {
    it('L = lambda * W', () => {
      expect(littlesLaw(10, 0.5)).toBeCloseTo(5);
    });

    it('W = L / lambda (inverse)', () => {
      expect(littlesLawTime(5, 10)).toBeCloseTo(0.5);
    });

    it('Little is consistent: L = lambda * (L / lambda)', () => {
      const lambda = 7;
      const W = 3;
      const L = littlesLaw(lambda, W);
      expect(littlesLawTime(L, lambda)).toBeCloseTo(W);
    });

    it('littlesLawTime throws for non-positive lambda', () => {
      expect(() => littlesLawTime(5, 0)).toThrow(RangeError);
      expect(() => littlesLawTime(5, -1)).toThrow(RangeError);
    });

    it('littlesLaw returns 0 when lambda is 0', () => {
      expect(littlesLaw(0, 100)).toBe(0);
    });
  });

  // ── Percentile estimation ──────────────────────────────────────────────

  describe('estimatePercentile', () => {
    it('p95 > p50 for same system time', () => {
      const p50 = estimatePercentile(10, 0.5);
      const p95 = estimatePercentile(10, 0.95);
      expect(p95).toBeGreaterThan(p50);
    });

    it('returns Infinity for infinite system time', () => {
      expect(estimatePercentile(Infinity, 0.95)).toBe(Infinity);
    });

    it('returns Infinity for zero system time', () => {
      expect(estimatePercentile(0, 0.95)).toBe(Infinity);
    });

    it('throws for out-of-range percentile', () => {
      expect(() => estimatePercentile(10, 0)).toThrow(RangeError);
      expect(() => estimatePercentile(10, 1)).toThrow(RangeError);
    });
  });

  // ── simulateNode (unified helper) ──────────────────────────────────────

  describe('simulateNode', () => {
    it('returns zero utilization for zero arrival rate', () => {
      const r = simulateNode(0, 1, 1);
      expect(r.utilization).toBe(0);
      expect(r.avgQueueLength).toBe(0);
    });

    it('M/M/1 path for serverCount=1', () => {
      const r = simulateNode(3, 5, 1);
      expect(r.utilization).toBeCloseTo(0.6);
      expect(r.avgSystemTime).toBeCloseTo(0.5);
    });

    it('M/M/c path for serverCount > 1', () => {
      const r = simulateNode(2, 1, 3);
      expect(r.utilization).toBeGreaterThan(0);
      expect(r.utilization).toBeLessThan(1);
    });

    it('returns all-Infinity when overloaded (rho >= 1)', () => {
      const r = simulateNode(10, 5, 1);
      expect(r.utilization).toBe(1);
      expect(r.avgQueueLength).toBe(Infinity);
      expect(r.avgWaitTime).toBe(Infinity);
    });

    it('throws for negative arrival rate', () => {
      expect(() => simulateNode(-1, 5)).toThrow(RangeError);
    });

    it('throws for non-positive service rate', () => {
      expect(() => simulateNode(1, 0)).toThrow(RangeError);
    });
  });
});
