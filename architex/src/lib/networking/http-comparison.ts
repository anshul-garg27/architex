import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — HTTP Version Comparison
// ─────────────────────────────────────────────────────────────
//
// HOOK: "In 1997, 100 images = 100 TCP connections. The history
// of HTTP is a 25-year battle against this overhead."
//
// NARRATIVE: "Each version exists because the previous solution
// created the next problem."
//   HTTP/1.1: Connection reuse, but head-of-line blocking.
//   HTTP/2:   Multiplexing, but TCP-level HOL blocking.
//   HTTP/3:   Independent QUIC streams — zero HOL blocking.
//
// Side-by-side simulation of HTTP/1.1, HTTP/2, and HTTP/3
// loading the same set of resources. Demonstrates:
//
// - HTTP/1.1: Head-of-line (HOL) blocking, 6-connection limit,
//   sequential requests per connection.
// - HTTP/2: Multiplexed streams over a single TCP connection,
//   eliminates HOL blocking at the HTTP layer (but not TCP).
// - HTTP/3: QUIC transport eliminates TCP HOL blocking,
//   0-RTT connection establishment, per-stream loss recovery.
//
// The compareHTTPVersions() function returns an HTTPComparison
// object with ordered request timelines for each version.
// ─────────────────────────────────────────────────────────────

/**
 * A single HTTP request event in the simulation timeline.
 */
export interface HTTPRequest extends ProtocolTimelineEvent {
  /** Sender of the request (always 'client' for HTTP). */
  from: string;
  /** Receiver of the request (always 'server' for HTTP). */
  to: string;
  /** HTTP version. */
  version: '1.1' | '2' | '3';
  /** HTTP method. */
  method: string;
  /** Request path. */
  path: string;
  /** HTTP/2+ stream identifier (undefined for HTTP/1.1). */
  streamId?: number;
  /** Connection identifier (HTTP/1.1 uses multiple). */
  connectionId: number;
  /** Simulated latency for this request in milliseconds. */
  latencyMs: number;
  /** Whether this request is blocked behind another (HOL blocking). */
  blocked: boolean;
  /** Whether this request is multiplexed with others. */
  multiplexed: boolean;
}

/**
 * Complete comparison result across all three HTTP versions.
 */
export interface HTTPComparison {
  /** HTTP/1.1 request timeline. */
  http11: HTTPRequest[];
  /** HTTP/2 request timeline. */
  http2: HTTPRequest[];
  /** HTTP/3 request timeline. */
  http3: HTTPRequest[];
  /** Total load time for each version (milliseconds). */
  totalTime: { http11: number; http2: number; http3: number };
}

/**
 * Describes a resource to fetch in the simulation.
 */
interface ResourceRequest {
  /** HTTP method (GET, POST, etc.). */
  method: string;
  /** Request path. */
  path: string;
  /** Resource size in kilobytes (affects transfer time). */
  sizeKB: number;
}

// ── Constants ────────────────────────────────────────────────

/** Default HTTP/1.1 connection limit per origin (browsers typically use 6). */
const DEFAULT_MAX_CONNECTIONS = 6;

/** Base overhead per HTTP/1.1 connection setup (TCP + TLS). */
const CONNECTION_SETUP_OVERHEAD_MS = 50;

/** Simulated bandwidth for transfer time calculation (KB per ms at ~10 MB/s). */
const BANDWIDTH_KB_PER_MS = 10;

/** QUIC 0-RTT advantage (ms saved vs TCP+TLS). */
const QUIC_0RTT_SAVINGS_MS = 30;

/**
 * Compares loading a set of resources across HTTP/1.1, HTTP/2, and HTTP/3.
 *
 * Models the key differences:
 * - **HTTP/1.1**: Max N parallel connections, one request at a time per
 *   connection. Requests beyond the connection limit are queued (HOL blocking).
 * - **HTTP/2**: Single TCP connection, all requests multiplexed as streams.
 *   No HTTP-layer HOL blocking, but TCP-layer HOL blocking on packet loss.
 * - **HTTP/3**: QUIC transport with independent streams. No HOL blocking at
 *   any layer. 0-RTT connection establishment saves latency.
 *
 * @param requests - Array of resources to fetch.
 * @param latencyMs - Network round-trip time in milliseconds.
 * @param maxConnections - HTTP/1.1 connection limit (default 6).
 * @returns Comparison object with timelines and total times.
 *
 * @example
 * ```ts
 * const result = compareHTTPVersions(
 *   [
 *     { method: 'GET', path: '/index.html', sizeKB: 10 },
 *     { method: 'GET', path: '/style.css', sizeKB: 25 },
 *     { method: 'GET', path: '/app.js', sizeKB: 150 },
 *     { method: 'GET', path: '/hero.png', sizeKB: 200 },
 *     { method: 'GET', path: '/logo.svg', sizeKB: 5 },
 *     { method: 'GET', path: '/font.woff2', sizeKB: 40 },
 *     { method: 'GET', path: '/analytics.js', sizeKB: 20 },
 *     { method: 'GET', path: '/api/data', sizeKB: 3 },
 *   ],
 *   50,
 * );
 *
 * console.log(`HTTP/1.1: ${result.totalTime.http11}ms`);
 * console.log(`HTTP/2:   ${result.totalTime.http2}ms`);
 * console.log(`HTTP/3:   ${result.totalTime.http3}ms`);
 * ```
 */
export function compareHTTPVersions(
  requests: Array<{ method: string; path: string; sizeKB: number }>,
  latencyMs: number,
  maxConnections: number = DEFAULT_MAX_CONNECTIONS,
): HTTPComparison {
  const http11 = simulateHTTP11(requests, latencyMs, maxConnections);
  const http2 = simulateHTTP2(requests, latencyMs);
  const http3 = simulateHTTP3(requests, latencyMs);

  return {
    http11: http11.events,
    http2: http2.events,
    http3: http3.events,
    totalTime: {
      http11: http11.totalMs,
      http2: http2.totalMs,
      http3: http3.totalMs,
    },
  };
}

// ── HTTP/1.1 Simulation ──────────────────────────────────────

/**
 * Simulates HTTP/1.1 with connection limits and head-of-line blocking.
 *
 * Behaviour modelled:
 * - Each connection can handle one request at a time.
 * - Maximum `maxConnections` TCP connections in parallel.
 * - Requests beyond the limit wait (HOL blocking).
 * - Each new connection incurs TCP+TLS setup overhead.
 * - Transfer time = RTT + (size / bandwidth).
 */
function simulateHTTP11(
  requests: ResourceRequest[],
  latencyMs: number,
  maxConnections: number,
): { events: HTTPRequest[]; totalMs: number } {
  const events: HTTPRequest[] = [];

  // Track when each connection becomes free (ms timestamp).
  const connectionFreeAt: number[] = [];
  let tick = 0;

  for (const req of requests) {
    const transferTime = latencyMs + req.sizeKB / BANDWIDTH_KB_PER_MS;

    // Find the earliest free connection, or create a new one if under limit.
    let bestConn = -1;
    let earliestFree = Infinity;

    for (let c = 0; c < connectionFreeAt.length; c++) {
      if (connectionFreeAt[c] < earliestFree) {
        earliestFree = connectionFreeAt[c];
        bestConn = c;
      }
    }

    let connectionId: number;
    let startTime: number;
    let blocked = false;

    if (connectionFreeAt.length < maxConnections) {
      // Open a new connection
      connectionId = connectionFreeAt.length;
      startTime = CONNECTION_SETUP_OVERHEAD_MS; // TCP + TLS setup
      connectionFreeAt.push(0);
    } else {
      // Must wait for an existing connection
      connectionId = bestConn;
      startTime = earliestFree;
      blocked = earliestFree > 0;
    }

    const endTime = startTime + transferTime;
    connectionFreeAt[connectionId] = endTime;

    tick++;
    events.push({
      tick,
      from: 'client',
      to: 'server',
      version: '1.1',
      method: req.method,
      path: req.path,
      connectionId,
      description: blocked
        ? `Waiting for connection — like being stuck in a checkout lane while others finish. ${req.method} ${req.path} waited for connection ${connectionId} (blocked ${Math.round(startTime)}ms). Transfer: ${Math.round(transferTime)}ms.`
        : `${req.method} ${req.path} on connection ${connectionId}. ${connectionId >= maxConnections - 1 ? 'All connections in use.' : ''} Transfer: ${Math.round(transferTime)}ms.`,
      latencyMs: Math.round(endTime),
      blocked,
      multiplexed: false,
    });
  }

  const totalMs = Math.round(Math.max(...connectionFreeAt, 0));
  return { events, totalMs };
}

// ── HTTP/2 Simulation ────────────────────────────────────────

/**
 * Simulates HTTP/2 with stream multiplexing over a single TCP connection.
 *
 * Behaviour modelled:
 * - Single TCP connection (connection ID 0).
 * - All requests sent immediately as independent streams.
 * - No HTTP-layer HOL blocking.
 * - Server processes streams concurrently; each has its own latency.
 * - TCP-layer HOL blocking note: if any TCP packet is lost, ALL streams
 *   stall until retransmission (noted in description but not simulated).
 */
function simulateHTTP2(
  requests: ResourceRequest[],
  latencyMs: number,
): { events: HTTPRequest[]; totalMs: number } {
  const events: HTTPRequest[] = [];
  let maxEndTime = 0;

  // One connection, all streams multiplexed
  const connectionSetup = CONNECTION_SETUP_OVERHEAD_MS;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const streamId = (i + 1) * 2 - 1; // Odd stream IDs for client-initiated (1, 3, 5, ...)
    const transferTime = latencyMs + req.sizeKB / BANDWIDTH_KB_PER_MS;
    const endTime = connectionSetup + transferTime;

    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }

    events.push({
      tick: i + 1,
      from: 'client',
      to: 'server',
      version: '2',
      method: req.method,
      path: req.path,
      streamId,
      connectionId: 0,
      description: `All requests interleaved on one connection. Stream ${streamId}: ${req.method} ${req.path}. Transfer: ${Math.round(transferTime)}ms. But if ANY TCP packet is lost, ALL streams freeze — TCP's ordering guarantee becomes a liability.`,
      latencyMs: Math.round(endTime),
      blocked: false,
      multiplexed: true,
    });
  }

  return { events, totalMs: Math.round(maxEndTime) };
}

// ── HTTP/3 Simulation ────────────────────────────────────────

/**
 * Simulates HTTP/3 with QUIC transport and independent streams.
 *
 * Behaviour modelled:
 * - QUIC connection with 0-RTT capability (saves ~30ms vs TCP+TLS).
 * - Independent streams: packet loss on one stream does NOT affect others.
 * - No HOL blocking at any layer.
 * - Built-in encryption (TLS 1.3 integrated into QUIC).
 * - Connection migration support (IP changes don't drop connection).
 */
function simulateHTTP3(
  requests: ResourceRequest[],
  latencyMs: number,
): { events: HTTPRequest[]; totalMs: number } {
  const events: HTTPRequest[] = [];
  let maxEndTime = 0;

  // QUIC 0-RTT reduces connection setup time
  const connectionSetup = Math.max(
    CONNECTION_SETUP_OVERHEAD_MS - QUIC_0RTT_SAVINGS_MS,
    0,
  );

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const streamId = i * 4; // QUIC client-initiated bidirectional streams: 0, 4, 8, ...
    const transferTime = latencyMs + req.sizeKB / BANDWIDTH_KB_PER_MS;
    const endTime = connectionSetup + transferTime;

    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }

    events.push({
      tick: i + 1,
      from: 'client',
      to: 'server',
      version: '3',
      method: req.method,
      path: req.path,
      streamId,
      connectionId: 0,
      description: `Independent streams over QUIC. Stream ${streamId}: ${req.method} ${req.path}. Packet loss on stream A has ZERO impact on streams B, C, D. Plus 0-RTT saves ${QUIC_0RTT_SAVINGS_MS}ms connection setup. Transfer: ${Math.round(transferTime)}ms.`,
      latencyMs: Math.round(endTime),
      blocked: false,
      multiplexed: true,
    });
  }

  return { events, totalMs: Math.round(maxEndTime) };
}
