// ─────────────────────────────────────────────────────────────
// Architex — Networking & Protocols Module
// ─────────────────────────────────────────────────────────────
//
// Barrel export for all networking protocol simulations.
//
// This module provides interactive visualizations of:
// - TCP connection lifecycle (3-way handshake, data, teardown)
// - TLS 1.3 / 1.2 handshake comparison
// - DNS recursive resolution chain
// - HTTP/1.1 vs HTTP/2 vs HTTP/3 comparison
// - WebSocket full lifecycle
// - CORS request flow simulation
// ─────────────────────────────────────────────────────────────

// ── Shared Types ──────────────────────────────────────────
export type { ProtocolTimelineEvent } from './shared-types';

// ── TCP State Machine ──────────────────────────────────────
export { TCPConnection } from './tcp-state-machine';
export type {
  TCPState,
  TCPSegment,
  TCPEvent,
} from './tcp-state-machine';

// ── TLS Handshake ──────────────────────────────────────────
export { TLSHandshake } from './tls-handshake';
export type {
  TLSMessageType,
  TLSMessage,
} from './tls-handshake';

// ── TLS 1.3 Handshake Data ────────────────────────────────
export {
  TLS13_HANDSHAKE_MESSAGES,
  TLS13_0RTT_MESSAGES,
  tls13ToSequenceMessages,
  tls13RowBackground,
  TLS13_RTT_BRACKETS,
  TLS13_0RTT_BRACKETS,
} from './tls13-handshake';
export type {
  TLS13MessageType,
  TLS13Message,
} from './tls13-handshake';

// ── DNS Resolution ─────────────────────────────────────────
export { DNSResolver } from './dns-resolution';
export {
  DNS_COLUMN_MAP,
  DNS_SEQUENCE_COLUMNS,
  dnsToSequenceMessages,
  dnsRowBackground,
  DNS_SCENARIOS,
} from './dns-resolution';
export type {
  DNSRecordType,
  DNSQuery,
  DNSScenario,
} from './dns-resolution';

// ── HTTP Version Comparison ────────────────────────────────
export { compareHTTPVersions } from './http-comparison';
export type {
  HTTPRequest,
  HTTPComparison,
} from './http-comparison';

// ── WebSocket Lifecycle ────────────────────────────────────
export { WebSocketSimulation } from './websocket-lifecycle';
export type {
  WebSocketEventType,
  WebSocketEvent,
} from './websocket-lifecycle';

// ── CORS Simulator ─────────────────────────────────────────
export { simulateCORS } from './cors-simulator';
export type {
  CORSConfig,
  CORSStep,
} from './cors-simulator';

// ── CDN Request Flow ──────────────────────────────────────
export {
  simulateCDNFlow,
  simulateCDNFlowLegacy,
  cdnToSequenceMessages,
  cdnRowBackground,
  CDN_SCENARIOS,
  CDN_SEQUENCE_COLUMNS,
} from './cdn-flow';
export type {
  CDNStep,
  CDNSequenceMessage,
  CDNScenario,
  CDNScenarioDef,
} from './cdn-flow';

// ── API Protocol Comparison ───────────────────────────────
export {
  compareAPIs,
  getAPIQualitativeMetrics,
  getAPIRequestExamples,
  getAPIOperationDescriptions,
} from './api-comparison';
export type {
  APIOperation,
  APIProtocolMetrics,
  APIComparisonResult,
  QualitativeMetrics,
  QualitativeRating,
  LearningCurve,
  APIRequestExample,
  APIOperationExamples,
} from './api-comparison';

// ── Serialization Format Comparison ──────────────────────
export { compareSerializationFormats, SAMPLE_USER_DATA } from './serialization-comparison';
export type {
  SerializationResult,
} from './serialization-comparison';

// ── ARP (Address Resolution Protocol) ───────────────────
export { ARPSimulation } from './arp-simulation';
export type {
  ARPActor,
  ARPEventType,
  ARPEvent,
  ARPCacheEntry,
} from './arp-simulation';

// ── DHCP (Dynamic Host Configuration Protocol) ──────────
export { DHCPSimulation } from './dhcp-simulation';
export type {
  DHCPActor,
  DHCPEventType,
  DHCPEvent,
  DHCPDetails,
} from './dhcp-simulation';

// ── SRS Bridge (Spaced Repetition) ───────────────────────
export {
  NETWORKING_SRS_CARDS,
  createNetworkingSRSCard,
  createAllNetworkingSRSCards,
  getNetworkingCardByProtocol,
} from './srs-bridge';
export type { NetworkingSRSCard } from './srs-bridge';
