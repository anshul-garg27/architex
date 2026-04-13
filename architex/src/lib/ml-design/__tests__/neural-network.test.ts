import { describe, it, expect } from "vitest";
import {
  NeuralNetwork,
  type DatasetSample,
} from "@/lib/ml-design/neural-network";
import { SGDOptimizer, AdamOptimizer } from "@/lib/ml-design/optimizers";
import { computeDecisionBoundary } from "@/lib/ml-design/decision-boundary";

// ── NeuralNetwork ────────────────────────────────────────────

describe("NeuralNetwork", () => {
  describe("constructor", () => {
    it("throws if fewer than 2 layer sizes are given", () => {
      expect(() => new NeuralNetwork([3])).toThrow(
        "Need at least input and output layer sizes",
      );
    });

    it("creates a network with correct layer count", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      expect(nn.getLayerSizes()).toEqual([2, 4, 1]);
    });

    it("reports correct parameter count for [2, 4, 1]", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      // Layer 1: 2*4 weights + 4 biases = 12
      // Layer 2: 4*1 weights + 1 bias = 5
      expect(nn.paramCount()).toBe(17);
    });

    it("reports correct parameter count for [2, 8, 8, 1]", () => {
      const nn = new NeuralNetwork([2, 8, 8, 1]);
      // Layer 1: 2*8+8 = 24
      // Layer 2: 8*8+8 = 72
      // Layer 3: 8*1+1 = 9
      expect(nn.paramCount()).toBe(105);
    });
  });

  describe("forward", () => {
    it("produces output of correct shape for [2, 4, 1]", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      const output = nn.forward([0.5, -0.3]);
      expect(output).toHaveLength(1);
    });

    it("produces output of correct shape for [3, 8, 4, 2]", () => {
      const nn = new NeuralNetwork([3, 8, 4, 2]);
      const output = nn.forward([1, 2, 3]);
      expect(output).toHaveLength(2);
    });

    it("output values are finite numbers", () => {
      const nn = new NeuralNetwork([2, 8, 4, 1]);
      const output = nn.forward([100, -100]);
      for (const v of output) {
        expect(Number.isFinite(v)).toBe(true);
      }
    });

    it("output is in [0, 1] range (sigmoid output layer)", () => {
      const nn = new NeuralNetwork([2, 4, 1], "relu");
      // Run many random inputs
      for (let i = 0; i < 20; i++) {
        const output = nn.forward([Math.random() * 4 - 2, Math.random() * 4 - 2]);
        expect(output[0]).toBeGreaterThanOrEqual(0);
        expect(output[0]).toBeLessThanOrEqual(1);
      }
    });

    it("different inputs produce different outputs", () => {
      const nn = new NeuralNetwork([2, 8, 1]);
      const out1 = nn.forward([0, 0]);
      const out2 = nn.forward([1, 1]);
      // Very unlikely to be exactly equal with random weights
      expect(out1[0]).not.toBeCloseTo(out2[0], 10);
    });
  });

  describe("backward", () => {
    it("returns gradients with correct shapes for [2, 4, 1]", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      nn.forward([0.5, 0.3]);
      const { weightGrads, biasGrads } = nn.backward([1], "mse");

      // 2 layers
      expect(weightGrads).toHaveLength(2);
      expect(biasGrads).toHaveLength(2);

      // Layer 1: weights [2][4], biases [4]
      expect(weightGrads[0]).toHaveLength(2);
      expect(weightGrads[0][0]).toHaveLength(4);
      expect(biasGrads[0]).toHaveLength(4);

      // Layer 2: weights [4][1], biases [1]
      expect(weightGrads[1]).toHaveLength(4);
      expect(weightGrads[1][0]).toHaveLength(1);
      expect(biasGrads[1]).toHaveLength(1);
    });

    it("gradients are all finite", () => {
      const nn = new NeuralNetwork([2, 8, 4, 1]);
      nn.forward([0.5, -0.5]);
      const { weightGrads, biasGrads } = nn.backward([1], "binaryCrossEntropy");

      for (const layerGrads of weightGrads) {
        for (const row of layerGrads) {
          for (const v of row) {
            expect(Number.isFinite(v)).toBe(true);
          }
        }
      }
      for (const layerBiasGrads of biasGrads) {
        for (const v of layerBiasGrads) {
          expect(Number.isFinite(v)).toBe(true);
        }
      }
    });
  });

  describe("train", () => {
    it("training reduces loss over epochs (MSE, SGD)", () => {
      const nn = new NeuralNetwork([2, 8, 4, 1], "relu");
      const dataset: DatasetSample[] = [
        { input: [0, 0], target: [0] },
        { input: [1, 0], target: [1] },
        { input: [0, 1], target: [1] },
        { input: [1, 1], target: [0] },
      ];

      const losses: number[] = [];
      nn.train(dataset, {
        epochs: 100,
        learningRate: 0.05,
        optimizer: new SGDOptimizer(0.05, 0.9),
        lossFunction: "mse",
        onEpoch: (metrics) => {
          losses.push(metrics.loss);
        },
      });

      expect(losses).toHaveLength(100);
      // Loss should generally decrease (compare first 5 avg to last 5 avg)
      const earlyAvg = losses.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const lateAvg = losses.slice(-5).reduce((a, b) => a + b, 0) / 5;
      expect(lateAvg).toBeLessThan(earlyAvg);
    });

    it("training reduces loss over epochs (BCE, Adam)", () => {
      const nn = new NeuralNetwork([2, 8, 1], "tanh");
      const dataset: DatasetSample[] = [
        { input: [0.5, 0.5], target: [1] },
        { input: [-0.5, -0.5], target: [0] },
        { input: [0.5, -0.5], target: [1] },
        { input: [-0.5, 0.5], target: [0] },
      ];

      const losses: number[] = [];
      nn.train(dataset, {
        epochs: 80,
        learningRate: 0.01,
        optimizer: new AdamOptimizer(0.01),
        lossFunction: "binaryCrossEntropy",
        onEpoch: (metrics) => {
          losses.push(metrics.loss);
        },
      });

      const earlyAvg = losses.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const lateAvg = losses.slice(-5).reduce((a, b) => a + b, 0) / 5;
      expect(lateAvg).toBeLessThan(earlyAvg);
    });

    it("reports accuracy for binary classification", () => {
      const nn = new NeuralNetwork([2, 4, 1], "sigmoid");
      const dataset: DatasetSample[] = [
        { input: [1, 0], target: [1] },
        { input: [0, 1], target: [0] },
      ];

      let finalAccuracy = 0;
      nn.train(dataset, {
        epochs: 200,
        learningRate: 0.05,
        optimizer: new SGDOptimizer(0.05),
        lossFunction: "mse",
        onEpoch: (metrics) => {
          finalAccuracy = metrics.accuracy;
        },
      });

      // After 200 epochs on a simple dataset, accuracy should be decent
      expect(finalAccuracy).toBeGreaterThanOrEqual(0.5);
    });

    it("handles empty dataset gracefully", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      const losses: number[] = [];
      nn.train([], {
        epochs: 5,
        learningRate: 0.01,
        optimizer: new SGDOptimizer(0.01),
        lossFunction: "mse",
        onEpoch: (metrics) => {
          losses.push(metrics.loss);
        },
      });

      expect(losses).toHaveLength(5);
      for (const loss of losses) {
        expect(loss).toBe(0);
      }
    });
  });

  describe("predict", () => {
    it("predict returns the same as forward", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      const input = [0.5, 0.3];
      const fwd = nn.forward(input);
      const pred = nn.predict(input);
      expect(pred).toEqual(fwd);
    });
  });

  describe("getWeights / setWeights", () => {
    it("round-trips weights without change", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      const original = nn.getWeights();
      const input = [0.5, 0.3];
      const outputBefore = nn.forward(input);

      // Modify weights by training
      nn.train(
        [{ input: [0.5, 0.3], target: [1] }],
        {
          epochs: 10,
          learningRate: 0.1,
          optimizer: new SGDOptimizer(0.1),
          lossFunction: "mse",
        },
      );

      // Restore original weights
      nn.setWeights(original);
      const outputAfter = nn.forward(input);

      expect(outputAfter[0]).toBeCloseTo(outputBefore[0], 10);
    });

    it("setWeights throws on mismatched layer count", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      expect(() =>
        nn.setWeights({
          layers: [
            { weights: [[1, 2]], biases: [0] },
          ],
        }),
      ).toThrow("Weight layer count mismatch");
    });

    it("setWeights throws on mismatched weight dimensions", () => {
      const nn = new NeuralNetwork([2, 4, 1]);
      const bad = nn.getWeights();
      bad.layers[0].weights = [[1]]; // Wrong dimensions
      expect(() => nn.setWeights(bad)).toThrow("Weight row count mismatch");
    });
  });

  describe("activation variants", () => {
    const activations: Array<"relu" | "sigmoid" | "tanh" | "leakyRelu"> = [
      "relu",
      "sigmoid",
      "tanh",
      "leakyRelu",
    ];

    for (const act of activations) {
      it(`works with ${act} activation`, () => {
        const nn = new NeuralNetwork([2, 4, 1], act);
        const output = nn.forward([0.5, -0.5]);
        expect(output).toHaveLength(1);
        expect(Number.isFinite(output[0])).toBe(true);
        expect(output[0]).toBeGreaterThanOrEqual(0);
        expect(output[0]).toBeLessThanOrEqual(1);
      });
    }
  });
});

// ── Decision Boundary ────────────────────────────────────────

describe("computeDecisionBoundary", () => {
  it("returns grid of correct resolution", () => {
    const nn = new NeuralNetwork([2, 4, 1]);
    const result = computeDecisionBoundary(
      nn,
      { minX: -1, maxX: 1, minY: -1, maxY: 1 },
      20,
    );

    expect(result.grid).toHaveLength(20);
    for (const row of result.grid) {
      expect(row).toHaveLength(20);
    }
    expect(result.resolution).toBe(20);
  });

  it("grid values are in [0, 1] range", () => {
    const nn = new NeuralNetwork([2, 4, 1]);
    const result = computeDecisionBoundary(
      nn,
      { minX: -2, maxX: 2, minY: -2, maxY: 2 },
      10,
    );

    for (const row of result.grid) {
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("preserves bounds in result", () => {
    const nn = new NeuralNetwork([2, 4, 1]);
    const bounds = { minX: -3, maxX: 3, minY: -2, maxY: 2 };
    const result = computeDecisionBoundary(nn, bounds, 5);

    expect(result.bounds).toEqual(bounds);
  });

  it("uses default resolution of 50", () => {
    const nn = new NeuralNetwork([2, 4, 1]);
    const result = computeDecisionBoundary(nn, {
      minX: -1,
      maxX: 1,
      minY: -1,
      maxY: 1,
    });

    expect(result.resolution).toBe(50);
    expect(result.grid).toHaveLength(50);
    expect(result.grid[0]).toHaveLength(50);
  });
});
