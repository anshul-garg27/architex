// -----------------------------------------------------------------
// Architex -- Activity Selection (Greedy) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const ACTIVITY_SELECTION_CONFIG: AlgorithmConfig = {
  id: 'activity-selection',
  name: 'Activity Selection',
  category: 'sorting',
  timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  spaceComplexity: 'O(n)',
  stable: false,
  inPlace: false,
  description:
    'You have 10 meetings today but only one conference room. Which meetings can you attend without conflicts? Activity Selection solves this by always choosing the meeting that ends earliest — leaving maximum room for future meetings.',
  pseudocode: [
    'procedure activitySelection(activities)',
    '  sort activities by end time',
    '  selected = [activities[0]]',
    '  lastEnd = activities[0].end',
    '  for i = 1 to n-1 do',
    '    if activities[i].start >= lastEnd then',
    '      selected.append(activities[i])',
    '      lastEnd = activities[i].end',
    '  return selected',
  ],
};

export interface Activity {
  start: number;
  end: number;
  label: string;
}

/** Default sample activities for demonstration. */
export const DEFAULT_ACTIVITIES: Activity[] = [
  { start: 1, end: 3, label: 'A' },
  { start: 2, end: 5, label: 'B' },
  { start: 0, end: 6, label: 'C' },
  { start: 5, end: 7, label: 'D' },
  { start: 3, end: 4, label: 'E' },
  { start: 5, end: 9, label: 'F' },
  { start: 6, end: 8, label: 'G' },
  { start: 8, end: 11, label: 'H' },
  { start: 8, end: 10, label: 'I' },
  { start: 12, end: 14, label: 'J' },
];

/**
 * Activity Selection greedy algorithm.
 * Sorts activities by end time, then greedily picks non-conflicting ones.
 * Returns an AlgorithmResult with animation steps showing sort + selection.
 *
 * The input number array encodes activities as flattened [start, end, start, end, ...].
 * If the input array has an odd length or is empty, default activities are used.
 */
export function activitySelection(input: number[]): AlgorithmResult {
  // Decode input: pairs of (start, end)
  let activities: Activity[];

  if (input.length >= 2 && input.length % 2 === 0) {
    activities = [];
    for (let i = 0; i < input.length; i += 2) {
      activities.push({
        start: input[i],
        end: input[i + 1],
        label: String.fromCharCode(65 + i / 2),
      });
    }
  } else {
    activities = [...DEFAULT_ACTIVITIES];
  }

  const n = activities.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
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

  // Step 1: Show initial activities
  addStep(
    `${n} activities to schedule. First, sort by end time — the greedy insight is that the activity ending earliest leaves the most room for others.`,
    0,
    activities.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'active',
      easing: 'ease-out' as const,
    })),
    500,
  );

  // Step 2: Sort activities by end time
  const sorted = activities
    .map((a, idx) => ({ ...a, originalIndex: idx }))
    .sort((a, b) => a.end - b.end);
  comparisons += n * Math.ceil(Math.log2(n)); // approximate for sort
  reads += n;
  writes += n;

  addStep(
    `Sorted by end time: ${sorted.map((a) => `${a.label}(${a.start}-${a.end})`).join(', ')}`,
    1,
    sorted.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'active',
      to: 'comparing',
      easing: 'spring' as const,
    })),
    600,
  );

  // Step 3: Greedy selection
  const selected: typeof sorted = [sorted[0]];
  let lastEnd = sorted[0].end;

  addStep(
    `Select first activity ${sorted[0].label} (ends at ${sorted[0].end}) — always take the one that ends earliest.`,
    2,
    [
      {
        targetId: `element-${0}`,
        property: 'highlight',
        from: 'comparing',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    500,
  );

  for (let i = 1; i < sorted.length; i++) {
    const act = sorted[i];
    reads++;
    comparisons++;

    if (act.start >= lastEnd) {
      // Compatible — select it
      selected.push(act);
      lastEnd = act.end;
      writes++;

      addStep(
        `Activity ${act.label} (${act.start}-${act.end}) starts at ${act.start} >= last end ${lastEnd - (act.end - act.start) > 0 ? sorted[selected.length - 2].end : lastEnd}. No conflict — select it!`,
        6,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'comparing',
            to: 'sorted',
            easing: 'spring',
          },
        ],
        500,
      );
    } else {
      // Conflict — skip it
      addStep(
        `Activity ${act.label} (${act.start}-${act.end}) starts at ${act.start} < last end ${lastEnd}. Conflict — skip.`,
        5,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'ease-out',
          },
        ],
        400,
      );
    }
  }

  // Final step
  addStep(
    `Greedy selection complete: ${selected.length} activities selected out of ${n} — [${selected.map((a) => a.label).join(', ')}]`,
    8,
    selected.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'found',
      easing: 'ease-out' as const,
    })),
    600,
  );

  // Build finalState: end times of selected activities
  const finalState = sorted.map((a) => a.end);

  return { config: ACTIVITY_SELECTION_CONFIG, steps, finalState };
}
