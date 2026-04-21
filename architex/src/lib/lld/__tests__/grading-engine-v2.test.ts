import { describe, it, expect } from "vitest";
import {
  gradeDrillAttempt,
  heuristicClarificationScore,
  heuristicTradeoffScore,
  heuristicCommunicationScore,
  type DrillGradeInput,
} from "@/lib/lld/grading-engine-v2";

const baseInput: DrillGradeInput = {
  problemId: "parking-lot",
  canvasState: {
    nodes: [
      { id: "n1" },
      { id: "n2" },
      { id: "n3" },
      { id: "n4" },
      { id: "n5" },
    ],
    edges: [{}, {}, {}, {}],
  },
  interviewerTurns: [
    { role: "user", stage: "clarify", content: "How many levels?" },
    { role: "user", stage: "clarify", content: "What vehicle types?" },
  ],
  walkthroughText:
    "User pulls up. ParkingLot.assignSpot() selects a spot by size using PricingStrategy. Ticket is issued. We use Strategy over a switch to keep pricing extensible; the cost is one interface indirection. This gives us flexibility at the cost of complexity.",
  selfGrade: 4,
  stageDurationsMs: {
    clarify: 60_000,
    rubric: 30_000,
    canvas: 900_000,
    walkthrough: 240_000,
    reflection: 60_000,
  },
};

describe("grading-engine-v2 · heuristic fallbacks", () => {
  it("heuristicClarificationScore rewards multiple questions", () => {
    expect(heuristicClarificationScore([])).toBe(0);
    expect(heuristicClarificationScore(["q1"])).toBeLessThan(50);
    expect(heuristicClarificationScore(["q1", "q2", "q3"])).toBeGreaterThan(70);
  });

  it("heuristicTradeoffScore rewards tradeoff keywords", () => {
    expect(heuristicTradeoffScore("")).toBe(0);
    expect(heuristicTradeoffScore("i drew classes")).toBeLessThan(40);
    expect(
      heuristicTradeoffScore(
        "We trade memory for speed here. Strategy costs an interface but gives us extensibility. Tradeoff: more classes.",
      ),
    ).toBeGreaterThan(60);
  });

  it("heuristicCommunicationScore rewards sentence structure", () => {
    expect(heuristicCommunicationScore("")).toBe(0);
    expect(heuristicCommunicationScore("classes. go.")).toBeLessThan(40);
    expect(
      heuristicCommunicationScore(
        "First, the user arrives. Then we call assignSpot which picks a spot by size. Finally, a ticket is issued and returned to the gate.",
      ),
    ).toBeGreaterThan(70);
  });
});

describe("grading-engine-v2 · gradeDrillAttempt (fallback mode)", () => {
  it("returns a valid 6-axis rubric breakdown", async () => {
    const result = await gradeDrillAttempt(baseInput, {
      mode: "fallback-only",
    });
    expect(result.rubric.clarification.score).toBeGreaterThanOrEqual(0);
    expect(result.rubric.clarification.score).toBeLessThanOrEqual(100);
    expect(result.rubric.classes.score).toBeGreaterThanOrEqual(0);
    expect(result.rubric.tradeoffs.score).toBeGreaterThan(40);
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalScore).toBeLessThanOrEqual(100);
  });

  it("penalizes empty canvas heavily", async () => {
    const result = await gradeDrillAttempt(
      { ...baseInput, canvasState: { nodes: [], edges: [] } },
      { mode: "fallback-only" },
    );
    expect(result.rubric.classes.score).toBeLessThan(40);
  });
});
