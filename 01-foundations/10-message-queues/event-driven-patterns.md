# Event-Driven Architecture Patterns

---

## Event Sourcing

### The Core Idea

Instead of storing **current state**, store the **sequence of events** that led
to the current state. Derive state by replaying events from the beginning.

```
  Traditional (state-based):
  +-------------------------------+
  | Account: user-123             |
  | Balance: $150                 |   <-- only current state, history lost
  +-------------------------------+

  Event Sourced:
  +-------------------------------+
  | Event 1: AccountCreated($0)   |
  | Event 2: Deposited($200)      |
  | Event 3: Withdrew($50)        |   <-- full history, replay to get $150
  +-------------------------------+
  Current state = replay(events) = $0 + $200 - $50 = $150
```

### Architecture

```
  Command                 Event Store                  Projections
  (intent)               (source of truth)            (read views)

  +----------+   validate   +------------------+   project   +----------------+
  | "Withdraw|------------>| Event Store       |----------->| Balance View   |
  |  $50"    |   + append   | (append-only,    |            | user-123: $150 |
  +----------+              |  immutable log)  |            +----------------+
                            |                  |
                            | [Created $0    ] |----------->| Transaction    |
                            | [Deposited $200] |            | History View   |
                            | [Withdrew $50  ] |            | (all events)   |
                            +------------------+            +----------------+
                                    |
                                    +----->  Event Bus (Kafka, etc.)
                                    |       for other services to consume
                                    v
                            +----------------+
                            | Audit Log      |
                            | (free!)        |
                            +----------------+
```

### Event Store Properties

```
  1. APPEND-ONLY:  Events are only added, never modified or deleted
  2. IMMUTABLE:    Once written, an event cannot be changed
  3. ORDERED:      Events for an entity are strictly ordered (sequence number)
  4. ENTITY-KEYED: Events grouped by aggregate/entity ID

  Storage format:
  +----------+--------+---------+---------------------+-----------------+
  | event_id | entity | seq_num | event_type          | payload (JSON)  |
  +----------+--------+---------+---------------------+-----------------+
  | evt-001  | acc-123|    1    | AccountCreated      | {"balance": 0}  |
  | evt-002  | acc-123|    2    | MoneyDeposited      | {"amount": 200} |
  | evt-003  | acc-123|    3    | MoneyWithdrawn      | {"amount": 50}  |
  | evt-004  | acc-456|    1    | AccountCreated      | {"balance": 0}  |
  +----------+--------+---------+---------------------+-----------------+
```

### Projections (Materialized Views)

Events are the source of truth, but you need **queryable views** for reads.
Projections consume events and build read-optimized data structures.

```
  Event Stream                          Projections
  +-----------------------+
  | AccountCreated(acc-1) |------+----> Balance Projection
  | MoneyDeposited(200)   |      |      { acc-1: $150, acc-2: $500 }
  | MoneyWithdrawn(50)    |      |
  | AccountCreated(acc-2) |      +----> Monthly Summary Projection
  | MoneyDeposited(500)   |      |      { Jan: $700, Feb: $0 }
  +-----------------------+      |
                                 +----> Top Accounts Projection
                                        [acc-2: $500, acc-1: $150]
```

**Key insight:** You can create NEW projections at any time by replaying the
entire event history. Need a new report? Replay events into a new view.

### Snapshots

Replaying millions of events for every read is expensive. **Snapshots** capture
periodic state to avoid full replay.

```
  Events:  [1] [2] [3] [4] [5] [6] ... [999,997] [999,998] [999,999] [1,000,000]
                              ^                                            ^
                              |                                            |
                     Snapshot at event 5:                       Current: replay
                     { balance: $150 }                         from snapshot + events 6-1M

  Without snapshot: replay ALL 1,000,000 events     (slow)
  With snapshot:    load snapshot(5) + replay 999,995 events  (still slow)
  With recent snapshot at 999,990: load + replay 10 events   (fast!)
```

**Snapshot strategy:**
- Every N events (e.g., every 100 or 1,000)
- Every N minutes
- On demand (when read latency exceeds threshold)

### Schema Evolution

Events are immutable, but your schema will change over time. How do you
handle old events with a different structure?

```
  v1: { "type": "OrderPlaced", "amount": 100 }
  v2: { "type": "OrderPlaced", "amount": 100, "currency": "USD" }
  v3: { "type": "OrderPlaced", "amount": { "value": 100, "currency": "USD" } }
```

**Strategies:**

1. **Upcasting:** Transform old events to new format on read
```python
def upcast(event):
    if event.version == 1:
        event.data["currency"] = "USD"  # default
        event.version = 2
    if event.version == 2:
        event.data["amount"] = {"value": event.data["amount"],
                                 "currency": event.data.pop("currency")}
        event.version = 3
    return event
```

2. **Weak schema:** Use flexible formats (JSON), handle missing fields with defaults
3. **New event types:** Introduce `OrderPlacedV2` alongside `OrderPlaced`
4. **Copy-transform:** Migrate entire event store to new schema (expensive, rare)

### When to Use Event Sourcing

```
  USE when:
  - Full audit trail is required (finance, healthcare, legal)
  - You need to know WHY state changed, not just WHAT it is
  - Temporal queries ("what was the balance on March 15?")
  - Complex domain with business rules that evolve
  - Event-driven architecture with downstream consumers

  DO NOT USE when:
  - Simple CRUD with no audit requirements
  - High-frequency updates to the same entity (too many events)
  - Team is unfamiliar with the pattern (steep learning curve)
  - No clear events in the domain
```

---

## CQRS (Command Query Responsibility Segregation)

### The Core Idea

Separate the **write model** (commands) from the **read model** (queries).
Use different data stores optimized for each.

```
  Traditional (single model):
  +--------+                   +----------+
  | Client | --- read/write -->| Database |
  +--------+                   +----------+
  (same model for reads and writes, compromise on both)

  CQRS (separated):
  +--------+   command   +-----------+   events   +----------+   query   +--------+
  | Client |------------>| Write DB  |----------->| Read DB  |<---------| Client |
  +--------+             | (commands)|            | (queries)|          +--------+
                         +-----------+            +----------+
                         Normalized,              Denormalized,
                         consistent,              fast reads,
                         write-optimized          read-optimized
```

### Full CQRS Architecture

```
                           WRITE SIDE                      READ SIDE

  +--------+          +---------------+              +---------------+
  |        |  Command |               |   Domain     |               |
  | Client |--------->| Command       |   Events     | Event         |
  |        |          | Handler       |------------->| Handler       |
  +--------+          |               |              |               |
                      +-------+-------+              +-------+-------+
                              |                              |
                              v                              v
                      +---------------+              +---------------+
                      |  Write Store  |              |  Read Store   |
                      |  (Postgres,   |              |  (Elastic,    |
                      |   Event Store)|              |   Redis,      |
                      +---------------+              |   DynamoDB)   |
                                                     +---------------+
                                                             ^
                                                             |
                                                     +-------+-------+
                                                     | Client        |
                                                     | (queries)     |
                                                     +---------------+
```

### Write Side: Commands

Commands represent **intent** to change state. They are validated and may
be accepted or rejected.

```python
# Command: an instruction to do something
class PlaceOrderCommand:
    order_id: str
    user_id: str
    items: List[OrderItem]
    total: Decimal

# Command Handler: validates and executes
class PlaceOrderHandler:
    def handle(self, cmd: PlaceOrderCommand):
        # Validate
        if not self.user_repo.exists(cmd.user_id):
            raise UserNotFoundError()
        if cmd.total <= 0:
            raise InvalidOrderError()

        # Persist event (source of truth)
        event = OrderPlacedEvent(
            order_id=cmd.order_id,
            user_id=cmd.user_id,
            items=cmd.items,
            total=cmd.total,
            timestamp=now()
        )
        self.event_store.append(event)

        # Publish event for read side
        self.event_bus.publish(event)
```

### Read Side: Queries

Queries read from **denormalized, pre-computed views** that are updated
asynchronously from events.

```python
# Event Handler: updates read model
class OrderProjection:
    def on_order_placed(self, event: OrderPlacedEvent):
        # Update denormalized read store
        self.read_db.upsert("orders", {
            "order_id": event.order_id,
            "user_name": self.user_cache.get_name(event.user_id),
            "item_count": len(event.items),
            "total": event.total,
            "status": "PLACED",
            "placed_at": event.timestamp
        })

        # Update user's order count
        self.read_db.increment("user_stats", event.user_id, "order_count")

# Query: simple read from optimized store
def get_user_orders(user_id):
    return read_db.query("orders", user_id=user_id)  # fast, no joins
```

### Eventual Consistency

The read model is **eventually consistent** with the write model. There is a
delay between writing a command and the read model reflecting the change.

```
  T=0ms:   Client sends PlaceOrder command
  T=5ms:   Write DB stores event (write confirmed)
  T=5ms:   Client gets "Order placed" response
  T=10ms:  Event published to bus
  T=50ms:  Read model updated with new order
  T=50ms+: Client can see order in read queries

  GAP: 5ms - 50ms where write succeeded but read model hasn't caught up
```

**Handling the gap:**
1. **Read-your-writes:** After write, redirect reads to write store temporarily
2. **Optimistic UI:** Client assumes success, shows optimistic state
3. **Polling:** Client polls until read model catches up
4. **Version tracking:** Include event sequence in response, wait for read model version

### When to Use / When NOT to Use CQRS

```
  USE CQRS when:
  - Read and write patterns are very different (different data shapes)
  - Read scale >> write scale (10:1 or more)
  - Complex queries that need denormalized data
  - Used with Event Sourcing (natural fit)
  - Multiple read models needed (search, analytics, API)

  DO NOT USE CQRS when:
  - Simple CRUD application
  - Strong consistency required (reads must reflect latest writes)
  - Small scale (overhead not justified)
  - Team unfamiliar with eventual consistency
  - Simple domain model (same shape for reads and writes)
```

---

## Transactional Outbox Pattern

### The Problem

You need to **update a database** AND **publish an event** atomically.
If either fails alone, your system is inconsistent.

```
  PROBLEM: Two separate operations, no atomicity

  def place_order(order):
      db.save(order)          # Step 1: succeeds
      kafka.publish(event)    # Step 2: FAILS (Kafka down)
                              # DB updated but event never published!
                              # Downstream services never learn about the order

  OR:
      kafka.publish(event)    # Step 1: succeeds
      db.save(order)          # Step 2: FAILS (DB down)
                              # Event published but order not saved!
```

### The Solution: Outbox Table

Write the event to an **outbox table** in the **same database transaction**
as the business data. A separate process reads the outbox and publishes events.

```
  +-------------------------------------------------------------------+
  |                    SINGLE DATABASE TRANSACTION                     |
  |                                                                   |
  |   +------------------+        +------------------+                |
  |   | Orders Table     |        | Outbox Table     |                |
  |   | INSERT order-123 |        | INSERT event     |                |
  |   +------------------+        | {order_placed,   |                |
  |                               |  order-123,      |                |
  |                               |  payload...}     |                |
  |                               +------------------+                |
  +-------------------------------------------------------------------+
         COMMIT (atomic -- both succeed or both fail)

  Separate process (polling or CDC):
  +------------------+    read     +------------------+    publish    +-------+
  | Outbox Table     |----------->| Relay / Poller   |------------->| Kafka |
  | [event pending]  |            |                  |              +-------+
  +------------------+            +------------------+
                                        |
                                  mark as published
```

### Implementation

```sql
-- Outbox table schema
CREATE TABLE outbox (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(255) NOT NULL,     -- 'Order'
    entity_id   VARCHAR(255) NOT NULL,     -- 'order-123'
    event_type  VARCHAR(255) NOT NULL,     -- 'OrderPlaced'
    payload     JSONB NOT NULL,            -- full event data
    created_at  TIMESTAMP DEFAULT NOW(),
    published   BOOLEAN DEFAULT FALSE
);

-- Business logic: single transaction
BEGIN;
  INSERT INTO orders (id, user_id, total, status)
  VALUES ('order-123', 'user-456', 99.99, 'PLACED');

  INSERT INTO outbox (entity_type, entity_id, event_type, payload)
  VALUES ('Order', 'order-123', 'OrderPlaced',
          '{"order_id":"order-123","user_id":"user-456","total":99.99}');
COMMIT;
```

### Publishing Strategies

**Option 1: Polling** (simple)
```python
while True:
    events = db.query("SELECT * FROM outbox WHERE published = FALSE ORDER BY created_at LIMIT 100")
    for event in events:
        kafka.publish(event.event_type, event.payload)
        db.execute("UPDATE outbox SET published = TRUE WHERE id = ?", event.id)
    sleep(1)  # poll interval
```

**Option 2: CDC / Debezium** (recommended)
- Read the database's transaction log (binlog/WAL)
- Publish changes as events automatically
- No polling needed, lower latency, more reliable

---

## Change Data Capture (CDC)

### The Core Idea

Read the database's internal **change log** (binlog for MySQL, WAL for Postgres)
and publish those changes as events. The database becomes an event source
without any application code changes.

```
  +----------+   write    +----------+   binlog/WAL   +-----------+   publish   +-------+
  | App      |----------->| Database |--------------->| CDC Tool  |------------>| Kafka |
  | (normal  |            | (MySQL,  |                | (Debezium)|            | Topic |
  |  writes) |            |  Postgres)|               +-----------+            +-------+
  +----------+            +----------+                                              |
                                                                                    v
                                                                           +----------------+
                                                                           | Consumers:     |
                                                                           | - Search index |
                                                                           | - Cache sync   |
                                                                           | - Data lake    |
                                                                           | - Analytics    |
                                                                           +----------------+
```

### Debezium

The most popular open-source CDC platform. Runs as a **Kafka Connect** source
connector.

```
  Supported databases:
  - MySQL (binlog)
  - PostgreSQL (WAL / logical replication)
  - MongoDB (oplog / change streams)
  - SQL Server (change tables)
  - Oracle (LogMiner)
  - Cassandra, Db2, Vitess, Spanner
```

### CDC Event Format

```json
{
  "before": {                    // state BEFORE the change
    "id": 123,
    "name": "Alice",
    "email": "alice@old.com"
  },
  "after": {                     // state AFTER the change
    "id": 123,
    "name": "Alice",
    "email": "alice@new.com"
  },
  "source": {
    "connector": "postgres",
    "db": "users",
    "table": "accounts",
    "lsn": 123456789
  },
  "op": "u",                    // c=create, u=update, d=delete, r=read(snapshot)
  "ts_ms": 1700000000000
}
```

### CDC Use Cases

```
  1. SYNC DATABASES:     Primary DB --> CDC --> Replica DB (cross-region)
  2. SEARCH INDEX:       Postgres --> CDC --> Elasticsearch (full-text search)
  3. CACHE INVALIDATION: DB update --> CDC --> invalidate Redis cache
  4. EVENT SOURCING:     DB writes --> CDC --> event stream (retrofit ES)
  5. DATA LAKE:          OLTP DB --> CDC --> S3/Data Warehouse (analytics)
  6. MICROSERVICE SYNC:  Service A DB --> CDC --> Service B (data sharing)
```

### CDC vs Application-Level Events

```
  +-------------------------+---------------------+----------------------+
  | Criteria                | CDC                 | App-Level Events     |
  +-------------------------+---------------------+----------------------+
  | Code changes needed     | None (reads DB log) | Must add publishing  |
  | Captures all changes    | Yes (including       | Only changes that    |
  |                         | direct DB updates)   | go through app code  |
  | Event granularity       | Row-level (low)      | Domain-level (rich)  |
  | Schema                  | DB columns           | Custom event schema  |
  | Latency                 | Sub-second           | Milliseconds         |
  | Legacy system support   | Excellent            | Requires refactoring |
  +-------------------------+---------------------+----------------------+
```

**Best practice:** Use CDC for data synchronization and infrastructure-level
concerns. Use application-level events for domain events with business meaning.

---

## Saga Pattern (Distributed Transactions via Events)

### The Problem

In microservices, a business process spans multiple services, each with its
own database. You cannot use a single ACID transaction across services.

```
  Place Order (spans 3 services):
  1. Order Service:     Create order
  2. Payment Service:   Charge credit card
  3. Inventory Service: Reserve stock

  What if payment succeeds but inventory fails?
  --> Need to UNDO payment (compensating transaction)
```

### Choreography Saga (Event-Driven)

Each service publishes events. The next service in the chain reacts.
No central coordinator.

```
  +----------+  OrderCreated  +----------+  PaymentCharged  +-----------+
  | Order    |--------------->| Payment  |----------------->| Inventory |
  | Service  |                | Service  |                  | Service   |
  +----------+                +----------+                  +-----------+
       ^                           |                             |
       |                           |                             |
       |   OrderFailed             |  PaymentFailed              | StockReserved
       +---(if compensation)-------+---(if compensation)--------+
```

```
  Happy path:
  1. Order Service:     create order     --> publish OrderCreated
  2. Payment Service:   charge card      --> publish PaymentCharged
  3. Inventory Service: reserve stock    --> publish StockReserved
  4. Order Service:     mark confirmed   --> publish OrderConfirmed

  Failure (inventory out of stock):
  3. Inventory Service: stock unavailable --> publish StockReservationFailed
  4. Payment Service:   REFUND card       --> publish PaymentRefunded (compensate)
  5. Order Service:     CANCEL order      --> publish OrderCancelled (compensate)
```

### Orchestration Saga (Centralized)

A **saga orchestrator** manages the workflow, sending commands to each service
and handling responses.

```
  +-------------------+
  | Saga Orchestrator |
  | (Order Saga)      |
  +--------+----------+
           |
           | 1. CreateOrder cmd         +----------+
           +--------------------------->| Order    |
           |<--- OrderCreated ----------| Service  |
           |                            +----------+
           |
           | 2. ChargePayment cmd       +----------+
           +--------------------------->| Payment  |
           |<--- PaymentCharged --------| Service  |
           |                            +----------+
           |
           | 3. ReserveStock cmd        +-----------+
           +--------------------------->| Inventory |
           |<--- StockReservationFailed-| Service   |
           |                            +-----------+
           |
           | 4. RefundPayment cmd (COMPENSATE)
           +--------------------------->| Payment  |
           |<--- PaymentRefunded -------| Service  |
           |
           | 5. CancelOrder cmd (COMPENSATE)
           +--------------------------->| Order    |
           |<--- OrderCancelled --------| Service  |
```

### Choreography vs Orchestration

```
  +----------------------+---------------------+---------------------+
  | Criteria             | Choreography        | Orchestration       |
  +----------------------+---------------------+---------------------+
  | Coordinator          | None (event-driven) | Central orchestrator|
  | Coupling             | Loose               | Tighter (to orch.)  |
  | Visibility           | Hard to trace flow  | Clear workflow      |
  | Complexity at scale  | Spaghetti events    | Manageable          |
  | Single point failure | None                | Orchestrator        |
  | Best for             | Simple sagas (2-3)  | Complex sagas (4+)  |
  +----------------------+---------------------+---------------------+
```

### Compensating Transactions

Every step in a saga must have a **compensating action** that undoes its effect.

```
  Step                        Compensation
  -----------------------------------------
  Create order           -->  Cancel order
  Charge credit card     -->  Refund credit card
  Reserve inventory      -->  Release inventory
  Send confirmation email --> (cannot unsend -- accept as side effect)
  Ship package           -->  Create return shipment
```

**Warning:** Some operations are NOT compensatable (sending an email, SMS,
physical shipment). Design sagas to perform irreversible steps LAST.

---

## Idempotent Consumers

### The Problem

With at-least-once delivery, consumers **will** receive duplicate messages.
Processing a duplicate must produce the **same result** as processing it once.

```
  Queue delivers:  [charge $50, msg_id=abc]
  Consumer charges $50, crashes before ACK
  Queue re-delivers: [charge $50, msg_id=abc]
  Consumer charges $50 AGAIN --> customer charged $100 (BUG!)
```

### Strategy 1: Idempotency Key

Include a unique ID in every message. Track which IDs have been processed.

```python
def process_payment(message):
    idempotency_key = message["idempotency_key"]  # e.g., "order-123-payment"

    # Check if already processed
    if redis.sismember("processed_messages", idempotency_key):
        log.info(f"Duplicate message {idempotency_key}, skipping")
        return  # already processed, safe to skip

    # Process the payment
    payment_gateway.charge(message["amount"], message["card"])

    # Mark as processed (with TTL for cleanup)
    redis.sadd("processed_messages", idempotency_key)
    redis.expire("processed_messages", 86400 * 7)  # 7 day TTL
```

### Strategy 2: Deduplication Table (Database)

Use a database table for stronger guarantees (survives Redis failures).

```sql
-- Process payment AND record idempotency key in SAME transaction
BEGIN;
  -- Attempt to insert (fails if duplicate)
  INSERT INTO processed_events (event_id, processed_at)
  VALUES ('evt-abc-123', NOW())
  ON CONFLICT (event_id) DO NOTHING;

  -- Check if insert succeeded (new message) or was skipped (duplicate)
  -- If affected rows = 0, this is a duplicate --> skip
  -- If affected rows = 1, this is new --> process

  -- Only execute if new:
  UPDATE accounts SET balance = balance - 50 WHERE id = 'user-123';
COMMIT;
```

### Strategy 3: Natural Idempotency

Design operations to be inherently safe to repeat.

```
  IDEMPOTENT (safe to repeat):
  - SET status = 'SHIPPED'              (same result no matter how many times)
  - PUT /users/123 { name: "Alice" }    (full replacement)
  - DELETE FROM cart WHERE id = 'item-1' (deleting again = no-op)
  - UPSERT: INSERT ... ON CONFLICT UPDATE

  NOT IDEMPOTENT (dangerous to repeat):
  - UPDATE balance = balance + 100       (adds $100 each time!)
  - INSERT INTO orders (...)             (creates duplicate orders)
  - POST /payments { amount: 50 }        (charges again)
  - counter++                            (increments each time)
```

**Fix non-idempotent operations:**
```sql
-- WRONG: not idempotent
UPDATE accounts SET balance = balance + 100 WHERE id = 'user-123';

-- RIGHT: idempotent (conditional on specific event)
UPDATE accounts SET balance = balance + 100
WHERE id = 'user-123'
AND NOT EXISTS (
    SELECT 1 FROM processed_deposits
    WHERE deposit_id = 'dep-abc-123'
);
INSERT INTO processed_deposits (deposit_id) VALUES ('dep-abc-123')
ON CONFLICT DO NOTHING;
```

### Deduplication Window

You cannot store every processed message ID forever. Use a **time window**.

```
  Kafka consumer lag: typically seconds to minutes
  SQS visibility timeout: 30 seconds default
  Safety margin: 10x the expected redelivery window

  Deduplication window = 7 days (generous, covers most failure scenarios)

  After 7 days, old IDs are purged. If a message is redelivered after 7 days,
  it is almost certainly a system bug, not a normal retry.
```

---

## Pattern Combinations

These patterns are rarely used in isolation. Common combinations:

```
  Event Sourcing + CQRS:
    Events are the write model, projections are the read model.
    Natural fit -- most event-sourced systems use CQRS.

  Transactional Outbox + CDC:
    Write to outbox table, use Debezium to publish events.
    More reliable than polling the outbox.

  Saga + Event Sourcing:
    Each saga step is an event. Compensations are also events.
    Full audit trail of the distributed transaction.

  CDC + CQRS:
    Use CDC to capture writes from the command DB,
    stream them to populate the read DB.

  All Together:
  Command --> Write DB + Outbox (same tx)
          --> CDC reads outbox
          --> Publishes to Kafka
          --> Saga orchestrator coordinates services
          --> Each service uses Event Sourcing
          --> Projections build read models (CQRS)
          --> Consumers are idempotent
```

---

## Interview Quick Reference

```
  "What is Event Sourcing?"
    Store events not state. Replay events to derive current state.
    Append-only, immutable event store. Projections for reads.

  "What is CQRS?"
    Separate write model (commands) from read model (queries).
    Different DBs optimized for each. Eventually consistent reads.

  "What is the Outbox Pattern?"
    Write event to outbox table in same DB transaction as business data.
    Separate process publishes from outbox to message broker.
    Solves dual-write problem (DB + queue atomicity).

  "What is CDC?"
    Read database transaction log (binlog/WAL) and publish changes as events.
    No application code changes needed. Debezium is the standard tool.

  "Choreography vs Orchestration saga?"
    Choreography: services react to events, no coordinator. Simple but hard to trace.
    Orchestration: central coordinator sends commands. Clear flow but single point.

  "How do you handle duplicate messages?"
    1. Idempotency key (track processed message IDs in Redis/DB)
    2. Natural idempotency (design operations safe to repeat)
    3. Deduplication table (same transaction as business logic)
```
