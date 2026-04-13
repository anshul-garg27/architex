/**
 * Back-of-Envelope Capacity Estimation Calculator
 *
 * Takes high-level product inputs (DAU, request patterns, data sizes) and
 * produces infrastructure estimates: RPS, bandwidth, storage, server count,
 * and approximate monthly cost.
 *
 * Uses real-world throughput and latency benchmarks from the constants files.
 */

import { THROUGHPUT } from '@/lib/constants/throughput-numbers';
import { LATENCY } from '@/lib/constants/latency-numbers';

// ---------------------------------------------------------------------------
// Input / Output Types
// ---------------------------------------------------------------------------

/** Input parameters for capacity estimation. */
export interface CapacityInput {
  /** Daily Active Users. */
  dailyActiveUsers: number;
  /** Average HTTP requests per user per day. */
  avgRequestsPerUserPerDay: number;
  /** Ratio of peak traffic to average traffic (e.g., 3 means peak = 3x avg). */
  peakToAvgRatio: number;
  /** Read-to-write ratio (e.g., 10 means 10 reads per 1 write). */
  readWriteRatio: number;
  /** Average request payload size in KB. */
  avgRequestSizeKB: number;
  /** Average response payload size in KB. */
  avgResponseSizeKB: number;
  /** Number of years to retain data. */
  dataRetentionYears: number;
  /** Requests per second a single server can handle. Defaults to Node.js Express benchmark. */
  rpsPerServer?: number;
  /** Estimated cost per server per month in USD. Defaults to $150 (c7g.xlarge). */
  costPerServerPerMonth?: number;
}

/** Complete capacity estimation output. */
export interface CapacityEstimate {
  // ---- Traffic ----

  /** Average requests per second across the day. */
  avgRps: number;
  /** Peak requests per second (avgRps * peakToAvgRatio). */
  peakRps: number;

  // ---- Bandwidth ----

  /** Average inbound bandwidth in MB/s. */
  bandwidthInMBps: number;
  /** Average outbound bandwidth in MB/s. */
  bandwidthOutMBps: number;

  // ---- Storage ----

  /** New storage generated per year in TB. */
  storagePerYearTB: number;
  /** Total storage required over the retention period in TB. */
  totalStorageTB: number;

  // ---- Database ----

  /** Peak database write operations per second. */
  dbWritesPerSec: number;
  /** Peak database read operations per second (before cache). */
  dbReadsPerSec: number;
  /** Estimated cache hit rate (0..1). */
  estimatedCacheHitRate: number;
  /** Effective peak DB reads after cache offloading. */
  dbReadsAfterCache: number;

  // ---- Infrastructure ----

  /** Estimated number of application servers needed for peak load. */
  estimatedServers: number;
  /** Estimated monthly infrastructure cost in USD. */
  estimatedMonthlyCostUSD: number;

  // ---- Reference latencies (from constants) ----

  /** Expected DB query latency for simple reads (ms). */
  expectedDbLatencyMs: number;
  /** Expected cache latency (ms). */
  expectedCacheLatencyMs: number;
  /** Expected same-datacenter RTT (ms). */
  expectedDcRttMs: number;
}

// ---------------------------------------------------------------------------
// Constants derived from benchmarks
// ---------------------------------------------------------------------------

/** Seconds in a day. */
const SECONDS_PER_DAY = 86_400;

/** Default RPS per server (Node.js Express from throughput benchmarks). */
const DEFAULT_RPS_PER_SERVER = THROUGHPUT.NODE_EXPRESS_RPS;

/** Default cost per server per month (approximate c7g.xlarge). */
const DEFAULT_COST_PER_SERVER_PER_MONTH = 150;

/**
 * Headroom factor: only use 70% of theoretical max capacity per server.
 * This accounts for GC pauses, health checks, connection overhead, etc.
 */
const CAPACITY_HEADROOM = 0.7;

/**
 * Estimate cache hit rate based on read-to-write ratio.
 *
 * Heuristic: higher read ratios benefit more from caching.
 *   - ratio 1:1  -> ~50% hit rate
 *   - ratio 5:1  -> ~75% hit rate
 *   - ratio 10:1 -> ~85% hit rate
 *   - ratio 100:1 -> ~95% hit rate
 *
 * Formula: hitRate = 1 - 1 / (1 + ln(ratio))
 *
 * @param readWriteRatio - Reads per write
 * @returns Estimated cache hit rate [0..1]
 */
function estimateCacheHitRate(readWriteRatio: number): number {
  if (readWriteRatio <= 0) return 0;
  return 1 - 1 / (1 + Math.log(readWriteRatio));
}

// ---------------------------------------------------------------------------
// Core estimation function
// ---------------------------------------------------------------------------

/**
 * Estimate infrastructure capacity requirements from high-level product inputs.
 *
 * The calculation follows the standard back-of-envelope methodology:
 *
 * 1. Compute average RPS = (DAU * reqPerUser) / 86,400
 * 2. Peak RPS = avgRPS * peakToAvgRatio
 * 3. Split into reads and writes using readWriteRatio
 * 4. Estimate bandwidth from request/response sizes * RPS
 * 5. Estimate storage from write volume * retention period
 * 6. Estimate cache hit rate and effective DB load
 * 7. Compute server count at peak with headroom
 * 8. Estimate cost from server count
 *
 * @param input - Capacity planning inputs
 * @returns Full capacity estimation with all metrics
 *
 * @example
 *   const estimate = estimateCapacity({
 *     dailyActiveUsers: 10_000_000,
 *     avgRequestsPerUserPerDay: 50,
 *     peakToAvgRatio: 3,
 *     readWriteRatio: 10,
 *     avgRequestSizeKB: 2,
 *     avgResponseSizeKB: 5,
 *     dataRetentionYears: 3,
 *   });
 */
export function estimateCapacity(input: CapacityInput): CapacityEstimate {
  const {
    dailyActiveUsers,
    avgRequestsPerUserPerDay,
    peakToAvgRatio,
    readWriteRatio,
    avgRequestSizeKB,
    avgResponseSizeKB,
    dataRetentionYears,
    rpsPerServer = DEFAULT_RPS_PER_SERVER,
    costPerServerPerMonth = DEFAULT_COST_PER_SERVER_PER_MONTH,
  } = input;

  // ---- Traffic ----
  const totalDailyRequests = dailyActiveUsers * avgRequestsPerUserPerDay;
  const avgRps = totalDailyRequests / SECONDS_PER_DAY;
  const peakRps = avgRps * peakToAvgRatio;

  // ---- Read/Write split ----
  // readWriteRatio = reads / writes, so for every (ratio + 1) requests,
  // `ratio` are reads and 1 is a write.
  const writeFraction = 1 / (readWriteRatio + 1);
  const readFraction = readWriteRatio / (readWriteRatio + 1);

  const dbWritesPerSec = peakRps * writeFraction;
  const dbReadsPerSec = peakRps * readFraction;

  // ---- Cache ----
  const estimatedCacheHitRate = estimateCacheHitRate(readWriteRatio);
  const dbReadsAfterCache = dbReadsPerSec * (1 - estimatedCacheHitRate);

  // ---- Bandwidth ----
  // At peak RPS, using average payload sizes
  const bandwidthInMBps = (peakRps * avgRequestSizeKB) / 1024;
  const bandwidthOutMBps = (peakRps * avgResponseSizeKB) / 1024;

  // ---- Storage ----
  // Only writes generate new data. Each write carries the request payload.
  const dailyWriteRequests = totalDailyRequests * writeFraction;
  const dailyStorageKB = dailyWriteRequests * avgRequestSizeKB;
  const dailyStorageTB = dailyStorageKB / (1024 * 1024 * 1024 * 1024); // KB -> TB
  const storagePerYearTB = dailyStorageTB * 365;
  const totalStorageTB = storagePerYearTB * dataRetentionYears;

  // ---- Servers ----
  const effectiveRpsPerServer = rpsPerServer * CAPACITY_HEADROOM;
  const estimatedServers = Math.ceil(peakRps / effectiveRpsPerServer);

  // ---- Cost ----
  // Base server cost + 20% overhead for load balancers, monitoring, etc.
  const baseServerCost = estimatedServers * costPerServerPerMonth;
  const estimatedMonthlyCostUSD = Math.round(baseServerCost * 1.2);

  // ---- Reference latencies from constants (convert from microseconds to ms) ----
  const expectedDbLatencyMs = LATENCY.POSTGRES_SIMPLE_QUERY / 1_000;
  const expectedCacheLatencyMs = LATENCY.REDIS_GET_NETWORK / 1_000;
  const expectedDcRttMs = LATENCY.SAME_DATACENTER_RTT / 1_000;

  return {
    avgRps: round2(avgRps),
    peakRps: round2(peakRps),
    bandwidthInMBps: round2(bandwidthInMBps),
    bandwidthOutMBps: round2(bandwidthOutMBps),
    storagePerYearTB: round4(storagePerYearTB),
    totalStorageTB: round4(totalStorageTB),
    dbWritesPerSec: round2(dbWritesPerSec),
    dbReadsPerSec: round2(dbReadsPerSec),
    estimatedCacheHitRate: round4(estimatedCacheHitRate),
    dbReadsAfterCache: round2(dbReadsAfterCache),
    estimatedServers,
    estimatedMonthlyCostUSD,
    expectedDbLatencyMs,
    expectedCacheLatencyMs,
    expectedDcRttMs,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a CapacityEstimate into a human-readable summary string.
 *
 * Produces a multi-line report suitable for display in a UI panel or
 * terminal output.
 *
 * @param estimate - The capacity estimate to format
 * @returns Multi-line string summary
 *
 * @example
 *   console.log(formatEstimate(estimateCapacity(input)));
 */
export function formatEstimate(estimate: CapacityEstimate): string {
  const lines: string[] = [
    '=== Capacity Estimation ===',
    '',
    '--- Traffic ---',
    `  Average RPS:          ${formatNum(estimate.avgRps)}`,
    `  Peak RPS:             ${formatNum(estimate.peakRps)}`,
    '',
    '--- Bandwidth (at peak) ---',
    `  Inbound:              ${formatNum(estimate.bandwidthInMBps)} MB/s`,
    `  Outbound:             ${formatNum(estimate.bandwidthOutMBps)} MB/s`,
    '',
    '--- Storage ---',
    `  Per Year:             ${formatStorage(estimate.storagePerYearTB)}`,
    `  Total (retention):    ${formatStorage(estimate.totalStorageTB)}`,
    '',
    '--- Database (at peak) ---',
    `  Writes/sec:           ${formatNum(estimate.dbWritesPerSec)}`,
    `  Reads/sec (raw):      ${formatNum(estimate.dbReadsPerSec)}`,
    `  Cache Hit Rate:       ${(estimate.estimatedCacheHitRate * 100).toFixed(1)}%`,
    `  Reads/sec (after $):  ${formatNum(estimate.dbReadsAfterCache)}`,
    '',
    '--- Infrastructure ---',
    `  App Servers:          ${estimate.estimatedServers}`,
    `  Monthly Cost:         $${estimate.estimatedMonthlyCostUSD.toLocaleString()}`,
    '',
    '--- Reference Latencies ---',
    `  DB Query:             ${estimate.expectedDbLatencyMs}ms`,
    `  Cache Lookup:         ${estimate.expectedCacheLatencyMs}ms`,
    `  Datacenter RTT:       ${estimate.expectedDcRttMs}ms`,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to 4 decimal places. */
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Format a number with SI suffixes for readability.
 *
 * @param n - Number to format
 * @returns Formatted string (e.g., "5.79K", "1.23M")
 */
function formatNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

/**
 * Format a storage value in TB with appropriate unit.
 *
 * @param tb - Value in terabytes
 * @returns Formatted string (e.g., "2.50 TB", "512.00 GB")
 */
function formatStorage(tb: number): string {
  if (tb >= 1) return `${tb.toFixed(2)} TB`;
  if (tb >= 0.001) return `${(tb * 1024).toFixed(2)} GB`;
  return `${(tb * 1024 * 1024).toFixed(2)} MB`;
}
