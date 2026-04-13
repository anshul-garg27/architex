// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Loss Landscape Computation
// ─────────────────────────────────────────────────────────────
//
// Computes a 2D loss landscape by sampling loss values along
// two random directions in weight space, centered at the
// current network parameters. Used for the isometric 3D
// surface plot in LossLandscapeCanvas.
// ─────────────────────────────────────────────────────────────

import { mse, binaryCrossEntropy } from "./loss-functions";

// ── Types ────────────────────────────────────────────────────

export interface LossLandscapeConfig {
  /** Flat weight vector of the network at its current position. */
  centerWeights: number[];
  /** Function that evaluates the loss for a given flat weight vector. */
  lossEvaluator: (weights: number[]) => number;
  /** Range of perturbation along each direction (default 1.0). */
  paramRange?: number;
  /** Grid resolution: number of samples along each axis (default 40). */
  resolution?: number;
  /** Optional seed directions (pair of unit vectors). */
  directions?: [number[], number[]];
}

export interface LossLandscapeResult {
  /** 2D grid of loss values. grid[row][col], row=direction2, col=direction1. */
  grid: number[][];
  /** Minimum loss value in the grid. */
  minLoss: number;
  /** Maximum loss value in the grid. */
  maxLoss: number;
  /** The center weight vector that was perturbed. */
  centerParams: number[];
  /** The two direction vectors used. */
  directions: [number[], number[]];
  /** The parameter range used. */
  paramRange: number;
  /** The resolution used. */
  resolution: number;
}

// ── Random direction generation ──────────────────────────────

/**
 * Generate a random unit vector in weight space of given dimension.
 * Uses Box-Muller for Gaussian random components, then normalises.
 */
function randomDirection(dim: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i++) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    v.push(
      Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2),
    );
  }

  // Normalise to unit length
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += v[i] * v[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < dim; i++) {
    v[i] /= norm;
  }

  return v;
}

/**
 * Orthogonalise `b` against `a` using Gram-Schmidt, then normalise.
 */
function orthogonalise(a: number[], b: number[]): number[] {
  // dot product of a and b
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }

  // Subtract projection: b' = b - (a . b) * a
  const result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(b[i] - dot * a[i]);
  }

  // Normalise
  let norm = 0;
  for (let i = 0; i < result.length; i++) {
    norm += result[i] * result[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < result.length; i++) {
    result[i] /= norm;
  }

  return result;
}

// ── Loss landscape computation ───────────────────────────────

/**
 * Compute a 2D loss landscape grid.
 *
 * Picks two random orthogonal directions in weight space and
 * evaluates the loss at grid points along both directions,
 * centered at `centerWeights`.
 *
 * @param config - Configuration for the landscape computation.
 * @returns A 2D grid of loss values with metadata.
 */
export function computeLossLandscape(
  config: LossLandscapeConfig,
): LossLandscapeResult {
  const {
    centerWeights,
    lossEvaluator,
    paramRange = 1.0,
    resolution = 40,
  } = config;

  const dim = centerWeights.length;

  // Generate orthogonal direction pair
  let dir1: number[];
  let dir2: number[];

  if (config.directions) {
    dir1 = config.directions[0];
    dir2 = config.directions[1];
  } else {
    dir1 = randomDirection(dim);
    const rawDir2 = randomDirection(dim);
    dir2 = orthogonalise(dir1, rawDir2);
  }

  // Build the sampling grid
  const grid: number[][] = [];
  let minLoss = Infinity;
  let maxLoss = -Infinity;

  // We sample from [-paramRange, +paramRange] along each direction
  const step = (2 * paramRange) / (resolution - 1);
  const perturbedWeights: number[] = new Array(dim);

  for (let row = 0; row < resolution; row++) {
    const alpha2 = -paramRange + row * step; // displacement along dir2
    const gridRow: number[] = [];

    for (let col = 0; col < resolution; col++) {
      const alpha1 = -paramRange + col * step; // displacement along dir1

      // Compute perturbed weights: w = center + alpha1 * dir1 + alpha2 * dir2
      for (let k = 0; k < dim; k++) {
        perturbedWeights[k] =
          centerWeights[k] + alpha1 * dir1[k] + alpha2 * dir2[k];
      }

      const loss = lossEvaluator(perturbedWeights);
      gridRow.push(loss);

      if (loss < minLoss) minLoss = loss;
      if (loss > maxLoss) maxLoss = loss;
    }

    grid.push(gridRow);
  }

  return {
    grid,
    minLoss,
    maxLoss,
    centerParams: centerWeights.slice(),
    directions: [dir1, dir2],
    paramRange,
    resolution,
  };
}

// ── Convenience: build a loss evaluator for a simple network ─

export interface SimpleLossEvaluatorConfig {
  /** Function that runs a forward pass given flat weights, returns predictions for all samples. */
  forwardFn: (weights: number[], inputs: number[][]) => number[][];
  /** Input samples (each is a feature vector). */
  inputs: number[][];
  /** Target values (each is a target vector). */
  targets: number[][];
  /** Loss function to use. */
  lossFn: "mse" | "binaryCrossEntropy";
}

/**
 * Create a loss evaluator function from a simple forward function.
 * This is a convenience wrapper for use with `computeLossLandscape`.
 */
export function createLossEvaluator(
  config: SimpleLossEvaluatorConfig,
): (weights: number[]) => number {
  const { forwardFn, inputs, targets, lossFn } = config;

  const lossFunction = lossFn === "mse" ? mse : binaryCrossEntropy;

  return (weights: number[]): number => {
    const predictions = forwardFn(weights, inputs);
    let totalLoss = 0;

    for (let i = 0; i < predictions.length; i++) {
      totalLoss += lossFunction(predictions[i], targets[i]);
    }

    return predictions.length > 0 ? totalLoss / predictions.length : 0;
  };
}

// ── Synthetic landscape generators (for demo/testing) ────────

/**
 * Generate a synthetic loss landscape with a known shape.
 * Useful for testing the visualiser without a real network.
 */
export function generateSyntheticLandscape(
  shape: "bowl" | "saddle" | "multimodal",
  resolution: number = 40,
  paramRange: number = 2.0,
): LossLandscapeResult {
  const grid: number[][] = [];
  let minLoss = Infinity;
  let maxLoss = -Infinity;
  const step = (2 * paramRange) / (resolution - 1);

  for (let row = 0; row < resolution; row++) {
    const y = -paramRange + row * step;
    const gridRow: number[] = [];

    for (let col = 0; col < resolution; col++) {
      const x = -paramRange + col * step;
      let loss: number;

      switch (shape) {
        case "bowl":
          // Simple quadratic bowl centered at origin
          loss = x * x + y * y;
          break;
        case "saddle":
          // Saddle point at origin
          loss = x * x - y * y + 2;
          break;
        case "multimodal":
          // Multiple local minima
          loss =
            Math.sin(x * 2) * Math.cos(y * 2) +
            0.3 * (x * x + y * y) +
            2;
          break;
      }

      gridRow.push(loss);
      if (loss < minLoss) minLoss = loss;
      if (loss > maxLoss) maxLoss = loss;
    }

    grid.push(gridRow);
  }

  // Create dummy directions (unit vectors along x and y)
  const dim = 2;
  const dir1 = [1, 0];
  const dir2 = [0, 1];

  return {
    grid,
    minLoss,
    maxLoss,
    centerParams: new Array(dim).fill(0),
    directions: [dir1, dir2],
    paramRange,
    resolution,
  };
}
