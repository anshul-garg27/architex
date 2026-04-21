import { describe, it, expect } from "vitest";
import {
  STAGE_ORDER,
  nextStage,
  previousStage,
  canAdvance,
  gatePredicateFor,
  isTerminalStage,
  type DrillStageProgress,
} from "@/lib/lld/drill-stages";

describe("drill-stages · ordering", () => {
  it("enforces canonical stage order", () => {
    expect(STAGE_ORDER).toEqual([
      "clarify",
      "rubric",
      "canvas",
      "walkthrough",
      "reflection",
    ]);
  });

  it("nextStage returns the next stage or null at the end", () => {
    expect(nextStage("clarify")).toBe("rubric");
    expect(nextStage("rubric")).toBe("canvas");
    expect(nextStage("canvas")).toBe("walkthrough");
    expect(nextStage("walkthrough")).toBe("reflection");
    expect(nextStage("reflection")).toBeNull();
  });

  it("previousStage returns the previous stage or null at the start", () => {
    expect(previousStage("clarify")).toBeNull();
    expect(previousStage("rubric")).toBe("clarify");
    expect(previousStage("reflection")).toBe("walkthrough");
  });

  it("isTerminalStage is true only for reflection", () => {
    expect(isTerminalStage("reflection")).toBe(true);
    expect(isTerminalStage("canvas")).toBe(false);
  });
});

describe("drill-stages · clarify gate", () => {
  const gate = gatePredicateFor("clarify");

  it("blocks when fewer than 2 questions asked", () => {
    const progress: DrillStageProgress = { questionsAsked: 1 };
    expect(gate(progress)).toEqual({
      satisfied: false,
      reason: "Ask at least 2 clarifying questions.",
    });
  });

  it("passes at 2 or more questions", () => {
    const progress: DrillStageProgress = { questionsAsked: 2 };
    expect(gate(progress).satisfied).toBe(true);
  });
});

describe("drill-stages · rubric gate", () => {
  const gate = gatePredicateFor("rubric");

  it("blocks when rubric is not locked", () => {
    const progress: DrillStageProgress = { rubricLocked: false };
    expect(gate(progress).satisfied).toBe(false);
  });

  it("passes when rubric is locked", () => {
    const progress: DrillStageProgress = { rubricLocked: true };
    expect(gate(progress).satisfied).toBe(true);
  });
});

describe("drill-stages · canvas gate", () => {
  const gate = gatePredicateFor("canvas");

  it("blocks when fewer than 3 classes on canvas", () => {
    expect(gate({ canvasClassCount: 2 }).satisfied).toBe(false);
  });

  it("blocks when no edges exist even with classes", () => {
    expect(gate({ canvasClassCount: 5, canvasEdgeCount: 0 }).satisfied).toBe(
      false,
    );
  });

  it("passes with >=3 classes and >=1 edge", () => {
    expect(
      gate({ canvasClassCount: 3, canvasEdgeCount: 1 }).satisfied,
    ).toBe(true);
  });
});

describe("drill-stages · walkthrough gate", () => {
  const gate = gatePredicateFor("walkthrough");

  it("blocks when walkthrough text under 120 chars", () => {
    expect(gate({ walkthroughChars: 50 }).satisfied).toBe(false);
  });

  it("passes with >=120 chars", () => {
    expect(gate({ walkthroughChars: 120 }).satisfied).toBe(true);
  });
});

describe("drill-stages · reflection gate", () => {
  const gate = gatePredicateFor("reflection");

  it("blocks when no self-grade selection made", () => {
    expect(gate({ selfGrade: null }).satisfied).toBe(false);
  });

  it("passes when self-grade is chosen", () => {
    expect(gate({ selfGrade: 3 }).satisfied).toBe(true);
  });
});

describe("drill-stages · canAdvance integration", () => {
  it("false when gate fails", () => {
    expect(canAdvance("clarify", { questionsAsked: 0 })).toBe(false);
  });

  it("true when gate passes", () => {
    expect(canAdvance("clarify", { questionsAsked: 3 })).toBe(true);
  });

  it("false at terminal stage regardless of progress", () => {
    expect(canAdvance("reflection", { selfGrade: 4 })).toBe(false);
  });
});
