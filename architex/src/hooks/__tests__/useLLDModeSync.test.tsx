import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Hoisted mocks — Vitest requires these BEFORE import
const { replaceMock, searchParamsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsMock: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
}));

import { useLLDModeSync } from "@/hooks/useLLDModeSync";
import { useUIStore } from "@/stores/ui-store";

describe("useLLDModeSync", () => {
  beforeEach(() => {
    useUIStore.setState({ lldMode: null });
    replaceMock.mockClear();
    // Reset searchParams to empty
    Array.from(searchParamsMock.keys()).forEach((k) =>
      searchParamsMock.delete(k),
    );
  });

  it("reads mode from URL param on mount", () => {
    searchParamsMock.set("mode", "learn");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBe("learn");
  });

  it("ignores invalid mode values", () => {
    searchParamsMock.set("mode", "garbage");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBeNull();
  });

  it("does not overwrite store if URL has no mode param", () => {
    useUIStore.getState().setLLDMode("build");
    renderHook(() => useLLDModeSync());
    expect(useUIStore.getState().lldMode).toBe("build");
  });

  it("updates URL when store mode changes", () => {
    renderHook(() => useLLDModeSync());
    act(() => {
      useUIStore.getState().setLLDMode("drill");
    });
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("mode=drill"),
      expect.objectContaining({ scroll: false }),
    );
  });
});
