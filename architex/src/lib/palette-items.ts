export type NodeCategory =
  | "compute"
  | "load-balancing"
  | "storage"
  | "messaging"
  | "networking"
  | "processing"
  | "client"
  | "observability"
  | "security"
  | "services"
  | "fintech"
  | "data-engineering"
  | "ai-llm"
  | "db-internals";

export type NodeShape =
  | "rectangle"
  | "cylinder"
  | "parallelogram"
  | "hexagon"
  | "pill"
  | "dashed-rect"
  | "octagon"
  | "diamond";

export interface PaletteItem {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
  description: string;
  defaultConfig: Record<string, number | string | boolean>;
  /** Visual shape for the canvas node. Defaults to category-based shape. */
  shape: NodeShape;
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  compute: "Compute",
  "load-balancing": "Load Balancing",
  storage: "Data Storage",
  messaging: "Messaging & Streaming",
  networking: "Networking",
  processing: "Processing",
  client: "Client / External",
  observability: "Observability",
  security: "Security",
  services: "Services",
  fintech: "FinTech",
  "data-engineering": "Data Engineering",
  "ai-llm": "AI / LLM",
  "db-internals": "DB Internals",
};

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  compute: "var(--node-compute)",
  "load-balancing": "var(--node-networking)",
  storage: "var(--node-storage)",
  messaging: "var(--node-messaging)",
  networking: "var(--node-networking)",
  processing: "var(--node-processing)",
  client: "var(--node-client)",
  observability: "var(--node-observability)",
  security: "var(--node-security)",
  services: "var(--node-services)",
  fintech: "var(--node-fintech)",
  "data-engineering": "var(--node-data-engineering)",
  "ai-llm": "var(--node-ai-llm)",
  "db-internals": "var(--node-db-internals)",
};

export const PALETTE_ITEMS: PaletteItem[] = [
  // ── Compute ──
  {
    type: "web-server",
    label: "Web Server",
    category: "compute",
    icon: "Globe",
    description: "Handles HTTP requests",
    defaultConfig: { instances: 1, maxConnections: 10000, processingTimeMs: 5 },
    shape: "rectangle",
  },
  {
    type: "app-server",
    label: "Application Server",
    category: "compute",
    icon: "Server",
    description: "Business logic processing",
    defaultConfig: { instances: 1, threads: 200, processingTimeMs: 20 },
    shape: "rectangle",
  },
  {
    type: "serverless",
    label: "Serverless Function",
    category: "compute",
    icon: "Zap",
    description: "Event-driven compute",
    defaultConfig: { memoryMB: 256, timeoutMs: 30000, coldStartMs: 200 },
    shape: "rectangle",
  },
  {
    type: "worker",
    label: "Worker Service",
    category: "compute",
    icon: "Cog",
    description: "Background job processor",
    defaultConfig: { concurrency: 10, pollIntervalMs: 1000 },
    shape: "rectangle",
  },

  // ── Load Balancing ──
  {
    type: "load-balancer",
    label: "Load Balancer (L7)",
    category: "load-balancing",
    icon: "GitBranch",
    description: "HTTP/HTTPS load balancing",
    defaultConfig: { algorithm: "round-robin", healthCheckInterval: 10, maxConnections: 50000 },
    shape: "hexagon",
  },
  {
    type: "api-gateway",
    label: "API Gateway",
    category: "load-balancing",
    icon: "Shield",
    description: "Rate limiting, auth, routing",
    defaultConfig: { rateLimitRps: 10000, authType: "jwt", timeoutMs: 30000 },
    shape: "hexagon",
  },
  {
    type: "reverse-proxy",
    label: "CDN / Reverse Proxy",
    category: "load-balancing",
    icon: "Globe2",
    description: "Edge caching, SSL termination",
    defaultConfig: { cacheHitRate: 0.85, ttlSeconds: 86400, edgeLocations: 50 },
    shape: "hexagon",
  },

  // ── Data Storage ──
  {
    type: "database",
    label: "Relational DB (SQL)",
    category: "storage",
    icon: "Database",
    description: "PostgreSQL/MySQL — ACID transactions",
    defaultConfig: { type: "postgresql", replicas: 1, maxConnections: 100, storageGB: 100 },
    shape: "cylinder",
  },
  {
    type: "document-db",
    label: "Document DB (NoSQL)",
    category: "storage",
    icon: "FileJson",
    description: "MongoDB — Flexible schema",
    defaultConfig: { shards: 1, replicaSetSize: 3 },
    shape: "cylinder",
  },
  {
    type: "cache",
    label: "Cache (Redis)",
    category: "storage",
    icon: "Layers",
    description: "In-memory key-value store",
    defaultConfig: { type: "redis", memoryGB: 8, evictionPolicy: "lru", ttlSeconds: 3600 },
    shape: "cylinder",
  },
  {
    type: "wide-column",
    label: "Wide-Column (Cassandra)",
    category: "storage",
    icon: "Table2",
    description: "Write-heavy, multi-region",
    defaultConfig: { replicationFactor: 3, consistencyLevel: "QUORUM" },
    shape: "cylinder",
  },
  {
    type: "search-engine",
    label: "Search Engine",
    category: "storage",
    icon: "Search",
    description: "Elasticsearch — Full-text search",
    defaultConfig: { shards: 5, replicas: 1 },
    shape: "cylinder",
  },
  {
    type: "object-storage",
    label: "Object Storage (S3)",
    category: "storage",
    icon: "HardDrive",
    description: "Blobs / files",
    defaultConfig: { storageTB: 10, replication: 3 },
    shape: "cylinder",
  },
  {
    type: "graph-db",
    label: "Graph DB (Neo4j)",
    category: "storage",
    icon: "GitFork",
    description: "Relationship-heavy data",
    defaultConfig: { nodes: 1000000, relationships: 5000000 },
    shape: "cylinder",
  },
  {
    type: "timeseries-db",
    label: "Time-Series DB",
    category: "storage",
    icon: "TrendingUp",
    description: "Metrics & events (InfluxDB)",
    defaultConfig: { retentionDays: 30, aggregationInterval: 60 },
    shape: "cylinder",
  },

  // ── Messaging ──
  {
    type: "message-queue",
    label: "Message Queue",
    category: "messaging",
    icon: "ListOrdered",
    description: "Kafka / RabbitMQ / SQS",
    defaultConfig: { type: "kafka", partitions: 3, replicationFactor: 3, retentionHours: 168 },
    shape: "parallelogram",
  },
  {
    type: "pub-sub",
    label: "Pub/Sub",
    category: "messaging",
    icon: "Megaphone",
    description: "Fan-out messaging (SNS)",
    defaultConfig: { subscriptions: 5 },
    shape: "parallelogram",
  },
  {
    type: "event-bus",
    label: "Event Bus",
    category: "messaging",
    icon: "Route",
    description: "Async event routing",
    defaultConfig: { rules: 10 },
    shape: "parallelogram",
  },

  // ── Networking ──
  {
    type: "dns",
    label: "DNS",
    category: "networking",
    icon: "AtSign",
    description: "Name resolution",
    defaultConfig: { ttlSeconds: 300 },
    shape: "hexagon",
  },
  {
    type: "cdn-edge",
    label: "CDN Edge Node",
    category: "networking",
    icon: "Radio",
    description: "Content caching at edge",
    defaultConfig: { cacheHitRate: 0.9, ttlSeconds: 86400, locations: 200 },
    shape: "hexagon",
  },
  {
    type: "firewall",
    label: "Firewall / WAF",
    category: "networking",
    icon: "ShieldAlert",
    description: "Security filtering",
    defaultConfig: { rules: 50, rateLimitRps: 100000 },
    shape: "hexagon",
  },

  // ── Processing ──
  {
    type: "batch-processor",
    label: "Batch Processor",
    category: "processing",
    icon: "ClipboardList",
    description: "Scheduled batch jobs",
    defaultConfig: { batchSize: 1000, scheduleMinutes: 60 },
    shape: "rectangle",
  },
  {
    type: "stream-processor",
    label: "Stream Processor",
    category: "processing",
    icon: "Workflow",
    description: "Real-time data processing (Flink)",
    defaultConfig: { parallelism: 4, windowSeconds: 60 },
    shape: "rectangle",
  },
  {
    type: "ml-inference",
    label: "ML Inference Service",
    category: "processing",
    icon: "Brain",
    description: "Model serving",
    defaultConfig: { modelSizeMB: 500, batchSize: 32, latencyTargetMs: 100 },
    shape: "rectangle",
  },

  // ── Client / External ──
  {
    type: "web-client",
    label: "Web Client (Browser)",
    category: "client",
    icon: "Monitor",
    description: "Frontend application",
    defaultConfig: { concurrentUsers: 1000, requestsPerSecond: 100 },
    shape: "pill",
  },
  {
    type: "mobile-client",
    label: "Mobile Client",
    category: "client",
    icon: "Smartphone",
    description: "Mobile application",
    defaultConfig: { requestsPerSecond: 50 },
    shape: "pill",
  },
  {
    type: "third-party-api",
    label: "Third-Party API",
    category: "client",
    icon: "ExternalLink",
    description: "External service dependency",
    defaultConfig: { rateLimitRps: 100, latencyMs: 200, errorRate: 0.01 },
    shape: "pill",
  },

  // ── Observability ──
  {
    type: "metrics-collector",
    label: "Metrics (Prometheus)",
    category: "observability",
    icon: "BarChart3",
    description: "Metrics scraping & storage",
    defaultConfig: { scrapeIntervalSeconds: 15 },
    shape: "dashed-rect",
  },
  {
    type: "log-aggregator",
    label: "Log Aggregator (ELK)",
    category: "observability",
    icon: "ScrollText",
    description: "Centralized logging",
    defaultConfig: { retentionDays: 30 },
    shape: "dashed-rect",
  },
  {
    type: "tracer",
    label: "Distributed Tracer",
    category: "observability",
    icon: "Activity",
    description: "Request tracing (Jaeger)",
    defaultConfig: { sampleRate: 0.1 },
    shape: "dashed-rect",
  },

  // ── Security ──
  {
    type: "auth-service",
    label: "Auth Service",
    category: "security",
    icon: "KeyRound",
    description: "OAuth/JWT authentication",
    defaultConfig: { authType: "oauth2", tokenTtlMinutes: 60 },
    shape: "octagon",
  },
  {
    type: "rate-limiter",
    label: "Rate Limiter",
    category: "security",
    icon: "Gauge",
    description: "Request throttling",
    defaultConfig: { algorithm: "token-bucket", limitRps: 1000, windowSeconds: 60 },
    shape: "octagon",
  },
  {
    type: "secret-manager",
    label: "Secret Manager",
    category: "security",
    icon: "Lock",
    description: "Secret storage (Vault)",
    defaultConfig: { rotationDays: 90 },
    shape: "octagon",
  },
  {
    type: "ddos-shield",
    label: "DDoS Shield",
    category: "security",
    icon: "ShieldOff",
    description: "DDoS mitigation / traffic scrubbing",
    defaultConfig: { rateLimitRps: 100000, rules: 100 },
    shape: "octagon",
  },
  {
    type: "siem",
    label: "SIEM",
    category: "security",
    icon: "ScanEye",
    description: "Security Information and Event Management",
    defaultConfig: { retentionDays: 90, alertRules: 50 },
    shape: "octagon",
  },

  // ── Services ──
  {
    type: "notification-service",
    label: "Notification Service",
    category: "services",
    icon: "Bell",
    description: "Push/email/SMS notification dispatch",
    defaultConfig: { channelCount: 3, batchSize: 100, retryAttempts: 3 },
    shape: "rectangle",
  },
  {
    type: "search-service",
    label: "Search Service",
    category: "services",
    icon: "Search",
    description: "Full-text search engine",
    defaultConfig: { shards: 5, replicas: 1, indexCount: 10 },
    shape: "rectangle",
  },
  {
    type: "analytics-service",
    label: "Analytics Service",
    category: "services",
    icon: "BarChart3",
    description: "Event ingestion and aggregation",
    defaultConfig: { batchSize: 1000, flushIntervalMs: 5000, retentionDays: 90 },
    shape: "rectangle",
  },
  {
    type: "scheduler",
    label: "Scheduler",
    category: "services",
    icon: "Clock",
    description: "Cron/delayed job execution",
    defaultConfig: { maxConcurrentJobs: 50, pollIntervalMs: 1000 },
    shape: "rectangle",
  },
  {
    type: "service-discovery",
    label: "Service Discovery",
    category: "services",
    icon: "Compass",
    description: "Consul/etcd service registry",
    defaultConfig: { ttlSeconds: 30, healthCheckIntervalMs: 5000 },
    shape: "rectangle",
  },
  {
    type: "config-service",
    label: "Config Service",
    category: "services",
    icon: "Settings",
    description: "Dynamic configuration server",
    defaultConfig: { refreshIntervalMs: 30000, versionHistory: 50 },
    shape: "rectangle",
  },
  {
    type: "secrets-manager-v2",
    label: "Secrets Manager v2",
    category: "services",
    icon: "KeyRound",
    description: "HashiCorp Vault-style secrets",
    defaultConfig: { rotationDays: 30, encryptionType: "AES-256" },
    shape: "rectangle",
  },
  {
    type: "feature-flags",
    label: "Feature Flags",
    category: "services",
    icon: "Flag",
    description: "Feature flag evaluation service",
    defaultConfig: { flagCount: 100, evaluationCacheMs: 5000 },
    shape: "rectangle",
  },
  {
    type: "auth-service-v2",
    label: "Auth Service v2",
    category: "services",
    icon: "UserCheck",
    description: "OAuth2/OIDC identity provider",
    defaultConfig: { authType: "oauth2", tokenTtlMinutes: 60, mfaEnabled: true },
    shape: "rectangle",
  },

  // ── Networking (v2) ──
  {
    type: "vpc",
    label: "VPC",
    category: "networking",
    icon: "Cloud",
    description: "Virtual Private Cloud boundary",
    defaultConfig: { cidrBlock: "10.0.0.0/16", subnets: 4 },
    shape: "hexagon",
  },
  {
    type: "subnet",
    label: "Subnet",
    category: "networking",
    icon: "Network",
    description: "Network subnet partition",
    defaultConfig: { cidrBlock: "10.0.1.0/24", isPublic: false },
    shape: "hexagon",
  },
  {
    type: "nat-gateway",
    label: "NAT Gateway",
    category: "networking",
    icon: "ArrowRightLeft",
    description: "NAT for private subnet egress",
    defaultConfig: { bandwidthGbps: 5 },
    shape: "hexagon",
  },
  {
    type: "vpn-gateway",
    label: "VPN Gateway",
    category: "networking",
    icon: "ShieldCheck",
    description: "Site-to-site VPN endpoint",
    defaultConfig: { tunnels: 2, bandwidthMbps: 1250 },
    shape: "hexagon",
  },
  {
    type: "service-mesh",
    label: "Service Mesh",
    category: "networking",
    icon: "GitGraph",
    description: "Istio/Linkerd sidecar mesh",
    defaultConfig: { mtlsEnabled: true, retryAttempts: 3, timeoutMs: 5000 },
    shape: "hexagon",
  },
  {
    type: "dns-server",
    label: "DNS Server",
    category: "networking",
    icon: "AtSign",
    description: "DNS resolution service",
    defaultConfig: { ttlSeconds: 300, zones: 10 },
    shape: "hexagon",
  },
  {
    type: "ingress-controller",
    label: "Ingress Controller",
    category: "networking",
    icon: "LogIn",
    description: "K8s ingress / NGINX controller",
    defaultConfig: { maxConnections: 50000, sslTermination: true },
    shape: "hexagon",
  },

  // ── FinTech ──
  {
    type: "payment-gateway",
    label: "Payment Gateway",
    category: "fintech",
    icon: "CreditCard",
    description: "Stripe/Adyen payment processing",
    defaultConfig: { processingTimeMs: 200, retryAttempts: 3, fraudCheckEnabled: true },
    shape: "octagon",
  },
  {
    type: "ledger-service",
    label: "Ledger Service",
    category: "fintech",
    icon: "BookOpen",
    description: "Double-entry ledger/accounting",
    defaultConfig: { journalEntries: 1000000, consistencyLevel: "strong" },
    shape: "octagon",
  },
  {
    type: "fraud-detection",
    label: "Fraud Detection",
    category: "fintech",
    icon: "AlertTriangle",
    description: "ML-based fraud scoring",
    defaultConfig: { modelVersion: "v3", thresholdScore: 0.85, latencyTargetMs: 50 },
    shape: "octagon",
  },
  {
    type: "hsm",
    label: "HSM",
    category: "fintech",
    icon: "Fingerprint",
    description: "Hardware security module for key management",
    defaultConfig: { encryptionAtRest: true, encryptionInTransit: true, keyRotationDays: 30 },
    shape: "octagon",
  },

  // ── Data Engineering ──
  {
    type: "etl-pipeline",
    label: "ETL Pipeline",
    category: "data-engineering",
    icon: "Workflow",
    description: "Extract/Transform/Load batch pipeline",
    defaultConfig: { batchSize: 10000, scheduleMinutes: 60, processingTimeMs: 5000 },
    shape: "parallelogram",
  },
  {
    type: "cdc-service",
    label: "CDC Service",
    category: "data-engineering",
    icon: "RefreshCw",
    description: "Change Data Capture (Debezium-style)",
    defaultConfig: { pollIntervalMs: 100, batchSize: 500, snapshotEnabled: true },
    shape: "parallelogram",
  },
  {
    type: "schema-registry",
    label: "Schema Registry",
    category: "data-engineering",
    icon: "FileCode",
    description: "Avro/Protobuf schema management",
    defaultConfig: { schemaCount: 200, compatibilityMode: "backward" },
    shape: "parallelogram",
  },
  {
    type: "feature-store",
    label: "Feature Store",
    category: "data-engineering",
    icon: "Database",
    description: "ML feature serving (Feast-style)",
    defaultConfig: { features: 500, onlineTtlMs: 60000, offlineStorageGB: 100 },
    shape: "parallelogram",
  },
  {
    type: "media-processor",
    label: "Media Processor",
    category: "data-engineering",
    icon: "Film",
    description: "Video/image transcoding",
    defaultConfig: { concurrency: 4, maxFileSizeMB: 5000, outputFormats: 3 },
    shape: "parallelogram",
  },

  // ── AI / LLM ──
  {
    type: "llm-gateway",
    label: "LLM Gateway",
    category: "ai-llm",
    icon: "Sparkles",
    description: "LLM API proxy with rate limiting and model routing",
    defaultConfig: { maxTokens: 4096, processingTimeMs: 500, costPerHour: 1.5, models: 3 },
    shape: "hexagon",
  },
  {
    type: "tool-registry",
    label: "Tool Registry",
    category: "ai-llm",
    icon: "Wrench",
    description: "Tool/function calling registry for agents",
    defaultConfig: { toolCount: 50, cacheTtlMs: 300000 },
    shape: "hexagon",
  },
  {
    type: "memory-fabric",
    label: "Memory Fabric",
    category: "ai-llm",
    icon: "BrainCircuit",
    description: "Long-term memory store for agents",
    defaultConfig: { memoryGB: 64, vectorDimensions: 1536, ttlHours: 720 },
    shape: "hexagon",
  },
  {
    type: "agent-orchestrator",
    label: "Agent Orchestrator",
    category: "ai-llm",
    icon: "Bot",
    description: "Multi-agent coordination layer",
    defaultConfig: { maxAgents: 10, autoScale: true, timeoutMs: 120000 },
    shape: "hexagon",
  },
  {
    type: "safety-mesh",
    label: "Safety Mesh",
    category: "ai-llm",
    icon: "ShieldAlert",
    description: "Content safety / guardrails mesh",
    defaultConfig: { rules: 100, blockThreshold: 0.9, latencyBudgetMs: 50 },
    shape: "hexagon",
  },

  // ── DB Internals ──
  {
    type: "shard-node",
    label: "Shard Node",
    category: "db-internals",
    icon: "Layers",
    description: "Database shard",
    defaultConfig: { storageGB: 500, maxConnections: 1000 },
    shape: "cylinder",
  },
  {
    type: "primary-node",
    label: "Primary Node",
    category: "db-internals",
    icon: "Crown",
    description: "Database primary/leader",
    defaultConfig: { walEnabled: true, syncReplication: true, maxConnections: 500 },
    shape: "cylinder",
  },
  {
    type: "partition-node",
    label: "Partition Node",
    category: "db-internals",
    icon: "SplitSquareVertical",
    description: "Kafka/event partition",
    defaultConfig: { retentionHours: 168, segmentSizeMB: 1024 },
    shape: "cylinder",
  },
  {
    type: "replica-node",
    label: "Replica Node",
    category: "db-internals",
    icon: "Copy",
    description: "Database read replica",
    defaultConfig: { replicationLagMs: 100, readOnly: true, maxConnections: 1000 },
    shape: "cylinder",
  },
  {
    type: "input-node",
    label: "Input Node",
    category: "db-internals",
    icon: "ArrowDownToLine",
    description: "Pipeline input stage",
    defaultConfig: { batchSize: 1000, parallelism: 4 },
    shape: "cylinder",
  },
  {
    type: "output-node",
    label: "Output Node",
    category: "db-internals",
    icon: "ArrowUpFromLine",
    description: "Pipeline output stage",
    defaultConfig: { batchSize: 1000, flushIntervalMs: 5000 },
    shape: "cylinder",
  },
  {
    type: "coordinator-node",
    label: "Coordinator Node",
    category: "db-internals",
    icon: "Radar",
    description: "Distributed coordinator",
    defaultConfig: { quorumSize: 3, electionTimeoutMs: 5000 },
    shape: "cylinder",
  },
];

/** Group palette items by category */
export function groupByCategory(items: PaletteItem[]): Record<NodeCategory, PaletteItem[]> {
  return items.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<NodeCategory, PaletteItem[]>);
}
