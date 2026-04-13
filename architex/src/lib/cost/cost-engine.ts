/**
 * Live Cost Calculator Engine
 *
 * Maps canvas nodes/edges to realistic AWS infrastructure costs (2025 pricing).
 * Costs scale with node configuration (instances, replicas, storage size).
 * Data transfer costs are estimated based on edge count and throughput.
 */

import type { Node, Edge } from "@xyflow/react";
import { COST_ESTIMATES } from "@/lib/constants/system-numbers";
import { PALETTE_ITEMS } from "@/lib/palette-items";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentCost {
  nodeId: string;
  nodeType: string;
  label: string;
  monthlyCost: number;
  breakdown: Record<string, number>; // e.g., { compute: 50, storage: 20, transfer: 10 }
}

export interface CostEstimate {
  totalMonthlyCost: number;
  components: ComponentCost[];
  dataTransferCost: number;
}

// ---------------------------------------------------------------------------
// Per-node-type cost calculators
// ---------------------------------------------------------------------------

type CostCalculator = (config: Record<string, unknown>) => {
  total: number;
  breakdown: Record<string, number>;
};

const HOURS_PER_MONTH = 730;

const costCalculators: Record<string, CostCalculator> = {
  "web-server": (config) => {
    const instances = Number(config.instances ?? 1);
    // c5.xlarge-ish: ~$95/mo per instance
    const compute = instances * COST_ESTIMATES.EC2_C7G_XLARGE_MONTHLY;
    const storage = instances * 50 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH; // 50GB EBS each
    return {
      total: compute + storage,
      breakdown: { compute, storage },
    };
  },

  "app-server": (config) => {
    const instances = Number(config.instances ?? 1);
    const compute = instances * COST_ESTIMATES.EC2_C7G_XLARGE_MONTHLY;
    const storage = instances * 50 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute, storage },
    };
  },

  "load-balancer": (_config) => {
    // ALB base cost + estimated 10 LCU average
    const base = COST_ESTIMATES.ALB_PER_HOUR * HOURS_PER_MONTH;
    const lcu = 10 * COST_ESTIMATES.ALB_PER_LCU_HOUR * HOURS_PER_MONTH;
    return {
      total: base + lcu,
      breakdown: { base: round(base), "load-capacity": round(lcu) },
    };
  },

  "api-gateway": (_config) => {
    // ~10M requests/mo at $3.50/million
    const requests = 10;
    const cost = requests * 3.5;
    return {
      total: cost,
      breakdown: { requests: round(cost) },
    };
  },

  "reverse-proxy": (config) => {
    // CloudFront: base on edge locations and transfer
    const edgeLocations = Number(config.edgeLocations ?? 50);
    const transferGB = edgeLocations * 10; // ~10GB per edge
    const requestCost = (edgeLocations * 100_000) / 10_000 * COST_ESTIMATES.CLOUDFRONT_PER_10K_REQUESTS;
    const transferCost = transferGB * COST_ESTIMATES.CLOUDFRONT_PER_GB;
    return {
      total: requestCost + transferCost,
      breakdown: { requests: round(requestCost), transfer: round(transferCost) },
    };
  },

  database: (config) => {
    const replicas = Number(config.replicas ?? 1);
    const storageGB = Number(config.storageGB ?? 100);
    const isMultiAZ = replicas > 1;
    // RDS r6g.large base
    let compute = COST_ESTIMATES.RDS_POSTGRES_R6G_LARGE_MONTHLY;
    if (isMultiAZ) {
      compute *= COST_ESTIMATES.RDS_MULTI_AZ_MULTIPLIER;
    }
    // Read replicas
    const replicaCost = Math.max(0, replicas - 1) * COST_ESTIMATES.RDS_POSTGRES_R6G_LARGE_MONTHLY;
    const storage = storageGB * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH * (isMultiAZ ? 2 : 1);
    return {
      total: compute + replicaCost + storage,
      breakdown: {
        compute: round(compute),
        replicas: round(replicaCost),
        storage: round(storage),
      },
    };
  },

  "document-db": (config) => {
    const shards = Number(config.shards ?? 1);
    const replicaSetSize = Number(config.replicaSetSize ?? 3);
    // Similar to RDS but slightly less per node
    const perNode = 150; // DocumentDB instance ~$150/mo
    const compute = shards * replicaSetSize * perNode;
    const storage = shards * 50 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute: round(compute), storage: round(storage) },
    };
  },

  cache: (config) => {
    const memoryGB = Number(config.memoryGB ?? 8);
    // ElastiCache r7g.large is 13GB for $175/mo. Scale linearly.
    const compute = (memoryGB / 13) * COST_ESTIMATES.ELASTICACHE_REDIS_R7G_LARGE_MONTHLY;
    return {
      total: compute,
      breakdown: { compute: round(compute) },
    };
  },

  "wide-column": (config) => {
    const replicationFactor = Number(config.replicationFactor ?? 3);
    // Keyspaces / self-managed Cassandra: ~$120/node/mo
    const compute = replicationFactor * 120;
    const storage = replicationFactor * 100 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute: round(compute), storage: round(storage) },
    };
  },

  "search-engine": (config) => {
    const shards = Number(config.shards ?? 5);
    const replicas = Number(config.replicas ?? 1);
    // OpenSearch m6g.large: shards distributed across nodes
    const nodeCount = Math.max(1, Math.ceil(shards / 2)); // ~2 shards per node
    const totalNodes = nodeCount * (1 + replicas);
    const compute = totalNodes * COST_ESTIMATES.OPENSEARCH_M6G_LARGE_HOUR * HOURS_PER_MONTH;
    const storage = totalNodes * 100 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute: round(compute), storage: round(storage) },
    };
  },

  "object-storage": (config) => {
    const storageTB = Number(config.storageTB ?? 10);
    const storageGB = storageTB * 1024;
    const storage = storageGB * COST_ESTIMATES.S3_STANDARD_PER_GB_MONTH;
    // Estimated request costs (~1M GETs, 100K PUTs/mo)
    const requests = (1000 * COST_ESTIMATES.S3_GET_PER_1K) + (100 * COST_ESTIMATES.S3_PUT_PER_1K);
    return {
      total: storage + requests,
      breakdown: { storage: round(storage), requests: round(requests) },
    };
  },

  "graph-db": (_config) => {
    // Neptune-like: ~$280/mo for db.r5.large
    const compute = 280;
    const storage = 50 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute, storage: round(storage) },
    };
  },

  "timeseries-db": (config) => {
    const retentionDays = Number(config.retentionDays ?? 30);
    // Timestream / InfluxDB: base + storage scaling
    const compute = 100;
    const storageGB = retentionDays * 2; // ~2GB/day ingestion
    const storage = storageGB * COST_ESTIMATES.S3_STANDARD_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute, storage: round(storage) },
    };
  },

  "message-queue": (config) => {
    const partitions = Number(config.partitions ?? 3);
    const replicationFactor = Number(config.replicationFactor ?? 3);
    const type = String(config.type ?? "kafka");
    if (type === "kafka" || type === "msk") {
      // MSK: 3 brokers minimum
      const brokers = Math.max(3, Math.ceil(partitions / 10));
      const compute = brokers * COST_ESTIMATES.MSK_BROKER_HOUR * HOURS_PER_MONTH;
      const storage = brokers * replicationFactor * 100 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
      return {
        total: compute + storage,
        breakdown: { compute: round(compute), storage: round(storage) } as Record<string, number>,
      };
    }
    // SQS: ~$0.40/million, estimate 50M messages/mo
    const messaging = 50 * COST_ESTIMATES.SQS_PER_1M_REQUESTS;
    return {
      total: messaging,
      breakdown: { messaging: round(messaging) } as Record<string, number>,
    };
  },

  "pub-sub": (config) => {
    const subscriptions = Number(config.subscriptions ?? 5);
    // SNS: $0.50/million publishes, estimate 10M/mo per subscription
    const cost = subscriptions * 10 * COST_ESTIMATES.SNS_PER_1M_PUBLISHES;
    return {
      total: cost,
      breakdown: { messaging: round(cost) },
    };
  },

  "event-bus": (_config) => {
    // EventBridge: ~$1/million events, estimate 20M/mo
    const cost = 20;
    return {
      total: cost,
      breakdown: { messaging: cost },
    };
  },

  serverless: (_config) => {
    // Lambda: 50M invocations/mo at $3.50/million
    const invocations = 50;
    const compute = invocations * COST_ESTIMATES.LAMBDA_PER_1M_INVOCATIONS;
    return {
      total: compute,
      breakdown: { compute: round(compute) },
    };
  },

  worker: (config) => {
    const concurrency = Number(config.concurrency ?? 10);
    // Fargate: vCPU + memory
    const vcpuHours = concurrency * HOURS_PER_MONTH;
    const memGBHours = concurrency * 2 * HOURS_PER_MONTH; // 2GB per worker
    const compute = (vcpuHours * COST_ESTIMATES.FARGATE_VCPU_HOUR) +
      (memGBHours * COST_ESTIMATES.FARGATE_GB_HOUR);
    return {
      total: compute,
      breakdown: { compute: round(compute) },
    };
  },

  "stream-processor": (config) => {
    const parallelism = Number(config.parallelism ?? 4);
    // Kinesis Data Analytics / Flink: ~$0.11/KPU-hour
    const compute = parallelism * 0.11 * HOURS_PER_MONTH;
    const storage = parallelism * 50 * COST_ESTIMATES.EBS_GP3_PER_GB_MONTH;
    return {
      total: compute + storage,
      breakdown: { compute: round(compute), storage: round(storage) },
    };
  },

  "batch-processor": (_config) => {
    // AWS Batch on spot: ~$30/mo equivalent
    return {
      total: 30,
      breakdown: { compute: 30 },
    };
  },

  "ml-inference": (config) => {
    const modelSizeMB = Number(config.modelSizeMB ?? 500);
    // SageMaker: ml.g4dn.xlarge ~$0.526/hr for GPU inference
    const gpuNeeded = modelSizeMB > 1000 ? 2 : 1;
    const compute = gpuNeeded * 0.526 * HOURS_PER_MONTH;
    return {
      total: compute,
      breakdown: { compute: round(compute) },
    };
  },

  // ── Networking ──

  dns: (_config) => {
    // Route 53: $0.50/hosted zone + queries
    return {
      total: 5,
      breakdown: { networking: 5 },
    };
  },

  "cdn-edge": (config) => {
    const locations = Number(config.locations ?? 200);
    const transferGB = locations * 5;
    const transfer = transferGB * COST_ESTIMATES.CLOUDFRONT_PER_GB;
    const requests = (locations * 50_000) / 10_000 * COST_ESTIMATES.CLOUDFRONT_PER_10K_REQUESTS;
    return {
      total: transfer + requests,
      breakdown: { transfer: round(transfer), requests: round(requests) },
    };
  },

  firewall: (_config) => {
    // AWS WAF: $5/web ACL + $1/rule + $0.60/million requests
    const base = 5 + 50; // 50 rules
    const requests = 10 * 0.6; // 10M requests
    return {
      total: base + requests,
      breakdown: { base, requests: round(requests) },
    };
  },

  // ── Observability ──

  "metrics-collector": (_config) => {
    // CloudWatch / Prometheus managed: ~$50/mo
    return {
      total: 50,
      breakdown: { observability: 50 },
    };
  },

  "log-aggregator": (config) => {
    const retentionDays = Number(config.retentionDays ?? 30);
    // CloudWatch Logs or OpenSearch: ~$0.50/GB ingestion, 10GB/day
    const ingestion = 10 * 30 * 0.5;
    const storage = (retentionDays * 10) * COST_ESTIMATES.S3_STANDARD_PER_GB_MONTH;
    return {
      total: ingestion + storage,
      breakdown: { ingestion: round(ingestion), storage: round(storage) },
    };
  },

  tracer: (_config) => {
    // X-Ray / Jaeger managed: ~$25/mo
    return {
      total: 25,
      breakdown: { observability: 25 },
    };
  },

  // ── Security ──

  "auth-service": (_config) => {
    // Cognito / custom auth on EC2: ~$40/mo
    return {
      total: 40,
      breakdown: { compute: 40 },
    };
  },

  "rate-limiter": (_config) => {
    // Typically runs on API Gateway or small instance
    return {
      total: 10,
      breakdown: { compute: 10 },
    };
  },

  "secret-manager": (_config) => {
    // AWS Secrets Manager: $0.40/secret/mo, estimate 50 secrets
    return {
      total: 20,
      breakdown: { security: 20 },
    };
  },
};

// ── Clients: no infrastructure cost ──

const FREE_TYPES = new Set(["web-client", "mobile-client", "third-party-api"]);

// ---------------------------------------------------------------------------
// Data transfer estimation
// ---------------------------------------------------------------------------

function estimateDataTransferCost(edges: Edge[]): number {
  // Each edge represents a communication link.
  // Estimate ~100GB/mo cross-AZ transfer per edge on average.
  const crossAzGB = edges.length * 100;
  // Some egress to internet (~10GB/edge)
  const egressGB = edges.length * 10;
  return round(
    crossAzGB * COST_ESTIMATES.DATA_TRANSFER_CROSS_AZ_PER_GB +
    egressGB * COST_ESTIMATES.DATA_TRANSFER_OUT_PER_GB,
  );
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the estimated monthly AWS infrastructure cost for all
 * nodes and edges on the canvas.
 */
export function calculateInfrastructureCost(
  nodes: Node[],
  edges: Edge[],
): CostEstimate {
  const components: ComponentCost[] = [];

  for (const node of nodes) {
    const nodeType = String(
      node.data?.componentType ?? node.type ?? "unknown",
    );

    if (FREE_TYPES.has(nodeType)) continue;

    const label = String(node.data?.label ?? findPaletteLabel(nodeType) ?? nodeType);
    const config = (node.data?.config as Record<string, unknown>) ?? {};
    const calculator = costCalculators[nodeType];

    if (calculator) {
      const { total, breakdown } = calculator(config);
      components.push({
        nodeId: node.id,
        nodeType,
        label,
        monthlyCost: round(total),
        breakdown,
      });
    } else {
      // Unknown node type: assign a minimal cost
      components.push({
        nodeId: node.id,
        nodeType,
        label,
        monthlyCost: 10,
        breakdown: { other: 10 },
      });
    }
  }

  const dataTransferCost = estimateDataTransferCost(edges);

  const totalMonthlyCost = round(
    components.reduce((sum, c) => sum + c.monthlyCost, 0) + dataTransferCost,
  );

  return {
    totalMonthlyCost,
    components,
    dataTransferCost,
  };
}

// ---------------------------------------------------------------------------
// Cost category aggregation (for charts)
// ---------------------------------------------------------------------------

export type CostCategory = "compute" | "storage" | "networking" | "messaging" | "other";

/**
 * Aggregate component breakdowns into high-level cost categories.
 */
export function aggregateCostByCategory(
  estimate: CostEstimate,
): Record<CostCategory, number> {
  const categories: Record<CostCategory, number> = {
    compute: 0,
    storage: 0,
    networking: 0,
    messaging: 0,
    other: 0,
  };

  for (const component of estimate.components) {
    for (const [key, value] of Object.entries(component.breakdown)) {
      if (key === "compute" || key === "replicas" || key === "base") {
        categories.compute += value;
      } else if (key === "storage" || key === "ingestion") {
        categories.storage += value;
      } else if (
        key === "transfer" ||
        key === "requests" ||
        key === "load-capacity" ||
        key === "networking"
      ) {
        categories.networking += value;
      } else if (key === "messaging") {
        categories.messaging += value;
      } else {
        categories.other += value;
      }
    }
  }

  // Add data transfer to networking
  categories.networking += estimate.dataTransferCost;

  // Round all values
  for (const key of Object.keys(categories) as CostCategory[]) {
    categories[key] = round(categories[key]);
  }

  return categories;
}

// ---------------------------------------------------------------------------
// Optimization tips generator
// ---------------------------------------------------------------------------

export interface OptimizationTip {
  title: string;
  description: string;
  estimatedSavings: string;
}

export function generateOptimizationTips(
  estimate: CostEstimate,
): OptimizationTip[] {
  const tips: OptimizationTip[] = [];
  const types = new Set(estimate.components.map((c) => c.nodeType));
  const categories = aggregateCostByCategory(estimate);

  // Reserved Instances tip if compute is significant
  if (categories.compute > 100) {
    tips.push({
      title: "Use Reserved Instances",
      description:
        "Commit to 1-year or 3-year reserved instances for steady-state workloads to significantly reduce compute costs.",
      estimatedSavings: "Save ~40% on compute",
    });
  }

  // Caching tip if there's a database but no cache
  if (types.has("database") && !types.has("cache")) {
    tips.push({
      title: "Add Caching Layer",
      description:
        "Adding a Redis or Memcached cache in front of your database can offload 60-90% of read traffic.",
      estimatedSavings: "Reduce DB costs ~60%",
    });
  }

  // Spot instances for workers
  if (types.has("worker") || types.has("batch-processor")) {
    tips.push({
      title: "Use Spot Instances for Workers",
      description:
        "Background workers and batch processors are ideal for EC2 Spot instances with up to 70% savings.",
      estimatedSavings: "Save ~70% on worker compute",
    });
  }

  // S3 lifecycle policies
  if (types.has("object-storage")) {
    tips.push({
      title: "Enable S3 Lifecycle Policies",
      description:
        "Move infrequently accessed data to S3 Infrequent Access or Glacier to reduce storage costs.",
      estimatedSavings: "Save ~50% on storage",
    });
  }

  // CDN for reducing origin load
  if (
    (types.has("web-server") || types.has("app-server")) &&
    !types.has("cdn-edge") &&
    !types.has("reverse-proxy")
  ) {
    tips.push({
      title: "Add a CDN",
      description:
        "A CDN can cache static assets and API responses at the edge, reducing origin server load and data transfer costs.",
      estimatedSavings: "Reduce transfer costs ~70%",
    });
  }

  // Graviton processors
  if (categories.compute > 200) {
    tips.push({
      title: "Switch to Graviton Instances",
      description:
        "AWS Graviton3 (arm64) instances offer up to 20% better price-performance vs x86 equivalents.",
      estimatedSavings: "Save ~20% on compute",
    });
  }

  // Always include at least one general tip
  if (tips.length === 0) {
    tips.push({
      title: "Right-size Your Instances",
      description:
        "Monitor CPU and memory utilization and downsize over-provisioned instances to match actual demand.",
      estimatedSavings: "Save 10-30%",
    });
  }

  return tips;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function findPaletteLabel(nodeType: string): string | undefined {
  return PALETTE_ITEMS.find((item) => item.type === nodeType)?.label;
}
