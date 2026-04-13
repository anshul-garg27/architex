# gRPC & Protocol Buffers Deep Dive

## 1. Protocol Buffers (Protobuf)

Protocol Buffers are Google's language-neutral, platform-neutral mechanism for serializing
structured data. They are the default serialization format for gRPC.

### 1.1 .proto File Syntax

```protobuf
syntax = "proto3";                     // Always specify version

package myapp.users.v1;                // Package namespace

option go_package = "myapp/users/v1";  // Language-specific options
option java_package = "com.myapp.users.v1";

import "google/protobuf/timestamp.proto";  // Import other protos
import "google/protobuf/empty.proto";

// Message definition
message User {
  string id = 1;                       // Field number (not value!)
  string name = 2;
  string email = 3;
  int32 age = 4;
  UserStatus status = 5;
  repeated string tags = 6;            // repeated = list/array
  optional string bio = 7;            // explicit optional
  google.protobuf.Timestamp created_at = 8;
  Address address = 9;                 // Nested message reference
  oneof contact {                      // Only one can be set
    string phone = 10;
    string slack_handle = 11;
  }
  map<string, string> metadata = 12;   // Map type
}

message Address {
  string street = 1;
  string city = 2;
  string country = 3;
  string zip = 4;
}

enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;         // Proto3 requires 0 value
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_BANNED = 3;
}
```

### 1.2 Field Numbers and Wire Format

Field numbers are critical -- they identify fields in the binary encoding, NOT the order.

```
Field numbers 1-15:   1 byte to encode  (use for frequently populated fields)
Field numbers 16-2047: 2 bytes to encode
Reserved range:       19000-19999 (protobuf internal use)
```

### 1.3 Backward Compatibility Rules

These rules let you evolve schemas without breaking existing clients:

| Action                        | Safe? | Notes                                            |
|-------------------------------|-------|--------------------------------------------------|
| Add new field                 | YES   | Old clients ignore unknown fields                |
| Remove field                  | YES*  | Reserve the field number! Never reuse it         |
| Rename field                  | YES   | Wire format uses numbers, not names              |
| Change field number           | NO    | Breaks all existing data                         |
| Change field type             | NO*   | Some compatible changes work (int32 -> int64)    |
| Change repeated <-> optional  | NO    | Wire format differs                              |
| Add enum value                | YES   | Old clients see it as unknown (default 0)        |
| Remove enum value             | YES*  | Reserve the number                               |

```protobuf
// Reserving deleted field numbers and names prevents accidental reuse
message User {
  reserved 4, 8, 15 to 20;
  reserved "old_field_name", "legacy_status";
  string id = 1;
  string name = 2;
}
```

### 1.4 Protobuf vs JSON Size Comparison

```
JSON:  {"id":"user_123","name":"Alice","age":30,"active":true}
       = 55 bytes (text, self-describing)

Protobuf (same data):
       = ~20 bytes (binary, schema required to decode)
       ~3x smaller, ~5x faster to parse
```

---

## 2. gRPC Service Definition

gRPC uses Protocol Buffers to define service contracts with four communication patterns.

```protobuf
syntax = "proto3";
package myapp.users.v1;

service UserService {
  // Unary
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);

  // Server Streaming
  rpc ListUsers(ListUsersRequest) returns (stream User);

  // Client Streaming
  rpc UploadAvatar(stream AvatarChunk) returns (UploadAvatarResponse);

  // Bidirectional Streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}
```

---

## 3. The Four gRPC Communication Patterns

### 3.1 Unary RPC (Request --> Response)

The simplest pattern. Like a REST API call. One request, one response.

```
Client                          Server
  |                               |
  |-- GetUser(id=123) ----------->|
  |                               |-- Query DB
  |<-- User{name:"Alice"} -------|
  |                               |
```

**When to use:** Standard CRUD operations, any request-response interaction.

```protobuf
rpc GetUser(GetUserRequest) returns (User);

message GetUserRequest {
  string user_id = 1;
}
```

```python
# Server
class UserServicer(UserServiceServicer):
    def GetUser(self, request, context):
        user = db.find_user(request.user_id)
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
        return User(id=user.id, name=user.name, email=user.email)

# Client
response = stub.GetUser(GetUserRequest(user_id="123"))
print(response.name)
```

### 3.2 Server Streaming (Request --> Stream of Responses)

Client sends one request, server returns a stream of messages.

```
Client                          Server
  |                               |
  |-- ListUsers(filter) -------->|
  |                               |
  |<-- User{Alice} --------------|
  |<-- User{Bob} ----------------|
  |<-- User{Carol} --------------|
  |<-- (stream end) -------------|
  |                               |
```

**When to use:** Large result sets, real-time feeds, log tailing, downloading large files
in chunks.

```protobuf
rpc ListUsers(ListUsersRequest) returns (stream User);

message ListUsersRequest {
  string filter = 1;
  int32 page_size = 2;
}
```

```python
# Server
def ListUsers(self, request, context):
    users = db.query_users(request.filter)
    for user in users:
        yield User(id=user.id, name=user.name)
        # Each yield sends one message over the stream

# Client
for user in stub.ListUsers(ListUsersRequest(filter="active")):
    print(user.name)
```

### 3.3 Client Streaming (Stream of Requests --> Response)

Client sends a stream of messages, server responds once after receiving all.

```
Client                          Server
  |                               |
  |-- AvatarChunk(bytes1) ------>|
  |-- AvatarChunk(bytes2) ------>|-- Accumulating...
  |-- AvatarChunk(bytes3) ------>|
  |-- (stream end) ------------->|-- Process complete file
  |                               |
  |<-- UploadResponse{url} ------|
  |                               |
```

**When to use:** File uploads, batch inserts, telemetry/metrics reporting, aggregation
operations.

```protobuf
rpc UploadAvatar(stream AvatarChunk) returns (UploadAvatarResponse);

message AvatarChunk {
  bytes data = 1;
  string filename = 2;
}

message UploadAvatarResponse {
  string url = 1;
  int64 bytes_received = 2;
}
```

```python
# Server
def UploadAvatar(self, request_iterator, context):
    buffer = bytearray()
    for chunk in request_iterator:
        buffer.extend(chunk.data)
    url = storage.save(buffer)
    return UploadAvatarResponse(url=url, bytes_received=len(buffer))

# Client
def generate_chunks(filepath):
    with open(filepath, 'rb') as f:
        while chunk := f.read(64 * 1024):  # 64KB chunks
            yield AvatarChunk(data=chunk, filename="avatar.png")

response = stub.UploadAvatar(generate_chunks("photo.png"))
print(response.url)
```

### 3.4 Bidirectional Streaming (Stream <--> Stream)

Both client and server send streams concurrently. Streams are independent.

```
Client                          Server
  |                               |
  |-- ChatMsg("hi") ------------>|
  |<-- ChatMsg("hello!") --------|
  |-- ChatMsg("how are you") --->|
  |-- ChatMsg("?") ------------->|
  |<-- ChatMsg("I'm good") ------|
  |<-- ChatMsg("thanks!") -------|
  |-- (stream end) ------------->|
  |<-- (stream end) -------------|
  |                               |
```

**When to use:** Chat applications, collaborative editing, gaming, real-time dashboards,
interactive processing pipelines.

```protobuf
rpc Chat(stream ChatMessage) returns (stream ChatMessage);

message ChatMessage {
  string user_id = 1;
  string text = 2;
  google.protobuf.Timestamp timestamp = 3;
}
```

```python
# Server
def Chat(self, request_iterator, context):
    for message in request_iterator:
        # Process each incoming message
        reply_text = process_message(message.text)
        yield ChatMessage(user_id="bot", text=reply_text)

# Client (async)
async def chat():
    async def send_messages():
        yield ChatMessage(user_id="user1", text="hello")
        yield ChatMessage(user_id="user1", text="how are you?")

    async for response in stub.Chat(send_messages()):
        print(f"Bot: {response.text}")
```

---

## 4. HTTP/2 Underneath

gRPC runs on HTTP/2, which provides significant advantages over HTTP/1.1:

### Multiplexing

```
HTTP/1.1 (head-of-line blocking):
  Connection 1: [Request A]----[Response A]----[Request B]----[Response B]
  Connection 2: [Request C]----[Response C]----[Request D]----[Response D]

HTTP/2 (multiplexed on single connection):
  Connection 1: [A][C][B][D]----[A-resp][C-resp][D-resp][B-resp]
                 (interleaved frames, all concurrent)
```

### Binary Framing

```
HTTP/1.1:  "GET /users HTTP/1.1\r\nHost: example.com\r\n\r\n"  (text)
HTTP/2:    [HEADERS frame][DATA frame]                           (binary)
```

### Key HTTP/2 Features Used by gRPC

| Feature             | Benefit for gRPC                                       |
|---------------------|--------------------------------------------------------|
| Multiplexing        | Multiple RPCs over single TCP connection               |
| Binary framing      | Efficient with Protobuf binary payloads                |
| Header compression  | HPACK reduces repeated header overhead                 |
| Stream priorities   | Prioritize critical RPCs                               |
| Server push         | Proactive data sending (used in streaming RPCs)        |
| Flow control        | Per-stream backpressure for streaming                  |

---

## 5. Interceptors (Middleware)

Interceptors are gRPC's equivalent of HTTP middleware. They wrap RPC calls for
cross-cutting concerns.

```python
# Server-side interceptor for logging and auth
class AuthInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)
        token = metadata.get('authorization')

        if not token or not verify_token(token):
            return grpc.unary_unary_rpc_method_handler(
                lambda req, ctx: ctx.abort(
                    grpc.StatusCode.UNAUTHENTICATED, "Invalid token"
                )
            )
        return continuation(handler_call_details)

class LoggingInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        start = time.time()
        response = continuation(handler_call_details)
        duration = time.time() - start
        logger.info(f"{method} completed in {duration:.3f}s")
        return response

# Register interceptors
server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=10),
    interceptors=[AuthInterceptor(), LoggingInterceptor()]
)
```

Common interceptor use cases:
- Authentication and authorization
- Logging and metrics
- Request validation
- Rate limiting
- Distributed tracing (injecting trace IDs)
- Error handling and retry logic

---

## 6. Deadlines and Timeout Propagation

gRPC deadlines propagate across service boundaries -- a critical feature for
microservices.

```
Client (deadline: 5s)
  |
  +--> Service A (remaining: 5s, sets own deadline: min(5s, 3s) = 3s)
         |
         +--> Service B (remaining: 2.8s after A's processing)
                |
                +--> Service C (remaining: 1.5s -- if exceeded, DEADLINE_EXCEEDED)
```

```python
# Client sets deadline
try:
    response = stub.GetUser(
        GetUserRequest(user_id="123"),
        timeout=5.0  # 5 seconds
    )
except grpc.RpcError as e:
    if e.code() == grpc.StatusCode.DEADLINE_EXCEEDED:
        print("Request timed out")

# Server checks remaining time
def GetUser(self, request, context):
    remaining = context.time_remaining()
    if remaining < 0.5:
        context.abort(grpc.StatusCode.DEADLINE_EXCEEDED, "Not enough time")

    # Forward deadline to downstream calls automatically
    downstream_response = other_stub.GetData(
        GetDataRequest(...),
        timeout=remaining - 0.1  # Leave margin
    )
```

**Best practice:** Always set deadlines. Without them, a hung downstream service can
exhaust all connection resources indefinitely.

---

## 7. gRPC Status Codes

gRPC defines 16 standard status codes (analogous to HTTP status codes):

| Code | Name                 | HTTP Equiv | When to Use                                  |
|------|----------------------|------------|----------------------------------------------|
| 0    | OK                   | 200        | Success                                      |
| 1    | CANCELLED            | 499        | Client cancelled the request                 |
| 2    | UNKNOWN              | 500        | Unknown error (use sparingly)                |
| 3    | INVALID_ARGUMENT     | 400        | Bad request parameters                       |
| 4    | DEADLINE_EXCEEDED    | 504        | Timeout before completion                    |
| 5    | NOT_FOUND            | 404        | Resource not found                           |
| 6    | ALREADY_EXISTS       | 409        | Resource already exists (duplicate create)   |
| 7    | PERMISSION_DENIED    | 403        | Caller lacks permission                      |
| 8    | RESOURCE_EXHAUSTED   | 429        | Rate limit or quota exceeded                 |
| 9    | FAILED_PRECONDITION  | 400        | Operation rejected (e.g., non-empty dir)     |
| 10   | ABORTED              | 409        | Concurrency conflict (retry may succeed)     |
| 11   | OUT_OF_RANGE         | 400        | Seek past end of sequence                    |
| 12   | UNIMPLEMENTED        | 501        | Method not implemented                       |
| 13   | INTERNAL             | 500        | Internal server error                        |
| 14   | UNAVAILABLE          | 503        | Service unavailable (transient, retry)       |
| 15   | DATA_LOSS            | 500        | Unrecoverable data loss                      |
| 16   | UNAUTHENTICATED      | 401        | Missing or invalid credentials               |

### Mapping Rules of Thumb

```
Client's fault:  INVALID_ARGUMENT, NOT_FOUND, ALREADY_EXISTS, PERMISSION_DENIED,
                 UNAUTHENTICATED, FAILED_PRECONDITION, OUT_OF_RANGE
Server's fault:  INTERNAL, UNKNOWN, DATA_LOSS, UNIMPLEMENTED
Transient:       UNAVAILABLE, DEADLINE_EXCEEDED, ABORTED, RESOURCE_EXHAUSTED
                 (these are safe to retry with backoff)
```

---

## 8. Load Balancing

### Client-Side Load Balancing

The client maintains a list of server addresses and distributes requests directly.

```
                +-- Server A
Client --------+-- Server B
(round-robin)  +-- Server C

Discovery: DNS, etcd, Consul, Kubernetes service
Policies:  Round Robin, Weighted Round Robin, Pick First, Least Connections
```

**Pros:** No extra hop, lower latency, simple.
**Cons:** All clients need discovery logic, harder to update policies.

### Proxy-Based Load Balancing (Envoy, Nginx)

A proxy sits between clients and servers, handling routing and load balancing.

```
Client ---> [Envoy Proxy] ---> Server A
                           ---> Server B
                           ---> Server C
```

**Pros:** Centralized policy, clients stay simple, supports advanced routing.
**Cons:** Extra network hop, proxy becomes SPOF (mitigate with redundancy).

### Why L7 (Not L4) for gRPC

gRPC multiplexes over a single HTTP/2 connection. L4 (TCP) balancers see one long-lived
connection and route all RPCs to the same backend. L7 (HTTP/2-aware) balancers like Envoy
inspect each RPC frame and distribute them individually.

```
L4 balancer (WRONG for gRPC):
  Client ---[single TCP conn]---> L4 LB ---> Server A (gets ALL requests)
                                         ---> Server B (gets NOTHING)

L7 balancer (CORRECT for gRPC):
  Client ---[single TCP conn]---> L7 LB ---> Server A (RPC 1, RPC 3)
                                         ---> Server B (RPC 2, RPC 4)
```

---

## 9. Health Checking and Reflection

### Health Checking Protocol

gRPC has a standard health checking protocol defined in `grpc.health.v1`.

```protobuf
service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
  rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
    SERVICE_UNKNOWN = 3;
  }
  ServingStatus status = 1;
}
```

Used by: Kubernetes liveness/readiness probes, load balancers, service meshes.

### Server Reflection

Allows tools to discover services and methods at runtime (like GraphQL introspection).

```bash
# With reflection enabled, use grpcurl to explore
grpcurl -plaintext localhost:50051 list
# Output:
# myapp.users.v1.UserService
# grpc.health.v1.Health
# grpc.reflection.v1alpha.ServerReflection

grpcurl -plaintext localhost:50051 describe myapp.users.v1.UserService
# Shows all methods and message types

grpcurl -plaintext -d '{"user_id": "123"}' localhost:50051 myapp.users.v1.UserService/GetUser
```

**Security note:** Disable reflection in production to prevent service enumeration.

---

## 10. gRPC-Web for Browsers

Browsers cannot make native gRPC calls (no HTTP/2 trailer support, no raw TCP). gRPC-Web
is a bridge.

```
Browser                 Envoy Proxy              gRPC Backend
  |                        |                          |
  |-- gRPC-Web (HTTP/1.1)->|                          |
  |   (base64 or binary)  |-- native gRPC (HTTP/2) ->|
  |                        |<- native gRPC response --|
  |<- gRPC-Web response --|                          |
  |                        |                          |
```

Limitations of gRPC-Web:
- Only Unary and Server Streaming (no client or bidi streaming)
- Requires a proxy (Envoy, grpc-web-proxy)
- Base64 encoding adds ~33% overhead vs binary

Alternatives: Use Connect protocol (from Buf) which supports gRPC, gRPC-Web, and plain
HTTP/JSON all from the same service definition.

---

## 11. gRPC vs REST Comparison Table

| Criterion               | gRPC                                | REST                                |
|--------------------------|-------------------------------------|-------------------------------------|
| Protocol                 | HTTP/2                              | HTTP/1.1 (or HTTP/2)               |
| Data format              | Protobuf (binary)                   | JSON (text)                         |
| Schema/Contract          | .proto files (strict)               | OpenAPI (optional, loose)           |
| Code generation          | Built-in (protoc)                   | Third-party (Swagger codegen)       |
| Streaming                | All 4 patterns native               | No native (use WebSocket/SSE)       |
| Browser support          | Via gRPC-Web proxy only             | Native                              |
| Latency                  | Lower (binary, HTTP/2)              | Higher (text parsing, HTTP/1.1)     |
| Payload size             | 3-10x smaller                       | Larger (JSON is verbose)            |
| Human readability        | No (binary)                         | Yes (JSON)                          |
| Tooling                  | grpcurl, Bloom, Evans               | curl, Postman, browser              |
| Caching                  | Not built-in                        | HTTP caching built-in               |
| Deadline propagation     | Built-in across services            | Manual (X-Request-Timeout header)   |
| Load balancing           | Needs L7-aware (Envoy)              | Any L4/L7 works                     |
| Error model              | 16 standard codes + details         | HTTP status codes                   |
| Service discovery        | Requires external (DNS/etcd/Consul) | DNS / URL-based                     |
| Interceptors             | Built-in middleware chain            | Framework-specific middleware        |
| Learning curve           | Steeper (proto, HTTP/2, tools)      | Gentle (HTTP fundamentals)          |
| Ideal use case           | Internal microservice comms         | Public APIs, web/mobile clients     |
| Community/Ecosystem      | Growing, Google-backed              | Massive, universal                  |
| Backward compatibility   | Strong (proto field rules)          | Weak (no schema enforcement)        |

### When to Use Which

```
Use gRPC when:
  - Service-to-service communication (internal)
  - Low latency and high throughput required
  - Streaming is a core requirement
  - Strong typing and schema enforcement needed
  - Polyglot microservices (auto-generated clients)

Use REST when:
  - Public-facing APIs
  - Browser clients (without proxy infrastructure)
  - Simple CRUD operations
  - Caching is critical (CDN-friendly)
  - Team familiarity / simpler debugging
```

---

## Quick Reference Card

```
gRPC Cheat Sheet
=================
Proto:     syntax = "proto3", message, enum, oneof, map, repeated
Fields:    Numbers are identity (1-15 = 1 byte), never reuse, use reserved
Patterns:  Unary | Server Stream | Client Stream | Bidi Stream
Codes:     OK(0) NOT_FOUND(5) INTERNAL(13) UNAVAILABLE(14) UNAUTHENTICATED(16)
Transport: HTTP/2 multiplexing, binary frames, header compression
Balance:   Must use L7 (Envoy) not L4 -- HTTP/2 muxes single connection
Deadlines: Always set, propagate across services
Health:    grpc.health.v1.Health (Check + Watch)
Security:  TLS required, per-RPC credentials via metadata
Tools:     protoc (compiler), grpcurl (CLI), Evans (REPL), Buf (linting)
```
