// -----------------------------------------------------------------
// Architex -- LSM Tree Simulation  (DST-019)
// Simulates LevelDB/RocksDB architecture. Real implementations use SkipList memtable and binary search on SSTables
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface LSMEntry {
  key: string;
  value: string;
  deleted?: boolean; // tombstone marker
}

export interface LSMState {
  memtable: LSMEntry[];
  immutableMemtable: LSMEntry[] | null;
  levels: LSMEntry[][][]; // level -> SSTable[] -> entries
  memtableCapacity: number;
  writeCount: number;
}

function cloneLSM(state: LSMState): LSMState {
  return {
    memtable: state.memtable.map((e) => ({ ...e })),
    immutableMemtable: state.immutableMemtable
      ? state.immutableMemtable.map((e) => ({ ...e }))
      : null,
    levels: state.levels.map((level) =>
      level.map((table) => table.map((e) => ({ ...e }))),
    ),
    memtableCapacity: state.memtableCapacity,
    writeCount: state.writeCount,
  };
}

// ── Create ──────────────────────────────────────────────────

export function createLSM(capacity: number = 4): LSMState {
  return {
    memtable: [],
    immutableMemtable: null,
    levels: [[], [], []], // L0, L1, L2
    memtableCapacity: capacity,
    writeCount: 0,
  };
}

// ── Insert ──────────────────────────────────────────────────

export function lsmInsert(state: LSMState, key: string, value: string): DSResult<LSMState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLSM(state);

  // Check if key already exists in memtable (update in place)
  const existingIdx = s.memtable.findIndex((e) => e.key === key);
  if (existingIdx >= 0) {
    steps.push(
      step(`Key "${key}" already in memtable -- updating value to "${value}"`, [
        { targetId: `mem-${existingIdx}`, property: 'highlight', from: 'default', to: 'updating' },
      ]),
    );
    s.memtable[existingIdx] = { key, value };
    return { steps, snapshot: s };
  }

  // Write to memtable
  s.memtable.push({ key, value });
  s.writeCount++;
  const idx = s.memtable.length - 1;
  steps.push(
    step(`Write (${key}: ${value}) to memtable [${s.memtable.length}/${s.memtableCapacity}]. LSM trees always write to an in-memory buffer first — sequential memory writes are orders of magnitude faster than random disk writes.`, [
      { targetId: `mem-${idx}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // WHY sort after insert: Real LSM trees use a SkipList or red-black tree for the memtable
  // to maintain sorted order on every write (O(log n) per insert). We use sort-after-insert
  // for simplicity. Sorted order is critical because SSTables on disk must be sorted to
  // enable binary search and efficient merge during compaction.
  s.memtable.sort((a, b) => a.key.localeCompare(b.key));
  steps.push(
    step('Memtable kept sorted by key', [
      { targetId: 'memtable', property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // Check if memtable is full -> trigger flush
  if (s.memtable.length >= s.memtableCapacity) {
    steps.push(
      step(`Memtable full (${s.memtable.length}/${s.memtableCapacity}) — triggering flush. When the memtable reaches capacity, it must be written to disk as an SSTable — this converts random writes into one sequential disk write.`, [
        { targetId: 'memtable', property: 'highlight', from: 'default', to: 'deleting' },
      ]),
    );

    // WHY immutable memtable before flush: Freezing the memtable as immutable allows new
    // writes to continue in a fresh memtable while the old data flushes to disk in the
    // background. Without this, writes would stall during flush — a latency spike that
    // RocksDB calls a "write stall". The immutable copy is a consistent point-in-time snapshot.
    s.immutableMemtable = [...s.memtable];
    s.memtable = [];
    steps.push(
      step('Memtable frozen as immutable memtable; new empty memtable created. The immutable copy allows new writes to continue in a fresh memtable while the old one flushes to disk — no write stalls.', [
        { targetId: 'immutable', property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );

    // Flush immutable memtable to Level 0 as a new SSTable
    const newSSTable = [...s.immutableMemtable];
    s.levels[0].push(newSSTable);
    steps.push(
      step(`Flushed immutable memtable to Level 0 as SSTable #${s.levels[0].length - 1}`, [
        { targetId: `l0-${s.levels[0].length - 1}`, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );

    // Clear immutable memtable
    s.immutableMemtable = null;
    steps.push(
      step('Immutable memtable cleared', [
        { targetId: 'immutable', property: 'highlight', from: 'default', to: 'default' },
      ]),
    );

    // Auto-compact if L0 has too many SSTables
    if (s.levels[0].length >= 3) {
      steps.push(
        step(`Level 0 has ${s.levels[0].length} SSTables — triggering compaction to Level 1. Too many L0 SSTables slow reads because each must be checked. Compaction merges them into fewer, larger sorted runs — the key write-amplification trade-off of LSM trees.`, [
          { targetId: 'l0', property: 'highlight', from: 'default', to: 'hashing' },
        ]),
      );
      const compactSteps = doCompact(s, 0, step);
      steps.push(...compactSteps);
    }
  }

  return { steps, snapshot: s };
}

// ── Binary search for sorted SSTables (O(log n) instead of O(n) linear scan) ──

function binarySearchTable(table: LSMEntry[], key: string): LSMEntry | undefined {
  let lo = 0, hi = table.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (table[mid].key === key) return table[mid];
    if (table[mid].key < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return undefined;
}

// ── Search ──────────────────────────────────────────────────

export function lsmSearch(state: LSMState, key: string): DSResult<LSMState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLSM(state);

  // 1. Check memtable
  steps.push(
    step(`Searching memtable for key "${key}". LSM reads check the memtable first — it holds the newest data, so if the key is here, we avoid any disk I/O entirely.`, [
      { targetId: 'memtable', property: 'highlight', from: 'default', to: 'comparing' },
    ]),
  );
  const memEntry = s.memtable.find((e) => e.key === key);
  if (memEntry) {
    const memIdx = s.memtable.indexOf(memEntry);
    steps.push(
      step(`Found "${key}" = "${memEntry.value}" in memtable`, [
        { targetId: `mem-${memIdx}`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }
  steps.push(
    step('Not found in memtable', [
      { targetId: 'memtable', property: 'highlight', from: 'default', to: 'not-found' },
    ]),
  );

  // 2. Check immutable memtable
  if (s.immutableMemtable) {
    steps.push(
      step('Checking immutable memtable...', [
        { targetId: 'immutable', property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
    const immEntry = s.immutableMemtable.find((e) => e.key === key);
    if (immEntry) {
      steps.push(
        step(`Found "${key}" = "${immEntry.value}" in immutable memtable`, [
          { targetId: 'immutable', property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
      return { steps, snapshot: s };
    }
    steps.push(
      step('Not found in immutable memtable', [
        { targetId: 'immutable', property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
  }

  // 3. Check levels from L0 -> L2 (newest SSTables first within each level)
  for (let lvl = 0; lvl < s.levels.length; lvl++) {
    const level = s.levels[lvl];
    if (level.length === 0) continue;

    steps.push(
      step(`Searching Level ${lvl} (${level.length} SSTable${level.length !== 1 ? 's' : ''})`, [
        { targetId: `l${lvl}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    // Search newest SSTable first
    for (let t = level.length - 1; t >= 0; t--) {
      const table = level[t];
      steps.push(
        step(`Binary search L${lvl} SSTable #${t} (${table.length} sorted entries, O(log n))`, [
          { targetId: `l${lvl}-${t}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
      const entry = binarySearchTable(table, key);
      if (entry) {
        if (entry.deleted) {
          steps.push(
            step(`Found tombstone for "${key}" in L${lvl} SSTable #${t} -- key was deleted`, [
              { targetId: `l${lvl}-${t}`, property: 'highlight', from: 'default', to: 'deleting' },
            ]),
          );
          return { steps, snapshot: s };
        }
        steps.push(
          step(`Found "${key}" = "${entry.value}" in L${lvl} SSTable #${t}`, [
            { targetId: `l${lvl}-${t}`, property: 'highlight', from: 'default', to: 'found' },
          ]),
        );
        return { steps, snapshot: s };
      }
    }
    steps.push(
      step(`Not found in Level ${lvl}`, [
        { targetId: `l${lvl}`, property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
  }

  steps.push(
    step(`Key "${key}" not found in any level`, []),
  );

  return { steps, snapshot: s };
}

// ── Flush ───────────────────────────────────────────────────

export function lsmFlush(state: LSMState): DSResult<LSMState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLSM(state);

  if (s.memtable.length === 0) {
    steps.push(step('Memtable is empty -- nothing to flush', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Flushing memtable with ${s.memtable.length} entries. A manual flush writes the in-memory data to disk as a sorted SSTable — the memtable is already sorted, so this is a single sequential write.`, [
      { targetId: 'memtable', property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Freeze memtable as immutable
  s.immutableMemtable = [...s.memtable];
  s.memtable = [];
  steps.push(
    step('Memtable frozen as immutable; new empty memtable created. Freezing before flush ensures no writes are lost — the immutable copy is a consistent snapshot.', [
      { targetId: 'immutable', property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // Write immutable to L0
  const newSSTable = [...s.immutableMemtable];
  s.levels[0].push(newSSTable);
  steps.push(
    step(`Written as SSTable #${s.levels[0].length - 1} in Level 0`, [
      { targetId: `l0-${s.levels[0].length - 1}`, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  s.immutableMemtable = null;
  steps.push(
    step('Immutable memtable cleared; flush complete', [
      { targetId: 'immutable', property: 'highlight', from: 'default', to: 'default' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Compact ─────────────────────────────────────────────────

function doCompact(s: LSMState, level: number, step: (desc: string, mutations: DSMutation[]) => DSStep): DSStep[] {
  const steps: DSStep[] = [];
  if (level >= s.levels.length - 1) return steps;

  const source = s.levels[level];
  if (source.length === 0) return steps;

  // Merge all SSTables in this level into one sorted run
  const merged = new Map<string, LSMEntry>();
  for (let t = 0; t < source.length; t++) {
    steps.push(
      step(`Merging L${level} SSTable #${t} (${source[t].length} entries)`, [
        { targetId: `l${level}-${t}`, property: 'highlight', from: 'default', to: 'shifting' },
      ]),
    );
    for (const entry of source[t]) {
      merged.set(entry.key, { ...entry });
    }
  }

  // Also merge with existing target level SSTables
  const target = s.levels[level + 1];
  for (let t = 0; t < target.length; t++) {
    steps.push(
      step(`Merging with L${level + 1} SSTable #${t} (${target[t].length} entries)`, [
        { targetId: `l${level + 1}-${t}`, property: 'highlight', from: 'default', to: 'shifting' },
      ]),
    );
    for (const entry of target[t]) {
      // Newer (from source level) takes precedence
      if (!merged.has(entry.key)) {
        merged.set(entry.key, { ...entry });
      }
    }
  }

  // Remove tombstones during compaction at deeper levels
  const resultEntries = Array.from(merged.values())
    .filter((e) => !e.deleted)
    .sort((a, b) => a.key.localeCompare(b.key));

  // Clear source level
  s.levels[level] = [];
  steps.push(
    step(`Cleared Level ${level}`, [
      { targetId: `l${level}`, property: 'highlight', from: 'default', to: 'default' },
    ]),
  );

  // Write merged result to target level as a single SSTable
  s.levels[level + 1] = [resultEntries];
  steps.push(
    step(`Compacted ${merged.size} entries into L${level + 1} SSTable #0 (${resultEntries.length} after removing tombstones)`, [
      { targetId: `l${level + 1}-0`, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return steps;
}

export function lsmCompact(state: LSMState, level: number): DSResult<LSMState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLSM(state);

  if (level < 0 || level >= s.levels.length - 1) {
    steps.push(step(`Invalid level ${level} for compaction`, []));
    return { steps, snapshot: s };
  }

  if (s.levels[level].length === 0) {
    steps.push(step(`Level ${level} is empty -- nothing to compact`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Starting compaction: Level ${level} -> Level ${level + 1}. Compaction merges SSTables from one level into the next — this is the write-amplification cost that LSM trees pay to keep reads fast.`, [
      { targetId: `l${level}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  const compactSteps = doCompact(s, level, step);
  steps.push(...compactSteps);

  steps.push(
    step('Compaction complete', []),
  );

  return { steps, snapshot: s };
}
