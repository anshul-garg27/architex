# PaperDraw — Component Settings & Logic Deep Dive

> How every component's config works at code level

---

## 1. Canvas State Model

Every design is stored with this structure:

```typescript
interface CanvasState {
  components: Component[];        // All placed components
  connections: Connection[];      // All edges between components
  panOffset: { x: number; y: number };  // Camera position
  scale: number;                  // Zoom level
  activeProblemId: string;        // Which problem template is loaded
  origin: string;                 // Where this design came from
  isCyberpunkMode: boolean;       // Visual theme toggle
  trafficLevel: number;           // Simulation traffic intensity
  showErrors: boolean;            // Show/hide error indicators
}
```

**Stored in:** `localStorage` key `flutter.design_state_legacy_{problemId}`
**Autosaved:** Yes, tracked via `flutter.designs_manifest`

---

## 2. Component Config Schema (45 Properties)

EVERY component type shares this same config schema. Different types use different subsets:

```typescript
interface ComponentConfig {
  // ── Capacity & Scaling ──
  capacity: number;               // Max RPS this component can handle
  instances: number;              // Current running instances
  autoScale: boolean;             // Enable autoscaling
  minInstances: number;           // Minimum instances (default: 1)
  maxInstances: number;           // Maximum instances (default: 10)
  
  // ── Load Balancing ──
  algorithm: string | null;       // "round_robin" | "least_conn" | "ip_hash" | "consistent-hash"
  loadBalancerConfig: object | null;
  
  // ── Caching ──
  cacheTtlSeconds: number;        // Cache TTL (default: 300, cache: 10)
  evictionPolicy: string | null;  // "LRU" | "CLOCK"
  
  // ── Replication ──
  replication: boolean;           // Enable replication
  replicationFactor: number;      // How many replicas (default: 1)
  replicationStrategy: string | null;  // "leader-follower" | "leaderless" | "chain"
  replicationType: string;        // "none" | "sync" | "async"
  
  // ── Sharding ──
  sharding: boolean;              // Enable sharding
  shardingStrategy: string | null;
  shardConfigs: any[];            // Per-shard configurations
  partitionCount: number;         // Number of partitions (default: 1)
  partitionConfigs: any[];
  consistentHashing: boolean;     // Use consistent hashing
  
  // ── Reliability ──
  circuitBreaker: boolean;        // Enable circuit breaker
  retries: boolean;               // Enable retries
  dlq: boolean;                   // Dead Letter Queue
  rateLimiting: boolean;          // Enable rate limiting
  rateLimitRps: number | null;    // Rate limit threshold
  availabilityTarget: number;     // SLA target (default: 0.7 = 70%)
  
  // ── Data ──
  consistencyLevel: string | null;   // "strong" | "causal" | "eventual"
  quorumRead: number | null;         // Read quorum
  quorumWrite: number | null;        // Write quorum
  dbSchema: string | null;           // Database schema definition
  showSchema: boolean;               // Show schema in UI
  dbBehavior: string | null;         // DB simulation behavior
  deliveryMode: string | null;       // Message delivery mode
  
  // ── Auth ──
  authProtocol: string | null;       // "JWT" | "Session" | "SSO" | "OAuth"
  tokenTtlSeconds: number | null;
  
  // ── AI/LLM ──
  llmModel: string | null;           // "gpt-4o" | "claude-3-5" | "llama-3"
  maxTokens: number | null;
  
  // ── Cost ──
  costPerHour: number;               // Default: 0.1 ($/hour)
  regions: string[];                 // ["us-east-1"] default
  
  // ── Layout ──
  simulatesAs: string | null;        // Behavior profile (23 options)
  bodyText: string | null;           // UML body text (methods)
  isContainer: boolean;              // Can contain child components
  allowedChildTypes: string[];       // Which types can be children
  displayMode: string;               // "collapsed" | "expanded"
  networkScope: string | null;       // "internal" | "external" | "vpc" etc.
  
  // ── Traffic Processing Layer (nested) ──
  trafficProcessingLayer: {
    processingLatencyMs: number;     // Added latency (default: 0)
    routingRulesEnabled: boolean;    // Routing rules active
    wafEnabled: boolean;             // WAF filtering active
    rateLimitingEnabled: boolean;    // Rate limiting active
    healthChecksEnabled: boolean;    // Health probing active
  };
}
```

---

## 3. Per-Component Default Values

Different component types get different default values when placed:

### Traffic & Edge
```
apiGateway:    capacity=8000,  instances=1, autoScale=false, algorithm=null
loadBalancer:  capacity=12000, instances=1, autoScale=false, algorithm="round_robin"
cdn:           capacity=500000, regions=["us-east-1","eu-west-1"]
dns:           capacity=1000000
waf:           rateLimiting=true
ingress:       capacity=8000
```

### Compute
```
appServer:     capacity=1000, instances=1, autoScale=true, maxInstances=2
worker:        capacity=500,  instances=1, autoScale=true
serverless:    capacity=5000, autoScale=true
```

### Storage
```
cache:         capacity=1600, cacheTtlSeconds=10, evictionPolicy="LRU"
database:      capacity=1600, consistencyLevel="strong", replication=false
objectStore:   capacity=10000, regions=["us-east-1"]
```

### Messaging
```
queue:         capacity=5000, deliveryMode="at_least_once", dlq=true
pubsub:        capacity=10000
stream:        capacity=50000
```

---

## 4. Connection Schema

```typescript
interface Connection {
  id: string;                    // "c1", "c2", etc.
  sourceId: string;              // Component ID
  targetId: string;              // Component ID
  type: "request" | "async";    // Sync or async
  direction: "unidirectional" | "bidirectional";
  protocol: "http" | "grpc" | "websocket" | "tcp" | "udp" | "custom";
  trafficFlow: number;          // Current traffic volume (0 when not simulating)
  label: string | null;         // User annotation
  isActive: boolean;            // Is this connection active
}
```

---

## 5. Settings Panel Logic (What User Sees)

When user clicks a component → "Open Settings", the panel shows different fields based on component type:

### All Components Show:
- **Component Name** (editable)
- **Component Code** (auto-generated ID)

### Network Components (apiGateway, loadBalancer, waf, ingress, cdn, dns) Show:
- **Network Rules section:**
  - Scope: Regional / Global dropdown
- **Health Assertions:**
  - Ingress Processing Latency: slider (0-100ms)
- **Feature Toggles:**
  - Routing Rules: on/off
  - WAF: on/off
  - Rate Limiting: on/off
  - Health Checks: on/off
- These map to `config.trafficProcessingLayer`

### Compute Components (appServer, worker, serverless) Show:
- **Instances**: number input
- **AutoScale**: toggle
- **Min/Max Instances**: number inputs when autoScale=true
- **Capacity (RPS)**: number input

### Database Components Show:
- **Capacity**: number input
- **Consistency Level**: strong/causal/eventual dropdown
- **Replication**: toggle
  - Replication Factor: number (when enabled)
  - Replication Strategy: dropdown
- **Sharding**: toggle
  - Partition Count: number (when enabled)
  - Sharding Strategy: dropdown

### Cache Components Show:
- **Capacity**: number input
- **TTL (seconds)**: number input
- **Eviction Policy**: LRU/CLOCK dropdown

### Queue/Stream Components Show:
- **Capacity**: number input
- **Delivery Mode**: at_least_once / at_most_once / exactly_once
- **DLQ (Dead Letter Queue)**: toggle

### LLM Components Show:
- **LLM Model**: gpt-4o / claude-3-5 / llama-3 dropdown
- **Max Tokens**: number input

### UML Components Show:
- **Body Text**: multi-line text editor for methods
  e.g., "+triggerSOS()\n+cancelSOS()\n+shareLiveLocation()"

---

## 6. Simulation Logic Flow

```
1. CANVAS STATE
   Components[] + Connections[]
          │
          ▼
2. TOPOLOGY ANALYSIS
   For each component, compute:
   - upstream = what connects TO it
   - downstream = what it connects TO
   - traits = autoscale? sync_path? read_heavy? write_heavy?
          │
          ▼
3. PROFILE SIGNATURE
   "appServer|up:load_balancer|down:cache,database|traits:autoscale,is_sync_request_path"
          │
          ▼
4. FETCH RULES (two-tier)
   ┌─────────────────────────┐
   │ Level 1: drafts (78)    │  Base catalog rules for component TYPE
   │ "What can go wrong with │  → e.g., loadBalancer has 100 generic issues
   │  any loadBalancer?"     │
   ├─────────────────────────┤
   │ Level 2: overlays (741) │  Topology-specific rules for POSITION
   │ "What can go wrong with │  → e.g., LB behind apiGW with compute downstream
   │  THIS loadBalancer in   │     has 3 specific propagation rules
   │  THIS position?"        │
   └─────────────────────────┘
          │
          ▼
5. SIMULATION TICK LOOP
   Every tick (configurable speed):
   ┌──────────────────────────────────────┐
   │ a. Generate traffic (trafficLevel)   │
   │ b. Route through topology            │
   │ c. Per-component:                    │
   │    - Check capacity vs load          │
   │    - Update tick counters            │
   │    - Check thresholds                │
   │    - If breach → trigger issue       │
   │ d. Propagate failures via ruleIntents│
   │ e. Update metrics snapshot           │
   │ f. Update cost accumulator           │
   └──────────────────────────────────────┘
          │
          ▼
6. INCIDENT DETECTION
   When tick counter exceeds threshold:
   - Match to issue from rules
   - Set severity based on defaultSeverity
   - Generate causal narrative:
     "{downstream} database failure causes {component} to fail,
      propagating errors to {upstream}"
          │
          ▼
7. REPORT GENERATION (on stop)
   - Executive Summary (availability, latency, cost, error budget)
   - Incident History table
   - Per-incident: timestamp, component, issue, explanation, severity, recommendation
   - Downloadable as .md
```

---

## 7. Cost Calculation Logic

```
PER COMPONENT (each tick):
  hourly_cost = costPerHour × instances × len(regions)
  
  if sharding:
    hourly_cost × partitionCount
  
  if replication:
    hourly_cost × replicationFactor
  
  if autoScale and current_load > capacity:
    hourly_cost × ceil(current_load / capacity)  // scale up

TOTAL:
  total_cost_per_hour = sum(all component hourly costs)
  monthly_cost = total_cost_per_hour × 24 × 30
  cost_spent = elapsed_hours × total_cost_per_hour
```

---

## 8. Capacity & Overload Logic

```
PER COMPONENT (each tick):
  effective_capacity = capacity × instances
  
  if autoScale:
    if load > effective_capacity × 0.7:  // 70% threshold
      scale_up()  // Add instance (with cooldown)
    if load < effective_capacity × 0.3:  // 30% threshold
      scale_down()
  
  utilization = current_rps / effective_capacity
  
  if utilization > 1.0:
    → OVERLOAD issue triggered
    → Requests start failing
    → Latency spikes
    → Cascading to upstream via ruleIntents
  
  if utilization > 0.7:
    → WARNING state
    → "Budget Left" decreasing
    → "Burn Rate" increasing
```

---

## 9. Cascading Failure Logic

```
When Component A fails:
  1. Find all ruleIntents where propagationRole = "downstream_consumer"
  2. For each upstream component connected to A:
     - Apply impactShape (error_rate_increase, latency_increase, etc.)
     - Increase upstream's pressure tick counters
     - If upstream now also overloaded → cascade continues
  
  3. Generate causal narrative chain:
     "Database primary crash → App Server dependency unavailable → 
      Load Balancer returning 503 → API Gateway cascading failure"
```

---

## 10. Chaos Injection Logic

```
When user drags chaos item onto component:
  1. Identify chaos type (e.g., "networkPartition")
  2. Identify target component
  3. Apply chaos effects:
     - Multiply affected tick counters
     - Reduce effective capacity
     - Increase latency
     - Inject errors
  
  4. Chaos scope determines blast radius:
     - component → single component affected
     - region → all components in same region
     - global → everything affected
  
  5. Chaos synergy:
     - "Network Partition" on database 
       + "Traffic Spike" on API Gateway 
       = amplified cascading failure
```

---

## 11. Settings Panel → Config Mapping

What the user toggles in the Settings UI maps to config properties:

| UI Setting | Config Property | Effect on Simulation |
|------------|----------------|---------------------|
| Routing Rules toggle | `trafficProcessingLayer.routingRulesEnabled` | Adds routing latency, enables path-based routing |
| WAF toggle | `trafficProcessingLayer.wafEnabled` | Adds WAF inspection latency, blocks malicious traffic |
| Rate Limiting toggle | `trafficProcessingLayer.rateLimitingEnabled` | Enforces RPS cap, returns 429 when exceeded |
| Health Checks toggle | `trafficProcessingLayer.healthChecksEnabled` | Probes downstream health, removes unhealthy targets |
| Processing Latency slider | `trafficProcessingLayer.processingLatencyMs` | Adds fixed latency to all requests through this component |
| Scope dropdown | `networkScope` | Determines which components are affected by network chaos |
| AutoScale toggle | `autoScale` | Enables automatic instance scaling based on load |
| Instances input | `instances` | Sets current replica count |
| Capacity input | `capacity` | Sets max RPS per instance |
| Algorithm dropdown | `algorithm` | Determines traffic distribution strategy |
| Consistency dropdown | `consistencyLevel` | Affects read/write behavior in simulation |
| Replication toggle | `replication` | Enables data replication, affects cost and availability |
| Sharding toggle | `sharding` | Enables data partitioning, affects capacity and latency |
| TTL input | `cacheTtlSeconds` | Affects cache hit/miss ratio in simulation |
| Circuit Breaker | `circuitBreaker` | Trips open when downstream fails, prevents cascade |
| DLQ toggle | `dlq` | Failed messages go to dead letter queue instead of being lost |
| Cost/hour | `costPerHour` | Direct input to cost calculation |

---

## 12. Two-Tier Rule System Explained

```
TIER 1: specialization_drafts (78 records)
─────────────────────────────────────────
Purpose: BASE rules for a component TYPE regardless of position
Mode: "catalog_only" or "inherit_only" or "custom_rules"
Example: 
  loadBalancer has 100 issues like:
    - "Health Check Failure" 
    - "Connection Capacity Exhausted"
    - "Backend Port Misconfiguration"
  These apply to ANY loadBalancer anywhere.

TIER 2: specialization_profile_overlays (741 records)
─────────────────────────────────────────────────────
Purpose: TOPOLOGY-SPECIFIC rules for this component in THIS position
Mode: "custom_rules"  
Example:
  loadBalancer|up:api_gateway|down:compute|traits:is_sync_request_path has:
    - "Downstream Compute Target Degradation" (propagated from downstream)
    - "Upstream Traffic Volume Exceeds Capacity" (caused by upstream)
    - "Resource Exhaustion" (local)
  Each has causalNarrativeTemplate for the report.

HOW THEY COMBINE:
  When simulation runs:
  1. Load TIER 1 drafts for the component type → base issue catalog
  2. Load TIER 2 overlays for the specific topology → propagation rules
  3. Tick counters reference issues from BOTH tiers
  4. Report uses causalNarrativeTemplate from TIER 2 for the story
```

---

## 13. Key Implementation Details

### Profile Signature Computation
When canvas topology changes, app computes signature:
```dart
String computeSignature(Component comp) {
  var upstream = connections
    .where((c) => c.targetId == comp.id)
    .map((c) => getComponent(c.sourceId).type)
    .toList();
  
  var downstream = connections
    .where((c) => c.sourceId == comp.id)
    .map((c) => getComponent(c.targetId).type)
    .toList();
  
  var traits = [];
  if (comp.config.autoScale) traits.add("autoscale");
  if (isOnSyncPath(comp)) traits.add("is_sync_request_path");
  if (isReadHeavy(comp)) traits.add("read_heavy");
  if (isWriteHeavy(comp)) traits.add("write_heavy");
  if (hasFanout(comp)) traits.add("fanout_high");
  
  return "${comp.type}|up:${upstream.join(',')}|down:${downstream.join(',')}|traits:${traits.join(',')}";
}
```

### Queuing Theory (M/M/1)
```
For each component:
  arrival_rate (λ) = incoming RPS
  service_rate (μ) = capacity × instances
  utilization (ρ) = λ / μ
  
  avg_queue_length = ρ² / (1 - ρ)           // Little's Law
  avg_wait_time = ρ / (μ × (1 - ρ))         // M/M/1 wait
  avg_response_time = 1 / (μ - λ)            // M/M/1 response
  
  When ρ → 1.0: queue grows unbounded → OVERLOAD
```

### Error Budget Burn
```
  error_budget = 1.0 - availabilityTarget     // e.g., 0.3 for 70% target
  errors_so_far = failed_requests / total_requests
  budget_remaining = max(0, error_budget - errors_so_far)
  burn_rate = errors_per_minute / (error_budget / 30_days_in_minutes)
  
  if burn_rate > 1.0: "Error budget burning faster than sustainable"
  if budget_remaining == 0: "Error budget exhausted"
```
