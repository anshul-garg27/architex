/**
 * Database Design Lab — LSM-Tree Visualization (DBL-024, DBL-071, DBL-072)
 *
 * Interactive LSM-Tree with step-by-step write, flush, compact, and read
 * operations. Records each stage as an LSMVizStep for animated playback.
 *
 * Pipeline:
 * - Write -> WAL (durability) -> Memtable (sorted, in-memory)
 * - Memtable full -> Flush to L0 SSTable (+ populate bloom filter) -> Clear WAL
 * - L0 has too many SSTables -> Compact (merge sort) into L1
 * - L1 too large -> Compact into L2
 * - Read: check Memtable -> L0 (bloom filter check first, newest first) -> L1 -> L2
 */

// ── Types ──────────────────────────────────────────────────────

export interface LSMLevel {
  level: number;
  sstables: Array<{
    id: string;
    keys: string[];
    sizeKB: number;
    /** Simplified bloom filter — real ones use bit arrays, but Set<string> illustrates the concept. */
    bloomFilter: Set<string>;
  }>;
}

export interface LSMVizState {
  memtable: string[];
  immutableMemtable: string[] | null;
  levels: LSMLevel[];
  writeCount: number;
  /** Write-Ahead Log entries — every write lands here FIRST for crash durability. */
  wal: string[];
  /** Whether bloom filter optimization is enabled for reads. */
  bloomEnabled: boolean;
}

export interface LSMVizStep {
  description: string;
  state: LSMVizState;
  operation: "write" | "flush" | "compact" | "read" | "checkpoint";
  highlightLevel?: number;
  /** SSTable IDs skipped by bloom filter during a read (for canvas highlighting). */
  bloomSkipped?: string[];
  /** SSTable IDs checked (bloom said "maybe") during a read. */
  bloomChecked?: string[];
  /** Whether this step involves WAL activity (for canvas highlighting). */
  walActive?: boolean;
}

// ── Deep-clone helpers ─────────────────────────────────────────

function cloneLevel(level: LSMLevel): LSMLevel {
  return {
    level: level.level,
    sstables: level.sstables.map((sst) => ({
      id: sst.id,
      keys: [...sst.keys],
      sizeKB: sst.sizeKB,
      bloomFilter: new Set(sst.bloomFilter),
    })),
  };
}

function cloneState(state: LSMVizState): LSMVizState {
  return {
    memtable: [...state.memtable],
    immutableMemtable: state.immutableMemtable
      ? [...state.immutableMemtable]
      : null,
    levels: state.levels.map(cloneLevel),
    writeCount: state.writeCount,
    wal: [...state.wal],
    bloomEnabled: state.bloomEnabled,
  };
}

// ── Constants ──────────────────────────────────────────────────

const DEFAULT_MEMTABLE_CAPACITY = 4;
const DEFAULT_LEVEL_RATIO = 4;
const MAX_L0_SSTABLES = 4;

// ── LSMTreeViz ─────────────────────────────────────────────────

/**
 * Interactive LSM-Tree that models the write-ahead, flush, and
 * compaction pipeline. Every operation returns an array of
 * {@link LSMVizStep} objects for animated, step-by-step playback.
 *
 * Data flow: Write -> Memtable -> Flush to L0 SSTable -> Compact into
 * deeper levels. Reads search from newest to oldest data.
 *
 * @example
 * const lsm = new LSMTreeViz(4);
 * lsm.write("user:1", "Alice");
 * lsm.write("user:2", "Bob");
 * const state = lsm.getState();
 * console.log(state.memtable); // ["user:1=Alice", "user:2=Bob"]
 */
export class LSMTreeViz {
  private memtable: string[];
  private immutableMemtable: string[] | null;
  private levels: LSMLevel[];
  private writeCount: number;
  private memtableCapacity: number;
  private levelRatio: number;
  private idCounter = 0;
  /** Write-Ahead Log — every write goes here FIRST for crash durability. */
  private wal: string[];
  /** Whether bloom filter optimization is enabled for reads. */
  private _bloomEnabled = true;

  /** Generate a unique SSTable ID scoped to this instance. */
  private nextId(): string {
    return `sst-${++this.idCounter}`;
  }

  /**
   * Create a new LSM-Tree with configurable memtable size and level ratio.
   *
   * @param memtableCapacity - Max entries before the memtable is flushed
   *   to an L0 SSTable (default 4)
   * @param levelRatio - Size multiplier between adjacent levels; controls
   *   when cascading compaction triggers (default 4)
   */
  constructor(memtableCapacity?: number, levelRatio?: number) {
    this.memtableCapacity = memtableCapacity ?? DEFAULT_MEMTABLE_CAPACITY;
    this.levelRatio = levelRatio ?? DEFAULT_LEVEL_RATIO;
    this.memtable = [];
    this.immutableMemtable = null;
    this.levels = [
      { level: 0, sstables: [] },
      { level: 1, sstables: [] },
      { level: 2, sstables: [] },
    ];
    this.writeCount = 0;
    this.wal = [];
  }

  /** Get whether bloom filter is currently enabled. */
  get bloomEnabled(): boolean {
    return this._bloomEnabled;
  }

  /** Toggle bloom filter on or off. */
  setBloomEnabled(enabled: boolean): void {
    this._bloomEnabled = enabled;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Write a key-value pair to the memtable. If the memtable reaches
   * capacity, an automatic flush (and possibly compaction) is triggered.
   * Overwrites are handled in-place without incrementing writeCount.
   *
   * @param key - The key to write (e.g., "user:1")
   * @param value - The value to associate (e.g., "Alice")
   * @returns Steps covering the write, and any triggered flush/compaction
   *
   * @example
   * const steps = lsm.write("score", "100");
   * // steps[0].description: 'Wrote "score=100" to memtable (1/4 entries)'
   */
  write(key: string, value: string): LSMVizStep[] {
    const steps: LSMVizStep[] = [];
    const entry = `${key}=${value}`;

    // Step 1: Write to WAL FIRST — ensures durability before touching memtable
    this.wal.push(entry);
    steps.push({
      description: `Writing "${entry}" to WAL first — this ensures durability. If the system crashes before the memtable is flushed, the WAL can replay these writes.`,
      state: this.snapshot(),
      operation: "write",
      walActive: true,
    });

    // Step 2: Add to memtable (sorted insert)
    const existing = this.memtable.findIndex((e) => e.split("=")[0] === key);
    if (existing !== -1) {
      this.memtable[existing] = entry;
      steps.push({
        description: `Updated key "${key}" in memtable (overwrite) — writes always go to the in-memory memtable first because sequential memory writes are much faster than random disk I/O. Since this key already exists, we overwrite it in place.`,
        state: this.snapshot(),
        operation: "write",
      });
    } else {
      this.memtable.push(entry);
      this.memtable.sort((a, b) => a.split("=")[0].localeCompare(b.split("=")[0]));
      this.writeCount++;
      steps.push({
        description: `Wrote "${key}=${value}" to memtable (${this.memtable.length}/${this.memtableCapacity} entries) — writes go to the in-memory memtable first because sequential memory writes are much faster than random disk I/O. The memtable keeps entries sorted so they can be flushed as a sorted SSTable later.`,
        state: this.snapshot(),
        operation: "write",
      });
    }

    // Step 3: If memtable is full, trigger flush
    if (this.memtable.length >= this.memtableCapacity) {
      const flushSteps = this.flush();
      steps.push(...flushSteps);
    }

    return steps;
  }

  /**
   * Read a key by searching from newest to oldest data:
   * memtable -> immutable memtable -> L0 (newest first) -> L1 -> L2.
   * Each location checked is recorded as a step so the UI can animate
   * the read path.
   *
   * @param key - The key to look up (without the "=value" suffix)
   * @returns Steps describing each level searched and the final outcome
   */
  read(key: string): LSMVizStep[] {
    const steps: LSMVizStep[] = [];

    // Check memtable
    const memEntry = this.memtable.find((e) => e.split("=")[0] === key);
    if (memEntry) {
      steps.push({
        description: `Found "${memEntry}" in active memtable — the memtable is checked first because it holds the most recent writes, so any value here is guaranteed to be the latest version`,
        state: this.snapshot(),
        operation: "read",
      });
      return steps;
    }
    steps.push({
      description: `Key "${key}" not in memtable — checking immutable memtable next. We search from newest to oldest data because newer writes may overwrite older ones.`,
      state: this.snapshot(),
      operation: "read",
    });

    // Check immutable memtable
    if (this.immutableMemtable) {
      const immEntry = this.immutableMemtable.find(
        (e) => e.split("=")[0] === key,
      );
      if (immEntry) {
        steps.push({
          description: `Found "${immEntry}" in immutable memtable — this memtable is frozen (being flushed to disk) but still holds recent data that hasn't reached an SSTable yet`,
          state: this.snapshot(),
          operation: "read",
        });
        return steps;
      }
      steps.push({
        description: `Key "${key}" not in immutable memtable — checking L0 SSTables next. L0 is searched before deeper levels because it contains the most recently flushed data.`,
        state: this.snapshot(),
        operation: "read",
      });
    }

    // Check each level (L0 newest-first, then L1, L2)
    const bloomSkippedAccum: string[] = [];
    const bloomCheckedAccum: string[] = [];

    for (const level of this.levels) {
      const tablesInOrder =
        level.level === 0
          ? [...level.sstables].reverse() // newest first for L0
          : level.sstables;

      for (const sst of tablesInOrder) {
        // Bloom filter check — skip SSTables that definitely don't contain the key
        if (this._bloomEnabled && !sst.bloomFilter.has(key)) {
          bloomSkippedAccum.push(sst.id);
          steps.push({
            description: `Bloom filter says key "${key}" is DEFINITELY NOT in SSTable ${sst.id} — skipping. This avoids an expensive disk read.`,
            state: this.snapshot(),
            operation: "read",
            highlightLevel: level.level,
            bloomSkipped: [...bloomSkippedAccum],
            bloomChecked: [...bloomCheckedAccum],
          });
          continue;
        }

        if (this._bloomEnabled && sst.bloomFilter.has(key)) {
          bloomCheckedAccum.push(sst.id);
          steps.push({
            description: `Bloom filter says key "${key}" MIGHT be in SSTable ${sst.id} — checking...`,
            state: this.snapshot(),
            operation: "read",
            highlightLevel: level.level,
            bloomSkipped: [...bloomSkippedAccum],
            bloomChecked: [...bloomCheckedAccum],
          });
        }

        if (sst.keys.includes(key)) {
          const searchOrder = level.level === 0 ? " (newest first, since L0 SSTables can have overlapping key ranges)" : "";
          steps.push({
            description: `Found key "${key}" in L${level.level} SSTable ${sst.id}${searchOrder} — this is the most recent version of the key since we search from newest to oldest data`,
            state: this.snapshot(),
            operation: "read",
            highlightLevel: level.level,
            bloomSkipped: [...bloomSkippedAccum],
            bloomChecked: [...bloomCheckedAccum],
          });
          return steps;
        }
      }

      const nextLevel = level.level + 1;
      const nextLevelHint = nextLevel < this.levels.length
        ? ` — continuing to L${nextLevel} which contains older, compacted data`
        : "";
      steps.push({
        description: `Key "${key}" not found in L${level.level} (searched ${tablesInOrder.length} SSTable(s))${nextLevelHint}`,
        state: this.snapshot(),
        operation: "read",
        highlightLevel: level.level,
        bloomSkipped: [...bloomSkippedAccum],
        bloomChecked: [...bloomCheckedAccum],
      });
    }

    steps.push({
      description: `Key "${key}" not found in any level — we searched memtable, immutable memtable, and all SSTable levels from newest to oldest. The key was never written or has been removed.`,
      state: this.snapshot(),
      operation: "read",
      bloomSkipped: [...bloomSkippedAccum],
      bloomChecked: [...bloomCheckedAccum],
    });

    return steps;
  }

  /**
   * Flush the current memtable to L0 as a new SSTable. The memtable is
   * first frozen as an immutable memtable (still serving reads), then
   * written to L0. If L0 accumulates too many SSTables, compaction
   * into L1 is triggered automatically.
   *
   * @returns Steps describing the freeze, flush, and any triggered compaction.
   *   Returns a single "nothing to flush" step if the memtable is empty.
   */
  flush(): LSMVizStep[] {
    const steps: LSMVizStep[] = [];

    if (this.memtable.length === 0) {
      steps.push({
        description: "Memtable is empty — nothing to flush. A flush only happens when the memtable reaches capacity.",
        state: this.snapshot(),
        operation: "flush",
      });
      return steps;
    }

    // Move memtable to immutable
    const flushedEntryCount = this.memtable.length;
    this.immutableMemtable = [...this.memtable];
    this.memtable = [];

    steps.push({
      description: `The memtable reached capacity (${flushedEntryCount} entries), so we freeze it as immutable and create a fresh empty memtable. The frozen memtable can still serve reads while it's being flushed to disk.`,
      state: this.snapshot(),
      operation: "flush",
    });

    // Flush immutable to L0 — populate bloom filter with all keys
    const keys = this.immutableMemtable.map((e) => e.split("=")[0]);
    const bloomFilter = new Set(keys);
    const newSSTable = {
      id: this.nextId(),
      keys,
      sizeKB: keys.length * 4,
      bloomFilter,
    };
    this.levels[0].sstables.push(newSSTable);
    this.immutableMemtable = null;

    steps.push({
      description: `Flushed the frozen memtable to L0 as SSTable ${newSSTable.id} (keys: ${keys.join(", ")}) — the sorted contents are written sequentially to disk, which is fast because it avoids random I/O. L0 receives all flushes directly. A bloom filter was built with ${keys.length} key(s) for fast read lookups.`,
      state: this.snapshot(),
      operation: "flush",
      highlightLevel: 0,
    });

    // Clear WAL entries that correspond to flushed data
    const flushedKeySet = new Set(keys);
    this.wal = this.wal.filter((entry) => {
      const k = entry.split("=")[0];
      return !flushedKeySet.has(k);
    });

    steps.push({
      description: `WAL entries for flushed data can now be discarded — the SSTable on disk is the permanent record. ${flushedKeySet.size} WAL entry/entries cleared.`,
      state: this.snapshot(),
      operation: "flush",
      walActive: true,
    });

    // Check if L0 needs compaction
    if (this.levels[0].sstables.length >= MAX_L0_SSTABLES) {
      steps.push({
        description: `L0 now has ${this.levels[0].sstables.length} SSTables (max ${MAX_L0_SSTABLES}) — compacting because too many L0 SSTables increases read amplification, since every read must check each L0 file. Merging them into L1 reduces the number of files to search.`,
        state: this.snapshot(),
        operation: "compact",
        highlightLevel: 0,
      });
      const compactSteps = this.compact(0);
      steps.push(...compactSteps);
    }

    return steps;
  }

  /**
   * Compact all SSTables from the given level into the next deeper level
   * using merge sort. Duplicate keys are deduplicated (source level wins
   * because its data is newer). May cascade compaction to even deeper
   * levels if the target exceeds its size limit.
   *
   * @param level - The source level to compact (0-based). Must be less
   *   than the deepest level.
   * @returns Steps describing the merge-sort and resulting SSTable layout
   */
  compact(level: number): LSMVizStep[] {
    const steps: LSMVizStep[] = [];
    const targetLevel = level + 1;

    if (level >= this.levels.length - 1) {
      steps.push({
        description: `Cannot compact L${level} — this is the deepest level, so there is no level below to merge into`,
        state: this.snapshot(),
        operation: "compact",
      });
      return steps;
    }

    const sourceLevel = this.levels[level];
    const destLevel = this.levels[targetLevel];

    if (sourceLevel.sstables.length === 0) {
      steps.push({
        description: `L${level} has no SSTables — nothing to compact. Compaction only triggers when a level accumulates too many files.`,
        state: this.snapshot(),
        operation: "compact",
      });
      return steps;
    }

    // Merge all source keys + existing dest keys
    const allSourceKeys: string[] = [];
    for (const sst of sourceLevel.sstables) {
      allSourceKeys.push(...sst.keys);
    }
    const allDestKeys: string[] = [];
    for (const sst of destLevel.sstables) {
      allDestKeys.push(...sst.keys);
    }

    // Merge sort (deduplicate -- source keys are newer)
    const mergedSet = new Set([...allSourceKeys, ...allDestKeys]);
    const mergedKeys = [...mergedSet].sort((a, b) => a.localeCompare(b));

    steps.push({
      description: `Merge-sorting ${allSourceKeys.length} key(s) from L${level} with ${allDestKeys.length} key(s) in L${targetLevel} — we combine all keys and sort them so the resulting SSTables have non-overlapping, ordered key ranges. Duplicate keys are deduplicated (newer values win).`,
      state: this.snapshot(),
      operation: "compact",
      highlightLevel: level,
    });

    // Clear source level and replace destination with merged SSTable(s)
    const sourceCount = sourceLevel.sstables.length;
    const destCount = destLevel.sstables.length;
    sourceLevel.sstables = [];

    // Split merged keys into SSTables of ~memtableCapacity keys each
    const sstableSize = this.memtableCapacity;
    destLevel.sstables = [];
    for (let i = 0; i < mergedKeys.length; i += sstableSize) {
      const chunk = mergedKeys.slice(i, i + sstableSize);
      destLevel.sstables.push({
        id: this.nextId(),
        keys: chunk,
        sizeKB: chunk.length * 4,
        bloomFilter: new Set(chunk),
      });
    }

    steps.push({
      description: `Compacted ${sourceCount} L${level} + ${destCount} L${targetLevel} SSTable(s) into ${destLevel.sstables.length} new L${targetLevel} SSTable(s) (${mergedKeys.length} unique keys) — L${level} is now empty and L${targetLevel} has fewer, larger SSTables. This reduces read amplification because future reads check fewer files.`,
      state: this.snapshot(),
      operation: "compact",
      highlightLevel: targetLevel,
    });

    // Check if target level is now too large (cascade compaction)
    const maxSStablesForTarget = MAX_L0_SSTABLES * Math.pow(this.levelRatio, targetLevel);
    if (
      destLevel.sstables.length > maxSStablesForTarget &&
      targetLevel < this.levels.length - 1
    ) {
      steps.push({
        description: `L${targetLevel} now has ${destLevel.sstables.length} SSTables (max ${Math.floor(maxSStablesForTarget)}) — the merge pushed too many files into this level, so we cascade compaction to L${targetLevel + 1}. Each deeper level is ${this.levelRatio}x larger, giving the tree its characteristic exponential shape.`,
        state: this.snapshot(),
        operation: "compact",
        highlightLevel: targetLevel,
      });
      const cascadeSteps = this.compact(targetLevel);
      steps.push(...cascadeSteps);
    }

    return steps;
  }

  /**
   * Checkpoint: explicitly clear all WAL entries up to this point.
   * Called when all current data has been safely flushed to SSTables.
   *
   * @returns Steps describing the checkpoint operation
   */
  checkpoint(): LSMVizStep[] {
    const steps: LSMVizStep[] = [];
    const walCount = this.wal.length;

    if (walCount === 0) {
      steps.push({
        description: "Checkpoint: WAL is already empty — nothing to truncate.",
        state: this.snapshot(),
        operation: "checkpoint",
        walActive: true,
      });
      return steps;
    }

    this.wal = [];
    steps.push({
      description: `Checkpoint: all ${walCount} WAL entries up to this point have been flushed to SSTables. The WAL can be truncated. This reclaims disk space and speeds up crash recovery (less log to replay).`,
      state: this.snapshot(),
      operation: "checkpoint",
      walActive: true,
    });

    return steps;
  }

  /**
   * Return a deep-cloned snapshot of the entire LSM-Tree state,
   * including memtable contents, immutable memtable, WAL, and all levels.
   *
   * @returns A deep copy of {@link LSMVizState} safe for serialization
   */
  getState(): LSMVizState {
    return this.snapshot();
  }

  /**
   * Reset to an empty LSM-Tree with fresh memtable, WAL, and empty levels.
   * Preserves the configured memtableCapacity and levelRatio. The ID
   * counter continues from its current value to avoid ID reuse.
   */
  reset(): void {
    this.memtable = [];
    this.immutableMemtable = null;
    this.levels = [
      { level: 0, sstables: [] },
      { level: 1, sstables: [] },
      { level: 2, sstables: [] },
    ];
    this.writeCount = 0;
    this.wal = [];
  }

  // ── Private helpers ──────────────────────────────────────────

  private snapshot(): LSMVizState {
    return cloneState({
      memtable: this.memtable,
      immutableMemtable: this.immutableMemtable,
      levels: this.levels,
      writeCount: this.writeCount,
      wal: this.wal,
      bloomEnabled: this._bloomEnabled,
    });
  }
}
