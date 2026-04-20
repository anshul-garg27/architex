import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useInterviewStore } from "@/stores/interview-store";
import { useLLDDrillSync } from "@/hooks/useLLDDrillSync";

function wrapper(queryClient: QueryClient) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryClientWrapper";
  return Wrapper;
}

describe("useLLDDrillSync · heartbeat", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as typeof fetch;
    useInterviewStore.setState({ activeDrill: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not fire heartbeat when no active drill", () => {
    renderHook(() => useLLDDrillSync("fake-drill-id"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(15_000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fires heartbeat every 10 seconds while drill is running", () => {
    act(() => {
      useInterviewStore.getState().startDrill("x", "interview", 60_000);
    });
    renderHook(() => useLLDDrillSync("drill-abc"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/lld/drill-attempts/drill-abc",
      expect.objectContaining({ method: "PATCH" }),
    );
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stops heartbeat when drill is paused", () => {
    act(() => {
      useInterviewStore.getState().startDrill("x", "interview", 60_000);
    });
    renderHook(() => useLLDDrillSync("drill-abc"), {
      wrapper: wrapper(queryClient),
    });
    vi.advanceTimersByTime(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    act(() => {
      useInterviewStore.getState().pauseDrill();
    });
    vi.advanceTimersByTime(20_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
