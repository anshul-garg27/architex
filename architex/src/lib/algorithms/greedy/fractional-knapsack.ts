// -----------------------------------------------------------------
// Architex -- Fractional Knapsack (Greedy) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const FRACTIONAL_KNAPSACK_CONFIG: AlgorithmConfig = {
  id: 'fractional-knapsack',
  name: 'Fractional Knapsack',
  category: 'sorting',
  timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  spaceComplexity: 'O(n)',
  stable: false,
  inPlace: false,
  description:
    'Unlike 0/1 Knapsack where you take or leave items, here you can take fractions. The greedy insight: always take from the item with the best value-per-kilogram ratio first.',
  pseudocode: [
    'procedure fractionalKnapsack(items, capacity)',
    '  compute ratio = value/weight for each item',
    '  sort items by ratio descending',
    '  totalValue = 0',
    '  for each item in sorted order do',
    '    if capacity >= item.weight then',
    '      take entire item',
    '      capacity -= item.weight',
    '      totalValue += item.value',
    '    else',
    '      take fraction = capacity / item.weight',
    '      totalValue += item.value * fraction',
    '      capacity = 0; break',
    '  return totalValue',
  ],
};

export interface KnapsackItem {
  name: string;
  weight: number;
  value: number;
}

/** Default sample items for demonstration. */
export const DEFAULT_FRACTIONAL_ITEMS: KnapsackItem[] = [
  { name: 'Gold', weight: 10, value: 60 },
  { name: 'Silver', weight: 20, value: 100 },
  { name: 'Bronze', weight: 30, value: 120 },
  { name: 'Diamond', weight: 5, value: 50 },
  { name: 'Ruby', weight: 15, value: 45 },
  { name: 'Pearl', weight: 8, value: 32 },
];

export const DEFAULT_CAPACITY = 50;

/**
 * Fractional Knapsack greedy algorithm.
 * The input number array is interpreted as flattened [weight, value, weight, value, ...].
 * If input is empty or odd-length, default items are used.
 * The last element (if odd after pairing) or a default of 50 is used as capacity.
 */
export function fractionalKnapsack(input: number[]): AlgorithmResult {
  let items: KnapsackItem[];
  let capacity: number;

  if (input.length >= 4 && input.length % 2 === 0) {
    items = [];
    for (let i = 0; i < input.length - 2; i += 2) {
      items.push({
        name: `Item ${String.fromCharCode(65 + i / 2)}`,
        weight: input[i],
        value: input[i + 1],
      });
    }
    capacity = input[input.length - 2] || DEFAULT_CAPACITY;
  } else {
    items = [...DEFAULT_FRACTIONAL_ITEMS];
    capacity = DEFAULT_CAPACITY;
  }

  const n = items.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    duration: number,
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration,
    });
  }

  // Step 1: Show items and compute ratios
  const withRatio = items.map((item, idx) => ({
    ...item,
    ratio: item.value / item.weight,
    originalIndex: idx,
  }));

  addStep(
    `${n} items, capacity = ${capacity} kg. Compute value/weight ratio for each item — the greedy strategy picks the best ratio first.`,
    1,
    withRatio.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'active',
      easing: 'ease-out' as const,
    })),
    500,
  );

  // Show each ratio
  for (let i = 0; i < withRatio.length; i++) {
    const item = withRatio[i];
    reads++;

    addStep(
      `${item.name}: value=${item.value}, weight=${item.weight}, ratio=${item.ratio.toFixed(2)} per kg`,
      1,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'active',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      350,
    );
  }

  // Step 2: Sort by ratio descending
  const sorted = [...withRatio].sort((a, b) => b.ratio - a.ratio);
  comparisons += n * Math.ceil(Math.log2(n));
  writes += n;

  addStep(
    `Sorted by ratio (descending): ${sorted.map((i) => `${i.name}(${i.ratio.toFixed(2)})`).join(', ')}`,
    2,
    sorted.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'comparing',
      to: 'active',
      easing: 'spring' as const,
    })),
    600,
  );

  // Step 3: Greedy filling
  let totalValue = 0;
  let remainingCapacity = capacity;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    reads++;
    comparisons++;

    if (remainingCapacity <= 0) {
      addStep(
        `Knapsack is full — skip ${item.name} and all remaining items.`,
        4,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'active',
            to: 'swapping',
            easing: 'ease-out',
          },
        ],
        400,
      );
      continue;
    }

    if (remainingCapacity >= item.weight) {
      // Take entire item
      totalValue += item.value;
      remainingCapacity -= item.weight;
      writes++;

      addStep(
        `Take ALL of ${item.name} (${item.weight}kg, value=${item.value}). Remaining capacity: ${remainingCapacity}kg. Total value: ${totalValue}.`,
        6,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'active',
            to: 'sorted',
            easing: 'spring',
          },
        ],
        500,
      );
    } else {
      // Take fraction
      const fraction = remainingCapacity / item.weight;
      const fractionalValue = item.value * fraction;
      totalValue += fractionalValue;
      writes++;

      addStep(
        `Take ${(fraction * 100).toFixed(1)}% of ${item.name} (${remainingCapacity}kg of ${item.weight}kg, value=${fractionalValue.toFixed(1)}). Knapsack is now full! Total value: ${totalValue.toFixed(1)}.`,
        11,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'active',
            to: 'pivot',
            easing: 'spring',
          },
        ],
        500,
      );

      remainingCapacity = 0;
    }
  }

  // Final result
  addStep(
    `Fractional Knapsack complete. Maximum value = ${totalValue % 1 === 0 ? totalValue : totalValue.toFixed(1)} with capacity ${capacity}kg.`,
    13,
    sorted.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'found',
      easing: 'ease-out' as const,
    })),
    600,
  );

  // Build finalState: sorted ratios (rounded)
  const finalState = sorted.map((i) => Math.round(i.ratio * 100));

  return { config: FRACTIONAL_KNAPSACK_CONFIG, steps, finalState };
}
