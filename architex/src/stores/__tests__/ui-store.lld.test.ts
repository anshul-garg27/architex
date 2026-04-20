import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("ui-store · lld slice", () => {
  beforeEach(() => {
    useUIStore.setState({ lldMode: null, lldWelcomeBannerDismissed: false });
  });

  it("has null lldMode by default (first visit)", () => {
    expect(useUIStore.getState().lldMode).toBeNull();
  });

  it("setLLDMode updates mode", () => {
    useUIStore.getState().setLLDMode("learn");
    expect(useUIStore.getState().lldMode).toBe("learn");
  });

  it("setLLDMode persists across calls", () => {
    useUIStore.getState().setLLDMode("drill");
    useUIStore.getState().setLLDMode("build");
    expect(useUIStore.getState().lldMode).toBe("build");
  });

  it("dismissLLDWelcomeBanner sets flag", () => {
    expect(useUIStore.getState().lldWelcomeBannerDismissed).toBe(false);
    useUIStore.getState().dismissLLDWelcomeBanner();
    expect(useUIStore.getState().lldWelcomeBannerDismissed).toBe(true);
  });

  it("accepts all four mode values", () => {
    const modes = ["learn", "build", "drill", "review"] as const;
    for (const m of modes) {
      useUIStore.getState().setLLDMode(m);
      expect(useUIStore.getState().lldMode).toBe(m);
    }
  });
});
