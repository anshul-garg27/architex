# Design Google Maps / Navigation System: Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Functional Requirements](#2-functional-requirements)
- [3. Non-Functional Requirements](#3-non-functional-requirements)
- [4. Out of Scope](#4-out-of-scope)
- [5. Back-of-Envelope Estimation](#5-back-of-envelope-estimation)
- [6. API Design](#6-api-design)
- [7. Data Model Overview](#7-data-model-overview)

---

## 1. Problem Statement

Design a mapping and navigation platform (like Google Maps) that renders interactive
maps at multiple zoom levels, allows users to search for places, computes driving /
walking / transit directions between locations, estimates arrival times, displays
real-time traffic conditions, and provides turn-by-turn voice navigation.

**Why this problem is a top interview question at Uber:**
- It tests geospatial systems (map tile rendering, coordinate indexing)
- It tests graph algorithms (shortest path on road network with 1B+ edges)
- It tests real-time data pipelines (aggregating GPS from millions of phones into traffic)
- It tests CDN and caching architecture (serving billions of map tiles per day)
- It tests ML/prediction systems (ETA estimation combining historical + live signals)
- It directly mirrors Uber's own mapping stack (H3, OSRM, internal routing)

**Real-world context:**
- Google Maps serves 1B+ monthly active users across 220+ countries
- Waze crowdsources traffic from 150M+ drivers
- Uber built its own mapping platform (replacing Google Maps) to reduce costs and improve ETA accuracy
- Apple Maps re-architected from scratch in 2018 after initial failures

---

## 2. Functional Requirements

### 2.1 Map Rendering

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Display interactive map** | Render a pannable, zoomable map showing roads, buildings, terrain, water bodies, and points of interest |
| FR-2 | **Multiple zoom levels** | Support zoom from world view (level 0) to street/building view (level 21), with progressive detail |
| FR-3 | **Map styles** | Support default, satellite, terrain, and dark mode map styles |
| FR-4 | **Offline maps** | Allow users to download map tiles for a region for offline use |

### 2.2 Place Search

| # | Requirement | Description |
|---|-------------|-------------|
| FR-5 | **Search by name** | Search for places, businesses, addresses by name with autocomplete suggestions |
| FR-6 | **Search by category** | Find nearby restaurants, gas stations, hospitals, etc. filtered by category |
| FR-7 | **Place details** | Show place name, address, phone, hours, photos, reviews, and rating |
| FR-8 | **Geocoding** | Convert address text to lat/lng coordinates (and reverse: lat/lng to address) |

### 2.3 Directions and Routing

| # | Requirement | Description |
|---|-------------|-------------|
| FR-9 | **Compute directions** | Given origin and destination, compute the best route with step-by-step instructions |
| FR-10 | **Multi-modal routing** | Support driving, walking, cycling, and public transit modes |
| FR-11 | **Alternative routes** | Show 2-3 alternative routes with different trade-offs (fastest, shortest, avoid tolls) |
| FR-12 | **Waypoints** | Support intermediate stops along a route |
| FR-13 | **Route preferences** | Avoid tolls, highways, ferries based on user preference |

### 2.4 ETA and Traffic

| # | Requirement | Description |
|---|-------------|-------------|
| FR-14 | **ETA calculation** | Provide accurate estimated time of arrival factoring in real-time traffic |
| FR-15 | **Real-time traffic layer** | Overlay color-coded traffic conditions (green/yellow/red) on map roads |
| FR-16 | **Traffic incidents** | Show accidents, road closures, construction zones on the map |
| FR-17 | **Future departure ETA** | Estimate travel time for trips starting at a future time (e.g., "leave at 8 AM tomorrow") |

### 2.5 Turn-by-Turn Navigation

| # | Requirement | Description |
|---|-------------|-------------|
| FR-18 | **Real-time navigation** | Provide continuous turn-by-turn voice and visual guidance along the route |
| FR-19 | **Rerouting** | Automatically detect when user deviates from route and compute a new route |
| FR-20 | **Lane guidance** | Show which lane to be in for upcoming turns and exits |
| FR-21 | **Speed limits** | Display current road speed limit during navigation |
| FR-22 | **Arrival detection** | Detect when user reaches destination and end navigation |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Map tile load** | < 200ms per tile (p99 < 500ms) | Users expect instant map rendering when panning/zooming |
| **Search autocomplete** | < 100ms per keystroke | Real-time suggestions must feel instantaneous |
| **Route computation** | < 1 second (p99 < 3s) | Users expect fast directions even for cross-country routes |
| **ETA calculation** | < 500ms | Must be fast for display in search results and ride-hailing apps |
| **Rerouting** | < 2 seconds | Must be near-instant when driver misses a turn |
| **Traffic update propagation** | < 60 seconds | GPS data to traffic layer should reflect within 1 minute |

### 3.2 Availability and Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Map tile serving** | 99.99% uptime | Maps are critical infrastructure; navigation failure is dangerous |
| **Routing service** | 99.95% uptime | Slightly lower bar since users can re-request |
| **Traffic service** | 99.9% uptime | Degradation acceptable (fall back to historical) |
| **Data freshness** | Map updates within 24h | New roads, closures must appear quickly |
| **Global coverage** | 220+ countries | Must work worldwide with varying road data quality |

### 3.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Concurrent users** | 100M+ DAU, 1B+ MAU | Google Maps scale |
| **Map tile requests** | 500K+ QPS sustained, 2M+ peak | Heavy read workload from map rendering |
| **Routing requests** | 100K+ QPS | Directions from Maps + ride-hailing + delivery apps |
| **GPS data ingestion** | 10M+ updates/sec | From phones, cars, Waze, ride-hailing drivers |
| **Place search** | 50K+ QPS | Autocomplete generates high query volume |

### 3.4 Accuracy

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **ETA accuracy** | Within 10% of actual for 90% of trips | Core value proposition; Uber depends on this |
| **Route quality** | Optimal or within 5% of optimal | Must not send users on significantly longer routes |
| **Geocoding accuracy** | 95%+ address resolution | Critical for place search and navigation |
| **GPS map matching** | < 5m error in urban areas | Must correctly identify which road the user is on |

---

## 4. Out of Scope

| Feature | Reason |
|---------|--------|
| Street View / 3D buildings | Specialized rendering; separate system |
| Indoor maps (malls, airports) | Different data model and rendering |
| Ride-hailing integration | Covered in "Design Uber" |
| Map data collection (Street View cars) | Data pipeline, not user-facing |
| Public transit scheduling | Depends on transit agency GTFS feeds |
| Social features (sharing location) | Separate feature domain |

---

## 5. Back-of-Envelope Estimation

### 5.1 User and Query Volume

```
Total Users:
  - 1 billion monthly active users (MAU)
  - 150 million daily active users (DAU)
  - Peak concurrent users: ~50 million

Map Tile Requests:
  - Average session: user views ~20 tiles (4x5 grid viewport)
  - Active sessions per day: 300M (some users open Maps multiple times)
  - Daily tile requests: 300M x 20 = 6 billion tiles/day
  - Average QPS: 6B / 86400 = ~70K QPS
  - Peak QPS (5x average): ~350K QPS
  - With CDN cache hit rate of 95%: ~17.5K QPS hitting origin

Route Computation:
  - 50M route requests/day (Maps + API customers like Uber)
  - Average QPS: ~580 QPS
  - Peak QPS: ~3K QPS
  - But each request triggers multiple graph queries internally

Place Search:
  - 100M search queries/day
  - Average QPS: ~1,200 QPS
  - Peak QPS: ~6K QPS
  - Each query triggers ~5 autocomplete requests: 30K peak QPS

GPS Data Ingestion (for traffic):
  - 500M smartphones contributing anonymous location data
  - Each active phone: 1 GPS point every 3 seconds while moving
  - ~50M phones actively moving at any given time
  - Ingestion rate: 50M / 3 = ~17M GPS points/second
  - Each GPS point: ~60 bytes (lat, lng, speed, heading, timestamp, accuracy)
  - Ingestion bandwidth: 17M x 60 = ~1 GB/sec raw GPS data
```

### 5.2 Map Tile Storage

```
Map Tile Storage Calculation:
  - Zoom levels: 0 to 21 (22 levels total)
  - Number of tiles at zoom level z = 4^z
    - Level 0:  1 tile (entire world)
    - Level 5:  1,024 tiles (country level)
    - Level 10: ~1M tiles (city level)
    - Level 15: ~1B tiles (neighborhood level)
    - Level 18: ~69B tiles (street level)
    - Level 21: ~4.4T tiles (building level)
  - Total tiles across all levels: ~5.9 trillion

  But: ~70% of tiles are ocean/empty at high zoom levels
  - Effective tiles: ~1.8 trillion tiles with actual content

  Tile sizes:
    - Raster tile (PNG/JPEG): 10-50 KB average = ~30 KB
    - Vector tile (PBF): 5-20 KB average = ~12 KB

  Raster storage: 1.8T x 30 KB = ~54 PB (impractical to pre-render all)
  Vector storage: 1.8T x 12 KB = ~22 PB

  Practical approach: Only pre-render popular tiles (zoom 0-14 = ~350M tiles)
    - Pre-rendered: 350M x 30 KB = ~10 TB
    - Higher zoom tiles: rendered on demand + cached
    - Hot tile cache: ~5 TB (covers 99% of requests)

  Satellite imagery: 
    - High resolution: ~15 PB (Google's stated storage for Earth imagery)
    - Different resolution per zoom level, served as raster tiles
```

### 5.3 Road Network Graph

```
Road Network Graph:
  - OpenStreetMap global data: ~8 billion GPS points mapped
  - Road segments (edges): ~1 billion worldwide
  - Intersections (nodes): ~500 million worldwide
  - Average edges per node: ~4 (most intersections are 4-way)

  Graph storage:
    - Node: node_id (8B) + lat (4B) + lng (4B) = 16 bytes
    - Edge: edge_id (8B) + from (8B) + to (8B) + distance (4B) + 
            speed_limit (2B) + road_type (1B) + flags (1B) = 32 bytes
    - Nodes: 500M x 16B = ~8 GB
    - Edges: 1B x 32B = ~32 GB
    - Total raw graph: ~40 GB (fits in memory of a single large server!)

  Contraction Hierarchies (preprocessed shortcut edges):
    - Adds ~2x edges but enables 1000x faster queries
    - Preprocessed graph: ~100 GB
    - Still fits in memory of high-end servers (512 GB RAM)

  Route computation cost:
    - Dijkstra on raw graph: visits ~500K nodes for cross-country route (~2s)
    - A* heuristic: visits ~50K nodes (~200ms)
    - Contraction Hierarchies: visits ~500-1000 nodes (~1ms!)
    - CH is what Google Maps and OSRM actually use
```

### 5.4 Traffic Data Volume

```
Traffic Data Processing:
  - GPS ingestion: 17M points/sec = ~1 GB/sec
  - Road segments to track: ~200M (populated areas worldwide)
  - Each segment: current_speed, sample_count, confidence, updated_at
  - Traffic state storage: 200M x 32 bytes = ~6.4 GB (fits in Redis)
  - Traffic snapshot update: every 30-60 seconds per segment
  - Historical traffic patterns: 200M segments x 7 days x 24 hours x 4 (15-min buckets)
    = 200M x 672 x 4 bytes = ~537 GB
  - Historical stored compressed: ~100 GB
```

### 5.5 Infrastructure Estimate

```
Servers Required:
  - Map tile origin servers: 50-100 (behind CDN)
  - CDN PoPs: 200+ globally (Akamai/CloudFlare/internal)
  - Routing engine servers: 200-500 (holding graph in memory)
  - Search/geocoding servers: 100-200 (Elasticsearch cluster)
  - Traffic processing servers: 100-200 (stream processing)
  - GPS ingestion cluster (Kafka): 50-100 brokers
  - API Gateway: 100-200 instances
  - Total server footprint: ~1,000-2,000 servers

  CDN bandwidth:
  - 350K tile requests/sec x 30 KB avg = ~10 GB/sec = 80 Gbps
  - Monthly CDN egress: ~25 PB
  - CDN cost at $0.02/GB: ~$500K/month

  Storage:
  - Map tiles (pre-rendered + cached): ~15 TB
  - Satellite imagery: ~15 PB
  - Road graph + CH: ~200 GB per region replica
  - Traffic historical: ~100 GB
  - Place index (Elasticsearch): ~5 TB
  - Total: ~15+ PB (satellite imagery dominates)
```

---

## 6. API Design

### 6.1 Map Tile API

```
GET /api/v1/tiles/{style}/{z}/{x}/{y}.{format}

Path Parameters:
  style   : string   -- "default", "satellite", "terrain", "dark"
  z       : int      -- zoom level (0-21)
  x       : int      -- tile column (0 to 2^z - 1)
  y       : int      -- tile row (0 to 2^z - 1)
  format  : string   -- "png" (raster), "pbf" (vector protobuf), "webp"

Headers:
  If-None-Match: "etag-abc123"        -- for 304 Not Modified responses
  Accept-Encoding: gzip, br           -- compression for vector tiles

Response: 200 OK
  Content-Type: image/png | application/x-protobuf
  Cache-Control: public, max-age=86400
  ETag: "etag-abc123"
  Content-Encoding: br
  Body: <tile binary data>

Response: 304 Not Modified (if tile unchanged)

Example:
  GET /api/v1/tiles/default/15/5241/12661.pbf
  -- Returns vector tile for San Francisco at zoom level 15
```

### 6.2 Place Search API

```
GET /api/v1/places/search

Query Parameters:
  q         : string   -- search query text ("coffee shops near me")
  lat       : float    -- user latitude for proximity ranking
  lng       : float    -- user longitude for proximity ranking
  radius    : int      -- search radius in meters (default: 5000)
  category  : string   -- optional filter ("restaurant", "gas_station", "hospital")
  lang      : string   -- language for results (default: "en")
  limit     : int      -- max results (default: 10, max: 50)
  page_token: string   -- pagination token for next page

Response: 200 OK
{
  "results": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Blue Bottle Coffee",
      "address": "315 Linden St, San Francisco, CA 94102",
      "location": { "lat": 37.7762, "lng": -122.4234 },
      "category": "coffee_shop",
      "rating": 4.5,
      "review_count": 1247,
      "price_level": 2,
      "is_open": true,
      "distance_meters": 320,
      "photo_urls": ["https://maps.cdn.example.com/photos/abc123.jpg"]
    }
  ],
  "next_page_token": "CpQCAgEAAK..."
}
```

### 6.3 Place Autocomplete API

```
GET /api/v1/places/autocomplete

Query Parameters:
  input     : string   -- partial query text ("star")
  lat       : float    -- user latitude for proximity bias
  lng       : float    -- user longitude
  session_token: string -- session token (for billing: one session = one charge)
  types     : string   -- "address", "establishment", "geocode"

Response: 200 OK
{
  "predictions": [
    {
      "place_id": "ChIJN1t_tDeuEmsR...",
      "description": "Starbucks, Market St, San Francisco, CA",
      "matched_substrings": [{ "offset": 0, "length": 4 }],
      "structured_formatting": {
        "main_text": "Starbucks",
        "secondary_text": "Market St, San Francisco, CA"
      },
      "distance_meters": 850
    }
  ],
  "session_token": "sess_abc123"
}
```

### 6.4 Geocoding API

```
GET /api/v1/geocode

Query Parameters (forward geocoding):
  address   : string   -- "1600 Amphitheatre Parkway, Mountain View, CA"

Query Parameters (reverse geocoding):
  lat       : float    -- 37.4220
  lng       : float    -- -122.0841

Response: 200 OK
{
  "results": [
    {
      "place_id": "ChIJ2eUgeAK6j...",
      "formatted_address": "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
      "location": { "lat": 37.4220, "lng": -122.0841 },
      "address_components": [
        { "type": "street_number", "value": "1600" },
        { "type": "route", "value": "Amphitheatre Parkway" },
        { "type": "city", "value": "Mountain View" },
        { "type": "state", "value": "California" },
        { "type": "country", "value": "US" },
        { "type": "postal_code", "value": "94043" }
      ],
      "location_type": "ROOFTOP"
    }
  ]
}
```

### 6.5 Directions API

```
POST /api/v1/directions

Request Body:
{
  "origin": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "destination": {
    "lat": 37.3382,
    "lng": -121.8863
  },
  "waypoints": [
    { "lat": 37.5585, "lng": -122.2711 }
  ],
  "mode": "driving",            // "driving", "walking", "cycling", "transit"
  "departure_time": "2026-04-07T08:00:00Z",
  "alternatives": true,         // return alternative routes
  "avoid": ["tolls", "ferries"],
  "units": "imperial",
  "traffic_model": "best_guess" // "best_guess", "pessimistic", "optimistic"
}

Response: 200 OK
{
  "routes": [
    {
      "route_id": "route_abc123",
      "summary": "US-101 S",
      "distance_meters": 77200,
      "duration_seconds": 3420,
      "duration_in_traffic_seconds": 4080,
      "start_address": "San Francisco, CA",
      "end_address": "San Jose, CA",
      "overview_polyline": "a~l~Fjk~uOwHJy@...",  // encoded polyline
      "bounds": {
        "northeast": { "lat": 37.7749, "lng": -121.8863 },
        "southwest": { "lat": 37.3382, "lng": -122.4194 }
      },
      "legs": [
        {
          "distance_meters": 38500,
          "duration_seconds": 1800,
          "start_location": { "lat": 37.7749, "lng": -122.4194 },
          "end_location": { "lat": 37.5585, "lng": -122.2711 },
          "steps": [
            {
              "instruction": "Head south on 4th St toward Howard St",
              "distance_meters": 320,
              "duration_seconds": 45,
              "maneuver": "straight",
              "start_location": { "lat": 37.7749, "lng": -122.4194 },
              "end_location": { "lat": 37.7722, "lng": -122.4193 },
              "polyline": "a~l~Fjk~uO...",
              "road_name": "4th St",
              "lane_guidance": {
                "lanes": [
                  { "direction": "left", "recommended": false },
                  { "direction": "straight", "recommended": true },
                  { "direction": "right", "recommended": false }
                ]
              }
            }
          ]
        }
      ],
      "traffic_speed_entries": [
        {
          "offset_meters": 0,
          "length_meters": 5200,
          "speed_category": "normal"       // "normal", "slow", "traffic_jam"
        },
        {
          "offset_meters": 5200,
          "length_meters": 3100,
          "speed_category": "slow"
        }
      ],
      "warnings": ["This route has tolls."],
      "toll_info": {
        "estimated_price": { "currency": "USD", "amount": 7.25 }
      }
    }
  ]
}
```

### 6.6 ETA API

```
POST /api/v1/eta

Request Body:
{
  "origins": [
    { "lat": 37.7749, "lng": -122.4194 }
  ],
  "destinations": [
    { "lat": 37.3382, "lng": -121.8863 },
    { "lat": 37.8044, "lng": -122.2712 },
    { "lat": 37.4419, "lng": -122.1430 }
  ],
  "mode": "driving",
  "departure_time": "now"
}

Response: 200 OK
{
  "rows": [
    {
      "elements": [
        {
          "status": "OK",
          "duration_seconds": 3420,
          "duration_in_traffic_seconds": 4080,
          "distance_meters": 77200
        },
        {
          "status": "OK",
          "duration_seconds": 1620,
          "duration_in_traffic_seconds": 1920,
          "distance_meters": 18700
        },
        {
          "status": "OK",
          "duration_seconds": 2100,
          "duration_in_traffic_seconds": 2580,
          "distance_meters": 48300
        }
      ]
    }
  ]
}
```

### 6.7 Navigation Session API

```
POST /api/v1/navigation/start

Request Body:
{
  "route_id": "route_abc123",
  "device_id": "device_xyz789",
  "voice_enabled": true,
  "voice_language": "en-US"
}

Response: 200 OK
{
  "session_id": "nav_sess_456",
  "initial_instruction": {
    "text": "Head south on 4th St",
    "maneuver": "straight",
    "distance_to_maneuver_meters": 320,
    "road_name": "4th St",
    "speed_limit_kmh": 40
  },
  "websocket_url": "wss://nav.maps.example.com/ws/nav_sess_456"
}

--- WebSocket Messages (Client -> Server) ---

// GPS location update (sent every 1-3 seconds)
{
  "type": "location_update",
  "lat": 37.7745,
  "lng": -122.4190,
  "speed_mps": 8.5,
  "heading": 180,
  "accuracy_meters": 5.0,
  "timestamp": "2026-04-07T14:22:05.123Z"
}

--- WebSocket Messages (Server -> Client) ---

// Navigation guidance update
{
  "type": "guidance",
  "current_step_index": 3,
  "distance_to_next_maneuver_meters": 150,
  "instruction": "In 150 meters, turn right onto Howard St",
  "maneuver": "turn_right",
  "next_road_name": "Howard St",
  "lane_guidance": { ... },
  "speed_limit_kmh": 40,
  "eta_seconds": 3240,
  "distance_remaining_meters": 72500
}

// Reroute notification
{
  "type": "reroute",
  "reason": "deviation",          // "deviation", "traffic", "incident"
  "new_route_polyline": "a~l~Fjk~uO...",
  "new_eta_seconds": 3480,
  "new_distance_meters": 74100,
  "new_steps": [ ... ]
}

// Arrival notification
{
  "type": "arrival",
  "message": "You have arrived at your destination.",
  "destination_side": "right"     // which side of road destination is on
}
```

---

## 7. Data Model Overview

### 7.1 Map Tile Metadata

```sql
-- Tile metadata (used for cache invalidation and versioning)
-- Actual tile data is in object storage / CDN, not in the database
CREATE TABLE map_tile_metadata (
    tile_key        VARCHAR(64) PRIMARY KEY,  -- "{style}/{z}/{x}/{y}"
    style           VARCHAR(16) NOT NULL,
    zoom_level      SMALLINT NOT NULL,
    tile_x          INT NOT NULL,
    tile_y          INT NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    etag            VARCHAR(64) NOT NULL,
    size_bytes      INT NOT NULL,
    last_modified   TIMESTAMP NOT NULL DEFAULT NOW(),
    storage_url     VARCHAR(256) NOT NULL,    -- S3/GCS URL
    INDEX idx_tile_version (zoom_level, last_modified)
);
```

### 7.2 Places

```sql
CREATE TABLE places (
    place_id        VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(256) NOT NULL,
    address         VARCHAR(512),
    lat             DOUBLE NOT NULL,
    lng             DOUBLE NOT NULL,
    geohash         VARCHAR(12) NOT NULL,     -- for spatial queries
    category        VARCHAR(64),
    subcategory     VARCHAR(64),
    phone           VARCHAR(32),
    website         VARCHAR(512),
    rating          DECIMAL(2,1),
    review_count    INT DEFAULT 0,
    price_level     SMALLINT,                 -- 1-4
    opening_hours   JSONB,                    -- hours by day of week
    photos          JSONB,                    -- array of photo URLs
    attributes      JSONB,                    -- wheelchair accessible, outdoor seating, etc.
    country_code    CHAR(2) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_place_geo (geohash),
    INDEX idx_place_category (category, geohash),
    INDEX idx_place_name (name)  -- also indexed in Elasticsearch
);
```

### 7.3 Road Network Graph (stored as binary, not SQL -- shown for schema reference)

```
Node {
    node_id     : uint64        -- unique intersection ID
    lat         : float32       -- latitude
    lng         : float32       -- longitude
    h3_cell     : uint64        -- H3 hex cell for partitioning
    elevation   : int16         -- meters above sea level (for walking/cycling)
}

Edge {
    edge_id     : uint64        -- unique road segment ID
    from_node   : uint64        -- source intersection
    to_node     : uint64        -- target intersection
    distance_m  : uint32        -- length in meters
    speed_limit : uint16        -- km/h
    road_class  : uint8         -- motorway=1, trunk=2, primary=3, ..., residential=7
    is_oneway   : bool
    is_toll     : bool
    is_ferry    : bool
    osm_way_id  : uint64        -- link to OpenStreetMap source
    road_name   : string        -- for navigation instructions
    geometry    : bytes         -- encoded polyline of road shape
}

-- Contraction Hierarchy shortcut edge (added during preprocessing)
ShortcutEdge {
    shortcut_id : uint64
    from_node   : uint64
    to_node     : uint64
    weight      : uint32        -- travel time in deciseconds
    child_edge1 : uint64        -- first sub-edge (for path unpacking)
    child_edge2 : uint64        -- second sub-edge
    ch_level    : uint16        -- node importance level
}
```

### 7.4 Traffic Segment Data

```sql
-- Real-time traffic state (stored in Redis, schema shown for reference)
-- Key: traffic:{segment_id}
-- Stored as: Hash
{
    "segment_id": "seg_12345678",
    "current_speed_kmh": 45,
    "free_flow_speed_kmh": 65,
    "congestion_ratio": 0.69,     -- current / free_flow
    "sample_count": 127,          -- GPS samples in last interval
    "confidence": 0.95,
    "last_updated": "2026-04-07T14:22:00Z",
    "incident": null               -- or incident ID
}

-- Historical traffic patterns (stored in columnar DB / Cassandra)
CREATE TABLE traffic_history (
    segment_id      BIGINT,
    day_of_week     SMALLINT,       -- 0=Monday, 6=Sunday
    time_bucket     SMALLINT,       -- 0-95 (15-minute intervals in a day)
    avg_speed_kmh   FLOAT,
    p25_speed_kmh   FLOAT,
    p75_speed_kmh   FLOAT,
    sample_count    INT,
    PRIMARY KEY ((segment_id), day_of_week, time_bucket)
);
```

### 7.5 Navigation Sessions

```sql
CREATE TABLE navigation_sessions (
    session_id      VARCHAR(64) PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    device_id       VARCHAR(64) NOT NULL,
    route_id        VARCHAR(64) NOT NULL,
    origin_lat      DOUBLE NOT NULL,
    origin_lng      DOUBLE NOT NULL,
    dest_lat        DOUBLE NOT NULL,
    dest_lng        DOUBLE NOT NULL,
    mode            VARCHAR(16) NOT NULL,
    started_at      TIMESTAMP NOT NULL,
    ended_at        TIMESTAMP,
    end_reason      VARCHAR(16),              -- "arrived", "cancelled", "app_closed"
    reroute_count   INT DEFAULT 0,
    total_distance  INT,                       -- actual distance traveled (meters)
    total_duration  INT,                       -- actual duration (seconds)
    original_eta    INT,                       -- original ETA (seconds)
    INDEX idx_nav_user (user_id, started_at)
);
```

---

## Summary: Numbers to Remember for the Interview

```
                        KEY NUMBERS AT A GLANCE
  ---------------------------------------------------------------
  Users:            1B MAU, 150M DAU
  Map Tiles:        ~350M pre-rendered (zoom 0-14), on-demand for higher
  Tile QPS:         350K peak (95% served from CDN)
  Road Graph:       500M nodes, 1B edges, ~40 GB raw, ~100 GB with CH
  Routing QPS:      3K peak (each route: ~1ms with Contraction Hierarchies)
  GPS Ingestion:    17M points/sec from 50M moving devices
  Traffic Segments:  200M segments, 6.4 GB state in Redis
  Place Search:     30K peak autocomplete QPS
  CDN Bandwidth:    ~80 Gbps, ~25 PB/month
  ---------------------------------------------------------------
  Key Insight: The road graph fits in RAM (~100 GB).
               Map tiles are a CDN problem, not a compute problem.
               Traffic is a stream-processing problem (GPS -> segments).
               ETA is an ML problem (historical + live + context).
```
