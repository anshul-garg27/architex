import { describe, it, expect } from 'vitest';
import { estimateCapacity } from '@/lib/simulation/capacity-planner';
import type { CapacityInput } from '@/lib/simulation/capacity-planner';

/** Reference input: a mid-scale social media app. */
const REFERENCE_INPUT: CapacityInput = {
  dailyActiveUsers: 10_000_000,
  avgRequestsPerUserPerDay: 50,
  peakToAvgRatio: 3,
  readWriteRatio: 10,
  avgRequestSizeKB: 2,
  avgResponseSizeKB: 5,
  dataRetentionYears: 3,
};

describe('capacity-planner — estimateCapacity', () => {
  const estimate = estimateCapacity(REFERENCE_INPUT);

  // ── Traffic ───────────────────────────────────────────────

  it('computes avgRps from DAU and requests per user', () => {
    // 10M * 50 / 86400 ~ 5787.04
    expect(estimate.avgRps).toBeCloseTo(5787.04, 0);
  });

  it('computes peakRps as avgRps * peakToAvgRatio', () => {
    expect(estimate.peakRps).toBeCloseTo(estimate.avgRps * 3, 0);
  });

  // ── Bandwidth ─────────────────────────────────────────────

  it('computes positive inbound and outbound bandwidth', () => {
    expect(estimate.bandwidthInMBps).toBeGreaterThan(0);
    expect(estimate.bandwidthOutMBps).toBeGreaterThan(0);
  });

  it('outbound bandwidth > inbound when response > request size', () => {
    // avgResponseSizeKB (5) > avgRequestSizeKB (2)
    expect(estimate.bandwidthOutMBps).toBeGreaterThan(estimate.bandwidthInMBps);
  });

  // ── Storage ───────────────────────────────────────────────

  it('computes storage per year and total storage', () => {
    expect(estimate.storagePerYearTB).toBeGreaterThan(0);
    expect(estimate.totalStorageTB).toBeCloseTo(
      estimate.storagePerYearTB * REFERENCE_INPUT.dataRetentionYears,
      2,
    );
  });

  // ── Database ──────────────────────────────────────────────

  it('splits peak RPS into reads and writes using the ratio', () => {
    // readWriteRatio = 10, so writes = peak / 11, reads = 10 * peak / 11
    const expectedWrites = estimate.peakRps / 11;
    const expectedReads = (estimate.peakRps * 10) / 11;
    expect(estimate.dbWritesPerSec).toBeCloseTo(expectedWrites, 0);
    expect(estimate.dbReadsPerSec).toBeCloseTo(expectedReads, 0);
  });

  it('cache hit rate is between 0 and 1', () => {
    expect(estimate.estimatedCacheHitRate).toBeGreaterThan(0);
    expect(estimate.estimatedCacheHitRate).toBeLessThan(1);
  });

  it('dbReadsAfterCache is less than raw dbReadsPerSec', () => {
    expect(estimate.dbReadsAfterCache).toBeLessThan(estimate.dbReadsPerSec);
    expect(estimate.dbReadsAfterCache).toBeGreaterThan(0);
  });

  // ── Infrastructure ────────────────────────────────────────

  it('estimates at least 1 server', () => {
    expect(estimate.estimatedServers).toBeGreaterThanOrEqual(1);
  });

  it('monthly cost is positive', () => {
    expect(estimate.estimatedMonthlyCostUSD).toBeGreaterThan(0);
  });

  it('monthly cost includes 20% overhead on base server cost', () => {
    // costPerServer default is $150
    // baseCost = servers * 150, final = round(baseCost * 1.2)
    const baseCost = estimate.estimatedServers * 150;
    expect(estimate.estimatedMonthlyCostUSD).toBe(Math.round(baseCost * 1.2));
  });

  // ── Reference latencies ───────────────────────────────────

  it('includes positive reference latencies from constants', () => {
    expect(estimate.expectedDbLatencyMs).toBeGreaterThan(0);
    expect(estimate.expectedCacheLatencyMs).toBeGreaterThan(0);
    expect(estimate.expectedDcRttMs).toBeGreaterThan(0);
  });

  // ── Custom overrides ──────────────────────────────────────

  it('accepts custom rpsPerServer and costPerServerPerMonth', () => {
    const custom = estimateCapacity({
      ...REFERENCE_INPUT,
      rpsPerServer: 5000,
      costPerServerPerMonth: 300,
    });

    // With lower rpsPerServer, we need more servers
    expect(custom.estimatedServers).toBeGreaterThan(estimate.estimatedServers);
    // Cost per server is higher
    const baseCost = custom.estimatedServers * 300;
    expect(custom.estimatedMonthlyCostUSD).toBe(Math.round(baseCost * 1.2));
  });

  // ── Edge case: minimal input ──────────────────────────────

  it('handles a minimal single-user scenario', () => {
    const minimal = estimateCapacity({
      dailyActiveUsers: 1000,
      avgRequestsPerUserPerDay: 1,
      peakToAvgRatio: 1,
      readWriteRatio: 1,
      avgRequestSizeKB: 1,
      avgResponseSizeKB: 1,
      dataRetentionYears: 1,
    });

    expect(minimal.avgRps).toBeGreaterThan(0);
    expect(minimal.estimatedServers).toBe(1);
  });
});
