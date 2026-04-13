import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CollaborationManager,
  LocalTransport,
} from '@/lib/collaboration/collaboration-manager';
import type { CollaboratorInfo } from '@/lib/collaboration/types';

// ── Helpers ────────────────────────────────────────────────

function makeUser(id: string, overrides?: Partial<CollaboratorInfo>): Omit<CollaboratorInfo, 'lastActiveAt' | 'status'> {
  return {
    id,
    name: `User ${id}`,
    color: '#3B82F6',
    selectedNodeIds: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────

describe('CollaborationManager', () => {
  let manager: CollaborationManager;

  beforeEach(() => {
    manager = new CollaborationManager();
  });

  // ── Join / Leave ────────────────────────────────────────

  it('join adds the local user as a collaborator', () => {
    manager.join('room-1', makeUser('u1'));

    const collabs = manager.getCollaborators();
    expect(collabs).toHaveLength(1);
    expect(collabs[0].id).toBe('u1');
    expect(collabs[0].status).toBe('online');
  });

  it('join sets the room ID', () => {
    manager.join('room-1', makeUser('u1'));
    expect(manager.getRoomId()).toBe('room-1');
  });

  it('join connects the transport', () => {
    manager.join('room-1', makeUser('u1'));
    expect(manager.isConnected).toBe(true);
  });

  it('leave removes the local user and disconnects', () => {
    manager.join('room-1', makeUser('u1'));
    manager.leave();

    expect(manager.getCollaborators()).toHaveLength(0);
    expect(manager.isConnected).toBe(false);
    expect(manager.getRoomId()).toBeNull();
  });

  it('leave is safe to call without joining first', () => {
    expect(() => manager.leave()).not.toThrow();
  });

  // ── Cursor ─────────────────────────────────────────────

  it('broadcastCursorMove updates local user cursor', () => {
    manager.join('room-1', makeUser('u1'));
    manager.broadcastCursorMove(100, 200);

    const user = manager.getCollaborators()[0];
    expect(user.cursor).toEqual({ x: 100, y: 200 });
  });

  it('broadcastCursorMove fires onCursorMove callbacks', () => {
    const cb = vi.fn();
    manager.onCursorMove(cb);
    manager.join('room-1', makeUser('u1'));

    manager.broadcastCursorMove(10, 20);

    expect(cb).toHaveBeenCalledWith('u1', { x: 10, y: 20 });
  });

  it('broadcastCursorMove is no-op before joining', () => {
    expect(() => manager.broadcastCursorMove(0, 0)).not.toThrow();
  });

  // ── Selection ──────────────────────────────────────────

  it('broadcastSelectionChange updates local user selection', () => {
    manager.join('room-1', makeUser('u1'));
    manager.broadcastSelectionChange(['node-1', 'node-2']);

    const user = manager.getCollaborators()[0];
    expect(user.selectedNodeIds).toEqual(['node-1', 'node-2']);
  });

  it('broadcastSelectionChange fires onSelectionChange callbacks', () => {
    const cb = vi.fn();
    manager.onSelectionChange(cb);
    manager.join('room-1', makeUser('u1'));

    manager.broadcastSelectionChange(['n1']);

    expect(cb).toHaveBeenCalledWith('u1', ['n1']);
  });

  // ── Node Update ────────────────────────────────────────

  it('broadcastNodeUpdate fires onNodeUpdate callbacks', () => {
    const cb = vi.fn();
    manager.onNodeUpdate(cb);
    manager.join('room-1', makeUser('u1'));

    manager.broadcastNodeUpdate('node-1', { label: 'Updated' });

    expect(cb).toHaveBeenCalledWith('u1', 'node-1', { label: 'Updated' });
  });

  // ── Callback management ────────────────────────────────

  it('onCollaboratorJoin fires when a user joins', () => {
    const cb = vi.fn();
    manager.onCollaboratorJoin(cb);
    manager.join('room-1', makeUser('u1'));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', name: 'User u1' }),
    );
  });

  it('onCollaboratorLeave fires when a user leaves', () => {
    const cb = vi.fn();
    manager.onCollaboratorLeave(cb);
    manager.join('room-1', makeUser('u1'));
    manager.leave();

    expect(cb).toHaveBeenCalledWith('u1');
  });

  it('unsubscribe function removes callback', () => {
    const cb = vi.fn();
    const unsub = manager.onCollaboratorJoin(cb);
    unsub();

    manager.join('room-1', makeUser('u1'));

    expect(cb).not.toHaveBeenCalled();
  });

  it('multiple callbacks can be registered', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    manager.onCollaboratorJoin(cb1);
    manager.onCollaboratorJoin(cb2);

    manager.join('room-1', makeUser('u1'));

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

// ── LocalTransport ─────────────────────────────────────────

describe('LocalTransport', () => {
  it('starts disconnected', () => {
    const transport = new LocalTransport();
    expect(transport.isConnected).toBe(false);
  });

  it('connect/disconnect toggles isConnected', () => {
    const transport = new LocalTransport();
    transport.connect('room');
    expect(transport.isConnected).toBe(true);

    transport.disconnect();
    expect(transport.isConnected).toBe(false);
  });

  it('send echoes message back to onMessage handler', () => {
    const transport = new LocalTransport();
    const handler = vi.fn();
    transport.onMessage(handler);

    const message = {
      type: 'cursor-move' as const,
      payload: {
        type: 'cursor-move' as const,
        collaboratorId: 'u1',
        cursor: { x: 0, y: 0 },
      },
      senderId: 'u1',
      timestamp: Date.now(),
    };

    transport.send(message);
    expect(handler).toHaveBeenCalledWith(message);
  });
});
