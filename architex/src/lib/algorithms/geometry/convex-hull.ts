// -----------------------------------------------------------------
// Architex -- Graham Scan Convex Hull with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Point2D } from './types';

export const CONVEX_HULL_CONFIG: AlgorithmConfig = {
  id: 'convex-hull',
  name: 'Convex Hull (Graham Scan)',
  category: 'geometry',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Finds the convex hull of a set of 2D points using Graham Scan. Selects the bottom-most pivot, sorts by polar angle, then processes points using a stack — popping when a clockwise turn is detected.',
  pseudocode: [
    'procedure GrahamScan(points)',
    '  pivot = bottom-most point (lowest y, leftmost x)',
    '  sort remaining points by polar angle w.r.t. pivot',
    '  push pivot onto stack',
    '  push sorted[0] onto stack',
    '  for i = 1 to n - 1 do',
    '    while |stack| >= 2 and cross(next-to-top, top, sorted[i]) <= 0 do',
    '      pop stack  // clockwise turn — reject',
    '    push sorted[i] onto stack',
    '  return stack  // convex hull vertices in CCW order',
  ],
};

/** Cross product of vectors OA and OB where O = o, A = a, B = b. */
function cross(o: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** Squared distance between two points. */
function dist2(a: Point2D, b: Point2D): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Polar angle of point relative to pivot (using atan2). */
function polarAngle(pivot: Point2D, p: Point2D): number {
  return Math.atan2(p.y - pivot.y, p.x - pivot.x);
}

export function convexHull(points: Point2D[]): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;

  function record(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 600,
    });
  }

  if (points.length < 3) {
    record('Need at least 3 points for a convex hull', 0, []);
    return { config: CONVEX_HULL_CONFIG, steps, finalState: [] };
  }

  // --- Step 1: Find the pivot (bottom-most, leftmost) ---
  let pivotIdx = 0;
  for (let i = 1; i < points.length; i++) {
    reads += 2;
    comparisons++;
    if (
      points[i].y > points[pivotIdx].y ||
      (points[i].y === points[pivotIdx].y && points[i].x < points[pivotIdx].x)
    ) {
      pivotIdx = i;
    }
  }

  const pivot = points[pivotIdx];
  record(`Select pivot: ${pivot.id} (bottom-most point)`, 1, [
    {
      targetId: `point-${pivot.id}`,
      property: 'highlight',
      from: 'default',
      to: 'pivot',
      easing: 'spring',
    },
  ]);

  // --- Step 2: Sort by polar angle ---
  const rest = points.filter((_, i) => i !== pivotIdx);
  rest.sort((a, b) => {
    comparisons++;
    const angleA = polarAngle(pivot, a);
    const angleB = polarAngle(pivot, b);
    if (angleA !== angleB) return angleA - angleB;
    // If same angle, closer point first
    return dist2(pivot, a) - dist2(pivot, b);
  });

  const sorted = [pivot, ...rest];

  // Record sort completion with all points highlighted
  const sortMutations: VisualMutation[] = sorted.map((p, i) => ({
    targetId: `point-${p.id}`,
    property: 'label' as const,
    from: '',
    to: String(i),
    easing: 'ease-out' as const,
  }));
  record('Points sorted by polar angle relative to pivot', 2, sortMutations);

  // --- Step 3: Process points using the stack ---
  const stack: Point2D[] = [sorted[0], sorted[1]];

  record(`Push ${sorted[0].id} and ${sorted[1].id} onto stack`, 3, [
    {
      targetId: `point-${sorted[0].id}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    },
    {
      targetId: `point-${sorted[1].id}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    },
    {
      targetId: 'stack',
      property: 'label',
      from: '',
      to: JSON.stringify(stack.map((p) => p.id)),
      easing: 'linear',
    },
  ]);

  for (let i = 2; i < sorted.length; i++) {
    const current = sorted[i];
    reads++;

    // Highlight current point being processed
    record(`Processing point ${current.id}`, 5, [
      {
        targetId: `point-${current.id}`,
        property: 'highlight',
        from: 'default',
        to: 'current',
        easing: 'spring',
      },
      {
        targetId: 'stack',
        property: 'label',
        from: '',
        to: JSON.stringify(stack.map((p) => p.id)),
        easing: 'linear',
      },
    ]);

    // Check for clockwise turns and pop
    while (stack.length >= 2) {
      const top = stack[stack.length - 1];
      const nextToTop = stack[stack.length - 2];
      comparisons++;
      reads += 2;

      const cp = cross(nextToTop, top, current);

      if (cp <= 0) {
        // Clockwise or collinear -- pop
        const popped = stack.pop()!;
        record(
          `Clockwise turn at ${nextToTop.id}-${top.id}-${current.id} (cross=${cp.toFixed(0)}). Pop ${popped.id}`,
          7,
          [
            {
              targetId: `point-${popped.id}`,
              property: 'highlight',
              from: 'hull',
              to: 'rejected',
              easing: 'ease-out',
            },
            {
              targetId: 'stack',
              property: 'label',
              from: '',
              to: JSON.stringify(stack.map((p) => p.id)),
              easing: 'linear',
            },
          ],
        );
      } else {
        // Counter-clockwise turn -- proceed
        record(
          `CCW turn at ${nextToTop.id}-${top.id}-${current.id} (cross=${cp.toFixed(0)}). Keep.`,
          6,
          [
            {
              targetId: 'stack',
              property: 'label',
              from: '',
              to: JSON.stringify(stack.map((p) => p.id)),
              easing: 'linear',
            },
          ],
        );
        break;
      }
    }

    // Push current onto stack
    stack.push(current);
    record(`Push ${current.id} onto stack`, 8, [
      {
        targetId: `point-${current.id}`,
        property: 'highlight',
        from: 'current',
        to: 'hull',
        easing: 'spring',
      },
      {
        targetId: 'stack',
        property: 'label',
        from: '',
        to: JSON.stringify(stack.map((p) => p.id)),
        easing: 'linear',
      },
    ]);
  }

  // --- Step 4: Hull complete ---
  const hullMutations: VisualMutation[] = stack.map((p) => ({
    targetId: `point-${p.id}`,
    property: 'highlight' as const,
    from: 'default',
    to: 'hull' as const,
    easing: 'spring' as const,
  }));
  hullMutations.push({
    targetId: 'hull-edges',
    property: 'label',
    from: '',
    to: JSON.stringify(stack.map((p) => p.id)),
    easing: 'linear',
  });
  hullMutations.push({
    targetId: 'stack',
    property: 'label',
    from: '',
    to: JSON.stringify(stack.map((p) => p.id)),
    easing: 'linear',
  });
  record(
    `Convex hull complete: ${stack.length} vertices`,
    9,
    hullMutations,
  );

  return {
    config: CONVEX_HULL_CONFIG,
    steps,
    finalState: stack.map((_, i) => i),
  };
}
