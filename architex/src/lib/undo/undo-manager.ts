// ── UndoManager ─────────────────────────────────────────────
// Snapshot-based undo/redo with configurable memory limits.

export interface UndoManagerOptions {
  /** Maximum number of snapshots kept in the undo stack (default 50). */
  maxEntries?: number;
  /** Rough memory cap in bytes (default 10 MB). */
  maxBytes?: number;
}

type Listener = () => void;

/** Estimate the byte size of a value via JSON serialisation length. */
function estimateBytes(value: unknown): number {
  try {
    return JSON.stringify(value).length * 2; // 2 bytes per char (UTF-16)
  } catch {
    return 0;
  }
}

export class UndoManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private currentSnapshot: T | null = null;
  private totalBytes = 0;
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private listeners: Set<Listener> = new Set();

  constructor(options: UndoManagerOptions = {}) {
    this.maxEntries = options.maxEntries ?? 50;
    this.maxBytes = options.maxBytes ?? 10 * 1024 * 1024; // 10 MB
  }

  // ── Public API ──────────────────────────────────────────

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoStackSize(): number {
    return this.undoStack.length;
  }

  get redoStackSize(): number {
    return this.redoStack.length;
  }

  /** Push a new snapshot. Clears the redo stack. */
  pushSnapshot(snapshot: T): void {
    if (this.currentSnapshot !== null) {
      this.undoStack.push(this.currentSnapshot);
      this.totalBytes += estimateBytes(this.currentSnapshot);
    }

    this.currentSnapshot = snapshot;
    this.redoStack = [];

    this.evict();
    this.notify();
  }

  /** Undo: move current to redo, pop undo into current. */
  undo(): T | null {
    if (this.undoStack.length === 0) return null;

    const previous = this.undoStack.pop()!;
    this.totalBytes -= estimateBytes(previous);

    if (this.currentSnapshot !== null) {
      this.redoStack.push(this.currentSnapshot);
    }

    this.currentSnapshot = previous;
    this.notify();
    return previous;
  }

  /** Redo: move current to undo, pop redo into current. */
  redo(): T | null {
    if (this.redoStack.length === 0) return null;

    const next = this.redoStack.pop()!;

    if (this.currentSnapshot !== null) {
      this.undoStack.push(this.currentSnapshot);
      this.totalBytes += estimateBytes(this.currentSnapshot);
    }

    this.currentSnapshot = next;
    this.evict();
    this.notify();
    return next;
  }

  /** Reset both stacks. */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentSnapshot = null;
    this.totalBytes = 0;
    this.notify();
  }

  /** Return the current snapshot (the latest pushed value). */
  getCurrent(): T | null {
    return this.currentSnapshot;
  }

  // ── Subscription (for React reactivity) ─────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Return an immutable snapshot of the stack state for useSyncExternalStore. */
  getStackState(): UndoRedoState {
    return {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoStackSize: this.undoStackSize,
      redoStackSize: this.redoStackSize,
    };
  }

  // ── Internals ───────────────────────────────────────────

  private evict(): void {
    // Entry cap
    while (this.undoStack.length > this.maxEntries) {
      const evicted = this.undoStack.shift()!;
      this.totalBytes -= estimateBytes(evicted);
    }

    // Memory cap
    while (this.totalBytes > this.maxBytes && this.undoStack.length > 0) {
      const evicted = this.undoStack.shift()!;
      this.totalBytes -= estimateBytes(evicted);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
}
