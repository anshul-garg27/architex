import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — WebSocket Lifecycle Simulation
// ─────────────────────────────────────────────────────────────
//
// Simulates the full WebSocket connection lifecycle:
//   1. HTTP Upgrade handshake (HTTP/1.1 101 Switching Protocols)
//   2. Bidirectional message exchange (text frames)
//   3. Ping/pong heartbeat mechanism (keep-alive)
//   4. Graceful close handshake (close frame exchange)
//
// The WebSocket protocol (RFC 6455) upgrades an HTTP/1.1
// connection to a persistent, full-duplex channel. Unlike HTTP
// request-response, either side can send messages at any time
// without waiting for the other.
//
// Every method returns an ordered list of WebSocketEvent objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * Discriminator for WebSocket event types.
 *
 * - `http-upgrade`: Client sends the HTTP Upgrade request.
 * - `upgrade-response`: Server responds with 101 Switching Protocols.
 * - `message`: A data frame sent in either direction.
 * - `ping`: A ping control frame (keep-alive probe).
 * - `pong`: A pong control frame (keep-alive response).
 * - `close-request`: Initiator sends a close frame.
 * - `close-response`: Responder echoes the close frame.
 */
export type WebSocketEventType =
  | 'http-upgrade'
  | 'upgrade-response'
  | 'message'
  | 'ping'
  | 'pong'
  | 'close-request'
  | 'close-response';

/**
 * A single event in the WebSocket simulation timeline.
 */
export interface WebSocketEvent extends ProtocolTimelineEvent {
  /** Event type discriminator. */
  type: WebSocketEventType;
  /** Endpoint that sent this frame/message (narrows base `from`). */
  from: 'client' | 'server';
  /** Endpoint that receives this frame/message (narrows base `to`). */
  to: 'client' | 'server';
  /** Payload data (for message, close-request, close-response frames). */
  data?: string;
}

/**
 * Current state of the WebSocket connection.
 *
 * Maps to the WebSocket readyState values:
 * - CONNECTING (0): Handshake in progress.
 * - OPEN (1): Connection established, data can flow.
 * - CLOSING (2): Close frame sent, awaiting response.
 * - CLOSED (3): Connection is fully closed.
 */
type ConnectionState = 'connecting' | 'open' | 'closing' | 'closed';

/**
 * Simulates a full WebSocket connection lifecycle.
 *
 * @example
 * ```ts
 * const ws = new WebSocketSimulation();
 * ws.connect();
 * ws.sendMessage('client', 'Hello server!');
 * ws.sendMessage('server', 'Hello client!');
 * ws.heartbeat();
 * ws.close('client');
 *
 * for (const event of ws.getEvents()) {
 *   console.log(`[${event.tick}] ${event.from} -> ${event.to}: ${event.type}`);
 * }
 * ```
 */
export class WebSocketSimulation {
  /** Ordered timeline of all events. */
  private events: WebSocketEvent[];
  /** Current connection state. */
  private state: ConnectionState;
  /** Monotonically increasing tick counter. */
  private tick: number;

  constructor() {
    this.events = [];
    this.state = 'closed';
    this.tick = 0;
  }

  // ── HTTP Upgrade Handshake ───────────────────────────────

  /**
   * Performs the WebSocket opening handshake via HTTP Upgrade.
   *
   * The client sends an HTTP/1.1 GET request with:
   * - `Connection: Upgrade`
   * - `Upgrade: websocket`
   * - `Sec-WebSocket-Key: <base64 nonce>`
   * - `Sec-WebSocket-Version: 13`
   *
   * The server responds with HTTP 101 Switching Protocols and:
   * - `Upgrade: websocket`
   * - `Connection: Upgrade`
   * - `Sec-WebSocket-Accept: <SHA-1 hash of key + magic GUID>`
   *
   * After this exchange, the connection is upgraded to WebSocket
   * and full-duplex messaging begins.
   *
   * @returns The two handshake events.
   * @throws If connection is not in the closed state.
   */
  connect(): WebSocketEvent[] {
    if (this.state !== 'closed') {
      throw new Error(
        `Cannot connect: connection is "${this.state}", expected "closed".`,
      );
    }

    this.state = 'connecting';
    const connectEvents: WebSocketEvent[] = [];

    // Step 1: Client sends HTTP Upgrade request
    connectEvents.push(
      this.record('http-upgrade', 'client', 'server', [
        'Client sends HTTP/1.1 Upgrade request to initiate WebSocket connection.',
        'Headers: Connection: Upgrade, Upgrade: websocket, Sec-WebSocket-Key: <nonce>, Sec-WebSocket-Version: 13.',
        'This is a standard HTTP GET request — firewalls and proxies see normal HTTP.',
      ]),
    );

    // Step 2: Server responds with 101 Switching Protocols
    this.state = 'open';
    connectEvents.push(
      this.record('upgrade-response', 'server', 'client', [
        'Server responds with HTTP 101 Switching Protocols.',
        'Headers: Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Accept: <hash>.',
        'The Sec-WebSocket-Accept proves the server understood the WebSocket request (SHA-1 of key + magic GUID "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").',
        'Connection is now upgraded. Full-duplex messaging can begin.',
      ]),
    );

    return connectEvents;
  }

  // ── Bidirectional Messaging ──────────────────────────────

  /**
   * Sends a data message from one endpoint to the other.
   *
   * WebSocket messages are transmitted as frames. Text messages
   * use opcode 0x1. Unlike HTTP, no request/response pairing is
   * required — either side can send at any time.
   *
   * Client-to-server frames are masked (XOR with a random 32-bit key)
   * to prevent cache poisoning attacks on intermediary proxies.
   * Server-to-client frames are NOT masked.
   *
   * @param from - Which endpoint sends the message.
   * @param data - The message payload.
   * @returns A single message event.
   * @throws If connection is not open.
   */
  sendMessage(from: 'client' | 'server', data: string): WebSocketEvent[] {
    if (this.state !== 'open') {
      throw new Error(
        `Cannot send message: connection is "${this.state}", expected "open".`,
      );
    }

    const to: 'client' | 'server' = from === 'client' ? 'server' : 'client';
    const masked = from === 'client';
    const messageEvents: WebSocketEvent[] = [];

    messageEvents.push(
      this.record('message', from, to, [
        `${capitalize(from)} sends text frame to ${to}.`,
        `Payload: "${truncate(data, 60)}".`,
        masked
          ? 'Frame is masked (client-to-server frames must be masked per RFC 6455).'
          : 'Frame is unmasked (server-to-client frames are not masked).',
        'No HTTP overhead — just a lightweight frame header (2-14 bytes).',
      ], data),
    );

    return messageEvents;
  }

  // ── Heartbeat (Ping/Pong) ────────────────────────────────

  /**
   * Simulates a ping/pong heartbeat exchange.
   *
   * Either endpoint can send a Ping frame (opcode 0x9).
   * The receiver MUST respond with a Pong frame (opcode 0xA)
   * containing the same payload data.
   *
   * Heartbeats serve two purposes:
   * 1. **Keep-alive**: Prevents intermediary proxies/NATs from
   *    closing idle connections.
   * 2. **Liveness detection**: If no Pong is received within a
   *    timeout, the sender can close the connection.
   *
   * @returns The ping and pong events.
   * @throws If connection is not open.
   */
  heartbeat(): WebSocketEvent[] {
    if (this.state !== 'open') {
      throw new Error(
        `Cannot heartbeat: connection is "${this.state}", expected "open".`,
      );
    }

    const heartbeatEvents: WebSocketEvent[] = [];

    // Server sends Ping
    heartbeatEvents.push(
      this.record('ping', 'server', 'client', [
        'Server sends Ping control frame (opcode 0x9) for keep-alive.',
        'Ping may include application data that must be echoed in the Pong.',
        'Purpose: detect dead connections and prevent proxy/NAT timeouts.',
      ]),
    );

    // Client responds with Pong
    heartbeatEvents.push(
      this.record('pong', 'client', 'server', [
        'Client responds with Pong control frame (opcode 0xA).',
        'Pong echoes the Ping payload. Response is mandatory per RFC 6455.',
        'If no Pong is received within timeout, the connection is considered dead.',
      ]),
    );

    return heartbeatEvents;
  }

  // ── Graceful Close ───────────────────────────────────────

  /**
   * Performs the WebSocket close handshake.
   *
   * Either endpoint can initiate closing by sending a Close frame
   * (opcode 0x8) with an optional status code and reason string.
   * The other endpoint MUST respond with its own Close frame.
   *
   * After both Close frames are exchanged, the underlying TCP
   * connection is closed (typically by the server).
   *
   * Common close codes:
   * - 1000: Normal closure.
   * - 1001: Going away (e.g., server shutting down).
   * - 1002: Protocol error.
   * - 1003: Unsupported data type.
   * - 1011: Unexpected condition.
   *
   * @param initiator - Which endpoint initiates the close.
   * @returns The close request and response events.
   * @throws If connection is not open.
   */
  close(initiator: 'client' | 'server'): WebSocketEvent[] {
    if (this.state !== 'open') {
      throw new Error(
        `Cannot close: connection is "${this.state}", expected "open".`,
      );
    }

    const responder: 'client' | 'server' =
      initiator === 'client' ? 'server' : 'client';
    const closeEvents: WebSocketEvent[] = [];

    // Step 1: Initiator sends Close frame
    this.state = 'closing';
    closeEvents.push(
      this.record('close-request', initiator, responder, [
        `${capitalize(initiator)} sends Close frame (opcode 0x8) with status code 1000 (Normal Closure).`,
        `${capitalize(initiator)} will not send any more data frames after this.`,
        `${capitalize(initiator)} may still receive data until the peer's Close frame arrives.`,
      ], '1000: Normal Closure'),
    );

    // Step 2: Responder echoes Close frame
    this.state = 'closed';
    closeEvents.push(
      this.record('close-response', responder, initiator, [
        `${capitalize(responder)} responds with its own Close frame (status 1000).`,
        'Both sides have now exchanged Close frames.',
        'The underlying TCP connection is closed (typically by the server).',
        'WebSocket connection is fully terminated.',
      ], '1000: Normal Closure'),
    );

    return closeEvents;
  }

  // ── Query ────────────────────────────────────────────────

  /** Returns a copy of the complete event timeline. */
  getEvents(): WebSocketEvent[] {
    return [...this.events];
  }

  /** Resets the simulation to its initial state. */
  reset(): void {
    this.events = [];
    this.state = 'closed';
    this.tick = 0;
  }

  // ── Internals ────────────────────────────────────────────

  /**
   * Records a WebSocket event, appends it to the timeline, and returns it.
   */
  private record(
    type: WebSocketEventType,
    from: 'client' | 'server',
    to: 'client' | 'server',
    descriptionLines: string[],
    data?: string,
  ): WebSocketEvent {
    this.tick++;
    const event: WebSocketEvent = {
      tick: this.tick,
      type,
      from,
      to,
      description: descriptionLines.join(' '),
      ...(data !== undefined ? { data } : {}),
    };
    this.events.push(event);
    return event;
  }
}

// ── String Helpers ─────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 3) + '...' : s;
}
