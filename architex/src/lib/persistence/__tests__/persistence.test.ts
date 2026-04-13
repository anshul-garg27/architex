// ─────────────────────────────────────────────────────────────
// Persistence layer tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { migrate, LATEST_VERSION } from "../migration";
import type { SerializedProject } from "../migration";
import { hydrateStores } from "../hydration";
import { createAutoSave } from "../auto-save";
import type { AutoSaveHandle } from "../auto-save";

// ── Migration chain ────────────────────────────────────────────

describe("migrate()", () => {
  const baseProject: SerializedProject = {
    version: 1,
    projectId: "test-1",
    name: "Test Project",
    savedAt: new Date().toISOString(),
    data: {
      canvas: { nodes: [], edges: [] },
    },
  };

  it("applies all migrations from v1 to latest", () => {
    const result = migrate(baseProject);
    expect(result.version).toBe(LATEST_VERSION);
  });

  it("adds settings in v1->v2", () => {
    const result = migrate({ ...baseProject, version: 1 });
    const settings = result.data.settings as Record<string, unknown>;
    expect(settings).toBeDefined();
    expect(settings.autoSaveEnabled).toBe(true);
    expect(settings.autoSaveIntervalMs).toBe(2000);
  });

  it("normalises canvas.groups in v2->v3", () => {
    const v2: SerializedProject = {
      ...baseProject,
      version: 2,
      data: {
        canvas: { nodes: [], edges: [] },
        settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
      },
    };
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(Array.isArray(canvas.groups)).toBe(true);
  });

  it("preserves existing groups when migrating v2->v3", () => {
    const v2: SerializedProject = {
      ...baseProject,
      version: 2,
      data: {
        canvas: {
          nodes: [],
          edges: [],
          groups: [{ id: "g1", label: "Group 1" }],
        },
        settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
      },
    };
    const result = migrate(v2);
    const canvas = result.data.canvas as Record<string, unknown>;
    expect(canvas.groups).toEqual([{ id: "g1", label: "Group 1" }]);
  });

  it("is idempotent on already-latest data", () => {
    const latest: SerializedProject = {
      ...baseProject,
      version: LATEST_VERSION,
      data: {
        canvas: { nodes: [], edges: [], groups: [] },
        settings: { autoSaveEnabled: true, autoSaveIntervalMs: 2000 },
      },
    };
    const result = migrate(latest);
    expect(result.version).toBe(LATEST_VERSION);
    expect(result.data).toEqual(latest.data);
  });

  it("never mutates the original input", () => {
    const original = JSON.parse(JSON.stringify(baseProject)) as SerializedProject;
    migrate(baseProject);
    expect(baseProject).toEqual(original);
  });
});

// ── Hydration pipeline ─────────────────────────────────────────

describe("hydrateStores()", () => {
  it("returns full defaults when given null", () => {
    const { stores, status } = hydrateStores(null);
    expect(stores.ui.theme).toBe("dark");
    expect(stores.canvas.nodes).toEqual([]);
    expect(stores.progress.totalXP).toBe(0);
    expect(stores.settings.autoSaveEnabled).toBe(true);
    expect(status.ok).toBe(false); // non-object input is an error
  });

  it("merges partial UI data with defaults", () => {
    const { stores, status } = hydrateStores({
      ui: { theme: "light" },
    });
    expect(stores.ui.theme).toBe("light");
    expect(stores.ui.sidebarOpen).toBe(true); // default preserved
    expect(status.ok).toBe(true);
  });

  it("merges partial canvas data with defaults", () => {
    const nodes = [{ id: "n1" }];
    const { stores } = hydrateStores({
      canvas: { nodes },
    });
    expect(stores.canvas.nodes).toEqual(nodes);
    expect(stores.canvas.edges).toEqual([]); // default preserved
  });

  it("merges partial progress data with defaults", () => {
    const { stores } = hydrateStores({
      progress: { totalXP: 500 },
    });
    expect(stores.progress.totalXP).toBe(500);
    expect(stores.progress.streakDays).toBe(0);
  });

  it("ignores unknown keys", () => {
    const { stores, status } = hydrateStores({
      ui: { theme: "dark", unknownKey: 42 },
    });
    expect(stores.ui.theme).toBe("dark");
    expect(status.ok).toBe(true);
    expect("unknownKey" in stores.ui).toBe(false);
  });

  it("returns ok:true when all sections are valid", () => {
    const { status } = hydrateStores({
      ui: { theme: "dark" },
      canvas: { nodes: [] },
      progress: { totalXP: 0 },
      settings: { autoSaveEnabled: true },
    });
    expect(status.ok).toBe(true);
  });
});

// ── Auto-save debounce ─────────────────────────────────────────

describe("createAutoSave()", () => {
  let handle: AutoSaveHandle;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    handle?.dispose();
    vi.useRealTimers();
  });

  it("coalesces multiple markDirty calls into one save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    handle = createAutoSave({
      debounceMs: 2000,
      onSave,
      getData: () => ({ value: 1 }),
    });

    handle.markDirty();
    handle.markDirty();
    handle.markDirty();

    // Nothing yet
    expect(onSave).not.toHaveBeenCalled();

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(2100);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ value: 1 });
  });

  it("resets debounce timer on each markDirty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    handle = createAutoSave({
      debounceMs: 2000,
      onSave,
      getData: () => ({ v: 1 }),
    });

    handle.markDirty();
    await vi.advanceTimersByTimeAsync(1500);
    // Another change resets the timer
    handle.markDirty();
    await vi.advanceTimersByTimeAsync(1500);
    // Still not fired (only 1500ms since last markDirty)
    expect(onSave).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(600);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("forceSave bypasses debounce", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    handle = createAutoSave({
      debounceMs: 10_000,
      onSave,
      getData: () => ({ v: 1 }),
    });

    await handle.forceSave();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("sets status to error when save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("disk full"));
    const statuses: string[] = [];
    handle = createAutoSave({
      debounceMs: 100,
      onSave,
      getData: () => ({}),
      onStatusChange: (s) => statuses.push(s),
    });

    handle.markDirty();
    await vi.advanceTimersByTimeAsync(200);

    expect(statuses).toContain("saving");
    expect(statuses).toContain("error");
    expect(handle.getStatus()).toBe("error");
  });

  // ── Dirty flag ───────────────────────────────────────────────

  it("isDirty is true after markDirty and false after save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    handle = createAutoSave({
      debounceMs: 100,
      onSave,
      getData: () => ({}),
    });

    expect(handle.isDirty()).toBe(false);
    handle.markDirty();
    expect(handle.isDirty()).toBe(true);

    await vi.advanceTimersByTimeAsync(200);
    expect(handle.isDirty()).toBe(false);
  });

  it("re-marks dirty if save fails so retry is possible", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("fail"));
    handle = createAutoSave({
      debounceMs: 100,
      onSave,
      getData: () => ({}),
    });

    handle.markDirty();
    await vi.advanceTimersByTimeAsync(200);

    // Should still be dirty because save failed
    expect(handle.isDirty()).toBe(true);
  });

  it("dispose clears pending timer", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    handle = createAutoSave({
      debounceMs: 2000,
      onSave,
      getData: () => ({}),
    });

    handle.markDirty();
    handle.dispose();

    await vi.advanceTimersByTimeAsync(3000);
    expect(onSave).not.toHaveBeenCalled();
  });
});
