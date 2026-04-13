# PaperDraw.dev — Complete System Deep Dive

> Full reverse-engineering analysis — April 11, 2026
> Use this as reference for building similar features in Architex

---

## 1. What is PaperDraw?

A browser-based **system design simulator** where you:
1. Drag-and-drop architecture components (107 types)
2. Connect them with protocol-aware edges (HTTP, gRPC, WebSocket, TCP, UDP)
3. Run **traffic simulations** — see bottlenecks, latency, cost in real-time
4. Inject **chaos events** (73 types) — kill nodes, inject latency, corrupt data
5. Get **auto-generated engineering reports** — incidents, root cause, recommendations

**Not a static diagramming tool.** It's a **simulation engine** with AI-generated topology-aware rules.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Flutter Web** (Dart → JS via dart2js) |
| Rendering | **CanvasKit** (Skia via WASM — GPU-accelerated 2D) |
| Backend | **Supabase** (PostgreSQL + Auth + Real-time) |
| AI Rule Generation | **Gemini 2.5 Flash** (Google) |
| Auth | Google Sign-In via Supabase Auth |
| Payments | PayPal (primary) + Razorpay (India, planned) |
| Analytics | Google Analytics 4 |
| Hosting | Cloudflare (CDN + WAF) |
| PWA | manifest.json, standalone mode |

---

## 3. The Component System (107 Types)

### 3.1 Categories

| Category | Count | Examples |
|----------|-------|---------|
| Infrastructure & Networking | 6 | DNS, CDN, Load Balancer, API Gateway, WAF, Ingress |
| Compute | 3 | App Server, Worker, Serverless |
| Services | 9 | Auth, Notification, Search, Analytics, Scheduler, Service Discovery, Config, Secrets, Feature Flags |
| Observability | 7 | Metrics Collector, Time-Series Store, Log Collector, Log Aggregation, Tracing, Alerting, Health Monitor |
| Network Containers | 11 | LB (L4/L7), Reverse Proxy, API GW (Network), Edge Router, VPC, Subnet, NAT GW, VPN GW, Service Mesh, DNS Server, Discovery Service |
| Network Children | 11 | Routing Rule, WAF Module, Rate Limiter, Health Check, Network Interface, Routing Table, Security Group, Firewall Rule, Sidecar Proxy, Registry DB, Routing Policy |
| AI/LLM | 5 | LLM Gateway, Tool Registry, Memory Fabric, Agent Orchestrator, Safety Mesh |
| Data/Storage | 11 | Client, Cache, Database, Object Store, KV Store, Time Series DB, Graph DB, Vector DB, Search Index, Data Warehouse, Data Lake |
| Messaging | 3 | Message Queue, Pub/Sub, Stream |
| FinTech | 6 | Payment Gateway, Ledger Service, Fraud Detection, HSM, DDoS Shield, SIEM |
| Data Engineering | 6 | ETL Pipeline, CDC Service, Schema Registry, Batch Processor, Feature Store, Media Processor |
| DB Internals | 8 | Sharding, Hashing, Shard Node, Primary Node, Partition Node, Replica Node, Input Source, Output Sink |
| Custom/Sketch | 6 | Custom Service, Sketchy Service/DB/Logic/Queue/Client |
| UML | 8 | Class, Interface, API, State, Enum, Abstract Class, DB Table, Inheritance |
| Shapes | 7 | Text, Circle, Rectangle, Diamond, Arrow, Line, Container |

### 3.2 Component Data Model

Each component on the canvas has:

```typescript
interface CanvasComponent {
  // Identity
  id: string;                        // e.g., "api-gw"
  type: string;                      // e.g., "apiGateway" (from 107 types)
  customName?: string;               // User-defined label
  
  // Layout
  position: { x: number; y: number };
  size: { w: number; h: number };
  parentContainerId?: string;        // If nested inside a container
  
  // Simulation Config (41 properties)
  config: {
    capacity?: number;               // Max RPS this component handles
    instances?: number;              // How many instances running
    autoScale?: boolean;             // Can it scale automatically?
    minInstances?: number;
    maxInstances?: number;
    rateLimiting?: boolean;
    rateLimitRps?: number;
    algorithm?: string;              // LB algorithm: round_robin, least_conn, ip_hash, consistent-hash
    sharding?: boolean;
    shardingStrategy?: string;
    replication?: boolean;
    replicationFactor?: number;
    replicationStrategy?: string;    // leader-follower, leaderless, chain
    consistencyLevel?: string;       // strong, causal, eventual
    evictionPolicy?: string;         // LRU, CLOCK
    cacheTtlSeconds?: number;
    regions?: string[];              // e.g., ["us-east-1", "eu-west-1"]
    circuitBreaker?: boolean;
    retries?: number;
    dlq?: boolean;                   // Dead letter queue
    simulatesAs?: string;            // Behavior profile (23 options)
    // ... 41 total properties
  };
}
```

### 3.3 SimulatesAs Profiles (23 behavior modes)

Same component type can simulate differently based on its role:

```
Database component:
  - db_oltp           → Low latency, high connection count, ACID
  - db_olap           → High throughput, columnar scans, batch reads
  - db_batch          → Bulk writes, checkpoint-heavy
  - db_streaming_ingest → Append-only, time-series pattern

Cache component:
  - cache_hot_path    → Sub-ms reads, high hit rate, eviction pressure
  - cache_warmup      → Cold start, miss-heavy initially

Compute component:
  - batch_processing  → Long-running, checkpoint failures
  - batch_background  → Low priority, preemptible
  - batch_compute     → CPU-intensive, GC pressure
```

---

## 4. The Connection System

### 4.1 Connection Protocols (6)

| Protocol | Type | Use Case |
|----------|------|----------|
| HTTP | Synchronous | REST APIs, webhooks |
| gRPC | Synchronous | Service-to-service, high perf |
| WebSocket | Bidirectional | Real-time, notifications |
| TCP | Synchronous | Database connections, raw sockets |
| UDP | Asynchronous | Metrics, logs, DNS |
| Custom | User-defined | Anything else |

### 4.2 Edge Properties

```typescript
interface Connection {
  id: string;
  sourceId: string;                  // From component
  targetId: string;                  // To component
  type: "request" | "async";        // Sync vs async (V1 schema)
  protocol?: string;                 // HTTP, gRPC, etc. (V2 schema)
  label?: string;                    // User annotation
  direction: "unidirectional" | "bidirectional";
  style: "solid" | "dashed" | "dotted" | "double" | "bold" | "thin" | "normal" | "error" | "warning" | "success";
}
```

### 4.3 Data Flow Semantics

Connections carry semantic meaning:
```
SYNC, ASYNC, FSYNC, PUBLISH, STREAMING, EDGE
request, response, event, command, query, notification,
heartbeat, batch, stream, push, pull, broadcast
```

---

## 5. The Specialization System (The Core Innovation)

### 5.1 How It Works — End to End

```
USER ACTION                          WHAT HAPPENS INTERNALLY
─────────────                        ──────────────────────
1. User drags "App Server"           Component placed on canvas
   onto canvas                       
                                     
2. User connects:                    PaperDraw analyzes topology:
   LB → App Server → DB             - upstream = load_balancer
                                     - downstream = database
                                     - traits = autoscale, is_sync_request_path
                                     
3. Canvas topology changes           Profile signature computed:
                                     "appServer|up:load_balancer|down:database|traits:autoscale,is_sync_request_path"
                                     
4. Query Supabase                    GET /specialization_profile_overlays
                                       ?component_type=eq.appServer
                                       &profile_signature=eq."appServer|up:..."
                                     
5a. Profile EXISTS in DB             → Return cached AI-generated rules
                                     
5b. Profile NOT in DB                → Call Gemini 2.5 Flash to generate rules
                                     → Save to Supabase for future use
                                     → Return fresh rules
                                     
6. Rules loaded into                 Component now has topology-aware:
   simulation engine                 - Issue definitions (what can go wrong)
                                     - Rule intents (how failures propagate)
                                     - Causal narratives (human-readable explanations)
                                     
7. User clicks                       Simulation engine uses these rules to:
   "START SIMULATION"                - Generate realistic failure scenarios
                                     - Propagate cascading failures
                                     - Calculate RPS, latency, cost
                                     - Detect incidents
                                     
8. User clicks                       Report generated using:
   "STOP SIMULATION"                 - Causal narrative templates
                                     - Issue severity scores
                                     - Recommendations from rules
```

### 5.2 Profile Signature Format

```
{componentType}|up:{upstream_types}|down:{downstream_types}|traits:{trait_list}
```

**Component Type:** The base type (appServer, database, cache, etc.)

**Upstream (up:):** What feeds traffic INTO this component
- `none` — Entry point (client-facing)
- `load_balancer` — Behind a load balancer
- `api_gateway` — Behind an API gateway
- `compute` — Behind an app server/worker
- `traffic` — Generic traffic source
- `cache` — Cache layer above

**Downstream (down:):** What this component connects TO
- `none` — Terminal component
- `cache` — Connects to cache
- `database` — Connects to database
- `cache,database` — Connects to both
- `compute` — Connects to compute
- `queue` — Connects to message queue

**Traits:** Behavioral characteristics
- `autoscale` — Can scale instances
- `is_sync_request_path` — On the critical synchronous path
- `read_heavy` — Mostly reads
- `write_heavy` — Mostly writes
- `fanout_high` — High fan-out pattern
- `batch` — Batch processing
- `event_driven` — Event-triggered

### 5.3 Profile Examples

```
Simple web app:
  apiGateway|up:none|down:load_balancer|traits:none
  loadBalancer|up:api_gateway|down:compute|traits:is_sync_request_path
  appServer|up:load_balancer|down:cache,database|traits:autoscale,is_sync_request_path
  cache|up:compute|down:none|traits:read_heavy
  database|up:compute|down:none|traits:write_heavy

Async worker system:
  queue|up:compute|down:none|traits:reliable_delivery
  worker|up:queue|down:database|traits:batch,autoscale

AI agent system:
  llmGateway|up:api_gateway|down:compute|traits:is_sync_request_path
  agentOrchestrator|up:llm_gateway|down:vector_db,tool_registry|traits:autoscale
```

### 5.4 Issue Data Model

Each profile contains **issues** — things that can go wrong for this specific topology:

```typescript
interface Issue {
  code: string;                      // e.g., "APP_SERVER_DB_FAILURE"
  type: string;                      // "dependency_failure", "resource_exhaustion", "performance_bottleneck", etc.
  title: string;                     // "App Server Experiencing Downstream Database Failure"
  cause: string;                     // "The connected database is unavailable or experiencing critical errors..."
  rootReason: string;                // "Downstream dependency outage or severe degradation"
  impactSummary: string;             // "Returns errors to upstream callers, leading to service disruption"
  recommendation: string;            // "Investigate database health. Check logs, resource utilization..."
  issueLevel: "info" | "warning" | "error" | "critical";
  defaultSeverity: number;           // 0.0 to 1.0
  replacementTypes: string[];        // What component types this issue relates to
  defaultEffects: any[];
  fixType: string | null;
  errorCode: string | null;
}
```

### 5.5 Rule Intent Data Model

Each profile also contains **ruleIntents** — how failures propagate through the topology:

```typescript
interface RuleIntent {
  name: string;                      // "Downstream Database Failure Propagates as App Server Errors"
  issueCode: string;                 // Links to an Issue.code
  impactShape: string;               // "error_rate_increase", "latency_increase", "capacity_reduction", etc.
  propagationRole: string;           // "downstream_consumer", "upstream_provider", "self_component_health"
  dependencyScopes: string[];        // ["downstream"], ["upstream"], ["local"]
  
  // THE KEY FEATURE — Human-readable incident narrative template:
  causalNarrativeTemplate: string;   
  // "A failure in the {downstream} database causes {component} to fail, 
  //  propagating errors to {upstream}"
  
  metricThresholdHints: Record<string, string>;
  neighborMetricThresholdHints: Record<string, string>;
  // e.g., { "downstream.latency_p99": "threshold_exceeded" }
  
  chaosHints: any[];
  triggerSignals: any[];
  trafficEffectHints: any[];
  requiredTopology: any[];
  dependencySelectors: Record<string, any>;
  replacementBehavior: any[];
}
```

### 5.6 Impact Shapes

How different failures manifest:

```
error_rate_increase             — More errors
error_rate_increase_amplified   — Fanout multiplies errors
latency_increase                — Slower responses
latency_end_to_end_increase     — Full path slows down
capacity_reduction              — Less throughput
request_failure                 — Requests fail completely
degradation                     — General degradation
resilience_autoscaling          — Autoscaler kicks in (positive)
```

### 5.7 Propagation Roles

How this component participates in failure chains:

```
downstream_consumer       — Affected BY its downstreams
upstream_provider         — Affects its upstreams
self_component_health     — Internal failure
request_path_synchronizer — On sync path, everything blocks
downstream_target_health  — Monitors downstream health
upstream_request_volume   — Affected by upstream traffic
local                     — Local issue only
```

---

## 6. The Simulation Engine

### 6.1 Real-time Metrics

During simulation, each component tracks:

**Per-Component:**
- RPS (current, peak)
- P50, P95, P99 latency (ms)
- CPU utilization (%)
- Memory utilization (%)
- Error rate (%)
- Queue depth
- Cache hit rate
- Active connections
- Bandwidth (Mbps)

**System-wide (top status bar):**
- Total RPS
- P95 latency
- Availability (%)
- Monthly projected cost ($)

### 6.2 Tick-Based Simulation

The engine runs in **ticks**. Each tick updates 35+ pressure counters:

```
cpuThrottleTicks, threadPoolSaturationTicks, eventLoopBlockTicks,
connectionPressureTicks, ephemeralPortPressureTicks, deployInstabilityTicks,
probeFailureTicks, gcPressureTicks, dnsFailureTicks, errorTicks,
batchPreemptionTicks, checkpointRiskTicks, shufflePressureTicks,
jobLagTicks, jobTimeoutTicks, dlqTicks, ...
```

When a counter exceeds its threshold → an **incident** is triggered using the specialization profile rules.

### 6.3 Cost Model

```
Per Component Cost:
  base_compute    = capacity × instances × regions × costPerHour
  storage         = dataStorageGb × storage_rate
  network         = RPS × avgRequestKb × transfer_rate
  serverless      = (invocations / 1M × $0.20) + (duration × memoryGb × $0.0000166667)
  replication     = extra per replicationFactor > 1
  autoscale       = headroom for maxInstances warm capacity

Monthly Cost = sum(all component hourly costs) × 24 × 30
Default costPerHour = $0.10 per component
```

### 6.4 Simulation Speeds
- `slow` — Detailed observation
- `normal` / `1x` — Standard
- `fast` — Quick overview
- `paused` — Frozen, can inspect

### 6.5 Post-Simulation Report

Auto-generated markdown report containing:

```markdown
# System Design Simulation Report
Date: 2026-04-11  Time: 16:55
Scenario: Design Your Systems
Simulation Duration: 334 ticks

## Executive Summary
- Final Availability: 96.9%
- P95 Latency: 50ms
- Total Requests: 39,166
- Success Rate: 96.12%
- Cost Spent: $283.14
- Monthly Projected Cost: $58.1K/mo
- Error Budget Remaining: 0.0%

## Incident History
| Timestamp | Component | Issue | Explanation | Severity | Recommendation |
|-----------|-----------|-------|-------------|----------|----------------|
| 16:53:54  | cache     | SPOF  | Single point of failure detected | 80% | Increase instance count... |
| 16:53:54  | api_gw    | Cascading Failure | Upstream failure propagated | 72% | Review dependencies... |
```

Downloadable as `.md` file.

---

## 7. The Chaos Injection System (73 Types)

### 7.1 Chaos Categories

| Category | Count | Examples |
|----------|-------|---------|
| Infrastructure Failures | 10 | AZ Failure, Instance Crash, Disk Failure, VM CPU Throttling |
| Network Chaos | 19 | Network Partition, Packet Loss, DNS Failure, TLS Expired, Routing Blackhole |
| Application-Level | 10 | Memory Leak, OOM Crash, Thread Pool Exhaustion, Deadlock, GC Pause |
| Data Layer | 13 | DB Primary Crash, Split Brain, Hot Shard, Lock Contention, Replication Lag |
| Cache Chaos | 11 | Cache Poisoning, Eviction Storm, OOM Eviction, Cluster Partition, Sentinel Split |
| Traffic | 5 | Traffic Spike, Retry Storm, Bot Flood, Thundering Herd, Payload Explosion |
| Dependency | 5 | Third-Party Outage, Auth Failure, Service Discovery Failure, Queue Backlog, Clock Skew |

### 7.2 Chaos Properties

```typescript
interface ChaosItem {
  ordinal: number;                  // 0-72
  id: string;                       // e.g., "networkPartition"
  name: string;                     // "Network Partition"
  category: string;                 // "Network Chaos"
  scope: "global" | "region" | "component";
  dropTarget: "canvas" | "compute" | "network" | "database" | "cache" | "queue" | "dependency";
  componentFamily: "service" | "cache" | "database" | "messaging" | "edge" | "externalDependency" | "network" | "generic";
}
```

### 7.3 How Chaos Works

1. User drags chaos item onto a component (or canvas)
2. Chaos event activates with multiplier effects
3. Affected component's tick counters increase rapidly
4. When thresholds breach → incidents detected via specialization rules
5. Cascading effects propagate to connected components via rule intents
6. Causal narrative explains the failure chain in the report

---

## 8. Detectable Issue Types (150+)

### 8.1 Formal Issue IDs

**Queue/Worker (JOB-001 to JOB-018):**
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

**Batch Processing (BATCH-001 to BATCH-017):**
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

**External Dependencies (EXT-001 to EXT-019):**
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

**Infrastructure/Kubernetes (INFRA-001 to INFRA-013):**
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

### 8.2 Simulation-Detected Issue Types
- SPOF (Single Point of Failure)
- Overload
- Cascading Failure
- Dependency Unavailable
- Timeout
- Memory Pressure
- Queue Full
- Rate Limited
- Retry Storm
- Thundering Herd
- Backpressure
- Checkpoint Write Failure

---

## 9. Database Schema (Supabase)

### 9.1 Tables

```
profiles                          — 7,885 users (13 columns)
designs                           — User designs with canvas_data (24 columns)
specialization_profile_overlays   — 741 AI-generated rule profiles (15 columns)
simulation_runs                   — Simulation history (4 columns)
comments                          — Community comments (6 columns)
feedback                          — User feedback (empty)
```

### 9.2 Key Schemas

**profiles:**
```sql
id                      UUID PRIMARY KEY
display_name            TEXT
avatar_url              TEXT
created_at              TIMESTAMPTZ
subscription_tier       TEXT        -- 'free' | 'pro'
subscription_status     TEXT        -- 'inactive' | 'active' | 'cancelled'
subscription_provider   TEXT        -- 'paypal'
paypal_subscription_id  TEXT
razorpay_subscription_id TEXT       -- For India market (not launched yet)
subscription_renewal_at TIMESTAMPTZ
billing_updated_at      TIMESTAMPTZ
ai_credits              INTEGER     -- AI feature usage credits
ai_credits_updated_at   TIMESTAMPTZ
```

**designs:**
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES profiles(id)
title                 TEXT
description           TEXT
canvas_data           JSONB        -- Full design (V2 schema)
is_public             BOOLEAN      -- Published to community
upvotes               INTEGER
status                TEXT         -- 'pending' | 'approved' | 'rejected'
rejection_reason      TEXT
approved_at           TIMESTAMPTZ
blueprint_path        TEXT
thumbnail_url         TEXT
blog_markdown         TEXT         -- AI-generated writeup
origin_kind           TEXT         -- 'manual' | 'template' | 'ai_generated'
origin_template_id    UUID
origin_template_title TEXT
review_source         TEXT         -- Who reviewed
review_score          NUMERIC
review_summary        TEXT
review_issues         JSONB
review_model          TEXT         -- AI model used for review
reviewed_at           TIMESTAMPTZ
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

**specialization_profile_overlays:**
```sql
id                    UUID PRIMARY KEY
component_type        TEXT         -- 'apiGateway', 'database', etc.
profile_signature     TEXT         -- 'appServer|up:lb|down:cache,db|traits:autoscale'
domain                TEXT         -- 'compute', 'load_balancer', 'cache', etc.
mode                  TEXT         -- 'custom_rules'
status                TEXT         -- 'approved'
draft_json            JSONB        -- Full rules: issues[], ruleIntents[], confidence
model_name            TEXT         -- 'gemini-2.5-flash'
prompt_version        TEXT         -- 'specialization_runtime_server_v1'
generated_by_server   BOOLEAN
is_runtime_current    BOOLEAN
created_by            UUID
approved_by           UUID
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

---

## 10. Import/Export System

### 10.1 Import Formats (14)

| Format | Extension | Description |
|--------|-----------|-------------|
| PaperDraw JSON | .json | Native format |
| Excalidraw | .excalidraw, .json | Excalidraw scenes |
| draw.io | .drawio, .xml | diagrams.net |
| Mermaid | .mmd, .mermaid | Mermaid diagrams |
| Terraform | .tf, .hcl | Infrastructure as Code |
| YAML | .yaml, .yml | Kubernetes manifests |
| C4 Model | C4 format | C4 architecture diagrams |
| D2 | D2 format | D2 diagrams |
| Eraser.io | Eraser format | Eraser.io diagrams |
| Images | .png, .jpg, .webp, .gif, .svg | OCR/trace import |

### 10.2 Export Formats (12+)

| Format | Description |
|--------|-------------|
| PNG | Raster image |
| JPEG | Compressed image |
| SVG | Vector image |
| PDF | Document |
| GIF | Animated (simulation) |
| WebM | Video recording |
| MP4 | Video recording |
| JSON | Blueprint data |
| Markdown | Simulation report / blog writeup |
| CSV | Data export |
| YAML | Kubernetes manifest generation |
| Excalidraw | Excalidraw format |

---

## 11. UI Features

### 11.1 Top Navigation
- **AI** (dropdown): AI Design (Pro), AI Review (Pro)
- **Auto Layout**: Auto-arrange components
- **Import External**: 14 format support
- **Templates**: 9 pre-built designs
- **My Designs**: Saved designs
- **Feedback**: Submit feedback
- **Library**: Community designs
- **Publish**: Publish to community
- **Upgrade**: Pro subscription

### 11.2 Canvas Toolbar
- Drawing tools (1-8): Select, Pan, Rectangle, Circle, Ellipse, Triangle, Arrow, Line, Pen, Text
- UML tools: Class, Interface, Abstract, Enum, API, Table, State, Inheritance

### 11.3 Component Right-Click Menu
- Open Settings
- Rename
- Start Connection Here
- Connect Pending Source To This
- Cancel Pending Connection
- Copy
- Paste Here
- Duplicate
- Delete Component

### 11.4 Component Settings Panel (per component)
- Component Code / Name
- **Network Rules**: Scope (Regional/Global)
- **Health Assertions**: Ingress Processing Latency
- **Feature Toggles**: Routing Rules, WAF, Rate Limiting, Health Checks (on/off)
- **Simulation Config**: Capacity, Instances, AutoScale, etc.

### 11.5 Chaos Bar (Bottom)
6 quick-inject buttons during simulation for common chaos events.

### 11.6 Cost Calculator (Top Right)
Always visible: RATE ($/hr), SPENT ($), SIM (time), BUDGET ($/mo), Speed multiplier.

---

## 12. Business Intelligence

### 12.1 User Stats (from profiles table)

| Metric | Value |
|--------|-------|
| Total users | 7,885 |
| Signups Feb 2026 | 221 (launch month) |
| Signups Mar 2026 | 4,543 (HN spike) |
| Signups Apr 2026 (11 days) | 3,121 (accelerating) |
| Pro subscribers | 6 (0.076% conversion) |
| Active subscriptions | 6 |
| Cancelled | 2 |
| Users with AI credits | 67 |
| Total AI credits used | 365 |
| Payment provider | 100% PayPal |

### 12.2 Subscription Model
- **Free**: 3 simulation runs, full canvas
- **Pro**: Unlimited simulations, AI design, AI review
- **Payment**: PayPal (live), Razorpay (India, planned), Stripe (referenced in code)

---

## 13. Data Files Reference

All scraped data is in `research/paperdraw/`:

| File | Size | Contents |
|------|------|---------|
| `supabase-all-overlays.json` | 2.7 MB | 741 profiles, 1,035 issues, 1,034 rules |
| `supabase-profiles.json` | 3.1 MB | 7,885 user profiles |
| `supabase-public-designs.json` | 18 KB | Community designs with canvas_data |
| `supabase-designs-and-tables.json` | 72 KB | Full design data + table discovery |
| `supabase-analysis.md` | 9.2 KB | DB schema + business intelligence |
| `js-analysis.md` | 37 KB | 107 components, 73 chaos, 150+ issues |
| `complete-data.json` | 34 KB | Structured reference (all enums/IDs) |
| `features.md` | 7.7 KB | UI feature walkthrough |
| `README.md` | 11 KB | Overview + JSON schemas |
| `solutions/` (9 files) | 40 KB | Template blueprints |
| `explanations/` (9 files) | 21 KB | Engineering rationale |
| **This file** | ~20 KB | Complete system deep dive |

---

## 14. Key Takeaways for Architex

1. **Topology-aware rules are the killer feature** — Don't use static rules. Generate rules based on component neighbors.

2. **AI-generated specialization** — Use LLM (Gemini/Claude) to generate issue definitions and causal narratives for each topology pattern. Cache aggressively.

3. **Profile signature system** — The `component|up:X|down:Y|traits:Z` format is elegant. Consider adopting or improving it.

4. **Causal narrative templates** — `{downstream}`, `{component}`, `{upstream}` placeholders make incident reports feel human-written.

5. **Simulation metrics depth** — 35 tick counters + 21 snapshot metrics + 24 report fields = deep observability. Don't skimp on metrics.

6. **Chaos injection as drag-and-drop** — 73 chaos types is impressive but the UX of dragging onto components is intuitive.

7. **Cost model** — Simple formula (hourly rate × 24 × 30) but per-component breakdown is valuable.

8. **Free tier strategy** — 3 free sims with 0.076% conversion suggests the paywall needs rethinking. Consider value-based gating instead.

9. **Import from everything** — Supporting Terraform, Excalidraw, draw.io, Mermaid, C4, D2 gives migration paths from all competitors.

10. **Flutter Web + Supabase** — Fast to build but CanvasKit WASM means no DOM accessibility. Consider React + Canvas hybrid instead.
