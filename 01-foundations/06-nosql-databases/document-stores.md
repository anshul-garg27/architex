# Document Stores

## What Are Document Stores?

Document databases store data as **semi-structured documents** -- typically JSON,
BSON, or XML. Each document is self-contained, can have a different structure from
other documents in the same collection, and supports nested objects and arrays.

```
┌──────────────────────────────────────────────────────────────┐
│                    Document Store                            │
│                                                              │
│  Collection: "users"                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ {                                                      │ │
│  │   "_id": "ObjectId('6612a1...')",                      │ │
│  │   "name": "Alice",                                     │ │
│  │   "email": "alice@example.com",                        │ │
│  │   "address": {                      <-- nested object  │ │
│  │     "city": "Seattle",                                 │ │
│  │     "zip": "98101"                                     │ │
│  │   },                                                   │ │
│  │   "orders": [                       <-- nested array   │ │
│  │     { "id": "ORD-001", "total": 59.99 },              │ │
│  │     { "id": "ORD-002", "total": 124.50 }              │ │
│  │   ],                                                   │ │
│  │   "tags": ["premium", "early-adopter"]                 │ │
│  │ }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Key advantage: schema flexibility + natural data mapping    │
│  Documents map directly to objects in application code       │
└──────────────────────────────────────────────────────────────┘
```

**Why documents over rows?**
- No impedance mismatch -- document = application object
- Schema evolves without migrations (add fields freely)
- Related data stored together (no JOINs for common queries)
- Natural fit for content that varies in shape

---

## MongoDB Deep Dive

MongoDB is the most widely used document database. It stores documents in
**BSON** (Binary JSON) format, organized into **collections** within **databases**.

### BSON Format

```
JSON:                          BSON (Binary JSON):
{                              ┌─────────────────────────┐
  "name": "Alice",             │ Size: 48 bytes          │
  "age": 30,                   │ type:0x02 "name":"Alice"│
  "active": true               │ type:0x10 "age": 30     │
}                              │ type:0x08 "active": 1   │
                               │ 0x00 (terminator)       │
                               └─────────────────────────┘

BSON adds types not in JSON:
  - ObjectId (12-byte unique ID)
  - Date (64-bit integer, ms since epoch)
  - Decimal128 (128-bit decimal)
  - Binary data
  - Regular expressions
```

### Schema Design: Embedding vs Referencing

This is the **most important** design decision in MongoDB.

```
┌─────────────────────────────────────────────────────────────────┐
│           EMBEDDING (Denormalized)                              │
│                                                                 │
│  {                                                              │
│    "_id": "user:1001",                                          │
│    "name": "Alice",                                             │
│    "address": {                    <-- Embedded subdocument     │
│      "street": "123 Main St",                                   │
│      "city": "Seattle"                                          │
│    },                                                           │
│    "orders": [                     <-- Embedded array           │
│      { "id": "ORD-1", "total": 50.00, "items": [...] },        │
│      { "id": "ORD-2", "total": 75.00, "items": [...] }         │
│    ]                                                            │
│  }                                                              │
│                                                                 │
│  PROS: Single read fetches everything, atomic updates,          │
│        no JOINs, better read performance                        │
│  CONS: Document can grow unbounded (16MB limit!),               │
│        data duplication, updates to nested arrays are complex   │
│                                                                 │
│  USE WHEN:                                                      │
│    - 1:1 relationships (user has one address)                   │
│    - 1:few relationships (user has a few phone numbers)         │
│    - Data is always accessed together                           │
│    - Child data doesn't make sense without parent               │
├─────────────────────────────────────────────────────────────────┤
│           REFERENCING (Normalized)                              │
│                                                                 │
│  // users collection                                            │
│  { "_id": "user:1001", "name": "Alice" }                       │
│                                                                 │
│  // orders collection                                           │
│  { "_id": "ORD-1", "user_id": "user:1001", "total": 50.00 }   │
│  { "_id": "ORD-2", "user_id": "user:1001", "total": 75.00 }   │
│                                                                 │
│  PROS: No duplication, documents stay small,                    │
│        independent access to child entities                     │
│  CONS: Multiple queries or $lookup needed,                      │
│        no atomic cross-document updates (without transactions)  │
│                                                                 │
│  USE WHEN:                                                      │
│    - 1:many with unbounded "many" (user has 10K orders)         │
│    - Many:many relationships                                    │
│    - Child entities are accessed independently                  │
│    - Data changes frequently and is duplicated                  │
└─────────────────────────────────────────────────────────────────┘
```

**Decision Heuristic:**

```
Will the related data grow unboundedly?
  ├── YES ──► REFERENCE (separate collections)
  └── NO
       └── Is the data always read together?
            ├── YES ──► EMBED
            └── NO
                 └── Does the data change independently?
                      ├── YES ──► REFERENCE
                      └── NO  ──► EMBED
```

### Aggregation Pipeline

MongoDB's aggregation framework processes documents through a pipeline of stages.

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ $match  │───►│ $group  │───►│ $sort   │───►│$project │───►│ Result  │
│(filter) │    │(reduce) │    │(order)  │    │(shape)  │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

```javascript
// Revenue per category, top 5, for the last 30 days
db.orders.aggregate([
  // Stage 1: Filter recent orders
  { $match: {
      status: "completed",
      created_at: { $gte: ISODate("2026-03-07") }
  }},

  // Stage 2: Flatten order items
  { $unwind: "$items" },

  // Stage 3: Group by category, sum revenue
  { $group: {
      _id: "$items.category",
      total_revenue: { $sum: "$items.price" },
      order_count: { $sum: 1 },
      avg_price: { $avg: "$items.price" }
  }},

  // Stage 4: Sort by revenue descending
  { $sort: { total_revenue: -1 } },

  // Stage 5: Top 5 only
  { $limit: 5 },

  // Stage 6: Reshape output
  { $project: {
      category: "$_id",
      total_revenue: { $round: ["$total_revenue", 2] },
      order_count: 1,
      avg_price: { $round: ["$avg_price", 2] },
      _id: 0
  }}
])

// Other powerful stages:
//   $lookup    -- left outer join to another collection
//   $addFields -- add computed fields
//   $bucket    -- group into ranges (histogram)
//   $facet     -- run multiple pipelines in parallel
//   $merge     -- write results to another collection
```

### Indexing

```
┌──────────────────┬───────────────────────────────────────────────┐
│ Index Type       │ Use Case                                      │
├──────────────────┼───────────────────────────────────────────────┤
│ Single Field     │ db.users.createIndex({ email: 1 })            │
│                  │ Most common; speeds up queries on one field    │
├──────────────────┼───────────────────────────────────────────────┤
│ Compound         │ db.orders.createIndex({ user_id: 1,           │
│                  │   created_at: -1 })                            │
│                  │ Supports queries on prefix of index fields     │
├──────────────────┼───────────────────────────────────────────────┤
│ Multikey (Array) │ db.posts.createIndex({ tags: 1 })             │
│                  │ Auto-created when field contains array;        │
│                  │ one entry per array element                    │
├──────────────────┼───────────────────────────────────────────────┤
│ Text             │ db.articles.createIndex({ body: "text" })     │
│                  │ Full-text search with stemming + stop words    │
├──────────────────┼───────────────────────────────────────────────┤
│ Geospatial       │ db.stores.createIndex({ location: "2dsphere"})│
│ (2dsphere)       │ Queries: $near, $geoWithin, $geoIntersects    │
├──────────────────┼───────────────────────────────────────────────┤
│ Hashed          │ db.data.createIndex({ _id: "hashed" })         │
│                  │ Used for hash-based sharding                   │
├──────────────────┼───────────────────────────────────────────────┤
│ TTL              │ db.sessions.createIndex({ expires: 1 },       │
│                  │   { expireAfterSeconds: 3600 })                │
│                  │ Auto-delete documents after TTL                │
├──────────────────┼───────────────────────────────────────────────┤
│ Unique           │ db.users.createIndex({ email: 1 },            │
│                  │   { unique: true })                            │
│                  │ Enforce uniqueness constraint                  │
└──────────────────┴───────────────────────────────────────────────┘

Index Selection Rule (ESR):
  E = Equality fields first
  S = Sort fields next
  R = Range fields last
  Example: { status: 1, created_at: -1, price: 1 }
           (status = equality, created_at = sort, price = range)
```

### Sharding

```
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Sharded Cluster                      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ mongos   │  │ mongos   │   Router (stateless, many)         │
│  │ (router) │  │ (router) │   Routes queries to correct shard  │
│  └────┬─────┘  └────┬─────┘                                    │
│       │              │                                          │
│       ▼              ▼                                          │
│  ┌──────────────────────┐                                      │
│  │   Config Servers     │   Stores metadata:                   │
│  │   (3-node replica    │   - chunk ranges                     │
│  │    set)              │   - shard locations                   │
│  └──────────────────────┘   - cluster config                   │
│       │         │        │                                      │
│       ▼         ▼        ▼                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │ Shard 1 │ │ Shard 2 │ │ Shard 3 │  Each shard = replica set│
│  │(replica │ │(replica │ │(replica │                           │
│  │  set)   │ │  set)   │ │  set)   │                           │
│  │         │ │         │ │         │                           │
│  │chunk A-F│ │chunk G-N│ │chunk O-Z│  Data split into chunks  │
│  └─────────┘ └─────────┘ └─────────┘  (default 128MB each)    │
└─────────────────────────────────────────────────────────────────┘

Shard Key Selection (CRITICAL):
  GOOD shard key:
    - High cardinality (many distinct values)
    - Even distribution (no hot spots)
    - Targeted queries (queries include shard key)

  BAD shard key:
    - Low cardinality (status: "active"/"inactive")
    - Monotonically increasing (ObjectId, timestamp)
      -- all writes go to last chunk (hot shard)

  Strategies:
    - Hashed sharding:  even distribution, but scatter-gather queries
    - Ranged sharding:  range queries efficient, risk of hot spots
    - Compound key:     { tenant_id: 1, _id: 1 } (balance + locality)
```

### Replica Sets

```
┌─────────────────────────────────────────────────────┐
│                 MongoDB Replica Set                  │
│                                                     │
│  ┌───────────┐                                      │
│  │  Primary  │◄── All writes go here                │
│  │           │                                      │
│  └─────┬─────┘                                      │
│        │  oplog replication (async)                  │
│   ┌────┴────┐                                       │
│   ▼         ▼                                       │
│  ┌──────────┐  ┌──────────┐                         │
│  │Secondary │  │Secondary │                         │
│  │    1     │  │    2     │                         │
│  └──────────┘  └──────────┘                         │
│                                                     │
│  Failover:                                          │
│    1. Primary becomes unreachable                   │
│    2. Secondaries call election (Raft-based)        │
│    3. Secondary with most recent oplog wins         │
│    4. New primary accepts writes (~10-12s failover) │
│                                                     │
│  Read Preferences:                                  │
│    primary           -- default, strong consistency │
│    primaryPreferred   -- primary if available        │
│    secondary          -- read from secondary         │
│    secondaryPreferred -- secondary if available      │
│    nearest            -- lowest latency node         │
└─────────────────────────────────────────────────────┘
```

### Change Streams for CDC

```javascript
// Watch for changes on the orders collection
const pipeline = [
  { $match: {
    operationType: { $in: ["insert", "update"] },
    "fullDocument.status": "shipped"
  }}
];

const changeStream = db.collection("orders").watch(pipeline, {
  fullDocument: "updateLookup"   // include full document on updates
});

changeStream.on("change", (event) => {
  console.log("Order shipped:", event.fullDocument.order_id);
  // Trigger notification, update search index, sync to warehouse
});

// Resume after failure using resume token
const resumeToken = event._id;
const stream = collection.watch(pipeline, { resumeAfter: resumeToken });
```

**Change Stream Use Cases:**
- Sync data to Elasticsearch for search
- Trigger serverless functions on data changes
- Event-driven microservices
- Real-time dashboards
- Cross-datacenter replication

---

## Firestore (Google Cloud)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Firestore                                │
│                                                                 │
│  - Serverless, fully managed document database                  │
│  - Real-time listeners: clients subscribe to document changes   │
│  - Offline support: local cache with automatic sync             │
│  - Security rules: declarative access control per document      │
│  - Hierarchical: collections → documents → subcollections       │
│  - Strong consistency (since Firestore "Native" mode)           │
│  - Auto-scaling, zero ops                                       │
│                                                                 │
│  Data Model:                                                    │
│    /users/{userId}                                              │
│      ├── name: "Alice"                                          │
│      ├── email: "alice@example.com"                             │
│      └── /orders/{orderId}        <-- subcollection             │
│            ├── total: 59.99                                     │
│            └── status: "shipped"                                │
│                                                                 │
│  Best for: Mobile/web apps needing real-time sync               │
│  Limitation: Complex queries limited, max 1 write/sec/document  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Couchbase

```
┌─────────────────────────────────────────────────────────────────┐
│                        Couchbase                                │
│                                                                 │
│  Hybrid: Document store + Key-Value cache in one platform       │
│                                                                 │
│  - KV operations: sub-millisecond CRUD by document ID           │
│  - N1QL: SQL-like query language for JSON documents             │
│  - Built-in caching layer (managed memcached)                   │
│  - Full-text search (integrated Bleve engine)                   │
│  - Eventing: server-side functions triggered by mutations       │
│  - Cross-datacenter replication (XDCR)                          │
│  - Memory-first architecture with async persistence             │
│                                                                 │
│  N1QL Example:                                                  │
│    SELECT u.name, COUNT(o) AS order_count                       │
│    FROM users u                                                 │
│    JOIN orders o ON u.id = o.user_id                            │
│    WHERE u.status = "active"                                    │
│    GROUP BY u.name                                              │
│    HAVING COUNT(o) > 5                                          │
│    ORDER BY order_count DESC                                    │
│                                                                 │
│  Best for: Apps needing both cache speed and rich queries       │
└─────────────────────────────────────────────────────────────────┘
```

---

## When to Use Document Stores

```
┌──────────────────────────────────────────────────────────────────┐
│                   Decision Guide                                 │
│                                                                  │
│  IDEAL USE CASES:                                                │
│  ────────────────                                                │
│  [x] Content management systems (articles, pages, media)         │
│  [x] User profiles (varying attributes per user type)            │
│  [x] Product catalogs (each product has different attributes)    │
│  [x] Event logging (each event type has different payload)       │
│  [x] Mobile/gaming backends (flexible, fast iteration)           │
│  [x] Configuration storage                                       │
│  [x] Real-time analytics with embedded aggregations              │
│                                                                  │
│  WHEN TO AVOID:                                                  │
│  ──────────────                                                  │
│  [ ] Highly relational data with many JOIN patterns              │
│  [ ] Financial transactions requiring strict ACID                │
│  [ ] Data with fixed, well-known schema (RDBMS may be simpler)  │
│  [ ] Heavy write-then-read of deeply nested arrays               │
│  [ ] Analytics requiring complex cross-collection aggregations   │
│                                                                  │
│  COMPARISON WITH KEY-VALUE:                                      │
│  ─────────────────────────                                       │
│  Key-Value: query by key only                                    │
│  Document:  query by any field, index any field, aggregation     │
│             pipeline, full-text search, geospatial               │
│             (basically: key-value with structured, queryable     │
│              values)                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Document Stores Comparison

```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Feature       │ MongoDB       │ Firestore     │ Couchbase     │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ Data format   │ BSON          │ JSON-like     │ JSON          │
│ Query lang    │ MQL + Agg Pipe│ Limited       │ N1QL (SQL)    │
│ Consistency   │ Strong (prim) │ Strong        │ Tunable       │
│ Real-time     │ Change Stream │ Native listen │ DCP + Events  │
│ Transactions  │ Multi-doc ACID│ Multi-doc     │ Multi-doc     │
│ Sharding      │ Manual shard  │ Automatic     │ Auto vBuckets │
│ Offline sync  │ Realm (mobile)│ Built-in      │ Lite (mobile) │
│ Search        │ Atlas Search  │ No            │ Built-in FTS  │
│ Ops burden    │ Medium        │ Zero (managed)│ Medium        │
│ Best for      │ General purpose│ Mobile/web   │ Cache + query │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

---

## Interview Tips

1. **"When MongoDB over PostgreSQL?"** -- Flexible schema, rapid iteration,
   document-oriented access patterns, horizontal scaling
2. **"Embedding vs referencing?"** -- Embed for data read together (1:1, 1:few);
   reference for 1:many unbounded, independent access, or many:many
3. **"How does MongoDB handle failover?"** -- Replica set election via Raft-based
   protocol; ~10-12 second failover; application retries needed
4. **"Shard key design?"** -- High cardinality, even distribution, queries should
   include shard key to avoid scatter-gather
5. **"MongoDB vs DynamoDB?"** -- MongoDB = flexible queries, aggregation pipeline,
   self-managed or Atlas; DynamoDB = serverless, single-digit ms, pay-per-request,
   but requires knowing all access patterns upfront
