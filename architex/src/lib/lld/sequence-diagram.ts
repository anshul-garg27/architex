// ─────────────────────────────────────────────────────────────
// Architex — Sequence Diagram Types & Examples (LLD-009 to LLD-011)
// ─────────────────────────────────────────────────────────────

import type { SequenceParticipant, SequenceMessage } from "./types";

export type { SequenceParticipant, SequenceMessage };

export interface SequenceDiagramData {
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
}

// ── Pre-built Sequence Diagram Examples ─────────────────────

export const SEQUENCE_EXAMPLES: Array<{
  id: string;
  name: string;
  description: string;
  data: SequenceDiagramData;
}> = [
  // 1. HTTP Request Lifecycle
  {
    id: "http-request",
    name: "HTTP Request Lifecycle",
    description:
      "A full round-trip HTTP request: client sends a request to the server, the server queries the database, and the response propagates back.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "server", name: "Server", type: "object" },
        { id: "db", name: "Database", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "server", label: "GET /api/users", type: "sync", order: 1, narration: "The client initiates the request. HTTP is synchronous here -- the client blocks until it gets a response. This is the entry point for every REST API call." },
        { id: "m2", from: "server", to: "db", label: "SELECT * FROM users", type: "sync", order: 2, narration: "The server doesn't store user data itself -- it delegates to the database. This separation means we can swap databases without changing server code." },
        { id: "m3", from: "db", to: "server", label: "ResultSet", type: "return", order: 3, narration: "The database returns raw rows. Notice it's a return (dashed arrow), not a new request -- the database never initiates communication, it only responds." },
        { id: "m4", from: "server", to: "server", label: "serialize to JSON", type: "self", order: 4, narration: "Self-calls represent internal processing. The server transforms database rows into a JSON response format. This is where DTO mapping and business logic happen." },
        { id: "m5", from: "server", to: "client", label: "200 OK { users: [...] }", type: "return", order: 5, narration: "The response propagates back to the client with a 200 status code. The entire round-trip is complete -- client can now render the data." },
      ],
    },
  },

  // 2. OAuth Login Flow
  {
    id: "oauth-login",
    name: "OAuth Login Flow",
    description:
      "OAuth 2.0 Authorization Code flow: user initiates login, the app redirects to the auth server, tokens are exchanged, and the user is authenticated.",
    data: {
      participants: [
        { id: "user", name: "User", type: "actor" },
        { id: "app", name: "App", type: "object" },
        { id: "auth", name: "Auth Server", type: "object" },
      ],
      messages: [
        { id: "m1", from: "user", to: "app", label: "Click 'Login with OAuth'", type: "sync", order: 1, narration: "The user wants to log in but the app doesn't handle credentials directly. Delegating to OAuth means the app never sees the user's password -- reducing liability." },
        { id: "m2", from: "app", to: "auth", label: "redirect /authorize?client_id=...", type: "sync", order: 2, narration: "The app redirects the user's browser to the auth server with its client_id. This proves to the auth server which app is requesting access." },
        { id: "m3", from: "auth", to: "user", label: "Show consent screen", type: "return", order: 3, narration: "The auth server shows what permissions the app is requesting. The user must explicitly consent -- this is the 'authorization' in OAuth." },
        { id: "m4", from: "user", to: "auth", label: "Grant permission", type: "sync", order: 4, narration: "The user approves the requested scopes. The auth server now knows the user trusts this specific app with specific permissions." },
        { id: "m5", from: "auth", to: "app", label: "redirect /callback?code=abc", type: "return", order: 5, narration: "The auth server redirects back to the app with a short-lived authorization code. This code alone is useless -- it must be exchanged with a secret, preventing interception attacks." },
        { id: "m6", from: "app", to: "auth", label: "POST /token { code, secret }", type: "sync", order: 6, narration: "The app exchanges the authorization code plus its client secret for tokens. This back-channel request happens server-to-server, never through the browser -- keeping the secret safe." },
        { id: "m7", from: "auth", to: "app", label: "{ access_token, refresh_token }", type: "return", order: 7, narration: "The auth server returns an access token (short-lived, for API calls) and a refresh token (long-lived, to get new access tokens). Two tokens with different lifetimes maximize both security and convenience." },
        { id: "m8", from: "app", to: "user", label: "Login successful", type: "return", order: 8, narration: "The app creates a session for the user and redirects them to the authenticated view. The entire flow happened without the app ever knowing the user's password." },
      ],
    },
  },

  // 3. Order Processing
  {
    id: "order-processing",
    name: "Order Processing",
    description:
      "An e-commerce order flow: the user places an order, the order service coordinates payment and inventory checks before confirming.",
    data: {
      participants: [
        { id: "user", name: "User", type: "actor" },
        { id: "order", name: "OrderService", type: "object" },
        { id: "payment", name: "PaymentService", type: "object" },
        { id: "inventory", name: "InventoryService", type: "object" },
      ],
      messages: [
        { id: "m1", from: "user", to: "order", label: "placeOrder(cart)", type: "sync", order: 1, narration: "The user submits their cart for checkout. The OrderService becomes the orchestrator -- it will coordinate payment and inventory as a single logical transaction." },
        { id: "m2", from: "order", to: "order", label: "validate order", type: "self", order: 2, narration: "Before charging money or reserving inventory, the service validates the order: are items still available? Is the total correct? Catching errors here prevents costly compensation later." },
        { id: "m3", from: "order", to: "payment", label: "chargeCard(amount)", type: "sync", order: 3, narration: "Payment is processed first because charging a card is easier to reverse than restocking inventory. If payment fails, we avoid touching inventory at all." },
        { id: "m4", from: "payment", to: "order", label: "paymentConfirmed", type: "return", order: 4, narration: "Payment succeeded. The charge is authorized but not yet captured -- giving us a window to roll back if inventory reservation fails." },
        { id: "m5", from: "order", to: "inventory", label: "reserveItems(items)", type: "sync", order: 5, narration: "Now that payment is confirmed, we reserve inventory. This two-step approach (pay then reserve) is deliberate -- it follows the 'compensating transaction' pattern." },
        { id: "m6", from: "inventory", to: "order", label: "reservationConfirmed", type: "return", order: 6, narration: "Inventory is reserved and deducted from available stock. If this had failed, the OrderService would need to refund the payment -- a compensating transaction." },
        { id: "m7", from: "order", to: "user", label: "orderConfirmation", type: "return", order: 7, narration: "Both payment and inventory succeeded. The user gets a confirmation with an order ID. Behind the scenes, this triggers fulfillment, email notification, and analytics events." },
      ],
    },
  },

  // 4. Pub/Sub Pattern
  {
    id: "pub-sub",
    name: "Pub/Sub Pattern",
    description:
      "Publish-Subscribe messaging: a publisher sends a message to a broker, which fans it out to all registered subscribers asynchronously.",
    data: {
      participants: [
        { id: "publisher", name: "Publisher", type: "object" },
        { id: "broker", name: "Message Broker", type: "object" },
        { id: "sub1", name: "Subscriber A", type: "object" },
        { id: "sub2", name: "Subscriber B", type: "object" },
      ],
      messages: [
        { id: "m1", from: "publisher", to: "broker", label: "publish('user.created', payload)", type: "sync", order: 1, narration: "The publisher fires and forgets -- it doesn't know or care who is listening. This decoupling means you can add new subscribers without changing the publisher code." },
        { id: "m2", from: "broker", to: "broker", label: "match topic to subscribers", type: "self", order: 2, narration: "The broker looks up all subscribers registered for the 'user.created' topic. This is the routing logic -- the core responsibility of any message broker." },
        { id: "m3", from: "broker", to: "sub1", label: "notify(payload)", type: "async", order: 3, narration: "Subscriber A is notified asynchronously. The dashed arrow means the broker doesn't wait for A to finish before notifying B -- both are notified in parallel." },
        { id: "m4", from: "broker", to: "sub2", label: "notify(payload)", type: "async", order: 4, narration: "Subscriber B gets the same payload independently. Each subscriber processes the message at its own pace -- a slow subscriber doesn't block others." },
        { id: "m5", from: "sub1", to: "broker", label: "ack", type: "return", order: 5, narration: "Subscriber A acknowledges receipt. Without this ack, the broker would redeliver the message -- this is how at-least-once delivery is guaranteed." },
        { id: "m6", from: "sub2", to: "broker", label: "ack", type: "return", order: 6, narration: "Subscriber B acknowledges independently. If B had crashed before acking, the broker would retry delivery to B without affecting A." },
        { id: "m7", from: "broker", to: "publisher", label: "publishConfirmed", type: "return", order: 7, narration: "The broker confirms that the message was accepted and routed. This doesn't mean all subscribers processed it -- just that the broker took responsibility for delivery." },
      ],
    },
  },

  // 5. Cache-Aside Pattern
  {
    id: "cache-aside",
    name: "Cache-Aside Pattern",
    description:
      "Cache-aside (lazy loading): the client checks the cache first; on a miss it falls through to the database, then populates the cache for future reads.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "cache", name: "Cache", type: "object" },
        { id: "db", name: "Database", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "cache", label: "get(key)", type: "sync", order: 1, narration: "Always check the cache first. A cache hit returns data in microseconds vs. milliseconds for a database query -- that's a 1000x speed difference." },
        { id: "m2", from: "cache", to: "client", label: "MISS (null)", type: "return", order: 2, narration: "Cache miss -- the data isn't cached yet (first request or evicted). The client must fall through to the database. This is the 'lazy loading' aspect of cache-aside." },
        { id: "m3", from: "client", to: "db", label: "SELECT * WHERE id=key", type: "sync", order: 3, narration: "The client queries the source of truth directly. In cache-aside, the CLIENT is responsible for loading from the database -- not the cache. This keeps the cache layer simple and stateless." },
        { id: "m4", from: "db", to: "client", label: "result row", type: "return", order: 4, narration: "The database returns the authoritative data. This is the slow path -- but it only happens once per unique key until the cache entry expires or is evicted." },
        { id: "m5", from: "client", to: "cache", label: "set(key, result, ttl)", type: "async", order: 5, narration: "The client populates the cache with a TTL (time-to-live). The next request for this key will be a cache hit. The async arrow means the client doesn't wait for the cache write to complete." },
        { id: "m6", from: "cache", to: "client", label: "OK", type: "return", order: 6, narration: "Cache is now warm for this key. Subsequent reads will hit the cache until TTL expires, at which point the cycle repeats -- ensuring data freshness." },
      ],
    },
  },

  // 6. Payment with Retry
  {
    id: "payment-retry",
    name: "Payment with Retry",
    description:
      "A payment flow demonstrating the retry pattern: the client initiates payment through the API, which calls Stripe. On transient failure, the service retries with exponential backoff before succeeding.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "api", name: "API Gateway", type: "object" },
        { id: "payment", name: "PaymentService", type: "object" },
        { id: "stripe", name: "Stripe", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "api", label: "POST /pay { amount, token }", type: "sync", order: 1, narration: "The client submits a payment request through the API gateway. The gateway handles authentication and rate limiting before forwarding to the payment service." },
        { id: "m2", from: "api", to: "payment", label: "processPayment(amount, token)", type: "sync", order: 2, narration: "The API gateway delegates to the PaymentService. This separation means payment logic is isolated and can be scaled independently from the gateway." },
        { id: "m3", from: "payment", to: "stripe", label: "charges.create(amount)", type: "sync", order: 3, narration: "The service calls Stripe's API to create a charge. This is a synchronous external call -- and the most fragile point in the flow because we depend on a third party." },
        { id: "m4", from: "stripe", to: "payment", label: "503 Service Unavailable", type: "return", order: 4, narration: "Stripe returned a transient error. A 503 means the service is temporarily overloaded -- not that the request is invalid. This is exactly the type of error worth retrying." },
        { id: "m5", from: "payment", to: "payment", label: "wait(backoff) + increment retry count", type: "self", order: 5, narration: "Exponential backoff: wait 1s, then 2s, then 4s. This gives Stripe time to recover and avoids overwhelming it with retry storms. The retry count prevents infinite loops." },
        { id: "m6", from: "payment", to: "stripe", label: "charges.create(amount) [retry #1]", type: "sync", order: 6, narration: "The same request is retried with an idempotency key. The key ensures Stripe won't charge twice even if the first attempt actually succeeded but the response was lost." },
        { id: "m7", from: "stripe", to: "payment", label: "{ chargeId, status: succeeded }", type: "return", order: 7, narration: "The retry succeeds. Stripe returns a charge ID that serves as the receipt. The idempotency key ensures this charge is only created once regardless of how many retries occurred." },
        { id: "m8", from: "payment", to: "api", label: "PaymentConfirmed(chargeId)", type: "return", order: 8, narration: "The PaymentService confirms success to the gateway. The chargeId is propagated up so the client can reference this specific transaction later." },
        { id: "m9", from: "api", to: "client", label: "200 OK { chargeId }", type: "return", order: 9, narration: "The client receives a success response. From the client's perspective, the retry was invisible -- the service abstracted away the transient failure entirely." },
      ],
    },
  },

  // 7. Saga Orchestration
  {
    id: "saga-orchestration",
    name: "Saga Orchestration",
    description:
      "Saga orchestration pattern for distributed transactions: an orchestrator coordinates multiple services sequentially. On failure, compensating transactions are executed in reverse order to maintain consistency.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "orchestrator", name: "SagaOrchestrator", type: "object" },
        { id: "inventory", name: "InventoryService", type: "object" },
        { id: "payment", name: "PaymentService", type: "object" },
        { id: "order", name: "OrderService", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "orchestrator", label: "createOrder(items, payment)", type: "sync", order: 1, narration: "The client sends a single request to the orchestrator. The orchestrator will coordinate multiple services -- the client doesn't need to know about the internal choreography." },
        { id: "m2", from: "orchestrator", to: "inventory", label: "reserveItems(items)", type: "sync", order: 2, narration: "Step 1 of the saga: reserve inventory first. Each step in a saga must have a corresponding compensating action in case a later step fails." },
        { id: "m3", from: "inventory", to: "orchestrator", label: "reservationConfirmed(reservationId)", type: "return", order: 3, narration: "Inventory reserved successfully. The orchestrator records the reservationId because it will need this to undo the reservation if a later step fails." },
        { id: "m4", from: "orchestrator", to: "payment", label: "chargeCard(amount)", type: "sync", order: 4, narration: "Step 2: charge the card. If this fails, we need to compensate step 1 (release the reservation). This ordering matters -- we reserved before charging." },
        { id: "m5", from: "payment", to: "orchestrator", label: "PAYMENT_FAILED (insufficient funds)", type: "return", order: 5, narration: "Payment failed due to insufficient funds. This is NOT a transient error (no point retrying), so the orchestrator must now undo all previously completed steps." },
        { id: "m6", from: "orchestrator", to: "orchestrator", label: "begin compensation", type: "self", order: 6, narration: "The orchestrator enters compensation mode. It walks backwards through completed steps, calling each compensating action. This is the core of the Saga pattern -- eventual consistency through rollback." },
        { id: "m7", from: "orchestrator", to: "inventory", label: "releaseReservation(reservationId)", type: "sync", order: 7, narration: "Compensating action for step 1: release the reserved inventory. The previously saved reservationId is used to identify exactly which reservation to undo." },
        { id: "m8", from: "inventory", to: "orchestrator", label: "reservationReleased", type: "return", order: 8, narration: "Inventory is restored. The system is now back to its original state -- as if the order was never attempted. This is eventual consistency in action." },
        { id: "m9", from: "orchestrator", to: "client", label: "ORDER_FAILED (payment declined, items released)", type: "return", order: 9, narration: "The client receives a clear failure with context: payment was declined and all side effects were reversed. The user can retry with a different payment method." },
      ],
    },
  },

  // 8. WebSocket Real-Time
  {
    id: "websocket-realtime",
    name: "WebSocket Real-Time",
    description:
      "WebSocket lifecycle showing the HTTP upgrade handshake, bidirectional server push messaging, heartbeat keep-alive, and graceful connection close.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "server", name: "WebSocket Server", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "server", label: "GET /ws (Upgrade: websocket)", type: "sync", order: 1, narration: "The connection starts as a normal HTTP request with an Upgrade header. This is the WebSocket handshake -- HTTP is used as the bootstrapping mechanism." },
        { id: "m2", from: "server", to: "client", label: "101 Switching Protocols", type: "return", order: 2, narration: "The server agrees to upgrade. Status 101 means the connection is now a persistent, full-duplex WebSocket -- no more HTTP request/response cycles." },
        { id: "m3", from: "server", to: "server", label: "register connection in pool", type: "self", order: 3, narration: "The server tracks this connection in memory so it can push data later. The connection pool is how the server knows which clients to notify when events occur." },
        { id: "m4", from: "server", to: "client", label: "push: { event: 'price.updated', data }", type: "async", order: 4, narration: "The server pushes data WITHOUT the client asking. This is the key advantage over HTTP polling -- zero latency from event to notification. No wasted requests." },
        { id: "m5", from: "server", to: "client", label: "push: { event: 'order.filled', data }", type: "async", order: 5, narration: "Another server-initiated push. Multiple events can be sent in rapid succession over the same connection -- no connection overhead per message." },
        { id: "m6", from: "client", to: "server", label: "ping (heartbeat)", type: "sync", order: 6, narration: "Heartbeats detect dead connections. Without them, the server would keep pushing data to disconnected clients, wasting resources and missing the need to clean up." },
        { id: "m7", from: "server", to: "client", label: "pong", type: "return", order: 7, narration: "The server responds to prove it's alive. If the client doesn't receive a pong within a timeout, it knows the connection is dead and should reconnect." },
        { id: "m8", from: "client", to: "server", label: "close(1000, 'user logout')", type: "sync", order: 8, narration: "Graceful shutdown: the client sends a close frame with status 1000 (normal closure) and a reason. This is cleaner than just dropping the TCP connection." },
        { id: "m9", from: "server", to: "server", label: "remove from connection pool", type: "self", order: 9, narration: "The server cleans up: removes the connection from the pool so no more events are pushed to this client. Failing to do this causes memory leaks." },
        { id: "m10", from: "server", to: "client", label: "close ACK", type: "return", order: 10, narration: "The server acknowledges the close. Both sides agree the connection is terminated. The TCP socket is now released for reuse by the operating system." },
      ],
    },
  },

  // 9. GraphQL Resolver Chain
  {
    id: "graphql-resolver-chain",
    name: "GraphQL Resolver Chain",
    description:
      "A GraphQL query resolution showing nested resolver execution: the client sends a query, and the server resolves user, posts, and comments in a chain, leveraging DataLoader for batched database access.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "graphql", name: "GraphQL Engine", type: "object" },
        { id: "user-resolver", name: "UserResolver", type: "object" },
        { id: "post-resolver", name: "PostResolver", type: "object" },
        { id: "comment-resolver", name: "CommentResolver", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "graphql", label: "query { user(id:1) { posts { comments } } }", type: "sync", order: 1, narration: "The client requests exactly the data it needs in a single query. Unlike REST, there are no multiple round trips -- the shape of the response is defined by the query itself." },
        { id: "m2", from: "graphql", to: "graphql", label: "parse & validate query", type: "self", order: 2, narration: "The engine parses the query string into an AST and validates it against the schema. Invalid queries are rejected before any resolver runs -- fail fast." },
        { id: "m3", from: "graphql", to: "user-resolver", label: "resolve User(id: 1)", type: "sync", order: 3, narration: "The engine resolves the query top-down. It starts with the root field 'user' and calls the UserResolver. Each field in the query maps to exactly one resolver function." },
        { id: "m4", from: "user-resolver", to: "graphql", label: "User { id: 1, name: 'Alice' }", type: "return", order: 4, narration: "The resolver returns the user object. The engine now knows this user exists and proceeds to resolve the nested 'posts' field using the user's ID as context." },
        { id: "m5", from: "graphql", to: "post-resolver", label: "resolve Posts(userId: 1)", type: "sync", order: 5, narration: "The engine resolves the nested 'posts' field. The parent user object provides the userId for the query. This is the resolver chain in action -- each level feeds the next." },
        { id: "m6", from: "post-resolver", to: "post-resolver", label: "DataLoader.load(postIds) — batched", type: "self", order: 6, narration: "DataLoader batches individual load calls into a single database query. Without batching, N posts would cause N separate DB queries (the N+1 problem)." },
        { id: "m7", from: "post-resolver", to: "graphql", label: "Post[] (3 posts)", type: "return", order: 7, narration: "Three posts returned. The engine now needs to resolve 'comments' for each post -- potentially 3 separate resolver calls, which DataLoader will batch." },
        { id: "m8", from: "graphql", to: "comment-resolver", label: "resolve Comments(postIds: [10,11,12])", type: "sync", order: 8, narration: "The engine resolves comments for all 3 posts. DataLoader already batched the postIds, so this is a single resolver call instead of three separate ones." },
        { id: "m9", from: "comment-resolver", to: "comment-resolver", label: "DataLoader.loadMany(postIds) — batched", type: "self", order: 9, narration: "DataLoader.loadMany issues one SELECT ... WHERE post_id IN (10,11,12) instead of three separate queries. This is the key performance optimization in any GraphQL server." },
        { id: "m10", from: "comment-resolver", to: "graphql", label: "Comment[][] (grouped by post)", type: "return", order: 10, narration: "Comments are returned grouped by post. The engine assembles the final response by stitching together user, posts, and comments into the shape requested by the client." },
        { id: "m11", from: "graphql", to: "client", label: "{ data: { user: { posts: [...] } } }", type: "return", order: 11, narration: "The client receives exactly the data it asked for -- no over-fetching, no under-fetching. One request, one response, with the exact shape defined in the query." },
      ],
    },
  },

  // 10. Distributed Transaction (2PC)
  {
    id: "two-phase-commit",
    name: "Distributed Transaction (2PC)",
    description:
      "Two-Phase Commit protocol: a coordinator asks all participants to prepare, collects votes, then issues a global commit. Demonstrates the classic distributed consensus approach for atomic cross-service transactions.",
    data: {
      participants: [
        { id: "coordinator", name: "Coordinator", type: "object" },
        { id: "participant1", name: "Participant A", type: "object" },
        { id: "participant2", name: "Participant B", type: "object" },
      ],
      messages: [
        { id: "m1", from: "coordinator", to: "coordinator", label: "begin transaction (txn-42)", type: "self", order: 1, narration: "The coordinator assigns a unique transaction ID. This ID will be referenced by all participants to ensure they're all talking about the same transaction." },
        { id: "m2", from: "coordinator", to: "participant1", label: "PREPARE (txn-42)", type: "sync", order: 2, narration: "Phase 1 begins: the coordinator asks Participant A if it CAN commit. The participant must check if it has the resources and locks available." },
        { id: "m3", from: "participant1", to: "participant1", label: "write to WAL, acquire locks", type: "self", order: 3, narration: "Participant A writes changes to its Write-Ahead Log and acquires locks. The WAL ensures durability -- even if the process crashes, it can recover its vote from the log." },
        { id: "m4", from: "participant1", to: "coordinator", label: "VOTE_COMMIT", type: "return", order: 4, narration: "Participant A votes YES. This is a binding promise -- once it votes COMMIT, it MUST be able to commit if the coordinator decides to proceed. No backing out." },
        { id: "m5", from: "coordinator", to: "participant2", label: "PREPARE (txn-42)", type: "sync", order: 5, narration: "The coordinator asks Participant B the same question. ALL participants must vote YES for the transaction to proceed -- any single NO means the whole transaction aborts." },
        { id: "m6", from: "participant2", to: "participant2", label: "write to WAL, acquire locks", type: "self", order: 6, narration: "Participant B also writes to its WAL and acquires locks. Both participants are now holding locks -- this is the window of vulnerability in 2PC where the system is blocked." },
        { id: "m7", from: "participant2", to: "coordinator", label: "VOTE_COMMIT", type: "return", order: 7, narration: "Participant B also votes YES. The coordinator now has unanimous agreement. If either had voted NO, the coordinator would send ABORT to all participants." },
        { id: "m8", from: "coordinator", to: "coordinator", label: "all votes = COMMIT → decide COMMIT", type: "self", order: 8, narration: "Phase 2 begins: the coordinator makes the irreversible decision to COMMIT. This decision is written to the coordinator's own log before notifying participants -- this is the 'point of no return'." },
        { id: "m9", from: "coordinator", to: "participant1", label: "COMMIT (txn-42)", type: "async", order: 9, narration: "The coordinator broadcasts the COMMIT decision. Async arrows because both participants are notified in parallel -- no need to wait for sequential responses." },
        { id: "m10", from: "coordinator", to: "participant2", label: "COMMIT (txn-42)", type: "async", order: 10, narration: "Participant B receives the same COMMIT instruction. Both participants will now make the changes permanent and release their locks." },
        { id: "m11", from: "participant1", to: "coordinator", label: "ACK (committed)", type: "return", order: 11, narration: "Participant A confirms it committed and released locks. The coordinator tracks these ACKs to know when the distributed transaction is fully complete." },
        { id: "m12", from: "participant2", to: "coordinator", label: "ACK (committed)", type: "return", order: 12, narration: "Participant B confirms the same. With all ACKs received, the coordinator can clean up the transaction record. The distributed transaction is atomically committed across both participants." },
      ],
    },
  },
];

export function getSequenceExampleById(
  id: string,
): (typeof SEQUENCE_EXAMPLES)[number] | undefined {
  return SEQUENCE_EXAMPLES.find((e) => e.id === id);
}
