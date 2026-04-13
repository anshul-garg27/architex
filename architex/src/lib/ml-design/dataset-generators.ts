// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Dataset Generators (Neural Network Core)
// ─────────────────────────────────────────────────────────────
//
// Five 2D classification dataset generators for training and
// visualising neural networks. Each returns labelled points
// with spatial bounds for rendering.
// ─────────────────────────────────────────────────────────────

export interface DatasetPoint {
  x: number;
  y: number;
  label: number;
}

export interface GeneratedDataset {
  points: DatasetPoint[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

// ── Helpers ────────────────────────────────────────────────

/** Box-Muller transform for normally distributed random numbers. */
function randn(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Compute axis-aligned bounding box with 10% padding. */
function computeBounds(points: DatasetPoint[]): GeneratedDataset["bounds"] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const padX = (maxX - minX) * 0.1 || 0.5;
  const padY = (maxY - minY) * 0.1 || 0.5;
  return {
    minX: minX - padX,
    maxX: maxX + padX,
    minY: minY - padY,
    maxY: maxY + padY,
  };
}

// ── Generators ─────────────────────────────────────────────

/**
 * Two concentric circles (inner = class 0, outer = class 1).
 *
 * @param n     - Total number of points
 * @param noise - Gaussian noise standard deviation (default 0.05)
 */
export function generateCircleDataset(
  n: number,
  noise: number = 0.05
): GeneratedDataset {
  const points: DatasetPoint[] = [];
  const half = Math.floor(n / 2);

  // Inner circle — class 0
  for (let i = 0; i < half; i++) {
    const angle = (2 * Math.PI * i) / half;
    const r = 0.3 + randn() * noise;
    points.push({
      x: r * Math.cos(angle) + randn() * noise,
      y: r * Math.sin(angle) + randn() * noise,
      label: 0,
    });
  }

  // Outer circle — class 1
  for (let i = 0; i < n - half; i++) {
    const angle = (2 * Math.PI * i) / (n - half);
    const r = 0.8 + randn() * noise;
    points.push({
      x: r * Math.cos(angle) + randn() * noise,
      y: r * Math.sin(angle) + randn() * noise,
      label: 1,
    });
  }

  return { points, bounds: computeBounds(points) };
}

/**
 * XOR pattern — 4 quadrants, opposite quadrants share a class.
 *
 * @param n     - Total number of points
 * @param noise - Gaussian noise standard deviation (default 0.1)
 */
export function generateXORDataset(
  n: number,
  noise: number = 0.1
): GeneratedDataset {
  const points: DatasetPoint[] = [];

  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 2 + randn() * noise;
    const y = (Math.random() - 0.5) * 2 + randn() * noise;
    // Quadrants I & III => class 1, II & IV => class 0
    const label = x * y > 0 ? 1 : 0;
    points.push({ x, y, label });
  }

  return { points, bounds: computeBounds(points) };
}

/**
 * Gaussian clusters with configurable count and spread.
 *
 * @param n        - Total number of points
 * @param clusters - Number of clusters (default 3)
 * @param spread   - Gaussian standard deviation per cluster (default 0.3)
 */
export function generateGaussianDataset(
  n: number,
  clusters: number = 3,
  spread: number = 0.3
): GeneratedDataset {
  const points: DatasetPoint[] = [];
  const clusterCount = Math.max(2, clusters);
  const perCluster = Math.floor(n / clusterCount);

  // Place cluster centres uniformly on a circle of radius 1
  for (let c = 0; c < clusterCount; c++) {
    const angle = (2 * Math.PI * c) / clusterCount;
    const cx = Math.cos(angle);
    const cy = Math.sin(angle);
    const count = c < clusterCount - 1 ? perCluster : n - perCluster * (clusterCount - 1);

    for (let i = 0; i < count; i++) {
      points.push({
        x: cx + randn() * spread,
        y: cy + randn() * spread,
        label: c,
      });
    }
  }

  return { points, bounds: computeBounds(points) };
}

/**
 * Spiral arms — each arm is a distinct class.
 *
 * @param n    - Total number of points
 * @param arms - Number of spiral arms (default 2)
 */
export function generateSpiralDataset(
  n: number,
  arms: number = 2
): GeneratedDataset {
  const points: DatasetPoint[] = [];
  const armCount = Math.max(2, arms);
  const perArm = Math.floor(n / armCount);

  for (let a = 0; a < armCount; a++) {
    const count = a < armCount - 1 ? perArm : n - perArm * (armCount - 1);
    const offset = (2 * Math.PI * a) / armCount;

    for (let i = 0; i < count; i++) {
      const t = (i / count) * 2 * Math.PI;
      const r = 0.1 + (0.9 * i) / count;
      const noiseR = r * 0.1;
      points.push({
        x: r * Math.cos(t + offset) + randn() * noiseR,
        y: r * Math.sin(t + offset) + randn() * noiseR,
        label: a,
      });
    }
  }

  return { points, bounds: computeBounds(points) };
}

/**
 * Two interleaving half-moons (class 0 = upper, class 1 = lower).
 *
 * @param n     - Total number of points
 * @param noise - Gaussian noise standard deviation (default 0.1)
 */
export function generateMoonDataset(
  n: number,
  noise: number = 0.1
): GeneratedDataset {
  const points: DatasetPoint[] = [];
  const half = Math.floor(n / 2);

  // Upper moon — class 0
  for (let i = 0; i < half; i++) {
    const angle = (Math.PI * i) / half;
    points.push({
      x: Math.cos(angle) + randn() * noise,
      y: Math.sin(angle) + randn() * noise,
      label: 0,
    });
  }

  // Lower moon — class 1 (shifted right and down)
  for (let i = 0; i < n - half; i++) {
    const angle = (Math.PI * i) / (n - half);
    points.push({
      x: 1 - Math.cos(angle) + randn() * noise,
      y: -Math.sin(angle) + 0.5 + randn() * noise,
      label: 1,
    });
  }

  return { points, bounds: computeBounds(points) };
}
