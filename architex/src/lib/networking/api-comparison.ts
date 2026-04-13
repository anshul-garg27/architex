// ─────────────────────────────────────────────────────────────
// Architex — API Protocol Comparison (NET-015)
// ─────────────────────────────────────────────────────────────
//
// Side-by-side comparison of REST, GraphQL, and gRPC for the
// same operations. Demonstrates key trade-offs:
//
// - **REST**: Multiple HTTP requests, JSON encoding, human-
//   readable but verbose. Over-fetching and under-fetching.
// - **GraphQL**: Single query for exactly the needed fields.
//   Flexible but has complexity overhead (parsing, validation).
// - **gRPC**: Binary Protocol Buffers, HTTP/2 multiplexing,
//   bidirectional streaming. Smallest payload, lowest latency,
//   but not browser-native.
//
// compareAPIs() returns a result object with request counts,
// total bytes transferred, and simulated latency for each
// protocol approach.
//
// getAPIQualitativeMetrics() returns feature-level comparison:
// streaming, browser support, code gen, schema enforcement, etc.
//
// getAPIRequestExamples() returns actual request/response format
// strings for each protocol and operation.
// ─────────────────────────────────────────────────────────────

/**
 * Metrics for a single API protocol performing an operation.
 */
export interface APIProtocolMetrics {
  /** Number of HTTP requests/calls required. */
  requests: number;
  /** Total bytes transferred (request + response). */
  totalBytes: number;
  /** Simulated end-to-end latency in milliseconds. */
  latencyMs: number;
}

/**
 * Complete comparison result across REST, GraphQL, and gRPC.
 */
export interface APIComparisonResult {
  /** REST metrics for the operation. */
  rest: APIProtocolMetrics;
  /** GraphQL metrics for the operation. */
  graphql: APIProtocolMetrics;
  /** gRPC metrics for the operation. */
  grpc: APIProtocolMetrics;
}

/**
 * Supported operations for comparison.
 *
 * - `'list-users'`: List users with basic fields.
 * - `'get-user-by-id'`: Fetch a single user by ID with related data.
 * - `'create-user'`: Create a new user with validation.
 * - `'stream-updates'`: Real-time updates stream.
 */
export type APIOperation =
  | 'list-users'
  | 'get-user-by-id'
  | 'create-user'
  | 'stream-updates';

/** Rating scale for qualitative metrics. */
export type QualitativeRating = 'none' | 'limited' | 'partial' | 'full';

/** Learning curve difficulty. */
export type LearningCurve = 'low' | 'medium' | 'high';

/**
 * Qualitative feature comparison for a single protocol.
 */
export interface QualitativeMetrics {
  /** Protocol name. */
  protocol: 'REST' | 'GraphQL' | 'gRPC';
  /** Support for server streaming. */
  streamingSupport: QualitativeRating;
  /** Browser native support level. */
  browserSupport: QualitativeRating;
  /** Code generation from schema/spec. */
  codeGeneration: QualitativeRating;
  /** Schema or contract enforcement. */
  schemaEnforcement: QualitativeRating;
  /** Learning curve difficulty. */
  learningCurve: LearningCurve;
  /** Typical payload size relative to JSON baseline. */
  payloadEfficiency: string;
  /** Brief explanation for each rating. */
  notes: {
    streamingSupport: string;
    browserSupport: string;
    codeGeneration: string;
    schemaEnforcement: string;
    learningCurve: string;
  };
}

/**
 * Request/response example for a specific protocol and operation.
 */
export interface APIRequestExample {
  /** The protocol. */
  protocol: 'REST' | 'GraphQL' | 'gRPC';
  /** The request format (URL, query, or proto call). */
  request: string;
  /** The response format. */
  response: string;
  /** Approximate payload size in bytes for this example. */
  payloadBytes: number;
}

/**
 * All three protocol examples for a single operation.
 */
export interface APIOperationExamples {
  rest: APIRequestExample;
  graphql: APIRequestExample;
  grpc: APIRequestExample;
}

// ── Constants ────────────────────────────────────────────────

/** Base network round-trip time (ms). */
const BASE_RTT_MS = 30;

/** HTTP/1.1 connection overhead for subsequent REST requests (ms). */
const HTTP11_CONNECTION_OVERHEAD_MS = 15;

/** JSON parsing overhead per request (ms). */
const JSON_PARSE_OVERHEAD_MS = 3;

/** GraphQL query parsing and validation overhead (ms). */
const GRAPHQL_PARSE_OVERHEAD_MS = 5;

/** Protobuf serialization/deserialization overhead (ms, much less than JSON). */
const PROTOBUF_SERDE_OVERHEAD_MS = 1;

/** gRPC HTTP/2 multiplexing saves connection overhead (ms). */
const GRPC_MULTIPLEX_SAVINGS_MS = 10;

/** Protobuf encoding is typically ~30-50% smaller than JSON. Ratio vs JSON. */
const PROTOBUF_SIZE_RATIO = 0.4;

/** GraphQL eliminates over-fetching, typically ~60-80% of REST response size. */
const GRAPHQL_SIZE_RATIO = 0.65;

// ── Operation Data ──────────────────────────────────────────

interface OperationProfile {
  rest: { requests: number; requestBytes: number; responseBytes: number; description: string };
  graphql: { requestBytes: number; responseBytes: number; description: string };
  grpc: { requestBytes: number; responseBytes: number; description: string };
}

const OPERATION_PROFILES: Record<APIOperation, OperationProfile> = {
  'list-users': {
    rest: {
      requests: 1,
      requestBytes: 45,
      responseBytes: 8500,
      description:
        'REST: GET /users?limit=20. Returns full user objects with all fields (id, name, email, bio, avatar, created_at, settings, etc.) even if the client only needs name and email. ~8.5KB response with over-fetching.',
    },
    graphql: {
      requestBytes: 95,
      responseBytes: Math.round(8500 * GRAPHQL_SIZE_RATIO),
      description:
        'GraphQL: Single query selecting only name and email. No over-fetching — response contains exactly the requested fields. Reduces payload by ~35% compared to REST.',
    },
    grpc: {
      requestBytes: 12,
      responseBytes: Math.round(8500 * PROTOBUF_SIZE_RATIO),
      description:
        'gRPC: ListUsersRequest with field_mask for name and email. Protobuf binary encoding is ~60% smaller than JSON. Server-side streaming can deliver users incrementally.',
    },
  },
  'get-user-by-id': {
    rest: {
      requests: 3,
      requestBytes: 163,
      responseBytes: 3800,
      description:
        'REST: 3 sequential requests — GET /users/123, GET /users/123/posts, GET /users/123/profile. Each returns full objects with many unused fields (over-fetching). Responses are JSON-encoded.',
    },
    graphql: {
      requestBytes: 180,
      responseBytes: Math.round(3800 * GRAPHQL_SIZE_RATIO),
      description:
        'GraphQL: 1 query fetches user, posts, and profile in a single request. Only requested fields are returned (no over-fetching). Query: { user(id: 123) { name, posts { title, body }, profile { bio } } }',
    },
    grpc: {
      requestBytes: 20,
      responseBytes: Math.round(3800 * PROTOBUF_SIZE_RATIO),
      description:
        'gRPC: 1 unary RPC call with GetUserRequest { user_id: 123 }. Response is a nested Protocol Buffer message. Binary encoding is ~60% smaller than JSON. HTTP/2 header compression further reduces overhead.',
    },
  },
  'create-user': {
    rest: {
      requests: 1,
      requestBytes: 350,
      responseBytes: 800,
      description:
        'REST: POST /users with JSON body { name, email, password, ... }. Validation errors returned as 422 with JSON error body. No standard schema validation on the wire — relies on server-side checks.',
    },
    graphql: {
      requestBytes: 280,
      responseBytes: Math.round(800 * GRAPHQL_SIZE_RATIO),
      description:
        'GraphQL: mutation createUser(input: CreateUserInput!) { user { id, name } }. Input types provide type checking. Response contains only created fields requested by the client. Errors returned in structured errors[] array.',
    },
    grpc: {
      requestBytes: 120,
      responseBytes: Math.round(800 * PROTOBUF_SIZE_RATIO),
      description:
        'gRPC: CreateUser RPC with CreateUserRequest protobuf. Strong type enforcement via proto schema. Validation can use proto3 field presence. Status codes (INVALID_ARGUMENT, ALREADY_EXISTS) are standardized.',
    },
  },
  'stream-updates': {
    rest: {
      requests: 10,
      requestBytes: 700,
      responseBytes: 5000,
      description:
        'REST: Requires HTTP polling every 2s. 10 requests in a 20s window. Most polls return empty responses (wasted bandwidth). High latency — messages delayed up to 2s. No server push capability. SSE is an alternative but unidirectional.',
    },
    graphql: {
      requestBytes: 150,
      responseBytes: 2000,
      description:
        'GraphQL: Uses subscriptions over WebSocket. Server pushes new updates instantly. Only new data is sent (no polling waste). Setup: subscription { userUpdated(id: 123) { name, status, lastSeen } }. Requires WebSocket transport layer.',
    },
    grpc: {
      requestBytes: 80,
      responseBytes: 800,
      description:
        'gRPC: Bidirectional streaming over HTTP/2. Both client and server push messages with zero polling. Protobuf binary encoding minimizes per-message overhead. Native flow control and backpressure. Best for real-time.',
    },
  },
};

// ── Qualitative Metrics ─────────────────────────────────────

/**
 * Returns qualitative feature comparison for REST, GraphQL, and gRPC.
 */
export function getAPIQualitativeMetrics(): QualitativeMetrics[] {
  return [
    {
      protocol: 'REST',
      streamingSupport: 'limited',
      browserSupport: 'full',
      codeGeneration: 'partial',
      schemaEnforcement: 'partial',
      learningCurve: 'low',
      payloadEfficiency: '1x (baseline JSON)',
      notes: {
        streamingSupport:
          'SSE for server-push, no native bidirectional. Polling for real-time is wasteful. HTTP/2 streams possible but not standard.',
        browserSupport:
          'Fully native in all browsers via fetch/XMLHttpRequest. No special libraries needed. Universal compatibility.',
        codeGeneration:
          'OpenAPI/Swagger can generate client SDKs, but adoption is optional. Many REST APIs lack formal specs.',
        schemaEnforcement:
          'Optional via OpenAPI spec. No wire-level enforcement — clients can send anything, server must validate. JSON Schema can help.',
        learningCurve:
          'Most developers know REST. Simple HTTP verbs (GET, POST, PUT, DELETE) map to CRUD. Ubiquitous documentation and tooling.',
      },
    },
    {
      protocol: 'GraphQL',
      streamingSupport: 'partial',
      browserSupport: 'full',
      codeGeneration: 'full',
      schemaEnforcement: 'full',
      learningCurve: 'medium',
      payloadEfficiency: '0.65x (no over-fetch)',
      notes: {
        streamingSupport:
          'Subscriptions over WebSocket for real-time. @stream and @defer directives for incremental delivery. No native bidirectional streaming.',
        browserSupport:
          'Works in all browsers via HTTP POST. Requires a client library (Apollo, urql, Relay) for best experience. Playground tools available.',
        codeGeneration:
          'Strong ecosystem: graphql-codegen generates TypeScript types, hooks, and SDKs from schema. Schema-first development is standard.',
        schemaEnforcement:
          'Schema is required and enforced at the transport layer. Every query is validated against the schema before execution. Type-safe by design.',
        learningCurve:
          'New query language to learn. Concepts like resolvers, dataloaders, N+1 prevention, and caching strategy add complexity.',
      },
    },
    {
      protocol: 'gRPC',
      streamingSupport: 'full',
      browserSupport: 'limited',
      codeGeneration: 'full',
      schemaEnforcement: 'full',
      learningCurve: 'high',
      payloadEfficiency: '0.4x (binary protobuf)',
      notes: {
        streamingSupport:
          'Native unary, server-streaming, client-streaming, and bidirectional streaming over HTTP/2. Built-in flow control and backpressure.',
        browserSupport:
          'Not natively supported in browsers (no HTTP/2 trailers). Requires gRPC-Web proxy (Envoy) or Connect protocol. grpc-web library adds overhead.',
        codeGeneration:
          'protoc compiler generates client and server stubs in 10+ languages from .proto files. Strongly typed, compile-time checked. Industry standard for service-to-service.',
        schemaEnforcement:
          'Protocol Buffers enforce schema at compile time and wire level. Field numbers enable backward/forward compatibility. Breaking changes are caught at build.',
        learningCurve:
          'Requires learning Protocol Buffers, protoc toolchain, HTTP/2 concepts, and gRPC-specific error handling. Higher initial investment, but strong payoff for microservices.',
      },
    },
  ];
}

// ── Request/Response Examples ────────────────────────────────

/**
 * Returns request/response format examples for each protocol for a given operation.
 */
export function getAPIRequestExamples(operation: APIOperation): APIOperationExamples {
  return REQUEST_EXAMPLES[operation];
}

const REQUEST_EXAMPLES: Record<APIOperation, APIOperationExamples> = {
  'list-users': {
    rest: {
      protocol: 'REST',
      request: `GET /api/users?limit=20&fields=name,email HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer <token>`,
      response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "bio": "...",
      "avatar": "...",
      "created_at": "2025-01-15T..."
    },
    ...
  ],
  "total": 150,
  "page": 1
}`,
      payloadBytes: 8545,
    },
    graphql: {
      protocol: 'GraphQL',
      request: `POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "{ users(limit: 20) { name email } }"
}`,
      response: `{
  "data": {
    "users": [
      { "name": "Alice", "email": "alice@example.com" },
      { "name": "Bob", "email": "bob@example.com" },
      ...
    ]
  }
}`,
      payloadBytes: Math.round(8500 * GRAPHQL_SIZE_RATIO) + 95,
    },
    grpc: {
      protocol: 'gRPC',
      request: `// ListUsersRequest (protobuf binary)
service UserService {
  rpc ListUsers(ListUsersRequest) returns (stream User);
}

message ListUsersRequest {
  int32 limit = 1;  // 20
  FieldMask field_mask = 2;  // paths: ["name", "email"]
}`,
      response: `// Stream of User messages (protobuf binary)
message User {
  int32 id = 1;
  string name = 2;     // "Alice"
  string email = 3;    // "alice@example.com"
}
// ~12 bytes per user (binary encoded)`,
      payloadBytes: Math.round(8500 * PROTOBUF_SIZE_RATIO) + 12,
    },
  },
  'get-user-by-id': {
    rest: {
      protocol: 'REST',
      request: `GET /api/users/123 HTTP/1.1
GET /api/users/123/posts HTTP/1.1
GET /api/users/123/profile HTTP/1.1
Host: api.example.com
Accept: application/json`,
      response: `// Response 1: User
{ "id": 123, "name": "Alice", "email": "...", "bio": "...", ... }

// Response 2: Posts
{ "posts": [{ "id": 1, "title": "...", "body": "...", ... }] }

// Response 3: Profile
{ "profile": { "bio": "...", "avatar": "...", ... } }`,
      payloadBytes: 3963,
    },
    graphql: {
      protocol: 'GraphQL',
      request: `POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "{
    user(id: 123) {
      name
      email
      posts { title body createdAt }
      profile { bio avatarUrl }
    }
  }"
}`,
      response: `{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [
        { "title": "Hello World", "body": "...", "createdAt": "..." }
      ],
      "profile": { "bio": "Engineer", "avatarUrl": "..." }
    }
  }
}`,
      payloadBytes: Math.round(3800 * GRAPHQL_SIZE_RATIO) + 180,
    },
    grpc: {
      protocol: 'gRPC',
      request: `// GetUserRequest (protobuf binary)
service UserService {
  rpc GetUser(GetUserRequest) returns (UserWithDetails);
}

message GetUserRequest {
  int32 user_id = 1;  // 123
}`,
      response: `// UserWithDetails (protobuf binary)
message UserWithDetails {
  string name = 1;       // "Alice"
  string email = 2;      // "alice@example.com"
  repeated Post posts = 3;
  Profile profile = 4;
}
// Total: ~1540 bytes (binary)`,
      payloadBytes: Math.round(3800 * PROTOBUF_SIZE_RATIO) + 20,
    },
  },
  'create-user': {
    rest: {
      protocol: 'REST',
      request: `POST /api/users HTTP/1.1
Content-Type: application/json

{
  "name": "Charlie",
  "email": "charlie@example.com",
  "password": "s3cur3P@ss"
}`,
      response: `HTTP/1.1 201 Created
Location: /api/users/456

{
  "id": 456,
  "name": "Charlie",
  "email": "charlie@example.com",
  "created_at": "2025-10-01T12:00:00Z"
}`,
      payloadBytes: 1150,
    },
    graphql: {
      protocol: 'GraphQL',
      request: `POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
    }
  }",
  "variables": {
    "input": {
      "name": "Charlie",
      "email": "charlie@example.com",
      "password": "s3cur3P@ss"
    }
  }
}`,
      response: `{
  "data": {
    "createUser": {
      "id": "456",
      "name": "Charlie"
    }
  }
}`,
      payloadBytes: Math.round(800 * GRAPHQL_SIZE_RATIO) + 280,
    },
    grpc: {
      protocol: 'gRPC',
      request: `// CreateUserRequest (protobuf binary)
service UserService {
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
}

message CreateUserRequest {
  string name = 1;      // "Charlie"
  string email = 2;     // "charlie@example.com"
  string password = 3;  // "s3cur3P@ss"
}`,
      response: `// CreateUserResponse (protobuf binary)
message CreateUserResponse {
  int32 id = 1;       // 456
  string name = 2;    // "Charlie"
}
// gRPC status: OK
// Total: ~40 bytes (binary)`,
      payloadBytes: Math.round(800 * PROTOBUF_SIZE_RATIO) + 120,
    },
  },
  'stream-updates': {
    rest: {
      protocol: 'REST',
      request: `// Polling approach (every 2 seconds)
GET /api/users/123/updates?since=2025-10-01T12:00:00Z HTTP/1.1
Accept: application/json

// Repeated 10 times in 20 seconds
// Most responses: { "updates": [] }`,
      response: `HTTP/1.1 200 OK

// Poll 1-8: empty
{ "updates": [] }

// Poll 9: new data
{
  "updates": [
    { "field": "status", "value": "online", "timestamp": "..." }
  ]
}`,
      payloadBytes: 5700,
    },
    graphql: {
      protocol: 'GraphQL',
      request: `// WebSocket subscription
{
  "type": "subscribe",
  "payload": {
    "query": "subscription {
      userUpdated(id: 123) {
        name
        status
        lastSeen
      }
    }"
  }
}`,
      response: `// Server push (instant, only when data changes)
{
  "data": {
    "userUpdated": {
      "name": "Alice",
      "status": "online",
      "lastSeen": "2025-10-01T12:05:00Z"
    }
  }
}`,
      payloadBytes: 2150,
    },
    grpc: {
      protocol: 'gRPC',
      request: `// Bidirectional stream
service UserService {
  rpc StreamUpdates(stream UpdateRequest)
    returns (stream UpdateResponse);
}

message UpdateRequest {
  int32 user_id = 1;  // 123
  // Client can send ack, filters, etc.
}`,
      response: `// Server pushes updates as they occur
message UpdateResponse {
  string field = 1;      // "status"
  string value = 2;      // "online"
  int64 timestamp = 3;   // 1696161900
}
// ~20 bytes per update (binary)
// Native backpressure via HTTP/2 flow control`,
      payloadBytes: 880,
    },
  },
};

// ── Quantitative Comparison ─────────────────────────────────

/**
 * Compares REST, GraphQL, and gRPC approaches for a given operation.
 *
 * Models the key differences:
 * - **REST**: Multiple HTTP/1.1 requests with JSON encoding.
 * - **GraphQL**: Single HTTP request with a query that specifies exact fields.
 * - **gRPC**: Single HTTP/2 call with binary Protocol Buffers.
 *
 * @param operation - The operation to compare across protocols.
 * @returns Comparison result with metrics for each protocol.
 *
 * @example
 * ```ts
 * const result = compareAPIs('get-user-by-id');
 * console.log(`REST: ${result.rest.requests} requests, ${result.rest.totalBytes} bytes`);
 * ```
 */
export function compareAPIs(operation: APIOperation): APIComparisonResult {
  const profile = OPERATION_PROFILES[operation];

  // REST: multiple sequential requests with JSON overhead
  const restLatency =
    profile.rest.requests * BASE_RTT_MS +
    (profile.rest.requests - 1) * HTTP11_CONNECTION_OVERHEAD_MS +
    profile.rest.requests * JSON_PARSE_OVERHEAD_MS;

  const restTotalBytes = profile.rest.requestBytes + profile.rest.responseBytes;

  // GraphQL: single request with query parsing overhead
  const graphqlLatency =
    BASE_RTT_MS + GRAPHQL_PARSE_OVERHEAD_MS + JSON_PARSE_OVERHEAD_MS;

  const graphqlTotalBytes =
    profile.graphql.requestBytes + profile.graphql.responseBytes;

  // gRPC: single call with binary encoding and HTTP/2 multiplexing
  const grpcLatency =
    Math.max(BASE_RTT_MS - GRPC_MULTIPLEX_SAVINGS_MS, 5) +
    PROTOBUF_SERDE_OVERHEAD_MS;

  const grpcTotalBytes =
    profile.grpc.requestBytes + profile.grpc.responseBytes;

  return {
    rest: {
      requests: profile.rest.requests,
      totalBytes: restTotalBytes,
      latencyMs: restLatency,
    },
    graphql: {
      requests: 1,
      totalBytes: graphqlTotalBytes,
      latencyMs: graphqlLatency,
    },
    grpc: {
      requests: 1,
      totalBytes: grpcTotalBytes,
      latencyMs: grpcLatency,
    },
  };
}

/**
 * Returns human-readable descriptions for each protocol's approach
 * to a given operation.
 */
export function getAPIOperationDescriptions(
  operation: APIOperation,
): { rest: string; graphql: string; grpc: string } {
  const profile = OPERATION_PROFILES[operation];
  return {
    rest: profile.rest.description,
    graphql: profile.graphql.description,
    grpc: profile.grpc.description,
  };
}
