// -----------------------------------------------------------------
// Architex -- Count-Min Sketch with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const COUNT_MIN_SKETCH_CONFIG: AlgorithmConfig = {
  id: 'count-min-sketch',
  name: 'Count-Min Sketch',
  category: 'sorting',
  timeComplexity: { best: 'O(d)', average: 'O(d)', worst: 'O(d)' },
  spaceComplexity: 'O(w * d)',
  stable: false,
  inPlace: false,
  description:
    "How does Twitter count trending hashtags from billions of tweets without storing each one? A Count-Min Sketch uses a 2D grid of counters with multiple hash functions. Insert: hash the item, increment counters. Query: hash and take the MINIMUM counter (overcounting possible, undercounting impossible). Used in: network traffic monitoring, database query optimization, streaming analytics.",
  pseudocode: [
    'procedure cmsInsert(sketch, item)',
    '  for i = 0 to d - 1 do',
    '    j = hash_i(item) mod w',
    '    sketch[i][j] = sketch[i][j] + 1',
    '',
    'procedure cmsQuery(sketch, item)',
    '  minCount = infinity',
    '  for i = 0 to d - 1 do',
    '    j = hash_i(item) mod w',
    '    minCount = min(minCount, sketch[i][j])',
    '  return minCount',
    '',
    '// d = number of hash functions (rows)',
    '// w = number of counters per row (columns)',
    '// Error: count <= true + epsilon * N',
  ],
  complexityIntuition:
    'Each insert or query uses d hash functions, each touching one counter \u2014 O(d) time. The grid size w * d is fixed, so memory stays constant regardless of how many items you count. More rows (d) and columns (w) reduce error probability and magnitude.',
  difficulty: 'advanced',
  whenToUse:
    'Use when you need approximate frequency counts for a massive stream of items where exact counting would require too much memory. Perfect for top-K heavy hitters, frequency thresholds, and anomaly detection.',
  commonMistakes: [
    'Taking MAX instead of MIN during query \u2014 MIN is correct because overcounting is the only error direction.',
    'Using too few columns (w) \u2014 increases collision rate and overcounting.',
    'Assuming exact counts \u2014 CMS always returns count >= true count, never less.',
  ],
};

// -- Hash functions -----------------------------------------------

/** Simple hash: sum of char codes * (row + 1) mod w */
function hashFn(s: string, row: number, w: number): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i) * (row + 1)) & 0x7fffffff;
  }
  return hash % w;
}

// -- Defaults -----------------------------------------------------

const DEFAULT_W = 10; // columns
const DEFAULT_D = 3;  // rows (hash functions)
const DEFAULT_INSERTS = ['hello', 'world', 'hello', 'sketch', 'hello', 'world', 'count', 'sketch', 'hello'];
const DEFAULT_QUERIES = ['hello', 'world', 'missing', 'sketch'];

// -- Main algorithm -----------------------------------------------

/**
 * Demonstrates Count-Min Sketch insert and query operations with step recording.
 *
 * @param arr - Array of numbers (used for engine compatibility)
 * @param inserts - Strings to insert into the sketch
 * @param queries - Strings to query after building
 * @param w - Width (columns) of the sketch
 * @param d - Depth (rows / hash functions) of the sketch
 * @returns AlgorithmResult with animation steps
 */
export function countMinSketch(
  arr: number[],
  inserts: string[] = DEFAULT_INSERTS,
  queries: string[] = DEFAULT_QUERIES,
  w: number = DEFAULT_W,
  d: number = DEFAULT_D,
): AlgorithmResult {
  // Initialize the 2D grid
  const grid: number[][] = [];
  for (let i = 0; i < d; i++) {
    grid.push(new Array(w).fill(0));
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let writes = 0;

  // Helper: build mutations showing the current grid state with highlights
  function gridMutations(highlightCells: [number, number][], mode: 'active' | 'found' | 'comparing'): VisualMutation[] {
    const muts: VisualMutation[] = [];
    const highlightSet = new Set(highlightCells.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < d; r++) {
      for (let c = 0; c < w; c++) {
        const cellIdx = r * w + c;
        const isHighlighted = highlightSet.has(`${r},${c}`);
        muts.push({
          targetId: `element-${cellIdx}`,
          property: 'highlight',
          from: 'default',
          to: isHighlighted ? mode : (grid[r][c] > 0 ? 'sorted' : 'default'),
          easing: isHighlighted ? 'spring' : 'ease-out',
        });
      }
    }
    return muts;
  }

  // Step 0: overview
  steps.push({
    id: stepId++,
    description:
      `Count-Min Sketch with ${d} hash functions and ${w} columns (${d}x${w} = ${d * w} counters). We will insert ${inserts.length} items, then query ${queries.length} items. All counters start at 0.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 700,
  });

  // ---- INSERT phase ----
  const trueCounts: Record<string, number> = {};

  for (let insIdx = 0; insIdx < inserts.length; insIdx++) {
    const item = inserts[insIdx];
    trueCounts[item] = (trueCounts[item] || 0) + 1;

    const cells: [number, number][] = [];
    for (let r = 0; r < d; r++) {
      const c = hashFn(item, r, w);
      cells.push([r, c]);
    }

    // Show hash positions
    const hashDesc = cells.map(([r, c]) => `h${r + 1}="${item}" -> col ${c}`).join(', ');
    reads += d;

    steps.push({
      id: stepId++,
      description:
        `INSERT "${item}" (occurrence #${trueCounts[item]}): ${hashDesc}. Increment these ${d} counters.`,
      pseudocodeLine: 1,
      mutations: gridMutations(cells, 'active'),
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 400,
    });

    // Increment counters
    for (const [r, c] of cells) {
      grid[r][c]++;
      writes++;
    }

    // Show updated grid
    const counterVals = cells.map(([r, c]) => `grid[${r}][${c}] = ${grid[r][c]}`).join(', ');
    steps.push({
      id: stepId++,
      description:
        `Counters incremented: ${counterVals}. True count of "${item}" is ${trueCounts[item]}.`,
      pseudocodeLine: 3,
      mutations: gridMutations(cells, 'found'),
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 350,
    });
  }

  // Summary after inserts
  const uniqueItems = Object.keys(trueCounts);
  const truthStr = uniqueItems.map(k => `"${k}":${trueCounts[k]}`).join(', ');
  steps.push({
    id: stepId++,
    description:
      `All ${inserts.length} inserts done. True counts: {${truthStr}}. Now query the sketch \u2014 take the MINIMUM counter across all rows for each item.`,
    pseudocodeLine: 4,
    mutations: gridMutations([], 'found'),
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 500,
  });

  // ---- QUERY phase ----
  for (const item of queries) {
    const cells: [number, number][] = [];
    const counterValues: number[] = [];

    for (let r = 0; r < d; r++) {
      const c = hashFn(item, r, w);
      cells.push([r, c]);
      counterValues.push(grid[r][c]);
      reads++;
    }

    const hashDesc = cells.map(([r, c], i) => `h${r + 1} -> col ${c} (=${counterValues[i]})`).join(', ');

    steps.push({
      id: stepId++,
      description:
        `QUERY "${item}": ${hashDesc}. Take the minimum.`,
      pseudocodeLine: 5,
      mutations: gridMutations(cells, 'comparing'),
      complexity: { comparisons: d, swaps: 0, reads, writes },
      duration: 400,
    });

    const estimate = Math.min(...counterValues);
    const trueCount = trueCounts[item] || 0;
    const accurate = estimate === trueCount;

    steps.push({
      id: stepId++,
      description: accurate
        ? `min(${counterValues.join(', ')}) = ${estimate}. True count of "${item}" is ${trueCount}. Exact match! No collisions inflated these counters.`
        : trueCount === 0
          ? `min(${counterValues.join(', ')}) = ${estimate}. "${item}" was never inserted, but estimate is ${estimate} \u2014 ${estimate > 0 ? 'overcounting from hash collisions with other items' : 'correctly zero'}.`
          : `min(${counterValues.join(', ')}) = ${estimate}. True count is ${trueCount}. Overcount of ${estimate - trueCount} from hash collisions \u2014 CMS guarantee: estimate >= true count, never less.`,
      pseudocodeLine: 9,
      mutations: gridMutations(cells, accurate ? 'found' : 'active'),
      complexity: { comparisons: d, swaps: 0, reads, writes },
      duration: 450,
    });
  }

  // Final step
  const totalCounters = d * w;
  const nonZero = grid.flat().filter(v => v > 0).length;
  const fillRate = ((nonZero / totalCounters) * 100).toFixed(0);

  steps.push({
    id: stepId++,
    description:
      `Done! ${nonZero}/${totalCounters} counters are non-zero (${fillRate}% fill). Higher fill = more collisions = more overcounting. Increase w (columns) to reduce error.`,
    pseudocodeLine: 14,
    mutations: gridMutations([], 'found'),
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 600,
  });

  // Encode grid as flat array for finalState
  return { config: COUNT_MIN_SKETCH_CONFIG, steps, finalState: grid.flat() };
}
