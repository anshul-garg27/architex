// -----------------------------------------------------------------
// Architex -- Vector Search Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';
import { COSINE_SIMILARITY_CONFIG } from './cosine-similarity';
import { HNSW_CONFIG } from './hnsw';

export { cosineSimilarity, COSINE_SIMILARITY_CONFIG } from './cosine-similarity';
export { hnsw, HNSW_CONFIG } from './hnsw';

/** Catalog of all vector search / AI-ML algorithm configurations. */
export const VECTOR_SEARCH_ALGORITHMS: AlgorithmConfig[] = [
  COSINE_SIMILARITY_CONFIG,
  HNSW_CONFIG,
];
