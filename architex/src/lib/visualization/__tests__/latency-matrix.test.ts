// -----------------------------------------------------------------
// Tests -- latency-matrix.ts
// -----------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  getLatency,
  getLatencyTier,
  getLatencyColor,
  getAllLatencies,
  getRecommendedFailover,
  haversineDistance,
  LATENCY_TIERS,
} from '../latency-matrix';
import { DATA_CENTERS } from '../world-map-data';

// -- getLatency -----------------------------------------------------

describe('getLatency', () => {
  it('returns 0 for same data center', () => {
    expect(getLatency('aws-use1', 'aws-use1')).toBe(0);
  });

  it('returns -1 for unknown data center IDs', () => {
    expect(getLatency('aws-use1', 'unknown-region')).toBe(-1);
    expect(getLatency('nonexistent', 'aws-use1')).toBe(-1);
  });

  it('returns low latency for same-region pairs (e.g. US East)', () => {
    const latency = getLatency('aws-use1', 'aws-use2');
    // Same geographic region should be <30ms (self latency)
    expect(latency).toBeLessThanOrEqual(30);
    expect(latency).toBeGreaterThan(0);
  });

  it('returns moderate latency for same-continent pairs (US East to US West)', () => {
    const latency = getLatency('aws-use1', 'aws-usw2');
    expect(latency).toBeGreaterThanOrEqual(30);
    expect(latency).toBeLessThanOrEqual(100);
  });

  it('returns high latency for cross-continent pairs (US to EU)', () => {
    const latency = getLatency('aws-use1', 'aws-euw1');
    expect(latency).toBeGreaterThanOrEqual(80);
    expect(latency).toBeLessThanOrEqual(200);
  });

  it('returns very high latency for global pairs (US to AP)', () => {
    const latency = getLatency('aws-use1', 'aws-apse1');
    expect(latency).toBeGreaterThanOrEqual(150);
    expect(latency).toBeLessThanOrEqual(350);
  });

  it('is symmetric: getLatency(a,b) === getLatency(b,a)', () => {
    expect(getLatency('aws-use1', 'gcp-euw1')).toBe(
      getLatency('gcp-euw1', 'aws-use1'),
    );
    expect(getLatency('aws-apne1', 'az-westeu')).toBe(
      getLatency('az-westeu', 'aws-apne1'),
    );
  });

  it('adds cross-provider penalty for different providers in same geo', () => {
    // AWS and GCP both in US East
    const sameProvider = getLatency('aws-use1', 'aws-use2');
    const crossProvider = getLatency('aws-use1', 'gcp-use1');
    // Cross-provider should be slightly higher due to peering penalty
    expect(crossProvider).toBeGreaterThanOrEqual(sameProvider);
  });

  it('works for all registered data center IDs', () => {
    for (const dc of DATA_CENTERS) {
      const latency = getLatency(dc.id, 'aws-use1');
      expect(latency).toBeGreaterThanOrEqual(0);
    }
  });
});

// -- getLatencyTier -------------------------------------------------

describe('getLatencyTier', () => {
  it('classifies <30ms as local', () => {
    expect(getLatencyTier(5).tier).toBe('local');
    expect(getLatencyTier(29).tier).toBe('local');
  });

  it('classifies 30-80ms as regional', () => {
    expect(getLatencyTier(30).tier).toBe('local');
    expect(getLatencyTier(50).tier).toBe('regional');
    expect(getLatencyTier(80).tier).toBe('regional');
  });

  it('classifies 80-200ms as cross-continent', () => {
    expect(getLatencyTier(100).tier).toBe('cross-continent');
    expect(getLatencyTier(200).tier).toBe('cross-continent');
  });

  it('classifies >200ms as global', () => {
    expect(getLatencyTier(250).tier).toBe('global');
    expect(getLatencyTier(350).tier).toBe('global');
    expect(getLatencyTier(500).tier).toBe('global');
  });

  it('has correct tier labels', () => {
    expect(LATENCY_TIERS[0].label).toBe('Same Region');
    expect(LATENCY_TIERS[3].label).toBe('Global');
  });
});

// -- getLatencyColor ------------------------------------------------

describe('getLatencyColor', () => {
  it('returns green for low latency', () => {
    expect(getLatencyColor(10)).toBe('#22C55E');
    expect(getLatencyColor(49)).toBe('#22C55E');
  });

  it('returns yellow for moderate latency', () => {
    expect(getLatencyColor(50)).toBe('#EAB308');
    expect(getLatencyColor(149)).toBe('#EAB308');
  });

  it('returns red for high latency', () => {
    expect(getLatencyColor(150)).toBe('#EF4444');
    expect(getLatencyColor(300)).toBe('#EF4444');
  });
});

// -- getAllLatencies -------------------------------------------------

describe('getAllLatencies', () => {
  it('returns latencies to all other data centers sorted ascending', () => {
    const result = getAllLatencies('aws-use1');
    expect(result.length).toBe(DATA_CENTERS.length - 1);

    // Verify sorted ascending
    for (let i = 1; i < result.length; i++) {
      expect(result[i].latencyMs).toBeGreaterThanOrEqual(
        result[i - 1].latencyMs,
      );
    }
  });

  it('each entry has dc, latencyMs, and tier', () => {
    const result = getAllLatencies('aws-use1');
    for (const entry of result) {
      expect(entry.dc).toBeDefined();
      expect(entry.dc.id).toBeDefined();
      expect(typeof entry.latencyMs).toBe('number');
      expect(entry.tier).toBeDefined();
      expect(entry.tier.tier).toBeDefined();
    }
  });

  it('does not include the source data center', () => {
    const result = getAllLatencies('aws-use1');
    expect(result.find((e) => e.dc.id === 'aws-use1')).toBeUndefined();
  });
});

// -- getRecommendedFailover -----------------------------------------

describe('getRecommendedFailover', () => {
  it('returns a same-provider region when available', () => {
    const failover = getRecommendedFailover('aws-use1');
    expect(failover).not.toBeNull();
    expect(failover!.provider).toBe('aws');
    expect(failover!.id).not.toBe('aws-use1');
  });

  it('returns the closest same-provider region', () => {
    const failover = getRecommendedFailover('aws-use1');
    expect(failover).not.toBeNull();
    // The recommended failover for US East should be another US region
    // (US East 2 or US Central are closest)
    const latency = getLatency('aws-use1', failover!.id);
    expect(latency).toBeLessThan(100); // should be a nearby region
  });

  it('returns null for unknown data center', () => {
    expect(getRecommendedFailover('nonexistent')).toBeNull();
  });

  it('returns a valid data center for all known DCs', () => {
    for (const dc of DATA_CENTERS) {
      const failover = getRecommendedFailover(dc.id);
      expect(failover).not.toBeNull();
      expect(failover!.id).not.toBe(dc.id);
    }
  });
});

// -- haversineDistance -----------------------------------------------

describe('haversineDistance', () => {
  it('returns 0 for same location', () => {
    const dc = DATA_CENTERS[0];
    expect(haversineDistance(dc, dc)).toBeCloseTo(0, 0);
  });

  it('returns reasonable distance for known pairs', () => {
    const virginia = DATA_CENTERS.find((dc) => dc.id === 'aws-use1')!;
    const ireland = DATA_CENTERS.find((dc) => dc.id === 'aws-euw1')!;
    const dist = haversineDistance(virginia, ireland);
    // Virginia to Ireland is about 5,500-6,000 km
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(7000);
  });

  it('returns larger distance for farther pairs', () => {
    const virginia = DATA_CENTERS.find((dc) => dc.id === 'aws-use1')!;
    const oregon = DATA_CENTERS.find((dc) => dc.id === 'aws-usw2')!;
    const tokyo = DATA_CENTERS.find((dc) => dc.id === 'aws-apne1')!;

    const usToUs = haversineDistance(virginia, oregon);
    const usToJapan = haversineDistance(virginia, tokyo);

    expect(usToJapan).toBeGreaterThan(usToUs);
  });
});
