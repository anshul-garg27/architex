// ─────────────────────────────────────────────────────────────
// Architex — Counting Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'counting-sort',
  name: 'Counting Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
  spaceComplexity: 'O(n + k)',
  stable: true,
  inPlace: false,
  description:
    'Counts the occurrences of each distinct value, computes prefix sums, then places elements into the output array. Only works for non-negative integers (k = max value).',
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
};

export function countingSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  const comparisons = 0;
  const swaps = 0;
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

  // Find min and max values to support negative integers
  let min = a[0];
  let k = a[0];
  for (let i = 1; i < n; i++) {
    reads++;
    if (a[i] > k) k = a[i];
    if (a[i] < min) min = a[i];
  }

  addStep(
    `Min value = ${min}, Max value k = ${k}`,
    1,
    [],
    300,
  );

  // Shift all values by -min so the count array starts at index 0
  const range = k - min;
  for (let i = 0; i < n; i++) {
    a[i] -= min;
  }

  // Build count array
  const count = new Array<number>(range + 1).fill(0);

  addStep(
    `Initialize count array of size ${range + 1} with zeros (shifted by ${-min})`,
    2,
    [],
    300,
  );

  for (let i = 0; i < n; i++) {
    reads++;
    count[a[i]]++;
    writes++;

    const countDesc = i === 0
      ? `count[${a[i]}]++ = ${count[a[i]]}  (read arr[${i}]=${a[i] + min}). Instead of comparing elements, Counting Sort counts how many times each value appears — this is why it can sort in O(n+k) without any comparisons.`
      : `count[${a[i]}]++ = ${count[a[i]]}  (read arr[${i}]=${a[i] + min})`;

    addStep(
      countDesc,
      4,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      300,
    );
  }

  addStep(
    `Histogram complete: [${count.join(', ')}]`,
    4,
    [],
    400,
  );

  // Compute prefix sums
  for (let i = 1; i <= range; i++) {
    count[i] += count[i - 1];
    reads += 2;
    writes++;

    addStep(
      `Prefix sum: count[${i}] = ${count[i]}`,
      6,
      [],
      250,
    );
  }

  addStep(
    `Prefix sums complete: [${count.join(', ')}]`,
    6,
    [],
    400,
  );

  // Place elements into output array (stable — iterate right to left)
  const output = new Array<number>(n);

  for (let i = n - 1; i >= 0; i--) {
    const val = a[i];
    reads++;
    const pos = count[val] - 1;
    output[pos] = val + min; // shift back to original value
    count[val]--;
    writes++;

    addStep(
      `Place arr[${i}]=${val + min} into output[${pos}]`,
      9,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${pos}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'spring',
        },
        {
          targetId: `element-${i}`,
          property: 'position',
          from: i,
          to: pos,
          easing: 'spring',
        },
      ],
      400,
    );
  }

  // Mark all as sorted
  for (let i = 0; i < n; i++) {
    addStep(
      'Array is fully sorted',
      11,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      150,
    );
  }

  return { config: CONFIG, steps, finalState: output };
}
