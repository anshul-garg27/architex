"use client";

import { useCallback, useSyncExternalStore } from "react";

const LS_KEY = "architex-recent-commands";
const MAX_RECENT = 10;

export interface RecentCommand {
  id: string;
  label: string;
  timestamp: number;
}

// ── In-memory cache with external store pattern ─────────────────

let cache: RecentCommand[] | null = null;
const storeListeners = new Set<() => void>();

function emitChange() {
  storeListeners.forEach((fn) => fn());
}

function readFromStorage(): RecentCommand[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    cache = raw ? (JSON.parse(raw) as RecentCommand[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function writeToStorage(commands: RecentCommand[]) {
  cache = commands;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(commands));
  } catch {
    // localStorage unavailable
  }
  emitChange();
}

function subscribe(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function getSnapshot(): RecentCommand[] {
  return readFromStorage();
}

const EMPTY: RecentCommand[] = [];

function getServerSnapshot(): RecentCommand[] {
  return EMPTY;
}

// ── Public API ──────────────────────────────────────────────────

function addCommand(id: string, label: string) {
  const current = readFromStorage();
  // Remove existing entry with the same id (move to top)
  const filtered = current.filter((c) => c.id !== id);
  const next = [{ id, label, timestamp: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENT,
  );
  writeToStorage(next);
}

function clearCommands() {
  writeToStorage([]);
}

/**
 * useRecentCommands -- tracks the last 10 commands executed in the command
 * palette, stored in localStorage. Uses useSyncExternalStore for React-safe
 * reactivity.
 */
export function useRecentCommands() {
  const recent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((id: string, label: string) => {
    addCommand(id, label);
  }, []);

  const getRecent = useCallback((): RecentCommand[] => {
    return readFromStorage();
  }, []);

  const clear = useCallback(() => {
    clearCommands();
  }, []);

  return { recent, add, getRecent, clear };
}
