import type { Node, Edge } from "@xyflow/react";
import {
  openDB,
  put,
  getAll,
  get,
  del,
  type IDBHandle,
} from "@/lib/persistence/idb-store";
import { EventStore, type DiagramEvent } from "./event-types";

// ─────────────────────────────────────────────────────────────
// Version History Manager
// Stores diagram snapshots in IndexedDB with FIFO eviction.
// Enhanced with event-sourced versioning (INF-021):
//   - createSnapshot / restoreFromSnapshot
//   - auto-snapshot every 5 minutes when changes detected
// ─────────────────────────────────────────────────────────────

/** A single version entry stored in the history. */
export interface VersionEntry {
  id: string;
  timestamp: number;
  label: string;
  author: string;
  snapshot: {
    nodes: Node[];
    edges: Edge[];
  };
}

/** Configuration for the history manager. */
export interface HistoryManagerConfig {
  /** Max stored versions before FIFO eviction (default: 50). */
  maxVersions: number;
  /** Auto-save interval in milliseconds (default: 5 minutes). */
  autoSaveInterval: number;
  /** Default author name for entries. */
  defaultAuthor: string;
  /** Auto-snapshot interval in ms (default: 5 minutes). */
  autoSnapshotInterval: number;
}

const DEFAULT_CONFIG: HistoryManagerConfig = {
  maxVersions: 50,
  autoSaveInterval: 5 * 60 * 1000, // 5 minutes
  defaultAuthor: "user",
  autoSnapshotInterval: 5 * 60 * 1000, // 5 minutes
};

// ── IndexedDB Schema ──────────────────────────────────────────

const DB_NAME = "architex-version-history";
const DB_VERSION = 1;
const STORE_NAME = "versions";

// ── History Manager ───────────────────────────────────────────

export class HistoryManager {
  private config: HistoryManagerConfig;
  private handle: IDBHandle | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private autoSnapshotTimer: ReturnType<typeof setInterval> | null = null;
  private getCanvasState: (() => { nodes: Node[]; edges: Edge[] }) | null =
    null;

  /** Event store for fine-grained change tracking (INF-019/020). */
  readonly eventStore: EventStore = new EventStore();

  /**
   * Hash of the last auto-snapshot state to detect changes.
   * We use a simple node+edge count + position fingerprint.
   */
  private lastSnapshotHash: string = "";

  constructor(config?: Partial<HistoryManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Database ──────────────────────────────────────────────

  /** Open the IndexedDB connection. Must be called before other operations. */
  async init(): Promise<void> {
    if (this.handle) return;
    this.handle = await openDB(DB_NAME, DB_VERSION, {
      stores: { [STORE_NAME]: "id" },
    });
  }

  /** Close the database and stop all timers. */
  dispose(): void {
    this.stopAutoSave();
    this.stopAutoSnapshot();
    if (this.handle) {
      this.handle.close();
      this.handle = null;
    }
  }

  private ensureHandle(): IDBHandle {
    if (!this.handle) {
      throw new Error(
        "HistoryManager not initialised. Call init() before using.",
      );
    }
    return this.handle;
  }

  // ── CRUD ──────────────────────────────────────────────────

  /**
   * Save a new version snapshot with the given label.
   * Performs FIFO eviction if max versions exceeded.
   */
  async save(
    label: string,
    nodes: Node[],
    edges: Edge[],
    author?: string,
  ): Promise<VersionEntry> {
    const handle = this.ensureHandle();

    const entry: VersionEntry = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      label,
      author: author ?? this.config.defaultAuthor,
      snapshot: {
        // Deep clone to avoid stale references
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    };

    await put(handle, STORE_NAME, entry);

    // Enforce FIFO eviction
    await this.evict();

    return entry;
  }

  /** Return all version entries, sorted by timestamp ascending. */
  async list(): Promise<VersionEntry[]> {
    const handle = this.ensureHandle();
    const entries = await getAll<VersionEntry>(handle, STORE_NAME);
    return entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Get a specific version by ID. */
  async getVersion(id: string): Promise<VersionEntry | undefined> {
    const handle = this.ensureHandle();
    return get<VersionEntry>(handle, STORE_NAME, id);
  }

  /**
   * Restore a version by ID, returning deep-cloned nodes and edges.
   * Returns `null` if the version does not exist.
   */
  async restore(
    id: string,
  ): Promise<{ nodes: Node[]; edges: Edge[] } | null> {
    const entry = await this.getVersion(id);
    if (!entry) return null;

    return {
      nodes: JSON.parse(JSON.stringify(entry.snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(entry.snapshot.edges)),
    };
  }

  /** Delete a specific version by ID. */
  async deleteVersion(id: string): Promise<void> {
    const handle = this.ensureHandle();
    await del(handle, STORE_NAME, id);
  }

  // ── Diff ──────────────────────────────────────────────────

  /**
   * Compute a structural diff between two stored versions.
   * Delegates to the `diffDiagrams` function from the diff engine.
   *
   * Returns `null` if either version ID is not found.
   */
  async diff(
    id1: string,
    id2: string,
  ): Promise<import("./diff-engine").DiagramDiff | null> {
    const [v1, v2] = await Promise.all([
      this.getVersion(id1),
      this.getVersion(id2),
    ]);
    if (!v1 || !v2) return null;

    // Lazy import to avoid circular dependency issues at module level
    const { diffDiagrams } = await import("./diff-engine");
    return diffDiagrams(v1.snapshot, v2.snapshot);
  }

  // ── Auto-Save ─────────────────────────────────────────────

  /**
   * Start auto-saving at the configured interval.
   *
   * @param getState - Function that returns the current canvas state.
   */
  startAutoSave(getState: () => { nodes: Node[]; edges: Edge[] }): void {
    this.getCanvasState = getState;
    this.stopAutoSave(); // Clear any existing timer

    this.autoSaveTimer = setInterval(async () => {
      if (!this.getCanvasState) return;
      const { nodes, edges } = this.getCanvasState();
      // Only auto-save if there is content on the canvas
      if (nodes.length === 0) return;
      try {
        await this.save(
          `Auto-save ${new Date().toLocaleTimeString()}`,
          nodes,
          edges,
          "auto",
        );
      } catch {
        // Silently ignore auto-save failures
      }
    }, this.config.autoSaveInterval);
  }

  /** Stop the auto-save timer. */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.getCanvasState = null;
  }

  // ── Snapshots (INF-021) ──────────────────────────────────

  /**
   * Create a named snapshot of the given (or current) canvas state.
   * Returns the snapshot's version entry ID.
   */
  async createSnapshot(
    state: { nodes: Node[]; edges: Edge[] },
    label?: string,
  ): Promise<string> {
    const snapshotLabel =
      label ?? `Snapshot ${new Date().toLocaleTimeString()}`;
    const entry = await this.save(
      snapshotLabel,
      state.nodes,
      state.edges,
      "snapshot",
    );
    return entry.id;
  }

  /**
   * Restore canvas state from a stored snapshot by its version ID.
   * Returns the deserialized nodes and edges, or `null` if the
   * snapshot does not exist.
   */
  async restoreFromSnapshot(
    id: string,
  ): Promise<{ nodes: Node[]; edges: Edge[] } | null> {
    return this.restore(id);
  }

  // ── Auto-Snapshot (INF-021) ──────────────────────────────

  /**
   * Compute a lightweight fingerprint of the canvas state for
   * change detection. Uses node/edge count + first few positions.
   */
  private computeStateHash(nodes: Node[], edges: Edge[]): string {
    const nodePart = nodes
      .slice(0, 20)
      .map((n) => `${n.id}:${n.position.x},${n.position.y}`)
      .join("|");
    return `${nodes.length}:${edges.length}#${nodePart}`;
  }

  /**
   * Start auto-snapshotting every `autoSnapshotInterval` ms.
   * Only creates a snapshot when changes are detected since the
   * last snapshot.
   */
  startAutoSnapshot(
    getState: () => { nodes: Node[]; edges: Edge[] },
  ): void {
    this.stopAutoSnapshot();

    // Capture initial hash so the first interval detects a delta
    const initial = getState();
    this.lastSnapshotHash = this.computeStateHash(
      initial.nodes,
      initial.edges,
    );

    this.autoSnapshotTimer = setInterval(async () => {
      const { nodes, edges } = getState();
      if (nodes.length === 0) return;

      const hash = this.computeStateHash(nodes, edges);
      if (hash === this.lastSnapshotHash) return; // no changes

      this.lastSnapshotHash = hash;
      try {
        await this.createSnapshot(
          { nodes, edges },
          `Auto-snapshot ${new Date().toLocaleTimeString()}`,
        );
      } catch {
        // Silently ignore auto-snapshot failures
      }
    }, this.config.autoSnapshotInterval);
  }

  /** Stop the auto-snapshot timer. */
  stopAutoSnapshot(): void {
    if (this.autoSnapshotTimer !== null) {
      clearInterval(this.autoSnapshotTimer);
      this.autoSnapshotTimer = null;
    }
  }

  // ── Eviction ──────────────────────────────────────────────

  /** Remove oldest entries beyond the max limit (FIFO). */
  private async evict(): Promise<void> {
    const entries = await this.list();
    if (entries.length <= this.config.maxVersions) return;

    const toRemove = entries.slice(
      0,
      entries.length - this.config.maxVersions,
    );
    for (const entry of toRemove) {
      await this.deleteVersion(entry.id);
    }
  }
}
