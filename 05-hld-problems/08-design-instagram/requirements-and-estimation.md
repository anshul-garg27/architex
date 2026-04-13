# Design Instagram -- Requirements & Estimation

A complete breakdown of functional/non-functional requirements, capacity estimation, and API design for a photo-sharing platform operating at Instagram scale (1B+ registered users, 500M DAU).

---

## Table of Contents

1. [Functional Requirements](#1-functional-requirements)
2. [Non-Functional Requirements](#2-non-functional-requirements)
3. [Core Assumptions & Constraints](#3-core-assumptions--constraints)
4. [Estimation & Capacity Planning](#4-estimation--capacity-planning)
5. [API Design](#5-api-design)

---

## 1. Functional Requirements

### 1.1 Primary Features (Must-Have)

| Feature | Description |
|---------|-------------|
| **Photo Upload** | Users upload photos with captions, filters, location tags, and user tags |
| **News Feed** | Personalized, ranked feed of photos from followed users |
| **Follow System** | Follow/unfollow users (asymmetric -- no mutual approval needed) |
| **Like** | Like/unlike photos; view like count and list of likers |
| **Comment** | Add, view, delete comments on photos; threaded replies |
| **Stories** | 24-hour ephemeral photo/video content, displayed in a horizontal carousel |
| **Explore / Discover** | Recommendation engine surfacing content from non-followed users |
| **Search** | Search for users, hashtags, and locations |
| **Notifications** | Push and in-app notifications for likes, comments, follows, mentions |

### 1.2 Secondary Features (Noted but Not Primary Scope)

| Feature | Description |
|---------|-------------|
| **Direct Messaging** | Private photo/text messaging between users |
| **Reels / Video** | Short-form video content with its own feed and discovery surface |
| **Shopping** | In-app product tagging and checkout |
| **Live Streaming** | Real-time broadcast with viewer interaction |
| **IGTV / Long Video** | Long-form vertical video content |
| **Close Friends** | Restricted audience list for stories and posts |
| **Guides** | Curated collections of posts, products, and places |

In a 45-minute interview, focus on the primary features. Call out secondary features to show awareness but explicitly scope them out.

### 1.3 Feature Decomposition

Each primary feature translates into specific system behaviors.

```
Photo Upload:
  - Accept multipart image + metadata from client
  - Validate file type, size (< 30MB), dimensions
  - Generate unique photo_id (Snowflake or ULID)
  - Store original to object storage
  - Trigger async pipeline: resize, filter, moderate, generate blur placeholder
  - Return immediate acknowledgment to user

News Feed:
  - On app open, fetch personalized ranked list of posts
  - Support cursor-based pagination (infinite scroll)
  - Merge pre-computed timeline with on-demand celebrity posts
  - Rank via ML model optimizing for engagement
  - Support pull-to-refresh for fresh content

Follow System:
  - Asymmetric: A follows B without B's approval (unless B is private)
  - Maintain follower count and following count
  - Follow action must feel instantaneous (strong consistency)
  - Power the fan-out system -- follower list is read on every post publish

Like:
  - Toggle like/unlike (idempotent)
  - Show real-time like count on posts
  - Show "liked by user_a, user_b, and N others"
  - High throughput: viral post can get millions of likes in minutes

Comment:
  - Top-level comments and threaded replies (single nesting level)
  - Sort by recency or relevance
  - Author can pin one comment
  - Post owner can delete any comment; others can delete own

Stories:
  - Upload image/video with stickers, text overlays, polls
  - Auto-expire after exactly 24 hours
  - Story tray: horizontal carousel sorted by relationship closeness
  - Track viewers per story segment
  - "Highlights" save stories permanently to profile

Explore / Discover:
  - Grid of recommended content from non-followed accounts
  - Personalized by user interests (content-based + collaborative filtering)
  - Mix of photos, carousels, and short videos
  - Refreshable with new recommendations on each pull

Search:
  - Search for users (@mentions), hashtags (#travel), and locations
  - Autocomplete / typeahead as user types
  - Results blended and ranked by relevance + popularity

Notifications:
  - Real-time push notifications (APNs for iOS, FCM for Android)
  - In-app notification inbox
  - Aggregation: "user_a, user_b, and 48 others liked your photo"
  - User-configurable preferences (mute, email digest frequency)
```

---

## 2. Non-Functional Requirements

### 2.1 Core Non-Functional Targets

| Requirement | Target | Justification |
|-------------|--------|---------------|
| **Availability** | 99.99% uptime (< 52 minutes downtime/year) | Social media users expect always-on access; even brief outages make headlines |
| **Latency** | Feed load < 200ms p99; photo upload ack < 2s | Users scroll feeds rapidly; perceived lag kills engagement |
| **Consistency** | Eventual consistency for feed; strong consistency for likes/follow counts | Users tolerate seeing a post 2s late but not a wrong follow state |
| **Durability** | Zero data loss for uploaded photos -- 11 nines of durability | Users' photos are irreplaceable memories; data loss is unforgivable |
| **Scalability** | Support 1B+ registered users, 500M DAU | Must handle organic growth and viral spikes without degradation |
| **Global Reach** | Multi-region deployment with CDN for low-latency worldwide | Instagram operates in 200+ countries; latency varies dramatically |

### 2.2 Consistency Model Breakdown

Different features demand different consistency levels. This is a critical interview discussion point.

| Feature | Consistency | Why |
|---------|-------------|-----|
| Feed ordering | Eventual | Seeing a post 2 seconds late is acceptable |
| Like count | Eventual | Off-by-a-few is acceptable; exact count reconciled async |
| Follow action | Strong | User expects immediate "Following" state change in the UI |
| Photo upload | Strong | "Your photo was posted" must be accurate; user checks immediately |
| Story expiration | Eventual | +/- a few seconds on the 24-hour window is fine |
| Comment thread | Eventual | Brief delay in seeing new comments is tolerable |
| Notification delivery | Eventual | Seconds of delay in push notifications is normal |
| Search index | Eventual | New posts appearing in search within seconds is acceptable |
| User profile updates | Strong | Username/bio changes must reflect immediately |

### 2.3 Latency Budgets by Operation

```
Operation                    Target (p99)    Target (p50)
---------------------------  --------------  --------------
Feed load (cached)           < 100ms         < 30ms
Feed load (cache miss)       < 300ms         < 150ms
Photo upload acknowledgment  < 2,000ms       < 800ms
Photo fully processed        < 30,000ms      < 10,000ms
Like toggle                  < 100ms         < 20ms
Comment post                 < 200ms         < 50ms
Story tray load              < 150ms         < 50ms
Search autocomplete          < 100ms         < 30ms
Explore page load            < 300ms         < 150ms
Profile page load            < 200ms         < 80ms
Notification delivery        < 5,000ms       < 1,000ms
```

### 2.4 Security & Privacy Requirements

| Requirement | Description |
|-------------|-------------|
| **Authentication** | OAuth 2.0 with JWT tokens; 2FA support; session management |
| **Authorization** | Private accounts restrict content to approved followers only |
| **Data Encryption** | TLS 1.3 in transit; AES-256 at rest for all stored data |
| **EXIF Stripping** | Remove GPS coordinates, camera info from all uploaded photos |
| **GDPR Compliance** | Right to erasure within 30 days; data export; consent management |
| **COPPA Compliance** | Age verification; restricted features for minors |
| **Content Moderation** | ML-based NSFW/violence detection; human review pipeline |
| **Rate Limiting** | Per-user and per-IP rate limits to prevent abuse and bot activity |

---

## 3. Core Assumptions & Constraints

### 3.1 System Characteristics

- **Read-heavy system**: read-to-write ratio approximately 100:1. Most users consume content; a fraction create it.
- **Average user follows ~200 accounts** and is followed by ~100 (long-tail distribution: most users have < 500 followers).
- **Celebrity/influencer accounts** (> 1M followers) represent < 0.1% of users but generate outsized fan-out load.
- **Photos dominate storage**; videos (Reels) are important but treated as a separate pipeline with different encoding, storage, and CDN requirements.
- **Mobile-first**: 95%+ of traffic originates from iOS/Android apps. Web is secondary.
- **Diurnal traffic patterns**: peak usage is 2-3x average, typically in evenings local time.
- **Global user base**: traffic comes from every timezone, so there is no true "quiet period" globally.

### 3.2 Key Numerical Assumptions for Estimation

```
Registered users:                     1,000,000,000  (1 Billion)
Daily Active Users (DAU):               500,000,000  (500 Million)
Monthly Active Users (MAU):             800,000,000  (800 Million)
DAU/MAU ratio:                          62.5%        (healthy engagement)

Average follows per user:               200
Average followers per user:             100          (asymmetric due to celebrities)
Celebrity threshold (for fan-out):      10,000 followers
Percentage of users who are celebrities: < 0.1%

Photos uploaded per day:                100,000,000  (100 Million)
Stories uploaded per day:               500,000,000  (500 Million)
Average photos viewed per user per day: ~300         (feed + explore + profiles)
Feed sessions per user per day:         ~10
Feed loads per session:                 ~5           (scroll, refresh, re-open)

Average photo sizes:
  Original upload:   ~3 MB
  Full resolution:   ~1.5 MB (1080x1080, compressed)
  Medium resolution: ~300 KB  (640x640)
  Thumbnail:         ~50 KB   (150x150)

Average story size:                     ~500 KB
Story TTL:                              24 hours
```

---

## 4. Estimation & Capacity Planning

### 4.1 User & Traffic Numbers

| Metric | Value | How Derived |
|--------|-------|-------------|
| Registered users | 1 Billion | Given assumption |
| Daily Active Users (DAU) | 500 Million | 50% of registered |
| Monthly Active Users (MAU) | 800 Million | 80% of registered |
| Photos uploaded per day | 100 Million | ~20% of DAU creates content |
| Stories uploaded per day | 500 Million | Stories are lighter, more frequent |
| Average photos viewed per user per day | ~300 | feed + explore + profiles |
| Feed requests per day | 25 Billion | 500M users x 10 sessions x 5 feed loads |
| Feed QPS (average) | ~290K/sec | 25B / 86,400 |
| Feed QPS (peak, 2x) | ~580K/sec | 2x average for evening peaks |

### 4.2 Storage Estimation

```
Photo Storage (per day):
  100M photos/day x 3 resolutions (thumb, medium, full) = 300M image files/day
  Average sizes: thumb=50KB, medium=300KB, full=1.5MB
  Per photo total: 50KB + 300KB + 1.5MB = ~1.85MB
  Daily: 100M x 1.85MB = 185 TB/day
  Yearly: 185 TB x 365 = ~67.5 PB/year

  With replication factor 3 across regions: ~200 PB/year raw storage
  With S3 lifecycle (Standard -> IA -> Glacier):
    Year 1 (Standard):  67.5 PB x $0.023/GB = ~$1.55M/month
    Year 2+ (IA):       67.5 PB x $0.0125/GB = ~$844K/month
    Year 3+ (Glacier):  67.5 PB x $0.004/GB = ~$270K/month

Story Storage (per day):
  500M stories/day x avg 500KB = 250 TB/day
  But TTL is 24h, so steady-state storage: ~250 TB (auto-purged)
  Stories that become "Highlights" persist: ~5% = 12.5 TB/day added to permanent storage

Metadata Storage:
  Per photo: ~1KB (caption, tags, location, timestamps, counters)
  100M photos/day x 1KB = 100 GB/day metadata
  Yearly: ~36 TB of metadata
  10-year accumulation: ~360 TB (fits in a sharded PostgreSQL cluster)

Feed Timeline Storage (Cassandra):
  Per timeline entry: ~100 bytes (photo_id, poster_id, timestamp, type)
  20B timeline writes/day x 100 bytes = 2 TB/day
  30-day TTL: steady-state ~60 TB in Cassandra
```

### 4.3 Bandwidth Estimation

```
Upload Bandwidth:
  100M photos/day x 1.5MB (original, pre-resize) = 150 TB/day
  150 TB / 86,400s = ~1.74 GB/s sustained upload bandwidth
  Peak (2x): ~3.5 GB/s

Download Bandwidth (read-heavy):
  500M DAU x 300 photos/day x avg 300KB (medium res) = 45 PB/day
  45 PB / 86,400s = ~520 GB/s sustained download
  CDN absorbs 90%+, so origin serves ~50 GB/s
  Peak CDN egress: ~1 TB/s

Feed API Bandwidth:
  25B feed requests/day / 86,400s = ~290K requests/sec
  Average feed response size: ~50KB (20 posts x metadata + CDN URLs)
  290K req/sec x 50KB = ~14.5 GB/s of API bandwidth

Story Bandwidth:
  Assume 300M users view stories daily, each viewing ~20 stories
  300M x 20 x 500KB = 3 PB/day of story media delivery
  Mostly served from CDN edge caches
```

### 4.4 Compute Estimation

```
Photo Processing Pipeline:
  100M photos/day / 86,400s = ~1,160 photos/sec
  Each photo needs: resize x3, filter apply, EXIF strip, thumbnail gen, BlurHash, moderation ML
  ~2 seconds of CPU per photo => ~2,320 CPU-cores dedicated to processing
  Peak (2x): ~4,640 CPU-cores
  On c6g.8xlarge (32 vCPU): ~145 instances at peak

Feed Generation:
  Fan-out writes for non-celebrity posts: ~231K writes/sec to Cassandra
  Feed reads: ~290K/sec (served from Redis cache, ~85% hit rate)
  Cache-miss feed builds: ~43K/sec (each requires Cassandra read + celebrity merge + ML ranking)

ML Inference:
  Feed ranking model inference: ~43K inferences/sec (cache misses)
  At ~50ms per inference on GPU: ~2,150 concurrent inference slots needed
  On g5.xlarge (1 A10G GPU, ~200 inferences/sec): ~215 GPU instances
  Explore ranking: additional ~100 GPU instances

Cache Requirements:
  Hot feed cache: 500M users x 20 posts x 500B per post ref = ~5 TB
  Photo metadata cache: top 1B photos x 1KB = ~1 TB
  User profile cache: 500M active users x 500B = ~250 GB
  Story cache: 250 TB steady-state (Redis cluster or tiered cache)
  Session cache: 500M sessions x 200B = ~100 GB
  Rate limit counters: 500M users x 10 endpoints x 16B = ~80 GB
  Total core cache: ~10 TB across Redis clusters (excluding story media)
```

### 4.5 Summary Table

| Resource | Estimate | Notes |
|----------|----------|-------|
| Photo storage/year | ~67.5 PB (raw), ~200 PB (replicated) | Lifecycle policies reduce cost over time |
| Story steady-state storage | ~250 TB | Auto-purged via TTL |
| Metadata storage/year | ~36 TB | Sharded PostgreSQL |
| Upload bandwidth | ~1.7 GB/s avg, ~3.5 GB/s peak | Originals only |
| CDN egress bandwidth | ~520 GB/s avg, ~1 TB/s peak | Images + stories |
| Feed QPS (average) | ~290K/sec | 25B requests/day |
| Feed QPS (peak) | ~580K/sec | 2x average |
| Photo processing throughput | ~1,200 photos/sec avg | ~2,400 peak |
| Cache cluster size | ~10 TB (Redis) | Excludes story media |
| ML inference instances | ~315 GPU instances | Feed + Explore ranking |
| Photo processing instances | ~145 compute instances | At peak load |

### 4.6 Cost Estimation (Rough Order of Magnitude)

```
Monthly infrastructure costs (approximate):

S3 Storage:           $1.5M   (67.5 PB/year at blended lifecycle rates)
CDN Egress:           $5.0M   (520 GB/s average, volume discounts)
Compute (API/workers): $2.0M  (thousands of instances for services)
GPU (ML inference):   $1.5M   (315 GPU instances)
Redis Cluster:        $0.8M   (10 TB across cluster)
Cassandra Cluster:    $0.5M   (60 TB steady-state)
PostgreSQL:           $0.5M   (256 shards + replicas)
Kafka:                $0.3M   (high-throughput message bus)
Elasticsearch:        $0.2M   (search cluster)
Other (DNS, LB, monitoring): $0.5M

Estimated total: ~$12-15M/month ($150-180M/year)

Note: Meta operates its own data centers, so actual costs are significantly
lower than public cloud pricing. These estimates use AWS pricing as a baseline
for interview purposes.
```

---

## 5. API Design

### 5.1 Design Principles

- **RESTful with versioned endpoints** (`/v1/`, `/v2/`): allows non-breaking API evolution.
- **Cursor-based pagination** (not offset-based): stable pagination even as new content is inserted.
- **Idempotency keys** on write endpoints: prevents duplicate operations on network retries.
- **Rate limiting headers** in every response: `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **Consistent error format**: `{ error: { code, message, details } }`.
- **Authentication**: Bearer token (JWT) in `Authorization` header for all endpoints.

### 5.2 Photo Endpoints

```
POST   /v1/photos/upload
  Headers: Authorization: Bearer <token>
           Idempotency-Key: <client-uuid>
  Body: multipart/form-data {
    image:    <binary>,
    caption:  "Sunset at the beach #travel",
    location: { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
    tags:     ["user_id_1", "user_id_2"],
    filter:   "clarendon"
  }
  Response 202: {
    photo_id: "1234567890",
    status: "processing",
    estimated_ready_at: "2026-04-07T12:00:05Z"
  }

GET    /v1/photos/{photo_id}
  Response 200: {
    photo_id: "1234567890",
    user: { user_id, username, profile_pic_url },
    cdn_urls: {
      thumbnail: "https://cdn.instagram.com/.../thumb.webp",
      medium:    "https://cdn.instagram.com/.../medium.webp",
      full:      "https://cdn.instagram.com/.../full.webp"
    },
    blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
    caption: "Sunset at the beach #travel",
    location: { name: "San Francisco", lat: 37.77, lng: -122.42 },
    like_count: 4523,
    comment_count: 87,
    liked_by_viewer: true,
    created_at: "2026-04-07T12:00:00Z"
  }

DELETE /v1/photos/{photo_id}
  Response 204: No Content
```

### 5.3 Feed Endpoints

```
GET    /v1/feed?cursor=<timestamp_or_token>&limit=20
  Response 200: {
    posts: [
      {
        photo_id, user, cdn_urls, blurhash, caption,
        like_count, comment_count, liked_by_viewer,
        top_comments: [...],   // first 2 comments inlined
        created_at
      },
      ...
    ],
    next_cursor: "eyJ0cyI6MTY4...",  // opaque cursor token
    has_more: true
  }

POST   /v1/feed/seen
  Body: { post_ids: ["123", "456", "789"] }
  Response 204: No Content
  Purpose: Track which posts the user has seen (prevents re-showing, feeds ranking model)
```

### 5.4 Social Endpoints

```
POST   /v1/users/{user_id}/follow
  Response 200: { following: true, follower_count: 1501 }

DELETE /v1/users/{user_id}/follow
  Response 200: { following: false, follower_count: 1500 }

GET    /v1/users/{user_id}/followers?cursor=<token>&limit=50
  Response 200: { users: [...], next_cursor, total_count }

GET    /v1/users/{user_id}/following?cursor=<token>&limit=50
  Response 200: { users: [...], next_cursor, total_count }
```

### 5.5 Engagement Endpoints

```
POST   /v1/photos/{photo_id}/like
  Response 200: { liked: true, like_count: 4524 }

DELETE /v1/photos/{photo_id}/like
  Response 200: { liked: false, like_count: 4523 }

GET    /v1/photos/{photo_id}/likers?cursor=<token>&limit=50
  Response 200: { users: [...], next_cursor, total_count }

POST   /v1/photos/{photo_id}/comments
  Body: { text: "Beautiful shot!", reply_to_comment_id: null }
  Response 201: { comment_id, user, text, created_at }

GET    /v1/photos/{photo_id}/comments?cursor=<token>&limit=20&sort=recent|relevant
  Response 200: { comments: [...], next_cursor }

DELETE /v1/photos/{photo_id}/comments/{comment_id}
  Response 204: No Content
```

### 5.6 Story Endpoints

```
POST   /v1/stories/upload
  Body: multipart/form-data {
    media:     <binary>,
    stickers:  [{ type: "poll", question: "Yes or No?", options: ["Yes", "No"], x: 0.5, y: 0.3 }],
    duration:  5,
    audience:  "all" | "close_friends"
  }
  Response 201: { story_id, media_url, expires_at }

GET    /v1/stories?user_ids=self,following
  Response 200: {
    story_tray: [
      {
        user: { user_id, username, profile_pic_url },
        has_unseen: true,
        latest_story_at: "2026-04-07T11:00:00Z",
        stories: [
          { story_id, media_url, media_type, stickers, duration, view_count, created_at, expires_at }
        ]
      },
      ...
    ]
  }

POST   /v1/stories/{story_id}/seen
  Response 204: No Content

GET    /v1/stories/{story_id}/viewers?cursor=<token>&limit=50
  Response 200: { viewers: [...], next_cursor, total_count }
```

### 5.7 Discovery Endpoints

```
GET    /v1/explore?cursor=<offset_token>&limit=30
  Response 200: {
    items: [
      { type: "photo", photo_id, cdn_urls, like_count, user },
      { type: "carousel", photos: [...], user },
      { type: "video", video_url, thumbnail_url, user }
    ],
    next_cursor: "...",
    topics: ["travel", "food", "fitness"]  // detected interest categories
  }

GET    /v1/search?q=<query>&type=user|hashtag|location|top
  Response 200: {
    users:     [{ user_id, username, full_name, profile_pic_url, follower_count, verified }],
    hashtags:  [{ tag, post_count, trending }],
    locations: [{ location_id, name, city, country, post_count }],
    top_posts: [{ photo_id, cdn_urls, like_count }]
  }

GET    /v1/search/autocomplete?q=<partial>&limit=10
  Response 200: {
    suggestions: [
      { type: "user", value: "johndoe", display: "John Doe (@johndoe)", verified: true },
      { type: "hashtag", value: "travel", display: "#travel (45M posts)" }
    ]
  }
```

### 5.8 Notification Endpoints

```
GET    /v1/notifications?cursor=<token>&limit=20
  Response 200: {
    notifications: [
      {
        id: "notif_123",
        type: "like_aggregated",
        message: "user_a, user_b, and 48 others liked your photo",
        actors: [{ user_id, username, profile_pic_url }],
        target: { type: "photo", photo_id, thumbnail_url },
        read: false,
        created_at: "2026-04-07T11:30:00Z"
      }
    ],
    next_cursor: "...",
    unread_count: 12
  }

POST   /v1/notifications/mark-read
  Body: { notification_ids: ["notif_123", "notif_456"] }
  Response 204: No Content

PUT    /v1/notifications/preferences
  Body: {
    push_likes: true,
    push_comments: true,
    push_follows: true,
    push_mentions: true,
    email_digest: "weekly"
  }
  Response 200: { updated: true }
```

### 5.9 Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "You have exceeded the rate limit for this endpoint.",
    "details": {
      "limit": 350,
      "remaining": 0,
      "reset_at": "2026-04-07T13:00:00Z"
    },
    "request_id": "req_abc123"
  }
}
```

Common error codes:

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | INVALID_REQUEST | Malformed request body or missing required fields |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Authenticated but not authorized (e.g., private account) |
| 404 | NOT_FOUND | Resource does not exist or was deleted |
| 409 | CONFLICT | Duplicate action (e.g., already following this user) |
| 413 | PAYLOAD_TOO_LARGE | Image exceeds 30MB size limit |
| 429 | RATE_LIMITED | Too many requests; back off and retry |
| 500 | INTERNAL_ERROR | Server error; retry with exponential backoff |
| 503 | SERVICE_UNAVAILABLE | Temporary overload; retry after `Retry-After` header |
