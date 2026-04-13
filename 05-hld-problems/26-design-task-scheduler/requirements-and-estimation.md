# Design a Distributed Task Scheduler (Cron at Scale)

## Uber's Top 3 HLD Interview Question

> "Design a system that can schedule and execute millions of tasks reliably,
> with exactly-once execution guarantees, recurring schedules, priorities,
> retries, and task dependencies -- essentially, cron at planetary scale."

This is one of the most frequently asked system design questions at Uber,
Google, Meta, and Amazon. It tests your understanding of distributed systems
fundamentals: consistency, fault tolerance, exactly-once semantics, and
high-throughput data processing.

---

## 1. Clarifying Questions (Ask These First!)

Before diving in, ask the interviewer these questions to scope the problem:

```
Q1: "What types of tasks do we need to support?"
    -> One-time delayed tasks? Recurring cron tasks? Event-triggered?

Q2: "What is the execution guarantee we need?"
    -> At-least-once? At-most-once? Exactly-once?

Q3: "What scale are we targeting?"
    -> Number of tasks? Tasks per second? Execution latency SLA?

Q4: "Do tasks have dependencies on each other?"
    -> Simple independent tasks? Or DAG-based workflows?

Q5: "What happens when a task fails?"
    -> Retry? Dead letter? Alert?

Q6: "Do tasks have priorities?"
    -> Can a high-priority task preempt a running low-priority task?

Q7: "What is the maximum acceptable delay for task execution?"
    -> Sub-second? Seconds? Minutes?

Q8: "Who are the clients? Internal services? External users?"
    -> API design, auth, rate limiting implications

Q9: "Do we need to support task cancellation and modification?"
    -> Can a scheduled task be updated or cancelled before execution?

Q10: "What about timezone handling for recurring tasks?"
     -> DST transitions? User-specified timezones?
```

---

## 2. Functional Requirements

### Core (Must-Have)

| # | Requirement | Description |
|---|-------------|-------------|
| FR1 | **Schedule one-time tasks** | Schedule a task to execute at a specific future time |
| FR2 | **Schedule recurring tasks** | Support cron expressions for periodic execution |
| FR3 | **Exactly-once execution** | Each task must execute exactly once per scheduled time |
| FR4 | **Task priority** | Higher-priority tasks execute before lower-priority ones |
| FR5 | **Retry failed tasks** | Automatic retry with configurable backoff strategy |
| FR6 | **Task dependencies (DAG)** | Define execution order -- task B runs only after task A completes |
| FR7 | **Task cancellation** | Cancel or pause a scheduled task before execution |
| FR8 | **Task status tracking** | Query current status: PENDING, QUEUED, RUNNING, COMPLETED, FAILED |

### Extended (Nice-to-Have)

| # | Requirement | Description |
|---|-------------|-------------|
| FR9 | **Event-triggered tasks** | Execute a task in response to an external event |
| FR10 | **Rate limiting** | Limit concurrent executions per tenant or task type |
| FR11 | **Task timeout** | Kill tasks that exceed their configured timeout |
| FR12 | **Webhook callbacks** | Notify clients when task completes or fails |
| FR13 | **Cron expression validation** | Validate cron expressions at schedule time |
| FR14 | **Timezone support** | Schedule recurring tasks in a specific timezone |

---

## 3. Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| NFR1 | **Availability** | 99.99% uptime (< 52.6 min downtime/year) |
| NFR2 | **Latency (scheduling)** | Task creation API < 100ms p99 |
| NFR3 | **Latency (execution)** | Task fires within 5 seconds of scheduled time |
| NFR4 | **Throughput** | Support 10M+ scheduled tasks |
| NFR5 | **Durability** | Zero task loss -- every scheduled task must eventually execute |
| NFR6 | **Consistency** | Exactly-once execution (no duplicates, no misses) |
| NFR7 | **Scalability** | Horizontal scaling of all components |
| NFR8 | **Fault tolerance** | No single point of failure |
| NFR9 | **Observability** | Full metrics, logging, distributed tracing |
| NFR10 | **Multi-tenancy** | Isolation between tenants; fair resource allocation |

---

## 4. Task Types Deep Dive

### 4.1 One-Time Delayed Tasks

```
Schedule: "Execute this task at 2026-04-07T15:30:00Z"
Use cases:
  - Send a reminder email in 24 hours
  - Process a payment at end of billing cycle
  - Expire a promotional offer at midnight
  - Delete temporary data after 30 days
  
Characteristics:
  - Single execution
  - Absolute timestamp
  - After execution, task is marked COMPLETED
  - No next_run_time calculation needed
```

### 4.2 Recurring Cron Tasks

```
Schedule: "*/5 * * * *" (every 5 minutes)
Use cases:
  - Generate hourly analytics reports
  - Sync inventory every 15 minutes
  - Run nightly database backups at 2 AM
  - Send weekly digest emails every Monday 9 AM
  
Cron Expression Format:
  ┌───────────── minute (0-59)
  │ ┌───────────── hour (0-23)
  │ │ ┌───────────── day of month (1-31)
  │ │ │ ┌───────────── month (1-12)
  │ │ │ │ ┌───────────── day of week (0-7, Sun=0 or 7)
  │ │ │ │ │
  * * * * *

Examples:
  "0 */2 * * *"     -> Every 2 hours
  "30 9 * * 1-5"    -> 9:30 AM weekdays
  "0 0 1 * *"       -> Midnight on 1st of each month
  "*/10 * * * *"    -> Every 10 minutes
  "0 3 * * 0"       -> 3 AM every Sunday
  
Characteristics:
  - Repeating execution
  - next_run_time calculated from cron expression after each run
  - Must handle DST transitions
  - Can be paused/resumed
```

### 4.3 Event-Triggered Tasks

```
Schedule: "Execute when event X occurs"
Use cases:
  - Process uploaded file when S3 event fires
  - Update search index when product catalog changes
  - Notify downstream services when pipeline completes
  - Trigger fraud check when payment is initiated
  
Characteristics:
  - No fixed schedule
  - Triggered by external events via webhook or message queue
  - Often combined with delayed execution (trigger + delay)
  - May fire multiple times per day or not at all
```

---

## 5. Cron Expression Parsing

Understanding cron parsing is critical for the interview:

```
Standard Cron Fields (5 fields):
  minute  hour  day_of_month  month  day_of_week

Extended Cron Fields (6 or 7 fields - used by Quartz, Spring):
  second  minute  hour  day_of_month  month  day_of_week  [year]

Special Characters:
  *     -> Every value
  ,     -> List separator        (1,3,5)
  -     -> Range                 (1-5)
  /     -> Step                  (*/5 = every 5)
  ?     -> No specific value     (day_of_week when day_of_month is set)
  L     -> Last                  (last day of month)
  W     -> Nearest weekday       (15W = nearest weekday to 15th)
  #     -> Nth occurrence        (3#2 = 2nd Wednesday)
```

### Next Run Time Calculation Algorithm

```python
def calculate_next_run(cron_expression: str, current_time: datetime) -> datetime:
    """
    Given a cron expression and the current time,
    calculate the next time this cron should fire.
    
    Algorithm (simplified):
    1. Start from current_time + 1 minute (ceiling to next minute)
    2. Check if month matches -> if not, advance to next matching month
    3. Check if day_of_month matches -> if not, advance to next matching day
    4. Check if day_of_week matches -> if not, advance to next matching day
    5. Check if hour matches -> if not, advance to next matching hour
    6. Check if minute matches -> if not, advance to next matching minute
    7. Return the resulting datetime
    
    Libraries: cronsim (Python), cron-parser (Node.js), 
               cronexpr (Go), Quartz (Java)
    """
    pass
```

### Timezone Handling

```
Problem: A task scheduled at "0 9 * * *" in America/New_York
         must fire at 9 AM Eastern, regardless of DST.

During DST transition (spring forward):
  - 2:00 AM -> 3:00 AM (skip)
  - A task at "30 2 * * *" -> SKIPPED (2:30 AM doesn't exist)
  
During DST transition (fall back):
  - 2:00 AM occurs TWICE
  - A task at "30 2 * * *" -> should fire ONCE (not twice)

Solution:
  1. Store cron expression + timezone (e.g., "America/New_York")
  2. Convert to UTC for storage and comparison
  3. When computing next_run_time:
     a. Compute next fire time in the task's timezone
     b. Convert to UTC
     c. Store UTC timestamp as next_run_time
  4. On DST transition:
     a. Spring forward: skip non-existent times
     b. Fall back: fire only on first occurrence

Storage Format:
  next_run_time: TIMESTAMP WITH TIME ZONE (always UTC)
  timezone: VARCHAR(50) (IANA timezone identifier)
  cron_expression: VARCHAR(100) (interpreted in task's timezone)
```

---

## 6. Back-of-the-Envelope Estimation

### 6.1 Scale Assumptions

```
Total scheduled tasks:              10,000,000 (10M)
  - One-time tasks:                  6,000,000 (60%)
  - Recurring tasks:                 4,000,000 (40%)

Tasks firing per second (peak):     ~50,000 TPS
  Reasoning:
  - 4M recurring tasks, average frequency = every 15 min
  - 4M / (15 * 60) = ~4,444 tasks/sec from recurring alone
  - One-time tasks: 6M spread over the day
  - 6M / 86400 = ~69 tasks/sec (bursty, can spike 100x)
  - Peak: ~50,000 tasks/sec (accounting for bursts)

Average task execution time:        5 seconds
Max task execution time:            5 minutes (timeout)

Task payload size:                  1 KB average
Task result size:                   2 KB average
```

### 6.2 Storage Estimation

```
Task Record Size:
  task_id (UUID):              16 bytes
  tenant_id:                   16 bytes
  task_type:                    1 byte  (enum)
  schedule_type:                1 byte  (enum: ONE_TIME, RECURRING, EVENT)
  cron_expression:             50 bytes
  timezone:                    30 bytes
  next_run_time:                8 bytes (timestamp)
  created_at:                   8 bytes
  updated_at:                   8 bytes
  status:                       1 byte  (enum)
  priority:                     4 bytes (int)
  payload:                  1,024 bytes (1 KB)
  callback_url:               200 bytes
  retry_config:                50 bytes (JSON)
  retry_count:                  4 bytes
  max_retries:                  4 bytes
  dag_id:                      16 bytes
  parent_task_ids:            100 bytes (array)
  version:                      8 bytes (optimistic lock)
  metadata:                   200 bytes
  ─────────────────────────────────────
  Total per task:          ~1,750 bytes (~1.7 KB)

Task Store (PostgreSQL):
  10M tasks x 1.7 KB = 17 GB (raw data)
  Indexes (est. 2x):          34 GB
  Total:                      ~51 GB (fits on single node, but we shard)

Task History / Audit Log:
  Each execution record:       500 bytes
  50,000 executions/sec x 500B = 25 MB/sec
  Per day: 25 MB x 86,400 = ~2.16 TB/day
  Retention: 30 days -> ~65 TB
  -> Use time-partitioned storage (TimescaleDB or S3)

Result Store:
  2 KB per result x 50,000/sec = 100 MB/sec
  Per day: ~8.6 TB
  -> Use blob storage (S3) for large results, 
     metadata in PostgreSQL
```

### 6.3 Compute Estimation

```
Scheduler Service (polling for due tasks):
  50,000 tasks/sec need to be discovered and enqueued
  Each poll query: SELECT tasks WHERE next_run_time <= NOW()
  With proper indexing + partitioning: 1-5ms per query
  Batch size: 1,000 tasks per poll
  Polls needed: 50 polls/sec (50,000 / 1,000)
  -> 3-5 scheduler instances (with partitioned responsibility)

Worker Pool:
  50,000 tasks/sec, each takes 5 sec average
  Concurrent tasks needed: 50,000 x 5 = 250,000
  Each worker handles ~100 concurrent tasks (async)
  Workers needed: 250,000 / 100 = 2,500 worker instances
  -> Auto-scale based on queue depth

Task Queue (Kafka):
  50,000 messages/sec write
  50,000 messages/sec read
  Message size: ~2 KB (task metadata + payload)
  Throughput: 50,000 x 2 KB = 100 MB/sec
  Partitions: 50-100 (for parallelism)
  Replication factor: 3
  -> 5-10 Kafka brokers

API Servers:
  Task creation: ~1,000 req/sec (tasks are created less frequently)
  Status queries: ~10,000 req/sec
  -> 5-10 API server instances behind load balancer
```

### 6.4 Summary Table

```
┌─────────────────────┬────────────────┬──────────────────┐
│ Component           │ Instances      │ Key Resource     │
├─────────────────────┼────────────────┼──────────────────┤
│ API Servers         │ 5-10           │ CPU (request     │
│                     │                │ handling)        │
│ Task Store (PG)     │ 3 (primary +   │ Storage: 51 GB   │
│                     │  2 replicas)   │ + sharding       │
│ Scheduler Service   │ 3-5            │ CPU (polling +   │
│                     │                │ cron parsing)    │
│ Task Queue (Kafka)  │ 5-10 brokers   │ Throughput:      │
│                     │                │ 100 MB/sec       │
│ Worker Pool         │ 2,500 (auto-   │ CPU/Memory       │
│                     │  scaled)       │ (task execution) │
│ Result Store        │ S3 + PG        │ 8.6 TB/day       │
│ History Store       │ TimescaleDB    │ 2.16 TB/day      │
│ Redis Cache         │ 3-node cluster │ Lock management  │
│                     │                │ + hot task cache  │
└─────────────────────┴────────────────┴──────────────────┘
```

---

## 7. API Design

### 7.1 REST API

```
POST   /api/v1/tasks              -> Create a new task
GET    /api/v1/tasks/{task_id}    -> Get task details
PUT    /api/v1/tasks/{task_id}    -> Update task (schedule, payload, priority)
DELETE /api/v1/tasks/{task_id}    -> Cancel/delete a task
GET    /api/v1/tasks              -> List tasks (with filters)
POST   /api/v1/tasks/{task_id}/pause   -> Pause a recurring task
POST   /api/v1/tasks/{task_id}/resume  -> Resume a paused task
GET    /api/v1/tasks/{task_id}/history -> Get execution history

POST   /api/v1/dags               -> Create a DAG (workflow)
GET    /api/v1/dags/{dag_id}      -> Get DAG details + status
POST   /api/v1/dags/{dag_id}/trigger  -> Manually trigger a DAG run
```

### 7.2 Create Task Request

```json
{
  "name": "send-weekly-digest",
  "description": "Send weekly email digest to subscribers",
  "schedule_type": "RECURRING",
  "cron_expression": "0 9 * * 1",
  "timezone": "America/New_York",
  "priority": 5,
  "payload": {
    "email_template": "weekly-digest-v2",
    "subscriber_segment": "active-users",
    "max_recipients": 100000
  },
  "callback_url": "https://api.example.com/webhooks/task-complete",
  "retry_config": {
    "max_retries": 3,
    "backoff_strategy": "EXPONENTIAL",
    "initial_delay_ms": 1000,
    "max_delay_ms": 60000
  },
  "timeout_seconds": 300,
  "tags": ["email", "weekly", "digest"],
  "idempotency_key": "weekly-digest-2026-04-07"
}
```

### 7.3 Create Task Response

```json
{
  "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "send-weekly-digest",
  "status": "SCHEDULED",
  "schedule_type": "RECURRING",
  "cron_expression": "0 9 * * 1",
  "timezone": "America/New_York",
  "next_run_time": "2026-04-13T13:00:00Z",
  "priority": 5,
  "created_at": "2026-04-07T10:00:00Z",
  "version": 1
}
```

### 7.4 Create DAG Request

```json
{
  "dag_id": "etl-pipeline",
  "name": "Daily ETL Pipeline",
  "schedule": "0 2 * * *",
  "timezone": "UTC",
  "tasks": [
    {
      "task_id": "extract",
      "name": "Extract data from sources",
      "payload": { "sources": ["mysql", "s3", "api"] },
      "dependencies": []
    },
    {
      "task_id": "transform",
      "name": "Transform and clean data",
      "payload": { "rules": "etl-rules-v3" },
      "dependencies": ["extract"]
    },
    {
      "task_id": "load-warehouse",
      "name": "Load into data warehouse",
      "payload": { "target": "bigquery" },
      "dependencies": ["transform"]
    },
    {
      "task_id": "load-cache",
      "name": "Update Redis cache",
      "payload": { "cache_keys": ["product_catalog", "pricing"] },
      "dependencies": ["transform"]
    },
    {
      "task_id": "notify",
      "name": "Send completion notification",
      "payload": { "channel": "#data-team" },
      "dependencies": ["load-warehouse", "load-cache"]
    }
  ]
}
```

---

## 8. Database Schema (Task Store)

### 8.1 Tasks Table

```sql
CREATE TABLE tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    
    -- Schedule Configuration
    schedule_type   VARCHAR(20) NOT NULL 
                    CHECK (schedule_type IN ('ONE_TIME', 'RECURRING', 'EVENT')),
    scheduled_time  TIMESTAMP WITH TIME ZONE,      -- for ONE_TIME tasks
    cron_expression VARCHAR(100),                   -- for RECURRING tasks
    timezone        VARCHAR(50) DEFAULT 'UTC',
    next_run_time   TIMESTAMP WITH TIME ZONE,       -- INDEXED: the key query column
    
    -- Execution
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
                    CHECK (status IN (
                        'SCHEDULED', 'QUEUED', 'RUNNING', 
                        'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED'
                    )),
    priority        INT NOT NULL DEFAULT 5 
                    CHECK (priority BETWEEN 1 AND 10),
    payload         JSONB NOT NULL DEFAULT '{}',
    callback_url    VARCHAR(500),
    
    -- Retry Configuration
    retry_config    JSONB DEFAULT '{"max_retries": 3, "backoff": "EXPONENTIAL"}',
    retry_count     INT NOT NULL DEFAULT 0,
    max_retries     INT NOT NULL DEFAULT 3,
    last_error      TEXT,
    
    -- DAG / Dependencies
    dag_id          UUID,
    parent_task_ids UUID[] DEFAULT '{}',
    
    -- Optimistic Locking (for exactly-once)
    version         BIGINT NOT NULL DEFAULT 1,
    
    -- Metadata
    tags            VARCHAR(50)[] DEFAULT '{}',
    timeout_seconds INT DEFAULT 300,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Partitioning key
    partition_key   INT GENERATED ALWAYS AS (
                        abs(hashtext(task_id::text)) % 1024
                    ) STORED
);

-- Critical index: scheduler polls this
CREATE INDEX idx_tasks_next_run_status 
    ON tasks (next_run_time, status) 
    WHERE status = 'SCHEDULED';

-- Tenant queries
CREATE INDEX idx_tasks_tenant_status 
    ON tasks (tenant_id, status);

-- DAG lookups
CREATE INDEX idx_tasks_dag 
    ON tasks (dag_id) 
    WHERE dag_id IS NOT NULL;

-- Priority ordering within queue window
CREATE INDEX idx_tasks_priority_next_run 
    ON tasks (priority DESC, next_run_time ASC) 
    WHERE status = 'SCHEDULED';
```

### 8.2 Task Execution History

```sql
CREATE TABLE task_executions (
    execution_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(task_id),
    
    status          VARCHAR(20) NOT NULL,
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    duration_ms     BIGINT,
    
    worker_id       VARCHAR(100),
    attempt_number  INT NOT NULL DEFAULT 1,
    
    result          JSONB,
    error_message   TEXT,
    error_stack     TEXT,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE task_executions_2026_04 
    PARTITION OF task_executions
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

### 8.3 DAGs Table

```sql
CREATE TABLE dags (
    dag_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    
    schedule        VARCHAR(100),
    timezone        VARCHAR(50) DEFAULT 'UTC',
    next_run_time   TIMESTAMP WITH TIME ZONE,
    
    graph           JSONB NOT NULL,  -- adjacency list of task dependencies
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 9. Task State Machine

```
                    ┌──────────┐
           ┌───────│ CANCELLED│
           │       └──────────┘
           │            ^
           │            │ cancel()
           │            │
    create()│     ┌───────────┐   enqueue()   ┌────────┐
    ────────┼────>│ SCHEDULED │──────────────>│ QUEUED │
            │     └───────────┘               └────────┘
            │           ^                         │
            │           │                    pick_up()
            │      resume()                       │
            │           │                         v
            │     ┌──────────┐              ┌─────────┐
            │     │  PAUSED  │              │ RUNNING │
            │     └──────────┘              └─────────┘
            │           ^                    │       │
            │      pause()              success() failure()
            │           │                │       │
            │           │                v       v
            │           │        ┌───────────┐ ┌────────┐
            │           │        │ COMPLETED │ │ FAILED │
            │           │        └───────────┘ └────────┘
            │           │                        │
            │           │                   retry?│
            │           │                        │
            │           │              ┌─────────┴──────────┐
            │           │              │                     │
            │           │         retries < max        retries >= max
            │           │              │                     │
            │           │              v                     v
            │           │        ┌───────────┐     ┌──────────────┐
            │           └────────│ SCHEDULED │     │ DEAD_LETTER  │
            │                    │ (retry)   │     │   QUEUE      │
            │                    └───────────┘     └──────────────┘
            │
            │  For RECURRING tasks after COMPLETED:
            │  compute next_run_time from cron_expression
            └──> back to SCHEDULED with new next_run_time
```

---

## 10. Interview Tip: How to Present Requirements

```
"Let me start by defining the scope. We need to design a distributed
 task scheduler that supports three types of tasks: one-time delayed,
 recurring cron, and event-triggered.

 The HARDEST requirement here is exactly-once execution. In a distributed
 system with multiple scheduler instances, we need to guarantee that
 each task fires exactly once at its scheduled time -- no duplicates,
 no misses.

 At Uber's scale, we're looking at 10M+ tasks with peak throughput
 of ~50K tasks/second. The system must be highly available (99.99%)
 and horizontally scalable.

 I'll walk through the architecture, then deep-dive into the
 exactly-once guarantee since that's the crux of this problem."
```

This framing shows the interviewer you understand what makes this
problem hard and where the real engineering challenges lie.
