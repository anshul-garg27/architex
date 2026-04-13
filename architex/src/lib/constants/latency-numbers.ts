/**
 * Latency Numbers Every Engineer Should Know (2025 Edition)
 *
 * Based on Jeff Dean's original numbers, updated for modern hardware.
 * All values normalized to MICROSECONDS for consistent arithmetic.
 *
 * Sources:
 *  - Original: Jeff Dean, "Latency Numbers Every Programmer Should Know"
 *  - Hardware updates: Intel/AMD 2024-2025 specs, NVMe Gen5, DDR5
 *  - Cloud/service numbers: AWS/GCP benchmarks and public post-mortems
 */

// ---------------------------------------------------------------------------
// Core latency table (all values in microseconds)
// ---------------------------------------------------------------------------

export const LATENCY = {
  // ---- CPU & Memory ----

  /** L1 cache reference (~4 CPU cycles on modern cores) */
  L1_CACHE_REF: 0.0005,

  /** Branch mispredict (~3ns on modern branch predictors) */
  BRANCH_MISPREDICT: 0.003,

  /** L2 cache reference (~7ns, ~14 cycles) */
  L2_CACHE_REF: 0.007,

  /** Mutex lock/unlock (uncontended, ~17ns on Linux futex) */
  MUTEX_LOCK_UNLOCK: 0.017,

  /** Main memory reference (DDR5-5600, ~100ns CAS latency) */
  MAIN_MEMORY_REF: 0.1,

  // ---- Storage ----

  /** NVMe SSD random 4K read (~16us, Gen5 NVMe) */
  SSD_RANDOM_READ: 16,

  /** NVMe SSD sequential read 1 MB (~49us at ~20 GB/s Gen5) */
  SSD_SEQ_1MB: 49,

  /** HDD random seek + read (~2ms, 7200 RPM) */
  HDD_RANDOM_READ: 2_000,

  /** HDD sequential read 1 MB (~825us at ~200 MB/s) */
  HDD_SEQ_1MB: 825,

  // ---- Network ----

  /** Round-trip within the same datacenter / AZ (~0.5ms) */
  SAME_DATACENTER_RTT: 500,

  /** Cross-region round-trip, e.g. us-east-1 to us-west-2 (~50ms) */
  CROSS_REGION_RTT: 50_000,

  /** Cross-continent round-trip, e.g. US to Europe (~150ms) */
  CROSS_CONTINENT_RTT: 150_000,

  /** TCP packet round-trip within same city (~0.5ms) */
  INTRA_CITY_RTT: 500,

  /** Typical ISP last-mile latency (~5ms) */
  ISP_LAST_MILE: 5_000,

  // ---- Databases & Caches ----

  /** Redis GET on localhost (~0.2ms / 200us) */
  REDIS_GET: 200,

  /** Redis GET over network within datacenter (~0.5ms) */
  REDIS_GET_NETWORK: 500,

  /** PostgreSQL simple indexed SELECT (~1ms) */
  POSTGRES_SIMPLE_QUERY: 1_000,

  /** PostgreSQL complex JOIN / aggregate (~50ms) */
  POSTGRES_COMPLEX_QUERY: 50_000,

  /** MySQL simple indexed SELECT (~1ms) */
  MYSQL_SIMPLE_QUERY: 1_000,

  /** MongoDB find by _id (~0.5ms) */
  MONGODB_FIND_BY_ID: 500,

  // ---- Cloud Services ----

  /** Kafka produce + ack (acks=1, ~5ms) */
  KAFKA_PUBLISH: 5_000,

  /** AWS S3 GET object first byte (~50ms) */
  S3_GET_FIRST_BYTE: 50_000,

  /** AWS S3 PUT object (~100ms) */
  S3_PUT: 100_000,

  /** AWS Lambda cold start (Node.js/Python runtime, ~200ms) */
  LAMBDA_COLD_START: 200_000,

  /** AWS Lambda warm invocation (~5ms) */
  LAMBDA_WARM: 5_000,

  /** CDN edge cache hit (~10ms from user) */
  CDN_EDGE_HIT: 10_000,

  /** CDN edge cache miss (origin fetch, ~80ms) */
  CDN_EDGE_MISS: 80_000,

  /** DNS lookup (uncached, ~20ms) */
  DNS_LOOKUP: 20_000,

  /** TLS handshake (~30ms, TLS 1.3 0-RTT excluded) */
  TLS_HANDSHAKE: 30_000,

  /** gRPC unary call within datacenter (~1ms) */
  GRPC_UNARY_DATACENTER: 1_000,
} as const;

/** Union of all latency keys */
export type LatencyKey = keyof typeof LATENCY;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Convert a value in microseconds to a human-readable string.
 *
 * @example
 *   formatLatency(0.0005)  // "0.5ns"
 *   formatLatency(200)     // "200us"
 *   formatLatency(50_000)  // "50ms"
 *   formatLatency(2_000_000) // "2s"
 */
export function formatLatency(microseconds: number): string {
  const abs = Math.abs(microseconds);

  if (abs < 0.001) {
    // Sub-nanosecond — show in nanoseconds with decimals
    return `${+(microseconds * 1000).toPrecision(3)}ns`;
  }
  if (abs < 1) {
    // Nanosecond range
    const ns = microseconds * 1000;
    return `${+ns.toPrecision(3)}ns`;
  }
  if (abs < 1_000) {
    // Microsecond range
    return `${+microseconds.toPrecision(3)}us`;
  }
  if (abs < 1_000_000) {
    // Millisecond range
    const ms = microseconds / 1_000;
    return `${+ms.toPrecision(3)}ms`;
  }
  // Seconds
  const s = microseconds / 1_000_000;
  return `${+s.toPrecision(3)}s`;
}

/**
 * Return a formatted label for a known latency key.
 *
 * @example
 *   formatLatencyEntry("REDIS_GET") // "Redis GET: 200us"
 */
export function formatLatencyEntry(key: LatencyKey): string {
  const label = key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${label}: ${formatLatency(LATENCY[key])}`;
}

/**
 * Return all latencies sorted from fastest to slowest, formatted.
 */
export function getAllLatenciesSorted(): Array<{
  key: LatencyKey;
  microseconds: number;
  display: string;
}> {
  return (Object.keys(LATENCY) as LatencyKey[])
    .map((key) => ({
      key,
      microseconds: LATENCY[key],
      display: formatLatencyEntry(key),
    }))
    .sort((a, b) => a.microseconds - b.microseconds);
}

/**
 * Compare two latency values and return how many times slower b is than a.
 *
 * @example
 *   latencyRatio("L1_CACHE_REF", "MAIN_MEMORY_REF") // 200
 */
export function latencyRatio(faster: LatencyKey, slower: LatencyKey): number {
  return LATENCY[slower] / LATENCY[faster];
}

/**
 * Convert microseconds to another unit explicitly.
 */
export function convertLatency(
  microseconds: number,
  to: 'ns' | 'us' | 'ms' | 's',
): number {
  switch (to) {
    case 'ns':
      return microseconds * 1_000;
    case 'us':
      return microseconds;
    case 'ms':
      return microseconds / 1_000;
    case 's':
      return microseconds / 1_000_000;
  }
}
