// ─────────────────────────────────────────────────────────────
// Architex — Shared Protocol Types
// ─────────────────────────────────────────────────────────────
//
// Base interface for all protocol timeline events across the
// networking module. Every engine (TCP, TLS, DNS, WebSocket,
// CORS, CDN, HTTP) extends this interface, ensuring a common
// shape for generic sequence diagram rendering, step playback,
// and protocol-agnostic utilities.
//
// DESIGN: The four fields (tick, from, to, description) are the
// minimum required to render a row in the SequenceDiagram
// component. Protocol-specific engines add their own fields
// (e.g., TCPEvent adds segment/clientState/serverState,
// TLSMessage adds type/details/encrypted).
// ─────────────────────────────────────────────────────────────

/**
 * Base interface for all protocol timeline events.
 *
 * Every protocol engine in the networking module produces events
 * that extend this interface. The four fields here are sufficient
 * to render a generic sequence diagram row:
 *
 * - `tick` — ordering / animation step
 * - `from` — left-side actor label
 * - `to` — right-side actor label
 * - `description` — human-readable explanation
 *
 * Protocol-specific interfaces add additional fields as needed.
 */
export interface ProtocolTimelineEvent {
  /** Simulation tick (monotonically increasing). */
  tick: number;
  /** Actor/endpoint that initiates this event. */
  from: string;
  /** Actor/endpoint that receives this event. */
  to: string;
  /** Human-readable explanation of this step. */
  description: string;
}
