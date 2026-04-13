// ─────────────────────────────────────────────────────────────
// FND-040 — Auto-Save Manager
// Debounced, dirty-flag-driven auto-save with status tracking.
// ─────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutoSaveOptions<T> {
  /** Milliseconds to wait after the last `markDirty` call before saving. */
  debounceMs: number;
  /** Async callback that performs the actual persistence write. */
  onSave: (data: T) => Promise<void>;
  /** Called whenever the save status changes. */
  onStatusChange?: (status: SaveStatus) => void;
  /** Returns the data snapshot to persist. */
  getData: () => T;
}

export interface AutoSaveHandle {
  /** Mark the data as dirty — a save will be scheduled after the debounce window. */
  markDirty: () => void;
  /** Immediately flush pending changes (bypasses debounce). */
  forceSave: () => Promise<void>;
  /** Current save status. */
  getStatus: () => SaveStatus;
  /** Whether there are unsaved changes. */
  isDirty: () => boolean;
  /** Tear down timers. Call when unmounting. */
  dispose: () => void;
}

export function createAutoSave<T>(options: AutoSaveOptions<T>): AutoSaveHandle {
  const { debounceMs, onSave, onStatusChange, getData } = options;

  let dirty = false;
  let status: SaveStatus = "idle";
  let timer: ReturnType<typeof setTimeout> | null = null;

  function setStatus(next: SaveStatus) {
    status = next;
    onStatusChange?.(next);
  }

  async function doSave(): Promise<void> {
    if (!dirty) return;
    dirty = false;
    setStatus("saving");
    try {
      await onSave(getData());
      setStatus("saved");
    } catch {
      // Re-mark dirty so the next attempt retries
      dirty = true;
      setStatus("error");
    }
  }

  function scheduleFlush() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void doSave();
    }, debounceMs);
  }

  function markDirty() {
    dirty = true;
    scheduleFlush();
  }

  async function forceSave(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    dirty = true; // ensure doSave actually fires
    await doSave();
  }

  function dispose() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    markDirty,
    forceSave,
    getStatus: () => status,
    isDirty: () => dirty,
    dispose,
  };
}
