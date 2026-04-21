import { describe, it, expect } from "vitest";
import {
  buildInterviewerRequest,
  parseTurnHistory,
  InterviewerPersonaRequestError,
  type InterviewerTurn,
} from "@/lib/ai/interviewer-persona";

describe("interviewer-persona · buildInterviewerRequest", () => {
  const turn: InterviewerTurn = {
    role: "user",
    stage: "clarify",
    content: "The lot can have variable levels, right?",
    seq: 0,
    createdAt: new Date().toISOString(),
  };

  it("composes the system prompt + message history", () => {
    const req = buildInterviewerRequest({
      persona: "amazon",
      stage: "clarify",
      problemTitle: "Parking Lot",
      history: [turn],
    });
    expect(req.model).toBe("claude-sonnet-4-20250514");
    expect(req.system).toMatch(/Bar Raiser/);
    expect(req.system).toMatch(/Parking Lot/);
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0]?.role).toBe("user");
  });

  it("throws if last turn is not from user", () => {
    const interviewerTurn: InterviewerTurn = {
      role: "interviewer",
      stage: "clarify",
      content: "Let's clarify scope first.",
      seq: 1,
      createdAt: new Date().toISOString(),
    };
    expect(() =>
      buildInterviewerRequest({
        persona: "generic",
        stage: "clarify",
        problemTitle: "Parking Lot",
        history: [interviewerTurn],
      }),
    ).toThrow(InterviewerPersonaRequestError);
  });

  it("caps history length to prevent runaway token costs", () => {
    const manyTurns: InterviewerTurn[] = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? "interviewer" : "user",
      stage: "clarify",
      content: `Turn ${i}`,
      seq: i,
      createdAt: new Date().toISOString(),
    }));
    // Last turn must be user to be valid
    manyTurns[manyTurns.length - 1]!.role = "user";

    const req = buildInterviewerRequest({
      persona: "generic",
      stage: "clarify",
      problemTitle: "Parking Lot",
      history: manyTurns,
    });
    expect(req.messages.length).toBeLessThanOrEqual(30);
  });
});

describe("interviewer-persona · parseTurnHistory", () => {
  it("flattens DB rows into chronological turn history", () => {
    const rows = [
      { role: "interviewer" as const, seq: 2, content: "c" },
      { role: "user" as const, seq: 1, content: "b" },
      { role: "interviewer" as const, seq: 0, content: "a" },
    ];
    const history = parseTurnHistory(rows);
    expect(history.map((h) => h.content)).toEqual(["a", "b", "c"]);
  });
});
