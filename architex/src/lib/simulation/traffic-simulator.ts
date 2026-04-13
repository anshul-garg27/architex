/**
 * Traffic Generation Engine
 *
 * Generates realistic request arrival patterns based on TrafficConfig from
 * the simulation store. Supports five traffic shapes: constant, sine-wave,
 * spike, ramp, and random (Poisson-distributed).
 *
 * All time values are in MILLISECONDS.
 */

import type { TrafficConfig } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single tick of generated traffic. */
export interface TrafficTick {
  /** Tick index (0-based). */
  tickIndex: number;
  /** Timestamp offset from simulation start (ms). */
  timestampMs: number;
  /** Number of requests arriving in this tick. */
  requestCount: number;
  /** Instantaneous rate for this tick (requests per second). */
  rateRps: number;
}

/** Complete timeline of traffic ticks for the simulation run. */
export interface TrafficTimeline {
  /** Array of traffic ticks in chronological order. */
  ticks: TrafficTick[];
  /** Total duration of the simulation (ms). */
  durationMs: number;
  /** Duration of each tick (ms). */
  tickMs: number;
  /** Total number of requests across all ticks. */
  totalRequests: number;
  /** Peak requests-per-second observed across all ticks. */
  peakRps: number;
  /** Average requests-per-second across all ticks. */
  avgRps: number;
}

// ---------------------------------------------------------------------------
// Poisson sampling
// ---------------------------------------------------------------------------

/**
 * Sample from a Poisson distribution using Knuth's algorithm.
 *
 * For a given expected value lambda, returns a random non-negative integer
 * representing the number of events in an interval. The probability of
 * observing k events is: P(k) = (lambda^k * e^-lambda) / k!
 *
 * For large lambda (>= 30), uses a normal approximation for performance:
 *   N(lambda, lambda) rounded to nearest non-negative integer.
 *
 * @param lambda - Expected number of events (must be >= 0)
 * @returns Random sample from Poisson(lambda)
 */
export function poissonSample(lambda: number): number {
  if (lambda < 0) throw new RangeError('Lambda must be non-negative');
  if (lambda === 0) return 0;

  // Normal approximation for large lambda (CLT)
  if (lambda >= 30) {
    const u1 = Math.max(Number.EPSILON, Math.random());
    const u2 = Math.max(Number.EPSILON, Math.random());
    // Box-Muller transform for standard normal
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }

  // Knuth's algorithm for small lambda
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

// ---------------------------------------------------------------------------
// Rate functions for each traffic pattern
// ---------------------------------------------------------------------------

/**
 * Compute the target requests-per-second at a given point in time for
 * a specific traffic pattern.
 *
 * @param config      - Traffic configuration
 * @param elapsedMs   - Milliseconds since simulation start
 * @param durationMs  - Total simulation duration (ms)
 * @returns Target RPS at this moment
 */
function computeTargetRps(
  config: TrafficConfig,
  elapsedMs: number,
  durationMs: number,
): number {
  const baseRps = config.requestsPerSecond;

  switch (config.pattern) {
    case 'constant':
      return baseRps;

    case 'sine-wave': {
      // One full cycle over the duration, oscillating between 0.2x and 1.8x base
      const phase = (2 * Math.PI * elapsedMs) / durationMs;
      const amplitude = 0.8;
      return baseRps * (1 + amplitude * Math.sin(phase));
    }

    case 'spike': {
      // Normal rate with a spike in the middle 10% of the simulation
      const progress = elapsedMs / durationMs;
      const spikeStart = 0.45;
      const spikeEnd = 0.55;
      if (progress >= spikeStart && progress <= spikeEnd) {
        return baseRps * config.spikeMultiplier;
      }
      return baseRps;
    }

    case 'ramp': {
      // Linear ramp from 10% to 100% of base RPS over the full duration
      const progress = elapsedMs / durationMs;
      return baseRps * (0.1 + 0.9 * progress);
    }

    case 'random':
      // Base rate used as the mean; actual count drawn from Poisson per tick
      return baseRps;

    default: {
      // Exhaustive check — ensures all pattern values are handled
      const _exhaustive: never = config.pattern;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Traffic Generator
// ---------------------------------------------------------------------------

/**
 * Traffic generator that produces a timeline of request arrivals.
 *
 * Usage:
 *   const generator = new TrafficGenerator();
 *   const timeline = generator.generate(trafficConfig, 60_000, 100);
 *   // => 600 ticks, each representing 100ms of traffic
 */
export class TrafficGenerator {
  /**
   * Generate a complete traffic timeline.
   *
   * Divides the total simulation duration into fixed-size ticks and
   * computes the number of request arrivals per tick based on the
   * configured pattern and distribution.
   *
   * @param config     - Traffic configuration (rate, pattern, distribution)
   * @param durationMs - Total simulation duration in milliseconds
   * @param tickMs     - Duration of each tick in milliseconds (granularity)
   * @returns Complete traffic timeline with per-tick request counts
   *
   * @example
   *   const gen = new TrafficGenerator();
   *   const tl = gen.generate(
   *     { requestsPerSecond: 100, pattern: 'constant', spikeMultiplier: 10, distribution: 'poisson' },
   *     10_000,  // 10 seconds
   *     100      // 100ms ticks
   *   );
   */
  generate(
    config: TrafficConfig,
    durationMs: number,
    tickMs: number,
  ): TrafficTimeline {
    if (durationMs <= 0) throw new RangeError('Duration must be positive');
    if (tickMs <= 0) throw new RangeError('Tick size must be positive');

    const tickCount = Math.ceil(durationMs / tickMs);
    const ticks: TrafficTick[] = [];

    let totalRequests = 0;
    let peakRps = 0;

    for (let i = 0; i < tickCount; i++) {
      const elapsedMs = i * tickMs;
      const targetRps = computeTargetRps(config, elapsedMs, durationMs);

      // Expected requests in this tick
      const expectedInTick = targetRps * (tickMs / 1000);

      // Apply distribution to get actual request count
      const requestCount = this.applyDistribution(
        expectedInTick,
        config.distribution,
      );

      // Actual RPS for this tick
      const rateRps = (requestCount / tickMs) * 1000;

      ticks.push({
        tickIndex: i,
        timestampMs: elapsedMs,
        requestCount,
        rateRps,
      });

      totalRequests += requestCount;
      peakRps = Math.max(peakRps, rateRps);
    }

    const avgRps = tickCount > 0
      ? (totalRequests / (tickCount * tickMs)) * 1000
      : 0;

    return {
      ticks,
      durationMs,
      tickMs,
      totalRequests,
      peakRps,
      avgRps,
    };
  }

  /**
   * Apply the chosen distribution to convert an expected count into an
   * actual (possibly stochastic) request count.
   *
   * - "poisson": Draw from Poisson(expected). Realistic for independent arrivals.
   * - "normal": Draw from Normal(expected, sqrt(expected)), clamped to >= 0.
   * - "uniform": Deterministic (round the expected value). No randomness.
   *
   * @param expected     - Expected number of requests in this tick
   * @param distribution - Distribution type
   * @returns Actual integer request count (>= 0)
   */
  private applyDistribution(
    expected: number,
    distribution: TrafficConfig['distribution'],
  ): number {
    switch (distribution) {
      case 'poisson':
        return poissonSample(expected);

      case 'normal': {
        // Box-Muller transform for normal distribution
        const u1 = Math.max(Number.EPSILON, Math.random());
        const u2 = Math.max(Number.EPSILON, Math.random());
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const stddev = Math.sqrt(expected);
        return Math.max(0, Math.round(expected + stddev * z));
      }

      case 'uniform':
        return Math.round(expected);

      default: {
        const _exhaustive: never = distribution;
        return _exhaustive;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience function
// ---------------------------------------------------------------------------

/**
 * Generate a traffic timeline using default TrafficGenerator.
 *
 * @param config     - Traffic configuration
 * @param durationMs - Total simulation duration (ms)
 * @param tickMs     - Tick granularity (ms). Defaults to 100ms.
 * @returns Traffic timeline
 */
export function generateRequests(
  config: TrafficConfig,
  durationMs: number,
  tickMs: number = 100,
): TrafficTimeline {
  const generator = new TrafficGenerator();
  return generator.generate(config, durationMs, tickMs);
}
