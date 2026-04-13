// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Optimizers (Neural Network Core)
// ─────────────────────────────────────────────────────────────
//
// Three gradient-based optimizers that maintain internal state
// (momentum buffers, squared-gradient accumulators, etc.).
// Each exposes an `update(weights, gradients)` method that
// returns the new weight vector.
// ─────────────────────────────────────────────────────────────

// ── Common interface ──────────────────────────────────────

export interface Optimizer {
  /** Apply one update step and return new weights. */
  update(weights: number[], gradients: number[]): number[];
  /** Reset all internal state (momentum, accumulators, timestep). */
  reset(): void;
}

// ── SGD with optional momentum ────────────────────────────

export class SGDOptimizer implements Optimizer {
  private readonly lr: number;
  private readonly momentum: number;
  private velocity: number[];

  /**
   * @param learningRate - Step size (default 0.01)
   * @param momentum     - Momentum coefficient (default 0, i.e. vanilla SGD)
   */
  constructor(learningRate: number = 0.01, momentum: number = 0) {
    this.lr = learningRate;
    this.momentum = momentum;
    this.velocity = [];
  }

  update(weights: number[], gradients: number[]): number[] {
    // Lazily initialise velocity buffer
    if (this.velocity.length !== weights.length) {
      this.velocity = new Array<number>(weights.length).fill(0);
    }

    const result: number[] = new Array<number>(weights.length);
    for (let i = 0; i < weights.length; i++) {
      // v_t = momentum * v_{t-1} + lr * g
      this.velocity[i] = this.momentum * this.velocity[i] + this.lr * gradients[i];
      // w_t = w_{t-1} - v_t
      result[i] = weights[i] - this.velocity[i];
    }
    return result;
  }

  reset(): void {
    this.velocity = [];
  }
}

// ── Adam ──────────────────────────────────────────────────

export class AdamOptimizer implements Optimizer {
  private readonly lr: number;
  private readonly beta1: number;
  private readonly beta2: number;
  private readonly epsilon: number;
  private m: number[];  // first moment (mean)
  private v: number[];  // second moment (uncentred variance)
  private t: number;    // timestep

  /**
   * @param learningRate - Step size (default 0.001)
   * @param beta1        - Exponential decay for first moment (default 0.9)
   * @param beta2        - Exponential decay for second moment (default 0.999)
   * @param epsilon      - Small constant for numerical stability (default 1e-8)
   */
  constructor(
    learningRate: number = 0.001,
    beta1: number = 0.9,
    beta2: number = 0.999,
    epsilon: number = 1e-8
  ) {
    this.lr = learningRate;
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.epsilon = epsilon;
    this.m = [];
    this.v = [];
    this.t = 0;
  }

  update(weights: number[], gradients: number[]): number[] {
    this.t++;

    // Lazily initialise moment buffers
    if (this.m.length !== weights.length) {
      this.m = new Array<number>(weights.length).fill(0);
      this.v = new Array<number>(weights.length).fill(0);
    }

    const result: number[] = new Array<number>(weights.length);
    const biasCorrection1 = 1 - Math.pow(this.beta1, this.t);
    const biasCorrection2 = 1 - Math.pow(this.beta2, this.t);

    for (let i = 0; i < weights.length; i++) {
      // Update biased first moment estimate
      this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * gradients[i];
      // Update biased second raw moment estimate
      this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * gradients[i] * gradients[i];

      // Bias-corrected estimates
      const mHat = this.m[i] / biasCorrection1;
      const vHat = this.v[i] / biasCorrection2;

      // Update weights
      result[i] = weights[i] - this.lr * mHat / (Math.sqrt(vHat) + this.epsilon);
    }
    return result;
  }

  reset(): void {
    this.m = [];
    this.v = [];
    this.t = 0;
  }
}

// ── RMSProp ───────────────────────────────────────────────

export class RMSPropOptimizer implements Optimizer {
  private readonly lr: number;
  private readonly decayRate: number;
  private readonly epsilon: number;
  private cache: number[];  // running average of squared gradients

  /**
   * @param learningRate - Step size (default 0.001)
   * @param decayRate    - Decay factor for running average (default 0.9)
   * @param epsilon      - Small constant for numerical stability (default 1e-8)
   */
  constructor(
    learningRate: number = 0.001,
    decayRate: number = 0.9,
    epsilon: number = 1e-8
  ) {
    this.lr = learningRate;
    this.decayRate = decayRate;
    this.epsilon = epsilon;
    this.cache = [];
  }

  update(weights: number[], gradients: number[]): number[] {
    // Lazily initialise cache
    if (this.cache.length !== weights.length) {
      this.cache = new Array<number>(weights.length).fill(0);
    }

    const result: number[] = new Array<number>(weights.length);
    for (let i = 0; i < weights.length; i++) {
      // Update running average of squared gradients
      this.cache[i] =
        this.decayRate * this.cache[i] +
        (1 - this.decayRate) * gradients[i] * gradients[i];

      // Update weights
      result[i] =
        weights[i] - this.lr * gradients[i] / (Math.sqrt(this.cache[i]) + this.epsilon);
    }
    return result;
  }

  reset(): void {
    this.cache = [];
  }
}
