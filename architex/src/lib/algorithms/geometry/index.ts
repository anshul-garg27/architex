// -----------------------------------------------------------------
// Architex -- Geometry Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';

export type { Point2D, GeometryElementState } from './types';

export { convexHull, CONVEX_HULL_CONFIG } from './convex-hull';

export { closestPair, CLOSEST_PAIR_CONFIG } from './closest-pair';

export {
  lineIntersection,
  LINE_INTERSECTION_CONFIG,
  generateSampleSegments,
  SAMPLE_SEGMENTS,
} from './line-intersection';
export type { Segment, IntersectionPoint } from './line-intersection';

export { generateSamplePoints, SAMPLE_POINTS } from './sample-points';

/** Catalog of all geometry algorithm configurations. */
export const GEOMETRY_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'convex-hull',
    name: 'Convex Hull (Graham Scan)',
    category: 'geometry',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    description:
      'Imagine stretching a rubber band around nails on a board — it snaps to the outermost ones. That shape is the convex hull. Graham Scan: pick the lowest point, sort others by polar angle, walk through with a stack. Turning left? Keep the point. Turning right? Pop — it\'s inside the hull. Use when you need the outer boundary of a point set. Used in: collision detection in games, geographical boundary mapping, image processing (object outlines). Remember: "Rubber band around nails. Sort by angle, pop clockwise turns."',
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
  },
  {
    id: 'closest-pair',
    name: 'Closest Pair of Points',
    category: 'geometry',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    description:
      'In a room of 1000 people, which two are standing closest together? Checking every pair is O(n^2) -- too slow. Divide and conquer: sort by x, split in half, recurse on each side, get the minimum distance d. The clever part: only check points within distance d of the dividing line (the "strip"). Sort the strip by y and compare each point to at most 7 neighbors. Total: O(n log n). Used in: collision detection in games, geographic nearest-neighbor queries, clustering algorithms. Remember: "Split, recurse, check the strip. Only 7 neighbors matter in the strip."',
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
  },
  {
    id: 'line-intersection',
    name: 'Line Segment Intersection',
    category: 'geometry',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n log n)', average: 'O((n + k) log n)', worst: 'O((n + k) log n)' },
    spaceComplexity: 'O(n)',
    description:
      'Given a set of line segments, which ones cross each other? Checking all pairs is O(n^2). The sweep line does better: a vertical line moves left to right. At each left endpoint, insert the segment into an active set. At each right endpoint, remove it. Only test neighbors for intersections. When segments swap order, check new neighbors. O((n+k) log n) where k = intersections. Used in: map overlay (GIS), circuit layout verification, computer graphics (polygon clipping). Remember: "Sweep left to right. Insert, remove, check neighbors. Only adjacent segments cross."',
    pseudocode: [
      'procedure SweepLineIntersection(segments)',
      '  build event queue (left/right endpoints sorted by x)',
      '  active = empty ordered set',
      '  for each event in queue do',
      '    if event is LEFT_ENDPOINT of segment s',
      '      insert s into active',
      '      check s against neighbors for intersection',
      '    else if event is RIGHT_ENDPOINT of segment s',
      '      check neighbors of s for intersection',
      '      remove s from active',
      '    else if event is INTERSECTION of s1, s2',
      '      report intersection point',
      '      swap s1, s2 in active',
      '      check new neighbors for intersection',
      '  return all intersection points',
    ],
  },
];
