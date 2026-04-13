# Design Google Maps / Navigation System: High-Level Design

## Table of Contents
- [1. Architecture Overview](#1-architecture-overview)
- [2. System Architecture Diagram](#2-system-architecture-diagram)
- [3. Map Tile System](#3-map-tile-system)
- [4. Place Search Service](#4-place-search-service)
- [5. Routing Engine](#5-routing-engine)
- [6. ETA Service](#6-eta-service)
- [7. Traffic Service](#7-traffic-service)
- [8. Navigation Service](#8-navigation-service)
- [9. Data Flow Walkthroughs](#9-data-flow-walkthroughs)
- [10. Database and Storage Design](#10-database-and-storage-design)
- [11. Communication Patterns](#11-communication-patterns)

---

## 1. Architecture Overview

The system is organized as a **read-heavy microservices architecture** with six core
services, a CDN layer for tile serving, a stream processing pipeline for traffic data,
and a graph computation engine for routing. The two main data flows are: (1) serving
pre-computed map data at massive read scale, and (2) ingesting real-time GPS data
to produce live traffic and ETA.

**Key architectural decisions:**
1. **CDN-first for map tiles** -- 95%+ of tile requests never hit origin; tiles are immutable for a given version
2. **Vector tiles over raster** -- client-side rendering enables style changes, rotation, and smaller payloads
3. **QuadTree tile addressing** -- standard Web Mercator {z}/{x}/{y} scheme matches CDN caching naturally
4. **Contraction Hierarchies for routing** -- preprocessed graph enables 1ms route queries vs 2s for raw Dijkstra
5. **Kafka for GPS ingestion** -- decouples 17M/sec GPS ingest from traffic computation
6. **Redis for real-time traffic** -- sub-millisecond lookups for segment speeds during route computation
7. **Graph in memory** -- entire road network (~100 GB with CH) fits in RAM on modern servers

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Clients
        WEB[Web App<br/>JavaScript + WebGL]
        MOB[Mobile App<br/>iOS / Android]
        API_C[API Customers<br/>Uber, Lyft, DoorDash]
    end

    subgraph CDN Layer
        CDN[Global CDN<br/>Akamai / CloudFlare<br/>200+ PoPs<br/>95% cache hit rate]
    end

    subgraph Gateway Layer
        AG[API Gateway<br/>Kong / Envoy<br/>- Auth, Rate Limiting<br/>- API key validation<br/>- Request routing]
        WSG[WebSocket Gateway<br/>- Navigation sessions<br/>- Real-time guidance<br/>- GPS stream ingestion]
    end

    subgraph Core Services
        MTS[Map Tile Service<br/>- Serve / render tiles<br/>- Vector + raster<br/>- Style application<br/>- Cache management]
        PSS[Place Search Service<br/>- Autocomplete<br/>- Full-text + geo search<br/>- Geocoding / reverse<br/>- Place details]
        RTE[Routing Engine<br/>- Shortest path (CH/A*)<br/>- Multi-modal routing<br/>- Alternative routes<br/>- Waypoint optimization]
        ETA_S[ETA Service<br/>- Travel time prediction<br/>- Historical + real-time<br/>- ML model inference<br/>- Distance matrix]
        TFS[Traffic Service<br/>- GPS aggregation<br/>- Segment speed calc<br/>- Incident detection<br/>- Traffic layer tiles]
        NAV[Navigation Service<br/>- Turn-by-turn guidance<br/>- Deviation detection<br/>- Rerouting logic<br/>- Lane guidance]
    end

    subgraph Stream Processing
        KFK[Apache Kafka<br/>- gps-traces topic<br/>- traffic-updates topic<br/>- incident-events topic]
        FSP[Flink / Spark Streaming<br/>- Map matching<br/>- Speed aggregation<br/>- Anomaly detection]
    end

    subgraph Data Stores
        S3[(Object Storage<br/>S3 / GCS<br/>Map tiles, satellite<br/>imagery, offline packs)]
        ES[(Elasticsearch<br/>Place names, addresses<br/>Full-text + geospatial<br/>index)]
        PG[(PostgreSQL<br/>Places, users<br/>Navigation sessions<br/>API keys)]
        RD[(Redis Cluster<br/>Real-time traffic<br/>Segment speeds<br/>Tile metadata cache)]
        GS[(Graph Store<br/>In-memory road graph<br/>Contraction Hierarchies<br/>~100 GB per replica)]
        CS[(Cassandra / BigQuery<br/>Historical traffic<br/>GPS trace archive<br/>Analytics)]
    end

    subgraph External Data
        OSM[OpenStreetMap<br/>Road network updates]
        TPROV[Traffic Providers<br/>Waze, HERE, TomTom]
        SAT[Satellite Imagery<br/>Maxar, Airbus]
        GTFS[Transit Agencies<br/>GTFS feeds]
    end

    WEB -->|HTTPS| CDN
    MOB -->|HTTPS| CDN
    CDN -->|Cache miss| MTS
    WEB & MOB & API_C -->|HTTPS| AG
    MOB -->|WebSocket| WSG

    AG --> PSS
    AG --> RTE
    AG --> ETA_S
    AG --> TFS
    WSG --> NAV
    WSG --> KFK

    MTS --> S3
    MTS --> RD
    PSS --> ES
    PSS --> PG
    RTE --> GS
    RTE --> RD
    ETA_S --> RD
    ETA_S --> CS
    ETA_S --> GS
    TFS --> RD
    TFS --> KFK
    NAV --> RTE
    NAV --> TFS

    KFK --> FSP
    FSP --> RD
    FSP --> CS

    OSM -->|Weekly import| GS
    OSM -->|Weekly import| MTS
    TPROV -->|Real-time feed| TFS
    SAT -->|Periodic upload| S3
    GTFS -->|Daily import| RTE

    style CDN fill:#ff9,stroke:#333
    style GS fill:#9f9,stroke:#333
    style RD fill:#f99,stroke:#333
    style KFK fill:#99f,stroke:#333
```

---

## 3. Map Tile System

### 3.1 How Web Maps Work: The Tile Pyramid

The entire Earth is projected onto a flat square using the **Web Mercator projection**,
then recursively subdivided into tiles. At each zoom level z, the world is divided
into `2^z x 2^z` tiles, each 256x256 pixels (or 512x512 for high-DPI).

```
Zoom Level 0: 1 tile         (entire world)
Zoom Level 1: 4 tiles        (2x2 grid)
Zoom Level 2: 16 tiles       (4x4 grid)
...
Zoom Level 10: ~1M tiles     (city-level detail)
Zoom Level 15: ~1B tiles     (street-level detail)
Zoom Level 21: ~4.4T tiles   (building-level detail)
```

```mermaid
graph TB
    subgraph "Tile Pyramid (Zoom Levels)"
        Z0["Zoom 0: 1 tile<br/>World view"]
        Z1["Zoom 1: 4 tiles<br/>Hemisphere view"]
        Z2["Zoom 2: 16 tiles<br/>Continent view"]
        ZD["..."]
        Z10["Zoom 10: ~1M tiles<br/>City view"]
        Z15["Zoom 15: ~1B tiles<br/>Street view"]
        Z21["Zoom 21: ~4.4T tiles<br/>Building view"]
    end

    Z0 --> Z1 --> Z2 --> ZD --> Z10 --> Z15 --> Z21

    subgraph "Single Tile Split (each parent → 4 children)"
        P["Parent Tile<br/>z=10, x=163, y=395"]
        C1["z=11<br/>x=326<br/>y=790"]
        C2["z=11<br/>x=327<br/>y=790"]
        C3["z=11<br/>x=326<br/>y=791"]
        C4["z=11<br/>x=327<br/>y=791"]
    end

    P --> C1
    P --> C2
    P --> C3
    P --> C4
```

### 3.2 Tile Addressing: QuadTree / Slippy Map

Each tile is identified by three coordinates: `(z, x, y)` where:
- `z` = zoom level (0-21)
- `x` = column index (0 to 2^z - 1, left to right)
- `y` = row index (0 to 2^z - 1, top to bottom)

**Converting lat/lng to tile coordinates:**
```
x = floor((lng + 180) / 360 * 2^z)
y = floor((1 - ln(tan(lat_rad) + sec(lat_rad)) / pi) / 2 * 2^z)
```

This is a **QuadTree** decomposition: each tile at zoom z has exactly 4 children
at zoom z+1. The tile key `{z}/{x}/{y}` naturally maps to a QuadTree path, which
maps perfectly to CDN cache keys and file paths.

### 3.3 Vector Tiles vs Raster Tiles

| Aspect | Raster Tiles | Vector Tiles |
|--------|-------------|--------------|
| **Format** | PNG, JPEG, WebP images | Protocol Buffers (PBF / MVT) |
| **Rendering** | Pre-rendered on server | Rendered on client (WebGL / GPU) |
| **Avg size** | 20-50 KB | 5-15 KB |
| **Style changes** | Requires re-rendering all tiles | Client applies style dynamically |
| **Rotation/tilt** | Pixelated when rotated | Smooth at any angle |
| **Labels** | Baked into image (fixed language) | Client renders labels (multi-language) |
| **Bandwidth** | Higher | 60-80% less bandwidth |
| **Client CPU** | Minimal | Needs WebGL / GPU |
| **Use case** | Satellite imagery, older devices | Default map, modern devices |

**Google Maps and Mapbox use vector tiles for the default map view** and raster tiles
only for satellite imagery. Vector tiles contain geometric shapes (roads as lines,
buildings as polygons, POIs as points) encoded in Protocol Buffers.

### 3.4 Tile Serving Architecture

```mermaid
graph LR
    subgraph "Client Viewport"
        VP["User sees 4x5 grid<br/>= 20 tiles needed<br/>at current zoom level"]
    end

    subgraph "CDN (Akamai / CloudFlare)"
        CDN_POP["Nearest CDN PoP<br/>Cache: 95% hit rate<br/>TTL: 24 hours"]
    end

    subgraph "Tile Origin Servers"
        LB["Load Balancer"]
        TS1["Tile Server 1"]
        TS2["Tile Server 2"]
        TSN["Tile Server N"]
    end

    subgraph "Tile Generation"
        TC["Tile Cache<br/>(Redis / Memcached)<br/>Hot tiles in memory"]
        TG["Tile Renderer<br/>On-demand generation<br/>for cache misses"]
    end

    subgraph "Source Data"
        S3_T["S3: Pre-rendered<br/>tiles (zoom 0-14)"]
        OSM_DB["Map Database<br/>(PostGIS / flat files)<br/>Raw geometry data"]
    end

    VP -->|"GET /tiles/default/15/5241/12661.pbf"| CDN_POP
    CDN_POP -->|"Cache MISS (5%)"| LB
    LB --> TS1 & TS2 & TSN
    TS1 --> TC
    TC -->|"Cache HIT"| TS1
    TC -->|"Cache MISS"| TG
    TG -->|"Zoom 0-14: fetch pre-rendered"| S3_T
    TG -->|"Zoom 15-21: render on demand"| OSM_DB
    TG -->|"Store rendered tile"| TC
    TG -->|"Async upload"| S3_T

    style CDN_POP fill:#ff9,stroke:#333
    style TC fill:#f99,stroke:#333
```

**Tile serving strategy:**
1. **Zoom 0-14 (~350M tiles):** Pre-rendered and stored in S3. CDN caches them aggressively.
2. **Zoom 15-18:** Rendered on demand, cached in Redis/Memcached, then S3. Most urban areas are "warm" in cache.
3. **Zoom 19-21:** Rendered purely on demand. Only requested for extremely zoomed-in views. Short TTL cache.
4. **Satellite tiles:** Always raster (JPEG), pre-rendered from satellite imagery, stored in S3.

### 3.5 Tile Update Pipeline

When map data changes (new road, building, business), tiles must be re-rendered:

```mermaid
graph LR
    A["Map Edit<br/>(OSM import or<br/>internal editor)"] --> B["Change Detection<br/>Which tiles affected?<br/>Compute bounding box"]
    B --> C["Tile Invalidation<br/>Mark affected tiles<br/>across all zoom levels"]
    C --> D["Priority Queue<br/>High-traffic tiles first<br/>Low zoom first"]
    D --> E["Tile Renderer Farm<br/>Re-render affected tiles<br/>Upload to S3"]
    E --> F["CDN Purge<br/>Invalidate stale tiles<br/>at CDN edge"]
    F --> G["Clients see updated map<br/>on next request"]
```

**A single road change can affect tiles at multiple zoom levels.** A new highway
visible from zoom 8 to zoom 18 could require re-rendering ~4,000 tiles (sum of
affected tiles across 11 zoom levels). Google processes millions of map edits per
day, requiring a prioritized tile invalidation pipeline.

---

## 4. Place Search Service

### 4.1 Architecture

Place search combines **full-text search** (matching "starbucks" against business names)
with **geospatial ranking** (closest results first). This is a classic case for
Elasticsearch with its built-in geospatial capabilities.

```mermaid
graph TB
    subgraph "Client Request"
        Q["User types: 'star'<br/>Location: (37.77, -122.42)"]
    end

    subgraph "Place Search Service"
        AC["Autocomplete Handler<br/>- Prefix matching<br/>- Session dedup"]
        GC["Geocode Handler<br/>- Address parsing<br/>- Coordinate lookup"]
        DT["Detail Handler<br/>- Full place info<br/>- Photos, reviews"]
    end

    subgraph "Elasticsearch Cluster"
        ES_C["Coordinator Node<br/>Distributes query<br/>Merges results"]
        ES1["Data Node 1<br/>Shard: US-West places"]
        ES2["Data Node 2<br/>Shard: US-East places"]
        ES3["Data Node 3<br/>Shard: Europe places"]
        ESN["Data Node N<br/>Shard: Asia places"]
    end

    subgraph "Data Sources"
        PG_P["PostgreSQL<br/>Place master data"]
        GAPI["Google Places API<br/>(if using external)"]
        UGC["User Contributions<br/>Reviews, photos, edits"]
    end

    Q --> AC
    Q --> GC
    AC --> ES_C
    GC --> ES_C
    DT --> PG_P
    ES_C --> ES1 & ES2 & ES3 & ESN

    PG_P -->|"Sync pipeline"| ES_C
    UGC -->|"Near real-time"| PG_P
```

### 4.2 Elasticsearch Index Design

```json
{
  "mappings": {
    "properties": {
      "place_id":     { "type": "keyword" },
      "name":         { "type": "text", "analyzer": "autocomplete_analyzer",
                        "fields": { "exact": { "type": "keyword" } } },
      "address":      { "type": "text" },
      "location":     { "type": "geo_point" },
      "geohash":      { "type": "keyword" },
      "category":     { "type": "keyword" },
      "subcategory":  { "type": "keyword" },
      "rating":       { "type": "float" },
      "review_count": { "type": "integer" },
      "popularity":   { "type": "float" },
      "country_code": { "type": "keyword" },
      "name_suggest": {
        "type": "completion",
        "contexts": [
          { "name": "location", "type": "geo", "precision": 6 }
        ]
      }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase", "asciifolding"]
        }
      },
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  }
}
```

### 4.3 Search Ranking

Results are ranked by a **composite score** combining relevance, proximity, and quality:

```
score = text_relevance * 0.3 
      + proximity_score * 0.4 
      + quality_score * 0.3

where:
  text_relevance = Elasticsearch BM25 score (how well name/address matches query)
  proximity_score = 1 / (1 + distance_km)   (closer = higher score)
  quality_score = normalize(rating * log(review_count + 1) * popularity_weight)
```

The proximity component is implemented using Elasticsearch's `function_score` with a
`decay` function on the `geo_point` field. Results within 1 km get a score of ~1.0,
decaying to ~0.1 at 50 km.

### 4.4 Geocoding Pipeline

```
Forward Geocoding: "1600 Amphitheatre Pkwy, Mountain View, CA" → (37.4220, -122.0841)

Step 1: Address Parsing
  → {"number": "1600", "street": "Amphitheatre Pkwy", 
     "city": "Mountain View", "state": "CA"}

Step 2: Structured Search
  → Query address database with parsed components
  → Match against interpolated address ranges on street segments

Step 3: Coordinate Interpolation
  → Street segment "Amphitheatre Pkwy" has range 1500-1700 on north side
  → 1600 is at position (1600-1500)/(1700-1500) = 0.5 along segment
  → Interpolate lat/lng at 50% of segment geometry

Reverse Geocoding: (37.4220, -122.0841) → "1600 Amphitheatre Pkwy, Mountain View, CA"

Step 1: Find nearest street segments within 50m radius
Step 2: Project point onto nearest segment
Step 3: Interpolate address number from segment's address range
Step 4: Assemble full address from administrative boundaries
```

---

## 5. Routing Engine

### 5.1 Road Network as a Graph

The road network is modeled as a **weighted directed graph** where:
- **Nodes** = intersections and road endpoints
- **Edges** = road segments between intersections
- **Edge weights** = travel time (not distance!) based on road length / speed

```mermaid
graph LR
    subgraph "Road Network Graph (simplified)"
        A((A<br/>Home))
        B((B))
        C((C))
        D((D))
        E((E<br/>Office))

        A -->|"Main St<br/>5 min"| B
        A -->|"Oak Ave<br/>3 min"| C
        B -->|"Highway 101<br/>8 min"| E
        B -->|"Elm St<br/>4 min"| D
        C -->|"Pine Rd<br/>6 min"| D
        D -->|"Market St<br/>3 min"| E
        C -->|"Bay Blvd<br/>12 min"| E
    end

    subgraph "Routes Found"
        R1["Route 1: A→B→E<br/>Main St → Hwy 101<br/>13 min (fastest)"]
        R2["Route 2: A→C→D→E<br/>Oak Ave → Pine → Market<br/>12 min"]
        R3["Route 3: A→B→D→E<br/>Main St → Elm → Market<br/>12 min"]
    end
```

**Important:** Edge weights are travel TIME, not distance. A 10 km highway segment
(speed limit 100 km/h, weight = 6 min) is "shorter" than a 3 km residential street
(speed limit 30 km/h, weight = 6 min) in terms of routing.

### 5.2 Shortest Path: Dijkstra and A*

**Dijkstra's Algorithm** finds the shortest path from source to all reachable nodes
by expanding outward in order of distance. It guarantees an optimal solution but explores
many unnecessary nodes.

**A* Algorithm** improves Dijkstra by adding a heuristic: for each node, estimate the
remaining distance to the destination (using haversine / straight-line distance) and
prioritize nodes that appear closer to the goal.

```
Dijkstra:
  priority_queue = [(0, source)]
  while queue not empty:
    (cost, node) = pop minimum
    if node == destination: return path
    for each neighbor of node:
      new_cost = cost + edge_weight(node, neighbor)
      if new_cost < best_known[neighbor]:
        best_known[neighbor] = new_cost
        push (new_cost, neighbor) to queue

A*:
  Same as Dijkstra but priority is:
    f(node) = g(node) + h(node)
  where:
    g(node) = actual cost from source to node
    h(node) = heuristic estimate from node to destination
            = haversine_distance(node, destination) / max_speed
```

```mermaid
graph TB
    subgraph "Dijkstra: Explores All Directions"
        DS["Source<br/>(SF)"]
        D1["...500K nodes visited..."]
        DD["Destination<br/>(LA)"]
        DS --> D1 --> DD
    end

    subgraph "A*: Explores Toward Destination"
        AS["Source<br/>(SF)"]
        A1["...50K nodes visited..."]
        AD["Destination<br/>(LA)"]
        AS --> A1 --> AD
    end

    subgraph "Contraction Hierarchies: Highway Shortcuts"
        CS["Source<br/>(SF)"]
        C1["...500 nodes visited..."]
        CD["Destination<br/>(LA)"]
        CS --> C1 --> CD
    end
```

### 5.3 Contraction Hierarchies (CH): The Production Solution

Dijkstra and A* are too slow for production (200ms - 2s for cross-country routes).
**Contraction Hierarchies** is the algorithm that Google Maps, Apple Maps, and OSRM
actually use. It achieves **sub-millisecond query times** through preprocessing.

**Preprocessing phase (offline, takes hours):**
1. Assign each node an "importance" level (highways > local streets)
2. Process nodes from least to most important
3. For each node being "contracted": if removing it would make any shortest path longer, add a **shortcut edge** that bypasses it
4. Result: a hierarchy where highways are at the top, local streets at the bottom

**Query phase (online, ~1ms):**
1. Run **bidirectional search**: one from source going UP the hierarchy, one from destination going UP the hierarchy
2. They meet at the highest-level nodes (highway junctions)
3. Only ~500-1000 nodes are visited (vs 500K for Dijkstra)
4. Unpack shortcut edges to recover the actual path

```mermaid
graph TB
    subgraph "CH: Node Hierarchy (preprocessed)"
        direction TB
        HW1["Highway Junction A<br/>Level: 500 (very important)"]
        HW2["Highway Junction B<br/>Level: 480"]

        TR1["Trunk Road X<br/>Level: 200"]
        TR2["Trunk Road Y<br/>Level: 180"]

        LO1["Local Street 1<br/>Level: 10"]
        LO2["Local Street 2<br/>Level: 8"]
        LO3["Local Street 3<br/>Level: 12"]
        LO4["Local Street 4<br/>Level: 5"]

        S["SOURCE<br/>Level: 3"]
        D["DESTINATION<br/>Level: 7"]
    end

    subgraph "Bidirectional Search"
        S -.->|"Forward: go UP"| LO1
        LO1 -.->|"UP"| TR1
        TR1 -.->|"UP"| HW1
        HW1 -.->|"Shortcut edge"| HW2
        HW2 -.->|"DOWN (backward search)"| TR2
        TR2 -.->|"DOWN"| LO4
        LO4 -.->|"DOWN"| D
    end

    style S fill:#9f9
    style D fill:#f99
    style HW1 fill:#ff9
    style HW2 fill:#ff9
```

**Performance comparison for SF to LA route (~600 km):**

| Algorithm | Nodes Visited | Query Time | Preprocessing |
|-----------|--------------|------------|---------------|
| Dijkstra | ~500,000 | ~2 seconds | None |
| A* | ~50,000 | ~200ms | None |
| Contraction Hierarchies | ~500-1,000 | ~1ms | 2-4 hours (one-time) |
| CH + live traffic | ~1,000-2,000 | ~5ms | 2-4 hours + traffic overlay |

### 5.4 Multi-Modal Routing

Different transport modes require different graphs and algorithms:

```mermaid
graph TB
    subgraph "Routing Mode Selection"
        REQ["Route Request<br/>mode=transit"]
    end

    subgraph "Mode-Specific Graphs"
        DG["Driving Graph<br/>- Road network<br/>- One-way streets<br/>- Turn restrictions<br/>- Weight: travel time"]
        WG["Walking Graph<br/>- Sidewalks + paths<br/>- Stairs, crosswalks<br/>- Pedestrian zones<br/>- Weight: walking time"]
        CG["Cycling Graph<br/>- Bike lanes + roads<br/>- Elevation matters<br/>- Avoid highways<br/>- Weight: cycling time"]
        TG["Transit Graph<br/>- GTFS schedule data<br/>- Bus/train/subway<br/>- Transfer penalties<br/>- Time-dependent weights"]
    end

    subgraph "Multi-Modal Combo"
        MM["Transit Route:<br/>Walk 5 min to bus stop<br/>→ Bus #47 for 12 min<br/>→ Transfer to BART<br/>→ BART for 18 min<br/>→ Walk 3 min to dest"]
    end

    REQ --> TG
    TG --> MM
    TG -.->|"First/last mile"| WG
```

**Transit routing is time-dependent:** unlike driving where edge weights are relatively
stable, transit depends on schedules. A bus route that takes 10 minutes at 8:00 AM
might not exist at 8:05 AM (next bus in 15 minutes). This requires a time-expanded
graph or RAPTOR algorithm (used by Google Maps for transit).

### 5.5 Alternative Routes

To provide 2-3 alternative routes, the system uses **penalty-based re-routing**:

```
1. Compute optimal route R1 using CH
2. For route R2: add 2x penalty to edges used by R1, re-run CH
   → Forces algorithm to find a "sufficiently different" route
3. For route R3: add 2x penalty to edges used by R1 and R2, re-run CH
4. Filter: discard routes that are >30% longer than R1
5. Filter: discard routes that share >80% of edges with another route
6. Return top 3 distinct routes
```

### 5.6 Routing Engine Architecture

```mermaid
graph TB
    subgraph "Routing Engine Cluster"
        LB["Load Balancer<br/>Route by region hint"]

        subgraph "Region: North America"
            R_NA1["Router 1<br/>CH graph in RAM<br/>~100 GB"]
            R_NA2["Router 2<br/>CH graph in RAM<br/>(replica)"]
        end

        subgraph "Region: Europe"
            R_EU1["Router 1<br/>EU graph in RAM"]
            R_EU2["Router 2<br/>(replica)"]
        end

        subgraph "Region: Asia"
            R_AS1["Router 1<br/>Asia graph in RAM"]
            R_AS2["Router 2<br/>(replica)"]
        end

        CROSS["Cross-Region Router<br/>For intercontinental routes<br/>Uses border nodes between regions"]
    end

    subgraph "Graph Data Pipeline"
        OSM_I["OSM Import<br/>(weekly)"]
        PROC["Graph Processor<br/>- Build adjacency list<br/>- Compute CH<br/>- Partition by region"]
        DIST["Graph Distributor<br/>- Push to routers<br/>- Blue/green deploy<br/>- Memory-mapped files"]
    end

    subgraph "Live Traffic Integration"
        TFC["Traffic Cache<br/>(Redis)<br/>Segment → speed"]
    end

    LB --> R_NA1 & R_NA2
    LB --> R_EU1 & R_EU2
    LB --> R_AS1 & R_AS2
    LB --> CROSS

    R_NA1 & R_EU1 & R_AS1 -->|"Lookup segment speed"| TFC

    OSM_I --> PROC --> DIST
    DIST -->|"Memory-mapped load"| R_NA1 & R_NA2 & R_EU1 & R_EU2 & R_AS1 & R_AS2

    style TFC fill:#f99,stroke:#333
    style R_NA1 fill:#9f9,stroke:#333
    style R_NA2 fill:#9f9,stroke:#333
```

**Live traffic integration with CH:**
CH is preprocessed with free-flow speeds. To incorporate live traffic:
1. At query time, look up current speed for each edge from Redis
2. Multiply CH edge weight by `(free_flow_speed / current_speed)` ratio
3. This "customizable" CH approach adds ~5ms overhead but gives traffic-aware routes
4. OSRM calls this "Multi-Level Dijkstra" -- a variant that allows live edge weights

---

## 6. ETA Service

### 6.1 Architecture Overview

ETA is one of the most critical services -- Uber uses it for fare estimation, driver
dispatch, and customer experience. ETA must be accurate, fast, and work at scale.

```mermaid
graph TB
    subgraph "ETA Request"
        REQ["ETA Request<br/>Origin → Destination<br/>departure_time"]
    end

    subgraph "ETA Service"
        ROUTER["Route Computation<br/>Find path using CH<br/>Get sequence of segments"]
        HIST["Historical Lookup<br/>Get typical speed for<br/>each segment at this<br/>time of day/week"]
        LIVE["Live Traffic Lookup<br/>Get current speed for<br/>each segment from Redis"]
        ML["ML Model Inference<br/>Combine features:<br/>- Historical speed<br/>- Live speed<br/>- Time of day<br/>- Day of week<br/>- Weather<br/>- Events"]
        AGG["Aggregator<br/>Sum segment travel times<br/>Add intersection delays<br/>Add confidence interval"]
    end

    subgraph "Data Sources"
        GS_E["Graph Store<br/>Road network"]
        RD_E["Redis<br/>Live segment speeds"]
        CS_E["Historical DB<br/>Speed patterns"]
        WX["Weather API"]
        EV["Events API<br/>Concerts, sports"]
    end

    REQ --> ROUTER
    ROUTER --> GS_E
    ROUTER --> HIST & LIVE
    HIST --> CS_E
    LIVE --> RD_E
    HIST & LIVE --> ML
    ML -->|"Per-segment ETA"| AGG
    WX & EV --> ML
    AGG -->|"Total ETA + range"| REQ
```

### 6.2 ETA Calculation Methods

**Method 1: Segment-based summation (baseline)**
```
total_eta = 0
for each segment in route:
    segment_speed = get_speed(segment, time_of_day)
    segment_time = segment.length / segment_speed
    total_eta += segment_time
total_eta += intersection_delays * num_intersections
```

**Method 2: Historical pattern matching**
```
For each segment, look up average speed at:
  - Same day of week (Tuesday)
  - Same 15-minute window (8:15-8:30 AM)
  - Blend with live speed using decay: 
    effective_speed = 0.6 * live_speed + 0.4 * historical_speed
    (if live data is fresh, weight it more; if stale, trust historical more)
```

**Method 3: ML model (what Uber and Google actually use)**
```
Features:
  - Route distance and segment count
  - Historical speed for each segment (time-of-day, day-of-week)
  - Live speed for each segment
  - Road types along route (% highway, % residential)
  - Number of traffic signals / stop signs
  - Weather conditions (rain adds ~15%, snow adds ~30%)
  - Special events (stadium, concert venue nearby)
  - Time of day (rush hour multiplier)
  - Device speed (if user is already moving, incorporate momentum)

Model: Gradient-boosted tree (XGBoost/LightGBM) or neural network
Output: Predicted travel time + confidence interval

Uber's DeepETA uses a transformer-based model that processes the entire
route as a sequence of segments, similar to NLP sequence models.
```

### 6.3 Distance Matrix (Batch ETA)

For ride-hailing (find ETA from 20 nearby drivers to rider), the system needs
to compute many ETAs efficiently:

```
Standard:    20 routes × 1ms each = 20ms (serial) or ~5ms (parallel on 4 threads)
Optimized:   Shared Dijkstra from destination to all origins (single search) = ~3ms
             Works because CH bidirectional search shares the "backward" part
```

---

## 7. Traffic Service

### 7.1 GPS Data Pipeline

```mermaid
graph TB
    subgraph "GPS Sources (17M updates/sec)"
        P1["Android Phones<br/>(background location)"]
        P2["iOS Phones<br/>(when Maps open)"]
        P3["Waze Users<br/>(crowd-sourced)"]
        P4["Ride-hailing Drivers<br/>(Uber, Lyft)"]
        P5["Fleet Vehicles<br/>(trucks, delivery)"]
    end

    subgraph "Ingestion Layer"
        KFK_T["Kafka Cluster<br/>Topic: gps-traces<br/>Partitioned by H3 cell<br/>50-100 brokers"]
    end

    subgraph "Stream Processing (Flink)"
        MM["Map Matching<br/>- Snap GPS to road<br/>- Handle GPS noise<br/>- Identify road segment"]
        SA["Speed Aggregation<br/>- Per-segment speed<br/>- Sliding 2-min window<br/>- Outlier removal"]
        AD["Anomaly Detection<br/>- Sudden speed drop<br/>- Potential incident<br/>- Queue formation"]
    end

    subgraph "Output"
        RD_T["Redis<br/>Real-time segment speeds<br/>Updated every 30 sec"]
        TT["Traffic Tile Generator<br/>Color-code roads<br/>Green/Yellow/Red"]
        INC["Incident Service<br/>Detect accidents<br/>Road closures"]
        ARC["Archive (Cassandra)<br/>Historical patterns<br/>30-day retention"]
    end

    P1 & P2 & P3 & P4 & P5 --> KFK_T
    KFK_T --> MM
    MM --> SA
    SA --> RD_T
    SA --> TT
    SA --> ARC
    MM --> AD
    AD --> INC
```

### 7.2 Map Matching

Raw GPS points have noise (5-50m error) and must be matched to the correct road
segment. This is critical -- without it, we cannot compute per-segment speeds.

```
GPS Trace: (37.7749, -122.4194) → (37.7751, -122.4190) → (37.7754, -122.4185)

Problem: These points are near two parallel streets (Market St and Mission St).
         Which street is the phone actually on?

Map Matching Algorithm (Hidden Markov Model):
  - States: candidate road segments for each GPS point
  - Emission probability: how close is GPS point to segment? (Gaussian)
  - Transition probability: how likely to travel from segment A to segment B?
    (Based on road connectivity and distance)
  - Viterbi algorithm: find most likely sequence of segments

Result: GPS trace matched to specific road segments with confidence score
```

### 7.3 Segment Speed Calculation

```
For each road segment, every 30 seconds:
  1. Collect all GPS probes matched to this segment in the last 2 minutes
  2. Filter outliers (parked cars, GPS noise) -- remove speeds < 3 km/h and > speed_limit * 1.5
  3. Compute weighted median speed (recent probes weighted more)
  4. Compute confidence = min(sample_count / 5, 1.0)  -- need at least 5 samples
  5. If confidence < 0.3: fall back to historical speed for this time-of-day
  6. Compute congestion_ratio = current_speed / free_flow_speed
  7. Color coding:
     - Green:  ratio > 0.75 (flowing)
     - Yellow: ratio 0.4-0.75 (moderate)
     - Red:    ratio < 0.4 (heavy traffic)
     - Dark Red: ratio < 0.2 (standstill)
```

### 7.4 Traffic Tile Generation

Traffic visualization on the map is served as a **separate tile layer** overlaid
on the base map. These tiles are generated from the segment speed data:

```
Traffic Tile Pipeline:
  1. For each tile (z, x, y) at zoom levels 8-18:
     a. Find all road segments that intersect this tile
     b. For each segment, look up current speed from Redis
     c. Color-code the segment geometry (green/yellow/red/dark red)
     d. Render as a semi-transparent overlay tile
  2. Cache in CDN with short TTL (1-2 minutes)
  3. Client requests traffic tiles alongside base map tiles
```

---

## 8. Navigation Service

### 8.1 Turn-by-Turn Guidance Architecture

```mermaid
graph TB
    subgraph "Mobile Client"
        GPS_C["GPS Sensor<br/>Updates every 1-3 sec"]
        RENDER["Map Renderer<br/>Show route + position"]
        VOICE["Voice Engine<br/>TTS for instructions"]
        UI["Navigation UI<br/>Maneuver icon + distance"]
    end

    subgraph "WebSocket Connection"
        WS["Bidirectional WebSocket<br/>Client: GPS updates<br/>Server: guidance updates"]
    end

    subgraph "Navigation Service"
        SNAP["Road Snapping<br/>Snap GPS to route<br/>Determine current edge"]
        PROG["Progress Tracker<br/>Distance along route<br/>Next maneuver ETA"]
        DEV["Deviation Detector<br/>Is user off-route?<br/>Distance threshold: 50m"]
        INST["Instruction Generator<br/>Turn-by-turn text<br/>Lane guidance<br/>Speed limit"]
        REROUTE["Reroute Engine<br/>Compute new route<br/>from current position"]
    end

    GPS_C -->|"lat, lng, speed, heading"| WS
    WS --> SNAP
    SNAP --> PROG
    PROG --> DEV
    DEV -->|"On route"| INST
    DEV -->|"Off route"| REROUTE
    REROUTE --> INST
    INST -->|"guidance update"| WS
    WS --> RENDER & VOICE & UI
```

### 8.2 Route Following Logic

```
Every GPS update (1-3 seconds):

1. ROAD SNAPPING
   - Project GPS point onto nearest point on route polyline
   - If projection distance < 20m: user is on route
   - Use heading to disambiguate parallel roads

2. PROGRESS TRACKING
   - Calculate distance traveled along route
   - Determine current step (which maneuver segment)
   - Calculate distance to next maneuver

3. INSTRUCTION GENERATION
   - If distance to next maneuver < 1000m: "In 1 km, turn right onto Oak St"
   - If distance to next maneuver < 200m:  "Turn right onto Oak St"
   - If distance to next maneuver < 30m:   "Turn right"
   - After completing maneuver:            "Continue on Oak St for 2 km"

4. DEVIATION DETECTION
   - If projection distance > 50m for 3+ consecutive GPS points:
     → User has deviated from route
     → Trigger reroute from current position to destination
     → Send new route to client
     → "Rerouting..."

5. PROACTIVE REROUTING
   - Even if user is on route, if traffic ahead has worsened significantly
     (>5 min slower than original ETA), suggest a better route:
     → "Faster route available. 8 minutes faster. Switch route?"
```

### 8.3 Arrival Detection

```
Arrival detection must handle:
  - GPS inaccuracy (user is at destination but GPS says 30m away)
  - Driving past destination (parking is around the corner)
  - Multi-entrance buildings (destination at back entrance)

Algorithm:
  1. If distance to destination < 50m AND speed < 5 km/h:
     → "You have arrived at your destination"
  2. If remaining route distance < 100m AND route ends on same road:
     → "Your destination is on the right/left" (based on route geometry)
  3. If user drives past destination > 200m:
     → "You have passed your destination" + offer to reroute back
```

---

## 9. Data Flow Walkthroughs

### 9.1 Flow: User Opens Maps App and Pans Around

```mermaid
sequenceDiagram
    participant C as Client App
    participant CDN as CDN PoP
    participant TS as Tile Server
    participant S3 as Object Storage

    C->>C: Calculate visible tile coordinates<br/>(z=15, x=5240..5244, y=12660..12664)<br/>= 25 tiles needed

    par Load 25 tiles in parallel
        C->>CDN: GET /tiles/default/15/5241/12661.pbf
        CDN->>CDN: Check cache
        alt Cache HIT (95% of requests)
            CDN-->>C: 200 OK (tile data, ~12 KB)
        else Cache MISS
            CDN->>TS: Forward request
            TS->>S3: Fetch pre-rendered tile
            S3-->>TS: Tile data
            TS-->>CDN: Tile data + Cache-Control headers
            CDN->>CDN: Store in edge cache
            CDN-->>C: 200 OK (tile data)
        end
    end

    C->>C: Render vector tiles using WebGL<br/>Apply map style (colors, labels, icons)
    C->>C: Load traffic overlay tiles (separate layer)
```

### 9.2 Flow: User Requests Directions

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant RT as Routing Engine
    participant GS as Graph Store (RAM)
    participant RD as Redis (Traffic)
    participant ETA as ETA Service

    C->>AG: POST /directions<br/>{origin, destination, mode: driving}
    AG->>AG: Authenticate, rate limit
    AG->>RT: Forward route request

    RT->>GS: Find nearest graph node to origin
    GS-->>RT: node_id: 42851
    RT->>GS: Find nearest graph node to destination
    GS-->>RT: node_id: 93742

    RT->>GS: Run CH bidirectional search<br/>from 42851 to 93742
    Note over RT,GS: ~1ms: visits ~500 nodes<br/>Uses shortcut edges
    GS-->>RT: Shortest path: [42851, 50123, 68901, ..., 93742]

    RT->>GS: Unpack shortcut edges to full path
    GS-->>RT: Full path with road names, geometry

    par Traffic-aware ETA
        RT->>RD: Get current speed for each segment on path
        RD-->>RT: Segment speeds
    end

    RT->>RT: Compute route 1 (optimal)
    RT->>RT: Compute route 2 (penalty on route 1 edges)
    RT->>RT: Compute route 3 (penalty on route 1+2 edges)

    RT->>ETA: Get ETA for each route
    ETA-->>RT: ETAs with traffic

    RT-->>AG: 3 routes with steps, polylines, ETAs
    AG-->>C: Response
    C->>C: Render routes on map<br/>Show ETA for each
```

### 9.3 Flow: GPS Data to Traffic Layer

```mermaid
sequenceDiagram
    participant P as 50M Phones
    participant K as Kafka
    participant F as Flink Processor
    participant RD as Redis
    participant TG as Traffic Tile Gen
    participant CDN as CDN

    P->>K: GPS update (lat, lng, speed, heading)<br/>17M updates/sec

    K->>F: Consume from gps-traces topic
    F->>F: Map Matching<br/>Snap GPS to road segment<br/>using Hidden Markov Model
    F->>F: Speed Aggregation<br/>Per segment, 2-min sliding window<br/>Weighted median, filter outliers
    F->>RD: Update segment speed<br/>HSET traffic:seg_12345<br/>speed 45 confidence 0.95

    Note over F,RD: Every 30 seconds per segment

    loop Every 1-2 minutes
        TG->>RD: Read all segment speeds
        TG->>TG: Generate traffic overlay tiles<br/>Color-code roads green/yellow/red
        TG->>CDN: Push updated traffic tiles<br/>Short TTL: 1-2 minutes
    end

    Note over CDN: Clients refresh traffic layer<br/>every 1-2 minutes
```

---

## 10. Database and Storage Design

### 10.1 Storage Architecture Summary

```mermaid
graph TB
    subgraph "Hot Path (real-time, sub-ms)"
        RD["Redis Cluster<br/>- Live segment speeds (6 GB)<br/>- Tile metadata cache<br/>- Session state"]
        GS["In-Memory Graph<br/>- Road network + CH (100 GB)<br/>- Memory-mapped files<br/>- Multiple replicas"]
    end

    subgraph "Warm Path (fast queries, ms)"
        ES["Elasticsearch<br/>- 2B+ place documents<br/>- Full-text + geo search<br/>- 5+ TB index"]
        PG["PostgreSQL<br/>- Place master data<br/>- User accounts<br/>- API keys, billing<br/>- Navigation sessions"]
    end

    subgraph "Cold Path (bulk storage)"
        S3_ST["S3 / GCS<br/>- Map tiles (15 TB)<br/>- Satellite imagery (15 PB)<br/>- Offline map packs"]
        CS_ST["Cassandra / BigQuery<br/>- Historical traffic (100 GB)<br/>- GPS trace archive<br/>- Analytics data"]
    end
```

### 10.2 Why This Polyglot Storage?

| Data | Store | Reason |
|------|-------|--------|
| Road graph | In-memory (custom binary) | Must be sub-ms for routing; ~100 GB fits in RAM |
| Live traffic | Redis | Sub-ms reads for every routing query; 6 GB fits easily |
| Place search | Elasticsearch | Full-text + geospatial combo; built-in autocomplete |
| Place details | PostgreSQL | ACID transactions for updates, reviews, hours |
| Map tiles | S3 + CDN | Immutable blobs; CDN handles read scale |
| Historical traffic | Cassandra | Time-series data; write-heavy, partition by segment + time |
| GPS traces | Kafka + Cassandra | High-throughput stream + archival storage |

---

## 11. Communication Patterns

### 11.1 Protocol Summary

| Path | Protocol | Why |
|------|----------|-----|
| Client ↔ Tile CDN | HTTPS GET + HTTP/2 | Parallel tile loading, caching headers |
| Client ↔ API Gateway | HTTPS REST (JSON) | Standard request-response for search, directions |
| Client ↔ Navigation | WebSocket | Bidirectional: GPS upload + guidance push |
| Service ↔ Service | gRPC | Low-latency internal calls with protobuf |
| GPS ingestion | Kafka | Decoupled high-throughput stream processing |
| Traffic updates | Redis Pub/Sub | Real-time broadcast of segment speed changes |
| Tile updates | CDN purge API | Invalidate stale tiles at edge |

### 11.2 Why WebSocket for Navigation?

During active navigation, the client sends GPS every 1-3 seconds and the server sends
guidance updates with similar frequency. This bidirectional real-time communication
is poorly served by REST polling.

```
REST polling approach:
  Client → Server: POST /location every 2 sec (HTTP overhead each time)
  Client → Server: GET /guidance every 2 sec (another HTTP request)
  = 60 HTTP requests per minute, each with headers, TLS handshake overhead

WebSocket approach:
  Single persistent connection
  Client → Server: 60-byte GPS frame every 2 sec
  Server → Client: 200-byte guidance frame as needed
  = ~95% less bandwidth, ~80% less latency
```

### 11.3 Caching Strategy

```
                    CACHING LAYERS
  ┌─────────────────────────────────────────────────────┐
  │ Layer 1: Client-side tile cache                     │
  │   - LRU cache of recently viewed tiles              │
  │   - 200-500 MB on device                            │
  │   - Includes offline maps if downloaded              │
  │   - Hit rate: ~60% (re-panning to same area)        │
  ├─────────────────────────────────────────────────────┤
  │ Layer 2: CDN edge cache (200+ PoPs)                 │
  │   - Popular tiles cached at edge                    │
  │   - TTL: 24h for base tiles, 2 min for traffic      │
  │   - Hit rate: ~95% for base tiles                   │
  ├─────────────────────────────────────────────────────┤
  │ Layer 3: Origin tile cache (Redis/Memcached)        │
  │   - Recently rendered on-demand tiles               │
  │   - ~5 TB (covers high-zoom urban areas)            │
  │   - Hit rate: ~80% of CDN misses                    │
  ├─────────────────────────────────────────────────────┤
  │ Layer 4: Object storage (S3/GCS)                    │
  │   - All pre-rendered tiles (zoom 0-14)              │
  │   - Source of truth for tile data                   │
  │   - Cache miss triggers on-demand rendering         │
  └─────────────────────────────────────────────────────┘

  Effective cache hit rate: 99.5%+
  Only ~0.5% of tile requests trigger fresh rendering
```

---

## Architecture Summary

```
                    GOOGLE MAPS SYSTEM - KEY COMPONENTS
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  MAP TILES          PLACE SEARCH        ROUTING         │
  │  ─────────          ────────────        ───────         │
  │  QuadTree tiles     Elasticsearch       CH graph in RAM │
  │  Vector (PBF)       Geo + full-text     ~1ms queries    │
  │  CDN-first          Edge n-gram         Multi-modal     │
  │  95% cache hit      Proximity decay     Alt routes      │
  │                                                         │
  │  TRAFFIC            ETA                 NAVIGATION      │
  │  ───────            ───                 ──────────      │
  │  17M GPS/sec        ML model            WebSocket       │
  │  Map matching       Historical+live     Turn-by-turn    │
  │  Segment speeds     Weather+events      Auto-reroute    │
  │  Kafka → Flink      <500ms latency      Deviation detect│
  │                                                         │
  │  STORAGE: Redis (traffic) + In-Memory (graph) +         │
  │           Elasticsearch (places) + S3/CDN (tiles) +     │
  │           Cassandra (historical)                        │
  └─────────────────────────────────────────────────────────┘
```
