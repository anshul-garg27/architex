# Interview Cheatsheet: Back-of-the-Envelope Estimation

Quick-reference sheet for the last 30 minutes before your system design interview.
Read this, close it, and walk in confident.

---

## The 10 Numbers You MUST Memorize

These ten numbers let you derive almost any estimation from scratch.

| #  | Number                          | Value              | Why it matters                    |
|----|----------------------------------|--------------------|-----------------------------------|
| 1  | Seconds in a day                | 86,400 ~ **10^5**  | DAU to QPS conversion             |
| 2  | 1 Million requests/day          | **~12/sec**        | Fast mental QPS math              |
| 3  | RAM latency                     | **~100 ns**        | Baseline for "fast"               |
| 4  | SSD random read                 | **~150 us**        | 1000x slower than RAM             |
| 5  | Datacenter round trip           | **~500 us**        | Cost of a network call            |
| 6  | Redis throughput                | **~100K ops/sec**  | Cache layer capacity              |
| 7  | Single DB throughput            | **~1K-10K QPS**    | When to shard                     |
| 8  | Typical image size              | **~300 KB**        | Media dominates storage           |
| 9  | Typical tweet/record            | **~500 bytes**     | Text is tiny                      |
| 10 | HD video per minute             | **~50 MB**         | Video dwarfs everything           |

Drill yourself: cover the "Value" column and recite from memory.

---

## The 5-Step Framework (Condensed)

Say these steps out loud in the interview to show structure:

```
"Let me walk through a quick estimation in five steps."

Step 1: STATE ASSUMPTIONS
  "I'll assume X million DAU, each doing Y actions per day..."

Step 2: CALCULATE QPS
  "That gives us [DAU x actions / 10^5] = Z QPS.
   With a 3x peak multiplier, we need to handle Z*3 peak QPS."

Step 3: ESTIMATE STORAGE
  "Each record is about N bytes. At Z writes per day, that's
   [Z * 86400 * N] per day, times 5 years times 3x replication."

Step 4: ESTIMATE BANDWIDTH
  "Read QPS times average response size gives us B MB/s.
   Media traffic goes through CDN."

Step 5: ESTIMATE CACHING
  "Using the 80/20 rule, we cache 20% of daily data: about C GB.
   That's D Redis nodes."
```

---

## Template Sentences You Can Say

These are polished phrases to use verbatim. They demonstrate structure and awareness.

### Opening the estimation:

> "Before diving into the design, let me do a quick back-of-the-envelope calculation
> to understand the scale we're dealing with."

### Stating assumptions:

> "Let me assume [X] million DAU. Each user performs roughly [Y] actions per day.
> That's a reasonable assumption for a [Twitter/Uber/etc]-scale system. Does this
> align with what you had in mind?"

### Calculating QPS:

> "So [X]M DAU times [Y] actions gives us [Z] million actions per day. Dividing
> by 10^5 seconds in a day, that's roughly [Q] QPS on average. At peak, let's
> multiply by 3, giving us [Q*3] QPS."

### When numbers get large:

> "That's [N] petabytes over 5 years, which tells us we definitely need a
> distributed storage solution -- probably object storage like S3 for media,
> with a sharded database for metadata."

### Identifying the bottleneck:

> "Looking at these numbers, the dominant challenge is clearly [storage/QPS/bandwidth/
> concurrent connections]. That should drive our architecture decisions."

### Wrapping up:

> "So in summary: we're looking at roughly [X]K QPS, [Y] TB of storage per year,
> and [Z] GB of cache. This is well within the range of [N] servers with standard
> load balancing. The key scaling challenge will be [specific bottleneck]."

---

## Common Estimation Patterns

### Pattern 1: DAU to QPS
```
QPS = DAU x actions_per_user / 100,000
Peak = QPS x 3
```

### Pattern 2: Storage for N years
```
Storage = daily_writes x record_size x 365 x N_years x 3 (replication)
```

### Pattern 3: "Images dominate text"
```
If 10% of records have images:
  Image storage = total_records x 0.10 x 300KB
  Text storage  = total_records x 500B
  Ratio: Images are ~60x more storage
Always estimate media and text separately.
```

### Pattern 4: Number of servers needed
```
Servers = Peak QPS / QPS_per_server
  Web servers:  QPS / 5,000
  DB servers:   QPS / 5,000 (read replicas)
  Cache servers: total_cache_GB / 128 GB per node
```

### Pattern 5: CDN vs. origin split
```
Static content (images, video, JS/CSS): 80-95% served by CDN
Dynamic content (API responses): served by origin
Always mention this split for media-heavy systems.
```

### Pattern 6: The "fan-out" multiplier
```
For social/messaging systems with groups or followers:
  Delivery QPS = Write QPS x avg_recipients
  Twitter: 1 tweet x 10,000 followers = 10,000 deliveries
  WhatsApp group: 1 message x 20 members = 20 deliveries
```

### Pattern 7: Cache sizing with 80/20
```
Cache = 20% x daily_unique_items x item_size
Verify: cache_size < total_RAM_available (should be 100GB - 5TB range)
```

---

## Common Mistakes to Avoid

### Mistake 1: Spending too long on arithmetic
**Wrong:** Carefully computing 473,284 / 86,400 = 5,478.75...
**Right:** "500K / 100K is about 5,000 QPS." Move on.

### Mistake 2: Not separating reads from writes
**Wrong:** "Total QPS is 50K."
**Right:** "Write QPS is 5K, read QPS is 50K. The read path needs caching."

### Mistake 3: Forgetting about media
**Wrong:** "500M tweets x 500 bytes = 250 GB/day storage."
**Right:** "Text is 250 GB/day, but 10% of tweets have 300KB images,
adding 15 TB/day. Media storage dominates by 60x."

### Mistake 4: Ignoring peak traffic
**Wrong:** "Average QPS is 10K, so we need 2 servers."
**Right:** "Average is 10K, peak is 30-50K. We provision for peak,
so we need 5-10 servers with headroom."

### Mistake 5: Treating all data the same
**Wrong:** "We need 100 PB of SSD storage."
**Right:** "Hot data (last 30 days) on SSD: 2 PB. Cold data on S3: 98 PB.
This is 10x cheaper."

### Mistake 6: Not mentioning replication
**Wrong:** "Total storage: 50 TB."
**Right:** "50 TB raw data x 3 replicas = 150 TB total storage."

### Mistake 7: Over-engineering precision
**Wrong:** "We need exactly 47.3 servers."
**Right:** "Roughly 50 servers. We'd start with that and auto-scale."

### Mistake 8: Forgetting to state assumptions
**Wrong:** *silently calculating with numbers the interviewer can't follow*
**Right:** "I'll assume 100M DAU -- is that reasonable for this system?"

---

## How to Present Estimation in an Interview

### Timing

```
Total time on estimation: 3-5 minutes (no more!)

  0:00 - 0:30   State assumptions, ask if reasonable
  0:30 - 1:30   Calculate QPS (write, read, peak)
  1:30 - 3:00   Calculate storage and bandwidth
  3:00 - 4:00   Calculate caching, summarize server count
  4:00 - 5:00   State the key bottleneck, transition to design

"Based on this estimation, the key challenge is [X].
 Let me design the system around solving that."
```

### Physical presentation tips

1. **Use the whiteboard or shared doc** -- write the numbers down, do not just
   say them verbally. This makes your reasoning visible and checkable.

2. **Label everything** -- write units (QPS, GB, TB, MB/s) next to every number.

3. **Round and explain** -- say "I'm rounding 86,400 to 100,000 for simplicity"
   to show you know the real number but choose speed.

4. **Build a summary table** -- at the end, write a small table:

```
+-----------------------+------------------+
| Metric                | Value            |
+-----------------------+------------------+
| Write QPS (avg/peak)  | 5K / 15K         |
| Read QPS (avg/peak)   | 50K / 150K       |
| Storage (5 years)     | 500 TB           |
| Cache                 | 200 GB           |
| Servers needed        | ~50 app + 10 DB  |
| Key bottleneck        | Read fan-out     |
+-----------------------+------------------+
```

5. **Transition to design** -- the estimation naturally leads to architecture:
   - High QPS? --> "We need load balancing and horizontal scaling"
   - Huge storage? --> "We need sharding and tiered storage"
   - Many connections? --> "We need connection pooling or WebSockets"
   - Media-heavy? --> "We need a CDN and object storage"

---

## Quick-Fire Estimation Reference

For when you need a fast answer without full calculation:

| System Type          | Typical DAU     | Typical QPS Range | Storage/Year    |
|----------------------|-----------------|-------------------|-----------------|
| Social media (large) | 500M            | 50K-500K          | 10-100 PB       |
| Chat/Messaging       | 1B              | 500K-5M           | 1-50 PB         |
| URL shortener        | 100M            | 10K-50K           | 10-100 TB       |
| E-commerce           | 50M             | 10K-100K          | 1-10 PB         |
| Video platform       | 500M            | 100K-1M           | 100 PB - 1 EB   |
| Ride-sharing         | 30M             | 100K-500K         | 100 TB - 1 PB   |
| Search engine        | 1B              | 100K-1M           | 10-100 PB       |
| File storage         | 100M            | 10K-100K          | 10 PB - 1 EB    |

---

## Final Sanity Checks

Before you finish your estimation, verify against these reality checks:

| If your number is...          | It might be wrong because...                  |
|-------------------------------|-----------------------------------------------|
| QPS > 1 Million               | Very few services hit this at origin           |
| Storage > 10 PB (no video)    | Double-check record sizes                     |
| Cache > 10 TB                 | Too expensive; re-examine what needs caching  |
| Bandwidth > 1 Tbps at origin  | CDN should handle most of this                 |
| Servers > 10,000              | Unusual for a single service; verify QPS math |
| Server < 2                    | Minimum 2 for high availability               |
| Cost > $100M/year             | Sanity-check; major companies spend $1-10B    |

---

## One-Page Summary

```
+------------------------------------------------------------------+
|                   ESTIMATION INTERVIEW CHECKLIST                  |
+------------------------------------------------------------------+
|                                                                  |
|  [ ] State assumptions: DAU, actions/day, data types, retention  |
|  [ ] Calculate Write QPS = DAU x actions / 10^5                  |
|  [ ] Calculate Read QPS = Write QPS x R:W ratio                  |
|  [ ] Apply peak multiplier (x3 for daily, x10 for seasonal)     |
|  [ ] Estimate storage: records/day x size x years x 3 (replica)  |
|  [ ] Separate text vs. media storage (media dominates!)          |
|  [ ] Estimate bandwidth: QPS x payload size                      |
|  [ ] Mention CDN for static/media content                        |
|  [ ] Estimate cache: 20% of daily data (80/20 rule)              |
|  [ ] Calculate server count: peak QPS / QPS-per-server           |
|  [ ] Identify the dominant bottleneck                            |
|  [ ] Transition to architecture design                           |
|                                                                  |
|  REMEMBER: Round aggressively. Show structure. State assumptions.|
|  3-5 minutes max. The goal is the right ORDER OF MAGNITUDE.      |
+------------------------------------------------------------------+
```
