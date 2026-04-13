/**
 * Cost Model (SIM-006)
 *
 * Multi-dimensional cost calculator that computes infrastructure cost
 * estimates for each node and the entire topology. Supports live cost
 * tracking during simulation with compute, storage, transfer, replication,
 * and sharding dimensions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for computing a node's cost. */
export interface CostModelInput {
  componentType: string;
  replicas: number;
  shards: number;
  storageGb: number;
  transferGbPerHour: number;
  utilization: number;
  region?: string;
}

/** Itemized cost breakdown for a single node or topology. */
export interface CostBreakdown {
  computePerHour: number;
  storagePerHour: number;
  transferPerHour: number;
  replicationMultiplier: number;
  shardingMultiplier: number;
  totalPerHour: number;
  totalPerMonth: number;
}

/** Live cost tracking state accumulated during simulation. */
export interface LiveCostState {
  currentHourlyRate: number;
  accumulatedCost: number;
  projectedMonthlyCost: number;
  costByNode: Map<string, number>;
}

// ---------------------------------------------------------------------------
// Base cost table (~75 component types)
// ---------------------------------------------------------------------------

/** Base hourly compute cost per component type (USD/hr). */
export const BASE_COST_PER_HOUR: Record<string, number> = {
  // -- Load balancing --
  'load-balancer': 0.03,
  'load-balancer-l4': 0.02,
  'load-balancer-l7': 0.04,
  'reverse-proxy': 0.02,
  'api-gateway': 0.15,
  'service-mesh': 0.05,

  // -- Compute --
  'web-server': 0.08,
  'app-server': 0.10,
  'serverless': 0.05,
  'worker': 0.08,
  'batch-processor': 0.12,
  'stream-processor': 0.15,
  'container': 0.06,
  'vm-instance': 0.10,

  // -- Databases --
  'database': 0.25,
  'postgres': 0.25,
  'postgres-primary': 0.25,
  'postgres-replica': 0.18,
  'mysql': 0.22,
  'mysql-primary': 0.22,
  'mysql-replica': 0.16,
  'document-db': 0.30,
  'mongodb': 0.30,
  'wide-column': 0.35,
  'cassandra': 0.35,
  'graph-db': 0.40,
  'neo4j': 0.40,
  'timeseries-db': 0.20,
  'influxdb': 0.20,
  'vector-db': 0.45,
  'newSQL': 0.35,
  'cockroachdb': 0.35,

  // -- Cache --
  'cache': 0.08,
  'redis': 0.08,
  'redis-cache': 0.08,
  'redis-cluster': 0.15,
  'memcached': 0.06,

  // -- Messaging --
  'message-queue': 0.10,
  'rabbitmq': 0.10,
  'kafka': 0.20,
  'kafka-broker': 0.20,
  'pub-sub': 0.08,
  'event-bus': 0.10,
  'sns': 0.05,
  'sqs': 0.04,

  // -- Storage --
  'object-storage': 0.03,
  's3': 0.03,
  'block-storage': 0.10,
  'file-storage': 0.08,
  'data-lake': 0.05,

  // -- Search --
  'search-engine': 0.25,
  'elasticsearch': 0.25,

  // -- Networking --
  'cdn': 0.02,
  'cdn-edge': 0.02,
  'dns': 0.01,
  'firewall': 0.05,
  'waf': 0.06,
  'rate-limiter': 0.03,
  'vpn-gateway': 0.05,

  // -- Security --
  'auth-service': 0.08,
  'secret-manager': 0.02,
  'identity-provider': 0.10,
  'certificate-manager': 0.01,

  // -- Observability --
  'monitoring': 0.05,
  'logging': 0.04,
  'tracing': 0.06,
  'metrics-server': 0.05,
  'alerting': 0.03,

  // -- AI/ML --
  'ml-inference': 0.80,
  'ml-training': 2.50,
  'llm-gateway': 1.50,
  'feature-store': 0.30,
  'model-registry': 0.10,
  'embedding-service': 0.60,

  // -- Data engineering --
  'etl-pipeline': 0.15,
  'data-warehouse': 0.50,
  'spark-cluster': 1.00,
  'flink-cluster': 0.80,
  'airflow': 0.12,

  // -- Client --
  'client': 0.00,
  'mobile-client': 0.00,
  'web-client': 0.00,
  'iot-device': 0.00,
};

/** Default cost for unknown component types. */
const DEFAULT_COST_PER_HOUR = 0.10;

/** Storage cost per GB per hour (based on ~$0.023/GB/month). */
const STORAGE_COST_PER_GB_HOUR = 0.023 / 730;

/** Data transfer cost per GB (~$0.09/GB). */
const TRANSFER_COST_PER_GB = 0.09;

/** Hours in a month (730 = 365.25 * 24 / 12). */
const HOURS_PER_MONTH = 730;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Compute the cost breakdown for a single node.
 *
 * Formula: baseCost * (1 + (utilization - 0.5) * 0.4) * replicationMultiplier
 * * shardingMultiplier + storage + transfer.
 */
export function computeNodeCost(input: CostModelInput): CostBreakdown {
  const baseCost = BASE_COST_PER_HOUR[input.componentType] ?? DEFAULT_COST_PER_HOUR;
  const utilFactor = 1 + (Math.max(0, Math.min(1, input.utilization)) - 0.5) * 0.4;
  const replicationMultiplier = Math.max(1, input.replicas);
  const shardingMultiplier = Math.max(1, input.shards);

  const computePerHour = baseCost * utilFactor * replicationMultiplier * shardingMultiplier;
  const storagePerHour = input.storageGb * STORAGE_COST_PER_GB_HOUR * shardingMultiplier * replicationMultiplier;
  const transferPerHour = input.transferGbPerHour * TRANSFER_COST_PER_GB;

  const totalPerHour = computePerHour + storagePerHour + transferPerHour;
  const totalPerMonth = totalPerHour * HOURS_PER_MONTH;

  return {
    computePerHour,
    storagePerHour,
    transferPerHour,
    replicationMultiplier,
    shardingMultiplier,
    totalPerHour,
    totalPerMonth,
  };
}

/**
 * Compute the aggregate cost for an entire topology.
 *
 * @param nodes - Array of CostModelInput for each node
 * @returns Aggregated CostBreakdown
 */
export function computeTopologyCost(nodes: CostModelInput[]): CostBreakdown {
  let computePerHour = 0;
  let storagePerHour = 0;
  let transferPerHour = 0;

  for (const node of nodes) {
    const breakdown = computeNodeCost(node);
    computePerHour += breakdown.computePerHour;
    storagePerHour += breakdown.storagePerHour;
    transferPerHour += breakdown.transferPerHour;
  }

  const totalPerHour = computePerHour + storagePerHour + transferPerHour;

  return {
    computePerHour,
    storagePerHour,
    transferPerHour,
    replicationMultiplier: 1,
    shardingMultiplier: 1,
    totalPerHour,
    totalPerMonth: totalPerHour * HOURS_PER_MONTH,
  };
}

/**
 * Compute live cost state during simulation.
 *
 * Accumulates cost proportional to elapsed time and tracks per-node costs.
 *
 * @param nodes        - All nodes with their current configuration
 * @param utilizations - Map from componentType/nodeId to current utilization
 * @param elapsedMs    - Total elapsed simulation time in ms
 * @returns Current live cost state
 */
export function computeLiveCost(
  nodes: CostModelInput[],
  utilizations: Map<string, number>,
  elapsedMs: number,
): LiveCostState {
  const costByNode = new Map<string, number>();
  let currentHourlyRate = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const util = utilizations.get(String(i)) ?? node.utilization;
    const adjusted = { ...node, utilization: util };
    const breakdown = computeNodeCost(adjusted);
    costByNode.set(String(i), breakdown.totalPerHour);
    currentHourlyRate += breakdown.totalPerHour;
  }

  const elapsedHours = elapsedMs / 3_600_000;
  const accumulatedCost = currentHourlyRate * elapsedHours;
  const projectedMonthlyCost = currentHourlyRate * HOURS_PER_MONTH;

  return {
    currentHourlyRate,
    accumulatedCost,
    projectedMonthlyCost,
    costByNode,
  };
}
