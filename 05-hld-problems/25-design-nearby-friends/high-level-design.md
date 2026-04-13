# High-Level Design -- Nearby Friends / Proximity Service

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        MA1[Mobile App - User A]
        MA2[Mobile App - User B]
        MA3[Mobile App - User C]
    end

    subgraph "Edge / Gateway Layer"
        LB[Load Balancer<br/>L4/L7 - HAProxy/AWS NLB]
        AG[API Gateway<br/>Rate Limiting, Auth, Routing]
    end

    subgraph "Real-Time Layer"
        WSS1[WebSocket Server 1]
        WSS2[WebSocket Server 2]
        WSS3[WebSocket Server N]
        WR[WS Connection Registry<br/>Redis - user_id -> ws_server_id]
    end

    subgraph "Application Layer"
        LS[Location Service<br/>Receives & stores GPS updates]
        PS[Proximity Service<br/>Computes who is nearby]
        FGS[Friend Graph Service<br/>Who are my friends?]
        NS[Notification Service<br/>Push nearby friend updates]
        PRS[Privacy Service<br/>Sharing rules enforcement]
    end

    subgraph "Data Layer"
        RC[(Redis Cluster<br/>Current locations +<br/>H3 cell index)]
        PG[(PostgreSQL<br/>Privacy settings,<br/>user profiles)]
        CS[(Cassandra<br/>Location history<br/>24h TTL)]
        MQ[Message Queue<br/>Kafka / Redis Streams]
    end

    MA1 -->|HTTPS + WebSocket| LB
    MA2 -->|HTTPS + WebSocket| LB
    MA3 -->|HTTPS + WebSocket| LB
    LB --> AG
    AG --> WSS1
    AG --> WSS2
    AG --> WSS3
    AG --> LS
    WSS1 --- WR
    WSS2 --- WR
    WSS3 --- WR
    LS --> RC
    LS --> CS
    LS --> MQ
    MQ --> PS
    PS --> RC
    PS --> FGS
    PS --> PRS
    PS --> NS
    FGS --> RC
    PRS --> PG
    NS --> WR
    NS --> WSS1
    NS --> WSS2
    NS --> WSS3

    style RC fill:#ff6b6b,color:#fff
    style MQ fill:#ffd93d,color:#000
    style PS fill:#6bcb77,color:#fff
```

---

## 2. Component Deep Dive

### 2.1 Mobile Client

```mermaid
graph LR
    subgraph "Mobile App"
        LM[Location Manager<br/>GPS/WiFi/Cell]
        BM[Battery Manager<br/>Adaptive frequency]
        WSC[WebSocket Client<br/>Persistent connection]
        MC[Map Controller<br/>Render friend pins]
        LC[Location Cache<br/>Local friend positions]
    end

    LM -->|Raw GPS| BM
    BM -->|Throttled updates| WSC
    WSC -->|Friend locations| LC
    LC -->|Positions| MC
```

**Key Mobile Responsibilities:**

| Responsibility | Implementation |
|---------------|----------------|
| Location acquisition | Fused Location Provider (Android) / CLLocationManager (iOS) |
| Battery optimization | Adaptive frequency based on motion state |
| Connection management | WebSocket with auto-reconnect + exponential backoff |
| Local caching | Cache friend positions for smooth map rendering |
| Offline handling | Show last-known positions with "stale" indicator |

### 2.2 API Gateway

```
Responsibilities:
  1. Authentication (JWT token validation)
  2. Rate limiting (100 location updates/min per user)
  3. Request routing (REST -> services, WS -> WebSocket servers)
  4. SSL termination
  5. Request/response logging for analytics

Rate Limits:
  - Location updates:  max 2/min normal, 4/min when moving fast
  - Nearby friends GET: max 30/min (fallback endpoint)
  - Privacy settings:   max 10/min
```

### 2.3 WebSocket Service

```mermaid
graph TB
    subgraph "WebSocket Server Cluster"
        WS1[WS Server 1<br/>100K connections]
        WS2[WS Server 2<br/>100K connections]
        WS3[WS Server N<br/>100K connections]
    end

    subgraph "Connection Registry"
        CR[(Redis<br/>user_id -> server_id<br/>10M entries)]
    end

    subgraph "Pub/Sub Channel"
        PS[Redis Pub/Sub<br/>OR Kafka Topics<br/>per WS server]
    end

    WS1 -->|Register| CR
    WS2 -->|Register| CR
    WS3 -->|Register| CR
    PS -->|Deliver msg| WS1
    PS -->|Deliver msg| WS2
    PS -->|Deliver msg| WS3
```

**Connection Management:**

```
When user connects:
  1. Authenticate WebSocket handshake (JWT in query param or header)
  2. Register in connection registry:
     HSET ws_connections user_123 ws_server_7
  3. Subscribe to user's personal channel:
     SUBSCRIBE user_channel:user_123
  4. Fetch and send initial nearby friends list

When user disconnects:
  1. Remove from connection registry:
     HDEL ws_connections user_123
  2. Unsubscribe from channel
  3. Keep location in Redis with TTL (5 min grace period)
  4. After TTL expires, remove from H3 cell index

When server needs to push to user_123:
  1. Look up server: HGET ws_connections user_123 -> ws_server_7
  2. Publish to that server's channel:
     PUBLISH ws_server_7:incoming {target: user_123, data: {...}}
  3. ws_server_7 finds local socket for user_123 and sends
```

**Scaling WebSocket Connections:**

```
10M concurrent connections / 100K per server = 100 WebSocket servers

Each server:
  - 100K persistent TCP connections
  - ~1 GB memory for connection state
  - ~50 Mbps outbound bandwidth
  - 4-8 CPU cores (event-driven, non-blocking I/O)

Technology choices:
  - Node.js with ws library (lightweight, event-driven)
  - Go with gorilla/websocket (efficient goroutines)
  - Java with Netty (proven at scale)
```

### 2.4 Location Service

```mermaid
sequenceDiagram
    participant Client as Mobile Client
    participant WS as WebSocket Server
    participant LS as Location Service
    participant Redis as Redis Cluster
    participant Kafka as Kafka
    participant Cassandra as Cassandra

    Client->>WS: location_update (lat, lng, ts)
    WS->>LS: Forward location update
    LS->>LS: Validate coordinates
    LS->>LS: Compute H3 cell index
    LS->>Redis: SET loc:user_123 {lat, lng, h3, ts}
    LS->>Redis: SADD h3:872830828ffffff user_123
    LS->>Redis: SREM h3:872830826ffffff user_123<br/>(if cell changed)
    LS->>Kafka: Publish location_update event
    LS->>Cassandra: Async write to history
    LS-->>WS: ACK
```

**Location Service Internals:**

```python
class LocationService:
    def handle_update(self, user_id, lat, lng, timestamp, accuracy, speed):
        # 1. Validate
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise InvalidCoordinates()

        # 2. Compute H3 cell at resolution 7
        new_cell = h3.latlng_to_cell(lat, lng, 7)
        old_location = redis.hgetall(f"loc:{user_id}")
        old_cell = old_location.get("h3_cell")

        # 3. Update current location in Redis
        redis.hmset(f"loc:{user_id}", {
            "lat": lat, "lng": lng,
            "h3_cell": new_cell,
            "ts": timestamp,
            "acc": accuracy,
            "spd": speed
        })
        redis.expire(f"loc:{user_id}", 300)  # 5 min TTL

        # 4. Update H3 cell index (only if cell changed)
        if old_cell and old_cell != new_cell:
            pipeline = redis.pipeline()
            pipeline.srem(f"h3:{old_cell}", user_id)
            pipeline.sadd(f"h3:{new_cell}", user_id)
            pipeline.execute()
        elif not old_cell:
            redis.sadd(f"h3:{new_cell}", user_id)

        # 5. Publish to Kafka for proximity service
        kafka.publish("location_updates", {
            "user_id": user_id,
            "lat": lat, "lng": lng,
            "h3_cell": new_cell,
            "cell_changed": old_cell != new_cell,
            "ts": timestamp
        })

        # 6. Async write to Cassandra for history
        cassandra.async_write("location_history", {
            "user_id": user_id,
            "timestamp": timestamp,
            "lat": lat, "lng": lng,
            "h3_cell": new_cell
        })
```

### 2.5 Proximity Service (The Brain)

```mermaid
sequenceDiagram
    participant Kafka as Kafka
    participant PS as Proximity Service
    participant FGS as Friend Graph Service
    participant Redis as Redis
    participant PRS as Privacy Service
    participant NS as Notification Service

    Kafka->>PS: location_update event (user_123)
    PS->>FGS: Get friends of user_123
    FGS-->>PS: [user_456, user_789, user_012, ...]
    PS->>PRS: Filter by privacy rules
    PRS-->>PS: [user_456, user_789] (allowed)
    PS->>Redis: Get H3 cell + k-ring neighbors
    PS->>Redis: SMEMBERS h3:cell1, h3:cell2, ...<br/>(users in nearby cells)
    PS->>PS: Intersect friends with nearby users
    PS->>PS: Calculate exact distance for matches
    PS->>PS: Filter by 5 km radius
    PS-->>NS: Notify: {user_456 is 1.2km from user_123}
    NS->>NS: Push to user_123: friend_456 nearby
    NS->>NS: Push to user_456: friend_123 nearby
```

**The Proximity Algorithm:**

```python
class ProximityService:
    RADIUS_KM = 5
    H3_RESOLUTION = 7

    def process_location_update(self, event):
        user_id = event["user_id"]
        lat, lng = event["lat"], event["lng"]
        h3_cell = event["h3_cell"]

        # Step 1: Get user's friends (from Friend Graph Service)
        friend_ids = friend_graph.get_friends(user_id)
        if not friend_ids:
            return

        # Step 2: Filter by privacy (from Privacy Service)
        visible_friends = privacy_service.filter_allowed(
            viewer_ids=friend_ids,
            target_id=user_id
        )
        friends_sharing_with_me = privacy_service.filter_allowed(
            viewer_ids=[user_id],
            target_id_list=visible_friends
        )

        # Step 3: Get k-ring of H3 cells (center + neighbors)
        # k=2 gives 19 cells, covering ~98 km^2
        nearby_cells = h3.grid_disk(h3_cell, 2)

        # Step 4: Get ALL users in those cells
        pipeline = redis.pipeline()
        for cell in nearby_cells:
            pipeline.smembers(f"h3:{cell}")
        cell_members = pipeline.execute()
        users_in_area = set().union(*cell_members)

        # Step 5: Intersect friends with users in area
        # This is the KEY OPTIMIZATION -- set intersection
        nearby_friends = friends_sharing_with_me & users_in_area

        # Step 6: Calculate exact Haversine distance
        results = []
        for friend_id in nearby_friends:
            friend_loc = redis.hgetall(f"loc:{friend_id}")
            dist = haversine(lat, lng,
                           float(friend_loc["lat"]),
                           float(friend_loc["lng"]))
            if dist <= self.RADIUS_KM:
                results.append({
                    "friend_id": friend_id,
                    "distance_km": dist,
                    "lat": friend_loc["lat"],
                    "lng": friend_loc["lng"],
                    "last_updated": friend_loc["ts"]
                })

        # Step 7: Notify both parties
        for friend in results:
            notification_service.push_friend_nearby(
                to_user=user_id,
                friend=friend
            )
            notification_service.push_friend_nearby(
                to_user=friend["friend_id"],
                friend={"friend_id": user_id, "distance_km": friend["distance_km"],
                         "lat": lat, "lng": lng}
            )
```

### 2.6 Friend Graph Service

```mermaid
graph TB
    subgraph "Friend Graph Options"
        direction LR
        O1[Option A:<br/>Redis Adjacency List]
        O2[Option B:<br/>Graph DB - Neo4j]
        O3[Option C:<br/>PostgreSQL<br/>+ Friendship Table]
    end

    subgraph "Redis Adjacency List (Chosen)"
        R1["friends:user_123 = {u456, u789, u012}"]
        R2["friends:user_456 = {u123, u789, u555}"]
        R3["friends:user_789 = {u123, u456}"]
    end

    subgraph "Operations Needed"
        OP1["Get all friends: SMEMBERS friends:user_123<br/>O(N) where N = friend count"]
        OP2["Check if friends: SISMEMBER friends:user_123 user_456<br/>O(1)"]
        OP3["Common friends: SINTER friends:user_123 friends:user_456<br/>O(N)"]
    end
```

**Why Redis over Graph DB for this use case:**

```
We only need ONE operation: "Get all friends of user X"
We do NOT need: shortest path, friend-of-friend, recommendations

Redis SMEMBERS is O(N) and returns in <1ms for 400 members.
Graph DB adds unnecessary complexity for a flat adjacency lookup.

If the social app already HAS a graph DB, reuse it.
If building from scratch, Redis adjacency list is simpler and faster.
```

### 2.7 Privacy Service

```mermaid
graph TB
    subgraph "Privacy Check Flow"
        REQ[Can user_456 see user_123's location?]
        C1{user_123 sharing<br/>mode?}
        C2{user_456 in<br/>allowlist?}
        C3{user_456 in<br/>blocklist?}
        ALLOW[ALLOW - Share location]
        DENY[DENY - Hide location]
    end

    REQ --> C1
    C1 -->|off| DENY
    C1 -->|all_friends| C3
    C1 -->|selected_friends| C2
    C2 -->|Yes| C3
    C2 -->|No| DENY
    C3 -->|Yes| DENY
    C3 -->|No| ALLOW

    style ALLOW fill:#6bcb77,color:#fff
    style DENY fill:#ff6b6b,color:#fff
```

**Privacy Service Implementation:**

```
Cache privacy settings in Redis for fast lookup:

Key:   privacy:{user_id}
Value: {
  "mode": "selected_friends",
  "allowlist": ["u_456", "u_789"],
  "blocklist": ["u_999"]
}
TTL:   1 hour (refresh from PostgreSQL)

Privacy check: ~0.1ms (Redis hash lookup)
Without cache:  ~5ms (PostgreSQL query)
```

### 2.8 Notification Service

```mermaid
sequenceDiagram
    participant PS as Proximity Service
    participant NS as Notification Service
    participant CR as Connection Registry<br/>(Redis)
    participant WSS as WebSocket Server
    participant Client as Mobile Client

    PS->>NS: Push to user_123:<br/>"friend_456 is 1.2km away"
    NS->>CR: HGET ws_connections user_123
    CR-->>NS: ws_server_7
    NS->>WSS: PUBLISH ws_server_7:messages<br/>{target: user_123, data: {...}}
    WSS->>Client: WebSocket frame:<br/>friend_location event

    Note over NS: If user is offline:
    NS->>NS: Check: send mobile push?
    NS->>NS: Only for "friend arrived nearby" alerts<br/>Not for every location update
```

---

## 3. End-to-End Location Update Flow

```mermaid
graph LR
    subgraph "1. Capture"
        A1[GPS/WiFi<br/>on phone]
    end

    subgraph "2. Send"
        A2[WebSocket<br/>to server]
    end

    subgraph "3. Store"
        A3[Redis:<br/>current location<br/>+ H3 cell index]
    end

    subgraph "4. Publish"
        A4[Kafka:<br/>location event]
    end

    subgraph "5. Compute"
        A5[Proximity Service:<br/>friends in nearby cells<br/>+ distance check]
    end

    subgraph "6. Push"
        A6[WebSocket push<br/>to nearby friends]
    end

    A1 --> A2 --> A3 --> A4 --> A5 --> A6

    style A1 fill:#74b9ff,color:#000
    style A2 fill:#a29bfe,color:#fff
    style A3 fill:#ff6b6b,color:#fff
    style A4 fill:#ffd93d,color:#000
    style A5 fill:#6bcb77,color:#fff
    style A6 fill:#fd79a8,color:#fff
```

**Detailed Step-by-Step:**

```
Step 1 - CAPTURE (Mobile Client)
  The phone's location manager obtains GPS coordinates.
  Battery manager decides update frequency (see battery optimization).
  Timestamp and accuracy metadata are attached.

Step 2 - SEND (WebSocket)
  Client sends location_update message over persistent WebSocket.
  If WebSocket is disconnected, queue locally and send on reconnect.
  ~100 bytes per update.

Step 3 - STORE (Location Service + Redis)
  Location Service validates coordinates.
  Computes H3 cell at resolution 7.
  Stores in Redis: loc:{user_id} with 5-min TTL.
  Updates H3 cell index if cell changed.
  Writes to Cassandra for history (async, fire-and-forget).

Step 4 - PUBLISH (Kafka)
  Location Service publishes event to Kafka topic "location_updates".
  Kafka partitioned by user_id for ordered processing.
  Multiple Proximity Service instances consume in parallel.

Step 5 - COMPUTE (Proximity Service)
  Consumes event from Kafka.
  Fetches user's friend list from Friend Graph Service.
  Applies privacy filters via Privacy Service.
  Gets k-ring of H3 cells (19 cells for k=2).
  Gets all users in those cells from Redis.
  Intersects friends set with nearby users set.
  Computes exact Haversine distance for matches.
  Filters to within 5 km radius.

Step 6 - PUSH (Notification Service + WebSocket)
  For each nearby friend found:
    Look up their WebSocket server in connection registry.
    Publish location update to that server's channel.
    WebSocket server delivers to client.
  End-to-end latency target: < 3 seconds.
```

---

## 4. H3 Hexagonal Grid -- Visual Explanation

```mermaid
graph TB
    subgraph "H3 Grid (Resolution 7)"
        direction TB
        C1["Cell 1<br/>Users: A, B"]
        C2["Cell 2<br/>Users: C"]
        C3["Cell 3<br/>Users: D, E, F"]
        C4["Cell 4 (center)<br/>Users: YOU"]
        C5["Cell 5<br/>Users: G"]
        C6["Cell 6<br/>Users: H, I"]
        C7["Cell 7<br/>Users: (empty)"]
    end

    C4 --- C1
    C4 --- C2
    C4 --- C3
    C4 --- C5
    C4 --- C6
    C4 --- C7
    C1 --- C2
    C2 --- C3
    C3 --- C5
    C5 --- C6
    C6 --- C7
    C7 --- C1

    subgraph "Query Logic"
        Q1["1. You are in Cell 4"]
        Q2["2. Get k-ring(k=1): Cells 1-7"]
        Q3["3. Users in area: A,B,C,D,E,F,G,H,I"]
        Q4["4. Your friends: B, D, H, X, Y, Z"]
        Q5["5. Intersection: B, D, H"]
        Q6["6. Haversine filter (5km): B, D"]
    end

    Q1 --> Q2 --> Q3 --> Q4 --> Q5 --> Q6
```

**H3 Resolution Selection:**

```
+------+----------------+------------------+---------------------------+
| Res   | Avg Edge (km) | Avg Area (km^2) | Use Case                  |
+------+----------------+------------------+---------------------------+
| 5     | 8.54          | 252.9            | Country-level grouping    |
| 6     | 3.23          | 36.13            | City-level grouping       |
| 7     | 1.22          | 5.16             | NEARBY FRIENDS (chosen)   |
| 8     | 0.46          | 0.74             | Block-level precision     |
| 9     | 0.17          | 0.11             | Building-level precision  |
+------+----------------+------------------+---------------------------+

Resolution 7 with k-ring k=2:
  - 19 cells queried
  - Total area: ~98 km^2
  - Covers 5km radius circle (78.5 km^2) with margin
  - Each cell: ~5 km^2, containing ~50 active users (in urban areas)
  - Total users to check per query: ~950
  - After friend intersection: ~5 matches (typical)
```

---

## 5. System Architecture -- Regional Deployment

```mermaid
graph TB
    subgraph "Region: US-East"
        LB1[Load Balancer]
        WS1_1[WS Server x30]
        LS1[Location Service x10]
        PS1[Proximity Service x20]
        R1[(Redis Cluster)]
        K1[Kafka Cluster]
    end

    subgraph "Region: EU-West"
        LB2[Load Balancer]
        WS2_1[WS Server x20]
        LS2[Location Service x8]
        PS2[Proximity Service x15]
        R2[(Redis Cluster)]
        K2[Kafka Cluster]
    end

    subgraph "Region: Asia-Pacific"
        LB3[Load Balancer]
        WS3_1[WS Server x25]
        LS3[Location Service x10]
        PS3[Proximity Service x18]
        R3[(Redis Cluster)]
        K3[Kafka Cluster]
    end

    subgraph "Global"
        DNS[GeoDNS / Anycast<br/>Route to nearest region]
        GDB[(Global PostgreSQL<br/>CockroachDB / Spanner<br/>Privacy settings)]
    end

    DNS --> LB1
    DNS --> LB2
    DNS --> LB3
    GDB --- R1
    GDB --- R2
    GDB --- R3
```

**Regional Strategy:**

```
Users are routed to the NEAREST region by GeoDNS.

Location data stays within the region:
  - US users' locations stored in US-East Redis
  - EU users' locations stored in EU-West Redis
  - GDPR compliance: EU location data never leaves EU

Cross-region friends:
  - Rare case: User A in US, friend B in EU
  - They are 5000+ km apart, never "nearby"
  - No need for cross-region location queries!
  - Only edge case: user traveling to different region
  - Solution: on region change, migrate user's active session
```

---

## 6. Data Flow Diagram

```mermaid
flowchart TD
    subgraph "Write Path (Location Update)"
        W1[Client sends GPS] --> W2[WebSocket Server]
        W2 --> W3[Location Service]
        W3 --> W4[Redis: Update loc + H3 index]
        W3 --> W5[Kafka: Publish event]
        W3 --> W6[Cassandra: History write]
    end

    subgraph "Compute Path (Proximity Check)"
        W5 --> C1[Proximity Service<br/>consumes event]
        C1 --> C2[Friend Graph: Get friends]
        C1 --> C3[Privacy: Filter allowed]
        C1 --> C4[Redis: Get users in H3 cells]
        C2 --> C5[Set Intersection:<br/>friends AND nearby users]
        C3 --> C5
        C4 --> C5
        C5 --> C6[Haversine: Exact distance]
        C6 --> C7{Within 5km?}
    end

    subgraph "Read Path (Push to Client)"
        C7 -->|Yes| R1[Notification Service]
        R1 --> R2[Lookup WS server in registry]
        R2 --> R3[WebSocket Server pushes to client]
        R3 --> R4[Client updates map pin]
    end

    C7 -->|No| SKIP[Skip - not nearby]

    style W4 fill:#ff6b6b,color:#fff
    style C5 fill:#6bcb77,color:#fff
    style R3 fill:#74b9ff,color:#000
```

---

## 7. Failure Handling

### 7.1 WebSocket Disconnection

```mermaid
sequenceDiagram
    participant Client
    participant WS as WebSocket Server
    participant Redis

    Client->>WS: Connected
    Note over Client,WS: Normal operation

    WS--xClient: Connection lost
    Note over WS: Detect disconnect (ping/pong timeout)
    WS->>Redis: Mark user as "disconnected"<br/>Keep location with 5-min TTL

    Note over Client: Exponential backoff reconnect
    Client->>WS: Reconnect (1s, 2s, 4s, 8s...)
    WS->>Redis: Mark user as "connected"
    WS->>Client: Send current nearby friends snapshot
```

### 7.2 Service Failure Matrix

| Component Fails | Impact | Mitigation |
|-----------------|--------|------------|
| WebSocket Server | Users on that server lose real-time updates | Connection registry detects; clients auto-reconnect to healthy server |
| Location Service | Location updates queue in Kafka | Kafka retains events; service catches up on recovery |
| Proximity Service | Nearby friend computation pauses | Kafka consumer lag increases; users see stale positions |
| Redis (primary) | Location reads/writes fail | Redis Sentinel auto-failover to replica in <30 sec |
| Kafka | Location events not published | Location Service writes to Redis directly; batch retry later |
| Friend Graph Service | Cannot determine friends | Cache friend lists in Proximity Service with 1-hour TTL |
| Privacy Service | Cannot enforce privacy rules | Fail CLOSED -- deny all location sharing until service recovers |

---

## 8. Capacity Planning -- Server Counts

```
+-------------------------+-------+------------------------------------------+
| Component               | Count | Sizing Rationale                         |
+-------------------------+-------+------------------------------------------+
| WebSocket Servers       | 100   | 10M conns / 100K per server              |
| Location Service        | 30    | 333K writes/sec / ~12K per instance      |
| Proximity Service       | 50    | 333K events/sec (CPU-intensive proximity) |
| Friend Graph Service    | 10    | Read-heavy, cached, fast Redis lookups   |
| Privacy Service         | 10    | Cached settings, low compute             |
| Notification Service    | 20    | 1.67M pushes/sec                         |
| Redis Cluster (location)| 6     | 480 MB data, high throughput needs       |
| Redis Cluster (WS reg)  | 3     | 10M entries, moderate throughput         |
| Kafka Brokers           | 6     | 333K msgs/sec, 3x replication           |
| Cassandra Nodes         | 9     | 1.4 TB/day writes, 3x replication       |
| PostgreSQL (privacy)    | 3     | Primary + 2 replicas, low write volume   |
| Load Balancers          | 4     | 2 active + 2 standby (per region)        |
+-------------------------+-------+------------------------------------------+
| TOTAL per region        | ~251  |                                          |
| TOTAL (3 regions)       | ~753  |                                          |
+-------------------------+-------+------------------------------------------+
```

---

## 9. Technology Stack Summary

```mermaid
graph LR
    subgraph "Client"
        iOS[iOS:<br/>Swift + CoreLocation]
        Android[Android:<br/>Kotlin + Fused Location]
    end

    subgraph "Networking"
        WS[WebSocket:<br/>Socket.IO / raw WS]
        HTTP[REST:<br/>HTTP/2]
    end

    subgraph "Backend"
        Go[Go:<br/>Location + Proximity<br/>Services]
        Node[Node.js:<br/>WebSocket Servers]
    end

    subgraph "Storage"
        Redis2[Redis 7+:<br/>Location + H3 Index<br/>+ Connection Registry]
        PG2[PostgreSQL 16:<br/>Privacy Settings]
        Cass[Cassandra 4+:<br/>Location History]
    end

    subgraph "Messaging"
        Kafka2[Apache Kafka:<br/>Location Events]
    end

    subgraph "Spatial"
        H3[Uber H3:<br/>Hexagonal Spatial Index]
    end

    subgraph "Infrastructure"
        K8s[Kubernetes:<br/>Orchestration]
        Prom[Prometheus + Grafana:<br/>Monitoring]
        DD[Datadog:<br/>APM + Tracing]
    end
```

---

## 10. Interview Talking Points for HLD

```
When presenting this design, emphasize:

1. SPATIAL INDEXING is the key insight
   "We avoid O(N) friend checks by using H3 hexagonal cells.
    Only check friends in the same + neighboring cells."

2. PUSH over PULL for real-time
   "WebSocket push is 18x more bandwidth efficient than polling
    and delivers instant updates."

3. SEPARATION OF CONCERNS
   "Location write path, proximity computation, and notification
    are decoupled via Kafka. Each can scale independently."

4. PRIVACY BY DESIGN
   "Privacy service is a hard gate -- fail closed if it's down.
    Location is never shared without explicit consent."

5. BATTERY AWARENESS
   "Client-side adaptive frequency: GPS when moving, cell tower
    when slow, stop when stationary. Server-side throttling too."
```
