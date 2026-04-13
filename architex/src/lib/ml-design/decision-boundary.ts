// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Decision Boundary Computation
// ─────────────────────────────────────────────────────────────
//
// Samples a 2D grid of points across the feature space, runs
// each through the network, and returns a grid of predictions
// suitable for heatmap rendering.
// ─────────────────────────────────────────────────────────────

import type { NeuralNetwork } from "./neural-network";

// ── Types ──────────────────────────────────────────────────

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DecisionBoundaryResult {
  /** 2D grid of prediction values [row][col] in [0, 1]. */
  grid: number[][];
  /** Spatial bounds used for the grid. */
  bounds: Bounds;
  /** Number of grid cells per axis. */
  resolution: number;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Compute the decision boundary of a neural network across 2D space.
 *
 * Samples a grid of `resolution x resolution` points uniformly
 * within `bounds`, runs each through the network, and collects
 * the first output neuron's value (expected to be in [0, 1] for
 * binary classification with sigmoid output).
 *
 * @param network    - Trained NeuralNetwork instance
 * @param bounds     - Spatial bounds {minX, maxX, minY, maxY}
 * @param resolution - Grid cells per axis (default 50)
 */
export function computeDecisionBoundary(
  network: NeuralNetwork,
  bounds: Bounds,
  resolution: number = 50,
): DecisionBoundaryResult {
  const grid: number[][] = [];

  const xStep = (bounds.maxX - bounds.minX) / resolution;
  const yStep = (bounds.maxY - bounds.minY) / resolution;

  for (let row = 0; row < resolution; row++) {
    const gridRow: number[] = [];
    // Map row to y-coordinate (top of canvas = maxY, bottom = minY)
    const y = bounds.maxY - (row + 0.5) * yStep;

    for (let col = 0; col < resolution; col++) {
      const x = bounds.minX + (col + 0.5) * xStep;
      const output = network.predict([x, y]);
      // Use first output neuron's value
      gridRow.push(output[0]);
    }

    grid.push(gridRow);
  }

  return { grid, bounds, resolution };
}
