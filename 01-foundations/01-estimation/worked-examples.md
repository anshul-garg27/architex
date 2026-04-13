# Worked Examples: Back-of-the-Envelope Estimation

Five fully worked examples following the 5-step framework. Each one mirrors the kind of
estimation you would perform in the first 5 minutes of a system design interview.

Key reminders before we start:
- 1 day = 86,400 seconds ~ 10^5 seconds
- 1M requests/day ~ 12 requests/sec
- Always round. Precision does not matter; the right order of magnitude does.

---

## Example 1: Twitter-like Social Media Platform

**Scenario:** Design estimation for a Twitter-scale system with posting, timeline
reading, and search.

### Step 1: Assumptions

| Parameter               | Value              | Justification                         |
|-------------------------|--------------------|---------------------------------------|
| Total users             | 1.5 Billion        | Twitter-scale                         |
| DAU                     | 500 Million         | ~33% of total users                   |
| Tweets per user/day     | 2                   | Most users tweet rarely; avg is low   |
| Timeline reads/user/day | 20                  | Open app ~10x, scroll ~2 pages each   |
| Searches per user/day   | 3                   |                                       |
| Avg tweet size          | 500 bytes           | 280 chars + user_id + timestamp + meta|
| Images (10% of tweets)  | 300 KB each         | Compressed JPEG                       |
| Retention               | 5 years             |                                       |
| Replication factor      | 3x                  | Standard for durability               |

### Step 2: QPS

```
Tweet writes:
  500M DAU x 2 tweets/day = 1 Billion tweets/day
  Write QPS = 1B / 86,400 ~ 12,000 QPS
  Peak write QPS = 12,000 x 5 = 60,000 QPS (major event)

Timeline reads:
  500M x 20 reads/day = 10 Billion reads/day
  Read QPS = 10B / 86,400 ~ 116,000 QPS
  Peak read QPS = 116,000 x 5 = ~580,000 QPS

Search:
  500M x 3/day = 1.5B / 86,400 ~ 17,000 QPS
```

### Step 3: Storage

```
Text storage:
  1B tweets/day x 500 bytes = 500 GB/day

Image storage:
  1B tweets/day x 10% x 300 KB = 30 TB/day  <-- dominates!

Daily total: ~30.5 TB/day

5-year storage:
  Text:   500 GB/day x 365 x 5 = ~912 TB x 3 (replication) = ~2.7 PB
  Images: 30 TB/day x 365 x 5  = ~54.75 PB x 3 (replication) = ~164 PB
  Total:  ~167 PB (images dominate by 60x)
```

### Step 4: Bandwidth

```
Incoming (writes):
  12,000 QPS x 500B = 6 MB/s  (text, trivial)
  12,000 x 0.10 x 300KB = 360 MB/s  (images, ~3 Gbps)

Outgoing (reads):
  Timeline returns ~20 tweets with metadata ~ 10 KB per request
  116,000 QPS x 10 KB = 1.16 GB/s ~ 10 Gbps
  
  With embedded images (assume 5 images shown per page load):
  116,000 x 5 x 50KB (thumbnail) = 29 GB/s ~ 232 Gbps
  (This is why you need a CDN -- origin serves metadata, CDN serves images)
```

### Step 5: Caching

```
Hot tweets (20% of daily data):
  Daily unique tweets read = ~200M unique tweets (deduped from 10B reads)
  Cache 20% = 40M tweets x 500B = 20 GB  (text cache is small)

Timeline cache:
  Cache top 800 tweets per active celebrity/news account
  ~1M accounts x 800 tweets x 500B = 400 GB

User metadata cache:
  500M active users x 1KB = 500 GB

Total cache: ~1 TB --> 4-8 Redis nodes (128-256 GB each)
```

### Conclusion

| Resource          | Estimate                   |
|-------------------|----------------------------|
| Write QPS         | ~12K avg, ~60K peak        |
| Read QPS          | ~116K avg, ~580K peak      |
| Storage (5 yr)    | ~167 PB (image-dominated)  |
| Bandwidth (out)   | ~10 Gbps origin + CDN      |
| Cache              | ~1 TB (4-8 Redis nodes)   |
| DB servers (write) | ~12-60 sharded DB nodes   |
| App servers        | ~60-120 servers            |

---

## Example 2: URL Shortener (like bit.ly)

**Scenario:** Service that creates short URLs and redirects users.

### Step 1: Assumptions

| Parameter               | Value              | Justification                        |
|-------------------------|--------------------|--------------------------------------|
| New URLs created/day    | 100 Million         | High-volume shortener                |
| Read:Write ratio        | 10:1                | Each URL clicked ~10 times           |
| URL mapping size        | 100 bytes           | short(7B) + long(80B) + metadata     |
| Short URL length        | 7 characters        | base62^7 = 3.5 trillion combinations |
| Retention               | 10 years            | URLs should work "forever"           |
| Average redirect        | 1 HTTP 301, ~500B   | Small response                       |

### Step 2: QPS

```
Write QPS = 100M / 86,400 ~ 1,200 QPS
Peak write QPS = 1,200 x 3 = 3,600 QPS

Read QPS = 1,200 x 10 = 12,000 QPS
Peak read QPS = 12,000 x 3 = 36,000 QPS
```

### Step 3: Storage

```
Daily: 100M URLs x 100 bytes = 10 GB/day

10-year total: 10 GB x 365 x 10 = 36.5 TB
With replication (3x): ~110 TB
Total URLs stored: 100M x 365 x 10 = 365 Billion URLs
```

### Step 4: Bandwidth

```
Incoming: 1,200 QPS x 100B = 120 KB/s  (negligible)
Outgoing: 12,000 QPS x 500B = 6 MB/s   (very manageable)
Peak:     36,000 QPS x 500B = 18 MB/s
```

### Step 5: Caching

```
80/20 rule: 20% of URLs get 80% of traffic
Daily reads: 12,000 QPS x 86,400 = ~1 Billion reads/day
Unique URLs accessed daily: ~100M (assume roughly all new + popular old)
Cache 20%: 20M URLs x 100 bytes = 2 GB

This easily fits in a SINGLE Redis instance.
Cache hit rate expected: 90%+
```

### Conclusion

| Resource          | Estimate                  |
|-------------------|---------------------------|
| Write QPS         | ~1.2K avg, ~3.6K peak     |
| Read QPS          | ~12K avg, ~36K peak       |
| Storage (10 yr)   | ~110 TB                   |
| Bandwidth         | ~18 MB/s peak             |
| Cache             | ~2 GB (single Redis node) |
| DB servers        | 2-3 sharded DB nodes      |
| App servers       | 5-10 servers              |

> This is a deceptively simple system. The hard parts are key generation (uniqueness)
> and analytics (tracking clicks), not capacity.

---

## Example 3: YouTube-like Video Platform

**Scenario:** Video upload, storage, transcoding, and streaming at scale.

### Step 1: Assumptions

| Parameter                | Value              | Justification                       |
|--------------------------|--------------------|-------------------------------------|
| DAU                      | 800 Million         | YouTube-scale                       |
| Videos uploaded/day      | 500,000             | ~500K creators upload daily         |
| Avg video length         | 5 minutes           | Short-to-medium content             |
| Avg raw video size       | 250 MB              | 5 min x 50 MB/min (HD)             |
| Transcoded sizes (total) | 3x raw              | Multiple resolutions: 240p-4K       |
| Videos watched/user/day  | 10                  | ~50 minutes of watch time           |
| Avg streamed video chunk | 10 MB               | 1 minute of adaptive streaming      |
| Retention                | Indefinite          | Videos stored forever               |
| Replication              | 3x                  |                                     |

### Step 2: QPS

```
Upload QPS = 500,000 / 86,400 ~ 6 QPS  (uploads are slow, long-running)
  But upload bandwidth matters more than QPS here.

Video watch requests:
  800M DAU x 10 videos/day = 8 Billion views/day
  Video QPS = 8B / 86,400 ~ 93,000 QPS
  
  Each video triggers multiple chunk requests:
  Avg 5 min video = ~50 chunk requests
  Chunk QPS = 93,000 x 50 = ~4.6 Million chunk requests/sec
  (Served almost entirely by CDN)

API QPS (search, recommendations, comments):
  800M x 30 API calls/day = 24B / 86,400 ~ 280,000 QPS
```

### Step 3: Storage

```
Daily raw upload: 500K videos x 250 MB = 125 TB/day
Transcoded copies: 125 TB x 3 = 375 TB/day
Total daily ingest: ~500 TB/day

Annual: 500 TB x 365 = ~182 PB/year
5 years: ~910 PB ~ 1 Exabyte (with replication: ~3 EB)

Metadata storage (titles, descriptions, stats):
  500K videos/day x 10 KB metadata = 5 GB/day  (trivial vs. video)
```

### Step 4: Bandwidth

```
Upload bandwidth:
  6 QPS x 250 MB avg = 1.5 GB/s = ~12 Gbps ingest

Streaming bandwidth (this is the monster number):
  4.6M chunk requests/sec x 10 MB avg... but CDN handles this.
  
  Origin to CDN bandwidth:
  Assume 5% cache miss rate: 4.6M x 0.05 x 10 MB = 2.3 TB/s
  This is why YouTube has its own global CDN infrastructure.
  
  Total egress (CDN edge to users):
  4.6M x 10 MB = 46 TB/s = ~368 Tbps
  (This is the scale that requires thousands of CDN edge servers globally)
```

### Step 5: Caching

```
Video metadata cache:
  Top 20% of videos accessed daily
  ~10M popular videos x 10 KB = 100 GB

Thumbnail cache:
  10M x 50 KB thumbnail = 500 GB

Video content caching is done at CDN level, not application cache.
CDN stores the most-watched videos at edge locations worldwide.

Application cache: ~600 GB --> 3-5 Redis nodes
```

### Conclusion

| Resource            | Estimate                         |
|---------------------|----------------------------------|
| Upload QPS          | ~6 QPS (but 12 Gbps ingest)     |
| Streaming QPS       | ~4.6M chunk req/s (CDN)         |
| Storage (5 yr)      | ~3 Exabytes                      |
| Bandwidth (CDN)     | ~368 Tbps                        |
| Cache (app-level)   | ~600 GB                          |
| Transcoding cluster | 500K jobs/day, ~100 machines     |

> The key insight: YouTube-scale is a CDN and storage problem, not a QPS problem.

---

## Example 4: WhatsApp-like Messaging System

**Scenario:** Real-time messaging with text, images, and group chats.

### Step 1: Assumptions

| Parameter                | Value              | Justification                       |
|--------------------------|--------------------|-------------------------------------|
| Total users              | 2 Billion           | WhatsApp-scale                      |
| DAU                      | 1 Billion           | 50% daily active rate               |
| Messages sent/user/day   | 50                  | Across all conversations            |
| Group messages           | 30% of messages     | Group size avg ~20 people           |
| Avg text message size    | 200 bytes           | ~100 chars + metadata               |
| Images (15% of messages) | 200 KB              | Compressed                          |
| Retention                | 30 days on server   | Messages stored on device long-term |
| Connection model         | Persistent WebSocket| Real-time delivery                  |

### Step 2: QPS

```
Messages sent:
  1B DAU x 50 msgs/day = 50 Billion messages/day
  Message QPS = 50B / 86,400 ~ 580,000 QPS (writes)

Messages delivered (including group fan-out):
  70% 1-to-1: 35B messages delivered to 1 person = 35B
  30% group:  15B messages x avg 20 recipients   = 300B deliveries
  Total deliveries: 335B/day
  Delivery QPS = 335B / 86,400 ~ 3.9 Million QPS

Peak: ~3.9M x 3 = ~12 Million delivery events/sec
(This is why WhatsApp uses Erlang -- built for millions of concurrent connections)
```

### Step 3: Storage

```
Text messages:
  50B msgs/day x 200B = 10 TB/day

Image messages:
  50B x 0.15 x 200KB = 1.5 PB/day  (images dominate again)

30-day retention on server:
  Text: 10 TB x 30 = 300 TB
  Images: 1.5 PB x 30 = 45 PB
  Total: ~45 PB (with replication x3 = ~135 PB active storage)

After 30 days, messages deleted from server (stored on device).
This "device-first" architecture is what makes WhatsApp feasible.
```

### Step 4: Bandwidth

```
Incoming (messages sent):
  Text:  580K QPS x 200B = 116 MB/s ~ 1 Gbps
  Images: 580K x 0.15 x 200KB = 17.4 GB/s ~ 140 Gbps

Outgoing (messages delivered):
  Text:  3.9M QPS x 200B = 780 MB/s ~ 6 Gbps
  Images: 3.9M x 0.15 x 200KB = 117 GB/s ~ 940 Gbps
  (Again, images dominate -- need CDN + edge caching for media)
```

### Step 5: Caching

```
Recent messages cache (last 24 hours, text only):
  10 TB/day in text messages -- but most are delivered instantly
  Cache undelivered messages for offline users:
  Assume 20% users offline = 200M users
  Avg 50 undelivered msgs x 200B = 10 KB per user
  200M x 10 KB = 2 TB undelivered message queue

User session / presence cache:
  1B active connections x 200B session state = 200 GB

Total cache: ~2.2 TB --> 10-15 Redis nodes
```

### Conclusion

| Resource            | Estimate                          |
|---------------------|-----------------------------------|
| Message write QPS   | ~580K avg                         |
| Delivery QPS        | ~3.9M avg, ~12M peak             |
| Active storage      | ~135 PB (30-day window)           |
| Ingest bandwidth    | ~140 Gbps                         |
| Egress bandwidth    | ~940 Gbps                         |
| Cache               | ~2.2 TB                           |
| WebSocket servers   | ~2,000-5,000 (1M conn/server)    |
| Message brokers     | 100+ Kafka/custom brokers         |

> Key insight: WhatsApp's 30-day server retention and device-primary storage
> is a critical architectural decision that makes this system viable.

---

## Example 5: Uber-like Ride-Sharing Platform

**Scenario:** Ride matching, real-time driver location, ETA calculation, trip management.

### Step 1: Assumptions

| Parameter                  | Value              | Justification                     |
|----------------------------|--------------------|-----------------------------------|
| DAU (riders)               | 30 Million          | Uber-scale city coverage          |
| Active drivers             | 5 Million           | Online and available              |
| Rides per rider/day        | 2                   | Average across all riders         |
| Driver location updates    | Every 4 seconds     | GPS ping frequency                |
| Driver online hours/day    | 8 hours avg         | Active driving time               |
| Avg trip data              | 2 KB                | Route, fare, timestamps, metadata |
| Location update size       | 100 bytes           | lat, lng, timestamp, driver_id    |

### Step 2: QPS

```
Ride requests:
  30M riders x 2 rides/day = 60M rides/day
  Ride QPS = 60M / 86,400 ~ 700 QPS (ride creation)

Driver location updates:
  5M drivers x (8 hrs x 3600s / 4s per update) = 5M x 7,200 = 36 Billion updates/day
  Location QPS = 36B / 86,400 ~ 417,000 QPS  <-- the dominant write load

ETA / matching queries:
  Each ride request triggers ~50 nearby-driver queries
  700 x 50 = 35,000 QPS (geo-spatial queries)

Map tile requests:
  30M riders x 10 tile loads/day = 300M / 86,400 ~ 3,500 QPS
  (Mostly served by CDN / cached)

Total write QPS: ~420,000 (location-dominated)
Total read QPS:  ~40,000 (matching + ETA)
```

### Step 3: Storage

```
Location data (ephemeral -- only current location matters):
  5M drivers x 100 bytes = 500 MB in memory (real-time state)
  Historical location (for analytics): 36B updates/day x 100B = 3.6 TB/day
  Retained 90 days: 3.6 TB x 90 = 324 TB

Trip data:
  60M rides/day x 2 KB = 120 GB/day
  5 years: 120 GB x 365 x 5 = 219 TB

User data:
  30M riders + 5M drivers = 35M x 2 KB = 70 GB (fits in memory)

Total persistent storage: ~550 TB (with 3x replication: ~1.6 PB)
```

### Step 4: Bandwidth

```
Location updates ingest:
  417,000 QPS x 100B = 41.7 MB/s ~ 330 Mbps

Matching / read responses:
  40,000 QPS x 1 KB = 40 MB/s ~ 320 Mbps

Map tiles (CDN):
  3,500 QPS x 50 KB = 175 MB/s ~ 1.4 Gbps (served from CDN edge)

Total origin bandwidth: ~1 Gbps (manageable without CDN for core)
```

### Step 5: Caching

```
Driver locations (in-memory geospatial index):
  5M drivers x 100 bytes = 500 MB
  This MUST be in memory for real-time matching. Use a geospatial
  data structure (geohash + in-memory grid or R-tree).

Rider session cache:
  30M active riders x 500B session = 15 GB

Surge pricing zones:
  ~10,000 zones x 1 KB = 10 MB (trivial)

ETA model cache:
  Road graph for top 500 cities ~ 50 GB

Total in-memory: ~65 GB --> 1-2 Redis nodes + dedicated geo-index service
```

### Key Architectural Note: Geo-Spatial Matching

```
+-------------------+     +-------------------+
|  Driver App       |     |  Rider App        |
|  GPS every 4s     |     |  Request ride     |
+--------+----------+     +--------+----------+
         |                         |
         v                         v
+-------------------+     +-------------------+
|  Location Service |---->|  Matching Service |
|  (write-heavy)    |     |  (geo-query)      |
|  417K writes/sec  |     |  "Find drivers    |
|  In-memory grid   |     |   within 3 km"    |
+-------------------+     +-------------------+
         |
         v
+-------------------+
|  Geohash Index    |
|  Partition by     |
|  geographic cell  |
+-------------------+
```

> The matching query ("find all drivers within 3 km of this rider") is a
> geospatial range query. Partition the world into cells (geohash or S2 cells)
> and keep an in-memory index of which drivers are in each cell.

### Conclusion

| Resource             | Estimate                        |
|----------------------|---------------------------------|
| Location write QPS   | ~417K avg                       |
| Matching read QPS    | ~35K-40K avg                    |
| Persistent storage   | ~1.6 PB (5 yr, with replication)|
| Bandwidth            | ~1 Gbps origin                  |
| In-memory state      | ~65 GB                          |
| Location servers     | ~50-100 (geospatial index)      |
| Matching servers     | ~20-50                          |
| Total servers        | ~200-400 across all services    |

> Key insight: Uber is a real-time geospatial system. The hard problem is not
> storage or bandwidth -- it is maintaining a global, low-latency, constantly
> updating geospatial index of millions of drivers.

---

## Cross-Example Summary

| System        | Dominant Challenge       | Write QPS  | Read QPS   | Storage (5yr) | Key Resource     |
|---------------|--------------------------|------------|------------|---------------|------------------|
| Twitter       | Fan-out on read/write    | 12K        | 116K       | ~167 PB       | CDN + Cache      |
| URL Shortener | Key generation           | 1.2K       | 12K        | ~110 TB       | Cache             |
| YouTube       | Video storage + CDN      | 6 (upload) | 4.6M chunk | ~3 EB         | CDN + Storage    |
| WhatsApp      | Concurrent connections   | 580K       | 3.9M       | ~135 PB (30d) | WebSocket servers|
| Uber          | Real-time geo-index      | 417K       | 40K        | ~1.6 PB       | Geo-index        |

> Every system has a single dominant bottleneck. The estimation should reveal
> what that bottleneck is, which then drives the architecture.
