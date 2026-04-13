// -----------------------------------------------------------------
// Architex -- CRDTs (Conflict-free Replicated Data Types)  (DST-028)
// Four CRDT types: G-Counter, PN-Counter, LWW-Register, OR-Set.
// Each operation returns DSResult with merge visualization steps.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

function crdtId(type: string, node: string): string {
  return `crdt-${type}-${node}`;
}

// ====================================================================
// 1. G-Counter (Grow-only Counter)
// ====================================================================

export interface GCounterState {
  type: 'g-counter';
  /** Map from nodeId -> local count. */
  counts: Record<string, number>;
}

/** Create an empty G-Counter. */
export function gCounterCreate(): GCounterState {
  return { type: 'g-counter', counts: {} };
}

/** Increment on a specific node. */
export function gCounterIncrement(
  state: GCounterState,
  nodeId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s: GCounterState = { type: 'g-counter', counts: { ...state.counts } };

  const prev = s.counts[nodeId] ?? 0;
  s.counts[nodeId] = prev + 1;

  steps.push(
    step(`G-Counter increment on node '${nodeId}': ${prev} -> ${prev + 1}`, [
      { targetId: crdtId('gctr', nodeId), property: 'value', from: prev, to: prev + 1 },
    ]),
  );

  steps.push(
    step(`G-Counter value = ${gCounterValue(s)}`, []),
  );

  return { steps, snapshot: s };
}

/** Merge two G-Counters (take max per node). */
export function gCounterMerge(
  a: GCounterState,
  b: GCounterState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Merge G-Counters: take max per node`, []));

  const merged: GCounterState = { type: 'g-counter', counts: {} };
  const allNodes = new Set([...Object.keys(a.counts), ...Object.keys(b.counts)]);

  for (const node of allNodes) {
    const va = a.counts[node] ?? 0;
    const vb = b.counts[node] ?? 0;
    const max = Math.max(va, vb);
    merged.counts[node] = max;

    steps.push(
      step(
        `Node '${node}': max(${va}, ${vb}) = ${max}`,
        [
          { targetId: crdtId('gctr', node), property: 'value', from: Math.min(va, vb), to: max },
        ],
      ),
    );
  }

  const val = gCounterValue(merged);
  steps.push(
    step(`Merged G-Counter value = ${val}`, [
      { targetId: crdtId('gctr', 'result'), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: merged };
}

/** Compute the total value (sum of all node counts). */
export function gCounterValue(state: GCounterState): number {
  return Object.values(state.counts).reduce((sum, v) => sum + v, 0);
}

// ====================================================================
// 2. PN-Counter (Positive-Negative Counter)
// ====================================================================

export interface PNCounterState {
  type: 'pn-counter';
  positive: GCounterState;
  negative: GCounterState;
}

/** Create an empty PN-Counter. */
export function pnCounterCreate(): PNCounterState {
  return { type: 'pn-counter', positive: gCounterCreate(), negative: gCounterCreate() };
}

/** Increment (add 1) on a specific node. */
export function pnCounterIncrement(
  state: PNCounterState,
  nodeId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s: PNCounterState = {
    type: 'pn-counter',
    positive: { type: 'g-counter', counts: { ...state.positive.counts } },
    negative: { type: 'g-counter', counts: { ...state.negative.counts } },
  };

  const prev = s.positive.counts[nodeId] ?? 0;
  s.positive.counts[nodeId] = prev + 1;

  steps.push(
    step(`PN-Counter increment on node '${nodeId}': P[${nodeId}] ${prev} -> ${prev + 1}`, [
      { targetId: crdtId('pn-pos', nodeId), property: 'value', from: prev, to: prev + 1 },
    ]),
  );

  steps.push(
    step(`PN-Counter value = ${pnCounterValue(s)} (P=${gCounterValue(s.positive)}, N=${gCounterValue(s.negative)})`, []),
  );

  return { steps, snapshot: s };
}

/** Decrement (subtract 1) on a specific node. */
export function pnCounterDecrement(
  state: PNCounterState,
  nodeId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s: PNCounterState = {
    type: 'pn-counter',
    positive: { type: 'g-counter', counts: { ...state.positive.counts } },
    negative: { type: 'g-counter', counts: { ...state.negative.counts } },
  };

  const prev = s.negative.counts[nodeId] ?? 0;
  s.negative.counts[nodeId] = prev + 1;

  steps.push(
    step(`PN-Counter decrement on node '${nodeId}': N[${nodeId}] ${prev} -> ${prev + 1}`, [
      { targetId: crdtId('pn-neg', nodeId), property: 'value', from: prev, to: prev + 1 },
    ]),
  );

  steps.push(
    step(`PN-Counter value = ${pnCounterValue(s)} (P=${gCounterValue(s.positive)}, N=${gCounterValue(s.negative)})`, []),
  );

  return { steps, snapshot: s };
}

/** Merge two PN-Counters. */
export function pnCounterMerge(
  a: PNCounterState,
  b: PNCounterState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Merge PN-Counters: merge P and N G-Counters separately`, []));

  // Merge positive G-Counters
  const mergedPos: GCounterState = { type: 'g-counter', counts: {} };
  const posNodes = new Set([...Object.keys(a.positive.counts), ...Object.keys(b.positive.counts)]);
  for (const node of posNodes) {
    const va = a.positive.counts[node] ?? 0;
    const vb = b.positive.counts[node] ?? 0;
    mergedPos.counts[node] = Math.max(va, vb);
    steps.push(
      step(`P['${node}']: max(${va}, ${vb}) = ${mergedPos.counts[node]}`, [
        { targetId: crdtId('pn-pos', node), property: 'value', from: Math.min(va, vb), to: mergedPos.counts[node] },
      ]),
    );
  }

  // Merge negative G-Counters
  const mergedNeg: GCounterState = { type: 'g-counter', counts: {} };
  const negNodes = new Set([...Object.keys(a.negative.counts), ...Object.keys(b.negative.counts)]);
  for (const node of negNodes) {
    const va = a.negative.counts[node] ?? 0;
    const vb = b.negative.counts[node] ?? 0;
    mergedNeg.counts[node] = Math.max(va, vb);
    steps.push(
      step(`N['${node}']: max(${va}, ${vb}) = ${mergedNeg.counts[node]}`, [
        { targetId: crdtId('pn-neg', node), property: 'value', from: Math.min(va, vb), to: mergedNeg.counts[node] },
      ]),
    );
  }

  const merged: PNCounterState = { type: 'pn-counter', positive: mergedPos, negative: mergedNeg };
  const val = pnCounterValue(merged);

  steps.push(
    step(
      `Merged PN-Counter value = ${val} (P=${gCounterValue(mergedPos)}, N=${gCounterValue(mergedNeg)})`,
      [
        { targetId: crdtId('pn', 'result'), property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: merged };
}

/** Compute the value (positive - negative). */
export function pnCounterValue(state: PNCounterState): number {
  return gCounterValue(state.positive) - gCounterValue(state.negative);
}

// ====================================================================
// 3. LWW-Register (Last-Writer-Wins Register)
// ====================================================================

export interface LWWRegisterState {
  type: 'lww-register';
  value: string | number | boolean | null;
  timestamp: number;
}

/** Create an empty LWW-Register. */
export function lwwRegisterCreate(): LWWRegisterState {
  return { type: 'lww-register', value: null, timestamp: 0 };
}

/** Set the register value with a timestamp. */
export function lwwRegisterSet(
  state: LWWRegisterState,
  value: string | number | boolean,
  timestamp: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (timestamp > state.timestamp) {
    const oldVal = state.value;
    const s: LWWRegisterState = { type: 'lww-register', value, timestamp };

    steps.push(
      step(
        `LWW-Register set: timestamp ${timestamp} > ${state.timestamp} -- update '${String(oldVal)}' -> '${String(value)}'`,
        [
          {
            targetId: crdtId('lww', 'value'),
            property: 'value',
            from: String(oldVal ?? 'null'),
            to: String(value),
          },
        ],
      ),
    );

    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `LWW-Register set: timestamp ${timestamp} <= ${state.timestamp} -- stale write ignored (current value: '${String(state.value)}')`,
      [
        {
          targetId: crdtId('lww', 'value'),
          property: 'highlight',
          from: 'default',
          to: 'not-found',
        },
      ],
    ),
  );

  return { steps, snapshot: { ...state } };
}

/** Merge two LWW-Registers (highest timestamp wins). */
export function lwwRegisterMerge(
  a: LWWRegisterState,
  b: LWWRegisterState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(
    step(`Merge LWW-Registers: compare timestamps ${a.timestamp} vs ${b.timestamp}`, []),
  );

  const winner = a.timestamp >= b.timestamp ? a : b;
  const loser = a.timestamp >= b.timestamp ? b : a;

  steps.push(
    step(
      `Winner: timestamp ${winner.timestamp} >= ${loser.timestamp} -- value = '${String(winner.value)}'`,
      [
        {
          targetId: crdtId('lww', 'value'),
          property: 'value',
          from: String(loser.value ?? 'null'),
          to: String(winner.value ?? 'null'),
        },
      ],
    ),
  );

  const merged: LWWRegisterState = { type: 'lww-register', value: winner.value, timestamp: winner.timestamp };

  steps.push(
    step(
      `Merged LWW-Register: value = '${String(merged.value)}', timestamp = ${merged.timestamp}`,
      [
        { targetId: crdtId('lww', 'result'), property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: merged };
}

/** Get the current register value. */
export function lwwRegisterGet(state: LWWRegisterState): string | number | boolean | null {
  return state.value;
}

// ====================================================================
// 4. OR-Set (Observed-Remove Set)
// ====================================================================

/** Each element in the OR-Set is tagged with a unique identifier. */
export interface ORSetEntry {
  element: string;
  /** Unique tag (nodeId + counter for uniqueness). */
  tag: string;
}

export interface ORSetState {
  type: 'or-set';
  /** Set of (element, tag) pairs. */
  entries: ORSetEntry[];
  /** Per-node counters for generating unique tags. */
  counters: Record<string, number>;
}

/** Create an empty OR-Set. */
export function orSetCreate(): ORSetState {
  return { type: 'or-set', entries: [], counters: {} };
}

/** Add an element (tagged with nodeId for uniqueness). */
export function orSetAdd(
  state: ORSetState,
  element: string,
  nodeId: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  const s: ORSetState = {
    type: 'or-set',
    entries: [...state.entries.map((e) => ({ ...e }))],
    counters: { ...state.counters },
  };

  const counter = (s.counters[nodeId] ?? 0) + 1;
  s.counters[nodeId] = counter;
  const tag = `${nodeId}:${counter}`;

  s.entries.push({ element, tag });

  steps.push(
    step(`OR-Set add '${element}' with tag '${tag}'`, [
      {
        targetId: crdtId('orset', tag),
        property: 'highlight',
        from: 'default',
        to: 'inserting',
      },
    ]),
  );

  const elems = orSetElements(s);
  steps.push(
    step(`OR-Set elements: {${elems.join(', ')}}`, []),
  );

  return { steps, snapshot: s };
}

/** Remove an element (removes all tags for that element). */
export function orSetRemove(
  state: ORSetState,
  element: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  const removedTags = state.entries
    .filter((e) => e.element === element)
    .map((e) => e.tag);

  const s: ORSetState = {
    type: 'or-set',
    entries: state.entries.filter((e) => e.element !== element).map((e) => ({ ...e })),
    counters: { ...state.counters },
  };

  if (removedTags.length === 0) {
    steps.push(
      step(`OR-Set remove '${element}': not found -- no-op`, []),
    );
  } else {
    steps.push(
      step(`OR-Set remove '${element}': removing ${removedTags.length} tag(s) [${removedTags.join(', ')}]`, [
        ...removedTags.map((tag) => ({
          targetId: crdtId('orset', tag),
          property: 'highlight' as const,
          from: 'default' as const,
          to: 'deleting' as const,
        })),
      ]),
    );
  }

  const elems = orSetElements(s);
  steps.push(
    step(`OR-Set elements: {${elems.join(', ')}}`, []),
  );

  return { steps, snapshot: s };
}

/**
 * Merge two OR-Sets.
 * Union of entries, but if an element was removed from one side
 * (tag absent), those tags stay removed.
 * Standard OR-Set merge: entries = (A.entries union B.entries).
 */
export function orSetMerge(
  a: ORSetState,
  b: ORSetState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Merge OR-Sets: union of all (element, tag) pairs`, []));

  // Union by tag (tags are globally unique)
  const tagMap = new Map<string, ORSetEntry>();

  for (const entry of a.entries) {
    tagMap.set(entry.tag, { ...entry });
    steps.push(
      step(`From A: '${entry.element}' [${entry.tag}]`, [
        { targetId: crdtId('orset', entry.tag), property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
  }

  for (const entry of b.entries) {
    if (!tagMap.has(entry.tag)) {
      tagMap.set(entry.tag, { ...entry });
      steps.push(
        step(`From B (new): '${entry.element}' [${entry.tag}]`, [
          { targetId: crdtId('orset', entry.tag), property: 'highlight', from: 'default', to: 'inserting' },
        ]),
      );
    } else {
      steps.push(
        step(`From B (dup): '${entry.element}' [${entry.tag}] -- already present`, [
          { targetId: crdtId('orset', entry.tag), property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
    }
  }

  // Merge counters (take max)
  const mergedCounters: Record<string, number> = {};
  const allCounterNodes = new Set([...Object.keys(a.counters), ...Object.keys(b.counters)]);
  for (const node of allCounterNodes) {
    mergedCounters[node] = Math.max(a.counters[node] ?? 0, b.counters[node] ?? 0);
  }

  const merged: ORSetState = {
    type: 'or-set',
    entries: Array.from(tagMap.values()),
    counters: mergedCounters,
  };

  const elems = orSetElements(merged);
  steps.push(
    step(`Merged OR-Set elements: {${elems.join(', ')}}  (${merged.entries.length} tagged entries)`, [
      { targetId: crdtId('orset', 'result'), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: merged };
}

/** Get the set of distinct elements. */
export function orSetElements(state: ORSetState): string[] {
  return [...new Set(state.entries.map((e) => e.element))].sort();
}
