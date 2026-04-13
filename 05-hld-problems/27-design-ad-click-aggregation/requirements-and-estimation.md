# Design an Ad Click Aggregation System: Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Functional Requirements](#2-functional-requirements)
- [3. Non-Functional Requirements](#3-non-functional-requirements)
- [4. Out of Scope](#4-out-of-scope)
- [5. Back-of-Envelope Estimation](#5-back-of-envelope-estimation)
- [6. API Design](#6-api-design)
- [7. Data Model Overview](#7-data-model-overview)
- [8. Click Event Schema](#8-click-event-schema)
- [9. Key Challenges Summary](#9-key-challenges-summary)

---

## 1. Problem Statement

Design an ad click aggregation system that ingests billions of ad click events daily,
aggregates them in real-time for billing and reporting, deduplicates fraudulent or
accidental clicks, and serves analytical queries such as "how many clicks did ad X
receive in the last 5 minutes?" -- all at Meta/Google scale with exactly-once
semantics and sub-second query latency.

**Why this problem is asked at Meta/Google:**
- It tests **stream processing** at massive scale (10B events/day)
- It tests **exactly-once semantics** (money is on the line -- advertisers are billed per click)
- It tests **deduplication** under high throughput (same user clicking same ad rapidly)
- It tests **OLAP storage** design (fast analytical queries over huge datasets)
- It tests **Lambda architecture** reasoning (real-time stream + batch reconciliation)
- It tests **hot shard** handling (a viral ad can overload a single partition)
- It tests **data reconciliation** (stream and batch results must converge)

**Reference:** Alex Xu, System Design Interview Volume 2, Chapter 7

---

## 2. Functional Requirements

### 2.1 Core Click Ingestion

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Ingest click events** | Receive click events from ad SDKs embedded in web pages and mobile apps. Each click contains ad_id, user_id, timestamp, IP, user_agent, and a globally unique click_id |
| FR-2 | **Click deduplication** | Detect and discard duplicate clicks -- same user clicking the same ad within a 1-minute window should count as a single click |
| FR-3 | **Click validation** | Basic validation: reject clicks with missing fields, future timestamps, or unknown ad_ids |
| FR-4 | **High-throughput ingestion** | Handle 10 billion clicks/day (115K clicks/sec sustained, 500K clicks/sec at peak) without data loss |

### 2.2 Real-Time Aggregation

| # | Requirement | Description |
|---|-------------|-------------|
| FR-5 | **Time-windowed aggregation** | Aggregate click counts per ad_id in 1-minute tumbling windows for billing accuracy |
| FR-6 | **Multi-dimensional aggregation** | Support aggregations by ad_id, campaign_id, advertiser_id, geography, device_type, and time ranges |
| FR-7 | **Real-time dashboard** | Provide sliding window aggregations (last 1 min, 5 min, 1 hour) for live advertiser dashboards |
| FR-8 | **Billing aggregation** | Produce finalized per-ad click counts used as input to the billing pipeline. These numbers must be accurate -- advertisers pay per click |

### 2.3 Query Service

| # | Requirement | Description |
|---|-------------|-------------|
| FR-9 | **Point queries** | "How many clicks did ad_id X get in the last M minutes?" with p99 < 200ms |
| FR-10 | **Range queries** | "Show click counts for campaign Y from date A to date B, grouped by day" |
| FR-11 | **Top-N queries** | "Top 10 ads by click count in the last hour" |
| FR-12 | **Comparison queries** | "Compare click-through rates for ads A, B, C over the last 7 days" |
| FR-13 | **Filter queries** | Filter by geography, device type, browser, OS for any of the above |

### 2.4 Reconciliation

| # | Requirement | Description |
|---|-------------|-------------|
| FR-14 | **Batch reconciliation** | Run daily batch jobs that reprocess raw click logs and compare with streaming results. Flag discrepancies exceeding a threshold (e.g., >2% deviation) |
| FR-15 | **Late event handling** | Accept and correctly aggregate clicks that arrive up to 24 hours late (network delays, offline devices coming back online) |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Ingestion throughput** | 500K clicks/sec peak | 10B clicks/day with 5x peak-to-average ratio |
| **Aggregation latency** | < 5 seconds end-to-end | Click ingested to aggregated result queryable |
| **Query latency (point)** | p50 < 50ms, p99 < 200ms | Advertiser dashboards must feel snappy |
| **Query latency (range)** | p50 < 200ms, p99 < 1s | Multi-day range queries on indexed dimensions |
| **Deduplication latency** | < 100ms per click | Must not become the ingestion bottleneck |

### 3.2 Reliability and Accuracy

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Data durability** | 99.9999% (six 9s) | Every legitimate click is money. Losing clicks means lost revenue |
| **Exactly-once aggregation** | Zero over/under-counting | Advertisers pay per click. Duplicates = overcharging. Drops = lost revenue |
| **System availability** | 99.99% (52 min downtime/year) | Ad systems are revenue-critical 24/7 |
| **Batch-stream convergence** | < 0.1% deviation | Streaming and batch results must match for billing accuracy |
| **Deduplication accuracy** | > 99.9% | Catch virtually all accidental double-clicks |

### 3.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Horizontal scaling** | Linear scale-out | Adding nodes should proportionally increase throughput |
| **Hot shard tolerance** | No single partition > 3x average load | Viral ads must not crash the system |
| **Data retention** | Raw clicks: 30 days. Aggregates: 3 years | Audit trail + long-term reporting |
| **Storage efficiency** | 10:1 compression on raw data | Columnar storage + time-series compression |

### 3.4 Consistency

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Aggregation consistency** | Exactly-once semantics | Core requirement for billing correctness |
| **Query consistency** | Read-your-writes for dashboard | Advertiser should see recently delivered clicks |
| **Cross-datacenter** | Eventual consistency (< 30s) | Multi-region deployment for latency |

---

## 4. Out of Scope

| Area | Reason |
|------|--------|
| Ad serving / selection / targeting | Separate system (ad auction) |
| Ad impression tracking | Different pipeline, though architecturally similar |
| Click-through rate (CTR) model training | ML pipeline, not aggregation |
| Ad creative management | Content management system |
| Advertiser billing and invoicing | Downstream of aggregation -- we produce the counts, billing consumes them |
| Fraud detection ML models | We handle basic dedup; sophisticated fraud detection is a separate ML system |
| User identity resolution | We use user_id as given; cross-device identity is a separate system |

---

## 5. Back-of-Envelope Estimation

### 5.1 Traffic Estimation

```
Total daily clicks:       10,000,000,000 (10 billion)
Seconds per day:          86,400

Average clicks/sec:       10B / 86,400 = ~115,740 clicks/sec
                          Round to 115K clicks/sec

Peak multiplier:          ~4-5x average (peak hours, major events like Super Bowl ads)
Peak clicks/sec:          115K x 4.3 = ~500,000 clicks/sec

Unique advertisers:       ~2,000,000 (2M)
Unique ad campaigns:      ~10,000,000 (10M)
Unique ad creatives:      ~50,000,000 (50M)
```

### 5.2 Click Event Size

```
Single click event:
  click_id:       16 bytes (UUID)
  ad_id:          8 bytes (int64)
  campaign_id:    8 bytes (int64)
  advertiser_id:  8 bytes (int64)
  user_id:        16 bytes (UUID or hashed)
  timestamp:      8 bytes (epoch millis)
  ip_address:     16 bytes (IPv6)
  user_agent:     ~200 bytes (truncated/hashed)
  country:        2 bytes (ISO code)
  device_type:    1 byte (enum)
  browser:        1 byte (enum)
  os:             1 byte (enum)
  referrer_hash:  8 bytes
  -------------------------------------------
  Total:          ~300 bytes per raw click event

  With Kafka overhead (headers, key, CRC):
  ~400 bytes per Kafka message
```

### 5.3 Storage Estimation

```
Daily raw click storage:
  10B clicks x 300 bytes = 3 TB/day (raw)

  With Kafka replication (3x): 3 TB x 3 = 9 TB/day in Kafka
  Kafka retention (3 days):    9 TB x 3 = 27 TB total Kafka storage

Raw click archive (30 days, compressed):
  3 TB/day x 30 days = 90 TB raw
  With columnar compression (10:1): ~9 TB archived (Parquet in object storage)

Aggregated data (much smaller):
  Aggregation grain: per ad_id, per minute
  50M ad_ids x 1440 minutes/day = 72B rows/day (sparse, most ads have 0 clicks most minutes)
  Actual rows (ads with clicks): ~500M rows/day
  Row size (ad_id + timestamp + count + dimensions): ~100 bytes
  500M x 100 bytes = 50 GB/day aggregated

  3-year aggregated retention: 50 GB x 365 x 3 = ~55 TB
  With columnar compression (5:1): ~11 TB
```

### 5.4 Network Bandwidth

```
Ingestion bandwidth:
  Peak: 500K clicks/sec x 400 bytes = 200 MB/sec inbound
  This is well within a single datacenter's capacity

  With Kafka replication: 200 MB/sec x 3 = 600 MB/sec internal

Query bandwidth (read):
  Assume 10K queries/sec at peak
  Average response: 5 KB
  10K x 5 KB = 50 MB/sec outbound (trivial)
```

### 5.5 Compute Estimation

```
Stream processing (Flink):
  500K events/sec at peak
  Each event: dedup check + aggregation update = ~0.5ms CPU
  CPU needed: 500K x 0.5ms = 250 CPU-seconds per second = 250 cores
  With overhead: ~400 cores for Flink cluster
  Typical: 50-100 Flink TaskManager pods (4-8 cores each)

Dedup layer (Redis/Bloom filter):
  500K lookups/sec + 500K inserts/sec to Redis
  Redis single instance: ~100K ops/sec
  Need: ~10 Redis instances for dedup alone

Aggregation store (ClickHouse):
  Write: 500M aggregated rows/day = ~6K inserts/sec (pre-aggregated)
  Read: 10K queries/sec (point + range queries)
  Typical: 6-10 ClickHouse nodes with 64 cores, 256 GB RAM each
```

### 5.6 Estimation Summary Table

| Metric | Value |
|--------|-------|
| Daily clicks | 10 billion |
| Average throughput | 115K clicks/sec |
| Peak throughput | 500K clicks/sec |
| Raw click size | ~300 bytes |
| Daily raw storage | 3 TB |
| Kafka total storage | 27 TB (3-day retention, 3x replication) |
| Daily aggregated storage | 50 GB |
| Flink cluster | ~400 cores (50-100 pods) |
| Redis dedup cluster | ~10 instances |
| ClickHouse cluster | 6-10 nodes |
| Network ingestion peak | 200 MB/sec |

---

## 6. API Design

### 6.1 Click Ingestion API

```
POST /v1/clicks
```

**Request Body (JSON or Protobuf):**
```json
{
  "click_id": "550e8400-e29b-41d4-a716-446655440000",
  "ad_id": 1234567890,
  "campaign_id": 98765,
  "advertiser_id": 5555,
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": 1700000000000,
  "ip_address": "2001:db8::1",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)",
  "country": "US",
  "device_type": "mobile",
  "referrer_url": "https://news.example.com/article/123"
}
```

**Response:**
```json
// 202 Accepted (async processing)
{
  "status": "accepted",
  "click_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Why 202 and not 200?**
- Click processing is asynchronous (dedup, aggregation happen downstream)
- We confirm receipt, not processing completion
- The ad SDK should fire-and-forget for minimal user-perceived latency

### 6.2 Aggregation Query API

```
GET /v1/aggregation/ads/{ad_id}?start=1700000000&end=1700003600&granularity=1m
```

**Response:**
```json
{
  "ad_id": 1234567890,
  "campaign_id": 98765,
  "start_time": "2024-11-14T12:00:00Z",
  "end_time": "2024-11-14T13:00:00Z",
  "granularity": "1m",
  "total_clicks": 45230,
  "time_series": [
    { "timestamp": "2024-11-14T12:00:00Z", "clicks": 742 },
    { "timestamp": "2024-11-14T12:01:00Z", "clicks": 756 },
    { "timestamp": "2024-11-14T12:02:00Z", "clicks": 801 }
  ]
}
```

### 6.3 Top-N Query API

```
GET /v1/aggregation/top?metric=clicks&period=1h&limit=10&filter=country:US
```

**Response:**
```json
{
  "period": "last_1h",
  "metric": "clicks",
  "filter": { "country": "US" },
  "results": [
    { "ad_id": 1234567890, "campaign": "Holiday Sale", "clicks": 152340 },
    { "ad_id": 9876543210, "campaign": "Black Friday", "clicks": 98210 }
  ]
}
```

### 6.4 Campaign Aggregation API

```
GET /v1/aggregation/campaigns/{campaign_id}?start=2024-11-01&end=2024-11-14&granularity=1d
```

**Response:**
```json
{
  "campaign_id": 98765,
  "advertiser_id": 5555,
  "campaign_name": "Holiday Sale 2024",
  "date_range": { "start": "2024-11-01", "end": "2024-11-14" },
  "total_clicks": 2345678,
  "daily_breakdown": [
    { "date": "2024-11-01", "clicks": 145230, "unique_users": 132100 },
    { "date": "2024-11-02", "clicks": 167890, "unique_users": 151200 }
  ]
}
```

### 6.5 Reconciliation Status API (Internal)

```
GET /v1/internal/reconciliation/status?date=2024-11-14
```

**Response:**
```json
{
  "date": "2024-11-14",
  "status": "completed",
  "stream_total_clicks": 10234567890,
  "batch_total_clicks": 10234512345,
  "deviation": 0.00054,
  "deviation_threshold": 0.001,
  "result": "PASS",
  "flagged_ad_ids": [],
  "completed_at": "2024-11-15T02:30:00Z"
}
```

---

## 7. Data Model Overview

### 7.1 Raw Click Event (Kafka / Object Storage)

```sql
-- This is the raw event as ingested. Stored in Kafka (short-term) and
-- Parquet files in S3 (long-term archive for batch reprocessing).

CREATE TABLE raw_clicks (
    click_id        UUID        NOT NULL,   -- Globally unique, set by ad SDK
    ad_id           BIGINT      NOT NULL,   -- Which ad was clicked
    campaign_id     BIGINT      NOT NULL,   -- Parent campaign
    advertiser_id   BIGINT      NOT NULL,   -- Parent advertiser
    user_id         UUID        NOT NULL,   -- Clicking user (hashed/anonymous)
    click_timestamp BIGINT      NOT NULL,   -- Epoch milliseconds
    ip_address      VARCHAR(45) NOT NULL,   -- IPv4 or IPv6
    user_agent_hash BIGINT      NOT NULL,   -- Hash of user agent string
    country         CHAR(2)     NOT NULL,   -- ISO 3166-1 alpha-2
    device_type     TINYINT     NOT NULL,   -- 0=desktop, 1=mobile, 2=tablet
    browser         TINYINT     NOT NULL,   -- Enum: Chrome, Safari, Firefox...
    os              TINYINT     NOT NULL,   -- Enum: iOS, Android, Windows...
    is_duplicate    BOOLEAN     DEFAULT FALSE,
    ingestion_time  BIGINT      NOT NULL    -- When our system received it
);
```

### 7.2 Minute-Level Aggregation (ClickHouse / Druid)

```sql
-- Pre-aggregated table. One row per ad per minute per dimension combination.
-- This is what the query service reads for fast responses.

CREATE TABLE click_aggregates (
    ad_id           BIGINT      NOT NULL,
    campaign_id     BIGINT      NOT NULL,
    advertiser_id   BIGINT      NOT NULL,
    window_start    DATETIME    NOT NULL,   -- Start of 1-min tumbling window
    country         CHAR(2)     NOT NULL,
    device_type     TINYINT     NOT NULL,
    click_count     BIGINT      NOT NULL,   -- Aggregated count
    unique_users    BIGINT      NOT NULL,   -- Approximate distinct (HyperLogLog)
    updated_at      DATETIME    NOT NULL    -- For idempotent upserts
)
ENGINE = AggregatingMergeTree()            -- ClickHouse-specific: merges on read
PARTITION BY toYYYYMMDD(window_start)       -- Partition by day
ORDER BY (advertiser_id, campaign_id, ad_id, window_start, country, device_type);
```

### 7.3 Hourly / Daily Roll-Up

```sql
-- Materialized view that automatically rolls up minute-level data.
-- Reduces query scan size for longer time ranges.

CREATE MATERIALIZED VIEW click_aggregates_hourly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMMDD(window_start)
ORDER BY (advertiser_id, campaign_id, ad_id, window_start, country)
AS SELECT
    ad_id,
    campaign_id,
    advertiser_id,
    toStartOfHour(window_start) AS window_start,
    country,
    sum(click_count)            AS click_count,
    uniqMerge(unique_users_state) AS unique_users
FROM click_aggregates
GROUP BY ad_id, campaign_id, advertiser_id, window_start, country;
```

### 7.4 Deduplication State (Redis)

```
Key pattern:   dedup:{ad_id}:{user_id}
Value:         click_id (the first click we accepted)
TTL:           60 seconds (1-minute dedup window)

Example:
  SET dedup:1234567890:a1b2c3d4 "550e8400..." EX 60 NX
  - NX ensures only the first SET succeeds
  - If SET returns OK  -> new click, forward to aggregation
  - If SET returns nil -> duplicate click within 1 min, discard
```

---

## 8. Click Event Schema

### 8.1 Kafka Message Format (Protobuf)

```protobuf
syntax = "proto3";

message ClickEvent {
  string click_id       = 1;  // UUID v7 (time-ordered)
  int64  ad_id          = 2;
  int64  campaign_id    = 3;
  int64  advertiser_id  = 4;
  string user_id        = 5;  // Hashed user identifier
  int64  click_timestamp = 6; // Epoch milliseconds (event time)
  string ip_address     = 7;
  string user_agent     = 8;
  string country        = 9;  // ISO 3166-1 alpha-2
  DeviceType device_type = 10;
  Browser browser       = 11;
  OS os                 = 12;
  int64 ingestion_time  = 13; // Epoch milliseconds (processing time)
}

enum DeviceType {
  DESKTOP = 0;
  MOBILE  = 1;
  TABLET  = 2;
}

enum Browser {
  CHROME  = 0;
  SAFARI  = 1;
  FIREFOX = 2;
  EDGE    = 3;
  OTHER   = 4;
}

enum OS {
  WINDOWS = 0;
  MACOS   = 1;
  LINUX   = 2;
  IOS     = 3;
  ANDROID = 4;
  OTHER_OS = 5;
}
```

### 8.2 Why Protobuf over JSON?

| Aspect | JSON | Protobuf |
|--------|------|----------|
| **Size** | ~500 bytes/event | ~200 bytes/event (60% smaller) |
| **Serialization speed** | ~10 us | ~1 us (10x faster) |
| **Schema evolution** | No enforcement | Forward/backward compatible |
| **CPU at 500K/sec** | Significant JSON parsing overhead | Minimal |
| **Network savings at scale** | 250 MB/sec | 100 MB/sec (150 MB/sec saved) |

At 500K events/sec, Protobuf saves ~150 MB/sec of network bandwidth and
significant CPU on serialization/deserialization. This is not premature
optimization -- it is a requirement at this scale.

---

## 9. Key Challenges Summary

These are the core technical challenges that the high-level design must address:

```
Challenge                     Why It's Hard                          Where We Solve It
---------------------------------------------------------------------------------------
1. Exactly-once counting      Money depends on accuracy              Flink checkpointing +
                                                                     idempotent writes

2. Click deduplication        500K clicks/sec, 1-min window,        Redis SET NX + Bloom
                              must not add latency                   filter (two-tier)

3. Hot shard / viral ad       One ad_id = one partition =            Salted keys + local
                              potential bottleneck                   pre-aggregation

4. Late event handling        Clicks arriving hours late must        Watermarks + allowed
                              still be counted correctly             lateness in Flink

5. Batch-stream reconcile     Streaming results may drift from      Lambda architecture +
                              ground truth over time                 daily reconciliation

6. Query performance          Analytical queries over billions       Columnar OLAP store
                              of rows in < 200ms                    (ClickHouse/Druid)

7. Fault tolerance            Flink crash mid-window must not        Checkpointing to S3 +
                              lose or double-count data              Kafka replay

8. Click fraud                Bots, click farms, competitor          Heuristic filters +
                              fraud at massive scale                 ML fraud pipeline
```

---

**Next:** [High-Level Design](./high-level-design.md) -- the full architecture with Mermaid diagrams and component walkthroughs.
