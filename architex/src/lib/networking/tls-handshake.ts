import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — TLS Handshake Simulation
// ─────────────────────────────────────────────────────────────
//
// HOOK: "Every padlock icon = a cryptographic negotiation in
// <100ms that no eavesdropper can break."
//
// INTUITION — paint-mixing analogy for Diffie-Hellman:
//   1. Alice and Bob publicly agree on a base color (yellow).
//   2. Each secretly picks a private color (Alice=red, Bob=blue).
//   3. Each mixes their secret with the base and sends the
//      result publicly (Alice sends orange, Bob sends green).
//   4. Each mixes their private color with what they received.
//   5. Both arrive at the SAME final color — but an observer
//      who saw only the public exchanges cannot reverse the
//      mixing to recover either private color.
//   This is exactly how ECDHE key exchange works in TLS.
//
// Simulates TLS 1.3, TLS 1.3 0-RTT resumption, and TLS 1.2
// handshakes side by side. Models every flight of messages,
// cipher suite negotiation, key exchange, and certificate
// verification steps.
//
// TLS 1.3 achieves a 1-RTT handshake (vs 2-RTT for TLS 1.2)
// and supports 0-RTT resumption with pre-shared keys (PSK).
//
// Every method returns an ordered list of TLSMessage objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * Discriminator for each TLS handshake message type.
 *
 * TLS 1.3 message flow (1-RTT):
 *   ClientHello -> ServerHello + EncryptedExtensions + Certificate
 *     + CertificateVerify + Finished -> Finished -> ApplicationData
 *
 * TLS 1.2 message flow (2-RTT):
 *   ClientHello -> ServerHello + Certificate + ServerKeyExchange
 *     + ServerHelloDone -> ClientKeyExchange + ChangeCipherSpec
 *     + Finished -> ChangeCipherSpec + Finished -> ApplicationData
 */
export type TLSMessageType =
  | 'ClientHello'
  | 'ServerHello'
  | 'EncryptedExtensions'
  | 'Certificate'
  | 'CertificateVerify'
  | 'Finished'
  | 'ApplicationData'
  | 'ServerKeyExchange'
  | 'ServerHelloDone'
  | 'ClientKeyExchange'
  | 'ChangeCipherSpec';

/**
 * A single message in the TLS handshake timeline.
 */
export interface TLSMessage extends ProtocolTimelineEvent {
  /** Endpoint that sends this message (narrows base `from`). */
  from: 'client' | 'server';
  /** Endpoint that receives this message (narrows base `to`). */
  to: 'client' | 'server';
  /** Handshake message type. */
  type: TLSMessageType;
  /** Key-value details for this message (cipher suites, extensions, etc.). */
  details: Record<string, string>;
  /** Whether this message is sent over an encrypted channel. */
  encrypted: boolean;
}

/**
 * Simulates TLS handshakes for visualization.
 *
 * Supports three modes:
 * - `performHandshake()` — Standard TLS 1.3 (1-RTT).
 * - `performResumption()` — TLS 1.3 0-RTT with PSK.
 * - `performTLS12Handshake()` — Legacy TLS 1.2 (2-RTT).
 *
 * @example
 * ```ts
 * const tls = new TLSHandshake();
 * const msgs = tls.performHandshake();
 * for (const m of msgs) {
 *   console.log(`[${m.tick}] ${m.from} -> ${m.to}: ${m.type} (encrypted: ${m.encrypted})`);
 * }
 * ```
 */
export class TLSHandshake {
  /** Ordered message log. */
  messages: TLSMessage[];

  /** Monotonically increasing tick counter. */
  private tick: number;

  constructor() {
    this.messages = [];
    this.tick = 0;
  }

  // ── TLS 1.3 Full Handshake (1-RTT) ──────────────────────

  /**
   * Performs a full TLS 1.3 handshake (1-RTT).
   *
   * Message flow:
   * 1. Client -> Server: ClientHello (supported cipher suites, key shares, SNI)
   * 2. Server -> Client: ServerHello (selected cipher suite, key share)
   * 3. Server -> Client: EncryptedExtensions (ALPN, etc.) [encrypted]
   * 4. Server -> Client: Certificate (X.509 chain) [encrypted]
   * 5. Server -> Client: CertificateVerify (signature proof) [encrypted]
   * 6. Server -> Client: Finished (handshake MAC) [encrypted]
   * 7. Client -> Server: Finished (handshake MAC) [encrypted]
   * 8. Both: ApplicationData may now flow [encrypted]
   *
   * @returns Ordered list of handshake messages.
   */
  performHandshake(): TLSMessage[] {
    this.reset();
    const events: TLSMessage[] = [];

    // 1. ClientHello
    events.push(
      this.record('client', 'server', 'ClientHello', false, {
        description: [
          'Client initiates TLS 1.3 handshake.',
          'Sends supported cipher suites, key shares (ECDHE), and SNI.',
          'The key_share extension allows 1-RTT by piggybacking key exchange on ClientHello.',
        ],
        details: {
          supportedVersions: 'TLS 1.3',
          cipherSuites:
            'TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256',
          keyShareGroup: 'x25519',
          signatureAlgorithms: 'ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256',
          serverName: 'example.com',
        },
      }),
    );

    // 2. ServerHello
    events.push(
      this.record('server', 'client', 'ServerHello', false, {
        description: [
          'Server selects cipher suite and key share.',
          'After this message, both sides can derive handshake keys.',
          'All subsequent server messages are encrypted.',
        ],
        details: {
          selectedVersion: 'TLS 1.3',
          selectedCipherSuite: 'TLS_AES_128_GCM_SHA256',
          keyShareGroup: 'x25519',
          keySharePublic: '[server public key]',
        },
      }),
    );

    // 3. EncryptedExtensions (encrypted)
    events.push(
      this.record('server', 'client', 'EncryptedExtensions', true, {
        description: [
          'Server sends extensions that are not needed for key derivation.',
          'These are encrypted with the handshake traffic keys.',
        ],
        details: {
          alpn: 'h2',
          maxFragmentLength: '16384',
          serverName: 'acknowledged',
        },
      }),
    );

    // 4. Certificate (encrypted)
    events.push(
      this.record('server', 'client', 'Certificate', true, {
        description: [
          'Server sends its X.509 certificate chain.',
          'Client will verify the chain up to a trusted root CA.',
        ],
        details: {
          subject: 'CN=example.com',
          issuer: 'CN=Let\'s Encrypt Authority X3',
          keyType: 'ECDSA P-256',
          validFrom: '2025-01-01',
          validTo: '2026-01-01',
        },
      }),
    );

    // 5. CertificateVerify (encrypted)
    events.push(
      this.record('server', 'client', 'CertificateVerify', true, {
        description: [
          'Server proves possession of the certificate private key.',
          'Signs the handshake transcript hash with its private key.',
        ],
        details: {
          signatureAlgorithm: 'ecdsa_secp256r1_sha256',
          transcriptHash: '[SHA-256 of handshake messages so far]',
        },
      }),
    );

    // 6. Server Finished (encrypted)
    events.push(
      this.record('server', 'client', 'Finished', true, {
        description: [
          'Server sends Finished message with MAC over entire handshake transcript.',
          'Client verifies this MAC to confirm the server saw the same handshake.',
          'Server can now send application data (0.5-RTT data).',
        ],
        details: {
          verifyData: '[HMAC of handshake transcript]',
          handshakeComplete: 'server-side',
        },
      }),
    );

    // 7. Client Finished (encrypted)
    events.push(
      this.record('client', 'server', 'Finished', true, {
        description: [
          'Client sends its Finished message confirming handshake integrity.',
          'Both sides derive application traffic keys.',
          'TLS 1.3 handshake is complete (1-RTT).',
        ],
        details: {
          verifyData: '[HMAC of handshake transcript]',
          handshakeComplete: 'both-sides',
          totalRoundTrips: '1',
        },
      }),
    );

    // 8. Application Data
    events.push(
      this.record('client', 'server', 'ApplicationData', true, {
        description: [
          'Encrypted application data flows.',
          'All data protected with AES-128-GCM using application traffic keys.',
        ],
        details: {
          encryption: 'AES-128-GCM',
          keyDerivation: 'HKDF-SHA256',
          forwardSecrecy: 'yes (ephemeral ECDHE)',
        },
      }),
    );

    return events;
  }

  // ── TLS 1.3 0-RTT Resumption ─────────────────────────────

  /**
   * Performs a TLS 1.3 0-RTT resumption using a Pre-Shared Key (PSK).
   *
   * When a client has previously connected and received a session ticket,
   * it can send early data alongside the ClientHello (0-RTT). The server
   * can process this data before completing the handshake.
   *
   * Caveat: 0-RTT data is NOT forward-secret and is vulnerable to replay
   * attacks. Applications must ensure 0-RTT data is idempotent.
   *
   * @returns Ordered list of resumption messages.
   */
  performResumption(): TLSMessage[] {
    this.reset();
    const events: TLSMessage[] = [];

    // 1. ClientHello + Early Data (0-RTT)
    events.push(
      this.record('client', 'server', 'ClientHello', false, {
        description: [
          'Client sends ClientHello with PSK identity and early data (0-RTT).',
          'The PSK was obtained from a previous session\'s NewSessionTicket.',
          'Early data is encrypted with keys derived from the PSK.',
          'WARNING: 0-RTT data is not forward-secret and is replayable.',
        ],
        details: {
          pskIdentity: '[session ticket from previous connection]',
          pskMode: 'psk_dhe_ke',
          earlyDataIndication: 'yes',
          earlyData: '[encrypted HTTP GET request]',
          cipherSuite: 'TLS_AES_128_GCM_SHA256',
        },
      }),
    );

    // 2. Application Data (0-RTT early data)
    events.push(
      this.record('client', 'server', 'ApplicationData', true, {
        description: [
          'Client sends early application data (0-RTT) alongside ClientHello.',
          'Server may process this before handshake completes.',
          'Must be idempotent (e.g., GET request, not a payment).',
        ],
        details: {
          encryption: 'early_data_key (from PSK)',
          forwardSecrecy: 'no (derived from PSK, not ephemeral ECDHE)',
          replayProtection: 'application-layer only',
        },
      }),
    );

    // 3. ServerHello
    events.push(
      this.record('server', 'client', 'ServerHello', false, {
        description: [
          'Server accepts PSK and selects cipher suite.',
          'Includes key share for forward secrecy of subsequent data.',
        ],
        details: {
          selectedPsk: 'accepted',
          selectedCipherSuite: 'TLS_AES_128_GCM_SHA256',
          keyShareGroup: 'x25519',
          earlyDataAccepted: 'yes',
        },
      }),
    );

    // 4. EncryptedExtensions + Finished (encrypted)
    events.push(
      this.record('server', 'client', 'EncryptedExtensions', true, {
        description: [
          'Server confirms early data acceptance and sends extensions.',
        ],
        details: {
          earlyData: 'accepted',
          alpn: 'h2',
        },
      }),
    );

    events.push(
      this.record('server', 'client', 'Finished', true, {
        description: [
          'Server Finished message. Handshake complete on server side.',
          'No Certificate/CertificateVerify needed (server authenticated via PSK).',
        ],
        details: {
          verifyData: '[HMAC of handshake transcript]',
          authenticationMethod: 'PSK (no certificate)',
        },
      }),
    );

    // 5. Client Finished (encrypted)
    events.push(
      this.record('client', 'server', 'Finished', true, {
        description: [
          'Client Finished. Full handshake complete.',
          '0-RTT resumption achieved: early data was processed during handshake.',
          'Subsequent data uses full forward-secret keys (ECDHE + PSK).',
        ],
        details: {
          verifyData: '[HMAC of handshake transcript]',
          totalRoundTrips: '0 (early data), 1 (full handshake)',
          forwardSecrecy: 'yes (for post-handshake data)',
        },
      }),
    );

    // 6. Application Data
    events.push(
      this.record('server', 'client', 'ApplicationData', true, {
        description: [
          'Encrypted application data flows with full forward secrecy.',
          'Server may respond to the 0-RTT early data request.',
        ],
        details: {
          encryption: 'AES-128-GCM',
          keyDerivation: 'HKDF-SHA256 (PSK + ECDHE)',
          forwardSecrecy: 'yes',
        },
      }),
    );

    return events;
  }

  // ── TLS 1.2 Handshake (2-RTT) ───────────────────────────

  /**
   * Performs a TLS 1.2 handshake for comparison (2-RTT).
   *
   * TLS 1.2 requires two full round trips before application data
   * can flow. The extra RTT comes from the separate ServerKeyExchange
   * and ChangeCipherSpec steps that TLS 1.3 eliminated.
   *
   * Message flow:
   * RTT 1: ClientHello -> ServerHello + Certificate + ServerKeyExchange
   *         + ServerHelloDone
   * RTT 2: ClientKeyExchange + ChangeCipherSpec + Finished ->
   *         ChangeCipherSpec + Finished
   * Then:  ApplicationData
   *
   * @returns Ordered list of TLS 1.2 handshake messages.
   */
  performTLS12Handshake(): TLSMessage[] {
    this.reset();
    const events: TLSMessage[] = [];

    // 1. ClientHello
    events.push(
      this.record('client', 'server', 'ClientHello', false, {
        description: [
          'Client initiates TLS 1.2 handshake.',
          'Sends supported cipher suites and a random nonce.',
          'Unlike TLS 1.3, no key share is included yet (requires extra RTT).',
        ],
        details: {
          maxVersion: 'TLS 1.2',
          cipherSuites:
            'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256, TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
          compressionMethods: 'null',
          extensions: 'SNI, supported_groups, ec_point_formats',
        },
      }),
    );

    // 2. ServerHello
    events.push(
      this.record('server', 'client', 'ServerHello', false, {
        description: [
          'Server selects cipher suite and sends its random nonce.',
          'Session ID assigned for potential resumption.',
        ],
        details: {
          selectedVersion: 'TLS 1.2',
          selectedCipherSuite: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
          sessionId: '[32-byte session ID]',
          compressionMethod: 'null',
        },
      }),
    );

    // 3. Certificate
    events.push(
      this.record('server', 'client', 'Certificate', false, {
        description: [
          'Server sends its X.509 certificate chain.',
          'Sent in plaintext (NOT encrypted in TLS 1.2).',
          'This is a privacy concern addressed in TLS 1.3.',
        ],
        details: {
          subject: 'CN=example.com',
          issuer: 'CN=Let\'s Encrypt Authority X3',
          keyType: 'RSA 2048',
          encrypted: 'no (plaintext in TLS 1.2)',
        },
      }),
    );

    // 4. ServerKeyExchange (for ECDHE)
    events.push(
      this.record('server', 'client', 'ServerKeyExchange', false, {
        description: [
          'Server sends ECDHE parameters and signs them.',
          'This step is needed because TLS 1.2 separates key exchange from hello.',
          'TLS 1.3 eliminates this by including key shares in ServerHello.',
        ],
        details: {
          keyExchangeAlgorithm: 'ECDHE',
          namedCurve: 'secp256r1',
          publicKey: '[server ECDHE public key]',
          signature: '[RSA signature over params + randoms]',
        },
      }),
    );

    // 5. ServerHelloDone (end of RTT 1 server flight)
    events.push(
      this.record('server', 'client', 'ServerHelloDone', false, {
        description: [
          'ServerHelloDone signals the end of the server\'s first flight.',
          'Client now has enough information to generate the premaster secret.',
          'End of Round Trip 1.',
        ],
        details: {
          roundTrip: '1 complete',
        },
      }),
    );

    // 6. ClientKeyExchange
    events.push(
      this.record('client', 'server', 'ClientKeyExchange', false, {
        description: [
          'Client sends its ECDHE public key.',
          'Both sides can now compute the premaster secret independently.',
        ],
        details: {
          publicKey: '[client ECDHE public key]',
          premasterSecret: '[computed from ECDHE]',
        },
      }),
    );

    // 7. Client ChangeCipherSpec
    events.push(
      this.record('client', 'server', 'ChangeCipherSpec', false, {
        description: [
          'Client signals switch to encrypted mode.',
          'All subsequent client messages will be encrypted.',
          'TLS 1.3 removed ChangeCipherSpec entirely.',
        ],
        details: {
          encrypted: 'from next message',
        },
      }),
    );

    // 8. Client Finished (encrypted)
    events.push(
      this.record('client', 'server', 'Finished', true, {
        description: [
          'Client sends encrypted Finished message with MAC over handshake.',
        ],
        details: {
          verifyData: '[PRF over master_secret + handshake messages]',
          encrypted: 'yes',
        },
      }),
    );

    // 9. Server ChangeCipherSpec
    events.push(
      this.record('server', 'client', 'ChangeCipherSpec', false, {
        description: [
          'Server signals switch to encrypted mode.',
          'All subsequent server messages will be encrypted.',
        ],
        details: {
          encrypted: 'from next message',
        },
      }),
    );

    // 10. Server Finished (encrypted)
    events.push(
      this.record('server', 'client', 'Finished', true, {
        description: [
          'Server sends encrypted Finished message.',
          'Handshake is now complete (2 round trips total).',
          'End of Round Trip 2.',
        ],
        details: {
          verifyData: '[PRF over master_secret + handshake messages]',
          roundTrip: '2 complete',
        },
      }),
    );

    // 11. Application Data
    events.push(
      this.record('client', 'server', 'ApplicationData', true, {
        description: [
          'Encrypted application data can now flow.',
          '2 RTTs for TLS 1.2 vs 1 RTT for TLS 1.3. On a 56ms NY-London link, that\'s 112ms vs 56ms — users perceive the difference.',
          'With 0-RTT resumption, TLS 1.3 can send data immediately (0ms handshake overhead), making the gap even wider: 112ms vs 0ms on repeat visits.',
        ],
        details: {
          encryption: 'AES-128-GCM',
          keyDerivation: 'PRF (TLS 1.2)',
          forwardSecrecy: 'yes (ECDHE)',
          totalRoundTrips: '2',
        },
      }),
    );

    return events;
  }

  // ── Query ────────────────────────────────────────────────

  /** Returns a copy of the complete message log. */
  getMessages(): TLSMessage[] {
    return [...this.messages];
  }

  /** Resets the simulation to its initial empty state. */
  reset(): void {
    this.messages = [];
    this.tick = 0;
  }

  // ── Internals ────────────────────────────────────────────

  /**
   * Records a TLS message, appends it to the log, and returns it.
   */
  private record(
    from: 'client' | 'server',
    to: 'client' | 'server',
    type: TLSMessageType,
    encrypted: boolean,
    opts: { description: string[]; details: Record<string, string> },
  ): TLSMessage {
    this.tick++;
    const msg: TLSMessage = {
      tick: this.tick,
      from,
      to,
      type,
      description: opts.description.join(' '),
      details: opts.details,
      encrypted,
    };
    this.messages.push(msg);
    return msg;
  }
}
