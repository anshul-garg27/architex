// -----------------------------------------------------------------
// Architex -- Disjoint Set / Union-Find  (DST-021)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface DSUElement {
  id: string;
  value: number;
  parent: string;   // self-referencing means root
  rank: number;
}

export interface DisjointSetState {
  elements: Map<string, DSUElement>;
  size: number;
}

function elemId(value: number): string {
  return `dsu-${value}`;
}

export function createDisjointSet(): DisjointSetState {
  return { elements: new Map(), size: 0 };
}

export function cloneDisjointSet(state: DisjointSetState): DisjointSetState {
  const elements = new Map<string, DSUElement>();
  for (const [id, elem] of state.elements) {
    elements.set(id, { ...elem });
  }
  return { ...state, elements };
}

/** Make a new singleton set for the given value. */
export function dsuMakeSet(state: DisjointSetState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDisjointSet(state);

  const id = elemId(value);
  if (s.elements.has(id)) {
    steps.push(step(`Element ${value} already exists`, []));
    return { steps, snapshot: s };
  }

  s.elements.set(id, { id, value, parent: id, rank: 0 });
  s.size++;

  steps.push(
    step(`MakeSet(${value}): create singleton {${value}}`, [
      { targetId: id, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  return { steps, snapshot: s };
}

/** Find with path compression and step recording. */
export function dsuFind(state: DisjointSetState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDisjointSet(state);

  const id = elemId(value);
  if (!s.elements.has(id)) {
    steps.push(step(`Element ${value} not found`, []));
    return { steps, snapshot: s };
  }

  steps.push(step(`Find(${value}): traverse to root`, []));

  // Collect path to root
  const path: string[] = [];
  let currentId = id;
  while (true) {
    const elem = s.elements.get(currentId)!;
    path.push(currentId);
    steps.push(
      step(`Visit ${elem.value} (parent: ${s.elements.get(elem.parent)!.value})`, [
        { targetId: currentId, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
    if (elem.parent === currentId) break;
    currentId = elem.parent;
  }

  const rootId = currentId;
  const rootVal = s.elements.get(rootId)!.value;

  steps.push(
    step(`Root is ${rootVal}`, [
      { targetId: rootId, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  // Path compression
  if (path.length > 2) {
    steps.push(step(`Path compression: point all nodes directly to root ${rootVal}`, []));
    for (const nid of path) {
      if (nid !== rootId) {
        const elem = s.elements.get(nid)!;
        if (elem.parent !== rootId) {
          elem.parent = rootId;
          steps.push(
            step(`Set parent of ${elem.value} to ${rootVal}`, [
              { targetId: nid, property: 'highlight', from: 'default', to: 'shifting' },
            ]),
          );
        }
      }
    }
  }

  steps.push(
    step(`Find(${value}) = ${rootVal}`, [
      { targetId: rootId, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

/** Union by rank with step recording. */
export function dsuUnion(state: DisjointSetState, a: number, b: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDisjointSet(state);

  const idA = elemId(a);
  const idB = elemId(b);

  // Auto-create elements if they don't exist
  if (!s.elements.has(idA)) {
    s.elements.set(idA, { id: idA, value: a, parent: idA, rank: 0 });
    s.size++;
    steps.push(
      step(`MakeSet(${a})`, [
        { targetId: idA, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
  }
  if (!s.elements.has(idB)) {
    s.elements.set(idB, { id: idB, value: b, parent: idB, rank: 0 });
    s.size++;
    steps.push(
      step(`MakeSet(${b})`, [
        { targetId: idB, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
  }

  // Find root of a
  steps.push(step(`Find root of ${a}`, []));
  let rootA = idA;
  while (s.elements.get(rootA)!.parent !== rootA) {
    const elem = s.elements.get(rootA)!;
    steps.push(
      step(`${elem.value} -> parent ${s.elements.get(elem.parent)!.value}`, [
        { targetId: rootA, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
    rootA = elem.parent;
  }
  steps.push(
    step(`Root of ${a} is ${s.elements.get(rootA)!.value}`, [
      { targetId: rootA, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  // Find root of b
  steps.push(step(`Find root of ${b}`, []));
  let rootB = idB;
  while (s.elements.get(rootB)!.parent !== rootB) {
    const elem = s.elements.get(rootB)!;
    steps.push(
      step(`${elem.value} -> parent ${s.elements.get(elem.parent)!.value}`, [
        { targetId: rootB, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
    rootB = elem.parent;
  }
  steps.push(
    step(`Root of ${b} is ${s.elements.get(rootB)!.value}`, [
      { targetId: rootB, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  // Already in same set?
  if (rootA === rootB) {
    steps.push(
      step(`${a} and ${b} are already in the same set`, [
        { targetId: rootA, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
    return { steps, snapshot: s };
  }

  // Union by rank
  const rankA = s.elements.get(rootA)!.rank;
  const rankB = s.elements.get(rootB)!.rank;

  if (rankA < rankB) {
    s.elements.get(rootA)!.parent = rootB;
    steps.push(
      step(`Rank(${s.elements.get(rootA)!.value})=${rankA} < Rank(${s.elements.get(rootB)!.value})=${rankB}: attach ${s.elements.get(rootA)!.value} under ${s.elements.get(rootB)!.value}`, [
        { targetId: rootA, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: rootB, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  } else if (rankA > rankB) {
    s.elements.get(rootB)!.parent = rootA;
    steps.push(
      step(`Rank(${s.elements.get(rootA)!.value})=${rankA} > Rank(${s.elements.get(rootB)!.value})=${rankB}: attach ${s.elements.get(rootB)!.value} under ${s.elements.get(rootA)!.value}`, [
        { targetId: rootB, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: rootA, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  } else {
    s.elements.get(rootB)!.parent = rootA;
    s.elements.get(rootA)!.rank++;
    steps.push(
      step(`Equal rank=${rankA}: attach ${s.elements.get(rootB)!.value} under ${s.elements.get(rootA)!.value}, increment rank to ${rankA + 1}`, [
        { targetId: rootB, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: rootA, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  // Path compression on both paths — use the unified root after union
  const unifiedRoot = rankA < rankB ? rootB : rootA;
  const compressPath = (startId: string, rootId: string) => {
    let cId = startId;
    while (cId !== rootId) {
      const elem = s.elements.get(cId)!;
      const nextId = elem.parent;
      elem.parent = rootId;
      cId = nextId;
    }
  };
  compressPath(idA, unifiedRoot);
  compressPath(idB, unifiedRoot);

  steps.push(
    step(`Union(${a}, ${b}) complete`, []),
  );

  return { steps, snapshot: s };
}

/** Batch union from pairs, useful for "unionFind" demonstration. */
export function dsuUnionBatch(
  state: DisjointSetState,
  pairs: [number, number][],
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  let s = cloneDisjointSet(state);
  let batchStepId = 0;

  steps.push(step(`Process ${pairs.length} union operations`, []));
  batchStepId = steps.length;

  for (const [a, b] of pairs) {
    const result = dsuUnion(s, a, b);
    // Merge steps (offset ids)
    for (const st of result.steps) {
      steps.push({ ...st, id: batchStepId++ });
    }
    s = result.snapshot as DisjointSetState;
  }

  steps.push(step(`All unions complete. ${s.size} elements.`, []));
  return { steps, snapshot: s };
}

/** Utility: get all sets as arrays of values (for visualization). */
export function dsuGetSets(state: DisjointSetState): number[][] {
  const rootMap = new Map<string, number[]>();

  for (const [, elem] of state.elements) {
    // Find root without modifying state
    let rootId = elem.id;
    while (state.elements.get(rootId)!.parent !== rootId) {
      rootId = state.elements.get(rootId)!.parent;
    }
    if (!rootMap.has(rootId)) rootMap.set(rootId, []);
    rootMap.get(rootId)!.push(elem.value);
  }

  return [...rootMap.values()].map((arr) => arr.sort((a, b) => a - b));
}
