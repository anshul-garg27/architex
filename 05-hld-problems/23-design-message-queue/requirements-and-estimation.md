# Design a Distributed Message Queue (like Kafka) - Requirements & Estimation

## 1. Problem Statement

Design a distributed message queue system (think Apache Kafka, Redpanda, or Apache Pulsar)
that enables producers to publish messages and consumers to subscribe and process them
reliably at massive scale. The system must guarantee message ordering within partitions,
support multiple independent consumer groups, tolerate broker failures without data loss,
and sustain throughput exceeding 1 million messages per second.

> "A distributed message queue is the central nervous system of modern distributed
> architectures. Every microservice, every pipeline, every real-time analytics system
> depends on one. Designing it from scratch reveals the deepest tradeoffs in distributed
> systems: consistency vs. availability, throughput vs. latency, simplicity vs. flexibility."

---

## 2. Clarifying Questions to Ask the Interviewer

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | Are we designing a log-based system (Kafka-like) or a traditional message broker (RabbitMQ-like)? | Fundamentally different storage and delivery models |
| 2 | What is the expected peak throughput (messages/sec)? | Drives partitioning, storage, and replication strategy |
| 3 | What is the expected average message size? | Determines disk I/O and network bandwidth requirements |
| 4 | Do we need strict ordering guarantees? If so, at what granularity? | Per-topic ordering is expensive; per-partition is standard |
| 5 | What delivery semantics are required (at-most-once, at-least-once, exactly-once)? | Exactly-once requires idempotent producers and transactional support |
| 6 | How long should messages be retained? | Minutes (like SQS) vs. days/weeks/forever (like Kafka) |
| 7 | Do consumers need to replay messages from arbitrary offsets? | Replay requires log-based storage with offset tracking |
| 8 | How many distinct topics and consumer groups do we need to support? | Metadata management and coordination complexity |
| 9 | Do we need multi-datacenter replication? | Affects replication protocol and consistency model |
| 10 | Is exactly-once processing required across produce and consume? | Requires transactional API + idempotent producers |

**Assumed answer**: We are designing a **log-based distributed message queue** (Kafka-style),
supporting 100K+ topics, 1M+ messages/sec throughput, messages up to 1 MB, 7-day default
retention with configurable retention, at-least-once delivery by default with exactly-once
as an option, per-partition ordering, and consumer replay from any offset.

---

## 3. Functional Requirements

### 3.1 Core Messaging

| # | Requirement | Description |
|---|------------|-------------|
| FR-1 | **Produce Messages** | Producers publish messages to named topics, optionally with a partition key for routing |
| FR-2 | **Consume Messages** | Consumers subscribe to topics and receive messages in order within each partition |
| FR-3 | **Topics & Partitions** | Each topic is split into N partitions; partition is the unit of parallelism and ordering |
| FR-4 | **Consumer Groups** | A consumer group distributes partitions among its members; each partition is consumed by exactly one member in the group |
| FR-5 | **Offset Management** | Consumers track their position (offset) per partition; can commit offsets manually or automatically |
| FR-6 | **Message Replay** | Consumers can seek to any offset (beginning, end, specific offset, or timestamp) and replay messages |
| FR-7 | **Message Retention** | Messages are retained for a configurable duration (time-based) or size (size-based), independent of consumption |

### 3.2 Reliability & Delivery

| # | Requirement | Description |
|---|------------|-------------|
| FR-8 | **Replication** | Each partition is replicated across multiple brokers for fault tolerance |
| FR-9 | **At-Least-Once Delivery** | Default guarantee: every message is delivered at least once; consumers handle deduplication |
| FR-10 | **Exactly-Once Semantics** | Optional: idempotent producers + transactional API for exactly-once end-to-end |
| FR-11 | **Acknowledgments** | Configurable acks: 0 (fire-and-forget), 1 (leader only), all (all in-sync replicas) |

### 3.3 Operations & Management

| # | Requirement | Description |
|---|------------|-------------|
| FR-12 | **Topic Management** | Create, delete, and configure topics (partition count, replication factor, retention) |
| FR-13 | **Consumer Group Management** | List consumer groups, view lag per partition, reset offsets |
| FR-14 | **Log Compaction** | Optional: retain only the latest message per key (for changelog/snapshot use cases) |
| FR-15 | **Broker Metrics** | Expose throughput, latency, lag, disk usage, replication health per broker/topic/partition |

---

## 4. Non-Functional Requirements

### 4.1 The Big Four for Message Queues

```
+-------------------+--------------------------------------------+--------------------+
| Property          | Target                                     | Why                |
+-------------------+--------------------------------------------+--------------------+
| Throughput        | >= 1 million messages/sec cluster-wide      | Core value prop    |
|                   | >= 100 MB/sec per broker (produce + consume)| of a message queue |
+-------------------+--------------------------------------------+--------------------+
| Latency           | p50 < 5 ms end-to-end (produce to consume) | Real-time use      |
|                   | p99 < 20 ms                                | cases demand it    |
+-------------------+--------------------------------------------+--------------------+
| Durability        | Zero message loss once acknowledged         | Financial, audit,  |
|                   | RPO = 0 for acks=all                       | compliance needs   |
+-------------------+--------------------------------------------+--------------------+
| Availability      | 99.99% uptime (< 53 min downtime/year)     | Central nervous    |
|                   | Survive broker failures transparently       | system of infra    |
+-------------------+--------------------------------------------+--------------------+
```

### 4.2 Additional Non-Functional Requirements

| # | Requirement | Target |
|---|------------|--------|
| NFR-5 | **Horizontal Scalability** | Add brokers to linearly increase throughput and storage |
| NFR-6 | **Partition Scalability** | Support 100K+ partitions across the cluster |
| NFR-7 | **Consumer Scalability** | Support 10K+ consumer groups, each independently tracking offsets |
| NFR-8 | **Message Size** | Support messages up to 1 MB (configurable max) |
| NFR-9 | **Retention** | Support 7 days default, configurable up to infinite (log compacted topics) |
| NFR-10 | **Consistency** | Messages within a partition have a strictly monotonic offset sequence |
| NFR-11 | **Backpressure** | Producers receive errors when brokers cannot keep up; no silent drops |
| NFR-12 | **Observability** | Expose metrics via JMX/Prometheus for every component |

---

## 5. Back-of-the-Envelope Estimation

### 5.1 Traffic Estimation

```
Given:
  Peak throughput:     1,000,000 messages/sec (1M msgs/sec)
  Average message size:      1 KB (payload + headers + key)
  Peak message size:        1 MB (large events, rare)
  Number of topics:        10,000
  Average partitions/topic:    6
  Replication factor:          3

Derived:
  Total partitions:            10,000 x 6 = 60,000 partitions
  Data ingestion rate:         1M msgs/sec x 1 KB = 1 GB/sec
  With replication (RF=3):     1 GB/sec x 3 = 3 GB/sec total disk writes
  Consumer read (assume 3x fan-out via consumer groups):
                               1 GB/sec x 3 = 3 GB/sec reads
  Total network throughput:    3 GB/sec write + 3 GB/sec read = 6 GB/sec
```

### 5.2 Storage Estimation

```
Retention period:              7 days
Daily ingestion:               1 GB/sec x 86,400 sec = 86.4 TB/day
7-day retention (raw):         86.4 TB x 7 = 604.8 TB
With replication (RF=3):       604.8 TB x 3 = 1,814 TB ~ 1.8 PB

Per-broker storage (30 brokers):
  Total storage / 30 =        1,814 TB / 30 = ~60 TB per broker
  
  Recommendation: 8-12 x 8 TB NVMe SSDs per broker
                  or 12 x 10 TB HDDs for cost-optimized deployments
```

### 5.3 Broker Count Estimation

```
Per-broker capacity (typical):
  Disk write throughput:       500 MB/sec (sequential on modern SSD RAID)
  Network bandwidth:           10 Gbps = ~1.25 GB/sec
  Partitions per broker:       2,000 - 4,000 (metadata overhead per partition)

Bottleneck analysis:
  Disk write:   3 GB/sec total / 500 MB/sec per broker = 6 brokers (write)
  Network:      6 GB/sec total / 1.25 GB/sec per broker = 5 brokers (network)
  Partitions:   60,000 / 3,000 avg = 20 brokers (partition limit)
  
  Binding constraint: PARTITIONS (metadata/memory)
  
  Recommended cluster size:    20-30 brokers
  (accounts for headroom, failure tolerance, and future growth)
```

### 5.4 Memory Estimation

```
Per-broker memory:
  Partition metadata:          3,000 partitions x 10 KB = 30 MB
  Segment index (in-memory):   3,000 partitions x 1 MB avg = 3 GB
  Page cache (OS):             The SECRET WEAPON -- OS page cache serves
                               recent messages from memory, not disk
  
  Consumer offset tracking:    10,000 consumer groups x 60,000 partitions
                               x 16 bytes (offset + metadata) = ~10 GB cluster
                               Stored in internal __consumer_offsets topic
  
  Recommended RAM per broker:  64 GB - 128 GB
  (Majority goes to OS page cache for zero-copy reads)
```

### 5.5 Network Estimation

```
Inter-broker replication:
  Each message replicated to 2 followers = 2 GB/sec inter-broker traffic
  
Producer connections:
  10,000 producers x 1 persistent connection = 10,000 connections
  
Consumer connections:
  10,000 consumer groups x 6 avg members = 60,000 connections
  
Total broker connections:      70,000 / 30 brokers = ~2,300 per broker
  (Well within Linux default; may need socket buffer tuning)
```

### 5.6 Summary Table

```
+------------------------------+----------------------------+
| Metric                       | Estimate                   |
+------------------------------+----------------------------+
| Peak throughput              | 1M msgs/sec (1 GB/sec)     |
| Brokers                      | 20-30                      |
| Total partitions             | 60,000                     |
| Partitions per broker        | 2,000-3,000                |
| Replication factor           | 3                          |
| Storage per broker           | 60 TB (7-day retention)    |
| RAM per broker               | 64-128 GB                  |
| Network per broker           | 10 Gbps (25 Gbps ideal)   |
| Total cluster storage        | ~1.8 PB (with RF=3)       |
| Consumer groups              | 10,000                     |
| Producer connections         | 10,000                     |
| Consumer connections         | 60,000                     |
+------------------------------+----------------------------+
```

---

## 6. Core Concepts for the Interview

### 6.1 Why Log-Based? The Key Insight

```
Traditional Message Queue (RabbitMQ):
  +-----------+       +-----------+       +-----------+
  | Producer  | ----> |   Queue   | ----> | Consumer  |
  +-----------+       +-----------+       +-----------+
                      Messages are DELETED after consumption.
                      One consumer per message (competing consumers).
                      No replay. No rewind. Gone forever.

Log-Based Message Queue (Kafka):
  +-----------+       +----------------------------+       +-----------+
  | Producer  | ----> |  Append-Only Log           | <---- | Consumer  |
  +-----------+       | [0][1][2][3][4][5][6][7].. |       | (offset=4)|
                      +----------------------------+       +-----------+
                      Messages are RETAINED for a configured period.
                      Multiple consumers can read independently.
                      Any consumer can replay from any offset.
                      Write = sequential append (FAST).
                      Read  = sequential scan (FAST).
```

### 6.2 Why Sequential Disk I/O Is the Secret Weapon

```
Random disk I/O:     ~100 IOPS on HDD, ~100K IOPS on SSD
Sequential disk I/O: ~200 MB/sec on HDD, ~3 GB/sec on SSD

Sequential disk writes are actually FASTER than random memory access
in many scenarios! This is the fundamental insight behind Kafka's design.

   Random Memory:     ~100 ns per access, but random patterns cause
                      cache misses, TLB misses, branch mispredictions
                      
   Sequential Disk:   High throughput via OS readahead, write-behind,
                      and zero-copy transfers (sendfile syscall)
                      
Result: Kafka achieves memory-like performance using disk, while gaining
        the persistence and capacity advantages of disk storage.
```

### 6.3 The Partition Model

```
Topic: "user-events" (partition count = 4)

Partition 0: [msg0] [msg1] [msg2] [msg5] [msg9]  ...  --> Offset 0,1,2,3,4
Partition 1: [msg3] [msg4] [msg7] [msg10] ...         --> Offset 0,1,2,3
Partition 2: [msg6] [msg8] [msg11] ...                 --> Offset 0,1,2
Partition 3: [msg12] [msg13] ...                       --> Offset 0,1

Key insight: Offsets are PER-PARTITION, not per-topic.
             Ordering is guaranteed WITHIN a partition, not across partitions.
             
Partition assignment:
  If message has key:   partition = hash(key) % num_partitions
  If no key:            round-robin across partitions
  
Why keys matter:
  All messages with the same key go to the same partition.
  This guarantees ordering for that key.
  Example: key = user_id ensures all events for a user are ordered.
```

### 6.4 Consumer Group Model

```
Topic "orders" has 6 partitions: P0, P1, P2, P3, P4, P5

Consumer Group A (3 consumers):     Consumer Group B (2 consumers):
  Consumer A1: P0, P1                 Consumer B1: P0, P1, P2
  Consumer A2: P2, P3                 Consumer B2: P3, P4, P5
  Consumer A3: P4, P5

Rules:
  1. Each partition is consumed by EXACTLY ONE consumer in a group
  2. A consumer can consume MULTIPLE partitions
  3. If consumers > partitions, extra consumers sit idle
  4. Different consumer groups are INDEPENDENT (each gets all messages)
  
This gives us:
  - Parallelism: Add consumers up to partition count
  - Broadcast: Multiple consumer groups each get full stream
  - Load balancing: Partitions distribute work across consumers
```

---

## 7. API Design

### 7.1 Producer API

```
// Create a producer
Producer producer = new Producer(config);

// Send a message (async by default)
Future<RecordMetadata> send(
    String topic,           // required: target topic
    byte[] key,             // optional: determines partition (hash-based)
    byte[] value,           // required: message payload
    Map<String, byte[]> headers,  // optional: metadata headers
    Long timestamp          // optional: event time (default = current time)
);

// RecordMetadata contains:
{
    "topic": "orders",
    "partition": 3,
    "offset": 15842,
    "timestamp": 1712456000000
}

// Flush: block until all buffered messages are sent
void flush();

// Close: flush and release resources
void close();
```

### 7.2 Consumer API

```
// Create a consumer in a group
Consumer consumer = new Consumer(config);

// Subscribe to topics (triggers rebalance)
void subscribe(List<String> topics);

// Poll for messages (pull-based with long polling)
ConsumerRecords poll(Duration timeout);

// Commit offsets (marks messages as processed)
void commitSync();                    // commit current position, blocks
void commitAsync(Callback callback);  // commit current position, async

// Seek to specific offset
void seek(TopicPartition partition, long offset);
void seekToBeginning(Collection<TopicPartition> partitions);
void seekToEnd(Collection<TopicPartition> partitions);

// ConsumerRecord contains:
{
    "topic": "orders",
    "partition": 3,
    "offset": 15842,
    "key": "user-123",
    "value": "{\"orderId\":\"ord-456\",\"amount\":99.99}",
    "timestamp": 1712456000000,
    "headers": {"source": "checkout-service"}
}
```

### 7.3 Admin API

```
// Topic operations
TopicId createTopic(
    String name,
    int partitions,
    int replicationFactor,
    Map<String, String> configs    // retention.ms, cleanup.policy, etc.
);

void deleteTopic(String name);
void alterTopicConfig(String name, Map<String, String> configs);
TopicDescription describeTopic(String name);

// Consumer group operations
List<ConsumerGroupInfo> listConsumerGroups();
ConsumerGroupDescription describeConsumerGroup(String groupId);
void resetOffsets(String groupId, Map<TopicPartition, Long> offsets);

// Cluster operations
ClusterDescription describeCluster();  // brokers, controller, topics
Map<TopicPartition, ReplicaInfo> describeLogDirs();  // disk usage
```

---

## 8. Message Format

### 8.1 Record Batch (On-Disk and On-Wire Format)

```
Record Batch Header (61 bytes):
+---------------------------------------------------------------+
| base_offset (8B) | batch_length (4B) | partition_leader_epoch  |
| (4B) | magic (1B) | crc (4B) | attributes (2B) |             |
| last_offset_delta (4B) | base_timestamp (8B) |                |
| max_timestamp (8B) | producer_id (8B) | producer_epoch (2B) | |
| base_sequence (4B) | record_count (4B)                        |
+---------------------------------------------------------------+

Individual Record (variable length):
+---------------------------------------------------------------+
| length (varint) | attributes (1B) | timestamp_delta (varint)  |
| offset_delta (varint) | key_length (varint) | key (bytes)     |
| value_length (varint) | value (bytes) | headers_count (varint)|
| [header_key_length (varint) | header_key (bytes) |            |
|  header_value_length (varint) | header_value (bytes)] ...     |
+---------------------------------------------------------------+

Key design choices:
  - Delta encoding: timestamps and offsets stored as deltas from base
  - Varint encoding: smaller messages use fewer bytes for length fields
  - Batch-level compression: entire batch compressed together (better ratio)
  - Same format on disk and wire: zero-copy transfer possible (sendfile)
```

### 8.2 Supported Compression Codecs

```
+-------------+------------------+------------------+-------------------+
| Codec       | Compression Ratio| CPU Cost         | Best For          |
+-------------+------------------+------------------+-------------------+
| None        | 1x               | None             | Already-compressed|
| GZIP        | 5-8x             | High             | Max compression   |
| Snappy      | 2-3x             | Low              | Balanced (default)|
| LZ4         | 2-3x             | Very Low         | Lowest latency    |
| ZSTD        | 4-7x             | Medium           | Best ratio/speed  |
+-------------+------------------+------------------+-------------------+

Compression happens at the BATCH level, not per-message.
This means larger batches = better compression ratios.
Producer batching (linger.ms + batch.size) directly improves compression.
```

---

## 9. Interview Strategy: Opening Statement

> "I'll design a distributed, log-based message queue similar to Apache Kafka.
> The core insight is that an **append-only log** combined with **sequential disk I/O**
> gives us persistence at memory-like speeds. Messages are organized into **topics**
> split across **partitions** -- the partition is our unit of parallelism, ordering,
> and replication. **Consumer groups** enable both point-to-point and pub-sub patterns.
> I'll walk through the architecture, storage model, replication protocol,
> consumer coordination, and then deep-dive into exactly-once semantics and
> log compaction."

---

## 10. Scope Boundaries

### 10.1 In Scope

```
+-------------------------------+----------------------------------------+
| Component                     | Scope                                  |
+-------------------------------+----------------------------------------+
| Broker cluster                | Storage, replication, serving           |
| Producer client               | Batching, partitioning, acks            |
| Consumer client               | Polling, offset management, rebalance   |
| Coordinator                   | Metadata, leader election, group mgmt   |
| Replication protocol          | Leader/follower, ISR, failover          |
| Storage engine                | Log segments, indexes, compaction       |
| Delivery semantics            | At-most/at-least/exactly-once           |
+-------------------------------+----------------------------------------+
```

### 10.2 Out of Scope (Mention But Don't Design)

```
+-------------------------------+----------------------------------------+
| Component                     | Reason                                 |
+-------------------------------+----------------------------------------+
| Stream processing (Kafka      | Separate system built ON TOP of MQ     |
|   Streams / Flink)            |                                        |
| Schema registry               | Complementary service, not core MQ     |
| REST proxy / HTTP gateway     | Thin wrapper over native protocol      |
| Multi-datacenter replication  | MirrorMaker / Cluster Linking layer    |
| Monitoring / alerting         | External system (Prometheus + Grafana) |
| Authentication / Authorization| Pluggable via SASL/SSL + ACLs          |
+-------------------------------+----------------------------------------+
```
