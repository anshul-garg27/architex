import { describe, it, expect } from "vitest";
import {
  deriveFsrsRating,
  gradeApplyCheckpoint,
  gradeCompareCheckpoint,
  gradeCreateCheckpoint,
  gradeRecallCheckpoint,
} from "../checkpoint-grading";
import type {
  ApplyCheckpoint,
  CompareCheckpoint,
  CreateCheckpoint,
  RecallCheckpoint,
} from "../lesson-types";

describe("deriveFsrsRating", () => {
  it("returns again when still wrong", () => {
    expect(deriveFsrsRating(3, false)).toBe("again");
  });
  it("returns easy on first-try success", () => {
    expect(deriveFsrsRating(1, true)).toBe("easy");
  });
  it("returns good on second-try success", () => {
    expect(deriveFsrsRating(2, true)).toBe("good");
  });
  it("returns hard on third-try success", () => {
    expect(deriveFsrsRating(3, true)).toBe("hard");
  });
});

describe("gradeRecallCheckpoint", () => {
  const cp: RecallCheckpoint = {
    kind: "recall",
    id: "r1",
    prompt: "Pick one",
    options: [
      { id: "a", label: "A", isCorrect: true },
      { id: "b", label: "B", isCorrect: false, whyWrong: "nope" },
    ],
    explanation: "because",
  };
  it("scores correct pick", () => {
    expect(gradeRecallCheckpoint(cp, "a").correct).toBe(true);
  });
  it("scores wrong pick", () => {
    expect(gradeRecallCheckpoint(cp, "b").correct).toBe(false);
  });
  it("handles null pick", () => {
    expect(gradeRecallCheckpoint(cp, null).correct).toBe(false);
  });
});

describe("gradeApplyCheckpoint", () => {
  const cp: ApplyCheckpoint = {
    kind: "apply",
    id: "a1",
    scenario: "pick",
    correctClassIds: ["Product", "Creator"],
    distractorClassIds: ["Observer"],
    explanation: "x",
  };
  it("accepts exact match", () => {
    const r = gradeApplyCheckpoint(cp, new Set(["Product", "Creator"]));
    expect(r.correct).toBe(true);
    expect(r.missing).toHaveLength(0);
    expect(r.extra).toHaveLength(0);
  });
  it("reports missing", () => {
    const r = gradeApplyCheckpoint(cp, new Set(["Product"]));
    expect(r.correct).toBe(false);
    expect(r.missing).toEqual(["Creator"]);
  });
  it("reports extra", () => {
    const r = gradeApplyCheckpoint(
      cp,
      new Set(["Product", "Creator", "Observer"]),
    );
    expect(r.correct).toBe(false);
    expect(r.extra).toEqual(["Observer"]);
  });
});

describe("gradeCompareCheckpoint", () => {
  const cp: CompareCheckpoint = {
    kind: "compare",
    id: "c1",
    prompt: "Compare A vs B",
    left: { patternSlug: "a", label: "A" },
    right: { patternSlug: "b", label: "B" },
    statements: [
      { id: "s1", text: "L only", correct: "left" },
      { id: "s2", text: "R only", correct: "right" },
      { id: "s3", text: "Both", correct: "both" },
    ],
    explanation: "x",
  };
  it("accepts all correct", () => {
    const r = gradeCompareCheckpoint(cp, {
      s1: "left",
      s2: "right",
      s3: "both",
    });
    expect(r.correct).toBe(true);
    expect(r.points).toBe(3);
  });
  it("reports wrong statement ids", () => {
    const r = gradeCompareCheckpoint(cp, {
      s1: "right",
      s2: "right",
      s3: "both",
    });
    expect(r.correct).toBe(false);
    expect(r.wrongStatementIds).toContain("s1");
  });
});

describe("gradeCreateCheckpoint", () => {
  const cp: CreateCheckpoint = {
    kind: "create",
    id: "cr1",
    prompt: "Design",
    starterCanvas: { classes: [] },
    rubric: [
      { criterion: "has factory", points: 2 },
      { criterion: "has product", points: 2 },
    ],
    referenceSolution: {
      classes: [
        { id: "f", name: "Factory" },
        { id: "p", name: "Product" },
      ],
    },
    explanation: "x",
  };
  it("matches when names match (case-insensitive)", () => {
    const r = gradeCreateCheckpoint(cp, ["factory", "Product"]);
    expect(r.correct).toBe(true);
    expect(r.matchedNames).toEqual(["Factory", "Product"]);
  });
  it("reports missing when fewer names supplied", () => {
    const r = gradeCreateCheckpoint(cp, ["Factory"]);
    expect(r.correct).toBe(false);
    expect(r.missingNames).toEqual(["Product"]);
  });
  it("scores proportionally to matches", () => {
    const r = gradeCreateCheckpoint(cp, ["Factory"]);
    expect(r.points).toBe(2);
    expect(r.maxPoints).toBe(4);
  });
});
