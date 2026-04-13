# ACID vs BASE: Transaction Models in Distributed Systems

## ACID: The Traditional Guarantee

ACID is the set of properties that guarantee reliable transaction processing
in traditional relational databases.

```
  +------------------------------------------------------------+
  |  A - Atomicity       All or nothing. No partial writes.    |
  |  C - Consistency     DB moves from one valid state to      |
  |                      another. All constraints satisfied.   |
  |  I - Isolation       Concurrent txns don't interfere.      |
  |  D - Durability      Committed data survives crashes.      |
  +------------------------------------------------------------+
```

---

### Atomicity: All or Nothing

A transaction either completes entirely or has no effect at all.
There is no state where only "half" of the operations are applied.

**Concrete example -- bank transfer:**
```
  BEGIN TRANSACTION;
    UPDATE accounts SET balance = balance - 500 WHERE id = 'Alice';
    UPDATE accounts SET balance = balance + 500 WHERE id = 'Bob';
  COMMIT;

  Two possible outcomes:
    1. BOTH updates succeed  --> Alice -500, Bob +500
    2. ANY failure           --> NEITHER update applied (ROLLBACK)

  IMPOSSIBLE outcome:
    Alice -500, Bob unchanged  (money vanishes)
```

**How it works:** Write-ahead log (WAL). The database writes intentions to
a log before modifying data. On crash, the log is replayed to either
complete or undo the partial transaction.

---

### Consistency: Valid State to Valid State

Every transaction brings the database from one valid state to another.
All constraints (foreign keys, unique constraints, CHECK constraints)
are satisfied before and after the transaction.

**Concrete example:**
```
  Table: orders
    - order_total must be >= 0
    - customer_id must reference a valid customer

  INSERT INTO orders (customer_id, order_total)
  VALUES (999, -50);

  Result: REJECTED. Violates CHECK constraint (total >= 0)
          and possibly FK constraint (customer 999 may not exist).
          Database stays in the previous valid state.
```

**Note:** This "C" in ACID is different from the "C" in CAP. ACID
consistency means schema/constraint correctness. CAP consistency means
all nodes see the same data.

---

### Isolation: Concurrent Transactions Don't Interfere

Multiple transactions running simultaneously produce the same result as
if they ran sequentially (at the highest isolation level).

**Concrete example -- the lost update problem:**
```
  WITHOUT proper isolation:
    T1: READ balance = 1000
    T2: READ balance = 1000
    T1: WRITE balance = 1000 - 200 = 800
    T2: WRITE balance = 1000 - 300 = 700
    Final: balance = 700  (T1's deduction is LOST)

  WITH serializable isolation:
    T1: READ balance = 1000
    T1: WRITE balance = 800
    T2: READ balance = 800   (sees T1's write)
    T2: WRITE balance = 500
    Final: balance = 500  (CORRECT: both deductions applied)
```

**Isolation levels (weakest to strongest):**
```
  Read Uncommitted  --> dirty reads possible
  Read Committed    --> no dirty reads, but non-repeatable reads
  Repeatable Read   --> no non-repeatable reads, but phantom reads
  Serializable      --> fully isolated, as if sequential
```

---

### Durability: Committed Data Survives Crashes

Once a transaction is committed, it will persist even if the system
crashes immediately after.

**Concrete example:**
```
  Client receives "COMMIT successful" at 10:00:00.
  Server crashes at 10:00:01.
  Server restarts at 10:05:00.

  The committed data is STILL there.

  How: Write-ahead log (WAL) is flushed to disk before
       COMMIT returns. On recovery, WAL is replayed.
```

---

### Where ACID Applies

- Traditional RDBMS: PostgreSQL, MySQL, Oracle, SQL Server
- Single-node operations where strong correctness is needed
- Financial systems, booking engines, inventory management

### ACID Limitations in Distributed Systems

```
  +-------------------------------------------------------------+
  | Problem: ACID doesn't scale across multiple machines easily  |
  +-------------------------------------------------------------+
  | - 2PC (Two-Phase Commit) is needed for distributed txns     |
  |   --> Blocking: coordinator crash = all participants stuck   |
  |   --> Slow: multiple round-trips across network              |
  |   --> Reduces availability (any participant down = abort)    |
  |                                                              |
  | - Serializable isolation across nodes is extremely expensive |
  | - Cross-datacenter ACID requires coordination overhead       |
  | - Locks don't scale: more nodes = more contention            |
  +-------------------------------------------------------------+
```

---

## BASE: The Distributed Alternative

BASE trades strict correctness for availability and performance. It
embraces the reality that in large-scale distributed systems, temporary
inconsistency is acceptable.

```
  +------------------------------------------------------------+
  |  BA - Basically Available   System guarantees availability  |
  |                             (may return stale data)         |
  |  S  - Soft state           State may change over time      |
  |                             even without new input          |
  |                             (background sync happening)     |
  |  E  - Eventually           All replicas converge to the    |
  |       consistent           same value given enough time    |
  +------------------------------------------------------------+
```

---

### Basically Available

The system always responds to every request, even during partial failures.
Responses may not be the most current data, but the system doesn't refuse
to serve.

```
  Example: Amazon product page during peak load.
  - Product info might be slightly stale (cached price from 2s ago).
  - Reviews might load from a different replica than product details.
  - But the page ALWAYS loads. No "503 Service Unavailable."
```

---

### Soft State

The state of the system may change without any external trigger because
background processes (replication, anti-entropy, gossip) are constantly
synchronizing data between nodes.

```
  T=0:    Node A: inventory=50    Node B: inventory=45
          (Node A received an update, Node B hasn't yet)

  T=100ms: Node A: inventory=50    Node B: inventory=50
           (background replication synced the update)

  The state of Node B changed without any client writing to it.
```

---

### Eventually Consistent

If updates stop, all replicas will converge to the same state. There is
no guarantee about how quickly this happens, but in practice it is usually
milliseconds to low seconds.

```
  Write to one replica ----> propagates ----> all replicas agree

  "Eventually" in practice:
    Same datacenter:    1 - 50 ms
    Cross-region:       50 - 500 ms
    Under heavy load:   seconds
    During partition:   until partition heals
```

---

### Where BASE Applies

- Distributed NoSQL: Cassandra, DynamoDB, Riak, CouchDB
- Microservices communicating via async events
- Systems where availability > strict consistency
- Social media, analytics, logging, recommendation engines

### BASE Advantages

```
  + Higher availability (always responds)
  + Better write performance (no coordination overhead)
  + Horizontal scaling (add nodes, no 2PC needed)
  + Partition tolerant (operates through network splits)
  + Lower latency (no waiting for distributed consensus)
```

---

## ACID vs BASE: Comparison Table

```
  +-------------------------+---------------------------+-------------------------+
  | Criteria                | ACID                      | BASE                    |
  +-------------------------+---------------------------+-------------------------+
  | Consistency model       | Strong (immediate)        | Eventual                |
  +-------------------------+---------------------------+-------------------------+
  | Availability priority   | Lower (correctness first) | Higher (always respond) |
  +-------------------------+---------------------------+-------------------------+
  | Data freshness          | Always current             | May be stale            |
  +-------------------------+---------------------------+-------------------------+
  | Scaling model           | Vertical (scale up)       | Horizontal (scale out)  |
  +-------------------------+---------------------------+-------------------------+
  | Transaction scope       | Multi-row, multi-table    | Usually single-record   |
  +-------------------------+---------------------------+-------------------------+
  | Conflict handling       | Pessimistic (locks)       | Optimistic (resolve     |
  |                         |                           |  after the fact)        |
  +-------------------------+---------------------------+-------------------------+
  | Performance under load  | Degrades with contention  | Scales linearly         |
  +-------------------------+---------------------------+-------------------------+
  | Failure behavior        | Reject / block / timeout  | Serve stale, fix later  |
  +-------------------------+---------------------------+-------------------------+
  | Implementation          | WAL, 2PC, MVCC            | Async replication,      |
  | complexity              |                           |  CRDTs, gossip          |
  +-------------------------+---------------------------+-------------------------+
  | Best for                | Correctness-critical data | High-throughput,        |
  |                         | (money, bookings)         |  partition-tolerant ops  |
  +-------------------------+---------------------------+-------------------------+
```

---

## The Spectrum: It's Not Either/Or

Modern systems blur the line between ACID and BASE. Many offer tunable
guarantees so you can pick the right trade-off per use case.

```
  ACID <=============================================> BASE
    |         |              |              |           |
  PostgreSQL  CockroachDB   MongoDB       DynamoDB   Cassandra
  MySQL       Spanner       (tunable)     (tunable)  (default)
  (single     (distributed  write/read    strong OR   eventual
   node)       ACID)        concern       eventual

  <--- stricter ----- the spectrum ----- looser --->
```

### DynamoDB: Tunable Consistency
```
  Default: Eventually consistent reads (fast, cheap)
  Option:  Strongly consistent reads (2x cost, higher latency)
  
  Why: Most reads (product catalog, user profiles) tolerate staleness.
       Critical reads (order status, account balance) use strong mode.
```

### CockroachDB: Distributed ACID (NewSQL)
```
  Full ACID transactions across a distributed cluster.
  Uses Raft consensus for replication.
  Serializable isolation as default.
  
  Trade-off: Higher latency than eventual consistency systems.
  Sweet spot: Need ACID guarantees but also need horizontal scaling.
```

### MongoDB: Tunable Read/Write Concern
```
  Write Concern:
    w: 1          --> acknowledged by primary only (fast, risk of loss)
    w: "majority" --> acknowledged by majority of replicas (safe)

  Read Concern:
    "local"       --> return data from this node (might be stale)
    "majority"    --> return data committed to majority (consistent)
    "linearizable" --> strongest; confirms data is up-to-date

  Mix and match per operation based on need.
```

---

## When to Choose ACID

Use ACID when **incorrect data causes real harm**:

```
  +----------------------------------------------------+
  | Use Case              | Why ACID                   |
  +----------------------------------------------------+
  | Bank transfers        | Money must not vanish or    |
  |                       |  duplicate                  |
  +----------------------------------------------------+
  | Flight/hotel booking  | Double-booking = angry      |
  |                       |  customers, legal issues    |
  +----------------------------------------------------+
  | E-commerce inventory  | Overselling = can't fulfill |
  |                       |  orders                     |
  +----------------------------------------------------+
  | User authentication   | Auth state must be          |
  |                       |  immediately consistent     |
  +----------------------------------------------------+
  | Billing / invoicing   | Incorrect charges = legal   |
  |                       |  and trust issues            |
  +----------------------------------------------------+
  | Distributed locks     | Must be globally consistent |
  +----------------------------------------------------+
```

---

## When to Choose BASE

Use BASE when **availability and performance outweigh perfect consistency**:

```
  +----------------------------------------------------+
  | Use Case              | Why BASE                   |
  +----------------------------------------------------+
  | Social media feeds    | A like count being off by 1 |
  |                       |  for 100ms is fine          |
  +----------------------------------------------------+
  | Analytics / metrics   | Approximate counts are      |
  |                       |  acceptable                 |
  +----------------------------------------------------+
  | Logging / auditing    | Better to log eventually    |
  |                       |  than lose logs to downtime |
  +----------------------------------------------------+
  | Shopping cart          | Cart state can be           |
  |                       |  eventually consistent      |
  +----------------------------------------------------+
  | CDN / caching layer   | Stale cache for seconds     |
  |                       |  is normal                  |
  +----------------------------------------------------+
  | Recommendation engine | Slightly stale recs are     |
  |                       |  perfectly fine              |
  +----------------------------------------------------+
  | IoT sensor data       | Volume matters more than    |
  |                       |  per-record accuracy        |
  +----------------------------------------------------+
```

---

## Interview Questions with Answers

**Q1: "Explain the difference between ACID and BASE."**
ACID guarantees strict consistency through atomic transactions, isolation, and
durability -- every operation is immediately correct across the system. BASE
accepts temporary inconsistency in exchange for higher availability and
performance, with the guarantee that all replicas will eventually converge.
ACID is pessimistic (prevent conflicts), BASE is optimistic (detect and resolve).

**Q2: "Can a distributed system be ACID?"**
Yes. NewSQL systems like CockroachDB, Google Spanner, and TiDB provide ACID
guarantees across distributed nodes using consensus protocols (Raft, Paxos)
and careful coordination. The trade-off is higher latency compared to
BASE systems.

**Q3: "You're designing a ride-sharing app. Which parts use ACID vs BASE?"**
- ACID: Payment processing (charge must be exact), trip assignment (no double
  dispatch to the same driver), account balance updates.
- BASE: Driver location updates (eventual consistency is fine -- locations
  update every few seconds anyway), trip history display, ratings, push
  notifications.

**Q4: "What happens if you use eventual consistency for a bank account?"**
Two concurrent withdrawals could each see the full balance and both succeed,
overdrawing the account. Example: balance=1000, two ATMs each withdraw 800.
Both see 1000, both approve, final balance = -600. This is why financial
systems require strong consistency.

**Q5: "How does 2PC relate to ACID in distributed systems?"**
Two-Phase Commit (2PC) is the protocol used to achieve atomicity across
multiple nodes. Phase 1: coordinator asks all participants to prepare (vote).
Phase 2: if all vote YES, coordinator tells all to commit; if any votes NO,
all abort. The problem: if the coordinator crashes between phases, participants
are blocked indefinitely, hurting availability.

**Q6: "What is the 'C' overlap between ACID and CAP?"**
They mean different things. ACID Consistency = the database enforces schema
constraints and moves between valid states. CAP Consistency = all nodes in a
distributed system see the same data at the same time (linearizability).
A system can be ACID-consistent (constraints enforced) but CAP-inconsistent
(replicas may be stale).

---

## Cheat Sheet for Quick Revision

```
  +=========================================================+
  |                  ACID vs BASE CHEAT SHEET                |
  +=========================================================+
  |                                                          |
  |  ACID = Pessimistic, strong, correctness-first           |
  |    A: All or nothing (rollback on failure)               |
  |    C: Schema constraints always satisfied                |
  |    I: Transactions don't see each other's partial work   |
  |    D: Committed = permanent, survives crashes            |
  |    Systems: PostgreSQL, MySQL, CockroachDB, Spanner      |
  |    Use for: money, bookings, inventory, auth             |
  |                                                          |
  |  BASE = Optimistic, flexible, availability-first         |
  |    BA: Always responds (even if stale)                   |
  |    S:  State changes in background (replication)         |
  |    E:  Replicas converge eventually                      |
  |    Systems: Cassandra, DynamoDB, Riak, CouchDB           |
  |    Use for: feeds, analytics, logs, caching, IoT         |
  |                                                          |
  |  MODERN REALITY: Many systems are TUNABLE                |
  |    DynamoDB: eventual OR strong per-read                 |
  |    MongoDB: w:1 (fast) or w:majority (safe)              |
  |    Cassandra: ONE (eventual) to QUORUM (strong)          |
  |    CockroachDB: distributed ACID (NewSQL)                |
  |                                                          |
  |  DECISION FRAMEWORK:                                     |
  |    "If a stale read causes financial/legal harm" -> ACID |
  |    "If a stale read is just a minor UX glitch"   -> BASE|
  |    "If you need both at different layers"     -> HYBRID  |
  |                                                          |
  |  KEY INSIGHT:                                            |
  |    ACID and BASE are not enemies. Most production        |
  |    systems use ACID for the transaction layer and        |
  |    BASE for the caching/read layer. Use both where       |
  |    they each make sense.                                 |
  |                                                          |
  +=========================================================+
```

---

## Key Takeaways

```
  1. ACID = correctness. BASE = availability + performance.
  2. ACID doesn't scale well across nodes without expensive protocols (2PC).
  3. BASE accepts temporary inconsistency as a feature, not a bug.
  4. Modern systems (NewSQL) prove you CAN have distributed ACID,
     but at the cost of latency.
  5. Most real systems are HYBRID: ACID for writes, BASE for reads.
  6. The "C" in ACID (schema constraints) is NOT the "C" in CAP
     (replica agreement). Know the difference for interviews.
  7. Tunable consistency (DynamoDB, Cassandra, MongoDB) lets you
     pick ACID-like or BASE-like behavior per operation.
```
