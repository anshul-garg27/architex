import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — TLS 1.3 Handshake Data (NET-TLS13)
// ─────────────────────────────────────────────────────────────
//
// Provides structured TLS 1.3 1-RTT handshake sequence data
// for the NetworkingModule sequence diagram visualization.
//
// TLS 1.3 (RFC 8446) achieves a 1-RTT handshake by combining
// key exchange parameters into the ClientHello message. This
// module defines every message flight with:
//
// - Plaintext vs encrypted region indicators
// - Cipher suite, key share, and certificate details
// - Color coding metadata for visualization
//
// The exported TLS13Message type carries encryption state so the
// renderer can color-code plaintext (red) vs encrypted (green)
// message regions in the sequence diagram.
// ─────────────────────────────────────────────────────────────

/**
 * Discriminator for each message in the TLS 1.3 1-RTT flow.
 */
export type TLS13MessageType =
  | 'ClientHello'
  | 'ServerHello'
  | 'EncryptedExtensions'
  | 'Certificate'
  | 'CertificateVerify'
  | 'Finished'
  | 'ApplicationData';

/**
 * A single message in the TLS 1.3 handshake sequence.
 *
 * Extends the base sequence format with encryption state and
 * structured detail metadata for the properties panel.
 */
export interface TLS13Message extends ProtocolTimelineEvent {
  /** Endpoint that sends this message (narrows base `from`). */
  from: 'client' | 'server';
  /** Endpoint that receives this message (narrows base `to`). */
  to: 'client' | 'server';
  /** TLS 1.3 handshake message type. */
  type: TLS13MessageType;
  /** Key-value detail metadata (cipher suites, extensions, etc.). */
  details: Record<string, string>;
  /** Whether this message is sent over an encrypted channel. */
  encrypted: boolean;
  /** Which RTT phase this message belongs to (for bracket rendering). */
  rttPhase: 'initial' | 'server-flight' | 'client-finish' | 'application';
}

// ── TLS 1.3 1-RTT Handshake Messages ───────────────────────

/**
 * Complete TLS 1.3 1-RTT handshake flow.
 *
 * Message sequence:
 * 1. Client -> Server: ClientHello (plaintext)
 *    - supported_versions: TLS 1.3
 *    - cipher_suites: AES-128-GCM, AES-256-GCM, ChaCha20-Poly1305
 *    - key_share: x25519 public key (enables 1-RTT)
 *    - signature_algorithms: ECDSA P-256, RSA-PSS
 *    - server_name: example.com (SNI)
 *
 * 2. Server -> Client: ServerHello (plaintext, last plaintext message)
 *    - selected_version: TLS 1.3
 *    - selected_cipher: TLS_AES_128_GCM_SHA256
 *    - key_share: x25519 server public key
 *    --> Both sides derive handshake traffic keys via HKDF
 *
 * 3. Server -> Client: EncryptedExtensions (ENCRYPTED)
 *    - ALPN: h2 (HTTP/2 negotiated)
 *    - max_fragment_length: 16384
 *
 * 4. Server -> Client: Certificate (ENCRYPTED)
 *    - X.509 chain: leaf + intermediate
 *    - Privacy improvement over TLS 1.2 (cert was plaintext)
 *
 * 5. Server -> Client: CertificateVerify (ENCRYPTED)
 *    - Signature over handshake transcript hash
 *    - Proves server holds the private key
 *
 * 6. Server -> Client: Finished (ENCRYPTED)
 *    - HMAC over entire handshake transcript
 *    - Server can now send 0.5-RTT application data
 *
 * 7. Client -> Server: Finished (ENCRYPTED)
 *    - HMAC over handshake transcript
 *    - Both sides derive application traffic keys
 *    - 1-RTT handshake complete
 *
 * 8. Bidirectional: ApplicationData (ENCRYPTED)
 *    - AES-128-GCM with HKDF-derived keys
 *    - Full forward secrecy via ephemeral ECDHE
 */
export const TLS13_HANDSHAKE_MESSAGES: TLS13Message[] = [
  // ── Plaintext Region ─────────────────────────────────────
  {
    tick: 1,
    from: 'client',
    to: 'server',
    type: 'ClientHello',
    description:
      'Client initiates TLS 1.3 handshake. Sends supported cipher suites, ' +
      'key shares (x25519 ECDHE), signature algorithms, and SNI extension. ' +
      'The key_share extension is the key innovation — by including the DH public key upfront, ' +
      'TLS 1.3 achieves 1-RTT instead of 1.2\'s 2-RTT. On a 56ms NY-London link, ' +
      'that saves 56ms on every new connection.',
    details: {
      supported_versions: 'TLS 1.3 (0x0304)',
      cipher_suites: 'TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256',
      key_share_group: 'x25519',
      key_share_public: '[32-byte ephemeral public key]',
      signature_algorithms: 'ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256',
      server_name: 'example.com',
      psk_key_exchange_modes: 'psk_dhe_ke',
    },
    encrypted: false,
    rttPhase: 'initial',
  },
  {
    tick: 2,
    from: 'server',
    to: 'client',
    type: 'ServerHello',
    description:
      'Server selects cipher suite and key share. After this message, ' +
      'both sides can derive handshake traffic keys using HKDF-Extract ' +
      'over the shared ECDHE secret. This is the LAST plaintext message ' +
      'in the TLS 1.3 handshake. All subsequent messages are encrypted.',
    details: {
      selected_version: 'TLS 1.3 (0x0304)',
      selected_cipher_suite: 'TLS_AES_128_GCM_SHA256',
      key_share_group: 'x25519',
      key_share_public: '[32-byte server ephemeral public key]',
      handshake_key_derivation: 'HKDF-Extract(ECDHE_shared_secret)',
    },
    encrypted: false,
    rttPhase: 'initial',
  },

  // ── Encrypted Region (Server Flight) ─────────────────────
  {
    tick: 3,
    from: 'server',
    to: 'client',
    type: 'EncryptedExtensions',
    description:
      'Server sends extensions that are not required for key derivation. ' +
      'Encrypted with handshake traffic keys. In TLS 1.2, these were ' +
      'sent in plaintext, exposing metadata to passive observers.',
    details: {
      alpn: 'h2 (HTTP/2)',
      max_fragment_length: '16384 bytes',
      server_name_ack: 'acknowledged',
      encryption: 'handshake traffic keys (AES-128-GCM)',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },
  {
    tick: 4,
    from: 'server',
    to: 'client',
    type: 'Certificate',
    description:
      'Server sends its X.509 certificate chain, encrypted. This is a ' +
      'major privacy improvement over TLS 1.2 where certificates were ' +
      'sent in plaintext, allowing passive observers to identify the ' +
      'server. Client will verify the chain up to a trusted root CA.',
    details: {
      subject: 'CN=example.com',
      issuer: "CN=Let's Encrypt Authority X3",
      key_type: 'ECDSA P-256',
      validity: '2025-01-01 to 2026-01-01',
      chain_length: '2 (leaf + intermediate)',
      ct_sct: 'Signed Certificate Timestamp included',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },
  {
    tick: 5,
    from: 'server',
    to: 'client',
    type: 'CertificateVerify',
    description:
      'Server proves possession of the certificate private key by signing ' +
      'a hash of the entire handshake transcript (all messages so far). ' +
      'This binds the server\'s identity to the specific handshake, ' +
      'preventing replay and man-in-the-middle attacks.',
    details: {
      signature_algorithm: 'ecdsa_secp256r1_sha256',
      transcript_hash: 'SHA-256(ClientHello || ServerHello || EncryptedExtensions || Certificate)',
      purpose: 'Proves server owns the private key matching the certificate',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },
  {
    tick: 6,
    from: 'server',
    to: 'client',
    type: 'Finished',
    description:
      'Server sends Finished with HMAC over the entire handshake transcript. ' +
      'Client verifies this MAC to confirm both sides saw the same handshake. ' +
      'Server can now send 0.5-RTT application data (early response data ' +
      'before receiving client Finished).',
    details: {
      verify_data: 'HMAC-SHA256(server_handshake_traffic_secret, transcript_hash)',
      handshake_status: 'server-side complete',
      '0_5_rtt_data': 'server may now send application data',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },

  // ── Encrypted Region (Client Finish) ─────────────────────
  {
    tick: 7,
    from: 'client',
    to: 'server',
    type: 'Finished',
    description:
      'Client sends its Finished message confirming handshake integrity. ' +
      'Both sides now derive application traffic keys from the handshake ' +
      'transcript. TLS 1.3 handshake is complete in exactly 1 round trip.',
    details: {
      verify_data: 'HMAC-SHA256(client_handshake_traffic_secret, transcript_hash)',
      handshake_status: 'both sides complete',
      total_round_trips: '1',
      key_derivation: 'HKDF-Expand-Label for application traffic secrets',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'client-finish',
  },

  // ── Application Data ─────────────────────────────────────
  {
    tick: 8,
    from: 'client',
    to: 'server',
    type: 'ApplicationData',
    description:
      'Encrypted application data flows freely in both directions. ' +
      'All data is protected with AES-128-GCM using application traffic ' +
      'keys derived via HKDF. Ephemeral keys mean compromising the server later ' +
      'cannot decrypt past traffic — this is forward secrecy, and TLS 1.3 ' +
      'mandates it (unlike TLS 1.2 which allowed static RSA key exchange).',
    details: {
      encryption: 'AES-128-GCM (application traffic keys)',
      key_derivation: 'HKDF-SHA256',
      forward_secrecy: 'yes (ephemeral x25519 ECDHE)',
      key_update: 'supported via KeyUpdate message',
      '0_rtt_resumption': 'NewSessionTicket enables future 0-RTT',
    },
    encrypted: true,
    rttPhase: 'application',
  },
];

// ── TLS 1.3 0-RTT Resumption Messages ──────────────────────

/**
 * TLS 1.3 0-RTT resumption flow using Pre-Shared Key (PSK).
 *
 * When a client has previously connected and received a NewSessionTicket,
 * it can send early data (0-RTT) alongside the ClientHello. The server
 * processes this data before the handshake completes.
 *
 * SECURITY CAVEAT: 0-RTT data is NOT forward-secret and is
 * vulnerable to replay attacks. Applications must ensure 0-RTT
 * data is idempotent (e.g., GET requests, not payments).
 */
export const TLS13_0RTT_MESSAGES: TLS13Message[] = [
  {
    tick: 1,
    from: 'client',
    to: 'server',
    type: 'ClientHello',
    description:
      'Client sends ClientHello with PSK identity (from previous session\'s ' +
      'NewSessionTicket) and early data indication. Early data is encrypted ' +
      'with keys derived from the PSK. WARNING: 0-RTT data is NOT ' +
      'forward-secret and is vulnerable to replay attacks.',
    details: {
      psk_identity: '[session ticket from previous connection]',
      psk_mode: 'psk_dhe_ke',
      early_data_indication: 'present',
      cipher_suite: 'TLS_AES_128_GCM_SHA256',
      key_share_group: 'x25519',
    },
    encrypted: false,
    rttPhase: 'initial',
  },
  {
    tick: 2,
    from: 'client',
    to: 'server',
    type: 'ApplicationData',
    description:
      'Client sends early application data (0-RTT) alongside ClientHello. ' +
      'Server may process this before handshake completes. Must be ' +
      'idempotent (e.g., HTTP GET, not a payment or state mutation).',
    details: {
      encryption: 'early_data_key (derived from PSK)',
      forward_secrecy: 'NO (derived from PSK, not ephemeral ECDHE)',
      replay_protection: 'application-layer only (server must implement)',
      content: '[encrypted HTTP GET /api/data]',
    },
    encrypted: true,
    rttPhase: 'initial',
  },
  {
    tick: 3,
    from: 'server',
    to: 'client',
    type: 'ServerHello',
    description:
      'Server accepts PSK and selects cipher suite. Includes fresh key ' +
      'share for forward secrecy of all post-handshake data.',
    details: {
      selected_psk: 'accepted (index 0)',
      selected_cipher_suite: 'TLS_AES_128_GCM_SHA256',
      key_share_group: 'x25519',
      early_data: 'accepted',
    },
    encrypted: false,
    rttPhase: 'server-flight',
  },
  {
    tick: 4,
    from: 'server',
    to: 'client',
    type: 'EncryptedExtensions',
    description:
      'Server confirms early data acceptance and sends negotiated extensions.',
    details: {
      early_data: 'accepted',
      alpn: 'h2',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },
  {
    tick: 5,
    from: 'server',
    to: 'client',
    type: 'Finished',
    description:
      'Server Finished. No Certificate/CertificateVerify needed because ' +
      'server is authenticated via the PSK from the previous session.',
    details: {
      verify_data: 'HMAC over handshake transcript',
      authentication_method: 'PSK (no certificate needed)',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'server-flight',
  },
  {
    tick: 6,
    from: 'client',
    to: 'server',
    type: 'Finished',
    description:
      'Client Finished. Full handshake complete. 0-RTT data was already ' +
      'processed during the handshake. All subsequent data uses full ' +
      'forward-secret keys derived from both PSK and fresh ECDHE.',
    details: {
      verify_data: 'HMAC over handshake transcript',
      total_round_trips: '0 (early data), 1 (handshake)',
      forward_secrecy: 'yes (for all post-handshake data)',
      encryption: 'handshake traffic keys',
    },
    encrypted: true,
    rttPhase: 'client-finish',
  },
  {
    tick: 7,
    from: 'server',
    to: 'client',
    type: 'ApplicationData',
    description:
      'Encrypted application data flows with full forward secrecy. ' +
      'Server may respond to the 0-RTT early data request.',
    details: {
      encryption: 'AES-128-GCM (application traffic keys)',
      key_derivation: 'HKDF-SHA256 (PSK + ECDHE)',
      forward_secrecy: 'yes',
    },
    encrypted: true,
    rttPhase: 'application',
  },
];

// ── Helper: Convert TLS13Message to sequence-diagram format ─

/**
 * Converts TLS 1.3 messages to the SequenceMessage format used by the
 * NetworkingModule sequence diagram renderer.
 *
 * @param messages - Array of TLS13Message objects.
 * @returns Array of objects with from, to, label, description fields.
 */
export function tls13ToSequenceMessages(
  messages: TLS13Message[],
): Array<{ from: string; to: string; label: string; description: string }> {
  return messages.map((m) => ({
    from: m.from === 'client' ? 'Client' : 'Server',
    to: m.to === 'client' ? 'Client' : 'Server',
    label: `${m.encrypted ? '\u{1F512} ' : ''}${m.type}`,
    description: m.description,
  }));
}

/**
 * Row background color function for plaintext (red) vs encrypted (green)
 * regions in the sequence diagram.
 *
 * @param messages - The TLS 1.3 message array.
 * @param index - Row index to get the background color for.
 * @returns CSS color string or undefined.
 */
export function tls13RowBackground(
  messages: TLS13Message[],
  index: number,
): string | undefined {
  const msg = messages[index];
  if (!msg) return undefined;
  // 0-RTT early data is encrypted (PSK-derived keys) but NOT forward-secret
  // and is vulnerable to replay. Amber reflects this intermediate security.
  if (msg.encrypted && msg.rttPhase === 'initial') return '#f59e0b';
  return msg.encrypted ? '#22c55e' : '#ef4444';
}

/**
 * RTT bracket definitions for the TLS 1.3 1-RTT handshake.
 * Used by the SequenceDiagram component to render RTT indicators.
 */
export const TLS13_RTT_BRACKETS = [
  { startIdx: 0, endIdx: 6, label: '1 RTT', color: '#22c55e' },
];

/**
 * RTT bracket definitions for the TLS 1.3 0-RTT resumption.
 */
export const TLS13_0RTT_BRACKETS = [
  { startIdx: 0, endIdx: 1, label: '0-RTT (early data)', color: '#f59e0b' },
  { startIdx: 2, endIdx: 5, label: '1 RTT (handshake)', color: '#22c55e' },
];
