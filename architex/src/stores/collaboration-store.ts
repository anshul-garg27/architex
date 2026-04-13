import { create } from 'zustand';
import type {
  CollaboratorInfo,
  CursorPosition,
  PresenceStatus,
} from '@/lib/collaboration/types';

// ── State ──────────────────────────────────────────────────

interface CollaborationStoreState {
  // Data
  collaborators: CollaboratorInfo[];
  isConnected: boolean;
  roomId: string | null;

  // Actions
  setCollaborators: (collaborators: CollaboratorInfo[]) => void;
  addCollaborator: (collaborator: CollaboratorInfo) => void;
  removeCollaborator: (collaboratorId: string) => void;
  updateCursor: (collaboratorId: string, cursor: CursorPosition) => void;
  updateSelection: (collaboratorId: string, selectedNodeIds: string[]) => void;
  updateStatus: (collaboratorId: string, status: PresenceStatus) => void;
  setConnected: (connected: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  reset: () => void;
}

export const useCollaborationStore = create<CollaborationStoreState>()(
  (set) => ({
    collaborators: [],
    isConnected: false,
    roomId: null,

    setCollaborators: (collaborators) => set({ collaborators }),

    addCollaborator: (collaborator) =>
      set((state) => {
        // Prevent duplicates — return empty object to skip state update
        if (state.collaborators.some((c) => c.id === collaborator.id)) {
          return {};
        }
        return { collaborators: [...state.collaborators, collaborator] };
      }),

    removeCollaborator: (collaboratorId) =>
      set((state) => ({
        collaborators: state.collaborators.filter((c) => c.id !== collaboratorId),
      })),

    updateCursor: (collaboratorId, cursor) =>
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === collaboratorId
            ? { ...c, cursor, lastActiveAt: Date.now() }
            : c,
        ),
      })),

    updateSelection: (collaboratorId, selectedNodeIds) =>
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === collaboratorId
            ? { ...c, selectedNodeIds, lastActiveAt: Date.now() }
            : c,
        ),
      })),

    updateStatus: (collaboratorId, status) =>
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === collaboratorId ? { ...c, status } : c,
        ),
      })),

    setConnected: (connected) => set({ isConnected: connected }),

    setRoomId: (roomId) => set({ roomId }),

    reset: () => set({ collaborators: [], isConnected: false, roomId: null }),
  }),
);
