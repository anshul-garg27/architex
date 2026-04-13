# Design a Metrics Monitoring & Alerting System -- High-Level Design

## 1. End-to-End Architecture Overview

```mermaid
graph TB
    subgraph Sources["Metric Sources"]
        S1[Server Agents<br/>10K hosts]
        S2[Application SDKs<br/>StatsD / OpenTelemetry]
        S3[Cloud Provider<br/>APIs / CloudWatch]
        S4[Infrastructure<br/>Kubernetes / Docker]
    end

    subgraph Collection["Collection Layer"]
        GW1[Ingestion Gateway<br/>Load Balancer]
        GW2[Ingestion Gateway<br/>Load Balancer]
        SC[Service Discovery<br/>Consul / DNS]
    end

    subgraph Processing["Processing & Routing"]
        PP1[Pre-Processor<br/>Validation / Enrichment]
        PP2[Pre-Processor<br/>Validation / Enrichment]
        KF[Kafka / Message Queue<br/>Buffering & Fanout]
        AGG[Stream Aggregator<br/>Pre-compute rollups]
    end

    subgraph Storage["Time-Series Storage"]
        TSDB1[(TSDB Node 1<br/>Recent Data)]
        TSDB2[(TSDB Node 2<br/>Recent Data)]
        TSDB3[(TSDB Node 3<br/>Recent Data)]
        IDX[(Inverted Index<br/>Label Lookups)]
        OBJ[(Object Storage<br/>S3 / GCS<br/>Historical Blocks)]
    end

    subgraph Query["Query & Visualization"]
        QE[Query Engine<br/>PromQL Parser]
        QC[Query Cache<br/>Redis / Memcached]
        DASH[Dashboard Service<br/>Grafana-like UI]
        API[Public API<br/>REST / gRPC]
    end

    subgraph Alerting["Alert Engine"]
        RE[Rules Engine<br/>Evaluator]
        AS[Alert State<br/>Manager]
        NR[Notification Router<br/>Slack / PD / Email]
    end

    S1 -->|push| GW1
    S2 -->|push| GW2
    SC -->|pull targets| GW1
    S3 -->|poll| PP1
    S4 -->|push| GW2

    GW1 --> PP1
    GW2 --> PP2
    PP1 --> KF
    PP2 --> KF

    KF --> AGG
    KF --> TSDB1
    KF --> TSDB2
    KF --> TSDB3
    AGG --> TSDB1

    TSDB1 --> IDX
    TSDB2 --> IDX
    TSDB3 --> IDX
    TSDB1 -.->|compact & upload| OBJ
    TSDB2 -.->|compact & upload| OBJ
    TSDB3 -.->|compact & upload| OBJ

    QE --> TSDB1
    QE --> TSDB2
    QE --> TSDB3
    QE --> OBJ
    QE --> IDX
    QE --> QC

    DASH --> QE
    API --> QE

    KF -->|real-time feed| RE
    RE --> AS
    AS --> NR

    style KF fill:#f9a825,stroke:#f57f17
    style RE fill:#e53935,stroke:#b71c1c,color:#fff
    style TSDB1 fill:#1565c0,stroke:#0d47a1,color:#fff
    style TSDB2 fill:#1565c0,stroke:#0d47a1,color:#fff
    style TSDB3 fill:#1565c0,stroke:#0d47a1,color:#fff
```

---

## 2. Component Breakdown

### 2.1 Metric Collection Agents

The collection layer is responsible for getting metrics from source systems into
the monitoring pipeline.

```mermaid
graph LR
    subgraph Host["Each Host (10K total)"]
        APP[Application Process]
        NODE[Node Exporter<br/>System Metrics]
        AGT[Monitoring Agent<br/>Collector + Buffer]
    end

    subgraph Collection["Collection Service"]
        LB[Load Balancer<br/>L4 / DNS Round Robin]
        ING1[Ingestion Node 1]
        ING2[Ingestion Node 2]
        ING3[Ingestion Node 3]
    end

    APP -->|StatsD UDP<br/>or OpenTelemetry gRPC| AGT
    NODE -->|/metrics endpoint| AGT
    AGT -->|Batched HTTP POST<br/>every 10s| LB
    LB --> ING1
    LB --> ING2
    LB --> ING3
```

**Two Collection Models:**

| Aspect | Push Model (StatsD/Datadog) | Pull Model (Prometheus) |
|--------|---------------------------|------------------------|
| Direction | Agents push to collector | Collector scrapes targets |
| Service Discovery | Not required (agents know endpoint) | Required (need target list) |
| NAT/Firewall | Works behind NAT | Requires reachable endpoints |
| Health Detection | Cannot detect dead agent (silence) | Knows when target is down |
| Serverless/Lambda | Works well | Not feasible |
| Configuration | Agent-side (what to send) | Server-side (what to scrape) |
| Back-pressure | Harder (agent decides rate) | Easier (collector controls pace) |

**Our Design: Support Both**

```
Push Path:
  Agent -> Ingestion Gateway -> Pre-processor -> Kafka

Pull Path:
  Service Discovery -> Scrape Scheduler -> HTTP GET /metrics -> Pre-processor -> Kafka

Both paths converge at Kafka for unified downstream processing.
```

### 2.2 Pre-Processor (Validation & Enrichment)

```mermaid
flowchart LR
    RAW[Raw Metric<br/>from Agent] --> VAL{Validate}
    VAL -->|Invalid| DROP[Drop + Count<br/>Bad Metrics]
    VAL -->|Valid| ENRICH[Enrich Labels<br/>add region, cluster, env]
    ENRICH --> CARD{Cardinality<br/>Check}
    CARD -->|Over limit| REJECT[Reject + Alert<br/>Cardinality Explosion]
    CARD -->|OK| HASH[Compute<br/>Series ID Hash]
    HASH --> KAFKA[Publish to<br/>Kafka Topic]
```

**Pre-processing steps:**

```
1. Schema Validation
   - Metric name matches regex: [a-zA-Z_:][a-zA-Z0-9_:]*
   - Timestamp is within acceptable window (not too old, not in future)
   - Value is a valid float64

2. Label Enrichment
   - Add infrastructure labels (region, availability_zone, cluster)
   - Normalize label names (lowercase, replace dots with underscores)

3. Cardinality Enforcement
   - Track unique series count per metric name
   - If a metric exceeds cardinality limit (e.g., 10,000 series), reject new series
   - This prevents "cardinality explosions" (e.g., someone tagging with user_id)

4. Series ID Computation
   - Hash(metric_name + sorted(labels)) -> uint64 series_id
   - Used for partitioning and deduplication

5. Kafka Partitioning
   - Partition by series_id for ordering guarantees per series
   - Ensures all samples for the same series land on the same TSDB node
```

### 2.3 Message Queue (Kafka)

Kafka serves as the central nervous system between ingestion and storage:

```
Topic: metrics-raw
  Partitions: 64 (tunable)
  Replication: 3
  Retention: 6 hours (buffer for reprocessing)

Partition assignment: hash(series_id) % num_partitions
  -> Guarantees ordering per time series
  -> Enables parallel consumption

Consumers:
  1. TSDB Writer Group    (writes to time-series database)
  2. Alert Evaluator Group (feeds real-time alert rules)
  3. Stream Aggregator     (computes pre-aggregated rollups)
```

**Why Kafka here (not direct writes)?**

```
1. Decouples ingestion from storage (absorb bursts)
2. Enables multiple consumers (TSDB + alerts + aggregation)
3. Provides replay capability (reprocess on storage failures)
4. Handles back-pressure naturally (consumer lag)
5. Allows independent scaling of write and read paths
```

### 2.4 Time-Series Database (TSDB)

The heart of the system. This is where all metrics data lives.

```mermaid
graph TB
    subgraph TSDBNode["TSDB Node"]
        WAL[Write-Ahead Log<br/>Sequential Append]
        HEAD[Head Block<br/>In-Memory<br/>Last 2 hours]
        B1[Block T-4h to T-2h<br/>Immutable, Compressed]
        B2[Block T-6h to T-4h<br/>Immutable, Compressed]
        B3[Block T-24h to T-6h<br/>Immutable, Compressed]
        COMP[Compactor<br/>Merge + Compress]
    end

    subgraph BlockDetail["Block Internal Structure"]
        CHK[Chunks<br/>Compressed Samples<br/>per Series]
        IDX2[Index<br/>Series -> Chunk offsets]
        META[Meta.json<br/>Block metadata<br/>time range, stats]
        TOMB[Tombstones<br/>Deleted series markers]
    end

    WAL --> HEAD
    HEAD -->|Cut every 2 hrs| B1
    B1 --> COMP
    B2 --> COMP
    COMP --> B3

    B1 --> CHK
    B1 --> IDX2
    B1 --> META
    B1 --> TOMB
```

**Storage Layout (Prometheus TSDB-inspired):**

```
data/
  wal/
    000001          # Write-ahead log segment
    000002
  head/             # In-memory block (active writes)
  01BKGV7J...BQ/   # Immutable block (2-hour window)
    chunks/
      000001        # Chunk files (compressed samples)
    index           # Inverted index for this block
    meta.json       # Block metadata (min/max time, num series)
    tombstones      # Deletion markers
  01BKGTZQ...KR/   # Another immutable block
    ...
```

**Write Path (detailed):**

```
1. Sample arrives: {series_id, timestamp, value}
2. Append to WAL (sequential disk write, very fast)
3. Write to Head block's in-memory map:
     head.series[series_id].append(timestamp, value)
4. When Head block reaches time boundary (every 2 hours):
   a. Freeze current Head -> becomes immutable block
   b. Compress all series chunks using Gorilla encoding
   c. Build block-level index
   d. Write block to disk
   e. Truncate WAL
5. Background compaction merges adjacent blocks:
   - 2h + 2h -> 4h block
   - 4h + 4h -> 8h block
   - Reduces block count, improves query performance
```

### 2.5 Data Compression -- Gorilla Encoding

Time-series data compresses extremely well because consecutive values are
highly correlated. Facebook's Gorilla paper introduced two key techniques:

```mermaid
graph LR
    subgraph Timestamps["Timestamp Compression<br/>(Delta-of-Delta)"]
        T1["t0 = 1712505600<br/>(full 64 bits)"]
        T2["delta1 = 10<br/>(t1 - t0)"]
        T3["dod1 = 0<br/>(delta2 - delta1)<br/>1 bit: '0'"]
        T4["dod2 = 0<br/>1 bit: '0'"]
        T5["dod3 = 1<br/>(jitter)<br/>~10 bits"]
    end

    subgraph Values["Value Compression<br/>(XOR Encoding)"]
        V1["v0 = 72.5<br/>(full 64 bits)"]
        V2["xor1 = v1 XOR v0<br/>= 0x000...small"]
        V3["If xor == 0: write '0' bit<br/>(same value, 1 bit)"]
        V4["If xor != 0: encode<br/>leading zeros + meaningful bits<br/>~15-25 bits"]
    end
```

**Compression details:**

```
Timestamp Encoding (Delta-of-Delta):
  - First timestamp: stored in full (64 bits)
  - Second timestamp: store delta (t1 - t0), e.g., 10 seconds
  - Subsequent: store delta-of-delta (current_delta - previous_delta)
  - For regular intervals, delta-of-delta is usually 0 -> encoded as single '0' bit
  - Typical: 1-2 bits per timestamp

Value Encoding (XOR):
  - First value: stored in full (64 bits)
  - Subsequent: XOR with previous value
  - If XOR is 0 (same value): encode as single '0' bit
  - If XOR non-zero, check if leading/trailing zeros match previous XOR:
    - If same zero structure: encode only meaningful bits
    - Otherwise: encode leading zeros count + bit length + meaningful bits
  - Typical: 1-15 bits per value depending on rate of change

Result:
  - CPU usage (slowly changing): ~2-4 bytes per (timestamp, value) pair
  - Request counters (monotonically increasing): ~3-5 bytes per pair
  - Random/high-entropy values: ~8-12 bytes per pair (less compressible)
  - Average across all metric types: ~3 bytes per pair (vs. 16 bytes raw)
```

### 2.6 Inverted Index for Multi-Dimensional Queries

To efficiently query metrics by label (e.g., "all CPU metrics where region=us-east-1"),
we maintain an inverted index:

```mermaid
graph LR
    subgraph Query["Query: cpu_usage{region='us-east-1', host=~'web-.*'}"]
        Q1["Posting list for<br/>__name__=cpu_usage<br/>[1,2,3,5,7,8,12,15,...]"]
        Q2["Posting list for<br/>region=us-east-1<br/>[1,2,3,4,5,6,7,8,...]"]
        Q3["Posting list for<br/>host=~web-.*<br/>[1,3,5,7,9,11,13,15,...]"]
    end

    INTERSECT["Set Intersection<br/>(sorted merge)"]
    RESULT["Matching series:<br/>[1,3,5,7,15,...]"]

    Q1 --> INTERSECT
    Q2 --> INTERSECT
    Q3 --> INTERSECT
    INTERSECT --> RESULT
```

**Index structure:**

```
Inverted Index:
  label_pair("__name__", "cpu_usage")   -> [series_id_1, series_id_2, ...]
  label_pair("region", "us-east-1")     -> [series_id_1, series_id_3, ...]
  label_pair("host", "web-server-042")  -> [series_id_5, series_id_8, ...]

Forward Index:
  series_id_1 -> {__name__: "cpu_usage", region: "us-east-1", host: "web-001"}
  series_id_2 -> {__name__: "cpu_usage", region: "us-west-2", host: "web-002"}

Query Resolution:
  1. Parse query to extract label matchers
  2. Look up posting lists for each matcher
  3. Intersect posting lists (sorted merge, very fast)
  4. For regex matchers: scan label values, collect matching posting lists, union
  5. Result: set of series IDs that match all query conditions
```

### 2.7 Query Engine

```mermaid
flowchart TB
    CLIENT[Dashboard / API Client] -->|PromQL Query| PARSE[Query Parser<br/>AST Generation]
    PARSE --> PLAN[Query Planner<br/>Optimize Execution]
    PLAN --> RESOLVE[Series Resolution<br/>Inverted Index Lookup]
    RESOLVE --> TIER{Select Storage Tier<br/>based on time range}
    TIER -->|Recent 2h| HEAD[Head Block<br/>In-Memory]
    TIER -->|2h - 30d| DISK[On-Disk Blocks<br/>Local SSD]
    TIER -->|30d+| OBJ[Object Storage<br/>Downsampled Data]

    HEAD --> DECOMP[Decompress<br/>Chunks]
    DISK --> DECOMP
    OBJ --> DECOMP

    DECOMP --> EVAL[Evaluate Functions<br/>rate, avg, histogram_quantile]
    EVAL --> AGG[Aggregate<br/>sum by, avg by, group by]
    AGG --> RESULT[Return Result<br/>Matrix / Vector / Scalar]
    RESULT --> CACHE[Cache Result<br/>if cacheable]
    CACHE --> CLIENT
```

**Query execution flow for a PromQL query:**

```
Query: avg(rate(http_request_duration_seconds{service="payment-api"}[5m])) by (endpoint)

Step 1 - Parse:
  AST: Aggregation(avg, by=[endpoint],
         Function(rate, range=5m,
           Selector(name="http_request_duration_seconds",
                    matchers=[service="payment-api"])))

Step 2 - Plan:
  - Time range: last 6 hours, step 1 minute
  - Need 5 minutes of lookback at each step
  - Identify which blocks overlap the time range

Step 3 - Resolve:
  - Inverted index: __name__="http_request_duration_seconds" AND service="payment-api"
  - Result: 50 matching series (one per endpoint x method combination)

Step 4 - Fetch:
  - For each matching series, fetch samples from [start-5m, end]
  - Decompress chunks, filter to needed time range

Step 5 - Evaluate:
  - Apply rate() function: compute per-second increase over 5m windows
  - Apply avg() aggregation: group by endpoint label, average across series

Step 6 - Return:
  - Result: one time series per unique endpoint value
  - Each contains 360 data points (6 hours at 1-minute step)
```

**Query optimizations:**

```
1. Step-aligned caching: Cache query results aligned to step boundaries
2. Block-level pruning: Skip blocks whose time range doesn't overlap the query
3. Chunk-level pruning: Skip chunks based on min/max time metadata
4. Parallel fetch: Query multiple blocks/nodes in parallel, merge results
5. Partial response: Return data from available nodes even if some are slow
6. Subquery sharing: Multiple dashboard panels querying same base metric share work
```

### 2.8 Alerting Engine

```mermaid
flowchart TB
    subgraph RuleConfig["Alert Rule Configuration"]
        RULES[(Alert Rules Store<br/>PostgreSQL)]
        SYNC[Rule Syncer<br/>Poll every 30s]
    end

    subgraph Evaluation["Alert Evaluation Pipeline"]
        SCHED[Evaluation Scheduler<br/>Every 15-60 seconds]
        EVAL1[Evaluator Worker 1]
        EVAL2[Evaluator Worker 2]
        EVAL3[Evaluator Worker 3]
        SM[State Machine<br/>per Alert Instance]
    end

    subgraph Notification["Notification Pipeline"]
        GROUP[Alert Grouper<br/>Batch by team/service]
        DEDUP[Deduplicator<br/>Suppress repeats]
        ROUTE[Router<br/>Match routing rules]
        SLACK[Slack]
        PD[PagerDuty]
        EMAIL[Email]
        WEBHOOK[Webhook]
    end

    RULES --> SYNC
    SYNC --> SCHED
    SCHED --> EVAL1
    SCHED --> EVAL2
    SCHED --> EVAL3

    EVAL1 -->|Query TSDB| SM
    EVAL2 -->|Query TSDB| SM
    EVAL3 -->|Query TSDB| SM

    SM --> GROUP
    GROUP --> DEDUP
    DEDUP --> ROUTE
    ROUTE --> SLACK
    ROUTE --> PD
    ROUTE --> EMAIL
    ROUTE --> WEBHOOK
```

**Alert state machine:**

```mermaid
stateDiagram-v2
    [*] --> Inactive: Rule created

    Inactive --> Pending: Condition becomes TRUE
    Pending --> Inactive: Condition becomes FALSE<br/>(before 'for' duration)
    Pending --> Firing: Condition TRUE for<br/>'for' duration
    Firing --> Resolved: Condition becomes FALSE
    Resolved --> Inactive: After resolve notification sent
    Resolved --> Firing: Condition becomes TRUE again
```

**Alert evaluation details:**

```
For each alert rule (evaluated every 15-60 seconds):

1. Execute the PromQL expression against current data
2. For each resulting series:
   a. If value satisfies threshold:
      - If state is Inactive -> move to Pending, record active_at
      - If state is Pending and (now - active_at) >= for_duration -> move to Firing
      - If state is Firing -> remain Firing (do nothing)
   b. If value does NOT satisfy threshold:
      - If state is Pending -> move to Inactive
      - If state is Firing -> move to Resolved, send resolution notification
      - If state is Inactive -> remain Inactive (do nothing)

3. For newly Firing alerts:
   - Group by configured grouping labels (e.g., team, service)
   - Wait group_wait duration (e.g., 30s) to batch multiple alerts
   - Route to configured notification channels
   - Start repeat_interval timer for re-notification

4. For Resolved alerts:
   - Send resolution notification to same channels
   - Clear state after configurable grace period
```

### 2.9 Dashboard Service

```mermaid
flowchart LR
    subgraph Browser["User Browser"]
        UI[Dashboard UI<br/>React/Grafana]
    end

    subgraph Backend["Dashboard Backend"]
        DAPI[Dashboard API<br/>CRUD Operations]
        DB[(Dashboard Store<br/>PostgreSQL)]
        RENDER[Server-Side<br/>Pre-computation]
    end

    subgraph QueryLayer["Query Layer"]
        QE2[Query Engine]
        CACHE2[Result Cache<br/>Redis]
    end

    UI -->|Load dashboard| DAPI
    DAPI --> DB
    UI -->|Panel queries| QE2
    QE2 --> CACHE2
    RENDER -->|Pre-execute popular dashboards| QE2
    RENDER --> CACHE2
```

**Dashboard features:**

```
1. Template Variables
   - Dynamic drop-downs populated from label values
   - Example: $region variable -> query all unique values of "region" label
   - All panels re-execute with selected variable value

2. Auto-Refresh
   - Configurable interval (10s, 30s, 1m, 5m)
   - Only fetch new data since last refresh (incremental)

3. Time Range Selection
   - Relative (last 1h, 6h, 24h, 7d, 30d)
   - Absolute (pick start/end datetime)
   - Automatic granularity selection based on range:
     - <6 hours: raw data (10s resolution)
     - 6h-24h: 1-minute downsampled
     - 1d-7d: 5-minute downsampled
     - 7d-30d: 1-hour downsampled
     - >30d: 1-day downsampled

4. Panel Types
   - Time series graph (line, area, bar)
   - Stat panel (single number with sparkline)
   - Table (tabular data)
   - Heatmap (distribution over time)
   - Gauge (current value against thresholds)

5. Annotations
   - Overlay deployment markers, incidents, events on graphs
   - Query-based annotations (e.g., show all deploys)
```

---

## 3. Data Flow: End-to-End Write Path

```mermaid
sequenceDiagram
    participant Agent as Monitoring Agent
    participant GW as Ingestion Gateway
    participant PP as Pre-Processor
    participant K as Kafka
    participant TSDB as TSDB Writer
    participant WAL as Write-Ahead Log
    participant Head as Head Block (Memory)
    participant AE as Alert Evaluator

    Agent->>Agent: Collect metrics (10s interval)
    Agent->>Agent: Buffer & batch (100-1000 samples)
    Agent->>GW: POST /ingest (batch of samples)
    GW->>GW: Authenticate (API key check)
    GW->>PP: Forward validated batch
    PP->>PP: Validate schema
    PP->>PP: Enrich labels
    PP->>PP: Check cardinality
    PP->>PP: Compute series_id hash
    PP->>K: Produce to metrics-raw topic
    K-->>TSDB: Consumer reads batch
    TSDB->>WAL: Append to WAL
    WAL-->>TSDB: ACK
    TSDB->>Head: Write to in-memory block
    TSDB-->>K: Commit consumer offset
    K-->>AE: Alert consumer reads same data
    AE->>AE: Evaluate matching rules
```

---

## 4. Data Flow: End-to-End Read/Query Path

```mermaid
sequenceDiagram
    participant User as Dashboard User
    participant Dash as Dashboard Service
    participant QE as Query Engine
    participant Cache as Result Cache
    participant IDX as Inverted Index
    participant Head as Head Block
    participant Disk as Disk Blocks
    participant ObjS as Object Storage

    User->>Dash: Load dashboard (5 panels)
    Dash->>QE: Execute 5 queries in parallel

    QE->>Cache: Check cache (query fingerprint + time range)
    Cache-->>QE: Cache MISS

    QE->>IDX: Resolve series IDs for label matchers
    IDX-->>QE: Return matching series IDs [1, 5, 12, 33, ...]

    par Fetch from multiple tiers
        QE->>Head: Fetch recent samples (last 2h)
        QE->>Disk: Fetch from on-disk blocks
        QE->>ObjS: Fetch from object storage (if needed)
    end

    Head-->>QE: Samples from memory
    Disk-->>QE: Decompressed samples from SSD
    ObjS-->>QE: Downsampled samples from S3

    QE->>QE: Merge streams by timestamp
    QE->>QE: Apply functions (rate, avg, percentile)
    QE->>QE: Apply aggregations (sum by, group by)

    QE->>Cache: Store result (TTL: step-aligned)
    QE-->>Dash: Return result matrix
    Dash-->>User: Render charts
```

---

## 5. Data Flow: Alert Evaluation & Notification

```mermaid
sequenceDiagram
    participant Sched as Alert Scheduler
    participant Eval as Alert Evaluator
    participant TSDB as TSDB (Query)
    participant SM as State Machine
    participant Group as Alert Grouper
    participant PD as PagerDuty

    loop Every 15 seconds
        Sched->>Sched: Select next batch of rules
        Sched->>Eval: Dispatch rules to workers

        Eval->>TSDB: Execute rule expression<br/>"rate(errors[5m]) > 0.05"
        TSDB-->>Eval: Return: [{endpoint:/pay, val:0.08}, {endpoint:/list, val:0.01}]

        Eval->>SM: Update state for endpoint=/pay (val 0.08 > 0.05)
        SM->>SM: State: Inactive -> Pending (active_at = now)

        Note over SM: Next evaluation (15s later)
        Eval->>TSDB: Re-execute same expression
        TSDB-->>Eval: Return: [{endpoint:/pay, val:0.07}]
        Eval->>SM: Still above threshold

        Note over SM: After 'for: 2m' duration
        SM->>SM: State: Pending -> Firing
        SM->>Group: New firing alert
        Group->>Group: Wait 30s to batch related alerts
        Group->>PD: Send grouped notification
        PD-->>Group: ACK
    end
```

---

## 6. Pre-Aggregation & Downsampling Pipeline

```mermaid
flowchart TB
    subgraph RealTime["Real-Time Ingestion"]
        RAW[Raw Samples<br/>10-second resolution]
    end

    subgraph StreamAgg["Stream Aggregation (at ingest time)"]
        SA1["Compute per series per minute:<br/>min, max, sum, count, avg"]
        SA2["Compute p50, p90, p99<br/>using t-digest / DDSketch"]
    end

    subgraph StorageTiers["Storage Tiers"]
        T1["Tier 1: Raw<br/>10s granularity<br/>0-30 days"]
        T2["Tier 2: 1-min Rollups<br/>1-minute granularity<br/>30-90 days"]
        T3["Tier 3: 1-hour Rollups<br/>1-hour granularity<br/>90-365 days"]
        T4["Tier 4: 1-day Rollups<br/>1-day granularity<br/>365+ days"]
    end

    subgraph Background["Background Downsampler"]
        DS1[Downsample Job<br/>Runs hourly]
        DS2[Compact + Upload<br/>to Object Storage]
    end

    RAW --> T1
    RAW --> SA1
    SA1 --> SA2
    SA2 --> T2

    T1 -->|After 30 days| DS1
    DS1 --> T3
    T3 -->|After 365 days| DS2
    DS2 --> T4

    style T1 fill:#1b5e20,stroke:#1b5e20,color:#fff
    style T2 fill:#2e7d32,stroke:#2e7d32,color:#fff
    style T3 fill:#388e3c,stroke:#388e3c,color:#fff
    style T4 fill:#43a047,stroke:#43a047,color:#fff
```

**Downsampling strategy:**

```
Each rollup stores multiple aggregates per window:

1-minute rollup of 10-second raw data:
  For each series, for each 1-minute window:
    - min(values)    # lowest value in the window
    - max(values)    # highest value in the window
    - sum(values)    # sum for computing averages
    - count(values)  # count for computing averages
    - avg(values)    # pre-computed average

  Why store all five?
    - avg alone loses information (can't compute max over downsampled data)
    - Storing min/max/sum/count allows any aggregation function to be
      computed correctly over the downsampled data

  Example:
    Raw (10s): [72.1, 73.5, 71.8, 74.2, 73.0, 72.9] (one minute)
    1-min rollup: {min: 71.8, max: 74.2, sum: 437.5, count: 6, avg: 72.9}

When a dashboard queries "max CPU over last 7 days":
  - Uses 1-minute rollups (not raw data)
  - Takes max of each rollup's max field
  - Result is mathematically identical to computing max over raw data
```

---

## 7. Distributed Topology

```mermaid
graph TB
    subgraph Region1["Region: us-east-1"]
        subgraph Ingest1["Ingestion Cluster"]
            IG1[Gateway 1]
            IG2[Gateway 2]
            IG3[Gateway 3]
        end

        subgraph TSDBCluster1["TSDB Cluster (Hash Ring)"]
            N1[Node 1<br/>Series 0-333K]
            N2[Node 2<br/>Series 333K-666K]
            N3[Node 3<br/>Series 666K-1M]
        end

        subgraph QueryCluster1["Query Cluster"]
            Q1[Query Frontend<br/>Dedup + Cache]
            QW1[Query Worker 1]
            QW2[Query Worker 2]
        end

        subgraph AlertCluster1["Alert Cluster"]
            AE1[Alert Evaluator 1<br/>Rules 1-5000]
            AE2[Alert Evaluator 2<br/>Rules 5001-10000]
        end

        KF1[Kafka Cluster<br/>64 partitions]
    end

    IG1 --> KF1
    IG2 --> KF1
    IG3 --> KF1

    KF1 --> N1
    KF1 --> N2
    KF1 --> N3

    KF1 --> AE1
    KF1 --> AE2

    Q1 --> QW1
    Q1 --> QW2
    QW1 --> N1
    QW1 --> N2
    QW1 --> N3
    QW2 --> N1
    QW2 --> N2
    QW2 --> N3
```

**Series distribution via consistent hashing:**

```
- Each TSDB node owns a range of the hash ring
- Series are assigned to nodes based on hash(series_id) % ring
- Replication: each series is written to 3 consecutive nodes on the ring
- On node failure: queries fan out to replicas, rebalancing redistributes ownership
- Adding a node: only a fraction of series migrate (consistent hashing property)
```

---

## 8. Technology Choices Summary

| Component | Technology Options | Our Choice | Rationale |
|-----------|-------------------|------------|-----------|
| Collection Agent | Telegraf, Prometheus node_exporter, Datadog Agent | Custom agent (Go) | Flexibility, both push+pull |
| Message Queue | Kafka, Pulsar, NATS | Kafka | Proven at scale, replay support |
| TSDB | Prometheus TSDB, InfluxDB, VictoriaMetrics, Thanos | Custom (Prometheus TSDB-based) | Best compression, open-source foundation |
| Inverted Index | In-memory (Prometheus), Cassandra | In-memory with WAL | Fast lookups, fits in RAM |
| Object Storage | S3, GCS, MinIO | S3 | Cheap, durable, infinite scale |
| Query Cache | Redis, Memcached | Redis | TTL support, cluster mode |
| Alert Rules Store | PostgreSQL, etcd | PostgreSQL | ACID, complex queries |
| Dashboard Store | PostgreSQL | PostgreSQL | Same as alert rules, simplicity |
| Notification Queue | Kafka, SQS, Redis Streams | Kafka (reuse existing) | Already deployed, reliable |
| Dashboard UI | Grafana, Custom React | Grafana (embedded) | Feature-rich, open-source |
