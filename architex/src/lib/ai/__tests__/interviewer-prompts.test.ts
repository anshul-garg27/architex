import { describe, it, expect } from "vitest";
import {
  INTERVIEWER_PERSONAS,
  systemPromptFor,
  stageOpenerFor,
} from "@/lib/ai/interviewer-prompts";

describe("interviewer-prompts · personas", () => {
  it("exposes all 6 personas", () => {
    expect([...INTERVIEWER_PERSONAS].sort()).toEqual([
      "amazon",
      "generic",
      "google",
      "meta",
      "stripe",
      "uber",
    ]);
  });

  it("each persona has a non-empty system prompt", () => {
    for (const p of INTERVIEWER_PERSONAS) {
      const prompt = systemPromptFor(p, "clarify");
      expect(prompt.length).toBeGreaterThan(200);
    }
  });

  it("system prompt is specific to persona", () => {
    const amazon = systemPromptFor("amazon", "clarify");
    expect(amazon.toLowerCase()).toMatch(/bar.?rais|simplic|leadership principle/);
  });

  it("stageOpenerFor returns persona-flavored opener", () => {
    const clarifyOpener = stageOpenerFor("generic", "clarify", "parking-lot");
    expect(clarifyOpener.toLowerCase()).toMatch(/parking lot|clarif/);
  });
});
