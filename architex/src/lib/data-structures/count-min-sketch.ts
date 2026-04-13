// -----------------------------------------------------------------
// Architex -- Count-Min Sketch Simulation  (DST-017)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface CountMinSketchState {
  matrix: number[][];   // d rows × w columns
  d: number;            // number of hash functions (rows)
  w: number;            // number of columns
  n: number;            // total insertions
  insertedItems: { element: string; trueCount: number }[];
}

/**
 * Generate d independent hash values for a string, each in [0, w).
 * Uses a double-hashing scheme: h_i(x) = (h1(x) + i * h2(x)) mod w
 */
function hashFunctions(element: string, d: number, w: number): number[] {
  // h1: djb2-like hash
  let h1 = 5381;
  for (let i = 0; i < element.length; i++) {
    h1 = ((h1 << 5) + h1 + element.charCodeAt(i)) & 0x7fffffff;
  }
  h1 = h1 % w;

  // h2: sdbm-like hash
  let h2 = 0;
  for (let i = 0; i < element.length; i++) {
    h2 = (element.charCodeAt(i) + (h2 << 6) + (h2 << 16) - h2) & 0x7fffffff;
  }
  h2 = (h2 % (w - 1)) + 1; // ensure h2 is in [1, w-1]

  const hashes: number[] = [];
  for (let i = 0; i < d; i++) {
    hashes.push(Math.abs((h1 + i * h2) % w));
  }
  return hashes;
}

/**
 * Error bound: with probability 1 - delta, the error is at most epsilon * n
 * where epsilon = e / w and delta = 1 / e^d
 */
export function cmsErrorBound(w: number, n: number): number {
  // epsilon = e / w, error bound = epsilon * n
  return (Math.E / w) * n;
}

// ── Create ──────────────────────────────────────────────────

export function createCountMinSketch(d: number = 4, w: number = 16): CountMinSketchState {
  return {
    matrix: Array.from({ length: d }, () => Array.from({ length: w }, () => 0)),
    d,
    w,
    n: 0,
    insertedItems: [],
  };
}

function cloneSketch(sketch: CountMinSketchState): CountMinSketchState {
  return {
    ...sketch,
    matrix: sketch.matrix.map((row) => [...row]),
    insertedItems: sketch.insertedItems.map((item) => ({ ...item })),
  };
}

// ── Insert (Update) ────────────────────────────────────────

export function cmsInsert(
  sketch: CountMinSketchState,
  element: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneSketch(sketch);

  steps.push(step(`Insert "${element}" into Count-Min Sketch`, []));

  const hashes = hashFunctions(element, copy.d, copy.w);

  for (let row = 0; row < hashes.length; row++) {
    const col = hashes[row];
    const oldVal = copy.matrix[row][col];
    copy.matrix[row][col] = oldVal + 1;
    steps.push(
      step(
        `h${row}("${element}") = ${col} -- increment cell[${row}][${col}] from ${oldVal} to ${oldVal + 1}`,
        [
          { targetId: `cell-${row}-${col}`, property: 'highlight', from: 'default', to: 'inserting' },
          { targetId: `hash-${row}`, property: 'arrow', from: 'none', to: String(col) },
        ],
      ),
    );
  }

  copy.n++;

  // Update or add to insertedItems
  const existing = copy.insertedItems.find((item) => item.element === element);
  if (existing) {
    existing.trueCount++;
  } else {
    copy.insertedItems.push({ element, trueCount: 1 });
  }

  const errBound = cmsErrorBound(copy.w, copy.n);
  steps.push(
    step(
      `Inserted "${element}". Total insertions: ${copy.n}, error bound: +${errBound.toFixed(1)}`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── Query ───────────────────────────────────────────────────

export function cmsQuery(
  sketch: CountMinSketchState,
  element: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Query frequency of "${element}"`, []));

  const hashes = hashFunctions(element, sketch.d, sketch.w);
  let minCount = Infinity;

  for (let row = 0; row < hashes.length; row++) {
    const col = hashes[row];
    const val = sketch.matrix[row][col];
    if (val < minCount) minCount = val;

    steps.push(
      step(
        `h${row}("${element}") = ${col} -- cell[${row}][${col}] = ${val}`,
        [
          { targetId: `cell-${row}-${col}`, property: 'highlight', from: 'default', to: 'found' },
          { targetId: `hash-${row}`, property: 'arrow', from: 'none', to: String(col) },
        ],
      ),
    );
  }

  const trueItem = sketch.insertedItems.find((item) => item.element === element);
  const trueCount = trueItem?.trueCount ?? 0;
  const errBound = cmsErrorBound(sketch.w, sketch.n);

  steps.push(
    step(
      `Estimated frequency: min(${hashes.map((col, row) => sketch.matrix[row][col]).join(', ')}) = ${minCount}. True count: ${trueCount}. Error bound: +${errBound.toFixed(1)}`,
      [],
    ),
  );

  return { steps, snapshot: sketch };
}
