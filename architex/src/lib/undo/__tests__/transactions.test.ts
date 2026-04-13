import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UndoManager } from '../undo-manager';
import { TransactionManager } from '../transactions';
import { createDebouncedSnapshot, createDragSnapshot } from '../debounce';

// ── Transaction + Commit Tests ───────────────────────────────

describe('Transaction: beginTransaction + multiple pushes + commitTransaction', () => {
  let undo: UndoManager<string>;
  let tx: TransactionManager<string>;

  beforeEach(() => {
    undo = new UndoManager<string>();
    tx = new TransactionManager(undo);
  });

  it('commit after multiple intermediate changes results in single undo entry', () => {
    undo.pushSnapshot('initial');

    tx.beginTransaction();
    // Simulate multiple changes (user drags, types, etc.)
    // These are NOT pushed to the undo manager during the transaction.
    tx.commitTransaction('final-state');

    // Only 'initial' on the undo stack, 'final-state' is current
    expect(undo.undoStackSize).toBe(1);
    expect(undo.getCurrent()).toBe('final-state');
  });

  it('a single undo after commit returns to pre-transaction state', () => {
    undo.pushSnapshot('before');

    tx.beginTransaction();
    tx.commitTransaction('after-many-ops');

    const undone = undo.undo();
    expect(undone).toBe('before');
  });

  it('commit without prior pushSnapshot still works', () => {
    tx.beginTransaction();
    tx.commitTransaction('only-state');

    expect(undo.getCurrent()).toBe('only-state');
    expect(undo.undoStackSize).toBe(0);
  });

  it('two sequential transactions produce two undo entries', () => {
    undo.pushSnapshot('s0');

    tx.beginTransaction();
    tx.commitTransaction('s1');

    tx.beginTransaction();
    tx.commitTransaction('s2');

    expect(undo.getCurrent()).toBe('s2');
    expect(undo.undoStackSize).toBe(2); // s0, s1 on stack

    expect(undo.undo()).toBe('s1');
    expect(undo.undo()).toBe('s0');
  });
});

// ── Rollback Tests ───────────────────────────────────────────

describe('Transaction: rollback', () => {
  let undo: UndoManager<string>;
  let tx: TransactionManager<string>;

  beforeEach(() => {
    undo = new UndoManager<string>();
    tx = new TransactionManager(undo);
  });

  it('rollback returns the pre-transaction snapshot', () => {
    undo.pushSnapshot('saved');

    tx.beginTransaction();
    const restored = tx.rollbackTransaction();

    expect(restored).toBe('saved');
  });

  it('rollback does not alter the undo stack', () => {
    undo.pushSnapshot('A');
    undo.pushSnapshot('B');
    const sizeBefore = undo.undoStackSize;

    tx.beginTransaction();
    tx.rollbackTransaction();

    expect(undo.undoStackSize).toBe(sizeBefore);
    expect(undo.getCurrent()).toBe('B');
  });

  it('rollback returns null when no snapshot existed before the transaction', () => {
    tx.beginTransaction();
    const restored = tx.rollbackTransaction();
    expect(restored).toBeNull();
  });
});

// ── Nested Transaction Error ─────────────────────────────────

describe('Transaction: nested error', () => {
  it('throws when beginTransaction is called while already in a transaction', () => {
    const undo = new UndoManager<string>();
    const tx = new TransactionManager(undo);

    tx.beginTransaction();
    expect(() => tx.beginTransaction()).toThrow('nested transactions');
    tx.rollbackTransaction(); // cleanup
  });

  it('allows starting a new transaction after commit', () => {
    const undo = new UndoManager<string>();
    const tx = new TransactionManager(undo);

    tx.beginTransaction();
    tx.commitTransaction('done');

    // Should not throw
    tx.beginTransaction();
    tx.commitTransaction('done-again');

    expect(undo.getCurrent()).toBe('done-again');
  });

  it('allows starting a new transaction after rollback', () => {
    const undo = new UndoManager<string>();
    const tx = new TransactionManager(undo);

    tx.beginTransaction();
    tx.rollbackTransaction();

    // Should not throw
    tx.beginTransaction();
    tx.commitTransaction('recovered');

    expect(undo.getCurrent()).toBe('recovered');
  });
});

// ── Debounced Snapshot Coalescing ────────────────────────────

describe('Debounced snapshot coalescing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces rapid changes into a single snapshot', () => {
    const undo = new UndoManager<number>();
    const debounced = createDebouncedSnapshot(undo, 300);

    debounced(1);
    debounced(2);
    debounced(3);
    debounced(4);
    debounced(5);

    // Nothing yet
    expect(undo.getCurrent()).toBeNull();

    vi.advanceTimersByTime(300);

    // Only the last value was pushed
    expect(undo.getCurrent()).toBe(5);
    expect(undo.undoStackSize).toBe(0);
  });

  it('produces separate snapshots when calls are spaced beyond delay', () => {
    const undo = new UndoManager<string>();
    const debounced = createDebouncedSnapshot(undo, 100);

    debounced('first');
    vi.advanceTimersByTime(100);

    debounced('second');
    vi.advanceTimersByTime(100);

    debounced('third');
    vi.advanceTimersByTime(100);

    expect(undo.getCurrent()).toBe('third');
    expect(undo.undoStackSize).toBe(2); // 'first' and 'second'
  });

  it('uses default 500ms delay when not specified', () => {
    const undo = new UndoManager<string>();
    const debounced = createDebouncedSnapshot(undo);

    debounced('value');

    vi.advanceTimersByTime(499);
    expect(undo.getCurrent()).toBeNull();

    vi.advanceTimersByTime(1);
    expect(undo.getCurrent()).toBe('value');
  });
});

// ── Drag Snapshot ────────────────────────────────────────────

describe('Drag snapshot', () => {
  it('captures start and end only, producing two pushes', () => {
    const undo = new UndoManager<string>();
    undo.pushSnapshot('idle');

    const { onDragStart, onDragEnd } = createDragSnapshot(undo);

    onDragStart('pre-drag');
    // simulate many pixel movements (nothing pushed)
    onDragEnd('post-drag');

    expect(undo.getCurrent()).toBe('post-drag');

    // Undo goes to pre-drag (the start snapshot), then to idle
    const step1 = undo.undo();
    expect(step1).toBe('pre-drag');

    const step2 = undo.undo();
    expect(step2).toBe('idle');
  });

  it('does nothing if onDragEnd called without onDragStart', () => {
    const undo = new UndoManager<string>();
    const { onDragEnd } = createDragSnapshot(undo);

    onDragEnd('orphan-end');
    expect(undo.getCurrent()).toBeNull();
  });

  it('supports multiple sequential drag operations', () => {
    const undo = new UndoManager<string>();
    undo.pushSnapshot('start');

    const { onDragStart, onDragEnd } = createDragSnapshot(undo);

    // First drag
    onDragStart('drag1-start');
    onDragEnd('drag1-end');

    // Second drag
    onDragStart('drag2-start');
    onDragEnd('drag2-end');

    expect(undo.getCurrent()).toBe('drag2-end');

    // Undo through the second drag
    expect(undo.undo()).toBe('drag2-start');
    // Undo the first drag
    expect(undo.undo()).toBe('drag1-end');
    expect(undo.undo()).toBe('drag1-start');
  });
});
