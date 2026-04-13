// -----------------------------------------------------------------
// Architex -- Probabilistic Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';
import { BLOOM_FILTER_CONFIG } from './bloom-filter';
import { SKIP_LIST_CONFIG } from './skip-list';
import { COUNT_MIN_SKETCH_CONFIG } from './count-min-sketch';

export { bloomFilter, BLOOM_FILTER_CONFIG } from './bloom-filter';
export { skipList, SKIP_LIST_CONFIG } from './skip-list';
export { countMinSketch, COUNT_MIN_SKETCH_CONFIG } from './count-min-sketch';

/** Catalog of all probabilistic algorithm configurations. */
export const PROBABILISTIC_ALGORITHMS: AlgorithmConfig[] = [
  BLOOM_FILTER_CONFIG,
  SKIP_LIST_CONFIG,
  COUNT_MIN_SKETCH_CONFIG,
];
