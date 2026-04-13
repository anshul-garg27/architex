# PaperDraw — Code-Level Reverse Engineering

> Extracted from compiled main.dart.js (5.03 MB) + browser DevTools

---

## 1. App Identity

```json
{
  "app_name": "system_design_simulator",
  "version": "1.0.0",
  "build_number": "1",
  "package_name": "system_design_simulator"
}
```

Build: `v=20260324-recovery1` (March 24, 2026)

---

## 2. Cost Calculation (Actual Compiled Code)

Found in the error budget/report generation block:

```javascript
// ACTUAL CODE from main.dart.js (deobfuscated):

// Monthly cost = cost_per_hour × 24 × 30
monthly_cost = total_cost_per_hour * 24 * 30

// Report fields compiled as:
{
  "total_rps": l.a,
  "avg_latency_ms": l.b,
  "p50_latency_ms": l.c,
  "p95_latency_ms": l.d,
  "p99_latency_ms": l.e,
  "error_rate": l.r,
  "availability": l.w,
  "error_budget_remaining": l.x,
  "error_budget_burn_rate": l.y,
  "total_cost_per_hour": s,
  "monthly_cost": s * 24 * 30,    // ← THE FORMULA
  "cost_spent": l.Q,
  "total_requests": l.at,
  "successful_requests": l.ax,
  "failed_requests": l.ay
}
```

**Default costPerHour: `0.1`** (confirmed in config parser code)

---

## 3. Config Parser (Actual Compiled Code)

How component config is parsed from JSON:

```javascript
// Deobfuscated from costBlock in main.dart.js:

capacity = parseInt(d3.h(d6, "capacity"))                    // Max RPS
instances = parseInt(d3.h(d6, "instances")) || 1              // Default: 1
autoScale = parseBool(d3.h(d6, "autoScale"))
minInstances = parseInt(d3.h(d6, "minInstances")) || 1
maxInstances = parseInt(d3.h(d6, "maxInstances")) || 10
algorithm = parseString(d3.h(d6, "algorithm"))                // LB algorithm
replication = parseBool(d3.h(d6, "replication"))
replicationFactor = parseInt(d3.h(d6, "replicationFactor")) || 1
replicationStrategy = parseString(d3.h(d6, "replicationStrategy"))
sharding = parseBool(d3.h(d6, "sharding"))
shardingStrategy = parseString(d3.h(d6, "shardingStrategy"))
partitionCount = parseInt(d3.h(d6, "partitionCount")) || 1
consistentHashing = parseBool(d3.h(d6, "consistentHashing"))
regions = parseList(d3.h(d6, "regions")) || ["us-east-1"]     // Default region
costPerHour = parseFloat(d3.h(d6, "costPerHour")) || 0.1     // Default: $0.10
dbSchema = parseString(d3.h(d6, "dbSchema"))
showSchema = parseBool(d3.h(d6, "showSchema"))
rateLimiting = parseBool(d3.h(d6, "rateLimiting"))
rateLimitRps = parseInt(d3.h(d6, "rateLimitRps"))
circuitBreaker = parseBool(d3.h(d6, "circuitBreaker"))
retries = parseBool(d3.h(d6, "retries"))
dlq = parseBool(d3.h(d6, "dlq"))
quorumRead = parseInt(d3.h(d6, "quorumRead"))
quorumWrite = parseInt(d3.h(d6, "quorumWrite"))
availabilityTarget = parseFloat(d3.h(d6, "availabilityTarget")) || 0.7
simulatesAs = parseString(d3.h(d6, "simulatesAs"))
```

---

## 4. Simulation Snapshot (Actual Compiled Code)

The simulation creates snapshots per tick:

```javascript
// From simulationBlock — the snapshot model:
SimulationSnapshot = {
  "tick": s.a,
  "elapsed_ms": s.b,
  "total_rps": s.c,
  "p95_latency_ms": s.d,
  "error_rate": s.e,
  "availability": s.f,
  "monthly_cost": s.r,
  "failure_count": s.w,
  "active_chaos_events": s.x,
  "traffic_level": s.y
}

// Availability formatting logic:
formatAvailability(value) {
  percent = value * 100
  if (percent >= 99.99) return "99.99%"
  if (percent >= 99.9) return "99.9%"
  if (percent >= 99) return "99%"
  return percent.toFixed(1) + "%"
}
```

---

## 5. System Constraints Model

```javascript
// From simulationBlock — user-configurable constraints:
SystemConstraints = {
  "dau": s.a,                    // Daily Active Users
  "qps": s.b,                   // Queries Per Second
  "readWriteRatio": s.c,        // Read/Write ratio
  "latencySlaMsP50": s.d,       // P50 latency SLA
  "latencySlaMsP95": s.e,       // P95 latency SLA
  "availabilityTarget": s.f,    // e.g., 0.999
  "budgetPerMonth": s.r,        // Monthly $ budget
  "dataStorageGb": s.w,         // Storage needs
  "regions": s.x,               // Region list
  "customConstraints": s.y      // Free-form constraints
}
```

---

## 6. Supabase Query for Specialization Rules (Actual Code)

```javascript
// From specQueryBlock — how app queries Supabase:

// 1. Get profile signatures from current canvas components
signatures = components.map(c => computeProfileSignature(c))
types = components.map(c => c.componentType)

// 2. Query Supabase
query = supabase
  .from("specialization_profile_overlays")
  .select("*")
  .eq("status", "approved")
  .eq("is_runtime_current", true)
  .in("component_type", types)           // Filter by component types on canvas
  .in("profile_signature", signatures)   // Filter by topology signatures
  .order("updated_at", descending: true) // Latest first

// 3. Parse response
results = query.execute()
for (overlay in results) {
  draftJson = overlay.draft_json || overlay.draftJson
  // Parse as Map<String, dynamic>
  componentType = overlay.component_type
  profileSignature = overlay.profile_signature
  // ... load issues and ruleIntents
}
```

---

## 7. Tick Counter System (Actual Code)

All 35 tick counters used in simulation:

```javascript
// From tickLogicBlock — the massive tick update function:
// Function signature: c8s(h5, h6, h7, h8, h9, i0, i1, i2)
// Takes 8 parameters (state inputs)

// Tick counter names (actual strings from compiled code):
tick_counters = {
  "cpuThrottleTicks": 0,
  "threadPoolSaturationTicks": 0,
  "eventLoopBlockTicks": 0,
  "connectionPressureTicks": 0,
  "ephemeralPortPressureTicks": 0,
  "deployInstabilityTicks": 0,
  "probeFailureTicks": 0,
  "duplicateExecutionTicks": 0,
  "batchPreemptionTicks": 0,
  "checkpointRiskTicks": 0,
  "shufflePressureTicks": 0,
  "batchDiskPressureTicks": 0,
  "batchNetworkPressureTicks": 0,
  "dependencyTimeoutTicks": 0,
  "dependencyRateLimitTicks": 0,
  "credentialFailureTicks": 0,
  "retryPressureTicks": 0,
  "downstreamPoolPressureTicks": 0,
  "egressBlockTicks": 0,
  "infraPressureTicks": 0,
  "autoscaleLagTicks": 0,
  "controlPlaneLagTicks": 0,
  "logPressureTicks": 0,
  "cacheStalenessTicks": 0,
  "visibilityRaceTicks": 0,
  "staleResultTicks": 0,
  "schedulerOverlapTicks": 0,
  "heartbeatStallTicks": 0,
  "gcPressureTicks": 0,
  "jobLagTicks": 0,
  "jobTimeoutTicks": 0,
  "dlqTicks": 0,
  "batchSkewTicks": 0,
  "errorTicks": 0,
  "dnsFailureTicks": 0
}
```

---

## 8. Cascade Detection (Actual Code)

```javascript
// From cascadeBlock — cascade propagation parameters:
CascadeEvent = {
  "cascadeScore": number,           // How severe the cascade is (0-1)
  "cascadeLabel": string,           // Human-readable label
  "mechanism": string,              // How it propagated
  "seedType": string,               // What started it
  "isSeedSource": boolean,          // Is this the origin?
  "isFailoverTarget": boolean,      // Is this receiving failover traffic?
  
  // Amplification factors:
  "errorAmplification": number,     // How much errors multiply
  "latencyAmplification": number,   // How much latency increases
  "trafficAmplification": number,   // How much traffic shifts
  "dropAmplification": number,      // How many requests drop
  "capacityDegradation": number,    // How much capacity is lost
  
  "relatedComponentIds": string[]   // Which components are in the chain
}
```

---

## 9. Component Registration (Actual Code)

Components registered as constants with icon + ordinal:

```javascript
// From componentFactory — actual compiled registration:
// Pattern: new A.at(displayName, description, iconRef, ordinal, id)

B.bP = new A.at("DNS", "Traffic routing & domain resolution", B.pW, 0, "dns")
B.cc = new A.at("CDN", "Cache static content globally", ..., 1, "cdn")
// ... (107 total, each with icon reference from MaterialIcons)

// Container example:
B.d5 = new A.at("Subnet", "Container for isolated network segments inside a VPC", B.adZ, 30, "subnet")

// UML example:
B.cf = new A.at("UML API", "UML API endpoint", B.acq, 94, "umlApi")
```

---

## 10. Profile Signature Parser (Actual Code)

```javascript
// From profileSigBlock — how overlays are parsed:

function parseOverlay(data) {
  id = data["id"]
  
  // Component type (supports both formats)
  componentType = data["componentType"] || data["component_type"]
  
  // Profile signature (supports both formats)
  profileSignature = data["profileSignature"] || data["profile_signature"]
  
  domain = data["domain"] || ""
  
  // Draft JSON can be object or string
  draftJson = data["draftJson"] || data["draft_json"]
  if (typeof draftJson === "string") {
    draftJson = JSON.parse(draftJson)
  }
  
  status = data["status"]
  // ... continue parsing
}
```

---

## 11. Canvas State Structure (from localStorage)

```typescript
// Actual structure found in localStorage:
interface LocalCanvasState {
  components: Array<{
    id: string;              // "api_gateway"
    type: string;            // "apiGateway"  
    name: string;            // "API Gateway"
    position: { x: number; y: number };
    size: { w: number; h: number };
    config: ComponentConfig; // 45 properties (see section 12)
  }>;
  
  connections: Array<{
    id: string;              // "c1"
    sourceId: string;        // "api_gateway"
    targetId: string;        // "load_balancer"
    type: "request" | "async";
    direction: "unidirectional" | "bidirectional";
    protocol: "http" | "grpc" | "websocket" | "tcp" | "udp" | "custom";
    trafficFlow: number;     // 0 when not simulating
    label: string | null;
    isActive: boolean;
  }>;
  
  panOffset: { x: number; y: number };
  scale: number;
  activeProblemId: string;   // "url_shortener"
  origin: string;
  isCyberpunkMode: boolean;  // Visual theme
  trafficLevel: number;      // Simulation load
  showErrors: boolean;       // Error visibility
}
```

---

## 12. Default Config Values (from localStorage)

```javascript
// Defaults per component type (extracted from actual saved state):

API_GATEWAY = {
  capacity: 8000, instances: 1, autoScale: false,
  costPerHour: 0.1, availabilityTarget: 0.7,
  cacheTtlSeconds: 300, regions: ["us-east-1"]
}

LOAD_BALANCER = {
  capacity: 12000, instances: 1, autoScale: false,
  algorithm: "round_robin",     // ← ONLY LB has this set
  costPerHour: 0.1, availabilityTarget: 0.7
}

APP_SERVER = {
  capacity: 1000, instances: 1, autoScale: true,  // ← autoScale ON
  minInstances: 1, maxInstances: 2,
  costPerHour: 0.1, availabilityTarget: 0.7
}

CACHE = {
  capacity: 1600, instances: 1, autoScale: false,
  cacheTtlSeconds: 10,  // ← Much lower TTL than others (10 vs 300)
  costPerHour: 0.1, availabilityTarget: 0.7
}

DATABASE = {
  capacity: 1600, instances: 1, autoScale: false,
  consistencyLevel: null,  // User must choose
  replication: false,      // Off by default
  sharding: false,         // Off by default
  costPerHour: 0.1, availabilityTarget: 0.7
}
```

---

## 13. Files Available on Server

| File | Status | Size | Type |
|------|--------|------|------|
| `/main.dart.js` | 200 | 5.03 MB | Compiled app |
| `/main.dart.mjs` | 200 | 40 KB | WASM loader module |
| `/main.dart.wasm` | 200 | unknown | WASM binary |
| `/flutter_bootstrap.js` | 200 | 11 KB | Bootstrap/loader |
| `/flutter_service_worker.js` | 200 | 3.6 KB | PWA service worker |
| `/manifest.json` | 200 | small | PWA manifest |
| `/version.json` | 200 | small | `{app_name: "system_design_simulator"}` |
| `/assets/AssetManifest.bin.json` | 200 | binary | Asset index (3056 entries) |
| `/assets/FontManifest.json` | 200 | 185 B | Font list |
| `/sitemap.xml` | 200 | 248 B | SEO sitemap |
| `/robots.txt` | 200 | small | SEO robots |
| `/main.dart.js.map` | 200* | empty | Source map (blocked/empty) |

*Source map returns 200 but is empty — no original source recovery possible.

---

## 14. Supabase Edge Functions

From robots.txt:
```
Sitemap: https://uvbvgyepzrfaqpsqphjl.functions.supabase.co/public-sitemap
```

Plus the RPC function called on page load:
```
POST /rest/v1/rpc/record_daily_visit
```

This means they have Supabase Edge Functions for:
1. Dynamic sitemap generation (`public-sitemap`)
2. Daily visit tracking (`record_daily_visit`)
3. Potentially more (AI generation, subscription management)

---

## 15. State Management Architecture

From string analysis:
```
Identified state references:
  - viewState          (canvas position/zoom)
  - umlState           (UML mode state)
  - metaState          (design metadata)
  - callerState        (connection source tracking)
  - targetState        (connection target tracking)
  - lastComponentBehaviorState  (simulation behavior cache)
  - getKeyboardState   (keyboard input tracking)
```

Pattern: Flutter uses **ChangeNotifier/Provider** pattern (not BLoC).
Evidence: No Bloc/Cubit references found, but Provider and Controller references present.

---

## 16. External Domains Contacted (12)

```
paperdraw.dev                          — Main app
uvbvgyepzrfaqpsqphjl.supabase.co      — Backend (Supabase)
accounts.google.com                     — Google Sign-In
www.google-analytics.com               — Analytics
www.googletagmanager.com               — Tag Manager
pagead2.googlesyndication.com          — AdSense ads
googleads.g.doubleclick.net            — Ad serving
fonts.gstatic.com                      — Google Fonts
www.gstatic.com                        — Flutter CanvasKit
ep1.adtrafficquality.google            — Ad quality
ep2.adtrafficquality.google            — Ad quality
www.google.com                         — reCAPTCHA
```
