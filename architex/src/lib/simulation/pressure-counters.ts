/**
 * Pressure Counters (SIM-002)
 *
 * Tracks 35 distinct stress signals per simulation node. Each counter
 * increments when its trigger condition is met and decays by 1 per tick
 * otherwise (floor at 0). Enables threshold-based issue detection in the
 * issue taxonomy (SIM-003).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 35 named pressure counters tracked per node during simulation. */
export interface PressureCounters {
  // -- Compute (9) --
  cpuThrottleTicks: number;
  memoryPressureTicks: number;
  diskIoSaturationTicks: number;
  networkBandwidthSaturation: number;
  threadPoolSaturation: number;
  connectionPoolExhaustion: number;
  fileDescriptorPressure: number;
  gcPausePressure: number;
  swapUsageTicks: number;

  // -- OS-level (1) --
  iowaitTicks: number;

  // -- Network (7) --
  packetLossAccumulator: number;
  retransmissionRate: number;
  dnsResolutionFailures: number;
  tlsHandshakeFailures: number;
  connectionTimeoutAccumulator: number;
  halfOpenConnections: number;
  bandwidthThrottling: number;

  // -- Latency (1) --
  jitterAccumulator: number;

  // -- Data layer (7) --
  queryLatencySpikes: number;
  replicationLagTicks: number;
  lockContentionTicks: number;
  deadlockDetections: number;
  connectionPoolWaitTime: number;
  slowQueryAccumulator: number;
  indexMissPressure: number;

  // -- Queue / messaging (4) --
  queueDepthPressure: number;
  consumerLagTicks: number;
  messageRedeliveryRate: number;
  dlqOverflowTicks: number;

  // -- Cache (4) --
  cacheEvictionRate: number;
  cacheMissRatePressure: number;
  hotKeyPressure: number;
  memoryFragmentation: number;

  // -- Resilience (2) --
  circuitBreakerTrips: number;
  retryStormPressure: number;
}

/** Union type of all 35 counter names. */
export type PressureCounterName = keyof PressureCounters;

// ---------------------------------------------------------------------------
// Thresholds — when a counter exceeds its threshold an issue may fire
// ---------------------------------------------------------------------------

export const COUNTER_THRESHOLDS: Record<PressureCounterName, number> = {
  cpuThrottleTicks: 5,
  memoryPressureTicks: 5,
  diskIoSaturationTicks: 4,
  networkBandwidthSaturation: 4,
  threadPoolSaturation: 6,
  connectionPoolExhaustion: 5,
  fileDescriptorPressure: 4,
  gcPausePressure: 3,
  swapUsageTicks: 3,
  iowaitTicks: 4,
  packetLossAccumulator: 5,
  retransmissionRate: 4,
  dnsResolutionFailures: 3,
  tlsHandshakeFailures: 3,
  connectionTimeoutAccumulator: 4,
  halfOpenConnections: 5,
  bandwidthThrottling: 4,
  jitterAccumulator: 5,
  queryLatencySpikes: 4,
  replicationLagTicks: 3,
  lockContentionTicks: 4,
  deadlockDetections: 2,
  connectionPoolWaitTime: 5,
  slowQueryAccumulator: 4,
  indexMissPressure: 5,
  queueDepthPressure: 5,
  consumerLagTicks: 4,
  messageRedeliveryRate: 3,
  dlqOverflowTicks: 3,
  cacheEvictionRate: 4,
  cacheMissRatePressure: 5,
  hotKeyPressure: 4,
  memoryFragmentation: 5,
  circuitBreakerTrips: 3,
  retryStormPressure: 3,
};

/** All 35 counter names as an ordered array. */
export const ALL_COUNTER_NAMES: PressureCounterName[] = Object.keys(
  COUNTER_THRESHOLDS,
) as PressureCounterName[];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Create a new PressureCounters object with all 35 fields set to 0. */
export function createEmptyCounters(): PressureCounters {
  return {
    cpuThrottleTicks: 0,
    memoryPressureTicks: 0,
    diskIoSaturationTicks: 0,
    networkBandwidthSaturation: 0,
    threadPoolSaturation: 0,
    connectionPoolExhaustion: 0,
    fileDescriptorPressure: 0,
    gcPausePressure: 0,
    swapUsageTicks: 0,
    iowaitTicks: 0,
    packetLossAccumulator: 0,
    retransmissionRate: 0,
    dnsResolutionFailures: 0,
    tlsHandshakeFailures: 0,
    connectionTimeoutAccumulator: 0,
    halfOpenConnections: 0,
    bandwidthThrottling: 0,
    jitterAccumulator: 0,
    queryLatencySpikes: 0,
    replicationLagTicks: 0,
    lockContentionTicks: 0,
    deadlockDetections: 0,
    connectionPoolWaitTime: 0,
    slowQueryAccumulator: 0,
    indexMissPressure: 0,
    queueDepthPressure: 0,
    consumerLagTicks: 0,
    messageRedeliveryRate: 0,
    dlqOverflowTicks: 0,
    cacheEvictionRate: 0,
    cacheMissRatePressure: 0,
    hotKeyPressure: 0,
    memoryFragmentation: 0,
    circuitBreakerTrips: 0,
    retryStormPressure: 0,
  };
}

// ---------------------------------------------------------------------------
// Update logic (pure function)
// ---------------------------------------------------------------------------

/** Metadata passed to updateCounters for a single node on a single tick. */
export interface CounterUpdateInput {
  nodeId: string;
  componentType: string;
  utilization: number;
  queueDepth: number;
  latencyMs: number;
  errorRate: number;
  hasChaos: boolean;
  chaosIds: string[];
  tick: number;
}

/**
 * Pure function: computes the next set of pressure counters for a node.
 *
 * For each of the 35 counters, if the specific trigger condition is met the
 * counter increments by 1; otherwise it decays by 1 (floor at 0). The input
 * PressureCounters object is never mutated.
 */
export function updateCounters(
  prev: PressureCounters,
  input: CounterUpdateInput,
): PressureCounters {
  const {
    componentType,
    utilization,
    queueDepth,
    latencyMs,
    errorRate,
    hasChaos,
    chaosIds,
  } = input;

  const ct = componentType.toLowerCase();

  // Helper: increment if condition true, else decay
  const inc = (current: number, condition: boolean): number =>
    condition ? current + 1 : Math.max(0, current - 1);

  const isDb = ct.includes('database') || ct.includes('db') || ct === 'postgres' || ct === 'mysql' || ct === 'mongo';
  const isCache = ct.includes('cache') || ct.includes('redis') || ct.includes('memcached');
  const isQueue = ct.includes('queue') || ct.includes('kafka') || ct.includes('pub-sub') || ct.includes('event-bus');
  const isServer = ct.includes('server') || ct.includes('service') || ct.includes('gateway') || ct.includes('worker');

  return {
    // -- Compute --
    cpuThrottleTicks: inc(prev.cpuThrottleTicks, utilization > 0.8),
    memoryPressureTicks: inc(prev.memoryPressureTicks, utilization > 0.85),
    diskIoSaturationTicks: inc(prev.diskIoSaturationTicks, (isDb || ct.includes('storage')) && utilization > 0.75),
    networkBandwidthSaturation: inc(prev.networkBandwidthSaturation, utilization > 0.9 && (ct.includes('cdn') || ct.includes('load-balancer') || ct.includes('proxy'))),
    threadPoolSaturation: inc(prev.threadPoolSaturation, queueDepth > 10 && isServer),
    connectionPoolExhaustion: inc(prev.connectionPoolExhaustion, queueDepth > 20 && (isDb || isServer)),
    fileDescriptorPressure: inc(prev.fileDescriptorPressure, queueDepth > 50 && isServer),
    gcPausePressure: inc(prev.gcPausePressure, latencyMs > 200 && utilization > 0.7 && isServer),
    swapUsageTicks: inc(prev.swapUsageTicks, utilization > 0.95),

    // -- OS-level --
    iowaitTicks: inc(prev.iowaitTicks, isDb && utilization > 0.7 && latencyMs > 100),

    // -- Network --
    packetLossAccumulator: inc(prev.packetLossAccumulator, hasChaos && chaosIds.includes('packet-loss')),
    retransmissionRate: inc(prev.retransmissionRate, hasChaos && (chaosIds.includes('packet-loss') || chaosIds.includes('bandwidth-throttle'))),
    dnsResolutionFailures: inc(prev.dnsResolutionFailures, hasChaos && chaosIds.includes('dns-failure')),
    tlsHandshakeFailures: inc(prev.tlsHandshakeFailures, hasChaos && chaosIds.includes('certificate-expiry')),
    connectionTimeoutAccumulator: inc(prev.connectionTimeoutAccumulator, latencyMs > 5000 || (hasChaos && chaosIds.includes('api-timeout'))),
    halfOpenConnections: inc(prev.halfOpenConnections, hasChaos && (chaosIds.includes('network-partition') || chaosIds.includes('node-crash'))),
    bandwidthThrottling: inc(prev.bandwidthThrottling, hasChaos && chaosIds.includes('bandwidth-throttle')),

    // -- Latency --
    jitterAccumulator: inc(prev.jitterAccumulator, latencyMs > 500 && utilization > 0.6),

    // -- Data layer --
    queryLatencySpikes: inc(prev.queryLatencySpikes, isDb && latencyMs > 500),
    replicationLagTicks: inc(prev.replicationLagTicks, isDb && (latencyMs > 200 || (hasChaos && chaosIds.includes('replication-lag')))),
    lockContentionTicks: inc(prev.lockContentionTicks, isDb && utilization > 0.8 && queueDepth > 5),
    deadlockDetections: inc(prev.deadlockDetections, hasChaos && chaosIds.includes('deadlock')),
    connectionPoolWaitTime: inc(prev.connectionPoolWaitTime, isDb && queueDepth > 15),
    slowQueryAccumulator: inc(prev.slowQueryAccumulator, isDb && latencyMs > 1000),
    indexMissPressure: inc(prev.indexMissPressure, isDb && latencyMs > 300 && utilization > 0.5),

    // -- Queue / messaging --
    queueDepthPressure: inc(prev.queueDepthPressure, (isQueue || queueDepth > 10)),
    consumerLagTicks: inc(prev.consumerLagTicks, isQueue && queueDepth > 20),
    messageRedeliveryRate: inc(prev.messageRedeliveryRate, isQueue && errorRate > 0.1),
    dlqOverflowTicks: inc(prev.dlqOverflowTicks, isQueue && errorRate > 0.3),

    // -- Cache --
    cacheEvictionRate: inc(prev.cacheEvictionRate, isCache && utilization > 0.9),
    cacheMissRatePressure: inc(prev.cacheMissRatePressure, isCache && utilization > 0.7 && latencyMs > 50),
    hotKeyPressure: inc(prev.hotKeyPressure, (isCache || isDb) && (hasChaos && chaosIds.includes('hot-key'))),
    memoryFragmentation: inc(prev.memoryFragmentation, isCache && utilization > 0.85),

    // -- Resilience --
    circuitBreakerTrips: inc(prev.circuitBreakerTrips, errorRate > 0.5 || (hasChaos && chaosIds.includes('api-down'))),
    retryStormPressure: inc(prev.retryStormPressure, hasChaos && chaosIds.includes('retry-storm')),
  };
}
