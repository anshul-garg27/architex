# Event-Driven Architecture

## What Is Event-Driven Architecture?

Event-Driven Architecture (EDA) treats **events as first-class citizens**. Instead
of services directly calling each other, they communicate by producing and
consuming events. An event represents **a fact that something happened** --
"OrderPlaced," "PaymentProcessed," "UserSignedUp."

### Core Components

```
  ┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
  │   PRODUCER   │──emit──>│   EVENT CHANNEL  │──deliver──>│  CONSUMER   │
  │ (publishes   │        │  (broker / bus)   │        │ (subscribes  │
  │  events)     │        │                  │        │  to events)  │
  └──────────────┘        └──────────────────┘        └──────────────┘

  Producer: Knows nothing about consumers. Just says "this happened."
  Channel:  Stores, routes, and delivers events (Kafka, RabbitMQ, etc.)
  Consumer: Subscribes to event types it cares about. Processes independently.
```

**Key principle:** Producers and consumers are **decoupled**. The producer does
not know (or care) who consumes the event, or even if anyone does.

---

## The Four Types of Event-Driven Patterns

### 1. Event Notification

The simplest form. A service emits a thin event saying "something happened."
Consumers decide whether they care and may call back for details.

```
  Order Service ──> "OrderPlaced { orderId: 123 }" ──> Email Service
                                                   ──> Analytics Service

  Event is small -- just a notification with an ID.
  Consumer calls back to Order Service for full details if needed.
```

**Pros:** Minimal coupling, small event payloads
**Cons:** Consumers may need to call back, creating implicit coupling

### 2. Event-Carried State Transfer

The event contains **all the data** the consumer needs. No callback required.

```
  Order Service ──> "OrderPlaced {
                       orderId: 123,
                       userId: 456,
                       items: [...],
                       total: $99.50,
                       shippingAddress: {...}
                    }" ──> Shipping Service (has everything it needs)
                       ──> Invoice Service  (has everything it needs)
```

**Pros:** Consumers are fully independent (no callbacks), better availability
**Cons:** Larger event payloads, data duplication, stale data risk

### 3. Event Sourcing

Instead of storing current state, store **the complete sequence of events** that
led to the current state. State is derived by replaying events.

```
  Traditional (state-based):        Event Sourcing:
  ┌───────────────────────┐         ┌──────────────────────────────┐
  │ Account: #42          │         │ Event Log for Account #42:   │
  │ Balance: $750         │         │                              │
  │ (current state only)  │         │ 1. AccountOpened($0)         │
  └───────────────────────┘         │ 2. MoneyDeposited($1000)     │
                                    │ 3. MoneyWithdrawn($200)      │
  You only know the balance.        │ 4. MoneyWithdrawn($50)       │
  You do not know the history.      │                              │
                                    │ Replay: $0+1000-200-50=$750  │
                                    │ You know EVERYTHING.         │
                                    └──────────────────────────────┘
```

**Pros:** Complete audit trail, can replay to any point in time, natural fit
for event-driven systems, enables temporal queries ("what was the state Tuesday?")

**Cons:** Complexity (rebuilding state from events), eventual consistency,
event schema evolution is hard, storage grows indefinitely (use snapshots)

### 4. CQRS (Command Query Responsibility Segregation)

Separate the **write model** (commands) from the **read model** (queries).
Often paired with Event Sourcing.

```
  ┌─────────────────────────────────────────────────────────┐
  │                        CQRS                             │
  │                                                         │
  │   WRITE SIDE                      READ SIDE             │
  │                                                         │
  │   Command ──> Command   ──>  Events ──> Event    ──>    │
  │   (POST,      Handler       published   Handler         │
  │    PUT,       validates,     to bus      updates         │
  │    DELETE)    writes to                  read-           │
  │              event store                 optimized       │
  │                                          view DB         │
  │   ┌──────────────┐              ┌──────────────┐        │
  │   │ Event Store  │              │ Read DB      │        │
  │   │ (write-      │   ──events──>│ (denormalized│        │
  │   │  optimized)  │              │  query-      │  ──> Query
  │   └──────────────┘              │  optimized)  │     (GET)
  │                                 └──────────────┘        │
  └─────────────────────────────────────────────────────────┘
```

**Pros:** Independent scaling of reads vs. writes, optimized query models,
natural fit for complex domains

**Cons:** Eventual consistency between write and read models, increased
infrastructure complexity, must handle stale reads

---

## Architecture Diagram: Fan-Out Pattern

```
                    ┌────────────────────┐
                    │   Order Service    │
                    │    (Producer)      │
                    └─────────┬──────────┘
                              │
                    emit: "OrderPlaced"
                              │
                              v
              ┌───────────────────────────────┐
              │         EVENT BUS             │
              │    (Kafka / EventBridge)      │
              └───┬──────┬──────┬──────┬─────┘
                  │      │      │      │
    ┌─────────────┘      │      │      └─────────────┐
    │             ┌──────┘      └──────┐             │
    v             v                    v             v
┌────────┐ ┌──────────┐        ┌──────────┐ ┌────────────┐
│ Email  │ │Inventory │        │ Payment  │ │ Analytics  │
│Service │ │ Service  │        │ Service  │ │  Service   │
│        │ │          │        │          │ │            │
│Send    │ │Reserve   │        │Charge    │ │Record in   │
│confirm-│ │stock     │        │customer  │ │data        │
│ation   │ │          │        │          │ │warehouse   │
└────────┘ └──────────┘        └──────────┘ └────────────┘

  ORDER SERVICE does not know about ANY of these consumers.
  Adding a new consumer = zero changes to the producer.
```

---

## Pros

| Advantage                  | Detail                                            |
|----------------------------|---------------------------------------------------|
| **Loose coupling**             | Producers and consumers know nothing about each other |
| **Scalability**                | Consumers scale independently based on their load  |
| **Audit trail**                | Events are immutable facts -- natural audit log    |
| **Temporal decoupling**        | Producer and consumer do not need to be online simultaneously |
| **Extensibility**              | Add new consumers without modifying existing services |
| **Resilience**                 | If a consumer is down, events queue up and replay later |
| **Natural load leveling**      | Message queue absorbs traffic spikes               |

---

## Cons

| Disadvantage                  | Detail                                           |
|-------------------------------|--------------------------------------------------|
| **Eventual consistency**          | State across services is NOT immediately consistent |
| **Debugging difficulty**          | Tracing an event through 10 consumers is hard      |
| **Event ordering challenges**     | Out-of-order events can corrupt state              |
| **Schema evolution**              | Changing an event schema affects all consumers     |
| **Duplicate processing**          | Consumers must be idempotent (at-least-once delivery) |
| **Complexity overhead**           | Message brokers, dead letter queues, retry policies |
| **Testing difficulty**            | Hard to test the full event flow end-to-end        |

---

## Event Ordering and Idempotency

### Ordering Guarantees

```
  Message Queue (SQS):     No ordering guarantee (best effort)
  Kafka (per partition):   Strict ordering within a partition
  Kinesis (per shard):     Strict ordering within a shard

  Strategy: Use a partition key (e.g., orderId) to ensure
  all events for a given entity go to the same partition.

  Events for Order #123:  Created -> Paid -> Shipped  (correct order)
```

### Idempotency

```
  Problem: A consumer may receive the same event twice
           (at-least-once delivery).

  Solution: Make consumers idempotent.

  ┌──────────────────────────────────────────────────┐
  │  Consumer receives "OrderPaid { orderId: 123 }"  │
  │                                                  │
  │  1. Check: Have I processed order 123 before?    │
  │     - Look up orderId in idempotency table       │
  │  2. If yes: skip (already processed)             │
  │  3. If no: process + record orderId as processed │
  └──────────────────────────────────────────────────┘
```

---

## Dead Letter Queues (DLQ)

```
  Main Queue                    Dead Letter Queue
  ┌──────────────┐              ┌──────────────┐
  │ Event A      │──> Consumer  │ Event C      │  (failed 3x)
  │ Event B      │    processes │ Event F      │  (failed 3x)
  │ Event C (!)  │──> fails     │              │
  │ Event D      │    retry 1   └──────────────┘
  │              │    retry 2          │
  │              │    retry 3          │ Alert team,
  │              │    move to DLQ ─────┘ investigate,
  └──────────────┘                       replay manually
```

Events that fail repeatedly are moved to a DLQ for manual investigation,
preventing a poison message from blocking the entire queue.

---

## Technologies Comparison

```
  Technology        Model         Ordering    Retention    Best For
  ────────────────────────────────────────────────────────────────────
  Apache Kafka      Log-based     Per-partition  Days/weeks  High-throughput
                    (pull)                       (configurable) streaming

  RabbitMQ          Queue-based   Per-queue     Until        Task queues,
                    (push)                      consumed     RPC, routing

  AWS SQS           Queue-based   FIFO or       Up to 14    Simple queuing,
                    (pull)        standard      days         AWS-native

  AWS EventBridge   Bus-based     No guarantee  24 hours     AWS event routing,
                    (push)                                   SaaS integration

  Redis Streams     Log-based     Per-stream    Configurable Low-latency,
                    (pull)                                   simple setups

  Apache Pulsar     Log-based     Per-partition  Tiered      Multi-tenancy,
                    (pull/push)                 (infinite)   geo-replication
```

### Kafka vs. RabbitMQ (Most Common Interview Question)

```
  Kafka:                            RabbitMQ:
  - Log-based (events persisted)    - Queue-based (consumed = gone)
  - Consumer pulls                  - Broker pushes to consumer
  - Replay events from any offset   - No replay (once consumed)
  - Throughput: millions/sec         - Throughput: tens of thousands/sec
  - Best for: event streaming,       - Best for: task distribution,
    data pipelines, event sourcing     request-reply, routing patterns
```

---

## When to Use Event-Driven Architecture

```
  GREAT FIT:                                POOR FIT:

  [x] Async workflows (order processing)   [ ] Simple CRUD with few entities
  [x] Multiple consumers for same event     [ ] Need immediate consistency
  [x] Audit trail / compliance needs        [ ] Low event volume (overhead
  [x] Loose coupling between services           not justified)
  [x] Absorb traffic spikes (load leveling) [ ] Team lacks experience with
  [x] Real-time data streaming                   distributed systems
  [x] System extensibility (add consumers)  [ ] Simple request-response APIs
```

---

## Real-World Examples

### Uber (Trip Lifecycle Events)
```
  Driver accepts ──> "TripAccepted" event
  Trip starts    ──> "TripStarted" event
  Trip ends      ──> "TripEnded" event

  Consumers: billing, driver payments, ETA prediction,
  surge pricing, analytics, rider notifications

  Uses Apache Kafka with thousands of topics.
```

### Netflix (Playback Events)
- Every play, pause, skip, and buffer event is published to Kafka
- ~8 million events per second at peak
- Consumers: real-time analytics, recommendation engine, CDN optimization,
  A/B testing framework, content popularity rankings
- Events are the foundation of their entire data platform

### LinkedIn (Activity Feed)
- Built Kafka (literally -- Kafka was created at LinkedIn)
- Every like, share, comment, connection is an event
- Activity feed is reconstructed from events
- Processes trillions of events per day

### Banking and Finance
- Event sourcing is standard for financial ledgers
- Every transaction is an event, balances are derived
- Complete audit trail for regulatory compliance
- Can reconstruct account state at any point in time

---

## Designing Events: Best Practices

```
  1. Event Naming:   Past tense ("OrderPlaced", not "PlaceOrder")
                     PlaceOrder is a COMMAND, OrderPlaced is an EVENT.

  2. Event Schema:   Include enough context to be useful:
                     {
                       "eventType": "OrderPlaced",
                       "eventId": "uuid-123",
                       "timestamp": "2025-01-15T10:30:00Z",
                       "version": 1,
                       "data": {
                         "orderId": "order-456",
                         "userId": "user-789",
                         "total": 99.50
                       }
                     }

  3. Versioning:     Use event version field for schema evolution.
                     Consumers should tolerate unknown fields (open schema).

  4. Idempotency:    Always include a unique eventId.
                     Consumers use it to deduplicate.
```

---

## Interview Tips

**Q: "How do you handle eventual consistency in event-driven systems?"**
A: (1) Accept it as a trade-off -- design UIs that handle "processing" states.
(2) Use correlation IDs to track event flows. (3) Implement read-your-writes
consistency where critical (route reads to the write model briefly after a
write). (4) Use sagas with compensating events for business transactions.

**Q: "Event Sourcing vs. traditional CRUD -- when would you choose each?"**
A: Event Sourcing when you need: audit trails, temporal queries, complex domain
logic (DDD aggregates), or undo/redo capability. Traditional CRUD when: simple
domains, team is unfamiliar with ES, or you need simple queries over current
state. Event Sourcing adds significant complexity -- use it deliberately.

**Q: "How do you debug a problem in an event-driven system?"**
A: (1) Distributed tracing with correlation IDs (every event carries a
trace_id). (2) Centralized logging aggregated by correlation ID. (3) Event
replay in a staging environment. (4) Dead letter queue inspection for failed
events. (5) Schema registry to detect contract violations early.

**Q: "Kafka vs. a traditional message queue for microservices?"**
A: Use Kafka when: you need event replay, multiple consumers for the same event,
high throughput, or event sourcing. Use a message queue (RabbitMQ/SQS) when: you
need task distribution (work queues), request-reply patterns, or simple point-to-
point messaging. Many systems use both.

---

## Key Takeaways

```
  1. Events represent facts ("something happened"), not commands.
  2. Four patterns: Notification, State Transfer, Event Sourcing, CQRS.
  3. Eventual consistency is the fundamental trade-off.
  4. Idempotent consumers are non-negotiable.
  5. Dead letter queues prevent poison messages from blocking processing.
  6. Kafka for streaming and replay; RabbitMQ for task queues and routing.
  7. Event-driven architecture excels at extensibility and loose coupling.
```
