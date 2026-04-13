# Design YouTube / Video Streaming Platform -- High-Level Design

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Upload Pipeline](#upload-pipeline)
3. [Video Transcoding](#video-transcoding)
4. [Streaming Pipeline](#streaming-pipeline)
5. [Adaptive Bitrate Streaming](#adaptive-bitrate-streaming)
6. [Metadata Service](#metadata-service)
7. [View Counting](#view-counting)
8. [Search](#search)
9. [Recommendations](#recommendations)
10. [CDN Strategy](#cdn-strategy)
11. [Thumbnail Generation](#thumbnail-generation)
12. [Live Streaming](#live-streaming)
13. [Database Design](#database-design)

---

## Architecture Overview

The system divides into two major pipelines -- the **Upload Pipeline** (write path) and the **Streaming Pipeline** (read path) -- plus supporting services for search, recommendations, and engagement.

```mermaid
graph TB
    subgraph Clients
        WEB[Web Browser]
        MOB[Mobile App]
        TV[Smart TV / Console]
    end

    subgraph Edge Layer
        CDN[Global CDN<br/>Multi-tier Edge Network]
        LB[Load Balancer<br/>L4/L7]
    end

    subgraph API Gateway
        GW[API Gateway<br/>Auth + Rate Limiting + Routing]
    end

    subgraph Upload Pipeline
        US[Upload Service<br/>Resumable Uploads]
        RAW[(Raw Video Store<br/>S3 / GCS)]
        MQ[Message Queue<br/>Kafka]
        TS[Transcoding Service<br/>FFmpeg Workers]
        PROC[(Processed Video Store<br/>S3 / GCS)]
        THUMB[Thumbnail Generator]
    end

    subgraph Streaming Pipeline
        SS[Streaming Service<br/>Manifest Generation]
        VS[Video Serving<br/>Origin Servers]
    end

    subgraph Core Services
        META[Metadata Service]
        SEARCH[Search Service<br/>Elasticsearch]
        REC[Recommendation Service<br/>ML Pipeline]
        ENGAGE[Engagement Service<br/>Likes, Comments]
        SUB[Subscription Service]
        NOTIFY[Notification Service]
    end

    subgraph Data Layer
        PG[(PostgreSQL<br/>Video + User Metadata)]
        REDIS[(Redis Cluster<br/>View Counts + Sessions)]
        ES[(Elasticsearch<br/>Search Index)]
        CASS[(Cassandra<br/>Activity Feeds + History)]
        ML_STORE[(Feature Store<br/>ML Embeddings)]
    end

    WEB & MOB & TV --> CDN
    CDN --> LB
    LB --> GW

    GW --> US
    GW --> SS
    GW --> META
    GW --> SEARCH
    GW --> REC
    GW --> ENGAGE
    GW --> SUB

    US --> RAW
    US --> MQ
    MQ --> TS
    TS --> PROC
    TS --> THUMB
    PROC --> CDN
    TS --> META

    SS --> CDN
    SS --> VS
    VS --> PROC

    META --> PG
    META --> REDIS
    SEARCH --> ES
    REC --> ML_STORE
    ENGAGE --> PG
    ENGAGE --> REDIS
    SUB --> CASS
    SUB --> NOTIFY

    THUMB --> PROC
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Separate upload and streaming paths | 640:1 read/write ratio -- scale independently |
| Async transcoding via message queue | Decouples upload from processing; handles bursts |
| Multi-tier CDN | 95%+ cache hit ratio; serve from edge |
| Eventual consistency for view counts | Cannot afford 46K synchronous DB writes/sec |
| Elasticsearch for search | Full-text search with relevance scoring at scale |
| Cassandra for activity feeds | High write throughput for subscription feeds and watch history |

---

## Upload Pipeline

The upload flow is the write path. It must handle large files (gigabytes), unreliable networks, and trigger an expensive transcoding pipeline asynchronously.

### Upload Flow Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant US as Upload Service
    participant S3R as S3 Raw Store
    participant MQ as Kafka
    participant TS as Transcoding Service
    participant S3P as S3 Processed Store
    participant CDN as CDN Edge
    participant DB as Metadata DB
    participant NS as Notification Service

    C->>GW: POST /videos/upload (metadata)
    GW->>GW: Authenticate + Rate Limit
    GW->>US: Forward upload request
    US->>DB: Create video record (status=uploading)
    US-->>C: 202 Accepted {video_id, upload_url}

    Note over C,S3R: Resumable Upload (chunked)
    C->>S3R: PUT chunks to pre-signed URL
    C->>S3R: PUT chunk 1 (0-5MB)
    C->>S3R: PUT chunk 2 (5-10MB)
    C->>S3R: PUT chunk N (final)
    S3R-->>C: Upload complete

    C->>US: POST /videos/{id}/complete
    US->>DB: Update status = processing
    US->>MQ: Publish TranscodeJob event

    MQ->>TS: Consume TranscodeJob
    TS->>S3R: Download raw video
    TS->>TS: Split into chunks
    TS->>TS: Transcode 240p, 360p, 480p, 720p, 1080p, 4K
    TS->>TS: Generate HLS/DASH manifests
    TS->>TS: Extract thumbnails
    TS->>S3P: Upload all transcoded segments + manifests
    TS->>DB: Update status = ready, set manifest_url
    TS->>CDN: Invalidate/warm cache for video

    DB->>NS: Trigger new video notification
    NS->>NS: Fan-out to subscribers
```

### Resumable Upload Protocol

YouTube uses a resumable upload protocol similar to the tus protocol:

1. **Initiation**: Client sends metadata, server returns an `upload_url`
2. **Chunked upload**: Client uploads in 5-8 MB chunks, each with `Content-Range` header
3. **Resume on failure**: Client queries server for last received byte offset, resumes from there
4. **Completion**: Client signals upload complete, server validates checksum

```
# Example: Resume after failure
GET /upload/status?upload_id=abc123
Response: { "bytes_received": 15728640 }

# Client resumes from byte 15728640
PUT /upload/abc123
Content-Range: bytes 15728640-20971519/52428800
<binary data>
```

### Pre-signed URLs

The upload service generates **pre-signed URLs** that allow the client to upload directly to object storage (S3/GCS), bypassing our servers entirely:

```
Client --> Upload Service: "I want to upload a 500MB video"
Upload Service --> Client: "Here's a pre-signed S3 URL valid for 1 hour"
Client --> S3: Direct upload (our servers never touch the bytes)
```

This is critical at scale -- routing 500 hours/min of video through our application servers would be impossibly expensive.

---

## Video Transcoding

Transcoding is the most compute-intensive part of the system. A single 10-minute 4K video can take 30+ minutes of CPU time on a powerful machine.

### Why Transcode?

1. **Compatibility**: Users upload in dozens of formats (MP4, MOV, AVI, MKV). We normalize to H.264/H.265 + AAC.
2. **Adaptive bitrate**: We need multiple resolutions so players can switch quality based on bandwidth.
3. **Efficiency**: Raw uploads are often inefficiently encoded. Our encoding reduces storage and bandwidth cost.
4. **Standardization**: All output uses HLS (Apple) or DASH (MPEG) segment format for streaming.

### Transcoding as a DAG (Directed Acyclic Graph)

YouTube's transcoding is not a simple linear pipeline -- it is a DAG of parallel tasks:

```mermaid
graph TD
    RAW[Raw Video File] --> SPLIT[Split into Segments<br/>~10 second chunks]

    SPLIT --> V240[Encode 240p H.264]
    SPLIT --> V360[Encode 360p H.264]
    SPLIT --> V480[Encode 480p H.264]
    SPLIT --> V720[Encode 720p H.264]
    SPLIT --> V1080[Encode 1080p H.264]
    SPLIT --> V4K[Encode 4K H.265]

    SPLIT --> AUDIO[Extract + Encode Audio<br/>AAC 128kbps]
    SPLIT --> CAPTION[Generate Captions<br/>Speech-to-Text ML]
    SPLIT --> THUMB_GEN[Generate Thumbnails<br/>Key Frame Extraction]

    V240 --> PKG240[Package HLS Segments 240p]
    V360 --> PKG360[Package HLS Segments 360p]
    V480 --> PKG480[Package HLS Segments 480p]
    V720 --> PKG720[Package HLS Segments 720p]
    V1080 --> PKG1080[Package HLS Segments 1080p]
    V4K --> PKG4K[Package HLS Segments 4K]

    AUDIO --> MUX[Mux Audio into All Variants]

    PKG240 & PKG360 & PKG480 & PKG720 & PKG1080 & PKG4K --> MUX

    MUX --> MANIFEST[Generate Master Manifest<br/>master.m3u8]
    CAPTION --> MANIFEST
    THUMB_GEN --> THUMB_STORE[Store Thumbnails]

    MANIFEST --> UPLOAD[Upload to Processed Store]
    THUMB_STORE --> UPLOAD
    UPLOAD --> NOTIFY_READY[Mark Video Ready<br/>Update Metadata DB]
```

### Segment-Level Parallelism

The key insight: **split the video into small segments (10 seconds each) and transcode segments in parallel across many machines**.

For a 10-minute video:
- 60 segments of 10 seconds each
- Each segment is transcoded into 6 resolutions independently
- That is 360 independent tasks that can run in parallel
- A cluster of 100 workers finishes in minutes, not hours

### Transcoding Technology Stack

| Component | Technology |
|-----------|------------|
| Video codec | FFmpeg (H.264 via libx264, H.265 via libx265, VP9, AV1) |
| Audio codec | AAC (libfdk_aac) |
| Packaging | HLS (Apple), DASH (MPEG-DASH) |
| Orchestration | Custom DAG scheduler (similar to Apache Airflow) |
| Worker fleet | Kubernetes pods or EC2 spot instances |
| Captions | Google Speech-to-Text / Whisper |

### FFmpeg Example Commands

```bash
# Encode 1080p H.264 segment
ffmpeg -i segment_001.mp4 \
  -c:v libx264 -preset medium -b:v 6000k \
  -vf scale=1920:1080 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 6 -hls_segment_filename 'seg_%03d.ts' \
  output_1080p.m3u8

# Encode 4K H.265 segment
ffmpeg -i segment_001.mp4 \
  -c:v libx265 -preset medium -b:v 20000k \
  -vf scale=3840:2160 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 6 -hls_segment_filename 'seg_%03d.ts' \
  output_4k.m3u8
```

---

## Streaming Pipeline

The streaming flow is the read path -- the most performance-critical part of the system, handling 46K+ views/sec at steady state and 200K+ at peak.

### Streaming Flow Sequence

```mermaid
sequenceDiagram
    participant C as Video Player
    participant CDN as CDN Edge
    participant REG as CDN Regional
    participant ORIG as Origin Server
    participant S3 as Processed Store (S3)
    participant META as Metadata Service

    C->>META: GET /videos/{id}/manifest
    META-->>C: {manifest_url, formats[], captions[]}

    C->>CDN: GET master.m3u8 (manifest)
    alt Cache Hit
        CDN-->>C: Return cached manifest
    else Cache Miss
        CDN->>REG: Forward to regional
        alt Regional Cache Hit
            REG-->>CDN: Return manifest
        else Regional Miss
            REG->>ORIG: Forward to origin
            ORIG->>S3: Fetch manifest
            S3-->>ORIG: Return manifest
            ORIG-->>REG: Return + cache
        end
        CDN-->>C: Return manifest + cache at edge
    end

    Note over C: Player parses manifest,<br/>selects initial quality<br/>based on bandwidth estimate

    C->>CDN: GET segment_001_720p.ts
    CDN-->>C: Return video segment (cache hit)

    C->>CDN: GET segment_002_720p.ts
    CDN-->>C: Return video segment

    Note over C: Bandwidth drops detected

    C->>CDN: GET segment_003_480p.ts
    CDN-->>C: Return lower quality segment

    Note over C: Bandwidth recovers

    C->>CDN: GET segment_004_720p.ts
    CDN-->>C: Return higher quality segment
```

### How Video Streaming Actually Works

When a user clicks play, they are NOT downloading a single file. Here is what happens:

1. **Manifest fetch**: The player downloads a master manifest (`master.m3u8` for HLS or `manifest.mpd` for DASH)
2. **Quality selection**: The manifest lists all available quality levels. The player picks one based on estimated bandwidth.
3. **Segment download**: The player downloads small segments (2-10 seconds each) one at a time.
4. **Adaptive switching**: Between segments, the player re-evaluates bandwidth and may switch quality up or down.
5. **Buffer management**: The player maintains a 15-30 second buffer ahead of the playback position.

---

## Adaptive Bitrate Streaming

ABR is the technique that makes YouTube playback smooth on any connection speed, from 2G mobile to fiber broadband.

### HLS Master Manifest Example

```
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240
/video/dQw4w9WgXcQ/240p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=700000,RESOLUTION=640x360
/video/dQw4w9WgXcQ/360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
/video/dQw4w9WgXcQ/480p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
/video/dQw4w9WgXcQ/720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080
/video/dQw4w9WgXcQ/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=20000000,RESOLUTION=3840x2160
/video/dQw4w9WgXcQ/4k/playlist.m3u8
```

### Per-Resolution Playlist Example

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.000,
segment_000.ts
#EXTINF:6.000,
segment_001.ts
#EXTINF:6.000,
segment_002.ts
#EXTINF:4.500,
segment_003.ts
#EXT-X-ENDLIST
```

### ABR Algorithm (Simplified)

```
function selectNextQuality(currentBandwidth, bufferLevel):
    availableQualities = [240p, 360p, 480p, 720p, 1080p, 4K]

    # Conservative: only use 80% of measured bandwidth
    safeBandwidth = currentBandwidth * 0.8

    # Find highest quality that fits in available bandwidth
    bestQuality = 240p
    for quality in availableQualities:
        if quality.bitrate <= safeBandwidth:
            bestQuality = quality

    # If buffer is low (< 5 seconds), drop one quality level for safety
    if bufferLevel < 5 seconds:
        bestQuality = oneStepDown(bestQuality)

    # If buffer is very full (> 30 seconds), try stepping up
    if bufferLevel > 30 seconds:
        bestQuality = oneStepUp(bestQuality)

    return bestQuality
```

> **Real-world reference**: YouTube uses a proprietary ABR algorithm called "Pensieve" (inspired by MIT research) that uses reinforcement learning to optimize quality selection. Netflix uses a buffer-based approach called BOLA.

---

## Metadata Service

The metadata service handles everything about a video except the actual video bytes: title, description, view counts, channel info, etc.

### Database Schema (PostgreSQL)

```sql
-- Videos table (sharded by video_id)
CREATE TABLE videos (
    video_id        VARCHAR(11) PRIMARY KEY,  -- YouTube-style short ID
    user_id         BIGINT NOT NULL REFERENCES users(user_id),
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    tags            TEXT[],
    category        VARCHAR(50),
    visibility      VARCHAR(10) DEFAULT 'public',
    status          VARCHAR(20) DEFAULT 'uploading',
    duration_sec    INTEGER,
    view_count      BIGINT DEFAULT 0,
    like_count      BIGINT DEFAULT 0,
    dislike_count   BIGINT DEFAULT 0,
    comment_count   BIGINT DEFAULT 0,
    manifest_url    TEXT,
    thumbnail_urls  JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    INDEX idx_user_videos (user_id, created_at DESC),
    INDEX idx_published (published_at DESC) WHERE status = 'ready'
);

-- Users table
CREATE TABLE users (
    user_id           BIGSERIAL PRIMARY KEY,
    username          VARCHAR(50) UNIQUE NOT NULL,
    display_name      VARCHAR(100),
    email             VARCHAR(255) UNIQUE NOT NULL,
    avatar_url        TEXT,
    subscriber_count  BIGINT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (sharded by subscriber_id)
CREATE TABLE subscriptions (
    subscriber_id  BIGINT NOT NULL,
    channel_id     BIGINT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (subscriber_id, channel_id),
    INDEX idx_channel_subs (channel_id)
);
```

### Caching Strategy

```mermaid
graph LR
    CLIENT[Client] --> CACHE{Redis Cache}
    CACHE -->|Hit| CLIENT
    CACHE -->|Miss| DB[(PostgreSQL)]
    DB --> CACHE
    CACHE --> CLIENT

    subgraph Cache Layers
        L1[L1: Local In-Memory Cache<br/>per app server, TTL 30s]
        L2[L2: Redis Cluster<br/>TTL 5 minutes]
        L3[L3: PostgreSQL<br/>Source of Truth]
    end
```

- **Hot metadata** (trending videos, top channels): cached in Redis with 1-5 min TTL
- **Warm metadata** (recently active videos): cached on demand with 5-30 min TTL
- **Cold metadata** (old/rarely viewed videos): fetched from DB on demand, short TTL

---

## View Counting

View counting seems trivial but is one of the hardest problems at YouTube scale. At 46K views/sec average (200K peak), you cannot simply `UPDATE videos SET view_count = view_count + 1` on every view.

### Why Naive Counting Fails

```
Problem: 46,000 views/sec on a single popular video
- Each view = 1 DB write
- Hot partition: millions of writes/sec to a single row
- Row-level lock contention destroys database performance
- PostgreSQL cannot handle this write pattern
```

### Solution: Batched Approximate Counting

```mermaid
graph LR
    subgraph Application Servers
        A1[Server 1<br/>Local Counter: +47]
        A2[Server 2<br/>Local Counter: +31]
        A3[Server 3<br/>Local Counter: +56]
    end

    subgraph Aggregation Layer
        REDIS[Redis<br/>INCR per video_id]
    end

    subgraph Persistence
        FLUSH[Flush Worker<br/>Every 30 seconds]
        DB[(PostgreSQL<br/>view_count column)]
    end

    A1 & A2 & A3 -->|Batch flush every 5s| REDIS
    REDIS -->|Periodic flush| FLUSH
    FLUSH -->|Batch UPDATE| DB
```

**The approach:**

1. **In-memory accumulation**: Each application server counts views in a local hash map
2. **Periodic flush to Redis**: Every 5 seconds, flush accumulated counts to Redis using `INCRBY`
3. **Periodic flush to DB**: A background worker reads Redis counters every 30 seconds and batch-updates PostgreSQL
4. **Read from Redis**: When displaying view count, read from Redis (near real-time), not DB

```python
# Pseudocode for view counting
class ViewCounter:
    def __init__(self):
        self.local_counts = defaultdict(int)  # video_id -> count

    def record_view(self, video_id):
        self.local_counts[video_id] += 1

    def flush_to_redis(self):  # Called every 5 seconds
        pipeline = redis.pipeline()
        for video_id, count in self.local_counts.items():
            pipeline.incrby(f"views:{video_id}", count)
        pipeline.execute()
        self.local_counts.clear()
```

This reduces DB writes from 46K/sec to a handful of batch updates per second.

---

## Search

YouTube search must handle queries across 800+ million videos, returning relevant results in under 200ms.

### Search Architecture

```mermaid
graph TB
    C[Client] --> GW[API Gateway]
    GW --> SS[Search Service]

    SS --> ES[(Elasticsearch Cluster<br/>Video Index)]
    SS --> SPELL[Spell Correction<br/>+ Autocomplete]
    SS --> RANK[Re-ranking Service<br/>Personalization]

    subgraph Indexing Pipeline
        MQ[Kafka] --> IDX[Indexing Worker]
        IDX --> ES
    end

    subgraph Data Sources for Index
        META[Metadata DB] --> MQ
        CAP[Caption Service<br/>Auto-generated text] --> MQ
        ENGAGE_DATA[Engagement Signals<br/>CTR, watch time] --> MQ
    end
```

### Elasticsearch Index Schema

```json
{
  "mappings": {
    "properties": {
      "video_id":    { "type": "keyword" },
      "title":       { "type": "text", "analyzer": "standard", "boost": 3.0 },
      "description": { "type": "text", "analyzer": "standard", "boost": 1.5 },
      "tags":        { "type": "text", "boost": 2.0 },
      "captions":    { "type": "text", "analyzer": "standard", "boost": 1.0 },
      "channel_name":{ "type": "text", "boost": 2.0 },
      "category":    { "type": "keyword" },
      "view_count":  { "type": "long" },
      "like_ratio":  { "type": "float" },
      "publish_date":{ "type": "date" },
      "duration_sec":{ "type": "integer" },
      "language":    { "type": "keyword" }
    }
  }
}
```

### Relevance Scoring

YouTube search ranking is not just text matching. The final score combines:

```
score = text_relevance * 0.3
      + engagement_score * 0.25     # CTR, watch time, likes
      + freshness_score * 0.15      # Recent videos boosted
      + channel_authority * 0.15    # Subscriber count, consistency
      + personalization * 0.15      # User's watch history alignment
```

### Autocomplete

Autocomplete suggestions use a separate index optimized for prefix matching:

```json
{
  "suggest": {
    "title_suggest": {
      "type": "completion",
      "analyzer": "simple",
      "contexts": [
        { "name": "language", "type": "category" }
      ]
    }
  }
}
```

---

## Recommendations

The recommendation system is YouTube's most valuable component -- it drives 70%+ of watch time according to YouTube's own disclosures.

### Recommendation Architecture

```mermaid
graph TB
    subgraph Offline Pipeline - runs daily/hourly
        DATA[User Activity Data<br/>Watch history, likes, searches] --> FEAT[Feature Engineering]
        FEAT --> TRAIN[Model Training<br/>Two-Tower + Deep Neural Network]
        TRAIN --> MODEL[Trained Model]
        MODEL --> EMBED[Generate User & Video Embeddings]
        EMBED --> ANN_IDX[ANN Index<br/>Approximate Nearest Neighbor]
    end

    subgraph Online Serving - per request
        REQ[User opens Home page] --> CAND[Candidate Generation<br/>ANN lookup: top 1000 videos]
        CAND --> FILTER[Filtering<br/>Remove watched, blocked, policy violations]
        FILTER --> RANK_SVC[Ranking Model<br/>Predict watch time probability]
        RANK_SVC --> RERANK[Re-ranking<br/>Diversity, freshness, business rules]
        RERANK --> RESP[Return top 20 videos]
    end

    ANN_IDX --> CAND
    MODEL --> RANK_SVC
```

### Two-Tower Model (Industry Standard)

YouTube's recommendation system uses a two-tower architecture, described in their landmark 2016 paper "Deep Neural Networks for YouTube Recommendations":

**Tower 1 -- User Tower:**
```
Input: user_id, watch_history[last 50 videos], search_history,
       demographics, time_of_day, device_type
     |
     v
Embedding layers --> Dense layers --> User embedding (256-dim vector)
```

**Tower 2 -- Video Tower:**
```
Input: video_id, title_embedding, channel_id, category,
       upload_age, video_length, engagement_stats
     |
     v
Embedding layers --> Dense layers --> Video embedding (256-dim vector)
```

**Scoring:**
```
relevance_score = dot_product(user_embedding, video_embedding)
```

### Candidate Generation vs. Ranking

The two-stage approach is essential for performance:

| Stage | Input | Output | Latency Budget | Model Complexity |
|-------|-------|--------|----------------|-----------------|
| Candidate Generation | User embedding | Top 1000 from millions | < 50ms | Light (ANN lookup) |
| Ranking | 1000 candidates | Top 20 ordered | < 100ms | Heavy (deep neural net) |

- **Candidate generation** uses Approximate Nearest Neighbor search (FAISS, ScaNN) to find 1000 plausible videos in under 50ms from a corpus of hundreds of millions.
- **Ranking** applies a full deep learning model to score and order the 1000 candidates.

### Feed Types and Their Algorithms

| Feed | Primary Signal | Algorithm |
|------|---------------|-----------|
| Home | Watch history + engagement | Two-tower collaborative filtering |
| Up Next | Currently playing video | Content similarity + co-watch patterns |
| Trending | View velocity + geography | Exponential decay scoring |
| Subscriptions | Subscription list | Chronological merge sort |
| Search results | Query text | Text matching + engagement re-ranking |

---

## CDN Strategy

The CDN is the single most critical infrastructure component. Without it, YouTube would need to serve 231+ Tbps from origin -- physically impossible from any single data center.

### Multi-Tier CDN Architecture

```mermaid
graph TB
    subgraph Tier 1 - Edge PoPs - 4000+ locations
        E1[Edge PoP<br/>New York]
        E2[Edge PoP<br/>London]
        E3[Edge PoP<br/>Tokyo]
        E4[Edge PoP<br/>Mumbai]
        E5[Edge PoP<br/>Sao Paulo]
        EN[Edge PoP<br/>... 4000+ more]
    end

    subgraph Tier 2 - Regional Caches - 50-100 locations
        R1[Regional Cache<br/>US-East]
        R2[Regional Cache<br/>EU-West]
        R3[Regional Cache<br/>APAC]
    end

    subgraph Tier 3 - Origin
        O1[Origin<br/>US Data Center]
        O2[Origin<br/>EU Data Center]
        S3[(Object Store<br/>All Videos)]
    end

    E1 --> R1
    E2 --> R2
    E3 --> R3
    E4 --> R3
    E5 --> R1

    R1 --> O1
    R2 --> O2
    R3 --> O1

    O1 --> S3
    O2 --> S3
```

### CDN Cache Strategy

| Content Type | Strategy | Cache Location | TTL |
|-------------|----------|---------------|-----|
| Top 1% (viral/trending) | **Push**: pre-warmed to all edges | All edge PoPs | 24 hours |
| Top 20% (popular) | **Push**: pre-warmed to regional edges | Regional + some edges | 12 hours |
| Next 30% (moderate) | **Pull**: cached on first request | Edge that served it | 6 hours |
| Bottom 50% (long-tail) | **Pull**: cached on demand | Only if requested | 1 hour |

### ISP-Level Caching (Netflix Open Connect Model)

Netflix goes even further by embedding cache servers directly inside ISP networks:

```
User --> ISP Network --> [Netflix Open Connect Appliance inside ISP] --> Video served
                                    |
                          (Never leaves the ISP network!)
```

YouTube uses a similar approach called **Google Global Cache (GGC)** -- Google-owned servers placed inside ISP data centers that cache YouTube's most popular content. Over 90% of YouTube traffic in many regions is served from GGC nodes, never crossing the broader internet.

### CDN Routing Logic

```
function routeVideoRequest(video_id, user_location):
    # 1. Check nearest edge PoP
    edge = findNearestEdge(user_location)
    if edge.hasCache(video_id):
        return edge.serve(video_id)         # ~5ms latency

    # 2. Check regional cache
    regional = findRegionalCache(edge)
    if regional.hasCache(video_id):
        regional.serve(video_id)
        edge.cacheAsync(video_id)           # Backfill edge
        return                               # ~20ms latency

    # 3. Fetch from origin
    origin = findNearestOrigin(user_location)
    content = origin.fetch(video_id)
    regional.cacheAsync(video_id)
    edge.cacheAsync(video_id)
    return content                           # ~100ms latency
```

---

## Thumbnail Generation

Thumbnails are the most viewed images on the internet -- YouTube generates billions of thumbnail impressions per day. Netflix famously showed that thumbnails are the single most important factor in whether a user clicks on content.

### Thumbnail Pipeline

1. **Frame extraction**: Extract candidate frames at regular intervals (every 2 seconds) and at scene boundaries
2. **Quality filtering**: Discard blurry, dark, or overly similar frames
3. **ML scoring**: A neural network scores frames for visual appeal, informativeness, and click-through prediction
4. **Multiple sizes**: Generate thumbnails in multiple resolutions for different clients:
   - Desktop: 1280x720
   - Mobile: 640x360
   - Mini thumbnail: 168x94
   - Hover preview: animated GIF/WebP from key moments

```mermaid
graph LR
    V[Raw Video] --> EXT[Frame Extraction<br/>Every 2 seconds<br/>+ Scene Changes]
    EXT --> FILTER[Quality Filter<br/>Blur + Dark detection]
    FILTER --> ML[ML Scoring<br/>Visual Appeal<br/>CTR Prediction]
    ML --> RESIZE[Generate Multiple Sizes<br/>1280x720, 640x360, 168x94]
    RESIZE --> STORE[Store in CDN<br/>WebP format]

    CUSTOM[Creator Custom Upload] --> RESIZE
```

> **Real-world reference**: Netflix performs A/B testing on thumbnails, showing different images to different users and measuring click-through rates. Their "Artwork Personalization" system selects the best thumbnail for each user based on their viewing preferences.

---

## Live Streaming

Live streaming adds a real-time dimension to the platform. While VOD (video on demand) is the primary use case, live streaming follows a fundamentally different architecture.

### Live Streaming Architecture

```mermaid
graph LR
    subgraph Creator Side
        CAM[Camera/OBS] -->|RTMP| INGEST[Ingest Server]
    end

    subgraph Processing
        INGEST --> LIVE_TRANS[Live Transcoder<br/>Real-time multi-resolution]
        LIVE_TRANS --> SEG[Segmenter<br/>6-second HLS/DASH segments]
        SEG --> ORIGIN[Origin Server]
    end

    subgraph Delivery
        ORIGIN --> CDN[CDN Edge<br/>Low-latency mode]
        CDN --> VIEWER[Viewer Player]
    end

    subgraph Interaction
        VIEWER --> CHAT[Chat Service<br/>WebSocket]
        CHAT --> VIEWER
    end

    subgraph Recording
        ORIGIN --> REC[Recording Service]
        REC --> S3[(VOD Archive)]
    end
```

### Key Differences: Live vs. VOD

| Aspect | VOD | Live |
|--------|-----|------|
| Encoding time | Unlimited (offline) | Real-time (< 2s per segment) |
| Segment availability | All segments pre-exist | Segments generated in real-time |
| Latency target | First frame < 2s | Glass-to-glass < 5s (standard), < 2s (ultra-low) |
| CDN caching | Highly cacheable | Short-lived segments, constant invalidation |
| Error recovery | Re-request segment | Skip ahead to live edge |
| Manifest | Static (complete) | Dynamic (rolling window, updated every segment) |

### Live Streaming Protocols

| Protocol | Latency | Use Case |
|----------|---------|----------|
| RTMP (ingest) | N/A | Creator to ingest server |
| HLS (delivery) | 6-30 seconds | Standard live delivery |
| LL-HLS (Low Latency HLS) | 2-4 seconds | Low-latency live |
| WebRTC | < 1 second | Ultra-low latency, small audiences |
| DASH + CMAF | 3-6 seconds | Alternative to HLS |

> **Real-world reference**: Twitch uses a custom RTMP ingest network with HLS delivery. YouTube Live supports both standard (~15s latency) and ultra-low latency (~2s) modes. Ultra-low latency disables DVR rewind and limits quality options.

---

## Database Design

### Database Selection by Use Case

```mermaid
graph TB
    subgraph Relational - PostgreSQL
        VID[Videos Table<br/>800M rows, sharded by video_id]
        USR[Users Table<br/>2B rows, sharded by user_id]
        SUBS[Subscriptions<br/>Billions of rows]
        COMMENTS[Comments<br/>500B+ rows, sharded by video_id]
    end

    subgraph Key-Value / Cache - Redis
        VC[View Counts<br/>Real-time counters]
        SESSION[User Sessions]
        RATE[Rate Limit Counters]
        HOT_META[Hot Video Metadata Cache]
    end

    subgraph Search - Elasticsearch
        VIDX[Video Search Index<br/>800M documents]
        AUTO[Autocomplete Index]
    end

    subgraph Wide Column - Cassandra
        FEED[Subscription Feed<br/>Per-user timeline]
        HISTORY[Watch History<br/>Per-user activity log]
        RECS[Recommendation Results Cache]
    end

    subgraph Object Storage - S3/GCS
        RAW_VID[Raw Videos]
        PROC_VID[Processed Videos<br/>HLS/DASH segments]
        THUMBS[Thumbnails]
    end

    subgraph ML Store
        FEAT_STORE[Feature Store<br/>User + Video embeddings]
        ANN[ANN Index - FAISS/ScaNN]
    end
```

### Why These Choices?

| Database | Use Case | Why |
|----------|----------|-----|
| **PostgreSQL** | Video metadata, users, comments | ACID transactions, rich queries, mature sharding (Citus) |
| **Redis** | View counts, caching, sessions | In-memory speed for 200K+ reads/sec, atomic INCR |
| **Elasticsearch** | Full-text search | Purpose-built for text search, relevance scoring, autocomplete |
| **Cassandra** | Activity feeds, watch history | High write throughput, time-series access pattern, no hotspots |
| **S3/GCS** | Video files, thumbnails | Infinite scale, 11 nines durability, cheap per GB |
| **FAISS/ScaNN** | Recommendation embeddings | Sub-millisecond nearest neighbor search over millions of vectors |

### Sharding Strategy

**Videos table** -- shard by `video_id` (hash-based):
- Distributes load evenly (no hot shards)
- All queries for a specific video hit one shard
- Cross-shard queries (e.g., "all videos by user X") use scatter-gather

**Comments table** -- shard by `video_id`:
- Comments are always fetched per-video
- Hot videos have hot comment shards (acceptable trade-off)
- Paginated queries stay within a single shard

**Subscriptions table** -- shard by `subscriber_id`:
- "Who am I subscribed to?" query hits one shard
- "Who is subscribed to me?" requires scatter-gather (less frequent query)

---

## Summary: High-Level Design Principles

| Principle | Application |
|-----------|-------------|
| **Separate read and write paths** | Upload pipeline vs. streaming pipeline, scaled independently |
| **Async processing** | Transcoding via message queue, not synchronous |
| **CDN-first architecture** | 95%+ of traffic served from edge, not origin |
| **Approximate is good enough** | View counts batch-updated, not real-time per view |
| **DAG parallelism** | Transcoding split into independent parallel tasks |
| **Right database for the job** | PostgreSQL for metadata, Redis for counters, ES for search, Cassandra for feeds |
| **Multi-tier caching** | L1 (local) + L2 (Redis) + L3 (CDN) + L4 (ISP-embedded) |
| **Eventual consistency where acceptable** | View counts, search index, recommendation refresh |
