import { describe, it, expect, beforeEach } from "vitest";
import { useDrillStore, type StageProgressBag } from "@/stores/drill-store";

describe("drill-store", () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
  });

  it("has sensible defaults", () => {
    const s = useDrillStore.getState();
    expect(s.currentStage).toBe("clarify");
    expect(s.interviewerTurns).toEqual([]);
    expect(s.hintPenaltyTotal).toBe(0);
    expect(s.rubricBreakdown).toBeNull();
  });

  it("enterStage updates currentStage + stampsStartedAt", () => {
    useDrillStore.getState().enterStage("rubric");
    expect(useDrillStore.getState().currentStage).toBe("rubric");
    expect(useDrillStore.getState().stageStartedAt).toBeGreaterThan(0);
  });

  it("mergeStageProgress merges into the current stage bag", () => {
    useDrillStore.getState().mergeStageProgress({ questionsAsked: 1 });
    useDrillStore.getState().mergeStageProgress({ questionsAsked: 3 });
    const bag = useDrillStore.getState().stageProgress.clarify ?? {};
    expect((bag as StageProgressBag).questionsAsked).toBe(3);
  });

  it("appendInterviewerTurn grows turns list with seq", () => {
    useDrillStore.getState().appendInterviewerTurn({
      role: "user",
      stage: "clarify",
      content: "hi",
      createdAt: new Date().toISOString(),
    });
    useDrillStore.getState().appendInterviewerTurn({
      role: "interviewer",
      stage: "clarify",
      content: "hello",
      createdAt: new Date().toISOString(),
    });
    const turns = useDrillStore.getState().interviewerTurns;
    expect(turns).toHaveLength(2);
    expect(turns[0]?.seq).toBe(0);
    expect(turns[1]?.seq).toBe(1);
  });

  it("recordHintPenalty accumulates", () => {
    useDrillStore.getState().recordHintPenalty(5);
    useDrillStore.getState().recordHintPenalty(10);
    expect(useDrillStore.getState().hintPenaltyTotal).toBe(15);
  });

  it("setRubric stores the grade breakdown", () => {
    const mock = {
      clarification: { score: 80, good: [], missing: [], wrong: [] },
      classes: { score: 70, good: [], missing: [], wrong: [] },
      relationships: { score: 65, good: [], missing: [], wrong: [] },
      patternFit: { score: 75, good: [], missing: [], wrong: [] },
      tradeoffs: { score: 55, good: [], missing: [], wrong: [] },
      communication: { score: 80, good: [], missing: [], wrong: [] },
    };
    useDrillStore.getState().setRubric(mock);
    expect(useDrillStore.getState().rubricBreakdown).toEqual(mock);
  });
});
