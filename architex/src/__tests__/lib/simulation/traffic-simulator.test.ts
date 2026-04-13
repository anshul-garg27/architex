import { describe, it, expect } from 'vitest';
import { TrafficGenerator } from '@/lib/simulation/traffic-simulator';

describe('Traffic simulator', () => {
  it('constant pattern generates a steady rate with uniform distribution', () => {
    const gen = new TrafficGenerator();
    const timeline = gen.generate(
      { requestsPerSecond: 100, pattern: 'constant', spikeMultiplier: 1, distribution: 'uniform' },
      5000,
      1000,
    );
    expect(timeline.ticks).toHaveLength(5);
    for (const tick of timeline.ticks) {
      expect(tick.requestCount).toBe(100);
    }
    expect(timeline.totalRequests).toBe(500);
  });

  it('reports correct avgRps and peakRps for constant traffic', () => {
    const gen = new TrafficGenerator();
    const timeline = gen.generate(
      { requestsPerSecond: 50, pattern: 'constant', spikeMultiplier: 1, distribution: 'uniform' },
      10000,
      1000,
    );
    expect(timeline.avgRps).toBeCloseTo(50, 0);
    expect(timeline.peakRps).toBeCloseTo(50, 0);
  });
});
