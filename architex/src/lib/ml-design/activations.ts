// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Activation Functions (Neural Network Core)
// ─────────────────────────────────────────────────────────────
//
// Pure-function activation library with forward and derivative
// implementations. Each derivative takes the *output* of the
// activation (not the pre-activation), matching the convention
// used in backpropagation.
// ─────────────────────────────────────────────────────────────

// ── ReLU ──────────────────────────────────────────────────

/** Rectified Linear Unit: max(0, x). */
export function relu(x: number): number {
  return x > 0 ? x : 0;
}

/** Derivative of ReLU: 1 if x > 0, else 0. Takes pre-activation input. */
export function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

// ── Sigmoid ───────────────────────────────────────────────

/**
 * Logistic sigmoid with numerical stability.
 * Clamps input to [-500, 500] to avoid overflow in Math.exp.
 */
export function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  if (clamped >= 0) {
    const ez = Math.exp(-clamped);
    return 1 / (1 + ez);
  }
  // For negative values, use the numerically stable form
  const ez = Math.exp(clamped);
  return ez / (1 + ez);
}

/**
 * Derivative of sigmoid. Takes the sigmoid *output* s = sigmoid(x).
 * d/dx sigmoid(x) = s * (1 - s)
 */
export function sigmoidDerivative(s: number): number {
  return s * (1 - s);
}

// ── Tanh ──────────────────────────────────────────────────

/** Hyperbolic tangent activation. */
export function tanh(x: number): number {
  return Math.tanh(x);
}

/**
 * Derivative of tanh. Takes the tanh *output* t = tanh(x).
 * d/dx tanh(x) = 1 - t^2
 */
export function tanhDerivative(t: number): number {
  return 1 - t * t;
}

// ── Leaky ReLU ────────────────────────────────────────────

/** Leaky ReLU: x if x > 0, else alpha * x. */
export function leakyRelu(x: number, alpha: number = 0.01): number {
  return x > 0 ? x : alpha * x;
}

/** Derivative of Leaky ReLU: 1 if x > 0, else alpha. Takes pre-activation input. */
export function leakyReluDerivative(x: number, alpha: number = 0.01): number {
  return x > 0 ? 1 : alpha;
}

// ── Softmax ───────────────────────────────────────────────

/**
 * Softmax over an array of logits.
 * Subtracts the max value for numerical stability before exponentiation.
 */
export function softmax(x: number[]): number[] {
  if (x.length === 0) return [];

  const maxVal = Math.max(...x);
  const exps = x.map((v) => Math.exp(v - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExps);
}

// ── Linear (Identity) ────────────────────────────────────

/** Linear (identity) activation: f(x) = x. */
export function linear(x: number): number {
  return x;
}

/** Derivative of linear activation: always 1. */
export function linearDerivative(_x: number): number {
  return 1;
}
