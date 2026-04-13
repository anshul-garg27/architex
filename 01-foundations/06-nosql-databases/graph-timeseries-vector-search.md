# Graph, Time-Series, Vector, and Search Databases

---

## Graph Databases

### What Are Graph Databases?

Graph databases store data as **nodes** (entities), **edges** (relationships), and
**properties** (attributes). They excel when relationships ARE the data.

```
┌──────────────────────────────────────────────────────────────────┐
│                   Property Graph Model                           │
│                                                                  │
│     ┌─────────────┐    :FOLLOWS     ┌─────────────┐            │
│     │  (:Person)  │───────────────►│  (:Person)  │             │
│     │ name:"Alice"│                │ name:"Bob"  │             │
│     │ age: 30     │◄───────────────│ age: 28     │             │
│     └──────┬──────┘    :FOLLOWS    └──────┬──────┘             │
│            │                              │                     │
│            │ :PURCHASED                   │ :PURCHASED          │
│            │ date:"2026-04"               │ rating: 5           │
│            ▼                              ▼                     │
│     ┌─────────────┐              ┌─────────────┐               │
│     │ (:Product)  │              │ (:Product)  │               │
│     │ name:"Laptop│◄─────────────│ name:"Mouse"│               │
│     │ price: 999  │ :ACCESSORY_OF│ price: 29   │               │
│     └─────────────┘              └─────────────┘               │
│                                                                  │
│  Nodes:  Entities with labels and properties                    │
│  Edges:  Directed relationships with type and properties        │
│  Key:    Relationships are first-class citizens (stored, indexed)│
└──────────────────────────────────────────────────────────────────┘
```

### Neo4j and Cypher Query Language

```cypher
-- Create nodes and relationships
CREATE (alice:Person {name: "Alice", age: 30})
CREATE (bob:Person {name: "Bob", age: 28})
CREATE (laptop:Product {name: "Laptop", price: 999})
CREATE (alice)-[:FOLLOWS {since: "2024-01"}]->(bob)
CREATE (alice)-[:PURCHASED {date: "2026-04"}]->(laptop)

-- Find all people Alice follows
MATCH (alice:Person {name: "Alice"})-[:FOLLOWS]->(friend)
RETURN friend.name

-- Friends of friends (2-hop traversal)
MATCH (alice:Person {name: "Alice"})-[:FOLLOWS*2]->(fof)
WHERE fof <> alice
RETURN DISTINCT fof.name

-- Shortest path between two people
MATCH path = shortestPath(
  (alice:Person {name: "Alice"})-[:FOLLOWS*..10]-(bob:Person {name: "Bob"})
)
RETURN path

-- Recommendation: products bought by people who bought same products
MATCH (me:Person {name: "Alice"})-[:PURCHASED]->(p:Product)
      <-[:PURCHASED]-(other:Person)-[:PURCHASED]->(rec:Product)
WHERE NOT (me)-[:PURCHASED]->(rec)
RETURN rec.name, COUNT(other) AS score
ORDER BY score DESC
LIMIT 5

-- Fraud detection: find circular money transfers
MATCH path = (a:Account)-[:TRANSFER*3..6]->(a)
WHERE ALL(t IN relationships(path) WHERE t.amount > 10000)
RETURN path
```

### When Graph Beats Relational

```
┌─────────────────────────────────────────────────────────────────┐
│  SQL for "friends of friends of friends":                       │
│                                                                 │
│  SELECT DISTINCT f3.name                                        │
│  FROM follows f1                                                │
│  JOIN follows f2 ON f1.friend_id = f2.user_id                  │
│  JOIN follows f3 ON f2.friend_id = f3.user_id                  │
│  WHERE f1.user_id = 1001;                                      │
│                                                                 │
│  - 3 JOINs for 3 hops. 10 hops = 10 JOINs (impractical)       │
│  - Performance degrades exponentially with depth                │
│  - Variable depth impossible (need recursive CTE)               │
│                                                                 │
│  Cypher for the same:                                           │
│  MATCH (me:Person {id:1001})-[:FOLLOWS*3]->(fof)               │
│  RETURN DISTINCT fof.name                                       │
│                                                                 │
│  - One line. Variable depth: just change *3 to *1..10           │
│  - Performance: O(branching_factor^depth) not O(table_size)     │
│  - Index-free adjacency: each node stores pointers to neighbors │
└─────────────────────────────────────────────────────────────────┘

Use graph when:
  [x] Many-to-many relationships with variable-depth traversal
  [x] Social networks (followers, friends, connections)
  [x] Fraud detection (circular transfers, suspicious patterns)
  [x] Knowledge graphs (entities + relationships)
  [x] Recommendation engines (collaborative filtering)
  [x] Network topology (routing, dependencies)
  [x] Access control (role → permission → resource hierarchies)
```

---

## Time-Series Databases

### What Are Time-Series Databases?

Databases optimized for **time-stamped data** with **high write throughput**,
**efficient range queries** over time, and **automatic data lifecycle management**.

```
┌──────────────────────────────────────────────────────────────────┐
│                 Time-Series Data Pattern                         │
│                                                                  │
│  Characteristics:                                                │
│    - Write-heavy (append-only, rarely update/delete)             │
│    - Time-ordered (timestamp is primary dimension)               │
│    - Recent data queried more than old data                      │
│    - Aggregation over time windows (avg per hour, max per day)   │
│    - Data often downsampled or expired over time                 │
│                                                                  │
│  Value                                                           │
│    │     ╭─╮                                                     │
│    │    ╭╯ ╰╮    ╭──╮                                            │
│    │   ╭╯   ╰╮  ╭╯  ╰─╮    ╭╮                                   │
│    │  ╭╯     ╰──╯     ╰────╯╰──                                │
│    │──╯                                                          │
│    └────────────────────────────────────────► Time               │
│      10:00  10:05  10:10  10:15  10:20                          │
│                                                                  │
│  Schema: (timestamp, metric_name, tags, value)                  │
│  Example: (2026-04-07T10:05, "cpu.usage", {host:"web-1"}, 72.5)│
└──────────────────────────────────────────────────────────────────┘
```

### InfluxDB

```
┌──────────────────────────────────────────────────────────────────┐
│                        InfluxDB                                  │
│                                                                  │
│  Purpose-built time-series database with custom storage engine.  │
│                                                                  │
│  Line Protocol (write format):                                   │
│    measurement,tag1=val1,tag2=val2 field1=val1,field2=val2 ts    │
│                                                                  │
│  Example:                                                        │
│    cpu,host=web-1,region=us-east usage=72.5,idle=27.5 1712476800│
│    cpu,host=web-2,region=eu-west usage=55.0,idle=45.0 1712476800│
│                                                                  │
│  Concepts:                                                       │
│    Measurement:  like a table (e.g., "cpu", "memory")            │
│    Tags:         indexed metadata (host, region) -- for filtering│
│    Fields:       actual values (usage, idle) -- NOT indexed      │
│    Timestamp:    nanosecond precision                             │
│                                                                  │
│  Queries (Flux language in InfluxDB 2.x):                        │
│    from(bucket: "metrics")                                       │
│      |> range(start: -1h)                                        │
│      |> filter(fn: (r) => r._measurement == "cpu"                │
│                        and r.host == "web-1")                    │
│      |> aggregateWindow(every: 5m, fn: mean)                     │
│      |> yield()                                                  │
│                                                                  │
│  Retention Policies:                                             │
│    - Auto-delete data older than X days                          │
│    - E.g., raw data: 7 days, hourly rollups: 1 year             │
│                                                                  │
│  Continuous Queries / Tasks:                                     │
│    - Pre-aggregate data on write (downsample 1s → 1min → 1hr)   │
│    - Reduces storage and query latency for historical data       │
└──────────────────────────────────────────────────────────────────┘
```

### TimescaleDB

```
┌──────────────────────────────────────────────────────────────────┐
│                      TimescaleDB                                 │
│                                                                  │
│  PostgreSQL extension -- full SQL + time-series optimizations.   │
│  Best of both worlds: relational features + time-series perf.    │
│                                                                  │
│  Hypertables:                                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Hypertable (virtual table)                  │       │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │       │
│  │  │ Chunk 1 │ │ Chunk 2 │ │ Chunk 3 │ │ Chunk 4 │   │       │
│  │  │ Jan 1-7 │ │ Jan 8-14│ │Jan 15-21│ │Jan 22-31│   │       │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │       │
│  │  Auto-partitioned by time interval                    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  -- Create hypertable                                            │
│  CREATE TABLE metrics (                                          │
│    time        TIMESTAMPTZ NOT NULL,                             │
│    device_id   TEXT,                                             │
│    temperature DOUBLE PRECISION,                                 │
│    humidity    DOUBLE PRECISION                                  │
│  );                                                              │
│  SELECT create_hypertable('metrics', 'time');                    │
│                                                                  │
│  -- Standard SQL works                                           │
│  SELECT time_bucket('1 hour', time) AS hour,                     │
│         device_id,                                               │
│         AVG(temperature) AS avg_temp                             │
│  FROM metrics                                                    │
│  WHERE time > NOW() - INTERVAL '24 hours'                        │
│  GROUP BY hour, device_id                                        │
│  ORDER BY hour DESC;                                             │
│                                                                  │
│  Compression: 90-95% storage reduction for old data              │
│  Continuous Aggregates: materialized views auto-updated on write │
│  JOINs: with regular PostgreSQL tables (huge advantage)          │
└──────────────────────────────────────────────────────────────────┘
```

### Prometheus

```
┌──────────────────────────────────────────────────────────────────┐
│                       Prometheus                                 │
│                                                                  │
│  Pull-based monitoring system with built-in alerting.            │
│                                                                  │
│  Architecture:                                                   │
│  ┌────────────┐  scrape (pull)   ┌────────────┐                 │
│  │ Prometheus │◄─────────────────│  Targets   │                 │
│  │   Server   │  /metrics (HTTP) │ (app, node,│                 │
│  │            │                  │  k8s pods)  │                 │
│  └─────┬──────┘                  └────────────┘                 │
│        │                                                         │
│   ┌────┴────┐                                                    │
│   ▼         ▼                                                    │
│ ┌─────┐ ┌──────────┐                                            │
│ │TSDB │ │Alerting  │──► AlertManager ──► PagerDuty/Slack        │
│ │(local│ │Rules     │                                            │
│ │disk) │ └──────────┘                                            │
│ └──┬───┘                                                         │
│    │                                                             │
│    ▼                                                             │
│ ┌──────────┐                                                     │
│ │ Grafana  │   Visualization                                    │
│ └──────────┘                                                     │
│                                                                  │
│  PromQL examples:                                                │
│    # Current CPU usage rate (per second over 5 min)              │
│    rate(node_cpu_seconds_total{mode="idle"}[5m])                 │
│                                                                  │
│    # 99th percentile request latency                             │
│    histogram_quantile(0.99,                                      │
│      rate(http_request_duration_seconds_bucket[5m]))             │
│                                                                  │
│    # Alert: high error rate                                      │
│    sum(rate(http_requests_total{status=~"5.."}[5m]))             │
│    / sum(rate(http_requests_total[5m])) > 0.05                   │
│                                                                  │
│  Pull vs Push:                                                   │
│    Pull (Prometheus): server scrapes targets at intervals        │
│      + Centralized control of what's monitored                   │
│      + Easy to detect if target is down (scrape fails)           │
│      - Requires service discovery                                │
│    Push (StatsD/Graphite): targets send metrics to server        │
│      + Works behind firewalls, short-lived jobs                  │
│      - Harder to know if target is down vs not sending           │
│                                                                  │
│  Limitation: Local storage only (15-day default retention).      │
│  For long-term: Thanos, Cortex, or VictoriaMetrics              │
└──────────────────────────────────────────────────────────────────┘
```

### Time-Series Use Cases

```
IoT / Sensors:       Temperature, pressure, GPS coordinates
Infrastructure:      CPU, memory, disk, network metrics
Application:         Request latency, error rates, throughput
Financial:           Stock prices, trade volumes, order books
Real-time analytics: Page views, click streams, conversion funnels
Energy:              Smart grid usage, solar output, battery levels
```

---

## Vector Databases

### What Are Vector Databases?

Databases designed to store and efficiently search **high-dimensional vectors**
(embeddings). An embedding is a numerical representation of data (text, images,
audio) that captures semantic meaning.

```
┌──────────────────────────────────────────────────────────────────┐
│                    Vector Database Concept                       │
│                                                                  │
│  "How to cook pasta" ──[Embedding Model]──► [0.12, -0.87, 0.45, │
│                                               0.33, ..., -0.21] │
│                                               (768 dimensions)   │
│                                                                  │
│  Similarity search: find vectors closest to query vector         │
│                                                                  │
│        Query: "Italian food recipes"                             │
│           │                                                      │
│           ▼                                                      │
│    ┌──────────────┐                                              │
│    │Vector DB     │  1. "How to cook pasta"     (dist: 0.05)     │
│    │              │  2. "Best pizza dough"       (dist: 0.12)     │
│    │ 10M vectors  │  3. "Italian wine pairing"  (dist: 0.18)     │
│    │              │  4. "Rome travel guide"      (dist: 0.34)     │
│    └──────────────┘                                              │
│                                                                  │
│  Distance metrics:                                               │
│    Cosine Similarity:  cos(A,B) = A.B / (|A|*|B|)              │
│      - Measures angle between vectors (direction, not magnitude)│
│      - Best for text embeddings (normalized)                    │
│    Dot Product:        A.B = sum(a_i * b_i)                     │
│      - Faster than cosine, works if vectors are normalized       │
│    Euclidean (L2):     sqrt(sum((a_i - b_i)^2))                │
│      - Actual distance in space                                  │
│      - Good for image embeddings                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Approximate Nearest Neighbor (ANN) Algorithms

Exact nearest neighbor search is O(n*d) -- too slow for millions of vectors.
ANN trades a small amount of accuracy for massive speed improvements.

```
┌──────────────────┬──────────────────────────────────────────────┐
│ Algorithm        │ How It Works                                  │
├──────────────────┼──────────────────────────────────────────────┤
│ HNSW             │ Hierarchical Navigable Small World graph      │
│ (most popular)   │ Multiple layers of skip-list-like graph       │
│                  │ Top layer: few nodes, long-range connections   │
│                  │ Bottom layer: all nodes, short connections     │
│                  │ Search: start at top, greedily descend         │
│                  │ Recall: ~99%+ with good parameters             │
│                  │ Trade-off: high memory usage                   │
│                  │                                               │
│                  │  Layer 2:  A ─────────── D                    │
│                  │  Layer 1:  A ──── C ──── D ──── F             │
│                  │  Layer 0:  A ─ B ─ C ─ D ─ E ─ F ─ G         │
├──────────────────┼──────────────────────────────────────────────┤
│ IVF              │ Inverted File Index                           │
│ (Inverted File)  │ Cluster vectors into partitions (Voronoi)     │
│                  │ At query time, only search nearest partitions  │
│                  │ nprobe parameter controls accuracy/speed       │
│                  │ Lower memory than HNSW                         │
├──────────────────┼──────────────────────────────────────────────┤
│ PQ               │ Product Quantization                          │
│ (compression)    │ Split vector into subvectors, quantize each   │
│                  │ Reduces memory by 10-100x                     │
│                  │ Lower accuracy, often combined with IVF       │
│                  │ (IVF-PQ: partition + compress)                 │
├──────────────────┼──────────────────────────────────────────────┤
│ ScaNN            │ Google's algorithm: anisotropic quantization  │
│                  │ + tree-based partitioning                     │
│                  │ Best accuracy-speed trade-off in benchmarks    │
└──────────────────┴──────────────────────────────────────────────┘
```

### Vector Database Landscape

```
┌──────────────┬────────────────────────────────────────────────────┐
│ Database     │ Key Characteristics                                │
├──────────────┼────────────────────────────────────────────────────┤
│ Pinecone     │ Fully managed, serverless, simple API              │
│              │ Supports metadata filtering + vector search        │
│              │ No self-hosting option                             │
├──────────────┼────────────────────────────────────────────────────┤
│ Milvus       │ Open-source, highly scalable (billions of vectors)│
│              │ Multiple index types (HNSW, IVF, PQ, DiskANN)    │
│              │ Distributed architecture with separation of       │
│              │ storage and compute                               │
├──────────────┼────────────────────────────────────────────────────┤
│ Weaviate     │ Open-source, built-in vectorizer modules          │
│              │ GraphQL API, hybrid search (vector + keyword)     │
│              │ Generative search (RAG built-in)                  │
├──────────────┼────────────────────────────────────────────────────┤
│ Chroma       │ Lightweight, developer-friendly, embedded mode    │
│              │ Great for prototyping and small-scale RAG          │
│              │ Python-native API                                 │
├──────────────┼────────────────────────────────────────────────────┤
│ pgvector     │ PostgreSQL extension for vector similarity search │
│              │ Store vectors alongside relational data            │
│              │ Use existing PostgreSQL infrastructure             │
│              │ Good for < 10M vectors, JOINs with regular tables │
└──────────────┴────────────────────────────────────────────────────┘
```

### Vector Database Use Cases

```
1. RAG (Retrieval-Augmented Generation) for LLMs:
   User question → embed → search vector DB → retrieve context → feed to LLM

   "What is our refund policy?"
        │
        ▼ embed
   [0.12, -0.45, ...]
        │
        ▼ search
   ┌─────────────┐
   │ Vector DB   │──► "Refund policy doc paragraph 3..."
   │ (company    │
   │  docs)      │
   └─────────────┘
        │
        ▼ augment prompt
   LLM: "Based on our policy: Refunds are available within 30 days..."

2. Image similarity search:
   Upload image → embed with CLIP → find visually similar products

3. Recommendation systems:
   User behavior → embed → find similar users/items

4. Anomaly detection:
   Embed normal behavior → flag vectors far from clusters

5. Deduplication:
   Embed documents → find near-duplicates by distance threshold
```

---

## Search Engines

### Elasticsearch

Elasticsearch is a distributed search and analytics engine built on Apache Lucene.
Not technically a "database" but often used as one for search-heavy workloads.

```
┌──────────────────────────────────────────────────────────────────┐
│                 Elasticsearch Architecture                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    Cluster                              │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│  │  │  Node 1  │  │  Node 2  │  │  Node 3  │             │     │
│  │  │ (master) │  │ (data)   │  │ (data)   │             │     │
│  │  └──────────┘  └──────────┘  └──────────┘             │     │
│  │                                                        │     │
│  │  Index: "products" (like a DB table)                   │     │
│  │  ┌──────────────────────────────────────┐             │     │
│  │  │  Shard 0 (P)  │  Shard 1 (P)       │              │     │
│  │  │  [Node 1]     │  [Node 2]          │              │     │
│  │  ├───────────────┼────────────────────│              │     │
│  │  │  Shard 0 (R)  │  Shard 1 (R)       │              │     │
│  │  │  [Node 3]     │  [Node 1]          │              │     │
│  │  └──────────────────────────────────────┘             │     │
│  │  P = Primary shard    R = Replica shard               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  Hierarchy: Cluster → Nodes → Indices → Shards → Segments       │
│  Shard = Lucene index (independent search unit)                  │
│  Segment = immutable file within a shard (merged periodically)   │
└──────────────────────────────────────────────────────────────────┘
```

### Inverted Index

```
The core data structure that enables fast full-text search.

Documents:
  Doc 1: "Redis is a fast key-value store"
  Doc 2: "MongoDB is a document store"
  Doc 3: "Redis and MongoDB are NoSQL databases"

Inverted Index:
┌──────────┬──────────────┐
│ Term     │ Postings     │
├──────────┼──────────────┤
│ redis    │ [Doc1, Doc3] │
│ fast     │ [Doc1]       │
│ key      │ [Doc1]       │
│ value    │ [Doc1]       │
│ store    │ [Doc1, Doc2] │
│ mongodb  │ [Doc2, Doc3] │
│ document │ [Doc2]       │
│ nosql    │ [Doc3]       │
│ databases│ [Doc3]       │
└──────────┴──────────────┘

Search "redis store" → intersection/union of postings
  → Doc1 (both terms), Doc2 (store only), Doc3 (redis only)
  → BM25 ranking: Doc1 scores highest (both terms match)
```

### BM25 Ranking

```
BM25 (Best Matching 25) determines relevance score:

Score(D,Q) = SUM[ IDF(qi) * (tf * (k1+1)) / (tf + k1*(1-b+b*dl/avgdl)) ]

Where:
  IDF(qi) = log((N - n(qi) + 0.5) / (n(qi) + 0.5))
    - Inverse Document Frequency: rare terms score higher
    - N = total docs, n(qi) = docs containing term qi

  tf = term frequency in document (more occurrences = higher score)
  dl = document length (longer docs penalized)
  avgdl = average document length
  k1 = term frequency saturation (default 1.2)
  b  = length normalization (default 0.75)

Intuition: A document scores high if it contains
  - Rare terms from the query (high IDF)
  - Those terms appear frequently (high tf)
  - The document is not excessively long
```

### Near Real-Time Search

```
Write path:
  1. Document indexed → written to in-memory buffer
  2. Every 1 second (refresh_interval): buffer → new Lucene segment
  3. New segment is searchable (near real-time, not instant)
  4. Segments periodically merged (reduces files, reclaims space)

  Write ──► Buffer ──[1s refresh]──► Segment ──► Searchable
                                        │
                                   [background merge]
                                        │
                                   Larger Segment

  To make immediately searchable: POST /index/_refresh
  (but expensive -- don't do it on every write)
```

### Elasticsearch Query Examples

```json
// Full-text search with relevance
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "wireless bluetooth headphones" } }
      ],
      "filter": [
        { "range": { "price": { "lte": 100 } } },
        { "term": { "in_stock": true } }
      ],
      "should": [
        { "match": { "brand": "Sony" } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "price": "asc" }
  ],
  "size": 20
}

// Aggregation: avg price per category
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category.keyword", "size": 10 },
      "aggs": {
        "avg_price": { "avg": { "field": "price" } },
        "price_ranges": {
          "histogram": { "field": "price", "interval": 50 }
        }
      }
    }
  }
}
```

### Search Engine Use Cases

```
Full-text search:       E-commerce product search, documentation search
Log analytics:          ELK Stack (Elasticsearch + Logstash + Kibana)
Application search:     Autocomplete, faceted navigation, fuzzy matching
SIEM:                   Security event analysis, threat detection
Observability:          Distributed tracing (Jaeger uses ES backend)
Geospatial search:      "Find restaurants within 5km"
```

---

## Comparison Summary

```
┌───────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│               │ Graph        │ Time-Series  │ Vector       │ Search       │
├───────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Optimized for │ Relationships│ Time-stamped │ Similarity   │ Full-text    │
│               │ & traversal  │ data, writes │ search       │ relevance    │
│ Examples      │ Neo4j        │ InfluxDB,    │ Pinecone,    │ Elasticsearch│
│               │              │ TimescaleDB  │ Milvus       │              │
│ Query model   │ Graph trvsl  │ Time windows │ ANN search   │ Inverted idx │
│ Write pattern │ Graph CRUD   │ Append-only  │ Batch upsert │ Index + merge│
│ Typical scale │ Millions of  │ Billions of  │ Millions of  │ Billions of  │
│               │ nodes/edges  │ data points  │ vectors      │ documents    │
│ Latency       │ ms (local    │ ms           │ ms (ANN)     │ ms           │
│               │ traversal)   │              │              │              │
└───────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```
