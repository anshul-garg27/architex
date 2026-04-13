import { useCallback, useRef } from "react";
import { soundEngine } from "@/lib/audio/sound-engine";
import type { AnimationStep } from "@/lib/algorithms";

/**
 * Bridges algorithm animation steps to the sound engine.
 *
 * Analyses each step's mutations to determine the dominant action
 * (compare, swap, sorted, pivot) and plays the corresponding sound.
 * Throttled to max 1 sound per 30ms to avoid cacophony at high speeds.
 */
export function useAlgorithmSound() {
  const lastPlayRef = useRef(0);

  const playStepSound = useCallback((step: AnimationStep) => {
    const now = performance.now();
    if (now - lastPlayRef.current < 30) return;
    lastPlayRef.current = now;

    // Detect step type from mutations
    const hasCompare = step.mutations.some(
      (m) =>
        String(m.to).includes("comparing") || String(m.to).includes("blue"),
    );
    const hasSwap = step.mutations.some(
      (m) =>
        String(m.to).includes("swapping") ||
        String(m.to).includes("red") ||
        m.property === "position",
    );
    const hasSorted = step.mutations.some(
      (m) =>
        String(m.to).includes("sorted") || String(m.to).includes("green"),
    );
    const hasPivot = step.mutations.some(
      (m) =>
        String(m.to).includes("pivot") || String(m.to).includes("purple"),
    );

    // ── Graph operations ───────────────────────────────────────
    const hasVisit = step.mutations.some(
      (m) =>
        String(m.to).includes("visiting") || String(m.to).includes("frontier"),
    );
    const hasSettled = step.mutations.some(
      (m) =>
        String(m.to).includes("visited") || String(m.to).includes("settled") ||
        String(m.to).includes("relaxing"),
    );

    // ── Tree operations ──────────────────────────────────────
    const hasTreeMutation = step.mutations.some(
      (m) =>
        String(m.to).includes("inserting") || String(m.to).includes("rotating") ||
        String(m.to).includes("deleting"),
    );
    const hasTreeFound = step.mutations.some(
      (m) => String(m.to).includes("found"),
    );

    // ── DP operations ────────────────────────────────────────
    const hasComputing = step.mutations.some(
      (m) =>
        String(m.to).includes("computing") || String(m.to).includes("dependency"),
    );
    const hasComputed = step.mutations.some(
      (m) =>
        String(m.to).includes("computed") || String(m.to).includes("optimal"),
    );

    // ── Backtracking operations ──────────────────────────────
    const hasTrying = step.mutations.some(
      (m) => String(m.to).includes("trying"),
    );
    const hasBacktrack = step.mutations.some(
      (m) => String(m.to).includes("backtrack"),
    );
    const hasSolution = step.mutations.some(
      (m) => String(m.to).includes("solution"),
    );

    // Priority: sorted > swap > pivot > compare (sorting)
    // Then: solution > settled/computed/found > backtrack > visit/compute/try (non-sorting)
    if (hasSorted) {
      soundEngine.play("algo-sorted");
    } else if (hasSwap) {
      soundEngine.play("algo-swap");
    } else if (hasPivot) {
      soundEngine.play("algo-pivot");
    } else if (hasCompare) {
      soundEngine.play("algo-compare");
    } else if (hasSolution) {
      soundEngine.play("algo-complete");
    } else if (hasSettled || hasComputed || hasTreeFound) {
      soundEngine.play("algo-sorted");
    } else if (hasBacktrack) {
      soundEngine.play("algo-swap");
    } else if (hasVisit || hasComputing || hasTreeMutation || hasTrying) {
      soundEngine.play("algo-compare");
    }
  }, []);

  const playComplete = useCallback(() => {
    soundEngine.play("algo-complete");
  }, []);

  return { playStepSound, playComplete };
}
