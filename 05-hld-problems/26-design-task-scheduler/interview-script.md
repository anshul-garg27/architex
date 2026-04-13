# Design a Distributed Task Scheduler -- 45-Minute Interview Script

## How to Use This Script

This is a minute-by-minute simulation of a real system design interview for
"Design a Task Scheduler." Read both the **Interviewer** and **Candidate** lines
aloud to internalize the pacing, the transitions, and the depth expected at each
stage. The Candidate responses represent a strong Senior / Staff-level answer.

---

## Opening (0:00 -- 1:00)

**Interviewer:** Welcome. Today's problem: design a distributed task scheduler.
Think of something like a cloud-scale cron -- users submit tasks with schedules
(run every hour, run once at 3 AM, etc.), and the system guarantees those tasks
execute reliably, on time, even across failures. Take a moment to think, and then
let's go.

**Candidate:** Got it. I'll start with clarifying questions to scope the problem,
then move through requirements, estimation, high-level architecture, APIs, data
model, and deep-dive into two areas: exactly-once execution guarantees and
partition-based scheduling for scale. Ready when you are.

**Interviewer:** Go ahead.

---

## Clarifying Questions (1:00 -- 4:00)

**Candidate:** Let me understand the task types first. Are we scheduling arbitrary
code execution (like AWS Lambda), or are these tasks more like "call this HTTP
webhook at the scheduled time"?

**Interviewer:** Webhook-style. The scheduler fires an HTTP callback or enqueues
a message. It doesn't run user code directly.

**Candidate:** Good. What kinds of schedules are in scope? One-time delayed
execution, recurring cron expressions, or both?

**Interviewer:** Both. Users can say "run this once at 2026-04-07T15:00:00Z" or
"run this every day at 3 AM UTC" using cron syntax.

**Candidate:** What about task priorities? Can a high-priority task preempt a
low-priority one?

**Interviewer:** Yes, support at least two priority levels -- normal and high.

**Candidate:** Should the system support task dependencies -- "run task B only
after task A succeeds"?

**Interviewer:** Mention it, but don't design a full DAG executor. Keep focus on
the scheduling and execution guarantees.

**Candidate:** Understood. What's the scale? How many tasks are we managing?

**Interviewer:** Tens of millions of scheduled tasks, hundreds of thousands firing
per minute at peak.

**Candidate:** And the execution guarantee -- at-least-once or exactly-once?

**Interviewer:** Exactly-once is the goal. That's one of the hardest parts.

**Candidate:** Last question -- what happens when a task execution fails? Do we
retry? Is there a dead-letter queue?

**Interviewer:** Yes, retry with exponential backoff, configurable max retries,
and a dead-letter mechanism after exhausting retries.

**Candidate:** Great. Let me summarize.

---

## Requirements (4:00 -- 7:00)

### Functional Requirements

**Candidate:** Here's what I'll design:

1. **Create task** -- submit a task with a schedule (one-time or cron), a callback
   URL, a payload, priority, and retry policy
2. **Cancel / update task** -- modify a task's schedule or cancel it before next
   execution
3. **Execute task** -- at the scheduled time, invoke the callback URL with the
   payload
4. **Exactly-once execution** -- a task must fire exactly once per scheduled
   occurrence, even during failures and rebalances
5. **Retry with backoff** -- failed executions are retried with exponential backoff,
   up to a configurable maximum
6. **Dead-letter queue** -- tasks that exhaust retries go to a DLQ for manual
   inspection
7. **Task status and history** -- users can query task status (pending, running,
   succeeded, failed) and execution history

**Interviewer:** Good list. What about multi-tenancy?

**Candidate:** Yes -- each task belongs to a tenant with quotas and rate limits.
I'll factor that into the API.

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Scheduling accuracy | Fire within 1 second of scheduled time |
| Throughput | 100K+ task executions per minute at peak |
| Task capacity | 50M+ scheduled tasks in the system |
| Availability | 99.99% -- missed tasks are unacceptable |
| Consistency | Exactly-once execution per scheduled occurrence |
| Latency (API) | < 200 ms for task creation and queries |

---

## Estimation (7:00 -- 10:00)

**Candidate:** Let me size the system.

**Tasks in the system:**
- 50 million scheduled tasks
- Mix: 60% recurring (cron), 40% one-time
- Average task record: ~500 bytes (schedule, callback URL, payload, metadata)
- Storage: 50M * 500 bytes = ~25 GB -- easily fits in a single database, but we'll
  shard for throughput

**Execution throughput:**
- Peak: 100K task executions per minute = ~1,700 per second
- Each execution is an HTTP call that takes 100 ms - 5 seconds
- At 1,700/sec with average 1 sec duration, we need ~1,700 concurrent workers
- With 50 workers per machine, that's ~34 worker machines

**Scheduling throughput:**
- Every second, the scheduler must identify which tasks fire in the next second
- With cron tasks, we precompute the next fire time and index on it
- Query: "SELECT tasks WHERE next_fire_time BETWEEN now AND now+1s"
- With a B-tree index on next_fire_time, this is efficient even at 50M rows

**Candidate:** The key bottleneck is the scheduler loop -- reading the next batch
of tasks and dispatching them without duplicates. That's what I'll focus on in
the deep dive.

**Interviewer:** Good. Show me the architecture.

---

## High-Level Design (10:00 -- 18:00)

**Candidate:** Here's the system layout:

```
                    ┌──────────────────────┐
                    │   API Gateway         │
                    │   Auth, rate limit     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼───────┐ ┌──────▼───────┐
    │  Task CRUD     │ │  Task Query  │ │  Admin /     │
    │  Service       │ │  Service     │ │  Dashboard   │
    │  (create,      │ │  (status,    │ │  (DLQ mgmt,  │
    │   update,      │ │   history,   │ │   metrics)   │
    │   cancel)      │ │   search)    │ │              │
    └───────┬────────┘ └──────┬───────┘ └──────────────┘
            │                 │
            │     ┌───────────┘
            ▼     ▼
    ┌──────────────────────────────────────────┐
    │            Task Store (PostgreSQL)         │
    │  - task definitions, schedules             │
    │  - sharded by task_id                      │
    │  - indexed on next_fire_time               │
    └──────────────────┬───────────────────────┘
                       │
         ┌─────────────┼─────────────────┐
         │             │                 │
  ┌──────▼──────┐ ┌────▼──────┐  ┌───────▼──────┐
  │ Scheduler   │ │ Scheduler │  │ Scheduler    │
  │ Partition 0 │ │ Partition 1│  │ Partition N  │
  │ (leader)    │ │ (leader)  │  │ (leader)     │
  └──────┬──────┘ └─────┬─────┘  └──────┬───────┘
         │              │               │
         ▼              ▼               ▼
    ┌───────────────────────────────────────┐
    │         Execution Queue (Kafka)        │
    │  - topic: task-executions              │
    │  - partitioned by task_id              │
    │  - high/normal priority topics         │
    └──────────────────┬────────────────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
   ┌─────▼─────┐ ┌────▼─────┐ ┌─────▼─────┐
   │  Worker   │ │  Worker  │ │  Worker   │
   │  Pool 1   │ │  Pool 2  │ │  Pool N   │
   │  (HTTP    │ │          │ │           │
   │  executor)│ │          │ │           │
   └─────┬─────┘ └────┬─────┘ └─────┬─────┘
         │             │              │
         ▼             ▼              ▼
    ┌───────────────────────────────────────┐
    │    Execution Log (Cassandra)           │
    │  - execution history, status, timing   │
    │  - TTL'd for retention                 │
    └───────────────────────────────────────┘
```

**Candidate:** Let me walk through the components:

**1. Task CRUD Service.** Handles task creation, updates, and cancellation. Writes
task definitions to PostgreSQL. On creation, computes the `next_fire_time` from the
cron expression and stores it. This is the indexed column the Scheduler queries.

**2. Task Store (PostgreSQL, sharded).** Stores all 50M task definitions. Sharded by
`task_id` across multiple Postgres instances for write throughput. Each shard has a
B-tree index on `next_fire_time`. Why Postgres? ACID guarantees are critical for the
claim-and-execute pattern I'll describe in the deep dive.

**3. Scheduler (partitioned).** This is the brain. The task space is divided into
partitions (e.g., 256 partitions by hash(task_id) mod 256). Each partition is owned
by exactly one Scheduler instance at a time. The Scheduler polls its partition of the
Task Store every second: "give me all tasks in my partition where next_fire_time <=
now." For each task found, it enqueues an execution message to Kafka and atomically
updates the task's next_fire_time to the next cron occurrence.

**4. Execution Queue (Kafka).** Decouples scheduling from execution. Two topics --
`task-executions-high` and `task-executions-normal` -- for priority. Workers consume
from the high-priority topic first.

**5. Worker Pool.** Stateless HTTP executors. They consume from Kafka, call the
callback URL with the payload, and report the result. On failure, they re-enqueue
with incremented retry count and a backoff delay.

**6. Execution Log (Cassandra).** Append-only log of every execution attempt.
Queryable by task_id and time range. TTL'd at 90 days.

**Interviewer:** How do Scheduler instances claim their partitions? What if two
Schedulers think they own the same partition?

**Candidate:** We use a coordination service -- ZooKeeper or etcd -- for partition
assignment. Each Scheduler registers as a participant in a partition group. ZooKeeper
assigns partitions to Schedulers using a rebalance protocol (similar to Kafka consumer
groups). At any point, each partition has exactly one owner. If a Scheduler dies,
ZooKeeper detects it via session timeout, triggers a rebalance, and reassigns that
Scheduler's partitions to surviving instances.

But coordination alone isn't enough to prevent duplicates during rebalancing. That's
the deep dive.

---

## API Design (18:00 -- 21:00)

**Candidate:** Here are the core APIs.

### Create Task

```
POST /v1/tasks
{
    "tenant_id": "tenant_acme",
    "task_name": "daily-report-gen",
    "schedule": {
        "type": "cron",
        "expression": "0 3 * * *",       // every day at 3 AM UTC
        "timezone": "UTC"
    },
    "callback": {
        "url": "https://acme.com/webhooks/report",
        "method": "POST",
        "headers": { "Authorization": "Bearer <token>" },
        "payload": { "report_type": "daily_summary" }
    },
    "priority": "high",
    "retry_policy": {
        "max_retries": 3,
        "backoff_base_seconds": 30,
        "backoff_multiplier": 2
    },
    "idempotency_key": "idk_abc123"
}

Response 201:
{
    "task_id": "task_7f3a9b",
    "status": "active",
    "next_fire_time": "2026-04-08T03:00:00Z",
    "created_at": "2026-04-07T12:00:00Z"
}
```

### Cancel Task

```
DELETE /v1/tasks/{task_id}

Response 200:
{ "task_id": "task_7f3a9b", "status": "cancelled" }
```

### Get Task Status and History

```
GET /v1/tasks/{task_id}/executions?limit=10

Response:
{
    "task_id": "task_7f3a9b",
    "status": "active",
    "next_fire_time": "2026-04-08T03:00:00Z",
    "executions": [
        {
            "execution_id": "exec_001",
            "scheduled_time": "2026-04-07T03:00:00Z",
            "started_at": "2026-04-07T03:00:00.123Z",
            "completed_at": "2026-04-07T03:00:01.456Z",
            "status": "succeeded",
            "http_status": 200,
            "attempt": 1
        }
    ]
}
```

**Interviewer:** Why the `idempotency_key` on task creation?

**Candidate:** If the client's request times out and it retries, we don't want to
create a duplicate task. The idempotency key is stored in a unique index. On retry,
we detect the duplicate and return the existing task instead of creating a new one.
This is the same pattern used in payment systems to prevent double-charging.

---

## Data Model (21:00 -- 24:00)

**Candidate:** Two primary stores: PostgreSQL for task state and Cassandra for
execution history.

### Task Definition (PostgreSQL)

```sql
CREATE TABLE tasks (
    task_id         UUID PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL,
    task_name       VARCHAR(256),
    partition_key   INT NOT NULL,            -- hash(task_id) % 256
    schedule_type   VARCHAR(16) NOT NULL,    -- 'cron' or 'one_time'
    cron_expression VARCHAR(64),
    scheduled_time  TIMESTAMPTZ,             -- for one-time tasks
    next_fire_time  TIMESTAMPTZ NOT NULL,    -- THE key index
    callback_url    TEXT NOT NULL,
    callback_method VARCHAR(8) DEFAULT 'POST',
    callback_headers JSONB,
    payload         JSONB,
    priority        VARCHAR(8) DEFAULT 'normal',
    status          VARCHAR(16) DEFAULT 'active',  -- active, paused, cancelled, completed
    retry_max       INT DEFAULT 3,
    retry_backoff   INT DEFAULT 30,
    idempotency_key VARCHAR(128) UNIQUE,
    version         INT DEFAULT 1,           -- optimistic locking
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_fire ON tasks (partition_key, next_fire_time)
    WHERE status = 'active';
```

**Candidate:** The critical index is `(partition_key, next_fire_time) WHERE status =
'active'`. This lets each Scheduler efficiently query only its partitions:

```sql
SELECT * FROM tasks
WHERE partition_key IN (0, 1, 2, ..., 15)   -- this scheduler's partitions
  AND status = 'active'
  AND next_fire_time <= NOW()
ORDER BY priority DESC, next_fire_time ASC
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

The `FOR UPDATE SKIP LOCKED` is crucial -- it claims rows without blocking other
transactions. Combined with the version column for optimistic locking, this prevents
two schedulers from dispatching the same task.

### Execution Log (Cassandra)

```cql
CREATE TABLE executions (
    task_id         UUID,
    execution_id    UUID,
    scheduled_time  TIMESTAMP,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    status          TEXT,       -- pending, running, succeeded, failed, dead_lettered
    http_status     INT,
    attempt         INT,
    error_message   TEXT,
    PRIMARY KEY (task_id, execution_id)
) WITH default_time_to_live = 7776000;   -- 90 days
```

**Interviewer:** Why PostgreSQL for tasks and Cassandra for executions? Why not use
one database for both?

**Candidate:** Different access patterns. Task definitions need strong consistency
and transactional updates (`FOR UPDATE SKIP LOCKED`). Cassandra can't do that.
Execution logs are append-only, write-heavy, and queried by task_id -- perfect for
Cassandra's partition-key model. Also, executions grow unboundedly (every task fires
many times), while task definitions are a fixed 50M rows. Cassandra's TTL handles
automatic retention without manual cleanup.

---

## Deep Dive 1: Exactly-Once Execution (24:00 -- 33:00)

**Interviewer:** This is the hard part. How do you guarantee a task runs exactly
once? Walk me through what happens when the scheduler crashes mid-dispatch.

**Candidate:** Exactly-once is the holy grail of distributed scheduling. It's
actually composed of two guarantees:
1. **At-most-once on the scheduling side** -- we never dispatch the same occurrence
   twice.
2. **At-least-once on the execution side** -- if we dispatch it, it eventually
   executes.
Combined, we get exactly-once.

Let me walk through the mechanism step by step.

**Step 1: Atomic claim-and-advance.**
When the Scheduler polls for due tasks, it does this in a single database transaction:

```sql
BEGIN;
  -- Claim a batch of tasks
  SELECT task_id, callback_url, payload, cron_expression, next_fire_time
  FROM tasks
  WHERE partition_key IN (:my_partitions)
    AND status = 'active'
    AND next_fire_time <= :now
  ORDER BY priority DESC, next_fire_time ASC
  LIMIT 100
  FOR UPDATE SKIP LOCKED;

  -- For each claimed task, compute and set the NEXT fire time
  UPDATE tasks
  SET next_fire_time = :computed_next_fire_time,
      version = version + 1,
      updated_at = NOW()
  WHERE task_id = :task_id
    AND version = :current_version;
COMMIT;
```

The moment this transaction commits, the task's `next_fire_time` has been advanced.
If the Scheduler crashes after committing but before enqueueing to Kafka, we need
a recovery mechanism. That's the next step.

**Step 2: Transactional outbox.**
Instead of directly writing to Kafka, the Scheduler writes to an `outbox` table in
the same transaction:

```sql
-- Inside the same transaction as above
INSERT INTO outbox (event_id, task_id, scheduled_time, payload, status)
VALUES (:uuid, :task_id, :fire_time, :payload, 'pending');
```

A separate **outbox relay** process reads pending outbox entries and publishes them
to Kafka. After Kafka confirms, the relay marks the outbox entry as `published`.

**Why this matters:** If the Scheduler crashes between committing the transaction and
publishing to Kafka, the outbox entry survives in PostgreSQL. The relay picks it up
and publishes. No task execution is lost.

**Step 3: Deduplication at the worker.**
What if the outbox relay publishes to Kafka, crashes before marking it as
`published`, and then republishes on recovery? Now Kafka has a duplicate message.
The worker deduplicates using the `execution_id` (event_id from the outbox). Before
executing the callback, the worker checks Cassandra:

```
IF execution_id already exists with status != 'pending' THEN skip
```

This is the idempotency barrier on the execution side.

**Interviewer:** What if the scheduler crashes, and another scheduler takes over the
partition during rebalancing? Could there be a window where both are running?

**Candidate:** Yes, this is the **dual-writer problem** during rebalancing. Here's
how we handle it:

**Fencing tokens.** When ZooKeeper assigns a partition to a Scheduler, it issues a
monotonically increasing **epoch number** (fencing token). The Scheduler includes
this epoch in every database transaction:

```sql
UPDATE tasks
SET next_fire_time = :next, version = version + 1
WHERE task_id = :id
  AND partition_owner_epoch <= :my_epoch;
```

If the old Scheduler (with a stale epoch) tries to update after the new Scheduler has
claimed the partition with a higher epoch, the update affects zero rows and is
effectively rejected. The old Scheduler detects this and stops.

**Additionally**, we set a generous rebalance delay. When a Scheduler loses a
partition, it immediately stops polling that partition. The new owner waits 10 seconds
before starting to poll, ensuring the old owner's in-flight transactions have
committed or timed out.

**Interviewer:** What about the execution side? The worker calls the webhook, but the
remote service times out. Did it execute or not?

**Candidate:** This is the classic "maybe" state. Our worker cannot know if the
remote service processed the request. So:

1. The worker marks the execution as `failed` with reason `timeout`.
2. It re-enqueues for retry with exponential backoff.
3. The remote service MUST be idempotent. We include an `Idempotency-Key` header
   (the `execution_id`) in the callback. If the service already processed it, it
   returns 200 and the worker marks success.

This is why we document in our API contract: "Your webhook endpoint MUST be
idempotent. The scheduler may call it more than once for the same occurrence."

We provide exactly-once from the scheduler's perspective (we dispatch exactly once),
but the actual execution is at-least-once with idempotency keys enabling the
downstream to deduplicate.

**Interviewer:** That's honest. You mentioned `FOR UPDATE SKIP LOCKED`. What if the
database is the bottleneck?

**Candidate:** At 50M tasks with 100K/min firing, we're querying a small fraction of
rows each second. The partial index on `(partition_key, next_fire_time) WHERE status =
'active'` is very selective. But if we need more, two options:

1. **Shard PostgreSQL.** Split tasks across multiple Postgres instances by
   partition_key ranges. Each Scheduler talks to only its shard.
2. **Time-bucketed scheduling.** Instead of polling for all due tasks, group tasks
   into 1-second time buckets. The Scheduler reads one bucket at a time. This turns
   a range scan into a point lookup.

---

## Deep Dive 2: Partition-Based Scheduling and Fault Tolerance (33:00 -- 40:00)

**Interviewer:** Let's talk about what happens when the scheduler crashes. Walk me
through the failure scenario end to end.

**Candidate:** Let me trace through a complete crash-and-recovery scenario.

**Setup:** We have 3 Scheduler instances (S1, S2, S3) managing 256 partitions.
Assignment: S1 owns partitions 0-85, S2 owns 86-170, S3 owns 171-255.

**T=0: S2 crashes.**
S2 was in the middle of processing a batch from partition 100. It had committed the
transaction (advanced next_fire_time, written outbox) for 40 tasks, but the outbox
relay hasn't published 15 of them to Kafka yet.

**T=5s: ZooKeeper detects S2's session has expired.**
ZooKeeper triggers a rebalance. New assignment: S1 gets 0-127, S3 gets 128-255.
Partitions 86-127 moved from S2 to S1, partitions 128-170 moved to S3.

**T=5s-15s: Grace period.**
S1 and S3 wait 10 seconds before polling their newly acquired partitions. This gives
S2's in-flight database transactions time to either commit or roll back (Postgres
statement timeout is 5 seconds).

**T=15s: S1 starts polling partitions 86-127.**
For the 40 tasks that S2 had already advanced -- their next_fire_time is in the
future, so S1 doesn't pick them up. Good, no duplicate.

For the 15 tasks whose outbox entries are unpublished -- the outbox relay (which
is a separate, replicated process) picks them up and publishes to Kafka. The tasks
execute. No task is lost.

For any tasks that S2 was mid-transaction on when it crashed -- the Postgres
transaction rolled back. next_fire_time was NOT advanced. S1 picks them up on its
next poll. They execute slightly late (worst case: 15 seconds) but they execute.

**Interviewer:** What if ZooKeeper itself is unavailable? The whole system stalls?

**Candidate:** ZooKeeper runs as a 3 or 5 node ensemble with majority quorum. If one
ZK node fails, the ensemble continues. If ZK is entirely down, existing partition
assignments remain stable -- Schedulers keep running with their current assignment.
No new rebalancing can occur, but existing scheduling continues.

If ZK is down AND a Scheduler crashes, that Scheduler's partitions become orphaned
until ZK recovers. To bound the impact:

1. We set an alert if any partition hasn't been polled in 30 seconds.
2. We run a **watchdog service** that monitors task due times. If tasks are overdue
   by more than 60 seconds, the watchdog bypasses the partition system and dispatches
   them directly (with deduplication via the outbox).

**Interviewer:** How do you handle time zones and DST changes in cron expressions?

**Candidate:** This is a surprisingly tricky edge case. When a user says "run at
3 AM America/New_York every day," and DST spring-forward skips 2 AM to 3 AM, what
happens?

Our approach:
1. We store the cron expression WITH the timezone.
2. The `next_fire_time` is always stored in UTC.
3. When computing the next fire time, we use a timezone-aware cron library (like
   `croniter` in Python or `cron-utils` in Java) that handles DST transitions.
4. On spring-forward: if the scheduled time doesn't exist (e.g., 2:30 AM is skipped),
   we fire at the next valid time (3:00 AM).
5. On fall-back: if the scheduled time occurs twice (e.g., 1:30 AM happens twice),
   we fire on the first occurrence only.

We document these behaviors in our API docs so users aren't surprised.

**Interviewer:** What about clock skew across scheduler instances?

**Candidate:** Clock skew is dangerous for scheduling. A scheduler with a fast clock
might fire tasks early; a slow clock fires late.

Mitigations:
1. All servers run NTP with tight drift bounds (< 100 ms).
2. The `next_fire_time` comparison uses `<= NOW()` with a 1-second buffer. Tasks fire
   within a 1-second window, which is our accuracy SLA anyway.
3. The claim-and-advance transaction is the source of truth, not the local clock. Two
   schedulers can't claim the same task because of `FOR UPDATE SKIP LOCKED` and
   fencing tokens.
4. We monitor clock skew between scheduler instances and alert if drift exceeds 500ms.

---

## Trade-offs Discussion (40:00 -- 42:00)

**Candidate:** Let me summarize the key design trade-offs:

| Decision | Trade-off |
|----------|-----------|
| **PostgreSQL over Redis for task store** | Slower reads but ACID transactions for claim-and-advance. Redis lacks `FOR UPDATE SKIP LOCKED`. |
| **Transactional outbox over direct Kafka write** | Adds complexity (relay process) but eliminates the dual-write problem where DB commits but Kafka publish fails. |
| **Partition-based scheduling over single-leader** | More complex rebalancing logic, but horizontally scalable. A single leader becomes a bottleneck at 50M tasks. |
| **Kafka as execution queue over direct HTTP** | Adds latency (~50 ms) but decouples scheduling from execution, provides retry semantics, and survives worker crashes. |
| **ZooKeeper for coordination over Raft in-app** | Operational dependency on ZK cluster, but proven, battle-tested, and separates coordination from business logic. |
| **At-least-once + idempotency keys over true exactly-once** | Requires downstream idempotency, but is practically achievable. True exactly-once across distributed systems is impossible without 2PC. |

**Interviewer:** If you had to pick the most dangerous failure mode, what is it?

**Candidate:** Split-brain during partition rebalancing -- two schedulers both
believing they own the same partition and dispatching duplicates. The fencing token
mechanism prevents this at the database level, but if someone removes the epoch check
from the SQL query during a code change, we silently lose the guarantee. That's why
we also have a monitoring system that counts dispatches per task per occurrence. If
any task fires twice in the same occurrence window, we page on-call immediately.

---

## Future Improvements (42:00 -- 43:30)

**Candidate:** Given more time, I'd build:

1. **Task DAG support.** Allow users to define workflows: "run A, then B and C in
   parallel, then D after both finish." This requires a DAG executor on top of the
   scheduler, similar to Airflow.

2. **Rate-limited execution.** Some tenants call the same downstream service. Allow
   configuring "max 10 concurrent executions for this tenant" to avoid overwhelming
   the target.

3. **Delayed message queue pattern.** For one-time delays under 15 minutes, skip the
   database entirely and use Kafka's delayed message support or a Redis sorted set
   with a poller. Faster and lighter for short delays.

4. **Geo-distributed scheduling.** Run scheduler clusters in multiple regions. Tasks
   are homed to a region but can failover to another if the home region is down.

5. **Observability dashboard.** Real-time view of tasks by status, firing rate, error
   rate, p99 execution latency, and overdue tasks per partition.

---

## Red Flags to Avoid

| Red Flag | Why It's Bad |
|----------|-------------|
| Using `sleep()` in a loop to implement scheduling | Doesn't scale, drifts over time, can't distribute across machines |
| No mention of exactly-once or duplicate prevention | The core challenge of distributed scheduling is coordination, not cron parsing |
| Proposing a single scheduler instance | Single point of failure at scale; this is a distributed systems question |
| Storing tasks only in Redis | No durability; a restart loses all scheduled tasks |
| Ignoring the rebalancing window | Partition handoff is where duplicates and missed tasks happen |
| Calling the webhook inside the database transaction | If the webhook takes 30 seconds, you hold a database lock for 30 seconds and stall the system |

---

## Power Phrases

Use these exact phrases to signal expertise during the interview:

- "We use **FOR UPDATE SKIP LOCKED** to claim tasks without contention -- this is
  the Postgres primitive that makes partition-based scheduling viable."
- "The **transactional outbox pattern** eliminates dual-write risk: the task advance
  and the dispatch message are in the same ACID transaction."
- "Partition ownership is managed by ZooKeeper with **fencing tokens** -- a
  monotonically increasing epoch that prevents stale owners from dispatching."
- "Exactly-once from the scheduler's perspective is achieved by **atomic
  claim-and-advance**. End-to-end exactly-once requires **downstream idempotency**."
- "During rebalancing, we enforce a **grace period** between the old owner stopping
  and the new owner starting, to drain in-flight transactions."
- "One-time tasks set `next_fire_time` to the scheduled time and `status` to
  `completed` after execution. Cron tasks advance `next_fire_time` atomically."
- "Priority is implemented as **separate Kafka topics** -- workers consume from the
  high-priority topic first, ensuring latency-sensitive tasks jump the queue."
- "We handle DST transitions explicitly: spring-forward fires at the next valid time,
  fall-back fires on the first occurrence only."
- "The **watchdog service** is our safety net -- if any partition goes unpolled for 30
  seconds, it alerts. If tasks are overdue by 60 seconds, it dispatches directly."
- "We monitor **dispatches per task per occurrence window** -- if it ever exceeds 1,
  we have a deduplication failure and page immediately."
