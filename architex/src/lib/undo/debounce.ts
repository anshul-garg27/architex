// ── Debounced Snapshots ─────────────────────────────────────
// Coalesce rapid changes into a single undo entry.

import { UndoManager } from "./undo-manager";

/**
 * Returns a function that, when called rapidly, only pushes a
 * single snapshot after `delayMs` of inactivity.
 */
export function createDebouncedSnapshot<T>(
  undoManager: UndoManager<T>,
  delayMs = 500,
): (snapshot: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (snapshot: T) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      undoManager.pushSnapshot(snapshot);
      timer = null;
    }, delayMs);
  };
}

export interface DragSnapshotHandle<T> {
  /** Call when a drag operation begins. Captures the "before" state. */
  onDragStart: (snapshot: T) => void;
  /** Call when the drag operation ends. Pushes the "after" state. */
  onDragEnd: (snapshot: T) => void;
}

/**
 * Returns handlers for drag operations that capture a single
 * snapshot per drag (not per pixel movement).
 */
export function createDragSnapshot<T>(
  undoManager: UndoManager<T>,
): DragSnapshotHandle<T> {
  let dragStartSnapshot: T | null = null;

  return {
    onDragStart(snapshot: T) {
      dragStartSnapshot = snapshot;
    },

    onDragEnd(snapshot: T) {
      // Only push if we actually started a drag and state changed
      if (dragStartSnapshot !== null) {
        // Push the pre-drag state first so undo goes back to it
        undoManager.pushSnapshot(dragStartSnapshot);
        // Then push the post-drag state as the current
        undoManager.pushSnapshot(snapshot);
        dragStartSnapshot = null;
      }
    },
  };
}
