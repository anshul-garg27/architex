import { describe, it, expect, beforeEach } from 'vitest';
import { useCollaborationStore } from '@/stores/collaboration-store';
import type { CollaboratorInfo } from '@/lib/collaboration/types';

// ── Helpers ────────────────────────────────────────────────

function resetStore() {
  useCollaborationStore.getState().reset();
}

function makeCollaborator(id: string, overrides?: Partial<CollaboratorInfo>): CollaboratorInfo {
  return {
    id,
    name: `User ${id}`,
    color: '#3B82F6',
    selectedNodeIds: [],
    status: 'online',
    lastActiveAt: Date.now(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────

describe('collaboration-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── setCollaborators ────────────────────────────────────

  it('setCollaborators replaces the list', () => {
    const store = useCollaborationStore.getState();
    const collabs = [makeCollaborator('a'), makeCollaborator('b')];

    store.setCollaborators(collabs);

    const { collaborators } = useCollaborationStore.getState();
    expect(collaborators).toHaveLength(2);
    expect(collaborators.map((c) => c.id)).toEqual(['a', 'b']);
  });

  // ── addCollaborator ─────────────────────────────────────

  it('addCollaborator appends a collaborator', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));

    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  it('addCollaborator prevents duplicate IDs', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));
    store.addCollaborator(makeCollaborator('u1'));

    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  // ── removeCollaborator ──────────────────────────────────

  it('removeCollaborator removes by id', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));
    store.addCollaborator(makeCollaborator('u2'));

    useCollaborationStore.getState().removeCollaborator('u1');

    const ids = useCollaborationStore.getState().collaborators.map((c) => c.id);
    expect(ids).toEqual(['u2']);
  });

  it('removeCollaborator is no-op for unknown id', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));

    store.removeCollaborator('unknown');

    expect(useCollaborationStore.getState().collaborators).toHaveLength(1);
  });

  // ── updateCursor ────────────────────────────────────────

  it('updateCursor sets cursor for the given collaborator', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));

    useCollaborationStore.getState().updateCursor('u1', { x: 50, y: 100 });

    const updated = useCollaborationStore.getState().collaborators[0];
    expect(updated.cursor).toEqual({ x: 50, y: 100 });
  });

  it('updateCursor updates lastActiveAt', () => {
    const store = useCollaborationStore.getState();
    const oldTime = Date.now() - 10_000;
    store.addCollaborator(makeCollaborator('u1', { lastActiveAt: oldTime }));

    useCollaborationStore.getState().updateCursor('u1', { x: 0, y: 0 });

    const updated = useCollaborationStore.getState().collaborators[0];
    expect(updated.lastActiveAt).toBeGreaterThan(oldTime);
  });

  it('updateCursor does not affect other collaborators', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));
    store.addCollaborator(makeCollaborator('u2'));

    useCollaborationStore.getState().updateCursor('u1', { x: 1, y: 2 });

    const u2 = useCollaborationStore.getState().collaborators[1];
    expect(u2.cursor).toBeUndefined();
  });

  // ── updateSelection ─────────────────────────────────────

  it('updateSelection sets selectedNodeIds', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));

    useCollaborationStore.getState().updateSelection('u1', ['n1', 'n2']);

    const updated = useCollaborationStore.getState().collaborators[0];
    expect(updated.selectedNodeIds).toEqual(['n1', 'n2']);
  });

  // ── updateStatus ────────────────────────────────────────

  it('updateStatus changes the status field', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));

    useCollaborationStore.getState().updateStatus('u1', 'idle');

    const updated = useCollaborationStore.getState().collaborators[0];
    expect(updated.status).toBe('idle');
  });

  // ── Connection state ────────────────────────────────────

  it('setConnected toggles isConnected', () => {
    const store = useCollaborationStore.getState();
    store.setConnected(true);
    expect(useCollaborationStore.getState().isConnected).toBe(true);

    useCollaborationStore.getState().setConnected(false);
    expect(useCollaborationStore.getState().isConnected).toBe(false);
  });

  it('setRoomId updates roomId', () => {
    const store = useCollaborationStore.getState();
    store.setRoomId('room-42');
    expect(useCollaborationStore.getState().roomId).toBe('room-42');
  });

  // ── reset ───────────────────────────────────────────────

  it('reset clears all state', () => {
    const store = useCollaborationStore.getState();
    store.addCollaborator(makeCollaborator('u1'));
    store.setConnected(true);
    store.setRoomId('room-1');

    useCollaborationStore.getState().reset();

    const state = useCollaborationStore.getState();
    expect(state.collaborators).toEqual([]);
    expect(state.isConnected).toBe(false);
    expect(state.roomId).toBeNull();
  });
});
