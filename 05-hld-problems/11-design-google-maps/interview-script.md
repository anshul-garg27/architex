# Design Google Maps -- 45-Minute Interview Script

## How to Use This Script

This is a minute-by-minute simulation of a real system design interview for
"Design Google Maps / Navigation." Read both the **Interviewer** and **Candidate**
lines aloud to internalize the pacing, the transitions, and the depth expected at
each stage. The Candidate responses represent a strong Senior / Staff-level answer.

---

## Opening (0:00 -- 1:00)

**Interviewer:** Thanks for coming in. Today I'd like you to design Google Maps --
specifically the navigation and routing experience. A user opens the app, searches
for a destination, gets directions, and follows turn-by-turn navigation with live
traffic. Take a minute to gather your thoughts, and then we'll dive in.

**Candidate:** Great, thank you. I'm going to start by asking some clarifying
questions to nail down scope, then move to requirements, a quick estimation pass,
high-level architecture, APIs, data model, and then I'd like to deep-dive into two
areas: the routing engine and real-time traffic. Sound good?

**Interviewer:** Perfect. Let's go.

---

## Clarifying Questions (1:00 -- 4:00)

**Candidate:** Before I start designing, I need to understand a few things.

**Candidate:** First -- what modes of transport are in scope? Driving only, or also
walking, cycling, and transit?

**Interviewer:** Let's focus on driving directions for now. You can mention
multi-modal later if we have time.

**Candidate:** Got it. Second -- should I include the map rendering and tile serving
system, or focus purely on the routing and navigation backend?

**Interviewer:** I want both. Show me how map tiles are served AND how routing
works. Navigation is the star, but don't skip tile serving entirely.

**Candidate:** Understood. Third -- what about offline maps? Is download-for-offline
in scope?

**Interviewer:** Mention it as a feature, but don't spend time designing it.

**Candidate:** Fourth -- are we building the map data pipeline from raw
OpenStreetMap data, or can I assume a preprocessed road graph exists?

**Interviewer:** Assume the road graph exists. I care about how you serve it, not
how you build it from raw survey data.

**Candidate:** Fifth -- what about ETAs? Do we need real-time ETA updates during
navigation, or just an initial estimate?

**Interviewer:** Real-time. The ETA should update as the user drives and traffic
changes. That's a core feature.

**Candidate:** Great. Let me summarize what I've heard before moving on.

---

## Requirements (4:00 -- 7:00)

### Functional Requirements

**Candidate:** Based on our discussion, here are the functional requirements I'll
design for:

1. **Map tile serving** -- render a scrollable, zoomable map with vector tiles
2. **Place search** -- user types a destination, gets autocomplete results
3. **Route computation** -- given origin and destination, return driving directions
   with polyline, distance, and ETA
4. **Turn-by-turn navigation** -- real-time guidance with voice prompts, deviation
   detection, and automatic rerouting
5. **Live traffic overlay** -- show traffic conditions on the map and factor them
   into routing and ETA

**Interviewer:** What about alternative routes?

**Candidate:** Yes -- we should return two or three alternative routes ranked by ETA,
and let the user pick. I'll cover that in the routing engine deep-dive.

### Non-Functional Requirements

**Candidate:** On the non-functional side:

| Requirement | Target |
|-------------|--------|
| Route computation latency | < 1 second for 95th percentile |
| Tile serving latency | < 100 ms (CDN cache hit) |
| GPS ingest throughput | Millions of data points per second |
| ETA accuracy | Within 10% of actual travel time |
| Availability | 99.99% -- navigation is safety-critical |
| Global coverage | All countries with road data |

**Interviewer:** Those are good. Let's keep going.

---

## Estimation (7:00 -- 10:00)

**Candidate:** Let me do some quick numbers to inform architecture decisions.

**Candidate:** Users and traffic:
- 1 billion monthly active users, about 50 million daily active for navigation
- Each navigating user sends a GPS ping every 3 seconds
- That's roughly 50M / (24h average, with peak 5x) -- peak concurrent navigating
  users around 10 million
- GPS ingest rate at peak: 10M users * (1 ping / 3 sec) = ~3.3 million GPS points
  per second

**Candidate:** Road graph size:
- The global road network has roughly 1 billion nodes and 2 billion edges
- With Contraction Hierarchies preprocessing, the augmented graph is about 50-100 GB
- This fits in memory on a single beefy machine (256 GB RAM), and we replicate it

**Candidate:** Map tiles:
- 22 zoom levels, covering the world -- about 5 billion vector tiles total
- Average vector tile size: 20-50 KB compressed
- Total storage: ~100-250 TB
- But with CDN caching at 95%+ hit rate, origin only serves a fraction

**Candidate:** Routing queries:
- About 100 million route requests per day
- Peak QPS: ~5,000 route computations per second
- With Contraction Hierarchies, each query takes 1-5 ms of CPU, so one server handles
  ~500 QPS -- we need about 10-20 routing servers plus replicas

**Interviewer:** Good. The GPS ingest number is the one that drives architecture.
Let's see your design.

---

## High-Level Design (10:00 -- 18:00)

**Candidate:** Here's the architecture. I'll draw it in layers.

```
                        ┌──────────────────────────────┐
                        │       Mobile / Web Client     │
                        │  - Map renderer (vector tiles) │
                        │  - GPS sender                  │
                        │  - Navigation UI               │
                        └───────┬──────────┬─────────────┘
                                │          │
                    tile reqs   │          │  API calls / WebSocket
                                │          │
                        ┌───────▼──┐   ┌───▼──────────────┐
                        │   CDN     │   │  API Gateway      │
                        │ (tiles)   │   │  Auth, rate limit  │
                        └───────┬──┘   └───┬──────────────┘
                                │          │
                    cache miss  │          │
                                │    ┌─────┴──────────────────────────────┐
                        ┌───────▼──┐ │                                    │
                        │  Tile    │ │  ┌──────────┐  ┌──────────────┐   │
                        │  Service │ │  │  Search   │  │  Routing     │   │
                        │          │ │  │  Service  │  │  Engine      │   │
                        └──────────┘ │  └──────────┘  └──────┬───────┘   │
                                     │                       │           │
                                     │  ┌──────────────┐ ┌───▼────────┐ │
                                     │  │  Navigation   │ │  ETA       │ │
                                     │  │  Service      │ │  Service   │ │
                                     │  │  (WebSocket)  │ └──────┬─────┘ │
                                     │  └──────┬───────┘        │       │
                                     └─────────┼────────────────┘       │
                                               │                        │
                              ┌─────────────────┼────────────────────────┘
                              │                 │
                     ┌────────▼───────┐  ┌──────▼──────────┐
                     │  GPS Ingest    │  │  Traffic        │
                     │  (Kafka)       │  │  Service        │
                     │  3.3M msgs/sec │  │  (Flink)        │
                     └────────────────┘  └─────────────────┘
```

**Candidate:** Let me walk through the key services:

**1. CDN + Tile Service.** Map tiles are static assets. We use a global CDN with
200+ points of presence. Tiles are addressed by zoom/x/y coordinates. We serve
vector tiles so the client can style and rotate without re-fetching. Cache hit rate
is 95%+. On cache miss, the Tile Service reads from object storage (S3) and
generates tiles if needed.

**2. Search Service.** Autocomplete backed by Elasticsearch with geospatial boosting.
User types "Star" and we return "Starbucks" weighted by proximity to their location.

**3. Routing Engine.** This is the core. It holds the entire road graph in memory,
preprocessed with Contraction Hierarchies. It takes an origin and destination, runs a
bidirectional Dijkstra on the contracted graph, and returns a path in ~1 ms. I'll
deep-dive on this.

**4. ETA Service.** Combines the route's static distance with real-time traffic
segment speeds to produce an ETA. For ongoing navigation, it recalculates every
30 seconds.

**5. Navigation Service.** Maintains a WebSocket connection per navigating user.
Receives GPS updates, detects deviation from the planned route (if distance to
nearest route point > 50 meters), and triggers rerouting. Sends turn-by-turn
instructions ahead of each maneuver.

**6. GPS Ingest Pipeline.** All navigating users stream GPS pings. These go into
Kafka, then Flink processes them: map-matching (snapping GPS to road segments),
aggregating segment speeds, and detecting anomalies (accidents).

**7. Traffic Service.** Consumes Flink output. Maintains a Redis cluster where each
key is a road segment ID and the value is current average speed. The Routing Engine
reads this when computing traffic-aware routes.

**Interviewer:** Good overview. How do you handle the connection between the
Navigation Service and the Routing Engine? If a user deviates, do you call the
Routing Engine synchronously?

**Candidate:** Yes, it's a synchronous RPC because the user is waiting for new
directions. But the Routing Engine is fast -- Contraction Hierarchies give us 1-5 ms
per query. The Navigation Service calls it with the user's current GPS location as
the new origin and the same destination. The total deviation detection + reroute
response is under 200 ms end-to-end.

---

## API Design (18:00 -- 21:00)

**Candidate:** Let me define the key APIs.

### Route Computation

```
POST /v1/routes/compute
{
    "origin": { "lat": 37.7749, "lng": -122.4194 },
    "destination": { "lat": 37.3861, "lng": -122.0839 },
    "departure_time": "2026-04-07T08:00:00Z",
    "alternatives": true,
    "traffic_model": "best_guess"   // or "pessimistic", "optimistic"
}

Response:
{
    "routes": [
        {
            "route_id": "r_abc123",
            "polyline": "encoded_polyline_string",
            "distance_meters": 52400,
            "duration_seconds": 2940,
            "duration_in_traffic_seconds": 3360,
            "steps": [
                {
                    "instruction": "Head south on Market St",
                    "distance_meters": 400,
                    "duration_seconds": 60,
                    "maneuver": "straight",
                    "polyline": "partial_encoded"
                }
            ],
            "traffic_segments": [
                { "segment_id": "seg_001", "speed_kmh": 45, "congestion": "moderate" }
            ]
        }
    ]
}
```

### Start Navigation Session

```
WebSocket: wss://nav.maps.example.com/v1/navigate

Client -> Server (start):
{
    "action": "start_navigation",
    "route_id": "r_abc123",
    "user_id": "u_789"
}

Client -> Server (GPS update, every 3 seconds):
{
    "action": "gps_update",
    "lat": 37.7740,
    "lng": -122.4180,
    "speed_kmh": 35,
    "heading": 180,
    "timestamp": 1712476800
}

Server -> Client (guidance):
{
    "action": "guidance",
    "next_maneuver": "turn_right",
    "distance_to_maneuver_meters": 200,
    "instruction": "In 200 meters, turn right onto 3rd Street",
    "updated_eta_seconds": 3120,
    "rerouted": false
}
```

### Get Map Tiles

```
GET /v1/tiles/{z}/{x}/{y}.pbf
Headers: Accept-Encoding: gzip

Response: Protocol Buffer binary (vector tile)
Cache-Control: public, max-age=604800
```

**Interviewer:** Why Protocol Buffers for tiles instead of JSON?

**Candidate:** Size and parsing speed. A vector tile with geometry, labels, and
metadata might be 50 KB as a PBF but 200 KB as GeoJSON. On a mobile device,
parsing a PBF is also faster than parsing JSON. The Mapbox Vector Tile spec uses
PBF as the standard format, and it's what the WebGL renderer expects.

---

## Data Model (21:00 -- 24:00)

**Candidate:** There are several data stores, each optimized for its access pattern.

### Road Graph (In-Memory)

```
Node {
    node_id:    int64       // OSM node ID
    lat:        float64
    lng:        float64
    ch_level:   int32       // contraction hierarchy level
}

Edge {
    edge_id:    int64
    source:     int64       // node_id
    target:     int64       // node_id
    weight:     float32     // base travel time in seconds
    distance:   float32     // meters
    road_class:  enum       // motorway, primary, secondary, residential
    is_shortcut: bool       // CH shortcut edge
    child_edges: [int64]    // edges this shortcut represents (for unpacking)
}
```

The graph is serialized as a flat adjacency array for cache-friendly traversal.
Total size: ~80-100 GB with CH shortcuts.

### Real-Time Traffic (Redis)

```
Key:    "traffic:{segment_id}"
Value:  { "speed_kmh": 42, "confidence": 0.85, "updated_at": 1712476800 }
TTL:    300 seconds (stale traffic expires)
```

### Navigation Sessions (PostgreSQL)

```sql
CREATE TABLE navigation_sessions (
    session_id      UUID PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    route_id        VARCHAR(64) NOT NULL,
    origin_lat      DOUBLE PRECISION,
    origin_lng      DOUBLE PRECISION,
    dest_lat        DOUBLE PRECISION,
    dest_lng        DOUBLE PRECISION,
    started_at      TIMESTAMPTZ NOT NULL,
    ended_at        TIMESTAMPTZ,
    status          VARCHAR(16),   -- active, completed, cancelled
    reroute_count   INT DEFAULT 0
);
```

### GPS Traces (Kafka -> Cassandra archive)

```
Topic: gps-traces
Key: user_id
Value: { user_id, lat, lng, speed, heading, timestamp, session_id }
Partitioned by user_id for ordering guarantees per user
```

**Interviewer:** Why Redis for traffic and not just an in-memory map inside the
Routing Engine?

**Candidate:** Separation of concerns and consistency. The Traffic Service updates
segment speeds from Flink output. If traffic data lived inside each Routing Engine
replica, we'd need to push updates to all of them and worry about staleness
divergence. With Redis, there's a single source of truth for current traffic. The
Routing Engine reads traffic weights during query time -- a Redis lookup is sub-
millisecond, so it doesn't meaningfully slow down routing. This also lets the ETA
Service read the same data independently.

---

## Deep Dive 1: Routing Engine and Contraction Hierarchies (24:00 -- 33:00)

**Interviewer:** Alright, let's go deep on routing. I type in my destination and
expect a route in under a second. The global road network has a billion nodes. How
do you compute the shortest path in less than one second?

**Candidate:** This is the most critical piece. Running Dijkstra on the raw graph
would take 2-5 seconds for a cross-country route. We need preprocessing. The answer
is **Contraction Hierarchies**, which is what Google, Apple, and OSRM all use in
production.

**Candidate:** Here's how CH works at a high level:

**Step 1 -- Preprocessing (offline, takes hours).**
We assign every node an "importance" level. Less important nodes (residential street
intersections) get contracted first. Contracting a node means: for every pair of its
neighbors u and v, if the shortest path from u to v goes through this node, we add a
"shortcut" edge directly from u to v with the combined weight. Then we remove the
node from the graph. We repeat this for all nodes, from least to most important.

The result is a hierarchy: highways and major roads are at the top (contracted last),
and residential streets are at the bottom (contracted first). The graph now has the
original edges plus shortcut edges.

**Step 2 -- Query (online, ~1 ms).**
We run a **bidirectional Dijkstra**: one search expands forward from the origin, the
other expands backward from the destination. But here's the key -- each search only
relaxes edges going **upward** in the hierarchy. This means the forward search
quickly climbs from local streets to highways, and the backward search does the same
from the destination side. They meet in the middle at some high-importance node on a
highway.

Because we only go upward, the search space is tiny -- typically a few thousand nodes
instead of millions. That's why it takes 1-5 ms instead of seconds.

**Step 3 -- Path unpacking.**
The path found uses shortcut edges. To get actual turn-by-turn directions, we
recursively unpack each shortcut into the original edges it represents. This is O(path
length) and takes microseconds.

**Interviewer:** What about live traffic? If you preprocess the graph offline with
static weights, how do you account for a traffic jam that just started?

**Candidate:** Great question. There are two approaches, and we use both:

**Approach 1 -- Traffic-aware weight adjustment at query time.**
The CH preprocessing uses base travel times (free-flow speeds). At query time, when
the Routing Engine relaxes an edge, it looks up the current traffic speed for that
segment from Redis. If the segment is congested, the effective weight is higher. This
works because CH correctness only requires that shortcut weights are upper bounds --
we're not violating the hierarchy, we're just making some edges more expensive.

However, there's a subtlety: a shortcut edge that spans many segments might not
correctly reflect traffic on a sub-segment. So for major shortcuts, we store the
constituent segment IDs and sum their real-time weights.

**Approach 2 -- Customizable Contraction Hierarchies (CCH).**
This is the state-of-the-art. CCH separates the topology of shortcuts from the edge
weights. The hierarchy structure is precomputed once. But the weights can be updated
in seconds when traffic changes. We run a "customization" pass every 1-5 minutes
that propagates current traffic weights through the shortcut hierarchy. This gives
exact shortest paths under current traffic, not approximations.

**Interviewer:** How do you generate alternative routes? If the user asks for 3
options, do you just run the algorithm 3 times?

**Candidate:** Not quite. The standard technique is **penalty-based alternative
routing**:

1. Compute the optimal route R1.
2. Add a penalty (e.g., 2x weight multiplier) to all edges on R1.
3. Recompute. The algorithm naturally avoids R1 and finds R2.
4. Penalize R2's edges as well, compute again to get R3.
5. Filter: discard alternatives that share more than 70% of their distance with R1.

This gives diverse, sensible alternatives. Each computation is still ~1 ms with CH,
so three alternatives take ~3-5 ms total.

**Interviewer:** You mentioned 10-20 routing servers. What if one crashes mid-query?

**Candidate:** Each Routing Engine is stateless -- the graph is read-only, loaded at
startup from a serialized file on shared storage. If a server crashes, the load
balancer routes requests to the remaining servers. We keep headroom: if we need 10
servers at peak, we run 15. The graph takes about 2-3 minutes to load into memory on
a cold start, so we also keep warm standby instances ready to take traffic immediately.

For geographic partitioning at extreme scale, we can shard the graph by region. A
cross-region route first runs a high-level query on a coarsened global graph, then
stitches in detailed sub-routes for departure and arrival regions. But for most
deployments, the full global graph fits in memory, so this isn't needed.

---

## Deep Dive 2: Real-Time Traffic and ETA (33:00 -- 40:00)

**Interviewer:** Let's talk about real-time traffic. You said 3.3 million GPS pings
per second. How does live traffic actually work end-to-end?

**Candidate:** The pipeline has four stages: ingest, map-matching, aggregation, and
serving. Let me walk through each.

**Stage 1 -- Ingest.**
Every navigating user sends GPS coordinates every 3 seconds via the WebSocket
connection to the Navigation Service. The Navigation Service writes each ping to
Kafka topic `gps-traces`, partitioned by `user_id` (so one user's pings are ordered).
Kafka handles the 3.3M messages/sec with a cluster of ~50 brokers, 200 partitions.

**Stage 2 -- Map-matching.**
Raw GPS is noisy -- it might put the user 20 meters off the road. Flink consumers
read from Kafka and run a Hidden Markov Model (HMM) map-matching algorithm. For each
GPS point, we find the most likely road segment the user is on, considering the
road network topology and the sequence of previous points. Output: a stream of
`(segment_id, speed, timestamp)` tuples.

**Stage 3 -- Aggregation.**
Flink uses tumbling windows (e.g., 1-minute windows) to aggregate speeds per segment.
For each road segment, we compute the harmonic mean of all reported speeds in the
window. We filter out outliers (e.g., a parked car reporting 0 km/h) using
statistical methods. If fewer than 3 data points exist for a segment, we fall back to
historical averages for that time of day and day of week.

The output is published to Kafka topic `traffic-updates`, and a consumer writes to
Redis: key = `traffic:{segment_id}`, value = current speed, TTL = 5 minutes.

**Stage 4 -- Serving.**
When the Routing Engine computes a route, it reads segment speeds from Redis. When
the ETA Service updates a navigating user's ETA, it reads the same data. The traffic
overlay tile generator also reads from Redis to color roads green/yellow/red on the
map.

**Interviewer:** What about the ETA itself? Is it just distance divided by speed?

**Candidate:** No, that's too simplistic. The ETA model has several components:

1. **Segment-level travel time.** For each segment on the route, compute
   `segment_length / current_speed`. Sum these up for the raw ETA.

2. **Intersection delay model.** Turning left at an unsignalized intersection adds
   more delay than going straight through a green light. We have learned delay
   distributions per intersection type.

3. **Historical adjustment.** For segments with sparse real-time data, we blend in
   historical speed profiles. "This segment is typically 35 km/h at 8:15 AM on a
   Monday."

4. **ML correction.** A gradient-boosted model takes the raw ETA plus features (time
   of day, day of week, weather, special events) and produces a corrected ETA. This
   handles systematic biases like "raw segment speeds underestimate highway merging
   delay."

5. **Live updates.** During navigation, we recalculate ETA every 30 seconds as the
   user progresses and traffic changes. We show "ETA updated" in the UI when the
   change exceeds 2 minutes.

**Interviewer:** How do you detect incidents -- like a car accident -- from GPS data
alone?

**Candidate:** Anomaly detection. If a highway segment that normally has traffic
flowing at 100 km/h suddenly shows 5 km/h from multiple users, Flink's anomaly
detector flags it. The algorithm is:

1. Compare the current window speed to the expected speed (historical baseline for
   this segment, time, and day).
2. If the current speed is below 30% of expected AND at least 5 data points confirm
   it, raise an incident alert.
3. The incident is published to the `incident-events` Kafka topic.
4. Downstream, the Traffic Service marks affected segments and the Routing Engine
   applies heavy penalties or avoids them entirely.
5. The Navigation Service checks if any active user's route crosses the incident zone
   and proactively suggests rerouting.

We also crowdsource: if many users reroute away from the same segment around the same
time, that's a signal even without speed data.

**Interviewer:** One more -- what happens in a location where you have very few
users? No GPS data means no traffic.

**Candidate:** This is the cold-start problem for traffic. Three strategies:

1. **Historical data.** We store years of traffic patterns. For any segment at any
   time of day, we have a statistical distribution. If no real-time data, use
   historical median speed.

2. **Road class defaults.** If we have no data at all (rural road no one drives on),
   fall back to the speed limit or a default for the road class (e.g., 50 km/h for
   secondary roads).

3. **Propagation from nearby segments.** If adjacent highway segments are congested,
   infer that this segment is likely congested too, even without direct data. This
   is a spatial smoothing technique.

---

## Trade-offs Discussion (40:00 -- 42:00)

**Candidate:** Let me highlight the key trade-offs I made:

| Decision | Trade-off |
|----------|-----------|
| **CH over A*** | CH needs hours of preprocessing but gives 1 ms queries. A* needs no preprocessing but takes seconds. For a maps product, preprocessing cost is easily justified. |
| **Vector tiles over raster** | Larger client-side complexity (need WebGL renderer) but smaller payload, infinite styling, smooth rotation. Worth it for modern devices. |
| **Redis for traffic (external) vs. in-process** | Adds ~0.5 ms per segment lookup, but gives a single source of truth and decouples traffic updates from routing deployments. |
| **WebSocket for navigation vs. polling** | More server-side state, but halves latency for guidance updates and enables server-pushed reroute alerts. |
| **Flink over Spark Streaming** | Flink has true event-time processing and lower latency (sub-second). Spark micro-batches add seconds of delay. For real-time traffic, Flink wins. |
| **Harmonic mean vs. arithmetic mean** | Harmonic mean better represents travel time: a segment where 5 cars go 60 and 5 go 20 is not "average 40" -- the slow cars dominate travel time. |

**Interviewer:** If you had to pick one thing that could go wrong in production, what
keeps you up at night?

**Candidate:** Stale traffic data routing users into a traffic jam. If Flink is slow
or Redis has a partition, the Routing Engine might use outdated speeds and send users
into congestion. Mitigation: aggressive TTLs on traffic data (5 min), fallback to
historical if real-time data is stale, and monitoring that alerts if the p99 age of
traffic data exceeds 3 minutes.

---

## Future Improvements (42:00 -- 43:30)

**Candidate:** If I had more time, I'd design:

1. **Predictive traffic.** Use ML to forecast traffic 15-60 minutes ahead. Route
   computation uses predicted future traffic for the departure time, not just current
   conditions. "Leave in 10 minutes and skip the congestion."

2. **Multi-modal routing.** Drive to the train station, take the train, walk to the
   office. Requires a multi-modal graph combining road, transit, and pedestrian
   networks.

3. **Offline navigation.** Package a region's graph + tiles + search index into a
   downloadable bundle. Run CH queries locally on the device.

4. **Collaborative rerouting.** If many users are about to hit the same bottleneck,
   distribute them across multiple alternative routes to balance load on the road
   network. This is a game theory problem.

5. **Privacy-preserving traffic.** Aggregate GPS data with differential privacy so
   individual trip trajectories cannot be reconstructed.

---

## Red Flags to Avoid

| Red Flag | Why It's Bad |
|----------|-------------|
| Suggesting raw Dijkstra on the full graph | Shows no knowledge of routing at scale; every maps company uses preprocessing |
| Skipping the map tile serving layer | The map IS the product; you can't just hand-wave "we have a map" |
| Ignoring map-matching for GPS data | Raw GPS is noisy; treating it as ground truth gives garbage traffic data |
| Proposing to store the graph in a database | Graph must be in-memory for sub-ms traversal; database lookups are 1000x too slow |
| Saying "we use ML for routing" without explaining CH | ML helps ETA correction, but the core algorithm is a well-known graph technique |
| Ignoring traffic freshness and staleness | Without TTLs and monitoring, you serve stale data and route users into jams |

---

## Power Phrases

Use these exact phrases to signal expertise during the interview:

- "We preprocess the graph with **Contraction Hierarchies** to reduce query time from
  seconds to single-digit milliseconds."
- "The query is a **bidirectional Dijkstra that only relaxes upward edges** in the
  hierarchy, which limits the search space to a few thousand nodes."
- "We use **HMM-based map matching** to snap noisy GPS to the correct road segment."
- "Traffic speeds are aggregated using the **harmonic mean**, which correctly weights
  travel time over segments with mixed speeds."
- "We use **Customizable Contraction Hierarchies** so the topology is computed once
  but weights can be refreshed every minute with live traffic."
- "The CDN serves **vector tiles** in Mapbox Vector Tile format -- PBF encoded,
  client-rendered -- giving us 95%+ cache hit rate and infinite style flexibility."
- "For ETA, raw segment time is corrected by an **ML model** that incorporates time
  of day, day of week, weather, and historical patterns."
- "We detect incidents through **statistical anomaly detection** on per-segment speed
  streams in Flink, not just user reports."
- "Navigation sessions use **WebSocket** for bidirectional real-time communication --
  GPS upstream, guidance downstream."
- "When a user deviates more than 50 meters from the planned route, we trigger an
  **automatic reroute** that completes in under 200 ms."
