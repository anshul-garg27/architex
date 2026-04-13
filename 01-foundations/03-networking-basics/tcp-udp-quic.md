# Transport Layer Protocols: TCP, UDP, and QUIC

---

## OSI Model (System Design Focus)

```
Layer 7 - Application    HTTP, gRPC, WebSocket, DNS       <-- You design here
Layer 6 - Presentation   TLS/SSL, encoding, compression
Layer 5 - Session        Session management, sockets
Layer 4 - Transport      TCP, UDP, QUIC                   <-- This document
Layer 3 - Network        IP, routing, ICMP
Layer 2 - Data Link      Ethernet, MAC addresses
Layer 1 - Physical       Cables, radio, fiber
```

**For system design interviews, you only need to deeply understand L4 (Transport) and L7 (Application).** Everything else is abstracted away by the OS and cloud providers.

- **L4 decides:** How data gets there reliably (or not). Connection-oriented vs connectionless.
- **L7 decides:** What the data means. Request/response semantics, encoding, routing.

---

## TCP Deep Dive

### Three-Way Handshake

Every TCP connection begins with a handshake that costs **1 RTT** before any data flows:

```
Client                          Server
  |                                |
  |  ----  SYN (seq=100)  ---->   |   Client picks initial sequence number
  |                                |
  |  <-- SYN-ACK (seq=300,        |   Server picks its own sequence number
  |       ack=101)  --------      |   and acknowledges client's
  |                                |
  |  ----  ACK (ack=301)   ---->  |   Client acknowledges server's
  |                                |
  |  ==== Connection Open ====    |   Data can now flow (1 RTT elapsed)
  |                                |
```

**Cost:** 1 RTT (~50-150ms cross-region) before any data. TLS adds 1-2 more RTTs on top.

### Connection Teardown (Four-Way)

```
Client                          Server
  |  ---- FIN  ---->              |
  |  <--- ACK  -----             |   Server may still send data
  |  <--- FIN  -----             |   Server done sending
  |  ---- ACK  ---->              |
  |   (TIME_WAIT 2*MSL)          |   Client waits ~60s before freeing port
```

**TIME_WAIT matters in system design:** A server handling thousands of short-lived connections can exhaust ephemeral ports. Solution: connection pooling, `SO_REUSEADDR`.

### Reliability and Ordering

TCP guarantees **in-order, exactly-once delivery**:

- **Sequence numbers:** Every byte gets a sequence number. Receiver reassembles in order.
- **Acknowledgments:** Receiver ACKs each segment. Sender retransmits if no ACK within timeout.
- **Checksums:** Detects bit-level corruption in transit.
- **Duplicate detection:** Sequence numbers prevent processing the same data twice.

### Flow Control (Receiver-Side)

Prevents a fast sender from overwhelming a slow receiver.

```
Sender                                    Receiver
  |                                          |
  |  --- Data (1000 bytes) --->              |
  |  <-- ACK, Window=4000 ---               |  "I can handle 4000 more bytes"
  |  --- Data (4000 bytes) --->              |
  |  <-- ACK, Window=1000 ---               |  "Slow down, only 1000 bytes now"
  |  --- Data (1000 bytes) --->              |
  |  <-- ACK, Window=8000 ---               |  "OK, I caught up, go faster"
```

**Receive Window (rwnd):** Receiver advertises how many bytes it can buffer. Sender never exceeds this.

**Window Scaling (RFC 7323):** Original TCP header has 16-bit window field (max 64KB). Window scaling option allows windows up to 1GB -- essential for high-bandwidth, high-latency links (e.g., cross-continent transfers).

### Congestion Control (Network-Side)

Prevents senders from overwhelming the **network** (routers, links).

**Congestion Window (cwnd):** Sender-side limit on unacknowledged data. Effective window = min(cwnd, rwnd).

**Phase 1 -- Slow Start:**
```
cwnd: 1 -> 2 -> 4 -> 8 -> 16 -> ... (exponential growth)
         Doubles every RTT until ssthresh or packet loss
```

**Phase 2 -- Congestion Avoidance (AIMD):**
```
After hitting ssthresh:
  - Additive Increase: cwnd += 1 MSS per RTT (linear growth)
  - Multiplicative Decrease: on loss, cwnd = cwnd / 2
```

**Why this matters in system design:**
- New TCP connections start slow. A fresh connection to a CDN takes multiple RTTs to ramp up. This is why **persistent connections** and **connection pooling** are critical.
- Tail latency spikes often come from congestion-induced packet loss and retransmission.

### Nagle's Algorithm

Buffers small writes and coalesces them into larger segments to reduce overhead.

- **Problem it solves:** Sending 1-byte payloads with 40-byte headers is wasteful.
- **Problem it creates:** Adds latency for real-time apps (e.g., mouse movements, keystrokes).
- **Solution:** `TCP_NODELAY` socket option disables Nagle's. Used by almost all modern servers.

### TCP Head-of-Line Blocking

If packet 3 out of 5 is lost, the receiver **must wait** for packet 3 to be retransmitted before delivering packets 4 and 5 to the application -- even if they already arrived. This is TCP's fundamental limitation for multiplexed protocols.

---

## UDP (User Datagram Protocol)

### Properties

| Property       | UDP                                    |
|----------------|----------------------------------------|
| Connection     | Connectionless -- no handshake         |
| Reliability    | None -- packets can be lost            |
| Ordering       | None -- packets can arrive out of order|
| Overhead       | 8-byte header (vs TCP's 20+)          |
| Speed          | Fastest possible -- fire and forget    |

### UDP Packet Structure

```
 0      7 8     15 16    23 24    31
+--------+--------+--------+--------+
|  Src Port       |  Dst Port       |
+--------+--------+--------+--------+
|  Length          |  Checksum       |
+--------+--------+--------+--------+
|          Data (payload)            |
+------------------------------------+
```

### When UDP Makes Sense

- **DNS:** Single request/response. Retransmit at app level if lost. TCP fallback for large responses.
- **Video/Audio Streaming:** Losing a frame is better than stalling for retransmission.
- **Gaming:** Need latest position update, not the one from 200ms ago.
- **VoIP:** Dropped audio packet is imperceptible. Delayed packet causes jitter.
- **IoT Telemetry:** High volume, low value per packet. Lost reading is fine.

**Key insight:** UDP doesn't mean "unreliable application." It means you build reliability at the application layer, choosing exactly the guarantees you need.

---

## QUIC Protocol

QUIC is a modern transport protocol built by Google, standardized as RFC 9000, and used as the foundation for HTTP/3.

### Architecture

```
+---------------------------+
|      HTTP/3 (L7)          |
+---------------------------+
|      QUIC (L4-ish)        |   <-- Runs in userspace, not kernel
|  +---------------------+  |
|  | TLS 1.3 (built-in)  |  |
|  +---------------------+  |
|  | Streams + Reliability|  |
|  +---------------------+  |
+---------------------------+
|      UDP (L4)             |   <-- Actual transport
+---------------------------+
|      IP (L3)              |
+---------------------------+
```

### Key Features

**1. 0-RTT Connection Establishment**
```
Traditional TCP + TLS:                QUIC:
  TCP SYN         (1 RTT)             QUIC Initial + TLS
  TCP SYN-ACK                          + 0-RTT data     (0 RTT for resumption)
  TLS ClientHello (1 RTT)             Server response   (1 RTT for new)
  TLS ServerHello
  Data             (2-3 RTT total)    Data              (0-1 RTT total)
```

**2. No Head-of-Line Blocking**

QUIC multiplexes independent streams. Loss on Stream A does NOT block Stream B:
```
TCP:   [A1][B1][A2][B2] -- if A2 lost, B2 waits too
QUIC:  Stream A: [A1][A2*] -- only A waits for retransmit
       Stream B: [B1][B2]  -- B continues unblocked
```

**3. Connection Migration**

TCP connections are identified by (src IP, src port, dst IP, dst port). Change networks = broken connection. QUIC uses a **Connection ID**, so switching from WiFi to cellular continues seamlessly.

**4. Built-in Encryption**

TLS 1.3 is mandatory and integrated. Even packet headers are authenticated. No unencrypted QUIC exists.

---

## TCP vs UDP vs QUIC Comparison

| Feature               | TCP              | UDP              | QUIC                |
|-----------------------|------------------|------------------|---------------------|
| Connection setup      | 1 RTT            | 0 RTT            | 0-1 RTT             |
| + TLS setup           | +1-2 RTT         | N/A (no TLS)     | Included in 0-1 RTT |
| Reliability           | Full             | None             | Full (per-stream)   |
| Ordering              | Total order      | None             | Per-stream order     |
| HOL blocking          | Yes              | No               | No (across streams) |
| Encryption            | Optional (TLS)   | Optional (DTLS)  | Mandatory (TLS 1.3) |
| Connection migration  | No               | N/A              | Yes                 |
| Multiplexing          | No (1 stream)    | N/A              | Native streams      |
| Congestion control    | Kernel-managed   | None             | Userspace, pluggable|
| Runs in               | Kernel           | Kernel           | Userspace           |
| Middlebox issues      | Well understood  | Usually works    | Sometimes blocked   |
| Adoption              | Universal        | Universal        | Growing (HTTP/3)    |

---

## When to Use Each in System Design

### Use TCP When:
- Building REST APIs or any request/response service (HTTP/1.1, HTTP/2)
- Database connections (Postgres, MySQL, Redis)
- File transfers where completeness matters
- Any case where the ecosystem assumes TCP (most things)

### Use UDP When:
- Real-time audio/video where latency > reliability (WebRTC data)
- DNS resolution (small request/response, app-level retry)
- Game state updates (latest position matters, not old ones)
- High-frequency telemetry/metrics collection
- Building your own protocol with custom reliability (like QUIC did)

### Use QUIC (HTTP/3) When:
- Serving web content to mobile users (connection migration)
- High-latency networks where 0-RTT matters (global users)
- Multiplexed streams where HOL blocking hurts (many small resources)
- Modern CDN deployments (Cloudflare, Akamai, Google all support it)
- When you need fast iteration on congestion control (userspace = easy updates)

---

## System Design Implications

**Connection pooling:** TCP's slow start means fresh connections are expensive. Always pool and reuse.

**Keep-alive:** Don't tear down TCP connections after every request. HTTP/1.1 made this default.

**Head-of-line blocking:** If your service multiplexes many logical streams over one TCP connection (HTTP/2), a single packet loss stalls everything. Consider HTTP/3 or multiple TCP connections.

**Mobile networks:** TCP struggles with network switches (WiFi to cellular). If designing for mobile-first, QUIC's connection migration is a major advantage.

**Firewall/middlebox issues:** Some corporate networks block UDP (and thus QUIC). Always have TCP fallback. Google's approach: try QUIC, fall back to TCP within 300ms.

---

## Interview Questions

1. **"Why does a new TCP connection perform poorly for the first few round trips?"**
   Slow start. cwnd starts at ~10 segments. Takes multiple RTTs to ramp up to full bandwidth. This is why connection reuse and pooling matter.

2. **"A user reports that your video chat app has terrible quality on packet loss. You're using TCP. What's wrong?"**
   TCP retransmits lost packets and enforces ordering. For real-time video, a lost frame should be skipped, not retransmitted. Switch to UDP (or QUIC with independent streams) and handle loss at the application layer.

3. **"How does QUIC achieve 0-RTT?"**
   On first connection: 1 RTT (sends crypto + data together). On resumption: client caches server's key material and sends encrypted data in the very first packet. Trade-off: 0-RTT data is replayable (not forward-secret), so only safe for idempotent requests.

4. **"Your service has thousands of TIME_WAIT connections. What's happening and how do you fix it?"**
   Short-lived TCP connections pile up in TIME_WAIT (60s default). Fix: enable connection pooling, use SO_REUSEADDR/SO_REUSEPORT, increase ephemeral port range, or switch to long-lived connections (HTTP/2, gRPC).

5. **"Why does HTTP/2 over TCP still suffer from head-of-line blocking?"**
   HTTP/2 multiplexes many streams over one TCP connection. TCP sees one byte stream and enforces total ordering. If one packet is lost, TCP blocks ALL streams until that packet is retransmitted -- even streams whose data arrived fine.

6. **"Design a protocol for a real-time multiplayer game. TCP or UDP? Why?"**
   UDP. Game state updates are time-sensitive and supersede older data. Use UDP with application-level: sequence numbers (detect out-of-order), interpolation (smooth over gaps), and selective reliability (reliable for chat/inventory, unreliable for position).
