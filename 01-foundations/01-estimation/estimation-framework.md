# Back-of-the-Envelope Estimation Framework

A structured 5-step method for estimating system capacity in interviews.
Follow these steps in order. Show your work. Round aggressively -- precision is not the
goal; the right order of magnitude is.

---

## Overview: The 5-Step Method

```
+------------------+     +---------------+     +------------------+
| 1. REQUIREMENTS  | --> | 2. QPS        | --> | 3. STORAGE       |
| DAU, features    |     | read + write  |     | per-record x     |
|                  |     |               |     |   volume x time  |
+------------------+     +---------------+     +------------------+
                                |                      |
                                v                      v
                         +---------------+     +------------------+
                         | 4. BANDWIDTH  |     | 5. CACHING       |
                         | QPS x payload |     | 80/20 rule       |
                         +---------------+     +------------------+
```

---

## Step 1: Define Requirements and Assumptions

Before you calculate anything, state your assumptions out loud. This grounds your
estimation and lets the interviewer course-correct early.

### What to define:

| Category         | Questions to ask / state                            | Example                   |
|------------------|-----------------------------------------------------|---------------------------|
| Scale            | DAU? Total registered users?                        | 500M DAU, 1.5B total      |
| Features         | Which features are we estimating?                   | Post, read feed, search   |
| User behavior    | Actions per user per day?                           | 5 posts, 100 feed views   |
| Data types       | Text? Images? Video?                                | Text + images             |
| Retention        | How long do we keep data?                           | 5 years                   |
| Availability     | What SLA? (affects replication)                     | 99.99%                    |
| Read/Write ratio | Read-heavy? Write-heavy? Balanced?                  | 10:1 reads to writes      |

### Template sentence for interviews:

> "Let me start with some assumptions. I'll assume we have X million DAU, each user
> performs Y actions per day, the average payload is Z bytes, and we need to retain
> data for N years. Does that sound reasonable?"

---

## Step 2: Estimate QPS (Queries Per Second)

### Core formula:

```
Write QPS  =  DAU  x  (write actions per user per day)  /  86,400
Read QPS   =  Write QPS  x  (Read:Write ratio)
Peak QPS   =  Average QPS  x  Peak Multiplier
```

### Peak Traffic Multipliers

| Scenario              | Multiplier | When it applies                          |
|-----------------------|------------|------------------------------------------|
| Normal daily peak     | 2x - 3x   | Lunchtime / evening surge                |
| Weekend/event peak    | 3x - 5x   | Sports events, holidays                  |
| Seasonal peak         | 5x - 10x  | Black Friday, New Year (e-commerce)      |
| Viral/breaking news   | 10x - 100x| Celebrity death, election night          |

### Read/Write Ratio Guidelines by System Type

| System Type              | Typical R:W Ratio | Why                                     |
|--------------------------|-------------------|-----------------------------------------|
| Social media feed        | 100:1 - 1000:1   | Many viewers per post                   |
| URL shortener            | 10:1 - 100:1     | URLs read far more than created         |
| Chat / messaging         | 1:1 - 5:1        | Each message sent is read ~1-5 times    |
| E-commerce catalog       | 100:1             | Browse >> purchase                      |
| Logging / analytics      | 1:10 - 1:100     | Write-heavy; reads are occasional       |
| File storage (Dropbox)   | 5:1 - 10:1       | Files read more than uploaded           |
| Ride-sharing locations   | 1:5 - 1:10       | Drivers push locations constantly       |

### Worked mini-example:

```
Given:  100M DAU, 5 writes/user/day, R:W = 10:1
Write QPS = 100M x 5 / 86,400 = 500M / 86,400 ~ 5,800 QPS
Read QPS  = 5,800 x 10 = 58,000 QPS
Peak QPS  = 58,000 x 3 = ~174,000 QPS (daily peak)
```

---

## Step 3: Estimate Storage

### Core formula:

```
Daily new data  =  (write QPS  x  86,400)  x  average record size
                =  writes/day  x  average record size

Total storage   =  daily new data  x  retention period (days)
                x  replication factor (typically 3x)
```

### Step-by-step:

1. **Determine the record size** -- break it down by fields
   ```
   Example tweet: user_id(8B) + tweet_id(8B) + text(280B)
                  + timestamp(8B) + metadata(50B) = ~354B ~ 400B
   ```

2. **Calculate daily volume**
   ```
   500M writes/day x 400B = 200 GB/day
   ```

3. **Apply retention period**
   ```
   200 GB/day x 365 days x 5 years = 365 TB
   ```

4. **Apply replication factor** (3x for durability)
   ```
   365 TB x 3 = ~1.1 PB
   ```

### Storage estimation tips:

- Round record sizes UP to account for indexing overhead (~20-30%)
- Media storage dominates text storage by 100-1000x
- Separate hot storage (SSD) from cold storage (HDD/S3)
- Database storage != raw data size (indexes add 20-50%)
- Consider compression ratios: text compresses ~5-10x, images/video barely compress

### Media storage multiplier:

```
If 10% of posts include a 300KB image:
  Image storage = 500M posts/day x 0.10 x 300KB = 15 TB/day
  Text storage  = 500M posts/day x 400B           = 0.2 TB/day
                                                    --------
  Images are 75x more storage than text
```

---

## Step 4: Estimate Bandwidth

### Core formula:

```
Incoming (write) bandwidth  =  Write QPS  x  average write payload size
Outgoing (read) bandwidth   =  Read QPS   x  average read response size
```

### Example:

```
Write: 5,800 QPS x 400 bytes  = 2.3 MB/s  (trivial)
Read:  58,000 QPS x 2 KB      = 116 MB/s  = ~1 Gbps

If images included in reads (10% of responses have a 300KB image):
  58,000 x 0.10 x 300KB = 1.74 GB/s = ~14 Gbps
```

### Bandwidth considerations:

| Factor                | Impact                                          |
|-----------------------|-------------------------------------------------|
| CDN offloading        | 80-95% of static content served from CDN edge   |
| Compression (gzip)    | Text payloads shrink ~5-10x                     |
| Pagination            | Feed returns 20-50 items, not everything        |
| Lazy loading          | Images/video load on scroll, not up front       |
| Multiple resolutions  | Thumbnails (10KB) vs full images (300KB)        |

> Tip: In interviews, always mention CDN. Most read bandwidth for media goes through
> CDN, not your origin servers.

---

## Step 5: Estimate Memory for Caching

### The 80/20 Rule (Pareto Principle)

```
80% of requests hit 20% of data.
Therefore: cache the top 20% of daily data to serve most requests from memory.
```

### Core formula:

```
Cache size  =  20%  x  (daily read requests  x  average response size)
```

### Example:

```
Daily reads   = 58,000 QPS x 86,400 = ~5 Billion reads/day
Unique items  = assume 20% are unique = 1 Billion unique items
Cache 20%     = 200M items x 2KB each = 400 GB

With Redis overhead (~2x raw data for hash table):
  ~800 GB --> need ~4-8 Redis nodes (128-256GB each)
```

### Caching guidelines:

| Pattern                 | Cache Hit Rate | When to use                          |
|-------------------------|----------------|--------------------------------------|
| Cache-aside (Lazy)      | 80-95%         | General purpose, most common         |
| Write-through           | 95-99%         | When stale data is unacceptable      |
| Write-behind            | 90-95%         | Write-heavy with eventual consistency|

### Cache eviction:

- **LRU** (Least Recently Used) -- default choice, works well for most workloads
- **LFU** (Least Frequently Used) -- better for skewed access patterns
- **TTL** (Time To Live) -- set expiry for freshness guarantees

---

## Common Estimation Mistakes

| Mistake                                | Why it hurts                                | Fix                                      |
|----------------------------------------|---------------------------------------------|------------------------------------------|
| Forgetting peak vs. average            | System must handle peaks, not averages      | Always multiply by 2-5x for peak         |
| Ignoring media storage                 | Images/video dwarf text by 100x+            | Always estimate media separately         |
| Not mentioning replication             | Real systems store 3 copies minimum         | Apply 3x replication factor              |
| Perfect arithmetic                     | Wastes time, signals wrong priorities       | Round aggressively, state rounding       |
| Single-component bottleneck            | Forgetting that one DB can't handle 100K QPS| Estimate number of servers needed        |
| Ignoring read vs. write                | They have very different patterns           | Always separate read and write paths     |
| Forgetting overhead                    | Indexes, metadata, encoding add 20-50%     | Add buffer for overhead                  |
| Not stating assumptions                | Interviewer can't tell if you're reasonable | State every assumption explicitly        |

---

## Putting It All Together: Summary Template

Use this template for any estimation problem:

```
STEP 1 -- ASSUMPTIONS
  DAU:          ___M
  Actions/user: ___/day
  Data types:   text / image / video
  Retention:    ___ years
  R:W ratio:    ___:1

STEP 2 -- QPS
  Write QPS:    DAU x actions / 86400 = ___ QPS
  Read QPS:     Write QPS x R:W ratio = ___ QPS
  Peak QPS:     Read QPS x 3          = ___ QPS

STEP 3 -- STORAGE
  Record size:  ___ bytes
  Daily data:   writes/day x record size = ___ GB/day
  5-year total: daily x 365 x 5 x 3(replication) = ___ TB

STEP 4 -- BANDWIDTH
  Write BW:     Write QPS x payload = ___ MB/s
  Read BW:      Read QPS x response = ___ MB/s

STEP 5 -- CACHING
  Daily data:   Read QPS x 86400 x response size = ___ GB
  Cache (20%):  ___ GB --> ___ Redis nodes
```

---

## Quick Number Verification Checks

After you finish, sanity-check your numbers:

| Metric          | Suspicious If...                | Reasonable Range (large-scale)     |
|-----------------|----------------------------------|------------------------------------|
| QPS             | > 1M QPS for a single service   | 1K - 500K QPS                      |
| Daily storage   | > 100 TB/day (unless video)     | 1 GB - 10 TB/day                   |
| Total storage   | > 100 PB (unless YouTube-scale) | 1 TB - 10 PB                       |
| Cache           | > 10 TB (too expensive)         | 100 GB - 5 TB                      |
| Bandwidth       | > 1 Tbps origin (use CDN)       | 1 Gbps - 100 Gbps                  |
| Server count    | > 10,000 for one component      | 10 - 1,000 servers per component   |
