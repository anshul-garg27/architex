// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Loss Functions (Neural Network Core)
// ─────────────────────────────────────────────────────────────
//
// Standard loss functions used in neural network training,
// each paired with its derivative for backpropagation.
// ─────────────────────────────────────────────────────────────

// ── Clipping helper ───────────────────────────────────────

/** Clamp a value to [eps, 1 - eps] to avoid log(0). */
function clip(x: number, eps: number = 1e-7): number {
  return Math.max(eps, Math.min(1 - eps, x));
}

// ── Mean Squared Error ────────────────────────────────────

/**
 * Mean Squared Error: (1/n) * sum((predicted_i - actual_i)^2).
 *
 * @param predicted - Array of predicted values
 * @param actual    - Array of ground-truth values
 */
export function mse(predicted: number[], actual: number[]): number {
  const n = predicted.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const diff = predicted[i] - actual[i];
    sum += diff * diff;
  }
  return sum / n;
}

/**
 * Derivative of MSE w.r.t. each predicted value.
 * d/d(predicted_i) = (2/n) * (predicted_i - actual_i)
 */
export function mseDerivative(predicted: number[], actual: number[]): number[] {
  const n = predicted.length;
  if (n === 0) return [];
  const factor = 2 / n;
  return predicted.map((p, i) => factor * (p - actual[i]));
}

// ── Binary Cross-Entropy ─────────────────────────────────

/**
 * Binary cross-entropy loss (per-sample average).
 * Clips predictions near 0 and 1 for numerical stability.
 *
 * L = -(1/n) * sum( actual_i * log(pred_i) + (1 - actual_i) * log(1 - pred_i) )
 *
 * @param predicted - Array of predicted probabilities [0, 1]
 * @param actual    - Array of ground-truth labels (0 or 1)
 */
export function binaryCrossEntropy(
  predicted: number[],
  actual: number[]
): number {
  const n = predicted.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p = clip(predicted[i]);
    sum += actual[i] * Math.log(p) + (1 - actual[i]) * Math.log(1 - p);
  }
  return -sum / n;
}

/**
 * Derivative of binary cross-entropy w.r.t. each predicted value.
 * d/d(pred_i) = (1/n) * ( -actual_i / pred_i + (1 - actual_i) / (1 - pred_i) )
 */
export function binaryCrossEntropyDerivative(
  predicted: number[],
  actual: number[]
): number[] {
  const n = predicted.length;
  if (n === 0) return [];
  return predicted.map((pred, i) => {
    const p = clip(pred);
    return (1 / n) * (-actual[i] / p + (1 - actual[i]) / (1 - p));
  });
}

// ── Categorical Cross-Entropy ────────────────────────────

/**
 * Categorical cross-entropy loss.
 * Expects `actual` as a one-hot vector and `predicted` as a
 * probability distribution (e.g. softmax output).
 *
 * L = -sum( actual_i * log(pred_i) )
 *
 * @param predicted - Array of predicted class probabilities
 * @param actual    - One-hot encoded ground-truth vector
 */
export function categoricalCrossEntropy(
  predicted: number[],
  actual: number[]
): number {
  const n = predicted.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] > 0) {
      sum += actual[i] * Math.log(clip(predicted[i]));
    }
  }
  return -sum;
}

/**
 * Derivative of categorical cross-entropy w.r.t. each predicted value.
 * d/d(pred_i) = -actual_i / pred_i
 */
export function categoricalCrossEntropyDerivative(
  predicted: number[],
  actual: number[]
): number[] {
  return predicted.map((pred, i) => {
    const p = clip(pred);
    return -actual[i] / p;
  });
}
