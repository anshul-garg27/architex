import { describe, it, expect } from "vitest";
import {
  computeSpatialOutput,
  simulateCNNForward,
  PRESET_LENET,
  PRESET_SMALL_VGG,
  PRESET_TINY,
  type CNNLayer,
  type TensorDims,
} from "@/lib/ml-design/cnn-forward";

// ── computeSpatialOutput ─────────────────────────────────────

describe("computeSpatialOutput", () => {
  it("computes output for 3x3 kernel, stride 1, no padding on 5x5", () => {
    // (5 - 3 + 0) / 1 + 1 = 3
    expect(computeSpatialOutput(5, 3, 1, 0)).toBe(3);
  });

  it("computes output for 3x3 kernel, stride 1, padding 1 on 5x5", () => {
    // (5 - 3 + 2) / 1 + 1 = 5 (same padding)
    expect(computeSpatialOutput(5, 3, 1, 1)).toBe(5);
  });

  it("computes output for 5x5 kernel, stride 1, no padding on 28x28", () => {
    // (28 - 5 + 0) / 1 + 1 = 24
    expect(computeSpatialOutput(28, 5, 1, 0)).toBe(24);
  });

  it("computes output for stride 2 pooling on 24x24", () => {
    // (24 - 2 + 0) / 2 + 1 = 12
    expect(computeSpatialOutput(24, 2, 2, 0)).toBe(12);
  });

  it("computes output for 3x3 kernel, stride 2, padding 1 on 32x32", () => {
    // (32 - 3 + 2) / 2 + 1 = 16
    expect(computeSpatialOutput(32, 3, 2, 1)).toBe(16);
  });

  it("computes output for 7x7 kernel, stride 2, padding 3 on 224x224", () => {
    // (224 - 7 + 6) / 2 + 1 = 112
    expect(computeSpatialOutput(224, 7, 2, 3)).toBe(112);
  });

  it("returns 1 when input equals kernel size", () => {
    // (3 - 3 + 0) / 1 + 1 = 1
    expect(computeSpatialOutput(3, 3, 1, 0)).toBe(1);
  });

  it("handles large stride that reduces output to 1", () => {
    // (10 - 3 + 0) / 10 + 1 = floor(7/10) + 1 = 1
    expect(computeSpatialOutput(10, 3, 10, 0)).toBe(1);
  });

  it("floors fractional results", () => {
    // (7 - 3 + 0) / 2 + 1 = 3 (floor(4/2) + 1)
    expect(computeSpatialOutput(7, 3, 2, 0)).toBe(3);
    // (6 - 3 + 0) / 2 + 1 = 2 (floor(3/2) + 1)
    expect(computeSpatialOutput(6, 3, 2, 0)).toBe(2);
  });
});

// ── simulateCNNForward: basic Conv2D ─────────────────────────

describe("simulateCNNForward — Conv2D", () => {
  it("computes correct output dimensions for a single conv layer", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 16, kernelSize: 3, stride: 1, padding: 0 },
    ];
    const input: TensorDims = { height: 28, width: 28, channels: 1 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].outputDims).toEqual({
      height: 26,
      width: 26,
      channels: 16,
    });
  });

  it("counts parameters correctly for Conv2D", () => {
    // (3 * 3 * 1 + 1) * 16 = 160
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 16, kernelSize: 3, stride: 1, padding: 0 },
    ];
    const input: TensorDims = { height: 28, width: 28, channels: 1 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].paramCount).toBe(160);
    expect(result.totalParams).toBe(160);
  });

  it("handles same-padding correctly", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 32, kernelSize: 3, stride: 1, padding: 1 },
    ];
    const input: TensorDims = { height: 32, width: 32, channels: 3 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].outputDims).toEqual({
      height: 32,
      width: 32,
      channels: 32,
    });
    // (3 * 3 * 3 + 1) * 32 = 896
    expect(result.steps[0].paramCount).toBe(896);
  });

  it("handles stride > 1 correctly", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 64, kernelSize: 3, stride: 2, padding: 1 },
    ];
    const input: TensorDims = { height: 32, width: 32, channels: 3 };
    const result = simulateCNNForward(layers, input);

    // (32 - 3 + 2) / 2 + 1 = 16
    expect(result.steps[0].outputDims).toEqual({
      height: 16,
      width: 16,
      channels: 64,
    });
  });
});

// ── simulateCNNForward: Pooling ──────────────────────────────

describe("simulateCNNForward — Pooling", () => {
  it("MaxPool halves dimensions with 2x2 pool, stride 2", () => {
    const layers: CNNLayer[] = [
      { type: "maxpool", poolSize: 2, stride: 2 },
    ];
    const input: TensorDims = { height: 24, width: 24, channels: 16 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].outputDims).toEqual({
      height: 12,
      width: 12,
      channels: 16,
    });
    expect(result.steps[0].paramCount).toBe(0);
  });

  it("AvgPool reduces dimensions correctly", () => {
    const layers: CNNLayer[] = [
      { type: "avgpool", poolSize: 2, stride: 2 },
    ];
    const input: TensorDims = { height: 10, width: 10, channels: 8 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].outputDims).toEqual({
      height: 5,
      width: 5,
      channels: 8,
    });
    expect(result.steps[0].paramCount).toBe(0);
  });

  it("pooling preserves channel count", () => {
    const layers: CNNLayer[] = [
      { type: "maxpool", poolSize: 3, stride: 2 },
    ];
    const input: TensorDims = { height: 15, width: 15, channels: 64 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].outputDims.channels).toBe(64);
  });
});

// ── simulateCNNForward: Flatten ──────────────────────────────

describe("simulateCNNForward — Flatten", () => {
  it("flattens HxWxC to a 1D vector", () => {
    const layers: CNNLayer[] = [{ type: "flatten" }];
    const input: TensorDims = { height: 4, width: 4, channels: 16 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[0].outputDims).toEqual({
      height: 256, // 4 * 4 * 16
      width: 1,
      channels: 1,
    });
    expect(result.steps[0].paramCount).toBe(0);
  });
});

// ── simulateCNNForward: Dense ────────────────────────────────

describe("simulateCNNForward — Dense", () => {
  it("computes correct output and params for Dense layer", () => {
    const layers: CNNLayer[] = [
      { type: "flatten" },
      { type: "dense", units: 128 },
    ];
    const input: TensorDims = { height: 4, width: 4, channels: 16 };
    const result = simulateCNNForward(layers, input);

    const denseStep = result.steps[1];
    expect(denseStep.outputDims).toEqual({
      height: 128,
      width: 1,
      channels: 1,
    });
    // (256 + 1) * 128 = 32896
    expect(denseStep.paramCount).toBe(257 * 128);
  });

  it("chains multiple Dense layers correctly", () => {
    const layers: CNNLayer[] = [
      { type: "flatten" },
      { type: "dense", units: 120 },
      { type: "dense", units: 84 },
      { type: "dense", units: 10 },
    ];
    const input: TensorDims = { height: 4, width: 4, channels: 16 };
    const result = simulateCNNForward(layers, input);

    expect(result.steps[1].outputDims.height).toBe(120);
    expect(result.steps[2].outputDims.height).toBe(84);
    expect(result.steps[3].outputDims.height).toBe(10);

    // Dense 1: (256 + 1) * 120 = 30840
    expect(result.steps[1].paramCount).toBe(30840);
    // Dense 2: (120 + 1) * 84 = 10164
    expect(result.steps[2].paramCount).toBe(10164);
    // Dense 3: (84 + 1) * 10 = 850
    expect(result.steps[3].paramCount).toBe(850);
  });
});

// ── simulateCNNForward: Full architectures ───────────────────

describe("simulateCNNForward — Preset architectures", () => {
  it("LeNet-5 on 28x28x1 runs without error", () => {
    const result = simulateCNNForward(PRESET_LENET, {
      height: 28,
      width: 28,
      channels: 1,
    });

    expect(result.steps).toHaveLength(8);
    expect(result.outputDims.height).toBe(10); // 10-class output
    expect(result.totalParams).toBeGreaterThan(0);
  });

  it("LeNet-5 produces expected intermediate dimensions", () => {
    const result = simulateCNNForward(PRESET_LENET, {
      height: 28,
      width: 28,
      channels: 1,
    });

    // Conv: 28->24, Pool: 24->12, Conv: 12->8, Pool: 8->4
    expect(result.steps[0].outputDims).toEqual({ height: 24, width: 24, channels: 6 });
    expect(result.steps[1].outputDims).toEqual({ height: 12, width: 12, channels: 6 });
    expect(result.steps[2].outputDims).toEqual({ height: 8, width: 8, channels: 16 });
    expect(result.steps[3].outputDims).toEqual({ height: 4, width: 4, channels: 16 });
    expect(result.steps[4].outputDims).toEqual({ height: 256, width: 1, channels: 1 });
  });

  it("Small VGG on 32x32x3 runs without error", () => {
    const result = simulateCNNForward(PRESET_SMALL_VGG, {
      height: 32,
      width: 32,
      channels: 3,
    });

    expect(result.steps).toHaveLength(9);
    expect(result.outputDims.height).toBe(10);
    expect(result.totalParams).toBeGreaterThan(0);
  });

  it("Tiny CNN on 16x16x1 runs without error", () => {
    const result = simulateCNNForward(PRESET_TINY, {
      height: 16,
      width: 16,
      channels: 1,
    });

    expect(result.steps).toHaveLength(4);
    expect(result.outputDims.height).toBe(10);
  });
});

// ── simulateCNNForward: Error handling ───────────────────────

describe("simulateCNNForward — Error handling", () => {
  it("throws on Conv2D producing non-positive dimensions", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 8, kernelSize: 10, stride: 1, padding: 0 },
    ];
    const input: TensorDims = { height: 5, width: 5, channels: 1 };

    expect(() => simulateCNNForward(layers, input)).toThrow("non-positive");
  });

  it("throws on Dense before Flatten", () => {
    const layers: CNNLayer[] = [
      { type: "dense", units: 64 },
    ];
    const input: TensorDims = { height: 8, width: 8, channels: 3 };

    expect(() => simulateCNNForward(layers, input)).toThrow("Flatten");
  });

  it("throws on Conv2D after Flatten", () => {
    const layers: CNNLayer[] = [
      { type: "flatten" },
      { type: "conv2d", filters: 8, kernelSize: 3, stride: 1, padding: 0 },
    ];
    const input: TensorDims = { height: 4, width: 4, channels: 1 };

    expect(() => simulateCNNForward(layers, input)).toThrow("Flatten");
  });

  it("throws on double Flatten", () => {
    const layers: CNNLayer[] = [
      { type: "flatten" },
      { type: "flatten" },
    ];
    const input: TensorDims = { height: 4, width: 4, channels: 1 };

    expect(() => simulateCNNForward(layers, input)).toThrow("twice");
  });

  it("throws on MaxPool after Flatten", () => {
    const layers: CNNLayer[] = [
      { type: "flatten" },
      { type: "maxpool", poolSize: 2, stride: 2 },
    ];
    const input: TensorDims = { height: 4, width: 4, channels: 1 };

    expect(() => simulateCNNForward(layers, input)).toThrow("Flatten");
  });
});

// ── simulateCNNForward: metadata ─────────────────────────────

describe("simulateCNNForward — metadata", () => {
  it("totalParams sums all layer params", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 8, kernelSize: 3, stride: 1, padding: 1 },
      { type: "maxpool", poolSize: 2, stride: 2 },
      { type: "flatten" },
      { type: "dense", units: 10 },
    ];
    const input: TensorDims = { height: 8, width: 8, channels: 1 };
    const result = simulateCNNForward(layers, input);

    const summedParams = result.steps.reduce((s, step) => s + step.paramCount, 0);
    expect(result.totalParams).toBe(summedParams);
  });

  it("inputDims matches what was provided", () => {
    const input: TensorDims = { height: 28, width: 28, channels: 1 };
    const result = simulateCNNForward(
      [{ type: "conv2d", filters: 4, kernelSize: 3, stride: 1, padding: 0 }],
      input,
    );
    expect(result.inputDims).toEqual(input);
  });

  it("outputDims matches last step output", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 8, kernelSize: 3, stride: 1, padding: 1 },
      { type: "flatten" },
      { type: "dense", units: 5 },
    ];
    const input: TensorDims = { height: 6, width: 6, channels: 1 };
    const result = simulateCNNForward(layers, input);

    expect(result.outputDims).toEqual(result.steps[result.steps.length - 1].outputDims);
  });

  it("each step has correct layerIndex", () => {
    const layers: CNNLayer[] = [
      { type: "conv2d", filters: 8, kernelSize: 3, stride: 1, padding: 0 },
      { type: "maxpool", poolSize: 2, stride: 2 },
      { type: "flatten" },
      { type: "dense", units: 10 },
    ];
    const input: TensorDims = { height: 10, width: 10, channels: 1 };
    const result = simulateCNNForward(layers, input);

    result.steps.forEach((step, i) => {
      expect(step.layerIndex).toBe(i);
    });
  });

  it("each step has a non-empty description", () => {
    const result = simulateCNNForward(PRESET_LENET, {
      height: 28,
      width: 28,
      channels: 1,
    });

    for (const step of result.steps) {
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it("empty layers array returns empty steps with input = output", () => {
    const input: TensorDims = { height: 10, width: 10, channels: 3 };
    const result = simulateCNNForward([], input);

    expect(result.steps).toHaveLength(0);
    expect(result.totalParams).toBe(0);
    expect(result.outputDims).toEqual(input);
  });
});
