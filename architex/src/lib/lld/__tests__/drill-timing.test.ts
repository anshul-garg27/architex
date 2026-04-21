import { describe, it, expect } from "vitest";
import {
  idealStageDurations,
  buildTimingHeatmap,
} from "@/lib/lld/drill-timing";

describe("drill-timing · idealStageDurations", () => {
  it("sums to the total budget", () => {
    const total = 30 * 60 * 1000;
    const ideal = idealStageDurations(total);
    const sum =
      ideal.clarify +
      ideal.rubric +
      ideal.canvas +
      ideal.walkthrough +
      ideal.reflection;
    expect(sum).toBe(total);
  });

  it("canvas is the largest share", () => {
    const ideal = idealStageDurations(30 * 60 * 1000);
    expect(ideal.canvas).toBeGreaterThan(ideal.clarify);
    expect(ideal.canvas).toBeGreaterThan(ideal.walkthrough);
  });
});

describe("drill-timing · buildTimingHeatmap", () => {
  it("classifies within-envelope as ok", () => {
    const actual = {
      clarify: 3 * 60 * 1000,
      rubric: 2 * 60 * 1000,
      canvas: 18 * 60 * 1000,
      walkthrough: 5 * 60 * 1000,
      reflection: 2 * 60 * 1000,
    };
    const heatmap = buildTimingHeatmap(actual, 30 * 60 * 1000);
    expect(heatmap.overall).toBe("on-pace");
  });

  it("flags canvas as over when user spent 90% on sketching", () => {
    const actual = {
      clarify: 30 * 1000,
      rubric: 30 * 1000,
      canvas: 25 * 60 * 1000,
      walkthrough: 2 * 60 * 1000,
      reflection: 2 * 60 * 1000,
    };
    const heatmap = buildTimingHeatmap(actual, 30 * 60 * 1000);
    const canvas = heatmap.stages.find((s) => s.stage === "canvas")!;
    expect(canvas.classification).toBe("over");
  });

  it("flags clarify as under when user skipped clarification", () => {
    const actual = {
      clarify: 10 * 1000,
      rubric: 60 * 1000,
      canvas: 20 * 60 * 1000,
      walkthrough: 5 * 60 * 1000,
      reflection: 3 * 60 * 1000,
    };
    const heatmap = buildTimingHeatmap(actual, 30 * 60 * 1000);
    const clarify = heatmap.stages.find((s) => s.stage === "clarify")!;
    expect(clarify.classification).toBe("under");
  });
});
