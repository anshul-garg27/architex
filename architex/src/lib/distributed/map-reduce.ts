// ─────────────────────────────────────────────────────────────
// Architex — MapReduce Simulation  [DIS-019]
// ─────────────────────────────────────────────────────────────
//
// Simulates a MapReduce word-count job:
//   1. Split  – input text is divided into chunks
//   2. Map    – each chunk produces (word, 1) pairs
//   3. Shuffle – pairs are grouped by key
//   4. Reduce – each group is summed
//   5. Output – final word counts
// ─────────────────────────────────────────────────────────────

/** A single step in the MapReduce simulation (discriminated union by phase). */
export type MRStep =
  | { phase: 'split'; tick: number; description: string;
      chunks: string[]; chunkCount: number; totalWords: number }
  | { phase: 'map'; tick: number; description: string;
      chunkIndex: number; input: string; pairs: string[] }
  | { phase: 'shuffle'; tick: number; description: string;
      groups: Record<string, number[]>; uniqueKeys: number }
  | { phase: 'reduce'; tick: number; description: string;
      reduced: Record<string, number> }
  | { phase: 'output'; tick: number; description: string;
      counts: Record<string, number>; topWords: string[] };

/**
 * Simulates a MapReduce word-count job on the given input text.
 *
 * The text is split into chunks (one per line, or groups of words
 * when the input is a single line). Each chunk is mapped, keys are
 * shuffled, and then reduced to produce final word counts.
 *
 * @param inputText - Plain text to process.
 * @returns An array of {@link MRStep} objects describing each phase.
 *
 * @example
 * ```ts
 * const steps = simulateMapReduce("hello world hello");
 * // split → map → shuffle → reduce → output
 * ```
 */
export function simulateMapReduce(inputText: string): MRStep[] {
  const steps: MRStep[] = [];
  let tick = 0;

  // Normalise input
  const text = inputText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (text.length === 0) {
    steps.push({
      tick: tick++,
      phase: 'output',
      counts: {},
      topWords: [],
      description: 'Empty input — nothing to process.',
    });
    return steps;
  }

  const words = text.split(/\s+/).filter(Boolean);

  // ── 1. Split ───────────────────────────────────────────────
  // Divide words into roughly equal chunks (2-4 chunks)
  const chunkCount = Math.min(Math.max(2, Math.ceil(words.length / 3)), 4);
  const chunks: string[][] = [];
  const chunkSize = Math.ceil(words.length / chunkCount);
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  steps.push({
    tick: tick++,
    phase: 'split',
    chunks: chunks.map((c) => c.join(' ')),
    chunkCount: chunks.length,
    totalWords: words.length,
    description: `Split input into ${chunks.length} chunks (${words.length} words total).`,
  });

  // ── 2. Map ─────────────────────────────────────────────────
  // Each chunk produces (word, 1) pairs
  const mapOutputs: Array<Array<[string, number]>> = [];
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const pairs: Array<[string, number]> = chunk.map((w) => [w, 1]);
    mapOutputs.push(pairs);

    steps.push({
      tick: tick++,
      phase: 'map',
      chunkIndex: ci,
      input: chunk.join(' '),
      pairs: pairs.map(([k, v]) => `(${k}, ${v})`),
      description: `Mapper ${ci}: emit ${pairs.length} pairs from chunk "${chunk.slice(0, 4).join(' ')}${chunk.length > 4 ? '...' : ''}".`,
    });
  }

  // ── 3. Shuffle ─────────────────────────────────────────────
  // Group all pairs by key
  const grouped: Record<string, number[]> = {};
  for (const pairs of mapOutputs) {
    for (const [word, count] of pairs) {
      if (!grouped[word]) grouped[word] = [];
      grouped[word].push(count);
    }
  }

  steps.push({
    tick: tick++,
    phase: 'shuffle',
    groups: Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, v]),
    ),
    uniqueKeys: Object.keys(grouped).length,
    description: `Shuffle: grouped into ${Object.keys(grouped).length} unique keys.`,
  });

  // ── 4. Reduce ──────────────────────────────────────────────
  const reduced: Record<string, number> = {};
  for (const [word, counts] of Object.entries(grouped)) {
    reduced[word] = counts.reduce((a, b) => a + b, 0);
  }

  steps.push({
    tick: tick++,
    phase: 'reduce',
    reduced,
    description: `Reduce: summed counts for ${Object.keys(reduced).length} keys.`,
  });

  // ── 5. Output ──────────────────────────────────────────────
  // Sort by count descending
  const sorted = Object.entries(reduced).sort((a, b) => b[1] - a[1]);

  steps.push({
    tick: tick++,
    phase: 'output',
    counts: Object.fromEntries(sorted),
    topWords: sorted.slice(0, 10).map(([w, c]) => `${w}: ${c}`),
    description: `Output: ${sorted.length} unique words. Top: ${sorted.slice(0, 5).map(([w, c]) => `${w}(${c})`).join(', ')}.`,
  });

  return steps;
}
