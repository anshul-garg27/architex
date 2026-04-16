Now I have a thorough understanding of the codebase. Let me compile the complete feature matrix.

---

# ARCHITEX HLD MODULE -- COMPLETE INTERACTIVE FEATURE SET

## EXECUTIVE INVENTORY: WHAT EXISTS TODAY

Before designing new features, here is the honest accounting of what the codebase already has:

**Existing Infrastructure (strong foundation):**
- 55 system design JSON templates (uber-dispatch, netflix-cdn, payment-system, etc.)
- MetricsCollector with sliding-window throughput, sorted percentile computation
- ChaosEngine with 30+ typed events across 10 categories, amplification factors, visual indicators
- WhatIfEngine (remove-node, double-traffic, add-cache, scale-up/down, inject-failure)
- CostModel with ~75 component types and live cost tracking
- CapacityPlanner with back-of-envelope estimation from DAU/RPS inputs
- NarrativeEngine with 20 causal templates for human-readable event explanations
- ConsistentHashRing with FNV-1a, virtual nodes, redistribution tracking
- VectorClockSimulation with happens-before and concurrency detection
- CRDT implementations (GCounter, PNCounter, LWWRegister, ORSet) with simulation wrapper
- TrafficSimulator, QueuingModel, FailureModes, CascadeEngine, SLA Calculator
- AI stack: ClaudeClient, ArchitectureGenerator, DesignReviewer, InterviewScorer, HintSystem, SocraticTutor, FrustrationDetector
- FSRS spaced repetition engine
- 20+ challenge definitions across 5 difficulty levels with 4-level hint system
- 6-dimension scoring rubric (Functional, API, DataModel, Scalability, Reliability, TradeoffAwareness)
- Latency/Throughput/Cost constants with real-world numbers
- Simulation store with traffic patterns (constant, sine-wave, spike, ramp, random)
- Interview store with IndexedDB persistence for warm-resume
- Export to JSON, PlantUML, Terraform, URL

**Key gaps the feature set below addresses:**
- Concept-level interactive teaching (the engines exist but no dedicated learning flows per topic)
- Progressive build sequences (templates exist as finished products, not as step-by-step builds)
- Isolated concept simulations (consistent hashing ring exists in lib but has no canvas visualization)
- Assessment beyond interview mode (no quiz engine for individual concepts)
- Review/retention system wired to HLD concepts (FSRS exists but only for LLD patterns)

---

## 1. API DESIGN

### 1.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| REST/gRPC/GraphQL Side-by-Side Canvas | Three-panel comparison: same e-commerce query shown as REST endpoints, gRPC protobuf, and GraphQL schema. User drags a "request" token through each path; canvas animates the hops, serialization time, and payload size differences. Uses existing latency constants (GRPC_UNARY_DATACENTER: 1ms vs REST overhead). | 9 | 9 | L | No |
| API Versioning Timeline | Interactive timeline showing URL versioning (/v1/, /v2/) vs header versioning vs query param. User clicks "deploy breaking change" and watches which clients break depending on the versioning strategy. Visualizes backward compatibility as colored client connections (green = working, red = broken). | 7 | 7 | M | No |
| Idempotency Key Visualizer | Animated sequence: client sends POST /orders with idempotency key. Network fails. Client retries with same key. Canvas shows the server deduplication lookup (Redis check), the "already processed" path vs "new request" path. Uses existing Redis latency constant (200us). | 8 | 8 | M | No |
| Pagination Playground | User picks cursor-based vs offset-based vs keyset pagination. Canvas shows a database table with 10M rows, animates the query plan (sequential scan for offset, index scan for cursor), shows latency degradation as page number increases. Interactive slider for page number. | 7 | 6 | M | No |
| Rate Limiting Algorithm Lab | Four algorithms side-by-side (token bucket, sliding window log, sliding window counter, leaky bucket). User fires bursts of requests by clicking; each algorithm shows accept/reject in real-time with bucket/window state visible. Already has rate-limiter challenge template. | 9 | 8 | M | Partial (challenge exists, no interactive algo viz) |

### 1.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| API Gateway Traffic Simulator | Extend existing traffic simulator with API-specific chaos: inject malformed payloads, expired auth tokens, missing headers. Gateway node shows accept/reject counts. Uses existing ChaosEngine "application" category. | 8 | 7 | M | Partial (chaos engine exists, need API-specific events) |
| Rate Limiter Under Load | Stress test the rate-limiter-template with spike traffic pattern. Dashboard shows 429 response rate, queue depth, fair distribution across clients. Uses existing spike traffic pattern from TrafficConfig. | 8 | 7 | S | Partial (template + traffic patterns exist) |
| gRPC Streaming vs REST Polling | Simulated chat scenario: one path uses REST polling (1 req/sec), the other uses gRPC bidirectional streaming. Metrics show bandwidth savings, latency reduction, connection count differences. | 7 | 8 | L | No |

### 1.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Fix This API" Challenge | Given a deliberately broken API design (wrong HTTP methods, no pagination, no error codes, no versioning), user must identify and fix each issue. Scoring uses existing 6-dimension rubric, focusing on API dimension. | 8 | 7 | M | Partial (scoring rubric exists) |
| Design API for Given Product | Timed challenge: "Design the API for a food delivery app." User defines endpoints, request/response schemas, auth strategy. AI reviewer checks against best practices. Uses existing AI design-reviewer. | 9 | 7 | M | Partial (AI reviewer exists, need API-specific rules) |

### 1.4 ASSESSMENT

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| API Design Tradeoff Quiz | "You need real-time updates for a dashboard. Which approach and why?" Choices: WebSocket, SSE, long polling, gRPC stream. Must explain tradeoff, not just pick answer. Adaptive difficulty using existing difficulty-scaling.ts. | 8 | 6 | M | Partial (difficulty scaling exists) |
| "What's Wrong?" Identification | Screenshot-style rendering of API docs with 5 hidden issues (missing auth, wrong status codes, N+1 pattern). User identifies each one. Timed. | 7 | 7 | M | No |

### 1.5 REVIEW

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| API Design Flashcards | FSRS-powered cards: "What status code for idempotent retry?" / "When to use 202 vs 200?" / "GraphQL N+1 solution?". Wire into existing FSRS engine (srs.ts). | 8 | 5 | S | Partial (FSRS engine exists, need API content) |
| Daily API Challenge | One API design micro-challenge per day. "Design the webhook endpoint for a payment provider." 10-minute format. Uses existing daily-challenge.ts infrastructure. | 7 | 6 | S | Partial (daily challenge infra exists) |

### 1.6 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI API Reviewer | User pastes or builds API spec; AI analyzes for REST maturity level, missing pagination, inconsistent naming, missing error contracts. Extends existing design-reviewer.ts with API-specific rules. | 9 | 8 | M | Partial (design reviewer exists, need API rules) |
| AI Mock Interviewer for API Design | "Walk me through your API design for this system." AI asks follow-ups: "What happens if this endpoint is called twice?" "How do you handle backward compatibility?" Uses existing socratic-tutor.ts. | 9 | 9 | M | Partial (socratic tutor exists, need API prompts) |

---

## 2. DATABASE DESIGN

### 2.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| SQL vs NoSQL Decision Tree | Interactive decision flowchart on canvas. User answers questions (structured data? ACID needed? read-heavy? scale requirements?) and the tree highlights the path to PostgreSQL, MongoDB, DynamoDB, Cassandra, etc. Each leaf node links to a template. | 9 | 8 | M | No |
| Normalization/Denormalization Lab | Live schema editor: user starts with a denormalized "orders" table. Canvas shows the data with redundancy highlighted in red. User applies 1NF, 2NF, 3NF step-by-step, watching the schema split into normalized tables with edges showing foreign keys. Then reverses it for read optimization. | 9 | 9 | L | No |
| Index Visualizer | B-tree rendered as an interactive tree on canvas (uses existing tree-layout.ts from algorithms). User adds rows, watches the B-tree rebalance. Then runs a query: with index = binary search animation through tree; without index = sequential scan through all leaves. Shows timing difference. | 10 | 10 | L | Partial (B-tree algo exists, need canvas visualization) |
| Partitioning Strategy Visualizer | Range partitioning vs hash partitioning vs consistent hashing shown side-by-side on three hash rings. User adds data, watches distribution. Consistent hash ring uses existing ConsistentHashRing class directly. Toggle virtual nodes on/off to see load imbalance. | 9 | 9 | M | Partial (ConsistentHashRing exists, need canvas rendering) |
| Query Execution Plan Animator | User writes a SQL query; canvas shows the execution plan as a tree (Seq Scan -> Filter -> Sort -> Limit). Adding an index transforms the tree (Index Scan -> Limit). Animated with existing motion system. | 8 | 8 | L | No |

### 2.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Read Replica Lag Simulator | Primary database node writes; 1-3 replica nodes receive changes with configurable lag (0ms to 5000ms). User queries a replica and sees stale data. Demonstrates eventual consistency viscerally. Uses existing replicationLag pressure counter. | 9 | 9 | M | Partial (pressure counters exist) |
| Hot Partition Demo | DynamoDB-style table with hash partition key. Traffic simulator sends requests biased toward one partition key. Canvas shows one partition turning red (hot) while others are idle. Then user fixes it by choosing a better partition key. | 9 | 8 | M | Partial (traffic simulator exists) |
| Write-Ahead Log Visualizer | Animated WAL: every write appends to the log first (sequential), then applies to the B-tree (random I/O). Crash at any point, replay the WAL to recover. User clicks "crash" button, watches recovery. Uses existing HDD/SSD latency constants. | 8 | 9 | L | No |

### 2.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Schema Design Challenge | "Design the database schema for Uber." User creates tables, defines indexes, chooses partition keys. AI evaluates against reference schema. Uses existing challenges.ts infrastructure with new "design-uber-schema" challenge. | 9 | 7 | M | Partial (challenge infra exists) |
| "Fix This Schema" | Given a schema with N+1 queries, missing indexes, wrong normalization level. User identifies and fixes. Canvas shows query plan before/after each fix with latency improvement. | 8 | 8 | M | No |

### 2.4 ASSESSMENT

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Storage Capacity Estimation | "Instagram has 100M photo uploads/day at 2MB average. How much storage per year? What tier strategy?" Uses existing estimateStorage() and REAL_WORLD constants directly. Interactive calculator where user fills in the formula. | 9 | 7 | S | Partial (capacity planner exists) |
| DB Tradeoff Analysis | "Your e-commerce site does 10K writes/sec and 100K reads/sec. SQL or NoSQL? Justify." Scored on reasoning depth. Uses existing scoring rubric. | 8 | 6 | M | Partial |

### 2.5 REVIEW

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Database Concept Flashcards | FSRS cards: "ACID vs BASE" / "When to denormalize" / "B-tree vs LSM-tree" / "Composite index ordering rule". | 8 | 5 | S | Partial (FSRS exists) |

### 2.6 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Schema Reviewer | User draws schema on canvas. AI identifies: missing indexes for query patterns, poor partition key choices, over-normalization for read-heavy workload. Extends design-reviewer.ts. | 9 | 8 | M | Partial |
| AI Capacity Estimation Coach | User does back-of-envelope calculation. AI checks math, suggests corrections: "You forgot replication factor" or "Your QPS assumes uniform distribution but Uber has peak hours." Uses existing capacity-planner.ts numbers as ground truth. | 9 | 9 | M | Partial |

---

## 3. SCALING

### 3.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Horizontal vs Vertical Scaling Visualizer | Single server node on canvas. User clicks "vertical scale" -- node grows larger, metrics increase. Clicks "horizontal scale" -- server duplicates, load balancer appears. Shows cost curves for each approach. Uses existing cost-model.ts. | 9 | 8 | M | No |
| Stateless vs Stateful Architecture | Two canvases: stateful (sessions stored in server memory) and stateless (sessions in Redis). User kills a server node. Stateful: sessions lost, users get errors. Stateless: transparent failover. Uses existing chaos engine "infrastructure" events. | 9 | 9 | M | Partial (chaos engine exists) |
| Connection Pool Visualizer | Database node with a pool of 100 connections. 5 server nodes sharing the pool. Animated: requests acquire connections, run queries, release. User increases traffic until pool exhaustion (all 100 busy). Shows PgBouncer as a fix. Uses existing connectionPoolUsage pressure counter. | 8 | 8 | M | Partial (pressure counter exists) |
| Auto-Scaling Step-Through | CloudWatch-style metrics graph at top. Traffic ramps up via existing ramp pattern. When CPU crosses 70% threshold, new server nodes appear on canvas with spin-up animation (scale-out). Traffic drops, nodes disappear (scale-in). Shows cool-down period. | 9 | 9 | L | Partial (traffic patterns + ramp exist) |

### 3.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Load Balancer Algorithm Comparison | Three load balancers: round-robin, least-connections, consistent-hash. Same traffic hits all three. Dashboard shows request distribution, tail latency, and what happens when a server dies. Uses existing QueuingModel. | 9 | 8 | M | Partial (queuing model exists) |
| "What Breaks at 10x?" | User's current architecture. Click "10x traffic" button (extends WhatIfEngine "double-traffic" with configurable multiplier). Canvas shows cascading failures: queue overflow, connection pool exhaustion, database timeout. Narrative engine explains each failure. | 10 | 10 | M | Partial (WhatIfEngine + NarrativeEngine exist) |

### 3.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Scale This System" Challenge | Given a working single-server architecture handling 100 RPS. Requirements: scale to 10K RPS. User adds components (cache, replicas, load balancer, CDN). Simulation validates whether the new design actually handles the load. | 10 | 9 | L | Partial (templates + simulation exist) |

### 3.4 ASSESSMENT

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Capacity Estimation Calculator | Interactive form: DAU, requests per user, peak ratio, read/write ratio, payload sizes. User fills in estimates; system checks against correct math using existing CapacityInput/CapacityEstimate types. Shows percentage error. | 9 | 7 | S | Partial (capacity planner exists, need UI) |

### 3.5 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Cost Estimator | AI analyzes user's architecture and estimates monthly AWS cost. Uses existing CostModel with ~75 component types. Compares against budget constraint from challenge. | 9 | 8 | S | Partial (cost model exists) |
| AI Scaling Advisor | "Your architecture handles 5K RPS but the requirement is 50K. Here's what needs to change and why." Uses existing topology-rules.ts + design-reviewer.ts. | 9 | 8 | M | Partial |

---

## 4. CACHING

### 4.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Cache Strategy Visualizer | Four tabs: Cache-Aside, Write-Through, Write-Back, Write-Around. Each shows an animated request flow on canvas: Client -> Cache -> Database with arrows showing read/write paths. User triggers a read and a write on each tab, seeing the difference. Uses existing Redis latency (200us) vs Postgres (1ms) constants. | 10 | 9 | M | No |
| LRU/LFU Eviction Playground | Visual doubly-linked list + hash map. User performs get/set operations. Nodes animate to front (LRU) or update frequency counters (LFU). When cache is full, the evicted entry flashes red and drops off. Uses existing LRU cache algorithm (lru-cache.ts in algorithms). | 9 | 9 | M | Partial (LRU algo exists) |
| Cache Invalidation Timeline | Animated timeline showing the cache invalidation problem. Data changes in DB at t=0. Cache still serves stale data until TTL expires at t=30s. Shows three fix strategies: TTL reduction, event-driven invalidation, pub/sub notification. | 9 | 8 | M | No |
| CDN Edge Cache Visualization | World map view: user in Tokyo, origin server in Virginia. Request hits CDN edge (10ms via existing CDN_EDGE_HIT constant) vs origin (150ms via CROSS_CONTINENT_RTT). Cache miss: 80ms via CDN_EDGE_MISS. Shows cache warming and TTL. | 8 | 9 | L | No |
| Multi-Layer Cache Hierarchy | Canvas showing L1 (in-process) -> L2 (Redis) -> L3 (CDN) -> Origin. Request traverses layers, each with hit/miss probability. User adjusts hit rates with sliders to see total latency. | 8 | 8 | M | No |

### 4.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Cache Hit Ratio Dashboard | Run traffic against a system with/without cache. Real-time dashboard shows hit ratio, latency percentiles, database load. User adjusts cache size and TTL. Uses existing MetricsCollector. | 9 | 7 | M | Partial (metrics collector exists) |
| "Remove the Cache" Chaos | From WhatIfEngine: "remove-cache" scenario. Shows database load spike, latency increase, potential cascade failure. Already partially implemented in what-if-engine.ts. | 9 | 8 | S | Partial (WhatIfEngine has remove-cache) |
| Thundering Herd Demo | Cache key expires. 1000 concurrent requests all miss cache, all hit database simultaneously. Canvas shows database node turning red. Then shows fix: cache stampede protection (lock + queue). Uses existing ChaosEngine "cache" category. | 9 | 9 | M | Partial (chaos engine has cache events) |

### 4.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Add Caching to This Design" | Given a slow architecture (all reads hit DB). User must decide: where to add cache, what strategy, what TTL, what eviction. Simulation validates latency improvement. | 9 | 8 | M | Partial |

### 4.4 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Cache Strategy Advisor | "Given your read/write ratio and consistency requirements, here's the optimal caching strategy." AI analyzes the topology and recommends cache-aside vs write-through with reasoning. | 8 | 7 | M | Partial (design reviewer exists) |

---

## 5. MESSAGE QUEUES

### 5.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Kafka Internals Visualizer | Interactive Kafka cluster on canvas: Topics -> Partitions -> Consumer Groups. User produces messages, watches them land in partitions (by key hash -- uses existing FNV-1a from ConsistentHashRing). Consumer group members rebalance when one dies. Shows offsets advancing. | 10 | 10 | XL | No |
| Delivery Guarantees Comparison | Three tabs: at-most-once, at-least-once, exactly-once. Same producer sends message. Canvas shows: at-most-once (fire-and-forget, message lost on failure), at-least-once (retry, duplicate on consumer), exactly-once (idempotent producer + transactional consumer). | 9 | 9 | L | No |
| Dead Letter Queue Flow | Message fails processing 3 times. Canvas shows retry with exponential backoff (1s, 2s, 4s), then routing to DLQ. DLQ inspector shows failed message with error reason. User can "replay" from DLQ. | 8 | 8 | M | No |
| Producer-Consumer Pattern | Already has producer-consumer.ts in concurrency lib. Wrap with canvas visualization: bounded buffer, producer threads adding, consumer threads removing. Shows blocking behavior when buffer full/empty. | 8 | 7 | M | Partial (algorithm exists) |
| Pub/Sub vs Point-to-Point | Two architectures on split canvas. Pub/sub: one message, multiple subscribers all receive it. Point-to-point: one message, one consumer processes it. User sends messages and sees the routing difference. | 7 | 7 | M | No |

### 5.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Queue Backlog Simulator | Producer rate > consumer rate. Queue depth grows (uses existing queueDepth pressure counter). Dashboard shows consumer lag growing. User can add more consumers or increase processing speed. Shows auto-scaling trigger. | 9 | 8 | M | Partial (pressure counters exist) |
| Consumer Group Rebalance | 3 consumers in a group, 6 partitions (2 each). Kill one consumer. Watch partition reassignment animation. Shows rebalance storm with paused consumption during rebalance. | 8 | 9 | L | No |
| Message Ordering Guarantee | Demonstrate that Kafka guarantees ordering within a partition but not across partitions. User sends numbered messages to different partitions, sees them arrive out of global order but in partition order. | 8 | 8 | M | No |

### 5.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Design the Notification Pipeline" | Already exists as challenge. Enhance: user must choose between Kafka, RabbitMQ, SQS with budget/latency constraints. Simulation validates throughput matches requirement using existing THROUGHPUT constants (KAFKA_MSGS_PER_PARTITION: 1M, RABBITMQ_MSGS: 20K, SQS_STANDARD_MSGS: 3K). | 9 | 8 | M | Partial (challenge exists, need constrained version) |

### 5.4 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Queue Selection Advisor | "Given your throughput requirement of 500K msgs/sec, ordering needs, and budget, use Kafka with 6 partitions because..." Uses existing throughput constants as ground truth. | 8 | 7 | M | Partial |

---

## 6. CONSISTENCY

### 6.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| CAP Theorem Interactive Triangle | Triangle on canvas with C, A, P at vertices. User clicks each side to select two (CP, AP, CA). For each: shows which databases fit (CP: MongoDB, etcd; AP: Cassandra, DynamoDB; CA: traditional RDBMS without network partition). Shows what happens during a network partition for each choice. | 10 | 9 | M | No |
| Vector Clock Simulation (UI) | Already has VectorClockSimulation class. Build the canvas UI: processes as horizontal timelines, events as dots, send/receive as diagonal arrows between timelines. User clicks to trigger events. Highlights concurrent events in yellow. This is the biggest gap -- the engine exists perfectly but has no visualization. | 10 | 10 | L | Partial (VectorClockSimulation class exists, no UI) |
| CRDT Convergence Visualizer (UI) | Already has CRDTSimulation with 4 types. Build the canvas UI: replicas as columns, operations as rows, merge arrows between columns. Shows divergence and convergence. isConverged() check shown as green/red indicator. The engine is production-ready; just needs the visual layer. | 10 | 10 | L | Partial (CRDTSimulation exists, no UI) |
| Quorum Read/Write Visualizer | N=5 replicas on canvas. User sets W=3, R=3 (strong consistency: W+R>N). Writes propagate to W nodes (green), reads check R nodes. User toggles to W=1, R=1 (eventual consistency). Shows stale read scenario. | 9 | 9 | M | No |
| Linearizability vs Serializability | Two timelines: operations from Client A and Client B. Linearizable: respects real-time ordering. Serializable: only respects transaction ordering. Animated examples showing when they differ. | 8 | 8 | L | No |

### 6.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Network Partition Simulator | Cluster of 5 database nodes. User draws a "partition line" splitting them into two groups. Shows split-brain: both sides accept writes, data diverges. Reconnection triggers conflict resolution. Uses existing ChaosEngine "network" category. | 10 | 10 | L | Partial (chaos engine has network events) |
| Consistency Level Playground | Cassandra-style: user picks ONE, QUORUM, ALL for reads and writes. Traffic simulator runs; dashboard shows latency vs consistency tradeoff with actual numbers. Inject node failure and see which consistency levels fail. | 9 | 9 | M | Partial (traffic simulator exists) |

### 6.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "What Consistency Level for This Use Case?" | Shopping cart (AP), bank transfer (CP), user profile (eventual OK), stock trading (linearizable). User selects and justifies. Scored on reasoning. | 8 | 6 | M | No |

### 6.4 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Consistency Advisor | Given user's architecture, AI identifies: "Your payment service uses eventual consistency but needs strong consistency. Your social feed is using strong consistency but could use eventual to improve latency by 10x." | 9 | 8 | M | Partial (design reviewer exists) |

---

## 7. RELIABILITY

### 7.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Circuit Breaker State Machine | Canvas shows 3 states: Closed (green), Open (red), Half-Open (yellow). Animated: requests flow through. After 5 failures, circuit trips open. Requests are rejected instantly. After timeout, half-open: one test request goes through. Success -> closed. Failure -> open again. | 10 | 9 | M | No |
| Retry with Exponential Backoff | Animated timeline: request fails, retry after 1s, fail, retry after 2s, fail, retry after 4s with jitter. Shows: without jitter = thundering herd, with jitter = spread load. Interactive: user controls max retries, base delay, jitter toggle. | 9 | 8 | M | No |
| Bulkhead Pattern Visualizer | Ship hull metaphor on canvas: compartments (thread pools). One compartment floods (dependency slow), others unaffected. Without bulkhead: entire ship sinks. Shows thread pool isolation. | 8 | 9 | M | No |
| Timeout Cascade Demonstration | Service A calls B calls C. C is slow (5s). B waits, A waits. Canvas shows cascading timeouts. Fix: set timeout at each level (C: 2s, B: 3s, A: 5s). Shows how proper timeouts prevent cascade. | 9 | 8 | M | No |
| Failure Modes Explorer | Already has FailureModeExplorer.tsx component. Enhance with more failure modes: byzantine failures, partial failures, gray failures. Each with visual demonstration and recovery strategy. | 7 | 6 | M | Partial (component exists) |

### 7.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Chaos Engineering Lab | Full chaos integration: user selects from 30+ chaos events (from ChaosEngine), injects into running simulation, watches cascade effects via CascadeEngine, reads narrative explanations from NarrativeEngine. This is the killer feature -- all the engines exist; they need a unified UI. | 10 | 10 | L | Partial (all engines exist, need unified UI) |
| SLA Budget Tracker | Running SLA calculator (sla-calculator.ts exists) showing remaining error budget in real-time. Inject failures and watch budget drain. Alert when budget <10%. | 9 | 8 | M | Partial (SLA calculator exists) |

### 7.3 PRACTICE

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Make This System Reliable" | Given architecture with SPOF, no retries, no circuit breakers. User adds reliability patterns. Chaos simulation validates: inject random failures, system must maintain 99.9% availability. | 10 | 9 | L | Partial (chaos + SPOF detection exist) |

### 7.4 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI SPOF Detector | AI analyzes topology for single points of failure. Already partially in design-reviewer.ts. Enhance: show exactly which component's failure would take down the system, and the blast radius. | 9 | 7 | S | Partial (SPOF check exists in reviewer) |

---

## 8. OBSERVABILITY

### 8.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Three Pillars Visualizer | Split view: Logs (structured JSON events streaming), Metrics (Prometheus-style gauges and histograms), Traces (distributed trace waterfall like Jaeger). Same "slow request" shown across all three views to demonstrate correlation. | 9 | 9 | L | No |
| SLA/SLO/SLI Hierarchy | Interactive pyramid: SLI (measurement: p99 latency = 150ms) -> SLO (target: p99 < 200ms for 99.9%) -> SLA (contract: refund if <99.5%). User adjusts each, sees how they relate. Uses existing sla-calculator.ts. | 8 | 7 | M | Partial (SLA calculator exists) |
| Distributed Trace Waterfall | Animated request flowing through 5 services. Each service span appears in a waterfall chart (like Jaeger). Shows where time is spent. User identifies the bottleneck. Uses existing per-node metrics from MetricsCollector.getNodeMetrics(). | 9 | 9 | L | Partial (per-node metrics exist) |

### 8.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Detect the Issue from Metrics" | System is running with a hidden problem (memory leak, slow query, connection leak). User only has metrics dashboard (existing MetricsCollector output). Must identify the problem from metric patterns before SLA breaches. | 9 | 9 | L | Partial (metrics collector exists) |
| Alert Storm Simulator | Multiple chaos events cause cascading alerts. User must triage: which is root cause vs symptom? Uses existing CascadeEngine to generate correlated failures. | 8 | 8 | M | Partial (cascade engine exists) |

### 8.3 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Monitoring Advisor | "Your system has no monitoring on the database connection pool. Add an alert for connectionPoolUsage > 80%." AI scans topology for unmonitored components. Checks against all 35 pressure counters. | 8 | 7 | M | Partial (pressure counters exist) |

---

## 9. ADVANCED PATTERNS

### 9.1 LEARNING

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Event-Driven Architecture Builder | User builds event-driven system on canvas: Event producers -> Event bus (Kafka) -> Event consumers. Shows how adding a new consumer requires zero changes to producers. Contrast with synchronous REST where adding a consumer means changing the producer. | 9 | 8 | M | No |
| CQRS Split Visualization | Single database splits into Command (write) side and Query (read) side. Canvas animates: writes go to write DB, async sync to read-optimized DB (denormalized views). Shows why read latency improves while write path stays clean. | 9 | 9 | M | No |
| Saga Pattern Choreography vs Orchestration | Two canvases side-by-side. Choreography: services emit events, each service listens and reacts. Orchestration: central saga coordinator sends commands. Show failure scenario: one step fails, compensating transactions fire in both approaches. | 10 | 10 | L | No |
| Change Data Capture Pipeline | Database -> CDC connector (Debezium-style) -> Kafka -> Downstream consumers (search index, cache, analytics). Canvas shows: row inserted in DB, CDC captures change, publishes to Kafka, consumers update their stores. | 8 | 8 | M | No |
| Event Sourcing Timeline | Instead of storing current state, store every event. Canvas shows event log (OrderCreated, ItemAdded, ItemRemoved, OrderPlaced). User rebuilds current state by replaying events. Shows CQRS integration where events project into read models. Extends existing event-sourcing.json template. | 9 | 9 | L | Partial (template exists) |

### 9.2 SIMULATION

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Saga Failure Compensation | Running Saga: Book Hotel -> Book Flight -> Charge Payment. Flight booking fails. Watch compensating transactions: Cancel Hotel. Canvas shows rollback cascading backward with animated reversal arrows. | 10 | 10 | L | No |
| CQRS Consistency Lag | Write to command side. Query side is stale for configurable seconds. Traffic simulator shows read latency vs consistency tradeoff. | 8 | 7 | M | Partial |

### 9.3 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Pattern Recommender | "Given your architecture has tightly coupled synchronous services with distributed transactions, consider: Saga pattern for transaction management, CQRS for read/write optimization, Event Sourcing for audit trail." Extends topology-rules.ts. | 9 | 8 | M | Partial (topology rules exist) |

---

## 10. CLASSIC SYSTEM DESIGN PROBLEMS

### 10.1 LEARNING -- Progressive Build Sequences

| System | Build Steps | Impact | WOW | Effort | Exists? |
|--------|------------|--------|-----|--------|---------|
| URL Shortener | Step 1: Single server with hash function. Step 2: Add database. Step 3: Add cache (show latency improvement). Step 4: Add load balancer. Step 5: Add analytics pipeline. Each step is a canvas state the user builds incrementally. Template exists (url-shortener.json) but only as finished product. | 10 | 9 | L | Partial (finished template exists) |
| Chat App | Step 1: HTTP polling. Step 2: WebSocket gateway. Step 3: Message queue for fan-out. Step 4: Read receipts. Step 5: Group chat with presence. Template exists (chat-system.json). | 10 | 9 | L | Partial |
| Social Feed | Step 1: Simple query (pull model). Step 2: Fan-out on write (push model). Step 3: Hybrid for celebrities. Step 4: Ranking algorithm. Template exists (social-feed.json, twitter-fanout.json). | 10 | 10 | L | Partial |
| E-commerce / Payment | Step 1: Product catalog. Step 2: Shopping cart. Step 3: Payment with idempotency. Step 4: Inventory management with distributed locks. Step 5: Order saga. Templates exist (payment-system.json, payment-gateway.json, inventory-system.json). | 10 | 9 | L | Partial |
| Video Streaming | Step 1: Upload pipeline. Step 2: Transcoding workers. Step 3: CDN distribution. Step 4: Adaptive bitrate streaming. Step 5: Recommendation engine. Templates exist (youtube.json, netflix-cdn.json, video-processing.json). | 10 | 9 | L | Partial |
| Ride-Sharing | Step 1: Geospatial index. Step 2: Driver matching. Step 3: Surge pricing. Step 4: Trip state machine. Step 5: ETA estimation. Template exists (uber-dispatch.json, ride-sharing.json). | 10 | 10 | L | Partial |
| Search Engine | Step 1: Web crawler. Step 2: Inverted index. Step 3: Ranking (PageRank concept). Step 4: Auto-complete (trie). Step 5: Distributed search cluster. Templates exist (google-search.json, search-autocomplete.json, web-crawler.json, typeahead.json). | 10 | 9 | XL | Partial |

### 10.2 SIMULATION for Classic Problems

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| "Run Your Design" | User completes any system design challenge, then clicks "Simulate." Traffic flows through their architecture. Shows bottlenecks, failures, latency. This is the ultimate validation loop. Requires wiring existing SimulationOrchestrator to user-built diagrams. | 10 | 10 | L | Partial (orchestrator exists, not wired to challenges) |
| Side-by-Side Architecture Comparison | User's solution on left, reference solution on right. Same traffic hits both. Metrics compared. Uses existing architecture-diff.ts. | 9 | 9 | L | Partial (diff engine exists) |

### 10.3 PRACTICE -- 45-Minute Mock Interview

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Timed Interview Mode | Existing interview store has timer, challenge, hints, scoring. Enhance: structured phases (5 min requirements, 5 min API, 10 min high-level, 10 min deep dive, 5 min scaling, 5 min reliability, 5 min wrap-up). Timer shows current phase. AI asks phase-appropriate follow-ups via socratic-tutor.ts. | 10 | 10 | L | Partial (timer + scoring + tutor exist) |
| Interviewer Follow-Up Engine | After user builds initial design, AI asks: "What happens if this database goes down?" "How do you handle a celebrity with 10M followers?" "Walk me through the write path." Uses existing socratic-tutor.ts with system-design-specific prompts. | 10 | 10 | M | Partial (socratic tutor exists) |

### 10.4 ASSESSMENT -- 8-Dimension Scoring

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| Expanded Scoring Rubric | Current: 6 dimensions. Add: Cost Awareness (budget constraints, cost-optimal choices) and Communication (structured approach, time management). Score display component already exists. | 8 | 6 | M | Partial (6-dimension rubric + ScoreDisplay.tsx exist) |
| "What's Missing?" Quiz | Show a system design with intentional gaps (no cache, no monitoring, single database). User must identify all missing components within 2 minutes. Scored by completeness. | 9 | 8 | M | No |

### 10.5 REVIEW

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| System Design Flashcards | FSRS cards per classic problem: "URL shortener: how to generate unique IDs?" / "Chat app: WebSocket vs long polling tradeoff?" / "Feed: fan-out on write vs read?" | 9 | 6 | S | Partial (FSRS exists) |
| Back-of-Envelope Drill | Daily micro-drill: "How much storage does Twitter need per day?" Uses REAL_WORLD constants as answer key. Timer. Tracks accuracy over time. | 9 | 8 | M | Partial (constants exist, need drill UI) |

### 10.6 AI

| Feature | Description | Impact | WOW | Effort | Exists? |
|---------|-------------|--------|-----|--------|---------|
| AI Architecture from Description | Already exists: architecture-generator.ts with 8 reference architectures + Claude enhancement. | 9 | 9 | - | Yes |
| AI Design Review | Already exists: design-reviewer.ts with SPOF, scaling, cost analysis. | 9 | 8 | - | Yes |
| AI Interview Scorer | Already exists: interview-scorer.ts with 6-dimension scoring. | 9 | 8 | - | Yes |
| AI Follow-Up Questions | Already exists: socratic-tutor.ts. Needs HLD-specific question bank. | 9 | 9 | S | Partial |
| AI Cost Estimator | Already exists: cost-model.ts with ~75 component types. Needs UI integration. | 9 | 8 | S | Partial |

---

## CONSOLIDATED PRIORITY MATRIX

### TIER 1: CRITICAL (Ship first -- highest impact, uses existing engines)

These features represent the biggest gap: powerful simulation engines exist in the codebase but have no UI.

| # | Feature | Impact | WOW | Effort | Why Critical |
|---|---------|--------|-----|--------|-------------|
| 1 | Chaos Engineering Lab (unified UI for ChaosEngine + CascadeEngine + NarrativeEngine) | 10 | 10 | L | Three engines exist in lib/simulation/ with zero UI integration. This is the platform's USP. |
| 2 | Vector Clock Visualization | 10 | 10 | L | VectorClockSimulation is production-ready, needs canvas UI only. No competitor has this. |
| 3 | CRDT Convergence Visualizer | 10 | 10 | L | CRDTSimulation with 4 types is complete. Canvas rendering is the only missing piece. |
| 4 | Consistent Hash Ring Canvas | 9 | 9 | M | ConsistentHashRing with FNV-1a, virtual nodes, redistribution tracking -- all done. Needs visualization. |
| 5 | "What Breaks at 10x?" Button | 10 | 10 | M | WhatIfEngine exists. Wire multiplier to canvas with failure cascade rendering. |
| 6 | Progressive Build Sequences for Classic Problems | 10 | 9 | L per problem | 55 finished templates exist but zero step-by-step build sequences. Transform templates into 5-7 step learning paths. |
| 7 | "Run Your Design" Simulation | 10 | 10 | L | SimulationOrchestrator exists but isn't wired to user-built challenge designs. |

### TIER 2: HIGH (Ship soon -- strong differentiation)

| # | Feature | Impact | WOW | Effort |
|---|---------|--------|-----|--------|
| 8 | Cache Strategy Visualizer (4 strategies animated) | 10 | 9 | M |
| 9 | Circuit Breaker State Machine | 10 | 9 | M |
| 10 | CAP Theorem Interactive Triangle | 10 | 9 | M |
| 11 | Kafka Internals Visualizer | 10 | 10 | XL |
| 12 | Saga Pattern Choreography vs Orchestration | 10 | 10 | L |
| 13 | Index Visualizer (B-tree on canvas) | 10 | 10 | L |
| 14 | Timed 45-Min Mock Interview with Phases | 10 | 10 | L |
| 15 | Quorum Read/Write Visualizer | 9 | 9 | M |
| 16 | SQL vs NoSQL Decision Tree | 9 | 8 | M |
| 17 | Rate Limiting Algorithm Lab | 9 | 8 | M |

### TIER 3: MEDIUM (Nice to have -- good enhancement)

| # | Feature | Impact | WOW | Effort |
|---|---------|--------|-----|--------|
| 18 | REST/gRPC/GraphQL Side-by-Side | 9 | 9 | L |
| 19 | LRU/LFU Eviction Playground | 9 | 9 | M |
| 20 | Normalization/Denormalization Lab | 9 | 9 | L |
| 21 | CQRS Split Visualization | 9 | 9 | M |
| 22 | Three Pillars of Observability | 9 | 9 | L |
| 23 | Back-of-Envelope Drill (daily) | 9 | 8 | M |
| 24 | FSRS Flashcards for all HLD concepts | 8 | 5 | S per topic |
| 25 | Capacity Estimation Calculator UI | 9 | 7 | S |

### TIER 4: FUTURE (Low effort wins + experimental)

| # | Feature | Impact | WOW | Effort |
|---|---------|--------|-----|--------|
| 26 | CDN World Map Visualization | 8 | 9 | L |
| 27 | Retry with Exponential Backoff animation | 9 | 8 | M |
| 28 | Event Sourcing Timeline | 9 | 9 | L |
| 29 | Distributed Trace Waterfall | 9 | 9 | L |
| 30 | AI Consistency Advisor | 9 | 8 | M |

---

## THE ONE BIG WIN

If you build only one thing: **Wire the existing simulation engines (ChaosEngine + CascadeEngine + NarrativeEngine + WhatIfEngine + MetricsCollector) into a unified "Simulate" button on every architecture template and every user-built design.** The engines are production-quality (35 pressure counters, 30+ chaos events, 20 narrative templates, cascade propagation, cost modeling). They just have no UI. This alone would make Architex the only system design learning tool where you can *break* your design and watch it fail, which is how engineers actually develop intuition. Every competitor (Excalidraw, PaperDraw, SystemDesignFigma) shows static diagrams. Architex can show living, breakable systems -- the code is already written.

**Key files that contain the most leverage:**
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/chaos-engine.ts` -- 30+ chaos events, 35 pressure counters, amplification factors
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/cascade-engine.ts` -- failure propagation across topology
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/narrative-engine.ts` -- 20 causal templates for human-readable explanations
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/what-if-engine.ts` -- scenario comparison with delta metrics
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/metrics-collector.ts` -- sliding window throughput, latency percentiles
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/distributed/vector-clock.ts` -- complete, tested, no UI
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/distributed/crdt.ts` -- 4 CRDT types with simulation wrapper, no UI
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/distributed/consistent-hash.ts` -- ring with virtual nodes, redistribution tracking, no UI
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/cost-model.ts` -- ~75 component types, live cost tracking
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/latency-numbers.ts` -- 25 real-world latency benchmarks
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/throughput-numbers.ts` -- 30 throughput benchmarks
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/system-numbers.ts` -- real-world scale numbers + AWS cost estimates