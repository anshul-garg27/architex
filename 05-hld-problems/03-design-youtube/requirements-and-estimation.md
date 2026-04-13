# Design YouTube / Video Streaming Platform -- Requirements and Estimation

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Clarifying Questions](#clarifying-questions)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Capacity Estimation](#capacity-estimation)
6. [Storage Estimation](#storage-estimation)
7. [Bandwidth Estimation](#bandwidth-estimation)
8. [API Design](#api-design)
9. [Data Model Overview](#data-model-overview)

---

## Problem Statement

Design a global video streaming platform similar to YouTube that allows users to upload, transcode, store, and stream video content at massive scale. The system must handle billions of monthly users, hundreds of hours of new video uploaded every minute, and deliver smooth adaptive-bitrate playback with low startup latency across every region on Earth.

This is one of the most challenging system design problems because it sits at the intersection of:
- **Massive storage** (exabytes of video data)
- **Extreme read throughput** (billions of views per day)
- **Compute-heavy processing** (transcoding pipelines)
- **Global content delivery** (CDN at planetary scale)
- **Real-time user interaction** (comments, likes, live streaming)

---

## Clarifying Questions

Before diving in, these are the questions you should ask (or state assumptions about) in an interview:

| Question | Assumed Answer |
|----------|---------------|
| What are the primary features? | Upload, watch (adaptive bitrate), search, recommendations, like/comment, subscriptions, live streaming |
| What is the target scale? | 2B monthly active users, 800M DAU |
| What video resolutions do we support? | 240p, 360p, 480p, 720p, 1080p, 4K |
| What is the max video length? | No hard limit (support hours-long content) |
| Do we need live streaming? | Yes, basic live streaming support |
| Do we need monetization/ads? | Out of scope for this design |
| What regions do we serve? | Global -- every continent |
| What clients do we support? | Web, mobile (iOS/Android), smart TVs, game consoles |
| Do we need offline download? | Out of scope |
| What about content moderation? | Mention briefly, not a deep focus |

---

## Functional Requirements

### Core Features (Must Have)

1. **Video Upload**
   - Users can upload videos in common formats (MP4, MOV, AVI, MKV, WebM)
   - Support for large files (up to 256 GB per YouTube's actual limit)
   - Resumable uploads (handle network interruptions)
   - Automatic transcoding to multiple resolutions and codecs

2. **Video Streaming / Playback**
   - Adaptive Bitrate Streaming (ABR) -- player switches quality based on bandwidth
   - Support HLS (HTTP Live Streaming) and DASH (Dynamic Adaptive Streaming over HTTP)
   - Low startup latency (video begins playing within 2 seconds)
   - Seek/scrub support with instant response

3. **Search**
   - Search by title, description, tags, and auto-generated captions
   - Autocomplete suggestions
   - Filters: upload date, duration, resolution, view count, relevance

4. **Recommendations**
   - Personalized home feed based on watch history, subscriptions, and preferences
   - "Up Next" suggestions during/after video playback
   - Trending and popular content discovery

5. **Engagement**
   - Like / dislike videos
   - Comment on videos (threaded replies)
   - Share videos (link generation)

6. **Subscriptions**
   - Subscribe to channels
   - Subscription feed showing latest uploads from subscribed channels
   - Notification when subscribed channel uploads new content

7. **Live Streaming**
   - Creators can broadcast live video
   - Real-time chat during live streams
   - Live-to-VOD (recorded live stream becomes a regular video after broadcast ends)

### Secondary Features (Nice to Have)

- Playlists and watch later
- Video chapters / timestamps
- Closed captions / subtitles (auto-generated and manual)
- Creator analytics dashboard
- Content moderation (automated + manual review)
- Watch history and resume playback

---

## Non-Functional Requirements

### Performance
| Metric | Target |
|--------|--------|
| Video startup latency | < 2 seconds (p95) |
| Time to first frame | < 1 second on broadband |
| Seek latency | < 500ms |
| Upload processing time | < 30 minutes for a 10-minute 1080p video |
| Search latency | < 200ms (p95) |
| Feed load time | < 500ms |

### Availability and Reliability
| Metric | Target |
|--------|--------|
| System availability | 99.99% (< 53 min downtime/year) |
| Video durability | 99.999999999% (11 nines -- no video loss ever) |
| Upload success rate | > 99.9% (resumable uploads handle failures) |
| Playback success rate | > 99.95% |

### Scalability
| Metric | Target |
|--------|--------|
| Monthly active users | 2 billion |
| Daily active users | 800 million |
| Concurrent viewers | Tens of millions |
| Upload rate | 500 hours of video per minute |
| Total videos stored | 800+ million videos |

### Global Reach
- Content served from CDN edge nodes in 100+ countries
- Multi-region data centers for redundancy
- ISP-level caching for popular content (Netflix Open Connect model)

### Security
- DRM for premium/protected content
- Rate limiting on uploads and API calls
- Content moderation pipeline (NSFW detection, copyright detection via Content ID)

---

## Capacity Estimation

### User and Traffic Estimates

```
Monthly Active Users (MAU):  2,000,000,000  (2 billion)
Daily Active Users (DAU):      800,000,000  (800 million, 40% of MAU)
```

### Video View Estimates

```
Average videos watched per user per day:  5
Total video views per day:                800M * 5 = 4,000,000,000  (4 billion)
Views per second (average):               4B / 86,400 = ~46,300 views/sec
Views per second (peak, ~4x average):     ~200,000 views/sec
```

### Upload Estimates

```
Upload rate:                              500 hours of video per minute
Per day:                                  500 * 60 * 24 = 720,000 hours/day
Per second:                               500 * 60 / 60 = 500 minutes/sec  (~8.3 hours/sec)
Uploads per day (avg 7 min per video):    720,000 * 60 / 7 = ~6.2 million videos/day
Uploads per second:                       ~72 uploads/sec
```

### Read-to-Write Ratio

```
Views per second:   46,300
Uploads per second: 72
Read:Write ratio:   ~640:1  (extremely read-heavy)
```

This extreme read-heavy ratio drives our architecture: optimize aggressively for reads (CDN, caching) while keeping writes (uploads, transcoding) asynchronous.

---

## Storage Estimation

### Raw Upload Storage

```
Upload rate:                      500 hours/min
Average raw bitrate:              ~50 MB/min (for 1080p source)
Raw storage per minute:           500 hours * 60 min * 50 MB = 1,500,000 MB = 1.5 TB/min
Raw storage per day:              1.5 TB * 60 * 24 = 2,160 TB = ~2.16 PB/day
Raw storage per year:             2.16 PB * 365 = ~788 PB/year
```

### Transcoded Storage (Multiple Resolutions)

Each video is transcoded into multiple resolutions. The storage multiplier:

| Resolution | Bitrate (approx) | Relative Size |
|-----------|-------------------|---------------|
| 240p | 0.4 Mbps | 0.05x |
| 360p | 0.7 Mbps | 0.09x |
| 480p | 1.5 Mbps | 0.19x |
| 720p | 3.0 Mbps | 0.38x |
| 1080p | 6.0 Mbps | 0.75x |
| 4K | 20.0 Mbps | 2.50x |
| **Total multiplier** | | **~3.96x** |

```
Transcoded storage per day:       2.16 PB * 3.96 = ~8.55 PB/day
Transcoded storage per year:      8.55 PB * 365 = ~3.12 EB/year (exabytes!)
```

### Cumulative Storage (Historical)

```
YouTube has been running since 2005 (~20 years of video).
Estimated total storage:          Tens of exabytes (50-100+ EB)
This requires distributed object storage at unprecedented scale.
```

> **Real-world reference**: Google has confirmed YouTube stores over 1 billion hours of video. At an average combined bitrate across resolutions, this translates to dozens of exabytes.

### Metadata Storage

```
Videos in database:               ~800 million
Average metadata per video:       ~5 KB (title, description, tags, stats, thumbnails URLs)
Total metadata:                   800M * 5 KB = 4 TB
User records:                     2B * 2 KB = 4 TB
Comments:                         ~500 billion total * 0.5 KB = 250 TB
```

Metadata is tiny compared to video data -- easily fits in a sharded relational database.

---

## Bandwidth Estimation

### Streaming Bandwidth

```
Views per second (average):       46,300
Average video bitrate served:     ~5 Mbps (mix of mobile 480p and desktop 1080p)
Egress bandwidth (average):       46,300 * 5 Mbps = 231,500 Mbps = ~231 Tbps
Peak bandwidth (4x):              ~925 Tbps
```

> **Real-world reference**: YouTube's actual peak traffic is estimated at 400+ Tbps. Most of this is served from CDN edge, not origin.

### Upload Bandwidth (Ingress)

```
Upload rate:                      1.5 TB/min = 25 GB/sec = 200 Gbps
Peak upload bandwidth:            ~800 Gbps
```

### CDN Cache Hit Ratio

```
Target CDN cache hit ratio:       95%+
Traffic served from edge:         ~220 Tbps (from CDN)
Traffic hitting origin:           ~12 Tbps (cache misses, long-tail content)
```

The Pareto principle applies: the top 20% of videos account for 80%+ of views. These must be pre-cached at CDN edges.

---

## API Design

### 1. Upload Video

```
POST /api/v1/videos/upload

Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  X-Upload-Id: <resumable-upload-id>       # For resumable uploads
  Content-Range: bytes 0-999999/5000000    # For chunked uploads

Body (multipart):
  file:         <binary video data>
  title:        string (required, max 100 chars)
  description:  string (optional, max 5000 chars)
  tags:         string[] (optional)
  category:     string (optional)
  visibility:   enum [public, private, unlisted]
  thumbnail:    <binary image> (optional, auto-generated if omitted)

Response 202 Accepted:
{
  "video_id": "dQw4w9WgXcQ",
  "upload_url": "https://upload.youtube.internal/v1/upload/abc123",
  "status": "processing",
  "estimated_processing_time_seconds": 1200
}
```

**Why 202?** Upload triggers async transcoding. The video is not immediately available.

### 2. Get Video Feed (Home / Subscription / Trending)

```
GET /api/v1/feed?type={home|subscriptions|trending}&cursor=<cursor>&limit=20

Headers:
  Authorization: Bearer <token>

Response 200:
{
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Never Gonna Give You Up",
      "thumbnail_url": "https://cdn.yt.com/thumb/dQw4w9WgXcQ/hq.jpg",
      "channel": { "id": "ch123", "name": "Rick Astley", "avatar_url": "..." },
      "duration_seconds": 213,
      "view_count": 1400000000,
      "published_at": "2009-10-25T06:57:33Z"
    }
  ],
  "next_cursor": "eyJsYXN0X2lkIjoiYWJjMTIzIn0="
}
```

### 3. Stream Video

```
GET /api/v1/videos/{video_id}/manifest

Response 200:
{
  "manifest_url": "https://cdn.yt.com/video/dQw4w9WgXcQ/master.m3u8",
  "formats": [
    { "resolution": "1080p", "bitrate": 6000, "codec": "h264" },
    { "resolution": "720p",  "bitrate": 3000, "codec": "h264" },
    { "resolution": "480p",  "bitrate": 1500, "codec": "h264" },
    { "resolution": "360p",  "bitrate": 700,  "codec": "h264" },
    { "resolution": "240p",  "bitrate": 400,  "codec": "h264" }
  ],
  "captions": [
    { "language": "en", "url": "https://cdn.yt.com/captions/dQw4w9WgXcQ/en.vtt" }
  ]
}
```

The client fetches the HLS/DASH manifest and the player handles adaptive bitrate switching automatically.

### 4. Search Videos

```
GET /api/v1/search?q=<query>&sort={relevance|date|views}&duration={short|medium|long}&cursor=<cursor>&limit=20

Response 200:
{
  "results": [
    {
      "video_id": "...",
      "title": "...",
      "description_snippet": "...matched text...",
      "thumbnail_url": "...",
      "channel": { "id": "...", "name": "..." },
      "view_count": 50000,
      "published_at": "2024-01-15T..."
    }
  ],
  "total_results": 15234,
  "next_cursor": "..."
}
```

### 5. Like / Unlike Video

```
POST /api/v1/videos/{video_id}/like
DELETE /api/v1/videos/{video_id}/like

Response 200:
{
  "video_id": "dQw4w9WgXcQ",
  "like_count": 15000001,
  "user_liked": true
}
```

### 6. Get Recommendations

```
GET /api/v1/recommendations?video_id={video_id}&limit=20

Response 200:
{
  "recommendations": [
    {
      "video_id": "...",
      "title": "...",
      "thumbnail_url": "...",
      "channel": { ... },
      "relevance_score": 0.94,
      "reason": "Because you watched 'System Design Interview'"
    }
  ]
}
```

### 7. Post Comment

```
POST /api/v1/videos/{video_id}/comments

Body:
{
  "text": "Great video!",
  "parent_comment_id": null    # null for top-level, set for replies
}

Response 201:
{
  "comment_id": "cmt_abc123",
  "text": "Great video!",
  "author": { "id": "user123", "name": "John" },
  "created_at": "2024-03-15T10:30:00Z",
  "like_count": 0
}
```

### 8. Subscribe / Unsubscribe

```
POST /api/v1/channels/{channel_id}/subscribe
DELETE /api/v1/channels/{channel_id}/subscribe

Response 200:
{
  "channel_id": "ch123",
  "subscriber_count": 32000001,
  "subscribed": true
}
```

---

## Data Model Overview

### Core Entities

```
Video
  - video_id (PK, string, globally unique)
  - user_id (FK to User)
  - title, description, tags[]
  - status: enum [uploading, processing, ready, failed, removed]
  - visibility: enum [public, private, unlisted]
  - duration_seconds
  - view_count, like_count, dislike_count, comment_count
  - created_at, published_at
  - manifest_url (HLS/DASH manifest)
  - thumbnail_urls (multiple sizes)

User
  - user_id (PK)
  - username, display_name, email
  - avatar_url
  - subscriber_count
  - created_at

Comment
  - comment_id (PK)
  - video_id (FK)
  - user_id (FK)
  - parent_comment_id (nullable, for threading)
  - text
  - like_count
  - created_at

Subscription
  - subscriber_id (FK to User)
  - channel_id (FK to User)
  - created_at
  - (composite PK: subscriber_id + channel_id)

VideoLike
  - user_id (FK)
  - video_id (FK)
  - type: enum [like, dislike]
  - created_at
  - (composite PK: user_id + video_id)
```

---

## Summary: Key Numbers for the Interview

| Metric | Value |
|--------|-------|
| MAU | 2 billion |
| DAU | 800 million |
| Video views/day | 4 billion |
| Views/sec (avg) | ~46K |
| Views/sec (peak) | ~200K |
| Upload rate | 500 hours/min |
| New videos/day | ~6.2 million |
| Raw upload storage/day | ~2.16 PB |
| Total transcoded storage/day | ~8.55 PB |
| Streaming bandwidth (avg) | ~231 Tbps |
| CDN cache hit ratio | 95%+ |
| Read:Write ratio | ~640:1 |

These numbers immediately tell us:
1. **CDN is the most critical component** -- 95%+ of traffic must be served from edge
2. **Transcoding is the most expensive compute** -- must use spot instances and DAG parallelism
3. **Storage is the biggest cost** -- tiered storage (hot/warm/cold) is essential
4. **View counting needs special treatment** -- cannot do 46K DB writes/sec per counter
