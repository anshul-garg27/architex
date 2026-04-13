import { describe, it, expect, beforeEach } from 'vitest';
import { LSMTreeViz } from '../lsm-viz';

// ── LSMTreeViz Tests ──────────────────────────────────────────

describe('LSMTreeViz', () => {
  let lsm: LSMTreeViz;

  beforeEach(() => {
    lsm = new LSMTreeViz(4); // memtable capacity = 4
  });

  it('write single key places it in memtable', () => {
    const steps = lsm.write('a', '1');

    expect(steps.length).toBeGreaterThanOrEqual(1);
    // First step should be WAL write, second should be memtable write
    expect(steps[0].operation).toBe('write');

    const state = lsm.getState();
    expect(state.memtable).toContain('a=1');
    expect(state.memtable).toHaveLength(1);
  });

  it('writing 4 keys triggers auto-flush: L0 gets 1 SSTable', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    const steps = lsm.write('d', '4');

    // Should have flush steps
    const flushSteps = steps.filter((s) => s.operation === 'flush');
    expect(flushSteps.length).toBeGreaterThanOrEqual(1);

    const state = lsm.getState();
    // Memtable should be empty after flush
    expect(state.memtable).toHaveLength(0);
    // L0 should have 1 SSTable
    expect(state.levels[0].sstables).toHaveLength(1);
    expect(state.levels[0].sstables[0].keys).toEqual(['a', 'b', 'c', 'd']);
  });

  it('read key from memtable returns found in memtable step', () => {
    lsm.write('x', '42');

    const steps = lsm.read('x');

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const foundStep = steps.find(
      (s) => s.operation === 'read' && s.description.includes('memtable'),
    );
    expect(foundStep).toBeDefined();
    expect(foundStep!.description).toContain('Found');
    expect(foundStep!.description).toContain('x=42');
  });

  it('read key from L0 returns found in L0 step', () => {
    // Fill and flush to L0
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers flush

    // Now memtable is empty and keys are in L0
    const steps = lsm.read('b');

    const l0Step = steps.find(
      (s) => s.operation === 'read' && s.description.includes('L0'),
    );
    expect(l0Step).toBeDefined();
    expect(l0Step!.description).toContain('Found');
    expect(l0Step!.highlightLevel).toBe(0);
  });

  it('read missing key returns not-found step', () => {
    lsm.write('a', '1');

    const steps = lsm.read('missing');

    const notFoundStep = steps.find(
      (s) => s.description.includes('not found in any level'),
    );
    expect(notFoundStep).toBeDefined();
    expect(notFoundStep!.operation).toBe('read');
  });

  it('manual flush clears memtable and creates new L0 SSTable', () => {
    lsm.write('x', '1');
    lsm.write('y', '2');

    const steps = lsm.flush();

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const flushStep = steps.find((s) => s.operation === 'flush');
    expect(flushStep).toBeDefined();

    const state = lsm.getState();
    expect(state.memtable).toHaveLength(0);
    expect(state.levels[0].sstables).toHaveLength(1);
    expect(state.levels[0].sstables[0].keys).toContain('x');
    expect(state.levels[0].sstables[0].keys).toContain('y');
  });

  it('compact L0→L1 clears L0 and populates L1', () => {
    // Create some L0 SSTables by writing and flushing multiple batches
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.flush();

    lsm.write('c', '3');
    lsm.write('d', '4');
    lsm.flush();

    const stateBefore = lsm.getState();
    expect(stateBefore.levels[0].sstables.length).toBeGreaterThanOrEqual(2);

    const steps = lsm.compact(0);

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const compactStep = steps.find((s) => s.operation === 'compact');
    expect(compactStep).toBeDefined();

    const stateAfter = lsm.getState();
    // L0 should be cleared
    expect(stateAfter.levels[0].sstables).toHaveLength(0);
    // L1 should have merged SSTable(s) with all keys
    const l1Keys = stateAfter.levels[1].sstables.flatMap((sst) => sst.keys);
    expect(l1Keys).toContain('a');
    expect(l1Keys).toContain('b');
    expect(l1Keys).toContain('c');
    expect(l1Keys).toContain('d');
  });
});

// ── WAL (Write-Ahead Log) Tests ──────────────────────────────

describe('LSMTreeViz WAL', () => {
  let lsm: LSMTreeViz;

  beforeEach(() => {
    lsm = new LSMTreeViz(4);
  });

  it('write adds entry to WAL before memtable', () => {
    const steps = lsm.write('key1', 'val1');

    // First step should be WAL write (walActive = true)
    expect(steps[0].walActive).toBe(true);
    expect(steps[0].description).toContain('WAL');
    expect(steps[0].state.wal).toContain('key1=val1');

    // State should have WAL entry
    const state = lsm.getState();
    expect(state.wal).toContain('key1=val1');
  });

  it('WAL accumulates entries across multiple writes', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');

    const state = lsm.getState();
    expect(state.wal).toHaveLength(3);
    expect(state.wal).toContain('a=1');
    expect(state.wal).toContain('b=2');
    expect(state.wal).toContain('c=3');
  });

  it('flush clears WAL entries for flushed keys', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers auto-flush

    const state = lsm.getState();
    // WAL should be cleared after flush
    expect(state.wal).toHaveLength(0);
  });

  it('flush step includes WAL clearing step', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    const steps = lsm.flush();

    const walClearStep = steps.find(
      (s) => s.walActive === true && s.operation === 'flush',
    );
    expect(walClearStep).toBeDefined();
    expect(walClearStep!.description).toContain('WAL entries');
    expect(walClearStep!.description).toContain('discarded');
  });

  it('checkpoint clears all WAL entries', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');

    expect(lsm.getState().wal).toHaveLength(2);

    const steps = lsm.checkpoint();

    expect(steps).toHaveLength(1);
    expect(steps[0].operation).toBe('checkpoint');
    expect(steps[0].walActive).toBe(true);
    expect(steps[0].description).toContain('Checkpoint');
    expect(lsm.getState().wal).toHaveLength(0);
  });

  it('checkpoint on empty WAL returns nothing-to-truncate step', () => {
    const steps = lsm.checkpoint();

    expect(steps).toHaveLength(1);
    expect(steps[0].description).toContain('already empty');
  });

  it('reset clears WAL', () => {
    lsm.write('a', '1');
    expect(lsm.getState().wal.length).toBeGreaterThan(0);

    lsm.reset();
    expect(lsm.getState().wal).toHaveLength(0);
  });
});

// ── Bloom Filter Tests ───────────────────────────────────────

describe('LSMTreeViz Bloom Filter', () => {
  let lsm: LSMTreeViz;

  beforeEach(() => {
    lsm = new LSMTreeViz(4);
  });

  it('bloom filter is enabled by default', () => {
    expect(lsm.bloomEnabled).toBe(true);
    expect(lsm.getState().bloomEnabled).toBe(true);
  });

  it('bloom filter can be toggled', () => {
    lsm.setBloomEnabled(false);
    expect(lsm.bloomEnabled).toBe(false);
    expect(lsm.getState().bloomEnabled).toBe(false);

    lsm.setBloomEnabled(true);
    expect(lsm.bloomEnabled).toBe(true);
  });

  it('SSTables have bloom filters populated on flush', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers flush

    const state = lsm.getState();
    const sst = state.levels[0].sstables[0];
    expect(sst.bloomFilter).toBeDefined();
    expect(sst.bloomFilter.has('a')).toBe(true);
    expect(sst.bloomFilter.has('b')).toBe(true);
    expect(sst.bloomFilter.has('c')).toBe(true);
    expect(sst.bloomFilter.has('d')).toBe(true);
    expect(sst.bloomFilter.has('z')).toBe(false);
  });

  it('bloom filter skips SSTables that definitely do not contain key', () => {
    // Create SSTable with keys a,b,c,d
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers flush

    // Read a key NOT in the SSTable
    const steps = lsm.read('z');

    const bloomSkipStep = steps.find(
      (s) => s.description.includes('DEFINITELY NOT'),
    );
    expect(bloomSkipStep).toBeDefined();
    expect(bloomSkipStep!.bloomSkipped!.length).toBeGreaterThan(0);
  });

  it('bloom filter says MIGHT for keys that are present', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers flush

    const steps = lsm.read('b');

    const bloomCheckStep = steps.find(
      (s) => s.description.includes('MIGHT be'),
    );
    expect(bloomCheckStep).toBeDefined();
    expect(bloomCheckStep!.bloomChecked!.length).toBeGreaterThan(0);
  });

  it('with bloom disabled, no bloom skip/check steps generated', () => {
    lsm.setBloomEnabled(false);

    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.write('c', '3');
    lsm.write('d', '4'); // triggers flush

    const steps = lsm.read('z');

    const bloomStep = steps.find(
      (s) =>
        s.description.includes('DEFINITELY NOT') ||
        s.description.includes('MIGHT be'),
    );
    expect(bloomStep).toBeUndefined();
  });

  it('compacted SSTables have bloom filters', () => {
    // Create two L0 SSTables
    lsm.write('a', '1');
    lsm.write('b', '2');
    lsm.flush();

    lsm.write('c', '3');
    lsm.write('d', '4');
    lsm.flush();

    lsm.compact(0);

    const state = lsm.getState();
    for (const sst of state.levels[1].sstables) {
      expect(sst.bloomFilter).toBeDefined();
      expect(sst.bloomFilter.size).toBeGreaterThan(0);
    }
  });

  it('flush step mentions bloom filter creation', () => {
    lsm.write('a', '1');
    lsm.write('b', '2');

    const steps = lsm.flush();

    const bloomMentionStep = steps.find(
      (s) => s.description.includes('bloom filter'),
    );
    expect(bloomMentionStep).toBeDefined();
  });
});
