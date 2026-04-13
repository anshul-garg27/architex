// ─────────────────────────────────────────────────────────────
// Architex — Collaboration Type Definitions
// ─────────────────────────────────────────────────────────────

// ── Collaborator ───────────────────────────────────────────

/** Cursor position on the canvas (viewport coordinates). */
export interface CursorPosition {
  x: number;
  y: number;
}

/** Presence/status of a connected collaborator. */
export type PresenceStatus = 'online' | 'idle' | 'offline';

/** Information about a single collaborator in a room. */
export interface CollaboratorInfo {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  selectedNodeIds: string[];
  status: PresenceStatus;
  lastActiveAt: number;
}

// ── Collaboration State ────────────────────────────────────

/** Transport provider type. */
export type CollaborationProvider = 'partykit' | 'local';

/** Top-level state describing the active collaboration session. */
export interface CollaborationState {
  roomId: string;
  collaborators: Map<string, CollaboratorInfo>;
  isConnected: boolean;
  provider: CollaborationProvider;
}

// ── Collaboration Events (discriminated union) ─────────────

export interface CollaboratorJoinEvent {
  type: 'collaborator-join';
  collaborator: CollaboratorInfo;
}

export interface CollaboratorLeaveEvent {
  type: 'collaborator-leave';
  collaboratorId: string;
}

export interface CursorMoveEvent {
  type: 'cursor-move';
  collaboratorId: string;
  cursor: CursorPosition;
}

export interface SelectionChangeEvent {
  type: 'selection-change';
  collaboratorId: string;
  selectedNodeIds: string[];
}

export interface NodeUpdateEvent {
  type: 'node-update';
  collaboratorId: string;
  nodeId: string;
  data: Record<string, unknown>;
}

/** Discriminated union of all collaboration events. */
export type CollaborationEvent =
  | CollaboratorJoinEvent
  | CollaboratorLeaveEvent
  | CursorMoveEvent
  | SelectionChangeEvent
  | NodeUpdateEvent;

// ── Sync Messages ──────────────────────────────────────────

/** Wire-format message exchanged between collaboration peers. */
export interface SyncMessage {
  type: CollaborationEvent['type'];
  payload: CollaborationEvent;
  senderId: string;
  timestamp: number;
}

// ── Transport Interface ────────────────────────────────────

/**
 * Pluggable transport layer.
 * When Yjs / PartyKit are installed, a concrete implementation
 * will satisfy this interface. Until then, `LocalTransport` is used.
 */
export interface CollaborationTransport {
  connect(roomId: string): void;
  disconnect(): void;
  send(message: SyncMessage): void;
  onMessage(handler: (message: SyncMessage) => void): void;
  readonly isConnected: boolean;
}
