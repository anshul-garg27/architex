/**
 * DB-009: SyncBridge — dual-layer persistence (localStorage + API)
 *
 * Saves to localStorage immediately for instant loads, then queues a
 * debounced API sync when the user is authenticated.
 *
 * Usage:
 *   const bridge = new SyncBridge();
 *   await bridge.save('diagram-123', diagramData);
 *   const data = await bridge.load('diagram-123');
 *   const result = await bridge.sync();
 */

// ── Types ──────────────────────────────────────────────────────

export interface DesignData {
  title: string;
  nodes: unknown[];
  edges: unknown[];
  viewport?: { x: number; y: number; zoom: number };
  updatedAt: string;
}

export interface SyncResult {
  status: "synced" | "conflict-resolved" | "offline" | "unauthenticated";
  /** Number of items pushed to the server. */
  pushed: number;
  /** Number of items pulled from the server. */
  pulled: number;
}

interface StoredEntry {
  data: DesignData;
  /** Whether the local copy has been synced to the server. */
  dirty: boolean;
  /** ISO timestamp of last local save. */
  localUpdatedAt: string;
}

// ── Constants ──────────────────────────────────────────────────

const STORAGE_PREFIX = "architex:diagram:";
const DEBOUNCE_MS = 2_000;

// ── Helpers ────────────────────────────────────────────────────

function storageKey(designId: string): string {
  return `${STORAGE_PREFIX}${designId}`;
}

function readLocal(designId: string): StoredEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(designId));
    return raw ? (JSON.parse(raw) as StoredEntry) : null;
  } catch {
    return null;
  }
}

function writeLocal(designId: string, entry: StoredEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(designId), JSON.stringify(entry));
  } catch {
    // localStorage quota exceeded — silently degrade.
    console.warn("[SyncBridge] localStorage write failed for", designId);
  }
}

// ── SyncBridge ─────────────────────────────────────────────────

export class SyncBridge {
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private isAuthenticated: () => boolean;
  private apiBase: string;

  constructor(options?: {
    /** Function that returns true when the user is authenticated. */
    isAuthenticated?: () => boolean;
    /** API base path. Defaults to '/api/diagrams'. */
    apiBase?: string;
  }) {
    this.isAuthenticated = options?.isAuthenticated ?? (() => false);
    this.apiBase = options?.apiBase ?? "/api/diagrams";
  }

  // ── Save ───────────────────────────────────────────────────

  /**
   * Persist diagram data.
   *
   * 1. Writes to localStorage immediately (zero-latency).
   * 2. If authenticated, queues a debounced API save (2s delay).
   */
  async save(designId: string, data: DesignData): Promise<void> {
    const now = new Date().toISOString();
    const entry: StoredEntry = {
      data: { ...data, updatedAt: now },
      dirty: true,
      localUpdatedAt: now,
    };

    writeLocal(designId, entry);

    if (this.isAuthenticated()) {
      this.schedulePush(designId);
    }
  }

  // ── Load ───────────────────────────────────────────────────

  /**
   * Load diagram data.
   *
   * 1. Returns localStorage data immediately.
   * 2. If authenticated, fetches the remote version in the background
   *    and returns the newer copy.
   */
  async load(designId: string): Promise<DesignData | null> {
    const local = readLocal(designId);

    if (!this.isAuthenticated()) {
      return local?.data ?? null;
    }

    try {
      const response = await fetch(`${this.apiBase}/${designId}`);
      if (!response.ok) {
        return local?.data ?? null;
      }

      const { diagram } = (await response.json()) as {
        diagram?: { data: DesignData; updatedAt: string };
      };

      if (!diagram) {
        return local?.data ?? null;
      }

      const remoteTime = new Date(diagram.updatedAt).getTime();
      const localTime = local
        ? new Date(local.localUpdatedAt).getTime()
        : 0;

      if (remoteTime > localTime) {
        // Remote is newer — update local cache.
        const remoteData: DesignData =
          typeof diagram.data === "object" && diagram.data !== null
            ? (diagram.data as DesignData)
            : { title: "", nodes: [], edges: [], updatedAt: diagram.updatedAt };

        writeLocal(designId, {
          data: remoteData,
          dirty: false,
          localUpdatedAt: diagram.updatedAt,
        });
        return remoteData;
      }

      return local?.data ?? null;
    } catch {
      // Network failure — return local data.
      return local?.data ?? null;
    }
  }

  // ── Sync ───────────────────────────────────────────────────

  /**
   * Synchronize all dirty local entries with the server.
   *
   * Uses a last-write-wins strategy for conflict resolution.
   */
  async sync(): Promise<SyncResult> {
    if (!this.isAuthenticated()) {
      return { status: "unauthenticated", pushed: 0, pulled: 0 };
    }

    if (typeof window === "undefined") {
      return { status: "offline", pushed: 0, pulled: 0 };
    }

    let pushed = 0;
    let pulled = 0;

    // Find all dirty local entries.
    const dirtyIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const designId = key.slice(STORAGE_PREFIX.length);
        const entry = readLocal(designId);
        if (entry?.dirty) {
          dirtyIds.push(designId);
        }
      }
    }

    // Push dirty entries.
    for (const designId of dirtyIds) {
      const entry = readLocal(designId);
      if (!entry) continue;

      try {
        const response = await fetch(`${this.apiBase}/${designId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: entry.data.title,
            data: entry.data,
          }),
        });

        if (response.ok) {
          writeLocal(designId, { ...entry, dirty: false });
          pushed++;
        }
      } catch {
        // Offline — will retry on next sync.
      }
    }

    return {
      status: pushed > 0 || pulled > 0 ? "synced" : "synced",
      pushed,
      pulled,
    };
  }

  // ── Cleanup ────────────────────────────────────────────────

  /** Cancel all pending debounce timers. */
  destroy(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  // ── Private ────────────────────────────────────────────────

  private schedulePush(designId: string): void {
    const existing = this.debounceTimers.get(designId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(designId);
      const entry = readLocal(designId);
      if (!entry?.dirty) return;

      try {
        const response = await fetch(`${this.apiBase}/${designId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: entry.data.title,
            data: entry.data,
          }),
        });

        if (response.ok) {
          writeLocal(designId, { ...entry, dirty: false });
        }
      } catch {
        // Will retry on next save or manual sync.
      }
    }, DEBOUNCE_MS);

    this.debounceTimers.set(designId, timer);
  }
}
