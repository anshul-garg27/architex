// -----------------------------------------------------------------
// Architex -- Sample 2D Point Sets for Geometry Algorithm Demos
// -----------------------------------------------------------------

import type { Point2D } from './types';

/**
 * Generate a set of random 2D points within a bounded area.
 * Returns 15-20 points scattered across a 600x400 canvas with padding.
 */
export function generateSamplePoints(count?: number): Point2D[] {
  const n = count ?? (15 + Math.floor(Math.random() * 6)); // 15-20 points
  const padding = 40;
  const width = 600 - padding * 2;
  const height = 400 - padding * 2;

  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    points.push({
      id: `p${i}`,
      x: Math.round(padding + Math.random() * width),
      y: Math.round(padding + Math.random() * height),
    });
  }

  return points;
}

/**
 * A deterministic sample point set for reproducible demos.
 * 18 points spread in a roughly circular pattern with some interior points.
 */
export const SAMPLE_POINTS: Point2D[] = [
  { id: 'p0', x: 300, y: 360 },
  { id: 'p1', x: 120, y: 310 },
  { id: 'p2', x: 80, y: 200 },
  { id: 'p3', x: 130, y: 90 },
  { id: 'p4', x: 250, y: 50 },
  { id: 'p5', x: 380, y: 60 },
  { id: 'p6', x: 500, y: 100 },
  { id: 'p7', x: 540, y: 210 },
  { id: 'p8', x: 510, y: 320 },
  { id: 'p9', x: 420, y: 370 },
  { id: 'p10', x: 200, y: 370 },
  // Interior points (will be rejected by convex hull)
  { id: 'p11', x: 250, y: 200 },
  { id: 'p12', x: 320, y: 180 },
  { id: 'p13', x: 350, y: 250 },
  { id: 'p14', x: 200, y: 280 },
  { id: 'p15', x: 400, y: 200 },
  { id: 'p16', x: 280, y: 300 },
  { id: 'p17', x: 180, y: 170 },
];
