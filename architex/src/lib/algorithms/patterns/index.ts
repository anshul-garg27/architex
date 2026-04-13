// ─────────────────────────────────────────────────────────────
// Architex — Pattern Algorithms Barrel Export
// ─────────────────────────────────────────────────────────────

import type { AlgorithmConfig } from '../types';
import { MONOTONIC_STACK_CONFIG } from './monotonic-stack';
import { FLOYD_CYCLE_CONFIG } from './cycle-detection-floyd';
import { TWO_POINTERS_CONFIG } from './two-pointers';
import { SLIDING_WINDOW_CONFIG } from './sliding-window';
import { INTERVAL_MERGE_CONFIG } from './intervals';

export { monotonicStack, MONOTONIC_STACK_CONFIG } from './monotonic-stack';
export { floydCycle, FLOYD_CYCLE_CONFIG } from './cycle-detection-floyd';
export { twoPointers, TWO_POINTERS_CONFIG } from './two-pointers';
export { slidingWindow, SLIDING_WINDOW_CONFIG } from './sliding-window';
export { intervalMerge, INTERVAL_MERGE_CONFIG } from './intervals';

/** Catalog of all pattern algorithm configurations. */
export const PATTERN_ALGORITHMS: AlgorithmConfig[] = [
  MONOTONIC_STACK_CONFIG,
  FLOYD_CYCLE_CONFIG,
  TWO_POINTERS_CONFIG,
  SLIDING_WINDOW_CONFIG,
  INTERVAL_MERGE_CONFIG,
];
