import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createSnapshot,
  restoreSnapshot,
  type ArchitectureSnapshot,
} from "@/lib/versioning/snapshots";
import { useCanvasStore } from "@/stores/canvas-store";

// ─────────────────────────────────────────────────────────────
// Snapshot Store
// ─────────────────────────────────────────────────────────────

interface SnapshotState {
  snapshots: ArchitectureSnapshot[];
  activeSnapshotId: string | null;

  addSnapshot: (label: string) => void;
  removeSnapshot: (id: string) => void;
  restoreSnapshot: (id: string) => void;
  reorderSnapshots: (fromIndex: number, toIndex: number) => void;
}

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      activeSnapshotId: null,

      addSnapshot: (label: string) => {
        const { nodes, edges } = useCanvasStore.getState();
        const snapshot = createSnapshot(label, nodes, edges);
        set((s) => ({
          snapshots: [...s.snapshots, snapshot],
          activeSnapshotId: snapshot.id,
        }));
      },

      removeSnapshot: (id: string) => {
        set((s) => ({
          snapshots: s.snapshots.filter((snap) => snap.id !== id),
          activeSnapshotId:
            s.activeSnapshotId === id ? null : s.activeSnapshotId,
        }));
      },

      restoreSnapshot: (id: string) => {
        const snapshot = get().snapshots.find((s) => s.id === id);
        if (!snapshot) return;

        const { nodes, edges } = restoreSnapshot(snapshot);
        const canvas = useCanvasStore.getState();
        canvas.setNodes(nodes);
        canvas.setEdges(edges);

        set({ activeSnapshotId: id });
      },

      reorderSnapshots: (fromIndex: number, toIndex: number) => {
        set((s) => {
          const updated = [...s.snapshots];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { snapshots: updated };
        });
      },
    }),
    {
      name: "architex-snapshots",
      partialize: (state) => ({
        snapshots: state.snapshots,
        activeSnapshotId: state.activeSnapshotId,
      }),
    },
  ),
);
