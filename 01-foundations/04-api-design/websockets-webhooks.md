# WebSockets & Webhooks Deep Dive

## 1. WebSocket Lifecycle

WebSocket provides full-duplex communication over a single TCP connection. It starts as an
HTTP request and "upgrades" to the WebSocket protocol.

### 1.1 The Handshake (HTTP Upgrade)

```
Client                                    Server
  |                                         |
  |-- HTTP GET /chat HTTP/1.1 ------------->|
  |   Upgrade: websocket                    |
  |   Connection: Upgrade                   |
  |   Sec-WebSocket-Key: dGhlIHNhbXBsZQ==  |
  |   Sec-WebSocket-Version: 13            |
  |                                         |
  |<-- HTTP/1.1 101 Switching Protocols ----|
  |    Upgrade: websocket                   |
  |    Connection: Upgrade                  |
  |    Sec-WebSocket-Accept: s3pPLMBiTx...  |
  |                                         |
  |========= WebSocket Connection ==========|
  |                                         |
  |<--------- Full-Duplex Messages -------->|
  |                                         |
```

Key points:
- Starts as HTTP/1.1 GET request (port 80 or 443)
- Server responds with 101 Switching Protocols
- `Sec-WebSocket-Accept` is SHA-1 hash of client key + magic GUID (prevents proxy confusion)
- After 101, the TCP socket speaks the WebSocket frame protocol, no more HTTP

### 1.2 Frame Types

WebSocket data travels in frames. Each frame has an opcode identifying its type:

| Opcode | Type       | Purpose                                        |
|--------|------------|------------------------------------------------|
| 0x1    | Text       | UTF-8 text data (JSON, plain text)             |
| 0x2    | Binary     | Raw binary data (protobuf, images, audio)      |
| 0x8    | Close      | Initiate or acknowledge connection close        |
| 0x9    | Ping       | Heartbeat request (server/client sends)        |
| 0xA    | Pong       | Heartbeat response (automatic reply to ping)   |
| 0x0    | Continue   | Continuation of a fragmented message           |

```
Frame Structure:
+-------+-------+-------+-------+-------+-------+
| FIN   |RSV1-3 |Opcode | MASK  | Payload Len   |
| 1 bit | 3 bits| 4 bits| 1 bit | 7 bits        |
+-------+-------+-------+-------+-------+-------+
| Extended payload length (16 or 64 bits)        |
+------------------------------------------------+
| Masking key (32 bits, if MASK=1)               |
+------------------------------------------------+
| Payload data                                   |
+------------------------------------------------+

Client-to-server frames MUST be masked (security requirement).
Server-to-client frames MUST NOT be masked.
```

### 1.3 Connection Close

Either side can initiate a graceful close:

```
Client                          Server
  |                               |
  |-- Close frame (1000) ------->|  (Client initiates)
  |<-- Close frame (1000) -------|  (Server acknowledges)
  |                               |
  |====== TCP connection closed ==|
```

Close status codes:
- 1000: Normal closure
- 1001: Going away (server shutting down, page navigating away)
- 1002: Protocol error
- 1003: Unsupported data type
- 1006: Abnormal closure (no close frame received)
- 1008: Policy violation
- 1011: Unexpected server error

---

## 2. Scaling WebSockets

### 2.1 The Problem

WebSocket connections are long-lived and stateful. A user connected to Server A needs to
receive messages from Server B.

```
User Alice --> Server A (connected)
User Bob   --> Server B (connected)

Alice sends message to Bob... but Bob is on Server B!
```

### 2.2 Sticky Sessions

Route the same user to the same server using session affinity (cookie or IP hash).

```
             +-- Server A (Alice, Carol)
Load Balancer+-- Server B (Bob, Dave)
(sticky)     +-- Server C (Eve, Frank)
```

**Pros:** Simple. **Cons:** Uneven load, server failure drops all its users.

### 2.3 Redis Pub/Sub for Cross-Server Broadcast

The standard solution: use Redis (or NATS, Kafka) as a message bus between servers.

```
                     +----------+
                     |  Redis   |
                     | Pub/Sub  |
                     +----------+
                    /      |      \
             +--------+ +--------+ +--------+
             |Server A| |Server B| |Server C|
             +--------+ +--------+ +--------+
              Alice      Bob        Carol
              Dave       Eve        Frank
```

Flow:
1. Alice (on Server A) sends a message to "room_123"
2. Server A publishes to Redis channel "room:123"
3. Redis fans out to all subscribed servers (A, B, C)
4. Each server forwards the message to its locally connected room members

```javascript
// Server-side (Node.js with Socket.IO + Redis adapter)
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

const io = new Server(server);
io.adapter(createAdapter(pubClient, subClient));

// Now io.to("room_123").emit("message", data) works across all servers
```

### 2.4 Connection State Storage

For crash recovery, store connection metadata externally:

```
Redis Hash: ws:connections:{user_id}
  - server_id: "server-a-pod-3"
  - connected_at: 1704067200
  - rooms: ["room_123", "room_456"]
  - last_ping: 1704070800
```

---

## 3. Heartbeat and Reconnection Strategies

### 3.1 Heartbeat (Keep-Alive)

Detect dead connections that TCP alone might not notice (especially through proxies/NATs).

```
Server                          Client
  |                               |
  |-- Ping frame (every 30s) --->|
  |<-- Pong frame (automatic) ---|
  |                               |
  |-- Ping frame --------------->|
  |   ... no pong for 60s ...    |
  |-- Close (connection dead) -->|
```

```javascript
// Server-side heartbeat implementation
const HEARTBEAT_INTERVAL = 30000;  // 30 seconds
const HEARTBEAT_TIMEOUT = 60000;   // 60 seconds

wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();  // Dead connection
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);
```

### 3.2 Client Reconnection with Exponential Backoff

```javascript
class ReconnectingWebSocket {
  constructor(url) {
    this.url = url;
    this.baseDelay = 1000;    // 1 second
    this.maxDelay = 30000;    // 30 seconds
    this.attempt = 0;
    this.maxAttempts = 10;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.attempt = 0;  // Reset on successful connect
      // Re-subscribe to channels, send missed message ID for catch-up
    };

    this.ws.onclose = (event) => {
      if (event.code !== 1000 && this.attempt < this.maxAttempts) {
        const delay = Math.min(
          this.baseDelay * Math.pow(2, this.attempt) + Math.random() * 1000,
          this.maxDelay
        );
        this.attempt++;
        console.log(`Reconnecting in ${delay}ms (attempt ${this.attempt})`);
        setTimeout(() => this.connect(), delay);
      }
    };
  }
}
```

Reconnection timeline:
```
Attempt 1:  ~1s   delay
Attempt 2:  ~2s   delay
Attempt 3:  ~4s   delay
Attempt 4:  ~8s   delay
Attempt 5:  ~16s  delay
Attempt 6+: ~30s  delay (capped)
+ random jitter to prevent thundering herd
```

---

## 4. WebSocket Security

### 4.1 Use WSS (WebSocket Secure)

Always use `wss://` (TLS) in production. Never `ws://`. This is the equivalent of HTTPS.

### 4.2 Origin Checking

Prevent cross-site WebSocket hijacking by validating the Origin header during handshake.

```javascript
const wss = new WebSocket.Server({
  server,
  verifyClient: (info) => {
    const origin = info.origin;
    const allowed = ['https://myapp.com', 'https://staging.myapp.com'];
    return allowed.includes(origin);
  }
});
```

### 4.3 Authentication in Handshake

Since WebSocket frames don't carry headers after the initial handshake, authenticate
during the upgrade:

```javascript
// Option 1: Token in query parameter (less secure, logged in URLs)
const ws = new WebSocket('wss://api.example.com/ws?token=jwt_here');

// Option 2: Token in first message after connect (slight delay)
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: 'jwt_here' }));
};

// Option 3: Cookie-based (if same-origin)
// Cookie is sent automatically in the HTTP upgrade request

// Server-side validation
wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  const user = verifyJWT(token);
  if (!user) {
    ws.close(4001, 'Unauthorized');
    return;
  }
  ws.userId = user.id;
});
```

### 4.4 Rate Limiting Messages

Prevent a single client from flooding the server:

```javascript
const MESSAGE_LIMIT = 100;       // Max messages per window
const WINDOW_MS = 60 * 1000;     // 1-minute window

ws.messageCount = 0;
ws.windowStart = Date.now();

ws.on('message', (data) => {
  const now = Date.now();
  if (now - ws.windowStart > WINDOW_MS) {
    ws.messageCount = 0;
    ws.windowStart = now;
  }

  ws.messageCount++;
  if (ws.messageCount > MESSAGE_LIMIT) {
    ws.close(4029, 'Rate limit exceeded');
    return;
  }
  // Process message...
});
```

---

## 5. Webhooks: Event Notification Pattern

Webhooks are HTTP callbacks -- when an event occurs, the source makes an HTTP POST to a
URL you registered.

```
Traditional Polling:                    Webhooks:

Client                Server            Source           Your Server
  |-- GET /status? --->|                  |                    |
  |<-- no change ------|                  |-- Event occurs     |
  |-- GET /status? --->|                  |                    |
  |<-- no change ------|                  |-- POST /webhook -->|
  |-- GET /status? --->|                  |   { event data }   |
  |<-- changed! -------|                  |<-- 200 OK ---------|
  (wasteful polling)                      (push on demand)
```

### 5.1 Webhook Registration

```json
// POST /webhooks/subscriptions
{
  "url": "https://myapp.com/webhooks/stripe",
  "events": ["payment.completed", "payment.failed", "refund.created"],
  "secret": "whsec_...",
  "active": true
}

// Response
{
  "id": "wh_sub_123",
  "url": "https://myapp.com/webhooks/stripe",
  "events": ["payment.completed", "payment.failed", "refund.created"],
  "signing_secret": "whsec_abc123...",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### 5.2 Webhook Payload Format

```json
// POST https://myapp.com/webhooks/stripe
// Headers:
//   Content-Type: application/json
//   X-Webhook-ID: evt_abc123
//   X-Webhook-Timestamp: 1704067200
//   X-Webhook-Signature: sha256=5257a869e...

{
  "id": "evt_abc123",
  "type": "payment.completed",
  "created_at": "2025-01-15T10:00:00Z",
  "data": {
    "payment_id": "pay_xyz",
    "amount": 9999,
    "currency": "usd",
    "customer_id": "cus_456"
  }
}
```

### 5.3 Retry Policy: Exponential Backoff

When the consumer returns a non-2xx response (or times out), the provider retries:

```
Attempt 1: Immediate
Attempt 2: 1 minute later
Attempt 3: 5 minutes later
Attempt 4: 30 minutes later
Attempt 5: 2 hours later
Attempt 6: 8 hours later
Attempt 7: 24 hours later  (final attempt)

If all retries fail:
  - Mark webhook subscription as "failing"
  - Send email notification to the developer
  - After N consecutive failures, disable the subscription
```

Provider-side implementation:
```python
import time, requests

MAX_RETRIES = 7
BACKOFF_SCHEDULE = [0, 60, 300, 1800, 7200, 28800, 86400]  # seconds

def deliver_webhook(url, payload, secret, attempt=0):
    signature = compute_signature(payload, secret)
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-ID": payload["id"],
        "X-Webhook-Signature": f"sha256={signature}",
        "X-Webhook-Timestamp": str(int(time.time()))
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code < 300:
            return True  # Success
    except requests.Timeout:
        pass  # Treat timeout as failure

    if attempt < MAX_RETRIES:
        delay = BACKOFF_SCHEDULE[min(attempt, len(BACKOFF_SCHEDULE) - 1)]
        schedule_retry(url, payload, secret, attempt + 1, delay)
    else:
        mark_subscription_failing(url)

    return False
```

### 5.4 Signature Verification (HMAC-SHA256)

The provider signs the payload so the consumer can verify the webhook is authentic and
untampered.

```
Signing process:
  signature = HMAC-SHA256(secret, timestamp + "." + payload_body)
```

Provider (signing):
```python
import hmac, hashlib, json, time

def compute_signature(payload_body, secret, timestamp):
    message = f"{timestamp}.{payload_body}"
    return hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
```

Consumer (verification):
```python
from flask import Flask, request, abort
import hmac, hashlib, time

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_abc123..."

@app.route('/webhooks/stripe', methods=['POST'])
def handle_webhook():
    # 1. Extract signature and timestamp from headers
    signature = request.headers.get('X-Webhook-Signature', '').replace('sha256=', '')
    timestamp = request.headers.get('X-Webhook-Timestamp', '')

    # 2. Reject old timestamps (prevent replay attacks -- 5 min tolerance)
    if abs(time.time() - int(timestamp)) > 300:
        abort(400, "Timestamp too old")

    # 3. Compute expected signature
    payload_body = request.get_data(as_text=True)
    expected = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        f"{timestamp}.{payload_body}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # 4. Constant-time comparison (prevent timing attacks)
    if not hmac.compare_digest(signature, expected):
        abort(401, "Invalid signature")

    # 5. Process the event
    event = request.get_json()
    process_event(event)

    return '', 200
```

### 5.5 Idempotency for Webhook Consumers

Webhooks may be delivered more than once (retries, provider bugs). Consumers MUST be
idempotent.

```python
def process_event(event):
    event_id = event["id"]

    # Check if already processed (using Redis or DB)
    if redis.sismember("processed_webhooks", event_id):
        return  # Already handled, skip

    # Process the event
    if event["type"] == "payment.completed":
        fulfill_order(event["data"]["payment_id"])

    # Mark as processed (with TTL for cleanup)
    redis.sadd("processed_webhooks", event_id)
    redis.expire(f"processed_webhooks", 7 * 86400)  # 7 days
```

---

## 6. Sub-Protocols: STOMP and MQTT over WebSocket

### 6.1 STOMP (Simple Text Oriented Messaging Protocol)

A text-based messaging protocol that can run over WebSocket. Used with message brokers
like RabbitMQ and ActiveMQ.

```
Client                  STOMP Broker (via WS)
  |                          |
  |-- CONNECT -------------->|
  |<-- CONNECTED ------------|
  |                          |
  |-- SUBSCRIBE              |
  |   destination:/topic/chat|
  |<-- MESSAGE               |
  |   destination:/topic/chat|
  |   body: "Hello"          |
  |                          |
  |-- SEND                   |
  |   destination:/topic/chat|
  |   body: "Hi back"        |
  |                          |
  |-- DISCONNECT ----------->|
```

Use cases: Enterprise messaging, apps already using RabbitMQ, message acknowledgment
requirements.

### 6.2 MQTT over WebSocket

MQTT is a lightweight pub/sub protocol designed for IoT. Running over WebSocket lets
browsers participate.

```
Browser (MQTT.js) ----[WebSocket]----> MQTT Broker (Mosquitto)
                                            |
IoT Sensor ----[native MQTT/TCP]------------|
Mobile App ----[native MQTT/TCP]------------|
```

Key MQTT concepts:
- **QoS 0:** At most once (fire and forget)
- **QoS 1:** At least once (acknowledged delivery)
- **QoS 2:** Exactly once (4-step handshake)
- **Retained messages:** Broker stores last message per topic
- **Last Will:** Broker publishes a message when client disconnects ungracefully

Use cases: IoT dashboards in browsers, real-time sensor monitoring, low-bandwidth mobile
apps.

---

## 7. WebSocket vs Alternatives Comparison

| Feature              | WebSocket      | SSE (EventSource) | Long Polling     | gRPC Stream    |
|----------------------|----------------|--------------------|------------------|----------------|
| Direction            | Bidirectional  | Server -> Client   | Server -> Client | Bidirectional  |
| Protocol             | WS/WSS         | HTTP/1.1           | HTTP/1.1         | HTTP/2         |
| Browser support      | All modern     | All modern         | All              | Via gRPC-Web   |
| Auto-reconnect       | Manual         | Built-in           | Manual           | Manual         |
| Binary data          | Yes            | No (text only)     | Yes (in JSON)    | Yes (protobuf) |
| Overhead per message | 2-14 bytes     | ~50 bytes (SSE)    | Full HTTP headers| Low (HTTP/2)   |
| Through proxies      | Tricky         | Easy               | Easy             | Needs L7       |
| Scaling complexity   | High           | Medium             | Low              | High           |

### Decision Guide

```
Need bidirectional real-time?
  YES --> WebSocket (or gRPC bidi streaming for internal services)
  NO  --> Need server push only?
            YES --> SSE (simpler, auto-reconnect, works through proxies)
            NO  --> REST with polling (simplest, most scalable)
```

---

## Quick Reference Card

```
WebSocket Cheat Sheet
======================
Handshake:  HTTP GET with Upgrade: websocket --> 101 Switching Protocols
Frames:     text(0x1), binary(0x2), close(0x8), ping(0x9), pong(0xA)
Security:   WSS only, verify Origin, auth in handshake, rate limit messages
Scaling:    Redis/NATS pub/sub for cross-server broadcast
Heartbeat:  Ping/Pong every 30s, terminate if no pong in 60s
Reconnect:  Exponential backoff with jitter, cap at 30s

Webhook Cheat Sheet
====================
Pattern:    Event source --> HTTP POST --> your registered URL
Security:   HMAC-SHA256 signature verification + timestamp check
Retries:    Exponential backoff (1m, 5m, 30m, 2h, 8h, 24h)
Consumer:   MUST be idempotent (deduplicate by event ID)
Response:   Return 200 quickly, process async (queue the work)
```
