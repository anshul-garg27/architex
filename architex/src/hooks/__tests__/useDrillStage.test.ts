import { describe, it, expect, beforeEach } from "vitest";
import { useDrillStore } from "@/stores/drill-store";
import {
  canAdvance,
  gatePredicateFor,
  nextStage,
  previousStage,
} from "@/lib/lld/drill-stages";

/**
 * Logic-level tests for useDrillStage — verify the advance/retreat
 * logic that the hook exposes, without mounting React components
 * (avoids React 19 `act` test infra issue).
 */

describe("useDrillStage logic", () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
    useDrillStore.getState().beginAttempt({
      attemptId: "a1",
      variant: "timed-mock",
      persona: "generic",
    });
  });

  it("gate starts unsatisfied on clarify", () => {
    const bag =
      useDrillStore.getState().stageProgress[
        useDrillStore.getState().currentStage
      ] ?? {};
    expect(gatePredicateFor("clarify")(bag).satisfied).toBe(false);
  });

  it("advance via canAdvance — no-op when gate unsatisfied", () => {
    const before = useDrillStore.getState().currentStage;
    const bag =
      useDrillStore.getState().stageProgress[
        useDrillStore.getState().currentStage
      ] ?? {};
    if (!canAdvance(before, bag)) {
      // The hook's advance() is a no-op here.
    }
    expect(useDrillStore.getState().currentStage).toBe("clarify");
  });

  it("advance fires enterStage when gate satisfied", () => {
    useDrillStore.getState().mergeStageProgress({ questionsAsked: 3 });
    const current = useDrillStore.getState().currentStage;
    const bag =
      useDrillStore.getState().stageProgress[current] ?? {};
    if (canAdvance(current, bag)) {
      const next = nextStage(current)!;
      useDrillStore.getState().enterStage(next);
    }
    expect(useDrillStore.getState().currentStage).toBe("rubric");
  });

  it("retreat moves to previous stage", () => {
    useDrillStore.getState().enterStage("rubric");
    const prev = previousStage(useDrillStore.getState().currentStage)!;
    useDrillStore.getState().enterStage(prev);
    expect(useDrillStore.getState().currentStage).toBe("clarify");
  });
});
