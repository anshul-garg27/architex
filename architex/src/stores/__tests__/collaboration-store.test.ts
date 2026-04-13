import { describe, it, expect, beforeEach } from 'vitest';
import { useCollaborationStore } from '../collaboration-store';
import type { CollaboratorInfo, PresenceStatus } from '@/lib/collaboration/types';

function makeCollaborator(overrides: Partial<CollaboratorInfo> = {}): CollaboratorInfo {
  return {
    id: overrides.id ?? 'user-1',
    name: overrides.name ?? 'Alice',
    color: overrides.color ?? '#ff0000',
    selectedNodeIds: overrides.selectedNodeIds ?? [],
    status: overrides.status ?? 'online',
    lastActiveAt: overrides.lastActiveAt ?? Date.now(),
    ...(overrides.cursor ? { cursor: overrides.cursor } : {}),
  };
}

describe('collaboration-store', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset();
  });

  // ── Initial state ──────────────────────────────────────────

  it('has empty collaborators initially', () => {
    const { collaborators } = useCollaborationStore.getState();
    expect(collaborators).toEqual([]);
  });

  it('is disconnected initially', () => {
    const { isConnected } = useCollaborationStore.getState();
    expect(isConnected).toBe(false);
  });

  it('has null roomId initially', () => {
    const { roomId } = useCollaborationStore.getState();
    expect(roomId).toBeNull();
  });

  // ── setCollaborators ───────────────────────────────────────

  it('sets collaborators list', () => {
    const collab = makeCollaborator();
    useCollaborationStore.getState().setCollaborators([collab]);
    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
    expect(useCollaborationStore.getState().collaborators[0].id).toBe('user-1');
  });

  // ── addCollaborator ────────────────────────────────────────

  it('adds a collaborator', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'a' }));
    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  it('prevents duplicate collaborator additions', () => {
    const collab = makeCollaborator({ id: 'dup' });
    useCollaborationStore.getState().addCollaborator(collab);
    useCollaborationStore.getState().addCollaborator(collab);
    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  it('adds multiple distinct collaborators', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'u1' }));
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'u2' }));
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'u3' }));
    expect(useCollaborationStore.getState().collaborators).toHaveLength(3);
  });

  // ── removeCollaborator ─────────────────────────────────────

  it('removes a collaborator by id', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'r1' }));
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'r2' }));
    useCollaborationStore.getState().removeCollaborator('r1');
    const ids = useCollaborationStore.getState().collaborators.map((c) => c.id);
    expect(ids).toEqual(['r2']);
  });

  it('does nothing when removing non-existent collaborator', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'x' }));
    useCollaborationStore.getState().removeCollaborator('nonexistent');
    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  // ── updateCursor ───────────────────────────────────────────

  it('updates cursor position for a collaborator', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'c1' }));
    useCollaborationStore.getState().updateCursor('c1', { x: 100, y: 200 });
    const collab = useCollaborationStore.getState().collaborators[0];
    expect(collab.cursor).toEqual({ x: 100, y: 200 });
  });

  it('updates lastActiveAt when cursor moves', () => {
    const before = Date.now() - 1000;
    useCollaborationStore.getState().addCollaborator(
      makeCollaborator({ id: 'c2', lastActiveAt: before }),
    );
    useCollaborationStore.getState().updateCursor('c2', { x: 0, y: 0 });
    const collab = useCollaborationStore.getState().collaborators[0];
    expect(collab.lastActiveAt).toBeGreaterThan(before);
  });

  // ── updateSelection ────────────────────────────────────────

  it('updates selected node IDs for a collaborator', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 's1' }));
    useCollaborationStore.getState().updateSelection('s1', ['node-a', 'node-b']);
    const collab = useCollaborationStore.getState().collaborators[0];
    expect(collab.selectedNodeIds).toEqual(['node-a', 'node-b']);
  });

  // ── updateStatus ───────────────────────────────────────────

  it('updates presence status for a collaborator', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'st1' }));
    useCollaborationStore.getState().updateStatus('st1', 'idle');
    const collab = useCollaborationStore.getState().collaborators[0];
    expect(collab.status).toBe('idle');
  });

  it('can cycle through all status values', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator({ id: 'st2' }));
    const statuses: PresenceStatus[] = ['online', 'idle', 'offline'];
    for (const status of statuses) {
      useCollaborationStore.getState().updateStatus('st2', status);
      expect(useCollaborationStore.getState().collaborators[0].status).toBe(status);
    }
  });

  // ── setConnected ───────────────────────────────────────────

  it('sets connected status to true', () => {
    useCollaborationStore.getState().setConnected(true);
    expect(useCollaborationStore.getState().isConnected).toBe(true);
  });

  it('sets connected status to false', () => {
    useCollaborationStore.getState().setConnected(true);
    useCollaborationStore.getState().setConnected(false);
    expect(useCollaborationStore.getState().isConnected).toBe(false);
  });

  // ── setRoomId ──────────────────────────────────────────────

  it('sets room ID', () => {
    useCollaborationStore.getState().setRoomId('room-abc');
    expect(useCollaborationStore.getState().roomId).toBe('room-abc');
  });

  it('clears room ID to null', () => {
    useCollaborationStore.getState().setRoomId('room-1');
    useCollaborationStore.getState().setRoomId(null);
    expect(useCollaborationStore.getState().roomId).toBeNull();
  });

  // ── reset ──────────────────────────────────────────────────

  it('resets all state to initial values', () => {
    useCollaborationStore.getState().addCollaborator(makeCollaborator());
    useCollaborationStore.getState().setConnected(true);
    useCollaborationStore.getState().setRoomId('room-x');

    useCollaborationStore.getState().reset();

    const state = useCollaborationStore.getState();
    expect(state.collaborators).toEqual([]);
    expect(state.isConnected).toBe(false);
    expect(state.roomId).toBeNull();
  });
});
