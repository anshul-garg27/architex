import { describe, it, expect } from "vitest";
import {
  VARIANT_CONFIG,
  variantConfigFor,
  hintsAllowedIn,
  timerEnforcedIn,
  affectsFSRSIn,
  defaultDurationFor,
} from "@/lib/lld/drill-variants";

describe("drill-variants · config shape", () => {
  it("has exactly 3 variants", () => {
    expect(Object.keys(VARIANT_CONFIG).sort()).toEqual([
      "exam",
      "study",
      "timed-mock",
    ]);
  });

  it("exam is the strictest (no hints, timer enforced, FSRS ON)", () => {
    const cfg = variantConfigFor("exam");
    expect(cfg.hintsAllowed).toBe(false);
    expect(cfg.timerEnforced).toBe(true);
    expect(cfg.affectsFSRS).toBe(true);
    expect(cfg.interviewerMayOfferHelp).toBe(false);
  });

  it("timed-mock is realistic (hints allowed, timer enforced, FSRS ON)", () => {
    const cfg = variantConfigFor("timed-mock");
    expect(cfg.hintsAllowed).toBe(true);
    expect(cfg.timerEnforced).toBe(true);
    expect(cfg.affectsFSRS).toBe(true);
  });

  it("study is permissive (hints free, no timer, FSRS OFF)", () => {
    const cfg = variantConfigFor("study");
    expect(cfg.hintsAllowed).toBe(true);
    expect(cfg.timerEnforced).toBe(false);
    expect(cfg.affectsFSRS).toBe(false);
    expect(cfg.interviewerMayOfferHelp).toBe(true);
  });
});

describe("drill-variants · helpers", () => {
  it("hintsAllowedIn matches config", () => {
    expect(hintsAllowedIn("exam")).toBe(false);
    expect(hintsAllowedIn("timed-mock")).toBe(true);
    expect(hintsAllowedIn("study")).toBe(true);
  });

  it("timerEnforcedIn matches config", () => {
    expect(timerEnforcedIn("exam")).toBe(true);
    expect(timerEnforcedIn("study")).toBe(false);
  });

  it("affectsFSRSIn matches config", () => {
    expect(affectsFSRSIn("study")).toBe(false);
    expect(affectsFSRSIn("exam")).toBe(true);
  });

  it("defaultDurationFor returns sensible defaults", () => {
    expect(defaultDurationFor("exam")).toBe(25 * 60 * 1000);
    expect(defaultDurationFor("timed-mock")).toBe(30 * 60 * 1000);
    expect(defaultDurationFor("study")).toBe(60 * 60 * 1000);
  });
});
