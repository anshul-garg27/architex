# Design a Metrics Monitoring & Alerting System -- Requirements & Estimation

## 1. Problem Statement

Design a scalable metrics monitoring and alerting system similar to Datadog, Prometheus,
or Grafana Cloud. The system must collect metrics from thousands of servers, store
time-series data efficiently, support flexible querying and visualization, and trigger
alerts when metrics breach defined thresholds. This is a foundational piece of
infrastructure that every modern engineering organization depends on for reliability
and observability.

---

## 2. Clarifying Questions to Ask the Interviewer

Before diving into design, establish scope by asking targeted questions:

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | How many servers/services are we collecting metrics from? | Determines ingestion throughput requirements |
| 2 | What is the expected metric cardinality (unique time series)? | High cardinality drives storage and indexing complexity |
| 3 | What granularity do we need (1s, 10s, 1min)? | Directly impacts write volume and storage costs |
| 4 | How long must raw data be retained vs. downsampled? | Drives retention policy and compaction strategy |
| 5 | Do we need push-based or pull-based collection, or both? | Architectural decision affecting agent design |
| 6 | What query patterns are most common (dashboards, ad-hoc, alerts)? | Shapes the query engine and caching strategy |
| 7 | How many concurrent dashboard users? | Determines read-path scaling needs |
| 8 | What alert latency is acceptable (seconds, minutes)? | Drives alert evaluation pipeline design |
| 9 | Do we need multi-tenancy (multiple teams/orgs)? | Adds isolation, quotas, and access control layers |
| 10 | What is the tolerance for data loss during ingestion? | Determines durability guarantees needed |

---

## 3. Functional Requirements

### 3.1 Core Features (Must-Have / P0)

```
FR-1: Metric Collection
  - Collect system metrics (CPU, memory, disk, network) from 10,000+ servers
  - Collect application metrics (request latency, error rates, queue depth)
  - Support both push-based and pull-based collection models
  - Accept metrics with arbitrary key-value tags/labels

FR-2: Time-Series Storage
  - Store metrics as time-series data (metric_name, tags, timestamp, value)
  - Retain raw data (1-second granularity) for 30 days
  - Support multi-dimensional data model (filter/group by any tag)

FR-3: Querying & Visualization
  - Support time-range queries with aggregation (avg, sum, min, max, percentiles)
  - Support group-by on any tag dimension
  - Provide a PromQL-like query language
  - Render time-series charts, heatmaps, and tables

FR-4: Alerting
  - Define alert rules based on metric thresholds or expressions
  - Support alert states: pending -> firing -> resolved
  - Route alerts to multiple channels (email, Slack, PagerDuty, webhook)
  - Support alert suppression, grouping, and de-duplication

FR-5: Dashboards
  - Create and share dashboards with multiple panels
  - Each panel executes a query and renders a visualization
  - Support template variables for dynamic filtering
```

### 3.2 Extended Features (Nice-to-Have / P1)

```
FR-6: Downsampling
  - Automatically downsample older data (1s -> 1min -> 1hr -> 1day)
  - Reduce storage costs while preserving queryable history

FR-7: Anomaly Detection
  - ML-based anomaly detection on metric streams
  - Auto-generate alerts for unexpected behavior

FR-8: SLO Monitoring
  - Define Service Level Objectives (e.g., 99.9% availability)
  - Multi-window burn-rate alerting for SLO breaches

FR-9: Metric Metadata & Discovery
  - Browse available metrics and their tags
  - Full-text search over metric names and label values

FR-10: Multi-Tenancy
  - Isolate metrics by team/organization
  - Per-tenant quotas and rate limiting
```

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Requirement | Target |
|------------|--------|
| Write throughput | 100K+ data points per second sustained |
| Write latency (ingestion) | < 500ms end-to-end from agent to durable storage |
| Query latency (recent data, <1hr window) | < 200ms at p99 |
| Query latency (historical, 7-day window) | < 2s at p99 |
| Alert evaluation latency | < 30 seconds from metric arrival to alert firing |
| Dashboard load time | < 3 seconds for a 20-panel dashboard |

### 4.2 Scalability

```
- Horizontally scalable ingestion path (add nodes to handle more write load)
- Horizontally scalable query path (add nodes to serve more dashboards)
- Linear storage scaling (add disks/nodes for more retention)
- Support growth from 10K to 100K+ servers without architecture changes
```

### 4.3 Availability & Durability

```
- Ingestion pipeline: 99.9% availability (brief gaps acceptable, agents buffer locally)
- Query/dashboard service: 99.95% availability
- Alert evaluation: 99.99% availability (missed alerts are critical)
- Data durability: 99.99% (some data loss at edges is acceptable)
- Replication factor: 3 for all stored data
```

### 4.4 Consistency

```
- Eventual consistency is acceptable for dashboards (seconds of lag OK)
- Alert evaluation must see data within 30 seconds of ingestion
- Out-of-order writes must be handled (agents may retry with old timestamps)
- Duplicate data points must be handled idempotently
```

### 4.5 Operational

```
- System must monitor itself (dogfooding)
- Graceful degradation under load (shed low-priority queries, keep alerts running)
- Rolling deployments with zero downtime
- Configuration changes (new alert rules) applied within 60 seconds
```

---

## 5. Capacity Estimation

### 5.1 Write Volume

```
Servers:                      10,000
Metrics per server:           100 (CPU, memory, disk, network, app-level)
Sample interval:              10 seconds
Samples per metric per day:   8,640 (86,400s / 10s)

Total unique time series:     10,000 servers x 100 metrics = 1,000,000 series

Data points per second:
  = 10,000 servers x 100 metrics / 10 seconds
  = 100,000 data points/second
  = 100K writes/sec

Data points per day:
  = 100,000/sec x 86,400 sec/day
  = 8.64 billion data points/day
```

### 5.2 Data Point Size

```
Each data point contains:
  - metric_name:   variable, but we use an ID reference (8 bytes)
  - tag set hash:  8 bytes (reference to pre-stored tag combination)
  - timestamp:     8 bytes (epoch milliseconds)
  - value:         8 bytes (float64)
  -----------------------------------------------
  Raw size per point:  ~32 bytes

With compression (Gorilla encoding):
  - Timestamps: delta-of-delta encoding -> ~2 bits/point average
  - Values: XOR encoding -> ~6 bits/point average for slowly changing metrics
  - Effective compressed size: ~2-4 bytes per data point
  - Compression ratio: ~8-16x

We will use 3 bytes/point as our estimate with compression.
```

### 5.3 Storage Estimation

```
--- Raw Data (30-day retention at original granularity) ---

Daily raw volume (compressed):
  = 8.64 billion points x 3 bytes
  = 25.92 GB/day

30-day raw storage:
  = 25.92 GB x 30
  = ~778 GB

With replication factor 3:
  = 778 GB x 3
  = ~2.3 TB for 30 days of raw data

--- Downsampled Data ---

1-minute rollups (for data 30-90 days old):
  = 1,000,000 series x 1 point/min x 60 days x 1440 min/day x 20 bytes/point
  = ~1.7 TB (uncompressed), ~200 GB compressed

1-hour rollups (for data 90-365 days old):
  = 1,000,000 series x 1 point/hr x 275 days x 24 hr/day x 20 bytes/point
  = ~132 GB (uncompressed), ~16 GB compressed

1-day rollups (for data > 1 year):
  = 1,000,000 series x 1 point/day x 365 days x 20 bytes/point
  = ~7.3 GB (uncompressed), ~1 GB compressed

--- Total Storage Summary ---

| Tier          | Retention | Granularity | Compressed Size | With Replication (3x) |
|---------------|-----------|-------------|-----------------|----------------------|
| Raw           | 30 days   | 10 seconds  | ~778 GB         | ~2.3 TB              |
| 1-min rollup  | 60 days   | 1 minute    | ~200 GB         | ~600 GB              |
| 1-hr rollup   | 275 days  | 1 hour      | ~16 GB          | ~48 GB               |
| 1-day rollup  | Forever   | 1 day       | ~1 GB           | ~3 GB                |
| **Total**     |           |             | **~995 GB**     | **~3 TB**            |
```

### 5.4 Metadata / Index Storage

```
Metric names:          ~5,000 unique names x 100 bytes avg = 500 KB
Label/tag pairs:       ~50,000 unique pairs x 200 bytes avg = 10 MB
Series index:          1,000,000 series x 256 bytes (name + sorted labels) = 256 MB
Inverted index:        (label_value -> series IDs) ~500 MB

Total metadata/index: ~1 GB (fits comfortably in memory)
```

### 5.5 Network Bandwidth

```
Ingestion bandwidth:
  = 100,000 points/sec x 32 bytes (uncompressed wire format, with batching overhead)
  = 3.2 MB/sec
  = ~25 Mbps

With batching and compression at the agent level:
  = ~5-10 Mbps sustained inbound

Dashboard/query bandwidth:
  - Average query returns 1,000-10,000 points
  - 100 concurrent dashboard users, refreshing every 30s
  - ~3,300 queries/sec at peak
  - ~50 Mbps outbound for query responses
```

### 5.6 Compute Estimation

```
--- Ingestion Path ---
Write nodes:       4-8 nodes (each handling ~15-25K points/sec)
CPU per node:      4-8 cores (compression, indexing)
Memory per node:   16-32 GB (write buffer, recent data cache)

--- Query Path ---
Query nodes:       4-6 nodes
CPU per node:      8-16 cores (aggregation, decompression)
Memory per node:   32-64 GB (block cache, query result caching)

--- Storage ---
TSDB nodes:        6-10 nodes (distributed time-series database)
Disk per node:     500 GB - 1 TB SSD
Memory per node:   32 GB (page cache, index)

--- Alert Evaluation ---
Alert evaluator:   2-3 nodes (dedicated, high-priority)
CPU per node:      4-8 cores
Memory per node:   16 GB
```

---

## 6. Summary of Key Numbers

```
+-------------------------------------+----------------------------+
| Metric                              | Value                      |
+-------------------------------------+----------------------------+
| Total unique time series            | 1,000,000                  |
| Write throughput                    | 100K data points/sec       |
| Daily data volume (compressed)      | ~26 GB                     |
| 30-day raw storage (with 3x repl.) | ~2.3 TB                    |
| Total storage (all tiers, 3x repl.)| ~3 TB                      |
| Ingestion bandwidth                 | ~10 Mbps                   |
| Query QPS (peak)                    | ~3,300/sec                 |
| Alert rules evaluated               | ~10,000 rules/min          |
| Metadata index size                 | ~1 GB (fits in memory)     |
+-------------------------------------+----------------------------+
```

---

## 7. API Design

### 7.1 Metric Ingestion API

```
POST /api/v1/metrics/ingest

Request Body (batch write):
{
  "metrics": [
    {
      "name": "http_request_duration_seconds",
      "tags": {
        "service": "payment-api",
        "method": "POST",
        "endpoint": "/charge",
        "region": "us-east-1",
        "instance": "i-abc123"
      },
      "timestamp": 1712505600000,
      "value": 0.234
    },
    {
      "name": "cpu_usage_percent",
      "tags": {
        "host": "web-server-042",
        "cpu": "0",
        "region": "us-east-1"
      },
      "timestamp": 1712505600000,
      "value": 72.5
    }
  ]
}

Response:
{
  "status": "accepted",
  "accepted": 2,
  "failed": 0
}

Headers:
  Content-Type: application/json
  Authorization: Bearer <api_key>
  X-Tenant-ID: <org_id>
```

### 7.2 Query API

```
POST /api/v1/query/range

Request Body:
{
  "query": "avg(rate(http_request_duration_seconds{service='payment-api'}[5m])) by (endpoint)",
  "start": "2025-04-01T00:00:00Z",
  "end": "2025-04-01T06:00:00Z",
  "step": "1m"
}

Response:
{
  "status": "success",
  "data": {
    "result_type": "matrix",
    "result": [
      {
        "labels": {"endpoint": "/charge"},
        "values": [
          [1712505600, 0.234],
          [1712505660, 0.241],
          ...
        ]
      },
      {
        "labels": {"endpoint": "/refund"},
        "values": [
          [1712505600, 0.189],
          ...
        ]
      }
    ]
  }
}
```

### 7.3 Alert Rule API

```
POST /api/v1/alerts/rules

Request Body:
{
  "name": "High Error Rate",
  "expression": "rate(http_errors_total{service='payment-api'}[5m]) > 0.05",
  "for": "2m",
  "severity": "critical",
  "labels": {
    "team": "payments",
    "environment": "production"
  },
  "annotations": {
    "summary": "Error rate above 5% for payment-api",
    "runbook_url": "https://wiki.internal/runbooks/payment-errors"
  },
  "notification_channels": ["pagerduty-payments", "slack-oncall"]
}

Response:
{
  "id": "rule-12345",
  "status": "active",
  "created_at": "2025-04-01T10:00:00Z"
}
```

### 7.4 Dashboard API

```
POST /api/v1/dashboards

Request Body:
{
  "title": "Payment Service Overview",
  "template_variables": [
    {"name": "region", "type": "label_values", "query": "region"}
  ],
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "query": "sum(rate(http_requests_total{service='payment-api', region='$region'}[5m])) by (endpoint)",
      "position": {"x": 0, "y": 0, "w": 12, "h": 8}
    },
    {
      "title": "P99 Latency",
      "type": "timeseries",
      "query": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service='payment-api'}[5m]))",
      "position": {"x": 0, "y": 8, "w": 12, "h": 8}
    }
  ]
}
```

---

## 8. Data Model

### 8.1 Time-Series Data Model (Multi-Dimensional)

```
A time series is uniquely identified by:
  metric_name + sorted set of label key-value pairs

Example:
  http_request_duration_seconds{service="payment-api", method="POST", endpoint="/charge"}

This creates a unique "series ID" (fingerprint) that maps to a stream of
(timestamp, value) pairs.

         metric_name                    labels/tags                     samples
  +--------------------------+  +---------------------------+  +-------------------+
  | http_request_duration_   |  | service=payment-api       |  | (t1, 0.234)       |
  | seconds                  |  | method=POST               |  | (t2, 0.241)       |
  |                          |  | endpoint=/charge          |  | (t3, 0.228)       |
  |                          |  | region=us-east-1          |  | (t4, 0.252)       |
  +--------------------------+  +---------------------------+  +-------------------+
```

### 8.2 Logical Schema

```
Series:
  series_id:    uint64        (hash of metric_name + sorted labels)
  metric_name:  string        ("cpu_usage_percent")
  labels:       map<str,str>  ({"host": "web-042", "cpu": "0"})

Sample:
  series_id:    uint64
  timestamp:    int64         (epoch milliseconds)
  value:        float64

Inverted Index:
  label_name:   string        ("service")
  label_value:  string        ("payment-api")
  series_ids:   []uint64      (postings list)

Alert Rule:
  rule_id:      string
  expression:   string        (PromQL expression)
  for_duration: duration      (how long condition must hold)
  severity:     enum          (info, warning, critical)
  channels:     []string      (notification channel IDs)

Alert State:
  rule_id:      string
  series_id:    uint64        (which series triggered)
  state:        enum          (inactive, pending, firing, resolved)
  active_at:    timestamp     (when condition first became true)
  fired_at:     timestamp     (when alert transitioned to firing)
  resolved_at:  timestamp     (when alert was resolved)
```

---

## 9. Key Constraints & Trade-offs to Highlight in Interview

```
1. Write-Heavy Workload
   - The system is ~95% writes, ~5% reads
   - Must optimize the write path above all else
   - LSM-tree based storage is ideal (write-optimized)

2. High Cardinality is the Enemy
   - Adding a "user_id" label to a metric can explode series count from
     1M to 100M+, breaking everything
   - Must enforce cardinality limits per metric

3. Compression is Critical
   - Without Gorilla-style compression, storage costs 8-16x more
   - Compression works best on sorted, contiguous time-series data

4. Alert Reliability vs. System Load
   - Alerts are the highest-priority workload
   - Must isolate alert evaluation from dashboard queries
   - Dedicated resources for alert path

5. Downsampling is Not Optional at Scale
   - Querying 30 days of 10-second data for a dashboard is too expensive
   - Pre-computed rollups make historical queries feasible

6. Push vs. Pull is a Deployment Decision
   - Pull (Prometheus-style): simpler, discoverable, but needs service discovery
   - Push (StatsD/Datadog-style): works behind NATs, better for serverless
   - Production systems support both
```

---

## 10. Interview Tip: Opening Statement

> "I'd like to design a metrics monitoring and alerting system that collects time-series
> data from 10,000 servers, stores it with efficient compression, supports flexible
> multi-dimensional queries, and evaluates alert rules in near-real-time. The key
> challenges are: handling 100K writes per second with time-series-optimized storage,
> supporting low-latency queries across varying time ranges through downsampling,
> and ensuring alert evaluation is both reliable and fast. Let me start by
> confirming the requirements..."
