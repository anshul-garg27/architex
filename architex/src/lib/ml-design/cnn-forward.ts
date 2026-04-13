// ─────────────────────────────────────────────────────────────
// Architex — ML Design: CNN Forward Pass Simulation
// ─────────────────────────────────────────────────────────────
//
// Educational CNN architecture simulator that computes
// step-by-step layer outputs including dimension changes,
// parameter counts, and operation descriptions for each layer
// in a convolutional neural network.
// ─────────────────────────────────────────────────────────────

// ── Layer type definitions ───────────────────────────────────

export type CNNLayerType = "conv2d" | "maxpool" | "avgpool" | "flatten" | "dense";

export interface Conv2DConfig {
  type: "conv2d";
  filters: number;
  kernelSize: number;
  stride: number;
  padding: number;
}

export interface MaxPoolConfig {
  type: "maxpool";
  poolSize: number;
  stride: number;
}

export interface AvgPoolConfig {
  type: "avgpool";
  poolSize: number;
  stride: number;
}

export interface FlattenConfig {
  type: "flatten";
}

export interface DenseConfig {
  type: "dense";
  units: number;
}

export type CNNLayer =
  | Conv2DConfig
  | MaxPoolConfig
  | AvgPoolConfig
  | FlattenConfig
  | DenseConfig;

// ── Output types ─────────────────────────────────────────────

/** Dimensions of a tensor at a given point in the network. */
export interface TensorDims {
  /** Height (spatial). For a 1D vector after flatten, this is the length. */
  height: number;
  /** Width (spatial). 1 for a 1D vector after flatten/dense. */
  width: number;
  /** Number of channels/depth. 1 for a 1D vector after flatten/dense. */
  channels: number;
}

/** A single step in the forward pass trace. */
export interface ForwardStep {
  /** Index of this layer (0-based). */
  layerIndex: number;
  /** The layer configuration that produced this step. */
  layer: CNNLayer;
  /** Human-readable layer type label. */
  typeLabel: string;
  /** Input dimensions to this layer. */
  inputDims: TensorDims;
  /** Output dimensions from this layer. */
  outputDims: TensorDims;
  /** Number of trainable parameters in this layer. */
  paramCount: number;
  /** Human-readable description of the operation. */
  description: string;
}

/** Complete result of a CNN forward pass simulation. */
export interface CNNForwardResult {
  steps: ForwardStep[];
  totalParams: number;
  inputDims: TensorDims;
  outputDims: TensorDims;
}

// ── Dimension calculation helpers ────────────────────────────

/**
 * Calculate the spatial output dimension for convolution or pooling.
 *
 *   output = floor((input - kernel + 2 * padding) / stride) + 1
 */
export function computeSpatialOutput(
  inputSize: number,
  kernelSize: number,
  stride: number,
  padding: number,
): number {
  return Math.floor((inputSize - kernelSize + 2 * padding) / stride) + 1;
}

// ── Layer type labels ────────────────────────────────────────

const LAYER_TYPE_LABELS: Record<CNNLayerType, string> = {
  conv2d: "Conv2D",
  maxpool: "MaxPool",
  avgpool: "AvgPool",
  flatten: "Flatten",
  dense: "Dense",
};

// ── Forward pass simulation ──────────────────────────────────

/**
 * Simulate a CNN forward pass, computing output dimensions and
 * parameter counts for each layer. No actual tensor data is created;
 * this is a shape-propagation pass for architecture visualization.
 *
 * @param layers    - Ordered array of CNN layer configurations.
 * @param inputSize - Spatial input dimensions (height, width, channels).
 * @returns Step-by-step trace with dimensions and parameter info.
 */
export function simulateCNNForward(
  layers: CNNLayer[],
  inputSize: TensorDims,
): CNNForwardResult {
  const steps: ForwardStep[] = [];
  let current: TensorDims = { ...inputSize };
  let totalParams = 0;
  let isFlattened = false;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const inputDims: TensorDims = { ...current };
    let outputDims: TensorDims;
    let paramCount = 0;
    let description: string;

    switch (layer.type) {
      case "conv2d": {
        if (isFlattened) {
          throw new Error(
            `Layer ${i}: Conv2D cannot follow a Flatten layer`,
          );
        }
        const outH = computeSpatialOutput(
          current.height,
          layer.kernelSize,
          layer.stride,
          layer.padding,
        );
        const outW = computeSpatialOutput(
          current.width,
          layer.kernelSize,
          layer.stride,
          layer.padding,
        );

        if (outH <= 0 || outW <= 0) {
          throw new Error(
            `Layer ${i}: Conv2D output dimensions are non-positive ` +
            `(${outH}x${outW}). Check kernel size, stride, and padding.`,
          );
        }

        // Parameters: (kernelH * kernelW * inputChannels + 1 bias) * filters
        paramCount =
          (layer.kernelSize * layer.kernelSize * current.channels + 1) *
          layer.filters;

        outputDims = { height: outH, width: outW, channels: layer.filters };

        const padStr = layer.padding > 0 ? `, pad=${layer.padding}` : "";
        description =
          `${layer.kernelSize}x${layer.kernelSize} conv, ` +
          `stride=${layer.stride}${padStr}, ` +
          `${current.channels}->${layer.filters} filters: ` +
          `${current.height}x${current.width} -> ${outH}x${outW}`;
        break;
      }

      case "maxpool": {
        if (isFlattened) {
          throw new Error(
            `Layer ${i}: MaxPool cannot follow a Flatten layer`,
          );
        }
        const outH = computeSpatialOutput(
          current.height,
          layer.poolSize,
          layer.stride,
          0,
        );
        const outW = computeSpatialOutput(
          current.width,
          layer.poolSize,
          layer.stride,
          0,
        );

        if (outH <= 0 || outW <= 0) {
          throw new Error(
            `Layer ${i}: MaxPool output dimensions are non-positive ` +
            `(${outH}x${outW}). Check pool size and stride.`,
          );
        }

        paramCount = 0; // Pooling has no learnable parameters
        outputDims = { height: outH, width: outW, channels: current.channels };

        description =
          `${layer.poolSize}x${layer.poolSize} max pool, ` +
          `stride=${layer.stride}: ` +
          `${current.height}x${current.width} -> ${outH}x${outW}`;
        break;
      }

      case "avgpool": {
        if (isFlattened) {
          throw new Error(
            `Layer ${i}: AvgPool cannot follow a Flatten layer`,
          );
        }
        const outH = computeSpatialOutput(
          current.height,
          layer.poolSize,
          layer.stride,
          0,
        );
        const outW = computeSpatialOutput(
          current.width,
          layer.poolSize,
          layer.stride,
          0,
        );

        if (outH <= 0 || outW <= 0) {
          throw new Error(
            `Layer ${i}: AvgPool output dimensions are non-positive ` +
            `(${outH}x${outW}). Check pool size and stride.`,
          );
        }

        paramCount = 0;
        outputDims = { height: outH, width: outW, channels: current.channels };

        description =
          `${layer.poolSize}x${layer.poolSize} avg pool, ` +
          `stride=${layer.stride}: ` +
          `${current.height}x${current.width} -> ${outH}x${outW}`;
        break;
      }

      case "flatten": {
        if (isFlattened) {
          throw new Error(
            `Layer ${i}: Flatten layer applied twice in sequence`,
          );
        }
        const flatSize = current.height * current.width * current.channels;
        paramCount = 0;
        outputDims = { height: flatSize, width: 1, channels: 1 };
        isFlattened = true;

        description =
          `Flatten ${current.height}x${current.width}x${current.channels} ` +
          `-> ${flatSize}-d vector`;
        break;
      }

      case "dense": {
        if (!isFlattened) {
          throw new Error(
            `Layer ${i}: Dense layer requires a preceding Flatten layer`,
          );
        }
        const inputUnits = current.height; // After flatten, height holds the vector length
        paramCount = (inputUnits + 1) * layer.units; // weights + biases

        outputDims = { height: layer.units, width: 1, channels: 1 };

        description =
          `Fully connected: ${inputUnits} -> ${layer.units} units ` +
          `(${inputUnits * layer.units} weights + ${layer.units} biases)`;
        break;
      }
    }

    totalParams += paramCount;

    steps.push({
      layerIndex: i,
      layer,
      typeLabel: LAYER_TYPE_LABELS[layer.type],
      inputDims,
      outputDims,
      paramCount,
      description,
    });

    current = outputDims;
  }

  return {
    steps,
    totalParams,
    inputDims: { ...inputSize },
    outputDims: { ...current },
  };
}

// ── Preset architectures ─────────────────────────────────────

/** Classic LeNet-5 style architecture for 28x28 grayscale input. */
export const PRESET_LENET: CNNLayer[] = [
  { type: "conv2d", filters: 6, kernelSize: 5, stride: 1, padding: 0 },
  { type: "avgpool", poolSize: 2, stride: 2 },
  { type: "conv2d", filters: 16, kernelSize: 5, stride: 1, padding: 0 },
  { type: "avgpool", poolSize: 2, stride: 2 },
  { type: "flatten" },
  { type: "dense", units: 120 },
  { type: "dense", units: 84 },
  { type: "dense", units: 10 },
];

/** Small VGG-style architecture for 32x32 RGB input. */
export const PRESET_SMALL_VGG: CNNLayer[] = [
  { type: "conv2d", filters: 32, kernelSize: 3, stride: 1, padding: 1 },
  { type: "conv2d", filters: 32, kernelSize: 3, stride: 1, padding: 1 },
  { type: "maxpool", poolSize: 2, stride: 2 },
  { type: "conv2d", filters: 64, kernelSize: 3, stride: 1, padding: 1 },
  { type: "conv2d", filters: 64, kernelSize: 3, stride: 1, padding: 1 },
  { type: "maxpool", poolSize: 2, stride: 2 },
  { type: "flatten" },
  { type: "dense", units: 256 },
  { type: "dense", units: 10 },
];

/** Tiny 3-layer network for quick demonstrations. */
export const PRESET_TINY: CNNLayer[] = [
  { type: "conv2d", filters: 8, kernelSize: 3, stride: 1, padding: 1 },
  { type: "maxpool", poolSize: 2, stride: 2 },
  { type: "flatten" },
  { type: "dense", units: 10 },
];
