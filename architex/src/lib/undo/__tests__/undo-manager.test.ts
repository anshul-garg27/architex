import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UndoManager } from "../undo-manager";
import { TransactionManager } from "../transactions";
import { createDebouncedSnapshot, createDragSnapshot } from "../debounce";

// ── UndoManager core ──────────────────────────────────────

describe("UndoManager", () => {
  let manager: UndoManager<string>;

  beforeEach(() => {
    manager = new UndoManager<string>();
  });

  it("starts with empty stacks", () => {
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoStackSize).toBe(0);
    expect(manager.redoStackSize).toBe(0);
  });

  it("push/undo/redo cycle works", () => {
    manager.pushSnapshot("A");
    manager.pushSnapshot("B");
    manager.pushSnapshot("C");

    expect(manager.canUndo).toBe(true);
    expect(manager.undoStackSize).toBe(2); // A, B on undo stack; C is current

    // Undo back to B
    const undone1 = manager.undo();
    expect(undone1).toBe("B");
    expect(manager.getCurrent()).toBe("B");
    expect(manager.canRedo).toBe(true);

    // Undo back to A
    const undone2 = manager.undo();
    expect(undone2).toBe("A");
    expect(manager.getCurrent()).toBe("A");

    // Redo forward to B
    const redone1 = manager.redo();
    expect(redone1).toBe("B");
    expect(manager.getCurrent()).toBe("B");

    // Redo forward to C
    const redone2 = manager.redo();
    expect(redone2).toBe("C");
    expect(manager.getCurrent()).toBe("C");
    expect(manager.canRedo).toBe(false);
  });

  it("pushing after undo clears the redo stack", () => {
    manager.pushSnapshot("A");
    manager.pushSnapshot("B");
    manager.pushSnapshot("C");

    manager.undo(); // back to B
    manager.pushSnapshot("D");

    expect(manager.canRedo).toBe(false);
    expect(manager.redoStackSize).toBe(0);
    expect(manager.getCurrent()).toBe("D");
  });

  it("undo on empty stack returns null", () => {
    expect(manager.undo()).toBeNull();
  });

  it("redo on empty stack returns null", () => {
    manager.pushSnapshot("A");
    expect(manager.redo()).toBeNull();
  });

  it("clear resets everything", () => {
    manager.pushSnapshot("A");
    manager.pushSnapshot("B");
    manager.pushSnapshot("C");
    manager.undo();

    manager.clear();

    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoStackSize).toBe(0);
    expect(manager.redoStackSize).toBe(0);
    expect(manager.getCurrent()).toBeNull();
  });

  it("canUndo/canRedo reflect correct state at each step", () => {
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);

    manager.pushSnapshot("A");
    expect(manager.canUndo).toBe(false); // only one snapshot, nothing to undo to
    expect(manager.canRedo).toBe(false);

    manager.pushSnapshot("B");
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);

    manager.undo();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    manager.redo();
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  it("notifies listeners on state changes", () => {
    const listener = vi.fn();
    const unsub = manager.subscribe(listener);

    manager.pushSnapshot("A");
    expect(listener).toHaveBeenCalledTimes(1);

    manager.pushSnapshot("B");
    expect(listener).toHaveBeenCalledTimes(2);

    manager.undo();
    expect(listener).toHaveBeenCalledTimes(3);

    manager.redo();
    expect(listener).toHaveBeenCalledTimes(4);

    manager.clear();
    expect(listener).toHaveBeenCalledTimes(5);

    unsub();
    manager.pushSnapshot("C");
    expect(listener).toHaveBeenCalledTimes(5); // no more calls
  });
});

// ── Memory cap eviction ───────────────────────────────────

describe("UndoManager - memory cap eviction", () => {
  it("evicts oldest entries when maxEntries exceeded", () => {
    const manager = new UndoManager<number>({ maxEntries: 3 });

    // Push 5 snapshots: 1, 2, 3, 4, 5
    for (let i = 1; i <= 5; i++) {
      manager.pushSnapshot(i);
    }

    // Current is 5, undo stack should have at most 3 entries
    expect(manager.undoStackSize).toBe(3);

    // Undo should reach back only 3 steps (to snapshot 2)
    const s1 = manager.undo();
    const s2 = manager.undo();
    const s3 = manager.undo();
    expect(s1).toBe(4);
    expect(s2).toBe(3);
    expect(s3).toBe(2);
    expect(manager.undo()).toBeNull(); // 1 was evicted
  });

  it("evicts oldest entries when maxBytes exceeded", () => {
    // Each number snapshot ~1-2 bytes JSON, use small maxBytes
    const manager = new UndoManager<string>({ maxBytes: 50 });

    // Each "AAAA...A" is ~20+ chars JSON = ~40+ bytes
    const bigSnap = "A".repeat(20);
    manager.pushSnapshot(bigSnap + "1");
    manager.pushSnapshot(bigSnap + "2");
    manager.pushSnapshot(bigSnap + "3");

    // With ~40-50 bytes per entry and 50 byte cap, old entries evicted
    expect(manager.undoStackSize).toBeLessThanOrEqual(1);
  });
});

// ── TransactionManager ────────────────────────────────────

describe("TransactionManager", () => {
  let undoManager: UndoManager<string>;
  let txManager: TransactionManager<string>;

  beforeEach(() => {
    undoManager = new UndoManager<string>();
    txManager = new TransactionManager(undoManager);
  });

  it("commit creates a single undo entry", () => {
    undoManager.pushSnapshot("initial");

    txManager.beginTransaction();
    // Simulate multiple intermediate changes (not pushed to undo)
    txManager.commitTransaction("final-after-many-changes");

    expect(undoManager.undoStackSize).toBe(1); // only "initial" on undo stack
    expect(undoManager.getCurrent()).toBe("final-after-many-changes");

    const undone = undoManager.undo();
    expect(undone).toBe("initial");
  });

  it("rollback discards changes and returns pre-transaction snapshot", () => {
    undoManager.pushSnapshot("before-tx");

    txManager.beginTransaction();
    const restored = txManager.rollbackTransaction();

    expect(restored).toBe("before-tx");
    // Undo stack untouched
    expect(undoManager.getCurrent()).toBe("before-tx");
  });

  it("throws on nested beginTransaction", () => {
    txManager.beginTransaction();
    expect(() => txManager.beginTransaction()).toThrow(
      "nested transactions are not supported",
    );
    // Clean up
    txManager.rollbackTransaction();
  });

  it("throws on commit without active transaction", () => {
    expect(() => txManager.commitTransaction("x")).toThrow(
      "no active transaction to commit",
    );
  });

  it("throws on rollback without active transaction", () => {
    expect(() => txManager.rollbackTransaction()).toThrow(
      "no active transaction to rollback",
    );
  });

  it("isActive reflects transaction state", () => {
    expect(txManager.isActive).toBe(false);
    txManager.beginTransaction();
    expect(txManager.isActive).toBe(true);
    txManager.commitTransaction("done");
    expect(txManager.isActive).toBe(false);
  });
});

// ── Debounced snapshot ────────────────────────────────────

describe("createDebouncedSnapshot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces rapid calls into a single snapshot", () => {
    const manager = new UndoManager<string>();
    const debounced = createDebouncedSnapshot(manager, 200);

    debounced("a");
    debounced("b");
    debounced("c");

    // Nothing pushed yet
    expect(manager.getCurrent()).toBeNull();

    vi.advanceTimersByTime(200);

    // Only the last value pushed
    expect(manager.getCurrent()).toBe("c");
    expect(manager.undoStackSize).toBe(0); // only one snapshot total
  });

  it("pushes separate snapshots for calls spaced apart", () => {
    const manager = new UndoManager<string>();
    const debounced = createDebouncedSnapshot(manager, 100);

    debounced("first");
    vi.advanceTimersByTime(100);

    debounced("second");
    vi.advanceTimersByTime(100);

    expect(manager.getCurrent()).toBe("second");
    expect(manager.undoStackSize).toBe(1); // "first" on undo stack
  });
});

// ── Drag snapshot ─────────────────────────────────────────

describe("createDragSnapshot", () => {
  it("captures a single snapshot per drag operation", () => {
    const manager = new UndoManager<string>();
    manager.pushSnapshot("before-drag");

    const { onDragStart, onDragEnd } = createDragSnapshot(manager);

    onDragStart("before-drag");
    // Simulate many pixel-level moves (none of these push snapshots)
    onDragEnd("after-drag");

    expect(manager.getCurrent()).toBe("after-drag");

    // Undo should go back to before-drag
    const undone = manager.undo();
    expect(undone).toBe("before-drag");
  });

  it("does nothing if onDragEnd called without onDragStart", () => {
    const manager = new UndoManager<string>();
    const { onDragEnd } = createDragSnapshot(manager);

    onDragEnd("orphan");
    expect(manager.getCurrent()).toBeNull();
  });
});
