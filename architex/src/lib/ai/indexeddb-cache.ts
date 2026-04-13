// ── AI-002: IndexedDB-based AI Response Cache ────────────────────────
//
// Caches AI responses in IndexedDB with configurable TTL per entry
// and LRU eviction when the cache exceeds a maximum entry count.
//
// Uses the app's existing IDB wrapper (`@/lib/persistence/idb-store`).

import {
  openDB,
  put,
  get as idbGet,
  del,
  getAll,
} from '@/lib/persistence/idb-store';
import type { IDBHandle } from '@/lib/persistence/idb-store';

// ── Types ───────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}

// ── AIResponseCache ────────────────────────────────────────────────

export class AIResponseCache {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly maxEntries: number;
  private handle: IDBHandle | null = null;

  constructor(
    dbName = 'architex-ai-cache',
    storeName = 'responses',
    maxEntries = 500,
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.maxEntries = maxEntries;
  }

  // ── Lazy DB init ──────────────────────────────────────────────

  private async getHandle(): Promise<IDBHandle> {
    if (this.handle) return this.handle;
    this.handle = await openDB(this.dbName, 1, {
      stores: { [this.storeName]: 'key' },
    });
    return this.handle;
  }

  // ── Public API ────────────────────────────────────────────────

  /**
   * Retrieve a cached value by key.
   * Returns `null` for expired or missing entries (expired entries are
   * cleaned up automatically).
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const handle = await this.getHandle();
      const entry = await idbGet<CacheEntry<T>>(handle, this.storeName, key);
      if (!entry) return null;

      // Expired — remove and return null
      if (Date.now() > entry.expiresAt) {
        await del(handle, this.storeName, key);
        return null;
      }

      // Update last-accessed timestamp (fire-and-forget)
      const updated: CacheEntry<T> = { ...entry, lastAccessedAt: Date.now() };
      put(handle, this.storeName, updated).catch(() => {
        /* best effort */
      });

      return entry.value;
    } catch {
      return null;
    }
  }

  /**
   * Store a value with a TTL (in milliseconds).
   * If the cache exceeds `maxEntries`, the least-recently-accessed
   * entry is evicted.
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const handle = await this.getHandle();

      const entry: CacheEntry<T> = {
        key,
        value,
        expiresAt: Date.now() + ttlMs,
        lastAccessedAt: Date.now(),
      };

      await put(handle, this.storeName, entry);

      // Evict LRU if over limit
      const all = await getAll<CacheEntry>(handle, this.storeName);
      if (all.length > this.maxEntries) {
        // Sort ascending by lastAccessedAt — oldest first
        const sorted = all.sort(
          (a, b) => a.lastAccessedAt - b.lastAccessedAt,
        );
        const excess = sorted.length - this.maxEntries;
        for (let i = 0; i < excess; i++) {
          await del(handle, this.storeName, sorted[i].key);
        }
      }
    } catch {
      // IndexedDB unavailable (SSR / private browsing) — silently skip
    }
  }

  /**
   * Remove all expired entries. Returns the count of evicted entries.
   */
  async evictExpired(): Promise<number> {
    try {
      const handle = await this.getHandle();
      const all = await getAll<CacheEntry>(handle, this.storeName);
      const now = Date.now();
      let evicted = 0;

      for (const entry of all) {
        if (now > entry.expiresAt) {
          await del(handle, this.storeName, entry.key);
          evicted++;
        }
      }

      return evicted;
    } catch {
      return 0;
    }
  }

  /**
   * Clear the entire cache.
   */
  async clear(): Promise<void> {
    try {
      const handle = await this.getHandle();
      const all = await getAll<CacheEntry>(handle, this.storeName);
      for (const entry of all) {
        await del(handle, this.storeName, entry.key);
      }
    } catch {
      // silent
    }
  }

  /**
   * Total number of entries in the cache (including expired).
   */
  async getSize(): Promise<number> {
    try {
      const handle = await this.getHandle();
      const all = await getAll<CacheEntry>(handle, this.storeName);
      return all.length;
    } catch {
      return 0;
    }
  }
}
