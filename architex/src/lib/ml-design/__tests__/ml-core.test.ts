import { describe, it, expect } from "vitest";
import {
  generateCircleDataset,
  generateXORDataset,
  generateGaussianDataset,
  generateSpiralDataset,
  generateMoonDataset,
} from "@/lib/ml-design/dataset-generators";
import {
  relu,
  reluDerivative,
  sigmoid,
  sigmoidDerivative,
  tanh,
  tanhDerivative,
  leakyRelu,
  leakyReluDerivative,
  softmax,
  linear,
  linearDerivative,
} from "@/lib/ml-design/activations";
import {
  mse,
  mseDerivative,
  binaryCrossEntropy,
  binaryCrossEntropyDerivative,
  categoricalCrossEntropy,
  categoricalCrossEntropyDerivative,
} from "@/lib/ml-design/loss-functions";
import {
  SGDOptimizer,
  AdamOptimizer,
  RMSPropOptimizer,
} from "@/lib/ml-design/optimizers";

// ── Dataset Generators ────────────────────────────────────

describe("Dataset Generators", () => {
  it("generateCircleDataset produces correct number of points", () => {
    const ds = generateCircleDataset(100);
    expect(ds.points).toHaveLength(100);
  });

  it("generateCircleDataset returns valid bounds", () => {
    const ds = generateCircleDataset(50);
    expect(ds.bounds.minX).toBeLessThan(ds.bounds.maxX);
    expect(ds.bounds.minY).toBeLessThan(ds.bounds.maxY);
  });

  it("generateXORDataset produces correct number of points", () => {
    const ds = generateXORDataset(80);
    expect(ds.points).toHaveLength(80);
  });

  it("generateXORDataset assigns binary labels", () => {
    const ds = generateXORDataset(100);
    for (const p of ds.points) {
      expect(p.label === 0 || p.label === 1).toBe(true);
    }
  });

  it("generateGaussianDataset produces correct number of points", () => {
    const ds = generateGaussianDataset(90, 3);
    expect(ds.points).toHaveLength(90);
  });

  it("generateGaussianDataset creates requested number of clusters", () => {
    const ds = generateGaussianDataset(120, 4);
    const labels = new Set(ds.points.map((p) => p.label));
    expect(labels.size).toBe(4);
  });

  it("generateSpiralDataset produces correct number of points", () => {
    const ds = generateSpiralDataset(60, 3);
    expect(ds.points).toHaveLength(60);
  });

  it("generateMoonDataset produces correct number of points", () => {
    const ds = generateMoonDataset(100);
    expect(ds.points).toHaveLength(100);
  });

  it("generateMoonDataset assigns binary labels", () => {
    const ds = generateMoonDataset(50);
    const labels = new Set(ds.points.map((p) => p.label));
    expect(labels.size).toBe(2);
    expect(labels.has(0)).toBe(true);
    expect(labels.has(1)).toBe(true);
  });

  it("all generators include x, y, and label on every point", () => {
    const datasets = [
      generateCircleDataset(10),
      generateXORDataset(10),
      generateGaussianDataset(10),
      generateSpiralDataset(10),
      generateMoonDataset(10),
    ];
    for (const ds of datasets) {
      for (const p of ds.points) {
        expect(typeof p.x).toBe("number");
        expect(typeof p.y).toBe("number");
        expect(typeof p.label).toBe("number");
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    }
  });
});

// ── Activation Functions ──────────────────────────────────

describe("Activation Functions", () => {
  it("relu of negative values returns 0", () => {
    expect(relu(-5)).toBe(0);
    expect(relu(-0.01)).toBe(0);
  });

  it("relu of positive values returns x", () => {
    expect(relu(3)).toBe(3);
    expect(relu(0.5)).toBe(0.5);
  });

  it("relu(0) returns 0", () => {
    expect(relu(0)).toBe(0);
  });

  it("reluDerivative is 0 for negative, 1 for positive", () => {
    expect(reluDerivative(-1)).toBe(0);
    expect(reluDerivative(1)).toBe(1);
  });

  it("sigmoid(0) returns 0.5", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 10);
  });

  it("sigmoid is bounded between 0 and 1", () => {
    expect(sigmoid(-100)).toBeGreaterThanOrEqual(0);
    expect(sigmoid(-100)).toBeLessThanOrEqual(1);
    expect(sigmoid(100)).toBeGreaterThanOrEqual(0);
    expect(sigmoid(100)).toBeLessThanOrEqual(1);
    // Mid-range values are strictly interior
    expect(sigmoid(-5)).toBeGreaterThan(0);
    expect(sigmoid(-5)).toBeLessThan(1);
    expect(sigmoid(5)).toBeGreaterThan(0);
    expect(sigmoid(5)).toBeLessThan(1);
  });

  it("sigmoid is numerically stable for extreme inputs", () => {
    expect(Number.isFinite(sigmoid(1000))).toBe(true);
    expect(Number.isFinite(sigmoid(-1000))).toBe(true);
  });

  it("sigmoidDerivative at sigmoid(0) = 0.25", () => {
    const s = sigmoid(0);
    expect(sigmoidDerivative(s)).toBeCloseTo(0.25, 10);
  });

  it("tanh(0) returns 0", () => {
    expect(tanh(0)).toBeCloseTo(0, 10);
  });

  it("tanhDerivative at tanh(0) = 1", () => {
    const t = tanh(0);
    expect(tanhDerivative(t)).toBeCloseTo(1, 10);
  });

  it("leakyRelu passes positive values through", () => {
    expect(leakyRelu(5)).toBe(5);
  });

  it("leakyRelu applies alpha to negative values", () => {
    expect(leakyRelu(-10, 0.01)).toBeCloseTo(-0.1, 10);
  });

  it("leakyReluDerivative returns 1 for positive, alpha for negative", () => {
    expect(leakyReluDerivative(5, 0.2)).toBe(1);
    expect(leakyReluDerivative(-5, 0.2)).toBe(0.2);
  });

  it("softmax output sums to 1", () => {
    const result = softmax([1, 2, 3, 4]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("softmax handles identical inputs equally", () => {
    const result = softmax([2, 2, 2]);
    for (const v of result) {
      expect(v).toBeCloseTo(1 / 3, 10);
    }
  });

  it("softmax returns empty array for empty input", () => {
    expect(softmax([])).toEqual([]);
  });

  it("softmax is numerically stable for large values", () => {
    const result = softmax([1000, 1001, 1002]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
    for (const v of result) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("linear returns x unchanged", () => {
    expect(linear(42)).toBe(42);
    expect(linear(-3.14)).toBe(-3.14);
  });

  it("linearDerivative is always 1", () => {
    expect(linearDerivative(0)).toBe(1);
    expect(linearDerivative(999)).toBe(1);
  });
});

// ── Loss Functions ────────────────────────────────────────

describe("Loss Functions", () => {
  it("MSE of identical arrays is 0", () => {
    expect(mse([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it("MSE is positive for different arrays", () => {
    expect(mse([1, 0], [0, 1])).toBeGreaterThan(0);
  });

  it("MSE computes correctly", () => {
    // (1-0)^2 + (0-1)^2 = 2, average = 1
    expect(mse([1, 0], [0, 1])).toBeCloseTo(1, 10);
  });

  it("mseDerivative is zero for identical arrays", () => {
    const d = mseDerivative([3, 3, 3], [3, 3, 3]);
    for (const v of d) {
      expect(v).toBeCloseTo(0, 10);
    }
  });

  it("mseDerivative has correct sign", () => {
    // predicted > actual => positive derivative
    const d = mseDerivative([2], [1]);
    expect(d[0]).toBeGreaterThan(0);
  });

  it("binaryCrossEntropy is 0 for perfect predictions (near-exact)", () => {
    // Predictions very close to actual labels
    const loss = binaryCrossEntropy([0.9999, 0.0001], [1, 0]);
    expect(loss).toBeLessThan(0.01);
  });

  it("binaryCrossEntropy increases for worse predictions", () => {
    const good = binaryCrossEntropy([0.9, 0.1], [1, 0]);
    const bad = binaryCrossEntropy([0.5, 0.5], [1, 0]);
    expect(bad).toBeGreaterThan(good);
  });

  it("binaryCrossEntropy handles edge predictions safely", () => {
    // Should not produce NaN or Infinity for predictions at 0 or 1
    const loss = binaryCrossEntropy([0, 1], [1, 0]);
    expect(Number.isFinite(loss)).toBe(true);
  });

  it("binaryCrossEntropyDerivative returns finite values", () => {
    const d = binaryCrossEntropyDerivative([0.5, 0.5], [1, 0]);
    for (const v of d) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("categoricalCrossEntropy is near 0 for perfect prediction", () => {
    const loss = categoricalCrossEntropy([0.999, 0.001], [1, 0]);
    expect(loss).toBeLessThan(0.01);
  });

  it("categoricalCrossEntropyDerivative returns finite values", () => {
    const d = categoricalCrossEntropyDerivative([0.7, 0.3], [1, 0]);
    for (const v of d) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("MSE of empty arrays is 0", () => {
    expect(mse([], [])).toBe(0);
  });
});

// ── Optimizers ────────────────────────────────────────────

describe("Optimizers", () => {
  describe("SGDOptimizer", () => {
    it("moves weights in the opposite direction of positive gradients", () => {
      const sgd = new SGDOptimizer(0.1);
      const weights = [1.0, 2.0, 3.0];
      const gradients = [0.5, 0.5, 0.5];
      const updated = sgd.update(weights, gradients);

      for (let i = 0; i < weights.length; i++) {
        expect(updated[i]).toBeLessThan(weights[i]);
      }
    });

    it("moves weights upward for negative gradients", () => {
      const sgd = new SGDOptimizer(0.1);
      const weights = [1.0, 2.0];
      const gradients = [-1.0, -1.0];
      const updated = sgd.update(weights, gradients);

      for (let i = 0; i < weights.length; i++) {
        expect(updated[i]).toBeGreaterThan(weights[i]);
      }
    });

    it("does not change weights when gradients are zero", () => {
      const sgd = new SGDOptimizer(0.1);
      const weights = [1.0, 2.0];
      const updated = sgd.update(weights, [0, 0]);
      expect(updated).toEqual(weights);
    });

    it("momentum accelerates updates over steps", () => {
      const sgd = new SGDOptimizer(0.1, 0.9);
      const weights = [5.0];
      const gradients = [1.0];

      const after1 = sgd.update(weights, gradients);
      const step1 = weights[0] - after1[0];

      const after2 = sgd.update(after1, gradients);
      const step2 = after1[0] - after2[0];

      // With momentum, second step should be larger
      expect(step2).toBeGreaterThan(step1);
    });

    it("reset clears velocity state", () => {
      const sgd = new SGDOptimizer(0.1, 0.9);
      sgd.update([1], [1]);
      sgd.reset();
      // After reset, should behave like a fresh optimizer
      const result = sgd.update([1], [1]);
      expect(result[0]).toBeCloseTo(1 - 0.1, 10);
    });
  });

  describe("AdamOptimizer", () => {
    it("moves weights in the gradient direction", () => {
      const adam = new AdamOptimizer(0.01);
      const weights = [1.0, 2.0];
      const gradients = [1.0, 1.0];
      const updated = adam.update(weights, gradients);

      for (let i = 0; i < weights.length; i++) {
        expect(updated[i]).toBeLessThan(weights[i]);
      }
    });

    it("applies bias correction (step 1 produces non-trivial update)", () => {
      const adam = new AdamOptimizer(0.1);
      const weights = [0.0];
      const gradients = [1.0];
      const updated = adam.update(weights, gradients);
      // With bias correction at t=1, the effective lr is large
      expect(Math.abs(updated[0])).toBeGreaterThan(0);
    });

    it("reset clears internal state", () => {
      const adam = new AdamOptimizer(0.01);
      adam.update([1], [1]);
      adam.update([0.9], [0.9]);
      adam.reset();
      // First update after reset should match a fresh optimizer
      const fresh = new AdamOptimizer(0.01);
      const resultReset = adam.update([1], [0.5]);
      const resultFresh = fresh.update([1], [0.5]);
      expect(resultReset[0]).toBeCloseTo(resultFresh[0], 10);
    });
  });

  describe("RMSPropOptimizer", () => {
    it("moves weights in the gradient direction", () => {
      const rms = new RMSPropOptimizer(0.01);
      const weights = [3.0];
      const gradients = [2.0];
      const updated = rms.update(weights, gradients);
      expect(updated[0]).toBeLessThan(weights[0]);
    });

    it("adapts step size per parameter", () => {
      const rms = new RMSPropOptimizer(0.01);
      const weights = [1.0, 1.0];
      // One large gradient, one small
      const gradients = [10.0, 0.1];
      const updated = rms.update(weights, gradients);

      // Both should decrease, but the ratio of updates should differ
      // from the ratio of gradients (adaptive scaling)
      const delta0 = weights[0] - updated[0];
      const delta1 = weights[1] - updated[1];
      // The gradient ratio is 100:1, but the update ratio should be smaller
      // because RMSProp divides by sqrt of squared gradient
      expect(delta0 / delta1).toBeLessThan(100);
      expect(delta0).toBeGreaterThan(0);
      expect(delta1).toBeGreaterThan(0);
    });

    it("reset clears cache state", () => {
      const rms = new RMSPropOptimizer(0.01);
      rms.update([1], [5]);
      rms.reset();
      const fresh = new RMSPropOptimizer(0.01);
      const resultReset = rms.update([1], [1]);
      const resultFresh = fresh.update([1], [1]);
      expect(resultReset[0]).toBeCloseTo(resultFresh[0], 10);
    });
  });
});
