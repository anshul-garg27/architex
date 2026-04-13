// ─────────────────────────────────────────────────────────────
// Architex — HTTPS Full Flow Simulation  (SEC-016, SEC-017)
// ─────────────────────────────────────────────────────────────
//
// Simulates the complete lifecycle of an HTTPS request:
//   1. DNS Resolution         (~50 ms)
//   2. TCP 3-Way Handshake    (~0.5 ms same DC)
//   3. TLS 1.3 Handshake      (~1 RTT)
//   4. HTTP Request            (application layer)
//   5. HTTP Response           (application layer)
//   6. Connection Close        (FIN sequence)
//
// Returns an ordered list of HTTPSStep objects suitable for
// step-by-step playback in a vertical timeline visualization.
// ─────────────────────────────────────────────────────────────

/**
 * A single phase in the end-to-end HTTPS flow.
 */
export interface HTTPSStep {
  /** Which high-level phase this step belongs to. */
  phase: 'dns' | 'tcp' | 'tls' | 'http-request' | 'http-response' | 'close';
  /** Human-readable description of this step. */
  description: string;
  /** Cumulative elapsed time in milliseconds. */
  timing: number;
  /** Key-value details for this step (headers, payloads, etc.). */
  details: Record<string, string>;
  /** Sub-steps within this phase for expandable view. */
  subSteps?: {
    label: string;
    description: string;
    details?: Record<string, string>;
  }[];
}

/** Display-friendly phase names. */
export const HTTPS_PHASE_LABELS: Record<HTTPSStep['phase'], string> = {
  dns: 'DNS Resolution',
  tcp: 'TCP 3-Way Handshake',
  tls: 'TLS 1.3 Handshake',
  'http-request': 'HTTP Request',
  'http-response': 'HTTP Response',
  close: 'Connection Close',
};

/** Phase colours for timeline rendering. */
export const HTTPS_PHASE_COLORS: Record<HTTPSStep['phase'], string> = {
  dns: '#facc15',         // yellow
  tcp: '#60a5fa',         // blue
  tls: '#a78bfa',         // violet
  'http-request': '#4ade80',  // green
  'http-response': '#fb923c', // orange
  close: '#94a3b8',       // slate
};

// ── Helpers ──────────────────────────────────────────────────

function randomIPv4(): string {
  return `${93 + Math.floor(Math.random() * 10)}.${184 + Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

/**
 * Simulates the full end-to-end HTTPS request lifecycle.
 *
 * @param domain - The domain being requested (e.g. "api.example.com").
 * @returns Ordered list of HTTPS steps with cumulative timing.
 */
export function simulateHTTPSFlow(domain: string): HTTPSStep[] {
  const resolvedIP = randomIPv4();
  const steps: HTTPSStep[] = [];
  let elapsed = 0;

  // ── Phase 1: DNS Resolution (~50 ms) ────────────────────

  elapsed += 50;
  steps.push({
    phase: 'dns',
    description: `Resolve "${domain}" to ${resolvedIP} via recursive DNS lookup.`,
    timing: elapsed,
    details: {
      query: `A ${domain}`,
      resolvedIP,
      ttl: '3600s',
      resolver: '8.8.8.8 (Google Public DNS)',
      latency: '~50 ms',
    },
    subSteps: [
      {
        label: 'Stub Resolver',
        description: `OS stub resolver sends query for "${domain}" to configured recursive resolver.`,
        details: { type: 'A', class: 'IN' },
      },
      {
        label: 'Recursive Resolver',
        description: 'Recursive resolver checks local cache. Cache MISS — begins iterative resolution.',
      },
      {
        label: 'Root Nameserver',
        description: `Root nameserver refers to ".${domain.split('.').pop()}" TLD nameserver.`,
        details: { referral: `ns1.${domain.split('.').pop()}.` },
      },
      {
        label: 'TLD Nameserver',
        description: `TLD nameserver refers to authoritative nameserver for "${domain.split('.').slice(-2).join('.')}".`,
        details: { referral: `ns1.${domain.split('.').slice(-2).join('.')}.` },
      },
      {
        label: 'Authoritative Response',
        description: `Authoritative nameserver returns A record: ${resolvedIP} (TTL 3600s).`,
        details: { answer: `${domain} IN A ${resolvedIP}`, ttl: '3600' },
      },
    ],
  });

  // ── Phase 2: TCP 3-Way Handshake (~0.5 ms same DC) ──────

  elapsed += 0.5;
  steps.push({
    phase: 'tcp',
    description: `Establish TCP connection to ${resolvedIP}:443 via 3-way handshake.`,
    timing: elapsed,
    details: {
      source: `client:${49152 + Math.floor(Math.random() * 16384)}`,
      destination: `${resolvedIP}:443`,
      protocol: 'TCP',
      latency: '~0.5 ms (same datacenter)',
      windowSize: '65535 bytes',
    },
    subSteps: [
      {
        label: 'SYN',
        description: 'Client sends SYN segment with Initial Sequence Number (ISN) to initiate connection.',
        details: { flags: 'SYN', seqNum: '1000', ackNum: '0', windowSize: '65535' },
      },
      {
        label: 'SYN-ACK',
        description: 'Server responds with SYN-ACK, acknowledging client ISN and providing its own ISN.',
        details: { flags: 'SYN,ACK', seqNum: '5000', ackNum: '1001', windowSize: '65535' },
      },
      {
        label: 'ACK',
        description: 'Client sends ACK completing the 3-way handshake. Connection is ESTABLISHED.',
        details: { flags: 'ACK', seqNum: '1001', ackNum: '5001' },
      },
    ],
  });

  // ── Phase 3: TLS 1.3 Handshake (1-RTT) ──────────────────

  elapsed += 1.0;
  steps.push({
    phase: 'tls',
    description: 'Negotiate TLS 1.3 session with 1-RTT handshake for encrypted communication.',
    timing: elapsed,
    details: {
      protocol: 'TLS 1.3',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      keyExchange: 'x25519 (ECDHE)',
      certificate: `CN=${domain}`,
      roundTrips: '1 RTT',
      latency: '~1.0 ms',
    },
    subSteps: [
      {
        label: 'ClientHello',
        description: 'Client sends supported cipher suites, key shares (x25519), and SNI.',
        details: {
          sni: domain,
          cipherSuites: 'TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384',
          keyShareGroup: 'x25519',
        },
      },
      {
        label: 'ServerHello',
        description: 'Server selects cipher suite and key share. Both sides derive handshake keys.',
        details: {
          selectedCipher: 'TLS_AES_128_GCM_SHA256',
          keyShare: 'x25519 (server public key)',
        },
      },
      {
        label: 'Encrypted Extensions + Certificate',
        description: 'Server sends encrypted extensions, X.509 certificate chain, and CertificateVerify.',
        details: {
          alpn: 'h2',
          certIssuer: "Let's Encrypt Authority X3",
          certKeyType: 'ECDSA P-256',
        },
      },
      {
        label: 'Finished (both sides)',
        description: 'Server and client exchange Finished messages with handshake transcript MACs. Application data may now flow.',
        details: {
          forwardSecrecy: 'yes (ephemeral ECDHE)',
          encryption: 'AES-128-GCM',
        },
      },
    ],
  });

  // ── Phase 4: HTTP Request ─────────────────────────────────

  elapsed += 0.1;
  steps.push({
    phase: 'http-request',
    description: `Send encrypted HTTP/2 GET request to https://${domain}/api/data.`,
    timing: elapsed,
    details: {
      method: 'GET',
      path: '/api/data',
      protocol: 'HTTP/2 over TLS 1.3',
      host: domain,
      accept: 'application/json',
      authorization: 'Bearer <access_token>',
    },
    subSteps: [
      {
        label: 'Request Headers',
        description: 'Client sends HEADERS frame with pseudo-headers and request metadata.',
        details: {
          ':method': 'GET',
          ':path': '/api/data',
          ':scheme': 'https',
          ':authority': domain,
          'accept': 'application/json',
          'authorization': 'Bearer eyJhbG...truncated',
        },
      },
      {
        label: 'Encryption',
        description: 'Request is encrypted with AES-128-GCM using application traffic keys before transmission.',
        details: {
          cipher: 'AES-128-GCM',
          recordProtocol: 'TLS 1.3 record layer',
        },
      },
    ],
  });

  // ── Phase 5: HTTP Response ────────────────────────────────

  elapsed += 15;
  steps.push({
    phase: 'http-response',
    description: 'Server processes request and returns encrypted HTTP/2 200 OK response.',
    timing: elapsed,
    details: {
      status: '200 OK',
      contentType: 'application/json',
      contentLength: '256 bytes',
      cacheControl: 'private, max-age=60',
      serverProcessing: '~15 ms',
    },
    subSteps: [
      {
        label: 'Response Headers',
        description: 'Server sends HEADERS frame with status and response metadata.',
        details: {
          ':status': '200',
          'content-type': 'application/json; charset=utf-8',
          'content-length': '256',
          'cache-control': 'private, max-age=60',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        },
      },
      {
        label: 'Response Body',
        description: 'Server sends DATA frame containing the JSON response body.',
        details: {
          body: '{ "users": [...], "total": 42, "page": 1 }',
          compressed: 'gzip',
        },
      },
      {
        label: 'Decryption',
        description: 'Client decrypts the response using AES-128-GCM with application traffic keys.',
        details: { integrityCheck: 'GCM authentication tag verified' },
      },
    ],
  });

  // ── Phase 6: Connection Close (FIN sequence) ──────────────

  elapsed += 0.5;
  steps.push({
    phase: 'close',
    description: 'Gracefully close the TCP connection via 4-way FIN handshake.',
    timing: elapsed,
    details: {
      initiator: 'client',
      protocol: 'TCP 4-way teardown',
      latency: '~0.5 ms',
      note: 'HTTP/2 connections are typically kept alive for reuse (connection pooling)',
    },
    subSteps: [
      {
        label: 'TLS close_notify',
        description: 'Client sends TLS close_notify alert to signal end of encrypted communication.',
      },
      {
        label: 'FIN (client)',
        description: 'Client sends FIN segment. Client enters FIN_WAIT_1 state.',
        details: { flags: 'FIN,ACK' },
      },
      {
        label: 'ACK (server)',
        description: 'Server acknowledges the FIN. Client enters FIN_WAIT_2. Server enters CLOSE_WAIT.',
        details: { flags: 'ACK' },
      },
      {
        label: 'FIN (server)',
        description: 'Server sends its own FIN. Server enters LAST_ACK.',
        details: { flags: 'FIN,ACK' },
      },
      {
        label: 'ACK (client)',
        description: 'Client acknowledges server FIN. Client enters TIME_WAIT (2*MSL), then CLOSED.',
        details: { flags: 'ACK', timeWait: '2 * MSL (Maximum Segment Lifetime)' },
      },
    ],
  });

  return steps;
}
