# Design a Distributed Logging System (ELK/Splunk): Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Logging vs. Metrics: Critical Distinction](#2-logging-vs-metrics-critical-distinction)
- [3. Functional Requirements](#3-functional-requirements)
- [4. Non-Functional Requirements](#4-non-functional-requirements)
- [5. Out of Scope](#5-out-of-scope)
- [6. Back-of-Envelope Estimation](#6-back-of-envelope-estimation)
- [7. Log Format and Schema Design](#7-log-format-and-schema-design)
- [8. API Design](#8-api-design)
- [9. Data Model Overview](#9-data-model-overview)
- [10. Interview Tips](#10-interview-tips)

---

## 1. Problem Statement

Design a centralized, distributed logging system that collects log data from 10,000+
servers, provides full-text search, structured querying, real-time alerting on patterns,
and tiered retention (30 days hot, 1 year cold) -- all while ingesting 500K+ log
lines per second. Think ELK Stack (Elasticsearch + Logstash + Kibana), Splunk,
or Datadog Logs.

**Why Uber asks this question:**
- It tests high-throughput ingestion pipelines (500K lines/sec is harder than most request/response systems)
- It tests knowledge of text search and indexing (inverted indices, tokenization)
- It tests storage tiering and lifecycle management (hot/warm/cold architecture)
- It tests stream processing (parsing, enriching, filtering in real time)
- It tests data pipeline reliability (zero log loss even during spikes)
- It tests trade-offs between query speed, storage cost, and ingestion throughput

**Real-world context:**
- Uber generates billions of log lines daily across thousands of microservices
- During incidents, engineers must search across all services correlated by trace_id
- A logging system that falls behind during traffic spikes makes debugging impossible
  precisely when you need it most

---

## 2. Logging vs. Metrics: Critical Distinction

This is the FIRST thing you should clarify in the interview. They are fundamentally
different systems with different architectures.

```
+------------------+----------------------------------------+---------------------------------------+
| Dimension        | LOGS (This Problem)                    | METRICS (Prometheus/Datadog)          |
+------------------+----------------------------------------+---------------------------------------+
| Data Type        | Unstructured/semi-structured TEXT       | Numeric time-series values            |
|                  | "User 12345 failed login from 1.2.3.4" | cpu_usage{host="web-1"} = 87.3       |
+------------------+----------------------------------------+---------------------------------------+
| Volume           | Massive (250 MB/sec, 21.6 TB/day)      | Moderate (millions of series but      |
|                  |                                        | each point is tiny: timestamp+float)  |
+------------------+----------------------------------------+---------------------------------------+
| Query Pattern    | Full-text search, keyword lookup,      | Aggregation queries: avg, sum, rate,  |
|                  | regex matching, field extraction        | percentile over time ranges           |
+------------------+----------------------------------------+---------------------------------------+
| Storage Engine   | Inverted index (Elasticsearch/Lucene)  | Time-series DB (Prometheus, InfluxDB, |
|                  | or columnar (ClickHouse)               | TimescaleDB, Mimir)                   |
+------------------+----------------------------------------+---------------------------------------+
| Primary Use      | Debugging, incident investigation,     | Monitoring, alerting, dashboards,     |
|                  | audit trails, forensics                | capacity planning, SLOs               |
+------------------+----------------------------------------+---------------------------------------+
| Cardinality      | Unbounded (free-form text)             | Bounded (fixed label combinations)    |
|                  |                                        | High cardinality is dangerous         |
+------------------+----------------------------------------+---------------------------------------+
| Retention        | 30 days hot, 1 year cold archive       | Typically 15-90 days at full          |
|                  |                                        | resolution, then downsampled          |
+------------------+----------------------------------------+---------------------------------------+
| Examples         | ELK Stack, Splunk, Loki, Datadog Logs  | Prometheus, Grafana Mimir, Datadog    |
|                  |                                        | Metrics, VictoriaMetrics              |
+------------------+----------------------------------------+---------------------------------------+
```

**Key insight for the interview:** Logs and metrics are COMPLEMENTARY. A typical
incident workflow is: alert fires from metrics -> engineer searches logs to find
the root cause -> logs contain trace_ids that link to distributed traces.

---

## 3. Functional Requirements

### 3.1 Log Collection

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Collect from 10K+ servers** | Deploy lightweight agents on every server that tail log files and forward to the central system |
| FR-2 | **Multiple log sources** | Support application logs, system logs (syslog), container stdout/stderr, access logs, audit logs |
| FR-3 | **Structured and unstructured** | Accept both pre-structured JSON logs and raw unstructured text logs |
| FR-4 | **Agent-based collection** | Agents (Fluent Bit, Filebeat) run on each host, handle batching, compression, and retry |
| FR-5 | **Container/K8s native** | Collect logs from Kubernetes pods via DaemonSets, attach pod/namespace metadata automatically |

### 3.2 Log Processing

| # | Requirement | Description |
|---|-------------|-------------|
| FR-6 | **Parsing and structuring** | Parse unstructured text into structured fields (timestamp, level, service, message) |
| FR-7 | **Enrichment** | Add metadata: datacenter, cluster, pod name, deployment version, owner team |
| FR-8 | **Filtering** | Drop noise (health check logs, verbose DEBUG in production) before indexing |
| FR-9 | **Sampling** | Sample high-volume low-value logs (e.g., keep 1% of DEBUG, 100% of ERROR) |
| FR-10 | **Multi-line handling** | Reassemble stack traces and multi-line log entries into single events |

### 3.3 Storage and Retention

| # | Requirement | Description |
|---|-------------|-------------|
| FR-11 | **Hot storage (30 days)** | Recent logs fully indexed for fast full-text search and structured queries |
| FR-12 | **Cold storage (1 year)** | Older logs archived to cheap object storage, queryable but with higher latency |
| FR-13 | **Retention policies** | Automated lifecycle: hot -> warm -> cold -> delete based on age |
| FR-14 | **Compliance retention** | Certain log types (audit, security) may need longer retention per regulation |

### 3.4 Search and Query

| # | Requirement | Description |
|---|-------------|-------------|
| FR-15 | **Full-text search** | Search for any keyword or phrase across all logs: `"NullPointerException"` |
| FR-16 | **Structured queries** | Filter by fields: `service:payment-api AND level:ERROR AND status_code:500` |
| FR-17 | **Time-range queries** | All queries scoped to a time range (last 15 minutes, last 24 hours, custom) |
| FR-18 | **Trace correlation** | Search by trace_id to see all logs across all services for a single request |
| FR-19 | **Aggregations** | Count errors by service, histogram of response times, top-N error messages |
| FR-20 | **Log tailing (live)** | Real-time tail of logs for a specific service, like `tail -f` but centralized |

### 3.5 Alerting

| # | Requirement | Description |
|---|-------------|-------------|
| FR-21 | **Pattern-based alerts** | "Alert if ERROR count > 100 in 5 minutes for service=payment-api" |
| FR-22 | **Keyword alerts** | "Alert if any log contains 'OutOfMemoryError' in production" |
| FR-23 | **Anomaly detection** | Detect unusual spikes in error rate or log volume compared to baseline |
| FR-24 | **Alert routing** | Route alerts to PagerDuty, Slack, email based on severity and service owner |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Ingestion throughput** | 500K lines/sec sustained, 2M/sec burst | Normal traffic plus 4x headroom for incident-driven log spikes |
| **Ingestion latency** | Log written -> searchable in < 30 seconds | Engineers need near-real-time during incidents |
| **Search latency (hot)** | < 3 seconds for 24-hour queries, < 10s for 7-day | Interactive debugging requires fast iteration |
| **Search latency (cold)** | < 5 minutes for cold storage queries | Acceptable for historical investigation |
| **Live tail latency** | < 5 seconds from log emission to display | Real-time debugging workflow |

### 4.2 Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Availability** | 99.9% for ingestion, 99.5% for search | Losing ingestion means losing data forever; search can briefly degrade |
| **Durability** | Zero log loss for ERROR and above | Cannot lose critical debug data |
| **At-least-once delivery** | Tolerate duplicates, not data loss | Dedup at query time is acceptable; losing logs is not |
| **Backpressure handling** | Buffer locally up to 1 hour during outages | Agents must not crash or drop data if backend is temporarily down |
| **Graceful degradation** | Drop DEBUG before ERROR under load | Prioritize high-severity logs when pipeline is saturated |

### 4.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Horizontal scaling** | Add nodes without downtime | Cluster must grow as fleet grows |
| **Multi-tenancy** | Isolate by service/team with quotas | Prevent one noisy service from impacting others |
| **Elastic burst** | Handle 4x normal volume during incidents | Error storms during outages produce log surges |

### 4.4 Operational

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Self-monitoring** | Logging system monitors itself via separate pipeline | Cannot use the system to debug itself if it is down |
| **Schema evolution** | Handle new fields without reindexing | Services add new log fields constantly |
| **Access control** | RBAC per team/service | Security logs should not be readable by all engineers |

---

## 5. Out of Scope

| Feature | Why Excluded |
|---------|-------------|
| Distributed tracing | Separate system (Jaeger/Zipkin). Logs link to traces via trace_id but tracing is a different design |
| Metrics monitoring | Prometheus/Grafana Mimir. Different data model, different storage engine, different query patterns |
| APM (Application Performance Monitoring) | Combines metrics + traces + profiling. Logging is one input but APM is its own system |
| Log-based analytics/BI | Logs can feed analytics pipelines, but BI dashboards are a different product |
| SIEM (Security Information and Event Management) | Security-focused log analysis with threat detection is specialized (e.g., Splunk ES, Elastic Security) |

---

## 6. Back-of-Envelope Estimation

### 6.1 Ingestion Volume

```
Servers:              10,000 servers
Avg logs per server:  50 lines/sec (mix of application + system logs)
Total ingestion:      10,000 x 50 = 500,000 lines/sec

Average log line size: 500 bytes (JSON structured log with metadata)
  - Timestamp:    30 bytes
  - Level:        5 bytes
  - Service name: 30 bytes
  - Trace ID:     36 bytes (UUID)
  - Message:      200 bytes
  - Metadata:     199 bytes (host, pod, namespace, region, version, etc.)

Raw throughput:       500,000 x 500 bytes = 250 MB/sec
                      = 15 GB/min
                      = 900 GB/hour
                      = 21.6 TB/day
                      = 648 TB/month
```

### 6.2 Storage Estimation

```
HOT STORAGE (30 days, Elasticsearch):
  Raw data:           21.6 TB/day x 30 days = 648 TB
  Elasticsearch overhead: ~1.5x for inverted index + doc values + replicas
  With 1 replica:     648 TB x 1.5 x 2 = 1,944 TB ~ 2 PB
  
  NOTE: With compression (LZ4), effective ratio ~2:1
  Compressed:         ~1 PB of actual disk for 30-day hot window

WARM STORAGE (30-90 days, reduced replicas):
  60 additional days:  21.6 TB/day x 60 = 1,296 TB raw
  Warm nodes (1 replica, force-merged): ~1 PB

COLD STORAGE (90 days - 1 year, S3/GCS):
  275 additional days: 21.6 TB/day x 275 = 5,940 TB raw
  Compressed to S3 (gzip ~5:1): ~1.2 PB in object storage
  
TOTAL STORAGE:
  Hot (ES):    ~1 PB
  Warm (ES):   ~1 PB  
  Cold (S3):   ~1.2 PB
  Grand total: ~3.2 PB across all tiers
```

### 6.3 Elasticsearch Cluster Sizing

```
Assumption: Each ES data node has 10 TB usable disk

HOT tier:
  1 PB / 10 TB per node = 100 hot data nodes
  (These need SSDs, high CPU for indexing, lots of RAM for caching)

WARM tier:
  1 PB / 10 TB per node = 100 warm data nodes
  (Cheaper disks, less CPU, moderate RAM)

Other nodes:
  Master nodes:         3 dedicated (for cluster stability)
  Coordinating nodes:   10-20 (for search query routing)
  Ingest nodes:         10-20 (for pipeline processing)

Total ES cluster:      ~230-240 nodes
```

### 6.4 Kafka Sizing

```
Ingestion:           250 MB/sec raw
Retention:           72 hours (buffer for consumer lag and replays)

Kafka storage:       250 MB/sec x 3 days x 86,400 sec/day = ~65 TB
With replication (3x): ~195 TB

Kafka brokers:       20-30 brokers (each handling ~10 MB/sec write throughput)
Partitions:          500-1000 partitions for the main log topic
                     (parallelism = number of consumer instances)
```

### 6.5 Network Bandwidth

```
Ingestion:           250 MB/sec = 2 Gbps inbound
  + Kafka replication: 500 MB/sec internal = 4 Gbps
  + ES indexing (with replicas): 500 MB/sec = 4 Gbps
Total cluster bandwidth: ~10 Gbps sustained

Peak (4x burst):     ~40 Gbps
Each server needs at least 10 Gbps NIC, top-of-rack switches: 100 Gbps
```

### 6.6 Summary Table

```
+----------------------------+----------------------------+
| Parameter                  | Value                      |
+----------------------------+----------------------------+
| Source servers              | 10,000                     |
| Log lines per second       | 500,000                    |
| Average line size           | 500 bytes                  |
| Raw ingestion rate          | 250 MB/sec                 |
| Daily raw volume            | 21.6 TB                    |
| Hot storage (30d)           | ~1 PB (Elasticsearch)      |
| Warm storage (30-90d)       | ~1 PB (Elasticsearch)      |
| Cold storage (90d-1yr)      | ~1.2 PB (S3/GCS)          |
| ES hot data nodes           | ~100                       |
| ES warm data nodes          | ~100                       |
| ES total cluster            | ~230-240 nodes             |
| Kafka brokers               | 20-30                      |
| Kafka partitions            | 500-1000                   |
| Network bandwidth           | 10 Gbps sustained         |
+----------------------------+----------------------------+
```

---

## 7. Log Format and Schema Design

### 7.1 Structured JSON Log Format (Recommended)

This is what applications SHOULD emit. The logging system should also parse
unstructured logs into this format.

```json
{
  "timestamp": "2025-03-15T14:23:45.123456Z",
  "level": "ERROR",
  "service": "payment-api",
  "instance": "payment-api-7d4f8b6c9-xk2m4",
  "host": "ip-10-0-42-17.ec2.internal",
  "region": "us-east-1",
  "az": "us-east-1a",
  "environment": "production",
  "version": "v2.34.1",
  "trace_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "span_id": "1234567890abcdef",
  "request_id": "req-98765",
  "logger": "com.uber.payment.ChargeProcessor",
  "message": "Failed to charge customer card: insufficient funds",
  "error": {
    "type": "PaymentDeclinedException",
    "message": "Card declined: insufficient funds",
    "stack_trace": "com.uber.payment.PaymentDeclinedException: Card declined\n\tat com.uber.payment.ChargeProcessor.charge(ChargeProcessor.java:142)\n\tat ..."
  },
  "context": {
    "customer_id": "cust_12345",
    "payment_method": "card_****4242",
    "amount_cents": 2500,
    "currency": "USD",
    "retry_attempt": 2
  },
  "http": {
    "method": "POST",
    "path": "/api/v1/charges",
    "status_code": 402,
    "duration_ms": 345
  }
}
```

### 7.2 Field Categories

```
+-------------------+----------------------------------+-------------------------------+
| Category          | Fields                           | Purpose                       |
+-------------------+----------------------------------+-------------------------------+
| Temporal          | timestamp                        | When it happened              |
+-------------------+----------------------------------+-------------------------------+
| Severity          | level (TRACE, DEBUG, INFO,       | Filter by importance          |
|                   | WARN, ERROR, FATAL)              |                               |
+-------------------+----------------------------------+-------------------------------+
| Identity          | service, instance, host,         | Where it came from            |
|                   | region, az, environment          |                               |
+-------------------+----------------------------------+-------------------------------+
| Tracing           | trace_id, span_id, request_id    | Correlate across services     |
+-------------------+----------------------------------+-------------------------------+
| Code              | logger, function, file, line     | Where in source code          |
+-------------------+----------------------------------+-------------------------------+
| Message           | message                          | Human-readable description    |
+-------------------+----------------------------------+-------------------------------+
| Error             | error.type, error.message,       | Exception details             |
|                   | error.stack_trace                |                               |
+-------------------+----------------------------------+-------------------------------+
| Context           | Varies per service               | Business-specific data        |
+-------------------+----------------------------------+-------------------------------+
| HTTP (optional)   | method, path, status, duration   | Request context               |
+-------------------+----------------------------------+-------------------------------+
```

### 7.3 Handling Unstructured Logs

Not all applications emit structured JSON. Legacy apps, third-party software, and
system logs produce unstructured text. The pipeline must parse these.

```
UNSTRUCTURED INPUT (nginx access log):
  10.0.42.17 - - [15/Mar/2025:14:23:45 +0000] "GET /api/v1/rides/123 HTTP/1.1" 200 1234 0.045

PARSED OUTPUT (structured JSON):
  {
    "timestamp": "2025-03-15T14:23:45Z",
    "level": "INFO",
    "service": "nginx-proxy",
    "source_type": "access_log",
    "client_ip": "10.0.42.17",
    "http": {
      "method": "GET",
      "path": "/api/v1/rides/123",
      "protocol": "HTTP/1.1",
      "status_code": 200,
      "body_bytes": 1234,
      "duration_sec": 0.045
    }
  }

PARSING METHODS:
  1. Grok patterns (regex with named captures) -- Logstash/Fluent Bit style
  2. JSON parsing (if already JSON)
  3. Key-value parsing (key=value pairs)
  4. CSV parsing (for structured text like access logs)
  5. Multi-line rules (stack traces: "starts with whitespace = continuation")
```

---

## 8. API Design

### 8.1 Log Ingestion API

```
POST /api/v1/logs/ingest
Content-Type: application/x-ndjson

{"timestamp":"2025-03-15T14:23:45.123Z","level":"ERROR","service":"payment-api","message":"..."}
{"timestamp":"2025-03-15T14:23:45.124Z","level":"INFO","service":"ride-api","message":"..."}
{"timestamp":"2025-03-15T14:23:45.125Z","level":"WARN","service":"matching-api","message":"..."}

Response: 202 Accepted
{
  "accepted": 3,
  "failed": 0
}

Notes:
  - NDJSON (newline-delimited JSON) for streaming efficiency
  - 202 Accepted (async processing -- not yet searchable)
  - Batch up to 5MB or 1000 lines per request
  - Authentication via API key or mTLS
```

### 8.2 Search API

```
POST /api/v1/logs/search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "NullPointerException" } },
        { "term": { "level": "ERROR" } },
        { "term": { "service": "payment-api" } }
      ],
      "filter": [
        { "range": { "timestamp": { "gte": "2025-03-15T14:00:00Z", "lte": "2025-03-15T15:00:00Z" } } }
      ]
    }
  },
  "sort": [{ "timestamp": "desc" }],
  "size": 100,
  "from": 0
}

Response: 200 OK
{
  "total": 1247,
  "took_ms": 342,
  "hits": [
    {
      "timestamp": "2025-03-15T14:58:23.456Z",
      "level": "ERROR",
      "service": "payment-api",
      "message": "NullPointerException in ChargeProcessor.charge()",
      "trace_id": "abc-123-def",
      ...
    },
    ...
  ]
}
```

### 8.3 Aggregation API

```
POST /api/v1/logs/aggregate
{
  "time_range": { "gte": "now-1h", "lte": "now" },
  "group_by": ["service", "level"],
  "metric": "count",
  "interval": "5m"
}

Response: 200 OK
{
  "buckets": [
    { "service": "payment-api", "level": "ERROR", "interval": "14:00-14:05", "count": 42 },
    { "service": "payment-api", "level": "ERROR", "interval": "14:05-14:10", "count": 187 },
    ...
  ]
}
```

### 8.4 Alert Rule API

```
POST /api/v1/alerts/rules
{
  "name": "Payment API Error Spike",
  "condition": {
    "query": { "term": { "service": "payment-api" }, "term": { "level": "ERROR" } },
    "threshold": { "count": ">100", "window": "5m" }
  },
  "severity": "critical",
  "notify": {
    "pagerduty": { "service_key": "abc123" },
    "slack": { "channel": "#payment-alerts" }
  }
}
```

### 8.5 Live Tail API (WebSocket)

```
WS /api/v1/logs/tail?service=payment-api&level=ERROR

Server pushes:
{"timestamp":"2025-03-15T14:23:45.123Z","level":"ERROR","service":"payment-api","message":"..."}
{"timestamp":"2025-03-15T14:23:45.456Z","level":"ERROR","service":"payment-api","message":"..."}
...

Notes:
  - WebSocket for streaming
  - Server-side filtering to reduce bandwidth
  - Rate limit to prevent overwhelming clients
  - Timeout after 30 minutes of inactivity
```

---

## 9. Data Model Overview

### 9.1 Elasticsearch Index Mapping

```json
{
  "mappings": {
    "properties": {
      "timestamp":     { "type": "date", "format": "strict_date_optional_time" },
      "level":         { "type": "keyword" },
      "service":       { "type": "keyword" },
      "instance":      { "type": "keyword" },
      "host":          { "type": "keyword" },
      "region":        { "type": "keyword" },
      "environment":   { "type": "keyword" },
      "version":       { "type": "keyword" },
      "trace_id":      { "type": "keyword" },
      "span_id":       { "type": "keyword" },
      "request_id":    { "type": "keyword" },
      "logger":        { "type": "keyword" },
      "message":       { "type": "text", "analyzer": "standard" },
      "error.type":    { "type": "keyword" },
      "error.message": { "type": "text" },
      "error.stack_trace": { "type": "text", "index": false },
      "context":       { "type": "object", "enabled": false },
      "http.method":   { "type": "keyword" },
      "http.path":     { "type": "keyword" },
      "http.status_code": { "type": "integer" },
      "http.duration_ms":  { "type": "float" }
    }
  },
  "settings": {
    "number_of_shards": 10,
    "number_of_replicas": 1,
    "index.codec": "best_compression",
    "refresh_interval": "30s"
  }
}
```

**Key mapping decisions:**
- `keyword` type for fields you filter/aggregate on (exact match, no analysis)
- `text` type for fields you full-text search on (tokenized, analyzed)
- `"index": false` for stack_trace (stored but not searchable to save index space)
- `"enabled": false` for context (stored as-is, not indexed -- saves massive space)
- `refresh_interval: 30s` balances searchability delay vs. indexing throughput

### 9.2 Daily Index Naming

```
Index pattern:    logs-{service}-{YYYY.MM.DD}
Examples:
  logs-payment-api-2025.03.15
  logs-ride-api-2025.03.15
  logs-matching-api-2025.03.15

Index aliases:
  logs-payment-api-current  -> logs-payment-api-2025.03.15
  logs-payment-api-*        -> all payment-api indices (for cross-day queries)

Why daily indices?
  1. Easy to delete old data (drop entire index vs. delete-by-query)
  2. Time-range queries skip irrelevant indices entirely
  3. Different ILM policies per age (hot -> warm -> cold -> delete)
  4. Shard count tuned per service volume
```

### 9.3 Cold Storage Schema (S3/GCS)

```
S3 bucket: s3://company-logs-archive/

Path convention:
  s3://company-logs-archive/{region}/{service}/{YYYY}/{MM}/{DD}/{HH}/
  s3://company-logs-archive/us-east-1/payment-api/2025/03/15/14/

File format:  Parquet (columnar, compressed) or gzipped NDJSON
File size:    ~256 MB per file (optimal for Athena/Presto queries)

Partition scheme (Hive-style):
  region=us-east-1/service=payment-api/year=2025/month=03/day=15/hour=14/
  (Enables partition pruning in Athena -- only scan relevant partitions)
```

---

## 10. Interview Tips

### 10.1 Opening Statement (First 2 Minutes)

```
"Before I start, I want to clarify that this is about a LOG AGGREGATION
system, not a metrics monitoring system. Logs are unstructured/semi-structured
text at massive volume -- think debugging and investigation. Metrics are
numeric time-series for dashboards and alerting. They need completely
different storage engines and query patterns. I'll focus on the logging
system."
```

### 10.2 Common Interviewer Follow-ups

| Question | Good Answer |
|----------|-------------|
| "How is this different from metrics?" | See Section 2 above. Different data model, storage, queries |
| "What if Elasticsearch goes down?" | Kafka buffers, agents buffer locally. Ingestion continues, search degraded |
| "How do you handle a service that logs 100x more than others?" | Per-service rate limiting, sampling, and quota enforcement at the agent/processor level |
| "How do you search cold data?" | S3 + Athena/Presto. Higher latency but much cheaper than keeping everything in ES |
| "How do you correlate logs across services?" | trace_id field. Every request gets a UUID at the edge, propagated through all services |
| "What about PII in logs?" | Masking pipeline: detect and redact SSN, credit card, email before indexing |

### 10.3 Key Numbers to Remember

```
500K lines/sec ingestion
500 bytes average log line
250 MB/sec = 21.6 TB/day
30 days hot = ~1 PB in Elasticsearch
1 year cold = ~1.2 PB in S3
~230 ES nodes total cluster
Ingest-to-searchable: < 30 seconds
Search latency (hot): < 3 seconds
```
