import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TrafficGenerator,
  poissonSample,
  generateRequests,
} from '../traffic-simulator';
import type { TrafficConfig } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(
  overrides: Partial<TrafficConfig> = {},
): TrafficConfig {
  return {
    requestsPerSecond: 100,
    pattern: 'constant',
    spikeMultiplier: 10,
    distribution: 'uniform',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('traffic-simulator', () => {
  const generator = new TrafficGenerator();

  // ── Constant pattern ───────────────────────────────────────────────────

  describe('constant pattern', () => {
    it('returns the same rate for every tick', () => {
      const config = makeConfig({ pattern: 'constant', requestsPerSecond: 50 });
      const tl = generator.generate(config, 1_000, 100);

      // 1s / 100ms = 10 ticks. Uniform distribution rounds deterministically.
      // Expected per tick: 50 * (100/1000) = 5
      for (const tick of tl.ticks) {
        expect(tick.requestCount).toBe(5);
      }
    });

    it('totalRequests matches expected for constant/uniform', () => {
      const config = makeConfig({ pattern: 'constant', requestsPerSecond: 200 });
      const tl = generator.generate(config, 1_000, 100);

      // 200 rps * 1s = 200 total
      expect(tl.totalRequests).toBe(200);
    });

    it('avgRps equals the configured rate for constant/uniform', () => {
      const config = makeConfig({ pattern: 'constant', requestsPerSecond: 100 });
      const tl = generator.generate(config, 2_000, 100);
      expect(tl.avgRps).toBeCloseTo(100, 0);
    });
  });

  // ── Ramp pattern (linear) ──────────────────────────────────────────────

  describe('ramp pattern', () => {
    it('produces increasing request counts over time', () => {
      const config = makeConfig({
        pattern: 'ramp',
        requestsPerSecond: 100,
      });
      const tl = generator.generate(config, 10_000, 1_000);

      // First tick at progress=0 => rate = 100 * (0.1 + 0) = 10 rps
      // Last tick at progress=0.9 => rate = 100 * (0.1 + 0.81) = 91 rps
      const firstRate = tl.ticks[0].rateRps;
      const lastRate = tl.ticks[tl.ticks.length - 1].rateRps;
      expect(lastRate).toBeGreaterThan(firstRate);
    });

    it('first tick rate is approximately 10% of base', () => {
      const config = makeConfig({
        pattern: 'ramp',
        requestsPerSecond: 100,
      });
      const tl = generator.generate(config, 10_000, 1_000);

      // At t=0, rate = baseRps * 0.1 = 10
      expect(tl.ticks[0].rateRps).toBeCloseTo(10, 0);
    });
  });

  // ── Sine-wave pattern ──────────────────────────────────────────────────

  describe('sine-wave pattern', () => {
    it('oscillates: rate varies across ticks', () => {
      const config = makeConfig({
        pattern: 'sine-wave',
        requestsPerSecond: 100,
      });
      const tl = generator.generate(config, 10_000, 1_000);

      const rates = tl.ticks.map((t) => t.rateRps);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      // Amplitude is 0.8 * base, so max ~ 180, min ~ 20
      expect(max).toBeGreaterThan(min);
      expect(max).toBeLessThanOrEqual(200); // 100 * 1.8 + rounding
    });

    it('rate at t=0 equals baseRps (sin(0) = 0)', () => {
      const config = makeConfig({
        pattern: 'sine-wave',
        requestsPerSecond: 100,
      });
      const tl = generator.generate(config, 10_000, 1_000);

      // sin(0) = 0, so rate = base * (1 + 0.8*0) = base = 100
      expect(tl.ticks[0].rateRps).toBeCloseTo(100, 0);
    });
  });

  // ── Spike pattern ──────────────────────────────────────────────────────

  describe('spike pattern', () => {
    it('creates a peak in the middle 10% of the simulation', () => {
      const config = makeConfig({
        pattern: 'spike',
        requestsPerSecond: 100,
        spikeMultiplier: 10,
      });
      const tl = generator.generate(config, 10_000, 100);
      // 100 ticks total. Spike at 45%-55% => ticks 45..55

      const normalRate = tl.ticks[0].rateRps;
      const spikeRate = tl.ticks[50].rateRps; // right in the middle

      expect(spikeRate).toBeGreaterThan(normalRate * 5);
    });

    it('peakRps reflects the spike', () => {
      const config = makeConfig({
        pattern: 'spike',
        requestsPerSecond: 100,
        spikeMultiplier: 10,
      });
      const tl = generator.generate(config, 10_000, 100);

      // Peak should be around 1000 rps (100 * 10)
      expect(tl.peakRps).toBeGreaterThanOrEqual(900);
    });

    it('non-spike ticks have the base rate', () => {
      const config = makeConfig({
        pattern: 'spike',
        requestsPerSecond: 100,
        spikeMultiplier: 10,
      });
      const tl = generator.generate(config, 10_000, 100);

      // Tick 0 is well outside the spike window
      expect(tl.ticks[0].rateRps).toBeCloseTo(100, 0);
    });
  });

  // ── All patterns return non-negative values ────────────────────────────

  describe('non-negative guarantees', () => {
    const patterns = ['constant', 'sine-wave', 'spike', 'ramp', 'random'] as const;

    for (const pattern of patterns) {
      it(`${pattern} pattern: all request counts are non-negative`, () => {
        const config = makeConfig({ pattern, distribution: 'uniform' });
        const tl = generator.generate(config, 5_000, 100);

        for (const tick of tl.ticks) {
          expect(tick.requestCount).toBeGreaterThanOrEqual(0);
        }
      });
    }

    it('totalRequests is non-negative for every pattern', () => {
      for (const pattern of patterns) {
        const config = makeConfig({ pattern, distribution: 'uniform' });
        const tl = generator.generate(config, 5_000, 100);
        expect(tl.totalRequests).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── poissonSample ──────────────────────────────────────────────────────

  describe('poissonSample', () => {
    it('returns 0 for lambda = 0', () => {
      expect(poissonSample(0)).toBe(0);
    });

    it('throws for negative lambda', () => {
      expect(() => poissonSample(-1)).toThrow(RangeError);
    });

    it('returns non-negative integer for positive lambda', () => {
      // Seed randomness for stability: run multiple samples
      for (let i = 0; i < 20; i++) {
        const val = poissonSample(5);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('uses normal approximation for large lambda (>= 30)', () => {
      // Just confirm it runs without error and gives non-negative results
      for (let i = 0; i < 10; i++) {
        const val = poissonSample(100);
        expect(val).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── generateRequests convenience function ──────────────────────────────

  describe('generateRequests', () => {
    it('returns a TrafficTimeline with correct tickMs', () => {
      const config = makeConfig();
      const tl = generateRequests(config, 5_000, 200);
      expect(tl.tickMs).toBe(200);
      expect(tl.durationMs).toBe(5_000);
    });

    it('defaults tickMs to 100 when omitted', () => {
      const config = makeConfig();
      const tl = generateRequests(config, 1_000);
      expect(tl.tickMs).toBe(100);
      expect(tl.ticks).toHaveLength(10);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('throws for non-positive duration', () => {
      expect(() => generator.generate(makeConfig(), 0, 100)).toThrow(RangeError);
      expect(() => generator.generate(makeConfig(), -1, 100)).toThrow(RangeError);
    });

    it('throws for non-positive tickMs', () => {
      expect(() => generator.generate(makeConfig(), 1_000, 0)).toThrow(RangeError);
    });

    it('handles very short durations (one tick)', () => {
      const tl = generator.generate(makeConfig(), 100, 100);
      expect(tl.ticks).toHaveLength(1);
    });

    it('handles zero requestsPerSecond', () => {
      const config = makeConfig({ requestsPerSecond: 0 });
      const tl = generator.generate(config, 1_000, 100);

      expect(tl.totalRequests).toBe(0);
      for (const tick of tl.ticks) {
        expect(tick.requestCount).toBe(0);
      }
    });
  });
});
