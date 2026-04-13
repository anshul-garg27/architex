# Apache Kafka -- Deep Dive

## What Is Kafka?

Apache Kafka is a **distributed, log-based event streaming platform**. Originally
built at LinkedIn (2011) and later open-sourced under the Apache Foundation.

Key properties:
- **Append-only log**: Messages are written sequentially, never modified
- **Immutable**: Once written, a message cannot be changed or deleted
- **Distributed**: Data is spread across multiple brokers for fault tolerance
- **Persistent**: Messages are stored on disk, not just in memory
- **High throughput**: Millions of messages per second per cluster
- **Replayable**: Consumers can re-read messages by resetting their offset

Kafka is NOT a traditional message queue -- it is a **distributed commit log**
that happens to support messaging patterns.

---

## Architecture Overview

```
  +------------------+       +------------------+       +------------------+
  |   Producer App   |       |   Producer App   |       |   Producer App   |
  +--------+---------+       +--------+---------+       +--------+---------+
           |                          |                          |
           v                          v                          v
  +------------------------------------------------------------------------+
  |                         KAFKA CLUSTER                                   |
  |                                                                         |
  |   +-------------------+  +-------------------+  +-------------------+   |
  |   |    Broker 1        |  |    Broker 2        |  |    Broker 3        |   |
  |   |                   |  |                   |  |                   |   |
  |   | Topic-A Part-0 (L)|  | Topic-A Part-1 (L)|  | Topic-A Part-2 (L)|   |
  |   | Topic-A Part-1 (F)|  | Topic-A Part-2 (F)|  | Topic-A Part-0 (F)|   |
  |   | Topic-B Part-0 (L)|  | Topic-B Part-1 (L)|  | Topic-B Part-0 (F)|   |
  |   +-------------------+  +-------------------+  +-------------------+   |
  |                                                                         |
  |   (L) = Leader replica    (F) = Follower replica                        |
  +------------------------------------------------------------------------+
           |                          |                          |
           v                          v                          v
  +--------+---------+       +--------+---------+       +--------+---------+
  | Consumer Group A |       | Consumer Group A |       | Consumer Group B |
  |  (Consumer 1)    |       |  (Consumer 2)    |       |  (Consumer 1)    |
  +------------------+       +------------------+       +------------------+
```

### Component Glossary

| Component        | Role                                                    |
|------------------|---------------------------------------------------------|
| **Broker**       | A single Kafka server; stores partitions on disk        |
| **Cluster**      | Group of brokers working together                       |
| **Producer**     | Application that writes messages to topics               |
| **Consumer**     | Application that reads messages from topics              |
| **Topic**        | Named feed/category of messages (like a table name)     |
| **Partition**    | Ordered, immutable sub-log of a topic                   |
| **Offset**       | Sequential ID of a message within a partition           |
| **Consumer Group** | Set of consumers that divide partition consumption     |
| **Replica**      | Copy of a partition for fault tolerance                  |

---

## Topics

A **topic** is a named stream of records. Think of it as a category or feed name.

```
  Topic: "user-events"
  Topic: "order-updates"
  Topic: "page-views"
```

- Topics are created explicitly (`kafka-topics --create`) or auto-created
  on first produce (if `auto.create.topics.enable=true`).
- A topic has one or more **partitions**.
- Topics have a **retention policy**: time-based (7 days default) or size-based.
- After retention expires, old data is deleted (unless using log compaction).

---

## Partitions -- The Unit of Everything

A partition is an **ordered, immutable sequence of messages** (a commit log).
Each message within a partition gets a unique, monotonically increasing **offset**.

```
  Topic: "orders" with 3 partitions

  Partition 0:  [0][1][2][3][4][5][6]----->  (append here)
  Partition 1:  [0][1][2][3][4]----------->  (append here)
  Partition 2:  [0][1][2][3][4][5]--------->  (append here)
                 ^                   ^
                 |                   |
             oldest msg          newest msg (offset = write position)
```

### How Messages Are Assigned to Partitions

```python
# Option 1: Key-based (deterministic -- SAME key ALWAYS goes to SAME partition)
producer.send("orders", key="order-123", value=event)
# partition = hash(key) % num_partitions

# Option 2: Round-robin (no key -- distributes evenly)
producer.send("orders", value=event)
# partition = (previous + 1) % num_partitions

# Option 3: Custom partitioner
class GeoPartitioner(Partitioner):
    def partition(self, topic, key, value, partitions):
        if value.region == "US":
            return 0
        elif value.region == "EU":
            return 1
        else:
            return 2
```

### Why Partitions Matter

```
  Parallelism:   More partitions = more consumers can read in parallel
  Ordering:      Messages with the same key go to the same partition
                 --> ordering guaranteed per key
  Throughput:    Each partition can be on a different broker (disk I/O spreads)
  Scalability:   Partitions are the unit of horizontal scaling
```

**Critical rule:** Ordering is guaranteed **WITHIN a partition** only.
Messages across different partitions have NO ordering guarantee.

### Choosing Partition Count

```
  Too few partitions (e.g., 1):
    - Limits consumer parallelism to 1 consumer
    - Bottleneck on single broker disk

  Too many partitions (e.g., 10,000):
    - More file handles, memory overhead per broker
    - Longer leader election time on broker failure
    - More replication traffic

  Rule of thumb:
    - Start with max(throughput_target / throughput_per_partition, num_consumers)
    - Typical: 6-12 partitions per topic for moderate load
    - Can increase later but NEVER decrease (breaks key hashing)
```

---

## Consumer Groups

A **consumer group** is a set of consumers that cooperate to consume a topic.
Each partition is assigned to **exactly one consumer** within the group.

```
  Topic: "orders" (6 partitions: P0, P1, P2, P3, P4, P5)

  Consumer Group A (3 consumers):
  +------------------+   +------------------+   +------------------+
  | Consumer A-1     |   | Consumer A-2     |   | Consumer A-3     |
  | Reads: P0, P1    |   | Reads: P2, P3    |   | Reads: P4, P5    |
  +------------------+   +------------------+   +------------------+

  Consumer Group B (2 consumers):     <-- independent, reads ALL messages
  +------------------+   +------------------+
  | Consumer B-1     |   | Consumer B-2     |
  | Reads: P0, P1, P2|   | Reads: P3, P4, P5|
  +------------------+   +------------------+
```

### Key Rules

1. **Each partition --> exactly one consumer in the group** (no sharing)
2. **One consumer can read multiple partitions** (if consumers < partitions)
3. **If consumers > partitions**, extra consumers sit idle
4. **Multiple groups** independently consume the same topic (pub/sub behavior)

### Rebalancing

When consumers join or leave, Kafka **rebalances** partition assignments.

```
  Before: 3 consumers, 6 partitions
  C1: [P0, P1]    C2: [P2, P3]    C3: [P4, P5]

  C3 crashes:
  C1: [P0, P1, P4] C2: [P2, P3, P5]   <-- partitions redistributed

  C3 comes back:
  C1: [P0, P1]    C2: [P2, P3]    C3: [P4, P5]   <-- back to normal
```

**Rebalancing drawbacks:**
- Brief pause in consumption during rebalance
- Can cause duplicate processing (consumer crash before offset commit)
- Mitigated with **cooperative sticky rebalancing** (Kafka 2.4+)

### Scaling Formula

```
  Max parallelism = min(num_partitions, num_consumers_in_group)

  6 partitions, 3 consumers --> each gets 2 partitions (good)
  6 partitions, 6 consumers --> each gets 1 partition  (ideal)
  6 partitions, 9 consumers --> 3 consumers idle       (wasteful)
```

---

## Offsets -- Consumer Position Tracking

An **offset** is the position of the next message to read within a partition.
Kafka does NOT track which messages each consumer has seen -- the consumer
manages its own offset.

```
  Partition 0:  [0][1][2][3][4][5][6][7][8][9]
                                ^           ^
                                |           |
                        committed offset   log-end offset
                        (last processed)   (latest message)

  Lag = log-end offset - committed offset = 9 - 4 = 5 messages behind
```

### Offset Commit Strategies

```java
// AUTO-COMMIT (default): periodic background commit
// Risk: commits before processing complete --> message loss on crash
props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "5000");

// MANUAL COMMIT (synchronous): commit after processing
consumer.poll(Duration.ofMillis(100));
// ... process records ...
consumer.commitSync();  // blocks until broker confirms

// MANUAL COMMIT (async): commit without blocking
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) log.error("Commit failed", exception);
});
```

### Offset Reset Strategies

What happens when a consumer starts with no committed offset (new group) or
the committed offset is no longer valid (data expired)?

```
  auto.offset.reset = "earliest"   --> Start from the beginning (replay all)
  auto.offset.reset = "latest"     --> Start from the end (new messages only)
  auto.offset.reset = "none"       --> Throw exception (fail fast)
```

**Interview tip:** "earliest" = at-least-once (may reprocess), "latest" =
at-most-once (may miss messages during downtime).

---

## Replication -- Fault Tolerance

Every partition has one **leader** and zero or more **follower** replicas.
All reads and writes go through the leader. Followers replicate the leader's log.

```
  Partition 0 (replication factor = 3):

  Broker 1:  [Leader ]  [0][1][2][3][4][5]   <-- producers write here
  Broker 2:  [Follower] [0][1][2][3][4][5]   <-- replicates from leader
  Broker 3:  [Follower] [0][1][2][3][4]      <-- slightly behind (lag)
                                                    |
                                               NOT in ISR (lagging)
```

### ISR (In-Sync Replicas)

The set of replicas that are "caught up" with the leader. A replica falls
out of ISR if it falls behind by more than `replica.lag.time.max.ms` (default 30s).

```
  ISR = {Broker 1 (leader), Broker 2}     Broker 3 lagging, not in ISR
  min.insync.replicas = 2                  At least 2 replicas must ACK
```

### Producer Acknowledgment Levels

```
  acks=0:   Fire and forget. Don't wait for any broker.
            Fastest. Risk: message loss.

  acks=1:   Wait for leader to write to its local log.
            Fast. Risk: message loss if leader crashes before replication.

  acks=all: Wait for ALL in-sync replicas to write.
  (acks=-1) Slowest. Safest. No message loss as long as ISR >= min.insync.replicas.
```

**Production recommendation:** `acks=all` + `min.insync.replicas=2` +
`replication.factor=3`. This tolerates 1 broker failure with zero data loss.

```
  Durability Matrix:
  +----------+-------------------+------------------+
  | acks     | Leader crash      | Data loss?       |
  +----------+-------------------+------------------+
  | 0        | Before write      | YES              |
  | 1        | After write,      | YES (not yet     |
  |          | before replicate  | replicated)      |
  | all      | After all ISR ACK | NO               |
  +----------+-------------------+------------------+
```

---

## Log Compaction

Normal retention deletes old segments by time or size. **Log compaction**
keeps the **latest value for each key**, deleting older entries.

```
  Before compaction:
  [key=A, v=1] [key=B, v=1] [key=A, v=2] [key=C, v=1] [key=A, v=3]

  After compaction:
  [key=B, v=1] [key=C, v=1] [key=A, v=3]    <-- only latest per key kept
```

**Use cases:**
- Database changelog (CDC): keep latest state of each row
- User profile cache: keep latest profile per user_id
- Configuration store: keep latest config per key

**Tombstones:** A message with `key=X, value=null` tells compaction to
eventually remove key X entirely (delete marker).

---

## KRaft -- Replacing ZooKeeper

Before Kafka 3.3, a separate **ZooKeeper** cluster managed metadata (broker
registration, topic configs, controller election). This added operational
complexity.

**KRaft** (Kafka Raft) moves metadata management INTO Kafka itself:

```
  Before (with ZooKeeper):
  +----------+     +----------+     +----------+
  |  Broker  |---->| ZooKeeper|<----| Broker   |
  +----------+     | Ensemble |     +----------+
                   +----------+
                   (separate cluster to operate)

  After (KRaft mode):
  +----------+     +----------+     +----------+
  |  Broker  |<--->|  Broker  |<--->|  Broker  |
  | (voter)  |     | (voter)  |     | (voter)  |
  +----------+     +----------+     +----------+
  (metadata managed via internal Raft consensus)
```

**Benefits of KRaft:**
- No separate ZooKeeper cluster to manage
- Faster controller failover (seconds vs minutes)
- Better scalability (millions of partitions)
- Simplified deployment and operations

**Status:** KRaft is production-ready since Kafka 3.3 (2022). ZooKeeper mode
is deprecated and will be removed in Kafka 4.0.

---

## Exactly-Once Semantics (EOS)

Kafka achieves exactly-once through two mechanisms:

### 1. Idempotent Producer

```
  Producer assigns each message a (producer_id, sequence_number).
  Broker detects and deduplicates retries with the same sequence.

  Send: (pid=7, seq=42, msg="order-123")   --> Broker writes it
  Retry: (pid=7, seq=42, msg="order-123")  --> Broker: "already have seq=42, skip"
```

Enable: `enable.idempotence=true` (default since Kafka 3.0)

### 2. Transactional API (Consume-Transform-Produce)

```java
producer.initTransactions();

try {
    producer.beginTransaction();

    // Consume from input topic
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    for (ConsumerRecord<String, String> record : records) {
        // Transform and produce to output topic
        producer.send(new ProducerRecord<>("output-topic", transform(record)));
    }

    // Commit consumer offsets AND produced messages atomically
    producer.sendOffsetsToTransaction(offsets, consumerGroupMetadata);
    producer.commitTransaction();

} catch (Exception e) {
    producer.abortTransaction();  // all-or-nothing
}
```

This ensures: consume input + produce output + commit offset happens **atomically**.
Either all succeed or all are rolled back.

---

## Kafka Connect

A framework for streaming data **between Kafka and external systems** using
pre-built connectors.

```
  +----------+    Source     +-------+    Sink      +----------+
  |  MySQL   |  Connector   | Kafka |  Connector   |   S3     |
  |  (CDC)   |------------->| Topic |------------->|  (JSON)  |
  +----------+              +-------+               +----------+

  +----------+    Source     +-------+    Sink      +----------+
  | Postgres |  Connector   | Kafka |  Connector   | Elastic  |
  |  (WAL)   |------------->| Topic |------------->| search   |
  +----------+              +-------+               +----------+
```

### Connector Types

| Type   | Direction             | Examples                            |
|--------|-----------------------|-------------------------------------|
| Source | External --> Kafka     | JDBC, Debezium (CDC), File, S3      |
| Sink   | Kafka --> External     | S3, HDFS, Elasticsearch, JDBC       |

### Why Kafka Connect?

- No custom code needed for common integrations
- Built-in fault tolerance, offset tracking, exactly-once
- Scales horizontally (distributed mode)
- Hundreds of community connectors available

---

## Schema Registry

Manages **schemas** (Avro, Protobuf, JSON Schema) for Kafka messages, enabling
schema evolution without breaking consumers.

```
  Producer                     Schema Registry              Consumer
     |                              |                          |
     |--- register schema v1 ----->|                          |
     |<-- schema_id = 1 ----------|                          |
     |                              |                          |
     | send msg [schema_id=1|data] -------> Kafka -------->  |
     |                              |                          |
     |                              |<-- get schema for id=1 --|
     |                              |--- return schema v1 ---->|
     |                              |                          |
     |                              |         (consumer deserializes using schema)
```

### Compatibility Modes

| Mode               | Rule                                          | Safe Change        |
|--------------------|-----------------------------------------------|--------------------|
| BACKWARD           | New schema can read old data                   | Delete field, add optional |
| FORWARD            | Old schema can read new data                   | Add field, delete optional |
| FULL               | Both backward + forward                        | Add/delete optional |
| NONE               | No compatibility check                         | Anything (dangerous) |

**Best practice:** Use BACKWARD compatibility (default). New consumers can
always read old messages. Roll out consumers before producers.

---

## Kafka Streams

A **lightweight stream processing library** built into the Kafka client (no
separate cluster needed -- runs inside your application JVM).

```java
StreamsBuilder builder = new StreamsBuilder();

// Read from input topic
KStream<String, String> orders = builder.stream("orders");

// Filter, transform, aggregate
KTable<String, Long> orderCounts = orders
    .filter((key, value) -> value.contains("COMPLETED"))
    .groupByKey()
    .count(Materialized.as("order-counts-store"));

// Write to output topic
orderCounts.toStream().to("order-count-results");

// Run the topology
KafkaStreams streams = new KafkaStreams(builder.build(), props);
streams.start();
```

### Key Concepts

| Concept          | Description                                        |
|------------------|----------------------------------------------------|
| **KStream**      | Unbounded stream of records (each is an event)     |
| **KTable**       | Changelog stream (each key has latest value)       |
| **GlobalKTable** | Full copy of a topic on every instance             |
| **Windowing**    | Tumbling, hopping, sliding, session windows        |
| **State Store**  | Local RocksDB for stateful operations              |
| **Interactive Queries** | Query state stores from outside the stream  |

### Kafka Streams vs Alternatives

```
  +-------------------+-------------------+-------------------+
  | Kafka Streams     | Apache Flink      | Apache Spark      |
  +-------------------+-------------------+-------------------+
  | Library (no       | Separate cluster  | Separate cluster  |
  | cluster needed)   | (JobManager +     | (Driver + Workers)|
  |                   | TaskManagers)     |                   |
  | Java/Kotlin only  | Java, Python, SQL | Java, Scala, Py   |
  | Kafka-only I/O    | Many sources/sinks| Many sources/sinks|
  | Millisecond       | Millisecond       | Seconds-minutes   |
  | latency           | latency           | (micro-batch)     |
  | Simple ops        | Complex ops       | Complex ops       |
  +-------------------+-------------------+-------------------+
```

---

## Performance Tuning

### Producer Tuning

```properties
# Batching: accumulate messages before sending (reduces network calls)
batch.size=65536                 # bytes per batch (default 16384)
linger.ms=10                    # wait up to 10ms for batch to fill

# Compression: reduce network and disk I/O
compression.type=lz4            # options: none, gzip, snappy, lz4, zstd
                                # lz4 = best balance of speed + compression

# Retries
retries=2147483647              # retry indefinitely (with idempotence)
delivery.timeout.ms=120000      # total time to deliver a message

# Buffer
buffer.memory=67108864          # 64MB producer buffer (default 32MB)
max.block.ms=60000              # block if buffer full (instead of throwing)
```

### Consumer Tuning

```properties
# Fetch tuning
fetch.min.bytes=1024            # wait for at least 1KB of data
fetch.max.wait.ms=500           # max wait time for fetch.min.bytes
max.poll.records=500            # max records per poll() call

# Session management
session.timeout.ms=45000        # time before consumer considered dead
heartbeat.interval.ms=15000     # heartbeat frequency
max.poll.interval.ms=300000     # max time between poll() calls

# Offset
enable.auto.commit=false        # manual commit for at-least-once
auto.offset.reset=earliest      # start from beginning for new groups
```

### Broker Tuning

```properties
# Partitions
num.partitions=6                # default partitions per topic
default.replication.factor=3    # replicas per partition

# Log
log.retention.hours=168         # 7 days retention
log.segment.bytes=1073741824    # 1GB log segment size
log.cleanup.policy=delete       # or "compact" for compacted topics

# Network
num.network.threads=8           # threads for network I/O
num.io.threads=16               # threads for disk I/O
socket.receive.buffer.bytes=102400
socket.send.buffer.bytes=102400
```

---

## Real-World Kafka Deployments

| Company    | Scale                                        | Use Case                        |
|------------|---------------------------------------------|---------------------------------|
| LinkedIn   | 7+ trillion messages/day                     | Activity tracking, metrics       |
| Netflix    | 1.2+ petabytes/day                           | Event sourcing, data pipeline   |
| Uber       | Trillions of messages/day                    | Trip events, driver locations   |
| Airbnb     | Hundreds of billions/day                     | Search indexing, payments       |
| Spotify    | Millions of events/sec                       | User activity, recommendations  |
| Twitter/X  | Hundreds of billions/day                     | Timeline events, analytics      |

---

## When to Use Kafka vs Alternatives

### Use Kafka When

- You need **high throughput** (millions of messages/sec)
- Messages must be **replayable** (consumers can re-read history)
- You have **multiple consumer groups** reading the same data
- You need **ordering per key** (partition-based ordering)
- You're building an **event-driven architecture** at scale
- You need **stream processing** (Kafka Streams, ksqlDB)
- You have a **data pipeline** (CDC, ETL, search indexing)

### Do NOT Use Kafka When

- You need **complex routing** (use RabbitMQ -- exchanges, bindings)
- You need **message priority** (Kafka has no native priority)
- You need **request-reply** pattern (use RPC or RabbitMQ)
- Your workload is **small/simple** (Kafka is operationally heavy)
- You need **delay/scheduled messages** natively (use RabbitMQ plugins)
- You want **serverless** with zero ops (use SQS/SNS)

### Decision Matrix

```
  +------------------------+--------+----------+------+------+
  | Criteria               | Kafka  | RabbitMQ | SQS  | Redis|
  +------------------------+--------+----------+------+------+
  | Throughput             | *****  | ***      | **** | **** |
  | Message replay         | YES    | No       | No   | Yes* |
  | Ordering               | Per-key| Per-queue| FIFO | Yes  |
  | Complex routing        | No     | YES      | No   | No   |
  | Operational complexity | High   | Medium   | None | Low  |
  | Exactly-once           | Yes    | No       | FIFO | No   |
  | Multi-consumer groups  | YES    | Possible | No   | Yes* |
  | Stream processing      | YES    | No       | No   | Ltd  |
  | Cloud managed          | Yes**  | Yes**    | YES  | Yes  |
  +------------------------+--------+----------+------+------+
  * Redis Streams only    ** MSK, CloudAMQP, Confluent Cloud
```

---

## Interview Quick Reference

```
  "What is Kafka?"
    Distributed append-only commit log for event streaming.

  "How does ordering work?"
    Within a partition only. Same key -> same partition -> ordered.

  "How does consumer scaling work?"
    One partition per consumer in a group. Max consumers = num partitions.

  "What happens when a broker dies?"
    Followers in ISR become new leaders. Producers/consumers redirect.
    With acks=all + min.insync.replicas=2, no data loss.

  "How does Kafka achieve exactly-once?"
    Idempotent producer (dedup retries) + transactional API (atomic
    consume-transform-produce).

  "What replaced ZooKeeper?"
    KRaft (Kafka Raft) -- metadata managed via internal Raft consensus.
    Production-ready since Kafka 3.3, ZooKeeper deprecated in 4.0.

  "Kafka vs RabbitMQ?"
    Kafka: high throughput, replay, log-based, stream processing.
    RabbitMQ: complex routing, priority, traditional message broker.

  "What is log compaction?"
    Keep only the latest value per key. Useful for CDC, caching, config.

  "What is consumer lag?"
    Difference between latest offset and consumer's committed offset.
    Monitor it. High lag = consumer falling behind.

  "How to avoid data loss?"
    acks=all, min.insync.replicas=2, replication.factor=3,
    manual offset commit after processing, idempotent producer.
```
