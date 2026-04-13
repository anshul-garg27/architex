# Real-Time Communication Protocols

---

## Short Polling

### How It Works

Client repeatedly sends HTTP requests at fixed intervals to check for updates.

```
Client                              Server
  |                                    |
  |  GET /messages?since=100  -------> |
  |  <------- 200 OK (no new data) -- |
  |                                    |
  |       (wait 5 seconds)            |
  |                                    |
  |  GET /messages?since=100  -------> |
  |  <------- 200 OK (no new data) -- |
  |                                    |
  |       (wait 5 seconds)            |
  |                                    |
  |  GET /messages?since=100  -------> |
  |  <------- 200 OK [{id:101,...}] -- |   (new data!)
  |                                    |
  |       (wait 5 seconds)            |
  |                                    |
  |  GET /messages?since=101  -------> |
  ...
```

### Pros
- Dead simple to implement (standard HTTP, any server)
- Works through all firewalls/proxies
- Stateless server -- no connection tracking
- Easy to scale horizontally (any server handles any request)

### Cons
- Wasteful: most responses are empty (especially low-update-frequency data)
- Latency: average delay = polling_interval / 2
- Server load: N clients x polls/minute = high request rate for no data
- Trade-off between latency and server load (faster polling = more waste)

### When to Use
- Simple dashboards with low update frequency (every 30-60s)
- MVP/prototypes where simplicity matters most
- When you have very few concurrent clients (<100)
- Checking status of long-running jobs

---

## Long Polling

### How It Works

Client sends request. Server **holds the connection open** until new data is available or a timeout is reached.

```
Client                              Server
  |                                    |
  |  GET /messages?since=100  -------> |
  |          (server holds connection  |
  |           for up to 30 seconds)    |
  |                                    |
  |    ... 15 seconds pass ...         |
  |                                    |
  |  <-- 200 OK [{id:101,...}] ------- |   (new data arrived!)
  |                                    |
  |  GET /messages?since=101  -------> |   (immediately reconnect)
  |          (server holds again)      |
  |                                    |
  |    ... 30 seconds pass ...         |
  |                                    |
  |  <-- 204 No Content -------------- |   (timeout, no data)
  |                                    |
  |  GET /messages?since=101  -------> |   (reconnect)
  ...
```

### Pros
- Near real-time delivery (data sent as soon as it exists)
- Less wasteful than short polling (no empty responses during active periods)
- Works through firewalls/proxies (standard HTTP)
- Simpler than WebSockets

### Cons
- Server must hold many open connections (resource-intensive)
- Thundering herd: if all clients reconnect simultaneously (after a broadcast)
- Still has overhead per "cycle" (HTTP headers on every reconnection)
- Difficult to scale: load balancers need long timeout configs, sticky sessions help
- Unidirectional: server-to-client only; client-to-server still requires separate requests

### When to Use
- Chat applications (early approach, before WebSockets were ubiquitous)
- Notification systems with moderate update frequency
- When WebSockets are not available (restrictive environments)
- Real-time features on legacy infrastructure

---

## WebSockets

### Handshake (HTTP Upgrade)

WebSocket connections start as HTTP, then upgrade:

```
Client                                   Server
  |                                         |
  |  GET /chat HTTP/1.1                     |
  |  Host: server.example.com              |
  |  Upgrade: websocket                     |
  |  Connection: Upgrade                    |
  |  Sec-WebSocket-Key: dGhlIHNhbXBsZQ==   |
  |  Sec-WebSocket-Version: 13             |
  |  ---------------------------------------->
  |                                         |
  |  HTTP/1.1 101 Switching Protocols       |
  |  Upgrade: websocket                     |
  |  Connection: Upgrade                    |
  |  Sec-WebSocket-Accept: s3pPLMBiTxaQ9k.. |
  |  <----------------------------------------
  |                                         |
  |  ======= Full-Duplex Connection =======  |
  |                                         |
  |  <-- Server: {"type":"msg","text":"Hi"} |
  |  --> Client: {"type":"msg","text":"Hey"}|
  |  <-- Server: {"type":"typing",...}      |
  |  --> Client: {"type":"msg","text":"OK"} |
  |                                         |
```

### Frame Types
- **Text frames:** UTF-8 encoded messages
- **Binary frames:** Raw binary data (images, protobuf)
- **Ping/Pong frames:** Keepalive heartbeats (detect dead connections)
- **Close frame:** Graceful connection shutdown

### Scaling Challenges

**Problem: Horizontal Scaling**
```
                   Load Balancer
                   /     |     \
               Server1  Server2  Server3
               User A   User B   User C
               User D   User E   User F

User A sends message to User B.
User A is on Server1, User B is on Server2.
How does Server1 deliver to User B?
```

**Solution 1: Sticky Sessions**
Route each user to the same server. Load balancer uses a cookie or IP hash. Problem: uneven load, difficult failover.

**Solution 2: Redis Pub/Sub (Standard Approach)**
```
Server1 (User A)                Redis               Server2 (User B)
     |                            |                        |
     |  User A sends msg          |                        |
     |  PUBLISH chat:room1 msg -> |                        |
     |                            | -> SUBSCRIBE chat:room1|
     |                            |    delivers msg ------>|
     |                            |                 push to User B
```

**Solution 3: Dedicated Message Broker**
Use Kafka, NATS, or RabbitMQ for cross-server message routing. Better durability and ordering than Redis Pub/Sub.

### Reconnection Strategy

Connections will drop. A robust client must:
1. Detect disconnection (onclose/onerror events + missed pong)
2. Reconnect with **exponential backoff** (1s, 2s, 4s, 8s, ... cap at 30s)
3. Add **jitter** to prevent thundering herd (random 0-1s added)
4. Resume from last seen message ID (not timestamp -- clocks drift)
5. Buffer outgoing messages during disconnect, send after reconnection

### When to Use
- Chat/messaging (Slack, Discord, WhatsApp Web)
- Real-time collaborative editing (Google Docs, Figma)
- Live dashboards with frequent updates (trading, monitoring)
- Multiplayer games (state sync)
- Any bidirectional, high-frequency real-time communication

---

## Server-Sent Events (SSE)

### How It Works

One-way persistent connection from server to client over HTTP:

```
Client                              Server
  |                                    |
  |  GET /events                       |
  |  Accept: text/event-stream         |
  |  --------------------------------> |
  |                                    |
  |  HTTP/1.1 200 OK                   |
  |  Content-Type: text/event-stream   |
  |  Connection: keep-alive            |
  |  <-------------------------------- |
  |                                    |
  |  data: {"price": 150.25}           |
  |  <-------------------------------- |
  |                                    |
  |  data: {"price": 150.30}           |
  |  <-------------------------------- |
  |                                    |
  |  event: alert                      |
  |  data: {"msg": "Price spike!"}     |
  |  <-------------------------------- |
  ...
```

### Key Features
- **Standard HTTP:** Works through proxies, CDNs, load balancers
- **Auto-reconnect:** Browser's `EventSource` API automatically reconnects on disconnect
- **Last-Event-ID:** Server sends event IDs; on reconnect, client sends `Last-Event-ID` header for resumption
- **Named events:** `event: type` field allows multiple event types on one stream
- **Text-only:** No binary data (use Base64 encoding as workaround)

### SSE vs WebSocket

| Feature            | SSE                        | WebSocket                  |
|--------------------|----------------------------|----------------------------|
| Direction          | Server to client only       | Bidirectional              |
| Protocol           | HTTP                       | WS (upgraded from HTTP)    |
| Reconnection       | Automatic (built-in)       | Manual (you implement)     |
| Binary data        | No (text only)             | Yes                        |
| Browser support    | All modern (no IE)         | All modern                 |
| Proxy/firewall     | Excellent (just HTTP)      | Sometimes blocked          |
| Max connections     | 6 per domain (HTTP/1.1)   | No protocol limit          |
| Scaling            | Simple (stateless HTTP)    | Complex (stateful)         |

### When to Use SSE
- Live feeds: news, social media, stock tickers
- Notification streams (server pushes alerts)
- Real-time dashboards where client only reads data
- Log/event streaming to browser
- Any use case where data flows in one direction (server to client)

---

## WebRTC (Web Real-Time Communication)

### Architecture

WebRTC enables **peer-to-peer** communication directly between browsers:

```
                    Signaling Server
                   (WebSocket/HTTP)
                    /            \
          Offer/Answer         Offer/Answer
          SDP exchange         SDP exchange
                  /                \
           Browser A  <-------->  Browser B
             (Peer)   Direct P2P   (Peer)
                      Audio/Video
                        Data
```

### Connection Process

1. **Signaling:** Peers exchange session descriptions (SDP) via a signaling server (your server, using WebSocket/HTTP). WebRTC does NOT define the signaling protocol.

2. **ICE Candidate Gathering:** Each peer discovers its network addresses:
   - **Host candidates:** Local IP addresses
   - **Server reflexive:** Public IP from STUN server
   - **Relay:** TURN server address (fallback)

3. **STUN (Session Traversal Utilities for NAT):**
   ```
   Browser ---> STUN Server: "What's my public IP?"
   STUN Server ---> Browser: "You're at 203.0.113.5:54321"
   ```
   Free, lightweight. Helps peers behind NAT discover their public address.

4. **TURN (Traversal Using Relays around NAT):**
   ```
   Browser A ---> TURN Server ---> Browser B
   ```
   Relay fallback when direct P2P fails (~15% of connections). Expensive (relays all media traffic).

5. **ICE (Interactive Connectivity Establishment):** Tries all candidate pairs (host, STUN, TURN) and picks the best working path.

### When to Use
- Video/audio calls (Zoom, Google Meet, Discord)
- Screen sharing
- Peer-to-peer file transfer
- Low-latency game streaming
- Any use case requiring direct browser-to-browser communication

---

## WebTransport

### What It Is

WebTransport is a next-generation protocol built on **HTTP/3 (QUIC)** that provides:
- Bidirectional streams (like WebSocket but better)
- Unreliable datagrams (like UDP from the browser)
- Multiplexed streams without HOL blocking

```
+-------------------+
|   WebTransport    |
+-------------------+
|     HTTP/3        |
+-------------------+
|     QUIC          |
+-------------------+
|     UDP           |
+-------------------+
```

### WebTransport vs WebSocket

| Feature              | WebSocket          | WebTransport           |
|----------------------|--------------------|------------------------|
| Transport            | TCP                | QUIC (UDP)             |
| HOL blocking         | Yes                | No                     |
| Unreliable messages  | No                 | Yes (datagrams)        |
| Multiple streams     | No (1 stream)      | Yes (multiplexed)      |
| Connection setup     | 1+ RTT             | 0-1 RTT                |
| Server support       | Mature             | Emerging               |

### When to Use
- Real-time gaming in browser (unreliable datagrams for position updates)
- Live streaming with mixed reliability requirements
- When you need both reliable and unreliable channels simultaneously
- Future replacement for WebSocket in latency-sensitive applications

---

## MQTT (Message Queuing Telemetry Transport)

### What It Is

Lightweight publish/subscribe messaging protocol designed for constrained devices and unreliable networks.

```
IoT Device A --publish--> [MQTT Broker] --deliver--> Subscriber 1
IoT Device B --publish-->                --deliver--> Subscriber 2
IoT Device C --publish-->                --deliver--> Subscriber 3
```

### Key Properties
- **Tiny overhead:** 2-byte minimum header (vs HTTP's ~hundreds of bytes)
- **QoS levels:** 0 (at most once), 1 (at least once), 2 (exactly once)
- **Retained messages:** Broker stores last message per topic for new subscribers
- **Last Will and Testament (LWT):** Broker publishes a configured message if client disconnects unexpectedly
- **Topic hierarchy:** `home/livingroom/temperature` with wildcard subscriptions (`home/+/temperature`, `home/#`)

### When to Use
- IoT sensor data collection
- Home automation
- Mobile push notifications (Facebook Messenger used MQTT)
- Vehicle fleet tracking
- Any low-bandwidth, high-latency, unreliable network scenario

---

## Giant Comparison Table

| Feature          | Short Poll   | Long Poll    | WebSocket    | SSE           | WebRTC       | WebTransport | MQTT         |
|------------------|-------------|-------------|-------------|---------------|-------------|-------------|-------------|
| Direction        | Client->Srv | Srv->Client | Bidirect.   | Srv->Client   | P2P Bidirect| Bidirect.   | Pub/Sub     |
| Latency          | High        | Medium      | Low         | Low           | Lowest      | Low         | Low         |
| Connection       | New each    | Held open   | Persistent  | Persistent    | P2P direct  | Persistent  | Persistent  |
| Protocol         | HTTP        | HTTP        | WS over TCP | HTTP          | UDP/SRTP    | HTTP/3 QUIC | TCP (custom)|
| Binary support   | Yes         | Yes         | Yes         | No (text)     | Yes         | Yes         | Yes         |
| Browser support  | All         | All         | All modern  | All modern*   | All modern  | Chrome/Edge | No (native) |
| Auto-reconnect   | N/A         | Manual      | Manual      | Built-in      | Complex     | Manual      | Built-in    |
| Scaling ease     | Easy        | Medium      | Hard        | Medium        | N/A (P2P)   | Medium      | Medium      |
| Firewall safe    | Yes         | Yes         | Usually     | Yes           | Sometimes   | Sometimes   | Usually     |
| Server state     | Stateless   | Stateful    | Stateful    | Stateful      | Minimal     | Stateful    | Stateful    |
| Typical use      | Dashboards  | Notifs      | Chat/Games  | Feeds/Alerts  | Video calls | Games/Media | IoT         |

*SSE: Not supported in IE. 6-connection limit on HTTP/1.1 (solved with HTTP/2).

---

## Decision Guide: Which Protocol for Which Use Case?

```
Need real-time updates?
  |
  No --> Use standard REST API with caching
  |
  Yes --> Need bidirectional communication?
            |
            No --> How frequent are updates?
            |       |
            |       Rare (< 1/min) --> Short Polling
            |       |
            |       Frequent (> 1/min) --> SSE
            |
            Yes --> Is it peer-to-peer?
                      |
                      Yes --> Is it audio/video?
                      |        |
                      |        Yes --> WebRTC
                      |        No  --> WebRTC DataChannel or WebTransport
                      |
                      No --> How latency-sensitive?
                              |
                              Very (<50ms, gaming) --> WebTransport (or WebSocket)
                              |
                              Normal (chat, collab) --> WebSocket
```

### System Design Quick Reference

| Use Case                    | Best Choice      | Why                                         |
|-----------------------------|------------------|---------------------------------------------|
| Chat application            | WebSocket        | Bidirectional, low latency, persistent      |
| Live sports scores          | SSE              | Server-to-client, auto-reconnect            |
| Video conferencing          | WebRTC           | P2P, low latency, built-in media handling   |
| Stock ticker                | SSE or WebSocket | SSE if read-only, WS if also sending orders |
| Online multiplayer game     | WebTransport/WS  | Unreliable datagrams for position, reliable for chat |
| IoT sensor monitoring       | MQTT             | Lightweight, works on constrained devices   |
| Notification bell           | SSE              | One-way, infrequent, auto-reconnect         |
| Collaborative document      | WebSocket        | Bidirectional, ordered operations           |
| Order status tracking       | Long Polling/SSE | Infrequent updates, simple infrastructure   |
| Live auction bidding        | WebSocket        | Bidirectional, time-critical                |

---

## Interview Questions

1. **"Design a notification system for 10M concurrent users. What protocol?"**
   SSE for delivery (one-way, auto-reconnect, stateless-friendly). Fan out via message broker (Kafka). Each server subscribes to relevant partitions. Clients connect to any server via SSE. On disconnect, client reconnects with `Last-Event-ID`. Store notifications in DB so offline users see them on next login.

2. **"You're designing Slack. Why WebSockets over SSE?"**
   Slack needs bidirectional communication: sending messages, typing indicators, presence updates, reactions -- all from client to server in real-time. SSE is server-to-client only. WebSocket provides full-duplex on a single connection. Scale with Redis Pub/Sub for cross-server message delivery.

3. **"Your WebSocket server can't handle more than 50K connections. How do you scale?"**
   Each OS has a file descriptor limit (default ~1024, tune to 100K+). Use connection-aware load balancing. Add servers horizontally. Use Redis Pub/Sub or NATS for cross-server messaging. Consider sticky sessions at the LB. Monitor memory per connection (~10-50KB each). 50K connections at 50KB = ~2.5GB RAM.

4. **"Why does Google Meet use WebRTC but Twitch uses different tech?"**
   Google Meet: small group, bidirectional, low latency required -- P2P WebRTC is ideal (with SFU for larger groups). Twitch: one-to-many broadcast, viewers don't send video back -- HLS/DASH over HTTP is better (CDN-cacheable, scales to millions). Different problems require different protocols.

5. **"Your long-polling endpoint sometimes returns stale data. Why?"**
   Likely a caching proxy or CDN between client and server caching the long-poll response. Fix: add `Cache-Control: no-store` headers. Also check: load balancer timeout may be shorter than long-poll timeout (LB closes connection, client retries, misses events). Use unique request IDs and last-seen cursors.

6. **"Design real-time collaborative editing like Google Docs. What protocols and data structures?"**
   WebSocket for real-time bidirectional sync. Use CRDTs (Conflict-free Replicated Data Types) or OT (Operational Transformation) for conflict resolution. Each keystroke becomes an operation sent via WebSocket. Server applies OT/CRDT merge logic and broadcasts to other editors. Cursor positions sent as separate low-priority messages.
