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
      "A production HTTP request through a full infrastructure stack: client to API gateway, load balancer, application server, and database — with rate limiting, auth validation, connection pooling, and response serialization.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "gateway", name: "API Gateway", type: "object" },
        { id: "lb", name: "Load Balancer", type: "object" },
        { id: "app", name: "App Server", type: "object" },
        { id: "db", name: "Database", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "gateway", label: "GET /api/users (Bearer token)", type: "sync", order: 1, narration: "The client sends a request to the API gateway, not directly to the app server. The gateway is the single entry point -- it decouples clients from internal topology so backend services can scale independently." },
        { id: "m2", from: "gateway", to: "gateway", label: "rate limit check (token bucket)", type: "self", order: 2, narration: "The gateway checks the caller's rate limit using a token bucket algorithm. This happens BEFORE any expensive work -- rejecting abusive traffic early protects downstream services from overload and reduces infrastructure cost." },
        { id: "m3", from: "gateway", to: "gateway", label: "validate JWT + extract claims", type: "self", order: 3, narration: "Auth validation happens at the edge, not in the app server. The JWT signature is verified and claims (user ID, roles, scopes) are extracted. Centralizing auth here means individual services don't each need auth logic." },
        { id: "m4", from: "gateway", to: "lb", label: "forward request + X-User-Id header", type: "sync", order: 4, narration: "The gateway forwards the authenticated request to the load balancer with user identity injected as a trusted header. The original Bearer token is stripped -- downstream services trust the gateway's headers, not raw tokens." },
        { id: "m5", from: "lb", to: "app", label: "route to healthy instance (round-robin)", type: "sync", order: 5, narration: "The load balancer picks an app server using round-robin weighted by health checks. If an instance fails its health check, traffic is automatically routed away -- this is how zero-downtime deployments work." },
        { id: "m6", from: "app", to: "db", label: "conn pool checkout + SELECT * FROM users WHERE tenant_id=$1", type: "sync", order: 6, narration: "The app server checks out a connection from the pool rather than opening a new one (connection setup costs ~3ms). The query is parameterized to prevent SQL injection and scoped to the tenant for data isolation." },
        { id: "m7", from: "db", to: "app", label: "ResultSet (47 rows, 2.3ms)", type: "return", order: 7, narration: "The database returns rows and the connection is released back to the pool immediately. Connection pooling means 100 concurrent requests can share 10 database connections -- critical for PostgreSQL's process-per-connection model." },
        { id: "m8", from: "app", to: "app", label: "serialize DTOs + set Cache-Control", type: "self", order: 8, narration: "The app transforms raw rows into DTOs (stripping internal fields like password hashes) and sets Cache-Control headers. Proper cache headers let CDNs and browsers cache responses, reducing future load on this entire chain." },
        { id: "m9", from: "app", to: "lb", label: "200 OK { users: [...] }", type: "return", order: 9, narration: "The response propagates back through the load balancer. Response headers include X-Request-Id for distributed tracing -- if this request was slow, you can trace it across every hop in the chain." },
        { id: "m10", from: "lb", to: "client", label: "200 OK (Content-Type: application/json)", type: "return", order: 10, narration: "The client receives the final response. The entire round-trip traversed 5 components, but from the client's perspective it was a single HTTP call. Each layer added a specific production concern: rate limiting, auth, load balancing, pooling, and serialization." },
      ],
    },
  },

  // 2. OAuth Login Flow (PKCE)
  {
    id: "oauth-login",
    name: "OAuth Login Flow",
    description:
      "OAuth 2.0 Authorization Code flow with PKCE: the app generates a code verifier/challenge, redirects through the auth server with a state parameter, exchanges tokens server-to-server, then uses the access token to call the Resource Server.",
    data: {
      participants: [
        { id: "user", name: "User", type: "actor" },
        { id: "app", name: "App", type: "object" },
        { id: "auth", name: "Auth Server", type: "object" },
        { id: "resource", name: "Resource Server", type: "object" },
      ],
      messages: [
        { id: "m1", from: "user", to: "app", label: "Click 'Login with OAuth'", type: "sync", order: 1, narration: "The user wants to log in but the app doesn't handle credentials directly. Delegating to OAuth means the app never sees the user's password -- reducing liability and attack surface." },
        { id: "m2", from: "app", to: "app", label: "generate code_verifier + SHA256(code_challenge) + state", type: "self", order: 2, narration: "PKCE (Proof Key for Code Exchange): the app generates a random code_verifier and its SHA256 hash (code_challenge). The state parameter is a random nonce stored in session to prevent CSRF. These two mechanisms close the authorization code interception attack vector." },
        { id: "m3", from: "app", to: "auth", label: "redirect /authorize?client_id&code_challenge&state&scope=profile", type: "sync", order: 3, narration: "The app redirects the user's browser to the auth server with the code_challenge (not the verifier), a state nonce, and requested scopes. The auth server stores the challenge to verify later during token exchange." },
        { id: "m4", from: "auth", to: "user", label: "Show consent screen (requested scopes: profile)", type: "return", order: 4, narration: "The auth server shows what permissions the app is requesting. The user must explicitly consent -- this is the 'authorization' in OAuth. Scopes limit what the access token can do, following the principle of least privilege." },
        { id: "m5", from: "user", to: "auth", label: "Grant permission", type: "sync", order: 5, narration: "The user approves the requested scopes. The auth server now knows the user trusts this specific app with specific permissions. Consent is recorded so the user won't be prompted again for the same scopes." },
        { id: "m6", from: "auth", to: "app", label: "redirect /callback?code=abc&state=xyz", type: "return", order: 6, narration: "The auth server redirects back to the app with a short-lived authorization code AND the original state value. The app MUST verify the state matches what it stored in session -- a mismatch means a CSRF attack is in progress." },
        { id: "m7", from: "app", to: "app", label: "verify state matches session", type: "self", order: 7, narration: "The app checks that the returned state parameter matches the one it stored before the redirect. This prevents an attacker from tricking the user into completing an authorization flow initiated by the attacker." },
        { id: "m8", from: "app", to: "auth", label: "POST /token { code, code_verifier, client_id }", type: "sync", order: 8, narration: "The app exchanges the authorization code PLUS the original code_verifier for tokens. This back-channel request happens server-to-server. The auth server will SHA256 the verifier and compare it to the stored challenge -- proving the same app that started the flow is completing it." },
        { id: "m9", from: "auth", to: "app", label: "{ access_token, refresh_token, expires_in: 3600 }", type: "return", order: 9, narration: "The auth server returns an access token (short-lived, 1 hour) and a refresh token (long-lived, for getting new access tokens without re-prompting the user). Two tokens with different lifetimes maximize both security and convenience." },
        { id: "m10", from: "app", to: "resource", label: "GET /api/profile (Authorization: Bearer access_token)", type: "sync", order: 10, narration: "The app uses the access token to call the Resource Server on behalf of the user. The Resource Server is a separate service from the Auth Server -- this separation is key to OAuth's architecture. The token acts as a capability credential." },
        { id: "m11", from: "resource", to: "app", label: "{ id, name, email, avatar_url }", type: "return", order: 11, narration: "The Resource Server validates the token (either by introspecting it with the Auth Server or by verifying its JWT signature) and returns only the data the token's scopes allow. An expired or revoked token would return 401." },
        { id: "m12", from: "app", to: "user", label: "Login successful (session created)", type: "return", order: 12, narration: "The app creates a server-side session for the user using the profile data from the Resource Server. The entire flow happened without the app ever knowing the user's password, and PKCE ensured the authorization code couldn't be intercepted." },
      ],
    },
  },

  // 3. Order Processing
  {
    id: "order-processing",
    name: "Order Processing",
    description:
      "Production e-commerce order flow: the user places an order, the OrderService coordinates payment authorization (not capture), inventory reservation, database persistence, and asynchronous notification -- with idempotency and compensation semantics.",
    data: {
      participants: [
        { id: "user", name: "User", type: "actor" },
        { id: "order", name: "OrderService", type: "object" },
        { id: "payment", name: "PaymentService", type: "object" },
        { id: "inventory", name: "InventoryService", type: "object" },
        { id: "db", name: "Database", type: "object" },
        { id: "notify", name: "NotificationService", type: "object" },
      ],
      messages: [
        { id: "m1", from: "user", to: "order", label: "placeOrder(cart, idempotencyKey)", type: "sync", order: 1, narration: "The user submits their cart for checkout with an idempotency key. The key ensures that if the user accidentally double-clicks or the network retries, the order is only created once. The OrderService becomes the orchestrator for payment, inventory, and persistence." },
        { id: "m2", from: "order", to: "order", label: "validate order + check idempotency key", type: "self", order: 2, narration: "Before charging money or reserving inventory, the service validates the order: are items still available? Is the total correct? Is this a duplicate request? Catching errors here prevents costly compensation later and the idempotency check prevents double-charging." },
        { id: "m3", from: "order", to: "payment", label: "authorizeCard(amount, idempotencyKey)", type: "sync", order: 3, narration: "Payment is AUTHORIZED first -- not captured. Authorization places a hold on the customer's card without moving money. This gives us a window (typically 7 days) to roll back if inventory reservation fails, without needing a refund." },
        { id: "m4", from: "payment", to: "order", label: "paymentAuthorized(authId, holdExpiry)", type: "return", order: 4, narration: "Payment is authorized, not captured. The authId is saved for later capture, and the holdExpiry tells us the deadline to complete the order. If inventory fails, we simply release the hold -- no money moved, no refund needed. This is cheaper and faster than charge-then-refund." },
        { id: "m5", from: "order", to: "inventory", label: "reserveItems(items, orderId)", type: "sync", order: 5, narration: "Now that payment is authorized, we reserve inventory. This two-step approach (authorize then reserve) is deliberate -- it follows the 'compensating transaction' pattern. If reservation fails, we release the payment hold as the compensating action." },
        { id: "m6", from: "inventory", to: "order", label: "reservationConfirmed(reservationId)", type: "return", order: 6, narration: "Inventory is reserved and deducted from available stock. The reservationId is stored for traceability. If this had failed, the OrderService would release the payment authorization -- a compensation that costs nothing because no money was captured." },
        { id: "m7", from: "order", to: "db", label: "INSERT order (status=CONFIRMED, authId, reservationId)", type: "sync", order: 7, narration: "The OrderService persists the order to the database with all cross-service references (authId, reservationId). This happens AFTER both payment and inventory succeed -- ensuring we never have a DB record for a partially-completed order. The status is CONFIRMED, pending fulfillment." },
        { id: "m8", from: "db", to: "order", label: "orderId: ORD-20240315-7829", type: "return", order: 8, narration: "The database confirms persistence and returns the generated order ID. This ID becomes the canonical reference for the customer, support team, and all downstream systems. The order is now durable -- even if the server crashes here, the order survives." },
        { id: "m9", from: "order", to: "notify", label: "sendConfirmation(orderId, email) [async]", type: "async", order: 9, narration: "The OrderService fires an async notification. This is deliberately async (dashed arrow) -- the user should not wait for an email to be sent before seeing their confirmation. If the notification fails, a retry queue will handle it. The order is already confirmed regardless." },
        { id: "m10", from: "order", to: "user", label: "orderConfirmation(ORD-20240315-7829)", type: "return", order: 10, narration: "The user receives their confirmation immediately with the order ID. The response does NOT wait for the notification to be delivered. Behind the scenes, fulfillment picks up the order, payment capture happens at shipment, and the customer gets an email -- all asynchronously." },
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
        { id: "m1", from: "publisher", to: "broker", label: "publish('user.created', payload)", type: "async", order: 1, narration: "The publisher sends asynchronously — does not block waiting for broker acknowledgment. It doesn't know or care who is listening. This decoupling means you can add new subscribers without changing the publisher code." },
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
      "Cache-aside (lazy loading) showing both the fast path (cache HIT) and slow path (cache MISS with database fallback and cache population). Covers TTL strategy, cache invalidation, and the tradeoffs between write-through vs write-behind approaches.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "cache", name: "Cache", type: "object" },
        { id: "db", name: "Database", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "cache", label: "GET user:1001", type: "sync", order: 1, narration: "First request for this key. Always check the cache first -- a cache hit returns data in ~0.5ms vs ~5-50ms for a database query. The key format 'user:1001' uses a namespace prefix to avoid collisions across entity types." },
        { id: "m2", from: "cache", to: "client", label: "MISS (null)", type: "return", order: 2, narration: "Cache miss -- the data isn't cached yet (cold start, TTL expired, or LRU evicted). The client must fall through to the database. This is the 'lazy loading' aspect of cache-aside: data is only cached when actually requested." },
        { id: "m3", from: "client", to: "db", label: "SELECT * FROM users WHERE id=1001", type: "sync", order: 3, narration: "The client queries the source of truth directly. In cache-aside, the CLIENT is responsible for both reading from the database and populating the cache -- the cache never talks to the database. This keeps the cache layer simple and stateless." },
        { id: "m4", from: "db", to: "client", label: "{ id: 1001, name: 'Alice', email: '...' }", type: "return", order: 4, narration: "The database returns the authoritative data. This is the slow path -- but it only happens once per unique key until the cache entry expires. The result becomes both the response to the caller and the value to cache." },
        { id: "m5", from: "client", to: "cache", label: "SET user:1001 value TTL=300s", type: "async", order: 5, narration: "The client populates the cache with a 5-minute TTL. The TTL is a tradeoff: too short means frequent cache misses (more DB load), too long means stale data. 300s works for user profiles that change infrequently. The async arrow means the client doesn't block on the cache write." },
        { id: "m6", from: "cache", to: "client", label: "OK (cached)", type: "return", order: 6, narration: "Cache is now warm for this key. The cache-aside pattern is simpler than write-through (where writes go to cache AND DB simultaneously) because only reads populate the cache. The tradeoff is that the first request per key is always slow." },
        { id: "m7", from: "client", to: "cache", label: "GET user:1001 (second request)", type: "sync", order: 7, narration: "A subsequent request for the same key. This time the cache is warm -- the entire database round-trip will be skipped. In production, this is the common case: cache hit ratios of 95%+ mean 19 out of 20 requests never touch the database." },
        { id: "m8", from: "cache", to: "client", label: "HIT { id: 1001, name: 'Alice', email: '...' }", type: "return", order: 8, narration: "Cache hit -- data returned in microseconds. No database query needed. This is why cache-aside is so effective for read-heavy workloads: the hot path is just two network hops (client-cache-client) instead of four." },
        { id: "m9", from: "client", to: "db", label: "UPDATE users SET name='Bob' WHERE id=1001", type: "sync", order: 9, narration: "A write occurs. In cache-aside, writes go directly to the database, not through the cache. The critical question is: how do we prevent the cache from serving stale data? Two options: invalidate (delete the key) or update (write-through)." },
        { id: "m10", from: "db", to: "client", label: "UPDATE OK (1 row affected)", type: "return", order: 10, narration: "The database confirms the write. The data in the database is now 'Bob' but the cache still has 'Alice'. Without the next step, clients would read stale data for up to 300 seconds (the TTL)." },
        { id: "m11", from: "client", to: "cache", label: "DEL user:1001 (invalidate)", type: "async", order: 11, narration: "Cache invalidation: delete the stale entry rather than updating it. This is safer than write-through because it avoids race conditions where two concurrent writes could leave the cache with the wrong value. The next read will simply trigger a cache miss and re-populate from the database." },
        { id: "m12", from: "cache", to: "client", label: "OK (invalidated)", type: "return", order: 12, narration: "The stale entry is removed. The next GET for user:1001 will miss and re-fetch 'Bob' from the database. This invalidate-on-write pattern (vs write-through or write-behind) is the most common production strategy because it's simple, correct, and avoids the thundering herd problem when combined with request coalescing." },
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
        { id: "m9", from: "orchestrator", to: "order", label: "markOrderFailed(orderId)", type: "sync", order: 9, narration: "The orchestrator updates the order status to FAILED. Even though the saga is rolling back, the OrderService must persist the final outcome so the order is queryable and auditable." },
        { id: "m10", from: "order", to: "orchestrator", label: "orderMarkedFailed", type: "return", order: 10, narration: "The OrderService confirms the status update. The order record now reflects the failure reason and compensation actions taken -- critical for support and debugging." },
        { id: "m11", from: "orchestrator", to: "client", label: "ORDER_FAILED (payment declined, items released)", type: "return", order: 11, narration: "The client receives a clear failure with context: payment was declined and all side effects were reversed. The user can retry with a different payment method." },
      ],
    },
  },

  // 8. WebSocket Real-Time
  {
    id: "websocket-realtime",
    name: "WebSocket Real-Time",
    description:
      "Production WebSocket architecture with load balancing, horizontal scaling via Redis Pub/Sub, room subscriptions, RFC 6455-compliant server-initiated heartbeats, and reconnection with message replay.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "lb", name: "Load Balancer", type: "object" },
        { id: "ws", name: "WebSocket Server", type: "object" },
        { id: "redis", name: "Redis Pub/Sub", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "lb", label: "GET /ws (Upgrade: websocket, Connection: Upgrade)", type: "sync", order: 1, narration: "The connection starts as a normal HTTP request with Upgrade headers. The load balancer must support WebSocket upgrades -- not all L7 load balancers do. This is why Nginx needs 'proxy_set_header Upgrade' explicitly configured." },
        { id: "m2", from: "lb", to: "ws", label: "route (sticky session via IP hash / cookie)", type: "sync", order: 2, narration: "The load balancer uses sticky sessions (IP hash or cookie-based) to route this client to a specific WebSocket server. Unlike HTTP, WebSocket connections are stateful and long-lived -- if the client reconnects, it must reach the SAME server or lose its subscription state." },
        { id: "m3", from: "ws", to: "client", label: "101 Switching Protocols", type: "return", order: 3, narration: "The server agrees to upgrade. Status 101 means the TCP connection is now a persistent, full-duplex WebSocket. The load balancer keeps the connection open and proxies frames bidirectionally without interpreting them." },
        { id: "m4", from: "client", to: "ws", label: "subscribe({ room: 'trading:BTC-USD' })", type: "sync", order: 4, narration: "The client joins a room/channel after connecting. Rooms are how the server knows WHICH events to send to WHICH clients. Without room-based routing, every client would receive every event -- wasting bandwidth and leaking data across tenants." },
        { id: "m5", from: "ws", to: "redis", label: "SUBSCRIBE trading:BTC-USD", type: "sync", order: 5, narration: "The WebSocket server subscribes to the Redis Pub/Sub channel for this room. Redis is the coordination layer that enables horizontal scaling -- if another WS server instance publishes to this channel, THIS server will receive it and forward to its local clients." },
        { id: "m6", from: "redis", to: "ws", label: "message: { event: 'price.updated', price: 64210.50 }", type: "async", order: 6, narration: "An event arrives via Redis Pub/Sub (published by another service or WS server instance). Redis fans out to all WS servers subscribed to this channel -- this is how a single publish reaches clients connected to ANY server in the cluster." },
        { id: "m7", from: "ws", to: "client", label: "push: { event: 'price.updated', price: 64210.50, seq: 42 }", type: "async", order: 7, narration: "The server pushes the event to the client with a sequence number. The seq number enables the client to detect missed messages on reconnection -- it can request replay from its last known seq. Without this, a brief disconnect means lost data." },
        { id: "m8", from: "ws", to: "client", label: "ping (server-initiated per RFC 6455)", type: "async", order: 8, narration: "Per RFC 6455, the SERVER sends ping frames to detect dead connections -- not the client. The server must proactively detect clients that silently disconnected (e.g., mobile network switch, laptop sleep) to free resources and stop queuing undeliverable messages." },
        { id: "m9", from: "client", to: "ws", label: "pong (mandatory response)", type: "return", order: 9, narration: "The client MUST respond with a pong frame containing the same payload. Per the RFC, the pong response is mandatory. If the server doesn't receive a pong within its timeout (typically 30s), it considers the connection dead and cleans up." },
        { id: "m10", from: "ws", to: "ws", label: "detect: pong timeout (connection dead)", type: "self", order: 10, narration: "The server detects that a previous client failed to pong in time. It removes the connection from the local pool and unsubscribes from Redis channels that no longer have local listeners -- preventing memory leaks and zombie subscriptions." },
        { id: "m11", from: "client", to: "lb", label: "reconnect /ws (last_seq=42, exponential backoff)", type: "sync", order: 11, narration: "The client reconnects after detecting the lost connection (no pong to its own keep-alive, or a network change event). It uses exponential backoff with jitter (1s, 2s, 4s + random) to avoid a thundering herd of simultaneous reconnections. It sends its last_seq so the server can replay missed messages." },
        { id: "m12", from: "ws", to: "client", label: "replay: messages seq 43-47 + live stream resumes", type: "async", order: 12, narration: "The server replays missed messages from a short-term buffer (Redis Streams or in-memory ring buffer) and then resumes the live stream. The client experiences seamless continuity -- no data loss despite the brief disconnect. This replay window is typically 5-60 minutes depending on buffer size." },
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

  // 11. Rate Limiting Flow
  {
    id: "rate-limiting",
    name: "Rate Limiting Flow",
    description:
      "How an API gateway enforces rate limits using a token bucket algorithm. Shows both the allowed and rejected paths, including Retry-After headers and distributed rate limiting considerations.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "gateway", name: "APIGateway", type: "object" },
        { id: "ratelimit", name: "RateLimitService", type: "object" },
        { id: "backend", name: "BackendAPI", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "gateway", label: "sendRequest(apiKey)", type: "sync", order: 1, narration: "The client sends a request with its API key. The gateway intercepts every inbound request before it reaches any backend service -- rate limiting is the first check after authentication." },
        { id: "m2", from: "gateway", to: "ratelimit", label: "checkLimit(apiKey, endpoint)", type: "sync", order: 2, narration: "The gateway delegates rate-limit evaluation to a dedicated service. Centralizing this logic means every endpoint is protected uniformly. In production, this service typically backs onto Redis for sub-millisecond lookups across multiple gateway instances." },
        { id: "m3", from: "ratelimit", to: "ratelimit", label: "consumeToken(bucket)", type: "self", order: 3, narration: "The token bucket algorithm: each API key has a bucket that refills at a fixed rate (e.g. 100 tokens/minute). Each request consumes one token. This is simpler than sliding-window counters and naturally allows short bursts while enforcing a long-term average rate." },
        { id: "m4", from: "ratelimit", to: "gateway", label: "allowed (tokens remaining: 42)", type: "return", order: 4, narration: "The bucket still has tokens -- this request is allowed. The remaining count is returned so the gateway can set X-RateLimit-Remaining headers, giving the client visibility into its quota." },
        { id: "m5", from: "gateway", to: "backend", label: "forwardRequest()", type: "sync", order: 5, narration: "The gateway forwards the request to the actual backend service. The backend never needs to know about rate limiting -- separation of concerns keeps the backend focused on business logic." },
        { id: "m6", from: "backend", to: "gateway", label: "200 OK { data }", type: "return", order: 6, narration: "The backend processes the request normally and returns data. The gateway will relay this to the client along with rate-limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)." },
        { id: "m7", from: "gateway", to: "client", label: "200 OK + X-RateLimit-Remaining: 42", type: "return", order: 7, narration: "The client receives the response with rate-limit metadata in headers. Well-behaved clients use these headers to self-throttle before hitting the limit -- reducing unnecessary 429 responses." },
        { id: "m8", from: "client", to: "gateway", label: "sendRequest(apiKey) [burst]", type: "sync", order: 8, narration: "The client sends another request. In a burst scenario, many requests arrive in quick succession -- faster than the bucket refills. This is where the token bucket earns its keep." },
        { id: "m9", from: "gateway", to: "ratelimit", label: "checkLimit(apiKey, endpoint)", type: "sync", order: 9, narration: "The gateway checks the rate limit again. In a distributed setup with multiple gateway nodes, this Redis-backed check ensures a global view -- a client can't bypass limits by hitting different nodes." },
        { id: "m10", from: "ratelimit", to: "ratelimit", label: "consumeToken(bucket) — EMPTY", type: "self", order: 10, narration: "The bucket is empty -- no tokens left. The sliding-window alternative would count requests in a rolling time window, but token bucket is preferred here because it handles bursts more gracefully while maintaining the same average rate." },
        { id: "m11", from: "ratelimit", to: "gateway", label: "rejected (retryAfter: 8s)", type: "return", order: 11, narration: "The service returns a rejection with a computed retry-after interval. This value tells the client exactly when the bucket will have tokens again, preventing blind retry storms." },
        { id: "m12", from: "gateway", to: "client", label: "429 Too Many Requests + Retry-After: 8", type: "return", order: 12, narration: "The gateway returns HTTP 429 with a Retry-After header. The Retry-After header (RFC 7231) is critical -- without it, clients retry immediately in tight loops, making congestion worse. Exponential backoff on the client side complements this server-side signal." },
      ],
    },
  },

  // 12. Circuit Breaker
  {
    id: "circuit-breaker-flow",
    name: "Circuit Breaker",
    description:
      "How a circuit breaker protects against cascading failures in microservices. Demonstrates the three states -- closed, open, and half-open -- and how the breaker transitions between them as failures accumulate and recovery is probed.",
    data: {
      participants: [
        { id: "serviceA", name: "ServiceA", type: "object" },
        { id: "breaker", name: "CircuitBreaker", type: "object" },
        { id: "serviceB", name: "ServiceB", type: "object" },
      ],
      messages: [
        { id: "m1", from: "serviceA", to: "breaker", label: "call(request) [circuit CLOSED]", type: "sync", order: 1, narration: "In the CLOSED state, the circuit breaker is transparent -- it forwards every request. This is the normal operating mode. The breaker silently tracks success/failure counts behind the scenes." },
        { id: "m2", from: "breaker", to: "serviceB", label: "forwardRequest()", type: "sync", order: 2, narration: "The breaker passes the request through to ServiceB. While closed, it behaves like a simple proxy with zero overhead beyond counter bookkeeping." },
        { id: "m3", from: "serviceB", to: "breaker", label: "500 Internal Server Error", type: "return", order: 3, narration: "ServiceB returns an error. The breaker increments its failure counter (now 1 of 3 threshold). A single failure is not enough to trip the circuit -- transient errors are normal." },
        { id: "m4", from: "breaker", to: "serviceA", label: "500 (failure 1/3)", type: "return", order: 4, narration: "The error is relayed to ServiceA. The breaker is still closed because the failure threshold (3) has not been reached. ServiceA may retry or handle the error itself." },
        { id: "m5", from: "serviceA", to: "breaker", label: "call(request) [retry]", type: "sync", order: 5, narration: "ServiceA retries the request. The circuit is still closed, so the breaker will forward it. If this fails too, we're one step closer to tripping the breaker." },
        { id: "m6", from: "breaker", to: "serviceB", label: "forwardRequest()", type: "sync", order: 6, narration: "Second attempt forwarded to ServiceB. The breaker is still in closed state but the failure counter is already at 1." },
        { id: "m7", from: "serviceB", to: "breaker", label: "500 Internal Server Error", type: "return", order: 7, narration: "Another failure -- counter is now 2 of 3. ServiceB may be experiencing a prolonged outage: database down, memory pressure, or a deployment gone wrong." },
        { id: "m8", from: "serviceA", to: "breaker", label: "call(request) [retry]", type: "sync", order: 8, narration: "Third attempt. The breaker will forward this, but if it fails, the threshold is reached. Libraries like Resilience4j and Netflix Hystrix make this threshold configurable per downstream service." },
        { id: "m9", from: "breaker", to: "serviceB", label: "forwardRequest()", type: "sync", order: 9, narration: "The breaker forwards the third attempt. This is the last chance before the circuit opens." },
        { id: "m10", from: "serviceB", to: "breaker", label: "500 Internal Server Error", type: "return", order: 10, narration: "Third consecutive failure. The breaker now trips -- transitioning from CLOSED to OPEN. All future requests will be fast-failed without contacting ServiceB, preventing cascading failure." },
        { id: "m11", from: "breaker", to: "breaker", label: "state → OPEN (start timeout: 30s)", type: "self", order: 11, narration: "The circuit opens and a recovery timeout starts (e.g. 30 seconds). During this window, no traffic reaches ServiceB -- giving it time to recover without being hammered by requests that would only make things worse." },
        { id: "m12", from: "serviceA", to: "breaker", label: "call(request) [circuit OPEN]", type: "sync", order: 12, narration: "A new request arrives while the circuit is open. The breaker will fast-fail this immediately without calling ServiceB -- returning a 503 in microseconds instead of waiting for a timeout." },
        { id: "m13", from: "breaker", to: "serviceA", label: "503 Service Unavailable (fast-fail)", type: "return", order: 13, narration: "Instant rejection. This is the key benefit: instead of waiting 30 seconds for a timeout from a dead service, the caller gets a failure in microseconds. Resources (threads, connections) are freed for healthy paths." },
        { id: "m14", from: "breaker", to: "breaker", label: "timeout expired → state HALF-OPEN", type: "self", order: 14, narration: "After the timeout expires, the breaker enters HALF-OPEN state. It will allow exactly one probe request through to test whether ServiceB has recovered. This avoids slamming a recovering service with full traffic." },
        { id: "m15", from: "serviceA", to: "breaker", label: "call(request) [HALF-OPEN probe]", type: "sync", order: 15, narration: "The next request becomes the probe. Only one request is allowed through in half-open state -- if it succeeds, traffic resumes; if it fails, the circuit reopens for another timeout period." },
        { id: "m16", from: "breaker", to: "serviceB", label: "forwardRequest() [probe]", type: "sync", order: 16, narration: "The single probe request reaches ServiceB. If ServiceB has recovered (e.g. restarted, scaled up, database reconnected), this call will succeed and the circuit will close." },
        { id: "m17", from: "serviceB", to: "breaker", label: "200 OK { data }", type: "return", order: 17, narration: "The probe succeeds -- ServiceB is healthy again. The breaker resets its failure counter and transitions back to CLOSED, resuming normal traffic flow." },
        { id: "m18", from: "breaker", to: "breaker", label: "state → CLOSED (reset counters)", type: "self", order: 18, narration: "The circuit closes and all counters reset to zero. The system has self-healed. The entire CLOSED-OPEN-HALF_OPEN-CLOSED cycle happened automatically without any human intervention or deployment." },
        { id: "m19", from: "breaker", to: "serviceA", label: "200 OK { data }", type: "return", order: 19, narration: "The successful response reaches ServiceA. From this point forward, all requests flow through normally until the next failure threshold is hit. The circuit breaker pattern prevents cascading failures while allowing automatic recovery." },
      ],
    },
  },

  // 13. API Gateway Three-Tier
  {
    id: "api-gateway-flow",
    name: "API Gateway Three-Tier",
    description:
      "Complete request flow through a modern cloud API gateway to microservice to database. Covers CDN caching, JWT authentication, Redis cache-aside, and PostgreSQL queries -- the full stack of a production read path.",
    data: {
      participants: [
        { id: "mobile", name: "MobileClient", type: "actor" },
        { id: "cdn", name: "CDN", type: "object" },
        { id: "gateway", name: "APIGateway", type: "object" },
        { id: "auth", name: "AuthService", type: "object" },
        { id: "userservice", name: "UserService", type: "object" },
        { id: "postgres", name: "PostgreSQL", type: "object" },
        { id: "redis", name: "RedisCache", type: "object" },
      ],
      messages: [
        { id: "m1", from: "mobile", to: "cdn", label: "GET /api/users/me", type: "sync", order: 1, narration: "The mobile client sends a request that first hits the CDN edge. CDNs can cache API responses (not just static assets) when Cache-Control headers allow it -- reducing latency from 200ms to under 20ms for cache hits." },
        { id: "m2", from: "cdn", to: "cdn", label: "check edge cache (key: path + auth hash)", type: "self", order: 2, narration: "The CDN checks its edge cache. For authenticated endpoints, the cache key includes a hash of the Authorization header to avoid serving one user's data to another. CDN hit ratios for personalized APIs are typically 30-50%, still valuable at scale." },
        { id: "m3", from: "cdn", to: "gateway", label: "MISS — forward to origin", type: "sync", order: 3, narration: "Cache miss at the CDN edge. The request is forwarded to the API gateway origin. The CDN adds X-Forwarded-For and X-Request-ID headers for tracing the request through the entire stack." },
        { id: "m4", from: "gateway", to: "auth", label: "validateJWT(token)", type: "sync", order: 4, narration: "The gateway extracts the Bearer token and sends it to the AuthService for validation. JWT validation involves signature verification (RS256/ES256), expiry check, and scope verification. This adds 2-5ms of overhead per request." },
        { id: "m5", from: "auth", to: "auth", label: "verify signature + check expiry + extract claims", type: "self", order: 5, narration: "The AuthService verifies the JWT signature using the public key, checks the exp claim has not passed, and extracts the user ID and scopes from the payload. Asymmetric signing (RS256) means the gateway can verify without knowing the private key." },
        { id: "m6", from: "auth", to: "gateway", label: "valid (userId: 7, scopes: [read:profile])", type: "return", order: 6, narration: "The token is valid. The AuthService returns the decoded claims so the gateway can make authorization decisions and pass the userId downstream without the UserService needing to decode the JWT again." },
        { id: "m7", from: "gateway", to: "userservice", label: "getUserProfile(userId: 7)", type: "sync", order: 7, narration: "The gateway routes the authenticated request to the UserService. The gateway has already extracted the userId from the JWT, so the UserService receives a clean, trusted parameter -- no token parsing needed." },
        { id: "m8", from: "userservice", to: "redis", label: "GET user:7:profile", type: "sync", order: 8, narration: "The UserService checks Redis before hitting PostgreSQL. Redis responds in under 1ms versus 5-20ms for a PostgreSQL query. At 10,000 requests/second, this cache layer saves hundreds of database connections." },
        { id: "m9", from: "redis", to: "userservice", label: "MISS (nil)", type: "return", order: 9, narration: "Cache miss in Redis -- the profile is not cached or the TTL expired. The service falls through to PostgreSQL. This is the cache-aside pattern: the application code controls when to read from cache versus database." },
        { id: "m10", from: "userservice", to: "postgres", label: "SELECT * FROM users WHERE id = 7", type: "sync", order: 10, narration: "The UserService queries PostgreSQL using a connection from its pool. Connection pooling (e.g. PgBouncer or built-in pool) is critical -- creating a new TCP connection per query costs 20-50ms and exhausts database connection limits under load." },
        { id: "m11", from: "postgres", to: "userservice", label: "{ id: 7, name, email, avatar_url }", type: "return", order: 11, narration: "PostgreSQL returns the user row. The query plan uses the primary key index, so this is an index-only scan -- O(log n) regardless of table size. The database connection is returned to the pool immediately." },
        { id: "m12", from: "userservice", to: "redis", label: "SETEX user:7:profile 300 {data}", type: "async", order: 12, narration: "The service populates the Redis cache with a 5-minute TTL (SETEX = SET + EXPIRE atomically). Async because the response should not be delayed by a cache write. Next time this user's profile is requested, it will be a Redis hit." },
        { id: "m13", from: "userservice", to: "gateway", label: "{ profile: { id: 7, name, email } }", type: "return", order: 13, narration: "The UserService returns the profile to the gateway. The gateway will add Cache-Control headers so the CDN can cache this response at the edge for future requests from the same user." },
        { id: "m14", from: "gateway", to: "cdn", label: "200 OK + Cache-Control: private, max-age=60", type: "return", order: 14, narration: "The gateway returns the response through the CDN with cache headers. 'private' means only the CDN edge (keyed by auth hash) can cache it, not shared proxies. The CDN stores it for 60 seconds." },
        { id: "m15", from: "cdn", to: "mobile", label: "200 OK { profile }", type: "return", order: 15, narration: "The mobile client receives the full profile. The total latency was CDN miss + JWT validation + Redis miss + PostgreSQL query -- about 50-100ms. On the next request within 60 seconds, the CDN returns in under 20ms." },
      ],
    },
  },

  // 14. Leader Election (Raft)
  {
    id: "leader-election",
    name: "Leader Election (Raft)",
    description:
      "Simplified Raft consensus protocol for leader election in a distributed system. Covers election timeout, RequestVote RPCs, majority quorum, and heartbeat-based leadership maintenance with a brief split-vote scenario.",
    data: {
      participants: [
        { id: "follower1", name: "Follower1", type: "object" },
        { id: "follower2", name: "Follower2", type: "object" },
        { id: "candidate", name: "Candidate", type: "object" },
        { id: "follower3", name: "Follower3", type: "object" },
      ],
      messages: [
        { id: "m1", from: "candidate", to: "candidate", label: "election timeout expired — increment term to T+1", type: "self", order: 1, narration: "Each Raft node has a randomized election timeout (e.g. 150-300ms). When a follower hasn't heard from the leader within this window, it assumes the leader is dead, increments the term counter, and becomes a candidate. The randomized timeout prevents all nodes from starting elections simultaneously." },
        { id: "m2", from: "candidate", to: "candidate", label: "vote for self (1/3 majority)", type: "self", order: 2, narration: "The candidate votes for itself first. In a 4-node cluster, it needs 3 votes (majority) to win. The term number acts as a logical clock -- nodes reject votes for candidates with stale terms, preventing split-brain scenarios." },
        { id: "m3", from: "candidate", to: "follower1", label: "RequestVote(term=T+1, lastLogIndex=5)", type: "sync", order: 3, narration: "The candidate sends RequestVote RPCs to all other nodes in parallel. The lastLogIndex proves the candidate's log is at least as up-to-date as the follower's -- a follower will not vote for a candidate with a shorter log." },
        { id: "m4", from: "candidate", to: "follower2", label: "RequestVote(term=T+1, lastLogIndex=5)", type: "sync", order: 4, narration: "Same RequestVote sent to Follower2 in parallel. Raft's key insight: elections happen in terms, and each node can only vote once per term. This prevents two candidates from both getting a majority in the same term." },
        { id: "m5", from: "candidate", to: "follower3", label: "RequestVote(term=T+1, lastLogIndex=5)", type: "sync", order: 5, narration: "RequestVote also sent to Follower3. Even if this node is slow or partitioned, the candidate only needs 2 more votes (already has its own). This is why odd-cluster sizes (3, 5, 7) are preferred -- they tolerate more failures." },
        { id: "m6", from: "follower1", to: "candidate", label: "VoteGranted(term=T+1)", type: "return", order: 6, narration: "Follower1 grants its vote. It checks: (1) is the candidate's term >= my current term? (2) have I already voted this term? (3) is the candidate's log at least as up-to-date as mine? All conditions met, vote granted." },
        { id: "m7", from: "follower2", to: "candidate", label: "VoteGranted(term=T+1)", type: "return", order: 7, narration: "Follower2 also grants its vote. The candidate now has 3 votes (self + Follower1 + Follower2) out of 4 nodes -- a majority. It can declare itself leader even before Follower3 responds." },
        { id: "m8", from: "candidate", to: "candidate", label: "majority achieved (3/4) — become Leader", type: "self", order: 8, narration: "The candidate transitions to Leader state. It won the election for term T+1. If two candidates had split the vote evenly (2-2), neither would get majority, both would time out, and a new election with term T+2 would start -- the randomized timeout makes repeated splits unlikely." },
        { id: "m9", from: "follower3", to: "candidate", label: "VoteGranted(term=T+1)", type: "return", order: 9, narration: "Follower3's late vote arrives but is redundant -- the leader already has majority. In a partition scenario, if Follower3 were unreachable, the election would still succeed. Raft tolerates up to (N-1)/2 failures in an N-node cluster." },
        { id: "m10", from: "candidate", to: "follower1", label: "AppendEntries(term=T+1, entries=[], leaderCommit)", type: "async", order: 10, narration: "The new leader immediately sends AppendEntries RPCs (heartbeats) to all followers to assert its authority. Empty entries mean this is a heartbeat, not a log replication. Followers reset their election timers upon receiving this." },
        { id: "m11", from: "candidate", to: "follower2", label: "AppendEntries(term=T+1, entries=[], leaderCommit)", type: "async", order: 11, narration: "Heartbeat to Follower2. The leader must send heartbeats at intervals shorter than the election timeout (e.g. every 50ms if timeout is 150-300ms). If heartbeats stop, followers will start a new election -- this is how Raft detects leader failure." },
        { id: "m12", from: "candidate", to: "follower3", label: "AppendEntries(term=T+1, entries=[], leaderCommit)", type: "async", order: 12, narration: "Heartbeat to Follower3 completes the leadership announcement. Log replication also uses AppendEntries -- when clients write data, the leader appends it to its log and replicates via the same RPC. Entries are committed once a majority of followers acknowledge them." },
      ],
    },
  },

  // 15. Event Sourcing + CQRS
  {
    id: "event-sourcing-cqrs",
    name: "Event Sourcing + CQRS",
    description:
      "Write path (command to event store) and read path (projection to read model) in an event-sourced system. Demonstrates command validation, event immutability, asynchronous projection, and the eventual consistency trade-off between write and read sides.",
    data: {
      participants: [
        { id: "client", name: "Client", type: "actor" },
        { id: "commandbus", name: "CommandBus", type: "object" },
        { id: "writeservice", name: "WriteService", type: "object" },
        { id: "eventstore", name: "EventStore", type: "object" },
        { id: "eventbus", name: "EventBus", type: "object" },
        { id: "projector", name: "Projector", type: "object" },
        { id: "readservice", name: "ReadService", type: "object" },
        { id: "readdb", name: "ReadDB", type: "object" },
      ],
      messages: [
        { id: "m1", from: "client", to: "commandbus", label: "PlaceOrder(items, userId)", type: "sync", order: 1, narration: "The client sends a command (intent to change state), not a direct mutation. Commands are imperative ('PlaceOrder') while events are past-tense ('OrderPlaced'). This separation is the foundation of CQRS -- commands go through the write side, queries go through the read side." },
        { id: "m2", from: "commandbus", to: "writeservice", label: "route(PlaceOrder)", type: "sync", order: 2, narration: "The command bus routes the command to the appropriate handler. It acts like a dispatcher -- decoupling the sender from the handler. In larger systems, this bus can also enforce command-level authorization and deduplication." },
        { id: "m3", from: "writeservice", to: "writeservice", label: "validate business rules (stock, credit)", type: "self", order: 3, narration: "The write service loads the aggregate's current state by replaying its event history, then validates the command against business rules: does the user have sufficient credit? Are all items in stock? Rejecting invalid commands here prevents corrupt events from entering the store." },
        { id: "m4", from: "writeservice", to: "eventstore", label: "append(OrderPlaced { orderId, items, total })", type: "sync", order: 4, narration: "The validated command produces an event that is appended to the event store. Events are immutable facts -- once written, they are never updated or deleted. The event store is an append-only log, which makes it naturally audit-friendly and enables temporal queries ('what was the state at time T?')." },
        { id: "m5", from: "eventstore", to: "writeservice", label: "eventId: evt-891 (sequence: 47)", type: "return", order: 5, narration: "The event store confirms the append with a unique event ID and sequence number. The sequence number provides a global ordering guarantee -- projectors can detect gaps and process events in exact order." },
        { id: "m6", from: "writeservice", to: "commandbus", label: "OrderPlaced (acknowledged)", type: "return", order: 6, narration: "The write side confirms the command was processed and the event was stored. At this point the write is complete -- but the read side has not been updated yet. This is the eventual consistency trade-off in CQRS." },
        { id: "m7", from: "commandbus", to: "client", label: "202 Accepted { orderId }", type: "return", order: 7, narration: "The client receives a 202 Accepted (not 200 OK) because the order is confirmed on the write side but the read model may not reflect it yet. The client gets the orderId for future queries, understanding there may be a brief delay." },
        { id: "m8", from: "eventstore", to: "eventbus", label: "publish(OrderPlaced)", type: "async", order: 8, narration: "The event store publishes the event to the event bus asynchronously. This decouples the write path from all downstream consumers. The event bus (e.g. Kafka, EventStoreDB subscription) guarantees at-least-once delivery to all subscribers." },
        { id: "m9", from: "eventbus", to: "projector", label: "handle(OrderPlaced)", type: "async", order: 9, narration: "The projector receives the event asynchronously. Projectors are the bridge between the event log and the read models. Multiple projectors can subscribe to the same event to maintain different read-optimized views (e.g. orders-by-user, orders-by-status, daily-revenue)." },
        { id: "m10", from: "projector", to: "readdb", label: "INSERT INTO orders_view (orderId, status, total)", type: "sync", order: 10, narration: "The projector transforms the event into a denormalized read model and writes it to the read database. Read models are disposable -- if they get corrupted, you can rebuild them by replaying all events from the event store. This is one of event sourcing's most powerful properties." },
        { id: "m11", from: "readdb", to: "projector", label: "OK (row inserted)", type: "return", order: 11, narration: "The read database confirms the projection is up to date. The projector updates its checkpoint (last processed event sequence) so it can resume from the right position after a restart." },
        { id: "m12", from: "client", to: "readservice", label: "getOrder(orderId)", type: "sync", order: 12, narration: "The client queries the read side for the order. If this query arrives before the projector has processed the OrderPlaced event, the order will not be found -- this is eventual consistency in action. Clients can poll or use WebSockets for real-time updates." },
        { id: "m13", from: "readservice", to: "readdb", label: "SELECT * FROM orders_view WHERE id = orderId", type: "sync", order: 13, narration: "The read service queries the denormalized read model. Because read models are pre-computed projections, queries are simple and fast -- no joins, no aggregations at query time. This is why CQRS scales reads independently of writes." },
        { id: "m14", from: "readdb", to: "readservice", label: "{ orderId, status: 'placed', items, total }", type: "return", order: 14, narration: "The read database returns the projected order view. If the projector has caught up, this reflects the latest state. The data is eventually consistent -- typically within milliseconds, but under load the lag can grow to seconds." },
        { id: "m15", from: "readservice", to: "client", label: "200 OK { order }", type: "return", order: 15, narration: "The client receives the order data from the read side. The full cycle is complete: command entered the write side, produced an immutable event, was projected into a read model, and is now queryable. Write and read paths scaled independently throughout." },
      ],
    },
  },
];

export function getSequenceExampleById(
  id: string,
): (typeof SEQUENCE_EXAMPLES)[number] | undefined {
  return SEQUENCE_EXAMPLES.find((e) => e.id === id);
}
