'use client';

import { useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// Architex — Protocol Decision Tree
// ─────────────────────────────────────────────────────────────
//
// Interactive decision tree that helps users choose the right
// network protocol for their use case. Designed for system design
// interview preparation.
//
// Uses simple React state for tree traversal — no external
// libraries required.
// ─────────────────────────────────────────────────────────────

/** A node in the decision tree: either a question or a terminal recommendation. */
interface DecisionNode {
  /** Unique identifier for this node. */
  id: string;
  /** The question posed to the user (undefined for terminal nodes). */
  question?: string;
  /** Available answers, each leading to another node (empty for terminal nodes). */
  options?: { label: string; nextId: string }[];
  /** The recommended protocol (only for terminal nodes). */
  protocol?: string;
  /** Short explanation of why this protocol fits (only for terminal nodes). */
  rationale?: string;
  /** Key characteristics of the recommended protocol (only for terminal nodes). */
  characteristics?: string[];
}

/** The complete decision tree data. */
const DECISION_TREE: Record<string, DecisionNode> = {
  root: {
    id: 'root',
    question: 'What kind of communication do you need?',
    options: [
      { label: 'One-way server to client (streaming updates)', nextId: 'one-way' },
      { label: 'Bidirectional real-time communication', nextId: 'bidirectional' },
      { label: 'Request-response (client asks, server answers)', nextId: 'req-resp' },
      { label: 'IoT / constrained device messaging', nextId: 'iot' },
    ],
  },

  // ── One-way branch ──────────────────────────────────────
  'one-way': {
    id: 'one-way',
    question: 'Do you need the client to also send data back to the server?',
    options: [
      { label: 'No, purely server-to-client push', nextId: 'sse' },
      { label: 'Yes, but mostly server-initiated', nextId: 'websocket' },
    ],
  },
  sse: {
    id: 'sse',
    protocol: 'SSE (Server-Sent Events)',
    rationale:
      'SSE is ideal for one-way server-to-client streaming over HTTP. It auto-reconnects, supports event types, and works through proxies and firewalls without special configuration.',
    characteristics: [
      'Unidirectional: server to client only',
      'Built on HTTP — no special protocol upgrade needed',
      'Automatic reconnection with Last-Event-ID',
      'Text-based (UTF-8), ideal for JSON event streams',
      'Use cases: live feeds, notifications, stock tickers',
    ],
  },

  // ── Bidirectional branch ────────────────────────────────
  bidirectional: {
    id: 'bidirectional',
    question: 'What is the primary concern?',
    options: [
      { label: 'Low latency messaging (chat, gaming, collaboration)', nextId: 'websocket' },
      { label: 'Peer-to-peer media streaming (video/audio)', nextId: 'webrtc' },
    ],
  },
  websocket: {
    id: 'websocket',
    protocol: 'WebSocket',
    rationale:
      'WebSocket provides full-duplex, persistent communication over a single TCP connection. After an HTTP upgrade handshake, both client and server can send messages at any time with minimal overhead.',
    characteristics: [
      'Full-duplex: both sides send freely',
      'Persistent connection (no repeated handshakes)',
      'Low overhead per message (2-14 byte frame header)',
      'Supports binary and text data',
      'Use cases: chat, multiplayer games, collaborative editing, live dashboards',
    ],
  },
  webrtc: {
    id: 'webrtc',
    protocol: 'WebRTC',
    rationale:
      'WebRTC enables peer-to-peer audio, video, and data channels directly between browsers. It uses STUN/TURN for NAT traversal and DTLS/SRTP for encryption.',
    characteristics: [
      'Peer-to-peer (no server relay for media, when possible)',
      'Built-in support for audio/video codecs',
      'NAT traversal via ICE/STUN/TURN',
      'Encrypted by default (DTLS + SRTP)',
      'Use cases: video calls, screen sharing, P2P file transfer',
    ],
  },

  // ── Request-response branch ─────────────────────────────
  'req-resp': {
    id: 'req-resp',
    question: 'What matters most for your API?',
    options: [
      { label: 'Simplicity and wide ecosystem support', nextId: 'http-rest' },
      { label: 'Performance and strong typing (internal microservices)', nextId: 'grpc' },
      { label: 'Flexible queries from the client (avoid over/under-fetching)', nextId: 'graphql' },
      { label: 'Speed over reliability (can tolerate some data loss)', nextId: 'transport-choice' },
    ],
  },
  'http-rest': {
    id: 'http-rest',
    protocol: 'HTTP / REST',
    rationale:
      'HTTP with REST conventions is the most widely adopted API style. It leverages standard HTTP methods, status codes, and caching infrastructure. Ideal when simplicity and interoperability are priorities.',
    characteristics: [
      'Stateless request-response model',
      'Leverages HTTP caching, CDNs, and proxies',
      'Universal client support (browsers, curl, SDKs)',
      'Well-understood resource-oriented design',
      'Use cases: public APIs, CRUD services, web backends',
    ],
  },
  grpc: {
    id: 'grpc',
    protocol: 'gRPC',
    rationale:
      'gRPC uses HTTP/2 with Protocol Buffers for high-performance, strongly typed RPC. It supports unary calls, server streaming, client streaming, and bidirectional streaming.',
    characteristics: [
      'Binary serialization (Protocol Buffers) — compact and fast',
      'HTTP/2 multiplexing — no head-of-line blocking',
      'Code generation from .proto files',
      'Supports streaming in all directions',
      'Use cases: microservice communication, mobile backends, real-time data pipelines',
    ],
  },
  graphql: {
    id: 'graphql',
    protocol: 'GraphQL',
    rationale:
      'GraphQL lets clients specify exactly the data they need in a single request. It eliminates over-fetching and under-fetching, making it ideal for complex client applications with varied data requirements.',
    characteristics: [
      'Client-specified queries — fetch exactly what you need',
      'Single endpoint for all operations',
      'Strongly typed schema with introspection',
      'Subscriptions for real-time updates',
      'Use cases: mobile apps, dashboards, BFF (Backend for Frontend)',
    ],
  },

  // ── Transport layer choice ──────────────────────────────
  'transport-choice': {
    id: 'transport-choice',
    question: 'Do you need reliable, ordered delivery?',
    options: [
      { label: 'Yes, every byte must arrive in order', nextId: 'tcp' },
      { label: 'No, speed and low latency are more important', nextId: 'udp' },
    ],
  },
  tcp: {
    id: 'tcp',
    protocol: 'TCP',
    rationale:
      'TCP provides reliable, ordered, error-checked delivery of a byte stream. It handles retransmission, flow control, and congestion control automatically.',
    characteristics: [
      'Reliable delivery with acknowledgements and retransmission',
      'Ordered byte stream — data arrives in send order',
      'Flow control (receiver window) and congestion control',
      '3-way handshake for connection setup',
      'Use cases: HTTP, SSH, file transfer, email (SMTP/IMAP)',
    ],
  },
  udp: {
    id: 'udp',
    protocol: 'UDP',
    rationale:
      'UDP is a minimal, connectionless transport. It sends datagrams without connection setup, acknowledgements, or retransmission — perfect when low latency matters more than reliability.',
    characteristics: [
      'Connectionless — no handshake overhead',
      'No reliability guarantees (fire and forget)',
      'Low latency — no retransmission delays',
      'Supports broadcast and multicast',
      'Use cases: DNS, video streaming, online gaming, VoIP, IoT telemetry',
    ],
  },

  // ── IoT branch ──────────────────────────────────────────
  iot: {
    id: 'iot',
    question: 'What is the network environment?',
    options: [
      { label: 'Constrained bandwidth / unreliable network', nextId: 'mqtt' },
      { label: 'Extremely constrained devices (microcontrollers)', nextId: 'coap' },
    ],
  },
  mqtt: {
    id: 'mqtt',
    protocol: 'MQTT',
    rationale:
      'MQTT is a lightweight publish-subscribe protocol designed for constrained devices and unreliable networks. It uses minimal bandwidth and supports 3 QoS levels.',
    characteristics: [
      'Publish-subscribe model with topic hierarchy',
      'Minimal packet overhead (2-byte fixed header)',
      'QoS levels: 0 (at most once), 1 (at least once), 2 (exactly once)',
      'Persistent sessions and retained messages',
      'Use cases: IoT sensors, smart home, fleet tracking, industrial automation',
    ],
  },
  coap: {
    id: 'coap',
    protocol: 'CoAP',
    rationale:
      'CoAP (Constrained Application Protocol) is a RESTful protocol for extremely constrained devices. It runs over UDP, supports multicast, and uses a compact binary format.',
    characteristics: [
      'REST-like model (GET, PUT, POST, DELETE) over UDP',
      'Compact binary header (4 bytes)',
      'Built-in resource observation (like pub-sub)',
      'DTLS for security',
      'Use cases: sensor networks, embedded systems, 6LoWPAN',
    ],
  },
};

/**
 * ProtocolDecisionTree — Interactive protocol selection guide.
 *
 * Walks the user through a series of questions about their
 * communication requirements and recommends the most appropriate
 * network protocol. Designed for system design interview preparation.
 */
export default function ProtocolDecisionTree() {
  const [path, setPath] = useState<string[]>(['root']);
  const currentNodeId = path[path.length - 1];
  const currentNode = DECISION_TREE[currentNodeId];

  const handleOptionClick = useCallback(
    (nextId: string) => {
      setPath((prev) => [...prev, nextId]);
    },
    [],
  );

  const handleBack = useCallback(() => {
    setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleReset = useCallback(() => {
    setPath(['root']);
  }, []);

  const isTerminal = !!currentNode.protocol;
  const canGoBack = path.length > 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Breadcrumb trail */}
      {path.length > 1 && (
        <div className="flex flex-wrap gap-1 text-xs" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
          {path.map((nodeId, i) => {
            const node = DECISION_TREE[nodeId];
            const label = node.protocol ?? node.question?.slice(0, 30) + '...' ?? nodeId;
            return (
              <span key={nodeId} className="flex items-center gap-1">
                {i > 0 && <span style={{ color: 'var(--border, #334155)' }}>/</span>}
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="rounded px-1 py-0.5 transition-colors hover:underline"
                  style={{ color: i === path.length - 1 ? 'var(--primary, #60a5fa)' : 'var(--text-secondary, #94a3b8)' }}
                >
                  {label}
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Question or Result Card */}
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: 'var(--surface, #1e293b)',
          borderColor: isTerminal ? 'var(--primary, #60a5fa)' : 'var(--border, #334155)',
        }}
      >
        {isTerminal ? (
          /* ── Terminal Node: Protocol Recommendation ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  backgroundColor: 'var(--primary, #60a5fa)',
                  color: 'var(--surface, #1e293b)',
                }}
              >
                {currentNode.protocol!.charAt(0)}
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary, #f1f5f9)' }}>
                {currentNode.protocol}
              </h2>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              {currentNode.rationale}
            </p>

            {currentNode.characteristics && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
                  Key Characteristics
                </h3>
                <ul className="space-y-1">
                  {currentNode.characteristics.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'var(--text-primary, #f1f5f9)' }}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: 'var(--primary, #60a5fa)' }}
                      />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* ── Question Node ── */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary, #f1f5f9)' }}>
              {currentNode.question}
            </h2>

            <div className="space-y-2">
              {currentNode.options?.map((option) => (
                <button
                  key={option.nextId}
                  type="button"
                  onClick={() => handleOptionClick(option.nextId)}
                  className="w-full rounded-lg border px-4 py-3 text-left text-sm transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--surface, #1e293b)',
                    borderColor: 'var(--border, #334155)',
                    color: 'var(--text-primary, #f1f5f9)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #60a5fa)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover, #263044)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, #334155)';
                    e.currentTarget.style.backgroundColor = 'var(--surface, #1e293b)';
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border px-4 py-2 text-sm transition-colors"
            style={{
              borderColor: 'var(--border, #334155)',
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            Back
          </button>
        )}
        {canGoBack && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border px-4 py-2 text-sm transition-colors"
            style={{
              borderColor: 'var(--border, #334155)',
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}
