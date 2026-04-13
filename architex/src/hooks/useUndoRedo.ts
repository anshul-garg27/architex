import { useSyncExternalStore, useCallback, useRef } from "react";
import { UndoManager, type UndoRedoState } from "@/lib/undo";

/**
 * React hook that provides reactive undo/redo controls.
 *
 * Re-renders only when the stack state (canUndo, canRedo, sizes) changes.
 * Uses useSyncExternalStore for tear-free reads in concurrent mode.
 */
export function useUndoRedo<T>(manager: UndoManager<T>) {
  // Cache the previous state object so useSyncExternalStore can
  // do a reference-equality check to avoid unnecessary re-renders.
  const prevRef = useRef<UndoRedoState | null>(null);

  const getSnapshot = useCallback((): UndoRedoState => {
    const next = manager.getStackState();
    const prev = prevRef.current;

    if (
      prev !== null &&
      prev.canUndo === next.canUndo &&
      prev.canRedo === next.canRedo &&
      prev.undoStackSize === next.undoStackSize &&
      prev.redoStackSize === next.redoStackSize
    ) {
      return prev;
    }

    prevRef.current = next;
    return next;
  }, [manager]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.subscribe(onStoreChange),
    [manager],
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const undo = useCallback(() => manager.undo(), [manager]);
  const redo = useCallback(() => manager.redo(), [manager]);

  return {
    undo,
    redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undoStackSize: state.undoStackSize,
    redoStackSize: state.redoStackSize,
  };
}
