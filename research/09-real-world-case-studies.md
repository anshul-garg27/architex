# Real-World System Architecture Case Studies (55+ Systems)

> Every system includes: key components, unique decisions, scaling challenges, and simulation targets.

---

## TIER 1 — Classic System Design Interview (Highest Simulation Value)

### 1. Twitter/X — Fanout Architecture
- **Key Insight:** Fanout-on-write (push tweet to all follower timelines) vs fanout-on-read (pull on request). Hybrid for celebrities.
- **Components:** Fanout Service, Timeline Service (Redis), Manhattan (custom KV store), Snowflake ID generator, Earlybird (real-time search), Twemproxy
- **Simulate:** Tweet propagation through follower graph, Snowflake ID generation, celebrity problem

### 2. Uber — Geospatial Dispatch
- **Key Insight:** Google S2 cells for geospatial indexing. Ringpop for consistent hashing.
- **Components:** Dispatch (DISCO), S2 Geospatial Index, Location Service (millions GPS pings/s), ETA Service, Surge Pricing
- **Simulate:** Driver matching on map, surge pricing dynamics, trip state machine

### 3. Netflix — CDN + Streaming
- **Key Insight:** Open Connect CDN in ISP networks. Control plane on AWS, data plane on own CDN.
- **Components:** Open Connect Appliances, Zuul Gateway, Eureka (discovery), EVCache, Cassandra, Kafka+Flink
- **Simulate:** CDN content placement, adaptive bitrate streaming, chaos engineering (Chaos Monkey)

### 4. WhatsApp — Connection Management
- **Key Insight:** Erlang/BEAM VM = millions of lightweight processes per server. ~2M TCP connections/server.
- **Components:** Erlang servers, XMPP-based protocol, Mnesia DB, E2E encryption (Signal Protocol)
- **Simulate:** Connection management, message delivery (send→server→queue→deliver→ack), offline queuing

### 5. YouTube — Video Pipeline
- **Key Insight:** Vitess (MySQL sharding middleware). 500+ hours of video uploaded/minute.
- **Components:** Vitess, Video Processing Pipeline (100+ format transcoding), Bigtable, Recommendation Engine
- **Simulate:** Video processing DAG, Vitess query routing, adaptive streaming, CDN cache hierarchy

### 6. Google Search — Inverted Index
- **Key Insight:** Scatter-gather query across thousands of index shards. PageRank for ranking.
- **Components:** Googlebot crawler, Inverted Index, PageRank, Spanner, MapReduce/Dataflow, Colossus/GFS
- **Simulate:** Inverted index build/query, PageRank iterations, scatter-gather fan-out

### 7. Amazon — Dynamo + Saga
- **Key Insight:** Availability > consistency (Dynamo paper). Bezos API mandate = origin of microservices.
- **Components:** DynamoDB, Cart Service, Order Pipeline (Saga), Recommendation Engine, SQS/SNS
- **Simulate:** Shopping cart with vector clocks, order Saga with compensation, Black Friday auto-scaling

### 8. Instagram — Sharding + Feed
- **Key Insight:** Scaled Django/Python to 1B+ users. Custom Postgres sharding approach.
- **Components:** Django backend, PostgreSQL (sharded), Cassandra (feed), ML Feed Ranking, Celery
- **Simulate:** Sharding strategy, feed ranking pipeline, like counter (high-write eventual consistency)

---

## TIER 2 — Modern Systems

### 9. Discord — Elixir + ScyllaDB
- **Key:** BEAM VM for connections (like WhatsApp). Migrated Cassandra→ScyllaDB. SFU for voice.
- **Simulate:** Guild message flow, voice SFU routing, lazy member loading

### 10. Spotify — Recommendation
- **Key:** Collaborative filtering + audio analysis + NLP. Discover Weekly pipeline.
- **Simulate:** Matrix factorization, audio feature extraction, explore/exploit bandit

### 11. Dropbox — Block Sync
- **Key:** 4MB blocks, content-addressable storage, deduplication. Migrated S3→Magic Pocket.
- **Simulate:** Block-level delta detection, conflict resolution, deduplication

### 12. Zoom — SFU Video
- **Key:** SFU (not MCU) for scalable video. SVC for adaptive quality.
- **Simulate:** SFU packet routing, SVC quality layers, bandwidth adaptation

### 13. TikTok — For You Feed
- **Key:** Algorithm IS the product. Multi-stage ranking. Cold start in minutes.
- **Simulate:** Multi-stage pipeline (millions→10), interest vector building, explore/exploit

### 14. Reddit — Ranking
- **Key:** Hot = log10(|votes|) + sign(votes) × age/45000. Wilson score for comments.
- **Simulate:** Hot ranking formula, Wilson confidence intervals, comment tree sorting

### 15. Slack — WebSocket + Presence
- **Key:** Persistent WebSocket connections. Flannel edge cache. Permission-aware search.
- **Simulate:** WebSocket lifecycle, presence heartbeats, channel message ordering

---

## TIER 3 — Infrastructure Components (16-30)

| # | System | Core Challenge | Key Concept |
|---|--------|---------------|-------------|
| 16 | URL Shortener | Key generation, redirects | Base62, read-heavy cache |
| 17 | Web Crawler | Politeness, dedup, frontier | BFS/DFS, robots.txt |
| 18 | Notification System | Multi-channel delivery | Priority queues, fan-out |
| 19 | Chat System | Real-time, delivery guarantees | WebSockets, message queues |
| 20 | Typeahead | Prefix matching, low latency | Trie, precomputation |
| 21 | API Rate Limiter | Distributed counting | Token bucket, sliding window |
| 22 | Distributed KV Store | Consistency, partitioning | Dynamo-style (hashing, vectors) |
| 23 | Unique ID Generator | Global uniqueness, ordering | Snowflake |
| 24 | Google Maps | Routing, tile serving | Quadtree, A*, map tiles |
| 25 | Ticket Booking | Seat reservation, no double-book | Distributed locking |
| 26 | Metrics/Monitoring | Time-series, alerting | TSDB, rollup, PromQL |
| 27 | Distributed Task Scheduler | Scheduling, failure handling | DAG, worker pools |
| 28 | Payment System | Idempotency, distributed txns | PCI compliance, Saga |
| 29 | Cloud Storage (S3) | Durability, eventual consistency | Erasure coding, checksums |
| 30 | CI/CD Pipeline | Task scheduling, parallelism | DAG, artifact storage |

## TIER 4 — Additional Systems (31-55)

31. DNS System, 32. Load Balancer, 33. Distributed Cache, 34. Object Storage, 35. Logging (ELK), 36. Time-Series DB, 37. Collaborative Editor (Google Docs), 38. Image Processing, 39. Gaming Backend, 40. IoT Platform, 41. Blockchain Exchange, 42. Video Processing, 43. Feature Flag System, 44. Auth System (OAuth), 45. Workflow Engine (Temporal), 46. Ad Serving, 47. Stock Exchange, 48. Food Delivery (3-sided marketplace), 49. Hotel Reservation, 50. Email Service, 51. Social Network (LinkedIn), 52. Ride Sharing (Lyft), 53. CDN (Cloudflare), 54. Data Warehouse, 55. ML Feature Store

---

## SIMULATION PRIORITY (by educational value)

**Tier 1:** Twitter Fanout, Uber Dispatch, Amazon Dynamo Cart, Google Search, Dropbox Sync, Netflix CDN, TikTok Feed, Zoom SFU

**Tier 2:** WhatsApp Messaging, YouTube Processing, Spotify Recs, Reddit Ranking, Slack Real-time, Discord Voice, Consistent Hashing

**Tier 3:** Rate Limiter, Snowflake ID, Saga Pattern, Circuit Breaker, Load Balancer Algorithms
