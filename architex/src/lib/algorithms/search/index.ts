// ─────────────────────────────────────────────────────────────
// Architex — Search Algorithms Barrel Export
// ─────────────────────────────────────────────────────────────

import type { AlgorithmConfig } from '../types';

export { binarySearch, BINARY_SEARCH_CONFIG } from './binary-search';

/** Catalog of all search algorithm configurations. */
export const SEARCH_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'sorting',
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    description:
      'Finds a target value in a sorted array by repeatedly halving the search space. Compares the target to the middle element — if smaller, search left half; if larger, search right half.',
    pseudocode: [
      'procedure binarySearch(A: sorted list, target)',
      '  left = 0',
      '  right = length(A) - 1',
      '  while left <= right do',
      '    mid = floor((left + right) / 2)',
      '    if A[mid] == target then',
      '      return mid',
      '    else if A[mid] < target then',
      '      left = mid + 1',
      '    else',
      '      right = mid - 1',
      '  return -1  // not found',
    ],
  },
];
