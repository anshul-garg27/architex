# Design Nearby Friends / Proximity Service

## Uber Interview Question -- Complete System Design Walkthrough

> "Design a system where users can see which of their friends are nearby
> on a map in real time, similar to Facebook Nearby Friends, Snap Map,
> or WhatsApp Live Location."

---

## 1. Clarifying Questions to Ask the Interviewer

Before diving in, demonstrate structured thinking by asking these questions:

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | What does "nearby" mean -- fixed radius or configurable? | Determines spatial query design |
| 2 | How real-time does it need to be? Sub-second or a few seconds delay? | WebSocket vs polling tradeoff |
| 3 | Do users share location with ALL friends or selected friends? | Privacy model complexity |
| 4 | Do we need historical location or only current/live? | Storage requirements change dramatically |
| 5 | Is this a standalone app or a feature inside an existing social app? | Friend graph -- build or reuse? |
| 6 | Mobile only, or web too? | Battery optimization scope |
| 7 | Global service or single region? | Geo-partitioning strategy |
| 8 | Do we need to show friends on a map or just a list? | Rendering and update frequency |

**Interviewer's likely answers:** Fixed 5 km radius (configurable later), updates within
a few seconds are fine, selective sharing (privacy controls), feature inside an existing
social app (friend graph exists), mobile-first, global service, show on a map.

---

## 2. Functional Requirements

### Core Features (Must Have)

```
FR-1: See friends within a 5 km radius on a real-time map
FR-2: Real-time location updates (every 30 seconds)
FR-3: Friends list with distance and last-seen timestamp
FR-4: Privacy controls:
       - Toggle feature on/off entirely
       - Share location with ALL friends
       - Share location with SELECTED friends only
       - Hide from specific friends (blocklist)
FR-5: Battery-efficient location tracking
FR-6: Notification when a friend arrives nearby
```

### Extended Features (Nice to Have)

```
FR-7:  Location history / breadcrumb trail (last 8 hours)
FR-8:  "Ghost mode" -- see others but don't share your location
FR-9:  ETA to friend's location
FR-10: Group meetup -- share location with a temporary group
FR-11: Place-based discovery -- "3 friends are at Central Park"
FR-12: Geofence alerts -- "Notify me when Alice is within 1 km"
```

---

## 3. Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Latency** | Location update propagated to friends within 2-3 seconds | Real-time feel without being wasteful |
| **Availability** | 99.9% uptime | Users expect always-on social features |
| **Consistency** | Eventual consistency is acceptable | Seeing a friend's position 2-3 sec stale is fine |
| **Scalability** | Support 10M concurrent users, 333K location updates/sec | See estimation below |
| **Battery** | < 5% additional battery drain per hour when active | Users will disable feature if it drains battery |
| **Privacy** | Location NEVER shared without explicit consent | Legal (GDPR, CCPA) and trust requirements |
| **Security** | End-to-end encryption of location data | Location is extremely sensitive PII |
| **Data Retention** | Auto-delete location data after 24 hours | Minimize exposure surface |
| **Fault Tolerance** | Graceful degradation -- stale positions shown if service is slow | Better than blank map |

---

## 4. Back-of-the-Envelope Estimation

### 4.1 User Scale

```
Total registered users:          500 M
Daily Active Users (DAU):        100 M
Users with Nearby Friends ON:    10%  of DAU = 10 M concurrent
Average friends per user:        400
Average friends with feature ON: 10%  of 400 = 40 friends
Average nearby friends:          ~5   (within 5 km at any time)
```

### 4.2 Location Update Throughput

```
Active users sending updates:    10 M
Update frequency:                1 update every 30 seconds
Updates per second:              10,000,000 / 30 = ~333,333 updates/sec

                    +--------------------------+
                    |   333K writes/sec        |
                    |   This is our critical   |
                    |   bottleneck to solve    |
                    +--------------------------+
```

### 4.3 Fan-Out Calculation (Reads)

```
Each location update must be checked against the user's friend list:

Updates/sec:                     333K
Average friends to check:        40 (those with feature enabled)
Proximity checks/sec:            333K x 40 = ~13.3 M checks/sec

But only ~5 friends are actually nearby, so:
Push notifications/sec:          333K x 5 = ~1.67 M push messages/sec

                    +--------------------------+
                    |   13.3M proximity        |
                    |   checks/sec             |
                    |   1.67M push msgs/sec    |
                    +--------------------------+
```

### 4.4 Storage Estimation

```
Location record per user:
  - user_id:       8 bytes
  - latitude:      8 bytes (double)
  - longitude:     8 bytes (double)
  - h3_cell_index: 8 bytes
  - timestamp:     8 bytes
  - accuracy:      4 bytes
  - speed:         4 bytes
  Total:           ~48 bytes per record

Current location store (in-memory):
  10M users x 48 bytes = ~480 MB
  Easily fits in a Redis cluster!

Location history (24 hours):
  10M users x 2880 updates/day x 48 bytes = ~1.4 TB/day
  Need efficient time-series storage with auto-expiry
```

### 4.5 Bandwidth Estimation

```
Incoming (location updates):
  333K updates/sec x 48 bytes = ~16 MB/sec = ~128 Mbps
  Very manageable.

Outgoing (push to nearby friends):
  1.67M pushes/sec x 48 bytes = ~80 MB/sec = ~640 Mbps
  Significant but within range for a distributed system.

WebSocket connections:
  10M concurrent persistent connections
  At ~10 KB memory per connection = ~100 GB total
  Need ~50-100 WebSocket servers (100K-200K connections each)
```

### 4.6 Summary Table

| Metric | Value | Notes |
|--------|-------|-------|
| Concurrent users | 10 M | 10% of 100M DAU |
| Location writes/sec | 333 K | 1 update per 30 sec |
| Proximity checks/sec | 13.3 M | 333K x 40 friends |
| Push notifications/sec | 1.67 M | 333K x 5 nearby friends |
| In-memory location store | ~480 MB | Current positions only |
| Location history/day | ~1.4 TB | 24-hour retention |
| WebSocket connections | 10 M | Persistent connections |
| WebSocket servers needed | 50-100 | 100K-200K conn each |
| Inbound bandwidth | ~128 Mbps | Location updates |
| Outbound bandwidth | ~640 Mbps | Push notifications |

---

## 5. API Design

### 5.1 REST APIs

```
# Update my location
PUT /v1/location
Headers: Authorization: Bearer <token>
Body: {
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy_meters": 10,
  "speed_mps": 1.5,
  "bearing": 270,
  "timestamp": "2025-01-15T10:30:00Z"
}
Response: 200 OK

# Get nearby friends (fallback if WebSocket is down)
GET /v1/friends/nearby?radius_km=5
Response: {
  "friends": [
    {
      "user_id": "u_123",
      "name": "Alice",
      "latitude": 37.7751,
      "longitude": -122.4180,
      "distance_meters": 150,
      "last_updated": "2025-01-15T10:29:45Z",
      "speed_mps": 0.0
    }
  ],
  "search_radius_km": 5,
  "timestamp": "2025-01-15T10:30:00Z"
}

# Update privacy settings
PUT /v1/location/privacy
Body: {
  "sharing_mode": "selected_friends",  // "off" | "all_friends" | "selected_friends"
  "allowed_friend_ids": ["u_456", "u_789"],
  "blocked_friend_ids": ["u_999"]
}

# Get my sharing settings
GET /v1/location/privacy
```

### 5.2 WebSocket Events

```
# Client -> Server: Location update (same as REST but over WebSocket)
{
  "type": "location_update",
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy_meters": 10,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}

# Server -> Client: Friend location update (pushed in real time)
{
  "type": "friend_location",
  "data": {
    "user_id": "u_123",
    "name": "Alice",
    "latitude": 37.7751,
    "longitude": -122.4180,
    "distance_meters": 150,
    "last_updated": "2025-01-15T10:29:45Z"
  }
}

# Server -> Client: Friend came nearby
{
  "type": "friend_nearby_alert",
  "data": {
    "user_id": "u_123",
    "name": "Alice",
    "distance_meters": 480
  }
}

# Server -> Client: Friend went out of range
{
  "type": "friend_left_range",
  "data": {
    "user_id": "u_123"
  }
}
```

---

## 6. Data Model

### 6.1 User Location (Redis -- Hot Store)

```
Key:   loc:{user_id}
Value: {
  "lat": 37.7749,
  "lng": -122.4194,
  "h3_cell": "872830828ffffff",   // H3 resolution 7
  "ts": 1705312200,
  "acc": 10,
  "spd": 1.5
}
TTL:   5 minutes (auto-expire if user stops sending)
```

### 6.2 H3 Cell Index (Redis -- Reverse Index)

```
Key:   h3:{cell_id}
Value: SET of user_ids in this cell
       e.g., {"u_001", "u_042", "u_789"}

Purpose: Given a cell, who is in it?
         Used for spatial proximity queries.
```

### 6.3 Privacy Settings (PostgreSQL)

```sql
CREATE TABLE location_privacy (
    user_id         BIGINT PRIMARY KEY,
    sharing_mode    VARCHAR(20) NOT NULL DEFAULT 'off',
    -- 'off', 'all_friends', 'selected_friends'
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE location_allowlist (
    user_id         BIGINT NOT NULL,
    friend_id       BIGINT NOT NULL,
    PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE location_blocklist (
    user_id         BIGINT NOT NULL,
    blocked_id      BIGINT NOT NULL,
    PRIMARY KEY (user_id, blocked_id)
);
```

### 6.4 Location History (Time-Series DB / Cassandra)

```
Partition Key:  user_id
Clustering Key: timestamp (DESC)
Columns:        latitude, longitude, h3_cell, accuracy, speed
TTL:            24 hours (auto-delete)
```

### 6.5 Friend Graph (Graph DB / Redis Adjacency List)

```
Key:   friends:{user_id}
Value: SET of friend user_ids
       e.g., {"u_002", "u_003", "u_004", ...}

Alternative: Neo4j/DGraph for richer friend queries
```

---

## 7. Core Concepts to Understand Before Architecture

### 7.1 Why Spatial Indexing Matters

```
Naive approach:  For each user update, check ALL friends' locations
                 10M users x 40 friends = 400M distance calculations
                 THIS DOES NOT SCALE.

Smart approach:  Assign each user to a SPATIAL CELL (H3 or Geohash)
                 Only check friends in the SAME cell + neighboring cells
                 Reduces checks from 40 to ~5 on average
```

### 7.2 H3 vs Geohash

```
+------------------+----------------------------+----------------------------+
| Property         | H3 (Uber's System)         | Geohash                    |
+------------------+----------------------------+----------------------------+
| Shape            | Hexagons                   | Rectangles                 |
| Edge distortion  | Uniform distances          | Edges vary at borders      |
| Neighbor count   | Always 6                   | 8 (including diagonals)    |
| Hierarchical     | Yes (res 0-15)             | Yes (precision 1-12)       |
| Created by       | Uber (open source)         | Gustavo Niemeyer (2008)    |
| Proximity query  | Cell + 6 neighbors = 7     | Cell + 8 neighbors = 9     |
| Best for         | Ride-sharing, hexagonal    | General geo-indexing       |
|                  | grids, equal-area cells    |                            |
+------------------+----------------------------+----------------------------+

For Nearby Friends, H3 at resolution 7 gives:
  - Cell edge length: ~1.22 km
  - Cell area: ~5.16 km^2
  - Query: center cell + 6 neighbors covers ~36 km^2
  - This comfortably covers a 5 km radius circle (~78.5 km^2)
  - For better coverage, use k-ring with k=2 (19 cells, ~98 km^2)
```

### 7.3 How H3 Cell Assignment Works

```
1. User sends GPS coordinates: (37.7749, -122.4194)
2. System computes H3 cell:    h3.latlng_to_cell(37.7749, -122.4194, 7)
                                -> "872830828ffffff"
3. Store user in that cell:     SADD h3:872830828ffffff user_123
4. Remove from old cell:        SREM h3:872830826ffffff user_123
   (if user moved to new cell)
```

### 7.4 Why WebSocket, Not Polling

```
Polling approach:
  10M users polling every 5 seconds = 2M requests/sec
  Each request returns ~5 friends x 48 bytes = 240 bytes
  But the HTTP overhead is ~500 bytes per request
  Total: 2M x 740 bytes = 1.48 GB/sec  (wasteful!)
  Most polls return NO CHANGE.

WebSocket approach:
  10M persistent connections (memory cost)
  Only push when there IS a change
  1.67M pushes/sec x 48 bytes = 80 MB/sec
  18x more efficient than polling!
  And updates arrive instantly, not after 5-second delay.
```

---

## 8. Key Tradeoffs to Mention in Interview

| Decision | Option A | Option B | Our Choice | Why |
|----------|----------|----------|------------|-----|
| Communication | Polling | WebSocket | **WebSocket** | Real-time push, 18x bandwidth savings |
| Spatial index | Geohash | H3 | **H3** | Uniform hexagonal cells, Uber's proven system |
| Location store | PostgreSQL + PostGIS | Redis in-memory | **Redis** | 333K writes/sec needs in-memory speed |
| Friend graph | Graph DB (Neo4j) | Redis adjacency list | **Redis** | Simple lookup, no complex traversals needed |
| Fan-out | Push (on location update) | Pull (on friend request) | **Push** | Real-time requirement demands push |
| Consistency | Strong | Eventual | **Eventual** | 2-3 sec stale location is perfectly acceptable |
| History | PostgreSQL | Cassandra / TimescaleDB | **Cassandra** | Time-series writes at scale, auto-TTL |

---

## 9. Interview Anti-Patterns to Avoid

```
WRONG: "Let's just store lat/lng in MySQL and do distance queries."
WHY:   At 333K writes/sec, relational DB will choke. Need in-memory store.

WRONG: "We'll check all 400 friends on every location update."
WHY:   400 x 333K = 133M checks/sec. Use spatial indexing instead.

WRONG: "We'll poll the server every second for friend locations."
WHY:   10M users x 1 req/sec = 10M HTTP requests/sec. Use WebSocket.

WRONG: "GPS is always available and accurate."
WHY:   GPS drains battery. Need adaptive: GPS / WiFi / cell tower.

WRONG: "We'll just broadcast location to all friends."
WHY:   Privacy violation. Need explicit opt-in and granular controls.
```

---

## 10. Comparison with Real-World Systems

| Feature | Facebook Nearby Friends | Snap Map | WhatsApp Live Location | Our Design |
|---------|------------------------|----------|----------------------|------------|
| Sharing model | Mutual opt-in | Opt-in to share | Per-chat share | Flexible (FR-4) |
| Update frequency | ~5 min | ~15 sec | ~30 sec | ~30 sec |
| Duration | Always on | Always on | 15m/1h/8h timer | Always on + timer |
| Precision | Approximate | Exact | Exact | Exact |
| Ghost mode | No | Yes (see but not seen) | N/A | Yes (FR-8) |
| Group sharing | No | No | Yes (group chat) | Yes (FR-10) |
| History | No | Heatmap | Breadcrumb trail | 24h history (FR-7) |
| Discontinued? | Yes (2022) | No | No | N/A |
