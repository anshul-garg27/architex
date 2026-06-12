import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { RubricBreakdown } from "@/lib/lld/drill-rubric";
import { useDrillStore } from "@/stores/drill-store";
import { useLLDDrillSync } from "@/hooks/useLLDDrillSync";

function startDrill(attemptId: string) {
  useDrillStore.getState().beginAttempt({
    attemptId,
    variant: "timed-mock",
    persona: "generic",
  });
}

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useLLDDrillSync · heartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as typeof fetch;
    useDrillStore.getState().reset();
  });

  afterEach(() => {
    setDocumentHidden(false);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not fire heartbeat when no drill attempt is active", () => {
    renderHook(() => useLLDDrillSync());
    vi.advanceTimersByTime(15_000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fires heartbeat every 10 seconds while a drill attempt is active", () => {
    act(() => startDrill("drill-abc"));
    renderHook(() => useLLDDrillSync());
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/lld/drill-attempts/drill-abc",
      expect.objectContaining({ method: "PATCH" }),
    );
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stops heartbeat once the attempt is graded", () => {
    act(() => startDrill("drill-abc"));
    renderHook(() => useLLDDrillSync());
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    act(() => {
      useDrillStore.getState().setRubric({} as RubricBreakdown, 80);
    });
    vi.advanceTimersByTime(30_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("pauses heartbeat while the tab is hidden and resumes on visibility", () => {
    act(() => startDrill("drill-abc"));
    renderHook(() => useLLDDrillSync());
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => setDocumentHidden(true));
    vi.advanceTimersByTime(30_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => setDocumentHidden(false));
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
