import { describe, it, expect } from "vitest";
import {
  getCanonicalFor,
  hasCanonicalFor,
  CANONICAL_PROBLEM_IDS,
} from "@/lib/lld/drill-canonical";

describe("drill-canonical", () => {
  it("returns null for unknown problem", () => {
    expect(getCanonicalFor("no-such-problem")).toBeNull();
    expect(hasCanonicalFor("no-such-problem")).toBe(false);
  });

  it("returns a structured solution for each seeded problem", () => {
    for (const id of CANONICAL_PROBLEM_IDS) {
      const sol = getCanonicalFor(id);
      expect(sol).not.toBeNull();
      expect(sol!.problemId).toBe(id);
      expect(sol!.classes.length).toBeGreaterThanOrEqual(3);
      expect(sol!.relationships.length).toBeGreaterThanOrEqual(1);
      expect(sol!.patterns.length).toBeGreaterThanOrEqual(1);
      expect(sol!.keyTradeoffs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("parking-lot is seeded", () => {
    expect(hasCanonicalFor("parking-lot")).toBe(true);
  });

  it("elevator-system is seeded", () => {
    expect(hasCanonicalFor("elevator-system")).toBe(true);
  });
});
