# Microservices & Advanced Architecture Patterns (29 Patterns)

> Every pattern with: what it is, how it works, real-world usage, and what to simulate interactively.

---

## COMMUNICATION PATTERNS

### 1. Saga Pattern (Distributed Transactions)
- **Choreography:** Services emit events, others react. No coordinator. Decentralized.
- **Orchestration:** Central coordinator tells each service what to do. Maintains state machine.
- **Compensation:** On failure, compensating transactions cascade backward.
- **Simulate:** Step-by-step order saga (Order→Payment→Inventory→Shipping), failure injection at any step, toggle choreography vs orchestration.

### 2. CQRS + Event Sourcing
- **Write side:** Commands → Event Store (append-only)
- **Read side:** Projections built from events → optimized read models
- **Simulate:** Events appending, projection rebuilding, eventual consistency lag, multiple read models from same events.

### 3. Service Mesh / Sidecar
- Every service gets a sidecar proxy (Envoy). All traffic flows through it.
- Control plane (Istio) configures all sidecars: routing, mTLS, retries, circuit breaking.
- **Simulate:** Traffic through sidecars, mTLS handshake, canary traffic splitting, circuit breaker in sidecar.

### 4. API Gateway
- Single entry point: routing, auth, rate limiting, aggregation, transformation.
- **Simulate:** Request routing, rate limiting rejection, request aggregation (fan-out to 3 services), cache hit/miss.

### 5. Backend for Frontend (BFF)
- Separate API for each frontend (Web BFF, Mobile BFF).
- **Simulate:** Same action from web vs mobile showing different payload sizes (web: 12KB, mobile: 3KB).

### 6. Strangler Fig (Migration)
- Facade routes to monolith or new microservices. Gradually shift more routes.
- **Simulate:** Timeline animation of monolith shrinking, traffic % shifting over time.

### 7. Bulkhead Pattern
- Isolated thread/connection pools per downstream dependency.
- **Simulate:** One service slow → its pool fills up, others stay healthy. Compare with vs without bulkheads.

### 8. Ambassador Pattern
- Helper sidecar handles networking: retries, circuit breaking, TLS, discovery.
- **Simulate:** Main service makes local call, ambassador handles complex outbound.

---

## DATA PATTERNS

### 9. Database Per Service
- Each service owns its database. No shared DBs. Polyglot persistence.
- **Simulate:** Query needing multi-service data → API composition vs event sync.

### 10. Change Data Capture (CDC)
- CDC connector (Debezium) reads database WAL → publishes to Kafka → downstream consumers.
- **Simulate:** Write → WAL entry → CDC capture → Kafka event → search index + cache update.

### 11. Event-Driven Architecture
- Services communicate via events, not direct calls.
- **Types:** Event notification, event-carried state transfer, event sourcing.
- **Simulate:** Fan-out, ordering, dead letter queue, back-pressure.

### 12. Transactional Outbox
- Write data + outbox entry in SAME transaction. Relay publishes from outbox to broker.
- **Simulate:** Atomic write visualization, failure without outbox vs with outbox.

### 13. Two-Phase Commit vs Saga
- **2PC:** Prepare→Commit/Rollback. Strong consistency but blocking.
- **Saga:** Local transactions + compensation. Eventual consistency but available.
- **Simulate:** Side-by-side same scenario. Show 2PC blocking on coordinator failure.

---

## SCALING PATTERNS

### 14. Horizontal vs Vertical Scaling
- **Simulate:** Single server scaling up (bigger) vs scaling out (more servers). Show cost curves.

### 15. Auto-Scaling
- Reactive (CPU>70%), Predictive (historical patterns), Scheduled.
- **Simulate:** Traffic pattern → auto-scaler adding/removing instances, lag, thrashing without cooldown.

### 16. Read Replica Pattern
- Primary handles writes, replicas handle reads. Async replication.
- **Simulate:** Write on primary → replication lag → stale read on replica → failover promotion.

### 17. Write-Ahead Log (WAL)
- Write to WAL (sequential, fast) before data pages. Crash recovery by replaying WAL.
- **Simulate:** Write → WAL → crash → recovery replay. Checkpoint process.

### 18. Hot Spot / Partition Key
- Bad partition key → uneven distribution → hot partition.
- **Simulate:** Good key (even bars) vs bad key (one tall bar). Celebrity user problem.

---

## RESILIENCE PATTERNS

### 19. Circuit Breaker
- **States:** CLOSED → OPEN → HALF-OPEN → CLOSED
- **Simulate:** Animated state machine, failure counter, tripping, timeout, probe requests.
- **Config:** failure_threshold=50%, window=10 calls, timeout=30s, probes=3.

### 20. Retry with Exponential Backoff + Jitter
- **Full jitter (AWS recommended):** delay = random(0, base × 2^attempt)
- **Simulate:** Timeline showing retries, thundering herd without jitter vs with jitter.

### 21. Rate Limiting Algorithms (Side-by-Side)
- **Token Bucket:** Allows bursts. Tokens refill at fixed rate.
- **Leaky Bucket:** Constant output rate. Smooths bursts.
- **Fixed Window:** Count per window. Edge-of-window burst problem.
- **Sliding Window Log:** Exact but memory-heavy.
- **Sliding Window Counter:** Hybrid. Good accuracy, lower memory.
- **Simulate:** All 5 algorithms side-by-side with identical bursty traffic.

### 22. Bulkhead (Thread Pool Isolation)
- Named pools per dependency. Pool full → reject, others unaffected.
- **Simulate:** Pool utilization gauges, one service slow → its pool exhausted.

---

## OBSERVABILITY PATTERNS

### 23. Distributed Tracing
- Trace ID propagated through all services. Each creates Spans.
- **Simulate:** Waterfall/Gantt chart, span propagation, critical path highlighting.

### 24. Log Aggregation (ELK)
- Services → Filebeat/Fluent Bit → Logstash → Elasticsearch → Kibana.
- **Simulate:** Log pipeline flow, search by correlation ID, alert on error spike.

### 25. Metrics (Prometheus/Grafana)
- Prometheus scrapes /metrics endpoints. PromQL for queries. Grafana for dashboards.
- **Metric types:** Counter, Gauge, Histogram, Summary.
- **Simulate:** Scrape cycle, RED metrics dashboard, alert firing.

### 26. Health Check Pattern
- **Liveness:** Is process alive? (no → restart)
- **Readiness:** Can it handle traffic? (no → remove from LB)
- **Simulate:** DB down → readiness fails → LB stops routing. Liveness failure → restart.

### 27. Correlation ID
- UUID generated at entry point, propagated through all services in headers.
- **Simulate:** Trace one request across all services using correlation ID.

---

## DEPLOYMENT PATTERNS

### 28. Blue-Green Deployment
- Two identical environments. Switch traffic instantly.
- **Simulate:** Traffic switch animation between blue and green.

### 29. Canary Release
- Gradual rollout: 1% → 5% → 25% → 100%.
- **Simulate:** Traffic split with metric monitoring, rollback on degradation.

---

## SIMULATION PRIORITY RANKING

**Tier 1 (Highest Impact):**
1. Circuit Breaker — state machine animation
2. Saga Pattern — step-by-step with failure
3. Rate Limiting — 5-algorithm comparison
4. CQRS + Event Sourcing — event flow
5. Auto-Scaling — instances scaling in response to load

**Tier 2 (High Impact):**
6. Distributed Tracing — waterfall chart
7. Hot Spot — partition load distribution
8. Read Replica + Replication Lag
9. Bulkhead — thread pool isolation
10. Retry + Backoff — thundering herd demo
