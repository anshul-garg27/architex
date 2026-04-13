// ─────────────────────────────────────────────────────────────
// Architex — Networking SRS Bridge
// ─────────────────────────────────────────────────────────────
//
// Bridges the Networking module to the FSRS spaced repetition
// engine (src/lib/interview/srs.ts). Provides pre-built review
// cards for each protocol so users can reinforce concepts.
// ─────────────────────────────────────────────────────────────

import { createCard, type ReviewCard } from '@/lib/interview/srs';

export interface NetworkingSRSCard {
  protocolId: string;
  protocolName: string;
  question: string;
  answer: string;
}

// Pre-built cards for each protocol
export const NETWORKING_SRS_CARDS: NetworkingSRSCard[] = [
  {
    protocolId: 'tcp-handshake',
    protocolName: 'TCP',
    question: 'Why does TCP need 3 steps instead of 2 for the handshake?',
    answer:
      'Both sides need bidirectional confirmation. 2 steps only verify one direction. Step 3 proves the server-to-client path works AND prevents stale connection confusion.',
  },
  {
    protocolId: 'tls-1.3',
    protocolName: 'TLS 1.3',
    question: 'How does TLS 1.3 achieve 1-RTT instead of TLS 1.2 2-RTT?',
    answer:
      'TLS 1.3 sends the DH key_share in ClientHello, so the server can derive keys immediately. TLS 1.2 needs a separate round trip for key exchange.',
  },
  {
    protocolId: 'dns-resolution',
    protocolName: 'DNS',
    question: 'What are the 4 types of DNS servers in the resolution chain?',
    answer:
      'Recursive resolver (does the work), Root nameserver (knows TLDs), TLD nameserver (knows domains), Authoritative nameserver (has the answer).',
  },
  {
    protocolId: 'cors',
    protocolName: 'CORS',
    question: 'Does CORS prevent the browser from SENDING the request?',
    answer:
      'No! CORS only prevents JavaScript from READING the response. The request always reaches the server. This is why CORS alone is not CSRF protection.',
  },
  {
    protocolId: 'http-comparison',
    protocolName: 'HTTP',
    question: 'Why can HTTP/2 be SLOWER than HTTP/1.1 under packet loss?',
    answer:
      'HTTP/2 multiplexes all streams over one TCP connection. One lost packet blocks ALL streams (TCP HOL blocking). HTTP/1.1 with 6 independent connections limits the blast radius.',
  },
  {
    protocolId: 'websocket',
    protocolName: 'WebSocket',
    question: 'Why does the WebSocket handshake use an HTTP Upgrade request instead of a new protocol?',
    answer:
      'Reusing HTTP for the handshake ensures WebSocket works through existing proxies, firewalls, and load balancers that already understand HTTP. A custom handshake would be blocked by most middleboxes.',
  },
  {
    protocolId: 'cdn-flow',
    protocolName: 'CDN',
    question: 'What is the difference between a CDN cache HIT and a MISS, and why does the first request to a PoP always MISS?',
    answer:
      'A HIT means the edge PoP has cached content and serves it directly. A MISS means the PoP must fetch from the origin server. The first request always misses because the PoP has no cached copy yet (cold start).',
  },
  {
    protocolId: 'api-comparison',
    protocolName: 'API Protocols',
    question: 'When would you choose gRPC over REST for service-to-service communication?',
    answer:
      'gRPC excels for internal microservice communication: binary Protobuf is ~10x smaller than JSON, HTTP/2 streaming enables bidirectional real-time data, and code-generated clients eliminate serialization bugs. REST is better for public APIs due to browser support and human-readability.',
  },
  {
    protocolId: 'serialization',
    protocolName: 'Serialization',
    question: 'Why is Protocol Buffers smaller than JSON for the same data?',
    answer:
      'Protobuf uses field numbers (1-2 bytes) instead of string keys, varint encoding for integers, and no whitespace or delimiters. JSON repeats full key names as strings and uses ASCII digit encoding for numbers.',
  },
];

/**
 * Create an FSRS ReviewCard from a networking SRS card definition.
 * The card is initialized in "new" state, due immediately.
 */
export function createNetworkingSRSCard(card: NetworkingSRSCard): ReviewCard {
  return createCard(`networking-${card.protocolId}`);
}

/**
 * Create FSRS ReviewCards for all networking protocol concepts.
 */
export function createAllNetworkingSRSCards(): ReviewCard[] {
  return NETWORKING_SRS_CARDS.map(createNetworkingSRSCard);
}

/**
 * Get the NetworkingSRSCard metadata (question/answer) for a given protocol ID.
 * Returns undefined if no card exists for that protocol.
 */
export function getNetworkingCardByProtocol(
  protocolId: string,
): NetworkingSRSCard | undefined {
  return NETWORKING_SRS_CARDS.find((c) => c.protocolId === protocolId);
}
