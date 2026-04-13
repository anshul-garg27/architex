"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas-store";

interface AutosaveData {
  nodes: unknown[];
  edges: unknown[];
  notes: string;
  savedAt: number;
}

interface UseChallengeAutosaveReturn {
  lastSaveTime: number | null;
  notes: string;
  setNotes: (notes: string) => void;
  restore: () => boolean;
  clear: () => void;
  hasExistingAutosave: boolean;
}

function getStorageKey(challengeId: string): string {
  return `architex-challenge-${challengeId}-autosave`;
}

function loadAutosave(challengeId: string): AutosaveData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(challengeId));
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveData;
  } catch {
    return null;
  }
}

function saveAutosave(challengeId: string, data: AutosaveData): void {
  try {
    localStorage.setItem(getStorageKey(challengeId), JSON.stringify(data));
  } catch {
    // localStorage full or unavailable -- silently ignore
  }
}

function clearAutosave(challengeId: string): void {
  try {
    localStorage.removeItem(getStorageKey(challengeId));
  } catch {
    // silently ignore
  }
}

export function useChallengeAutosave(
  challengeId: string | null,
  intervalMs: number = 30_000,
): UseChallengeAutosaveReturn {
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [notes, setNotesState] = useState("");
  const [hasExistingAutosave, setHasExistingAutosave] = useState(false);
  const notesRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep ref in sync
  const setNotes = useCallback((value: string) => {
    notesRef.current = value;
    setNotesState(value);
  }, []);

  // On mount / challengeId change: check for existing autosave
  useEffect(() => {
    if (!challengeId) {
      setHasExistingAutosave(false);
      setLastSaveTime(null);
      setNotes("");
      return;
    }

    const existing = loadAutosave(challengeId);
    if (existing) {
      setHasExistingAutosave(true);
      // Restore notes from autosave
      setNotes(existing.notes ?? "");
    } else {
      setHasExistingAutosave(false);
      setNotes("");
    }
  }, [challengeId, setNotes]);

  // Auto-save interval
  useEffect(() => {
    if (!challengeId) return;

    const doSave = () => {
      const { nodes, edges } = useCanvasStore.getState();
      const now = Date.now();
      saveAutosave(challengeId, {
        nodes,
        edges,
        notes: notesRef.current,
        savedAt: now,
      });
      setLastSaveTime(now);
    };

    // Save immediately on first tick
    doSave();

    intervalRef.current = setInterval(doSave, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [challengeId, intervalMs]);

  // Restore canvas from autosave
  const restore = useCallback((): boolean => {
    if (!challengeId) return false;
    const data = loadAutosave(challengeId);
    if (!data) return false;

    const { setNodes, setEdges } = useCanvasStore.getState();
    setNodes(data.nodes as Parameters<typeof setNodes>[0]);
    setEdges(data.edges as Parameters<typeof setEdges>[0]);
    setNotes(data.notes ?? "");
    setHasExistingAutosave(false);
    return true;
  }, [challengeId, setNotes]);

  // Clear autosave
  const clear = useCallback(() => {
    if (!challengeId) return;
    clearAutosave(challengeId);
    setHasExistingAutosave(false);
    setLastSaveTime(null);
  }, [challengeId]);

  return {
    lastSaveTime,
    notes,
    setNotes,
    restore,
    clear,
    hasExistingAutosave,
  };
}
