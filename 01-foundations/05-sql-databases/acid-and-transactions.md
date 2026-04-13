# ACID Properties and Transactions

## Why This Matters

Every system design interview involving a relational database ultimately comes back to
transactions and ACID guarantees. If you are building payments, inventory, booking, or
any system where correctness matters more than raw throughput, you need to understand
ACID inside-out. This document gives you the mental model, the real-world examples,
and the vocabulary to nail those discussions.

---

## ACID at a Glance

```
+---------------------------------------------------------------+
|                      ACID GUARANTEES                          |
+---------------+-----------------------------------------------+
| Atomicity     | All or nothing -- partial work is never saved |
| Consistency   | DB moves from one valid state to another      |
| Isolation     | Concurrent txns don't interfere with each     |
|               | other                                         |
| Durability    | Committed data survives crashes               |
+---------------+-----------------------------------------------+
```

---

## 1. Atomicity

### Definition

A transaction is an indivisible unit of work. Either every operation inside the
transaction succeeds and is applied, or none of them are. There is no in-between.

### The Classic Example: Bank Transfer

Alice wants to send $500 to Bob.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE user_id = 'alice';   -- debit
  UPDATE accounts SET balance = balance + 500 WHERE user_id = 'bob';     -- credit
COMMIT;
```

**What can go wrong without atomicity?**

```
Timeline WITHOUT atomicity:

  T1: UPDATE alice  balance 1000 -> 500   (succeeds)
  --- SERVER CRASHES ---
  T2: UPDATE bob    balance 200  -> ???   (never runs)

  Result: Alice lost $500, Bob gained nothing. $500 vanished.
```

With atomicity the database guarantees: if the crash happens after the debit but before
the credit, the entire transaction is rolled back. Alice keeps her $1000.

### How It Works Under the Hood

The database keeps an **undo log** (also called a rollback segment). Before modifying
any row, it writes the old value to the undo log. If the transaction aborts or the
system crashes before COMMIT, the database replays the undo log to reverse every change.

```
  Undo Log                         Actual Table
  +---------------------------+    +---------------------------+
  | alice.balance WAS 1000    |    | alice.balance = 500       |
  | bob.balance   WAS 200     |    | bob.balance   = 200       |
  +---------------------------+    +---------------------------+

  On ROLLBACK --> replay undo log --> alice.balance restored to 1000
```

---

## 2. Consistency

### Definition

A transaction brings the database from one **valid** state to another valid state.
"Valid" means all declared constraints, triggers, and rules hold true after the
transaction commits.

### Types of Constraints

| Constraint       | Example                                           |
|------------------|---------------------------------------------------|
| NOT NULL         | `email VARCHAR(255) NOT NULL`                     |
| UNIQUE           | `UNIQUE (email)`                                  |
| PRIMARY KEY      | `PRIMARY KEY (order_id)`                          |
| FOREIGN KEY      | `REFERENCES users(id) ON DELETE CASCADE`          |
| CHECK            | `CHECK (balance >= 0)`                            |
| EXCLUSION        | No overlapping time ranges (PostgreSQL)           |

### Example: Balance Cannot Go Negative

```sql
ALTER TABLE accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);

BEGIN;
  UPDATE accounts SET balance = balance - 9999 WHERE user_id = 'alice';
  -- Alice only has $1000, so balance would become -8999
  -- CHECK constraint violated --> transaction aborted automatically
COMMIT;  -- never reached
```

### Application-Level Consistency

The database enforces structural consistency. **Business consistency** (e.g., "an order
must have at least one line item") is often enforced in application code. In interviews,
be explicit about which layer owns which invariant.

---

## 3. Isolation

### Definition

Concurrently executing transactions should not interfere with each other. Each
transaction should behave **as if** it were running alone on the database.

### The Problem Without Isolation

```
  Txn A (transfer $500 Alice->Bob)       Txn B (read balances for report)
  ──────────────────────────────────      ──────────────────────────────
  UPDATE alice SET balance = 500
                                          SELECT balance FROM alice  --> 500
                                          SELECT balance FROM bob    --> 200
                                          Report total: $700 (should be $1200!)
  UPDATE bob SET balance = 700
  COMMIT
```

Txn B saw a **dirty read** -- it read Alice's debited balance before Bob's credit was
applied. The report shows $500 missing.

### Isolation Levels (Preview)

SQL defines four isolation levels that trade off correctness for performance:

| Level              | Safety   | Performance |
|--------------------|----------|-------------|
| READ UNCOMMITTED   | Lowest   | Highest     |
| READ COMMITTED     | Moderate | Good        |
| REPEATABLE READ    | High     | Moderate    |
| SERIALIZABLE       | Highest  | Lowest      |

> Deep dive: see `isolation-levels-and-mvcc.md`

---

## 4. Durability

### Definition

Once a transaction is committed, its effects are permanent -- even if the server
crashes one millisecond later, even if power fails, even if the disk catches fire
(assuming your storage survived).

### How: Write-Ahead Log (WAL)

Durability is implemented via the **Write-Ahead Log** (WAL), also called the
**redo log** in MySQL/InnoDB. The rule is simple:

> **Before any data page is modified on disk, the log record describing that change
> must first be flushed to stable storage.**

This is the **WAL protocol**. It is the single most important concept in database
storage engines.

---

## Write-Ahead Log (WAL) Deep Dive

### Why WAL Exists

Writing directly to data files is dangerous:

1. **Random I/O**: Data pages are scattered across disk. Updating them requires random
   seeks, which are slow.
2. **Partial writes**: A crash during a page write could leave the page half-written
   and corrupted.

WAL solves both problems:

1. **Sequential I/O**: Log records are appended sequentially, which is 100-1000x
   faster than random writes on spinning disks and still significantly faster on SSDs.
2. **Crash recovery**: On restart, the database replays the WAL from the last
   checkpoint to reconstruct any changes that were committed but not yet flushed to
   data files.

### How WAL Works

```
  Client                  WAL (on disk)              Data Files (on disk)
  ──────                  ────────────               ──────────────────
  BEGIN
  UPDATE alice ...
      |
      +---> Write log record ───> [LSN 101: alice.balance 1000->500]
      |                                        |
  UPDATE bob ...                               |
      |                                        |
      +---> Write log record ───> [LSN 102: bob.balance 200->700]
      |                                        |
  COMMIT                                       |
      |                                        |
      +---> Write COMMIT record -> [LSN 103: COMMIT txn_42]
      |          |                             |
      |          v                             |
      |     fsync() -- WAL flushed to disk     |
      |                                        |
      +---> ACK to client: "committed"         |
                                               |
                              (later, asynchronously)
                                               |
                              Checkpoint flushes dirty pages
                              to data files ("bgwriter" in PG)
```

### Key WAL Concepts

| Concept             | Description                                              |
|---------------------|----------------------------------------------------------|
| **LSN**             | Log Sequence Number -- monotonically increasing ID       |
| **Checkpoint**      | Point at which all dirty pages up to some LSN are        |
|                     | flushed to data files                                    |
| **WAL segment**     | Fixed-size file (16 MB in PostgreSQL by default)         |
| **WAL archiving**   | Copying completed WAL segments for point-in-time recovery|
| **fsync**           | OS call to flush kernel buffer to physical storage       |

### Crash Recovery

```
  1. Database starts after crash
  2. Reads last checkpoint record from WAL
  3. Replays all WAL records after that checkpoint ("redo")
  4. Rolls back any transactions that were active but not committed ("undo")
  5. Database is now consistent. Open for business.
```

This is called **ARIES** (Algorithm for Recovery and Isolation Exploiting Semantics)
in academic literature. PostgreSQL and InnoDB both implement variants of it.

---

## Transaction Lifecycle

### Basic Flow

```
  +-------+     +------------------+     +---------+
  | BEGIN | --> | SQL operations   | --> | COMMIT  |  -- success path
  +-------+     +------------------+     +---------+
                       |
                       | (error or explicit)
                       v
                  +-----------+
                  | ROLLBACK  |  -- failure path
                  +-----------+
```

### Explicit Transaction Example

```sql
BEGIN;

  INSERT INTO orders (user_id, total) VALUES (42, 99.99);
  -- Suppose this returns order_id = 1001

  INSERT INTO order_items (order_id, product_id, qty, price)
    VALUES (1001, 'SKU-A', 2, 29.99);

  INSERT INTO order_items (order_id, product_id, qty, price)
    VALUES (1001, 'SKU-B', 1, 40.01);

  UPDATE inventory SET stock = stock - 2 WHERE product_id = 'SKU-A';
  UPDATE inventory SET stock = stock - 1 WHERE product_id = 'SKU-B';

COMMIT;
```

If any statement fails (e.g., insufficient stock triggers a CHECK constraint), the
application issues ROLLBACK and nothing is persisted.

### Implicit Transactions (Autocommit)

In most databases, if you do not issue BEGIN, each statement is its own transaction:

```sql
-- These are TWO separate transactions in autocommit mode:
UPDATE accounts SET balance = balance - 500 WHERE user_id = 'alice';
UPDATE accounts SET balance = balance + 500 WHERE user_id = 'bob';
-- If the server crashes between these two statements, money is lost.
```

**Always use explicit transactions for multi-statement operations.**

---

## Savepoints

Savepoints allow **partial rollback** within a transaction. You can roll back to a
savepoint without aborting the entire transaction.

### When Savepoints Are Useful

- Batch processing: roll back a single failed item, continue with the rest
- Complex business logic with optional steps
- Error handling in stored procedures

### Example

```sql
BEGIN;

  INSERT INTO orders (user_id, total) VALUES (42, 199.99);

  SAVEPOINT before_loyalty;

  -- Try to apply a loyalty discount (might fail)
  UPDATE loyalty_points SET points = points - 500 WHERE user_id = 42;
  -- Oops, user doesn't have enough points

  ROLLBACK TO SAVEPOINT before_loyalty;
  -- The INSERT into orders is still intact!

  -- Proceed without the discount
  INSERT INTO order_items (order_id, product_id, qty, price)
    VALUES (currval('orders_id_seq'), 'SKU-X', 1, 199.99);

COMMIT;  -- order is created, loyalty deduction is rolled back
```

### Savepoint Diagram

```
  BEGIN
    |
    |--- INSERT order --------+
    |                         |
    |--- SAVEPOINT sp1        |   <-- mark
    |                         |
    |--- UPDATE loyalty  (fail)
    |                         |
    |--- ROLLBACK TO sp1      |   <-- undo only since sp1
    |                         |
    |--- INSERT order_items --+
    |
  COMMIT  (order + items saved, loyalty update gone)
```

---

## Distributed Transactions (Preview)

When data spans multiple databases or services, local ACID is not enough.

### Two-Phase Commit (2PC)

```
  Coordinator                  Participant A          Participant B
  ───────────                  ─────────────          ─────────────
  1. PREPARE  ───────────────> prepare               prepare
                               write to WAL           write to WAL
              <─────────────── VOTE YES               VOTE YES
  2. COMMIT   ───────────────> commit                commit
              <─────────────── ACK                    ACK
```

**Problems with 2PC:**
- Blocking: if coordinator crashes after PREPARE, participants hold locks indefinitely
- Latency: two round-trips minimum
- Single point of failure: the coordinator

### Saga Pattern

Instead of a global transaction, break work into a sequence of local transactions,
each with a **compensating action** if a later step fails.

```
  Step 1: Create Order          Compensate: Cancel Order
  Step 2: Reserve Inventory     Compensate: Release Inventory
  Step 3: Charge Payment        Compensate: Refund Payment
  Step 4: Ship Order            Compensate: Recall Shipment

  If Step 3 fails:
    Run Compensate 2 (release inventory)
    Run Compensate 1 (cancel order)
```

**Saga trade-offs:**
- No global ACID (only eventual consistency)
- Compensation logic can be complex
- Requires idempotent operations

> Deep dive: see the distributed transactions document in the advanced section.

---

## Interview Quick Reference

| Question | Key Points |
|----------|------------|
| "What is ACID?" | Atomicity, Consistency, Isolation, Durability -- explain each with one sentence + example |
| "How does durability work?" | WAL: log-before-data, sequential writes, crash recovery via replay |
| "Bank transfer scenario" | Must use a transaction; atomicity ensures both updates or neither |
| "What if the server crashes mid-transaction?" | Uncommitted: rolled back via undo log. Committed: recovered via WAL redo |
| "How do you handle distributed transactions?" | 2PC for strong consistency (blocking). Saga for eventual consistency (compensating) |
| "Savepoints vs nested transactions?" | SQL savepoints are not true nested transactions -- they share the outer txn's fate on COMMIT/ROLLBACK of the outer txn |

---

## Key Takeaways

1. **Atomicity** = undo log. All or nothing.
2. **Consistency** = constraints enforced by the database + invariants enforced by the app.
3. **Isolation** = concurrent transactions behave as if serial (degree depends on level).
4. **Durability** = WAL. Log hits disk before COMMIT returns to client.
5. **WAL** is the backbone of every serious RDBMS. Understand it cold.
6. **Savepoints** give you partial rollback without abandoning the whole transaction.
7. **Distributed transactions** (2PC, Saga) are needed when data lives across services.
