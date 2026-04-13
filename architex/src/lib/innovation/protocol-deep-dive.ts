// ─────────────────────────────────────────────────────────────
// Architex — Protocol Deep-Dive Data
// ─────────────────────────────────────────────────────────────
//
// Detailed breakdown of 10 major protocols used in system
// design: TCP, HTTP/2, HTTP/3, gRPC, WebSocket, TLS, DNS,
// MQTT, AMQP, and GraphQL.
//
// Each protocol carries:
//   - OSI layer mapping
//   - Header field inventory (name, size, purpose, example)
//   - Handshake / connection-setup steps
//   - Performance characteristics (latency, throughput, etc.)
//   - Use-case fit and tradeoffs
//   - Comparison notes for side-by-side analysis
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** A single field inside a protocol header or message frame. */
export interface HeaderField {
  /** Field name as it appears in specs. */
  name: string;
  /** Size in bytes (0 = variable). */
  sizeBytes: number;
  /** Short explanation of the field's purpose. */
  purpose: string;
  /** Representative example value. */
  exampleValue: string;
}

/** One step in a protocol's connection-setup / handshake flow. */
export interface HandshakeStep {
  /** 1-based ordinal. */
  step: number;
  /** Which party sends this message. */
  sender: string;
  /** Which party receives this message. */
  receiver: string;
  /** Message name or segment type. */
  message: string;
  /** Human-readable description. */
  description: string;
}

/** Quantitative performance profile. */
export interface PerformanceCharacteristics {
  /** Typical added latency in milliseconds. */
  latencyMs: string;
  /** Throughput description. */
  throughput: string;
  /** Protocol overhead description (header weight, framing cost). */
  overhead: string;
  /** Time for initial connection setup. */
  connectionSetupTime: string;
}

/** Complete protocol definition consumed by the UI. */
export interface ProtocolDefinition {
  /** Protocol name. */
  name: string;
  /** OSI layer(s) the protocol spans. */
  layers: string[];
  /** Ordered header / frame fields. */
  headerFields: HeaderField[];
  /** Ordered connection-setup steps. */
  handshakeSteps: HandshakeStep[];
  /** Performance profile. */
  performanceCharacteristics: PerformanceCharacteristics;
  /** Common use cases. */
  useCases: string[];
  /** Key tradeoffs when choosing this protocol. */
  tradeoffs: string[];
  /** Notes useful for side-by-side comparison. */
  comparisonNotes: string;
}

// ── Protocol Definitions ────────────────────────────────────

const TCP: ProtocolDefinition = {
  name: 'TCP',
  layers: ['Transport (Layer 4)'],
  headerFields: [
    { name: 'Source Port', sizeBytes: 2, purpose: 'Identifies the sending port', exampleValue: '49152' },
    { name: 'Destination Port', sizeBytes: 2, purpose: 'Identifies the receiving port', exampleValue: '443' },
    { name: 'Sequence Number', sizeBytes: 4, purpose: 'Byte-stream position of first data byte', exampleValue: '1000' },
    { name: 'Acknowledgment Number', sizeBytes: 4, purpose: 'Next expected byte from peer', exampleValue: '5001' },
    { name: 'Data Offset', sizeBytes: 1, purpose: 'Header length in 32-bit words (high 4 bits)', exampleValue: '5 (20 bytes)' },
    { name: 'Flags', sizeBytes: 1, purpose: 'Control bits: SYN, ACK, FIN, RST, PSH, URG', exampleValue: 'SYN+ACK (0x12)' },
    { name: 'Window Size', sizeBytes: 2, purpose: 'Receiver advertised buffer space', exampleValue: '65535' },
    { name: 'Checksum', sizeBytes: 2, purpose: 'Error detection over header + payload', exampleValue: '0xa3f2' },
    { name: 'Urgent Pointer', sizeBytes: 2, purpose: 'Offset to urgent data (when URG set)', exampleValue: '0' },
    { name: 'Options', sizeBytes: 0, purpose: 'Variable: MSS, window scale, timestamps, SACK', exampleValue: 'MSS=1460' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'SYN', description: 'Client sends SYN with its Initial Sequence Number (ISN). Client enters SYN_SENT state.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'SYN-ACK', description: 'Server responds with its own ISN and acknowledges client ISN+1. Server enters SYN_RECEIVED state.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'ACK', description: 'Client acknowledges server ISN+1. Both sides enter ESTABLISHED state. Data transfer may begin.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1 RTT for handshake (~0-150ms depending on distance)',
    throughput: 'Limited by congestion window and receiver window; scales to 10+ Gbps on modern hardware',
    overhead: '20-60 bytes per segment (20 byte base header + options)',
    connectionSetupTime: '1.5 RTT (SYN, SYN-ACK, ACK + first data)',
  },
  useCases: [
    'Reliable byte-stream delivery between hosts',
    'Foundation for HTTP/1.1, HTTP/2, SSH, SMTP, FTP',
    'Database connections (PostgreSQL, MySQL)',
    'Any application requiring ordered, lossless delivery',
  ],
  tradeoffs: [
    'Head-of-line blocking: one lost packet stalls the entire stream',
    'Connection setup adds latency (1 RTT minimum)',
    'Congestion control ramps up slowly (slow start)',
    'No built-in multiplexing; one stream per connection',
  ],
  comparisonNotes: 'TCP is the workhorse of the Internet. It guarantees ordering and reliability at the cost of head-of-line blocking and connection-setup latency. Compare with QUIC (HTTP/3) which fixes HOL blocking by using independent streams over UDP.',
};

const HTTP2: ProtocolDefinition = {
  name: 'HTTP/2',
  layers: ['Application (Layer 7)', 'Transport (Layer 4, over TCP)'],
  headerFields: [
    { name: 'Length', sizeBytes: 3, purpose: 'Payload length of the frame', exampleValue: '16384' },
    { name: 'Type', sizeBytes: 1, purpose: 'Frame type: DATA, HEADERS, PRIORITY, RST_STREAM, SETTINGS, PUSH_PROMISE, PING, GOAWAY, WINDOW_UPDATE, CONTINUATION', exampleValue: '0x01 (HEADERS)' },
    { name: 'Flags', sizeBytes: 1, purpose: 'Frame-type-specific flags (END_STREAM, END_HEADERS, PADDED, PRIORITY)', exampleValue: '0x04 (END_HEADERS)' },
    { name: 'Reserved', sizeBytes: 0, purpose: '1-bit reserved field', exampleValue: '0' },
    { name: 'Stream Identifier', sizeBytes: 4, purpose: '31-bit stream ID (odd=client-initiated, even=server push)', exampleValue: '3' },
    { name: 'Frame Payload', sizeBytes: 0, purpose: 'Variable: HPACK-compressed headers or body data', exampleValue: ':method: GET, :path: /api' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'TCP SYN', description: 'Standard TCP 3-way handshake begins.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'TCP SYN-ACK', description: 'Server acknowledges TCP handshake.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'TCP ACK + TLS ClientHello', description: 'Client completes TCP and begins TLS negotiation.' },
    { step: 4, sender: 'Server', receiver: 'Client', message: 'TLS ServerHello + Certificate + Finished', description: 'TLS handshake completes (may be 1-RTT with TLS 1.3).' },
    { step: 5, sender: 'Client', receiver: 'Server', message: 'Connection Preface (SETTINGS)', description: 'Client sends HTTP/2 connection preface: magic octet string + initial SETTINGS frame.' },
    { step: 6, sender: 'Server', receiver: 'Client', message: 'SETTINGS + SETTINGS ACK', description: 'Server sends its SETTINGS and acknowledges client SETTINGS. Streams may now be opened.' },
  ],
  performanceCharacteristics: {
    latencyMs: '2-3 RTTs for connection setup (TCP + TLS + HTTP/2 preface)',
    throughput: 'Multiplexed streams over single connection; HPACK compression reduces header overhead by 85-90%',
    overhead: '9-byte frame header; HPACK compresses repeated headers to 1-2 bytes each',
    connectionSetupTime: '2-3 RTTs (TCP 1 RTT + TLS 1-2 RTTs + HTTP/2 preface)',
  },
  useCases: [
    'Modern web application delivery (replaces HTTP/1.1)',
    'Server push for critical resources',
    'API communication between microservices',
    'Real-time data feeds via streaming responses',
  ],
  tradeoffs: [
    'Eliminates HTTP-layer HOL blocking but TCP HOL blocking remains',
    'Single TCP connection means one lost packet stalls ALL streams',
    'Server push is complex and often disabled in practice',
    'HPACK state is connection-scoped (lost on reconnect)',
  ],
  comparisonNotes: 'HTTP/2 solves HTTP/1.1 multiplexing by framing multiple streams over one TCP connection. Header compression (HPACK) dramatically reduces repeated header cost. However, TCP-layer HOL blocking remains the Achilles heel, which HTTP/3 (QUIC) addresses.',
};

const HTTP3: ProtocolDefinition = {
  name: 'HTTP/3',
  layers: ['Application (Layer 7)', 'Transport (Layer 4, over QUIC/UDP)'],
  headerFields: [
    { name: 'Frame Type', sizeBytes: 0, purpose: 'Variable-length integer: DATA (0x00), HEADERS (0x01), CANCEL_PUSH, SETTINGS, PUSH_PROMISE, GOAWAY, MAX_PUSH_ID', exampleValue: '0x01 (HEADERS)' },
    { name: 'Frame Length', sizeBytes: 0, purpose: 'Variable-length integer encoding payload size', exampleValue: '256' },
    { name: 'Frame Payload', sizeBytes: 0, purpose: 'QPACK-compressed headers or body data', exampleValue: ':method: GET, :path: /api' },
    { name: 'QUIC Short Header (1-RTT)', sizeBytes: 0, purpose: 'Flags (1B) + DCID (0-20B) + Packet Number (1-4B)', exampleValue: '0x40 | DCID | PN=42' },
    { name: 'QUIC Stream Frame', sizeBytes: 0, purpose: 'Stream ID + Offset + Length + Data', exampleValue: 'SID=0, OFF=0, LEN=256' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'QUIC Initial (ClientHello)', description: 'Client sends QUIC Initial packet containing TLS 1.3 ClientHello. Crypto and transport handshake are combined.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'QUIC Initial + Handshake (ServerHello + Finished)', description: 'Server responds with ServerHello and finishes TLS. Server can start sending 1-RTT data immediately.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'QUIC Handshake (Finished) + SETTINGS', description: 'Client completes TLS handshake and sends HTTP/3 SETTINGS on control stream. 0-RTT data may have already been sent.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1 RTT for new connection; 0-RTT for resumed connections',
    throughput: 'Independent per-stream flow control; no cross-stream HOL blocking; QPACK header compression',
    overhead: 'Minimal framing; variable-length integer encoding reduces wasted bytes',
    connectionSetupTime: '1 RTT (combined crypto + transport handshake); 0-RTT on resumption',
  },
  useCases: [
    'Mobile-first web delivery (handles network changes via Connection ID)',
    'Low-latency API calls with 0-RTT resumption',
    'Video streaming (independent streams prevent cross-stream stalling)',
    'Edge/CDN delivery (Cloudflare, Google, Akamai)',
  ],
  tradeoffs: [
    'UDP-based: may be blocked or rate-limited by some firewalls/middleboxes',
    'Higher CPU cost for encryption (every packet encrypted)',
    'Ecosystem still maturing (debugging tools, kernel optimizations)',
    'Connection migration adds implementation complexity',
  ],
  comparisonNotes: 'HTTP/3 replaces TCP with QUIC over UDP, eliminating head-of-line blocking at both transport and application layers. Combined crypto+transport handshake achieves 1-RTT (or 0-RTT) setup. Connection migration lets mobile clients survive IP changes seamlessly.',
};

const GRPC: ProtocolDefinition = {
  name: 'gRPC',
  layers: ['Application (Layer 7)', 'Presentation (Protobuf)', 'Transport (HTTP/2 + TCP)'],
  headerFields: [
    { name: 'Compressed Flag', sizeBytes: 1, purpose: 'Whether the message body is compressed', exampleValue: '0 (uncompressed)' },
    { name: 'Message Length', sizeBytes: 4, purpose: 'Length of the serialized protobuf message', exampleValue: '128' },
    { name: 'Message Body', sizeBytes: 0, purpose: 'Protobuf-encoded request or response payload', exampleValue: '<binary protobuf>' },
    { name: 'HTTP/2 HEADERS', sizeBytes: 0, purpose: 'Method, path, content-type, grpc-timeout, custom metadata', exampleValue: ':path: /service/Method' },
    { name: 'HTTP/2 Trailers', sizeBytes: 0, purpose: 'grpc-status code, grpc-message, custom trailing metadata', exampleValue: 'grpc-status: 0' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'HTTP/2 Connection Setup', description: 'Underlying HTTP/2 connection established (TCP + TLS + HTTP/2 preface).' },
    { step: 2, sender: 'Client', receiver: 'Server', message: 'HEADERS frame', description: 'Client opens an HTTP/2 stream with gRPC metadata: method, service path, content-type: application/grpc.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'DATA frame(s)', description: 'Client sends length-prefixed protobuf message(s). For streaming, multiple DATA frames on the same stream.' },
    { step: 4, sender: 'Server', receiver: 'Client', message: 'HEADERS + DATA + TRAILERS', description: 'Server responds with headers, protobuf response(s), and trailers containing grpc-status.' },
  ],
  performanceCharacteristics: {
    latencyMs: 'Sub-millisecond serialization; 2-3 RTTs initial connection; <1ms per call on warm connection',
    throughput: 'Protobuf is 3-10x smaller than JSON; HTTP/2 multiplexing enables high concurrency',
    overhead: '5-byte length-prefixed framing per message + HTTP/2 frame overhead',
    connectionSetupTime: '2-3 RTTs (HTTP/2 over TLS); amortized across many RPCs on persistent connections',
  },
  useCases: [
    'Microservice-to-microservice communication',
    'Real-time bidirectional streaming (chat, telemetry)',
    'Polyglot environments (code generation for 10+ languages)',
    'High-throughput internal APIs (replaces REST)',
  ],
  tradeoffs: [
    'Not human-readable (binary protobuf requires tooling to inspect)',
    'Browser support requires gRPC-Web proxy layer',
    'Schema rigidity: .proto changes need coordinated deploys',
    'HTTP/2 dependency inherits TCP HOL blocking issues',
  ],
  comparisonNotes: 'gRPC combines HTTP/2 multiplexing with Protobuf binary serialization for efficient, typed RPC. It supports unary, server-streaming, client-streaming, and bidirectional streaming patterns. Compare with REST/JSON for readability vs gRPC for performance.',
};

const WEBSOCKET: ProtocolDefinition = {
  name: 'WebSocket',
  layers: ['Application (Layer 7)', 'Transport (Layer 4, over TCP)'],
  headerFields: [
    { name: 'FIN', sizeBytes: 0, purpose: '1 bit: indicates final fragment of a message', exampleValue: '1' },
    { name: 'RSV1-3', sizeBytes: 0, purpose: '3 bits: reserved for extensions (e.g., permessage-deflate)', exampleValue: '0' },
    { name: 'Opcode', sizeBytes: 0, purpose: '4 bits: frame type (0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong)', exampleValue: '0x1 (text)' },
    { name: 'Mask', sizeBytes: 0, purpose: '1 bit: whether payload is XOR-masked (required client-to-server)', exampleValue: '1' },
    { name: 'Payload Length', sizeBytes: 0, purpose: '7 bits (+16/64 bits extended): payload byte count', exampleValue: '125' },
    { name: 'Masking Key', sizeBytes: 4, purpose: 'XOR key for client-to-server frames (when Mask=1)', exampleValue: '0x37fa213d' },
    { name: 'Payload Data', sizeBytes: 0, purpose: 'Application data (text UTF-8 or binary)', exampleValue: '{"event":"update","data":{}}' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'HTTP Upgrade Request', description: 'Client sends HTTP/1.1 GET with headers: Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version: 13.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'HTTP 101 Switching Protocols', description: 'Server responds with 101, Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Accept (SHA-1 hash of key + magic GUID).' },
    { step: 3, sender: 'Both', receiver: 'Both', message: 'Full-duplex frames', description: 'Connection upgraded. Both sides can send frames independently at any time. No request/response pairing required.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1 RTT for upgrade handshake; near-zero overhead per frame after that',
    throughput: 'Wire-efficient: 2-14 byte frame header; supports binary and text',
    overhead: '2 bytes minimum frame header (6 with masking key); no HTTP headers per message',
    connectionSetupTime: '1 RTT for TCP + 1 RTT for HTTP upgrade (often combined with TLS)',
  },
  useCases: [
    'Real-time web applications (chat, collaboration, live dashboards)',
    'Multiplayer game state synchronization',
    'Live financial data feeds (stock tickers)',
    'Push notifications to browsers',
  ],
  tradeoffs: [
    'Stateful: harder to load-balance (sticky sessions or connection affinity)',
    'No built-in reconnection or backpressure (application must handle)',
    'Firewall/proxy compatibility issues in some corporate environments',
    'Memory cost per open connection on the server side',
  ],
  comparisonNotes: 'WebSocket provides persistent, full-duplex communication with minimal per-frame overhead. Ideal for real-time use cases. Compare with SSE (server-only push, simpler) and HTTP long-polling (higher overhead). For RPC patterns, gRPC bidirectional streaming may be more structured.',
};

const TLS: ProtocolDefinition = {
  name: 'TLS 1.3',
  layers: ['Presentation/Session (Layer 5-6)', 'Transport (Layer 4)'],
  headerFields: [
    { name: 'Content Type', sizeBytes: 1, purpose: 'Record type: handshake (22), application_data (23), alert (21), change_cipher_spec (20)', exampleValue: '22 (handshake)' },
    { name: 'Legacy Version', sizeBytes: 2, purpose: 'Fixed to 0x0303 (TLS 1.2) for middlebox compatibility', exampleValue: '0x0303' },
    { name: 'Length', sizeBytes: 2, purpose: 'Length of the enclosed fragment', exampleValue: '512' },
    { name: 'Fragment', sizeBytes: 0, purpose: 'Handshake message, alert, or encrypted application data', exampleValue: '<encrypted payload>' },
    { name: 'ClientHello Extensions', sizeBytes: 0, purpose: 'supported_versions, key_share, signature_algorithms, SNI, ALPN', exampleValue: 'key_share: x25519' },
    { name: 'AEAD Tag', sizeBytes: 16, purpose: 'Authentication tag for encrypted records (e.g., AES-128-GCM)', exampleValue: '0x...16 bytes...' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'ClientHello', description: 'Client sends supported cipher suites, key_share (ECDHE public key), supported_versions=[TLS 1.3], SNI, ALPN.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'ServerHello + EncryptedExtensions + Certificate + CertificateVerify + Finished', description: 'Server selects cipher suite, sends key_share, certificate, and completes its side of the handshake. All in one flight.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'Finished', description: 'Client verifies server certificate and Finished MAC. Sends its own Finished. Handshake complete in 1 RTT.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1 RTT for full handshake; 0-RTT for resumed sessions (with replay risk)',
    throughput: 'Adds ~5-15% CPU overhead for encryption; AES-NI hardware acceleration eliminates most cost',
    overhead: '5-byte record header + 16-byte AEAD tag per record; ~50 bytes per record overhead',
    connectionSetupTime: '1 RTT (down from 2 RTTs in TLS 1.2); 0-RTT on resumption',
  },
  useCases: [
    'Securing all HTTP traffic (HTTPS)',
    'Email encryption (SMTPS, IMAPS)',
    'Database connection encryption',
    'Any TCP-based protocol requiring confidentiality and integrity',
  ],
  tradeoffs: [
    '0-RTT data is vulnerable to replay attacks (must be idempotent)',
    'Certificate management overhead (issuance, rotation, revocation)',
    'Middlebox interference (some firewalls break TLS 1.3 features)',
    'Perfect Forward Secrecy mandated (no static RSA key exchange)',
  ],
  comparisonNotes: 'TLS 1.3 dramatically simplified the handshake to 1-RTT (from 2 in TLS 1.2), removed insecure cipher suites, and mandates forward secrecy. It encrypts more of the handshake to resist passive surveillance. In QUIC, TLS 1.3 is integrated directly into the transport.',
};

const DNS: ProtocolDefinition = {
  name: 'DNS',
  layers: ['Application (Layer 7)', 'Transport (UDP/TCP, Layer 4)'],
  headerFields: [
    { name: 'Transaction ID', sizeBytes: 2, purpose: 'Matches responses to requests', exampleValue: '0xABCD' },
    { name: 'Flags', sizeBytes: 2, purpose: 'QR, Opcode, AA, TC, RD, RA, Z, RCODE', exampleValue: '0x0100 (standard query, recursion desired)' },
    { name: 'Question Count', sizeBytes: 2, purpose: 'Number of questions in the query', exampleValue: '1' },
    { name: 'Answer Count', sizeBytes: 2, purpose: 'Number of answer resource records', exampleValue: '2' },
    { name: 'Authority Count', sizeBytes: 2, purpose: 'Number of authority (NS) resource records', exampleValue: '0' },
    { name: 'Additional Count', sizeBytes: 2, purpose: 'Number of additional resource records', exampleValue: '1' },
    { name: 'Question Section', sizeBytes: 0, purpose: 'QNAME (domain), QTYPE (A, AAAA, CNAME, MX), QCLASS (IN)', exampleValue: 'example.com IN A' },
    { name: 'Answer Section', sizeBytes: 0, purpose: 'NAME, TYPE, CLASS, TTL, RDLENGTH, RDATA', exampleValue: 'example.com A 300 93.184.216.34' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Recursive Resolver', message: 'DNS Query', description: 'Client sends UDP query to its configured recursive resolver (e.g., 8.8.8.8) asking for the A record of a domain.' },
    { step: 2, sender: 'Recursive Resolver', receiver: 'Root NS', message: 'Query (if cache miss)', description: 'Resolver queries a root nameserver for the TLD authority (e.g., .com NS).' },
    { step: 3, sender: 'Recursive Resolver', receiver: 'TLD NS', message: 'Query', description: 'Resolver queries the TLD nameserver for the authoritative NS of the domain.' },
    { step: 4, sender: 'Recursive Resolver', receiver: 'Authoritative NS', message: 'Query', description: 'Resolver queries the authoritative nameserver for the final answer (A/AAAA record).' },
    { step: 5, sender: 'Recursive Resolver', receiver: 'Client', message: 'DNS Response', description: 'Resolver returns the resolved IP address(es) to the client. Result is cached per TTL.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1-100ms from cache; 50-300ms for full recursive resolution (4 network hops)',
    throughput: 'Lightweight: typically single UDP datagram per query/response',
    overhead: '12-byte fixed header + variable question/answer sections; typically <512 bytes over UDP',
    connectionSetupTime: '0 RTT (UDP, connectionless). Falls back to TCP for responses >512 bytes or zone transfers.',
  },
  useCases: [
    'Domain name to IP address resolution',
    'Service discovery (SRV records)',
    'Email routing (MX records)',
    'CDN and load-balancing (geo-DNS, weighted records)',
  ],
  tradeoffs: [
    'UDP-based: vulnerable to spoofing without DNSSEC',
    'Caching introduces staleness (TTL trade-off)',
    'Recursive resolution adds multiple network hops on cache miss',
    'DNS-over-HTTPS/TLS adds encryption but increases latency',
  ],
  comparisonNotes: 'DNS is the Internet phone book. Most queries are single UDP roundtrips (<512 bytes). DNSSEC adds authentication but not encryption. DoH and DoT add encryption but increase setup cost. Critical system design decision: TTL values balance freshness vs lookup latency.',
};

const MQTT: ProtocolDefinition = {
  name: 'MQTT',
  layers: ['Application (Layer 7)', 'Transport (TCP, Layer 4)'],
  headerFields: [
    { name: 'Packet Type', sizeBytes: 0, purpose: '4 bits: CONNECT(1), CONNACK(2), PUBLISH(3), PUBACK(4), SUBSCRIBE(8), SUBACK(9), PINGREQ(12), PINGRESP(13), DISCONNECT(14)', exampleValue: '3 (PUBLISH)' },
    { name: 'Flags', sizeBytes: 0, purpose: '4 bits: DUP, QoS (2 bits), RETAIN', exampleValue: 'QoS=1, RETAIN=0' },
    { name: 'Remaining Length', sizeBytes: 0, purpose: '1-4 bytes variable-length encoding of payload size', exampleValue: '42' },
    { name: 'Topic Name', sizeBytes: 0, purpose: 'UTF-8 encoded publish topic (for PUBLISH packets)', exampleValue: 'sensors/temp/room1' },
    { name: 'Packet Identifier', sizeBytes: 2, purpose: 'Used for QoS 1 and 2 message acknowledgment', exampleValue: '1234' },
    { name: 'Payload', sizeBytes: 0, purpose: 'Application message body (any format)', exampleValue: '{"temp":22.5,"unit":"C"}' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Broker', message: 'CONNECT', description: 'Client sends CONNECT with client ID, clean session flag, keep-alive interval, optional will message, credentials.' },
    { step: 2, sender: 'Broker', receiver: 'Client', message: 'CONNACK', description: 'Broker responds with return code (0=accepted) and session-present flag.' },
    { step: 3, sender: 'Client', receiver: 'Broker', message: 'SUBSCRIBE', description: 'Client subscribes to topic filter(s) with requested QoS level per topic.' },
    { step: 4, sender: 'Broker', receiver: 'Client', message: 'SUBACK', description: 'Broker confirms subscription with granted QoS levels.' },
  ],
  performanceCharacteristics: {
    latencyMs: '1 RTT for CONNECT/CONNACK; messages add 1 RTT for QoS 1, 2 RTTs for QoS 2',
    throughput: 'Extremely lightweight: 2-byte minimum header; designed for constrained devices',
    overhead: '2 bytes minimum fixed header; CONNECT packet ~20-50 bytes',
    connectionSetupTime: '1 RTT (TCP) + 1 RTT (MQTT CONNECT/CONNACK)',
  },
  useCases: [
    'IoT sensor data collection at scale',
    'Mobile push notifications (low bandwidth)',
    'Home automation (smart devices)',
    'Vehicle telemetry and fleet management',
  ],
  tradeoffs: [
    'Broker is a single point of failure (cluster for HA)',
    'Topic-based routing only (no complex routing rules built-in)',
    'QoS 2 (exactly-once) is expensive (4 packets per message)',
    'No built-in schema enforcement or message validation',
  ],
  comparisonNotes: 'MQTT is purpose-built for constrained devices and unreliable networks. Its minimal 2-byte header makes it far lighter than HTTP. Three QoS levels (0=fire-and-forget, 1=at-least-once, 2=exactly-once) let you trade reliability for performance. Compare with AMQP for enterprise messaging.',
};

const AMQP: ProtocolDefinition = {
  name: 'AMQP 0-9-1',
  layers: ['Application (Layer 7)', 'Transport (TCP, Layer 4)'],
  headerFields: [
    { name: 'Frame Type', sizeBytes: 1, purpose: 'METHOD(1), HEADER(2), BODY(3), HEARTBEAT(8)', exampleValue: '1 (METHOD)' },
    { name: 'Channel', sizeBytes: 2, purpose: 'Multiplexed channel number within the connection', exampleValue: '1' },
    { name: 'Size', sizeBytes: 4, purpose: 'Payload size in bytes', exampleValue: '256' },
    { name: 'Class ID', sizeBytes: 2, purpose: 'AMQP class: Basic(60), Exchange(40), Queue(50), Connection(10), Channel(20)', exampleValue: '60 (Basic)' },
    { name: 'Method ID', sizeBytes: 2, purpose: 'Method within class: Publish(40), Deliver(60), Ack(80), Consume(20)', exampleValue: '40 (Publish)' },
    { name: 'Properties', sizeBytes: 0, purpose: 'Content-type, delivery-mode, priority, correlation-id, reply-to, expiration', exampleValue: 'delivery-mode=2 (persistent)' },
    { name: 'Body', sizeBytes: 0, purpose: 'Application message payload', exampleValue: '{"order_id":123,"action":"process"}' },
    { name: 'Frame End', sizeBytes: 1, purpose: 'Frame delimiter byte (0xCE)', exampleValue: '0xCE' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Broker', message: 'Protocol Header', description: 'Client sends AMQP protocol header: "AMQP" + version bytes (0, 0, 9, 1).' },
    { step: 2, sender: 'Broker', receiver: 'Client', message: 'Connection.Start', description: 'Broker sends server properties and supported SASL mechanisms.' },
    { step: 3, sender: 'Client', receiver: 'Broker', message: 'Connection.Start-Ok', description: 'Client responds with selected mechanism and credentials.' },
    { step: 4, sender: 'Broker', receiver: 'Client', message: 'Connection.Tune', description: 'Broker proposes channel-max, frame-max, heartbeat interval.' },
    { step: 5, sender: 'Client', receiver: 'Broker', message: 'Connection.Tune-Ok + Connection.Open', description: 'Client accepts tuning and opens the virtual host.' },
    { step: 6, sender: 'Broker', receiver: 'Client', message: 'Connection.Open-Ok', description: 'Broker confirms virtual host access. Client may now open channels.' },
  ],
  performanceCharacteristics: {
    latencyMs: '3-4 RTTs for connection setup; sub-millisecond per-message on warm channel',
    throughput: 'Supports persistent messages, publisher confirms, and consumer prefetch for flow control',
    overhead: '8 bytes frame header + class/method IDs; larger than MQTT but richer routing semantics',
    connectionSetupTime: '1 RTT (TCP) + 3 RTTs (AMQP negotiation) = ~4 RTTs total',
  },
  useCases: [
    'Enterprise message queuing (RabbitMQ)',
    'Work queue patterns (task distribution)',
    'Pub/sub with exchange-based routing (fanout, topic, headers)',
    'Event-driven architectures with reliability guarantees',
  ],
  tradeoffs: [
    'Complex protocol with many frame types and negotiation steps',
    'Higher overhead than MQTT (not suitable for constrained IoT)',
    'Broker clustering and federation add operational complexity',
    'Message ordering guarantees vary by exchange type',
  ],
  comparisonNotes: 'AMQP provides enterprise-grade messaging with rich routing (exchanges: direct, fanout, topic, headers), message persistence, and acknowledgment. Heavier than MQTT but far more flexible for complex routing. RabbitMQ is the dominant implementation.',
};

const GRAPHQL: ProtocolDefinition = {
  name: 'GraphQL',
  layers: ['Application (Layer 7, typically over HTTP)'],
  headerFields: [
    { name: 'HTTP Method', sizeBytes: 0, purpose: 'POST for mutations/queries; GET for persisted queries', exampleValue: 'POST' },
    { name: 'Content-Type', sizeBytes: 0, purpose: 'Request body format', exampleValue: 'application/json' },
    { name: 'Query', sizeBytes: 0, purpose: 'GraphQL query/mutation/subscription string', exampleValue: '{ user(id: 1) { name email } }' },
    { name: 'Variables', sizeBytes: 0, purpose: 'JSON object of variable values for parameterized queries', exampleValue: '{"id": 1}' },
    { name: 'Operation Name', sizeBytes: 0, purpose: 'Selects which named operation to execute from the document', exampleValue: 'GetUser' },
    { name: 'Extensions', sizeBytes: 0, purpose: 'Vendor-specific extensions (persisted queries hash, tracing)', exampleValue: '{"persistedQuery":{"sha256Hash":"abc123"}}' },
  ],
  handshakeSteps: [
    { step: 1, sender: 'Client', receiver: 'Server', message: 'HTTP POST /graphql', description: 'Client sends JSON body with query, variables, and operationName fields over standard HTTP.' },
    { step: 2, sender: 'Server', receiver: 'Client', message: 'HTTP 200 Response', description: 'Server parses query, validates against schema, resolves fields, and returns JSON { data, errors } response.' },
    { step: 3, sender: 'Client', receiver: 'Server', message: 'WebSocket (for subscriptions)', description: 'For real-time subscriptions, client upgrades to WebSocket using graphql-ws protocol. Server pushes events.' },
  ],
  performanceCharacteristics: {
    latencyMs: 'Same as HTTP (1 RTT per request); N+1 resolver problem can add backend latency without DataLoader',
    throughput: 'Reduces over-fetching (client requests only needed fields); increases payload efficiency 30-70%',
    overhead: 'Query string adds request size; responses are JSON (larger than Protobuf but human-readable)',
    connectionSetupTime: 'Same as HTTP/HTTPS (1-3 RTTs); persistent connections via HTTP/2 or WebSocket',
  },
  useCases: [
    'Mobile and web clients with diverse data needs',
    'API gateway aggregating multiple backend services',
    'Real-time features via subscriptions (notifications, live updates)',
    'Rapid frontend iteration without backend changes',
  ],
  tradeoffs: [
    'Query complexity attacks (deeply nested queries can DoS the server)',
    'Caching is harder (POST requests with variable bodies; no URL-based HTTP caching)',
    'N+1 problem requires DataLoader or query planning',
    'Schema design and versioning require careful governance',
  ],
  comparisonNotes: 'GraphQL gives clients precise control over data fetching, eliminating over-fetching and under-fetching common with REST. The schema acts as a contract. Compare with REST for simplicity and cacheability, gRPC for performance between services.',
};

// ── Exports ─────────────────────────────────────────────────

/** All protocol definitions keyed by a URL-safe slug. */
export const PROTOCOLS: Record<string, ProtocolDefinition> = {
  tcp: TCP,
  'http-2': HTTP2,
  'http-3': HTTP3,
  grpc: GRPC,
  websocket: WEBSOCKET,
  tls: TLS,
  dns: DNS,
  mqtt: MQTT,
  amqp: AMQP,
  graphql: GRAPHQL,
} as const;

/** Ordered list of protocol slugs for iteration. */
export const PROTOCOL_SLUGS = Object.keys(PROTOCOLS);

/** Returns a protocol definition by slug, or undefined. */
export function getProtocol(slug: string): ProtocolDefinition | undefined {
  return PROTOCOLS[slug];
}

/**
 * Builds a side-by-side comparison summary for two protocols.
 *
 * @param slugA - First protocol slug.
 * @param slugB - Second protocol slug.
 * @returns Comparison object, or null if either slug is invalid.
 */
export function compareProtocols(
  slugA: string,
  slugB: string,
): {
  protocolA: ProtocolDefinition;
  protocolB: ProtocolDefinition;
  headerCountA: number;
  headerCountB: number;
  handshakeStepsA: number;
  handshakeStepsB: number;
} | null {
  const a = PROTOCOLS[slugA];
  const b = PROTOCOLS[slugB];
  if (!a || !b) return null;

  return {
    protocolA: a,
    protocolB: b,
    headerCountA: a.headerFields.length,
    headerCountB: b.headerFields.length,
    handshakeStepsA: a.handshakeSteps.length,
    handshakeStepsB: b.handshakeSteps.length,
  };
}
