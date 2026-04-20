import { describe, it, expect, beforeEach, vi } from "vitest";
import { useInterviewStore } from "@/stores/interview-store";

describe("interview-store · drill slice", () => {
  beforeEach(() => {
    useInterviewStore.setState({ activeDrill: null });
  });

  it("has null activeDrill by default", () => {
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("startDrill creates an active drill record", () => {
    useInterviewStore
      .getState()
      .startDrill("parking-lot", "interview", 20 * 60 * 1000);
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill).not.toBeNull();
    expect(drill?.problemId).toBe("parking-lot");
    expect(drill?.drillMode).toBe("interview");
    expect(drill?.durationLimitMs).toBe(20 * 60 * 1000);
    expect(drill?.pausedAt).toBeNull();
  });

  it("pauseDrill sets pausedAt and records elapsed", () => {
    const fakeNow = 1_000_000;
    vi.spyOn(Date, "now").mockReturnValue(fakeNow);
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    vi.spyOn(Date, "now").mockReturnValue(fakeNow + 5000);
    useInterviewStore.getState().pauseDrill();
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill?.pausedAt).toBe(fakeNow + 5000);
    expect(drill?.elapsedBeforePauseMs).toBe(5000);
    vi.restoreAllMocks();
  });

  it("resumeDrill clears pausedAt", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().pauseDrill();
    useInterviewStore.getState().resumeDrill();
    expect(useInterviewStore.getState().activeDrill?.pausedAt).toBeNull();
  });

  it("abandonDrill clears the active drill", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().abandonDrill();
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("submitDrill clears the active drill", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().submitDrill();
    expect(useInterviewStore.getState().activeDrill).toBeNull();
  });

  it("useHint(tier) appends to activeDrill.hintsUsed when drill is active", () => {
    useInterviewStore.getState().startDrill("x", "interview", 60000);
    useInterviewStore.getState().useHint("nudge");
    useInterviewStore.getState().useHint("guided");
    const drill = useInterviewStore.getState().activeDrill;
    expect(drill?.hintsUsed).toHaveLength(2);
    expect(drill?.hintsUsed[0]?.tier).toBe("nudge");
    expect(drill?.hintsUsed[1]?.tier).toBe("guided");
  });
});
