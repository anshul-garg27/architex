# REST API Deep Dive

## 1. REST Architectural Principles

REST (Representational State Transfer) was defined by Roy Fielding in his 2000 doctoral
dissertation. It is an architectural style, not a protocol. A truly RESTful API adheres to
six constraints:

### 1.1 Client-Server Separation

The client and server evolve independently. The server does not know about the UI; the
client does not know about data storage. This separation of concerns improves portability
(multiple clients) and scalability (server evolves freely).

### 1.2 Statelessness

Every request from client to server must contain ALL information needed to understand and
process the request. The server stores no session state between requests.

```
BAD  (stateful):  Server remembers "user is on page 2"
GOOD (stateless): Client sends GET /orders?page=3&per_page=20&token=xyz
```

Implications:
- Each request carries auth credentials (token/API key)
- No server-side session affinity required
- Horizontal scaling becomes trivial -- any server can handle any request

### 1.3 Uniform Interface

The four sub-constraints:
1. **Resource Identification** -- URIs identify resources
2. **Manipulation through Representations** -- JSON/XML sent with enough info to modify
3. **Self-Descriptive Messages** -- Content-Type, methods, status codes carry meaning
4. **HATEOAS** -- Hypermedia as the engine of application state (links in responses)

### 1.4 Cacheability

Responses must declare themselves cacheable or non-cacheable. When cacheable, clients and
intermediaries can reuse responses, reducing server load.

```
Cache-Control: public, max-age=3600
ETag: "v1-abc123"
```

### 1.5 Layered System

A client cannot tell whether it is connected directly to the end server or to an
intermediary (CDN, load balancer, API gateway). Each layer only knows about the next.

```
Client --> CDN --> API Gateway --> Load Balancer --> App Server --> DB
```

### 1.6 Code on Demand (Optional)

Servers can extend client functionality by transferring executable code (e.g., JavaScript).
This is the only optional constraint.

---

## 2. Resource Naming Conventions

### Golden Rules

| Rule                        | Good                              | Bad                            |
|-----------------------------|-----------------------------------|--------------------------------|
| Use nouns, not verbs        | `GET /users`                      | `GET /getUsers`                |
| Use plurals                 | `/users/123`                      | `/user/123`                    |
| Hierarchical nesting        | `/users/123/orders/456`           | `/getUserOrder?uid=123&oid=456`|
| Lowercase with hyphens      | `/order-items`                    | `/orderItems`, `/order_items`  |
| No trailing slashes         | `/users`                          | `/users/`                      |
| No file extensions          | `/users/123`                      | `/users/123.json`              |
| Max 3 levels of nesting     | `/users/123/orders`               | `/a/1/b/2/c/3/d/4`            |

### Resource Hierarchy Example

```
/users                          # Collection
/users/123                      # Specific user
/users/123/orders               # User's orders (sub-collection)
/users/123/orders/456           # Specific order of that user
/users/123/orders/456/items     # Items in that order
```

### Actions That Don't Map to CRUD

For operations that don't map neatly to CRUD, use sub-resources:

```
POST /users/123/activate        # Action on a resource
POST /orders/456/cancel         # State transition
POST /reports/generate          # Process trigger (returns 202 Accepted)
```

---

## 3. HTTP Methods and CRUD Mapping

| Method  | CRUD   | Idempotent | Safe | Request Body | Typical Use                      |
|---------|--------|------------|------|--------------|----------------------------------|
| GET     | Read   | Yes        | Yes  | No           | Retrieve resource(s)             |
| POST    | Create | **No**     | No   | Yes          | Create new resource              |
| PUT     | Update | Yes        | No   | Yes          | Full replace of resource         |
| PATCH   | Update | **No***    | No   | Yes          | Partial update of resource       |
| DELETE  | Delete | Yes        | No   | Optional     | Remove resource                  |
| HEAD    | Read   | Yes        | Yes  | No           | Same as GET but no body          |
| OPTIONS | --     | Yes        | Yes  | No           | Discover allowed methods (CORS)  |

*PATCH can be made idempotent by design, but the spec does not require it.

### Idempotency Explained

Idempotent means: calling the operation N times produces the same result as calling it once.

```
PUT  /users/123  { "name": "Alice" }   # Always results in name=Alice (idempotent)
POST /users      { "name": "Alice" }   # Creates a new user each time (NOT idempotent)
DELETE /users/123                        # First call deletes, subsequent calls return 404
                                         # but server state is same (idempotent)
```

---

## 4. HTTP Status Code Reference

### 2xx -- Success

| Code | Name                  | When to Use                                            |
|------|-----------------------|--------------------------------------------------------|
| 200  | OK                    | General success (GET, PUT, PATCH, DELETE with body)    |
| 201  | Created               | Resource created (POST). Include Location header.      |
| 202  | Accepted              | Request accepted for async processing                  |
| 204  | No Content            | Success with no response body (DELETE, PUT)             |

### 3xx -- Redirection

| Code | Name                  | When to Use                                            |
|------|-----------------------|--------------------------------------------------------|
| 301  | Moved Permanently     | Resource permanently moved. Update bookmarks.          |
| 302  | Found                 | Temporary redirect (use 307 instead for clarity)       |
| 304  | Not Modified          | ETag/If-None-Match matched -- use cached version       |
| 307  | Temporary Redirect    | Same method must be used for redirect                  |
| 308  | Permanent Redirect    | Like 301 but method must not change                    |

### 4xx -- Client Errors

| Code | Name                  | When to Use                                            |
|------|-----------------------|--------------------------------------------------------|
| 400  | Bad Request           | Malformed syntax, invalid params                       |
| 401  | Unauthorized          | Missing or invalid authentication                      |
| 403  | Forbidden             | Authenticated but lacks permission                     |
| 404  | Not Found             | Resource does not exist                                |
| 405  | Method Not Allowed    | HTTP method not supported on this resource              |
| 406  | Not Acceptable        | Cannot produce content matching Accept header          |
| 408  | Request Timeout       | Client took too long to send the request               |
| 409  | Conflict              | Conflicts with current state (duplicate, version)      |
| 410  | Gone                  | Resource permanently deleted (stronger than 404)       |
| 412  | Precondition Failed   | If-Match ETag check failed                             |
| 413  | Payload Too Large     | Request body exceeds server limit                      |
| 415  | Unsupported Media     | Content-Type not supported                             |
| 422  | Unprocessable Entity  | Well-formed but semantically invalid (validation)      |
| 429  | Too Many Requests     | Rate limit exceeded. Include Retry-After header.       |

### 5xx -- Server Errors

| Code | Name                  | When to Use                                            |
|------|-----------------------|--------------------------------------------------------|
| 500  | Internal Server Error | Unhandled exception / generic server failure           |
| 502  | Bad Gateway           | Upstream service returned invalid response             |
| 503  | Service Unavailable   | Server overloaded or in maintenance                    |
| 504  | Gateway Timeout       | Upstream service timed out                             |

---

## 5. Pagination Deep Dive

### 5.1 Offset-Based Pagination

Uses SQL `LIMIT` and `OFFSET`. Simple to implement, familiar to developers.

```
GET /users?page=3&per_page=20

SQL: SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 40;
```

Response:
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 3,
    "per_page": 20,
    "total_count": 1250,
    "total_pages": 63
  }
}
```

| Pros                          | Cons                                              |
|-------------------------------|---------------------------------------------------|
| Jump to any page              | O(offset) performance -- DB scans skipped rows    |
| Easy to understand            | Inconsistent results when data changes mid-page   |
| Total count available         | COUNT(*) can be expensive on large tables          |

**When to use:** Admin dashboards, small datasets (<100K rows), UI needs page numbers.

### 5.2 Cursor-Based Pagination (Opaque Token)

Returns an opaque, encoded cursor that represents the position in the result set.

```
GET /users?limit=20
GET /users?limit=20&cursor=eyJpZCI6NDAsImNyZWF0ZWRfYXQiOiIyMDI1LTAxLTAxIn0=
```

Response:
```json
{
  "data": [ ... ],
  "pagination": {
    "next_cursor": "eyJpZCI6NjAsImNyZWF0ZWRfYXQiOiIyMDI1LTAyLTAxIn0=",
    "has_next": true
  }
}
```

Implementation (cursor is base64-encoded JSON):
```python
import base64, json

def encode_cursor(last_item):
    payload = {"id": last_item["id"], "created_at": str(last_item["created_at"])}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()

def decode_cursor(cursor_str):
    return json.loads(base64.urlsafe_b64decode(cursor_str))

# Usage in query
cursor = decode_cursor(request.args["cursor"])
query = "SELECT * FROM users WHERE (created_at, id) > (%s, %s) ORDER BY created_at, id LIMIT %s"
params = (cursor["created_at"], cursor["id"], limit)
```

| Pros                              | Cons                                        |
|-----------------------------------|---------------------------------------------|
| Stable results despite mutations  | Cannot jump to arbitrary page               |
| O(1) performance with index       | No total count by default                   |
| Works with real-time feeds        | Cursor token is opaque to client            |

**When to use:** Infinite scroll, feeds, real-time data, large datasets.

### 5.3 Keyset Pagination (WHERE id > last_id)

A transparent version of cursor pagination using the last seen key directly.

```
GET /users?limit=20&after_id=40

SQL: SELECT * FROM users WHERE id > 40 ORDER BY id ASC LIMIT 20;
```

Response:
```json
{
  "data": [ ... ],
  "pagination": {
    "last_id": 60,
    "has_next": true
  }
}
```

| Pros                              | Cons                                        |
|-----------------------------------|---------------------------------------------|
| Very fast with indexed column     | Only works on sortable, unique columns      |
| Simple to understand and debug    | Cannot jump to arbitrary page               |
| Stable under inserts/deletes      | Multi-column sort is more complex           |
| Client sees the key (transparent) | Changing sort order requires different key   |

**When to use:** Sorted-by-ID or sorted-by-timestamp lists, API-to-API sync.

### Pagination Strategy Decision Matrix

```
Need page numbers?
  YES --> Offset-based (accept perf tradeoff)
  NO  --> Is sort key a single indexed column?
            YES --> Keyset (simpler)
            NO  --> Cursor-based (most flexible)
```

---

## 6. Filtering, Sorting, and Field Selection

### Query Parameter Patterns

```
GET /users?status=active                          # Filter
GET /users?status=active&role=admin               # Multiple filters (AND)
GET /users?status=active,inactive                  # Filter with OR
GET /users?age[gte]=18&age[lt]=65                 # Range filters
GET /users?sort=-created_at,name                  # Sort (- prefix = DESC)
GET /users?fields=id,name,email                   # Sparse fieldsets
GET /users?q=alice                                 # Free-text search
GET /users?include=orders,profile                  # Eager load relations
```

### Combined Example

```
GET /products?category=electronics&price[lte]=500&sort=-rating,price&fields=id,name,price,rating&page=1&per_page=20
```

---

## 7. API Versioning Strategies

| Strategy               | Example                                      | Pros                       | Cons                         |
|------------------------|----------------------------------------------|----------------------------|------------------------------|
| **URI Path**           | `GET /v1/users`                              | Obvious, easy to route     | URL pollution, not RESTful   |
| **Custom Header**      | `API-Version: 2`                             | Clean URLs                 | Easy to forget, less visible |
| **Accept Header**      | `Accept: application/vnd.myapi.v2+json`      | Most RESTful (content neg) | Complex, hard to test        |
| **Query Parameter**    | `GET /users?version=2`                       | Easy to test in browser    | Caching issues, messy        |
| **No versioning**      | Evolve with backward compatibility           | Simplest                   | Requires discipline          |

**Industry consensus:** URI path versioning (/v1/) is the most common in practice due to
its simplicity, even though purists prefer the Accept header approach.

### Versioning Best Practices

- Only bump major version for breaking changes
- Support N-1 version minimum (sunset older ones with deprecation headers)
- Use `Sunset: Sat, 01 Jan 2027 00:00:00 GMT` header to advertise deprecation
- Document migration guides between versions

---

## 8. HATEOAS (Hypermedia as the Engine of Application State)

HATEOAS means the API tells clients what they can do next via links in responses. Clients
follow links rather than constructing URLs.

```json
{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "status": "active",
  "_links": {
    "self":       { "href": "/users/123" },
    "orders":     { "href": "/users/123/orders" },
    "deactivate": { "href": "/users/123/deactivate", "method": "POST" },
    "edit":       { "href": "/users/123", "method": "PUT" }
  }
}
```

Benefits:
- Clients discover capabilities dynamically
- Server can add/remove actions without breaking clients
- Self-documenting API responses

Reality check: Few public APIs implement full HATEOAS. It is more common in enterprise
APIs using formats like HAL, JSON:API, or Siren.

---

## 9. Idempotency Keys

Idempotency keys prevent duplicate side effects when clients retry requests (e.g., double
payment). Critical for POST requests which are not naturally idempotent.

### How It Works

```
POST /payments
Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json

{ "amount": 100.00, "currency": "USD", "recipient": "merchant_123" }
```

### Server-Side Implementation

```python
import hashlib, json, redis

redis_client = redis.Redis()
IDEMPOTENCY_TTL = 86400  # 24 hours

def process_payment(request):
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return error_response(400, "Idempotency-Key header required")

    # Check if we already processed this key
    cache_key = f"idempotency:{idem_key}"
    cached = redis_client.get(cache_key)

    if cached:
        return json.loads(cached)  # Return stored response

    # Acquire lock to prevent concurrent duplicates
    lock_key = f"idempotency_lock:{idem_key}"
    lock = redis_client.set(lock_key, "locked", nx=True, ex=30)

    if not lock:
        return error_response(409, "Request already in progress")

    try:
        # Process the actual payment
        result = charge_payment(request.json)

        # Store the response for future retries
        redis_client.setex(cache_key, IDEMPOTENCY_TTL, json.dumps(result))

        return result
    finally:
        redis_client.delete(lock_key)
```

### Flow Diagram

```
Client                          Server                         Redis
  |                               |                              |
  |-- POST /pay (Key: abc) ------>|                              |
  |                               |-- GET idempotency:abc ------>|
  |                               |<-- NULL (miss) --------------|
  |                               |-- SET lock:abc (NX) -------->|
  |                               |<-- OK (acquired) ------------|
  |                               |-- process payment            |
  |                               |-- SET idempotency:abc ------>|
  |<-- 201 Created ---------------|-- DEL lock:abc ------------->|
  |                               |                              |
  |-- POST /pay (Key: abc) ------>|  (retry)                     |
  |                               |-- GET idempotency:abc ------>|
  |                               |<-- cached response ----------|
  |<-- 201 Created (same) --------|                              |
```

---

## 10. ETags and Conditional Requests

ETags (Entity Tags) enable conditional requests for both caching and optimistic
concurrency control.

### For Caching (If-None-Match)

```
# First request
GET /users/123
-> 200 OK
-> ETag: "abc123"
-> Body: { "name": "Alice", ... }

# Subsequent request
GET /users/123
If-None-Match: "abc123"
-> 304 Not Modified (no body, use cache)
```

### For Optimistic Concurrency (If-Match)

```
# Client A reads resource
GET /users/123 -> ETag: "v1"

# Client A updates (succeeds)
PUT /users/123
If-Match: "v1"
-> 200 OK, ETag: "v2"

# Client B tries to update stale version
PUT /users/123
If-Match: "v1"
-> 412 Precondition Failed (conflict detected)
```

### ETag Generation

```python
import hashlib, json

def generate_etag(resource):
    content = json.dumps(resource, sort_keys=True)
    return hashlib.md5(content.encode()).hexdigest()

# OR use database version/timestamp
def generate_etag_from_version(version, updated_at):
    return f'"{version}-{updated_at.isoformat()}"'
```

---

## 11. Rate Limiting Headers

Standard headers to communicate rate limit status:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000          # Max requests per window
X-RateLimit-Remaining: 742       # Requests remaining in current window
X-RateLimit-Reset: 1672531200    # Unix timestamp when window resets
```

When rate limit is exceeded:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 30                   # Seconds until client should retry
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1672531200

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 1000 requests per hour exceeded",
    "retry_after": 30
  }
}
```

### Rate Limiting Algorithms

| Algorithm        | Description                                  | Pros                    |
|------------------|----------------------------------------------|-------------------------|
| Fixed Window     | Count per fixed time bucket (e.g., per hour) | Simple                  |
| Sliding Window   | Rolling window from current time             | Smoother, fairer        |
| Token Bucket     | Tokens added at fixed rate, consumed per req | Allows bursts           |
| Leaky Bucket     | Requests processed at fixed rate, queue rest | Smoothest output rate   |

---

## 12. Best Practices Checklist

- [ ] Use HTTPS everywhere (no exceptions)
- [ ] Version your API from day one
- [ ] Use consistent resource naming (plural nouns, hyphens)
- [ ] Return proper status codes (not always 200)
- [ ] Include pagination for all list endpoints
- [ ] Use cursor-based pagination for large/real-time datasets
- [ ] Support filtering, sorting, field selection where useful
- [ ] Implement rate limiting with proper headers
- [ ] Use ETags for caching and concurrency control
- [ ] Require Idempotency-Key for non-idempotent mutations
- [ ] Return consistent error format: `{ error: { code, message, details } }`
- [ ] Use ISO 8601 for dates: `2025-01-15T10:30:00Z`
- [ ] Use UTC timezone for all timestamps
- [ ] Provide `Location` header on 201 Created
- [ ] Support `Accept` and `Content-Type` headers
- [ ] Implement request correlation IDs for tracing
- [ ] Document with OpenAPI/Swagger specification
- [ ] Provide SDKs for major languages
- [ ] Log all requests for debugging (not bodies with PII)
- [ ] Use gzip/brotli compression

---

## 13. Common Mistakes

### Mistake 1: Verbs in URLs
```
BAD:  POST /createUser
GOOD: POST /users
```

### Mistake 2: Using 200 for Everything
```
BAD:  200 OK { "error": true, "message": "Not found" }
GOOD: 404 Not Found { "error": { "code": "NOT_FOUND", "message": "..." } }
```

### Mistake 3: Ignoring Partial Failures in Batch Operations
```
BAD:  Return 200 or 500 for entire batch
GOOD: Return 207 Multi-Status with individual results
```

### Mistake 4: Not Using Pagination
```
BAD:  GET /events -> returns 50,000 records
GOOD: GET /events?limit=50&cursor=abc123
```

### Mistake 5: Breaking Changes Without Versioning
```
BAD:  Rename "name" to "full_name" in existing endpoint
GOOD: Add "full_name", keep "name" as deprecated alias, bump version
```

### Mistake 6: Inconsistent Naming
```
BAD:  /users/123, /getOrderById/456, /product_list
GOOD: /users/123, /orders/456, /products
```

### Mistake 7: Nested Resources Too Deep
```
BAD:  /countries/1/states/2/cities/3/districts/4/streets/5
GOOD: /streets/5  (with ?city_id=3 filter if needed)
```

### Mistake 8: Not Handling Concurrent Writes
```
BAD:  Last write wins silently
GOOD: Use ETags with If-Match for optimistic concurrency
```

---

## Quick Reference Card

```
REST Design Cheat Sheet
========================
Resources:  plural nouns, hierarchical, max 3 levels
Methods:    GET=read  POST=create  PUT=replace  PATCH=update  DELETE=remove
Success:    200=OK  201=Created  202=Accepted  204=No Content
Client Err: 400=Bad Req  401=No Auth  403=No Perm  404=Not Found  409=Conflict  429=Rate Limit
Server Err: 500=Internal  502=Bad GW  503=Unavailable  504=GW Timeout
Pagination: cursor-based (default)  offset (need page#)  keyset (simple sort)
Headers:    ETag, If-Match, If-None-Match, Idempotency-Key, X-RateLimit-*
Format:     JSON, ISO 8601 dates, UTC, camelCase or snake_case (be consistent)
```
