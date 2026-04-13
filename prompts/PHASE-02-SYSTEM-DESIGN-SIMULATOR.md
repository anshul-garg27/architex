# PHASE 2: SYSTEM DESIGN SIMULATOR

> **Goal:** The fully interactive system design canvas where users drag-drop architectural components, wire them together, run simulations powered by a WASM queuing-theory engine, inject chaos events, and observe real-time metrics. This is the flagship module of Architex.

> **Prerequisite:** Phase 1 complete (app shell, stores, React Flow canvas, auth, persistence).

---

## COMPONENT REGISTRY (60+ Components)

Every component is registered in a central registry. Each entry defines its visual appearance, configurable properties, default simulation parameters, and connection rules.

```typescript
// lib/system-design/component-registry.ts

export interface ComponentDefinition {
  id: string;                        // unique slug: "web-server", "redis", etc.
  name: string;                      // display name
  category: ComponentCategory;
  icon: string;                      // Lucide icon name or custom SVG path
  color: string;                     // CSS variable reference (--node-compute, etc.)
  description: string;               // tooltip text
  defaultConfig: ComponentConfig;
  ports: PortDefinition[];           // input/output connection ports
  allowedEdgeTypes: string[];        // which edge types can connect
  simulationBehavior: SimBehavior;   // queuing model + failure modes
  width: number;                     // default node width in px (120 | 160 | 200)
  height: number;                    // default node height in px (60 | 80 | 100)
}

export type ComponentCategory =
  | "compute" | "storage" | "messaging" | "networking"
  | "processing" | "client" | "observability" | "security";

export interface ComponentConfig {
  instances: number;                 // replica count, default 1
  throughputLimit: number;           // max requests/sec per instance
  baseLatency: number;               // base processing time in ms
  errorRate: number;                 // 0.0 - 1.0, default 0.001
  capacity: number;                  // storage capacity in GB or queue depth
  memoryMB: number;                  // RAM per instance
  cpuCores: number;                  // vCPU per instance
  costPerHour: number;               // USD/hr for capacity planning
  healthCheckInterval: number;       // ms between health checks
  autoScale: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetUtilization: number;       // 0.0 - 1.0, trigger scale at this
    cooldownMs: number;
  };
  custom: Record<string, unknown>;   // component-specific config
}

export interface PortDefinition {
  id: string;                        // "in-http", "out-query", etc.
  type: "input" | "output";
  position: "top" | "bottom" | "left" | "right";
  allowedEdgeTypes: string[];
  maxConnections: number;            // -1 for unlimited
}

export interface SimBehavior {
  model: "M/M/1" | "M/M/c" | "M/D/1" | "M/G/1" | "finite-queue" | "custom";
  serviceTimeDistribution: "exponential" | "deterministic" | "normal" | "lognormal";
  failureModes: FailureMode[];
  warmupMs: number;                  // time before component is ready
  drainMs: number;                   // graceful shutdown time
}

export interface FailureMode {
  name: string;                      // "crash", "slow", "memory-leak", "cpu-spike"
  probability: number;               // per-tick probability when chaos enabled
  recoveryMs: number;
  cascading: boolean;                // does failure propagate downstream?
}
```

### COMPUTE Components (7)

| ID | Name | Default RPS | Base Latency | Model | Special Config |
|---|---|---|---|---|---|
| `web-server` | Web Server (Nginx) | 10,000 | 2ms | M/M/c | `{ workerProcesses: 4, keepAliveTimeout: 65000, maxConnections: 1024 }` |
| `app-server` | App Server (Node/Go/Java) | 2,000 | 15ms | M/M/c | `{ runtime: "node"\|"go"\|"java"\|"python", threadPoolSize: 200, gcPauseMs: 5 }` |
| `serverless` | Serverless Function | 1,000 | 50ms | M/M/1 | `{ coldStartMs: 250, warmInstances: 0, maxConcurrency: 1000, timeoutMs: 30000, memoryMB: 256 }` |
| `container` | Container (K8s Pod) | 3,000 | 10ms | M/M/c | `{ cpuRequest: "250m", cpuLimit: "1", memRequest: "256Mi", memLimit: "512Mi", replicas: 3, hpaTarget: 0.7 }` |
| `worker` | Background Worker | 500 | 100ms | M/M/c | `{ concurrency: 10, pollIntervalMs: 1000, maxRetries: 3, backoffMultiplier: 2 }` |
| `cron-job` | Cron Job | N/A | varies | M/D/1 | `{ schedule: "*/5 * * * *", timeoutMs: 300000, overlap: "forbid"\|"allow"\|"replace" }` |
| `api-gateway-compute` | API Gateway (compute) | 50,000 | 1ms | M/M/c | `{ rateLimitRPS: 10000, authEnabled: true, corsEnabled: true }` |

### STORAGE Components (13)

| ID | Name | Default QPS | Latency | Special Config |
|---|---|---|---|---|
| `postgresql` | PostgreSQL | 5,000 | 5ms | `{ maxConnections: 100, shardCount: 1, replication: "streaming"\|"logical", wal: true, vacuumInterval: 60000, indexType: "btree"\|"hash"\|"gin"\|"gist" }` |
| `mysql` | MySQL | 5,000 | 5ms | `{ engine: "InnoDB"\|"MyISAM", maxConnections: 151, replication: "async"\|"semi-sync"\|"group" }` |
| `mongodb` | MongoDB | 10,000 | 3ms | `{ replicaSetSize: 3, shardKey: "", writeConcern: "majority"\|"1"\|"0", readPreference: "primary"\|"secondary"\|"nearest" }` |
| `redis` | Redis | 100,000 | 0.5ms | `{ maxMemoryMB: 1024, evictionPolicy: "lru"\|"lfu"\|"ttl"\|"noeviction", cluster: false, sentinels: 0, persistence: "rdb"\|"aof"\|"none" }` |
| `cassandra` | Cassandra | 20,000 | 4ms | `{ replicationFactor: 3, consistencyLevel: "ONE"\|"QUORUM"\|"ALL"\|"LOCAL_QUORUM", compactionStrategy: "STCS"\|"LCS"\|"TWCS" }` |
| `elasticsearch` | Elasticsearch | 8,000 | 10ms | `{ shards: 5, replicas: 1, refreshInterval: "1s", heapGB: 4, indexType: "standard"\|"time-series" }` |
| `timeseries-db` | TimeSeries DB | 50,000 | 2ms | `{ retentionDays: 90, downsampleIntervals: ["1m","5m","1h"], compressionRatio: 10 }` |
| `graph-db` | Graph DB (Neo4j) | 3,000 | 8ms | `{ maxRelationshipDepth: 10, cacheSize: "2G", bolt: true }` |
| `s3` | Object Storage (S3) | 5,500 | 50ms | `{ storageClass: "STANDARD"\|"IA"\|"GLACIER", versioning: true, lifecycleRules: [], maxObjectSizeGB: 5120, multipartThresholdMB: 100 }` |
| `dynamodb` | DynamoDB | 25,000 | 5ms | `{ readCapacityUnits: 100, writeCapacityUnits: 100, onDemand: true, gsiCount: 5, streamEnabled: true }` |
| `sqlite` | SQLite (embedded) | 50,000 | 0.1ms | `{ walMode: true, journalMode: "wal", maxSizeMB: 1024 }` |
| `memcached` | Memcached | 200,000 | 0.3ms | `{ maxMemoryMB: 4096, maxItemSizeKB: 1024, threads: 4 }` |
| `data-warehouse` | Data Warehouse | 100 | 5000ms | `{ engine: "columnar", partitioning: "time"\|"hash", compressionCodec: "zstd"\|"lz4" }` |

### MESSAGING Components (5)

| ID | Name | Default TPS | Latency | Special Config |
|---|---|---|---|---|
| `message-queue` | Message Queue (SQS/RabbitMQ) | 10,000 | 20ms | `{ maxDepth: 100000, visibilityTimeoutMs: 30000, dlqEnabled: true, maxRetries: 3, fifo: false, deduplicationWindow: 300 }` |
| `kafka` | Kafka | 100,000 | 5ms | `{ partitions: 12, replicationFactor: 3, retentionHours: 168, batchSizeKB: 16, lingerMs: 5, acks: "all"\|"1"\|"0", consumerGroupCount: 1 }` |
| `pubsub` | Pub/Sub | 50,000 | 10ms | `{ topicCount: 1, subscriptionCount: 1, ackDeadlineMs: 10000, retainAckedHours: 168, orderingEnabled: false }` |
| `event-bus` | Event Bus | 20,000 | 15ms | `{ eventTypes: [], filterRules: [], retryPolicy: "exponential", dlqEnabled: true, archiveEnabled: false }` |
| `stream-processor` | Stream Processor (Flink) | 50,000 | 50ms | `{ parallelism: 4, checkpointIntervalMs: 10000, stateBackend: "rocksdb"\|"memory", windowType: "tumbling"\|"sliding"\|"session" }` |

### NETWORKING Components (8)

| ID | Name | Default RPS | Latency | Special Config |
|---|---|---|---|---|
| `load-balancer-l4` | Load Balancer L4 | 500,000 | 0.5ms | `{ algorithm: "round-robin"\|"least-connections"\|"ip-hash"\|"random"\|"weighted", healthCheckPath: "/health", healthCheckIntervalMs: 5000, drainingTimeoutMs: 30000 }` |
| `load-balancer-l7` | Load Balancer L7 | 100,000 | 2ms | `{ algorithm: "round-robin"\|"least-connections"\|"url-hash"\|"weighted"\|"cookie-affinity", sslTermination: true, http2: true, waf: false, rateLimitRPS: 0 }` |
| `api-gateway` | API Gateway | 50,000 | 3ms | `{ auth: "jwt"\|"api-key"\|"oauth2"\|"none", rateLimit: { windowMs: 60000, maxRequests: 1000 }, cors: true, caching: false, cacheTtlMs: 60000, requestTransform: false }` |
| `cdn` | CDN | 1,000,000 | 10ms | `{ popCount: 200, cacheHitRate: 0.92, ttlSeconds: 86400, purgeLatencyMs: 5000, compressionEnabled: true, http3: true, originShield: true }` |
| `dns` | DNS Server | 100,000 | 1ms | `{ ttlSeconds: 300, recordTypes: ["A","AAAA","CNAME","MX","TXT"], geoRouting: false, failoverEnabled: true, healthCheckEnabled: true }` |
| `firewall` | Firewall / WAF | 200,000 | 0.5ms | `{ rules: [], rateLimit: 10000, ipWhitelist: [], geoBlock: [], owasp: true, ddosProtection: true }` |
| `service-mesh` | Service Mesh (Istio/Envoy) | 50,000 | 1ms | `{ mtls: true, retryPolicy: { maxRetries: 3, retryOn: "5xx" }, circuitBreaker: { threshold: 5, timeoutMs: 30000 }, tracing: true, rateLimitRPS: 0 }` |
| `reverse-proxy` | Reverse Proxy | 200,000 | 1ms | `{ caching: true, compression: true, sslTermination: true, loadBalancing: "round-robin" }` |

### PROCESSING Components (5)

| ID | Name | Default TPS | Latency | Special Config |
|---|---|---|---|---|
| `batch-processor` | Batch Processor | 1,000 | 1000ms | `{ batchSize: 100, intervalMs: 60000, parallelJobs: 4, retryPolicy: "exponential", deadlineMs: 3600000 }` |
| `stream-processor-compute` | Stream Processor | 50,000 | 10ms | `{ parallelism: 8, windowSizeMs: 10000, watermarkDelayMs: 5000, stateBackend: "rocksdb" }` |
| `etl-pipeline` | ETL Pipeline | 500 | 5000ms | `{ extractors: [], transformers: [], loaders: [], scheduleMs: 3600000, incrementalEnabled: true }` |
| `ml-inference` | ML Inference | 1,000 | 30ms | `{ modelSizeMB: 500, gpuEnabled: true, batchSize: 32, maxQueueDepth: 100, warmupRequests: 10, framework: "pytorch"\|"tensorflow"\|"onnx" }` |
| `search-engine` | Search Engine | 5,000 | 15ms | `{ indexSizeGB: 50, shards: 5, replicas: 1, queryType: "full-text"\|"vector"\|"hybrid" }` |

### CLIENT Components (4)

| ID | Name | Latency | Special Config |
|---|---|---|---|
| `web-client` | Web Browser | 0ms | `{ bundleSizeKB: 500, ttfbTarget: 200, renderStrategy: "csr"\|"ssr"\|"ssg"\|"isr", serviceWorker: false }` |
| `mobile-client` | Mobile App | 0ms | `{ platform: "ios"\|"android"\|"cross-platform", offlineEnabled: true, pushEnabled: true, networkType: "4g"\|"5g"\|"wifi"\|"3g" }` |
| `iot-device` | IoT Device | 0ms | `{ protocol: "mqtt"\|"coap"\|"http", telemetryIntervalMs: 5000, batchUpload: true, deviceCount: 1000 }` |
| `third-party-api` | Third-Party API | 200ms | `{ rateLimit: 100, timeoutMs: 5000, retries: 3, circuitBreaker: true, fallbackEnabled: true }` |

### OBSERVABILITY Components (4)

| ID | Name | TPS | Latency | Special Config |
|---|---|---|---|---|
| `metrics-collector` | Metrics (Prometheus) | 100,000 | 1ms | `{ scrapeIntervalMs: 15000, retentionDays: 15, alertRules: [], remoteWriteEnabled: false }` |
| `log-aggregator` | Logs (ELK/Loki) | 50,000 | 5ms | `{ retentionDays: 30, indexPattern: "daily", maxLineLengthKB: 1, parsers: ["json","regex"] }` |
| `distributed-tracer` | Tracing (Jaeger) | 10,000 | 2ms | `{ samplingRate: 0.01, retentionDays: 7, maxTraceDurationMs: 60000, propagation: "w3c"\|"b3"\|"jaeger" }` |
| `alerting-engine` | Alerting | 1,000 | 100ms | `{ channels: ["slack","pagerduty","email","webhook"], evaluationIntervalMs: 60000, groupWaitMs: 30000 }` |

### SECURITY Components (4)

| ID | Name | RPS | Latency | Special Config |
|---|---|---|---|---|
| `auth-service` | Auth Service (OAuth/OIDC) | 5,000 | 20ms | `{ provider: "custom"\|"auth0"\|"cognito"\|"clerk", tokenTtlMs: 3600000, refreshEnabled: true, mfaEnabled: false, sessionStorage: "jwt"\|"opaque" }` |
| `rate-limiter` | Rate Limiter | 500,000 | 0.5ms | `{ algorithm: "token-bucket"\|"sliding-window"\|"fixed-window"\|"leaky-bucket", windowMs: 60000, maxRequests: 1000, burstSize: 50, distributed: true }` |
| `secret-manager` | Secret Manager (Vault) | 1,000 | 5ms | `{ backend: "kv"\|"transit"\|"pki", ttlMs: 3600000, autoRotate: true, auditEnabled: true }` |
| `encryption-service` | Encryption Service | 10,000 | 1ms | `{ algorithm: "AES-256-GCM"\|"ChaCha20-Poly1305", keyRotationDays: 90, hsmEnabled: false }` |

---

## EDGE TYPES (10 Connection Types)

```typescript
// lib/system-design/edge-types.ts

export interface EdgeTypeDefinition {
  id: string;
  name: string;
  style: {
    stroke: string;           // CSS color
    strokeWidth: number;
    strokeDasharray?: string; // "none" | "5,5" | "2,2"
    animated: boolean;        // particle flow animation
    markerEnd: "arrow" | "diamond" | "circle" | "none";
    doubleLine?: boolean;     // for replication edges
  };
  defaultConfig: EdgeConfig;
  particleColor: string;      // color of flow particles
  particleSpeed: number;      // pixels per second
}

export interface EdgeConfig {
  latencyMs: number;
  bandwidthMbps: number;
  errorRate: number;          // 0.0 - 1.0
  timeoutMs: number;
  retries: number;
  retryBackoffMs: number;
  protocol: string;
  compressed: boolean;
  encrypted: boolean;
  bidirectional: boolean;
}
```

| ID | Name | Stroke | Dash | Color | Default Latency | Bandwidth | Particle Color |
|---|---|---|---|---|---|---|---|
| `http` | HTTP/REST | solid | none | `#3B82F6` (blue) | 50ms | 100 Mbps | blue |
| `grpc` | gRPC | solid | none | `#A855F7` (purple) | 10ms | 200 Mbps | purple |
| `graphql` | GraphQL | solid | none | `#06B6D4` (cyan) | 30ms | 100 Mbps | cyan |
| `websocket` | WebSocket | dashed | `8,4` | `#22C55E` (green) | 5ms | 50 Mbps | green |
| `message-queue` | Message Queue | dashed | `6,6` | `#F97316` (orange) | 20ms | 50 Mbps | orange |
| `event-stream` | Event Stream | dashed | `4,8` | `#EF4444` (red) | 5ms | 500 Mbps | red |
| `db-query` | Database Query | dotted | `2,4` | `#6B7280` (gray) | 5ms | 1000 Mbps | gray-light |
| `cache-lookup` | Cache Lookup | dotted | `2,4` | `#F59E0B` (yellow) | 0.5ms | 10000 Mbps | yellow |
| `dns-lookup` | DNS Lookup | thin dotted | `1,6` | `#8B5CF6` (violet) | 1ms | 1 Mbps | violet |
| `replication` | Replication | double-line | none | `#14B8A6` (teal) | 10ms | 1000 Mbps | teal |

Each edge renders on the React Flow canvas using a custom edge component:

```typescript
// components/canvas/edges/SystemDesignEdge.tsx
// Custom edge that draws the correct style based on edge type,
// renders animated particles along the path during simulation,
// and shows a label with latency/throughput on hover.
// Uses quadratic bezier for curved paths with configurable curvature.
// Double-line edges render two parallel paths offset by 3px.
```

---

## WASM SIMULATION ENGINE

The simulation engine runs in a Web Worker, compiled from Rust to WASM via `wasm-pack`. It models each component as a queuing system and processes discrete time-step ticks.

### Rust Crate Structure

```
wasm-sim/
  Cargo.toml
  src/
    lib.rs              # wasm_bindgen entry points
    engine.rs           # main simulation loop
    queue.rs            # M/M/1, M/M/c, M/D/1 queue implementations
    traffic.rs          # traffic pattern generators
    chaos.rs            # chaos event injection
    metrics.rs          # metric aggregation & percentile computation
    topology.rs         # graph representation of system
    capacity.rs         # capacity planning calculator
    types.rs            # shared types
```

### Queuing Theory Models

All formulas are implemented in Rust with `f64` precision:

**M/M/1 (Single Server)**
```
arrival_rate (lambda) = incoming RPS
service_rate (mu) = 1000 / base_latency_ms
utilization (rho) = lambda / mu
avg_queue_length (Lq) = rho^2 / (1 - rho)
avg_system_length (L) = rho / (1 - rho)
avg_wait_time (Wq) = rho / (mu * (1 - rho))
avg_response_time (W) = 1 / (mu - lambda)
// System is STABLE only if rho < 1.0
// When rho >= 1.0, queue grows unbounded -> component turns red
```

**M/M/c (Multi-Server, c = instances)**
```
rho = lambda / (c * mu)
// Erlang-C formula for P(queueing):
sum = SUM_{k=0}^{c-1} [ (c*rho)^k / k! ]
P0 = 1 / [ sum + (c*rho)^c / (c! * (1 - rho)) ]
C(c, rho) = [ (c*rho)^c / (c! * (1 - rho)) ] * P0
Wq = C(c, rho) / (c * mu * (1 - rho))
W = Wq + 1/mu
Lq = lambda * Wq
L = lambda * W
```

**Little's Law (universal)**
```
L = lambda * W     (avg items in system = arrival rate * avg time in system)
Lq = lambda * Wq   (avg items in queue = arrival rate * avg wait time)
```

**Finite Queue (M/M/1/K)**
```
// When capacity K is set:
P_loss = (1 - rho) * rho^K / (1 - rho^(K+1))
effective_throughput = lambda * (1 - P_loss)
```

**Latency Distribution Generation**
```
// Base latency follows lognormal distribution:
actual_latency = base_latency * exp(normal_random(0, 0.3))
// Under load (utilization > 0.7):
actual_latency *= 1 + (utilization - 0.7) * 10  // exponential degradation
// P50 = median(samples), P90 = percentile(samples, 0.90), P99 = percentile(samples, 0.99)
```

### Traffic Generation Patterns

```typescript
// Exposed via WASM to JS

export type TrafficPattern =
  | { type: "constant"; rps: number }
  | { type: "sine-wave"; baseRps: number; amplitude: number; periodSeconds: number }
  | { type: "spike"; baseRps: number; spikeRps: number; spikeStartSec: number; spikeDurationSec: number }
  | { type: "ramp"; startRps: number; endRps: number; durationSeconds: number }
  | { type: "poisson"; avgRps: number }
  | { type: "diurnal"; peakRps: number; troughRps: number; peakHour: number }
  | { type: "step"; levels: Array<{ rps: number; durationSec: number }> }
  | { type: "replay"; timestamps: number[]; counts: number[] };
```

Each pattern generates a `current_rps(tick: u64, tick_rate: f64) -> f64` value that feeds into the first layer of components (clients/load balancers).

### Simulation Tick Loop (Rust)

```rust
// engine.rs - pseudocode of the main loop
pub fn tick(&mut self, dt_ms: f64) -> SimulationSnapshot {
    self.current_time += dt_ms;

    // 1. Generate traffic from sources based on pattern
    for source in &self.sources {
        let rps = source.pattern.current_rps(self.current_time);
        let requests = self.generate_requests(rps, dt_ms);
        self.inject_requests(source.target_node_id, requests);
    }

    // 2. Process each node in topological order
    for node_id in &self.topological_order {
        let node = self.nodes.get_mut(node_id).unwrap();

        // Check if node is in failure state
        if node.is_failed() {
            node.reject_all_incoming();
            continue;
        }

        // Apply queuing model
        let processed = node.process_queue(dt_ms);

        // Route processed requests to downstream nodes
        for req in processed {
            let edge = self.get_outgoing_edge(node_id, &req);
            // Apply edge latency, error rate, timeout
            let delivered = edge.transmit(req);
            if let Some(next_node) = delivered {
                self.inject_requests(edge.target, vec![next_node]);
            }
        }

        // Update node metrics
        node.update_metrics(dt_ms);
    }

    // 3. Check and apply auto-scaling rules
    self.evaluate_autoscaling();

    // 4. Check for and trigger chaos events
    self.apply_chaos_events();

    // 5. Emit particle positions for animation
    let particles = self.compute_particle_positions();

    // 6. Build snapshot
    SimulationSnapshot {
        tick: self.tick_count,
        time_ms: self.current_time,
        node_metrics: self.collect_node_metrics(),
        edge_metrics: self.collect_edge_metrics(),
        particles,
        events: self.drain_events(),
        global_metrics: self.compute_global_metrics(),
    }
}
```

### Worker Communication (Comlink)

```typescript
// workers/simulation.worker.ts
import * as Comlink from "comlink";
import init, { SimulationEngine } from "../wasm-sim/pkg";

class SimulationWorker {
  private engine: SimulationEngine | null = null;
  private running = false;
  private speed = 1.0;
  private tickRate = 16.67; // ~60fps

  async initialize(topology: string): Promise<void> {
    await init();
    this.engine = SimulationEngine.new(topology);
  }

  start(): void {
    this.running = true;
    this.loop();
  }

  stop(): void { this.running = false; }
  pause(): void { this.running = false; }

  setSpeed(speed: number): void { this.speed = speed; }

  private loop(): void {
    if (!this.running || !this.engine) return;
    const snapshot = this.engine.tick(this.tickRate * this.speed);
    // Post snapshot to main thread via structured clone
    postMessage({ type: "snapshot", data: snapshot });
    requestAnimationFrame(() => this.loop());
  }

  injectChaos(event: string): void {
    this.engine?.inject_chaos(event);
  }

  updateTopology(topology: string): void {
    this.engine?.update_topology(topology);
  }

  getCapacityReport(): string {
    return this.engine?.capacity_report() ?? "{}";
  }
}

Comlink.expose(new SimulationWorker());
```

---

## PARTICLE ANIMATION SYSTEM

Particles flow along edges during simulation to visually indicate traffic. Rendered on a Canvas 2D overlay (not DOM) for performance.

```typescript
// components/canvas/overlays/ParticleLayer.tsx

interface Particle {
  id: string;
  edgeId: string;
  progress: number;     // 0.0 to 1.0 along edge path
  speed: number;        // units per frame
  color: string;
  size: number;         // radius in px (2-4)
  opacity: number;      // 0.0-1.0, fades at end
  type: "request" | "response" | "error" | "event";
  trail: boolean;       // leave a fading trail
}

// Particle rendering at 60fps:
// 1. Get edge SVG path from React Flow
// 2. Use getPointAtLength(progress * totalLength) for position
// 3. Draw circle at position with glow effect
// 4. Error particles are red with larger size
// 5. Trail effect: draw 3-5 smaller circles behind at decreasing opacity
// 6. Batch all particles into single canvas draw call per frame
// Max 2000 simultaneous particles; oldest recycled when limit hit
```

---

## CHAOS ENGINEERING EVENTS (50+)

Organized by category. Each event is injectable via UI button, keyboard shortcut, or automatic random injection.

```typescript
export interface ChaosEvent {
  id: string;
  name: string;
  category: ChaosCategory;
  description: string;
  targetType: "node" | "edge" | "global";
  targetFilter?: string[];       // which component types this applies to
  parameters: ChaosParameter[];
  durationMs: number;            // default duration
  severity: "minor" | "moderate" | "severe" | "catastrophic";
  icon: string;                  // Lucide icon name
}

export type ChaosCategory =
  | "infrastructure" | "network" | "application" | "data" | "traffic" | "cloud";

export interface ChaosParameter {
  name: string;
  type: "number" | "boolean" | "select";
  default: unknown;
  min?: number;
  max?: number;
  options?: string[];
  description: string;
}
```

### Infrastructure Failures (10)
1. **Node Crash** -- Immediately kills a component instance. All in-flight requests dropped. `{ recoveryMs: 30000, instances: 1 }`
2. **Node Restart** -- Graceful shutdown then cold start. `{ drainMs: 5000, coldStartMs: 10000 }`
3. **CPU Spike** -- Utilization jumps to 95%, latency increases 10x. `{ durationMs: 30000, utilizationPercent: 95 }`
4. **Memory Leak** -- Memory grows linearly until OOM crash. `{ leakRateMBPerSec: 50, maxMemoryMB: 4096 }`
5. **Disk Full** -- Storage component rejects writes. `{ fillRateGBPerMin: 1 }`
6. **Process Hang** -- Component stops processing but stays "alive" (zombie). `{ durationMs: 60000 }`
7. **GC Pause** -- Stop-the-world garbage collection. `{ pauseMs: 500, frequency: "once"\|"repeated" }`
8. **Hot Restart** -- In-place restart without drain. `{ restartMs: 5000 }`
9. **Resource Exhaustion** -- Thread pool / connection pool depleted. `{ resource: "threads"\|"connections"\|"file-descriptors", durationMs: 30000 }`
10. **Clock Skew** -- Node's clock drifts. `{ skewMs: 5000, direction: "fast"\|"slow" }`

### Network Failures (10)
11. **Network Partition** -- Split nodes into two groups that cannot communicate. `{ groupA: string[], groupB: string[] }`
12. **Latency Injection** -- Add fixed or random latency to edge. `{ addedMs: 500, jitterMs: 100 }`
13. **Packet Loss** -- Random percentage of requests dropped. `{ lossPercent: 10, burstLength: 1 }`
14. **Bandwidth Throttle** -- Reduce edge bandwidth. `{ maxMbps: 1 }`
15. **Connection Reset** -- TCP RST on random connections. `{ resetPercent: 5 }`
16. **DNS Failure** -- DNS resolution fails. `{ durationMs: 30000, failType: "nxdomain"\|"timeout"\|"servfail" }`
17. **TLS Handshake Failure** -- SSL errors. `{ failRate: 0.5, errorType: "expired"\|"mismatch"\|"revoked" }`
18. **Route Blackhole** -- Traffic to specific component disappears silently. `{ targetNodeId: string }`
19. **Asymmetric Partition** -- A can reach B but B cannot reach A. `{ nodeA: string, nodeB: string }`
20. **Jitter Storm** -- Wildly variable latency. `{ minMs: 1, maxMs: 2000, durationMs: 60000 }`

### Application Failures (10)
21. **Error Spike** -- Error rate jumps to configured percentage. `{ errorRate: 0.5, errorCode: 500 }`
22. **Slow Response** -- 10x latency on percentage of requests. `{ slowPercent: 20, multiplier: 10 }`
23. **Cascade Failure** -- One node failure triggers downstream failures. `{ originNodeId: string, propagationDelayMs: 5000 }`
24. **Deadlock** -- Component stops processing, queue grows. `{ durationMs: 60000 }`
25. **Memory Pressure** -- GC frequency increases, throughput drops. `{ pressureLevel: 0.9 }`
26. **Thread Starvation** -- Worker threads exhausted. `{ blockedThreads: "all"\|number }`
27. **Connection Pool Exhaustion** -- No available DB connections. `{ durationMs: 30000 }`
28. **Poison Message** -- Queue gets a message that crashes consumers. `{ retryCount: 3, dlqEnabled: boolean }`
29. **Circuit Breaker Trip** -- Circuit opens, all requests fast-fail. `{ resetTimeMs: 60000 }`
30. **Config Drift** -- Component misconfiguration. `{ parameter: string, invalidValue: unknown }`

### Data Failures (8)
31. **Data Corruption** -- Read errors for percentage of queries. `{ corruptionRate: 0.01 }`
32. **Stale Cache** -- Cache returns outdated data. `{ staleDurationMs: 300000 }`
33. **Replication Lag** -- Replica falls behind primary. `{ lagMs: 5000 }`
34. **Split Brain** -- Two nodes both think they are primary. `{ durationMs: 60000 }`
35. **Index Corruption** -- Search/query performance degrades. `{ degradationFactor: 100 }`
36. **WAL Corruption** -- Write-ahead log unreadable. `{ recoveryStrategy: "replay"\|"snapshot" }`
37. **Backup Failure** -- Scheduled backup fails. `{ failureType: "timeout"\|"permission"\|"space" }`
38. **Schema Mismatch** -- Incompatible schema version deployed. `{ errorRate: 0.3 }`

### Traffic Events (8)
39. **Traffic Spike** -- 10x normal traffic. `{ multiplier: 10, rampUpMs: 1000, durationMs: 60000 }`
40. **Traffic Drop** -- Traffic falls to near zero. `{ dropPercent: 95, durationMs: 30000 }`
41. **Hot Key** -- All requests target same shard/partition. `{ hotKeyPercent: 80 }`
42. **Thundering Herd** -- Cache expires, all requests hit origin simultaneously. `{ concurrentRequests: 10000 }`
43. **Slow Loris** -- Connections opened but never completed. `{ connectionCount: 500, holdTimeMs: 60000 }`
44. **DDoS Simulation** -- Massive request flood from distributed sources. `{ rps: 1000000, durationMs: 60000 }`
45. **Retry Storm** -- All clients retry simultaneously after brief outage. `{ retryMultiplier: 5, waveDurationMs: 10000 }`
46. **Traffic Shift** -- Geographic traffic pattern changes. `{ fromRegion: string, toRegion: string, shiftPercent: 80 }`

### Cloud Events (6)
47. **AZ Failure** -- Entire availability zone goes down. `{ azId: string, durationMs: 300000 }`
48. **Region Failover** -- Primary region unavailable, failover triggered. `{ primaryRegion: string, failoverRegion: string }`
49. **Spot Instance Termination** -- 2-minute warning then instance dies. `{ warningMs: 120000, instanceCount: 1 }`
50. **API Rate Limit** -- Cloud provider throttles API calls. `{ service: "s3"\|"dynamodb"\|"lambda", throttlePercent: 50 }`
51. **Certificate Expiry** -- TLS cert expires mid-simulation. `{ warningHours: 0, affectedNodes: string[] }`
52. **Deployment Rollout** -- Rolling update with temporary mixed versions. `{ newVersionPercent: 0, rolloutSpeedPercent: 10, canaryEnabled: boolean }`

---

## CAPACITY PLANNING CALCULATOR

Built into the Properties Panel and accessible via a dedicated modal. Computes infrastructure requirements from traffic estimates.

```typescript
export interface CapacityInput {
  dailyActiveUsers: number;
  peakMultiplier: number;          // typically 2-5x average
  readWriteRatio: number;          // e.g., 100 (100:1 read-heavy)
  avgRequestSizeKB: number;
  avgResponseSizeKB: number;
  dataRetentionDays: number;
  replicationFactor: number;
  availabilityTarget: number;      // 0.999, 0.9999, etc.
  growthRateMonthly: number;       // 0.05 = 5% month-over-month
}

export interface CapacityOutput {
  peakRPS: number;                 // DAU * requests_per_user / 86400 * peakMultiplier
  readRPS: number;
  writeRPS: number;
  bandwidthGbps: number;           // (readRPS * avgResponseSize + writeRPS * avgRequestSize) * 8 / 1e6
  storageTB: number;               // writeRPS * avgRequestSize * 86400 * retentionDays * replicationFactor / 1e12
  cacheStorageGB: number;          // 20% of hot data in memory
  requiredInstances: {             // per component type
    [componentId: string]: {
      count: number;
      reasoning: string;           // "5000 RPS / 1000 RPS per instance = 5, +1 for headroom = 6"
    };
  };
  estimatedMonthlyCost: number;    // sum of all instances * costPerHour * 730
  bottleneck: string;              // which component saturates first
  projectedSaturationDate: string; // based on growth rate
}

// Formulas:
// peakRPS = (DAU * avgRequestsPerUser) / 86400 * peakMultiplier
// instances_needed = ceil(targetRPS / component.throughputLimit) + 1
// storage_per_day = writeRPS * avgRequestSizeKB * 86400 / 1e6 (GB)
// total_storage = storage_per_day * retentionDays * replicationFactor
// bandwidth = (readRPS * avgResponseSizeKB + writeRPS * avgRequestSizeKB) * 8 / 1e6 (Gbps)
// cost = sum(instances * costPerHour * 730)
// saturation = log(maxCapacity / currentUsage) / log(1 + growthRate) months
```

---

## REAL-TIME METRICS DASHBOARD

Rendered in the Bottom Panel "Metrics" tab during simulation. Uses lightweight canvas-based charts (no heavy chart library -- custom drawn on `<canvas>`).

### Charts & Visualizations

1. **Throughput Line Chart** -- X-axis: time (last 60s rolling window). Y-axis: requests/sec. One line per selected component, color-coded. Stacked area option for aggregate.

2. **Latency Percentiles** -- Three stacked lines: P50 (green), P90 (yellow), P99 (red). Y-axis: milliseconds, log scale option. Tooltip shows exact values.

3. **Error Rate** -- Area chart, 0-100% Y-axis. Red fill when above threshold (default 1%). Annotation markers for chaos events.

4. **Queue Depth Bars** -- Horizontal bar per messaging component. Color gradient from green (low) to red (near capacity). Numeric label showing current/max.

5. **Utilization Gauges** -- Circular gauge per compute component. Green 0-70%, yellow 70-85%, red 85-100%. Shows current value and trend arrow.

6. **Cache Hit Rate** -- Single donut chart per cache component. Green slice = hits, red slice = misses. Center text shows percentage.

7. **Circuit Breaker State** -- State indicator per component with circuit breaker: Closed (green circle), Open (red circle), Half-Open (yellow circle). Shows trip count and last state change timestamp.

8. **Global Summary Bar** -- Top of metrics panel: Total RPS | Avg Latency | Error Rate | Active Nodes | Active Chaos Events. Color-coded badges.

### Metric Data Structure

```typescript
export interface MetricTimeSeries {
  nodeId: string;
  metric: string;                // "throughput" | "latency_p50" | "latency_p90" | etc.
  points: Array<{
    timestamp: number;           // ms since simulation start
    value: number;
  }>;
  maxPoints: 3600;               // 1 point per tick, ~60s at 60fps
}
```

---

## TEMPLATE SYSTEM

Pre-built architecture diagrams users can load as starting points. Stored as JSON. Includes 30 templates derived from real-world case studies.

### Template JSON Schema

```typescript
export interface SystemDesignTemplate {
  id: string;
  name: string;
  description: string;
  category: "social" | "streaming" | "ecommerce" | "messaging" | "search" | "infrastructure" | "fintech" | "gaming" | "iot" | "ml";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  thumbnail: string;             // path to preview image
  nodes: ArchitexNode[];
  edges: ArchitexEdge[];
  trafficPattern: TrafficPattern;
  chaosScenarios: Array<{
    name: string;
    events: ChaosEvent[];
    description: string;
  }>;
  interviewNotes: string;        // talking points for interview practice
  metadata: {
    author: string;
    version: string;
    estimatedComponents: number;
    estimatedEdges: number;
    realWorldReference: string;   // "Twitter Fanout Architecture (2012-present)"
  };
}
```

### 30 Starter Templates

**Tier 1 - Classic Interview (8)**
1. Twitter Fanout Architecture -- fanout-on-write with celebrity hybrid, Snowflake IDs, Redis timelines
2. Uber Geospatial Dispatch -- S2 cell indexing, driver matching, surge pricing, trip state machine
3. Netflix Streaming CDN -- Open Connect, Zuul gateway, Eureka discovery, adaptive bitrate
4. WhatsApp Messaging -- Erlang connection servers, E2E encryption, offline queuing, delivery receipts
5. YouTube Video Pipeline -- upload/transcode/serve DAG, Vitess sharding, recommendation engine
6. Google Search -- web crawler, inverted index, PageRank, scatter-gather query
7. Amazon E-Commerce -- cart service with vector clocks, order saga, recommendation, auto-scaling
8. Instagram Feed -- sharded Postgres, ML feed ranking, Celery workers, CDN for images

**Tier 2 - Modern Systems (7)**
9. Discord Real-time -- BEAM VM connections, ScyllaDB, voice SFU routing
10. Spotify Recommendation -- collaborative filtering pipeline, audio analysis, Discover Weekly
11. Dropbox Block Sync -- content-addressable blocks, delta sync, deduplication
12. TikTok For-You Feed -- multi-stage ranking (millions to 10), interest vectors
13. Slack Workspace -- WebSocket lifecycle, Flannel edge cache, permission-aware search
14. Reddit Ranking -- hot formula (log10 votes + age/45000), Wilson score comments
15. Zoom Video -- SFU architecture, SVC quality layers, bandwidth adaptation

**Tier 3 - Infrastructure (15)**
16. URL Shortener -- Base62 encoding, read-heavy cache, 301/302 redirects
17. Web Crawler -- BFS frontier, robots.txt politeness, URL deduplication, Bloom filter
18. Notification System -- multi-channel (push/email/SMS), priority queues, fan-out, rate limiting
19. Chat System -- WebSocket connections, message ordering, read receipts, group chat fanout
20. Typeahead/Autocomplete -- Trie with precomputed top-k, prefix search, real-time updates
21. Rate Limiter -- token bucket distributed via Redis, sliding window counter
22. Distributed KV Store -- Dynamo-style (consistent hashing, vector clocks, sloppy quorum, merkle tree anti-entropy)
23. Unique ID Generator -- Snowflake architecture (timestamp + datacenter + machine + sequence)
24. Ticket Booking System -- seat reservation with distributed locking, double-booking prevention
25. Metrics & Monitoring -- Prometheus scrape, TSDB, PromQL aggregation, Grafana dashboards, alerting pipeline
26. Payment Processing -- idempotency keys, Saga pattern, PCI-compliant vault, ledger double-entry
27. CI/CD Pipeline -- DAG task scheduler, artifact storage, parallel builds, deployment strategies
28. Distributed Cache -- consistent hashing ring, cache-aside/write-through/write-behind patterns
29. Content Delivery Network -- DNS CNAME routing, edge POP cache, origin shield, cache invalidation
30. Food Delivery Platform -- 3-sided marketplace (customer, restaurant, driver), order state machine, ETA prediction

---

## EXPORT SYSTEM

Export the current diagram in multiple formats:

```typescript
export type ExportFormat = "json" | "png" | "svg" | "pdf" | "mermaid" | "plantuml";

// JSON: Full ArchitexNode[] + ArchitexEdge[] + metadata. Uses lz-string compression for sharing URLs.
// PNG: html-to-image captures the React Flow viewport. Options: { scale: 1|2|4, background: boolean, padding: 40 }
// SVG: html-to-image SVG mode, with embedded fonts. Ideal for documentation.
// PDF: jsPDF with SVG embedded. Options: { orientation: "landscape"|"portrait", pageSize: "A4"|"letter"|"A3" }

// Mermaid: Convert topology to Mermaid flowchart syntax
// Example output:
// ```mermaid
// flowchart LR
//   Client[Web Client] -->|HTTP| LB[Load Balancer L7]
//   LB -->|HTTP| App1[App Server 1]
//   LB -->|HTTP| App2[App Server 2]
//   App1 -->|Query| DB[(PostgreSQL)]
//   App2 -->|Query| DB
//   App1 -->|Cache| Redis[(Redis)]
// ```

// PlantUML: Convert to PlantUML component diagram syntax
// Example output:
// @startuml
// [Web Client] --> [Load Balancer L7] : HTTP
// [Load Balancer L7] --> [App Server 1] : HTTP
// [Load Balancer L7] --> [App Server 2] : HTTP
// [App Server 1] --> [PostgreSQL] : Query
// [App Server 2] --> [PostgreSQL] : Query
// [App Server 1] --> [Redis] : Cache
// @enduml
```

---

## COMPONENT PALETTE UI

The left sidebar in System Design mode shows a searchable, categorized palette of all components.

```typescript
// components/canvas/panels/ComponentPalette.tsx (System Design mode)

// Structure:
// [Search bar with Cmd+/ focus]
// [Category: Compute]
//   [icon] Web Server        ← draggable
//   [icon] App Server        ← draggable
//   ...
// [Category: Storage]
//   [icon] PostgreSQL
//   ...
// Each category is collapsible (accordion).
// Drag uses React DnD or native HTML5 drag.
// Drop zone is the React Flow canvas.
// On drop: canvasStore.addNode() with default config for that component type.
// Ghost preview shows during drag with 50% opacity.
// Tooltip on hover shows: name, description, default throughput, default latency.
// Badge on component shows common use count (from community data, future feature).
```

---

## PROPERTIES PANEL FOR SYSTEM DESIGN

When a node is selected, the right panel shows all configurable properties:

```
┌─────────────────────────────────┐
│ [icon] Web Server               │  ← component name + icon
│ nginx-1                         │  ← editable instance name
├─────────────────────────────────┤
│ PERFORMANCE                     │
│ Instances        [  3  ] [+][-] │
│ Throughput Limit [ 10000 ] rps  │
│ Base Latency     [   2   ] ms   │
│ Error Rate       [ 0.001 ]      │
├─────────────────────────────────┤
│ RESOURCES                       │
│ CPU Cores        [  4  ]        │
│ Memory           [ 2048 ] MB    │
│ Cost/Hour        [ $0.12 ]      │
├─────────────────────────────────┤
│ AUTO-SCALING                    │
│ Enabled          [x]            │
│ Min Instances    [  1  ]        │
│ Max Instances    [ 10  ]        │
│ Target Util.     [ 0.7 ]        │
│ Cooldown         [ 60  ] sec    │
├─────────────────────────────────┤
│ COMPONENT-SPECIFIC              │
│ Worker Processes [  4  ]        │
│ Keep-Alive       [ 65  ] sec    │
│ Max Connections  [ 1024 ]       │
├─────────────────────────────────┤
│ SIMULATION STATE                │
│ Status: ● Active                │
│ Current RPS: 8,432              │
│ Utilization: 73%   [███████░░░] │
│ Queue Depth: 12                 │
│ P50: 3ms  P90: 8ms  P99: 24ms  │
├─────────────────────────────────┤
│ [Inject Chaos ▼] [Delete Node]  │
└─────────────────────────────────┘
```

All numeric fields are editable inputs. Changes are immediately applied to the simulation engine via `worker.updateTopology()`.

---

## WHAT SUCCESS LOOKS LIKE (End of Phase 2)

1. All 60+ components render as styled nodes on the canvas with correct icons and category colors
2. All 10 edge types render with correct visual styles (color, dash, animation)
3. Dragging a component from the palette creates a node on the canvas
4. Connecting two nodes creates an edge with auto-detected type (storage->db-query, etc.)
5. Selecting a node shows its full property panel; changes update simulation live
6. Starting simulation triggers WASM engine, particles flow along edges
7. Metrics panel shows live throughput, latency, error rate, utilization charts
8. All 7 traffic patterns generate correct load profiles
9. Injecting any chaos event produces visible impact on metrics and component states
10. Capacity calculator produces accurate infrastructure estimates
11. All 30 templates load correctly with pre-positioned components
12. Export to all 6 formats produces valid output
13. Simulation runs at stable 60fps with 50+ nodes and 100+ edges
14. Auto-scaling visually adds/removes instances during traffic spikes
15. Circuit breakers open/close with correct state transitions
