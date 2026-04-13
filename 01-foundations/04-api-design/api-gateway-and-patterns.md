# API Gateway, BFF Pattern, and Authentication

## 1. API Gateway: What It Does

An API Gateway is a single entry point for all client requests. It sits between clients
and backend microservices, handling cross-cutting concerns.

### Core Responsibilities

| Responsibility          | Description                                                    |
|-------------------------|----------------------------------------------------------------|
| **Request Routing**     | Route /users/* to User Service, /orders/* to Order Service     |
| **Authentication**      | Validate tokens/API keys before requests reach services        |
| **Rate Limiting**       | Throttle requests per client/IP/plan                           |
| **Load Balancing**      | Distribute requests across service instances                   |
| **Request Transform**   | Modify headers, body, query params before forwarding           |
| **Response Transform**  | Aggregate, filter, reshape responses                           |
| **Circuit Breaking**    | Stop sending traffic to failing services                       |
| **Caching**             | Cache responses for repeated requests                          |
| **SSL Termination**     | Handle TLS at the edge, plain HTTP internally                  |
| **Logging/Monitoring**  | Centralized access logs, metrics, tracing                      |
| **CORS Handling**       | Manage cross-origin policies centrally                         |
| **API Versioning**      | Route /v1/* and /v2/* to different service versions            |
| **Request Validation**  | Validate payloads against schemas before forwarding            |

### Architecture Diagram

```
                           +------------------+
     Mobile App ---------> |                  | -------> User Service
                           |                  |
     Web Browser --------> |   API Gateway    | -------> Order Service
                           |                  |
     Partner API --------> |  (Kong/Envoy/    | -------> Product Service
                           |   AWS API GW)    |
     IoT Device ---------> |                  | -------> Notification Service
                           +------------------+
                                    |
                           +--------+--------+
                           | Shared concerns: |
                           | Auth, Rate Limit |
                           | Logging, Metrics |
                           | Circuit Breaking |
                           +------------------+
```

### Request Flow Through the Gateway

```
Client Request
  |
  v
[SSL Termination] -- decrypt TLS
  |
  v
[Rate Limiter] -- 429 if exceeded
  |
  v
[Authentication] -- 401 if invalid token
  |
  v
[Authorization] -- 403 if insufficient permissions
  |
  v
[Request Validation] -- 400 if invalid payload
  |
  v
[Request Transform] -- add headers, rewrite paths
  |
  v
[Circuit Breaker Check] -- 503 if service is down
  |
  v
[Load Balancer] -- pick healthy instance
  |
  v
[Upstream Service] -- forward request
  |
  v
[Response Transform] -- reshape, filter, add CORS headers
  |
  v
[Cache] -- store if cacheable
  |
  v
Client Response
```

---

## 2. API Gateway Technologies

| Technology          | Type         | Best For                                          |
|---------------------|--------------|---------------------------------------------------|
| **Kong**            | Open source  | Plugin ecosystem, Lua/Go plugins, Kubernetes      |
| **AWS API Gateway** | Managed      | AWS-native, Lambda integration, zero ops          |
| **Envoy**           | Open source  | Service mesh (Istio), gRPC support, L7 proxy      |
| **Traefik**         | Open source  | Docker/Kubernetes native, auto-discovery          |
| **NGINX**           | Open source  | High performance reverse proxy, battle-tested     |
| **Zuul (Netflix)**  | Open source  | JVM ecosystem, Spring Cloud integration           |
| **Apigee (Google)** | Managed      | Enterprise API management, monetization           |
| **Tyk**             | Open source  | Go-based, GraphQL native support                  |
| **APISIX**          | Open source  | High performance, dashboard, plugin hot-reload    |

### Decision Guide

```
AWS-native stack?           --> AWS API Gateway
Kubernetes + service mesh?  --> Envoy (+ Istio)
Kubernetes + simple setup?  --> Traefik
Need rich plugin ecosystem? --> Kong
Need gRPC + HTTP?           --> Envoy
JVM/Spring ecosystem?       --> Spring Cloud Gateway (Zuul successor)
Enterprise API monetization?--> Apigee
```

---

## 3. BFF (Backend for Frontend) Pattern

### The Problem

Different clients need different API shapes:

```
Mobile (3G):  Needs minimal data, aggregated into fewer calls, small images
Web (fiber):  Needs richer data, can make parallel calls, full-res images
Smart TV:     Needs video-focused data, simplified navigation
Partner API:  Needs stable contract, versioned, different auth model
```

A single generic API forces compromises on all clients.

### The Solution: One BFF Per Client Type

```
                    +------------------+
Mobile App -------> |   Mobile BFF     | ---+
                    +------------------+    |
                                            |    +----------------+
                    +------------------+    +--> | User Service   |
Web Browser ------> |    Web BFF       | ---+--> | Order Service  |
                    +------------------+    +--> | Product Service|
                                            |    +----------------+
                    +------------------+    |
Smart TV App -----> |    TV BFF        | ---+
                    +------------------+

Each BFF:
  - Owned by the frontend team that uses it
  - Aggregates/transforms data for its specific client
  - Handles client-specific auth, caching, formatting
```

### Example: Same Data, Different Shapes

```json
// Mobile BFF Response (minimal, aggregated)
GET /mobile/v1/home
{
  "user": { "name": "Alice", "avatar_thumb": "url_64px" },
  "recent_orders": [
    { "id": "o1", "total": "$24.99", "status": "delivered" }
  ],
  "recommended_count": 5
}

// Web BFF Response (rich, detailed)
GET /web/v1/home
{
  "user": { "name": "Alice", "email": "...", "avatar_full": "url_512px", "membership": "premium" },
  "recent_orders": [
    { "id": "o1", "total": "$24.99", "status": "delivered", "items": [...], "tracking": {...} }
  ],
  "recommended_products": [ { "id": "p1", "name": "...", "price": "...", "reviews": 4.5 }, ... ],
  "promotions": [ ... ]
}
```

### BFF Anti-Patterns

- **Shared BFF:** Putting multiple clients behind one BFF defeats the purpose
- **Business logic in BFF:** BFF should only aggregate/transform, not own domain logic
- **Too many BFFs:** One per client type, not one per screen or feature

---

## 4. Authentication Comparison

### 4.1 API Keys

```
GET /products
X-API-Key: sk_live_abc123def456
```

| Aspect      | Detail                                                         |
|-------------|----------------------------------------------------------------|
| What        | Simple secret string identifying the caller                    |
| Security    | Low (easily leaked, no expiry, no scoping)                     |
| Use case    | Server-to-server, public APIs with rate limiting               |
| Rotation    | Manual (issue new key, deprecate old one)                      |
| Granularity | Per-application (not per-user)                                 |

### 4.2 OAuth 2.0

OAuth 2.0 is an authorization framework that lets third-party apps access resources on
behalf of a user without exposing credentials.

#### Authorization Code Flow (Web Apps)

```
User        Browser       Your App (Client)    Auth Server      Resource Server
 |            |                |                    |                  |
 |--click login-->             |                    |                  |
 |            |--redirect----->|                    |                  |
 |            |     GET /authorize?                 |                  |
 |            |       client_id=...                 |                  |
 |            |       redirect_uri=...              |                  |
 |            |       response_type=code            |                  |
 |            |       scope=read+write              |                  |
 |            |       state=random_csrf             |                  |
 |            |                |                    |                  |
 |            |<-------- Login Page -----------------|                  |
 |--enter credentials-------->|                    |                  |
 |            |               |<-- code=abc123 ----|                  |
 |            |               |    (via redirect)   |                  |
 |            |               |                    |                  |
 |            |               |-- POST /token ----->|                  |
 |            |               |   code=abc123       |                  |
 |            |               |   client_secret=... |                  |
 |            |               |<-- access_token ----|                  |
 |            |               |    refresh_token    |                  |
 |            |               |                    |                  |
 |            |               |-- GET /api/data ------------------>|
 |            |               |   Authorization: Bearer <token>    |
 |            |               |<-- { data } ----------------------|
```

#### PKCE Flow (Mobile/SPA -- No Client Secret)

PKCE (Proof Key for Code Exchange) prevents authorization code interception.

```
1. Client generates:
   code_verifier  = random(43-128 chars)
   code_challenge = BASE64URL(SHA256(code_verifier))

2. Authorization request includes code_challenge
3. Token exchange includes code_verifier
4. Server verifies: SHA256(code_verifier) == code_challenge
```

This replaces the client_secret (which cannot be kept secret in mobile/SPA apps).

#### Client Credentials Flow (Machine-to-Machine)

```
Service A                      Auth Server                  Service B
  |                               |                           |
  |-- POST /token --------------->|                           |
  |   grant_type=client_creds     |                           |
  |   client_id=...               |                           |
  |   client_secret=...           |                           |
  |<-- access_token --------------|                           |
  |                               |                           |
  |-- GET /api/data (Bearer) -------------------------------->|
  |<-- { data } ----------------------------------------------|
```

No user involved. Used for service-to-service authentication (cron jobs, backend workers).

### 4.3 JWT (JSON Web Token)

JWT is a token format (not an auth protocol). It is commonly used as the access_token in
OAuth 2.0.

#### Structure: header.payload.signature

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.          <-- Header (Base64URL)
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIn0. <-- Payload (Base64URL)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c       <-- Signature
```

Decoded:
```json
// Header
{
  "alg": "RS256",          // Algorithm (RS256, HS256, ES256)
  "typ": "JWT",
  "kid": "key-id-123"      // Key ID for key rotation
}

// Payload (Claims)
{
  "iss": "https://auth.myapp.com",    // Issuer
  "sub": "user_123",                   // Subject (user ID)
  "aud": "https://api.myapp.com",     // Audience (intended recipient)
  "exp": 1704070800,                   // Expiration (Unix timestamp)
  "iat": 1704067200,                   // Issued at
  "nbf": 1704067200,                   // Not before
  "scope": "read write",              // Permissions
  "roles": ["admin", "user"],         // Custom claims
  "email": "alice@example.com"        // Custom claims
}
```

**Verification flow:**
1. Decode header to find algorithm and key ID
2. Fetch public key from JWKS endpoint (cached)
3. Verify signature using public key
4. Check `exp` (not expired), `nbf` (not before), `iss` (trusted issuer), `aud` (matches our service)
5. Extract claims for authorization decisions

**Trade-off:** JWTs are self-contained (no DB lookup to validate) but cannot be revoked
before expiry. Mitigation: short expiry (15 min) + refresh tokens + token blocklist for
emergency revocation.

### Authentication Comparison Table

| Criterion            | API Key           | OAuth 2.0              | JWT                    |
|----------------------|-------------------|------------------------|------------------------|
| Complexity           | Very low          | High                   | Medium                 |
| User context         | No (app-level)    | Yes (user delegation)  | Yes (claims in token)  |
| Token expiry         | None (manual)     | Configurable           | exp claim              |
| Revocation           | Regenerate key    | Revoke at auth server  | Hard (need blocklist)  |
| Stateless validation | No (DB lookup)    | No (introspection)     | Yes (signature check)  |
| Scoping              | Coarse            | Fine (scopes)          | Fine (claims)          |
| Best for             | Server-to-server  | User-facing apps       | Microservice auth      |
| Third-party access   | No                | Yes (core purpose)     | No (internal use)      |

---

## 5. API Versioning Strategies Comparison

| Strategy           | Example                                    | Routing  | Caching | Client DX | Purity  |
|--------------------|--------------------------------------------|----------|---------|-----------|---------|
| URI Path           | `/v1/users`, `/v2/users`                   | Easy     | Great   | Obvious   | Low     |
| Query Param        | `/users?version=2`                         | Easy     | Tricky  | Easy      | Low     |
| Custom Header      | `API-Version: 2`                           | Medium   | Hard    | Hidden    | Medium  |
| Accept Header      | `Accept: application/vnd.api.v2+json`      | Hard     | Hard    | Hidden    | High    |
| No Versioning      | Backward-compatible evolution               | N/A      | Great   | Seamless  | Highest |

**Recommendation for most teams:** URI path versioning (/v1/) for simplicity. Reserve
header-based versioning for large enterprise APIs with sophisticated clients.

---

## 6. Standard Error Response Format

Every API should return errors in a consistent, machine-parseable format.

```json
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must be a valid email address"
      },
      {
        "field": "age",
        "code": "OUT_OF_RANGE",
        "message": "Must be between 0 and 150"
      }
    ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.api.com/errors/VALIDATION_ERROR"
  }
}

// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the rate limit of 1000 requests per hour",
    "details": [],
    "request_id": "req_def456",
    "retry_after": 42
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": [],
    "request_id": "req_ghi789"
  }
}
```

Rules:
- Always include a machine-readable `code` (not just the HTTP status)
- Always include a human-readable `message`
- Include `request_id` for support debugging
- Include `details` array for field-level validation errors
- Never leak stack traces or internal details in production
- Optionally include `documentation_url` linking to error docs

---

## 7. REST vs GraphQL vs gRPC: Giant Comparison Table

| #  | Criterion                   | REST                        | GraphQL                     | gRPC                         |
|----|-----------------------------|-----------------------------|-----------------------------|------------------------------ |
| 1  | Protocol                    | HTTP/1.1 or HTTP/2          | HTTP/1.1 (usually)          | HTTP/2 (required)            |
| 2  | Data Format                 | JSON (usually)              | JSON                        | Protobuf (binary)            |
| 3  | Schema / Contract           | OpenAPI (optional)          | SDL (required)              | .proto (required)            |
| 4  | Type Safety                 | Weak (JSON has no schema)   | Strong (typed schema)       | Strongest (compiled proto)   |
| 5  | Code Generation             | Optional (Swagger codegen)  | Optional (GraphQL codegen)  | Built-in (protoc)            |
| 6  | Request Flexibility         | Fixed endpoints             | Client chooses fields       | Fixed RPC methods            |
| 7  | Over-fetching               | Common problem              | Solved by design            | Minimal (binary, no extras)  |
| 8  | Under-fetching              | Common (multiple calls)     | Solved (single query)       | Solved (design RPCs well)    |
| 9  | Caching                     | HTTP caching native         | Hard (POST, single endpoint)| Not built-in                 |
| 10 | Streaming                   | SSE, WebSocket (separate)   | Subscriptions               | 4 native patterns            |
| 11 | File Upload                 | Multipart native            | Needs separate spec         | Stream chunks (native)       |
| 12 | Browser Support             | Native (any HTTP client)    | Native (POST request)       | Via gRPC-Web proxy only      |
| 13 | Mobile Performance          | Verbose (over-fetching)     | Efficient (exact fields)    | Most efficient (binary)      |
| 14 | Payload Size                | Large (JSON text)           | Medium (requested fields)   | Smallest (binary protobuf)   |
| 15 | Latency                     | Higher (text parsing)       | Medium                      | Lowest (binary, HTTP/2)      |
| 16 | Error Handling              | HTTP status codes           | Always 200, errors in body  | 16 standard gRPC codes       |
| 17 | Versioning                  | URL/header versioning       | Schema evolution            | Proto field numbering        |
| 18 | Real-time                   | Polling / SSE / WebSocket   | Subscriptions               | Bidirectional streaming      |
| 19 | Learning Curve              | Low                         | Medium                      | High                         |
| 20 | Debugging                   | Easy (curl, browser, Postman)| Medium (GraphiQL)          | Harder (grpcurl, binary)     |
| 21 | API Discovery               | OpenAPI docs                | Introspection               | Reflection / proto files     |
| 22 | N+1 Problem                 | N/A (server controls)       | Common (DataLoader fixes)   | N/A (server controls)        |
| 23 | Microservice Communication  | Common but verbose          | Gateway/Federation          | Ideal (high perf, contracts) |
| 24 | Service Mesh Integration    | Good                        | Medium                      | Excellent (Envoy native)     |
| 25 | Community / Adoption        | Universal                   | Large, growing              | Large, Google-driven         |

### When to Use Which -- Decision Tree

```
Who is the consumer?
|
+-- External / public developers
|     --> REST (universally understood, cacheable, tooling)
|
+-- Your own web/mobile frontends
|     |
|     +-- Complex, nested data with varied client needs?
|     |     --> GraphQL (flexible queries, single endpoint)
|     |
|     +-- Simple CRUD with good caching needs?
|           --> REST (simpler, HTTP caching)
|
+-- Internal microservices
|     |
|     +-- Need streaming or highest performance?
|     |     --> gRPC (binary, HTTP/2, streaming)
|     |
|     +-- Need human-readable debugging?
|           --> REST (simpler ops, curl-friendly)
|
+-- Mix of consumers?
      --> API Gateway with REST externally + gRPC internally
      --> Or GraphQL gateway federating gRPC microservices
```

### Hybrid Architecture (Common in Production)

```
                    +-------------------+
External Clients -> |   REST API        | (public, cacheable, documented)
                    +-------------------+
                            |
                    +-------------------+
Web/Mobile Apps --> |  GraphQL Gateway  | (flexible queries, aggregation)
                    +-------------------+
                            |
                    +-------------------+
                    |   gRPC Mesh       | (internal service-to-service)
                    +-------------------+
                   /         |           \
          +--------+   +---------+   +----------+
          | User   |   | Order   |   | Product  |
          | Service|   | Service |   | Service  |
          +--------+   +---------+   +----------+
```

This layered approach uses each protocol where it shines:
- REST for external APIs (broadest compatibility)
- GraphQL for frontend aggregation (flexible queries)
- gRPC for internal communication (highest performance)

---

## Quick Reference Card

```
API Gateway:  Single entry point -- auth, rate limit, route, transform, circuit break
BFF Pattern:  One backend-for-frontend per client type (mobile BFF, web BFF)
API Keys:     Simple, app-level, no expiry -- use for server-to-server
OAuth 2.0:    User delegation -- Auth Code (web), PKCE (mobile/SPA), Client Creds (M2M)
JWT:          Self-contained token -- header.payload.signature, verify with public key
Errors:       { error: { code, message, details[], request_id } }

Protocol Selection:
  Public API     --> REST
  Frontend flex  --> GraphQL
  Internal perf  --> gRPC
  Real-time      --> WebSocket / gRPC streaming / GraphQL subscriptions
```
