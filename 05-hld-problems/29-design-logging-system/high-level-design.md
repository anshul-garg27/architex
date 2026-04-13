# Design a Distributed Logging System (ELK/Splunk): High-Level Design

## Table of Contents
- [1. Architecture Overview](#1-architecture-overview)
- [2. System Architecture Diagram](#2-system-architecture-diagram)
- [3. End-to-End Data Flow](#3-end-to-end-data-flow)
- [4. Component Deep Dive](#4-component-deep-dive)
- [5. Log Collection Layer](#5-log-collection-layer)
- [6. Transport Layer (Kafka)](#6-transport-layer-kafka)
- [7. Log Processing Pipeline](#7-log-processing-pipeline)
- [8. Storage Layer](#8-storage-layer)
- [9. Query and Search Layer](#9-query-and-search-layer)
- [10. Alerting System](#10-alerting-system)
- [11. Visualization Layer](#11-visualization-layer)
- [12. Data Flow Walkthroughs](#12-data-flow-walkthroughs)

---

## 1. Architecture Overview

The system follows a **pipeline architecture** with five distinct layers: Collection,
Transport, Processing, Storage, and Query. Each layer is independently scalable
and connected through Kafka as the central message bus, providing durability and
decoupling between producers and consumers.

**Key architectural decisions:**
1. **Agent-based collection** -- lightweight agents on every server (not direct HTTP push) for reliability and backpressure
2. **Kafka as the central spine** -- decouples fast producers from slower consumers, provides replay capability, handles burst absorption
3. **Separate processing layer** -- parsing, enrichment, filtering done by dedicated workers before storage
4. **Hot-cold storage tiering** -- Elasticsearch for recent searchable logs, S3 for cheap long-term archive
5. **Daily index rotation** -- simplifies lifecycle management, enables efficient time-range queries
6. **Schema-on-read for cold data** -- Parquet files in S3 queried via Athena/Presto without pre-indexing

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph "10,000+ Application Servers"
        A1["App Server 1<br/>Java/Go/Python App<br/>Writes to local log files"]
        A2["App Server 2"]
        A3["App Server 3"]
        AN["App Server N"]
    end

    subgraph "Log Collection Agents (1 per server)"
        AG1["Fluent Bit Agent<br/>- Tail log files<br/>- Parse + buffer<br/>- Forward with retry<br/>- Backpressure handling"]
        AG2["Fluent Bit Agent"]
        AG3["Fluent Bit Agent"]
        AGN["Fluent Bit Agent"]
    end

    subgraph "Transport Layer"
        K["Apache Kafka Cluster<br/>20-30 brokers<br/>- logs-raw topic (500+ partitions)<br/>- logs-processed topic<br/>- logs-alerts topic<br/>- 72-hour retention<br/>- 250 MB/sec throughput"]
    end

    subgraph "Processing Layer (Kafka Consumers)"
        P1["Log Processor 1<br/>- Parse unstructured -> JSON<br/>- Extract fields (grok)<br/>- Enrich (add metadata)<br/>- Filter noise<br/>- Sample DEBUG logs"]
        P2["Log Processor 2"]
        P3["Log Processor N<br/>(50-100 instances)"]
    end

    subgraph "Hot Storage (30 days)"
        ES["Elasticsearch Cluster<br/>~230 nodes<br/>- 100 hot data nodes (SSD)<br/>- 100 warm data nodes (HDD)<br/>- 3 master nodes<br/>- 10-20 coordinating nodes<br/>- Daily indices<br/>- Full-text search + structured queries"]
    end

    subgraph "Cold Storage (90 days - 1 year)"
        S3["S3 / GCS<br/>- Compressed Parquet files<br/>- Hive-partitioned by<br/>  region/service/date<br/>- ~1.2 PB annual"]
        ATH["Athena / Presto<br/>- Query cold logs on demand<br/>- SQL interface<br/>- Partition pruning"]
    end

    subgraph "Query and API Layer"
        QA["Query API Service<br/>- Unified search interface<br/>- Routes to ES or Athena<br/>- Pagination, sorting<br/>- Rate limiting"]
        TAIL["Live Tail Service<br/>- WebSocket streaming<br/>- Reads from Kafka directly<br/>- Server-side filtering"]
    end

    subgraph "Alerting Engine"
        AE["Alert Evaluator<br/>- Reads from Kafka stream<br/>- Evaluates rules in real-time<br/>- Pattern matching<br/>- Threshold detection<br/>- Anomaly detection"]
        AR["Alert Router<br/>- PagerDuty<br/>- Slack<br/>- Email<br/>- Webhook"]
    end

    subgraph "Visualization"
        KB["Kibana / Grafana<br/>- Log exploration UI<br/>- Dashboards<br/>- Saved searches<br/>- Alert management"]
    end

    A1 --> AG1
    A2 --> AG2
    A3 --> AG3
    AN --> AGN

    AG1 & AG2 & AG3 & AGN -->|"Batched, compressed<br/>logs over TCP/HTTP"| K

    K -->|"logs-raw"| P1 & P2 & P3
    K -->|"logs-raw (fan-out)"| AE
    K -->|"logs-raw (fan-out)"| TAIL

    P1 & P2 & P3 -->|"Bulk index API<br/>250 MB/sec"| ES
    P1 & P2 & P3 -->|"Periodic flush<br/>Parquet files"| S3

    S3 --> ATH

    QA -->|"Hot queries"| ES
    QA -->|"Cold queries"| ATH

    AE --> AR

    KB --> QA
    KB --> TAIL
```

---

## 3. End-to-End Data Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Agent as Fluent Bit Agent
    participant Kafka as Kafka Cluster
    participant Proc as Log Processor
    participant ES as Elasticsearch
    participant S3 as S3 Cold Storage
    participant User as Engineer (Kibana)

    Note over App,User: Log Ingestion Path (< 30 seconds end-to-end)

    App->>App: Write log line to /var/log/app.log
    Agent->>Agent: Tail file, detect new line
    Agent->>Agent: Local parse + buffer (100ms batch)
    Agent->>Kafka: Forward batch (compressed, with retry)
    Kafka->>Kafka: Replicate to 2 followers
    Kafka-->>Agent: ACK (write confirmed)

    Proc->>Kafka: Poll batch of messages
    Proc->>Proc: Parse unstructured -> structured JSON
    Proc->>Proc: Enrich with service metadata
    Proc->>Proc: Filter noise, sample DEBUG
    Proc->>ES: Bulk index API (batch of 1000 docs)
    ES->>ES: Index into daily index (refresh every 30s)

    Note over App,User: Search Path

    User->>ES: POST /logs-*/_search { "query": ... }
    ES->>ES: Search across relevant daily indices
    ES-->>User: Return matching log lines

    Note over App,User: Cold Archive Path (background)

    Proc->>S3: Every hour, flush completed Parquet files
    Note over S3: Available for Athena queries after ILM moves data
```

---

## 4. Component Deep Dive

### 4.1 Component Responsibility Map

```
+---------------------+---------------------------+----------------------------+
| Component           | Responsibility            | Scale                      |
+---------------------+---------------------------+----------------------------+
| Log Agent           | Tail files, parse, buffer | 10,000 instances (1/server)|
| (Fluent Bit)        | forward with retry        |                            |
+---------------------+---------------------------+----------------------------+
| Kafka               | Durable message transport | 20-30 brokers              |
|                     | Burst buffer, replay      | 500+ partitions            |
|                     | Fan-out to consumers      | 250 MB/sec sustained       |
+---------------------+---------------------------+----------------------------+
| Log Processor       | Parse, enrich, filter,    | 50-100 instances           |
|                     | sample, route             | Stateless, horizontally    |
|                     |                           | scalable                   |
+---------------------+---------------------------+----------------------------+
| Elasticsearch       | Full-text search index    | ~230 nodes                 |
| (Hot + Warm)        | Structured queries        | 1-2 PB storage             |
|                     | Aggregations              | 30-90 day retention        |
+---------------------+---------------------------+----------------------------+
| S3 / GCS            | Cold log archive          | ~1.2 PB/year               |
| (Cold)              | Compliance retention      | Compressed Parquet         |
+---------------------+---------------------------+----------------------------+
| Athena / Presto     | SQL queries on cold data  | Serverless / on-demand     |
+---------------------+---------------------------+----------------------------+
| Query API           | Unified search interface  | 10-20 instances            |
|                     | Route hot vs. cold        |                            |
+---------------------+---------------------------+----------------------------+
| Alert Evaluator     | Real-time pattern matching| 10-20 instances            |
|                     | Threshold + anomaly alerts|                            |
+---------------------+---------------------------+----------------------------+
| Kibana / Grafana    | UI for search, dashboards | 3-5 instances (HA)         |
|                     | Alert management          |                            |
+---------------------+---------------------------+----------------------------+
```

---

## 5. Log Collection Layer

### 5.1 Agent Architecture

```mermaid
graph LR
    subgraph "Single Application Server"
        LF1["/var/log/app.log"]
        LF2["/var/log/access.log"]
        LF3["/var/log/syslog"]

        subgraph "Fluent Bit Agent"
            INPUT["Input Plugins<br/>- tail (file watching)<br/>- systemd (journal)<br/>- tcp (direct send)"]
            PARSE["Parser<br/>- JSON parser<br/>- Regex/Grok parser<br/>- Multiline handler<br/>(stack traces)"]
            FILTER["Filters<br/>- Add host metadata<br/>- Add K8s labels<br/>- Rate limit DEBUG<br/>- Drop health checks"]
            BUFFER["Buffer<br/>- Memory: 64 MB<br/>- Disk: 1 GB (overflow)<br/>- Backpressure control"]
            OUTPUT["Output Plugin<br/>- Kafka output<br/>- Batching (100ms / 1MB)<br/>- Compression (gzip)<br/>- Retry with backoff"]
        end
    end

    KFK["To Kafka"]

    LF1 & LF2 & LF3 --> INPUT
    INPUT --> PARSE
    PARSE --> FILTER
    FILTER --> BUFFER
    BUFFER --> OUTPUT
    OUTPUT --> KFK
```

### 5.2 Why Agent-Based (Not Direct Push)

```
AGENT-BASED (recommended):                    DIRECT HTTP PUSH:
+----------------------------------+          +----------------------------------+
| App writes to file (fast, local) |          | App sends HTTP to logging API    |
| Agent tails file asynchronously  |          | Blocking call in request path    |
| Agent handles retry/buffer       |          | App must handle failures         |
| Zero app code changes            |          | Logging SDK in every language    |
| Backpressure doesn't affect app  |          | Slow logging = slow app          |
| Works with ANY app/language      |          | Coupling between app and infra   |
+----------------------------------+          +----------------------------------+
         WINNER for most cases                       Use only as supplement
```

### 5.3 Agent Configuration Example (Fluent Bit)

```yaml
# fluent-bit.conf

[SERVICE]
    Flush         1          # Flush buffer every 1 second
    Log_Level     warn       # Agent's own log level
    storage.path  /var/fluent-bit/buffer
    storage.sync  normal
    storage.backlog.mem_limit  64MB

[INPUT]
    Name          tail
    Path          /var/log/app/*.log
    Tag           app.*
    Parser        json
    Refresh_Interval  5       # Check for new files every 5 seconds
    Rotate_Wait   30          # Wait 30s before closing rotated file
    Mem_Buf_Limit 50MB        # Memory buffer per input
    storage.type  filesystem  # Overflow to disk when memory full

[INPUT]
    Name          tail
    Path          /var/log/nginx/access.log
    Tag           nginx.access
    Parser        nginx_combined
    Multiline     On
    Multiline_Flush  5

[INPUT]
    Name          systemd
    Tag           syslog.*
    Systemd_Filter  _SYSTEMD_UNIT=docker.service

[FILTER]
    Name          record_modifier
    Match         *
    Record        hostname ${HOSTNAME}
    Record        cluster  prod-us-east-1
    Record        datacenter us-east-1a

[FILTER]
    Name          grep
    Match         *
    Exclude       message ^GET /health

[FILTER]
    Name          throttle
    Match         app.*
    Rate          10000       # Max 10K records/sec per input
    Window        5
    Print_Status  true

[OUTPUT]
    Name          kafka
    Match         *
    Brokers       kafka-1:9092,kafka-2:9092,kafka-3:9092
    Topics        logs-raw
    Format        json
    Timestamp_Key @timestamp
    rdkafka.compression.codec  snappy
    rdkafka.queue.buffering.max.messages  100000
    rdkafka.message.send.max.retries  5
```

### 5.4 Kubernetes Log Collection

```mermaid
graph TB
    subgraph "Kubernetes Node"
        subgraph "Pod A"
            C1["Container 1<br/>stdout/stderr"]
        end
        subgraph "Pod B"
            C2["Container 2<br/>stdout/stderr"]
        end

        CRT["Container Runtime<br/>(containerd/CRI-O)<br/>Writes to:<br/>/var/log/containers/*.log"]

        subgraph "DaemonSet Pod"
            FB["Fluent Bit<br/>- Mounts /var/log/containers<br/>- K8s metadata filter<br/>  (adds pod, namespace, labels)<br/>- Forwards to Kafka"]
        end
    end

    C1 & C2 --> CRT
    CRT --> FB
    FB --> K["Kafka"]

    style FB fill:#f96,stroke:#333
```

**K8s metadata enrichment** -- The Fluent Bit Kubernetes filter automatically adds:
- `kubernetes.namespace_name`
- `kubernetes.pod_name`
- `kubernetes.container_name`
- `kubernetes.labels.*`
- `kubernetes.annotations.*`

This eliminates the need for applications to include deployment context in their logs.

---

## 6. Transport Layer (Kafka)

### 6.1 Topic Design

```
+-------------------+-----------+-------------------+-------------------------------+
| Topic             | Partitions| Retention         | Purpose                       |
+-------------------+-----------+-------------------+-------------------------------+
| logs-raw          | 500+      | 72 hours          | Raw logs from agents          |
|                   |           |                   | (before processing)           |
+-------------------+-----------+-------------------+-------------------------------+
| logs-processed    | 500+      | 24 hours          | After parsing/enrichment      |
|                   |           |                   | (for ES indexing + cold store)|
+-------------------+-----------+-------------------+-------------------------------+
| logs-alerts       | 50        | 24 hours          | High-severity logs for        |
|                   |           |                   | real-time alert evaluation    |
+-------------------+-----------+-------------------+-------------------------------+
| logs-dlq          | 50        | 7 days            | Dead letter queue for         |
|                   |           |                   | unparseable/failed logs       |
+-------------------+-----------+-------------------+-------------------------------+
```

### 6.2 Partition Strategy

```
Partition key: service_name

Why service_name?
  1. Logs from the same service go to the same partition
  2. Ordering within a service is preserved
  3. Enables per-service consumer parallelism
  4. Prevents head-of-line blocking (slow service doesn't block fast ones)

Concern: Hot partitions from high-volume services?
  Solution: Hash key = service_name + random_suffix(0-9)
            This spreads a single service across 10 partitions
            while keeping locality for medium-volume services
```

### 6.3 Why Kafka (Not Direct Agent -> ES)

```mermaid
graph LR
    subgraph "WITHOUT Kafka (BAD)"
        A1["Agent"] -->|"Direct"| ES1["Elasticsearch"]
        A2["Agent"] -->|"Direct"| ES1
        AN["10K Agents"] -->|"10K connections"| ES1
        
        style ES1 fill:#f66
    end
```

```mermaid
graph LR
    subgraph "WITH Kafka (GOOD)"
        A1["Agent"] --> K["Kafka<br/>(buffer + decouple)"]
        A2["Agent"] --> K
        AN["10K Agents"] --> K
        K --> P["50 Processors<br/>(controlled concurrency)"]
        P --> ES1["Elasticsearch"]
        
        style K fill:#6f6
    end
```

**Kafka provides:**

| Benefit | Without Kafka | With Kafka |
|---------|--------------|------------|
| **Burst handling** | ES overwhelmed during spikes | Kafka absorbs bursts, consumers process at steady rate |
| **Connection management** | 10K agents = 10K connections to ES | 10K agents -> Kafka -> 50 processors -> ES |
| **Backpressure** | Agents block or drop logs | Kafka buffers hours of data |
| **Replay** | Lost data is gone forever | Replay from Kafka offset to reprocess |
| **Fan-out** | Need to duplicate writes | One write, multiple consumers (ES, S3, alerts, tail) |
| **Decoupling** | ES outage = data loss | ES outage = Kafka buffers, no loss |

### 6.4 Consumer Group Architecture

```mermaid
graph TB
    K["Kafka: logs-raw<br/>500 partitions"]

    subgraph "Consumer Group 1: log-processors"
        P1["Processor 1<br/>Assigned: partitions 0-9"]
        P2["Processor 2<br/>Assigned: partitions 10-19"]
        PN["Processor 50<br/>Assigned: partitions 490-499"]
    end

    subgraph "Consumer Group 2: alert-evaluators"
        AE1["Alert Eval 1<br/>Assigned: partitions 0-24"]
        AE2["Alert Eval 2<br/>Assigned: partitions 25-49"]
        AEN["Alert Eval 20<br/>Assigned: partitions 475-499"]
    end

    subgraph "Consumer Group 3: cold-archiver"
        CA1["Archiver 1<br/>Writes hourly Parquet to S3"]
        CA2["Archiver 2"]
    end

    subgraph "Consumer Group 4: live-tail"
        LT["Tail Service<br/>Reads from topic tail<br/>Pushes to WebSocket clients"]
    end

    K --> P1 & P2 & PN
    K --> AE1 & AE2 & AEN
    K --> CA1 & CA2
    K --> LT
```

Each consumer group reads ALL messages independently. This is the power of Kafka
fan-out: one write serves four different downstream systems.

---

## 7. Log Processing Pipeline

### 7.1 Pipeline Stages

```mermaid
graph LR
    RAW["Raw Log<br/>(from Kafka)"] --> PARSE["1. Parse<br/>Unstructured -> JSON<br/>Grok patterns<br/>JSON extract<br/>Multiline assembly"]
    PARSE --> ENRICH["2. Enrich<br/>Add service metadata<br/>Add owner team<br/>Add deployment ver<br/>GeoIP lookup"]
    ENRICH --> FILTER["3. Filter<br/>Drop health checks<br/>Drop heartbeats<br/>Remove PII<br/>Redact secrets"]
    FILTER --> SAMPLE["4. Sample<br/>Keep 100% ERROR/FATAL<br/>Keep 100% WARN<br/>Keep 50% INFO<br/>Keep 1% DEBUG/TRACE"]
    SAMPLE --> ROUTE["5. Route<br/>To ES (hot index)<br/>To S3 (cold archive)<br/>To alerts topic<br/>To DLQ (failures)"]
```

### 7.2 Stage 1: Parsing

```
INPUT (raw syslog):
  Mar 15 14:23:45 web-server-042 nginx[1234]: 10.0.42.17 - user123
    [15/Mar/2025:14:23:45 +0000] "POST /api/v1/rides HTTP/1.1" 500 0 0.234

GROK PATTERN:
  %{SYSLOGTIMESTAMP:syslog_timestamp} %{HOSTNAME:host} %{WORD:program}\[%{NUMBER:pid}\]:
  %{IP:client_ip} - %{NOTSPACE:user} \[%{HTTPDATE:timestamp}\]
  "%{WORD:method} %{URIPATH:path} HTTP/%{NUMBER}" %{NUMBER:status:int}
  %{NUMBER:bytes:int} %{NUMBER:duration:float}

OUTPUT (structured JSON):
  {
    "timestamp": "2025-03-15T14:23:45Z",
    "host": "web-server-042",
    "program": "nginx",
    "pid": 1234,
    "client_ip": "10.0.42.17",
    "user": "user123",
    "http": {
      "method": "POST",
      "path": "/api/v1/rides",
      "status_code": 500,
      "body_bytes": 0,
      "duration_sec": 0.234
    }
  }

MULTILINE HANDLING (Java stack trace):
  Input lines:
    2025-03-15 14:23:45 ERROR - Payment failed
    java.lang.NullPointerException
        at com.uber.payment.Processor.charge(Processor.java:142)
        at com.uber.payment.API.handleRequest(API.java:89)
    Caused by: java.io.IOException: Connection refused
        at java.net.Socket.connect(Socket.java:591)
  
  Rule: If line starts with whitespace or "Caused by" or "at ", 
        append to previous event.
  
  Output: Single log event with full stack trace in error.stack_trace field
```

### 7.3 Stage 2: Enrichment

```python
# Pseudocode for enrichment processor

SERVICE_METADATA = {
    "payment-api": {
        "team": "payments",
        "oncall_group": "payments-oncall",
        "tier": "critical",
        "repo": "github.com/uber/payment-api"
    },
    "ride-api": {
        "team": "marketplace",
        "oncall_group": "marketplace-oncall",
        "tier": "critical",
        "repo": "github.com/uber/ride-api"
    }
}

def enrich(log_event):
    service = log_event.get("service")
    
    # Add service metadata
    meta = SERVICE_METADATA.get(service, {})
    log_event["team"] = meta.get("team", "unknown")
    log_event["oncall_group"] = meta.get("oncall_group", "default")
    log_event["tier"] = meta.get("tier", "standard")
    
    # Add infrastructure context
    log_event["datacenter"] = resolve_datacenter(log_event["host"])
    log_event["cluster"] = resolve_cluster(log_event["host"])
    
    # GeoIP for client IPs (if present)
    if "client_ip" in log_event:
        geo = geoip_lookup(log_event["client_ip"])
        log_event["geo"] = {
            "country": geo.country,
            "city": geo.city
        }
    
    # Normalize timestamp to UTC ISO-8601
    log_event["timestamp"] = normalize_timestamp(log_event["timestamp"])
    
    return log_event
```

### 7.4 Stage 3: Filtering and PII Redaction

```
FILTER RULES:

1. DROP health checks:
   IF path == "/health" OR path == "/readiness" OR path == "/liveness"
   THEN DROP

2. DROP Kubernetes probes:
   IF user_agent CONTAINS "kube-probe" THEN DROP

3. DROP heartbeat noise:
   IF message MATCHES "heartbeat (sent|received)" AND level == "DEBUG"
   THEN DROP

4. REDACT PII:
   - Credit card: Replace /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ 
     with "****-****-****-XXXX" (keep last 4)
   - SSN: Replace /\b\d{3}-\d{2}-\d{4}\b/ with "***-**-XXXX"
   - Email: Replace /\b[\w.+-]+@[\w-]+\.[\w.]+\b/ with "[REDACTED_EMAIL]"
   - Auth tokens: Replace /Bearer\s+\S+/ with "Bearer [REDACTED]"

5. TRUNCATE oversized logs:
   IF message.length > 10,000 characters
   THEN truncate to 10,000 and add "[TRUNCATED]"
```

### 7.5 Stage 4: Sampling

```
SAMPLING STRATEGY:

The goal: Reduce volume without losing important data.
500K lines/sec at full fidelity is expensive. Sampling can cut storage 50-70%.

+----------+------------------+---------+-------------------------------+
| Level    | Sampling Rate    | Volume  | Rationale                     |
+----------+------------------+---------+-------------------------------+
| FATAL    | 100% (keep all)  | < 0.01% | Always critical               |
| ERROR    | 100% (keep all)  | ~1%     | Always needed for debugging   |
| WARN     | 100% (keep all)  | ~5%     | Often signals emerging issues |
| INFO     | 50% (1 in 2)     | ~60%    | Useful but high volume        |
| DEBUG    | 1% (1 in 100)    | ~30%    | Only needed deep debugging    |
| TRACE    | 0.1% (1 in 1000) | ~4%     | Almost never needed in prod   |
+----------+------------------+---------+-------------------------------+

EFFECTIVE REDUCTION:
  Before sampling: 500K lines/sec
  After sampling:  ~190K lines/sec (62% reduction)
  Storage savings:  ~60% on hot tier

IMPLEMENTATION:
  - Hash-based deterministic sampling on trace_id
  - If any log in a trace is ERROR, keep ALL logs for that trace
  - This preserves the ability to see the full context around errors
  
  def should_keep(log_event):
      level = log_event["level"]
      if level in ("FATAL", "ERROR", "WARN"):
          return True
      
      trace_id = log_event.get("trace_id", "")
      if is_trace_marked_for_full_capture(trace_id):
          return True  # Error in this trace -> keep everything
      
      sample_rate = {"INFO": 0.5, "DEBUG": 0.01, "TRACE": 0.001}
      hash_value = hash(trace_id) % 10000
      return hash_value < (sample_rate.get(level, 1.0) * 10000)
```

### 7.6 Stage 5: Routing

```mermaid
graph TB
    PROCESSED["Processed Log Event"]

    PROCESSED --> ES_ROUTE{"Hot storage?<br/>Age < 30 days"}
    PROCESSED --> S3_ROUTE{"Cold archive?<br/>Always"}
    PROCESSED --> ALERT_ROUTE{"Alert-worthy?<br/>ERROR/FATAL or<br/>matches alert rule"}

    ES_ROUTE -->|Yes| ES["Elasticsearch<br/>Bulk Index API"]
    S3_ROUTE -->|Yes| S3_BUFFER["S3 Buffer<br/>(batch into 256MB Parquet files<br/>flush every hour)"]
    ALERT_ROUTE -->|Yes| ALERT_TOPIC["Kafka: logs-alerts topic"]

    S3_BUFFER --> S3["S3 / GCS"]

    ES -->|"Failed after retries"| DLQ["Dead Letter Queue<br/>Kafka: logs-dlq"]
```

---

## 8. Storage Layer

### 8.1 Hot Storage: Elasticsearch

```mermaid
graph TB
    subgraph "Elasticsearch Cluster"
        subgraph "Master Nodes (3)"
            M1["Master 1<br/>Cluster state<br/>Index management"]
            M2["Master 2"]
            M3["Master 3"]
        end

        subgraph "Coordinating Nodes (10-20)"
            CO1["Coord 1<br/>Query routing<br/>Result merging<br/>Load balancing"]
            CO2["Coord 2"]
            CON["Coord N"]
        end

        subgraph "Hot Data Nodes (100, SSD)"
            H1["Hot Node 1<br/>Today's indices<br/>Yesterday's indices<br/>SSD, 64GB RAM<br/>High CPU"]
            H2["Hot Node 2"]
            HN["Hot Node 100"]
        end

        subgraph "Warm Data Nodes (100, HDD)"
            W1["Warm Node 1<br/>Indices 3-30 days old<br/>HDD, 64GB RAM<br/>Lower CPU<br/>Read-only, force-merged"]
            W2["Warm Node 2"]
            WN["Warm Node 100"]
        end

        subgraph "Ingest Nodes (10-20)"
            I1["Ingest Node 1<br/>Pre-index transforms<br/>Pipeline processing"]
            I2["Ingest Node 2"]
        end
    end

    CLIENT["Log Processors<br/>(Bulk Index API)"] --> CO1 & CO2 & CON
    CO1 --> H1 & H2 & HN
    CO1 --> W1 & W2 & WN
    SEARCH["Query API<br/>(Search Requests)"] --> CO1 & CO2 & CON
```

### 8.2 Index Strategy

```
DAILY INDEX PATTERN:
  logs-{service}-{YYYY.MM.DD}
  
  Examples:
    logs-payment-api-2025.03.15  (today, HOT tier, SSD)
    logs-payment-api-2025.03.14  (yesterday, HOT tier, SSD)
    logs-payment-api-2025.03.10  (5 days ago, WARM tier, HDD)
    logs-payment-api-2025.02.15  (28 days ago, WARM tier, about to go cold)

SHARD SIZING:
  Target: 20-50 GB per shard (Elasticsearch best practice)
  
  High-volume service (payment-api): 200 GB/day -> 10 shards per daily index
  Medium-volume service (matching-api): 50 GB/day -> 2 shards per daily index  
  Low-volume service (admin-api): 5 GB/day -> 1 shard per daily index

  Total shards across cluster: ~5,000-10,000
  (This is manageable; ES clusters can handle 10K-20K shards)

INDEX TEMPLATE:
  {
    "index_patterns": ["logs-*"],
    "template": {
      "settings": {
        "number_of_shards": 5,         // default, overridden per service
        "number_of_replicas": 1,        // 1 replica for durability
        "index.codec": "best_compression",
        "index.refresh_interval": "30s",
        "index.routing.allocation.require.data": "hot"  // Start on hot nodes
      }
    }
  }
```

### 8.3 Index Lifecycle Management (ILM)

```mermaid
graph LR
    HOT["HOT Phase<br/>Day 0-2<br/>- SSD nodes<br/>- Full indexing speed<br/>- 1 replica<br/>- Refresh: 30s"] -->|"After 2 days"| WARM["WARM Phase<br/>Day 3-30<br/>- HDD nodes<br/>- Read-only<br/>- Force merge to 1 segment<br/>- Shrink shards<br/>- 1 replica"]
    WARM -->|"After 30 days"| COLD["COLD Phase<br/>Day 31-90<br/>- Freeze index<br/>- Searchable snapshot<br/>- Backed by S3<br/>- 0 replicas"]
    COLD -->|"After 90 days"| DELETE["DELETE<br/>- Remove from ES<br/>- Data lives in S3 only<br/>- Query via Athena"]
```

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          },
          "set_priority": { "priority": 100 }
        }
      },
      "warm": {
        "min_age": "2d",
        "actions": {
          "allocate": {
            "require": { "data": "warm" },
            "number_of_replicas": 1
          },
          "forcemerge": { "max_num_segments": 1 },
          "shrink": { "number_of_shards": 1 },
          "set_priority": { "priority": 50 }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "searchable_snapshot": {
            "snapshot_repository": "s3-snapshots"
          },
          "set_priority": { "priority": 0 }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 8.4 Cold Storage: S3 Architecture

```
S3 BUCKET STRUCTURE:
  s3://uber-logs-archive/
    region=us-east-1/
      service=payment-api/
        year=2025/
          month=03/
            day=15/
              hour=14/
                logs-payment-api-20250315-14-part001.parquet  (256 MB)
                logs-payment-api-20250315-14-part002.parquet  (256 MB)
              hour=15/
                ...

PARQUET FILE BENEFITS:
  1. Columnar format -> efficient for querying specific fields
  2. Built-in compression (Snappy/Zstd) -> 5:1 compression ratio
  3. Column pruning -> only read columns referenced in query
  4. Predicate pushdown -> skip row groups that don't match filter
  5. Schema embedded in file -> self-describing

QUERYING COLD DATA (AWS Athena):
  SELECT timestamp, service, level, message
  FROM logs_archive
  WHERE region = 'us-east-1'
    AND service = 'payment-api'
    AND year = '2025' AND month = '03' AND day = '15'
    AND level = 'ERROR'
    AND message LIKE '%NullPointerException%'
  ORDER BY timestamp DESC
  LIMIT 100;

  -- Partition pruning: Only scans 1 hour of 1 service in 1 region
  -- Without partitioning: Would scan ALL data (petabytes!)
```

---

## 9. Query and Search Layer

### 9.1 Query Architecture

```mermaid
graph TB
    USER["Engineer<br/>(Kibana / API)"]
    
    QS["Query Service<br/>- Parse query<br/>- Determine time range<br/>- Route to correct backend<br/>- Merge results"]

    USER --> QS

    QS -->|"Last 30 days"| ES["Elasticsearch<br/>(fast, indexed)"]
    QS -->|"30-90 days"| FROZEN["ES Frozen Tier<br/>(searchable snapshots<br/>slower, cached on demand)"]
    QS -->|"90+ days"| ATH["Athena / Presto<br/>(scan S3 Parquet<br/>minutes latency)"]

    QS -->|"Live tail"| KAFKA["Kafka Consumer<br/>(real-time stream)"]
```

### 9.2 Common Query Patterns

```
1. KEYWORD SEARCH (most common):
   "Find all logs containing 'NullPointerException' in payment-api last 1 hour"
   
   ES Query:
   GET logs-payment-api-2025.03.15/_search
   {
     "query": {
       "bool": {
         "must": [
           { "match_phrase": { "message": "NullPointerException" } }
         ],
         "filter": [
           { "range": { "timestamp": { "gte": "now-1h" } } }
         ]
       }
     },
     "sort": [{ "timestamp": "desc" }],
     "size": 100
   }

2. TRACE CORRELATION (critical for debugging distributed systems):
   "Show me ALL logs across ALL services for trace_id=abc-123"
   
   GET logs-*-2025.03.15/_search
   {
     "query": {
       "term": { "trace_id": "abc-123-def-456" }
     },
     "sort": [{ "timestamp": "asc" }],
     "size": 1000
   }
   
   This returns the complete request journey:
   14:23:45.001  api-gateway    INFO   Received POST /api/v1/rides
   14:23:45.005  ride-api       INFO   Processing ride request
   14:23:45.010  matching-api   INFO   Finding nearest drivers
   14:23:45.050  matching-api   INFO   Matched driver_123
   14:23:45.055  ride-api       INFO   Dispatching to driver
   14:23:45.100  notification   INFO   Sent push to driver
   14:23:45.200  ride-api       ERROR  Driver accept timeout
   
3. ERROR AGGREGATION (dashboards):
   "Show error count per service per 5-minute bucket, last 24 hours"
   
   GET logs-*-2025.03.15/_search
   {
     "size": 0,
     "query": {
       "bool": {
         "filter": [
           { "term": { "level": "ERROR" } },
           { "range": { "timestamp": { "gte": "now-24h" } } }
         ]
       }
     },
     "aggs": {
       "by_service": {
         "terms": { "field": "service", "size": 50 },
         "aggs": {
           "over_time": {
             "date_histogram": {
               "field": "timestamp",
               "fixed_interval": "5m"
             }
           }
         }
       }
     }
   }

4. PATTERN DETECTION:
   "Find the top 10 most frequent error messages in the last hour"
   
   GET logs-*/_search
   {
     "size": 0,
     "query": {
       "bool": {
         "filter": [
           { "term": { "level": "ERROR" } },
           { "range": { "timestamp": { "gte": "now-1h" } } }
         ]
       }
     },
     "aggs": {
       "top_errors": {
         "significant_terms": {
           "field": "error.type",
           "size": 10
         }
       }
     }
   }
```

### 9.3 Search Performance Optimization

```
TECHNIQUE                         IMPACT                    HOW
----------------------------------------------------------------------
Time-range filter (ALWAYS)        90% shard pruning         Daily indices + timestamp filter
                                                            skips irrelevant days entirely

Keyword fields for filtering      10x faster than text      "level": "keyword" not "text"
                                                            Exact match, no analysis

Routing by service                Skip irrelevant shards    Custom routing on service field
                                                            Query only hits relevant shards

Pre-sorted indices                Skip scoring overhead     Default sort by timestamp desc
                                                            Most queries want "most recent"

Caching                           100x for repeated         ES request cache, node query
                                  queries                   cache, filesystem cache

Pagination (search_after)         Avoid deep pagination     Use search_after instead of
                                                            from+size for deep results

Async search                      Long queries don't        ES async search API for cold
                                  time out                  tier queries that take minutes
```

---

## 10. Alerting System

### 10.1 Alert Architecture

```mermaid
graph TB
    subgraph "Alert Input"
        KT["Kafka: logs-alerts topic<br/>(only ERROR/FATAL + rule-matched)"]
    end

    subgraph "Alert Evaluator Cluster"
        AE1["Evaluator 1"]
        AE2["Evaluator 2"]
        AEN["Evaluator N"]

        RS["Rule Store<br/>(PostgreSQL)<br/>- Alert rule definitions<br/>- Thresholds, windows<br/>- Owner, severity"]
        
        WS["Window State<br/>(Redis)<br/>- Sliding window counts<br/>- Per-rule counters<br/>- Anomaly baselines"]
    end

    subgraph "Alert Types"
        TH["Threshold Alert<br/>ERROR count > 100<br/>in 5 min window"]
        KW["Keyword Alert<br/>Any log contains<br/>'OutOfMemoryError'"]
        AN["Anomaly Alert<br/>Error rate 3x above<br/>24h rolling baseline"]
        AB["Absence Alert<br/>No heartbeat log<br/>for 5 minutes"]
    end

    subgraph "Alert Routing"
        DEDUP["Deduplication<br/>- Same alert within 5 min<br/>  -> suppress duplicate<br/>- Exponential backoff<br/>  for repeat alerts"]
        PD["PagerDuty<br/>(Critical)"]
        SL["Slack<br/>(Warning)"]
        EM["Email<br/>(Info)"]
        WH["Webhook<br/>(Custom)"]
    end

    KT --> AE1 & AE2 & AEN
    RS --> AE1 & AE2 & AEN
    AE1 & AE2 & AEN --> WS
    AE1 --> TH & KW & AN & AB
    TH & KW & AN & AB --> DEDUP
    DEDUP --> PD & SL & EM & WH
```

### 10.2 Alert Rule Examples

```yaml
# Rule 1: Error spike in critical service
- name: "Payment API Error Spike"
  type: threshold
  query:
    service: payment-api
    level: ERROR
  condition: count > 100
  window: 5m
  severity: critical
  notify:
    pagerduty: payments-oncall
    slack: "#payment-alerts"

# Rule 2: Specific fatal error
- name: "OOM Detection"
  type: keyword
  query:
    message_contains: "OutOfMemoryError"
    environment: production
  condition: count > 0
  window: 1m
  severity: critical
  notify:
    pagerduty: infrastructure-oncall
    slack: "#infra-alerts"

# Rule 3: Anomaly detection
- name: "Abnormal Error Rate"
  type: anomaly
  query:
    level: ERROR
  baseline: rolling_24h_average
  condition: current > baseline * 3
  window: 10m
  severity: warning
  notify:
    slack: "#service-health"

# Rule 4: Absence detection (heartbeat)
- name: "Service Heartbeat Missing"
  type: absence
  query:
    message_contains: "heartbeat"
    service: payment-api
  expected_interval: 60s
  alert_after: 5m
  severity: critical
  notify:
    pagerduty: payments-oncall
```

---

## 11. Visualization Layer

### 11.1 Kibana / Grafana Dashboard Layout

```
+-----------------------------------------------------------------------+
|  DISTRIBUTED LOGGING DASHBOARD - Production                    [Live] |
+-----------------------------------------------------------------------+
|                                                                       |
|  Ingestion Rate          Error Rate (all services)    Active Alerts   |
|  [=====] 487K/sec        [=====] 2,341/min           [!] 3 Critical  |
|  (target: 500K)          (baseline: 1,800/min)        [!] 7 Warning  |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  Error Count by Service (last 1 hour)                                |
|  +------------------------------------------------------------------+|
|  | payment-api  ████████████████████████  4,521                     ||
|  | ride-api     ████████████████         3,201                      ||
|  | matching-api ████████████             2,456                      ||
|  | user-api     ████████                 1,789                      ||
|  | notification ████                       834                      ||
|  +------------------------------------------------------------------+|
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  Error Rate Timeline (5-min buckets, last 24 hours)                  |
|  +------------------------------------------------------------------+|
|  |     *                                                            ||
|  |    * *        *                                                  ||
|  |   *   *      * *                              *                  ||
|  |  *     *    *   *     *  *                   * *                 ||
|  | *       ****     *****    ***    *  *  *  ***   ****             ||
|  |------------------------------------------------------------------||
|  | 00:00  04:00  08:00  12:00  16:00  20:00  00:00                 ||
|  +------------------------------------------------------------------+|
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  LOG EXPLORER   [service: payment-api ▼] [level: ERROR ▼] [1 hour]  |
|  Search: [NullPointerException________________________________] [Go] |
|                                                                       |
|  14:23:45.456 ERROR payment-api  NullPointerException in Charge...   |
|  14:23:44.123 ERROR payment-api  Failed to process payment for...    |
|  14:23:43.789 ERROR payment-api  Database connection timeout af...    |
|  14:23:42.012 ERROR payment-api  NullPointerException in Charge...   |
|  [Load more...]                                                       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 12. Data Flow Walkthroughs

### 12.1 Walkthrough: Engineer Debugs a Production Error

```mermaid
sequenceDiagram
    participant Eng as Engineer
    participant KB as Kibana
    participant QS as Query Service
    participant ES as Elasticsearch
    participant ATH as Athena (Cold)

    Note over Eng,ATH: PagerDuty alert fires: "Payment API Error Spike"

    Eng->>KB: Open Kibana, go to log explorer
    Eng->>KB: Filter: service=payment-api, level=ERROR, last 15 min
    KB->>QS: POST /api/v1/logs/search
    QS->>ES: Query hot tier (today's index)
    ES-->>QS: 342 matching logs, 245ms
    QS-->>KB: Display results
    
    Eng->>KB: See repeated "NullPointerException in ChargeProcessor"
    Eng->>KB: Click on one error, copy trace_id
    
    Eng->>KB: Search: trace_id = "abc-123-def-456"
    KB->>QS: Query with trace_id across all service indices
    QS->>ES: GET logs-*-2025.03.15/_search {trace_id: "abc-123"}
    ES-->>QS: 23 log events across 5 services
    QS-->>KB: Display chronological trace

    Note over Eng: Engineer sees the full request path:<br/>api-gateway -> ride-api -> payment-api<br/>Payment API received null customer_id<br/>because ride-api deployed v2.35 with a bug

    Eng->>KB: Search: "customer_id null" in ride-api, last 24 hours
    Eng->>KB: Check: "Did this start after a deployment?"
    Eng->>KB: Filter: version=v2.35, ride-api -> confirms bug in new version
    
    Note over Eng: Root cause found. Rollback v2.35.
```

### 12.2 Walkthrough: Backpressure During an Outage

```mermaid
sequenceDiagram
    participant Apps as 10K App Servers
    participant Agents as Fluent Bit Agents
    participant Kafka as Kafka Cluster
    participant Proc as Log Processors
    participant ES as Elasticsearch

    Note over Apps,ES: SCENARIO: Database outage causes error storm.<br/>Normal: 500K lines/sec. Spike: 2M lines/sec.

    Apps->>Apps: Error rate spikes 4x
    Apps->>Agents: Log volume jumps to 2M lines/sec
    
    Agents->>Agents: Memory buffer fills (64 MB)
    Agents->>Agents: Overflow to disk buffer (1 GB)
    Agents->>Kafka: Forward at max rate (with backpressure)
    
    Kafka->>Kafka: Absorbs burst (72-hour retention)
    Kafka->>Kafka: Producers not blocked (async ACK)
    
    Proc->>Kafka: Consumers lag behind (500K/sec capacity)
    Proc->>Proc: Consumer lag grows (Kafka absorbs the rest)
    Proc->>Proc: Activate aggressive sampling:
    Note over Proc: Emergency: Keep 100% ERROR/FATAL<br/>Drop all DEBUG/TRACE<br/>Sample INFO at 10%
    
    Proc->>ES: Indexing continues at 500K/sec
    ES->>ES: Bulk indexing queue stays manageable
    
    Note over Apps,ES: RECOVERY: Error storm subsides after 30 minutes
    
    Proc->>Kafka: Consumers catch up on lag
    Proc->>Proc: Restore normal sampling rates
    Note over Apps,ES: Zero data loss for ERROR/FATAL.<br/>Some DEBUG sampled/dropped during spike.
```

### 12.3 Walkthrough: ILM Moves Index from Hot to Warm

```mermaid
sequenceDiagram
    participant ILM as ILM Policy Engine
    participant HOT as Hot Node (SSD)
    participant WARM as Warm Node (HDD)
    participant S3 as S3 Snapshot Repo

    Note over ILM,S3: Index "logs-payment-api-2025.03.13" is now 2 days old

    ILM->>ILM: Check policy: min_age 2d reached
    ILM->>HOT: Mark index as read-only
    ILM->>HOT: Force merge into 1 segment per shard
    Note over HOT: Merging reduces segment count<br/>from ~50 to 1 per shard.<br/>Improves search speed,<br/>reduces overhead.
    
    ILM->>HOT: Shrink from 10 shards to 2 shards
    Note over HOT: Fewer shards = less cluster overhead<br/>Acceptable since index is now read-only
    
    ILM->>WARM: Relocate shards to warm nodes
    Note over WARM: Warm nodes have HDD (cheaper, slower)<br/>Less RAM and CPU<br/>Adequate for infrequent searches
    
    ILM->>WARM: Set priority to 50 (lower than hot)
    
    Note over ILM,S3: After 30 more days (total 32 days)...
    
    ILM->>S3: Create searchable snapshot
    ILM->>WARM: Convert to frozen tier (mount snapshot)
    Note over WARM: Frozen tier uses minimal local storage<br/>Data fetched from S3 on demand<br/>First query slower, then cached
    
    Note over ILM,S3: After 90 days total...
    
    ILM->>ILM: Delete index from Elasticsearch
    Note over S3: Raw Parquet files still in S3<br/>Queryable via Athena for 1 year
```
