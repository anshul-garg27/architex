// -----------------------------------------------------------------
// Architex -- Design Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';
import { LRU_CACHE_CONFIG } from './lru-cache';

export { lruCache, LRU_CACHE_CONFIG } from './lru-cache';
export type { LRUOperation } from './lru-cache';
export { LRU_CACHE_CAPACITY, LRU_CACHE_DEFAULT_OPS } from './lru-cache';

/** Catalog of all design algorithm configurations. */
export const DESIGN_ALGORITHMS: AlgorithmConfig[] = [
  LRU_CACHE_CONFIG,
];
