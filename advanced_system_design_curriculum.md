# The Ultimate Advanced System Design Curriculum
## Comprehensive Coverage of Emerging & Advanced Topics for FAANG+ Interviews

---

# TABLE OF CONTENTS

1. [Microservices Architecture Patterns](#1-microservices-architecture-patterns)
2. [Cloud-Native Design Patterns](#2-cloud-native-design-patterns)
3. [Stream Processing Systems](#3-stream-processing-systems)
4. [Search Systems](#4-search-systems)
5. [ML System Design](#5-ml-system-design)
6. [Real-Time Systems Design](#6-real-time-systems-design)
7. [Security Design](#7-security-design)
8. [Observability](#8-observability)
9. [Infrastructure Design](#9-infrastructure-design)
10. [Blockchain/Web3 System Design](#10-blockchainweb3-system-design)
11. [Mobile System Design](#11-mobile-system-design)
12. [Data Engineering Design](#12-data-engineering-design)
13. [DevOps and CI/CD System Design](#13-devops-and-cicd-system-design)
14. [Edge Computing and IoT System Design](#14-edge-computing-and-iot-system-design)
15. [Payment Systems Design](#15-payment-systems-design)
16. [Gaming System Design](#16-gaming-system-design)
17. [Cross-Cutting Fundamentals](#17-cross-cutting-fundamentals)
18. [Resources & References](#18-resources--references)

---

# 1. MICROSERVICES ARCHITECTURE PATTERNS

## 1.1 Saga Pattern
**Problem:** Managing distributed transactions across multiple microservices without a shared database.

**Two Coordination Approaches:**
- **Choreography-Based Saga:** Each service publishes domain events that trigger the next step. No central coordinator. Works well for simple flows (3-5 steps). Risk: Hard to debug, implicit ordering.
- **Orchestration-Based Saga:** A central saga orchestrator tells each participant what to do. Easier to understand and debug. Risk: Orchestrator becomes a single point of failure if not designed carefully.

**Compensating Transactions:** Every forward action has a corresponding "undo" action. If Step 3 fails, compensate Steps 2 and 1 in reverse order.

**Key Design Decisions:**
- Idempotency: Every saga step must be idempotent (safe to retry)
- Isolation: Sagas lack ACID isolation; use semantic locks or countermeasures
- Timeout handling: Each step needs a timeout with compensation on expiry
- Dead letter queues: For steps that fail repeatedly after retries

**Real-World Example (Uber):** Ride booking saga: Reserve driver -> Charge payment -> Confirm ride. If payment fails, release driver reservation.

**Interview Tip:** Always discuss the failure modes. "What happens if Step 3 fails?" is the most common follow-up.

---

## 1.2 CQRS (Command Query Responsibility Segregation)
**Core Idea:** Separate the write model (commands) from the read model (queries). Different data models optimized for their specific purpose.

**Architecture:**
```
Writes -> Command Model -> Event Store -> Event Bus -> Read Model -> Queries
```

**When to Use:**
- Read/write ratio is heavily skewed (e.g., 1000:1 reads to writes)
- Read and write models have fundamentally different shapes
- Need different scaling strategies for reads vs. writes
- Complex domain logic on the write side, simple projections on the read side

**When NOT to Use:**
- Simple CRUD applications
- Low traffic systems where the added complexity isn't justified
- Teams unfamiliar with event-driven patterns

**Implementation Patterns:**
- **Separate databases:** Write DB (normalized, optimized for consistency) + Read DB (denormalized, optimized for queries)
- **Eventual consistency:** Read model is updated asynchronously; must handle stale reads
- **Materialized views:** Read model projections rebuilt from events

---

## 1.3 Event Sourcing
**Core Idea:** Store every state change as an immutable event rather than storing current state. The current state is derived by replaying events.

**Key Components:**
- **Event Store:** Append-only log of events (immutable)
- **Projections:** Derived read models built by processing events
- **Snapshots:** Periodic state snapshots to avoid replaying entire event history

**Benefits:**
- Complete audit trail of every change
- Temporal queries ("what was the state at time T?")
- Event replay for debugging and testing
- Natural fit for CQRS and domain-driven design

**Challenges:**
- Event schema evolution (versioning events is hard)
- Eventual consistency in projections
- Storage growth (mitigated by snapshots and compaction)
- Not suitable for all domains (simple CRUD apps)

**Event Schema Evolution Strategies:**
- Upcasting: Transform old events to new format during read
- Versioned events: Include version number, handle each version
- Event transformers: Pipeline that converts old formats

**Real-World Example (Banking):** Instead of storing "balance = $500", store events: "Deposited $1000", "Withdrew $300", "Deposited $100", "Withdrew $300". Current balance computed by replay.

---

## 1.4 Service Mesh (Istio/Envoy)
**Problem:** Managing service-to-service communication at scale: routing, load balancing, security, observability.

**Architecture:**
- **Data Plane:** Sidecar proxies (Envoy) deployed alongside every service, intercepting all inbound/outbound traffic
- **Control Plane:** Istio manages proxy configuration, policies, and certificates

**Key Capabilities:**
- **Traffic Management:** Canary deployments, A/B testing, circuit breaking, retries, timeouts, fault injection
- **Security:** Mutual TLS (mTLS) between all services, RBAC, JWT validation
- **Observability:** Distributed tracing, metrics collection, access logging -- all without application code changes
- **Resilience:** Circuit breakers, rate limiting, outlier detection

**Sidecar vs. Ambient Mesh (2025 Evolution):**
- **Sidecar mode:** Every pod gets an Envoy proxy (~0.5 CPU core, ~50MB RAM per sidecar)
- **Ambient mode (new):** Proxies moved to per-node ztunnel agents + optional L7 waypoint proxies. Reduces overhead by 60-90% for L4 traffic.

**Interview Angle:** Service mesh adds operational complexity. Discuss when it's justified (50+ services, strict mTLS requirements, complex traffic routing) vs. when it's overkill.

---

## 1.5 Circuit Breaker Pattern
**Problem:** Prevent cascading failures when a downstream service is slow or unavailable.

**Three States:**
1. **Closed (normal):** Requests flow through. Failures are counted.
2. **Open (tripped):** After failure threshold is reached, all requests are immediately rejected with a fallback response. No calls to downstream.
3. **Half-Open (testing):** After a timeout, allow a limited number of test requests through. If they succeed, close the circuit. If they fail, re-open.

**Configuration Parameters:**
- Failure threshold (e.g., 5 failures in 10 seconds)
- Timeout duration (e.g., 30 seconds before trying half-open)
- Success threshold in half-open (e.g., 3 consecutive successes to close)
- Failure types to track (5xx errors, timeouts, connection refused)

**Complementary Patterns:**
- **Bulkhead:** Isolate resources per downstream (separate thread pools/connection pools)
- **Retry with backoff:** Exponential backoff + jitter before tripping circuit
- **Fallback:** Return cached data, default response, or degraded functionality
- **Timeout:** Always set timeouts; never wait indefinitely

**Libraries:** Resilience4j (Java), Polly (.NET), Hystrix (deprecated but influential)

---

## 1.6 Additional Microservices Patterns

### Strangler Fig Pattern
Incrementally migrate from monolith to microservices by routing requests to new services while the old system still handles remaining functionality. Over time, the monolith shrinks until it can be decommissioned.

### Sidecar Pattern
Deploy supporting components (logging, monitoring, config, networking) as a separate process alongside the main application. Used heavily in Kubernetes and service meshes.

### Ambassador Pattern
A helper service that sends network requests on behalf of the consumer. Offloads client-side connectivity tasks (retry, circuit breaking, routing) to an ambassador proxy.

### Anti-Corruption Layer
Prevents a new system from being corrupted by the domain model of a legacy system it integrates with. Translates between the two models.

### Backend for Frontend (BFF)
Create separate backend services for each frontend (web, mobile, IoT). Each BFF is optimized for its client's needs rather than forcing a one-size-fits-all API.

### API Composition
A service that queries multiple microservices and combines the results. Used for implementing queries that span multiple services.

### Transactional Outbox
Write events to an "outbox" table in the same database transaction as the business data, then a separate process publishes events from the outbox. Guarantees at-least-once event publishing without distributed transactions.

---

# 2. CLOUD-NATIVE DESIGN PATTERNS

## 2.1 Serverless Architecture Patterns

### Function-as-a-Service (FaaS)
- **AWS Lambda / Azure Functions / GCP Cloud Functions**
- Event-driven, auto-scaling to zero, pay-per-invocation
- Cold start latency: 100ms-10s depending on runtime and provisioned concurrency
- Max execution time limits (Lambda: 15 minutes)

### Key Patterns:
- **Fan-out/Fan-in:** Single event triggers multiple parallel functions, results aggregated
- **Function Chaining:** Step Functions / Durable Functions for orchestrating multi-step workflows
- **Event-driven Processing:** S3 upload triggers Lambda, processes image, writes to DynamoDB, publishes to SNS

### Serverless Anti-Patterns:
- Long-running processes (use containers instead)
- Stateful processing (functions are ephemeral)
- Low-latency requirements where cold starts are unacceptable
- Functions calling functions synchronously (use queues instead)

---

## 2.2 AWS Architecture Patterns

### Three-Tier Web Architecture
```
Route 53 (DNS) -> CloudFront (CDN) -> ALB -> EC2/ECS/EKS (App Tier) -> RDS/Aurora (Data Tier)
                                                                     -> ElastiCache (Caching)
                                                                     -> S3 (Object Storage)
```

### Event-Driven Architecture
```
API Gateway -> Lambda -> SQS/SNS -> Lambda -> DynamoDB
EventBridge (event bus) -> Step Functions (orchestration) -> Multiple services
Kinesis Data Streams -> Lambda/KDA -> S3/Redshift
```

### Key AWS Services for System Design:
| Category | Services |
|----------|----------|
| Compute | EC2, ECS, EKS, Lambda, Fargate |
| Database | RDS, Aurora, DynamoDB, ElastiCache, Neptune, Keyspaces |
| Storage | S3, EBS, EFS, FSx |
| Messaging | SQS, SNS, EventBridge, Kinesis, MSK (Managed Kafka) |
| Networking | VPC, ALB/NLB, CloudFront, Route 53, API Gateway |
| Analytics | Redshift, Athena, EMR, Glue, QuickSight |
| ML/AI | SageMaker, Bedrock, Comprehend, Rekognition |

---

## 2.3 Multi-Region Architecture

**Active-Active:**
- Both regions serve traffic simultaneously
- Requires global load balancing (Route 53 latency-based routing)
- Data replication: DynamoDB Global Tables, Aurora Global Database
- Conflict resolution for concurrent writes

**Active-Passive:**
- Secondary region on standby
- Lower cost but higher RTO (Recovery Time Objective)
- Automated failover with health checks

**Design Considerations:**
- Data consistency across regions (eventual vs. strong)
- DNS TTL and failover propagation time
- Session management (sticky sessions vs. stateless)
- Cost of cross-region data transfer

---

## 2.4 Cloud-Native 12-Factor App Principles
1. **Codebase:** One codebase per app, many deploys
2. **Dependencies:** Explicitly declare and isolate dependencies
3. **Config:** Store config in environment variables
4. **Backing Services:** Treat databases, caches, queues as attached resources
5. **Build, Release, Run:** Strictly separate build and run stages
6. **Processes:** Execute as stateless processes
7. **Port Binding:** Export services via port binding
8. **Concurrency:** Scale out via the process model
9. **Disposability:** Fast startup and graceful shutdown
10. **Dev/Prod Parity:** Keep development, staging, and production similar
11. **Logs:** Treat logs as event streams
12. **Admin Processes:** Run admin/management tasks as one-off processes

---

# 3. STREAM PROCESSING SYSTEMS

## 3.1 Apache Kafka Deep Dive

### Architecture
```
Producers -> Kafka Brokers (Topics/Partitions) -> Consumers (Consumer Groups)
                     |
              ZooKeeper/KRaft (metadata)
```

### Core Concepts:
- **Topics:** Logical channels for messages
- **Partitions:** Parallel units within a topic (ordering guaranteed only within a partition)
- **Consumer Groups:** Multiple consumers sharing work; each partition consumed by exactly one consumer in a group
- **Offsets:** Position tracking per consumer per partition
- **Replication Factor:** Number of copies of each partition across brokers

### Kafka Guarantees:
- **At-most-once:** Read message, commit offset, then process. If processing fails, message lost.
- **At-least-once:** Process message, then commit offset. If commit fails, message reprocessed. (Most common)
- **Exactly-once:** Idempotent producers + transactional consumers. Available since Kafka 0.11.

### Key Design Patterns:
- **Log Compaction:** Retains only the latest value for each key. Perfect for changelogs and state stores.
- **Change Data Capture (CDC):** Debezium captures database changes and publishes to Kafka topics
- **Event Streaming:** Kafka as the central nervous system connecting all services

### KRaft (2024+):
Kafka removed ZooKeeper dependency. Metadata managed by Kafka's own Raft-based consensus protocol. Simplified operations and improved scaling to millions of partitions.

---

## 3.2 Stream Processing Engines Compared

| Feature | Kafka Streams | Apache Flink | Spark Structured Streaming |
|---------|--------------|--------------|---------------------------|
| Processing Model | True streaming | True streaming | Micro-batching (~100ms) |
| Latency | Sub-millisecond | Sub-millisecond | 100ms+ |
| State Management | RocksDB (local) | RocksDB/Heap (checkpointed) | In-memory + disk |
| Deployment | Embedded in app (no cluster) | Dedicated cluster | Spark cluster |
| Exactly-Once | Yes (with Kafka) | Yes (end-to-end) | Yes |
| Windowing | Tumbling, Hopping, Session, Sliding | All + custom | Tumbling, Sliding |
| Best For | Kafka-native lightweight | Complex event processing | Batch + streaming unified |

### Window Types:
- **Tumbling Window:** Fixed-size, non-overlapping (e.g., every 5 minutes)
- **Hopping/Sliding Window:** Fixed-size, overlapping (e.g., 5-min window every 1 minute)
- **Session Window:** Dynamic, gap-based (e.g., new session after 30 min inactivity)
- **Global Window:** All events in one window (need custom triggers)

### Watermarks and Late Data:
- **Watermark:** Heuristic estimating progress of event time. "All events with timestamp <= watermark have arrived."
- **Allowed lateness:** Grace period after watermark to accept late events
- **Side outputs:** Route late events to a separate stream for special handling

---

## 3.3 Real-World Stream Processing Architectures

### Netflix:
- Kafka as the event backbone for all streaming data
- Flink for real-time personalization and anomaly detection
- Processes billions of events/day for play-start events, error events, UI interactions

### Uber:
- Kafka + Flink for real-time pricing, fraud detection, ETA computation
- Apache Pinot for real-time analytics on streaming data
- Custom stream processing for geospatial data (driver locations)

### LinkedIn:
- Kafka was born at LinkedIn
- Real-time activity streams, metrics, data pipeline
- Samza (LinkedIn's stream processor) integrated with Kafka

---

# 4. SEARCH SYSTEMS

## 4.1 Inverted Index
**Core Data Structure:** Maps terms to the documents containing them.

```
"distributed" -> [doc1, doc5, doc12, doc47]
"systems"     -> [doc1, doc3, doc5, doc12]
"design"      -> [doc1, doc12, doc20, doc47]
```

**Query "distributed systems":** Intersect posting lists -> [doc1, doc5, doc12]

### Positional Index:
Stores positions within documents for phrase queries:
```
"distributed" -> [doc1: {3, 45}, doc5: {12}, doc12: {1, 78}]
```

### Index Construction:
1. **Tokenization:** Break text into terms
2. **Normalization:** Lowercase, stemming (running -> run), lemmatization
3. **Stop word removal:** Remove "the", "is", "at" (controversial -- modern systems often keep them)
4. **Inverted index building:** Map terms -> posting lists with positions and metadata

---

## 4.2 Elasticsearch Architecture

### Cluster Architecture:
- **Nodes:** Master (cluster state), Data (store shards), Coordinating (route queries), Ingest (preprocessing)
- **Index:** Logical namespace mapped to one or more shards
- **Shards:** Lucene index instances. Primary shards + replica shards for fault tolerance.
- **Segments:** Immutable files within a shard. New data goes to in-memory buffer, periodically flushed to segments.

### Search Pipeline:
```
Query -> Coordinating Node -> Scatter to all shards -> Each shard searches locally -> 
Gather results -> Merge + re-rank -> Return top-K
```

### Query Types:
- **Term Query:** Exact match on a keyword field
- **Match Query:** Full-text search with analysis (tokenize, stem, score)
- **Bool Query:** Combine multiple queries with must/should/must_not/filter
- **Fuzzy Query:** Approximate matching (edit distance)
- **Aggregations:** Bucket, metric, and pipeline aggregations for analytics

---

## 4.3 Ranking Algorithms

### BM25 (Best Match 25):
The default ranking algorithm in Elasticsearch and most modern search systems.
- Improvement over TF-IDF with term frequency saturation and document length normalization
- Parameters: k1 (term frequency saturation, default 1.2), b (document length normalization, default 0.75)

### Two-Stage Ranking:
1. **Stage 1 - Retrieval:** BM25 or vector similarity retrieves top-1000 candidates in ~10ms
2. **Stage 2 - Re-ranking:** ML model (BERT, cross-encoder) re-ranks top-100 in ~50ms

### Learning to Rank (LTR):
Train ML models on click-through data, user engagement signals:
- Features: BM25 score, document freshness, click rate, dwell time, personalization signals
- Models: Gradient boosted trees (XGBoost/LambdaMART) or neural models

### Hybrid Search (2025 Trend):
Combine keyword search (BM25) with vector similarity (embeddings) for best results:
- Reciprocal Rank Fusion (RRF): Merge ranked lists from different retrievers
- Weighted scoring: alpha * BM25_score + (1-alpha) * vector_score

---

## 4.4 Search System Design Considerations

**Indexing Performance:**
- Near-real-time indexing: ~1 second delay between write and searchable
- Bulk indexing for initial data load
- Index aliases for zero-downtime reindexing

**Query Performance:**
- Caching: Filter cache, query cache, field data cache
- Routing: Direct queries to specific shards using custom routing
- Scroll/Search-after for deep pagination

**Scalability:**
- Horizontal scaling by adding shards (but shard count fixed at index creation in older versions)
- Cross-cluster search for very large deployments
- Index lifecycle management: Hot-warm-cold-frozen architecture

---

# 5. ML SYSTEM DESIGN

## 5.1 Recommendation Systems

### Approaches:

**Collaborative Filtering:**
- **User-based:** Find similar users, recommend what they liked
- **Item-based:** Find similar items to what user already liked
- **Matrix Factorization:** SVD, ALS to decompose user-item interaction matrix
- **Cold start problem:** New users/items have no interaction history

**Content-Based Filtering:**
- Use item features (genre, description, attributes) to find similar items
- No cold start for new items (if features available)
- Limited serendipity (recommends similar to what you already know)

**Deep Learning Approaches:**
- **Two-tower models:** Separate user and item embeddings, dot product for scoring
- **Wide & Deep (Google):** Wide component for memorization + deep component for generalization
- **Sequence models:** Transformers on user action sequences (like SASRec, BERT4Rec)
- **Graph Neural Networks:** Model user-item interactions as a graph

### Production Architecture (Netflix-Style):
```
Stage 1: Candidate Generation (retrieve ~1000 candidates from 100K+ items)
  - Multiple generators in parallel: collaborative filtering, content-based, trending, etc.
Stage 2: Scoring/Ranking (ML model scores candidates)
  - Features from feature store: user history, item metadata, context, interaction data
Stage 3: Re-ranking (business rules, diversity, freshness)
  - Dedup, content policy, diversity injection
Stage 4: Serving (personalized results to user)
```

---

## 5.2 Feature Stores

**Problem:** Training-serving skew (features computed differently during training vs. inference).

**Architecture:**
```
Data Sources -> Feature Engineering -> Feature Store
                                          |
                                    ------+------
                                    |           |
                              Offline Store  Online Store
                              (training)     (serving)
                              (S3/BigQuery)  (Redis/DynamoDB)
```

**Key Requirements:**
- **Online serving:** Low-latency (<10ms) feature retrieval for real-time inference
- **Offline storage:** Batch access for training data generation
- **Point-in-time correctness:** Prevent future data leaking into historical training sets
- **Feature sharing:** Teams can discover and reuse features
- **Monitoring:** Track feature drift, freshness SLAs, data quality

**Tools:** Feast (open-source), Tecton, Hopsworks, Vertex AI Feature Store, SageMaker Feature Store

---

## 5.3 ML Pipelines

### End-to-End Pipeline:
```
Data Collection -> Data Validation -> Feature Engineering -> Model Training -> 
Model Evaluation -> Model Registry -> Model Serving -> Monitoring -> Feedback Loop
```

### MLOps Maturity Levels:
- **Level 0:** Manual process (Jupyter notebooks, manual deployment)
- **Level 1:** ML pipeline automation (automated training, manual deployment)
- **Level 2:** CI/CD pipeline automation (automated training and deployment, A/B testing)
- **Level 3:** Full automation with monitoring, auto-retraining, and drift detection

### Key Tools:
- **Orchestration:** Airflow, Kubeflow Pipelines, Prefect, Dagster
- **Experiment Tracking:** MLflow, Weights & Biases, Neptune
- **Model Registry:** MLflow Model Registry, Vertex AI Model Registry
- **Data Validation:** Great Expectations, TFX Data Validation

---

## 5.4 Model Serving

### Serving Patterns:
- **Online (real-time):** Single prediction per request, <100ms latency. gRPC/REST API.
- **Batch:** Score large datasets periodically. Spark/MapReduce.
- **Streaming:** Score events as they arrive. Flink + embedded model.
- **Edge:** Deploy to mobile/IoT devices. TensorFlow Lite, ONNX Runtime, Core ML.

### Model Optimization:
- **Quantization:** Reduce precision (FP32 -> INT8). 2-4x speedup with minimal accuracy loss.
- **Pruning:** Remove unnecessary weights. 50-90% sparsity possible.
- **Distillation:** Train smaller "student" model to mimic larger "teacher" model.
- **ONNX:** Universal model format for cross-framework deployment.

### Serving Infrastructure:
- **NVIDIA Triton:** Multi-framework, GPU-optimized serving
- **TF Serving / TorchServe:** Framework-specific serving
- **vLLM:** Optimized LLM serving with PagedAttention (2-4x throughput improvement)
- **Ray Serve:** Scalable model serving with autoscaling

---

## 5.5 LLM System Design (2025-2026 Emerging)

### GPU Inference Optimization:
- **Continuous Batching:** Process new requests as tokens finish, not waiting for full sequences
- **KV Cache Paging (PagedAttention):** Treat GPU memory like virtual memory to prevent fragmentation. 2-4x more concurrent users on same hardware.
- **Prefill vs. Decode:** Prefill is compute-bound (processes prompt in parallel), decode is memory-bound (one token at a time).
- **Speculative Decoding:** Small "draft" model generates candidate tokens, large model verifies in one forward pass.

### RAG (Retrieval-Augmented Generation) Architecture:
```
User Query -> Embedding Model -> Vector Database (similarity search) -> Top-K documents
                                                                            |
User Query + Retrieved Context -> LLM -> Response
```

**Key Design Decisions:**
- Chunking strategy (fixed size vs. semantic chunking)
- Embedding model selection (OpenAI, Cohere, open-source)
- Vector database (Pinecone, Weaviate, Qdrant, Milvus, FAISS)
- Hybrid search (BM25 + vector for best recall)
- Reranking retrieved documents before passing to LLM

### Vector Database Comparison:
| Database | Type | Best For |
|----------|------|----------|
| Pinecone | Managed | Easiest to start, serverless |
| Weaviate | Self-hosted/Cloud | Hybrid search, GraphQL API |
| Qdrant | Self-hosted/Cloud | High performance, filtering |
| Milvus | Self-hosted | Enterprise scale, GPU support |
| FAISS | Library | Custom solutions, maximum control |
| Chroma | Library | Prototyping, lightweight |

---

# 6. REAL-TIME SYSTEMS DESIGN

## 6.1 Communication Protocols Compared

| Protocol | Direction | Connection | Latency | Use Case |
|----------|-----------|------------|---------|----------|
| Short Polling | Client->Server | New connection each time | High | Simple dashboards |
| Long Polling | Client->Server | Held open until data | Medium | Chat (fallback) |
| SSE | Server->Client | Persistent HTTP | Low | Live feeds, notifications |
| WebSockets | Bidirectional | Persistent TCP | Lowest | Chat, gaming, collaboration |
| WebRTC | Peer-to-Peer | Peer connections | Ultra-low | Video/audio, screen sharing |
| WebTransport | Bidirectional | HTTP/3 (QUIC) | Very low | Next-gen real-time (emerging) |

### WebSocket Deep Dive:
- Upgrade from HTTP via handshake (101 Switching Protocols)
- Full-duplex over single TCP connection
- Binary and text frame support
- Ping/pong for keepalive
- Scaling challenge: Each connection is stateful, needs sticky sessions or connection state management

### SSE (Server-Sent Events):
- Built into browsers via EventSource API
- Auto-reconnect with Last-Event-ID
- Text-only (no binary)
- Unidirectional (server to client only)
- Works through HTTP/2 multiplexing for efficiency
- Simpler infrastructure than WebSockets

---

## 6.2 Real-Time Collaboration (Google Docs Style)

### Conflict Resolution Approaches:

**Operational Transformation (OT):**
- Used by Google Docs
- Transform operations against concurrent operations to maintain consistency
- Server is the source of truth; transforms operations to resolve conflicts
- Complex implementation; O(n^2) worst case for transform functions

**Conflict-free Replicated Data Types (CRDTs):**
- Used by Figma, Apple (for some features)
- Data structures that can be merged without conflicts by design
- No central server required for conflict resolution
- Types: G-Counter, PN-Counter, LWW-Register, OR-Set, RGA (for text)
- Trade-off: Higher memory usage, limited operation types

**Comparison:**
| Aspect | OT | CRDTs |
|--------|-----|-------|
| Central server | Required | Optional |
| Complexity | Transform functions | Data structure design |
| Latency | Higher (server roundtrip) | Lower (local-first) |
| Memory | Lower | Higher (metadata) |
| Used by | Google Docs | Figma, Yjs |

---

## 6.3 Presence Systems

**Design for showing "user X is online/typing/viewing":**
- Heartbeat mechanism: Client sends heartbeat every N seconds
- Presence fan-out: Publish presence changes to subscribers
- Scale challenge: N users * M friends = N*M presence updates
- Optimization: Only notify if UI is visible, batch presence updates, use presence channels

---

## 6.4 Notification Systems

### Push Notification Architecture:
```
Event Source -> Notification Service -> Priority Queue -> Delivery Service
                     |                                        |
              Template Engine                    ------+------+------
              User Preferences                  |     |      |     |
              Rate Limiting                   APNS  FCM   Email  SMS
                                            (iOS) (Android)
```

### Design Considerations:
- Deduplication (idempotency keys)
- Rate limiting per user per channel
- Priority levels (urgent vs. marketing)
- Retry with exponential backoff per channel
- Analytics: delivery rate, open rate, click-through rate
- User preference management (opt-in/out per channel, quiet hours)

---

# 7. SECURITY DESIGN

## 7.1 Authentication & Authorization

### OAuth 2.0 Flows:
- **Authorization Code + PKCE:** For public clients (SPAs, mobile apps). Most recommended flow.
- **Client Credentials:** Service-to-service authentication (no user involved)
- **Device Authorization:** For IoT/TV devices with limited input capabilities
- **OAuth 2.1 (2025):** Simplifies spec, mandates PKCE, removes implicit flow

### JWT (JSON Web Tokens):
**Structure:** Header.Payload.Signature (Base64 encoded)

**Signed (JWS):**
- Header: algorithm, type
- Payload: claims (sub, iat, exp, custom claims)
- Signature: HMAC-SHA256 or RSA/ECDSA

**Encrypted (JWE):**
- Five parts: Header, Encrypted Key, IV, Ciphertext, Authentication Tag
- Use when payload contains sensitive data

**Best Practices:**
- Short expiration (15 minutes for access tokens)
- Refresh tokens with rotation (invalidate old refresh token on use)
- Never store JWTs in localStorage (use httpOnly cookies or in-memory)
- Validate signature, expiration, issuer, audience on every request
- Use asymmetric keys (RS256/ES256) for distributed verification
- Keep payload small (don't stuff entire user profile)

### Session vs. Token-Based Auth:
| Aspect | Session-Based | Token-Based (JWT) |
|--------|--------------|-------------------|
| Storage | Server-side | Client-side |
| Scalability | Requires shared session store | Stateless, scales easily |
| Revocation | Easy (delete session) | Hard (need blocklist) |
| Size | Small session ID | Larger (token carries data) |

---

## 7.2 Zero Trust Architecture

**Core Principle:** "Never trust, always verify." No implicit trust based on network location.

**Pillars:**
1. **Identity verification:** Strong authentication for every request (user + device + context)
2. **Least privilege:** Minimal access grants, just-in-time provisioning
3. **Microsegmentation:** Network divided into small zones, lateral movement prevented
4. **Continuous validation:** Re-verify trust continuously, not just at login
5. **Encryption everywhere:** TLS for all traffic, even internal (mTLS in service mesh)

**Implementation Layers:**
- **Device trust:** Certificate-based device attestation
- **User identity:** MFA, SSO, risk-based authentication
- **Application access:** Identity-aware proxy (BeyondCorp model)
- **Network:** Microsegmentation, software-defined perimeter
- **Data:** Encryption at rest and in transit, DLP

---

## 7.3 Encryption Patterns

### At Rest:
- AES-256-GCM for symmetric encryption
- Envelope encryption: Data encrypted with DEK, DEK encrypted with KEK (AWS KMS pattern)
- Client-side vs. server-side encryption

### In Transit:
- TLS 1.3 everywhere (faster handshake, forward secrecy)
- mTLS for service-to-service (both sides authenticate)
- Certificate management: Let's Encrypt, AWS ACM, HashiCorp Vault

### Application-Level:
- Field-level encryption for sensitive data (SSN, credit card)
- Tokenization: Replace sensitive data with non-reversible tokens
- Hashing with salt for passwords (bcrypt, Argon2id)

---

## 7.4 API Security

- **Rate limiting:** Token bucket / sliding window algorithms at API gateway
- **Input validation:** Sanitize all inputs, prevent injection attacks
- **CORS:** Configure allowed origins strictly
- **API keys:** For identification (not authentication)
- **Webhook verification:** HMAC signature validation
- **Content Security Policy (CSP):** Prevent XSS
- **OWASP Top 10:** SQL injection, XSS, broken auth, SSRF, etc.

---

# 8. OBSERVABILITY

## 8.1 Three Pillars of Observability

### Metrics (Prometheus):
- **Types:** Counter (monotonic), Gauge (up/down), Histogram (distribution), Summary
- **Collection:** Pull-based (Prometheus scrapes targets) vs. Push-based (StatsD, OTLP)
- **Storage:** Time-series database (Prometheus TSDB, VictoriaMetrics, Thanos for long-term)
- **Key metrics:** RED (Rate, Errors, Duration) for services; USE (Utilization, Saturation, Errors) for resources

### Logs (Loki/ELK):
- **Structured logging:** JSON format with consistent fields (timestamp, service, trace_id, level, message)
- **Aggregation:** Fluentd/Fluent Bit/Promtail collect and forward logs
- **Storage:** Loki (label-indexed, cost-effective) or Elasticsearch (full-text indexed, powerful queries)
- **Correlation:** Include trace_id in every log line for cross-referencing with traces

### Traces (Tempo/Jaeger):
- **Spans:** Individual operations with start time, duration, status, attributes
- **Trace:** Tree of spans representing an entire request path
- **Context propagation:** W3C Trace Context standard (traceparent header)
- **Sampling:** Head-based (decide at start) or tail-based (decide after completion)

---

## 8.2 OpenTelemetry (OTel) - The Standard

**The CNCF project that unifies metrics, logs, and traces instrumentation.**

### Architecture:
```
Application (SDK + Auto-instrumentation) -> OTel Collector -> Backend
                                              |
                                        Processors
                                        (batching, filtering, sampling)
                                              |
                                        Exporters
                                    (Prometheus, Jaeger, Loki, OTLP)
```

### Key Concepts:
- **SDK:** Language-specific instrumentation libraries
- **Auto-instrumentation:** Zero-code span creation for popular frameworks (HTTP, DB, gRPC)
- **Collector:** Vendor-agnostic proxy that receives, processes, and exports telemetry
- **OTLP:** OpenTelemetry Protocol -- the standard wire format for all signals

### 2025 Status:
- Metrics, traces, and logs all GA (stable)
- 48.5% of organizations already using OTel, 25.3% planning
- Auto-instrumentation for 20+ languages
- Profiling signal in development

---

## 8.3 Monitoring Stack (Production)

### Modern Stack:
```
Prometheus (metrics) + Grafana (visualization) + Loki (logs) + Tempo (traces)
                     + Alertmanager (alerting) + OTel Collector (ingestion)
```

### Alerting Best Practices:
- Alert on symptoms, not causes (alert on "error rate > 5%", not "CPU > 80%")
- Use SLO-based alerting: Alert when error budget is burning too fast
- Multi-window, multi-burn-rate alerts reduce false positives
- Page only for user-facing impact; ticket for everything else
- Include runbook links in alert descriptions

### SLIs, SLOs, SLAs:
- **SLI (Service Level Indicator):** Measurable metric (e.g., 99.2% of requests < 200ms)
- **SLO (Service Level Objective):** Target for SLI (e.g., 99.9% availability per month)
- **SLA (Service Level Agreement):** Contract with consequences for missing SLO
- **Error Budget:** 100% - SLO = allowed downtime (e.g., 99.9% SLO = 43.2 min/month downtime)

---

## 8.4 Prometheus 3.x (2025):
- Native histograms: 30% CPU reduction, 25% less memory
- UTF-8 metric names
- Remote write 2.0 protocol
- Improved OTLP ingestion

---

# 9. INFRASTRUCTURE DESIGN

## 9.1 CDN (Content Delivery Network)

### Architecture:
```
User -> DNS (GSLB) -> Nearest Edge/PoP -> Origin Server (on cache miss)
```

### Key Concepts:
- **Edge locations / PoPs:** Caching servers geographically distributed
- **Cache-Control headers:** max-age, s-maxage, no-cache, no-store, private, public
- **Cache invalidation:** Purge (remove specific), Invalidate (mark stale), Versioned URLs (?v=2)
- **Push vs. Pull CDN:** Push pre-loads content; Pull fetches on first request (more common)

### Advanced CDN Patterns:
- **Edge compute:** Run code at CDN edge (Cloudflare Workers, Lambda@Edge)
- **Dynamic content acceleration:** TCP optimization, connection pooling to origin
- **Video streaming:** Adaptive bitrate streaming (HLS, DASH) served from edge
- **Security:** DDoS protection, WAF at edge, bot management

### Providers: CloudFront (AWS), Akamai, Cloudflare, Fastly, GCP Cloud CDN

---

## 9.2 DNS (Domain Name System)

### Resolution Flow:
```
Client -> Recursive Resolver (ISP/1.1.1.1/8.8.8.8) -> Root NS -> TLD NS (.com) -> 
Authoritative NS -> IP Address (cached at each level based on TTL)
```

### DNS Record Types:
| Type | Purpose | Example |
|------|---------|---------|
| A | IPv4 address | example.com -> 93.184.216.34 |
| AAAA | IPv6 address | example.com -> 2606:2800:220:1:... |
| CNAME | Alias to another domain | www.example.com -> example.com |
| MX | Mail server | example.com -> mail.example.com |
| NS | Nameserver | example.com -> ns1.example.com |
| TXT | Verification, SPF, DKIM | example.com -> "v=spf1 ..." |
| SRV | Service discovery | _http._tcp.example.com |

### DNS for Load Balancing:
- **Round-robin DNS:** Multiple A records, rotated per query
- **GeoDNS:** Return different IPs based on client geography
- **Weighted DNS:** Route percentage of traffic to specific targets
- **Health-checked DNS:** Remove unhealthy targets from responses
- **Latency-based routing:** Route to lowest-latency endpoint (Route 53)

---

## 9.3 Proxies

### Forward Proxy:
- Client-side proxy that hides client identity from servers
- Use cases: Corporate firewalls, content filtering, caching
- Example: Squid

### Reverse Proxy:
- Server-side proxy that hides server identity from clients
- Use cases: Load balancing, SSL termination, caching, compression, rate limiting
- Example: Nginx, HAProxy, Envoy

### Load Balancing Algorithms:
- **Round Robin:** Simple rotation (no health awareness)
- **Weighted Round Robin:** Higher weight = more traffic
- **Least Connections:** Route to server with fewest active connections
- **Least Response Time:** Route to fastest-responding server
- **IP Hash:** Consistent routing for same client IP (sticky sessions)
- **Consistent Hashing:** Minimize redistribution when servers added/removed

### L4 vs L7 Load Balancing:
- **L4 (Transport):** Routes based on IP + port. Faster, less overhead. Cannot inspect HTTP.
- **L7 (Application):** Routes based on HTTP headers, URL path, cookies. More flexible, more overhead.

---

## 9.4 Service Discovery

### Client-Side Discovery:
- Client queries a service registry, then load-balances itself
- Examples: Netflix Eureka, gRPC client-side LB
- Pro: No extra hop. Con: Client complexity.

### Server-Side Discovery:
- Client talks to a load balancer/router, which queries registry
- Examples: AWS ALB + ECS, Kubernetes Services
- Pro: Simpler clients. Con: Extra network hop.

### Service Registries:
- **Consul (HashiCorp):** Service discovery + health checking + KV store + service mesh
- **etcd:** Distributed KV store backing Kubernetes service discovery
- **ZooKeeper:** Legacy but still used (Kafka pre-KRaft, Hadoop)

### DNS-Based Service Discovery (Kubernetes):
```
my-service.my-namespace.svc.cluster.local -> ClusterIP -> Pod endpoints
```

---

## 9.5 API Gateway

### Responsibilities:
- Request routing (path-based, header-based)
- Authentication/Authorization (JWT validation, API key check)
- Rate limiting and throttling
- Request/response transformation
- Protocol translation (REST -> gRPC, HTTP -> WebSocket)
- Caching, compression, CORS
- Observability (logging, metrics, tracing)

### API Gateway vs. Service Mesh:
| Aspect | API Gateway | Service Mesh |
|--------|------------|-------------|
| Traffic | North-south (external) | East-west (internal) |
| Focus | External API management | Service-to-service |
| Auth | API keys, OAuth, JWT | mTLS, RBAC |
| Examples | Kong, AWS API Gateway | Istio, Linkerd |

### API Design Protocols:
| Protocol | Format | Transport | Best For |
|----------|--------|-----------|----------|
| REST | JSON | HTTP/1.1+ | Public APIs, CRUD |
| GraphQL | JSON | HTTP | Flexible queries, BFF |
| gRPC | Protobuf (binary) | HTTP/2 | Internal services, high perf |
| WebSocket | Binary/Text | TCP | Real-time bidirectional |

---

# 10. BLOCKCHAIN/WEB3 SYSTEM DESIGN

## 10.1 Core Architecture

### Web3 Application Stack:
```
Frontend (React/Next.js) -> Wallet (MetaMask) -> RPC Node (Infura/Alchemy) -> Blockchain
                                                                                  |
Frontend <- Indexer (The Graph/Subsquid) <- Blockchain Events
                                                                                  |
Backend (optional) -> Database (PostgreSQL) -> API for off-chain data
                   -> IPFS/Arweave (decentralized storage)
```

### Key Differences from Web2:
- **State:** Stored on blockchain (decentralized, immutable) vs. centralized database
- **Authentication:** Wallet-based (cryptographic signatures) vs. username/password
- **Backend logic:** Smart contracts (on-chain) vs. server code
- **Payment:** Native token transactions vs. payment processor integration

---

## 10.2 Consensus Mechanisms

| Mechanism | How It Works | Examples | Trade-offs |
|-----------|-------------|----------|------------|
| Proof of Work (PoW) | Miners solve computational puzzles | Bitcoin | Secure but energy-intensive |
| Proof of Stake (PoS) | Validators stake tokens as collateral | Ethereum 2.0, Solana | Energy efficient, risk of centralization |
| Proof of Authority (PoA) | Vetted validators with known identities | Private chains | Fast, but less decentralized |
| Delegated PoS (DPoS) | Token holders vote for delegates | EOS, Tron | Democratic but prone to cartels |
| BFT Variants | Byzantine fault tolerance voting | Tendermint, HotStuff | Fast finality, limited validator count |

---

## 10.3 Smart Contracts
- Self-executing code deployed on blockchain
- Immutable once deployed (use proxy patterns for upgradability)
- Gas fees for execution (Ethereum) -- design for gas efficiency
- Common vulnerabilities: Reentrancy, integer overflow, access control, front-running

### Design Patterns:
- **Proxy/Upgradeable:** Separate storage from logic for upgradeability
- **Factory:** Deploy new contracts from a template
- **Oracle:** Bridge off-chain data to on-chain (Chainlink)
- **Multi-sig:** Require multiple signatures for critical operations

---

## 10.4 Scalability Solutions

### Layer 2 Solutions:
- **Rollups (Optimistic/ZK):** Execute transactions off-chain, post proofs on-chain
  - Optimistic: Assume valid, challenge window (7 days). Examples: Arbitrum, Optimism
  - ZK: Cryptographic proof of validity. Examples: zkSync, StarkNet
- **State Channels:** Off-chain transactions between parties, settle on-chain
- **Sidechains:** Independent chains with their own consensus, bridged to main chain

---

# 11. MOBILE SYSTEM DESIGN

## 11.1 Mobile-Specific Constraints

### Resource Constraints:
- **Battery:** Network calls, GPS, background processing drain battery
- **Memory:** Limited RAM; OS kills background apps aggressively
- **Network:** Unreliable, varying bandwidth (WiFi vs. LTE vs. Edge)
- **Storage:** Limited disk space; manage cache size
- **CPU:** Thermal throttling under sustained load

### Platform-Specific Constraints:
- **iOS:** Background App Refresh not guaranteed, strict App Store guidelines, URLSession for networking
- **Android:** Doze Mode restricts network access, App Standby Buckets limit background work, WorkManager for deferred tasks

---

## 11.2 Architecture Patterns

### MVVM (Model-View-ViewModel):
- Most common in modern mobile (SwiftUI, Jetpack Compose, React Native)
- ViewModel holds UI state and business logic
- View observes ViewModel reactively

### MVI (Model-View-Intent):
- Unidirectional data flow
- User actions (Intents) -> Reducer -> New State -> View
- Predictable state management, easier debugging

### VIPER:
- View, Interactor, Presenter, Entity, Router
- Heavy separation of concerns
- Used in large iOS projects

### Clean Architecture:
- Domain layer (use cases) is independent of frameworks
- Data layer handles API/DB/cache
- Presentation layer handles UI

---

## 11.3 Offline-First Design

### Strategies:
- **Optimistic UI:** Show changes immediately, sync in background
- **Read-through cache:** Check local DB before API; show cached content immediately
- **Stale-while-revalidate:** Show cached data, refresh in background
- **Queue operations:** Store mutations in local queue, replay when online

### Conflict Resolution:
- **Last-Write-Wins (LWW):** Simplest; most recent timestamp wins
- **Server-wins:** Server state always takes precedence
- **Client-wins:** Client state takes precedence (for user-generated content)
- **Merge:** CRDTs or OT for collaborative data
- **Manual resolution:** Show conflict to user

### Sync Patterns:
- **Delta sync:** Only transfer changed data since last sync
- **Timestamp-based:** Track last sync time, fetch changes after that
- **Version vectors:** Track versions per client for conflict detection

---

## 11.4 Mobile Networking

### Optimization:
- **HTTP/2 multiplexing:** Single connection for multiple requests
- **Image optimization:** WebP/AVIF, progressive loading, lazy loading
- **Pagination:** Cursor-based (not offset-based) for stable pagination
- **Prefetching:** Anticipate user actions and prefetch data
- **Compression:** gzip/Brotli for response bodies

### Caching Layers:
```
Memory Cache (LRU) -> Disk Cache (SQLite/Room/CoreData) -> Network
```

---

## 11.5 Key Mobile System Design Questions
- Design Instagram Feed (infinite scroll, image caching, offline viewing)
- Design a Chat Application (real-time messaging, offline queue, push notifications)
- Design a Ride-Sharing App (real-time location, map rendering, background GPS)
- Design an Offline-First Note-Taking App (sync, conflict resolution)
- Design an Image Loading Library (caching, memory management, decode)

---

# 12. DATA ENGINEERING DESIGN

## 12.1 Data Architecture Evolution

### Data Warehouse:
- **Structured data only,** schema-on-write
- Optimized for SQL analytics and reporting
- ETL (Extract, Transform, Load) into warehouse
- Technologies: Snowflake, BigQuery, Redshift, Azure Synapse
- Star/Snowflake schema design

### Data Lake:
- **All data types** (structured, semi-structured, unstructured)
- Schema-on-read
- ELT (Extract, Load, Transform)
- Low-cost object storage (S3, GCS, ADLS)
- Risk: "Data swamp" without governance

### Data Lakehouse (2025 Standard):
- **Combines lake flexibility with warehouse reliability**
- ACID transactions on object storage
- Open table formats: Apache Iceberg, Delta Lake, Apache Hudi
- Features: Time travel, schema evolution, partition evolution
- Multi-engine access (Spark, Trino, Flink, DuckDB all query same data)

### Data Mesh:
- **Organizational/sociotechnical architecture** (not a technology)
- Domain-oriented data ownership
- Data as a product (discoverable, documented, quality-assured)
- Self-serve data platform
- Federated computational governance
- Often implemented on top of a lakehouse architecture

---

## 12.2 Medallion Architecture

```
Bronze (Raw)           Silver (Cleaned)         Gold (Business)
+-----------------+   +-----------------+    +-----------------+
| Raw ingestion   |   | Validated       |    | Aggregated      |
| Append-only     |-->| Deduplicated    |--->| Business metrics|
| Full history    |   | Conformed types |    | Feature tables  |
| Minimal schema  |   | Joined/enriched |    | ML training     |
+-----------------+   +-----------------+    +-----------------+
```

---

## 12.3 ETL/ELT Pipelines

### ETL vs. ELT:
| Aspect | ETL | ELT |
|--------|-----|-----|
| Transform | Before loading | After loading |
| Processing | ETL server | Target warehouse |
| Best for | Legacy systems | Cloud warehouses |
| Tools | Informatica, SSIS | dbt, Spark SQL |

### Modern Data Stack:
- **Ingestion:** Fivetran, Airbyte, Debezium (CDC)
- **Transformation:** dbt (SQL-based transformations), Spark
- **Orchestration:** Airflow, Dagster, Prefect
- **Storage:** S3/GCS + Iceberg/Delta Lake
- **Query:** Snowflake, BigQuery, Trino, DuckDB
- **Visualization:** Looker, Tableau, Metabase, Superset

---

## 12.4 Change Data Capture (CDC)

### Approaches:
- **Log-based CDC:** Read database transaction log (binlog, WAL). Lowest impact on source. (Debezium)
- **Trigger-based:** Database triggers write changes to a change table. Higher overhead.
- **Timestamp-based:** Query for records modified after last sync. May miss deletes.
- **Diff-based:** Compare current and previous snapshot. Resource-intensive.

### CDC Pipeline:
```
Source DB -> Debezium -> Kafka -> Stream Processing -> Target (Lake/Warehouse/Cache)
```

---

## 12.5 Batch vs. Stream Processing

| Aspect | Batch | Stream |
|--------|-------|--------|
| Latency | Minutes to hours | Milliseconds to seconds |
| Completeness | Full dataset | Partial/windowed |
| Complexity | Simpler | Harder (ordering, late data) |
| Use cases | Reports, ML training | Real-time dashboards, fraud |
| Tools | Spark, Hadoop, dbt | Flink, Kafka Streams, Spark Streaming |

### Lambda Architecture:
- Batch layer + Speed layer + Serving layer
- Batch provides accuracy; speed provides freshness
- Drawback: Maintaining two codepaths

### Kappa Architecture:
- Stream processing only; reprocess by replaying the log
- Simpler than Lambda; Kafka enables replay
- Drawback: Not all workloads fit streaming model

---

# 13. DEVOPS AND CI/CD SYSTEM DESIGN

## 13.1 CI/CD Pipeline Architecture

### Pipeline Stages:
```
Code Commit -> Build -> Unit Tests -> Integration Tests -> Security Scan ->
Artifact Build -> Deploy to Staging -> E2E Tests -> Deploy to Production -> Monitoring
```

### CI Best Practices:
- Build on every commit to main (trunk-based development)
- Fast feedback: Keep builds under 10 minutes
- Parallel test execution
- Deterministic builds (pinned dependencies, reproducible)
- Branch protection rules (require passing CI before merge)

### CD Strategies:
- **Continuous Delivery:** Automated pipeline to staging; manual approval for production
- **Continuous Deployment:** Fully automated; every passing commit goes to production
- **Progressive Delivery:** Gradual rollout with automated rollback

---

## 13.2 Deployment Strategies

### Blue-Green Deployment:
- Two identical environments (blue = current, green = new)
- Switch traffic atomically via load balancer/DNS
- Instant rollback by switching back
- Cost: 2x infrastructure during deployment

### Canary Release:
- Route 1-5% of traffic to new version
- Monitor error rates, latency, business metrics
- Gradually increase traffic (5% -> 25% -> 50% -> 100%)
- Automated rollback if metrics degrade

### Rolling Deployment:
- Update instances one-by-one (or in batches)
- Zero downtime; gradual rollout
- Rollback is slower (must roll back each instance)
- Must handle version compatibility (old and new running simultaneously)

### Feature Flags:
- Decouple deployment from release
- Ship code dark, enable for specific users/percentages
- A/B testing infrastructure
- Kill switches for instant feature disable
- Tools: LaunchDarkly, Unleash, Flagsmith, Split

### Combining Strategies:
Canary deployment (infrastructure) + Feature flags (functionality) = Minimum blast radius. Ship new infrastructure to 10% of traffic, enable feature for 2% of accounts within that cohort.

---

## 13.3 GitOps

**Core Principle:** Git is the single source of truth for both application code and infrastructure.

### Pull-Based Model (Preferred):
```
Developer -> Git Push -> Git Repository <- Agent (ArgoCD/Flux) -> Kubernetes Cluster
```
- Agent in cluster continuously reconciles desired state (Git) with actual state
- More secure: No external system needs cluster credentials
- Drift detection: Agent alerts if actual state differs from Git

### Key Tools:
- **ArgoCD:** Declarative GitOps for Kubernetes
- **Flux:** CNCF GitOps toolkit
- **Terraform + Atlantis:** Infrastructure GitOps for cloud resources
- **Crossplane:** Kubernetes-native infrastructure provisioning

---

## 13.4 Infrastructure as Code (IaC)

| Tool | Approach | Language | State | Best For |
|------|----------|----------|-------|----------|
| Terraform | Declarative | HCL | Remote state | Multi-cloud |
| Pulumi | Imperative | Python/TS/Go | Managed | Developers who prefer real languages |
| CloudFormation | Declarative | JSON/YAML | AWS-managed | AWS-only |
| CDK | Imperative | TS/Python/Java | CloudFormation | AWS with programming language |
| Ansible | Imperative | YAML | Stateless | Configuration management |
| Crossplane | Declarative | YAML (K8s CRDs) | Kubernetes | K8s-native infra |

---

## 13.5 Container Orchestration (Kubernetes)

### Core Abstractions:
- **Pod:** Smallest deployable unit (one or more containers)
- **Deployment:** Manages ReplicaSets, rolling updates, rollbacks
- **StatefulSet:** For stateful apps (databases); stable network IDs, ordered scaling
- **DaemonSet:** One pod per node (logging agents, monitoring)
- **Service:** Stable networking endpoint for pods (ClusterIP, NodePort, LoadBalancer)
- **Ingress:** HTTP routing rules (path-based, host-based)

### Autoscaling:
- **HPA (Horizontal Pod Autoscaler):** Scale pods based on CPU, memory, or custom metrics
- **VPA (Vertical Pod Autoscaler):** Adjust pod resource requests/limits
- **Cluster Autoscaler:** Add/remove nodes based on pending pods
- **KEDA:** Event-driven autoscaling (scale based on queue depth, Kafka lag, etc.)

---

# 14. EDGE COMPUTING AND IoT SYSTEM DESIGN

## 14.1 Architecture Layers

### Three-Tier IoT Architecture:
```
Device Layer          Edge/Fog Layer        Cloud Layer
+-------------+    +----------------+    +----------------+
| Sensors     |    | Edge Gateway   |    | Data Lake      |
| Actuators   |    | Local Processing|   | ML Training    |
| Constrained |    | Filtering      |    | Long-term Store|
| Devices     |--->| Aggregation    |--->| Analytics      |
|             |    | Real-time      |    | Global Insights|
|             |    | Decisions      |    | Model Updates  |
+-------------+    +----------------+    +----------------+
```

### Edge vs. Fog vs. Cloud:
| Aspect | Edge | Fog | Cloud |
|--------|------|-----|-------|
| Location | On/near device | Local network | Centralized |
| Latency | <10ms | 10-50ms | 50-200ms |
| Processing | Simple filtering | Moderate analytics | Heavy computation |
| Storage | Limited | Moderate | Unlimited |
| Examples | Raspberry Pi, NVIDIA Jetson | On-prem servers | AWS, GCP, Azure |

---

## 14.2 IoT Communication Protocols

| Protocol | Use Case | Overhead | Reliability |
|----------|----------|----------|-------------|
| MQTT | Lightweight messaging, constrained devices | Very low | QoS 0/1/2 |
| CoAP | RESTful for constrained devices | Very low | Confirmable messages |
| HTTP | General purpose | High | TCP reliable |
| AMQP | Enterprise messaging | Medium | Guaranteed delivery |
| LoRaWAN | Long-range, low-power | Very low | Limited |
| Zigbee/Z-Wave | Home automation, short range | Very low | Mesh networking |

### MQTT Deep Dive:
- Publish/Subscribe model with topics
- QoS levels: 0 (at-most-once), 1 (at-least-once), 2 (exactly-once)
- Retained messages for last-known-good values
- Last Will and Testament (LWT) for device offline detection
- Broker: Mosquitto, HiveMQ, AWS IoT Core

---

## 14.3 Edge Computing Design Patterns

- **Data filtering:** Only send relevant data to cloud (reduce bandwidth 80-90%)
- **Local inference:** Run ML models on edge for real-time decisions
- **Store and forward:** Buffer data locally during connectivity loss, sync when online
- **Digital twin:** Cloud-based virtual representation of physical device
- **OTA updates:** Over-the-air firmware updates with rollback capability

---

## 14.4 Device Management at Scale

- **Provisioning:** Secure device onboarding (X.509 certificates, TPM)
- **Fleet management:** Group devices, push configurations, monitor health
- **Firmware updates:** Staged rollouts, A/B partitions for safe updates
- **Security:** Device attestation, encrypted communication, key rotation
- **Platforms:** AWS IoT Core, Azure IoT Hub, GCP IoT Core (deprecated -> moved to partners)

---

# 15. PAYMENT SYSTEMS DESIGN

## 15.1 Payment Processing Architecture

### Payment Flow:
```
Customer -> Merchant App -> Payment Gateway -> Payment Processor -> Card Network -> Issuing Bank
                                                                                       |
Customer <- Merchant App <- Payment Gateway <- Payment Processor <- Card Network <- Authorization
```

### Two-Phase Processing:
1. **Authorization:** Verify card, check funds, place hold. Returns auth code.
2. **Capture:** Actually move the money (can be immediate or delayed).

### Additional Operations:
- **Void:** Cancel authorization before capture
- **Refund:** Return captured funds to customer
- **Chargeback:** Customer disputes transaction through bank

---

## 15.2 Idempotency (Critical for Payments)

**Problem:** Network failures + retries can cause duplicate charges.

### Stripe's Approach:
- Client generates unique `Idempotency-Key` header (UUID)
- Server creates a database record tracking progress through "atomic phases"
- If request fails mid-execution, retry with same key resumes from last completed phase
- Keys expire after 24 hours

### Implementation:
```
1. Receive request with idempotency key
2. Check if key exists in database
   - If exists and completed: Return cached response
   - If exists and in-progress: Return 409 Conflict
   - If not exists: Create record, proceed
3. Execute payment through atomic phases
4. Store final response with idempotency key
```

### Best Practices:
- Use UUIDs as idempotency keys
- Store idempotency records in same database transaction as business data
- Include expiration (24h is typical)
- Handle concurrent requests for same key (database-level locking)

---

## 15.3 Double-Entry Bookkeeping

**Every transaction creates at least two entries that sum to zero:**
```
Debit Account A: -$100
Credit Account B: +$100
Sum: $0 (balanced)
```

### Why It Matters:
- Self-balancing: Errors are detectable (if entries don't sum to zero)
- Audit trail: Complete record of all financial movements
- Reconciliation: Can verify external systems match internal records

---

## 15.4 Payment System Design Considerations

### Consistency Requirements:
- Money cannot be lost, duplicated, or misrepresented
- Use database transactions (ACID) for financial operations
- Separate execution from accounting
- Explicitly track state (state machine for payment lifecycle)

### Fraud Detection:
- Rules-based: Velocity checks, amount thresholds, geographic anomalies
- ML-based: Transaction scoring, behavioral analysis, network analysis
- 3D Secure: Additional authentication step (Verified by Visa, Mastercard SecureCode)

### Compliance:
- **PCI DSS:** Never store full card numbers; use tokenization
- **PSD2/SCA:** Strong Customer Authentication in EU (two-factor for online payments)
- **KYC/AML:** Know Your Customer / Anti-Money Laundering regulations

### Handling Failures:
- Retry with exponential backoff
- Dead letter queues for failed transactions
- Reconciliation jobs: Compare internal records with external processor records
- Alerts for discrepancies

---

# 16. GAMING SYSTEM DESIGN

## 16.1 Multiplayer Architecture Models

### Client-Server (Authoritative):
- Server owns the game state (prevents cheating)
- Clients send inputs, server simulates, broadcasts results
- Used by: Most competitive FPS, MOBAs

### Peer-to-Peer:
- Players connect directly to each other
- No server costs, but vulnerable to cheating
- Used by: Some fighting games, older RTS games

### Lockstep:
- All clients simulate the same inputs in lockstep
- Only inputs transmitted (very low bandwidth)
- All clients must be deterministic
- Used by: RTS games (StarCraft), fighting games

---

## 16.2 Netcode Concepts

### Tick Rate:
- How often the server updates game state
- 128 tick/s (competitive CS2), 64 tick/s (most FPS), 30 tick/s (battle royale), 20 tick/s (MMO)
- Higher tick rate = more responsive but more CPU/bandwidth

### Client-Side Prediction:
- Client simulates movement locally without waiting for server
- When server state arrives, reconcile: if prediction matches, smooth; if not, correct

### Server Reconciliation:
- When server state conflicts with client prediction, client "rewinds" and replays inputs from the authoritative state

### Entity Interpolation:
- Render other players between known server states (typically 100ms delay)
- Provides smooth movement despite discrete updates
- Trade-off: Visual smoothness vs. positional accuracy

### Lag Compensation:
- Server "rewinds" game state to when a player fired their shot
- Accounts for network latency in hit detection
- Prevents high-ping players from being unfairly disadvantaged

---

## 16.3 Network Protocols for Games

| Protocol | Use Case | Properties |
|----------|----------|------------|
| UDP | Real-time game state | Fast, unreliable, no ordering |
| TCP | Chat, matchmaking, inventory | Reliable, ordered, higher latency |
| WebSocket | Browser games | TCP-based, full-duplex |
| WebRTC | P2P browser games | UDP-like, NAT traversal |
| QUIC | Emerging game networking | UDP-based, reliable streams, multiplexed |

---

## 16.4 Game Server Architecture

### Matchmaking System:
```
Player Queue -> Matchmaking Service -> Skill Rating (Elo/Glicko/TrueSkill) -> 
Match Found -> Allocate Game Server -> Connect Players
```

### Server Infrastructure:
- **Dedicated servers:** Best for competitive games (consistent performance)
- **Server fleet management:** Agones (K8s), GameLift (AWS), Multiplay
- **Scaling:** Pre-warm servers for expected load, auto-scale for peaks
- **Regional deployment:** Deploy close to player clusters for low latency

### Game State Management:
- **Interest management / Relevance:** Only send nearby entity updates to each player
- **Area of Interest (AoI):** Spatial partitioning of game world
- **Level of Detail (LoD):** Reduce update frequency for distant entities
- **Delta compression:** Only send state changes, not full state

---

## 16.5 Massive Multiplayer (MMO) Specific

- **Sharding:** Split game world across servers (each server handles a "shard")
- **Zoning:** Server boundary within continuous world; seamless zone transitions
- **Instancing:** Create separate copies of areas for different groups
- **Database:** Eventually consistent for most game data; strong consistency for trades/auctions
- **Chat system:** Separate service, pub/sub for channels/guilds

---

# 17. CROSS-CUTTING FUNDAMENTALS

## 17.1 Distributed Consensus

### Raft:
- Understandable consensus algorithm (designed to replace Paxos)
- Three roles: Leader, Follower, Candidate
- **Leader Election:** Randomized timeouts; first to timeout becomes candidate
- **Log Replication:** Leader appends entries, replicates to followers, commits when majority acknowledges
- **Safety:** Only candidates with most up-to-date log can win election
- Used by: etcd (Kubernetes), Consul, CockroachDB, TiKV

### Paxos:
- Original consensus algorithm by Leslie Lamport
- Three roles: Proposer, Acceptor, Learner
- Two phases: Prepare/Promise, Accept/Accepted
- Famously difficult to implement correctly
- Used by: Google Chubby, Google Spanner (Multi-Paxos)

### Real-World Usage:
- **etcd (Raft):** Powers Kubernetes
- **ZooKeeper (ZAB):** Powers Kafka (pre-KRaft), Hadoop, HBase
- **Consul (Raft):** Service mesh, service discovery

---

## 17.2 CAP and PACELC Theorems

### CAP Theorem:
In the presence of a network partition, you must choose between Consistency and Availability.

| System | CAP Choice | Examples |
|--------|-----------|----------|
| CP | Consistency over Availability | HBase, MongoDB (default), Redis Cluster, Spanner |
| AP | Availability over Consistency | Cassandra, DynamoDB, CouchDB, Riak |

### PACELC Theorem:
If Partition: choose A or C. Else: choose Latency or Consistency.
- **PA/EL:** DynamoDB, Cassandra (low latency, eventually consistent)
- **PC/EC:** Spanner, CockroachDB (consistent always, higher latency)
- **PA/EC:** Cosmos DB (configurable per request)

### Consistency Models Spectrum:
```
Strong (Linearizable) -> Sequential -> Causal -> Eventual
     Most consistent                              Most available
     Highest latency                               Lowest latency
```

---

## 17.3 Database Sharding & Partitioning

### Partitioning Strategies:
- **Hash-based:** Hash(key) % N. Even distribution but no range queries. Hot spot risk with popular keys.
- **Range-based:** Assign key ranges to partitions. Good for range queries but risk of hot spots.
- **Directory-based:** Lookup table maps keys to partitions. Flexible but directory is bottleneck.
- **Geographic:** Partition by region. Good for locality but uneven load.

### Consistent Hashing:
- Keys and servers placed on a hash ring
- Key assigned to nearest server clockwise
- Adding/removing server only affects adjacent keys (not all keys)
- **Virtual nodes:** Each server placed at multiple points on ring; improves load distribution, prevents cascade when server fails

### Rebalancing:
- **Fixed partitions:** Pre-create many partitions (e.g., 1000); assign subset to each node. Rebalance by moving partitions.
- **Dynamic partitioning:** Split partitions when they grow, merge when they shrink.
- **Proportional partitioning:** Number of partitions proportional to node count.

---

## 17.4 Caching Deep Dive

### Caching Strategies:
| Strategy | How It Works | Best For |
|----------|-------------|----------|
| Cache-Aside | App checks cache, loads from DB on miss | General purpose (most common) |
| Read-Through | Cache auto-fetches on miss | Simplified read path |
| Write-Through | Write to cache and DB synchronously | Consistency-critical |
| Write-Behind | Write to cache, async flush to DB | Write-heavy workloads |
| Write-Around | Write directly to DB, bypass cache | Write-once data |

### Eviction Policies:
- **LRU (Least Recently Used):** Most common; evict item not accessed longest
- **LFU (Least Frequently Used):** Evict item accessed fewest times; good for hotspot data
- **TTL (Time To Live):** Expire after duration; good for freshness
- **FIFO:** First in, first out; simplest

### Cache Invalidation Patterns:
- **TTL-based:** Set expiration; tolerate staleness up to TTL
- **Event-driven:** Publish invalidation events when data changes
- **Write-through:** Cache always consistent (but write latency)
- **Versioned keys:** Append version to cache key; new version = cache miss

### Redis vs. Memcached:
| Feature | Redis | Memcached |
|---------|-------|-----------|
| Data structures | Strings, lists, sets, hashes, sorted sets, streams | Strings only |
| Persistence | RDB snapshots, AOF | None |
| Replication | Leader-follower | None |
| Clustering | Redis Cluster (auto-sharding) | Client-side sharding |
| Pub/Sub | Yes | No |
| Lua scripting | Yes | No |
| Memory efficiency | Slightly less | Slightly more |

---

## 17.5 Message Queues

### Queue vs. Pub/Sub vs. Streaming:
| Pattern | Delivery | Consumer | Retention | Example |
|---------|----------|----------|-----------|---------|
| Queue | One consumer per message | Competing consumers | Until consumed | SQS, RabbitMQ |
| Pub/Sub | All subscribers get copy | Fan-out | Until consumed | SNS, Redis Pub/Sub |
| Streaming | Consumer controls position | Pull-based, replay | Time/size-based | Kafka, Kinesis |

### Delivery Guarantees:
- **At-most-once:** Fire and forget. Fast but lossy.
- **At-least-once:** Retry until acknowledged. May have duplicates (most common).
- **Exactly-once:** Hardest. Kafka supports with idempotent producers + transactional consumers.
- **Practical advice:** Build idempotent consumers regardless of broker guarantees.

---

## 17.6 Geospatial Indexing

### Geohash:
- Encodes lat/long into alphanumeric string (e.g., "9q8yyk8")
- Longer string = more precise
- O(1) insertion, fast writes
- Proximity search: Find all points sharing same geohash prefix
- Used by: Uber (driver location tracking), Redis GEO

### Quadtree:
- Recursively divides 2D space into four quadrants
- Adapts to data density (more subdivisions where more points exist)
- O(log n) insertion with potential rebalancing
- Better for range queries and non-uniform data
- Used by: Google Maps, Yelp (finding nearby places)

### R-tree:
- Balanced tree using bounding rectangles
- Good for overlapping regions and complex shapes
- Used by: PostGIS, spatial databases

---

## 17.7 Chaos Engineering & Resilience

### Principles:
1. Define "steady state" (normal behavior metrics)
2. Hypothesize that steady state will continue during experiments
3. Introduce real-world events (server failure, network partition, clock skew)
4. Try to disprove the hypothesis
5. Minimize blast radius

### Netflix Simian Army:
- **Chaos Monkey:** Randomly terminates production instances
- **Chaos Gorilla:** Drops an entire Availability Zone
- **Chaos Kong:** Drops an entire AWS Region
- **Latency Monkey:** Introduces artificial network delays

### Tools:
- **Gremlin:** Enterprise chaos engineering platform
- **Chaos Toolkit:** Open-source, extensible
- **Litmus:** Kubernetes-native chaos engineering
- **AWS Fault Injection Simulator:** Managed fault injection service

---

## 17.8 Domain-Driven Design (DDD)

### Strategic Patterns:
- **Bounded Context:** Explicit boundary where a domain model applies
- **Ubiquitous Language:** Shared vocabulary between developers and domain experts
- **Context Map:** Relationships between bounded contexts (partnership, customer-supplier, conformist, anti-corruption layer)
- **Bounded Context -> Microservice:** General guideline: one microservice per bounded context

### Tactical Patterns:
- **Entity:** Object with unique identity that persists through state changes
- **Value Object:** Immutable object defined by its attributes (no identity)
- **Aggregate:** Cluster of entities and value objects with a root entity
- **Domain Event:** Something that happened in the domain that domain experts care about
- **Repository:** Abstraction for data access
- **Service:** Operation that doesn't naturally belong to an entity or value object

### Sizing Microservices:
"Design a microservice to be no smaller than an aggregate and no larger than a bounded context."

---

# 18. RESOURCES & REFERENCES

## Essential Books
- **Designing Data-Intensive Applications (DDIA)** by Martin Kleppmann -- The bible of distributed systems
- **System Design Interview Vol 1 & 2** by Alex Xu (ByteByteGo)
- **Building Microservices** by Sam Newman
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford
- **Designing Distributed Systems** by Brendan Burns
- **Database Internals** by Alex Petrov
- **Machine Learning System Design Interview** by Ali Aminian & Alex Xu
- **Mobile System Design Interview** by Manuel Vivo

## Online Courses & Platforms
- [ByteByteGo](https://bytebytego.com/) -- Alex Xu's visual system design course
- [Grokking the System Design Interview](https://www.designgurus.io/course/grokking-the-system-design-interview) -- 66 lessons, 18 real-world problems
- [Hello Interview - System Design in a Hurry](https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction)
- [System Design Handbook](https://www.systemdesignhandbook.com/)
- [AlgoMaster System Design](https://algomaster.io/learn/system-design)

## GitHub Repositories
- [system-design-primer](https://github.com/donnemartin/system-design-primer) -- 109k+ stars, Anki flashcards
- [awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources)
- [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) -- Comprehensive open-source guide
- [Sairyss/system-design-patterns](https://github.com/Sairyss/system-design-patterns) -- Patterns with code examples
- [mobile-system-design](https://github.com/weeeBox/mobile-system-design) -- Framework for mobile interviews
- [Machine-Learning-Interviews](https://github.com/alirezadir/machine-learning-interviews) -- ML system design guide

## Engineering Blogs (Must-Read)
- [Netflix TechBlog](https://netflixtechblog.com/) -- Microservices, streaming, ML, chaos engineering
- [Uber Engineering](https://www.uber.com/blog/engineering/) -- Real-time systems, geospatial, ML
- [Meta Engineering](https://engineering.fb.com/) -- Distributed systems, social graph, ML at scale
- [Google Research Blog](https://research.google/blog/) -- MapReduce, Spanner, Bigtable, Borg
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/) -- Cloud-native patterns
- [Cloudflare Blog](https://blog.cloudflare.com/) -- CDN, DNS, edge computing, DDoS
- [Stripe Engineering](https://stripe.com/blog/engineering) -- Payment systems, idempotency, distributed systems
- [LinkedIn Engineering](https://engineering.linkedin.com/blog) -- Kafka, stream processing, data infrastructure
- [Confluent Blog](https://www.confluent.io/blog/) -- Kafka, Flink, event streaming

## Key Papers & Specifications
- **Google MapReduce (2004):** Foundation of big data processing
- **Google Bigtable (2006):** Wide-column store that inspired HBase, Cassandra
- **Amazon Dynamo (2007):** Inspired DynamoDB, Riak, Cassandra's consistency model
- **Google Spanner (2012):** Globally distributed, strongly consistent database
- **Raft Consensus (2014):** "In Search of an Understandable Consensus Algorithm"
- **Kafka (LinkedIn, 2011):** Distributed streaming platform
- **Cassandra (Facebook, 2008):** Wide-column NoSQL database
- **DDIA Key Topics:** Replication, partitioning, transactions, consistency, batch/stream processing

## Microservices Reference
- [microservices.io](https://microservices.io/patterns/) -- Chris Richardson's pattern catalog (Saga, CQRS, Event Sourcing, Outbox, etc.)
- [Azure Architecture Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) -- Cloud design patterns catalog

## Observability & Infrastructure
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Istio Architecture](https://istio.io/latest/docs/ops/deployment/architecture/)
- [Kubernetes Docs](https://kubernetes.io/docs/)

---

## DDIA (Designing Data-Intensive Applications) Chapter Map

| Chapter | Topic | Key Concepts |
|---------|-------|-------------|
| 1 | Reliability, Scalability, Maintainability | Fault tolerance, load parameters, percentiles |
| 2 | Data Models & Query Languages | Relational vs. document vs. graph |
| 3 | Storage & Retrieval | LSM-trees, B-trees, column-oriented |
| 4 | Encoding & Evolution | Protobuf, Avro, Thrift, schema evolution |
| 5 | Replication | Leader-follower, multi-leader, leaderless, quorums |
| 6 | Partitioning | Key range, hash, secondary indexes, rebalancing |
| 7 | Transactions | ACID, isolation levels, serializable snapshot isolation |
| 8 | Distributed System Challenges | Unreliable networks, clocks, truth/lies |
| 9 | Consistency & Consensus | Linearizability, ordering, Raft/Paxos, 2PC |
| 10 | Batch Processing | MapReduce, dataflow engines (Spark) |
| 11 | Stream Processing | Event logs, Kafka, stream joins, exactly-once |
| 12 | Future of Data Systems | Derived data, end-to-end correctness |

---

## Grokking System Design Interview -- Problem List

### Entry Level:
1. Design a URL Shortener (TinyURL)
2. Design an API Rate Limiter
3. Design a Web Crawler
4. Design a Distributed Cache
5. Design a CDN

### Mid Level:
6. Design Instagram/Twitter Feed
7. Design a Chat System (Facebook Messenger)
8. Design a Notification System
9. Design a Search Autocomplete
10. Design a News Feed

### Advanced:
11. Design YouTube/Netflix
12. Design Uber/Lyft
13. Design Google Maps
14. Design a Distributed Message Queue
15. Design a Ticketing System (Ticketmaster)
16. Design a Payment System
17. Design a Recommendation System
18. Design Google Docs (Real-time Collaboration)

---

*This curriculum was compiled from exhaustive research across ByteByteGo, system-design-primer, Grokking the System Design Interview, DDIA, and engineering blogs from Netflix, Uber, Google, Meta, Stripe, LinkedIn, and Cloudflare.*

*Last updated: April 2026*
