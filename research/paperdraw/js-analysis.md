# paperdraw.dev (Antigravity) - main.dart.js Complete Analysis

**Source:** `https://paperdraw.dev/main.dart.js?v=20260324-recovery1`  
**File Size:** 5,269,777 bytes (5.1 MB compiled Dart/Flutter)  
**Product Name:** Antigravity System Design Simulator  
**Analysis Date:** 2026-04-11  

---

## 1. COMPONENT TYPES (107 Total)

### Infrastructure and Networking (0-5)
| # | ID | Display Name | Description |
|---|---|---|---|
| 0 | `dns` | DNS | Traffic routing and domain resolution |
| 1 | `cdn` | CDN | Cache static content globally |
| 2 | `loadBalancer` | Load Balancer | Distribute traffic across servers |
| 3 | `apiGateway` | API Gateway | Auth, rate limiting, routing |
| 4 | `waf` | WAF | Web application firewall |
| 5 | `ingress` | Ingress | Edge reverse proxy / ingress |

### Compute (6-8)
| # | ID | Display Name | Description |
|---|---|---|---|
| 6 | `appServer` | App Server | Business logic processing |
| 7 | `worker` | Worker | Async background jobs |
| 8 | `serverless` | Serverless | Event-based compute |

### Services (9-17)
| # | ID | Display Name | Description |
|---|---|---|---|
| 9 | `authService` | Auth Service | Authentication and authorization |
| 10 | `notificationService` | Notification Service | Email/SMS/push dispatch |
| 11 | `searchService` | Search Service | Query and ranking layer |
| 12 | `analyticsService` | Analytics Service | Event processing and insights |
| 13 | `scheduler` | Scheduler | Cron/workflow scheduling |
| 14 | `serviceDiscovery` | Service Discovery | Service registry and lookup |
| 15 | `configService` | Config Service | Dynamic configuration store |
| 16 | `secretsManager` | Secrets Manager | Keys and secrets storage |
| 17 | `featureFlag` | Feature Flags | Runtime feature toggles |

### Observability (18-24)
| # | ID | Display Name | Description |
|---|---|---|---|
| 18 | `metricsCollectorAgent` | Metrics Collector Agent | Collects and ships service metrics |
| 19 | `timeSeriesMetricsStore` | Time-Series Metrics Store | Stores metrics for trend analysis and dashboards |
| 20 | `logCollectorAgent` | Log Collector Agent | Collects logs from services and hosts |
| 21 | `logAggregationService` | Log Aggregation Service | Indexes and queries centralized logs |
| 22 | `distributedTracingCollector` | Distributed Tracing Collector | Collects traces and spans across services |
| 23 | `alertingEngine` | Alerting Engine | Evaluates rules and routes incident alerts |
| 24 | `healthCheckMonitor` | Health Check Monitor | Continuously probes service and dependency health |

### Network Containers (25-35)
| # | ID | Display Name | Description |
|---|---|---|---|
| 25 | `networkLoadBalancer` | Load Balancer (L4/L7) | Container for traffic distribution, WAF, and health routing |
| 26 | `reverseProxy` | Reverse Proxy | Container for inbound traffic filtering and routing |
| 27 | `networkApiGateway` | API Gateway (Network) | Container for API traffic governance and edge policies |
| 28 | `edgeRouter` | Edge Router | Container for ingress and egress traffic routing at the edge |
| 29 | `vpc` | VPC | Container for private network boundaries and connectivity |
| 30 | `subnet` | Subnet | Container for isolated network segments inside a VPC |
| 31 | `natGateway` | NAT Gateway | Container for controlled outbound network translation |
| 32 | `vpnGateway` | VPN Gateway | Container for encrypted cross-network tunnels |
| 33 | `serviceMesh` | Service Mesh | Container for service-to-service traffic control |
| 34 | `dnsServer` | DNS Server | Container for internal DNS resolution and policies |
| 35 | `networkDiscoveryService` | Discovery Service | Container for runtime service registration and discovery |

### Network Child Components (36-46)
| # | ID | Display Name | Description |
|---|---|---|---|
| 36 | `routingRule` | Routing Rule | Routing policy object inside network containers |
| 37 | `wafModule` | WAF Module | WAF policy module attached to network containers |
| 38 | `networkRateLimiter` | Rate Limiter | Traffic rate limiting policy module |
| 39 | `healthCheckService` | Health Check Service | Health probing service for upstream target pools |
| 40 | `networkInterface` | Network Interface | Logical NIC endpoint inside connectivity containers |
| 41 | `routingTable` | Routing Table | Route map used by routers, VPCs, and subnets |
| 42 | `securityGroup` | Security Group | Stateful traffic filter policy set |
| 43 | `firewallRule` | Firewall Rule | Packet filtering and allow/deny rule set |
| 44 | `sidecarProxy` | Sidecar Proxy | Per-service proxy for mesh communication |
| 45 | `registryDatabase` | Registry Database | Service registry backing store |
| 46 | `routingPolicy` | Routing Policy | Policy definition for mesh and discovery routing |

### AI/LLM Components (47-51)
| # | ID | Display Name | Description |
|---|---|---|---|
| 47 | `llmGateway` | LLM Gateway | Route prompts to models with safety/cost control |
| 48 | `toolRegistry` | Tool Registry | Discoverable tools/skills catalog |
| 49 | `memoryFabric` | Memory Fabric | Short/long-term memory layers |
| 50 | `agentOrchestrator` | Agent Orchestrator | Plan/act loops and agent spawning |
| 51 | `safetyMesh` | Safety and Observability Mesh | Guardrails, red teaming, telemetry |

### Data Clients and Storage (52-62)
| # | ID | Display Name | Description |
|---|---|---|---|
| 52 | `client` | Users | Client traffic source |
| 53 | `cache` | Cache | Hot data caching (Redis) |
| 54 | `database` | Database | Persistent data storage |
| 55 | `objectStore` | Object Store | Files, images, videos |
| 56 | `keyValueStore` | KV Store | Key-value storage |
| 57 | `timeSeriesDb` | Time Series DB | Metrics and time-series data |
| 58 | `graphDb` | Graph DB | Relationship storage |
| 59 | `vectorDb` | Vector DB | Embeddings and similarity search |
| 60 | `searchIndex` | Search Index | Index for fast search |
| 61 | `dataWarehouse` | Data Warehouse | Analytical storage |
| 62 | `dataLake` | Data Lake | Raw data storage |

### Messaging (63-65)
| # | ID | Display Name | Description |
|---|---|---|---|
| 63 | `queue` | Message Queue | Async job processing |
| 64 | `pubsub` | Pub/Sub | Event fanout and notifications |
| 65 | `stream` | Stream | Real-time data streaming |

### FinTech and Security (66-71)
| # | ID | Display Name | Description |
|---|---|---|---|
| 66 | `paymentGateway` | Payment Gateway | Payment processing and card transactions |
| 67 | `ledgerService` | Ledger Service | Double-entry accounting and immutable tx log |
| 68 | `fraudDetectionEngine` | Fraud Detection | Real-time fraud scoring and rules engine |
| 69 | `hsm` | HSM | Hardware security module for crypto keys |
| 70 | `ddosShield` | DDoS Shield | DDoS mitigation at network edge |
| 71 | `siem` | SIEM | Security info and event management |

### Data Engineering (72-77)
| # | ID | Display Name | Description |
|---|---|---|---|
| 72 | `etlPipeline` | ETL Pipeline | Extract-Transform-Load data jobs |
| 73 | `cdcService` | CDC Service | Change data capture (Debezium) |
| 74 | `schemaRegistry` | Schema Registry | Schema versioning for events/messages |
| 75 | `batchProcessor` | Batch Processor | Spark/MapReduce batch jobs |
| 76 | `featureStore` | Feature Store | ML feature engineering and serving |
| 77 | `mediaProcessor` | Media Processor | Image/video transcoding and thumbnails |

### Database Internals (78-85)
| # | ID | Display Name | Description |
|---|---|---|---|
| 78 | `sharding` | Sharding | Partition data across servers |
| 79 | `hashing` | Hashing | Distribute keys uniformly |
| 80 | `shardNode` | Shard Node | Database Shard Unit |
| 81 | `primaryNode` | Primary Node | Primary database writer unit |
| 82 | `partitionNode` | Partition Node | Table Partition Unit |
| 83 | `replicaNode` | Replica Node | Read Replica Unit |
| 84 | `inputNode` | Input Source | Data Entry Point |
| 85 | `outputNode` | Output Sink | Data Exit Point |

### Custom / Sketch (86-91)
| # | ID | Display Name | Description |
|---|---|---|---|
| 86 | `customService` | Service | Your custom microservice |
| 87 | `sketchyService` | Sketchy Svc | Hand-drawn Service |
| 88 | `sketchyDatabase` | Sketchy DB | Hand-drawn Database |
| 89 | `sketchyLogic` | Sketchy Logic | Hand-drawn Logic |
| 90 | `sketchyQueue` | Sketchy Queue | Hand-drawn Queue |
| 91 | `sketchyClient` | Sketchy Client | Hand-drawn Client |

### UML / Diagrams (92-99)
| # | ID | Display Name | Description |
|---|---|---|---|
| 92 | `umlClass` | UML Class | UML-style class/service box |
| 93 | `umlInterface` | UML Interface | UML-style interface box |
| 94 | `umlApi` | UML API | UML API endpoint |
| 95 | `umlState` | UML State | UML State machine node |
| 96 | `umlEnum` | UML Enum | Enumeration type |
| 97 | `umlAbstractClass` | Abstract Class | Abstract base class |
| 98 | `umlDbTable` | DB Table | Database table schema |
| 99 | `umlInheritance` | Inheritance | Extends relationship |

### Shapes / Primitives (100-106)
| # | ID | Display Name | Description |
|---|---|---|---|
| 100 | `text` | Text Note | Free text label |
| 101 | `circle` | Circle | Geometric circle |
| 102 | `rectangle` | Rectangle | Geometric rectangle |
| 103 | `diamond` | Diamond | Geometric diamond |
| 104 | `arrow` | Arrow | Directional arrow |
| 105 | `line` | Line | Straight line |
| 106 | `container` | Container | Group components |

---

## 2. CHAOS / FAILURE TYPES (73 Total)

### Chaos Categories (6)
| Ordinal | Name |
|---|---|
| 0 | Infrastructure Failures |
| 1 | Network Chaos |
| 2 | Application-Level Chaos |
| 3 | Data Layer Chaos |
| 4 | Traffic Chaos |
| 5 | Dependency Chaos |

### Chaos Target Scopes (3)
- `global` (0) - Affects entire system
- `region` (1) - Affects specific region
- `component` (2) - Affects single component

### Chaos Drop Targets (7)
- `canvas` (0)
- `compute` (1)
- `network` (2)
- `database` (3)
- `cache` (4)
- `queue` (5)
- `dependency` (6)

### Chaos Synergy Scopes (3)
- `component` (0)
- `region` (1)
- `connection` (2)

### Chaos Component Families (8)
- `service` (0)
- `cache` (1)
- `database` (2)
- `messaging` (3)
- `edge` (4)
- `externalDependency` (5)
- `network` (6)
- `generic` (7)

### Complete Chaos Type Catalog (73 Types)

#### Infrastructure Failures (0-9)
| # | ID | Display Name |
|---|---|---|
| 0 | `availabilityZoneFailure` | Availability Zone Failure |
| 1 | `dataCenterOutage` | Data Center Outage |
| 2 | `instanceCrash` | Instance Crash |
| 3 | `instanceSlowDegradation` | Instance Slow Degradation |
| 4 | `diskFailure` | Disk Failure |
| 5 | `diskCorruption` | Disk Corruption |
| 6 | `storageIopsThrottling` | Storage IOPS Throttling |
| 7 | `fileSystemReadOnlyMode` | File System Read-Only Mode |
| 8 | `vmCpuThrottling` | VM CPU Throttling |
| 9 | `hostHardwareFailure` | Host Hardware Failure |

#### Network Chaos (10-28)
| # | ID | Display Name |
|---|---|---|
| 10 | `networkPartition` | Network Partition |
| 11 | `crossRegionLinkFailure` | Cross-Region Link Failure |
| 12 | `packetLossInjection` | Packet Loss Injection |
| 13 | `highNetworkLatencyInjection` | High Network Latency Injection |
| 14 | `bandwidthThrottling` | Bandwidth Throttling |
| 15 | `connectionFlapping` | Connection Flapping |
| 16 | `loadBalancerFailure` | Load Balancer Failure |
| 17 | `backendPortMisconfiguration` | Backend Port Misconfiguration |
| 18 | `healthCheckMisconfiguration` | Health Check Misconfiguration |
| 19 | `healthCheckFlapping` | Health Check Flapping |
| 20 | `tlsCertificateExpired` | TLS Certificate Expired |
| 21 | `tlsProtocolMismatch` | TLS Protocol Mismatch |
| 22 | `headerBloat` | Header Bloat |
| 23 | `stickySessionSkew` | Sticky Session Skew |
| 24 | `slowStartRegression` | Slow Start Regression |
| 25 | `idleTimeoutMismatch` | Idle Timeout Mismatch |
| 26 | `dnsResolutionFailure` | DNS Resolution Failure |
| 27 | `routingBlackhole` | Routing Blackhole |
| 28 | `natGatewayFailure` | NAT Gateway Failure |

#### Application-Level Chaos (29-38)
| # | ID | Display Name |
|---|---|---|
| 29 | `memoryLeak` | Memory Leak |
| 30 | `outOfMemoryCrash` | Out-of-Memory Crash |
| 31 | `threadPoolExhaustion` | Thread Pool Exhaustion |
| 32 | `deadlockSimulation` | Deadlock Simulation |
| 33 | `gcPauseSpike` | GC Pause Spike |
| 34 | `configurationDrift` | Configuration Drift |
| 35 | `deploymentMisconfiguration` | Deployment Misconfiguration |
| 36 | `featureFlagMisrouting` | Feature Flag Misrouting |
| 37 | `dependencyTimeoutIncrease` | Dependency Timeout Increase |
| 38 | `loggingSystemOverload` | Logging System Overload |

#### Data Layer Chaos (39-51)
| # | ID | Display Name |
|---|---|---|
| 39 | `databasePrimaryCrash` | Database Primary Crash |
| 40 | `replicaFailure` | Replica Failure |
| 41 | `replicationLagSpike` | Replication Lag Spike |
| 42 | `splitBrainScenario` | Split-Brain Scenario |
| 43 | `dataCorruptionInjection` | Data Corruption Injection |
| 44 | `hotShardHotspot` | Hot Shard / Partition Hotspot |
| 45 | `connectionPoolExhaustion` | Connection Pool Exhaustion |
| 46 | `lockContentionSpike` | Lock Contention Spike |
| 47 | `queryPlanRegression` | Query Plan Roulette |
| 48 | `replicaStalenessWindow` | Replica Staleness Window |
| 49 | `lsmCompactionDebt` | LSM Compaction Debt Storm |
| 50 | `metadataLockTrap` | Metadata Lock Trap |
| 51 | `noisyNeighborTenantSaturation` | Noisy Neighbor Tenant Hijack |

#### Cache Chaos (52-62)
| # | ID | Display Name |
|---|---|---|
| 52 | `cachePoisoning` | Cache Poisoning |
| 53 | `cacheEvictionStorm` | Cache Eviction Storm |
| 54 | `cacheConnectionStorm` | Cache Connection Storm |
| 55 | `cacheAuthMisconfiguration` | Cache Auth Misconfiguration |
| 56 | `cacheOomEvictionSurge` | Cache OOM Eviction Surge |
| 57 | `cacheMemoryFragmentation` | Cache Memory Fragmentation |
| 58 | `cachePersistenceFailure` | Cache Persistence Failure |
| 59 | `cacheReplicaDesync` | Cache Replica Desync |
| 60 | `cacheClusterPartition` | Cache Cluster Partition |
| 61 | `cacheScriptBlock` | Cache Script Block |
| 62 | `cacheSentinelSplit` | Cache Sentinel Split |

#### Traffic Chaos (63-67)
| # | ID | Display Name |
|---|---|---|
| 63 | `trafficSpikeSurge` | Traffic Spike Surge |
| 64 | `retryStorm` | Retry Storm |
| 65 | `botTrafficFlood` | Bot Traffic Flood |
| 66 | `thunderingHerdEvent` | Thundering Herd Event |
| 67 | `payloadSizeExplosion` | Payload Size Explosion |

#### Dependency Chaos (68-72)
| # | ID | Display Name |
|---|---|---|
| 68 | `thirdPartyApiOutage` | Third-Party API Outage |
| 69 | `authenticationServiceFailure` | Authentication Service Failure |
| 70 | `serviceDiscoveryFailure` | Service Discovery Failure |
| 71 | `messageQueueBacklogExplosion` | Message Queue Backlog Explosion |
| 72 | `clockSkewAcrossNodes` | Clock Skew Across Nodes |

---

## 3. SIMULATION PARAMETERS

### Component Config Properties (41 Total)
```
algorithm, authProtocol, autoScale, availabilityTarget, cacheTtlSeconds,
capacity, circuitBreaker, consistencyLevel, consistentHashing, dbBehavior,
dbSchema, deliveryMode, displayMode, dlq, evictionPolicy, instances,
llmModel, loadBalancerConfig, maxInstances, maxTokens, minInstances,
networkScope, partitionConfigs, partitionCount, quorumRead, quorumWrite,
rateLimitRps, rateLimiting, regions, replication, replicationFactor,
replicationStrategy, replicationType, retries, shardConfigs, sharding,
shardingStrategy, showSchema, simulatesAs, tokenTtlSeconds,
trafficProcessingLayer
```

### Simulation Status Enum
- idle, running, paused, stopped

### Tick-Based Metrics (36 Tick Counters)
```
cpuThrottleTicks, threadPoolSaturationTicks, eventLoopBlockTicks,
connectionPressureTicks, ephemeralPortPressureTicks, deployInstabilityTicks,
probeFailureTicks, duplicateExecutionTicks, batchPreemptionTicks,
checkpointRiskTicks, shufflePressureTicks, batchDiskPressureTicks,
batchNetworkPressureTicks, dependencyTimeoutTicks, dependencyRateLimitTicks,
credentialFailureTicks, retryPressureTicks, downstreamPoolPressureTicks,
egressBlockTicks, infraPressureTicks, autoscaleLagTicks, controlPlaneLagTicks,
logPressureTicks, cacheStalenessTicks, visibilityRaceTicks, staleResultTicks,
schedulerOverlapTicks, heartbeatStallTicks, gcPressureTicks, jobLagTicks,
jobTimeoutTicks, dlqTicks, batchSkewTicks, errorTicks, dnsFailureTicks
```

### Simulation Snapshot Metrics (21 Fields)
```
elapsed_ms, total_rps, p95_latency_ms, error_rate, availability,
monthly_cost, failure_count, active_chaos_events, traffic_level,
error_budget_remaining, error_budget_burn_rate, total_cost_per_hour,
cost_spent, total_requests, successful_requests, failed_requests,
current_rps, queue_depth, cache_hit_rate, cpu_utilization, throughput
```

### Full Simulation Report Fields (24)
```
id, started_at, ended_at, duration_ms, total_ticks,
final_failure_count, active_chaos_types, final_metrics, timeline,
total_rps, avg_latency_ms, p50_latency_ms, p95_latency_ms, p99_latency_ms,
error_rate, availability, error_budget_remaining, error_budget_burn_rate,
total_cost_per_hour, monthly_cost, cost_spent, total_requests,
successful_requests, failed_requests
```

### SimulatesAs Behavior Profiles (23)
```
db_oltp, db_olap, db_batch, db_streaming_ingest,
cache_hot_path, cache_warmup,
network_traffic_stream, stream_window_analytics,
analytics_interactive, analytics_batch, network_routing_control,
queue_reliable_delivery, batch_processing,
external_transactional, external_bulk_sync,
object_file_io, object_archive_batch,
security_realtime_enforcement, security_forensics,
stream_realtime_ingest, batch_background, batch_compute,
queue_delayed_retry
```

### Queue Theory and Performance Formulas
- M/M/1 queuing model referenced
- Exponential backoff with jitter
- P50/P95/P99 percentile tracking
- Error budget burn rate calculation
- `monthly_cost = total_cost_per_hour * 24 * 30`
- Chaos multipliers system for cascading effects

### RPS / Traffic Configuration
```
targetRps, rateLimitRps, burstLimit, maxConcurrency,
currentRps, lastConnectionTrafficRps, peakRps, total_rps,
ingress RPS, egress RPS, qps
```

### Simulation Speed Options
- `slow`, `normal` / `1x`, `fast`, `paused`

---

## 4. COST MODEL

### Default Cost
- **Default costPerHour:** `0.1` (when not specified in component config)

### Cost Calculation Formula
```
total_cost_per_hour = SUM(component_costs)
monthly_cost = total_cost_per_hour * 24 * 30
cost_spent = accumulated during simulation runtime
```

### Per-Component Cost Breakdown (from `bGs()` function)
The cost function computes per-component cost based on:
- **Base compute cost:** `capacity * instance_count * region_count * costPerHour`
- **Storage cost:** Based on `dataStorageGb` and component type
- **Network/transfer cost:** Based on RPS, `avgRequestKb`, bandwidth
- **Serverless cost:** Lambda pricing model (`invocations/1M * 0.2 + duration * memoryGb * 0.0000166667`)
- **CDN/Object Store/API Gateway/Service Mesh:** Additional data transfer costs per MB
- **Replication cost:** Extra cost for `replicationFactor > 1` (incremental per replica)
- **Autoscale headroom:** Cost for `maxInstances` warm capacity

### Component Metrics Affecting Cost
```
cpu, memory, errors, latency, cacheHitRate, queueDepth, evictionRate,
pool, activeConnections, maxConnections, rps, slownessFactor,
highLoadSeconds, bandwidthMbps, bandwidthFactor, dataStorageGb,
lambdaMemoryGb, maxRPSPerInstance
```

### Cloud Provider References
- AWS Lambda, Cloud Functions, Azure Functions, OpenFaaS
- Kong, Apigee, AWS API Gateway, Zuul
- S3, GCS, HDFS, NFS
- EKS, GKE, Dataproc
- TigerBeetle, AWS QLDB, Datomic

---

## 5. KEYBOARD SHORTCUTS AND ACTIONS

### Key Events Handled
- `Delete` / `Backspace` - Delete selected
- `Tab` - Tab through elements
- `Enter` - Confirm
- `Arrow keys` - Move/navigate
- `Escape` - Exit focus mode, cancel connection

### Canvas Actions (Full List)
```
undo, redo, copy, paste, cut, delete, selectAll, duplicate,
save, export, import, search, group, lock, align, rotate,
zoomIn, zoomOut, settings, help, close, open, new, replace
```

### Command Palette
- CMD-001 through CMD-008 (8 registered commands)

---

## 6. API ENDPOINTS AND BACKEND

### Backend: Supabase
- **URL:** `https://uvbvgyepzrfaqpsqphjl.supabase.co`
- **Auth:** Supabase Auth (`supabase.auth`)
- **Real-time:** Supabase real-time channels for collaboration

### API Endpoints
- `POST /api/broadcast` - Real-time collaboration broadcast

### Authentication
- Google Sign-In via `https://accounts.google.com/gsi/client`
- Flutter plugin: `plugins.flutter.io/google_sign_in`
- Event tracking: `paperdraw_google_signin`
- OAuth flow support

### Database Collections/Tables
- `users` - User accounts
- `designs` - Saved designs
- `templates` - Template blueprints
- `analytics` - Usage analytics
- `components` - Component library
- `feedback` - User feedback

### External URLs
- `https://fonts.gstatic.com/s/` (Google Fonts)
- `https://www.gstatic.com/flutter-canvaskit/` (CanvasKit WASM)
- `https://schema.org` (SEO structured data)
- `https://www.linkedin.com/feed/?shareActive=true&text=` (LinkedIn share)
- `https://twitter.com/intent/tweet?text=` (Twitter/X share)

---

## 7. FEATURE FLAGS AND SUBSCRIPTION MODEL

### Subscription Tiers
- **Free Tier:** 3 simulation runs total
- **Pro Tier:** Unlimited simulations

### Pro Feature Gate Properties
```
isPremium, isPro, isCurrentPlan, featureEnabled,
isCanary, requiresAuth, isEnabled, experiment, beta, canary, featureFlag
```

### Gate Messages (User-Facing)
- "Free users can run up to 3 simulations. Upgrade to Pro to keep simulating."
- "You have N free simulation runs left. Upgrade to Pro for unlimited simulation runs."
- "Upgrade To Continue Simulations"
- "Free Simulation Limit Near"
- "UPGRADE TO PRO"
- "You are on paperdraw.dev PRO"
- "Unlock paperdraw.dev PRO"
- "Sign in to Upgrade"

### Payment System: PayPal (Primary)
```
paypal_checkout_unavailable, paypal_checkout_dialog_opened,
paypal_subscribe_clicked, paypal_checkout_dialog_closed,
paypal_subscription_sync_failed, paypal_manage_clicked,
paypal_manage_opened, paypal_manage_failed,
paypal-sync-subscription
```

### Stripe (Also Referenced)
- "Stripe" string present in codebase (possibly secondary/future payment method)

### Subscription Analytics
```
subscription_id, subscription_status, subscription_tier,
upgrade_button_clicked, upgrade_menu_clicked,
simulation_start_blocked_upgrade, free_simulation_consumed,
free_limit
```

---

## 8. EXPORT FORMATS (12+)

### Supported Export Formats
| Format | MIME Type | Notes |
|---|---|---|
| PNG | `image/png` | Raster image export |
| JPEG | `image/jpeg` | Raster image export |
| GIF | `image/gif` | Including animated GIF |
| SVG | `image/svg+xml` | Vector export |
| PDF | `application/pdf` | Document export |
| JSON | `application/json` | Blueprint/design data |
| Markdown | `text/markdown` | Blog/report output |
| CSV | `text/csv` | Data export |
| YAML | `application/yaml` | Kubernetes YAML export |
| WebM | `video/webm` | Simulation video recording |
| MP4 | `video/mp4` | Simulation video recording |
| XML | `application/xml` | Generic XML |

### Named Export Types
- **blueprintJson** - Full design data export
- **draftJson** / **draft_json** - Work-in-progress save
- **blogMarkdown** / **blog_markdown** - Technical writeup / deep dive
- **kubernetesYaml** - K8s manifest generation
- **excalidraw** - Excalidraw format export
- **animatedGif** - Animated GIF of simulation
- **rawJson** - Raw JSON data
- **uml_blueprint** - UML diagram export (SOS format)
- **Simulation Video** - WebM/MP4 recording of simulation run

### Export Analytics Events
```
export_video_clicked, simulation_video_capture_ready,
simulation_video_exported, manual_export, manual_export_finalize
```

---

## 9. CONNECTION / EDGE TYPES

### Connection Protocols (6)
| # | ID | Display Name |
|---|---|---|
| 0 | `http` | HTTP |
| 1 | `grpc` | gRPC |
| 2 | `websocket` | WebSocket |
| 3 | `tcp` | TCP |
| 4 | `udp` | UDP |
| 5 | `custom` | Custom |

### Edge Direction Types (2)
- `unidirectional` (default)
- `bidirectional`

### Edge Visual Styles (10)
```
solid, dashed, dotted, double,
bold, thin, normal,
error, warning, success
```

### Data Flow Semantics
```
ASYNC, SYNC, FSYNC, PUBLISH, STREAMING, EDGE
request, response, event, command, query, notification,
heartbeat, batch, stream, push, pull, broadcast
```

### Higher-Level Protocol References in UI
```
HTTP, HTTPS, gRPC, WebSocket, TCP, UDP, AMQP, MQTT,
TLS, mTLS, Redis, Kafka
```

---

## 10. INCIDENT / ISSUE TYPE CATALOG (150+)

### Load Balancer Issues
- Health Check Failure / Flapping / Timeout / Misconfiguration
- Idle Timeout / Idle Timeout Exceeded / Idle Timeout Too Short
- Deregistration Drain Timeout
- Sticky Session Skew / Cookie Mismatch
- Slow Start Ramp-Up Issue
- Backend Port Misconfiguration
- Wrong Listener Protocol / Wrong Health Path
- Access Log Write Failure
- Request Timeout / Connection Timeout
- Partial Target Failure
- Throughput Limit Hit
- Header Bloat
- Load Balancer Failure

### Network Issues
- Network Partition / Network Connect Timeout
- Half-Open TCP Connection
- Keep-Alive Stale Connection
- DNS Resolution Failure / Stale DNS IP Pinning / DNS TTL Too Low
- Missing HTTP to HTTPS Redirect
- Geo-Restriction Violation
- Incomplete Certificate Chain / Certificate Expired / CN/SAN Mismatch
- Wrong Listener Protocol
- WebSocket Upgrade Failure
- Slow Loris Attack
- Routing Blackhole
- NAT Gateway Failure

### Application Issues
- Connection Pool Exhaustion
- Thread Pool Exhaustion / Thread Starvation / Thread Pool Saturation
- Memory Leak / Memory Pressure
- CPU Throttle / Hot Path CPU Bottleneck
- GC Pause Spike / GC Pressure
- Cold Start
- Configuration Drift / Config Propagation Delay
- Deploy Instability
- Loop Detected
- Error Budget Burn / Latency Breach
- Timeout Amplification / Timeout Budget Exceeded
- Error Amplification

### Database Issues
- Database Primary Crash / Replica Failure
- Replication Lag / Replica Skew
- Split Brain / Quorum Failure
- Stale Read / Read After Write Failure
- Lock Contention / Lock Wait Timeout
- Disk Almost Full / Disk Failure / Disk Corruption / Disk IO Saturation
- Hot Shard / Partition Hotspot
- Constraint Violation / Schema Migration Issue
- Data Loss / Data Corruption
- Noisy Neighbor Tenant Hijack
- LSM Compaction Debt
- Metadata Lock Trap / Query Plan Regression

### Cache Issues (Redis-Specific, 20+)
- Cache Stampede / Cache Eviction Storm
- Cache Cluster Partition / Cache Sentinel Split / Sentinel Failover
- Cache Persistence Failure / Cache OOM / OOM Eviction Surge
- Cache Memory Fragmentation
- Cache Poisoning / Cache Replica Desync / Cache Replication Lag
- Cache Connection Storm / Timeout / Refused / Reset
- Cache Auth Failure / Auth Misconfiguration
- Cache Script Block / Cross-Slot Error
- Cache Command Error / Wrong Type
- Cache Client Abort / Max Reconnect
- Cache Transaction Abort / Replica Readonly

### Queue / Worker Issues (19 Named Failure Modes with IDs JOB-001 through JOB-018)
- JOB-001: Job Hung / Deadlock
- JOB-002: Poison Message Loop
- JOB-003: Worker Crash / OOMKill Mid-Job
- JOB-004: Queue Lag / Consumer Lag
- JOB-005: Job Timeout Without Cleanup
- JOB-006: Retry Exhaustion / Dead Letter
- JOB-007: Duplicate Execution (Non-Idempotent)
- JOB-008: Cron Overlap / Double Trigger
- JOB-009: Worker Starvation
- JOB-010: Message Visibility Timeout Race
- JOB-011: Scheduler Clock Skew
- JOB-012: Missing Heartbeat / Progress Stall
- JOB-013: Worker Process Zombie
- JOB-014: Priority Inversion in Queue
- JOB-015: Concurrency Limit Misconfiguration
- JOB-016: Job Result Expiry Before Consumption
- JOB-017: Batch Acknowledge Without Processing
- JOB-018: Cold Start Latency on Worker Scale-Out

### Batch Processing Issues (17 Named Failure Modes with IDs BATCH-001 through BATCH-017)
- BATCH-001: Spot / Preemption Kill
- BATCH-002: Pipeline Stage Failure
- BATCH-003: Out-of-Memory on Large Dataset
- BATCH-004: Data Skew / Hot Partition
- BATCH-005: Disk I/O Saturation
- BATCH-006: Checkpoint Write Failure
- BATCH-007: Schema Mismatch on Input
- BATCH-008: Batch Window Overrun
- BATCH-009: Worker Node Heterogeneity
- BATCH-010: Partial Output / Dirty Write
- BATCH-011: Fanout Resource Exhaustion
- BATCH-012: Input Source Unavailable
- BATCH-013: Network Bandwidth Saturation
- BATCH-014: Shuffle / Spill to Disk Overflow
- BATCH-015: Idempotency Broken on Re-run
- BATCH-016: Dependency Job Not Complete
- BATCH-017: Cost Overrun on Long-Running Job

### External Dependency Issues (19 Named Failure Modes with IDs EXT-001 through EXT-019)
- EXT-001: External API Timeout Cascade
- EXT-002: External Rate Limit Hit (429)
- EXT-003: Circuit Breaker Open
- EXT-004: Webhook Delivery Failure
- EXT-005: DNS Resolution Failure (external)
- EXT-006: TLS Certificate Error on Upstream
- EXT-007: Retry Storm on External Failure
- EXT-008: Response Schema Change (Breaking)
- EXT-009: Credentials / API Key Expired
- EXT-010: Idempotency Key Missing
- EXT-011: Connection Pool Starvation (Downstream)
- EXT-012: Webhook Signature Verification Fail
- EXT-013: Response Caching Staleness
- EXT-014: Vendor API Deprecation (Silent 410)
- EXT-015: OAuth Token Race Condition
- EXT-016: Partner SLA Window Missed
- EXT-017: Redirect Loop on External Endpoint
- EXT-018: Proxy / Egress Firewall Block
- EXT-019: Polling Inefficiency (Missed Events)

### Infrastructure / Kubernetes Issues (13 Named Failure Modes with IDs INFRA-001 through INFRA-013)
- INFRA-001: Node NotReady
- INFRA-002: Image Pull Failure
- INFRA-003: Pod Eviction (Resource Pressure)
- INFRA-004: ConfigMap / Secret Not Found
- INFRA-005: Horizontal Autoscaler Lag
- INFRA-006: PVC / Storage Mount Failure
- INFRA-007: Resource Request/Limit Mismatch
- INFRA-008: Missing PodDisruptionBudget
- INFRA-009: etcd Overload / Control Plane Lag
- INFRA-010: Network Policy Blocking Internal Traffic
- INFRA-011: Service Account / IRSA Permission Error
- INFRA-012: DNS Cache Poisoning / CoreDNS Overload
- INFRA-013: Log Volume / Fluentd Backpressure

### Traffic / Cascade / Global Issues
- Traffic Spike Surge / Bot Traffic Flood
- Thundering Herd Event
- Retry Storm / Retry Amplification / Retry Budget Exhausted
- Cascade detection (with cascadeScore and cascadeLabel)
- SPOF (Single Point of Failure) detection
- Autoscale Thrash / Autoscale Lag
- Failover Spillover / Failover Load Shift / Failover overload
- Rate Limit False Positive
- Circuit Breaker Open
- Timeout Amplification / Timeout Budget Exceeded
- Error Amplification / Error Budget Burn
- Backpressure (observability, queue, log)
- Service Degradation

---

## 11. ADDITIONAL FINDINGS

### Database Engines Referenced (22)
```
PostgreSQL, MySQL, MongoDB, Redis, Cassandra, DynamoDB,
CockroachDB, TiDB, ClickHouse, Neo4j, InfluxDB, TimescaleDB,
FoundationDB, Meilisearch, Typesense, Solr, Oracle, SQLite,
Snowflake, BigQuery, Redshift, Firebase
```

### Database Behavior Modes
- `db_oltp` - Online transaction processing
- `db_olap` - Online analytical processing
- `db_batch` - Batch processing workloads
- `db_streaming_ingest` - Real-time streaming ingestion
- `timeSeries`, `graph`, `document`, `search`, `streaming`

### Dart Enum: DbFamily, QueryPattern, ConsistencyNeed
- **DbFamily** - Database family classification
- **QueryPattern** - Query pattern types
- **ConsistencyNeed** - Consistency requirements enum
- **DbEngineFamily** - Engine family grouping
- **DbNodeRole** - Node roles (primary, replica, etc.)
- **DbReadPreference** - Read routing preferences

### Load Balancer Algorithms (4)
- `round_robin` - Round Robin
- `least_conn` - Least Connections
- `ip_hash` - IP Hash
- `consistent-hash` - Consistent Hash

### Cache Eviction Policies
- LRU, CLOCK

### Consistency Levels (3)
- `strong` (Strong) - ordinal 0
- `causal` (Causal) - ordinal 1
- `eventual` (Eventual) - ordinal 2

### Replication Strategies
- Leader-Follower
- Leaderless
- Chain replication
- Async / Sync / FSYNC modes

### Network Scopes
```
internal, external, public, private,
vpc, subnet, mesh, global, regional, zonal
```

### Auth Protocols
- JWT, Session, SSO, Basic, Token, OAuth

### Regions
- `us-east-1`, `us-west-2`, `eu-west-1`

### Import Sources (6)
| Source | File Extension |
|---|---|
| Excalidraw | `.excalidraw` |
| Mermaid | `.mermaid` / `text/vnd.mermaid` |
| Draw.io | `.drawio` |
| C4 Model | C4 format |
| D2 | D2 diagram format |
| Eraser.io | Eraser format |

### Pre-Built Solution Templates (9)
1. `minimal_design.json` - Minimal Design
2. `url_shortener_solution.json` - Global URL Shortener
3. `complex_sample_design.json` - Complex Sample Design
4. `ai_agent_orchestration.json` - AI Agent Orchestration
5. `banking_ledger_system.json` - Banking Ledger System
6. `video_streaming_platform.json` - Video Streaming Platform
7. `ridesharing_system.json` - Ridesharing System
8. `data_analytics_platform.json` - Data Analytics Platform
9. `sos_uml_blueprint.json` - SOS UML Blueprint

### Additional Named Design Archetypes
- E-Commerce / High-Availability E-Commerce
- Social Media / Social Media Feed
- Messaging
- Rate Limiter
- Search Engine
- Log Aggregation Service
- Booking

### AI / LLM Integration
- **LLM Models:** `gpt-4o`, `gpt-4-turbo`, `claude-3-5`, `llama-3`
- **Providers:** Azure OpenAI, Anthropic
- **AI Import:** `aiGenerate` - generates designs from external diagrams
- AI Engineering Rationale report section
- AI response parsing for summary and component mapping

### Focus Mode / Scenarios
- `focus_mode_toggled`, `focus_mode_scenario_panel_toggled`
- `focus_mode_exited_via_escape`
- Split-Brain Scenario (named scenario)
- Show/Hide Scenarios panel
- `_ScenarioKind` enum

### Report Generation
- `# System Design Simulation Report` - main report header
- `## Executive Summary` - summary section
- `## Engineering Recommendations` - actionable recommendations
- `Blog / Deep Dive` / `WRITEUP / BLOG` - long-form output
- `# External Import Report` - import analysis
- `# AI Engineering Rationale` - AI reasoning
- Causal narrative template system
- Impact summary and recommendations per incident
- Severity levels: `critical`, `warning`, `recommendation`
- Generated by "Antigravity System Design Simulator"

### Analytics Events (74+ Tracked)
```
aha_candidate_rejected, aha_meaningful_simulation_reached,
aha_meaningful_simulation_repeat, aha_rate_pct,
blueprint_path, chaos_active, chaos_category, chaos_item,
chaos_label, chaos_type, chaos_used_*,
component_added, component_chaos, component_count, component_removed, component_type,
connection_count, connection_created, connection_guide_dismissed, connection_guide_shown,
design_copied_to_my_designs, design_count, design_id, design_save_failed, design_saved,
design_state_*, design_title,
export_video_clicked, external_import_*,
free_limit, free_simulation_consumed,
import_existing_diagram, load_my_designs_clicked, load_my_designs_login_cancelled,
paypal_checkout_*, paypal_subscribe_clicked, paypal_manage_*,
publish_clicked, publish_design_clicked, publish_design_login_cancelled, publish_flow_opened,
share_clicked, share_link_clicked, share_link_created, share_link_failed,
simulation_paused, simulation_report_*, simulation_reset, simulation_resumed,
simulation_running, simulation_share_reward_dialog_*,
simulation_start_blocked_upgrade, simulation_started, simulation_stopped,
simulation_video_capture_ready, simulation_video_exported,
subscription_id, subscription_status, subscription_tier,
template_id, upgrade_button_clicked, upgrade_menu_clicked,
focus_mode_toggled, focus_mode_scenario_panel_toggled, focus_mode_exited_via_escape,
daily_visit_record_failed, unique_simulators, meaningful_simulation
```

### Serverless Provider Options
- AWS Lambda, Cloud Functions, Azure Functions, OpenFaaS

### API Gateway Provider Options
- Kong, Apigee, AWS API Gateway, Zuul

### Ledger Provider Options
- TigerBeetle, Custom Ledger, AWS QLDB, Datomic

---

## 12. SUMMARY STATISTICS

| Category | Count |
|---|---|
| Component Types | 107 |
| Chaos Types | 73 |
| Chaos Categories | 6 |
| Chaos Drop Targets | 7 |
| Chaos Component Families | 8 |
| Connection Protocols | 6 |
| Simulation Config Properties | 41 |
| Tick-Based Metrics | 36 |
| Export Formats | 12+ |
| Import Sources | 6 |
| Pre-Built Templates | 9 |
| Analytics Events | 74+ |
| DB Engines Referenced | 22 |
| Detectable Issue Types | 150+ (68 with formal IDs: JOB/BATCH/EXT/INFRA) |
| LB Algorithms | 4 |
| Consistency Levels | 3 |
| Simulation Report Fields | 24 |
| LLM Models Supported | 4 |
| Named Design Archetypes | 10+ |
| SimulatesAs Profiles | 23 |
| Edge Visual Styles | 10 |
