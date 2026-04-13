# RabbitMQ & Other Message Queue Technologies

---

## RabbitMQ

### Overview

RabbitMQ is a **traditional message broker** built on the **AMQP 0-9-1** protocol.
Unlike Kafka's log-based approach, RabbitMQ is a **smart broker / dumb consumer**
model: the broker handles routing, delivery, and tracking.

```
  +----------+    publish     +-----------+   route    +--------+   deliver   +----------+
  | Producer |-------------->| Exchange  |----------->| Queue  |------------>| Consumer |
  +----------+               +-----------+            +--------+             +----------+
                                  |                       ^
                                  | binding key           |
                                  +-----------------------+
                               (routing rules determine which
                                queue receives which message)
```

### Core Concepts

| Concept       | Description                                              |
|---------------|----------------------------------------------------------|
| **Producer**  | Sends messages to an exchange (never directly to a queue)|
| **Exchange**  | Receives messages and routes them to queues via bindings |
| **Binding**   | Rule linking an exchange to a queue (with routing key)   |
| **Queue**     | Buffer that stores messages until consumed               |
| **Consumer**  | Subscribes to a queue and processes messages             |
| **Routing Key** | Label on a message used by the exchange for routing   |
| **Binding Key** | Pattern on a binding that matches routing keys         |

### Exchange Types

#### 1. Direct Exchange

Routes messages to queues whose **binding key exactly matches** the routing key.

```
  Producer sends:  routing_key = "payment.success"

  +----------+    routing_key     +----------------+
  | Producer |--"payment.success"-->|  Direct       |
  +----------+                    |  Exchange      |
                                  +---+----+---+---+
                                      |    |   |
              binding_key =           |    |   |   binding_key =
              "payment.success"       |    |   |   "payment.failed"
                                      v    |   v
                              +---------+  |  +---------+
                              | Queue A |  |  | Queue C |  (no match, no delivery)
                              +---------+  |  +---------+
                                           |
                                  binding_key = "payment.success"
                                           v
                                     +---------+
                                     | Queue B |  (also matches!)
                                     +---------+
```

**Use case:** Task routing, where each routing key maps to a specific worker type.

#### 2. Fanout Exchange

Routes messages to **ALL bound queues**, ignoring routing keys entirely.

```
  Producer sends: (routing key ignored)

  +----------+              +----------------+
  | Producer |------------->|  Fanout        |
  +----------+              |  Exchange      |
                            +---+----+---+---+
                                |    |   |
                                v    v   v
                          +------+ +------+ +------+
                          |Queue1| |Queue2| |Queue3|   ALL get the message
                          +------+ +------+ +------+
```

**Use case:** Broadcasting events -- notification fanout, log broadcasting.

#### 3. Topic Exchange

Routes based on **wildcard pattern matching** between routing key and binding key.

```
  Wildcards:  * = exactly one word     # = zero or more words

  Routing key: "order.us.completed"

  +----------+                    +----------------+
  | Producer |--"order.us.completed"-->|  Topic    |
  +----------+                    |  Exchange      |
                                  +---+--------+---+
                                      |        |
                    binding_key =     |        |   binding_key =
                    "order.us.*"      |        |   "order.#"
                                      v        v
                              +---------+  +---------+
                              | Queue A |  | Queue B |    Both match!
                              +---------+  +---------+

  "order.us.*"   matches "order.us.completed"  (YES -- * = one word)
  "order.#"      matches "order.us.completed"  (YES -- # = zero or more)
  "order.eu.*"   matches "order.us.completed"  (NO -- eu != us)
```

**Use case:** Flexible event routing by geography, severity, entity type.

#### 4. Headers Exchange

Routes based on **message headers** (key-value pairs) instead of routing keys.

```
  Message headers: { "format": "pdf", "type": "report" }

  Binding on Queue A: match all { "format": "pdf", "type": "report" }  --> MATCH
  Binding on Queue B: match any { "format": "pdf" }                     --> MATCH
  Binding on Queue C: match all { "format": "csv" }                     --> NO MATCH
```

**Use case:** Complex routing logic that cannot be expressed as string patterns.

### Message Acknowledgment & Prefetch

```
  Consumer subscribes with prefetch_count = 10

  RabbitMQ sends 10 messages to consumer (unacknowledged buffer)
  Consumer processes msg 1 --> sends ACK --> RabbitMQ delivers msg 11
  Consumer processes msg 2 --> sends ACK --> RabbitMQ delivers msg 12
  ...

  If consumer crashes: all unACKed messages are re-delivered to another consumer
```

**Prefetch count** controls how many unacknowledged messages a consumer holds.
- `prefetch=1`: Fair dispatch (slow but even load distribution)
- `prefetch=10-25`: Good throughput with bounded memory
- `prefetch=unlimited`: Dangerous -- consumer may OOM

### Clustering & High Availability

```
  RabbitMQ Cluster (3 nodes):

  +----------+    +----------+    +----------+
  | Node 1   |<-->| Node 2   |<-->| Node 3   |
  | Queue A  |    | Queue B  |    | Queue C  |
  | (master) |    | (master) |    | (master) |
  | Queue B  |    | Queue C  |    | Queue A  |
  | (mirror) |    | (mirror) |    | (mirror) |
  +----------+    +----------+    +----------+
```

- **Classic mirrored queues** (deprecated): full copies on multiple nodes
- **Quorum queues** (recommended): Raft-based replication, auto-failover
  - At least 3 nodes, majority must be up
  - Stronger guarantees than mirrored queues
  - Default for HA in RabbitMQ 3.8+

### When to Use RabbitMQ vs Kafka

```
  +-------------------------+-----------------+------------------+
  | Criteria                | RabbitMQ        | Kafka            |
  +-------------------------+-----------------+------------------+
  | Model                   | Smart broker    | Dumb broker,     |
  |                         |                 | smart consumer   |
  | Routing                 | Complex (4 types)| Key-based only  |
  | Message replay          | No (consumed=gone)| Yes (log-based)|
  | Throughput              | ~50K msg/s      | ~millions msg/s  |
  | Protocol                | AMQP, MQTT,STOMP| Custom binary    |
  | Priority queues         | Yes (native)    | No               |
  | Message delay           | Plugin support  | No native        |
  | Best for                | Task queues,    | Event streaming, |
  |                         | complex routing | data pipelines   |
  +-------------------------+-----------------+------------------+
```

---

## AWS SQS (Simple Queue Service)

Fully managed, serverless message queue. Zero infrastructure to operate.

### Standard Queue

```
  +----------+    send     +-------------------+    receive    +----------+
  | Producer |------------>| SQS Standard      |------------->| Consumer |
  +----------+             |                   |              +----------+
                           | - At-least-once   |
                           | - Best-effort     |
                           |   ordering        |
                           | - Nearly unlimited|
                           |   throughput      |
                           +-------------------+
```

- **Delivery:** At-least-once (messages may be delivered more than once)
- **Ordering:** Best-effort (messages may arrive out of order)
- **Throughput:** Nearly unlimited (no provisioning needed)
- **Deduplication:** None (consumer must handle duplicates)

### FIFO Queue

```
  +----------+    send     +-------------------+    receive    +----------+
  | Producer |------------>| SQS FIFO          |------------->| Consumer |
  +----------+             | (.fifo suffix)    |              +----------+
                           |                   |
                           | - Exactly-once    |
                           | - Strict ordering |
                           | - 300 msg/s       |
                           |   (3000 batched)  |
                           +-------------------+
```

- **Delivery:** Exactly-once (deduplication within 5-minute window)
- **Ordering:** Strict FIFO within a **message group** (similar to Kafka partition)
- **Throughput:** 300 messages/sec (3,000 with batching, 70,000 with high throughput mode)
- **Deduplication:** Content-based or deduplication ID

### Visibility Timeout

The mechanism that prevents two consumers from processing the same message.

```
  T=0:    Consumer A receives msg --> msg becomes INVISIBLE to others
  T=0-30: Consumer A processing...   (visibility timeout = 30s)
  T=25:   Consumer A finishes, deletes msg --> done

  FAILURE SCENARIO:
  T=0:    Consumer A receives msg --> msg becomes invisible
  T=30:   Consumer A crashed, never deleted msg
          --> visibility timeout expires
          --> msg becomes VISIBLE again
  T=31:   Consumer B receives msg --> processes it
```

**Best practice:** Set visibility timeout > max processing time. Use
`ChangeMessageVisibility` to extend if processing takes longer than expected.

### Long Polling vs Short Polling

```
  Short polling (default):
    Consumer: "Any messages?" --> SQS: "No" (empty response)
    Consumer: "Any messages?" --> SQS: "No"    (wasted API calls, $$$)
    Consumer: "Any messages?" --> SQS: "Yes, here's 1 message"

  Long polling (WaitTimeSeconds = 20):
    Consumer: "Any messages? I'll wait up to 20s"
    ...(SQS holds connection open)...
    SQS: "Yes, here's 3 messages"  (waits until messages arrive or timeout)
```

**Always use long polling** (`WaitTimeSeconds=20`). Reduces API calls, reduces
cost, reduces latency for receiving messages.

### SQS Dead Letter Queue

```python
# SQS DLQ configuration
queue_policy = {
    "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456:my-dlq",
    "maxReceiveCount": 3  # after 3 failed attempts, move to DLQ
}
```

A message's receive count increments each time it becomes visible again
(consumer didn't delete it). After `maxReceiveCount`, SQS moves it to the DLQ.

---

## AWS SNS (Simple Notification Service)

Fully managed **pub/sub** service. Producers publish to **topics**, and
messages fan out to all **subscriptions**.

```
  +----------+   publish    +-------------------+
  | Producer |------------->|    SNS Topic      |
  +----------+              | "order-events"    |
                            +---+---+---+---+---+
                                |   |   |   |
                    +-----------+   |   |   +-----------+
                    v               v   v               v
              +---------+    +--------+ +--------+ +---------+
              |  SQS    |    | Lambda | | HTTP   | |  Email  |
              |  Queue  |    |Function| |Endpoint| |         |
              +---------+    +--------+ +--------+ +---------+
```

### SNS + SQS Fan-Out Pattern (Most Common)

```
  SNS "order-placed"
       |
       +-----------> SQS "email-queue"     --> Email Service
       +-----------> SQS "inventory-queue" --> Inventory Service
       +-----------> SQS "analytics-queue" --> Analytics Service

  Benefits:
  - Each SQS queue buffers independently
  - Each consumer processes at its own rate
  - Adding new consumer = add SQS queue + subscription (zero producer changes)
  - If one consumer is slow/down, others are unaffected
```

### Message Filtering

SNS can filter messages so subscribers only receive relevant ones.

```json
// Subscription filter policy on "inventory-queue":
{
    "event_type": ["ORDER_PLACED", "ORDER_CANCELLED"],
    "region": ["us-east", "us-west"]
}

// Message attributes:
// { "event_type": "ORDER_PLACED", "region": "us-east" }  --> DELIVERED
// { "event_type": "PAYMENT_RECEIVED", "region": "us-east" }  --> FILTERED OUT
```

Filtering reduces consumer load and SQS costs by avoiding unnecessary messages.

---

## Redis Streams

An **append-only log data structure** built into Redis (since Redis 5.0).
Conceptually similar to Kafka but simpler and designed for lighter workloads.

```
  Stream: "orders"

  +-------+-------+-------+-------+-------+
  | 1-0   | 2-0   | 3-0   | 4-0   | 5-0   |   <-- entries (ID = timestamp-seq)
  | order1| order2| order3| order4| order5|
  +-------+-------+-------+-------+-------+
  ^                                       ^
  first entry                        last entry
```

### Consumer Groups (Similar to Kafka)

```
  Stream: "orders"
  Consumer Group: "processors"

  Consumer A: reads entries 1-0, 2-0         (assigned subset)
  Consumer B: reads entries 3-0, 4-0         (different subset)
  Consumer C: reads entries 5-0              (remaining)

  Each entry delivered to exactly one consumer in the group.
```

### Key Commands

```redis
# Add to stream
XADD orders * action place user_id 123 amount 50.00

# Read new entries (blocking, like long poll)
XREAD BLOCK 5000 STREAMS orders $

# Create consumer group
XGROUP CREATE orders processors 0

# Read as consumer in group
XREADGROUP GROUP processors consumer-1 COUNT 10 STREAMS orders >

# Acknowledge processing
XACK orders processors 1234567890-0

# Check pending (unACKed) entries
XPENDING orders processors
```

### When to Use Redis Streams

- You already have Redis in your stack (no new infrastructure)
- Lightweight event streaming (thousands, not millions, per second)
- Short retention (Redis is memory-bound)
- Simple consumer group needs
- Real-time features: activity feeds, notifications, chat

### Redis Streams vs Kafka

```
  +--------------------+------------------+------------------+
  | Feature            | Redis Streams    | Kafka            |
  +--------------------+------------------+------------------+
  | Storage            | In-memory (+AOF) | Disk (log)       |
  | Throughput         | ~100K msg/s      | Millions msg/s   |
  | Retention          | Memory-limited   | Disk-limited     |
  | Consumer groups    | Yes              | Yes              |
  | Replication        | Redis Cluster    | ISR replicas     |
  | Stream processing  | No               | Kafka Streams    |
  | Operational cost   | Low (existing)   | High (cluster)   |
  +--------------------+------------------+------------------+
```

---

## Apache Pulsar

A **cloud-native** distributed messaging and streaming platform, designed to
address Kafka's architectural limitations.

```
  +----------+              +-------------------+              +----------+
  | Producer |------------->|   Pulsar Brokers  |------------->| Consumer |
  +----------+              | (stateless,       |              +----------+
                            |  compute only)    |
                            +--------+----------+
                                     |
                            +--------v----------+
                            |   Apache          |
                            |   BookKeeper      |
                            | (persistent       |
                            |  storage layer)   |
                            +-------------------+
```

### Key Differentiators

| Feature                | Pulsar                           | Kafka                    |
|------------------------|----------------------------------|--------------------------|
| **Architecture**       | Separated compute + storage      | Brokers store data       |
| **Multi-tenancy**      | Native (tenants, namespaces)     | Topic-level only         |
| **Geo-replication**    | Built-in, active-active          | MirrorMaker (active-passive) |
| **Tiered storage**     | Native (offload to S3/GCS)       | Kafka 2.4+ (limited)    |
| **Topic compaction**   | Yes                              | Yes                      |
| **Schema registry**    | Built-in                         | Separate component       |
| **Message delay**      | Native support                   | No native support        |
| **Protocol**           | Custom binary + WebSocket        | Custom binary            |

### When to Choose Pulsar

- Multi-tenant platform (many teams sharing one cluster)
- Geo-replication across data centers
- Cost-sensitive: tiered storage offloads cold data to cheap object storage
- Need both queuing (exclusive) and streaming (shared) on same platform

---

## NATS

An **ultra-lightweight**, high-performance messaging system designed for
cloud-native and edge computing.

```
  Core NATS (at-most-once):
  +----------+   pub    +-------+   deliver   +----------+
  | Producer |--------->| NATS  |------------>| Consumer |
  +----------+          | Server|             +----------+
                        +-------+
                    (no persistence, fire-and-forget)

  JetStream (at-least-once with persistence):
  +----------+   pub    +-----------+   deliver   +----------+
  | Producer |--------->| JetStream |------------>| Consumer |
  +----------+          | (streams, |             +----------+
                        |  consumers|
                        |  stored)  |
                        +-----------+
```

### NATS Key Features

- **Tiny footprint:** Single binary, ~15MB, starts in milliseconds
- **Subject-based addressing:** `orders.us.placed`, wildcard `orders.>`
- **Request-reply:** Built-in pattern for synchronous-style RPC
- **Core NATS:** Pure pub/sub, no persistence, at-most-once (fastest)
- **JetStream:** Added persistence, consumer groups, exactly-once, replay
- **Leaf nodes:** Edge connectivity, bridge remote clusters

### When to Use NATS

- Microservices internal communication (lightweight, fast)
- IoT / edge computing (small binary, low resource)
- Real-time signaling (presence, control plane)
- When you want simplicity over features

---

## Technology Comparison Table

```
+------------------+----------+----------+------+------+--------+-------+------+
| Criteria         | Kafka    | RabbitMQ | SQS  | SNS  | Redis  | Pulsar| NATS |
|                  |          |          |      |      |Streams |       |      |
+------------------+----------+----------+------+------+--------+-------+------+
| Model            | Log      | Broker   |Queue | PubSub| Log   | Log   |PubSub|
| Protocol         | Custom   | AMQP     | HTTP | HTTP | RESP   |Custom |Custom|
| Throughput       | *****    | ***      | **** | **** | ****   | ***** | *****|
| Latency          | ms       | ms       | ms   | ms   | sub-ms | ms    |sub-ms|
| Ordering         | Partition| Queue    | FIFO*| None | Stream | Key   |Subj  |
| Replay           | Yes      | No       | No   | No   | Yes    | Yes   | JS** |
| Dead Letter Q    | Manual   | Yes      | Yes  | Yes  | Manual | Yes   | No   |
| Exactly-once     | Yes      | No       | FIFO*| No   | No     | Yes   | JS** |
| Complex routing  | No       | Yes      | No   | Filter| No    | No    | Subj |
| Priority         | No       | Yes      | No   | No   | No     | No    | No   |
| Multi-tenant     | Limited  | vhosts   | IAM  | IAM  | No     | Yes   | Accts|
| Geo-replication  | Mirror   | Shovel   | Cross| Cross| Cluster| Native| Leaf |
|                  | Maker    |          |region|region|        |       |nodes |
| Managed service  | MSK,     | CloudAMQP| Yes  | Yes  | Elasti | Stream| Synadia|
|                  |Confluent |          |      |      | cache  | native|      |
| Operational cost | High     | Medium   | None | None | Low    | High  | Low  |
| Best for         |Streaming,|Routing,  |Simple|Fanout|Light   |Multi- |Micro-|
|                  |pipelines |tasks     |queue |      |stream  |tenant |svc   |
+------------------+----------+----------+------+------+--------+-------+------+
  * SQS FIFO only    ** JetStream only
```

---

## Interview Decision Framework

```
  "We need a simple task queue with no ops burden"
    --> AWS SQS

  "We need to fan out events to multiple services"
    --> AWS SNS + SQS (serverless) or Kafka topics (self-managed)

  "We need complex message routing with priorities"
    --> RabbitMQ

  "We need high-throughput event streaming with replay"
    --> Kafka or Pulsar

  "We already have Redis and need lightweight streaming"
    --> Redis Streams

  "We need ultra-low-latency messaging between microservices"
    --> NATS

  "We need multi-tenant messaging with geo-replication"
    --> Apache Pulsar

  "We need exactly-once processing"
    --> Kafka (idempotent + transactional) or SQS FIFO
```
