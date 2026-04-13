// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Classification Dataset Generators
// ─────────────────────────────────────────────────────────────
//
// Generates 2D classification datasets for training toy neural
// networks. Each generator returns an array of [x, y] points
// in roughly [-1, 1] and binary labels (0 or 1).
// ─────────────────────────────────────────────────────────────

export interface Dataset {
  points: [number, number][];
  labels: number[];
}

/** Two concentric circles (inner = class 0, outer = class 1). */
export function generateCircle(n: number): Dataset {
  const points: [number, number][] = [];
  const labels: number[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const angle = (2 * Math.PI * i) / half + (Math.random() - 0.5) * 0.3;
    const r = 0.3 + (Math.random() - 0.5) * 0.1;
    points.push([r * Math.cos(angle), r * Math.sin(angle)]);
    labels.push(0);
  }
  for (let i = 0; i < n - half; i++) {
    const angle =
      (2 * Math.PI * i) / (n - half) + (Math.random() - 0.5) * 0.3;
    const r = 0.75 + (Math.random() - 0.5) * 0.15;
    points.push([r * Math.cos(angle), r * Math.sin(angle)]);
    labels.push(1);
  }
  return { points, labels };
}

/** XOR-like dataset: class 1 in quadrants I & III. */
export function generateXOR(n: number): Dataset {
  const points: [number, number][] = [];
  const labels: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 2;
    points.push([x, y]);
    labels.push(x * y > 0 ? 1 : 0);
  }
  return { points, labels };
}

/** Two interleaving spirals. */
export function generateSpiral(n: number): Dataset {
  const points: [number, number][] = [];
  const labels: number[] = [];
  const half = Math.floor(n / 2);
  for (let cls = 0; cls < 2; cls++) {
    const count = cls === 0 ? half : n - half;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const r = (0.1 + (0.8 * i) / count) * (1 + (Math.random() - 0.5) * 0.15);
      const angle = t + cls * Math.PI;
      points.push([r * Math.cos(angle), r * Math.sin(angle)]);
      labels.push(cls);
    }
  }
  return { points, labels };
}

/** Two Gaussian clusters offset from each other. */
export function generateGaussian(n: number): Dataset {
  const points: [number, number][] = [];
  const labels: number[] = [];
  const half = Math.floor(n / 2);

  function randn(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  }

  for (let i = 0; i < half; i++) {
    points.push([randn() * 0.3 - 0.5, randn() * 0.3 - 0.5]);
    labels.push(0);
  }
  for (let i = 0; i < n - half; i++) {
    points.push([randn() * 0.3 + 0.5, randn() * 0.3 + 0.5]);
    labels.push(1);
  }
  return { points, labels };
}

export type DatasetType = "circle" | "xor" | "spiral" | "gaussian";

export const DATASET_GENERATORS: Record<DatasetType, (n: number) => Dataset> = {
  circle: generateCircle,
  xor: generateXOR,
  spiral: generateSpiral,
  gaussian: generateGaussian,
};
