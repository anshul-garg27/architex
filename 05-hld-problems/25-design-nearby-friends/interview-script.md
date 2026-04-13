# Design Nearby Friends -- 45-Minute Interview Script

## How to Use This Script

This is a minute-by-minute simulation of a real system design interview for
"Design Nearby Friends" (like Facebook Nearby Friends or Snapchat's Snap Map).
Read both the **Interviewer** and **Candidate** lines aloud to internalize the
pacing, the transitions, and the depth expected at each stage. The Candidate
responses represent a strong Senior / Staff-level answer.

---

## Opening (0:00 -- 1:00)

**Interviewer:** Today's problem: design a "Nearby Friends" feature. When a user
opens the app, they should see which of their friends are within a few miles,
and roughly how far away. Think Facebook Nearby Friends or the Snap Map. Take
a moment and then walk me through your approach.

**Candidate:** Great question. This is a real-time geospatial problem with some
interesting constraints around fan-out, battery life, and privacy. I'll start
with clarifying questions, then requirements, estimation, high-level design, APIs,
data model, and deep-dive into two areas: how we efficiently find nearby friends
without checking everyone, and how we manage battery drain on mobile devices.
Let's go.

**Interviewer:** Sounds good.

---

## Clarifying Questions (1:00 -- 4:00)

**Candidate:** First -- when you say "nearby," what's the radius? Are we talking
1 mile, 5 miles, or configurable?

**Interviewer:** Default 5 miles. Let users configure it: 1, 5, 10, or 25 miles.

**Candidate:** How real-time does this need to be? Should I see a friend appear
instantly when they walk into range, or is a 30-second delay acceptable?

**Interviewer:** Soft real-time. A 10-30 second delay is fine. This isn't
real-time gaming.

**Candidate:** Is this opt-in? Can users choose who sees their location?

**Interviewer:** Yes, fully opt-in. Users can share location with all friends,
a custom list, or nobody. Privacy is critical.

**Candidate:** How many friends does a typical user have?

**Interviewer:** Average 300 friends, power users up to 5,000.

**Candidate:** Should we show the actual location on a map, or just distance and
direction?

**Interviewer:** Show approximate distance ("0.5 mi away") and optionally a dot
on a map. Don't show exact coordinates.

**Candidate:** Is this always-on in the background, or only when the user has the
app open?

**Interviewer:** Location sharing is active only when the app is in the foreground.
But I want you to think about what happens during brief background intervals.

**Candidate:** Last question -- what's our scale? How many users?

**Interviewer:** 500 million registered users, 100 million daily active. About 10%
of DAU have the feature enabled at any time.

**Candidate:** So about 10 million concurrent users sharing their location.
Let me organize the requirements.

---

## Requirements (4:00 -- 7:00)

### Functional Requirements

**Candidate:** Here are the core features:

1. **Location update** -- active users periodically send their GPS location
2. **Nearby friends list** -- show friends within the configured radius, with
   approximate distance
3. **Privacy controls** -- users choose who can see their location (all friends,
   custom list, or nobody)
4. **Real-time updates** -- the nearby list updates as friends move in or out of
   range, with ~30 second refresh
5. **Approximate distance display** -- show "0.3 mi away" or "2.1 mi away," not
   exact coordinates

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Update latency | Friend appears within 30 seconds of coming into range |
| Location update frequency | Every 30 seconds while app is active |
| Concurrent sharing users | 10 million |
| Availability | 99.9% -- this is a social feature, not safety-critical |
| Privacy | Location data encrypted in transit and at rest, auto-expires |
| Battery impact | < 5% additional battery drain per hour |

**Interviewer:** Good. The 10 million concurrent users is the number that should
scare you. Let's see the estimation.

---

## Estimation (7:00 -- 10:00)

**Candidate:** Let me size the key dimensions.

**Location updates:**
- 10 million active users, each sending location every 30 seconds
- Update rate: 10M / 30 = ~333,000 location updates per second
- Each update: ~100 bytes (user_id, lat, lng, timestamp, accuracy)
- Inbound bandwidth: 333K * 100 bytes = ~33 MB/s -- very manageable

**Nearby query:**
- Each update triggers a "who's nearby?" computation
- Naive approach: for each user, check all 300 friends -> 333K * 300 = 100M
  distance calculations per second. That's too many.
- Smart approach: use a spatial index so we only check friends in the same
  geographic cell. I'll explain in the deep dive.

**Storage:**
- We only need the LATEST location per user (ephemeral, not historical)
- 10M users * 100 bytes = 1 GB. Fits in a single Redis instance.
- Location data has a TTL -- if a user hasn't updated in 5 minutes, they're
  considered inactive and removed.

**Fan-out:**
- When a user's location changes, we need to notify friends who are watching
  them AND who are within range
- Worst case: a popular user with 5,000 friends, all nearby
- But most notifications are filtered by distance -- only nearby friends get
  notified
- Average fan-out per update: ~5-20 nearby friends

**Candidate:** The key insight is that this is NOT a broadcast problem -- most
friends are far away. The spatial index is what makes this feasible.

---

## High-Level Design (10:00 -- 18:00)

**Candidate:** Here's the architecture:

```
    ┌──────────────────────┐
    │    Mobile Client      │
    │  - GPS provider       │
    │  - Location sender    │
    │  - Nearby friends UI  │
    └──────────┬───────────┘
               │
               │  WebSocket (bidirectional)
               │
    ┌──────────▼───────────┐
    │   WebSocket Gateway   │
    │   - Connection mgmt   │
    │   - User session map  │
    │   - 10M connections   │
    └──────────┬───────────┘
               │
     ┌─────────┼──────────────────┐
     │         │                  │
     ▼         ▼                  ▼
┌─────────┐ ┌──────────────┐ ┌──────────────┐
│ Location│ │  Nearby      │ │  Privacy     │
│ Service │ │  Computation │ │  Service     │
│         │ │  Service     │ │              │
└────┬────┘ └──────┬───────┘ └──────────────┘
     │             │
     ▼             ▼
┌──────────────────────────────────────┐
│        Location Store (Redis)         │
│  - H3 cell index -> user set          │
│  - user_id -> {lat, lng, timestamp}   │
│  - TTL: 5 minutes                     │
└──────────────────────────────────────┘

     │
     ▼
┌──────────────────────────────────────┐
│     Pub/Sub Layer (Redis / Kafka)     │
│  - Channel per H3 cell               │
│  - Nearby notifications              │
└──────────────────────────────────────┘
```

**Candidate:** Let me walk through the flow step by step.

**Step 1: User opens the app.**
The mobile client establishes a WebSocket connection to the WebSocket Gateway. It
starts sending GPS location every 30 seconds.

**Step 2: Location update arrives.**
The Location Service receives the update and does two things:
1. Stores the user's location in Redis, keyed by `user:{user_id}:location`.
2. Computes the user's **H3 cell** at resolution 4 (roughly 25 km hexagons) and
   adds the user to the set `h3_cell:{cell_id}:users`.

**Why H3?** H3 is Uber's hexagonal hierarchical spatial index. The world is divided
into hexagonal cells at multiple resolutions. Hexagons are better than squares
because they have uniform adjacency -- every hexagon has exactly 6 neighbors at equal
distance. At resolution 4, each cell is about 25 km across. For a 5-mile (8 km)
radius, we only need to check the user's cell and its 6 neighbors.

**Step 3: Nearby computation.**
When a user's location updates, the Nearby Computation Service:
1. Gets the user's friend list (cached from the social graph service).
2. Checks privacy settings -- filter to friends who have opted in to sharing with
   this user.
3. Gets the user's H3 cell and its 6 neighbors (7 cells total).
4. For each of these 7 cells, intersect the cell's user set with the friend list.
5. For the resulting candidates (friends in nearby cells), compute exact Haversine
   distance.
6. Return friends within the configured radius, sorted by distance.

**Step 4: Push notification.**
The result is pushed to the user via their WebSocket connection. The UI updates
the nearby friends list.

**Step 5: Reverse notification.**
When User A moves into range of User B, User B also needs to know. When we detect
A is near B, we push a notification to B as well (if B is online and has A in their
sharing list).

**Interviewer:** How do you avoid checking all friends? You mentioned H3, but walk
me through the math. With 300 friends, how many do you actually check?

**Candidate:** Let's work through it.

At H3 resolution 4, each cell covers roughly 500 square kilometers. The total land
area of the Earth is about 150 million square kilometers. That's about 300,000 cells.

With 10 million active users spread across 300,000 cells, the average cell has about
33 users. Even in dense cities, a cell might have 10,000 users.

For a user with 300 friends, the expected number of friends in any given cell is:
300 * (33 / 10M) = 0.001. Even in a dense cell with 10,000 users:
300 * (10,000 / 10M) = 0.3 friends per cell.

Checking 7 cells (center + 6 neighbors), we expect about 0.007 to 2.1 friends to
check distance for. Compare that to checking all 300 friends naively.

The operation is: "intersect the friend set (300 IDs) with the cell user set
(33-10,000 IDs)." Using Redis sets, this is a SINTER operation that takes
O(min(N, M)) time -- a few microseconds.

**Interviewer:** Smart. But what about users with 5,000 friends in a stadium during
a concert? Lots of friends in one cell.

**Candidate:** Good stress test. At a concert, many friends might be in the same
cell. Say 200 out of 5,000 friends are in the same cell. We compute 200 Haversine
distances, which is trivial -- each is a few floating-point operations. Even 5,000
distance calculations take under 1 ms.

The real concern is fan-out: when User A updates their location and 200 friends
are nearby, all 200 need a notification. That's 200 WebSocket pushes. For a
single user this is fine. But if ALL concert-goers update simultaneously:

- 50,000 people at a concert, each with 200 nearby friends
- 50,000 * 200 = 10 million notifications in a 30-second window
- ~333,000 notifications per second from just this one event

This is where we batch and throttle. Instead of pushing on every location update,
we aggregate: the Nearby Computation Service runs a per-user aggregation every
30 seconds and sends one update with the complete nearby list, not individual
friend-appeared / friend-disappeared events.

---

## API Design (18:00 -- 21:00)

### Location Update (Client -> Server via WebSocket)

```json
{
    "type": "location_update",
    "payload": {
        "lat": 37.7749,
        "lng": -122.4194,
        "accuracy_meters": 10,
        "timestamp": 1712476800,
        "battery_level": 72,
        "movement_type": "stationary"   // stationary, walking, driving
    }
}
```

### Nearby Friends Push (Server -> Client via WebSocket)

```json
{
    "type": "nearby_friends_update",
    "payload": {
        "friends": [
            {
                "user_id": "u_alice",
                "display_name": "Alice",
                "distance_miles": 0.3,
                "direction": "NE",
                "last_updated": 1712476790,
                "approximate_location": {
                    "lat": 37.776,
                    "lng": -122.418
                }
            },
            {
                "user_id": "u_bob",
                "display_name": "Bob",
                "distance_miles": 1.8,
                "direction": "S",
                "last_updated": 1712476770,
                "approximate_location": null     // Bob shares distance only, not location
            }
        ],
        "updated_at": 1712476800
    }
}
```

### Privacy Settings (REST API)

```
PUT /v1/location-sharing/settings
{
    "sharing_enabled": true,
    "visibility": "custom_list",      // "all_friends", "custom_list", "nobody"
    "allowed_friends": ["u_alice", "u_bob", "u_charlie"],
    "share_approximate_location": true,  // false = distance only
    "radius_miles": 5
}

Response 200:
{
    "status": "updated",
    "settings_version": 4
}
```

### Get Nearby Friends (REST fallback)

```
GET /v1/nearby-friends?lat=37.7749&lng=-122.4194&radius_miles=5

Response 200:
{
    "friends": [...],    // same format as WebSocket push
    "expires_in_seconds": 30
}
```

**Interviewer:** Why both WebSocket and REST for nearby friends?

**Candidate:** The WebSocket connection delivers real-time pushes while the app is
active. But when the app first opens, it needs an immediate snapshot before the
WebSocket pushes start flowing. The REST endpoint provides that initial load. It
also serves as a fallback if the WebSocket connection drops.

---

## Data Model (21:00 -- 24:00)

### Location Store (Redis)

```
# Per-user latest location
Key:    "loc:{user_id}"
Value:  { "lat": 37.7749, "lng": -122.4194, "ts": 1712476800,
          "h3_r4": "842a100ffffffff", "accuracy": 10 }
TTL:    300 seconds (auto-expire inactive users)

# H3 cell membership
Key:    "h3:842a100ffffffff:users"     (H3 cell at resolution 4)
Type:   Redis SET of user_ids
TTL:    300 seconds

# User's nearby friends cache
Key:    "nearby:{user_id}"
Value:  [{ "friend_id": "u_alice", "distance": 0.3, "ts": 1712476800 }, ...]
TTL:    60 seconds
```

### Privacy Settings (PostgreSQL)

```sql
CREATE TABLE location_sharing_settings (
    user_id         BIGINT PRIMARY KEY,
    sharing_enabled BOOLEAN DEFAULT FALSE,
    visibility      VARCHAR(16) DEFAULT 'all_friends',
    share_location  BOOLEAN DEFAULT TRUE,   -- if false, share distance only
    radius_miles    INT DEFAULT 5,
    settings_version INT DEFAULT 1,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_sharing_allowlist (
    user_id         BIGINT NOT NULL,
    friend_id       BIGINT NOT NULL,
    PRIMARY KEY (user_id, friend_id)
);
```

### Connection Registry (Redis)

```
# Which WebSocket server is a user connected to?
Key:    "conn:{user_id}"
Value:  "ws-server-17.us-east-1"
TTL:    120 seconds (refreshed on heartbeat)
```

**Candidate:** Notice that we store almost nothing persistently. Locations are
ephemeral (5-minute TTL in Redis). We don't store location history -- that's a
privacy design choice. The only persistent data is the user's sharing preferences
in PostgreSQL.

**Interviewer:** What about the friend list? You mentioned querying it. Where does
that come from?

**Candidate:** The friend list comes from the social graph service (separate system).
We cache each user's friend list in Redis with a 10-minute TTL:

```
Key:    "friends:{user_id}"
Type:   Redis SET of friend user_ids
TTL:    600 seconds
```

When a user adds or removes a friend, the social graph service publishes an event
to Kafka, and we invalidate the cache.

---

## Deep Dive 1: Geospatial Indexing with H3 (24:00 -- 33:00)

**Interviewer:** Let's dig deeper into H3. Why hexagons? Why not just use geohashing
or a quadtree?

**Candidate:** The choice of spatial index matters a lot for "find nearby entities."
Let me compare the three approaches.

**Geohashing (square grid):**
- Divides the world into rectangles using a Z-order curve.
- Problem: neighbors in geographic space may have completely different geohash
  prefixes. A user standing at the edge of a geohash cell has nearby friends in
  up to 8 adjacent cells, and finding those cells requires prefix manipulation.
- Bigger problem: geohash cells are not uniform in size. Near the poles, cells are
  very distorted.
- Edge effects: two points 1 meter apart can be in different geohash cells with
  no common prefix.

**Quadtree:**
- Hierarchical spatial decomposition. Good for spatial queries.
- Problem: a quadtree is a data structure that must be maintained in memory. With
  10 million users constantly moving, updating the tree is expensive.
- Not a standard like H3 -- harder to distribute across services.

**H3 (hexagonal grid):**
- Hexagons have **uniform adjacency**: every cell has exactly 6 neighbors, all at
  the same distance. With squares, diagonal neighbors are further away.
- **Multiple resolutions**: resolution 0 has 122 cells, resolution 4 has ~288,000
  cells, resolution 7 has ~100 million cells. We pick the resolution that matches
  our query radius.
- **No edge effects**: a hexagonal tiling means nearby points in different cells are
  always in adjacent cells. No weird edge cases like geohashing.
- **Standard library**: Uber's open-source H3 library is production-tested and
  available in every language.

**For our 5-mile radius:**
- H3 resolution 4: cells are ~25 km across. A 5-mile (8 km) radius fits within
  a cell and its immediate neighbors.
- We query 7 cells (center + 6 neighbors) to find all candidate friends.
- This is guaranteed to cover a circle of radius up to ~12.5 km (half the cell
  diameter, covering worst-case edge positioning).

**Resolution selection logic:**

| User Radius | H3 Resolution | Cell Edge Length | Cells to Search |
|-------------|---------------|------------------|-----------------|
| 1 mile | 5 | ~8 km | 7 |
| 5 miles | 4 | ~22 km | 7 |
| 10 miles | 4 | ~22 km | 7 (with distance filter) |
| 25 miles | 3 | ~60 km | 7 |

**Interviewer:** When a user moves from one H3 cell to another, what happens?

**Candidate:** Cell transition is a critical event. Here's the flow:

1. User sends location update with new coordinates.
2. Location Service computes the H3 cell at resolution 4.
3. If the cell changed from the previous update:
   a. Remove user from old cell's Redis set: `SREM h3:{old_cell}:users {user_id}`
   b. Add user to new cell's Redis set: `SADD h3:{new_cell}:users {user_id}`
   c. Update the user's location record with the new cell ID.
   d. Trigger a full nearby recomputation (since the candidate set changed).
4. If the cell didn't change, just update the coordinates and check if any nearby
   friends moved significantly.

Because cells are large (~25 km), most location updates don't trigger a cell change.
Only about 1 in 50-100 updates causes a transition, which keeps the cell index
maintenance cost low.

**Interviewer:** What about the ring query? If a user is near the edge of a cell,
friends just outside the 6-neighbor ring might be within 5 miles but in a non-
adjacent cell. Do you miss them?

**Candidate:** Good catch. At resolution 4, the worst case is when the user is at
the vertex of three hexagons and the friend is at the opposite vertex of the
non-adjacent hexagon. The maximum distance from any point in a hexagon to its
center is about 12.5 km for resolution 4. Since our radius is 8 km (5 miles) and
the cell-center-to-center distance between adjacent cells is ~22 km, checking 7
cells (center + 6 neighbors) covers a radius of about 22 km from the user's cell
center. This comfortably covers the 8 km query radius even in worst-case edge
positioning.

For the 25-mile radius, we drop to resolution 3 (larger cells), and again 7 cells
are sufficient.

If we needed to support truly arbitrary radii, we'd use `h3.gridDisk(cell, k)` to
get a ring of radius k cells. For k=1, that's 7 cells. For k=2, it's 19 cells. The
set intersection cost scales linearly with the number of cells, which is fine.

---

## Deep Dive 2: Battery Optimization (33:00 -- 40:00)

**Interviewer:** Let's talk about the elephant in the room -- battery drain. GPS
every 30 seconds will kill the battery. How do you handle that?

**Candidate:** Battery optimization is what separates a toy implementation from a
production-grade feature. There are five techniques we use:

**Technique 1: Adaptive update frequency.**
Not every user needs 30-second updates. We dynamically adjust based on context:

| Condition | Update Interval | GPS Mode |
|-----------|----------------|----------|
| Stationary (no movement for 2 min) | 120 seconds | Passive (network location only) |
| Walking (< 5 km/h) | 60 seconds | Low-power GPS |
| Driving (> 20 km/h) | 15 seconds | Full GPS |
| No nearby friends within 10 miles | 120 seconds | Passive |
| Multiple nearby friends | 30 seconds | Low-power GPS |

The server sends a `location_config` message through the WebSocket telling the
client which mode to use:

```json
{
    "type": "location_config",
    "payload": {
        "update_interval_seconds": 120,
        "gps_mode": "passive",
        "reason": "no_nearby_friends"
    }
}
```

**Technique 2: Significant location change API.**
iOS and Android both provide a "significant location change" API that wakes the app
only when the device has moved a meaningful distance (typically 500+ meters). This
uses cell tower and WiFi triangulation, which costs essentially zero battery. We
register for this event so that even when the app is in low-power mode, a big move
triggers a full GPS update.

**Technique 3: Geofencing, not polling.**
Instead of polling "am I near any friends?", we create geofences around known friend
locations. The OS monitors geofences using low-power hardware. When the user enters a
geofence, the OS wakes our app, and we do a full location update.

For example: Alice is at (37.77, -122.42). We create a 5-mile geofence around her.
When Bob enters that geofence, his phone wakes our app, and we start high-frequency
GPS for Bob.

Limitation: most OSes limit geofences to 20-100 per app. So we can only geofence
around the 20 closest friends. That's usually plenty.

**Technique 4: Server-side prediction.**
If the server knows the user is stationary, it doesn't need frequent updates to
confirm. The server predicts "this user is still at the same location" and only
requests a full GPS update if a friend's location has changed enough to affect the
nearby list.

The server sends a `heartbeat_only` message when it doesn't need location:

```json
{
    "type": "heartbeat_only",
    "payload": {
        "message": "no location update needed",
        "next_full_update_in_seconds": 120
    }
}
```

The client responds with a lightweight heartbeat (keeping the WebSocket alive)
without activating GPS.

**Technique 5: Batch and defer.**
When the app is backgrounded, we stop location updates entirely. No GPS, no network
calls. When the app returns to foreground, we do a single GPS fix and send the update.
The server marks the user as "inactive" after 5 minutes of no updates (the Redis
TTL). Friends see the user disappear from the nearby list, which is the correct
behavior -- the user isn't actively using the feature.

**Interviewer:** What about battery drain from the WebSocket connection itself?

**Candidate:** A WebSocket connection over TLS costs about 1-2% battery per hour
just for the keepalive heartbeats. To reduce this:

1. **Use HTTP/2 or QUIC with server push.** The mobile client can multiplex the
   nearby friends channel over the same connection used for chat, notifications,
   etc. One connection serves many features.

2. **Heartbeat interval.** We set the WebSocket heartbeat to 60 seconds, not the
   default 30. This halves the keepalive traffic.

3. **When the app is backgrounded**, we close the WebSocket after 30 seconds. No
   point maintaining a connection for a feature that's only useful when the user is
   looking at the app.

**Interviewer:** Let's say a user has battery saver mode enabled on their phone.
What do you do?

**Candidate:** The OS notifies our app when battery saver is active. We respond by:
1. Switching to the most aggressive low-power mode: 300-second update interval,
   network-based location only (no GPS chip).
2. Disabling geofences (they cost battery too).
3. Showing a UI banner: "Location accuracy reduced to save battery."
4. The server stops asking for location updates and relies entirely on the client's
   passive updates.

If battery level drops below 15%, we disable the feature entirely and show "Nearby
Friends paused to save battery." This is what Facebook and Snapchat do.

---

## Trade-offs Discussion (40:00 -- 42:00)

**Candidate:** Key trade-offs:

| Decision | Trade-off |
|----------|-----------|
| **H3 hexagons over geohash squares** | H3 has uniform adjacency and no edge effects, but requires an external library. Geohashing is simpler but has edge artifacts. |
| **Redis over a dedicated geospatial DB (PostGIS)** | Redis is faster (sub-ms lookups) and handles ephemeral data with TTLs naturally. PostGIS is overkill for "latest location only" but would be better if we needed range queries or spatial joins. |
| **Ephemeral data (no history) vs. storing tracks** | Privacy-first design -- we don't retain location history. Trade-off: we can't show "where was Alice an hour ago" or do retroactive analysis. |
| **Adaptive frequency vs. fixed 30-second interval** | More complex client logic and server-to-client config messages, but 3-5x battery savings for stationary users. |
| **WebSocket over polling** | More server-side state (10M connections) but instant updates and lower overall battery drain compared to frequent HTTP polls. |
| **Resolution 4 H3 for all radii vs. multi-resolution** | Simpler implementation but larger-than-necessary cells for 1-mile radius. Multi-resolution would be optimal but adds complexity. |

**Interviewer:** What's your biggest operational risk?

**Candidate:** A thundering herd at a major event. Imagine 100,000 users at a
stadium, all with the feature enabled, all in the same H3 cell. Every location
update triggers an intersection of that user's friend set with a 100,000-member
cell set. SINTER on a 100K set is slow.

Mitigation: at high-density cells, we switch from cell-level set intersection to
a direct friend-list scan. If a cell has more than 50,000 users, we skip the
spatial index and instead iterate through the user's friend list, checking each
friend's location individually. With 300 friends, that's 300 Redis lookups -- still
fast and avoids the hot set problem.

---

## Future Improvements (42:00 -- 43:30)

**Candidate:** With more time, I'd add:

1. **Ghost mode / invisible mode.** Let users see nearby friends without sharing
   their own location. Requires careful UX -- it can feel creepy.

2. **Location sharing with duration.** "Share my location with Alice for 1 hour."
   Automatically stops after the timer expires.

3. **Place-based grouping.** Instead of just "Alice is 0.3 mi away," show "Alice,
   Bob, and Charlie are at Central Park." Use venue detection and clustering.

4. **Historical heatmaps.** With user consent, show "places you and Alice have both
   visited." This requires storing location history (opt-in only).

5. **Cross-app location sharing.** Share location with contacts who use a different
   messaging app, using a shared protocol.

6. **Predictive nearby.** "Alice usually gets coffee near you at 9 AM. She might
   be nearby soon." Requires ML on historical patterns (privacy-sensitive).

---

## Red Flags to Avoid

| Red Flag | Why It's Bad |
|----------|-------------|
| Checking distance against ALL friends on every update | O(N) per update with N friends * M users = doesn't scale. Must use spatial indexing. |
| Storing exact coordinates and sharing them with friends | Privacy violation. Always approximate -- round to 0.1 miles or jitter coordinates. |
| Polling REST API every 5 seconds for nearby friends | Kills battery and wastes bandwidth. Use WebSocket push. |
| No TTL on location data | Stale locations mislead users. A friend who closed the app 2 hours ago shouldn't appear nearby. |
| Ignoring battery optimization | The #1 reason users disable location features. Must be a first-class design concern. |
| Using a SQL database for real-time location lookups | Too slow for 333K updates/sec. Redis or an in-memory store is required. |
| No privacy controls | Location sharing without consent is a legal and ethical disaster. Must be opt-in with granular controls. |

---

## Power Phrases

Use these exact phrases to signal expertise during the interview:

- "We use **Uber's H3 hexagonal index** at resolution 4 to partition the world into
  cells. Each cell and its 6 neighbors cover our query radius, giving us O(1)
  spatial lookup instead of O(N) friend scanning."
- "Location data is **ephemeral with a 5-minute TTL** in Redis. We never persist
  location history. This is a privacy-by-design decision."
- "We use **adaptive update frequency** based on movement state -- stationary users
  update every 2 minutes with network-only location, saving 3-5x battery compared
  to fixed-interval GPS."
- "The nearby computation is a **set intersection in Redis**: SINTER of the user's
  friend set with the H3 cell's user set. This typically returns 0-5 candidates
  instead of scanning all 300 friends."
- "Cell transitions are rare -- at resolution 4, cells are ~25 km across, so a
  walking user changes cells every few hours. This keeps the **spatial index
  maintenance cost near zero**."
- "We register for the OS **significant location change API** which uses cell towers,
  not GPS, and costs essentially zero battery."
- "At high-density venues, we **fall back from cell intersection to direct friend
  list scan** to avoid hot-set contention on Redis."
- "The server dynamically adjusts the client's GPS mode via a **location_config
  WebSocket message**, reducing battery usage when no friends are nearby."
- "We create **OS geofences** around the 20 closest known friend locations, so the
  OS wakes our app on proximity triggers without continuous GPS polling."
- "Privacy controls are **bidirectional and granular** -- Alice can share with Bob
  without sharing with Charlie, and Bob can independently choose not to see Alice."
