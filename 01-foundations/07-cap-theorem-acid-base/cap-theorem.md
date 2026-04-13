# CAP Theorem & PACELC

## What the CAP Theorem Actually Says

In 2000, Eric Brewer conjectured (later proved by Gilbert & Lynch in 2002) that
a distributed data store can provide **at most two** of these three guarantees
**simultaneously when a network partition occurs**:

```
 C - Consistency      Every read receives the most recent write (or an error)
 A - Availability     Every request receives a non-error response (no guarantee it's the latest)
 P - Partition        The system continues to operate despite network partitions
     Tolerance        between nodes
```

The key insight most people miss: **you don't choose 2 out of 3 in general**.
Network partitions WILL happen in any distributed system, so P is mandatory.
The real choice is: **during a partition, do you sacrifice C or A?**

```
  +---------------------------------------------------------+
  | THE REAL CAP QUESTION                                   |
  |                                                         |
  |  Network partition happens. You must choose:            |
  |                                                         |
  |  Option 1 (CP): Refuse some requests to stay correct    |
  |  Option 2 (AP): Serve all requests, risk stale data     |
  +---------------------------------------------------------+
```

---

## The Three Properties: Restaurant Analogy

Imagine a restaurant chain with two locations sharing a single menu and inventory.

### Consistency (C)
Both locations always show the same menu. If Location A removes an item,
Location B immediately reflects this. A customer at either location sees
the identical, up-to-date menu.

### Availability (A)
Every customer who walks into either location gets served. No one is turned
away. Even if the food might not be the latest special, you still get food.

### Partition Tolerance (P)
The phone line between the two locations goes down. They can no longer
communicate. The system must still function somehow.

**The dilemma when the phone line is down:**
- **CP choice:** Location B stops serving items that might have changed,
  telling customers "sorry, we can't confirm this is available right now."
- **AP choice:** Both locations keep serving from their last-known menu.
  A customer might order something that's actually sold out at the other location.

---

## ASCII Diagram: The Partition Scenario

```
  NORMAL OPERATION (no partition - everything is fine)
  ====================================================

    Client A                              Client B
       |                                     |
       v                                     v
  +----------+    sync replication    +----------+
  | Node 1   |<=====================>| Node 2   |
  | data: v5 |                       | data: v5 |
  +----------+                       +----------+
       Both nodes agree. C + A + P all satisfied.


  NETWORK PARTITION OCCURS
  ====================================================

    Client A                              Client B
       |                                     |
       v                                     v
  +----------+         XXXXX          +----------+
  | Node 1   |<======XX   XX========>| Node 2   |
  | data: v5 |       XXXXXXX         | data: v5 |
  +----------+    (link broken)       +----------+

  Client A writes data: v6 to Node 1.
  Node 2 cannot receive the update.

  NOW WHAT?

  CP SYSTEM RESPONSE:                AP SYSTEM RESPONSE:
  +--------------------+             +--------------------+
  | Node 1: accept v6  |             | Node 1: accept v6  |
  | Node 2: REJECT     |             | Node 2: accept     |
  |   reads/writes     |             |   reads (returns    |
  |   (unavailable)    |             |    stale v5)        |
  |                    |             |                     |
  | Result: consistent |             | Result: available   |
  |   but some clients |             |   but clients may   |
  |   get errors       |             |   see different     |
  +--------------------+             |   values            |
                                     +--------------------+
```

---

## CP Systems: Consistency over Availability

CP systems **refuse to serve potentially stale data**. During a partition,
nodes that cannot confirm they have the latest data will return errors or
become read-only.

### How CP Systems Behave During a Partition

```
  Client request -----> [ Minority partition node ]
                                    |
                         Cannot reach majority?
                                    |
                            +-------+-------+
                            |               |
                         REJECT          TIMEOUT
                         write           request
                            |               |
                     Return error     Return error
                     to client        to client
```

### Real-World CP Systems

| System       | Partition Behavior                                       |
|-------------|----------------------------------------------------------|
| **HBase**    | RegionServer loses ZooKeeper session, stops serving       |
| **MongoDB**  | (strong mode) Minority side rejects writes; reads may fail|
| **ZooKeeper**| Minority partition nodes reject all requests              |
| **etcd**     | Raft leader in minority steps down; minority rejects ops  |
| **Redis Cluster** | Minority partition nodes stop accepting writes       |
| **Spanner**  | Uses TrueTime; partitioned nodes wait or reject           |

**ZooKeeper example in detail:**
- ZooKeeper requires a quorum (majority) to process any write.
- If a 5-node cluster partitions into 2+3, the 2-node side cannot
  form a quorum and rejects ALL operations.
- The 3-node side continues serving normally.
- Clients connected to the minority side get errors.

**etcd / Raft example:**
- The Raft leader must replicate to a majority before committing.
- If the leader ends up in the minority partition, it steps down.
- A new leader is elected in the majority partition.
- Minority nodes return "no leader" errors.

---

## AP Systems: Availability over Consistency

AP systems **always accept requests**, even during partitions. Both sides
of the partition continue to serve reads and accept writes. This means
different nodes may have different versions of the data.

### How AP Systems Behave During a Partition

```
  Client A writes v6 -----> [ Node 1 ]     [ Node 2 ] <---- Client B writes v7
                             data: v6   XXX  data: v7
                                        XXX
                            (partition)

  Client C reads from Node 1 --> gets v6
  Client D reads from Node 2 --> gets v7

  AFTER PARTITION HEALS:
  Node 1 and Node 2 must reconcile v6 and v7.
  Conflict resolution strategy kicks in:
    - Last-write-wins (LWW)
    - Vector clocks
    - Application-level merge
    - CRDTs
```

### Real-World AP Systems

| System            | Conflict Resolution Strategy                       |
|-------------------|----------------------------------------------------|
| **Cassandra**     | Last-write-wins (LWW) by default using timestamps  |
| **DynamoDB**      | Last-writer-wins (default) or conditional writes    |
| **CouchDB**       | Stores all conflicts; app chooses winner            |
| **Riak**          | Vector clocks + sibling resolution                  |
| **Voldemort**     | Vector clocks, application resolves                 |

**Cassandra example in detail:**
- During partition, both sides accept writes.
- Each write gets a timestamp.
- When partition heals, anti-entropy (read repair, Merkle trees) syncs data.
- Conflicting writes resolved by highest timestamp wins.
- Risk: clock skew can cause "wrong" write to win.

**DynamoDB example:**
- Default: eventual consistency. Reads may return stale data.
- Writes always accepted (high availability is the primary goal).
- Conditional writes (optimistic locking) can prevent conflicts.
- Optional: strongly consistent reads (but this trades off availability).

---

## "CA" Systems: Only Without Partitions

A "CA" system provides both Consistency and Availability but cannot tolerate
network partitions. This is only possible in a **single-node** system or a
system where you can guarantee the network never partitions.

```
  +---------------------------------------------------+
  |  "CA" Systems                                     |
  |                                                   |
  |  - Single-node PostgreSQL                         |
  |  - Single-node MySQL                              |
  |  - Single-node Oracle                             |
  |                                                   |
  |  These are consistent AND available because       |
  |  there is no network to partition.                |
  |                                                   |
  |  The moment you add a second node over a          |
  |  network, P becomes a real concern and you        |
  |  must choose between C and A.                     |
  +---------------------------------------------------+
```

In interviews, if asked about CA systems: explain that CA is essentially
a single-node database. It's consistent and available, but irrelevant for
distributed system design because partitions are inevitable at scale.

---

## Common Misconception: "Always Give Up One"

**Wrong interpretation:** "CAP says you pick 2 out of 3 and permanently lose one."

**Correct interpretation:** CAP only forces a trade-off **during a network
partition**. When the network is healthy, a well-designed system can provide
both consistency and availability.

```
  +--------------------+-------------------+-------------------+
  | Network State      | CP System         | AP System         |
  +--------------------+-------------------+-------------------+
  | Healthy (no        | Consistent AND    | Consistent AND    |
  |  partition)        | Available         | Available         |
  +--------------------+-------------------+-------------------+
  | Partitioned        | Consistent but    | Available but     |
  |                    | NOT Available     | NOT Consistent    |
  +--------------------+-------------------+-------------------+
  | Partition heals    | Resumes full      | Reconciles data,  |
  |                    | operation         | then consistent   |
  +--------------------+-------------------+-------------------+
```

Most distributed systems spend 99.99%+ of their time without partitions.
The CAP trade-off applies to that rare 0.01% -- but it is the 0.01% that
defines your system's behavior during failures.

---

## PACELC Theorem: The Complete Picture

CAP only describes behavior **during partitions**. But what about normal
operation? The PACELC theorem (Daniel Abadi, 2012) extends CAP:

```
  +-------------------------------------------------------+
  |                   PACELC THEOREM                       |
  |                                                        |
  |  if (Partition) {                                      |
  |      choose: Availability (A) vs Consistency (C)       |
  |  } else {                                              |
  |      choose: Latency (L) vs Consistency (C)            |
  |  }                                                     |
  |                                                        |
  |  Format:  P + A/C  +  E + L/C                          |
  +-------------------------------------------------------+
```

Even without partitions, replicating data across nodes introduces a trade-off:
- **Low latency:** Don't wait for all replicas to acknowledge (risk inconsistency)
- **Strong consistency:** Wait for all replicas (higher latency)

### PACELC Categories

```
  +----------+--------------+---------------+----------------------------+
  | Category | Partition    | Else          | Example Systems            |
  |          | (P: A or C)  | (E: L or C)   |                            |
  +----------+--------------+---------------+----------------------------+
  | PA/EL    | Availability | Latency       | Cassandra, Riak, DynamoDB  |
  |          |              |               |  (default config)          |
  +----------+--------------+---------------+----------------------------+
  | PC/EC    | Consistency  | Consistency   | HBase, VoltDB, Spanner     |
  |          |              |               |  (strict mode)             |
  +----------+--------------+---------------+----------------------------+
  | PA/EC    | Availability | Consistency   | DynamoDB (tuned),          |
  |          |              |               |  MongoDB (default)         |
  +----------+--------------+---------------+----------------------------+
  | PC/EL    | Consistency  | Latency       | Yahoo! PNUTS (historical)  |
  |          |              |               |                            |
  +----------+--------------+---------------+----------------------------+
```

### PA/EL: Cassandra
- **During partition:** Both sides keep accepting reads and writes (Available).
- **Normal operation:** Reads default to ONE replica for speed (Latency).
- Trade-off: fast everywhere, but stale reads are possible even without partitions.
- Tunable: you CAN set QUORUM reads to get EC behavior.

### PC/EC: HBase / Spanner
- **During partition:** Minority nodes stop serving (Consistent).
- **Normal operation:** Reads go through RegionServer which ensures fresh data (Consistent).
- Trade-off: always correct, but higher latency and potential unavailability.

### PA/EC: DynamoDB (common configuration)
- **During partition:** Always available, accepts writes on all nodes (Available).
- **Normal operation:** Strongly consistent reads available (Consistent), though
  default is eventual.
- This is a hybrid: prioritize uptime during failures, prioritize correctness
  during normal operation.

### PC/EL: PNUTS (Yahoo!)
- **During partition:** Consistency (master-per-record model).
- **Normal operation:** Optimized for latency with timeline consistency.
- Rare combination; most systems that choose PC also choose EC.

---

## Real-World Systems: Complete CAP + PACELC Mapping

```
  +------------------+------+----------+----------------------------------------+
  | System           | CAP  | PACELC   | Notes                                  |
  +------------------+------+----------+----------------------------------------+
  | PostgreSQL       | CA   | --       | Single-node; N/A for distributed       |
  | (single node)    |      |          |                                        |
  +------------------+------+----------+----------------------------------------+
  | Cassandra        | AP   | PA/EL    | Tunable; can act as PC/EC with QUORUM  |
  +------------------+------+----------+----------------------------------------+
  | DynamoDB         | AP   | PA/EC    | Default eventual; strong reads optional |
  +------------------+------+----------+----------------------------------------+
  | MongoDB          | CP   | PA/EC    | Default w:1 is AP-ish; w:majority = CP |
  | (replica set)    |      |          |                                        |
  +------------------+------+----------+----------------------------------------+
  | HBase            | CP   | PC/EC    | Relies on ZooKeeper for consistency     |
  +------------------+------+----------+----------------------------------------+
  | ZooKeeper        | CP   | PC/EC    | Quorum-based; minority nodes go down   |
  +------------------+------+----------+----------------------------------------+
  | etcd             | CP   | PC/EC    | Raft consensus; always consistent       |
  +------------------+------+----------+----------------------------------------+
  | CockroachDB      | CP   | PC/EC    | Distributed SQL; serializable isolation |
  +------------------+------+----------+----------------------------------------+
  | Riak             | AP   | PA/EL    | Vector clocks for conflict resolution   |
  +------------------+------+----------+----------------------------------------+
  | CouchDB          | AP   | PA/EL    | Multi-version concurrency; stores all   |
  +------------------+------+----------+----------------------------------------+
  | Redis Cluster    | CP   | PC/EL    | Async replication; CP during partition   |
  +------------------+------+----------+----------------------------------------+
  | Spanner          | CP   | PC/EC    | TrueTime for external consistency       |
  +------------------+------+----------+----------------------------------------+
```

---

## Interview Cheat Sheet

**Q: "Explain CAP theorem in one sentence."**
A: In a distributed system experiencing a network partition, you must choose
   between consistency (all nodes see the same data) and availability (every
   request gets a response).

**Q: "Is it possible to have all three?"**
A: Only when there is no partition. During normal operation, a well-designed
   system can be both consistent and available. CAP only forces the trade-off
   during actual network partitions.

**Q: "Why is partition tolerance not optional?"**
A: In any distributed system communicating over a network, partitions are
   inevitable (hardware failures, network congestion, misconfiguration).
   You cannot choose to not have partitions; you can only choose how to
   respond to them.

**Q: "What does PACELC add to CAP?"**
A: CAP only describes partition-time behavior. PACELC also describes the
   latency-vs-consistency trade-off during normal operation, giving a more
   complete picture of system behavior.

**Q: "Is Cassandra CP or AP?"**
A: By default AP (PA/EL in PACELC). But with quorum reads/writes (R+W > N),
   it behaves as CP. Cassandra's consistency is tunable per query.

**Q: "Why is MongoDB sometimes called CP and sometimes AP?"**
A: MongoDB with write concern `majority` and read concern `majority` is CP.
   With default write concern `w:1`, the primary acknowledges before
   replicating, which is more AP-like. It depends on configuration.

---

## Key Takeaways

```
  1. CAP is about PARTITION-TIME behavior, not everyday operation.
  2. P is not optional in distributed systems -- the real choice is C vs A.
  3. Most systems are tunable -- they sit on a spectrum, not in a fixed box.
  4. PACELC gives the full picture: partition behavior + normal behavior.
  5. Know the default behavior AND tunable options for major systems.
  6. "CA" is only relevant for single-node systems (not distributed).
```
