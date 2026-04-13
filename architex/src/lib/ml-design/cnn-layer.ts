// ─────────────────────────────────────────────────────────────
// Architex — ML Design: CNN Layer Visualization (MLD-014)
// ─────────────────────────────────────────────────────────────
//
// Educational 2D convolution simulation on small grids.
// Shows the sliding-window, element-wise multiply, and sum
// operations that make up a convolutional layer.
// ─────────────────────────────────────────────────────────────

export interface ConvStep {
  filterIdx: number;
  row: number;
  col: number;
  window: number[][];
  result: number;
  description: string;
}

export interface ConvResult {
  inputGrid: number[][];
  filters: number[][][];
  outputGrid: number[][];
  steps: ConvStep[];
}

/**
 * Generate a random 2D grid of the given size with values in [0, 1).
 */
export function generateInputGrid(rows: number, cols: number): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.round(Math.random() * 10) / 10);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Common 3x3 filters for demonstration.
 */
export const PRESET_FILTERS: Record<string, number[][]> = {
  edge: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  blur: [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
};

/**
 * Simulate a 2D convolution on a small input grid with one or more
 * filters. Returns the output grid plus a step-by-step trace of
 * the sliding window operation for visualization.
 *
 * @param input   2D grid (e.g. 8x8)
 * @param filter  3x3 (or any square) filter kernel
 * @param stride  Stride for the convolution (default 1)
 */
export function simulateConv2D(
  input: number[][],
  filter: number[][],
  stride: number = 1
): ConvResult {
  const inputRows = input.length;
  const inputCols = input[0].length;
  const fSize = filter.length;

  const outRows = Math.floor((inputRows - fSize) / stride) + 1;
  const outCols = Math.floor((inputCols - fSize) / stride) + 1;

  const outputGrid: number[][] = [];
  const steps: ConvStep[] = [];

  for (let r = 0; r < outRows; r++) {
    const outRow: number[] = [];
    for (let c = 0; c < outCols; c++) {
      const startR = r * stride;
      const startC = c * stride;

      // Extract the window
      const window: number[][] = [];
      let sum = 0;
      for (let fr = 0; fr < fSize; fr++) {
        const windowRow: number[] = [];
        for (let fc = 0; fc < fSize; fc++) {
          const val = input[startR + fr][startC + fc];
          windowRow.push(val);
          sum += val * filter[fr][fc];
        }
        window.push(windowRow);
      }

      const result = Math.round(sum * 100) / 100;
      outRow.push(result);

      steps.push({
        filterIdx: 0,
        row: r,
        col: c,
        window,
        result,
        description: `Window at (${startR},${startC}): element-wise multiply & sum = ${result.toFixed(2)}`,
      });
    }
    outputGrid.push(outRow);
  }

  return {
    inputGrid: input,
    filters: [filter],
    outputGrid,
    steps,
  };
}
