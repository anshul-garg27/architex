# HTTP Evolution: HTTP/1.1, HTTP/2, and HTTP/3

---

## HTTP/1.1 (1997 - Still Everywhere)

### Key Features

**Persistent Connections (Keep-Alive):** Before HTTP/1.1, every request opened a new TCP connection. HTTP/1.1 defaults to keeping the connection open for multiple request/response cycles.

**Pipelining (Mostly Failed):**
```
Without pipelining:          With pipelining:
  REQ1 -->                     REQ1 -->
  <-- RES1                     REQ2 -->
  REQ2 -->                     REQ3 -->
  <-- RES2                     <-- RES1
  REQ3 -->                     <-- RES2
  <-- RES3                     <-- RES3
```
Pipelining sends requests without waiting for responses. Problem: **responses must still arrive in order** (HTTP head-of-line blocking). If RES1 is slow, RES2 and RES3 are blocked. Most browsers never enabled it.

### Head-of-Line Blocking (Two Levels)

```
Connection 1: [GET /slow.js] --------waiting-------> [response]
              [GET /fast.css] can't send until slow.js response arrives
                              (HTTP-level HOL blocking)

TCP stream:   [pkt1][pkt2*lost][pkt3][pkt4] -- pkt3,4 blocked
                              (TCP-level HOL blocking)
```

### The 6-Connection Workaround

Browsers open up to **6 parallel TCP connections per domain** to work around HOL blocking. Developers exploited this with **domain sharding** (serving assets from cdn1.example.com, cdn2.example.com, etc.) to get 12-18 parallel connections. This was a hack, not a solution.

### HTTP/1.1 Limitations Summary
- One request/response per connection at a time (without pipelining)
- Text-based headers sent repeatedly (Cookie header alone can be 4KB+)
- No multiplexing, no prioritization
- Workarounds: spriting, concatenation, domain sharding (all hacks)

---

## HTTP/2 (2015)

### Binary Framing Layer

HTTP/2 introduces a binary framing layer between the application and TCP:

```
HTTP/1.1 (text):                HTTP/2 (binary):
                                 +------------------+
GET /index.html HTTP/1.1         | HTTP/2 Framing   |
Host: example.com                |  Stream 1: HEADERS frame
Accept: text/html                |  Stream 1: DATA frame
                                 |  Stream 3: HEADERS frame
                                 |  Stream 3: DATA frame
                                 +------------------+
                                 |     TCP           |
                                 +------------------+
```

### Multiplexing (The Big Win)

Multiple requests and responses interleaved over a **single TCP connection**:

```
Single TCP Connection
+------------------------------------------------------+
| Stream 1 (HTML)    [H1][D1a]      [D1b]              |
| Stream 3 (CSS)           [H3][D3a][D3b][D3c]         |
| Stream 5 (JS)       [H5]     [D5a]      [D5b][D5c]  |
+------------------------------------------------------+
        Time --->

H = HEADERS frame, D = DATA frame
Streams interleave freely on one connection
```

**No more domain sharding.** One connection handles everything.

### Header Compression (HPACK)

HTTP/1.1 sends full headers with every request (often 500-800 bytes of redundant data). HPACK compresses headers using:
- **Static table:** 61 predefined common headers (e.g., `:method: GET`)
- **Dynamic table:** Previously seen headers indexed by both sides
- **Huffman encoding:** Compress literal values

Result: Repeated headers compress to **a few bytes** instead of hundreds.

### Server Push

Server proactively sends resources before the client requests them:
```
Client: GET /index.html
Server: Here's index.html
        + PUSH_PROMISE for /style.css (I know you'll need this)
        + Here's /style.css
Client: (already has style.css when parser finds <link>)
```
In practice, **server push is rarely used** and was removed from Chrome. Cache-aware approaches like 103 Early Hints replaced it.

### Stream Prioritization

Clients assign weights and dependencies to streams:
```
       HTML (weight: 256)
      /    \
   CSS      JS (weight: 220)
(weight: 256)  \
               Images (weight: 110)
```
Servers use this to allocate bandwidth. Critical CSS loads before background images.

### HTTP/2 Remaining Problem

HTTP/2 still runs over **TCP**, so TCP-level HOL blocking remains. One lost packet on the TCP connection blocks ALL HTTP/2 streams, even unrelated ones.

---

## HTTP/3 (2022)

### QUIC Transport

HTTP/3 replaces TCP with QUIC (over UDP):

```
HTTP/1.1          HTTP/2            HTTP/3
+--------+        +--------+        +--------+
| HTTP   |        | HTTP/2 |        | HTTP/3 |
+--------+        +--------+        +--------+
| TLS    |        | TLS    |        | QUIC   | <-- includes TLS 1.3
+--------+        +--------+        |        |
| TCP    |        | TCP    |        +--------+
+--------+        +--------+        | UDP    |
| IP     |        | IP     |        +--------+
+--------+        +--------+        | IP     |
                                    +--------+
```

### Key Improvements

**No Transport-Level HOL Blocking:**
```
HTTP/2 over TCP:    Loss on Stream A blocks Streams B, C (TCP enforces order)
HTTP/3 over QUIC:   Loss on Stream A blocks only Stream A (independent streams)
```

**0-RTT Connection Resumption:** Returning clients send encrypted data in the first packet. New connections need only 1 RTT (vs 2-3 for TCP+TLS).

**Connection Migration:** Switching networks (WiFi to cellular) continues seamlessly via QUIC's Connection ID.

**QPACK Header Compression:** Evolution of HPACK, designed for QUIC's out-of-order delivery.

---

## Performance Comparison

| Metric                    | HTTP/1.1       | HTTP/2          | HTTP/3          |
|---------------------------|----------------|-----------------|-----------------|
| Connection setup          | 2-3 RTT        | 2-3 RTT         | 0-1 RTT         |
| Multiplexing              | No (6 conn)    | Yes (1 conn)    | Yes (1 conn)    |
| Header compression        | None           | HPACK           | QPACK           |
| HOL blocking (HTTP)       | Yes            | No              | No              |
| HOL blocking (transport)  | Yes            | Yes (TCP)       | No              |
| Server push               | No             | Yes (unused)    | No (deprecated) |
| Connection migration      | No             | No              | Yes             |
| Encryption                | Optional       | Effectively req | Mandatory       |
| Typical page load (3G)    | ~6.0s          | ~3.5s           | ~2.8s           |
| Typical page load (4G)    | ~2.5s          | ~1.5s           | ~1.2s           |
| Packet loss 2% impact     | Severe         | Severe (all)    | Per-stream only |

---

## HTTP Methods

| Method  | Idempotent | Safe | Body | Use Case                                    |
|---------|------------|------|------|---------------------------------------------|
| GET     | Yes        | Yes  | No*  | Retrieve a resource                         |
| HEAD    | Yes        | Yes  | No   | Like GET but response has no body           |
| POST    | **No**     | No   | Yes  | Create a resource, trigger an action        |
| PUT     | Yes        | No   | Yes  | Replace a resource entirely                 |
| PATCH   | **No**     | No   | Yes  | Partial update to a resource                |
| DELETE  | Yes        | No   | No*  | Remove a resource                           |
| OPTIONS | Yes        | Yes  | No   | Describe communication options (CORS)       |

**Idempotent:** Calling N times produces the same result as calling once.
**Safe:** Does not modify server state. Cacheable by intermediaries.

*POST is NOT idempotent:* `POST /orders` creates a new order each time. This is why payment APIs use idempotency keys.

*PUT IS idempotent:* `PUT /users/123 {name: "Alice"}` always results in the same state.

*PATCH can be non-idempotent:* `PATCH /counter {op: "increment"}` changes state each call.

---

## HTTP Status Codes

### 2xx -- Success
| Code | Name                | When Used                                          |
|------|---------------------|----------------------------------------------------|
| 200  | OK                  | Standard success for GET, PUT, PATCH, DELETE        |
| 201  | Created             | Resource created (POST). Include Location header.   |
| 202  | Accepted            | Request accepted for async processing (queued)      |
| 204  | No Content          | Success but no body (DELETE, PUT with no response)  |

### 3xx -- Redirection
| Code | Name                | When Used                                          |
|------|---------------------|----------------------------------------------------|
| 301  | Moved Permanently   | URL changed forever. Browsers cache this.           |
| 302  | Found               | Temporary redirect. Method may change to GET.       |
| 304  | Not Modified        | Client's cached version is still valid (ETag match) |
| 307  | Temporary Redirect  | Like 302 but preserves HTTP method                  |
| 308  | Permanent Redirect  | Like 301 but preserves HTTP method                  |

### 4xx -- Client Error
| Code | Name                | When Used                                          |
|------|---------------------|----------------------------------------------------|
| 400  | Bad Request         | Malformed syntax, invalid parameters                |
| 401  | Unauthorized        | Missing or invalid authentication                   |
| 403  | Forbidden           | Authenticated but not authorized for this resource  |
| 404  | Not Found           | Resource does not exist                             |
| 405  | Method Not Allowed  | Correct URL, wrong HTTP method                      |
| 408  | Request Timeout     | Server timed out waiting for client request         |
| 409  | Conflict            | State conflict (e.g., duplicate create, edit clash)  |
| 413  | Payload Too Large   | Request body exceeds server limit                   |
| 422  | Unprocessable Entity| Syntax OK but semantically invalid (validation)     |
| 429  | Too Many Requests   | Rate limited. Include Retry-After header.           |

### 5xx -- Server Error
| Code | Name                   | When Used                                       |
|------|------------------------|-------------------------------------------------|
| 500  | Internal Server Error  | Generic unhandled server failure                 |
| 502  | Bad Gateway            | Upstream server returned invalid response        |
| 503  | Service Unavailable    | Server overloaded or in maintenance              |
| 504  | Gateway Timeout        | Upstream server did not respond in time          |

**Interview tip:** 401 vs 403 -- "Who are you?" vs "You can't do that." 502 vs 504 -- upstream returned garbage vs upstream didn't respond.

---

## HTTP Caching

### Cache-Control Directives

```
Cache-Control: public, max-age=31536000    -- CDN + browser, 1 year
Cache-Control: private, max-age=3600       -- Browser only, 1 hour
Cache-Control: no-cache                    -- Must revalidate every time
Cache-Control: no-store                    -- Never cache (sensitive data)
Cache-Control: s-maxage=600                -- Shared cache (CDN) TTL override
Cache-Control: stale-while-revalidate=60   -- Serve stale, revalidate in background
```

### ETag/If-None-Match Revalidation Flow

```
First Request:
  Client --> GET /data
  Server <-- 200 OK
               ETag: "abc123"
               Cache-Control: no-cache

Subsequent Request:
  Client --> GET /data
               If-None-Match: "abc123"

  Case A (unchanged):
  Server <-- 304 Not Modified         (no body, use cached version)

  Case B (changed):
  Server <-- 200 OK
               ETag: "def456"         (new content + new ETag)
```

### Last-Modified / If-Modified-Since

Same concept but with timestamps instead of content hashes. Less precise than ETags (1-second granularity), but simpler.

### Caching Strategy by Resource Type

| Resource Type     | Strategy                                         |
|-------------------|--------------------------------------------------|
| Static assets     | `public, max-age=31536000, immutable` + file hash in URL |
| API responses     | `private, no-cache` + ETag revalidation          |
| User-specific     | `private, max-age=0, must-revalidate`            |
| Sensitive data    | `no-store`                                       |
| HTML pages        | `no-cache` (always revalidate, serve if fresh)   |

---

## CORS (Cross-Origin Resource Sharing)

### The Problem

Browsers enforce **Same-Origin Policy**: JavaScript on `app.example.com` cannot make requests to `api.different.com` without explicit permission.

### Simple Requests (No Preflight)

GET, HEAD, POST with standard headers go directly. Server responds with:
```
Access-Control-Allow-Origin: https://app.example.com
```

### Preflight Requests (OPTIONS)

Non-simple requests (PUT, DELETE, custom headers, JSON content-type) trigger a preflight:

```
Browser                                  Server
  |                                        |
  |  OPTIONS /api/users                    |
  |  Origin: https://app.example.com       |
  |  Access-Control-Request-Method: DELETE  |
  |  Access-Control-Request-Headers:        |
  |    Authorization, Content-Type          |
  |  ---------------------------------->   |
  |                                        |
  |  200 OK                                |
  |  Access-Control-Allow-Origin:           |
  |    https://app.example.com             |
  |  Access-Control-Allow-Methods:          |
  |    GET, POST, PUT, DELETE              |
  |  Access-Control-Allow-Headers:          |
  |    Authorization, Content-Type         |
  |  Access-Control-Max-Age: 86400         |
  |  <----------------------------------   |
  |                                        |
  |  DELETE /api/users/123                 |  (actual request)
  |  ---------------------------------->   |
  |  200 OK                                |
  |  <----------------------------------   |
```

### Key CORS Headers

| Header                           | Direction | Purpose                               |
|----------------------------------|-----------|---------------------------------------|
| Origin                           | Request   | Where the request originates          |
| Access-Control-Allow-Origin      | Response  | Which origins are permitted           |
| Access-Control-Allow-Methods     | Response  | Permitted HTTP methods                |
| Access-Control-Allow-Headers     | Response  | Permitted request headers             |
| Access-Control-Allow-Credentials | Response  | Whether cookies/auth are allowed      |
| Access-Control-Max-Age           | Response  | How long to cache preflight result    |
| Access-Control-Expose-Headers    | Response  | Which headers JS can read             |

**`Access-Control-Allow-Origin: *`** does NOT allow credentials. If you need cookies, you must specify the exact origin.

---

## Interview Questions

1. **"Your API is returning 502 errors intermittently. Walk me through debugging."**
   502 = upstream returned invalid response. Check: Is the upstream server crashing? Is the response malformed? Is a proxy/LB timing out and getting a partial response? Check LB access logs, upstream health checks, and upstream error rates independently.

2. **"How would you cache API responses for a social media feed?"**
   `Cache-Control: private, no-cache` with ETag. Each user's feed is personalized (private). Use ETag based on latest post timestamp. Client sends `If-None-Match` on refresh. 304 if unchanged (saves bandwidth). Invalidate when user's feed changes. Consider `stale-while-revalidate` for perceived performance.

3. **"Why did HTTP/2 not solve the head-of-line blocking problem completely?"**
   HTTP/2 solved HTTP-level HOL blocking via multiplexing but still runs on TCP. TCP treats all data as a single ordered stream. One lost TCP packet blocks ALL HTTP/2 streams until retransmitted. HTTP/3 fixes this by using QUIC, where each stream has independent loss recovery.

4. **"Your frontend on app.com can't call your API on api.com. What's happening?"**
   CORS. The browser sends a preflight OPTIONS request. The API server must respond with `Access-Control-Allow-Origin: https://app.com`. Also need `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` for non-simple requests. Fix: configure CORS middleware on the API server.

5. **"POST vs PUT vs PATCH -- when do you use each?"**
   POST: Create new resources (non-idempotent, server assigns ID). PUT: Full replacement of a resource (idempotent, client specifies ID). PATCH: Partial update (may be non-idempotent). Example: POST /orders creates an order. PUT /orders/123 replaces it entirely. PATCH /orders/123 updates just the status field.

6. **"A client sends `Cache-Control: no-cache`. Does this mean 'don't cache'?"**
   No. `no-cache` means "you can cache it, but must revalidate with the server before using it." `no-store` means "don't cache at all." This is one of the most common misconceptions.
