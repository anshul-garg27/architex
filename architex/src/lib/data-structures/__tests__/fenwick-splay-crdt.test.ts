import { describe, it, expect } from 'vitest';
import {
  createFenwickTree,
  fenwickUpdate,
  fenwickPrefixSum,
  fenwickRangeSum,
} from '@/lib/data-structures/fenwick-tree-ds';
import type { FenwickTreeState } from '@/lib/data-structures/fenwick-tree-ds';
import {
  createSplayTree,
  splayInsert,
  splaySearch,
  splayDelete,
} from '@/lib/data-structures/splay-tree-ds';
import type { SplayTreeState } from '@/lib/data-structures/splay-tree-ds';
import {
  gCounterCreate,
  gCounterIncrement,
  gCounterMerge,
  gCounterValue,
  pnCounterCreate,
  pnCounterIncrement,
  pnCounterDecrement,
  pnCounterMerge,
  pnCounterValue,
  lwwRegisterCreate,
  lwwRegisterSet,
  lwwRegisterMerge,
  lwwRegisterGet,
  orSetCreate,
  orSetAdd,
  orSetRemove,
  orSetMerge,
  orSetElements,
} from '@/lib/data-structures/crdt-ds';
import type {
  GCounterState,
  PNCounterState,
  LWWRegisterState,
  ORSetState,
} from '@/lib/data-structures/crdt-ds';

// ── Fenwick Tree Tests ───────────────────────────────────────

describe('Fenwick Tree (Binary Indexed Tree)', () => {
  const data = [1, 3, 5, 7, 9, 11];

  it('builds from array with correct structure', () => {
    const result = createFenwickTree(data);
    const ft = result.snapshot as FenwickTreeState;
    expect(ft.n).toBe(6);
    expect(ft.data).toEqual(data);
    // BIT is 1-indexed, index 0 unused
    expect(ft.tree.length).toBe(7);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('builds empty array', () => {
    const result = createFenwickTree([]);
    const ft = result.snapshot as FenwickTreeState;
    expect(ft.n).toBe(0);
  });

  it('point update changes value and propagates', () => {
    const buildResult = createFenwickTree(data);
    let ft = buildResult.snapshot as FenwickTreeState;

    // Add 4 to index 2 (value 5 -> 9)
    const upResult = fenwickUpdate(ft, 2, 4);
    ft = upResult.snapshot as FenwickTreeState;

    expect(ft.data[2]).toBe(9); // 5 + 4
    expect(upResult.steps.length).toBeGreaterThan(0);

    // Verify via prefix sum: sum(0..2) should be 1+3+9 = 13
    const psResult = fenwickPrefixSum(ft, 2);
    const sumStep = psResult.steps.find((s) => s.description.includes('Prefix sum('));
    expect(sumStep).toBeDefined();
    expect(sumStep!.description).toContain('= 13');
  });

  it('prefix sum returns correct cumulative sum', () => {
    const buildResult = createFenwickTree(data);
    const ft = buildResult.snapshot as FenwickTreeState;

    // sum(0..0) = 1
    const r0 = fenwickPrefixSum(ft, 0);
    expect(r0.steps.find((s) => s.description.includes('Prefix sum('))!.description).toContain('= 1');

    // sum(0..2) = 1+3+5 = 9
    const r2 = fenwickPrefixSum(ft, 2);
    expect(r2.steps.find((s) => s.description.includes('Prefix sum('))!.description).toContain('= 9');

    // sum(0..5) = 1+3+5+7+9+11 = 36
    const r5 = fenwickPrefixSum(ft, 5);
    expect(r5.steps.find((s) => s.description.includes('Prefix sum('))!.description).toContain('= 36');
  });

  it('range sum returns correct partial sum', () => {
    const buildResult = createFenwickTree(data);
    const ft = buildResult.snapshot as FenwickTreeState;

    // sum(1..3) = 3+5+7 = 15
    const r = fenwickRangeSum(ft, 1, 3);
    const sumStep = r.steps.find((s) => s.description.includes('Range sum('));
    expect(sumStep).toBeDefined();
    expect(sumStep!.description).toContain('= 15');

    // sum(0..5) = 36
    const rFull = fenwickRangeSum(ft, 0, 5);
    const fullStep = rFull.steps.find((s) => s.description.includes('Range sum('));
    expect(fullStep!.description).toContain('= 36');
  });

  it('shows binary representation in steps', () => {
    const result = createFenwickTree([1, 2, 3, 4]);
    const hasBinary = result.steps.some((s) => /\d{8}/.test(s.description));
    expect(hasBinary).toBe(true);
  });
});

// ── Splay Tree Tests ─────────────────────────────────────────

describe('Splay Tree', () => {
  function buildSplay(keys: number[]): SplayTreeState {
    let state = createSplayTree();
    for (const k of keys) {
      state = splayInsert(state, k).snapshot as SplayTreeState;
    }
    return state;
  }

  it('creates empty tree', () => {
    const tree = createSplayTree();
    expect(tree.root).toBeNull();
    expect(tree.size).toBe(0);
  });

  it('insert splays new key to root', () => {
    let tree = createSplayTree();

    const r1 = splayInsert(tree, 10);
    tree = r1.snapshot as SplayTreeState;
    expect(tree.root).not.toBeNull();
    expect(tree.root!.key).toBe(10);
    expect(tree.size).toBe(1);

    const r2 = splayInsert(tree, 5);
    tree = r2.snapshot as SplayTreeState;
    expect(tree.root!.key).toBe(5);
    expect(tree.size).toBe(2);

    const r3 = splayInsert(tree, 15);
    tree = r3.snapshot as SplayTreeState;
    expect(tree.root!.key).toBe(15);
    expect(tree.size).toBe(3);
  });

  it('search splays found node to root', () => {
    const tree = buildSplay([10, 5, 15, 3, 7]);

    const result = splaySearch(tree, 3);
    const st = result.snapshot as SplayTreeState;
    expect(st.root!.key).toBe(3);
    expect(result.steps.some((s) => s.description.includes('FOUND'))).toBe(true);
  });

  it('search for missing key splays nearest to root', () => {
    const tree = buildSplay([10, 5, 15]);

    const result = splaySearch(tree, 99);
    const st = result.snapshot as SplayTreeState;
    // Nearest key splayed to root
    expect(st.root).not.toBeNull();
    expect(result.steps.some((s) => s.description.includes('NOT FOUND'))).toBe(true);
  });

  it('delete removes key correctly', () => {
    const tree = buildSplay([10, 5, 15, 3, 7]);

    const result = splayDelete(tree, 10);
    const st = result.snapshot as SplayTreeState;
    expect(st.size).toBe(4);

    // 10 should no longer be findable
    const searchResult = splaySearch(st, 10);
    expect(
      searchResult.steps.some((s) => s.description.includes('NOT FOUND')),
    ).toBe(true);
  });

  it('delete non-existent key is a no-op', () => {
    const tree = buildSplay([10, 5, 15]);

    const result = splayDelete(tree, 99);
    const st = result.snapshot as SplayTreeState;
    expect(st.size).toBe(3);
    expect(result.steps.some((s) => s.description.includes('not found'))).toBe(true);
  });

  it('delete from empty tree is safe', () => {
    const tree = createSplayTree();
    const result = splayDelete(tree, 5);
    const st = result.snapshot as SplayTreeState;
    expect(st.root).toBeNull();
  });

  it('shows rotation steps', () => {
    const tree = buildSplay([10, 5, 15, 3, 7, 12, 20]);

    // Searching for 3 should trigger rotations
    const result = splaySearch(tree, 3);
    const hasRotation = result.steps.some(
      (s) => s.description.includes('Zig') || s.description.includes('zig'),
    );
    expect(hasRotation).toBe(true);
  });
});

// ── CRDT Tests ───────────────────────────────────────────────

describe('G-Counter', () => {
  it('increments on individual nodes', () => {
    let gc = gCounterCreate();

    gc = gCounterIncrement(gc, 'A').snapshot as GCounterState;
    gc = gCounterIncrement(gc, 'A').snapshot as GCounterState;
    gc = gCounterIncrement(gc, 'B').snapshot as GCounterState;

    expect(gCounterValue(gc)).toBe(3);
    expect(gc.counts['A']).toBe(2);
    expect(gc.counts['B']).toBe(1);
  });

  it('concurrent increments merge correctly via max', () => {
    // Simulate two replicas diverging then merging
    let replicaA = gCounterCreate();
    let replicaB = gCounterCreate();

    // Both start at 0, then diverge
    replicaA = gCounterIncrement(replicaA, 'A').snapshot as GCounterState;
    replicaA = gCounterIncrement(replicaA, 'A').snapshot as GCounterState;

    replicaB = gCounterIncrement(replicaB, 'B').snapshot as GCounterState;
    replicaB = gCounterIncrement(replicaB, 'B').snapshot as GCounterState;
    replicaB = gCounterIncrement(replicaB, 'B').snapshot as GCounterState;

    // Merge: A=2 from replicaA, B=3 from replicaB
    const mergeResult = gCounterMerge(replicaA, replicaB);
    const merged = mergeResult.snapshot as GCounterState;

    expect(gCounterValue(merged)).toBe(5);
    expect(merged.counts['A']).toBe(2);
    expect(merged.counts['B']).toBe(3);
  });

  it('merge is commutative', () => {
    let a = gCounterCreate();
    let b = gCounterCreate();

    a = gCounterIncrement(a, 'X').snapshot as GCounterState;
    b = gCounterIncrement(b, 'Y').snapshot as GCounterState;

    const ab = gCounterMerge(a, b).snapshot as GCounterState;
    const ba = gCounterMerge(b, a).snapshot as GCounterState;

    expect(gCounterValue(ab)).toBe(gCounterValue(ba));
  });

  it('merge is idempotent', () => {
    let a = gCounterCreate();
    a = gCounterIncrement(a, 'A').snapshot as GCounterState;

    const merged = gCounterMerge(a, a).snapshot as GCounterState;
    expect(gCounterValue(merged)).toBe(1); // not 2
  });
});

describe('PN-Counter', () => {
  it('supports increment and decrement', () => {
    let pn = pnCounterCreate();

    pn = pnCounterIncrement(pn, 'A').snapshot as PNCounterState;
    pn = pnCounterIncrement(pn, 'A').snapshot as PNCounterState;
    pn = pnCounterIncrement(pn, 'A').snapshot as PNCounterState;
    pn = pnCounterDecrement(pn, 'A').snapshot as PNCounterState;

    expect(pnCounterValue(pn)).toBe(2); // 3 - 1
  });

  it('merges two replicas correctly', () => {
    let replicaA = pnCounterCreate();
    let replicaB = pnCounterCreate();

    replicaA = pnCounterIncrement(replicaA, 'A').snapshot as PNCounterState;
    replicaA = pnCounterIncrement(replicaA, 'A').snapshot as PNCounterState;

    replicaB = pnCounterIncrement(replicaB, 'B').snapshot as PNCounterState;
    replicaB = pnCounterDecrement(replicaB, 'B').snapshot as PNCounterState;

    const merged = pnCounterMerge(replicaA, replicaB).snapshot as PNCounterState;
    // A incremented 2 times, B incremented 1 and decremented 1 => 2 + 0 = 2
    expect(pnCounterValue(merged)).toBe(2);
  });
});

describe('LWW-Register', () => {
  it('last write wins based on timestamp', () => {
    let reg = lwwRegisterCreate();

    reg = lwwRegisterSet(reg, 'first', 1).snapshot as LWWRegisterState;
    expect(lwwRegisterGet(reg)).toBe('first');

    reg = lwwRegisterSet(reg, 'second', 5).snapshot as LWWRegisterState;
    expect(lwwRegisterGet(reg)).toBe('second');

    // Stale write should be ignored
    reg = lwwRegisterSet(reg, 'stale', 3).snapshot as LWWRegisterState;
    expect(lwwRegisterGet(reg)).toBe('second');
  });

  it('merge picks higher timestamp', () => {
    let regA = lwwRegisterCreate();
    let regB = lwwRegisterCreate();

    regA = lwwRegisterSet(regA, 'alice', 10).snapshot as LWWRegisterState;
    regB = lwwRegisterSet(regB, 'bob', 20).snapshot as LWWRegisterState;

    const merged = lwwRegisterMerge(regA, regB).snapshot as LWWRegisterState;
    expect(lwwRegisterGet(merged)).toBe('bob');
    expect(merged.timestamp).toBe(20);
  });

  it('merge is commutative', () => {
    let a = lwwRegisterCreate();
    let b = lwwRegisterCreate();

    a = lwwRegisterSet(a, 'X', 5).snapshot as LWWRegisterState;
    b = lwwRegisterSet(b, 'Y', 3).snapshot as LWWRegisterState;

    const ab = lwwRegisterMerge(a, b).snapshot as LWWRegisterState;
    const ba = lwwRegisterMerge(b, a).snapshot as LWWRegisterState;

    expect(lwwRegisterGet(ab)).toBe(lwwRegisterGet(ba));
  });
});

describe('OR-Set', () => {
  it('add and elements works', () => {
    let set = orSetCreate();
    set = orSetAdd(set, 'apple', 'A').snapshot as ORSetState;
    set = orSetAdd(set, 'banana', 'B').snapshot as ORSetState;
    set = orSetAdd(set, 'apple', 'B').snapshot as ORSetState; // duplicate element, different tag

    const elems = orSetElements(set);
    expect(elems).toEqual(['apple', 'banana']);
    expect(set.entries.length).toBe(3); // 3 tagged entries
  });

  it('remove removes all tags for element', () => {
    let set = orSetCreate();
    set = orSetAdd(set, 'apple', 'A').snapshot as ORSetState;
    set = orSetAdd(set, 'apple', 'B').snapshot as ORSetState;
    set = orSetAdd(set, 'banana', 'A').snapshot as ORSetState;

    set = orSetRemove(set, 'apple').snapshot as ORSetState;

    expect(orSetElements(set)).toEqual(['banana']);
    expect(set.entries.length).toBe(1);
  });

  it('merge unions tagged entries', () => {
    let setA = orSetCreate();
    let setB = orSetCreate();

    setA = orSetAdd(setA, 'x', 'A').snapshot as ORSetState;
    setA = orSetAdd(setA, 'y', 'A').snapshot as ORSetState;

    setB = orSetAdd(setB, 'y', 'B').snapshot as ORSetState;
    setB = orSetAdd(setB, 'z', 'B').snapshot as ORSetState;

    const merged = orSetMerge(setA, setB).snapshot as ORSetState;

    expect(orSetElements(merged)).toEqual(['x', 'y', 'z']);
    // y appears with two different tags (A:2 and B:1)
    const yEntries = merged.entries.filter((e) => e.element === 'y');
    expect(yEntries.length).toBe(2);
  });

  it('add after remove (concurrent) preserves the add', () => {
    let set = orSetCreate();
    set = orSetAdd(set, 'item', 'A').snapshot as ORSetState;

    // Simulate: replica A removes, replica B adds concurrently
    const replicaA = orSetRemove(set, 'item').snapshot as ORSetState;
    const replicaB = orSetAdd(set, 'item', 'B').snapshot as ORSetState;

    // Merge: the add on B has a new unique tag, so it survives A's remove
    const merged = orSetMerge(replicaA, replicaB).snapshot as ORSetState;
    expect(orSetElements(merged)).toEqual(['item']);
  });

  it('remove non-existent element is a no-op', () => {
    let set = orSetCreate();
    set = orSetAdd(set, 'x', 'A').snapshot as ORSetState;

    const result = orSetRemove(set, 'missing');
    const s = result.snapshot as ORSetState;
    expect(orSetElements(s)).toEqual(['x']);
  });
});
