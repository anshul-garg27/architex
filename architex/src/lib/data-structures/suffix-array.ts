// -----------------------------------------------------------------
// Architex -- Suffix Array Data Structure  (DST-138)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// A suffix array is the sorted array of all suffixes of a string, stored as starting
// indices. It enables O(m log n) pattern search (m = pattern length, n = text length)
// and O(n) longest repeated substring via the LCP array. Suffix arrays use far less
// memory than suffix trees while supporting the same queries — this is why they replaced
// suffix trees in most modern bioinformatics and search tools.

// ── Types ──────────────────────────────────────────────────

export interface SuffixArrayState {
  text: string;
  suffixes: { index: number; suffix: string }[];
  lcpArray: number[];
}

// ── Helpers ────────────────────────────────────────────────

function cloneSA(state: SuffixArrayState): SuffixArrayState {
  return {
    text: state.text,
    suffixes: state.suffixes.map((s) => ({ ...s })),
    lcpArray: [...state.lcpArray],
  };
}

/** Compute the longest common prefix length between two strings. */
function lcpLength(a: string, b: string): number {
  let len = 0;
  const limit = Math.min(a.length, b.length);
  while (len < limit && a[len] === b[len]) {
    len++;
  }
  return len;
}

// ── Build ──────────────────────────────────────────────────

// WHY naive O(n^2 log n) construction: For educational clarity, we extract all
// suffixes and sort them lexicographically. Production implementations (SA-IS, DC3)
// achieve O(n) but are far harder to visualize step-by-step. The sorted order is what
// makes binary search possible, and the LCP array enables O(n) repeated substring queries.
export function createSuffixArray(text: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (text.length === 0) {
    const empty: SuffixArrayState = { text: '', suffixes: [], lcpArray: [] };
    steps.push(step('Empty text -- nothing to build.', []));
    return { steps, snapshot: empty };
  }

  // Step 1: Extract all suffixes
  const suffixes: { index: number; suffix: string }[] = [];
  const suffixList: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const suffix = text.slice(i);
    suffixes.push({ index: i, suffix });
    suffixList.push(`'${suffix}'(${i})`);
  }

  steps.push(
    step(`Building suffix array for '${text}'. Extract all ${text.length} suffixes: ${suffixList.join(', ')}. Each suffix starts at a different position in the text.`, [
      { targetId: 'sa-text', property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  // Step 2: Sort lexicographically
  suffixes.sort((a, b) => {
    if (a.suffix < b.suffix) return -1;
    if (a.suffix > b.suffix) return 1;
    return 0;
  });

  const sortedList = suffixes.map((s) => `'${s.suffix}'(${s.index})`).join(', ');

  steps.push(
    step(`After sorting lexicographically: ${sortedList}. The sorted order enables O(log n) binary search for any pattern -- all suffixes starting with the same prefix are adjacent.`, [
      { targetId: 'sa-sorted', property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  // Step 3: Compute LCP array
  // WHY the LCP array: The LCP (Longest Common Prefix) array stores the length of
  // the shared prefix between consecutive suffixes in sorted order. This is the key
  // to finding the longest repeated substring in O(n) -- just find the max LCP value.
  // It also speeds up binary search (LCP-aware search avoids redundant comparisons).
  const lcpArray: number[] = [];

  steps.push(
    step(`Computing LCP (Longest Common Prefix) array. For each pair of adjacent sorted suffixes, count how many leading characters they share. The max LCP value reveals the longest repeated substring.`, []),
  );

  for (let i = 0; i < suffixes.length; i++) {
    if (i === 0) {
      lcpArray.push(0);
      steps.push(
        step(`LCP[0] = 0 (no predecessor for the first suffix '${suffixes[0].suffix}').`, [
          { targetId: `sa-${0}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
    } else {
      const lcp = lcpLength(suffixes[i - 1].suffix, suffixes[i].suffix);
      lcpArray.push(lcp);

      const prev = suffixes[i - 1].suffix;
      const curr = suffixes[i].suffix;
      const shared = lcp > 0 ? `'${curr.slice(0, lcp)}'` : '(none)';

      steps.push(
        step(`LCP[${i}]: compare '${prev}' and '${curr}' -- shared prefix = ${shared}, length = ${lcp}.`, [
          { targetId: `sa-${i - 1}`, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: `sa-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
    }
  }

  const state: SuffixArrayState = { text, suffixes, lcpArray };

  steps.push(
    step(`Suffix array built. ${suffixes.length} suffixes sorted. LCP array: [${lcpArray.join(', ')}]. Ready for O(m log n) pattern search and O(n) longest repeated substring.`, [
      { targetId: 'sa-text', property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: state };
}

// ── Search ─────────────────────────────────────────────────

// WHY binary search works: Because the suffix array is sorted lexicographically,
// all suffixes starting with a given pattern form a contiguous range. We binary
// search for the first and last occurrence, giving O(m log n) search where
// m = pattern length and n = text length.
export function saSearch(
  state: SuffixArrayState,
  pattern: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSA(state);

  if (pattern.length === 0) {
    steps.push(step('Empty pattern -- matches everything trivially.', []));
    return { steps, snapshot: s };
  }

  if (s.suffixes.length === 0) {
    steps.push(step('Suffix array is empty -- no matches.', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Search for pattern '${pattern}' in suffix array of '${s.text}'. Binary search on ${s.suffixes.length} sorted suffixes -- O(m log n) where m = ${pattern.length}, n = ${s.suffixes.length}.`, []),
  );

  // Binary search for the first occurrence
  let lo = 0;
  let hi = s.suffixes.length - 1;
  let firstMatch = -1;

  steps.push(
    step(`Phase 1: Find the leftmost suffix starting with '${pattern}'. Binary search range [${lo}, ${hi}].`, []),
  );

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const suffix = s.suffixes[mid].suffix;
    const prefix = suffix.slice(0, pattern.length);
    const cmp = prefix < pattern ? -1 : prefix > pattern ? 1 : 0;

    steps.push(
      step(`mid = ${mid}: suffix '${suffix}' prefix '${prefix}' vs '${pattern}' -> ${cmp === 0 ? 'MATCH' : cmp < 0 ? 'too small, go right' : 'too large, go left'}.`, [
        { targetId: `sa-${mid}`, property: 'highlight', from: 'default', to: cmp === 0 ? 'found' : 'comparing' },
      ]),
    );

    if (cmp >= 0) {
      if (cmp === 0) firstMatch = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  if (firstMatch === -1) {
    steps.push(
      step(`Pattern '${pattern}' not found in any suffix. No occurrences in '${s.text}'.`, []),
    );
    return { steps, snapshot: s };
  }

  // Binary search for the last occurrence
  lo = firstMatch;
  hi = s.suffixes.length - 1;
  let lastMatch = firstMatch;

  steps.push(
    step(`Phase 2: Find the rightmost suffix starting with '${pattern}'. Binary search range [${lo}, ${hi}].`, []),
  );

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const suffix = s.suffixes[mid].suffix;
    const prefix = suffix.slice(0, pattern.length);
    const cmp = prefix < pattern ? -1 : prefix > pattern ? 1 : 0;

    if (cmp <= 0) {
      if (cmp === 0) lastMatch = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const positions = s.suffixes
    .slice(firstMatch, lastMatch + 1)
    .map((sf) => sf.index)
    .sort((a, b) => a - b);

  steps.push(
    step(`Found '${pattern}' at ${positions.length} position(s) in '${s.text}': indices [${positions.join(', ')}]. Suffix array range [${firstMatch}, ${lastMatch}] -- all suffixes in this range start with '${pattern}'.`, [
      ...positions.map((pos, i) => ({
        targetId: `sa-match-${i}`,
        property: 'highlight' as const,
        from: 'default' as const,
        to: 'found' as const,
      })),
    ]),
  );

  return { steps, snapshot: s };
}

// ── Longest Repeated Substring ─────────────────────────────

// WHY this is O(n): The longest repeated substring is simply the max value in the
// LCP array. Since adjacent sorted suffixes with a long common prefix represent
// repeated substrings in the original text, we just scan the LCP array once.
// Without a suffix array, this problem requires O(n^2) or suffix tree construction.
export function saLongestRepeated(state: SuffixArrayState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSA(state);

  if (s.suffixes.length <= 1) {
    steps.push(
      step(`Text '${s.text}' is too short for repeated substrings.`, []),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Find the longest repeated substring in '${s.text}'. Scan the LCP array [${s.lcpArray.join(', ')}] for the maximum value -- that corresponds to the longest shared prefix between adjacent sorted suffixes.`, []),
  );

  let maxLCP = 0;
  let maxIdx = 0;

  for (let i = 1; i < s.lcpArray.length; i++) {
    const lcp = s.lcpArray[i];
    const prev = s.suffixes[i - 1].suffix;
    const curr = s.suffixes[i].suffix;
    const shared = lcp > 0 ? `'${curr.slice(0, lcp)}'` : '(none)';

    steps.push(
      step(`LCP[${i}] = ${lcp} (between '${prev}' and '${curr}', shared: ${shared}).${lcp > maxLCP ? ` New maximum!` : ''}`, [
        { targetId: `sa-${i}`, property: 'highlight', from: 'default', to: lcp > maxLCP ? 'found' : 'comparing' },
      ]),
    );

    if (lcp > maxLCP) {
      maxLCP = lcp;
      maxIdx = i;
    }
  }

  if (maxLCP === 0) {
    steps.push(
      step(`No repeated substrings in '${s.text}'. All LCP values are 0 -- every character is unique.`, []),
    );
  } else {
    const repeated = s.suffixes[maxIdx].suffix.slice(0, maxLCP);
    steps.push(
      step(`Longest repeated substring: '${repeated}' (length ${maxLCP}), found between suffixes '${s.suffixes[maxIdx - 1].suffix}'(${s.suffixes[maxIdx - 1].index}) and '${s.suffixes[maxIdx].suffix}'(${s.suffixes[maxIdx].index}). This O(n) scan of the LCP array replaces an O(n^2) brute-force search.`, [
        { targetId: `sa-${maxIdx}`, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
  }

  return { steps, snapshot: s };
}

// ── LCP Computation (standalone) ───────────────────────────

// WHY expose saLCP separately: Sometimes you want to rebuild the LCP array after
// modifying the suffix array, or compute LCP between two arbitrary suffixes.
// This also serves as a teaching tool to demonstrate the Kasai algorithm concept.
export function saLCP(state: SuffixArrayState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSA(state);

  if (s.suffixes.length <= 1) {
    steps.push(
      step(`Need at least 2 suffixes to compute LCP array. Current: ${s.suffixes.length}.`, []),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Recompute LCP array for '${s.text}' with ${s.suffixes.length} sorted suffixes. Compare each adjacent pair and count shared prefix characters.`, []),
  );

  const newLCP: number[] = [0];

  for (let i = 1; i < s.suffixes.length; i++) {
    const prev = s.suffixes[i - 1].suffix;
    const curr = s.suffixes[i].suffix;
    const lcp = lcpLength(prev, curr);
    newLCP.push(lcp);

    const shared = lcp > 0 ? `'${curr.slice(0, lcp)}'` : '(none)';

    steps.push(
      step(`LCP[${i}]: '${prev}' vs '${curr}' -- shared prefix = ${shared}, length = ${lcp}. ${lcp > 0 ? `These two suffixes share '${curr.slice(0, lcp)}', indicating this substring appears at least twice in the text.` : 'No shared prefix -- these suffixes diverge at the first character.'}`, [
        { targetId: `sa-${i - 1}`, property: 'highlight', from: 'default', to: 'comparing' },
        { targetId: `sa-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
  }

  s.lcpArray = newLCP;

  steps.push(
    step(`LCP array computed: [${newLCP.join(', ')}]. Max LCP = ${Math.max(...newLCP)} -- the longest substring that appears more than once in '${s.text}'.`, [
      { targetId: 'sa-lcp', property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}
