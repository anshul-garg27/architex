# The Ultimate System Design & Low-Level Design Curriculum
## Complete Interview Preparation & Upskilling Guide

> Compiled from 20+ sources: Alex Xu (Vol 1 & 2), ByteByteGo, DDIA (Kleppmann), Grokking the System Design Interview, Gaurav Sen, system-design-primer, Netflix/Uber/Google/Meta/Amazon engineering blogs, and more.

---

# TABLE OF CONTENTS

## PART A: HIGH-LEVEL SYSTEM DESIGN (HLD)
- [1. System Design Interview Problems (75+)](#1-system-design-interview-problems)
- [2. Fundamentals & Core Concepts](#2-fundamentals--core-concepts)
- [3. Back-of-the-Envelope Estimation](#3-back-of-the-envelope-estimation)
- [4. API Design](#4-api-design)
- [5. Distributed Systems Concepts](#5-distributed-systems-concepts)
- [6. Database Concepts](#6-database-concepts)
- [7. Caching](#7-caching)
- [8. Networking Concepts](#8-networking-concepts)
- [9. Load Balancing](#9-load-balancing)
- [10. Message Queues & Streaming](#10-message-queues--streaming)
- [11. Scalability Patterns](#11-scalability-patterns)
- [12. Content Delivery & Storage](#12-content-delivery--storage)
- [13. Security](#13-security)
- [14. Observability & Monitoring](#14-observability--monitoring)

## PART B: LOW-LEVEL DESIGN (LLD)
- [15. LLD / OOD Interview Problems (65+)](#15-lld--ood-interview-problems)
- [16. SOLID Principles & OOP Concepts](#16-solid-principles--oop-concepts)
- [17. All Design Patterns (50+)](#17-all-design-patterns)
- [18. UML Diagrams](#18-uml-diagrams)
- [19. Concurrency & Multi-Threading](#19-concurrency--multi-threading)
- [20. API Design Deep Dive](#20-api-design-deep-dive)
- [21. Code Architecture Patterns](#21-code-architecture-patterns)
- [22. Data Structures for System Design](#22-data-structures-for-system-design)
- [23. Machine Coding Round Guide](#23-machine-coding-round-guide)

## PART C: ADVANCED & SPECIALIZED TOPICS
- [24. Microservices Patterns](#24-microservices-patterns)
- [25. Cloud-Native Design](#25-cloud-native-design)
- [26. Stream Processing](#26-stream-processing)
- [27. Search Systems](#27-search-systems)
- [28. ML System Design](#28-ml-system-design)
- [29. Real-Time Systems](#29-real-time-systems)
- [30. Payment Systems](#30-payment-systems)
- [31. Gaming System Design](#31-gaming-system-design)
- [32. Mobile System Design](#32-mobile-system-design)
- [33. Data Engineering](#33-data-engineering)
- [34. DevOps & CI/CD](#34-devops--cicd)
- [35. Edge Computing & IoT](#35-edge-computing--iot)
- [36. Blockchain/Web3](#36-blockchainweb3)

## PART D: META
- [37. Interview Framework & Methodology](#37-interview-framework--methodology)
- [38. Real-World Case Studies](#38-real-world-case-studies)
- [39. Learning Roadmap](#39-learning-roadmap)
- [40. Resources & References](#40-resources--references)

---

# PART A: HIGH-LEVEL SYSTEM DESIGN (HLD)

---

# 1. System Design Interview Problems

## Tier 1 — Most Frequently Asked (Almost Guaranteed at FAANG)

| # | Problem | Key Concepts |
|---|---------|--------------|
| 1 | Design a URL Shortener (TinyURL/Bitly) | Hashing, base62 encoding, read-heavy, caching, analytics |
| 2 | Design a Rate Limiter | Token bucket, sliding window, distributed rate limiting |
| 3 | Design a Key-Value Store | Consistent hashing, replication, partitioning, CAP |
| 4 | Design a Unique ID Generator | Snowflake, ULID, clock sync, distributed coordination |
| 5 | Design a Notification System | Push/SMS/Email, priority, retry, template engine |
| 6 | Design a News Feed / Timeline | Fan-out on write vs read, ranking, caching |
| 7 | Design a Chat System (WhatsApp/Slack) | WebSockets, message ordering, presence, E2EE |
| 8 | Design a Web Crawler | BFS, URL frontier, politeness, dedup, distributed crawling |
| 9 | Design Search Autocomplete | Trie, top-K, precomputation, personalization |
| 10 | Design YouTube / Netflix | Video transcoding, CDN, adaptive bitrate, recommendations |
| 11 | Design Google Drive / Dropbox | File sync, chunking, dedup, conflict resolution |
| 12 | Design a Social Network (Facebook) | Graph storage, feed ranking, friend suggestions |
| 13 | Design Twitter | Tweet fanout, timeline, search, trending |
| 14 | Design Instagram | Photo storage, feed, stories, CDN, explore |
| 15 | Design an API Rate Limiter | Token bucket, sliding window counter, distributed |

## Tier 2 — Frequently Asked

| # | Problem | Key Concepts |
|---|---------|--------------|
| 16 | Design Google Maps | Geospatial indexing, shortest path, tile rendering, ETA |
| 17 | Design Uber / Lyft | Driver matching, geospatial, surge pricing, ETA |
| 18 | Design DoorDash / UberEats | Order dispatch, delivery assignment, real-time tracking |
| 19 | Design Booking.com / Airbnb | Search, availability, booking, double-booking prevention |
| 20 | Design Amazon (E-Commerce) | Product catalog, cart, order, payment, recommendations |
| 21 | Design Stripe / PayPal | Payment processing, idempotency, reconciliation |
| 22 | Design Ticketmaster | Seat selection, concurrency, inventory, flash sales |
| 23 | Design Google Search | Crawling, indexing, ranking (PageRank), serving |
| 24 | Design Ad Click Aggregation | Stream processing, dedup, real-time aggregation |
| 25 | Design Nearby Friends | Geohashing, proximity, real-time location updates |
| 26 | Design Google Docs | Real-time collaboration, OT/CRDTs, conflict resolution |
| 27 | Design Metrics Monitoring (Datadog) | Time-series DB, alerting, dashboards, aggregation |
| 28 | Design a Message Queue (Kafka) | Topics, partitions, consumer groups, replication |
| 29 | Design a Distributed Cache (Redis) | Sharding, eviction, replication, consistency |
| 30 | Design a CDN | Edge caching, invalidation, origin shield, routing |

## Tier 3 — Commonly Asked

| # | Problem | Key Concepts |
|---|---------|--------------|
| 31 | Design a Stock Exchange | Order book, matching engine, low latency |
| 32 | Design a Leaderboard | Sorted sets, Redis, real-time updates |
| 33 | Design an Online Judge (LeetCode) | Sandboxed execution, queue, judge workers |
| 34 | Design Pastebin | Blob storage, expiration, URL generation |
| 35 | Design Gmail | Email routing, spam filtering, search, IMAP/SMTP |
| 36 | Design Google Calendar | Events, recurring, reminders, conflict detection |
| 37 | Design a Voting / Polling System | Consistency, dedup, real-time results |
| 38 | Design Yelp | Geospatial search, reviews, ranking |
| 39 | Design a Coupon System | Validation, redemption limits, concurrency |
| 40 | Design a Recommendation System | Collaborative filtering, content-based, hybrid |
| 41 | Design a Distributed Lock (ZooKeeper) | Fencing tokens, consensus, TTL |
| 42 | Design a Task Scheduler (Cron at Scale) | Priority queues, sharding, reliability |
| 43 | Design a Multiplayer Game Backend | State sync, tick rate, lag compensation |
| 44 | Design a GDPR Deletion Pipeline | Data lineage, cascading deletes, compliance |
| 45 | Design S3 (Cloud Storage) | Erasure coding, metadata, multipart upload |

## Tier 4 — Advanced / Specialized

| # | Problem | Key Concepts |
|---|---------|--------------|
| 46 | Design a Distributed File System (HDFS/GFS) | Block replication, namenode, heartbeats |
| 47 | Design a Distributed Database (CockroachDB) | Raft, range partitioning, distributed SQL |
| 48 | Design a Consensus System (Raft/Paxos) | Leader election, log replication, safety |
| 49 | Design a Blockchain | Merkle trees, consensus, immutable ledger |
| 50 | Design a DNS System | Recursive resolution, caching, anycast |
| 51 | Design a Load Balancer | L4/L7, health checks, algorithms |
| 52 | Design a Log Aggregation System (ELK) | Collection, indexing, querying, retention |
| 53 | Design a Fraud Detection System | ML pipeline, rules engine, real-time scoring |
| 54 | Design a Feature Store | Online/offline serving, feature engineering |
| 55 | Design an ML Model Serving Platform | A/B testing, canary, model versioning |
| 56 | Design a CI/CD Pipeline | Build, test, deploy stages, rollback |
| 57 | Design Kubernetes-like Orchestrator | Scheduling, scaling, self-healing |
| 58 | Design a Service Mesh | Sidecar proxy, mTLS, observability |
| 59 | Design a Distributed Tracing System | Spans, traces, context propagation |
| 60 | Design a Secret Management System (Vault) | Encryption, access control, rotation |
| 61 | Design a Digital Wallet | Ledger, transactions, idempotency |
| 62 | Design a Subscription Billing System | Recurring charges, proration, dunning |
| 63 | Design a Multi-tenant SaaS Platform | Isolation, data partitioning, billing |
| 64 | Design a Real-Time Analytics Dashboard | Stream processing, materialized views |
| 65 | Design a Flash Sale System | Thundering herd, inventory, queue |
| 66 | Design a Feature Flag System (LaunchDarkly) | Targeting rules, evaluation, rollout |
| 67 | Design an A/B Testing Platform | Experiment assignment, statistical significance |
| 68 | Design a Data Pipeline (Airflow) | DAG scheduling, retries, backfill |
| 69 | Design an Event-Driven Architecture | Event bus, sourcing, schema registry |
| 70 | Design a Photo Storage System (Flickr) | Object storage, thumbnails, CDN |
| 71 | Design an Inventory Management System | Stock tracking, reservations, reorder |
| 72 | Design a Configuration Management System | Versioning, rollout, feature flags |
| 73 | Design a Typeahead with Personalization | Trie + user history, ranking |
| 74 | Design a Spam Detection System | ML + rules, feedback loop |
| 75 | Design a URL Shortener with Analytics | Click tracking, geo, device, referrer |

---

# 2. Fundamentals & Core Concepts

## 2.1 Architecture Styles
- Client-Server Architecture
- Monolithic vs Microservices
- Service-Oriented Architecture (SOA)
- Serverless Architecture
- Event-Driven Architecture
- Peer-to-Peer Architecture
- Modular Monolith

## 2.2 Communication Patterns
- Synchronous vs Asynchronous
- Request-Response model
- Push vs Pull architecture
- Long Polling, Short Polling, WebSockets, Server-Sent Events (SSE)
- Stateful vs Stateless design

## 2.3 Scaling
- Horizontal Scaling (scale out) vs Vertical Scaling (scale up)
- Throughput vs Latency
- Read-heavy vs Write-heavy characterization

## 2.4 Reliability
- Availability vs Consistency tradeoffs
- SLA, SLO, SLI definitions and targets
- Fault Tolerance vs High Availability vs Disaster Recovery
- Failover strategies: active-passive, active-active
- Hot, Warm, Cold standby
- Single Point of Failure (SPOF) identification and elimination
- Graceful Degradation
- Idempotency

## 2.5 Deployment Strategies
- Blue-Green Deployment
- Canary Deployment
- Rolling Deployment
- Feature Flags

---

# 3. Back-of-the-Envelope Estimation

## 3.1 Powers of 2
| Power | Value | Size |
|-------|-------|------|
| 10 | 1,024 | 1 KB |
| 20 | ~1M | 1 MB |
| 30 | ~1B | 1 GB |
| 40 | ~1T | 1 TB |
| 50 | ~1P | 1 PB |

## 3.2 Latency Numbers Every Programmer Should Know
| Operation | Time |
|-----------|------|
| L1 cache reference | ~0.5 ns |
| L2 cache reference | ~7 ns |
| Main memory reference | ~100 ns |
| SSD random read | ~150 us |
| HDD seek | ~10 ms |
| Same datacenter round trip | ~500 us |
| Cross-continental round trip | ~150 ms |

## 3.3 Estimation Techniques
- QPS (Queries Per Second) estimation
- Storage estimation (daily -> monthly -> yearly -> 5-year)
- Bandwidth estimation
- Memory estimation for caching (80/20 rule)
- DAU to QPS conversion
- Peak traffic = 2-5x average
- Read/Write ratio estimation
- Data model size estimation
- Number of servers needed

---

# 4. API Design

## 4.1 REST
- Resource naming (nouns, not verbs): `/users/123` not `/getUser?id=123`
- HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE
- Status codes: 2xx success, 3xx redirect, 4xx client error, 5xx server error
- Pagination: offset-based, cursor-based, keyset
- Filtering, sorting, field selection
- Versioning: URL path (`/v1/`), header, query param
- HATEOAS
- Idempotency keys

## 4.2 GraphQL
- Schema Definition Language (SDL)
- Queries, Mutations, Subscriptions
- N+1 problem and DataLoader pattern
- Over-fetching / under-fetching solved
- Federation for distributed graphs

## 4.3 gRPC / Protocol Buffers
- 4 communication patterns: Unary, Server streaming, Client streaming, Bidirectional
- HTTP/2 multiplexing, binary framing
- Code generation from `.proto` files
- Deadlines/Timeouts propagated across services

## 4.4 WebSockets
- Full-duplex over persistent TCP
- Use cases: chat, live scores, collaborative editing, gaming
- Scaling: sticky sessions, Redis pub/sub for cross-server

## 4.5 API Gateway & BFF Pattern
- Routing, auth, rate limiting, transformation
- Backend for Frontend (BFF): tailored APIs per client type

---

# 5. Distributed Systems Concepts

## 5.1 Theoretical Foundations
- **CAP Theorem**: Consistency, Availability, Partition Tolerance — pick 2 during partition
  - CP: HBase, MongoDB (strong), ZooKeeper
  - AP: Cassandra, DynamoDB, CouchDB
- **PACELC Theorem**: If Partition → AC tradeoff; Else → Latency vs Consistency
- **BASE**: Basically Available, Soft state, Eventually consistent
- **FLP Impossibility**: No deterministic consensus in async system with even 1 fault
- **Byzantine Fault Tolerance**: Handling nodes that lie

## 5.2 Consistency Models
- Strong Consistency (Linearizability)
- Sequential Consistency
- Causal Consistency
- Eventual Consistency
- Read-your-writes Consistency
- Monotonic Read/Write Consistency
- Tunable Consistency (Cassandra: ONE, QUORUM, ALL)
- Quorum: R + W > N

## 5.3 Consensus Algorithms
- **Paxos**: Single-Decree, Multi-Paxos
- **Raft**: Leader election, log replication, safety (easier to understand)
- **Zab**: ZooKeeper Atomic Broadcast
- **Gossip Protocol**: Epidemic protocol for membership and failure detection
- **PBFT**: Practical Byzantine Fault Tolerance

## 5.4 Clocks & Ordering
- Physical clocks and clock drift (NTP limitations)
- Lamport Timestamps (logical clocks)
- Vector Clocks
- Hybrid Logical Clocks (HLC)
- TrueTime (Google Spanner)
- Happens-before relation

## 5.5 Replication
- Single-leader (master-slave)
- Multi-leader (master-master)
- Leaderless (Dynamo-style)
- Synchronous vs Asynchronous replication
- Replication lag, read replicas
- Chain replication

## 5.6 Partitioning / Sharding
- Horizontal vs Vertical partitioning
- Range-based, Hash-based, Directory-based partitioning
- **Consistent Hashing** (with virtual nodes)
- Rendezvous Hashing
- Hotspot / Celebrity problem
- Rebalancing strategies
- Cross-shard queries (scatter-gather)

## 5.7 Conflict Resolution
- Last-Writer-Wins (LWW)
- **CRDTs** (Conflict-free Replicated Data Types): G-Counter, PN-Counter, G-Set, OR-Set
- Operational Transformation (OT) — Google Docs
- Version vectors, dotted version vectors

## 5.8 Distributed Transactions
- Two-Phase Commit (2PC)
- Three-Phase Commit (3PC)
- **Saga Pattern**: Choreography vs Orchestration, compensating transactions
- TCC (Try-Confirm-Cancel)
- Outbox Pattern
- Change Data Capture (CDC)
- Exactly-once vs at-least-once vs at-most-once delivery

## 5.9 Failure Handling
- Fail-stop, crash-recovery, Byzantine failures
- Network partitions (split brain)
- Cascading failures, gray failures
- **Circuit Breaker** (closed → open → half-open)
- Bulkhead pattern
- Retry with exponential backoff + jitter
- Heartbeat mechanisms
- Phi Accrual Failure Detector
- Sloppy quorum and hinted handoff
- Anti-entropy via Merkle trees
- Fencing tokens

## 5.10 Coordination Services
- ZooKeeper: leader election, distributed locks, config, service discovery
- etcd: Raft-based key-value store
- Consul: service mesh + discovery
- Chubby: Google's distributed lock service

---

# 6. Database Concepts

## 6.1 Relational Databases (SQL)
- **ACID**: Atomicity, Consistency, Isolation, Durability
- Normalization (1NF → BCNF) and Denormalization
- **Indexing**: B-Tree, B+ Tree, Hash, Composite, Covering, Partial, Full-text, Bitmap
- **Transactions & Isolation Levels**: Read Uncommitted → Read Committed → Repeatable Read → Serializable
- MVCC (Multi-Version Concurrency Control), Snapshot Isolation
- Locking: Shared/Exclusive, Row/Table level, Optimistic vs Pessimistic, Two-Phase Locking
- Connection pooling (PgBouncer, HikariCP)
- Materialized views
- Common: PostgreSQL, MySQL, Aurora, SQL Server

## 6.2 NoSQL Databases

### Key-Value Stores
- Redis (in-memory, data structures, pub/sub, Cluster, Sentinel)
- Memcached (simple caching, multi-threaded)
- DynamoDB (managed, DAX, Global Tables)

### Document Stores
- MongoDB (BSON, flexible schema, aggregation, sharding)
- CouchDB, Couchbase, Firestore

### Wide-Column Stores
- Cassandra (ring, gossip, tunable consistency, CQL)
- HBase (Hadoop, strong consistency)
- Google Bigtable (SSTable, column families)
- ScyllaDB (C++ Cassandra-compatible)

### Graph Databases
- Neo4j (Cypher, ACID-compliant)
- Amazon Neptune, JanusGraph, Dgraph

### Time-Series Databases
- InfluxDB, TimescaleDB, Prometheus, QuestDB

### Vector Databases
- Pinecone, Milvus, Weaviate, Chroma, pgvector

### Search Engines
- Elasticsearch (inverted index, BM25, distributed)
- Solr, Typesense, Meilisearch

## 6.3 SQL vs NoSQL Decision Framework
- SQL: complex queries, joins, transactions, strong consistency
- NoSQL: flexible schema, horizontal scale, high write throughput
- **Polyglot persistence**: use multiple DB types
- **NewSQL**: CockroachDB, Google Spanner, TiDB, YugabyteDB

## 6.4 Storage Internals
- **LSM Tree**: Memtable → SSTable → Compaction (Cassandra, RocksDB, LevelDB)
- **B-Tree / B+ Tree**: MySQL InnoDB, PostgreSQL
- Write-Ahead Log (WAL)
- Bloom filters (probabilistic membership)
- Column-oriented (Parquet, ORC) vs Row-oriented storage

## 6.5 Database Scaling Patterns
- Read replicas
- Sharding strategies
- CQRS (Command Query Responsibility Segregation)
- Event Sourcing
- Database per service pattern
- Database proxy (Vitess, ProxySQL, PgPool)
- Multi-region deployment

---

# 7. Caching

## 7.1 Caching Strategies
| Strategy | Description | Use When |
|----------|-------------|----------|
| Cache-Aside (Lazy Loading) | App checks cache first, loads from DB on miss | General purpose, read-heavy |
| Read-Through | Cache loads from DB on miss transparently | Simplified app code |
| Write-Through | Write to cache and DB simultaneously | Need strong consistency |
| Write-Behind (Write-Back) | Write to cache, async flush to DB | Write-heavy, can tolerate lag |
| Write-Around | Write directly to DB, bypass cache | Write-once, read-rarely data |
| Refresh-Ahead | Proactively refresh before expiry | Predictable access patterns |

## 7.2 Eviction Policies
- LRU (Least Recently Used), LFU (Least Frequently Used)
- FIFO, Random, TTL-based
- W-TinyLFU (Caffeine cache), ARC (Adaptive Replacement Cache)

## 7.3 Caching Layers
- Client-side (browser, HTTP cache headers)
- CDN (edge caching)
- Application (in-process: Guava, Caffeine)
- Distributed (Redis, Memcached)
- Database query cache
- CPU caches (L1/L2/L3) — for latency estimation

## 7.4 Cache Challenges
| Challenge | Solution |
|-----------|----------|
| Cache Invalidation | TTL, event-based, version-based |
| Cache Stampede / Thundering Herd | Locking, early recomputation, request coalescing |
| Cache Penetration (non-existent keys) | Bloom filter, cache null values |
| Cache Avalanche (mass expiry) | Jittered TTLs |
| Hot Key Problem | Local + distributed cache hybrid, key replication |
| Stale data | Stale-while-revalidate pattern |

---

# 8. Networking Concepts

## 8.1 Protocol Stack
- **L7 (Application)**: HTTP/HTTPS, WebSocket, gRPC, DNS, SMTP
- **L4 (Transport)**: TCP (reliable, ordered), UDP (fast, unreliable)
- **L3 (Network)**: IP, routing
- Load balancers operate at L4 or L7

## 8.2 HTTP Evolution
| Version | Key Features |
|---------|-------------|
| HTTP/1.1 | Persistent connections, pipelining, head-of-line blocking |
| HTTP/2 | Multiplexing, header compression (HPACK), server push, binary |
| HTTP/3 | QUIC (UDP-based), 0-RTT, no head-of-line blocking |

## 8.3 DNS
- Resolution: recursive vs iterative
- Record types: A, AAAA, CNAME, MX, NS, TXT, SRV
- DNS-based load balancing (round robin, geo-based, latency-based)
- Anycast DNS, DNSSEC
- TTL and caching

## 8.4 Real-Time Communication
| Method | Direction | Protocol | Use Case |
|--------|-----------|----------|----------|
| Short Polling | Client→Server | HTTP | Simple, low-frequency |
| Long Polling | Client→Server | HTTP | Near real-time, broader support |
| WebSockets | Bidirectional | TCP | Chat, gaming, collaboration |
| SSE | Server→Client | HTTP | Live feeds, notifications |
| WebRTC | Peer-to-Peer | UDP | Video/audio calls |

## 8.5 TLS/HTTPS
- TLS handshake, certificate exchange, cipher suites
- TLS termination at LB vs end-to-end
- mTLS (mutual TLS) for service-to-service

---

# 9. Load Balancing

## 9.1 Algorithms
| Algorithm | Description | Best For |
|-----------|-------------|----------|
| Round Robin | Sequential distribution | Equal-capacity servers |
| Weighted Round Robin | Proportional to weights | Mixed-capacity servers |
| Least Connections | Route to least busy | Variable request duration |
| IP Hash | Sticky by client IP | Session affinity |
| Consistent Hashing | Minimal redistribution | Distributed caches |
| Least Response Time | Fastest server | Latency-sensitive |
| Power of 2 Random Choices | Random 2, pick least loaded | Large clusters |

## 9.2 Types
- **L4 LB**: TCP/UDP level (fast, less flexible)
- **L7 LB**: HTTP level (content-aware routing)
- **DNS LB**: Geographic / latency-based
- **Client-Side LB**: Service mesh, gRPC
- Software: Nginx, HAProxy, Envoy, Traefik
- Cloud: AWS ALB/NLB, GCP Cloud LB, Azure LB

## 9.3 Key Concepts
- Health checks (active/passive)
- Session persistence (cookie/IP-based)
- SSL termination vs passthrough
- Connection draining
- Redundant LBs (avoid SPOF)

---

# 10. Message Queues & Streaming

## 10.1 Core Concepts
- Point-to-point (queue) vs Pub/Sub (topic)
- Delivery guarantees: at-most-once, at-least-once, exactly-once
- Message ordering: total, partition, none
- Dead letter queues, acknowledgment, deduplication
- Backpressure mechanisms

## 10.2 Technologies
| Technology | Type | Key Feature |
|-----------|------|-------------|
| Apache Kafka | Log-based streaming | Partitions, consumer groups, log compaction |
| RabbitMQ | Traditional MQ | AMQP, exchanges, flexible routing |
| Amazon SQS | Managed queue | Standard vs FIFO, visibility timeout |
| Amazon SNS | Managed pub/sub | Fan-out to SQS, Lambda, HTTP |
| Apache Pulsar | Streaming | Multi-tenant, tiered storage, geo-replication |
| Redis Streams | In-memory streaming | Low-latency, consumer groups |
| NATS | Lightweight MQ | Simple, fast, cloud-native |

## 10.3 Event-Driven Patterns
- Event Sourcing + CQRS
- Transactional Outbox Pattern
- CDC (Change Data Capture) with Debezium
- Event schema evolution and versioning
- Idempotent consumers
- Saga orchestration via events

---

# 11. Scalability Patterns

## 11.1 Core Patterns
- Horizontal/Vertical scaling
- Read replicas + Sharding
- Async processing via message queues
- CQRS + Event Sourcing
- Batch processing vs Stream processing
- MapReduce
- Serverless / FaaS
- Auto-scaling (reactive, predictive, scheduled)
- Connection pooling, compression, prefetching

## 11.2 Microservices Patterns
- Service Discovery (Eureka, Consul, k8s DNS)
- API Gateway (Kong, Envoy, AWS API GW)
- Circuit Breaker (Hystrix, Resilience4j)
- Bulkhead, Sidecar, Ambassador
- Strangler Fig (monolith migration)
- Service Mesh (Istio, Linkerd)
- Database per service
- BFF (Backend for Frontend)
- Retry + exponential backoff + jitter
- Distributed tracing (OpenTelemetry)

## 11.3 Data Processing
| Pattern | Description | Technology |
|---------|-------------|------------|
| Batch | Process accumulated data | Hadoop MapReduce, Spark |
| Stream | Process data in real-time | Kafka Streams, Flink, Storm |
| Lambda Architecture | Batch + Speed + Serving layers | Hadoop + Storm + Cassandra |
| Kappa Architecture | Stream-only (single pipeline) | Kafka + Flink |

## 11.4 Resilience Patterns
- Circuit Breaker, Retry, Timeout, Bulkhead, Fallback
- Rate limiting / throttling, Load shedding
- Graceful degradation
- Health checks (liveness, readiness, startup)
- Chaos engineering (Chaos Monkey, Gremlin)

---

# 12. Content Delivery & Storage

## 12.1 CDN
- Push CDN vs Pull CDN
- Edge locations / PoPs
- Cache invalidation (purge, TTL)
- Dynamic content acceleration
- Video streaming: HLS, DASH, CMAF
- Multi-CDN strategy
- Edge computing (Cloudflare Workers, Lambda@Edge)

## 12.2 Object / Blob Storage
- S3: buckets, versioning, lifecycle, storage classes (hot/warm/cold/glacier)
- Multipart upload, pre-signed URLs
- Content-addressable storage (CAS)
- Erasure coding vs replication for durability

## 12.3 Storage Types
| Type | Description | Example |
|------|-------------|---------|
| Block Storage | Raw blocks, low-level | EBS, SAN |
| File Storage | Hierarchical, shared access | NFS, EFS |
| Object Storage | Flat namespace, HTTP API | S3, GCS, Azure Blob |
| Distributed FS | Large-scale, fault-tolerant | HDFS, GFS, Ceph |

---

# 13. Security

## 13.1 Authentication & Authorization
- Session-based (cookies) vs Token-based (JWT)
- OAuth 2.0 flows (authorization code, PKCE, client credentials)
- OpenID Connect (OIDC)
- SSO, MFA/2FA
- RBAC, ABAC, ACL
- Zero Trust Architecture
- mTLS for service-to-service

## 13.2 Data Security
- Encryption at rest (AES-256), in transit (TLS 1.3), end-to-end (E2EE)
- Key management (KMS, Vault)
- Password hashing (bcrypt, Argon2)
- Data masking, tokenization
- PII compliance (GDPR, HIPAA, PCI-DSS)

## 13.3 Application Security
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding, CSP)
- CSRF prevention (tokens, SameSite cookies)
- Input validation and sanitization

## 13.4 Rate Limiting Algorithms
| Algorithm | Description | Pros |
|-----------|-------------|------|
| Token Bucket | Tokens added at fixed rate, consumed per request | Allows bursts |
| Leaky Bucket | Requests processed at fixed rate | Smooth output |
| Fixed Window | Count per fixed time window | Simple |
| Sliding Window Log | Track each request timestamp | Accurate |
| Sliding Window Counter | Weighted count across windows | Balance of accuracy/memory |

---

# 14. Observability & Monitoring

## 14.1 Three Pillars
| Pillar | Purpose | Tools |
|--------|---------|-------|
| **Logging** | What happened (events) | ELK Stack, Fluentd, CloudWatch |
| **Metrics** | How the system is performing | Prometheus, Grafana, StatsD |
| **Tracing** | How requests flow across services | Jaeger, Zipkin, OpenTelemetry, X-Ray |

## 14.2 Key Methodologies
- **RED Method** (for services): Rate, Error, Duration
- **USE Method** (for resources): Utilization, Saturation, Errors
- **Four Golden Signals** (Google SRE): Latency, Traffic, Errors, Saturation

## 14.3 Alerting & Incident Management
- SLI/SLO/SLA-based alerting, error budgets
- Alert fatigue reduction
- On-call rotation, escalation, runbooks
- Blameless post-mortems

---

# PART B: LOW-LEVEL DESIGN (LLD)

---

# 15. LLD / OOD Interview Problems

## Tier 1 — Most Frequently Asked

| # | Problem | Key Patterns |
|---|---------|-------------|
| 1 | Parking Lot System | Strategy (pricing), Factory (vehicle), Observer, Singleton |
| 2 | Elevator System | Strategy (scheduling), State, Observer, Command |
| 3 | Library Management System | Repository, Observer (notifications), Strategy (fines) |
| 4 | Chess Game | Template Method (moves), Factory, Observer |
| 5 | Tic-Tac-Toe | Strategy (AI), Factory, extensible to N×N |
| 6 | Snake and Ladder | Factory, Strategy (dice), Observer |
| 7 | Movie Ticket Booking (BookMyShow) | Strategy (pricing), Observer, Factory |
| 8 | Hotel Management System | State (room), Strategy, Observer |
| 9 | ATM System | State machine, Chain of Responsibility, Strategy |
| 10 | Vending Machine | State pattern, Strategy (payment) |
| 11 | Online Shopping (Amazon) | Strategy (payment), Observer, Factory, Builder |
| 12 | Social Media (Facebook/Twitter) | Observer, Strategy (feed ranking), Iterator |
| 13 | URL Shortener | Factory, Strategy (encoding) |
| 14 | File System | Composite pattern, Iterator, Visitor |
| 15 | Splitwise / Expense Sharing | Strategy (split type), Observer |

## Tier 2 — Commonly Asked

| # | Problem | Key Patterns |
|---|---------|-------------|
| 16 | Ride-Sharing (Uber/Lyft) | Strategy (matching, pricing), Observer, State |
| 17 | Food Delivery (DoorDash) | Strategy (assignment), Observer, State |
| 18 | Music Streaming (Spotify) | Iterator, Observer, Strategy (shuffle) |
| 19 | Video Streaming (Netflix) | Strategy (quality), Observer, Proxy |
| 20 | Chat Application (WhatsApp) | Observer, Mediator, Command |
| 21 | Stack Overflow (Q&A) | Observer (notifications), Strategy (ranking) |
| 22 | LRU Cache | Doubly linked list + HashMap, O(1) operations |
| 23 | Rate Limiter | Strategy (algorithm), Decorator |
| 24 | Task Scheduler | Priority Queue, Strategy, Observer |
| 25 | Notification System | Observer, Strategy (channel), Chain of Responsibility |
| 26 | Payment System | Strategy (gateway), Command, State |
| 27 | Logging Framework (Log4j) | Singleton, Chain of Responsibility, Strategy |
| 28 | Pub-Sub Messaging System | Observer, Command, Strategy |
| 29 | LinkedIn | Strategy (connection), Observer, Iterator |
| 30 | Calendar Application | Observer, Strategy, State |

## Tier 3 — Advanced

| # | Problem |
|---|---------|
| 31 | Car Rental System |
| 32 | Airline Reservation |
| 33 | Hospital Management |
| 34 | Cricket/Sports Scoreboard |
| 35 | Stock Exchange / Trading |
| 36 | Auction System (eBay) |
| 37 | Online Code Editor |
| 38 | Spreadsheet (Excel) — DAG for formulas |
| 39 | Text Editor — Rope data structure, Command pattern |
| 40 | Banking System |
| 41 | Blackjack / Card Game |
| 42 | Battleship |
| 43 | Minesweeper |
| 44 | Search Autocomplete — Trie |
| 45 | Conference Room Booking |
| 46 | Traffic Signal Control |
| 47 | HashMap from Scratch |
| 48 | Workflow Engine — State machine |
| 49 | Digital Wallet |
| 50 | Online Examination System |
| 51 | Document Collaboration (Google Docs) — OT/CRDTs |
| 52 | Pizza Ordering (Builder pattern) |
| 53 | In-memory Key-Value Store |
| 54 | In-memory File System |
| 55 | Deck of Cards |
| 56 | Custom Iterator |
| 57 | Coupon/Discount Engine |
| 58 | Subscription Management |
| 59 | Multi-player Game Lobby |
| 60 | Food Court Kiosk |
| 61 | Inventory Management |
| 62 | Shopping Cart with Pricing Rules |
| 63 | Social Feed Ranking |
| 64 | Sudoku Solver |
| 65 | Connect Four |

---

# 16. SOLID Principles & OOP Concepts

## 16.1 SOLID Principles

| Principle | Rule | Violation Example | Fix |
|-----------|------|-------------------|-----|
| **S** — Single Responsibility | One class, one reason to change | `User` handles persistence + validation + email | Split into `User`, `UserValidator`, `UserRepository`, `EmailService` |
| **O** — Open/Closed | Open for extension, closed for modification | Adding payment types requires modifying `PaymentProcessor` | Use Strategy pattern, add new strategies |
| **L** — Liskov Substitution | Subtypes replaceable without breaking behavior | `Square extends Rectangle` breaks width/height contract | Use separate shapes or interface |
| **I** — Interface Segregation | No client forced to depend on unused methods | `Worker` with `work()` and `eat()` — robots can't eat | Split into `Workable` and `Feedable` |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | `OrderService` depends on `StripePayment` directly | Depend on `PaymentGateway` interface |

## 16.2 Four Pillars of OOP
1. **Encapsulation** — Bundling data + methods, access modifiers, information hiding
2. **Abstraction** — Hiding complexity, abstract classes vs interfaces
3. **Inheritance** — IS-A, code reuse (prefer composition over inheritance)
4. **Polymorphism** — Compile-time (overloading) + Runtime (overriding)

## 16.3 Key Principles
- **Composition over Inheritance** — HAS-A is more flexible than IS-A
- **Program to an Interface, not an Implementation**
- **Law of Demeter** — Only talk to immediate friends
- **DRY** — Don't Repeat Yourself
- **YAGNI** — You Ain't Gonna Need It
- **KISS** — Keep It Simple
- **Tell, Don't Ask** — Tell objects what to do
- **Command-Query Separation** — Methods either change state or return data, not both
- **Design by Contract** — Preconditions, postconditions, invariants

---

# 17. All Design Patterns

## 17.1 Creational Patterns (how objects are created)

| # | Pattern | Intent | Classic Example |
|---|---------|--------|----------------|
| 1 | **Singleton** | One instance, global access | Logger, DB pool, Config |
| 2 | **Factory Method** | Subclasses decide which class to create | `createShape("circle")` |
| 3 | **Abstract Factory** | Families of related objects | Cross-platform UI factory |
| 4 | **Builder** | Step-by-step construction of complex objects | `Pizza.builder().size(L).build()` |
| 5 | **Prototype** | Clone existing objects | Expensive object creation |
| 6 | **Object Pool** | Reuse expensive objects | DB connections, thread pool |
| 7 | **Dependency Injection** | Inject dependencies externally | Constructor/Setter injection |

## 17.2 Structural Patterns (how objects are composed)

| # | Pattern | Intent | Classic Example |
|---|---------|--------|----------------|
| 1 | **Adapter** | Convert interface to another | XML-to-JSON adapter |
| 2 | **Bridge** | Decouple abstraction from implementation | Remote + TV/Radio |
| 3 | **Composite** | Tree structures, uniform treatment | File system (File + Directory) |
| 4 | **Decorator** | Add responsibilities dynamically | Java I/O streams |
| 5 | **Facade** | Simplified interface to complex subsystem | `HomeTheater.watchMovie()` |
| 6 | **Flyweight** | Share fine-grained objects efficiently | Character rendering, game tiles |
| 7 | **Proxy** | Surrogate/placeholder | Lazy loading, access control, caching |

## 17.3 Behavioral Patterns (how objects communicate)

| # | Pattern | Intent | Classic Example |
|---|---------|--------|----------------|
| 1 | **Strategy** | Interchangeable algorithms | Payment: Credit, PayPal, Crypto |
| 2 | **Observer** | One-to-many notification | Event system, pub-sub |
| 3 | **Command** | Encapsulate request as object | Undo/redo, transaction log |
| 4 | **State** | Alter behavior based on internal state | Vending machine, order lifecycle |
| 5 | **Chain of Responsibility** | Pass request along handler chain | Middleware, approval workflows |
| 6 | **Template Method** | Algorithm skeleton, defer steps | Framework hooks |
| 7 | **Iterator** | Sequential access without exposing internals | Collection traversal |
| 8 | **Mediator** | Centralize complex communication | Chat room, air traffic control |
| 9 | **Memento** | Capture/restore internal state | Undo, checkpointing |
| 10 | **Visitor** | Operations on heterogeneous collections | AST traversal, compiler |
| 11 | **Interpreter** | Grammar and language parsing | DSL, expression evaluation |
| 12 | **Null Object** | Do-nothing default | `NullLogger`, avoid null checks |
| 13 | **Specification** | Composable business rules | `colorSpec.and(sizeSpec)` |

## 17.4 Concurrency Patterns

| # | Pattern | Intent |
|---|---------|--------|
| 1 | Active Object | Decouple method execution from invocation |
| 2 | Monitor Object | Synchronized access to shared object |
| 3 | Reactor | Synchronous event demux (select/epoll) |
| 4 | Proactor | Async event completion dispatching (IOCP) |
| 5 | Producer-Consumer | Decouple via buffer |
| 6 | Read-Write Lock | Concurrent reads, exclusive writes |
| 7 | Thread Pool | Reuse fixed set of threads |
| 8 | Double-Checked Locking | Reduce locking overhead for lazy init |
| 9 | Guarded Suspension | Wait for precondition |
| 10 | Disruptor | Lock-free ring buffer (LMAX) |
| 11 | Pipeline | Stages connected by queues |
| 12 | Fan-Out/Fan-In | Distribute work, collect results |
| 13 | Barrier | Sync point for multiple threads |

## 17.5 Architectural Patterns
- Repository, Unit of Work, Data Mapper, Active Record
- Identity Map, Registry, Service Locator
- Event Sourcing, CQRS

---

# 18. UML Diagrams

## 18.1 Most Important for LLD Interviews

**1. Class Diagram** (always draw this)
- Classes, attributes, methods, visibility (+public, -private, #protected)
- Relationships: Association, Aggregation (hollow diamond), Composition (filled diamond), Inheritance (hollow triangle), Realization (dashed triangle), Dependency (dashed arrow)
- Multiplicity: 1, 0..1, *, 1..*, 0..*

**2. Sequence Diagram** (for specific use cases)
- Lifelines, messages (sync/async), return, fragments (alt, loop, opt)

## 18.2 Other Diagrams (know when to use)
| Diagram | Purpose | When |
|---------|---------|------|
| State Machine | State transitions | Vending machine, order lifecycle, elevator |
| Activity | Workflow / business process | Business logic, parallel processes |
| Use Case | Actors + system scope | Requirements gathering |
| Component | Module boundaries | High-level structure |
| Deployment | Physical infrastructure | Infrastructure design |

## 18.3 UML Relationships (Strength Order)
```
Dependency (weakest) → Association → Aggregation → Composition → Inheritance (strongest)
```

---

# 19. Concurrency & Multi-Threading

## 19.1 Fundamentals
- Thread vs Process (shared memory vs isolated)
- Green threads / Virtual threads / Coroutines
- Thread safety, race conditions, critical sections
- Atomicity, visibility, ordering

## 19.2 Synchronization Primitives
- Mutex, Semaphore, Monitor, Condition Variable
- ReadWriteLock, StampedLock, Spinlock
- ReentrantLock, CountDownLatch, CyclicBarrier, Phaser

## 19.3 Classic Problems
| Problem | Key Concept |
|---------|-------------|
| Producer-Consumer | Bounded buffer, semaphores |
| Readers-Writers | Multiple readers, exclusive writer |
| Dining Philosophers | Resource ordering, arbitrator |
| Sleeping Barber | Semaphore signaling |

## 19.4 Concurrency Pitfalls
- **Deadlock**: Circular wait (4 conditions: mutual exclusion, hold-and-wait, no preemption, circular wait)
- **Livelock**: Responding without progress
- **Starvation**: Never gets resources
- **Priority Inversion**: High-priority waits for low-priority
- **ABA Problem**: Value changes A→B→A (solved by stamped references)
- **False Sharing**: Cache line contention

## 19.5 Lock-Free Programming
- Compare-and-Swap (CAS), Atomic variables
- Lock-free queue (Michael-Scott), Lock-free stack (Treiber)
- Memory barriers, volatile keyword, Java Memory Model

## 19.6 Concurrent Data Structures
- ConcurrentHashMap, ConcurrentLinkedQueue, ConcurrentSkipListMap
- CopyOnWriteArrayList, BlockingQueue variants
- ForkJoinPool (work-stealing)

## 19.7 Async Programming Models
| Model | Description | Language/Framework |
|-------|-------------|-------------------|
| Future/Promise | Placeholder for async result | Java CompletableFuture |
| Async/Await | Syntactic sugar for promises | JS, Python, C#, Kotlin |
| Reactive Streams | Backpressure-aware async | RxJava, Reactor |
| Event Loop | Single-threaded event processing | Node.js, Netty |
| Actor Model | Isolated actors, message passing | Akka, Erlang |
| CSP | Communicating Sequential Processes | Go channels |
| Coroutines | Cooperative multitasking | Kotlin, Python |

---

# 20. API Design Deep Dive

## 20.1 REST Best Practices
- Resource-oriented URLs (nouns, plural)
- Proper HTTP method semantics
- Consistent error response format: `{ error: { code, message, details } }`
- Pagination (cursor-based preferred at scale)
- Idempotency keys for mutations
- Versioning strategy
- ETags for caching
- Rate limiting headers

## 20.2 GraphQL Deep Dive
- Schema-first vs code-first
- N+1 → DataLoader (batching + caching)
- Federation for microservices
- Persisted queries for security
- Query complexity analysis and depth limiting

## 20.3 gRPC Deep Dive
- Protobuf schema evolution (field numbers, backward compat)
- 4 streaming patterns
- Interceptors (middleware equivalent)
- Health checking protocol, reflection
- Load balancing: client-side vs proxy (Envoy)

## 20.4 API Security
- OAuth 2.0, JWT, API keys
- CORS, CSRF protection
- Input validation, rate limiting
- Webhook signature verification

---

# 21. Code Architecture Patterns

## 21.1 Presentation Patterns
| Pattern | Key Idea | Used In |
|---------|----------|---------|
| MVC | Model-View-Controller | Spring, Rails, Django |
| MVP | Passive View, Presenter mediates | Android (pre-MVVM) |
| MVVM | ViewModel + data binding | Android Jetpack, SwiftUI, Vue |
| MVI | Unidirectional: Intent→Model→View | Kotlin, Redux-like |
| Flux/Redux | Unidirectional: Action→Store→View | React ecosystem |
| VIPER | View-Interactor-Presenter-Entity-Router | iOS |

## 21.2 Layered Architectures
| Pattern | Core Idea | Dependency Rule |
|---------|-----------|----------------|
| N-Tier | Presentation→Business→Data | Adjacent layers only |
| Clean Architecture | Entities→UseCases→Adapters→Frameworks | Inward only |
| Hexagonal (Ports & Adapters) | Core + Ports (interfaces) + Adapters | Core knows nothing of outside |
| Onion Architecture | Domain→Services→Infrastructure | Inward only |

## 21.3 Domain-Driven Design (DDD)

**Tactical (building blocks):**
- Entity (identity-based), Value Object (attribute-based, immutable)
- Aggregate + Aggregate Root (consistency boundary)
- Repository, Factory, Domain Service
- Domain Event, Specification

**Strategic (boundaries):**
- Bounded Context, Ubiquitous Language
- Context Map, Anti-Corruption Layer
- Shared Kernel, Customer-Supplier

---

# 22. Data Structures for System Design

## 22.1 Probabilistic Data Structures
| Structure | Purpose | Used In |
|-----------|---------|---------|
| **Bloom Filter** | Probabilistic set membership (no false negatives) | Cache penetration check, spam filter |
| **Count-Min Sketch** | Frequency estimation | Rate limiting, trending topics |
| **HyperLogLog** | Cardinality estimation (unique count) | Unique visitors, distinct counts |

## 22.2 Spatial Data Structures
| Structure | Purpose | Used In |
|-----------|---------|---------|
| **Geohash** | Encode lat/long to string | Proximity search, Nearby |
| **Quadtree** | Recursive spatial subdivision | Maps, collision detection |
| **R-Tree** | Bounding rectangle index | PostGIS, geospatial |
| **S2 Geometry** | Spherical geometry cells | Google Maps |
| **H3** | Hexagonal hierarchical index | Uber |

## 22.3 Core Data Structures
| Structure | System Design Use |
|-----------|------------------|
| **Consistent Hashing Ring** | Distributed caching, partitioning |
| **Trie / Prefix Tree** | Autocomplete, IP routing |
| **Inverted Index** | Full-text search (Elasticsearch) |
| **LSM Tree** | Write-optimized storage (Cassandra, RocksDB) |
| **B+ Tree** | Database indexes |
| **Merkle Tree** | Data integrity, anti-entropy repair |
| **Skip List** | Redis sorted sets, concurrent sorted map |
| **DAG** | Task scheduling, dependency resolution |
| **Ring Buffer** | Rate limiting, streaming, Disruptor |
| **Segment / Fenwick Tree** | Range queries, leaderboards |
| **Rope** | Text editors (efficient insert/delete) |

## 22.4 Key Algorithms
| Algorithm | System Design Use |
|-----------|------------------|
| Consistent Hashing | Distributed caching/partitioning |
| Gossip Protocol | Membership, failure detection |
| Raft / Paxos | Consensus |
| MapReduce | Batch processing |
| Token/Leaky Bucket | Rate limiting |
| Exponential Backoff + Jitter | Retry |
| Geohashing | Proximity search |
| Reservoir Sampling | Stream sampling |
| SimHash / MinHash / LSH | Near-duplicate detection |
| Topological Sort | Build systems, dependencies |

---

# 23. Machine Coding Round Guide

## 23.1 What It Is
- Timed (1-3 hours) implementation round
- Build working application from requirements
- Console-based (usually no UI)
- Judged on: OOP, SOLID, patterns, extensibility, correctness

## 23.2 Evaluation Criteria
1. Code correctness + edge cases
2. OOP design (class hierarchy, encapsulation)
3. SOLID principles adherence
4. Appropriate design patterns
5. Code readability + naming
6. Extensibility (easy to add features)
7. Error handling
8. Separation of concerns

## 23.3 Code Organization Template
```
src/
├── model/       # Domain entities
├── service/     # Business logic
├── repository/  # Data storage
├── strategy/    # Strategy implementations
├── factory/     # Factories
├── exception/   # Custom exceptions
├── enums/       # Status, Type enums
├── observer/    # Event listeners
└── Main.java    # Entry point + demo
```

## 23.4 Implementation Order
1. Enums and Value Objects
2. Domain Models / Entities
3. Interfaces (program to abstractions)
4. Service Layer
5. Factory methods
6. Wire it together in Main
7. Add observers/strategies as needed

## 23.5 Pattern Selection Guide
| Problem Type | Patterns |
|-------------|----------|
| State machine (vending, order) | State, Strategy |
| Board games | Template Method, Factory, Observer |
| Booking systems | Strategy (pricing), Observer, Factory |
| Expense/billing | Strategy (split type), Observer |
| Caching | Strategy (eviction), Decorator, Proxy |
| Logging | Singleton, Chain of Responsibility, Strategy |
| Messaging | Observer, Command, Strategy |
| Rate limiting | Strategy (algorithm), Decorator |

---

# PART C: ADVANCED & SPECIALIZED TOPICS

---

# 24. Microservices Patterns

## 24.1 Saga Pattern
- **Choreography**: Services publish events, next service reacts (simple, decoupled, hard to debug)
- **Orchestration**: Central coordinator directs each step (easier to understand, SPOF risk)
- Every forward action has a compensating "undo" transaction
- All steps must be idempotent

## 24.2 CQRS
- Separate write model (commands) from read model (queries)
- Different databases optimized for each purpose
- Read model updated asynchronously (eventual consistency)
- Use when: read/write ratio heavily skewed, different shapes needed

## 24.3 Event Sourcing
- Store state changes as immutable events, not current state
- Derive current state by replaying events
- Snapshots to avoid full replay
- Schema evolution: upcasting, versioned events

## 24.4 Service Mesh (Istio, Linkerd)
- Sidecar proxy handles networking (mTLS, load balancing, retries)
- Traffic management (canary, A/B, mirroring)
- Observability built in

## 24.5 Other Key Patterns
- **Strangler Fig**: Incrementally migrate monolith to microservices
- **Anti-Corruption Layer**: Translation between bounded contexts
- **Transactional Outbox**: Reliable event publishing with DB transactions
- **Sidecar**: Cross-cutting concerns in a separate container
- **BFF**: Tailored API per client type

---

# 25. Cloud-Native Design

- **12-Factor App**: Codebase, Dependencies, Config, Backing Services, Build/Release/Run, Processes, Port Binding, Concurrency, Disposability, Dev/Prod Parity, Logs, Admin Processes
- **Serverless**: FaaS (Lambda), fan-out/fan-in, cold starts, anti-patterns
- **Containers + Kubernetes**: Pods, Services, Deployments, Ingress, HPA/VPA/KEDA
- **Multi-Region**: Active-active vs active-passive, geo-routing, data replication
- **Cell-Based Architecture**: Blast radius reduction (Amazon pattern)
- **IaC**: Terraform, CloudFormation, Pulumi
- **GitOps**: ArgoCD, Flux (pull-based model)

---

# 26. Stream Processing

## Kafka Deep Dive
- Topics, partitions, consumer groups
- KRaft (replaces ZooKeeper), ISR
- Exactly-once semantics (idempotent producer + transactional API)
- Log compaction, offset management
- Kafka Connect (source/sink), Schema Registry

## Processing Frameworks
| Framework | Model | Latency | Best For |
|-----------|-------|---------|----------|
| Kafka Streams | Stream | Low | Stateful stream processing within Kafka |
| Apache Flink | Stream | Very low | Complex event processing, exactly-once |
| Spark Streaming | Micro-batch | Medium | Batch + streaming unified |
| Apache Storm | Stream | Low | Simple real-time processing |

## Windowing
- Tumbling (fixed, non-overlapping)
- Sliding (fixed, overlapping)
- Session (gap-based)
- Watermarks for late data handling

---

# 27. Search Systems

- **Inverted Index**: term → [doc1, doc2, ...] with positions
- **BM25 Ranking**: improved TF-IDF with document length normalization
- **Elasticsearch Architecture**: Cluster → Nodes → Shards → Segments
- **Tokenization**: stemming, lemmatization, stop words, n-grams
- **Fuzzy Search**: Edit distance (Levenshtein)
- **Learning to Rank (LTR)**: ML-based relevance ranking
- **Hybrid Search**: BM25 + Vector (semantic) search
- **Typeahead**: Trie + ranking + personalization

---

# 28. ML System Design

## Recommendation Systems
- Collaborative filtering (user-user, item-item)
- Content-based filtering
- Deep learning: two-tower model, embeddings
- Hybrid approaches

## MLOps
- Feature Store (online + offline serving)
- ML Pipelines (training, evaluation, deployment)
- Model Serving: batch vs real-time, A/B testing, canary
- Model monitoring, drift detection
- MLOps maturity levels (manual → full automation)

## LLM Serving
- Continuous batching, KV cache paging
- Speculative decoding
- RAG (Retrieval-Augmented Generation)
- Vector database comparison (Pinecone, Milvus, Weaviate)

---

# 29. Real-Time Systems

- **Collaboration**: OT (Google Docs) vs CRDTs (Figma)
- **Presence Systems**: Heartbeats, online/offline/idle
- **Notification Architecture**: Multi-channel, priority, retry, template
- **Live Streaming**: Ingest → Transcode → CDN → Player
- **WebTransport**: HTTP/3-based, successor to WebSockets for some use cases

---

# 30. Payment Systems

- **Authorization → Capture → Settlement** flow
- **Idempotency**: Stripe's atomic phases approach
- **Double-Entry Bookkeeping**: Every transaction debits one account, credits another
- **Fraud Detection**: Rules engine + ML scoring
- **Compliance**: PCI DSS, PSD2, SCA (Strong Customer Authentication)
- **Reconciliation**: Matching internal records with payment processor
- **Handling failures**: Retry, compensating transactions, dead letter queues

---

# 31. Gaming System Design

- **Architecture**: Client-server vs P2P vs Lockstep
- **Netcode**: Tick rate, client-side prediction, server reconciliation, interpolation, lag compensation
- **Matchmaking**: Skill-based (ELO/Glicko), queue-based, lobbies
- **MMO Patterns**: World sharding, zoning, instancing
- **Anti-Cheat**: Server-authoritative state, validation

---

# 32. Mobile System Design

- **Constraints**: Battery, memory, unreliable network
- **Architecture**: MVVM, MVI, VIPER
- **Offline-First**: Local DB, sync queues, conflict resolution
- **Networking**: Request batching, compression, caching
- **Common Problems**: Design Instagram app, Design WhatsApp app, Design offline maps

---

# 33. Data Engineering

| Concept | Description |
|---------|-------------|
| Data Warehouse | Structured, schema-on-write (Snowflake, BigQuery, Redshift) |
| Data Lake | Raw, schema-on-read (S3 + Athena, ADLS) |
| Data Lakehouse | Best of both (Databricks, Delta Lake, Iceberg) |
| Data Mesh | Domain-owned data products |
| Medallion Architecture | Bronze (raw) → Silver (cleaned) → Gold (business) |
| ETL vs ELT | Transform before/after loading |
| CDC | Capture database changes (Debezium) |
| Lambda vs Kappa | Dual pipeline vs stream-only |

---

# 34. DevOps & CI/CD

- **Pipeline**: Build → Test → Security Scan → Deploy → Monitor
- **Deployment**: Blue-Green, Canary, Rolling, Feature Flags
- **GitOps**: ArgoCD, Flux (pull-based, declarative)
- **IaC**: Terraform (multi-cloud), CloudFormation (AWS), Pulumi (code)
- **Kubernetes**: Pods, Services, Deployments, HPA, VPA, KEDA
- **Observability**: Prometheus + Grafana + Loki + Tempo (LGTM stack)

---

# 35. Edge Computing & IoT

- **Three-Tier**: Device → Edge → Cloud
- **IoT Protocols**: MQTT (lightweight pub/sub), CoAP, LoRaWAN
- **Edge Patterns**: Data filtering, local inference, intermittent connectivity
- **Device Management**: Provisioning, OTA updates, fleet management at scale
- **Edge Compute**: Cloudflare Workers, AWS Wavelength, Azure IoT Edge

---

# 36. Blockchain/Web3

- **Consensus**: PoW, PoS, DPoS, BFT variants
- **Smart Contracts**: Solidity, EVM, gas optimization
- **Layer 2**: Optimistic Rollups, ZK Rollups
- **Application Stack**: Frontend → Wallet → Smart Contract → Blockchain → Storage (IPFS)

---

# PART D: META

---

# 37. Interview Framework & Methodology

## The 4-Step Framework (Alex Xu / ByteByteGo)

### Step 1: Requirements & Scope (3-5 min)
- Clarify functional requirements
- Clarify non-functional requirements (scale, latency, consistency)
- DAU, read/write ratio, data retention
- What's in scope vs out of scope

### Step 2: High-Level Design (10-15 min)
- Draw architecture diagram
- Identify core components
- Define APIs (endpoints, request/response)
- Data model / schema
- Walk through main use cases

### Step 3: Deep Dive (10-15 min)
- Deep dive into 2-3 critical components
- Discuss trade-offs explicitly
- Address non-functional requirements
- Handle edge cases
- Specific algorithms / data structures

### Step 4: Wrap Up (3-5 min)
- Summarize design
- Discuss bottlenecks & improvements
- Error handling, monitoring
- Future scaling

## Non-Functional Requirements Checklist
- Scalability (N users, X QPS)
- Availability (99.9%, 99.99%, 99.999%)
- Latency (p50, p95, p99)
- Consistency (strong, eventual, causal)
- Durability, Reliability
- Security, Cost efficiency
- Observability

## Common Interview Mistakes
1. Jumping into solution without clarifying requirements
2. Over-engineering (Google scale when not needed)
3. Not doing back-of-the-envelope math
4. Not discussing trade-offs
5. Ignoring non-functional requirements
6. Single points of failure
7. Monologuing without engaging interviewer

---

# 38. Real-World Case Studies

## Netflix
- 700+ microservices, Zuul API Gateway, Eureka service discovery
- Hystrix circuit breaker, EVCache (Memcached-based)
- Cassandra for storage, Kafka for streaming
- Chaos Monkey / Simian Army
- Adaptive bitrate streaming

## Uber
- H3 hexagonal spatial index, Google S2 geometry
- Ringpop (consistent hashing), DISCO (service discovery)
- Cadence/Temporal (workflow orchestration)
- Domain-Oriented Microservice Architecture (DOMA)
- M3 (metrics), Peloton (scheduler)

## Twitter/X
- Fanout-on-write vs read (hybrid)
- Snowflake ID generator
- Manhattan (KV store), Twemcache/Twemproxy

## Facebook/Meta
- TAO (graph store over MySQL + Memcached)
- RocksDB (LSM storage engine)
- Presto/Trino (distributed SQL)
- Zanzibar (global authorization)
- ShardManager, ZippyDB

## Google
- Bigtable, Spanner (TrueTime), MapReduce, GFS
- Chubby (distributed lock), Borg (cluster mgmt → Kubernetes)
- Dremel (→ BigQuery), Monarch (monitoring)

## Amazon
- Dynamo (consistent hashing, vector clocks, sloppy quorum)
- S3 (eleven 9s durability), Aurora (separated compute + storage)
- Cell-based architecture (blast radius reduction)

## Discord
- Cassandra → ScyllaDB migration for messages
- Elixir for real-time, Rust for performance
- Read states architecture (billions of updates)

## Stripe
- Idempotency in payments (atomic phases)
- Distributed locking for double-charge prevention

## Slack
- Flannel (edge cache), Vitess for MySQL sharding
- WebSockets for real-time messaging

---

# 39. Learning Roadmap

## Phase 1: Foundations (Weeks 1-4)
**Goal**: Build core knowledge

- [ ] Back-of-the-envelope estimation
- [ ] Client-server, monolith vs microservices
- [ ] HTTP, DNS, TCP/UDP basics
- [ ] REST API design
- [ ] SQL databases, indexing, normalization
- [ ] NoSQL types (KV, document, wide-column, graph)
- [ ] CAP theorem, ACID vs BASE
- [ ] Caching (strategies, eviction, Redis)
- [ ] Load balancing (algorithms, L4 vs L7)
- [ ] Message queues basics (Kafka concepts)
- [ ] OOP fundamentals + SOLID principles
- [ ] Top 5 design patterns: Singleton, Factory, Strategy, Observer, Builder

**Practice**: Design URL Shortener, Design Pastebin, Design LRU Cache

---

## Phase 2: Core System Design (Weeks 5-10)
**Goal**: Handle standard interview problems

- [ ] Distributed systems: replication, partitioning, consistent hashing
- [ ] Consistency models (strong, eventual, causal)
- [ ] CDN, blob storage, file storage
- [ ] WebSockets, long polling, SSE
- [ ] Rate limiting algorithms (token bucket, sliding window)
- [ ] Unique ID generation (Snowflake)
- [ ] Search basics (inverted index, Elasticsearch)
- [ ] All GoF design patterns
- [ ] Class diagrams + Sequence diagrams
- [ ] Concurrency basics (threads, locks, producer-consumer)

**Practice**: Design Twitter, Design WhatsApp, Design YouTube, Design Notification System, Design Parking Lot, Design Chess, Design BookMyShow

---

## Phase 3: Advanced (Weeks 11-16)
**Goal**: Handle complex problems and deep dives

- [ ] Consensus (Raft/Paxos), vector clocks
- [ ] Distributed transactions (2PC, Saga)
- [ ] Event Sourcing + CQRS
- [ ] Stream processing (Kafka deep dive, Flink)
- [ ] Microservices patterns (circuit breaker, service mesh, saga)
- [ ] Database internals (LSM tree, B+ tree, WAL)
- [ ] Geospatial indexing (geohash, quadtree)
- [ ] Observability (logging, metrics, tracing)
- [ ] Security (OAuth, JWT, encryption)
- [ ] DDD (tactical + strategic patterns)
- [ ] Clean Architecture / Hexagonal
- [ ] Advanced concurrency (lock-free, CAS, actor model)

**Practice**: Design Google Maps, Design Uber, Design Google Docs, Design Payment System, Design Elevator, Design Stock Exchange, Design Distributed Cache

---

## Phase 4: Specialization (Weeks 17-20)
**Goal**: Stand out with depth in specialized areas

- [ ] ML System Design (recommendations, feature store, model serving)
- [ ] Real-time systems (collaboration, presence)
- [ ] Payment systems (idempotency, double-entry)
- [ ] Cloud-native (12-factor, serverless, Kubernetes)
- [ ] Data engineering (warehouse, lake, medallion, ETL)
- [ ] Multi-region architecture
- [ ] Chaos engineering
- [ ] Machine coding round practice (timed 2-hour sessions)

**Practice**: Design Netflix Recommendation, Design Distributed File System, Design A/B Testing Platform, Design Flash Sale System + 5 machine coding rounds

---

## Phase 5: Interview-Ready (Weeks 21-24)
**Goal**: Polish and simulate

- [ ] Mock interviews (system design + LLD)
- [ ] Practice estimation (20+ problems)
- [ ] Review all case studies
- [ ] Trade-off analysis practice
- [ ] Communication practice (structured walkthrough)
- [ ] Time management (4-step framework)

---

# 40. Resources & References

## Books
| Book | Focus Area |
|------|-----------|
| **Designing Data-Intensive Applications** (Kleppmann) | Distributed systems, databases — THE bible |
| **System Design Interview Vol 1 & 2** (Alex Xu) | HLD problems with step-by-step solutions |
| **Design Patterns** (GoF) | 23 classic OOP patterns |
| **Head First Design Patterns** | Accessible pattern learning |
| **Clean Code** (Robert C. Martin) | Code quality, naming, functions |
| **Clean Architecture** (Robert C. Martin) | Architecture, dependency rules |
| **Refactoring** (Martin Fowler) | Code smells, refactoring catalog |
| **Effective Java** (Joshua Bloch) | Java best practices |
| **Patterns of Enterprise Application Architecture** (Fowler) | Enterprise patterns |
| **Building Microservices** (Sam Newman) | Microservices design |
| **The Art of Scalability** (Abbott & Fisher) | Scale cube, organizational scaling |

## Online Courses & Platforms
- Grokking the System Design Interview (Educative/DesignGurus)
- Grokking Modern System Design (Educative)
- ByteByteGo (Alex Xu)
- Hello Interview — System Design
- AlgoMaster — System Design

## YouTube Channels
- Gaurav Sen (system design fundamentals)
- Tech Dummies (Narendra L)
- System Design Interview (Alex Xu)
- Hussein Nasser (networking, databases)
- Martin Kleppmann lectures

## GitHub Repositories
- `donnemartin/system-design-primer` — The OG system design repo
- `karanpratapsingh/system-design` — Visual system design
- `ashishps1/awesome-system-design-resources` — Curated list
- `tssovi/grokking-the-object-oriented-design-interview` — LLD problems
- `prasadgujar/low-level-design-primer` — LLD primer

## Engineering Blogs
- Netflix TechBlog, Uber Engineering, Meta Engineering
- Google Research Blog, AWS Architecture Blog
- Stripe Engineering, Discord Blog, Slack Engineering
- LinkedIn Engineering, Airbnb Tech, Shopify Engineering
- Cloudflare Blog, Confluent Blog

## Key Papers
- Google MapReduce, GFS, Bigtable, Spanner, Chubby
- Amazon Dynamo
- Facebook TAO, Memcache at Scale
- Raft Consensus (Diego Ongaro)
- Lamport — Time, Clocks, and the Ordering of Events
- Brewer's CAP Theorem

## DDIA Chapter Map
| Chapter | Topic |
|---------|-------|
| 1-2 | Reliability, Scalability, Data Models |
| 3 | Storage & Retrieval (LSM, B-Tree) |
| 4 | Encoding & Evolution |
| 5 | Replication |
| 6 | Partitioning |
| 7 | Transactions |
| 8 | Distributed Systems Problems |
| 9 | Consistency & Consensus |
| 10 | Batch Processing |
| 11 | Stream Processing |
| 12 | Future of Data Systems |

---

# STATISTICS

| Category | Count |
|----------|-------|
| HLD System Design Problems | 75+ |
| LLD / OOD Problems | 65+ |
| Design Patterns | 50+ |
| Distributed Systems Concepts | 60+ |
| Database Topics | 40+ |
| Architecture Patterns | 20+ |
| Advanced Specializations | 13 |
| Real-World Case Studies | 10+ companies |
| Total Topics | 400+ |

---

> **This curriculum covers everything asked at Google, Meta, Amazon, Apple, Netflix, Microsoft, Uber, Stripe, and other top-tier companies. Work through it phase by phase, and you'll be more prepared than 99% of candidates.**
