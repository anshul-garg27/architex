import { describe, it, expect } from "vitest";
import {
  buildPostmortemPrompt,
  parsePostmortemResponse,
  PostmortemParseError,
  type PostmortemInput,
} from "@/lib/ai/postmortem-generator";

const input: PostmortemInput = {
  problemId: "parking-lot",
  problemTitle: "Parking Lot",
  variant: "timed-mock",
  persona: "generic",
  rubric: {
    clarification: { score: 80, good: [], missing: [], wrong: [] },
    classes: { score: 70, good: [], missing: [], wrong: [] },
    relationships: { score: 60, good: [], missing: [], wrong: [] },
    patternFit: { score: 75, good: [], missing: [], wrong: [] },
    tradeoffs: { score: 50, good: [], missing: [], wrong: [] },
    communication: { score: 85, good: [], missing: [], wrong: [] },
  },
  finalScore: 68,
  stageDurationsMs: {
    clarify: 120_000,
    rubric: 60_000,
    canvas: 900_000,
    walkthrough: 300_000,
    reflection: 120_000,
  },
  canvasSummary: "5 classes, 7 edges. Pattern claimed: strategy.",
  canonical: {
    patternsExpected: ["strategy", "factory-method"],
    keyTradeoffs: ["polymorphism vs switch", "strategy cost"],
  },
};

describe("postmortem-generator · buildPostmortemPrompt", () => {
  it("builds a prompt containing all rubric scores + canonical hints", () => {
    const req = buildPostmortemPrompt(input);
    expect(req.model).toBe("claude-sonnet-4-20250514");
    expect(req.user).toMatch(/Parking Lot/);
    expect(req.user).toMatch(/tradeoffs/);
    expect(req.user).toMatch(/strategy/);
    expect(req.user).toMatch(/68/);
  });

  it("requests strict JSON output format", () => {
    const req = buildPostmortemPrompt(input);
    expect(req.system).toMatch(/JSON/i);
  });
});

describe("postmortem-generator · parsePostmortemResponse", () => {
  const valid = JSON.stringify({
    tldr: "Solid core. Weak tradeoff articulation.",
    strengths: ["Classes clearly justified", "Clean walkthrough"],
    gaps: ["Missed strategy vs factory tradeoff"],
    patternCommentary:
      "Strategy was right; you didn't articulate why not Template Method.",
    tradeoffAnalysis:
      "You accepted polymorphism cost without naming it.",
    canonicalDiff: ["You missed PricingStrategy as a separate class."],
    followUps: ["Retry with a constraint", "Drill strategy-vs-template-method"],
  });

  it("parses a well-formed JSON response", () => {
    const result = parsePostmortemResponse(valid);
    expect(result.tldr.length).toBeGreaterThan(0);
    expect(result.strengths).toHaveLength(2);
    expect(result.followUps.length).toBeGreaterThan(0);
  });

  it("strips json fence wrappers", () => {
    const withFence = "```json\n" + valid + "\n```";
    const result = parsePostmortemResponse(withFence);
    expect(result.tldr.length).toBeGreaterThan(0);
  });

  it("throws PostmortemParseError on missing fields", () => {
    expect(() => parsePostmortemResponse('{"tldr": "x"}')).toThrow(
      PostmortemParseError,
    );
  });

  it("throws PostmortemParseError on invalid JSON", () => {
    expect(() => parsePostmortemResponse("not json")).toThrow(
      PostmortemParseError,
    );
  });
});
