import { describe, it, expect } from "vitest";
import {
  RUBRIC_AXES,
  AXIS_WEIGHTS,
  computeWeightedScore,
  axisLabel,
  bandForScore,
  type RubricBreakdown,
} from "@/lib/lld/drill-rubric";

describe("drill-rubric · axes + weights", () => {
  it("has exactly 6 axes in canonical order", () => {
    expect(RUBRIC_AXES).toEqual([
      "clarification",
      "classes",
      "relationships",
      "patternFit",
      "tradeoffs",
      "communication",
    ]);
  });

  it("axis weights sum to exactly 1.0", () => {
    const sum = RUBRIC_AXES.reduce((acc, a) => acc + AXIS_WEIGHTS[a], 0);
    expect(sum).toBeCloseTo(1.0, 6);
  });

  it("axisLabel returns human-readable strings", () => {
    expect(axisLabel("patternFit")).toBe("Pattern Fit");
    expect(axisLabel("classes")).toBe("Classes");
  });
});

describe("drill-rubric · computeWeightedScore", () => {
  const perfect: RubricBreakdown = {
    clarification: { score: 100, good: [], missing: [], wrong: [] },
    classes: { score: 100, good: [], missing: [], wrong: [] },
    relationships: { score: 100, good: [], missing: [], wrong: [] },
    patternFit: { score: 100, good: [], missing: [], wrong: [] },
    tradeoffs: { score: 100, good: [], missing: [], wrong: [] },
    communication: { score: 100, good: [], missing: [], wrong: [] },
  };

  it("perfect breakdown yields 100", () => {
    expect(computeWeightedScore(perfect)).toBe(100);
  });

  it("all zero yields 0", () => {
    const zeros: RubricBreakdown = {
      clarification: { score: 0, good: [], missing: [], wrong: [] },
      classes: { score: 0, good: [], missing: [], wrong: [] },
      relationships: { score: 0, good: [], missing: [], wrong: [] },
      patternFit: { score: 0, good: [], missing: [], wrong: [] },
      tradeoffs: { score: 0, good: [], missing: [], wrong: [] },
      communication: { score: 0, good: [], missing: [], wrong: [] },
    };
    expect(computeWeightedScore(zeros)).toBe(0);
  });

  it("weights are applied correctly", () => {
    const mixed: RubricBreakdown = {
      clarification: { score: 100, good: [], missing: [], wrong: [] },
      classes: { score: 0, good: [], missing: [], wrong: [] },
      relationships: { score: 100, good: [], missing: [], wrong: [] },
      patternFit: { score: 50, good: [], missing: [], wrong: [] },
      tradeoffs: { score: 80, good: [], missing: [], wrong: [] },
      communication: { score: 100, good: [], missing: [], wrong: [] },
    };
    // 100*0.10 + 0*0.25 + 100*0.20 + 50*0.20 + 80*0.15 + 100*0.10
    // = 10 + 0 + 20 + 10 + 12 + 10 = 62
    expect(computeWeightedScore(mixed)).toBe(62);
  });
});

describe("drill-rubric · bands", () => {
  it("90+ is stellar", () => {
    expect(bandForScore(92).key).toBe("stellar");
  });

  it("70-89 is solid", () => {
    expect(bandForScore(75).key).toBe("solid");
  });

  it("50-69 is coaching", () => {
    expect(bandForScore(60).key).toBe("coaching");
  });

  it("<50 is redirect", () => {
    expect(bandForScore(30).key).toBe("redirect");
  });
});
