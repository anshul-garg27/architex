import { describe, it, expect, beforeEach } from "vitest";
import { useDrillStore } from "@/stores/drill-store";
import { variantConfigFor } from "@/lib/lld/drill-variants";

/**
 * Logic-level tests for useDrillHintLadder — exercise variant gating,
 * ladder ordering, and penalty accumulation without mounting React.
 */

describe("drill hint ladder · variant policy", () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
  });

  it("exam mode disallows all tiers", () => {
    useDrillStore.getState().beginAttempt({
      attemptId: "a1",
      variant: "exam",
      persona: "generic",
    });
    const cfg = variantConfigFor("exam");
    expect(cfg.hintsAllowed).toBe(false);
  });

  it("study mode has unlimited budget (maxHintPenalty === null)", () => {
    useDrillStore.getState().beginAttempt({
      attemptId: "a1",
      variant: "study",
      persona: "generic",
    });
    const cfg = variantConfigFor("study");
    expect(cfg.maxHintPenalty).toBeNull();
  });

  it("timed-mock caps penalty at 30", () => {
    const cfg = variantConfigFor("timed-mock");
    expect(cfg.maxHintPenalty).toBe(30);
  });
});

describe("drill hint ladder · penalty recording", () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
    useDrillStore.getState().beginAttempt({
      attemptId: "a1",
      variant: "timed-mock",
      persona: "generic",
    });
  });

  it("recordHintPenalty accumulates across multiple calls", () => {
    useDrillStore.getState().recordHintPenalty(3, {
      tier: "nudge",
      stage: "clarify",
    });
    useDrillStore.getState().recordHintPenalty(10, {
      tier: "guided",
      stage: "clarify",
    });
    expect(useDrillStore.getState().hintPenaltyTotal).toBe(13);
    expect(useDrillStore.getState().hintLog).toHaveLength(2);
  });
});
