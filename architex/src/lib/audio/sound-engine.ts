// ── Sound Engine ────────────────────────────────────────────────
// Singleton that manages Web Audio API context lifecycle, volume,
// and the global mute toggle. AudioContext is created lazily on
// first user interaction to comply with browser autoplay policies.

import { SOUNDS, type SoundType } from "./sounds";

const STORAGE_ENABLED_KEY = "architex-sound-enabled";
const STORAGE_VOLUME_KEY = "architex-sound-volume";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private volume = 0.5;
  private reducedMotion = false;

  constructor() {
    // Detect prefers-reduced-motion — default to disabled for a11y
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Restore persisted preferences (unless reduced motion)
      if (!this.reducedMotion) {
        try {
          const stored = localStorage.getItem(STORAGE_ENABLED_KEY);
          if (stored !== null) {
            this.enabled = stored === "true";
          }
          const vol = localStorage.getItem(STORAGE_VOLUME_KEY);
          if (vol !== null) {
            this.volume = Math.max(0, Math.min(1, Number(vol)));
          }
        } catch {
          // localStorage unavailable — use defaults
        }
      }
    }
  }

  /** Lazily initialize the AudioContext on first play */
  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume suspended context (browsers suspend until user gesture)
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Play a named sound. No-op if disabled or reduced motion. */
  play(soundId: SoundType): void {
    if (!this.enabled || this.reducedMotion) return;
    const fn = SOUNDS[soundId];
    if (!fn) return;
    const ctx = this.getContext();
    fn(ctx, this.volume);
  }

  /** Toggle sound on or off. Persists to localStorage. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.persist(STORAGE_ENABLED_KEY, String(enabled));
  }

  /** Set volume (clamped to 0-1). Persists to localStorage. */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.persist(STORAGE_VOLUME_KEY, String(this.volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  /** Whether the user prefers reduced motion */
  prefersReducedMotion(): boolean {
    return this.reducedMotion;
  }

  /** Overrides the reduced motion flag (used in tests). */
  _setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  private persist(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage unavailable — ignore
    }
  }
}

/** Singleton instance */
export const soundEngine = new SoundEngine();

export { SoundEngine };
export type { SoundType };
