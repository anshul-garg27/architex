# Message Queues & Event Streaming -- Core Concepts

## Why Message Queues?

Message queues are middleware that enable **asynchronous communication** between
services. They sit between producers (senders) and consumers (receivers), providing
a buffer that decouples the two sides in time, space, and scale.

### The Five Core Benefits

```
1. DECOUPLING         Service A does not need to know about Service B
2. ASYNC PROCESSING   Caller returns immediately, work happens later
3. BUFFERING          Absorb traffic spikes without dropping requests
4. LOAD LEVELING      Smooth out bursty workloads over time
5. EVENT-DRIVEN       React to things that happen, not poll for changes
```

### Without a Queue (Tight Coupling)

```
  +-----------+    HTTP POST     +-----------+
  | Order Svc |---------------->| Email Svc |   Blocks until email sent
  +-----------+                  +-----------+   If Email is down, Order fails
        |         HTTP POST     +-----------+
        +---------------------->| Inventory |   Must know ALL downstream
                                +-----------+   services at compile time
```

### With a Queue (Loose Coupling)

```
  +-----------+     publish     +------------------+    consume    +------------+
  | Order Svc |--------------->|   MESSAGE QUEUE   |------------->| Email Svc  |
  +-----------+                |                    |              +------------+
                               |  [msg][msg][msg]   |
                               |                    |-----+       +------------+
                               +------------------+  |       +-->| Inventory  |
                                                       |           +------------+
                                                       |
                                                       +--------->| Analytics  |
                                                                   +------------+
```

Order service publishes once and moves on. Each downstream consumer reads
independently. If Email service is down, messages wait in the queue --
no data lost, no caller blocked.

---

## Messaging Patterns

### 1. Point-to-Point (Queue Model)

Each message is consumed by **exactly one** consumer. When multiple consumers
listen on the same queue, they **compete** for messages (competing consumers).

```
                        +------------------+
  Producer A ---------> |                  | --------> Consumer 1  (gets msg 1)
  Producer B ---------> |      QUEUE       | --------> Consumer 2  (gets msg 3)
  Producer C ---------> |  [1][2][3][4][5] | --------> Consumer 3  (gets msg 2)
                        +------------------+
                                                Each message delivered to ONE consumer
```

**Use cases:**
- Task/work queues (background jobs, image processing)
- Order processing pipelines
- Any workflow where each item must be processed exactly once

**Scaling:** Add more consumers to increase throughput. The queue distributes
messages among them automatically (round-robin or least-busy).

### 2. Publish-Subscribe (Topic Model)

Each message goes to **ALL** subscribers. Every subscriber gets its own
independent copy of every message.

```
                        +------------------+
                        |                  | --------> Subscriber A (gets ALL)
  Publisher ----------->|      TOPIC       | --------> Subscriber B (gets ALL)
                        |                  | --------> Subscriber C (gets ALL)
                        +------------------+
                                                Each message delivered to ALL subscribers
```

**Use cases:**
- Event notification (user signed up -> email, analytics, recommendation)
- Fan-out: broadcast one event to many independent processors
- Real-time feeds, notifications, chat rooms

### Queue vs Topic -- Decision Matrix

```
  Criteria               | Queue (P2P)        | Topic (Pub/Sub)
  -----------------------+--------------------+--------------------
  Delivery               | One consumer       | All subscribers
  Consumer coupling      | Consumers compete  | Consumers independent
  Scaling pattern        | Add consumers      | Add subscriptions
  Message fate           | Removed after ACK  | Retained per policy
  Typical use            | Work distribution  | Event broadcasting
```

---

## Delivery Guarantees

The hardest problem in distributed messaging: how many times does a consumer
see each message?

### At-Most-Once (Fire and Forget)

```
  Producer ----msg----> Queue ----msg----> Consumer
                                     |
                             (no ACK required)
                             (if consumer crashes, message is LOST)
```

- Producer sends message and does NOT wait for acknowledgment.
- Fastest, lowest latency, simplest.
- Messages **may be lost**, but are never duplicated.
- **Use case:** Metrics/telemetry, logging, real-time sensor data where
  missing one reading is acceptable.

### At-Least-Once (Retry Until ACK)

```
  Producer ----msg----> Queue ----msg----> Consumer
                          |                    |
                          |<-----ACK-----------+  (consumer confirms)
                          |                       (if no ACK, queue RETRIES)
                          |----msg (retry)------> Consumer
```

- Queue holds message until consumer acknowledges.
- If consumer crashes before ACK, the message is **re-delivered**.
- Messages are **never lost**, but **may be duplicated**.
- **Most common guarantee** in production systems.
- **Use case:** Payment processing, order handling, email sending.
  Consumer must be **idempotent** to handle duplicates safely.

### Exactly-Once (The Holy Grail)

```
  Producer ----msg----> Queue ----msg----> Consumer
                          |                    |
                          |<-----ACK-----------+
                          |                    |
                   (dedup on send)    (idempotent processing)
                                      (transactional commit)
```

- Each message is processed **exactly one time** -- no loss, no duplicates.
- Theoretically impossible in the general case (Two Generals' Problem).
- In practice, achieved via:
  1. **Idempotent producers** (Kafka: producer ID + sequence number)
  2. **Transactional consumers** (process + commit offset atomically)
  3. **Deduplication** at the consumer (idempotency key)
- Very expensive in latency and complexity.
- **Use case:** Financial transactions, billing, inventory adjustments.

### Comparison Table

```
  Guarantee       | Lost? | Duplicates? | Complexity | Latency | Common In
  ----------------+-------+-------------+------------+---------+------------
  At-most-once    | Yes   | No          | Low        | Low     | Logging
  At-least-once   | No    | Yes         | Medium     | Medium  | Most apps
  Exactly-once    | No    | No          | High       | High    | Finance
```

---

## Message Ordering

### Total Order

Every consumer sees messages in the **exact same global order**.

```
  Produced: [A, B, C, D, E]
  Consumer sees: [A, B, C, D, E]    <-- always this exact order
```

- Requires a single partition/channel (bottleneck).
- Very expensive, limits throughput.
- **Example:** Single-partition Kafka topic, FIFO SQS queue.

### Partition Order (Kafka Default)

Order is guaranteed **within each partition** but not across partitions.

```
  Partition 0: [A, C, E]   Consumer sees: A, C, E (in order)
  Partition 1: [B, D, F]   Consumer sees: B, D, F (in order)
```

- Messages with the same key go to the same partition (hash-based).
- Best balance of ordering + throughput.
- **Example:** Order events for the same order_id always in order.

### No Ordering (SQS Standard)

Messages may arrive in **any order**. Best-effort ordering only.

```
  Produced: [A, B, C, D, E]
  Consumer might see: [C, A, E, B, D]   <-- any permutation
```

- Highest throughput, simplest implementation.
- Consumer must not depend on order or must sort locally.

---

## Acknowledgment (ACK / NACK)

The mechanism by which a consumer tells the queue: "I have processed this message."

```
  Queue delivers msg to Consumer
       |
       v
  Consumer processes msg
       |
       +-- Success --> ACK  --> Queue removes msg (or advances offset)
       |
       +-- Failure --> NACK --> Queue re-delivers msg (or sends to DLQ)
       |
       +-- Timeout --> No ACK --> Queue re-delivers msg (visibility timeout)
```

### ACK Modes

| Mode           | Behavior                                        | Risk              |
|----------------|------------------------------------------------|-------------------|
| Auto-ACK       | ACK on receive (before processing)              | Data loss         |
| Manual ACK     | ACK after processing complete                   | Duplicates on crash |
| Batch ACK      | ACK after N messages processed                  | Duplicates on crash |
| Transactional  | ACK + side-effects committed atomically          | Slow, complex     |

**Best practice:** Always use manual ACK. Auto-ACK is only appropriate when
message loss is acceptable (metrics, non-critical logs).

---

## Dead Letter Queue (DLQ)

A special queue where messages go after **exceeding the maximum retry count**.

```
  Main Queue                          DLQ
  +------------------+               +------------------+
  | [msg] attempts=1 |---(fail)----->| Retry            |
  | [msg] attempts=2 |---(fail)----->| Retry            |
  | [msg] attempts=3 |---(fail)----->| [msg] DEAD       |------> Alert + Manual Review
  +------------------+               +------------------+
       maxRetries = 3                    msg stored here
```

**Why DLQ matters:**
- Prevents poison messages from blocking the queue forever
- Preserves failed messages for investigation / replay
- Allows main queue to keep processing healthy messages

**DLQ best practices:**
1. Set alerts on DLQ depth (any message in DLQ = potential bug)
2. Include original metadata: timestamp, error, retry count, source
3. Build tooling to inspect and replay DLQ messages
4. Set DLQ retention longer than main queue (days, not hours)

---

## Message Deduplication Strategies

Since at-least-once delivery means duplicates, consumers MUST handle them.

### Strategy 1: Idempotency Key

```
  Producer includes unique ID:  { id: "order-123-payment", amount: 50 }
  Consumer checks: "Have I seen order-123-payment before?"
    - Yes -> skip
    - No  -> process, then record the ID
```

Store processed IDs in a database or cache (Redis SET with TTL).

### Strategy 2: Deduplication Table

```sql
  CREATE TABLE processed_messages (
      message_id  VARCHAR PRIMARY KEY,
      processed_at TIMESTAMP DEFAULT NOW()
  );

  -- Before processing:
  INSERT INTO processed_messages (message_id)
  VALUES ('msg-abc-123')
  ON CONFLICT DO NOTHING
  RETURNING message_id;  -- returns row if NEW, empty if DUPLICATE
```

### Strategy 3: Natural Idempotency

Design operations so repeating them has no additional effect:
- `SET balance = 100` is idempotent (safe to repeat)
- `SET balance = balance + 10` is NOT idempotent (dangerous to repeat)

---

## Backpressure

What happens when producers send messages faster than consumers process them?

```
  Producer Rate: 10,000 msg/s
  Consumer Rate:  2,000 msg/s
  Queue Growth:   8,000 msg/s  --> Queue fills up --> BACKPRESSURE
```

### Backpressure Strategies

| Strategy            | How It Works                                 | Trade-off         |
|---------------------|---------------------------------------------|-------------------|
| Unbounded buffer    | Queue grows without limit                    | OOM risk          |
| Bounded buffer      | Queue rejects when full (back-pressure)      | Producer blocks   |
| Drop oldest         | Discard oldest messages                      | Data loss         |
| Drop newest         | Reject new messages                          | Data loss         |
| Rate limiting       | Throttle producer send rate                  | Slower ingestion  |
| Scale consumers     | Auto-scale consumer instances                | Cost, lag         |

**Best practice:** Bounded queue + consumer auto-scaling + monitoring queue depth.
Alert when queue depth exceeds threshold. Drop is only acceptable for
non-critical data (metrics, logs).

---

## Message Priority

Some messages are more urgent than others.

```
  High Priority Queue:   [payment-failed] [fraud-alert]        --> processed FIRST
  Normal Priority Queue: [send-email] [update-analytics]       --> processed after
  Low Priority Queue:    [generate-report] [cleanup-logs]      --> processed last
```

**Implementation approaches:**
1. **Separate queues per priority** (most common, simplest)
2. **Priority field in message** (RabbitMQ supports natively, max 10 levels)
3. **Weighted consumption** (read 3 from high, 1 from low)

**Warning:** Priority queues can cause starvation -- low-priority messages
may wait indefinitely if high-priority traffic is constant.

---

## Message TTL / Expiration

Messages have a limited lifespan. After TTL expires, the message is discarded
or moved to DLQ.

```
  Message published at T=0, TTL=60s
  T=30s: Consumer picks up --> processed (OK)
  T=70s: Consumer picks up --> message EXPIRED, discarded
```

**Use cases:**
- Time-sensitive notifications (flash sale ending in 5 minutes)
- OTP / verification codes
- Real-time bidding (bid expires after auction window)

**Setting TTL:**
- Per-message TTL (most flexible)
- Per-queue TTL (all messages in queue share same TTL)

---

## Fan-Out / Fan-In Patterns

### Fan-Out: One Event, Many Consumers

```
  Order Placed Event
       |
       +-----------> Email Service      (send confirmation)
       +-----------> Inventory Service  (reserve stock)
       +-----------> Analytics Service  (track conversion)
       +-----------> Fraud Service      (check for fraud)
       +-----------> Recommendation Svc (update model)
```

Implemented via pub/sub topics. Each service subscribes independently.
Adding a new consumer requires zero changes to the producer.

### Fan-In: Many Producers, One Consumer

```
  Web Server 1 --------+
  Web Server 2 --------+--> Log Aggregation Queue --> Log Processor
  Web Server 3 --------+
  Mobile API   --------+
```

Multiple producers write to the same queue. A single consumer (or consumer
group) processes all messages. Common for log aggregation, metrics collection.

---

## Interview Cheat Sheet

```
  "Why message queue?"     -> Decoupling, async, buffering, load leveling
  "Queue vs Topic?"        -> Queue = one consumer, Topic = all subscribers
  "Delivery guarantees?"   -> At-most-once, at-least-once, exactly-once
  "How to handle dupes?"   -> Idempotency key, dedup table, natural idempotency
  "What is a DLQ?"         -> Where failed messages go after max retries
  "Ordering?"              -> Total (expensive), partition (Kafka), none (SQS std)
  "Backpressure?"          -> Producer > consumer rate; bounded queue + autoscale
```
