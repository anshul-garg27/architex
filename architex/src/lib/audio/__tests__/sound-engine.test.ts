import { describe, it, expect, beforeEach, vi } from "vitest";
import { SoundEngine } from "../sound-engine";

// ── Helpers ─────────────────────────────────────────────────────

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ── Tests ───────────────────────────────────────────────────────

describe("SoundEngine", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it("starts disabled by default", () => {
    const engine = new SoundEngine();
    expect(engine.isEnabled()).toBe(false);
  });

  it("setEnabled toggles state", () => {
    const engine = new SoundEngine();
    expect(engine.isEnabled()).toBe(false);

    engine.setEnabled(true);
    expect(engine.isEnabled()).toBe(true);

    engine.setEnabled(false);
    expect(engine.isEnabled()).toBe(false);
  });

  it("setVolume clamps to 0-1 range", () => {
    const engine = new SoundEngine();

    engine.setVolume(0.7);
    expect(engine.getVolume()).toBe(0.7);

    engine.setVolume(-0.5);
    expect(engine.getVolume()).toBe(0);

    engine.setVolume(2.5);
    expect(engine.getVolume()).toBe(1);

    engine.setVolume(0);
    expect(engine.getVolume()).toBe(0);

    engine.setVolume(1);
    expect(engine.getVolume()).toBe(1);
  });

  it("respects prefers-reduced-motion", () => {
    mockMatchMedia(true);
    const engine = new SoundEngine();
    expect(engine.prefersReducedMotion()).toBe(true);
    // Even if enabled, should stay reduced-motion-aware
    expect(engine.isEnabled()).toBe(false);
  });

  it("does not restore enabled state when reduced motion is active", () => {
    // First, persist enabled state
    localStorage.setItem("architex-sound-enabled", "true");

    // Now create engine with reduced motion
    mockMatchMedia(true);
    const engine = new SoundEngine();
    expect(engine.isEnabled()).toBe(false);
  });

  it("persists enabled to localStorage", () => {
    const engine = new SoundEngine();
    engine.setEnabled(true);
    expect(localStorage.getItem("architex-sound-enabled")).toBe("true");

    engine.setEnabled(false);
    expect(localStorage.getItem("architex-sound-enabled")).toBe("false");
  });

  it("persists volume to localStorage", () => {
    const engine = new SoundEngine();
    engine.setVolume(0.8);
    expect(localStorage.getItem("architex-sound-volume")).toBe("0.8");
  });

  it("restores enabled and volume from localStorage", () => {
    localStorage.setItem("architex-sound-enabled", "true");
    localStorage.setItem("architex-sound-volume", "0.3");

    const engine = new SoundEngine();
    expect(engine.isEnabled()).toBe(true);
    expect(engine.getVolume()).toBe(0.3);
  });

  it("getVolume returns default 0.5 when nothing is persisted", () => {
    const engine = new SoundEngine();
    expect(engine.getVolume()).toBe(0.5);
  });
});
