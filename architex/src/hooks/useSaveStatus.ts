"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createAutoSave,
  type AutoSaveHandle,
  type SaveStatus,
} from "@/lib/persistence/auto-save";
import { useCanvasStore } from "@/stores/canvas-store";

interface UseSaveStatusReturn {
  status: SaveStatus;
  lastSavedAt: number | null;
  forceSave: () => Promise<void>;
}

const DEBOUNCE_MS = 2_000;
const CANVAS_LS_KEY = "architex-canvas-autosave";

/**
 * useSaveStatus -- integrates with the auto-save system to provide reactive
 * save status for the SaveIndicator component. Persists canvas state to
 * localStorage on change with a 2s debounce.
 */
export function useSaveStatus(): UseSaveStatusReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const handleRef = useRef<AutoSaveHandle | null>(null);

  // Build the auto-save handle once
  useEffect(() => {
    const handle = createAutoSave<{ nodes: unknown[]; edges: unknown[] }>({
      debounceMs: DEBOUNCE_MS,
      getData: () => {
        const { nodes, edges } = useCanvasStore.getState();
        return { nodes, edges };
      },
      onSave: async (data) => {
        // Persist to localStorage (matches zustand persist key format)
        localStorage.setItem(CANVAS_LS_KEY, JSON.stringify(data));
        setLastSavedAt(Date.now());
      },
      onStatusChange: (next) => {
        setStatus(next);
      },
    });

    handleRef.current = handle;

    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  // Subscribe to canvas store changes and mark dirty.
  // Zustand v5 subscribe takes a plain listener; we track prev values manually.
  useEffect(() => {
    let prevNodes = useCanvasStore.getState().nodes;
    let prevEdges = useCanvasStore.getState().edges;

    const unsub = useCanvasStore.subscribe((state) => {
      if (state.nodes !== prevNodes || state.edges !== prevEdges) {
        prevNodes = state.nodes;
        prevEdges = state.edges;
        handleRef.current?.markDirty();
      }
    });

    return unsub;
  }, []);

  const forceSave = useCallback(async () => {
    if (handleRef.current) {
      await handleRef.current.forceSave();
    }
  }, []);

  return { status, lastSavedAt, forceSave };
}
