// ─────────────────────────────────────────────────────────────
// Architex — Sorting Algorithms Barrel Export
// ─────────────────────────────────────────────────────────────

import type { AlgorithmConfig } from '../types';

// Import canonical configs from engine files (single source of truth)
import { CONFIG as BUBBLE_SORT_CONFIG } from './bubble-sort';
import { CONFIG as INSERTION_SORT_CONFIG } from './insertion-sort';
import { CONFIG as SELECTION_SORT_CONFIG } from './selection-sort';
import { CONFIG as MERGE_SORT_CONFIG } from './merge-sort';
import { CONFIG as QUICK_SORT_CONFIG } from './quick-sort';
import { CONFIG as HEAP_SORT_CONFIG } from './heap-sort';
import { CONFIG as MERGE_SORT_BOTTOM_UP_CONFIG } from './merge-sort-bottom-up';
import { CONFIG as QUICK_SORT_HOARE_CONFIG } from './quick-sort-hoare';

export { bubbleSort, CONFIG as BUBBLE_SORT_ENGINE_CONFIG } from './bubble-sort';
export { mergeSort, CONFIG as MERGE_SORT_ENGINE_CONFIG } from './merge-sort';
export { mergeSortBottomUp, CONFIG as MERGE_SORT_BOTTOM_UP_ENGINE_CONFIG } from './merge-sort-bottom-up';
export { quickSort, CONFIG as QUICK_SORT_ENGINE_CONFIG } from './quick-sort';
export { quickSortHoare, CONFIG as QUICK_SORT_HOARE_ENGINE_CONFIG } from './quick-sort-hoare';
export { heapSort, CONFIG as HEAP_SORT_ENGINE_CONFIG } from './heap-sort';
export { insertionSort, CONFIG as INSERTION_SORT_ENGINE_CONFIG } from './insertion-sort';
export { selectionSort, CONFIG as SELECTION_SORT_ENGINE_CONFIG } from './selection-sort';
export { shellSort } from './shell-sort';
export { countingSort } from './counting-sort';
export { radixSort } from './radix-sort';
export { bucketSort } from './bucket-sort';
export { timSort } from './tim-sort';
export { cocktailShakerSort } from './cocktail-shaker-sort';
export { combSort } from './comb-sort';
export { pancakeSort } from './pancake-sort';
export { bogoSort } from './bogo-sort';
export { radixSortMSD } from './radix-sort-msd';

/** Catalog of all sorting algorithm configurations. */
export const SORTING_ALGORITHMS: AlgorithmConfig[] = [
  // Top 6: imported from engine files (single source of truth)
  BUBBLE_SORT_CONFIG,
  INSERTION_SORT_CONFIG,
  SELECTION_SORT_CONFIG,
  MERGE_SORT_CONFIG,
  MERGE_SORT_BOTTOM_UP_CONFIG,
  QUICK_SORT_CONFIG,
  QUICK_SORT_HOARE_CONFIG,
  HEAP_SORT_CONFIG,
  {
    id: 'shell-sort',
    name: 'Shell Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n log n)', average: 'O(n^(4/3))', worst: 'O(n^(3/2))' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    description:
      'What if Insertion Sort could move elements FAR instead of one step at a time? That is Shell Sort. Start by comparing elements a big gap apart -- say half the array. Each pass shrinks the gap (Knuth sequence: gap = 3*gap+1), so early passes make long-range fixes while later passes fine-tune neighbors. By the time gap reaches 1, the array is nearly sorted and Insertion Sort finishes in almost O(n). Used in: embedded systems with limited memory (uClibc). Remember: "Big leaps first, small steps last. Insertion Sort on steroids."',
    pseudocode: [
      'procedure shellSort(A)',
      '  n = length(A)',
      '  gap = 1',
      '  while gap < n/3 do gap = 3*gap + 1',
      '  while gap >= 1 do',
      '    for i = gap to n-1 do',
      '      key = A[i]',
      '      j = i',
      '      while j >= gap and A[j-gap] > key do',
      '        A[j] = A[j-gap]; j = j-gap',
      '      A[j] = key',
      '    gap = gap / 3',
    ],
  },
  {
    id: 'counting-sort',
    name: 'Counting Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    description:
      'What if you could sort without comparing ANY two elements? Counting Sort does exactly that. Count how many times each value appears, compute prefix sums to find each value\'s final position, then place every element directly. O(n+k) -- no comparisons needed. The catch: you need integers in a known range (k = max value). Use when k is small relative to n. Used in: Radix Sort subroutine, histogram-based sorting, suffix array construction. Remember: "Count occurrences, compute positions, place directly. Zero comparisons."',
    summary: [
      'Count occurrences, prefix-sum positions, place directly.',
      'O(n+k) time, stable, but needs integers in known range.',
      '"Zero comparisons" -- beats O(n log n) when k is small.',
    ],
    pseudocode: [
      'procedure countingSort(A)',
      '  k = max(A)',
      '  count = array of (k+1) zeros',
      '  for each x in A do',
      '    count[x] = count[x] + 1',
      '  for i = 1 to k do',
      '    count[i] = count[i] + count[i-1]',
      '  output = array of length n',
      '  for i = n-1 down to 0 do',
      '    output[count[A[i]] - 1] = A[i]',
      '    count[A[i]] = count[A[i]] - 1',
      '  return output',
    ],
  },
  {
    id: 'radix-sort',
    name: 'Radix Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    description:
      'How does the post office sort millions of letters by ZIP code? One digit at a time, right to left. That is LSD Radix Sort. Sort all items by the ones digit (using Counting Sort to keep it stable), then the tens digit, then hundreds. After k passes (k = number of digits), everything is in order -- without ever comparing two elements directly. Use for integers or fixed-length strings when k is small. Used in: database integer sorting, string sorting, suffix array construction. Remember: "Sort by last digit first, then next, and next. Stable passes build the final order."',
    summary: [
      'Sort by last digit, then next, then next. k passes total.',
      'O(nk) time, stable. No direct element comparisons.',
      '"Post office sorting" -- one digit at a time builds order.',
    ],
    pseudocode: [
      'procedure radixSort(A)',
      '  maxVal = max(A)',
      '  exp = 1',
      '  while maxVal / exp >= 1 do',
      '    buckets = 10 empty lists',
      '    for each x in A do',
      '      digit = floor(x / exp) mod 10',
      '      buckets[digit].append(x)',
      '    A = concatenate(buckets)',
      '    exp = exp * 10',
      '  return A',
      '',
      '// Uses counting sort per digit',
      '// for stability (LSD variant)',
      '// k = number of digit passes',
    ],
  },
  {
    id: 'bucket-sort',
    name: 'Bucket Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n^2)' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    description:
      'If you knew your data was spread evenly between 1 and 100, could you beat O(n log n)? Yes -- with Bucket Sort. Distribute elements into evenly spaced buckets (like dropping marbles into labeled bins), sort each small bucket with Insertion Sort, then concatenate. When input is uniformly distributed, each bucket holds ~1 element and the total work is O(n). Worst case (all in one bucket): O(n^2). Use for uniformly distributed floating-point numbers. Used in: computational geometry, histogram equalization. Remember: "Distribute into bins, sort each, concatenate. Uniform data = linear time."',
    pseudocode: [
      'procedure bucketSort(A)',
      '  n = length(A)',
      '  maxVal = max(A) + 1',
      '  buckets = n empty lists',
      '  for each x in A do',
      '    idx = floor(n * x / maxVal)',
      '    buckets[idx].append(x)',
      '  for each bucket in buckets do',
      '    insertionSort(bucket)',
      '  A = concatenate(buckets)',
      '  return A',
      '// k = number of buckets',
    ],
  },
  {
    id: 'tim-sort',
    name: 'Tim Sort',
    category: 'sorting',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    stable: true,
    inPlace: false,
    description:
      'What sort does Python and Java actually USE? Tim Sort -- a hybrid that beats textbooks on real data. Real arrays have pre-existing order: ascending chunks, descending chunks, repeats. Tim Sort finds natural runs, extends short ones with Insertion Sort, then merges all runs with a smart merge that minimizes comparisons. O(n) on sorted input, O(n log n) worst case. Used in: Python list.sort(), Java Arrays.sort for objects, V8 Array.sort(). Remember: "Find runs, extend short ones, merge all. Built for real-world data."',
    pseudocode: [
      'procedure timSort(A)',
      '  n = length(A)',
      '  minRun = computeMinRun(n)',
      '  // Step 1: create runs of size minRun',
      '  for start = 0 to n-1 step minRun do',
      '    end = min(start + minRun - 1, n - 1)',
      '    insertionSort(A, start, end)',
      '  // Step 2: merge runs bottom-up',
      '  size = minRun',
      '  while size < n do',
      '    for left = 0 to n-1 step 2*size do',
      '      mid = min(left + size - 1, n - 1)',
      '      right = min(left + 2*size - 1, n - 1)',
      '      if mid < right then',
      '        merge(A, left, mid, right)',
      '    size = size * 2',
    ],
  },
  {
    id: 'cocktail-shaker-sort',
    name: 'Cocktail Shaker Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    description:
      'Bubble Sort has a problem: small values stranded at the end take forever to migrate left (called "turtles"). What if we bubbled in BOTH directions? Cocktail Shaker Sort alternates forward passes (pushing the largest right) and backward passes (pushing the smallest left). This kills turtles by moving them in both directions each cycle. Still O(n^2) average, but fewer passes than Bubble Sort on data with turtles. Use as a teaching tool to understand directional bias. Used in: CS education for illustrating Bubble Sort limitations. Remember: "Bubble both ways. Kills turtles, same complexity."',
    pseudocode: [
      'procedure cocktailShakerSort(A)',
      '  start = 0; end = length(A) - 1',
      '  swapped = true',
      '  while swapped do',
      '    swapped = false',
      '    // forward pass',
      '    for i = start to end - 1 do',
      '      if A[i] > A[i+1] then',
      '        swap(A[i], A[i+1])',
      '        swapped = true',
      '    end = end - 1',
      '    // backward pass',
      '    for i = end down to start + 1 do',
      '      if A[i-1] > A[i] then',
      '        swap(A[i-1], A[i])',
      '        swapped = true',
      '    start = start + 1',
    ],
  },
  {
    id: 'comb-sort',
    name: 'Comb Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n log n)', average: 'O(n^2 / 2^p)', worst: 'O(n^2)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    description:
      'What if Bubble Sort could jump over elements instead of comparing only neighbors? Comb Sort starts with a large gap (like the full array), compares elements that far apart, and shrinks the gap by 1.3x each pass. Large gaps kill "turtles" (small values stuck at the end) early, so by the time gap=1, the array is nearly sorted. Think of combing tangled hair: wide teeth first for big knots, then finer teeth for detail. Use as a simple upgrade over Bubble Sort. Used in: quick-and-dirty implementations where simplicity matters. Remember: "Wide comb first, then fine. Shrink gap by 1.3 each pass."',
    pseudocode: [
      'procedure combSort(A)',
      '  n = length(A)',
      '  gap = n',
      '  shrink = 1.3',
      '  sorted = false',
      '  while not sorted do',
      '    gap = floor(gap / shrink)',
      '    if gap <= 1 then',
      '      gap = 1',
      '      sorted = true',
      '    for i = 0 to n - gap - 1 do',
      '      if A[i] > A[i + gap] then',
      '        swap(A[i], A[i + gap])',
      '        sorted = false',
    ],
  },
  {
    id: 'pancake-sort',
    name: 'Pancake Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    description:
      'Imagine sorting a stack of pancakes where the ONLY move is flipping the top N with a spatula. Find the biggest, flip it to the top, then flip the whole stack to send it to the bottom. Repeat for the next biggest. That constraint -- only prefix reversals -- makes Pancake Sort unique and connects to real math (the "pancake number"). Bill Gates published his only math paper on this. Used in: bioinformatics for modeling genome rearrangement via reversals. Remember: "Find max, flip to top, flip to bottom. Only prefix flips allowed."',
    pseudocode: [
      'procedure pancakeSort(A)',
      '  n = length(A)',
      '  for size = n down to 2 do',
      '    maxIdx = findMax(A, 0, size-1)',
      '    if maxIdx != size-1 then',
      '      if maxIdx != 0 then',
      '        flip(A, 0, maxIdx)      // bring max to front',
      '      flip(A, 0, size-1)        // flip max to correct pos',
      '  return A',
    ],
  },
  {
    id: 'bogo-sort',
    name: 'Bogo Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n)', average: 'O(n * n!)', worst: 'O(∞)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    description:
      'What if you sorted by randomly shuffling the array and checking if it worked? That is Bogo Sort -- the worst sorting algorithm ever invented, and it is here to show WHY good algorithms matter. Expected time: O(n * n!). For just 10 elements, that is 36 million expected operations. For 20? More than the atoms in the universe. This is what happens without structure -- pure randomness is spectacularly useless. Never used in production (that is the point). Used in: CS education to illustrate algorithmic complexity. Remember: "Shuffle, check, cry. This is why we study algorithms."',
    pseudocode: [
      'procedure bogoSort(A)',
      '  while not isSorted(A) do',
      '    shuffle(A)',
      '  return A',
      '',
      '// Expected attempts: n!',
      '// Expected comparisons: n * n!',
      '// Capped at 1000 attempts',
    ],
  },
  {
    id: 'radix-sort-msd',
    name: 'Radix Sort (MSD)',
    category: 'sorting',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    description:
      'While LSD Radix processes digits right-to-left, MSD goes left-to-right -- like sorting words alphabetically by first letter, then second within each group. Recursively bucket elements by the most significant digit, then sort each bucket by the next digit. This naturally produces lexicographic order and can short-circuit on single-element buckets. Use for variable-length strings or lexicographic ordering. Used in: string sorting, phone book ordering, trie-based systems. Remember: "Sort by first digit, recurse into each bucket. Natural lexicographic order."',
    pseudocode: [
      'procedure radixSortMSD(A, lo, hi, digitPos)',
      '  if lo >= hi or digitPos < 0 then return',
      '  buckets = 10 empty lists',
      '  for i = lo to hi do',
      '    d = digit(A[i], digitPos)',
      '    buckets[d].append(A[i])',
      '  idx = lo',
      '  for d = 0 to 9 do',
      '    for each val in buckets[d] do',
      '      A[idx] = val; idx++',
      '  offset = lo',
      '  for d = 0 to 9 do',
      '    count = buckets[d].length',
      '    if count > 1 then',
      '      radixSortMSD(A, offset, offset+count-1, digitPos-1)',
      '    offset += count',
      '  return A',
    ],
  },
];
