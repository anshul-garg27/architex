// -----------------------------------------------------------------
// Architex -- Line Segment Intersection (Sweep Line) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Point2D } from './types';

// ── Public types ─────────────────────────────────────────────

export interface Segment {
  id: string;
  p: Point2D; // left endpoint (smaller x)
  q: Point2D; // right endpoint (larger x)
}

export interface IntersectionPoint {
  x: number;
  y: number;
  seg1: string;
  seg2: string;
}

// ── Config ───────────────────────────────────────────────────

export const LINE_INTERSECTION_CONFIG: AlgorithmConfig = {
  id: 'line-intersection',
  name: 'Line Segment Intersection',
  category: 'geometry',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O((n + k) log n)',
    worst: 'O((n + k) log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Detects all intersection points among a set of line segments using a sweep line moving left to right. Events are left endpoints, right endpoints, and detected intersections. An active segment list tracks segments crossing the sweep line.',
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
};

// ── Geometry utilities ───────────────────────────────────────

/** Evaluate the y coordinate of a segment at a given x. */
function yAtX(seg: Segment, x: number): number {
  const dx = seg.q.x - seg.p.x;
  if (Math.abs(dx) < 1e-10) return (seg.p.y + seg.q.y) / 2;
  const t = (x - seg.p.x) / dx;
  return seg.p.y + t * (seg.q.y - seg.p.y);
}

/** Cross product of vectors (b-a) x (c-a). */
function cross(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** Check whether a value is between lo and hi (inclusive with epsilon). */
function between(val: number, lo: number, hi: number): boolean {
  const eps = 1e-9;
  return val >= Math.min(lo, hi) - eps && val <= Math.max(lo, hi) + eps;
}

/** Compute the intersection point of two segments, or null if none. */
function segmentIntersection(
  s1: Segment,
  s2: Segment,
): { x: number; y: number } | null {
  const d1x = s1.q.x - s1.p.x;
  const d1y = s1.q.y - s1.p.y;
  const d2x = s2.q.x - s2.p.x;
  const d2y = s2.q.y - s2.p.y;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null; // parallel / collinear

  const t = ((s2.p.x - s1.p.x) * d2y - (s2.p.y - s1.p.y) * d2x) / denom;
  const u = ((s2.p.x - s1.p.x) * d1y - (s2.p.y - s1.p.y) * d1x) / denom;

  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;

  return {
    x: s1.p.x + t * d1x,
    y: s1.p.y + t * d1y,
  };
}

// ── Event types ──────────────────────────────────────────────

type EventType = 'LEFT' | 'RIGHT' | 'INTERSECTION';

interface SweepEvent {
  x: number;
  type: EventType;
  segId: string;
  segId2?: string; // only for intersection events
}

// ── Main algorithm ───────────────────────────────────────────

/**
 * Ensure segment.p is the left endpoint and segment.q is the right endpoint.
 */
function orient(seg: Segment): Segment {
  if (seg.p.x > seg.q.x || (seg.p.x === seg.q.x && seg.p.y > seg.q.y)) {
    return { id: seg.id, p: seg.q, q: seg.p };
  }
  return seg;
}

/**
 * Generate a deterministic set of line segments for demos.
 */
export function generateSampleSegments(): Segment[] {
  return [
    { id: 's0', p: { id: 's0p', x: 50, y: 100 }, q: { id: 's0q', x: 400, y: 300 } },
    { id: 's1', p: { id: 's1p', x: 80, y: 320 }, q: { id: 's1q', x: 450, y: 80 } },
    { id: 's2', p: { id: 's2p', x: 100, y: 50 }, q: { id: 's2q', x: 350, y: 350 } },
    { id: 's3', p: { id: 's3p', x: 200, y: 340 }, q: { id: 's3q', x: 520, y: 150 } },
    { id: 's4', p: { id: 's4p', x: 60, y: 220 }, q: { id: 's4q', x: 500, y: 200 } },
    { id: 's5', p: { id: 's5p', x: 150, y: 370 }, q: { id: 's5q', x: 480, y: 60 } },
  ].map(orient);
}

export const SAMPLE_SEGMENTS = generateSampleSegments();

export function lineIntersection(segments: Segment[]): AlgorithmResult {
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

  if (segments.length < 2) {
    record('Need at least 2 segments to check for intersections', 0, []);
    return { config: LINE_INTERSECTION_CONFIG, steps, finalState: [] };
  }

  // Orient all segments left-to-right
  const segs = segments.map(orient);
  const segMap = new Map<string, Segment>();
  for (const s of segs) segMap.set(s.id, s);

  // --- Build event queue ---
  const events: SweepEvent[] = [];
  for (const s of segs) {
    events.push({ x: s.p.x, type: 'LEFT', segId: s.id });
    events.push({ x: s.q.x, type: 'RIGHT', segId: s.id });
  }
  // Sort: by x, then LEFT before RIGHT before INTERSECTION
  const typePriority: Record<EventType, number> = { LEFT: 0, RIGHT: 2, INTERSECTION: 1 };
  events.sort((a, b) => a.x - b.x || typePriority[a.type] - typePriority[b.type]);

  record(
    `Built event queue with ${events.length} events from ${segs.length} segments`,
    1,
    segs.map((s) => ({
      targetId: `seg-${s.id}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'default' as const,
      easing: 'linear' as const,
    })),
  );

  // --- Active list (sorted by y at current sweep x) ---
  const active: string[] = []; // segment ids, ordered by y at sweep x
  let sweepX = 0;

  function activeInsert(segId: string): void {
    const seg = segMap.get(segId)!;
    let idx = 0;
    while (idx < active.length) {
      const other = segMap.get(active[idx])!;
      if (yAtX(seg, sweepX) < yAtX(other, sweepX)) break;
      idx++;
    }
    active.splice(idx, 0, segId);
  }

  function activeRemove(segId: string): void {
    const idx = active.indexOf(segId);
    if (idx >= 0) active.splice(idx, 1);
  }

  function activeIndex(segId: string): number {
    return active.indexOf(segId);
  }

  // Deduplicate intersection events already scheduled
  const scheduledIntersections = new Set<string>();

  function scheduleIntersection(id1: string, id2: string): void {
    const key = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
    if (scheduledIntersections.has(key)) return;

    const s1 = segMap.get(id1)!;
    const s2 = segMap.get(id2)!;
    const ip = segmentIntersection(s1, s2);
    if (ip && ip.x >= sweepX - 1e-9) {
      scheduledIntersections.add(key);
      // Insert into events (maintain sorted order)
      const evt: SweepEvent = {
        x: ip.x,
        type: 'INTERSECTION',
        segId: id1,
        segId2: id2,
      };
      // Find insertion point in remaining events
      let insertIdx = events.length;
      for (let k = eventIdx + 1; k < events.length; k++) {
        if (events[k].x > ip.x || (events[k].x === ip.x && typePriority[events[k].type] > typePriority['INTERSECTION'])) {
          insertIdx = k;
          break;
        }
      }
      events.splice(insertIdx, 0, evt);
    }
  }

  const intersections: IntersectionPoint[] = [];
  let eventIdx = 0;

  // --- Process events ---
  while (eventIdx < events.length) {
    const evt = events[eventIdx];
    sweepX = evt.x;

    if (evt.type === 'LEFT') {
      // Left endpoint — insert segment into active list
      const seg = segMap.get(evt.segId)!;
      reads++;

      record(
        `Sweep x=${sweepX.toFixed(0)}: LEFT endpoint of ${evt.segId}`,
        4,
        [
          {
            targetId: `seg-${evt.segId}`,
            property: 'highlight',
            from: 'default',
            to: 'current',
            easing: 'spring',
          },
          {
            targetId: 'sweep-line',
            property: 'position',
            from: 0,
            to: sweepX,
            easing: 'linear',
          },
        ],
      );

      activeInsert(evt.segId);

      record(
        `Insert ${evt.segId} into active list [${active.join(', ')}]`,
        5,
        [
          {
            targetId: `seg-${evt.segId}`,
            property: 'highlight',
            from: 'default',
            to: 'processing',
            easing: 'spring',
          },
        ],
      );

      // Check neighbors
      const idx = activeIndex(evt.segId);
      if (idx > 0) {
        comparisons++;
        scheduleIntersection(active[idx - 1], evt.segId);
      }
      if (idx < active.length - 1) {
        comparisons++;
        scheduleIntersection(evt.segId, active[idx + 1]);
      }
    } else if (evt.type === 'RIGHT') {
      // Right endpoint — remove segment from active list
      reads++;
      const idx = activeIndex(evt.segId);

      record(
        `Sweep x=${sweepX.toFixed(0)}: RIGHT endpoint of ${evt.segId}`,
        7,
        [
          {
            targetId: `seg-${evt.segId}`,
            property: 'highlight',
            from: 'processing',
            to: 'rejected',
            easing: 'ease-out',
          },
          {
            targetId: 'sweep-line',
            property: 'position',
            from: 0,
            to: sweepX,
            easing: 'linear',
          },
        ],
      );

      // Check if neighbors should be tested
      if (idx > 0 && idx < active.length - 1) {
        comparisons++;
        scheduleIntersection(active[idx - 1], active[idx + 1]);
      }

      activeRemove(evt.segId);

      record(
        `Remove ${evt.segId} from active list [${active.join(', ')}]`,
        8,
        [
          {
            targetId: `seg-${evt.segId}`,
            property: 'highlight',
            from: 'rejected',
            to: 'default',
            easing: 'ease-out',
          },
        ],
      );
    } else {
      // Intersection event
      const s1 = evt.segId;
      const s2 = evt.segId2!;
      const seg1 = segMap.get(s1)!;
      const seg2 = segMap.get(s2)!;
      const ip = segmentIntersection(seg1, seg2);

      if (ip) {
        intersections.push({ x: ip.x, y: ip.y, seg1: s1, seg2: s2 });

        record(
          `Sweep x=${sweepX.toFixed(0)}: INTERSECTION of ${s1} and ${s2} at (${ip.x.toFixed(0)}, ${ip.y.toFixed(0)})`,
          10,
          [
            {
              targetId: `seg-${s1}`,
              property: 'highlight',
              from: 'default',
              to: 'hull',
              easing: 'spring',
            },
            {
              targetId: `seg-${s2}`,
              property: 'highlight',
              from: 'default',
              to: 'hull',
              easing: 'spring',
            },
            {
              targetId: 'sweep-line',
              property: 'position',
              from: 0,
              to: sweepX,
              easing: 'linear',
            },
          ],
        );

        // Swap in active list
        const i1 = activeIndex(s1);
        const i2 = activeIndex(s2);
        if (i1 >= 0 && i2 >= 0) {
          active[i1] = s2;
          active[i2] = s1;

          record(
            `Swap ${s1} and ${s2} in active list [${active.join(', ')}]`,
            11,
            [
              {
                targetId: `seg-${s1}`,
                property: 'highlight',
                from: 'hull',
                to: 'processing',
                easing: 'ease-out',
              },
              {
                targetId: `seg-${s2}`,
                property: 'highlight',
                from: 'hull',
                to: 'processing',
                easing: 'ease-out',
              },
            ],
          );

          // Check new neighbors
          const newI1 = activeIndex(s1);
          const newI2 = activeIndex(s2);
          if (newI1 > 0) scheduleIntersection(active[newI1 - 1], s1);
          if (newI1 < active.length - 1) scheduleIntersection(s1, active[newI1 + 1]);
          if (newI2 > 0) scheduleIntersection(active[newI2 - 1], s2);
          if (newI2 < active.length - 1) scheduleIntersection(s2, active[newI2 + 1]);
        }
      }
    }

    eventIdx++;
  }

  // --- Final result ---
  const finalMutations: VisualMutation[] = [];
  for (const ip of intersections) {
    finalMutations.push({
      targetId: `seg-${ip.seg1}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    });
    finalMutations.push({
      targetId: `seg-${ip.seg2}`,
      property: 'highlight',
      from: 'default',
      to: 'hull',
      easing: 'spring',
    });
  }
  finalMutations.push({
    targetId: 'intersections',
    property: 'label',
    from: '',
    to: JSON.stringify(intersections),
    easing: 'linear',
  });

  record(
    `Found ${intersections.length} intersection${intersections.length !== 1 ? 's' : ''}`,
    14,
    finalMutations,
  );

  return {
    config: LINE_INTERSECTION_CONFIG,
    steps,
    finalState: intersections.map((_, i) => i),
  };
}
