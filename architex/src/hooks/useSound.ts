"use client";

import { useCallback, useSyncExternalStore } from "react";
import { soundEngine } from "@/lib/audio/sound-engine";
import type { SoundType } from "@/lib/audio/sounds";

// ── External store plumbing ─────────────────────────────────────
// We use useSyncExternalStore to subscribe to the engine's state
// so React re-renders when enabled/volume change.

type Snapshot = { enabled: boolean; volume: number };

let snapshot: Snapshot = { enabled: false, volume: 0.5 };
const listeners = new Set<() => void>();

function emitChange(): void {
  snapshot = {
    enabled: soundEngine.isEnabled(),
    volume: soundEngine.getVolume(),
  };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return { enabled: false, volume: 0.5 };
}

// Sync initial state from engine
if (typeof window !== "undefined") {
  snapshot = {
    enabled: soundEngine.isEnabled(),
    volume: soundEngine.getVolume(),
  };
}

// ── Hook ────────────────────────────────────────────────────────

export function useSound() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const play = useCallback((id: SoundType) => {
    soundEngine.play(id);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    soundEngine.setEnabled(enabled);
    emitChange();
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundEngine.setVolume(volume);
    emitChange();
  }, []);

  return {
    play,
    enabled: state.enabled,
    setEnabled,
    volume: state.volume,
    setVolume,
  } as const;
}
