// -----------------------------------------------------------------
// Architex -- Greedy Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';
import { ACTIVITY_SELECTION_CONFIG } from './activity-selection';
import { FRACTIONAL_KNAPSACK_CONFIG } from './fractional-knapsack';

export {
  activitySelection,
  ACTIVITY_SELECTION_CONFIG,
  DEFAULT_ACTIVITIES,
} from './activity-selection';
export type { Activity } from './activity-selection';

export {
  fractionalKnapsack,
  FRACTIONAL_KNAPSACK_CONFIG,
  DEFAULT_FRACTIONAL_ITEMS,
  DEFAULT_CAPACITY,
} from './fractional-knapsack';

/** Catalog of all greedy algorithm configurations. */
export const GREEDY_ALGORITHMS: AlgorithmConfig[] = [
  ACTIVITY_SELECTION_CONFIG,
  FRACTIONAL_KNAPSACK_CONFIG,
];
