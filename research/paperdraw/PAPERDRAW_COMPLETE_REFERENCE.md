# PaperDraw.dev — Complete System Reference

> Everything about what PaperDraw has built, how it works, and what data exists.
> Written as a self-contained reference for implementation by another agent/developer.
> Source: Deep reverse-engineering of paperdraw.dev on April 11, 2026.

---

## SECTION A: WHAT IS IT

PaperDraw (internally called "Antigravity System Design Simulator") is a browser-based tool where engineers design distributed system architectures and then **simulate** them under real traffic and failure conditions.

**It is NOT a diagramming tool.** It is a simulation engine with a visual canvas.

What makes it unique:
1. You drag-and-drop components (107 types) and connect them
2. You click "Start Simulation" and it runs **tick-based traffic simulation** with real RPS, latency, cost
3. You can inject **chaos events** (73 types) — kill nodes, partition networks, spike traffic
4. The system **auto-detects 150+ issue types** using AI-generated topology-aware rules
5. It produces a **post-simulation engineering report** with incidents, root cause, and recommendations

**URL:** https://paperdraw.dev
**Launched:** February 2026
**Users:** 7,885 (as of April 11, 2026)
**Paying users:** 6 (Pro subscribers)

---

## SECTION B: TECH STACK

```
Frontend:    Flutter Web (Dart compiled to JS via dart2js)
Renderer:    CanvasKit (Skia via WASM — GPU-accelerated 2D canvas)
Backend:     Supabase (PostgreSQL + Auth + Real-time + Edge Functions)
AI Engine:   Gemini 2.5 Flash (Google) — generates simulation rules
Auth:        Google Sign-In via Supabase Auth
Payments:    PayPal (primary, live), Razorpay (India, planned), Stripe (referenced)
Analytics:   Google Analytics 4 (GA4)
Ads:         Google AdSense
CDN/WAF:     Cloudflare
PWA:         manifest.json, standalone mode, dark theme
```

**Compiled app:** `main.dart.js` — 5.3 MB, 172,326 lines, 8,375 classes
**WASM alt:** `main.dart.wasm` — 4.9 MB (used on supported browsers)

---

## SECTION C: THE COMPONENT SYSTEM

### C.1: 107 Component Types in 15 Categories

Every draggable component has: `ordinal` (0-106), `id` (camelCase), `name` (display), `description`, `category`.

**Infrastructure (0-5):**
| # | ID | Name | Description |
|---|---|---|---|
| 0 | dns | DNS | Traffic routing & domain resolution |
| 1 | cdn | CDN | Cache static content globally |
| 2 | loadBalancer | Load Balancer | Distribute traffic across servers |
| 3 | apiGateway | API Gateway | Auth, rate limiting, routing |
| 4 | waf | WAF | Web application firewall |
| 5 | ingress | Ingress | Edge reverse proxy / ingress |

**Compute (6-8):**
| 6 | appServer | App Server | Business logic processing |
| 7 | worker | Worker | Async background jobs |
| 8 | serverless | Serverless | Event-based compute |

**Services (9-17):**
| 9 | authService | Auth Service | Authentication & authorization |
| 10 | notificationService | Notification Service | Email/SMS/push dispatch |
| 11 | searchService | Search Service | Query and ranking layer |
| 12 | analyticsService | Analytics Service | Event processing & insights |
| 13 | scheduler | Scheduler | Cron/workflow scheduling |
| 14 | serviceDiscovery | Service Discovery | Service registry & lookup |
| 15 | configService | Config Service | Dynamic configuration store |
| 16 | secretsManager | Secrets Manager | Keys & secrets storage |
| 17 | featureFlag | Feature Flags | Runtime feature toggles |

**Observability (18-24):**
| 18 | metricsCollectorAgent | Metrics Collector Agent | Collects and ships service metrics |
| 19 | timeSeriesMetricsStore | Time-Series Metrics Store | Stores metrics for trend analysis |
| 20 | logCollectorAgent | Log Collector Agent | Collects logs from services |
| 21 | logAggregationService | Log Aggregation Service | Indexes and queries centralized logs |
| 22 | distributedTracingCollector | Distributed Tracing Collector | Collects traces and spans |
| 23 | alertingEngine | Alerting Engine | Evaluates rules and routes alerts |
| 24 | healthCheckMonitor | Health Check Monitor | Probes service and dependency health |

**Network Containers (25-35):**
| 25 | networkLoadBalancer | Load Balancer (L4/L7) | Traffic distribution container |
| 26 | reverseProxy | Reverse Proxy | Inbound traffic filtering |
| 27 | networkApiGateway | API Gateway (Network) | API traffic governance |
| 28 | edgeRouter | Edge Router | Ingress/egress traffic routing |
| 29 | vpc | VPC | Private network boundaries |
| 30 | subnet | Subnet | Isolated network segments |
| 31 | natGateway | NAT Gateway | Outbound network translation |
| 32 | vpnGateway | VPN Gateway | Encrypted cross-network tunnels |
| 33 | serviceMesh | Service Mesh | Service-to-service traffic control |
| 34 | dnsServer | DNS Server | Internal DNS resolution |
| 35 | networkDiscoveryService | Discovery Service | Runtime service registration |

**Network Children (36-46):**
| 36 | routingRule | Routing Rule | Routing policy inside containers |
| 37 | wafModule | WAF Module | WAF policy module |
| 38 | networkRateLimiter | Rate Limiter | Traffic rate limiting |
| 39 | healthCheckService | Health Check Service | Upstream target probing |
| 40 | networkInterface | Network Interface | Logical NIC endpoint |
| 41 | routingTable | Routing Table | Route map for routers/VPCs |
| 42 | securityGroup | Security Group | Stateful traffic filter |
| 43 | firewallRule | Firewall Rule | Packet filtering rules |
| 44 | sidecarProxy | Sidecar Proxy | Per-service mesh proxy |
| 45 | registryDatabase | Registry Database | Service registry store |
| 46 | routingPolicy | Routing Policy | Mesh/discovery routing policy |

**AI/LLM (47-51):**
| 47 | llmGateway | LLM Gateway | Route prompts with safety/cost control |
| 48 | toolRegistry | Tool Registry | Discoverable tools/skills catalog |
| 49 | memoryFabric | Memory Fabric | Short/long-term memory layers |
| 50 | agentOrchestrator | Agent Orchestrator | Plan/act loops & agent spawning |
| 51 | safetyMesh | Safety Mesh | Guardrails, red teaming, telemetry |

**Data/Storage (52-62):**
| 52 | client | Users | Client traffic source |
| 53 | cache | Cache | Hot data caching (Redis) |
| 54 | database | Database | Persistent data storage |
| 55 | objectStore | Object Store | Files, images, videos |
| 56 | keyValueStore | KV Store | Key-value storage |
| 57 | timeSeriesDb | Time Series DB | Metrics & time-series data |
| 58 | graphDb | Graph DB | Relationship storage |
| 59 | vectorDb | Vector DB | Embeddings & similarity search |
| 60 | searchIndex | Search Index | Index for fast search |
| 61 | dataWarehouse | Data Warehouse | Analytical storage |
| 62 | dataLake | Data Lake | Raw data storage |

**Messaging (63-65):**
| 63 | queue | Message Queue | Async job processing |
| 64 | pubsub | Pub/Sub | Event fanout & notifications |
| 65 | stream | Stream | Real-time data streaming |

**FinTech & Security (66-71):**
| 66 | paymentGateway | Payment Gateway | Payment processing |
| 67 | ledgerService | Ledger Service | Double-entry accounting |
| 68 | fraudDetectionEngine | Fraud Detection | Real-time fraud scoring |
| 69 | hsm | HSM | Hardware security module |
| 70 | ddosShield | DDoS Shield | DDoS mitigation |
| 71 | siem | SIEM | Security info & event management |

**Data Engineering (72-77):**
| 72 | etlPipeline | ETL Pipeline | Extract-Transform-Load |
| 73 | cdcService | CDC Service | Change data capture (Debezium) |
| 74 | schemaRegistry | Schema Registry | Schema versioning |
| 75 | batchProcessor | Batch Processor | Spark/MapReduce jobs |
| 76 | featureStore | Feature Store | ML feature serving |
| 77 | mediaProcessor | Media Processor | Image/video transcoding |

**DB Internals (78-85):**
| 78 | sharding | Sharding | Partition data across servers |
| 79 | hashing | Hashing | Distribute keys uniformly |
| 80 | shardNode | Shard Node | Database shard unit |
| 81 | primaryNode | Primary Node | Primary writer unit |
| 82 | partitionNode | Partition Node | Table partition unit |
| 83 | replicaNode | Replica Node | Read replica unit |
| 84 | inputNode | Input Source | Data entry point |
| 85 | outputNode | Output Sink | Data exit point |

**Custom/Sketch (86-91):**
| 86 | customService | Service | Your custom microservice |
| 87-91 | sketchyService/DB/Logic/Queue/Client | Sketchy * | Hand-drawn variants |

**UML (92-99):**
| 92-99 | umlClass/Interface/Api/State/Enum/AbstractClass/DbTable/Inheritance | UML * | UML diagram nodes |

**Shapes (100-106):**
| 100-106 | text/circle/rectangle/diamond/arrow/line/container | Shapes | Drawing primitives |

### C.2: Component Config (45 Properties Per Component)

Every component shares this config schema. Different types use different subsets.

```
CAPACITY & SCALING:
  capacity: number         — Max RPS (default varies: API GW=8000, LB=12000, App=1000, Cache=1600)
  instances: number        — Running instances (default: 1)
  autoScale: boolean       — Enable autoscaling (default: false, App Server=true)
  minInstances: number     — Min instances (default: 1)
  maxInstances: number     — Max instances (default: 10)

LOAD BALANCING:
  algorithm: string        — "round_robin" | "least_conn" | "ip_hash" | "consistent-hash"
  loadBalancerConfig: object

CACHING:
  cacheTtlSeconds: number  — TTL (default: 300, Cache component=10)
  evictionPolicy: string   — "LRU" | "CLOCK"

REPLICATION:
  replication: boolean     — Enable replication
  replicationFactor: number — Replicas (default: 1)
  replicationStrategy: string — "leader-follower" | "leaderless" | "chain"
  replicationType: string  — "none" | "sync" | "async"

SHARDING:
  sharding: boolean
  shardingStrategy: string
  shardConfigs: array
  partitionCount: number   — (default: 1)
  partitionConfigs: array
  consistentHashing: boolean

RELIABILITY:
  circuitBreaker: boolean
  retries: boolean
  dlq: boolean             — Dead Letter Queue
  rateLimiting: boolean
  rateLimitRps: number
  availabilityTarget: number — SLA target (default: 0.7)

DATA:
  consistencyLevel: string — "strong" | "causal" | "eventual"
  quorumRead: number
  quorumWrite: number
  dbSchema: string
  dbBehavior: string
  deliveryMode: string     — Message delivery mode

AUTH:
  authProtocol: string     — "JWT" | "Session" | "SSO" | "OAuth"
  tokenTtlSeconds: number

AI/LLM:
  llmModel: string         — "gpt-4o" | "claude-3-5" | "llama-3"
  maxTokens: number

COST:
  costPerHour: number      — Default: 0.1 ($/hour)
  regions: string[]        — Default: ["us-east-1"]

LAYOUT:
  simulatesAs: string      — Behavior profile (23 options, see below)
  bodyText: string         — UML methods text
  isContainer: boolean
  allowedChildTypes: string[]
  displayMode: string      — "collapsed" | "expanded"
  networkScope: string

TRAFFIC PROCESSING LAYER (nested):
  trafficProcessingLayer.processingLatencyMs: number
  trafficProcessingLayer.routingRulesEnabled: boolean
  trafficProcessingLayer.wafEnabled: boolean
  trafficProcessingLayer.rateLimitingEnabled: boolean
  trafficProcessingLayer.healthChecksEnabled: boolean
```

### C.3: SimulatesAs Profiles (23 behavior modes)

Same component type simulates differently based on role:
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

---

## SECTION D: THE CONNECTION SYSTEM

### D.1: Connection Schema
```
id: string               — "c1", "c2", etc.
sourceId: string          — From component
targetId: string          — To component
type: "request"|"async"   — Synchronous or asynchronous
direction: "unidirectional"|"bidirectional"
protocol: "http"|"grpc"|"websocket"|"tcp"|"udp"|"custom"
trafficFlow: number       — Current traffic volume (0 when not simulating)
label: string|null        — User annotation
isActive: boolean
```

### D.2: Edge Visual Styles (10)
```
solid, dashed, dotted, double, bold, thin, normal, error, warning, success
```

### D.3: Data Flow Semantics (18)
```
ASYNC, SYNC, FSYNC, PUBLISH, STREAMING, EDGE,
request, response, event, command, query, notification,
heartbeat, batch, stream, push, pull, broadcast
```

---

## SECTION E: THE SPECIALIZATION SYSTEM (Core Innovation)

This is the most important part. PaperDraw doesn't use static rules — it uses **AI-generated topology-aware rules** that change based on how components are connected.

### E.1: How It Works

```
Step 1: User places components on canvas and connects them.

Step 2: For each component, PaperDraw computes a PROFILE SIGNATURE:
        "{type}|up:{upstream_types}|down:{downstream_types}|traits:{traits}"
        
        Example: "appServer|up:load_balancer|down:cache,database|traits:autoscale,is_sync_request_path"

Step 3: PaperDraw queries Supabase for matching rules:
        GET /specialization_profile_overlays
          ?component_type=eq.appServer
          &profile_signature=eq."appServer|up:load_balancer|down:cache,database|..."
          &status=eq.approved
          &is_runtime_current=eq.true

Step 4: If rules exist → use them (cached).
        If rules DON'T exist → Gemini 2.5 Flash generates new rules → saved to Supabase.

Step 5: Rules are loaded into the simulation engine.
        Each component now has topology-specific:
          - Issues (what can go wrong)
          - Rule Intents (how failures propagate)
          - Causal Narratives (human-readable incident descriptions)
```

### E.2: Profile Signature Format

```
{componentType}|up:{upstream}|down:{downstream}|traits:{traits}

upstream values:   none, load_balancer, api_gateway, compute, traffic, cache
downstream values: none, cache, database, cache,database, compute, queue
traits:            autoscale, is_sync_request_path, read_heavy, write_heavy,
                   fanout_high, batch, event_driven
```

### E.3: Two-Tier Rule System

**TIER 1: `specialization_drafts` table (78 records)**
- One record per component TYPE (regardless of topology)
- Contains BASE catalog of all possible issues for that type
- Example: loadBalancer has 100 generic issues
- Mode: "catalog_only" or "inherit_only" or "custom_rules"

**TIER 2: `specialization_profile_overlays` table (741 records)**
- Multiple records per type (varies by topology position)
- Contains TOPOLOGY-SPECIFIC propagation rules
- Example: loadBalancer behind api_gateway with compute downstream has 3 specific rules
- Mode: "custom_rules"
- Generated by: Gemini 2.5 Flash

**How they combine:**
1. Load Tier 1 → base issue catalog for the component type
2. Load Tier 2 → topology-specific propagation rules
3. Simulation uses BOTH: Tier 1 for "what can happen" + Tier 2 for "how it propagates"

### E.4: Issue Data Model

Each rule contains issues:
```
code: string              — "APP_SERVER_DB_FAILURE" or "JOB-003"
type: string              — "dependency_failure", "resource_exhaustion", "performance_bottleneck", etc.
title: string             — "App Server Experiencing Downstream Database Failure"
cause: string             — "The connected database is unavailable or experiencing critical errors..."
rootReason: string        — "Downstream dependency outage or severe degradation"
impactSummary: string     — "Returns errors to upstream callers, leading to service disruption"
recommendation: string    — "Investigate database health. Check logs, resource utilization..."
issueLevel: string        — "info" | "warning" | "error" | "critical"
defaultSeverity: number   — 0.0 to 1.0
replacementTypes: string[] — What component types this relates to
```

### E.5: Rule Intent Data Model

Each rule also contains propagation intents:
```
name: string              — "Downstream Database Failure Propagates as App Server Errors"
issueCode: string         — Links to an Issue.code
impactShape: string       — "error_rate_increase", "latency_increase", "capacity_reduction", etc.
propagationRole: string   — "downstream_consumer", "upstream_provider", "self_component_health"
dependencyScopes: string[] — ["downstream"], ["upstream"], ["local"]
causalNarrativeTemplate: string
  — "A failure in the {downstream} database causes {component} to fail,
     propagating errors to {upstream}"
metricThresholdHints: object
neighborMetricThresholdHints: object
```

### E.6: Stats
- 741 topology profiles
- 1,035 issue definitions across all profiles
- 1,034 rule intents with causal narrative templates
- 66 component types have specialization profiles
- Profiles per type: appServer=120, apiGateway=80, loadBalancer=70, database=60, cache=39

---

## SECTION F: THE SIMULATION ENGINE

### F.1: Tick-Based Loop

The simulation runs in discrete ticks. Each tick:
1. Generate traffic based on `trafficLevel` setting
2. Route traffic through the topology graph
3. For each component: check load vs capacity, update 35 pressure counters
4. If any counter exceeds threshold → trigger issue from specialization rules
5. Propagate failures to connected components via rule intents
6. Update system-wide metrics snapshot
7. Accumulate cost

### F.2: 35 Tick Pressure Counters

Each component maintains these counters that increment under stress:
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

The tick engine also uses topology-aware conditionals:
```
hasExternalDownstream, hasLoadBalancerUpstream, hasQueueDownstream, hasQueueUpstream
```

### F.3: System-Wide Metrics (21 per snapshot)
```
elapsed_ms, total_rps, p95_latency_ms, error_rate, availability,
monthly_cost, failure_count, active_chaos_events, traffic_level,
error_budget_remaining, error_budget_burn_rate, total_cost_per_hour,
cost_spent, total_requests, successful_requests, failed_requests,
current_rps, queue_depth, cache_hit_rate, cpu_utilization, throughput
```

### F.4: Cost Model
```
Per component per tick:
  hourly_cost = costPerHour × instances × regions.length
  if sharding: × partitionCount
  if replication: × replicationFactor
  if autoScale && overloaded: × ceil(load / capacity)

System total:
  total_cost_per_hour = sum(all component hourly costs)
  monthly_cost = total_cost_per_hour × 24 × 30
  cost_spent = elapsed_hours × total_cost_per_hour

Default costPerHour: $0.10 per component
```

### F.5: Capacity & Overload Logic
```
effective_capacity = capacity × instances
utilization = current_rps / effective_capacity

If autoScale AND utilization > 70%: scale up (with cooldown)
If autoScale AND utilization < 30%: scale down
If utilization > 100%: OVERLOAD → requests fail, latency spikes, cascades
```

### F.6: Cascade Detection

When component fails:
```
CascadeEvent = {
  cascadeScore: number           — Severity (0-1)
  cascadeLabel: string           — Human label
  mechanism: string              — How it propagated
  seedType: string               — What started it
  isSeedSource: boolean          — Is this the origin?
  isFailoverTarget: boolean      — Receiving failover traffic?
  errorAmplification: number     — Error multiplication factor
  latencyAmplification: number   — Latency increase factor
  trafficAmplification: number   — Traffic shift factor
  dropAmplification: number      — Request drop factor
  capacityDegradation: number    — Capacity loss factor
  relatedComponentIds: string[]  — Components in the chain
}
```

### F.7: Simulation Speeds
```
slow, normal (1x), fast, paused
```

### F.8: Post-Simulation Report (24 fields)
Auto-generated markdown with:
- Executive Summary: availability, P95 latency, total requests, success rate, cost
- Incident History table: timestamp, component, issue code, explanation, severity, recommendation
- Each incident uses `causalNarrativeTemplate` with `{downstream}`, `{component}`, `{upstream}` placeholders
- Downloadable as `.md` file

---

## SECTION G: CHAOS INJECTION SYSTEM

### G.1: 73 Chaos Types in 7 Categories

**Infrastructure Failures (0-9):**
Availability Zone Failure, Data Center Outage, Instance Crash, Instance Slow Degradation, Disk Failure, Disk Corruption, Storage IOPS Throttling, File System Read-Only Mode, VM CPU Throttling, Host Hardware Failure

**Network Chaos (10-28):**
Network Partition, Cross-Region Link Failure, Packet Loss Injection, High Network Latency Injection, Bandwidth Throttling, Connection Flapping, Load Balancer Failure, Backend Port Misconfiguration, Health Check Misconfiguration, Health Check Flapping, TLS Certificate Expired, TLS Protocol Mismatch, Header Bloat, Sticky Session Skew, Slow Start Regression, Idle Timeout Mismatch, DNS Resolution Failure, Routing Blackhole, NAT Gateway Failure

**Application-Level (29-38):**
Memory Leak, Out-of-Memory Crash, Thread Pool Exhaustion, Deadlock Simulation, GC Pause Spike, Configuration Drift, Deployment Misconfiguration, Feature Flag Misrouting, Dependency Timeout Increase, Logging System Overload

**Data Layer (39-51):**
Database Primary Crash, Replica Failure, Replication Lag Spike, Split-Brain Scenario, Data Corruption Injection, Hot Shard/Partition Hotspot, Connection Pool Exhaustion, Lock Contention Spike, Query Plan Roulette, Replica Staleness Window, LSM Compaction Debt Storm, Metadata Lock Trap, Noisy Neighbor Tenant Hijack

**Cache Chaos (52-62):**
Cache Poisoning, Cache Eviction Storm, Cache Connection Storm, Cache Auth Misconfiguration, Cache OOM Eviction Surge, Cache Memory Fragmentation, Cache Persistence Failure, Cache Replica Desync, Cache Cluster Partition, Cache Script Block, Cache Sentinel Split

**Traffic (63-67):**
Traffic Spike Surge, Retry Storm, Bot Traffic Flood, Thundering Herd Event, Payload Size Explosion

**Dependency (68-72):**
Third-Party API Outage, Authentication Service Failure, Service Discovery Failure, Message Queue Backlog Explosion, Clock Skew Across Nodes

### G.2: Chaos Properties
```
scope: "global" | "region" | "component"
dropTarget: "canvas"|"compute"|"network"|"database"|"cache"|"queue"|"dependency"
componentFamily: "service"|"cache"|"database"|"messaging"|"edge"|"externalDependency"|"network"|"generic"
```

### G.3: Chaos Mechanics
User drags chaos item → drops on component → chaos multiplies tick counters → thresholds breach → incidents detected → cascading via rule intents.

---

## SECTION H: DETECTABLE ISSUE TYPES (150+)

### Formal Issue IDs:

**JOB-001 to JOB-018 (Queue/Worker):**
Job Hung/Deadlock, Poison Message Loop, Worker Crash/OOMKill, Queue Lag, Job Timeout Without Cleanup, Retry Exhaustion/Dead Letter, Duplicate Execution, Cron Overlap, Worker Starvation, Message Visibility Timeout Race, Scheduler Clock Skew, Missing Heartbeat, Worker Process Zombie, Priority Inversion, Concurrency Limit Misconfiguration, Job Result Expiry, Batch Acknowledge Without Processing, Cold Start Latency

**BATCH-001 to BATCH-017 (Batch Processing):**
Spot/Preemption Kill, Pipeline Stage Failure, OOM on Large Dataset, Data Skew/Hot Partition, Disk I/O Saturation, Checkpoint Write Failure, Schema Mismatch, Batch Window Overrun, Worker Node Heterogeneity, Partial Output/Dirty Write, Fanout Resource Exhaustion, Input Source Unavailable, Network Bandwidth Saturation, Shuffle/Spill Overflow, Idempotency Broken, Dependency Job Not Complete, Cost Overrun

**EXT-001 to EXT-019 (External Dependencies):**
API Timeout Cascade, Rate Limit Hit (429), Circuit Breaker Open, Webhook Delivery Failure, DNS Resolution Failure, TLS Certificate Error, Retry Storm on External Failure, Response Schema Change, Credentials Expired, Idempotency Key Missing, Connection Pool Starvation, Webhook Signature Fail, Response Caching Staleness, Vendor API Deprecation (410), OAuth Token Race, Partner SLA Missed, Redirect Loop, Egress Firewall Block, Polling Inefficiency

**INFRA-001 to INFRA-013 (Kubernetes):**
Node NotReady, Image Pull Failure, Pod Eviction, ConfigMap/Secret Not Found, HPA Lag, PVC/Storage Mount Failure, Resource Request/Limit Mismatch, Missing PodDisruptionBudget, etcd Overload, Network Policy Blocking, IRSA Permission Error, CoreDNS Overload, Log Volume Backpressure

**Simulation-Detected (12):**
SPOF, Overload, Cascading Failure, Dependency Unavailable, Timeout, Memory Pressure, Queue Full, Rate Limited, Retry Storm, Thundering Herd, Backpressure, Checkpoint Write Failure

---

## SECTION I: DATABASE SCHEMA (Supabase)

**URL:** `https://uvbvgyepzrfaqpsqphjl.supabase.co`

### I.1: Tables

| Table | Rows | Purpose |
|-------|------|---------|
| profiles | 7,885 | User accounts with subscription data |
| designs | 2* | Saved designs with full canvas_data |
| specialization_profile_overlays | 741 | AI-generated topology rules (MAIN DATA) |
| specialization_drafts | 78 | Base catalog rules per component type |
| simulation_runs | 3* | Simulation execution history |
| comments | 1 | Community design comments |
| user_subscriptions | 0 | Subscription history (empty) |
| feedback | 0 | User feedback (empty) |

*Per-user (RLS). Community has more.

### I.2: Key Table Schemas

**profiles (13 columns):**
id, display_name, avatar_url, created_at, subscription_tier (free/pro), subscription_status (inactive/active/cancelled), subscription_provider (paypal), paypal_subscription_id, razorpay_subscription_id, subscription_renewal_at, billing_updated_at, ai_credits, ai_credits_updated_at

**designs (24 columns):**
id, user_id, title, description, canvas_data (JSONB — full design), is_public, upvotes, status (pending/approved/rejected), rejection_reason, approved_at, blueprint_path, thumbnail_url, blog_markdown, origin_kind (manual/template/ai_generated), origin_template_id, origin_template_title, review_source, review_score, review_summary, review_issues, review_model, reviewed_at, created_at, updated_at

**specialization_profile_overlays (15 columns):**
id, component_type, profile_signature, domain, mode, status, draft_json (JSONB — issues + ruleIntents), model_name (gemini-2.5-flash), prompt_version (specialization_runtime_server_v1), generated_by_server, is_runtime_current, created_by, approved_by, created_at, updated_at

### I.3: RPC Functions
- `record_daily_visit` — Tracks daily active users

### I.4: Edge Functions
- `public-sitemap` — Dynamic sitemap for community designs

---

## SECTION J: UI FEATURES

### J.1: Top Navigation
AI (dropdown: AI Design + AI Review — Pro only), Auto Layout, Import External, Templates, My Designs, Feedback, Library, More (Import, Export Video, Share, Save, Account), Publish, Upgrade

### J.2: Canvas Toolbar
Drawing: Select(1), Pan(R), Rectangle(C), Circle(3), Ellipse(4), Triangle(5), Arrow(6), Line(7), Pen, Text(T), Wand(8)
UML: Class, Interface, Abstract, Enum, API, Table, State, Inheritance

### J.3: Component Right-Click Menu
Open Settings, Rename, Start Connection Here, Connect Pending Source, Cancel Pending Connection, Copy, Paste Here, Duplicate, Delete Component

### J.4: Settings Panel (varies by type)
All: Name, Code. Network: Scope, Latency, Routing/WAF/RateLimit/HealthCheck toggles. Compute: Instances, AutoScale. DB: Consistency, Replication, Sharding. Cache: TTL, Eviction. Queue: Delivery Mode, DLQ. LLM: Model, MaxTokens.

### J.5: Simulation UI
Top bar: RPS, Latency, Utilization%, Cost. Bottom: Speed slider, Traffic slider, Time scrubber, Chaos quick-inject bar. Report on stop.

### J.6: Cost Calculator (always visible)
RATE $/hr, SPENT $, SIM time, BUDGET $/mo, Speed multiplier

---

## SECTION K: IMPORT/EXPORT

### Import (14 formats):
JSON, Excalidraw (.excalidraw), draw.io (.drawio/.xml), Mermaid (.mmd/.mermaid), Terraform (.tf/.hcl), YAML (.yaml/.yml), C4 Model, D2, Eraser.io, PNG, JPG, WebP, GIF, SVG

### Export (12+ formats):
PNG, JPEG, SVG, PDF, GIF (animated), WebM (video), MP4 (video), JSON (blueprint), Markdown (report/blog), CSV, YAML (Kubernetes), Excalidraw

### Named Export Types:
blueprintJson, draftJson, blogMarkdown, kubernetesYaml, excalidraw, animatedGif, uml_blueprint, Simulation Video

---

## SECTION L: BUSINESS MODEL

### L.1: Subscription
- **Free:** 3 simulation runs, full canvas, all components, templates
- **Pro:** Unlimited simulations, AI Design generation, AI Review

### L.2: Business Stats (April 11, 2026)
- Total users: 7,885
- Pro subscribers: 6 (0.076% conversion)
- Signups: Feb=221, Mar=4,543 (HN spike), Apr(11 days)=3,121
- Payment: 100% PayPal, 0% Razorpay
- AI credits used: 365 by 67 users
- Cancelled subscriptions: 2

### L.3: Gate Messages
- "Free users can run up to 3 simulations. Upgrade to Pro to keep simulating."
- "You have N free simulation runs left."
- "AI design generation Is Pro"

---

## SECTION M: TEMPLATE SOLUTIONS (9)

Pre-built designs bundled with the app:

1. **Minimal Canvas** — API GW → LB → App Server → Cache + DB (5 components)
2. **URL Shortener** — DNS → CDN → LB → API GW → Shortener/Redirect + Redis + NoSQL + Analytics (14 components)
3. **Ridesharing** — Riders/Drivers → API GW → Matching Engine + Dynamic Pricing + Redis Geospatial + Notifications (12 components)
4. **AI Agent Orchestration** — LLM Gateway → Agent Orchestrator → Safety Mesh + Vector DB + Graph DB + Tool Registry + Memory Fabric (10 components)
5. **Banking Ledger** — DDoS → WAF → API GW → Transaction Svc → Fraud Detection + Payment GW + HSM + Immutable Ledger (13 components)
6. **Video Streaming** — Upload API → Transcoding Queue → Video Transcoder + CDN + S3 + Metadata DB (13 components)
7. **Data Analytics** — Kafka Stream → ETL Pipeline + Spark Batch → Data Lake + Data Warehouse + Schema Registry (11 components)
8. **Social Media Feed** — DNS → CDN → LB → WAF → API GW → Feed/Post/Media Svc + Redis + Cassandra + S3 + Pub/Sub + Fan-out Workers (21 components)
9. **Emergency SOS (UML)** — UserApp → SOSGateway → SOSOrchestrator → PostgreSQL + LocationService + NotificationService + LawEnforcementAPI + SafetyDashboard (8 components)

Each solution has a corresponding explanation markdown with engineering rationale, trade-offs, and component-specific reasoning.

---

## SECTION N: ALL DATA FILES

Everything scraped is in `research/paperdraw/`:

| File | Size | What |
|------|------|------|
| **PAPERDRAW_COMPLETE_REFERENCE.md** | ~40 KB | THIS FILE — complete system reference |
| **PAPERDRAW_SYSTEM_DEEP_DIVE.md** | 30 KB | Earlier system overview |
| **COMPONENT_SETTINGS_LOGIC.md** | 18 KB | Code-level config/logic |
| **CODE_REVERSE_ENGINEERING.md** | 14 KB | Decompiled code blocks |
| **supabase-all-overlays.json** | 2.7 MB | 741 AI-generated topology rules |
| **supabase-profiles.json** | 3.1 MB | 7,885 user profiles |
| **supabase-specialization-drafts.json** | 857 KB | 78 base catalog rules |
| **supabase-designs-and-tables.json** | 72 KB | Full design canvas data |
| **supabase-public-designs.json** | 18 KB | Community published designs |
| **supabase-analysis.md** | 9.2 KB | DB schema + business intelligence |
| **js-analysis.md** | 37 KB | JS bundle extraction (962 lines) |
| **complete-data.json** | 34 KB | Structured reference (all enums/IDs) |
| **features.md** | 7.7 KB | UI feature walkthrough |
| **component-configs-from-localstorage.json** | 10 KB | Full config with defaults |
| **browser-deep-dive.json** | 127 KB | localStorage, cookies, domains |
| **README.md** | 11 KB | Overview + JSON schemas |
| **source-code/** | 12 MB | All downloaded source files + extracted structure |
| **solutions/** (9 files) | 40 KB | Template blueprint JSONs |
| **explanations/** (9 files) | 21 KB | Engineering rationale MDs |

**Total research: ~20 MB across 30+ files**
