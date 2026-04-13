# PaperDraw.dev - Complete Research & Analysis

> Scraped and analyzed on 2026-04-11

## What is PaperDraw.dev?

A browser-based **system design simulator** that lets you build, simulate, and chaos test distributed systems architecture. Unlike static diagramming tools (Excalidraw, draw.io), PaperDraw allows you to:

1. **Drag-and-drop** architecture components (load balancers, caches, databases, queues, services)
2. **Configure** throughput, latency, capacity limits per component
3. **Run traffic simulations** to see where bottlenecks emerge
4. **Inject chaos events** (node kills, latency spikes, partition splits) and analyze impact
5. **Browse community-shared** system design blueprints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Flutter Web** (Dart compiled to JS via dart2js/dart2wasm) |
| Rendering | **CanvasKit** (Skia via WASM) |
| Auth | Google Sign-In (required) |
| Payments | PayPal SDK (subscription model) |
| Analytics | Google Analytics 4 (G-LZF5K67DJ8) |
| Monetization | Google AdSense |
| PWA | manifest.json, service worker |
| Fonts | Architects Daughter, Fira Code (Regular/Medium/SemiBold) |

## Data Model - TWO Schemas Discovered

### Schema V1: Simple (7 of 9 solutions)
Used by: ridesharing, url_shortener, ai_agent, banking_ledger, video_streaming, data_analytics, complex_sample

```typescript
interface PaperDrawDesignV1 {
  viewState: {
    panOffset: { x: number; y: number };
    scale: number;
  };
  components: Component[];
  connections: Connection[];
}

interface Component {
  id: string;
  type: ComponentType;           // e.g. "client", "apiGateway", "cache"
  customName?: string;           // Display label
  position: { x: number; y: number };
  size: { w: number; h: number };
  parentContainerId?: string;    // Nested inside a container
  config: {
    capacity?: number;
    instances?: number;
    autoScale?: boolean;
    rateLimiting?: boolean;
    rateLimitRps?: number;
    algorithm?: string;          // e.g. "round_robin"
    sharding?: boolean;
    replication?: boolean;
    regions?: string[];          // e.g. ["us-east-1", "eu-west-1"]
    costPerHour?: number;
  };
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: "request" | "async";     // sync vs async
  label?: string;
}
```

### Schema V2: Advanced (2 of 9 solutions)
Used by: minimal_design, sos_uml_blueprint

```typescript
interface PaperDrawDesignV2 {
  metadata: {
    systemName: string;
    domain: string;
    version: string;
    author?: string;
    description?: string;
  };
  globals?: {
    region: string;
    environment: string;
    defaultProtocol: string;
    timeUnit: string;
  };
  components: Record<string, AdvancedComponent>;  // Object, NOT array
  connections: AdvancedConnection[];
  dataFlows?: DataFlow[];
  constraints?: {
    latency: { p95Ms: number; p99Ms: number };
    availability: { target: string };
    cost: { monthlyUSD: number };
  };
  scalingRules?: Record<string, ScalingRule>;
  failureModes?: Record<string, FailureMode>;
  security?: SecurityConfig;
  observability?: ObservabilityConfig;
  viewState: ViewState;
}

interface AdvancedComponent {
  id: string;
  name: string;
  type: string;                          // "apiGateway" OR "rectangle" (UML mode)
  category?: "traffic" | "compute" | "storage";
  properties?: Record<string, any>;      // Includes "simulatesAs" for UML rectangles
  capacity: { instances: number; maxRPSPerInstance: number };
  scaling: { autoScale: boolean; minInstances: number; maxInstances: number };
  position: { x: number; y: number };
  size?: { w: number; h: number };
}

interface AdvancedConnection {
  id: string;
  from: string;                          // NOT sourceId
  to: string;                            // NOT targetId
  protocol: "HTTPS" | "TCP" | "ASYNC";
  sync?: boolean;
  label?: string;
}
```

## Component Types Discovered (37 total)

### Traffic Layer
| Type | Description | Used In |
|------|------------|---------|
| `client` | End users / apps | All |
| `inputNode` | Event sources / webhooks | data_analytics |
| `dns` | DNS resolver | url_shortener, video_streaming, complex |
| `cdn` | Content Delivery Network | url_shortener, video_streaming, complex |
| `loadBalancer` | Load balancer | url_shortener, video_streaming, complex, minimal |
| `waf` | Web Application Firewall | banking, complex |
| `ddosShield` | DDoS protection | banking |
| `apiGateway` | API Gateway with rate limiting | All |

### Compute Layer
| Type | Description | Used In |
|------|------------|---------|
| `appServer` | Application server | url_shortener, banking, complex, sos |
| `customService` | Custom service | ridesharing, complex |
| `worker` | Background worker | url_shortener, complex |
| `mediaProcessor` | Video/media transcoder | video_streaming |
| `batchProcessor` | Batch processing (Spark) | data_analytics |
| `etlPipeline` | ETL pipeline | data_analytics |
| `agentOrchestrator` | AI agent orchestrator | ai_agent |

### Storage Layer
| Type | Description | Used In |
|------|------------|---------|
| `database` | General database | url_shortener, video_streaming, complex, banking |
| `cache` | Redis cache | ridesharing, url_shortener, complex, minimal |
| `objectStore` | S3/blob storage | video_streaming, complex |
| `stream` | Kafka/event stream | url_shortener, data_analytics |
| `queue` | Message queue | video_streaming |
| `pubsub` | Pub/sub bus | complex |
| `vectorDb` | Vector database | ai_agent |
| `graphDb` | Graph database | ai_agent |
| `dataLake` | Data lake (S3) | data_analytics |
| `dataWarehouse` | Data warehouse (BigQuery) | data_analytics |
| `timeSeriesDb` | Time-series DB | data_analytics |
| `schemaRegistry` | Schema registry | data_analytics |

### Specialized
| Type | Description | Used In |
|------|------------|---------|
| `notificationService` | Push/SMS notifications | ridesharing, complex |
| `analyticsService` | Analytics service | ridesharing |
| `llmGateway` | LLM API gateway/router | ai_agent |
| `safetyMesh` | AI safety/guardrails | ai_agent |
| `toolRegistry` | Tool/function registry | ai_agent |
| `memoryFabric` | Agent memory store | ai_agent |
| `paymentGateway` | Payment processor | banking |
| `fraudDetectionEngine` | Fraud detection ML | banking |
| `hsm` | Hardware Security Module | banking |
| `ledgerService` | Immutable ledger | banking |
| `container` | Visual grouping container | All |
| `rectangle` | UML class box (with methods) | sos_uml |

## Connection Types

### V1 Schema
| Type | Meaning |
|------|---------|
| `request` | Synchronous request/response |
| `async` | Asynchronous / fire-and-forget |

### V2 Schema
| Protocol | Meaning |
|----------|---------|
| `HTTPS` | Synchronous HTTPS |
| `TCP` | Direct TCP connection |
| `ASYNC` | Asynchronous (sync: false) |

## Solutions Included (9 total)

| File | Problem | Components | Connections | Schema |
|------|---------|-----------|-------------|--------|
| `ridesharing_system.json` | Uber/Lyft ridesharing | 12 | 10 | V1 |
| `url_shortener_solution.json` | TinyURL/bit.ly | 14 | 11 | V1 |
| `ai_agent_orchestration.json` | LLM agent system | 10 | 8 | V1 |
| `banking_ledger_system.json` | Secure banking ledger | 13 | 10 | V1 |
| `video_streaming_platform.json` | YouTube/Netflix | 13 | 12 | V1 |
| `data_analytics_platform.json` | Data pipeline (Kafka+Spark) | 11 | 8 | V1 |
| `complex_sample_design.json` | Social media feed | 21 | 19 | V1 |
| `minimal_design.json` | Basic web architecture | 5 | 4 | V2 |
| `sos_uml_blueprint.json` | Emergency SOS system (UML) | 8 | 10 | V2 |

## Explanation Files (9 total)

Each solution has a corresponding deep-dive markdown explaining:
- **Why** each component was chosen (not just what it does)
- **Trade-offs** made and alternatives considered
- **Scaling strategies** and failure modes
- **Real-world implementation details** (specific technologies, algorithms)

## Key Architectural Patterns Observed

1. **Layered Container Grouping**: Every solution uses `container` components to group related services (Edge, Compute, Data layers)
2. **Edge -> Compute -> Data Flow**: Consistent top-to-bottom data flow pattern
3. **Async for Non-Critical Paths**: Analytics, notifications, fan-out always use `async` connections
4. **Config-Driven Simulation**: Components carry `capacity`, `instances`, `autoScale` for simulation
5. **Parent-Child Nesting**: `parentContainerId` links services to their logical group
6. **Position-Based Canvas**: All coordinates centered around (5000, 5000) with panOffset around (-4500, -4600)

## PWA Configuration

```json
{
  "name": "paperdraw.dev",
  "short_name": "paperdraw",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary"
}
```

## Features Deep-Dive

See **[features.md](features.md)** for the complete feature analysis including:
- 80+ draggable component types across 10 categories
- Canvas toolbar with 10 drawing tools + 9 UML tools
- Chaos injection system (Infrastructure Failures, Network Chaos, Traffic Chaos, Dependency Chaos)
- Real-time simulation with live RPS, latency, utilization, cost metrics
- Per-component queuing theory parameters (target utilization, burn rate, budget)
- Post-simulation Engineering Report with incident detection & recommendations
- Time scrubber for simulation replay
- Cost calculator projecting monthly infrastructure costs
- AI design generation & AI review (Pro features)
- Community design library with ratings
- Export video, share, import/export
- Light/dark mode, UML class diagram mode

## Folder Structure

```
research/paperdraw/
├── README.md                              # This file
├── features.md                            # Complete UI/feature analysis from live exploration
├── js-analysis.md                         # Deep JS bundle extraction — 60 components, 73 chaos items, 14 protocols
├── solutions/                             # 9 solution JSON blueprints
│   ├── ridesharing_system.json
│   ├── url_shortener_solution.json
│   ├── ai_agent_orchestration.json
│   ├── banking_ledger_system.json
│   ├── video_streaming_platform.json
│   ├── data_analytics_platform.json
│   ├── minimal_design.json               # V2 schema (advanced)
│   ├── complex_sample_design.json
│   └── sos_uml_blueprint.json            # V2 schema (UML mode)
└── explanations/                          # 9 deep-dive engineering rationale MDs
    ├── url_shortener.md
    ├── ridesharing.md
    ├── ai_agent.md
    ├── banking_ledger.md
    ├── video_streaming.md
    ├── data_analytics.md
    ├── social_feed.md
    ├── sos_uml.md
    └── minimal_design.md
```
