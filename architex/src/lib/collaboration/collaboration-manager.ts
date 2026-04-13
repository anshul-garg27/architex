// ─────────────────────────────────────────────────────────────
// Architex — Collaboration Manager (provider-agnostic)
// ─────────────────────────────────────────────────────────────

import type {
  CollaboratorInfo,
  CollaborationEvent,
  CollaborationTransport,
  CursorPosition,
  SyncMessage,
} from './types';

// ── Callback types ─────────────────────────────────────────

type CollaboratorCallback = (collaborator: CollaboratorInfo) => void;
type CollaboratorIdCallback = (collaboratorId: string) => void;
type CursorCallback = (collaboratorId: string, cursor: CursorPosition) => void;
type SelectionCallback = (collaboratorId: string, nodeIds: string[]) => void;
type NodeUpdateCallback = (collaboratorId: string, nodeId: string, data: Record<string, unknown>) => void;

// ── Local (in-memory) transport ────────────────────────────

/**
 * Single-user, in-memory transport for local testing.
 * Messages are simply echoed back to the handler.
 */
export class LocalTransport implements CollaborationTransport {
  private _connected = false;
  private _handler: ((message: SyncMessage) => void) | null = null;

  get isConnected(): boolean {
    return this._connected;
  }

  connect(_roomId: string): void {
    this._connected = true;
  }

  disconnect(): void {
    this._connected = false;
  }

  send(message: SyncMessage): void {
    // In local mode, echo the message back so the manager
    // processes it as if it arrived from the network.
    this._handler?.(message);
  }

  onMessage(handler: (message: SyncMessage) => void): void {
    this._handler = handler;
  }
}

// ── Collaboration Manager ──────────────────────────────────

export class CollaborationManager {
  private transport: CollaborationTransport;
  private collaborators = new Map<string, CollaboratorInfo>();
  private localUser: CollaboratorInfo | null = null;
  private roomId: string | null = null;

  // Callbacks
  private onJoinCallbacks: CollaboratorCallback[] = [];
  private onLeaveCallbacks: CollaboratorIdCallback[] = [];
  private onCursorMoveCallbacks: CursorCallback[] = [];
  private onSelectionChangeCallbacks: SelectionCallback[] = [];
  private onNodeUpdateCallbacks: NodeUpdateCallback[] = [];

  constructor(transport?: CollaborationTransport) {
    this.transport = transport ?? new LocalTransport();
    this.transport.onMessage(this.handleMessage);
  }

  // ── Public API ───────────────────────────────────────────

  /** Join a collaboration room. */
  join(roomId: string, userInfo: Omit<CollaboratorInfo, 'lastActiveAt' | 'status'>): void {
    this.roomId = roomId;
    this.localUser = {
      ...userInfo,
      status: 'online',
      lastActiveAt: Date.now(),
    };

    this.transport.connect(roomId);
    this.collaborators.set(this.localUser.id, this.localUser);

    this.broadcast({
      type: 'collaborator-join',
      collaborator: this.localUser,
    });
  }

  /** Leave the current room. */
  leave(): void {
    if (!this.localUser) return;

    this.broadcast({
      type: 'collaborator-leave',
      collaboratorId: this.localUser.id,
    });

    this.collaborators.delete(this.localUser.id);
    this.transport.disconnect();
    this.localUser = null;
    this.roomId = null;
  }

  /** Broadcast a cursor position update. */
  broadcastCursorMove(x: number, y: number): void {
    if (!this.localUser) return;

    this.localUser.cursor = { x, y };
    this.localUser.lastActiveAt = Date.now();

    this.broadcast({
      type: 'cursor-move',
      collaboratorId: this.localUser.id,
      cursor: { x, y },
    });
  }

  /** Broadcast a selection change. */
  broadcastSelectionChange(nodeIds: string[]): void {
    if (!this.localUser) return;

    this.localUser.selectedNodeIds = nodeIds;
    this.localUser.lastActiveAt = Date.now();

    this.broadcast({
      type: 'selection-change',
      collaboratorId: this.localUser.id,
      selectedNodeIds: nodeIds,
    });
  }

  /** Broadcast a node data update. */
  broadcastNodeUpdate(nodeId: string, data: Record<string, unknown>): void {
    if (!this.localUser) return;

    this.localUser.lastActiveAt = Date.now();

    this.broadcast({
      type: 'node-update',
      collaboratorId: this.localUser.id,
      nodeId,
      data,
    });
  }

  /** Get a snapshot of all current collaborators. */
  getCollaborators(): CollaboratorInfo[] {
    return Array.from(this.collaborators.values());
  }

  /** Get the current room ID, or null. */
  getRoomId(): string | null {
    return this.roomId;
  }

  /** Whether the transport is connected. */
  get isConnected(): boolean {
    return this.transport.isConnected;
  }

  // ── Callback registration ────────────────────────────────

  onCollaboratorJoin(cb: CollaboratorCallback): () => void {
    this.onJoinCallbacks.push(cb);
    return () => {
      this.onJoinCallbacks = this.onJoinCallbacks.filter((c) => c !== cb);
    };
  }

  onCollaboratorLeave(cb: CollaboratorIdCallback): () => void {
    this.onLeaveCallbacks.push(cb);
    return () => {
      this.onLeaveCallbacks = this.onLeaveCallbacks.filter((c) => c !== cb);
    };
  }

  onCursorMove(cb: CursorCallback): () => void {
    this.onCursorMoveCallbacks.push(cb);
    return () => {
      this.onCursorMoveCallbacks = this.onCursorMoveCallbacks.filter((c) => c !== cb);
    };
  }

  onSelectionChange(cb: SelectionCallback): () => void {
    this.onSelectionChangeCallbacks.push(cb);
    return () => {
      this.onSelectionChangeCallbacks = this.onSelectionChangeCallbacks.filter((c) => c !== cb);
    };
  }

  onNodeUpdate(cb: NodeUpdateCallback): () => void {
    this.onNodeUpdateCallbacks.push(cb);
    return () => {
      this.onNodeUpdateCallbacks = this.onNodeUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  // ── Internal ─────────────────────────────────────────────

  private broadcast(event: CollaborationEvent): void {
    if (!this.localUser) return;

    const message: SyncMessage = {
      type: event.type,
      payload: event,
      senderId: this.localUser.id,
      timestamp: Date.now(),
    };

    this.transport.send(message);
  }

  private handleMessage = (message: SyncMessage): void => {
    const { payload } = message;

    switch (payload.type) {
      case 'collaborator-join': {
        this.collaborators.set(payload.collaborator.id, payload.collaborator);
        for (const cb of this.onJoinCallbacks) cb(payload.collaborator);
        break;
      }

      case 'collaborator-leave': {
        this.collaborators.delete(payload.collaboratorId);
        for (const cb of this.onLeaveCallbacks) cb(payload.collaboratorId);
        break;
      }

      case 'cursor-move': {
        const collab = this.collaborators.get(payload.collaboratorId);
        if (collab) {
          collab.cursor = payload.cursor;
          collab.lastActiveAt = Date.now();
        }
        for (const cb of this.onCursorMoveCallbacks) cb(payload.collaboratorId, payload.cursor);
        break;
      }

      case 'selection-change': {
        const collab = this.collaborators.get(payload.collaboratorId);
        if (collab) {
          collab.selectedNodeIds = payload.selectedNodeIds;
          collab.lastActiveAt = Date.now();
        }
        for (const cb of this.onSelectionChangeCallbacks) {
          cb(payload.collaboratorId, payload.selectedNodeIds);
        }
        break;
      }

      case 'node-update': {
        for (const cb of this.onNodeUpdateCallbacks) {
          cb(payload.collaboratorId, payload.nodeId, payload.data);
        }
        break;
      }
    }
  };
}
