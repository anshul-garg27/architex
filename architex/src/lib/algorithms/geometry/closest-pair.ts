// -----------------------------------------------------------------
// Architex -- Closest Pair of Points (Divide & Conquer) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Point2D } from './types';

export const CLOSEST_PAIR_CONFIG: AlgorithmConfig = {
  id: 'closest-pair',
  name: 'Closest Pair of Points',
  category: 'geometry',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Finds the two closest points in a set using divide and conquer. Sorts by x, splits into halves, recurses, then checks the strip of width 2d around the dividing line for cross-boundary pairs.',
  pseudocode: [
    'procedure ClosestPair(points)',
    '  sort points by x-coordinate',
    '  return closestPairRec(sorted)',
    '',
    'procedure closestPairRec(pts)',
    '  if |pts| <= 3 then return brute force',
    '  mid = |pts| / 2',
    '  split into left and right halves',
    '  dL = closestPairRec(left)',
    '  dR = closestPairRec(right)',
    '  d = min(dL, dR)',
    '  build strip of points within d of midline',
    '  sort strip by y-coordinate',
    '  for each point in strip, check next 7 points',
    '    if dist < d then update d',
    '  return d',
  ],
};

/** Euclidean distance between two points. */
function dist(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function closestPair(points: Point2D[]): AlgorithmResult {
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

  if (points.length < 2) {
    record('Need at least 2 points to find closest pair', 0, []);
    return { config: CLOSEST_PAIR_CONFIG, steps, finalState: [] };
  }

  // --- Step 1: Sort by x-coordinate ---
  const sorted = [...points].sort((a, b) => a.x - b.x);

  const sortMutations: VisualMutation[] = sorted.map((p, i) => ({
    targetId: `point-${p.id}`,
    property: 'label' as const,
    from: '',
    to: String(i),
    easing: 'ease-out' as const,
  }));
  record('Points sorted by x-coordinate', 1, sortMutations);

  // Track the global best pair
  let bestDist = Infinity;
  let bestA: Point2D | null = null;
  let bestB: Point2D | null = null;

  /** Brute force for small subsets (<= 3 points). */
  function bruteForce(pts: Point2D[], depth: number): { dist: number; a: Point2D; b: Point2D } {
    let minD = Infinity;
    let pairA = pts[0];
    let pairB = pts[1];

    record(
      `Base case: brute force on ${pts.length} points [${pts.map((p) => p.id).join(', ')}]`,
      5,
      pts.map((p) => ({
        targetId: `point-${p.id}`,
        property: 'highlight' as const,
        from: 'default',
        to: 'current',
        easing: 'spring' as const,
      })),
    );

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        reads += 2;
        comparisons++;
        const d = dist(pts[i], pts[j]);

        record(
          `Check pair ${pts[i].id}-${pts[j].id}: dist=${d.toFixed(1)}`,
          5,
          [
            {
              targetId: `point-${pts[i].id}`,
              property: 'highlight',
              from: 'default',
              to: 'current',
              easing: 'spring',
            },
            {
              targetId: `point-${pts[j].id}`,
              property: 'highlight',
              from: 'default',
              to: 'current',
              easing: 'spring',
            },
          ],
        );

        if (d < minD) {
          minD = d;
          pairA = pts[i];
          pairB = pts[j];
        }
      }
    }

    // Update global best if needed
    if (minD < bestDist) {
      bestDist = minD;
      bestA = pairA;
      bestB = pairB;
      record(
        `New closest pair: ${pairA.id}-${pairB.id} (dist=${minD.toFixed(1)})`,
        10,
        [
          {
            targetId: `point-${pairA.id}`,
            property: 'highlight',
            from: 'default',
            to: 'hull',
            easing: 'spring',
          },
          {
            targetId: `point-${pairB.id}`,
            property: 'highlight',
            from: 'default',
            to: 'hull',
            easing: 'spring',
          },
        ],
      );
    }

    return { dist: minD, a: pairA, b: pairB };
  }

  /** Recursive divide-and-conquer. */
  function solve(pts: Point2D[], depth: number): { dist: number; a: Point2D; b: Point2D } {
    if (pts.length <= 3) {
      return bruteForce(pts, depth);
    }

    const mid = Math.floor(pts.length / 2);
    const midPoint = pts[mid];

    // --- Split ---
    const left = pts.slice(0, mid);
    const right = pts.slice(mid);

    record(
      `Split at x=${midPoint.x} (${midPoint.id}): left=${left.length} pts, right=${right.length} pts`,
      7,
      [
        ...left.map((p) => ({
          targetId: `point-${p.id}`,
          property: 'highlight' as const,
          from: 'default',
          to: 'current' as const,
          easing: 'spring' as const,
        })),
        {
          targetId: `point-${midPoint.id}`,
          property: 'highlight',
          from: 'default',
          to: 'pivot',
          easing: 'spring',
        },
      ],
    );

    // --- Recursive calls ---
    record(`Recurse into left half (${left.length} points)`, 8, []);
    const leftResult = solve(left, depth + 1);

    record(`Recurse into right half (${right.length} points)`, 9, []);
    const rightResult = solve(right, depth + 1);

    // --- Combine: d = min(dL, dR) ---
    comparisons++;
    let d: number;
    let bestPair: { a: Point2D; b: Point2D };
    if (leftResult.dist < rightResult.dist) {
      d = leftResult.dist;
      bestPair = { a: leftResult.a, b: leftResult.b };
    } else {
      d = rightResult.dist;
      bestPair = { a: rightResult.a, b: rightResult.b };
    }

    record(
      `d = min(dL=${leftResult.dist.toFixed(1)}, dR=${rightResult.dist.toFixed(1)}) = ${d.toFixed(1)}`,
      10,
      [
        {
          targetId: `point-${bestPair.a.id}`,
          property: 'highlight',
          from: 'default',
          to: 'hull',
          easing: 'spring',
        },
        {
          targetId: `point-${bestPair.b.id}`,
          property: 'highlight',
          from: 'default',
          to: 'hull',
          easing: 'spring',
        },
      ],
    );

    // --- Strip check ---
    const strip: Point2D[] = pts.filter(
      (p) => Math.abs(p.x - midPoint.x) < d,
    );
    strip.sort((a, b) => a.y - b.y);

    if (strip.length > 1) {
      record(
        `Build strip: ${strip.length} points within d=${d.toFixed(1)} of midline x=${midPoint.x}`,
        11,
        strip.map((p) => ({
          targetId: `point-${p.id}`,
          property: 'highlight' as const,
          from: 'default',
          to: 'processing' as const,
          easing: 'ease-out' as const,
        })),
      );

      for (let i = 0; i < strip.length; i++) {
        // Check at most 7 subsequent points (classic bound)
        for (let j = i + 1; j < strip.length && j <= i + 7; j++) {
          reads += 2;
          comparisons++;
          if (strip[j].y - strip[i].y >= d) break;

          const pairDist = dist(strip[i], strip[j]);

          record(
            `Strip check ${strip[i].id}-${strip[j].id}: dist=${pairDist.toFixed(1)}`,
            13,
            [
              {
                targetId: `point-${strip[i].id}`,
                property: 'highlight',
                from: 'default',
                to: 'current',
                easing: 'spring',
              },
              {
                targetId: `point-${strip[j].id}`,
                property: 'highlight',
                from: 'default',
                to: 'current',
                easing: 'spring',
              },
            ],
          );

          if (pairDist < d) {
            d = pairDist;
            bestPair = { a: strip[i], b: strip[j] };

            record(
              `Strip update: closer pair ${strip[i].id}-${strip[j].id} (dist=${d.toFixed(1)})`,
              14,
              [
                {
                  targetId: `point-${strip[i].id}`,
                  property: 'highlight',
                  from: 'default',
                  to: 'hull',
                  easing: 'spring',
                },
                {
                  targetId: `point-${strip[j].id}`,
                  property: 'highlight',
                  from: 'default',
                  to: 'hull',
                  easing: 'spring',
                },
              ],
            );

            // Update global best
            if (d < bestDist) {
              bestDist = d;
              bestA = bestPair.a;
              bestB = bestPair.b;
            }
          }
        }
      }
    }

    return { dist: d, ...bestPair };
  }

  // --- Run ---
  const result = solve(sorted, 0);

  // --- Final result ---
  const finalMutations: VisualMutation[] = [
    {
      targetId: `point-${result.a.id}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    },
    {
      targetId: `point-${result.b.id}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    },
    {
      targetId: 'closest-pair-edge',
      property: 'label',
      from: '',
      to: JSON.stringify([result.a.id, result.b.id]),
      easing: 'linear',
    },
  ];

  record(
    `Closest pair: ${result.a.id} and ${result.b.id} (dist=${result.dist.toFixed(1)})`,
    15,
    finalMutations,
  );

  return {
    config: CLOSEST_PAIR_CONFIG,
    steps,
    finalState: [
      sorted.findIndex((p) => p.id === result.a.id),
      sorted.findIndex((p) => p.id === result.b.id),
    ],
  };
}
