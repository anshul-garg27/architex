# High-Level Design: Distributed Task Scheduler

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```mermaid
graph TB
    subgraph Clients
        C1[Service A]
        C2[Service B]
        C3[Admin Dashboard]
    end

    subgraph API Layer
        LB[Load Balancer]
        API1[Task API Server 1]
        API2[Task API Server 2]
        API3[Task API Server 3]
    end

    subgraph Storage Layer
        PG_PRIMARY[(PostgreSQL Primary<br/>Task Store)]
        PG_REPLICA1[(PG Replica 1<br/>Read-only)]
        PG_REPLICA2[(PG Replica 2<br/>Read-only)]
        REDIS[(Redis Cluster<br/>Distributed Locks<br/>+ Caching)]
    end

    subgraph Scheduler Layer
        S1[Scheduler 1<br/>Partitions 0-341]
        S2[Scheduler 2<br/>Partitions 342-682]
        S3[Scheduler 3<br/>Partitions 683-1023]
        ZK[ZooKeeper / etcd<br/>Leader Election<br/>Partition Assignment]
    end

    subgraph Task Queue
        K1[Kafka Broker 1]
        K2[Kafka Broker 2]
        K3[Kafka Broker 3]
        direction TB
        KT_HIGH[Topic: tasks-high-priority]
        KT_MED[Topic: tasks-medium-priority]
        KT_LOW[Topic: tasks-low-priority]
    end

    subgraph Worker Pool
        WP1[Worker Pod 1]
        WP2[Worker Pod 2]
        WP3[Worker Pod 3]
        WP4[Worker Pod N...]
        HPA[Horizontal Pod<br/>Autoscaler]
    end

    subgraph Result Store
        RS[(Result Store<br/>PostgreSQL)]
        S3_STORE[S3 / Blob Store<br/>Large Results]
        DLQ[Dead Letter Queue<br/>Failed Tasks]
    end

    subgraph Observability
        METRICS[Prometheus<br/>Metrics]
        LOGS[ELK Stack<br/>Logs]
        TRACES[Jaeger<br/>Traces]
        ALERTS[PagerDuty<br/>Alerts]
    end

    C1 & C2 & C3 --> LB
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> PG_PRIMARY
    API1 & API2 & API3 --> REDIS
    PG_PRIMARY --> PG_REPLICA1 & PG_REPLICA2

    S1 & S2 & S3 --> PG_PRIMARY
    S1 & S2 & S3 --> REDIS
    ZK --> S1 & S2 & S3

    S1 & S2 & S3 --> KT_HIGH & KT_MED & KT_LOW
    KT_HIGH & KT_MED & KT_LOW --> K1 & K2 & K3

    K1 & K2 & K3 --> WP1 & WP2 & WP3 & WP4
    HPA --> WP1 & WP2 & WP3 & WP4

    WP1 & WP2 & WP3 & WP4 --> RS
    WP1 & WP2 & WP3 & WP4 --> S3_STORE
    WP1 & WP2 & WP3 & WP4 --> DLQ

    WP1 & WP2 & WP3 & WP4 --> METRICS
    S1 & S2 & S3 --> METRICS
    METRICS --> ALERTS
```

### 1.2 Simplified Data Flow

```mermaid
graph LR
    A[Client] -->|1. Create Task| B[Task API]
    B -->|2. Store Task| C[(Task Store<br/>PostgreSQL)]
    D[Scheduler<br/>Service] -->|3. Poll: next_run_time <= NOW| C
    D -->|4. Enqueue| E[Task Queue<br/>Kafka]
    E -->|5. Pull Task| F[Worker Pool]
    F -->|6. Execute| G[Task Logic]
    G -->|7. Report Result| H[(Result Store)]
    H -->|8. Callback| A

    style D fill:#ff6b6b,stroke:#333,color:#000
    style E fill:#4ecdc4,stroke:#333,color:#000
```

---

## 2. Component Deep Dive

### 2.1 Task API Service

The API layer is the entry point for all task management operations.

```mermaid
sequenceDiagram
    participant Client
    participant API as Task API
    participant PG as PostgreSQL
    participant Redis
    participant Validator as Cron Validator

    Client->>API: POST /api/v1/tasks
    API->>API: Authenticate + Rate Limit
    API->>Validator: Validate cron expression
    Validator-->>API: Valid / Invalid
    
    alt Invalid cron expression
        API-->>Client: 400 Bad Request
    end
    
    API->>API: Calculate next_run_time from cron
    API->>PG: INSERT INTO tasks (...)
    PG-->>API: task_id, version=1
    API->>Redis: Cache task metadata
    API-->>Client: 201 Created {task_id, next_run_time}
```

**Key Responsibilities:**

```
1. Request Validation
   - Validate cron expressions (syntax + semantics)
   - Validate payload schema
   - Check tenant quotas and rate limits
   - Validate DAG for cycles (topological sort)

2. Task CRUD Operations
   - Create: Calculate initial next_run_time, insert into DB
   - Read: Serve from cache or read replica
   - Update: Increment version (optimistic lock), recalculate next_run_time
   - Delete: Soft-delete (mark as CANCELLED)

3. Idempotency
   - Accept idempotency_key in request
   - Store in Redis with TTL (24 hours)
   - Return cached response for duplicate requests

4. Rate Limiting
   - Per-tenant rate limiting (token bucket)
   - Global rate limiting for burst protection
```

**API Server Implementation:**

```python
class TaskAPIServer:
    """
    Stateless API server behind a load balancer.
    Horizontal scaling: add more instances as request volume grows.
    """
    
    def create_task(self, request: CreateTaskRequest) -> TaskResponse:
        # 1. Validate request
        self.validate_cron(request.cron_expression)
        self.validate_payload(request.payload)
        self.check_tenant_quota(request.tenant_id)
        
        # 2. Idempotency check
        if request.idempotency_key:
            cached = redis.get(f"idempotency:{request.idempotency_key}")
            if cached:
                return cached
        
        # 3. Calculate next_run_time
        if request.schedule_type == "RECURRING":
            next_run = cron_parser.next(request.cron_expression, 
                                         timezone=request.timezone)
        elif request.schedule_type == "ONE_TIME":
            next_run = request.scheduled_time
        else:
            next_run = None  # EVENT type, no schedule
        
        # 4. Compute partition_key for scheduler assignment
        partition_key = hash(task_id) % NUM_PARTITIONS
        
        # 5. Insert into database
        task = db.insert_task(
            task_id=uuid4(),
            tenant_id=request.tenant_id,
            cron_expression=request.cron_expression,
            next_run_time=next_run,
            status="SCHEDULED",
            priority=request.priority,
            payload=request.payload,
            version=1,
            partition_key=partition_key
        )
        
        # 6. Cache for idempotency
        if request.idempotency_key:
            redis.setex(f"idempotency:{request.idempotency_key}", 
                       86400, task)
        
        return TaskResponse(task)
```

---

### 2.2 Task Store (PostgreSQL)

The task store is the source of truth for all task definitions and state.

```mermaid
erDiagram
    TASKS {
        uuid task_id PK
        uuid tenant_id
        varchar name
        varchar schedule_type
        varchar cron_expression
        varchar timezone
        timestamp next_run_time
        varchar status
        int priority
        jsonb payload
        jsonb retry_config
        int retry_count
        uuid dag_id FK
        bigint version
        timestamp created_at
        timestamp updated_at
    }
    
    TASK_EXECUTIONS {
        uuid execution_id PK
        uuid task_id FK
        varchar status
        timestamp started_at
        timestamp completed_at
        bigint duration_ms
        varchar worker_id
        int attempt_number
        jsonb result
        text error_message
    }
    
    DAGS {
        uuid dag_id PK
        uuid tenant_id
        varchar name
        varchar schedule
        jsonb graph
        varchar status
    }
    
    DAG_RUNS {
        uuid run_id PK
        uuid dag_id FK
        varchar status
        timestamp started_at
        timestamp completed_at
    }
    
    TASKS ||--o{ TASK_EXECUTIONS : "has many"
    DAGS ||--o{ TASKS : "contains"
    DAGS ||--o{ DAG_RUNS : "has many"
```

**Why PostgreSQL (not NoSQL)?**

```
Reasons to choose PostgreSQL:

1. STRONG CONSISTENCY
   - Exactly-once requires ACID transactions
   - Optimistic locking needs atomic compare-and-swap
   - DAG state transitions need transactional guarantees

2. RICH QUERIES
   - WHERE next_run_time <= NOW() AND status = 'SCHEDULED'
   - ORDER BY priority DESC, next_run_time ASC
   - Complex filters: tenant, tags, status, time ranges

3. JSONB FOR FLEXIBILITY
   - Task payloads vary by task type
   - Retry config, metadata stored as JSONB
   - Can query inside JSONB when needed

4. PARTITIONING
   - Range partition task_executions by time
   - Hash partition tasks by partition_key (for scheduler assignment)
   - Automatic partition pruning in queries

5. BATTLE-TESTED
   - Uber, Airbnb, Apple use PostgreSQL at scale
   - Well-understood operational model
   - Rich ecosystem (pg_cron, pg_partman, pgBouncer)

When to consider alternatives:
   - DynamoDB: If you need automatic sharding + 10M+ TPS
   - Cassandra: If write throughput > 500K/sec
   - At our scale (10M tasks, 50K TPS) PostgreSQL with 
     sharding handles it well
```

**Partitioning Strategy:**

```sql
-- Hash partition the tasks table for scheduler assignment
-- Each scheduler instance owns a range of partitions

CREATE TABLE tasks (
    task_id UUID,
    partition_key INT,
    -- ... other columns
) PARTITION BY HASH (partition_key);

-- Create 1024 hash partitions (allows fine-grained assignment)
-- In practice, create logical partitions mapped to schedulers

-- For task_executions: range partition by time
CREATE TABLE task_executions (
    -- ... columns
) PARTITION BY RANGE (created_at);

-- Auto-create monthly partitions
-- Drop partitions older than retention period (30 days)
```

---

### 2.3 Scheduler Service (The Brain)

The scheduler is the most critical component. It discovers tasks that
are due for execution and enqueues them to the task queue.

```mermaid
sequenceDiagram
    participant ZK as ZooKeeper/etcd
    participant S1 as Scheduler 1
    participant S2 as Scheduler 2
    participant PG as PostgreSQL
    participant Redis as Redis Lock
    participant Kafka as Task Queue

    Note over ZK,S2: Partition Assignment Phase
    ZK->>S1: Assign partitions 0-511
    ZK->>S2: Assign partitions 512-1023

    loop Every 1 second
        S1->>PG: SELECT * FROM tasks<br/>WHERE partition_key IN (0..511)<br/>AND next_run_time <= NOW()<br/>AND status = 'SCHEDULED'<br/>ORDER BY priority DESC<br/>LIMIT 1000
        PG-->>S1: [Task A, Task B, Task C...]
        
        loop For each task
            S1->>PG: UPDATE tasks SET status='QUEUED',<br/>version=version+1<br/>WHERE task_id=X AND version=V
            
            alt Version match (got the lock)
                PG-->>S1: 1 row updated
                S1->>Kafka: Produce(task_A)
            else Version mismatch (another scheduler got it)
                PG-->>S1: 0 rows updated
                S1->>S1: Skip (already claimed)
            end
        end
    end

    Note over S1,S2: Recurring Task Handling
    S1->>PG: For completed recurring tasks:<br/>UPDATE next_run_time = <br/>cron_next(cron_expression, NOW()),<br/>status = 'SCHEDULED'
```

**Scheduler Core Loop:**

```python
class SchedulerService:
    """
    Each scheduler instance is responsible for a subset of task partitions.
    Partition assignment is managed by ZooKeeper/etcd.
    """
    
    def __init__(self, scheduler_id: str):
        self.scheduler_id = scheduler_id
        self.assigned_partitions = []  # set by ZK watcher
        self.running = True
    
    def run(self):
        """Main scheduler loop."""
        while self.running:
            try:
                # Step 1: Poll for due tasks in our partitions
                due_tasks = self.poll_due_tasks()
                
                # Step 2: Claim and enqueue each task
                for task in due_tasks:
                    self.process_task(task)
                
                # Step 3: Brief sleep to avoid hot-looping
                #         (adaptive: sleep less when busy)
                if len(due_tasks) == 0:
                    time.sleep(1.0)  # idle: poll every 1 sec
                else:
                    time.sleep(0.1)  # busy: poll every 100ms
                    
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                metrics.increment("scheduler.loop.errors")
                time.sleep(5)  # back off on error
    
    def poll_due_tasks(self) -> List[Task]:
        """
        Query for tasks that are due for execution
        in our assigned partitions.
        """
        query = """
            SELECT task_id, tenant_id, name, schedule_type,
                   cron_expression, timezone, next_run_time,
                   status, priority, payload, retry_config,
                   retry_count, version, dag_id, parent_task_ids
            FROM tasks
            WHERE partition_key = ANY(%s)
              AND next_run_time <= NOW()
              AND status = 'SCHEDULED'
            ORDER BY priority DESC, next_run_time ASC
            LIMIT 1000
        """
        return db.execute(query, [self.assigned_partitions])
    
    def process_task(self, task: Task) -> bool:
        """
        Claim a task using optimistic locking, then enqueue it.
        Returns True if we successfully claimed and enqueued.
        """
        # Step 1: Attempt to claim via optimistic lock
        rows_updated = db.execute("""
            UPDATE tasks 
            SET status = 'QUEUED',
                version = version + 1,
                updated_at = NOW()
            WHERE task_id = %s 
              AND version = %s
              AND status = 'SCHEDULED'
        """, [task.task_id, task.version])
        
        if rows_updated == 0:
            # Another scheduler already claimed this task
            metrics.increment("scheduler.claim.conflict")
            return False
        
        # Step 2: Enqueue to Kafka
        topic = self.get_priority_topic(task.priority)
        kafka_producer.produce(
            topic=topic,
            key=str(task.task_id),
            value=task.to_message(),
            headers={
                "tenant_id": task.tenant_id,
                "attempt": str(task.retry_count + 1)
            }
        )
        
        metrics.increment("scheduler.tasks.enqueued")
        return True
    
    def get_priority_topic(self, priority: int) -> str:
        """Map priority to Kafka topic for priority-based processing."""
        if priority >= 8:
            return "tasks-high-priority"
        elif priority >= 4:
            return "tasks-medium-priority"
        else:
            return "tasks-low-priority"
```

**Partition Assignment via ZooKeeper/etcd:**

```mermaid
graph TB
    subgraph ZooKeeper
        ZK[ZooKeeper Ensemble]
        LEADER[Leader Election<br/>Node]
        ASSIGN[Partition Assignment<br/>Node]
    end

    subgraph Schedulers
        S1[Scheduler 1]
        S2[Scheduler 2]
        S3[Scheduler 3]
    end

    ZK --> LEADER
    LEADER --> ASSIGN
    
    ASSIGN -->|"partitions: [0-341]"| S1
    ASSIGN -->|"partitions: [342-682]"| S2
    ASSIGN -->|"partitions: [683-1023]"| S3

    S1 -->|heartbeat| ZK
    S2 -->|heartbeat| ZK
    S3 -->|heartbeat| ZK
```

```
Partition Rebalancing:
  1. Scheduler 3 dies -> ZK detects via missed heartbeat
  2. ZK triggers rebalance
  3. Partitions 683-1023 redistributed to Scheduler 1 and 2
  4. Scheduler 1 now owns: 0-341, 683-852
  5. Scheduler 2 now owns: 342-682, 853-1023
  6. New scheduler joins -> ZK triggers rebalance again
  7. Partitions evenly redistributed across 3 schedulers

This is EXACTLY how Kafka consumer groups work!
We use the same consistent hashing / range assignment strategy.
```

---

### 2.4 Task Queue (Kafka)

The task queue decouples the scheduler from workers and provides
durability and ordering guarantees.

```mermaid
graph TB
    subgraph Kafka Cluster
        subgraph "Topic: tasks-high-priority"
            HP0[Partition 0]
            HP1[Partition 1]
            HP2[Partition 2]
        end
        
        subgraph "Topic: tasks-medium-priority"
            MP0[Partition 0]
            MP1[Partition 1]
            MP2[Partition 2]
            MP3[Partition 3]
        end
        
        subgraph "Topic: tasks-low-priority"
            LP0[Partition 0]
            LP1[Partition 1]
        end
    end

    S[Schedulers] --> HP0 & HP1 & HP2
    S --> MP0 & MP1 & MP2 & MP3
    S --> LP0 & LP1

    HP0 & HP1 & HP2 --> W_HIGH[High-Priority<br/>Worker Group<br/>16 consumers]
    MP0 & MP1 & MP2 & MP3 --> W_MED[Medium-Priority<br/>Worker Group<br/>32 consumers]
    LP0 & LP1 --> W_LOW[Low-Priority<br/>Worker Group<br/>8 consumers]
```

**Why Kafka (vs Redis Sorted Set)?**

```
Kafka Advantages:
  + Durable: Messages persisted to disk, replicated across brokers
  + Ordered: Per-partition ordering guarantees
  + Scalable: Add partitions for more parallelism
  + Replay: Can replay messages (useful for recovery)
  + Consumer groups: Built-in load balancing across workers
  + Backpressure: Workers consume at their own rate

Redis Sorted Set Alternative:
  + Lower latency (in-memory)
  + Built-in priority via score (priority + timestamp)
  + Simpler setup for smaller scale
  - Not durable (data loss on restart without AOF)
  - Single-threaded (throughput ceiling)
  - No built-in consumer groups (need custom implementation)
  - Memory-bound (expensive for millions of tasks)

Decision: Use Kafka for the main task queue (durability + scale)
          Use Redis for auxiliary functions (distributed locks, caching)
```

**Alternative: Redis Sorted Set for Priority Queue**

```python
class RedisPriorityQueue:
    """
    Alternative implementation using Redis sorted sets.
    Score = (priority_bucket * 10^13) + timestamp_ms
    Lower score = higher priority + earlier time = dequeued first.
    """
    
    def enqueue(self, task: Task):
        # Score: higher priority (lower number) comes first,
        # then by scheduled time
        inverted_priority = 10 - task.priority  # 10 -> 0, 1 -> 9
        score = inverted_priority * (10 ** 13) + task.next_run_time_ms
        
        redis.zadd("task_queue", {task.task_id: score})
    
    def dequeue(self, count: int = 10) -> List[str]:
        """
        Atomic pop of lowest-score items.
        Uses ZPOPMIN for atomic dequeue (Redis 5.0+).
        """
        # ZPOPMIN atomically removes and returns members 
        # with lowest scores
        results = redis.zpopmin("task_queue", count)
        return [task_id for task_id, score in results]
    
    def peek(self, count: int = 10) -> List[str]:
        """View next tasks without removing them."""
        return redis.zrange("task_queue", 0, count - 1)
    
    def size(self) -> int:
        return redis.zcard("task_queue")
```

---

### 2.5 Worker Pool

Workers pull tasks from the queue, execute them, and report results.

```mermaid
sequenceDiagram
    participant Kafka as Task Queue
    participant Worker
    participant Executor as Task Executor
    participant PG as PostgreSQL
    participant RS as Result Store
    participant CB as Callback

    Worker->>Kafka: Poll for messages
    Kafka-->>Worker: Task message
    
    Worker->>PG: UPDATE tasks SET status='RUNNING'<br/>WHERE task_id=X
    
    Worker->>Executor: Execute task payload
    
    alt Task succeeds
        Executor-->>Worker: Result
        Worker->>RS: Store result
        Worker->>PG: UPDATE tasks SET status='COMPLETED'
        Worker->>CB: POST callback_url (result)
        Worker->>Kafka: Commit offset
        
        Note over Worker,PG: For RECURRING tasks:
        Worker->>PG: UPDATE tasks SET<br/>status='SCHEDULED',<br/>next_run_time=cron_next()
        
    else Task fails (retryable)
        Executor-->>Worker: Error
        Worker->>PG: UPDATE tasks SET<br/>status='SCHEDULED',<br/>retry_count += 1,<br/>next_run_time = NOW() + backoff(retry_count)
        Worker->>Kafka: Commit offset
        
    else Task fails (max retries exceeded)
        Executor-->>Worker: Error
        Worker->>PG: UPDATE tasks SET status='FAILED'
        Worker->>Worker: Send to Dead Letter Queue
        Worker->>CB: POST callback_url (error)
        Worker->>Kafka: Commit offset
        
    else Task timeout
        Note over Worker: Task exceeds timeout_seconds
        Worker->>Executor: Cancel execution
        Worker->>PG: UPDATE tasks SET<br/>status='SCHEDULED',<br/>retry_count += 1
    end
```

**Worker Implementation:**

```python
class TaskWorker:
    """
    Workers are stateless and horizontally scalable.
    Each worker consumes from one or more Kafka topics.
    """
    
    def __init__(self, worker_id: str, priority_topics: List[str]):
        self.worker_id = worker_id
        self.consumer = KafkaConsumer(
            topics=priority_topics,
            group_id="task-workers",
            enable_auto_commit=False,  # manual commit for exactly-once
            max_poll_records=10
        )
        self.executor = TaskExecutor()
        self.running = True
    
    def run(self):
        """Main worker loop."""
        while self.running:
            messages = self.consumer.poll(timeout_ms=1000)
            
            for message in messages:
                task = Task.from_message(message.value)
                self.process_task(task)
    
    def process_task(self, task: Task):
        """Execute a single task with timeout and error handling."""
        try:
            # Mark as RUNNING
            db.execute("""
                UPDATE tasks SET status = 'RUNNING',
                    updated_at = NOW()
                WHERE task_id = %s
            """, [task.task_id])
            
            # Execute with timeout
            result = self.executor.execute(
                task.payload,
                timeout=task.timeout_seconds
            )
            
            # Success: store result and update status
            self.handle_success(task, result)
            
        except TaskTimeoutError:
            self.handle_timeout(task)
            
        except RetryableError as e:
            self.handle_retryable_failure(task, e)
            
        except PermanentError as e:
            self.handle_permanent_failure(task, e)
            
        finally:
            # Always commit the Kafka offset
            # (task state is tracked in DB, not Kafka)
            self.consumer.commit()
    
    def handle_success(self, task: Task, result: dict):
        """Handle successful task execution."""
        # Store result
        db.execute("""
            INSERT INTO task_executions 
            (task_id, status, started_at, completed_at, 
             duration_ms, worker_id, attempt_number, result)
            VALUES (%s, 'COMPLETED', %s, NOW(), %s, %s, %s, %s)
        """, [task.task_id, task.started_at, 
              result.duration_ms, self.worker_id,
              task.retry_count + 1, json.dumps(result.data)])
        
        if task.schedule_type == "RECURRING":
            # Calculate next run time and re-schedule
            next_run = cron_parser.next(
                task.cron_expression, 
                timezone=task.timezone
            )
            db.execute("""
                UPDATE tasks 
                SET status = 'SCHEDULED',
                    next_run_time = %s,
                    retry_count = 0,
                    version = version + 1,
                    updated_at = NOW()
                WHERE task_id = %s
            """, [next_run, task.task_id])
        else:
            # One-time task: mark completed
            db.execute("""
                UPDATE tasks 
                SET status = 'COMPLETED',
                    version = version + 1,
                    updated_at = NOW()
                WHERE task_id = %s
            """, [task.task_id])
        
        # Fire webhook callback if configured
        if task.callback_url:
            self.send_callback(task.callback_url, {
                "task_id": task.task_id,
                "status": "COMPLETED",
                "result": result.data
            })
        
        # Check DAG: trigger downstream tasks
        if task.dag_id:
            self.trigger_downstream_tasks(task)
    
    def handle_retryable_failure(self, task: Task, error: Exception):
        """Handle a failure that can be retried."""
        if task.retry_count < task.max_retries:
            # Calculate exponential backoff
            delay = self.calculate_backoff(task.retry_count)
            next_retry_time = datetime.utcnow() + timedelta(seconds=delay)
            
            db.execute("""
                UPDATE tasks 
                SET status = 'SCHEDULED',
                    retry_count = retry_count + 1,
                    next_run_time = %s,
                    last_error = %s,
                    version = version + 1,
                    updated_at = NOW()
                WHERE task_id = %s
            """, [next_retry_time, str(error), task.task_id])
            
            logger.warning(
                f"Task {task.task_id} failed (attempt {task.retry_count + 1}), "
                f"retrying at {next_retry_time}: {error}"
            )
        else:
            self.handle_permanent_failure(task, error)
    
    def handle_permanent_failure(self, task: Task, error: Exception):
        """Handle a failure that exhausted all retries."""
        db.execute("""
            UPDATE tasks 
            SET status = 'FAILED',
                last_error = %s,
                version = version + 1,
                updated_at = NOW()
            WHERE task_id = %s
        """, [str(error), task.task_id])
        
        # Send to Dead Letter Queue for investigation
        kafka_producer.produce(
            topic="tasks-dead-letter",
            key=str(task.task_id),
            value=task.to_message()
        )
        
        # Alert on-call if critical task
        if task.priority >= 8:
            alerting.page(
                f"Critical task {task.task_id} ({task.name}) failed "
                f"after {task.max_retries} retries: {error}"
            )
    
    def calculate_backoff(self, retry_count: int) -> float:
        """
        Exponential backoff with jitter.
        Prevents thundering herd on retries.
        """
        base_delay = 1.0  # 1 second
        max_delay = 300.0  # 5 minutes
        
        # Exponential: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s
        delay = min(base_delay * (2 ** retry_count), max_delay)
        
        # Add jitter: random between 0 and delay
        jitter = random.uniform(0, delay * 0.3)
        
        return delay + jitter
```

---

### 2.6 Result Store

```
Architecture:
  - PostgreSQL: Task execution metadata (status, duration, worker)
  - S3/Blob Store: Large task results (> 1 MB)
  - Redis: Recent results cache for frequent status checks

Result Lifecycle:
  1. Worker completes task
  2. Small results (<1 MB): stored in task_executions table
  3. Large results: uploaded to S3, reference stored in DB
  4. Recent results cached in Redis (TTL: 1 hour)
  5. Old results archived and eventually purged per retention policy
```

---

## 3. Task Dependencies (DAG Execution)

### 3.1 DAG Structure

```mermaid
graph TD
    A[Extract Data<br/>Task A] --> B[Transform<br/>Task B]
    A --> C[Validate<br/>Task C]
    B --> D[Load to Warehouse<br/>Task D]
    C --> D
    D --> E[Generate Report<br/>Task E]
    D --> F[Update Cache<br/>Task F]
    E --> G[Send Notification<br/>Task G]
    F --> G

    style A fill:#4ecdc4,stroke:#333,color:#000
    style G fill:#ff6b6b,stroke:#333,color:#000
```

### 3.2 DAG Execution Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant PG as PostgreSQL
    participant Queue as Task Queue
    participant Worker
    participant DAG as DAG Engine

    Note over Scheduler: DAG trigger fires (cron or manual)
    
    Scheduler->>PG: Create DAG Run
    Scheduler->>PG: Find root tasks (no dependencies)
    PG-->>Scheduler: [Task A] (no parents)
    Scheduler->>Queue: Enqueue Task A
    
    Worker->>Queue: Pull Task A
    Worker->>Worker: Execute Task A
    Worker->>PG: Task A COMPLETED
    
    Worker->>DAG: Check downstream tasks
    DAG->>PG: Find children of Task A
    PG-->>DAG: [Task B, Task C]
    
    loop For each child task
        DAG->>PG: Are ALL parents of this child COMPLETED?
        
        alt All parents complete
            PG-->>DAG: Yes
            DAG->>PG: UPDATE task SET status='SCHEDULED'
            DAG->>Queue: Enqueue child task
        else Some parents still running
            PG-->>DAG: No
            DAG->>DAG: Skip (wait for other parents)
        end
    end
    
    Note over DAG: This continues until all tasks complete<br/>or a task fails (halts downstream)
```

### 3.3 DAG Engine Implementation

```python
class DAGEngine:
    """
    Manages task dependencies within a DAG.
    Uses topological ordering to determine execution sequence.
    """
    
    def trigger_dag_run(self, dag_id: str) -> str:
        """Start a new run of a DAG."""
        dag = db.get_dag(dag_id)
        
        # Validate DAG has no cycles
        if not self.is_acyclic(dag.graph):
            raise ValueError("DAG contains cycles!")
        
        # Create a DAG run
        run_id = db.create_dag_run(dag_id)
        
        # Create task instances for this run
        for task_def in dag.tasks:
            db.create_task(
                dag_id=dag_id,
                dag_run_id=run_id,
                parent_task_ids=task_def.dependencies,
                status='PENDING' if task_def.dependencies else 'SCHEDULED',
                # Root tasks (no deps) are immediately SCHEDULED
            )
        
        return run_id
    
    def on_task_completed(self, task: Task):
        """Called when a task in a DAG completes."""
        if not task.dag_id:
            return
        
        # Find all downstream tasks
        children = db.execute("""
            SELECT * FROM tasks
            WHERE dag_id = %s
              AND %s = ANY(parent_task_ids)
              AND status = 'PENDING'
        """, [task.dag_id, task.task_id])
        
        for child in children:
            # Check if ALL parent tasks are completed
            all_parents_done = db.execute("""
                SELECT COUNT(*) = 0 
                FROM tasks 
                WHERE task_id = ANY(%s)
                  AND status != 'COMPLETED'
            """, [child.parent_task_ids])
            
            if all_parents_done:
                db.execute("""
                    UPDATE tasks 
                    SET status = 'SCHEDULED',
                        next_run_time = NOW()
                    WHERE task_id = %s
                """, [child.task_id])
    
    def is_acyclic(self, graph: dict) -> bool:
        """
        Kahn's algorithm for cycle detection.
        Also produces topological ordering.
        """
        in_degree = defaultdict(int)
        for node, neighbors in graph.items():
            for neighbor in neighbors:
                in_degree[neighbor] += 1
        
        queue = deque([n for n in graph if in_degree[n] == 0])
        visited = 0
        
        while queue:
            node = queue.popleft()
            visited += 1
            for neighbor in graph.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return visited == len(graph)
```

---

## 4. Retry Strategy Deep Dive

### 4.1 Retry Flow

```mermaid
graph TD
    A[Task Execution] -->|Success| B[COMPLETED]
    A -->|Failure| C{Retryable<br/>Error?}
    
    C -->|No: 4xx, auth, validation| D[FAILED<br/>Dead Letter Queue]
    C -->|Yes: timeout, 5xx, network| E{retry_count<br/>< max_retries?}
    
    E -->|No| D
    E -->|Yes| F[Calculate Backoff]
    
    F --> G[next_run_time =<br/>NOW + backoff]
    G --> H[status = SCHEDULED<br/>retry_count += 1]
    H --> I[Scheduler picks up<br/>at next_run_time]
    I --> A

    style B fill:#4ecdc4,stroke:#333,color:#000
    style D fill:#ff6b6b,stroke:#333,color:#000
```

### 4.2 Backoff Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│ Strategy          │ Formula             │ Delays               │
├─────────────────────────────────────────────────────────────────┤
│ Fixed             │ delay               │ 5s, 5s, 5s, 5s      │
│ Linear            │ delay * attempt     │ 5s, 10s, 15s, 20s   │
│ Exponential       │ delay * 2^attempt   │ 1s, 2s, 4s, 8s, 16s │
│ Exp + Jitter      │ exp + rand(0, exp)  │ 1.3s, 2.7s, 5.1s... │
│ Decorrelated      │ rand(delay, prev*3) │ 1.8s, 4.2s, 7.5s... │
└─────────────────────────────────────────────────────────────────┘

Best Practice: ALWAYS use exponential backoff WITH jitter.
  - Exponential prevents hammering a failing dependency
  - Jitter prevents thundering herd (all retries at same time)
```

### 4.3 Dead Letter Queue (DLQ)

```
Dead Letter Queue Purpose:
  1. Capture tasks that exhausted all retries
  2. Allow manual investigation and replay
  3. Prevent infinite retry loops

DLQ Operations:
  - Browse: View failed tasks and their error messages
  - Replay: Re-submit a task from DLQ to the main queue
  - Purge: Delete investigated tasks from DLQ
  - Alert: Auto-alert on-call for critical task failures

DLQ Message Contains:
  - Original task payload
  - All retry attempts with error details
  - Stack traces from each attempt
  - Worker ID that last attempted execution
  - Timestamp of each attempt
```

---

## 5. Complete End-to-End Flow

### 5.1 One-Time Task Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Task API
    participant PG as PostgreSQL
    participant Scheduler
    participant Kafka as Task Queue
    participant Worker
    participant Result as Result Store

    Client->>API: POST /tasks<br/>{type: "ONE_TIME",<br/> time: "2026-04-07T15:00:00Z"}
    API->>PG: INSERT task<br/>(next_run_time=15:00, status=SCHEDULED)
    API-->>Client: 201 Created

    Note over Scheduler: At 15:00:00 UTC
    Scheduler->>PG: SELECT WHERE next_run_time <= NOW()
    PG-->>Scheduler: [task]
    Scheduler->>PG: UPDATE status=QUEUED, version++
    Scheduler->>Kafka: Produce task message
    
    Worker->>Kafka: Consume message
    Worker->>PG: UPDATE status=RUNNING
    Worker->>Worker: Execute task
    Worker->>Result: Store result
    Worker->>PG: UPDATE status=COMPLETED
    Worker->>Client: POST callback_url
```

### 5.2 Recurring Task Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Task API
    participant PG as PostgreSQL
    participant Scheduler
    participant Worker

    Client->>API: POST /tasks<br/>{type: "RECURRING",<br/> cron: "0 9 * * 1",<br/> tz: "America/New_York"}
    API->>API: next_run = cron_next("0 9 * * 1", "America/New_York")
    API->>PG: INSERT task<br/>(cron="0 9 * * 1",<br/> next_run=2026-04-13T13:00Z,<br/> status=SCHEDULED)
    API-->>Client: 201 Created

    Note over Scheduler: At Monday 9 AM ET (13:00 UTC)
    Scheduler->>PG: Poll due tasks
    Scheduler->>PG: Claim task (optimistic lock)
    Scheduler->>Worker: Enqueue via Kafka

    Worker->>Worker: Execute task
    Worker->>PG: UPDATE status=COMPLETED

    Note over Worker: Re-schedule for next occurrence
    Worker->>Worker: next_run = cron_next("0 9 * * 1")
    Worker->>PG: UPDATE next_run_time=2026-04-20T13:00Z,<br/>status=SCHEDULED, retry_count=0
    
    Note over Scheduler: Cycle repeats every Monday 9 AM ET
```

---

## 6. Architecture Patterns Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Pattern               │ Where Used        │ Why             │
├─────────────────────────────────────────────────────────────┤
│ Optimistic Locking    │ Scheduler         │ Exactly-once    │
│                       │ (version field)   │ claim           │
│                       │                   │                 │
│ Partition Assignment  │ Scheduler <-> DB  │ Avoid full      │
│                       │                   │ table scans     │
│                       │                   │                 │
│ Priority Queues       │ Kafka topics      │ High-priority   │
│                       │                   │ tasks first     │
│                       │                   │                 │
│ Consumer Groups       │ Kafka workers     │ Load balanced   │
│                       │                   │ processing      │
│                       │                   │                 │
│ Exponential Backoff   │ Worker retries    │ Prevent         │
│                       │                   │ overload        │
│                       │                   │                 │
│ Dead Letter Queue     │ Failed tasks      │ Error isolation │
│                       │                   │                 │
│ Saga / Choreography   │ DAG execution     │ Multi-step      │
│                       │                   │ workflows       │
│                       │                   │                 │
│ Leader Election       │ Scheduler HA      │ No SPOF         │
│                       │                   │                 │
│ Circuit Breaker       │ Worker -> Service │ Protect         │
│                       │                   │ dependencies    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Interview Tip: Drawing the Architecture

```
When presenting this to an interviewer, draw it LEFT to RIGHT:

  Client -> API -> Task Store -> Scheduler -> Queue -> Workers -> Result

Then add these annotations:

  1. Circle the Scheduler and say:
     "This is the brain. The hardest part is ensuring exactly-once
      execution when we have multiple scheduler instances."

  2. Circle the Queue and say:
     "This decouples scheduling from execution. Workers can scale
      independently based on queue depth."

  3. Circle the Task Store and say:
     "The DB is the source of truth. We use optimistic locking 
      (version field) for exactly-once guarantees."

  4. Point to Workers and say:
     "Workers are stateless and horizontally scalable. 
      Auto-scaled based on Kafka consumer lag."

This shows you understand the system at multiple levels.
```
