# Consistency Models in Distributed Systems

## The Consistency Spectrum

Consistency is not binary. It exists on a spectrum from strongest (most
intuitive, most expensive) to weakest (least intuitive, most performant).

```
  STRONGEST                                                    WEAKEST
  (most expensive)                                        (most performant)
     |                                                          |
     v                                                          v
  +----------+   +------------+   +--------+   +-----------+
  | Linear-  |-->| Sequential |-->| Causal |-->| Eventual  |
  | izability|   | Consistency|   | Consis-|   | Consis-   |
  | (Strong) |   |            |   | tency  |   | tency     |
  +----------+   +------------+   +--------+   +-----------+
      |               |               |              |
   Spanner        ZooKeeper      MongoDB         Cassandra
   etcd           etcd (reads)   (causal)        DynamoDB
   CockroachDB                   COPS             Riak
                                                  CouchDB
```

Each level makes fewer guarantees but enables better performance,
availability, and scalability.

---

## Strong Consistency (Linearizability)

The gold standard. The system behaves **as if there is only a single copy
of the data**, and all operations happen atomically at a single point in time.

### Definition
- Every read returns the value of the most recent completed write.
- Once a write completes, ALL subsequent reads (from any client, any node)
  see that write.
- Operations appear to execute in real-time order.

### Visualization

```
  Timeline ------>

  Client A:   Write(x=1) |-------|  (completes at T2)
                          T1     T2

  Client B:                         Read(x) at T3  --> MUST return 1
  Client C:                         Read(x) at T3  --> MUST return 1

  There is NO window where a read after T2 could return the old value.
```

### How It's Achieved

**Consensus protocols** ensure all nodes agree on the order of operations:

```
  +--------+       +--------+       +--------+
  | Node 1 |       | Node 2 |       | Node 3 |
  | (Leader)|       |        |       |        |
  +---+----+       +---+----+       +---+----+
      |                |                |
      |  1. Client writes to leader     |
      |                |                |
      |--Propose v6--->|                |
      |--Propose v6--->|--------------->|
      |                |                |
      |<--ACK----------|                |
      |<--ACK----------|<---------------|
      |                |                |
      |  2. Majority acknowledged       |
      |     Commit write. Respond to    |
      |     client.                     |
      |                |                |
      |  3. ALL subsequent reads from   |
      |     ANY node return v6          |
```

**Raft consensus (etcd, CockroachDB):**
1. Leader receives write.
2. Leader replicates to followers.
3. Once majority acknowledges, leader commits.
4. Leader responds to client.
5. Reads from leader are always fresh. Reads from followers
   require a round-trip to leader to confirm freshness (or use
   read leases).

**Paxos (Spanner, Chubby):**
- Similar majority-based commit.
- More complex protocol but same linearizable guarantee.
- Spanner adds TrueTime for external consistency (strongest form).

### Cost of Strong Consistency

```
  +------------------------+------------------------------------------+
  | Metric                 | Impact                                   |
  +------------------------+------------------------------------------+
  | Write latency          | HIGH - must wait for majority ACK        |
  +------------------------+------------------------------------------+
  | Read latency           | MODERATE-HIGH - may need leader contact  |
  +------------------------+------------------------------------------+
  | Throughput             | LOWER - serialization bottleneck         |
  +------------------------+------------------------------------------+
  | Availability           | LOWER - minority partition is unavailable|
  +------------------------+------------------------------------------+
  | Cross-region           | VERY HIGH latency (100ms+ RTT)           |
  +------------------------+------------------------------------------+
```

### When to Use
- Financial transactions (bank transfers, stock trades)
- Distributed locks (leader election, mutex)
- Configuration management (etcd, ZooKeeper)
- Any system where "stale read = incorrect behavior"

---

## Sequential Consistency

Weaker than linearizability. Operations appear in **some total order**
that is consistent with the order seen by each individual process, but
this order does NOT need to correspond to real-time.

### Definition
- All processes see operations in the same order.
- Each process's operations appear in the order that process issued them.
- But two operations from different processes may appear in any order
  (as long as it's the same order everywhere).

### Key Difference from Linearizability

```
  Real time:  T1        T2        T3        T4
  Client A:   Write(x=1)
  Client B:             Write(x=2)
  Client C:                       Read(x)=?

  LINEARIZABLE:
    Client C must read x=2 (the real-time latest write).

  SEQUENTIALLY CONSISTENT:
    Client C could read x=1 OR x=2, as long as the chosen
    total order is consistent for ALL observers.

    Valid total order: A.write(1), B.write(2)  --> reads return 2
    Valid total order: B.write(2), A.write(1)  --> reads return 1
    Both are fine! The order just has to be the same everywhere.
```

### Where You See It
- ZooKeeper (for reads from followers -- not the strongest mode)
- Some multi-processor memory models
- Java `volatile` variables provide sequential consistency

### Practical Impact
- Cheaper than linearizability (no real-time ordering requirement).
- Still provides a strong-enough guarantee for many applications.
- The gap between sequential and linearizable matters most in
  geo-distributed systems where real-time ordering is expensive.

---

## Causal Consistency

Operations that are **causally related** must be seen in the same order
by all nodes. Operations that are **concurrent** (not causally related)
can be seen in different orders by different nodes.

### What is Causality?

```
  CAUSALLY RELATED:
    1. A writes x=5
    2. B reads x=5, then writes y=10  (B's write DEPENDS on A's write)

    All nodes must see: A.write(x=5) BEFORE B.write(y=10)

  CONCURRENT (NOT causally related):
    1. A writes x=5  (A doesn't know about B)
    2. B writes y=10  (B doesn't know about A)

    Node 1 might see: A.write first, then B.write
    Node 2 might see: B.write first, then A.write
    This is ALLOWED.
```

### Vector Clocks for Tracking Causality

Vector clocks are the mechanism that tracks "who knows what" so the system
can determine which operations are causally related.

```
  3 nodes: A, B, C
  Vector clock = [A_count, B_count, C_count]

  Step 1: A writes x=1
          A's clock: [1, 0, 0]

  Step 2: B reads from A (gets x=1 and clock [1,0,0])
          B writes y=2
          B's clock: [1, 1, 0]   (merged A's clock + incremented B)

  Step 3: C writes z=3 (independently, doesn't know about A or B)
          C's clock: [0, 0, 1]

  Causality detection:
    [1, 1, 0] > [1, 0, 0]  -->  B's write causally follows A's write
    [1, 1, 0] || [0, 0, 1] -->  B's write and C's write are CONCURRENT
                                 (neither dominates the other)
```

**Dominance rule:** Clock V1 > V2 if every component of V1 >= V2 and at
least one is strictly greater. If neither dominates, events are concurrent.

### Where You See It
- MongoDB causal consistency sessions
- COPS (Clusters of Order-Preserving Servers) -- research system
- Some configurations of DynamoDB Streams

### Practical Impact
- Much cheaper than linearizability (no global ordering of concurrent ops).
- Captures the ordering guarantees humans naturally expect.
- Good for social media: a reply must appear after the original post,
  but two independent posts can appear in any order.

---

## Eventual Consistency

The weakest common model. If no new updates are made, **all replicas will
eventually converge to the same value**. No guarantee about WHEN or in
what ORDER intermediate reads will see updates.

### Definition

```
  Client writes x=5 to Node 1 at time T.

  +--------+    +--------+    +--------+
  | Node 1 |    | Node 2 |    | Node 3 |
  | x = 5  |    | x = 3  |    | x = 3  |
  +--------+    +--------+    +--------+
       |  async replication in progress  |
       |                                 |

  At T + 50ms:
  +--------+    +--------+    +--------+
  | Node 1 |    | Node 2 |    | Node 3 |
  | x = 5  |    | x = 5  |    | x = 3  |  <-- still stale!
  +--------+    +--------+    +--------+

  At T + 200ms:
  +--------+    +--------+    +--------+
  | Node 1 |    | Node 2 |    | Node 3 |
  | x = 5  |    | x = 5  |    | x = 5  |  <-- converged
  +--------+    +--------+    +--------+
```

### How Fast is "Eventually"?
- **Within same datacenter:** typically 1-10 milliseconds
- **Cross-region:** typically 50-300 milliseconds
- **Under load/partition:** could be seconds or minutes
- **Key point:** "eventually" has no upper bound guarantee

### Stronger Variants of Eventual Consistency

Eventual consistency alone is too weak for many applications. Several
useful sub-guarantees tighten it:

#### Read-Your-Writes (Session Consistency)
A client always sees its own writes, even if other clients may not yet.

```
  Client A writes x=5 to Node 1.
  Client A reads x from Node 2.

  WITHOUT read-your-writes:  might return x=3 (stale)
  WITH read-your-writes:     guaranteed to return x=5

  Implementation: sticky sessions (always route client to same node)
                  or pass write timestamp and wait for it at read node
```

#### Monotonic Reads
Once a client has seen value x=5, it will never see an older value x=3
on subsequent reads. (Can happen if reads are load-balanced across replicas
at different replication stages.)

```
  Client reads from Node 2: x=5
  Client reads from Node 3: x=3   <-- VIOLATES monotonic reads

  With monotonic reads guarantee, the system ensures the second
  read returns x=5 or newer, never older than what was already seen.
```

#### Monotonic Writes
Writes from a single client are applied in order at all replicas.

```
  Client writes x=1, then x=2.
  All replicas must apply x=1 before x=2.
  No replica should end up with x=1 as the final value.
```

#### Writes-Follow-Reads
If a client reads x=5 and then writes y=10 (based on that read),
all replicas that see y=10 will also have already seen x=5.

### Where You See It
- Cassandra (default consistency level ONE)
- DynamoDB (default reads)
- DNS propagation
- CDN cache invalidation
- Social media feeds (likes, view counts)

---

## Tunable Consistency: The Cassandra Model

Cassandra allows you to choose consistency level **per query**, giving
fine-grained control over the consistency-performance trade-off.

### Key Parameters

```
  N = Number of replicas (replication factor)
  R = Number of replicas that must respond to a READ
  W = Number of replicas that must acknowledge a WRITE
```

### The Quorum Formula

```
  +-----------------------------------------------------------+
  |  STRONG CONSISTENCY CONDITION:   R + W > N                 |
  |                                                            |
  |  If the read set (R) and write set (W) overlap,            |
  |  at least one node in every read has the latest write.     |
  +-----------------------------------------------------------+
```

### Visual Proof (N=3)

```
  Replicas:   [Node A]    [Node B]    [Node C]

  WRITE with W=2:
    Write goes to Node A (ack) and Node B (ack).
    Node C has stale data.

    Nodes with latest data: {A, B}

  READ with R=2:
    Read from any 2 of 3 nodes.

    Possible read sets:
      {A, B} --> at least one has latest  (A or B)
      {A, C} --> A has latest             OVERLAP
      {B, C} --> B has latest             OVERLAP

    R + W = 2 + 2 = 4 > 3 = N  --> ALWAYS overlaps
    Every read set includes at least one up-to-date node.
```

### Consistency Level Configurations

```
  +------------------+-----+-----+---------+----------------------------+
  | Configuration    | R   | W   | R+W > N | Consistency                |
  +------------------+-----+-----+---------+----------------------------+
  | R=1, W=1         | 1   | 1   | 2 > 3?  | EVENTUAL (not guaranteed) |
  |                  |     |     | NO      | Fastest reads & writes     |
  +------------------+-----+-----+---------+----------------------------+
  | R=1, W=QUORUM(2) | 1   | 2   | 3 > 3?  | EVENTUAL (border case)   |
  |                  |     |     | NO      | Fast reads, safe writes    |
  +------------------+-----+-----+---------+----------------------------+
  | R=QUORUM, W=     | 2   | 2   | 4 > 3?  | STRONG                   |
  |  QUORUM          |     |     | YES     | Balanced performance       |
  +------------------+-----+-----+---------+----------------------------+
  | R=ALL, W=ALL     | 3   | 3   | 6 > 3?  | STRONGEST                |
  |                  |     |     | YES     | Slowest, least available   |
  +------------------+-----+-----+---------+----------------------------+
  | R=ALL, W=1       | 3   | 1   | 4 > 3?  | STRONG (write-optimized) |
  |                  |     |     | YES     | Fast writes, slow reads    |
  +------------------+-----+-----+---------+----------------------------+
  | R=1, W=ALL       | 1   | 3   | 4 > 3?  | STRONG (read-optimized)  |
  |                  |     |     | YES     | Fast reads, slow writes    |
  +------------------+-----+-----+---------+----------------------------+
```

### Quorum Size Calculation

```
  QUORUM = floor(N/2) + 1

  N=3:  QUORUM = floor(3/2) + 1 = 1 + 1 = 2
  N=5:  QUORUM = floor(5/2) + 1 = 2 + 1 = 3
  N=7:  QUORUM = floor(7/2) + 1 = 3 + 1 = 4
```

### Trade-off In Practice

```
  R=1, W=1  (fastest, weakest)
  +---------+
  | Write   |---> 1 node ACK ---> done (fast!)
  | Read    |---> 1 node reply --> done (fast!)
  | Risk    |---> might read stale data
  +---------+

  R=QUORUM, W=QUORUM  (balanced)
  +---------+
  | Write   |---> 2/3 nodes ACK ---> done (moderate)
  | Read    |---> 2/3 nodes reply --> pick latest (moderate)
  | Risk    |---> strong consistency, tolerates 1 node failure
  +---------+

  R=ALL, W=ALL  (strongest, slowest)
  +---------+
  | Write   |---> ALL 3 nodes ACK ---> done (slow)
  | Read    |---> ALL 3 nodes reply --> done (slow)
  | Risk    |---> any single node failure = operation fails
  +---------+
```

---

## Consistency Spectrum: Systems Mapped

```
  STRONG                                                    EVENTUAL
  |                                                              |
  |   Spanner   CockroachDB   etcd   ZooKeeper                  |
  |   (linear-    (serial-   (Raft)  (ZAB)                      |
  |    izable)     izable)                                       |
  |        |          |         |       |                        |
  |        v          v         v       v                        |
  |  [====|==========|=========|=======|====]                    |
  |        ^                                                     |
  |        |                                                     |
  |     PostgreSQL            MongoDB    Cassandra    DynamoDB   |
  |     (single               (causal     (tunable)   (default)  |
  |      node)                sessions)                          |
  |                              |           |           |       |
  |                              v           v           v       |
  |                   [=========|===========|===========|====]   |
  |                                                              |
  |   LINEARIZABLE  SEQUENTIAL   CAUSAL    EVENTUAL              |
  |   "one copy"    "total       "cause    "converge             |
  |                  order"       before    eventually"           |
  |                               effect"                        |
  |                                                              |
  +--------------------------------------------------------------+
```

---

## Summary Comparison Table

```
  +------------------+-------------+----------+----------+----------+
  | Property         | Lineariz-   | Sequent- | Causal   | Eventual |
  |                  | able        | ial      |          |          |
  +------------------+-------------+----------+----------+----------+
  | Real-time order  | YES         | NO       | NO       | NO       |
  +------------------+-------------+----------+----------+----------+
  | Total order      | YES         | YES      | NO       | NO       |
  +------------------+-------------+----------+----------+----------+
  | Causal order     | YES         | YES      | YES      | NO       |
  +------------------+-------------+----------+----------+----------+
  | Per-process order| YES         | YES      | YES      | YES      |
  +------------------+-------------+----------+----------+----------+
  | Latency          | Highest     | High     | Moderate | Lowest   |
  +------------------+-------------+----------+----------+----------+
  | Availability     | Lowest      | Low      | High     | Highest  |
  +------------------+-------------+----------+----------+----------+
  | Throughput       | Lowest      | Low      | High     | Highest  |
  +------------------+-------------+----------+----------+----------+
  | Implementation   | Raft/Paxos  | Total-   | Vector   | Async    |
  |                  | + leader    | order    | clocks   | replicat-|
  |                  |             | bcast    |          | ion      |
  +------------------+-------------+----------+----------+----------+
```

---

## Interview Quick-Reference

**Q: "What's the difference between linearizability and sequential consistency?"**
A: Linearizability respects real-time ordering -- if write A completes before
   read B starts, B must see A. Sequential consistency only requires a total
   order consistent with each process's local order, but that order can
   differ from real-time.

**Q: "When is eventual consistency acceptable?"**
A: When temporary staleness doesn't cause incorrect behavior: social media
   likes, product view counts, analytics, DNS, CDN caches. Basically any
   scenario where a slight delay in seeing the latest value is tolerable.

**Q: "How does Cassandra achieve strong consistency?"**
A: By setting R + W > N (typically QUORUM reads + QUORUM writes). This
   guarantees read and write sets overlap, so every read contacts at least
   one node with the latest write.

**Q: "What are vector clocks used for?"**
A: Tracking causal ordering between events in a distributed system. Each
   node maintains a vector of logical clocks. By comparing vectors, the
   system can determine if two events are causally related or concurrent.

**Q: "Can you have strong consistency with high availability?"**
A: Not during a network partition (CAP theorem). During normal operation,
   you can have both, but strong consistency requires waiting for consensus,
   which increases latency and reduces throughput compared to eventual
   consistency.

---

## Key Takeaways

```
  1. Consistency is a SPECTRUM, not a binary choice.
  2. Linearizability = strongest. As if one copy. Expensive.
  3. Sequential = total order, but not necessarily real-time order.
  4. Causal = only causally related ops must be ordered. Practical sweet spot.
  5. Eventual = replicas converge. Fast but stale reads possible.
  6. Tunable consistency (Cassandra) lets you pick per-query.
  7. R + W > N is the quorum formula for strong consistency.
  8. Read-your-writes and monotonic reads are practical sub-guarantees
     that make eventual consistency more usable.
```
