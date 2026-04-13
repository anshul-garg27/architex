/**
 * Database Design Lab — Hash Index Visualization (DBL-020)
 *
 * Interactive hash table with step-by-step insert, search, and delete operations.
 * Records each hash computation, bucket selection, collision, and resize
 * as a HashIndexStep for animated playback.
 */

// ── Types ──────────────────────────────────────────────────────

export interface HashBucket {
  index: number;
  entries: Array<{ key: string; value: string }>;
  overflow?: HashBucket;
}

export interface HashIndexState {
  buckets: HashBucket[];
  size: number;
  loadFactor: number;
}

export interface HashIndexStep {
  description: string;
  state: HashIndexState;
  highlightBucket?: number;
  highlightKey?: string;
  operation: "hash" | "insert" | "search" | "collision" | "resize" | "delete";
}

// ── Helpers ────────────────────────────────────────────────────

/** Simple string hash (djb2). Returns a positive integer. */
function djb2Hash(key: string): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deep-clone a bucket (including overflow chain). */
function cloneBucket(bucket: HashBucket): HashBucket {
  return {
    index: bucket.index,
    entries: bucket.entries.map((e) => ({ ...e })),
    overflow: bucket.overflow ? cloneBucket(bucket.overflow) : undefined,
  };
}

/** Deep-clone the full bucket array. */
function cloneBuckets(buckets: HashBucket[]): HashBucket[] {
  return buckets.map(cloneBucket);
}

/** Max entries allowed per bucket before overflow is created. */
const BUCKET_CAPACITY = 3;

/** Default initial bucket count. */
const DEFAULT_BUCKET_COUNT = 4;

/** Load factor threshold that triggers a resize. */
const LOAD_FACTOR_THRESHOLD = 0.75;

// ── HashIndexViz ───────────────────────────────────────────────

/**
 * Interactive hash table that records every hash computation, bucket
 * selection, collision, and resize as a {@link HashIndexStep} for
 * animated playback. Uses chaining (overflow buckets) for collision
 * resolution and doubles bucket count when load factor exceeds 0.75.
 *
 * @example
 * const idx = new HashIndexViz(4);
 * idx.insert("alice", "100");
 * const steps = idx.search("alice");
 * // steps[0] shows the hash computation
 * // steps[1] shows the found entry
 */
export class HashIndexViz {
  private buckets: HashBucket[];
  private bucketCount: number;
  private totalEntries: number;

  /**
   * Create a new hash index with the given number of initial buckets.
   *
   * @param bucketCount - Initial number of hash buckets (default 4).
   *   The table will dynamically resize when load factor exceeds 0.75.
   */
  constructor(bucketCount?: number) {
    this.bucketCount = bucketCount ?? DEFAULT_BUCKET_COUNT;
    this.buckets = this.createEmptyBuckets(this.bucketCount);
    this.totalEntries = 0;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Insert a key-value pair (or update an existing key) into the hash table.
   * Steps include: hash computation, collision detection, insertion, and
   * optional resize if the load factor exceeds the threshold.
   *
   * @param key - The string key to insert
   * @param value - The string value to associate with the key
   * @returns Steps describing the hash, any collision, and the final insertion
   */
  insert(key: string, value: string): HashIndexStep[] {
    const steps: HashIndexStep[] = [];

    // Step 1: compute hash
    const rawHash = djb2Hash(key);
    const bucketIdx = rawHash % this.bucketCount;

    steps.push({
      description: `Hash("${key}") = ${rawHash} mod ${this.bucketCount} = bucket ${bucketIdx}`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "hash",
    });

    // Step 2: check for existing key (update) or find insertion point
    const bucket = this.buckets[bucketIdx];
    const existingEntry = this.findEntryInChain(bucket, key);

    if (existingEntry) {
      // Update existing
      existingEntry.value = value;
      steps.push({
        description: `Key "${key}" already exists -- updated value to "${value}"`,
        state: this.snapshot(),
        highlightBucket: bucketIdx,
        highlightKey: key,
        operation: "insert",
      });
      return steps;
    }

    // Step 3: check for collision
    if (bucket.entries.length > 0) {
      steps.push({
        description: `Collision at bucket ${bucketIdx} -- bucket has ${this.chainLength(bucket)} existing entry(ies)`,
        state: this.snapshot(),
        highlightBucket: bucketIdx,
        highlightKey: key,
        operation: "collision",
      });
    }

    // Step 4: insert into bucket (or overflow)
    this.insertIntoBucket(bucket, key, value);
    this.totalEntries++;

    steps.push({
      description: `Inserted ("${key}", "${value}") into bucket ${bucketIdx}`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "insert",
    });

    // Step 5: check load factor and resize if needed
    const loadFactor = this.totalEntries / this.bucketCount;
    if (loadFactor > LOAD_FACTOR_THRESHOLD) {
      const oldCount = this.bucketCount;
      this.resize();
      steps.push({
        description: `Load factor ${loadFactor.toFixed(2)} > ${LOAD_FACTOR_THRESHOLD} -- resized from ${oldCount} to ${this.bucketCount} buckets`,
        state: this.snapshot(),
        highlightKey: key,
        operation: "resize",
      });
    }

    return steps;
  }

  /**
   * Search for a key by hashing it to a bucket and walking the overflow
   * chain. Steps show each bucket and overflow node visited.
   *
   * @param key - The string key to look up
   * @returns Steps describing the hash, chain traversal, and outcome
   *   (found with value, or not found)
   */
  search(key: string): HashIndexStep[] {
    const steps: HashIndexStep[] = [];

    const rawHash = djb2Hash(key);
    const bucketIdx = rawHash % this.bucketCount;

    steps.push({
      description: `Hash("${key}") = ${rawHash} mod ${this.bucketCount} = bucket ${bucketIdx}`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "hash",
    });

    const bucket = this.buckets[bucketIdx];

    // Walk the bucket and overflow chain
    let current: HashBucket | undefined = bucket;
    let chainDepth = 0;
    while (current) {
      for (const entry of current.entries) {
        if (entry.key === key) {
          steps.push({
            description: `Found ("${key}", "${entry.value}") in bucket ${bucketIdx}${chainDepth > 0 ? ` overflow #${chainDepth}` : ""}`,
            state: this.snapshot(),
            highlightBucket: bucketIdx,
            highlightKey: key,
            operation: "search",
          });
          return steps;
        }
      }
      if (current.overflow) {
        chainDepth++;
        steps.push({
          description: `Key "${key}" not in bucket ${bucketIdx} entries -- following overflow chain #${chainDepth}`,
          state: this.snapshot(),
          highlightBucket: bucketIdx,
          highlightKey: key,
          operation: "collision",
        });
      }
      current = current.overflow;
    }

    steps.push({
      description: `Key "${key}" not found in bucket ${bucketIdx} (end of chain)`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "search",
    });

    return steps;
  }

  /**
   * Delete a key from the hash table. Hashes to the correct bucket and
   * walks the overflow chain to find and remove the entry.
   *
   * @param key - The string key to delete
   * @returns Steps describing the hash, traversal, and whether the key
   *   was successfully removed or was not found
   */
  delete(key: string): HashIndexStep[] {
    const steps: HashIndexStep[] = [];

    const rawHash = djb2Hash(key);
    const bucketIdx = rawHash % this.bucketCount;

    steps.push({
      description: `Hash("${key}") = ${rawHash} mod ${this.bucketCount} = bucket ${bucketIdx}`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "hash",
    });

    const bucket = this.buckets[bucketIdx];
    let current: HashBucket | undefined = bucket;
    while (current) {
      const idx = current.entries.findIndex((e) => e.key === key);
      if (idx !== -1) {
        current.entries.splice(idx, 1);
        this.totalEntries--;
        steps.push({
          description: `Deleted key "${key}" from bucket ${bucketIdx}`,
          state: this.snapshot(),
          highlightBucket: bucketIdx,
          highlightKey: key,
          operation: "delete",
        });
        return steps;
      }
      current = current.overflow;
    }

    steps.push({
      description: `Key "${key}" not found -- nothing to delete`,
      state: this.snapshot(),
      highlightBucket: bucketIdx,
      highlightKey: key,
      operation: "search",
    });

    return steps;
  }

  /**
   * Return a deep-cloned snapshot of the current hash table state,
   * including all buckets, total entry count, and current load factor.
   *
   * @returns A deep copy of {@link HashIndexState} safe for serialization
   */
  getState(): HashIndexState {
    return this.snapshot();
  }

  /**
   * Reset to an empty hash table, preserving the current bucket count
   * (which may have grown from resizes). All entries and overflow chains
   * are cleared.
   */
  reset(): void {
    this.buckets = this.createEmptyBuckets(this.bucketCount);
    this.totalEntries = 0;
  }

  // ── Private helpers ──────────────────────────────────────────

  private snapshot(): HashIndexState {
    return {
      buckets: cloneBuckets(this.buckets),
      size: this.totalEntries,
      loadFactor:
        this.bucketCount > 0
          ? this.totalEntries / this.bucketCount
          : 0,
    };
  }

  private createEmptyBuckets(count: number): HashBucket[] {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      entries: [],
    }));
  }

  private findEntryInChain(
    bucket: HashBucket,
    key: string,
  ): { key: string; value: string } | null {
    let current: HashBucket | undefined = bucket;
    while (current) {
      const found = current.entries.find((e) => e.key === key);
      if (found) return found;
      current = current.overflow;
    }
    return null;
  }

  private chainLength(bucket: HashBucket): number {
    let count = bucket.entries.length;
    let current = bucket.overflow;
    while (current) {
      count += current.entries.length;
      current = current.overflow;
    }
    return count;
  }

  private insertIntoBucket(
    bucket: HashBucket,
    key: string,
    value: string,
  ): void {
    // Try to fit into the main bucket
    if (bucket.entries.length < BUCKET_CAPACITY) {
      bucket.entries.push({ key, value });
      return;
    }
    // Walk to the last overflow bucket
    let current: HashBucket = bucket;
    while (current.overflow) {
      if (current.overflow.entries.length < BUCKET_CAPACITY) {
        current.overflow.entries.push({ key, value });
        return;
      }
      current = current.overflow;
    }
    // Create a new overflow bucket
    current.overflow = {
      index: bucket.index,
      entries: [{ key, value }],
    };
  }

  private resize(): void {
    const newCount = this.bucketCount * 2;
    const newBuckets = this.createEmptyBuckets(newCount);

    // Rehash every entry
    for (const bucket of this.buckets) {
      let current: HashBucket | undefined = bucket;
      while (current) {
        for (const entry of current.entries) {
          const newIdx = djb2Hash(entry.key) % newCount;
          this.insertIntoBucket(newBuckets[newIdx], entry.key, entry.value);
        }
        current = current.overflow;
      }
    }

    this.buckets = newBuckets;
    this.bucketCount = newCount;
  }
}
